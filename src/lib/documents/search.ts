/**
 * Recherche dans les documents ACCESSIBLES (ceux que la base a déjà renvoyés pour ce compte : la RLS a filtré).
 * Rien n'est envoyé à un serveur. Les tournures courantes (« dernière prise de sang », « ordonnances de cette année »,
 * « vaccination de Léo », « contenant le mot ferritine ») sont interprétées par des règles explicites, affichées à l'écran.
 */
import { getLocale } from '@/i18n';
import type { DocCategory } from './taxonomy';
import { categoryLabel } from './taxonomy';

export interface SearchableDoc {
  id: string; title: string; category: string; custom_category?: string | null; doc_date: string | null; created_at: string;
  notes: string | null; ocr_text?: string | null; child_id: string | null; pregnancy_id: string | null; archived?: boolean;
}
export interface SearchContext { children: { id: string; first_name: string }[]; now?: Date }
export interface Interpretation { categories: DocCategory[]; year: number | null; latest: boolean; childId: string | null; me: boolean; pregnancy: boolean; words: string[]; exact: string | null }

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const CATEGORY_WORDS: [RegExp, DocCategory[]][] = [
  [/\b(prises? de sang|analyses?|bilans? sanguins?|biologie|blood tests?)\b/, ['blood_test', 'exam_result']],
  [/\b(ordonnances?|prescriptions?)\b/, ['prescription']],
  [/\b(echographies?|echos?|ultrasounds?|scans?)\b/, ['ultrasound']],
  [/\b(vaccins?|vaccinations?|vaccines?)\b/, ['vaccination']],
  [/\b(comptes? rendus?|reports?)\b/, ['report', 'consultation', 'hospital', 'pregnancy_report']],
  [/\b(certificats?|certificates?)\b/, ['certificate']],
  [/\b(factures?|devis|invoices?)\b/, ['invoice']],
  [/\b(mutuelles?|assurances?|insurance)\b/, ['insurance']],
  [/\b(carnets? de sante|health books?)\b/, ['health_book']],
  [/\b(dentaires?|dentistes?|dental)\b/, ['dental']],
  [/\b(examens?|exams?|results?|resultats?)\b/, ['exam_result', 'blood_test']],
];
const STOP = new Set(['document', 'documents', 'doc', 'docs', 'fichier', 'fichiers', 'file', 'files', 'le', 'la', 'les', 'de', 'des', 'du', 'd', 'l', 'un', 'une', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'retrouve', 'retrouver', 'affiche', 'afficher', 'montre', 'montrer', 'ou', 'se', 'trouve', 'est', 'dans', 'pour', 'et', 'a', 'au', 'aux', 'en', 'sur', 'qui', 'que', 'quel', 'quelle', 'show', 'find', 'my', 'the', 'of', 'from', 'this', 'year', 'where', 'is', 'cette', 'annee', 'derniere', 'dernier', 'latest', 'last', 'contenant', 'contient', 'containing', 'mot', 'word', 'enfant', 'child', 'moi', 'me', 'grossesse', 'pregnancy']);

export function interpret(query: string, ctx: SearchContext): Interpretation {
  const now = ctx.now ?? new Date();
  const raw = query.trim();
  let f = fold(raw);
  const exactMatch = raw.match(/[«"“](.+?)[»"”]/) ?? raw.match(/(?:contenant|contient|containing)\s+(?:le mot|the word)?\s*([^\s,.]+)/i);
  const exact = exactMatch ? fold(exactMatch[1].trim()) : null;
  if (exactMatch) f = f.replace(fold(exactMatch[0]), ' ');
  const categories: DocCategory[] = [];
  for (const [re, cats] of CATEGORY_WORDS) if (re.test(f)) { for (const c of cats) if (!categories.includes(c)) categories.push(c); f = f.replace(re, ' '); }
  let year: number | null = null;
  if (/\b(cette annee|this year)\b/.test(f)) year = now.getFullYear();
  const y = f.match(/\b(20\d{2})\b/);
  if (y) { year = +y[1]; f = f.replace(y[0], ' '); }
  const latest = /\b(dernier|derniere|derniers|dernieres|latest|last|recent|recente)\b/.test(f);
  let childId: string | null = null;
  for (const c of ctx.children) if (new RegExp(`\\b${fold(c.first_name)}\\b`).test(f)) { childId = c.id; f = f.replace(new RegExp(`\\b${fold(c.first_name)}\\b`), ' '); }
  if (!childId && /\b(mon enfant|my child)\b/.test(f) && ctx.children.length === 1) childId = ctx.children[0].id;
  const me = /\b(pour moi|mes propres|for me|mine)\b/.test(f);
  const pregnancy = /\b(grossesse|pregnancy|prenatal)\b/.test(f);
  const words = f.split(/[^a-z0-9µ]+/).filter((w) => w.length > 1 && !STOP.has(w));
  return { categories, year, latest, childId, me, pregnancy, words, exact };
}

export function searchDocuments<T extends SearchableDoc>(docs: T[], query: string, ctx: SearchContext): { results: T[]; interpretation: Interpretation } {
  const it = interpret(query, ctx);
  const childName = (id: string | null) => ctx.children.find((c) => c.id === id)?.first_name ?? '';
  let out = docs.filter((d) => {
    if (it.categories.length && !it.categories.includes(d.category as DocCategory)) return false;
    const date = d.doc_date ?? d.created_at.slice(0, 10);
    if (it.year && !date.startsWith(String(it.year))) return false;
    if (it.childId && d.child_id !== it.childId) return false;
    if (it.me && (d.child_id || d.pregnancy_id)) return false;
    if (it.pregnancy && !d.pregnancy_id && !['ultrasound', 'prenatal', 'pregnancy_report', 'maternity'].includes(d.category)) return false;
    const hay = fold([d.title, categoryLabel(d.category, d.custom_category), d.custom_category ?? '', d.notes ?? '', d.ocr_text ?? '', date, d.doc_date ? new Date(d.doc_date).toLocaleDateString(getLocale() === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' }) : '', childName(d.child_id)].join(' \n '));
    if (it.exact && !hay.includes(it.exact)) return false;
    return it.words.every((w) => hay.includes(w));
  });
  out = [...out].sort((a, b) => (b.doc_date ?? b.created_at).localeCompare(a.doc_date ?? a.created_at));
  if (it.latest && out.length) out = out.slice(0, 1);
  return { results: out, interpretation: it };
}
