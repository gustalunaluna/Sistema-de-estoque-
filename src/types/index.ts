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

export type GrupoPrincipal =
  | 'aviamentos'
  | 'tecidos'
  | 'linhas'
  | 'reforcos'
  | 'embalagens'
  | 'outros';

export interface Subcategoria {
  id: string;
  grupo: GrupoPrincipal;
  nome: string;
}

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
  | 'orcamento'
  | 'aprovada'
  | 'separacao'
  | 'oficina'
  | 'corte'
  | 'costura'
  | 'revisao'
  | 'enviada'
  | 'finalizada';

export type SecaoFicha = 'corte' | 'aviamentos' | 'acabamento' | 'cliente' | 'travetes';

export type NivelUsuario = 'administrador' | 'estoque' | 'producao' | 'comercial';

export interface Insumo {
  id: string;
  foto?: string;
  nome: string;
  codigo: string;
  categoria: CategoriaInsumo;
  grupo?: GrupoPrincipal;
  subcategoria?: string;
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
  secao: SecaoFicha;
}

export interface CheckListItem {
  id: string;
  descricao: string;
  ok: boolean | null;
  responsavel: string;
  obs: string;
}

export interface RomaneioData {
  oficina: string;
  telefone: string;
  dataEnvio: string;
  dataRetirada: string;
  qtdEnviada: number;
  desconto: number;
  totalFicha: number;
  observacoes: string;
}

export interface RelatorioProducao {
  oficina: string;
  prazoEntrega: string;
  corteTecidosOk: boolean | null;
  corteAviamentosOk: boolean | null;
  retalhosTecidosOk: boolean | null;
  retalhosAviamentosOk: boolean | null;
  notaQualidade: number;
  notaOrganizacao: number;
  diasAtraso: number;
  qtdDefeitos: number;
  observacoes: string;
}

export interface MoldeItem {
  id: string;
  numero: string;
  descricao: string;
  quantidade: string;
  cor: string;
}

export interface FichaCabecalho {
  cliente: string;
  representante: string;
  pedido: string;
  refCliente: string;
  refMatriz: string;
  colecao: string;
  qtdMostruario: number;
  custoConfeccaoUnid: number;
  quantidadeFicha: number;
  dataPedido: string;
  dataEntrega: string;
  inicioProducao: string;
  terminoProducao: string;
  oficina: string;
  telefone: string;
  cortador: string;
  qtdMoldesTotal: number;
  qtdGabaritos: number;
}

export interface TecidoCorte {
  id: string;
  descricao: string;
  unidade: string;
  variante1: string;
  total1: number;
  folhas1: number;
  variante2: string;
  total2: number;
  folhas2: number;
}

export interface AviamentoFicha {
  id: string;
  descricao: string;
  unidade: number;
  variante: string;
  total: number;
  enviada: number;
  responsavel: string;
  secao: 'aviamentos' | 'acabamento' | 'cliente' | 'travetes';
}

export interface ExporteHistorico {
  data: string;
  versao: number;
  tipo: 'excel' | 'pdf' | 'impressao';
}

export interface FichaTecnica {
  id: string;
  modeloId: string;
  itens: ItemFichaTecnica[];
  tempoProdução: number;
  custoMaoDeObra: number;
  outrosCustos: number;
  margemLucro: number;
  moldes: MoldeItem[];
  checkList: CheckListItem[];
  romaneio: RomaneioData;
  relatorio: RelatorioProducao;
  cabecalho: FichaCabecalho;
  tecidosCorte: TecidoCorte[];
  aviamentosFicha: AviamentoFicha[];
  versao: number;
  historicoExportes: ExporteHistorico[];
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

export interface ConfiguracaoApp {
  dataPath: string;
  nomeFabrica: string;
  cnpj: string;
  endereco: string;
  telefone: string;
}
