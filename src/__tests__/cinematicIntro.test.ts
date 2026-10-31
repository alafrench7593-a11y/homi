import { CINE_CHAPTERS, CINE_DURATION_S, CINE_LOGO, CINE_OPENING, CINE_SEGMENTS_S, chapterAt, introVideoQuality, segmentStarts, windowCurve } from '@/lib/domain/cinematicIntro';
import { cinema as fr } from '@/i18n/fr/cinema';
import { cinema as en } from '@/i18n/en/cinema';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean };

describe('introduction cinématique : chronologie', () => {
  it('dure entre 15 et 25 secondes, comme la vidéo montée (22,8 s)', () => {
    expect(CINE_DURATION_S).toBeCloseTo(22.8, 3);
    expect(CINE_DURATION_S).toBeGreaterThanOrEqual(15);
    expect(CINE_DURATION_S).toBeLessThanOrEqual(25);
  });
  it('reprend exactement les séquences et transitions du script de montage', () => {
    const script = fs.readFileSync('scripts/build-intro-video.sh', 'utf8');
    const durs = [...script.matchAll(/^\s+"\$[HJ]\|[\d.]+\|([\d.]+)\|(?:in|out)"/gm)].map((m) => Number(m[1]));
    expect(durs).toEqual([...CINE_SEGMENTS_S]);
    expect(script).toMatch(/X=0\.6\b/);
    expect(segmentStarts()).toEqual([0, 2.8, 5.2, 7.6, 9.8, 12, 14.2, 16, 18.2]);
  });
  it('ouverture, 7 étapes de vie puis logo, sans chevauchement de textes', () => {
    expect(CINE_CHAPTERS).toHaveLength(7);
    let prevEnd = CINE_OPENING.end;
    for (const c of CINE_CHAPTERS) {
      expect(c.start).toBeGreaterThanOrEqual(prevEnd - 0.31); // la sortie de l'un croise l'entrée du suivant pendant la transition
      expect(c.end - c.start).toBeGreaterThan(1.8);           // assez long pour être lu
      prevEnd = c.end;
    }
    expect(CINE_LOGO.start).toBeGreaterThanOrEqual(CINE_CHAPTERS[6].end - 0.31);
    expect(CINE_LOGO.end - CINE_LOGO.start).toBeGreaterThan(3.5);
    expect(chapterAt(1)).toBeNull();
    expect(chapterAt(9)?.title).toBe('cine.ch3.title');
    expect(chapterAt(21)).toBeNull();
  });
  it('courbes d’animation croissantes (exigé par Animated.interpolate)', () => {
    for (const w of [CINE_OPENING, CINE_LOGO, ...CINE_CHAPTERS]) {
      const { inputRange } = windowCurve(w);
      for (let i = 1; i < inputRange.length; i++) expect(inputRange[i]).toBeGreaterThan(inputRange[i - 1]);
    }
  });
  it('textes en français et en anglais, aucun vide', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
    for (const v of [...Object.values(fr), ...Object.values(en)]) expect(String(v).trim().length).toBeGreaterThan(0);
  });
  it('la vidéo et son image d’attente sont fournies avec l’application', () => {
    for (const f of ['intro-cinematique.mp4', 'intro-cinematique-1080.mp4', 'intro-cinematique.jpg']) expect(fs.existsSync(`assets/video/${f}`)).toBe(true);
  });
  it('4K sur iPhone et grands écrans Android, 1080p ailleurs', () => {
    expect(introVideoQuality('ios', 1334)).toBe('4k');
    expect(introVideoQuality('android', 3200)).toBe('4k');
    expect(introVideoQuality('android', 2400)).toBe('1080p');
    expect(introVideoQuality('web', 3000)).toBe('1080p');
  });
});
