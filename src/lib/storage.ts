// Detects if running inside Electron and uses file-based storage.
// Falls back to localStorage for browser/dev mode.

interface ElectronAPI {
  saveData: (data: string) => Promise<{ ok: boolean; error?: string }>;
  loadData: () => Promise<string | null>;
  chooseDataDir: () => Promise<string | null>;
  getDataPath: () => Promise<string>;
  setDataPath: (path: string) => Promise<string>;
  onDataPathChanged: (cb: (path: string) => void) => () => void;
  getVersion: () => Promise<string>;
  openInExplorer: (path: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

export const appStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isElectron()) {
      const data = await window.electronAPI!.loadData();
      return data;
    }
    return localStorage.getItem(name);
  },

  setItem: async (_name: string, value: string): Promise<void> => {
    if (isElectron()) {
      await window.electronAPI!.saveData(value);
    }
    // Always keep localStorage as backup/dev fallback
    try { localStorage.setItem('fabrica-erp-backup', value); } catch (_) {}
  },

  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
  },
};

export async function getDataPath(): Promise<string> {
  if (isElectron()) {
    return window.electronAPI!.getDataPath();
  }
  return 'Navegador (localStorage)';
}

export async function chooseDataDir(): Promise<string | null> {
  if (isElectron()) {
    return window.electronAPI!.chooseDataDir();
  }
  return null;
}

export async function openInExplorer(filePath: string): Promise<void> {
  if (isElectron()) {
    await window.electronAPI!.openInExplorer(filePath);
  }
}
