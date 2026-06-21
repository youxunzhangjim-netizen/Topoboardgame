import { spawn } from 'node:child_process';
import { requireLocalExecutable } from '../../../src/ai/common/EngineAdapter.ts';

const edax = requireLocalExecutable('Edax', 'EDAX_PATH');
const args = process.argv.slice(2);
const engine = spawn(edax, args, { stdio: 'inherit' });
engine.on('exit', (code) => process.exit(code || 0));

