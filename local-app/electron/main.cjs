const { app, BrowserWindow, shell } = require('electron');
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

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
