function clampNumber(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.max(min, Math.min(max, numeric));
}

function pointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function firstTwoPointers(pointers) {
    return Array.from(pointers.values()).slice(0, 2);
}

export function installProjectedBoardTouchControls({
    element,
    view,
    isEnabled = () => true,
    minZoom = 0.35,
    maxZoom = 2.8,
    rotationScale = 0.45,
    syncControls = () => {},
    render = () => {},
    suppressClick = () => {}
} = {}) {
    if (!element || !view) return () => {};

    const pointers = new Map();
    let drag = null;
    let pinch = null;

    const setTouchAction = () => {
        element.style.touchAction = isEnabled() ? 'none' : 'manipulation';
    };
    const syncAndRender = () => {
        syncControls();
        render();
    };
    const pointerFromEvent = (event) => ({
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        type: event.pointerType
    });
    const startDrag = (pointer, event = {}) => {
        drag = {
            pointerId: pointer.id,
            x: pointer.x,
            y: pointer.y,
            rotX: view.rotX,
            rotY: view.rotY,
            active: Boolean(event.shiftKey || event.button !== 0)
        };
        view.drag = drag;
        pinch = null;
    };
    const startPinch = () => {
        const [a, b] = firstTwoPointers(pointers);
        if (!a || !b) return;
        pinch = {
            distance: Math.max(12, pointerDistance(a, b)),
            zoom: view.zoom,
            active: true
        };
        drag = null;
        view.drag = null;
    };
    const finishGesture = (event) => {
        const hadDrag = drag && drag.pointerId === event.pointerId;
        const wasActive = Boolean((hadDrag && drag.active) || pinch?.active);
        pointers.delete(event.pointerId);
        try { element.releasePointerCapture?.(event.pointerId); } catch {}
        if (wasActive) suppressClick();

        if (pointers.size >= 2) {
            startPinch();
        } else if (pointers.size === 1) {
            startDrag(Array.from(pointers.values())[0], { button: 0 });
        } else {
            drag = null;
            pinch = null;
            view.drag = null;
        }
    };

    const onPointerDown = (event) => {
        setTouchAction();
        if (!isEnabled()) return;
        if (event.pointerType === 'mouse' && ![0, 1, 2].includes(event.button)) return;
        if (event.target.closest?.('button[data-coord], button[data-site], [data-board-action]')) return;

        const pointer = pointerFromEvent(event);
        pointers.set(event.pointerId, pointer);
        element.setPointerCapture?.(event.pointerId);
        if (pointers.size >= 2) {
            startPinch();
        } else {
            startDrag(pointer, event);
        }
    };

    const onPointerMove = (event) => {
        if (!isEnabled() || !pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, pointerFromEvent(event));

        if (pinch && pointers.size >= 2) {
            const [a, b] = firstTwoPointers(pointers);
            const distance = Math.max(12, pointerDistance(a, b));
            view.zoom = clampNumber(pinch.zoom * (distance / pinch.distance), minZoom, maxZoom);
            pinch.active = true;
            event.preventDefault();
            syncAndRender();
            return;
        }

        if (!drag || drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.active && Math.hypot(dx, dy) < 4) return;

        drag.active = true;
        view.rotY = drag.rotY + dx * rotationScale;
        view.rotX = drag.rotX - dy * rotationScale;
        event.preventDefault();
        syncAndRender();
    };

    element.addEventListener('pointerdown', onPointerDown, { passive: false });
    element.addEventListener('pointermove', onPointerMove, { passive: false });
    element.addEventListener('pointerup', finishGesture);
    element.addEventListener('pointercancel', finishGesture);
    setTouchAction();

    return () => {
        element.removeEventListener('pointerdown', onPointerDown);
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerup', finishGesture);
        element.removeEventListener('pointercancel', finishGesture);
        pointers.clear();
        drag = null;
        pinch = null;
        view.drag = null;
    };
}
