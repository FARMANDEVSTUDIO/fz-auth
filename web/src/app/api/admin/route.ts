import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { apiUrl, adminKey, appId, path, body } = await req.json();

  if (!apiUrl || !adminKey || !appId || !path) {
    return NextResponse.json({ success: false, message: 'Missing params' }, { status: 400 });
  }

  try {
    const res = await fetch(`${apiUrl}/admin/${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify({ app_id: appId, ...body }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
