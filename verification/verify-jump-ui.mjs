import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.TOPOBOARDGAME_TEST_URL || 'http://127.0.0.1:5172';
const output = path.resolve('test-results', 'jump-ui');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function verifyPage({
  name,
  query,
  viewport,
  language
}) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Firebase config|favicon/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/3D/jump/${query}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.jumpApp?.game));

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    canvasWidth: document.querySelector('#jumpCanvas')?.getBoundingClientRect().width || 0,
    canvasHeight: document.querySelector('#jumpCanvas')?.getBoundingClientRect().height || 0,
    language: document.documentElement.lang
  }));
  assert.ok(layout.overflow <= 2, `${name} must not overflow horizontally`);
  assert.ok(layout.canvasWidth >= Math.min(320, viewport.width - 24), `${name} canvas must remain usable`);
  assert.ok(layout.canvasHeight >= 360, `${name} canvas must remain tall enough`);

  const firstPiece = page.locator('#jumpMovablePiecesList button').first();
  await firstPiece.click();
  const firstMove = page.locator('#jumpMoveOptionsList button').first();
  await firstMove.waitFor();
  const before = await page.evaluate(() => ({
    currentPlayer: window.jumpApp.game.currentPlayer,
    pieces: JSON.stringify([...window.jumpApp.game.pieces.entries()])
  }));
  await firstMove.click();
  const afterPreview = await page.evaluate(() => ({
    currentPlayer: window.jumpApp.game.currentPlayer,
    pieces: JSON.stringify([...window.jumpApp.game.pieces.entries()]),
    summary: document.querySelector('#jumpMoveSummary')?.textContent || ''
  }));
  assert.deepEqual(afterPreview.currentPlayer, before.currentPlayer, `${name} first move click must not change turn`);
  assert.deepEqual(afterPreview.pieces, before.pieces, `${name} first move click must not change pieces`);
  assert.equal(await firstMove.getAttribute('aria-pressed'), 'true', `${name} first move click must select the move`);
  if (language === 'zh') assert.match(afterPreview.summary, /\u518d\u9ede\u4e00\u6b21/);
  else assert.match(afterPreview.summary, /Select it again to move/i);

  await firstMove.click();
  const afterCommit = await page.evaluate(() => JSON.stringify([...window.jumpApp.game.pieces.entries()]));
  assert.notEqual(afterCommit, before.pieces, `${name} second move click must apply the move`);

  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  assert.deepEqual(errors, [], `${name} console errors`);
  await page.close();
}

try {
  await verifyPage({
    name: 'cylinder-en-desktop',
    query: '?topology=cylinder&lattice=triangular&lang=en',
    viewport: { width: 1440, height: 1000 },
    language: 'en'
  });
  await verifyPage({
    name: 'torus-zh-mobile',
    query: '?topology=torus&lattice=square&lang=zh',
    viewport: { width: 390, height: 844 },
    language: 'zh'
  });
  console.log(`Jump bilingual responsive UI verification passed. Screenshots: ${output}`);
} finally {
  await browser.close();
}
