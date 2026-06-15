import { useState } from 'react';
import { Plus, Search, ShoppingCart, Check, X as XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import type { Compra } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const emptyForm = (): Omit<Compra, 'id' | 'criadoEm'> => ({
  fornecedorId: '',
  itens: [],
  valorTotal: 0,
  data: new Date().toISOString().split('T')[0],
  status: 'pendente',
  observacoes: '',
});

export default function Compras() {
  const { compras, addCompra, updateCompra, fornecedores, insumos } = useStore();
  const [search, setSearch] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const filtered = compras.filter(c => {
    const forn = fornecedores.find(f => f.id === c.fornecedorId);
    return forn?.nome.toLowerCase().includes(search.toLowerCase()) ?? false;
  });

  const calcTotal = (itens: typeof form.itens) =>
    itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);

  const addItemCompra = () => {
    setForm(f => {
      const itens = [...f.itens, { insumoId: '', quantidade: 0, valorUnitario: 0 }];
      return { ...f, itens, valorTotal: calcTotal(itens) };
    });
  };

  const removeItemCompra = (idx: number) => {
    setForm(f => {
      const itens = f.itens.filter((_, i) => i !== idx);
      return { ...f, itens, valorTotal: calcTotal(itens) };
    });
  };

  const updateItemCompra = (idx: number, data: Partial<typeof form.itens[0]>) => {
    setForm(f => {
      const itens = f.itens.map((it, i) => i === idx ? { ...it, ...data } : it);
      return { ...f, itens, valorTotal: calcTotal(itens) };
    });
  };

  const handleAdd = () => {
    addCompra(form);
    setForm(emptyForm());
    setModalAdd(false);
  };

  const receberCompra = (id: string) => {
    updateCompra(id, { status: 'recebida' });
    const compra = compras.find(c => c.id === id);
    if (compra) {
      compra.itens.forEach(item => {
        useStore.getState().addMovimentacao({
          insumoId: item.insumoId,
          tipo: 'entrada',
          quantidade: item.quantidade,
          motivo: 'Compra recebida',
          usuarioId: useStore.getState().usuarioAtual?.id ?? '',
        });
      });
    }
  };

  const statusConfig = {
    pendente: { label: 'Pendente', variant: 'yellow' as const },
    recebida: { label: 'Recebida', variant: 'green' as const },
    cancelada: { label: 'Cancelada', variant: 'red' as const },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compras</h1>
          <p className="text-sm text-slate-500">{compras.length} compras registradas</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Nova Compra
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Buscar por fornecedor..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Itens</th>
              <th className="px-4 py-3">Valor Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(compra => {
              const forn = fornecedores.find(f => f.id === compra.fornecedorId);
              const cfg = statusConfig[compra.status];
              return (
                <tr key={compra.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-sm">{forn?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {format(new Date(compra.data + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{compra.itens.length} iten{compra.itens.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">R$ {compra.valorTotal.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge label={cfg.label} variant={cfg.variant} /></td>
                  <td className="px-4 py-3">
                    {compra.status === 'pendente' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => receberCompra(compra.id)}
                          className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                        >
                          <Check size={12} /> Receber
                        </button>
                        <button
                          onClick={() => updateCompra(compra.id, { status: 'cancelada' })}
                          className="flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                        >
                          <XIcon size={12} /> Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhuma compra registrada</p>
          </div>
        )}
      </div>

      {modalAdd && (
        <Modal title="Nova Compra" onClose={() => setModalAdd(false)} size="xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fornecedor</label>
                <select className="input" value={form.fornecedorId} onChange={e => setForm(f => ({ ...f, fornecedorId: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">Itens</label>
                <button type="button" onClick={addItemCompra} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Adicionar item
                </button>
              </div>
              <div className="space-y-2">
                {form.itens.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                    <select className="input flex-1 text-sm" value={item.insumoId} onChange={e => updateItemCompra(idx, { insumoId: e.target.value })}>
                      <option value="">Selecione o insumo...</option>
                      {insumos.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                    </select>
                    <input type="number" className="input w-24 text-sm" value={item.quantidade} placeholder="Qtd"
                      onChange={e => updateItemCompra(idx, { quantidade: Number(e.target.value) })} />
                    <input type="number" step="0.01" className="input w-28 text-sm" value={item.valorUnitario} placeholder="R$ Unit."
                      onChange={e => updateItemCompra(idx, { valorUnitario: Number(e.target.value) })} />
                    <span className="text-xs text-slate-600 w-20 text-right">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
                    <button type="button" onClick={() => removeItemCompra(idx)} className="text-slate-400 hover:text-red-500">
                      <XIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Observações</label>
              <textarea className="input" rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
            </div>

            <div className="bg-slate-50 rounded-lg px-4 py-3 flex justify-between text-sm">
              <span className="text-slate-600">Valor total da compra:</span>
              <strong className="text-slate-800">R$ {form.valorTotal.toFixed(2)}</strong>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
              <button onClick={() => { setForm(f => ({ ...f, status: 'pendente' })); handleAdd(); }} className="btn-ghost border border-slate-300">Salvar pendente</button>
              <button onClick={() => { setForm(f => ({ ...f, status: 'recebida' })); handleAdd(); }} className="btn-primary">Receber agora</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
