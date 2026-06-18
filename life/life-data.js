export const LIFE_MODES = [
  {
    id: "classic-life",
    title: "Classic Life",
    zhTitle: "經典生命遊戲",
    short: "Start with Conway-style cells and watch simple local rules create surprising patterns.",
    zhShort: "從 Conway 風格細胞開始，看簡單局部規則生成意外複雜的圖樣。",
    long: "A clean zero-player entry point: seed living cells, press play, and observe gliders, still lifes, oscillators, growth, extinction, and emergent structure.",
    zhLong: "最乾淨的零人入口：播種活細胞、按下開始，觀察滑翔機、靜物、振盪器、成長、滅絕與湧現結構。",
    tags: ["zero-player", "one-player", "biology", "patterns"],
    zhTags: ["零人", "單人", "生物", "圖樣"],
    topology: "open",
    species: 1
  },
  {
    id: "life-on-a-torus",
    title: "Life on a Torus",
    zhTitle: "環面上的生命",
    short: "Edges wrap around, so life can travel endlessly across the board.",
    zhShort: "邊界會週期性接回來，所以生命圖樣可以在棋盤上不斷穿越。",
    long: "The left/right and top/bottom edges connect. Patterns leaving one side return from the opposite side, changing collisions, survival, and long-term cycles.",
    zhLong: "左右與上下邊界相連。離開一側的圖樣會從另一側回來，改變碰撞、存活與長期循環。",
    tags: ["zero-player", "topology", "torus", "research"],
    zhTags: ["零人", "拓撲", "環面", "研究"],
    topology: "torus",
    species: 1
  },
  {
    id: "life-on-a-mobius-strip",
    title: "Life on a Möbius Strip",
    zhTitle: "莫比烏斯帶上的生命",
    short: "Cross one edge and return flipped, turning orientation into a strategic feature.",
    zhShort: "穿過邊界後會翻轉回來，讓方向性成為策略特徵。",
    long: "The horizontal boundary identifies with a twist. Moving across the seam reverses position, letting familiar patterns collide with mirrored versions of themselves.",
    zhLong: "水平邊界帶有扭轉。跨過接縫會反轉位置，使熟悉圖樣與自己的鏡像版本碰撞。",
    tags: ["zero-player", "topology", "mobius", "orientation"],
    zhTags: ["零人", "拓撲", "莫比烏斯", "方向性"],
    topology: "mobius",
    species: 1
  },
  {
    id: "life-on-a-sphere",
    title: "Life on a Sphere",
    zhTitle: "球面上的生命",
    short: "Explore life on a curved world with no ordinary edge or corner.",
    zhShort: "在沒有普通邊與角落的曲面世界中探索生命。",
    long: "A spherical latitude-style projection changes how neighborhoods close near the top and bottom, replacing flat-board edge effects with pole-like behavior.",
    zhLong: "球面緯線式投影會改變上下端附近的鄰域閉合方式，用類極點行為取代平面棋盤的邊界效應。",
    tags: ["zero-player", "topology", "sphere", "cosmology"],
    zhTags: ["零人", "拓撲", "球面", "宇宙學"],
    topology: "sphere",
    species: 1
  },
  {
    id: "3d-voxel-life",
    title: "3D Voxel Life",
    zhTitle: "3D 體素生命",
    short: "Grow cells in a volume instead of a plane.",
    zhShort: "讓細胞在體積中成長，而不是只在平面上演化。",
    long: "A 3D cellular-automaton preview with layered voxel neighborhoods. Watch shells, clusters, tunnels, and extinction fronts form across slices.",
    zhLong: "具有分層體素鄰域的 3D cellular automaton 預覽。觀察殼層、群聚、通道與滅絕前沿如何在切片間形成。",
    tags: ["zero-player", "3d", "voxel", "research"],
    zhTags: ["零人", "3D", "體素", "研究"],
    topology: "torus",
    species: 1,
    dimensions: 3
  },
  {
    id: "noisy-life",
    title: "Noisy Life",
    zhTitle: "噪聲生命",
    short: "Add random births and deaths to test whether patterns survive disorder.",
    zhShort: "加入隨機出生與死亡，測試圖樣能否在無序中存活。",
    long: "Noise perturbs the update rule, modeling uncertainty, thermal fluctuation, environmental stress, or observation error.",
    zhLong: "噪聲會擾動更新規則，可用來表示不確定性、熱擾動、環境壓力或觀測誤差。",
    tags: ["zero-player", "noise", "statistics", "complex systems"],
    zhTags: ["零人", "噪聲", "統計", "複雜系統"],
    topology: "torus",
    noise: 0.02,
    species: 1
  },
  {
    id: "age-structured-life",
    title: "Age-Structured Life",
    zhTitle: "年齡結構生命",
    short: "Cells age, weaken, and die even if their neighborhood looks stable.",
    zhShort: "即使鄰域看似穩定，細胞也會老化、衰弱與死亡。",
    long: "Each cell carries an age. Long-lived cells can fade, producing turnover, succession, waves, and population renewal.",
    zhLong: "每個細胞帶有年齡。長壽細胞可能逐漸消退，產生汰換、演替、波動與族群更新。",
    tags: ["zero-player", "age", "biology", "ecology"],
    zhTags: ["零人", "年齡", "生物", "生態"],
    topology: "open",
    maxAge: 8,
    species: 1
  },
  {
    id: "species-war",
    title: "Species War",
    zhTitle: "物種戰爭",
    short: "Two species compete for space under the same life-like rules.",
    zhShort: "兩個物種在相同類生命規則下競爭空間。",
    long: "Red and cyan species reproduce, collide, invade, and form territories. Use it as a two-player seed-and-watch game or a research toy for competition.",
    zhLong: "紅色與青色物種會繁殖、碰撞、入侵並形成領地。可作為雙人播種後觀察的遊戲，也可作為競爭研究玩具。",
    tags: ["zero-player", "two-player", "species", "competition"],
    zhTags: ["零人", "雙人", "物種", "競爭"],
    topology: "torus",
    species: 2
  },
  {
    id: "ecosystem-balance",
    title: "Ecosystem Balance",
    zhTitle: "生態系平衡",
    short: "Multiple species compete, coexist, collapse, or balance.",
    zhShort: "多物種會競爭、共存、崩潰或達到平衡。",
    long: "A multi-species sandbox for coexistence and instability. It is useful for ecology, population dynamics, and complex-systems intuition.",
    zhLong: "用於共存與不穩定性的多物種沙盒。適合培養生態、族群動力學與複雜系統直覺。",
    tags: ["zero-player", "research", "ecology", "species"],
    zhTags: ["零人", "研究", "生態", "物種"],
    topology: "torus",
    species: 3,
    mutation: 0.01
  },
  {
    id: "research-sandbox",
    title: "Research Sandbox",
    zhTitle: "研究沙盒",
    short: "Tune topology, noise, age, mutation, and species count directly.",
    zhShort: "直接調整拓撲、噪聲、年齡、突變與物種數。",
    long: "A flexible experimental workspace for researchers and advanced players. Adjust topology and stochastic parameters, then export observations later.",
    zhLong: "給研究者與進階玩家使用的彈性實驗工作區。調整拓撲與隨機參數，之後匯出觀測結果。",
    tags: ["research", "sandbox", "statistics", "AI"],
    zhTags: ["研究", "沙盒", "統計", "AI"],
    topology: "torus",
    species: 3,
    noise: 0.01,
    mutation: 0.01,
    maxAge: 12
  }
];

export function findLifeMode(id) {
  return LIFE_MODES.find((mode) => mode.id === id) || LIFE_MODES[0];
}

export function modeTitle(mode, language = 'en') {
  return language === 'zh' ? (mode.zhTitle || mode.title) : mode.title;
}

export function modeShort(mode, language = 'en') {
  return language === 'zh' ? (mode.zhShort || mode.short) : mode.short;
}

export function modeLong(mode, language = 'en') {
  return language === 'zh' ? (mode.zhLong || mode.long) : mode.long;
}

export function modeTags(mode, language = 'en') {
  return language === 'zh' ? (mode.zhTags || mode.tags) : mode.tags;
}
