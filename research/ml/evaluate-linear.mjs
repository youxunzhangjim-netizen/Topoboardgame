#!/usr/bin/env node
import { parseArgs, numberArg, stringArg } from '../lib/cli.mjs';
import { evaluateLinearWeights, loadModel, loadTrainingExamples, topWeights } from './linearModel.mjs';

const args = parseArgs();
if (args.help || args.h) {
  console.log(`Evaluate a trained linear robot on self-play JSONL.\n\nUsage:\n  npm run ml:evaluate-linear -- --model local-models/2dchess-linear.json --in local-data/selfplay/valid.jsonl\n`);
  process.exit(0);
}
const modelPath = stringArg(args, 'model', '');
const input = stringArg(args, 'in', stringArg(args, 'input', ''));
if (!modelPath || !input) {
  console.error('Usage: npm run ml:evaluate-linear -- --model MODEL.json --in DATA.jsonl');
  process.exit(2);
}
const model = loadModel(modelPath);
const examples = await loadTrainingExamples(input, {
  limit: numberArg(args, 'limit', Infinity, { min: 1, max: 100_000_000 }),
  gameFilter: stringArg(args, 'game', ''),
  modeFilter: stringArg(args, 'mode', '')
});
const metrics = evaluateLinearWeights(model.weights || {}, examples);
console.log(JSON.stringify({ ok: true, model: modelPath, input, metrics, topWeights: topWeights(model, 20) }, null, 2));
