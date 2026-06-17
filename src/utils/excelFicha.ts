import * as XLSX from 'xlsx';
import type { Insumo, FichaTecnica, Modelo, GrupoPrincipal } from '../types';

function detectUnit(nome: string, qtdPorPeca: number): Insumo['unidade'] {
  const n = nome.toLowerCase();
  if (n.includes('tecido') || n.includes('lonita') || n.includes('microfibra') ||
      n.includes('lona') || n.includes('nylon') || n.includes('oxford') ||
      n.includes('viés') || n.includes('vies') ||
      n.includes('elástico') || n.includes('elastico') || n.includes('cordão')) {
    return 'metro';
  }
  if (n.includes('fita') && (n.includes('cm') || n.includes('mm') || n.includes('metro') || qtdPorPeca < 5)) return 'metro';
  if (n.includes('linha')) return 'rolo';
  if (n.includes('kg') || n.includes('quilo')) return 'kg';
  return qtdPorPeca > 0 && qtdPorPeca < 1 ? 'metro' : 'unidade';
}

function detectCategory(nome: string): Insumo['categoria'] {
  const n = nome.toLowerCase();
  if (n.includes('cursor') || n.includes('argola')) return 'cursores';
  if (n.includes('zíper') || n.includes('ziper') || n.includes('zip')) return 'zipes';
  if (n.includes('fivela') || n.includes('borneon') || n.includes('regulador')) return 'fivelas';
  if (n.includes('tecido') || n.includes('lonita') || n.includes('microfibra') ||
      n.includes('lona') || n.includes('nylon') || n.includes('oxford')) return 'tecidos';
  if (n.includes('linha')) return 'linhas';
  if (n.includes('etiqueta') || n.includes('hangtag') || n.includes('tag')) return 'etiquetas';
  if (n.includes('embalagem') || n.includes('caixa') || n.includes('papelão') ||
      n.includes('plastico') || n.includes('plástico') || n.includes('papel') ||
      n.includes('gomada')) return 'embalagens';
  if (n.includes('fita') || n.includes('algodão') || n.includes('velcro')) return 'acessorios';
  return 'acessorios';
}

export function detectGrupoSubcat(nome: string): { grupo: GrupoPrincipal; subcategoria: string } {
  const n = nome.toLowerCase();

  // Tecidos
  if (n.includes('oxford')) return { grupo: 'tecidos', subcategoria: 'Oxford' };
  if (n.includes('ripstop')) return { grupo: 'tecidos', subcategoria: 'Ripstop' };
  if (n.includes('tactel')) return { grupo: 'tecidos', subcategoria: 'Tactel' };
  if (n.includes('microfibra')) return { grupo: 'tecidos', subcategoria: 'Microfibra' };
  if (n.includes('lona') || n.includes('lonita')) return { grupo: 'tecidos', subcategoria: 'Lona' };
  if (n.includes('nylon')) return { grupo: 'tecidos', subcategoria: 'Nylon' };
  if (n.includes('tecido')) return { grupo: 'tecidos', subcategoria: 'Outros' };

  // Linhas
  if (n.includes('linha')) return { grupo: 'linhas', subcategoria: 'Linha 40' };

  // Embalagens
  if (n.includes('embalagem') || n.includes('caixa') || n.includes('papelão') ||
      n.includes('papel') || n.includes('plastico') || n.includes('plástico') ||
      n.includes('gomada')) {
    if (n.includes('caixa') || n.includes('papelão')) return { grupo: 'embalagens', subcategoria: 'Caixa' };
    if (n.includes('papel')) return { grupo: 'embalagens', subcategoria: 'Papel' };
    if (n.includes('plastico') || n.includes('plástico')) return { grupo: 'embalagens', subcategoria: 'Plástico' };
    return { grupo: 'embalagens', subcategoria: 'Outros' };
  }

  // Aviamentos — specific types
  if (n.includes('cursor')) return { grupo: 'aviamentos', subcategoria: 'Cursor' };
  if (n.includes('zíper') || n.includes('ziper') || n.includes('zip')) return { grupo: 'aviamentos', subcategoria: 'Zíper' };
  if (n.includes('regulador')) return { grupo: 'aviamentos', subcategoria: 'Regulador' };
  if (n.includes('fivela') || n.includes('fecho')) return { grupo: 'aviamentos', subcategoria: 'Fecho' };
  if (n.includes('argola')) return { grupo: 'aviamentos', subcategoria: 'Argola' };
  if (n.includes('velcro')) return { grupo: 'aviamentos', subcategoria: 'Velcro' };
  if (n.includes('elástico') || n.includes('elastico')) return { grupo: 'aviamentos', subcategoria: 'Elástico' };
  if (n.includes('cordão') || n.includes('cordao')) return { grupo: 'aviamentos', subcategoria: 'Cordão' };
  if (n.includes('fita')) return { grupo: 'aviamentos', subcategoria: 'Fita' };
  if (n.includes('etiqueta') || n.includes('hangtag') || n.includes('tag')) return { grupo: 'aviamentos', subcategoria: 'Etiqueta' };
  if (n.includes('rebite')) return { grupo: 'aviamentos', subcategoria: 'Rebite' };
  if (n.includes('mosquetão') || n.includes('mosquetao')) return { grupo: 'aviamentos', subcategoria: 'Mosquetão' };
  if (n.includes('puxador')) return { grupo: 'aviamentos', subcategoria: 'Puxador' };
  if (n.includes('ponteira')) return { grupo: 'aviamentos', subcategoria: 'Ponteira' };
  if (n.includes('alça') || n.includes('alca')) return { grupo: 'aviamentos', subcategoria: 'Alça' };
  if (n.includes('passador')) return { grupo: 'aviamentos', subcategoria: 'Passador' };
  if (n.includes('patch')) return { grupo: 'aviamentos', subcategoria: 'Patch' };

  return { grupo: 'aviamentos', subcategoria: 'Ferragens' };
}

// Words that indicate a header/separator row inside a section
const PALAVRAS_CABECALHO = [
  'UNIDADE', 'VARIANTE', 'FOLHAS', 'XXXXXXXXXX', 'RESP.',
  'OFICINA', 'CORTADOR', 'MOLDE', 'NÚMERO', 'NUMERO',
  'QTD. MOCH', 'FORNECEDOR:', 'DESCRICÃ', 'DESCRIÇÃO',
  'QUANTIDADE TOTAL', 'METRAGEM TOTAL', 'METRAGEM POR',
  'QUANTIDADE POR', 'QTD. ENVIADA', 'DATA PEDIDO', 'DATA ENTREGA',
  'INICIO PRODUÇÃO', 'TERM. PRODUÇÃO', 'QUANTIDADE MOLDES',
  'QUANTIDADE GABARITOS', 'PARTE GRÁFICA', 'CORTE EM VIÉS',
  'CORTE PLACAS', 'CORTE BALANCIN',
];

const SECAO_BREAKPOINTS = [
  'CORTE EM VIÉS', 'CORTE EM VIES', 'CORTE PLACAS', 'CORTE BALANCIN',
  'PARTE GRÁFICA', 'QUANTIDADE MOLDES', 'FICHA PRODUÇÃO',
];

function ehCabecalho(r0: string): boolean {
  const up = r0.toUpperCase();
  // Pure header keyword
  if (PALAVRAS_CABECALHO.some(p => up.includes(p))) return true;
  // Rows like "COR", "COR 1", "COR 2" used as column headers
  if (/^COR\s*\d*$/.test(up)) return true;
  return false;
}

function ehBreakpoint(r0: string): boolean {
  const up = r0.toUpperCase();
  return SECAO_BREAKPOINTS.some(p => up.includes(p));
}

interface ItemExtraido {
  nome: string;
  quantidade: number;
  secao: string;
}

export function parseExcelFicha(buffer: ArrayBuffer): {
  modelo: string;
  referencia: string;
  cliente: string;
  representante: string;
  pedido: string;
  colecao: string;
  custoConfeccaoUnid: number;
  itens: ItemExtraido[];
  qtdFicha: number;
} {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let modeloNome = '';
  let referencia = '';
  let cliente = '';
  let representante = '';
  let pedido = '';
  let colecao = '';
  let custoConfeccaoUnid = 0;
  let qtdFicha = 1;

  // Scan first 20 rows for metadata
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    const r0 = String(row[0] ?? '').trim();
    const r1 = String(row[1] ?? '').trim();

    // "CLIENTE: SENAC" — also check col[1] for REPRESENTANTE and col[6] for PEDIDO
    if (/^CLIENTE:/i.test(r0)) {
      cliente = r0.replace(/^CLIENTE:\s*/i, '').trim();
      if (/REPRESENTANTE:/i.test(r1)) representante = r1.replace(/.*REPRESENTANTE:\s*/i, '').trim();
      const r6 = String(row[6] ?? '').trim();
      if (/PEDIDO:/i.test(r6)) pedido = r6.replace(/.*PEDIDO:\s*/i, '').trim();
    }
    // "REF: ..." or "REF. CLIENTE:" — check col[6] for COLEÇÃO
    if (/^REF[\s.]*:/i.test(r0) || /^REF[\s.]*CLIENTE/i.test(r0)) {
      if (/^REF\s*:/i.test(r0)) referencia = r0.replace(/^REF\s*:\s*/i, '').trim();
      const r6 = String(row[6] ?? '').trim();
      if (/COLE[ÇC]/i.test(r6)) colecao = r6.replace(/.*COLE[ÇC][ÃA]O:\s*/i, '').trim();
    }
    // "MODELO: ..." in col 1
    if (/MODELO:/i.test(r1)) {
      modeloNome = r1.replace(/.*MODELO:\s*/i, '').trim();
    }
    if (/MODELO:/i.test(r0) && !modeloNome) {
      modeloNome = r0.replace(/.*MODELO:\s*/i, '').trim();
    }
    // "QUANTIDADE FICHA" row
    if (/QUANTIDADE.*FICHA/i.test(r0)) {
      const v = Number(row[2]);
      if (v > 0) qtdFicha = v;
    }
    // "CUSTO CONFECÇÃO OFICINA:" or similar
    if (/CUSTO.*CONFEC/i.test(r0) || /CUSTO.*OFIC/i.test(r0)) {
      const v = Number(row[2]);
      if (v > 0) custoConfeccaoUnid = v;
    }
  }

  if (!modeloNome) modeloNome = sheetName.trim();

  // ── Parse material sections ─────────────────────────────────────
  const secaoMarcadores = [
    { marcador: 'DIVISÃO TECIDOS', secao: 'corte' },
    { marcador: 'AVIAMENTOS CLIENTE', secao: 'cliente' },
    { marcador: 'TRAVETES', secao: 'travetes' },
    { marcador: 'ACABAMENTO', secao: 'acabamento' },
    { marcador: 'AVIAMENTOS', secao: 'aviamentos' },
  ];

  const itensRaw: ItemExtraido[] = [];
  let secaoAtual = '';
  let dentroSecao = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const r0 = String(row[0] ?? '').trim();
    if (!r0) continue;

    // Check for section marker
    const marcador = secaoMarcadores.find(s => r0.toUpperCase().includes(s.marcador));
    if (marcador) {
      secaoAtual = marcador.secao;
      dentroSecao = true;
      continue;
    }

    // Breakpoints that end a section (like "CORTE EM VIÉS")
    if (dentroSecao && ehBreakpoint(r0)) {
      // Only exit tecidos, not aviamentos
      if (secaoAtual === 'Tecidos') {
        dentroSecao = false;
        secaoAtual = '';
      }
      continue;
    }

    if (!dentroSecao) continue;
    if (ehCabecalho(r0)) continue;

    const qtdPorPeca = Number(row[1]) || 0;
    // Only include if has a positive quantity per piece
    if (qtdPorPeca > 0) {
      itensRaw.push({
        nome: r0.trim().replace(/\s+/g, ' '),
        quantidade: qtdPorPeca,
        secao: secaoAtual,
      });
    }
  }

  // Deduplicate: keep first occurrence of each name (across sections repetidas)
  const visto = new Set<string>();
  const itens = itensRaw.filter(item => {
    const key = item.nome.toLowerCase().trim();
    if (visto.has(key)) return false;
    visto.add(key);
    return true;
  });

  return { modelo: modeloNome, referencia, cliente, representante, pedido, colecao, custoConfeccaoUnid, itens, qtdFicha };
}

export interface ImportResult {
  modeloNovo: Omit<Modelo, 'id' | 'criadoEm' | 'atualizadoEm'>;
  fichaNova: Omit<FichaTecnica, 'id' | 'criadoEm' | 'atualizadoEm' | 'modeloId'>;
  insumosParaCriar: Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'>[];
  insumosResolvidos: { insumoExistenteId?: string; insumoNome: string; quantidade: number; isNovo: boolean; secao?: string }[];
}

export function processarImport(
  parsed: ReturnType<typeof parseExcelFicha>,
  insumosExistentes: Insumo[]
): ImportResult {
  const insumosParaCriar: Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'>[] = [];
  const insumosResolvidos: ImportResult['insumosResolvidos'] = [];
  const jaAdicionados = new Set<string>();

  parsed.itens.forEach(item => {
    const nomeNorm = item.nome.toLowerCase().trim();
    const existente = insumosExistentes.find(i =>
      i.nome.toLowerCase().trim().includes(nomeNorm) ||
      nomeNorm.includes(i.nome.toLowerCase().trim())
    );

    if (existente) {
      insumosResolvidos.push({
        insumoExistenteId: existente.id,
        insumoNome: existente.nome,
        quantidade: item.quantidade,
        isNovo: false,
        secao: item.secao,
      });
    } else {
      if (!jaAdicionados.has(nomeNorm)) {
        jaAdicionados.add(nomeNorm);
        const unidade = detectUnit(item.nome, item.quantidade);
        const codigo = item.nome.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 15);
        const { grupo, subcategoria } = detectGrupoSubcat(item.nome);
        insumosParaCriar.push({
          nome: item.nome,
          codigo,
          categoria: detectCategory(item.nome),
          grupo,
          subcategoria,
          unidade,
          quantidade: 0,
          estoqueMinimo: 10,
          valorUnitario: 0,
        });
      }
      insumosResolvidos.push({
        insumoNome: item.nome,
        quantidade: item.quantidade,
        isNovo: true,
        secao: item.secao,
      });
    }
  });

  const modeloNovo: Omit<Modelo, 'id' | 'criadoEm' | 'atualizadoEm'> = {
    nome: parsed.modelo,
    codigo: (parsed.referencia || parsed.modelo).toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20),
    categoria: detectModeloCategoria(parsed.modelo),
    status: 'aprovado',
    descricao: `Importado do Excel. Cliente: ${parsed.cliente}`.trim().replace(/\.$/, ''),
    observacoes: `Quantidade por ficha: ${parsed.qtdFicha}`,
    galeria: [],
  };

  const fichaNova: Omit<FichaTecnica, 'id' | 'criadoEm' | 'atualizadoEm' | 'modeloId'> = {
    itens: [],
    tempoProdução: 0,
    custoMaoDeObra: 0,
    outrosCustos: 0,
    margemLucro: 20,
    moldes: [],
    checkList: [],
    romaneio: { oficina: '', telefone: '', dataEnvio: '', dataRetirada: '', qtdEnviada: 0, desconto: 0, totalFicha: 0, observacoes: '' },
    relatorio: { oficina: '', prazoEntrega: '', corteTecidosOk: null, corteAviamentosOk: null, retalhosTecidosOk: null, retalhosAviamentosOk: null, notaQualidade: 0, notaOrganizacao: 0, diasAtraso: 0, qtdDefeitos: 0, observacoes: '' },
    cabecalho: {
      cliente: parsed.cliente,
      representante: parsed.representante,
      pedido: parsed.pedido,
      refCliente: parsed.referencia,
      refMatriz: '',
      colecao: parsed.colecao,
      qtdMostruario: 0,
      custoConfeccaoUnid: parsed.custoConfeccaoUnid,
      quantidadeFicha: parsed.qtdFicha,
      dataPedido: '', dataEntrega: '', inicioProducao: '', terminoProducao: '',
      oficina: '', telefone: '', cortador: '', qtdMoldesTotal: 0, qtdGabaritos: 0,
    },
    tecidosCorte: [],
    aviamentosFicha: [],
    versao: 1,
    historicoExportes: [],
  };

  return { modeloNovo, fichaNova, insumosParaCriar, insumosResolvidos };
}

function detectModeloCategoria(nome: string): Modelo['categoria'] {
  const n = nome.toLowerCase();
  if (n.includes('mochila')) return 'mochilas';
  if (n.includes('bolsa')) return 'bolsas';
  if (n.includes('pochete')) return 'pochetes';
  if (n.includes('necessaire') || n.includes('organizador')) return 'necessaires';
  if (n.includes('carteira')) return 'carteiras';
  return 'acessorios';
}

export function exportarFichaExcel(
  modelo: Modelo,
  ficha: FichaTecnica,
  insumos: Insumo[],
  clienteNome = ''
): void {
  const wb = XLSX.utils.book_new();

  const custoMateriais = ficha.itens.reduce((sum, item) => {
    const ins = insumos.find(i => i.id === item.insumoId);
    return sum + (ins?.valorUnitario ?? 0) * item.quantidade;
  }, 0);
  const custoTotal = custoMateriais + ficha.custoMaoDeObra + ficha.outrosCustos;
  const precoSugerido = custoTotal * (1 + ficha.margemLucro / 100);

  const rows: (string | number | null)[][] = [
    ['FICHA TÉCNICA', '', '', '', ''],
    [],
    ['MODELO:', modelo.nome, '', 'CÓDIGO:', modelo.codigo],
    ['CLIENTE:', clienteNome, '', 'STATUS:', modelo.status.toUpperCase()],
    ['CATEGORIA:', modelo.categoria.toUpperCase(), '', 'DATA:', new Date().toLocaleDateString('pt-BR')],
    ['DESCRIÇÃO:', modelo.descricao],
    [],
    ['AVIAMENTOS / MATERIAIS', '', '', '', ''],
    ['MATERIAL', 'UNIDADE', 'QUANTIDADE', 'VALOR UNIT. (R$)', 'TOTAL (R$)'],
  ];

  ficha.itens.forEach(item => {
    const ins = insumos.find(i => i.id === item.insumoId);
    if (!ins) return;
    rows.push([ins.nome, ins.unidade, item.quantidade, ins.valorUnitario, ins.valorUnitario * item.quantidade]);
  });

  rows.push([], ['CUSTOS', '', '', '', '']);
  rows.push(['Custo dos Materiais', '', '', '', custoMateriais]);
  rows.push(['Mão de Obra', '', '', '', ficha.custoMaoDeObra]);
  rows.push(['Outros Custos', '', '', '', ficha.outrosCustos]);
  rows.push(['CUSTO TOTAL', '', '', '', custoTotal]);
  rows.push([]);
  rows.push(['Margem de Lucro', `${ficha.margemLucro}%`, '', '', '']);
  rows.push(['PREÇO SUGERIDO DE VENDA', '', '', '', precoSugerido]);
  rows.push([]);
  rows.push(['Tempo de Produção (min)', ficha.tempoProdução]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 42 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];

  XLSX.utils.book_append_sheet(wb, ws, modelo.nome.slice(0, 31));
  XLSX.writeFile(wb, `FichaTecnica_${modelo.codigo || modelo.nome}.xlsx`);
}
