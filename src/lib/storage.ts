// Storage adapter — supports four modes (in priority order):
//  1. Electron desktop app  (window.electronAPI available)
//  2. Supabase cloud        (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY configured)
//  3. Express server        (Express API at /api/data, running on localhost:3000)
//  4. localStorage fallback (offline / dev without server)

import { getSupabase, isSupabaseConfigured } from './supabase';

export interface BackupInfo {
  filename: string;
  size: number;
  mtime: number;
}

interface ElectronAPI {
  saveData: (data: string) => Promise<{ ok: boolean; error?: string }>;
  loadData: () => Promise<string | null>;
  chooseDataDir: () => Promise<string | null>;
  getDataPath: () => Promise<string>;
  getErpRoot: () => Promise<string>;
  setDataPath: (path: string) => Promise<string>;
  onDataPathChanged: (cb: (path: string) => void) => () => void;
  createBackup: () => Promise<{ ok: boolean; filePath?: string; error?: string }>;
  createBackupAuto: () => Promise<{ ok: boolean; filePath?: string; filename?: string; error?: string }>;
  listBackups: () => Promise<BackupInfo[]>;
  restoreBackup: (filename: string) => Promise<{ ok: boolean; error?: string }>;
  chooseRestoreFile: () => Promise<string | null>;
  openBackupsFolder: () => Promise<void>;
  getAutoBackup: () => Promise<boolean>;
  setAutoBackup: (enabled: boolean) => Promise<boolean>;
  onTriggerBackup: (cb: () => void) => () => void;
  getVersion: () => Promise<string>;
  openInExplorer: (path: string) => Promise<void>;
  exportFichaExcel: (data: unknown) => Promise<{ ok: boolean; filePath?: string; canceled?: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

const SUPABASE_ROW_ID = 'main';

async function supabaseLoad(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('erp_data')
    .select('data')
    .eq('id', SUPABASE_ROW_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  // data.data is jsonb (object); Zustand expects a JSON string
  return typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
}

async function supabaseSave(value: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from('erp_data')
    .upsert(
      { id: SUPABASE_ROW_ID, data: JSON.parse(value), updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    );
  if (error) throw new Error(error.message);
}

// ── Express API helpers ───────────────────────────────────────────────────────

// Cache API availability; re-check after 60 s so a slow server start is recovered
let _apiAvailable: boolean | null = null;
let _apiCheckedAt = 0;

async function isApiAvailable(): Promise<boolean> {
  // Never use the Express API when Supabase is configured
  if (isSupabaseConfigured()) return false;
  const now = Date.now();
  if (_apiAvailable !== null && now - _apiCheckedAt < 60_000) return _apiAvailable;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch('/api/health', { signal: ctrl.signal });
    clearTimeout(timer);
    _apiAvailable = res.ok;
  } catch {
    _apiAvailable = false;
  }
  _apiCheckedAt = Date.now();
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

// ── Unified storage object (used by Zustand persist middleware) ───────────────

export const appStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // 1. Electron
    if (isElectron()) return window.electronAPI!.loadData();

    // 2. Supabase cloud
    if (isSupabaseConfigured()) {
      try {
        const cloudData = await supabaseLoad();
        if (cloudData !== null) {
          try { localStorage.setItem(name, cloudData); } catch (_) {}
          return cloudData;
        }
      } catch { /* fall through to localStorage */ }
      return localStorage.getItem(name);
    }

    // 3. Express server
    if (await isApiAvailable()) {
      try {
        const apiData = await apiLoad();
        if (apiData !== null) {
          try { localStorage.setItem(name, apiData); } catch (_) {}
          return apiData;
        }
      } catch { /* fall through to localStorage */ }
    }

    // 4. localStorage
    return localStorage.getItem(name);
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // 1. Electron
    if (isElectron()) {
      await window.electronAPI!.saveData(value);
      return;
    }

    // Always write to localStorage as local cache
    try { localStorage.setItem(name, value); } catch (_) {}

    // 2. Supabase cloud
    if (isSupabaseConfigured()) {
      try { await supabaseSave(value); } catch { /* localStorage already has it */ }
      return;
    }

    // 3. Express server
    if (await isApiAvailable()) {
      try { await apiSave(value); } catch { /* localStorage already has it */ }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
  },
};

// ── Helpers exposed to React pages ────────────────────────────────────────────

export async function getDataPath(): Promise<string> {
  if (isElectron()) return window.electronAPI!.getDataPath();
  if (isSupabaseConfigured()) return 'Supabase (nuvem)';
  try {
    const res = await fetch('/api/health');
    const json = await res.json();
    return json.dataFile ?? 'Servidor local';
  } catch {
    return 'Navegador (localStorage)';
  }
}

export async function getErpRoot(): Promise<string> {
  if (isElectron()) return window.electronAPI!.getErpRoot();
  if (isSupabaseConfigured()) return 'Supabase';
  try {
    const res = await fetch('/api/settings/datadir');
    const json = await res.json();
    return json.dataDir ?? '';
  } catch {
    return '';
  }
}

export async function chooseDataDir(): Promise<string | null> {
  if (isElectron()) return window.electronAPI!.chooseDataDir();
  return null;
}

export async function openInExplorer(filePath: string): Promise<void> {
  if (isElectron()) await window.electronAPI!.openInExplorer(filePath);
}

// ── Backup helpers ────────────────────────────────────────────────────────────

export async function createBackup(): Promise<{ ok: boolean; filePath?: string; error?: string }> {
  if (!isElectron()) return { ok: false, error: 'Backup manual disponível apenas no app desktop.' };
  return window.electronAPI!.createBackup();
}

export async function createBackupAuto(): Promise<{ ok: boolean; filename?: string; error?: string }> {
  if (!isElectron()) return { ok: false, error: 'Apenas no app desktop.' };
  return window.electronAPI!.createBackupAuto();
}

export async function listBackups(): Promise<BackupInfo[]> {
  if (!isElectron()) return [];
  return window.electronAPI!.listBackups();
}

export async function restoreBackup(filename: string): Promise<{ ok: boolean; error?: string }> {
  if (!isElectron()) return { ok: false, error: 'Apenas no app desktop.' };
  return window.electronAPI!.restoreBackup(filename);
}

export async function chooseRestoreFile(): Promise<string | null> {
  if (!isElectron()) return null;
  return window.electronAPI!.chooseRestoreFile();
}

export async function openBackupsFolder(): Promise<void> {
  if (isElectron()) await window.electronAPI!.openBackupsFolder();
}

export async function getAutoBackup(): Promise<boolean> {
  if (!isElectron()) return false;
  return window.electronAPI!.getAutoBackup();
}

export async function setAutoBackup(enabled: boolean): Promise<boolean> {
  if (!isElectron()) return false;
  return window.electronAPI!.setAutoBackup(enabled);
}
