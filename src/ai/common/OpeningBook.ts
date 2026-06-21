export interface OpeningCandidate {
  move: string;
  count: number;
  winRate?: number;
  drawRate?: number;
  averageRating?: number;
  averageEval?: number;
  policy?: number;
  notes?: string[];
}

export interface OpeningBookEntry {
  key: string;
  gameType: 'chess' | 'go' | 'reversi' | 'chinese-checkers';
  board: 'standard' | 'topology-variant';
  topology?: string;
  sampleCount: number;
  candidates: OpeningCandidate[];
}

export interface OpeningBook {
  schema: 'topoboardgame.ai.opening_book.v1';
  generatedAt: string;
  sourceManifest: string;
  entries: OpeningBookEntry[];
}

export function rankOpeningCandidates(candidates: OpeningCandidate[]): OpeningCandidate[] {
  return [...candidates].sort((a, b) => {
    const scoreA = (a.count || 0) * 2 + (a.winRate || 0) * 100 + (a.policy || 0) * 50 + (a.averageEval || 0) / 20;
    const scoreB = (b.count || 0) * 2 + (b.winRate || 0) * 100 + (b.policy || 0) * 50 + (b.averageEval || 0) / 20;
    return scoreB - scoreA;
  });
}

