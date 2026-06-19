function unavailable(reason) {
    return {
        engine: 'edax',
        available: false,
        reason,
        bestMove: null,
        score: null
    };
}

function isNormalOthelloContext(context = {}) {
    const gameType = String(context.gameType || context.game || '').toLowerCase();
    const topology = String(context.topology || context.boundary || 'normal').toLowerCase();
    const size = Number(context.boardSize || context.size || 8);
    const dimension = Number(context.dimension || 2);
    const lattice = String(context.lattice || 'square').toLowerCase();
    return (gameType.includes('reversi') || gameType.includes('othello'))
        && dimension === 2
        && size === 8
        && ['square', 'standard', ''].includes(lattice)
        && ['normal', 'standard', 'flat', 'open2d', ''].includes(topology)
        && !context.timeMode
        && !context.timeSchedule
        && !context.timeEvolution
        && !context.delayMode;
}

function parseEdaxOutput(output) {
    if (!output) return {};
    if (typeof output === 'object') return output;
    const text = String(output);
    const bestMove = text.match(/\bbest\s+move\s*[:=]?\s*([a-h][1-8])/i)?.[1]
        || text.match(/\bmove\s+([a-h][1-8])/i)?.[1]
        || null;
    const score = text.match(/\bscore\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i)?.[1];
    return {
        bestMove,
        score: score == null ? null : Number(score),
        raw: text
    };
}

export class EdaxAdapter {
    constructor({ client = null, depth = 10 } = {}) {
        this.client = client;
        this.depth = depth;
    }

    isCompatible(context = {}) {
        return isNormalOthelloContext(context);
    }

    async analyze(gameState, options = {}) {
        const context = {
            gameType: options.gameType || gameState?.gameType || 'reversi',
            topology: options.topology || gameState?.topology || 'normal',
            dimension: options.dimension || gameState?.dimension || 2,
            boardSize: options.boardSize || gameState?.boardSize || gameState?.size || 8,
            lattice: options.lattice || gameState?.lattice || 'square',
            timeMode: options.timeMode || gameState?.timeMode || '',
            timeSchedule: options.timeSchedule || gameState?.timeSchedule || null,
            timeEvolution: options.timeEvolution || gameState?.timeEvolution || ''
        };
        if (!this.isCompatible(context)) {
            return unavailable('Edax is used directly only for normal 2D 8x8 square Reversi/Othello. Custom boundaries, lattices, higher-dimensional boards, and +1D modes must use Topoboardgame local variant robots trained with Edax as a teacher/baseline where compatible.');
        }
        if (!this.client) return unavailable('No Edax client is configured.');
        if (typeof this.client.analyze === 'function') {
            return { engine: 'edax', available: true, ...(await this.client.analyze(gameState, options)) };
        }
        const position = options.position || gameState?.position || gameState?.edaxPosition || '';
        if (!position) return unavailable('No Edax-compatible position string was provided.');
        const output = typeof this.client.send === 'function'
            ? await this.client.send(`go depth ${options.depth || this.depth} ${position}`)
            : '';
        return { engine: 'edax', available: true, ...parseEdaxOutput(output) };
    }

    async chooseMove(gameState, options = {}) {
        const analysis = await this.analyze(gameState, options);
        return analysis.bestMove;
    }

    async evaluate(gameState, options = {}) {
        return this.analyze(gameState, options);
    }
}

export default EdaxAdapter;
