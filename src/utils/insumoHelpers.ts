import type { Insumo, CategoriaInsumo, GrupoPrincipal } from '../types';

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
