const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { DesktopSaveStore } = require('./save-store.cjs');

app.commandLine.appendSwitch('enable-logging');

const isDev = process.env.TOPOBOARDGAME_ELECTRON_DEV === '1';
const isSteamDebug = process.env.TBG_STEAM_DEBUG === '1';
let desktopSaveStore = null;
let appServer = null;
let appBaseUrl = '';
let pendingLogLines = [];

function logLine(message, details = {}) {
  const suffix = Object.keys(details).length ? ` ${JSON.stringify(details)}` : '';
  const line = `[${new Date().toISOString()}] ${message}${suffix}`;
  console.log(line);
  if (!app.isReady()) {
    pendingLogLines.push(line);
    return;
  }
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    fs.appendFileSync(path.join(logsDir, 'steam-debug.log'), `${line}\n`, 'utf8');
    if (pendingLogLines.length) {
      fs.appendFileSync(path.join(logsDir, 'steam-debug.log'), `${pendingLogLines.join('\n')}\n`, 'utf8');
      pendingLogLines = [];
    }
  } catch (error) {
    console.warn('[steam-debug-log-failed]', error?.message || error);
  }
}

function distRoot() {
  return path.resolve(__dirname, '../../dist-steam/app');
}

function packagedIndexPath() {
  return path.join(distRoot(), 'index.html');
}

function preloadPath() {
  return path.join(__dirname, 'preload.cjs');
}

function mimeType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.webp': return 'image/webp';
    case '.wasm': return 'application/wasm';
    case '.txt': return 'text/plain; charset=utf-8';
    case '.xml': return 'application/xml; charset=utf-8';
    case '.pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

function safeResolveDistPath(requestUrl) {
  const root = distRoot();
  const parsed = new URL(requestUrl, 'http://127.0.0.1');
  let pathname = decodeURIComponent(parsed.pathname || '/').replace(/\\/g, '/');
  if (pathname.endsWith('/')) pathname += 'index.html';
  let candidate = path.resolve(root, `.${pathname}`);
  if (!candidate.startsWith(root)) return null;
  try {
    const stats = fs.statSync(candidate);
    if (stats.isDirectory()) candidate = path.join(candidate, 'index.html');
  } catch {
    if (!path.extname(candidate)) candidate = path.join(candidate, 'index.html');
  }
  if (!candidate.startsWith(root)) return null;
  return candidate;
}

function startPackagedStaticServer() {
  if (appServer) return Promise.resolve(appBaseUrl);
  const indexPath = packagedIndexPath();
  const currentPreloadPath = preloadPath();
  logLine('Loading Electron app from:', { indexPath, distRoot: distRoot(), preloadPath: currentPreloadPath });
  if (!fs.existsSync(indexPath)) {
    return Promise.reject(new Error(`Missing Steam build index.html: ${indexPath}`));
  }
  if (!fs.existsSync(currentPreloadPath)) {
    return Promise.reject(new Error(`Missing Electron preload file: ${currentPreloadPath}`));
  }
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Method not allowed');
        return;
      }

      const filePath = safeResolveDistPath(request.url || '/');
      if (!filePath) {
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');
        return;
      }

      fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Not found');
          return;
        }

        response.writeHead(200, {
          'Content-Type': mimeType(filePath),
          'Content-Length': stats.size,
          'Cache-Control': 'no-cache'
        });
        if (request.method === 'HEAD') {
          response.end();
          return;
        }
        fs.createReadStream(filePath).pipe(response);
      });
    });

    server.on('error', (error) => {
      logLine('static-server-error', { error: String(error?.message || error) });
      reject(error);
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      appServer = server;
      appBaseUrl = `http://127.0.0.1:${address.port}/`;
      logLine('static-server-ready', { root: distRoot(), baseUrl: appBaseUrl });
      resolve(appBaseUrl);
    });
  });
}

function isTrustedRenderer(event) {
  const sourceUrl = event?.senderFrame?.url || event?.sender?.getURL?.() || '';
  if (isDev && /^https?:\/\/(127\.0\.0\.1|localhost):5172(?:\/|$)/.test(sourceUrl)) return true;
  if (appBaseUrl && sourceUrl.startsWith(appBaseUrl)) return true;
  const distUrl = pathToFileURL(`${distRoot()}${path.sep}`).href;
  return sourceUrl.startsWith(distUrl);
}

function trustedHandle(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!isTrustedRenderer(event)) return { ok: false, error: 'untrusted-renderer' };
    try {
      return handler(...args);
    } catch (error) {
      return { ok: false, error: String(error?.message || error) };
    }
  });
}

function registerDesktopSaveIpc() {
  const testDocumentsPath = !app.isPackaged && process.env.TOPOBOARDGAME_TEST_DOCUMENTS_PATH;
  desktopSaveStore = new DesktopSaveStore(testDocumentsPath || app.getPath('documents'));

  ipcMain.on('desktop-save:bootstrap', (event) => {
    if (!isTrustedRenderer(event)) {
      event.returnValue = { ok: false, error: 'untrusted-renderer' };
      return;
    }
    event.returnValue = desktopSaveStore.read();
  });

  ipcMain.on('desktop-save:flush-local-storage', (event, snapshot) => {
    if (!isTrustedRenderer(event)) {
      event.returnValue = { ok: false, error: 'untrusted-renderer' };
      return;
    }
    try {
      event.returnValue = desktopSaveStore.replaceLocalStorage(snapshot);
    } catch (error) {
      event.returnValue = { ok: false, error: String(error?.message || error) };
    }
  });

  trustedHandle('desktop-save:sync-local-storage', (snapshot) => desktopSaveStore.replaceLocalStorage(snapshot));
  trustedHandle('desktop-save:save-slot', (slotId, data, metadata) => desktopSaveStore.saveSlot(slotId, data, metadata));
  trustedHandle('desktop-save:load-slot', (slotId) => desktopSaveStore.loadSlot(slotId));
  trustedHandle('desktop-save:list-slots', () => desktopSaveStore.listSlots());
  trustedHandle('desktop-save:remove-slot', (slotId) => desktopSaveStore.removeSlot(slotId));
  trustedHandle('desktop-save:path', () => ({
    ok: true,
    directory: desktopSaveStore.directoryPath,
    path: desktopSaveStore.filePath
  }));
}

function resolveAppIcon() {
  return path.join(__dirname, '../build-resources/icon.png');
}

function fallbackErrorHtml(message) {
  const escaped = String(message || 'Unknown load error')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Topoboardgame load error</title>
  <style>
    body { margin: 0; background: #08111f; color: #eef6ff; font: 16px/1.5 system-ui, sans-serif; }
    main { max-width: 760px; margin: 12vh auto; padding: 32px; border: 1px solid #335277; border-radius: 12px; background: #101927; }
    h1 { margin-top: 0; color: #ffd761; }
    code { display: block; white-space: pre-wrap; padding: 12px; border-radius: 8px; background: #050a12; color: #ffb4b4; }
  </style>
</head>
<body>
  <main>
    <h1>Topoboardgame could not load</h1>
    <p>The Steam desktop app could not open its local game files. Start with <code>TBG_STEAM_DEBUG=1</code> and copy the first red console error.</p>
    <code>${escaped}</code>
  </main>
</body>
</html>`;
}

function installWindowDiagnostics(win) {
  win.webContents.on('did-finish-load', () => {
    logLine('did-finish-load', { url: win.webContents.getURL() });
  });
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    logLine('did-fail-load', { errorCode, errorDescription, validatedURL, isMainFrame });
    if (isMainFrame) {
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackErrorHtml(`${errorCode}: ${errorDescription}\n${validatedURL}`))}`).catch(() => {});
    }
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    logLine('render-process-gone', details || {});
  });
  win.on('unresponsive', () => {
    logLine('window-unresponsive', { url: win.webContents.getURL() });
  });
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    logLine('renderer-console', { level, message, line, sourceId });
  });
}

async function createWindow() {
  const debugWindow = isSteamDebug || isDev;
  const win = new BrowserWindow({
    width: debugWindow ? 1280 : 1440,
    height: debugWindow ? 900 : 960,
    minWidth: 1100,
    minHeight: 720,
    title: 'Topoboardgame',
    icon: resolveAppIcon(),
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  installWindowDiagnostics(win);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  if (isDev) {
    await win.loadURL(process.env.TOPOBOARDGAME_DEV_URL || 'http://127.0.0.1:5172');
  } else {
    const baseUrl = await startPackagedStaticServer();
    await win.loadURL(baseUrl);
  }
  if (debugWindow) win.webContents.openDevTools({ mode: 'detach' });
}

function createWindowSafely() {
  createWindow().catch((error) => {
    logLine('create-window-failed', { error: String(error?.stack || error?.message || error) });
    const fallback = new BrowserWindow({
      width: 1280,
      height: 900,
      title: 'Topoboardgame load error',
      icon: resolveAppIcon()
    });
    installWindowDiagnostics(fallback);
    fallback.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackErrorHtml(error?.stack || error?.message || error))}`).catch(() => {});
    if (isSteamDebug) fallback.webContents.openDevTools({ mode: 'detach' });
  });
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
  registerDesktopSaveIpc();
  createWindowSafely();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindowSafely(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => {
  if (appServer) {
    try { appServer.close(); } catch {}
    appServer = null;
  }
});
