import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { planExpiryEmail } from '@/lib/email-templates';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'fz-cron-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { email: string; daysLeft: number; status: string }[] = [];

  const res = await query(
    `SELECT id, email, plan_type, plan_expires_at
     FROM owners
     WHERE plan_type IS NOT NULL
       AND plan_expires_at IS NOT NULL
       AND plan_expires_at > NOW()
       AND plan_expires_at <= NOW() + INTERVAL '3 days'
       AND deleted_at IS NULL`
  );

  for (const owner of res.rows) {
    const expiresAt = new Date(owner.plan_expires_at);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const planName = owner.plan_type === 'enterprise' ? 'Enterprise' : 'Pro';
    const expiryDate = expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    try {
      const template = planExpiryEmail(planName, daysLeft, expiryDate);
      await sendMail({ to: owner.email, subject: template.subject, html: template.html });
      results.push({ email: owner.email, daysLeft, status: 'sent' });
    } catch (err: any) {
      results.push({ email: owner.email, daysLeft, status: `error: ${err.message}` });
    }
  }

  return NextResponse.json({
    success: true,
    notified: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
