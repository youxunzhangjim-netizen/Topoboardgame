// Shared engine for Topoboardgame jump-race modes. It is intentionally independent
// from Reversi/Go/Chess so jumps, target zones, and future lab labels can evolve separately.
export const DEFAULT_JUMP_OPTIONS = Object.freeze({
  allowStepMoves: true,
  allowMultiJump: true,
  jumpOverFriendly: true,
  jumpOverEnemy: true,
  captureOnJump: false,
  mustContinueJump: false,
  allowLoopJump: false,
  targetFillWin: true,
  scoreAfterTurnLimit: true,
  maxTurns: 240
});

export const PLAYERS = Object.freeze(['A', 'B', 'C']);
export function activePlayers(count = 2) { return PLAYERS.slice(0, Math.max(2, Math.min(3, Math.floor(Number(count) || 2)))); }
export function otherPlayer(player) { return player === 'A' ? 'B' : 'A'; }
export function nextJumpPlayer(player, count = 2) {
  const players = activePlayers(count);
  const index = players.indexOf(player);
  return players[(index + 1 + players.length) % players.length] || 'A';
}
export function coordKey(coord) { return coord.join(','); }
export function sameCoord(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Number(v) === Number(b[i])); }
export function cloneCoord(coord) { return coord.map((v) => Number(v)); }

function diamondArm(size) {
  return Math.max(3, Math.floor(clampInt(size, 6, 24) / 3));
}

function diamondRows(size) {
  const arm = diamondArm(size);
  const rows = [];
  for (let r = -2 * arm; r <= 2 * arm; r += 1) {
    const abs = Math.abs(r);
    const length = abs > arm ? 2 * arm + 1 - abs : 2 * arm + 1 + abs;
    const qMin = Math.round((-r - (length - 1)) / 2);
    rows.push({ r, qMin, qMax: qMin + length - 1, length });
  }
  return { arm, rows };
}

function isFullStarCoord(coord, arm) {
  const [q, r] = coord;
  const s = -q - r;
  const inBandCount = [Math.abs(q) <= arm, Math.abs(r) <= arm, Math.abs(s) <= arm].filter(Boolean).length;
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= 2 * arm && inBandCount >= 2;
}

function isTwoPlayerDiamondCoord(coord, arm) {
  const [q, r] = coord;
  const s = -q - r;
  return isFullStarCoord(coord, arm) && Math.abs(q) <= arm && Math.abs(s) <= arm;
}

function diamondCoords(size, playerCount = 3) {
  const { arm } = diamondRows(size);
  const includeSideCamps = Number(playerCount) >= 3;
  const coords = [];
  for (let r = -2 * arm; r <= 2 * arm; r += 1) {
    for (let q = -2 * arm; q <= 2 * arm; q += 1) {
      const coord = [q, r];
      const ok = includeSideCamps ? isFullStarCoord(coord, arm) : isTwoPlayerDiamondCoord(coord, arm);
      if (ok) coords.push(coord);
    }
  }
  return coords;
}

function diamondCamp(size, name, playerCount = 3) {
  const arm = diamondArm(size);
  return diamondCoords(size, playerCount)
    .filter((coord) => {
      const [q, r] = coord;
      const s = -q - r;
      if (name === 'top') return r < -arm;
      if (name === 'bottom') return r > arm;
      if (name === 'upperRight') return q > arm;
      if (name === 'lowerLeft') return q < -arm;
      if (name === 'upperLeft') return s > arm;
      if (name === 'lowerRight') return s < -arm;
      return false;
    })
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map((coord) => coordKey(coord));
}

export function normalizeJumpLattice(lattice = 'square', dimension = 2, topology = 'plane') {
  const dim = clampInt(dimension, 2, 4);
  const top = String(topology || '').toLowerCase();
  const value = String(lattice || '').toLowerCase();
  if (dim === 2 && top !== 'polar' && ['triangular', 'triangle', 'tri'].includes(value)) return 'triangular';
  return 'square';
}

export function createDirectionVectors(dimension, lattice = 'square', topology = 'plane') {
  // Jump movement follows visible board links.  The default square/cubic
  // lattice therefore uses only axis-neighbor links; it does not invent
  // diagonal jumps through cells that are not connected by a drawn edge.
  const dim = clampInt(dimension, 2, 4);
  const lat = normalizeJumpLattice(lattice, dim, topology);
  if (dim === 2 && lat === 'triangular') {
    return [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  }
  const dirs = [];
  for (let axis = 0; axis < dim; axis += 1) {
    for (const sign of [-1, 1]) {
      const dir = Array(dim).fill(0);
      dir[axis] = sign;
      dirs.push(dir);
    }
  }
  return dirs;
}

function clampInt(value, min, max) {
  const n = Math.floor(Number(value));
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

function wrap(v, size) { return ((v % size) + size) % size; }
function reflected(v, size) {
  if (size <= 1) return 0;
  let n = v;
  let guard = 0;
  while ((n < 0 || n >= size) && guard++ < 8) {
    if (n < 0) n = -n;
    if (n >= size) n = (size - 1) - (n - (size - 1));
  }
  return n >= 0 && n < size ? n : null;
}

export class JumpTopology {
  constructor({ dimension = 2, size = 8, topology = 'plane', boundary = topology, targetAxis = 'x', playerCount = 2 } = {}) {
    this.dimension = clampInt(dimension, 2, 4);
    this.size = clampInt(size, 4, this.dimension === 2 ? 24 : 12);
    this.topology = String(boundary || topology || 'plane').toLowerCase();
    this.targetAxis = ['x', 'y', 'z', 'w'].includes(String(targetAxis)) ? String(targetAxis) : 'x';
    this.axisIndex = { x: 0, y: 1, z: 2, w: 3 }[this.targetAxis] ?? 0;
    this.playerCount = Math.max(2, Math.min(3, Math.floor(Number(playerCount) || 2)));
  }

  allCoords() {
    const coords = [];
    const size = this.size;
    if (this.dimension === 2 && this.topology === 'polar') {
      coords.push([0, 0]);
      for (let ring = 1; ring < size; ring += 1) {
        for (let sector = 0; sector < size; sector += 1) coords.push([ring, sector]);
      }
      return coords;
    }
    if (this.dimension === 2 && this.topology === 'diamond') return diamondCoords(size, this.playerCount);
    const rec = (prefix) => {
      if (prefix.length === this.dimension) { coords.push(prefix); return; }
      for (let i = 0; i < size; i += 1) rec([...prefix, i]);
    };
    rec([]);
    return coords;
  }

  exists(coord) {
    if (this.dimension === 2 && this.topology === 'polar') {
      if (!Array.isArray(coord) || coord.length !== 2) return false;
      const ring = coord[0];
      const sector = coord[1] || 0;
      return Number.isInteger(ring)
        && Number.isInteger(sector)
        && ring >= 0
        && ring < this.size
        && (ring === 0 ? sector === 0 : sector >= 0 && sector < this.size);
    }
    if (this.dimension === 2 && this.topology === 'diamond') {
      if (!Array.isArray(coord) || coord.length !== 2) return false;
      const [q, r] = coord;
      if (!Number.isInteger(q) || !Number.isInteger(r)) return false;
      const arm = diamondArm(this.size);
      return this.playerCount >= 3 ? isFullStarCoord(coord, arm) : isTwoPlayerDiamondCoord(coord, arm);
    }
    return Array.isArray(coord) && coord.length === this.dimension && coord.every((v) => Number.isInteger(v) && v >= 0 && v < this.size);
  }

  step(position, direction) {
    const p = cloneCoord(position);
    let d = cloneCoord(direction);
    let next = p.map((v, i) => v + d[i]);
    const t = this.topology;
    const size = this.size;

    if (this.dimension === 2 && t === 'polar') {
      if (!this.exists(p)) return null;
      const ring = p[0];
      const sector = p[1] || 0;
      const dr = d[0] || 0;
      const ds = d[1] || 0;
      if (ring === 0) {
        if (dr <= 0) return null;
        return { position: [1, wrap(ds, size)], direction: [1, 0], crossed: false };
      }
      const nextRing = ring + dr;
      if (nextRing < 0 || nextRing >= size) return null;
      if (nextRing === 0) return { position: [0, 0], direction: d, crossed: false };
      return { position: [nextRing, wrap(sector + ds, size)], direction: d, crossed: ds !== 0 && sector + ds !== wrap(sector + ds, size) };
    }

    if (['torus', 'pbc', 't3', '4d-torus', 'torus4d'].includes(t)) {
      next = next.map((v) => wrap(v, size));
      return { position: next, direction: d, crossed: false };
    }

    if (['cylinder', 'cyl', 'pbcx', 'pbc-x', 'x-periodic', 'periodic-x'].includes(t)) {
      const rawNext = next.slice();
      next[0] = wrap(next[0], size);
      for (let axis = 1; axis < this.dimension; axis += 1) {
        if (next[axis] < 0 || next[axis] >= size) return null;
      }
      return { position: next, direction: d, crossed: rawNext[0] !== next[0] };
    }

    if (['reflective', 'reflection'].includes(t)) {
      const reflectedNext = next.map((v) => reflected(v, size));
      if (reflectedNext.some((v) => v == null)) return null;
      d = d.map((v, i) => (next[i] < 0 || next[i] >= size ? -v : v));
      return { position: reflectedNext, direction: d, crossed: true };
    }

    if (t === 'mobius') {
      if (next[0] < 0 || next[0] >= size) {
        next[0] = wrap(next[0], size);
        next[1] = size - 1 - wrap(next[1], size);
        d[1] = -d[1];
      }
      if (next[1] < 0 || next[1] >= size) return null;
      return { position: next, direction: d, crossed: true };
    }

    if (t === 'klein' || t === 'klein_bottle') {
      if (next[0] < 0 || next[0] >= size) {
        next[0] = wrap(next[0], size);
        next[1] = size - 1 - wrap(next[1], size);
        d[1] = -d[1];
      }
      next[1] = wrap(next[1], size);
      return { position: next, direction: d, crossed: true };
    }

    if (t === 'rp2' || t === 'projective' || t === 'projection') {
      let crossed = false;
      for (let i = 0; i < Math.min(2, this.dimension); i += 1) {
        if (next[i] < 0 || next[i] >= size) {
          next[i] = wrap(next[i], size);
          const j = i === 0 ? 1 : 0;
          next[j] = size - 1 - wrap(next[j], size);
          d[j] = -d[j];
          crossed = true;
        }
      }
      if (next.some((v) => v < 0 || v >= size)) return null;
      return { position: next, direction: d, crossed };
    }

    if (t === 'sphere' || t === 'shell') {
      // A compact sphere/shell approximation: longitude wraps, latitude/radius is bounded.
      next[0] = wrap(next[0], size);
      if (next.some((v, i) => i > 0 && (v < 0 || v >= size))) return null;
      return { position: next, direction: d, crossed: false };
    }

    if (!this.exists(next)) return null;
    return { position: next, direction: d, crossed: false };
  }
}

function distanceChebyshev(a, b) { return Math.max(...a.map((v, i) => Math.abs(v - b[i]))); }
function axisCluster(coord, axis, side, width, size) { return side === 'low' ? coord[axis] < width : coord[axis] >= size - width; }
function cornerCluster(coord, anchor, radius) { return distanceChebyshev(coord, anchor) <= radius; }

export function createHomeTargetZones({ dimension = 2, size = 8, topology = 'plane', targetAxis = 'x', zoneMode = 'auto', labTargetMode = 'opponentHome', playerCount = 2 } = {}) {
  const dim = clampInt(dimension, 2, 4);
  const n = clampInt(size, 4, 24);
  const axis = { x: 0, y: 1, z: 2, w: 3 }[targetAxis] ?? 0;
  const top = String(topology || 'plane').toLowerCase();
  const width = Math.max(1, Math.floor(n / (dim === 2 ? 4 : 3)));
  const radius = Math.max(1, Math.floor(n / 5));
  const coords = new JumpTopology({ dimension: dim, size: n, topology: top, targetAxis, playerCount }).allCoords();
  const aHome = new Set();
  const bHome = new Set();
  const cHome = new Set();

  const closed = ['torus', 'pbc', 't3', '4d-torus', 'torus4d', 'cylinder', 'cyl', 'pbcx', 'pbc-x', 'mobius', 'klein', 'klein_bottle', 'rp2', 'projective', 'projection'].includes(top);
  const sphere = ['sphere', 'shell'].includes(top);

  if (dim === 2 && top === 'diamond') {
    for (const key of diamondCamp(n, 'top', playerCount)) aHome.add(key);
    for (const key of diamondCamp(n, 'bottom', playerCount)) bHome.add(key);
    if (playerCount >= 3) {
      cHome.clear();
      bHome.clear();
      for (const key of diamondCamp(n, 'lowerRight', playerCount)) bHome.add(key);
      for (const key of diamondCamp(n, 'lowerLeft', playerCount)) cHome.add(key);
    }
  } else if (sphere) {
    for (const c of coords) {
      if (axisCluster(c, 1, 'low', width, n)) aHome.add(coordKey(c));
      if (axisCluster(c, 1, 'high', width, n)) bHome.add(coordKey(c));
    }
  } else if (closed || zoneMode === 'marked') {
    const aAnchor = Array(dim).fill(Math.floor(n * 0.25));
    const bAnchor = Array(dim).fill(Math.floor(n * 0.75));
    for (const c of coords) {
      if (cornerCluster(c, aAnchor, radius)) aHome.add(coordKey(c));
      if (cornerCluster(c, bAnchor, radius)) bHome.add(coordKey(c));
    }
  } else if (zoneMode === 'oppositeCorners') {
    const aAnchor = Array(dim).fill(0);
    const bAnchor = Array(dim).fill(n - 1);
    for (const c of coords) {
      if (cornerCluster(c, aAnchor, radius)) aHome.add(coordKey(c));
      if (cornerCluster(c, bAnchor, radius)) bHome.add(coordKey(c));
    }
  } else {
    for (const c of coords) {
      if (axisCluster(c, axis, 'low', width, n)) aHome.add(coordKey(c));
      if (axisCluster(c, axis, 'high', width, n)) bHome.add(coordKey(c));
    }
  }

  const aTarget = new Set(dim === 2 && top === 'diamond' && playerCount >= 3 ? diamondCamp(n, 'bottom', playerCount) : bHome);
  const bTarget = new Set(dim === 2 && top === 'diamond' && playerCount >= 3 ? diamondCamp(n, 'upperLeft', playerCount) : aHome);
  const cTarget = new Set();
  if (dim === 2 && top === 'diamond' && playerCount >= 3) {
    for (const key of diamondCamp(n, 'upperRight', playerCount)) cTarget.add(key);
  }

  if (String(labTargetMode).toLowerCase() === 'antipodal') {
    return { aHome, bHome, cHome, aTarget, bTarget, cTarget, mode: 'antipodal', width, radius };
  }
  return { aHome, bHome, cHome, aTarget, bTarget, cTarget, mode: 'opponentHome', width, radius };
}

export class JumpGameState {
  constructor(options = {}) {
    this.options = { ...DEFAULT_JUMP_OPTIONS, ...options };
    this.dimension = clampInt(options.dimension, 2, 4);
    this.size = clampInt(options.size, 4, this.dimension === 2 ? 24 : 12);
    this.topologyName = options.topology || options.boundary || 'plane';
    this.lattice = normalizeJumpLattice(options.lattice || 'square', this.dimension, this.topologyName);
    this.targetAxis = options.targetAxis || 'x';
    this.playerCount = Math.max(2, Math.min(3, Math.floor(Number(options.playerCount) || 2)));
    this.zoneMode = options.zoneMode || 'auto';
    this.labMode = options.labMode || '';
    this.labTargetMode = options.labTargetMode || 'opponentHome';
    this.topology = new JumpTopology({ dimension: this.dimension, size: this.size, topology: this.topologyName, targetAxis: this.targetAxis, playerCount: this.playerCount });
    this.directions = createDirectionVectors(this.dimension, this.lattice, this.topologyName);
    this.currentPlayer = 'A';
    this.turnNumber = 1;
    this.winner = null;
    this.selected = null;
    this.chainFrom = null;
    this.chainPath = [];
    this.pieces = new Map();
    this.labels = new Map();
    this.zones = createHomeTargetZones({ dimension: this.dimension, size: this.size, topology: this.topologyName, targetAxis: this.targetAxis, zoneMode: this.zoneMode, labTargetMode: this.labTargetMode, playerCount: this.playerCount });
    this.resetPieces();
  }

  resetPieces() {
    this.pieces.clear();
    this.labels.clear();
    for (const key of this.zones.aHome) { this.pieces.set(key, 'A'); this.labels.set(key, this.createLabel('A', key)); }
    for (const key of this.zones.bHome) { this.pieces.set(key, 'B'); this.labels.set(key, this.createLabel('B', key)); }
    if (this.playerCount >= 3) {
      for (const key of this.zones.cHome) { this.pieces.set(key, 'C'); this.labels.set(key, this.createLabel('C', key)); }
    }
  }

  createLabel(player, key) {
    if (!this.labMode) return null;
    const sectors = ['vacuum', 'charge', 'flux', 'spin', 'parity'];
    const idx = Math.abs(hashString(`${player}:${key}:${this.labMode}`)) % sectors.length;
    return {
      anyonType: this.labMode.includes('anyon') ? sectors[idx] : '',
      charge: idx % 2 ? 'e' : 'm',
      fusionChannel: idx % 3 === 0 ? '1' : 'ψ',
      braidHistory: [],
      sector: sectors[idx],
      parity: idx % 2 ? 'odd' : 'even',
      targetSector: sectors[(idx + 2) % sectors.length]
    };
  }

  key(coord) { return coordKey(coord); }
  pieceAt(coord) { return this.pieces.get(this.key(coord)) || null; }
  isEmpty(coord) { return this.topology.exists(coord) && !this.pieceAt(coord); }
  isOwn(coord, player = this.currentPlayer) { return this.pieceAt(coord) === player; }

  chainVisitedKeys() {
    const visited = new Set();
    if (this.chainFrom) visited.add(this.key(this.chainFrom));
    for (const coord of this.chainPath) visited.add(this.key(coord));
    return visited;
  }

  directionsFor(coord) {
    if (this.dimension === 2 && this.topologyName === 'polar' && coord?.[0] === 0) {
      return Array.from({ length: this.size }, (_, sector) => [1, sector]);
    }
    return this.directions;
  }

  legalMovesFrom(coord, jumpsOnly = false) {
    if (!coord || !this.isOwn(coord)) return [];
    const startKey = this.key(coord);
    const chainVisited = jumpsOnly ? this.chainVisitedKeys() : null;
    const moves = [];
    for (const dir of this.directionsFor(coord)) {
      const first = this.topology.step(coord, dir);
      if (!first) continue;
      const middlePiece = this.pieceAt(first.position);
      if (!jumpsOnly && this.options.allowStepMoves && !middlePiece) {
        moves.push({ type: 'step', from: coord, to: first.position, direction: dir, id: `${startKey}>${this.key(first.position)}:step` });
      }
      if (!middlePiece) continue;
      if (middlePiece === this.currentPlayer && !this.options.jumpOverFriendly) continue;
      if (middlePiece !== this.currentPlayer && !this.options.jumpOverEnemy) continue;
      const second = this.topology.step(first.position, first.direction);
      if (!second) continue;
      if (!this.options.allowLoopJump && sameCoord(second.position, coord)) continue;
      const landingKey = this.key(second.position);
      if (chainVisited?.has(landingKey)) continue;
      if (!this.isEmpty(second.position)) continue;
      moves.push({ type: 'jump', from: coord, over: first.position, to: second.position, direction: dir, id: `${startKey}>${landingKey}:jump` });
    }
    return moves;
  }

  allLegalMoves(player = this.currentPlayer) {
    const saved = this.currentPlayer;
    this.currentPlayer = player;
    const moves = [];
    for (const [key, owner] of this.pieces.entries()) {
      if (owner !== player) continue;
      const coord = key.split(',').map(Number);
      moves.push(...this.legalMovesFrom(coord, false));
    }
    this.currentPlayer = saved;
    return moves;
  }

  applyMove(move) {
    if (this.winner) return { ok: false, error: 'game-over' };
    const legal = this.legalMovesFrom(move.from, Boolean(this.chainFrom));
    const found = legal.find((candidate) => candidate.id === move.id || sameCoord(candidate.to, move.to) && candidate.type === move.type);
    if (!found) return { ok: false, error: 'illegal-move' };
    const fromKey = this.key(found.from);
    const toKey = this.key(found.to);
    const player = this.pieces.get(fromKey);
    const label = this.labels.get(fromKey);
    this.pieces.delete(fromKey);
    this.labels.delete(fromKey);
    this.pieces.set(toKey, player);
    if (label) this.labels.set(toKey, label);
    if (found.type === 'jump' && this.options.captureOnJump) {
      this.pieces.delete(this.key(found.over));
      this.labels.delete(this.key(found.over));
    }
    this.selected = found.to;
    if (found.type === 'jump' && this.options.allowMultiJump) {
      if (!this.chainFrom) this.chainFrom = found.from;
      this.chainPath.push(found.to);
      const nextJumps = this.legalMovesFrom(found.to, true);
      if (nextJumps.length > 0) return { ok: true, continueJump: true, move: found };
      // A jump chain auto-finishes when there is no further linked piece to jump.
      // This keeps the move flow close to standard jump-race rules: only actual
      // board links count, and the final successive jump ends the turn.
      this.endTurn();
      return { ok: true, continueJump: false, move: found, chainFinished: true };
    }
    this.endTurn();
    return { ok: true, continueJump: false, move: found };
  }

  endTurn() {
    this.selected = null;
    this.chainFrom = null;
    this.chainPath = [];
    this.checkWinner();
    if (!this.winner) {
      this.currentPlayer = nextJumpPlayer(this.currentPlayer, this.playerCount);
      this.turnNumber += 1;
      if (this.options.scoreAfterTurnLimit && this.turnNumber > this.options.maxTurns) this.winner = this.scoreWinner();
    }
  }

  checkWinner() {
    if (!this.options.targetFillWin) return null;
    for (const player of activePlayers(this.playerCount)) {
      const target = this.targetZone(player);
      const homeCount = this.homeZone(player).size;
      const filled = [...target].filter((key) => this.pieces.get(key) === player).length;
      if (filled >= Math.max(1, Math.min(homeCount, target.size))) {
        this.winner = player;
        return player;
      }
    }
    return null;
  }

  targetProgress(player) {
    const target = this.targetZone(player);
    const total = Math.max(1, this.homeZone(player).size);
    const filled = [...target].filter((key) => this.pieces.get(key) === player).length;
    return { filled, total, percentage: Math.min(100, Math.round((filled / total) * 100)) };
  }

  homeZone(player) {
    if (player === 'C') return this.zones.cHome || new Set();
    return player === 'A' ? this.zones.aHome : this.zones.bHome;
  }

  targetZone(player) {
    if (player === 'C') return this.zones.cTarget || new Set();
    return player === 'A' ? this.zones.aTarget : this.zones.bTarget;
  }

  score(player = 'A') {
    const own = this.targetProgress(player).percentage;
    const opponents = activePlayers(this.playerCount).filter((p) => p !== player);
    const opp = opponents.reduce((sum, p) => sum + this.targetProgress(p).percentage, 0) / Math.max(1, opponents.length);
    return own - opp;
  }

  scoreWinner() {
    const ranked = activePlayers(this.playerCount)
      .map((player) => ({ player, score: this.targetProgress(player).percentage }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0]?.score > ranked[1]?.score) return ranked[0].player;
    return 'draw';
  }

  serialize() {
    return {
      dimension: this.dimension,
      size: this.size,
      topology: this.topologyName,
      lattice: this.lattice,
      playerCount: this.playerCount,
      targetAxis: this.targetAxis,
      zoneMode: this.zoneMode,
      labMode: this.labMode,
      labTargetMode: this.labTargetMode,
      currentPlayer: this.currentPlayer,
      turnNumber: this.turnNumber,
      winner: this.winner,
      pieces: [...this.pieces.entries()],
      labels: [...this.labels.entries()]
    };
  }

  import(state = {}) {
    this.dimension = clampInt(state.dimension || this.dimension, 2, 4);
    this.size = clampInt(state.size || this.size, 4, this.dimension === 2 ? 24 : 12);
    this.topologyName = state.topology || this.topologyName;
    this.lattice = normalizeJumpLattice(state.lattice || this.lattice, this.dimension, this.topologyName);
    this.playerCount = Math.max(2, Math.min(3, Math.floor(Number(state.playerCount || this.playerCount) || 2)));
    this.targetAxis = state.targetAxis || this.targetAxis;
    this.zoneMode = state.zoneMode || this.zoneMode;
    this.labMode = state.labMode || this.labMode;
    this.labTargetMode = state.labTargetMode || this.labTargetMode;
    this.currentPlayer = state.currentPlayer || 'A';
    this.turnNumber = Number(state.turnNumber) || 1;
    this.winner = state.winner || null;
    this.topology = new JumpTopology({ dimension: this.dimension, size: this.size, topology: this.topologyName, targetAxis: this.targetAxis, playerCount: this.playerCount });
    this.directions = createDirectionVectors(this.dimension, this.lattice, this.topologyName);
    this.zones = createHomeTargetZones({ dimension: this.dimension, size: this.size, topology: this.topologyName, targetAxis: this.targetAxis, zoneMode: this.zoneMode, labTargetMode: this.labTargetMode, playerCount: this.playerCount });
    this.pieces = new Map(Array.isArray(state.pieces) ? state.pieces : []);
    this.labels = new Map(Array.isArray(state.labels) ? state.labels : []);
    this.selected = null;
    this.chainFrom = null;
    this.chainPath = [];
  }
}

export function chooseJumpRobotMove(game, player = game.currentPlayer) {
  const moves = game.allLegalMoves(player);
  if (!moves.length) return null;
  let best = null;
  for (const move of moves) {
    const score = scoreJumpMove(game, move, player);
    if (!best || score > best.score) best = { move, score };
  }
  return best?.move || moves[0];
}

function scoreJumpMove(game, move, player) {
  const target = player === 'A' ? game.zones.aTarget : game.zones.bTarget;
  const before = distanceToTarget(game, move.from, target);
  const after = distanceToTarget(game, move.to, target);
  const jumpBonus = move.type === 'jump' ? 6 : 0;
  const targetBonus = target.has(coordKey(move.to)) ? 20 : 0;
  const directionBonus = game.lattice === 'triangular' && move.direction?.filter(Boolean).length === 2 ? 0.8 : 0;
  const polarBonus = game.topologyName === 'polar' && Math.abs((move.to?.[0] || 0) - (move.from?.[0] || 0)) > 0 ? 0.6 : 0;
  return (before - after) * 5 + jumpBonus + targetBonus + directionBonus + polarBonus + Math.random() * 0.1;
}
function distanceToTarget(game, coord, targetSet) {
  let best = Infinity;
  for (const key of targetSet) {
    best = Math.min(best, jumpGraphDistance(game, coord, key.split(',').map(Number)));
  }
  if (Number.isFinite(best)) return best;
  return distanceChebyshev(coord, targetCenter(targetSet, game.dimension));
}
function jumpGraphDistance(game, a, b) {
  if (game.topologyName === 'polar' && game.dimension === 2) {
    const ring = Math.abs((a[0] || 0) - (b[0] || 0));
    const sectors = Math.max(1, game.size || 1);
    const raw = Math.abs((a[1] || 0) - (b[1] || 0));
    return ring + Math.min(raw, sectors - raw);
  }
  if (game.lattice === 'triangular' && game.dimension === 2) {
    const dx = (a[0] || 0) - (b[0] || 0);
    const dy = (a[1] || 0) - (b[1] || 0);
    return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
  }
  return distanceChebyshev(a, b);
}
function targetCenter(targetSet, dimension) {
  const sums = Array(dimension).fill(0);
  let count = 0;
  for (const key of targetSet) {
    const c = key.split(',').map(Number);
    for (let i = 0; i < dimension; i += 1) sums[i] += c[i] || 0;
    count += 1;
  }
  return count ? sums.map((v) => v / count) : Array(dimension).fill(0);
}
function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
