import { db } from './db';

const seedGames = [
  { slug: 'counter-strike-2', name: 'Counter-Strike 2', genre_tag: 'FPS / Tactical' },
  { slug: 'dota-2', name: 'Dota 2', genre_tag: 'MOBA' },
  { slug: 'street-fighter-6', name: 'Street Fighter 6', genre_tag: 'Fighting' },
  { slug: 'starcraft-2', name: 'StarCraft II', genre_tag: 'RTS' },
  { slug: 'rocket-league', name: 'Rocket League', genre_tag: 'Arena / Sports' },
  { slug: 'hearthstone', name: 'Hearthstone', genre_tag: 'Card / Strategy' },
  { slug: 'osu', name: 'Osu!', genre_tag: 'Rhythm / Reflex' },
  { slug: 'valorant', name: 'Valorant', genre_tag: 'FPS / Tactical' },
  { slug: 'super-smash-bros-melee', name: 'Super Smash Bros. Melee', genre_tag: 'Fighting' },
  { slug: 'chesscom', name: 'Chess.com', genre_tag: 'Strategy' },
];

function seed() {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO games (slug, name, genre_tag, cover_url, exec_avg, info_avg, mental_avg, vote_count, std_exec, std_info, std_mental) VALUES (?, ?, ?, ?, 50.0, 50.0, 50.0, 0, 0.0, 0.0, 0.0)'
  );

  for (const game of seedGames) {
    insert.run(game.slug, game.name, game.genre_tag, null);
  }

  console.log('Seeded', seedGames.length, 'games');
}

seed();
