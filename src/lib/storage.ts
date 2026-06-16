// Storage adapter — supports three modes:
//  1. Electron desktop app  (window.electronAPI available)
//  2. Web server mode       (Express API at /api/data)
//  3. Dev / offline fallback (localStorage)

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

// Cache API availability so we don't check on every save
let _apiAvailable: boolean | null = null;

async function isApiAvailable(): Promise<boolean> {
  if (_apiAvailable !== null) return _apiAvailable;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch('/api/health', { signal: ctrl.signal });
    clearTimeout(timer);
    _apiAvailable = res.ok;
  } catch {
    _apiAvailable = false;
  }
  return _apiAvailable;
}

async function apiLoad(): Promise<string | null> {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data ?? null;
}

async function apiSave(value: string): Promise<void> {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: value }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export const appStorage = {
  getItem: async (_name: string): Promise<string | null> => {
    if (isElectron()) return window.electronAPI!.loadData();

    if (await isApiAvailable()) {
      try { return await apiLoad(); } catch { /* fall through */ }
    }
    return localStorage.getItem('fabrica-erp-backup');
  },

  setItem: async (_name: string, value: string): Promise<void> => {
    if (isElectron()) {
      await window.electronAPI!.saveData(value);
      return;
    }

    if (await isApiAvailable()) {
      try { await apiSave(value); } catch { /* fall through */ }
    }
    // Always keep a localStorage copy as emergency backup
    try { localStorage.setItem('fabrica-erp-backup', value); } catch (_) {}
  },

  removeItem: async (_name: string): Promise<void> => {
    localStorage.removeItem('fabrica-erp-backup');
  },
};

export async function getDataPath(): Promise<string> {
  if (isElectron()) return window.electronAPI!.getDataPath();
  try {
    const res = await fetch('/api/health');
    const json = await res.json();
    return json.dataFile ?? 'Servidor local';
  } catch {
    return 'Navegador (localStorage)';
  }
}

export async function chooseDataDir(): Promise<string | null> {
  if (isElectron()) return window.electronAPI!.chooseDataDir();
  return null;
}

export async function openInExplorer(_filePath: string): Promise<void> {
  if (isElectron()) await window.electronAPI!.openInExplorer(_filePath);
}
