/**
 * Mini-réseau social de la communauté (logique pure, testée) :
 * mentions @identifiant, groupes par mois de naissance ou de terme prévu, fil « Pour vous » personnalisé,
 * fil « Abonnements », discussions recommandées.
 *
 * Confidentialité : le classement est calculé SUR LE TÉLÉPHONE. L'âge des enfants, la semaine de grossesse et les
 * sujets consultés servent à ordonner ce que la personne voit ; ils ne sont jamais publiés ni envoyés aux autres membres.
 * Pas de concours de popularité : la participation compte peu (logarithme), aucune autrice n'est « mise en avant ».
 */
import { monthName } from '@/i18n/formats';
import { localized } from '@/i18n/localized';
import { getLocale, t as tr } from '@/i18n';

// ─── Mentions ──────────────────────────────────────────────────────────────────────────────────────

/** Même règle que community_mentioned (5 mentions au plus, identifiants de 3 à 20 caractères). */
export function extractMentions(text: string): string[] {
  const out: string[] = [];
  const re = /(^|[^a-z0-9_@])@([a-z0-9_]{3,20})/g;
  const lower = (text ?? '').toLowerCase();
  let m: RegExpExecArray | null;
  while ((m = re.exec(lower)) && out.length < 5) if (!out.includes(m[2])) out.push(m[2]);
  return out;
}

/** Mention en cours de saisie (« … @ma » → « ma ») pour proposer des membres. */
export function mentionQuery(text: string): string | null {
  const m = /(^|[^a-z0-9_@])@([a-z0-9_]{1,20})$/i.exec(text ?? '');
  return m ? m[2].toLowerCase() : null;
}

/** Remplace la mention en cours par l'identifiant choisi (suivi d'une espace). */
export function completeMention(text: string, handle: string): string {
  return text.replace(/@([a-z0-9_]{0,20})$/i, `@${handle} `);
}

/** Découpe un texte pour afficher les mentions comme des liens. */
export function splitMentions(text: string): { text: string; handle?: string }[] {
  const parts: { text: string; handle?: string }[] = [];
  const re = /(^|[^A-Za-z0-9_@])@([A-Za-z0-9_]{3,20})/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index + m[1].length;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: `@${m[2]}`, handle: m[2].toLowerCase() });
    last = start + m[2].length + 1;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

// ─── Groupes par mois ──────────────────────────────────────────────────────────────────────────────

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export type CohortType = 'birth' | 'due';
export interface CohortSuggestion { type: CohortType; month: string; label: string; reason: string }

/** Même nom que cohort_name côté serveur. */
export function cohortName(type: CohortType, month: string, lang: string = getLocale()): string {
  const [y, m] = month.split('-').map(Number);
  if (lang === 'en') return `${type === 'birth' ? 'Babies born in' : 'Due in'} ${MONTHS_EN[m - 1]} ${y}`;
  // Affichage seulement (le nom enregistré côté serveur reste le français)
  if (lang === 'es') return `${type === 'birth' ? 'Bebés nacidos en' : 'Fecha prevista en'} ${monthName(m - 1, 'es')} de ${y}`;
  if (lang === 'de') return `${type === 'birth' ? 'Geboren im' : 'Termin im'} ${monthName(m - 1, 'de')} ${y}`;
  if (lang === 'it') return `${type === 'birth' ? 'Nati a' : 'Termine previsto a'} ${monthName(m - 1, 'it')} ${y}`;
  return `${type === 'birth' ? 'Bébés nés en' : 'Terme prévu en'} ${MONTHS[m - 1]} ${y}`;
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * D-09 (QA 02/11/2026) : le serveur nomme les groupes par mois en français (« Terme prévu en février 2027 »).
 * Affichage dans la langue en cours ; les autres noms sont rendus tels quels.
 */
export function localizeGroupName(name: string | null | undefined, lang: string = getLocale()): string {
  if (!name) return '';
  const m = /^(Bébés nés en|Terme prévu en) (\S+) (\d{4})$/.exec(name);
  if (!m || lang === 'fr') return name;
  const month = MONTHS.indexOf(m[2]);
  if (month < 0) return name;
  return cohortName(m[1] === 'Bébés nés en' ? 'birth' : 'due', `${m[3]}-${String(month + 1).padStart(2, '0')}`, lang);
}

const monthOf = (iso: string) => iso.slice(0, 7);
const monthsBetween = (a: string, b: string) => {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
};

/**
 * Groupes proposés : le mois de naissance de chaque enfant (6 ans au plus) et le mois du terme prévu.
 * Seuls le TYPE et le MOIS sont envoyés en rejoignant un groupe (jamais le prénom ni la date exacte).
 */
export function cohortSuggestions(input: { childBirthDates: string[]; dueDate?: string | null }, now = new Date()): CohortSuggestion[] {
  const current = now.toISOString().slice(0, 7);
  const out: CohortSuggestion[] = [];
  if (input.dueDate) {
    const m = monthOf(input.dueDate);
    const d = monthsBetween(current, m);
    if (d >= -2 && d <= 10) out.push({ type: 'due', month: m, label: cohortName('due', m), reason: tr('l3.social.reason_due') });
  }
  for (const b of input.childBirthDates) {
    const m = monthOf(b);
    const d = monthsBetween(m, current);
    if (d >= 0 && d <= 72 && !out.some((x) => x.type === 'birth' && x.month === m)) out.push({ type: 'birth', month: m, label: cohortName('birth', m), reason: tr('l3.social.reason_birth') });
  }
  return out;
}

// ─── Fil personnalisé ──────────────────────────────────────────────────────────────────────────────

export interface FeedPostLike {
  id: string; forum_id: string; forum_slug?: string | null; created_at: string; like_count: number; comment_count: number;
  is_mine?: boolean; liked?: boolean; saved?: boolean; following_author?: boolean; anonymous?: boolean;
  group_id?: string | null; group_kind?: string | null; author_handle?: string | null; status?: string;
}

export interface FeedSignals {
  /** Catégories du parcours choisi */
  journeyForumIds: string[];
  /** Catégories suivies */
  subscribedForumIds: string[];
  /** Âge des enfants (mois) et semaine de grossesse : convertis en catégories, jamais transmis */
  childAgesMonths?: number[];
  weekSA?: number | null;
  /** Sujets consultés (catégorie → nombre de lectures) */
  topicViews?: Record<string, number>;
  /** Groupes rejoints */
  groupIds?: string[];
  /** Catégories des publications aimées ou enregistrées (affinité) */
  likedForumIds?: string[];
}

/** Catégories utiles selon l'âge des enfants et la semaine de grossesse. */
export function hintCategories(childAgesMonths: number[] = [], weekSA: number | null = null): string[] {
  const out = new Set<string>();
  for (const a of childAgesMonths) {
    if (a < 4) ['nouveau-ne', 'allaitement', 'biberon', 'sommeil', 'post-partum'].forEach((x) => out.add(x));
    else if (a < 24) ['sommeil', 'diversification', 'sante-developpement'].forEach((x) => out.add(x));
    else ['sante-developpement', 'questions-generales', 'sommeil'].forEach((x) => out.add(x));
  }
  if (weekSA != null) {
    out.add('grossesse');
    if (weekSA >= 32) { out.add('nouveau-ne'); out.add('allaitement'); }
  }
  if (childAgesMonths.length >= 2) out.add('plusieurs-enfants');
  return [...out];
}

/** Explication courte de la présence d'une publication dans « Pour vous » (transparence). */
export function forYouReason(p: FeedPostLike, s: FeedSignals, hints: string[]): string | null {
  if (p.following_author && !p.anonymous) return tr('l3.social.why_following');
  if (p.group_id && s.groupIds?.includes(p.group_id)) return tr('l3.social.why_group');
  if (s.subscribedForumIds.includes(p.forum_id)) return tr('l3.social.why_category');
  if (p.forum_slug && hints.includes(p.forum_slug)) return tr('l3.social.why_age');
  if (s.journeyForumIds.includes(p.forum_id)) return tr('l3.social.why_journey');
  return null;
}

/**
 * « Pour vous » : fraîcheur (demi-vie 36 h) × participation (logarithme, plafonnée) × pertinence.
 * Pertinence = parcours, catégories suivies, âge des enfants / grossesse, membres suivis, groupes, sujets consultés,
 * publications aimées ou enregistrées. Rien n'est caché : c'est seulement un ordre. Les groupes privés n'y figurent pas.
 */
export function personalizedOrder<T extends FeedPostLike>(posts: readonly T[], s: FeedSignals, now = new Date()): T[] {
  const hints = hintCategories(s.childAgesMonths, s.weekSA ?? null);
  const views = s.topicViews ?? {};
  const maxViews = Math.max(1, ...Object.values(views));
  const score = (p: T) => {
    const hours = Math.max(0, (now.getTime() - Date.parse(p.created_at)) / 3_600_000);
    const fresh = Math.pow(0.5, hours / 36);
    const engagement = 1 + Math.min(1, Math.log1p(p.like_count + 2 * p.comment_count) / 4);
    let rel = 1;
    if (s.journeyForumIds.includes(p.forum_id)) rel += 0.8;
    if (s.subscribedForumIds.includes(p.forum_id)) rel += 1.2;
    if (p.forum_slug && hints.includes(p.forum_slug)) rel += 0.6;
    if (p.following_author && !p.anonymous) rel += 1.5;
    if (p.group_id && s.groupIds?.includes(p.group_id)) rel += 1;
    if (views[p.forum_id]) rel += 0.6 * (views[p.forum_id] / maxViews);
    if (s.likedForumIds?.includes(p.forum_id)) rel += 0.4;
    if (p.is_mine) rel *= 0.6; // ses propres publications restent visibles, sans occuper le haut du fil
    return fresh * engagement * rel;
  };
  return [...posts].filter((p) => p.group_kind !== 'private').sort((a, b) => score(b) - score(a) || b.created_at.localeCompare(a.created_at));
}

/** « Abonnements » : membres suivis (jamais via une publication anonyme), catégories suivies, groupes rejoints ; du plus récent au plus ancien. */
export function subscriptionsFeed<T extends FeedPostLike>(posts: readonly T[], s: Pick<FeedSignals, 'subscribedForumIds' | 'groupIds'>): T[] {
  return posts
    .filter((p) => (p.following_author && !p.anonymous) || (!p.group_id && s.subscribedForumIds.includes(p.forum_id)) || (!!p.group_id && !!s.groupIds?.includes(p.group_id)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Discussions recommandées : questions récentes et pertinentes qui attendent encore des réponses (pour aider, pas pour briller). */
export function recommendedDiscussions<T extends FeedPostLike & { kind?: string }>(posts: readonly T[], s: FeedSignals, now = new Date(), max = 3): T[] {
  const hints = hintCategories(s.childAgesMonths, s.weekSA ?? null);
  const relevant = (p: T) => s.journeyForumIds.includes(p.forum_id) || s.subscribedForumIds.includes(p.forum_id) || (!!p.forum_slug && hints.includes(p.forum_slug));
  return posts
    .filter((p) => !p.is_mine && !p.liked && p.status !== 'hidden' && p.group_kind !== 'private' && p.comment_count <= 2 && (p.kind ?? 'question') === 'question')
    .filter((p) => now.getTime() - Date.parse(p.created_at) < 7 * 86_400_000)
    .filter(relevant)
    .sort((a, b) => a.comment_count - b.comment_count || b.created_at.localeCompare(a.created_at))
    .slice(0, max);
}

/** Publications épinglées d'abord (catégorie ou groupe), puis l'ordre donné. */
export function pinnedFirst<T extends { pinned_at?: string | null }>(posts: readonly T[]): T[] {
  return [...posts.filter((p) => p.pinned_at).sort((a, b) => String(b.pinned_at).localeCompare(String(a.pinned_at))), ...posts.filter((p) => !p.pinned_at)];
}

// ─── Sondages ──────────────────────────────────────────────────────────────────────────────────────

export function pollOptionsError(options: string[]): string | null {
  const clean = options.map((o) => o.trim()).filter(Boolean);
  if (clean.length < 2) return tr('l3.social.poll_min');
  if (clean.length > 6) return tr('l3.social.poll_max');
  if (clean.some((o) => o.length > 80)) return tr('l3.social.poll_len');
  if (new Set(clean.map((o) => o.toLowerCase())).size !== clean.length) return tr('l3.social.poll_dup');
  return null;
}

export const pollPercent = (votes: number, total: number) => (total > 0 ? Math.round((votes / total) * 100) : 0);

// ─── Personnalisation Premium ──────────────────────────────────────────────────────────────────────

/** Couleurs d'accent proposées : reprises de la palette existante (aucune nouvelle couleur de l'application). */
export const PROFILE_ACCENTS = ['rose', 'lavande', 'menthe', 'peche', 'ciel', 'sable'] as const;
export const PROFILE_BANNERS = ['aube', 'nuit', 'prairie', 'ocean', 'nacre'] as const;
export type ProfileAccent = (typeof PROFILE_ACCENTS)[number];
export type ProfileBanner = (typeof PROFILE_BANNERS)[number];
const ACCENT_LABEL_FR: Record<ProfileAccent, string> = { rose: 'Rose', lavande: 'Lavande', menthe: 'Menthe', peche: 'Pêche', ciel: 'Ciel', sable: 'Sable' };
const ACCENT_LABEL_EN: Record<ProfileAccent, string> = { rose: 'Rose', lavande: 'Lavender', menthe: 'Mint', peche: 'Peach', ciel: 'Sky', sable: 'Sand' };
const ACCENT_LABEL_ES: Record<ProfileAccent, string> = { rose: 'Rosa', lavande: 'Lavanda', menthe: 'Menta', peche: 'Melocotón', ciel: 'Cielo', sable: 'Arena' };
const ACCENT_LABEL_DE: Record<ProfileAccent, string> = { rose: 'Rosa', lavande: 'Lavendel', menthe: 'Minze', peche: 'Pfirsich', ciel: 'Himmel', sable: 'Sand' };
const ACCENT_LABEL_IT: Record<ProfileAccent, string> = { rose: 'Rosa', lavande: 'Lavanda', menthe: 'Menta', peche: 'Pesca', ciel: 'Cielo', sable: 'Sabbia' };
export const ACCENT_LABEL: Record<ProfileAccent, string> = localized(ACCENT_LABEL_FR, ACCENT_LABEL_EN, { es: ACCENT_LABEL_ES, de: ACCENT_LABEL_DE, it: ACCENT_LABEL_IT });
const BANNER_LABEL_FR: Record<ProfileBanner, string> = { aube: 'Aube', nuit: 'Nuit étoilée', prairie: 'Prairie', ocean: 'Océan', nacre: 'Nacre' };
const BANNER_LABEL_EN: Record<ProfileBanner, string> = { aube: 'Dawn', nuit: 'Starry night', prairie: 'Meadow', ocean: 'Ocean', nacre: 'Mother-of-pearl' };
const BANNER_LABEL_ES: Record<ProfileBanner, string> = { aube: 'Amanecer', nuit: 'Noche estrellada', prairie: 'Pradera', ocean: 'Océano', nacre: 'Nácar' };
const BANNER_LABEL_DE: Record<ProfileBanner, string> = { aube: 'Morgendämmerung', nuit: 'Sternennacht', prairie: 'Wiese', ocean: 'Ozean', nacre: 'Perlmutt' };
const BANNER_LABEL_IT: Record<ProfileBanner, string> = { aube: 'Alba', nuit: 'Notte stellata', prairie: 'Prateria', ocean: 'Oceano', nacre: 'Madreperla' };
export const BANNER_LABEL: Record<ProfileBanner, string> = localized(BANNER_LABEL_FR, BANNER_LABEL_EN, { es: BANNER_LABEL_ES, de: BANNER_LABEL_DE, it: BANNER_LABEL_IT });

// ─── Gratuit / Premium ─────────────────────────────────────────────────────────────────────────────

/** La communauté de base reste gratuite pour pouvoir grandir (vérifié par les tests). */
const COMMUNITY_FREE_FR = [
  'Créer son profil communautaire',
  'Publier du texte et jusqu’à 4 photos',
  'Commenter, répondre, aimer',
  'Suivre des membres et des catégories',
  'Rejoindre les catégories, les groupes thématiques et les groupes par mois',
  'Créer et répondre à des sondages',
  'Recevoir les notifications de réponses et de mentions',
  'Signaler et bloquer',
  'Règles et informations de sécurité',
];
const COMMUNITY_FREE_EN: typeof COMMUNITY_FREE_FR = [
  'Create your community profile',
  'Post text and up to 4 photos',
  'Comment, reply, like',
  'Follow members and categories',
  'Join categories, topic groups and monthly groups',
  'Create and answer polls',
  'Receive notifications for replies and mentions',
  'Report and block',
  'Rules and safety information',
];
const COMMUNITY_FREE_ES: typeof COMMUNITY_FREE_FR = [
  'Crear tu perfil en la comunidad',
  'Publicar texto y hasta 4 fotos',
  'Comentar, responder, dar me gusta',
  'Seguir a miembros y categorías',
  'Unirte a las categorías, a los grupos temáticos y a los grupos por mes',
  'Crear y responder encuestas',
  'Recibir las notificaciones de respuestas y menciones',
  'Denunciar y bloquear',
  'Normas e información de seguridad',
];
const COMMUNITY_FREE_DE: typeof COMMUNITY_FREE_FR = [
  'Dein Community-Profil erstellen',
  'Text und bis zu 4 Fotos posten',
  'Kommentieren, antworten, liken',
  'Mitgliedern und Kategorien folgen',
  'Kategorien, Themengruppen und Monatsgruppen beitreten',
  'Umfragen erstellen und beantworten',
  'Benachrichtigungen bei Antworten und Erwähnungen erhalten',
  'Melden und blockieren',
  'Regeln und Sicherheitsinformationen',
];
const COMMUNITY_FREE_IT: typeof COMMUNITY_FREE_FR = [
  'Creare il tuo profilo nella community',
  'Pubblicare testo e fino a 4 foto',
  'Commentare, rispondere, mettere mi piace',
  'Seguire membri e categorie',
  'Unirti alle categorie, ai gruppi tematici e ai gruppi per mese',
  'Creare sondaggi e rispondere',
  'Ricevere le notifiche di risposte e menzioni',
  'Segnalare e bloccare',
  'Regole e informazioni sulla sicurezza',
];
export const COMMUNITY_FREE = localized(COMMUNITY_FREE_FR, COMMUNITY_FREE_EN, { es: COMMUNITY_FREE_ES, de: COMMUNITY_FREE_DE, it: COMMUNITY_FREE_IT });

const COMMUNITY_PREMIUM_FR = [
  'Profil personnalisé : couleur, bannière, présentation enrichie',
  'Badge Premium discret et facultatif',
  'Groupes privés et invitations',
  'Albums photo privés ou partagés avec des membres choisis',
  'Filtres avancés du fil et recherche avancée',
  'Journal d’activité complet',
  'Dossiers pour classer ses enregistrements',
  'Résumé des longues discussions et traduction (service d’IA à configurer côté serveur)',
  'Ateliers et rencontres réservés aux abonné·es',
];
const COMMUNITY_PREMIUM_EN: typeof COMMUNITY_PREMIUM_FR = [
  'Custom profile: colour, banner, rich introduction',
  'Discreet, optional Premium badge',
  'Private groups and invitations',
  'Photo albums, private or shared with chosen members',
  'Advanced feed filters and advanced search',
  'Full activity log',
  'Folders to organise your saved items',
  'Summaries of long discussions and translation (AI service to be configured on the server)',
  'Workshops and meet-ups for subscribers',
];
const COMMUNITY_PREMIUM_ES: typeof COMMUNITY_PREMIUM_FR = [
  'Perfil personalizado: color, banner, presentación ampliada',
  'Insignia Premium discreta y opcional',
  'Grupos privados e invitaciones',
  'Álbumes de fotos privados o compartidos con miembros elegidos',
  'Filtros avanzados del muro y búsqueda avanzada',
  'Registro de actividad completo',
  'Carpetas para ordenar tus guardados',
  'Resumen de las discusiones largas y traducción (servicio de IA que se configura en el servidor)',
  'Talleres y encuentros reservados a las personas suscritas',
];
const COMMUNITY_PREMIUM_DE: typeof COMMUNITY_PREMIUM_FR = [
  'Persönliches Profil: Farbe, Banner, ausführliche Vorstellung',
  'Dezentes, optionales Premium-Abzeichen',
  'Private Gruppen und Einladungen',
  'Fotoalben, privat oder mit ausgewählten Mitgliedern geteilt',
  'Erweiterte Feed-Filter und erweiterte Suche',
  'Vollständiges Aktivitätsprotokoll',
  'Ordner, um deine gespeicherten Beiträge zu sortieren',
  'Zusammenfassung langer Diskussionen und Übersetzung (KI-Dienst, der auf dem Server einzurichten ist)',
  'Workshops und Treffen nur für Abonnent·innen',
];
const COMMUNITY_PREMIUM_IT: typeof COMMUNITY_PREMIUM_FR = [
  'Profilo personalizzato: colore, banner, presentazione arricchita',
  'Badge Premium discreto e facoltativo',
  'Gruppi privati e inviti',
  'Album fotografici privati o condivisi con membri scelti',
  'Filtri avanzati del feed e ricerca avanzata',
  'Registro attività completo',
  'Cartelle per ordinare i tuoi salvataggi',
  'Riassunto delle discussioni lunghe e traduzione (servizio di IA da configurare sul server)',
  'Laboratori e incontri riservati agli abbonati e alle abbonate',
];
export const COMMUNITY_PREMIUM = localized(COMMUNITY_PREMIUM_FR, COMMUNITY_PREMIUM_EN, { es: COMMUNITY_PREMIUM_ES, de: COMMUNITY_PREMIUM_DE, it: COMMUNITY_PREMIUM_IT });
