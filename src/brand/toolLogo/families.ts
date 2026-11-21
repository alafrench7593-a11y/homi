/**
 * Logos d'outils : identifiant stable du catalogue → glyphe, plaque de catégorie, PUBLIC (couleur de la lumière),
 * symbole et FAMILLE D'ANIMATION. Une seule source, utilisée partout (accueil, favoris, recherche, catalogue, écran
 * de l'outil) : un même outil a donc le même logo dans tous les écrans. Le glyphe de repli vient du manifeste des
 * pictogrammes (src/brand/icons/manifest.ts).
 *
 * Familles d'animation (jouées seulement lors d'une interaction réelle, jamais au repos, jamais en boucle sauf le
 * minuteur EN COURS) :
 *  - `moon`  : sommeil — un croissant se met en place (rotation + descente) à l'ouverture du journal ;
 *  - `ring`  : allaitement, biberon, tire-lait, minuteurs — un anneau tourne tant que le minuteur tourne, s'arrête avec lui ;
 *  - `curve` : croissance, poids, graphiques — une courbe se trace à l'affichage des données ;
 *  - `check` : tâches, routines, checklists — la coche se dessine à la confirmation ;
 *  - `meal`  : repas, aliments, courses — le pictogramme réagit à l'ajout (rebond) ;
 *  - `glint` : tous les autres — le glyphe se soulève et un reflet traverse la plaque à l'ouverture.
 *
 * PUBLIC (21/11/2026) : à qui sert l'outil — couleur de la lumière derrière le symbole (src/theme/toolLogo.ts).
 * SYMBOLE : celui de la propriétaire (src/brand/toolGlass/symbols.ts) pour les 134 outils du registre et les
 * raccourcis de l'accueil qui y mènent ; sinon (sous-accès, fonctions de la liste des 200, catégories) le
 * pictogramme HOMI de l'entrée, dessiné dans le même trait nacré.
 */
import { toolIconCategory, toolIconName } from '@/brand/icons/resolve';
import type { HomiIconName } from '@/brand/icons/paths';
import { TOOL_SYMBOLS } from '@/brand/toolGlass/symbols';
import { resolveTool, type Scope } from '@/lib/journeys/tools';
import type { LogoCategory, LogoPublic } from '@/theme/toolLogo';

export type LogoMotion = 'moon' | 'ring' | 'curve' | 'check' | 'meal' | 'glint';
export const LOGO_MOTIONS: LogoMotion[] = ['moon', 'ring', 'curve', 'check', 'meal', 'glint'];

const MOON: HomiIconName[] = ['crib', 'pillowZ', 'nightLamp', 'starNight', 'relayMoon', 'sleepBlocks', 'storyMoon'];
const RING: HomiIconName[] = ['nursing', 'hourglass', 'timer', 'contractionTimer', 'pumpBottle', 'bottleRelay', 'alarmClock'];
const CURVE: HomiIconName[] = ['stairs', 'ruler', 'scale', 'trendLine', 'areaChart', 'bars', 'chartBox', 'labCurve', 'pie', 'pulse', 'clipboardPulse', 'belly'];
const CHECK: HomiIconName[] = ['checklist', 'clipboardCheck', 'doubleCheck', 'calendarCheck', 'routineChart', 'loop', 'personCheck', 'scarCheck', 'bubbleCheck', 'clipboardList', 'dayList', 'shieldCheck', 'homework'];
const MEAL: HomiIconName[] = ['plateCutlery', 'bowlSpoon', 'cloche', 'fridge', 'carrot', 'appleScan', 'broccoli', 'portionTray', 'spoonRefuse', 'bottlePlus', 'cart', 'box', 'milkJars', 'formulaTin', 'scoop', 'trophy'];

/** Famille d'animation d'un pictogramme. */
export function motionOfIcon(icon: HomiIconName | null | undefined): LogoMotion {
  if (!icon) return 'glint';
  if (MOON.includes(icon)) return 'moon';
  if (RING.includes(icon)) return 'ring';
  if (CURVE.includes(icon)) return 'curve';
  if (CHECK.includes(icon)) return 'check';
  if (MEAL.includes(icon)) return 'meal';
  return 'glint';
}

const AURA_ICONS: HomiIconName[] = ['auraBubble', 'bubbleSpark', 'chip', 'bubbleSwap', 'compassSpark'];

/** Raccourcis de l'accueil (`quick.<clé>`) → l'outil du registre qu'ils ouvrent (plaque, symbole et public de cet outil). */
export const QUICK_TOOL: Record<string, string> = {
  cyclecal: 'cycle_calendar', nighthelp: 'baby_night_help', bottle: 'baby_bottle', breastfeed: 'baby_breastfeed', diaper: 'baby_diaper', sleep: 'kid_sleep',
  growth: 'kid_grow', treatment: 'kid_treatments', checkin: 'pp_checkin', calendar: 'family_calendar', symptom: 'cycle_symptoms', meal: 'baby_foods',
  observation: 'kid_health', question: 'ask', mood: 'mood', weight: 'preg_weight', scan: 'scan_product', period: 'cycle_home', test: 'ttc_tests',
  pill: 'avoid_contraception', mysleep: 'sleep', appointment: 'appointments', tasks: 'family_tasks', agenda: 'family_calendar', journal: 'journal',
  relay: 'family_nights', postpartum: 'pp_recovery',
};

/** Identifiant de référence d'une entrée : l'outil qu'ouvre un raccourci de l'accueil, sinon l'entrée elle-même. */
const refId = (id: string | null | undefined) => (id?.startsWith('quick.') ? QUICK_TOOL[id.slice(6)] ?? id : id);

/** Plaque d'une entrée du catalogue (catégorie). */
export function logoCategoryOf(id: string | null | undefined, icon: HomiIconName | null, urgent?: boolean): LogoCategory {
  if (urgent) return 'urgent';
  const ref = refId(id);
  const r = resolveTool(ref);
  if (r?.def.urgent) return 'urgent';
  const refIcon = ref !== id ? toolIconName(ref) : icon; // raccourci : pictogramme de l'outil qu'il ouvre
  if ((icon && AURA_ICONS.includes(icon)) || (refIcon && AURA_ICONS.includes(refIcon))) return 'aura';
  if (r?.def.category === 'community' || id === 'cat.community') return 'community';
  if (r?.def.category === 'account' || id === 'cat.account') return 'account';
  return toolIconCategory(ref) ?? 'account';
}

/** Public d'un scope du registre : la femme (cycle, contraception, désir d'enfant, grossesse, post-partum, « moi »), bébé, enfant, foyer. */
const SCOPE_PUBLIC: Record<Scope, LogoPublic> = { avoid: 'woman', ttc: 'woman', cycle: 'woman', none: 'woman', pregnancy: 'woman', postpartum: 'woman', baby: 'baby', child: 'child', family: 'family' };

/** Public par défaut d'une catégorie (entrées sans outil : `cat.<catégorie>`). */
const CATEGORY_PUBLIC: Record<LogoCategory, LogoPublic> = {
  feeding: 'baby', sleep: 'baby', care: 'baby', health: 'family', cycle: 'woman', pregnancy: 'woman', school: 'child', couple: 'couple',
  family: 'family', community: 'neutral', account: 'neutral', aura: 'aura', urgent: 'urgent',
};

/**
 * Public d'une entrée (déterministe) : urgence et Aura d'abord ; communauté, compte, réglages → neutre ; couple →
 * couple ; sinon les scopes de l'outil (ou du sous-accès) : s'ils couvrent au moins TROIS publics, l'outil sert toute
 * la famille (foyer) ; sinon le premier scope PERTINENT — celui du rangement de l'outil s'il figure parmi ses scopes
 * (un outil d'école ouvert à bébé et enfant → enfant), à défaut le premier. Entrée sans outil : public de sa catégorie.
 */
const isLogoCategory = (c: string | undefined): c is LogoCategory => !!c && c in CATEGORY_PUBLIC;
export function logoPublicOf(id: string | null | undefined, category: LogoCategory): LogoPublic {
  if (category === 'urgent' || category === 'aura') return category;
  const r = resolveTool(refId(id));
  if (!r) return CATEGORY_PUBLIC[category];
  if (r.def.urgent) return 'urgent';
  const cat = r.sub?.category ?? r.def.category;
  if (cat === 'community' || cat === 'account') return 'neutral';
  if (cat === 'couple') return 'couple';
  const scopes: Scope[] = r.sub?.scopes ?? r.def.scopes ?? [];
  const publics = [...new Set(scopes.map((s) => SCOPE_PUBLIC[s]))];
  if (publics.length >= 3) return 'family';
  // premier scope PERTINENT : celui qui correspond au rangement de l'outil s'il en fait partie (école → enfant), sinon le premier
  const preferred = CATEGORY_PUBLIC[isLogoCategory(cat) ? cat : category];
  return publics.includes(preferred) ? preferred : publics[0] ?? CATEGORY_PUBLIC[category];
}

/** Symbole de la propriétaire d'une entrée (outil du registre, alias, raccourci qui y mène) ; null : pictogramme HOMI. */
export function logoSymbolOf(id: string | null | undefined): string | null {
  const ref = refId(id);
  if (!ref) return null;
  const r = resolveTool(ref);
  const key = r ? (!r.sub && r.id === r.def.id ? r.def.id : null) : ref;
  return key && TOOL_SYMBOLS[key] ? key : null;
}

export interface ToolLogoDef {
  id: string;
  icon: HomiIconName;
  category: LogoCategory;
  motion: LogoMotion;
  /** à qui sert l'outil : couleur de la lumière */
  public: LogoPublic;
  /** symbole de la propriétaire (clé de src/brand/toolGlass/symbols.ts), ou null : pictogramme HOMI `icon` */
  symbol: string | null;
}

/** Logo complet d'une entrée du catalogue (outil, sous-accès, `h200_<n>`, `quick.<clé>`, `cat.<catégorie>`) ; null si inconnue. */
export function toolLogoDef(id: string | null | undefined, urgent?: boolean): ToolLogoDef | null {
  const icon = toolIconName(id);
  if (!id || !icon) return null;
  const category = logoCategoryOf(id, icon, urgent);
  return { id, icon, category, motion: motionOfIcon(icon), public: logoPublicOf(id, category), symbol: logoSymbolOf(id) };
}
