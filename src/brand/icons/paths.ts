/**
 * Pictogrammes HOMI — famille unique (20/11/2026). Dessinés à la main sur une grille de 24, marge de 2 :
 *  - trait d'ENCRE 1,75, extrémités et jonctions arrondies, aucun angle vif (même rondeur que le symbole « M » et le
 *    mot « HOMI ») ;
 *  - DEUX TONS : `stroke` (le dessin, à l'encre) + `fill` (un aplat doux, de la couleur de la catégorie ou de
 *    l'accent, posé SOUS le trait : il donne la masse sans jamais porter seul le sens) ;
 *  - `dots` : points pleins (yeux, repères), à l'encre.
 * Aucune couleur ici : le composant `HomiIcon` les prend dans le thème (5 palettes, clair et sombre).
 * Remplace, pour la barre du bas, l'en-tête, le bouton central et les 9 catégories, le mélange Feather (trait fin) +
 * Material Community Icons (plein) + silhouettes de `ToolGlyph`. Les pictogrammes d'outils sont rangés par famille
 * dans src/brand/icons/tools/ (manifeste : src/brand/icons/manifest.ts).
 */
import type { HomiIconDef } from './geometry';
import { ALIMENTATION } from './tools/alimentation';
import { COMMUNAUTE } from './tools/communaute';
import { COMPTE } from './tools/compte';
import { COUPLE } from './tools/couple';
import { CYCLE } from './tools/cycle';
import { DOCUMENTS } from './tools/documents';
import { FOYER } from './tools/foyer';
import { GARDE } from './tools/garde';
import { GROSSESSE } from './tools/grossesse';
import { SANTE } from './tools/sante';
import { SOIN } from './tools/soin';
import { SOMMEIL } from './tools/sommeil';

export type { HomiIconDef };

const n = (v: number) => +v.toFixed(2);
const circle = (cx: number, cy: number, r: number) => `M${n(cx + r)} ${cy}a${r} ${r} 0 1 1-${n(r * 2)} 0 ${r} ${r} 0 0 1 ${n(r * 2)} 0z`;
const HEART = 'M12 19.8s-7.6-4.5-7.6-10.1A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7.6 2.6c0 5.6-7.6 10.1-7.6 10.1z';
const HOUSE = 'M4.25 10.6 12 4.25l7.75 6.35v8.15a1.75 1.75 0 0 1-1.75 1.75H6a1.75 1.75 0 0 1-1.75-1.75z';
const SHIELD = 'M12 3.5l7 2.6v5.3c0 4.5-2.9 7.8-7 9.1-4.1-1.3-7-4.6-7-9.1V6.1z';
const BOOK = 'M3.75 6.2c2.8-.95 5.55-.6 8.25 1.2v12c-2.7-1.8-5.45-2.15-8.25-1.2zM20.25 6.2c-2.8-.95-5.55-.6-8.25 1.2v12c2.7-1.8 5.45-2.15 8.25-1.2z';
const BOTTLE_BODY = 'M8.6 8.6h6.8v9.9a2.5 2.5 0 0 1-2.5 2.5h-1.8a2.5 2.5 0 0 1-2.5-2.5z';
const BUBBLE = 'M4 6.75A2.75 2.75 0 0 1 6.75 4h6.5A2.75 2.75 0 0 1 16 6.75v3.5A2.75 2.75 0 0 1 13.25 13H9.2l-3.4 2.9v-3A2.75 2.75 0 0 1 4 10.25z';
const BELL = 'M6.25 16.25V11a5.75 5.75 0 0 1 11.5 0v5.25l1.5 1.75H4.75z';
const DROP = 'M12 3.6s5.6 6.1 5.6 10.1a5.6 5.6 0 0 1-11.2 0c0-4 5.6-10.1 5.6-10.1z';
const MOON = 'M19.6 14.4A7.6 7.6 0 1 1 9.6 4.4a6.1 6.1 0 0 0 10 10z';
const NOTEBOOK = 'M7 3.75h9.5a2 2 0 0 1 2 2v12.5a2 2 0 0 1-2 2H7z';

const BASE_ICONS = {
  // ---------------------------------------------------------------- barre du bas
  /** Aujourd'hui : un soleil (le jour en cours). */
  today: { fill: circle(12, 12, 4.4), stroke: `${circle(12, 12, 4.4)}M12 3v1.6M12 19.4V21M3 12h1.6M19.4 12H21M5.65 5.65l1.1 1.1M17.25 17.25l1.1 1.1M5.65 18.35l1.1-1.1M17.25 6.75l1.1-1.1` },
  /** Moi : une personne. */
  me: { fill: `${circle(12, 8.2, 3.45)}M5.25 19.75c.85-3.55 3.55-5.6 6.75-5.6s5.9 2.05 6.75 5.6z`, stroke: `${circle(12, 8.2, 3.45)}M5.25 19.75c.85-3.55 3.55-5.6 6.75-5.6s5.9 2.05 6.75 5.6` },
  /** Enfant : un visage de bébé, sa mèche. */
  child: { fill: circle(12, 12.75, 7.75), stroke: `${circle(12, 12.75, 7.75)}M12.6 5.05c-.95-.85-.75-2.3.5-2.55M9.4 15.6c1.45 1.25 3.75 1.25 5.2 0`, dots: [[9.1, 12, 1.05], [14.9, 12, 1.05]] },
  /** Famille : la maison et un cœur. */
  family: { fill: HOUSE, stroke: `${HOUSE}M12 17.4s-3.1-1.85-3.1-4.1a1.65 1.65 0 0 1 3.1-.8 1.65 1.65 0 0 1 3.1.8c0 2.25-3.1 4.1-3.1 4.1z` },
  /** Grossesse : un cœur qui en porte un plus petit. */
  pregnancy: { fill: HEART, stroke: `${HEART}${circle(12, 12.3, 1.7)}` },
  /** Bouton central « Ajouter ». */
  add: { stroke: 'M12 5.25v13.5M5.25 12h13.5', heavy: true },
  // ---------------------------------------------------------------- en-tête
  /** Communauté : deux bulles de conversation. */
  community: { fill: BUBBLE, stroke: `${BUBBLE}M16 8.6h1.25A2.75 2.75 0 0 1 20 11.35v3.4a2.75 2.75 0 0 1-1.6 2.5v2.65l-3.05-2.4H11.6a2.75 2.75 0 0 1-2.6-1.85` },
  /** Notifications : une cloche. */
  notifications: { fill: BELL, stroke: `${BELL}M10 20.25a2 2 0 0 0 4 0M12 3.25v2` },
  /** Urgences : une bouée. */
  emergency: { fill: `${circle(12, 12, 8.5)}${circle(12, 12, 3.4)}`, stroke: `${circle(12, 12, 8.5)}${circle(12, 12, 3.4)}M6 6l3.6 3.6M14.4 14.4 18 18M18 6l-3.6 3.6M9.6 14.4 6 18` },
  /** Compte (avatar sans photo) : une personne dans un cercle. */
  account: { fill: circle(12, 12, 8.75), stroke: `${circle(12, 12, 8.75)}${circle(12, 10, 2.6)}M7.1 18.1c1.2-1.85 2.85-2.75 4.9-2.75s3.7.9 4.9 2.75` },
  // ---------------------------------------------------------------- 9 catégories
  /** Alimentation : un biberon. */
  feeding: { fill: BOTTLE_BODY, stroke: `${BOTTLE_BODY}M10.2 6.1V4.75a1.8 1.8 0 0 1 3.6 0V6.1M8 6.1h8v2.5H8zM11 12h2M11 15h2` },
  /** Sommeil : une lune et une étincelle. */
  sleep: { fill: MOON, stroke: `${MOON}M17.5 3.75v2.5M16.25 5h2.5` },
  /** Soins : une goutte et son reflet. */
  care: { fill: DROP, stroke: `${DROP}M9.6 14.1a2.5 2.5 0 0 0 2.1 2.3` },
  /** Santé : un bouclier et une croix. */
  health: { fill: SHIELD, stroke: `${SHIELD}M12 9.2v5.6M9.2 12h5.6` },
  /** Cycle : un anneau qui tourne autour d'un repère. */
  cycle: { fill: circle(12, 12, 7.25), stroke: 'M19.25 12A7.25 7.25 0 1 1 17.1 6.85M17.4 3.6l-.3 3.25-3.25-.3', dots: [[12, 12, 1.8]] },
  /** École et activités : un livre ouvert. */
  school: { fill: BOOK, stroke: BOOK },
  /** Couple : deux anneaux entrelacés. */
  couple: { fill: `${circle(9.4, 12, 4.9)}${circle(14.6, 12, 4.9)}`, stroke: `${circle(9.4, 12, 4.9)}${circle(14.6, 12, 4.9)}` },
  // ---------------------------------------------------------------- outils montrés dans l'introduction
  /** Mes outils : quatre tuiles (une mise en avant). */
  tools: { fill: 'M4.5 6.5a2 2 0 0 1 2-2H9a2 2 0 0 1 2 2V9a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2z', stroke: 'M4.5 6.5a2 2 0 0 1 2-2H9a2 2 0 0 1 2 2V9a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2zM13 6.5a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V9a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2zM4.5 15a2 2 0 0 1 2-2H9a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2zM13 15a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2z' },
  /** Minuteur (tétée, biberon, sieste). */
  timer: { fill: circle(12, 13.5, 6.75), stroke: `${circle(12, 13.5, 6.75)}M12 13.5V10.2M10 3.5h4M12 3.5v3.25M17.6 7.2l1.15-1.15` },
  /** Carnet (garde, liaison). */
  notebook: { fill: NOTEBOOK, stroke: `${NOTEBOOK}M10 3.75v16.5M5.25 7.75h3M5.25 12h3M5.25 16.25h3M12.75 8.25h3M12.75 11.5h3` },
  /** Prochaine action : une flèche dans un cercle. */
  next: { fill: circle(12, 12, 8.5), stroke: `${circle(12, 12, 8.5)}M8.5 12h7M12.75 8.75 16 12l-3.25 3.25` },
} satisfies Record<string, HomiIconDef>;

/**
 * Familles de pictogrammes d'OUTILS (20/11/2026) : un fichier par famille de sens, mêmes règles que la famille de
 * base. Le manifeste (src/brand/icons/manifest.ts) relie chaque outil du catalogue à l'un d'eux.
 */
export const TOOL_ICON_FAMILIES = {
  alimentation: ALIMENTATION, sommeil: SOMMEIL, soin: SOIN, sante: SANTE, cycle: CYCLE, grossesse: GROSSESSE,
  garde: GARDE, couple: COUPLE, foyer: FOYER, communaute: COMMUNAUTE, documents: DOCUMENTS, compte: COMPTE,
} as const;
export type ToolIconFamily = keyof typeof TOOL_ICON_FAMILIES;

export const HOMI_ICONS = {
  ...BASE_ICONS, ...ALIMENTATION, ...SOMMEIL, ...SOIN, ...SANTE, ...CYCLE, ...GROSSESSE, ...GARDE, ...COUPLE, ...FOYER, ...COMMUNAUTE, ...DOCUMENTS, ...COMPTE,
};

export type HomiIconName = keyof typeof HOMI_ICONS;
/** Pictogrammes de la famille de base (barre, en-tête, catégories, introduction). */
export const BASE_ICON_NAMES = Object.keys(BASE_ICONS) as HomiIconName[];
export const HOMI_ICON_NAMES = Object.keys(HOMI_ICONS) as HomiIconName[];

/** Groupes (galerie, tests). */
export const ICON_GROUPS: { key: 'tabs' | 'header' | 'categories' | 'intro'; names: HomiIconName[] }[] = [
  { key: 'tabs', names: ['today', 'me', 'child', 'pregnancy', 'family', 'add'] },
  { key: 'header', names: ['community', 'notifications', 'emergency', 'account'] },
  { key: 'categories', names: ['feeding', 'sleep', 'care', 'health', 'cycle', 'pregnancy', 'school', 'couple', 'family'] },
  { key: 'intro', names: ['tools', 'timer', 'notebook', 'next'] },
];

/** Les 9 catégories du centre d'outils → pictogramme. */
export const CATEGORY_HOMI_ICON = {
  feeding: 'feeding', sleep: 'sleep', care: 'care', health: 'health', cycle: 'cycle', pregnancy: 'pregnancy', school: 'school', couple: 'couple', family: 'family',
} as const satisfies Record<string, HomiIconName>;
