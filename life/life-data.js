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
  { id: 't2', title: 'T2 Torus / Periodic Surface', zhTitle: 'T2 環面生命', dimension: 2, topology: 'torus', view: 'surface3d', latticeSet: '2d' },
  { id: 'mobius', title: 'Möbius Strip Surface', zhTitle: 'Mobius 帶生命', dimension: 2, topology: 'mobius', view: 'surface3d', latticeSet: '2d' },
  { id: 'klein', title: 'Klein Bottle Surface', zhTitle: 'Klein 瓶生命', dimension: 2, topology: 'klein', view: 'surface3d', latticeSet: '2d' },
  { id: 'sphere', title: 'S2 Sphere Surface', zhTitle: 'S2 球面生命', dimension: 2, topology: 'sphere', view: 'surface3d', latticeSet: '2d' },
  { id: 'rp2', title: 'RP2 Projective Surface', zhTitle: 'RP2 投影平面生命', dimension: 2, topology: 'projective', view: 'surface3d', latticeSet: '2d' },
  { id: 'r3', title: 'R3 Open Voxel Volume', zhTitle: 'R3 體素生命', dimension: 3, topology: 'open', view: 'volume', latticeSet: '3d' },
  { id: 't3', title: 'T3 Periodic Voxel Volume', zhTitle: 'T3 週期體素生命', dimension: 3, topology: 'torus', view: 'volume', latticeSet: '3d' },
  { id: 'r3_random', title: '3D RBC Life', zhTitle: '3D RBC 生命', dimension: 3, topology: 'random', view: 'volume', latticeSet: '3d' },
  { id: 'reflective', title: 'Reflective 3D Life', zhTitle: '反射邊界 3D 生命', dimension: 3, topology: 'reflective', view: 'volume', latticeSet: '3d' }
];

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
  return LIFE_GEOMETRIES.find((geometry) => geometry.id === id) || LIFE_GEOMETRIES[0];
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

export function latticeTitle(lattice, language = 'en') {
  return language === 'zh' ? (lattice.zhTitle || lattice.title) : lattice.title;
}
