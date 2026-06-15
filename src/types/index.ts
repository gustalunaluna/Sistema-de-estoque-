export type UnidadeMedida = 'unidade' | 'metro' | 'kg' | 'rolo' | 'par' | 'litro';

export type CategoriaInsumo =
  | 'cursores'
  | 'zipes'
  | 'fivelas'
  | 'tecidos'
  | 'linhas'
  | 'etiquetas'
  | 'embalagens'
  | 'acessorios'
  | 'outros';

export type CategoriaModelo =
  | 'mochilas'
  | 'bolsas'
  | 'pochetes'
  | 'necessaires'
  | 'carteiras'
  | 'acessorios';

export type StatusModelo = 'desenvolvimento' | 'revisao' | 'aprovado' | 'finalizado';

export type StatusProducao =
  | 'criada'
  | 'revisao'
  | 'aprovada'
  | 'corte'
  | 'costura'
  | 'acabamento'
  | 'finalizada';

export type NivelUsuario = 'administrador' | 'estoque' | 'producao' | 'comercial';

export interface Insumo {
  id: string;
  foto?: string;
  nome: string;
  codigo: string;
  categoria: CategoriaInsumo;
  fornecedorId?: string;
  unidade: UnidadeMedida;
  quantidade: number;
  estoqueMinimo: number;
  valorUnitario: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface MovimentacaoInsumo {
  id: string;
  insumoId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  usuarioId: string;
  data: string;
  observacao?: string;
}

export interface ItemFichaTecnica {
  insumoId: string;
  quantidade: number;
}

export interface FichaTecnica {
  id: string;
  modeloId: string;
  itens: ItemFichaTecnica[];
  tempoProdução: number;
  custoMaoDeObra: number;
  outrosCustos: number;
  margemLucro: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Modelo {
  id: string;
  fotoPrincipal?: string;
  galeria: string[];
  nome: string;
  codigo: string;
  categoria: CategoriaModelo;
  clienteId?: string;
  descricao: string;
  observacoes: string;
  status: StatusModelo;
  fichaTecnicaId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface OrdemProducao {
  id: string;
  modeloId: string;
  clienteId?: string;
  quantidade: number;
  status: StatusProducao;
  responsavelId?: string;
  dataInicio: string;
  dataEntrega: string;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Cliente {
  id: string;
  nomeEmpresa: string;
  nomeContato: string;
  telefone: string;
  email: string;
  instagram: string;
  observacoes: string;
  criadoEm: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  empresa: string;
  telefone: string;
  email: string;
  produtosFornecidos: string;
  observacoes: string;
  criadoEm: string;
}

export interface Compra {
  id: string;
  fornecedorId: string;
  itens: { insumoId: string; quantidade: number; valorUnitario: number }[];
  valorTotal: number;
  data: string;
  status: 'pendente' | 'recebida' | 'cancelada';
  observacoes: string;
  criadoEm: string;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  modeloId: string;
  quantidade: number;
  custoProducao: number;
  precoUnitario: number;
  valorTotal: number;
  margemLucro: number;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado';
  observacoes: string;
  criadoEm: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel: NivelUsuario;
  ativo: boolean;
  criadoEm: string;
}

export interface HistoricoAlteracao {
  id: string;
  usuarioId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  antes?: string;
  depois?: string;
  data: string;
}
