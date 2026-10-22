/**
 * Ce qui appartient au profil affiché : rendez-vous, rappels et notifications.
 * L'accueil ne montre que ce qui concerne ce profil (jamais « Échographie du 3e trimestre » sur le profil d'un
 * nouveau-né), et une notification d'un parcours terminé ou changé n'apparaît plus.
 */
import { screenAllowed, type Scope } from './tools';
import type { Appointment, AppNotification, Reminder } from '../types';

export interface RelevanceCtx {
  scope: Scope;
  childId?: string | null;
  /** Grossesse VISIBLE (parcours « grossesse » actif) ; null sinon. */
  pregnancyId?: string | null;
  /** Toutes les portées de mes profils suivis. */
  activeScopes: Scope[];
  /** Enfants suivis (parcours bébé ou enfant actif). */
  trackedChildIds: string[];
  /** Un post-partum est en cours (infos de la mère rangées dans le profil du bébé). */
  postpartum?: boolean;
  /** Semaines d'aménorrhée de la grossesse affichée (pour ne pas annoncer trop tôt une échéance lointaine). */
  pregnancyWeek?: number | null;
}

const ME: Scope[] = ['avoid', 'ttc', 'cycle', 'none'];
const KID: Scope[] = ['baby', 'child'];
const PREGNANCY_KINDS = new Set(['ultrasound']);
const KID_KINDS = new Set(['pediatric', 'vaccination']);
const POSTNATAL_KINDS = new Set(['postnatal', 'perineal_rehab']);
/** Mots qui désignent sans ambiguïté le suivi d'une grossesse (anciennes saisies sans lien vers la grossesse). */
const PREGNANCY_WORDS = /(échographie|echographie|trimestre|\bSA\b|amniocent|monitoring|terme|sage-femme.*grossesse|déclaration de grossesse)/i;
/** Échéances de fin de grossesse : jamais annoncées sur l'accueil au tout début de la grossesse. */
const LATE_PREGNANCY = /(3e trimestre|troisième trimestre|3ème trimestre|8e mois|9e mois|valise de maternité)/i;
/** Écrans propres aux enfants, à la grossesse ou au cycle : un rappel qui y mène n'apparaît que sur ce profil. */
const KID_LINK = /^\/(teeth|bottle|night|sleep\/|child\/|track\/)/;
const PREGNANCY_LINK = /^\/pregnancy(\/|\?|$)/;
const CYCLE_LINK = /^\/(cycle|fertility|contraception)(\/|\?|$)/;

function forPregnancy(id: string | null | undefined, c: RelevanceCtx) {
  if (!c.pregnancyId || (id && id !== c.pregnancyId)) return false;
  return c.scope === 'pregnancy' || c.scope === 'family';
}
function forChild(id: string, c: RelevanceCtx) {
  if (!c.trackedChildIds.includes(id)) return false;
  return c.scope === 'family' || (KID.includes(c.scope) && c.childId === id);
}

export function appointmentRelevant(a: Pick<Appointment, 'pregnancy_id' | 'child_id' | 'for_parent' | 'kind' | 'title'> & { calendar_keys?: string[] | null }, c: RelevanceCtx): boolean {
  // Échographie du 3e trimestre ou valise de maternité : pas sur l'accueil d'une grossesse de moins de 20 SA
  const late = LATE_PREGNANCY.test(a.title) || (a.calendar_keys ?? []).includes('echo_3');
  if (late && c.scope === 'pregnancy' && c.pregnancyWeek != null && c.pregnancyWeek < 20) return false;
  if (a.pregnancy_id) return forPregnancy(a.pregnancy_id, c);
  if (a.child_id) return forChild(a.child_id, c);
  if (PREGNANCY_KINDS.has(a.kind) || PREGNANCY_WORDS.test(a.title)) return forPregnancy(null, c);
  if (KID_KINDS.has(a.kind)) return KID.includes(c.scope) || c.scope === 'family';
  if (POSTNATAL_KINDS.has(a.kind)) return c.scope === 'postpartum' || c.scope === 'family' || (!!c.postpartum && (c.scope === 'baby' || ME.includes(c.scope)));
  // rendez-vous de l'adulte (ou du foyer) : profils « Moi », grossesse et famille ; jamais sur le profil d'un enfant
  return ME.includes(c.scope) || c.scope === 'pregnancy' || c.scope === 'postpartum' || c.scope === 'family';
}

export function reminderRelevant(r: Pick<Reminder, 'pregnancy_id' | 'child_id' | 'category' | 'deep_link' | 'journey_type'>, c: RelevanceCtx): boolean {
  if (r.pregnancy_id) return forPregnancy(r.pregnancy_id, c);
  if (r.child_id) return forChild(r.child_id, c);
  if (r.deep_link && !screenAllowed(r.deep_link.split('?')[0], c.activeScopes)) return false;
  // Rappel menant à un écran propre à un profil (brossage des dents, biberon, cycle, grossesse) : seulement sur ce profil
  if (r.deep_link && KID_LINK.test(r.deep_link)) return KID.includes(c.scope) || c.scope === 'family';
  if (r.deep_link && PREGNANCY_LINK.test(r.deep_link)) return forPregnancy(null, c);
  if (r.deep_link && CYCLE_LINK.test(r.deep_link)) return ME.includes(c.scope) && c.scope !== 'none';
  const jt = r.journey_type;
  if (jt === 'pregnancy' || r.category === 'ultrasound') return forPregnancy(null, c);
  if (jt === 'avoid' || jt === 'ttc' || jt === 'cycle') return c.scope === jt;
  if (r.category === 'bottle' || r.category === 'meal') return KID.includes(c.scope) || c.scope === 'family';
  if (r.category === 'postnatal' || jt === 'postpartum') return c.scope === 'postpartum' || (!!c.postpartum && (c.scope === 'baby' || ME.includes(c.scope)));
  return true;
}

/**
 * Notification encore pertinente pour l'un de MES profils suivis (la boîte de réception n'est pas filtrée par profil
 * affiché, mais une notification d'un parcours terminé — grossesse archivée, enfant plus suivi, autre parcours — disparaît).
 */
export function notificationRelevant(n: Pick<AppNotification, 'deep_link' | 'payload' | 'category'>, c: Pick<RelevanceCtx, 'activeScopes' | 'pregnancyId' | 'trackedChildIds'>): boolean {
  const p = (n.payload ?? {}) as { pregnancy_id?: string; child_id?: string; journey_type?: string };
  if (p.pregnancy_id && p.pregnancy_id !== c.pregnancyId) return false;
  if (p.child_id && !c.trackedChildIds.includes(p.child_id)) return false;
  if (p.journey_type) {
    const jt = p.journey_type === 'pregnancy' ? 'pregnancy' : p.journey_type;
    if (!c.activeScopes.includes(jt as Scope)) return false;
  }
  if (n.deep_link && n.deep_link.startsWith('/') && !screenAllowed(n.deep_link.split('?')[0], c.activeScopes)) return false;
  return true;
}
