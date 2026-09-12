import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL('/login', req.url);
  const response = NextResponse.redirect(url);

  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token',
    '__Host-authjs.csrf-token',
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  }

  return response;
}
