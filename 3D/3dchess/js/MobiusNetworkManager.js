import { TorusNetworkManager } from './TorusNetworkManager.js';

const ROOM_STORAGE_PREFIX = '3dchess:mobius:room:';
const PUBLIC_GAME_URL = 'https://youxunzhangjim-netizen.github.io/Spacechess/3D/3dchess/';

export class MobiusNetworkManager extends TorusNetworkManager {
    variantKey() {
        return 'mobius';
    }

    storageKey(roomId = this.roomId) {
        return `${ROOM_STORAGE_PREFIX}${roomId}`;
    }

    buildShareUrl(roomId) {
        const isLocalPage = ['127.0.0.1', 'localhost'].includes(window.location.hostname) || window.location.protocol === 'file:';
        const url = new URL(isLocalPage ? PUBLIC_GAME_URL : window.location.href);
        url.searchParams.set('variant', 'mobius');
        url.searchParams.set('room', roomId);
        url.hash = '';
        return url.toString();
    }
}
