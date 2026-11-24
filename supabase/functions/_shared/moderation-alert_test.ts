import { buildAlert, shouldAlert } from './moderation-alert.ts';
function eq(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`); }
const NOW = Date.parse('2026-11-24T20:00:00Z');
Deno.test('alerte : récente et pas encore envoyée seulement', () => {
  eq(shouldAlert({ created_at: '2026-11-24T19:55:00Z' }, NOW), true);
  eq(shouldAlert({ created_at: '2026-11-24T19:55:00Z', alerted_at: '2026-11-24T19:56:00Z' }, NOW), false);
  eq(shouldAlert({ created_at: '2026-11-24T19:00:00Z' }, NOW), false);
});
Deno.test('alerte : motif en français, extrait coupé et échappé, aucune identité de la personne qui signale', () => {
  const m = buildAlert({ id: 'r1', reason: 'harassment', details: null, created_at: '2026-11-24T19:55:00Z', post_id: 'p1', comment_id: null, reported_user: null, excerpt: '<b>' + 'x'.repeat(400) });
  eq(m.subject, 'HOMI · signalement : Harcèlement');
  eq(m.html.includes('&lt;b&gt;'), true);
  eq(m.text.includes('x'.repeat(301)), false);
  eq(/@/.test(m.text), false);
});
