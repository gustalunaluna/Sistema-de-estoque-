const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Data persistence
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),

  // File system
  chooseDataDir: () => ipcRenderer.invoke('choose-data-dir'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  setDataPath: (newPath) => ipcRenderer.invoke('set-data-path', newPath),

  // Listen for data path changes
  onDataPathChanged: (callback) => {
    ipcRenderer.on('data-path-changed', (_, path) => callback(path));
    return () => ipcRenderer.removeAllListeners('data-path-changed');
  },

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  openInExplorer: (path) => ipcRenderer.invoke('open-in-explorer', path),
});
