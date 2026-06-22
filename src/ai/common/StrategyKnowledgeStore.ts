import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  KnowledgeBoardFamily,
  KnowledgeGame,
  OpeningMoveStat,
  StrategyKnowledgeOutput,
  StrategyRule
} from './StrategyKnowledgeBuilder.ts';

export type KnowledgeLookupOptions = {
  rootDir?: string;
  game: KnowledgeGame;
  boardFamily?: KnowledgeBoardFamily | string;
};

const GRAPH_TOPOLOGY_FAMILIES = new Set([
  'torus',
  'cylinder',
  'polar',
  'mobius',
  'klein',
  'rp2',
  'sphere',
  'cube',
  '3d',
  '4d',
  'graph-topology'
]);

export class StrategyKnowledgeStore {
  readonly rootDir: string;

  constructor(rootDir = 'src/ai/knowledge') {
    this.rootDir = rootDir;
  }

  load(options: KnowledgeLookupOptions): StrategyKnowledgeOutput | null {
    const family = normalizeBoardFamily(options.boardFamily);
    const candidates = [
      join(options.rootDir || this.rootDir, options.game, family, 'strategyKnowledge.json')
    ];
    if (family !== 'standard') {
      candidates.push(join(options.rootDir || this.rootDir, options.game, 'graph-topology', 'strategyKnowledge.json'));
    }
    for (const file of candidates) {
      if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as StrategyKnowledgeOutput;
    }
    return null;
  }

  rules(options: KnowledgeLookupOptions): StrategyRule[] {
    return this.load(options)?.rules || [];
  }

  openingBook(options: KnowledgeLookupOptions): OpeningMoveStat[] {
    const family = normalizeBoardFamily(options.boardFamily);
    if (family !== 'standard') return [];
    return this.load({ ...options, boardFamily: 'standard' })?.openingBook || [];
  }

  endgameBook(options: KnowledgeLookupOptions): OpeningMoveStat[] {
    return this.load(options)?.endgameBook || [];
  }
}

export function normalizeBoardFamily(boardFamily: KnowledgeLookupOptions['boardFamily']): KnowledgeBoardFamily {
  const family = String(boardFamily || 'standard').toLowerCase();
  if (family === 'standard') return 'standard';
  if (family === 'torus') return 'torus';
  if (family === 'cylinder') return 'cylinder';
  if (family === 'polar') return 'polar';
  if (GRAPH_TOPOLOGY_FAMILIES.has(family)) return 'graph-topology';
  return 'graph-topology';
}

export const defaultStrategyKnowledgeStore = new StrategyKnowledgeStore();
