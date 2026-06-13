const DEFAULT_SEED = 'topological-boardgame-seed';

function hashSeed(seed) {
    const text = String(seed || DEFAULT_SEED);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 0x9e3779b9;
}

export class SeededRandom {
    constructor(seed = DEFAULT_SEED, state = null, draws = 0) {
        this.seed = String(seed || DEFAULT_SEED);
        this.state = Number.isInteger(state) ? state >>> 0 : hashSeed(this.seed);
        this.draws = Number.isInteger(draws) ? Math.max(0, draws) : 0;
    }

    nextUint32() {
        let value = this.state >>> 0;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.state = value >>> 0 || hashSeed(`${this.seed}:${this.draws}`);
        this.draws += 1;
        return this.state;
    }

    next() {
        return this.nextUint32() / 0x100000000;
    }

    integer(maxExclusive) {
        const max = Math.max(1, Math.floor(Number(maxExclusive) || 1));
        return Math.floor(this.next() * max);
    }

    choice(items) {
        if (!Array.isArray(items) || items.length === 0) return null;
        return items[this.integer(items.length)];
    }

    fork(label = 'fork') {
        return new SeededRandom(`${this.seed}:${label}:${this.state}:${this.draws}`);
    }

    exportState() {
        return {
            seed: this.seed,
            state: this.state >>> 0,
            draws: this.draws
        };
    }

    importState(state = {}) {
        this.seed = String(state.seed || this.seed || DEFAULT_SEED);
        this.state = Number.isInteger(state.state) ? state.state >>> 0 : hashSeed(this.seed);
        this.draws = Number.isInteger(state.draws) ? Math.max(0, state.draws) : 0;
    }
}

export function createSeededRandom(seed = DEFAULT_SEED) {
    return new SeededRandom(seed);
}
