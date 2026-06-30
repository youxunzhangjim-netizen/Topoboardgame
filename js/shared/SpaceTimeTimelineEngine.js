const COPY = {
  en: {
    title: 'Time-mode board game',
    intro: 'The original board-game rules stay unchanged. Only when actions take effect on the timeline is different.',
    mode: 'Time mode',
    future: 'Future Mode',
    past: 'Past Mode',
    both: 'Past+Future Mode',
    ageModeChoice: 'Age Mode',
    periodModeChoice: 'Time Period Mode',
    futureHelp: 'Schedule actions into future ticks. The original board-game rule is checked when the action resolves.',
    pastHelp: 'Rewrite recent past actions inside a locked time window. The timeline is replayed before the rewrite is applied.',
    bothHelp: 'Schedule future actions and rewrite recent past actions. Later events are replayed and revalidated.',
    ageHelp: 'Use the original +1D age clock. Pieces show age rings and can disappear after the selected lifetime.',
    periodHelp: 'Use the original Go +1D time period clock. Stones appear and disappear by the selected period.',
    modeLocked: 'Time mode and timeline settings are locked after the game starts. Start a new game to change them.',
    ageUnavailable: 'Age Mode is not available for Chess +1D games.',
    delay: 'Future Delay (full turns)',
    actionSlice: 'Next Action Time Slice',
    chooseSlice: 'Choose time slice',
    pastSlice: '-{ticks} ticks',
    pastPreview: 'Past board preview',
    pastPreviewHelp: 'The board is temporarily showing the selected past slice. Apply the rewrite to replay back to the present.',
    instantSlice: 'Instant',
    futureSlice: '+{ticks} full turn',
    legacyTitle: 'Time period and age settings',
    legacyHelp: 'These are the original +1D clocks: Go can keep a periodic appear/disappear phase, and every +1D board game can use piece aging.',
    ageOnlyTitle: 'Age settings',
    ageOnlyHelp: 'Age is an independent +1D clock. It can remain off or remove pieces after the selected lifetime.',
    periodMode: 'Go time period',
    periodOffMode: 'Off',
    periodOnMode: 'Time period (Go +1D only)',
    appearTurns: 'Appear turns',
    disappearTurns: 'Disappear turns',
    dt: 'Time lattice dt',
    ageMode: 'Age rules',
    ageOff: 'Off',
    ageLifetime: 'Age lifetime',
    lifetime: 'Lifetime',
    oldAge: 'Old age warning',
    noise: 'Noise',
    noiseOff: 'Off',
    noisePieces: 'Aged pieces only',
    noiseBoard: 'Whole board',
    noiseRate: 'Noise rate',
    noisePeriod: 'Noise period',
    legacySummary: 'Clock summary',
    window: 'Past Rewrite Window',
    customWindow: 'Custom ticks',
    conflict: 'Conflict Policy',
    reject: 'Strict',
    skip: 'Fail Forward',
    apply: 'Apply timeline settings',
    pending: 'Pending Future Actions',
    history: 'Resolved Events',
    editableHistory: 'Editable History',
    frozenHistory: 'Frozen History',
    resolvedEvents: 'Resolved Events',
    failedEvents: 'Failed Events',
    obsoleteEvents: 'Obsolete Events',
    rewrittenEvents: 'Rewritten Events',
    cancelledEvents: 'Cancelled Events',
    conflicts: 'Conflicts',
    resolveTick: 'Resolve Tick',
    scheduled: 'Action Scheduled',
    resolved: 'Action Resolved',
    failed: 'Action Failed at Resolve Time',
    edit: 'Edit',
    cancel: 'Cancel',
    earlier: 'Earlier',
    later: 'Later',
    replacement: 'Choose Replacement Move',
    replacementHelp: 'Choose a replacement with the normal board controls, then apply the dry-run replay.',
    dryRunReplay: 'Dry-Run Replay',
    replaying: 'Replaying Timeline',
    replayStep: 'Replay {index}/{count}: {action}',
    replacementPreview: 'Replacement selected: {action}',
    applyRewrite: 'Apply Rewrite',
    cancelRewrite: 'Cancel Rewrite',
    rewriteCommitted: 'Rewrite Applied',
    rewriteRejected: 'Rewrite Failed',
    conflictSkipped: 'Replay committed with deterministic conflict handling.',
    locked: 'Locked after the first resolved move.',
    online: 'Past Mode for online rooms is still developing.',
    onlineBoth: 'Past+Future Mode for online rooms is still developing.',
    emptyPending: 'No pending future actions.',
    emptyHistory: 'No resolved timeline events.',
    playerOnly: 'Only the current player can rewrite their own recent event.',
    pendingPlayerOnly: 'Only the current player can change their own pending future action.',
    pendingLocked: 'This pending future action can no longer be changed.',
    expired: 'This event is outside the rewrite window.',
    gameEnded: 'Events cannot be rewritten after the game has ended.',
    event: 'Event',
    tick: 'Tick',
    status: 'Status',
    modeApplied: 'Timeline settings applied.',
    selectSource: 'Choose the replacement source, then its destination.',
    selectedSource: 'Replacement source selected. Choose its destination.',
    reset: 'Timeline cleared for the new game.',
    earlierGameEnd: 'An earlier game end makes later events obsolete.',
    replayFailed: 'Replay cannot reconstruct a valid board state.',
    replacementIllegal: 'The replacement move is illegal at the original resolve tick.',
    setupEvent: 'Initial setup events cannot be rewritten.',
    opponentEvent: 'The target event belongs to the opponent.',
    outsideWindow: 'The target event is outside the rewrite window.',
    hexConflict: 'Hex conflict: the target cell is occupied at resolve time.',
    goConflict: 'Go conflict: the move is illegal at resolve time.',
    reversiConflict: 'Reversi conflict: no valid flip line exists at resolve time.',
    jumpConflict: 'Jump conflict: the path is no longer legal at resolve time.',
    chessConflict: 'Chess conflict: the move is no longer legal at resolve time.'
  },
  zh: {
    title: '時間模式棋局',
    intro: '保留原棋類規則不變；只有行動在時間線上何時生效有所不同。',
    mode: '時間模式',
    future: '未來模式',
    past: '過去模式',
    both: '過去+未來模式',
    ageModeChoice: '年齡模式',
    periodModeChoice: '時間週期模式',
    futureHelp: '將行動排程到未來回合；行動生效時重新套用原棋類規則。',
    pastHelp: '在鎖定的時間窗口內改寫最近的過去行動；套用改寫前會回放時間線。',
    bothHelp: '排程未來行動，並改寫最近的過去行動；後續事件會重新回放與驗證。',
    ageHelp: '使用原本的 +1D 年齡時鐘；棋子會顯示年齡環，並可在指定壽命後消失。',
    periodHelp: '使用原本的 Go +1D 時間週期；棋子依設定週期出現與消失。',
    modeLocked: '棋局開始後，時間模式與時間線設定會鎖定；請開始新棋局再更改。',
    ageUnavailable: 'Chess +1D 棋局不提供年齡模式。',
    delay: '未來延遲（完整回合）',
    actionSlice: '下一步時間切片',
    chooseSlice: '選擇時間切片',
    pastSlice: '-{ticks} 回合',
    pastPreview: '過去棋盤預覽',
    pastPreviewHelp: '畫面暫時顯示所選的過去切片；套用改寫後會回放到目前棋盤。',
    instantSlice: '即時',
    futureSlice: '+{ticks} 輪完整回合',
    legacyTitle: '時間週期與年齡設定',
    legacyHelp: '這些是原本的 +1D 時鐘：Go 可保留週期性的出現／消失相位，所有 +1D 棋局都可使用棋子老化。',
    ageOnlyTitle: '年齡設定',
    ageOnlyHelp: '年齡是獨立的 +1D 時鐘；可保持關閉，或在指定壽命後移除棋子。',
    periodMode: 'Go 時間週期',
    periodOffMode: '關閉',
    periodOnMode: '時間週期（僅 Go +1D）',
    appearTurns: '出現回合',
    disappearTurns: '消失回合',
    dt: '時間格距 dt',
    ageMode: '年齡規則',
    ageOff: '關閉',
    ageLifetime: '年齡壽命',
    lifetime: '壽命',
    oldAge: '老化警告',
    noise: '噪聲',
    noiseOff: '關閉',
    noisePieces: '僅老化棋子',
    noiseBoard: '整個棋盤',
    noiseRate: '噪聲比例',
    noisePeriod: '噪聲週期',
    legacySummary: '時鐘摘要',
    window: '過去改寫窗口',
    customWindow: '自訂回合數',
    conflict: '衝突策略',
    reject: '嚴格',
    skip: '失敗前進',
    apply: '套用時間線設定',
    pending: '待生效未來行動',
    history: '已生效事件',
    editableHistory: '可編輯歷史',
    frozenHistory: '凍結歷史',
    resolvedEvents: '已生效事件',
    failedEvents: '失敗事件',
    obsoleteEvents: '已作廢事件',
    rewrittenEvents: '已改寫事件',
    cancelledEvents: '已取消事件',
    conflicts: '衝突',
    resolveTick: '生效回合',
    scheduled: '行動已排程',
    resolved: '行動已生效',
    failed: '行動在生效時失敗',
    edit: '編輯',
    cancel: '取消',
    earlier: '提前',
    later: '延後',
    replacement: '選擇替代行動',
    replacementHelp: '使用一般棋盤控制選擇替代行動，然後套用試回放。',
    dryRunReplay: '試回放',
    replaying: '正在回放時間線',
    replayStep: '回放 {index}/{count}：{action}',
    replacementPreview: '已選替代行動：{action}',
    applyRewrite: '套用改寫',
    cancelRewrite: '取消改寫',
    rewriteCommitted: '改寫已套用',
    rewriteRejected: '改寫失敗',
    conflictSkipped: '已用確定性的衝突處理提交重播結果。',
    locked: '第一個已生效行動後鎖定。',
    online: '線上房間的過去模式仍在開發中。',
    onlineBoth: '線上房間的過去+未來模式仍在開發中。',
    emptyPending: '目前沒有待生效未來行動。',
    emptyHistory: '目前沒有已生效時間線事件。',
    playerOnly: '目前玩家只能改寫自己近期的事件。',
    pendingPlayerOnly: '目前玩家只能更改自己的待生效未來行動。',
    pendingLocked: '此待生效未來行動已不能更改。',
    expired: '此事件已超出改寫範圍。',
    gameEnded: '棋局結束後不能改寫事件。',
    event: '事件',
    tick: '回合',
    status: '狀態',
    modeApplied: '時間線設定已套用。',
    selectSource: '先選擇替代行動的起點，再選擇終點。',
    selectedSource: '已選擇替代起點；請選擇終點。',
    reset: '新棋局的時間線已清除。',
    earlierGameEnd: '較早的勝負結果會使後續事件作廢。',
    replayFailed: '無法重建有效的棋盤狀態。',
    replacementIllegal: '替代走法在原本生效回合不合法。',
    setupEvent: '初始設定事件不能被改寫。',
    opponentEvent: '目標事件屬於對手。',
    outsideWindow: '目標事件已超出改寫窗口。',
    hexConflict: '六貫棋衝突：目標格在生效時已被佔用。',
    goConflict: '圍棋衝突：該手在生效時不合法。',
    reversiConflict: '黑白棋衝突：生效時沒有合法可翻轉棋線。',
    jumpConflict: '跳棋衝突：路徑在生效時已不合法。',
    chessConflict: '棋類衝突：該走法在生效時已不合法。'
  }
};

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function asInteger(value, fallback, min, max) {
  const parsed = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(parsed) ? Math.floor(parsed) : fallback));
}

function sameCoord(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => Number(value) === Number(b[index]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = ['x', 'y', 'z', 'w', 'r', 'c', 'q', 'sheet'];
    const used = keys.filter((key) => key in a || key in b);
    return used.length > 0 && used.every((key) => Number(a[key] ?? 0) === Number(b[key] ?? 0));
  }
  return false;
}

function normalizeMode(value) {
  const mode = String(value || '').toLowerCase().replace(/[+\s-]/g, '_');
  if (mode === 'past') return 'past';
  if (mode === 'past_future' || mode === 'pastfuture' || mode === 'both') return 'past_future';
  if (mode === 'age' || mode === 'lifetime' || mode === 'decay') return 'age';
  if (mode === 'periodic' || mode === 'period') return 'periodic';
  // Legacy timeMode=delay and the retired periodic value both map to Future Mode.
  return 'future';
}

function normalizeAgeMode(value) {
  return String(value || '').toLowerCase() === 'lifetime' ? 'lifetime' : 'off';
}

function normalizePeriodMode(value) {
  const mode = String(value || '').toLowerCase();
  return mode === 'periodic' || mode === 'period' ? 'periodic' : 'off';
}

function normalizeConflictPolicy(value) {
  const mode = String(value || '').toLowerCase().replace(/[+\s-]/g, '_');
  if (mode === 'fail_forward' || mode === 'skip' || mode === 'forward') return 'fail_forward';
  return 'strict';
}

function asNumber(value, fallback, min, max) {
  const parsed = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(parsed) ? parsed : fallback));
}

function detectLayer(params, pathname) {
  const raw = String(params.get('spacetime') || '').toLowerCase();
  if (['1p1', '1+1', '1d+1'].includes(raw)) return '1p1';
  if (['2p1', '2+1', '2d+1'].includes(raw)) return '2p1';
  if (['3p1', '3+1', '3d+1'].includes(raw)) return '3p1';
  return '';
}

function detectFamily(params, pathname) {
  if (params.get('family')) return params.get('family').toLowerCase();
  const paths = [
    ['2dchess', 'chess'], ['3dchess', 'chess'],
    ['2dgo', 'go'], ['3dgo', 'go'],
    ['2dreversi', 'reversi'], ['3dreversi', 'reversi'],
    ['/jump', 'jump'], ['/hex', 'hex']
  ];
  return paths.find(([part]) => pathname.includes(part))?.[1] || 'game';
}

export function installSpaceTimeTimelineEngine() {
  const params = new URLSearchParams(location.search);
  const pathname = location.pathname.toLowerCase();
  const layer = detectLayer(params, pathname);
  if (!layer) return null;

  const family = detectFamily(params, pathname);
  const dimensionLabel = layer.replace('p', '+').toUpperCase() + 'D';
  const storageKey = `topoboardgame.timeline.${layer}.${family}.v1`;
  const legacyStorageKey = `topoboardgame.spacetime.${layer}.${family}.settings`;
  const allowsNoise = family === 'go' || family === 'reversi';
  const rawTimelineMode = params.get('timeMode') || params.get('time') || '';
  const language = () => {
    const value = params.get('lang') || localStorage.getItem('topological-boardgame:language') ||
      localStorage.getItem('topoboardgame-language') || localStorage.getItem('topoboardgame.lang') ||
      localStorage.getItem('topoboardgame.language') || document.documentElement.lang;
    return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  };
  const text = (key, values = {}) => String(COPY[language()][key] || COPY.en[key] || key)
    .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');

  function supportsAgeMode() {
    return family !== 'chess';
  }

  function supportsPeriodMode() {
    return family === 'go';
  }

  function sanitizeMode(mode, { onlineFallback = false } = {}) {
    let next = normalizeMode(mode);
    if (next === 'age' && !supportsAgeMode()) next = 'future';
    if (next === 'periodic' && !supportsPeriodMode()) next = 'future';
    if (onlineFallback && isOnline() && (next === 'past' || next === 'past_future')) next = 'future';
    return next;
  }

  function applyExclusiveModeDefaults() {
    settings.mode = sanitizeMode(settings.mode);
    if (settings.mode === 'periodic') {
      settings.periodMode = supportsPeriodMode() ? 'periodic' : 'off';
      settings.ageMode = 'off';
    } else if (settings.mode === 'age') {
      settings.periodMode = 'off';
      settings.ageMode = supportsAgeMode() ? 'lifetime' : 'off';
    } else {
      settings.periodMode = 'off';
      settings.ageMode = 'off';
    }
  }

  const stored = readStored();
  const legacyStored = readLegacyStored();
  const storedPeriodMode = stored.periodMode || legacyStored.timeMode;
  const hasTimelineModeQuery = params.has('timeMode') || params.has('time');
  const hasDelayQuery = params.has('delay');
  const hasActionOffsetQuery = params.has('actionOffset');
  const queryPeriodMode = params.get('periodMode') || (normalizePeriodMode(rawTimelineMode) === 'periodic' ? rawTimelineMode : '');
  const settings = {
    mode: normalizeMode(hasTimelineModeQuery ? rawTimelineMode : 'future'),
    delay: asInteger(hasDelayQuery ? params.get('delay') : 2, 2, 1, 32),
    actionOffset: asInteger(hasActionOffsetQuery ? params.get('actionOffset') : hasDelayQuery ? params.get('delay') : 2, 2, 0, 32),
    rewriteWindow: asInteger(params.get('pastWindow') || params.get('rewriteWindow') || stored.rewriteWindow, 5, 1, 64),
    customWindow: asInteger(stored.customWindow, 5, 1, 64),
    conflictPolicy: normalizeConflictPolicy(params.get('conflictPolicy') || stored.conflictPolicy),
    periodMode: family === 'go' ? normalizePeriodMode(queryPeriodMode || storedPeriodMode || (normalizeMode(rawTimelineMode) === 'periodic' ? 'periodic' : 'off')) : 'off',
    periodOn: asInteger(params.get('periodOn') || stored.periodOn || legacyStored.periodOn, 2, 1, 32),
    periodOff: asInteger(params.get('periodOff') || stored.periodOff || legacyStored.periodOff, 2, 1, 32),
    dt: asInteger(params.get('dt') || stored.dt || legacyStored.dt, 1, 1, 16),
    ageMode: normalizeAgeMode(params.get('ageMode') || stored.ageMode || legacyStored.ageMode || (normalizeMode(rawTimelineMode) === 'age' ? 'lifetime' : 'off')),
    lifetime: asInteger(params.get('lifetime') || stored.lifetime || legacyStored.lifetime, 50, 1, 512),
    oldAge: asInteger(params.get('oldAge') || stored.oldAge || legacyStored.oldAge, 40, 1, 512),
    noiseMode: allowsNoise ? String(params.get('noiseMode') || stored.noiseMode || legacyStored.noiseMode || 'off') : 'off',
    noiseRate: allowsNoise ? asNumber(params.get('noiseRate') || stored.noiseRate || legacyStored.noiseRate, 0.04, 0, 1) : 0,
    noisePeriod: allowsNoise ? asInteger(params.get('noisePeriod') || stored.noisePeriod || legacyStored.noisePeriod, 6, 1, 256) : 1
  };
  if (!hasTimelineModeQuery && settings.periodMode === 'periodic') settings.mode = 'periodic';
  settings.actionOffset = Math.min(settings.actionOffset, settings.delay);
  settings.mode = sanitizeMode(settings.mode);
  if (!supportsAgeMode()) settings.ageMode = 'off';
  if (!supportsPeriodMode()) settings.periodMode = 'off';
  applyExclusiveModeDefaults();
  const state = {
    app: null,
    tick: 0,
    pending: [],
    timeline: [],
    failures: [],
    rewrittenEvents: [],
    cancelledEvents: [],
    conflicts: [],
    initialSnapshot: null,
    lastSnapshot: null,
    internalAction: false,
    editingEventId: null,
    replacementSource: null,
    pendingReplacement: null,
    previewReturnSnapshot: null,
    replayAnimating: false,
    replayOverlay: null,
    selectionSource: null,
    settingsLocked: false,
    message: '',
    decayCount: 0,
    noiseCount: 0,
    jumpAges: new Map(),
    chessAges: new Map(),
    hexAges: new Map(),
    goPeriodPhases: new Map()
  };

  installStyles();
  const panel = installPanel();
  bindPanel();
  refresh();

  waitForApp().then((app) => {
    if (!app) {
      state.message = 'The original game engine did not become available.';
      refresh();
      return;
    }
    state.app = app;
    state.tick = observedTurn(app);
    state.initialSnapshot = captureSnapshot(app);
    state.lastSnapshot = clone(state.initialSnapshot);
    exposeRouteFlags(app);
    patchGame(app);
    writeURL();
    refresh();
  });

  window.addEventListener('languagechange', refresh);

  function readStored() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  }

  function readLegacyStored() {
    try {
      return JSON.parse(localStorage.getItem(legacyStorageKey) || '{}');
    } catch {
      return {};
    }
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify(settings));
    localStorage.setItem(legacyStorageKey, JSON.stringify({
      settingsVersion: 5,
      timeMode: settings.periodMode === 'periodic' && family === 'go' ? 'periodic' : 'delay',
      ageMode: settings.ageMode,
      delay: settings.delay,
      actionDelay: 0,
      period: settings.periodOn + settings.periodOff,
      periodOn: settings.periodOn,
      periodOff: settings.periodOff,
      lifetime: settings.lifetime,
      oldAge: settings.oldAge,
      dt: settings.dt,
      noiseMode: settings.noiseMode,
      noiseRate: settings.noiseRate,
      noisePeriod: settings.noisePeriod
    }));
  }

  function writeURL() {
    const url = new URL(location.href);
    url.searchParams.set('spacetime', layer);
    url.searchParams.set('family', family);
    url.searchParams.set('timeMode', settings.mode);
    if (usesFuture()) {
      url.searchParams.set('delay', String(settings.delay));
      if (settings.actionOffset !== settings.delay) url.searchParams.set('actionOffset', String(settings.actionOffset));
      else url.searchParams.delete('actionOffset');
    } else {
      url.searchParams.delete('delay');
      url.searchParams.delete('actionOffset');
    }
    if (usesPast()) {
      url.searchParams.set('pastWindow', String(settings.rewriteWindow));
      url.searchParams.set('conflictPolicy', settings.conflictPolicy);
    } else {
      url.searchParams.delete('pastWindow');
      url.searchParams.delete('conflictPolicy');
    }
    url.searchParams.delete('rewriteWindow');
    url.searchParams.set('dt', String(settings.dt));
    if (family === 'go' && settings.periodMode === 'periodic') {
      url.searchParams.set('periodMode', 'periodic');
      url.searchParams.set('period', String(settings.periodOn + settings.periodOff));
      url.searchParams.set('periodOn', String(settings.periodOn));
      url.searchParams.set('periodOff', String(settings.periodOff));
    } else {
      url.searchParams.delete('periodMode');
      url.searchParams.delete('period');
      url.searchParams.delete('periodOn');
      url.searchParams.delete('periodOff');
    }
    if (settings.ageMode === 'lifetime') {
      url.searchParams.set('ageMode', 'lifetime');
      url.searchParams.set('lifetime', String(settings.lifetime));
      url.searchParams.set('oldAge', String(settings.oldAge));
    } else {
      url.searchParams.delete('ageMode');
      url.searchParams.delete('lifetime');
      url.searchParams.delete('oldAge');
    }
    if (allowsNoise && settings.noiseMode !== 'off') {
      url.searchParams.set('noiseMode', settings.noiseMode);
      url.searchParams.set('noiseRate', String(settings.noiseRate));
      url.searchParams.set('noisePeriod', String(settings.noisePeriod));
    } else {
      url.searchParams.delete('noiseMode');
      url.searchParams.delete('noiseRate');
      url.searchParams.delete('noisePeriod');
    }
    history.replaceState(null, '', url);
  }

  function installStyles() {
    if (document.getElementById('spaceTimeTimelineStyle')) return;
    const style = document.createElement('style');
    style.id = 'spaceTimeTimelineStyle';
    style.textContent = `
      .st-timeline{position:relative;z-index:50;flex:0 0 auto;box-sizing:border-box;width:100%;max-width:100%;margin:14px 0;border:1px solid rgba(86,190,222,.42);border-radius:8px;background:#09111bcc;color:#eef8ff;overflow:hidden}
      .st-timeline *{box-sizing:border-box}
      .st-timeline__head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:14px;border-bottom:1px solid rgba(86,190,222,.18)}
      .st-timeline__head h3{margin:0;color:#f3bd49;font-size:1.08rem;letter-spacing:0;line-height:1.18}.st-timeline__head p{margin:4px 0 0;color:#b9cad8;line-height:1.45;font-size:.92rem;overflow-wrap:anywhere}
      .st-timeline__body{display:grid;gap:12px;padding:14px}.st-timeline__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}
      .st-timeline label{display:grid;min-width:0;gap:5px;color:#aac1d2;font-size:.82rem;font-weight:800}.st-timeline label span{min-width:0;line-height:1.25;overflow-wrap:anywhere}.st-timeline select,.st-timeline input{width:100%;min-width:0;min-height:42px;padding:9px 10px;border:1px solid rgba(86,190,222,.36);border-radius:6px;background:#080f18;color:#f6fbff;font:inherit}
      .st-timeline__help,.st-timeline__message,.st-timeline__online{margin:0;padding:9px 10px;border:1px solid rgba(86,190,222,.16);border-radius:6px;background:#0c1723;color:#c6d7e3;line-height:1.5;font-size:.9rem;overflow-wrap:anywhere}
      .st-timeline__online{color:#ffd9a0;border-color:rgba(232,164,47,.38)}.st-timeline__actions{display:flex;flex-wrap:wrap;gap:8px;position:relative;z-index:3}
      .st-timeline button,.st-timeline a{min-height:40px;min-width:0;padding:8px 12px;border:1px solid rgba(86,190,222,.4);border-radius:6px;background:#0a1420;color:#f5f9fc;font-weight:800;text-decoration:none;cursor:pointer;white-space:normal;line-height:1.2;overflow-wrap:anywhere;text-align:center}
      .st-timeline button:hover,.st-timeline a:hover{border-color:#f3bd49}.st-timeline button:disabled,.st-timeline select:disabled,.st-timeline input:disabled{opacity:.52;cursor:not-allowed}
      .st-timeline__section{display:grid;gap:7px}.st-timeline__section h4{margin:0;color:#f3bd49;font-size:.88rem;letter-spacing:0}.st-timeline__list{display:grid;gap:6px}
      .st-timeline__event{display:grid;grid-template-columns:minmax(0,1fr) minmax(118px,auto);gap:8px;align-items:center;padding:8px 10px;border:1px solid rgba(86,190,222,.17);border-radius:6px;background:#0b1622}
      .st-timeline__event span{min-width:0;overflow-wrap:anywhere;color:#dceaf3;font-size:.84rem;line-height:1.35}.st-timeline__event-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}
      .st-timeline__event button{min-height:30px;padding:4px 8px;font-size:.75rem}.st-timeline__empty{color:#93a9b8;font-size:.82rem}
      .st-timeline__group{display:grid;gap:6px}.st-timeline__group-title{margin:6px 0 0;color:#aac1d2;font-size:.75rem;font-weight:900;text-transform:uppercase;letter-spacing:.02em}
      .st-timeline__event.is-failed{border-color:rgba(248,113,113,.42);background:#1a1014}.st-timeline__event.is-obsolete{border-color:rgba(251,191,36,.32);background:#18150d}
      .st-timeline__event.is-rewritten{border-color:rgba(167,139,250,.38);background:#141225}.st-timeline__event.is-conflict{border-color:rgba(248,113,113,.55);background:#1a1014}
      .st-timeline__replacement{border-color:#f3bd49;background:rgba(243,189,73,.09);color:#ffe8ad}
      .st-timeline__legacy{border-top:1px solid rgba(86,190,222,.18);padding-top:10px}.st-timeline__legacy p{margin:0;color:#b9cad8;line-height:1.45;font-size:.82rem}
      .st-timeline__summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.st-timeline__summary span{border:1px solid rgba(86,190,222,.15);border-radius:6px;background:#0c1723;color:#dceaf3;padding:7px 9px;font-size:.8rem;overflow-wrap:anywhere}
      .st-piece-age-ring{position:absolute;inset:7%;border:3px solid rgba(125,255,255,.98);border-radius:50%;box-shadow:0 0 12px rgba(125,255,255,.78);pointer-events:none}.st-piece-age-ring.near-death{border-color:rgba(255,64,64,1);box-shadow:0 0 16px rgba(255,64,64,.9)}
      .st-piece-age-label{position:absolute;right:2px;bottom:2px;z-index:4;font-size:.62rem;color:#e0f2fe;text-shadow:0 1px 2px #000;pointer-events:none}
      .st-replay-badge{position:fixed;z-index:9998;left:50%;top:14px;transform:translateX(-50%);max-width:min(720px,calc(100vw - 24px));padding:9px 13px;border:1px solid rgba(243,189,73,.7);border-radius:999px;background:#08111df2;box-shadow:0 12px 38px rgba(0,0,0,.38);color:#ffe8ad;font-size:.86rem;font-weight:850;pointer-events:none;text-align:center}
      .st-slice-picker{position:fixed;z-index:9999;display:grid;gap:7px;min-width:210px;max-width:min(360px,calc(100vw - 24px));padding:10px;border:1px solid rgba(243,189,73,.64);border-radius:8px;background:#08111df2;box-shadow:0 18px 50px rgba(0,0,0,.42);color:#eef8ff}
      .st-slice-picker strong{font-size:.86rem;color:#f3bd49;line-height:1.25}.st-slice-picker__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(58px,1fr));gap:6px}.st-slice-picker button{min-height:34px;padding:6px 7px;border:1px solid rgba(86,190,222,.4);border-radius:6px;background:#0a1420;color:#f5f9fc;font-weight:850;cursor:pointer;line-height:1.15;white-space:normal}.st-slice-picker button:hover{border-color:#f3bd49}.st-slice-picker__past{border-color:rgba(248,113,113,.52)!important}.st-slice-picker__now{border-color:rgba(79,178,124,.64)!important}.st-slice-picker__future{border-color:rgba(86,190,222,.58)!important}
      .st-timeline [hidden]{display:none!important}
      @media(max-width:920px){.st-timeline__grid{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}.st-timeline__event{grid-template-columns:1fr}.st-timeline__event-actions{justify-content:flex-start}.st-timeline__actions>*{flex:1 1 180px}}
      @media(max-width:680px){.st-timeline{margin:10px 0}.st-timeline__head{display:block;padding:12px}.st-timeline__body{padding:12px}.st-timeline__grid,.st-timeline__summary{grid-template-columns:1fr}.st-timeline__actions{display:grid;grid-template-columns:1fr}.st-timeline button,.st-timeline a{width:100%;text-align:center}.st-slice-picker{left:12px!important;right:12px!important;max-width:none}.st-slice-picker__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function installPanel() {
    const card = document.createElement('section');
    card.className = 'st-timeline';
    card.innerHTML = `
      <div class="st-timeline__head">
        <div><h3 data-st-title></h3><p data-st-intro></p></div>
      </div>
      <div class="st-timeline__body">
        <div class="st-timeline__grid">
          <label><span data-st-label="mode"></span>
            <select data-st-mode>
              <option value="future"></option>
              <option value="past"></option>
              <option value="past_future"></option>
              <option value="age"></option>
              <option value="periodic"></option>
            </select>
          </label>
          <label data-st-future><span data-st-label="delay"></span>
            <select data-st-delay>${Array.from({ length: 32 }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('')}</select>
          </label>
          <label data-st-future><span data-st-label="actionSlice"></span>
            <select data-st-action-offset></select>
          </label>
          <label data-st-past><span data-st-label="window"></span>
            <select data-st-window>
              <option value="3">3 ticks</option><option value="5">5 ticks</option>
              <option value="8">8 ticks</option><option value="12">12 ticks</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label data-st-custom><span data-st-label="customWindow"></span>
            <input data-st-custom-window type="number" min="1" max="64" step="1">
          </label>
          <label data-st-past><span data-st-label="conflict"></span>
            <select data-st-conflict><option value="strict"></option><option value="fail_forward"></option></select>
          </label>
        </div>
        <p class="st-timeline__help" data-st-help></p>
        <p class="st-timeline__online" data-st-online hidden></p>
        <p class="st-timeline__message" data-st-message hidden></p>
        <div class="st-timeline__actions" data-st-rewrite-actions hidden>
          <button type="button" data-st-apply-rewrite></button>
          <button type="button" data-st-cancel-rewrite></button>
        </div>
        <section class="st-timeline__section st-timeline__legacy" data-st-legacy-section>
          <h4 data-st-legacy-title></h4>
          <p data-st-legacy-help></p>
          <div class="st-timeline__grid">
            <label data-st-go-period><span data-st-label="periodMode"></span>
              <select data-st-period-mode><option value="off"></option><option value="periodic"></option></select>
            </label>
            <label data-st-period-control><span data-st-label="appearTurns"></span>
              <input data-st-period-on type="number" min="1" max="32" step="1">
            </label>
            <label data-st-period-control><span data-st-label="disappearTurns"></span>
              <input data-st-period-off type="number" min="1" max="32" step="1">
            </label>
            <label><span data-st-label="dt"></span>
              <input data-st-dt type="number" min="1" max="16" step="1">
            </label>
            <label data-st-age-choice><span data-st-label="ageMode"></span>
              <select data-st-age-mode><option value="off"></option><option value="lifetime"></option></select>
            </label>
            <label data-st-age-control><span data-st-label="lifetime"></span>
              <input data-st-lifetime type="number" min="1" max="512" step="1">
            </label>
            <label data-st-age-control><span data-st-label="oldAge"></span>
              <input data-st-old-age type="number" min="1" max="512" step="1">
            </label>
            <label data-st-noise><span data-st-label="noise"></span>
              <select data-st-noise-mode><option value="off"></option><option value="pieces"></option><option value="board"></option></select>
            </label>
            <label data-st-noise><span data-st-label="noiseRate"></span>
              <input data-st-noise-rate type="number" min="0" max="1" step="0.01">
            </label>
            <label data-st-noise><span data-st-label="noisePeriod"></span>
              <input data-st-noise-period type="number" min="1" max="256" step="1">
            </label>
          </div>
          <div class="st-timeline__summary" data-st-legacy-summary></div>
        </section>
        <div class="st-timeline__actions">
          <button type="button" data-st-apply></button>
        </div>
        <section class="st-timeline__section" data-st-pending-section>
          <h4 data-st-pending-title></h4><div class="st-timeline__list" data-st-pending-list></div>
        </section>
        <section class="st-timeline__section" data-st-history-section>
          <h4 data-st-history-title></h4><div class="st-timeline__list" data-st-history-list></div>
        </section>
      </div>`;
    const host = document.querySelector('.sidebar .control-group') ||
      document.querySelector('.jump-side .jump-card') ||
      document.querySelector('.sidebar') || document.querySelector('.jump-side') || document.body.firstElementChild;
    if (host?.parentElement) host.parentElement.insertBefore(card, host.nextSibling);
    else document.body.prepend(card);
    return card;
  }

  function bindPanel() {
    panel.querySelector('[data-st-mode]').value = settings.mode;
    panel.querySelector('[data-st-delay]').value = String(settings.delay);
    populateActionOffsetOptions();
    panel.querySelector('[data-st-action-offset]').value = String(Math.min(settings.actionOffset, settings.delay));
    const standardWindow = [3, 5, 8, 12].includes(settings.rewriteWindow);
    panel.querySelector('[data-st-window]').value = standardWindow ? String(settings.rewriteWindow) : 'custom';
    panel.querySelector('[data-st-custom-window]').value = String(settings.customWindow);
    panel.querySelector('[data-st-conflict]').value = normalizeConflictPolicy(settings.conflictPolicy);
    panel.querySelector('[data-st-period-mode]').value = settings.periodMode;
    panel.querySelector('[data-st-period-on]').value = String(settings.periodOn);
    panel.querySelector('[data-st-period-off]').value = String(settings.periodOff);
    panel.querySelector('[data-st-dt]').value = String(settings.dt);
    panel.querySelector('[data-st-age-mode]').value = settings.ageMode;
    panel.querySelector('[data-st-lifetime]').value = String(settings.lifetime);
    panel.querySelector('[data-st-old-age]').value = String(settings.oldAge);
    panel.querySelector('[data-st-noise-mode]').value = settings.noiseMode;
    panel.querySelector('[data-st-noise-rate]').value = String(settings.noiseRate);
    panel.querySelector('[data-st-noise-period]').value = String(settings.noisePeriod);
    panel.querySelector('[data-st-apply]').addEventListener('click', applyControls);
    panel.querySelectorAll('select,input').forEach((control) => control.addEventListener('change', syncConditionalControls));
    panel.addEventListener('click', handlePanelClick);
  }

  function applyControls() {
    const requestedMode = sanitizeMode(panel.querySelector('[data-st-mode]').value);
    if (state.settingsLocked) {
      panel.querySelector('[data-st-mode]').value = settings.mode;
      state.message = text('modeLocked');
      refresh();
      return;
    }
    if (requestedMode === 'periodic' && !supportsPeriodMode()) {
      settings.mode = 'future';
      settings.periodMode = 'off';
      state.message = text('modeApplied');
    } else if (requestedMode === 'age' && !supportsAgeMode()) {
      settings.mode = 'future';
      settings.ageMode = 'off';
      state.message = text('ageUnavailable');
    } else if (requestedMode === 'past_future' && isOnline()) {
      settings.mode = 'future';
      state.message = text('onlineBoth');
    } else if (requestedMode === 'past' && isOnline()) {
      settings.mode = 'future';
      state.message = text('online');
    } else {
      settings.mode = requestedMode;
      state.message = text('modeApplied');
    }
    settings.delay = asInteger(panel.querySelector('[data-st-delay]').value, 2, 1, 32);
    settings.actionOffset = Math.min(settings.delay, asInteger(panel.querySelector('[data-st-action-offset]').value, settings.delay, 0, 32));
    if (!state.settingsLocked) {
      const selected = panel.querySelector('[data-st-window]').value;
      settings.customWindow = asInteger(panel.querySelector('[data-st-custom-window]').value, 5, 1, 64);
      settings.rewriteWindow = selected === 'custom' ? settings.customWindow : asInteger(selected, 5, 1, 64);
      settings.conflictPolicy = normalizeConflictPolicy(panel.querySelector('[data-st-conflict]').value);
    }
    applyExclusiveModeDefaults();
    settings.periodOn = asInteger(panel.querySelector('[data-st-period-on]').value, 2, 1, 32);
    settings.periodOff = asInteger(panel.querySelector('[data-st-period-off]').value, 2, 1, 32);
    settings.dt = asInteger(panel.querySelector('[data-st-dt]').value, 1, 1, 16);
    settings.lifetime = asInteger(panel.querySelector('[data-st-lifetime]').value, 50, 1, 512);
    settings.oldAge = asInteger(panel.querySelector('[data-st-old-age]').value, 40, 1, 512);
    settings.noiseMode = allowsNoise ? (panel.querySelector('[data-st-noise-mode]').value || 'off') : 'off';
    settings.noiseRate = allowsNoise ? asNumber(panel.querySelector('[data-st-noise-rate]').value, 0.04, 0, 1) : 0;
    settings.noisePeriod = allowsNoise ? asInteger(panel.querySelector('[data-st-noise-period]').value, 6, 1, 256) : 1;
    saveSettings();
    writeURL();
    exposeRouteFlags(state.app);
    installLegacyTimeAdapters(state.app);
    refresh();
  }

  function syncConditionalControls(event = null) {
    if (state.settingsLocked) {
      panel.querySelector('[data-st-mode]').value = settings.mode;
      panel.querySelector('[data-st-delay]').value = String(settings.delay);
      populateActionOffsetOptions();
      panel.querySelector('[data-st-action-offset]').value = String(Math.min(settings.actionOffset, settings.delay));
      refresh();
      return;
    }
    let mode = sanitizeMode(panel.querySelector('[data-st-mode]').value);
    if (mode === 'periodic' && !supportsPeriodMode()) {
      mode = 'future';
      panel.querySelector('[data-st-mode]').value = 'future';
    }
    if (mode === 'age' && !supportsAgeMode()) {
      mode = 'future';
      panel.querySelector('[data-st-mode]').value = 'future';
    }
    const hasPast = mode === 'past' || mode === 'past_future';
    panel.querySelector('[data-st-custom]').hidden = !hasPast || panel.querySelector('[data-st-window]').value !== 'custom';
    if (event?.target?.matches?.('[data-st-delay]')) {
      settings.delay = asInteger(panel.querySelector('[data-st-delay]').value, settings.delay, 1, 32);
      settings.actionOffset = Math.min(settings.actionOffset, settings.delay);
      populateActionOffsetOptions();
    }
    if (event?.target?.matches?.('[data-st-action-offset]')) {
      settings.actionOffset = Math.min(settings.delay, asInteger(panel.querySelector('[data-st-action-offset]').value, settings.delay, 0, 32));
      saveSettings();
      writeURL();
    }
    panel.querySelectorAll('[data-st-period-control]').forEach((node) => {
      node.hidden = !supportsPeriodMode() || mode !== 'periodic';
    });
    panel.querySelectorAll('[data-st-age-control]').forEach((node) => {
      node.hidden = !supportsAgeMode() || mode !== 'age';
    });
    panel.querySelectorAll('[data-st-go-period]').forEach((node) => { node.hidden = true; });
    panel.querySelectorAll('[data-st-age-choice]').forEach((node) => { node.hidden = true; });
    panel.querySelector('[data-st-legacy-section]').hidden = !(mode === 'age' || mode === 'periodic');
  }

  function populateActionOffsetOptions() {
    const select = panel?.querySelector?.('[data-st-action-offset]');
    if (!select) return;
    const max = asInteger(panel.querySelector('[data-st-delay]')?.value || settings.delay, settings.delay, 1, 32);
    const current = String(Math.min(settings.actionOffset, max));
    select.replaceChildren(...Array.from({ length: max + 1 }, (_, offset) => {
      const option = document.createElement('option');
      option.value = String(offset);
      option.textContent = offset === 0 ? text('instantSlice') : text('futureSlice', { ticks: offset });
      return option;
    }));
    select.value = [...select.options].some((option) => option.value === current) ? current : String(max);
  }

  function handlePanelClick(event) {
    const applyRewrite = event.target.closest('[data-st-apply-rewrite]');
    if (applyRewrite) {
      void applyPendingRewrite();
      return;
    }
    const cancelRewrite = event.target.closest('[data-st-cancel-rewrite]');
    if (cancelRewrite) {
      clearRewriteState(text('cancelRewrite'));
      refresh();
      return;
    }
    const edit = event.target.closest('[data-st-edit]');
    if (edit) {
      beginPastEdit(edit.dataset.stEdit);
      return;
    }
    const cancel = event.target.closest('[data-st-cancel]');
    if (cancel) {
      const action = state.pending.find((item) => item.id === cancel.dataset.stCancel);
      if (!action || !canChangePending(action, true)) {
        refresh();
        return;
      }
      action.status = 'cancelled';
      state.pending = state.pending.filter((item) => item.id !== action.id);
      state.cancelledEvents.push({ ...clone(action), cancelledTick: currentTick() });
      state.message = text('cancel');
      refresh();
      return;
    }
    const reschedule = event.target.closest('[data-st-reschedule]');
    if (reschedule) {
      const action = state.pending.find((item) => item.id === reschedule.dataset.stReschedule);
      if (!action || !canChangePending(action, true)) {
        refresh();
        return;
      }
      const delta = Number(reschedule.dataset.stDelta) || 0;
      action.resolveTick = Math.max(currentTick() + playerTurnSpan(), action.resolveTick + delta * playerTurnSpan());
      action.delay = Math.max(1, Math.ceil((action.resolveTick - action.submittedTick) / playerTurnSpan()));
      refresh();
    }
  }

  function usesFuture() {
    return settings.mode === 'future' || settings.mode === 'past_future';
  }

  function usesPast() {
    return settings.mode === 'past' || settings.mode === 'past_future';
  }

  function exposeRouteFlags(app) {
    if (!app) return;
    app.__spaceTimeSettings = settings;
    app.__spaceTimeUsesFuture = usesFuture();
    app.__spaceTimeUsesPast = usesPast();
    app.__spaceTimeScheduleRobotAction = (draft) => {
      if (!usesFuture()) return false;
      const normalized = normalizeFutureDraft(draft);
      if (!normalized) return false;
      void scheduleFutureAction(normalized);
      return true;
    };
    app.__spaceTimeOnNewGame = resetTimeline;
    app.__spaceTimeRecordImmediate = (draft, result) => recordImmediate(draft, result);
  }

  function installLegacyTimeAdapters(app) {
    if (!app) return;
    app.__spaceTimeSettings = settings;
    app.__spaceTimeLegacySettings = settings;
    if (family === 'go' || family === 'reversi') installStoneTimeAdapters(app);
    if (family === 'go') installGoPeriodVisibility(app);
    if (family === 'hex') installHexAgeAdapters(app);
    if (family === 'jump') installJumpAgeAdapters(app);
    if (family === 'chess' && supportsAgeMode()) installChessAgeAdapters(app.activeGame || app);
  }

  function installStoneTimeAdapters(app) {
    if (!app) return;
    if (layer === '2p1') {
      app.dynamicsSettings = () => ({
        timeEvolution: settings.ageMode === 'lifetime' ? 'decay' : (isGoPeriodEnabled() ? 'periodic' : 'off'),
        lifetime: settings.ageMode === 'lifetime' ? settings.lifetime : goPeriodCycle(),
        oldAge: settings.oldAge,
        noiseMode: map2DNoise(settings.noiseMode),
        noiseRate: allowsNoise ? settings.noiseRate : 0,
        noisePeriod: settings.noisePeriod
      });
      app.setDynamicsSettings = (incoming = {}) => {
        if (incoming.timeEvolution) {
          if (incoming.timeEvolution === 'decay') {
            settings.mode = 'age';
            settings.ageMode = 'lifetime';
          }
          if (incoming.timeEvolution === 'periodic' && family === 'go') {
            settings.mode = 'periodic';
            settings.periodMode = 'periodic';
          }
          if (incoming.timeEvolution === 'off') {
            if (settings.mode === 'age' || settings.mode === 'periodic') settings.mode = 'future';
            settings.ageMode = 'off';
            settings.periodMode = 'off';
          }
        }
        applyExclusiveModeDefaults();
        if (incoming.lifetime) settings.lifetime = asInteger(incoming.lifetime, settings.lifetime, 1, 512);
        if (incoming.oldAge) settings.oldAge = asInteger(incoming.oldAge, settings.oldAge, 1, 512);
        if (incoming.noiseMode) settings.noiseMode = reverse2DNoise(incoming.noiseMode);
        if (incoming.noiseRate !== undefined) settings.noiseRate = asNumber(incoming.noiseRate, settings.noiseRate, 0, 1);
        if (incoming.noisePeriod) settings.noisePeriod = asInteger(incoming.noisePeriod, settings.noisePeriod, 1, 256);
        saveSettings();
        refresh();
      };
    } else {
      app.shouldShowAgeRings = () => settings.ageMode === 'lifetime' || isGoPeriodEnabled();
      app.pieceTimeConfig = () => ({
        enabled: settings.ageMode === 'lifetime' || isGoPeriodEnabled(),
        mode: settings.ageMode === 'lifetime' ? 'decay' : 'count',
        decay: settings.ageMode === 'lifetime',
        lifespan: settings.ageMode === 'lifetime' ? settings.lifetime : goPeriodCycle()
      });
      app.noiseConfig = () => ({
        mode: allowsNoise ? map3DNoise(settings.noiseMode) : 'off',
        period: settings.noisePeriod
      });
    }
  }

  function installGoPeriodVisibility(app) {
    if (!app || app.__spaceTimePeriodVisibilityInstalled) return;
    app.__spaceTimePeriodVisibilityInstalled = true;
    app.isSpaceTimeIndexVisible = (index, coord = null) => isGoPeriodVisible(app, index, coord);
  }

  function installHexAgeAdapters(app) {
    syncHexAges(app, { fresh: !state.hexAges.size });
    if (!app || app.__spaceTimeAgeRenderPatched || typeof app.render !== 'function') return;
    app.__spaceTimeAgeRenderPatched = true;
    const originalRender = app.render.bind(app);
    app.render = (...args) => {
      const result = originalRender(...args);
      drawHexAgeOverlay(app);
      return result;
    };
  }

  function installJumpAgeAdapters(app) {
    syncJumpAges(app, { fresh: !state.jumpAges.size });
    if (!app || app.__spaceTimeAgeRenderPatched || typeof app.render !== 'function') return;
    app.__spaceTimeAgeRenderPatched = true;
    const originalRender = app.render.bind(app);
    app.render = (...args) => {
      const result = originalRender(...args);
      drawJumpAgeOverlay(app);
      return result;
    };
  }

  function installChessAgeAdapters(game) {
    syncChessAges(game, { fresh: !state.chessAges.size });
    if (!game || game.__spaceTimeAgeRenderPatched || typeof game.renderBoard !== 'function') return;
    game.__spaceTimeAgeRenderPatched = true;
    const originalRender = game.renderBoard.bind(game);
    game.renderBoard = (...args) => {
      const result = originalRender(...args);
      renderChessAgeRings(game);
      return result;
    };
  }

  function isGoPeriodEnabled() {
    return family === 'go' && settings.periodMode === 'periodic';
  }

  function goPeriodCycle() {
    return Math.max(1, settings.periodOn + settings.periodOff);
  }

  function map2DNoise(mode) {
    if (!allowsNoise || mode === 'off') return 'off';
    return mode === 'pieces' ? 'random-death' : 'random-birth';
  }

  function reverse2DNoise(mode) {
    if (mode === 'random-death') return 'pieces';
    if (mode === 'random-birth') return 'board';
    return 'off';
  }

  function map3DNoise(mode) {
    if (!allowsNoise || mode === 'off') return 'off';
    return mode === 'pieces' ? 'pieces' : 'board';
  }

  function waitForApp() {
    const names = ['go2dApp', 'reversi2dApp', 'go3dApp', 'reversi3dApp', 'jumpApp', 'hexApp', 'gameApp', 'game'];
    return new Promise((resolve) => {
      let attempts = 0;
      const poll = () => {
        for (const name of names) {
          const app = window[name];
          if (!app) continue;
          if (family === 'go' && !name.includes('go')) continue;
          if (family === 'reversi' && !name.includes('reversi')) continue;
          if (family === 'jump' && name !== 'jumpApp') continue;
          if (family === 'hex' && name !== 'hexApp') continue;
          if (family === 'chess' && !['gameApp', 'game'].includes(name)) continue;
          resolve(app);
          return;
        }
        attempts += 1;
        if (attempts > 150) resolve(null);
        else setTimeout(poll, 80);
      };
      poll();
    });
  }

  function patchGame(app) {
    if (app.__spaceTimeTimelinePatched) return;
    app.__spaceTimeTimelinePatched = true;
    exposeRouteFlags(app);
    patchReset(app);
    patchImmediateRecording(app);
    installLegacyTimeAdapters(app);
    installBoardCapture(app);
  }

  function patchReset(app) {
    for (const name of ['resetGame', 'newGame']) {
      if (typeof app[name] !== 'function' || app[`__stOriginal_${name}`]) continue;
      const original = app[name].bind(app);
      app[`__stOriginal_${name}`] = original;
      app[name] = (...args) => {
        const result = original(...args);
        if (!state.internalAction) queueMicrotask(resetTimeline);
        return result;
      };
    }
  }

  function patchImmediateRecording(app) {
    if ((family === 'go' || family === 'reversi') && app.logic) patchStoneLogic(app);
    if (family === 'jump' && typeof app.applyJumpMove === 'function') {
      const original = app.applyJumpMove.bind(app);
      app.__stOriginalApplyJumpMove = original;
      app.applyJumpMove = (move, ...rest) => {
        const player = app.game?.currentPlayer;
        const result = original(move, ...rest);
        recordImmediate({ kind: 'jump', player, move: plainMove(move) }, result);
        return result;
      };
    }
    if (family === 'chess') {
      const game = app.activeGame || app;
      if (typeof game.applyMove === 'function') {
        const original = game.applyMove.bind(game);
        game.__stOriginalApplyMove = original;
        game.applyMove = async (move, ...rest) => {
          const player = game.currentPlayer;
          const result = await original(move, ...rest);
          recordImmediate({
            kind: 'chess',
            player,
            from: clone(move?.from),
            to: clone(move?.to),
            promotion: move?.promotion || null
          }, result);
          return result;
        };
      }
      if (typeof game.handleSquareClick === 'function') {
        const originalClick = game.handleSquareClick.bind(game);
        game.handleSquareClick = (...coords) => {
          if (usesFuture() || usesPast() || state.editingEventId) return captureChessCoordinate(game, coords, null);
          return originalClick(...coords);
        };
      }
    }
  }

  function patchStoneLogic(app) {
    const logic = app.logic;
    const method = family === 'go' ? 'tryPlay' : 'play';
    if (typeof logic[method] === 'function') {
      const original = logic[method].bind(logic);
      logic[`__stOriginal_${method}`] = original;
      logic[method] = (coord, player, ...rest) => {
        const actor = player || logic.currentPlayer;
        const result = original(coord, actor, ...rest);
        recordImmediate({ kind: family, player: actor, coord: clone(coord) }, result);
        return result;
      };
    }
    if (typeof logic.pass === 'function') {
      const originalPass = logic.pass.bind(logic);
      logic.__stOriginal_pass = originalPass;
      logic.pass = (player, ...rest) => {
        const actor = player || logic.currentPlayer;
        const result = originalPass(actor, ...rest);
        recordImmediate({ kind: family, player: actor, pass: true }, result);
        return result;
      };
    }
  }

  function installBoardCapture(app) {
    const canvas = app.canvas || document.getElementById('goBoard') || document.getElementById('reversiBoard') ||
      document.getElementById('jumpCanvas') || document.getElementById('hexBoard');
    if (canvas) canvas.addEventListener('click', (event) => captureBoardAction(app, event), true);
    const chessboard = document.getElementById('chessboard');
    if (chessboard) chessboard.addEventListener('click', (event) => captureChessBoardAction(app.activeGame || app, event), true);
  }

  function captureBoardAction(app, event) {
    if (!usesFuture() && !usesPast() && !state.editingEventId) return;
    if (state.replayAnimating) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    let handled = false;
    if (family === 'jump') handled = captureJumpAction(app, event);
    else {
      const coord = coordFromEvent(app, event);
      if (!coord) return;
      const raw = { kind: family, player: replacementPlayer() || currentPlayer(app), coord: clone(coord) };
      handled = state.editingEventId ? submitReplacement(raw) : submitBoardTimeChoice(raw, event);
    }
    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function captureChessBoardAction(game, event) {
    if (!usesFuture() && !usesPast() && !state.editingEventId) return;
    if (state.replayAnimating) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const square = event.target.closest?.('.square');
    const board = document.getElementById('chessboard');
    if (!square || !board) return;
    const index = [...board.querySelectorAll('.square')].indexOf(square);
    if (index < 0) return;
    const coord = { r: Math.floor(index / 8), c: index % 8 };
    const handled = captureChessCoordinate(game, coord, event);
    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function captureChessCoordinate(game, coords, event = null) {
    const coord = Array.isArray(coords)
      ? coords.length >= 3 ? { x: Number(coords[0]), y: Number(coords[1]), z: Number(coords[2]) } : { r: Number(coords[0]), c: Number(coords[1]) }
      : coords;
    if (!coord) return false;
    if (state.editingEventId) {
      if (!state.replacementSource) {
        state.replacementSource = clone(coord);
        state.message = text('selectedSource');
        triggerRender();
        refresh();
        return true;
      }
      return submitReplacement({
        kind: 'chess',
        player: replacementPlayer(),
        from: clone(state.replacementSource),
        to: clone(coord)
      });
    }
    if (game.selectedSquare) {
      const action = { kind: 'chess', player: game.currentPlayer, from: clone(game.selectedSquare), to: clone(coord) };
      const legal = findChessMove(game, action.from, action.to);
      if (legal) {
        submitBoardTimeChoice(action, event);
        clearChessSelection(game);
        return true;
      }
    }
    const piece = getChessPiece(game, coord);
    if (piece?.color === game.currentPlayer) {
      if ('r' in coord) game.selectSquare?.(coord.r, coord.c);
      else game.selectSquare?.(coord.x, coord.y, coord.z || 0);
      return true;
    }
    return true;
  }

  function captureJumpAction(app, event) {
    const coord = coordFromEvent(app, event);
    if (!coord) return false;
    if (state.editingEventId) {
      if (!state.replacementSource) {
        state.replacementSource = clone(coord);
        state.message = text('selectedSource');
        triggerRender();
        refresh();
        return true;
      }
      return submitReplacement({
        kind: 'jump',
        player: replacementPlayer(),
        move: { from: clone(state.replacementSource), to: clone(coord) }
      });
    }
    if (app.selected) {
      const move = app.legal?.find((candidate) => sameCoord(candidate.to, coord));
      if (move) {
        submitBoardTimeChoice({ kind: 'jump', player: app.game.currentPlayer, move: plainMove(move) }, event);
        app.selected = null;
        app.legal = [];
        app.render?.();
        return true;
      }
    }
    if (app.game?.isOwn?.(coord)) {
      app.selectJumpPiece?.(coord);
      return true;
    }
    return true;
  }

  function submitFutureFromBoard(raw) {
    const action = normalizeFutureDraft(raw);
    if (!action) return true;
    void scheduleFutureAction(action);
    return true;
  }

  function submitBoardTimeChoice(raw, event) {
    if (!usesFuture() && !usesPast()) return false;
    showSlicePicker(raw, event);
    return true;
  }

  function removeSlicePicker() {
    document.querySelectorAll('.st-slice-picker').forEach((node) => node.remove());
  }

  function showSlicePicker(raw, event) {
    removeSlicePicker();
    const picker = document.createElement('div');
    picker.className = 'st-slice-picker';
    picker.innerHTML = `<strong>${escapeHTML(text('chooseSlice'))}</strong><div class="st-slice-picker__grid"></div>`;
    const grid = picker.querySelector('.st-slice-picker__grid');
    const offsets = [];
    if (usesPast()) {
      for (let offset = -settings.rewriteWindow; offset < 0; offset += 1) offsets.push(offset);
    }
    offsets.push(0);
    if (usesFuture()) {
      for (let offset = 1; offset <= settings.delay; offset += 1) offsets.push(offset);
    }
    offsets.forEach((offset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = offset < 0 ? 'st-slice-picker__past' : offset === 0 ? 'st-slice-picker__now' : 'st-slice-picker__future';
      button.textContent = offset < 0
        ? text('pastSlice', { ticks: Math.abs(offset) })
        : offset === 0 ? text('instantSlice') : text('futureSlice', { ticks: offset });
      button.addEventListener('click', () => {
        removeSlicePicker();
        void applySliceChoice(raw, offset);
      });
      grid.append(button);
    });
    document.body.append(picker);
    const rect = picker.getBoundingClientRect();
    const anchorX = Number.isFinite(event?.clientX) ? event.clientX : window.innerWidth / 2;
    const anchorY = Number.isFinite(event?.clientY) ? event.clientY : window.innerHeight / 2;
    const left = Math.max(12, Math.min(window.innerWidth - rect.width - 12, anchorX + 10));
    const top = Math.max(12, Math.min(window.innerHeight - rect.height - 12, anchorY + 10));
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
    const close = (closeEvent) => {
      if (!picker.contains(closeEvent.target)) {
        removeSlicePicker();
        document.removeEventListener('pointerdown', close, true);
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', close, true), 0);
  }

  async function applySliceChoice(raw, offset) {
    if (offset < 0) return beginPastSliceReplacement(raw, Math.abs(offset));
    if (offset === 0) return applyInstantActionFromPicker(raw);
    if (usesFuture()) {
      const previous = settings.actionOffset;
      settings.actionOffset = Math.max(1, Math.min(settings.delay, offset));
      const action = normalizeFutureDraft(raw);
      if (action) await scheduleFutureAction(action);
      else {
        state.message = text('replacementIllegal');
        refresh();
      }
      settings.actionOffset = previous;
      return true;
    }
    return applyInstantActionFromPicker(raw);
  }

  async function applyInstantActionFromPicker(raw) {
    const action = normalizeFutureDraft(raw);
    if (!action) {
      state.message = text('replacementIllegal');
      refresh();
      return false;
    }
    const before = captureSnapshot(state.app);
    state.internalAction = true;
    const ok = await applyAction(action, { preserveTurn: false });
    state.internalAction = false;
    state.tick = Math.max(state.tick + 1, observedTurn(state.app));
    if (ok) recordTimelineEvent(action, before, captureSnapshot(state.app), state.tick);
    else {
      const conflict = makeConflict({
        eventId: `instant:${Date.now()}`,
        tick: state.tick,
        severity: 'soft',
        reasonCode: 'replacement_illegal',
        action,
        resolution: 'mark_event_failed'
      });
      state.failures.push({ ...clone(action), status: 'failed', failedTick: state.tick, conflicts: [conflict] });
      state.conflicts.push(conflict);
      state.message = `${text('failed')}: ${conflictText(conflict)}`;
      refresh();
    }
    await processDueActions();
    return ok;
  }

  function beginPastSliceReplacement(raw, age) {
    if (!usesPast()) return false;
    const targetTick = currentTick() - age;
    const resolvedTicks = state.timeline
      .filter((candidate) => candidate.status === 'resolved' && !candidate.obsolete)
      .map((candidate) => Number(candidate.tick));
    const earliestTick = resolvedTicks.length ? Math.min(...resolvedTicks) : Infinity;
    if (!Number.isFinite(earliestTick) || targetTick < earliestTick) {
      state.message = text('outsideWindow');
      refresh();
      return false;
    }
    const event = [...state.timeline].reverse().find((candidate) =>
      candidate.tick <= targetTick && candidate.player === raw.player && canEdit(candidate));
    if (!event) {
      state.message = text('outsideWindow');
      refresh();
      return false;
    }
    state.previewReturnSnapshot = captureSnapshot(state.app);
    restoreSnapshot(state.app, event.beforeSnapshot);
    state.editingEventId = event.id;
    state.replacementSource = null;
    state.pendingReplacement = null;
    state.replayOverlay = { action: clone(raw), label: text('pastPreview') };
    state.message = `${text('pastPreview')}: ${text('pastPreviewHelp')}`;
    triggerRender();
    refresh();
    return true;
  }

  function normalizeFutureDraft(raw) {
    if (!raw || raw.kind !== family) return null;
    if (family === 'hex') {
      if (state.app?.game?.winner || state.app?.game?.getCell?.(raw.coord) !== null) return null;
    }
    if (family === 'go') {
      const logic = state.app?.logic;
      const index = logic?.indexFromCoord?.(raw.coord);
      if (!Number.isFinite(index) || logic.board?.[index] !== 0) return null;
    }
    if (family === 'reversi') {
      const logic = state.app?.logic;
      const legal = logic?.legalMoves?.(raw.player)?.some((move) => sameCoord(move.coord, raw.coord));
      if (!legal) return null;
    }
    return clone(raw);
  }

  async function scheduleFutureAction(draft) {
    if (!usesFuture() || isOnlinePastMode()) return false;
    const submittedTick = currentTick();
    const offset = Math.max(1, Math.min(settings.delay, asInteger(settings.actionOffset, settings.delay, 1, 32)));
    const resolveTick = submittedTick + offset * playerTurnSpan();
    const action = {
      ...clone(draft),
      id: crypto.randomUUID?.() || `future-${Date.now()}-${Math.random()}`,
      submittedTick,
      resolveTick,
      delay: offset,
      status: 'pending'
    };
    state.pending.push(action);
    state.settingsLocked = true;
    state.message = text('scheduled');
    clearPendingSelection();
    consumeSubmissionTurn();
    await processDueActions();
    refresh();
    return true;
  }

  function consumeSubmissionTurn() {
    const app = state.app;
    if (family === 'jump') app?.game?.endTurn?.();
    else if (family === 'hex') app?.consumeScheduledHexTurn?.();
    else if (family === 'chess') {
      const game = app?.activeGame || app;
      if (!game?.gameOver) game.currentPlayer = game.currentPlayer === 'white' ? 'black' : 'white';
    } else {
      const logic = app?.logic;
      if (logic && !logic.gameOver) {
        logic.currentPlayer = logic.currentPlayer === 'black' ? 'white' : 'black';
        if ('moveNumber' in logic) logic.moveNumber = Number(logic.moveNumber || 0) + 1;
      }
    }
    state.tick = Math.max(state.tick + 1, observedTurn(app));
    triggerRender();
  }

  async function processDueActions() {
    const due = state.pending.filter((action) => action.status === 'pending' && action.resolveTick <= currentTick());
    state.pending = state.pending.filter((action) => action.status === 'pending' && action.resolveTick > currentTick());
    for (const action of due) {
      if (gameEnded()) {
        const conflict = makeConflict({
          eventId: action.id,
          tick: action.resolveTick,
          severity: 'obsolete',
          reasonCode: 'earlier_game_end',
          action,
          resolution: 'mark_event_obsolete'
        });
        action.status = 'obsolete';
        state.failures.push({ ...clone(action), failedTick: currentTick(), conflicts: [conflict] });
        state.conflicts.push(conflict);
        state.message = `${text('failed')}: ${conflictText(conflict)}`;
        continue;
      }
      const before = captureSnapshot(state.app);
      state.internalAction = true;
      const ok = await applyAction(action, { preserveTurn: true });
      state.internalAction = false;
      if (ok) {
        action.status = 'resolved';
        state.message = text('resolved');
        recordTimelineEvent(action, before, captureSnapshot(state.app), action.resolveTick);
      } else {
        const conflict = makeConflict({
          eventId: action.id,
          tick: action.resolveTick,
          severity: 'soft',
          reasonCode: 'resolve_illegal',
          action,
          resolution: 'mark_event_failed'
        });
        action.status = 'failed';
        state.failures.push({ ...clone(action), failedTick: currentTick(), conflicts: [conflict] });
        state.conflicts.push(conflict);
        state.message = `${text('failed')}: ${conflictText(conflict)}`;
      }
    }
    triggerRender();
  }

  function recordImmediate(draft, result) {
    if (state.internalAction || !usesPast() || usesFuture() || !draft || result === false || result?.ok === false) return;
    const before = state.lastSnapshot || state.initialSnapshot || captureSnapshot(state.app);
    const commit = () => {
      if (draft.kind === 'hex' || draft.kind === 'jump' || draft.kind === 'chess') advanceLegacyAgesAfterAction(draft);
      state.tick = Math.max(state.tick + 1, observedTurn(state.app));
      recordTimelineEvent(draft, before, captureSnapshot(state.app), state.tick);
      triggerRender();
    };
    if (draft.kind === 'go' || draft.kind === 'reversi') queueMicrotask(commit);
    else commit();
  }

  function recordTimelineEvent(action, beforeSnapshot, afterSnapshot, tick) {
    const event = {
      id: crypto.randomUUID?.() || `event-${Date.now()}-${Math.random()}`,
      tick,
      player: action.player,
      action: stripTimelineFields(action),
      status: 'resolved',
      obsolete: false,
      beforeSnapshot: clone(beforeSnapshot),
      afterSnapshot: clone(afterSnapshot)
    };
    state.timeline.push(event);
    state.lastSnapshot = clone(afterSnapshot);
    state.settingsLocked = true;
    state.message = text('resolved');
    refresh();
  }

  function stripTimelineFields(action) {
    const next = clone(action);
    for (const key of ['id', 'submittedTick', 'resolveTick', 'delay', 'status']) delete next[key];
    return next;
  }

  function beginPastEdit(eventId) {
    const event = state.timeline.find((item) => item.id === eventId);
    if (!event || !canEdit(event, true)) return;
    state.editingEventId = event.id;
    state.replacementSource = null;
    state.pendingReplacement = null;
    state.previewReturnSnapshot = captureSnapshot(state.app);
    restoreSnapshot(state.app, event.beforeSnapshot);
    state.message = family === 'jump' || family === 'chess' ? text('selectSource') : text('replacementHelp');
    triggerRender();
    refresh();
  }

  function submitReplacement(raw) {
    const event = state.timeline.find((item) => item.id === state.editingEventId);
    if (!event) return false;
    state.replacementSource = null;
    state.pendingReplacement = {
      eventId: event.id,
      replacement: { ...clone(raw), player: event.player }
    };
    state.replayOverlay = {
      action: state.pendingReplacement.replacement,
      label: text('replacementPreview', { action: describeAction(state.pendingReplacement.replacement) })
    };
    state.message = text('dryRunReplay');
    triggerRender();
    refresh();
    setTimeout(() => { void applyPendingRewrite(); }, 180);
    return true;
  }

  async function applyPendingRewrite() {
    if (!state.pendingReplacement) return false;
    const event = state.timeline.find((item) => item.id === state.pendingReplacement.eventId);
    if (!event || !canEdit(event, true)) {
      clearRewriteState(text('rewriteRejected'));
      refresh();
      return false;
    }
    await replayReplacement(event, state.pendingReplacement.replacement);
    return true;
  }

  function clearRewriteState(message = '') {
    state.editingEventId = null;
    state.replacementSource = null;
    state.pendingReplacement = null;
    if (state.previewReturnSnapshot) restoreSnapshot(state.app, state.previewReturnSnapshot);
    state.previewReturnSnapshot = null;
    state.replayOverlay = null;
    state.message = message;
    updateReplayBadge('');
    clearPendingSelection();
    triggerRender();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function animateReplayFrames(frames, finalSnapshot) {
    if (!frames.length) return;
    state.replayAnimating = true;
    for (let index = 0; index < frames.length; index += 1) {
      const frame = frames[index];
      restoreSnapshot(state.app, frame.snapshot);
      state.replayOverlay = {
        action: frame.action,
        label: text('replayStep', {
          index: index + 1,
          count: frames.length,
          action: describeAction(frame.action)
        })
      };
      state.message = state.replayOverlay.label;
      triggerRender();
      refresh();
      await wait(300);
    }
    restoreSnapshot(state.app, finalSnapshot);
    state.replayAnimating = false;
    state.replayOverlay = null;
    triggerRender();
  }

  async function replayReplacement(targetEvent, replacement) {
    const currentSnapshot = clone(state.previewReturnSnapshot) || captureSnapshot(state.app);
    const originalTimeline = clone(state.timeline);
    const originalPending = clone(state.pending);
    const originalFailures = clone(state.failures);
    const originalRewritten = clone(state.rewrittenEvents);
    const originalConflicts = clone(state.conflicts);
    const targetIndex = state.timeline.findIndex((event) => event.id === targetEvent.id);
    const prefix = state.timeline.slice(0, targetIndex);
    const suffix = state.timeline.slice(targetIndex + 1);
    const rebuilt = [...prefix];
    const validatedPending = [];
    const pendingFailures = [];
    const replayConflicts = [];
    const replayFrames = [];
    const policy = normalizeConflictPolicy(settings.conflictPolicy);
    let snapshot = clone(targetEvent.beforeSnapshot || state.initialSnapshot);
    let rejected = false;
    let earlierEnd = false;

    const addConflict = (data) => {
      const conflict = makeConflict({
        ...data,
        id: `conflict:${targetEvent.id}:${replayConflicts.length + 1}`,
        action: data.action || replacement
      });
      replayConflicts.push(conflict);
      return conflict;
    };
    const rejectWith = (data) => {
      rejected = true;
      return addConflict({ ...data, severity: data.severity || 'hard', resolution: 'reject_rewrite' });
    };
    const shouldReject = () => policy === 'strict';

    state.internalAction = true;
    if (targetIndex < 0 || !restoreSnapshot(state.app, snapshot)) {
      rejectWith({ eventId: targetEvent.id, tick: targetEvent.tick, reasonCode: 'replay_failed' });
    }

    let replacementEvent = null;
    if (!rejected) {
      const replacementBefore = captureSnapshot(state.app);
      const replacementOk = await applyAction(replacement, { preserveTurn: false });
      if (!replacementOk) {
        rejectWith({
          eventId: targetEvent.id,
          tick: targetEvent.tick,
          reasonCode: 'replacement_illegal',
          action: replacement
        });
      } else {
        const after = captureSnapshot(state.app);
        replacementEvent = {
          ...clone(targetEvent),
          action: stripTimelineFields(replacement),
          status: 'resolved',
          obsolete: false,
          failed: false,
          rewrittenFrom: targetEvent.id,
          beforeSnapshot: clone(replacementBefore),
          afterSnapshot: clone(after),
          conflicts: []
        };
        rebuilt.push(replacementEvent);
        snapshot = after;
        replayFrames.push({ action: replacementEvent.action, tick: replacementEvent.tick, snapshot: clone(after) });
        earlierEnd = gameEnded();
      }
    }

    for (const event of suffix) {
      if (rejected) break;
      if (earlierEnd) {
        const conflict = addConflict({
          eventId: event.id,
          tick: event.tick,
          severity: 'obsolete',
          reasonCode: 'earlier_game_end',
          action: event.action,
          resolution: shouldReject() ? 'reject_rewrite' : 'mark_event_obsolete'
        });
        if (shouldReject()) {
          rejected = true;
          break;
        }
        rebuilt.push(markTimelineEvent(event, 'obsolete', snapshot, conflict));
        replayFrames.push({ action: event.action, tick: event.tick, snapshot: clone(snapshot), status: 'obsolete' });
        continue;
      }
      if (!restoreSnapshot(state.app, snapshot)) {
        rejectWith({ eventId: event.id, tick: event.tick, reasonCode: 'replay_failed', action: event.action });
        break;
      }
      const before = captureSnapshot(state.app);
      const ok = await applyAction(event.action, { preserveTurn: false });
      if (!ok) {
        const conflict = addConflict({
          eventId: event.id,
          tick: event.tick,
          severity: 'soft',
          reasonCode: 'resolve_illegal',
          action: event.action,
          resolution: shouldReject() ? 'reject_rewrite' : 'mark_event_failed'
        });
        if (shouldReject()) {
          rejected = true;
          break;
        }
        rebuilt.push(markTimelineEvent(event, 'failed', before, conflict));
        snapshot = before;
        replayFrames.push({ action: event.action, tick: event.tick, snapshot: clone(before), status: 'failed' });
        continue;
      }
      const after = captureSnapshot(state.app);
      rebuilt.push({ ...clone(event), status: 'resolved', obsolete: false, failed: false, beforeSnapshot: clone(before), afterSnapshot: clone(after), conflicts: [] });
      snapshot = after;
      replayFrames.push({ action: event.action, tick: event.tick, snapshot: clone(after), status: 'resolved' });
      earlierEnd = gameEnded();
    }

    const pendingBaseSnapshot = clone(snapshot);
    let pendingSimulationSnapshot = clone(snapshot);
    let pendingEarlierEnd = earlierEnd;
    for (const action of [...originalPending].sort((a, b) => a.resolveTick - b.resolveTick || a.submittedTick - b.submittedTick)) {
      if (rejected) break;
      if (action.status && action.status !== 'pending') continue;
      if (action.resolveTick <= targetEvent.tick) continue;
      if (pendingEarlierEnd) {
        const conflict = addConflict({
          eventId: action.id,
          tick: action.resolveTick,
          severity: 'obsolete',
          reasonCode: 'earlier_game_end',
          action,
          resolution: shouldReject() ? 'reject_rewrite' : 'mark_event_obsolete'
        });
        if (shouldReject()) {
          rejected = true;
          break;
        }
        pendingFailures.push({ ...clone(action), status: 'obsolete', obsolete: true, failedTick: action.resolveTick, conflicts: [conflict] });
        continue;
      }
      if (!restoreSnapshot(state.app, pendingSimulationSnapshot)) {
        rejectWith({ eventId: action.id, tick: action.resolveTick, reasonCode: 'replay_failed', action });
        break;
      }
      const ok = await applyAction(action, { preserveTurn: false });
      if (!ok) {
        const conflict = addConflict({
          eventId: action.id,
          tick: action.resolveTick,
          severity: 'soft',
          reasonCode: 'resolve_illegal',
          action,
          resolution: shouldReject() ? 'reject_rewrite' : 'mark_event_failed'
        });
        if (shouldReject()) {
          rejected = true;
          break;
        }
        pendingFailures.push({ ...clone(action), status: 'failed', failed: true, failedTick: action.resolveTick, conflicts: [conflict] });
        continue;
      }
      pendingSimulationSnapshot = captureSnapshot(state.app);
      validatedPending.push({ ...clone(action), status: 'pending' });
      pendingEarlierEnd = gameEnded();
    }
    restoreSnapshot(state.app, pendingBaseSnapshot);

    if (rejected) {
      restoreSnapshot(state.app, currentSnapshot);
      state.timeline = originalTimeline;
      state.pending = originalPending;
      state.failures = originalFailures;
      state.rewrittenEvents = originalRewritten;
      state.conflicts = [...originalConflicts, ...replayConflicts];
      state.replayOverlay = null;
      state.message = `${text('rewriteRejected')}: ${conflictText(replayConflicts[0]) || text('replayFailed')}`;
    } else {
      state.timeline = rebuilt;
      state.pending = validatedPending;
      state.failures = [...originalFailures, ...pendingFailures];
      state.rewrittenEvents = replacementEvent
        ? [...originalRewritten, { ...clone(targetEvent), status: 'rewritten', rewritten: true, rewrittenBy: replacementEvent.id, rewrittenTick: currentTick() }]
        : originalRewritten;
      state.conflicts = [...originalConflicts, ...replayConflicts];
      state.lastSnapshot = clone(pendingBaseSnapshot);
      state.message = replayConflicts.length
        ? `${text('rewriteCommitted')} ${text('conflictSkipped')} ${formatConflictSummary(replayConflicts)}`
        : text('rewriteCommitted');
    }
    const finalMessage = state.message;
    state.internalAction = false;
    if (!rejected) {
      await animateReplayFrames(replayFrames, pendingBaseSnapshot);
      state.message = finalMessage;
    }
    state.editingEventId = null;
    state.replacementSource = null;
    state.pendingReplacement = null;
    state.previewReturnSnapshot = null;
    state.replayOverlay = null;
    state.replayAnimating = false;
    updateReplayBadge('');
    const rewriteMessage = finalMessage;
    consumeSubmissionTurn();
    state.message = rewriteMessage;
    triggerRender();
    refresh();
  }

  function markTimelineEvent(event, status, snapshot, conflict) {
    return {
      ...clone(event),
      status,
      failed: status === 'failed',
      obsolete: status === 'obsolete',
      beforeSnapshot: clone(snapshot),
      afterSnapshot: clone(snapshot),
      conflicts: conflict ? [conflict] : []
    };
  }

  function makeConflict({
    id = '',
    eventId = '',
    tick = currentTick(),
    severity = 'soft',
    family: conflictFamily = family,
    reasonCode = 'resolve_illegal',
    messageEn = '',
    messageZh = '',
    action = null,
    affectedCells = null,
    resolution = 'mark_event_failed'
  } = {}) {
    const messages = conflictMessages(reasonCode, action);
    return {
      id: id || `conflict:${eventId || 'event'}:${tick}:${reasonCode}`,
      eventId,
      tick,
      severity,
      family: conflictFamily,
      reasonCode,
      messageEn: messageEn || messages.en,
      messageZh: messageZh || messages.zh,
      affectedCells: affectedCells || affectedCellsForAction(action),
      resolution
    };
  }

  function conflictMessages(reasonCode, action = null) {
    if (reasonCode === 'earlier_game_end') return { en: COPY.en.earlierGameEnd, zh: COPY.zh.earlierGameEnd };
    if (reasonCode === 'game_ended') return { en: COPY.en.gameEnded, zh: COPY.zh.gameEnded };
    if (reasonCode === 'replay_failed') return { en: COPY.en.replayFailed, zh: COPY.zh.replayFailed };
    if (reasonCode === 'replacement_illegal') return familyIllegalMessages(action);
    if (reasonCode === 'setup_event') return { en: COPY.en.setupEvent, zh: COPY.zh.setupEvent };
    if (reasonCode === 'opponent_event') return { en: COPY.en.opponentEvent, zh: COPY.zh.opponentEvent };
    if (reasonCode === 'outside_window') return { en: COPY.en.outsideWindow, zh: COPY.zh.outsideWindow };
    return familyIllegalMessages(action);
  }

  function familyIllegalMessages(action = null) {
    const kind = action?.kind || family;
    if (kind === 'hex') return { en: COPY.en.hexConflict, zh: COPY.zh.hexConflict };
    if (kind === 'go') return { en: COPY.en.goConflict, zh: COPY.zh.goConflict };
    if (kind === 'reversi') return { en: COPY.en.reversiConflict, zh: COPY.zh.reversiConflict };
    if (kind === 'jump') return { en: COPY.en.jumpConflict, zh: COPY.zh.jumpConflict };
    if (kind === 'chess') return { en: COPY.en.chessConflict, zh: COPY.zh.chessConflict };
    return { en: COPY.en.replacementIllegal, zh: COPY.zh.replacementIllegal };
  }

  function affectedCellsForAction(action = null) {
    if (!action) return [];
    const cells = [];
    if (action.coord) cells.push(action.coord);
    if (action.from) cells.push(action.from);
    if (action.to) cells.push(action.to);
    if (action.move?.from) cells.push(action.move.from);
    if (action.move?.over) cells.push(action.move.over);
    if (action.move?.to) cells.push(action.move.to);
    return cells.map((cell) => {
      if (Array.isArray(cell)) return cell.map(Number);
      if (cell && typeof cell === 'object') {
        if ('r' in cell || 'c' in cell) return [Number(cell.r), Number(cell.c)];
        return [Number(cell.x), Number(cell.y), Number(cell.z ?? cell.sheet ?? 0)];
      }
      return [String(cell)];
    });
  }

  function conflictText(conflict = null) {
    if (!conflict) return '';
    return language() === 'zh' ? (conflict.messageZh || conflict.messageEn) : (conflict.messageEn || conflict.messageZh);
  }

  function formatConflictSummary(conflicts = []) {
    if (!conflicts.length) return '';
    const first = conflictText(conflicts[0]);
    const extra = conflicts.length > 1 ? ` (+${conflicts.length - 1})` : '';
    return first ? `${first}${extra}` : '';
  }

  async function applyAction(action, { preserveTurn }) {
    const app = state.app;
    if (!app || !action) return false;
    if (action.kind === 'hex') {
      const game = app.game;
      if (!game || game.winner || game.getCell?.(action.coord) !== null) return false;
      const savedPlayer = game.currentColor;
      game.currentColor = action.player;
      const result = game.play(action.coord, action.player);
      if (!result?.ok) {
        game.currentColor = savedPlayer;
        return false;
      }
      if (preserveTurn && !game.winner) game.currentColor = savedPlayer;
      advanceLegacyAgesAfterAction(action);
      app.render?.();
      return true;
    }
    if (action.kind === 'go') {
      const logic = app.logic;
      const savedPlayer = logic?.currentPlayer;
      if (!logic) return false;
      logic.currentPlayer = action.player;
      const method = logic.__stOriginal_tryPlay || logic.tryPlay?.bind(logic);
      const result = action.pass
        ? (logic.__stOriginal_pass || logic.pass?.bind(logic))?.(action.player)
        : method?.(action.coord, action.player);
      if (!result?.ok) {
        logic.currentPlayer = savedPlayer;
        return false;
      }
      if (preserveTurn && !logic.gameOver) logic.currentPlayer = savedPlayer;
      finishResolvedBoardAction(app, { protectedCoord: action.coord });
      app.updateUI?.();
      return true;
    }
    if (action.kind === 'reversi') {
      const logic = app.logic;
      const savedPlayer = logic?.currentPlayer;
      if (!logic) return false;
      logic.currentPlayer = action.player;
      const result = action.pass
        ? (logic.__stOriginal_pass || logic.pass?.bind(logic))?.(action.player)
        : (logic.__stOriginal_play || logic.play?.bind(logic))?.(action.coord, action.player);
      if (!result?.ok) {
        logic.currentPlayer = savedPlayer;
        return false;
      }
      if (preserveTurn && !logic.gameOver) logic.currentPlayer = savedPlayer;
      finishResolvedBoardAction(app, { protectedCoord: action.coord });
      app.updateUI?.();
      return true;
    }
    if (action.kind === 'jump') {
      const game = app.game;
      if (!game || game.winner || !action.move) return false;
      const savedPlayer = game.currentPlayer;
      const savedTurn = game.turnNumber;
      game.currentPlayer = action.player;
      const legal = game.legalMovesFrom?.(action.move.from, false)?.find((move) =>
        sameCoord(move.to, action.move.to) && (!action.move.type || move.type === action.move.type));
      if (!legal) {
        game.currentPlayer = savedPlayer;
        return false;
      }
      const original = app.__stOriginalApplyJumpMove || app.applyJumpMove?.bind(app);
      const ok = original?.(legal);
      if (!ok) {
        game.currentPlayer = savedPlayer;
        return false;
      }
      if (preserveTurn && !game.winner) {
        game.currentPlayer = savedPlayer;
        game.turnNumber = savedTurn;
      }
      advanceLegacyAgesAfterAction(action);
      app.render?.();
      return true;
    }
    if (action.kind === 'chess') {
      const game = app.activeGame || app;
      const savedPlayer = game.currentPlayer;
      game.currentPlayer = action.player;
      const legal = findChessMove(game, action.from, action.to);
      if (!legal) {
        game.currentPlayer = savedPlayer;
        return false;
      }
      const original = game.__stOriginalApplyMove || game.applyMove?.bind(game);
      const ok = await original?.({ from: clone(action.from), to: clone(action.to), promotion: action.promotion || undefined }, { spacetimeTimeline: true });
      if (!ok) {
        game.currentPlayer = savedPlayer;
        return false;
      }
      if (preserveTurn && !game.gameOver) game.currentPlayer = savedPlayer;
      advanceLegacyAgesAfterAction(action);
      game.renderBoard?.();
      return true;
    }
    return false;
  }

  function captureSnapshot(app) {
    let base = null;
    try {
      if (family === 'hex' && typeof app?.exportState === 'function') base = clone(app.exportState());
      else if (typeof app?.exportState === 'function') base = clone(app.exportState());
      else if (typeof app?.exportNetworkState === 'function') base = clone(app.exportNetworkState());
      else {
        const game = app?.activeGame || app;
        if (typeof game?.getCurrentBoardState === 'function') base = clone(game.getCurrentBoardState());
        else if (typeof game?.network?.createSyncState === 'function') base = clone(game.network.createSyncState());
      }
    } catch (error) {
      console.warn('Could not capture +1D timeline checkpoint.', error);
    }
    return {
      __spaceTimeTimelineSnapshot: true,
      base,
      legacy: captureLegacyClockSnapshot()
    };
  }

  function restoreSnapshot(app, snapshot) {
    if (!snapshot) return false;
    const wrapped = snapshot?.__spaceTimeTimelineSnapshot;
    const baseSnapshot = wrapped ? snapshot.base : snapshot;
    let restored = false;
    try {
      if (family === 'hex' && typeof app?.importState === 'function') {
        app.importState(clone(baseSnapshot));
        restored = true;
      } else if (typeof app?.importState === 'function') {
        app.importState(clone(baseSnapshot));
        restored = true;
      } else if (typeof app?.importNetworkState === 'function') {
        app.importNetworkState(clone(baseSnapshot));
        restored = true;
      } else {
        const game = app?.activeGame || app;
        if (typeof game?.loadBoardState === 'function') {
          game.loadBoardState(clone(baseSnapshot));
          restored = true;
        } else if (typeof game?.network?.applySyncState === 'function') {
          game.network.applySyncState(clone(baseSnapshot), { persist: false });
          restored = true;
        }
      }
    } catch (error) {
      console.warn('Could not restore +1D timeline checkpoint.', error);
      restored = false;
    }
    if (restored) restoreLegacyClockSnapshot(wrapped ? snapshot.legacy : null);
    return restored;
  }

  function captureLegacyClockSnapshot() {
    return {
      decayCount: state.decayCount,
      noiseCount: state.noiseCount,
      jumpAges: [...state.jumpAges.entries()],
      chessAges: [...state.chessAges.entries()],
      hexAges: [...state.hexAges.entries()],
      goPeriodPhases: [...state.goPeriodPhases.entries()]
    };
  }

  function restoreLegacyClockSnapshot(snapshot = null) {
    state.decayCount = Number(snapshot?.decayCount || 0);
    state.noiseCount = Number(snapshot?.noiseCount || 0);
    state.jumpAges = new Map(snapshot?.jumpAges || []);
    state.chessAges = new Map(snapshot?.chessAges || []);
    state.hexAges = new Map(snapshot?.hexAges || []);
    state.goPeriodPhases = new Map(snapshot?.goPeriodPhases || []);
  }

  function finishResolvedBoardAction(app, { protectedCoord = null } = {}) {
    if (!app || !(family === 'go' || family === 'reversi')) return;
    if (typeof app.advanceEvolution === 'function') {
      const protectedList = protectedCoord ? [protectedKeyForStoneApp(app, protectedCoord)] : [];
      app.advanceEvolution(protectedList.filter((value) => value !== null && value !== undefined));
    } else if (typeof app.applyTimeEvolutionAndNoise === 'function') {
      app.applyTimeEvolutionAndNoise();
    }
    try { app.robot?.afterLocalAction?.(); } catch {}
    try { app.lockSettings?.(); } catch {}
  }

  function protectedKeyForStoneApp(app, coord) {
    if (!coord) return null;
    if (layer === '3p1' && family === 'go') return app?.logic?.indexFromCoord?.(coord);
    if (layer === '3p1' && family === 'reversi') return app?.logic?.key?.(coord);
    if (family === 'go') return app?.logic?.indexFromCoord?.(coord);
    if (family === 'reversi') return app?.logic?.key?.(coord);
    return null;
  }

  function advanceLegacyAgesAfterAction(action = {}) {
    if (settings.ageMode !== 'lifetime') {
      if (family === 'hex') syncHexAges(state.app);
      if (family === 'jump') syncJumpAges(state.app);
      if (family === 'chess') syncChessAges(state.app?.activeGame || state.app);
      return;
    }
    if (family === 'hex') ageHexCells(state.app, action.coord);
    if (family === 'jump') ageJumpPieces(state.app, action.move?.to);
    if (family === 'chess') ageChessPieces(state.app?.activeGame || state.app, action.to);
  }

  function syncHexAges(app, { fresh = false } = {}) {
    const cells = hexOccupiedKeys(app);
    const next = new Map();
    for (const key of cells) next.set(key, fresh ? 0 : (state.hexAges.get(key) ?? 0));
    state.hexAges = next;
  }

  function ageHexCells(app, freshCoord = null) {
    const freshKey = Array.isArray(freshCoord) ? freshCoord.join(',') : '';
    const cells = hexOccupiedKeys(app);
    const next = new Map();
    for (const key of cells) next.set(key, key === freshKey ? 0 : (state.hexAges.get(key) ?? 0) + settings.dt);
    state.hexAges = next;
    for (const [key, age] of [...state.hexAges.entries()]) {
      if (age < settings.lifetime) continue;
      const coord = key.split(',').map(Number);
      try {
        app?.game?.setCell?.(coord, null);
        state.hexAges.delete(key);
        state.decayCount += 1;
      } catch {}
    }
  }

  function hexOccupiedKeys(app) {
    const game = app?.game;
    if (!game) return [];
    try {
      return game.topology.coordinates()
        .filter((coord) => game.getCell(coord) !== null)
        .map((coord) => coord.join(','));
    } catch {
      return [];
    }
  }

  function drawHexAgeOverlay(app) {
    if (settings.ageMode !== 'lifetime' || !state.hexAges.size || !app?.canvas) return;
    const ctx = app.canvas.getContext('2d');
    const cells = typeof app.getSpaceTimeCells === 'function' ? app.getSpaceTimeCells() : [];
    if (!ctx || !cells.length) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const cell of cells) {
      const key = cell.key || cell.coordinate?.join(',');
      const age = Number(state.hexAges.get(key) || 0);
      if (age <= 0) continue;
      const radius = Math.max(5, Number(cell.radius || 8) * 1.22);
      const progress = Math.max(0.05, Math.min(1, age / settings.lifetime));
      const remaining = Math.max(0, settings.lifetime - age);
      ctx.strokeStyle = progress >= 0.96 ? 'rgba(255,64,64,1)' : 'rgba(9,120,142,0.96)';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(2.4, radius * 0.14);
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = progress >= 0.96 ? '#7f1d1d' : '#075985';
      ctx.font = `${Math.max(9, radius * 0.72)}px system-ui, sans-serif`;
      ctx.fillText(String(remaining), cell.x, cell.y);
    }
    ctx.restore();
  }

  function drawTimelineOverlay(app = state.app) {
    const overlay = state.replayOverlay || replacementOverlay();
    if (!overlay || !app) {
      updateReplayBadge('');
      return;
    }
    const action = overlay.action;
    const coords = actionCoordinates(action);
    if (!coords.length) {
      updateReplayBadge(overlay.label || '');
      return;
    }
    const badge = overlay.label || describeAction(action);
    updateReplayBadge(state.replayAnimating ? `${text('replaying')}: ${badge}` : badge);
    if (family === 'hex') drawHexTimelineOverlay(app, coords, action);
    else if (family === 'jump') drawJumpTimelineOverlay(app, coords, action);
    else if (family === 'go' || family === 'reversi') drawStoneTimelineOverlay(app, coords, action);
  }

  function replacementOverlay() {
    if (state.pendingReplacement?.replacement) {
      const action = state.pendingReplacement.replacement;
      return { action, label: text('replacementPreview', { action: describeAction(action) }) };
    }
    if (state.replacementSource) {
      return {
        action: { kind: family, player: replacementPlayer(), from: clone(state.replacementSource) },
        label: text('replacement')
      };
    }
    return null;
  }

  function actionCoordinates(action = {}) {
    const coords = [];
    if (action.coord) coords.push(action.coord);
    if (action.from) coords.push(action.from);
    if (action.move?.from) coords.push(action.move.from);
    if (action.move?.over) coords.push(action.move.over);
    if (action.move?.to) coords.push(action.move.to);
    if (action.to) coords.push(action.to);
    return coords.filter(Boolean);
  }

  function describeAction(action = {}) {
    const player = action.player ? `${action.player} ` : '';
    if (action.pass) return `${player}pass`;
    if (action.coord) return `${player}[${formatCoord(action.coord)}]`;
    if (action.move?.from && action.move?.to) return `${player}[${formatCoord(action.move.from)}] -> [${formatCoord(action.move.to)}]`;
    if (action.from && action.to) return `${player}[${formatCoord(action.from)}] -> [${formatCoord(action.to)}]`;
    if (action.from) return `${player}[${formatCoord(action.from)}]`;
    return player.trim() || text('event');
  }

  function formatCoord(coord) {
    if (Array.isArray(coord)) return coord.join(',');
    if (coord && typeof coord === 'object') return Object.values(coord).join(',');
    return String(coord ?? '');
  }

  function drawHexTimelineOverlay(app, coords, action) {
    if (!app?.canvas || typeof app.getSpaceTimeCells !== 'function') return;
    const ctx = app.canvas.getContext('2d');
    const cells = app.getSpaceTimeCells();
    const points = coords
      .map((coord) => cells.find((cell) => sameCoord(cell.coordinate, coord)))
      .filter(Boolean)
      .map((cell) => ({ x: cell.x, y: cell.y, radius: Math.max(8, Number(cell.radius || 8) * 1.35) }));
    drawTimelinePoints(ctx, points, action);
  }

  function drawJumpTimelineOverlay(app, coords, action) {
    if (!app?.canvas || typeof app.project !== 'function') return;
    const ctx = app.ctx || app.canvas.getContext('2d');
    const radius = Math.max(10, Number(app.cellRadius?.() || 12) * 1.15);
    const points = coords.map((coord) => {
      try {
        const point = app.project(coord);
        return { x: point.x, y: point.y, radius };
      } catch {
        return null;
      }
    }).filter(Boolean);
    drawTimelinePoints(ctx, points, action);
  }

  function drawStoneTimelineOverlay(app, coords, action) {
    const canvas = app?.canvas || document.getElementById(family === 'go' ? 'goBoard' : 'reversiBoard') || document.getElementById('goCanvas');
    const ctx = app?.ctx || canvas?.getContext?.('2d');
    if (!canvas || !ctx) return;
    const rect = app?.lastRect || app?.boardRect?.();
    const radius = Math.max(9, Number(rect?.radius || rect?.step || 18) * 0.42);
    const points = coords.map((coord) => pointForStoneCoord(app, coord, rect, radius)).filter(Boolean);
    drawTimelinePoints(ctx, points, action);
  }

  function pointForStoneCoord(app, coord, rect = null, radius = 12) {
    try {
      if (typeof app?.coordToPixel === 'function') {
        const point = app.coordToPixel(coord);
        return point ? { x: point.x, y: point.y, radius } : null;
      }
      if (rect && typeof app?.hexCenter === 'function' && app?.logic?.topology?.lattice === 'honeycomb') {
        return { ...app.hexCenter(coord, rect), radius: Math.max(radius, Number(rect.radius || radius) * 1.15) };
      }
      if (rect && typeof app?.polarCenter === 'function' && app?.logic?.topology?.topology === 'polar') {
        return { ...app.polarCenter(coord, rect), radius };
      }
      if (rect && Array.isArray(coord) && Number.isFinite(rect.left) && Number.isFinite(rect.top) && Number.isFinite(rect.step)) {
        return {
          x: rect.left + (Number(coord[0]) + 0.5) * rect.step,
          y: rect.top + (Number(coord[1]) + 0.5) * rect.step,
          radius
        };
      }
    } catch {}
    return null;
  }

  function drawTimelinePoints(ctx, points, action = {}) {
    if (!ctx || !points.length) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(243,189,73,.9)';
    if (points.length >= 2) {
      ctx.strokeStyle = 'rgba(243,189,73,.96)';
      ctx.lineWidth = Math.max(3, points[0].radius * 0.24);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.stroke();
      drawArrowHead(ctx, points.at(-2), points.at(-1), points[0].radius);
    }
    points.forEach((point, index) => {
      const isLast = index === points.length - 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = isLast ? 'rgba(243,189,73,.24)' : 'rgba(86,190,222,.22)';
      ctx.fill();
      ctx.strokeStyle = isLast ? 'rgba(255,231,173,1)' : 'rgba(125,225,255,.98)';
      ctx.lineWidth = Math.max(2.4, point.radius * 0.18);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = isLast ? '#fff0bd' : '#dff8ff';
      ctx.font = `${Math.max(11, point.radius * 0.78)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(points.length >= 2 ? (isLast ? '2' : index === 0 ? '1' : '+') : '!', point.x, point.y);
      ctx.shadowBlur = 12;
    });
    ctx.restore();
  }

  function drawArrowHead(ctx, from, to, radius) {
    if (!from || !to) return;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = Math.max(7, radius * 0.45);
    ctx.fillStyle = 'rgba(243,189,73,.96)';
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - Math.cos(angle - Math.PI / 6) * size, to.y - Math.sin(angle - Math.PI / 6) * size);
    ctx.lineTo(to.x - Math.cos(angle + Math.PI / 6) * size, to.y - Math.sin(angle + Math.PI / 6) * size);
    ctx.closePath();
    ctx.fill();
  }

  function updateReplayBadge(label = '') {
    let badge = document.getElementById('spaceTimeReplayBadge');
    if (!label) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'spaceTimeReplayBadge';
      badge.className = 'st-replay-badge';
      document.body.append(badge);
    }
    badge.textContent = label;
  }

  function syncJumpAges(app, { fresh = false } = {}) {
    const pieces = app?.game?.pieces;
    if (!(pieces instanceof Map)) return;
    const next = new Map();
    for (const key of pieces.keys()) next.set(key, fresh ? 0 : (state.jumpAges.get(key) ?? 0));
    state.jumpAges = next;
  }

  function ageJumpPieces(app, freshTo = null) {
    const pieces = app?.game?.pieces;
    if (!(pieces instanceof Map)) return;
    const freshKey = Array.isArray(freshTo) ? freshTo.join(',') : '';
    const next = new Map();
    for (const key of pieces.keys()) {
      const age = key === freshKey ? 0 : (state.jumpAges.get(key) ?? 0) + settings.dt;
      next.set(key, age);
    }
    state.jumpAges = next;
    for (const [key, age] of [...state.jumpAges.entries()]) {
      if (age >= settings.lifetime) {
        pieces.delete(key);
        app.game?.labels?.delete?.(key);
        state.jumpAges.delete(key);
        state.decayCount += 1;
      }
    }
    app?.game?.checkWinner?.();
  }

  function drawJumpAgeOverlay(app) {
    if (!app?.canvas || !app?.ctx || !(app?.game?.pieces instanceof Map)) return;
    if (settings.ageMode !== 'lifetime') return;
    const ctx = app.ctx;
    const radius = app.cellRadius?.() || 12;
    ctx.save();
    ctx.font = `${Math.max(10, radius * 0.72)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const key of app.game.pieces.keys()) {
      const coord = key.split(',').map(Number);
      if (app.visibleCoord && !app.visibleCoord(coord)) continue;
      const age = Number(state.jumpAges.get(key) || 0);
      if (age <= 0) continue;
      const point = app.project?.(coord);
      if (!point) continue;
      const progress = Math.max(0.05, Math.min(1, age / settings.lifetime));
      const remaining = Math.max(0, settings.lifetime - age);
      ctx.strokeStyle = progress >= 0.96 ? 'rgba(255,64,64,1)' : 'rgba(125,255,255,1)';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 14;
      ctx.lineWidth = Math.max(3, radius * 0.16);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * 1.18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = progress >= 0.96 ? '#ffe1e1' : '#e0f2fe';
      ctx.fillText(String(remaining), point.x, point.y + radius * 1.55);
    }
    ctx.restore();
  }

  function collectChessPieces(game) {
    const board = Array.isArray(game?.board) ? game.board : null;
    const out = [];
    if (!board) return out;
    for (let a = 0; a < board.length; a += 1) {
      const row = board[a];
      if (!Array.isArray(row)) continue;
      for (let b = 0; b < row.length; b += 1) {
        const cell = row[b];
        if (Array.isArray(cell)) {
          for (let c = 0; c < cell.length; c += 1) {
            if (cell[c] && typeof cell[c] === 'object' && 'color' in cell[c]) out.push({ key: `${a},${b},${c}`, piece: cell[c], set: (value) => { cell[c] = value; } });
          }
        } else if (cell && typeof cell === 'object' && 'color' in cell) {
          out.push({ key: `${a},${b}`, piece: cell, set: (value) => { row[b] = value; } });
        }
      }
    }
    return out;
  }

  function syncChessAges(game, { fresh = false } = {}) {
    const next = new Map();
    for (const item of collectChessPieces(game)) next.set(item.key, fresh ? 0 : (state.chessAges.get(item.key) ?? 0));
    state.chessAges = next;
  }

  function ageChessPieces(game, freshTo = null) {
    const freshKey = chessKeyFromMoveTarget(freshTo);
    const pieces = collectChessPieces(game);
    const next = new Map();
    for (const item of pieces) next.set(item.key, item.key === freshKey ? 0 : (state.chessAges.get(item.key) ?? 0) + settings.dt);
    state.chessAges = next;
    for (const item of pieces) {
      const age = state.chessAges.get(item.key) || 0;
      if (age >= settings.lifetime) {
        item.set(null);
        state.chessAges.delete(item.key);
        state.decayCount += 1;
      }
    }
    try { game?.renderer?.renderPieces3D?.(game.board); } catch {}
  }

  function renderChessAgeRings(game) {
    const boardEl = document.getElementById('chessboard');
    if (settings.ageMode !== 'lifetime' || !boardEl || !state.chessAges.size) return;
    boardEl.querySelectorAll('.st-piece-age-ring,.st-piece-age-label').forEach((node) => node.remove());
    const squares = [...boardEl.querySelectorAll('.square')];
    for (const [key, age] of state.chessAges.entries()) {
      const parts = key.split(',').map(Number);
      if (parts.length !== 2 || age <= 0) continue;
      const [r, c] = parts;
      const square = squares[r * 8 + c];
      if (!square) continue;
      square.style.position = square.style.position || 'relative';
      const progress = Math.max(0.05, Math.min(1, age / settings.lifetime));
      const ring = document.createElement('span');
      ring.className = `st-piece-age-ring${progress >= 0.96 ? ' near-death' : ''}`;
      square.appendChild(ring);
      const label = document.createElement('span');
      label.className = 'st-piece-age-label';
      label.textContent = String(Math.max(0, settings.lifetime - age));
      square.appendChild(label);
    }
  }

  function chessKeyFromMoveTarget(target = null) {
    if (!target) return '';
    if ('x' in target || 'z' in target || 'sheet' in target) {
      return `${Number(target.z ?? target.sheet ?? 0) || 0},${Number(target.y) || 0},${Number(target.x) || 0}`;
    }
    return `${Number(target.r) || 0},${Number(target.c) || 0}`;
  }

  function isGoPeriodVisible(app, index, coord = null) {
    if (!isGoPeriodEnabled()) return true;
    const key = goPeriodKey(app, index, coord);
    const cycle = goPeriodCycle();
    if (!state.goPeriodPhases.has(key)) state.goPeriodPhases.set(key, stablePhaseForKey(key, cycle));
    const phase = state.goPeriodPhases.get(key) % cycle;
    const age = goAgeForIndex(app, index, coord);
    return ((age + phase) % cycle) < Math.max(1, settings.periodOn);
  }

  function goPeriodKey(app, index, coord = null) {
    if (Array.isArray(coord)) return coord.join(',');
    try {
      if (app?.logic?.coordFromIndex) return app.logic.coordFromIndex(index).join(',');
    } catch {}
    return String(index);
  }

  function goAgeForIndex(app, index, coord = null) {
    if (Array.isArray(app?.pieceAges)) return Number(app.pieceAges[index] || 0);
    const key = goPeriodKey(app, index, coord);
    return Number(app?.stoneAges?.[key] || 0);
  }

  function stablePhaseForKey(key, cycle) {
    let hash = 0;
    for (const character of String(key)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return hash % Math.max(1, cycle);
  }

  function legacySummaryEntries() {
    const entries = [];
    if (family === 'go') {
      entries.push([text('periodMode'), settings.periodMode === 'periodic'
        ? `${text('periodOnMode')} ${settings.periodOn}/${settings.periodOff}`
        : text('periodOffMode')]);
    }
    entries.push(
      [text('ageMode'), settings.ageMode === 'lifetime'
        ? `${text('ageLifetime')} ${settings.lifetime}, ${text('oldAge')} ${settings.oldAge}`
        : text('ageOff')],
      [text('dt'), settings.dt],
      [text('legacySummary'), `${language() === 'zh' ? '平均年齡' : 'Average age'} ${averageAge().toFixed(1)} · ${language() === 'zh' ? '消失' : 'decayed'} ${state.decayCount}`]
    );
    return entries;
  }

  function averageAge() {
    if (state.hexAges.size) return [...state.hexAges.values()].reduce((sum, value) => sum + Number(value || 0), 0) / state.hexAges.size;
    if (state.jumpAges.size) return [...state.jumpAges.values()].reduce((sum, value) => sum + Number(value || 0), 0) / state.jumpAges.size;
    if (state.chessAges.size) return [...state.chessAges.values()].reduce((sum, value) => sum + Number(value || 0), 0) / state.chessAges.size;
    const app = state.app;
    if (Array.isArray(app?.pieceAges) || ArrayBuffer.isView(app?.pieceAges)) {
      const values = [...app.pieceAges].map(Number).filter((value) => value > 0);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    }
    const ages = app?.stoneAges || app?.pieceAges;
    if (ages && typeof ages === 'object') {
      const values = Object.values(ages).map(Number).filter((value) => value > 0);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    }
    return 0;
  }

  function canEdit(event, setMessage = false) {
    const conflict = editabilityConflict(event);
    if (conflict) {
      if (setMessage) state.message = conflictText(conflict);
      return false;
    }
    return true;
  }

  function editabilityConflict(event) {
    if (!usesPast() || !event || event.status !== 'resolved' || event.obsolete) {
      return makeConflict({ eventId: event?.id, tick: event?.tick, severity: 'hard', reasonCode: 'setup_event', resolution: 'reject_rewrite', action: event?.action });
    }
    if (gameEnded()) {
      return makeConflict({ eventId: event.id, tick: event.tick, severity: 'hard', reasonCode: 'game_ended', resolution: 'reject_rewrite', action: event.action });
    }
    if (currentTick() - event.tick > settings.rewriteWindow) {
      return makeConflict({ eventId: event.id, tick: event.tick, severity: 'hard', reasonCode: 'outside_window', resolution: 'reject_rewrite', action: event.action });
    }
    if (event.player !== currentPlayer(state.app)) {
      return makeConflict({ eventId: event.id, tick: event.tick, severity: 'hard', reasonCode: 'opponent_event', resolution: 'reject_rewrite', action: event.action });
    }
    return null;
  }

  function canChangePending(action, setMessage = false) {
    if (!usesFuture() || !action || action.status !== 'pending' || action.cancelled || action.failed || action.obsolete || action.rewritten) {
      if (setMessage) state.message = text('pendingLocked');
      return false;
    }
    if (gameEnded()) {
      if (setMessage) state.message = text('gameEnded');
      return false;
    }
    if (Number(action.resolveTick) <= currentTick()) {
      if (setMessage) state.message = text('pendingLocked');
      return false;
    }
    if (action.player !== currentPlayer(state.app)) {
      if (setMessage) state.message = text('pendingPlayerOnly');
      return false;
    }
    return true;
  }

  function replacementPlayer() {
    return state.timeline.find((event) => event.id === state.editingEventId)?.player || currentPlayer(state.app);
  }

  function gameEnded() {
    const app = state.app;
    return Boolean(app?.logic?.gameOver || app?.game?.winner || app?.gameOver || app?.activeGame?.gameOver);
  }

  function isOnline() {
    const select = document.querySelector('#gameMode,#gameModeSelect,#modeSelect,[data-game-mode]');
    return select?.value === 'online' || Boolean(state.app?.network?.isConnected);
  }

  function isOnlinePastMode() {
    if (!usesPast() || !isOnline()) return false;
    state.message = text(settings.mode === 'past_future' ? 'onlineBoth' : 'online');
    return true;
  }

  function currentPlayer(app) {
    if (family === 'hex') return app?.game?.currentColor || 'black';
    if (family === 'jump') return app?.game?.currentPlayer || 'A';
    if (family === 'chess') return app?.activeGame?.currentPlayer || app?.currentPlayer || 'white';
    return app?.logic?.currentPlayer || 'black';
  }

  function observedTurn(app) {
    return Number(app?.logic?.moveNumber ?? app?.logic?.moveHistory?.length ?? app?.game?.turnNumber ??
      app?.game?.moveNumber ?? app?.activeGame?.moveHistory?.length ?? app?.moveHistory?.length ?? 0) || 0;
  }

  function playerTurnSpan() {
    if (family === 'jump') {
      return Math.max(2, Number(state.app?.game?.playerCount || state.app?.playerCount || 2) || 2);
    }
    return 2;
  }

  function currentTick() {
    state.tick = Math.max(state.tick, observedTurn(state.app));
    return state.tick;
  }

  function coordFromEvent(app, event) {
    try {
      return app.coordFromEvent?.(event) || app.pixelToCoord?.(event) || app.pickCoord?.(event) ||
        app.renderer?.pickCoord?.(event) || null;
    } catch {
      return null;
    }
  }

  function plainMove(move = {}) {
    return {
      type: move.type || null,
      from: clone(move.from),
      to: clone(move.to),
      over: clone(move.over),
      direction: clone(move.direction),
      id: move.id
    };
  }

  function findChessMove(game, from, to) {
    if (!from || !to || typeof game?.getLegalMoves !== 'function') return null;
    const args = 'r' in from ? [from.r, from.c] : [from.x, from.y, from.sheet ?? from.z ?? 0];
    return (game.getLegalMoves(...args) || []).find((move) => chessCoordEqual(move, to)) || null;
  }

  function chessCoordEqual(a = {}, b = {}) {
    if ('r' in a || 'r' in b) return Number(a.r) === Number(b.r) && Number(a.c) === Number(b.c);
    return Number(a.x) === Number(b.x) && Number(a.y) === Number(b.y) &&
      Number(a.sheet ?? a.z ?? 0) === Number(b.sheet ?? b.z ?? 0);
  }

  function getChessPiece(game, coord) {
    if ('r' in coord) return game.getPiece?.(coord.r, coord.c) || game.board?.[coord.r]?.[coord.c] || null;
    const z = coord.sheet ?? coord.z ?? 0;
    return game.getPiece?.(coord.x, coord.y, z) || game.board?.[z]?.[coord.y]?.[coord.x] || null;
  }

  function clearChessSelection(game) {
    game.selectedSquare = null;
    game.legalMoves = [];
    game.pendingMoveTarget = null;
    game.renderBoard?.();
    game.renderer?.clearHighlights?.();
  }

  function clearPendingSelection() {
    const app = state.app;
    if (family === 'jump') {
      app.selected = null;
      app.legal = [];
      if (app.game) app.game.selected = null;
    }
    if (family === 'chess') clearChessSelection(app.activeGame || app);
    triggerRender();
  }

  function resetTimeline() {
    if (state.internalAction) return;
    state.tick = observedTurn(state.app);
    state.pending = [];
    state.timeline = [];
    state.failures = [];
    state.rewrittenEvents = [];
    state.cancelledEvents = [];
    state.conflicts = [];
    state.editingEventId = null;
    state.replacementSource = null;
    state.pendingReplacement = null;
    state.previewReturnSnapshot = null;
    state.replayOverlay = null;
    state.replayAnimating = false;
    state.settingsLocked = false;
    state.decayCount = 0;
    state.noiseCount = 0;
    state.goPeriodPhases = new Map();
    if (family === 'hex') syncHexAges(state.app, { fresh: true });
    if (family === 'jump') syncJumpAges(state.app, { fresh: true });
    if (family === 'chess') syncChessAges(state.app?.activeGame || state.app, { fresh: true });
    state.initialSnapshot = captureSnapshot(state.app);
    state.lastSnapshot = clone(state.initialSnapshot);
    state.message = text('reset');
    updateReplayBadge('');
    refresh();
  }

  function triggerRender() {
    const app = state.app;
    try { app?.updateUI?.(); } catch {}
    try { app?.render?.(); } catch {}
    try { app?.renderBoard?.(); } catch {}
    try { app?.activeGame?.renderBoard?.(); } catch {}
    try { app?.activeGame?.renderer?.render?.(); } catch {}
    try { drawTimelineOverlay(app); } catch {}
  }

  function refresh() {
    let mode = sanitizeMode(settings.mode);
    if (mode !== settings.mode) settings.mode = mode;
    if (mode === 'periodic' && !supportsPeriodMode()) {
      settings.mode = 'future';
      mode = 'future';
    }
    if (mode === 'age' && !supportsAgeMode()) {
      settings.mode = 'future';
      settings.ageMode = 'off';
      mode = 'future';
    }
    const future = mode === 'future' || mode === 'past_future';
    const past = mode === 'past' || mode === 'past_future';
    panel.querySelector('[data-st-title]').textContent = `${dimensionLabel} ${text('title')}`;
    panel.querySelector('[data-st-intro]').textContent = text('intro');
    panel.querySelectorAll('[data-st-label]').forEach((node) => { node.textContent = text(node.dataset.stLabel); });
    const modeSelect = panel.querySelector('[data-st-mode]');
    modeSelect.options[0].textContent = text('future');
    modeSelect.options[1].textContent = text('past');
    modeSelect.options[2].textContent = text('both');
    modeSelect.options[3].textContent = text('ageModeChoice');
    modeSelect.options[4].textContent = text('periodModeChoice');
    modeSelect.options[3].hidden = !supportsAgeMode();
    modeSelect.options[3].disabled = !supportsAgeMode();
    modeSelect.options[4].hidden = !supportsPeriodMode();
    modeSelect.options[4].disabled = !supportsPeriodMode();
    modeSelect.value = settings.mode;
    panel.querySelector('[data-st-period-mode] option[value="off"]').textContent = text('periodOffMode');
    panel.querySelector('[data-st-period-mode] option[value="periodic"]').textContent = text('periodOnMode');
    panel.querySelector('[data-st-age-mode] option[value="off"]').textContent = text('ageOff');
    panel.querySelector('[data-st-age-mode] option[value="lifetime"]').textContent = text('ageLifetime');
    panel.querySelector('[data-st-noise-mode] option[value="off"]').textContent = text('noiseOff');
    panel.querySelector('[data-st-noise-mode] option[value="pieces"]').textContent = text('noisePieces');
    panel.querySelector('[data-st-noise-mode] option[value="board"]').textContent = text('noiseBoard');
    panel.querySelector('[data-st-period-mode]').value = settings.periodMode;
    panel.querySelector('[data-st-period-on]').value = String(settings.periodOn);
    panel.querySelector('[data-st-period-off]').value = String(settings.periodOff);
    panel.querySelector('[data-st-dt]').value = String(settings.dt);
    panel.querySelector('[data-st-age-mode]').value = settings.ageMode;
    panel.querySelector('[data-st-lifetime]').value = String(settings.lifetime);
    panel.querySelector('[data-st-old-age]').value = String(settings.oldAge);
    panel.querySelector('[data-st-noise-mode]').value = settings.noiseMode;
    panel.querySelector('[data-st-noise-rate]').value = String(settings.noiseRate);
    panel.querySelector('[data-st-noise-period]').value = String(settings.noisePeriod);
    populateActionOffsetOptions();
    panel.querySelector('[data-st-action-offset]').value = String(Math.min(settings.actionOffset, settings.delay));
    panel.querySelector('[data-st-conflict] option[value="strict"]').textContent = text('reject');
    panel.querySelector('[data-st-conflict] option[value="fail_forward"]').textContent = text('skip');
    panel.querySelector('[data-st-conflict]').value = normalizeConflictPolicy(settings.conflictPolicy);
    const windowSelect = panel.querySelector('[data-st-window]');
    for (const option of windowSelect.options) {
      option.textContent = option.value === 'custom'
        ? (language() === 'zh' ? '自訂' : 'Custom')
        : `${option.value} ${language() === 'zh' ? '回合' : 'ticks'}`;
    }
    const helpKey = mode === 'future'
      ? 'futureHelp'
      : mode === 'past'
        ? 'pastHelp'
        : mode === 'past_future'
          ? 'bothHelp'
          : mode === 'age'
            ? 'ageHelp'
            : 'periodHelp';
    panel.querySelector('[data-st-help]').textContent = text(helpKey);
    panel.querySelector('[data-st-legacy-title]').textContent = text(mode === 'periodic' ? 'legacyTitle' : 'ageOnlyTitle');
    panel.querySelector('[data-st-legacy-help]').textContent = text(mode === 'periodic' ? 'legacyHelp' : 'ageOnlyHelp');
    panel.querySelector('[data-st-apply]').textContent = text('apply');
    panel.querySelector('[data-st-apply-rewrite]').textContent = text('applyRewrite');
    panel.querySelector('[data-st-cancel-rewrite]').textContent = text('cancelRewrite');
    panel.querySelector('[data-st-pending-title]').textContent = text('pending');
    panel.querySelector('[data-st-history-title]').textContent = text(past ? 'editableHistory' : 'history');
    panel.querySelectorAll('[data-st-future]').forEach((node) => { node.hidden = !future; });
    panel.querySelectorAll('[data-st-past]').forEach((node) => { node.hidden = !past; });
    panel.querySelector('[data-st-custom]').hidden = !past || panel.querySelector('[data-st-window]').value !== 'custom';
    panel.querySelectorAll('[data-st-go-period]').forEach((node) => { node.hidden = true; });
    panel.querySelectorAll('[data-st-age-choice]').forEach((node) => { node.hidden = true; });
    panel.querySelectorAll('[data-st-period-control]').forEach((node) => { node.hidden = !supportsPeriodMode() || mode !== 'periodic'; });
    panel.querySelectorAll('[data-st-age-control]').forEach((node) => { node.hidden = !supportsAgeMode() || mode !== 'age'; });
    panel.querySelectorAll('[data-st-noise]').forEach((node) => { node.hidden = !allowsNoise; });
    panel.querySelector('[data-st-legacy-section]').hidden = !(mode === 'age' || mode === 'periodic');
    panel.querySelector('[data-st-pending-section]').hidden = !future;
    panel.querySelector('[data-st-history-section]').hidden = false;
    const online = panel.querySelector('[data-st-online]');
    online.hidden = !(past && isOnline());
    online.textContent = text('online');
    const message = panel.querySelector('[data-st-message]');
    message.hidden = !state.message && !state.editingEventId;
    message.textContent = state.editingEventId ? `${text('dryRunReplay')}: ${state.message || text('replacementHelp')}` : state.message;
    const rewriteActions = panel.querySelector('[data-st-rewrite-actions]');
    rewriteActions.hidden = !state.editingEventId;
    panel.querySelector('[data-st-apply-rewrite]').disabled = !state.pendingReplacement;
    for (const selector of [
      '[data-st-mode]',
      '[data-st-delay]',
      '[data-st-action-offset]',
      '[data-st-window]',
      '[data-st-custom-window]',
      '[data-st-conflict]',
      '[data-st-period-mode]',
      '[data-st-period-on]',
      '[data-st-period-off]',
      '[data-st-dt]',
      '[data-st-age-mode]',
      '[data-st-lifetime]',
      '[data-st-old-age]',
      '[data-st-noise-mode]',
      '[data-st-noise-rate]',
      '[data-st-noise-period]'
    ]) {
      panel.querySelector(selector).disabled = state.settingsLocked;
    }
    panel.querySelector('[data-st-window]').title = state.settingsLocked ? text('locked') : '';
    renderLegacySummary();
    renderPending();
    renderTimeline();
  }

  function renderLegacySummary() {
    const host = panel.querySelector('[data-st-legacy-summary]');
    if (!host) return;
    host.innerHTML = legacySummaryEntries().map(([label, value]) =>
      `<span><strong>${escapeHTML(label)}:</strong> ${escapeHTML(value)}</span>`).join('');
  }

  function renderPending() {
    const host = panel.querySelector('[data-st-pending-list]');
    const activePending = state.pending.filter((action) => action.status === 'pending');
    if (!activePending.length) {
      host.innerHTML = `<span class="st-timeline__empty">${escapeHTML(text('emptyPending'))}</span>`;
      return;
    }
    host.innerHTML = activePending.map((action) => {
      const editable = canChangePending(action);
      return `
        <div class="st-timeline__event">
          <span><strong>${escapeHTML(text('scheduled'))}</strong> · ${escapeHTML(text('resolveTick'))} ${action.resolveTick}</span>
          ${settings.mode === 'past_future' ? `<div class="st-timeline__event-actions">
            <button type="button" data-st-reschedule="${action.id}" data-st-delta="-1" ${editable ? '' : 'disabled'}>${escapeHTML(text('earlier'))}</button>
            <button type="button" data-st-reschedule="${action.id}" data-st-delta="1" ${editable ? '' : 'disabled'}>${escapeHTML(text('later'))}</button>
            <button type="button" data-st-cancel="${action.id}" ${editable ? '' : 'disabled'}>${escapeHTML(text('cancel'))}</button>
          </div>` : ''}
        </div>`;
    }).join('');
  }

  function renderTimeline() {
    const host = panel.querySelector('[data-st-history-list]');
    const past = usesPast();
    const resolved = state.timeline.filter((event) => event.status === 'resolved' && !event.failed && !event.obsolete)
      .sort((a, b) => b.tick - a.tick);
    const editable = resolved.filter((event) => past && canEdit(event));
    const frozen = resolved.filter((event) => past && !canEdit(event));
    const failed = [
      ...state.timeline.filter((event) => event.status === 'failed' || event.failed),
      ...state.failures.filter((event) => (event.status || 'failed') === 'failed')
    ].map(normalizeHistoryItem).sort((a, b) => b.tick - a.tick);
    const obsolete = [
      ...state.timeline.filter((event) => event.status === 'obsolete' || event.obsolete),
      ...state.failures.filter((event) => event.status === 'obsolete' || event.obsolete)
    ].map(normalizeHistoryItem).sort((a, b) => b.tick - a.tick);
    const rewritten = (state.rewrittenEvents || []).map(normalizeHistoryItem).sort((a, b) => b.tick - a.tick);
    const cancelled = (state.cancelledEvents || []).map(normalizeHistoryItem).sort((a, b) => b.tick - a.tick);
    const sections = [];
    if (past) {
      sections.push(renderTimelineGroup(text('editableHistory'), editable, 'editable'));
      sections.push(renderTimelineGroup(text('frozenHistory'), frozen, 'resolved'));
    } else {
      sections.push(renderTimelineGroup(text('resolvedEvents'), resolved, 'resolved'));
    }
    sections.push(renderTimelineGroup(text('failedEvents'), failed, 'failed'));
    sections.push(renderTimelineGroup(text('obsoleteEvents'), obsolete, 'obsolete'));
    sections.push(renderTimelineGroup(text('rewrittenEvents'), rewritten, 'rewritten'));
    sections.push(renderTimelineGroup(text('cancelledEvents'), cancelled, 'cancelled'));
    if (state.conflicts.length) {
      sections.push(renderConflictGroup());
    }
    const html = sections.filter(Boolean).join('');
    if (!html) {
      host.innerHTML = `<span class="st-timeline__empty">${escapeHTML(text('emptyHistory'))}</span>`;
      return;
    }
    host.innerHTML = html;
  }

  function renderTimelineGroup(title, events, status) {
    if (!events.length) return '';
    return `<div class="st-timeline__group"><div class="st-timeline__group-title">${escapeHTML(title)}</div>${
      events.map((event) => renderTimelineEvent(event, status)).join('')
    }</div>`;
  }

  function renderTimelineEvent(event, status) {
    const statusText = status === 'failed'
      ? text('failed')
      : status === 'obsolete'
        ? text('obsoleteEvents')
        : status === 'rewritten'
          ? text('rewrittenEvents')
          : status === 'cancelled'
            ? text('cancel')
            : text('resolved');
    const conflicts = (event.conflicts || []).map(conflictText).filter(Boolean).join(' ');
    const label = `${statusText} · ${text('tick')} ${event.tick} · ${actionPublicLabel(event.action)}${conflicts ? ` · ${conflicts}` : ''}`;
    const className = `st-timeline__event${state.editingEventId === event.id ? ' st-timeline__replacement' : ''} is-${status}`;
    return `<div class="${className}">
      <span>${escapeHTML(label)}</span>
    </div>`;
  }

  function renderConflictGroup() {
    const conflicts = state.conflicts.slice(-10).reverse();
    return `<div class="st-timeline__group"><div class="st-timeline__group-title">${escapeHTML(text('conflicts'))}</div>${
      conflicts.map((conflict) => {
        const label = `${conflict.severity} · ${text('tick')} ${conflict.tick} · ${conflictText(conflict)}`;
        return `<div class="st-timeline__event is-conflict"><span>${escapeHTML(label)}</span></div>`;
      }).join('')
    }</div>`;
  }

  function normalizeHistoryItem(item) {
    return {
      ...item,
      tick: item.tick ?? item.failedTick ?? item.cancelledTick ?? item.resolveTick ?? 0,
      action: item.action || stripTimelineFields(item)
    };
  }

  function actionPublicLabel(action) {
    if (action.pass) return language() === 'zh' ? '跳過回合' : 'Pass';
    if (action.kind === 'jump') return `${action.move?.from?.join(',')} → ${action.move?.to?.join(',')}`;
    if (action.kind === 'chess') return `${coordLabel(action.from)} → ${coordLabel(action.to)}`;
    const kindLabel = action.kind === 'hex' ? (language() === 'zh' ? '六貫棋' : 'Hex') : action.kind;
    return `${kindLabel} ${action.coord?.join(',') || ''}`.trim();
  }

  function coordLabel(coord = {}) {
    if ('r' in coord) return `${coord.r},${coord.c}`;
    return `${coord.x},${coord.y},${coord.sheet ?? coord.z ?? 0}`;
  }

  function relativeRoot() {
    return pathname.includes('/2d/') || pathname.includes('/3d/') || pathname.includes('/4d/') ? '../../' : '../';
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  return { settings, state, panel };
}
