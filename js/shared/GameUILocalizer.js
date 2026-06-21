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
  'Standard 4D graph Go on configurable (x,y,z,w) boards. Default size: 5 x 5 x 5 x 5.': '標準 4D 圖圍棋，可設定 (x,y,z,w) 棋盤。預設大小：5 x 5 x 5 x 5。',
  'Standard 4D graph Reversi on empty Jump-style 4D boards, with only the alternating center 2 x 2 x 2 x 2 opening occupied.': '標準 4D 圖黑白棋，使用跳棋式空 4D 棋盤，開局只佔據中心 2 x 2 x 2 x 2 的交錯位置。',
  'Every (x,y,z,w) coordinate is a playable vertex. Liberties are only the eight possible 4D axis-neighbors inside the board; no diagonal liberties. A six-face enclosure in one 3D slice is not a capture if the two w-direction liberties remain open. Captures, suicide, superko, and territory use this full 4D graph.': '每個 (x,y,z,w) 座標都是可下的頂點。氣只來自棋盤內八個可能的 4D 軸向鄰居，沒有斜向氣。若同一個 3D 切片內只被六面包住，但 w 方向兩側仍有氣，就不算被提。提子、自殺、超劫與地盤都依照完整 4D 圖計算。',
  'Every (x,y,z,w) coordinate is a playable Reversi vertex. Legal moves bracket opponent chains along 4D topology-aware rays. There are 80 possible ray directions on an interior 4D point.': '每個 (x,y,z,w) 座標都是可下的黑白棋頂點。合法著法會沿著符合 4D 拓撲的射線夾住對手棋鏈。4D 內部點共有 80 個可能射線方向。',
  'Select a highlighted vertex for Black.': '請為黑方選擇高亮頂點。',
  'Select a highlighted vertex for White.': '請為白方選擇高亮頂點。',
  'Select an empty vertex for Black.': '請為黑方選擇空頂點。',
  'Select an empty vertex for White.': '請為白方選擇空頂點。',
  'No active selection.': '目前沒有選取。',
  'Board View': '棋盤視角',
  'Time Layer': '時間層',
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
  'Cancel': '取消'
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
