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
    const ok = /^https:\/\/(www\.)?(caf\.fr|pension-alimentaire\.caf\.fr|solidarites\.gouv\.fr|impots\.gouv\.fr|mes-aides\.gouv\.fr|monenfant\.fr|ameli\.fr|has-sante\.fr)/;
    for (const u of [...AIDS.map((a) => a.url), ...GESTURES.map((g) => g.url).filter(Boolean) as string[]]) expect(u).toMatch(ok);
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

import { ALL_VIDEOS as OFFICIAL_VIDEOS, embedUrl, watchUrl } from '@/lib/domain/officialVideos';

describe('vidéos officielles', () => {
  it('identifiants YouTube valides, uniques, sans doublon de clé', () => {
    const ids = OFFICIAL_VIDEOS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{11}$/);
    expect(new Set(OFFICIAL_VIDEOS.map((v) => v.key)).size).toBe(OFFICIAL_VIDEOS.length);
  });
  it('lecteur sans cookie, lecture dans la page, pas de vidéos d’autres chaînes à la fin', () => {
    const u = embedUrl('-9O4Go_lidQ', { origin: 'https://fr.aufildenous.app' });
    expect(u.startsWith('https://www.youtube-nocookie.com/embed/-9O4Go_lidQ?')).toBe(true);
    expect(u).toContain('playsinline=1');
    expect(u).toContain('rel=0');
    expect(u).toContain('origin=https%3A%2F%2Ffr.aufildenous.app');
    expect(() => embedUrl('"><script>')).toThrow();
    expect(watchUrl('qG88EmGtSPQ')).toBe('https://www.youtube.com/watch?v=qG88EmGtSPQ');
  });
  it.each([['fr', fr], ['en', en]])('%s : titre et chaîne pour chaque vidéo', (_l, d) => {
    const need = OFFICIAL_VIDEOS.flatMap((v) => [`sol.v.${v.key}`, `sol.v.by.${v.by}`]);
    expect(need.filter((k) => !(k in d))).toEqual([]);
  });
  it('les gestes pointent vers des vidéos de la liste', () => {
    for (const g of GESTURES) if (g.videoId) expect(OFFICIAL_VIDEOS.some((v) => v.id === g.videoId)).toBe(true);
  });
});
