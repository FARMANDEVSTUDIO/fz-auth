import { NextResponse } from 'next/server';
import { handleBinanceCallback } from '@/lib/payments/binance-pay';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const success = await handleBinanceCallback(body, headers);

    if (success) {
      return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
    }

    return NextResponse.json(
      { returnCode: 'FAIL', returnMessage: 'Verification failed' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Binance callback error:', err);
    return NextResponse.json(
      { returnCode: 'FAIL', returnMessage: 'Internal error' },
      { status: 500 }
    );
  }
}
