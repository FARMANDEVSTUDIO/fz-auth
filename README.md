# FZ Auth — API + Database (Phase 1)

Apna khud ka KeyAuth-jaisa authentication + licensing backend. Ye **Phase 1** hai: database
schema + REST API. Phase 2 me isi ke upar Discord bot (FZ Auth Bot) connect hoga, jo neeche
diye gaye `/admin/*` endpoints ko hi call karega.

Stack: **Node.js + Fastify + PostgreSQL**. Passwords `scrypt` se hash hote hain (Node me
built-in, koi native build nahi chahiye — Windows pe bhi seedha chalega).

---

## 1. Requirements

- **Node.js 18+** (fetch + `--watch` built-in)
- **PostgreSQL** — do options:
  - Local install (Postgres 13+), ya
  - Free cloud DB: [Neon](https://neon.tech) ya [Supabase](https://supabase.com) — sabse fast.
    Bas connection string copy karke `.env` me daal do (SSL ke liye URL me `?sslmode=require` lagana).

---

## 2. Setup

```bash
# 1. dependencies
npm install

# 2. config
cp .env.example .env
#   .env me DATABASE_URL aur MASTER_KEY edit karo

# 3. database tables banao
npm run migrate

# 4. server chalao
npm start          # ya: npm run dev   (auto-reload)
```

Server default: `http://localhost:3000`. Test: `GET /health` → `{"ok":true,"db":"connected"}`.

> **MASTER_KEY** sirf naye apps banane ke liye hai (`/admin/apps`). Isko lamba random rakho aur kabhi share mat karo.

---

## 3. Do secrets samajh lo (important)

Har app ke 2 secrets hote hain:

- **`secret`** → ye tum apne client app (loader/tool) ke andar daloge. Iska kaam: API ke har
  response pe ek `x-signature` (HMAC) aata hai — client isi `secret` se verify karta hai ke
  response asli server se aaya hai, koi fake server / proxy nahi hai.
- **`admin_key`** → ye **private** rehta hai (server-side / Discord bot ke paas). Isse keys banti
  hain, users ban hote hain, stats milti hain.

> ⚠️ Reality check: koi bhi cheez jo client app me jaati hai (jaise `secret`), use ek determined
> reverse-engineer nikaal sakta hai. HMAC signing trivial fake-server/MITM ko rokti hai, par
> bulletproof nahi hai — ye normal trade-off hai har client-side auth ka. Asli protection
> server-side checks (HWID, expiry, ban) se aati hai.

---

## 4. API Endpoints

### Client endpoints (`/api/*`) — tumhara app inhe call karega
Sab POST + JSON. Har response signed hota hai (`x-signature` header).

| Endpoint | Body | Kaam |
|---|---|---|
| `/api/init` | `app_id, version` | App handshake + version check |
| `/api/register` | `app_id, username, password, key, hwid` | Key se naya account banao |
| `/api/login` | `app_id, username, password, hwid` | Login → session token milta hai |
| `/api/license` | `app_id, key, hwid` | Key-only auth (bina account) |
| `/api/check` | `app_id, token, hwid` | Session token valid hai ya nahi |

### Admin endpoints (`/admin/*`) — Phase 2 me Discord bot inhe call karega
`/admin/apps` ke liye header `x-master-key`. Baaki sab ke liye header `x-admin-key` + body me `app_id`.

| Endpoint | Body | Kaam |
|---|---|---|
| `/admin/apps` | `name, owner_discord_id, version` | Naya app banao (master key) |
| `/admin/keys` | `app_id, amount, duration, level, prefix` | License keys generate karo |
| `/admin/users` | `app_id` | Users list (last 100) |
| `/admin/userinfo` | `app_id, username` | Ek user ki detail |
| `/admin/ban` / `/admin/unban` | `app_id, username, reason` | Ban / unban |
| `/admin/resethwid` | `app_id, username` | HWID reset |
| `/admin/addtime` | `app_id, username, duration` | Subscription time badhao |
| `/admin/deluser` | `app_id, username` | User delete |
| `/admin/blacklist` | `app_id, type(hwid\|ip), value, reason` | HWID/IP blacklist |
| `/admin/stats` | `app_id` | App ke numbers |

**Duration format:** `30d`, `12h`, `1y`, `2w`, `60m`, ya `lifetime`.

---

## 5. Quick test

Server chalne ke baad:

```bash
node examples/client-example.js
```

Ye pura flow chalata hai (app banana → keys → register → login → HWID lock → license →
ban/unban → stats) aur signatures verify karta hai. Saath hi ye ek **working client reference**
hai — dekho ke client API se kaise baat karta aur signature kaise check karta hai.

Manual test example (app banana):

```bash
curl -X POST http://localhost:3000/admin/apps \
  -H "content-type: application/json" \
  -H "x-master-key: YOUR_MASTER_KEY" \
  -d '{"name":"MyLoader","version":"1.0"}'
```

Ya **Postman** import karke aaram se test karo.

---

## 6. Project structure

```
fz-auth/
├── schema.sql              # database tables
├── src/
│   ├── server.js           # Fastify app
│   ├── db.js               # PostgreSQL pool
│   ├── migrate.js          # schema.sql apply karta hai
│   ├── routes/
│   │   ├── client.js       # /api/* (app ke liye)
│   │   └── admin.js        # /admin/* (bot/panel ke liye)
│   └── utils/
│       ├── crypto.js       # hashing, key-gen, HMAC signing
│       └── duration.js     # "30d" -> seconds
└── examples/
    └── client-example.js   # full flow test + client reference
```

---

## 7. Aage kya (Phase 2 & 3)

- **Phase 2 — Discord bot:** discord.js bot jo `/admin/*` ko call karega.
  `/createkey`, `/userinfo`, `/ban`, `/resethwid`, `/addtime`, `/stats` slash commands.
- **Phase 3 — Security hardening:** per-IP rate limits, login attempt throttle, refresh tokens,
  argon2 upgrade (optional), request encryption.
- **Phase 4 — Web panel:** owner login + visual dashboard.

---

## 8. Production notes

- `MASTER_KEY` aur har `admin_key` ko kabhi client code me mat daalo.
- Production me `pg` ke liye SSL on rakho (managed DB pe).
- Reverse proxy (nginx/Caddy) ke peeche chalao + HTTPS lagao. (Server `x-forwarded-for` se real IP
  leta hai.)
- Regular DB backups rakho.
