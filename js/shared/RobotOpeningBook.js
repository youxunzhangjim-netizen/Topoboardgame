const CHESS_EXACT_BOOK = Object.freeze({
  '0:white': [
    { key: 'e2e4', score: 150, name: 'King pawn opening' },
    { key: 'd2d4', score: 142, name: "Queen's pawn opening" },
    { key: 'g1f3', score: 124, name: 'Reti knight development' },
    { key: 'c2c4', score: 120, name: 'English opening' }
  ],
  '1:black': [
    { key: 'e7e5', score: 148, name: 'Open game reply' },
    { key: 'c7c5', score: 146, name: 'Sicilian defense' },
    { key: 'e7e6', score: 132, name: 'French defense' },
    { key: 'c7c6', score: 126, name: 'Caro-Kann defense' },
    { key: 'd7d5', score: 124, name: 'Queen pawn challenge' },
    { key: 'g8f6', score: 118, name: 'Indian knight development' }
  ],
  '2:white': [
    { key: 'g1f3', score: 142, name: 'Develop king knight' },
    { key: 'c2c4', score: 134, name: 'Queen-side space' },
    { key: 'c1g5', score: 124, name: 'Bishop pin development' },
    { key: 'f1c4', score: 122, name: 'Italian bishop development' },
    { key: 'f1b5', score: 121, name: 'Spanish bishop development' },
    { key: 'd2d4', score: 120, name: 'Central break' },
    { key: 'g2g3', score: 102, name: 'Fianchetto plan' }
  ],
  '3:black': [
    { key: 'b8c6', score: 140, name: 'Develop queen knight' },
    { key: 'g8f6', score: 137, name: 'Develop king knight' },
    { key: 'f8c5', score: 118, name: 'Active bishop development' },
    { key: 'f8b4', score: 114, name: 'Bishop pressure' },
    { key: 'd7d6', score: 108, name: 'Solid center support' },
    { key: 'e7e6', score: 106, name: 'Flexible pawn support' }
  ],
  '4:white': [
    { key: 'f1c4', score: 128, name: 'Italian development' },
    { key: 'f1b5', score: 128, name: 'Spanish pressure' },
    { key: 'b1c3', score: 122, name: 'Queen knight development' },
    { key: 'e1g1', score: 118, name: 'Castle king side' },
    { key: 'c2c3', score: 98, name: 'Central support' }
  ],
  '5:black': [
    { key: 'g8f6', score: 126, name: 'King knight development' },
    { key: 'f8c5', score: 118, name: 'Active bishop development' },
    { key: 'e8g8', score: 116, name: 'Castle king side' },
    { key: 'd7d6', score: 106, name: 'Central support' },
    { key: 'a7a6', score: 88, name: 'Bishop question' }
  ],
  '6:white': [
    { key: 'e1g1', score: 128, name: 'Castle king side' },
    { key: 'd2d3', score: 104, name: 'Central support' },
    { key: 'c2c3', score: 102, name: 'Central support' },
    { key: 'b1c3', score: 100, name: 'Queen knight development' }
  ],
  '7:black': [
    { key: 'e8g8', score: 128, name: 'Castle king side' },
    { key: 'd7d6', score: 106, name: 'Central support' },
    { key: 'a7a6', score: 90, name: 'Queen-side question' },
    { key: 'h7h6', score: 80, name: 'King-side luft' }
  ]
});

const PIECE_VALUES = Object.freeze({ P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 });
const LOCAL_OPENING_BOOKS = Object.freeze({
  chess: CHESS_EXACT_BOOK,
  go: Object.freeze({ corner: 130, approach: 116, settle: 98, center: 58 }),
  reversi: Object.freeze({ centerShell: 128, balancedDisc: 92, cornerOrAnchor: 104 }),
  jump: Object.freeze({ homeClear: 82, targetEntry: 74, jumpRace: 54 })
});
const LOCAL_STRATEGY_BOOKS = Object.freeze({
  chess: Object.freeze({ centerControl: 1.2, kingSafety: 1.5, development: 0.9, material: 3.0 }),
  go: Object.freeze({ liberties: 1.1, territoryPotential: 1.2, captureThreat: 1.5 }),
  reversi: Object.freeze({ mobility: 1.4, frontierDiscs: -0.8, cornerOrAnchor: 2.0, parity: 0.6 }),
  jumpStandard: Object.freeze({ totalGraphDistanceToGoal: -2.4, piecesInsideGoal: 5.0, piecesStillInStartingCamp: -3.0, longestAvailableJumpChain: 1.8, ownGoalBlockingPenalty: -2.0 }),
  jumpGraph: Object.freeze({ graphDistanceToGoal: -2.2, futureJumpChainPotential: 1.5, pieceConnectivity: 0.8, isolatedPiecePenalty: -1.2, opponentJumpOpportunityCreated: -1.8 })
});
const LOCAL_ENDGAME_BOOKS = Object.freeze({
  chess: Object.freeze({ enabled: true, maxPieces: 7, fallback: 'engine' }),
  go: Object.freeze({ scoreLead: 2.0, ownershipSwing: 1.4, libertyPressure: 1.0 }),
  reversi: Object.freeze({ enabled: true, maxEmptySquares: 10, fallback: 'local-search' })
});

function coordKey(coord) {
  return Array.isArray(coord) ? coord.join(',') : '';
}

function manhattan(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  return a.reduce((sum, value, index) => sum + Math.abs(Number(value) - Number(b[index] || 0)), 0);
}

function cartesian(valuesByAxis) {
  return valuesByAxis.reduce((rows, values) => rows.flatMap((row) => values.map((value) => [...row, value])), [[]]);
}

function boardValueAt(logic, index) {
  if (!logic?.board) return 0;
  if (logic.board instanceof Map) return logic.board.get(index);
  return logic.board[index];
}

function isPlayable(logic, index) {
  return typeof logic?.isPlayableIndex === 'function' ? logic.isPlayableIndex(index) : true;
}

function logicMoveCount(logic) {
  if (Number.isFinite(Number(logic?.moveNumber))) return Math.max(0, Number(logic.moveNumber));
  if (Array.isArray(logic?.moveHistory)) {
    return logic.moveHistory.filter((entry) => entry?.type === 'move' || entry?.type === 'play' || entry?.type === 'pass').length;
  }
  return 0;
}

function boardDimsFromLogic(logic, sampleCoord = null) {
  const topology = logic?.topology && typeof logic.topology === 'object' ? logic.topology : {};
  const dimension = Math.max(2, Math.min(4, Number(topology.dimension || logic?.dimension || sampleCoord?.length || 2) || 2));
  const width = Number(topology.width || logic?.width || topology.size || logic?.size || 9) || 9;
  const height = Number(topology.height || logic?.height || topology.size || logic?.size || width) || width;
  const depth = Number(topology.depth || logic?.depth || topology.size || logic?.size || width) || width;
  const wSize = Number(topology.wSize || logic?.wSize || topology.size || logic?.size || width) || width;
  return [width, height, depth, wSize].slice(0, dimension);
}

function centerOfDims(dims) {
  return dims.map((size) => (size - 1) / 2);
}

function starOffset(size) {
  if (size >= 13) return 3;
  if (size >= 9) return 2;
  return Math.max(1, Math.floor((size - 1) / 3));
}

function nearestOccupiedDistance(logic, coord) {
  let best = Infinity;
  const board = logic?.board;
  if (!board || !Array.isArray(coord)) return best;
  for (let index = 0; index < board.length; index += 1) {
    if (!isPlayable(logic, index) || !boardValueAt(logic, index)) continue;
    const other = logic.coordFromIndex?.(index);
    if (Array.isArray(other)) best = Math.min(best, manhattan(coord, other));
  }
  return best;
}

function coordNearTargets(coord, targets) {
  let best = null;
  for (const target of targets) {
    const distance = manhattan(coord, target.coord);
    let weight = 0;
    if (distance === 0) weight = 1;
    else if (distance === 1) weight = 0.72;
    else if (distance === 2) weight = 0.38;
    if (weight <= 0) continue;
    const score = target.score * weight;
    if (!best || score > best.score) best = { ...target, score };
  }
  return best;
}

function chessVector(coord) {
  if (!coord) return null;
  if (Number.isFinite(Number(coord.r)) && Number.isFinite(Number(coord.c))) return [Number(coord.c), Number(coord.r)];
  if (Number.isFinite(Number(coord.x)) && Number.isFinite(Number(coord.y))) return [Number(coord.x), Number(coord.y), Number(coord.z ?? coord.sheet ?? 0)];
  return null;
}

function chessDims(state, legalMoves) {
  const board = state?.board;
  if (Array.isArray(board?.[0]?.[0])) {
    return [board[0][0].length || 8, board[0].length || 8, board.length || 1];
  }
  if (Array.isArray(board?.[0])) return [board[0].length || 8, board.length || 8];
  const vectors = (legalMoves || []).flatMap((move) => [chessVector(move.from), chessVector(move.to)]).filter(Boolean);
  if (!vectors.length) return [8, 8];
  const axes = Math.max(...vectors.map((coord) => coord.length));
  return Array.from({ length: axes }, (_, axis) => Math.max(1, ...vectors.map((coord) => coord[axis] || 0)) + 1);
}

function chessPieceAt(state, move) {
  const from = move?.from;
  if (!from) return move?.piece || null;
  if (Number.isFinite(Number(from.r)) && Number.isFinite(Number(from.c))) {
    return state?.board?.[from.r]?.[from.c] || move?.piece || null;
  }
  const layer = from.z ?? from.sheet ?? 0;
  return state?.board?.[layer]?.[from.y]?.[from.x] || move?.piece || null;
}

function chessMoveKey2D(move) {
  const from = move?.from;
  const to = move?.to;
  if (!from || !to || !Number.isFinite(Number(from.r)) || !Number.isFinite(Number(from.c))) return '';
  const square = (coord) => `${String.fromCharCode(97 + Number(coord.c))}${8 - Number(coord.r)}`;
  return `${square(from)}${square(to)}`;
}

function inferChessPly(state) {
  if (Array.isArray(state?.moveHistory)) {
    const count = state.moveHistory.filter((entry) => entry?.type !== 'setup').length;
    if (count > 0) return count;
  }
  let pieces = 0;
  let moved = 0;
  const visit = (cell) => {
    if (!cell || typeof cell !== 'object' || !cell.type) return;
    pieces += 1;
    if (cell.hasMoved) moved += 1;
  };
  const board = state?.board;
  if (Array.isArray(board?.[0]?.[0])) {
    for (const layer of board) for (const row of layer || []) for (const cell of row || []) visit(cell);
  } else if (Array.isArray(board?.[0])) {
    for (const row of board) for (const cell of row || []) visit(cell);
  }
  const capturedEstimate = Math.max(0, 32 - pieces);
  const parity = state?.currentPlayer === 'black' ? 1 : 0;
  return Math.max(parity, moved + capturedEstimate);
}

function chessPieceCount(state) {
  let count = 0;
  const visit = (cell) => { if (cell && typeof cell === 'object' && cell.type) count += 1; };
  const board = state?.board;
  if (Array.isArray(board?.[0]?.[0])) {
    for (const layer of board) for (const row of layer || []) for (const cell of row || []) visit(cell);
  } else if (Array.isArray(board?.[0])) {
    for (const row of board) for (const cell of row || []) visit(cell);
  }
  return count;
}

function appendKnowledgeName(names, name) {
  if (name && !names.includes(name)) names.push(name);
}

function localChessKnowledgeScore(state, move, player, legalMoves) {
  const names = [];
  const weights = LOCAL_STRATEGY_BOOKS.chess;
  const endgame = LOCAL_ENDGAME_BOOKS.chess;
  const piece = chessPieceAt(state, move);
  const type = move?.piece?.type || piece?.type || '';
  const from = chessVector(move?.from);
  const to = chessVector(move?.to);
  if (!from || !to || !type) return { score: 0, names };
  const dims = chessDims(state, legalMoves);
  const center = centerOfDims(dims);
  const centerGain = manhattan(from, center) - manhattan(to, center);
  let score = 0;
  if (centerGain > 0) {
    score += centerGain * 18 * weights.centerControl;
    appendKnowledgeName(names, 'local centerControl');
  }
  if ((type === 'N' || type === 'B') && !piece?.hasMoved) {
    score += 34 * weights.development;
    appendKnowledgeName(names, 'local development');
  }
  if (move.castling) {
    score += 56 * weights.kingSafety;
    appendKnowledgeName(names, 'local kingSafety');
  } else if (type === 'K') {
    score -= 32 * weights.kingSafety;
  }
  if (move.capturedPiece) {
    score += Math.min(90, (PIECE_VALUES[move.capturedPiece.type] || 0) / 12) * weights.material;
    appendKnowledgeName(names, 'local material');
  }
  if (move.promotion) {
    score += 48 * weights.material;
    appendKnowledgeName(names, 'local material');
  }
  if (endgame.enabled && chessPieceCount(state) <= endgame.maxPieces) {
    score += move.capturedPiece || move.promotion ? 80 : Math.max(0, centerGain) * 12;
    appendKnowledgeName(names, 'local endgame conversion');
  }
  return { score, names };
}

function openingName(baseName, names) {
  return names?.length ? baseName + ' (' + names.slice(0, 3).join(', ') + ')' : baseName;
}

function chessDevelopmentOpportunity(state, move, player, legalMoves) {
  const piece = chessPieceAt(state, move);
  const type = move?.piece?.type || piece?.type || '';
  const from = chessVector(move?.from);
  const to = chessVector(move?.to);
  if (!from || !to || !type) return 0;
  const dims = chessDims(state, legalMoves);
  const center = centerOfDims(dims);
  const beforeCenter = manhattan(from, center);
  const afterCenter = manhattan(to, center);
  const ply = inferChessPly(state);
  let score = Math.max(-35, Math.min(45, (beforeCenter - afterCenter) * 12));
  if (move.castling) score += 124;
  if (move.capturedPiece) score += Math.min(90, Math.max(0, (PIECE_VALUES[move.capturedPiece.type] || 0) / 7));
  if (move.promotion) score += 90;
  if (type === 'P') {
    const is2D = from.length === 2;
    const centralFile = is2D ? Math.abs(from[0] - 3.5) <= 0.75 : Math.abs(from[0] - center[0]) <= 1 && Math.abs((from[2] || 0) - (center[2] || 0)) <= 1;
    const doubleStep = Math.abs(to[1] - from[1]) >= 2;
    score += centralFile ? (doubleStep ? 78 : 52) : 20;
    if (ply <= 3 && centralFile) score += 16;
  } else if ((type === 'N' || type === 'B') && !piece?.hasMoved) {
    score += 70;
  } else if (type === 'Q' && ply < 6 && !move.capturedPiece) {
    score -= 42;
  } else if (type === 'R' && ply < 8 && !move.capturedPiece) {
    score -= 38;
  } else if (type === 'K' && !move.castling) {
    score -= 96;
  }
  if (player === 'white' && to[1] < from[1]) score += 12;
  if (player === 'black' && to[1] > from[1]) score += 12;
  return score;
}

export function chooseChessOpeningBookMove(state, legalMoves, player = state?.currentPlayer) {
  if (!Array.isArray(legalMoves) || !legalMoves.length) return null;
  const ply = inferChessPly(state);
  if (ply > 7) return null;
  const exactRows = LOCAL_OPENING_BOOKS.chess[`${ply}:${player}`] || [];
  let best = null;
  for (const move of legalMoves) {
    const exact = exactRows.find((entry) => entry.key === chessMoveKey2D(move));
    const opportunity = chessDevelopmentOpportunity(state, move, player, legalMoves);
    const local = localChessKnowledgeScore(state, move, player, legalMoves);
    const exactScore = exact ? exact.score : 0;
    const baseScore = exactScore ? exactScore + Math.max(0, opportunity * 0.35) : opportunity;
    const score = baseScore + local.score;
    if (!best || score > best.score) {
      const baseName = exact?.name || 'Opening development opportunity';
      best = { move, score, name: openingName(baseName, local.names), exact: Boolean(exact), knowledge: local.names };
    }
  }
  if (!best || best.score < (best.exact ? 80 : 86)) return null;
  return { ...best, ply, source: 'opening-book' };
}

function goCornerTargets(dims, phase) {
  const lows = dims.map((size) => starOffset(size));
  const highs = dims.map((size, axis) => Math.max(lows[axis], size - 1 - lows[axis]));
  const threes = dims.map((size, axis) => Math.max(1, lows[axis] - 1));
  const highThrees = dims.map((size, axis) => Math.min(size - 2, highs[axis] + 1));
  const targets = [];
  for (const coord of cartesian(dims.map((_, axis) => [lows[axis], highs[axis]]))) {
    targets.push({ coord, score: phase <= 1 ? LOCAL_OPENING_BOOKS.go.corner : 108, name: dims.length === 2 ? '4-4 fuseki corner' : '3D corner influence point' });
  }
  for (let axis = 0; axis < dims.length; axis += 1) {
    for (const base of cartesian(dims.map((_, i) => [lows[i], highs[i]]))) {
      const lowVariant = base.slice();
      lowVariant[axis] = base[axis] === lows[axis] ? threes[axis] : highThrees[axis];
      targets.push({ coord: lowVariant, score: phase <= 3 ? LOCAL_OPENING_BOOKS.go.approach : 92, name: dims.length === 2 ? '3-4 corner approach' : 'surface approach point' });
    }
  }
  for (const coord of cartesian(dims.map((_, axis) => [threes[axis], highThrees[axis]]))) {
    targets.push({ coord, score: phase <= 5 ? LOCAL_OPENING_BOOKS.go.settle : 78, name: dims.length === 2 ? '3-3 corner settle' : 'compact corner settle' });
  }
  if (phase >= 2) {
    const center = dims.map((size) => Math.floor(size / 2));
    targets.push({ coord: center, score: LOCAL_OPENING_BOOKS.go.center, name: dims.length === 2 ? 'center balance point' : 'volume balance point' });
  }
  return targets;
}

function localGoGraphShapeScore(logic, move, player) {
  if (!move?.coord || typeof logic?.indexFromCoord !== 'function' || typeof logic?.neighborsFromIndex !== 'function') return 0;
  const index = logic.indexFromCoord(move.coord);
  if (!Number.isInteger(index) || index < 0) return 0;
  const ownValue = player === 'white' ? 2 : 1;
  const enemyValue = player === 'white' ? 1 : 2;
  const seenOwn = new Set();
  const seenEnemy = new Set();
  let ownWeak = 0;
  let enemyWeak = 0;
  let ownGroups = 0;
  let enemyGroups = 0;
  let emptyNeighbors = 0;
  for (const next of logic.neighborsFromIndex(index)) {
    if (!isPlayable(logic, next)) continue;
    const value = boardValueAt(logic, next);
    if (value === ownValue && !seenOwn.has(next)) {
      const group = logic.getGroupAndLiberties?.(logic.board, next);
      if (group) {
        for (const stone of group.group) seenOwn.add(stone);
        ownGroups += 1;
        if (group.liberties.size <= 2) ownWeak += 1;
      }
    } else if (value === enemyValue && !seenEnemy.has(next)) {
      const group = logic.getGroupAndLiberties?.(logic.board, next);
      if (group) {
        for (const stone of group.group) seenEnemy.add(stone);
        enemyGroups += 1;
        if (group.liberties.size <= 2) enemyWeak += 1;
      }
    } else if (!value) {
      emptyNeighbors += 1;
    }
  }
  let score = 0;
  if (ownWeak) score += 22 * ownWeak;
  if (enemyWeak) score += 25 * enemyWeak;
  if (ownGroups >= 2) score += 18 + 6 * (ownGroups - 2);
  if (enemyGroups >= 2) score += 16 + 5 * (enemyGroups - 2);
  if (emptyNeighbors <= 1 && !move.captured) score -= 16;
  return score;
}

function localGoKnowledgeScore(logic, move, player) {
  const names = [];
  const strategy = LOCAL_STRATEGY_BOOKS.go;
  const yose = LOCAL_ENDGAME_BOOKS.go;
  let score = 0;
  if ((move.captured || 0) > 0) {
    score += move.captured * 22 * strategy.captureThreat;
    appendKnowledgeName(names, 'local captureThreat');
  }
  if (Number.isFinite(Number(move.liberties)) && move.liberties > 0) {
    score += Math.min(42, move.liberties * 5) * strategy.liberties;
    appendKnowledgeName(names, 'local liberties');
  }
  if (move.opponentTerritoryInvasion || move.neutralRegion) {
    score += Math.min(34, Math.max(1, Number(move.regionSize) || 1) * 2.2) * strategy.territoryPotential;
    appendKnowledgeName(names, 'local territoryPotential');
  }
  if (move.ownTerritoryFill) {
    score -= 30 * yose.libertyPressure;
    appendKnowledgeName(names, 'local libertyPressure');
  }
  if ((move.captured || 0) > 0 || move.opponentTerritoryInvasion) {
    score += 10 * yose.ownershipSwing;
    appendKnowledgeName(names, 'local ownershipSwing');
  }
  const graphStrategy = localGoGraphShapeScore(logic, move, player);
  if (Math.abs(graphStrategy) >= 8) {
    score += 0.42 * graphStrategy;
    appendKnowledgeName(names, graphStrategy > 0 ? 'graph tesuji/shape' : 'shape risk');
  }
  return { score, names };
}

function goTopologyOpeningAdjustment(logic, move, dims, minEdge, centerDistance) {
  const topology = String(logic?.topology?.topology || logic?.topology || '').toLowerCase();
  const lattice = String(logic?.topology?.lattice || logic?.lattice || '').toLowerCase();
  const closed = /pbc|t2|t3|torus|sphere|rp2|klein|mobius/.test(topology);
  let score = 0;
  const names = [];
  if (closed) {
    if (minEdge <= 0) score += 18;
    score += Math.max(0, 24 - centerDistance * (dims.length === 3 ? 1.1 : 1.5));
    appendKnowledgeName(names, 'closed-board graph balance');
  } else if (minEdge === 1 || minEdge === 2) {
    score += 10;
    appendKnowledgeName(names, 'hard-boundary efficient extension');
  }
  if (lattice === 'honeycomb') {
    score += 8;
    appendKnowledgeName(names, 'honeycomb liberty safety');
  } else if (lattice === 'triangular') {
    score += 5;
    appendKnowledgeName(names, 'triangular high-degree influence');
  } else if (lattice === 'bcc' || lattice === 'fcc' || lattice === 'hcp') {
    score += 7;
    appendKnowledgeName(names, '3D lattice junction control');
  }
  return { score, names };
}

export function chooseGoOpeningBookMove(logic, legalMoves, player = logic?.currentPlayer) {
  if (!Array.isArray(legalMoves) || !legalMoves.length) return null;
  const ply = logicMoveCount(logic);
  if (ply >= 12) return null;
  const playMoves = legalMoves.filter((move) => move?.type !== 'pass' && Array.isArray(move?.coord));
  if (!playMoves.length) return null;
  let best = null;
  for (const move of playMoves) {
    const dims = boardDimsFromLogic(logic, move.coord);
    const target = coordNearTargets(move.coord, goCornerTargets(dims, ply));
    const center = centerOfDims(dims);
    const centerDistance = manhattan(move.coord, center);
    const edgeDistances = move.coord.map((value, axis) => Math.min(value, dims[axis] - 1 - value));
    const minEdge = Math.min(...edgeDistances);
    const nearestStone = nearestOccupiedDistance(logic, move.coord);
    let score = target?.score || 0;
    score += Math.max(0, 28 - centerDistance * 1.8);
    score += Math.max(0, Math.min(24, nearestStone * 4));
    if (minEdge <= 0) score -= 24;
    if (move.ownTerritoryFill) score -= 42;
    if (move.opponentTerritoryInvasion) score += 14;
    if ((move.captured || 0) > 0) score += Math.min(36, move.captured * 12);
    if (String(logic?.topology || '').includes('sphere') && move.coord.length === 2) score += 8;
    const topologyAdjustment = goTopologyOpeningAdjustment(logic, move, dims, minEdge, centerDistance);
    score += topologyAdjustment.score;
    const local = localGoKnowledgeScore(logic, move, player);
    score += local.score;
    if (!best || score > best.score) {
      const baseName = target?.name || 'early board opportunity';
      const knowledge = [...topologyAdjustment.names, ...local.names];
      best = { move, score, name: openingName(baseName, knowledge), knowledge };
    }
  }
  if (!best || best.score < 70) return null;
  return { ...best, ply, source: 'opening-book' };
}

function reversiOpeningTargets(dims) {
  const lows = dims.map((size) => Math.floor(size / 2) - 1);
  const highs = dims.map((size) => Math.floor(size / 2));
  const targets = [];
  for (let axis = 0; axis < dims.length; axis += 1) {
    for (const base of cartesian(dims.map((_, i) => [lows[i], highs[i]]))) {
      const lower = base.slice();
      lower[axis] = lows[axis] - 1;
      if (lower[axis] >= 0) targets.push({ coord: lower, score: LOCAL_OPENING_BOOKS.reversi.centerShell, name: 'center-shell opening' });
      const upper = base.slice();
      upper[axis] = highs[axis] + 1;
      if (upper[axis] < dims[axis]) targets.push({ coord: upper, score: LOCAL_OPENING_BOOKS.reversi.centerShell, name: 'center-shell opening' });
    }
  }
  return targets;
}

function centralShellDistance(coord, dims) {
  const lows = dims.map((size) => Math.floor(size / 2) - 1);
  const highs = dims.map((size) => Math.floor(size / 2));
  return coord.reduce((sum, value, axis) => {
    if (value < lows[axis]) return sum + lows[axis] - value;
    if (value > highs[axis]) return sum + value - highs[axis];
    return sum;
  }, 0);
}

function localReversiKnowledgeScore(logic, move, dims) {
  const names = [];
  const strategy = LOCAL_STRATEGY_BOOKS.reversi;
  const endgame = LOCAL_ENDGAME_BOOKS.reversi;
  let score = 0;
  const boundaryAxes = move.coord.filter((value, axis) => value <= 0 || value >= dims[axis] - 1).length;
  const cornerLike = boundaryAxes >= dims.length;
  if (cornerLike) {
    score += 52 * strategy.cornerOrAnchor;
    appendKnowledgeName(names, 'local cornerOrAnchor');
  }
  const flips = move.flips?.length || 0;
  if (flips <= Math.max(1, dims.length)) {
    score += 18 * strategy.mobility;
    appendKnowledgeName(names, 'local mobility');
  }
  if (boundaryAxes && !cornerLike) {
    score += 18 * strategy.frontierDiscs;
    appendKnowledgeName(names, 'local frontierDiscs');
  }
  const empty = Number((logic?.counts?.() || {}).empty);
  if (endgame.enabled && Number.isFinite(empty) && empty <= endgame.maxEmptySquares) {
    score += (empty % 2 ? 24 : -12) * strategy.parity;
    appendKnowledgeName(names, 'local endgameParity');
  }
  return { score, names };
}

export function chooseReversiOpeningBookMove(logic, legalMoves, player = logic?.currentPlayer) {
  if (!Array.isArray(legalMoves) || !legalMoves.length) return null;
  const ply = Array.isArray(logic?.moveHistory) ? logic.moveHistory.filter((entry) => entry?.type === 'move').length : 0;
  if (ply >= 10) return null;
  let best = null;
  for (const move of legalMoves) {
    if (!Array.isArray(move?.coord)) continue;
    const dims = boardDimsFromLogic(logic, move.coord);
    const target = coordNearTargets(move.coord, reversiOpeningTargets(dims));
    const shell = centralShellDistance(move.coord, dims);
    const boundaryAxes = move.coord.filter((value, axis) => value <= 0 || value >= dims[axis] - 1).length;
    const flips = move.flips?.length || 0;
    let score = target?.score || Math.max(0, LOCAL_OPENING_BOOKS.reversi.balancedDisc - Math.abs(shell - 1) * 30);
    score += Math.max(0, 28 - flips * 5);
    if (boundaryAxes) score -= boundaryAxes * (ply < 6 ? 32 : 12);
    if (String(logic?.topology?.topology || logic?.topology || '').match(/t2|t3|pbc|cylinder|klein|mobius|rp2/)) score += boundaryAxes * 8;
    const local = localReversiKnowledgeScore(logic, move, dims);
    score += local.score;
    if (!best || score > best.score) {
      const baseName = target?.name || 'balanced opening disc';
      best = { move, score, name: openingName(baseName, local.names), knowledge: local.names };
    }
  }
  if (!best || best.score < 62) return null;
  return { ...best, ply, source: 'opening-book', player };
}

function zoneDistance(game, coord, zone) {
  if (!zone?.size || !Array.isArray(coord)) return 0;
  let best = Infinity;
  for (const key of zone) {
    const target = String(key).split(',').map(Number);
    best = Math.min(best, manhattan(coord, target));
  }
  return best === Infinity ? 0 : best;
}

function nearbyOwnJumpPieces(game, coord, player) {
  if (!Array.isArray(coord) || typeof game?.directionsFor !== 'function') return 0;
  let count = 0;
  for (const direction of game.directionsFor(coord) || []) {
    const step = game.topology?.step?.(coord, direction);
    if (step?.position && game.pieceAt?.(step.position) === player) count += 1;
  }
  return count;
}

function localJumpKnowledgeScore(game, move, player, target, home, progress) {
  const names = [];
  const standard = LOCAL_STRATEGY_BOOKS.jumpStandard;
  const graph = LOCAL_STRATEGY_BOOKS.jumpGraph;
  let score = 0;
  score += progress * Math.abs(standard.totalGraphDistanceToGoal) * 8;
  if (progress > 0) appendKnowledgeName(names, 'local graphDistanceToGoal');
  const toKey = coordKey(move.to);
  const fromKey = coordKey(move.from);
  if (target.has(toKey)) {
    score += 18 * standard.piecesInsideGoal;
    appendKnowledgeName(names, 'local piecesInsideGoal');
  }
  if (home.has(fromKey) && !home.has(toKey)) {
    score += 14 * Math.abs(standard.piecesStillInStartingCamp);
    appendKnowledgeName(names, 'local piecesStillInStartingCamp');
  }
  if (move.type === 'jump') {
    score += 24 * standard.longestAvailableJumpChain + 18 * graph.futureJumpChainPotential;
    appendKnowledgeName(names, 'local futureJumpChainPotential');
  }
  const support = nearbyOwnJumpPieces(game, move.to, player);
  score += support * 10 * graph.pieceConnectivity;
  if (support > 0) appendKnowledgeName(names, 'local pieceConnectivity');
  else score += 10 * graph.isolatedPiecePenalty;
  return { score, names };
}

export function chooseJumpOpeningBookMove(game, legalMoves, player = game?.currentPlayer) {
  if (!Array.isArray(legalMoves) || !legalMoves.length || game?.chainFrom) return null;
  const turn = Math.max(0, Number(game?.turnNumber || 1) - 1);
  if (turn >= Math.max(6, Number(game?.playerCount || 2) * 3)) return null;
  const target = game.targetZone?.(player);
  const home = game.homeZone?.(player);
  if (!target || !home) return null;
  let best = null;
  for (const move of legalMoves) {
    const fromKey = coordKey(move.from);
    const toKey = coordKey(move.to);
    const before = zoneDistance(game, move.from, target);
    const after = zoneDistance(game, move.to, target);
    const progress = before - after;
    let score = progress * 36;
    if (home.has(fromKey) && !home.has(toKey)) score += LOCAL_OPENING_BOOKS.jump.homeClear;
    if (target.has(toKey) && !target.has(fromKey)) score += LOCAL_OPENING_BOOKS.jump.targetEntry;
    if (move.type === 'jump') score += LOCAL_OPENING_BOOKS.jump.jumpRace;
    if (progress <= 0 && !target.has(toKey)) score -= 40;
    const local = localJumpKnowledgeScore(game, move, player, target, home, progress);
    score += local.score;
    if (!best || score > best.score) {
      const baseName = move.type === 'jump' ? 'opening jump race' : 'opening home clear';
      best = { move, score, name: openingName(baseName, local.names), knowledge: local.names };
    }
  }
  if (!best || best.score < 52) return null;
  return { ...best, ply: turn, source: 'opening-book' };
}
