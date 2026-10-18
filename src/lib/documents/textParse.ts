/**
 * Lecture structurée d'un texte de document (issu de la lecture locale, du serveur ou d'une saisie).
 *
 * Principes :
 *  - On RECOPIE ce qui est écrit : valeurs, unités, doses et plages restent des chaînes exactes, jamais recalculées.
 *  - Ce qui manque reste manquant (null) : aucune dose, unité ou date n'est devinée.
 *  - Chaque élément garde sa ligne d'origine et un niveau de confiance de LECTURE (pas d'exactitude médicale).
 *  - Les dates à double lecture possible (jour/mois ≤ 12) sont marquées ambiguës : elles doivent être confirmées.
 *  - Aucun résultat n'est qualifié de « normal » ou « anormal ».
 */
import { suggestCategory, type DocCategory } from './taxonomy';

export type Confidence = 'high' | 'medium' | 'low';

export interface FoundDate { raw: string; iso: string | null; ambiguous: boolean; kind: 'document' | 'sampling' | 'appointment' | 'other'; line: number }
export interface LabValue { name: string; value: string; unit: string | null; range: string | null; raw: string; line: number; confidence: Confidence }
export interface Medication {
  name: string; dose: string | null; form: string | null; instructions: string | null; duration: string | null; renewal: string | null;
  raw: string; line: number; confidence: Confidence; missing: ('dose' | 'instructions' | 'duration')[];
}
export interface Mention { text: string; date: string | null; line: number }
export interface UncertainLine { text: string; line: number; reason: 'illegible' | 'garbled' | 'marker' }
export interface ParsedDocument {
  category: DocCategory | null;
  title: string | null;
  author: Mention | null;
  establishment: Mention | null;
  dates: FoundDate[];
  documentDate: FoundDate | null;
  values: LabValue[];
  medications: Medication[];
  vaccines: Mention[];
  deadlines: Mention[];
  conclusions: Mention[];
  /** Mention de renouvellement de l'ordonnance, recopiée. */
  renewal: string | null;
  recommendations: Mention[];
  uncertain: UncertainLine[];
  lineCount: number;
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const MONTHS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  janv: 1, fevr: 2, fev: 2, avr: 4, juil: 7, sept: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function isoOf(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null; // 31/02 etc.
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Toutes les dates d'une ligne (format jour/mois/année, ISO, ou « 12 octobre 2026 »). */
export function datesInLine(line: string, lineNo = 0): Omit<FoundDate, 'kind'>[] {
  const out: Omit<FoundDate, 'kind'>[] = [];
  // 12/10/2026, 12-10-26, 12.10.2026
  for (const m of line.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\b/g)) {
    const d = +m[1], mo = +m[2];
    const twoDigit = m[3].length === 2;
    const y = twoDigit ? 2000 + +m[3] : +m[3];
    const iso = isoOf(y, mo, d);
    out.push({ raw: m[0], iso, ambiguous: !iso || twoDigit || (d <= 12 && mo <= 12 && d !== mo), line: lineNo });
  }
  // 2026-10-12
  for (const m of line.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const iso = isoOf(+m[1], +m[2], +m[3]);
    out.push({ raw: m[0], iso, ambiguous: !iso, line: lineNo });
  }
  // 12 octobre 2026 / 1er mars 2026
  for (const m of line.matchAll(/\b(\d{1,2})(?:er)?\s+([A-Za-zÀ-ÿ]{3,9})\.?\s+(\d{4})\b/g)) {
    const mo = MONTHS[fold(m[2])];
    if (!mo) continue;
    const iso = isoOf(+m[3], mo, +m[1]);
    out.push({ raw: m[0], iso, ambiguous: !iso, line: lineNo });
  }
  return out;
}

const UNITS = [
  'g/l', 'mg/l', 'µg/l', 'ug/l', 'ng/ml', 'ng/l', 'pg/ml', 'mmol/l', 'µmol/l', 'umol/l', 'nmol/l', 'pmol/l', 'ui/l', 'u/l', 'mui/l', 'mui/ml', 'ui/ml',
  'g/dl', 'mg/dl', 'g/100ml', 'giga/l', 'tera/l', 'g/l', 't/l', '/mm3', '/mm³', '10^9/l', '10^12/l', '10*9/l', 'fl', 'pg', 'mm/h', 'sec', 's', '%', 'mg/24h', 'g/24h',
  'cm', 'mm', 'kg', 'g', 'sa', 'bpm', 'mmhg',
];
const UNIT_RE = UNITS.map((u) => u.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|');
// « Ferritine ......... 45 µg/L (15 - 150) » ; la valeur et la plage restent des chaînes exactes
const VALUE_RE = new RegExp(
  String.raw`^\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 '’().,β\-]{1,60}?)\s*[:.…\s]*\s((?:[<>≤≥]\s?)?\d+(?:[.,]\d+)?)\s*(` + UNIT_RE + String.raw`)?(?:\s|$)(?:.*?[([]?\s*((?:[<>≤≥]\s?)?\d+(?:[.,]\d+)?\s*(?:-|–|à|a|to)\s*\d+(?:[.,]\d+)?|[<>≤≥]\s?\d+(?:[.,]\d+)?)\s*(?:` + UNIT_RE + String.raw`)?\s*[)\]]?)?`,
  'i',
);
const NOT_A_VALUE = /\b(page|tel|tél|téléphone|fax|né|née|n°|numero|numéro|dossier|code|rpps|finess|adeli|ipp|siret|rue|avenue|bd|boulevard|cedex|age|âge|ans|semaine du)\b/i;

const FORMS = /\b(comprim[ée]s?|cp|g[ée]lules?|g[ée]l|sirop|sachets?|cr[èe]me|pommade|ampoules?|suppositoires?|gouttes?|solution|spray|collyre|patch|injectable|injection|ovules?|poudre|suspension)\b/i;
const DOSE = /\b(\d+(?:[.,]\d+)?\s?(?:mg\/5\s?ml|mg\/ml|microgrammes?|milligrammes?|mg|mcg|µg|ml|mL|ui|UI|g|%))(?![A-Za-zÀ-ÿ])/;
const DURATION = /\b(pendant\s+\d+\s*(?:jours?|j|semaines?|mois)|durant\s+\d+\s*(?:jours?|semaines?|mois)|qsp\s*\d+\s*(?:jours?|j|semaines?|mois)|\d+\s*(?:jours?|j)\s+de\s+traitement)\b/i;
const RENEWAL = /(?:^|\s)((?:[àaÀA])\s+renouveler(?:\s+\d+\s+fois)?|renouvelable(?:\s+\d+\s+fois)?|AR\s?\d+|non renouvelable)\b/i;
const INSTR = /\b(\d+(?:[.,]\d+)?\s*(?:comprim[ée]s?|cp|g[ée]lules?|sachets?|ml|gouttes?|bouff[ée]es?|applications?|dose[s]?)\b[^.\n]{0,80}|matin|midi|soir|au coucher|\d+\s*fois par jour|toutes les \d+\s*h(?:eures)?|\b\d-\d-\d\b)/i;

const VACCINE_NAME = /\b(hexyon|infanrix|vaxelis|prevenar|priorix|m-m-rvaxpro|gardasil|cervarix|bexsero|nimenrix|neisvac|engerix|rotarix|rotateq|bcg|revaxis|repevax|boostrix|tetravac|ror|dtp|dtca|coqueluche|rougeole|h[ée]patite b|m[ée]ningocoque|pneumocoque|grippe|influvac|vaxigrip|covid|comirnaty|spikevax|beyfortus|nirs[ée]vimab)\b/i;
const DEADLINE = /\b(rendez-vous|rdv|convocation|contr[ôo]le|[àa] revoir|revoir dans|prochaine? (?:consultation|visite|[ée]chographie|bilan|s[ée]ance)|examen pr[ée]vu|[àa] refaire|nouveau bilan|suivi dans|dans \d+ (?:jours|semaines|mois))\b/i;
const CONCLUSION = /^\s*(conclusion|en conclusion|synth[èe]se|impression|interpr[ée]tation|avis|r[ée]sultat|diagnostic retenu)\s*[:-]?/i;
const RECOMMEND = /\b(recommand\w*|conseill\w*|il est (?:conseill|recommand)\w*|[àa] prendre|[àa] poursuivre|surveillance|surveiller|[ée]viter|r[ée]gime|repos|hydratation)\b/i;
const AUTHOR = /((?:\b[Dd]r|\b[Dd]octeur|\b[Pp]r|\b[Pp]rofesseur|\b[Ss]age-femme|\bMme|\bM\.)\.?\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]+(?:\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]+)?)/;
const ESTABLISHMENT = /\b((?:laboratoire|labo|h[ôo]pital|clinique|chu|chr|centre hospitalier|centre m[ée]dical|cabinet|maternit[ée]|pmi|polyclinique|biologie m[ée]dicale)\b[^\n,]{0,60})/i;
const MARKERS = /\[(?:illisible|\?+|inaudible)\]|\?\?|■|�/i;

function lineKind(f: string): FoundDate['kind'] {
  if (/(prelev|recu le|edite le|prelevement)/.test(f)) return 'sampling';
  if (DEADLINE.test(f)) return 'appointment';
  if (/(^|\b)(le|fait le|date|du)\b/.test(f) || /(compte rendu|ordonnance|examen)/.test(f)) return 'document';
  return 'other';
}

/** Ligne probablement mal lue : trop de symboles, mots très courts collés, marqueurs d'illisibilité. */
export function looksGarbled(line: string): UncertainLine['reason'] | null {
  const t = line.trim();
  if (t.length < 4) return null;
  if (MARKERS.test(t)) return /illisible/i.test(t) ? 'illegible' : 'marker';
  const letters = (t.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  const symbols = (t.match(/[^A-Za-zÀ-ÿ0-9\s.,:;'’()/%<>=+\-–]/g) ?? []).length;
  if (t.length >= 8 && symbols / t.length > 0.25) return 'garbled';
  if (t.length >= 10 && letters / t.length < 0.3 && !/\d/.test(t)) return 'garbled';
  return null;
}

export function parseDocumentText(text: string, title = ''): ParsedDocument {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: ParsedDocument = {
    category: suggestCategory(text, title), title: null, author: null, establishment: null, dates: [], documentDate: null,
    values: [], medications: [], vaccines: [], deadlines: [], conclusions: [], renewal: null, recommendations: [], uncertain: [], lineCount: lines.length,
  };
  const isPrescription = out.category === 'prescription';
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    const f = fold(t);
    if (!out.title && t.length >= 6 && t.length <= 80 && /[A-Za-zÀ-ÿ]{4}/.test(t) && !AUTHOR.test(t) && !/\d{2}[/.-]\d{2}/.test(t)) {
      if (/^(compte rendu|ordonnance|r[ée]sultats?|bilan|certificat|[ée]chographie|carnet|courrier|attestation|facture|convocation)/i.test(t) || t === t.toUpperCase()) out.title = t;
    }
    const a = t.match(AUTHOR);
    if (a && !out.author) out.author = { text: a[1].trim(), date: null, line: i };
    const e = t.match(ESTABLISHMENT);
    if (e && !out.establishment) out.establishment = { text: e[1].trim().replace(/[\s.:;-]+$/, ''), date: null, line: i };

    const ds = datesInLine(t, i);
    const kind = lineKind(f);
    for (const d of ds) out.dates.push({ ...d, kind });

    const bad = looksGarbled(t);
    if (bad) { out.uncertain.push({ text: t, line: i, reason: bad }); return; }

    // Valeurs chiffrées (analyses, mesures)
    if (!isPrescription && !NOT_A_VALUE.test(t) && !ds.length) {
      const m = t.match(VALUE_RE);
      if (m && m[1] && /[A-Za-zÀ-ÿ]{2}/.test(m[1])) {
        const name = m[1].replace(/[\s.:…]+$/, '').trim();
        const unit = m[3] ?? null;
        const range = m[4] ? m[4].replace(/\s+/g, ' ').trim() : null;
        out.values.push({ name, value: m[2].replace(/\s/g, ''), unit, range, raw: t, line: i, confidence: unit ? (range ? 'high' : 'medium') : 'low' });
      }
    }

    // Ordonnance : une ligne de médicament a une dose OU une forme pharmaceutique, et commence par un nom
    if (isPrescription && (DOSE.test(t) || FORMS.test(t)) && /^[A-Za-zÀ-ÿ]/.test(t) && !/^(dr|docteur|le |fait|date|ordonnance|patient|nom|n[ée] le)/i.test(t)) {
      const dose = t.match(DOSE)?.[1] ?? null;
      const form = t.match(FORMS)?.[1] ?? null;
      const nameEnd = Math.min(...[t.search(DOSE), t.search(FORMS), t.length].filter((x) => x > 0));
      const name = t.slice(0, nameEnd).replace(/[\s,:;-]+$/, '').trim();
      // Les consignes peuvent être sur la ligne suivante (format courant des ordonnances)
      const next = (lines[i + 1] ?? '').trim();
      const nextIsInstr = next && !DOSE.test(next) && INSTR.test(next);
      const instrSrc = INSTR.test(t.slice(nameEnd + (dose?.length ?? 0))) ? t : nextIsInstr ? next : '';
      const instructions = instrSrc ? instrSrc.replace(name, '').replace(dose ?? '', '').replace(/^[\s,:;-]+/, '').trim() || null : null;
      const duration = (t.match(DURATION) ?? next.match(DURATION))?.[1] ?? null;
      const renewal = (t.match(RENEWAL) ?? next.match(RENEWAL))?.[1] ?? null;
      const missing: Medication['missing'] = [];
      if (!dose) missing.push('dose');
      if (!instructions) missing.push('instructions');
      if (!duration) missing.push('duration');
      if (name.length >= 2) {
        out.medications.push({ name, dose, form, instructions, duration, renewal, raw: nextIsInstr ? `${t}\n${next}` : t, line: i, confidence: dose && instructions ? 'high' : dose || instructions ? 'medium' : 'low', missing });
      }
    }

    // Mention de vaccination : un vaccin ou une maladie nommés, ou « vaccin/rappel » avec une date (un simple titre ne compte pas)
    if (VACCINE_NAME.test(t) || (/\b(vaccin\w*|rappel)\b/i.test(t) && ds.length)) out.vaccines.push({ text: t, date: ds[0]?.raw ?? null, line: i });
    if (isPrescription && !out.renewal) { const r = t.match(RENEWAL); if (r) out.renewal = r[1]; }
    if (DEADLINE.test(t)) out.deadlines.push({ text: t, date: ds[0]?.raw ?? null, line: i });
    if (CONCLUSION.test(t)) out.conclusions.push({ text: t, date: null, line: i });
    else if (RECOMMEND.test(t) && !isPrescription) out.recommendations.push({ text: t, date: null, line: i });
  });
  // Date du document : la première date « document », sinon la première date non liée à un rendez-vous
  out.documentDate = out.dates.find((d) => d.kind === 'document' && d.iso) ?? out.dates.find((d) => d.kind !== 'appointment' && d.iso) ?? null;
  return out;
}

/** Valeur recopiée telle quelle ? (protection contre les erreurs de transcription dans un résumé) */
export function appearsVerbatim(source: string, value: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, ' ').replace(/,/g, '.').toLowerCase();
  return norm(source).includes(norm(value));
}
