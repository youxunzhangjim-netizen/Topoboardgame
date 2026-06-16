import {
    analyzePositionFromState,
    chooseRobotMoveFromState
} from './ChessSearch.js';

self.addEventListener('message', (event) => {
    const { id, type, depth, state } = event.data || {};
    try {
        const result = type === 'analyze'
            ? analyzePositionFromState(state, depth)
            : chooseRobotMoveFromState(state, depth);
        self.postMessage({ id, ok: true, result });
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: error?.message || String(error)
        });
    }
});
