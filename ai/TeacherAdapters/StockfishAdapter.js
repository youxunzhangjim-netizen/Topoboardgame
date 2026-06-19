function unavailable(reason, engine = 'stockfish') {
    return {
        engine,
        available: false,
        reason,
        bestMove: null,
        centipawn: null,
        mate: null
    };
}

function isNormal2DChessContext(context = {}) {
    const gameType = String(context.gameType || context.game || '').toLowerCase();
    const topology = String(context.topology || context.boundary || 'normal').toLowerCase();
    const dimension = Number(context.dimension || 2);
    return gameType.includes('chess')
        && dimension === 2
        && ['normal', 'flat', 'standard', 'forbidden', 'open', ''].includes(topology);
}

function parseUciInfo(lines = []) {
    let centipawn = null;
    let mate = null;
    let bestMove = null;
    for (const line of lines) {
        const text = String(line || '').trim();
        if (text.startsWith('bestmove ')) bestMove = text.split(/\s+/)[1] || null;
        const cp = text.match(/\bscore cp (-?\d+)/);
        const mt = text.match(/\bscore mate (-?\d+)/);
        if (cp) centipawn = Number(cp[1]);
        if (mt) mate = Number(mt[1]);
    }
    return { bestMove, centipawn, mate };
}

async function send(client, command) {
    if (typeof client?.send === 'function') return client.send(command);
    if (typeof client?.write === 'function') return client.write(`${command}\n`);
    return null;
}

async function readUntilBestMove(client, timeoutMs) {
    if (typeof client?.readUntil === 'function') {
        return client.readUntil((line) => String(line).startsWith('bestmove'), timeoutMs);
    }
    if (typeof client?.collectUntil === 'function') {
        return client.collectUntil('bestmove', timeoutMs);
    }
    return [];
}

export class StockfishAdapter {
    constructor({ client = null, depth = 12, movetime = 0, engineName = 'stockfish' } = {}) {
        this.client = client;
        this.depth = depth;
        this.movetime = movetime;
        this.engineName = engineName;
    }

    isCompatible(context = {}) {
        return isNormal2DChessContext(context);
    }

    async analyze(gameState, options = {}) {
        const context = {
            gameType: options.gameType || gameState?.gameType || 'chess',
            topology: options.topology || gameState?.topology || gameState?.boundary || 'normal',
            dimension: options.dimension || gameState?.dimension || 2
        };
        if (!this.isCompatible(context)) {
            return unavailable('StockfishAdapter is only used as a normal 2D chess teacher.', this.engineName);
        }
        const fen = options.fen || gameState?.fen || gameState?.toFEN?.();
        if (!fen) return unavailable('No FEN was provided for UCI analysis.', this.engineName);
        if (!this.client) return unavailable('No UCI client is configured.', this.engineName);
        if (typeof this.client.analyze === 'function') {
            const result = await this.client.analyze({ fen, depth: options.depth || this.depth, movetime: options.movetime || this.movetime });
            return { engine: this.engineName, available: true, ...result };
        }
        await send(this.client, 'uci');
        await send(this.client, 'isready');
        await send(this.client, `position fen ${fen}`);
        const depth = Number(options.depth || this.depth);
        const movetime = Number(options.movetime || this.movetime);
        await send(this.client, movetime > 0 ? `go movetime ${movetime}` : `go depth ${depth}`);
        const lines = await readUntilBestMove(this.client, options.timeoutMs || 30000);
        return {
            engine: this.engineName,
            available: true,
            ...parseUciInfo(lines),
            raw: lines
        };
    }

    async chooseMove(gameState, options = {}) {
        const analysis = await this.analyze(gameState, options);
        return analysis.bestMove;
    }

    async evaluate(gameState, options = {}) {
        return this.analyze(gameState, options);
    }
}

export default StockfishAdapter;
