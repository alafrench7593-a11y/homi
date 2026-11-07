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

import { isPaidTool, toolAccess, toolEntitlement, toolProductId, toolTrialUntil } from '@/lib/premium/offers';
describe('offres : outils à vie et essai', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  const base = { premium: false, ai: false, trial_until: '2026-12-07T00:00:00+01:00', tools: [{ key: 'custody', product_id: 'aufildenous_tool_custody', owned: false, allowed: true }] };
  it('outil gratuit toujours ouvert, outil payant en essai avec jours restants', () => {
    expect(toolAccess('emergency', base, now)).toMatchObject({ paid: false, allowed: true });
    expect(toolAccess('custody', base, now)).toMatchObject({ paid: true, allowed: true, inTrial: true, trialDaysLeft: 27 });
  });
  it('après l’essai, fermé sauf achat ; inconnu → ouvert (le serveur tranche)', () => {
    const after = { ...base, trial_until: '2026-11-01T00:00:00Z', tools: [{ ...base.tools[0], allowed: false }] };
    expect(toolAccess('custody', after, now)).toMatchObject({ allowed: false, inTrial: false });
    expect(toolAccess('custody', { ...after, tools: [{ ...after.tools[0], owned: true, allowed: true }] }, now)).toMatchObject({ allowed: true, owned: true, inTrial: false });
    expect(toolAccess('custody', null, now)).toMatchObject({ paid: true, allowed: true });
  });
  it('identifiants alignés sur la migration et essai jamais avant le 07/12/2026', () => {
    expect(isPaidTool('pma_tracker')).toBe(true);
    expect(toolProductId('pma_tracker')).toBe('aufildenous_tool_pma_tracker');
    expect(toolEntitlement('contraception_journal')).toBe('TOOL_CONTRACEPTION_JOURNAL');
    expect(toolTrialUntil('2025-01-01T00:00:00Z')).toBe(new Date('2026-12-07T00:00:00+01:00').toISOString());
    expect(toolTrialUntil('2026-12-01T00:00:00Z')).toBe('2026-12-31T00:00:00.000Z');
  });
});

import { PAID_TOOLS } from '@/lib/premium/offers';
it('offres : la liste des outils payants de l’application est celle de la migration', () => {
  const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string }; // eslint-disable-line @typescript-eslint/no-require-imports
  const sql = fs.readFileSync('supabase/migrations/20261107000200_offres_ia_outils.sql', 'utf8');
  expect([...sql.matchAll(/\('([a-z_]+)', 'TOOL_/g)].map((m) => m[1])).toEqual([...PAID_TOOLS]);
});
