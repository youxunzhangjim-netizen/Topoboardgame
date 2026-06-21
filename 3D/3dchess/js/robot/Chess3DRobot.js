import { recordRobotLearningMove } from '../../../../js/shared/RobotLearningRecorder.js';

const PIECE_VALUES = { K: 20000, Q: 900, R: 500, B: 330, N: 320, P: 100 };
const PROMOTION_TYPES = ['Q', 'R', 'B', 'N'];

function other(color) { return color === 'white' ? 'black' : 'white'; }
function sigmoid(score, scale = 520) { return 1 / (1 + Math.exp(-score / scale)); }
function clonePiece(piece) { return piece ? { ...piece } : null; }
function cloneBoard(board) {
  if (!Array.isArray(board)) return board;
  return board.map((layer) => Array.isArray(layer)
    ? layer.map((row) => Array.isArray(row) ? row.map(clonePiece) : clonePiece(row))
    : clonePiece(layer));
}
function cloneState(game) {
  return {
    board: cloneBoard(game.board),
    currentPlayer: game.currentPlayer,
    gameOver: Boolean(game.gameOver),
    capturedPieces: JSON.parse(JSON.stringify(game.capturedPieces || { white: [], black: [] })),
    enPassantTarget: game.enPassantTarget ? JSON.parse(JSON.stringify(game.enPassantTarget)) : null,
    boundaryCondition: game.boundaryCondition || game.defaultBoundaryCondition?.() || 'unknown'
  };
}
function withState(game, state, fn) {
  const saved = {
    board: game.board,
    currentPlayer: game.currentPlayer,
    gameOver: game.gameOver,
    capturedPieces: game.capturedPieces,
    enPassantTarget: game.enPassantTarget
  };
  game.board = state.board;
  game.currentPlayer = state.currentPlayer;
  game.gameOver = state.gameOver;
  game.capturedPieces = state.capturedPieces;
  if ('enPassantTarget' in game) game.enPassantTarget = state.enPassantTarget;
  try { return fn(); }
  finally {
    game.board = saved.board;
    game.currentPlayer = saved.currentPlayer;
    game.gameOver = saved.gameOver;
    game.capturedPieces = saved.capturedPieces;
    if ('enPassantTarget' in game) game.enPassantTarget = saved.enPassantTarget;
  }
}
function coordFromIndices(game, a, b, c) {
  // Cube boards use board[z][y][x]. Surface boards use board[sheet][y][x].
  const isCube = typeof game.inBounds === 'function' && game.inBounds.length >= 3 && !('canonicalCoord' in game);
  return isCube ? { x: c, y: b, z: a } : { x: c, y: b, sheet: a };
}
function getPieceAtBoard(game, board, coord) {
  const layer = coord.z ?? coord.sheet ?? 0;
  return board?.[layer]?.[coord.y]?.[coord.x] || null;
}
function setPieceAtBoard(game, board, coord, piece) {
  const layer = coord.z ?? coord.sheet ?? 0;
  if (!board?.[layer]?.[coord.y]) return;
  board[layer][coord.y][coord.x] = piece;
}
function sameCoord(a, b) {
  return Number(a?.x) === Number(b?.x) && Number(a?.y) === Number(b?.y) && Number(a?.z ?? a?.sheet ?? 0) === Number(b?.z ?? b?.sheet ?? 0);
}
function moveId(move) {
  const f = move.from;
  const t = move.to;
  return `${f.x},${f.y},${f.z ?? f.sheet ?? 0}->${t.x},${t.y},${t.z ?? t.sheet ?? 0}${move.promotion ? '=' + move.promotion : ''}`;
}
function formatCoord(coord) {
  return `(${coord.x},${coord.y},${coord.z ?? coord.sheet ?? 0})`;
}
function moveLabel(move) {
  const piece = move.piece?.type || move.pieceType || '?';
  return `${piece} ${formatCoord(move.from)} → ${formatCoord(move.to)}${move.promotion ? '=' + move.promotion : ''}`;
}

function waitForBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function maybeYield(stats) {
  const t = nowMs();
  if (t - stats.lastYield < 12) return;
  await waitForBrowser();
  stats.lastYield = nowMs();
}
function nowMs() { return globalThis.performance?.now?.() ?? Date.now(); }
function makeStats(depth = 2, analysis = false) {
  const time = (analysis ? 1.4 : 1) * ({ 1: 90, 2: 260, 3: 620, 4: 1100 }[Math.max(1, Math.min(4, Number(depth) || 2))] || 420);
  return { nodes: 0, nodeLimit: analysis ? 90000 : 52000, deadline: nowMs() + time, lastYield: nowMs(), tt: new Map(), truncated: false };
}
function timeUp(stats) {
  if (!stats) return false;
  if (stats.nodes >= (stats.nodeLimit || Infinity) || nowMs() >= (stats.deadline || Infinity)) { stats.truncated = true; return true; }
  return false;
}

function allPieces(game, state, color = null) {
  const out = [];
  const board = state.board;
  for (let a = 0; a < board.length; a += 1) {
    const layer = board[a];
    if (!Array.isArray(layer)) continue;
    for (let y = 0; y < layer.length; y += 1) {
      const row = layer[y];
      if (!Array.isArray(row)) continue;
      for (let x = 0; x < row.length; x += 1) {
        const piece = row[x];
        if (!piece || (color && piece.color !== color)) continue;
        const coord = coordFromIndices(game, a, y, x);
        out.push({ ...coord, piece });
      }
    }
  }
  return out;
}

function legalMovesFor(game, state, color) {
  return withState(game, state, () => {
    const moves = [];
    for (const item of allPieces(game, state, color)) {
      const pieceMoves = game.getLegalMoves(item.x, item.y, item.z ?? item.sheet ?? 0) || [];
      for (const to of pieceMoves) {
        const target = { x: to.x, y: to.y, ...(to.z !== undefined ? { z: to.z } : { sheet: to.sheet ?? 0 }) };
        const promotion = item.piece.type === 'P' && game.isPromotionSquare?.(item.piece.color, target.x, target.y, target.z ?? target.sheet ?? 0) ? 'Q' : null;
        moves.push({
          from: { x: item.x, y: item.y, ...(item.z !== undefined ? { z: item.z } : { sheet: item.sheet ?? 0 }) },
          to: target,
          piece: { ...item.piece },
          capturedPiece: getPieceAtBoard(game, state.board, to.capturePos || target),
          castling: to.castling || null,
          capturePos: to.capturePos || null,
          enPassant: Boolean(to.enPassant),
          promotion,
          raw: to
        });
      }
    }
    return moves;
  });
}

function simulateMove(game, state, move) {
  const next = cloneState({ ...game, board: state.board, currentPlayer: state.currentPlayer, gameOver: state.gameOver, capturedPieces: state.capturedPieces, enPassantTarget: state.enPassantTarget });
  const piece = getPieceAtBoard(game, next.board, move.from);
  if (!piece) return next;
  const moving = { ...piece, hasMoved: true };
  const target = move.to;
  const captureCoord = move.capturePos || target;
  const captured = getPieceAtBoard(game, next.board, captureCoord);
  setPieceAtBoard(game, next.board, move.from, null);
  if (move.capturePos) setPieceAtBoard(game, next.board, move.capturePos, null);
  if (move.promotion && PROMOTION_TYPES.includes(move.promotion)) {
    moving.type = move.promotion;
    moving.display = moving.color === 'white' ? move.promotion : move.promotion.toLowerCase();
  }
  setPieceAtBoard(game, next.board, target, moving);
  if (move.castling) {
    const rook = getPieceAtBoard(game, next.board, move.castling.rookFrom);
    setPieceAtBoard(game, next.board, move.castling.rookFrom, null);
    setPieceAtBoard(game, next.board, move.castling.rookTo, rook ? { ...rook, hasMoved: true } : null);
  }
  if (captured) next.capturedPieces[moving.color]?.push?.(captured.type || captured.display || '?');
  next.currentPlayer = other(state.currentPlayer);
  next.enPassantTarget = null;
  return next;
}

function boardCenter(game, state) {
  const layerCount = state.board.length || 1;
  const rows = state.board[0]?.length || 1;
  const cols = state.board[0]?.[0]?.length || 1;
  return { x: (cols - 1) / 2, y: (rows - 1) / 2, z: (layerCount - 1) / 2 };
}
function topologyName(game) {
  const doc = globalThis.document;
  const v = doc?.getElementById?.('boardGameSelect')?.value || game.variant || game.boundaryCondition || game.defaultBoundaryCondition?.() || 'cube';
  const b = doc?.getElementById?.('boundarySelect')?.value || game.boundaryCondition || game.variant || '';
  return `${v}:${b}`;
}
function pieceDynamicValue(game, state, entry) {
  const piece = entry.piece;
  let value = PIECE_VALUES[piece.type] || 0;
  const moves = withState(game, state, () => game.getLegalMoves(entry.x, entry.y, entry.z ?? entry.sheet ?? 0)?.length || 0);
  value += 5 * moves;
  const center = boardCenter(game, state);
  const z = entry.z ?? entry.sheet ?? 0;
  const distance = Math.abs(entry.x - center.x) + Math.abs(entry.y - center.y) + Math.abs(z - center.z);
  value += Math.max(0, 40 - 5 * distance);
  const topo = topologyName(game);
  if (topo.includes('periodic') || topo.includes('torus') || topo.includes('t3')) {
    if (piece.type === 'R' || piece.type === 'Q') value += 35 + 4 * moves;
    if (piece.type === 'B') value += 20 + 3 * moves;
  }
  if (topo.includes('reflection')) {
    if (piece.type === 'R') value -= 45; // reflection does not give rook extra movement; user correction.
    if (piece.type === 'B' || piece.type === 'Q') value += 15;
  }
  if (topo.includes('sphere') || topo.includes('rp2') || topo.includes('mobius') || topo.includes('klein')) {
    value += 3 * moves;
    if (piece.type === 'K' && moves < 4) value -= 120;
  }
  return Math.round(value);
}
function materialScore(game, state, color) {
  return allPieces(game, state, color).reduce((sum, entry) => sum + pieceDynamicValue(game, state, entry), 0);
}
function kingSafety(game, state, color) {
  const king = allPieces(game, state, color).find((entry) => entry.piece.type === 'K');
  if (!king) return -999999;
  const enemyMoves = legalMovesFor(game, state, other(color));
  const attacksKingRegion = enemyMoves.filter((m) => Math.abs(m.to.x - king.x) <= 1 && Math.abs(m.to.y - king.y) <= 1 && Math.abs((m.to.z ?? m.to.sheet ?? 0) - (king.z ?? king.sheet ?? 0)) <= 1).length;
  return -70 * attacksKingRegion;
}
function mobility(game, state, color) { return 7 * legalMovesFor(game, state, color).length; }
function evaluate(game, state, color) {
  const opponent = other(color);
  let score = 0;
  score += materialScore(game, state, color) - materialScore(game, state, opponent);
  score += mobility(game, state, color) - mobility(game, state, opponent);
  score += kingSafety(game, state, color) - kingSafety(game, state, opponent);
  if (withState(game, state, () => game.isInCheck?.(opponent))) score += 90;
  if (withState(game, state, () => game.isInCheck?.(color))) score -= 140;
  return score;
}
function moveOrderingScore(move) {
  let score = 0;
  if (move.capturedPiece) score += 10 * (PIECE_VALUES[move.capturedPiece.type] || 0) - (PIECE_VALUES[move.piece?.type] || 0);
  if (move.promotion) score += 850;
  if (move.castling) score += 60;
  return score;
}
function negamax(game, state, depth, alpha, beta, color, rootColor, stats) {
  stats.nodes += 1;
  if (timeUp(stats)) return { score: evaluate(game, state, rootColor), move: null };
  if (depth <= 0 || state.gameOver) return { score: evaluate(game, state, rootColor), move: null };
  const moves = legalMovesFor(game, state, color).sort((a, b) => moveOrderingScore(b) - moveOrderingScore(a));
  if (!moves.length) return { score: evaluate(game, state, rootColor) - (color === rootColor ? 500 : -500), move: null };
  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const move of moves.slice(0, depth >= 3 ? 34 : 90)) {
    const next = simulateMove(game, state, move);
    const result = negamax(game, next, depth - 1, -beta, -alpha, other(color), rootColor, stats);
    const score = -result.score;
    if (score > bestScore) { bestScore = score; bestMove = move; }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return { score: bestScore, move: bestMove };
}

async function negamaxAsync(game, state, depth, alpha, beta, color, rootColor, stats) {
  stats.nodes += 1;
  if ((stats.nodes & 31) === 0) await maybeYield(stats);
  if (timeUp(stats)) return { score: evaluate(game, state, rootColor), move: null };
  if (depth <= 0 || state.gameOver) return { score: evaluate(game, state, rootColor), move: null };
  const moves = legalMovesFor(game, state, color).sort((a, b) => moveOrderingScore(b) - moveOrderingScore(a));
  if (!moves.length) return { score: evaluate(game, state, rootColor) - (color === rootColor ? 500 : -500), move: null };
  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const move of moves.slice(0, depth >= 3 ? 34 : 90)) {
    const next = simulateMove(game, state, move);
    const result = await negamaxAsync(game, next, depth - 1, -beta, -alpha, other(color), rootColor, stats);
    const score = -result.score;
    if (score > bestScore) { bestScore = score; bestMove = move; }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return { score: bestScore, move: bestMove };
}

function explainMove(game, before, move, scoreBefore, scoreAfter) {
  const reasons = [];
  if (move.capturedPiece) reasons.push(`captures ${move.capturedPiece.type}`);
  if (move.promotion) reasons.push(`promotes to ${move.promotion}`);
  if (move.castling) reasons.push('castles for king safety');
  if (scoreAfter > scoreBefore + 80) reasons.push('improves engine score');
  const topo = topologyName(game);
  if (topo.includes('periodic') || topo.includes('torus') || topo.includes('t3')) reasons.push('evaluates wrap-cycle mobility');
  if (topo.includes('reflection')) reasons.push(move.piece?.type === 'R' ? 'rook is not boosted in reflection mode' : 'checks reflection-boundary pressure');
  if (topo.includes('random')) reasons.push('uses actual random-boundary legal graph');
  if (topo.includes('sphere') || topo.includes('rp2') || topo.includes('mobius') || topo.includes('klein')) reasons.push('uses the embedded surface legal moves');
  return reasons.length ? reasons : ['best searched legal move'];
}
function analyze(game, depth = 2) {
  const state = cloneState(game);
  const player = state.currentPlayer;
  const scoreBefore = evaluate(game, state, player);
  const moves = legalMovesFor(game, state, player).sort((a, b) => moveOrderingScore(b) - moveOrderingScore(a)).slice(0, depth >= 3 ? 80 : 180);
  const rows = [];
  let nodes = 0;
  for (const move of moves) {
    const next = simulateMove(game, state, move);
    const stats = makeStats(depth, true);
    const result = depth <= 1 ? { score: evaluate(game, next, player) } : negamax(game, next, depth - 1, -Infinity, Infinity, other(player), player, stats);
    nodes += stats.nodes;
    const score = -result.score;
    rows.push({ move, score, winRate: sigmoid(score), reasons: explainMove(game, state, move, scoreBefore, score) });
  }
  rows.sort((a, b) => b.score - a.score);
  const pieces = allPieces(game, state, player).map((entry) => ({ label: `${entry.piece.type} ${formatCoord(entry)}`, value: pieceDynamicValue(game, state, entry) })).sort((a, b) => b.value - a.value).slice(0, 12);
  return { player, depth, currentScore: scoreBefore, currentWinRate: sigmoid(scoreBefore), topMoves: rows.slice(0, 5), badMoves: rows.slice(-5).reverse(), pieces, nodes };
}

export async function analyze3DChessPosition(game, depth = 2) {
  const state = cloneState(game);
  const player = state.currentPlayer;
  const scoreBefore = evaluate(game, state, player);
  const moves = legalMovesFor(game, state, player).sort((a, b) => moveOrderingScore(b) - moveOrderingScore(a)).slice(0, depth >= 3 ? 80 : 180);
  const rows = [];
  let nodes = 0;
  const yieldStats = makeStats(depth, true);
  for (const move of moves) {
    await maybeYield(yieldStats);
    const next = simulateMove(game, state, move);
    const stats = makeStats(depth, true);
    stats.lastYield = yieldStats.lastYield;
    const result = depth <= 1 ? { score: evaluate(game, next, player) } : await negamaxAsync(game, next, depth - 1, -Infinity, Infinity, other(player), player, stats);
    yieldStats.lastYield = stats.lastYield;
    nodes += stats.nodes;
    const score = -result.score;
    rows.push({ move, score, winRate: sigmoid(score), reasons: explainMove(game, state, move, scoreBefore, score) });
  }
  rows.sort((a, b) => b.score - a.score);
  const pieces = allPieces(game, state, player).map((entry) => ({ label: `${entry.piece.type} ${formatCoord(entry)}`, value: pieceDynamicValue(game, state, entry) })).sort((a, b) => b.value - a.value).slice(0, 12);
  return { player, depth, currentScore: scoreBefore, currentWinRate: sigmoid(scoreBefore), topMoves: rows.slice(0, 5), badMoves: rows.slice(-5).reverse(), pieces, nodes };
}


export async function choose3DChessRobotMove(game, depth = 2) {
  const state = cloneState(game);
  const player = state.currentPlayer;
  const stats = makeStats(depth, false);
  const moves = legalMovesFor(game, state, player)
    .sort((a, b) => moveOrderingScore(b) - moveOrderingScore(a))
    .slice(0, depth >= 3 ? 34 : 90);
  if (!moves.length) return { move: null, score: evaluate(game, state, player), nodes: 0, truncated: false };
  let best = { move: moves[0], score: -Infinity };
  let completedDepth = 0;
  for (let d = 1; d <= Math.max(1, Math.min(4, Number(depth) || 2)); d += 1) {
    let iterationBest = null;
    for (const move of moves) {
      if (timeUp(stats)) break;
      await maybeYield(stats);
      const next = simulateMove(game, state, move);
      const result = d <= 1 ? { score: evaluate(game, next, player) } : await negamaxAsync(game, next, d - 1, -Infinity, Infinity, other(player), player, stats);
      const score = -result.score;
      if (!iterationBest || score > iterationBest.score) iterationBest = { move, score };
    }
    if (iterationBest && !stats.truncated) { best = iterationBest; completedDepth = d; }
    if (timeUp(stats)) break;
  }
  if (!Number.isFinite(best.score) || best.score === -Infinity) {
    const move = moves[0];
    const next = simulateMove(game, state, move);
    best = { move, score: evaluate(game, next, player) };
  }
  return { ...best, nodes: stats.nodes, truncated: stats.truncated, completedDepth };
}

function liveLegalMoveFor(game, move) {
  if (!move?.from || !move?.to) return null;
  const fromLayer = move.from.z ?? move.from.sheet ?? 0;
  const moves = game.getLegalMoves?.(move.from.x, move.from.y, fromLayer) || [];
  return moves.find((candidate) => sameCoord(candidate, move.to)) || null;
}

function livePromotionFor(game, move, liveMove) {
  const fromLayer = move.from.z ?? move.from.sheet ?? 0;
  const targetLayer = liveMove.z ?? liveMove.sheet ?? move.to.z ?? move.to.sheet ?? 0;
  const piece = game.getPiece?.(move.from.x, move.from.y, fromLayer);
  if (piece?.type !== 'P') return null;
  if (!game.isPromotionSquare?.(piece.color, liveMove.x, liveMove.y, targetLayer)) return null;
  return PROMOTION_TYPES.includes(move.promotion) ? move.promotion : 'Q';
}

function renderAnalysis(panel, analysis) {
  const fmt = (score) => `${score >= 0 ? '+' : ''}${(score / 100).toFixed(2)}`;
  panel.innerHTML = `
    <h3>3D Chess Robot Analysis</h3>
    <p><strong>${analysis.player}</strong> to move · score ${fmt(analysis.currentScore)} · win estimate ${(analysis.currentWinRate * 100).toFixed(1)}% · nodes ${analysis.nodes}</p>
    <h4>Top moves</h4>
    <ol>${analysis.topMoves.map((r) => `<li><strong>${moveLabel(r.move)}</strong> — ${fmt(r.score)}, ${(r.winRate * 100).toFixed(1)}%<br><span>${r.reasons.join('; ')}</span></li>`).join('')}</ol>
    <h4>Bad moves</h4>
    <ol>${analysis.badMoves.map((r) => `<li>${moveLabel(r.move)} — ${fmt(r.score)}<br><span>${r.reasons.join('; ')}</span></li>`).join('')}</ol>
    <h4>Current dynamic piece values</h4>
    <div class="robot-chip-list">${analysis.pieces.map((p) => `<span class="robot-chip">${p.label}: ${p.value}</span>`).join('')}</div>`;
}

export function installChess3DRobot(shell) {
  const game = shell?.activeGame || shell || window.game;
  if (!game || game.__robot3dInstalled) return;
  game.__robot3dInstalled = true;
  const modeSelect = document.getElementById('gameModeSelect');
  const onlineStatus = document.getElementById('onlineColorStatus');
  const sidebar = document.querySelector('.sidebar');
  if (modeSelect && !modeSelect.querySelector('option[value="robot"]')) {
    modeSelect.insertAdjacentHTML('beforeend', '<option value="robot">Robot</option>');
  }
  const panel = document.createElement('section');
  panel.className = 'panel robot-panel';
  panel.innerHTML = `
    <h3>Robot & Analysis</h3>
    <div class="robot-row"><label>Robot side</label><select id="robotSideSelect"><option value="black">Black</option><option value="white">White</option></select></div>
    <div class="robot-row"><label>Strength</label><select id="robotDepthSelect"><option value="1">Depth 1</option><option value="2" selected>Depth 2</option><option value="3">Depth 3</option><option value="4">Depth 4</option></select></div>
    <div class="control-grid robot-buttons"><button id="robotMoveBtn" type="button">Robot Move</button><button id="robotAnalyzeBtn" type="button">Analyze Position</button></div>
    <div class="robot-analysis" id="robotAnalysisPanel">Choose Robot, or click Analyze Position.</div>`;
  const historyPanel = document.getElementById('moveHistoryList')?.closest('.panel');
  if (historyPanel?.parentElement) historyPanel.insertAdjacentElement('afterend', panel);
  else sidebar?.appendChild(panel);
  const sideSelect = panel.querySelector('#robotSideSelect');
  const depthSelect = panel.querySelector('#robotDepthSelect');
  const analysisPanel = panel.querySelector('#robotAnalysisPanel');
  let thinking = false;
  function isRobotMode() { return modeSelect?.value === 'robot'; }
  function robotSide() { return sideSelect?.value || 'black'; }
  async function makeRobotMove() {
    if (thinking || !isRobotMode() || game.gameOver || game.currentPlayer !== robotSide()) return;
    const depth = Math.max(1, Number(depthSelect?.value) || 2);
    analysisPanel.textContent = 'Robot is thinking...';
    thinking = true;
    await waitForBrowser();
    try {
      const result = await choose3DChessRobotMove(game, depth);
      const move = result.move;
      const liveMove = liveLegalMoveFor(game, move);
      if (move && liveMove) {
        analysisPanel.textContent = `Robot found ${moveLabel(move)} at score ${((result.score || 0) / 100).toFixed(2)}; nodes ${result.nodes}${result.truncated ? ' (time-limited)' : ''}.`;
        const applied = await game.applyMove({
          from: move.from,
          to: liveMove,
          promotion: livePromotionFor(game, move, liveMove)
        }, { robot: true });
        if (applied) {
          recordRobotLearningMove({
            gameType: 'chess',
            variant: '3d',
            topology: game.boundaryCondition || game.topology || game.constructor?.name || '3d',
            player: robotSide(),
            robot: `depth-${depth}`,
            move: { from: move.from, to: liveMove, label: moveLabel(move), promotion: livePromotionFor(game, move, liveMove) },
            score: result.score,
            result: game.gameOver ? { gameOver: true, winner: game.winner || null, draw: Boolean(game.draw) } : null
          });
        }
      } else if (move) {
        analysisPanel.textContent = 'Robot move was rejected by the current board rules.';
      } else {
        analysisPanel.textContent = 'Robot found no legal move.';
      }
    } finally {
      thinking = false;
    }
  }
  function scheduleRobotMove() { if (isRobotMode()) window.setTimeout(makeRobotMove, 180); }
  panel.querySelector('#robotMoveBtn')?.addEventListener('click', makeRobotMove);
  panel.querySelector('#robotAnalyzeBtn')?.addEventListener('click', async () => {
    if (thinking) return;
    thinking = true;
    analysisPanel.textContent = 'Robot is analyzing...';
    await waitForBrowser();
    try {
      renderAnalysis(analysisPanel, await analyze3DChessPosition(game, Math.max(1, Number(depthSelect?.value) || 2)));
    } finally {
      thinking = false;
    }
  });
  sideSelect?.addEventListener('change', scheduleRobotMove);
  modeSelect?.addEventListener('change', () => {
    const robot = isRobotMode();
    if (onlineStatus && robot) onlineStatus.textContent = `Local robot active (${robotSide()} robot)`;
    document.getElementById('onlineControls')?.classList.toggle('active', modeSelect.value === 'online');
    scheduleRobotMove();
  });
  const originalApplyMove = game.applyMove.bind(game);
  game.applyMove = async function patchedApplyMove(...args) {
    const result = await originalApplyMove(...args);
    if (result) scheduleRobotMove();
    return result;
  };
  scheduleRobotMove();
}
