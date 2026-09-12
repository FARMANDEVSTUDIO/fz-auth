const { API_URL, APP_ID, ADMIN_KEY } = require('./config');

async function callAdmin(path, body = {}) {
  const res = await fetch(`${API_URL}/api/admin/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': ADMIN_KEY,
    },
    body: JSON.stringify({ app_id: APP_ID, ...body }),
  });
  return res.json();
}

module.exports = { callAdmin };
