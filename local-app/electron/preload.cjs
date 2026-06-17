const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('TopoboardgameLocalApp', {
  platform: process.platform,
  version: process.versions.electron || 'unknown',
  isDesktop: true
});
