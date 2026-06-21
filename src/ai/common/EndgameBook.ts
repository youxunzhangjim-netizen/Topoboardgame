export interface EndgameConfig {
  schema: 'topoboardgame.ai.endgame_config.v1';
  gameType: 'chess' | 'go' | 'reversi' | 'chinese-checkers';
  exactSolver?: {
    enabled: boolean;
    maxPieces?: number;
    maxEmptySquares?: number;
    localPathEnv?: string;
  };
  fallback: 'local-search' | 'engine' | 'heuristic';
  notes: string[];
}

export interface EndgameProbeResult {
  exact: boolean;
  result: 'win' | 'loss' | 'draw' | 'unknown';
  bestMove?: string;
  score?: number;
  source: string;
}

