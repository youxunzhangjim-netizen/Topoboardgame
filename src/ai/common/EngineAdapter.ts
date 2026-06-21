export interface EngineTopMove {
  move: string;
  scoreCp?: number;
  mateIn?: number;
  policy?: number;
  pv?: string[];
}

export interface EngineAnalysis {
  bestMove?: string;
  topMoves: EngineTopMove[];
  winRate?: number;
  scoreLead?: number;
  ownership?: number[];
  raw?: string;
}

export interface EngineAdapter {
  readonly name: string;
  readonly protocol: 'UCI' | 'GTP' | 'JSONL' | 'CLI';
  isAvailable(): Promise<boolean>;
  analyze(position: unknown, options?: Record<string, unknown>): Promise<EngineAnalysis>;
  close?(): Promise<void>;
}

export function requireLocalExecutable(name: string, envName: string): string {
  const value = process.env[envName];
  if (!value) throw new Error(`${name} is not configured. Set ${envName} to a local executable path.`);
  return value;
}

