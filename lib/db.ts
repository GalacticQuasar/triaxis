import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'triaxis.db');
const db = new Database(DB_PATH);

// Enable write-ahead logging and enforce foreign key constraints.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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
`);

export { db };

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

export function getAllGames(): Game[] {
  return db.prepare('SELECT * FROM games ORDER BY name ASC').all() as Game[];
}

export function getGameBySlug(slug: string): Game | undefined {
  return db.prepare('SELECT * FROM games WHERE slug = ?').get(slug) as Game | undefined;
}

export function getVotesByGameId(gameId: number): Vote[] {
  return db
    .prepare('SELECT * FROM votes WHERE game_id = ? ORDER BY created_at ASC')
    .all(gameId) as Vote[];
}

export function insertVoteAndUpdate(
  gameId: number,
  exec: number,
  info: number,
  mental: number
) {
  const insertVote = db.prepare(`
    INSERT INTO votes (game_id, exec_score, info_score, mental_score)
    VALUES (?, ?, ?, ?)
  `);
  const updateGame = db.prepare(`
    UPDATE games SET
      exec_avg = (SELECT AVG(exec_score) FROM votes WHERE game_id = ?),
      info_avg = (SELECT AVG(info_score) FROM votes WHERE game_id = ?),
      mental_avg = (SELECT AVG(mental_score) FROM votes WHERE game_id = ?),
      vote_count = (SELECT COUNT(*) FROM votes WHERE game_id = ?)
    WHERE id = ?
  `);

  const tx = db.transaction(() => {
    insertVote.run(gameId, exec, info, mental);
    updateGame.run(gameId, gameId, gameId, gameId, gameId);
  });

  tx();
}
