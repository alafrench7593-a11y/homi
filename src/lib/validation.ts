/**
 * Schémas de validation des formulaires. Les messages sont des CLÉS de traduction (encodées),
 * traduites au moment de l'affichage par issueText()/fieldErrors() : la langue choisie s'applique
 * même si les schémas ont été créés au démarrage.
 */
import { z } from 'zod';
import { t as tr, type TKey } from '@/i18n';

const MARK = '\u0001';
/** Message encodé : clé de traduction + paramètres éventuels. */
export const vk = (key: TKey, params?: Record<string, string | number>) => `${MARK}${key}${params ? `|${JSON.stringify(params)}` : ''}`;
/** Texte affichable d'un message de validation (clé encodée → traduction ; texte libre → inchangé). */
export function issueText(message: string | undefined): string {
  if (!message) return tr('common.error');
  if (!message.startsWith(MARK)) return message;
  const [key, raw] = message.slice(1).split(/\|(.*)/s);
  let params: Record<string, string | number> | undefined;
  try { params = raw ? JSON.parse(raw) : undefined; } catch { params = undefined; }
  return tr(key as TKey, params);
}
import { frToISO } from './domain/dates';

export const emailSchema = z.string().trim().min(1, vk('v.email.required')).email(vk('v.email.invalid'));

/** Mot de passe : 8 caractères minimum, au moins une lettre et un chiffre (règles affichées en direct). */
export const passwordSchema = z
  .string()
  .min(8, vk('v.password.length'))
  .regex(/\p{L}/u, vk('v.password.letter'))
  .regex(/[0-9]/, vk('v.password.digit'));

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    adult: z.literal(true, { message: vk('v.adult') }),
    terms: z.literal(true, { message: vk('v.terms') }),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: vk('v.password.mismatch') });

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, vk('v.password.required')) });

/** Date saisie JJ/MM/AAAA -> ISO, avec bornes. */
export const frDate = (opts: { label: string; labelKey?: TKey; past?: boolean; future?: boolean; optional?: boolean }) =>
  z.string().trim().transform((v, ctx) => {
    if (!v) {
      if (opts.optional) return null;
      ctx.addIssue({ code: 'custom', message: opts.labelKey ? vk(opts.labelKey) : vk('v.required', { label: opts.label }) });
      return z.NEVER;
    }
    const iso = frToISO(v);
    if (!iso) {
      ctx.addIssue({ code: 'custom', message: vk('v.dateFormat') });
      return z.NEVER;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (opts.past && iso > today) {
      ctx.addIssue({ code: 'custom', message: vk('v.datePast') });
      return z.NEVER;
    }
    if (opts.future && iso < today) {
      ctx.addIssue({ code: 'custom', message: vk('v.dateFuture') });
      return z.NEVER;
    }
    return iso;
  });

export const childSchema = z.object({
  first_name: z.string().trim().min(1, vk('v.childName')).max(40, vk('v.max40')),
  birth_date: frDate({ label: 'la date de naissance', labelKey: 'v.birthDate', past: true }),
});

export const numberIn = (label: string, min: number, max: number, optional = false) =>
  z.string().trim().transform((v, ctx) => {
    if (!v) {
      if (optional) return null;
      ctx.addIssue({ code: 'custom', message: vk('v.required', { label }) });
      return z.NEVER;
    }
    const n = Number(v.replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max) {
      ctx.addIssue({ code: 'custom', message: vk('v.between', { min, max }) });
      return z.NEVER;
    }
    return n;
  });

/** Première erreur par champ, pour l'affichage sous chaque champ. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? '_');
    if (!out[k]) out[k] = issueText(issue.message);
  }
  return out;
}

export function toFrDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
