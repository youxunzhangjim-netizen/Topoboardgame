import { LIFE_MODES, modeTitle, modeShort, modeLong, modeTags } from './life-data.js';
import { currentLifeLanguage, localizeStaticText, syncLifeLinks } from './js/i18n.js';

const language = currentLifeLanguage();
localizeStaticText(document, language);
syncLifeLinks(language);

const grid = document.getElementById('lifeModeGrid');
const dialog = document.getElementById('lifeInfoDialog');
const dialogTitle = document.getElementById('dialogTitle');
const dialogDescription = document.getElementById('dialogDescription');
const dialogTags = document.getElementById('dialogTags');
const dialogPlayers = document.getElementById('dialogPlayers');
const dialogSystem = document.getElementById('dialogSystem');
const dialogObservables = document.getElementById('dialogObservables');

const TEXT = {
  en: {
    playOpen: 'Play Mode',
    info: 'Info',
    playersZero: 'Zero-player simulation with one-player seeding and editing.',
    playersTwo: 'Zero-player or two-player seed-and-watch competition.',
    playersResearch: 'Zero-player, one-player, two-player, and research use.',
    system: 'Topology',
    speciesUnit: 'species',
    stochasticNoise: 'stochastic noise',
    cellAging: 'cell aging',
    mutation: 'mutation',
    observables: 'population, births, deaths, age distribution, pattern survival, cycle behavior'
  },
  zh: {
    playOpen: '遊玩模式',
    info: '資訊',
    playersZero: '零人模擬，可由單人播種與編輯。',
    playersTwo: '零人或雙人播種後觀察競爭。',
    playersResearch: '支援零人、單人、雙人與研究用途。',
    system: '拓撲',
    speciesUnit: '物種',
    stochasticNoise: '隨機噪聲',
    cellAging: '細胞老化',
    mutation: '突變',
    observables: '族群、出生、死亡、年齡分布、圖樣存活、週期行為'
  }
};

function tr(key) {
  return TEXT[language]?.[key] || TEXT.en[key] || key;
}

function previewCells(index) {
  const cells = [];
  for (let i = 0; i < 25; i += 1) {
    const active = ((i + index) % 7 === 0) || ((i * 3 + index) % 11 === 0) || (index % 3 === 0 && i === 12);
    const species = (i + index) % 2 === 0 ? 'live-a' : 'live-b';
    cells.push(`<i class="${active ? species : ''}"></i>`);
  }
  return cells.join('');
}

function playerLabel(mode) {
  if (mode.tags.includes('two-player')) return tr('playersTwo');
  if (mode.tags.includes('research')) return tr('playersResearch');
  return tr('playersZero');
}

function systemLabel(mode) {
  const parts = [`${tr('system')}: ${mode.topology}`];
  if (mode.species > 1) parts.push(`${mode.species} ${tr('speciesUnit')}`);
  if (mode.noise) parts.push(tr('stochasticNoise'));
  if (mode.maxAge) parts.push(tr('cellAging'));
  if (mode.mutation) parts.push(tr('mutation'));
  return parts.join(', ');
}

function observableLabel(mode) {
  if (mode.id === 'species-war') return language === 'zh' ? '各物種族群、領地平衡、滅絕時間、入侵前沿' : 'population by species, territory balance, extinction time, invasion fronts';
  if (mode.id === 'ecosystem-balance') return language === 'zh' ? '族群平衡、共存、崩潰、恢復、多樣性' : 'population balance, coexistence, collapse, recovery, diversity';
  if (mode.id === '3d-voxel-life') return language === 'zh' ? '活體素、分層密度、群聚成長、3D 滅絕' : 'active voxels, layer density, cluster growth, 3D extinction';
  return tr('observables');
}

function openInfo(mode) {
  dialogTitle.textContent = modeTitle(mode, language);
  dialogDescription.textContent = modeLong(mode, language);
  dialogTags.textContent = modeTags(mode, language).join(' · ');
  dialogPlayers.textContent = playerLabel(mode);
  dialogSystem.textContent = systemLabel(mode);
  dialogObservables.textContent = observableLabel(mode);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

grid.innerHTML = LIFE_MODES.map((mode, index) => `
  <article class="life-card">
    <div class="life-card-head">
      <div>
        <p class="eyebrow">${modeTags(mode, language).slice(0, 3).join(' · ')}</p>
        <h2>${modeTitle(mode, language)}</h2>
      </div>
      <span class="life-cell-preview" aria-hidden="true">${previewCells(index)}</span>
    </div>
    <p>${modeShort(mode, language)}</p>
    <div class="life-tags">
      ${modeTags(mode, language).map((tag) => `<span>${tag}</span>`).join('')}
    </div>
    <div class="life-card-actions">
      <a class="life-button" href="./world.html?mode=${encodeURIComponent(mode.id)}&lang=${language}">${tr('playOpen')}</a>
      <button class="info-button" type="button" data-info="${mode.id}">${tr('info')}</button>
    </div>
  </article>
`).join('');

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-info]');
  if (!button) return;
  const mode = LIFE_MODES.find((item) => item.id === button.dataset.info);
  if (mode) openInfo(mode);
});
