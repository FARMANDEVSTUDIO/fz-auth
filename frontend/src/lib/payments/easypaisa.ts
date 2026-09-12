import crypto from 'crypto';
import { query } from '../db';
import { PAYMENT_PLANS, type PaymentPlan, type PaymentResult } from './config';

const STORE_ID = process.env.EASYPAISA_STORE_ID || '';
const HASH_KEY = process.env.EASYPAISA_HASH_KEY || '';
const IS_SANDBOX = process.env.EASYPAISA_SANDBOX === 'true';

const CHECKOUT_URL = IS_SANDBOX
  ? 'https://easypay.easypaisa.com.pk/easypay/Index.jsf'
  : 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';

function generateHash(params: string): string {
  return crypto.createHmac('sha256', HASH_KEY).update(params).digest('hex');
}

function formatExpiry(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}${m}${day} ${h}${min}${s}`;
}

export async function createEasyPaisaPayment(
  ownerId: string,
  ownerEmail: string,
  plan: PaymentPlan,
  origin: string
): Promise<PaymentResult> {
  if (!STORE_ID || !HASH_KEY) {
    return { success: false, error: 'EasyPaisa not configured' };
  }

  const planInfo = PAYMENT_PLANS[plan];
  const amount = planInfo.pkr.toFixed(1);
  const orderRef = 'FZ' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiryDate = formatExpiry();
  const postBackURL = `${origin}/api/payments/easypaisa/callback`;

  const txRes = await query(
    `INSERT INTO payment_transactions (owner_id, provider, plan, amount, currency, status, provider_ref)
     VALUES ($1, 'easypaisa', $2, $3, 'PKR', 'pending', $4) RETURNING id`,
    [ownerId, plan, planInfo.pkr, orderRef]
  );
  const txnId = txRes.rows[0].id;

  const hashString = amount + orderRef + STORE_ID + postBackURL + expiryDate;
  const merchantHashedReq = generateHash(hashString);

  const formFields = {
    storeId: STORE_ID,
    amount,
    postBackURL,
    orderRefNum: orderRef,
    expiryDate,
    merchantHashedReq,
    autoRedirect: '1',
    emailAddr: ownerEmail,
    mobileNum: '',
    bankIdentifier: '',
  };

  const params = new URLSearchParams(formFields);
  const redirectUrl = `${CHECKOUT_URL}?${params.toString()}`;

  return { success: true, redirectUrl, txnId };
}

export async function handleEasyPaisaCallback(params: Record<string, string>): Promise<boolean> {
  const orderRef = params.orderRefNumber || params.orderRefNum;
  const responseCode = params.responseCode;

  if (!orderRef) return false;

  const tx = await query(
    'SELECT id, owner_id, plan, status FROM payment_transactions WHERE provider_ref = $1 AND provider = $2',
    [orderRef, 'easypaisa']
  );
  if (tx.rowCount === 0) return false;
  const row = tx.rows[0];
  if (row.status !== 'pending') return false;

  if (responseCode === '0000') {
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
    [JSON.stringify(params), row.id]
  );
  return false;
}
