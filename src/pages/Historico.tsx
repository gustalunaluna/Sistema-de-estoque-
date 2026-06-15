import { useState } from 'react';
import { Search, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '../store/useStore';

export default function Historico() {
  const { historico, usuarios } = useStore();
  const [search, setSearch] = useState('');

  const filtered = historico.filter(h =>
    h.acao.toLowerCase().includes(search.toLowerCase()) ||
    h.entidade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Histórico</h1>
        <p className="text-sm text-slate-500">{historico.length} registro{historico.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Buscar no histórico..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <History size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum registro no histórico</p>
          </div>
        ) : (
          filtered.map(h => {
            const usuario = usuarios.find(u => u.id === h.usuarioId);
            return (
              <div key={h.id} className="px-5 py-3 flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">{usuario?.nome[0] ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium text-sm text-slate-800">{usuario?.nome ?? 'Sistema'}</span>
                      <span className="text-slate-400 text-sm"> — </span>
                      <span className="text-sm text-slate-700">{h.acao}</span>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {format(new Date(h.data), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{h.entidade}</span>
                  </div>
                  {(h.antes || h.depois) && (
                    <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                      {h.antes && <p>Antes: <span className="text-red-600">{h.antes}</span></p>}
                      {h.depois && <p>Depois: <span className="text-green-600">{h.depois}</span></p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
