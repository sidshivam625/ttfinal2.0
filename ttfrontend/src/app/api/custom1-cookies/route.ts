import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { flags } = (await req.json()) as { flags: Array<{ challengeId: string; flag: string }> };
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    const res = NextResponse.json({ success: true });

    for (const { challengeId, flag } of flags || []) {
      const name = `custom1_${challengeId}`;
      res.cookies.set(name, flag, {
        httpOnly: false, // visible in DevTools Application tab
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge,
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Bad request' }, { status: 400 });
  }
}
