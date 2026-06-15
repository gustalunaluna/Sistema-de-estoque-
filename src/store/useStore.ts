import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Insumo, MovimentacaoInsumo, Modelo, FichaTecnica, OrdemProducao,
  Cliente, Fornecedor, Compra, Orcamento, Usuario, HistoricoAlteracao,
  StatusProducao
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  // Auth
  usuarioAtual: Usuario | null;
  usuarios: Usuario[];

  // Data
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

  // Auth actions
  login: (email: string, senha: string) => boolean;
  logout: () => void;

  // Insumo actions
  addInsumo: (insumo: Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateInsumo: (id: string, data: Partial<Insumo>) => void;
  deleteInsumo: (id: string) => void;
  addMovimentacao: (mov: Omit<MovimentacaoInsumo, 'id' | 'data'>) => void;

  // Modelo actions
  addModelo: (modelo: Omit<Modelo, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateModelo: (id: string, data: Partial<Modelo>) => void;
  deleteModelo: (id: string) => void;

  // Ficha tecnica actions
  addFichaTecnica: (ficha: Omit<FichaTecnica, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateFichaTecnica: (id: string, data: Partial<FichaTecnica>) => void;
  deleteFichaTecnica: (id: string) => void;

  // Ordem producao actions
  addOrdemProducao: (ordem: Omit<OrdemProducao, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateOrdemProducao: (id: string, data: Partial<OrdemProducao>) => void;
  deleteOrdemProducao: (id: string) => void;
  moverOrdem: (id: string, novoStatus: StatusProducao) => void;

  // Cliente actions
  addCliente: (cliente: Omit<Cliente, 'id' | 'criadoEm'>) => void;
  updateCliente: (id: string, data: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  // Fornecedor actions
  addFornecedor: (forn: Omit<Fornecedor, 'id' | 'criadoEm'>) => void;
  updateFornecedor: (id: string, data: Partial<Fornecedor>) => void;
  deleteFornecedor: (id: string) => void;

  // Compra actions
  addCompra: (compra: Omit<Compra, 'id' | 'criadoEm'>) => void;
  updateCompra: (id: string, data: Partial<Compra>) => void;

  // Orcamento actions
  addOrcamento: (orc: Omit<Orcamento, 'id' | 'criadoEm'>) => void;
  updateOrcamento: (id: string, data: Partial<Orcamento>) => void;
  deleteOrcamento: (id: string) => void;

  // Historico
  addHistorico: (h: Omit<HistoricoAlteracao, 'id' | 'data'>) => void;

  // Usuario actions
  addUsuario: (u: Omit<Usuario, 'id' | 'criadoEm'>) => void;
  updateUsuario: (id: string, data: Partial<Usuario>) => void;
  deleteUsuario: (id: string) => void;
}

const now = () => new Date().toISOString();

const dadosIniciais = {
  insumos: [
    {
      id: uuidv4(), nome: 'Cursor 7 Invertido', codigo: 'CUR-7-INV',
      categoria: 'cursores' as const, unidade: 'unidade' as const,
      quantidade: 5000, estoqueMinimo: 500, valorUnitario: 0.18,
      criadoEm: now(), atualizadoEm: now()
    },
    {
      id: uuidv4(), nome: 'Cursor 7 Comum', codigo: 'CUR-7-COM',
      categoria: 'cursores' as const, unidade: 'unidade' as const,
      quantidade: 3000, estoqueMinimo: 300, valorUnitario: 0.15,
      criadoEm: now(), atualizadoEm: now()
    },
    {
      id: uuidv4(), nome: 'Zíper 7', codigo: 'ZIP-7',
      categoria: 'zipes' as const, unidade: 'metro' as const,
      quantidade: 200, estoqueMinimo: 50, valorUnitario: 2.50,
      criadoEm: now(), atualizadoEm: now()
    },
    {
      id: uuidv4(), nome: 'Etiqueta Bordada', codigo: 'ETI-BOR',
      categoria: 'etiquetas' as const, unidade: 'unidade' as const,
      quantidade: 2000, estoqueMinimo: 200, valorUnitario: 0.45,
      criadoEm: now(), atualizadoEm: now()
    },
    {
      id: uuidv4(), nome: 'Fivela Plástica 25mm', codigo: 'FIV-P25',
      categoria: 'fivelas' as const, unidade: 'unidade' as const,
      quantidade: 800, estoqueMinimo: 100, valorUnitario: 0.35,
      criadoEm: now(), atualizadoEm: now()
    },
    {
      id: uuidv4(), nome: 'Linha Preta 120', codigo: 'LIN-P120',
      categoria: 'linhas' as const, unidade: 'rolo' as const,
      quantidade: 12, estoqueMinimo: 3, valorUnitario: 18.00,
      criadoEm: now(), atualizadoEm: now()
    },
  ] as Insumo[],
  modelos: [
    {
      id: uuidv4(), nome: 'Mochila Hydro', codigo: 'MOD-HYD-001',
      categoria: 'mochilas' as const, status: 'aprovado' as const,
      descricao: 'Mochila resistente à água com bolso para hidratação',
      observacoes: 'Modelo best-seller', galeria: [], criadoEm: now(), atualizadoEm: now()
    },
    {
      id: uuidv4(), nome: 'Pochete Urban', codigo: 'MOD-POC-001',
      categoria: 'pochetes' as const, status: 'desenvolvimento' as const,
      descricao: 'Pochete estilo urbano com compartimentos múltiplos',
      observacoes: '', galeria: [], criadoEm: now(), atualizadoEm: now()
    },
  ] as Modelo[],
  clientes: [
    {
      id: uuidv4(), nomeEmpresa: 'Loja Aventura', nomeContato: 'Carlos Silva',
      telefone: '(11) 99999-1111', email: 'carlos@aventura.com',
      instagram: '@lojaventura', observacoes: 'Cliente VIP', criadoEm: now()
    }
  ] as Cliente[],
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      usuarioAtual: {
        id: 'admin-default',
        nome: 'Administrador',
        email: 'admin@fabrica.com',
        nivel: 'administrador',
        ativo: true,
        criadoEm: now(),
      },
      usuarios: [
        {
          id: 'admin-default',
          nome: 'Administrador',
          email: 'admin@fabrica.com',
          nivel: 'administrador',
          ativo: true,
          criadoEm: now(),
        }
      ],
      ...dadosIniciais,
      movimentacoes: [],
      fichasTecnicas: [],
      ordensProducao: [],
      fornecedores: [],
      compras: [],
      orcamentos: [],
      historico: [],

      login: (email, _senha) => {
        const u = get().usuarios.find(u => u.email === email && u.ativo);
        if (u) { set({ usuarioAtual: u }); return true; }
        return false;
      },
      logout: () => set({ usuarioAtual: null }),

      addInsumo: (data) => {
        const item = { ...data, id: uuidv4(), criadoEm: now(), atualizadoEm: now() };
        set(s => ({ insumos: [...s.insumos, item] }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: 'Criou insumo', entidade: 'Insumo', entidadeId: item.id, depois: item.nome });
      },
      updateInsumo: (id, data) => {
        set(s => ({ insumos: s.insumos.map(i => i.id === id ? { ...i, ...data, atualizadoEm: now() } : i) }));
      },
      deleteInsumo: (id) => {
        set(s => ({ insumos: s.insumos.filter(i => i.id !== id) }));
      },
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
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: `${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${mov.quantidade} un`, entidade: 'Insumo', entidadeId: mov.insumoId });
      },

      addModelo: (data) => {
        const item = { ...data, id: uuidv4(), criadoEm: now(), atualizadoEm: now() };
        set(s => ({ modelos: [...s.modelos, item] }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: 'Criou modelo', entidade: 'Modelo', entidadeId: item.id, depois: item.nome });
      },
      updateModelo: (id, data) => {
        set(s => ({ modelos: s.modelos.map(m => m.id === id ? { ...m, ...data, atualizadoEm: now() } : m) }));
      },
      deleteModelo: (id) => {
        set(s => ({ modelos: s.modelos.filter(m => m.id !== id) }));
      },

      addFichaTecnica: (data) => {
        const item = { ...data, id: uuidv4(), criadoEm: now(), atualizadoEm: now() };
        set(s => {
          const modelos = s.modelos.map(m => m.id === data.modeloId ? { ...m, fichaTecnicaId: item.id } : m);
          return { fichasTecnicas: [...s.fichasTecnicas, item], modelos };
        });
      },
      updateFichaTecnica: (id, data) => {
        set(s => ({ fichasTecnicas: s.fichasTecnicas.map(f => f.id === id ? { ...f, ...data, atualizadoEm: now() } : f) }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: 'Atualizou ficha técnica', entidade: 'FichaTecnica', entidadeId: id });
      },
      deleteFichaTecnica: (id) => {
        set(s => ({ fichasTecnicas: s.fichasTecnicas.filter(f => f.id !== id) }));
      },

      addOrdemProducao: (data) => {
        const item = { ...data, id: uuidv4(), criadoEm: now(), atualizadoEm: now() };
        set(s => ({ ordensProducao: [...s.ordensProducao, item] }));
      },
      updateOrdemProducao: (id, data) => {
        set(s => ({ ordensProducao: s.ordensProducao.map(o => o.id === id ? { ...o, ...data, atualizadoEm: now() } : o) }));
      },
      deleteOrdemProducao: (id) => {
        set(s => ({ ordensProducao: s.ordensProducao.filter(o => o.id !== id) }));
      },
      moverOrdem: (id, novoStatus) => {
        set(s => ({
          ordensProducao: s.ordensProducao.map(o => o.id === id ? { ...o, status: novoStatus, atualizadoEm: now() } : o)
        }));
        get().addHistorico({ usuarioId: get().usuarioAtual?.id ?? '', acao: `Moveu para ${novoStatus}`, entidade: 'OrdemProducao', entidadeId: id });
      },

      addCliente: (data) => {
        set(s => ({ clientes: [...s.clientes, { ...data, id: uuidv4(), criadoEm: now() }] }));
      },
      updateCliente: (id, data) => {
        set(s => ({ clientes: s.clientes.map(c => c.id === id ? { ...c, ...data } : c) }));
      },
      deleteCliente: (id) => {
        set(s => ({ clientes: s.clientes.filter(c => c.id !== id) }));
      },

      addFornecedor: (data) => {
        set(s => ({ fornecedores: [...s.fornecedores, { ...data, id: uuidv4(), criadoEm: now() }] }));
      },
      updateFornecedor: (id, data) => {
        set(s => ({ fornecedores: s.fornecedores.map(f => f.id === id ? { ...f, ...data } : f) }));
      },
      deleteFornecedor: (id) => {
        set(s => ({ fornecedores: s.fornecedores.filter(f => f.id !== id) }));
      },

      addCompra: (data) => {
        const compra = { ...data, id: uuidv4(), criadoEm: now() };
        set(s => ({ compras: [...s.compras, compra] }));
        if (data.status === 'recebida') {
          data.itens.forEach(item => {
            get().addMovimentacao({ insumoId: item.insumoId, tipo: 'entrada', quantidade: item.quantidade, motivo: 'Compra recebida', usuarioId: get().usuarioAtual?.id ?? '' });
          });
        }
      },
      updateCompra: (id, data) => {
        set(s => ({ compras: s.compras.map(c => c.id === id ? { ...c, ...data } : c) }));
      },

      addOrcamento: (data) => {
        set(s => ({ orcamentos: [...s.orcamentos, { ...data, id: uuidv4(), criadoEm: now() }] }));
      },
      updateOrcamento: (id, data) => {
        set(s => ({ orcamentos: s.orcamentos.map(o => o.id === id ? { ...o, ...data } : o) }));
      },
      deleteOrcamento: (id) => {
        set(s => ({ orcamentos: s.orcamentos.filter(o => o.id !== id) }));
      },

      addHistorico: (h) => {
        set(s => ({ historico: [{ ...h, id: uuidv4(), data: now() }, ...s.historico].slice(0, 500) }));
      },

      addUsuario: (data) => {
        set(s => ({ usuarios: [...s.usuarios, { ...data, id: uuidv4(), criadoEm: now() }] }));
      },
      updateUsuario: (id, data) => {
        set(s => ({ usuarios: s.usuarios.map(u => u.id === id ? { ...u, ...data } : u) }));
      },
      deleteUsuario: (id) => {
        set(s => ({ usuarios: s.usuarios.filter(u => u.id !== id) }));
      },
    }),
    { name: 'fabrica-estoque-v1' }
  )
);
