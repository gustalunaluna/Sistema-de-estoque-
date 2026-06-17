/**
 * Simple from-scratch Excel export for Fichas Técnicas.
 * Generates a clean functional spreadsheet using ExcelJS — no template file required.
 */

const ExcelJS = require('exceljs');

// ── Helpers ──────────────────────────────────────────────────────────────────

function corteToMetros(tamanho, unidade) {
  switch (unidade) {
    case 'm':  return tamanho;
    case 'cm': return tamanho * 0.01;
    case 'mm': return tamanho * 0.001;
    default:   return tamanho;
  }
}

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thinBorder = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' },
};
const hairBorder = {
  bottom: { style: 'hair' },
  left:   { style: 'thin' },
  right:  { style: 'thin' },
};

const COLORS = {
  headerDark: 'FF1E293B',
  labelBg:    'FFF1F5F9',
  corte:      'FF1D4ED8',
  aviamentos: 'FFEA580C',
  acabamento: 'FF0D9488',
  cliente:    'FF7C3AED',
  travetes:   'FFE11D48',
  moldes:     'FF475569',
  tableHead:  'FFF1F5F9',
  altRow:     'FFF8FAFC',
  cutsRow:    'FFFFF7ED',
  white:      'FFFFFFFF',
};

const SECTION_TITLES = {
  corte:      'DIVISÃO DE TECIDOS — CORTE',
  aviamentos: 'AVIAMENTOS 1',
  acabamento: 'ACABAMENTO',
  cliente:    'AVIAMENTOS CLIENTE',
  travetes:   'TRAVETES',
};

const SECTION_COLORS = {
  corte:      COLORS.corte,
  aviamentos: COLORS.aviamentos,
  acabamento: COLORS.acabamento,
  cliente:    COLORS.cliente,
  travetes:   COLORS.travetes,
};

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * @param {object} data
 * @param {object} data.ficha
 * @param {object} data.modelo
 * @param {object[]} data.insumos
 * @param {number}   data.versao
 * @returns {Promise<Buffer>}
 */
async function exportarFichaExcel({ ficha, modelo, insumos = [], versao = 1 }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema de Estoque';
  wb.created = new Date();

  const ws = wb.addWorksheet('Ficha Técnica');

  ws.columns = [
    { width: 36 }, // A – Material / Label
    { width: 20 }, // B – Categoria / Value
    { width: 12 }, // C – Qtd/Peça
    { width: 10 }, // D – Unidade
    { width: 12 }, // E – Total
    { width: 14 }, // F – Custo Unit.
    { width: 14 }, // G – Custo Total
  ];

  const cab = ficha.cabecalho || {};
  const qtdFicha  = Number(cab.quantidadeFicha)   || 1;
  const custoUnid = Number(cab.custoConfeccaoUnid) || 0;

  let row = 1;

  // ── TITLE ──────────────────────────────────────────────────────────────────
  ws.mergeCells(`A${row}:G${row}`);
  const titleCell = ws.getCell(row, 1);
  titleCell.value     = `FICHA TÉCNICA DE PRODUÇÃO  |  ${(modelo.nome || '').toUpperCase()}  |  v${versao}`;
  titleCell.fill      = fill(COLORS.headerDark);
  titleCell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border    = thinBorder;
  ws.getRow(row).height = 24;
  row++;

  // ── CABEÇALHO ──────────────────────────────────────────────────────────────
  const infoRows = [
    ['Modelo',          modelo.nome   || '—', 'Código',           modelo.codigo    || '—'],
    ['Cliente',         cab.cliente   || '—', 'Pedido',           cab.pedido       || '—'],
    ['Representante',   cab.representante || '—', 'Ref. Cliente', cab.refCliente   || '—'],
    ['Coleção',         cab.colecao   || '—', 'Ref. Matriz',      cab.refMatriz    || '—'],
    ['Data Pedido',     cab.dataPedido    || '—', 'Data Entrega',  cab.dataEntrega  || '—'],
    ['Início Produção', cab.inicioProducao || '—', 'Término Produção', cab.terminoProducao || '—'],
    ['Qtd. Ficha',      qtdFicha,         'Custo/unid.',          `R$ ${custoUnid.toFixed(2)}`],
    ['Total Ficha',     `R$ ${(custoUnid * qtdFicha).toFixed(2)}`, 'QTD Mostruário', cab.qtdMostruario || 0],
    ['Oficina',         cab.oficina   || '—', 'Telefone',          cab.telefone     || '—'],
    ['Cortador',        cab.cortador  || '—', 'Qtd Moldes',        cab.qtdMoldesTotal || 0],
  ];

  for (const [l1, v1, l2, v2] of infoRows) {
    const r = ws.getRow(row);
    r.values = [l1, v1, '', l2, v2, '', ''];
    r.height = 14;
    // Label cells
    [1, 4].forEach(col => {
      const c = ws.getCell(row, col);
      c.fill   = fill(COLORS.labelBg);
      c.font   = { bold: true, size: 9 };
      c.border = hairBorder;
    });
    // Value cells
    [2, 5].forEach(col => {
      const c = ws.getCell(row, col);
      c.font   = { size: 9 };
      c.border = hairBorder;
    });
    row++;
  }

  row++; // spacer

  // ── MATERIAL SECTION ───────────────────────────────────────────────────────
  const addSection = (secao, items) => {
    if (items.length === 0) return;

    // Section header bar
    ws.mergeCells(`A${row}:G${row}`);
    const hCell = ws.getCell(row, 1);
    hCell.value     = SECTION_TITLES[secao];
    hCell.fill      = fill(SECTION_COLORS[secao]);
    hCell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    hCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    hCell.border    = thinBorder;
    ws.getRow(row).height = 16;
    row++;

    // Table header
    const thRow = ws.getRow(row);
    thRow.values = ['Material', 'Categoria', 'Qtd/Peça', 'Unidade', 'Total', 'Custo Unit.', 'Custo Total'];
    thRow.height = 14;
    for (let col = 1; col <= 7; col++) {
      const c = ws.getCell(row, col);
      c.fill      = fill(COLORS.tableHead);
      c.font      = { bold: true, size: 8 };
      c.alignment = col > 2 ? { horizontal: 'right' } : { horizontal: 'left' };
      c.border    = thinBorder;
    }
    row++;

    // Item rows
    items.forEach((item, idx) => {
      const ins       = insumos.find(i => i.id === item.insumoId);
      const nome      = ins?.nome      ?? '—';
      const cat       = ins?.subcategoria || ins?.categoria || '—';
      const unidade   = ins?.unidade   ?? '';
      const qty       = item.quantidade;
      const total     = +(qty * qtdFicha).toFixed(3);
      const custoUn   = ins?.valorUnitario ?? 0;
      const custoTot  = +(custoUn * qty).toFixed(2);
      const rowFill   = fill(idx % 2 === 1 ? COLORS.altRow : COLORS.white);

      const r = ws.getRow(row);
      r.values = [
        nome,
        cat,
        qty,
        unidade,
        total,
        custoUn > 0 ? `R$ ${custoUn.toFixed(2)}`   : '',
        custoTot > 0 ? `R$ ${custoTot.toFixed(2)}` : '',
      ];
      r.height = 14;
      for (let col = 1; col <= 7; col++) {
        const c = ws.getCell(row, col);
        c.fill      = rowFill;
        c.font      = col === 1 ? { size: 9, bold: true } : { size: 9 };
        c.alignment = col > 2 ? { horizontal: 'right' } : { horizontal: 'left' };
        c.border    = hairBorder;
      }
      row++;

      // Cut sub-rows
      const cortes = item.cortes || [];
      cortes.forEach(c => {
        const metros = corteToMetros(c.tamanho, c.unidade);
        const cr = ws.getRow(row);
        cr.values = [
          `  → ${c.descricao || '(sem descrição)'}`,
          `${c.tamanho}${c.unidade} × ${c.quantidade}`,
          '',
          '',
          `${metros.toFixed(3)}m/corte`,
          '',
          '',
        ];
        cr.height = 12;
        for (let col = 1; col <= 7; col++) {
          const cell = ws.getCell(row, col);
          cell.fill      = fill(COLORS.cutsRow);
          cell.font      = { size: 8, italic: true, color: { argb: 'FF92400E' } };
          cell.alignment = col > 2 ? { horizontal: 'right' } : { horizontal: 'left', indent: 1 };
          cell.border    = hairBorder;
        }
        row++;
      });
    });

    row++; // spacer after section
  };

  for (const secao of ['corte', 'aviamentos', 'acabamento', 'cliente', 'travetes']) {
    addSection(secao, (ficha.itens || []).filter(i => i.secao === secao));
  }

  // ── MOLDES ─────────────────────────────────────────────────────────────────
  const moldes = ficha.moldes || [];
  if (moldes.length > 0) {
    ws.mergeCells(`A${row}:G${row}`);
    const mhCell = ws.getCell(row, 1);
    mhCell.value     = `MOLDES  (${moldes.length} peça${moldes.length !== 1 ? 's' : ''})`;
    mhCell.fill      = fill(COLORS.moldes);
    mhCell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    mhCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    mhCell.border    = thinBorder;
    ws.getRow(row).height = 16;
    row++;

    const mthRow = ws.getRow(row);
    mthRow.values = ['Descrição', 'Nº', 'Quantidade', 'Cor', '', '', ''];
    mthRow.height = 14;
    for (let col = 1; col <= 4; col++) {
      const c = ws.getCell(row, col);
      c.fill   = fill(COLORS.tableHead);
      c.font   = { bold: true, size: 8 };
      c.border = thinBorder;
    }
    row++;

    moldes.forEach((m, idx) => {
      const r = ws.getRow(row);
      r.values = [m.descricao || '—', m.numero || '', m.quantidade || '', m.cor || '', '', '', ''];
      r.height = 14;
      for (let col = 1; col <= 4; col++) {
        const c = ws.getCell(row, col);
        c.fill   = fill(idx % 2 === 1 ? COLORS.altRow : COLORS.white);
        c.font   = { size: 9 };
        c.border = hairBorder;
      }
      row++;
    });

    row++;
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  ws.mergeCells(`A${row}:G${row}`);
  const footCell = ws.getCell(row, 1);
  footCell.value     = `${modelo.nome}  ·  ${new Date().toLocaleString('pt-BR')}  ·  v${versao}`;
  footCell.font      = { size: 8, color: { argb: 'FF94A3B8' } };
  footCell.alignment = { horizontal: 'center' };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── Filename helper ───────────────────────────────────────────────────────────
function buildFilename(modelo, versao) {
  const slug = [modelo.nome, modelo.codigo]
    .filter(Boolean)
    .join('_')
    .replace(/[^a-zA-Z0-9À-ÿ_\- ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return `Ficha_Tecnica_${slug}_V${versao}.xlsx`;
}

module.exports = { exportarFichaExcel, buildFilename };
