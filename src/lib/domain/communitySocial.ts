/**
 * Mini-réseau social de la communauté (logique pure, testée) :
 * mentions @identifiant, groupes par mois de naissance ou de terme prévu, fil « Pour vous » personnalisé,
 * fil « Abonnements », discussions recommandées.
 *
 * Confidentialité : le classement est calculé SUR LE TÉLÉPHONE. L'âge des enfants, la semaine de grossesse et les
 * sujets consultés servent à ordonner ce que la personne voit ; ils ne sont jamais publiés ni envoyés aux autres membres.
 * Pas de concours de popularité : la participation compte peu (logarithme), aucune autrice n'est « mise en avant ».
 */

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
export function cohortName(type: CohortType, month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${type === 'birth' ? 'Bébés nés en' : 'Terme prévu en'} ${MONTHS[m - 1]} ${y}`;
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
    if (d >= -2 && d <= 10) out.push({ type: 'due', month: m, label: cohortName('due', m), reason: 'D’après votre terme prévu' });
  }
  for (const b of input.childBirthDates) {
    const m = monthOf(b);
    const d = monthsBetween(m, current);
    if (d >= 0 && d <= 72 && !out.some((x) => x.type === 'birth' && x.month === m)) out.push({ type: 'birth', month: m, label: cohortName('birth', m), reason: 'D’après le mois de naissance' });
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
  if (p.following_author && !p.anonymous) return 'Vous suivez ce membre';
  if (p.group_id && s.groupIds?.includes(p.group_id)) return 'Dans un groupe que vous avez rejoint';
  if (s.subscribedForumIds.includes(p.forum_id)) return 'Catégorie suivie';
  if (p.forum_slug && hints.includes(p.forum_slug)) return 'Selon l’âge de votre enfant ou votre grossesse';
  if (s.journeyForumIds.includes(p.forum_id)) return 'Selon votre parcours';
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
  if (clean.length < 2) return 'Ajoutez au moins deux choix.';
  if (clean.length > 6) return '6 choix au plus.';
  if (clean.some((o) => o.length > 80)) return 'Chaque choix : 80 caractères au plus.';
  if (new Set(clean.map((o) => o.toLowerCase())).size !== clean.length) return 'Deux choix sont identiques.';
  return null;
}

export const pollPercent = (votes: number, total: number) => (total > 0 ? Math.round((votes / total) * 100) : 0);

// ─── Personnalisation Premium ──────────────────────────────────────────────────────────────────────

/** Couleurs d'accent proposées : reprises de la palette existante (aucune nouvelle couleur de l'application). */
export const PROFILE_ACCENTS = ['rose', 'lavande', 'menthe', 'peche', 'ciel', 'sable'] as const;
export const PROFILE_BANNERS = ['aube', 'nuit', 'prairie', 'ocean', 'nacre'] as const;
export type ProfileAccent = (typeof PROFILE_ACCENTS)[number];
export type ProfileBanner = (typeof PROFILE_BANNERS)[number];
export const ACCENT_LABEL: Record<ProfileAccent, string> = { rose: 'Rose', lavande: 'Lavande', menthe: 'Menthe', peche: 'Pêche', ciel: 'Ciel', sable: 'Sable' };
export const BANNER_LABEL: Record<ProfileBanner, string> = { aube: 'Aube', nuit: 'Nuit étoilée', prairie: 'Prairie', ocean: 'Océan', nacre: 'Nacre' };

// ─── Gratuit / Premium ─────────────────────────────────────────────────────────────────────────────

/** La communauté de base reste gratuite pour pouvoir grandir (vérifié par les tests). */
export const COMMUNITY_FREE = [
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

export const COMMUNITY_PREMIUM = [
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
