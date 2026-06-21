import { spawn } from 'node:child_process';
import { requireLocalExecutable } from '../../../src/ai/common/EngineAdapter.ts';

const fen = process.argv.slice(2).join(' ') || 'startpos';
const stockfish = requireLocalExecutable('Stockfish', 'STOCKFISH_PATH');
const engine = spawn(stockfish, [], { stdio: 'pipe' });
let bestMove = '';
const topMoves: string[] = [];

engine.stdout.on('data', (chunk) => {
  const text = String(chunk);
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('info') && line.includes(' pv ')) topMoves.push(line);
    if (line.startsWith('bestmove ')) {
      bestMove = line.split(/\s+/)[1] || '';
      console.log(JSON.stringify({ bestMove, topMoves: topMoves.slice(-8) }, null, 2));
      engine.kill();
    }
  }
});
engine.stdin.write('uci\n');
engine.stdin.write(`position ${fen === 'startpos' ? 'startpos' : `fen ${fen}`}\n`);
engine.stdin.write('go depth 12\n');

