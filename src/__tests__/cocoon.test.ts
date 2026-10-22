/** « Le cocon du jour » : frise (vrais événements du jour), trois informations selon l'âge, « À retenir », favoris. */
import { addActions, buildRibbon, cocoonMoment, favoriteActions, infoKeys, infoValue, keepInMind, ribbonRange, sleepMinutesToday } from '@/lib/domain/cocoon';
import type { Appointment, Bottle, Diaper, Meal, Observation, Sleep } from '@/lib/types';

const NOW = new Date(2026, 9, 22, 13, 30);
const at = (h: number, m = 0, dayShift = 0) => new Date(2026, 9, 22 + dayShift, h, m).toISOString();
const base = { household_id: 'h', child_id: 'c1' };
const ALL = ['bottle', 'breastfeed', 'diaper', 'sleep', 'meal'];

const bottles: Bottle[] = [
  { ...base, id: 'b1', at: at(7, 10), prepared_ml: 180, consumed_ml: 150, milk_type: null },
  { ...base, id: 'b0', at: at(22, 0, -1), prepared_ml: 120, consumed_ml: 120, milk_type: null },
];
const diapers: Diaper[] = [{ ...base, id: 'd1', at: at(8), wet: true, stool: true }];
const sleeps: Sleep[] = [
  { ...base, id: 's0', started_at: at(20, 0, -1), ended_at: at(6, 40), wakeups: 1, kind: 'night', wake_events: [{ at: at(3, 5), minutes: 10 }] },
  { ...base, id: 's1', started_at: at(10, 0), ended_at: at(11, 15), wakeups: 0, kind: 'nap' },
];
const meals: Meal[] = [{ ...base, id: 'm1', at: at(12, 0), description: 'Purée', foods: ['carotte'], texture: 'smooth', reaction_note: null }];
const obs: Observation[] = [{ ...base, id: 'o1', at: at(9, 0), kind: 'medication', value_num: null, label: 'Sirop prescrit' }];
const appts = [{ id: 'a1', household_id: 'h', child_id: 'c1', starts_at: at(16, 30), title: 'Pédiatre' }] as unknown as Appointment[];

describe('frise de la journée', () => {
  const ev = buildRibbon({ now: NOW, enabled: ALL, bottles, diapers, sleeps, meals, observations: obs, appointments: appts });
  it('ne garde que les événements du jour, triés, avec la ligne modifiable', () => {
    expect(ev.map((e) => e.kind)).toEqual(['sleep', 'wake', 'wake', 'bottle', 'diaper', 'medication', 'sleep', 'wake', 'meal', 'appointment']);
    expect(ev.find((e) => e.id === 'bottle-b0')).toBeUndefined(); // biberon d'hier
    expect(ev.find((e) => e.kind === 'bottle')).toMatchObject({ table: 'bottle', rowId: 'b1' });
    expect(ev.find((e) => e.kind === 'appointment')?.table).toBeUndefined(); // un rendez-vous s'ouvre, il ne se supprime pas ici
  });
  it('coupe la nuit à minuit et note le réveil', () => {
    const night = ev[0];
    expect(night.start).toBe(new Date(2026, 9, 22).getTime());
    expect(night.end).toBe(Date.parse(at(6, 40)));
  });
  it('un sommeil en cours va jusqu’à maintenant', () => {
    const open = buildRibbon({ now: NOW, enabled: ALL, sleeps: [{ ...base, id: 'so', started_at: at(13, 0), ended_at: null, wakeups: 0, kind: 'nap' }] });
    expect(open[0]).toMatchObject({ ongoing: true, end: NOW.getTime() });
  });
  it('un suivi désactivé n’apparaît jamais (couche, biberon)', () => {
    const ev2 = buildRibbon({ now: NOW, enabled: ['sleep', 'meal'], bottles, diapers, sleeps, meals });
    expect(ev2.some((e) => e.kind === 'bottle' || e.kind === 'diaper')).toBe(false);
  });
  it('plage affichée : maintenant compris, au moins jusqu’à 22 h', () => {
    const r = ribbonRange(ev, NOW);
    expect(r.from).toBe(new Date(2026, 9, 22, 0).getTime());
    expect(r.to).toBe(new Date(2026, 9, 22, 22).getTime());
    const late = ribbonRange([], new Date(2026, 9, 22, 23, 10));
    expect(late.to).toBe(new Date(2026, 9, 23, 0).getTime());
  });
});

describe('trois informations selon l’âge', () => {
  it('nouveau-né : alimentation, couche, sommeil', () => expect(infoKeys('newborn', ALL, 1)).toEqual(['feed', 'diaper', 'sleep']));
  it('diversification : repas, biberon, sommeil', () => expect(infoKeys('diversification', ALL, 8)).toEqual(['meal', 'bottle', 'sleep']));
  it('plus grand : sommeil, repas, prochain événement', () => expect(infoKeys('child', ALL, 40)).toEqual(['sleep', 'meal', 'next']));
  it('jamais de couche ni de biberon désactivés : remplacés', () => {
    const k = infoKeys('newborn', ['breastfeed', 'sleep'], 1);
    expect(k).not.toContain('diaper');
    expect(k).not.toContain('bottle');
    expect(k).toHaveLength(3);
    expect(infoKeys('diversification', ['meal', 'sleep'], 8)).toEqual(['meal', 'sleep', 'next']);
  });
  it('valeurs réelles : dernier biberon, couches du jour, sommeil sans double compte', () => {
    const i = { now: NOW, enabled: ALL, bottles, diapers, sleeps, meals };
    expect(infoValue('feed', i)).toMatchObject({ value: '7 h 10', sub: 'Biberon · 150 ml' });
    expect(infoValue('diaper', i).sub).toBe('1 aujourd’hui');
    expect(infoValue('sleep', i).value).toBe('7 h 55'); // 0 h → 6 h 40, puis 10 h → 11 h 15
    expect(sleepMinutesToday([...sleeps, { started_at: at(10, 30), ended_at: at(11, 0) }], NOW)).toBe(475); // chevauchement compté une fois
    expect(infoValue('next', { ...i, next: null }).sub).toBe('Rien de prévu');
  });
});

describe('à retenir aujourd’hui (une seule chose)', () => {
  const b = { now: NOW, name: 'Lina', ageMonths: 6 };
  it('ordre : rappel biberon, rendez-vous, sieste estimée, traitement, médicament noté, repère', () => {
    expect(keepInMind({ ...b, bottleReminderAt: at(14, 10), appointments: appts }).kind).toBe('bottle');
    expect(keepInMind({ ...b, appointments: appts, nextNapAt: Date.parse(at(14)) }).kind).toBe('appointment');
    expect(keepInMind({ ...b, nextNapAt: Date.parse(at(14, 30)) })).toMatchObject({ kind: 'nap', title: 'Prochaine sieste estimée autour de 14 h 30' });
    expect(keepInMind({ ...b, treatment: { name: 'Sirop', nextAt: at(18) } }).kind).toBe('treatment');
    expect(keepInMind({ ...b, observations: obs }).kind).toBe('medication');
    expect(keepInMind({ ...b, tips: ['Sur le dos'], tipSource: 'Santé publique France' })).toMatchObject({ kind: 'tip', detail: 'Sur le dos' });
    expect(keepInMind({ ...b, ageMonths: 30, tips: ['Sur le dos'] }).kind).toBe('none');
  });
  it('un rappel déjà passé n’est pas proposé', () => {
    expect(keepInMind({ ...b, bottleReminderAt: at(12) }).kind).not.toBe('bottle');
  });
});

describe('« + Ajouter »', () => {
  it('jamais un suivi désactivé, jamais de biberon après 2 ans', () => {
    expect(addActions(['meal', 'sleep'], 30)).toEqual(['meal', 'sleep', 'medication', 'symptom', 'note']);
    expect(addActions(ALL, 30)).not.toContain('bottle');
  });
  it('4 favoris selon l’âge, ou ceux choisis par le parent', () => {
    expect(favoriteActions('newborn', addActions(ALL, 1), null)).toEqual(['bottle', 'breastfeed', 'diaper', 'sleep']);
    expect(favoriteActions('child', addActions(ALL, 40), null)).toEqual(['meal', 'sleep', 'medication', 'symptom']);
    expect(favoriteActions('newborn', addActions(ALL, 1), ['note', 'sleep', 'bottle', 'meal'])).toEqual(['note', 'sleep', 'bottle', 'meal']);
    // un favori devenu impossible (couche désactivée) est remplacé
    expect(favoriteActions('newborn', addActions(['bottle', 'sleep'], 1), ['diaper'])).not.toContain('diaper');
  });
});

it('moment de la journée de la carte', () => {
  expect([7, 13, 19, 23].map((h) => cocoonMoment(new Date(2026, 9, 22, h)))).toEqual(['morning', 'day', 'sunset', 'night']);
});
