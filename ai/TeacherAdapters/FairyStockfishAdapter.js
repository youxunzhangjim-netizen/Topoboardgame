import { StockfishAdapter } from './StockfishAdapter.js';

function chessLike(context = {}) {
    const gameType = String(context.gameType || context.game || '').toLowerCase();
    return gameType.includes('chess');
}

function exactFairyVariantContext(context = {}) {
    const topology = String(context.topology || context.boundary || 'normal').toLowerCase();
    const dimension = Number(context.dimension || 2);
    const variantName = String(context.variantName || context.fairyVariant || '').trim();
    const hasCustomTopology = !['normal', 'standard', 'flat', 'forbidden', ''].includes(topology);
    return dimension === 2
        && Boolean(variantName)
        && !hasCustomTopology
        && !context.timeMode
        && !context.timeSchedule
        && !context.timeEvolution;
}

export class FairyStockfishAdapter extends StockfishAdapter {
    constructor(options = {}) {
        super({ ...options, engineName: options.engineName || 'fairy-stockfish' });
        this.variantName = options.variantName || '';
    }

    isCompatible(context = {}) {
        return chessLike(context) && exactFairyVariantContext({ ...context, variantName: context.variantName || this.variantName });
    }

    async analyze(gameState, options = {}) {
        const context = {
            gameType: options.gameType || gameState?.gameType || 'chess',
            topology: options.topology || gameState?.topology || gameState?.boundary || 'normal',
            dimension: options.dimension || gameState?.dimension || 2,
            variantName: options.variantName || gameState?.variantName || this.variantName,
            timeMode: options.timeMode || gameState?.timeMode || '',
            timeSchedule: options.timeSchedule || gameState?.timeSchedule || null,
            timeEvolution: options.timeEvolution || gameState?.timeEvolution || ''
        };
        if (!this.isCompatible(context)) {
            return {
                engine: this.engineName,
                available: false,
                reason: 'Fairy-Stockfish can be wired only when an exact Fairy variant name matches the ordinary 2D chess-like rules. Topological boards, time modes, and custom Topoboardgame rules stay local-robot variants and may use Fairy-Stockfish only as a carefully converted teacher/baseline.'
            };
        }
        return super.analyze(gameState, {
            ...options,
            variantName: options.variantName || this.variantName
        });
    }
}

export default FairyStockfishAdapter;
