import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { positionHash } from './PositionHasher.ts';

export type KnowledgeGame = 'chess' | 'go' | 'reversi' | 'chinese-checkers';
export type KnowledgePhase = 'opening' | 'middlegame' | 'endgame' | 'all';
export type KnowledgeBoardFamily = 'standard' | 'graph-topology' | 'torus' | 'cylinder' | 'polar';
export type KnowledgeDataType = 'PGN' | 'SGF' | 'WTHOR' | 'ENGINE' | 'TABLEBASE' | 'NOTES' | 'JSON';

export type StrategyRule = {
  id: string;
  game: KnowledgeGame;
  phase: KnowledgePhase;
  boardFamily: KnowledgeBoardFamily;
  description: string;
  features: string[];
  weight: number;
  sourceIds: string[];
};

export type OpeningMoveStat = {
  positionHash: string;
  move: string;
  count: number;
  winRate?: number;
  drawRate?: number;
  avgRating?: number;
  engineEval?: number;
  policyPrior?: number;
};

export type KnowledgeManifestEntry = {
  id: string;
  name: string;
  url?: string;
  localPath?: string;
  license: string;
  redistributionAllowed: boolean;
  dataType: KnowledgeDataType;
  notes: string;
};

export type StrategyKnowledgeOutput = {
  schema: 'topoboardgame.ai.strategy_knowledge.v1';
  generatedAt: string;
  game: KnowledgeGame;
  boardFamily: KnowledgeBoardFamily;
  manifest: KnowledgeManifestEntry[];
  rules: StrategyRule[];
  openingBook: OpeningMoveStat[];
  endgameBook: OpeningMoveStat[];
  decisionStack: string[];
};

export type StrategyKnowledgeBuilderOptions = {
  game: KnowledgeGame;
  boardFamily: KnowledgeBoardFamily;
  notesDirs?: string[];
  datasetFiles?: string[];
  engineAnalysisFiles?: string[];
  manifestFiles?: string[];
  outputDir?: string;
  devAllowUrlFetch?: boolean;
};

const DEFAULT_DECISION_STACK = [
  'terminal',
  'endgame-knowledge',
  'opening-book',
  'engine-or-search',
  'difficulty-policy'
];

export class StrategyKnowledgeBuilder {
  private readonly options: StrategyKnowledgeBuilderOptions;

  constructor(options: StrategyKnowledgeBuilderOptions) {
    this.options = options;
  }

  build(): StrategyKnowledgeOutput {
    if (this.options.devAllowUrlFetch) {
      throw new Error('Live URL fetching is intentionally not implemented. Use local files or metadata-only URLs.');
    }
    const manifest = this.readManifestEntries();
    const rules = this.readNotesAsRules(manifest);
    const openingBook = this.readOpeningStats();
    const endgameBook = this.readEndgameStats();
    return {
      schema: 'topoboardgame.ai.strategy_knowledge.v1',
      generatedAt: new Date().toISOString(),
      game: this.options.game,
      boardFamily: this.options.boardFamily,
      manifest,
      rules,
      openingBook,
      endgameBook,
      decisionStack: decisionStackFor(this.options.game)
    };
  }

  write(): string {
    const output = this.build();
    const outDir = this.options.outputDir || join('src/ai/knowledge', this.options.game, this.options.boardFamily);
    const outFile = join(outDir, 'strategyKnowledge.json');
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, JSON.stringify(output, null, 2));
    return outFile;
  }

  private readManifestEntries(): KnowledgeManifestEntry[] {
    const entries: KnowledgeManifestEntry[] = [];
    for (const file of this.options.manifestFiles || []) {
      if (!existsSync(file)) continue;
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      if (Array.isArray(parsed)) entries.push(...parsed);
      else if (Array.isArray(parsed.sources)) {
        entries.push(...parsed.sources.map((source: Record<string, unknown>, index: number) => ({
          id: String(source.id || source.sourceName || `source-${index}`),
          name: String(source.name || source.sourceName || `Source ${index}`),
          url: source.url ? String(source.url) : source.sourceUrl ? String(source.sourceUrl) : undefined,
          localPath: source.localPath ? String(source.localPath) : undefined,
          license: String(source.license || source.licenseSummary || 'unknown'),
          redistributionAllowed: Boolean(source.redistributionAllowed === true || source.redistributionAllowed === 'allowed'),
          dataType: normalizeDataType(source.dataType),
          notes: String(source.notes || '')
        })));
      }
    }
    return dedupeById(entries);
  }

  private readNotesAsRules(manifest: KnowledgeManifestEntry[]): StrategyRule[] {
    const rules: StrategyRule[] = [];
    for (const dir of this.options.notesDirs || []) {
      if (!existsSync(dir)) continue;
      for (const file of readdirSync(dir)) {
        const path = join(dir, file);
        if (file.endsWith('.json')) {
          const parsed = JSON.parse(readFileSync(path, 'utf8'));
          const incoming = Array.isArray(parsed) ? parsed : parsed.rules;
          if (Array.isArray(incoming)) {
            rules.push(...incoming
              .map((rule, index) => normalizeRule(rule, this.options, `notes-${file}-${index}`))
              .filter((rule) => rule.game === this.options.game && rule.boardFamily === this.options.boardFamily));
          }
        } else if (file.endsWith('.txt') || file.endsWith('.md')) {
          const text = readFileSync(path, 'utf8')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'));
          for (const [index, line] of text.entries()) {
            rules.push({
              id: `note-${positionHash({ file, index, line })}`,
              game: this.options.game,
              phase: phaseFromText(line),
              boardFamily: this.options.boardFamily,
              description: line.slice(0, 240),
              features: featureNamesFromText(line),
              weight: 1,
              sourceIds: manifest.filter((entry) => entry.dataType === 'NOTES').map((entry) => entry.id)
            });
          }
        }
      }
    }
    return rules;
  }

  private readOpeningStats(): OpeningMoveStat[] {
    return this.readStatsFromFiles('opening');
  }

  private readEndgameStats(): OpeningMoveStat[] {
    return this.readStatsFromFiles('endgame');
  }

  private readStatsFromFiles(phase: 'opening' | 'endgame'): OpeningMoveStat[] {
    const stats: OpeningMoveStat[] = [];
    for (const file of [...(this.options.datasetFiles || []), ...(this.options.engineAnalysisFiles || [])]) {
      if (!existsSync(file)) continue;
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      const entries = parsed.entries || parsed.openingBook || parsed.endgameBook || [];
      for (const entry of entries) {
        for (const candidate of entry.candidates || [entry]) {
          stats.push({
            positionHash: String(entry.key || entry.positionHash || positionHash(entry, `${phase}:`)),
            move: String(candidate.move || entry.move || ''),
            count: Number(candidate.count || entry.count || 1),
            winRate: optionalNumber(candidate.winRate ?? entry.winRate),
            drawRate: optionalNumber(candidate.drawRate ?? entry.drawRate),
            avgRating: optionalNumber(candidate.avgRating ?? candidate.averageRating ?? entry.avgRating),
            engineEval: optionalNumber(candidate.engineEval ?? candidate.averageEval ?? entry.engineEval),
            policyPrior: optionalNumber(candidate.policyPrior ?? candidate.policy ?? entry.policyPrior)
          });
        }
      }
    }
    return stats.filter((row) => row.move);
  }
}

export function decisionStackFor(game: KnowledgeGame): string[] {
  const exact = {
    chess: 'endgame: Syzygy if LOCAL_SYZYGY_PATH exists and piece count <= 7; else Stockfish/local search',
    go: 'endgame: KataGo score/ownership and yose heuristics; no exact full-board tablebase',
    reversi: 'endgame: exact alpha-beta if empty squares <= threshold; else Edax/local search',
    'chinese-checkers': 'endgame: graph-distance race, goal blocking, and jump-chain heuristic'
  }[game];
  return [DEFAULT_DECISION_STACK[0], exact, ...DEFAULT_DECISION_STACK.slice(2)];
}

function normalizeDataType(value: unknown): KnowledgeDataType {
  const text = String(value || 'JSON').toUpperCase();
  return ['PGN', 'SGF', 'WTHOR', 'ENGINE', 'TABLEBASE', 'NOTES', 'JSON'].includes(text) ? text as KnowledgeDataType : 'JSON';
}

function dedupeById(entries: KnowledgeManifestEntry[]): KnowledgeManifestEntry[] {
  return [...new Map(entries.map((entry) => [entry.id, entry])).values()];
}

function normalizeRule(rule: Record<string, unknown>, options: StrategyKnowledgeBuilderOptions, fallbackId: string): StrategyRule {
  return {
    id: String(rule.id || fallbackId),
    game: (rule.game || options.game) as KnowledgeGame,
    phase: (rule.phase || 'all') as KnowledgePhase,
    boardFamily: (rule.boardFamily || options.boardFamily) as KnowledgeBoardFamily,
    description: String(rule.description || ''),
    features: Array.isArray(rule.features) ? rule.features.map(String) : featureNamesFromText(String(rule.description || '')),
    weight: Number(rule.weight ?? 1),
    sourceIds: Array.isArray(rule.sourceIds) ? rule.sourceIds.map(String) : []
  };
}

function phaseFromText(text: string): KnowledgePhase {
  if (/opening|fuseki|joseki|book/i.test(text)) return 'opening';
  if (/endgame|yose|tablebase|race/i.test(text)) return 'endgame';
  if (/middle|fight|strategy/i.test(text)) return 'middlegame';
  return 'all';
}

function featureNamesFromText(text: string): string[] {
  const features = [];
  if (/distance|goal|race/i.test(text)) features.push('graphDistanceToGoal');
  if (/mobility|legal move/i.test(text)) features.push('mobility');
  if (/corner|edge|stable|anchor/i.test(text)) features.push('topologyRegionControl');
  if (/libert|territor|ownership/i.test(text)) features.push('territoryOrLiberty');
  if (/jump|chain/i.test(text)) features.push('jumpChainPotential');
  if (/king|safety|check/i.test(text)) features.push('kingSafety');
  return features.length ? features : ['heuristicPattern'];
}

function optionalNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
