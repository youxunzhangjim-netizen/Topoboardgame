import { initOnline, subscribeWaitingRooms } from '../online.js';

const ACTIVE_ROOM_TTL_MS = 5 * 60 * 1000;
let lastRooms = [];
let lastError = null;

function timestampToMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1_000_000);
    if (typeof value === 'number') return value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function isFreshRoom(room) {
    const touchedAt = timestampToMillis(room?.updatedAt) || timestampToMillis(room?.createdAt);
    return touchedAt > 0 && Date.now() - touchedAt <= ACTIVE_ROOM_TTL_MS;
}

function publish(rooms = [], error = null) {
    window.dispatchEvent(new CustomEvent('topoboardgame:waiting-rooms', {
        detail: { rooms, error }
    }));
}

function publishFreshRooms() {
    publish(lastRooms.filter(isFreshRoom), lastError);
}

try {
    const fallback = window.setTimeout(() => {
        publish([], new Error('Cloud Firestore did not answer.'));
    }, 10000);
    const ready = await initOnline({
        gameKey: 'launcher',
        matchKey: 'launcher',
        showOnlineStatus: () => {}
    });
    if (!ready.ok) {
        window.clearTimeout(fallback);
        publish([], new Error('Firebase is not configured.'));
    } else {
        subscribeWaitingRooms((rooms, error) => {
            window.clearTimeout(fallback);
            lastRooms = rooms || [];
            lastError = error || null;
            publishFreshRooms();
        });
        window.setInterval(publishFreshRooms, 30000);
    }
} catch (error) {
    publish([], error);
}
