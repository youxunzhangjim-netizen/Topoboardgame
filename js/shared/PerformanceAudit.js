const DEFAULT_THRESHOLDS = Object.freeze({
    boardGenerationWarningMs: 300,
    boardGenerationDangerMs: 1500,
    renderWarningMs: 100,
    renderDangerMs: 500,
    labStepWarningMs: 100,
    labStepDangerMs: 500,
    pairCheckWarning: 250000
});

const state = {
    timers: new Map(),
    metrics: [],
    warnings: [],
    errors: []
};

function now() {
    return globalThis.performance?.now?.() ?? Date.now();
}

export function isPerformanceDebugEnabled() {
    try {
        if (globalThis.__TOPOBOARD_DEBUG__ === true) return true;
        if (globalThis.localStorage?.getItem('topoboard-debug') === 'true') return true;
        const params = new URLSearchParams(globalThis.location?.search || '');
        return params.get('debug') === '1' || params.get('performance') === '1';
    } catch {
        return false;
    }
}

function cloneDetails(details) {
    if (details == null) return null;
    try {
        return structuredClone(details);
    } catch {
        try { return JSON.parse(JSON.stringify(details)); } catch { return String(details); }
    }
}

function entry(category, message, details) {
    return {
        category: String(category || 'general'),
        message: String(message || ''),
        details: cloneDetails(details),
        timestamp: new Date().toISOString()
    };
}

function thresholdFor(category) {
    const value = String(category || '').toLowerCase();
    if (value.includes('board') && value.includes('generation')) {
        return [DEFAULT_THRESHOLDS.boardGenerationWarningMs, DEFAULT_THRESHOLDS.boardGenerationDangerMs];
    }
    if (value.includes('render')) {
        return [DEFAULT_THRESHOLDS.renderWarningMs, DEFAULT_THRESHOLDS.renderDangerMs];
    }
    if (value.includes('lab') && (value.includes('step') || value.includes('update'))) {
        return [DEFAULT_THRESHOLDS.labStepWarningMs, DEFAULT_THRESHOLDS.labStepDangerMs];
    }
    return null;
}

export function startTimer(label, details = null) {
    const id = String(label || 'timer');
    const token = { id, startedAt: now(), details: cloneDetails(details) };
    state.timers.set(id, token);
    return token;
}

export function endTimer(labelOrToken, options = {}) {
    const id = typeof labelOrToken === 'object' ? labelOrToken?.id : String(labelOrToken || 'timer');
    const token = typeof labelOrToken === 'object' ? labelOrToken : state.timers.get(id);
    if (!token) {
        recordWarning('timer', `Timer "${id}" was not started.`);
        return null;
    }
    state.timers.delete(id);
    const durationMs = Math.max(0, now() - token.startedAt);
    const category = options.category || id;
    recordMetric(category, options.name || id, durationMs, {
        unit: 'ms',
        ...token.details,
        ...options.details
    });
    const threshold = thresholdFor(category);
    if (threshold && durationMs > threshold[1]) {
        recordError(category, `${id} exceeded danger threshold.`, { durationMs, thresholdMs: threshold[1] });
    } else if (threshold && durationMs > threshold[0]) {
        recordWarning(category, `${id} exceeded warning threshold.`, { durationMs, thresholdMs: threshold[0] });
    }
    return durationMs;
}

export function recordMetric(category, name, value, details = null) {
    const metric = {
        category: String(category || 'general'),
        name: String(name || 'metric'),
        value: Number.isFinite(Number(value)) ? Number(value) : value,
        details: cloneDetails(details),
        timestamp: new Date().toISOString()
    };
    state.metrics.push(metric);
    return metric;
}

export function recordWarning(category, message, details = {}) {
    const warning = entry(category, message, details);
    state.warnings.push(warning);
    if (isPerformanceDebugEnabled()) console.warn(`[Topoboard audit:${warning.category}] ${warning.message}`, warning.details || '');
    return warning;
}

export function recordError(category, message, details = {}) {
    const error = entry(category, message, details);
    state.errors.push(error);
    if (isPerformanceDebugEnabled()) console.error(`[Topoboard audit:${error.category}] ${error.message}`, error.details || '');
    return error;
}

export function auditPairChecks(label, itemCount, estimatedChecks = Number(itemCount) ** 2) {
    recordMetric('complexity', `${label}:pair-checks`, estimatedChecks, { itemCount });
    if (estimatedChecks > DEFAULT_THRESHOLDS.pairCheckWarning) {
        recordWarning('complexity', `${label} may perform too many synchronous pair checks.`, {
            itemCount,
            estimatedChecks,
            recommendation: 'Use indexed or graph-based neighbor construction.'
        });
    }
    return estimatedChecks;
}

export function estimateMemoryRisk({ sites = 0, edges = 0, drawObjects = 0, stateVariables = 0 } = {}) {
    const estimatedBytes = sites * 160 + edges * 96 + drawObjects * 512 + stateVariables * 64;
    const risk = estimatedBytes > 256 * 1024 * 1024 ? 'danger'
        : estimatedBytes > 64 * 1024 * 1024 ? 'warning'
            : 'normal';
    recordMetric('memory', 'estimated-bytes', estimatedBytes, { sites, edges, drawObjects, stateVariables, risk });
    return { estimatedBytes, risk };
}

export function getAuditReport() {
    return {
        thresholds: { ...DEFAULT_THRESHOLDS },
        activeTimers: [...state.timers.keys()],
        metrics: state.metrics.map((item) => ({ ...item })),
        warnings: state.warnings.map((item) => ({ ...item })),
        errors: state.errors.map((item) => ({ ...item }))
    };
}

export function printAuditReport() {
    const report = getAuditReport();
    if (!isPerformanceDebugEnabled()) return report;
    console.groupCollapsed('[Topoboard] Performance and stability report');
    console.table(report.metrics);
    if (report.warnings.length) console.table(report.warnings);
    if (report.errors.length) console.table(report.errors);
    console.groupEnd();
    return report;
}

export function clearAuditReport() {
    state.timers.clear();
    state.metrics.length = 0;
    state.warnings.length = 0;
    state.errors.length = 0;
}

export function installPerformanceReportToggle(container = globalThis.document?.body) {
    if (!isPerformanceDebugEnabled() || !container || typeof document === 'undefined') return null;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = document.documentElement.lang.toLowerCase().startsWith('zh')
        ? '顯示效能報告'
        : 'Show Performance Report';
    button.addEventListener('click', printAuditReport);
    container.append(button);
    return button;
}

export { DEFAULT_THRESHOLDS as PERFORMANCE_THRESHOLDS };
