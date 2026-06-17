import fs from 'node:fs';
import path from 'node:path';
import { buildExample, chooseMoveWithModel, dotWeights, sigmoid } from './features.mjs';
import { readJsonl, ensureDirFor } from '../lib/jsonl.mjs';
import { ResearchRng } from '../lib/rng.mjs';

export const LINEAR_MODEL_SCHEMA = 'topoboardgame.ml.linear_policy_value.v1';

export async function loadTrainingExamples(inputPath, { limit = Infinity, gameFilter = '', modeFilter = '' } = {}) {
  const pending = new Map();
  const examples = [];
  for await (const rec of readJsonl(inputPath)) {
    if (rec.type === 'move') {
      if (gameFilter && rec.game !== gameFilter) continue;
      if (modeFilter && !modeKey(rec).includes(modeFilter)) continue;
      const key = `${rec.gameIndex}`;
      if (!pending.has(key)) pending.set(key, []);
      pending.get(key).push(rec);
    } else if (rec.type === 'game') {
      const key = `${rec.gameIndex}`;
      const moves = pending.get(key) || [];
      pending.delete(key);
      for (const moveRec of moves) {
        const label = resultLabel(rec.winner, moveRec.player);
        if (label === null) continue;
        examples.push(buildExample({
          game: moveRec.game,
          options: moveRec.options || {},
          player: moveRec.player,
          state: moveRec.state,
          move: moveRec.chosenMove,
          legalCount: moveRec.legalCount,
          label,
          source: { gameIndex: moveRec.gameIndex, ply: moveRec.ply, winner: rec.winner }
        }));
        if (examples.length >= limit) return examples;
      }
    }
  }
  return examples;
}

export function trainLinearModel(examples, options = {}) {
  const epochs = Math.max(1, Number(options.epochs) || 8);
  const lr = Number(options.lr) || 0.08;
  const l2 = Number(options.l2) || 0.0005;
  const seed = options.seed || 'linear-train';
  const rng = new ResearchRng(seed);
  const weights = Object.create(null);
  const indices = examples.map((_, i) => i);
  const history = [];
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    shuffle(indices, rng);
    let loss = 0;
    for (const index of indices) {
      const ex = examples[index];
      const y = Number(ex.label);
      const raw = dotWeights(weights, ex.features);
      const p = sigmoid(raw);
      const err = p - y;
      loss += -(y * Math.log(Math.max(1e-8, p)) + (1 - y) * Math.log(Math.max(1e-8, 1 - p)));
      for (const [key, value] of Object.entries(ex.features)) {
        weights[key] = (weights[key] || 0) - lr * (err * value + l2 * (weights[key] || 0));
      }
    }
    const metrics = evaluateLinearWeights(weights, examples);
    history.push({ epoch: epoch + 1, loss: Number((loss / Math.max(1, examples.length)).toFixed(6)), ...metrics });
  }
  return {
    schema: LINEAR_MODEL_SCHEMA,
    createdAt: new Date().toISOString(),
    modelType: 'linear-logistic-policy-value',
    weights: Object.fromEntries(Object.entries(weights).filter(([, value]) => Math.abs(value) > 1e-8).sort((a, b) => a[0].localeCompare(b[0]))),
    training: {
      examples: examples.length,
      epochs,
      lr,
      l2,
      history,
      featureCount: Object.keys(weights).length
    }
  };
}

export function evaluateLinearWeights(weights, examples) {
  let logLoss = 0;
  let correct = 0;
  let count = 0;
  let brier = 0;
  for (const ex of examples) {
    const y = Number(ex.label);
    if (!Number.isFinite(y)) continue;
    const p = sigmoid(dotWeights(weights, ex.features));
    logLoss += -(y * Math.log(Math.max(1e-8, p)) + (1 - y) * Math.log(Math.max(1e-8, 1 - p)));
    brier += (p - y) ** 2;
    if ((p >= 0.5 && y >= 0.5) || (p < 0.5 && y < 0.5)) correct += 1;
    count += 1;
  }
  return {
    examples: count,
    accuracy: count ? Number((correct / count).toFixed(4)) : 0,
    logLoss: count ? Number((logLoss / count).toFixed(6)) : null,
    brier: count ? Number((brier / count).toFixed(6)) : null
  };
}

export function chooseLinearRobotMove(model, request) {
  return chooseMoveWithModel(model, {
    game: request.game,
    options: request.options || {},
    player: request.player,
    state: request.state,
    legalMoves: request.legalMoves || []
  });
}

export function saveModel(model, outPath) {
  ensureDirFor(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(model, null, 2)}\n`);
}

export function loadModel(modelPath) {
  return JSON.parse(fs.readFileSync(modelPath, 'utf8'));
}

export function topWeights(model, n = 25) {
  return Object.entries(model.weights || {})
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, n)
    .map(([feature, weight]) => ({ feature, weight: Number(weight.toFixed(6)) }));
}

function resultLabel(winner, player) {
  const w = String(winner || '').toLowerCase();
  const p = String(player || '').toLowerCase();
  if (!w || w === 'unknown') return null;
  if (w === 'draw' || w === 'tie') return 0.5;
  if (w === 'sidea') return sideIndex(p) === 0 ? 1 : 0;
  if (w === 'sideb') return sideIndex(p) === 1 ? 1 : 0;
  return w === p ? 1 : 0;
}

function sideIndex(player) {
  const p = String(player || '').toLowerCase();
  return ['white', 'black'].includes(p) ? (p === 'white' ? 0 : 1) : (p === 'black' ? 0 : 1);
}

function modeKey(rec) {
  const opt = rec.options || {};
  return [rec.game || 'unknown', opt.boundary || opt.topology || 'default', opt.lattice || 'none', opt.dimension || ''].join('/');
}

function shuffle(items, rng) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
