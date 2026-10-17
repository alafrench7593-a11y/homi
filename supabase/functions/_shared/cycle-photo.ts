/**
 * Analyse pédagogique d'une photo de glaire cervicale : consignes, schéma de réponse
 * et contrôle de la réponse du modèle. Module pur (Deno et Jest), sans dépendance.
 *
 * L'IA ne fait que proposer une CATÉGORIE d'aspect visuel ; elle ne dit jamais si la
 * personne ovule, est fertile, est enceinte ou malade. La confiance est plafonnée
 * (une photo ne donne jamais de certitude) et toute phrase sensible est retirée :
 * l'application écrit elle-même la formulation prudente affichée.
 */

export const CYCLE_PHOTO_CATEGORIES = ['dry', 'sticky', 'creamy', 'egg_white', 'watery', 'unusual', 'unanalyzable'] as const;
export type CyclePhotoCategory = (typeof CYCLE_PHOTO_CATEGORIES)[number];

export interface CyclePhotoSuggestion {
  analyzable: boolean;
  category: CyclePhotoCategory;
  /** Entre 0 et 0,8 (jamais de haute certitude à partir d'une photo). */
  confidence: number;
  /** Description courte et factuelle de l'aspect visible (≤ 200 caractères), éventuellement vide. */
  reason: string;
}

/** Taille maximale de l'image décodée (environ 1,5 Mo). */
export const CYCLE_PHOTO_MAX_BYTES = 1_572_864;
/** Confiance maximale renvoyée, quelle que soit la réponse du modèle. */
export const CYCLE_PHOTO_MAX_CONFIDENCE = 0.8;
export const CYCLE_PHOTO_REASON_MAX = 200;

/** Phrases retirées de l'explication : l'IA ne doit parler que de l'aspect visuel. */
const SENSITIVE = /ovul|enceinte|grossesse|diagnos|maladie|infection/i;

export const UNANALYZABLE: CyclePhotoSuggestion = Object.freeze({ analyzable: false, category: 'unanalyzable', confidence: 0, reason: '' }) as CyclePhotoSuggestion;

export const CYCLE_PHOTO_SCHEMA = {
  type: 'OBJECT',
  properties: {
    analyzable: { type: 'BOOLEAN' },
    category: { type: 'STRING', enum: [...CYCLE_PHOTO_CATEGORIES] },
    confidence: { type: 'NUMBER' },
    reason: { type: 'STRING' },
  },
  required: ['analyzable', 'category', 'confidence', 'reason'],
};

export const CYCLE_PHOTO_SYSTEM = [
  'Tu aides une application éducative à décrire l’ASPECT VISIBLE d’un échantillon de glaire cervicale photographié par la personne elle-même.',
  'Ta seule tâche : classer l’aspect visuel dans une catégorie pédagogique :',
  '- dry : sèche ou absente (peu ou pas de glaire visible) ;',
  '- sticky : épaisse ou collante, opaque, se casse vite ;',
  '- creamy : crémeuse, blanchâtre, onctueuse ;',
  '- egg_white : transparente et étirable, comme du blanc d’œuf cru ;',
  '- watery : aqueuse, très liquide et claire ;',
  '- unusual : aspect inhabituel (présence de sang, couleur verte, grise, jaune vif ou autre couleur inhabituelle, grumeaux marqués…) ;',
  '- unanalyzable : image inexploitable.',
  'Règles impératives :',
  '- Tu ne dis JAMAIS si la personne ovule, est fertile, est enceinte, ni si elle a une maladie ou une infection. Tu ne poses aucun diagnostic et ne donnes aucun conseil médical.',
  '- Si l’image ne montre pas un échantillon de glaire cervicale, est floue, trop sombre, trop éloignée ou ambiguë : analyzable = false et category = "unanalyzable".',
  '- Si tu vois du sang, une couleur inhabituelle ou un aspect qui sort des catégories ci-dessus : category = "unusual".',
  '- confidence est un nombre entre 0 et 1 ; reste bas (moins de 0,5) dès que tu as un doute. Une photo ne permet jamais une certitude.',
  '- reason : une phrase courte en français, factuelle, qui décrit uniquement l’aspect visible (couleur, transparence, texture apparente). Aucune interprétation sur le cycle, la fertilité ou la santé.',
  'Réponds uniquement avec le JSON demandé.',
].join('\n');

export const CYCLE_PHOTO_PROMPT = 'Classe l’aspect visible de cet échantillon selon les catégories prévues, en respectant strictement les règles.';

function clampConfidence(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 0;
  const c = Math.min(Math.max(n, 0), 1, CYCLE_PHOTO_MAX_CONFIDENCE);
  return Math.round(c * 100) / 100;
}

/** Retire les phrases sensibles puis limite la longueur. */
export function sanitizeReason(v: unknown): string {
  if (typeof v !== 'string') return '';
  const sentences = v.replace(/\s+/g, ' ').trim().split(/(?<=[.!?…;])\s+/);
  const kept = sentences.filter((s) => s && !SENSITIVE.test(s)).join(' ').trim();
  if (kept.length <= CYCLE_PHOTO_REASON_MAX) return kept;
  return kept.slice(0, CYCLE_PHOTO_REASON_MAX - 1).trimEnd() + '…';
}

/**
 * Valide et borne la réponse du modèle (texte JSON ou objet déjà analysé).
 * Toute réponse illisible devient « inexploitable ».
 */
export function parseCyclePhotoAnswer(raw: unknown): CyclePhotoSuggestion {
  let o: unknown = raw;
  if (typeof raw === 'string') {
    try { o = JSON.parse(raw); } catch { return { ...UNANALYZABLE }; }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { ...UNANALYZABLE };
  const r = o as Record<string, unknown>;
  const known = typeof r.category === 'string' && (CYCLE_PHOTO_CATEGORIES as readonly string[]).includes(r.category);
  let category: CyclePhotoCategory = known ? (r.category as CyclePhotoCategory) : 'unanalyzable';
  const analyzable = r.analyzable === true && category !== 'unanalyzable';
  if (!analyzable) category = 'unanalyzable';
  return { analyzable, category, confidence: clampConfidence(r.confidence), reason: sanitizeReason(r.reason) };
}

/** Taille décodée d'une chaîne base64 (sans la décoder). */
export function base64DecodedSize(b64: string): number {
  const len = b64.length;
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((len * 3) / 4) - pad;
}

export type CyclePhotoInput =
  | { ok: true; base64: string; mimeType: 'image/jpeg' }
  | { ok: false; status: number; error: string; message: string };

/** Contrôle du corps de requête : consentement explicite, JPEG en base64, taille maximale. */
export function checkCyclePhotoBody(body: unknown): CyclePhotoInput {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (b.consent !== true) {
    return { ok: false, status: 400, error: 'consent_required', message: 'Votre accord explicite est nécessaire pour envoyer la photo à l’analyse.' };
  }
  return checkCyclePhotoImage(b);
}

export function checkCyclePhotoImage(b: Record<string, unknown>): CyclePhotoInput {
  if (b.mime_type !== 'image/jpeg' || typeof b.image_base64 !== 'string') {
    return { ok: false, status: 400, error: 'bad_request', message: 'Photo invalide : une image JPEG est attendue.' };
  }
  const base64 = b.image_base64.replace(/^data:image\/jpeg;base64,/, '').replace(/\s+/g, '');
  if (base64DecodedSize(base64) > CYCLE_PHOTO_MAX_BYTES) {
    return { ok: false, status: 413, error: 'image_too_large', message: 'Photo trop lourde : 1,5 Mo au maximum.' };
  }
  // Signature JPEG (FF D8 FF) et alphabet base64
  if (base64.length < 8 || !base64.startsWith('/9j/') || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { ok: false, status: 400, error: 'bad_request', message: 'Photo invalide : une image JPEG est attendue.' };
  }
  return { ok: true, base64, mimeType: 'image/jpeg' };
}
