import { AnyonJumpGame } from './AnyonJump.js';

export const CLIFFORD_JUMP_MODE = 'clifford_jump';

const PAULI_TO_ANYON = Object.freeze({
    I: '1',
    X: 'e',
    Z: 'm',
    Y: 'psi'
});

const ANYON_TO_PAULI = Object.freeze({
    1: 'I',
    e: 'X',
    m: 'Z',
    psi: 'Y'
});

function normalizePauliType(type = 'X') {
    const value = String(type || 'X').trim().toUpperCase();
    return Object.hasOwn(PAULI_TO_ANYON, value) ? value : 'X';
}

function normalizeCliffordJumpType(type = 'X') {
    const raw = String(type || 'X').trim();
    if (Object.hasOwn(ANYON_TO_PAULI, raw)) return raw;
    return PAULI_TO_ANYON[normalizePauliType(raw)] || 'e';
}

export class CliffordJumpGame extends AnyonJumpGame {
    reset(options = {}) {
        super.reset({
            ...options,
            config: {
                ...options.config,
                anyonModel: 'toric_code',
                phaseModel: 'off'
            }
        });
        this.mode = CLIFFORD_JUMP_MODE;
        this.jumpAlgebra = 'clifford';
    }

    normalizeConfiguredType(type) {
        return normalizeCliffordJumpType(type);
    }

    displayType(type) {
        return ANYON_TO_PAULI[this.normalizeConfiguredType(type)] || String(type || 'I');
    }

    displayTokenType(tokenOrType) {
        const type = typeof tokenOrType === 'string' ? tokenOrType : tokenOrType?.anyonType;
        return this.displayType(type);
    }

    excitationTypeOptions() {
        return ['X', 'Z', 'Y'].map((value) => ({
            value,
            label: value,
            detail: value === 'Y'
                ? 'Y = XZ composite; 4 energy'
                : `${value} Pauli excitation; 2 energy`,
            cost: this.excitationCost(value)
        }));
    }

    tokenSnapshot(token) {
        return {
            ...super.tokenSnapshot(token),
            pauliLabel: this.displayTokenType(token),
            jumpAlgebra: this.jumpAlgebra
        };
    }

    exportState() {
        return {
            ...super.exportState(),
            mode: this.mode,
            jumpAlgebra: this.jumpAlgebra,
            algebraMap: { ...PAULI_TO_ANYON }
        };
    }
}

export function createCliffordJump(options = {}) {
    return new CliffordJumpGame(options);
}
