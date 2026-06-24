import { ensureSchema, getGameBySlug, insertVoteAndUpdate, client } from './db';

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

// One hardcoded baseline vote per game (the "balanced view"). Nine more votes
// per game are generated deterministically from a seeded PRNG centered on the
// baseline with a wide spread, simulating community disagreement.
const seedVotes: Record<
  string,
  { exec: number; info: number; mental: number; note: string }[]
> = {
  'counter-strike-2': [
    {
      exec: 90,
      info: 85,
      mental: 80,
      note: 'Balanced view: crisp aim/spray/movement (Exec), deep info/economy/utility meta (Info), high-stakes clutch pressure (Mental).',
    },
  ],
  'dota-2': [
    {
      exec: 70,
      info: 90,
      mental: 90,
      note: 'Balanced view: mechanics are forgiving compared to RTS/fighters, but vision/cooldown/draft knowledge and macro/tilt management are massive.',
    },
  ],
  'street-fighter-6': [
    {
      exec: 95,
      info: 55,
      mental: 85,
      note: 'Balanced view: execution dominates, but live reads/mixups do create a small hidden-information layer. Most matchup knowledge is learned pattern memory, which is Mental.',
    },
  ],
  'starcraft-2': [
    {
      exec: 95,
      info: 90,
      mental: 90,
      note: 'Balanced view: the gold-standard trifecta — multitasking/micro/macro (Exec), scouting/build-order reads (Info), and strategic adaptation (Mental).',
    },
  ],
  'rocket-league': [
    {
      exec: 88,
      info: 30,
      mental: 70,
      note: 'Balanced view: aerial/car control (Exec) is the biggest differentiator; the game is near-perfect information, so rotation and boost management are Mental planning, not hidden info.',
    },
  ],
  'hearthstone': [
    {
      exec: 40,
      info: 90,
      mental: 80,
      note: 'Balanced view: execution is minimal (play cards in order); hidden deck/hand information and probability/outs dominate (Info), with risk/tilt management as Mental.',
    },
  ],
  'osu': [
    {
      exec: 98,
      info: 20,
      mental: 60,
      note: 'Balanced view: almost pure execution (precision, speed, pattern reading); mental load is stamina and consistency, not hidden info.',
    },
  ],
  'valorant': [
    {
      exec: 85,
      info: 85,
      mental: 75,
      note: 'Balanced view: similar aim pressure to CS2, but agent abilities add an execution and info-gathering layer; clutch mental load is slightly lower.',
    },
  ],
  'super-smash-bros-melee': [
    {
      exec: 99,
      info: 55,
      mental: 85,
      note: 'Balanced view: legendary technical barrier (wavedash, L-cancel, combo trees); live DI/option-select reads create a small hidden-info layer, but most matchup knowledge is learned Mental pattern memory.',
    },
  ],
  'chesscom': [
    {
      exec: 20,
      info: 10,
      mental: 95,
      note: 'Perfect information: both players see the entire board, so the Info axis (hidden/asymmetric state) is minimal. Skill is almost entirely planning, calculation, and clock management (Mental).',
    },
  ],
};

const RANDOM_VOTES_PER_GAME = 9;
// Half-width of the uniform spread around each baseline axis value.
const SPREAD = 45;

// Deterministic PRNG (mulberry32) so re-seeding the DB is reproducible.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(1337);

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function randomVotesAround(
  baseline: { exec: number; info: number; mental: number },
  count: number,
) {
  const votes: { exec: number; info: number; mental: number }[] = [];
  for (let i = 0; i < count; i++) {
    votes.push({
      exec: clamp(baseline.exec + (rng() * 2 - 1) * SPREAD),
      info: clamp(baseline.info + (rng() * 2 - 1) * SPREAD),
      mental: clamp(baseline.mental + (rng() * 2 - 1) * SPREAD),
    });
  }
  return votes;
}

const WIPE_FLAG = '--wipe';

async function wipeDatabase() {
  await client.executeMultiple(`
    DELETE FROM votes;
    DELETE FROM games;
    DELETE FROM sqlite_sequence WHERE name IN ('votes', 'games');
  `);
  console.log('Wiped votes and games tables');
}

async function seed() {
  if (process.argv.includes(WIPE_FLAG)) {
    await wipeDatabase();
  }
  await ensureSchema();

  for (const game of seedGames) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO games (slug, name, genre_tag, cover_url, exec_avg, info_avg, mental_avg, vote_count) VALUES (?, ?, ?, ?, 50.0, 50.0, 50.0, 0)',
      args: [game.slug, game.name, game.genre_tag, null],
    });
  }

  let voteCount = 0;
  for (const [slug, votes] of Object.entries(seedVotes)) {
    const game = await getGameBySlug(slug);
    if (!game) {
      console.warn('Could not find game for slug:', slug);
      continue;
    }
    for (const vote of votes) {
      await insertVoteAndUpdate(game.id, vote.exec, vote.info, vote.mental);
      voteCount++;
    }
    for (const vote of randomVotesAround(votes[0], RANDOM_VOTES_PER_GAME)) {
      await insertVoteAndUpdate(game.id, vote.exec, vote.info, vote.mental);
      voteCount++;
    }
  }

  console.log('Seeded', seedGames.length, 'games');
  console.log('Seeded', voteCount, 'initial votes');
  await client.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});