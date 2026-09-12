-- FZ Auth - Database schema (Phase 1)
-- Run with: npm run migrate   (or psql -f schema.sql)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Panel owners (Google/Discord OAuth login via the web panel).
CREATE TABLE IF NOT EXISTS owners (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     VARCHAR(32) NOT NULL,          -- google | discord
  provider_id  VARCHAR(128) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(128),
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_id)
);

-- Apps registered on the platform.
-- secret    -> shipped inside the client app, used to verify (HMAC) API responses
-- admin_key -> PRIVATE, used by the Discord bot / panel to manage the app
CREATE TABLE IF NOT EXISTS apps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(64) UNIQUE NOT NULL,
  owner_discord_id  VARCHAR(32),
  secret            VARCHAR(128) NOT NULL,
  admin_key         VARCHAR(128) NOT NULL,
  version           VARCHAR(16) DEFAULT '1.0',
  status            VARCHAR(16) DEFAULT 'active',   -- active | paused
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- End users of each app (username + password mode).
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  username      VARCHAR(64) NOT NULL,
  password_hash TEXT NOT NULL,
  hwid          VARCHAR(128),
  expiry        TIMESTAMPTZ,
  banned        BOOLEAN DEFAULT false,
  ban_reason    TEXT,
  last_login    TIMESTAMPTZ,
  last_ip       VARCHAR(64),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, username)
);

-- License keys.
-- Register mode: consumed once (used=true), grants user.expiry.
-- Key-only mode: first activation sets hwid + expires_at on the row itself.
CREATE TABLE IF NOT EXISTS licenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id           UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  license_key      VARCHAR(128) NOT NULL,
  duration_seconds BIGINT NOT NULL,
  level            INT DEFAULT 1,
  used             BOOLEAN DEFAULT false,
  used_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  hwid             VARCHAR(128),
  expires_at       TIMESTAMPTZ,
  used_at          TIMESTAMPTZ,
  created_by       VARCHAR(32),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, license_key)
);

-- Active login/license sessions (token returned to the client).
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(128) NOT NULL,
  hwid        VARCHAR(128),
  ip          VARCHAR(64),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Audit log.
CREATE TABLE IF NOT EXISTS logs (
  id          BIGSERIAL PRIMARY KEY,
  app_id      UUID REFERENCES apps(id) ON DELETE CASCADE,
  action      VARCHAR(32),
  username    VARCHAR(64),
  ip          VARCHAR(64),
  detail      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- HWID / IP blacklist.
CREATE TABLE IF NOT EXISTS blacklist (
  id          BIGSERIAL PRIMARY KEY,
  app_id      UUID REFERENCES apps(id) ON DELETE CASCADE,
  type        VARCHAR(16),   -- hwid | ip
  value       VARCHAR(128),
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, type, value)
);

-- Panel additions (idempotent migrations)
ALTER TABLE apps ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;
ALTER TABLE apps ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE owners ADD COLUMN IF NOT EXISTS credits INT DEFAULT 0;

-- Team members: links an account (owner) to an app with a role.
CREATE TABLE IF NOT EXISTS app_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  role        VARCHAR(32) NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(app_id, account_id)
);

-- Discord linking: connects a Discord user to an FZ Auth account.
CREATE TABLE IF NOT EXISTS discord_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  discord_id  VARCHAR(64) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- One-time codes for Discord linking flow.
CREATE TABLE IF NOT EXISTS link_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  code        VARCHAR(32) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_app ON users(app_id);
CREATE INDEX IF NOT EXISTS idx_licenses_app ON licenses(app_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_logs_app ON logs(app_id);
CREATE INDEX IF NOT EXISTS idx_app_members_app ON app_members(app_id);
CREATE INDEX IF NOT EXISTS idx_app_members_account ON app_members(account_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_discord ON discord_links(discord_id);
