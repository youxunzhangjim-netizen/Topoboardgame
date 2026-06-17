export const FEATURE_SCHEMA_VERSION = 'topoboardgame.ml.features.v1';

const PIECE_VALUES = Object.freeze({ p: 1, n: 3.2, b: 3.3, r: 5, q: 9, k: 0 });
const KNOWN_GAMES = ['2dchess', '2dgo', '2dreversi', '3dgo', '3dreversi'];

export function buildExample({ game, options = {}, player = '', state = null, move = null, legalCount = 0, label = null, source = null }) {
  return {
    schema: FEATURE_SCHEMA_VERSION,
    game,
    options,
    player,
    move,
    legalCount,
    label,
    source,
    features: extractFeatures({ game, options, player, state, move, legalCount })
  };
}

export function extractFeatures({ game, options = {}, player = '', state = null, move = null, legalCount = 0 }) {
  const f = Object.create(null);
  add(f, 'bias', 1);
  add(f, `game:${game || 'unknown'}`, 1);
  for (const known of KNOWN_GAMES) add(f, `game_is:${known}`, game === known ? 1 : 0);
  add(f, `player:${player || 'unknown'}`, 1);
  addCategorical(f, 'topology', options.topology || options.boundary || state?.topology || state?.boundary || 'default');
  addCategorical(f, 'boundary', options.boundary || state?.boundary || options.topology || state?.topology || 'default');
  addCategorical(f, 'lattice', options.lattice || state?.lattice || 'none');
  add(f, 'dimension', Number(options.dimension || state?.dimension || (String(game).startsWith('3d') ? 3 : 2)) / 3);
  add(f, 'board_size', Number(options.size || state?.size || 8) / 19);
  add(f, 'legal_count_log', Math.log1p(Number(legalCount) || 0) / 6);

  addStateFeatures(f, { game, state, player });
  addMoveFeatures(f, { game, options, state, move, player });
  addCrossFeatures(f, { game, options, move });
  return pruneFeatures(f);
}

export function normalizeMoveId(move) {
  if (!move) return '';
  if (typeof move === 'string') return move;
  return String(move.id || move.moveId || move.label || coordId(move.coord) || (move.from && move.to ? `${pointId(move.from)}>${pointId(move.to)}` : ''));
}

export function resultLabelForPlayer({ winner, player }) {
  const w = String(winner || '').toLowerCase();
  const p = String(player || '').toLowerCase();
  if (!w || ['unknown', ''].includes(w)) return null;
  if (['draw', 'tie'].includes(w)) return 0.5;
  if (w === p) return 1;
  if (w === 'sidea') return ['white', 'black'].includes(p) ? (p === 'white' || p === 'black' ? 1 : null) : null;
  if (w === 'sideb') return ['white', 'black'].includes(p) ? (p === 'white' || p === 'black' ? 0 : null) : null;
  return 0;
}

export function dotWeights(weights = {}, features = {}) {
  let score = Number(weights.bias || 0);
  for (const [key, value] of Object.entries(features)) {
    const w = Number(weights[key]);
    if (Number.isFinite(w)) score += w * value;
  }
  return score;
}

export function sigmoid(x) {
  if (x >= 35) return 1;
  if (x <= -35) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function scoreMoveWithModel(model, context) {
  const features = extractFeatures(context);
  const raw = dotWeights(model.weights || {}, features);
  return { raw, probability: sigmoid(raw), features };
}

export function chooseMoveWithModel(model, { game, options, player, state, legalMoves = [] }) {
  let best = null;
  const ranked = [];
  for (const move of legalMoves) {
    const scored = scoreMoveWithModel(model, { game, options, player, state, move, legalCount: legalMoves.length });
    const item = { move, moveId: normalizeMoveId(move), score: scored.raw, probability: scored.probability };
    ranked.push(item);
    if (!best || item.score > best.score) best = item;
  }
  ranked.sort((a, b) => b.score - a.score);
  return { move: best?.move || legalMoves[0] || null, moveId: best?.moveId || normalizeMoveId(legalMoves[0]), score: best?.score || 0, probability: best?.probability || 0.5, ranked };
}

function addStateFeatures(f, { game, state, player }) {
  if (!state || typeof state !== 'object') return;
  if (String(game).includes('chess')) return addChessStateFeatures(f, state, player);
  if (String(game).includes('go')) return addGoStateFeatures(f, state, player);
  if (String(game).includes('reversi')) return addReversiStateFeatures(f, state, player);
}

function addChessStateFeatures(f, state, player) {
  const board = Array.isArray(state.board) ? state.board : [];
  let ownMaterial = 0;
  let oppMaterial = 0;
  let ownPieces = 0;
  let oppPieces = 0;
  const ownPrefix = String(player || '').toLowerCase().startsWith('w') ? 'w' : 'b';
  for (const row of board) {
    for (const token of row || []) {
      if (!token || token === '.') continue;
      const color = String(token)[0].toLowerCase();
      const type = String(token)[1]?.toLowerCase() || 'p';
      const value = PIECE_VALUES[type] || 1;
      if (color === ownPrefix) { ownMaterial += value; ownPieces += 1; }
      else { oppMaterial += value; oppPieces += 1; }
      add(f, `chess_piece:${color}${type}`, 1 / 16);
    }
  }
  add(f, 'chess_material_balance', (ownMaterial - oppMaterial) / 39);
  add(f, 'chess_piece_count_balance', (ownPieces - oppPieces) / 16);
  add(f, 'chess_total_pieces', (ownPieces + oppPieces) / 32);
}

function addGoStateFeatures(f, state, player) {
  const board = Array.isArray(state.board) ? state.board : [];
  let black = 0, white = 0, empty = 0;
  for (const cell of board) {
    const text = String(cell || '');
    if (text.includes('black') || text === 'b' || text === 'B') black += 1;
    else if (text.includes('white') || text === 'w' || text === 'W') white += 1;
    else empty += 1;
  }
  const total = Math.max(1, black + white + empty);
  const sign = String(player).toLowerCase() === 'black' ? 1 : -1;
  add(f, 'go_stone_balance', sign * (black - white) / total);
  add(f, 'go_board_occupancy', (black + white) / total);
  add(f, 'go_empty_fraction', empty / total);
  const captures = state.captures || {};
  add(f, 'go_capture_balance', sign * ((Number(captures.black) || 0) - (Number(captures.white) || 0)) / 30);
  add(f, 'go_pass_count', (Number(state.passCount) || 0) / 2);
}

function addReversiStateFeatures(f, state, player) {
  const counts = state.counts || {};
  let black = Number(counts.black) || 0;
  let white = Number(counts.white) || 0;
  if ((!black && !white) && Array.isArray(state.board)) {
    for (const entry of state.board) {
      const value = Array.isArray(entry) ? entry[1] : entry;
      if (value === 'black') black += 1;
      else if (value === 'white') white += 1;
    }
  }
  const total = Math.max(1, black + white);
  const sign = String(player).toLowerCase() === 'black' ? 1 : -1;
  add(f, 'reversi_disc_balance', sign * (black - white) / Math.max(64, total));
  add(f, 'reversi_occupancy', total / 64);
  add(f, 'reversi_endgame_phase', Math.min(1, total / 64));
}

function addMoveFeatures(f, { game, options, state, move }) {
  if (!move || typeof move !== 'object') return;
  add(f, 'move_bias', 1);
  add(f, `move_type:${move.type || move.kind || inferMoveType(move)}`, 1);
  add(f, 'move_is_pass', move.type === 'pass' || move.id === 'pass' ? 1 : 0);
  add(f, 'move_capture_count', captureCount(move) / 10);
  add(f, 'move_flips_count', flipCount(move) / 20);
  add(f, 'move_promotion', move.promotion ? 1 : 0);
  add(f, 'move_check', move.givesCheck || move.isCheck ? 1 : 0);

  const coord = Array.isArray(move.coord) ? move.coord : move.to ? pointToCoord(move.to) : null;
  if (coord) addCoordFeatures(f, coord, Number(options.size || state?.size || 8), Number(options.dimension || state?.dimension || coord.length));

  if (move.piece?.type) add(f, `move_piece:${move.piece.type}`, 1);
  if (move.capturedPiece?.type) add(f, `move_captures_piece:${move.capturedPiece.type}`, 1);
  if (String(game).includes('chess') && move.from && move.to) addChessDeltaFeatures(f, move.from, move.to);
}

function addCrossFeatures(f, { game, options, move }) {
  const topology = String(options.topology || options.boundary || '').toLowerCase();
  const lattice = String(options.lattice || '').toLowerCase();
  if (!move || typeof move !== 'object') return;
  const isCapture = captureCount(move) > 0;
  const isEdge = Boolean(f.move_edge);
  add(f, `cross:${game}:${topology}`, 1);
  if (lattice) add(f, `cross:${game}:${topology}:${lattice}`, 1);
  if (isCapture) add(f, `cross:capture:${topology}`, 1);
  if (isEdge) add(f, `cross:edge:${topology}`, 1);
}

function addCoordFeatures(f, coord, size, dimension) {
  const n = Math.max(2, Number(size) || 8);
  const dims = Math.max(2, Number(dimension) || coord.length || 2);
  const normalized = coord.map((v) => Number(v) / Math.max(1, n - 1));
  const distEdge = Math.min(...normalized.map((v) => Math.min(v, 1 - v)));
  const centerDist = Math.sqrt(normalized.reduce((sum, v) => sum + (v - 0.5) ** 2, 0)) / Math.sqrt(dims * 0.25);
  const edge = distEdge <= 0.001;
  const nearEdge = distEdge <= 1 / Math.max(2, n - 1);
  const corner = normalized.every((v) => v <= 0.001 || v >= 0.999);
  add(f, 'move_center_closeness', 1 - centerDist);
  add(f, 'move_edge', edge ? 1 : 0);
  add(f, 'move_near_edge', nearEdge ? 1 : 0);
  add(f, 'move_corner_or_anchor', corner ? 1 : 0);
  coord.forEach((value, idx) => add(f, `coord_${idx}`, Number(value) / Math.max(1, n - 1)));
}

function addChessDeltaFeatures(f, from, to) {
  const a = pointToCoord(from);
  const b = pointToCoord(to);
  if (!a || !b) return;
  const dx = Math.abs((b[0] || 0) - (a[0] || 0));
  const dy = Math.abs((b[1] || 0) - (a[1] || 0));
  const dz = Math.abs((b[2] || 0) - (a[2] || 0));
  add(f, 'move_distance_manhattan', Math.min(1, (dx + dy + dz) / 8));
  add(f, 'move_is_long_range', dx + dy + dz >= 3 ? 1 : 0);
}

function captureCount(move) {
  if (!move || typeof move !== 'object') return 0;
  if (Number.isFinite(Number(move.captured))) return Number(move.captured);
  if (Array.isArray(move.captures)) return move.captures.length;
  if (Array.isArray(move.capturedStones)) return move.capturedStones.length;
  if (move.capturedPiece) return 1;
  if (move.capture) return 1;
  return 0;
}

function flipCount(move) {
  if (!move || typeof move !== 'object') return 0;
  if (Number.isFinite(Number(move.flips))) return Number(move.flips);
  if (Array.isArray(move.flips)) return move.flips.length;
  return 0;
}

function inferMoveType(move) {
  if (move.from && move.to) return 'move';
  if (move.coord) return 'place';
  return 'unknown';
}

function pointToCoord(point) {
  if (!point) return null;
  if (Array.isArray(point)) return point.map(Number);
  const out = [];
  for (const key of ['r', 'c', 'x', 'y', 'z', 'sheet']) {
    if (point[key] !== undefined) out.push(Number(point[key]));
  }
  return out.length ? out : null;
}

function pointId(point) { return pointToCoord(point)?.join(',') || ''; }
function coordId(coord) { return Array.isArray(coord) ? coord.join(',') : ''; }

function addCategorical(f, prefix, value) {
  add(f, `${prefix}:${String(value || 'default').toLowerCase()}`, 1);
}

function add(f, key, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return;
  f[key] = (f[key] || 0) + Math.max(-5, Math.min(5, n));
}

function pruneFeatures(features) {
  const out = {};
  for (const [key, value] of Object.entries(features)) {
    const n = Number(value);
    if (Number.isFinite(n) && n !== 0) out[key] = Number(n.toFixed(6));
  }
  return out;
}
