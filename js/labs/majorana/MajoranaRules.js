export const MAJORANA_MODE = 'majorana_modes';
export const MAJORANA_FLAVORS = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]);
export const MAJORANA_PARITIES = Object.freeze(['even', 'odd', 'random']);

export function normalizeFlavor(flavor = 0) {
    const value = Number(flavor);
    if (!Number.isInteger(value) || !MAJORANA_FLAVORS.includes(value)) return 0;
    return value;
}

export function flavorLabel(flavor = 0) {
    return `Flavor ${normalizeFlavor(flavor)}`;
}

export function normalizeParity(parity = 'even') {
    const value = String(parity || '').toLowerCase();
    return MAJORANA_PARITIES.includes(value) ? value : 'even';
}

export function parityToFusionChannel(parity = 'even') {
    return normalizeParity(parity) === 'odd' ? '\u03c8' : '1';
}

export function fusionRule(left, right) {
    const a = String(left || '1');
    const b = String(right || '1');
    if (a === '1') return [b];
    if (b === '1') return [a];
    if (a === '\u03c3' && b === '\u03c3') return ['1', '\u03c8'];
    if ((a === '\u03c3' && b === '\u03c8') || (a === '\u03c8' && b === '\u03c3')) return ['\u03c3'];
    if (a === '\u03c8' && b === '\u03c8') return ['1'];
    return ['unknown'];
}

export function stripGammaSign(label = '') {
    return String(label || '').replace(/^-/, '');
}

export function negateGammaLabel(label = '') {
    const value = String(label || '').trim();
    if (!value) return '';
    return value.startsWith('-') ? value.slice(1) : `-${value}`;
}

export function gammaDisplay(label = '') {
    return String(label || '').replace(/^gamma_/, '\u03b3');
}

export function majoranaBraidTransform(labelA, labelB, clockwise = true) {
    return clockwise
        ? { nextA: labelB, nextB: negateGammaLabel(labelA) }
        : { nextA: negateGammaLabel(labelB), nextB: labelA };
}

export function majoranaUnitarySymbol(modeA, modeB, clockwise = true) {
    const gammaA = gammaDisplay(modeA?.gammaLabel || modeA || '\u03b3_i');
    const gammaB = gammaDisplay(modeB?.gammaLabel || modeB || '\u03b3_j');
    const base = `U_${stripGammaSign(gammaA)}${stripGammaSign(gammaB)} = exp(\u03c0/4 ${gammaA} ${gammaB})`;
    return clockwise ? base : `${base}^-1`;
}

export function braidGeneratorSymbol(modeA, modeB, clockwise = true) {
    const a = stripGammaSign(gammaDisplay(modeA?.gammaLabel || modeA || 'i'));
    const b = stripGammaSign(gammaDisplay(modeB?.gammaLabel || modeB || 'j'));
    return clockwise ? `\u03c3_${a}${b}` : `\u03c3_${a}${b}^-1`;
}

export function deterministicParityFromIds(idA, idB, fallback = 'even') {
    const text = `${idA || ''}|${idB || ''}`;
    if (!text.trim()) return normalizeParity(fallback) === 'odd' ? 'odd' : 'even';
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
        hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
    }
    return Math.abs(hash) % 2 ? 'odd' : 'even';
}
