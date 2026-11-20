/**
 * HOMI Aura — logique pure de l'application (testée : src/__tests__/aura.test.ts).
 *
 *  - entrées thématiques (liste des 200) : contexte, suggestions et outils mis en avant, route `/assistant?theme=<id>` ;
 *  - mode : en ligne (IA serveur), démonstration (réponses simulées, aucune IA) ou LOCAL (repli honnête : recherche
 *    par mots dans les outils et les articles, sans faire semblant de comprendre) ;
 *  - coût affiché AVANT chaque demande coûteuse (même règle que le serveur : aura-data.ts) ;
 *  - cartes d'action : jamais exécutées sans confirmation ; préparation des écritures confirmées ;
 *  - minimisation des journaux choisis.
 */
import type { TKey } from '@/i18n';
import type { ActiveSubject } from '@/lib/store';
import type { MoodCheckin } from '@/lib/types';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import type { SearchOutcome } from '@/lib/domain/toolSearch';
import type { LocalAnswer } from '@/lib/localAI/engine';
import { AURA_THEMES, AURA_THEME_IDS, toAuraTheme, type AuraTheme } from '../../../supabase/functions/_shared/aura-prompt';
import { auraCreditAction } from '../../../supabase/functions/_shared/aura-data';
import { MAX_ENTRY_TEXT, MAX_JOURNAL_ENTRIES } from '../../../supabase/functions/_shared/aura-data';
import type { AuraAction, AuraCatalogEntry } from '../../../supabase/functions/_shared/aura-tools';
import type { CreditAction } from '@/lib/credits/model';

export { AURA_THEMES, AURA_THEME_IDS, toAuraTheme, type AuraTheme, type AuraAction };

/** Outils mis en avant par thème (identifiants du registre ; seuls ceux du profil affiché sont montrés). */
export const AURA_THEME_TOOLS: Record<AuraTheme, string[]> = {
  fertility: ['ttc_cycle', 'ttc_tests', 'ttc_exams', 'ttc_consult', 'pma_tracker'],
  pregnancy: ['preg_evolution', 'preg_calendar', 'preg_moves', 'preg_lists'],
  postpartum: ['pp_recovery', 'pp_checkin', 'pp_mental', 'pp_support'],
  breastfeeding: ['baby_breastfeed', 'baby_night_help', 'guides'],
  baby_health: ['kid_health', 'kid_vaccines', 'kid_grow', 'kid_treatments', 'emergency'],
  diversification: ['baby_foods', 'meal_menu', 'family_shopping'],
  education: ['kid_steps', 'kid_school', 'kid_routines', 'nearby'],
  emotion_translator: ['couple_understand', 'couple_week'],
  household: ['mental_load', 'family_domains', 'family_missions', 'family_calendar', 'brain_dump'],
  personal: ['family_calendar', 'reminders', 'brain_dump', 'family_shopping', 'journal'],
  discovery: [],
};

export const themeName = (th: AuraTheme): TKey => `aura.t.${th}` as TKey;
export const themeSuggestions = (th: AuraTheme): TKey[] => [1, 2, 3].map((i) => `aura.t.${th}.s${i}` as TKey);

/** Route d'une entrée thématique (à brancher dans le registre). */
export const auraRoute = (th?: AuraTheme | null) => (th ? `/assistant?theme=${th}` : '/assistant');

/** Sans thème : suggestions du profil affiché (empruntées au thème le plus proche). */
export function defaultThemeFor(subject: ActiveSubject | null | undefined, opts: { childMonths?: number | null } = {}): AuraTheme {
  switch (subject?.type) {
    case 'pregnancy': return 'pregnancy';
    case 'postpartum': return 'postpartum';
    case 'child': return opts.childMonths != null && opts.childMonths < 12 ? 'baby_health' : 'education';
    case 'family': return 'household';
    default: return 'personal';
  }
}

// ---------------------------------------------------------------- mode

export type AuraMode = 'online' | 'demo' | 'local';
/**
 * - IA serveur ouverte (interrupteur de l'application) → en ligne ;
 * - démonstration sans serveur → réponses SIMULÉES sur l'appareil (aucune IA), signalées comme telles ;
 * - sinon, ou si le serveur a répondu « IA indisponible », ou si la personne l'a choisi → local.
 */
export function auraMode(o: { aiOnline: boolean; demoBackend: boolean; forceLocal?: boolean; serverOff?: boolean }): AuraMode {
  if (o.forceLocal || o.serverOff) return 'local';
  if (o.aiOnline) return 'online';
  return o.demoBackend ? 'demo' : 'local';
}

/** Erreurs qui font passer Aura en mode local pour la session (IA coupée, non configurée, « bientôt »). */
export const isServerOff = (code: unknown) => ['ai_not_configured', 'coming_soon', 'ai_disabled'].includes(String(code ?? ''));
/** Erreurs réseau (rien n'a été envoyé : la même clé est réutilisée pour réessayer). */
export const isNetworkError = (code: unknown) => ['network', 'timeout', 'offline', 'fetch_failed'].includes(String(code ?? ''));

// ---------------------------------------------------------------- coût

export type AuraRequestKind = 'chat' | 'reformulate' | 'analysis';
/** Action facturée d'une demande — identique au serveur (aura-data.ts). */
export function creditActionFor(kind: AuraRequestKind, o: { journal?: boolean; analysis?: 'sleep' | 'cycle' | 'mood' | 'diary' | 'load' | null } = {}): CreditAction {
  return auraCreditAction(kind, { journal: !!o.journal, analysis: o.analysis ?? null });
}

// ---------------------------------------------------------------- catalogue envoyé au serveur

/** Catalogue minimal (identifiant, nom, phrase, mots-clés, route) : aucune donnée personnelle. */
export function catalogForServer(tools: readonly CatalogTool[], words: (id: string) => string): AuraCatalogEntry[] {
  return tools.filter((t) => !t.locked && t.href).slice(0, 300).map((t) => ({ id: t.id, name: t.label, blurb: t.sub ?? '', words: words(t.id).slice(0, 300), route: t.href.replace('/(tabs)', '') || '/' }));
}

/** Outils mis en avant d'un thème, dans l'ordre, parmi ceux du profil affiché. */
export function featuredFor(theme: AuraTheme | null, tools: readonly CatalogTool[]): CatalogTool[] {
  if (!theme) return [];
  const byId = new Map(tools.map((t) => [t.id, t]));
  return AURA_THEME_TOOLS[theme].map((id) => byId.get(id)).filter((t): t is CatalogTool => !!t && !t.locked);
}

// ---------------------------------------------------------------- repli local (sans IA)

export interface LocalReply {
  kind: 'local';
  tools: CatalogTool[];
  article: { slug: string; title: string; excerpt: string } | null;
  /** Faux : ni outil ni article ne correspond aux mots écrits (l'écran le dit). */
  found: boolean;
}

/** Réponse locale HONNÊTE : outils trouvés par mots et article le plus proche ; jamais une phrase inventée. */
export function localReply(search: SearchOutcome, article: LocalAnswer | null): LocalReply {
  const tools = search.understood ? search.results.slice(0, 3).map((h) => h.tool) : [];
  const a = article && article.kind === 'answer' && article.main && article.confidence >= 0.2
    ? { slug: article.main.slug, title: article.main.title, excerpt: excerpt(article.answer ?? '') }
    : null;
  return { kind: 'local', tools, article: a, found: tools.length > 0 || !!a };
}
const excerpt = (md: string) => {
  const s = md.replace(/[#*_>`[\]]/g, '').replace(/\((https?:[^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
  return s.length > 220 ? `${s.slice(0, 219)}…` : s;
};

// ---------------------------------------------------------------- cartes d'action → écritures confirmées

/** Événement d'agenda à partir d'une proposition RELUE (et éventuellement modifiée) par la personne. */
export function eventInputFrom(a: { title: string; date: string; time: string | null; duration_minutes: number | null; notes: string | null }) {
  const allDay = !a.time;
  const start = allDay ? new Date(`${a.date}T00:00:00`) : new Date(`${a.date}T${a.time}:00`);
  if (!a.title.trim() || Number.isNaN(start.getTime())) return null;
  const end = allDay ? null : new Date(start.getTime() + (a.duration_minutes ?? 60) * 60_000);
  return {
    title: a.title.trim().slice(0, 80), kind: 'custom' as const, starts_at: start.toISOString(), ends_at: end ? end.toISOString() : null, all_day: allDay,
    location_label: null, notes: a.notes, recurrence: null, child_id: null,
  };
}

/** Mission à partir d'une proposition relue ; jamais assignée d'office à quelqu'un. */
export function missionInputFrom(a: { title: string; category: string; due_date: string | null; notes: string | null }) {
  if (!a.title.trim()) return null;
  return {
    title: a.title.trim().slice(0, 80), assignee_id: null, category: a.category as never, notes: a.notes,
    due_at: a.due_date ? new Date(`${a.due_date}T18:00:00`).toISOString() : null, all_day: false,
  };
}

/** Une carte d'action n'écrit jamais rien : seules ces actions ouvrent une feuille de confirmation avant écriture. */
export const WRITES_AFTER_CONFIRM: AuraAction['type'][] = ['calendar_event', 'mission'];

// ---------------------------------------------------------------- journaux choisis (minimisés)

/** Entrées CHOISIES d'un journal, minimisées : date, humeur, ressentis (mots-clés), texte tronqué (journal intime). */
export function journalPayload(kind: 'mood' | 'diary', rows: readonly MoodCheckin[], chosen: ReadonlySet<string>) {
  const entries = rows.filter((r) => chosen.has(r.id)).slice(0, MAX_JOURNAL_ENTRIES).map((r) => ({
    date: r.checked_at.slice(0, 10), mood: r.mood, feelings: r.feelings.filter((f) => /^[a-z][a-z0-9_]{1,30}$/.test(f)).slice(0, 8),
    text: kind === 'diary' ? (r.journal ?? '').slice(0, MAX_ENTRY_TEXT) : '',
  }));
  return { journal: kind, entries };
}
