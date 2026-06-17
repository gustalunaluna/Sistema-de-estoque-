/**
 * Template-based Excel export for Fichas Técnicas.
 * Reads ficha_tecnica_padrao.xlsx, fills in data at specific cell addresses,
 * and returns the buffer — preserving all formatting, borders, merges and logo.
 *
 * Template structure (1-indexed rows, 1-indexed cols A=1 … L=12):
 *  Section 1 – FICHA PRODUÇÃO CORTE      (rows   4 –  82)
 *  Section 2 – FICHA PRODUÇÃO AVIAMENTO  (rows  85 – 162)
 *  Section 3 – FICHA PRODUÇÃO MODELAGEM  (rows 165 – 242)
 *  Section 4 – FICHA CONTROLE QUALIDADE  (rows 245 – 266)
 *  Section 5 – FICHA PRODUÇÃO CORTE (copy for romaneio, rows 267-294)
 *  Section 6 – ROMANEIO PRODUÇÃO         (rows 295 – 312)
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Resolve template path: public/ (dev) or dist/ (prod)
function getTemplatePath() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'templates', 'ficha_tecnica_padrao.xlsx'),
    path.join(__dirname, '..', 'dist', 'templates', 'ficha_tecnica_padrao.xlsx'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Template não encontrado. Verifique public/templates/ficha_tecnica_padrao.xlsx');
}

function fmtDate(s) {
  if (!s) return '';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('pt-BR');
  } catch (_) { return s; }
}

function safe(v) { return v ?? ''; }

/**
 * Fill the repeating header block that appears in each section.
 * @param {ExcelJS.Worksheet} ws
 * @param {number} r - 1-indexed row of the CLIENTE line in this section
 * @param {object} cab - cabecalho data
 * @param {object} modelo - modelo data
 */
function fillHeader(ws, r, cab, modelo) {
  // Row r: CLIENTE / REPRESENTANTE / PEDIDO
  ws.getCell(r, 1).value = `CLIENTE: ${safe(cab.cliente)}`;
  ws.getCell(r, 2).value = `REPRESENTANTE: ${safe(cab.representante)}`;
  ws.getCell(r, 7).value = `PEDIDO: ${safe(cab.pedido)}`;

  // Row r+1: REF CLIENTE / REF MATRIZ / COLECAO / qtdMostruario
  ws.getCell(r + 1, 1).value = `REF. CLIENTE: ${safe(cab.refCliente)}`;
  ws.getCell(r + 1, 2).value = `REF. SAC LS  -  ${safe(cab.refMatriz)}`;
  ws.getCell(r + 1, 7).value = `COLECAO : ${safe(cab.colecao)}`;
  ws.getCell(r + 1, 10).value = cab.qtdMostruario || 0;

  // Row r+2: REF full / MODELO
  ws.getCell(r + 2, 1).value = `REF: ${safe(cab.refCliente)} — ${safe(modelo.nome)}`;
  ws.getCell(r + 2, 2).value = `MODELO: ${safe(modelo.nome)}`;
}

/**
 * Write a list of material items into consecutive rows starting at startRow.
 * Columns: A=nome, B=qtd/unid, C=variante, D=total (qty*qtdFicha)
 */
function fillMaterialRows(ws, startRow, items, insumos, qtdFicha, maxRows) {
  for (let idx = 0; idx < Math.min(items.length, maxRows); idx++) {
    const item = items[idx];
    const insumo = insumos.find(i => i.id === item.insumoId);
    if (!insumo) continue;
    const row = startRow + idx;
    const total = +(item.quantidade * qtdFicha).toFixed(4);
    ws.getCell(row, 1).value = insumo.nome;
    ws.getCell(row, 2).value = item.quantidade;
    ws.getCell(row, 3).value = insumo.subcategoria || '';
    ws.getCell(row, 4).value = total;
    // Clear TOTAL 2 column (col 9) if it had a formula placeholder
    ws.getCell(row, 9).value = 0;
  }
  // Clear remaining pre-formatted rows
  for (let idx = items.length; idx < maxRows; idx++) {
    const row = startRow + idx;
    ws.getCell(row, 1).value = '';
    ws.getCell(row, 2).value = '';
    ws.getCell(row, 3).value = '';
    ws.getCell(row, 4).value = '';
  }
}

/**
 * Fill tecido items in DIVISÃO TECIDOS (alternating rows: 16, 18, 20 …)
 */
function fillTecidoRows(ws, startRow, items, insumos, qtdFicha, maxItems) {
  for (let idx = 0; idx < Math.min(items.length, maxItems); idx++) {
    const item = items[idx];
    const insumo = insumos.find(i => i.id === item.insumoId);
    if (!insumo) continue;
    const row = startRow + idx * 2;
    const total = +(item.quantidade * qtdFicha).toFixed(4);
    ws.getCell(row, 1).value = insumo.nome;
    ws.getCell(row, 2).value = item.quantidade;
    ws.getCell(row, 3).value = insumo.subcategoria || '';
    ws.getCell(row, 4).value = total;
    ws.getCell(row, 9).value = 0;
  }
  // Clear remaining slots
  for (let idx = items.length; idx < maxItems; idx++) {
    const row = startRow + idx * 2;
    ws.getCell(row, 1).value = '';
    ws.getCell(row, 2).value = '';
    ws.getCell(row, 3).value = '';
    ws.getCell(row, 4).value = '';
  }
}

/**
 * Main export function.
 * @param {object} data
 * @param {object} data.ficha       - FichaTecnica object
 * @param {object} data.modelo      - Modelo object
 * @param {Array}  data.insumos     - All insumos in store
 * @param {number} data.versao      - Version number to stamp
 * @returns {Promise<Buffer>}
 */
async function exportarFichaExcel({ ficha, modelo, insumos, versao = 1 }) {
  const templatePath = getTemplatePath();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const cab = ficha.cabecalho || {};
  const qtdFicha = cab.quantidadeFicha || 1;
  const custoUnid = cab.custoConfeccaoUnid || 0;
  const valorTotal = +(custoUnid * qtdFicha).toFixed(2);

  // Separate items by section
  const tecidos    = ficha.itens.filter(i => i.secao === 'corte');
  const avi1       = ficha.itens.filter(i => i.secao === 'aviamentos');
  const acabamento = ficha.itens.filter(i => i.secao === 'acabamento');
  const aviCli     = ficha.itens.filter(i => i.secao === 'cliente');
  const travetes   = ficha.itens.filter(i => i.secao === 'travetes');
  const moldes     = ficha.moldes || [];

  // ── SECTION 1: FICHA PRODUÇÃO CORTE (header at row 6) ───────────────────────
  fillHeader(ws, 6, cab, modelo);
  ws.getCell(9, 3).value = custoUnid;
  ws.getCell(9, 6).value = qtdFicha;
  ws.getCell(9, 10).value = valorTotal;
  ws.getCell(10, 2).value = fmtDate(cab.dataPedido);
  ws.getCell(10, 10).value = fmtDate(cab.dataEntrega);
  ws.getCell(12, 2).value = fmtDate(cab.inicioProducao);
  ws.getCell(12, 10).value = fmtDate(cab.terminoProducao);
  ws.getCell(14, 3).value = qtdFicha;

  // Tecidos: rows 16, 18, 20, … 38 (12 slots)
  fillTecidoRows(ws, 16, tecidos, insumos, qtdFicha, 12);

  // ── SECTION 2: FICHA PRODUÇÃO AVIAMENTO (header at row 87) ──────────────────
  fillHeader(ws, 87, cab, modelo);
  ws.getCell(90, 2).value = fmtDate(cab.dataPedido);
  ws.getCell(90, 10).value = fmtDate(cab.dataEntrega);
  ws.getCell(92, 3).value = qtdFicha;

  // AVIAMENTOS 1: rows 94–127 (34 slots)
  fillMaterialRows(ws, 94, avi1, insumos, qtdFicha, 34);

  // ACABAMENTO: rows 129–138 (10 slots)
  fillMaterialRows(ws, 129, acabamento, insumos, qtdFicha, 10);

  // AVIAMENTOS CLIENTE: rows 140–144 (5 slots)
  fillMaterialRows(ws, 140, aviCli, insumos, qtdFicha, 5);

  // TRAVETES: rows 146–161 (16 slots)
  fillMaterialRows(ws, 146, travetes, insumos, qtdFicha, 16);

  // ── SECTION 3: FICHA PRODUÇÃO MODELAGEM (header at row 167) ─────────────────
  fillHeader(ws, 167, cab, modelo);

  // Tecidos in modelagem: rows 171, 173, 175, 177, 179, 181 (6 slots, alternating)
  fillTecidoRows(ws, 171, tecidos, insumos, qtdFicha, 6);

  // Moldes (left column only): rows 204–241 (38 slots)
  // Cols: A=desc, B=num, C=qty, D=cor
  const maxMoldes = Math.min(moldes.length, 38);
  for (let idx = 0; idx < maxMoldes; idx++) {
    const m = moldes[idx];
    const row = 204 + idx;
    ws.getCell(row, 1).value = m.descricao || '';
    ws.getCell(row, 2).value = m.numero || '';
    ws.getCell(row, 3).value = m.quantidade || '';
    ws.getCell(row, 4).value = m.cor || '';
  }

  // ── SECTION 4: FICHA CONTROLE QUALIDADE (header at row 247) ─────────────────
  fillHeader(ws, 247, cab, modelo);
  ws.getCell(252, 3).value = custoUnid;
  ws.getCell(252, 6).value = qtdFicha;
  ws.getCell(252, 10).value = valorTotal;

  // ── SECTION 5: Another CORTE copy (header at row 269) ───────────────────────
  fillHeader(ws, 269, cab, modelo);
  ws.getCell(274, 3).value = custoUnid;
  ws.getCell(274, 6).value = qtdFicha;
  ws.getCell(274, 10).value = valorTotal;

  // ── SECTION 6: ROMANEIO PRODUÇÃO (header at row 297) ────────────────────────
  fillHeader(ws, 297, cab, modelo);
  ws.getCell(302, 3).value = custoUnid;
  ws.getCell(302, 6).value = qtdFicha;
  ws.getCell(302, 10).value = valorTotal;

  // Stamp version number in a non-intrusive cell (bottom-right of first page)
  ws.getCell(82, 12).value = `v${versao}`;

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { exportarFichaExcel };
