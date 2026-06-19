import { Scheduler } from './Scheduler.js';
import { TimePiece } from './TimePiece.js';

function keyOf(position = []) {
  return position.join(',');
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function entropy(counts) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (!total) return 0;
  return Object.values(counts).reduce((sum, value) => {
    if (!value) return sum;
    const p = value / total;
    return sum - p * Math.log2(p);
  }, 0);
}

function histogram(values) {
  return values.reduce((out, value) => {
    const key = String(value);
    out[key] = (out[key] || 0) + 1;
    return out;
  }, {});
}

export class TimeEngine {
  constructor(options = {}) {
    this.turn = Number(options.turn) || 0;
    this.dt = Number(options.dt) || 1;
    this.config = {
      noise: 0,
      decayEnabled: true,
      oldAge: null,
      agingDeathRate: 0,
      mutationRate: 0,
      periodicVisibility: true,
      hamiltonianHook: null,
      ...options.config
    };
    this.pieces = new Map();
    this.scheduler = new Scheduler(options.events || []);
    this.stats = {
      decayCount: 0,
      birthCount: 0,
      disappearanceCount: 0,
      executedEvents: 0,
      totalMoveLength: 0,
      moveCount: 0,
      jumpDistances: []
    };
    this.series = [];
    for (const piece of options.pieces || []) this.addPiece(piece);
  }

  addPiece(piece) {
    const item = piece instanceof TimePiece ? piece : new TimePiece(piece);
    this.pieces.set(item.id, item);
    this.stats.birthCount += 1;
    return item;
  }

  removePiece(pieceId, reason = 'removed') {
    const piece = this.pieces.get(pieceId);
    if (!piece) return null;
    this.pieces.delete(pieceId);
    if (reason === 'decay' || reason === 'death') this.stats.decayCount += 1;
    else this.stats.disappearanceCount += 1;
    return piece;
  }

  pieceAt(position) {
    const key = keyOf(position);
    return [...this.pieces.values()].find((piece) => keyOf(piece.position) === key) || null;
  }

  setTurn(turn) {
    this.turn = Number(turn) || 0;
    this.refreshActivity();
  }

  schedule(event) {
    return this.scheduler.schedule(event);
  }

  programHiddenAction(pieceId, payload, delay = 2) {
    const piece = this.pieces.get(pieceId);
    if (!piece) return null;
    const event = this.schedule({
      turn: this.turn + Math.max(1, Number(delay) || 1),
      type: 'hiddenProgram',
      pieceId,
      payload,
      hidden: true
    });
    piece.chargeUntil = event.turn;
    piece.hiddenProgram = { eventId: event.id, turn: event.turn, visibleHint: 'charging' };
    return event;
  }

  refreshActivity() {
    for (const piece of this.pieces.values()) {
      const born = piece.isBorn(this.turn);
      const phaseActive = piece.phaseActive(this.turn);
      const charging = piece.chargeUntil !== null && this.turn < piece.chargeUntil;
      piece.isActive = born && phaseActive && !charging && piece.cooldown <= 0;
      piece.isVisible = born && (this.config.periodicVisibility || phaseActive || charging);
    }
  }

  advance({ onEvent, onHamiltonianStep } = {}) {
    this.turn += this.dt;
    for (const piece of this.pieces.values()) {
      if (!piece.isBorn(this.turn)) continue;
      piece.age += this.dt;
      if (piece.cooldown > 0) piece.cooldown = Math.max(0, piece.cooldown - this.dt);
      if (piece.chargeUntil !== null && this.turn >= piece.chargeUntil) piece.chargeUntil = null;
    }

    const due = this.scheduler.due(this.turn);
    for (const event of due) {
      this.stats.executedEvents += 1;
      const piece = event.pieceId ? this.pieces.get(event.pieceId) : null;
      if (piece) piece.hiddenProgram = null;
      onEvent?.(event, piece, this);
    }

    if (typeof this.config.hamiltonianHook === 'function') this.config.hamiltonianHook(this, this.dt);
    onHamiltonianStep?.(this, this.dt);

    for (const piece of [...this.pieces.values()]) {
      const oldAge = this.config.oldAge === null || this.config.oldAge === undefined ? null : Number(this.config.oldAge);
      const agingDeathRate = Math.max(0, Number(this.config.agingDeathRate) || 0);
      const mutationRate = Math.max(0, Number(this.config.mutationRate) || 0);
      const noise = Math.max(0, Number(this.config.noise) || 0);
      if ((oldAge === null || piece.age >= oldAge) && agingDeathRate > 0 && Math.random() < agingDeathRate) {
        this.removePiece(piece.id, 'death');
        continue;
      }
      if ((mutationRate > 0 && Math.random() < mutationRate) || (noise > 0 && Math.random() < noise * 0.01)) {
        piece.species = piece.species === 'strong' ? 'weaker' : piece.species === 'weaker' ? 'strong' : 'mutant';
        piece.energy = Math.max(0, piece.energy + (Math.random() < 0.5 ? -1 : 1));
      }
      if (piece.isDead(this.turn)) this.removePiece(piece.id, 'decay');
    }
    this.refreshActivity();
    this.recordObservables();
  }

  recordMove(distance = 1, jumpDistance = null) {
    this.stats.totalMoveLength += Number(distance) || 0;
    this.stats.moveCount += 1;
    if (jumpDistance !== null && jumpDistance !== undefined) this.stats.jumpDistances.push(Number(jumpDistance) || 0);
  }

  observables() {
    const pieces = [...this.pieces.values()];
    const active = pieces.filter((piece) => piece.isActive);
    const hidden = pieces.filter((piece) => !piece.isVisible || piece.hiddenProgram);
    const ages = pieces.map((piece) => piece.age);
    const phases = histogram(pieces.map((piece) => `${piece.period}:${piece.phase}`));
    const spinCounts = histogram(pieces.map((piece) => piece.spin || 'none'));
    const parityCounts = histogram(pieces.map((piece) => piece.parity || 'none'));
    const speciesCounts = histogram(pieces.map((piece) => piece.species || piece.type || 'piece'));
    const occupied = new Set(pieces.map((piece) => keyOf(piece.position)));
    const boundsVolume = this.config.boardVolume || Math.max(1, occupied.size);
    return {
      turn: this.turn,
      time: this.turn * this.dt,
      activePieces: active.length,
      hiddenPieces: hidden.length,
      totalPieces: pieces.length,
      averageAge: Number(mean(ages).toFixed(3)),
      survivalTime: Number((pieces.length ? Math.max(...ages) : 0).toFixed(3)),
      decayCount: this.stats.decayCount,
      birthAppearanceCount: this.stats.birthCount,
      disappearanceCount: this.stats.disappearanceCount,
      phaseDistribution: phases,
      spinUpDownCount: spinCounts,
      parityEvenOddCount: parityCounts,
      averageMoveLength: Number((this.stats.moveCount ? this.stats.totalMoveLength / this.stats.moveCount : 0).toFixed(3)),
      jumpDistanceDistribution: histogram(this.stats.jumpDistances),
      entropyDiversityEstimate: Number(entropy(speciesCounts).toFixed(3)),
      occupationDensity: Number((occupied.size / boundsVolume).toFixed(4)),
      correlationClusteringEstimate: Number(this.clusteringEstimate(pieces).toFixed(3))
    };
  }

  clusteringEstimate(pieces = [...this.pieces.values()]) {
    if (pieces.length < 2) return 0;
    let nearby = 0;
    let total = 0;
    for (let i = 0; i < pieces.length; i += 1) {
      for (let j = i + 1; j < pieces.length; j += 1) {
        const a = pieces[i].position;
        const b = pieces[j].position;
        const dist = Math.sqrt(a.reduce((sum, value, axis) => sum + (value - (b[axis] || 0)) ** 2, 0));
        if (dist <= 1.5) nearby += 1;
        total += 1;
      }
    }
    return total ? nearby / total : 0;
  }

  recordObservables() {
    this.series.push(this.observables());
    if (this.series.length > 1200) this.series.shift();
  }

  exportBoardState() {
    return {
      version: 1,
      turn: this.turn,
      dt: this.dt,
      config: { ...this.config, hamiltonianHook: undefined },
      pieces: [...this.pieces.values()].map((piece) => piece.toJSON()),
      stats: structuredClone(this.stats)
    };
  }

  exportScheduledEvents({ revealHidden = false } = {}) {
    return this.scheduler.toJSON({ revealHidden });
  }

  exportTimeSeriesJSON() {
    return structuredClone(this.series);
  }

  exportTimeSeriesCSV() {
    if (!this.series.length) return 'turn,time,totalPieces,activePieces,hiddenPieces,averageAge,occupationDensity\n';
    const rows = this.series.map((item) => [
      item.turn,
      item.time,
      item.totalPieces,
      item.activePieces,
      item.hiddenPieces,
      item.averageAge,
      item.occupationDensity
    ].join(','));
    return ['turn,time,totalPieces,activePieces,hiddenPieces,averageAge,occupationDensity', ...rows].join('\n');
  }

  importBoardState(state = {}) {
    this.turn = Number(state.turn) || 0;
    this.dt = Number(state.dt) || 1;
    this.config = { ...this.config, ...(state.config || {}) };
    this.pieces.clear();
    for (const piece of state.pieces || []) this.pieces.set(piece.id, new TimePiece(piece));
    this.stats = { ...this.stats, ...(state.stats || {}) };
    this.refreshActivity();
  }
}
