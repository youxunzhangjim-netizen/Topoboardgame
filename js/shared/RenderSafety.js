import { endTimer, recordWarning, startTimer } from './PerformanceAudit.js';
import { STEAM_RENDER_LIMITS, assessRenderSafety } from './SteamSafetyLimits.js';

export function createRenderPolicy({
    visibleSites = 0,
    visibleEdges = 0,
    performanceMode = false,
    showEdges,
    showLabels,
    lowerDetail = false
} = {}) {
    const assessed = assessRenderSafety({ visibleSites, visibleEdges });
    const simplified = Boolean(performanceMode || lowerDetail || assessed.simplify);
    return {
        performanceMode: Boolean(performanceMode),
        lowerDetail: simplified,
        showEdges: showEdges == null ? assessed.showEdgesByDefault : Boolean(showEdges),
        showLabels: showLabels == null ? assessed.showLabelsByDefault : Boolean(showLabels),
        visibleSites,
        visibleEdges
    };
}

export function measureRender(label, render, details = {}) {
    const timer = startTimer(`render:${label}`);
    const value = render();
    const durationMs = endTimer(timer, {
        category: 'render',
        name: label,
        details
    });
    const assessment = assessRenderSafety({
        durationMs,
        visibleSites: details.visibleSites || 0,
        visibleEdges: details.visibleEdges || 0
    });
    if (durationMs > STEAM_RENDER_LIMITS.warningMs) {
        recordWarning('render', `${label} took ${durationMs.toFixed(1)} ms.`, {
            durationMs,
            simplify: assessment.simplify,
            ...details
        });
    }
    return { value, durationMs, ...assessment };
}

export function applyObjectVisibility(root, predicate, visible) {
    root?.traverse?.((object) => {
        if (predicate(object)) object.visible = Boolean(visible);
    });
}
