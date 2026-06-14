import { db, getGameBySlug, insertVoteAndUpdate } from './db';

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

// Three initial prediction votes per game. Each vote is a perspective on how
// much the game demands Execution, Information, and Mental skill.
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
    {
      exec: 88,
      info: 88,
      mental: 82,
      note: 'Info-first view: at the pro level reads, callouts, and anti-stratting matter as much as raw aim.',
    },
    {
      exec: 92,
      info: 82,
      mental: 78,
      note: 'Aim-first view: the mechanical floor for acceptable ranked play is higher than the other axes.',
    },
  ],
  'dota-2': [
    {
      exec: 70,
      info: 90,
      mental: 90,
      note: 'Balanced view: mechanics are forgiving compared to RTS/fighters, but vision/cooldown/draft knowledge and macro/tilt management are massive.',
    },
    {
      exec: 75,
      info: 88,
      mental: 92,
      note: 'Mental-heavy view: comeback decision-making, shot-calling, and variance tolerance separate good players from great ones.',
    },
    {
      exec: 68,
      info: 92,
      mental: 88,
      note: 'Info-heavy view: the game is mostly a knowledge test of drafts, item timings, and map state.',
    },
  ],
  'street-fighter-6': [
    {
      exec: 95,
      info: 55,
      mental: 85,
      note: 'Balanced view: execution dominates, but live reads/mixups do create a small hidden-information layer. Most matchup knowledge is learned pattern memory, which is Mental.',
    },
    {
      exec: 92,
      info: 58,
      mental: 87,
      note: 'Yomi view: high-level fighting games are mind games, but the "info" is only the opponent\'s current intention, not persistent hidden state.',
    },
    {
      exec: 97,
      info: 52,
      mental: 83,
      note: 'Execution-max view: one dropped combo or mis-timed anti-air can end a round; matchup knowledge is memory, not information advantage.',
    },
  ],
  'starcraft-2': [
    {
      exec: 95,
      info: 90,
      mental: 90,
      note: 'Balanced view: the gold-standard trifecta — multitasking/micro/macro (Exec), scouting/build-order reads (Info), and strategic adaptation (Mental).',
    },
    {
      exec: 93,
      info: 92,
      mental: 88,
      note: 'Info-first view: knowledge of what the opponent is doing drives everything else.',
    },
    {
      exec: 96,
      info: 88,
      mental: 92,
      note: 'Execution/mental view: the speed ceiling plus the need to stay calm under harassment is unmatched.',
    },
  ],
  'rocket-league': [
    {
      exec: 88,
      info: 30,
      mental: 70,
      note: 'Balanced view: aerial/car control (Exec) is the biggest differentiator; the game is near-perfect information, so rotation and boost management are Mental planning, not hidden info.',
    },
    {
      exec: 90,
      info: 28,
      mental: 68,
      note: 'Execution-first view: flashy mechanics win highlight reels and ranked games alike.',
    },
    {
      exec: 86,
      info: 32,
      mental: 72,
      note: 'Team-play view: positioning and reading teammates/opponents edges out pure mechanics at high 3v3 ranks, but this is anticipation, not hidden state.',
    },
  ],
  'hearthstone': [
    {
      exec: 40,
      info: 90,
      mental: 80,
      note: 'Balanced view: execution is minimal (play cards in order); hidden deck/hand information and probability/outs dominate (Info), with risk/tilt management as Mental.',
    },
    {
      exec: 35,
      info: 92,
      mental: 78,
      note: 'Info-first view: knowing every meta deck, tracking cards, and calculating outs is the core skill; hidden cards are the main skill ceiling.',
    },
    {
      exec: 42,
      info: 88,
      mental: 82,
      note: 'Mental-up view: bluffing lines, resource allocation, and managing variance add a real mind-game layer on top of card knowledge.',
    },
  ],
  'osu': [
    {
      exec: 98,
      info: 20,
      mental: 60,
      note: 'Balanced view: almost pure execution (precision, speed, pattern reading); mental load is stamina and consistency, not hidden info.',
    },
    {
      exec: 96,
      info: 22,
      mental: 62,
      note: 'Stamina view: long maps and tournament pressure make mental resilience more relevant than information.',
    },
    {
      exec: 99,
      info: 18,
      mental: 58,
      note: 'Pure execution view: if you cannot click the circles, nothing else matters.',
    },
  ],
  'valorant': [
    {
      exec: 85,
      info: 85,
      mental: 75,
      note: 'Balanced view: similar aim pressure to CS2, but agent abilities add an execution and info-gathering layer; clutch mental load is slightly lower.',
    },
    {
      exec: 82,
      info: 88,
      mental: 75,
      note: 'Ability/info view: utility usage, recon, and agent synergy raise the information axis above raw gunplay.',
    },
    {
      exec: 88,
      info: 82,
      mental: 78,
      note: 'Gunplay view: peek duels and operator reads still reward aim above all else.',
    },
  ],
  'super-smash-bros-melee': [
    {
      exec: 99,
      info: 55,
      mental: 85,
      note: 'Balanced view: legendary technical barrier (wavedash, L-cancel, combo trees); live DI/option-select reads create a small hidden-info layer, but most matchup knowledge is learned Mental pattern memory.',
    },
    {
      exec: 97,
      info: 58,
      mental: 87,
      note: 'Mind-game view: once tech skill is automatic, reads and adaptation decide top-level sets, but adaptation is Mental rather than persistent hidden information.',
    },
    {
      exec: 99,
      info: 52,
      mental: 83,
      note: 'Tech ceiling view: the inputs required to play the game at a base competitive level are already extreme.',
    },
  ],
  'chesscom': [
    {
      exec: 20,
      info: 10,
      mental: 95,
      note: 'Perfect information: both players see the entire board, so the Info axis (hidden/asymmetric state) is minimal. Skill is almost entirely planning, calculation, and clock management (Mental).',
    },
    {
      exec: 18,
      info: 12,
      mental: 97,
      note: 'Opening/endgame theory is memorized pattern knowledge, not hidden info. The dominant skill is deep, accurate calculation under time pressure.',
    },
    {
      exec: 22,
      info: 8,
      mental: 96,
      note: 'The only "info" edge is remembering theory; the game is decided by reads of the opponent\'s plan and the ability to calculate consequences.',
    },
  ],
};

function seed() {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO games (slug, name, genre_tag, cover_url, exec_avg, info_avg, mental_avg, vote_count) VALUES (?, ?, ?, ?, 50.0, 50.0, 50.0, 0)'
  );

  for (const game of seedGames) {
    insert.run(game.slug, game.name, game.genre_tag, null);
  }

  let voteCount = 0;
  for (const [slug, votes] of Object.entries(seedVotes)) {
    const game = getGameBySlug(slug);
    if (!game) {
      console.warn('Could not find game for slug:', slug);
      continue;
    }
    for (const vote of votes) {
      insertVoteAndUpdate(game.id, vote.exec, vote.info, vote.mental);
      voteCount++;
    }
  }

  console.log('Seeded', seedGames.length, 'games');
  console.log('Seeded', voteCount, 'initial votes');
}

seed();
