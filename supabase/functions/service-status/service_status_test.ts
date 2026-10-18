import { serviceStatus } from '../_shared/service-status.ts';

function eq(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); }

Deno.test('service-status : booléens uniquement, jamais de valeur de clé', () => {
  const env: Record<string, string> = { GEMINI_API_KEY: 'secret-123', RESEND_API_KEY: 're_x', RESEND_FROM_EMAIL: '' };
  const s = serviceStatus((k) => env[k]);
  eq(s.gemini, true);
  eq(s.resend, false); // adresse d'envoi vide
  eq(s.push, false);
  if (JSON.stringify(s).includes('secret')) throw new Error('une valeur de clé a fuité');
  for (const v of Object.values(s)) if (typeof v !== 'boolean') throw new Error('valeur non booléenne');
});
