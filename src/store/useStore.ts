import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Insumo, MovimentacaoInsumo, Modelo, FichaTecnica, OrdemProducao,
  Cliente, Fornecedor, Compra, Orcamento, Usuario, HistoricoAlteracao,
  StatusProducao, CheckListItem, ConfiguracaoApp, FichaCabecalho,
  Subcategoria,
} from '../types';
import { appStorage } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

const now = () => new Date().toISOString();

const DEFAULT_SUBCATEGORIAS: Subcategoria[] = [
  // Aviamentos
  { id: 'sc-avi-cursor',     grupo: 'aviamentos', nome: 'Cursor' },
  { id: 'sc-avi-ziper',      grupo: 'aviamentos', nome: 'Zíper' },
  { id: 'sc-avi-regulador',  grupo: 'aviamentos', nome: 'Regulador' },
  { id: 'sc-avi-passador',   grupo: 'aviamentos', nome: 'Passador' },
  { id: 'sc-avi-fecho',      grupo: 'aviamentos', nome: 'Fecho' },
  { id: 'sc-avi-mosquetao',  grupo: 'aviamentos', nome: 'Mosquetão' },
  { id: 'sc-avi-argola',     grupo: 'aviamentos', nome: 'Argola' },
  { id: 'sc-avi-puxador',    grupo: 'aviamentos', nome: 'Puxador' },
  { id: 'sc-avi-ponteira',   grupo: 'aviamentos', nome: 'Ponteira' },
  { id: 'sc-avi-fita',       grupo: 'aviamentos', nome: 'Fita' },
  { id: 'sc-avi-alca',       grupo: 'aviamentos', nome: 'Alça' },
  { id: 'sc-avi-cordao',     grupo: 'aviamentos', nome: 'Cordão' },
  { id: 'sc-avi-elastico',   grupo: 'aviamentos', nome: 'Elástico' },
  { id: 'sc-avi-velcro',     grupo: 'aviamentos', nome: 'Velcro' },
  { id: 'sc-avi-rebite',     grupo: 'aviamentos', nome: 'Rebite' },
  { id: 'sc-avi-etiqueta',   grupo: 'aviamentos', nome: 'Etiqueta' },
  { id: 'sc-avi-patch',      grupo: 'aviamentos', nome: 'Patch' },
  { id: 'sc-avi-ferragens',  grupo: 'aviamentos', nome: 'Ferragens' },
  // Tecidos
  { id: 'sc-tec-oxford',     grupo: 'tecidos', nome: 'Oxford' },
  { id: 'sc-tec-ripstop',    grupo: 'tecidos', nome: 'Ripstop' },
  { id: 'sc-tec-lona',       grupo: 'tecidos', nome: 'Lona' },
  { id: 'sc-tec-nylon',      grupo: 'tecidos', nome: 'Nylon' },
  { id: 'sc-tec-tactel',     grupo: 'tecidos', nome: 'Tactel' },
  { id: 'sc-tec-microfibra', grupo: 'tecidos', nome: 'Microfibra' },
  { id: 'sc-tec-mesh',       grupo: 'tecidos', nome: 'Mesh' },
  { id: 'sc-tec-couro',      grupo: 'tecidos', nome: 'Couro Sintético' },
  { id: 'sc-tec-pvc',        grupo: 'tecidos', nome: 'PVC' },
  { id: 'sc-tec-outros',     grupo: 'tecidos', nome: 'Outros' },
  // Linhas
  { id: 'sc-lin-40',         grupo: 'linhas', nome: 'Linha 40' },
  { id: 'sc-lin-60',         grupo: 'linhas', nome: 'Linha 60' },
  { id: 'sc-lin-nylon',      grupo: 'linhas', nome: 'Linha Nylon' },
  { id: 'sc-lin-algodao',    grupo: 'linhas', nome: 'Linha Algodão' },
  { id: 'sc-lin-pesponto',   grupo: 'linhas', nome: 'Linha Pesponto' },
  { id: 'sc-lin-outras',     grupo: 'linhas', nome: 'Outras' },
  // Materiais de Reforço
  { id: 'sc-ref-entretela',  grupo: 'reforcos', nome: 'Entretela' },
  { id: 'sc-ref-espuma',     grupo: 'reforcos', nome: 'Espuma' },
  { id: 'sc-ref-plastico',   grupo: 'reforcos', nome: 'Plástico Rígido' },
  { id: 'sc-ref-outros',     grupo: 'reforcos', nome: 'Outros' },
  // Embalagens
  { id: 'sc-emb-caixa',      grupo: 'embalagens', nome: 'Caixa' },
  { id: 'sc-emb-plastico',   grupo: 'embalagens', nome: 'Plástico' },
  { id: 'sc-emb-papel',      grupo: 'embalagens', nome: 'Papel' },
  { id: 'sc-emb-outros',     grupo: 'embalagens', nome: 'Outros' },
  // Outros
  { id: 'sc-out-outros',     grupo: 'outros', nome: 'Outros' },
];

const DEFAULT_CHECKLIST: CheckListItem[] = [
  { id: uuidv4(), descricao: 'Corte tecidos conferido', ok: null, responsavel: '', obs: '' },
  { id: uuidv4(), descricao: 'Aviamentos completos', ok: null, responsavel: '', obs: '' },
  { id: uuidv4(), descricao: 'Piloto aprovado', ok: null, responsavel: '', obs: '' },
  { id: uuidv4(), descricao: 'Gabaritos enviados', ok: null, responsavel: '', obs: '' },
  { id: uuidv4(), descricao: 'Parte gráfica OK', ok: null, responsavel: '', obs: '' },
  { id: uuidv4(), descricao: 'Embalagem incluída', ok: null, responsavel: '', obs: '' },
  { id: uuidv4(), descricao: 'Etiquetas conferidas', ok: null, responsavel: '', obs: '' },
];

const DEFAULT_ROMANEIO = () => ({
  oficina: '', telefone: '', dataEnvio: '', dataRetirada: '',
  qtdEnviada: 0, desconto: 0, totalFicha: 0, observacoes: '',
});

const DEFAULT_RELATORIO = () => ({
  oficina: '', prazoEntrega: '', corteTecidosOk: null, corteAviamentosOk: null,
  retalhosTecidosOk: null, retalhosAviamentosOk: null,
  notaQualidade: 0, notaOrganizacao: 0, diasAtraso: 0, qtdDefeitos: 0, observacoes: '',
});

const DEFAULT_CABECALHO = (): FichaCabecalho => ({
  cliente: '', representante: '', pedido: '', refCliente: '', refMatriz: '',
  colecao: '', qtdMostruario: 0, custoConfeccaoUnid: 0, quantidadeFicha: 0,
  dataPedido: '', dataEntrega: '', inicioProducao: '', terminoProducao: '',
  oficina: '', telefone: '', cortador: '', qtdMoldesTotal: 0, qtdGabaritos: 0,
});

interface AppState {
  configuracao: ConfiguracaoApp;
  usuarioAtual: Usuario | null;
  usuarios: Usuario[];
  insumos: Insumo[];
  movimentacoes: MovimentacaoInsumo[];
  modelos: Modelo[];
  fichasTecnicas: FichaTecnica[];
  ordensProducao: OrdemProducao[];
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  compras: Compra[];
  orcamentos: Orcamento[];
  historico: HistoricoAlteracao[];
  subcategorias: Subcategoria[];

  login: (email: string, senha: string) => boolean;
  logout: () => void;
  updateConfiguracao: (data: Partial<ConfiguracaoApp>) => void;

  addInsumo: (insumo: Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateInsumo: (id: string, data: Partial<Insumo>) => void;
  deleteInsumo: (id: string) => void;
  addMovimentacao: (mov: Omit<MovimentacaoInsumo, 'id' | 'data'>) => void;

  addModelo: (modelo: Omit<Modelo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateModelo: (id: string, data: Partial<Modelo>) => void;
  deleteModelo: (id: string) => void;

  addFichaTecnica: (ficha: Omit<FichaTecnica, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateFichaTecnica: (id: string, data: Partial<FichaTecnica>) => void;
  deleteFichaTecnica: (id: string) => void;

  addOrdemProducao: (ordem: Omit<OrdemProducao, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateOrdemProducao: (id: string, data: Partial<OrdemProducao>) => void;
  deleteOrdemProducao: (id: string) => void;
  moverOrdem: (id: string, novoStatus: StatusProducao) => void;

  addCliente: (cliente: Omit<Cliente, 'id' | 'criadoEm'>) => void;
  updateCliente: (id: string, data: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  addFornecedor: (forn: Omit<Fornecedor, 'id' | 'criadoEm'>) => void;
  updateFornecedor: (id: string, data: Partial<Fornecedor>) => void;
  deleteFornecedor: (id: string) => void;

  addCompra: (compra: Omit<Compra, 'id' | 'criadoEm'>) => void;
  updateCompra: (id: string, data: Partial<Compra>) => void;

  addOrcamento: (orc: Omit<Orcamento, 'id' | 'criadoEm'>) => void;
  updateOrcamento: (id: string, data: Partial<Orcamento>) => void;
  deleteOrcamento: (id: string) => void;

  addHistorico: (h: Omit<HistoricoAlteracao, 'id' | 'data'>) => void;
  addUsuario: (u: Omit<Usuario, 'id' | 'criadoEm'>) => void;
  updateUsuario: (id: string, data: Partial<Usuario>) => void;
  deleteUsuario: (id: string) => void;

  addSubcategoria: (sc: Omit<Subcategoria, 'id'>) => void;
  deleteSubcategoria: (id: string) => void;
}

const dadosIniciais = {
  insumos: [
    { id: uuidv4(), nome: 'Cursor 7 Invertido', codigo: 'CUR-7-INV', categoria: 'cursores' as const, grupo: 'aviamentos' as const, subcategoria: 'Cursor', unidade: 'unidade' as const, quantidade: 5000, estoqueMinimo: 500, valorUnitario: 0.18, criadoEm: now(), atualizadoEm: now() },
    { id: uuidv4(), nome: 'Cursor 7 Comum', codigo: 'CUR-7-COM', categoria: 'cursores' as const, grupo: 'aviamentos' as const, subcategoria: 'Cursor', unidade: 'unidade' as const, quantidade: 3000, estoqueMinimo: 300, valorUnitario: 0.15, criadoEm: now(), atualizadoEm: now() },
    { id: uuidv4(), nome: 'Zíper 7', codigo: 'ZIP-7', categoria: 'zipes' as const, grupo: 'aviamentos' as const, subcategoria: 'Zíper', unidade: 'metro' as const, quantidade: 200, estoqueMinimo: 50, valorUnitario: 2.50, criadoEm: now(), atualizadoEm: now() },
    { id: uuidv4(), nome: 'Etiqueta Bordada', codigo: 'ETI-BOR', categoria: 'etiquetas' as const, grupo: 'aviamentos' as const, subcategoria: 'Etiqueta', unidade: 'unidade' as const, quantidade: 2000, estoqueMinimo: 200, valorUnitario: 0.45, criadoEm: now(), atualizadoEm: now() },
    { id: uuidv4(), nome: 'Fivela Plástica 25mm', codigo: 'FIV-P25', categoria: 'fivelas' as const, grupo: 'aviamentos' as const, subcategoria: 'Fecho', unidade: 'unidade' as const, quantidade: 800, estoqueMinimo: 100, valorUnitario: 0.35, criadoEm: now(), atualizadoEm: now() },
    { id: uuidv4(), nome: 'Linha Preta 120', codigo: 'LIN-P120', categoria: 'linhas' as const, grupo: 'linhas' as const, subcategoria: 'Linha 40', unidade: 'rolo' as const, quantidade: 12, estoqueMinimo: 3, valorUnitario: 18.00, criadoEm: now(), atualizadoEm: now() },
  ] as Insumo[],
  modelos: [
    { id: uuidv4(), nome: 'Mochila Hydro', codigo: 'MOD-HYD-001', categoria: 'mochilas' as const, status: 'aprovado' as const, descricao: 'Mochila resistente à água', observacoes: 'Modelo best-seller', galeria: [], criadoEm: now(), atualizadoEm: now() },
    { id: uuidv4(), nome: 'Pochete Urban', codigo: 'MOD-POC-001', categoria: 'pochetes' as const, status: 'desenvolvimento' as const, descricao: 'Pochete estilo urbano', observacoes: '', galeria: [], criadoEm: now(), atualizadoEm: now() },
  ] as Modelo[],
  clientes: [
    { id: uuidv4(), nomeEmpresa: 'Loja Aventura', nomeContato: 'Carlos Silva', telefone: '(11) 99999-1111', email: 'carlos@aventura.com', instagram: '@lojaventura', observacoes: 'Cliente VIP', criadoEm: now() }
  ] as Cliente[],
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      configuracao: {
        dataPath: '',
        nomeFabrica: 'Minha Fábrica',
        cnpj: '',
        endereco: '',
        telefone: '',
      },
      usuarioAtual: {
        id: 'admin-default',
        nome: 'Administrador',
        email: 'admin@fabrica.com',
        nivel: 'administrador',
        ativo: true,
        criadoEm: now(),
      },
      usuarios: [{
        id: 'admin-default', nome: 'Administrador', email: 'admin@fabrica.com',
        nivel: 'administrador', ativo: true, criadoEm: now(),
      }],
      ...dadosIniciais,
      movimentacoes: [],
      fichasTecnicas: [],
      ordensProducao: [],
      fornecedores: [],
      compras: [],
      orcamentos: [],
      historico: [],
      subcategorias: DEFAULT_SUBCATEGORIAS,

      login: (email, _senha) => {
        const u = get().usuarios.find(u => u.email === email && u.ativo);
        if (u) { set({ usuarioAtual: u }); return true; }
        return false;
      },
      logout: () => set({ usuarioAtual: null }),
      updateConfiguracao: (data) => set(s => ({ configuracao: { ...s.configuracao, ...data } })),

      addInsumo: (data) => {
        const item = { ...data, id: uuidv4(), criadoEm: now(), atualizadoEm: now() };
        set(s => ({ insumos: [...s.insumos, item] }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: 'Criou insumo', entidade: 'Insumo', entidadeId: item.id, depois: item.nome });
      },
      updateInsumo: (id, data) => set(s => ({ insumos: s.insumos.map(i => i.id === id ? { ...i, ...data, atualizadoEm: now() } : i) })),
      deleteInsumo: (id) => set(s => ({ insumos: s.insumos.filter(i => i.id !== id) })),
      addMovimentacao: (mov) => {
        const m = { ...mov, id: uuidv4(), data: now() };
        set(s => {
          const insumos = s.insumos.map(i => {
            if (i.id !== mov.insumoId) return i;
            const delta = mov.tipo === 'entrada' ? mov.quantidade : -mov.quantidade;
            return { ...i, quantidade: Math.max(0, i.quantidade + delta), atualizadoEm: now() };
          });
          return { movimentacoes: [...s.movimentacoes, m], insumos };
        });
      },

      addModelo: (data) => {
        const item = { ...data, id: uuidv4(), criadoEm: now(), atualizadoEm: now() };
        set(s => ({ modelos: [...s.modelos, item] }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: 'Criou modelo', entidade: 'Modelo', entidadeId: item.id, depois: item.nome });
      },
      updateModelo: (id, data) => set(s => ({ modelos: s.modelos.map(m => m.id === id ? { ...m, ...data, atualizadoEm: now() } : m) })),
      deleteModelo: (id) => set(s => ({ modelos: s.modelos.filter(m => m.id !== id) })),

      addFichaTecnica: (data) => {
        const item: FichaTecnica = {
          ...data,
          id: uuidv4(),
          moldes: data.moldes ?? [],
          checkList: data.checkList?.length ? data.checkList : DEFAULT_CHECKLIST.map(c => ({ ...c, id: uuidv4() })),
          romaneio: data.romaneio ?? DEFAULT_ROMANEIO(),
          relatorio: data.relatorio ?? DEFAULT_RELATORIO(),
          cabecalho: data.cabecalho ?? DEFAULT_CABECALHO(),
          tecidosCorte: data.tecidosCorte ?? [],
          aviamentosFicha: data.aviamentosFicha ?? [],
          versao: data.versao ?? 1,
          historicoExportes: data.historicoExportes ?? [],
          criadoEm: now(),
          atualizadoEm: now(),
        };
        set(s => {
          const modelos = s.modelos.map(m => m.id === data.modeloId ? { ...m, fichaTecnicaId: item.id } : m);
          return { fichasTecnicas: [...s.fichasTecnicas, item], modelos };
        });
      },
      updateFichaTecnica: (id, data) => {
        set(s => ({ fichasTecnicas: s.fichasTecnicas.map(f => f.id === id ? { ...f, ...data, atualizadoEm: now() } : f) }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: 'Atualizou ficha técnica', entidade: 'FichaTecnica', entidadeId: id });
      },
      deleteFichaTecnica: (id) => set(s => ({ fichasTecnicas: s.fichasTecnicas.filter(f => f.id !== id) })),

      addOrdemProducao: (data) => {
        const item = { ...data, id: uuidv4(), criadoEm: now(), atualizadoEm: now() };
        set(s => ({ ordensProducao: [...s.ordensProducao, item] }));
      },
      updateOrdemProducao: (id, data) => set(s => ({ ordensProducao: s.ordensProducao.map(o => o.id === id ? { ...o, ...data, atualizadoEm: now() } : o) })),
      deleteOrdemProducao: (id) => set(s => ({ ordensProducao: s.ordensProducao.filter(o => o.id !== id) })),
      moverOrdem: (id, novoStatus) => {
        set(s => ({ ordensProducao: s.ordensProducao.map(o => o.id === id ? { ...o, status: novoStatus, atualizadoEm: now() } : o) }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: `Moveu para ${novoStatus}`, entidade: 'OrdemProducao', entidadeId: id });
      },

      addCliente: (data) => set(s => ({ clientes: [...s.clientes, { ...data, id: uuidv4(), criadoEm: now() }] })),
      updateCliente: (id, data) => set(s => ({ clientes: s.clientes.map(c => c.id === id ? { ...c, ...data } : c) })),
      deleteCliente: (id) => set(s => ({ clientes: s.clientes.filter(c => c.id !== id) })),

      addFornecedor: (data) => set(s => ({ fornecedores: [...s.fornecedores, { ...data, id: uuidv4(), criadoEm: now() }] })),
      updateFornecedor: (id, data) => set(s => ({ fornecedores: s.fornecedores.map(f => f.id === id ? { ...f, ...data } : f) })),
      deleteFornecedor: (id) => set(s => ({ fornecedores: s.fornecedores.filter(f => f.id !== id) })),

      addCompra: (data) => {
        const compra = { ...data, id: uuidv4(), criadoEm: now() };
        set(s => ({ compras: [...s.compras, compra] }));
        if (data.status === 'recebida') {
          data.itens.forEach(item => {
            get().addMovimentacao({ insumoId: item.insumoId, tipo: 'entrada', quantidade: item.quantidade, motivo: 'Compra recebida', usuarioId: get().usuarioAtual?.id ?? '' });
          });
        }
      },
      updateCompra: (id, data) => set(s => ({ compras: s.compras.map(c => c.id === id ? { ...c, ...data } : c) })),

      addOrcamento: (data) => set(s => ({ orcamentos: [...s.orcamentos, { ...data, id: uuidv4(), criadoEm: now() }] })),
      updateOrcamento: (id, data) => set(s => ({ orcamentos: s.orcamentos.map(o => o.id === id ? { ...o, ...data } : o) })),
      deleteOrcamento: (id) => set(s => ({ orcamentos: s.orcamentos.filter(o => o.id !== id) })),

      addHistorico: (h) => set(s => ({ historico: [{ ...h, id: uuidv4(), data: now() }, ...s.historico].slice(0, 500) })),

      addUsuario: (data) => set(s => ({ usuarios: [...s.usuarios, { ...data, id: uuidv4(), criadoEm: now() }] })),
      updateUsuario: (id, data) => set(s => ({ usuarios: s.usuarios.map(u => u.id === id ? { ...u, ...data } : u) })),
      deleteUsuario: (id) => set(s => ({ usuarios: s.usuarios.filter(u => u.id !== id) })),

      addSubcategoria: (data) => set(s => ({ subcategorias: [...s.subcategorias, { ...data, id: uuidv4() }] })),
      deleteSubcategoria: (id) => set(s => ({ subcategorias: s.subcategorias.filter(sc => sc.id !== id) })),
    }),
    {
      name: 'fabrica-erp-v2',
      storage: createJSONStorage(() => ({
        getItem: (name) => appStorage.getItem(name),
        setItem: (name, value) => appStorage.setItem(name, value),
        removeItem: (name) => appStorage.removeItem(name),
      })),
    }
  )
);
