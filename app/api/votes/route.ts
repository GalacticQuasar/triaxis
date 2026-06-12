import { getGameBySlug, insertVoteAndUpdate } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, exec, info, mental } = body;

    if (!slug || typeof exec !== 'number' || typeof info !== 'number' || typeof mental !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    if (exec < 0 || exec > 100 || info < 0 || info > 100 || mental < 0 || mental > 100) {
      return NextResponse.json({ error: 'Scores must be between 0 and 100' }, { status: 400 });
    }

    const game = getGameBySlug(slug);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    insertVoteAndUpdate(game.id, Math.round(exec), Math.round(info), Math.round(mental));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
