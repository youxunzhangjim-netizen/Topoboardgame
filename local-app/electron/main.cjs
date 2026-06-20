const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const isDev = process.env.TOPOBOARDGAME_ELECTRON_DEV === '1';

function resolveAppIcon() {
  return path.join(__dirname, '../build-resources/icon.png');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: 'Topoboardgame',
    icon: resolveAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  if (isDev) win.loadURL(process.env.TOPOBOARDGAME_DEV_URL || 'http://127.0.0.1:5172');
  else win.loadFile(path.join(__dirname, '../../dist/index.html'));
}

function stockfishCandidates() {
  const executable = process.platform === 'win32' ? 'stockfish.exe' : 'stockfish';
  return [
    process.env.TOPOBOARDGAME_STOCKFISH,
    path.join(app.getPath('userData'), 'engines', executable),
    path.join(process.resourcesPath, 'engines', executable),
    path.join(app.getPath('downloads'), 'stockfish-windows-x86-64-avx2', 'stockfish-windows-x86-64-avx2.exe')
  ].filter(Boolean);
}

function findStockfish() {
  return stockfishCandidates().find((candidate) => {
    try { return fs.statSync(candidate).isFile(); } catch { return false; }
  }) || '';
}

ipcMain.handle('engine:status', () => {
  const stockfish = findStockfish();
  return { stockfish: { available: Boolean(stockfish), path: stockfish || null } };
});

ipcMain.handle('engine:stockfish-move', async (_event, request = {}) => {
  const enginePath = findStockfish();
  if (!enginePath) return { available: false, error: 'stockfish-not-found' };
  const fen = String(request.fen || '');
  const depth = Math.max(1, Math.min(24, Math.floor(Number(request.depth) || 10)));
  if (!/^[prnbqkPRNBQK1-8/]+ [wb] [-KQkq]+ (?:-|[a-h][36]) \d+ \d+$/.test(fen) || fen.length > 120) {
    return { available: false, error: 'invalid-fen' };
  }
  return runStockfish(enginePath, fen, depth);
});

function runStockfish(enginePath, fen, depth) {
  return new Promise((resolve) => {
    const engine = spawn(enginePath, [], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    let buffer = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { engine.stdin.write('quit\n'); } catch {}
      try { engine.kill(); } catch {}
      resolve(result);
    };
    const timer = setTimeout(() => finish({ available: false, error: 'stockfish-timeout' }), 30000);
    engine.on('error', (error) => finish({ available: false, error: error.message }));
    engine.on('exit', (code) => {
      if (!settled) finish({ available: false, error: 'stockfish-exited-' + code });
    });
    engine.stdout.setEncoding('utf8');
    engine.stdout.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line === 'uciok') {
          engine.stdin.write('position fen ' + fen + '\n');
          engine.stdin.write('go depth ' + depth + '\n');
        } else if (line.startsWith('bestmove ')) {
          finish({ available: true, engine: 'Stockfish', move: line.split(/\s+/)[1] || '', depth });
        }
      }
    });
    engine.stdin.write('uci\n');
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
