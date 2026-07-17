import {
    applyNonabelianFusionTransition,
    ensureNonabelianFusionMemory
} from './NonabelianFusionMemory.js';

export const BRAID_MEMORY_MODES = Object.freeze([
    'off',
    'abelian_parity',
    'word_exact',
    'nonabelian_fusion_channel'
]);

export const BRAID_CANCELLATION_MODES = Object.freeze([
    'adjacent_inverse_only',
    'braid_group_relations'
]);

export const DEFAULT_BRAID_MEMORY_CONFIG = Object.freeze({
    braidMemoryMode: 'word_exact',
    maxBraidWordLength: 12,
    braidCancellationMode: 'adjacent_inverse_only',
    entanglementRangeMode: 'infinite',
    entanglementDistance: 4,
    allowOpponentUnbraid: true,
    allowFriendlyUnbraid: true,
    requireReverseInverseOrder: true,
    unbraidActionCost: 1
});

function integer(value, fallback, min = 0, max = 1024) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function normalizeSign(sign) {
    return Number(sign) < 0 ? -1 : 1;
}

function normalizeParity(value) {
    return Number(value) % 2 === 1 ? 1 : 0;
}

export function normalizeBraidMemoryMode(mode = DEFAULT_BRAID_MEMORY_CONFIG.braidMemoryMode) {
    return BRAID_MEMORY_MODES.includes(mode) ? mode : DEFAULT_BRAID_MEMORY_CONFIG.braidMemoryMode;
}

export function normalizeBraidCancellationMode(mode = DEFAULT_BRAID_MEMORY_CONFIG.braidCancellationMode) {
    return BRAID_CANCELLATION_MODES.includes(mode) ? mode : DEFAULT_BRAID_MEMORY_CONFIG.braidCancellationMode;
}

export function normalizeBraidMemoryConfig(config = {}) {
    const entanglementRangeMode = config.entanglementRangeMode === 'finite' ? 'finite' : 'infinite';
    return {
        ...DEFAULT_BRAID_MEMORY_CONFIG,
        ...config,
        braidMemoryMode: normalizeBraidMemoryMode(config.braidMemoryMode),
        maxBraidWordLength: integer(
            config.maxBraidWordLength,
            DEFAULT_BRAID_MEMORY_CONFIG.maxBraidWordLength,
            0,
            256
        ),
        braidCancellationMode: normalizeBraidCancellationMode(config.braidCancellationMode),
        entanglementRangeMode,
        entanglementDistance: integer(
            config.entanglementDistance,
            DEFAULT_BRAID_MEMORY_CONFIG.entanglementDistance,
            1,
            256
        ),
        allowOpponentUnbraid: config.allowOpponentUnbraid ?? DEFAULT_BRAID_MEMORY_CONFIG.allowOpponentUnbraid,
        allowFriendlyUnbraid: config.allowFriendlyUnbraid ?? DEFAULT_BRAID_MEMORY_CONFIG.allowFriendlyUnbraid,
        requireReverseInverseOrder: config.requireReverseInverseOrder ?? DEFAULT_BRAID_MEMORY_CONFIG.requireReverseInverseOrder,
        unbraidActionCost: integer(
            config.unbraidActionCost,
            DEFAULT_BRAID_MEMORY_CONFIG.unbraidActionCost,
            0,
            16
        )
    };
}

export function createBraidGenerator({ generator = 'sigma', index = 0, sign = 1, targetId = '', tick = 0 } = {}) {
    return {
        generator: String(generator || 'sigma'),
        index: integer(index, 0, 0, 1024),
        sign: normalizeSign(sign),
        targetId: String(targetId || ''),
        tick: integer(tick, 0, 0, Number.MAX_SAFE_INTEGER)
    };
}

export function inverseGenerator(generator) {
    const normalized = createBraidGenerator(generator);
    return {
        ...normalized,
        sign: normalized.sign === 1 ? -1 : 1
    };
}

export function fullInverseBraidWord(word = []) {
    return [...word].reverse().map((generator) => inverseGenerator(generator));
}

export function nextRequiredUnbraidGenerator(word = []) {
    return word.length ? inverseGenerator(word[word.length - 1]) : null;
}

export function generatorsAreInverse(first, second) {
    if (!first || !second) return false;
    const left = createBraidGenerator(first);
    const right = createBraidGenerator(second);
    return left.generator === right.generator
        && left.index === right.index
        && left.targetId === right.targetId
        && left.sign === -right.sign;
}

function generatorComparable(a, b) {
    if (a.generator !== b.generator) return false;
    if (a.sign !== b.sign) return false;
    return true;
}

function generatorOrderKey(generator) {
    return [
        generator.generator,
        String(generator.index).padStart(4, '0'),
        generator.sign < 0 ? '1' : '0',
        generator.targetId
    ].join(':');
}

function braidTripleKey(triple) {
    return triple.map(generatorOrderKey).join('|');
}

function relationEquivalentTriple(triple) {
    const [a, b, c] = triple;
    if (a.generator !== b.generator || b.generator !== c.generator) return null;
    if (a.sign !== b.sign || b.sign !== c.sign) return null;
    if (a.index !== c.index || a.targetId !== c.targetId) return null;
    if (Math.abs(a.index - b.index) !== 1) return null;
    return [
        { ...b },
        { ...a },
        { ...b }
    ];
}

function simplifyBraidGroupRelations(word = []) {
    const simplified = word.map((entry) => createBraidGenerator(entry));
    let changed = true;
    let guard = simplified.length * simplified.length + 8;
    while (changed && guard > 0) {
        changed = false;
        guard--;

        for (let index = 0; index < simplified.length - 1; index++) {
            if (generatorsAreInverse(simplified[index], simplified[index + 1])) {
                simplified.splice(index, 2);
                changed = true;
                index = Math.max(-1, index - 2);
            }
        }

        for (let index = 0; index < simplified.length - 1; index++) {
            const left = simplified[index];
            const right = simplified[index + 1];
            if (generatorComparable(left, right)
                && Math.abs(left.index - right.index) > 1
                && generatorOrderKey(right) < generatorOrderKey(left)) {
                simplified[index] = right;
                simplified[index + 1] = left;
                changed = true;
            }
        }

        for (let index = 0; index < simplified.length - 2; index++) {
            const triple = simplified.slice(index, index + 3);
            const equivalent = relationEquivalentTriple(triple);
            if (equivalent && braidTripleKey(equivalent) < braidTripleKey(triple)) {
                simplified.splice(index, 3, ...equivalent);
                changed = true;
            }
        }
    }
    return simplified;
}

export function simplifyBraidWord(word = [], config = {}) {
    const normalizedConfig = normalizeBraidMemoryConfig(config);
    let simplified = [];
    for (const generator of word) {
        const normalized = createBraidGenerator(generator);
        const previous = simplified[simplified.length - 1];
        if (generatorsAreInverse(previous, normalized)) {
            simplified.pop();
        } else {
            simplified.push(normalized);
        }
    }
    if (normalizedConfig.braidCancellationMode === 'braid_group_relations') {
        simplified = simplifyBraidGroupRelations(simplified);
    }

    if (normalizedConfig.maxBraidWordLength <= 0) return [];
    return simplified.slice(-normalizedConfig.maxBraidWordLength);
}

export function braidGeneratorToText(generator, { displayBase = 1 } = {}) {
    if (!generator) return '';
    if (generator.symbol) return String(generator.symbol);
    const normalized = createBraidGenerator(generator);
    const index = normalized.index + displayBase;
    return normalized.sign < 0 ? `σ${index}^-1` : `σ${index}`;
}

export function braidWordToText(word = [], options = {}) {
    return word.length
        ? word.map((generator) => braidGeneratorToText(generator, options)).join(' ')
        : 'identity';
}

export function requiredInverseBraidWordText(word = [], options = {}) {
    return braidWordToText(fullInverseBraidWord(word), options);
}

export function defineBraidMemoryAccessors(token) {
    if (!token || Object.prototype.hasOwnProperty.call(token, 'isBraided')) return token;
    Object.defineProperty(token, 'isBraided', {
        enumerable: true,
        configurable: true,
        get() {
            return normalizeParity(this.braidParity) === 1
                || (Array.isArray(this.braidWord) && this.braidWord.length > 0);
        }
    });
    return token;
}

export function attachBraidMemory(token, values = {}, config = {}) {
    if (!token) return token;
    const normalizedConfig = normalizeBraidMemoryConfig(config);
    token.braidWord = Array.isArray(values.braidWord)
        ? simplifyBraidWord(values.braidWord, normalizedConfig)
        : [];
    token.braidParity = normalizeParity(values.braidParity);
    if (normalizedConfig.braidMemoryMode === 'abelian_parity' && values.braidParity == null) {
        token.braidParity = token.braidWord.length % 2;
    }
    token.braidHistory = Array.isArray(values.braidHistory)
        ? values.braidHistory.map((entry) => createBraidGenerator(entry))
        : [];
    token.braidedWith = Array.isArray(values.braidedWith)
        ? [...new Set(values.braidedWith.map((id) => String(id)))]
        : [];
    if (normalizedConfig.braidMemoryMode === 'nonabelian_fusion_channel') {
        ensureNonabelianFusionMemory(token, values, normalizedConfig);
    }
    return defineBraidMemoryAccessors(token);
}

export function appendBraidGenerator(token, generator, config = {}, context = {}) {
    const normalizedConfig = normalizeBraidMemoryConfig(config);
    attachBraidMemory(token, token, normalizedConfig);
    const beforeWord = token.braidWord.map((entry) => ({ ...entry }));
    const previousLast = beforeWord[beforeWord.length - 1] || null;
    const beforeParity = normalizeParity(token.braidParity);
    if (normalizedConfig.braidMemoryMode === 'off') {
        return {
            appended: null,
            previousLast,
            beforeParity,
            braidParity: beforeParity,
            parityToggled: false,
            cancelledInverse: false,
            successfulPartialUnbraid: false,
            fullyUnbraided: false,
            braidWord: [...token.braidWord],
            isBraided: token.isBraided
        };
    }

    const normalized = createBraidGenerator(generator);
    token.braidHistory.push(normalized);
    if (normalized.targetId && !token.braidedWith.includes(normalized.targetId)) {
        token.braidedWith.push(normalized.targetId);
    }

    if (normalizedConfig.braidMemoryMode === 'abelian_parity') {
        token.braidParity = beforeParity ? 0 : 1;
        const sameTargetIndex = token.braidWord.findIndex((entry) =>
            entry.generator === normalized.generator
            && entry.index === normalized.index
            && entry.targetId === normalized.targetId);
        if (sameTargetIndex >= 0) {
            token.braidWord.splice(sameTargetIndex, 1);
        } else {
            token.braidWord.push({ ...normalized, sign: 1 });
        }
    } else {
        token.braidWord.push(normalized);
        token.braidWord = simplifyBraidWord(token.braidWord, normalizedConfig);
    }

    const cancelledInverse = normalizedConfig.braidMemoryMode !== 'abelian_parity'
        && generatorsAreInverse(previousLast, normalized)
        && token.braidWord.length === Math.max(0, beforeWord.length - 1);
    const parityToggled = normalizedConfig.braidMemoryMode === 'abelian_parity'
        && beforeParity !== normalizeParity(token.braidParity);
    const fusionChannelUpdate = normalizedConfig.braidMemoryMode === 'nonabelian_fusion_channel'
        ? applyNonabelianFusionTransition(token, normalized, normalizedConfig, {
            ...context,
            cancelledInverse
        })
        : null;

    return {
        appended: normalized,
        previousLast,
        beforeParity,
        braidParity: normalizeParity(token.braidParity),
        parityToggled,
        cancelledInverse,
        successfulPartialUnbraid: normalizedConfig.braidMemoryMode === 'abelian_parity'
            ? beforeParity === 1 && normalizeParity(token.braidParity) === 0
            : cancelledInverse,
        fullyUnbraided: normalizedConfig.braidMemoryMode === 'abelian_parity'
            ? normalizeParity(token.braidParity) === 0
            : token.braidWord.length === 0,
        braidWord: token.braidWord.map((entry) => ({ ...entry })),
        fusionChannel: token.fusionChannel,
        hiddenFusionState: token.hiddenFusionState,
        fusionChannelUpdate,
        isBraided: token.isBraided
    };
}

export function applyBraid(token, target, braidEvent = {}, config = {}) {
    const { target: _internalTarget, ...eventData } = braidEvent;
    const targetId = String(braidEvent.targetId || target?.id || target || '');
    const generator = createBraidGenerator({
        generator: braidEvent.generator || 'sigma',
        index: braidEvent.index,
        sign: braidEvent.sign,
        targetId,
        tick: braidEvent.tick
    });
    const memory = appendBraidGenerator(token, generator, config, { target });
    return {
        ...eventData,
        targetId,
        braidGenerator: memory.appended,
        cancelledInverse: memory.cancelledInverse,
        fullyUnbraided: memory.fullyUnbraided,
        braidParity: memory.braidParity,
        parityToggled: memory.parityToggled,
        braidWord: memory.braidWord,
        fusionChannel: memory.fusionChannel,
        fusionChannelUpdate: memory.fusionChannelUpdate,
        isBraided: memory.isBraided
    };
}

export function attemptUnbraid(token, generator, config = {}, context = {}) {
    const normalizedConfig = normalizeBraidMemoryConfig(config);
    attachBraidMemory(token, token, normalizedConfig);
    const expected = nextRequiredUnbraidGenerator(token.braidWord);
    const normalized = createBraidGenerator(generator);
    const beforeLength = token.braidWord.length;
    const beforeParity = normalizeParity(token.braidParity);
    const result = appendBraidGenerator(token, normalized, normalizedConfig, context);
    if (normalizedConfig.braidMemoryMode === 'abelian_parity') {
        return {
            action: 'attempt_unbraid',
            expected: null,
            attempted: normalized,
            beforeLength,
            beforeParity,
            afterLength: token.braidWord.length,
            braidParity: normalizeParity(token.braidParity),
            parityToggled: result.parityToggled,
            successfulPartialUnbraid: beforeParity === 1 && normalizeParity(token.braidParity) === 0,
            fullyUnbraided: normalizeParity(token.braidParity) === 0,
            wrongOrder: false,
            braidWord: result.braidWord,
            fusionChannel: result.fusionChannel,
            fusionChannelUpdate: result.fusionChannelUpdate,
            isBraided: token.isBraided
        };
    }
    const reverseOrderRespected = !normalizedConfig.requireReverseInverseOrder
        || !expected
        || generatorsAreInverse(result.previousLast, normalized);
    return {
        action: 'attempt_unbraid',
        expected,
        attempted: normalized,
        beforeLength,
        beforeParity,
        afterLength: token.braidWord.length,
        braidParity: normalizeParity(token.braidParity),
        parityToggled: result.parityToggled,
        successfulPartialUnbraid: result.successfulPartialUnbraid && reverseOrderRespected,
        fullyUnbraided: token.braidWord.length === 0,
        wrongOrder: beforeLength > 0 && !result.successfulPartialUnbraid,
        braidWord: result.braidWord,
        fusionChannel: result.fusionChannel,
        fusionChannelUpdate: result.fusionChannelUpdate,
        isBraided: token.isBraided
    };
}

export function mergeBraidMemory(target, source, config = {}) {
    attachBraidMemory(target, target, config);
    attachBraidMemory(source, source, config);
    target.braidHistory.push(...source.braidHistory.map((entry) => ({ ...entry })));
    target.braidedWith = [...new Set([...target.braidedWith, ...source.braidedWith])];
    target.braidWord = simplifyBraidWord([...target.braidWord, ...source.braidWord], config);
    target.braidParity = normalizeParity(target.braidParity) ^ normalizeParity(source.braidParity);
    return target;
}

export function braidGeneratorIndex(tokenIds = [], firstId = '', secondId = '') {
    const ordered = [...new Set(tokenIds.map((id) => String(id)))].sort();
    const firstIndex = ordered.indexOf(String(firstId));
    const secondIndex = ordered.indexOf(String(secondId));
    if (firstIndex < 0 || secondIndex < 0) return 0;
    return Math.max(0, Math.min(firstIndex, secondIndex));
}

export function braidSignFromDirection(direction = []) {
    const firstNonZero = direction.find((value) => value !== 0);
    return firstNonZero == null || firstNonZero >= 0 ? 1 : -1;
}

export function braidSignFromWinding(winding = {}) {
    for (const axis of ['x', 'y', 'z', 'w']) {
        if (winding[axis] < 0) return -1;
        if (winding[axis] > 0) return 1;
    }
    return 1;
}
