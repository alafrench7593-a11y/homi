/**
 * Aura — intentions LOCALES (pures, testées : src/__tests__/auraIntents.test.ts).
 *
 * Les demandes évidentes d'un parent (« mon bébé prend le sein », « j'ai mis 14 h 35 mais elle s'est réveillée à
 * 14 h 20 », « je passe le relais à son père », « où j'ajoute son poids ? ») sont reconnues SUR LE TÉLÉPHONE, sans
 * appel au modèle ni crédit, en français et en anglais. Elles produisent un IDENTIFIANT D'ACTION reconnu par HOMI ;
 * la destination est calculée ici, à partir des données et des droits ACTUELS, au moment de l'affichage ET de l'appui
 * (`resolveIntent`). Rien n'est enregistré, supprimé ou transmis par une carte : elle ouvre l'écran (ou le brouillon)
 * où le parent décide.
 */
import { foldText } from '@/lib/domain/toolSearch';
import { isDayNap, type SleepLike } from '@/lib/domain/sleepSummary';

export type Metric = 'weight_kg' | 'height_cm' | 'head_cm';

export type AuraIntent =
  | { kind: 'open_tool'; toolId: string; childId?: string | null }
  | { kind: 'fix_sleep_end'; wrong: string | null; right: string | null; childId?: string | null; sleepId?: string | null }
  | { kind: 'prepare_relay'; childId?: string | null }
  | { kind: 'add_measure'; metric: Metric; childId?: string | null }
  | { kind: 'switch_child' }
  | { kind: 'profile_tools'; profile: 'pregnancy' };

/** Identifiants d'action reconnus par HOMI (le modèle ne peut proposer QUE ceux-ci). */
export const AURA_INTENT_KINDS = ['open_tool', 'fix_sleep_end', 'prepare_relay', 'add_measure', 'switch_child', 'profile_tools'] as const;

// ---------------------------------------------------------------- reconnaissance

const has = (s: string, re: RegExp) => re.test(s);
/** Mots du quotidien → outil (français et anglais, accents et majuscules ignorés). */
export const EVERYDAY_TOOLS: { toolId: string; re: RegExp }[] = [
  { toolId: 'baby_breastfeed', re: /\b(sein|seins|tete|tetee|tetees|allait\w*|mise au sein|breast\w*|nurs(e|es|ing)|latch\w*)\b/ },
  { toolId: 'baby_bottle', re: /\b(bib|bibs|bibi|biberon\w*|bottle\w*|formula|lait infantile)\b/ },
  { toolId: 'baby_diaper', re: /\b(couche\w*|change|changee?|caca|pipi|selles?|diaper\w*|nappy|nappies|poop\w*)\b/ },
  { toolId: 'kid_sleep_rhythm', re: /\b(sieste\w*|dodo|dort|endormi\w*|couche pour dormir|nap|naps|napping|asleep|fell asleep)\b/ },
];

/** Heures citées, dans l'ordre (« 14 h 35 », « 14h20 », « 2:20 pm », « 9 h ») → « HH:MM ». */
export function timesIn(text: string): string[] {
  const out: string[] = [];
  const re = /\b([01]?\d|2[0-3])\s*(?:h|:|heures?)\s*([0-5]\d)?\s*(am|pm|a\.m\.|p\.m\.)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    let h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    const ap = (m[3] ?? '').toLowerCase().replace(/\./g, '');
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    out.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return out;
}

const EXPLAIN = /^\s*(comment (utiliser|fonctionne|marche|ca marche|ca fonctionne|on utilise|s'utilise|s’utilise)|a quoi sert|a quoi servent|c'est quoi|c’est quoi|qu'est-ce que|qu’est-ce que|how (do i|do you|to) use|how does|what is .* for|what's .* for|what does .* do)\b/;

export function matchIntent(question: string): AuraIntent | null {
  const q = foldText(question);
  // Questions d'EXPLICATION (« Comment utiliser Biberon ? », « À quoi sert le relais ? », bouton « Comment ça marche ? »
  // des outils) : Aura explique, elle ne répond pas par une carte « Ouvrir » (audit du 23/11/2026)
  if (EXPLAIN.test(q)) return null;
  const times = timesIn(question);
  const sleepy = has(q, /\b(sieste\w*|dodo|dormi\w*|dort|endormi\w*|reveil\w*|nap|naps|slept|asleep|woke|wake|waking|sleep\w*)\b/);
  const fixCue = has(q, /\b(mis|mise|note|notee|saisi\w*|corrig\w*|tromp\w*|erreur|en fait|mais|plutot|wrong|actually|but|instead|fix|typed|entered|logged)\b/);
  // 1) Corriger la fin d'une sieste : une heure + le sommeil + un indice de correction
  if (times.length && sleepy && (fixCue || times.length >= 2)) {
    return { kind: 'fix_sleep_end', wrong: times.length >= 2 ? times[0] : null, right: times[times.length - 1] };
  }
  // 1 bis) « Je me suis trompé sur sa dernière sieste » (sans heure) : la bonne entrée s'ouvre sur sa modification
  if (sleepy && has(q, /\b(tromp\w*|erreur|corrig\w*|modifi\w*|rectifi\w*|wrong|mistake|fix|edit|correct)\b/)) {
    return { kind: 'fix_sleep_end', wrong: null, right: null };
  }
  // 2) Relais
  if (has(q, /\b(relais|relaye\w*|transmet\w*|transmission|handover|hand over|handoff|hand off)\b/) || has(q, /\bpass\w* (le relais|the baton)\b/)) {
    return { kind: 'prepare_relay' };
  }
  // 3) Changer d'enfant
  if (has(q, /\b(chang\w*|passer|bascul\w*|switch\w*|select\w*|choisi\w*)\b.{0,24}\b(enfant|profil|child|kid|bebe|baby|fille|fils)\b/) || has(q, /\b(autre enfant|other child|another child)\b/)) {
    return { kind: 'switch_child' };
  }
  // 4) Mesures
  if (has(q, /\b(poids|pese\w*|peser|kilos?|kg|weigh\w*|weight)\b/)) return { kind: 'add_measure', metric: 'weight_kg' };
  if (has(q, /\b(taille|mesure\w* (sa )?taille|height|length|cm\b)\b/) && !has(q, /\b(crane|cranien|head)\b/)) return { kind: 'add_measure', metric: 'height_cm' };
  if (has(q, /\b(perimetre|cranien|tour de tete|head circumference)\b/)) return { kind: 'add_measure', metric: 'head_cm' };
  // 5) Que faire pendant la grossesse
  if (has(q, /\b(enceinte|grossesse|pregnan\w*)\b/) && has(q, /\b(quoi|que|outils?|faire|peux|what|which|tools?|can i|help)\b/)) {
    return { kind: 'profile_tools', profile: 'pregnancy' };
  }
  // 6) Mots du quotidien → outil
  for (const e of EVERYDAY_TOOLS) if (e.re.test(q)) return { kind: 'open_tool', toolId: e.toolId };
  return null;
}

// ---------------------------------------------------------------- droits

export type Domain = 'daily' | 'health' | 'documents' | 'pregnancy' | 'lists' | 'names' | 'profile';
export interface MemberLike { role: 'owner' | 'coparent' | 'caregiver'; can_view: Domain[]; can_edit: Domain[]; child_scope?: string[] | null; pregnancy_access?: boolean }

/** Droit ACTUEL d'un membre sur un domaine pour un enfant (propriétaire : tout ; sinon domaine ET enfant partagés). */
export function memberCan(m: MemberLike | null | undefined, mode: 'view' | 'edit', domain: Domain, childId?: string | null): boolean {
  if (!m) return false;
  if (m.role === 'owner') return true;
  const list = mode === 'edit' ? m.can_edit : m.can_view;
  if (!list?.includes(domain)) return false;
  if (childId && m.child_scope && !m.child_scope.includes(childId)) return false;
  return true;
}

// ---------------------------------------------------------------- résolution

export interface ToolLike { id: string; label: string; href: string }
export interface IntentContext {
  children: { id: string; first_name: string }[];
  /** Enfant affiché (profil actif), s'il y en a un */
  activeChildId: string | null;
  member: MemberLike | null;
  /** Outils du profil affiché (catalogue HOMI) */
  catalog: ToolLike[];
  /** Outils grossesse disponibles pour ce compte (catalogue du profil grossesse), vide sans grossesse */
  pregnancyCatalog?: ToolLike[];
  sleeps: SleepLike[];
  now: Date;
  /** Libellés (i18n injectée : la logique reste pure) */
  t: (key: string, vars?: Record<string, string | number>) => string;
  clock: (d: Date) => string;
}

export type IntentOption = { label: string; intent: AuraIntent };
export type Resolution =
  | { status: 'ready'; label: string; href: string; childName?: string; hint?: string }
  | { status: 'select_child'; label: string; options: { label: string; childId: string }[] }
  | { status: 'ask'; question: string; options: IntentOption[] }
  | { status: 'list'; label: string; items: { label: string; href: string }[] }
  | { status: 'unavailable'; reason: string; alternative?: { label: string; href: string } };

const CHILD_TOOL_ROUTE: Record<string, (id: string) => string> = {
  baby_breastfeed: (id) => `/track/breastfeed?child=${id}`,
  baby_bottle: (id) => `/bottle/${id}`,
  baby_diaper: (id) => `/track/diaper?child=${id}`,
  kid_sleep_rhythm: (id) => `/sleep/${id}`,
};

/** Domaine de données d'un outil du quotidien (droits). */
const TOOL_DOMAIN: Record<string, Domain> = { baby_breastfeed: 'daily', baby_bottle: 'daily', baby_diaper: 'daily', kid_sleep_rhythm: 'daily' };

function pickChild(intent: { childId?: string | null }, ctx: IntentContext): { id: string; first_name: string } | 'ask' | null {
  if (intent.childId) return ctx.children.find((c) => c.id === intent.childId) ?? null;
  if (ctx.activeChildId) return ctx.children.find((c) => c.id === ctx.activeChildId) ?? null;
  if (ctx.children.length === 1) return ctx.children[0];
  return ctx.children.length ? 'ask' : null;
}

const askChild = (intent: AuraIntent, ctx: IntentContext): Resolution => ({
  status: 'ask', question: ctx.t('aura.it.whichChild'),
  options: ctx.children.map((c) => ({ label: c.first_name, intent: { ...intent, childId: c.id } as AuraIntent })),
});

/** Calcule la destination avec les données et droits ACTUELS (appelée à l'affichage et de nouveau à l'appui). */
export function resolveIntent(intent: AuraIntent, ctx: IntentContext): Resolution {
  const many = ctx.children.length > 1;
  const named = (key: string, name: string) => ctx.t(many ? `${key}.named` : key, { name });

  if (intent.kind === 'switch_child') {
    if (ctx.children.length < 2) return { status: 'unavailable', reason: ctx.t('aura.it.oneChild') };
    return { status: 'select_child', label: ctx.t('aura.it.switch'), options: ctx.children.map((c) => ({ label: ctx.t('aura.it.switchTo', { name: c.first_name }), childId: c.id })) };
  }

  if (intent.kind === 'profile_tools') {
    const list = (ctx.pregnancyCatalog ?? []).slice(0, 4);
    if (!list.length) return { status: 'unavailable', reason: ctx.t('aura.it.noPregnancy'), alternative: { label: ctx.t('aura.it.addPregnancy'), href: '/profiles/new?kind=pregnancy' } };
    return { status: 'list', label: ctx.t('aura.it.pregnancyTools'), items: list.map((x) => ({ label: ctx.t('aura.it.open', { name: x.label }), href: x.href })) };
  }

  const child = pickChild(intent, ctx);
  if (child === 'ask') return askChild(intent, ctx);

  if (intent.kind === 'open_tool') {
    const tool = ctx.catalog.find((x) => x.id === intent.toolId);
    const route = CHILD_TOOL_ROUTE[intent.toolId];
    if (route) {
      if (!child) return { status: 'unavailable', reason: ctx.t('aura.it.noChild'), alternative: { label: ctx.t('aura.it.addChild'), href: '/profiles/new?kind=child' } };
      if (!memberCan(ctx.member, 'view', TOOL_DOMAIN[intent.toolId] ?? 'daily', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noAccess', { name: child.first_name }) };
      const name = tool?.label ?? ctx.t(`aura.it.tool.${intent.toolId}`);
      return { status: 'ready', label: many ? ctx.t('aura.it.openFor', { tool: name, name: child.first_name }) : ctx.t('aura.it.open', { name }), href: route(child.id), childName: child.first_name };
    }
    if (!tool) return { status: 'unavailable', reason: ctx.t('aura.it.toolMissing') };
    return { status: 'ready', label: ctx.t('aura.it.open', { name: tool.label }), href: tool.href };
  }

  if (!child) return { status: 'unavailable', reason: ctx.t('aura.it.noChild'), alternative: { label: ctx.t('aura.it.addChild'), href: '/profiles/new?kind=child' } };

  if (intent.kind === 'prepare_relay') {
    if (!memberCan(ctx.member, 'view', 'daily', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noAccess', { name: child.first_name }) };
    return { status: 'ready', label: named('aura.it.relay', child.first_name), href: `/family/relay?child=${child.id}`, childName: child.first_name, hint: ctx.t('aura.it.relayHint') };
  }

  if (intent.kind === 'add_measure') {
    if (!memberCan(ctx.member, 'edit', 'health', child.id)) {
      return { status: 'unavailable', reason: ctx.t('aura.it.noEdit', { name: child.first_name }), alternative: { label: ctx.t('aura.it.seeGrowth'), href: `/child/${child.id}?tab=croissance` } };
    }
    return { status: 'ready', label: named(`aura.it.measure.${intent.metric}`, child.first_name), href: `/child/${child.id}?tab=croissance&focus=${intent.metric}`, childName: child.first_name };
  }

  // fix_sleep_end
  const sleepRoute = `/sleep/${child.id}`;
  if (!memberCan(ctx.member, 'edit', 'daily', child.id)) {
    return { status: 'unavailable', reason: ctx.t('aura.it.noEdit', { name: child.first_name }), alternative: { label: ctx.t('aura.it.openSleep'), href: sleepRoute } };
  }
  const day0 = new Date(ctx.now.getFullYear(), ctx.now.getMonth(), ctx.now.getDate() - 1).getTime();
  const ended = ctx.sleeps.filter((s) => s.child_id === child.id && s.ended_at && isDayNap(s) && Date.parse(s.started_at) >= day0)
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
  const hhmm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const near = (a: string, b: string) => { const [h1, m1] = a.split(':').map(Number); const [h2, m2] = b.split(':').map(Number); return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2)) <= 2; };
  let candidates = intent.sleepId ? ended.filter((s) => s.id === intent.sleepId) : intent.wrong ? ended.filter((s) => near(hhmm(s.ended_at!), intent.wrong!)) : ended.slice(0, 1);
  if (!intent.sleepId && intent.wrong && !candidates.length) candidates = [];
  const range = (s: SleepLike) => `${ctx.clock(new Date(s.started_at))} – ${ctx.clock(new Date(s.ended_at!))}`;
  if (!candidates.length) {
    return { status: 'unavailable', reason: intent.wrong ? ctx.t('aura.it.noNapAt', { time: intent.wrong.replace(':', ' h ') }) : ctx.t('aura.it.noNap'), alternative: { label: ctx.t('aura.it.openSleep'), href: sleepRoute } };
  }
  if (candidates.length > 1) {
    return { status: 'ask', question: ctx.t('aura.it.whichNap'), options: candidates.map((s) => ({ label: range(s), intent: { ...intent, childId: child.id, sleepId: s.id } })) };
  }
  const s = candidates[0];
  return {
    status: 'ready', label: named('aura.it.fixNap', child.first_name), childName: child.first_name,
    href: intent.right ? `${sleepRoute}?nap=${s.id}&fix=${intent.right}` : `${sleepRoute}?nap=${s.id}&edit=1`,
    hint: intent.right ? ctx.t('aura.it.fixHint', { range: range(s), to: intent.right.replace(':', ' h ') }) : ctx.t('aura.it.fixHintOpen', { range: range(s) }),
  };
}
