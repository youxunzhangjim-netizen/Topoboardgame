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
  'Cylinder identifies only the left-right edges. Top and bottom stay open, so liberties can vanish at the caps.': '圓柱只把左右邊界相接。上下保持開放，所以棋子在端點可能失去氣。',
  'Cylinder Reversi wraps left-right around the circumference while top and bottom remain open.': '圓柱 Reversi 會把左右方向繞成圓周，上下仍保持開放。',
  'Cylinder Go wraps left-right around the circumference while top and bottom remain open.': '圓柱圍棋會把左右方向繞成圓周，上下仍保持開放。',
  'PBC identifies both left-right and top-bottom edges.': 'PBC 會同時接合左右與上下邊界。',
  'PBC identifies both left-right and top-bottom edges. Every point has periodic neighbors in both board directions.': 'PBC 會同時接合左右與上下邊界。每個點在棋盤兩個方向都有週期鄰居。',
  '2D RBC uses one fixed random map from each boundary exit to another boundary point. The map is stored with the game state.': '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界點，並把映射保存在局面狀態中。',
  '2D RBC uses one fixed random map from each boundary exit to another boundary square. The map stays static for this game.': '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界格，這局遊戲中映射保持不變。',
  'Polar coordinates use one true center node, radial rings, circular angular neighbors, and center-to-first-ring links.': '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，以及中心到第一圈的連線。',
  'Polar coordinates use one true center node, radial rings, circular angular neighbors, and ring/ray bracketing.': '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，並可沿環向與射線方向夾擊。',
  'Polar rays can bracket around rings and radially through the center.': '極座標射線可以沿圓環夾擊，也可以沿徑向穿過中心夾擊。',
  'R3 uses open boundaries in x, y, and z.': 'R3 在 x、y、z 方向使用開放邊界。',
  'T2 wraps both directions on the torus board.': 'T2 環面會在棋盤兩個方向週期包回。',
  'T3 PBC wraps x, y, and z, so every cubic axis is periodic.': 'T3 PBC 會在 x、y、z 三個方向週期包回，因此每個立方軸都是週期的。',
  '3D RBC uses one fixed seeded random map from each cube-boundary exit to another boundary point.': '3D RBC 會用固定種子的隨機映射，把每個立方體邊界出口連到另一個邊界點。',
  'Klein bottle uses normal left-right wrap and flipped top-bottom wrap on the board graph.': 'Klein 瓶在棋盤圖上左右正常包回，上下包回時會翻轉。',
  'Mobius strip uses one twisted horizontal wrap with open vertical edges.': 'Mobius 帶使用單一扭轉的水平方向包回，垂直方向保持開放。',
  'Mobius strip is rendered as a solid twisted band. Horizontal seam crossings flip the transverse coordinate.': 'Mobius 帶會顯示為實心扭轉帶；穿過水平接縫時橫向座標會翻轉。',
  'Area scoring with 7.5 komi. Captures, liberties, superko, and territory use the selected board graph.': '使用 7.5 貼目的面積計分。提子、氣、超劫與地盤都依照所選棋盤圖計算。',
  'R3 Standard uses ordinary open boundaries in x, y, and z.': 'R3 標準在 x、y、z 方向都使用普通開放邊界。',
  'R3 Standard uses ordinary open cubic boundaries. Reversi brackets can run through all 26 graph ray directions.': 'R3 標準使用普通開放立方邊界。Reversi 夾擊可沿 26 個圖射線方向進行。',
  '4D Go': '4D 圍棋',
  '4D Reversi': '4D 黑白棋',
  'Open-boundary and fully periodic Go on 9x9, 13x13, and 19x19 boards.': '在 9x9、13x13、19x19 棋盤上遊玩開放邊界與全週期邊界圍棋。',
  'Standard 4D graph Go on configurable (x,y,z,w) boards. Default size: 5 x 5 x 5 x 5.': '標準 4D 圖圍棋，可設定 (x,y,z,w) 棋盤。預設大小：5 x 5 x 5 x 5。',
  'Standard 4D graph Reversi on empty Jump-style 4D boards, with only the alternating center 2 x 2 x 2 x 2 opening occupied.': '標準 4D 圖黑白棋，使用跳棋式空 4D 棋盤，開局只佔據中心 2 x 2 x 2 x 2 的交錯位置。',
  'Every (x,y,z,w) coordinate is a playable vertex. Liberties are only the eight possible 4D axis-neighbors inside the board; no diagonal liberties. A six-face enclosure in one 3D slice is not a capture if the two w-direction liberties remain open. Captures, suicide, superko, and territory use this full 4D graph.': '每個 (x,y,z,w) 座標都是可下的頂點。氣只來自棋盤內八個可能的 4D 軸向鄰居，沒有斜向氣。若同一個 3D 切片內只被六面包住，但 w 方向兩側仍有氣，就不算被提。提子、自殺、超劫與地盤都依照完整 4D 圖計算。',
  'Every (x,y,z,w) coordinate is a playable Reversi vertex. Legal moves bracket opponent chains along 4D topology-aware rays. There are 80 possible ray directions on an interior 4D point.': '每個 (x,y,z,w) 座標都是可下的黑白棋頂點。合法著法會沿著符合 4D 拓撲的射線夾住對手棋鏈。4D 內部點共有 80 個可能射線方向。',
  'Select a highlighted vertex for Black.': '請為黑方選擇高亮頂點。',
  'Select a highlighted vertex for White.': '請為白方選擇高亮頂點。',
  'Select an empty vertex for Black.': '請為黑方選擇空頂點。',
  'Select an empty vertex for White.': '請為白方選擇空頂點。',
  'Select an empty intersection for Black.': '請為黑方選擇空交點。',
  'Select an empty intersection for White.': '請為白方選擇空交點。',
  'No active selection.': '目前沒有選取。',
  'Board View': '棋盤視角',
  'Time Layer': '時間層',
  '2+1D Time Layer': '2+1D 時間層',
  '3+1D Time Layer': '3+1D 時間層',
  '2+1D TIME LAYER': '2+1D 時間層',
  '3+1D TIME LAYER': '3+1D 時間層',
  'Time mode': '時間模式',
  'Time schedule': '時間排程',
  'Time period (Go +1D only)': '時間週期（僅 Go +1D）',
  'Time lattice dt': '時間格距 dt',
  'Max schedule delay': '最大排程延遲',
  'Action delay': '行動延遲',
  'Appear turns': '出現回合數',
  'Disappear turns': '消失回合數',
  'Age rules': '年齡規則',
  'Age lifetime': '年齡壽命',
  'Lifetime': '壽命',
  'Old age warning': '老化警告',
  'Noise': '噪聲',
  'Aged pieces only': '僅老化棋子',
  'Whole board': '整個棋盤',
  'Noise rate': '噪聲率',
  'Noise period': '噪聲週期',
  'Apply Time Settings': '套用時間設定',
  '2+1D / 3+1D selector': '2+1D / 3+1D 選擇器',
  'Schedule action': '排程行動',
  'Pick schedule time': '選擇排程時間',
  'Instant': '立即',
  'Cancel': '取消',
  'Copied': '已複製',
  'Game started.': '遊戲開始。',
  'Draw': '平手',
  'No active selection.': '目前沒有選取。',
  'No legal move. Pass is likely required.': '沒有合法著法，可能需要停手。',
  'No bad move list.': '沒有不佳著法列表。',
  'No signals.': '沒有局面指標。',
  'Side': '方',
  'Boundary': '邊界',
  'Score': '分數',
  'Win rate': '勝率',
  'Top moves': '最佳著法',
  'Bad moves': '不佳著法',
  'Position signals': '局面指標',
  'Final win-rate flow': '終局勝率曲線',
  'Robot heuristic replay from the move record; it is an evaluation curve, not a solved-game proof.': '機器人依移動紀錄重放啟發式評估；這是評估曲線，不是已解證明。',
  'Algebraic Game Guide': '代數遊戲指南',
  'Introduction': '介紹',
  'Close introduction': '關閉介紹',
  'Clifford Introduction and Observables': 'Clifford 介紹與可觀測量',
  'Stabilizer Introduction and Observables': 'Stabilizer 介紹與可觀測量',
  'Physical Cluster Go Introduction and Observables': '物理團簇圍棋介紹與可觀測量',
  'CFT Domain-Wall Reversi Introduction and Observables': 'CFT 疇壁黑白棋介紹與可觀測量',
  'Anyon Introduction and Observables': '任意子介紹與可觀測量',
  'CFT Observable Go Introduction and Observables': 'CFT 可觀測圍棋介紹與可觀測量',
  'CFT Observables': 'CFT 可觀測量',
  'Toric-Code QEC Observables': 'Toric Code 量子糾錯可觀測量',
  'Stabilizer Observables': 'Stabilizer 可觀測量',
  'Time Evolution': '時間演化',
  'Local Rule Preview': '局部規則預覽',
  'Braid Event Log': '編織事件紀錄',
  'Stochastic Event Log': '隨機事件紀錄',
  'Research Export': '研究匯出',
  'Export JSON': '匯出 JSON',
  'Export CSV': '匯出 CSV',
  'Choose a legal move.': '選擇合法著法。',
  'Time evolution off.': '時間演化關閉。',
  'Discrete CFT estimators appear here.': '離散 CFT 估計量會顯示在這裡。',
  'Discrete graph estimators only; these are not exact continuum CFT conformal blocks.': '這些僅為離散圖估計量，不是精確的連續 CFT 共形塊。',
  'Select the toric-code memory physical problem to begin.': '選擇 Toric Code 記憶物理問題以開始。',
  'Select the Pauli error-correction / recovery physical problem to begin.': '選擇 Pauli 糾錯／恢復物理問題以開始。'
}));

const originals = new WeakMap();
let language = detectLanguage();
let observer = null;
const GLOBE_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 0 18"></path><path d="M12 3a14 14 0 0 0 0 18"></path></svg>';

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
  if (node.parentElement.closest('[data-no-localize]')) return;
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
  if (element.closest?.('[data-no-localize]')) return;
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
    .replace(/Counting pending: provisional draw/g, '等待計分：暫時和棋')
    .replace(/Counting pending: Black leads by ([\d.]+)/g, '等待計分：黑方暫時領先 $1')
    .replace(/Counting pending: White leads by ([\d.]+)/g, '等待計分：白方暫時領先 $1')
    .replace(/Standard uses ordinary open board edges\./g, '標準使用普通的開放棋盤邊界。')
    .replace(/Standard uses ordinary board edges\./g, '標準使用普通的棋盤邊界。')
    .replace(/Klein bottle identifies left-right normally and top-bottom with x flipped: leaving at x enters at size - 1 - x\./g, 'Klein 瓶左右正常相接，上下相接時 x 會翻轉：從 x 離開會進入 size - 1 - x。')
    .replace(/Klein bottle identifies left-right normally and top-bottom with x flipped\./g, 'Klein 瓶左右正常相接，上下相接時 x 會翻轉。')
    .replace(/The Klein bottle has normal left-right wrap and flipped top-bottom wrap: leaving at x enters at width - 1 - x\./g, 'Klein 瓶左右正常包回，上下包回時會翻轉：從 x 離開會進入 width - 1 - x。')
    .replace(/Klein connects left-right normally and top-bottom with an x-flip\./g, 'Klein 瓶會左右正常相接，上下相接時 x 會翻轉。')
    .replace(/Cylinder identifies only the left-right edges\. Top and bottom stay open, so liberties can vanish at the caps\./g, '圓柱只把左右邊界相接。上下保持開放，所以棋子在端點可能失去氣。')
    .replace(/Cylinder identifies only left-right edges, while top and bottom remain ordinary open Reversi edges\./g, '圓柱只把左右邊界相接，上下仍是普通的開放 Reversi 邊界。')
    .replace(/Cylinder wraps left-right only\./g, '圓柱只在左右方向週期包回。')
    .replace(/PBC identifies both left-right and top-bottom edges\. Every point has periodic neighbors in both board directions\./g, 'PBC 會同時接合左右與上下邊界。每個點在棋盤兩個方向都有週期鄰居。')
    .replace(/PBC identifies both left-right and top-bottom edges\./g, 'PBC 會同時接合左右與上下邊界。')
    .replace(/PBC connects both left-right and top-bottom sides\./g, 'PBC 會同時接合左右與上下兩側。')
    .replace(/2D RBC uses one fixed random map from each boundary exit to another boundary point\. The map is stored with the game state\./g, '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界點，並把映射保存在局面狀態中。')
    .replace(/2D RBC uses one fixed random map from each boundary exit to another boundary square\. The map stays static for this game\./g, '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界格，這局遊戲中映射保持不變。')
    .replace(/2D RBC creates one fixed random boundary map for this game\./g, '2D RBC 會為這局遊戲建立一份固定的隨機邊界映射。')
    .replace(/Polar coordinates use one true center node, radial rings, circular angular neighbors, and center-to-first-ring links\./g, '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，以及中心到第一圈的連線。')
    .replace(/Polar coordinates use one true center node, radial rings, circular angular neighbors, and ring\/ray bracketing\./g, '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，並可沿環向與射線方向夾擊。')
    .replace(/Polar adds one center node with radial rings\./g, '極座標會加入一個中心點與徑向環。')
    .replace(/Polar rays can bracket around rings and radially through the center\./g, '極座標射線可以沿圓環夾擊，也可以沿徑向穿過中心夾擊。')
    .replace(/Square uses the usual four orthogonal graph neighbors\./g, '方格使用一般的上下左右四個正交圖鄰居。')
    .replace(/Square uses the usual eight 2D rays\./g, '方格使用一般的八個 2D 射線方向。')
    .replace(/Honeycomb uses regular hexagonal cells\. Stones occupy cell centers and bracket along six axial rays\./g, '蜂巢格使用正六邊形單元。棋子位於單元中心，並沿六個軸向射線夾擊。')
    .replace(/Honeycomb uses three graph neighbors per interior point; groups, liberties, captures, and territory use those links\./g, '蜂巢格每個內部點有三個圖鄰居；棋群、氣、提子和地盤都使用這些連結。')
    .replace(/Triangular uses six graph neighbors per interior point\. A group is captured only after every exposed axial and diagonal liberty is enclosed\./g, '三角格每個內部點有六個圖鄰居；必須封住所有外露的軸向和斜向氣後才會提子。')
    .replace(/Square, honeycomb, and triangular boards use four, three, and six graph neighbors respectively\./g, '方格、蜂巢格、三角格棋盤分別使用四個、三個、六個圖鄰居。')
    .replace(/Area scoring with 7\.5 komi, capture by removing groups with no liberties, suicide forbidden, positional superko, and final scoring after two passes plus both players agreeing to count\./g, '使用 7.5 貼目的面積計分；無氣棋群會被提走；禁止自殺；採位置超劫；雙方連續停手並同意數目後進行終局計分。')
    .replace(/Endgame starts when both players pass or neither side can play\./g, '當雙方都停手，或雙方都沒有可下位置時進入終局。')
    .replace(/On Polar boards, the true center is useful for connection but the center alone does not claim a whole empty region\./g, '在極座標棋盤上，真正中心點有助於連接，但單靠中心點不會直接佔領整片空區。')
    .replace(/R3 Standard uses ordinary open cubic boundaries\. Reversi brackets can run through all 26 graph ray directions\./g, 'R3 標準使用普通開放立方邊界。Reversi 夾擊可沿 26 個圖射線方向進行。')
    .replace(/R3 Standard uses ordinary open boundaries in x, y, and z\./g, 'R3 標準在 x、y、z 方向都使用普通開放邊界。')
    .replace(/R3 uses open boundaries in x, y, and z\./g, 'R3 在 x、y、z 方向使用開放邊界。')
    .replace(/T2 wraps both directions on the torus board\./g, 'T2 環面會在棋盤兩個方向週期包回。')
    .replace(/T3 PBC wraps x, y, and z, so every cubic axis is periodic\./g, 'T3 PBC 會在 x、y、z 三個方向週期包回，因此每個立方軸都是週期的。')
    .replace(/3D RBC uses one fixed seeded random map from each cube-boundary exit to another boundary point\./g, '3D RBC 會用固定種子的隨機映射，把每個立方體邊界出口連到另一個邊界點。')
    .replace(/Cylinder Reversi wraps left-right around the circumference while top and bottom remain open\./g, '圓柱 Reversi 會把左右方向繞成圓周，上下仍保持開放。')
    .replace(/Cylinder Go wraps left-right around the circumference while top and bottom remain open\./g, '圓柱圍棋會把左右方向繞成圓周，上下仍保持開放。')
    .replace(/Klein bottle uses normal left-right wrap and flipped top-bottom wrap on the board graph\./g, 'Klein 瓶在棋盤圖上左右正常包回，上下包回時會翻轉。')
    .replace(/Mobius strip uses one twisted horizontal wrap with open vertical edges\./g, 'Mobius 帶使用單一扭轉的水平方向包回，垂直方向保持開放。')
    .replace(/Mobius strip is rendered as a solid twisted band\. Horizontal seam crossings flip the transverse coordinate\./g, 'Mobius 帶會顯示為實心扭轉帶；穿過水平接縫時橫向座標會翻轉。')
    .replace(/Area scoring with 7\.5 komi\. Captures, liberties, superko, and territory use the selected board graph\./g, '使用 7.5 貼目的面積計分。提子、氣、超劫與地盤都依照所選棋盤圖計算。')
    .replace(/^([23]\+1D) TIME LAYER$/g, '$1 時間層')
    .replace(/^([23]\+1D) Time Layer$/g, '$1 時間層')
    .replace(/^Time schedule: Instant\.\.\+(\d+), selected Instant$/g, '時間排程：立即到 +$1，已選立即')
    .replace(/^Time schedule: Instant\.\.\+(\d+), selected \+(\d+)$/g, '時間排程：立即到 +$1，已選 +$2')
    .replace(/^Time period scheduling, \+(\d+) action delay$/g, '時間週期排程，行動延遲 +$1')
    .replace(/^Time schedule scheduling, \+(\d+) action delay$/g, '時間排程，行動延遲 +$1')
    .replace(/^Time period: appear (\d+), disappear (\d+)$/g, '時間週期：出現 $1，消失 $2')
    .replace(/^Choose when this designed action should act\.$/g, '選擇這個設計好的行動要在何時作用。')
    .replace(/^([23]\+1D) (Chess|Go|Reversi|Jump) uses original (2D|3D) rules with (Time schedule|Time period) settings\.$/g, (_match, dim, family, baseDim, mode) => {
      const familyZh = { Chess: '西洋棋', Go: '圍棋', Reversi: '黑白棋', Jump: '跳棋' }[family] || family;
      const modeZh = mode === 'Time period' ? '時間週期' : '時間排程';
      return `${dim} ${familyZh} 使用原本 ${baseDim} 規則，並套用${modeZh}設定。`;
    })
    .replace(/^This mode uses the original (2D|3D) (Chess|Go|Reversi|Jump) board, pieces, topology, online room, and legal rules\. The controls below attach time properties to the existing game pieces\.$/g, (_match, dim, family) => {
      const familyZh = { Chess: '西洋棋', Go: '圍棋', Reversi: '黑白棋', Jump: '跳棋' }[family] || family;
      return `此模式使用原本的 ${dim} ${familyZh} 棋盤、棋子、拓撲、線上房間與合法規則。下方控制項會把時間性質附加到既有棋子上。`;
    })
    .replace(/^Time schedule: choose an Action delay from Instant to the Max schedule delay, then click a legal empty action site or piece destination\. Instant resolves immediately after this designed action; later delays resolve on their future turn if the source and target are still valid\.$/g, '時間排程：先在「立即」到「最大排程延遲」之間選擇行動延遲，再點合法的空行動位置或棋子目的地。立即會在設計此行動後立刻作用；較晚的延遲會在未來回合檢查來源與目標仍合法時才作用。')
    .replace(/^Player ([A-Z]) designed a (Instant|\+\d+) Jump action for turn (\d+)\.$/g, (_match, player, delay, turn) => `玩家 ${player} 設計了${delay === 'Instant' ? '立即' : delay}跳棋行動，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) designed a (Instant|\+\d+) Go placement for turn (\d+)\.$/g, (_match, player, delay, turn) => `${player === 'Black' ? '黑方' : '白方'}設計了${delay === 'Instant' ? '立即' : delay}圍棋落子，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) designed a (Instant|\+\d+) Reversi placement for turn (\d+)\.$/g, (_match, player, delay, turn) => `${player === 'Black' ? '黑方' : '白方'}設計了${delay === 'Instant' ? '立即' : delay}黑白棋落子，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) designed a (Instant|\+\d+) hidden scheduled action for turn (\d+)\.$/g, (_match, player, delay, turn) => `${player === 'Black' ? '黑方' : '白方'}設計了${delay === 'Instant' ? '立即' : delay}隱藏排程行動，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) future Go placement resolved\.$/g, (_match, player) => `${player === 'Black' ? '黑方' : '白方'}的未來圍棋落子已執行。`)
    .replace(/^(Black|White) future Reversi placement resolved\.$/g, (_match, player) => `${player === 'Black' ? '黑方' : '白方'}的未來黑白棋落子已執行。`)
    .replace(/^\+(\d+): hidden scheduled action$/g, '+$1：隱藏排程行動')
    .replace(/^([23]\+1D) Chess uses the original Chess board and rules with a time panel\.$/g, '$1 西洋棋使用原本棋盤與規則，並加入時間面板。')
    .replace(/^([23]\+1D) Chess uses the original Chess pieces and legal moves with Time schedule\.$/g, '$1 西洋棋使用原本棋子與合法走法，並加入時間排程。')
    .replace(/^New (.+) Reversi game started\.$/g, '新的 $1 黑白棋遊戲開始。')
    .replace(/^Waiting for (black|white)\.$/g, (_match, color) => `等待${color === 'black' ? '黑方' : '白方'}。`)
    .replace(/^(Black|White) flipped (\d+) stones?\.$/g, (_match, color, count) => `${color === 'Black' ? '黑方' : '白方'}翻轉 ${count} 顆棋子。`)
    .replace(/^Robot (black|white) flipped (\d+) stones?\.$/g, (_match, color, count) => `機器人${color === 'black' ? '黑方' : '白方'}翻轉 ${count} 顆棋子。`)
    .replace(/^Robot scheduled (.+)\.$/g, '機器人已排程 $1。')
    .replace(/^Robot scheduled (.+)\. Score (.+)\.$/g, '機器人已排程 $1。分數 $2。')
    .replace(/^Robot played (.+) and flipped (\d+)\.$/g, '機器人下在 $1，翻轉 $2 顆。')
    .replace(/^Robot found (.+) at score (.+); nodes (\d+)( \(time-limited\))?\.$/g, (_match, move, score, nodes, limited) => `機器人找到 ${move}，分數 ${score}；節點 ${nodes}${limited ? '（限時）' : ''}。`)
    .replace(/^Robot found no legal move\.$/g, '機器人沒有找到合法著法。')
    .replace(/^Robot found no move and pass was rejected\.$/g, '機器人沒有找到著法，且停手被拒絕。')
    .replace(/^Robot move was rejected(?:: (.+))?\.$/g, (_match, reason) => `機器人著法被拒絕${reason ? `：${reason}` : ''}。`)
    .replace(/^Robot error: (.+)$/g, '機器人錯誤：$1')
    .replace(/^Analysis error: (.+)$/g, '分析錯誤：$1')
    .replace(/^Analyzing (black|white) at (?:depth|search level) (\d+)\.\.\.$/g, (_match, color, depth) => `正在以深度 ${depth} 分析${color === 'black' ? '黑方' : '白方'}…`)
    .replace(/^Depth (\d+); completed (\d+); (\d+) searched nodes(?:, time\/node limit reached)?\. Win rate is heuristic, not solved\.$/g, '深度 $1；已完成 $2；搜尋 $3 個節點。勝率是啟發式估計，不是已解結果。')
    .replace(/^Black (\d+), White (\d+), Empty (\d+); completed depth (\d+)$/g, '黑方 $1，白方 $2，空點 $3；完成深度 $4')
    .replace(/^(.+) to play · score (.+) · win estimate (.+)% · nodes (\d+)$/g, '$1 行動 · 分數 $2 · 勝率估計 $3% · 節點 $4')
    .replace(/^(.+) to play · score (.+) · win estimate (.+)% · (.+)\/(.+) · nodes (\d+)( \(time-limited\))?$/g, (_match, player, score, win, topology, lattice, nodes, limited) => `${player} 行動 · 分數 ${score} · 勝率估計 ${win}% · ${topology}/${lattice} · 節點 ${nodes}${limited ? '（限時）' : ''}`)
    .replace(/^score (.+) · win (.+)%$/g, '分數 $1 · 勝率 $2%')
    .replace(/^(.+) has no legal moves\. Final count\.$/g, '$1 沒有合法著法。最終計數。')
    .replace(/^(Black|White) wins by (.+)$/g, (_match, color, margin) => `${color === 'Black' ? '黑方' : '白方'}勝 ${margin}`)
    .replace(/^(Black|White) wins$/g, (_match, color) => `${color === 'Black' ? '黑方' : '白方'}獲勝`)
    .replace(/^Final count: (.+)$/g, '最終計數：$1')
    .replace(/^(Black|White) passed$/g, (_match, color) => `${color === 'Black' ? '黑方' : '白方'}停手`)
    .replace(/^(Black|White) auto-passed$/g, (_match, color) => `${color === 'Black' ? '黑方' : '白方'}自動停手`)
    .replace(/^(Black|White) \(([^)]+)\) flipped (\d+)$/g, (_match, color, coord, count) => `${color === 'Black' ? '黑方' : '白方'}（${coord}）翻轉 ${count} 顆`)
    .replace(/^Empty \(([^)]+)\): legal, flips (\d+)\.$/g, '空點（$1）：合法，可翻轉 $2 顆。')
    .replace(/^Empty \(([^)]+)\): not legal for current player\.$/g, '空點（$1）：目前玩家不能下在這裡。')
    .replace(/^(Black|White) stone at \(([^)]+)\)\.$/g, (_match, color, coord) => `${color === 'Black' ? '黑方' : '白方'}棋子在（${coord}）。`)
    .replace(/^That vertex does not bracket any opponent stones\.$/g, '該頂點沒有夾住任何對手棋子。')
    .replace(/^Move unavailable\.$/g, '此著法不可用。')
    .replace(/^Pass is only available when the current player has no legal move\.$/g, '只有目前玩家沒有合法著法時才能停手。')
    .replace(/^Pass unavailable\.$/g, '目前不能停手。')
    .replace(/^Turn passed\.$/g, '本回合停手。')
    .replace(/^Current$/g, '目前')
    .replace(/^Model$/g, '模型')
    .replace(/^Central Charge$/g, '中心荷')
    .replace(/^Dominant Block$/g, '主導共形塊')
    .replace(/^Entropy$/g, '熵')
    .replace(/^Strongest Correlation$/g, '最強相關')
    .replace(/^OPE Channels$/g, 'OPE 通道')
    .replace(/^Anomaly Events$/g, '異常事件')
    .replace(/^Vacuum Block$/g, '真空共形塊')
    .replace(/^Total Charge$/g, '總荷')
    .replace(/^Logical Sector$/g, '邏輯扇區')
    .replace(/^Memory$/g, '記憶')
    .replace(/^Vacuum Recovery$/g, '真空恢復')
    .replace(/^Average Braid Length$/g, '平均編織長度')
    .replace(/^Maximum Braid Length$/g, '最大編織長度')
    .replace(/^Successful Unbraids$/g, '成功解編織')
    .replace(/^Failed Unbraids$/g, '失敗解編織')
    .replace(/^Syndrome Weight$/g, '症候權重')
    .replace(/^Check Violations$/g, '檢查違反數')
    .replace(/^Global Parity$/g, '全域奇偶')
    .replace(/^Commutation Conflicts$/g, '對易衝突')
    .replace(/^Ancillas$/g, '輔助位')
    .replace(/^Measurement Errors$/g, '測量錯誤')
    .replace(/^Vacuum$/g, '真空')
    .replace(/^Alive$/g, '存活')
    .replace(/^Not recovered$/g, '尚未恢復')
    .replace(/^Yes$/g, '是')
    .replace(/^No$/g, '否')
    .replace(/^Algebra set:$/g, '代數設定：')
    .replace(/^Lab goal:$/g, '實驗目標：')
    .replace(/^Physical meaning:$/g, '物理意義：')
    .replace(/^Physical problem \/ goal:$/g, '物理問題／目標：')
    .replace(/^Initial states:$/g, '初始狀態：')
    .replace(/^Actions:$/g, '行動：')
    .replace(/^Observables:$/g, '可觀測量：')
    .replace(/^Results:$/g, '結果：')
    .replace(/^Answer:$/g, '答案：')
    .replace(/^Move rule:$/g, '移動規則：')
    .replace(/^3D boards:$/g, '3D 棋盤：')
    .replace(/^Dynamics choices:$/g, '動力學選項：')
    .replace(/^Topology:$/g, '拓撲：')
    .replace(/^Measurements:$/g, '測量：')
    .replace(/^Default CFT:$/g, '預設 CFT：')
    .replace(/^Estimator note:$/g, '估計器說明：')
    .replace(/Clifford Reversi is one game with configurable algebra and opening rules\./g, 'Clifford 黑白棋是一個可設定代數與開局規則的遊戲。')
    .replace(/Standard Pauli keeps the ordinary four-stone Reversi opening\./g, '標準 Pauli 保留普通四子黑白棋開局。')
    .replace(/Choose Stabilizer Algebra to use qubit sites, alternate initial rules, measurements, phases, and ancillas\./g, '選擇 Stabilizer Algebra 可使用量子位點、替代初始規則、測量、相位與輔助位。')
    .replace(/compare how the same Pauli\/Clifford flipping rule changes when topology, seams, lattice, noise, and time settings alter the rays that carry local information\./g, '比較同一個 Pauli/Clifford 翻轉規則在拓撲、接縫、晶格、噪聲與時間設定改變局部資訊傳遞射線時如何變化。')
    .replace(/place a Pauli-labelled stone on an empty vertex only when it brackets at least one opponent chain along a topology-aware ray\./g, '只有當空頂點沿拓撲感知射線夾住至少一條對手鏈時，才能放置帶 Pauli 標籤的棋子。')
    .replace(/Rays use the selected topology, so 2D RBC, torus, Klein bottle, RP2, S2 latitude, and 4D grid boards use their graph normalization instead of flat boundary assumptions\./g, '射線使用所選拓撲，因此 2D RBC、環面、Klein 瓶、RP2、S2 緯線與 4D 網格棋盤都使用各自的圖正規化，而不是平面邊界假設。')
    .replace(/every bracketed opponent stone changes to the acting color\./g, '每顆被夾住的對手棋子都會變成行動方顏色。')
    .replace(/Pauli noise changes labels with seeded random rolls\./g, 'Pauli 噪聲會用帶種子的隨機擲骰改變標籤。')
    .replace(/Time evolution can age pieces on the selected clock after moves or full rounds/g, '時間演化可在移動後或完整輪次後依所選時鐘讓棋子老化')
    .replace(/the export records topology, lattice, board labels, move history, position history, probability\/noise events, time-evolution state, and final counts\./g, '匯出會記錄拓撲、晶格、棋盤標籤、移動歷史、局面歷史、機率／噪聲事件、時間演化狀態與最終計數。')
    .replace(/this is the Stabilizer Algebra configuration of the same Clifford Reversi game\./g, '這是同一個 Clifford 黑白棋遊戲的 Stabilizer Algebra 設定。')
    .replace(/empty vertices are identity I with no active excitation\./g, '空頂點是沒有活躍激發的恆等 I。')
    .replace(/Occupied vertices store owner, Pauli I\/X\/Y\/Z, sign, phase modulo four, and optional ancilla data\./g, '被佔據的頂點會儲存所有者、Pauli I/X/Y/Z、符號、模四相位與可選輔助位資料。')
    .replace(/recovery means using local Pauli-frame actions to reduce measured X\/Z syndrome defects and return the board toward the stabilizer vacuum or intended logical sector\./g, '恢復表示使用局部 Pauli-frame 行動降低測得的 X/Z 症候缺陷，並讓棋盤回到 stabilizer 真空或目標邏輯扇區。')
    .replace(/Stabilizer Pauli correction\/recovery exports the initial and final observables, full physics history, measurement log, circuit history, recovery time, logical-error flag, final sector, Pauli\/phase distributions, and a compact final answer/g, 'Stabilizer Pauli 糾錯／恢復會匯出初始與最終可觀測量、完整物理歷史、測量紀錄、電路歷史、恢復時間、邏輯錯誤旗標、最終扇區、Pauli/相位分布與精簡最終答案')
    .replace(/black is species A, phase A, or spin sector A\./g, '黑方代表物種 A、相位 A 或自旋扇區 A。')
    .replace(/White is species B, phase B, or spin sector B\./g, '白方代表物種 B、相位 B 或自旋扇區 B。')
    .replace(/test whether competing local growth rules create survival, extinction, percolation, or topology-wrapping clusters on different spaces\./g, '測試競爭式局部生長規則是否會在不同空間中產生存活、滅絕、滲流或繞拓撲的團簇。')
    .replace(/liberties are neighboring empty graph vertices that can feed growth\./g, '氣是可供生長的相鄰空圖頂點。')
    .replace(/black is the \+ source\/domain sign and white is the - source\/domain sign\./g, '黑方是正源／正疇符號，白方是負源／負疇符號。')
    .replace(/A stone is a primary field or spin\/domain insertion\./g, '一顆棋子代表 primary field 或自旋／疇插入。')
    .replace(/use Reversi brackets as discrete intervals to see how source signs, domain walls, and OPE channels reorganize across the selected graph\./g, '使用黑白棋夾擊作為離散區間，觀察源符號、疇壁與 OPE 通道如何在所選圖上重組。')
    .replace(/create mobile topological charges, braid or unbraid their worldlines, then test whether fusion and logical memory return to the intended vacuum or sector\./g, '建立可移動拓撲荷，編織或解編織其世界線，再測試融合與邏輯記憶是否回到目標真空或扇區。')
    .replace(/a token may hop to an adjacent empty vertex or jump over one occupied neighboring token into the next empty vertex/g, '一個棋子可以跳到相鄰空頂點，或越過一個被佔據的相鄰棋子到下一個空頂點')
    .replace(/the board is a discretized Riemann surface \/ graph manifold\./g, '棋盤是離散化的 Riemann 曲面／圖流形。')
    .replace(/place primary fields and use Go captures as graph operations, then measure which conformal block, correlation pattern, entropy growth, or anomaly response dominates\./g, '放置 primary field，並把圍棋提子當作圖操作，再測量哪個共形塊、相關模式、熵增長或異常響應占主導。')
    .replace(/legal placement, liberties, captures, suicide, superko, passing, and area scoring use topology adjacency\./g, '合法落子、氣、提子、自殺、超劫、停手與面積計分都使用拓撲鄰接。')
    .replace(/export summarizes final dominant block, identity\/vacuum block dominance, entropy growth, strongest correlations, final OPE sector, and anomaly count\./g, '匯出會總結最終主導共形塊、恆等／真空共形塊優勢、熵增長、最強相關、最終 OPE 扇區與異常數。')
    .replace(/\bInstant\b/g, '立即')
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
    if (!button.dataset.sharedLanguageToggleBound) {
      button.dataset.sharedLanguageToggleBound = 'true';
      button.addEventListener('click', (event) => {
        const control = button.closest('.language-switch, .life-language-switch, .shared-game-language');
        const menu = control?.querySelector('.language-popover, .shared-game-language-menu');
        if (!control || !menu) return;
        event.preventDefault();
        const open = control.dataset.languageOpen !== 'true';
        control.dataset.languageOpen = String(open);
        button.setAttribute('aria-expanded', String(open));
        if (menu.classList.contains('shared-game-language-menu')) menu.hidden = !open;
      });
    }
  });
  document.querySelectorAll('[data-lang-option="en"], [data-life-lang="en"]').forEach((button) => { button.textContent = 'En'; });
  document.querySelectorAll('[data-lang-option="zh"], [data-life-lang="zh"]').forEach((button) => { button.textContent = '中'; });
  document.querySelectorAll('.language-popover, .life-language-switch .language-popover').forEach((menu) => {
    const buttons = Array.from(menu.querySelectorAll('[data-lang-option], [data-life-lang]'));
    if (buttons.length < 2 || menu.querySelector('.shared-language-divider')) return;
    const divider = document.createElement('span');
    divider.className = 'shared-language-divider';
    divider.setAttribute('aria-hidden', 'true');
    divider.textContent = '|';
    buttons[0].after(divider);
  });
}

function syncLanguageControl() {
  document.querySelectorAll('[data-shared-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.sharedLang === language)));
}

function installStyles() {
  if (document.getElementById('shared-game-language-style')) return;
  const style = document.createElement('style');
  style.id = 'shared-game-language-style';
  style.textContent = `.game-title-copy,.header>div:not(.game-title-actions),.top-bar>div:not(.game-title-actions),.jump-header>div:not(.game-title-actions){min-width:0}.game-title-copy h1,.game-title-copy p{overflow-wrap:anywhere}.game-title-actions{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex:0 0 auto;position:relative;z-index:80}.header,.top-bar,.jump-header,.life-topbar{align-items:center}.header,.top-bar,.jump-header{display:flex;justify-content:space-between;gap:14px}.game-title-actions .language-icon-button,.shared-game-language-icon{width:30px!important;min-width:30px!important;height:30px!important;padding:0!important;border:0!important;border-radius:999px!important;background:transparent!important;box-shadow:none!important;color:inherit!important;font-size:0!important;line-height:1;letter-spacing:0}.game-title-actions .language-icon-button svg,.shared-game-language-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.shared-game-language{position:relative;display:flex;align-items:center}.shared-game-language-icon{display:grid;place-items:center;cursor:pointer}.game-title-actions .language-icon-button:hover,.game-title-actions .language-icon-button:focus-visible,.shared-game-language-icon:hover,.shared-game-language-icon:focus-visible{color:#ffe7ac;outline:none}.shared-game-language-menu,.game-title-actions .language-popover{position:absolute!important;right:0!important;top:calc(100% + 5px)!important;z-index:1200!important;align-items:center!important;grid-auto-flow:column!important;grid-template-columns:none!important;flex-direction:row!important;gap:6px!important;padding:8px 10px!important;border:0!important;border-radius:8px!important;background:rgba(15,20,27,.94)!important;box-shadow:0 18px 48px rgba(0,0,0,.38)!important;white-space:nowrap}.shared-game-language-menu{display:flex}.shared-game-language-menu[hidden]{display:none!important}.game-title-actions .language-popover{display:none!important}.game-title-actions .compact-language:hover .language-popover,.game-title-actions .compact-language:focus-within .language-popover,.game-title-actions .compact-language[data-language-open=true] .language-popover{display:flex!important}.shared-game-language-menu button,.game-title-actions .language-popover button{min-width:0!important;min-height:0!important;width:auto!important;padding:2px 4px!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;font-size:13px!important;font-weight:900!important;line-height:1.2!important;cursor:pointer}.game-title-actions .language-popover button + button::before{content:none!important}.shared-game-language-menu span,.game-title-actions .language-popover .shared-language-divider{font-size:13px;font-weight:900;color:inherit}.shared-game-language-menu button[aria-pressed=true],.game-title-actions .language-popover button[aria-pressed=true],.game-title-actions .language-popover button.active{color:#ffe7ac!important;text-decoration:underline;text-underline-offset:4px}@media(max-width:620px){.header,.top-bar,.jump-header{align-items:flex-start}.header{position:relative;display:block;padding-top:50px}.header>.game-title-actions{position:absolute;right:0;top:0}.game-title-actions{gap:4px}.game-title-actions .space-home-link,.game-title-actions .jump-home-link,.game-title-actions .home-link{padding:7px 9px;min-height:32px}}`;
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
