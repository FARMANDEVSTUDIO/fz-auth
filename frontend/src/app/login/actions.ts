'use server';

import { signIn } from '@/auth';
import { registerOwner } from '@/lib/owners';
import { validateEmail } from '@/lib/email-validator';
import { createAndSendOTP, verifyOTP, isEmailVerified, cleanupVerified } from '@/lib/otp';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { checkPasswordStrength } from '@/lib/password-strength';
import { verifyTurnstile } from '@/lib/turnstile';
import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { welcomeEmail } from '@/lib/email-templates';
import { recordLogin } from '@/lib/login-history';
import { sendMail } from '@/lib/mailer';

function getIp() {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export async function loginWithGoogle(formData: FormData) {
  const cfToken = String(formData.get('cf_token') || '');
  const cfOk = await verifyTurnstile(cfToken);
  if (!cfOk) return { error: 'CAPTCHA verification failed. Please complete the verification first.' };
  await signIn('google', { redirectTo: '/dashboard' });
}

export async function loginWithGithub(formData: FormData) {
  const cfToken = String(formData.get('cf_token') || '');
  const cfOk = await verifyTurnstile(cfToken);
  if (!cfOk) return { error: 'CAPTCHA verification failed. Please complete the verification first.' };
  await signIn('github', { redirectTo: '/dashboard' });
}

export async function check2FARequired(email: string): Promise<boolean> {
  const res = await query('SELECT totp_enabled FROM owners WHERE email=$1 AND deleted_at IS NULL LIMIT 1', [email]);
  return !!res.rows[0]?.totp_enabled;
}

export async function loginWithCredentials(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const totpCode = String(formData.get('totp_code') || '').trim();

  const cfToken = String(formData.get('cf_token') || '');

  if (!email || !password) return { error: 'Email and password are required' };

  const cfOk = await verifyTurnstile(cfToken);
  if (!cfOk) return { error: 'CAPTCHA verification failed. Please try again.' };

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return { error: emailCheck.reason! };

  // Rate limit: 5 attempts per 15 min per email + IP
  const ip = getIp();
  const rlKey = `login:${email}:${ip}`;
  const rl = checkRateLimit(rlKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000, lockoutMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return { error: `Too many login attempts. Try again in ${rl.retryAfterSeconds} seconds.` };
  }

  const needs2FA = await check2FARequired(email);
  if (needs2FA && !totpCode) {
    return { needs2FA: true };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      totp_code: totpCode || '',
      redirectTo: '/dashboard',
    });
    resetRateLimit(rlKey);
  } catch (e: any) {
    if (e?.digest?.includes('NEXT_REDIRECT')) {
      // Login succeeded — record it (non-blocking, then re-throw)
      try {
        const ownerRes = await query('SELECT id FROM owners WHERE email=$1 AND deleted_at IS NULL LIMIT 1', [email]);
        const ownerId = ownerRes.rows[0]?.id;
        if (ownerId) {
          const ua = headers().get('user-agent') || 'Unknown';
          recordLogin(ownerId, ip, ua).catch(() => {});
        }
      } catch {
        // Don't block redirect
      }
      throw e;
    }
    if (needs2FA && totpCode) {
      return { error: 'Invalid 2FA code or credentials.' };
    }
    return { error: `Invalid email or password. ${rl.remaining} attempts remaining.` };
  }
}

export async function sendVerificationCode(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();

  if (!email) return { ok: false, message: 'Email is required' };

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return { ok: false, message: emailCheck.reason! };

  // Rate limit OTP sends per IP
  const ip = getIp();
  const rl = checkRateLimit(`otp:${ip}`, { maxAttempts: 10, windowMs: 60 * 60 * 1000, lockoutMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return { ok: false, message: `Too many requests. Try again in ${rl.retryAfterSeconds} seconds.` };
  }

  return await createAndSendOTP(email);
}

export async function verifyCode(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const code = String(formData.get('code') || '').trim();

  if (!email || !code) return { ok: false, message: 'Email and code are required' };

  // Rate limit verification attempts
  const ip = getIp();
  const rl = checkRateLimit(`verify:${email}:${ip}`, { maxAttempts: 5, windowMs: 10 * 60 * 1000, lockoutMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return { ok: false, message: `Too many attempts. Try again in ${rl.retryAfterSeconds} seconds.` };
  }

  return await verifyOTP(email, code);
}

export async function registerAccount(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');
  const name = String(formData.get('name') || '').trim();

  const cfToken = String(formData.get('cf_token') || '');

  if (!email || !password) return { error: 'Email and password are required' };
  if (password !== confirm) return { error: 'Passwords do not match' };

  const cfOk = await verifyTurnstile(cfToken);
  if (!cfOk) return { error: 'CAPTCHA verification failed. Please try again.' };

  // Strong password check
  const pwCheck = checkPasswordStrength(password);
  if (!pwCheck.valid) return { error: pwCheck.errors[0] };

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) return { error: emailCheck.reason! };

  // Verify that OTP was completed
  const verified = await isEmailVerified(email);
  if (!verified) return { error: 'Please verify your email first' };

  // Rate limit registrations per IP
  const ip = getIp();
  const rl = checkRateLimit(`register:${ip}`, { maxAttempts: 3, windowMs: 60 * 60 * 1000, lockoutMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return { error: `Too many registration attempts. Try again in ${rl.retryAfterSeconds} seconds.` };
  }

  const owner = await registerOwner(email, password, name || undefined);
  if (!owner) return { error: 'An account with this email already exists' };

  // Handle referral
  const refCode = String(formData.get('ref') || '').trim();
  if (refCode) {
    const referrer = await query('SELECT id FROM owners WHERE referral_code=$1 AND deleted_at IS NULL LIMIT 1', [refCode]);
    if (referrer.rows.length > 0 && referrer.rows[0].id !== owner.id) {
      await query('UPDATE owners SET referred_by=$1 WHERE id=$2', [referrer.rows[0].id, owner.id]);
      await query('UPDATE owners SET referral_count = referral_count + 1 WHERE id=$1', [referrer.rows[0].id]);
    }
  }

  await cleanupVerified(email);

  // Send welcome email (non-blocking)
  try {
    const template = welcomeEmail(name || email.split('@')[0]);
    sendMail({ to: email, subject: template.subject, html: template.html })
      .catch((err: unknown) => console.error('Failed to send welcome email:', err));
  } catch {
    // Don't block registration if welcome email fails
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
    resetRateLimit(`register:${ip}`);
  } catch (e: any) {
    if (e?.digest?.includes('NEXT_REDIRECT')) throw e;
    return { error: 'Account created but login failed. Try signing in.' };
  }
}
