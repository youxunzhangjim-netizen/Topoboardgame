export const PAULI_LABELS = Object.freeze(['I', 'X', 'Y', 'Z']);
export const CLIFFORD_TRANSPORTS = Object.freeze(['identity', 'H', 'S']);

const LABEL_TO_PAIR = Object.freeze({
    I: Object.freeze({ x: 0, z: 0 }),
    X: Object.freeze({ x: 1, z: 0 }),
    Z: Object.freeze({ x: 0, z: 1 }),
    Y: Object.freeze({ x: 1, z: 1 })
});

const PAIR_TO_LABEL = Object.freeze({
    '0,0': 'I',
    '1,0': 'X',
    '0,1': 'Z',
    '1,1': 'Y'
});

export function normalizePauliLabel(label, fallback = 'I') {
    const value = String(label || fallback).trim().toUpperCase();
    return Object.prototype.hasOwnProperty.call(LABEL_TO_PAIR, value) ? value : fallback;
}

export function pauliToPair(label) {
    const pair = LABEL_TO_PAIR[normalizePauliLabel(label)];
    return { x: pair.x, z: pair.z };
}

export function pairToPauli(pair) {
    const x = Number(pair?.x) & 1;
    const z = Number(pair?.z) & 1;
    return PAIR_TO_LABEL[`${x},${z}`] || 'I';
}

export function normalizePauli(value) {
    if (typeof value === 'string') return pauliToPair(value);
    return pauliToPair(pairToPauli(value));
}

export function symplecticProduct(p, q) {
    const left = normalizePauli(p);
    const right = normalizePauli(q);
    return (left.x * right.z + left.z * right.x) & 1;
}

export function commute(p, q) {
    return symplecticProduct(p, q) === 0;
}

export function anticommute(p, q) {
    return symplecticProduct(p, q) === 1;
}

export function applyClifford(pauli, generator = 'identity') {
    const pair = normalizePauli(pauli);
    switch (normalizeTransport(generator)) {
        case 'H':
            return { x: pair.z, z: pair.x };
        case 'S':
            return { x: pair.x, z: (pair.x + pair.z) & 1 };
        default:
            return pair;
    }
}

export function transformPauliLabel(label, generator = 'identity') {
    return pairToPauli(applyClifford(label, generator));
}

export function normalizePauliSign(sign = 1) {
    return Number(sign) < 0 ? -1 : 1;
}

export function transformSignedPauli(value = {}, generator = 'identity', trackSigns = true) {
    const beforeLabel = normalizePauliLabel(value.pauliLabel || value.pauli || value.label, 'I');
    const beforeSign = normalizePauliSign(value.pauliSign ?? value.sign ?? 1);
    const transport = normalizeTransport(generator);
    let afterSign = beforeSign;
    if (trackSigns && (transport === 'H' || transport === 'S') && beforeLabel === 'Y') {
        afterSign *= -1;
    }
    return {
        pauliLabel: transformPauliLabel(beforeLabel, transport),
        pauliSign: afterSign
    };
}

export function normalizeTransport(transport = 'identity') {
    const value = String(transport || 'identity').trim();
    if (value === 'I' || value.toLowerCase() === 'id') return 'identity';
    return CLIFFORD_TRANSPORTS.includes(value) ? value : 'identity';
}

export function composeTransports(transports = []) {
    return transports
        .map(normalizeTransport)
        .filter((transport) => transport !== 'identity');
}

export function transportPauliLabel(label, transports = []) {
    return composeTransports(Array.isArray(transports) ? transports : [transports])
        .reduce((current, transport) => transformPauliLabel(current, transport), normalizePauliLabel(label));
}

export function defaultSeamTransport({ topology = '', twisted = false, side = '' } = {}) {
    const name = String(topology || '').toLowerCase();
    const boundarySide = String(side || '').toLowerCase();
    if (twisted || ['rp2', 'mobius', 'klein', 'klein_bottle'].includes(name)) return 'H';
    if (name === 'sphere' && ['north', 'south', 'top', 'bottom'].includes(boundarySide)) return 'H';
    return 'identity';
}

export function edgeTransport(edge = {}) {
    return normalizeTransport(edge.transport || defaultSeamTransport(edge));
}

export function transportLabelAcrossEdges(label, edges = []) {
    return transportPauliLabel(label, edges.map(edgeTransport));
}

export function transportSignedPauliAcrossEdges(value = {}, edges = [], trackSigns = true) {
    return edges
        .map(edgeTransport)
        .reduce((current, transport) => transformSignedPauli(current, transport, trackSigns), {
            pauliLabel: normalizePauliLabel(value.pauliLabel || value.pauli || value.label, 'I'),
            pauliSign: normalizePauliSign(value.pauliSign ?? value.sign ?? 1)
        });
}

export function getPauliLabel(entity, fallback = 'I') {
    return normalizePauliLabel(entity?.pauli ?? entity?.pauliLabel, fallback);
}

export function setPauliLabel(entity, label) {
    if (entity && typeof entity === 'object') entity.pauli = normalizePauliLabel(label);
    return entity;
}

export function canCliffordCapture(attacker, defender) {
    if (!attacker || !defender) return false;
    return anticommute(getPauliLabel(attacker), getPauliLabel(defender));
}

export function applyCliffordToEntity(entity, generator) {
    if (!entity || typeof entity !== 'object') return entity;
    entity.pauli = transformPauliLabel(getPauliLabel(entity), generator);
    return entity;
}

export function algebraicPressureBetween(stone, neighbor) {
    if (!stone || !neighbor || stone.color === neighbor.color) return 0;
    return anticommute(getPauliLabel(stone), getPauliLabel(neighbor)) ? 1 : 0;
}

export function algebraicPressureForIndex(index, { board, labels, neighborsFromIndex, valueToColor }) {
    const value = board?.[index];
    const color = valueToColor?.(value) || '';
    if (!color) return 0;
    const stone = { color, pauli: labels?.[index] || 'I' };
    return neighborsFromIndex(index).reduce((pressure, neighborIndex) => {
        const neighborColor = valueToColor?.(board[neighborIndex]) || '';
        if (!neighborColor || neighborColor === color) return pressure;
        return pressure + algebraicPressureBetween(stone, {
            color: neighborColor,
            pauli: labels?.[neighborIndex] || 'I'
        });
    }, 0);
}
