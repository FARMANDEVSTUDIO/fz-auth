import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getOwnerByEmail, Owner } from './owners';

export const requireOwner = cache(async (): Promise<Owner> => {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) redirect('/api/force-signout');
  return owner;
});
