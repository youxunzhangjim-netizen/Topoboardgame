import { AnyonJumpGame } from './AnyonJump.js';

export const VIRASORO_JUMP_MODE = 'virasoro_jump';

const PRIMARY_TO_ANYON = Object.freeze({
    identity: '1',
    1: '1',
    sigma: 'sigma',
    epsilon: 'psi',
    psi: 'psi',
    vertex: 'psi'
});

const ANYON_TO_PRIMARY = Object.freeze({
    1: 'identity',
    sigma: 'sigma',
    psi: 'epsilon'
});

const PRIMARY_SYMBOLS = Object.freeze({
    identity: '1',
    sigma: '\u03c3',
    epsilon: '\u03b5',
    vertex: 'V'
});

function normalizePrimaryType(type = 'sigma') {
    const value = String(type || 'sigma').trim();
    return Object.hasOwn(PRIMARY_TO_ANYON, value) ? value : 'sigma';
}

export class VirasoroJumpGame extends AnyonJumpGame {
    reset(options = {}) {
        this.cftConfig = {
            model: options.cftModel || 'ising_CFT',
            primaryType: normalizePrimaryType(options.primaryType || 'sigma'),
            centralCharge: Number.isFinite(Number(options.centralCharge)) ? Number(options.centralCharge) : 0.5,
            maxMode: Number(options.maxMode) >= 2 ? 2 : 1,
            hiddenChannels: options.hiddenChannels !== false
        };
        super.reset({
            ...options,
            config: {
                ...options.config,
                anyonModel: 'ising',
                phaseModel: 'off',
                braidMemoryMode: options.config?.braidMemoryMode || 'nonabelian_fusion_channel'
            }
        });
        this.mode = VIRASORO_JUMP_MODE;
        this.jumpAlgebra = 'virasoro_cft';
    }

    normalizeConfiguredType(type) {
        const primary = normalizePrimaryType(type);
        return PRIMARY_TO_ANYON[primary] || super.normalizeConfiguredType(type);
    }

    primaryType(type) {
        return ANYON_TO_PRIMARY[this.normalizeConfiguredType(type)] || normalizePrimaryType(type);
    }

    displayType(type) {
        const primary = this.primaryType(type);
        return PRIMARY_SYMBOLS[primary] || String(primary || '1');
    }

    displayTokenType(tokenOrType) {
        const type = typeof tokenOrType === 'string' ? tokenOrType : tokenOrType?.anyonType;
        return this.displayType(type);
    }

    excitationTypeOptions() {
        return ['sigma', 'epsilon'].map((value) => ({
            value,
            label: PRIMARY_SYMBOLS[value],
            detail: value === 'sigma'
                ? 'sigma primary; non-Abelian Ising channel; 2 energy'
                : 'epsilon energy primary; 4 energy',
            cost: this.excitationCost(value)
        }));
    }

    tokenSnapshot(token) {
        return {
            ...super.tokenSnapshot(token),
            primaryType: this.primaryType(token?.anyonType),
            primaryLabel: this.displayTokenType(token),
            jumpAlgebra: this.jumpAlgebra
        };
    }

    exportState() {
        return {
            ...super.exportState(),
            mode: this.mode,
            jumpAlgebra: this.jumpAlgebra,
            cftConfig: { ...this.cftConfig },
            primaryMap: { ...PRIMARY_TO_ANYON }
        };
    }
}

export function createVirasoroJump(options = {}) {
    return new VirasoroJumpGame(options);
}
