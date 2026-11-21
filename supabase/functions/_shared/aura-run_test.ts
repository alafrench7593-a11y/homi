// Aura : ordre des refus du serveur et codes renvoyés à l'application (ticket 5, 21/11/2026).
// sécurité → consentement → anti-détournement → IA configurée → crédits → Gemini (ici SIMULÉ, aucun réseau).
// Aucun journal ne contient le texte de la personne ni une clé.
import { runAura, type AuraDeps } from './aura-run.ts';
import { AURA_ANALYSIS_KINDS, auraCreditAction, sanitizeAnalysis } from './aura-data.ts';
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}

function deps(o: Partial<AuraDeps> & { reserveError?: string } = {}) {
  const logs: string[] = [];
  const turns: number[] = [];
  const d: AuraDeps = {
    userId: 'u1',
    today: '2026-11-21',
    consented: async () => true,
    geminiConfig: async () => ({ apiKey: 'cle-secrete-de-test', model: 'simulation' }),
    gate: {
      reserve: async () => (o.reserveError ? { ok: false, error: o.reserveError } : { ok: true, reservation_id: 'r1', cost: 1, monthly_remaining: 9, purchased_remaining: 0 }),
      commit: async () => true,
      release: async () => true,
    },
    turn: async () => { turns.push(1); return { text: 'Réponse simulée.', calls: [], parts: [], finishReason: 'STOP' }; },
    log: (c) => logs.push(c),
    ...o,
  };
  return { d, logs, turns };
}
const ask = { kind: 'chat', message: 'Quel outil pour les courses ?', lang: 'fr', request_id: 'k1' };

Deno.test('sans abonnement : premium_required (402), Gemini jamais appelé', async () => {
  const { d, turns } = deps({ reserveError: 'premium_required' });
  const r = await runAura(d, ask);
  assertEquals([r.status, r.body.error, turns.length], [402, 'premium_required', 0]);
});

Deno.test('sans crédits : insufficient_credits (402) avec le solde', async () => {
  const { d, turns } = deps({ reserveError: 'insufficient_credits' });
  const r = await runAura(d, ask);
  assertEquals([r.status, r.body.error, turns.length], [402, 'insufficient_credits', 0]);
});

Deno.test('sans accord : consent_required (403) AVANT les crédits', async () => {
  let reserved = false;
  const { d } = deps({ consented: async () => false });
  d.gate.reserve = async () => { reserved = true; return { ok: true, reservation_id: 'r', cost: 1 }; };
  const r = await runAura(d, ask);
  assertEquals([r.status, r.body.error, reserved], [403, 'consent_required', false]);
});

Deno.test('IA coupée : ai_not_configured (503) ; interrupteur crédits : ai_disabled (503)', async () => {
  assertEquals((await runAura(deps({ geminiConfig: async () => null }).d, ask)).body.error, 'ai_not_configured');
  const r = await runAura(deps({ reserveError: 'ai_disabled' }).d, ask);
  assertEquals([r.status, r.body.error], [503, 'ai_disabled']);
});

Deno.test('détresse : orientation gratuite, ni accord ni crédit nécessaires', async () => {
  const { d, turns } = deps({ consented: async () => false, reserveError: 'insufficient_credits' });
  const r = await runAura(d, { ...ask, message: 'je veux mourir' });
  assertEquals([r.status, r.body.safety !== 'none', turns.length], [200, true, 0]);
});

Deno.test('abonné·e avec crédits : réponse du modèle, 1 crédit, journaux sans texte ni clé', async () => {
  const { d, logs } = deps();
  const r = await runAura(d, ask);
  assertEquals([r.status, r.body.answer, (r.body.credits as { charged: boolean }).charged], [200, 'Réponse simulée.', true]);
  for (const l of logs) if (/courses|cle-secrete/.test(l)) throw new Error(`journal trop bavard : ${l}`);
});

Deno.test('analyse « bottle » : schéma fermé, prénom retiré, facturée comme tool_analysis', () => {
  assertEquals(AURA_ANALYSIS_KINDS.includes('bottle'), true);
  const clean = sanitizeAnalysis('bottle', { window_days: 7, days_noted: 4, age_months: 5, avg_bottles_per_day: 5.24, avg_ml_per_day: 640, avg_gap_minutes: 190, first_name: 'Léo' });
  assertEquals(clean, { window_days: 7, days_noted: 4, age_months: 5, avg_bottles_per_day: 5.2, avg_ml_per_day: 640, avg_gap_minutes: 190 });
  assertEquals(sanitizeAnalysis('bottle', { avg_ml_per_day: 99999 }), null);
  assertEquals(auraCreditAction('analysis', { journal: false, analysis: 'bottle' }), 'tool_analysis');
});
