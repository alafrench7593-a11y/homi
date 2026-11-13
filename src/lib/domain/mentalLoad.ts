/**
 * Charge mentale (07/11/2026) — logique pure, testée par Jest :
 *  - « Vider ma tête » : découpe un texte libre en éléments et propose un rangement (tâche, rendez-vous, course,
 *    papier) avec une date quand elle est écrite ; c'est une PROPOSITION, chaque élément reste modifiable ;
 *  - domaines confiables et lien avec les catégories de tâches ;
 *  - « Qui y pense » : qui note, qui fait, qui porte quels domaines (sur les tâches du foyer) ;
 *  - échéances à préparer (rentrée, vacances, anniversaires, saisons, papiers qui expirent) ;
 *  - « Je suis à bout » : 6 questions, un niveau de fatigue ressentie — JAMAIS un diagnostic ;
 *  - papiers de la famille et listes INDICATIVES par démarche (à vérifier sur service-public.fr).
 */
import { addDays, type ISODate } from './dates';

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

// ---------------------------------------------------------------- « Vider ma tête »
export type DumpKind = 'task' | 'event' | 'shopping' | 'admin' | 'appointment';
export interface DumpItem { text: string; kind: DumpKind; date: ISODate | null; time: string | null; domain: DomainKey | null }

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const WEEKDAYS_EN = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Date écrite dans le texte (aujourd'hui, demain, un jour de la semaine, « le 12 », « 12/11 »), sinon null. */
export function extractDate(text: string, today: ISODate): ISODate | null {
  const t = fold(text);
  if (/\b(aujourd hui|ce soir|ce matin|today|tonight)\b/.test(t)) return today;
  if (/\bapres[- ]demain\b/.test(t)) return addDays(today, 2);
  if (/\b(demain|tomorrow)\b/.test(t)) return addDays(today, 1);
  const [y, m, d] = today.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  for (const list of [WEEKDAYS, WEEKDAYS_EN]) {
    const i = list.findIndex((w) => new RegExp(`\\b${w}\\b`).test(t));
    if (i >= 0) return addDays(today, ((i - wd + 7) % 7) || 7);
  }
  const dm = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dm) {
    const day = Number(dm[1]), mon = Number(dm[2]);
    let year = dm[3] ? Number(dm[3].length === 2 ? `20${dm[3]}` : dm[3]) : y;
    if (!dm[3] && (mon < m || (mon === m && day < d))) year += 1;
    if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) return `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const le = t.match(/\ble (\d{1,2})\b(?!\s*h)/);
  if (le) {
    const day = Number(le[1]);
    if (day >= 1 && day <= 31) {
      let mon = m, year = y;
      if (day < d) { mon += 1; if (mon > 12) { mon = 1; year += 1; } }
      return `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

/** Heure écrite (« à 14h », « 9h30 », « 18:00 »), sinon null. */
export function extractTime(text: string): string | null {
  const m = fold(text).match(/\b([01]?\d|2[0-3])\s?(?:h|:)\s?([0-5]\d)?\b/);
  return m ? `${m[1].padStart(2, '0')}:${m[2] ?? '00'}` : null;
}

const SHOP = /\b(acheter|racheter|plus de|plus d|manque|courses|couches?|lait|lingettes|pain|fruits?|legumes?|savon|shampo|liniment|biberons?|cadeau)\b/;
const ADMIN = /\b(caf|mutuelle|impots?|papiers?|formulaire|dossier|inscri|attestation|assurance|passeport|carte d identite|securite sociale|ameli|banque|declaration|creche|cantine|pai)\b/;
const APPT = /\b(rdv|rendez[- ]vous|pediatre|medecin|docteur|dentiste|orthophon|kine|sage[- ]femme|gyneco|pmi|vaccin|ophtalmo|osteo)\b/;
const EVENT = /\b(anniversaire|reunion|spectacle|fete|sortie|match|cours de|piscine|danse|foot|judo|kermesse)\b/;

export function classifyDump(text: string): DumpKind {
  const t = fold(text);
  if (APPT.test(t)) return /\b(prendre|appeler|reserver|caler)\b/.test(t) || !extractTime(t) ? 'appointment' : 'event';
  if (ADMIN.test(t)) return 'admin';
  if (SHOP.test(t)) return 'shopping';
  if (EVENT.test(t) || (extractTime(t) && extractDate(t, '2000-01-01'))) return 'event';
  return 'task';
}

/** Découpe un texte libre (lignes, puces, virgules, points-virgules) en éléments rangés. */
export function parseBrainDump(text: string, today: ISODate): DumpItem[] {
  return text
    .split(/[\n;,•]+|\s-\s/)
    .map((s) => s.replace(/^\s*[-*\d.)]+\s*/, '').trim())
    .filter((s) => s.length >= 2)
    .slice(0, 40)
    .map((s) => {
      const kind = classifyDump(s);
      return { text: s.charAt(0).toUpperCase() + s.slice(1), kind, date: extractDate(s, today), time: extractTime(s), domain: domainForText(s, kind) };
    });
}

// ---------------------------------------------------------------- domaines confiables
export const DOMAINS = ['health', 'school', 'activities', 'birthdays', 'shopping', 'meals', 'laundry', 'admin', 'home', 'holidays', 'clothes', 'nights', 'baby', 'childcare', 'pets'] as const;
export type DomainKey = (typeof DOMAINS)[number];

/** Catégorie de tâche du foyer → domaine (pour proposer la bonne personne). */
export const DOMAIN_OF_CATEGORY: Partial<Record<string, DomainKey>> = {
  appointments: 'health', shopping: 'shopping', admin: 'admin', housework: 'home', feeding: 'meals', packing: 'holidays', sleep: 'nights',
  diapers: 'baby', childcare: 'childcare', pets: 'pets', health: 'health',
};

export function domainForText(text: string, kind?: DumpKind): DomainKey | null {
  const t = fold(text);
  if (kind === 'appointment' || APPT.test(t)) return 'health';
  if (/\b(ecole|creche|nounou|maitresse|cartable|devoirs|cantine|periscolaire)\b/.test(t)) return 'school';
  if (/\b(anniversaire|cadeau|invitation)\b/.test(t)) return 'birthdays';
  if (/\b(piscine|danse|foot|judo|musique|activite|club|cours de)\b/.test(t)) return 'activities';
  if (/\b(linge|lessive|machine|repassage)\b/.test(t)) return 'laundry';
  if (/\b(vetements?|chaussures|taille|pyjama|manteau)\b/.test(t)) return 'clothes';
  if (/\b(vacances|valise|billets?|location)\b/.test(t)) return 'holidays';
  if (/\b(repas|menu|diner|dejeuner|gouter)\b/.test(t)) return 'meals';
  if (kind === 'admin' || ADMIN.test(t)) return 'admin';
  if (kind === 'shopping' || SHOP.test(t)) return 'shopping';
  if (/\b(menage|aspirateur|bricolage|plombier|reparer|maison)\b/.test(t)) return 'home';
  return null;
}

/** Catégorie family_tasks d'un élément « Vider ma tête ». */
export function taskCategoryOf(item: Pick<DumpItem, 'kind' | 'domain'>): string {
  if (item.kind === 'shopping') return 'shopping';
  if (item.kind === 'admin') return 'admin';
  if (item.kind === 'appointment') return 'appointments';
  if (item.domain === 'home' || item.domain === 'laundry') return 'housework';
  if (item.domain === 'meals') return 'feeding';
  if (item.domain === 'holidays') return 'packing';
  return 'organization';
}

// ---------------------------------------------------------------- « Qui y pense »
export interface LoadTask { created_by: string | null; assignee_id: string | null; done_by: string | null; status: string; created_at: string }
export interface LoadRow { person: string; thought: number; done: number; assigned: number; domains: number }

/** Qui a noté, qui a fait, à qui c'est confié, qui porte combien de domaines — sur les `days` derniers jours. */
export function mentalLoad(tasks: LoadTask[], domains: { owner_id: string | null }[], people: string[], now: Date = new Date(), days = 30): LoadRow[] {
  const since = now.getTime() - days * 86_400_000;
  const recent = tasks.filter((x) => Date.parse(x.created_at) >= since);
  return people.map((p) => ({
    person: p,
    thought: recent.filter((x) => x.created_by === p).length,
    done: recent.filter((x) => x.status === 'done' && x.done_by === p).length,
    assigned: recent.filter((x) => x.status !== 'cancelled' && x.assignee_id === p).length,
    domains: domains.filter((d) => d.owner_id === p).length,
  }));
}

/** Part (0–100) de chaque personne pour une mesure ; null si rien à comparer. */
export function shares(rows: LoadRow[], key: keyof Omit<LoadRow, 'person'>): Record<string, number> | null {
  const total = rows.reduce((s, r) => s + r[key], 0);
  if (!total) return null;
  return Object.fromEntries(rows.map((r) => [r.person, Math.round((r[key] / total) * 100)]));
}

// ---------------------------------------------------------------- échéances à préparer
export interface PrepItem { key: string; kind: 'school' | 'summer' | 'christmas' | 'birthday' | 'clothes' | 'taxes' | 'paper'; occursOn: ISODate; leadDays: number; childId?: string | null; label?: string | null; checklist: string[]; domain: DomainKey }

export const CHECKLISTS: Record<PrepItem['kind'], string[]> = {
  school: ['supplies', 'insurance', 'canteen', 'shoes', 'certificate'],
  summer: ['booking', 'papers', 'meds', 'childcare'],
  christmas: ['gifts', 'organisation', 'childcare'],
  birthday: ['guests', 'gift', 'cake'],
  clothes: ['sort', 'sizes', 'buy'],
  taxes: ['date', 'childcare_costs', 'documents'],
  paper: ['renew'],
};
const DOMAIN_OF_PREP: Record<PrepItem['kind'], DomainKey> = { school: 'school', summer: 'holidays', christmas: 'holidays', birthday: 'birthdays', clothes: 'clothes', taxes: 'admin', paper: 'admin' };

const nextOn = (today: ISODate, month: number, day: number): ISODate => {
  const y = Number(today.slice(0, 4));
  const cand = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return cand >= today ? cand : `${y + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** Échéances des `horizon` prochains jours (préparation à commencer `leadDays` avant), triées par date. */
export function upcomingPrep(today: ISODate, children: { id: string; first_name: string; birth_date: string }[], papers: { id: string; kind: string; label: string | null; expires_on: string | null; child_id: string | null }[], horizon = 75): PrepItem[] {
  const until = addDays(today, horizon);
  const items: PrepItem[] = [];
  const push = (it: Omit<PrepItem, 'checklist' | 'domain'>) => { if (it.occursOn >= today && it.occursOn <= until) items.push({ ...it, checklist: CHECKLISTS[it.kind], domain: DOMAIN_OF_PREP[it.kind] }); };
  const ageYears = (b: string, on: ISODate) => (Date.parse(on) - Date.parse(b)) / (365.25 * 86_400_000);
  const school = nextOn(today, 9, 1);
  if (children.some((c) => ageYears(c.birth_date, school) >= 2.5 && ageYears(c.birth_date, school) < 18)) push({ key: 'school', kind: 'school', occursOn: school, leadDays: 30 });
  push({ key: 'summer', kind: 'summer', occursOn: nextOn(today, 7, 5), leadDays: 45 });
  push({ key: 'christmas', kind: 'christmas', occursOn: nextOn(today, 12, 20), leadDays: 30 });
  for (const s of [[4, 1], [10, 1]] as const) if (children.length) push({ key: `clothes_${s[0]}`, kind: 'clothes', occursOn: nextOn(today, s[0], s[1]), leadDays: 14 });
  push({ key: 'taxes', kind: 'taxes', occursOn: nextOn(today, 4, 15), leadDays: 14 });
  for (const c of children) {
    const [, bm, bd] = c.birth_date.split('-').map(Number);
    push({ key: `birthday_${c.id}`, kind: 'birthday', occursOn: nextOn(today, bm, bd), leadDays: 21, childId: c.id, label: c.first_name });
  }
  for (const p of papers) if (p.expires_on) push({ key: `paper_${p.id}`, kind: 'paper', occursOn: p.expires_on, leadDays: 60, childId: p.child_id, label: p.label ?? p.kind });
  return items.sort((a, b) => a.occursOn.localeCompare(b.occursOn));
}

/** La préparation a commencé (on est dans la fenêtre « leadDays » avant l'échéance). */
export const prepDue = (it: PrepItem, today: ISODate) => addDays(it.occursOn, -it.leadDays) <= today;

// ---------------------------------------------------------------- « Je suis à bout »
export const EXHAUSTION_QUESTIONS = ['tired', 'sleep', 'irritable', 'distance', 'overwhelmed', 'no_time'] as const;
export type ExhaustionLevel = 'low' | 'medium' | 'high';
/** 6 réponses de 0 (jamais) à 3 (presque tout le temps) → niveau de fatigue RESSENTIE (pas un diagnostic). */
export function exhaustionLevel(answers: number[]): { total: number; level: ExhaustionLevel } {
  const total = answers.slice(0, 6).reduce((s, v) => s + Math.max(0, Math.min(3, Math.round(v))), 0);
  return { total, level: total >= 12 ? 'high' : total >= 6 ? 'medium' : 'low' };
}

// ---------------------------------------------------------------- papiers de la famille
export const PAPER_KINDS = [
  'family_book', 'birth_certificate', 'id_card', 'passport', 'id_photo', 'health_card', 'mutual_card', 'vaccination_record',
  'proof_address', 'tax_notice', 'caf_certificate', 'school_insurance', 'school_certificate', 'custody_judgment', 'travel_authorisation', 'pai',
] as const;
export type PaperKind = (typeof PAPER_KINDS)[number];
/** Papiers qui ont une date d'expiration à suivre. */
export const EXPIRING: PaperKind[] = ['id_card', 'passport', 'health_card', 'mutual_card', 'school_insurance', 'proof_address', 'pai'];
/** Papiers propres à chaque enfant (les autres concernent la famille). */
export const PER_CHILD: PaperKind[] = ['birth_certificate', 'id_card', 'passport', 'id_photo', 'vaccination_record', 'school_insurance', 'school_certificate', 'travel_authorisation', 'pai'];

export const PROCEDURES = ['school', 'caf', 'child_id', 'canteen', 'travel', 'health'] as const;
export type Procedure = (typeof PROCEDURES)[number];
/** Listes INDICATIVES (la liste exacte dépend de la mairie, de l'école, de la caisse : à vérifier). */
export const PROCEDURE_PAPERS: Record<Procedure, PaperKind[]> = {
  school: ['family_book', 'proof_address', 'vaccination_record', 'custody_judgment'],
  caf: ['family_book', 'birth_certificate', 'proof_address', 'tax_notice', 'id_card'],
  child_id: ['birth_certificate', 'id_photo', 'proof_address', 'id_card', 'custody_judgment'],
  canteen: ['school_insurance', 'vaccination_record', 'pai', 'caf_certificate'],
  travel: ['id_card', 'passport', 'travel_authorisation', 'health_card'],
  health: ['health_card', 'mutual_card', 'vaccination_record'],
};

export type PaperStatus = 'ok' | 'expiring' | 'expired' | 'no_photo' | 'missing';
export function paperStatus(p: { document_id: string | null; expires_on: string | null } | undefined, today: ISODate): PaperStatus {
  if (!p) return 'missing';
  if (p.expires_on && p.expires_on < today) return 'expired';
  if (p.expires_on && p.expires_on <= addDays(today, 60)) return 'expiring';
  return p.document_id ? 'ok' : 'no_photo';
}
