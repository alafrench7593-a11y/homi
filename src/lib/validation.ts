/** Schémas de validation des formulaires (messages d'erreur clairs, en français). */
import { z } from 'zod';
import { frToISO } from './domain/dates';

export const emailSchema = z.string().trim().min(1, 'Indiquez votre adresse e-mail.').email('Cette adresse e-mail ne semble pas valide.');

/** Mot de passe : 8 caractères minimum, au moins une lettre et un chiffre (règles affichées en direct). */
export const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères.')
  .regex(/\p{L}/u, 'Ajoutez au moins une lettre.')
  .regex(/[0-9]/, 'Ajoutez au moins un chiffre.');

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    adult: z.literal(true, { message: 'Vous devez avoir 18 ans ou plus pour créer un compte.' }),
    terms: z.literal(true, { message: 'Acceptez les conditions d’utilisation et la politique de confidentialité pour continuer.' }),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Les deux mots de passe ne correspondent pas.' });

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Indiquez votre mot de passe.') });

/** Date saisie JJ/MM/AAAA -> ISO, avec bornes. */
export const frDate = (opts: { label: string; past?: boolean; future?: boolean; optional?: boolean }) =>
  z.string().trim().transform((v, ctx) => {
    if (!v) {
      if (opts.optional) return null;
      ctx.addIssue({ code: 'custom', message: `Indiquez ${opts.label}.` });
      return z.NEVER;
    }
    const iso = frToISO(v);
    if (!iso) {
      ctx.addIssue({ code: 'custom', message: 'Format attendu : JJ/MM/AAAA.' });
      return z.NEVER;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (opts.past && iso > today) {
      ctx.addIssue({ code: 'custom', message: 'Cette date ne peut pas être dans le futur.' });
      return z.NEVER;
    }
    if (opts.future && iso < today) {
      ctx.addIssue({ code: 'custom', message: 'Cette date est déjà passée.' });
      return z.NEVER;
    }
    return iso;
  });

export const childSchema = z.object({
  first_name: z.string().trim().min(1, 'Indiquez un prénom ou un surnom.').max(40, '40 caractères maximum.'),
  birth_date: frDate({ label: 'la date de naissance', past: true }),
});

export const numberIn = (label: string, min: number, max: number, optional = false) =>
  z.string().trim().transform((v, ctx) => {
    if (!v) {
      if (optional) return null;
      ctx.addIssue({ code: 'custom', message: `Indiquez ${label}.` });
      return z.NEVER;
    }
    const n = Number(v.replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max) {
      ctx.addIssue({ code: 'custom', message: `Valeur attendue entre ${min} et ${max}.` });
      return z.NEVER;
    }
    return n;
  });

/** Première erreur par champ, pour l'affichage sous chaque champ. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? '_');
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

export function toFrDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
