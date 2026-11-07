import { custodyDays, cycleSide, isValidCycle, mondayOf, nextHandover, PATTERNS, shareOver, sideOn } from '@/lib/domain/custody';
import { scoopsFor } from '@/lib/domain/scoops';

describe('garde alternée', () => {
  const plan = { cycle: PATTERNS.week, anchor_on: '2026-11-02' }; // lundi
  it('une semaine sur deux', () => {
    expect(sideOn(plan, '2026-11-02')).toBe('A');
    expect(sideOn(plan, '2026-11-08')).toBe('A');
    expect(sideOn(plan, '2026-11-09')).toBe('B');
    expect(sideOn(plan, '2026-11-16')).toBe('A');
    expect(cycleSide(plan, '2026-11-01')).toBe('B'); // avant la date de départ
  });
  it('les exceptions l’emportent, la dernière saisie gagne', () => {
    const ex = [{ from_on: '2026-11-09', to_on: '2026-11-12', side: 'A' as const }, { from_on: '2026-11-11', to_on: '2026-11-11', side: 'B' as const }];
    expect(sideOn(plan, '2026-11-10', ex)).toBe('A');
    expect(sideOn(plan, '2026-11-11', ex)).toBe('B');
    expect(sideOn(plan, '2026-11-13', ex)).toBe('B');
  });
  it('passations et équilibre', () => {
    const days = custodyDays(plan, '2026-11-02', 14);
    expect(days.filter((d) => d.handover).map((d) => d.date)).toEqual(['2026-11-02', '2026-11-09']);
    expect(nextHandover(plan, '2026-11-03')?.date).toBe('2026-11-09');
    expect(shareOver(plan, '2026-11-02', 28)).toEqual({ A: 14, B: 14 });
    expect(shareOver({ cycle: PATTERNS['2255'], anchor_on: '2026-11-02' }, '2026-11-02', 14)).toEqual({ A: 7, B: 7 });
    expect(shareOver({ cycle: PATTERNS['223'], anchor_on: '2026-11-02' }, '2026-11-02', 14)).toEqual({ A: 7, B: 7 });
  });
  it('validation et lundi', () => {
    expect(isValidCycle('AAB')).toBe(false);
    expect(isValidCycle('AAAAAAABBBBBBX')).toBe(false);
    expect(isValidCycle(PATTERNS['2255'])).toBe(true);
    expect(mondayOf('2026-11-07')).toBe('2026-11-02');
    expect(mondayOf('2026-11-02')).toBe('2026-11-02');
  });
});

describe('compteur de mesurettes', () => {
  it('divise selon la règle de la boîte, sans arrondi silencieux', () => {
    expect(scoopsFor(150, 30)).toMatchObject({ scoops: 5, exact: true });
    const p = scoopsFor(160, 30)!;
    expect(p.exact).toBe(false);
    expect([p.lower, p.upper, p.lowerMl, p.upperMl]).toEqual([5, 6, 150, 180]);
    expect(scoopsFor(0, 30)).toBeNull();
    expect(scoopsFor(150, 0)).toBeNull();
    expect(scoopsFor(900, 30)).toBeNull();
  });
});

import { countSubjects, hasSubject, topSubjects } from '@/lib/domain/librarySubjects';
describe('bibliothèque : sujets', () => {
  const arts = [{ tags: ['Sommeil', 'pleurs'] }, { tags: ['sommeil', 'Bain'] }, { tags: ['pleurs', 'Pleurs'] }, { tags: ['bain', 'éveil'] }, { tags: ['eveil'] }];
  it('regroupe sans tenir compte des majuscules ni des accents, compte un article une fois', () => {
    const s = topSubjects(arts);
    expect(s.map((x) => [x.key, x.count])).toEqual([['bain', 2], ['eveil', 2], ['pleurs', 2], ['sommeil', 2]]);
    expect(s[0].label).toBe('Bain');
    expect(hasSubject(arts[3], 'eveil')).toBe(true);
    expect(countSubjects(arts)).toBe(4);
  });
});
