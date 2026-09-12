'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { isMasterAdmin } from '@/lib/plans';
import { getSetting, setSetting } from '@/lib/settings';

async function requireAdmin() {
  const owner = await requireOwner();
  if (!isMasterAdmin(owner.email)) throw new Error('Unauthorized');
  return owner;
}

export async function runCleanup(dryRun: boolean) {
  await requireAdmin();

  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const url = `${baseUrl}/api/cron/cleanup${dryRun ? '?dry_run=true' : ''}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET || 'fz-cron-secret'}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return { success: false, error: 'Cleanup request failed' };
  }

  const data = await res.json();
  revalidatePath('/admin/cleanup');
  return data;
}

export async function toggleAutoCleanup(enabled: boolean, intervalHours: number) {
  await requireAdmin();

  await setSetting('auto_cleanup_enabled', enabled ? 'true' : 'false');
  await setSetting('auto_cleanup_interval_hours', String(intervalHours));

  revalidatePath('/admin/cleanup');
}

export async function getAutoCleanupSettings() {
  const enabled = await getSetting('auto_cleanup_enabled');
  const interval = await getSetting('auto_cleanup_interval_hours');

  return {
    enabled: enabled === 'true',
    intervalHours: parseInt(interval || '24') || 24,
  };
}
