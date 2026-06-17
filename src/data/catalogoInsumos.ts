import type { GrupoPrincipal, UnidadeMedida } from '../types';

/**
 * Catálogo padrão de insumos usados na confecção de mochilas, pochetes,
 * carteiras, malas de mão e acessórios.
 *
 * Cada item define grupo, subcategoria e unidade — quantidade, estoque mínimo
 * e valor unitário entram zerados e são ajustados pelo usuário ao receber.
 * Os nomes seguem o padrão de escrita definido em padronizarNomeInsumo().
 */

export interface CatalogoItem {
  nome: string;
  grupo: GrupoPrincipal;
  subcategoria: string;
  unidade: UnidadeMedida;
}

/** Subcategorias adicionais necessárias para o catálogo (criadas se não existirem). */
export const SUBCATEGORIAS_CATALOGO: { grupo: GrupoPrincipal; nome: string }[] = [
  { grupo: 'aviamentos', nome: 'Gorgurão' },
  { grupo: 'aviamentos', nome: 'Borneon' },
  { grupo: 'tecidos',    nome: 'Cordura' },
  { grupo: 'tecidos',    nome: 'Tela' },
  { grupo: 'tecidos',    nome: 'Forro' },
  { grupo: 'linhas',     nome: 'Linha Poliéster' },
];

const A = 'aviamentos' as const;
const T = 'tecidos' as const;
const L = 'linhas' as const;
const R = 'reforcos' as const;
const E = 'embalagens' as const;

export const CATALOGO_INSUMOS: CatalogoItem[] = [
  // ── CURSORES ────────────────────────────────────────────────────────────────
  { nome: 'Cursor 3 comum',                          grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor 6 comum',                          grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor 6 importado',                      grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor 7 nylon',                          grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor 7 nylon invertido',               grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor 7 nylon invertido com puxador',   grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor 7 nylon invertido sem puxador',   grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor 7 nylon comum',                    grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },
  { nome: 'Cursor com puxador',                      grupo: A, subcategoria: 'Cursor', unidade: 'unidade' },

  // ── ZÍPER ───────────────────────────────────────────────────────────────────
  { nome: 'Zíper 3 comum',           grupo: A, subcategoria: 'Zíper', unidade: 'metro' },
  { nome: 'Zíper 6 comum',           grupo: A, subcategoria: 'Zíper', unidade: 'metro' },
  { nome: 'Zíper 6 importado',       grupo: A, subcategoria: 'Zíper', unidade: 'metro' },
  { nome: 'Zíper 7 nylon',           grupo: A, subcategoria: 'Zíper', unidade: 'metro' },
  { nome: 'Zíper 7 nylon por metro', grupo: A, subcategoria: 'Zíper', unidade: 'metro' },
  { nome: 'Zíper nylon comum',       grupo: A, subcategoria: 'Zíper', unidade: 'metro' },
  { nome: 'Terminal de zíper',       grupo: A, subcategoria: 'Zíper', unidade: 'unidade' },
  { nome: 'Terminal de zíper bolso', grupo: A, subcategoria: 'Zíper', unidade: 'unidade' },
  { nome: 'Vista de zíper',          grupo: A, subcategoria: 'Zíper', unidade: 'unidade' },

  // ── FITAS ───────────────────────────────────────────────────────────────────
  { nome: 'Fita CA',                          grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita CA 25',                       grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita CA 35',                       grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita GCE',                         grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita GCE 20 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita GCE 25 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita GCE 30 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita GCE 40 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita CDD',                         grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita CDD 10 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita CDD 15 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita CDD 25 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita 10 mm',                       grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita 10 mm ondulada',              grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita 25 personalizada cliente',    grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita SC 25',                       grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita SC 30',                       grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita R&M 40',                      grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita N&M 15 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita BNR 40 mm',                   grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita cinto de segurança 25 mm',    grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita ondulada 10 mm',              grupo: A, subcategoria: 'Fita', unidade: 'metro' },
  { nome: 'Fita elástica',                    grupo: A, subcategoria: 'Fita', unidade: 'metro' },

  // ── FITAS DE ACABAMENTO (GORGURÃO) ──────────────────────────────────────────
  { nome: 'Gorgurão acabamento 20 comum',  grupo: A, subcategoria: 'Gorgurão', unidade: 'metro' },
  { nome: 'Gorgurão acabamento 22 comum',  grupo: A, subcategoria: 'Gorgurão', unidade: 'metro' },
  { nome: 'Gorgurão acabamento 22 Adina',  grupo: A, subcategoria: 'Gorgurão', unidade: 'metro' },
  { nome: 'Gorgurão acabamento 25 comum',  grupo: A, subcategoria: 'Gorgurão', unidade: 'metro' },
  { nome: 'Gorgurão Adina 22',             grupo: A, subcategoria: 'Gorgurão', unidade: 'metro' },
  { nome: 'Gorgurão comum',                grupo: A, subcategoria: 'Gorgurão', unidade: 'metro' },

  // ── BORNEON ─────────────────────────────────────────────────────────────────
  { nome: 'Borneon 16 mm comum', grupo: A, subcategoria: 'Borneon', unidade: 'metro' },
  { nome: 'Borneon 22 mm comum', grupo: A, subcategoria: 'Borneon', unidade: 'metro' },
  { nome: 'Borneon 22 Adina',    grupo: A, subcategoria: 'Borneon', unidade: 'metro' },
  { nome: 'Borneon 25 comum',    grupo: A, subcategoria: 'Borneon', unidade: 'metro' },
  { nome: 'Borneon 25 Adina',    grupo: A, subcategoria: 'Borneon', unidade: 'metro' },
  { nome: 'Borneon Adina',       grupo: A, subcategoria: 'Borneon', unidade: 'metro' },

  // ── REGULADORES ─────────────────────────────────────────────────────────────
  { nome: 'Regulador 25 mm',                     grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador 30 mm',                     grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador 38 mm',                     grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador 40 mm',                     grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador PT-1236/30 Kamishigue',     grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador PT-1235/40 Kamishigue',     grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador 6158-080 20 mm Piter Pan',  grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador Kamishigue Poliacetal',     grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },
  { nome: 'Regulador Adina Poliacetal',          grupo: A, subcategoria: 'Regulador', unidade: 'unidade' },

  // ── PASSADORES ──────────────────────────────────────────────────────────────
  { nome: 'Passante 40 mm Piter Pan', grupo: A, subcategoria: 'Passador', unidade: 'unidade' },
  { nome: 'Passador plástico',        grupo: A, subcategoria: 'Passador', unidade: 'unidade' },
  { nome: 'Passador de fita',         grupo: A, subcategoria: 'Passador', unidade: 'unidade' },

  // ── MOSQUETÕES ──────────────────────────────────────────────────────────────
  { nome: 'Mosquetão 25 mm Piter Pan',   grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Mosquetão 30 mm Piter Pan',   grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Mosquetão 40 mm Kamishigue',  grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Mosquetão 0106-025 Piter Pan',grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Mosquetão 1227/40 Kamishigue',grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Mosquetão 2430/30 Piter Pan', grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Mosquetinho 7320',            grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Mosquetinho Kamishigue',      grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },

  // ── ARGOLAS ─────────────────────────────────────────────────────────────────
  { nome: 'Meia argola pequena', grupo: A, subcategoria: 'Argola', unidade: 'unidade' },
  { nome: 'Meia argola 25',      grupo: A, subcategoria: 'Argola', unidade: 'unidade' },
  { nome: 'Argola de fita',      grupo: A, subcategoria: 'Argola', unidade: 'unidade' },

  // ── VELCRO ──────────────────────────────────────────────────────────────────
  { nome: 'Velcro 15 mm',        grupo: A, subcategoria: 'Velcro', unidade: 'metro' },
  { nome: 'Velcro 25 mm',        grupo: A, subcategoria: 'Velcro', unidade: 'metro' },
  { nome: 'Velcro 30 mm',        grupo: A, subcategoria: 'Velcro', unidade: 'metro' },
  { nome: 'Velcro tampa',        grupo: A, subcategoria: 'Velcro', unidade: 'metro' },
  { nome: 'Velcro bolso interno',grupo: A, subcategoria: 'Velcro', unidade: 'metro' },

  // ── ELÁSTICOS ───────────────────────────────────────────────────────────────
  { nome: 'Elástico 5 mm',          grupo: A, subcategoria: 'Elástico', unidade: 'metro' },
  { nome: 'Elástico 10 mm',         grupo: A, subcategoria: 'Elástico', unidade: 'metro' },
  { nome: 'Elástico fita frente',   grupo: A, subcategoria: 'Elástico', unidade: 'metro' },
  { nome: 'Elástico fita',          grupo: A, subcategoria: 'Elástico', unidade: 'metro' },
  { nome: 'Elástico roliço',        grupo: A, subcategoria: 'Elástico', unidade: 'metro' },
  { nome: 'Elástico de acabamento', grupo: A, subcategoria: 'Elástico', unidade: 'metro' },

  // ── PUXADORES ───────────────────────────────────────────────────────────────
  { nome: 'Puxador comum',        grupo: A, subcategoria: 'Puxador', unidade: 'unidade' },
  { nome: 'Puxador cursor',       grupo: A, subcategoria: 'Puxador', unidade: 'unidade' },
  { nome: 'Puxador personalizado',grupo: A, subcategoria: 'Puxador', unidade: 'unidade' },
  { nome: 'Puxador marca cliente',grupo: A, subcategoria: 'Puxador', unidade: 'unidade' },
  { nome: 'Puxador borracha',     grupo: A, subcategoria: 'Puxador', unidade: 'unidade' },
  { nome: 'Puxador Thug Nine',    grupo: A, subcategoria: 'Puxador', unidade: 'unidade' },

  // ── ETIQUETAS ───────────────────────────────────────────────────────────────
  { nome: 'Etiqueta composição',          grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta composição LS',       grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta composição cliente',  grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta interna',             grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta interna retangular',  grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta interna marca',       grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta bandeira',            grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta externa',             grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta externa emborrachada',grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Etiqueta borracha',            grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Tag Cordura',                  grupo: A, subcategoria: 'Etiqueta', unidade: 'unidade' },
  { nome: 'Patch marca',                  grupo: A, subcategoria: 'Patch',    unidade: 'unidade' },

  // ── LINHAS ──────────────────────────────────────────────────────────────────
  { nome: 'Linha 40',        grupo: L, subcategoria: 'Linha 40',        unidade: 'rolo' },
  { nome: 'Linha 60',        grupo: L, subcategoria: 'Linha 60',        unidade: 'rolo' },
  { nome: 'Linha nylon',     grupo: L, subcategoria: 'Linha Nylon',     unidade: 'rolo' },
  { nome: 'Linha poliéster', grupo: L, subcategoria: 'Linha Poliéster', unidade: 'rolo' },

  // ── TECIDOS — NYLON ─────────────────────────────────────────────────────────
  { nome: 'Nylon',                 grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon 70',              grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon 70/180 Ripstop',  grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon 1200',            grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon 1680',            grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon 210 resinado',    grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon 420',             grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon 600',             grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon Nike',            grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon Pipa Ripstop',    grupo: T, subcategoria: 'Nylon', unidade: 'metro' },
  { nome: 'Nylon Aerof Poliamida', grupo: T, subcategoria: 'Nylon', unidade: 'metro' },

  // ── TECIDOS — RIPSTOP ───────────────────────────────────────────────────────
  { nome: 'Ripstop',               grupo: T, subcategoria: 'Ripstop', unidade: 'metro' },
  { nome: 'Ripstop 660',           grupo: T, subcategoria: 'Ripstop', unidade: 'metro' },
  { nome: 'Poliester 660 Ripstop', grupo: T, subcategoria: 'Ripstop', unidade: 'metro' },
  { nome: 'Monte Carlo Ripstop',   grupo: T, subcategoria: 'Ripstop', unidade: 'metro' },
  { nome: 'Monte Carlo Ripstop PU',grupo: T, subcategoria: 'Ripstop', unidade: 'metro' },
  { nome: 'Emborrachado Ripstop',  grupo: T, subcategoria: 'Ripstop', unidade: 'metro' },

  // ── TECIDOS — CORDURA ───────────────────────────────────────────────────────
  { nome: 'Cordura Oyapoque', grupo: T, subcategoria: 'Cordura', unidade: 'metro' },
  { nome: 'Cordura',          grupo: T, subcategoria: 'Cordura', unidade: 'metro' },

  // ── TECIDOS — OXFORD ────────────────────────────────────────────────────────
  { nome: 'Oxford',     grupo: T, subcategoria: 'Oxford', unidade: 'metro' },
  { nome: 'Oxford PVC', grupo: T, subcategoria: 'Oxford', unidade: 'metro' },

  // ── TECIDOS — TELAS ─────────────────────────────────────────────────────────
  { nome: 'Tela confecção',              grupo: T, subcategoria: 'Tela', unidade: 'metro' },
  { nome: 'Tela confecção furo pequeno', grupo: T, subcategoria: 'Tela', unidade: 'metro' },
  { nome: 'Tela Falcon',                 grupo: T, subcategoria: 'Tela', unidade: 'metro' },
  { nome: 'Tela bolso interno',          grupo: T, subcategoria: 'Tela', unidade: 'metro' },
  { nome: 'Tela aerada',                 grupo: T, subcategoria: 'Tela', unidade: 'metro' },

  // ── TECIDOS — FORROS ────────────────────────────────────────────────────────
  { nome: 'Forro para matelassê',       grupo: T, subcategoria: 'Forro', unidade: 'metro' },
  { nome: 'Forro nylon',                grupo: T, subcategoria: 'Forro', unidade: 'metro' },
  { nome: 'Forro estoque suporte espuma',grupo: T, subcategoria: 'Forro', unidade: 'metro' },

  // ── ESPUMAS E REFORÇOS ──────────────────────────────────────────────────────
  { nome: 'Espuma PAC 04',         grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma PAC 05',         grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma PAC 06',         grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma 4 mm',           grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma 5 mm',           grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma 6 mm',           grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma costas',         grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma frente',         grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma tampa',          grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma fundo',          grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma corpo',          grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Espuma fole',           grupo: R, subcategoria: 'Espuma', unidade: 'metro' },
  { nome: 'Reforço bordado duro',  grupo: R, subcategoria: 'Outros', unidade: 'metro' },

  // ── EMBALAGEM ───────────────────────────────────────────────────────────────
  { nome: 'Embalagem plástica 40x60', grupo: E, subcategoria: 'Plástico', unidade: 'unidade' },
  { nome: 'Caixa papelão',            grupo: E, subcategoria: 'Caixa',    unidade: 'unidade' },
  { nome: 'Fita gomada',              grupo: E, subcategoria: 'Outros',   unidade: 'rolo' },

  // ── OUTROS COMPONENTES ──────────────────────────────────────────────────────
  { nome: 'Botão pressão', grupo: A, subcategoria: 'Ferragens', unidade: 'unidade' },
  { nome: 'Fecho',         grupo: A, subcategoria: 'Fecho',     unidade: 'unidade' },
  { nome: 'Fecho plástico',grupo: A, subcategoria: 'Fecho',     unidade: 'unidade' },
  { nome: 'Fivela',        grupo: A, subcategoria: 'Fecho',     unidade: 'unidade' },
  { nome: 'Imã',           grupo: A, subcategoria: 'Ferragens', unidade: 'unidade' },
  { nome: 'Rebite',        grupo: A, subcategoria: 'Rebite',    unidade: 'unidade' },
  { nome: 'Ilhós',         grupo: A, subcategoria: 'Ferragens', unidade: 'unidade' },
  { nome: 'Alça de mão',   grupo: A, subcategoria: 'Alça',      unidade: 'unidade' },
  { nome: 'Alça de ombro', grupo: A, subcategoria: 'Alça',      unidade: 'unidade' },
  { nome: 'Alça costas',   grupo: A, subcategoria: 'Alça',      unidade: 'unidade' },

  // ── EXTRAS COMUNS (mochilas, pochetes, carteiras, malas de mão) ─────────────
  { nome: 'Cordão 4 mm',                 grupo: A, subcategoria: 'Cordão',    unidade: 'metro' },
  { nome: 'Cordão 6 mm',                 grupo: A, subcategoria: 'Cordão',    unidade: 'metro' },
  { nome: 'Ponteira de cordão',          grupo: A, subcategoria: 'Ponteira',  unidade: 'unidade' },
  { nome: 'Stopper regulador de cordão', grupo: A, subcategoria: 'Ponteira',  unidade: 'unidade' },
  { nome: 'Fivela engate rápido 25 mm',  grupo: A, subcategoria: 'Fecho',     unidade: 'unidade' },
  { nome: 'Fivela engate rápido 40 mm',  grupo: A, subcategoria: 'Fecho',     unidade: 'unidade' },
  { nome: 'Gancho giratório',            grupo: A, subcategoria: 'Mosquetão', unidade: 'unidade' },
  { nome: 'Argola D 25 mm',              grupo: A, subcategoria: 'Argola',    unidade: 'unidade' },
  { nome: 'Argola D 40 mm',              grupo: A, subcategoria: 'Argola',    unidade: 'unidade' },
  { nome: 'Argola O 40 mm',              grupo: A, subcategoria: 'Argola',    unidade: 'unidade' },
  { nome: 'Pé de mochila',               grupo: A, subcategoria: 'Ferragens', unidade: 'unidade' },
  { nome: 'Botão imã',                   grupo: A, subcategoria: 'Ferragens', unidade: 'unidade' },
  { nome: 'Zíper 5 nylon',               grupo: A, subcategoria: 'Zíper',     unidade: 'metro' },
  { nome: 'Lona encerada',               grupo: T, subcategoria: 'Lona',      unidade: 'metro' },
  { nome: 'Couro sintético PU',          grupo: T, subcategoria: 'Couro Sintético', unidade: 'metro' },
  { nome: 'Napa',                        grupo: T, subcategoria: 'Couro Sintético', unidade: 'metro' },
  { nome: 'Courino',                     grupo: T, subcategoria: 'Couro Sintético', unidade: 'metro' },
  { nome: 'Entretela',                   grupo: R, subcategoria: 'Entretela', unidade: 'metro' },
  { nome: 'Manta acrílica',              grupo: R, subcategoria: 'Espuma',    unidade: 'metro' },
  { nome: 'Papelão estrutural',          grupo: R, subcategoria: 'Plástico Rígido', unidade: 'unidade' },
  { nome: 'Saco plástico',               grupo: E, subcategoria: 'Plástico',  unidade: 'unidade' },
];
