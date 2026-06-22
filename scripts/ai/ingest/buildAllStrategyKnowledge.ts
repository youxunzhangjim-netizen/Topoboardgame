import { StrategyKnowledgeBuilder, type KnowledgeBoardFamily, type KnowledgeGame } from '../../../src/ai/common/StrategyKnowledgeBuilder.ts';

type Job = {
  game: KnowledgeGame;
  boardFamily: KnowledgeBoardFamily;
  notes: string[];
  datasets: string[];
};

const manifests = ['src/ai/knowledge/manifest.json', 'src/ai/knowledge/strategySources.manifest.json'];

const jobs: Job[] = [
  {
    game: 'chess',
    boardFamily: 'standard',
    notes: ['data/strategy-notes/chess/standard'],
    datasets: ['data/strategy-seeds/chess/standard-openings.json', 'data/strategy-seeds/chess/standard-endgames.json']
  },
  { game: 'chess', boardFamily: 'graph-topology', notes: ['data/strategy-notes/chess/graph-topology'], datasets: [] },
  {
    game: 'go',
    boardFamily: 'standard',
    notes: ['data/strategy-notes/go/standard'],
    datasets: ['data/strategy-seeds/go/standard-openings.json', 'data/strategy-seeds/go/standard-endgames.json']
  },
  { game: 'go', boardFamily: 'graph-topology', notes: ['data/strategy-notes/go/graph-topology'], datasets: [] },
  {
    game: 'reversi',
    boardFamily: 'standard',
    notes: ['data/strategy-notes/reversi/standard'],
    datasets: ['data/strategy-seeds/reversi/standard-openings.json', 'data/strategy-seeds/reversi/standard-endgames.json']
  },
  { game: 'reversi', boardFamily: 'graph-topology', notes: ['data/strategy-notes/reversi/graph-topology'], datasets: [] },
  {
    game: 'chinese-checkers',
    boardFamily: 'standard',
    notes: ['data/strategy-notes/chinese-checkers/standard'],
    datasets: ['data/strategy-seeds/chinese-checkers/standard-openings.json']
  },
  { game: 'chinese-checkers', boardFamily: 'graph-topology', notes: ['data/strategy-notes/chinese-checkers/graph-topology'], datasets: [] }
];

for (const job of jobs) {
  const outFile = new StrategyKnowledgeBuilder({
    game: job.game,
    boardFamily: job.boardFamily,
    notesDirs: job.notes,
    datasetFiles: job.datasets,
    manifestFiles: manifests,
    outputDir: `src/ai/knowledge/${job.game}/${job.boardFamily}`
  }).write();
  console.log(`Built ${job.game}/${job.boardFamily} -> ${outFile}`);
}
