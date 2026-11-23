/**
 * Journaux du cycle (22/11/2026) : jour choisi dans l'adresse, bande de 7 jours, « rien de noté » (null) ≠ 0,
 * une douleur notée 0/10 reste une valeur, corrections de jour et d'heure, catégorie sans addition de natures.
 */
import {
  categoryDays, categoryTotals, clockOf, dayEditError, draftChanged, groupByDay, itemsOfDay, lastDays, lastItem, localDay, moveToDay,
  parseDayParam, periodCount, periodDays, periodMax, resumeSlug, stripDays, stripEnd, toggleFavorite, withClock,
} from '@/lib/domain/cycleTrack';

const TODAY = '2026-11-22';
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).toISOString();

describe('jour choisi (adresse)', () => {
  it('accepte un jour valide passé ou aujourd’hui, refuse le futur et le texte', () => {
    expect(parseDayParam('2026-11-20', TODAY)).toBe('2026-11-20');
    expect(parseDayParam('2026-11-22', TODAY)).toBe(TODAY);
    expect(parseDayParam('2026-11-23', TODAY)).toBe(TODAY);
    expect(parseDayParam('2026-02-30', TODAY)).toBe(TODAY);
    expect(parseDayParam('hier', TODAY)).toBe(TODAY);
    expect(parseDayParam(undefined, TODAY)).toBe(TODAY);
    expect(parseDayParam(['2026-11-18'], TODAY)).toBe('2026-11-18');
  });
  it('le calendrier peut viser un jour futur (estimations) avec une borne haute large', () => {
    expect(parseDayParam('2026-12-05', '9999-12-31', TODAY)).toBe('2026-12-05');
  });
});

describe('bande de 7 jours', () => {
  it('7 jours consécutifs finissant au jour donné', () => {
    expect(lastDays(TODAY, 7)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
  });
  it('se termine aujourd’hui tant que le jour choisi est dans la dernière semaine', () => {
    expect(stripEnd('2026-11-16', TODAY, 7)).toBe(TODAY);
    expect(stripEnd(TODAY, TODAY, 7)).toBe(TODAY);
  });
  it('un jour plus ancien est placé au milieu, sans jamais dépasser aujourd’hui', () => {
    expect(stripEnd('2026-11-01', TODAY, 7)).toBe('2026-11-04');
    expect(lastDays(stripEnd('2026-11-01', TODAY, 7), 7)).toContain('2026-11-01');
    expect(stripEnd('2026-11-15', TODAY, 7)).toBe('2026-11-18');
  });
});

describe('journal du jour', () => {
  const items = [
    { id: 'a', day: '2026-11-22', at: at(22, 14, 20) },
    { id: 'b', day: '2026-11-22', at: at(22, 8, 5) },
    { id: 'c', day: '2026-11-22', at: null },
    { id: 'd', day: '2026-11-20' },
    { id: 'old', day: '2026-10-01' },
  ];
  it('saisies d’un jour rangées par heure, la « journée » (sans heure) en tête', () => {
    expect(itemsOfDay(items, TODAY).map((x) => x.id)).toEqual(['c', 'b', 'a']);
    const g = groupByDay(items, lastDays(TODAY, 7));
    expect(g['2026-11-20'].map((x) => x.id)).toEqual(['d']);
    expect(g['2026-11-19']).toEqual([]);
    expect(g['2026-10-01']).toBeUndefined();
  });
  it('jour sans saisie = null (« rien de noté »), jamais 0', () => {
    const s = stripDays(items, lastDays(TODAY, 7));
    expect(s.find((d) => d.day === TODAY)).toEqual({ day: TODAY, count: 3, value: null });
    expect(s.find((d) => d.day === '2026-11-21')).toEqual({ day: '2026-11-21', count: null, value: null });
    expect(periodCount(s)).toEqual({ days: 2, entries: 4 });
  });
  it('dernière saisie : jour puis heure les plus récents', () => {
    expect(lastItem(items)?.id).toBe('a');
    expect(lastItem([])).toBeNull();
  });
});

describe('échelle d’intensité (douleur 0–10)', () => {
  const pain = [{ id: 'p1', day: '2026-11-22', v: 0 }, { id: 'p2', day: '2026-11-20', v: 6 }, { id: 'p3', day: '2026-11-20', v: 4 }, { id: 'p4', day: '2026-11-19', v: null }];
  it('0/10 noté reste une valeur ; un jour sans valeur reste « rien de noté »', () => {
    const s = stripDays(pain, lastDays(TODAY, 7), (x) => x.v);
    expect(s.find((d) => d.day === TODAY)?.value).toBe(0);
    expect(s.find((d) => d.day === '2026-11-20')?.value).toBe(6);
    expect(s.find((d) => d.day === '2026-11-19')).toEqual({ day: '2026-11-19', count: 1, value: null });
    expect(s.find((d) => d.day === '2026-11-18')?.value).toBeNull();
    expect(periodMax(s)).toBe(6);
    expect(periodMax(stripDays([], lastDays(TODAY, 7), () => 1))).toBeNull();
  });
});

describe('corrections de jour et d’heure', () => {
  it('déplacer sur un autre jour garde l’heure locale', () => {
    const n = moveToDay(at(22, 23, 30), '2026-11-20');
    expect(localDay(n)).toBe('2026-11-20');
    expect(clockOf(n)).toBe('23:30');
  });
  it('changer l’heure garde le jour ; heure invalide → null', () => {
    const n = withClock(at(22, 8, 0), '14h05')!;
    expect(localDay(n)).toBe(TODAY);
    expect(clockOf(n)).toBe('14:05');
    expect(withClock(at(22, 8, 0), '25:00')).toBeNull();
    expect(withClock(at(22, 8, 0), 'midi')).toBeNull();
  });
  it('jour proposé : invalide, futur, avant le début (PMA)', () => {
    expect(dayEditError('2026-11-21', TODAY)).toBeNull();
    expect(dayEditError(null, TODAY)).toBe('bad');
    expect(dayEditError('2026-11-23', TODAY)).toBe('future');
    expect(dayEditError('2026-11-01', TODAY, '2026-11-10')).toBe('beforeMin');
  });
  it('brouillon modifié : valeurs, listes sans ordre, texte vide = null', () => {
    expect(draftChanged({ keys: ['a', 'b'], note: '' }, { keys: ['b', 'a'], note: null })).toBe(false);
    expect(draftChanged({ v: 3 }, { v: 4 })).toBe(true);
    expect(draftChanged({ keys: ['a'] }, { keys: ['a', 'b'] })).toBe(true);
    expect(draftChanged({ note: ' x ' }, { note: 'x' })).toBe(false);
  });
});

describe('catégorie « Cycle et fertilité »', () => {
  const sources = {
    pain: [{ id: '1', day: '2026-11-22' }, { id: '2', day: '2026-11-20' }],
    symptoms: [{ id: '3', day: '2026-11-22' }, { id: '4', day: '2026-11-22' }],
    tests: [] as { id: string; day: string }[],
  };
  it('par jour : chaque app avec SON nombre, jamais additionnés ; jour vide = liste vide', () => {
    const d = categoryDays(sources, lastDays(TODAY, 7));
    expect(d[6]).toEqual({ day: TODAY, apps: [{ app: 'pain', count: 1 }, { app: 'symptoms', count: 2 }] });
    expect(d[5].apps).toEqual([]);
  });
  it('par app : jours notés et saisies ; une app sans saisie n’apparaît pas', () => {
    expect(categoryTotals(sources, lastDays(TODAY, 7))).toEqual([
      { app: 'pain', days: 2, entries: 2 },
      { app: 'symptoms', days: 1, entries: 2 },
    ]);
  });
  it('jours de règles notés : début→fin ; règles ouvertes limitées, jamais dans le futur', () => {
    expect(periodDays([{ id: 'p', start_date: '2026-11-01', end_date: '2026-11-03' }], TODAY).map((x) => x.day)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    expect(periodDays([{ id: 'o', start_date: '2026-11-20', end_date: null }], TODAY).map((x) => x.day)).toEqual(['2026-11-20', '2026-11-21', '2026-11-22']);
    expect(periodDays([{ id: 'o', start_date: '2026-11-01', end_date: null }], TODAY)).toHaveLength(10);
    expect(periodDays([{ id: 'f', start_date: '2026-12-01', end_date: null }], TODAY)).toEqual([]);
  });
});

describe('lecture : favoris et reprise', () => {
  it('ajoute en tête, retire si déjà présent', () => {
    expect(toggleFavorite(['a'], 'b')).toEqual(['b', 'a']);
    expect(toggleFavorite(['b', 'a'], 'b')).toEqual(['a']);
  });
  it('reprise seulement pour une fiche qui existe encore', () => {
    expect(resumeSlug({ slug: 'itching' }, ['itching', 'dryness'])).toBe('itching');
    expect(resumeSlug({ slug: 'gone' }, ['itching'])).toBeNull();
    expect(resumeSlug(null, ['itching'])).toBeNull();
  });
});
