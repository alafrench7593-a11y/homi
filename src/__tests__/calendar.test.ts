// Fuseau : Europe/Paris, fixé pour toute la suite (scripts/jest-global-setup.js)
/** Agenda familial : récurrences en heure locale, assemblage, grille du mois, export iCalendar sans fuite de santé. */
import { atLocal, addDays, foldLine, itemsBetween, itemsOnDay, monthGrid, occurrences, overlaps, toIcs, weekStart, type FamilyEvent } from '@/lib/domain/calendar';

const ev = (v: Partial<FamilyEvent>): FamilyEvent => ({
  id: 'e1', household_id: 'h', child_id: null, kind: 'activity', title: 'Bébés nageurs', starts_at: atLocal('2026-10-20', 18).toISOString(), ends_at: atLocal('2026-10-20', 19).toISOString(),
  all_day: false, location_label: 'Piscine', notes: null, recurrence: null, timezone: 'Europe/Paris', created_by: 'a', created_at: '2026-10-01', ...v,
});

describe('récurrences', () => {
  it('hebdomadaire : garde 18 h même après le changement d’heure (25 octobre)', () => {
    const occ = occurrences(ev({ recurrence: { type: 'weekly' } }), atLocal('2026-10-19'), atLocal('2026-11-10'));
    expect(occ).toHaveLength(3);
    for (const o of occ) expect(new Date(o.starts).getHours()).toBe(18);
    // preuve que le changement d'heure est bien traversé : l'heure UTC change (16 h → 17 h)
    expect(new Date(occ[0].starts).getUTCHours()).toBe(16);
    expect(new Date(occ[2].starts).getUTCHours()).toBe(17);
    expect(Date.parse(occ[0].ends) - Date.parse(occ[0].starts)).toBe(3600000);
  });
  it('« jusqu’au » est respecté, intervalle de 2 semaines', () => {
    const occ = occurrences(ev({ recurrence: { type: 'weekly', every: 2, until: '2026-11-17' } }), atLocal('2026-10-01'), atLocal('2027-01-01'));
    expect(occ.map((o) => new Date(o.starts).getDate())).toEqual([20, 3, 17]);
  });
  it('mensuel le 31 : les mois sans 31 sont sautés', () => {
    const occ = occurrences(ev({ starts_at: atLocal('2027-01-31', 9).toISOString(), ends_at: null, recurrence: { type: 'monthly' } }), atLocal('2027-01-01'), atLocal('2027-06-01'));
    expect(occ.map((o) => new Date(o.starts).getMonth() + 1)).toEqual([1, 3, 5]);
  });
  it('événement ponctuel hors de la période : rien', () => {
    expect(occurrences(ev({}), atLocal('2026-11-01'), atLocal('2026-12-01'))).toEqual([]);
  });
});

describe('assemblage', () => {
  const items = itemsBetween({
    events: [ev({ recurrence: { type: 'weekly' } })],
    appointments: [{ id: 'a1', title: 'Psychologue', starts_at: atLocal('2026-10-20', 18, 30).toISOString(), location_label: 'Cabinet', private_to_creator: true, kind: 'consultation' }, { id: 'a2', title: 'Pédiatre', starts_at: atLocal('2026-10-21', 9).toISOString(), location_label: 'Cabinet Dr B', kind: 'pediatric' }],
    tasks: [{ id: 't1', title: 'Courses', due_at: atLocal('2026-10-20', 10).toISOString(), status: 'todo', assignee_id: 'b' }, { id: 't2', title: 'Annulée', due_at: atLocal('2026-10-20', 11).toISOString(), status: 'cancelled', assignee_id: null }],
    shifts: [{ id: 's1', kind: 'night', user_id: 'a', starts_at: atLocal('2026-10-20', 22).toISOString(), ends_at: atLocal('2026-10-21', 6).toISOString(), status: 'planned' }],
  }, atLocal('2026-10-19'), atLocal('2026-10-26'));
  it('rassemble les sources, sans tâche annulée', () => {
    expect(items.map((i) => i.source).sort()).toEqual(['appointment', 'appointment', 'event', 'night', 'task']);
  });
  it('un relais de nuit apparaît le soir où il commence seulement', () => {
    expect(itemsOnDay(items, '2026-10-20').some((i) => i.source === 'night')).toBe(true);
    expect(itemsOnDay(items, '2026-10-21').some((i) => i.source === 'night')).toBe(false);
  });
  it('chevauchements signalés', () => {
    expect([...overlaps(itemsOnDay(items, '2026-10-20'))].length).toBe(2);
  });
  it('export : rendez-vous privé exclu, santé sous titre neutre, récurrence en RRULE', () => {
    const ics = toIcs(items, { events: [ev({ recurrence: { type: 'weekly', until: '2027-06-30' } })], now: new Date('2026-10-18T10:00:00Z') });
    expect(ics).not.toMatch(/Psychologue|Pédiatre|Dr B/);
    expect(ics).toMatch(/SUMMARY:Rendez-vous/);
    expect(ics).toMatch(/RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=\d{8}T\d{6}Z/);
    expect(ics).toMatch(/DTSTART;TZID=Europe\/Paris:20261020T180000/);
    expect(ics).toMatch(/BEGIN:VTIMEZONE\r\nTZID:Europe\/Paris/);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toMatch(/SUMMARY:Courses/);
    expect(ics).toMatch(/LOCATION:Piscine/);
  });
  it('export : titres de santé seulement si on le choisit explicitement (jamais le privé)', () => {
    const ics = toIcs(items, { includeHealthTitles: true });
    expect(ics).toMatch(/SUMMARY:Pédiatre/);
    expect(ics).not.toMatch(/Psychologue/);
  });
  it('échappement et repli des lignes à 75 octets', () => {
    const long = toIcs([{ key: 'event:x', source: 'event', refId: 'x', title: 'Réunion, école; parents\nsuite ' + 'é'.repeat(60), starts: atLocal('2026-10-20', 9).toISOString(), ends: atLocal('2026-10-20', 10).toISOString(), allDay: false }]);
    expect(long).toMatch(/SUMMARY:Réunion\\, école\\; parents\\nsuite/);
    for (const line of long.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(foldLine('a'.repeat(80)).split('\r\n')[1].startsWith(' ')).toBe(true);
  });
});

describe('grilles', () => {
  it('semaine du lundi au dimanche', () => {
    expect(weekStart('2026-10-18')).toBe('2026-10-12');
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
  });
  it('octobre 2026 : 5 semaines commençant le lundi 28 septembre', () => {
    const g = monthGrid('2026-10-18');
    expect(g).toHaveLength(5);
    expect(g[0][0]).toBe('2026-09-28');
    expect(g[4][6]).toBe('2026-11-01');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});
