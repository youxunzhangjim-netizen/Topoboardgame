(() => {
  const params = new URLSearchParams(window.location.search || '');
  const rawLayer = params.get('spacetime') || params.get('dimension') || '';
  const pathname = window.location.pathname.toLowerCase();
  const isTwoDPath = pathname.includes('/2d/');
  const isThreeDPath = pathname.includes('/3d/');
  const layer = rawLayer === '3p1' || rawLayer === '3+1' || rawLayer === '3d+1' || rawLayer === '3' || (rawLayer === '1' && isThreeDPath)
    ? '3p1'
    : rawLayer === '2p1' || rawLayer === '2+1' || rawLayer === '2d+1' || rawLayer === '2' || (rawLayer === '1' && isTwoDPath)
      ? '2p1'
      : '';
  if (!layer) return;

  const FAMILY_BY_PATH = [
    ['2dchess', 'chess'], ['3dchess', 'chess'],
    ['2dgo', 'go'], ['3dgo', 'go'],
    ['2dreversi', 'reversi'], ['3dreversi', 'reversi'],
    ['/jump', 'jump']
  ];
  const family = params.get('family') || FAMILY_BY_PATH.find(([needle]) => pathname.includes(needle))?.[1] || 'game';
  const dimensionLabel = layer === '3p1' ? '3+1D' : '2+1D';
  const storageKey = `topoboardgame.spacetime.${layer}.${family}.settings`;
  const allowsNoise = family === 'go' || family === 'reversi';
  const isJump = family === 'jump';
  const isChess = family === 'chess';
  const explicitTimeMode = params.get('timeMode') || params.get('time') || '';
  const settingsVersion = 4;

  const defaultMaxDelay = readNumber(params.get('delay'), 2, 1, 32);
  const DEFAULTS = {
    settingsVersion,
    timeMode: normalizeTimeMode(explicitTimeMode || 'delay'),
    ageMode: params.get('ageMode') === 'lifetime' || explicitTimeMode === 'decay' ? 'lifetime' : 'off',
    delay: defaultMaxDelay,
    actionDelay: readNumber(params.get('actionDelay'), 0, 0, defaultMaxDelay),
    period: readNumber(params.get('period') || params.get('frequency'), 4, 1, 32),
    periodOn: readNumber(params.get('periodOn'), 2, 1, 32),
    periodOff: readNumber(params.get('periodOff'), 2, 1, 32),
    lifetime: readNumber(params.get('lifetime'), 50, 1, 512),
    oldAge: readNumber(params.get('oldAge'), 40, 1, 512),
    dt: readNumber(params.get('dt'), 1, 1, 16),
    noiseMode: allowsNoise ? (params.get('noiseMode') || 'off') : 'off',
    noiseRate: allowsNoise ? readNumber(params.get('noiseRate'), 0.04, 0, 1) : 0,
    noisePeriod: allowsNoise ? readNumber(params.get('noisePeriod'), 6, 1, 256) : 1
  };

  const settings = loadSettings();
  const state = {
    app: null,
    patchName: '',
    turn: 0,
    decayCount: 0,
    noiseCount: 0,
    scheduledCount: 0,
    scheduledActions: [],
    lastApplyMessage: '',
    jumpAges: new Map(),
    chessAges: new Map(),
    pendingDelayAction: null,
    schedulePopover: null,
    goPeriodPhases: new Map()
  };

  const panel = installPanel();
  installStyle();
  refreshPanel();
  waitForGameApp().then((app) => {
    state.app = app;
    applyNoTimerDefault(app);
    patchGame(app);
    readSettingsFromControls();
    writeSettingsToURL(false);
    refreshPanel();
    triggerRender(app);
  });

  function readNumber(value, fallback, min, max) {
    if (value === null || value === undefined || value === '') return fallback;
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function normalizeTimeMode(value) {
    const mode = String(value || '').toLowerCase();
    if (mode === 'periodic' || mode === 'period') return family === 'go' ? 'periodic' : 'delay';
    return 'delay';
  }

  function normalizeAgeMode(value) {
    return String(value || '').toLowerCase() === 'lifetime' ? 'lifetime' : 'off';
  }

  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const merged = { ...DEFAULTS, ...stored, noiseMode: allowsNoise ? (stored.noiseMode || DEFAULTS.noiseMode) : 'off' };
      merged.timeMode = normalizeTimeMode(merged.timeMode);
      merged.ageMode = normalizeAgeMode(merged.ageMode || (stored.timeMode === 'decay' ? 'lifetime' : DEFAULTS.ageMode));
      if (stored.settingsVersion !== settingsVersion) {
        if (!params.has('lifetime')) merged.lifetime = DEFAULTS.lifetime;
        if (!params.has('oldAge')) merged.oldAge = DEFAULTS.oldAge;
        if (!params.has('periodOn')) merged.periodOn = DEFAULTS.periodOn;
        if (!params.has('periodOff')) merged.periodOff = DEFAULTS.periodOff;
      }
      applyURLSettingOverrides(merged);
      merged.settingsVersion = settingsVersion;
      return merged;
    } catch {
      const merged = { ...DEFAULTS };
      applyURLSettingOverrides(merged);
      return merged;
    }
  }

  function applyURLSettingOverrides(target) {
    if (explicitTimeMode) {
      target.timeMode = normalizeTimeMode(explicitTimeMode);
      if (explicitTimeMode === 'decay') target.ageMode = 'lifetime';
    }
    if (params.has('ageMode')) target.ageMode = normalizeAgeMode(params.get('ageMode'));
    if (params.has('delay')) target.delay = readNumber(params.get('delay'), target.delay, 1, 32);
    if (params.has('actionDelay')) target.actionDelay = readNumber(params.get('actionDelay'), target.actionDelay, 0, target.delay);
    if (params.has('period') || params.has('frequency')) target.period = readNumber(params.get('period') || params.get('frequency'), target.period, 1, 32);
    if (params.has('periodOn')) target.periodOn = readNumber(params.get('periodOn'), target.periodOn, 1, 32);
    if (params.has('periodOff')) target.periodOff = readNumber(params.get('periodOff'), target.periodOff, 1, 32);
    if (params.has('lifetime')) target.lifetime = readNumber(params.get('lifetime'), target.lifetime, 1, 512);
    if (params.has('oldAge')) target.oldAge = readNumber(params.get('oldAge'), target.oldAge, 1, 512);
    if (params.has('dt')) target.dt = readNumber(params.get('dt'), target.dt, 1, 16);
    if (allowsNoise && params.has('noiseMode')) target.noiseMode = params.get('noiseMode') || target.noiseMode;
    if (allowsNoise && params.has('noiseRate')) target.noiseRate = readNumber(params.get('noiseRate'), target.noiseRate, 0, 1);
    if (allowsNoise && params.has('noisePeriod')) target.noisePeriod = readNumber(params.get('noisePeriod'), target.noisePeriod, 1, 256);
    if (!allowsNoise) target.noiseMode = 'off';
    target.timeMode = normalizeTimeMode(target.timeMode);
    target.ageMode = normalizeAgeMode(target.ageMode);
    target.actionDelay = readNumber(target.actionDelay, 0, 0, target.delay);
  }

  function saveSettings() {
    const payload = { ...settings };
    if (!allowsNoise) {
      payload.noiseMode = 'off';
      payload.noiseRate = 0;
      payload.noisePeriod = 1;
    }
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  function applyNoTimerDefault(app) {
    if (params.has('timer') || params.has('timeLimit')) return;
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect && [...timerSelect.options].some((option) => option.value === '0')) {
      timerSelect.value = '0';
    }
    for (const target of [app, app?.activeGame].filter(Boolean)) {
      if ('timerEnabled' in target) target.timerEnabled = false;
      if ('timeLimit' in target) target.timeLimit = 0;
      if ('timeRemaining' in target) {
        const current = target.timeRemaining || {};
        target.timeRemaining = {
          white: 0,
          black: 0,
          ...Object.fromEntries(Object.keys(current).map((key) => [key, 0]))
        };
      }
      if (target.timerInterval) {
        clearInterval(target.timerInterval);
        target.timerInterval = null;
      }
      target.updateTimerDisplay?.();
    }
  }

  function installStyle() {
    if (document.getElementById('spaceTimeEnhancerStyle')) return;
    const style = document.createElement('style');
    style.id = 'spaceTimeEnhancerStyle';
    style.textContent = `
      .space-time-enhancer-panel{border:1px solid rgba(125,211,252,.38);border-radius:14px;background:linear-gradient(180deg,rgba(8,18,31,.94),rgba(7,13,22,.9));box-shadow:0 14px 36px rgba(0,0,0,.28);padding:0;margin:14px 0;color:#eaf6ff;display:block}
      .space-time-enhancer-head{display:grid;gap:10px;align-items:center;padding:12px 14px}.space-time-enhancer-title{display:grid;gap:3px;min-width:0}.space-time-enhancer-title strong{color:#f8c75d;font-size:.95rem;text-transform:uppercase}.space-time-enhancer-title small{color:#cbd5e1;overflow-wrap:anywhere}.space-time-enhancer-body{display:grid;gap:12px;padding:0 14px 14px}.space-time-enhancer-panel h3{margin:0;color:#f8c75d;font-size:1rem;letter-spacing:.02em;text-transform:uppercase}.space-time-enhancer-panel p{margin:0;color:#cbd5e1;line-height:1.45}.space-time-enhancer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.space-time-enhancer-grid label{display:grid;gap:4px;color:#9fb8cf;font-weight:800;text-transform:uppercase;font-size:.73rem}.space-time-enhancer-panel select,.space-time-enhancer-panel input{min-width:0;width:100%;border:1px solid rgba(125,211,252,.36);border-radius:10px;background:#07101c;color:#f8fbff;padding:.55rem .62rem}.space-time-delay-quick{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px}.space-time-delay-quick button{width:auto;min-height:30px;border:1px solid rgba(125,211,252,.32);border-radius:8px;background:#07101c;color:#dbeafe;padding:4px 8px;font-size:.78rem;font-weight:900}.space-time-delay-quick button.active{border-color:rgba(248,199,93,.9);background:rgba(248,199,93,.16);color:#fde68a}.space-time-enhancer-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.space-time-enhancer-actions button,.space-time-enhancer-actions a{border:1px solid rgba(125,211,252,.36);border-radius:10px;background:#07101c;color:#f8fbff;text-align:center;text-decoration:none;font-weight:900;padding:.58rem .75rem}.space-time-enhancer-actions button:hover,.space-time-enhancer-actions a:hover,.space-time-delay-quick button:hover{border-color:rgba(248,199,93,.85)}.space-time-observables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.space-time-observables span{border:1px solid rgba(125,211,252,.14);border-radius:8px;background:rgba(15,23,42,.58);padding:6px 8px;color:#dbeafe;font-size:.8rem}.space-time-enhancer-muted{font-size:.82rem;color:#a8b7c7}.space-time-schedule{display:grid;gap:5px}.space-time-schedule span{border:1px solid rgba(248,199,93,.22);border-radius:8px;background:rgba(248,199,93,.08);padding:6px 8px;color:#fde68a;font-size:.78rem}.space-time-delay-help{border:1px solid rgba(125,211,252,.16);border-radius:10px;background:rgba(15,23,42,.5);padding:8px;color:#cbd5e1;font-size:.82rem;line-height:1.4}.space-time-schedule-popover{position:fixed;z-index:9999;display:grid;gap:8px;min-width:min(280px,calc(100vw - 24px));max-width:min(360px,calc(100vw - 24px));padding:10px;border:1px solid rgba(248,199,93,.68);border-radius:10px;background:rgba(7,13,22,.98);box-shadow:0 18px 48px rgba(0,0,0,.44);color:#eaf6ff}.space-time-schedule-popover[hidden]{display:none}.space-time-schedule-popover strong{color:#fde68a;font-size:.82rem;text-transform:uppercase}.space-time-schedule-popover small{color:#cbd5e1;line-height:1.35;overflow-wrap:anywhere}.space-time-schedule-popover .space-time-schedule-choices{display:flex;flex-wrap:wrap;gap:6px}.space-time-schedule-popover button{width:auto;min-height:30px;border:1px solid rgba(125,211,252,.32);border-radius:8px;background:#07101c;color:#f8fbff;padding:4px 8px;font-size:.78rem;font-weight:900}.space-time-schedule-popover button:hover{border-color:rgba(248,199,93,.85)}.space-time-schedule-popover button[data-st-popup-cancel]{margin-left:auto;color:#fecaca;border-color:rgba(248,113,113,.42)}.st-piece-age-ring{position:absolute;inset:7%;border:3px solid rgba(125,255,255,.98);border-radius:50%;box-shadow:0 0 12px rgba(125,255,255,.78);pointer-events:none}.st-piece-age-ring.near-death{border-color:rgba(255,64,64,1);box-shadow:0 0 16px rgba(255,64,64,.9)}.square.st-inactive{filter:grayscale(.5) brightness(.76)}.st-piece-age-label{position:absolute;right:2px;bottom:2px;z-index:4;font-size:.62rem;color:#e0f2fe;text-shadow:0 1px 2px #000;pointer-events:none}.jump-time-age-ring{position:absolute;pointer-events:none}.space-time-enhancer-panel .hidden{display:none!important}@media(max-width:720px){.space-time-enhancer-grid,.space-time-enhancer-actions,.space-time-observables{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function installPanel() {
    const card = document.createElement('section');
    card.className = 'space-time-enhancer-panel';
    card.innerHTML = `
      <div class="space-time-enhancer-head">
        <span class="space-time-enhancer-title">
          <strong>${dimensionLabel} Time Layer</strong>
          <small data-st-summary>${modeLabel(settings.timeMode)} scheduling, +${settings.actionDelay} action delay</small>
        </span>
      </div>
      <div class="space-time-enhancer-body">
        <p class="space-time-enhancer-muted">This mode uses the original ${dimensionLabel === '3+1D' ? '3D' : '2D'} ${titleCase(family)} board, pieces, topology, online room, and legal rules. The controls below attach time properties to the existing game pieces.</p>
        <div class="space-time-enhancer-grid">
          <label>Time mode
            <select data-st-control="timeMode">
              <option value="delay">Time schedule</option>
              <option value="periodic">Time period (Go +1D only)</option>
            </select>
          </label>
          <label>Time lattice dt<input data-st-control="dt" type="number" min="1" max="16" step="1"></label>
          <label data-st-schedule-control>Max schedule delay<input data-st-control="delay" type="number" min="1" max="32" step="1"></label>
          <label data-st-schedule-control>Action delay<input data-st-control="actionDelay" type="number" min="0" max="${settings.delay}" step="1"></label>
          <div class="space-time-delay-quick" data-st-delay-buttons></div>
          <label data-st-period-control>Appear turns<input data-st-control="periodOn" type="number" min="1" max="32" step="1"></label>
          <label data-st-period-control>Disappear turns<input data-st-control="periodOff" type="number" min="1" max="32" step="1"></label>
          <label>Age rules
            <select data-st-control="ageMode">
              <option value="off">Off</option>
              <option value="lifetime">Age lifetime</option>
            </select>
          </label>
          <label data-st-age-control>Lifetime<input data-st-control="lifetime" type="number" min="1" max="512" step="1"></label>
          <label data-st-age-control>Old age warning<input data-st-control="oldAge" type="number" min="1" max="512" step="1"></label>
          <label data-st-noise>Noise
            <select data-st-control="noiseMode">
              <option value="off">Off</option>
              <option value="pieces">Aged pieces only</option>
              <option value="board">Whole board</option>
            </select>
          </label>
          <label data-st-noise>Noise rate<input data-st-control="noiseRate" type="number" min="0" max="1" step="0.01"></label>
          <label data-st-noise>Noise period<input data-st-control="noisePeriod" type="number" min="1" max="256" step="1"></label>
        </div>
        <p class="space-time-delay-help" data-st-delay-help hidden>Time schedule: choose an Action delay from Instant to the Max schedule delay, then click a legal empty action site or piece destination. Instant resolves immediately after this designed action; later delays resolve on their future turn if the source and target are still valid.</p>
        <div class="space-time-enhancer-actions">
          <button type="button" data-st-apply>Apply Time Settings</button>
          <a href="${relativeRoot()}spacetime/">2+1D / 3+1D selector</a>
        </div>
        <div class="space-time-schedule" data-st-schedule></div>
        <div class="space-time-observables" data-st-observables></div>
        <p class="space-time-enhancer-muted" data-st-note></p>
      </div>
    `;
    const controlsHost = document.querySelector('.sidebar .control-group') || document.querySelector('.jump-side .jump-card') || document.querySelector('.sidebar') || document.querySelector('.jump-side') || document.body;
    if (controlsHost.parentElement) controlsHost.parentElement.insertBefore(card, controlsHost.nextSibling);
    else document.body.prepend(card);
    card.querySelectorAll('[data-st-noise]').forEach((el) => { el.hidden = !allowsNoise; });
    if (family !== 'go') {
      const periodic = card.querySelector('[data-st-control="timeMode"] option[value="periodic"]');
      periodic?.remove();
      if (settings.timeMode === 'periodic') settings.timeMode = 'delay';
    }
    for (const [key, value] of Object.entries(settings)) {
      const control = card.querySelector(`[data-st-control="${key}"]`);
      if (control) control.value = String(value);
    }
    card.querySelector('[data-st-apply]')?.addEventListener('click', () => {
      readSettingsFromControls();
      saveSettings();
      writeSettingsToURL(true);
      patchGame(state.app);
      triggerRender(state.app);
      state.lastApplyMessage = 'Time settings applied to this original game engine.';
      refreshPanel();
    });
    card.querySelectorAll('[data-st-control]').forEach((control) => {
      control.addEventListener('change', () => {
        readSettingsFromControls();
        saveSettings();
        patchGame(state.app);
        triggerRender(state.app);
        refreshPanel();
      });
    });
    card.querySelector('[data-st-delay-buttons]')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-st-action-delay]');
      if (!button) return;
      const control = card.querySelector('[data-st-control="actionDelay"]');
      if (control) control.value = button.dataset.stActionDelay;
      readSettingsFromControls();
      saveSettings();
      patchGame(state.app);
      triggerRender(state.app);
      refreshPanel();
    });
    return card;
  }

  function readSettingsFromControls() {
    const mode = panel.querySelector('[data-st-control="timeMode"]')?.value || settings.timeMode;
    settings.timeMode = normalizeTimeMode(mode);
    settings.ageMode = normalizeAgeMode(panel.querySelector('[data-st-control="ageMode"]')?.value || settings.ageMode);
    settings.dt = readNumber(panel.querySelector('[data-st-control="dt"]')?.value, settings.dt, 1, 16);
    settings.delay = readNumber(panel.querySelector('[data-st-control="delay"]')?.value, settings.delay, 1, 32);
    const actionDelayControl = panel.querySelector('[data-st-control="actionDelay"]');
    if (actionDelayControl) actionDelayControl.max = String(settings.delay);
    settings.actionDelay = readNumber(actionDelayControl?.value, Math.min(settings.actionDelay ?? settings.delay, settings.delay), 0, settings.delay);
    if (actionDelayControl) actionDelayControl.value = String(settings.actionDelay);
    settings.periodOn = readNumber(panel.querySelector('[data-st-control="periodOn"]')?.value, settings.periodOn, 1, 32);
    settings.periodOff = readNumber(panel.querySelector('[data-st-control="periodOff"]')?.value, settings.periodOff, 1, 32);
    settings.period = settings.periodOn + settings.periodOff;
    settings.lifetime = readNumber(panel.querySelector('[data-st-control="lifetime"]')?.value, settings.lifetime, 1, 512);
    settings.oldAge = readNumber(panel.querySelector('[data-st-control="oldAge"]')?.value, settings.oldAge, 1, 512);
    settings.noiseMode = allowsNoise ? (panel.querySelector('[data-st-control="noiseMode"]')?.value || 'off') : 'off';
    settings.noiseRate = allowsNoise ? readNumber(panel.querySelector('[data-st-control="noiseRate"]')?.value, settings.noiseRate, 0, 1) : 0;
    settings.noisePeriod = allowsNoise ? readNumber(panel.querySelector('[data-st-control="noisePeriod"]')?.value, settings.noisePeriod, 1, 256) : 1;
  }

  function writeSettingsToURL(replace = false) {
    const url = new URL(location.href);
    url.searchParams.set('spacetime', layer);
    url.searchParams.set('family', family);
    url.searchParams.set('timeMode', settings.timeMode);
    url.searchParams.set('dt', String(settings.dt));
    if (settings.timeMode === 'delay') {
      url.searchParams.set('delay', String(settings.delay));
      url.searchParams.set('actionDelay', String(settings.actionDelay));
      url.searchParams.delete('period');
      url.searchParams.delete('periodOn');
      url.searchParams.delete('periodOff');
    } else {
      url.searchParams.set('period', String(settings.periodOn + settings.periodOff));
      url.searchParams.set('periodOn', String(settings.periodOn));
      url.searchParams.set('periodOff', String(settings.periodOff));
      url.searchParams.delete('delay');
      url.searchParams.delete('actionDelay');
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
    if (allowsNoise) {
      url.searchParams.set('noiseMode', settings.noiseMode);
      url.searchParams.set('noisePeriod', String(settings.noisePeriod));
      url.searchParams.set('noiseRate', String(settings.noiseRate));
    } else {
      url.searchParams.delete('noiseMode');
      url.searchParams.delete('noisePeriod');
      url.searchParams.delete('noiseRate');
    }
    if (replace) history.replaceState(null, '', url);
  }

  function waitForGameApp() {
    const names = [
      'go2dApp', 'reversi2dApp', 'go3dApp', 'reversi3dApp',
      'jumpApp', 'game', 'gameApp'
    ];
    return new Promise((resolve) => {
      let tries = 0;
      const poll = () => {
        for (const name of names) {
          const candidate = window[name];
          if (!candidate) continue;
          if (name === 'game' && family !== 'chess') continue;
          if (name === 'gameApp' && family !== 'chess') continue;
          if (name.includes('go') && family !== 'go') continue;
          if (name.includes('reversi') && family !== 'reversi') continue;
          if (name === 'jumpApp' && family !== 'jump') continue;
          resolve(candidate);
          return;
        }
        tries += 1;
        if (tries > 120) resolve(null);
        else setTimeout(poll, 100);
      };
      poll();
    });
  }

  function patchGame(app) {
    if (!app || app.__spaceTimePatchApplied === true && app.__spaceTimePatchSignature === settingSignature()) return;
    if (!app) return;
    app.__spaceTimePatchApplied = true;
    app.__spaceTimePatchSignature = settingSignature();
    if (family === 'go' || family === 'reversi') patchStoneGame(app);
    if (family === 'jump') patchJumpGame(app);
    if (family === 'chess') patchChessGame(app);
    installDelayClickDesign(app);
    patchNetworkKeys(app);
  }

  function patchStoneGame(app) {
    app.__spaceTimeSettings = settings;
    if (!app.__spaceTimeStonePatched) {
      app.__spaceTimeStonePatched = true;
      const originalReset = app.resetGame?.bind(app);
      if (originalReset) {
        app.resetGame = (...args) => {
          hideSchedulePopover();
          state.scheduledActions = [];
          return originalReset(...args);
        };
      }
      const originalAfterLocalAction = app.afterLocalAction?.bind(app);
      if (originalAfterLocalAction) {
        app.afterLocalAction = (...args) => {
          const result = originalAfterLocalAction(...args);
          markTurnAdvanced(app);
          if (settings.timeMode === 'delay') processDueScheduledActions(app);
          return result;
        };
      } else {
        const originalPlayAt = app.playAt?.bind(app);
        if (originalPlayAt) {
          app.playAt = (...args) => {
            const beforeTurn = observedTurn(app);
            const beforePlayer = currentPlayerOf(app);
            const result = originalPlayAt(...args);
            if (didActionAdvance(app, beforeTurn, beforePlayer, result)) {
              markTurnAdvanced(app);
              if (settings.timeMode === 'delay') processDueScheduledActions(app);
            }
            return result;
          };
        }
        const originalPlay = app.play?.bind(app);
        if (originalPlay) {
          app.play = (...args) => {
            const beforeTurn = observedTurn(app);
            const beforePlayer = currentPlayerOf(app);
            const result = originalPlay(...args);
            if (didActionAdvance(app, beforeTurn, beforePlayer, result)) {
              markTurnAdvanced(app);
              if (settings.timeMode === 'delay') processDueScheduledActions(app);
            }
            return result;
          };
        }
        const originalPassTurn = app.passTurn?.bind(app);
        if (originalPassTurn) {
          app.passTurn = (...args) => {
            const beforeTurn = observedTurn(app);
            const beforePlayer = currentPlayerOf(app);
            const result = originalPassTurn(...args);
            if (didActionAdvance(app, beforeTurn, beforePlayer, result)) {
              markTurnAdvanced(app);
              if (settings.timeMode === 'delay') processDueScheduledActions(app);
            }
            return result;
          };
        }
      }
    }
    if (layer === '2p1') {
      app.dynamicsSettings = () => ({
        timeEvolution: settings.ageMode === 'lifetime' ? 'decay' : (settings.timeMode === 'periodic' ? 'periodic' : 'off'),
        lifetime: settings.ageMode === 'lifetime' ? settings.lifetime : Math.max(1, settings.periodOn + settings.periodOff),
        oldAge: settings.oldAge,
        noiseMode: map2DNoise(settings.noiseMode),
        noiseRate: allowsNoise ? settings.noiseRate : 0,
        noisePeriod: settings.noisePeriod
      });
      app.setDynamicsSettings = (incoming = {}) => {
        if (incoming.timeEvolution) settings.ageMode = incoming.timeEvolution === 'decay' ? 'lifetime' : settings.ageMode;
        if (incoming.lifetime) settings.lifetime = incoming.lifetime;
        if (incoming.noiseMode) settings.noiseMode = reverseNoise(incoming.noiseMode);
        if (incoming.noiseRate) settings.noiseRate = incoming.noiseRate;
        if (incoming.noisePeriod) settings.noisePeriod = incoming.noisePeriod;
        saveSettings();
      };
    } else {
      app.shouldShowAgeRings = () => settings.ageMode === 'lifetime' || settings.timeMode === 'periodic';
      app.pieceTimeConfig = () => ({
        enabled: settings.ageMode === 'lifetime' || settings.timeMode === 'periodic',
        mode: settings.ageMode === 'lifetime' ? 'decay' : 'count',
        decay: settings.ageMode === 'lifetime',
        lifespan: settings.ageMode === 'lifetime' ? settings.lifetime : Math.max(1, settings.periodOn + settings.periodOff)
      });
      app.noiseConfig = () => ({
        mode: allowsNoise ? map3DNoise(settings.noiseMode) : 'off',
        period: settings.noisePeriod
      });
    }
    if (family === 'go') installGoPeriodVisibility(app);
    state.patchName = `${dimensionLabel} ${titleCase(family)} uses original ${layer === '3p1' ? '3D' : '2D'} rules with ${modeLabel(settings.timeMode)} settings.`;
  }

  function installGoPeriodVisibility(app) {
    if (!app || app.__spaceTimePeriodVisibilityInstalled) return;
    app.__spaceTimePeriodVisibilityInstalled = true;
    app.isSpaceTimeIndexVisible = (index, coord = null) => isGoPeriodVisible(app, index, coord);
  }

  function goPeriodCycle() {
    return Math.max(1, readNumber(settings.periodOn, 2, 1, 32) + readNumber(settings.periodOff, 2, 1, 32));
  }

  function goPeriodKey(app, index, coord = null) {
    if (Array.isArray(coord)) return coord.join(',');
    try {
      if (app?.logic?.coordFromIndex) return app.logic.coordFromIndex(index).join(',');
    } catch {}
    return String(index);
  }

  function stablePhaseForKey(key, cycle) {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i += 1) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % Math.max(1, cycle);
  }

  function goAgeForIndex(app, index, coord = null) {
    if (Array.isArray(app?.pieceAges)) return Number(app.pieceAges[index] || 0);
    const key = goPeriodKey(app, index, coord);
    return Number(app?.stoneAges?.[key] || 0);
  }

  function isGoPeriodVisible(app, index, coord = null) {
    if (settings.timeMode !== 'periodic' || family !== 'go') return true;
    const key = goPeriodKey(app, index, coord);
    const cycle = goPeriodCycle();
    if (!state.goPeriodPhases.has(key)) state.goPeriodPhases.set(key, stablePhaseForKey(key, cycle));
    const phase = state.goPeriodPhases.get(key) % cycle;
    const age = goAgeForIndex(app, index, coord);
    return ((age + phase) % cycle) < Math.max(1, settings.periodOn);
  }


  function patchJumpState(app) {
    const game = app?.game;
    if (!game || game.__spaceTimeStatePatched) return;
    game.__spaceTimeStatePatched = true;
    const originalLegalMovesFrom = game.legalMovesFrom?.bind(game);
    if (originalLegalMovesFrom) {
      game.legalMovesFrom = (coord, jumpsOnly = false) => {
        const key = game.key ? game.key(coord) : coord.join(',');
        if (settings.timeMode === 'periodic' && family === 'go') {
          const age = state.jumpAges.get(key) || 0;
          const phase = Math.abs(key.split(',').reduce((sum, value) => sum + Number(value || 0), 0)) % Math.max(1, settings.period);
          if ((age + phase) % Math.max(1, settings.period) !== (game.turnNumber || 0) % Math.max(1, settings.period)) return [];
        }
        return originalLegalMovesFrom(coord, jumpsOnly);
      };
    }
  }

  function patchJumpGame(app) {
    if (app.__spaceTimeJumpPatched) return;
    app.__spaceTimeJumpPatched = true;
    const originalAfterMove = app.afterMove?.bind(app);
    const originalRender = app.render?.bind(app);
    const originalReset = app.resetGame?.bind(app);
    app.resetGame = (...args) => {
      const result = originalReset?.(...args);
      state.jumpAges.clear();
      syncJumpAges(app, { fresh: true });
      patchJumpState(app);
      return result;
    };
    app.afterMove = (label) => {
      ageJumpPieces(app);
      processDueScheduledActions(app);
      const result = originalAfterMove ? originalAfterMove(label) : undefined;
      refreshPanel();
      return result;
    };
    app.render = (...args) => {
      const result = originalRender ? originalRender(...args) : undefined;
      drawJumpAgeOverlay(app);
      refreshPanel();
      return result;
    };
    syncJumpAges(app, { fresh: true });
    patchJumpState(app);
    state.patchName = `${dimensionLabel} Jump uses the original Jump engine with time ages attached to the race pieces.`;
  }

  function patchChessGame(app) {
    const target = app.activeGame || app;
    if (!target || target.__spaceTimeChessPatched) {
      state.patchName = `${dimensionLabel} Chess uses the original Chess board and rules with a time panel.`;
      return;
    }
    target.__spaceTimeChessPatched = true;
    const originalApplyMove = target.applyMove?.bind(target);
    const originalHandleSquareClick = target.handleSquareClick?.bind(target);
    const originalRenderBoard = target.renderBoard?.bind(target);
    const originalSelectSquare = target.selectSquare?.bind(target);
    const originalSetupBoard = target.setupBoard?.bind(target);
    const originalSetupBoard3D = target.setupBoard3D?.bind(target);
    if (originalApplyMove) target.__spaceTimeOriginalApplyMove = originalApplyMove;
    if (originalSetupBoard) {
      target.setupBoard = (...args) => {
        const result = originalSetupBoard(...args);
        state.chessAges.clear();
        syncChessAges(target, { fresh: true });
        return result;
      };
    }
    if (originalSetupBoard3D) {
      target.setupBoard3D = (...args) => {
        const result = originalSetupBoard3D(...args);
        state.chessAges.clear();
        syncChessAges(target, { fresh: true });
        return result;
      };
    }
    if (originalSelectSquare) {
      target.selectSquare = (...coords) => {
        const key = chessKeyFromArgs(coords);
        const age = state.chessAges.get(key) || 0;
        const phaseSeed = coords.reduce((sum, value) => sum + Number(value || 0), 0);
        if (settings.timeMode === 'periodic' && family === 'go' && !isPeriodicActive(age, phaseSeed)) {
          target.setStatus?.('This piece is waiting for its active time phase.');
          return;
        }
        return originalSelectSquare(...coords);
      };
    }
    if (originalApplyMove) {
      target.applyMove = async (...args) => {
        const result = await originalApplyMove(...args);
        if (result) {
          ageChessPieces(target, args[0]?.to || null);
          markTurnAdvanced(target);
          processDueScheduledActions(app);
          refreshPanel();
        }
        return result;
      };
    }
    if (originalHandleSquareClick) {
      target.handleSquareClick = async (...coords) => {
        if (settings.timeMode === 'delay' && handleDelayChessCoord(target, coords)) return;
        return originalHandleSquareClick(...coords);
      };
    }
    if (originalRenderBoard) {
      target.renderBoard = (...args) => {
        const result = originalRenderBoard(...args);
        renderChessAgeRings(target);
        return result;
      };
    }
    syncChessAges(target, { fresh: true });
    state.patchName = `${dimensionLabel} Chess uses the original Chess pieces and legal moves with Time schedule.`;
  }

  function patchNetworkKeys(app) {
    if (!app || app.__spaceTimeNetworkPatched) return;
    app.__spaceTimeNetworkPatched = true;
    const originalGameKey = app.onlineGameKey?.bind(app);
    const originalMatchKey = app.onlineMatchKey?.bind(app);
    if (originalGameKey) app.onlineGameKey = () => `${originalGameKey()}:${layer}`;
    if (originalMatchKey) app.onlineMatchKey = () => `${originalMatchKey()}:time:${settingSignature()}`;
    const originalExportState = app.exportNetworkState?.bind(app);
    const originalImportState = app.importNetworkState?.bind(app);
    if (originalExportState) {
      app.exportNetworkState = (...args) => ({
        ...originalExportState(...args),
        spaceTime: {
          layer,
          family,
          timeMode: settings.timeMode,
          ageMode: settings.ageMode,
          dt: settings.dt,
          delay: settings.delay,
          actionDelay: settings.actionDelay,
          period: settings.period,
          periodOn: settings.periodOn,
          periodOff: settings.periodOff,
          lifetime: settings.lifetime,
          oldAge: settings.oldAge,
          noiseMode: allowsNoise ? settings.noiseMode : 'off',
          noiseRate: allowsNoise ? settings.noiseRate : 0,
          noisePeriod: allowsNoise ? settings.noisePeriod : 1
        }
      });
    }
    if (originalImportState) {
      app.importNetworkState = (payload = {}) => {
        if (payload.spaceTime && payload.spaceTime.layer === layer && payload.spaceTime.family === family) {
          Object.assign(settings, payload.spaceTime);
          settings.timeMode = normalizeTimeMode(settings.timeMode);
          settings.ageMode = normalizeAgeMode(settings.ageMode);
          settings.periodOn = readNumber(settings.periodOn, DEFAULTS.periodOn, 1, 32);
          settings.periodOff = readNumber(settings.periodOff, DEFAULTS.periodOff, 1, 32);
          settings.period = settings.periodOn + settings.periodOff;
          saveSettings();
          for (const [key, value] of Object.entries(settings)) {
            const control = panel.querySelector(`[data-st-control=\"${key}\"]`);
            if (control) control.value = String(value);
          }
        }
        return originalImportState(payload);
      };
    }
    if (app.network) {
      try {
        app.network.gameKey = app.onlineGameKey?.() || app.network.gameKey;
        app.network.matchKey = app.onlineMatchKey?.() || app.network.matchKey;
      } catch {}
    }
  }


  function installDelayClickDesign(app) {
    if (!app || app.__spaceTimeDelayClickInstalled) return;
    app.__spaceTimeDelayClickInstalled = true;
    const canvas = app.canvas || document.getElementById('goBoard') || document.getElementById('reversiBoard') || document.getElementById('jumpCanvas');
    if (canvas) {
      canvas.addEventListener('click', (event) => {
        if (settings.timeMode !== 'delay') return;
        const handled = handleDelayCanvasClick(app, event);
        if (handled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    }
    const boardEl = document.getElementById('chessboard');
    if (boardEl && family === 'chess') {
      boardEl.addEventListener('click', (event) => {
        if (settings.timeMode !== 'delay') return;
        const handled = handleDelayChessClick(app.activeGame || app, event);
        if (handled) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    }
  }

  function ensureSchedulePopover() {
    if (state.schedulePopover?.isConnected) return state.schedulePopover;
    const popover = document.createElement('div');
    popover.className = 'space-time-schedule-popover';
    popover.hidden = true;
    popover.innerHTML = `
      <strong data-st-popup-title>Schedule action</strong>
      <small data-st-popup-summary></small>
      <div class="space-time-schedule-choices" data-st-popup-choices></div>
    `;
    popover.addEventListener('click', (event) => {
      event.stopPropagation();
      const cancel = event.target.closest('[data-st-popup-cancel]');
      if (cancel) {
        hideSchedulePopover();
        return;
      }
      const button = event.target.closest('button[data-st-popup-delay]');
      if (!button || !state.pendingDelayAction) return;
      const delay = readNumber(button.dataset.stPopupDelay, 0, 0, settings.delay);
      void finalizeDelayAction(delay);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hideSchedulePopover();
    });
    document.body.appendChild(popover);
    state.schedulePopover = popover;
    return popover;
  }

  function hideSchedulePopover() {
    if (state.schedulePopover) state.schedulePopover.hidden = true;
    state.pendingDelayAction = null;
  }

  function showSchedulePopover(app, draft, event) {
    const popover = ensureSchedulePopover();
    state.pendingDelayAction = { app, draft };
    const selected = selectedActionDelay();
    const max = readNumber(settings.delay, 2, 1, 32);
    const title = popover.querySelector('[data-st-popup-title]');
    const summary = popover.querySelector('[data-st-popup-summary]');
    const choices = popover.querySelector('[data-st-popup-choices]');
    if (title) title.textContent = 'Pick schedule time';
    if (summary) summary.textContent = draft.summary || 'Choose when this designed action should act.';
    if (choices) {
      choices.innerHTML = [
        ...Array.from({ length: max + 1 }, (_, delay) => `
          <button type="button" data-st-popup-delay="${delay}" aria-pressed="${delay === selected}">
            ${escapeHTML(delayLabel(delay))}
          </button>
        `),
        '<button type="button" data-st-popup-cancel>Cancel</button>'
      ].join('');
    }
    popover.hidden = false;
    const margin = 12;
    const rect = popover.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - margin, Math.max(margin, Number(event?.clientX) + 8 || margin));
    const top = Math.min(window.innerHeight - rect.height - margin, Math.max(margin, Number(event?.clientY) + 8 || margin));
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    return true;
  }

  async function finalizeDelayAction(delay) {
    const pending = state.pendingDelayAction;
    if (!pending?.draft) return;
    const { app, draft } = pending;
    const baseTurn = currentTurn(app);
    const action = {
      ...draft,
      dueTurn: baseTurn + (delay === 0 ? 0 : delay + 1),
      createdTurn: baseTurn,
      delay,
      instant: delay === 0
    };
    delete action.summary;
    settings.actionDelay = delay;
    const control = panel.querySelector('[data-st-control="actionDelay"]');
    if (control) control.value = String(delay);
    saveSettings();
    if (action.instant) {
      hideSchedulePopover();
      const ok = await applyScheduledAction(app, action);
      if (ok) processDueScheduledActions(app);
      state.lastApplyMessage = ok ? 'Instant action resolved.' : 'Instant action was cancelled because it is no longer legal.';
      triggerRender(app);
      refreshPanel();
      return;
    }
    state.scheduledActions.push(action);
    clearPendingSelection(app, action);
    hideSchedulePopover();
    consumeTurnForScheduled(app, scheduleMessage(action));
  }

  function clearPendingSelection(app, action) {
    if (action.kind === 'jump') {
      app.selected = null;
      app.legal = [];
      if (app.game) app.game.selected = null;
      app.render?.();
    } else if (action.kind === 'chess') {
      const game = app?.activeGame || app;
      if (game) {
        game.selectedSquare = null;
        game.legalMoves = [];
        game.pendingMoveTarget = null;
        game.renderBoard?.();
        game.renderer?.clearHighlights?.();
        game.renderer?.clearChosenMove?.();
      }
    }
  }

  function scheduleMessage(action) {
    if (action.kind === 'jump') return `Player ${action.player} designed a ${delayLabel(action.delay)} Jump action for turn ${action.dueTurn}.`;
    if (action.kind === 'go') return `${titleCase(action.player)} designed a ${delayLabel(action.delay)} Go placement for turn ${action.dueTurn}.`;
    if (action.kind === 'reversi') return `${titleCase(action.player)} designed a ${delayLabel(action.delay)} Reversi placement for turn ${action.dueTurn}.`;
    if (action.kind === 'chess') return `${titleCase(action.player)} designed a ${delayLabel(action.delay)} Chess move for turn ${action.dueTurn}.`;
    return `Designed a ${delayLabel(action.delay)} future action for turn ${action.dueTurn}.`;
  }

  function handleDelayCanvasClick(app, event) {
    if (family === 'jump') return handleDelayJumpClick(app, event);
    const coord = coordFromClick(app, event);
    if (!coord) return false;
    if (family === 'go') return scheduleGoAction(app, coord, event);
    if (family === 'reversi') return scheduleReversiAction(app, coord, event);
    return false;
  }

  function coordFromClick(app, event) {
    try {
      if (typeof app.pixelToCoord === 'function') return app.pixelToCoord(event);
      if (typeof app.coordFromEvent === 'function') return app.coordFromEvent(event);
      if (typeof app.pickCoord === 'function') return app.pickCoord(event);
      if (app.renderer && typeof app.renderer.pickCoord === 'function') return app.renderer.pickCoord(event);
    } catch {}
    return null;
  }

  function currentTurn(app) {
    return Math.max(Number(state.turn) || 0, observedTurn(app));
  }

  function observedTurn(app) {
    return Number(app?.logic?.moveNumber ?? app?.logic?.moveHistory?.length ?? app?.game?.turnNumber ?? app?.activeGame?.moveHistory?.length ?? app?.moveHistory?.length ?? 0) || 0;
  }

  function markTurnAdvanced(app) {
    state.turn = Math.max((Number(state.turn) || 0) + 1, observedTurn(app));
    return state.turn;
  }

  function didActionAdvance(app, beforeTurn, beforePlayer, result) {
    if (result === false || result?.ok === false) return false;
    if (observedTurn(app) > beforeTurn) return true;
    if (beforePlayer !== undefined && currentPlayerOf(app) !== beforePlayer) return true;
    return result === true || result?.ok === true;
  }

  function selectedActionDelay() {
    return readNumber(settings.actionDelay, 0, 0, settings.delay);
  }

  function scheduledDueTurn(app) {
    return currentTurn(app) + selectedActionDelay();
  }

  function currentPlayerOf(app) {
    if (family === 'jump') return app?.game?.currentPlayer || 'A';
    if (family === 'chess') return app?.currentPlayer || app?.activeGame?.currentPlayer || 'white';
    return app?.logic?.currentPlayer || 'black';
  }

  function consumeTurnForScheduled(app, message) {
    if (family === 'jump' && app?.game?.endTurn) app.game.endTurn();
    else if (family === 'go') {
      const logic = app?.logic;
      if (logic && !logic.gameOver) {
        logic.currentPlayer = logic.currentPlayer === 'black' ? 'white' : 'black';
        logic.moveNumber = Number(logic.moveNumber || 0) + 1;
        logic.passCount = 0;
      }
    } else if (family === 'reversi') {
      const logic = app?.logic;
      if (logic && !logic.gameOver) logic.currentPlayer = logic.currentPlayer === 'black' ? 'white' : 'black';
    } else if (family === 'chess') {
      const game = app?.activeGame || app;
      if (game && !game.gameOver) game.currentPlayer = game.currentPlayer === 'white' ? 'black' : 'white';
    }
    state.scheduledCount += 1;
    markTurnAdvanced(app);
    processDueScheduledActions(app);
    state.lastApplyMessage = message;
    triggerRender(app);
    refreshPanel();
    try { app.broadcastState?.(); } catch {}
    try { app.network?.sendState?.({ type: 'spacetime_delay_program' }); } catch {}
  }

  function scheduleGoAction(app, coord, event) {
    const logic = app?.logic;
    if (!logic || logic.gameOver || !coord) return false;
    if (typeof app.canActFor === 'function' && !app.canActFor(logic.currentPlayer)) return false;
    const index = logic.indexFromCoord?.(coord);
    if (!Number.isFinite(index) || logic.board?.[index] !== 0) {
      app.setStatus?.('Delay design cancelled: that site is not empty.');
      return true;
    }
    return showSchedulePopover(app, {
      kind: 'go',
      player: logic.currentPlayer,
      coord: [...coord],
      summary: `Go ${titleCase(logic.currentPlayer)} placement at (${coord.join(',')})`
    }, event);
  }

  function scheduleReversiAction(app, coord, event) {
    const logic = app?.logic;
    if (!logic || logic.gameOver || !coord) return false;
    if (typeof app.canActFor === 'function' && !app.canActFor(logic.currentPlayer)) return false;
    const legal = logic.legalMoves?.(logic.currentPlayer)?.find((move) => logic.key(move.coord) === logic.key(coord));
    if (!legal) {
      app.setStatus?.('Delay design needs a currently legal Reversi placement.');
      return true;
    }
    return showSchedulePopover(app, {
      kind: 'reversi',
      player: logic.currentPlayer,
      coord: [...legal.coord],
      summary: `Reversi ${titleCase(logic.currentPlayer)} at (${legal.coord.join(',')}); ${legal.flips.length} flip${legal.flips.length === 1 ? '' : 's'} if still legal`
    }, event);
  }

  function handleDelayJumpClick(app, event) {
    const coord = app.coordFromEvent?.(event);
    if (!coord || !app?.game || app.game.winner) return false;
    if (app.modeSelect?.value === 'online' && app.myColor && app.myColor !== app.game.currentPlayer) return true;
    if (app.selected) {
      const move = app.legal.find((candidate) => sameCoordArray(candidate.to, coord));
      if (move) {
        return showSchedulePopover(app, {
          kind: 'jump',
          player: app.game.currentPlayer,
          move: clonePlainMove(move),
          summary: `Jump ${move.type} ${move.from.join(',')} -> ${move.to.join(',')}`
        }, event);
      }
    }
    if (app.game.isOwn(coord)) {
      app.selected = coord;
      app.game.selected = coord;
      app.legal = app.game.legalMovesFrom(coord, Boolean(app.game.chainFrom));
      app.render?.();
      return true;
    }
    return true;
  }

  function handleDelayChessClick(game, event) {
    const square = event.target?.closest?.('.square');
    const boardEl = document.getElementById('chessboard');
    if (!square || !boardEl || !game) return false;
    const squares = [...boardEl.querySelectorAll('.square')];
    const index = squares.indexOf(square);
    if (index < 0) return false;
    const row = Math.floor(index / 8);
    const col = index % 8;
    if (game.selectedSquare) {
      const legal = (game.legalMoves || []).find((move) => move.r === row && move.c === col);
      if (legal) {
        return showSchedulePopover(game, {
          kind: 'chess',
          player: game.currentPlayer,
          from: { ...game.selectedSquare },
          to: { r: row, c: col },
          summary: `Chess ${titleCase(game.currentPlayer)} ${chessCoordLabel(game.selectedSquare)} -> ${chessCoordLabel({ r: row, c: col })}`
        }, event);
      }
    }
    const piece = game.getPiece?.(row, col) || game.board?.[row]?.[col];
    if (piece && piece.color === game.currentPlayer) {
      game.selectSquare?.(row, col);
      return true;
    }
    return true;
  }

  function handleDelayChessCoord(game, coords = []) {
    if (!game || game.gameOver) return false;
    const coord = chessCoordFromArgs(game, coords);
    if (!coord) return false;
    if (game.gameMode === 'online') {
      if (!game.network?.isConnected) return true;
      if (game.myColor && game.myColor !== game.currentPlayer) return true;
    }

    if (game.selectedSquare) {
      const legal = (game.legalMoves || []).find((move) => sameChessCoord(move, coord));
      if (legal) {
        return showSchedulePopover(game, {
          kind: 'chess',
          player: game.currentPlayer,
          from: cloneChessCoord(game.selectedSquare),
          to: cloneChessCoord(legal),
          summary: `Chess ${titleCase(game.currentPlayer)} ${chessCoordLabel(game.selectedSquare)} -> ${chessCoordLabel(legal)}`
        }, null);
      }
    }

    const piece = getChessPiece(game, coord);
    if (piece && piece.color === game.currentPlayer) {
      game.selectSquare?.(...coords.map(Number));
      return true;
    }
    return true;
  }

  function processDueScheduledActions(app) {
    if (!state.scheduledActions.length) return;
    const turn = currentTurn(app);
    const remaining = [];
    for (const action of state.scheduledActions) {
      if (Number(action.dueTurn) > turn) { remaining.push(action); continue; }
      const ok = applyScheduledAction(app, action);
      state.lastApplyMessage = ok ? `Future action resolved on turn ${turn}.` : `Future action for turn ${turn} was cancelled because its target was occupied or source was gone.`;
    }
    state.scheduledActions = remaining;
    triggerRender(app);
    refreshPanel();
  }

  function applyScheduledAction(app, action) {
    if (action.kind === 'jump') return applyScheduledJump(app, action);
    if (action.kind === 'go') return applyScheduledGo(app, action);
    if (action.kind === 'reversi') return applyScheduledReversi(app, action);
    if (action.kind === 'chess') return applyScheduledChess(app.activeGame || app, action);
    return false;
  }

  function applyScheduledJump(app, action) {
    const game = app?.game;
    const move = action.move;
    if (!game || !move) return false;
    if (action.instant && typeof app?.applyJumpMove === 'function') {
      if (game.currentPlayer !== action.player) return false;
      const legalMove = game.legalMovesFrom?.(move.from, false)?.find((candidate) => (
        candidate.type === move.type && sameCoordArray(candidate.to, move.to)
      ));
      return legalMove ? app.applyJumpMove(legalMove) : false;
    }
    const savedPlayer = game.currentPlayer;
    game.currentPlayer = action.player;
    const legal = game.legalMovesFrom?.(move.from, false)?.find((candidate) => (
      candidate.type === move.type && sameCoordArray(candidate.to, move.to)
    ));
    game.currentPlayer = savedPlayer;
    if (!legal) return false;
    const fromKey = game.key(legal.from);
    const toKey = game.key(legal.to);
    if (game.pieces.get(fromKey) !== action.player || game.pieces.has(toKey)) return false;
    const label = game.labels.get(fromKey);
    game.pieces.delete(fromKey);
    game.labels.delete(fromKey);
    game.pieces.set(toKey, action.player);
    if (label) game.labels.set(toKey, label);
    if (legal.type === 'jump' && game.options?.captureOnJump && legal.over) {
      game.pieces.delete(game.key(legal.over));
      game.labels.delete(game.key(legal.over));
    }
    game.checkWinner?.();
    app.render?.();
    try { app.network?.sendState?.({ type: 'spacetime_delay_resolve' }); } catch {}
    app.history?.push?.(`Future ${move.type} resolved: ${move.from.join(',')} → ${move.to.join(',')}`);
    return true;
  }

  function applyScheduledGo(app, action) {
    const logic = app?.logic;
    const index = logic?.indexFromCoord?.(action.coord);
    if (!logic || !Number.isFinite(index) || typeof logic.tryPlay !== 'function') return false;
    const savedPlayer = logic.currentPlayer;
    const shouldRestorePlayer = !action.instant;
    logic.currentPlayer = action.player;
    const result = logic.tryPlay(action.coord, action.player, {
      virtualEmptyIndexes: app?.isSpaceTimeIndexVisible?.(index, action.coord) === false ? [index] : []
    });
    if (!result?.ok) {
      logic.currentPlayer = savedPlayer;
      return false;
    }
    if (shouldRestorePlayer && !logic.gameOver && !logic.scoringPending) logic.currentPlayer = savedPlayer;
    finishResolvedBoardAction(app, `${titleCase(action.player)} future Go placement resolved.`, { protectedIndexes: [index] });
    return true;
  }

  function applyScheduledReversi(app, action) {
    const logic = app?.logic;
    if (!logic || typeof logic.play !== 'function') return false;
    const savedPlayer = logic.currentPlayer;
    const shouldRestorePlayer = !action.instant;
    logic.currentPlayer = action.player;
    const result = logic.play(action.coord, action.player);
    if (!result?.ok) {
      logic.currentPlayer = savedPlayer;
      return false;
    }
    if (shouldRestorePlayer && !logic.gameOver) logic.currentPlayer = savedPlayer;
    const protectedKeys = [logic.key?.(result.coord || action.coord), ...(logic.lastFlipped || [])].filter(Boolean);
    finishResolvedBoardAction(app, `${titleCase(action.player)} future Reversi placement resolved.`, { protectedKeys });
    return true;
  }

  function finishResolvedBoardAction(app, message, { protectedIndexes = [], protectedKeys = [] } = {}) {
    let evolution = '';
    if (typeof app?.advanceEvolution === 'function') {
      const protectedList = protectedIndexes.length ? protectedIndexes : protectedKeys;
      evolution = app.advanceEvolution(protectedList) || '';
    } else if (typeof app?.applyTimeEvolutionAndNoise === 'function') {
      app.applyTimeEvolutionAndNoise();
    }
    if ('gameStarted' in (app || {})) app.gameStarted = true;
    app?.lockSettings?.();
    app?.startTimer?.();
    app?.syncStoneAges?.();
    app?.syncPieceAges?.();
    app?.setStatus?.(evolution ? `${message} ${evolution}.` : message);
    app?.updateUI?.();
    app?.broadcastState?.();
    app?.robot?.afterLocalAction?.();
  }

  function applyScheduledChess(game, action) {
    if (!game?.board) return false;
    const piece = getChessPiece(game, action.from);
    if (!piece || piece.color !== action.player) return false;
    if (action.instant) return applyInstantChess(game, action);
    const savedPlayer = game.currentPlayer;
    game.currentPlayer = action.player;
    const legal = findChessLegalMove(game, action.from, action.to);
    game.currentPlayer = savedPlayer;
    if (!legal) return false;
    const movedType = piece.type || piece.kind || '';
    const captured = legal.enPassant && legal.capturePos
      ? getChessPiece(game, legal.capturePos)
      : getChessPiece(game, action.to);
    setChessPiece(game, action.from, null);
    setChessPiece(game, action.to, piece);
    if (legal.enPassant && legal.capturePos) setChessPiece(game, legal.capturePos, null);
    if (piece && typeof piece === 'object') piece.hasMoved = true;
    moveScheduledCastleRook(game, legal);
    const promotion = piece?.type === 'P' && isScheduledPromotionSquare(game, piece, action.to, legal) ? 'Q' : '';
    if (promotion) {
      piece.type = 'Q';
      piece.display = piece.color === 'white' ? 'Q' : 'q';
      delete piece.pawnDirection;
    }
    if (captured) pushScheduledCapture(game, piece.color, captured);
    game.currentPlayer = savedPlayer;
    game.moveHistory?.push?.(scheduledChessHistoryEntry(game, piece, action.from, action.to, captured, promotion, movedType, legal.castling));
    game.pendingMoveTarget = null;
    game.checkGameEnd?.();
    game.renderBoard?.();
    game.updateUI?.();
    game.renderer?.renderPieces3D?.(game.board);
    game.renderer?.clearHighlights?.();
    game.renderer?.clearChosenMove?.();
    return true;
  }

  async function applyInstantChess(game, action) {
    const savedPlayer = game.currentPlayer;
    game.currentPlayer = action.player;
    const legal = findChessLegalMove(game, action.from, action.to);
    if (!legal) {
      game.currentPlayer = savedPlayer;
      return false;
    }
    const piece = getChessPiece(game, action.from);
    const move = { from: cloneChessCoord(action.from), to: cloneChessCoord(action.to) };
    if (piece?.type === 'P' && isScheduledPromotionSquare(game, piece, action.to, legal)) move.promotion = 'Q';
    const applyMove = game.__spaceTimeOriginalApplyMove || game.applyMove?.bind(game);
    if (typeof applyMove !== 'function') {
      game.currentPlayer = savedPlayer;
      return false;
    }
    const ok = await applyMove(move, { spacetimeSchedule: true });
    if (!ok) {
      game.currentPlayer = savedPlayer;
      return false;
    }
    ageChessPieces(game, action.to);
    markTurnAdvanced(game);
    return true;
  }

  function scheduledChessHistoryEntry(game, piece, from, to, captured, promotion, movedType, castling) {
    if (typeof game?.createMoveNotation === 'function') {
      return game.createMoveNotation(piece, from, to, captured, promotion || null, movedType, castling || null);
    }
    return {
      kind: 'move',
      color: piece?.color || '',
      type: movedType || piece?.type || piece?.kind || '',
      from: chessCoordLabel(from),
      to: chessCoordLabel(to),
      capturedType: captured?.type || '',
      promotionType: promotion || ''
    };
  }

  function findChessLegalMove(game, from, to) {
    if (typeof game?.getLegalMoves !== 'function') return null;
    const legalMoves = game.getLegalMoves(...chessArgsFromCoord(game, from)) || [];
    return legalMoves.find((move) => sameChessCoord(move, to)) || null;
  }

  function chessArgsFromCoord(game, coord = {}) {
    if ('r' in coord || 'c' in coord) return [Number(coord.r), Number(coord.c)];
    if (chessUsesSheet(game)) return [Number(coord.x), Number(coord.y), Number(coord.sheet || 0)];
    return [Number(coord.x), Number(coord.y), Number(coord.z || 0)];
  }

  function moveScheduledCastleRook(game, legal = {}) {
    const from = legal.castling?.rookPos || legal.castling?.rookFrom;
    const to = legal.castling?.newRookPos || legal.castling?.rookTo;
    if (!from || !to) return;
    const rook = getChessPiece(game, from);
    if (!rook) return;
    setChessPiece(game, from, null);
    setChessPiece(game, to, rook);
    rook.hasMoved = true;
  }

  function isScheduledPromotionSquare(game, piece, to, legal = {}) {
    if (legal.promotion) return true;
    if (typeof game?.isPromotionSquare !== 'function') return false;
    if ('r' in to || 'c' in to) return game.isPromotionSquare(piece.color, Number(to.r));
    if (chessUsesSheet(game)) return game.isPromotionSquare(piece.color, Number(to.x), Number(to.y), Number(to.sheet || 0));
    return game.isPromotionSquare(piece.color, Number(to.x), Number(to.y), Number(to.z || 0));
  }

  function pushScheduledCapture(game, color, captured) {
    if (!game?.capturedPieces?.[color]) return;
    if (typeof game.normalizeCapturedPiece === 'function') {
      game.capturedPieces[color].push(game.normalizeCapturedPiece(captured));
    } else if (typeof game.pieceIcon === 'function') {
      game.capturedPieces[color].push(game.pieceIcon(captured));
    } else {
      game.capturedPieces[color].push({ ...captured });
    }
  }

  function clonePlainMove(move) {
    return { type: move.type, from: [...move.from], to: [...move.to], over: move.over ? [...move.over] : null, direction: move.direction ? [...move.direction] : null, id: move.id };
  }

  function chessCoordFromArgs(game, coords = []) {
    const nums = coords.map(Number);
    if (nums.some((value) => !Number.isFinite(value))) return null;
    if (nums.length >= 3) {
      const key = chessUsesSheet(game) ? 'sheet' : 'z';
      return { x: nums[0], y: nums[1], [key]: nums[2] };
    }
    if (nums.length >= 2) return { r: nums[0], c: nums[1] };
    return null;
  }

  function chessUsesSheet(game) {
    if (game?.selectedSquare && 'sheet' in game.selectedSquare) return true;
    return /Torus|RP2|Mobius|Klein|Sphere/i.test(String(game?.constructor?.name || ''));
  }

  function cloneChessCoord(coord = {}) {
    if ('r' in coord || 'c' in coord) return { r: Number(coord.r) || 0, c: Number(coord.c) || 0 };
    if ('sheet' in coord) return { x: Number(coord.x) || 0, y: Number(coord.y) || 0, sheet: Number(coord.sheet) || 0 };
    return { x: Number(coord.x) || 0, y: Number(coord.y) || 0, z: Number(coord.z) || 0 };
  }

  function chessCoordLabel(coord = {}) {
    if ('r' in coord || 'c' in coord) return `(${Number(coord.r)},${Number(coord.c)})`;
    if ('sheet' in coord) return `(${Number(coord.x)},${Number(coord.y)},s${Number(coord.sheet || 0)})`;
    return `(${Number(coord.x)},${Number(coord.y)},${Number(coord.z || 0)})`;
  }

  function chessLayer(coord = {}) {
    return Number(coord.z ?? coord.sheet ?? 0) || 0;
  }

  function sameChessCoord(a = {}, b = {}) {
    if ('r' in a || 'c' in a || 'r' in b || 'c' in b) {
      return Number(a.r) === Number(b.r) && Number(a.c) === Number(b.c);
    }
    return Number(a.x) === Number(b.x) && Number(a.y) === Number(b.y) && chessLayer(a) === chessLayer(b);
  }

  function getChessPiece(game, coord = {}) {
    if ('r' in coord || 'c' in coord) return game?.getPiece?.(coord.r, coord.c) || game?.board?.[coord.r]?.[coord.c] || null;
    const layer = chessLayer(coord);
    return game?.getPiece?.(coord.x, coord.y, layer) || game?.board?.[layer]?.[coord.y]?.[coord.x] || null;
  }

  function setChessPiece(game, coord = {}, value) {
    if ('r' in coord || 'c' in coord) {
      if (game?.board?.[coord.r]) game.board[coord.r][coord.c] = value;
      return;
    }
    const layer = chessLayer(coord);
    if (typeof game?.setPiece === 'function') game.setPiece(coord.x, coord.y, layer, value);
    else if (game?.board?.[layer]?.[coord.y]) game.board[layer][coord.y][coord.x] = value;
  }

  function sameCoordArray(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Number(v) === Number(b[i])); }
  function actionLabel(action) {
    const left = `T-${Math.max(0, Number(action.dueTurn) - currentTurn(state.app))}`;
    if (action.kind === 'jump') return `${left}: hidden Jump ${action.move?.type || 'move'} to ${action.move?.to?.join(',')}`;
    if (action.kind === 'chess') return `${left}: hidden Chess move to ${chessCoordLabel(action.to)}`;
    return `${left}: hidden ${titleCase(action.kind)} action to ${(action.coord || []).join(',')}`;
  }

  function triggerRender(app) {
    if (!app) return;
    try { app.updateUI?.(); } catch {}
    try { app.render?.(); } catch {}
    try { app.renderBoard?.(); } catch {}
    try { app.activeGame?.renderer?.render?.(); } catch {}
    try { app.activeGame?.renderBoard?.(); } catch {}
    if (app.network) {
      try { app.network.gameKey = app.onlineGameKey?.() || app.network.gameKey; } catch {}
      try { app.network.matchKey = app.onlineMatchKey?.() || app.network.matchKey; } catch {}
    }
  }

  function syncJumpAges(app, { fresh = false } = {}) {
    const pieces = app?.game?.pieces;
    if (!(pieces instanceof Map)) return;
    const next = new Map();
    for (const key of pieces.keys()) next.set(key, fresh ? 0 : (state.jumpAges.get(key) ?? 0));
    state.jumpAges = next;
  }

  function ageJumpPieces(app) {
    const pieces = app?.game?.pieces;
    if (!(pieces instanceof Map)) return;
    if (settings.ageMode !== 'lifetime') {
      syncJumpAges(app);
      return;
    }
    const next = new Map();
    for (const [key, owner] of pieces.entries()) {
      const age = (state.jumpAges.get(key) ?? 0) + settings.dt;
      next.set(key, age);
    }
    state.jumpAges = next;
    if (settings.ageMode === 'lifetime') {
      for (const [key, age] of [...state.jumpAges.entries()]) {
        if (age >= settings.lifetime) {
          pieces.delete(key);
          app.game.labels?.delete?.(key);
          state.jumpAges.delete(key);
          state.decayCount += 1;
        }
      }
      app.game.checkWinner?.();
    }
  }

  function drawJumpAgeOverlay(app) {
    if (!app?.canvas || !app?.ctx || !app?.game?.pieces) return;
    if (settings.ageMode !== 'lifetime') return;
    const ctx = app.ctx;
    const r = app.cellRadius?.() || 12;
    ctx.save();
    for (const key of app.game.pieces.keys()) {
      const coord = key.split(',').map(Number);
      if (!app.visibleCoord?.(coord)) continue;
      const age = state.jumpAges.get(key) || 0;
      if (age <= 0) continue;
      const p = app.project(coord);
      const progress = Math.max(0.05, Math.min(1, age / settings.lifetime));
      ctx.strokeStyle = progress >= 0.96 ? 'rgba(255,64,64,1)' : 'rgba(125,255,255,1)';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 14;
      ctx.lineWidth = Math.max(3, r * 0.16);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
    }
    ctx.restore();
  }

  function chessKeyFromArgs(coords = []) {
    if (coords.length >= 3) return `${Number(coords[2]) || 0},${Number(coords[1]) || 0},${Number(coords[0]) || 0}`;
    return `${Number(coords[0]) || 0},${Number(coords[1]) || 0}`;
  }

  function chessKeyFromMoveTarget(target = null) {
    if (!target) return '';
    if ('x' in target || 'z' in target) return `${Number(target.z) || 0},${Number(target.y) || 0},${Number(target.x) || 0}`;
    return `${Number(target.r) || 0},${Number(target.c) || 0}`;
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
    if (settings.ageMode !== 'lifetime') {
      syncChessAges(game);
      return;
    }
    const freshKey = chessKeyFromMoveTarget(freshTo);
    const pieces = collectChessPieces(game);
    const next = new Map();
    for (const item of pieces) next.set(item.key, item.key === freshKey ? 0 : (state.chessAges.get(item.key) ?? 0) + settings.dt);
    state.chessAges = next;
    if (settings.ageMode === 'lifetime') {
      for (const item of pieces) {
        const age = state.chessAges.get(item.key) || 0;
        if (age >= settings.lifetime) {
          item.set(null);
          state.chessAges.delete(item.key);
          state.decayCount += 1;
        }
      }
      try { game.renderer?.renderPieces3D?.(game.board); } catch {}
    }
  }

  function renderChessAgeRings(game) {
    const boardEl = document.getElementById('chessboard');
    if (settings.ageMode !== 'lifetime') return;
    if (!boardEl || !state.chessAges.size) return;
    const squares = [...boardEl.querySelectorAll('.square')];
    for (const [key, age] of state.chessAges.entries()) {
      const parts = key.split(',').map(Number);
      if (parts.length !== 2) continue;
      const [r, c] = parts;
      const square = squares[r * 8 + c];
      if (!square || age <= 0) continue;
      square.style.position = square.style.position || 'relative';
      const progress = Math.max(0.05, Math.min(1, age / settings.lifetime));
      const ring = document.createElement('span');
      ring.className = `st-piece-age-ring${progress >= 0.96 ? ' near-death' : ''}`;
      square.appendChild(ring);
      const label = document.createElement('span');
      label.className = 'st-piece-age-label';
      label.textContent = String(age);
      square.appendChild(label);
    }
  }

  function isPeriodicActive(age, phaseSeed = 0) {
    if (settings.timeMode !== 'periodic') return true;
    const phase = (phaseSeed + age) % Math.max(1, settings.period);
    return phase === (state.turn % Math.max(1, settings.period));
  }

  function map2DNoise(mode) {
    if (!allowsNoise || mode === 'off') return 'off';
    if (mode === 'pieces') return 'random-death';
    return 'random-birth';
  }

  function reverseNoise(mode) {
    if (mode === 'random-death') return 'pieces';
    if (mode === 'random-birth') return 'board';
    return 'off';
  }

  function map3DNoise(mode) {
    if (!allowsNoise || mode === 'off') return 'off';
    return mode === 'pieces' ? 'pieces' : 'board';
  }

  function collectObservables() {
    const app = state.app;
    const obs = {
      layer: dimensionLabel,
      mode: titleCase(settings.timeMode),
      turn: estimateTurn(app),
      active: estimatePieceCount(app),
      averageAge: averageAge().toFixed(1),
      decayed: state.decayCount,
      noise: allowsNoise ? settings.noiseMode : 'not used',
      actionDelay: settings.timeMode === 'delay' ? selectedActionDelay() : 'not used',
      scheduled: settings.timeMode === 'delay' ? state.scheduledActions.length : 0
    };
    return obs;
  }

  function estimateTurn(app) {
    if (!app) return state.turn;
    state.turn = currentTurn(app);
    return state.turn;
  }

  function estimatePieceCount(app) {
    if (!app) return 0;
    if (app.logic?.board?.length) return [...app.logic.board].filter((v) => Number(v) !== 0).length;
    if (app.logic?.board instanceof Map) return app.logic.board.size;
    if (app.game?.pieces instanceof Map) return app.game.pieces.size;
    const board = app.activeGame?.board || app.board;
    if (Array.isArray(board)) return board.flat().filter(Boolean).length;
    return 0;
  }

  function averageAge() {
    if (state.jumpAges.size) return [...state.jumpAges.values()].reduce((a, b) => a + b, 0) / state.jumpAges.size;
    if (state.chessAges.size) return [...state.chessAges.values()].reduce((a, b) => a + b, 0) / state.chessAges.size;
    const app = state.app;
    if (app?.pieceAges?.length) {
      const vals = [...app.pieceAges].filter((v) => Number(v) > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    const ages = app?.stoneAges || app?.pieceAges;
    if (ages && typeof ages === 'object') {
      const vals = Object.values(ages).map(Number).filter((v) => v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return 0;
  }

  function refreshPanel() {
    if (!panel) return;
    const obs = collectObservables();
    const summary = panel.querySelector('[data-st-summary]');
    if (summary) {
      summary.textContent = settings.timeMode === 'delay'
        ? `Time schedule: Instant..+${settings.delay}, selected ${delayLabel(selectedActionDelay())}`
        : `Time period: appear ${settings.periodOn}, disappear ${settings.periodOff}`;
    }
    panel.querySelectorAll('[data-st-schedule-control]').forEach((el) => { el.hidden = settings.timeMode !== 'delay'; });
    panel.querySelectorAll('[data-st-period-control]').forEach((el) => { el.hidden = settings.timeMode !== 'periodic' || family !== 'go'; });
    panel.querySelectorAll('[data-st-age-control]').forEach((el) => { el.hidden = settings.ageMode !== 'lifetime'; });
    renderActionDelayButtons();
    const host = panel.querySelector('[data-st-observables]');
    if (host) host.innerHTML = Object.entries(obs).map(([key, value]) => `<span><strong>${escapeHTML(labelFor(key))}:</strong> ${escapeHTML(value)}</span>`).join('');
    const schedule = panel.querySelector('[data-st-schedule]');
    if (schedule) {
      schedule.innerHTML = settings.timeMode === 'delay' && state.scheduledActions.length
        ? state.scheduledActions.map((action) => `<span>${escapeHTML(actionLabel(action))}</span>`).join('')
        : '';
    }
    const help = panel.querySelector('[data-st-delay-help]');
    if (help) help.hidden = settings.timeMode !== 'delay';
    const note = panel.querySelector('[data-st-note]');
    if (note) note.textContent = state.lastApplyMessage || state.patchName || 'Waiting for the original game engine to load.';
  }

  function renderActionDelayButtons() {
    const host = panel.querySelector('[data-st-delay-buttons]');
    if (!host) return;
    host.hidden = settings.timeMode !== 'delay';
    if (host.hidden) {
      host.innerHTML = '';
      return;
    }
    const selected = selectedActionDelay();
    const max = readNumber(settings.delay, 2, 1, 32);
    host.innerHTML = Array.from({ length: max + 1 }, (_, delay) => `
      <button type="button" data-st-action-delay="${delay}" class="${delay === selected ? 'active' : ''}" aria-pressed="${delay === selected}">
        ${escapeHTML(delayLabel(delay))}
      </button>
    `).join('');
  }

  function delayLabel(delay) {
    return Number(delay) === 0 ? 'Instant' : `+${delay}`;
  }

  function settingSignature() {
    return [layer, family, settings.timeMode, settings.ageMode, settings.dt, settings.delay, settings.actionDelay, settings.periodOn, settings.periodOff, settings.lifetime, settings.oldAge, settings.noiseMode, settings.noiseRate, settings.noisePeriod].join('-');
  }

  function modeLabel(value) {
    return value === 'periodic' ? 'Time period' : 'Time schedule';
  }

  function titleCase(value) { return String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
  function labelFor(key) { return String(key).replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase()); }
  function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function relativeRoot() { return pathname.includes('/2d/') || pathname.includes('/3d/') || pathname.includes('/4d/') ? '../../' : '../'; }
})();
