import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = cookies();
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('next-auth.callback-url');
  cookieStore.delete('next-auth.csrf-token');

  const url = new URL('/login', req.url);
  return NextResponse.redirect(url);
}
