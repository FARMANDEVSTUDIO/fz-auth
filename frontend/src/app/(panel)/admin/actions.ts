'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { isMasterAdmin } from '@/lib/plans';
import { query } from '@/lib/db';
import { setSetting } from '@/lib/settings';

async function requireAdmin() {
  const owner = await requireOwner();
  if (!isMasterAdmin(owner.email)) throw new Error('Unauthorized');
  return owner;
}

export async function grantPremium(formData: FormData) {
  await requireAdmin();
  const targetId = String(formData.get('owner_id') || '');
  const plan = String(formData.get('plan') || 'pro');
  if (!targetId) return;

  const credits = plan === 'enterprise' ? 10000 : plan === 'pro' ? 1000 : 0;
  await query('UPDATE owners SET credits=$1 WHERE id=$2', [credits, targetId]);
  revalidatePath('/admin');
}

export async function revokePremium(formData: FormData) {
  await requireAdmin();
  const targetId = String(formData.get('owner_id') || '');
  if (!targetId) return;

  await query('UPDATE owners SET credits=0 WHERE id=$1', [targetId]);
  revalidatePath('/admin');
}

export async function deleteOwnerAdmin(formData: FormData) {
  await requireAdmin();
  const targetId = String(formData.get('owner_id') || '');
  if (!targetId) return;

  await query('UPDATE owners SET deleted_at=NOW() WHERE id=$1', [targetId]);
  revalidatePath('/admin');
}

export async function restoreOwnerAdmin(formData: FormData) {
  await requireAdmin();
  const targetId = String(formData.get('owner_id') || '');
  if (!targetId) return;

  await query('UPDATE owners SET deleted_at=NULL WHERE id=$1', [targetId]);
  revalidatePath('/admin');
}

export async function permanentDeleteOwner(formData: FormData) {
  await requireAdmin();
  const targetId = String(formData.get('owner_id') || '');
  if (!targetId) return;

  await query('DELETE FROM apps WHERE owner_id=$1', [targetId]);
  await query('DELETE FROM owners WHERE id=$1', [targetId]);
  revalidatePath('/admin');
}

export async function toggleMaintenance(formData: FormData) {
  await requireAdmin();
  const enabled = formData.get('enabled') === 'true';
  await setSetting('maintenance_mode', enabled ? 'true' : 'false');
  revalidatePath('/admin');
}
