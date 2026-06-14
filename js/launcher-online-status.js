import { initOnline, subscribeWaitingRooms } from '../online.js';

function publish(rooms = [], error = null) {
    window.dispatchEvent(new CustomEvent('topoboardgame:waiting-rooms', {
        detail: { rooms, error }
    }));
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
            publish(rooms, error || null);
        });
    }
} catch (error) {
    publish([], error);
}
