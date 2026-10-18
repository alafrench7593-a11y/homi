jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'fr-FR', languageCode: 'fr', regionCode: 'FR' }] }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jpeg = require('jpeg-js');
import { setLocale } from '@/i18n';
import { blank, detectQuad, enhance, fullQuad, quadSize, rotate90, sharpness, toGray, warpPerspective, type Quad } from '@/lib/documents/imageOps';
import { buildExportPdf, pdfFromJpegs, pdfPageCount, winAnsiSafe } from '@/lib/documents/pdf';
import { buildSummary } from '@/lib/documents/summary';
import { interpret, searchDocuments } from '@/lib/documents/search';
import { BLOOD, ORDO } from './docText.test';
import type { RGBAImage } from '@/lib/cycleAnalysis/image';

afterEach(() => setLocale('fr'));

/** Feuille claire (avec quelques lignes d'« encre ») inclinée sur un fond sombre. */
function photo(q: Quad, w = 400, h = 300): RGBAImage {
  const img = blank(w, h);
  const inside = (x: number, y: number) => {
    let s = 0;
    for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; const c = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x); if (c < 0) return false; s++; }
    return s === 4;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const v = inside(x, y) ? (y % 23 === 0 && x % 7 < 5 ? 40 : 235) : 45;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  return img;
}
const Q: Quad = [{ x: 70, y: 40 }, { x: 330, y: 60 }, { x: 310, y: 270 }, { x: 60, y: 250 }];

describe('scanner : traitement d’image sur l’appareil', () => {
  it('détecte les bords d’une feuille inclinée (à quelques pixels près)', () => {
    const r = detectQuad(photo(Q))!;
    expect(r).not.toBeNull();
    r.quad.forEach((c, i) => { expect(Math.abs(c.x - Q[i].x)).toBeLessThan(6); expect(Math.abs(c.y - Q[i].y)).toBeLessThan(6); });
    expect(r.confidence).toBeGreaterThan(0.8);
  });
  it('rien de crédible (image uniforme) → recadrage manuel', () => {
    const img = blank(200, 150); img.data.fill(128);
    expect(detectQuad(img)).toBeNull();
  });
  it('redresse la perspective : le coin de la feuille devient le coin de l’image', () => {
    const out = warpPerspective(photo(Q), Q);
    expect(out.width).toBe(quadSize(Q).width);
    // les coins de la sortie sont dans la feuille (clairs), pas dans le fond
    for (const [x, y] of [[3, 3], [out.width - 4, 3], [out.width - 4, out.height - 4], [3, out.height - 4]]) expect(out.data[(y * out.width + x) * 4]).toBeGreaterThan(150);
  });
  it('rotation, niveaux de gris, amélioration', () => {
    const img = photo(Q);
    const r = rotate90(img, 'cw');
    expect([r.width, r.height]).toEqual([300, 400]);
    expect(rotate90(r, 'ccw').data).toEqual(img.data);
    const color = blank(2, 1); color.data.set([200, 50, 10, 255, 10, 200, 50, 255]);
    const g = toGray(color);
    expect(g.data[0]).toBe(g.data[1]);
    const dull = blank(10, 10); for (let i = 0; i < 400; i += 4) { const v = 100 + (i % 40); dull.data.set([v, v, v, 255], i); }
    const e = enhance(dull);
    expect(Math.max(...e.data.filter((_, i) => i % 4 === 0))).toBeGreaterThan(240);
  });
  it('photo floue : netteté plus faible', () => {
    const sharp = photo(fullQuad({ width: 300, height: 200 }), 300, 200);
    const blurred = blank(300, 200);
    for (let y = 0; y < 200; y++) for (let x = 0; x < 300; x++) {
      let s = 0, n = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = Math.min(199, Math.max(0, y + dy)), xx = Math.min(299, Math.max(0, x + dx)); s += sharp.data[(yy * 300 + xx) * 4]; n++; }
      const i = (y * 300 + x) * 4; blurred.data.set([s / n, s / n, s / n, 255], i);
    }
    expect(sharpness(blurred)).toBeLessThan(sharpness(sharp) / 3);
  });
});

describe('PDF sur l’appareil', () => {
  const jpg = (w: number, h: number) => { const img = photo(fullQuad({ width: w, height: h }), w, h); return { bytes: new Uint8Array(jpeg.encode({ width: w, height: h, data: img.data }, 80).data), width: w, height: h }; };
  it('document multipage dans l’ordre choisi', async () => {
    const pdf = await pdfFromJpegs([jpg(120, 160), jpg(160, 120), jpg(100, 140)], 'Bilan');
    expect(await pdfPageCount(pdf)).toBe(3);
    expect(String.fromCharCode(...pdf.slice(0, 5))).toBe('%PDF-');
  });
  it('dossier d’export : index + documents + résumés, fichier manquant signalé', async () => {
    const one = await pdfFromJpegs([jpg(100, 140), jpg(100, 140)]);
    const out = await buildExportPdf([
      { title: 'Prise de sang', meta: 'Analyse · 3 sept. 2026 · Moi', mime: 'application/pdf', bytes: one, summary: 'Hémoglobine : 11,8 g/dL' },
      { title: 'Photo ordonnance', meta: 'Ordonnance', mime: 'image/jpeg', bytes: jpg(100, 140).bytes },
      { title: 'Fichier HEIC', meta: 'Autre', mime: 'image/heic', bytes: null },
    ], { heading: 'Dossier pour la consultation', generated: 'Créé le 19/10/2026', notice: 'Partage décidé par vous.', missing: 'non inclus', summaryOf: 'Résumé :', summaryNotice: 'Résumé automatique, à vérifier.' });
    expect(await pdfPageCount(out)).toBe(1 + 2 + 1 + 1);
  });
  it('texte compatible avec les polices PDF standard', () => {
    expect(winAnsiSafe('L’échographie «T2» — ok…')).toBe('L\'échographie "T2" - ok...');
  });
});

describe('résumé fidèle', () => {
  it('rapide : type, date, conclusion recopiée', () => {
    const s = buildSummary({ text: BLOOD, title: 'Prise de sang', category: null }, 'quick');
    const keys = s.sections.map((x) => x.key);
    expect(keys).toEqual(['type', 'date', 'general', 'important', 'clarify']);
    expect(s.sections.find((x) => x.key === 'type')!.items[0]).toMatchObject({ text: 'Analyse sanguine', origin: 'detected' });
    expect(s.sections.find((x) => x.key === 'important')!.items[0]).toMatchObject({ text: 'Conclusion : contrôle conseillé dans 3 mois.', origin: 'document' });
  });
  it('détaillé : chaque chiffre du résumé figure dans le document ; aucun « normal / anormal »', () => {
    const s = buildSummary({ text: BLOOD, title: '', category: 'blood_test', confirmedDate: '2026-09-03' }, 'detailed');
    const values = s.sections.find((x) => x.key === 'values')!.items.map((i) => i.text);
    expect(values).toContain('Hémoglobine : 11,8 g/dL — plage indiquée sur le document : 12,0 - 16,0');
    expect(values.find((v) => v.startsWith('TSH'))).toBe('TSH : 2,1 mUI/L — aucune plage de référence indiquée');
    const all = s.sections.flatMap((x) => x.items.map((i) => i.text)).join('\n');
    for (const n of all.match(/\d+[,.]\d+/g) ?? []) expect(BLOOD).toContain(n);
    expect(all).not.toMatch(/\b(normal|anormal|inquiétant|rassurant|carence|anémie)\b/i);
    expect(s.sections.find((x) => x.key === 'date')!.items[0].origin).toBe('confirmed');
    expect(s.sections.find((x) => x.key === 'questions')!.items.every((i) => i.origin === 'explanation')).toBe(true);
  });
  it('ordonnance : dose manquante signalée, jamais complétée', () => {
    const s = buildSummary({ text: ORDO, title: '', category: 'prescription' }, 'detailed');
    const v = s.sections.find((x) => x.key === 'values')!.items;
    expect(v.find((i) => i.text.startsWith('SÉRUM'))).toBeUndefined(); // ni dose ni forme : pas une ligne de médicament
    const doli = v.find((i) => i.text.startsWith('DOLIPRANE'))!;
    expect(doli.text).toMatch(/non indiqué : durée/);
    expect(s.sections.find((x) => x.key === 'questions')!.items.map((i) => i.text).join(' ')).toMatch(/DOLIPRANE/);
  });
  it('explication simple : termes définis de façon générale, marqués « explication »', () => {
    const s = buildSummary({ text: BLOOD, title: '', category: 'blood_test' }, 'simple');
    const g = s.sections.find((x) => x.key === 'glossary')!.items;
    expect(g.map((i) => i.text.split(' — ')[0])).toEqual(expect.arrayContaining(['Hémoglobine', 'Ferritine', 'TSH', 'Glycémie']));
    expect(g.every((i) => i.origin === 'explanation')).toBe(true);
  });
  it('document illisible → nouvelle numérisation ou saisie manuelle', () => {
    expect(buildSummary({ text: '§§ ¤¤ ## ?? ~~\n@@ ##', title: '', category: null }, 'quick').unreadable).toBe(true);
  });
  it('anglais', () => {
    setLocale('en');
    const s = buildSummary({ text: BLOOD, title: '', category: 'blood_test' }, 'detailed');
    expect(s.sections.find((x) => x.key === 'type')!.items[0].text).toBe('Blood test');
    expect(s.sections.find((x) => x.key === 'values')!.items[0].text).toMatch(/range shown on the document: 12,0 - 16,0/);
  });
});

describe('recherche', () => {
  const kids = [{ id: 'k1', first_name: 'Léo' }];
  const docs = [
    { id: '1', title: 'Bilan', category: 'blood_test', doc_date: '2026-09-03', created_at: '2026-09-04T00:00:00Z', notes: null, ocr_text: BLOOD, child_id: null, pregnancy_id: null },
    { id: '2', title: 'Bilan ancien', category: 'blood_test', doc_date: '2025-02-01', created_at: '2025-02-02T00:00:00Z', notes: null, ocr_text: 'Ferritine 30 µg/L', child_id: null, pregnancy_id: null },
    { id: '3', title: 'Ordonnance otite', category: 'prescription', doc_date: '2026-10-12', created_at: '2026-10-12T00:00:00Z', notes: null, ocr_text: ORDO, child_id: 'k1', pregnancy_id: null },
    { id: '4', title: 'Écho T2', category: 'ultrasound', doc_date: '2026-06-01', created_at: '2026-06-01T00:00:00Z', notes: 'compte rendu morpho', ocr_text: null, child_id: null, pregnancy_id: 'p1' },
    { id: '5', title: 'Carnet vaccins', category: 'vaccination', doc_date: '2025-04-15', created_at: '2025-04-15T00:00:00Z', notes: null, ocr_text: 'Hexyon', child_id: 'k1', pregnancy_id: null },
  ];
  const ids = (q: string) => searchDocuments(docs, q, { children: kids, now: new Date('2026-10-19') }).results.map((d) => d.id);
  it('exemples en langage courant', () => {
    expect(ids('Retrouve ma dernière prise de sang.')).toEqual(['1']);
    expect(ids('Affiche les ordonnances de cette année.')).toEqual(['3']);
    expect(ids('Où se trouve le compte rendu de mon échographie ?')).toEqual(['4']);
    expect(ids('Retrouve les documents de vaccination de mon enfant.')).toEqual(['5']);
    expect(ids('Affiche les résultats contenant le mot ferritine.')).toEqual(['1', '2']);
    expect(ids('ferritine')).toEqual(['1', '2']);
    expect(ids('Léo')).toEqual(['3', '5']);
    expect(ids('2025')).toEqual(['5', '2']);
  });
  it('interprétation affichable', () => {
    expect(interpret('ordonnances de cette année', { children: kids, now: new Date('2026-10-19') })).toMatchObject({ categories: ['prescription'], year: 2026 });
  });
});

describe('octets ↔ base64 (adresse data: des aperçus et du mode démo)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { base64ToBytes, bytesToBase64, normalizeMime } = require('@/lib/documents/io') as typeof import('@/lib/documents/io');
  it('aller-retour exact, toutes longueurs', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 255, 1000]) {
      const b = new Uint8Array(n).map((_, i) => (i * 37 + 11) % 256);
      expect(Array.from(base64ToBytes(bytesToBase64(b)))).toEqual(Array.from(b));
    }
    expect(bytesToBase64(new TextEncoder().encode('PDF'))).toBe('UERG');
  });
  it('formats réellement pris en charge', () => {
    expect(normalizeMime('image/jpg', 'a.jpg')).toBe('image/jpeg');
    expect(normalizeMime(null, 'scan.HEIF')).toBe('image/heic');
    expect(normalizeMime('application/msword', 'lettre.doc')).toBeNull();
    expect(normalizeMime(undefined, 'virus.exe')).toBeNull();
  });
});
