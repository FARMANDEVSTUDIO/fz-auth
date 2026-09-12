import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import { getNotifications, markAllRead, clearNotifications } from '@/lib/notifications';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await getNotifications(owner.id);
  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();

  if (action === 'read_all') {
    await markAllRead(owner.id);
  } else if (action === 'clear') {
    await clearNotifications(owner.id);
  }

  return NextResponse.json({ ok: true });
}
