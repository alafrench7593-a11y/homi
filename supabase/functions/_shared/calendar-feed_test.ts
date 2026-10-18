// Assertions locales (comme les autres tests : aucune dépendance réseau)
function assert(c: unknown, m = 'assertion') { if (!c) throw new Error(m); }
function assertEquals(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`); }
function assertStringIncludes(s: string, part: string) { if (!s.includes(part)) throw new Error(`« ${part} » absent`); }
import { buildFeed, validToken, type FeedData } from './calendar-feed.ts';

const NOW = new Date('2026-10-18T10:00:00Z');
const base: FeedData = {
  feed: { id: 'f', label: 'Agenda des Martin', include_health_titles: false },
  events: [{ id: 'e1', household_id: 'h', child_id: null, kind: 'activity', title: 'Piscine', starts_at: '2026-10-20T16:00:00Z', ends_at: '2026-10-20T17:00:00Z', all_day: false, location_label: 'Centre aquatique', notes: 'note privée', recurrence: { type: 'weekly' }, timezone: 'Europe/Paris', created_by: null, created_at: '2026-10-01T00:00:00Z' },
    { id: 'e2', household_id: 'h', child_id: null, kind: 'important', title: 'Anniversaire', starts_at: '2026-10-24T22:00:00Z', ends_at: null, all_day: true, location_label: null, notes: null, recurrence: null, timezone: 'Europe/Paris', created_by: null, created_at: '2026-10-01T00:00:00Z' }],
  appointments: [{ id: 'a1', title: 'Pédiatre — fièvre', starts_at: '2026-10-21T08:30:00Z', location_label: 'Cabinet Dr X', kind: 'pediatric', private_to_creator: false }],
  tasks: [{ id: 't1', title: 'Courses', due_at: '2026-10-19T17:00:00Z', status: 'todo', assignee_id: null }, { id: 't2', title: 'Déjà fait', due_at: '2026-10-19T09:00:00Z', status: 'done', assignee_id: null }],
  shifts: [{ id: 's1', kind: 'night', user_id: 'u', starts_at: '2026-10-19T20:00:00Z', ends_at: '2026-10-20T04:00:00Z', status: 'planned' }],
};

Deno.test('jeton : format strict', () => {
  assert(validToken('a'.repeat(43)));
  assert(!validToken(null));
  assert(!validToken('court'));
  assert(!validToken(`${'a'.repeat(40)}' or 1=1`));
});

Deno.test('flux : titres de santé neutres, pas de lieu ni de note, rafraîchissement suggéré', () => {
  const ics = buildFeed(base, NOW);
  assertStringIncludes(ics, 'X-WR-CALNAME:Agenda des Martin');
  assertStringIncludes(ics, 'REFRESH-INTERVAL;VALUE=DURATION:PT1H');
  assertStringIncludes(ics, 'SUMMARY:Rendez-vous\r\n');
  assert(!ics.includes('fièvre') && !ics.includes('Cabinet Dr X'));
  assert(!ics.includes('note privée'));
});

Deno.test('flux : récurrence en heure de Paris, journée entière au bon jour (serveur en UTC)', () => {
  const ics = buildFeed(base, NOW);
  assertStringIncludes(ics, 'DTSTART;TZID=Europe/Paris:20261020T180000');
  assertStringIncludes(ics, 'RRULE:FREQ=WEEKLY;INTERVAL=1');
  assertStringIncludes(ics, 'DTSTART;VALUE=DATE:20261025');
  assertStringIncludes(ics, 'DTEND;VALUE=DATE:20261026');
});

Deno.test('flux : relais et tâches à faire, sans les tâches terminées', () => {
  const ics = buildFeed(base, NOW);
  assertStringIncludes(ics, 'SUMMARY:Relais de nuit');
  assertStringIncludes(ics, 'SUMMARY:Courses');
  assert(!ics.includes('Déjà fait'));
  assertEquals(ics.split('BEGIN:VEVENT').length - 1, 5);
});

Deno.test('flux : titres de santé visibles seulement si la personne l’a choisi', () => {
  const ics = buildFeed({ ...base, feed: { ...base.feed, include_health_titles: true } }, NOW);
  assertStringIncludes(ics, 'Pédiatre — fièvre');
});
