import { TorusNetworkManager } from './TorusNetworkManager.js';

const ROOM_STORAGE_PREFIX = '3dchess:cylinder:room:';

export class SphereNetworkManager extends TorusNetworkManager {
    variantKey() {
        return 'cylinder';
    }

    storageKey(roomId = this.roomId) {
        return `${ROOM_STORAGE_PREFIX}${roomId}`;
    }
}
