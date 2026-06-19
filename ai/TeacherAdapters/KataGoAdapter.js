function unavailable(reason) {
    return {
        engine: 'katago',
        available: false,
        reason,
        bestMove: null,
        winrate: null,
        scoreLead: null
    };
}

function isNormalGoContext(context = {}) {
    const gameType = String(context.gameType || context.game || '').toLowerCase();
    const topology = String(context.topology || context.boundary || 'normal').toLowerCase();
    const dimension = Number(context.dimension || 2);
    return gameType.includes('go')
        && dimension === 2
        && ['normal', 'standard', 'flat', 'open', 'open2d', ''].includes(topology);
}

async function gtp(client, command) {
    if (typeof client?.gtp === 'function') return client.gtp(command);
    if (typeof client?.send === 'function') return client.send(command);
    if (typeof client?.write === 'function') return client.write(`${command}\n`);
    return '';
}

function parseKataGoResponse(response) {
    if (!response) return {};
    if (typeof response === 'object') return response;
    const text = String(response);
    const bestMove = text.match(/\bmove\s+([A-Za-z]\d+|pass|resign)/i)?.[1]
        || text.match(/\bgenmove\s+([A-Za-z]\d+|pass|resign)/i)?.[1]
        || null;
    const winrate = text.match(/\bwinrate\s+([0-9.]+)/i)?.[1];
    const scoreLead = text.match(/\bscoreLead\s+(-?[0-9.]+)/i)?.[1];
    return {
        bestMove,
        winrate: winrate == null ? null : Number(winrate),
        scoreLead: scoreLead == null ? null : Number(scoreLead),
        raw: text
    };
}

export class KataGoAdapter {
    constructor({ client = null, visits = 64, komi = 7.5 } = {}) {
        this.client = client;
        this.visits = visits;
        this.komi = komi;
    }

    isCompatible(context = {}) {
        return isNormalGoContext(context);
    }

    async analyze(gameState, options = {}) {
        const context = {
            gameType: options.gameType || gameState?.gameType || 'go',
            topology: options.topology || gameState?.topology || 'normal',
            dimension: options.dimension || gameState?.dimension || 2
        };
        if (!this.isCompatible(context)) {
            return unavailable('KataGo is used as a normal Go teacher only; torus, Mobius, RP2, and higher-dimensional Go stay local-topology tasks.');
        }
        if (!this.client) return unavailable('No GTP/KataGo client is configured.');
        if (typeof this.client.analyze === 'function') {
            return { engine: 'katago', available: true, ...(await this.client.analyze(gameState, options)) };
        }
        await gtp(this.client, `komi ${options.komi ?? this.komi}`);
        const response = await gtp(this.client, `kata-analyze ${options.visits || this.visits}`);
        return { engine: 'katago', available: true, ...parseKataGoResponse(response) };
    }

    async chooseMove(gameState, options = {}) {
        const analysis = await this.analyze(gameState, options);
        return analysis.bestMove;
    }

    async evaluate(gameState, options = {}) {
        return this.analyze(gameState, options);
    }
}

export default KataGoAdapter;
