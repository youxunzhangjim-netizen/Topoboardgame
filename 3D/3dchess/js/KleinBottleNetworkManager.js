import { TorusNetworkManager } from './TorusNetworkManager.js';
import { KLEIN_TOPOLOGY } from './KleinBottleConfig.js';

const ROOM_STORAGE_PREFIX = '3dchess:klein:room:';

export class KleinBottleNetworkManager extends TorusNetworkManager {
    variantKey() {
        return 'klein';
    }

    storageKey(roomId = this.roomId) {
        return `${ROOM_STORAGE_PREFIX}${roomId}`;
    }

    applySyncState(state, options = {}) {
        super.applySyncState(state, options);
        this.game.boundaryCondition = KLEIN_TOPOLOGY;
        this.game.updateBoundaryInfo();
        this.game.updateUI();
    }
}
