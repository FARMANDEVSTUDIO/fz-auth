export const ALL_PERMISSIONS = [
  'create_keys',
  'view_keys',
  'view_users',
  'ban_users',
  'reset_hwid',
  'add_time',
  'delete_users',
  'manage_settings',
  'manage_team',
  'view_stats',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, Record<Permission, boolean>> = {
  owner: {
    create_keys: true, view_keys: true, view_users: true, ban_users: true,
    reset_hwid: true, add_time: true, delete_users: true, manage_settings: true,
    manage_team: true, view_stats: true,
  },
  admin: {
    create_keys: true, view_keys: true, view_users: true, ban_users: true,
    reset_hwid: true, add_time: true, delete_users: true, manage_settings: true,
    manage_team: false, view_stats: true,
  },
  reseller: {
    create_keys: true, view_keys: true, view_users: false, ban_users: false,
    reset_hwid: false, add_time: false, delete_users: false, manage_settings: false,
    manage_team: false, view_stats: false,
  },
  staff: {
    create_keys: false, view_keys: false, view_users: true, ban_users: true,
    reset_hwid: true, add_time: true, delete_users: false, manage_settings: false,
    manage_team: false, view_stats: true,
  },
};

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  reseller: 'Reseller',
  staff: 'Staff',
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  create_keys: 'Create Keys',
  view_keys: 'View Keys',
  view_users: 'View Users',
  ban_users: 'Ban / Unban Users',
  reset_hwid: 'Reset HWID',
  add_time: 'Add Time',
  delete_users: 'Delete Users',
  manage_settings: 'Manage Settings',
  manage_team: 'Manage Team',
  view_stats: 'View Stats',
};

export function resolvePermissions(role: string, custom?: Record<string, boolean>): Record<Permission, boolean> {
  const base = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff;
  if (!custom || Object.keys(custom).length === 0) return { ...base };
  return { ...base, ...custom } as Record<Permission, boolean>;
}

export function hasPermission(perms: Record<string, boolean>, perm: Permission): boolean {
  return !!perms[perm];
}
