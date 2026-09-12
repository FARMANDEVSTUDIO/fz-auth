import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import { query } from '@/lib/db';
import { isTurnstileConfigured } from '@/lib/turnstile';
import LoginClient from './LoginClient';
import { loginWithGoogle, loginWithGithub, loginWithCredentials, registerAccount, sendVerificationCode, verifyCode } from './actions';

export default async function LoginPage({ searchParams }: { searchParams: { ref?: string } }) {
  if (searchParams.ref) {
    await query('UPDATE owners SET referral_clicks = referral_clicks + 1 WHERE referral_code=$1 AND deleted_at IS NULL', [searchParams.ref]).catch(() => {});
  }

  const session = await auth();
  if (session?.user?.email) {
    const owner = await getOwnerByEmail(session.user.email);
    if (owner) redirect('/dashboard');
  }

  return (
    <LoginClient
      googleAction={loginWithGoogle}
      githubAction={loginWithGithub}
      loginAction={loginWithCredentials}
      registerAction={registerAccount}
      sendOtpAction={sendVerificationCode}
      verifyOtpAction={verifyCode}
      turnstileRequired={isTurnstileConfigured()}
    />
  );
}
