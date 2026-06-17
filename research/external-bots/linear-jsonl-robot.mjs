#!/usr/bin/env node
import fs from 'node:fs';
import { chooseLinearRobotMove, loadModel } from '../ml/linearModel.mjs';
import { stringArg, parseArgs } from '../lib/cli.mjs';

const args = parseArgs();
const modelPath = stringArg(args, 'model', process.env.TOPOBOT_MODEL || 'local-models/linear-robot.json');
let model;
try { model = loadModel(modelPath); }
catch (error) {
  console.error(`[linear-jsonl-robot] failed to load model ${modelPath}: ${error.message}`);
  process.exit(2);
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let index;
  while ((index = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    handleLine(line);
  }
});

function handleLine(line) {
  let msg;
  try { msg = JSON.parse(line); }
  catch { return; }
  if (msg.type !== 'move') return;
  const legalMoves = Array.isArray(msg.legalMoves) ? msg.legalMoves : [];
  if (!legalMoves.length) {
    write({ requestId: msg.requestId, moveId: null, error: 'no-legal-moves' });
    return;
  }
  const result = chooseLinearRobotMove(model, msg);
  write({
    requestId: msg.requestId,
    moveId: result.moveId,
    score: result.score,
    probability: result.probability,
    nodes: legalMoves.length,
    info: {
      model: modelPath,
      top: result.ranked.slice(0, 5).map((item) => ({ moveId: item.moveId, score: Number(item.score.toFixed(4)), p: Number(item.probability.toFixed(4)) }))
    }
  });
}

function write(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}
