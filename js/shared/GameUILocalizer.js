const ZH = new Map(Object.entries({
  'Language': '語言',
  'Home': '首頁',
  'Topological Board Game': '拓撲棋盤遊戲',
  'Strategy & Systems Labs': '策略與系統實驗室',
  'Game': '遊戲',
  'Game Layer': '遊戲層',
  'Algebraic Games': '代數遊戲',
  'Research Problem': '研究問題',
  'None': '無',
  'On': '開啟',
  'Off': '關閉',
  'Game Controls': '遊戲控制',
  'Play': '遊玩',
  'Game Mode': '遊戲模式',
  'Mode': '模式',
  'Local': 'Local（本機）',
  'Online': 'Online（線上）',
  'Robot': 'Robot（機器人）',
  'Disconnected': '未連線',
  'Find Match': '尋找對手',
  'Create Room': '建立房間',
  'Join Room': '加入房間',
  'Join': '加入',
  'Copy': '複製',
  'Copy Share Link': '複製分享連結',
  'Leave Room': '離開房間',
  'PRIVATE ROOM': '私人房間',
  'OR': '或',
  'Room code': '房間代碼',
  'Room:': '房間：',
  'Online Chat': '線上聊天',
  'Connect online to chat.': '連線後即可聊天。',
  'Message opponent': '傳訊息給對手',
  'Message online opponent': '傳訊息給線上對手',
  'Send': '傳送',
  'Board Size': '棋盤大小',
  'Board size': '棋盤大小',
  'Board Scale': '棋盤尺度',
  'Boundary Condition': '邊界條件',
  'Topology': '拓撲',
  'Lattice': '晶格',
  'Standard': '標準',
  'Custom': '自訂',
  'Square': '方格',
  'Honeycomb': '蜂巢格',
  'Triangular': '三角格',
  'Polar Center Node': '極座標中心點',
  'Cylinder x-wrap': '圓柱 x 週期',
  'PBC All Sides': '全邊週期 PBC',
  'Klein Bottle': 'Klein 瓶',
  'All layers': '所有層',
  'Zoom Layer': '縮放層',
  'Visible R3 z-layer': '可見 R3 z 層',
  'R3 coordinate view filter': 'R3 座標視圖篩選',
  'Rotate X': '旋轉 X',
  'Rotate Y': '旋轉 Y',
  'Rotate Z': '旋轉 Z',
  'Zoom': '縮放',
  'Reset View': '重設視圖',
  'Reset Camera': '重設相機',
  'Focus Own': '聚焦己方',
  'Timer per Player': '每位玩家計時',
  'Timer': '計時',
  'No Timer': '不計時',
  'No time': '不計時',
  '5 Minutes': '5 分鐘',
  '10 Minutes': '10 分鐘',
  '30 Minutes': '30 分鐘',
  '1 Hour': '1 小時',
  '1 Day': '1 天',
  '3 min': '3 分鐘',
  '5 min': '5 分鐘',
  '10 min': '10 分鐘',
  '15 min': '15 分鐘',
  '30 min': '30 分鐘',
  'Pass': '停一手',
  'Agree Count': '同意數目',
  'New Game': '新遊戲',
  'Surrender': '認輸',
  'Final Count': '最終計分',
  'Move History': '移動歷史',
  'Move History + Analysis': '移動歷史 + 分析',
  'Rules': '規則',
  'Info': '說明',
  'Black': '黑方',
  'White': '白方',
  'Black to play': '黑方行動',
  'White to play': '白方行動',
  'Captured by Black': '黑方提子',
  'Captured by White': '白方提子',
  'Local pass and play': '本機輪流遊玩',
  'Robot & Analysis': '機器人與分析',
  'Robot Side': '機器人方',
  'Robot side': '機器人方',
  'Robot Depth': '機器人深度',
  'Strength': '強度',
  'Robot Move': '機器人移動',
  'Analyze Position': '分析局面',
  'Top plays': '最佳著法',
  'Bad plays': '不佳著法',
  'Current group values': '目前棋群價值',
  'Depth 1 - fast': '深度 1 - 快速',
  'Depth 2': '深度 2',
  'Depth 2 - balanced': '深度 2 - 平衡',
  'Depth 3 - stronger': '深度 3 - 較強',
  'Depth 3 - balanced': '深度 3 - 平衡',
  'Depth 4 - Strongest (slow)': '深度 4 - 最強（較慢）',
  'Level 1': '等級 1',
  'Level 2': '等級 2',
  'Level 3': '等級 3',
  'Level 4': '等級 4 - 最強（較慢）',
  'Choose Robot, or click Analyze Position.': '選擇 Robot，或按「分析局面」。',
  'Click Analyze Position to rank legal plays, estimate win rate, and show group values.': '按「分析局面」可排列合法著法、估計勝率並顯示棋群價值。',
  'Click Analyze Position to rank legal moves, estimate win rate, and show Reversi signals.': '按「分析局面」可排列合法著法、估計勝率並顯示 Reversi 指標。',
  'Players': '玩家數',
  '2 players': '2 位玩家',
  '3 players': '3 位玩家',
  'Standard Jump': '標準跳棋',
  'Square Board Jump': '方形棋盤跳棋',
  'Polar Jump': '極座標跳棋',
  'Cylinder Jump': '圓柱跳棋',
  'Torus Jump': '環面跳棋',
  'Möbius Jump': 'Möbius 跳棋',
  'Klein Jump': 'Klein 跳棋',
  'Sphere Jump': '球面跳棋',
  '3D Jump': '3D 跳棋',
  '3D Cylinder Jump': '3D 圓柱跳棋',
  '3D Torus Jump': '3D 環面跳棋',
  '3D Reflective Jump': '3D 反射跳棋',
  '3D Sphere / Shell Jump': '3D 球面／球殼跳棋',
  '4D Jump': '4D 跳棋',
  '4D Cylinder Jump': '4D 圓柱跳棋',
  '4D Torus Jump': '4D 環面跳棋',
  '4D Hypercube Jump': '4D 超立方體跳棋',
  '4D Projection Jump': '4D 投影跳棋',
  'Target axis': '目標軸',
  'Target Mode': '目標模式',
  'Opponent Home Zone': '對手本區',
  'Antipodal Zone': '對蹠區',
  'Same Charge Sector': '同電荷扇區',
  'Fusion Target': '融合目標',
  'Braid Target': '編織目標',
  'Custom Marked Target': '自訂標記目標',
  'Stop Jump Chain': '停止連跳',
  'Zones': '區域',
  'Player A home / B target': '玩家 A 本區／B 目標',
  'Player B home / A target': '玩家 B 本區／A 目標',
  'Legal step': '合法步行',
  'Legal jump': '合法跳躍',
  'Analyze / Suggest': '分析／建議',
  'Ready': '準備',
  'Reversi Space': 'Reversi 空間',
  'Go Space': '圍棋空間',
  'Sphere View': '球面視圖',
  '3D Sphere': '3D 球面',
  '2D Cut-open Fallback': '2D 切開備用視圖',
  'Standard / Simple Cubic': '標準／簡單立方',
  'Standard / Square': '標準／方格',
  'Standard uses ordinary open board edges.': '標準使用普通的開放棋盤邊界。',
  'Square uses the usual four orthogonal graph neighbors.': '方格使用一般的上下左右四個正交圖鄰居。',
  'Square uses the usual eight 2D rays.': '方格使用一般的八個 2D 射線方向。',
  'Honeycomb uses regular hexagonal cells. Stones occupy cell centers and bracket along six axial rays.': '蜂巢格使用正六邊形單元。棋子位於單元中心，並沿六個軸向射線夾擊。',
  'Honeycomb uses three graph neighbors per interior point; groups, liberties, captures, and territory use those links.': '蜂巢格每個內部點有三個圖鄰居；棋群、氣、提子和地盤都使用這些連結。',
  'Triangular uses six graph neighbors per interior point. A group is captured only after every exposed axial and diagonal liberty is enclosed.': '三角格每個內部點有六個圖鄰居；必須封住所有外露的軸向和斜向氣後才會提子。',
  'Cylinder identifies only left-right edges, while top and bottom remain ordinary open Reversi edges.': '圓柱只把左右邊界相接，上下仍是普通的開放 Reversi 邊界。',
  'R3 Standard uses ordinary open boundaries in x, y, and z.': 'R3 標準在 x、y、z 方向都使用普通開放邊界。',
  'R3 Standard uses ordinary open cubic boundaries. Reversi brackets can run through all 26 graph ray directions.': 'R3 標準使用普通開放立方邊界。Reversi 夾擊可沿 26 個圖射線方向進行。'
}));

const originals = new WeakMap();
let language = detectLanguage();
let observer = null;
const GLOBE_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Zm6.93 9h-3.18a15.8 15.8 0 0 0-1.1-5.02A8.03 8.03 0 0 1 18.93 11ZM12 4.04c.68.98 1.43 3.03 1.7 6.96h-3.4c.27-3.93 1.02-5.98 1.7-6.96ZM4.26 13h3.99c.12 2.02.43 3.78.87 5.08A8.04 8.04 0 0 1 4.26 13Zm3.99-2H4.26a8.04 8.04 0 0 1 4.86-5.08A21.9 21.9 0 0 0 8.25 11ZM12 19.96c-.68-.98-1.43-3.03-1.7-6.96h3.4c-.27 3.93-1.02 5.98-1.7 6.96Zm2.88-1.88c.44-1.3.75-3.06.87-5.08h3.99a8.04 8.04 0 0 1-4.86 5.08ZM15.75 11a21.9 21.9 0 0 0-.87-5.08A8.04 8.04 0 0 1 19.74 11h-3.99Z"/></svg>';

export function installGameUILocalizer() {
  document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  installStyles();
  installLanguageControl();
  translateTree(document.body);
  if (!observer) {
    observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') translateText(record.target);
        for (const node of record.addedNodes) translateTree(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  window.addEventListener('languagechange', (event) => setGameLanguage(event.detail?.language || detectLanguage()));
}

export function setGameLanguage(value) {
  language = normalizeLanguage(value);
  document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  for (const key of [
    'topological-boardgame:language',
    'topoboardgame-language',
    'topoboardgame.lang',
    '2dchess:language',
    '3dchess:language',
    '3dgo:language'
  ]) {
    localStorage.setItem(key, language);
  }
  const url = new URL(location.href);
  url.searchParams.set('lang', language);
  history.replaceState(history.state, '', url);
  translateTree(document.body, true);
  syncLanguageControl();
}

function translateTree(root, force = false) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) return translateText(root, force);
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) translateText(walker.currentNode, force);
  if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
  root.querySelectorAll?.('[placeholder], [title], [aria-label]').forEach(translateAttributes);
}

function translateText(node) {
  if (!node?.parentElement || ['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) return;
  if (!originals.has(node)) originals.set(node, node.nodeValue);
  const original = originals.get(node);
  const trimmed = original.trim();
  if (!trimmed) return;
  const translated = language === 'zh' ? translateValue(trimmed) : trimmed;
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const next = `${leading}${translated}${trailing}`;
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateAttributes(element) {
  for (const attr of ['placeholder', 'title', 'aria-label']) {
    if (!element.hasAttribute?.(attr)) continue;
    const dataKey = `topoboardgameOriginal${attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}`;
    if (!element.dataset[dataKey]) element.dataset[dataKey] = element.getAttribute(attr);
    const original = element.dataset[dataKey];
    element.setAttribute(attr, language === 'zh' ? translateValue(original) : original);
  }
}

function translateValue(text) {
  if (ZH.has(text)) return ZH.get(text);
  return text
    .replace(/Standard uses ordinary open board edges\./g, '標準使用普通的開放棋盤邊界。')
    .replace(/Klein bottle identifies left-right normally and top-bottom with x flipped: leaving at x enters at size - 1 - x\./g, 'Klein 瓶左右正常相接，上下相接時 x 會翻轉：從 x 離開會進入 size - 1 - x。')
    .replace(/Klein bottle identifies left-right normally and top-bottom with x flipped\./g, 'Klein 瓶左右正常相接，上下相接時 x 會翻轉。')
    .replace(/Square uses the usual four orthogonal graph neighbors\./g, '方格使用一般的上下左右四個正交圖鄰居。')
    .replace(/Square uses the usual eight 2D rays\./g, '方格使用一般的八個 2D 射線方向。')
    .replace(/Honeycomb uses regular hexagonal cells\. Stones occupy cell centers and bracket along six axial rays\./g, '蜂巢格使用正六邊形單元。棋子位於單元中心，並沿六個軸向射線夾擊。')
    .replace(/Honeycomb uses three graph neighbors per interior point; groups, liberties, captures, and territory use those links\./g, '蜂巢格每個內部點有三個圖鄰居；棋群、氣、提子和地盤都使用這些連結。')
    .replace(/Triangular uses six graph neighbors per interior point\. A group is captured only after every exposed axial and diagonal liberty is enclosed\./g, '三角格每個內部點有六個圖鄰居；必須封住所有外露的軸向和斜向氣後才會提子。')
    .replace(/^(\d+) stones?$/, '$1 顆棋子')
    .replace(/^Robot is thinking\.\.\.$/, '機器人思考中…')
    .replace(/^Robot is searching for (.+) at (?:depth|search level) (\d+)\.\.\.$/, '機器人正在以深度 $2 為 $1 搜尋…')
    .replace(/^Robot played (.+)\.$/, '機器人下在 $1。')
    .replace(/^(.+) to play$/, '$1 行動')
    .replace(/^Slice ([zw])$/, '切片 $1');
}

function installLanguageControl() {
  const host = document.querySelector('.header, .top-bar, .jump-header, .life-topbar');
  if (!host) return;
  if (host.matches('.header') && host.querySelector(':scope > h1')) {
    const copy = document.createElement('div');
    copy.className = 'game-title-copy';
    host.querySelectorAll(':scope > h1, :scope > p').forEach((element) => copy.append(element));
    host.prepend(copy);
  }
  let actions = host.querySelector(':scope > .game-title-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'game-title-actions';
    host.append(actions);
  }

  const home = document.querySelector('.space-home-link, .jump-home-link, .home-link');
  if (home && !actions.contains(home)) actions.append(home);

  const nativeControl = document.querySelector('.language-switch, .life-language-switch');
  if (nativeControl) {
    nativeControl.dataset.gameLanguageControl = 'true';
    actions.append(nativeControl);
    document.querySelectorAll('.language-switch, .life-language-switch').forEach((control) => {
      if (control !== nativeControl) control.hidden = true;
    });
    normalizeLanguageIcons();
    return;
  }
  if (document.querySelector('[data-game-language-control]')) {
    normalizeLanguageIcons();
    return;
  }
  const control = document.createElement('div');
  control.className = 'shared-game-language';
  control.dataset.gameLanguageControl = 'true';
  control.innerHTML = `<button type="button" class="shared-game-language-icon" aria-label="Language" title="Language" aria-expanded="false">${GLOBE_ICON}</button><div class="shared-game-language-menu" hidden><button type="button" data-shared-lang="en">En</button><span>|</span><button type="button" data-shared-lang="zh">中</button></div>`;
  actions.append(control);
  const icon = control.querySelector('.shared-game-language-icon');
  const menu = control.querySelector('.shared-game-language-menu');
  icon.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    icon.setAttribute('aria-expanded', String(!menu.hidden));
  });
  control.querySelectorAll('[data-shared-lang]').forEach((button) => button.addEventListener('click', () => {
    setGameLanguage(button.dataset.sharedLang);
    menu.hidden = true;
    icon.setAttribute('aria-expanded', 'false');
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
  }));
  syncLanguageControl();
}

function normalizeLanguageIcons() {
  document.querySelectorAll('.language-icon-button').forEach((button) => {
    if (!button.querySelector('svg')) button.innerHTML = GLOBE_ICON;
    button.setAttribute('aria-label', 'Language');
  });
  document.querySelectorAll('[data-lang-option="en"], [data-life-lang="en"]').forEach((button) => { button.textContent = 'En'; });
  document.querySelectorAll('[data-lang-option="zh"], [data-life-lang="zh"]').forEach((button) => { button.textContent = '中'; });
}

function syncLanguageControl() {
  document.querySelectorAll('[data-shared-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.sharedLang === language)));
}

function installStyles() {
  if (document.getElementById('shared-game-language-style')) return;
  const style = document.createElement('style');
  style.id = 'shared-game-language-style';
  style.textContent = `.game-title-copy,.header>div:not(.game-title-actions),.top-bar>div:not(.game-title-actions),.jump-header>div:not(.game-title-actions){min-width:0}.game-title-copy h1,.game-title-copy p{overflow-wrap:anywhere}.game-title-actions{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex:0 0 auto;position:relative;z-index:80}.header,.top-bar,.jump-header,.life-topbar{align-items:center}.header,.top-bar,.jump-header{display:flex;justify-content:space-between;gap:14px}.game-title-actions .language-icon-button,.shared-game-language-icon{width:34px!important;min-width:34px!important;height:34px!important;padding:0!important;font-size:0!important;line-height:1;letter-spacing:0}.game-title-actions .language-icon-button svg,.shared-game-language-icon svg{width:18px;height:18px}.shared-game-language{position:relative;display:flex;align-items:center}.shared-game-language-icon{display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer}.shared-game-language-icon:hover{opacity:.78;transform:scale(1.06)}.shared-game-language-icon:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px}.shared-game-language-menu{position:absolute;right:0;top:calc(100% + 5px);z-index:1200;display:flex;align-items:center;gap:5px;padding:6px 8px;border-radius:7px;background:#101722;box-shadow:0 10px 30px #0008;white-space:nowrap}.shared-game-language-menu[hidden]{display:none}.shared-game-language-menu button{min-width:0;padding:2px 4px;border:0;background:transparent;color:inherit;cursor:pointer}.shared-game-language-menu button[aria-pressed=true]{color:#7dd3fc;text-decoration:underline;text-underline-offset:3px}@media(max-width:620px){.header,.top-bar,.jump-header{align-items:flex-start}.header{position:relative;display:block;padding-top:50px}.header>.game-title-actions{position:absolute;right:0;top:0}.game-title-actions{gap:4px}.game-title-actions .space-home-link,.game-title-actions .jump-home-link,.game-title-actions .home-link{padding:7px 9px;min-height:32px}}`;
  document.head.append(style);
}

function detectLanguage() {
  const url = new URLSearchParams(location.search).get('lang');
  const stored = localStorage.getItem('topological-boardgame:language')
    || localStorage.getItem('topoboardgame-language')
    || localStorage.getItem('topoboardgame.lang')
    || localStorage.getItem('3dgo:language');
  return normalizeLanguage(url || stored || document.documentElement.lang || navigator.language);
}

function normalizeLanguage(value) {
  return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
