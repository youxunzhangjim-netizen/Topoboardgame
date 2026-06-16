export const DEFAULT_PIECE_TIME_CONFIG = Object.freeze({
    enabled: false,
    decay: true,
    lifespan: 12
});

function integer(value, fallback, min = 0, max = 1000000) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

export function normalizePieceTimeConfig(config = {}) {
    const raw = typeof config === 'number'
        ? { enabled: config > 0, lifespan: config }
        : (config || {});
    const lifespan = integer(raw.lifespan ?? raw.pieceLifetime ?? raw.period, DEFAULT_PIECE_TIME_CONFIG.lifespan, 1, 512);
    const mode = String(raw.mode ?? raw.timeMode ?? '').toLowerCase();
    const enabled = Boolean(raw.enabled ?? raw.timeEvolutionEnabled ?? raw.pieceTimeEnabled ?? false) && lifespan > 0;
    return {
        enabled,
        decay: enabled && mode !== 'count' && Boolean(raw.decay ?? raw.expire ?? raw.decayEnabled ?? true),
        lifespan
    };
}

export function createAgeArray(total, source = null) {
    const ages = new Uint16Array(Math.max(0, Number(total) || 0));
    if (!source) return ages;
    const entries = ArrayBuffer.isView(source) || Array.isArray(source) ? source : [];
    for (let index = 0; index < Math.min(ages.length, entries.length); index += 1) {
        ages[index] = integer(entries[index], 0, 0, 512);
    }
    return ages;
}

export function clockProgress(age = 0, lifespan = DEFAULT_PIECE_TIME_CONFIG.lifespan) {
    const life = integer(lifespan, DEFAULT_PIECE_TIME_CONFIG.lifespan, 1, 512);
    return Math.max(0, Math.min(1, Number(age || 0) / life));
}

export function advanceIndexedPieceAges({
    board,
    labels = null,
    ages,
    config = {},
    emptyValue = 0,
    protectedIndexes = []
} = {}) {
    const time = normalizePieceTimeConfig(config);
    const result = { aged: 0, expired: [] };
    if (!time.enabled || !board || !ages) return result;
    const fresh = new Set(protectedIndexes.map((index) => Number(index)).filter(Number.isInteger));
    for (let index = 0; index < board.length; index += 1) {
        if (Number(board[index]) === Number(emptyValue)) {
            ages[index] = 0;
            continue;
        }
        if (fresh.has(index)) {
            ages[index] = 0;
            continue;
        }
        ages[index] = Math.min(time.lifespan, integer(ages[index], 0, 0, time.lifespan) + 1);
        result.aged += 1;
        if (time.decay && ages[index] >= time.lifespan) {
            board[index] = emptyValue;
            if (labels) labels[index] = 'I';
            ages[index] = 0;
            result.expired.push(index);
        }
    }
    return result;
}

export function advanceMapPieceAges(board, { config = {}, protectedKeys = [] } = {}) {
    const time = normalizePieceTimeConfig(config);
    const result = { aged: 0, expired: [] };
    if (!time.enabled || !(board instanceof Map)) return result;
    const fresh = new Set(protectedKeys.map(String));
    for (const [key, entity] of [...board.entries()]) {
        if (!entity || typeof entity !== 'object') continue;
        if (fresh.has(String(key))) {
            entity.age = 0;
            continue;
        }
        entity.age = Math.min(time.lifespan, integer(entity.age, 0, 0, time.lifespan) + 1);
        result.aged += 1;
        if (time.decay && entity.age >= time.lifespan) {
            board.delete(key);
            result.expired.push(key);
        }
    }
    return result;
}
