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

/** Langue de l'interface → format des mois écrits dans la recherche (« novembre 2026 », « noviembre de 2026 »…). */
const DATE_TAG: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE', it: 'it-IT' };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const CATEGORY_WORDS: [RegExp, DocCategory[]][] = [
  [/\b(prises? de sang|analyses?|bilans? sanguins?|biologie|blood tests?|analisis( de sangre)?|analisi( del sangue)?|blutuntersuchung(en)?|blutbild(er)?|blutwerte|laborwerte)\b/, ['blood_test', 'exam_result']],
  [/\b(ordonnances?|prescriptions?|recetas? medicas?|prescripciones|ricette mediche|ricetta medica|prescrizion[ei]|rezepte?)\b/, ['prescription']],
  [/\b(echographies?|echos?|ultrasounds?|scans?|ecografias?|ecografie|ultraschall\w*)\b/, ['ultrasound']],
  [/\b(vaccins?|vaccinations?|vaccines?|vacunas?|vacunacion(es)?|vaccino|vaccini|vaccinazion[ei]|impfung(en)?|impfpass)\b/, ['vaccination']],
  [/\b(comptes? rendus?|reports?|informes?|referti|referto|berichte?|befunde?)\b/, ['report', 'consultation', 'hospital', 'pregnancy_report']],
  [/\b(certificats?|certificates?|certificados?|certificat[oi]|bescheinigung(en)?|attest)\b/, ['certificate']],
  [/\b(factures?|devis|invoices?|facturas?|presupuestos?|fatture|fattura|preventivi|preventivo|rechnung(en)?|kostenvoranschlag)\b/, ['invoice']],
  [/\b(mutuelles?|assurances?|insurance|seguros?|assicurazion[ei]|versicherung(en)?|krankenkasse)\b/, ['insurance']],
  [/\b(carnets? de sante|health books?|cartillas? de salud|libretto sanitario|libretti sanitari|gesundheitsheft|untersuchungsheft)\b/, ['health_book']],
  [/\b(dentaires?|dentistes?|dental|dentales|dentista|dentisti|dentale|zahnarzt|zahnarztin|zahn\w*)\b/, ['dental']],
  [/\b(examens?|exams?|results?|resultats?|examenes|resultados?|esami|esame|risultat[oi]|untersuchung(en)?|ergebnis(se)?)\b/, ['exam_result', 'blood_test']],
];
const STOP = new Set(['document', 'documents', 'doc', 'docs', 'fichier', 'fichiers', 'file', 'files', 'le', 'la', 'les', 'de', 'des', 'du', 'd', 'l', 'un', 'une', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'retrouve', 'retrouver', 'affiche', 'afficher', 'montre', 'montrer', 'ou', 'se', 'trouve', 'est', 'dans', 'pour', 'et', 'a', 'au', 'aux', 'en', 'sur', 'qui', 'que', 'quel', 'quelle', 'show', 'find', 'my', 'the', 'of', 'from', 'this', 'year', 'where', 'is', 'cette', 'annee', 'derniere', 'dernier', 'latest', 'last', 'contenant', 'contient', 'containing', 'mot', 'word', 'enfant', 'child', 'moi', 'me', 'grossesse', 'pregnancy']);

/**
 * Mots vides supplémentaires, appliqués seulement quand l'interface est en espagnol, allemand ou italien
 * (certains sont aussi des mots français : la recherche en français et en anglais reste strictement inchangée).
 */
const STOP_MORE = new Set([
  // es
  'documento', 'documentos', 'archivo', 'archivos', 'el', 'los', 'las', 'del', 'al', 'mi', 'mis', 'tu', 'tus', 'muestra', 'muestrame', 'mostrar', 'busca', 'buscar', 'encuentra', 'encontrar', 'donde', 'esta', 'para', 'con', 'este', 'ano', 'ultimo', 'ultima', 'ultimos', 'ultimas', 'reciente', 'contiene', 'palabra', 'hijo', 'hija', 'nino', 'nina', 'embarazo',
  // de
  'dokument', 'dokumente', 'datei', 'dateien', 'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'mein', 'meine', 'meinen', 'meines', 'meiner', 'zeige', 'zeig', 'finde', 'such', 'suche', 'wo', 'ist', 'fur', 'und', 'von', 'vom', 'mit', 'dieses', 'jahr', 'letzte', 'letzten', 'letzter', 'letztes', 'neueste', 'neuesten', 'enthalt', 'wort', 'kind', 'mich', 'schwangerschaft',
  // it
  'documenti', 'il', 'lo', 'gli', 'di', 'della', 'dello', 'dei', 'delle', 'uno', 'mio', 'mia', 'miei', 'mie', 'mostra', 'mostrami', 'trova', 'cerca', 'dove', 'per', 'questo', 'quest', 'anno', 'ultimi', 'ultime', 'contenente', 'parola', 'figlio', 'figlia', 'bambino', 'bambina', 'gravidanza', 'prenatale'
]);
const MORE_LANGS = new Set(['es', 'de', 'it']);

export function interpret(query: string, ctx: SearchContext): Interpretation {
  const now = ctx.now ?? new Date();
  const raw = query.trim();
  let f = fold(raw);
  const exactMatch = raw.match(/[«"“„](.+?)[»"”“]/) ?? raw.match(/(?:contenant|contient|containing|que contiene|contiene|conteniendo|contenente|enth[äa]lt|mit dem wort)\s+(?:le mot|the word|la palabra|la parola|das wort)?\s*([^\s,.]+)/i);
  const exact = exactMatch ? fold(exactMatch[1].trim()) : null;
  if (exactMatch) f = f.replace(fold(exactMatch[0]), ' ');
  const categories: DocCategory[] = [];
  for (const [re, cats] of CATEGORY_WORDS) if (re.test(f)) { for (const c of cats) if (!categories.includes(c)) categories.push(c); f = f.replace(re, ' '); }
  let year: number | null = null;
  if (/\b(cette annee|this year|este ano|quest.anno|questo anno|dieses jahr|diesem jahr)\b/.test(f)) year = now.getFullYear();
  const y = f.match(/\b(20\d{2})\b/);
  if (y) { year = +y[1]; f = f.replace(y[0], ' '); }
  const more = MORE_LANGS.has(getLocale());
  const latest = (more && /\bultime\b/.test(f)) || /\b(dernier|derniere|derniers|dernieres|latest|last|recent|recente|ultimo|ultima|ultimos|ultimas|ultimi|reciente|letzte|letzten|letzter|letztes|neueste|neuesten)\b/.test(f);
  let childId: string | null = null;
  for (const c of ctx.children) if (new RegExp(`\\b${fold(c.first_name)}\\b`).test(f)) { childId = c.id; f = f.replace(new RegExp(`\\b${fold(c.first_name)}\\b`), ' '); }
  if (!childId && /\b(mon enfant|my child|mi hij[oa]|mi nin[oa]|mio figlio|mia figlia|mein kind|meinem kind|meines kindes)\b/.test(f) && ctx.children.length === 1) childId = ctx.children[0].id;
  const me = /\b(pour moi|mes propres|for me|mine|para mi|mis propios|mis propias|per me|fur mich|meine eigenen)\b/.test(f);
  const pregnancy = /\b(grossesse|pregnancy|prenatal|embarazo|gravidanza|schwangerschaft|vorsorge)\b/.test(f) || (more && /\bprenatale\b/.test(f));
  const words = f.split(/[^a-z0-9µ]+/).filter((w) => w.length > 1 && !STOP.has(w) && !(more && STOP_MORE.has(w)));
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
    const hay = fold([d.title, categoryLabel(d.category, d.custom_category), d.custom_category ?? '', d.notes ?? '', d.ocr_text ?? '', date, d.doc_date ? new Date(d.doc_date).toLocaleDateString(DATE_TAG[getLocale()] ?? 'fr-FR', { month: 'long', year: 'numeric' }) : '', childName(d.child_id)].join(' \n '));
    if (it.exact && !hay.includes(it.exact)) return false;
    return it.words.every((w) => hay.includes(w));
  });
  out = [...out].sort((a, b) => (b.doc_date ?? b.created_at).localeCompare(a.doc_date ?? a.created_at));
  if (it.latest && out.length) out = out.slice(0, 1);
  return { results: out, interpretation: it };
}
