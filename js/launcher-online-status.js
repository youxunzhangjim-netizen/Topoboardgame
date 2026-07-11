const ACTIVE_ROOM_TTL_MS = 5 * 60 * 1000;
let lastRooms = [];
let lastError = null;
let unsubscribeWaitingRooms = null;
let startPromise = null;
let watchdogTimer = 0;
let watchGeneration = 0;
let onlineApiPromise = null;

function loadOnlineApi() {
    if (!onlineApiPromise) {
        onlineApiPromise = import('../online.js').catch((error) => {
            lastError = new Error(`Online unavailable. Local play is still available. ${error?.message || error}`);
            return null;
        });
    }
    return onlineApiPromise;
}

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

function clearWatchdog() {
    if (watchdogTimer) window.clearTimeout(watchdogTimer);
    watchdogTimer = 0;
}

function stopWatching(error = null) {
    watchGeneration += 1;
    clearWatchdog();
    unsubscribeWaitingRooms?.();
    unsubscribeWaitingRooms = null;
    lastRooms = [];
    lastError = error;
    publishFreshRooms();
}

async function startWatching() {
    if (unsubscribeWaitingRooms || startPromise) return startPromise;
    const generation = watchGeneration;
    clearWatchdog();
    watchdogTimer = window.setTimeout(() => {
        publish([], new Error('Online room service did not answer.'));
    }, 10000);

    startPromise = (async () => {
        const api = await loadOnlineApi();
        if (!api) {
            stopWatching(lastError || new Error('Online unavailable. Local play is still available.'));
            return;
        }
        const ready = await api.initOnline({
            gameKey: 'launcher',
            matchKey: 'launcher',
            showOnlineStatus: () => {}
        });
        clearWatchdog();
        if (generation !== watchGeneration || !api.getAccountState().uid) return;
        if (!ready.ok) {
            stopWatching(new Error(ready.error || 'Online service is not configured.'));
            return;
        }
        unsubscribeWaitingRooms = api.subscribeWaitingRooms((rooms, error) => {
            lastRooms = rooms || [];
            lastError = error || null;
            publishFreshRooms();
        });
        publishFreshRooms();
    })();

    try {
        await startPromise;
    } catch (error) {
        stopWatching(error);
    } finally {
        startPromise = null;
    }
}

loadOnlineApi().then((api) => {
    if (!api) {
        stopWatching(lastError || new Error('Online unavailable. Local play is still available.'));
        return;
    }
    api.subscribeAccountState((state) => {
        if (state?.uid) {
            startWatching();
        } else {
            stopWatching(new Error('Sign in as Visitor or Google to check online rooms.'));
        }
    });
    api.initAccountSession().catch((error) => stopWatching(error));
});
window.setInterval(publishFreshRooms, 30000);
