const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Data persistence ───────────────────────────────────────────────────────
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),

  // ── Storage location ───────────────────────────────────────────────────────
  chooseDataDir: () => ipcRenderer.invoke('choose-data-dir'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  getErpRoot: () => ipcRenderer.invoke('get-erp-root'),
  setDataPath: (newPath) => ipcRenderer.invoke('set-data-path', newPath),

  onDataPathChanged: (callback) => {
    const handler = (_, p) => callback(p);
    ipcRenderer.on('data-path-changed', handler);
    return () => ipcRenderer.removeListener('data-path-changed', handler);
  },

  // ── Backup ─────────────────────────────────────────────────────────────────
  createBackup: () => ipcRenderer.invoke('create-backup'),
  createBackupAuto: () => ipcRenderer.invoke('create-backup-auto'),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (filename) => ipcRenderer.invoke('restore-backup', filename),
  chooseRestoreFile: () => ipcRenderer.invoke('choose-restore-file'),
  openBackupsFolder: () => ipcRenderer.invoke('open-backups-folder'),

  // ── Auto-backup setting ────────────────────────────────────────────────────
  getAutoBackup: () => ipcRenderer.invoke('get-auto-backup'),
  setAutoBackup: (enabled) => ipcRenderer.invoke('set-auto-backup', enabled),

  // ── Listen for menu-triggered backup ──────────────────────────────────────
  onTriggerBackup: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('trigger-backup', handler);
    return () => ipcRenderer.removeListener('trigger-backup', handler);
  },

  // ── Misc ───────────────────────────────────────────────────────────────────
  getVersion: () => ipcRenderer.invoke('get-version'),
  openInExplorer: (filePath) => ipcRenderer.invoke('open-in-explorer', filePath),

  // ── Export Ficha Técnica ───────────────────────────────────────────────────
  exportFichaExcel: (data) => ipcRenderer.invoke('export-ficha-excel', data),
});
