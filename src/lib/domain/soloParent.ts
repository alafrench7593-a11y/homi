/**
 * Profil « maman solo » (07/11/2026) — logique pure, testée (src/__tests__/soloParent.test.ts).
 *
 * Les aides listées ici ont été vérifiées le 07/11/2026 sur des sources officielles (caf.fr, solidarites.gouv.fr,
 * impots.gouv.fr). Les montants changent souvent : l'écran n'affiche AUCUN montant d'allocation et renvoie toujours
 * vers la page officielle et le simulateur mes-aides.gouv.fr.
 * Les gestes sont des textes écrits pour l'appli (aucune vidéo recopiée) avec un lien vers la source officielle.
 */
import type { HelpKind } from '@/lib/data/hooks-mental';

export const AIDS_CHECKED_ON = '2026-11-07';

export type AidKey = 'asf' | 'aripa' | 'cmg' | 'tax_t' | 'home_help' | 'simulate' | 'laep';
export interface Aid {
  key: AidKey;
  url: string;
  /** Démarche « Papiers de la famille » à préparer pour cette aide, si elle existe. */
  procedure?: 'caf' | 'health';
  /** Pour une famille séparée (pension alimentaire). */
  separated?: boolean;
  /** Utile seulement avec un enfant de moins de 12 ans (CMG). */
  maxChildAge?: number;
}

export const AIDS: Aid[] = [
  // caf.fr « Familles monoparentales : quelles aides ? » (13/04/2026)
  { key: 'asf', url: 'https://caf.fr/allocataires/vies-de-famille/articles/familles-monoparentales-quelles-aides', procedure: 'caf' },
  // solidarites.gouv.fr — intermédiation financière (ARIPA)
  { key: 'aripa', url: 'https://www.pension-alimentaire.caf.fr/web/guest/home', separated: true },
  // solidarites.gouv.fr — CMG jusqu'aux 12 ans de l'enfant pour les familles monoparentales depuis le 01/09/2025
  { key: 'cmg', url: 'https://solidarites.gouv.fr/complement-de-libre-choix-du-mode-de-garde', procedure: 'caf', maxChildAge: 12 },
  // impots.gouv.fr — case T « parent isolé »
  { key: 'tax_t', url: 'https://www.impots.gouv.fr/node/4001' },
  // caf.fr — aide et accompagnement à domicile (TISF / AVS), participation selon le quotient familial
  { key: 'home_help', url: 'https://caf.fr/allocataires/caf-de-seine-maritime/offre-de-service/vie-personnelle/je-souhaite-beneficier-d-une-aide-et-d-un-accompagnement-domicile' },
  { key: 'simulate', url: 'https://mes-aides.gouv.fr/' },
  { key: 'laep', url: 'https://www.monenfant.fr/que-recherchez-vous/lieu-d-accompagnement-et-information-des-familles' },
];

/** Aides à montrer selon la situation (séparée ou non) et l'âge du plus jeune enfant (null = pas encore d'enfant). */
export function aidsFor(opts: { separated: boolean; youngestAge: number | null }): Aid[] {
  return AIDS.filter((a) => (!a.separated || opts.separated) && (a.maxChildAge == null || opts.youngestAge == null || opts.youngestAge < a.maxChildAge));
}

export type GestureKey = 'crying' | 'sleep' | 'bath' | 'change' | 'carry' | 'bottle' | 'shower_alone' | 'outing_alone' | 'fever' | 'if_i_fall_ill';
export interface Gesture {
  key: GestureKey;
  /** Nombre d'étapes (clés sol.g.<key>.s1…sN). */
  steps: number;
  url?: string;
  /** Vidéo officielle vérifiée (page de la HAS qui l'intègre). */
  video?: string;
  ages: ('baby' | 'child')[];
  /** Geste propre au fait d'être seule (pas de relais immédiat). */
  solo?: boolean;
  /** Rappel d'orientation vers un professionnel affiché sous les étapes. */
  care?: boolean;
}

export const GESTURES: Gesture[] = [
  { key: 'crying', steps: 5, url: 'https://www.has-sante.fr/jcms/c_1095926/fr/bebe-secoue-une-forme-mal-connue-de-maltraitance-aux-consequences-irreparables', video: 'https://www.youtube.com/embed/videoseries?list=PL8602856ED75D6285', ages: ['baby'], solo: true, care: true },
  { key: 'sleep', steps: 4, url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', ages: ['baby'] },
  { key: 'shower_alone', steps: 4, ages: ['baby', 'child'], solo: true },
  { key: 'bath', steps: 5, url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/donner-bain-bebe', ages: ['baby'] },
  { key: 'change', steps: 4, url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/changer-bebe-faire-toilette', ages: ['baby'] },
  { key: 'carry', steps: 4, url: 'https://caf.fr/allocataires/vies-de-famille/articles/portage-de-son-bebe-les-bons-gestes-adopter', ages: ['baby'], solo: true },
  { key: 'bottle', steps: 4, url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/preparer-biberon', ages: ['baby'] },
  { key: 'outing_alone', steps: 4, ages: ['baby', 'child'], solo: true },
  { key: 'fever', steps: 3, url: 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/bons-reflexes-cas-faut-consulter', ages: ['baby', 'child'], care: true },
  { key: 'if_i_fall_ill', steps: 4, ages: ['baby', 'child'], solo: true },
];

export const HELP_KINDS: HelpKind[] = ['nights', 'pickup', 'meals', 'shopping', 'emergency', 'listen', 'admin'];

/** Âge en années révolues (null si date inconnue). */
export function ageYears(birthDate: string | null | undefined, today: string): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.slice(0, 10).split('-').map(Number);
  const [ty, tm, td] = today.slice(0, 10).split('-').map(Number);
  let a = ty - y;
  if (tm < m || (tm === m && td < d)) a -= 1;
  return Math.max(0, a);
}

/** Gestes à proposer selon l'âge des enfants : bébé (< 2 ans) et/ou enfant. Sans enfant : les gestes bébé. */
export function gesturesFor(ages: (number | null)[]): Gesture[] {
  const known = ages.filter((a): a is number => a != null);
  const wantBaby = !known.length || known.some((a) => a < 2);
  const wantChild = known.some((a) => a >= 2);
  return GESTURES.filter((g) => (wantBaby && g.ages.includes('baby')) || (wantChild && g.ages.includes('child')));
}

/** Personnes du cercle qui peuvent aider pour un besoin donné (celles qui ont un téléphone d'abord). */
export function helpersFor<C extends { helps: HelpKind[]; phone: string | null }>(circle: C[], kind: HelpKind): C[] {
  return circle.filter((c) => c.helps.includes(kind)).sort((a, b) => Number(!!b.phone) - Number(!!a.phone));
}

/** Lien SMS prérempli (le message part depuis l'application Messages, envoyé par la personne elle-même). */
export function smsLink(phone: string, body: string, platform: 'ios' | 'android' | 'web'): string {
  const num = phone.replace(/[^0-9+]/g, '');
  return `sms:${num}${platform === 'ios' ? '&' : '?'}body=${encodeURIComponent(body)}`;
}
