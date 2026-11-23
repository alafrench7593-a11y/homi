// Analyse « sieste en cours » (22/11/2026) : exécution ISOLÉE de runAura (fonction `assistant`), modèle SIMULÉ, aucun
// réseau, aucun projet Supabase. Vérifie : recalcul serveur de la fenêtre (les chiffres envoyés ne sont pas crus),
// consigne propre à la sieste, un seul débit par demande (même request_id rejoué), refus sans consentement,
// historique insuffisant, données d'un autre enfant absentes (l'application n'envoie que des durées).
import { runAura, type AuraDeps } from './aura-run.ts';
import { auraCreditAction, sanitizeAnalysis } from './aura-data.ts';

function eq(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
function ok(v: unknown, msg: string) { if (!v) throw new Error(msg); }

/** Registre de crédits en mémoire avec la même sémantique que credits_reserve (clé d'idempotence). */
function ledger(balance: number) {
  const byKey = new Map<string, { id: string; settled: boolean; cost: number }>();
  const st = { balance, debits: 0, systems: [] as string[] };
  const gate: AuraDeps['gate'] = {
    reserve: async (_action, key) => {
      const ex = byKey.get(key);
      // comme credits_reserve : la même clé renvoie la même réservation, marquée « rejouée » avec son état
      if (ex) return { ok: true, replay: true, status: ex.settled ? 'committed' : 'held', reservation_id: ex.id, cost: ex.cost, monthly_remaining: st.balance, purchased_remaining: 0 };
      if (st.balance < 3) return { ok: false, error: 'insufficient_credits' };
      const r = { id: `r${byKey.size + 1}`, settled: false, cost: 3 };
      byKey.set(key, r);
      return { ok: true, reservation_id: r.id, cost: 3, monthly_remaining: st.balance - 3, purchased_remaining: 0 };
    },
    commit: async (id) => { for (const r of byKey.values()) if (r.id === id && !r.settled) { r.settled = true; st.balance -= r.cost; st.debits++; } return true; },
    release: async (id) => { for (const r of byKey.values()) if (r.id === id) r.settled = true; return true; },
  };
  return { gate, st };
}
function deps(balance = 10) {
  const l = ledger(balance);
  const d: AuraDeps = {
    userId: 'parent-test', today: '2026-11-23',
    consented: async () => true,
    geminiConfig: async () => ({ apiKey: 'cle-de-test', model: 'simulation' }),
    gate: l.gate,
    turn: async (_cfg, o) => { l.st.systems.push(o.system); return { text: 'Réponse SIMULÉE (test isolé, aucun modèle appelé).', calls: [], parts: [], finishReason: 'STOP' }; },
  };
  return { d, st: l.st };
}
// Les chiffres « faux » envoyés exprès (low/high/window) doivent être ignorés : le serveur recalcule
const LEA = { kind: 'nap', data: { age_months: 13, started_hm: '13:10', elapsed_minutes: 40, ongoing: true, comparable_minutes: [95, 80, 70, 60, 55, 45], period_days: 6, range_low_minutes: 1, window_from: '09:00' } };
const body = (o: Record<string, unknown> = {}) => ({ kind: 'analysis', analysis: LEA, data_consent: true, lang: 'fr', request_id: 'a1b2c3d4-0000-4000-8000-000000000001', credit_action: 'tool_analysis', ...o });

Deno.test('sanitize : le serveur recalcule 4 siestes entre 55 et 80 min, fenêtre 14:05–14:30', () => {
  const a = sanitizeAnalysis('nap', LEA.data)!;
  eq([a.status, a.range_low_minutes, a.range_high_minutes, a.in_range_count, a.window_from, a.window_to, a.progress], ['ok', 55, 80, 4, '14:05', '14:30', 'before']);
  eq(auraCreditAction('analysis', { journal: false, analysis: 'nap' }), 'tool_analysis');
});

Deno.test('runAura : consigne sieste, données recalculées dans le prompt, un débit', async () => {
  const { d, st } = deps();
  const out = await runAura(d, body());
  eq(out.status, 200);
  ok(st.systems[0].includes('Tâche : sieste en cours'), 'consigne sieste absente');
  ok(st.systems[0].includes('"window_from":"14:05"') && st.systems[0].includes('"window_to":"14:30"'), 'fenêtre recalculée absente du prompt');
  ok(!st.systems[0].includes('09:00'), 'la valeur envoyée par le client a été crue');
  ok(st.systems[0].includes('jamais de réveiller'), 'garde « pas de consigne de réveil » absente');
  eq(st.debits, 1);
  eq((out.body.credits as { charged: boolean }).charged, true);
});

Deno.test('double appui / reprise réseau : même request_id → aucun second débit', async () => {
  const { d, st } = deps();
  await runAura(d, body());
  const again = await runAura(d, body());
  eq(st.debits, 1);
  eq(again.status, 409);
});

Deno.test('historique insuffisant : réponse sans fenêtre, statut transmis', async () => {
  const { d, st } = deps();
  const out = await runAura(d, body({ request_id: 'a1b2c3d4-0000-4000-8000-000000000002', analysis: { kind: 'nap', data: { ...LEA.data, comparable_minutes: [60, 70] } } }));
  eq(out.status, 200);
  ok(st.systems[0].includes('"status":"insufficient"') && st.systems[0].includes('"window_from":null'), 'statut insuffisant absent');
});

Deno.test('sans consentement pour ces données : refus, aucun débit', async () => {
  const { d, st } = deps();
  const out = await runAura(d, body({ data_consent: false, request_id: 'a1b2c3d4-0000-4000-8000-000000000003' }));
  eq(out.status, 403);
  eq(st.debits, 0);
});

Deno.test('solde insuffisant : refus 402, rien n’est débité', async () => {
  const { d, st } = deps(1);
  const out = await runAura(d, body({ request_id: 'a1b2c3d4-0000-4000-8000-000000000004' }));
  eq(out.status, 402);
  eq(st.debits, 0);
});

Deno.test('heure absente : demande refusée', async () => {
  const { d } = deps();
  const out = await runAura(d, body({ request_id: 'a1b2c3d4-0000-4000-8000-000000000005', analysis: { kind: 'nap', data: { comparable_minutes: [60, 70, 80, 90] } } }));
  eq(out.status, 400);
});
