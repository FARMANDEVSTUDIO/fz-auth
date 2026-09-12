'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { isMasterAdmin } from '@/lib/plans';
import { addIpRule, deleteIpRule } from '@/lib/ip-rules';

async function requireAdmin() {
  const owner = await requireOwner();
  if (!isMasterAdmin(owner.email)) throw new Error('Unauthorized');
  return owner;
}

export async function addIpRuleAction(formData: FormData) {
  await requireAdmin();

  const type = String(formData.get('type') || '') as 'allow' | 'block';
  const value = String(formData.get('value') || '').trim();
  const reason = String(formData.get('reason') || '').trim();
  const expiresIn = String(formData.get('expires_in') || '').trim();

  if (!value) return;
  if (type !== 'allow' && type !== 'block') return;

  // Validate IP or CIDR format
  const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  if (!cidrPattern.test(value)) return;

  let expiresAt: Date | undefined;
  if (expiresIn) {
    const hours = parseInt(expiresIn, 10);
    if (!isNaN(hours) && hours > 0) {
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }
  }

  await addIpRule(type, value, reason || undefined, expiresAt);
  revalidatePath('/admin/ip-rules');
}

export async function deleteIpRuleAction(formData: FormData) {
  await requireAdmin();

  const id = parseInt(String(formData.get('rule_id') || ''), 10);
  if (isNaN(id)) return;

  await deleteIpRule(id);
  revalidatePath('/admin/ip-rules');
}
