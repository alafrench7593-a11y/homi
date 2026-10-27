/**
 * Assistant LOCAL de la bibliothèque — tout se passe sur l'appareil, aucune donnée n'est envoyée.
 *
 * Ce n'est pas un modèle génératif : c'est un moteur de recherche sémantique léger (BM25 sur des passages,
 * synonymes du français parental et médical, racines de mots) qui RETROUVE la réponse dans les articles sourcés
 * de l'application et la présente proprement : réponse courte, points clés, quand demander conseil, articles et sources.
 * - Il ne pose aucun diagnostic et n'invente rien : chaque phrase vient d'un article (cité).
 * - Sans réponse suffisamment proche, il le dit et propose les articles voisins et un professionnel.
 * - Une situation d'urgence (détection partagée avec l'assistant en ligne) passe avant toute recherche : 15, 112, 3114.
 */
import { assessSafety, urgentContacts, type SafetyLevel, type UrgentContact } from '../../../supabase/functions/_shared/safety';

export interface KbArticle {
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  tags?: string[];
  sources?: { label: string; url: string }[];
  min_age_months?: number | null;
  max_age_months?: number | null;
}

export interface Passage {
  slug: string;
  title: string;
  section: string;
  /** Question de FAQ quand le passage en est une. */
  question?: string;
  text: string;
  tokens: string[];
}

export interface LocalAnswer {
  kind: 'answer' | 'urgent' | 'none';
  safety?: Exclude<SafetyLevel, 'none'>;
  urgent?: UrgentContact[];
  /** Réponse courte (extraite telle quelle d'un article). */
  answer?: string;
  /** Points clés (« En bref ») de l'article principal. */
  keyPoints?: string[];
  /** « Quand demander conseil » de l'article principal. */
  care?: string;
  main?: { slug: string; title: string; section: string; sources: { label: string; url: string }[] };
  /** Autres articles proches. */
  related: { slug: string; title: string }[];
  /** 0..1 — proximité de la meilleure réponse. */
  confidence: number;
}

// ------------------------------------------------------------------ texte

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

const STOP = new Set(('a au aux avec ce ces cet cette comme dans de des du elle elles en est et etre eu il ils je la le les leur leurs lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous y c d j l m n s t qu est sont ete avoir fait faut peut peux puis plus tres bien quoi quel quelle quels quelles comment pourquoi quand combien estce est-ce cela ca ceci si sans entre chez vers dont deja aussi encore tout tous toute toutes autre autres alors donc car or ni soit faire avez ai as a ont sera serait etait etaient fils fille peut-etre peutetre savoir dois doit puisje puis-je mon ma mes notre est-il est-elle y-a-t-il ya').split(' '));

/** Racine simple du français (pluriels, féminins, quelques suffixes fréquents). */
export function stem(w: string): string {
  let s = w;
  for (const suf of ['issements', 'issement', 'ations', 'ation', 'ements', 'ement', 'ments', 'ment', 'euses', 'euse', 'eux', 'ites', 'ite', 'ives', 'ive', 'ifs', 'if', 'iques', 'ique', 'ales', 'aux', 'ale', 'al', 'ees', 'ee', 'es', 'er', 'e', 's', 'x']) {
    if (s.length - suf.length >= 4 && s.endsWith(suf)) { s = s.slice(0, -suf.length); break; }
  }
  return s;
}

/** Synonymes et sigles : chaque groupe est ramené à un même jeton. */
const SYN: string[][] = [
  ['tdah', 'tda', 'hyperactivite', 'hyperactif', 'hyperactive', 'deficit attention', 'trouble attention', 'inattention'],
  ['autisme', 'tsa', 'autiste', 'autistes', 'trouble spectre autisme', 'spectre autistique'],
  ['dys', 'dyslexie', 'dyspraxie', 'dyscalculie', 'dysorthographie', 'dysphasie', 'tdc'],
  ['bebe', 'nourrisson', 'nouveau ne', 'nouveaune', 'nourrissons', 'bebes', 'newborn'],
  ['enceinte', 'grossesse', 'enceintes'],
  ['regles', 'menstruation', 'menstruations', 'regle'],
  ['allaitement', 'allaiter', 'sein', 'tetee', 'tetees', 'tetter', 'lait maternel'],
  ['biberon', 'biberons', 'lait infantile', 'lait en poudre'],
  ['fievre', 'temperature', 'chaud', 'febrile'],
  ['vomir', 'vomissement', 'vomissements', 'vomi'],
  ['diarrhee', 'gastro', 'gastroenterite'],
  ['pleurs', 'pleure', 'pleurer', 'cris', 'crie'],
  ['dodo', 'dormir', 'sommeil', 'nuit', 'nuits', 'sieste', 'siestes', 'endormir'],
  ['peridurale', 'anesthesie', 'douleur accouchement'],
  ['accouchement', 'accoucher', 'naissance', 'travail'],
  ['pma', 'amp', 'fiv', 'insemination', 'procreation medicalement assistee'],
  ['concevoir', 'tomber enceinte', 'conception', 'avoir un bebe', 'essai bebe'],
  ['contraception', 'pilule', 'sterilet', 'preservatif'],
  ['vaccin', 'vaccins', 'vaccination', 'rappel'],
  ['ecran', 'ecrans', 'tablette', 'telephone', 'television', 'tele'],
  ['colere', 'coleres', 'crise', 'crises'],
  ['proprete', 'pot', 'couche', 'couches'],
  ['depression', 'deprime', 'baby blues', 'tristesse', 'deprimee'],
  ['toxoplasmose', 'toxo'],
  ['listeriose', 'listeria'],
  ['diabete', 'glycemie', 'sucre'],
  ['epilepsie', 'convulsion', 'convulsions', 'crise epilepsie'],
  ['mdph', 'aeeh', 'handicap'],
  ['aesh', 'avs', 'pps', 'pap', 'pai'],
  ['caf', 'prime', 'aide', 'aides', 'allocation'],
  ['conge maternite', 'conge maternel', 'arret maternite'],
  ['poux', 'pou', 'lentes'],
  ['sport', 'activite physique', 'bouger', 'exercice', 'exercices'],
  ['refus scolaire', 'ne veut pas aller a l ecole', 'phobie scolaire', 'peur de l ecole'],
  ['activite', 'activites', 'jeu', 'jeux', 'jouer', 'occuper'],
  ['dent', 'dents', 'poussee dentaire', 'dentaire'],
];
const SYN_MAP = new Map<string, string>();
const SYN_PHRASES: [string, string][] = [];
for (const g of SYN) {
  const head = `§${stem(normalize(g[0]).split(' ')[0])}`;
  for (const w of g) {
    const n = normalize(w);
    if (n.includes(' ')) SYN_PHRASES.push([n, head]); else SYN_MAP.set(stem(n), head);
  }
}

export function tokenize(text: string): string[] {
  let n = ` ${normalize(text)} `;
  const extra: string[] = [];
  for (const [phrase, head] of SYN_PHRASES) if (n.includes(` ${phrase} `)) extra.push(head);
  const out: string[] = [];
  for (const w of n.trim().split(' ')) {
    if (!w || STOP.has(w) || /^\d+$/.test(w) || (w.length < 3 && w !== 'pma')) continue;
    const st = stem(w);
    out.push(SYN_MAP.get(st) ?? st);
  }
  n = '';
  return [...out, ...extra];
}

// ------------------------------------------------------------------ découpage en passages

function sectionsOf(md: string): { title: string; body: string }[] {
  const parts = md.split(/^## +/m);
  const out: { title: string; body: string }[] = [];
  if (parts[0].trim()) out.push({ title: 'Introduction', body: parts[0].trim() });
  for (const p of parts.slice(1)) {
    const nl = p.indexOf('\n');
    out.push({ title: (nl < 0 ? p : p.slice(0, nl)).trim(), body: (nl < 0 ? '' : p.slice(nl + 1)).trim() });
  }
  return out;
}

export function passagesOf(a: KbArticle): Passage[] {
  const out: Passage[] = [];
  const head = `${a.title} ${a.summary} ${(a.tags ?? []).join(' ')}`;
  for (const sec of sectionsOf(a.body_md)) {
    const isFaq = /^questions/i.test(sec.title);
    for (const block of sec.body.split(/\n{2,}/)) {
      const text = block.trim();
      if (text.length < 25) continue;
      const faq = isFaq ? text.match(/^\s*(?:[-*]\s*)?\*\*(.+?)\*\*\s*:?\s*([\s\S]*)$/) : null;
      const question = faq ? faq[1].trim() : undefined;
      const body = faq ? faq[2].trim() || text : text;
      // le titre de l'article et la question de FAQ comptent davantage (répétés dans les jetons)
      const tokens = [...tokenize(body), ...tokenize(head), ...tokenize(sec.title), ...(question ? [...tokenize(question), ...tokenize(question)] : [])];
      out.push({ slug: a.slug, title: a.title, section: sec.title, question, text: body, tokens });
    }
  }
  return out;
}

// ------------------------------------------------------------------ index BM25

export interface KbIndex {
  passages: Passage[];
  articles: Map<string, KbArticle>;
  df: Map<string, number>;
  avgLen: number;
}

export function buildIndex(articles: KbArticle[]): KbIndex {
  const passages = articles.flatMap(passagesOf);
  const df = new Map<string, number>();
  for (const p of passages) for (const tk of new Set(p.tokens)) df.set(tk, (df.get(tk) ?? 0) + 1);
  const avgLen = passages.reduce((n, p) => n + p.tokens.length, 0) / Math.max(1, passages.length);
  return { passages, articles: new Map(articles.map((a) => [a.slug, a])), df, avgLen };
}

const K1 = 1.4;
const B = 0.72;

export function search(index: KbIndex, question: string, limit = 8): { p: Passage; score: number }[] {
  const q = [...new Set(tokenize(question))];
  if (!q.length) return [];
  const N = index.passages.length;
  const scored: { p: Passage; score: number }[] = [];
  for (const p of index.passages) {
    let score = 0;
    let tf: Map<string, number> | null = null;
    for (const term of q) {
      const df = index.df.get(term);
      if (!df) continue;
      if (!tf) { tf = new Map(); for (const tk of p.tokens) tf.set(tk, (tf.get(tk) ?? 0) + 1); }
      const f = tf.get(term) ?? 0;
      if (!f) continue;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * p.tokens.length) / index.avgLen)));
    }
    if (score > 0) {
      // bonus : question de FAQ proche de la question posée
      if (p.question) {
        const qq = new Set(tokenize(p.question));
        const overlap = q.filter((t) => qq.has(t)).length / q.length;
        score *= 1 + overlap;
      }
      scored.push({ p, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Proximité 0..1 : part des mots importants de la question retrouvés dans le passage. */
function coverage(question: string, p: Passage): number {
  const q = [...new Set(tokenize(question))];
  if (!q.length) return 0;
  const set = new Set(p.tokens);
  return q.filter((t) => set.has(t)).length / q.length;
}

const bullets = (md: string) => md.split('\n').filter((l) => /^\s*[-*•]\s+/.test(l)).map((l) => l.replace(/^\s*[-*•]\s+/, '').trim());

/** Âge mentionné dans la question (« 7 ans », « 18 mois »), en mois. */
export function ageInQuestion(question: string): number | null {
  const m = normalize(question).match(/\b(\d{1,2})\s*(ans?|mois)\b/);
  if (!m) return null;
  return m[2].startsWith('mois') ? Number(m[1]) : Number(m[1]) * 12;
}

/** Classement par article : meilleur passage + bonus fort quand les mots de la question sont dans le TITRE. */
export function rankArticles(index: KbIndex, question: string, hits: { p: Passage; score: number }[]) {
  const q = [...new Set(tokenize(question))];
  const N = index.passages.length;
  const age = ageInQuestion(question);
  const by = new Map<string, { slug: string; best: { p: Passage; score: number }; score: number }>();
  for (const h of hits) {
    const cur = by.get(h.p.slug);
    if (!cur) by.set(h.p.slug, { slug: h.p.slug, best: h, score: h.score });
    else { cur.score += h.score * 0.25; if (h.score > cur.best.score) cur.best = h; }
  }
  for (const r of by.values()) {
    const a = index.articles.get(r.slug)!;
    const title = new Set([...tokenize(a.title), ...tokenize((a.tags ?? []).join(' '))]);
    let boost = 0;
    for (const t of q) if (title.has(t)) boost += Math.log(1 + N / ((index.df.get(t) ?? 1) + 1));
    r.score += boost * 2.2;
    // âge précisé : on privilégie les articles dont la tranche d'âge le contient
    if (age != null && (a.min_age_months != null || a.max_age_months != null)) {
      const inside = (a.min_age_months ?? 0) <= age && age <= (a.max_age_months ?? 240);
      r.score *= inside ? 1.35 : 0.55;
    }
  }
  return [...by.values()].sort((a, b) => b.score - a.score);
}

export function answer(index: KbIndex, question: string): LocalAnswer {
  const safety = assessSafety(question);
  if (safety.level !== 'none') {
    const hits = search(index, question, 3);
    return { kind: 'urgent', safety: safety.level, urgent: urgentContacts(safety.level), related: uniqueArticles(hits), confidence: 1 };
  }
  const hits = search(index, question, 40);
  if (!hits.length) return { kind: 'none', related: [], confidence: 0 };
  const ranked = rankArticles(index, question, hits);
  const best = ranked[0].best;
  const conf = Math.max(coverage(question, best.p), coverage(question, { ...best.p, tokens: [...best.p.tokens, ...tokenize(index.articles.get(best.p.slug)!.title)] }));
  if (conf < 0.5) return { kind: 'none', related: uniqueArticles(hits).slice(0, 4), confidence: conf };
  const art = index.articles.get(best.p.slug)!;
  const secs = sectionsOf(art.body_md);
  const brief = secs.find((s) => /^en bref/i.test(s.title));
  const care = secs.find((s) => /demander conseil|consulter|urgence/i.test(s.title));
  // réponse : le meilleur passage, complété du suivant s'il vient du même article et de la même section
  const second = hits.find((h, i) => i > 0 && h.p.slug === best.p.slug && h.p.section === best.p.section && h.p.text !== best.p.text);
  const text = second && best.p.text.length < 280 ? `${best.p.text}\n\n${second.p.text}` : best.p.text;
  return {
    kind: 'answer',
    answer: text,
    keyPoints: brief ? bullets(brief.body).slice(0, 5) : undefined,
    care: care && care.title !== best.p.section ? care.body : undefined,
    main: { slug: art.slug, title: art.title, section: best.p.question ?? best.p.section, sources: art.sources ?? [] },
    related: ranked.slice(1, 4).map((r) => ({ slug: r.slug, title: index.articles.get(r.slug)!.title })),
    confidence: conf,
  };
}

function uniqueArticles(hits: { p: Passage }[]): { slug: string; title: string }[] {
  const seen = new Set<string>();
  const out: { slug: string; title: string }[] = [];
  for (const h of hits) if (!seen.has(h.p.slug)) { seen.add(h.p.slug); out.push({ slug: h.p.slug, title: h.p.title }); }
  return out;
}
