import { StrategyKnowledgeBuilder, type KnowledgeBoardFamily, type KnowledgeGame } from '../../../src/ai/common/StrategyKnowledgeBuilder.ts';

function arg(name: string, fallback = ''): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

const game = (arg('game', 'chinese-checkers') as KnowledgeGame);
const boardFamily = (arg('boardFamily', game === 'chinese-checkers' ? 'graph-topology' : 'standard') as KnowledgeBoardFamily);
const outputDir = arg('out', `src/ai/knowledge/${game}/${boardFamily}`);
const notes = arg('notes', game === 'chinese-checkers' ? 'data/chinese-checkers/notes' : '');
const datasets = arg('datasets', '');
const engines = arg('engineAnalysis', '');
const manifests = arg('manifests', 'src/ai/knowledge/manifest.json,src/ai/knowledge/internetSources.seed.json');

const builder = new StrategyKnowledgeBuilder({
  game,
  boardFamily,
  outputDir,
  notesDirs: notes ? notes.split(',') : [],
  datasetFiles: datasets ? datasets.split(',') : [],
  engineAnalysisFiles: engines ? engines.split(',') : [],
  manifestFiles: manifests ? manifests.split(',') : [],
  devAllowUrlFetch: process.argv.includes('--devAllowUrlFetch')
});

const outFile = builder.write();
console.log(`Built strategy knowledge -> ${outFile}`);

