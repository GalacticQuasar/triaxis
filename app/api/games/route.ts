import { getAllGames, getGameBySlug } from '@/lib/db';
import { NextResponse } from 'next/server';
import { sortGames, SortKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const game = getGameBySlug(slug);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    return NextResponse.json({ game });
  }

  const sort = searchParams.get('sort') || 'votes';
  const sortKey: SortKey = ['votes', 'exec', 'info', 'mental'].includes(sort) ? (sort as SortKey) : 'votes';
  const games = sortGames(getAllGames(), sortKey);
  return NextResponse.json({ games });
}
