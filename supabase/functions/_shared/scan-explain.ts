/**
 * Explication IA d'un résultat du scanner : construction du prompt et contrôle de la réponse.
 * L'IA n'a AUCUN pouvoir de décision : le verdict, les constats et les sources viennent des moteurs
 * de règles ; elle reformule en français clair. Toute réponse qui contient une promesse d'innocuité,
 * un autre verdict ou un JSON invalide est rejetée (l'application affiche alors l'explication des règles).
 * Module pur (Deno et Jest).
 */

export const RECALL_DISCLAIMER = 'L’absence de rappel officiel ne signifie pas que le produit est garanti sans danger.';

/** Formulations interdites : promesses d'innocuité ou vocabulaire alarmiste. */
export const FORBIDDEN_PATTERNS: RegExp[] = [
  /sans\s+toxines?/i,
  /totalement\s+sans\s+danger/i,
  /sans\s+(aucun\s+)?danger/i,
  /sans\s+aucun\s+risque/i,
  /z[ée]ro\s+risque/i,
  /100\s*%\s*(s[ûu]r|sain|naturel|sans)/i,
  /inoffensi(f|ve)/i,
  /garanti[e]?\s+sans\s+(danger|risque)/i,
  /parfaitement\s+s[ûu]r/i,
  /\bnon\s+toxique\b/i,
  /dangereu(x|se)/i,
];
const ALLOWED_SENTENCES = [RECALL_DISCLAIMER, 'L’absence d’alerte ne signifie pas qu’un produit est sans danger.'];

export function containsForbiddenPhrase(text: string): string | null {
  let t = text;
  for (const s of ALLOWED_SENTENCES) t = t.split(s).join(' ');
  for (const p of FORBIDDEN_PATTERNS) {
    const m = t.match(p);
    if (m) return m[0];
  }
  return null;
}

export const ALLOWED_VERDICTS = [
  'Adapté selon les informations disponibles', 'Adapté avec précautions', 'Déconseillé pour ce profil selon la source indiquée', 'Informations insuffisantes',
  'Adapté sous certaines conditions', 'À préparer différemment', 'À éviter pour ce profil selon la source indiquée', 'Impossible à confirmer',
];

export interface ExplainPayload {
  kind: 'product' | 'food';
  verdict: string;
  verdictReason: string;
  certainty: string;
  profileLabel: string;
  subject: { name: string | null; brand: string | null };
  findings: { level: string; title: string; explanation: string; sources: number[] }[];
  missing: string[];
  sources: { n: number; label: string; publisher: string; date: string; url: string }[];
  demo: boolean;
}

const clip = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/** Valide et borne la charge envoyée par l'application (jamais de donnée nominative). */
export function sanitizePayload(b: unknown): ExplainPayload | null {
  const x = b as Record<string, unknown>;
  if (!x || (x.kind !== 'product' && x.kind !== 'food')) return null;
  const verdict = clip(x.verdict, 120);
  if (!ALLOWED_VERDICTS.includes(verdict)) return null;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const subject = (x.subject ?? {}) as Record<string, unknown>;
  return {
    kind: x.kind,
    verdict,
    verdictReason: clip(x.verdictReason, 600),
    certainty: clip(x.certainty, 20),
    profileLabel: clip(x.profileLabel, 60),
    subject: { name: subject.name ? clip(subject.name, 120) : null, brand: subject.brand ? clip(subject.brand, 80) : null },
    findings: arr(x.findings).slice(0, 15).map((f) => {
      const o = f as Record<string, unknown>;
      return { level: clip(o.level, 20), title: clip(o.title, 200), explanation: clip(o.explanation, 600), sources: arr(o.sources).map(Number).filter((n) => Number.isInteger(n)).slice(0, 5) };
    }),
    missing: arr(x.missing).slice(0, 10).map((m) => clip(m, 160)),
    sources: arr(x.sources).slice(0, 12).map((s, i) => {
      const o = s as Record<string, unknown>;
      return { n: Number(o.n) || i + 1, label: clip(o.label, 200), publisher: clip(o.publisher, 120), date: clip(o.date, 20), url: clip(o.url, 300) };
    }),
    demo: x.demo === true,
  };
}

export const EXPLAIN_SYSTEM = `Tu expliques, en français clair et bienveillant, le résultat d'une analyse déjà faite par des règles sourcées
(application « Au fil de nous » pour futurs parents et parents). Règles absolues :
- Tu ne décides RIEN : tu reprends le verdict fourni MOT POUR MOT, sans le nuancer ni le contredire.
- Tu n'utilises QUE les constats, informations manquantes et sources fournis. Aucun fait nouveau, aucun chiffre nouveau.
- Tu n'affirmes jamais qu'un produit ou un aliment est sûr, sain, sans danger, sans risque, sans toxines ou non toxique.
- Si des informations manquent, tu le dis clairement et tu expliques ce qu'il faudrait vérifier.
- Pas de diagnostic, pas d'allergie supposée, pas de dosage. Pour un médicament, une huile essentielle ou un complément : renvoi vers pharmacien, sage-femme ou médecin.
- Chaque point cite la ou les sources par leur numéro entre crochets, ex. [1].
- Ton neutre, phrases courtes, vouvoiement.
Réponds UNIQUEMENT avec un objet JSON : {"summary": string (2 phrases max), "points": string[] (3 à 6), "missing": string[], "next_step": string}.`;

export const EXPLAIN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    points: { type: 'ARRAY', items: { type: 'STRING' } },
    missing: { type: 'ARRAY', items: { type: 'STRING' } },
    next_step: { type: 'STRING' },
  },
  required: ['summary', 'points', 'missing', 'next_step'],
};

export function buildExplainPrompt(p: ExplainPayload): string {
  const lines = [
    `Type : ${p.kind === 'product' ? 'produit (cosmétique, soin, entretien…)' : 'aliment'}`,
    `Pour : ${p.profileLabel}`,
    `Produit ou aliment : ${[p.subject.name, p.subject.brand].filter(Boolean).join(' — ') || 'non précisé'}`,
    `VERDICT (à reprendre mot pour mot) : ${p.verdict}`,
    `Raison du verdict : ${p.verdictReason}`,
    `Niveau de certitude : ${p.certainty}`,
    p.demo ? 'ATTENTION : données de démonstration (fictives) — dis-le.' : '',
    'Constats :',
    ...p.findings.map((f, i) => `${i + 1}. [${f.level}] ${f.title} — ${f.explanation} (sources ${f.sources.map((n) => `[${n}]`).join(' ') || 'aucune'})`),
    `Informations manquantes : ${p.missing.length ? p.missing.join(' ; ') : 'aucune signalée'}`,
    'Sources :',
    ...p.sources.map((s) => `[${s.n}] ${s.publisher} — ${s.label} (${s.date})`),
  ];
  return lines.filter(Boolean).join('\n');
}

export interface Explanation { summary: string; points: string[]; missing: string[]; next_step: string }

/** Contrôle de la réponse : JSON valide, pas de formulation interdite, pas d'autre verdict que celui des règles. */
export function checkExplanation(raw: string, p: ExplainPayload): { ok: true; explanation: Explanation } | { ok: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
  const o = parsed as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => clip(x, 500)).filter(Boolean) : []);
  const e: Explanation = { summary: clip(o.summary, 500), points: arr(o.points).slice(0, 8), missing: arr(o.missing).slice(0, 8), next_step: clip(o.next_step, 400) };
  if (!e.summary || e.points.length === 0) return { ok: false, reason: 'empty' };
  const all = [e.summary, ...e.points, ...e.missing, e.next_step].join('\n');
  const bad = containsForbiddenPhrase(all);
  if (bad) return { ok: false, reason: `forbidden:${bad}` };
  for (const v of ALLOWED_VERDICTS) if (v !== p.verdict && all.includes(v) && !p.verdict.includes(v)) return { ok: false, reason: 'other_verdict' };
  if (p.missing.length > 0 && e.missing.length === 0 && !/manque|insuffisant|pas (encore )?connu|à vérifier|non disponible|inconnu/i.test(all)) return { ok: false, reason: 'missing_ignored' };
  return { ok: true, explanation: e };
}
