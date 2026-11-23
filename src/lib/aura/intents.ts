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
  | { kind: 'profile_tools'; profile: 'pregnancy' }
  /** Aura 2.0 — enregistrer une sieste ou une nuit « de 14 h 20 à 15 h 45 » (confirmée par le parent, puis écrite) */
  | { kind: 'log_sleep'; start: string; end: string; childId?: string | null }
  /** Aura 2.0 — enregistrer un biberon bu « il vient de boire 150 ml » (heure : maintenant) */
  | { kind: 'log_bottle'; ml: number; childId?: string | null }
  /** Aura 2.0 — lecture sans IA : sommeil total d'aujourd'hui */
  | { kind: 'sleep_today'; childId?: string | null }
  /** Aura 2.0 — rendez-vous « chez le pédiatre mardi à 10 h » : formulaire pré-rempli, confirmé par le parent */
  | { kind: 'add_appointment'; title: string | null; when: When | null; time: string | null; childId?: string | null }
  /** Aura 2.0 — tâche confiée « rappelle à mon conjoint de préparer le sac demain » : mission pré-remplie */
  | { kind: 'assign_task'; title: string; when: When | null; time: string | null }
  /** Aura 2.0 — « je commence à allaiter à gauche » : séance ouverte, le côté démarre à l'appui */
  | { kind: 'start_breastfeed'; side: 'left' | 'right'; childId?: string | null }
  /** Aura 2.0 — lecture sans IA : « ai-je donné son médicament ce matin ? » (jamais « non » faute de saisie) */
  | { kind: 'med_check'; period: 'morning' | 'today'; childId?: string | null }
  /** Aura 2.0 — lecture sans IA : biberons du jour (nombre, total) */
  | { kind: 'bottles_today'; childId?: string | null };

/** Jour cité, gardé RELATIF (résolu avec l'horloge du moment) : +n jours, prochain jour de semaine (0 = dimanche), JJ/MM. */
export type When = { rel: number } | { weekday: number } | { day: number; month: number; year?: number };

/** Identifiants d'action reconnus par HOMI (le modèle ne peut proposer QUE ceux-ci). */
export const AURA_INTENT_KINDS = ['open_tool', 'fix_sleep_end', 'prepare_relay', 'add_measure', 'switch_child', 'profile_tools', 'log_sleep', 'log_bottle', 'sleep_today', 'add_appointment', 'assign_task', 'start_breastfeed', 'med_check', 'bottles_today'] as const;

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
  // 00) Tâche confiée à un proche (avant le rendez-vous : « rappelle à mon conjoint de prendre rendez-vous »)
  const task = /\b(?:rappelle|rappeler|demande|demander|dis|dire|remind|ask|tell)\s+(?:[àa]|to)?\s*(?:mon|ma|son|sa|my|his|her|the)?\s*(conjoint|conjointe|mari|femme|époux|epoux|épouse|epouse|compagnon|compagne|partenaire|chéri|cheri|chérie|cherie|papa|maman|père|pere|mère|mere|husband|wife|partner|dad|mum|mom)\s+(?:de\s+|d['’]\s*|to\s+)(.+)$/iu.exec(question.trim());
  if (task) {
    const title = cleanTitle(task[2]);
    if (title.length >= 3) return { kind: 'assign_task', title, when: whenIn(q), time: times[0] ?? null };
  }
  // 01) Rendez-vous
  if (has(q, /\b(rendez vous|rdv|appointment|appt|consultation)\b/) && (whenIn(q) || times.length || has(q, /\b(ajoute\w*|note\w*|prends?|pris|programme\w*|planifi\w*|cale\w*|add|book\w*|schedule\w*)\b/))) {
    return { kind: 'add_appointment', title: apptTitle(q), when: whenIn(q), time: times[0] ?? null };
  }
  // 02) Démarrer une tétée d'un côté
  const side = has(q, /\b(gauche|left)\b/) ? 'left' : has(q, /\b(droite|droit|right)\b/) ? 'right' : null;
  if (side && has(q, /\b(sein|tete|tetee|allait\w*|breast\w*|nurs\w*|feed\w*)\b/) && has(q, /\b(commence\w*|demarre\w*|lance\w*|start\w*|begin\w*|mets|met|je donne|donne)\b/)) {
    return { kind: 'start_breastfeed', side };
  }
  // 03) Lectures : médicament donné ? biberons du jour ?
  if (has(q, /\b(medicament\w*|medoc\w*|traitement\w*|sirop|doliprane|vitamine\w*|dose|medicine\w*|medication\w*|meds|syrup)\b/) && has(q, /\b(donne\w*|pris|prise|est ce que|j ai|deja|given|gave|took|taken|did i|have i|has he|has she)\b/)) {
    return { kind: 'med_check', period: has(q, /\b(matin|morning)\b/) ? 'morning' : 'today' };
  }
  if (has(q, /\b(combien|how many|how much|total)\b/) && has(q, /\b(bib|bibs|biberon\w*|bottle\w*|ml|lait|milk)\b/) && !has(q, /\b(dormi|sleep\w*|slept)\b/)) return { kind: 'bottles_today' };
  // 0) Lecture : « combien il a dormi aujourd'hui ? » (sans IA, données du foyer)
  if (has(q, /\b(combien|how (much|long))\b/) && has(q, /\b(dormi|dort|sommeil|slept|sleep)\b/)) return { kind: 'sleep_today' };
  // 0 bis) Enregistrer : deux heures + endormissement/réveil, SANS indice de correction (« s'est endormi à 14 h 20 et
  //        réveillé à 15 h 45 », « a dormi de 14 h à 15 h 30, ajoute ») ; la correction garde la priorité
  if (times.length >= 2 && sleepy && !fixCue) return { kind: 'log_sleep', start: times[0], end: times[1] };
  // 0 ter) Biberon bu : « il vient de boire 150 ml », « bib de 120 ml »
  const ml = /\b(\d{2,3})\s*(ml|millilitres?|milliliters?)\b/.exec(q);
  if (ml && has(q, /\b(bib|bibs|bibi|biberon\w*|bottle\w*|bu|boire|bois|but|drank|drunk|drink|fini\w*|finished)\b/)) {
    const n = Number(ml[1]);
    if (n >= 5 && n <= 400) return { kind: 'log_bottle', ml: n };
  }
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
  /** Saisies du jour, pour les lectures et les doublons (Aura 2.0) ; facultatif */
  bottles?: { at: string; consumed_ml: number | null; child_id?: string }[];
  /** Traitements de l'enfant et prises notées depuis minuit (lecture « médicament ») ; facultatif */
  treatments?: { id: string; child_id: string; name: string; active: boolean }[];
  doses?: { treatment_id: string; scheduled_for: string; status: string; logged_at?: string }[];
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
  | { status: 'unavailable'; reason: string; alternative?: { label: string; href: string } }
  /** Écriture préparée : rien n'est enregistré avant l'appui du parent sur « Enregistrer » */
  | { status: 'confirm'; summary: string; write: { kind: 'sleep' | 'bottle'; row: Record<string, unknown> }; childName: string; viewHref: string; editHref: string; doneLabel: string }
  /** Réponse calculée sur les données réelles (jamais inventée) */
  | { status: 'answer'; text: string; href: string; label: string };

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

  // ---- Aura 2.0 : formulaires pré-remplis (le parent vérifie et enregistre ; rappel, confidentialité, droits : ceux du formulaire)
  if (intent.kind === 'assign_task') {
    const due = intent.when ? resolveWhen(intent.when, ctx.now) : null;
    const qs = [`title=${encodeURIComponent(intent.title)}`, due ? `date=${frDay(due)}` : '', intent.time ? `time=${intent.time.replace(':', 'h')}` : ''].filter(Boolean).join('&');
    return { status: 'ready', label: ctx.t('aura.it3.task', { title: intent.title }), href: `/family/missions/new?${qs}`, hint: ctx.t(due ? 'aura.it3.taskHint' : 'aura.it3.taskHintNoDate') };
  }
  if (intent.kind === 'add_appointment') {
    const pediatric = !!intent.title && /Pédiatre|Vaccin|PMI|Orthophoniste/.test(intent.title);
    const named = ctx.children.find((c) => intent.childId === c.id);
    const who = named ?? (pediatric ? pickChild(intent, ctx) : null);
    if (who === 'ask') return askChild(intent, ctx);
    if (who && !memberCan(ctx.member, 'edit', 'health', who.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noEdit', { name: who.first_name }) };
    const day = intent.when ? resolveWhen(intent.when, ctx.now) : null;
    const title = intent.title ?? ctx.t('aura.it3.apptDefault');
    const childQs = who ? `&child=${who.id}` : '';
    if (!day) return { status: 'ready', label: ctx.t('aura.it3.apptNoDate', { title }), href: `/appointments?new=quick${childQs}`, hint: ctx.t('aura.it3.apptHintNoDate') };
    const [h, mi] = (intent.time ?? '09:00').split(':').map(Number);
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi);
    return {
      status: 'ready', label: ctx.t('aura.it3.appt', { title, date: frDay(at).slice(0, 5), time: ctx.clock(at) }),
      href: `/appointments?new=quick&at=${encodeURIComponent(at.toISOString())}&title=${encodeURIComponent(title)}${childQs}`,
      hint: ctx.t(intent.time ? 'aura.it3.apptHint' : 'aura.it3.apptHintNoTime'), ...(who ? { childName: who.first_name } : {}),
    };
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

  // ---- Aura 2.0 : lecture et écritures préparées (droits relus ici ET au moment d'écrire ; RLS côté serveur)
  if (intent.kind === 'start_breastfeed') {
    if (!memberCan(ctx.member, 'edit', 'daily', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noEdit', { name: child.first_name }), alternative: { label: ctx.t('aura.it.open', { name: ctx.t('aura.it.tool.baby_breastfeed') }), href: `/track/breastfeed?child=${child.id}` } };
    return { status: 'ready', label: named(`aura.it3.bf.${intent.side}`, child.first_name), href: `/track/breastfeed?child=${child.id}&start=${intent.side}`, childName: child.first_name, hint: ctx.t('aura.it3.bfHint') };
  }
  if (intent.kind === 'med_check') {
    const href = `/child/${child.id}/needs?tab=treatments`;
    if (!memberCan(ctx.member, 'view', 'health', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noAccess', { name: child.first_name }) };
    const mine = (ctx.treatments ?? []).filter((x) => x.child_id === child.id);
    if (!mine.length) return { status: 'answer', text: ctx.t('aura.it4.noTreatment', { name: child.first_name }), href, label: ctx.t('aura.it4.openTreatments') };
    const day0 = new Date(ctx.now.getFullYear(), ctx.now.getMonth(), ctx.now.getDate()).getTime();
    const noon = day0 + 12 * 3600000;
    const taken = (ctx.doses ?? []).filter((d) => d.status === 'taken' && mine.some((x) => x.id === d.treatment_id))
      .map((d) => ({ d, at: Date.parse(d.logged_at ?? d.scheduled_for) }))
      .filter(({ at }) => at >= day0 && at <= ctx.now.getTime() && (intent.period === 'today' || at < noon));
    const when = ctx.t(intent.period === 'morning' ? 'aura.it4.morning' : 'aura.it4.today');
    if (!taken.length) return { status: 'answer', text: ctx.t('aura.it4.noDose', { when, name: child.first_name }), href, label: ctx.t('aura.it4.openTreatments') };
    const list = taken.map(({ d, at }) => `${mine.find((x) => x.id === d.treatment_id)?.name ?? '—'} (${ctx.clock(new Date(at))})`).join(', ');
    return { status: 'answer', text: ctx.t('aura.it4.doses', { when, list }), href, label: ctx.t('aura.it4.openTreatments') };
  }
  if (intent.kind === 'bottles_today') {
    if (!memberCan(ctx.member, 'view', 'daily', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noAccess', { name: child.first_name }) };
    const day0 = new Date(ctx.now.getFullYear(), ctx.now.getMonth(), ctx.now.getDate()).getTime();
    const today = (ctx.bottles ?? []).filter((b) => (!b.child_id || b.child_id === child.id) && Date.parse(b.at) >= day0 && Date.parse(b.at) <= ctx.now.getTime());
    const ml = today.reduce((a, b) => a + (b.consumed_ml ?? 0), 0);
    const text = today.length ? ctx.t('aura.it4.bottles', { name: child.first_name, count: today.length, ml }) : ctx.t('aura.it4.noBottle', { name: child.first_name });
    return { status: 'answer', text, href: `/bottle/history?child=${child.id}`, label: ctx.t('aura.it4.openBottles') };
  }
  if (intent.kind === 'sleep_today') {
    if (!memberCan(ctx.member, 'view', 'daily', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noAccess', { name: child.first_name }) };
    const min = sleepMinutesToday(ctx.sleeps.filter((x) => x.child_id === child.id), ctx.now);
    const text = min > 0 ? ctx.t('aura.it2.sleptToday', { name: child.first_name, d: span(min) }) : ctx.t('aura.it2.noSleepToday', { name: child.first_name });
    return { status: 'answer', text, href: `/sleep/${child.id}`, label: ctx.t('aura.it.openSleep') };
  }
  if (intent.kind === 'log_sleep') {
    if (!memberCan(ctx.member, 'edit', 'daily', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noEdit', { name: child.first_name }), alternative: { label: ctx.t('aura.it.openSleep'), href: `/sleep/${child.id}` } };
    const w = sleepWindow(intent.start, intent.end, ctx.now);
    if (!w) return { status: 'unavailable', reason: ctx.t('aura.it2.badTimes'), alternative: { label: ctx.t('aura.it.openSleep'), href: `/sleep/${child.id}` } };
    const clash = ctx.sleeps.find((x) => x.child_id === child.id && Date.parse(x.started_at) < w.end.getTime() && (x.ended_at ? Date.parse(x.ended_at) : ctx.now.getTime()) > w.start.getTime());
    if (clash) return { status: 'unavailable', reason: ctx.t('aura.it2.overlap', { range: `${ctx.clock(new Date(clash.started_at))} – ${clash.ended_at ? ctx.clock(new Date(clash.ended_at)) : '…'}` }), alternative: { label: ctx.t('aura.it.openSleep'), href: `/sleep/${child.id}` } };
    const min = Math.round((w.end.getTime() - w.start.getTime()) / 60000);
    const night = w.start.getHours() >= 19 || w.start.getHours() < 6;
    return {
      status: 'confirm', childName: child.first_name,
      summary: ctx.t(night ? 'aura.it2.nightSummary' : 'aura.it2.napSummary', { name: child.first_name, from: ctx.clock(w.start), to: ctx.clock(w.end), d: span(min) }),
      write: { kind: 'sleep', row: { child_id: child.id, started_at: w.start.toISOString(), ended_at: w.end.toISOString(), kind: night ? 'night' : 'nap' } },
      viewHref: `/sleep/${child.id}`, editHref: `/sleep/${child.id}`, doneLabel: ctx.t(night ? 'aura.it2.nightDone' : 'aura.it2.napDone', { d: span(min) }),
    };
  }
  if (intent.kind === 'log_bottle') {
    if (!memberCan(ctx.member, 'edit', 'daily', child.id)) return { status: 'unavailable', reason: ctx.t('aura.it.noEdit', { name: child.first_name }), alternative: { label: ctx.t('aura.it.open', { name: ctx.t('aura.it.tool.baby_bottle') }), href: `/bottle/${child.id}` } };
    // Doublon probable : même quantité notée il y a moins de 10 minutes
    const dup = (ctx.bottles ?? []).find((b) => b.consumed_ml === intent.ml && Math.abs(ctx.now.getTime() - Date.parse(b.at)) < 10 * 60000);
    if (dup) return { status: 'unavailable', reason: ctx.t('aura.it2.bottleDup', { ml: intent.ml, at: ctx.clock(new Date(dup.at)) }), alternative: { label: ctx.t('aura.it.open', { name: ctx.t('aura.it.tool.baby_bottle') }), href: `/bottle/${child.id}` } };
    return {
      status: 'confirm', childName: child.first_name,
      summary: ctx.t('aura.it2.bottleSummary', { name: child.first_name, ml: intent.ml, at: ctx.clock(ctx.now) }),
      write: { kind: 'bottle', row: { child_id: child.id, at: ctx.now.toISOString(), prepared_ml: null, consumed_ml: intent.ml, planned_next_ml: null, note: null } },
      viewHref: `/bottle/${child.id}`, editHref: `/bottle/history?child=${child.id}`, doneLabel: ctx.t('aura.it2.bottleDone', { ml: intent.ml }),
    };
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

// ---------------------------------------------------------------- Aura 2.0 : calculs déterministes (sans IA)

/** « 1 h 25 », « 45 min ». */
export function span(min: number): string {
  const h = Math.floor(min / 60); const m = min % 60;
  return h ? (m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`) : `${m} min`;
}

/** Fenêtre réelle d'un sommeil cité en heures : fin avant début = passage de minuit ; jamais dans le futur ; 16 h max. */
export function sleepWindow(start: string, end: string, now: Date): { start: Date; end: Date } | null {
  const at = (hhmm: string, base: Date) => { const [h, m] = hhmm.split(':').map(Number); return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m); };
  let s = at(start, now); let e = at(end, now);
  if (e.getTime() <= s.getTime()) s = new Date(s.getTime() - 86400000);
  if (e.getTime() > now.getTime() + 60000) { s = new Date(s.getTime() - 86400000); e = new Date(e.getTime() - 86400000); }
  const min = (e.getTime() - s.getTime()) / 60000;
  if (min < 5 || min > 16 * 60) return null;
  return { start: s, end: e };
}

/** Minutes de sommeil depuis minuit (une session en cours compte jusqu'à maintenant ; la nuit d'avant est coupée à minuit). */
export function sleepMinutesToday(sleeps: SleepLike[], now: Date): number {
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let total = 0;
  for (const x of sleeps) {
    const a = Math.max(Date.parse(x.started_at), day0); const b = Math.min(x.ended_at ? Date.parse(x.ended_at) : now.getTime(), now.getTime());
    if (b > a) total += (b - a) / 60000;
  }
  return Math.round(total);
}

// ---------------------------------------------------------------- Aura 2.0 : dates, titres

const WEEKDAYS: [RegExp, number][] = [[/\b(dimanche|sunday)\b/, 0], [/\b(lundi|monday)\b/, 1], [/\b(mardi|tuesday)\b/, 2], [/\b(mercredi|wednesday)\b/, 3], [/\b(jeudi|thursday)\b/, 4], [/\b(vendredi|friday)\b/, 5], [/\b(samedi|saturday)\b/, 6]];

/** Jour cité dans un texte replié (foldText) : relatif, jour de semaine ou JJ MM [AA]. */
export function whenIn(q: string): When | null {
  if (/\b(apres demain|day after tomorrow)\b/.test(q)) return { rel: 2 };
  if (/\b(demain|tomorrow)\b/.test(q)) return { rel: 1 };
  if (/\b(aujourd hui|ce soir|ce matin|cet apres midi|today|tonight|this (morning|afternoon|evening))\b/.test(q)) return { rel: 0 };
  for (const [re, d] of WEEKDAYS) if (re.test(q)) return { weekday: d };
  const m = /\b([0-3]?\d) ([01]?\d)(?: (\d{2,4}))?\b/.exec(q.replace(/\b(\d{1,2})h\b/g, ''));
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 31 && Number(m[2]) >= 1 && Number(m[2]) <= 12) {
    return { day: Number(m[1]), month: Number(m[2]), ...(m[3] ? { year: m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]) } : {}) };
  }
  return null;
}

/** Date réelle d'un `When` : jamais dans le passé (jour de semaine = la prochaine occurrence, JJ/MM passé = l'an prochain). */
export function resolveWhen(w: When, now: Date): Date {
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if ('rel' in w) return new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + w.rel);
  if ('weekday' in w) { const diff = (w.weekday - d0.getDay() + 7) % 7 || 7; return new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + diff); }
  let d = new Date(w.year ?? d0.getFullYear(), w.month - 1, w.day);
  if (!w.year && d < d0) d = new Date(d0.getFullYear() + 1, w.month - 1, w.day);
  return d;
}

const APPT_TITLES: [RegExp, string][] = [
  [/\b(pediatre|pediatrician|pediatric\w*)\b/, 'Pédiatre'], [/\b(dentiste|dentist)\b/, 'Dentiste'], [/\b(medecin|docteur|generaliste|doctor|gp)\b/, 'Médecin'],
  [/\b(sage femme|midwife)\b/, 'Sage-femme'], [/\b(gyneco\w*|gyn\w*)\b/, 'Gynécologue'], [/\b(vaccin\w*|vaccination)\b/, 'Vaccin'],
  [/\b(echo|echographie|ultrasound|scan)\b/, 'Échographie'], [/\b(orthophonist\w*|speech therap\w*)\b/, 'Orthophoniste'], [/\b(pmi)\b/, 'PMI'],
  [/\b(kine\w*|physio\w*)\b/, 'Kinésithérapeute'], [/\b(osteo\w*)\b/, 'Ostéopathe'], [/\b(ophtalmo\w*|eye doctor)\b/, 'Ophtalmologue'],
];
export function apptTitle(q: string): string | null { for (const [re, t] of APPT_TITLES) if (re.test(q)) return t; return null; }

/** Titre d'une tâche : sans les mots de date et d'heure de fin de phrase, première lettre en majuscule. */
export function cleanTitle(raw: string): string {
  let t = raw.trim().replace(/[.!?…]+$/, '');
  t = t.replace(/\s+(?:(?:pour|avant|d[’']ici)\s+)?(?:apr[eè]s[- ]demain|demain|aujourd['’]hui|ce soir|ce matin|tomorrow|today|tonight|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:prochain|matin|soir))?|le\s+\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?)\b.*$/iu, '');
  t = t.replace(/\s+(?:à|a|at|vers)\s+\d{1,2}\s*(?:h|:)\s*\d{0,2}.*$/iu, '').trim().slice(0, 120);
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

const frDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
