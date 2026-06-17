/**
 * Template-based Excel export for Fichas Técnicas.
 *
 * Strategy:
 *   1. Read ficha_tecnica_modelo.xlsx — preserves ALL formatting, merges, logos, borders.
 *   2. Write ONLY to data cells (name/qty/variant columns).
 *      Formula cells (TOTAL 1/2, cross-section references) are NEVER touched —
 *      Excel recalculates them on open.
 *   3. Sections 2–6 headers are formula references to Section 1 cells — auto-update.
 *
 * Template layout (1-indexed, A=1 … L=12):
 *
 *  SEC 1 – FICHA PRODUÇÃO CORTE        rows   4 –  84
 *    Header                            rows   6 –  14
 *    Tecidos (doubled rows 16+17…)     rows  16 –  39   (12 slots)
 *    Moldes / Gabaritos count          row   81
 *
 *  SEC 2 – FICHA PRODUÇÃO AVIAMENTO   rows  85 – 164
 *    Header (all formulas → sec 1)    rows  87 –  92
 *    AVIAMENTOS 1                      rows  94 – 127   (34 slots)
 *    ACABAMENTO                        rows 129 – 138   (10 slots)
 *    AVIAMENTOS CLIENTE                rows 140 – 144   (5 slots)
 *    TRAVETES                          rows 146 – 161   (16 slots)
 *
 *  SEC 3 – FICHA PRODUÇÃO MODELAGEM   rows 165 – 244
 *    Header + tecidos (formulas)       rows 167 – 182
 *    Moldes data                       rows 204 – 241   (38 slots)
 *
 *  SEC 4 – FICHA CONTROLE QUALIDADE   rows 245 – 266
 *    Header (formulas → sec 1)        rows 247 – 249
 *    Oficina / Fone                    row  250
 *    Custo / Qtd (independent)         row  252
 *
 *  SEC 5 – FICHA PRODUÇÃO CORTE copy  rows 267 – 294
 *    Header + custo (formulas)
 *    Qtd col F (hardcoded in template) row  274  col F
 *
 *  SEC 6 – ROMANEIO PRODUÇÃO          rows 295 – 320
 *    Header + custo (formulas)
 *    Oficina / Fone                    row  300
 *    Envio / Retirada / Qtd            row  306
 *    Descontos / Total                 rows 308, 310
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// ── Template resolution ────────────────────────────────────────────────────────
function getTemplatePath() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'templates', 'ficha_tecnica_modelo.xlsx'),
    path.join(__dirname, '..', 'dist',   'templates', 'ficha_tecnica_modelo.xlsx'),
    path.join(__dirname, '..', 'public', 'templates', 'ficha_tecnica_padrao.xlsx'),
    path.join(__dirname, '..', 'dist',   'templates', 'ficha_tecnica_padrao.xlsx'),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error(
    'Template não encontrado. Coloque ficha_tecnica_modelo.xlsx em public/templates/'
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const safe = (v) => (v == null ? '' : String(v).trim());

/** Parse a date string/value into a JS Date for proper Excel date serialisation. */
function toDate(v) {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Portuguese locale date string for display cells. */
function fmtDate(v) {
  const d = toDate(v);
  return d ? d.toLocaleDateString('pt-BR') : '';
}

/**
 * Write a cell value only if the cell does NOT currently hold a formula.
 * Preserved formula cells auto-recalculate in Excel.
 */
function setData(ws, row, col, value) {
  const cell = ws.getCell(row, col);
  const cv = cell.value;
  const hasFormula = cv && typeof cv === 'object' && (cv.formula || cv.sharedFormula);
  if (!hasFormula) {
    cell.value = value;
  }
}

/**
 * Write material item data into a consecutive-row table (one item per row).
 * Only touches cols A (name), B (qty), C (variant/colour).
 * Formula columns D/E/I are preserved.
 * Also clears unused slots within maxRows.
 */
function fillMaterialRows(ws, startRow, items, insumos, maxRows) {
  for (let idx = 0; idx < maxRows; idx++) {
    const row = startRow + idx;
    if (idx < items.length) {
      const item = items[idx];
      const ins = insumos.find(i => i.id === item.insumoId);
      if (ins) {
        setData(ws, row, 1, ins.nome);
        setData(ws, row, 2, item.quantidade);
        setData(ws, row, 3, ins.subcategoria || ins.categoria || '');
      }
    } else {
      setData(ws, row, 1, '');
      setData(ws, row, 2, 0);
      setData(ws, row, 3, '');
    }
  }
}

/**
 * Write tecido items into the Section 1 doubled-row table.
 * Each visual slot occupies TWO physical rows (e.g. 16+17, 18+19 …).
 * We write to both rows; formula cols D/E/I are preserved.
 * Col G (variant-2 qty) and H (variant-2 cor) are cleared on each slot.
 */
function fillTecidoRows(ws, startRow, items, insumos, maxItems) {
  for (let idx = 0; idx < maxItems; idx++) {
    const rowA = startRow + idx * 2;       // e.g. 16, 18, 20…
    const rowB = rowA + 1;                 // e.g. 17, 19, 21…

    if (idx < items.length) {
      const item = items[idx];
      const ins = insumos.find(i => i.id === item.insumoId);
      if (ins) {
        [rowA, rowB].forEach(r => {
          setData(ws, r, 1, ins.nome);
          setData(ws, r, 2, item.quantidade);
          setData(ws, r, 3, ins.subcategoria || ins.categoria || '');
          // Clear variant-2 fields so old template data doesn't bleed through
          setData(ws, r, 7, 0);    // G = variante 2 qty
          setData(ws, r, 8, '');   // H = variante 2 cor
        });
      }
    } else {
      [rowA, rowB].forEach(r => {
        setData(ws, r, 1, '');
        setData(ws, r, 2, 0);
        setData(ws, r, 3, '');
        setData(ws, r, 7, 0);
        setData(ws, r, 8, '');
      });
    }
  }
}

// ── Main export ────────────────────────────────────────────────────────────────
/**
 * @param {object} data
 * @param {import('../src/types').FichaTecnica} data.ficha
 * @param {import('../src/types').Modelo}       data.modelo
 * @param {import('../src/types').Insumo[]}     data.insumos
 * @param {number}                              data.versao
 * @returns {Promise<Buffer>}
 */
async function exportarFichaExcel({ ficha, modelo, insumos = [], versao = 1 }) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(getTemplatePath());
  const ws = wb.worksheets[0];

  const cab = ficha.cabecalho || {};
  const qtdFicha  = Number(cab.quantidadeFicha)    || 1;
  const custoUnid = Number(cab.custoConfeccaoUnid)  || 0;
  const rom       = ficha.romaneio || {};

  // Item partitions
  const tecidos    = (ficha.itens || []).filter(i => i.secao === 'corte');
  const avi1       = (ficha.itens || []).filter(i => i.secao === 'aviamentos');
  const acabamento = (ficha.itens || []).filter(i => i.secao === 'acabamento');
  const aviCli     = (ficha.itens || []).filter(i => i.secao === 'cliente');
  const travetes   = (ficha.itens || []).filter(i => i.secao === 'travetes');
  const moldes     = ficha.moldes || [];

  // ── SECTION 1 HEADER ────────────────────────────────────────────────────────
  // Rows 2-6 of visible sections; all other sections ref these via formulas.

  // Row 6 — Cliente / Representante / Pedido / QTD Mostruário
  ws.getCell(6, 1).value  = `CLIENTE: ${safe(cab.cliente)}`;
  ws.getCell(6, 2).value  = `REPRESENTANTE: ${safe(cab.representante)}`;
  ws.getCell(6, 7).value  = `PEDIDO: ${safe(cab.pedido)}`;
  ws.getCell(6, 10).value = `QTD. MOSTR. ${cab.qtdMostruario || 0}`;

  // Row 7 — Refs / Coleção
  ws.getCell(7, 1).value  = `REF. CLIENTE: ${safe(cab.refCliente)}`;
  ws.getCell(7, 2).value  = `REF. SAC LS  -  ${safe(cab.refMatriz)}`;
  ws.getCell(7, 7).value  = `COLECAO : ${safe(cab.colecao)}`;
  ws.getCell(7, 10).value = cab.qtdMostruario || 0;

  // Row 8 — Ref + Modelo
  ws.getCell(8, 1).value  = `REF: ${safe(cab.refCliente)}  ${safe(modelo.nome)}`;
  ws.getCell(8, 2).value  = `MODELO: ${safe(modelo.nome)}`;

  // Row 9 — Custo / Qtd Ficha   (J9 has formula SUM(C9*F9) → preserved)
  ws.getCell(9, 3).value  = custoUnid;   // C9
  ws.getCell(9, 6).value  = qtdFicha;   // F9

  // Row 10 — Datas
  ws.getCell(10, 2).value  = fmtDate(cab.dataPedido);
  ws.getCell(10, 10).value = fmtDate(cab.dataEntrega);

  // Row 12 — Produção window
  ws.getCell(12, 2).value  = fmtDate(cab.inicioProducao);
  ws.getCell(12, 10).value = fmtDate(cab.terminoProducao);

  // Row 14 — Quantidade Ficha  (C14 is the anchor for all tecido formulas)
  ws.getCell(14, 3).value = qtdFicha;   // C14
  ws.getCell(14, 8).value = 0;          // H14 — variant 2 qty (zero = single variant)

  // Tecidos  (12 slots, rows 16–38, doubled rows)
  fillTecidoRows(ws, 16, tecidos, insumos, 12);

  // Row 81 — Moldes / Gabaritos counts
  setData(ws, 81, 2,  cab.qtdMoldesTotal || moldes.length || 0);
  setData(ws, 81, 10, cab.qtdGabaritos   || 0);

  // ── SECTION 2 MATERIALS (Aviamento sheet) ───────────────────────────────────
  // Header rows 87–92 are formula refs → DO NOT TOUCH
  fillMaterialRows(ws, 94,  avi1,       insumos, 34);
  fillMaterialRows(ws, 129, acabamento, insumos, 10);
  fillMaterialRows(ws, 140, aviCli,     insumos, 5);
  fillMaterialRows(ws, 146, travetes,   insumos, 16);

  // ── SECTION 3 MOLDES ─────────────────────────────────────────────────────────
  // Tecido rows 171–182 are formula refs to sec 1 → auto-update
  const maxMoldes = 38;
  for (let idx = 0; idx < maxMoldes; idx++) {
    const row = 204 + idx;
    if (idx < moldes.length) {
      const m = moldes[idx];
      setData(ws, row, 1, m.descricao || '');
      setData(ws, row, 2, m.numero    || '');
      setData(ws, row, 3, m.quantidade || '');
      setData(ws, row, 4, m.cor       || '');
    } else {
      setData(ws, row, 1, '');
      setData(ws, row, 2, '');
      setData(ws, row, 3, '');
      setData(ws, row, 4, '');
    }
  }

  // ── SECTION 4 CONTROLE QUALIDADE ─────────────────────────────────────────────
  // Header rows 247–249 are formula refs → DO NOT TOUCH
  // Oficina / Fone  (labels in A250/G250, values in adjacent cells)
  setData(ws, 250, 2, safe(cab.oficina));
  setData(ws, 250, 9, safe(cab.telefone));
  // Independent custo/qtd (not a formula ref to sec 1)
  setData(ws, 252, 3, custoUnid);   // C252
  setData(ws, 252, 6, qtdFicha);   // F252 — J252 has formula C252*F252

  // ── SECTION 5 FICHA CORTE copy ───────────────────────────────────────────────
  // Header + custo are formula refs to sec 1 / sec 4
  // F274 is hardcoded in template → update with qtdFicha
  setData(ws, 274, 6, qtdFicha);

  // ── SECTION 6 ROMANEIO ──────────────────────────────────────────────────────
  // Header + custo are formula refs → DO NOT TOUCH
  setData(ws, 300, 2, safe(rom.oficina  || cab.oficina));
  setData(ws, 300, 9, safe(rom.telefone || cab.telefone));
  // Envio / Retirada / Quantidade (values go in row 306, below merged label row 304)
  setData(ws, 306, 2,  fmtDate(rom.dataEnvio));
  setData(ws, 306, 4,  fmtDate(rom.dataRetirada));
  setData(ws, 306, 10, rom.qtdEnviada || qtdFicha);
  // Descontos (K308) / Total (K310)
  setData(ws, 308, 11, rom.desconto   || 0);
  setData(ws, 310, 11, rom.totalFicha || +(custoUnid * qtdFicha).toFixed(2));

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── Filename helper ────────────────────────────────────────────────────────────
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
