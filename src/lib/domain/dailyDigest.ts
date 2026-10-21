/**
 * Résumé du matin et du soir (logique pure, testée).
 * Raisons UTILES de revenir : rendez-vous et rappels du jour, prochaine sieste estimée, prochain biberon, grossesse,
 * réponses reçues, activité des groupes, recette et articles adaptés, question du jour facultative, bilan du soir.
 * Règles : rien de culpabilisant (« vous n'avez rien noté » n'existe pas), rien d'inventé (une rubrique sans donnée
 * disparaît), aucun faux signal social. Les notifications ne contiennent aucun détail visible sur l'écran verrouillé.
 */

export type DigestMoment = 'morning' | 'evening';
export const DIGEST_ITEMS = ['events', 'sleep', 'bottle', 'pregnancy', 'groups', 'replies', 'recipes', 'articles', 'question'] as const;
export type DigestItemKey = (typeof DIGEST_ITEMS)[number] | 'day';

export const DIGEST_ITEM_LABEL: Record<(typeof DIGEST_ITEMS)[number], string> = {
  events: 'Rendez-vous et rappels du jour', sleep: 'Prochaine sieste estimée', bottle: 'Prochain biberon', pregnancy: 'Évolution de la grossesse',
  groups: 'Activité de vos groupes', replies: 'Réponses reçues', recipes: 'Recette adaptée', articles: 'Articles sélectionnés', question: 'Question du jour',
};

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

const hm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours()} h${d.getMinutes() ? ` ${String(d.getMinutes()).padStart(2, '0')}` : ''}`;
};
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

export function sleepLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}` : `${m} min`;
}

// ─── Question du jour (facultative, sans jugement) ─────────────────────────────────────────────────

const QUESTIONS_COMMON = [
  'Quel petit moment de la journée vous a fait du bien ?',
  'Qu’est-ce qui vous aide quand la fatigue se fait sentir ?',
  'Une astuce d’organisation que vous aimeriez partager ?',
  'De quoi êtes-vous fière ou fier cette semaine, même de tout petit ?',
  'Qui vous a aidé·e récemment, et comment ?',
  'Quel conseil auriez-vous aimé recevoir au début ?',
  'Qu’est-ce qui vous fait sourire en ce moment ?',
];
const QUESTIONS_BY_SCOPE: Record<string, string[]> = {
  pregnancy: ['Comment imaginez-vous vos premiers jours avec bébé ?', 'Qu’avez-vous déjà préparé, et que reste-t-il à faire ?', 'Quelle question aimeriez-vous poser à votre sage-femme ?'],
  baby: ['Quel rituel du coucher fonctionne chez vous ?', 'Quelle a été la plus belle découverte de votre bébé cette semaine ?', 'Comment vous organisez-vous pour vous reposer ?'],
  postpartum: ['Comment prenez-vous soin de vous ces jours-ci ?', 'Qu’est-ce qui vous a le plus aidée depuis la naissance ?'],
  child: ['Quelle activité simple plaît le plus à votre enfant ?', 'Comment se passent les repas en famille en ce moment ?'],
  family: ['Comment partagez-vous les tâches à la maison ?', 'Un moment en famille que vous aimez particulièrement ?'],
  ttc: ['Qu’est-ce qui vous aide à garder le moral ?', 'Comment prenez-vous soin de votre couple pendant l’attente ?'],
};

export function questionOfDay(date: Date, scope?: string): string {
  const list = [...(QUESTIONS_BY_SCOPE[scope ?? ''] ?? []), ...QUESTIONS_COMMON];
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return list[day % list.length];
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
      d.bottles ? `${plural(d.bottles, 'biberon', 'biberons')}${d.bottleMl ? ` (${d.bottleMl} ml)` : ''}` : null,
      d.feeds ? plural(d.feeds, 'tétée', 'tétées') : null,
      d.diapers ? plural(d.diapers, 'change', 'changes') : null,
      d.sleepMinutes ? `${sleepLabel(d.sleepMinutes)} de sommeil` : null,
      d.meals ? plural(d.meals, 'repas', 'repas') : null,
    ].filter(Boolean) as string[];
    // Rien de noté : la rubrique disparaît (jamais de reproche)
    if (parts.length) items.push({ key: 'day', icon: 'sun', title: i.childName ? `La journée de ${i.childName}` : 'Votre journée', detail: parts.join(' · '), link: '/track' });
  }

  if (show('events')) {
    const list = (i.events ?? []).filter((e) => (i.moment === 'morning' ? today(e.at) : Date.parse(e.at) > i.now.getTime() && Date.parse(e.at) - i.now.getTime() < 36 * 3_600_000))
      .sort((a, b) => a.at.localeCompare(b.at));
    if (list.length) {
      items.push({ key: 'events', icon: 'calendar', title: i.moment === 'morning' ? (list.length > 1 ? `${list.length} rendez-vous ou rappels aujourd’hui` : 'Aujourd’hui') : 'Demain',
        detail: list.slice(0, 3).map((e) => `${e.title} à ${hm(e.at)}`).join(' · '), link: list[0].link ?? '/calendar' });
    }
  }
  if (show('sleep')) {
    if (i.nextNap && Date.parse(i.nextNap.at) > i.now.getTime()) {
      items.push({ key: 'sleep', icon: 'moon', title: `Prochaine sieste estimée vers ${hm(i.nextNap.at)}`, detail: 'Une estimation, à ajuster selon les signes de fatigue.', link: i.childId ? `/sleep/${i.childId}` : '/track' });
    } else if (i.sleepPlannerTeaser && i.moment === 'morning') {
      items.push({ key: 'sleep', icon: 'moon', title: i.childName ? `Découvrez le rythme personnalisé de ${i.childName}` : 'Découvrez son rythme personnalisé', detail: 'Calculé à partir des siestes que vous avez notées.', link: i.childId ? `/sleep/${i.childId}` : '/track', premium: true });
    }
  }
  if (show('bottle') && i.nextBottle && Date.parse(i.nextBottle.at) > i.now.getTime()) {
    items.push({ key: 'bottle', icon: 'clock', title: `Prochain biberon vers ${hm(i.nextBottle.at)}`, detail: 'Selon le minuteur que vous avez réglé.', link: '/bottle' });
  }
  if (show('pregnancy') && i.pregnancy && i.moment === 'morning') {
    items.push({ key: 'pregnancy', icon: 'heart', title: i.pregnancy.label, detail: i.pregnancy.detail ?? undefined, link: '/pregnancy' });
  }
  if (show('replies') && (i.unreadReplies ?? 0) > 0) {
    items.push({ key: 'replies', icon: 'message-circle', title: plural(i.unreadReplies!, 'nouvelle réponse', 'nouvelles réponses'), detail: 'Dans la communauté', link: '/notifications' });
  }
  if (show('groups') && (i.groupPosts ?? 0) > 0) {
    items.push({ key: 'groups', icon: 'users', title: plural(i.groupPosts!, 'nouvelle publication', 'nouvelles publications') + ' dans vos groupes', link: '/community/groups' });
  }
  if (show('recipes') && i.recipe && i.moment === 'morning') items.push({ key: 'recipes', icon: 'coffee', title: 'Une idée de repas', detail: i.recipe.title, link: `/meals/${i.recipe.slug}` });
  if (show('articles') && i.articles?.length && i.moment === 'morning') {
    items.push({ key: 'articles', icon: 'book-open', title: 'À lire aujourd’hui', detail: i.articles.slice(0, 2).map((a) => a.title).join(' · '), link: `/article/${i.articles[0].slug}` });
  }
  if (show('question') && i.questionEnabled !== false) {
    items.push({ key: 'question', icon: 'help-circle', title: 'Question du jour', detail: questionOfDay(i.now, i.scope) });
  }
  const first = i.firstName ? `, ${i.firstName}` : '';
  return i.moment === 'morning'
    ? { title: `Bonjour${first}`, subtitle: items.length ? 'Ce qui compte aujourd’hui' : 'Rien de prévu de particulier aujourd’hui.', items }
    : { title: `Bonsoir${first}`, subtitle: 'La journée en bref', items };
}

/** Texte des notifications : générique, sans aucune donnée personnelle sur l'écran verrouillé. */
export const DIGEST_NOTIFICATION: Record<DigestMoment, { title: string; body: string }> = {
  morning: { title: 'Votre résumé du matin', body: 'Rendez-vous, rappels et nouveautés de la journée.' },
  evening: { title: 'Votre journée en bref', body: 'Un résumé de la journée, quand vous avez un moment.' },
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

