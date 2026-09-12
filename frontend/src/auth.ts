import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { upsertOwner, verifyOwner, getOwnerByEmail } from '@/lib/owners';
import { validateEmail } from '@/lib/email-validator';
import { verifyTotp } from '@/lib/totp';
import { recordLogin } from '@/lib/login-history';
import { headers } from 'next/headers';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      checks: ['state'],
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      checks: ['state'],
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp_code: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const totpCode = credentials?.totp_code as string | undefined;
        if (!email || !password) return null;

        const owner = await verifyOwner(email, password);
        if (!owner) return null;

        if (owner.totp_enabled && owner.totp_secret) {
          if (!totpCode) return null;
          if (!verifyTotp(owner.totp_secret, totpCode)) return null;
        }

        return {
          id: owner.id,
          email: owner.email,
          name: owner.name,
          image: owner.avatar_url,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 2 * 60 * 60,
  },
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;
      if (account?.provider === 'credentials') {
        const emailCheck = validateEmail(user.email);
        if (!emailCheck.valid) return false;
        return true;
      }
      try {
        await upsertOwner({
          provider: account?.provider || 'google',
          providerId: account?.providerAccountId || '',
          email: user.email,
          name: user.name,
          avatarUrl: user.image,
        });

        // Record OAuth login with real IP/UA (non-blocking)
        try {
          const owner = await getOwnerByEmail(user.email);
          if (owner) {
            const h = headers();
            const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || '127.0.0.1';
            const ua = h.get('user-agent') || 'Unknown';
            recordLogin(owner.id, ip, ua).catch(() => {});
          }
        } catch {
          // Don't block sign-in
        }

        return true;
      } catch (e) {
        console.error('Owner upsert failed:', e);
        return false;
      }
    },
  },
});
