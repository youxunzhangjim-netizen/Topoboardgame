export interface BotDifficulty {
  id: string;
  label: string;
  searchDepth: number;
  timeMs: number;
  useOpeningBook: boolean;
  useEngine: boolean;
  useEndgameBook: boolean;
  randomness: number;
}

export const BOT_DIFFICULTIES: BotDifficulty[] = [
  { id: 'easy', label: 'Easy', searchDepth: 1, timeMs: 100, useOpeningBook: true, useEngine: false, useEndgameBook: false, randomness: 0.25 },
  { id: 'normal', label: 'Normal', searchDepth: 2, timeMs: 350, useOpeningBook: true, useEngine: false, useEndgameBook: true, randomness: 0.1 },
  { id: 'strong', label: 'Strong', searchDepth: 3, timeMs: 900, useOpeningBook: true, useEngine: true, useEndgameBook: true, randomness: 0.03 },
  { id: 'strongest', label: 'Strongest but slow', searchDepth: 4, timeMs: 1800, useOpeningBook: true, useEngine: true, useEndgameBook: true, randomness: 0 }
];

