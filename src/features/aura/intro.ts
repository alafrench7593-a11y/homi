/**
 * Présentation d'Aura (brief du 21/11/2026) — logique pure, testée.
 *
 * Une seule fois PAR PERSONNE (compte), dans un moment naturel de prise en main : la première arrivée sur l'accueil
 * une fois connectée, hors visite guidée et hors écran de connexion. Relançable à tout moment (réglages d'Aura,
 * Réglages › Aide). « Plus tard » ou fermer la marque comme vue ; rien n'est lu à voix haute.
 * État : `auraIntroSeen` (identifiant du compte → vrai), dans le magasin d'interface persisté sur l'appareil.
 */
import { resolveTool, toolLabelKey } from '@/lib/journeys/tools';

export interface AuraIntroCtx {
  userId: string | null;
  seen: Readonly<Record<string, boolean>>;
  /** relance demandée (réglages d'Aura, aide) */
  requested: boolean;
  /** visite guidée en cours, ou un autre panneau occupe l'écran */
  busy: boolean;
}

/** L'introduction doit-elle s'afficher ? Relance : toujours (avec un compte) ; sinon une fois par compte, jamais par-dessus la visite. */
export function shouldShowAuraIntro(c: AuraIntroCtx): boolean {
  if (!c.userId) return false;
  if (c.requested) return true;
  if (c.busy) return false;
  return !c.seen[c.userId];
}

/** Choix proposés selon les capacités : « Parler » seulement si une voie vocale existe (dictée du téléphone ou du navigateur). */
export type IntroChoice = 'talk' | 'write' | 'later';
export function introChoices(o: { canTalk: boolean }): IntroChoice[] {
  return o.canTalk ? ['talk', 'write', 'later'] : ['write', 'later'];
}

/** Paramètres d'ouverture d'Aura depuis l'introduction (une interaction, vraie route `/assistant`). */
export function introRoute(choice: Exclude<IntroChoice, 'later'>): { pathname: '/assistant'; params: Record<string, string> } {
  return { pathname: '/assistant', params: choice === 'talk' ? { voice: '1' } : { focus: '1' } };
}

/**
 * Entrée contextuelle depuis un outil : n'accepte qu'un identifiant d'outil RÉEL du catalogue (src/lib/journeys/tools.ts) ;
 * sinon rien (aucun lien inventé). Le nom affiché vient de la traduction de l'outil.
 */
export function auraToolContext(id: string | null | undefined): { id: string; labelKey: ReturnType<typeof toolLabelKey> } | null {
  if (!id || typeof id !== 'string' || id.length > 80) return null;
  const r = resolveTool(id);
  if (!r) return null;
  return { id: r.id, labelKey: toolLabelKey(r.id) };
}
