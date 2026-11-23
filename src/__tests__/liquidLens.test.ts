import { LENS_HOMI, normalizeLens, parseLens, serializeLens } from '@/components/glass/liquid/params';
import { displacementMap, highlightMap, lipSlope, roundedRectField } from '@/components/glass/liquid/maps';

const g = { width: 120, height: 40, radius: 20 };
const px = (m: Uint8ClampedArray, x: number, y: number) => { const k = (y * g.width + x) * 4; return [m[k], m[k + 1], m[k + 2], m[k + 3]]; };

describe('réglages du verre liquide', () => {
  it('JSON du labo : aller-retour exact, clés inconnues ignorées, valeurs bornées, manquantes = HOMI', () => {
    const tuned = { ...LENS_HOMI, refraction: 31, fringe: 0, lightAngle: 200 };
    expect(parseLens(serializeLens(tuned))).toEqual(tuned);
    expect(parseLens('{"refraction": 999, "frost": -3, "pirate": 1}')).toEqual({ ...LENS_HOMI, refraction: 60, frost: 0 });
    expect(parseLens('pas du json')).toBeNull();
    expect(parseLens('[1,2]')).toBeNull();
    expect(normalizeLens({ fringe: 0 }).fringe).toBe(0);           // frange réglable jusqu'à zéro
  });
});

describe('cartes de la lèvre', () => {
  it('distance signée et normale d’un rectangle arrondi', () => {
    expect(roundedRectField(60, 20, g).d).toBeLessThan(-15);           // centre : bien à l'intérieur
    expect(roundedRectField(60, 0, g)).toMatchObject({ ny: -1 });      // bord haut : normale vers le haut
    const c = roundedRectField(3, 3, g);                               // coin arrondi : normale diagonale
    expect(c.nx).toBeLessThan(0); expect(c.ny).toBeLessThan(0);
  });
  it('profil : maximal au bord, nul au-delà de la lèvre ; plus épais = pénètre plus loin', () => {
    expect(lipSlope(0, 0.5)).toBe(1);
    expect(lipSlope(1, 0.5)).toBe(0);
    expect(lipSlope(0.5, 1)).toBeGreaterThan(lipSlope(0.5, 0));
  });
  it('déplacement : immobile au centre (la carte reste reconnaissable), vers l’intérieur près du bord', () => {
    const m = displacementMap(g, { bezel: 10, thickness: 0.5 });
    expect(px(m, 60, 20).slice(0, 2)).toEqual([128, 128]);
    expect(px(m, 60, 1)[1]).toBeGreaterThan(128);                       // bord haut → prend plus bas (intérieur)
    expect(px(m, 60, 38)[1]).toBeLessThan(128);                         // bord bas → prend plus haut
    expect(px(m, 2, 20)[0]).toBeGreaterThan(128);                        // bord gauche → prend à droite
  });
  it('reflet : nul au centre, plus fort sur le bord qui fait face à la lumière', () => {
    const m = highlightMap(g, { bezel: 12, highlight: 1, lightAngle: 90 }); // lumière du haut
    expect(px(m, 60, 20)[3]).toBe(0);
    expect(px(m, 60, 1)[3]).toBeGreaterThan(px(m, 60, 38)[3]);
    expect(highlightMap(g, { bezel: 12, highlight: 0, lightAngle: 90 }).filter((_, i) => i % 4 === 3).every((a) => a === 0)).toBe(true);
  });
});
