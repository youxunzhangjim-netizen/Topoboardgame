export class TimePiece {
  constructor(options = {}) {
    const {
      id = globalThis.crypto?.randomUUID?.() || `piece-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      player = 'A',
      position = [0, 0],
      type = 'runner',
      species = type,
      age = 0,
      birthTurn = 0,
      deathTurn = null,
      lifetime = null,
      period = 1,
      phase = 0,
      isActive = true,
      isVisible = true,
      cooldown = 0,
      chargeUntil = null,
      hiddenProgram = null,
      momentum = null,
      spin = 'up',
      parity = 'even',
      energy = 0,
      charge = 0,
      hiddenState = null
    } = options;

    this.id = id;
    this.player = player;
    this.position = [...position];
    this.type = type;
    this.species = species;
    this.age = Number(age) || 0;
    this.birthTurn = Number(birthTurn) || 0;
    this.deathTurn = deathTurn === null || deathTurn === undefined ? null : Number(deathTurn);
    this.lifetime = lifetime === null || lifetime === undefined ? null : Number(lifetime);
    this.period = Math.max(1, Number(period) || 1);
    this.phase = Number(phase) || 0;
    this.isActive = Boolean(isActive);
    this.isVisible = Boolean(isVisible);
    this.cooldown = Math.max(0, Number(cooldown) || 0);
    this.chargeUntil = chargeUntil === null || chargeUntil === undefined ? null : Number(chargeUntil);
    this.hiddenProgram = hiddenProgram ? structuredClone(hiddenProgram) : null;
    this.momentum = Array.isArray(momentum) ? [...momentum] : null;
    this.spin = spin;
    this.parity = parity;
    this.energy = Number(energy) || 0;
    this.charge = Number(charge) || 0;
    this.hiddenState = hiddenState ? structuredClone(hiddenState) : null;
  }

  clone(overrides = {}) {
    return new TimePiece({ ...this.toJSON(), ...overrides });
  }

  isBorn(turn) {
    return turn >= this.birthTurn;
  }

  isDead(turn) {
    if (this.deathTurn !== null && turn >= this.deathTurn) return true;
    if (this.lifetime !== null && this.age >= this.lifetime) return true;
    return false;
  }

  phaseActive(turn) {
    return ((turn % this.period) + this.period) % this.period === ((this.phase % this.period) + this.period) % this.period;
  }

  toJSON() {
    return {
      id: this.id,
      player: this.player,
      position: [...this.position],
      type: this.type,
      species: this.species,
      age: this.age,
      birthTurn: this.birthTurn,
      deathTurn: this.deathTurn,
      lifetime: this.lifetime,
      period: this.period,
      phase: this.phase,
      isActive: this.isActive,
      isVisible: this.isVisible,
      cooldown: this.cooldown,
      chargeUntil: this.chargeUntil,
      hiddenProgram: this.hiddenProgram ? structuredClone(this.hiddenProgram) : null,
      momentum: this.momentum ? [...this.momentum] : null,
      spin: this.spin,
      parity: this.parity,
      energy: this.energy,
      charge: this.charge,
      hiddenState: this.hiddenState ? structuredClone(this.hiddenState) : null
    };
  }
}
