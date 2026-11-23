import {
  encodeSensory, encodeSituation, latestSensory, parseSensory, parseSituation, sensoryLines, situationValid, whatHelps,
} from '@/lib/neuro/structured';

describe('profil sensoriel', () => {
  it('aller-retour, valeurs inconnues ignorées, retours à la ligne neutralisés', () => {
    const body = encodeSensory({ levels: { noise: 'avoids', movement: 'seeks', light: 'ok' }, calms: 'casque\nanti-bruit', avoid: '' });
    expect(body.split('\n')[0]).toBe('§sens1');
    const p = parseSensory(body)!;
    expect(p.levels).toEqual({ noise: 'avoids', movement: 'seeks', light: 'ok' });
    expect(p.calms).toBe('casque anti-bruit');
    expect(parseSensory('§sens1\nnoise=maybe\ncalms=a=b')).toEqual({ levels: {}, calms: 'a=b', avoid: '' });
  });
  it('texte libre ordinaire : non reconnu', () => {
    expect(parseSensory('Il a bien dormi')).toBeNull();
    expect(parseSensory(null)).toBeNull();
  });
  it('le plus récent gagne, lignes imprimables sans « sans souci »', () => {
    const entries = [{ body: 'note libre' }, { body: encodeSensory({ levels: { noise: 'avoids', light: 'ok' }, calms: 'coin calme', avoid: '' }) }, { body: encodeSensory({ levels: { crowd: 'avoids' }, calms: '', avoid: '' }) }];
    const cur = latestSensory(entries)!;
    expect(cur.entry).toBe(entries[1]);
    expect(sensoryLines(cur.profile, (s) => s, (l) => l, 'Apaise', 'Éviter')).toEqual(['noise : avoids', 'Apaise : coin calme']);
  });
});

describe('journal de situations', () => {
  it('aller-retour et intensité bornée', () => {
    const s = { before: 'fin écran', during: 'cris', after: 'calme', helped: 'câlin, casque', intensity: 4 };
    expect(parseSituation(encodeSituation(s))).toEqual(s);
    expect(parseSituation(encodeSituation({ ...s, intensity: 9 }))!.intensity).toBeNull();
  });
  it('valide seulement si « ce qui s’est passé » est rempli', () => {
    expect(situationValid({ before: 'x', during: '  ', after: '', helped: '', intensity: null })).toBe(false);
    expect(situationValid({ before: '', during: 'crise', after: '', helped: '', intensity: null })).toBe(true);
  });
  it('ce qui aide le plus souvent (insensible à la casse)', () => {
    const mk = (helped: string) => ({ body: encodeSituation({ before: '', during: 'x', after: '', helped, intensity: null }) });
    expect(whatHelps([mk('Câlin, casque'), mk('câlin'), mk('coin calme; casque'), { body: 'libre' }])).toEqual(['Câlin', 'casque', 'coin calme']);
  });
});
