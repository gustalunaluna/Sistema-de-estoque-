import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { FichaTecnica, ItemFichaTecnica } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

const emptyForm = (modeloId = ''): Omit<FichaTecnica, 'id' | 'criadoEm' | 'atualizadoEm'> => ({
  modeloId,
  itens: [],
  tempoProdução: 0,
  custoMaoDeObra: 0,
  outrosCustos: 0,
  margemLucro: 20,
});

export default function FichasTecnicas() {
  const { fichasTecnicas, addFichaTecnica, updateFichaTecnica, deleteFichaTecnica, modelos, insumos } = useStore();
  const [search, setSearch] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<FichaTecnica | null>(null);
  const [modalView, setModalView] = useState<FichaTecnica | null>(null);
  const [form, setForm] = useState(emptyForm());

  const fichasComModelo = fichasTecnicas.map(f => ({
    ...f,
    modelo: modelos.find(m => m.id === f.modeloId),
  }));

  const filtered = fichasComModelo.filter(f =>
    f.modelo?.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.modelo?.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const calcCustoMateriais = (itens: ItemFichaTecnica[]) =>
    itens.reduce((sum, item) => {
      const ins = insumos.find(i => i.id === item.insumoId);
      return sum + (ins?.valorUnitario ?? 0) * item.quantidade;
    }, 0);

  const calcCustoTotal = (f: typeof form) => {
    const mat = calcCustoMateriais(f.itens);
    return mat + f.custoMaoDeObra + f.outrosCustos;
  };

  const calcPrecoVenda = (f: typeof form) => calcCustoTotal(f) * (1 + f.margemLucro / 100);

  const addItem = () => {
    setForm(f => ({ ...f, itens: [...f.itens, { insumoId: '', quantidade: 1 }] }));
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, data: Partial<ItemFichaTecnica>) => {
    setForm(f => ({ ...f, itens: f.itens.map((it, i) => i === idx ? { ...it, ...data } : it) }));
  };

  const handleAdd = () => {
    addFichaTecnica(form);
    setForm(emptyForm());
    setModalAdd(false);
  };

  const handleEdit = () => {
    if (!modalEdit) return;
    updateFichaTecnica(modalEdit.id, form);
    setModalEdit(null);
  };

  const openEdit = (ficha: FichaTecnica) => {
    setForm({ ...ficha });
    setModalEdit(ficha);
  };

  const FichaForm = () => {
    const custo = calcCustoTotal(form);
    const preco = calcPrecoVenda(form);
    return (
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
          <select
            className="input"
            value={form.modeloId}
            onChange={e => setForm(f => ({ ...f, modeloId: e.target.value }))}
          >
            <option value="">Selecione um modelo...</option>
            {modelos.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.codigo})</option>)}
          </select>
        </div>

        {/* Materiais */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Materiais</h3>
            <button type="button" onClick={addItem} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              <Plus size={12} /> Adicionar item
            </button>
          </div>
          <div className="space-y-2">
            {form.itens.map((item, idx) => {
              const ins = insumos.find(i => i.id === item.insumoId);
              return (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 rounded-lg p-2">
                  <select
                    className="input flex-1 text-sm"
                    value={item.insumoId}
                    onChange={e => updateItem(idx, { insumoId: e.target.value })}
                  >
                    <option value="">Selecione o material...</option>
                    {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
                  </select>
                  <input
                    type="number"
                    className="input w-24 text-sm"
                    value={item.quantidade}
                    min="0"
                    step="0.01"
                    onChange={e => updateItem(idx, { quantidade: Number(e.target.value) })}
                    placeholder="Qtd"
                  />
                  {ins && (
                    <span className="text-xs text-slate-500 w-20 text-right">
                      R$ {(ins.valorUnitario * item.quantidade).toFixed(2)}
                    </span>
                  )}
                  <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
            {form.itens.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">Nenhum material adicionado</p>
            )}
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-sm text-slate-600">
              Custo materiais: <strong className="text-slate-800">R$ {calcCustoMateriais(form.itens).toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Custos */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tempo (min)</label>
            <input type="number" className="input" value={form.tempoProdução} onChange={e => setForm(f => ({ ...f, tempoProdução: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mão de Obra (R$)</label>
            <input type="number" step="0.01" className="input" value={form.custoMaoDeObra} onChange={e => setForm(f => ({ ...f, custoMaoDeObra: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Outros Custos (R$)</label>
            <input type="number" step="0.01" className="input" value={form.outrosCustos} onChange={e => setForm(f => ({ ...f, outrosCustos: Number(e.target.value) }))} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Margem de Lucro (%)</label>
          <input type="number" step="1" className="input w-32" value={form.margemLucro} onChange={e => setForm(f => ({ ...f, margemLucro: Number(e.target.value) }))} />
        </div>

        {/* Resumo */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Custo total:</span><strong>R$ {custo.toFixed(2)}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Preço sugerido ({form.margemLucro}% margem):</span><strong className="text-green-600">R$ {preco.toFixed(2)}</strong></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fichas Técnicas</h1>
          <p className="text-sm text-slate-500">{fichasTecnicas.length} fichas cadastradas</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Nova Ficha
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Buscar por modelo..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ modelo, ...ficha }) => {
          if (!modelo) return null;
          const custo = calcCustoTotal(ficha);
          const preco = calcPrecoVenda(ficha);
          return (
            <div key={ficha.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{modelo.nome}</p>
                  <p className="text-xs text-slate-400">{modelo.codigo}</p>
                </div>
                <Badge
                  label={modelo.status.charAt(0).toUpperCase() + modelo.status.slice(1)}
                  variant={modelo.status === 'aprovado' ? 'green' : modelo.status === 'revisao' ? 'yellow' : 'blue'}
                />
              </div>
              <div className="space-y-1 text-sm mb-3">
                <div className="flex justify-between text-slate-500">
                  <span>Materiais:</span>
                  <span>{ficha.itens.length} itens</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Custo total:</span>
                  <strong className="text-slate-700">R$ {custo.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Preço sugerido:</span>
                  <strong className="text-green-600">R$ {preco.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tempo:</span>
                  <span>{ficha.tempoProdução} min</span>
                </div>
              </div>
              <div className="flex gap-1 pt-3 border-t border-slate-50">
                <button onClick={() => setModalView(ficha)} className="flex-1 text-xs text-blue-600 hover:underline">Ver ficha</button>
                <button onClick={() => openEdit(ficha)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteFichaTecnica(ficha.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhuma ficha técnica encontrada</p>
          </div>
        )}
      </div>

      {modalAdd && (
        <Modal title="Nova Ficha Técnica" onClose={() => setModalAdd(false)} size="xl">
          <FichaForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.modeloId}>Salvar</button>
          </div>
        </Modal>
      )}

      {modalEdit && (
        <Modal title="Editar Ficha Técnica" onClose={() => setModalEdit(null)} size="xl">
          <FichaForm />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}

      {modalView && (
        <Modal title={`Ficha Técnica — ${modelos.find(m => m.id === modalView.modeloId)?.nome}`} onClose={() => setModalView(null)} size="lg">
          <div className="space-y-4">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs text-slate-500"><th className="p-2">Material</th><th className="p-2">Qtd</th><th className="p-2">Unid.</th><th className="p-2">Vlr. Unit.</th><th className="p-2">Total</th></tr></thead>
              <tbody>
                {modalView.itens.map((item, i) => {
                  const ins = insumos.find(x => x.id === item.insumoId);
                  return (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="p-2 font-medium">{ins?.nome ?? '—'}</td>
                      <td className="p-2">{item.quantidade}</td>
                      <td className="p-2 text-slate-400">{ins?.unidade}</td>
                      <td className="p-2">R$ {(ins?.valorUnitario ?? 0).toFixed(2)}</td>
                      <td className="p-2 font-medium">R$ {((ins?.valorUnitario ?? 0) * item.quantidade).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Custo materiais:</span><strong>R$ {calcCustoMateriais(modalView.itens).toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Mão de obra:</span><strong>R$ {modalView.custoMaoDeObra.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Outros:</span><strong>R$ {modalView.outrosCustos.toFixed(2)}</strong></div>
              <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 mt-2">
                <span>Custo total:</span><span>R$ {calcCustoTotal(modalView).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Preço sugerido ({modalView.margemLucro}% margem):</span>
                <strong>R$ {calcPrecoVenda(modalView).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
