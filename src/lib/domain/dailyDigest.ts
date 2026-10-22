/**
 * Résumé du matin et du soir (logique pure, testée).
 * Raisons UTILES de revenir : rendez-vous et rappels du jour, prochaine sieste estimée, prochain biberon, grossesse,
 * réponses reçues, activité des groupes, recette et articles adaptés, question du jour facultative, bilan du soir.
 * Règles : rien de culpabilisant (« vous n'avez rien noté » n'existe pas), rien d'inventé (une rubrique sans donnée
 * disparaît), aucun faux signal social. Les notifications ne contiennent aucun détail visible sur l'écran verrouillé.
 */

import { t as tr, type TKey } from '@/i18n';

export type DigestMoment = 'morning' | 'evening';
export const DIGEST_ITEMS = ['events', 'sleep', 'bottle', 'pregnancy', 'groups', 'replies', 'recipes', 'articles', 'question'] as const;
export type DigestItemKey = (typeof DIGEST_ITEMS)[number] | 'day';

/** Libellés des rubriques, traduits à la lecture (langue courante). */
export const DIGEST_ITEM_LABEL: Record<(typeof DIGEST_ITEMS)[number], string> = {} as Record<(typeof DIGEST_ITEMS)[number], string>;
for (const k of DIGEST_ITEMS) {
  Object.defineProperty(DIGEST_ITEM_LABEL, k, { enumerable: true, get: () => tr(`dom.digest.item.${k}` as TKey) });
}

export interface DigestInput {
  moment: DigestMoment;
  now: Date;
  hidden?: string[];
  questionEnabled?: boolean;
  firstName?: string | null;
  childName?: string | null;
  childId?: string | null;
  events?: { title: string; at: string; link?: string }[];
  nextNap?: { at: string } | null;
  /** Sommeil noté depuis plusieurs jours sans le planificateur : proposer le rythme personnalisé (aperçu Premium) */
  sleepPlannerTeaser?: boolean;
  nextBottle?: { at: string } | null;
  pregnancy?: { label: string; detail?: string | null } | null;
  groupPosts?: number;
  unreadReplies?: number;
  recipe?: { title: string; slug: string } | null;
  articles?: { title: string; slug: string }[];
  day?: { bottles: number; bottleMl: number; feeds: number; diapers: number; sleepMinutes: number; meals: number } | null;
  scope?: string;
}

export interface DigestItem { key: DigestItemKey; icon: string; title: string; detail?: string; link?: string; premium?: boolean }
export interface Digest { title: string; subtitle: string; items: DigestItem[] }

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (iso: string) => {
  const d = new Date(iso);
  return d.getMinutes() ? tr('dom.time.hm', { h: String(d.getHours()), m: pad(d.getMinutes()) }) : tr('dom.time.h', { h: String(d.getHours()) });
};
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** Forme plurielle d'une clé (en français, 0 et 1 sont au singulier). */
const plural = (key: TKey, n: number, extra?: Record<string, string>) => tr(key, { count: String(n), ...extra });

export function sleepLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return tr('dom.span.min', { m: String(m) });
  return m ? tr('dom.span.hm', { h: String(h), m: pad(m) }) : tr('dom.span.h', { h: String(h) });
}

// ─── Question du jour (facultative, sans jugement) ─────────────────────────────────────────────────

const QUESTIONS_COMMON = [1, 2, 3, 4, 5, 6, 7].map((n) => `dom.question.common.q${n}` as TKey);
const qs = (scope: string, count: number) => Array.from({ length: count }, (_, n) => `dom.question.${scope}.q${n + 1}` as TKey);
const QUESTIONS_BY_SCOPE: Record<string, TKey[]> = {
  pregnancy: qs('pregnancy', 3),
  baby: qs('baby', 3),
  postpartum: qs('postpartum', 2),
  child: qs('child', 2),
  family: qs('family', 2),
  ttc: qs('ttc', 2),
};

export function questionOfDay(date: Date, scope?: string): string {
  const list = [...(QUESTIONS_BY_SCOPE[scope ?? ''] ?? []), ...QUESTIONS_COMMON];
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return tr(list[day % list.length]);
}

// ─── Construction ──────────────────────────────────────────────────────────────────────────────────

export function buildDigest(i: DigestInput): Digest {
  const hidden = new Set(i.hidden ?? []);
  const show = (k: string) => !hidden.has(k);
  const items: DigestItem[] = [];
  const today = (iso: string) => sameDay(new Date(iso), i.now);

  if (i.moment === 'evening' && i.day) {
    const d = i.day;
    const parts = [
      d.bottles ? (d.bottleMl ? plural('dom.digest.day.bottlesMl', d.bottles, { ml: String(d.bottleMl) }) : plural('dom.digest.day.bottles', d.bottles)) : null,
      d.feeds ? plural('dom.digest.day.feeds', d.feeds) : null,
      d.diapers ? plural('dom.digest.day.diapers', d.diapers) : null,
      d.sleepMinutes ? tr('dom.digest.day.sleep', { duration: sleepLabel(d.sleepMinutes) }) : null,
      d.meals ? plural('dom.digest.day.meals', d.meals) : null,
    ].filter(Boolean) as string[];
    // Rien de noté : la rubrique disparaît (jamais de reproche)
    if (parts.length) items.push({ key: 'day', icon: 'sun', title: i.childName ? tr('dom.digest.day.titleChild', { name: i.childName }) : tr('dom.digest.day.title'), detail: parts.join(' · '), link: '/track' });
  }

  if (show('events')) {
    const list = (i.events ?? []).filter((e) => (i.moment === 'morning' ? today(e.at) : Date.parse(e.at) > i.now.getTime() && Date.parse(e.at) - i.now.getTime() < 36 * 3_600_000))
      .sort((a, b) => a.at.localeCompare(b.at));
    if (list.length) {
      items.push({ key: 'events', icon: 'calendar', title: i.moment === 'morning' ? (list.length > 1 ? tr('dom.digest.events.countToday', { n: String(list.length) }) : tr('dom.digest.events.today')) : tr('dom.digest.events.tomorrow'),
        detail: list.slice(0, 3).map((e) => tr('dom.digest.events.item', { title: e.title, time: hm(e.at) })).join(' · '), link: list[0].link ?? '/calendar' });
    }
  }
  if (show('sleep')) {
    if (i.nextNap && Date.parse(i.nextNap.at) > i.now.getTime()) {
      items.push({ key: 'sleep', icon: 'moon', title: tr('dom.digest.sleep.nextNap', { time: hm(i.nextNap.at) }), detail: tr('dom.digest.sleep.nextNapDetail'), link: i.childId ? `/sleep/${i.childId}` : '/track' });
    } else if (i.sleepPlannerTeaser && i.moment === 'morning') {
      items.push({ key: 'sleep', icon: 'moon', title: i.childName ? tr('dom.digest.sleep.teaserChild', { name: i.childName }) : tr('dom.digest.sleep.teaser'), detail: tr('dom.digest.sleep.teaserDetail'), link: i.childId ? `/sleep/${i.childId}` : '/track', premium: true });
    }
  }
  if (show('bottle') && i.nextBottle && Date.parse(i.nextBottle.at) > i.now.getTime()) {
    items.push({ key: 'bottle', icon: 'clock', title: tr('dom.digest.bottle.next', { time: hm(i.nextBottle.at) }), detail: tr('dom.digest.bottle.nextDetail'), link: '/bottle' });
  }
  if (show('pregnancy') && i.pregnancy && i.moment === 'morning') {
    items.push({ key: 'pregnancy', icon: 'heart', title: i.pregnancy.label, detail: i.pregnancy.detail ?? undefined, link: '/pregnancy' });
  }
  if (show('replies') && (i.unreadReplies ?? 0) > 0) {
    items.push({ key: 'replies', icon: 'message-circle', title: plural('dom.digest.replies.title', i.unreadReplies!), detail: tr('dom.digest.replies.detail'), link: '/notifications' });
  }
  if (show('groups') && (i.groupPosts ?? 0) > 0) {
    items.push({ key: 'groups', icon: 'users', title: plural('dom.digest.groups.title', i.groupPosts!), link: '/community/groups' });
  }
  if (show('recipes') && i.recipe && i.moment === 'morning') items.push({ key: 'recipes', icon: 'coffee', title: tr('dom.digest.recipes.title'), detail: i.recipe.title, link: `/meals/${i.recipe.slug}` });
  if (show('articles') && i.articles?.length && i.moment === 'morning') {
    items.push({ key: 'articles', icon: 'book-open', title: tr('dom.digest.articles.title'), detail: i.articles.slice(0, 2).map((a) => a.title).join(' · '), link: `/article/${i.articles[0].slug}` });
  }
  if (show('question') && i.questionEnabled !== false) {
    items.push({ key: 'question', icon: 'help-circle', title: tr('dom.digest.question.title'), detail: questionOfDay(i.now, i.scope) });
  }
  const greet = (m: DigestMoment) => (i.firstName ? tr(`dom.digest.${m}.titleName` as TKey, { name: i.firstName }) : tr(`dom.digest.${m}.title` as TKey));
  return i.moment === 'morning'
    ? { title: greet('morning'), subtitle: items.length ? tr('dom.digest.morning.subtitle') : tr('dom.digest.morning.subtitleEmpty'), items }
    : { title: greet('evening'), subtitle: tr('dom.digest.evening.subtitle'), items };
}

/** Texte des notifications : générique, sans aucune donnée personnelle sur l'écran verrouillé. */
const notification = (m: DigestMoment) => {
  const o = {} as { title: string; body: string };
  Object.defineProperty(o, 'title', { enumerable: true, get: () => tr(`dom.digest.notif.${m}Title` as TKey) });
  Object.defineProperty(o, 'body', { enumerable: true, get: () => tr(`dom.digest.notif.${m}Body` as TKey) });
  return o;
};
export const DIGEST_NOTIFICATION: Record<DigestMoment, { title: string; body: string }> = {
  morning: notification('morning'),
  evening: notification('evening'),
};

/** « 08:00 » → { hour, minute } (refuse un format invalide). */
export function parseTime(t: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? '');
  if (!m) return null;
  const hour = Number(m[1]); const minute = Number(m[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

/** Minutes de sommeil comprises dans la journée (un sommeil commencé la veille compte pour sa part du jour). */
export function sleepMinutesToday(sleeps: { started_at: string; ended_at: string | null }[], now: Date): number {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let total = 0;
  for (const s of sleeps) {
    const a = Math.max(Date.parse(s.started_at), from);
    const b = Math.min(s.ended_at ? Date.parse(s.ended_at) : now.getTime(), now.getTime());
    if (b > a) total += (b - a) / 60_000;
  }
  return Math.round(total);
}

