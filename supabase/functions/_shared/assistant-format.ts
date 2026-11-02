/**
 * Format des réponses de l'assistant — module PUR (aucune API Deno ni React Native).
 * Utilisé par la fonction « assistant » (Deno), par l'application (rendu progressif)
 * et par le moteur de démonstration ; testé par Jest.
 *
 * Le modèle répond en sections délimitées par des titres « ### » (plus robuste
 * qu'un JSON pendant la diffusion en continu : chaque morceau reçu reste lisible).
 */

/** Message affiché au début de CHAQUE conversation (texte imposé, ne pas modifier). */
export const ASSISTANT_INTRO =
  'Vous échangez avec un assistant d’intelligence artificielle spécialisé dans l’information en santé et parentalité. Il ne remplace pas un médecin, une sage-femme, un pédiatre ou les services d’urgence.';

/** Même texte en anglais (version anglaise de l'application ; D-02, QA 02/11/2026). */
export const ASSISTANT_INTRO_EN =
  'You are talking with an artificial intelligence assistant specialised in health and parenting information. It does not replace a doctor, a midwife, a paediatrician or emergency services.';

/** Longueur maximale d'une question (contrôlée dans l'app ET par le serveur). */
/**
 * Échanges récents envoyés par l'application quand l'historique n'est pas conservé (sans accord de la personne) :
 * gardés seulement le temps de la réponse. Au plus 12 messages, rôles alternés, textes tronqués ; sinon ignorés.
 */
export function sanitizeRecentTurns(v: unknown): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const t of v.slice(-12)) {
    const role = (t as { role?: unknown })?.role, content = (t as { content?: unknown })?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) continue;
    out.push({ role, content: content.trim().slice(0, 4000) });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (out.length && out[out.length - 1].role === 'user') out.pop();
  return out;
}

export const MAX_QUESTION_LENGTH = 2000;

/** Mention du mode développement (aucune clé IA configurée). */
export const DEV_MODE_LABEL = 'Mode développement : aucune clé IA configurée';

/** Sources officielles françaises autorisées (le domaine ou l'un de ses sous-domaines). */
export const ALLOWED_SOURCE_DOMAINS = [
  'ameli.fr',
  'sante.gouv.fr',
  'solidarites-sante.gouv.fr',
  'sante.fr',
  'has-sante.fr',
  'santepubliquefrance.fr',
  'mpedia.fr',
  '1000-premiers-jours.fr',
  'service-public.fr',
  '3114.fr',
  'ansm.sante.fr',
  'vaccination-info-service.fr',
  'mangerbouger.fr',
  'anses.fr',
  'allo119.gouv.fr',
  'arretonslesviolences.gouv.fr',
  'caf.fr',
] as const;

export interface OfficialSource {
  label: string;
  url: string;
}

export interface StructuredAnswer {
  /** Réponse courte (quelques phrases). */
  short: string;
  /** Actions pratiques possibles. */
  actions: string[];
  /** Éléments à surveiller. */
  watch: string[];
  /** Quand demander un avis professionnel. */
  consult: string[];
  /** Questions complémentaires quand une information manque. */
  questions: string[];
  /** Sources officielles (filtrées par la liste autorisée). */
  sources: OfficialSource[];
  /** Date de mise à jour de la réponse (AAAA-MM-JJ). */
  updated_on: string | null;
}

type SectionKey = 'short' | 'actions' | 'watch' | 'consult' | 'questions' | 'sources';

export const SECTION_TITLES: Record<SectionKey, string> = {
  short: 'En bref',
  actions: 'Ce que vous pouvez faire',
  watch: 'À surveiller',
  consult: 'Quand demander un avis professionnel',
  questions: 'Pour mieux vous répondre',
  sources: 'Sources',
};

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function headingKey(title: string): SectionKey | null {
  const t = fold(title);
  if (/^(en bref|reponse courte)$/.test(t)) return 'short';
  if (/^(ce que vous pouvez faire|actions?|que faire|conseils pratiques)/.test(t)) return 'actions';
  if (/^(a surveiller|elements a surveiller|signes a surveiller)/.test(t)) return 'watch';
  if (/^(quand (demander|consulter)|consulter|avis professionnel)/.test(t)) return 'consult';
  if (/^(pour mieux vous repondre|questions? (pour mieux|complementaires?))/.test(t)) return 'questions';
  if (/^sources?( officielles?)?$/.test(t)) return 'sources';
  return null;
}

/** Vrai si l'URL est en https et appartient à un domaine officiel autorisé. */
export function isAllowedSourceUrl(url: string): boolean {
  const m = /^https:\/\/([^/?#:@\s]+)(?::\d+)?(?:[/?#][^\s]*)?$/i.exec(url.trim());
  if (!m) return false;
  const host = m[1].toLowerCase().replace(/\.$/, '');
  return ALLOWED_SOURCE_DOMAINS.some((d) => host === d || host === `www.${d}` || host.endsWith(`.${d}`));
}

/** Ne garde que les sources officielles autorisées, sans doublon, au plus 5. */
export function filterSources(sources: OfficialSource[]): OfficialSource[] {
  const seen = new Set<string>();
  const out: OfficialSource[] = [];
  for (const s of sources) {
    if (!s || typeof s.url !== 'string' || !isAllowedSourceUrl(s.url)) continue;
    const url = s.url.trim();
    if (seen.has(url)) continue;
    seen.add(url);
    const label = String(s.label ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 140) || (/^https:\/\/([^/?#]+)/i.exec(url)?.[1] ?? url);
    out.push({ label, url });
    if (out.length >= 5) break;
  }
  return out;
}

const BULLET = /^\s*(?:[-•*]|\d+[.)])\s+/;

function toItems(lines: string[]): string[] {
  const items: string[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (BULLET.test(line) || !items.length) items.push(line.replace(BULLET, '').trim());
    else items[items.length - 1] += ' ' + line.trim(); // suite d'une puce sur plusieurs lignes
  }
  return items.filter(Boolean);
}

function parseSourceLine(line: string): OfficialSource | null {
  const text = line.replace(BULLET, '').trim();
  const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/.exec(text);
  if (md) return { label: md[1].trim(), url: md[2] };
  const bare = /(https?:\/\/[^\s)>\]]+)/.exec(text);
  if (bare) {
    const label = text.replace(bare[1], '').replace(/[\s:–—-]+$/g, '').replace(/^[\s:–—-]+/g, '').trim();
    return { label: label || bare[1], url: bare[1].replace(/[.,;]+$/, '') };
  }
  return null;
}

/**
 * Découpe un texte (éventuellement PARTIEL, pendant la diffusion) en sections.
 * Un texte sans titre est considéré comme une réponse courte.
 */
export function parseStructuredAnswer(text: string, updatedOn: string | null = null): StructuredAnswer {
  const out: StructuredAnswer = { short: '', actions: [], watch: [], consult: [], questions: [], sources: [], updated_on: updatedOn };
  const buckets: Record<SectionKey, string[]> = { short: [], actions: [], watch: [], consult: [], questions: [], sources: [] };
  let current: SectionKey = 'short';
  for (const line of text.replace(/\r/g, '').split('\n')) {
    const h = /^\s*#{1,4}\s*(.+?)\s*:?\s*$/.exec(line) ?? /^\s*\*\*(.+?)\s*:?\s*\*\*\s*:?\s*$/.exec(line);
    const key = h ? headingKey(h[1]) : null;
    if (key) {
      current = key;
      continue;
    }
    // Titre inconnu : conservé comme texte en gras
    buckets[current].push(h && /^\s*#/.test(line) ? `**${h[1]}**` : line);
  }
  out.short = buckets.short.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  out.actions = toItems(buckets.actions);
  out.watch = toItems(buckets.watch);
  out.consult = toItems(buckets.consult);
  out.questions = toItems(buckets.questions);
  out.sources = filterSources(buckets.sources.map(parseSourceLine).filter((s): s is OfficialSource => !!s));
  return out;
}

/** Version texte (Markdown simple) d'une réponse structurée : historique, export, favoris. */
export function structuredToMarkdown(a: StructuredAnswer): string {
  const parts: string[] = [];
  if (a.short) parts.push(a.short);
  const list = (key: Exclude<SectionKey, 'short' | 'sources'>) => {
    const items = a[key];
    if (items.length) parts.push(`**${SECTION_TITLES[key]}**\n\n${items.map((i) => `- ${i}`).join('\n')}`);
  };
  list('actions');
  list('watch');
  list('consult');
  list('questions');
  if (a.sources.length) parts.push(`**${SECTION_TITLES.sources}**\n\n${a.sources.map((s) => `- [${s.label}](${s.url})`).join('\n')}`);
  if (a.updated_on) parts.push(`_Mise à jour : ${a.updated_on}_`);
  return parts.join('\n\n');
}

/** Réponse structurée vide de sens médical ? (le modèle n'a rien produit d'exploitable) */
export function isEmptyAnswer(a: StructuredAnswer): boolean {
  return !a.short && !a.actions.length && !a.watch.length && !a.consult.length && !a.questions.length;
}

// ---------------------------------------------------------------------------
// Protection contre les tentatives de détournement (prompt injection)
// ---------------------------------------------------------------------------
const INJECTION_PATTERNS = [
  /\b(ignore|oublie|ignorez|oubliez|disregard|forget)\b.{0,40}\b(instructions?|consignes?|regles?|rules|prompt|system)/,
  /\b(montre|affiche|revele|donne|repete|show|reveal|print)\b.{0,30}\b(ton|tes|votre|vos|your|the)\b.{0,20}\b(prompt|instructions?|consignes? systeme|system)/,
  /\b(tu es|you are) (maintenant|desormais|now)\b/,
  /\b(mode developpeur|developer mode|jailbreak|dan mode)\b/,
  /<\/?\s*(system|contexte_utilisateur|bibliotheque|instructions?)\s*>/,
];

/** Détection simple et prudente d'une tentative de détournement des consignes. */
export function looksLikePromptInjection(text: string): boolean {
  const t = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ');
  return INJECTION_PATTERNS.some((re) => re.test(t));
}

export const INJECTION_REFUSAL: StructuredAnswer = {
  short:
    'Je ne peux pas modifier mes consignes. Je suis là pour vous informer sur la santé et la parentalité (grossesse, accouchement, post-partum, allaitement, santé et développement de l’enfant, sommeil, alimentation, santé mentale des parents). Quelle est votre question ?',
  actions: [],
  watch: [],
  consult: [],
  questions: [],
  sources: [],
  updated_on: null,
};

// ---------------------------------------------------------------------------
// Mode développement (aucune clé IA) : réponse clairement identifiée qui
// utilise QUAND MÊME le format structuré, pour tester l'affichage de bout en bout.
// ---------------------------------------------------------------------------
export interface DevArticle {
  title: string;
  summary: string;
}

export function devModeAnswer(message: string, articles: DevArticle[]): string {
  const q = message.replace(/\s+/g, ' ').trim().slice(0, 160);
  const lines = [
    `### ${SECTION_TITLES.short}`,
    `**${DEV_MODE_LABEL}.** Cette réponse est générée localement pour tester l’affichage : elle ne contient aucune information médicale personnalisée.`,
    '',
    `Votre question : « ${q} ».`,
    articles.length
      ? `Articles de la bibliothèque qui semblent liés : ${articles.map((a, i) => `[${i + 1}] ${a.title}`).join(' ; ')}.`
      : 'Aucun article de la bibliothèque ne semble lié à votre question.',
    '',
    `### ${SECTION_TITLES.actions}`,
    '- Notez votre question et le contexte (depuis quand, à quelle fréquence) pour votre prochain rendez-vous.',
    '- Consultez les articles proposés ci-dessous et les sources officielles.',
    '',
    `### ${SECTION_TITLES.watch}`,
    '- Tout changement inhabituel, qui dure ou qui vous inquiète.',
    '',
    `### ${SECTION_TITLES.consult}`,
    '- En cas de doute, demandez l’avis de votre médecin, de votre sage-femme ou du pédiatre.',
    '- En cas d’urgence : 15 ou 112 (114 par SMS pour les personnes sourdes ou malentendantes).',
    '',
    `### ${SECTION_TITLES.sources}`,
    '- [Assurance Maladie — ameli.fr](https://www.ameli.fr/)',
    '- [Les 1000 premiers jours](https://www.1000-premiers-jours.fr/)',
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Server-Sent Events : encodage (serveur) et décodage incrémental (application)
// ---------------------------------------------------------------------------
export function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export interface SseEvent {
  event: string;
  data: string;
}

/** Décode les événements complets d'un tampon ; renvoie le reste non terminé. */
export function parseSse(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const rest = blocks.pop() ?? '';
  for (const block of blocks) {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (data.length) events.push({ event, data: data.join('\n') });
  }
  return { events, rest };
}

/** Date du jour au format AAAA-MM-JJ (fuseau Europe/Paris approximé par UTC). */
export function todayIso(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
