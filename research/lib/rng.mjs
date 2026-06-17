export class ResearchRng {
  constructor(seed = 'topoboardgame-research') {
    this.state = hashSeed(String(seed));
  }
  nextUInt32() {
    // Mulberry32-style generator: fast, deterministic, good enough for experiments.
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  }
  next() { return this.nextUInt32() / 0x100000000; }
  integer(max) { return max <= 0 ? 0 : Math.floor(this.next() * max); }
  pick(array) { return array?.length ? array[this.integer(array.length)] : null; }
  fork(label) { return new ResearchRng(`${this.state}:${label}:${this.nextUInt32()}`); }
}

export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function withSeededMathRandom(seed, fn) {
  const rng = seed instanceof ResearchRng ? seed : new ResearchRng(seed);
  const original = Math.random;
  Math.random = () => rng.next();
  try { return await fn(); }
  finally { Math.random = original; }
}
