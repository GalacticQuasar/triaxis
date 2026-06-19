import { createClient, type Client } from '@libsql/client';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL env var is required');
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN env var is required');
}

const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Schema bootstrap. Idempotent DDL — safe to run on every cold start.
// Cached via a module-level promise so it only runs once per server process,
// not once per request. On Vercel that means once per serverless invocation
// lifecycle; locally, once per `npm run dev` process.
let schemaPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        genre_tag TEXT,
        cover_url TEXT,
        exec_avg REAL DEFAULT 50.0 CHECK(exec_avg BETWEEN 0 AND 100),
        info_avg REAL DEFAULT 50.0 CHECK(info_avg BETWEEN 0 AND 100),
        mental_avg REAL DEFAULT 50.0 CHECK(mental_avg BETWEEN 0 AND 100),
        vote_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        exec_score INTEGER NOT NULL CHECK(exec_score BETWEEN 0 AND 100),
        info_score INTEGER NOT NULL CHECK(info_score BETWEEN 0 AND 100),
        mental_score INTEGER NOT NULL CHECK(mental_score BETWEEN 0 AND 100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_votes_game_id ON votes(game_id);
    `).catch((err) => {
      // If bootstrap fails, clear the cache so the next request can retry.
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

export { client };

export type Game = {
  id: number;
  slug: string;
  name: string;
  genre_tag: string | null;
  cover_url: string | null;
  exec_avg: number;
  info_avg: number;
  mental_avg: number;
  vote_count: number;
};

export type Vote = {
  id: number;
  game_id: number;
  exec_score: number;
  info_score: number;
  mental_score: number;
  created_at: string;
};

// libSQL returns rows as instances of an internal Row class (not plain objects).
// Next.js RSC serialization rejects non-plain objects when passing from Server to
// Client Components, so we spread each row into a fresh {} to strip the prototype.
function toPlain<T>(row: unknown): T {
  return { ...(row as Record<string, unknown>) } as T;
}

export async function getAllGames(): Promise<Game[]> {
  const res = await client.execute('SELECT * FROM games ORDER BY name ASC');
  return res.rows.map((r) => toPlain<Game>(r));
}

export async function getGameBySlug(slug: string): Promise<Game | undefined> {
  const res = await client.execute({
    sql: 'SELECT * FROM games WHERE slug = ?',
    args: [slug],
  });
  return res.rows[0] ? toPlain<Game>(res.rows[0]) : undefined;
}

export async function getVotesByGameId(gameId: number): Promise<Vote[]> {
  const res = await client.execute({
    sql: 'SELECT * FROM votes WHERE game_id = ? ORDER BY created_at ASC',
    args: [gameId],
  });
  return res.rows.map((r) => toPlain<Vote>(r));
}

// Fetch every vote in a single round-trip, grouped by game_id in JS.
// Use this when you need votes for ALL games (catalog, /cube) instead of
// calling getVotesByGameId in a loop — that's an N+1 over a remote DB.
export async function getAllVotesByGameId(): Promise<Record<number, Vote[]>> {
  const res = await client.execute(
    'SELECT * FROM votes ORDER BY game_id ASC, created_at ASC'
  );
  const byGame: Record<number, Vote[]> = {};
  for (const row of res.rows) {
    const v = toPlain<Vote>(row);
    (byGame[v.game_id] ??= []).push(v);
  }
  return byGame;
}

export async function insertVoteAndUpdate(
  gameId: number,
  exec: number,
  info: number,
  mental: number
): Promise<void> {
  // batch() wraps the statements in a single transaction; if either fails, both roll back.
  // "write" mode (BEGIN IMMEDIATE) since we're doing writes.
  await client.batch(
    [
      {
        sql: 'INSERT INTO votes (game_id, exec_score, info_score, mental_score) VALUES (?, ?, ?, ?)',
        args: [gameId, exec, info, mental],
      },
      {
        sql: `UPDATE games SET
          exec_avg = (SELECT AVG(exec_score) FROM votes WHERE game_id = ?),
          info_avg = (SELECT AVG(info_score) FROM votes WHERE game_id = ?),
          mental_avg = (SELECT AVG(mental_score) FROM votes WHERE game_id = ?),
          vote_count = (SELECT COUNT(*) FROM votes WHERE game_id = ?)
        WHERE id = ?`,
        args: [gameId, gameId, gameId, gameId, gameId],
      },
    ],
    'write'
  );
}