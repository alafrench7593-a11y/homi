/**
 * Formulaire de contact du site (/contact/) : validation stricte, pot de miel, limite de débit, message texte brut vers la
 * boîte HOMI. Aucune donnée stockée en base ; rien envoyé à un outil de mesure. Envoi par Resend (clé côté serveur).
 */
export const CONTACT_TO = 'homixyz@gmail.com';
export const CATEGORIES = ['Assistance technique', 'Problème de connexion', 'Abonnement', 'Facturation', 'Signaler un bug',
  'Suggestion de fonctionnalité', 'Programme Ambassadeurs', 'Collaboration', 'Partenariat', 'Presse', 'Protection des données', 'Autre demande'] as const;

export type ContactInput = { category: string; name: string; email: string; subject: string; message: string; website?: string; consent?: boolean };
export type Checked = { ok: true; value: Required<Omit<ContactInput, 'website' | 'consent'>> } | { ok: false; error: string; spam?: boolean };

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '');
const oneLine = (v: string) => v.replace(/[\r\n]+/g, ' ');

export function checkContact(body: unknown): Checked {
  const b = (body ?? {}) as Record<string, unknown>;
  if (clean(b.website, 200)) return { ok: false, error: 'spam', spam: true };            // pot de miel rempli par un robot
  if (b.consent !== true) return { ok: false, error: 'consent' };
  const category = clean(b.category, 60);
  if (!(CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: 'category' };
  const name = oneLine(clean(b.name, 60)); const email = oneLine(clean(b.email, 200)).toLowerCase();
  const subject = oneLine(clean(b.subject, 120)); const message = clean(b.message, 5000);
  if (!name || !subject || message.length < 5) return { ok: false, error: 'required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'email' };
  if ((message.match(/https?:\/\//g) ?? []).length > 5) return { ok: false, error: 'spam', spam: true };
  return { ok: true, value: { category, name, email, subject, message } };
}

/** Limite simple par adresse IP (mémoire de l'instance) : 5 messages / 10 min. */
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, now = Date.now(), max = 5, windowMs = 600_000): boolean {
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list); return false;
}

export function buildMail(v: Required<Omit<ContactInput, 'website' | 'consent'>>, from: string) {
  return { from, to: [CONTACT_TO], reply_to: v.email, subject: `[HOMI · ${v.category}] ${v.subject}`,
    text: `${v.message}\n\n—\nDe : ${v.name} <${v.email}>\nSujet : ${v.category}\nEnvoyé depuis le formulaire de contact du site HOMI.` };
}
