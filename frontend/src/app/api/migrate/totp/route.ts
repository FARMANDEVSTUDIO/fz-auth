import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`
      ALTER TABLE owners
      ADD COLUMN IF NOT EXISTS totp_secret TEXT,
      ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT
    `);
    return NextResponse.json({ ok: true, message: '2FA columns added' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
