/**
 * Règles de la communauté (logique pure, testée) — mêmes règles que la base (20261022000100_community_v2.sql) :
 * identifiants « @ », informations sensibles mises en relecture, avertissements avant publication,
 * catégories proposées selon le parcours, fil « Pour vous ».
 */
import type { Journey } from '../types';
import { t as tr, formatDate } from '@/i18n';
import { localized } from '@/i18n/localized';

// ─── Identifiant « @ » ─────────────────────────────────────────────────────────────────────────────

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
export const RESERVED_HANDLES = ['admin', 'administrateur', 'moderation', 'moderateur', 'toietmoi', 'toi_et_moi', 'support', 'anonyme', 'equipe'];

/** Identifiant proposé à partir d'un pseudonyme (sans accents, minuscules, « _ »). */
export function handleBase(pseudonym: string): string {
  const s = pseudonym.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'o').replace(/æ/g, 'a')
    .replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 16).replace(/_+$/g, '');
  if (!s) return 'membre';
  return s.length < 3 ? `${s}_membre` : s;
}

/** Normalise une saisie (« @Maëlle » → « maëlle ») ; la validation refuse ensuite les accents. */
export const normalizeHandle = (h: string) => h.trim().replace(/^@+/, '').toLowerCase();

export function handleError(raw: string): string | null {
  const h = normalizeHandle(raw);
  if (!HANDLE_RE.test(h)) return tr('l4.cr.handleFormat');
  if (RESERVED_HANDLES.includes(h)) return tr('l4.cr.handleReserved');
  return null;
}

// ─── Informations sensibles ────────────────────────────────────────────────────────────────────────

const PHONE = /(\+33|\b0)[1-9]([ .-]?[0-9]{2}){4}/;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const ADDRESS = /\b[0-9]{1,4}( ?(bis|ter))?,? (rue|avenue|av\.|boulevard|bd|allée|allee|impasse|chemin|place|quai|route|cours|square) /i;
const BIRTHDATE = /((?:^|[^a-zà-ÿ])née?s?(?![a-zà-ÿ])|naissance|anniversaire)[^.!?]{0,40}(?<![0-9])[0-3]?[0-9][/.-][01]?[0-9][/.-]((19|20)[0-9]{2}|[0-9]{2})(?![0-9])/i;
const GPS = /-?[0-9]{1,2}\.[0-9]{4,} *, *-?[0-9]{1,3}\.[0-9]{4,}/;
const SSN = /\b[12] ?[0-9]{2} ?[01][0-9] ?[0-9]{2} ?[0-9]{3} ?[0-9]{3}( ?[0-9]{2})?\b/;
const MEDICAL = /\b(médicament|traitement|dose|posologie|mg\b|ml de doliprane|antibiotique|ordonnance|diagnostic)/i;

const linkCount = (t: string) => (t.match(/https?:\/\//g) ?? []).length;

/** Même règle que community_text_needs_review (hors termes surveillés, vérifiés côté serveur). */
export function textNeedsReview(text: string): boolean {
  return PHONE.test(text) || EMAIL.test(text) || ADDRESS.test(text) || BIRTHDATE.test(text) || GPS.test(text) || linkCount(text) >= 3;
}

export interface SensitiveHint { key: 'phone' | 'email' | 'address' | 'birthdate' | 'gps' | 'ssn' | 'links' | 'medical'; text: string; blocking: boolean }

/** Avertissements affichés AVANT de publier (rien n'est envoyé tant que la personne n'a pas choisi). */
export function sensitiveHints(text: string): SensitiveHint[] {
  const out: SensitiveHint[] = [];
  if (PHONE.test(text)) out.push({ key: 'phone', text: tr('l4.cr.hint.phone'), blocking: true });
  if (EMAIL.test(text)) out.push({ key: 'email', text: tr('l4.cr.hint.email'), blocking: true });
  if (ADDRESS.test(text)) out.push({ key: 'address', text: tr('l4.cr.hint.address'), blocking: true });
  if (BIRTHDATE.test(text)) out.push({ key: 'birthdate', text: tr('l4.cr.hint.birthdate'), blocking: true });
  if (GPS.test(text)) out.push({ key: 'gps', text: tr('l4.cr.hint.gps'), blocking: true });
  if (SSN.test(text)) out.push({ key: 'ssn', text: tr('l4.cr.hint.ssn'), blocking: true });
  if (linkCount(text) >= 3) out.push({ key: 'links', text: tr('l4.cr.hint.links'), blocking: false });
  if (MEDICAL.test(text)) out.push({ key: 'medical', text: tr('l4.cr.hint.medical'), blocking: false });
  return out;
}

// ─── Catégories ────────────────────────────────────────────────────────────────────────────────────

export interface CategoryLike { id: string; slug: string; title: string; journeys: readonly string[]; position: number }

/** Catégories principales (6 au plus) : celles du parcours, puis les plus générales. */
export function primaryCategories<T extends CategoryLike>(forums: readonly T[], journeys: readonly Journey[], max = 6): T[] {
  const sorted = [...forums].sort((a, b) => a.position - b.position);
  const mine = sorted.filter((f) => f.journeys.some((j) => journeys.includes(j as Journey)));
  const general = sorted.filter((f) => f.slug === 'questions-generales');
  const rest = sorted.filter((f) => !mine.includes(f) && !general.includes(f));
  return [...mine, ...general, ...rest].slice(0, max);
}

// ─── Fil « Pour vous » ─────────────────────────────────────────────────────────────────────────────

export interface RankablePost { id: string; forum_id: string; created_at: string; like_count: number; comment_count: number; is_mine?: boolean; status?: string }

/**
 * « Pour vous » : publications des catégories du parcours mises en avant, discussions actives, récence.
 * Score = fraîcheur (demi-vie 36 h) × (1 + participation) × bonus de catégorie. Rien n'est caché : c'est un ordre.
 */
export function forYouOrder<T extends RankablePost>(posts: readonly T[], myForumIds: readonly string[], now = new Date()): T[] {
  const score = (p: T) => {
    const hours = Math.max(0, (now.getTime() - Date.parse(p.created_at)) / 3_600_000);
    const fresh = Math.pow(0.5, hours / 36);
    const engagement = 1 + Math.log1p(p.like_count + 2 * p.comment_count) / 2;
    const bonus = myForumIds.includes(p.forum_id) ? 2 : 1;
    return fresh * engagement * bonus;
  };
  return [...posts].sort((a, b) => score(b) - score(a) || b.created_at.localeCompare(a.created_at));
}

// ─── Profil ────────────────────────────────────────────────────────────────────────────────────────

export const AVATAR_PRESETS = ['moon', 'sun', 'leaf', 'cloud', 'star', 'heart', 'wave', 'flower', 'bird', 'whale', 'bear', 'rainbow'] as const;
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

const JOURNEY_LABELS_FR: Record<string, string> = {
  cycle: 'Suit son cycle', projet: 'En projet bébé', grossesse: 'Enceinte', jumeaux: 'Parent de jumeaux ou triplés',
  bebe: 'Parent d’un bébé', enfant: 'Parent d’enfant', famille: 'Parent de plusieurs enfants', postpartum: 'En post-partum',
};
const JOURNEY_LABELS_EN: Record<string, string> = {
  cycle: 'Tracking their cycle', projet: 'Trying for a baby', grossesse: 'Pregnant', jumeaux: 'Parent of twins or triplets',
  bebe: 'Parent of a baby', enfant: 'Parent of a child', famille: 'Parent of several children', postpartum: 'Postpartum',
};
export const JOURNEY_LABELS: Record<string, string> = localized(JOURNEY_LABELS_FR, JOURNEY_LABELS_EN);

/** « Membre depuis octobre 2026 » (mois seulement, jamais la date exacte). */
export function joinedLabel(month: string | null | undefined): string | null {
  if (!month) return null;
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return null;
  return tr('l4.cr.joined', { date: formatDate(new Date(y, m - 1, 15), { month: 'long', year: 'numeric' }) });
}
