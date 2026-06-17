import { useState, useRef, Fragment } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, X, Upload, Download, CheckCircle, AlertCircle, Package, Printer, FileDown, History, Scissors } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import type {
  FichaTecnica, ItemFichaTecnica, SecaoFicha,
  MoldeItem, CheckListItem, FichaCabecalho, CategoriaModelo,
  CorteItem, UnidadeCorte,
} from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { parseExcelFicha, processarImport } from '../utils/excelFicha';
import { getGrupoInsumo, getSubcategoriaInsumo, GRUPO_LABELS, suportaCortes, calcularConsumoCortes, corteToMetros } from '../utils/insumoHelpers';
import { exportarFichaTemplate } from '../lib/exportFichaTemplate';

const SECAO_LABELS: Record<SecaoFicha, string> = {
  corte: 'Corte',
  aviamentos: 'Aviamentos 1',
  acabamento: 'Acabamento',
  cliente: 'Cliente',
  travetes: 'Travetes',
};

type FormTab = 'cabecalho' | 'tecidos' | 'aviamentos' | 'moldes' | 'checklist' | 'romaneio' | 'relatorio';
type ViewTab = 'cabecalho' | 'tecidos' | 'aviamentos' | 'moldes' | 'checklist' | 'romaneio' | 'relatorio';
type AviSecao = 'aviamentos' | 'acabamento' | 'cliente' | 'travetes';

const DEFAULT_CABECALHO = (): FichaCabecalho => ({
  cliente: '', representante: '', pedido: '', refCliente: '', refMatriz: '',
  colecao: '', qtdMostruario: 0, custoConfeccaoUnid: 0, quantidadeFicha: 0,
  dataPedido: '', dataEntrega: '', inicioProducao: '', terminoProducao: '',
  oficina: '', telefone: '', cortador: '', qtdMoldesTotal: 0, qtdGabaritos: 0,
});

type FormState = Omit<FichaTecnica, 'id' | 'criadoEm' | 'atualizadoEm'> & {
  criarNovoModelo: boolean;
  novoModeloNome: string;
  novoModeloCodigo: string;
  novoModeloCategoria: CategoriaModelo;
};

const emptyForm = (modeloId = ''): FormState => ({
  modeloId,
  itens: [],
  tempoProdução: 0,
  custoMaoDeObra: 0,
  outrosCustos: 0,
  margemLucro: 20,
  moldes: [],
  checkList: [],
  romaneio: { oficina: '', telefone: '', dataEnvio: '', dataRetirada: '', qtdEnviada: 0, desconto: 0, totalFicha: 0, observacoes: '' },
  relatorio: {
    oficina: '', prazoEntrega: '',
    corteTecidosOk: null, corteAviamentosOk: null,
    retalhosTecidosOk: null, retalhosAviamentosOk: null,
    notaQualidade: 0, notaOrganizacao: 0, diasAtraso: 0, qtdDefeitos: 0, observacoes: '',
  },
  cabecalho: DEFAULT_CABECALHO(),
  tecidosCorte: [],
  aviamentosFicha: [],
  versao: 1,
  historicoExportes: [],
  criarNovoModelo: false,
  novoModeloNome: '',
  novoModeloCodigo: '',
  novoModeloCategoria: 'bolsas',
});

export default function FichasTecnicas() {
  const store = useStore();
  const {
    fichasTecnicas, addFichaTecnica, updateFichaTecnica, deleteFichaTecnica,
    modelos, insumos, addInsumo, addModelo,
  } = store;

  const [search, setSearch] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<FichaTecnica | null>(null);
  const [modalView, setModalView] = useState<FichaTecnica | null>(null);
  const [modalImport, setModalImport] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formTab, setFormTab] = useState<FormTab>('cabecalho');
  const [viewTab, setViewTab] = useState<ViewTab>('cabecalho');
  const [aviSecao, setAviSecao] = useState<AviSecao>('aviamentos');
  const [activeCutsIdx, setActiveCutsIdx] = useState<number | null>(null);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{
    parsed: ReturnType<typeof parseExcelFicha>;
    processed: ReturnType<typeof processarImport>;
  } | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'preview' | 'done' | 'error'>('idle');
  const [importError, setImportError] = useState('');

  const fichasComModelo = fichasTecnicas.map(f => ({
    ...f,
    modelo: modelos.find(m => m.id === f.modeloId),
  }));

  const filtered = fichasComModelo.filter(f =>
    (f.modelo?.nome.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (f.modelo?.codigo.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  // ─── FORM HELPERS ────────────────────────────────────────────────────────────
  const setCab = (patch: Partial<FichaCabecalho>) =>
    setForm(f => ({ ...f, cabecalho: { ...f.cabecalho, ...patch } }));

  const addItem = (secao: SecaoFicha) =>
    setForm(f => ({ ...f, itens: [...f.itens, { insumoId: '', quantidade: 0, secao }] }));

  const removeItem = (idx: number) =>
    setForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));

  const updateItem = (idx: number, patch: Partial<ItemFichaTecnica>) =>
    setForm(f => ({ ...f, itens: f.itens.map((item, i) => i === idx ? { ...item, ...patch } : item) }));

  const changeFormTab = (tab: FormTab) => { setFormTab(tab); setActiveCutsIdx(null); };

  const addCorte = (itemIdx: number) =>
    setForm(f => ({
      ...f,
      itens: f.itens.map((item, i) => i === itemIdx
        ? { ...item, cortes: [...(item.cortes ?? []), { id: uuidv4(), descricao: '', tamanho: 0, unidade: 'cm' as UnidadeCorte, quantidade: 1 }] }
        : item),
    }));

  const removeCorte = (itemIdx: number, corteId: string) =>
    setForm(f => ({
      ...f,
      itens: f.itens.map((item, i) => i === itemIdx
        ? { ...item, cortes: (item.cortes ?? []).filter(c => c.id !== corteId) }
        : item),
    }));

  const updateCorte = (itemIdx: number, corteId: string, patch: Partial<CorteItem>) =>
    setForm(f => ({
      ...f,
      itens: f.itens.map((item, i) => i === itemIdx
        ? { ...item, cortes: (item.cortes ?? []).map(c => c.id === corteId ? { ...c, ...patch } : c) }
        : item),
    }));

  const addMolde = () =>
    setForm(f => ({
      ...f,
      moldes: [...f.moldes, { id: uuidv4(), numero: String(f.moldes.length + 1), descricao: '', quantidade: '', cor: '' }],
    }));

  const removeMolde = (id: string) =>
    setForm(f => ({ ...f, moldes: f.moldes.filter(m => m.id !== id) }));

  const updateMolde = (id: string, patch: Partial<MoldeItem>) =>
    setForm(f => ({ ...f, moldes: f.moldes.map(m => m.id === id ? { ...m, ...patch } : m) }));

  const addCheckItem = () =>
    setForm(f => ({
      ...f,
      checkList: [...f.checkList, { id: uuidv4(), descricao: '', ok: null, responsavel: '', obs: '' }],
    }));

  const removeCheckItem = (id: string) =>
    setForm(f => ({ ...f, checkList: f.checkList.filter(c => c.id !== id) }));

  const updateCheckItem = (id: string, patch: Partial<CheckListItem>) =>
    setForm(f => ({ ...f, checkList: f.checkList.map(c => c.id === id ? { ...c, ...patch } : c) }));

  // ─── SAVE HANDLERS ───────────────────────────────────────────────────────────
  const handleAdd = () => {
    let modeloId = form.modeloId;
    if (form.criarNovoModelo) {
      addModelo({
        nome: form.novoModeloNome,
        codigo: form.novoModeloCodigo,
        categoria: form.novoModeloCategoria,
        galeria: [],
        descricao: '',
        observacoes: '',
        status: 'desenvolvimento',
      });
      const criado = useStore.getState().modelos.find(m => m.nome === form.novoModeloNome && m.codigo === form.novoModeloCodigo);
      if (!criado) return;
      modeloId = criado.id;
    }
    addFichaTecnica({ ...form, modeloId });
    setForm(emptyForm());
    setFormTab('cabecalho');
    setModalAdd(false);
  };

  const handleEdit = () => {
    if (!modalEdit) return;
    updateFichaTecnica(modalEdit.id, form);
    setModalEdit(null);
  };

  const openEdit = (ficha: FichaTecnica) => {
    setForm({
      ...emptyForm(),
      ...ficha,
      cabecalho: ficha.cabecalho ?? DEFAULT_CABECALHO(),
      tecidosCorte: ficha.tecidosCorte ?? [],
      aviamentosFicha: ficha.aviamentosFicha ?? [],
    });
    setFormTab('cabecalho');
    setModalEdit(ficha);
  };

  const openView = (ficha: FichaTecnica) => { setModalView(ficha); setViewTab('cabecalho'); };

  const toggleCheckItem = (itemId: string, ok: boolean | null) => {
    if (!modalView) return;
    const newCheckList = modalView.checkList.map(c => c.id === itemId ? { ...c, ok } : c);
    updateFichaTecnica(modalView.id, { checkList: newCheckList });
    setModalView(prev => prev ? { ...prev, checkList: newCheckList } : prev);
  };

  // ─── IMPORT ──────────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('parsing');
    setImportError('');
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelFicha(buffer);
      const processed = processarImport(parsed, insumos);
      setImportPreview({ parsed, processed });
      setImportStatus('preview');
    } catch {
      setImportError('Erro ao ler o arquivo. Verifique se é um Excel (.xlsx) válido.');
      setImportStatus('error');
    }
    e.target.value = '';
  };

  const confirmarImport = () => {
    if (!importPreview) return;
    const { processed } = importPreview;

    const novosInsumosIds: Record<string, string> = {};
    processed.insumosParaCriar.forEach(insumoData => {
      const existing = insumos.find(i =>
        i.nome.toLowerCase().trim().includes(insumoData.nome.toLowerCase().trim())
      );
      if (existing) {
        novosInsumosIds[insumoData.nome.toLowerCase().trim()] = existing.id;
      } else {
        addInsumo(insumoData);
        const added = useStore.getState().insumos.find(i => i.nome === insumoData.nome);
        if (added) novosInsumosIds[insumoData.nome.toLowerCase().trim()] = added.id;
      }
    });

    addModelo(processed.modeloNovo);
    const modeloCriado = useStore.getState().modelos.find(m => m.nome === processed.modeloNovo.nome);
    if (!modeloCriado) return;

    const insumosAtualizados = useStore.getState().insumos;
    const itensFicha: ItemFichaTecnica[] = processed.insumosResolvidos
      .map(r => {
        let insumoId = r.insumoExistenteId;
        if (!insumoId && r.isNovo) {
          const found = insumosAtualizados.find(i =>
            i.nome.toLowerCase().trim().includes(r.insumoNome.toLowerCase().trim()) ||
            r.insumoNome.toLowerCase().trim().includes(i.nome.toLowerCase().trim())
          );
          insumoId = found?.id ?? novosInsumosIds[r.insumoNome.toLowerCase().trim()];
        }
        if (!insumoId) return null;
        return { insumoId, quantidade: r.quantidade, secao: (r.secao as SecaoFicha | undefined) ?? 'corte' };
      })
      .filter(Boolean) as ItemFichaTecnica[];

    addFichaTecnica({
      ...processed.fichaNova,
      modeloId: modeloCriado.id,
      itens: itensFicha,
    });

    setImportStatus('done');
    setTimeout(() => {
      setModalImport(false);
      setImportStatus('idle');
      setImportPreview(null);
    }, 2000);
  };

  const resetImport = () => {
    setImportStatus('idle');
    setImportPreview(null);
    setImportError('');
  };

  // ─── EXPORT ──────────────────────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [modalHistorico, setModalHistorico] = useState<FichaTecnica | null>(null);

  const handleExportExcel = async (ficha: FichaTecnica) => {
    const modelo = modelos.find(m => m.id === ficha.modeloId);
    if (!modelo) return;
    setExportLoading(ficha.id);
    const novaVersao = (ficha.versao ?? 1);
    try {
      const result = await exportarFichaTemplate({ ficha, modelo, insumos, versao: novaVersao });
      if (result.ok) {
        const novoHistorico = [
          ...(ficha.historicoExportes ?? []),
          { data: new Date().toISOString(), versao: novaVersao, tipo: 'excel' as const },
        ];
        updateFichaTecnica(ficha.id, {
          versao: novaVersao + 1,
          historicoExportes: novoHistorico,
        });
      } else if (!result.canceled) {
        alert(`Erro ao exportar: ${result.error}`);
      }
    } finally {
      setExportLoading(null);
    }
  };

  const handlePrint = (ficha: FichaTecnica) => {
    const modelo = modelos.find(m => m.id === ficha.modeloId);
    if (!modelo) return;
    setModalPrint({ ficha, modelo });
  };

  const [modalPrint, setModalPrint] = useState<{ ficha: FichaTecnica; modelo: ReturnType<typeof modelos.find> } | null>(null);

  // ─── TAB BAR COMPONENT ───────────────────────────────────────────────────────
  const FormTabBar = () => {
    const tabs: [FormTab, string][] = [
      ['cabecalho', 'Cabeçalho'],
      ['tecidos', 'Tecidos'],
      ['aviamentos', 'Aviamentos'],
      ['moldes', 'Moldes'],
      ['checklist', 'Check List'],
      ['romaneio', 'Romaneio'],
      ['relatorio', 'Relatório'],
    ];
    return (
      <div className="flex gap-1 flex-wrap border-b border-slate-100 pb-2 mb-4">
        {tabs.map(([tab, lbl]) => (
          <button
            key={tab}
            type="button"
            onClick={() => changeFormTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              formTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    );
  };

  // ─── FORM ────────────────────────────────────────────────────────────────────
  const FichaForm = () => {
    const valorTotal = form.cabecalho.custoConfeccaoUnid * form.cabecalho.quantidadeFicha;

    return (
      <div>
        {FormTabBar()}

        {/* ── Tab: Cabeçalho ───────────────────────────────── */}
        {formTab === 'cabecalho' && (
          <div className="space-y-4">
            {/* Modelo selector */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.criarNovoModelo}
                    onChange={e => setForm(f => ({ ...f, criarNovoModelo: e.target.checked }))}
                    className="rounded"
                  />
                  Criar novo modelo
                </label>
              </div>
              {!form.criarNovoModelo ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <select className="input" value={form.modeloId} onChange={e => setForm(f => ({ ...f, modeloId: e.target.value }))}>
                    <option value="">Selecione um modelo...</option>
                    {modelos.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.codigo})</option>)}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Modelo</label>
                    <input className="input" value={form.novoModeloNome} onChange={e => setForm(f => ({ ...f, novoModeloNome: e.target.value }))} placeholder="Ex: Mochila Top" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                    <input className="input" value={form.novoModeloCodigo} onChange={e => setForm(f => ({ ...f, novoModeloCodigo: e.target.value }))} placeholder="Ex: MCH-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <select className="input" value={form.novoModeloCategoria} onChange={e => setForm(f => ({ ...f, novoModeloCategoria: e.target.value as CategoriaModelo }))}>
                      <option value="mochilas">Mochilas</option>
                      <option value="bolsas">Bolsas</option>
                      <option value="pochetes">Pochetes</option>
                      <option value="necessaires">Necessaires</option>
                      <option value="carteiras">Carteiras</option>
                      <option value="acessorios">Acessórios</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Cabeçalho fields */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cliente</label>
                <input className="input text-sm" value={form.cabecalho.cliente} onChange={e => setCab({ cliente: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Representante</label>
                <input className="input text-sm" value={form.cabecalho.representante} onChange={e => setCab({ representante: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pedido</label>
                <input className="input text-sm" value={form.cabecalho.pedido} onChange={e => setCab({ pedido: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ref. Cliente</label>
                <input className="input text-sm" value={form.cabecalho.refCliente} onChange={e => setCab({ refCliente: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ref. Matriz</label>
                <input className="input text-sm" value={form.cabecalho.refMatriz} onChange={e => setCab({ refMatriz: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Coleção</label>
                <input className="input text-sm" value={form.cabecalho.colecao} onChange={e => setCab({ colecao: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">QTD Mostruário LS</label>
                <input type="number" className="input text-sm" value={form.cabecalho.qtdMostruario} onChange={e => setCab({ qtdMostruario: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Custo Confecção (R$/unid)</label>
                <input type="number" step="0.01" className="input text-sm" value={form.cabecalho.custoConfeccaoUnid} onChange={e => setCab({ custoConfeccaoUnid: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantidade Ficha</label>
                <input type="number" className="input text-sm" value={form.cabecalho.quantidadeFicha} onChange={e => setCab({ quantidadeFicha: Number(e.target.value) })} />
              </div>
            </div>

            {/* Valor Total (auto) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex justify-between items-center">
              <span className="text-sm text-blue-700 font-medium">Valor Total (Custo × Qtd):</span>
              <strong className="text-blue-800">R$ {valorTotal.toFixed(2)}</strong>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data Pedido</label>
                <input type="date" className="input text-sm" value={form.cabecalho.dataPedido} onChange={e => setCab({ dataPedido: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data Entrega</label>
                <input type="date" className="input text-sm" value={form.cabecalho.dataEntrega} onChange={e => setCab({ dataEntrega: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Início Produção</label>
                <input type="date" className="input text-sm" value={form.cabecalho.inicioProducao} onChange={e => setCab({ inicioProducao: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Término Produção</label>
                <input type="date" className="input text-sm" value={form.cabecalho.terminoProducao} onChange={e => setCab({ terminoProducao: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Oficina</label>
                <input className="input text-sm" value={form.cabecalho.oficina} onChange={e => setCab({ oficina: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                <input className="input text-sm" value={form.cabecalho.telefone} onChange={e => setCab({ telefone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cortador</label>
                <input className="input text-sm" value={form.cabecalho.cortador} onChange={e => setCab({ cortador: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Qtd Moldes</label>
                <input type="number" className="input text-sm" value={form.cabecalho.qtdMoldesTotal} onChange={e => setCab({ qtdMoldesTotal: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Qtd Gabaritos</label>
                <input type="number" className="input text-sm" value={form.cabecalho.qtdGabaritos} onChange={e => setCab({ qtdGabaritos: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Tecidos ─────────────────────────────────── */}
        {formTab === 'tecidos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Ficha Corte — Tecidos</h3>
              <button type="button" onClick={() => addItem('corte')} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                <Plus size={12} /> Adicionar tecido
              </button>
            </div>
            <div className="space-y-2">
              {form.itens
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => item.secao === 'corte')
                .map(({ item, idx }) => {
                  const insumo = insumos.find(ins => ins.id === item.insumoId);
                  const hasCortes = !!insumo && suportaCortes(insumo);
                  const cortes = item.cortes ?? [];
                  const cutsOpen = activeCutsIdx === idx;
                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                        <select
                          className="input text-xs flex-1"
                          value={item.insumoId}
                          onChange={e => updateItem(idx, { insumoId: e.target.value })}
                        >
                          <option value="">Selecionar insumo...</option>
                          {Object.entries(
                            insumos.reduce((acc, ins) => {
                              const grupo = getGrupoInsumo(ins);
                              const sub = getSubcategoriaInsumo(ins);
                              const key = `${GRUPO_LABELS[grupo]} — ${sub}`;
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(ins);
                              return acc;
                            }, {} as Record<string, typeof insumos>)
                          ).map(([group, items]) => (
                            <optgroup key={group} label={group}>
                              {items.map(ins => (
                                <option key={ins.id} value={ins.id}>{ins.nome}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.001"
                          className="input text-xs w-24"
                          placeholder="Quantidade"
                          value={item.quantidade}
                          onChange={e => updateItem(idx, { quantidade: Number(e.target.value) })}
                        />
                        {insumo && <span className="text-xs text-slate-400 w-12 shrink-0">{insumo.unidade}</span>}
                        {insumo && insumo.valorUnitario > 0 && (
                          <span className="text-xs text-slate-500 w-20 text-right shrink-0">
                            R$ {(insumo.valorUnitario * item.quantidade).toFixed(2)}
                          </span>
                        )}
                        {hasCortes && (
                          <button
                            type="button"
                            onClick={() => setActiveCutsIdx(cutsOpen ? null : idx)}
                            className={`flex items-center gap-0.5 p-1 shrink-0 rounded transition-colors text-xs ${cutsOpen ? 'text-orange-600 bg-orange-100' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'}`}
                            title="Gerenciar cortes"
                          >
                            <Scissors size={12} />
                            {cortes.length > 0 && <span>{cortes.length}</span>}
                          </button>
                        )}
                        <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 p-1 shrink-0"><X size={12} /></button>
                      </div>
                      {cutsOpen && hasCortes && (
                        <div className="ml-4 mt-1 mb-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-orange-700">Cortes — {insumo!.nome}</span>
                            <button type="button" onClick={() => addCorte(idx)} className="text-xs text-orange-600 flex items-center gap-1 hover:underline">
                              <Plus size={10} /> Adicionar corte
                            </button>
                          </div>
                          <div className="space-y-1">
                            {cortes.map(corte => (
                              <div key={corte.id} className="flex items-center gap-1.5 bg-white rounded p-1.5">
                                <input className="input text-xs flex-1 min-w-0" placeholder="Descrição (ex: Alça frontal)" value={corte.descricao} onChange={e => updateCorte(idx, corte.id, { descricao: e.target.value })} />
                                <input type="number" step="0.01" min="0" className="input text-xs w-16" placeholder="Tamanho" value={corte.tamanho || ''} onChange={e => updateCorte(idx, corte.id, { tamanho: Number(e.target.value) })} />
                                <select className="input text-xs w-16" value={corte.unidade} onChange={e => updateCorte(idx, corte.id, { unidade: e.target.value as UnidadeCorte })}>
                                  <option value="m">m</option>
                                  <option value="cm">cm</option>
                                  <option value="mm">mm</option>
                                </select>
                                <span className="text-xs text-slate-400">×</span>
                                <input type="number" min="1" className="input text-xs w-14" placeholder="Qtd" value={corte.quantidade || ''} onChange={e => updateCorte(idx, corte.id, { quantidade: Number(e.target.value) })} />
                                <button type="button" onClick={() => removeCorte(idx, corte.id)} className="text-slate-400 hover:text-red-500 shrink-0"><X size={10} /></button>
                              </div>
                            ))}
                            {cortes.length === 0 && (
                              <p className="text-xs text-orange-600/60 text-center py-2">Nenhum corte adicionado</p>
                            )}
                          </div>
                          {cortes.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-orange-200 text-right">
                              <span className="text-xs text-orange-700 font-medium">Total: {calcularConsumoCortes(cortes).toFixed(3)}m/peça</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              {form.itens.filter(i => i.secao === 'corte').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum tecido adicionado</p>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Aviamentos ──────────────────────────────── */}
        {formTab === 'aviamentos' && (
          <div className="space-y-3">
            {/* Sub-section switcher */}
            <div className="flex gap-1 flex-wrap">
              {(['aviamentos', 'acabamento', 'cliente', 'travetes'] as AviSecao[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAviSecao(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    aviSecao === s ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {SECAO_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">{SECAO_LABELS[aviSecao]}</h3>
              <button type="button" onClick={() => addItem(aviSecao)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                <Plus size={12} /> Adicionar item
              </button>
            </div>

            <div className="space-y-2">
              {form.itens
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) => item.secao === aviSecao)
                .map(({ item, idx }) => {
                  const insumo = insumos.find(ins => ins.id === item.insumoId);
                  const hasCortes = !!insumo && suportaCortes(insumo);
                  const cortes = item.cortes ?? [];
                  const cutsOpen = activeCutsIdx === idx;
                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                        <select
                          className="input text-xs flex-1"
                          value={item.insumoId}
                          onChange={e => updateItem(idx, { insumoId: e.target.value })}
                        >
                          <option value="">Selecionar insumo...</option>
                          {Object.entries(
                            insumos.reduce((acc, ins) => {
                              const grupo = getGrupoInsumo(ins);
                              const sub = getSubcategoriaInsumo(ins);
                              const key = `${GRUPO_LABELS[grupo]} — ${sub}`;
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(ins);
                              return acc;
                            }, {} as Record<string, typeof insumos>)
                          ).map(([group, items]) => (
                            <optgroup key={group} label={group}>
                              {items.map(ins => (
                                <option key={ins.id} value={ins.id}>{ins.nome}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.001"
                          className="input text-xs w-24"
                          placeholder="Quantidade"
                          value={item.quantidade}
                          onChange={e => updateItem(idx, { quantidade: Number(e.target.value) })}
                        />
                        {insumo && <span className="text-xs text-slate-400 w-12 shrink-0">{insumo.unidade}</span>}
                        {insumo && insumo.valorUnitario > 0 && (
                          <span className="text-xs text-slate-500 w-20 text-right shrink-0">
                            R$ {(insumo.valorUnitario * item.quantidade).toFixed(2)}
                          </span>
                        )}
                        {hasCortes && (
                          <button
                            type="button"
                            onClick={() => setActiveCutsIdx(cutsOpen ? null : idx)}
                            className={`flex items-center gap-0.5 p-1 shrink-0 rounded transition-colors text-xs ${cutsOpen ? 'text-orange-600 bg-orange-100' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'}`}
                            title="Gerenciar cortes"
                          >
                            <Scissors size={12} />
                            {cortes.length > 0 && <span>{cortes.length}</span>}
                          </button>
                        )}
                        <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 p-1 shrink-0"><X size={12} /></button>
                      </div>
                      {cutsOpen && hasCortes && (
                        <div className="ml-4 mt-1 mb-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-orange-700">Cortes — {insumo!.nome}</span>
                            <button type="button" onClick={() => addCorte(idx)} className="text-xs text-orange-600 flex items-center gap-1 hover:underline">
                              <Plus size={10} /> Adicionar corte
                            </button>
                          </div>
                          <div className="space-y-1">
                            {cortes.map(corte => (
                              <div key={corte.id} className="flex items-center gap-1.5 bg-white rounded p-1.5">
                                <input className="input text-xs flex-1 min-w-0" placeholder="Descrição (ex: Alça frontal)" value={corte.descricao} onChange={e => updateCorte(idx, corte.id, { descricao: e.target.value })} />
                                <input type="number" step="0.01" min="0" className="input text-xs w-16" placeholder="Tamanho" value={corte.tamanho || ''} onChange={e => updateCorte(idx, corte.id, { tamanho: Number(e.target.value) })} />
                                <select className="input text-xs w-16" value={corte.unidade} onChange={e => updateCorte(idx, corte.id, { unidade: e.target.value as UnidadeCorte })}>
                                  <option value="m">m</option>
                                  <option value="cm">cm</option>
                                  <option value="mm">mm</option>
                                </select>
                                <span className="text-xs text-slate-400">×</span>
                                <input type="number" min="1" className="input text-xs w-14" placeholder="Qtd" value={corte.quantidade || ''} onChange={e => updateCorte(idx, corte.id, { quantidade: Number(e.target.value) })} />
                                <button type="button" onClick={() => removeCorte(idx, corte.id)} className="text-slate-400 hover:text-red-500 shrink-0"><X size={10} /></button>
                              </div>
                            ))}
                            {cortes.length === 0 && (
                              <p className="text-xs text-orange-600/60 text-center py-2">Nenhum corte adicionado</p>
                            )}
                          </div>
                          {cortes.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-orange-200 text-right">
                              <span className="text-xs text-orange-700 font-medium">Total: {calcularConsumoCortes(cortes).toFixed(3)}m/peça</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              {form.itens.filter(i => i.secao === aviSecao).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum item nesta seção</p>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Moldes ──────────────────────────────────── */}
        {formTab === 'moldes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Ficha Modelagem — Moldes</h3>
              <button type="button" onClick={addMolde} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                <Plus size={12} /> Adicionar molde
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    {['Nº', 'Descrição', 'Qtd', 'Cor', ''].map(h => (
                      <th key={h} className="p-2 text-left text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.moldes.map(m => (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="p-1"><input className="input text-xs w-14" value={m.numero} onChange={e => updateMolde(m.id, { numero: e.target.value })} /></td>
                      <td className="p-1"><input className="input text-xs w-48" value={m.descricao} onChange={e => updateMolde(m.id, { descricao: e.target.value })} /></td>
                      <td className="p-1"><input className="input text-xs w-16" value={m.quantidade} onChange={e => updateMolde(m.id, { quantidade: e.target.value })} /></td>
                      <td className="p-1"><input className="input text-xs w-20" value={m.cor} onChange={e => updateMolde(m.id, { cor: e.target.value })} /></td>
                      <td className="p-1">
                        <button type="button" onClick={() => removeMolde(m.id)} className="text-slate-400 hover:text-red-500 p-1"><X size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {form.moldes.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-400">Nenhum molde adicionado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Check List ──────────────────────────────── */}
        {formTab === 'checklist' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Check List pré-envio</h3>
              <button type="button" onClick={addCheckItem} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                <Plus size={12} /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {form.checkList.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                  <input className="input text-xs flex-1" placeholder="Descrição" value={c.descricao} onChange={e => updateCheckItem(c.id, { descricao: e.target.value })} />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateCheckItem(c.id, { ok: c.ok === true ? null : true })}
                      className={`px-2 py-1 rounded text-xs font-medium ${c.ok === true ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                    >OK</button>
                    <button
                      type="button"
                      onClick={() => updateCheckItem(c.id, { ok: c.ok === false ? null : false })}
                      className={`px-2 py-1 rounded text-xs font-medium ${c.ok === false ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                    >NOK</button>
                  </div>
                  <input className="input text-xs w-28" placeholder="Responsável" value={c.responsavel} onChange={e => updateCheckItem(c.id, { responsavel: e.target.value })} />
                  <input className="input text-xs w-32" placeholder="Obs." value={c.obs} onChange={e => updateCheckItem(c.id, { obs: e.target.value })} />
                  <button type="button" onClick={() => removeCheckItem(c.id)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
              {form.checkList.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum item no check list</p>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Romaneio ────────────────────────────────── */}
        {formTab === 'romaneio' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Romaneio de Produção</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Oficina</label>
                <input className="input text-sm" value={form.romaneio.oficina} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, oficina: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                <input className="input text-sm" value={form.romaneio.telefone} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, telefone: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data Envio Produção</label>
                <input type="date" className="input text-sm" value={form.romaneio.dataEnvio} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, dataEnvio: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data Retirada Produção</label>
                <input type="date" className="input text-sm" value={form.romaneio.dataRetirada} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, dataRetirada: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantidade Enviada</label>
                <input type="number" className="input text-sm" value={form.romaneio.qtdEnviada} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, qtdEnviada: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Descontos (R$)</label>
                <input type="number" step="0.01" className="input text-sm" value={form.romaneio.desconto} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, desconto: Number(e.target.value) } }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Total Ficha (R$)</label>
                <input type="number" step="0.01" className="input text-sm" value={form.romaneio.totalFicha} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, totalFicha: Number(e.target.value) } }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observações</label>
              <textarea rows={3} className="input text-sm" value={form.romaneio.observacoes} onChange={e => setForm(f => ({ ...f, romaneio: { ...f.romaneio, observacoes: e.target.value } }))} />
            </div>
          </div>
        )}

        {/* ── Tab: Relatório ───────────────────────────────── */}
        {formTab === 'relatorio' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Relatório de Produção</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Oficina</label>
                <input className="input text-sm" value={form.relatorio.oficina} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, oficina: e.target.value } }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Prazo Entrega</label>
                <input type="date" className="input text-sm" value={form.relatorio.prazoEntrega} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, prazoEntrega: e.target.value } }))} />
              </div>
            </div>

            {/* Corte Tecidos */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Corte Tecidos</h4>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Faltas</label>
                  <select className="input text-xs" value={form.relatorio.corteTecidosOk === null ? '' : String(form.relatorio.corteTecidosOk)} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, corteTecidosOk: e.target.value === '' ? null : e.target.value === 'true' } }))}>
                    <option value="">N/A</option>
                    <option value="true">OK</option>
                    <option value="false">NOK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Retalhos</label>
                  <select className="input text-xs" value={form.relatorio.retalhosTecidosOk === null ? '' : String(form.relatorio.retalhosTecidosOk)} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, retalhosTecidosOk: e.target.value === '' ? null : e.target.value === 'true' } }))}>
                    <option value="">N/A</option>
                    <option value="true">OK</option>
                    <option value="false">NOK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nota Qualidade (0-10)</label>
                  <input type="number" min="0" max="10" className="input text-xs" value={form.relatorio.notaQualidade} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, notaQualidade: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Nota Organização (0-10)</label>
                  <input type="number" min="0" max="10" className="input text-xs" value={form.relatorio.notaOrganizacao} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, notaOrganizacao: Number(e.target.value) } }))} />
                </div>
              </div>
            </div>

            {/* Corte Aviamentos */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Corte Aviamentos</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Faltas</label>
                  <select className="input text-xs" value={form.relatorio.corteAviamentosOk === null ? '' : String(form.relatorio.corteAviamentosOk)} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, corteAviamentosOk: e.target.value === '' ? null : e.target.value === 'true' } }))}>
                    <option value="">N/A</option>
                    <option value="true">OK</option>
                    <option value="false">NOK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Retalhos</label>
                  <select className="input text-xs" value={form.relatorio.retalhosAviamentosOk === null ? '' : String(form.relatorio.retalhosAviamentosOk)} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, retalhosAviamentosOk: e.target.value === '' ? null : e.target.value === 'true' } }))}>
                    <option value="">N/A</option>
                    <option value="true">OK</option>
                    <option value="false">NOK</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Relatório LS */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Relatório LS — Produção</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Dias Atraso</label>
                  <input type="number" min="0" className="input text-xs" value={form.relatorio.diasAtraso} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, diasAtraso: Number(e.target.value) } }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Qtd Defeitos</label>
                  <input type="number" min="0" className="input text-xs" value={form.relatorio.qtdDefeitos} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, qtdDefeitos: Number(e.target.value) } }))} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observações</label>
              <textarea rows={3} className="input text-sm" value={form.relatorio.observacoes} onChange={e => setForm(f => ({ ...f, relatorio: { ...f.relatorio, observacoes: e.target.value } }))} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── VIEW TAB BAR ────────────────────────────────────────────────────────────
  const ViewTabBar = () => {
    const tabs: [ViewTab, string][] = [
      ['cabecalho', 'Cabeçalho'],
      ['tecidos', 'Tecidos'],
      ['aviamentos', 'Aviamentos'],
      ['moldes', 'Moldes'],
      ['checklist', 'Check List'],
      ['romaneio', 'Romaneio'],
      ['relatorio', 'Relatório'],
    ];
    return (
      <div className="flex gap-1 flex-wrap">
        {tabs.map(([tab, lbl]) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fichas Técnicas</h1>
          <p className="text-sm text-slate-500">{fichasTecnicas.length} fichas cadastradas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setModalImport(true); resetImport(); }}
            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Upload size={16} /> Importar Excel
          </button>
          <button onClick={() => { setForm(emptyForm()); setFormTab('cabecalho'); setModalAdd(true); }} className="btn-primary">
            <Plus size={16} /> Nova Ficha
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Buscar por modelo..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ── Cards list ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ modelo, ...ficha }) => {
          if (!modelo) return null;
          const cab = ficha.cabecalho;
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
                {cab?.cliente && (
                  <div className="flex justify-between text-slate-500"><span>Cliente:</span><span className="truncate max-w-[150px]">{cab.cliente}</span></div>
                )}
                {cab?.quantidadeFicha != null && cab.quantidadeFicha > 0 && (
                  <div className="flex justify-between text-slate-500"><span>Qtd Ficha:</span><span>{cab.quantidadeFicha}</span></div>
                )}
                <div className="flex justify-between text-slate-500"><span>Materiais:</span><span>{ficha.itens.length} itens</span></div>
                <div className="flex justify-between text-slate-500"><span>Moldes:</span><span>{ficha.moldes.length}</span></div>
                <div className="flex justify-between text-slate-500">
                  <span>Versão:</span>
                  <span className="font-medium text-blue-600">v{ficha.versao ?? 1}</span>
                </div>
              </div>
              <div className="flex gap-1 pt-3 border-t border-slate-50">
                <button onClick={() => openView(ficha)} className="flex-1 text-xs text-blue-600 hover:underline">Ver ficha</button>
                <button
                  onClick={() => handleExportExcel(ficha)}
                  disabled={exportLoading === ficha.id}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                  title="Exportar Excel (template)"
                >
                  {exportLoading === ficha.id ? <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
                </button>
                <button onClick={() => handlePrint(ficha)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Imprimir / PDF">
                  <Printer size={14} />
                </button>
                <button onClick={() => setModalHistorico(ficha)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded" title="Histórico de versões">
                  <History size={14} />
                </button>
                <button onClick={() => openEdit(ficha)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                <button onClick={() => deleteFichaTecnica(ficha.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400">
            <FileText size={40} className="mx-auto mb-2 opacity-30" />
            <p>Nenhuma ficha técnica encontrada</p>
            <p className="text-sm mt-1">Use o botão "Importar Excel" para carregar fichas existentes</p>
          </div>
        )}
      </div>

      {/* ── MODAL IMPORTAR ─────────────────────────────────── */}
      {modalImport && (
        <Modal title="Importar Ficha Técnica do Excel" onClose={() => { setModalImport(false); resetImport(); }} size="xl">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />

          {importStatus === 'idle' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Como funciona a importação:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>O sistema lê o Excel e extrai o modelo, materiais e quantidades</li>
                  <li>Materiais já existentes no estoque são vinculados automaticamente</li>
                  <li>Materiais novos são <strong>criados automaticamente</strong> no Estoque de Insumos</li>
                  <li>O modelo é adicionado ao <strong>Estoque de Pilotagem</strong></li>
                  <li>A ficha técnica é criada com todos os itens vinculados</li>
                </ul>
              </div>
              <p className="text-sm text-slate-500">Formatos suportados: .xlsx, .xls (mesmo formato da ficha SENAC)</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl py-12 flex flex-col items-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Upload size={40} />
                <span className="font-medium">Clique para selecionar o arquivo Excel</span>
                <span className="text-xs">ou arraste e solte aqui</span>
              </button>
            </div>
          )}

          {importStatus === 'parsing' && (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Lendo arquivo...</p>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{importError}</p>
              </div>
              <button onClick={resetImport} className="btn-ghost">Tentar novamente</button>
            </div>
          )}

          {importStatus === 'done' && (
            <div className="text-center py-12">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800 text-lg">Importação concluída!</p>
              <p className="text-slate-500 text-sm mt-1">Modelo e ficha técnica criados com sucesso.</p>
            </div>
          )}

          {importStatus === 'preview' && importPreview && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Modelo detectado</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{importPreview.parsed.modelo}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Referência</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{importPreview.parsed.referencia || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Cliente</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{importPreview.parsed.cliente || '—'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{importPreview.processed.insumosResolvidos.filter(r => !r.isNovo).length}</p>
                  <p className="text-xs text-green-700">Insumos já no sistema</p>
                </div>
                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{importPreview.processed.insumosParaCriar.length}</p>
                  <p className="text-xs text-amber-700">Insumos novos (serão criados)</p>
                </div>
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{importPreview.parsed.itens.length}</p>
                  <p className="text-xs text-blue-700">Total de materiais</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Materiais da ficha:</h3>
                <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50">
                  {importPreview.processed.insumosResolvidos.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.isNovo ? 'bg-amber-400' : 'bg-green-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{r.insumoNome}</p>
                        {r.isNovo && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <Package size={10} /> Será criado como novo insumo
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-600 flex-shrink-0">
                        {r.quantidade} {r.isNovo ? '' : insumos.find(i2 => i2.id === r.insumoExistenteId)?.unidade ?? ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Já existe no estoque</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Será criado</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button onClick={resetImport} className="btn-ghost">← Escolher outro arquivo</button>
                <button onClick={confirmarImport} className="btn-primary">
                  <CheckCircle size={16} /> Confirmar Importação
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── MODAL NOVA FICHA ───────────────────────────────── */}
      {modalAdd && (
        <Modal title="Nova Ficha Técnica" onClose={() => setModalAdd(false)} size="xl">
          {FichaForm()}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalAdd(false)} className="btn-ghost">Cancelar</button>
            <button
              onClick={handleAdd}
              className="btn-primary"
              disabled={!form.modeloId && (!form.criarNovoModelo || !form.novoModeloNome || !form.novoModeloCodigo)}
            >
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL EDITAR ───────────────────────────────────── */}
      {modalEdit && (
        <Modal title="Editar Ficha Técnica" onClose={() => setModalEdit(null)} size="xl">
          {FichaForm()}
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setModalEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={handleEdit} className="btn-primary">Salvar</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL VIEW ─────────────────────────────────────── */}
      {modalView && (() => {
        const cab = modalView.cabecalho ?? {} as FichaCabecalho;
        const valorTotal = (cab.custoConfeccaoUnid ?? 0) * (cab.quantidadeFicha ?? 0);
        return (
          <Modal title={`Ficha Técnica — ${modelos.find(m => m.id === modalView.modeloId)?.nome}`} onClose={() => setModalView(null)} size="xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                {ViewTabBar()}
                <div className="flex gap-2">
                  <span className="text-xs text-slate-400 self-center">v{modalView.versao ?? 1}</span>
                  <button
                    onClick={() => handleExportExcel(modalView)}
                    disabled={exportLoading === modalView.id}
                    className="flex items-center gap-1.5 text-sm text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 disabled:opacity-50"
                  >
                    {exportLoading === modalView.id
                      ? <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      : <FileDown size={14} />}
                    Excel
                  </button>
                  <button
                    onClick={() => handlePrint(modalView)}
                    className="flex items-center gap-1.5 text-sm text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50"
                  >
                    <Printer size={14} /> Imprimir
                  </button>
                  <button
                    onClick={() => setModalHistorico(modalView)}
                    className="flex items-center gap-1.5 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    <History size={14} /> Versões
                  </button>
                </div>
              </div>

              {/* View: Cabeçalho */}
              {viewTab === 'cabecalho' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {[
                      ['Cliente', cab.cliente],
                      ['Representante', cab.representante],
                      ['Pedido', cab.pedido],
                      ['Ref. Cliente', cab.refCliente],
                      ['Ref. Matriz', cab.refMatriz],
                      ['Coleção', cab.colecao],
                      ['QTD Mostruário LS', String(cab.qtdMostruario ?? 0)],
                      ['Custo Confecção (R$/unid)', `R$ ${(cab.custoConfeccaoUnid ?? 0).toFixed(2)}`],
                      ['Quantidade Ficha', String(cab.quantidadeFicha ?? 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="font-medium text-slate-700">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex justify-between">
                    <span className="text-sm text-blue-700 font-medium">Valor Total:</span>
                    <strong className="text-blue-800">R$ {valorTotal.toFixed(2)}</strong>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    {[
                      ['Data Pedido', cab.dataPedido],
                      ['Data Entrega', cab.dataEntrega],
                      ['Início Produção', cab.inicioProducao],
                      ['Término Produção', cab.terminoProducao],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="font-medium text-slate-700">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {[
                      ['Oficina', cab.oficina],
                      ['Telefone', cab.telefone],
                      ['Cortador', cab.cortador],
                      ['Qtd Moldes', String(cab.qtdMoldesTotal ?? 0)],
                      ['Qtd Gabaritos', String(cab.qtdGabaritos ?? 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="font-medium text-slate-700">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View: Tecidos */}
              {viewTab === 'tecidos' && (
                <div className="space-y-2">
                  {modalView.itens.filter(i => i.secao === 'corte').length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-sm">Nenhum tecido cadastrado</p>
                  )}
                  {modalView.itens
                    .filter(i => i.secao === 'corte')
                    .map((item, idx) => {
                      const insumo = insumos.find(ins => ins.id === item.insumoId);
                      const cortes = item.cortes ?? [];
                      return (
                        <div key={idx} className="bg-slate-50 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700">{insumo?.nome ?? '—'}</p>
                              <p className="text-xs text-slate-400">{insumo?.codigo} · {insumo?.categoria}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-700">{item.quantidade} {insumo?.unidade ?? ''}</p>
                              {insumo && insumo.valorUnitario > 0 && (
                                <p className="text-xs text-slate-400">R$ {(insumo.valorUnitario * item.quantidade).toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                          {cortes.length > 0 && (
                            <div className="px-3 pb-2 pt-1 space-y-0.5 border-t border-orange-100 bg-orange-50/50">
                              {cortes.map((c, ci) => (
                                <p key={ci} className="text-xs text-slate-600">→ {c.descricao}: {c.tamanho}{c.unidade} × {c.quantidade}</p>
                              ))}
                              <p className="text-xs text-orange-600 font-medium">Total: {calcularConsumoCortes(cortes).toFixed(3)}m/peça</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* View: Aviamentos */}
              {viewTab === 'aviamentos' && (
                <div className="space-y-3">
                  {(['aviamentos', 'acabamento', 'cliente', 'travetes'] as AviSecao[]).map(secao => {
                    const items = modalView.itens.filter(i => i.secao === secao);
                    return (
                      <div key={secao} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          {SECAO_LABELS[secao]}
                        </div>
                        <div className="divide-y divide-slate-50">
                          {items.map((item, idx) => {
                            const insumo = insumos.find(ins => ins.id === item.insumoId);
                            const cortes = item.cortes ?? [];
                            return (
                              <div key={idx}>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700">{insumo?.nome ?? '—'}</p>
                                    <p className="text-xs text-slate-400">{insumo?.codigo}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-slate-600">{item.quantidade} {insumo?.unidade ?? ''}</p>
                                    {insumo && insumo.valorUnitario > 0 && (
                                      <p className="text-xs text-slate-400">R$ {(insumo.valorUnitario * item.quantidade).toFixed(2)}</p>
                                    )}
                                  </div>
                                </div>
                                {cortes.length > 0 && (
                                  <div className="px-6 pb-2 pt-1 space-y-0.5 border-t border-orange-100 bg-orange-50/50">
                                    {cortes.map((c, ci) => (
                                      <p key={ci} className="text-xs text-slate-600">→ {c.descricao}: {c.tamanho}{c.unidade} × {c.quantidade}</p>
                                    ))}
                                    <p className="text-xs text-orange-600 font-medium">Total: {calcularConsumoCortes(cortes).toFixed(3)}m/peça</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {items.length === 0 && (
                            <p className="p-4 text-center text-xs text-slate-400">Nenhum item nesta seção</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View: Moldes */}
              {viewTab === 'moldes' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Nº', 'Descrição', 'Qtd', 'Cor'].map(h => (
                          <th key={h} className="p-2 text-left text-slate-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modalView.moldes.map(m => (
                        <tr key={m.id} className="border-t border-slate-100">
                          <td className="p-2">{m.numero}</td>
                          <td className="p-2">{m.descricao || '—'}</td>
                          <td className="p-2">{m.quantidade}</td>
                          <td className="p-2">{m.cor || '—'}</td>
                        </tr>
                      ))}
                      {modalView.moldes.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-slate-400">Nenhum molde cadastrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View: Check List */}
              {viewTab === 'checklist' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Clique para marcar cada item do check list</p>
                  {modalView.checkList.length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-sm">Nenhum item no check list</p>
                  )}
                  {modalView.checkList.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleCheckItem(item.id, item.ok === true ? null : true)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${item.ok === true ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-green-100'}`}
                        >OK</button>
                        <button
                          onClick={() => toggleCheckItem(item.id, item.ok === false ? null : false)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${item.ok === false ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-red-100'}`}
                        >NOK</button>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${item.ok === true ? 'text-green-700' : item.ok === false ? 'text-red-700' : 'text-slate-700'}`}>
                          {item.descricao}
                        </p>
                        {item.obs && <p className="text-xs text-slate-400">{item.obs}</p>}
                      </div>
                      {item.responsavel && <span className="text-xs text-slate-400">{item.responsavel}</span>}
                    </div>
                  ))}
                  <div className="flex gap-4 text-xs pt-1">
                    <span className="text-green-600 font-medium">✓ {modalView.checkList.filter(c => c.ok === true).length} OK</span>
                    <span className="text-red-500 font-medium">✗ {modalView.checkList.filter(c => c.ok === false).length} NOK</span>
                    <span className="text-slate-400">{modalView.checkList.filter(c => c.ok === null).length} pendentes</span>
                  </div>
                </div>
              )}

              {/* View: Romaneio */}
              {viewTab === 'romaneio' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-700">Romaneio de Produção</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Oficina', modalView.romaneio.oficina],
                      ['Telefone', modalView.romaneio.telefone],
                      ['Data Envio', modalView.romaneio.dataEnvio],
                      ['Data Retirada', modalView.romaneio.dataRetirada],
                      ['Qtd Enviada', String(modalView.romaneio.qtdEnviada)],
                      ['Desconto (R$)', `R$ ${modalView.romaneio.desconto.toFixed(2)}`],
                      ['Total Ficha (R$)', `R$ ${modalView.romaneio.totalFicha.toFixed(2)}`],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="font-medium text-slate-700">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {modalView.romaneio.observacoes && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Observações</p>
                      <p className="text-sm text-slate-700">{modalView.romaneio.observacoes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* View: Relatório */}
              {viewTab === 'relatorio' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-700">Relatório de Produção</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Oficina', modalView.relatorio.oficina],
                      ['Prazo Entrega', modalView.relatorio.prazoEntrega],
                      ['Nota Qualidade', String(modalView.relatorio.notaQualidade)],
                      ['Nota Organização', String(modalView.relatorio.notaOrganizacao)],
                      ['Dias Atraso', String(modalView.relatorio.diasAtraso)],
                      ['Qtd Defeitos', String(modalView.relatorio.qtdDefeitos)],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="font-medium text-slate-700">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      ['Corte Tecidos (Faltas)', modalView.relatorio.corteTecidosOk],
                      ['Corte Aviamentos (Faltas)', modalView.relatorio.corteAviamentosOk],
                      ['Retalhos Tecidos', modalView.relatorio.retalhosTecidosOk],
                      ['Retalhos Aviamentos', modalView.relatorio.retalhosAviamentosOk],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-slate-600 text-xs">{label}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${val === true ? 'bg-green-100 text-green-700' : val === false ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-500'}`}>
                          {val === true ? 'OK' : val === false ? 'NOK' : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {modalView.relatorio.observacoes && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Observações</p>
                      <p className="text-sm text-slate-700">{modalView.relatorio.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── MODAL HISTÓRICO DE VERSÕES ─────────────────────── */}
      {modalHistorico && (
        <Modal title="Histórico de Versões" onClose={() => setModalHistorico(null)} size="md">
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-700">
                Versão atual: <strong>v{modalHistorico.versao ?? 1}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Próximo export gerará v{modalHistorico.versao ?? 1}
              </p>
            </div>

            {(modalHistorico.historicoExportes ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum export realizado ainda</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {[...(modalHistorico.historicoExportes ?? [])].reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {h.tipo === 'excel' ? <FileDown size={14} className="text-green-600" /> :
                       h.tipo === 'pdf' ? <FileText size={14} className="text-red-500" /> :
                       <Printer size={14} className="text-purple-600" />}
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {h.tipo === 'excel' ? 'Excel' : h.tipo === 'pdf' ? 'PDF' : 'Impressão'}
                          {' '}— v{h.versao}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(h.data).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      label={`v${h.versao}`}
                      variant={h.tipo === 'excel' ? 'green' : h.tipo === 'pdf' ? 'red' : 'purple'}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={() => setModalHistorico(null)} className="btn-ghost">Fechar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL IMPRESSÃO / PDF ──────────────────────────── */}
      {modalPrint && (() => {
        const { ficha: pFicha, modelo: pModelo } = modalPrint;
        if (!pModelo) return null;
        const cab = pFicha.cabecalho ?? {} as FichaCabecalho;
        const valorTotal = (cab.custoConfeccaoUnid ?? 0) * (cab.quantidadeFicha ?? 0);
        const pTecidos    = pFicha.itens.filter(i => i.secao === 'corte');
        const pAvi1       = pFicha.itens.filter(i => i.secao === 'aviamentos');
        const pAcabamento = pFicha.itens.filter(i => i.secao === 'acabamento');
        const pAviCli     = pFicha.itens.filter(i => i.secao === 'cliente');
        const pTravetes   = pFicha.itens.filter(i => i.secao === 'travetes');
        const qtdFicha    = cab.quantidadeFicha || 1;

        const PrintRow = ({ label, value }: { label: string; value: string | number }) => (
          <tr className="border-b border-slate-100">
            <td className="py-1 pr-3 text-xs text-slate-500 whitespace-nowrap font-medium">{label}</td>
            <td className="py-1 text-xs text-slate-800">{value || '—'}</td>
          </tr>
        );

        type PrintItems = typeof pTecidos;
        const MatSection = ({ title, color, items }: { title: string; color: string; items: PrintItems }) => {
          if (items.length === 0) return null;
          return (
            <div className="mb-3">
              <div className={`${color} text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider`}>{title}</div>
              <table className="w-full text-xs border border-slate-200 border-t-0">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-1.5 text-left text-slate-500 font-medium w-[38%]">Material</th>
                    <th className="p-1.5 text-left text-slate-500 font-medium w-[22%]">Categoria</th>
                    <th className="p-1.5 text-right text-slate-500 font-medium">Qtd/Peça</th>
                    <th className="p-1.5 text-right text-slate-500 font-medium">Un</th>
                    <th className="p-1.5 text-right text-slate-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const ins = insumos.find(i => i.id === item.insumoId);
                    const cortes = item.cortes ?? [];
                    return (
                      <Fragment key={idx}>
                        <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="p-1.5 font-medium text-slate-800">{ins?.nome ?? '—'}</td>
                          <td className="p-1.5 text-slate-500">{ins ? getSubcategoriaInsumo(ins) : '—'}</td>
                          <td className="p-1.5 text-right text-slate-700">{item.quantidade}</td>
                          <td className="p-1.5 text-right text-slate-500">{ins?.unidade}</td>
                          <td className="p-1.5 text-right font-semibold text-slate-800">
                            {+(item.quantidade * qtdFicha).toFixed(3)}
                          </td>
                        </tr>
                        {cortes.map((c, ci) => (
                          <tr key={`c${ci}`} className="bg-orange-50/40">
                            <td className="p-1 pl-5 text-slate-500 italic text-xs" colSpan={2}>→ {c.descricao}: {c.tamanho}{c.unidade} × {c.quantidade}</td>
                            <td className="p-1 text-right text-xs text-orange-600" colSpan={3}>{corteToMetros(c.tamanho, c.unidade).toFixed(3)}m/corte</td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        };

        const doPrint = (tipo: 'impressao' | 'pdf') => {
          const now2 = new Date().toISOString();
          updateFichaTecnica(pFicha.id, {
            historicoExportes: [
              ...(pFicha.historicoExportes ?? []),
              { data: now2, versao: pFicha.versao ?? 1, tipo: tipo === 'pdf' ? 'pdf' : 'impressao' },
            ],
          });
          window.print();
        };

        return (
          <Modal title={`Visualizar / Imprimir — ${pModelo.nome}`} onClose={() => setModalPrint(null)} size="xl">
            {/* Action bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 print:hidden">
              <p className="text-sm text-slate-500">
                Pré-visualização da ficha — versão <strong className="text-blue-600">v{pFicha.versao ?? 1}</strong>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportExcel(pFicha)}
                  disabled={exportLoading === pFicha.id}
                  className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {exportLoading === pFicha.id
                    ? <div className="w-3.5 h-3.5 border-2 border-green-200 border-t-transparent rounded-full animate-spin" />
                    : <Download size={14} />}
                  Exportar Excel
                </button>
                <button
                  onClick={() => doPrint('pdf')}
                  className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700"
                  title="Salvar como PDF: na janela de impressão escolha 'Salvar como PDF'"
                >
                  <FileText size={14} /> Salvar PDF
                </button>
                <button
                  onClick={() => doPrint('impressao')}
                  className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  <Printer size={14} /> Imprimir
                </button>
              </div>
            </div>

            {/* Print content */}
            <div id="ficha-print-area" className="text-slate-800 bg-white">
              {/* Title */}
              <div className="border-2 border-slate-800 rounded-t-lg overflow-hidden mb-3">
                <div className="bg-slate-800 text-white text-center py-2.5 font-bold tracking-widest text-sm uppercase">
                  Ficha Técnica de Produção &nbsp;|&nbsp; v{pFicha.versao ?? 1}
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <table className="p-3 w-full">
                    <tbody>
                      <PrintRow label="Modelo:" value={pModelo.nome} />
                      <PrintRow label="Código:" value={pModelo.codigo} />
                      <PrintRow label="Cliente:" value={cab.cliente ?? ''} />
                      <PrintRow label="Representante:" value={cab.representante ?? ''} />
                      <PrintRow label="Pedido:" value={cab.pedido ?? ''} />
                      <PrintRow label="Ref. Cliente:" value={cab.refCliente ?? ''} />
                      <PrintRow label="Ref. Matriz:" value={cab.refMatriz ?? ''} />
                      <PrintRow label="Coleção:" value={cab.colecao ?? ''} />
                    </tbody>
                  </table>
                  <table className="p-3 w-full">
                    <tbody>
                      <PrintRow label="Data Pedido:" value={cab.dataPedido ?? ''} />
                      <PrintRow label="Data Entrega:" value={cab.dataEntrega ?? ''} />
                      <PrintRow label="Início Produção:" value={cab.inicioProducao ?? ''} />
                      <PrintRow label="Término Produção:" value={cab.terminoProducao ?? ''} />
                      <PrintRow label="Quantidade Ficha:" value={cab.quantidadeFicha ?? 0} />
                      <PrintRow label="Custo Confecção/un:" value={`R$ ${(cab.custoConfeccaoUnid ?? 0).toFixed(2)}`} />
                      <PrintRow label="Valor Total Ficha:" value={`R$ ${valorTotal.toFixed(2)}`} />
                      <PrintRow label="Oficina:" value={cab.oficina ?? ''} />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Materials */}
              <MatSection title="Divisão de Tecidos — Corte" color="bg-blue-700"    items={pTecidos} />
              <MatSection title="Aviamentos 1"                color="bg-orange-600" items={pAvi1} />
              <MatSection title="Acabamento"                  color="bg-teal-600"   items={pAcabamento} />
              <MatSection title="Aviamentos Cliente"          color="bg-violet-600" items={pAviCli} />
              <MatSection title="Travetes"                    color="bg-rose-600"   items={pTravetes} />

              {/* Moldes */}
              {pFicha.moldes.length > 0 && (
                <div className="mb-3">
                  <div className="bg-slate-600 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">
                    Moldes — {pFicha.moldes.length} peça{pFicha.moldes.length !== 1 ? 's' : ''}
                  </div>
                  <table className="w-full text-xs border border-slate-200 border-t-0">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Nº', 'Descrição', 'Qtd', 'Cor'].map(h => (
                          <th key={h} className="p-1.5 text-left text-slate-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pFicha.moldes.map((m, idx) => (
                        <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="p-1.5 text-slate-600">{m.numero}</td>
                          <td className="p-1.5 font-medium text-slate-800">{m.descricao || '—'}</td>
                          <td className="p-1.5 text-slate-700">{m.quantidade}</td>
                          <td className="p-1.5 text-slate-600">{m.cor || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              <div className="text-xs text-slate-400 text-center border-t border-slate-200 pt-2 mt-2">
                {pModelo.nome} &nbsp;·&nbsp; {new Date().toLocaleString('pt-BR')} &nbsp;·&nbsp; v{pFicha.versao ?? 1}
              </div>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t print:hidden">
              <button onClick={() => setModalPrint(null)} className="btn-ghost">Fechar</button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
