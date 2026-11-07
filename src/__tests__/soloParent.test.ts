import { AIDS, GESTURES, ageYears, aidsFor, gesturesFor, helpersFor, smsLink } from '@/lib/domain/soloParent';

describe('profil maman solo', () => {
  it('aides : pension alimentaire seulement si séparée, CMG seulement avant 12 ans', () => {
    expect(aidsFor({ separated: false, youngestAge: 3 }).map((a) => a.key)).not.toContain('aripa');
    expect(aidsFor({ separated: true, youngestAge: 3 }).map((a) => a.key)).toContain('aripa');
    expect(aidsFor({ separated: false, youngestAge: 12 }).map((a) => a.key)).not.toContain('cmg');
    expect(aidsFor({ separated: false, youngestAge: 11 }).map((a) => a.key)).toContain('cmg');
    expect(aidsFor({ separated: false, youngestAge: null }).map((a) => a.key)).toContain('cmg');
  });
  it('toutes les sources sont des sites officiels en https', () => {
    const ok = /^https:\/\/(www\.)?(caf\.fr|pension-alimentaire\.caf\.fr|solidarites\.gouv\.fr|impots\.gouv\.fr|mes-aides\.gouv\.fr|monenfant\.fr|ameli\.fr|has-sante\.fr|youtube\.com\/embed\/videoseries\?list=PL8602856ED75D6285)/;
    for (const u of [...AIDS.map((a) => a.url), ...GESTURES.flatMap((g) => [g.url, g.video]).filter(Boolean) as string[]]) expect(u).toMatch(ok);
  });
  it('âge et gestes adaptés', () => {
    expect(ageYears('2024-11-08', '2026-11-07')).toBe(1);
    expect(ageYears('2024-11-07', '2026-11-07')).toBe(2);
    expect(gesturesFor([]).map((g) => g.key)).toContain('bath');
    const big = gesturesFor([6]).map((g) => g.key);
    expect(big).not.toContain('bath');
    expect(big).toContain('fever');
    expect(big).toContain('if_i_fall_ill');
  });
  it('cercle : personnes joignables d’abord ; SMS prérempli', () => {
    const c = [{ name: 'A', helps: ['nights'] as const, phone: null }, { name: 'B', helps: ['nights', 'pickup'] as const, phone: '06 11' }].map((x) => ({ ...x, helps: [...x.helps] }));
    expect(helpersFor(c, 'nights').map((x) => x.name)).toEqual(['B', 'A']);
    expect(helpersFor(c, 'meals')).toEqual([]);
    expect(smsLink('06 12 34-56', 'Tu peux ?', 'ios')).toBe('sms:061234-56'.replace('-', '') + '&body=Tu%20peux%20%3F');
    expect(smsLink('+33 6', 'a', 'android')).toBe('sms:+336?body=a');
  });
});

import { solo as fr } from '@/i18n/fr/solo';
import { solo as en } from '@/i18n/en/solo';
import { HELP_KINDS } from '@/lib/domain/soloParent';

describe('i18n maman solo', () => {
  const need = [
    ...AIDS.flatMap((a) => [`sol.aid.${a.key}`, `sol.aid.${a.key}.d`]),
    ...GESTURES.flatMap((g) => [`sol.g.${g.key}`, `sol.g.${g.key}.d`, ...Array.from({ length: g.steps }, (_, i) => `sol.g.${g.key}.s${i + 1}`), ...(g.care ? [`sol.g.${g.key}.care`] : [])]),
    ...HELP_KINDS.flatMap((k) => [`sol.help.${k}`, `sol.ask.${k}`]),
  ];
  it.each([['fr', fr], ['en', en]])('%s couvre toutes les clés dynamiques', (_l, d) => expect(need.filter((k) => !(k in d))).toEqual([]));
  it('aucune formule interdite, aucun montant d’allocation', () => {
    const all = JSON.stringify(fr).toLowerCase();
    for (const bad of ['sans risque', 'c’est normal', "c'est normal", 'aucun danger', 'pas besoin de consulter', 'validé par un professionnel', '€', ' mg', 'ml/kg']) expect(all).not.toContain(bad);
  });
});
