export async function callAdmin(
  apiUrl: string,
  adminKey: string,
  appId: string,
  path: string,
  body: Record<string, unknown> = {}
) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ apiUrl, adminKey, appId, path, body }),
  });
  return res.json();
}
