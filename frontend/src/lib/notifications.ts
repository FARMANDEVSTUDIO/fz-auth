import { query } from './db';

export async function createNotification(ownerId: string, title: string, message: string) {
  await query(
    'INSERT INTO notifications (owner_id, title, message) VALUES ($1, $2, $3)',
    [ownerId, title, message]
  );
}

export async function getUnreadCount(ownerId: string): Promise<number> {
  const res = await query(
    'SELECT COUNT(*)::int AS c FROM notifications WHERE owner_id=$1 AND read=FALSE',
    [ownerId]
  );
  return res.rows[0].c;
}

export async function getNotifications(ownerId: string, limit = 20) {
  const res = await query(
    'SELECT id, title, message, read, created_at FROM notifications WHERE owner_id=$1 ORDER BY created_at DESC LIMIT $2',
    [ownerId, limit]
  );
  return res.rows as Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
}

export async function markAsRead(notifId: string, ownerId: string) {
  await query(
    'UPDATE notifications SET read=TRUE WHERE id=$1 AND owner_id=$2',
    [notifId, ownerId]
  );
}

export async function markAllRead(ownerId: string) {
  await query(
    'UPDATE notifications SET read=TRUE WHERE owner_id=$1 AND read=FALSE',
    [ownerId]
  );
}

export async function clearNotifications(ownerId: string) {
  await query('DELETE FROM notifications WHERE owner_id=$1', [ownerId]);
}
