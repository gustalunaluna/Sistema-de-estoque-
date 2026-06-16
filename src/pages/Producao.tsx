import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Factory } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import type { OrdemProducao, StatusProducao } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const statusConfig: Record<StatusProducao, { label: string; emoji: string; variant: 'gray' | 'yellow' | 'blue' | 'orange' | 'purple' | 'red' | 'green' }> = {
  criada:    { label: 'Criada',    emoji: '📝', variant: 'gray' },
  orcamento: { label: 'Orçamento', emoji: '💰', variant: 'yellow' },
  aprovada:  { label: 'Aprovada',  emoji: '✅', variant: 'blue' },
  separacao: { label: 'Separação', emoji: '📦', variant: 'orange' },
  oficina:   { label: 'Oficina',   emoji: '🏭', variant: 'purple' },
  corte:     { label: 'Corte',     emoji: '✂️', variant: 'orange' },
  costura:   { label: 'Costura',   emoji: '🧵', variant: 'purple' },
  revisao:   { label: 'Revisão',   emoji: '🔍', variant: 'yellow' },
  enviada:   { label: 'Enviada',   emoji: '🚚', variant: 'blue' },
  finalizada:{ label: 'Finalizada',emoji: '🎉', variant: 'green' },
};

const statusOrder: StatusProducao[] = [
  'criada', 'orcamento', 'aprovada', 'separacao', 'oficina',
  'corte', 'costura', 'revisao', 'enviada', 'finalizada',
];

const emptyForm = (): Omit<OrdemProducao, 'id' | 'criadoEm' | 'atualizadoEm'> => ({
  modeloId: '',
  quantidade: 1,
  status: 'criada',
  dataInicio: new Date().toISOString().split('T')[0],
  dataEntrega: '',
  observacoes: '',
});

export default function Producao() {
  const { ordensProducao, addOrdemProducao, updateOrdemProducao, deleteOrdemProducao, moverOrdem, modelos, clientes, usuarios } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<OrdemProducao | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = ordensProducao.filter(o => {
    const modelo = modelos.find(m => m.id === o.modeloId);
    return (
      (modelo?.nome.toLowerCase().includes(search.toLowerCase()) ?? false) &&
      (!statusFilter || o.status === statusFilter)
    );
  });

  const handleAdd = () => {
    addOrdemProducao(form);
    setForm(emptyForm());
    setModalAdd(false);
  };

  const handleEdit = () => {
    if (!modalEdit) return;
    updateOrdemProducao(modalEdit.id, form);
    setModalEdit(null);
  };

  const openEdit = (o: OrdemProducao) => {
    setForm({ ...o });
    setModalEdit(o);
  };

  const avancarStatus = (o: OrdemProducao) => {
    const idx = statusOrder.indexOf(o.status);
    if (idx < statusOrder.length - 1) moverOrdem(o.id, statusOrder[idx + 1]);
  };

  const OrdemForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
        <select className="input" value={form.modeloId} onChange={e => setForm(f => ({ ...f, modeloId: e.target.value }))}>
          <option value="">Selecione...</option>
          {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
          <input type="number" min="1" className="input" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusProducao }))}>
            {statusOrder.map(s => <option key={s} value={s}>{statusConfig[s].emoji} {statusConfig[s].label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
        <select className="input" value={form.clienteId ?? ''} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value || undefined }))}>
          <option value="">Nenhum</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeEmpresa}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
        <select className="input" value={form.responsavelId ?? ''} onChange={e => setForm(f => ({ ...f, responsavelId: e.target.value || undefined }))}>
          <option value="">Selecione...</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
          <input type="date" className="input" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Previsão de Entrega</label>
          <input type="date" className="input" value={form.dataEntrega} onChange={e => setForm(f => ({ ...f, dataEntrega: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
        <textarea className="input" rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Produção</h1>
          <p className="text-sm text-slate-500">{ordensProducao.length} ordens cadastradas</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Nova Ordem
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Buscar por modelo..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos status</option>
          {statusOrder.map(s => <option key={s} value={s}>{statusConfig[s].emoji} {statusConfig[s].label}</option>)}
        </select>
      </div>

      {/* Resumo rápido */}
      <div className="flex gap-3 flex-wrap">
        {statusOrder.map(s => {
          const count = ordensProducao.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
            >
              {statusConfig[s].emoji} {statusConfig[s].label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === s ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Qtd</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(ordem => {
                const modelo = modelos.find(m => m.id === ordem.modeloId);
                const cliente = clientes.find(c => c.id === ordem.clienteId);
                const cfg = statusConfig[ordem.status];
                const isAtrasada = ordem.dataEntrega && new Date(ordem.dataEntrega) < new Date() && ordem.status !== 'finalizada';
                return (
                  <tr key={ordem.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {modelo?.fotoPrincipal && <img src={modelo.fotoPrincipal} alt="" className="w-8 h-8 rounded object-cover" />}
                        <div>
                          <p className="font-medium text-sm text-slate-800">{modelo?.nome ?? 'Modelo removido'}</p>
                          <p className="text-xs text-slate-400">{modelo?.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{ordem.quantidade}</td>
                    <td className="px-4 py-3">
                      <Badge label={`${cfg.emoji} ${cfg.label}`} variant={cfg.variant} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{cliente?.nomeEmpresa ?? '—'}</td>
                    <td className="px-4 py-3">
                      {ordem.dataEntrega ? (
                        <span className={`text-sm ${isAtrasada ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          {format(new Date(ordem.dataEntrega + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                          {isAtrasada && ' ⚠️'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {ordem.status !== 'finalizada' && (
                          <button
                            onClick={() => avancarStatus(ordem)}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Avançar →
                          </button>
                        )}
                        <button onClick={() => openEdit(ordem)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteOrdemProducao(ordem.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Factory size={40} className="mx-auto mb-2 opacity-30" />
              <p>Nenhuma ordem de produção encontrada</p>
            </div>
          )}
        </div>
      </div>

      {modalAdd && (
        <Modal title="Nova Ordem de Produção" onClose={() => setModalAdd(false)} size="lg">
          <OrdemForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.modeloId}>Salvar</button>
          </div>
        </Modal>
      )}

      {modalEdit && (
        <Modal title="Editar Ordem" onClose={() => setModalEdit(null)} size="lg">
          <OrdemForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
