import { journalDay, journalItems, shiftDay } from '@/lib/domain/dayJournal';

const NOW = new Date(2026, 10, 23, 15, 20);
const iso = (day: number, h: number, m: number) => new Date(2026, 10, day, h, m).toISOString();

describe('journal du jour', () => {
  it('jour de l’adresse : valide, sinon aujourd’hui ; jamais dans le futur', () => {
    expect(journalDay('2026-11-21', NOW)).toBe('2026-11-21');
    expect(journalDay('2026-11-31', NOW)).toBe('2026-11-23');
    expect(journalDay('demain', NOW)).toBe('2026-11-23');
    expect(journalDay('2026-12-01', NOW)).toBe('2026-11-23');
    expect(shiftDay('2026-11-23', 1, NOW)).toBe('2026-11-23');
    expect(shiftDay('2026-11-01', -1, NOW)).toBe('2026-10-31');
  });
  it('mélange les natures par heure, pour ce jour et cet enfant seulement', () => {
    const items = journalItems({
      childId: 'lina', day: '2026-11-22', now: NOW,
      sleeps: [{ id: 's', child_id: 'lina', started_at: iso(22, 13, 10), ended_at: iso(22, 14, 35), note: 'en poussette' }, { id: 'x', child_id: 'lina', started_at: iso(23, 9, 0), ended_at: iso(23, 10, 0) }],
      bottles: [{ id: 'b', child_id: 'lina', at: iso(22, 12, 45), consumed_ml: 150 }, { id: 'n', child_id: 'noe', at: iso(22, 12, 50), consumed_ml: 90 }],
      diapers: [{ id: 'd', child_id: 'lina', at: iso(22, 12, 20), wet: true, stool: false }],
    });
    expect(items.map((i) => i.id)).toEqual(['d', 'b', 's']);
    expect(items[2]).toMatchObject({ minutes: 85, note: 'en poussette' });
  });
  it('jour sans saisie : liste vide (« rien de noté »), pas de zéro', () => {
    expect(journalItems({ childId: 'lina', day: '2026-11-20', now: NOW, sleeps: [], bottles: [] })).toEqual([]);
  });
});
