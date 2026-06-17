#!/usr/bin/env node
import { parseArgs, numberArg, stringArg } from '../lib/cli.mjs';
import { JsonlWriter } from '../lib/jsonl.mjs';
import { loadTrainingExamples } from './linearModel.mjs';

const args = parseArgs();
const input = stringArg(args, 'in', stringArg(args, 'input', ''));
const out = stringArg(args, 'out', 'local-data/datasets/features.jsonl');
if (!input) {
  console.error('Usage: npm run ml:export-dataset -- --in local-data/selfplay/run.jsonl --out local-data/datasets/features.jsonl');
  process.exit(2);
}
const examples = await loadTrainingExamples(input, {
  limit: numberArg(args, 'limit', Infinity, { min: 1, max: 100_000_000 }),
  gameFilter: stringArg(args, 'game', ''),
  modeFilter: stringArg(args, 'mode', '')
});
const writer = new JsonlWriter(out);
for (const ex of examples) writer.write(ex);
await writer.close();
console.log(JSON.stringify({ ok: true, input, out, examples: examples.length }, null, 2));
