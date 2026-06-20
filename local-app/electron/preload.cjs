const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('TopoboardgameLocalApp', {
  platform: process.platform,
  version: process.versions.electron || 'unknown',
  isDesktop: true,
  engineStatus: () => ipcRenderer.invoke('engine:status'),
  chooseStockfishMove: (request) => ipcRenderer.invoke('engine:stockfish-move', request)
});
