const NONABELIAN_CHANNELS = Object.freeze({
    ising: Object.freeze({
        'sigma|sigma': Object.freeze(['1', 'psi'])
    }),
    fibonacci: Object.freeze({
        'tau|tau': Object.freeze(['1', 'tau'])
    })
});

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function modelKey(model = 'toric_code') {
    return Object.prototype.hasOwnProperty.call(NONABELIAN_CHANNELS, model) ? model : '';
}

function pairKey(firstType = '1', secondType = '1') {
    return [String(firstType || '1'), String(secondType || '1')].sort().join('|');
}

export function nonabelianFusionChannels(firstType = '1', secondType = '1', model = 'toric_code') {
    const key = modelKey(model);
    if (!key) return [];
    return [...(NONABELIAN_CHANNELS[key][pairKey(firstType, secondType)] || [])];
}

export function isNonabelianChannelPair(firstType = '1', secondType = '1', model = 'toric_code') {
    return nonabelianFusionChannels(firstType, secondType, model).length > 1;
}

export function createHiddenFusionState(values = {}, config = {}) {
    return {
        model: modelKey(values.model || config.anyonModel) || 'ising',
        currentTargetId: String(values.currentTargetId || ''),
        currentChannel: values.currentChannel || null,
        currentPossibleOutputs: Array.isArray(values.currentPossibleOutputs) ? [...values.currentPossibleOutputs] : [],
        revealed: Boolean(values.revealed),
        channels: cloneValue(values.channels || {}),
        transitions: Array.isArray(values.transitions) ? values.transitions.map(cloneValue) : [],
        snapshots: Array.isArray(values.snapshots) ? values.snapshots.map(cloneValue) : []
    };
}

export function cloneHiddenFusionState(state = null) {
    return state ? createHiddenFusionState(cloneValue(state), state) : null;
}

export function ensureNonabelianFusionMemory(token, values = {}, config = {}) {
    if (!token) return token;
    const existing = token.hiddenFusionState && typeof token.hiddenFusionState === 'object'
        ? token.hiddenFusionState
        : null;
    token.hiddenFusionState = createHiddenFusionState(
        values.hiddenFusionState || existing || {},
        config
    );
    token.fusionChannel = values.fusionChannel
        || token.fusionChannel
        || (token.hiddenFusionState.revealed ? token.hiddenFusionState.currentChannel : '?')
        || '?';
    token.fusionChannelHistory = Array.isArray(values.fusionChannelHistory)
        ? values.fusionChannelHistory.map(cloneValue)
        : (Array.isArray(token.fusionChannelHistory) ? token.fusionChannelHistory : []);
    token.measurementHistory = Array.isArray(values.measurementHistory)
        ? values.measurementHistory.map(cloneValue)
        : (Array.isArray(token.measurementHistory) ? token.measurementHistory : []);
    return token;
}

function initialChannel(possibleOutputs = []) {
    return possibleOutputs[0] || null;
}

function symbolicTransition(channel, possibleOutputs = [], generator = {}) {
    if (possibleOutputs.length <= 1) return channel || possibleOutputs[0] || null;
    const currentIndex = Math.max(0, possibleOutputs.indexOf(channel));
    const step = generator.sign < 0 ? -1 : 1;
    return possibleOutputs[(currentIndex + step + possibleOutputs.length) % possibleOutputs.length];
}

function setVisibleChannel(token) {
    const state = token.hiddenFusionState;
    token.fusionChannel = state?.revealed && state.currentChannel ? state.currentChannel : '?';
}

function channelRecordKey(generator = {}) {
    return String(generator.targetId || 'global');
}

function createPairRecord({
    token,
    target,
    generator,
    config
}) {
    const model = modelKey(config.anyonModel);
    const targetType = target?.anyonType || target?.type || target?.targetAnyonType || '';
    const possibleOutputs = nonabelianFusionChannels(token.anyonType, targetType, model);
    if (possibleOutputs.length <= 1) return null;
    return {
        targetId: String(generator.targetId || target?.id || ''),
        input: [token.anyonType, targetType],
        possibleOutputs,
        currentChannel: initialChannel(possibleOutputs),
        measured: false,
        entanglementRangeMode: config.entanglementRangeMode || 'infinite',
        entanglementDistance: config.entanglementRangeMode === 'finite'
            ? Math.max(1, Math.floor(Number(config.entanglementDistance) || 1))
            : null
    };
}

function restoreSnapshot(token, generator, config = {}) {
    ensureNonabelianFusionMemory(token, token, config);
    const state = token.hiddenFusionState;
    const snapshot = state.snapshots.pop();
    if (snapshot?.state) {
        token.hiddenFusionState = createHiddenFusionState(snapshot.state, config);
    }
    setVisibleChannel(token);
    const restored = {
        action: 'restore_previous_channel',
        generator: cloneValue(generator),
        restored: Boolean(snapshot?.state),
        currentTargetId: token.hiddenFusionState.currentTargetId,
        currentChannel: token.hiddenFusionState.currentChannel,
        visibleChannel: token.fusionChannel
    };
    token.fusionChannelHistory.push(restored);
    return restored;
}

export function applyNonabelianFusionTransition(token, generator, config = {}, context = {}) {
    if (!token || config.braidMemoryMode !== 'nonabelian_fusion_channel') return null;
    ensureNonabelianFusionMemory(token, token, config);
    if (context.cancelledInverse) return restoreSnapshot(token, generator, config);

    const target = context.target || {
        id: generator.targetId,
        anyonType: context.targetAnyonType || context.targetType
    };
    const key = channelRecordKey(generator);
    let record = token.hiddenFusionState.channels[key];
    if (!record) {
        record = createPairRecord({ token, target, generator, config });
        if (!record) return null;
        token.hiddenFusionState.channels[key] = record;
        token.hiddenFusionState.currentTargetId = record.targetId;
        token.hiddenFusionState.currentChannel = record.currentChannel;
        token.hiddenFusionState.currentPossibleOutputs = [...record.possibleOutputs];
        token.hiddenFusionState.revealed = false;
    }

    const beforeState = cloneHiddenFusionState(token.hiddenFusionState);
    token.hiddenFusionState.snapshots.push({
        generator: cloneValue(generator),
        state: beforeState
    });

    const beforeChannel = record.currentChannel;
    const afterChannel = symbolicTransition(beforeChannel, record.possibleOutputs, generator);
    record.currentChannel = afterChannel;
    record.measured = false;
    token.hiddenFusionState.currentTargetId = record.targetId;
    token.hiddenFusionState.currentChannel = afterChannel;
    token.hiddenFusionState.currentPossibleOutputs = [...record.possibleOutputs];
    token.hiddenFusionState.revealed = false;
    setVisibleChannel(token);

    const transition = {
        action: 'symbolic_braid_transition',
        model: token.hiddenFusionState.model,
        targetId: record.targetId,
        input: [...record.input],
        possibleOutputs: [...record.possibleOutputs],
        beforeChannel,
        afterChannel,
        hidden: true,
        generator: cloneValue(generator)
    };
    token.hiddenFusionState.transitions.push(transition);
    token.fusionChannelHistory.push(transition);
    return transition;
}

export function hiddenFusionMeasurementForTokens(tokens = [], model = 'toric_code') {
    for (const token of tokens) {
        const state = token?.hiddenFusionState;
        if (!state?.currentChannel) continue;
        const resolvedModel = modelKey(state.model || model);
        if (!resolvedModel) continue;
        return {
            model: resolvedModel,
            trueResult: state.currentChannel,
            possibleOutputs: state.currentPossibleOutputs?.length ? [...state.currentPossibleOutputs] : [state.currentChannel],
            targetTokenIds: tokens.map((entry) => entry?.id).filter(Boolean)
        };
    }
    return null;
}

export function revealHiddenFusionChannels(tokens = [], measurement = {}) {
    for (const token of tokens) {
        if (!token?.hiddenFusionState?.currentChannel) continue;
        token.hiddenFusionState.revealed = true;
        const currentKey = token.hiddenFusionState.currentTargetId;
        if (currentKey && token.hiddenFusionState.channels[currentKey]) {
            token.hiddenFusionState.channels[currentKey].measured = true;
        }
        token.fusionChannel = token.hiddenFusionState.currentChannel;
        token.revealed = true;
        token.measurementHistory = [...(token.measurementHistory || []), measurement];
    }
}

export function fusionChannelDisplay(token) {
    if (!token?.hiddenFusionState?.currentChannel) return '';
    return token.hiddenFusionState.revealed ? token.hiddenFusionState.currentChannel : '?';
}
