import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const notesFile = process.argv[2] || 'data/chinese-checkers/notes/weights.json';
const outDir = process.argv[3] || 'src/ai/knowledge/chinese-checkers';
const overrides = existsSync(notesFile) ? JSON.parse(readFileSync(notesFile, 'utf8')) : {};
const baseFeatures = [
  ['totalGraphDistanceToGoal', -2.4],
  ['piecesInsideGoal', 5.0],
  ['piecesStillInStartingCamp', -3.0],
  ['longestAvailableJumpChain', 1.8],
  ['futureJumpChainPotential', 1.5],
  ['pieceConnectivity', 0.8],
  ['isolatedPiecePenalty', -1.2],
  ['opponentJumpOpportunityCreated', -1.8],
  ['ownGoalBlockingPenalty', -2.0]
];
const features = baseFeatures.map(([name, weight]) => ({
  name,
  weight: Number(overrides[name as string] ?? weight),
  appliesTo: ['standard', 'topology-transfer'],
  description: `Numeric Chinese Checkers strategy feature: ${name}.`
}));
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'graphBoardStrategyRules.json'), JSON.stringify({ schema: 'topoboardgame.ai.strategy_rules.v1', gameType: 'chinese-checkers', boardScope: 'graph-only', generatedAt: new Date().toISOString(), sources: ['local:user-notes', 'local:selfplay'], features }, null, 2));
console.log(`Built Chinese Checkers graph strategy rules -> ${outDir}`);

