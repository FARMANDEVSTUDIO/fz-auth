import crypto from 'crypto';
import { query } from '../db';
import { PAYMENT_PLANS, type PaymentPlan, type PaymentResult } from './config';

const API_KEY = process.env.BINANCE_PAY_API_KEY || '';
const SECRET_KEY = process.env.BINANCE_PAY_SECRET_KEY || '';
const API_BASE = 'https://bpay.binanceapi.com';

function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateSignature(timestamp: string, nonce: string, body: string): string {
  const payload = timestamp + '\n' + nonce + '\n' + body + '\n';
  return crypto.createHmac('sha512', SECRET_KEY).update(payload).digest('hex').toUpperCase();
}

export async function createBinancePayment(
  ownerId: string,
  plan: PaymentPlan,
  origin: string
): Promise<PaymentResult> {
  if (!API_KEY || !SECRET_KEY) {
    return { success: false, error: 'Binance Pay not configured' };
  }

  const planInfo = PAYMENT_PLANS[plan];
  const merchantTradeNo = 'FZ' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

  const txRes = await query(
    `INSERT INTO payment_transactions (owner_id, provider, plan, amount, currency, status, provider_ref)
     VALUES ($1, 'binance', $2, $3, 'USDT', 'pending', $4) RETURNING id`,
    [ownerId, plan, planInfo.usd, merchantTradeNo]
  );
  const txnId = txRes.rows[0].id;

  const body = JSON.stringify({
    env: {
      terminalType: 'WEB',
    },
    merchantTradeNo,
    orderAmount: planInfo.usd.toFixed(2),
    currency: 'USDT',
    goods: {
      goodsType: '02',
      goodsCategory: 'Z000',
      referenceGoodsId: plan,
      goodsName: `FZ AUTH ${planInfo.name} Plan`,
      goodsDetail: `${planInfo.name} Plan - 1 Month Access`,
    },
    returnUrl: `${origin}/shop?payment=success`,
    cancelUrl: `${origin}/shop?payment=cancelled`,
    webhookUrl: `${origin}/api/payments/binance/callback`,
    orderExpireTime: Date.now() + 3600000,
    passThroughInfo: JSON.stringify({ owner_id: ownerId, plan, txn_id: txnId }),
  });

  const timestamp = Date.now().toString();
  const nonce = generateNonce();
  const signature = generateSignature(timestamp, nonce, body);

  try {
    const res = await fetch(`${API_BASE}/binancepay/openapi/v2/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': API_KEY,
        'BinancePay-Signature': signature,
      },
      body,
    });

    const data = await res.json();

    if (data.status === 'SUCCESS' && data.data?.checkoutUrl) {
      await query(
        'UPDATE payment_transactions SET provider_response = $1 WHERE id = $2',
        [JSON.stringify({ prepayId: data.data.prepayId }), txnId]
      );
      return { success: true, redirectUrl: data.data.checkoutUrl, txnId };
    }

    await query(
      "UPDATE payment_transactions SET status = 'failed', provider_response = $1 WHERE id = $2",
      [JSON.stringify(data), txnId]
    );
    return { success: false, error: data.errorMessage || 'Binance Pay order creation failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function handleBinanceCallback(body: string, headers: Record<string, string>): Promise<boolean> {
  const timestamp = headers['binancepay-timestamp'] || '';
  const nonce = headers['binancepay-nonce'] || '';
  const signature = headers['binancepay-signature'] || '';

  const expectedSig = generateSignature(timestamp, nonce, body);
  if (signature.toUpperCase() !== expectedSig) {
    return false;
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (payload.bizType !== 'PAY' || payload.bizStatus !== 'PAY_SUCCESS') {
    return false;
  }

  const data = typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data;
  const merchantTradeNo = data?.merchantTradeNo;
  if (!merchantTradeNo) return false;

  const tx = await query(
    'SELECT id, owner_id, plan, status FROM payment_transactions WHERE provider_ref = $1 AND provider = $2',
    [merchantTradeNo, 'binance']
  );
  if (tx.rowCount === 0) return false;
  const row = tx.rows[0];
  if (row.status !== 'pending') return false;

  await query(
    "UPDATE payment_transactions SET status = 'completed', completed_at = NOW(), provider_response = $1 WHERE id = $2",
    [JSON.stringify(payload), row.id]
  );

  await query(
    `UPDATE owners
     SET plan_type = $1,
         plan_expires_at = CASE
           WHEN plan_expires_at IS NOT NULL AND plan_expires_at > NOW()
           THEN plan_expires_at + INTERVAL '30 days'
           ELSE NOW() + INTERVAL '30 days'
         END
     WHERE id = $2`,
    [row.plan, row.owner_id]
  );

  return true;
}
