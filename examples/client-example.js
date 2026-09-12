// FZ Auth — Client API Example
// This shows how an external application (C++, C#, Python, etc.) talks to FZ Auth.
//
// Usage:
//   1. Create an app in the FZ Auth panel and copy the app_id + secret
//   2. Generate a license key in the panel
//   3. Set the constants below and run: node examples/client-example.js

const BASE = process.env.BASE || 'http://localhost:3001';

// ── Replace these with your real values from the panel ──────────────
const APP_ID     = process.env.APP_ID     || 'YOUR_APP_ID_HERE';
const APP_SECRET = process.env.APP_SECRET || 'YOUR_APP_SECRET_HERE';
const LICENSE_KEY = process.env.LICENSE_KEY || 'YOUR_LICENSE_KEY_HERE';
// ────────────────────────────────────────────────────────────────────

function hwid() {
  const os = require('os');
  return `${os.hostname()}-${os.platform()}-${os.arch()}`;
}

async function api(endpoint, body) {
  const res = await fetch(`${BASE}/api/v1/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, secret: APP_SECRET, ...body }),
  });
  const data = await res.json();
  return { ...data, _status: res.status };
}

async function main() {
  console.log('FZ Auth — Client API Example\n');
  const HWID = hwid();
  console.log(`HWID: ${HWID}\n`);

  // ─── 1. Initialize ───────────────────────────────────────────────
  console.log('1) Initializing app...');
  const init = await api('init', { version: '1.0' });
  if (!init.success) {
    console.error('   FAILED:', init.message);
    console.error('   Make sure APP_ID and APP_SECRET are correct.');
    process.exit(1);
  }
  console.log(`   ✓ ${init.app_name} v${init.version}`);
  console.log(`   Users: ${init.user_count} | Sessions: ${init.active_sessions}\n`);

  // ─── 2. Register (with license key) ──────────────────────────────
  const username = 'testuser_' + Date.now();
  const password = 'SecurePass123!';

  console.log(`2) Registering user "${username}" with license key...`);
  const reg = await api('register', {
    username,
    password,
    license_key: LICENSE_KEY,
    hwid: HWID,
  });
  if (!reg.success) {
    console.error('   FAILED:', reg.message);
    if (reg.message.includes('already')) {
      console.log('   (Key may already be used — trying login instead)\n');
    } else {
      process.exit(1);
    }
  } else {
    console.log(`   ✓ Registered! Token: ${reg.token.slice(0, 12)}...`);
    console.log(`   Expiry: ${reg.expiry}\n`);
  }

  // ─── 3. Login ────────────────────────────────────────────────────
  console.log(`3) Logging in as "${username}"...`);
  const login = await api('login', { username, password, hwid: HWID });
  if (!login.success) {
    console.error('   FAILED:', login.message);
    process.exit(1);
  }
  console.log(`   ✓ Logged in! Token: ${login.token.slice(0, 12)}...`);
  console.log(`   Session expires: ${login.expires_at}\n`);

  // ─── 4. Check Session ────────────────────────────────────────────
  console.log('4) Validating session token...');
  const check = await api('check', { token: login.token });
  if (!check.success) {
    console.error('   FAILED:', check.message);
    process.exit(1);
  }
  console.log(`   ✓ Session valid for: ${check.username}`);
  console.log(`   Expiry: ${check.expiry}\n`);

  // ─── 5. License-only auth (alternative to username/password) ─────
  console.log('5) License-only authentication...');
  const lic = await api('license', { license_key: LICENSE_KEY, hwid: HWID });
  if (!lic.success) {
    console.log(`   ⚠ ${lic.message} (expected if key already used above)\n`);
  } else {
    console.log(`   ✓ License auth OK. Token: ${lic.token.slice(0, 12)}...`);
    console.log(`   Level: ${lic.level} | Expiry: ${lic.expiry}\n`);
  }

  // ─── 6. Fetch variables ──────────────────────────────────────────
  console.log('6) Fetching app variables...');
  const vars = await api('var', {});
  if (!vars.success) {
    console.error('   FAILED:', vars.message); 
  } else {
    const keys = Object.keys(vars.variables || {});
    if (keys.length === 0) {
      console.log('   (no variables set — add them in the panel)\n');
    } else {
      for (const k of keys) {
        console.log(`   ${k} = ${vars.variables[k]}`);
      }
      console.log();
    }
  }

  // ─── 7. Fetch single variable ────────────────────────────────────
  console.log('7) Fetching single variable "version"...');
  const singleVar = await api('var', { key: 'version' });
  if (!singleVar.success) {
    console.log(`   ⚠ ${singleVar.message} (add a "version" variable in the panel)\n`);
  } else {
    console.log(`   ✓ ${singleVar.variable.key} = ${singleVar.variable.value}\n`);
  }

  console.log('═══════════════════════════════════════════');
  console.log(' All API calls completed successfully!');
  console.log('═══════════════════════════════════════════');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
