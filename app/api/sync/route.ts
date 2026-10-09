import { NextRequest, NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export const dynamic = 'force-dynamic';

// GET /api/sync?uid=<user_id>  — load cloud snapshot from Turso
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 'missing uid' }, { status: 400 });

  if (!turso) {
    return NextResponse.json({ payload: null, error: 'Database not configured' });
  }

  try {
    const result = await turso.execute({
      sql: 'SELECT payload, updated_at FROM grid_user_data WHERE user_id = ?',
      args: [uid],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ payload: null });
    }

    const row = result.rows[0];
    const payload = row.payload ? JSON.parse(row.payload as string) : null;
    return NextResponse.json({ payload, updatedAt: row.updated_at });
  } catch (error) {
    console.error('Turso GET error:', error);
    return NextResponse.json({ payload: null });
  }
}

// POST /api/sync  — save cloud snapshot to Turso
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.uid || !body?.payload) {
    return NextResponse.json({ error: 'missing uid or payload' }, { status: 400 });
  }

  if (!turso) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const payloadStr = JSON.stringify(body.payload);

    await turso.execute({
      sql: `INSERT INTO grid_user_data (user_id, payload, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
              payload = excluded.payload,
              updated_at = datetime('now')`,
      args: [body.uid, payloadStr],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Turso POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
