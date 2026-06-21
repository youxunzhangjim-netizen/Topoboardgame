import { spawn } from 'node:child_process';
import { requireLocalExecutable } from '../../../src/ai/common/EngineAdapter.ts';

const katago = requireLocalExecutable('KataGo', 'KATAGO_PATH');
const args = process.argv.slice(2);
const engine = spawn(katago, args.length ? args : ['gtp'], { stdio: 'pipe' });
engine.stdout.on('data', (chunk) => process.stdout.write(chunk));
engine.stderr.on('data', (chunk) => process.stderr.write(chunk));
console.log('KataGo started. Send GTP/analysis commands on stdin; no internet access is used.');
process.stdin.pipe(engine.stdin);

