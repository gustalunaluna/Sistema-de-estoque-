import type { Insumo, CategoriaInsumo, GrupoPrincipal, CorteItem, UnidadeCorte } from '../types';

export const GRUPO_LABELS: Record<GrupoPrincipal, string> = {
  aviamentos: 'Aviamentos',
  tecidos: 'Tecidos',
  linhas: 'Linhas',
  reforcos: 'Materiais de Reforço',
  embalagens: 'Embalagens',
  outros: 'Outros Materiais',
};

const CATEGORIA_PARA_GRUPO: Record<CategoriaInsumo, GrupoPrincipal> = {
  cursores: 'aviamentos',
  zipes: 'aviamentos',
  fivelas: 'aviamentos',
  tecidos: 'tecidos',
  linhas: 'linhas',
  etiquetas: 'aviamentos',
  embalagens: 'embalagens',
  acessorios: 'aviamentos',
  outros: 'outros',
};

const CATEGORIA_PARA_SUBCATEGORIA: Record<CategoriaInsumo, string> = {
  cursores: 'Cursor',
  zipes: 'Zíper',
  fivelas: 'Fecho',
  tecidos: 'Outros',
  linhas: 'Linha 40',
  etiquetas: 'Etiqueta',
  embalagens: 'Embalagem',
  acessorios: 'Ferragens',
  outros: 'Outros',
};

export function getGrupoInsumo(i: Insumo): GrupoPrincipal {
  if (i.grupo) return i.grupo;
  return CATEGORIA_PARA_GRUPO[i.categoria] ?? 'outros';
}

export function getSubcategoriaInsumo(i: Insumo): string {
  if (i.subcategoria) return i.subcategoria;
  return CATEGORIA_PARA_SUBCATEGORIA[i.categoria] ?? 'Outros';
}

export function suportaCortes(insumo: Insumo): boolean {
  return insumo.unidade === 'metro';
}

export function corteToMetros(tamanho: number, unidade: UnidadeCorte): number {
  switch (unidade) {
    case 'm': return tamanho;
    case 'cm': return tamanho * 0.01;
    case 'mm': return tamanho * 0.001;
  }
}

export function calcularConsumoCortes(cortes: CorteItem[]): number {
  return cortes.reduce((sum, c) => sum + corteToMetros(c.tamanho, c.unidade) * c.quantidade, 0);
}

/**
 * Padroniza o nome de um insumo para manter um padrão de escrita consistente
 * sempre que itens são adicionados ao estoque:
 *  - remove espaços duplicados e nas pontas
 *  - garante um único espaço antes de unidades de medida (mm, cm, kg) em minúsculo
 *  - mantém siglas/marcas intactas (GCE, PVC, LS, Adina, Kamishigue…)
 *  - inicia com letra maiúscula
 */
export function padronizarNomeInsumo(nome: string): string {
  let s = (nome ?? '').trim().replace(/\s+/g, ' ');
  s = s.replace(/(\d)\s*(mm|cm|kg)\b/gi, (_m, d, u) => `${d} ${u.toLowerCase()}`);
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
