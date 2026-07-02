import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/sync?uid=<user_id>  — load cloud snapshot
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 'missing uid' }, { status: 400 });

  const { data, error } = await supabase
    .from('grid_user_data')
    .select('payload, updated_at')
    .eq('user_id', uid)
    .single();

  if (error || !data) return NextResponse.json({ payload: null });
  return NextResponse.json({ payload: data.payload, updatedAt: data.updated_at });
}

// POST /api/sync  — save cloud snapshot
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.uid || !body?.payload) {
    return NextResponse.json({ error: 'missing uid or payload' }, { status: 400 });
  }

  const { error } = await supabase
    .from('grid_user_data')
    .upsert(
      { user_id: body.uid, payload: body.payload },
      { onConflict: 'user_id' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
