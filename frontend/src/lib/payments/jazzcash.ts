import crypto from 'crypto';
import { query } from '../db';
import { PAYMENT_PLANS, type PaymentPlan, type PaymentResult } from './config';

const MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || '';
const PASSWORD = process.env.JAZZCASH_PASSWORD || '';
const SALT = process.env.JAZZCASH_SALT || '';
const IS_SANDBOX = process.env.JAZZCASH_SANDBOX === 'true';

const BASE_URL = IS_SANDBOX
  ? 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/'
  : 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}${m}${day}${h}${min}${s}`;
}

function generateHash(fields: Record<string, string>): string {
  const sortedKeys = Object.keys(fields).sort();
  const dataString = SALT + '&' + sortedKeys.map(k => fields[k]).join('&');
  return crypto.createHmac('sha256', SALT).update(dataString).digest('hex');
}

export async function createJazzCashPayment(
  ownerId: string,
  plan: PaymentPlan,
  origin: string
): Promise<PaymentResult> {
  if (!MERCHANT_ID || !PASSWORD || !SALT) {
    return { success: false, error: 'JazzCash not configured' };
  }

  const planInfo = PAYMENT_PLANS[plan];
  const amount = String(planInfo.pkr * 100); // JazzCash uses paisa
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  const txnRef = 'FZ' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();

  const txRes = await query(
    `INSERT INTO payment_transactions (owner_id, provider, plan, amount, currency, status, provider_ref)
     VALUES ($1, 'jazzcash', $2, $3, 'PKR', 'pending', $4) RETURNING id`,
    [ownerId, plan, planInfo.pkr, txnRef]
  );
  const txnId = txRes.rows[0].id;

  const fields: Record<string, string> = {
    pp_Amount: amount,
    pp_BillReference: `plan_${plan}`,
    pp_Description: `FZ AUTH ${planInfo.name} Plan - 1 Month`,
    pp_Language: 'EN',
    pp_MerchantID: MERCHANT_ID,
    pp_Password: PASSWORD,
    pp_ReturnURL: `${origin}/api/payments/jazzcash/callback`,
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatDate(now),
    pp_TxnExpiryDateTime: formatDate(expiry),
    pp_TxnRefNo: txnRef,
    pp_TxnType: 'MWALLET',
    pp_Version: '1.1',
    ppmpf_1: ownerId,
    ppmpf_2: plan,
    ppmpf_3: txnId,
  };

  fields.pp_SecureHash = generateHash(fields);

  const formParams = new URLSearchParams(fields);
  const redirectUrl = `${BASE_URL}?${formParams.toString()}`;

  return { success: true, redirectUrl, txnId };
}

export async function handleJazzCashCallback(params: Record<string, string>): Promise<boolean> {
  const txnRef = params.pp_TxnRefNo;
  const responseCode = params.pp_ResponseCode;
  const responseMsg = params.pp_ResponseMessage;

  if (!txnRef) return false;

  const tx = await query(
    'SELECT id, owner_id, plan, status FROM payment_transactions WHERE provider_ref = $1 AND provider = $2',
    [txnRef, 'jazzcash']
  );
  if (tx.rowCount === 0) return false;
  const row = tx.rows[0];
  if (row.status !== 'pending') return false;

  const hashFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'pp_SecureHash' && v) hashFields[k] = v;
  }
  const expectedHash = generateHash(hashFields);
  if (params.pp_SecureHash && params.pp_SecureHash !== expectedHash) {
    await query(
      "UPDATE payment_transactions SET status = 'failed', provider_response = $1 WHERE id = $2",
      [JSON.stringify({ error: 'Hash mismatch', responseCode }), row.id]
    );
    return false;
  }

  if (responseCode === '000' || responseCode === '121') {
    await query(
      "UPDATE payment_transactions SET status = 'completed', completed_at = NOW(), provider_response = $1 WHERE id = $2",
      [JSON.stringify(params), row.id]
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

  await query(
    "UPDATE payment_transactions SET status = 'failed', provider_response = $1 WHERE id = $2",
    [JSON.stringify({ responseCode, responseMsg, ...params }), row.id]
  );
  return false;
}
