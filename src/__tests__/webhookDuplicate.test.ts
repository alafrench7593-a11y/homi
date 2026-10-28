/** Webhook RevenueCat : un événement renvoyé (réessai) n'est pas traité deux fois (pas de notification en double). */
import { isDuplicate, isStale } from '../../supabase/functions/_shared/revenuecat';

const at = Date.parse('2026-11-05T10:00:00Z');
const ev = (type: string, ts = at) => ({ type, event_timestamp_ms: ts }) as Parameters<typeof isDuplicate>[0];

test('même type et même horodatage : doublon ignoré', () => {
  expect(isDuplicate(ev('BILLING_ISSUE'), { last_event: 'BILLING_ISSUE', last_event_at: new Date(at).toISOString() })).toBe(true);
});
test('même horodatage mais autre type : traité', () => {
  expect(isDuplicate(ev('EXPIRATION'), { last_event: 'BILLING_ISSUE', last_event_at: new Date(at).toISOString() })).toBe(false);
});
test('événement plus récent : traité ; plus ancien : périmé', () => {
  const last = { last_event: 'RENEWAL', last_event_at: new Date(at).toISOString() };
  expect(isDuplicate(ev('RENEWAL', at + 1000), last)).toBe(false);
  expect(isStale(ev('RENEWAL', at - 1000), last.last_event_at)).toBe(true);
});
test('premier événement d’une personne : traité', () => {
  expect(isDuplicate(ev('INITIAL_PURCHASE'), null)).toBe(false);
});
