#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const data = 'local-data/smoke/ml-smoke-selfplay.jsonl';
const model = 'local-models/smoke-linear-robot.json';
execFileSync('node', ['research/selfplay.mjs', '--game', '2dchess', '--boundary', 'random', '--games', '4', '--maxPlies', '40', '--depth', '1', '--state', 'true', '--out', data], { stdio: 'inherit' });
execFileSync('node', ['research/ml/train-linear.mjs', '--in', data, '--out', model, '--epochs', '2', '--lr', '0.03'], { stdio: 'inherit' });
execFileSync('node', ['research/ml/evaluate-linear.mjs', '--model', model, '--in', data], { stdio: 'inherit' });
execFileSync('node', ['research/selfplay.mjs', '--game', '2dchess', '--boundary', 'random', '--games', '2', '--maxPlies', '30', '--botA', 'externalA', '--externalA', `node research/external-bots/linear-jsonl-robot.mjs --model ${model}`, '--botB', 'random', '--state', 'false', '--out', 'local-data/smoke/ml-smoke-external.jsonl'], { stdio: 'inherit' });
if (!fs.existsSync(model)) throw new Error('ML smoke model was not created.');
console.log(JSON.stringify({ ok: true, data, model }, null, 2));
