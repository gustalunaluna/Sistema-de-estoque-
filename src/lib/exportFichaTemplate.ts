import type { FichaTecnica, Modelo, Insumo } from '../types';
import { isElectron } from './storage';

interface ExportPayload {
  ficha: FichaTecnica;
  modelo: Modelo;
  insumos: Insumo[];
  versao: number;
}

declare global {
  interface Window {
    electronAPI?: {
      exportFichaExcel: (data: ExportPayload) => Promise<{ ok: boolean; filePath?: string; canceled?: boolean; error?: string }>;
    };
  }
}

/** Download a blob as a file in the browser. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Export ficha técnica using the Excel template.
 * In Electron: calls main process via IPC → save dialog.
 * In web mode: calls /api/export-ficha → browser download.
 */
export async function exportarFichaTemplate(payload: ExportPayload): Promise<{ ok: boolean; error?: string }> {
  if (isElectron() && window.electronAPI?.exportFichaExcel) {
    const result = await window.electronAPI.exportFichaExcel(payload);
    return result;
  }

  // Web mode: POST to server
  try {
    const resp = await fetch('/api/export-ficha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
      return { ok: false, error: err.error || `HTTP ${resp.status}` };
    }

    const blob = await resp.blob();
    const disposition = resp.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `FichaTecnica_v${payload.versao}.xlsx`;
    downloadBlob(blob, filename);
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro de rede' };
  }
}
