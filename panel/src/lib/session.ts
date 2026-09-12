import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getOwnerByEmail, Owner } from './owners';
import { getSelectedApp, type App } from './apps';
import { getMemberRole } from './team';
import { type Permission } from './permissions';

export async function requireOwner(): Promise<Owner> {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) redirect('/login');
  return owner;
}

export interface SessionContext {
  owner: Owner;
  app: App | null;
  role: string;
  permissions: Record<Permission, boolean>;
}

export async function requireMember(): Promise<SessionContext> {
  const owner = await requireOwner();
  const app = await getSelectedApp(owner.id);
  if (!app) return { owner, app: null, role: 'none', permissions: {} as Record<Permission, boolean> };

  const member = await getMemberRole(app.id, owner.id, app.owner_id);
  if (!member) return { owner, app: null, role: 'none', permissions: {} as Record<Permission, boolean> };

  return { owner, app, role: member.role, permissions: member.permissions };
}
