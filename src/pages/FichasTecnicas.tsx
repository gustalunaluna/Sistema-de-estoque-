import { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, X, Upload, Download, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { FichaTecnica, ItemFichaTecnica, SecaoFicha } from '../types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { parseExcelFicha, processarImport, exportarFichaExcel } from '../utils/excelFicha';

const SECAO_LABELS: Record<SecaoFicha, string> = {
  corte: 'Corte',
  aviamentos: 'Aviamentos',
  acabamento: 'Acabamento',
  cliente: 'Cliente',
  travetes: 'Travetes',
};

type ViewTab = 'materiais' | 'corte' | 'aviamentos' | 'checklist' | 'romaneio' | 'relatorio';

const emptyForm = (modeloId = ''): Omit<FichaTecnica, 'id' | 'criadoEm' | 'atualizadoEm'> => ({
  modeloId,
  itens: [],
  tempoProdução: 0,
  custoMaoDeObra: 0,
  outrosCustos: 0,
  margemLucro: 20,
  moldes: [],
  checkList: [],
  romaneio: { oficina: '', telefone: '', dataEnvio: '', dataRetirada: '', qtdEnviada: 0, desconto: 0, totalFicha: 0, observacoes: '' },
  relatorio: { oficina: '', prazoEntrega: '', corteTecidosOk: null, corteAviamentosOk: null, retalhosTecidosOk: null, retalhosAviamentosOk: null, notaQualidade: 0, notaOrganizacao: 0, diasAtraso: 0, qtdDefeitos: 0, observacoes: '' },
});

export default function FichasTecnicas() {
  const store = useStore();
  const { fichasTecnicas, addFichaTecnica, updateFichaTecnica, deleteFichaTecnica, modelos, insumos, addInsumo, addModelo, clientes } = store;
  const [search, setSearch] = useState('');
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<FichaTecnica | null>(null);
  const [modalView, setModalView] = useState<FichaTecnica | null>(null);
  const [modalImport, setModalImport] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [viewTab, setViewTab] = useState<ViewTab>('materiais');

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

  const calcCustoMateriais = (itens: ItemFichaTecnica[]) =>
    itens.reduce((sum, item) => {
      const ins = insumos.find(i => i.id === item.insumoId);
      return sum + (ins?.valorUnitario ?? 0) * item.quantidade;
    }, 0);

  const calcCustoTotal = (f: typeof form) => calcCustoMateriais(f.itens) + f.custoMaoDeObra + f.outrosCustos;
  const calcPrecoVenda = (f: typeof form) => calcCustoTotal(f) * (1 + f.margemLucro / 100);

  const addItem = () => setForm(f => ({ ...f, itens: [...f.itens, { insumoId: '', quantidade: 1, secao: 'corte' as SecaoFicha }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, data: Partial<ItemFichaTecnica>) =>
    setForm(f => ({ ...f, itens: f.itens.map((it, i) => i === idx ? { ...it, ...data } : it) }));

  const handleAdd = () => { addFichaTecnica(form); setForm(emptyForm()); setModalAdd(false); };
  const handleEdit = () => { if (!modalEdit) return; updateFichaTecnica(modalEdit.id, form); setModalEdit(null); };
  const openEdit = (ficha: FichaTecnica) => { setForm({ ...ficha }); setModalEdit(ficha); };
  const openView = (ficha: FichaTecnica) => { setModalView(ficha); setViewTab('materiais'); };

  const toggleCheckItem = (itemId: string, ok: boolean | null) => {
    if (!modalView) return;
    const newCheckList = modalView.checkList.map(c => c.id === itemId ? { ...c, ok } : c);
    updateFichaTecnica(modalView.id, { checkList: newCheckList });
    setModalView(prev => prev ? { ...prev, checkList: newCheckList } : prev);
  };

  const ItensTable = ({ itens }: { itens: ItemFichaTecnica[] }) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 text-left text-xs text-slate-500">
          <th className="p-2">Material</th>
          <th className="p-2">Seção</th>
          <th className="p-2">Qtd</th>
          <th className="p-2">Unid.</th>
          <th className="p-2">Vlr. Unit.</th>
          <th className="p-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((item, i) => {
          const ins = insumos.find(x => x.id === item.insumoId);
          return (
            <tr key={i} className="border-b border-slate-50">
              <td className="p-2 font-medium">{ins?.nome ?? '—'}</td>
              <td className="p-2 text-slate-400 text-xs">{item.secao ? (SECAO_LABELS[item.secao] ?? item.secao) : '—'}</td>
              <td className="p-2">{item.quantidade}</td>
              <td className="p-2 text-slate-400">{ins?.unidade}</td>
              <td className="p-2">R$ {(ins?.valorUnitario ?? 0).toFixed(2)}</td>
              <td className="p-2 font-medium">R$ {((ins?.valorUnitario ?? 0) * item.quantidade).toFixed(2)}</td>
            </tr>
          );
        })}
        {itens.length === 0 && (
          <tr><td colSpan={6} className="p-4 text-center text-slate-400 text-xs">Nenhum item nesta seção</td></tr>
        )}
      </tbody>
    </table>
  );

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
    } catch (err) {
      setImportError('Erro ao ler o arquivo. Verifique se é um Excel (.xlsx) válido.');
      setImportStatus('error');
    }
    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  const confirmarImport = () => {
    if (!importPreview) return;
    const { processed } = importPreview;

    // 1. Criar novos insumos e guardar os IDs gerados
    const novosInsumosIds: Record<string, string> = {}; // nome lowercase -> id
    processed.insumosParaCriar.forEach(insumoData => {
      // Check again it doesn't exist (race condition guard)
      const existing = insumos.find(i =>
        i.nome.toLowerCase().trim().includes(insumoData.nome.toLowerCase().trim())
      );
      if (existing) {
        novosInsumosIds[insumoData.nome.toLowerCase().trim()] = existing.id;
      } else {
        addInsumo(insumoData);
        // The store adds the item synchronously, get the latest
        const added = useStore.getState().insumos.find(i => i.nome === insumoData.nome);
        if (added) novosInsumosIds[insumoData.nome.toLowerCase().trim()] = added.id;
      }
    });

    // 2. Criar o modelo na pilotagem
    addModelo(processed.modeloNovo);
    const modeloCriado = useStore.getState().modelos.find(m => m.nome === processed.modeloNovo.nome);
    if (!modeloCriado) return;

    // 3. Montar itens da ficha resolvendo IDs
    const insumosAtualizados = useStore.getState().insumos;
    const itensFicha: ItemFichaTecnica[] = processed.insumosResolvidos
      .map(r => {
        let insumoId = r.insumoExistenteId;
        if (!insumoId && r.isNovo) {
          // Try to find by name in the now-updated store
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

    // 4. Criar a ficha técnica
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
  const handleExport = (ficha: FichaTecnica) => {
    const modelo = modelos.find(m => m.id === ficha.modeloId);
    if (!modelo) return;
    const clienteNome = clientes.find(c => c.id === modelo.clienteId)?.nomeEmpresa ?? '';
    exportarFichaExcel(modelo, ficha, insumos, clienteNome);
  };

  // ─── FORM ────────────────────────────────────────────────────────────────────
  const FichaForm = () => {
    const custo = calcCustoTotal(form);
    const preco = calcPrecoVenda(form);
    return (
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
          <select className="input" value={form.modeloId} onChange={e => setForm(f => ({ ...f, modeloId: e.target.value }))}>
            <option value="">Selecione um modelo...</option>
            {modelos.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.codigo})</option>)}
          </select>
        </div>
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
                  <select className="input flex-1 text-sm" value={item.insumoId} onChange={e => updateItem(idx, { insumoId: e.target.value })}>
                    <option value="">Selecione o material...</option>
                    {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
                  </select>
                  <select className="input w-28 text-sm" value={item.secao ?? 'corte'} onChange={e => updateItem(idx, { secao: e.target.value as SecaoFicha })}>
                    <option value="corte">Corte</option>
                    <option value="aviamentos">Aviamentos</option>
                    <option value="acabamento">Acabamento</option>
                    <option value="cliente">Cliente</option>
                    <option value="travetes">Travetes</option>
                  </select>
                  <input type="number" className="input w-20 text-sm" value={item.quantidade} min="0" step="0.01"
                    onChange={e => updateItem(idx, { quantidade: Number(e.target.value) })} placeholder="Qtd" />
                  {ins && <span className="text-xs text-slate-500 w-20 text-right">R$ {(ins.valorUnitario * item.quantidade).toFixed(2)}</span>}
                  <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                </div>
              );
            })}
            {form.itens.length === 0 && <p className="text-xs text-slate-400 text-center py-3">Nenhum material adicionado</p>}
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-sm text-slate-600">Custo materiais: <strong className="text-slate-800">R$ {calcCustoMateriais(form.itens).toFixed(2)}</strong></span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Tempo (min)</label>
            <input type="number" className="input" value={form.tempoProdução} onChange={e => setForm(f => ({ ...f, tempoProdução: Number(e.target.value) }))} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Mão de Obra (R$)</label>
            <input type="number" step="0.01" className="input" value={form.custoMaoDeObra} onChange={e => setForm(f => ({ ...f, custoMaoDeObra: Number(e.target.value) }))} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Outros Custos (R$)</label>
            <input type="number" step="0.01" className="input" value={form.outrosCustos} onChange={e => setForm(f => ({ ...f, outrosCustos: Number(e.target.value) }))} /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Margem de Lucro (%)</label>
          <input type="number" step="1" className="input w-32" value={form.margemLucro} onChange={e => setForm(f => ({ ...f, margemLucro: Number(e.target.value) }))} /></div>
        <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Custo total:</span><strong>R$ {custo.toFixed(2)}</strong></div>
          <div className="flex justify-between"><span className="text-slate-500">Preço sugerido ({form.margemLucro}% margem):</span><strong className="text-green-600">R$ {preco.toFixed(2)}</strong></div>
        </div>
      </div>
    );
  };

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
          <button onClick={() => { setForm(emptyForm()); setModalAdd(true); }} className="btn-primary">
            <Plus size={16} /> Nova Ficha
          </button>
        </div>
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
                <div className="flex justify-between text-slate-500"><span>Materiais:</span><span>{ficha.itens.length} itens</span></div>
                <div className="flex justify-between text-slate-500"><span>Custo total:</span><strong className="text-slate-700">R$ {custo.toFixed(2)}</strong></div>
                <div className="flex justify-between text-slate-500"><span>Preço sugerido:</span><strong className="text-green-600">R$ {preco.toFixed(2)}</strong></div>
                <div className="flex justify-between text-slate-500"><span>Tempo:</span><span>{ficha.tempoProdução} min</span></div>
              </div>
              <div className="flex gap-1 pt-3 border-t border-slate-50">
                <button onClick={() => openView(ficha)} className="flex-1 text-xs text-blue-600 hover:underline">Ver ficha</button>
                <button
                  onClick={() => handleExport(ficha)}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                  title="Exportar Excel"
                >
                  <Download size={14} />
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

      {/* ── MODAL IMPORTAR ────────────────────────────────────── */}
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
              {/* Header info */}
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

              {/* Resumo */}
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

              {/* Lista de materiais */}
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
        <Modal title={`Ficha Técnica — ${modelos.find(m => m.id === modalView.modeloId)?.nome}`} onClose={() => setModalView(null)} size="xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Tab bar */}
              <div className="flex gap-1 flex-wrap">
                {([
                  ['materiais', 'Materiais'],
                  ['corte', 'Ficha Corte'],
                  ['aviamentos', 'Aviamentos'],
                  ['checklist', 'Check List'],
                  ['romaneio', 'Romaneio'],
                  ['relatorio', 'Relatório'],
                ] as [ViewTab, string][]).map(([tab, lbl]) => (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      viewTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleExport(modalView)}
                className="flex items-center gap-1.5 text-sm text-green-600 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50"
              >
                <Download size={14} /> Exportar Excel
              </button>
            </div>

            {/* Tab: Materiais (todos) */}
            {viewTab === 'materiais' && (
              <div className="space-y-3">
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <ItensTable itens={modalView.itens} />
                </div>
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
            )}

            {/* Tab: Ficha Corte */}
            {viewTab === 'corte' && (
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">Ficha Técnica de Corte</div>
                <ItensTable itens={modalView.itens.filter(i => i.secao === 'corte' || !i.secao)} />
              </div>
            )}

            {/* Tab: Aviamentos */}
            {viewTab === 'aviamentos' && (
              <div className="space-y-3">
                {(['aviamentos', 'acabamento', 'cliente', 'travetes'] as SecaoFicha[]).map(secao => {
                  const itensSecao = modalView.itens.filter(i => i.secao === secao);
                  return (
                    <div key={secao} className="border border-slate-100 rounded-lg overflow-hidden">
                      <div className="bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 uppercase tracking-wide">{SECAO_LABELS[secao]}</div>
                      <ItensTable itens={itensSecao} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Check List */}
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

            {/* Tab: Romaneio */}
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

            {/* Tab: Relatório */}
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
                    ['Corte Tecidos', modalView.relatorio.corteTecidosOk],
                    ['Corte Aviamentos', modalView.relatorio.corteAviamentosOk],
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
      )}
    </div>
  );
}
