export const PLAN_LIMITS = {
  free:       { maxApps: 1,  maxUsersPerApp: 50,   label: 'Free' },
  pro:        { maxApps: 5,  maxUsersPerApp: 500,  label: 'Pro' },
  enterprise: { maxApps: -1, maxUsersPerApp: -1,   label: 'Enterprise' },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

const MASTER_EMAIL = process.env.MASTER_EMAIL || '';

export function isMasterAdmin(email: string): boolean {
  return !!MASTER_EMAIL && email.toLowerCase() === MASTER_EMAIL.toLowerCase();
}

export const PLAN_PRICES = {
  pro: { credits: 1000, durationDays: 30, label: 'Pro — 1 Month' },
  enterprise: { credits: 10000, durationDays: 30, label: 'Enterprise — 1 Month' },
} as const;

export function getOwnerPlan(owner: { plan_type?: string | null; plan_expires_at?: string | null; email: string }): PlanKey {
  if (isMasterAdmin(owner.email)) return 'enterprise';

  if (owner.plan_type && owner.plan_expires_at) {
    const expiresAt = new Date(owner.plan_expires_at);
    if (expiresAt.getTime() > Date.now()) {
      if (owner.plan_type === 'enterprise') return 'enterprise';
      if (owner.plan_type === 'pro') return 'pro';
    }
  }

  return 'free';
}

export function getPlanExpiry(owner: { plan_expires_at?: string | null }): Date | null {
  if (!owner.plan_expires_at) return null;
  const d = new Date(owner.plan_expires_at);
  return d.getTime() > Date.now() ? d : null;
}

export function canCreateApp(appCount: number, plan: PlanKey): boolean {
  const limit = PLAN_LIMITS[plan].maxApps;
  if (limit === -1) return true;
  return appCount < limit;
}

export const FREE_LOCKED_ROUTES = [
  '/team',
  '/webhooks',
  '/files',
  '/subscriptions',
  '/downloads',
];

export function isRouteLocked(path: string, plan: PlanKey): boolean {
  if (plan !== 'free') return false;
  return FREE_LOCKED_ROUTES.some(r => path === r || path.startsWith(r + '/'));
}
