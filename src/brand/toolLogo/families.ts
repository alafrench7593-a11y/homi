/**
 * Logos d'outils : identifiant stable du catalogue → glyphe, teinte de catégorie et FAMILLE D'ANIMATION.
 * Une seule source, utilisée partout (accueil, favoris, recherche, catalogue, écran de l'outil) : un même outil a
 * donc le même logo dans tous les écrans. Le glyphe vient du manifeste des pictogrammes (src/brand/icons/manifest.ts).
 *
 * Familles d'animation (jouées seulement lors d'une interaction réelle, jamais au repos, jamais en boucle sauf le
 * minuteur EN COURS) :
 *  - `moon`  : sommeil — un croissant se met en place (rotation + descente) à l'ouverture du journal ;
 *  - `ring`  : allaitement, biberon, tire-lait, minuteurs — un anneau tourne tant que le minuteur tourne, s'arrête avec lui ;
 *  - `curve` : croissance, poids, graphiques — une courbe se trace à l'affichage des données ;
 *  - `check` : tâches, routines, checklists — la coche se dessine à la confirmation ;
 *  - `meal`  : repas, aliments, courses — le pictogramme réagit à l'ajout (rebond) ;
 *  - `glint` : tous les autres — le glyphe se soulève et un reflet traverse la plaque à l'ouverture.
 */
import { toolIconCategory, toolIconName } from '@/brand/icons/resolve';
import type { HomiIconName } from '@/brand/icons/paths';
import { resolveTool } from '@/lib/journeys/tools';
import type { LogoCategory } from '@/theme/toolLogo';

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

/** Teinte de la plaque d'une entrée du catalogue. */
export function logoCategoryOf(id: string | null | undefined, icon: HomiIconName | null, urgent?: boolean): LogoCategory {
  if (urgent) return 'urgent';
  const r = resolveTool(id);
  if (r?.def.urgent) return 'urgent';
  if (icon && AURA_ICONS.includes(icon)) return 'aura';
  if (r?.def.category === 'community' || id === 'cat.community') return 'community';
  if (r?.def.category === 'account' || id === 'cat.account') return 'account';
  return toolIconCategory(id) ?? 'account';
}

export interface ToolLogoDef {
  id: string;
  icon: HomiIconName;
  category: LogoCategory;
  motion: LogoMotion;
}

/** Logo complet d'une entrée du catalogue (outil, sous-accès, `h200_<n>`, `quick.<clé>`, `cat.<catégorie>`) ; null si inconnue. */
export function toolLogoDef(id: string | null | undefined, urgent?: boolean): ToolLogoDef | null {
  const icon = toolIconName(id);
  if (!id || !icon) return null;
  return { id, icon, category: logoCategoryOf(id, icon, urgent), motion: motionOfIcon(icon) };
}
