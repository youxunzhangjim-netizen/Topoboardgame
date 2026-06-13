import { coordKey } from '../topology/GraphTopologies.js';
import { GO_COLORS } from '../go/GraphGoGame.js';

export const VIRASORO_ACTIONS = Object.freeze(['L-1', 'L0', 'L1', 'L-2', 'L2']);

const DEFAULT_CONFIG = Object.freeze({
    enabled: true,
    centralCharge: 1,
    maxMode: 1,
    removeUnstable: false
});

function finiteNumber(value, fallback, min = -Infinity, max = Infinity) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function integer(value, fallback, min = 1, max = 2) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function cloneCoord(coord) {
    return [...coord];
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

export function normalizeVirasoroConfig(config = {}) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        enabled: config.enabled ?? DEFAULT_CONFIG.enabled,
        centralCharge: finiteNumber(config.centralCharge, DEFAULT_CONFIG.centralCharge, 0, 64),
        maxMode: integer(config.maxMode, DEFAULT_CONFIG.maxMode),
        removeUnstable: Boolean(config.removeUnstable)
    };
}

function emptyState(key) {
    return {
        key,
        stress: 0,
        owner: ''
    };
}

export class VirasoroLayer {
    constructor({ topology, game, config = {} } = {}) {
        this.topology = topology;
        this.game = game;
        this.config = normalizeVirasoroConfig(config);
        this.vertexStates = new Map();
        this.unstableGroups = new Map();
        this.history = [];
    }

    reset({ topology = this.topology, game = this.game, config = this.config } = {}) {
        this.topology = topology;
        this.game = game;
        this.config = normalizeVirasoroConfig(config);
        this.vertexStates = new Map();
        this.unstableGroups = new Map();
        this.history = [];
    }

    enabled() {
        return Boolean(this.config.enabled);
    }

    allowedActions() {
        return this.config.maxMode >= 2
            ? [...VIRASORO_ACTIONS]
            : ['L-1', 'L0', 'L1'];
    }

    stateForKey(key) {
        if (!this.vertexStates.has(key)) this.vertexStates.set(key, emptyState(key));
        return this.vertexStates.get(key);
    }

    getState(coordOrKey) {
        const key = Array.isArray(coordOrKey) ? coordKey(coordOrKey) : String(coordOrKey || '');
        return this.vertexStates.get(key) || emptyState(key);
    }

    setStress(key, stress, owner = '') {
        const state = this.stateForKey(key);
        state.stress = Math.max(0, Number(stress) || 0);
        if (state.stress <= 0) {
            state.stress = 0;
            state.owner = '';
        } else if (owner) {
            state.owner = owner;
        }
        return state;
    }

    addStress(key, amount, owner) {
        const state = this.stateForKey(key);
        state.stress = Math.max(0, state.stress + amount);
        if (state.stress > 0 && owner) state.owner = owner;
        if (state.stress <= 0) state.owner = '';
        return state;
    }

    transferStress(states, fromKey, toKey, amount, owner) {
        if (!fromKey || !toKey || fromKey === toKey) return null;
        const from = states.get(fromKey) || emptyState(fromKey);
        const moved = Math.min(amount, from.stress);
        if (moved <= 0) return null;
        const to = states.get(toKey) || emptyState(toKey);
        states.set(fromKey, {
            ...from,
            stress: Math.max(0, from.stress - moved),
            owner: from.stress - moved > 0 ? from.owner : ''
        });
        states.set(toKey, {
            ...to,
            stress: to.stress + moved,
            owner
        });
        return { fromKey, toKey, amount: moved };
    }

    coordForKey(key) {
        return this.game.coordFromKey(key);
    }

    isEmptyKey(key) {
        return this.game.valueAtKey(key) === GO_COLORS.empty;
    }

    groupAt(coord, player) {
        const info = this.game.groupInfoAt(coord);
        if (!info) return { ok: false, error: 'Choose a stone group.' };
        if (info.color !== player) return { ok: false, error: 'Choose a friendly group.' };
        return { ok: true, group: info };
    }

    stepMany(coord, direction, count) {
        let current = coord;
        for (let index = 0; index < count; index++) {
            const step = this.topology.step(current, direction);
            if (!step) return null;
            current = step.coord;
        }
        return current;
    }

    affectedFromStates(before, after) {
        const keys = new Set([...before.keys(), ...after.keys()]);
        return [...keys]
            .map((key) => {
                const previous = before.get(key) || emptyState(key);
                const next = after.get(key) || emptyState(key);
                return {
                    key,
                    coord: this.coordForKey(key),
                    before: previous.stress,
                    after: next.stress,
                    owner: next.owner,
                    delta: next.stress - previous.stress
                };
            })
            .filter((item) => Math.abs(item.delta) > 1e-9);
    }

    previewAction({ action = 'L0', player = this.game.currentPlayer, coord = null, direction = null } = {}) {
        if (!this.enabled()) return { ok: false, error: 'Virasoro layer is disabled.' };
        if (!this.allowedActions().includes(action)) return { ok: false, error: `${action} is disabled by max mode N=${this.config.maxMode}.` };
        if (!['black', 'white'].includes(player)) return { ok: false, error: 'Unknown player.' };

        const before = new Map([...this.vertexStates.entries()].map(([key, state]) => [key, { ...state }]));
        const after = new Map([...this.vertexStates.entries()].map(([key, state]) => [key, { ...state }]));
        const transfers = [];
        const normalized = coord ? this.topology.normalize(coord) : null;
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };

        if (action === 'L0') {
            const selected = this.groupAt(normalized, player);
            if (!selected.ok) return selected;
            for (const liberty of selected.group.liberties) {
                const state = after.get(liberty) || emptyState(liberty);
                after.set(liberty, { ...state, stress: state.stress + 1, owner: player });
            }
            return {
                ok: true,
                action,
                player,
                group: selected.group,
                h: selected.group.h,
                affected: this.affectedFromStates(before, after),
                transfers
            };
        }

        if (action === 'L-1' || action === 'L-2') {
            const selected = this.groupAt(normalized, player);
            if (!selected.ok) return selected;
            if (!Array.isArray(direction)) return { ok: false, error: 'Choose a graph direction.' };
            const distance = action === 'L-2' ? 2 : 1;
            for (const liberty of selected.group.liberties) {
                const fromCoord = this.coordForKey(liberty);
                const toCoord = this.stepMany(fromCoord, direction, distance);
                if (!toCoord) continue;
                const toKey = coordKey(toCoord);
                if (!this.isEmptyKey(liberty) || !this.isEmptyKey(toKey)) continue;
                const transfer = this.transferStress(after, liberty, toKey, 1, player);
                if (transfer) transfers.push(transfer);
            }
            return {
                ok: true,
                action,
                player,
                group: selected.group,
                h: selected.group.h,
                affected: this.affectedFromStates(before, after),
                transfers
            };
        }

        if (action === 'L1' || action === 'L2') {
            const targetKey = coordKey(normalized);
            if (!this.isEmptyKey(targetKey)) return { ok: false, error: `${action} targets an empty vertex.` };
            const sourceKeys = new Set();
            if (action === 'L1') {
                for (const neighbor of this.topology.neighbors(normalized)) sourceKeys.add(coordKey(neighbor));
            } else {
                for (const direction of this.topology.directions()) {
                    const source = this.stepMany(normalized, direction, 2);
                    if (source) sourceKeys.add(coordKey(source));
                }
            }
            for (const sourceKey of sourceKeys) {
                if (!this.isEmptyKey(sourceKey)) continue;
                const transfer = this.transferStress(after, sourceKey, targetKey, 1, player);
                if (transfer) transfers.push(transfer);
            }
            return {
                ok: true,
                action,
                player,
                target: normalized,
                affected: this.affectedFromStates(before, after),
                transfers
            };
        }

        return { ok: false, error: 'Unknown Virasoro action.' };
    }

    applyAction(input = {}) {
        const preview = this.previewAction(input);
        if (!preview.ok) return preview;
        for (const affected of preview.affected) {
            this.setStress(affected.key, affected.after, affected.owner);
        }
        const instability = this.evaluateInstability();
        const event = {
            type: 'virasoro',
            action: preview.action,
            player: preview.player,
            coord: input.coord ? cloneCoord(input.coord) : null,
            direction: input.direction ? cloneCoord(input.direction) : null,
            affected: preview.affected.map(cloneValue),
            transfers: preview.transfers.map(cloneValue),
            instability
        };
        this.history.unshift(event);
        return { ok: true, event, preview, instability };
    }

    evaluateInstability() {
        const unstable = new Map();
        const removed = [];
        for (const group of this.game.connectedGroups()) {
            const h = group.group.size / 2;
            let enemyStressPressure = 0;
            for (const liberty of group.liberties) {
                const state = this.getState(liberty);
                if (state.owner && state.owner !== group.color) enemyStressPressure += state.stress;
            }
            const threshold = h + this.config.centralCharge;
            if (enemyStressPressure > threshold) {
                const id = [...group.group].sort().join('|');
                const entry = {
                    id,
                    color: group.color,
                    stones: [...group.group].map((key) => this.coordForKey(key)),
                    liberties: [...group.liberties].map((key) => this.coordForKey(key)),
                    h,
                    centralCharge: this.config.centralCharge,
                    enemyStressPressure,
                    threshold,
                    unstable: true,
                    virtualShieldLost: true
                };
                unstable.set(id, entry);
                if (this.config.removeUnstable) {
                    const removedCount = this.game.applyVirtualRemoval(group.group, group.color);
                    if (removedCount) removed.push({ id, color: group.color, removedCount });
                }
            }
        }
        this.unstableGroups = unstable;
        return {
            unstableGroups: [...unstable.values()],
            removed
        };
    }

    groupStatusForKey(key) {
        for (const group of this.unstableGroups.values()) {
            if (group.stones.some((coord) => coordKey(coord) === key)) return group;
        }
        return null;
    }

    exportState() {
        return {
            config: { ...this.config },
            vertexStates: [...this.vertexStates.entries()].map(([key, state]) => ({
                key,
                coord: this.coordForKey(key),
                stress: state.stress,
                owner: state.owner
            })),
            unstableGroups: [...this.unstableGroups.values()].map(cloneValue),
            history: this.history.map(cloneValue)
        };
    }
}
