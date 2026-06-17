import { getSupabase, isSupabaseConfigured } from './supabase';

// Timestamp of the last save WE made — used to ignore our own Realtime echo
let _lastLocalSaveAt = 0;

// Flag set just before we call setState with remote data, so the persist
// middleware's triggered save doesn't bounce the same data back to Supabase
let _ignoringNextSave = false;

export function markLocalSave(): void {
  _lastLocalSaveAt = Date.now();
}

export function startIgnoringSave(): void {
  _ignoringNextSave = true;
  setTimeout(() => { _ignoringNextSave = false; }, 300);
}

export function isSaveIgnored(): boolean {
  return _ignoringNextSave;
}

export function subscribeToSync(onRemoteUpdate: (jsonData: string) => void): () => void {
  if (!isSupabaseConfigured()) return () => {};

  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel('erp-realtime-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'erp_data', filter: 'id=eq.main' },
      (payload) => {
        // Skip events caused by our own saves (echo prevention, 6-second window)
        if (Date.now() - _lastLocalSaveAt < 6000) return;

        const row = payload.new as Record<string, unknown> | undefined;
        if (!row?.data) return;

        const jsonStr =
          typeof row.data === 'string' ? row.data : JSON.stringify(row.data);

        onRemoteUpdate(jsonStr);
      },
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}
