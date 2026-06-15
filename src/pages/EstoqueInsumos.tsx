import { useState } from 'react';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, Edit2, Trash2, TrendingDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Insumo, CategoriaInsumo, UnidadeMedida } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import ImageUpload from '../components/ImageUpload';

const categorias: { value: CategoriaInsumo; label: string }[] = [
  { value: 'cursores', label: 'Cursores' },
  { value: 'zipes', label: 'Zípers' },
  { value: 'fivelas', label: 'Fivelas' },
  { value: 'tecidos', label: 'Tecidos' },
  { value: 'linhas', label: 'Linhas' },
  { value: 'etiquetas', label: 'Etiquetas' },
  { value: 'embalagens', label: 'Embalagens' },
  { value: 'acessorios', label: 'Acessórios' },
  { value: 'outros', label: 'Outros' },
];

const unidades: { value: UnidadeMedida; label: string }[] = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'metro', label: 'Metro' },
  { value: 'kg', label: 'Kg' },
  { value: 'rolo', label: 'Rolo' },
  { value: 'par', label: 'Par' },
  { value: 'litro', label: 'Litro' },
];

const categoriaVariant: Record<CategoriaInsumo, 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange'> = {
  cursores: 'blue', zipes: 'green', fivelas: 'orange',
  tecidos: 'purple', linhas: 'yellow', etiquetas: 'red',
  embalagens: 'gray', acessorios: 'blue', outros: 'gray',
};

const emptyForm = (): Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'> => ({
  nome: '', codigo: '', categoria: 'cursores', unidade: 'unidade',
  quantidade: 0, estoqueMinimo: 0, valorUnitario: 0,
});

export default function EstoqueInsumos() {
  const { insumos, addInsumo, updateInsumo, deleteInsumo, addMovimentacao, usuarioAtual, fornecedores } = useStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Insumo | null>(null);
  const [modalMov, setModalMov] = useState<{ insumo: Insumo; tipo: 'entrada' | 'saida' } | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [movForm, setMovForm] = useState({ quantidade: 0, motivo: '', observacao: '' });

  const filtered = insumos.filter(i =>
    (i.nome.toLowerCase().includes(search.toLowerCase()) || i.codigo.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || i.categoria === catFilter)
  );

  const handleAdd = () => {
    addInsumo(form);
    setForm(emptyForm());
    setModalAdd(false);
  };

  const handleEdit = () => {
    if (!modalEdit) return;
    updateInsumo(modalEdit.id, form);
    setModalEdit(null);
  };

  const openEdit = (insumo: Insumo) => {
    setForm({ ...insumo });
    setModalEdit(insumo);
  };

  const handleMov = () => {
    if (!modalMov) return;
    addMovimentacao({
      insumoId: modalMov.insumo.id,
      tipo: modalMov.tipo,
      quantidade: movForm.quantidade,
      motivo: movForm.motivo,
      usuarioId: usuarioAtual?.id ?? '',
      observacao: movForm.observacao,
    });
    setModalMov(null);
    setMovForm({ quantidade: 0, motivo: '', observacao: '' });
  };

  const FormInsumo = () => (
    <div className="space-y-4">
      <ImageUpload value={form.foto} onChange={(v) => setForm(f => ({ ...f, foto: v }))} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
          <input className="input" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaInsumo }))}>
            {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
          <select className="input" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value as UnidadeMedida }))}>
            {unidades.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
        <select className="input" value={form.fornecedorId ?? ''} onChange={e => setForm(f => ({ ...f, fornecedorId: e.target.value || undefined }))}>
          <option value="">Selecione...</option>
          {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
          <input type="number" className="input" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
          <input type="number" className="input" value={form.estoqueMinimo} onChange={e => setForm(f => ({ ...f, estoqueMinimo: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor Unitário (R$)</label>
          <input type="number" step="0.01" className="input" value={form.valorUnitario} onChange={e => setForm(f => ({ ...f, valorUnitario: Number(e.target.value) }))} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque de Insumos</h1>
          <p className="text-sm text-slate-500">{insumos.length} materiais cadastrados</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
          <Plus size={16} /> Novo Insumo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Buscar por nome ou código..."
            className="input pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-44" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Quantidade</th>
                <th className="px-4 py-3">Mínimo</th>
                <th className="px-4 py-3">Valor Unit.</th>
                <th className="px-4 py-3">Valor Total</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(insumo => {
                const abaixo = insumo.quantidade <= insumo.estoqueMinimo;
                return (
                  <tr key={insumo.id} className={`hover:bg-slate-50 ${abaixo ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {insumo.foto ? (
                          <img src={insumo.foto} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package size={16} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{insumo.nome}</p>
                          <p className="text-xs text-slate-400">{insumo.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={categorias.find(c => c.value === insumo.categoria)?.label ?? ''} variant={categoriaVariant[insumo.categoria]} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {abaixo && <TrendingDown size={14} className="text-red-500" />}
                        <span className={`font-semibold text-sm ${abaixo ? 'text-red-600' : 'text-slate-700'}`}>
                          {insumo.quantidade.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-xs text-slate-400">{insumo.unidade}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {insumo.estoqueMinimo} {insumo.unidade}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      R$ {insumo.valorUnitario.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      R$ {(insumo.quantidade * insumo.valorUnitario).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setModalMov({ insumo, tipo: 'entrada' }); setMovForm({ quantidade: 0, motivo: 'Compra', observacao: '' }); }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Entrada"
                        >
                          <ArrowUpCircle size={16} />
                        </button>
                        <button
                          onClick={() => { setModalMov({ insumo, tipo: 'saida' }); setMovForm({ quantidade: 0, motivo: 'Uso em produção', observacao: '' }); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Saída"
                        >
                          <ArrowDownCircle size={16} />
                        </button>
                        <button onClick={() => openEdit(insumo)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteInsumo(insumo.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded">
                          <Trash2 size={16} />
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
              <Package size={40} className="mx-auto mb-2 opacity-30" />
              <p>Nenhum insumo encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 flex gap-6">
        <div>
          <p className="text-xs text-slate-400">Total em estoque</p>
          <p className="font-bold text-slate-800">
            R$ {filtered.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Itens abaixo do mínimo</p>
          <p className="font-bold text-red-600">{filtered.filter(i => i.quantidade <= i.estoqueMinimo).length}</p>
        </div>
      </div>

      {/* Modal Adicionar */}
      {modalAdd && (
        <Modal title="Novo Insumo" onClose={() => setModalAdd(false)} size="lg">
          <FormInsumo />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.nome}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <Modal title="Editar Insumo" onClose={() => setModalEdit(null)} size="lg">
          <FormInsumo />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal Movimentação */}
      {modalMov && (
        <Modal
          title={`${modalMov.tipo === 'entrada' ? 'Entrada' : 'Saída'} — ${modalMov.insumo.nome}`}
          onClose={() => setModalMov(null)}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade ({modalMov.insumo.unidade})</label>
              <input type="number" className="input" value={movForm.quantidade} onChange={e => setMovForm(f => ({ ...f, quantidade: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
              <input className="input" value={movForm.motivo} onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observação</label>
              <textarea className="input" rows={2} value={movForm.observacao} onChange={e => setMovForm(f => ({ ...f, observacao: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setModalMov(null)} className="btn-ghost">Cancelar</button>
              <button
                onClick={handleMov}
                className={modalMov.tipo === 'entrada' ? 'btn-success' : 'btn-danger'}
                disabled={movForm.quantidade <= 0}
              >
                {modalMov.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Package({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>
    </svg>
  );
}
