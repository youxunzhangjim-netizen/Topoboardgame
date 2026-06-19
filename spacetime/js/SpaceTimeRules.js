import { TimeEngine } from './TimeEngine.js';
import { TimePiece } from './TimePiece.js';
import { getSpaceTimePreset } from './presets.js';

export function coordKey(position = []) { return position.join(','); }

function inside(position, size) {
  return position.every((value, axis) => Number.isInteger(value) && value >= 0 && value < size[axis]);
}

function wrap(value, size) { return ((value % size) + size) % size; }

function reflectValue(value, size) {
  if (size <= 1) return { value: 0, reflected: false };
  let v = value;
  let reflected = false;
  while (v < 0 || v >= size) {
    reflected = true;
    if (v < 0) v = -v - 1;
    if (v >= size) v = 2 * size - v - 1;
  }
  return { value: v, reflected };
}

function axisDirections(dimension) {
  const directions = [];
  for (let axis = 0; axis < dimension; axis += 1) {
    const plus = Array(dimension).fill(0);
    plus[axis] = 1;
    const minus = Array(dimension).fill(0);
    minus[axis] = -1;
    directions.push(plus, minus);
  }
  return directions;
}

function normalizeSize(size = [], dimension = 2) {
  const out = Array.from({ length: dimension }, (_, axis) => Math.max(1, Number(size[axis]) || (axis < 2 ? 8 : 1)));
  return out;
}

function distanceBetween(a = [], b = []) {
  return Math.sqrt(a.reduce((sum, value, axis) => sum + (value - (b[axis] || 0)) ** 2, 0));
}

export class SpaceTimeRules {
  constructor(presetId = '2p1-go-delay', options = {}) {
    this.includePhysics = Boolean(options.includePhysics);
    this.overrides = options.overrides || {};
    this.loadPreset(presetId, this.overrides);
  }

  loadPreset(presetId, overrides = this.overrides || {}) {
    this.overrides = { ...overrides };
    this.preset = { ...getSpaceTimePreset(presetId, { includePhysics: this.includePhysics }), ...this.overrides };
    this.dimension = this.preset.dimension || 2;
    this.size = normalizeSize(this.preset.size, this.dimension);
    this.boundary = this.preset.boundary || this.preset.topology || 'plane';
    this.currentPlayer = 'A';
    this.selectedPieceId = null;
    this.winner = null;
    this.log = [];
    this.engine = new TimeEngine({
      dt: Number(this.preset.dt) || 1,
      config: {
        boardVolume: this.size.reduce((product, value) => product * value, 1),
        noise: this.preset.allowNoise ? Number(this.preset.noise || 0) : 0,
        periodicVisibility: this.preset.periodicVisibility !== false,
        oldAge: this.preset.oldAge ?? null,
        agingDeathRate: this.preset.timeMode === 'decay' ? Number(this.preset.agingDeathRate || 0) : 0,
        mutationRate: this.preset.timeMode === 'decay' ? Number(this.preset.mutationRate || 0) : 0
      }
    });
    this.setupPieces();
    this.engine.refreshActivity();
    this.engine.recordObservables();
  }

  setOverrides(overrides = {}) {
    this.loadPreset(this.preset.id, { ...this.overrides, ...overrides });
  }

  setupPieces() {
    const family = this.preset.family || 'go';
    if (family === 'go') return;
    if (family === 'reversi') return this.setupReversiSeed();
    return this.setupRaceRows();
  }

  basePiece(player, position, index = 0, extra = {}) {
    return new TimePiece({
      id: `${player}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      player,
      position,
      lifetime: this.preset.timeMode === 'decay' ? (this.preset.lifetime ?? 50) : null,
      period: this.preset.timeMode === 'periodic' ? (this.preset.period || 4) : 1,
      phase: index % Math.max(1, this.preset.period || 1),
      cooldown: Number(this.preset.cooldown || 0),
      momentum: this.preset.momentum ? [0, player === 'A' ? 1 : -1, ...(this.dimension >= 3 ? [0] : [])] : null,
      spin: index % 2 ? 'down' : 'up',
      parity: index % 2 ? 'odd' : 'even',
      energy: 1 + index,
      species: this.preset.family || 'piece',
      ...extra
    });
  }

  setupRaceRows() {
    const yA = this.dimension >= 2 ? 0 : 0;
    const yB = this.dimension >= 2 ? this.size[1] - 1 : 0;
    const z = this.dimension >= 3 ? Math.floor(this.size[2] / 2) : undefined;
    const count = Math.min(this.preset.family === 'chess' ? 6 : 5, this.size[0]);
    for (let i = 0; i < count; i += 1) {
      const x = Math.floor(((i + 1) * this.size[0]) / (count + 1));
      const a = [x, yA];
      const b = [x, yB];
      if (this.dimension >= 3) { a.push(z); b.push(z); }
      while (a.length < this.dimension) a.push(0);
      while (b.length < this.dimension) b.push(0);
      this.engine.addPiece(this.basePiece('A', a, i));
      this.engine.addPiece(this.basePiece('B', b, i));
    }
  }

  setupReversiSeed() {
    const centers = this.size.map((value) => Math.floor((value - 1) / 2));
    const c2 = [centers[0], centers[1]];
    const offsets = [[0, 0, 'A'], [1, 1, 'A'], [1, 0, 'B'], [0, 1, 'B']];
    offsets.forEach(([dx, dy, player], index) => {
      const pos = [c2[0] + dx, c2[1] + dy];
      if (this.dimension >= 3) pos.push(centers[2]);
      while (pos.length < this.dimension) pos.push(0);
      if (inside(pos, this.size)) this.engine.addPiece(this.basePiece(player, pos, index));
    });
  }

  map(position, direction = null) {
    const p = position.slice(0, this.dimension);
    while (p.length < this.dimension) p.push(0);
    const boundary = this.boundary;
    if (boundary === 'torus' || boundary === 'torus3' || boundary === 'klein') {
      return { position: p.map((value, axis) => wrap(value, this.size[axis])), direction };
    }
    if (boundary === 'cylinder') {
      p[0] = wrap(p[0], this.size[0]);
      for (let axis = 1; axis < this.dimension; axis += 1) {
        if (p[axis] < 0 || p[axis] >= this.size[axis]) return null;
      }
      return { position: p, direction };
    }
    if (boundary === 'reflective' || boundary === 'sphere-shell') {
      const next = [];
      let outDirection = direction ? [...direction] : null;
      for (let axis = 0; axis < this.dimension; axis += 1) {
        const item = reflectValue(p[axis], this.size[axis]);
        next[axis] = item.value;
        if (item.reflected && outDirection) outDirection[axis] = -(outDirection[axis] || 0);
      }
      return { position: next, direction: outDirection };
    }
    if ((boundary === 'mobius' || boundary === 'rp2') && this.dimension >= 2) {
      if (p[0] < 0 || p[0] >= this.size[0]) {
        p[0] = wrap(p[0], this.size[0]);
        p[1] = this.size[1] - 1 - p[1];
        if (direction) direction = [direction[0], -(direction[1] || 0), ...direction.slice(2)];
      }
      if (boundary === 'rp2' && (p[1] < 0 || p[1] >= this.size[1])) {
        p[1] = wrap(p[1], this.size[1]);
        p[0] = this.size[0] - 1 - p[0];
        if (direction) direction = [-(direction[0] || 0), direction[1], ...direction.slice(2)];
      }
      if (!inside(p, this.size)) return null;
      return { position: p, direction };
    }
    if (boundary === 'sphere') {
      const mapped = p.map((value, axis) => axis < 2 ? reflectValue(value, this.size[axis]).value : value);
      if (!inside(mapped, this.size)) return null;
      return { position: mapped, direction };
    }
    if (!inside(p, this.size)) return null;
    return { position: p, direction };
  }

  step(position, direction) {
    const raw = position.map((value, axis) => value + (direction[axis] || 0));
    return this.map(raw, [...direction]);
  }

  availableDirections(piece = null) {
    let directions = axisDirections(this.dimension);
    if (this.preset.physicsLab && piece?.spin) {
      directions = directions.filter((direction) => {
        const axis = direction.findIndex((value) => value !== 0);
        if (piece.spin === 'up') return axis % 2 === 0;
        return axis % 2 === 1 || axis === 0;
      });
    }
    if (this.preset.timeMode === 'periodic') {
      const phase = this.engine.turn % Math.max(1, this.preset.period || 4);
      directions = directions.filter((direction, index) => phase === 0 || index % Math.max(1, this.dimension) === phase % Math.max(1, this.dimension));
    }
    return directions;
  }

  occupiedSet(exceptId = null) {
    return new Set([...this.engine.pieces.values()].filter((item) => item.id !== exceptId).map((item) => coordKey(item.position)));
  }

  legalPlacements() {
    const occupied = this.occupiedSet();
    const positions = [];
    const [nx, ny, nz = 1] = this.size;
    for (let z = 0; z < (this.dimension >= 3 ? nz : 1); z += 1) {
      for (let y = 0; y < ny; y += 1) {
        for (let x = 0; x < nx; x += 1) {
          const pos = this.dimension >= 3 ? [x, y, z] : [x, y];
          if (!occupied.has(coordKey(pos))) positions.push({ to: pos, type: 'place' });
        }
      }
    }
    return positions;
  }

  legalMoves(pieceId = this.selectedPieceId) {
    if (this.preset.family === 'go' || this.preset.family === 'reversi') return this.legalPlacements();
    const piece = this.engine.pieces.get(pieceId);
    if (!piece || !piece.isActive || piece.player !== this.currentPlayer) return [];
    const occupied = this.occupiedSet(piece.id);
    const moves = [];
    const directions = piece.momentum && this.preset.physicsLab ? [piece.momentum] : this.availableDirections(piece);
    for (const direction of directions) {
      const mapped = this.step(piece.position, direction);
      if (!mapped) continue;
      const key = coordKey(mapped.position);
      if (!occupied.has(key)) moves.push({ to: mapped.position, direction: mapped.direction || direction, type: 'step' });
      if (this.preset.family === 'jump') {
        const middleOccupied = this.engine.pieceAt(mapped.position);
        if (!middleOccupied) continue;
        const landing = this.step(mapped.position, mapped.direction || direction);
        if (!landing) continue;
        const landingKey = coordKey(landing.position);
        if (!occupied.has(landingKey) && landingKey !== coordKey(piece.position)) {
          moves.push({ to: landing.position, direction: landing.direction || mapped.direction || direction, type: 'jump' });
        }
      }
    }
    return moves;
  }

  selectAt(position) {
    const key = coordKey(position);
    const piece = [...this.engine.pieces.values()].find((item) => coordKey(item.position) === key && item.player === this.currentPlayer && item.isActive);
    this.selectedPieceId = piece?.id || null;
    return this.selectedPieceId;
  }

  playAt(position, { programmed = false } = {}) {
    if (this.preset.family === 'go' || this.preset.family === 'reversi') return this.placeAt(position, { programmed });
    return this.moveSelected(position, { programmed });
  }

  placeAt(position, { programmed = false } = {}) {
    if (!inside(position, this.size)) return { ok: false, error: 'That site is outside the board.' };
    if (this.engine.pieceAt(position)) return { ok: false, error: 'That site is occupied.' };
    if (programmed || this.preset.timeMode === 'delay') {
      this.engine.schedule({
        turn: this.engine.turn + Math.max(1, Number(this.preset.delay) || 1),
        type: 'hiddenProgram',
        payload: { action: 'place', to: position, player: this.currentPlayer },
        hidden: true
      });
      this.log.unshift(`${this.currentPlayer} charged a hidden ${this.preset.actionLabel || 'action'} for turn ${this.engine.turn + (this.preset.delay || 1)}.`);
      this.endTurn();
      return { ok: true, programmed: true };
    }
    this.applyPlacement(this.currentPlayer, position);
    this.endTurn();
    return { ok: true };
  }

  moveSelected(toPosition, { programmed = false } = {}) {
    const piece = this.engine.pieces.get(this.selectedPieceId);
    if (!piece) return { ok: false, error: 'Choose one of your active pieces.' };
    const legal = this.legalMoves(piece.id).find((move) => coordKey(move.to) === coordKey(toPosition));
    if (!legal) return { ok: false, error: 'That destination is not legal now.' };
    if (programmed || this.preset.timeMode === 'delay') {
      this.engine.programHiddenAction(piece.id, { action: 'move', to: legal.to, direction: legal.direction }, this.preset.delay || 2);
      this.log.unshift(`${piece.player} charged a hidden move for turn ${this.engine.turn + (this.preset.delay || 2)}.`);
      this.endTurn();
      return { ok: true, programmed: true };
    }
    this.applyMove(piece, legal.to, legal.direction, legal.type);
    this.endTurn();
    return { ok: true };
  }

  applyPlacement(player, position) {
    const index = this.engine.pieces.size + 1;
    const piece = this.basePiece(player, [...position], index, { species: this.preset.family || 'stone' });
    this.engine.addPiece(piece);
    if (this.preset.family === 'reversi') this.flipAdjacent(position, player);
    this.engine.recordMove(0);
    this.log.unshift(`${player} ${this.preset.actionLabel || 'played'} at ${coordKey(position)}.`);
  }

  flipAdjacent(position, player) {
    const opponent = player === 'A' ? 'B' : 'A';
    for (const direction of axisDirections(this.dimension)) {
      const first = this.step(position, direction);
      if (!first) continue;
      const adjacent = this.engine.pieceAt(first.position);
      if (!adjacent || adjacent.player !== opponent) continue;
      const second = this.step(first.position, first.direction || direction);
      const bracket = second ? this.engine.pieceAt(second.position) : null;
      if (bracket?.player === player || !bracket) adjacent.player = player;
    }
  }

  applyMove(piece, to, direction = null, moveType = 'step') {
    const before = piece.position;
    const distance = distanceBetween(before, to);
    piece.position = [...to];
    piece.cooldown = Number(this.preset.cooldown || 0);
    if (this.preset.physicsLab && piece.momentum) piece.momentum = direction ? [...direction] : piece.momentum;
    piece.parity = piece.parity === 'even' ? 'odd' : 'even';
    this.engine.recordMove(distance, moveType === 'jump' ? distance : null);
    this.log.unshift(`${piece.player} ${moveType === 'jump' ? 'jumped' : 'moved'} to ${coordKey(to)}.`);
  }

  executeEvent(event, piece) {
    if (event.type !== 'hiddenProgram') return;
    const payload = event.payload || {};
    const target = payload.to;
    if (!target) return;
    if (payload.action === 'place') {
      if (!this.engine.pieceAt(target)) {
        this.applyPlacement(payload.player || this.currentPlayer, target);
        this.log.unshift(`A charged placement resolved.`);
      } else {
        this.log.unshift(`A charged placement fizzled because the site was occupied.`);
      }
      return;
    }
    if (!piece) return;
    const occupied = this.occupiedSet(piece.id);
    const direction = payload.direction || null;
    const mapped = direction ? this.step(piece.position, direction) : null;
    const stillLegal = mapped && coordKey(mapped.position) === coordKey(target);
    if (stillLegal && !occupied.has(coordKey(target))) {
      this.applyMove(piece, target, direction);
      this.log.unshift(`A charged move resolved for ${piece.player}.`);
    } else {
      this.log.unshift(`A charged move fizzled because the landing cell was no longer legal.`);
    }
  }

  measureHamiltonianWalk(pieceId = this.selectedPieceId) {
    if (!this.preset.physicsLab) return { ok: false, error: 'Hamiltonian walks are available from Physics Labs only.' };
    const piece = this.engine.pieces.get(pieceId);
    if (!piece) return { ok: false, error: 'Select a piece first.' };
    let candidates = [piece.position];
    for (let step = 0; step < Math.max(1, this.preset.walkSteps || 4); step += 1) {
      const next = [];
      for (const coord of candidates) {
        for (const direction of this.availableDirections(piece)) {
          const mapped = this.step(coord, direction);
          if (mapped) next.push(mapped.position);
        }
      }
      candidates = next.length ? next : candidates;
    }
    const choice = candidates[Math.floor(Math.random() * candidates.length)] || piece.position;
    piece.position = [...choice];
    piece.energy += 1;
    this.engine.recordMove(this.preset.walkSteps || 4, this.preset.walkSteps || 4);
    this.log.unshift(`${piece.player} measured a Hamiltonian walk at ${coordKey(choice)}.`);
    this.endTurn();
    return { ok: true };
  }

  endTurn() {
    this.currentPlayer = this.currentPlayer === 'A' ? 'B' : 'A';
    this.engine.advance({ onEvent: (event, piece) => this.executeEvent(event, piece) });
    this.checkWinner();
  }

  pass() {
    this.log.unshift(`${this.currentPlayer} passed.`);
    this.endTurn();
  }

  checkWinner() {
    const pieces = [...this.engine.pieces.values()];
    const totalSites = this.size.reduce((a, b) => a * b, 1);
    const aCount = pieces.filter((piece) => piece.player === 'A').length;
    const bCount = pieces.filter((piece) => piece.player === 'B').length;
    if (pieces.length >= totalSites || aCount === 0 && bCount > 0 || bCount === 0 && aCount > 0) {
      this.winner = aCount > bCount ? 'A' : bCount > aCount ? 'B' : 'draw';
    }
  }

  reset() {
    this.loadPreset(this.preset.id, this.overrides);
  }

  exportState() {
    return {
      preset: this.preset.id,
      overrides: this.overrides,
      currentPlayer: this.currentPlayer,
      selectedPieceId: this.selectedPieceId,
      winner: this.winner,
      log: this.log,
      engine: this.engine.exportBoardState(),
      events: this.engine.exportScheduledEvents({ revealHidden: true })
    };
  }

  importState(state = {}) {
    this.loadPreset(state.preset || this.preset.id, state.overrides || this.overrides);
    this.currentPlayer = state.currentPlayer || 'A';
    this.selectedPieceId = state.selectedPieceId || null;
    this.winner = state.winner || null;
    this.log = Array.isArray(state.log) ? [...state.log] : [];
    if (state.engine) this.engine.importBoardState(state.engine);
    if (state.events) this.engine.scheduler.import(state.events);
  }
}
