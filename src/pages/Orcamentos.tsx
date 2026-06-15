import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Orcamento } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

type StatusOrc = Orcamento['status'];

const statusConfig: Record<StatusOrc, { label: string; variant: 'gray' | 'blue' | 'green' | 'red' }> = {
  rascunho: { label: 'Rascunho', variant: 'gray' },
  enviado: { label: 'Enviado', variant: 'blue' },
  aprovado: { label: 'Aprovado', variant: 'green' },
  recusado: { label: 'Recusado', variant: 'red' },
};

const emptyForm = (): Omit<Orcamento, 'id' | 'criadoEm'> => ({
  clienteId: '',
  modeloId: '',
  quantidade: 1,
  custoProducao: 0,
  precoUnitario: 0,
  valorTotal: 0,
  margemLucro: 0,
  status: 'rascunho',
  observacoes: '',
});

export default function Orcamentos() {
  const { orcamentos, addOrcamento, updateOrcamento, deleteOrcamento, clientes, modelos, fichasTecnicas, insumos } = useStore();
  const [search, setSearch] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Orcamento | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = orcamentos.filter(o => {
    const cliente = clientes.find(c => c.id === o.clienteId);
    const modelo = modelos.find(m => m.id === o.modeloId);
    return (
      cliente?.nomeEmpresa.toLowerCase().includes(search.toLowerCase()) ||
      modelo?.nome.toLowerCase().includes(search.toLowerCase())
    );
  });

  const calcMargemLucro = (custo: number, preco: number) =>
    custo > 0 ? ((preco - custo) / custo * 100) : 0;

  const updateCalc = (f: typeof form) => {
    const valorTotal = f.precoUnitario * f.quantidade;
    const margemLucro = calcMargemLucro(f.custoProducao, f.precoUnitario);
    return { ...f, valorTotal, margemLucro };
  };

  const handleModeloChange = (modeloId: string) => {
    const ficha = fichasTecnicas.find(f => f.modeloId === modeloId);
    let custo = 0;
    if (ficha) {
      custo = ficha.itens.reduce((sum, item) => {
        const ins = insumos.find(i => i.id === item.insumoId);
        return sum + (ins?.valorUnitario ?? 0) * item.quantidade;
      }, 0) + ficha.custoMaoDeObra + ficha.outrosCustos;
    }
    setForm(f => updateCalc({ ...f, modeloId, custoProducao: custo }));
  };

  const handleAdd = () => { addOrcamento(form); setForm(emptyForm()); setModalAdd(false); };
  const handleEdit = () => { if (!modalEdit) return; updateOrcamento(modalEdit.id, form); setModalEdit(null); };
  const openEdit = (o: Orcamento) => { setForm({ ...o }); setModalEdit(o); };

  const OrcForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cliente</label>
          <select className="input" value={form.clienteId} onChange={e => setForm(f => updateCalc({ ...f, clienteId: e.target.value }))}>
            <option value="">Selecione...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nomeEmpresa}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Produto/Modelo</label>
          <select className="input" value={form.modeloId} onChange={e => handleModeloChange(e.target.value)}>
            <option value="">Selecione...</option>
            {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Quantidade</label>
          <input type="number" min="1" className="input" value={form.quantidade}
            onChange={e => setForm(f => updateCalc({ ...f, quantidade: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="label">Custo de Produção (R$)</label>
          <input type="number" step="0.01" className="input" value={form.custoProducao}
            onChange={e => setForm(f => updateCalc({ ...f, custoProducao: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="label">Preço Unitário (R$)</label>
          <input type="number" step="0.01" className="input" value={form.precoUnitario}
            onChange={e => setForm(f => updateCalc({ ...f, precoUnitario: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StatusOrc }))}>
            {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Observações</label>
        <textarea className="input" rows={2} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
      <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Quantidade:</span><strong>{form.quantidade}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Custo unitário:</span><strong>R$ {form.custoProducao.toFixed(2)}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Preço unitário:</span><strong>R$ {form.precoUnitario.toFixed(2)}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Margem de lucro:</span><strong className={form.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}>{form.margemLucro.toFixed(1)}%</strong></div>
        <div className="flex justify-between text-base border-t border-slate-200 pt-2 mt-1">
          <span className="font-semibold">Valor total:</span>
          <strong className="text-blue-600">R$ {form.valorTotal.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
          <p className="text-sm text-slate-500">{orcamentos.length} orçamentos</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Novo Orçamento
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Buscar..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Qtd</th>
              <th className="px-4 py-3">Custo Unit.</th>
              <th className="px-4 py-3">Preço Unit.</th>
              <th className="px-4 py-3">Margem</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(orc => {
              const cliente = clientes.find(c => c.id === orc.clienteId);
              const modelo = modelos.find(m => m.id === orc.modeloId);
              const cfg = statusConfig[orc.status];
              return (
                <tr key={orc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-sm">{cliente?.nomeEmpresa ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{modelo?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">{orc.quantidade}</td>
                  <td className="px-4 py-3 text-sm">R$ {orc.custoProducao.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">R$ {orc.precoUnitario.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">{orc.margemLucro.toFixed(1)}%</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">R$ {orc.valorTotal.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge label={cfg.label} variant={cfg.variant} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(orc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => deleteOrcamento(orc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <DollarSign size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum orçamento</p>
          </div>
        )}
      </div>

      {modalAdd && (
        <Modal title="Novo Orçamento" onClose={() => setModalAdd(false)} size="lg">
          <OrcForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}

      {modalEdit && (
        <Modal title="Editar Orçamento" onClose={() => setModalEdit(null)} size="lg">
          <OrcForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
