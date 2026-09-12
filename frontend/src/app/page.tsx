import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import LandingPage from './LandingPage';

export default async function RootPage() {
  const session = await auth();
  if (session?.user?.email) {
    const owner = await getOwnerByEmail(session.user.email);
    if (owner) redirect('/dashboard');
  }
  return <LandingPage />;
}
