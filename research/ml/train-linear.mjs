#!/usr/bin/env node
import { parseArgs, numberArg, stringArg } from '../lib/cli.mjs';
import { loadModel, loadTrainingExamples, saveModel, topWeights, trainLinearModel } from './linearModel.mjs';

const args = parseArgs();
if (args.help || args.h) {
  console.log(`Train a local linear policy/value robot from Topoboardgame self-play JSONL.\n\nUsage:\n  npm run ml:train-linear -- --in local-data/selfplay/run.jsonl --out local-models/2dchess-linear.json --epochs 12 --lr 0.05\n\nOptions:\n  --in PATH        self-play JSONL with move records and game summaries\n  --out PATH       model JSON output\n  --epochs N       SGD epochs\n  --lr X           learning rate\n  --l2 X           L2 regularization\n  --limit N        max move examples\n  --game GAME      optional game filter\n  --mode TEXT      optional mode substring filter\n  --baseModel PATH warm-start from an existing linear model\n`);
  process.exit(0);
}

const input = stringArg(args, 'in', stringArg(args, 'input', ''));
const out = stringArg(args, 'out', 'local-models/linear-robot.json');
if (!input) {
  console.error('Missing --in self-play JSONL file.');
  process.exit(2);
}
const examples = await loadTrainingExamples(input, {
  limit: numberArg(args, 'limit', Infinity, { min: 1, max: 100_000_000 }),
  gameFilter: stringArg(args, 'game', ''),
  modeFilter: stringArg(args, 'mode', '')
});
if (!examples.length) {
  console.error(`No trainable examples found in ${input}. Ensure you ran research:selfplay with --record moves --state true.`);
  process.exit(2);
}
const baseModelPath = stringArg(args, 'baseModel', stringArg(args, 'base', ''));
let baseModel = null;
if (baseModelPath) {
  try {
    baseModel = loadModel(baseModelPath);
  } catch (error) {
    console.error(`Could not load --baseModel ${baseModelPath}: ${error.message}`);
    process.exit(2);
  }
}
const model = trainLinearModel(examples, {
  epochs: numberArg(args, 'epochs', 10, { min: 1, max: 500 }),
  lr: Number(args.lr || 0.08),
  l2: Number(args.l2 || 0.0005),
  seed: stringArg(args, 'seed', 'linear-train'),
  baseModel,
  baseModelPath
});
model.training.input = input;
model.training.gameFilter = stringArg(args, 'game', '');
model.training.modeFilter = stringArg(args, 'mode', '');
model.training.topWeights = topWeights(model, 30);
saveModel(model, out);
console.log(JSON.stringify({ ok: true, input, out, baseModelPath, warmStarted: Boolean(baseModel), examples: examples.length, final: model.training.history.at(-1), topWeights: model.training.topWeights.slice(0, 10) }, null, 2));
