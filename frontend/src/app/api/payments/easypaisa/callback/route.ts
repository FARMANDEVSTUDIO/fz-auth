import { NextResponse } from 'next/server';
import { handleEasyPaisaCallback } from '@/lib/payments/easypaisa';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = String(value);
    });

    const success = await handleEasyPaisaCallback(params);

    const origin = new URL(req.url).origin;
    const redirectUrl = success
      ? `${origin}/shop?payment=success`
      : `${origin}/shop?payment=failed`;

    return NextResponse.redirect(redirectUrl, 302);
  } catch (err) {
    console.error('EasyPaisa callback error:', err);
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(`${origin}/shop?payment=failed`, 302);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const success = await handleEasyPaisaCallback(params);

  const origin = url.origin;
  const redirectUrl = success
    ? `${origin}/shop?payment=success`
    : `${origin}/shop?payment=failed`;

  return NextResponse.redirect(redirectUrl, 302);
}
