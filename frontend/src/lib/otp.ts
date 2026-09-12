import { query } from './db';
import { sendMail } from './mailer';

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

export async function ensureOtpTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_otps_email ON email_otps (email)`);
}

function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}


async function sendEmail(to: string, code: string) {
  const digits = code.split('').map(d => `
    <td style="width: 44px; height: 56px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 10px; text-align: center; vertical-align: middle; margin: 0 3px;">
      <span style="color: #a855f7; font-size: 28px; font-weight: 800; font-family: 'SF Mono', Monaco, monospace;">${d}</span>
    </td>
  `).join('<td style="width: 6px;"></td>');

  await sendMail({
    to,
    subject: `${code} is your FZ AUTH verification code`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #050510; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 16px;">
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7, #d946ef); padding: 2px; border-radius: 16px;">
      <div style="background: #0a0a12; border-radius: 14px; padding: 40px 30px; text-align: center;">
        <div style="height: 4px; background: linear-gradient(90deg, #7c3aed, #a855f7, #d946ef, #a855f7, #7c3aed); border-radius: 14px 14px 0 0; margin: -40px -30px 30px;"></div>

        <!-- FZ AUTH Logo -->
        <div style="margin: 0 auto 24px; width: 72px; height: 72px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 72px; height: 72px; border-collapse: collapse;">
            <tr><td style="width: 72px; height: 72px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%); border-radius: 20px; text-align: center; vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 66px; height: 66px; margin: 3px; border-collapse: collapse;">
                <tr><td style="width: 66px; height: 66px; background: #0a0a12; border-radius: 17px; text-align: center; vertical-align: middle;">
                  <span style="font-size: 15px; font-weight: 900; color: #a855f7; letter-spacing: 1px;">FZ</span><br/>
                  <span style="font-size: 8px; font-weight: 700; color: #6b7280; letter-spacing: 3px;">AUTH</span>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </div>

        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.5px;">Verification Code</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 28px;">Enter this code to verify your email address</p>

        <!-- OTP Code Boxes -->
        <div style="margin: 0 0 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; border-collapse: separate; border-spacing: 6px 0;">
            <tr>${digits}</tr>
          </table>
        </div>

        <div style="background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 16px; margin: 0 0 24px;">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="color: #6b7280; font-size: 12px; padding: 4px 0;">Expires in</td>
              <td style="color: #a855f7; font-size: 12px; padding: 4px 0; text-align: right; font-weight: 700;">${OTP_EXPIRY_MINUTES} minutes</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 12px; padding: 4px 0; border-top: 1px solid rgba(139,92,246,0.15);">One-time use</td>
              <td style="color: #4ade80; font-size: 12px; padding: 4px 0; text-align: right; font-weight: 700; border-top: 1px solid rgba(139,92,246,0.15);">Yes</td>
            </tr>
          </table>
        </div>

        <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent); margin: 0 0 20px;"></div>
        <p style="color: #374151; font-size: 11px; margin: 0; line-height: 1.6;">If you didn't request this code, please ignore it.<br/>Do not share this code with anyone.</p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <p style="color: #4b5563; font-size: 12px; margin: 0 0 4px; font-weight: 600;">FZ AUTH</p>
      <p style="color: #374151; font-size: 10px; margin: 0;">Secure Authentication &amp; Licensing Platform</p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

export async function createAndSendOTP(email: string): Promise<{ ok: boolean; message: string }> {
  await ensureOtpTable();

  const normalized = email.trim().toLowerCase();

  // Rate limit: max 5 OTPs per email per hour
  const recent = await query(
    `SELECT COUNT(*) as cnt FROM email_otps WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [normalized]
  );
  if (parseInt(recent.rows[0].cnt) >= 5) {
    return { ok: false, message: 'Too many verification attempts. Try again in 1 hour.' };
  }

  // Delete old unverified OTPs for this email
  await query(`DELETE FROM email_otps WHERE email = $1 AND verified = FALSE`, [normalized]);

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await query(
    `INSERT INTO email_otps (email, code, expires_at) VALUES ($1, $2, $3)`,
    [normalized, code, expiresAt]
  );

  try {
    await sendEmail(normalized, code);
    return { ok: true, message: `Verification code sent to ${normalized}` };
  } catch (e) {
    console.error('Failed to send OTP email:', e);
    return { ok: false, message: 'Failed to send verification email. Please try again.' };
  }
}

export async function verifyOTP(email: string, code: string): Promise<{ ok: boolean; message: string }> {
  await ensureOtpTable();

  const normalized = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  const result = await query(
    `SELECT id, code, expires_at FROM email_otps
     WHERE email = $1 AND verified = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [normalized]
  );

  if (result.rows.length === 0) {
    return { ok: false, message: 'No verification code found. Please request a new one.' };
  }

  const row = result.rows[0];

  if (new Date(row.expires_at) < new Date()) {
    await query(`DELETE FROM email_otps WHERE id = $1`, [row.id]);
    return { ok: false, message: 'Code expired. Please request a new one.' };
  }

  if (row.code !== trimmedCode) {
    return { ok: false, message: 'Invalid verification code.' };
  }

  // Mark as verified
  await query(`UPDATE email_otps SET verified = TRUE WHERE id = $1`, [row.id]);

  return { ok: true, message: 'Email verified successfully!' };
}

export async function isEmailVerified(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const result = await query(
    `SELECT id FROM email_otps
     WHERE email = $1 AND verified = TRUE AND expires_at > NOW() - INTERVAL '30 minutes'
     ORDER BY created_at DESC LIMIT 1`,
    [normalized]
  );
  return result.rows.length > 0;
}

export async function cleanupVerified(email: string) {
  const normalized = email.trim().toLowerCase();
  await query(`DELETE FROM email_otps WHERE email = $1`, [normalized]);
}
