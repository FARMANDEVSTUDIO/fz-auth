// Server-side bridge to the Fastify API. The browser NEVER sees admin_key
// or MASTER_KEY — these calls only happen in server actions / RSC.
const API_URL = process.env.FZAUTH_API_URL || 'http://localhost:3000';

export async function callAdmin(
  adminKey: string,
  appId: string,
  path: string,
  body: Record<string, unknown> = {}
) {
  const res = await fetch(`${API_URL}/admin/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
    body: JSON.stringify({ app_id: appId, ...body }),
    cache: 'no-store',
  });
  return res.json();
}

export async function createAppViaApi(name: string, ownerId: string) {
  const res = await fetch(`${API_URL}/admin/apps`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-master-key': process.env.MASTER_KEY || '',
    },
    body: JSON.stringify({ name, owner_id: ownerId }),
    cache: 'no-store',
  });
  return res.json();
}
