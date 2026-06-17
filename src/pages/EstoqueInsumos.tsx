import { useState, useMemo } from 'react';
import {
  Plus, Search, ArrowUpCircle, ArrowDownCircle, Edit2, Trash2,
  TrendingDown, ChevronRight, ChevronDown, AlertTriangle, Tag,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Insumo, CategoriaInsumo, UnidadeMedida, GrupoPrincipal } from '../types';
import Modal from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import { getGrupoInsumo, getSubcategoriaInsumo, GRUPO_LABELS } from '../utils/insumoHelpers';

// ── Constants ─────────────────────────────────────────────────────────────────

const GRUPOS_ORDEM: GrupoPrincipal[] = ['aviamentos', 'tecidos', 'linhas', 'reforcos', 'embalagens', 'outros'];

const GRUPO_COLORS: Record<GrupoPrincipal, {
  header: string;
  badge: string;
  border: string;
  dot: string;
}> = {
  aviamentos: {
    header: 'bg-blue-50 text-blue-800 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  tecidos: {
    header: 'bg-purple-50 text-purple-800 border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  linhas: {
    header: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
  },
  reforcos: {
    header: 'bg-orange-50 text-orange-800 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  embalagens: {
    header: 'bg-green-50 text-green-800 border-green-200',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  outros: {
    header: 'bg-slate-50 text-slate-600 border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

const unidades: { value: UnidadeMedida; label: string }[] = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'metro', label: 'Metro' },
  { value: 'kg', label: 'Kg' },
  { value: 'rolo', label: 'Rolo' },
  { value: 'par', label: 'Par' },
  { value: 'litro', label: 'Litro' },
];

// Derive categoria from grupo for backward compat
function categoriaFromGrupo(grupo: GrupoPrincipal): CategoriaInsumo {
  const map: Record<GrupoPrincipal, CategoriaInsumo> = {
    aviamentos: 'acessorios',
    tecidos: 'tecidos',
    linhas: 'linhas',
    reforcos: 'outros',
    embalagens: 'embalagens',
    outros: 'outros',
  };
  return map[grupo];
}

// ── Form types ─────────────────────────────────────────────────────────────────

type FormData = {
  foto?: string;
  nome: string;
  codigo: string;
  grupo: GrupoPrincipal;
  subcategoria: string;
  unidade: UnidadeMedida;
  fornecedorId?: string;
  quantidade: number;
  estoqueMinimo: number;
  valorUnitario: number;
};

const emptyForm = (): FormData => ({
  nome: '',
  codigo: '',
  grupo: 'aviamentos',
  subcategoria: 'Cursor',
  unidade: 'unidade',
  quantidade: 0,
  estoqueMinimo: 0,
  valorUnitario: 0,
});

// ── Main component ─────────────────────────────────────────────────────────────

export default function EstoqueInsumos() {
  const {
    insumos, addInsumo, updateInsumo, deleteInsumo,
    addMovimentacao, usuarioAtual, fornecedores,
    subcategorias, addSubcategoria,
  } = useStore();

  const [search, setSearch] = useState('');
  const [grupoFilter, setGrupoFilter] = useState<GrupoPrincipal | ''>('');
  const [subFilter, setSubFilter] = useState('');
  const [somenteBaixo, setSomenteBaixo] = useState(false);

  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Insumo | null>(null);
  const [modalMov, setModalMov] = useState<{ insumo: Insumo; tipo: 'entrada' | 'saida' } | null>(null);
  const [modalNovaSub, setModalNovaSub] = useState(false);
  const [novaSub, setNovaSub] = useState<{ grupo: GrupoPrincipal; nome: string }>({ grupo: 'aviamentos', nome: '' });

  const [form, setForm] = useState<FormData>(emptyForm());
  const [novaSubInline, setNovaSubInline] = useState('');
  const [showNovaSubInline, setShowNovaSubInline] = useState(false);
  const [movForm, setMovForm] = useState({ quantidade: 0, motivo: '', observacao: '' });

  // Collapsed state for grupo/subcat groups
  const [collapsedGrupos, setCollapsedGrupos] = useState<Set<string>>(new Set());

  const toggleGrupo = (key: string) =>
    setCollapsedGrupos(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  // ── Filtered list ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return insumos.filter(i => {
      const q = search.toLowerCase();
      if (q && !i.nome.toLowerCase().includes(q) && !i.codigo.toLowerCase().includes(q)) return false;
      if (grupoFilter && getGrupoInsumo(i) !== grupoFilter) return false;
      if (subFilter && getSubcategoriaInsumo(i) !== subFilter) return false;
      if (somenteBaixo && i.quantidade > i.estoqueMinimo) return false;
      return true;
    });
  }, [insumos, search, grupoFilter, subFilter, somenteBaixo]);

  // ── Hierarchical grouping ────────────────────────────────────────────────────
  // Structure: grupo → subcategoria → items
  const grouped = useMemo(() => {
    const map = new Map<GrupoPrincipal, Map<string, Insumo[]>>();
    // Ensure all gruops exist in order
    GRUPOS_ORDEM.forEach(g => map.set(g, new Map()));

    filtered.forEach(i => {
      const g = getGrupoInsumo(i);
      const sub = getSubcategoriaInsumo(i);
      const grupMap = map.get(g)!;
      if (!grupMap.has(sub)) grupMap.set(sub, []);
      grupMap.get(sub)!.push(i);
    });

    // Remove empty groups
    GRUPOS_ORDEM.forEach(g => {
      if (map.get(g)!.size === 0) map.delete(g);
    });

    return map;
  }, [filtered]);

  // Subcategories for the currently selected grupo filter
  const subsByGrupo = useMemo(() => {
    const g = grupoFilter || form.grupo;
    return subcategorias.filter(sc => sc.grupo === g).map(sc => sc.nome);
  }, [subcategorias, grupoFilter, form.grupo]);

  const subsByFormGrupo = useMemo(() =>
    subcategorias.filter(sc => sc.grupo === form.grupo).map(sc => sc.nome),
    [subcategorias, form.grupo]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const buildInsumoData = (f: FormData): Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'> => ({
    foto: f.foto,
    nome: f.nome,
    codigo: f.codigo || f.nome.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 15),
    categoria: categoriaFromGrupo(f.grupo),
    grupo: f.grupo,
    subcategoria: f.subcategoria,
    unidade: f.unidade,
    fornecedorId: f.fornecedorId,
    quantidade: f.quantidade,
    estoqueMinimo: f.estoqueMinimo,
    valorUnitario: f.valorUnitario,
  });

  const handleAdd = () => {
    addInsumo(buildInsumoData(form));
    setForm(emptyForm());
    setShowNovaSubInline(false);
    setNovaSubInline('');
    setModalAdd(false);
  };

  const handleEdit = () => {
    if (!modalEdit) return;
    updateInsumo(modalEdit.id, buildInsumoData(form));
    setModalEdit(null);
  };

  const openEdit = (insumo: Insumo) => {
    setForm({
      foto: insumo.foto,
      nome: insumo.nome,
      codigo: insumo.codigo,
      grupo: getGrupoInsumo(insumo),
      subcategoria: getSubcategoriaInsumo(insumo),
      unidade: insumo.unidade,
      fornecedorId: insumo.fornecedorId,
      quantidade: insumo.quantidade,
      estoqueMinimo: insumo.estoqueMinimo,
      valorUnitario: insumo.valorUnitario,
    });
    setShowNovaSubInline(false);
    setNovaSubInline('');
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

  const handleAddNovaSub = () => {
    if (!novaSub.nome.trim()) return;
    addSubcategoria({ grupo: novaSub.grupo, nome: novaSub.nome.trim() });
    setNovaSub({ grupo: 'aviamentos', nome: '' });
    setModalNovaSub(false);
  };

  const handleAddSubInline = () => {
    const nome = novaSubInline.trim();
    if (!nome) return;
    addSubcategoria({ grupo: form.grupo, nome });
    setForm(f => ({ ...f, subcategoria: nome }));
    setNovaSubInline('');
    setShowNovaSubInline(false);
  };

  // ── Totals ───────────────────────────────────────────────────────────────────

  const totalValor = filtered.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const totalAbaixo = insumos.filter(i => i.quantidade <= i.estoqueMinimo).length;

  // ── Form subcomponent ─────────────────────────────────────────────────────────

  const FormInsumo = () => (
    <div className="space-y-4">
      <ImageUpload value={form.foto} onChange={(v) => setForm(f => ({ ...f, foto: v }))} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input
            className="input"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Nome do insumo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
          <input
            className="input"
            value={form.codigo}
            onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
            placeholder="Auto-gerado se vazio"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
          <select
            className="input"
            value={form.grupo}
            onChange={e => {
              const g = e.target.value as GrupoPrincipal;
              const firstSub = subcategorias.find(sc => sc.grupo === g)?.nome ?? '';
              setForm(f => ({ ...f, grupo: g, subcategoria: firstSub }));
              setShowNovaSubInline(false);
              setNovaSubInline('');
            }}
          >
            {GRUPOS_ORDEM.map(g => (
              <option key={g} value={g}>{GRUPO_LABELS[g]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subcategoria</label>
          {showNovaSubInline ? (
            <div className="flex gap-1">
              <input
                className="input flex-1 text-sm"
                value={novaSubInline}
                onChange={e => setNovaSubInline(e.target.value)}
                placeholder="Nome da subcategoria"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleAddSubInline(); }}
              />
              <button
                type="button"
                onClick={handleAddSubInline}
                className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => { setShowNovaSubInline(false); setNovaSubInline(''); }}
                className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-300"
              >
                ✕
              </button>
            </div>
          ) : (
            <select
              className="input"
              value={form.subcategoria}
              onChange={e => {
                if (e.target.value === '__nova__') {
                  setShowNovaSubInline(true);
                } else {
                  setForm(f => ({ ...f, subcategoria: e.target.value }));
                }
              }}
            >
              {subsByFormGrupo.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__nova__">➕ Nova subcategoria...</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
          <select className="input" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value as UnidadeMedida }))}>
            {unidades.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
          <select className="input" value={form.fornecedorId ?? ''} onChange={e => setForm(f => ({ ...f, fornecedorId: e.target.value || undefined }))}>
            <option value="">Selecione...</option>
            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque de Insumos</h1>
          <p className="text-sm text-slate-500">{insumos.length} materiais cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModalNovaSub(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Tag size={15} />
            Nova Subcategoria
          </button>
          <button
            onClick={() => { setForm(emptyForm()); setShowNovaSubInline(false); setNovaSubInline(''); setModalAdd(true); }}
            className="btn-primary"
          >
            <Plus size={16} /> Novo Insumo
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Buscar por nome ou código..."
            className="input pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-48"
          value={grupoFilter}
          onChange={e => { setGrupoFilter(e.target.value as GrupoPrincipal | ''); setSubFilter(''); }}
        >
          <option value="">Todos os grupos</option>
          {GRUPOS_ORDEM.map(g => (
            <option key={g} value={g}>{GRUPO_LABELS[g]}</option>
          ))}
        </select>
        <select
          className="input w-48"
          value={subFilter}
          onChange={e => setSubFilter(e.target.value)}
          disabled={!grupoFilter}
        >
          <option value="">Todas subcategorias</option>
          {subsByGrupo.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => setSomenteBaixo(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            somenteBaixo
              ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle size={14} />
          Abaixo do mínimo
          {totalAbaixo > 0 && (
            <span className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full font-bold ${
              somenteBaixo ? 'bg-red-200 text-red-800' : 'bg-red-500 text-white'
            }`}>
              {totalAbaixo}
            </span>
          )}
        </button>
      </div>

      {/* Hierarchical display */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 py-16 text-center text-slate-400">
            <PackageIcon size={40} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">Nenhum insumo encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        )}

        {GRUPOS_ORDEM.filter(g => grouped.has(g)).map(grupo => {
          const subMap = grouped.get(grupo)!;
          const colors = GRUPO_COLORS[grupo];
          const grupoTotal = [...subMap.values()].flat().reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
          const grupoCount = [...subMap.values()].flat().length;
          const grupoKey = `g-${grupo}`;
          const isCollapsed = collapsedGrupos.has(grupoKey);

          return (
            <div key={grupo} className={`rounded-xl border ${colors.border} overflow-hidden shadow-sm`}>
              {/* Grupo header */}
              <button
                type="button"
                onClick={() => toggleGrupo(grupoKey)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${colors.header} transition-colors hover:opacity-90`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} flex-shrink-0`} />
                <span className="font-semibold text-sm flex-1 text-left">{GRUPO_LABELS[grupo]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge} font-medium`}>
                  {grupoCount} {grupoCount === 1 ? 'item' : 'itens'}
                </span>
                <span className="text-xs font-medium opacity-70 ml-2">
                  R$ {grupoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {isCollapsed
                  ? <ChevronRight size={16} className="opacity-60 ml-1" />
                  : <ChevronDown size={16} className="opacity-60 ml-1" />
                }
              </button>

              {/* Subcategories */}
              {!isCollapsed && (
                <div className="bg-white divide-y divide-slate-50">
                  {[...subMap.entries()].map(([sub, items]) => {
                    const subKey = `${grupo}-${sub}`;
                    const isSubCollapsed = collapsedGrupos.has(subKey);
                    const subTotal = items.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);

                    return (
                      <div key={sub}>
                        {/* Sub-header */}
                        <button
                          type="button"
                          onClick={() => toggleGrupo(subKey)}
                          className="w-full flex items-center gap-2 pl-8 pr-4 py-2 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left"
                        >
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex-1">
                            {sub}
                          </span>
                          <span className="text-xs text-slate-400">
                            {items.length} {items.length === 1 ? 'item' : 'itens'}
                          </span>
                          <span className="text-xs text-slate-400 ml-3">
                            R$ {subTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {isSubCollapsed
                            ? <ChevronRight size={14} className="text-slate-400 ml-1" />
                            : <ChevronDown size={14} className="text-slate-400 ml-1" />
                          }
                        </button>

                        {/* Item rows */}
                        {!isSubCollapsed && (
                          <div className="divide-y divide-slate-50">
                            {items.map(insumo => {
                              const abaixo = insumo.quantidade <= insumo.estoqueMinimo;
                              return (
                                <div
                                  key={insumo.id}
                                  className={`flex items-center gap-3 pl-10 pr-4 py-3 hover:bg-slate-50 transition-colors ${
                                    abaixo ? 'bg-red-50/30' : ''
                                  }`}
                                >
                                  {/* Photo / icon */}
                                  {insumo.foto ? (
                                    <img src={insumo.foto} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <PackageIcon size={15} className="text-slate-400" />
                                    </div>
                                  )}

                                  {/* Name + code */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 text-sm truncate">{insumo.nome}</p>
                                    <p className="text-xs text-slate-400">{insumo.codigo}</p>
                                  </div>

                                  {/* Quantity */}
                                  <div className="flex items-center gap-1 min-w-[90px] justify-end">
                                    {abaixo && <TrendingDown size={13} className="text-red-500" />}
                                    <span className={`font-semibold text-sm ${abaixo ? 'text-red-600' : 'text-slate-700'}`}>
                                      {insumo.quantidade.toLocaleString('pt-BR')}
                                    </span>
                                    <span className="text-xs text-slate-400">{insumo.unidade}</span>
                                  </div>

                                  {/* Min stock */}
                                  <div className="hidden md:block text-xs text-slate-400 min-w-[70px] text-right">
                                    mín {insumo.estoqueMinimo} {insumo.unidade}
                                  </div>

                                  {/* Unit price */}
                                  <div className="hidden lg:block text-sm text-slate-500 min-w-[80px] text-right">
                                    R$ {insumo.valorUnitario.toFixed(2)}
                                  </div>

                                  {/* Total value */}
                                  <div className="text-sm font-medium text-slate-700 min-w-[90px] text-right">
                                    R$ {(insumo.quantidade * insumo.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={() => { setModalMov({ insumo, tipo: 'entrada' }); setMovForm({ quantidade: 0, motivo: 'Compra', observacao: '' }); }}
                                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                      title="Entrada"
                                    >
                                      <ArrowUpCircle size={15} />
                                    </button>
                                    <button
                                      onClick={() => { setModalMov({ insumo, tipo: 'saida' }); setMovForm({ quantidade: 0, motivo: 'Uso em produção', observacao: '' }); }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Saída"
                                    >
                                      <ArrowDownCircle size={15} />
                                    </button>
                                    <button
                                      onClick={() => openEdit(insumo)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Editar"
                                    >
                                      <Edit2 size={15} />
                                    </button>
                                    <button
                                      onClick={() => deleteInsumo(insumo.id)}
                                      className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-400">Itens exibidos</p>
            <p className="font-bold text-slate-800">{filtered.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Valor total em estoque</p>
            <p className="font-bold text-slate-800">
              R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Abaixo do mínimo</p>
            <p className={`font-bold ${totalAbaixo > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalAbaixo}
            </p>
          </div>
        </div>
      )}

      {/* Modal Adicionar */}
      {modalAdd && (
        <Modal title="Novo Insumo" onClose={() => setModalAdd(false)} size="lg">
          {FormInsumo()}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} className="btn-primary" disabled={!form.nome}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <Modal title="Editar Insumo" onClose={() => setModalEdit(null)} size="lg">
          {FormInsumo()}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantidade ({modalMov.insumo.unidade})
              </label>
              <input
                type="number"
                className="input"
                value={movForm.quantidade}
                onChange={e => setMovForm(f => ({ ...f, quantidade: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
              <input
                className="input"
                value={movForm.motivo}
                onChange={e => setMovForm(f => ({ ...f, motivo: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observação</label>
              <textarea
                className="input"
                rows={2}
                value={movForm.observacao}
                onChange={e => setMovForm(f => ({ ...f, observacao: e.target.value }))}
              />
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

      {/* Modal Nova Subcategoria */}
      {modalNovaSub && (
        <Modal title="Nova Subcategoria" onClose={() => setModalNovaSub(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
              <select
                className="input"
                value={novaSub.grupo}
                onChange={e => setNovaSub(s => ({ ...s, grupo: e.target.value as GrupoPrincipal }))}
              >
                {GRUPOS_ORDEM.map(g => (
                  <option key={g} value={g}>{GRUPO_LABELS[g]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
              <input
                className="input"
                value={novaSub.nome}
                onChange={e => setNovaSub(s => ({ ...s, nome: e.target.value }))}
                placeholder="Ex: Mosquetão de Pressão"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setModalNovaSub(false)} className="btn-ghost">Cancelar</button>
              <button
                onClick={handleAddNovaSub}
                className="btn-primary"
                disabled={!novaSub.nome.trim()}
              >
                Criar Subcategoria
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Inline SVG package icon to avoid import issues
function PackageIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}
