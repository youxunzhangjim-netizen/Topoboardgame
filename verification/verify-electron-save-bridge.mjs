import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const temporaryDocuments = fs.mkdtempSync(path.join(os.tmpdir(), 'topoboardgame-electron-save-'));
const expectedDirectory = path.join(temporaryDocuments, 'TopologicalBoardGame');
const expectedFile = path.join(expectedDirectory, 'save.json');
let electronApp;

async function launchElectron() {
  const electronEnvironment = { ...process.env };
  delete electronEnvironment.ELECTRON_RUN_AS_NODE;
  return electron.launch({
    args: [path.join(root, 'local-app', 'electron', 'main.cjs')],
    env: {
      ...electronEnvironment,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      TOPOBOARDGAME_TEST_DOCUMENTS_PATH: temporaryDocuments
    }
  });
}

try {
  assert.equal(fs.existsSync(path.join(root, 'dist', 'index.html')), true, 'Run npm run build before this check.');
  electronApp = await launchElectron();

  const page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  const savePath = await page.evaluate(() => window.TopoboardgameLocalApp.getSavePath());
  assert.equal(savePath.ok, true);
  assert.equal(path.normalize(savePath.directory), path.normalize(expectedDirectory));
  assert.equal(path.normalize(savePath.path), path.normalize(expectedFile));

  await page.evaluate(() => {
    localStorage.setItem('topoboardgame:electron-smoke', 'cloud-ready');
  });
  await page.waitForTimeout(800);
  assert.equal(fs.existsSync(expectedFile), true);
  let saved = JSON.parse(fs.readFileSync(expectedFile, 'utf8'));
  assert.equal(saved.localStorage['topoboardgame:electron-smoke'], 'cloud-ready');

  const slotResult = await page.evaluate(() => window.TopoboardgameLocalApp.saveGame(
    'electron-smoke',
    { family: 'go', moveNumber: 7 },
    { label: 'Electron smoke test' }
  ));
  assert.equal(slotResult.ok, true);

  const loaded = await page.evaluate(() => window.TopoboardgameLocalApp.loadGame('electron-smoke'));
  assert.equal(loaded.ok, true);
  assert.equal(loaded.found, true);
  assert.equal(loaded.record.data.moveNumber, 7);

  saved = JSON.parse(fs.readFileSync(expectedFile, 'utf8'));
  assert.equal(saved.gameStates['electron-smoke'].metadata.label, 'Electron smoke test');

  await electronApp.close();
  electronApp = await launchElectron();
  const restoredPage = await electronApp.firstWindow();
  await restoredPage.waitForLoadState('domcontentloaded');
  assert.equal(
    await restoredPage.evaluate(() => localStorage.getItem('topoboardgame:electron-smoke')),
    'cloud-ready'
  );
  const restoredSlot = await restoredPage.evaluate(() => window.TopoboardgameLocalApp.loadGame('electron-smoke'));
  assert.equal(restoredSlot.record.data.moveNumber, 7);

  console.log('Electron save bridge verification passed.');
  console.log(`Renderer storage and game slots were restored from: ${expectedFile}`);
} finally {
  if (electronApp) await electronApp.close();
  fs.rmSync(temporaryDocuments, { recursive: true, force: true });
}
