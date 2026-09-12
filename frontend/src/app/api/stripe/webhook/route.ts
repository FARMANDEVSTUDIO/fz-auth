import { NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/stripe';

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await req.text();
  const result = await handleWebhook(body, signature);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
