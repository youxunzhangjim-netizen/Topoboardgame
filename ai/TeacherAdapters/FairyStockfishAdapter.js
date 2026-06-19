import { StockfishAdapter } from './StockfishAdapter.js';

function chessLike(context = {}) {
    const gameType = String(context.gameType || context.game || '').toLowerCase();
    return gameType.includes('chess') || gameType.includes('jump');
}

function supportedReferenceTopology(context = {}) {
    const topology = String(context.topology || context.boundary || 'normal').toLowerCase();
    return ['normal', 'standard', 'flat', 'open', 'forbidden', 'torus'].includes(topology);
}

export class FairyStockfishAdapter extends StockfishAdapter {
    constructor(options = {}) {
        super({ ...options, engineName: options.engineName || 'fairy-stockfish' });
        this.variantName = options.variantName || '';
    }

    isCompatible(context = {}) {
        return chessLike(context) && supportedReferenceTopology(context);
    }

    async analyze(gameState, options = {}) {
        const context = {
            gameType: options.gameType || gameState?.gameType || 'chess',
            topology: options.topology || gameState?.topology || gameState?.boundary || 'normal',
            dimension: options.dimension || gameState?.dimension || 2
        };
        if (!this.isCompatible(context)) {
            return {
                engine: this.engineName,
                available: false,
                reason: 'Fairy-Stockfish is only a reference teacher where its variant rules are compatible; custom topology is handled by local robots.'
            };
        }
        return super.analyze(gameState, {
            ...options,
            variantName: options.variantName || this.variantName
        });
    }
}

export default FairyStockfishAdapter;
