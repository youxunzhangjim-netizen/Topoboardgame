export const LIFE_MODIFIERS = [
  {
    id: 'noise',
    title: 'Noise / disorder',
    zhTitle: '噪聲 / 無序',
    description: 'Add random births, random deaths, rule slips, environmental stress, or topology defects to any Life board.',
    zhDescription: '把隨機出生、隨機死亡、規則偏差、環境壓力或拓撲缺陷套用到任何生命棋盤。'
  },
  {
    id: 'age',
    title: 'Age structure',
    zhTitle: '年齡結構',
    description: 'Let every cell carry age, old-age decay, young-birth advantage, and age-dependent survival pressure.',
    zhDescription: '讓每個細胞帶有年齡、老化衰減、幼年出生加成與年齡相依存活壓力。'
  },
  {
    id: 'species',
    title: 'Species / competition',
    zhTitle: '物種 / 競爭',
    description: 'Use multiple species for invasion, coexistence, mutation, and two-player competition.',
    zhDescription: '使用多物種來研究入侵、共存、突變與雙人競爭。'
  }
];

export const LIFE_GEOMETRIES = [
  { id: 'r2', title: 'R2 Open Plane', zhTitle: 'R2 開放平面', dimension: 2, topology: 'open', view: 'flat', latticeSet: '2d' },
  { id: 't2_flat', title: 'T2 Torus Cut-Open Board', zhTitle: 'T2 環面 2D 棋盤', dimension: 2, topology: 'torus', view: 'flat', latticeSet: '2d' },
  { id: 'cylinder', title: 'Cylinder Surface', zhTitle: 'Cylinder 曲面生命', dimension: 2, topology: 'cylinder', view: 'surface3d', latticeSet: '2d' },
  { id: 't2', title: 'T2 Torus Surface', zhTitle: 'T2 環面曲面', dimension: 2, topology: 'torus', view: 'surface3d', latticeSet: '2d' },
  { id: 'mobius', title: 'Möbius Strip Surface', zhTitle: 'Mobius 帶生命', dimension: 2, topology: 'mobius', view: 'surface3d', latticeSet: '2d' },
  { id: 'klein', title: 'Klein Bottle 2D Board', zhTitle: 'Klein 瓶 2D 棋盤', dimension: 2, topology: 'klein', view: 'flat', latticeSet: '2d' },
  { id: 'klein_surface', title: 'Klein Bottle 3D Surface', zhTitle: 'Klein 瓶 3D 曲面', dimension: 2, topology: 'klein', view: 'surface3d', latticeSet: '2d' },
  { id: 'sphere', title: 'S2 Sphere Surface', zhTitle: 'S2 球面生命', dimension: 2, topology: 'sphere', view: 'surface3d', latticeSet: '2d' },
  { id: 'rp2', title: 'RP2 Projective Plane Board', zhTitle: 'RP2 投影平面 2D 棋盤', dimension: 2, topology: 'projective', view: 'flat', latticeSet: '2d' },
  { id: 'r3', title: 'R3 Open Voxel Volume', zhTitle: 'R3 體素生命', dimension: 3, topology: 'open', view: 'volume', latticeSet: '3d' },
  { id: 't3', title: 'T3 Periodic Voxel Volume', zhTitle: 'T3 週期體素生命', dimension: 3, topology: 'torus', view: 'volume', latticeSet: '3d' },
  { id: 'r3_random', title: '3D RBC Life', zhTitle: '3D RBC 生命', dimension: 3, topology: 'random', view: 'volume', latticeSet: '3d' },
  { id: 'reflective', title: 'Reflective 3D Life', zhTitle: '反射邊界 3D 生命', dimension: 3, topology: 'reflective', view: 'volume', latticeSet: '3d' }
];

export const LIFE_GEOMETRY_INFO = {
  r2: {
    dimension: '2D',
    topology: 'Open plane',
    boundary: 'Cells stop at the outer edge; outside the board is empty.',
    recommendedNeighborhood: 'Moore / Chebyshev for beginners',
    player: 'This is the familiar flat board. Patterns can die when they hit an edge.',
    research: 'A finite open patch for comparing boundary loss, edge effects, and bulk behavior.',
    zhDimension: '2D',
    zhTopology: '開放平面',
    zhBoundary: '細胞到外邊界就停止；棋盤外視為空白。',
    zhRecommendedNeighborhood: '初學建議 Moore / Chebyshev',
    zhPlayer: '這是最熟悉的平面棋盤。圖樣碰到邊界時可能消失。',
    zhResearch: '有限開放區域，可比較邊界流失、邊緣效應與內部行為。'
  },
  t2_flat: {
    dimension: '2D',
    topology: 'T2 torus',
    boundary: 'Left connects to right, and top connects to bottom.',
    recommendedNeighborhood: 'Moore / Chebyshev',
    player: 'A glider leaving one side returns from the opposite side.',
    research: 'A periodic 2D lattice with no boundary, useful for bulk dynamics.',
    zhDimension: '2D',
    zhTopology: 'T2 環面',
    zhBoundary: '左邊接到右邊，上邊接到底邊。',
    zhRecommendedNeighborhood: 'Moore / Chebyshev',
    zhPlayer: '滑翔機離開一側後會從相對側回來。',
    zhResearch: '無邊界的週期 2D 格點，適合觀察體相動力學。'
  },
  t2: {
    dimension: '2D',
    topology: 'T2 torus',
    boundary: 'Both board directions wrap around periodically.',
    recommendedNeighborhood: 'Moore / Chebyshev',
    player: 'The surface looks round, but the rules are the same periodic torus board.',
    research: 'The same T2 periodic topology shown as a projected surface.',
    zhDimension: '2D',
    zhTopology: 'T2 環面',
    zhBoundary: '兩個方向都以週期方式接回。',
    zhRecommendedNeighborhood: 'Moore / Chebyshev',
    zhPlayer: '畫面看起來是曲面，但規則仍是週期環面棋盤。',
    zhResearch: '以投影曲面顯示相同的 T2 週期拓撲。'
  },
  cylinder: {
    dimension: '2D',
    topology: 'Cylinder',
    boundary: 'Horizontal edges wrap; vertical edges remain open.',
    recommendedNeighborhood: 'Von Neumann / Manhattan or Moore',
    player: 'Life can travel around the tube but can still fall off the open ends.',
    research: 'A mixed boundary condition for separating periodic and open directions.',
    zhDimension: '2D',
    zhTopology: '圓柱',
    zhBoundary: '水平方向接回；垂直方向保持開放。',
    zhRecommendedNeighborhood: 'Von Neumann / Manhattan 或 Moore',
    zhPlayer: '生命可繞著管面移動，但仍可能從開口端消失。',
    zhResearch: '混合邊界條件，可分開研究週期方向與開放方向。'
  },
  mobius: {
    dimension: '2D',
    topology: 'Mobius strip',
    boundary: 'One wrap flips the opposite coordinate before reconnecting.',
    recommendedNeighborhood: 'Moore / Chebyshev',
    player: 'Crossing the seam turns the pattern over, like walking on a twisted strip.',
    research: 'A non-orientable surface for testing rules under orientation reversal.',
    zhDimension: '2D',
    zhTopology: 'Mobius 帶',
    zhBoundary: '一個方向接回時會翻轉另一個座標。',
    zhRecommendedNeighborhood: 'Moore / Chebyshev',
    zhPlayer: '穿過接縫時圖樣會翻面，就像在扭轉帶上行走。',
    zhResearch: '不可定向曲面，可測試規則在方向反轉下的行為。'
  },
  klein: {
    dimension: '2D',
    topology: 'Klein bottle',
    boundary: 'One direction wraps normally; the other wraps with a flip.',
    recommendedNeighborhood: 'Moore / Chebyshev',
    player: 'Patterns return from another side with a twist, with no ordinary outside.',
    research: 'A closed non-orientable topology for studying glued-boundary dynamics.',
    zhDimension: '2D',
    zhTopology: 'Klein 瓶',
    zhBoundary: '一個方向正常接回；另一個方向翻轉後接回。',
    zhRecommendedNeighborhood: 'Moore / Chebyshev',
    zhPlayer: '圖樣會帶著扭轉從另一側回來，沒有普通的外側。',
    zhResearch: '封閉不可定向拓撲，用於研究黏合邊界動力學。'
  },
  klein_surface: {
    dimension: '2D',
    topology: 'Klein bottle',
    boundary: 'The same Klein glued boundary is shown as a 3D projected surface.',
    recommendedNeighborhood: 'Moore / Chebyshev',
    player: 'This view helps you see the twist, while clicks still edit the surface cells.',
    research: 'A visual embedding of the same intrinsic Klein board.',
    zhDimension: '2D',
    zhTopology: 'Klein 瓶',
    zhBoundary: '相同的 Klein 黏合邊界，以 3D 投影曲面顯示。',
    zhRecommendedNeighborhood: 'Moore / Chebyshev',
    zhPlayer: '這個視圖幫助看見扭轉，點擊仍然編輯曲面細胞。',
    zhResearch: '相同內在 Klein 棋盤的視覺嵌入。'
  },
  sphere: {
    dimension: '2D',
    topology: 'S2 sphere',
    boundary: 'Longitude wraps; crossing a pole maps to the opposite longitude.',
    recommendedNeighborhood: 'Von Neumann / Manhattan',
    player: 'Patterns can circle the globe, but the poles behave specially.',
    research: 'A sphere-like closed surface with polar identification artifacts.',
    zhDimension: '2D',
    zhTopology: 'S2 球面',
    zhBoundary: '經度接回；穿過極點會映到相對經度。',
    zhRecommendedNeighborhood: 'Von Neumann / Manhattan',
    zhPlayer: '圖樣可以繞球面移動，但極點附近有特殊行為。',
    zhResearch: '類球面封閉曲面，包含極點識別造成的離散效應。'
  },
  rp2: {
    dimension: '2D',
    topology: 'RP2 projective plane',
    boundary: 'Opposite edges reconnect with reversed orientation.',
    recommendedNeighborhood: 'Moore / Chebyshev',
    player: 'A pattern crossing the edge comes back mirrored.',
    research: 'A compact non-orientable space for orientation-reversing boundary tests.',
    zhDimension: '2D',
    zhTopology: 'RP2 投影平面',
    zhBoundary: '相對邊以反向方式接回。',
    zhRecommendedNeighborhood: 'Moore / Chebyshev',
    zhPlayer: '圖樣穿過邊界後會以鏡像方式回來。',
    zhResearch: '緊緻不可定向空間，可測試反向黏合邊界。'
  },
  r3: {
    dimension: '3D',
    topology: 'Open voxel volume',
    boundary: 'Cells outside the volume are empty.',
    recommendedNeighborhood: 'Von Neumann / Manhattan',
    player: 'Life grows inside a stack of voxel layers and can hit open walls.',
    research: 'A finite 3D domain for comparing surface loss and volume growth.',
    zhDimension: '3D',
    zhTopology: '開放體素體積',
    zhBoundary: '體積外的細胞視為空白。',
    zhRecommendedNeighborhood: 'Von Neumann / Manhattan',
    zhPlayer: '生命在多層體素中成長，可能碰到開放牆面。',
    zhResearch: '有限 3D 區域，可比較表面流失與體積成長。'
  },
  t3: {
    dimension: '3D',
    topology: 'T3 periodic voxel volume',
    boundary: 'All three axes wrap periodically.',
    recommendedNeighborhood: 'Von Neumann / Manhattan',
    player: 'Patterns leaving any face return from the opposite face.',
    research: 'A boundary-free periodic 3D lattice for bulk voxel dynamics.',
    zhDimension: '3D',
    zhTopology: 'T3 週期體素體積',
    zhBoundary: '三個軸向都以週期方式接回。',
    zhRecommendedNeighborhood: 'Von Neumann / Manhattan',
    zhPlayer: '圖樣離開任一面後會從相對面回來。',
    zhResearch: '無邊界週期 3D 格點，用於體相體素動力學。'
  },
  r3_random: {
    dimension: '3D',
    topology: 'Random/RBC boundary',
    boundary: 'Cells leaving the volume are remapped to deterministic pseudo-random sites.',
    recommendedNeighborhood: 'Lattice nearest',
    player: 'Escaping cells reappear in surprising places, making the boundary feel scrambled.',
    research: 'A deterministic random-boundary condition for stress-testing locality.',
    zhDimension: '3D',
    zhTopology: '隨機 / RBC 邊界',
    zhBoundary: '離開體積的細胞會被映到決定性的偽隨機位置。',
    zhRecommendedNeighborhood: 'Lattice nearest',
    zhPlayer: '離開的細胞會在意外位置出現，讓邊界像被打散。',
    zhResearch: '決定性隨機邊界條件，用於壓力測試局域性。'
  },
  reflective: {
    dimension: '3D',
    topology: 'Reflective volume',
    boundary: 'Cells bounce back across each boundary face.',
    recommendedNeighborhood: 'Von Neumann / Manhattan',
    player: 'Growth reflects from the walls instead of disappearing or wrapping.',
    research: 'A mirror boundary for studying confinement and reflected fronts.',
    zhDimension: '3D',
    zhTopology: '反射體積',
    zhBoundary: '細胞會在每個邊界面反射回來。',
    zhRecommendedNeighborhood: 'Von Neumann / Manhattan',
    zhPlayer: '成長前緣會從牆面反射，而不是消失或週期接回。',
    zhResearch: '鏡像邊界，可研究侷限效應與反射前緣。'
  }
};

export const LIFE_LATTICES = {
  '2d': [
    { id: 'square', title: 'Square', zhTitle: '方格' },
    { id: 'triangular', title: 'Triangular', zhTitle: '三角格' },
    { id: 'honeycomb', title: 'Honeycomb', zhTitle: '蜂巢格' }
  ],
  '3d': [
    { id: 'sc', title: 'SC simple cubic', zhTitle: 'SC 簡單立方' },
    { id: 'bcc', title: 'BCC body-centered cubic', zhTitle: 'BCC 體心立方' },
    { id: 'fcc', title: 'FCC face-centered cubic', zhTitle: 'FCC 面心立方' },
    { id: 'hcp', title: 'HCP hexagonal close-packed', zhTitle: 'HCP 六方密堆' }
  ]
};

export const LIFE_MODES = [
  {
    id: 'moore-life',
    title: 'Moore Neighborhood Mode',
    zhTitle: 'Moore 鄰域模式',
    short: 'Classic surrounding-neighbor Life: each cell reacts to the full local ring around it.',
    zhShort: '經典環繞鄰域生命：每個細胞會感受到周圍完整局部環。',
    long: 'Use this for Conway-style Life and most visual pattern play. The Life rule stays the same while you choose the board space separately: R2, T2, Möbius, Klein, S2, RP2, R3, T3, or reflective 3D. Noise, age, mutation, and species are modifiers.',
    zhLong: '用於 Conway 風格生命與大多數圖樣玩法。生命規則保持相同，棋盤空間另外選：R2、T2、Mobius、Klein、S2、RP2、R3、T3 或反射 3D。噪聲、年齡、突變與物種是附加功能。',
    tags: ['zero-player', 'one-player', 'two-player', 'Moore'],
    zhTags: ['零人', '單人', '雙人', 'Moore'],
    geometry: 'r2',
    topology: 'open',
    lattice: 'square',
    neighborhoodType: 'moore',
    species: 1
  },
  {
    id: 'von-neumann-life',
    title: 'Von Neumann Neighborhood Mode',
    zhTitle: 'Von Neumann 鄰域模式',
    short: 'Cross-shaped local interaction: cells respond only through axial nearest directions.',
    zhShort: '十字形局部互動：細胞只透過軸向最近方向感受鄰居。',
    long: 'Use this when you want more directional, less diagonal growth. The selected geometry still controls how boundaries wrap, flip, or close, but the local rule uses the Von Neumann neighborhood.',
    zhLong: '適合需要更有方向性、較少對角成長的情況。選定幾何仍決定邊界如何接回、翻轉或閉合，但局部規則使用 Von Neumann 鄰域。',
    tags: ['zero-player', 'one-player', 'two-player', 'Von Neumann'],
    zhTags: ['零人', '單人', '雙人', 'Von Neumann'],
    geometry: 'r2',
    topology: 'open',
    lattice: 'square',
    neighborhoodType: 'von_neumann',
    species: 1
  },
  {
    id: 'lattice-nearest-life',
    title: 'Lattice Nearest-Neighbor Mode',
    zhTitle: '格點最近鄰模式',
    short: 'Use the native nearest neighbors of the selected lattice: square, triangular, honeycomb, SC, BCC, FCC, or HCP.',
    zhShort: '使用所選格點的原生最近鄰：方格、三角格、蜂巢格、SC、BCC、FCC 或 HCP。',
    long: 'Use this to compare the same Life rule on different lattice forms without changing the high-level game. Geometry and lattice become the main experimental choices; age, noise, species, and challenges remain optional modifiers.',
    zhLong: '用這個模式比較相同生命規則在不同格點形式上的行為，而不改變高層遊戲。幾何與格點成為主要實驗選項；年齡、噪聲、物種與挑戰仍是可選附加功能。',
    tags: ['zero-player', 'one-player', 'two-player', 'nearest lattice'],
    zhTags: ['零人', '單人', '雙人', '最近鄰格點'],
    geometry: 'r2',
    topology: 'open',
    lattice: 'square',
    neighborhoodType: 'nearest',
    species: 1
  }
];

export function findLifeMode(id) {
  return LIFE_MODES.find((mode) => mode.id === id) || LIFE_MODES[0];
}

export function findLifeGeometry(id) {
  const normalized = id === 'klein_flat' ? 'klein' : id;
  return LIFE_GEOMETRIES.find((geometry) => geometry.id === normalized) || LIFE_GEOMETRIES[0];
}

export function latticesForGeometry(geometryId) {
  const geometry = findLifeGeometry(geometryId);
  return LIFE_LATTICES[geometry.latticeSet] || LIFE_LATTICES['2d'];
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

export function geometryTitle(geometry, language = 'en') {
  return language === 'zh' ? (geometry.zhTitle || geometry.title) : geometry.title;
}

export function geometryInfo(geometryId, language = 'en') {
  const geometry = findLifeGeometry(geometryId);
  const info = LIFE_GEOMETRY_INFO[geometry.id] || LIFE_GEOMETRY_INFO[geometry.topology] || LIFE_GEOMETRY_INFO.r2;
  if (language !== 'zh') return info;
  return {
    ...info,
    dimension: info.zhDimension || info.dimension,
    topology: info.zhTopology || info.topology,
    boundary: info.zhBoundary || info.boundary,
    recommendedNeighborhood: info.zhRecommendedNeighborhood || info.recommendedNeighborhood,
    player: info.zhPlayer || info.player,
    research: info.zhResearch || info.research
  };
}

export function latticeTitle(lattice, language = 'en') {
  return language === 'zh' ? (lattice.zhTitle || lattice.title) : lattice.title;
}
