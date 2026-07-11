import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const steamDist = path.join(root, 'dist-steam', 'app');
const mainEntry = path.join(root, 'local-app', 'electron', 'main.cjs');
const explicitExe = process.env.TOPOBOARDGAME_STEAM_SMOKE_EXE || '';

const targets = [
  { name: '2D Go', href: './2D/2dgo/' },
  { name: '2D Reversi', href: './2D/2dreversi/' },
  { name: '2D Jump', href: './2D/jump/' },
  { name: '3D Go', href: './3D/3dgo/' },
  { name: '4D Go', href: './4D/4dgo/' },
  { name: 'Labs', href: './algebraic/?ui=simple' },
  { name: 'Life World', href: './life/world.html' }
];

function launchOptions() {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.TOPOBOARDGAME_ELECTRON_DEV;
  env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  env.TBG_STEAM_DEBUG = '0';

  if (explicitExe) {
    return { executablePath: explicitExe, env };
  }
  return { args: [mainEntry], env };
}

function looksLikeBlankWhite(snapshot) {
  const background = String(snapshot.background || '').replace(/\s+/g, '').toLowerCase();
  return snapshot.textLength < 20
    && snapshot.canvasCount === 0
    && (background === 'rgb(255,255,255)' || background === '#fff' || background === '#ffffff');
}

async function assertHealthyPage(page, name) {
  await page.waitForTimeout(1800);
  const snapshot = await page.evaluate(() => {
    const body = document.body;
    const style = body ? getComputedStyle(body) : null;
    return {
      href: location.href,
      textLength: (body?.innerText || '').trim().length,
      canvasCount: document.querySelectorAll('canvas').length,
      controlsCount: document.querySelectorAll('button, select, input, textarea').length,
      errorOverlay: Boolean(document.querySelector('#tbg-steam-error-overlay')),
      background: style?.backgroundColor || ''
    };
  });

  assert.equal(snapshot.errorOverlay, false, `${name} opened the Steam error overlay at ${snapshot.href}`);
  assert.equal(looksLikeBlankWhite(snapshot), false, `${name} looks like a blank white screen at ${snapshot.href}`);
  assert.ok(
    snapshot.textLength > 100 || snapshot.canvasCount > 0,
    `${name} did not render enough visible text or canvas content at ${snapshot.href}`
  );
  assert.ok(
    snapshot.controlsCount > 0 || snapshot.canvasCount > 0,
    `${name} did not expose controls or a board canvas at ${snapshot.href}`
  );
}

async function exposeLauncherOptions(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.dimension-card').forEach((card) => {
      card.classList.add('is-collapsible');
      card.setAttribute('data-expanded', 'true');
    });
    document.querySelectorAll('details').forEach((details) => {
      details.open = true;
    });
  });
}

if (!fs.existsSync(path.join(steamDist, 'index.html'))) {
  console.error('[steam-smoke-test] Missing dist-steam/app/index.html. Run npm run build:steam first.');
  process.exit(1);
}

let app;
try {
  app = await electron.launch(launchOptions());
  const page = await app.firstWindow();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !/favicon|Firebase config|Online unavailable|ERR_INTERNET_DISCONNECTED/i.test(text)) {
      pageErrors.push(text);
    }
  });

  await page.waitForLoadState('domcontentloaded');
  await exposeLauncherOptions(page);
  await assertHealthyPage(page, 'Main menu');
  const homeUrl = page.url();

  for (const target of targets) {
    await page.goto(homeUrl);
    await page.waitForLoadState('domcontentloaded');
    await exposeLauncherOptions(page);
    const link = page.locator(`a[href^="${target.href}"]`).first();
    await link.waitFor({ state: 'visible', timeout: 10000 });
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    await assertHealthyPage(page, target.name);
  }

  assert.deepEqual(pageErrors, [], `Renderer errors during Steam smoke test:\n${pageErrors.join('\n')}`);
  console.log('Steam smoke test passed: main menu and representative Steam-visible pages render without white screens.');
} finally {
  if (app) await app.close();
}
