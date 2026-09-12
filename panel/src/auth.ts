import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { upsertOwner } from '@/lib/owners';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;
      try {
        await upsertOwner({
          provider: account?.provider || 'google',
          providerId: account?.providerAccountId || '',
          email: user.email,
          name: user.name,
          avatarUrl: user.image,
        });
        return true;
      } catch (e) {
        console.error('Owner upsert failed:', e);
        return false;
      }
    },
  },
});
