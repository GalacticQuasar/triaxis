import { Game } from './db';

export type SortKey = 'votes' | 'exec' | 'info' | 'mental';

export function sortGames(games: Game[], sort: SortKey): Game[] {
  const sorted = [...games];
  switch (sort) {
    case 'votes':
      sorted.sort((a, b) => b.vote_count - a.vote_count);
      break;
    case 'exec':
      sorted.sort((a, b) => b.exec_avg - a.exec_avg);
      break;
    case 'info':
      sorted.sort((a, b) => b.info_avg - a.info_avg);
      break;
    case 'mental':
      sorted.sort((a, b) => b.mental_avg - a.mental_avg);
      break;
    default:
      break;
  }
  return sorted;
}
