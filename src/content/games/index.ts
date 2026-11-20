/**
 * Jeux et activités éducatifs HOMI (outil 132) : 32 jeux écrits à l'avance (rédaction : Claude, Anthropic,
 * 30/11/2026), 8 par tranche d'âge (0–1, 1–3, 3–6, 6–10 ans), avec du matériel du quotidien, une durée indicative, le
 * lieu (intérieur, extérieur) et un rappel de sécurité. Français puis anglais, allemand, espagnol et italien.
 * Aucune génération à la demande ; complète la lecture « Activités et jeux par âge » (guides.activities) et
 * « Je grandis » (kid_grow).
 */
import type { IconName } from '@/components/ui';
import { GAMES_FR } from './fr';
import { GAMES_EN } from './en';
import { GAMES_DE } from './de';
import { GAMES_ES } from './es';
import { GAMES_IT } from './it';
import { GAME_IDS, type GameBand, type GameId, type GamePlace, type GameText, type GameTexts } from './types';

export { GAME_IDS, type GameBand, type GameId, type GamePlace, type GameText };

export interface GameMeta { id: GameId; band: GameBand; minutes: number; place: GamePlace; icon: IconName }
const G = (id: GameId, band: GameBand, minutes: number, place: GamePlace, icon: IconName): GameMeta => ({ id, band, minutes, place, icon });

export const GAMES: GameMeta[] = [
  G('coucou_cache', '0_1', 5, 'in', 'eye'), G('jeu_des_sons', '0_1', 5, 'both', 'mic'), G('boite_tresors', '0_1', 10, 'in', 'box'),
  G('sur_le_ventre', '0_1', 5, 'in', 'smile'), G('petit_orchestre', '0_1', 10, 'in', 'music'), G('comptines_gestes', '0_1', 5, 'both', 'music'),
  G('balle_roule', '0_1', 10, 'in', 'circle'), G('promenade_mots', '0_1', 20, 'out', 'map'),
  G('transvaser', '1_3', 15, 'in', 'droplet'), G('tri_couleurs', '1_3', 10, 'in', 'grid'), G('parcours_coussins', '1_3', 15, 'in', 'trending-up'),
  G('faire_semblant', '1_3', 15, 'in', 'coffee'), G('bulles', '1_3', 10, 'out', 'wind'), G('imagier', '1_3', 10, 'in', 'book-open'),
  G('tresors_parc', '1_3', 20, 'out', 'feather'), G('pate_a_sel', '1_3', 20, 'in', 'layers'),
  G('jacques_a_dit', '3_6', 10, 'both', 'user'), G('memory_maison', '3_6', 20, 'in', 'copy'), G('chasse_couleurs', '3_6', 15, 'in', 'search'),
  G('course_cuillere', '3_6', 15, 'out', 'flag'), G('histoire_trois_mots', '3_6', 10, 'both', 'message-circle'), G('marelle', '3_6', 20, 'out', 'hash'),
  G('bateau_papier', '3_6', 20, 'in', 'anchor'), G('graine', '3_6', 10, 'in', 'sun'),
  G('marchande', '6_10', 20, 'in', 'shopping-bag'), G('cuisiner', '6_10', 30, 'in', 'coffee'), G('carte_tresor', '6_10', 30, 'in', 'map'),
  G('quiz_famille', '6_10', 20, 'in', 'help-circle'), G('mots_caches', '6_10', 15, 'in', 'type'), G('jeu_de_piste', '6_10', 30, 'out', 'compass'),
  G('coule_flotte', '6_10', 20, 'in', 'droplet'), G('ombres', '6_10', 15, 'in', 'moon'),
];
export const GAME_BANDS: GameBand[] = ['0_1', '1_3', '3_6', '6_10'];
export const GAME_BY_ID: Record<GameId, GameMeta> = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, GameMeta>;

const TEXTS: Record<string, GameTexts> = { fr: GAMES_FR, en: GAMES_EN, de: GAMES_DE, es: GAMES_ES, it: GAMES_IT };
export function gameText(id: GameId, lang: string): GameText {
  return (TEXTS[lang] ?? GAMES_FR)[id];
}
export const isGameId = (s: string | null | undefined): s is GameId => !!s && (GAME_IDS as readonly string[]).includes(s);
