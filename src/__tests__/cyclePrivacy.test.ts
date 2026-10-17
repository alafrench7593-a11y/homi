/**
 * Confidentialité renforcée : suppression de l'image, conservation uniquement sur demande,
 * aucune publication ni sauvegarde accidentelle, chiffrement, journaux nettoyés.
 * Plus : messages de la glaire et calendrier croisé (jamais de confirmation).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs') as { readdirSync(p: string): string[]; readFileSync(p: string, enc: 'utf8'): string };
const path = require('path') as { join(...p: string[]): string };
declare const __dirname: string;
import { abandonPhoto, buildTestRow, saveMucus, saveTest, type PhotoDeps, type TestSave } from '@/lib/cycleAnalysis/session';
import { decryptBytes, encryptBytes, redactForLogs } from '@/lib/cycleAnalysis/privacy';
import { observationMessage, photoSuggestionMessage, NO_OVULATION_PROOF } from '@/lib/cycleAnalysis/mucus';
import { buildDayEvents, crossedOvulationEstimate } from '@/lib/domain/cycleHistory';

function fakeDeps(opts: { failInsert?: boolean } = {}) {
  const calls: { insert: [string, Record<string, unknown>][]; kept: string[]; discarded: (string | null | undefined)[] } = { insert: [], kept: [], discarded: [] };
  const deps: PhotoDeps = {
    insert: async (table, row) => {
      if (opts.failInsert) throw new Error('réseau');
      calls.insert.push([table, row]);
      return [row];
    },
    keepPhoto: async (_u, uri) => { calls.kept.push(uri); return '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.enc'; },
    discard: async (uri) => { calls.discarded.push(uri); },
  };
  return { deps, calls };
}

const BASE: TestSave = {
  userId: '11111111-1111-4111-8111-111111111111', kind: 'pregnancy', ruleId: 'first-response-early-result', brandLabel: 'First Response Early Result',
  format: 'lines', testedAt: '2026-10-17T07:30:00.000Z', minutesAfter: 4, withinReadWindow: 'yes', expectedPeriodOn: '2026-10-16',
  analysisOutcome: 'possibly_positive', analysisConfidence: 0.8, method: 'on_device_lines', confirmedOutcome: 'possibly_positive',
  note: null, photoUri: 'file:///cache/ImagePicker/abc.jpg', keepPhoto: false,
};

describe('cycle de vie de la photo', () => {
  it('par défaut : seul le résultat est gardé, l’image locale est supprimée', async () => {
    const { deps, calls } = fakeDeps();
    const r = await saveTest(BASE, deps);
    expect(r.photoPath).toBeNull();
    expect(calls.kept).toEqual([]);
    expect(calls.discarded).toEqual([BASE.photoUri]);
    const [table, row] = calls.insert[0];
    expect(table).toBe('pregnancy_tests');
    expect(row.photo_path).toBeNull();
    expect(row.result).toBe('positive');
    expect(row.user_confirmed).toBe(true);
    expect(JSON.stringify(row)).not.toContain('file://');
  });
  it('photo gardée seulement sur demande explicite (chiffrée), et l’image locale est quand même supprimée', async () => {
    const { deps, calls } = fakeDeps();
    const r = await saveTest({ ...BASE, keepPhoto: true }, deps);
    expect(calls.kept).toEqual([BASE.photoUri]);
    expect(r.photoPath).toMatch(/\.enc$/);
    expect(calls.insert[0][1].photo_path).toBe(r.photoPath);
    expect(calls.discarded).toEqual([BASE.photoUri]);
  });
  it('en cas d’erreur d’enregistrement, l’image locale est supprimée aussi', async () => {
    const { deps, calls } = fakeDeps({ failInsert: true });
    await expect(saveTest(BASE, deps)).rejects.toThrow('réseau');
    expect(calls.discarded).toEqual([BASE.photoUri]);
  });
  it('« Supprimer la photo maintenant » supprime immédiatement l’image', async () => {
    const { deps, calls } = fakeDeps();
    await abandonPhoto('file:///cache/x.jpg', deps);
    expect(calls.discarded).toEqual(['file:///cache/x.jpg']);
    expect(calls.insert).toEqual([]);
  });
  it('glaire : suggestion gardée sans la photo, image supprimée', async () => {
    const { deps, calls } = fakeDeps();
    await saveMucus({ userId: BASE.userId, observedOn: '2026-10-17', category: 'egg_white', texture: 'stretchy', sensation: 'slippery', note: null, suggestion: { analyzable: true, category: 'egg_white', confidence: 0.6 }, photoUri: 'file:///cache/m.jpg', keepPhoto: false }, deps);
    const [table, row] = calls.insert[0];
    expect(table).toBe('fertility_observations');
    expect(row).toMatchObject({ cervical_mucus: 'egg_white', mucus_texture: 'stretchy', mucus_sensation: 'slippery', photo_suggestion: 'egg_white', photo_confidence: 0.6 });
    expect(row).not.toHaveProperty('photo_path');
    expect(calls.discarded).toEqual(['file:///cache/m.jpg']);
  });
  it('la ligne enregistrée contient les réponses aux questions et l’analyse proposée', () => {
    const row = buildTestRow({ ...BASE, kind: 'ovulation', confirmedOutcome: 'uncertain', analysisOutcome: 'lh_peak_possible' }, null);
    expect(row).toMatchObject({ result: 'uncertain', analysis_outcome: 'lh_peak_possible', within_read_window: 'yes', minutes_after: 4, analysis_method: 'on_device_lines' });
    expect(row).not.toHaveProperty('expected_period_on');
  });
});

describe('aucune publication ni sauvegarde accidentelle', () => {
  const ROOT = path.join(__dirname, '..');
  const files = [
    ...fs.readdirSync(path.join(ROOT, 'lib/cycleAnalysis')).map((f) => path.join(ROOT, 'lib/cycleAnalysis', f)),
    path.join(ROOT, 'features/cycleTests.tsx'),
    path.join(ROOT, 'lib/data/hooks-cycle.ts'),
    path.join(ROOT, 'app/fertility/mucus.tsx'),
    path.join(ROOT, 'app/fertility/test/[kind].tsx'),
    path.join(ROOT, 'app/fertility/calendar.tsx'),
    path.join(ROOT, 'app/fertility/understand.tsx'),
  ];
  // Le code seul (commentaires retirés : ils citent justement ce qui est interdit)
  const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const src = files.map((f) => [f, stripComments(fs.readFileSync(f, 'utf8'))] as const);

  it('aucun accès à la galerie en écriture (expo-media-library, saveToLibrary)', () => {
    for (const [f, s] of src) expect([f, /expo-media-library|saveToLibrary|createAssetAsync|MediaLibrary\.(save|create)/.test(s)]).toEqual([f, false]);
  });
  it('aucune écriture vers la communauté (forum) ni partage système', () => {
    for (const [f, s] of src) expect([f, /community_posts|community_comments|forum|Share\.share|expo-sharing/.test(s)]).toEqual([f, false]);
  });
  it('aucun journal (console) ni outil de statistiques dans ces fichiers', () => {
    for (const [f, s] of src) expect([f, /console\.(log|info|warn|error|debug)|analytics|Sentry|track\(/.test(s)]).toEqual([f, false]);
  });
  it('les photos de tests ne sont jamais envoyées au serveur (analyse locale uniquement)', () => {
    const screen = src.find(([f]) => f.endsWith('[kind].tsx'))![1];
    expect(screen).not.toMatch(/invoke\(|jpegBase64ForUpload|requestMucusSuggestion/);
  });
  it('l’envoi de la photo de glaire passe toujours par une confirmation explicite', () => {
    const screen = src.find(([f]) => f.endsWith('mucus.tsx'))![1];
    const ask = screen.slice(screen.indexOf('async function askSuggestion'), screen.indexOf('async function submit'));
    expect(ask.indexOf('await confirm(')).toBeGreaterThan(-1);
    expect(ask.indexOf('await confirm(')).toBeLessThan(ask.indexOf('requestMucusSuggestion'));
    expect(ask).toMatch(/if \(!ok\) return;/);
  });
});

describe('chiffrement et journaux', () => {
  it('AES-GCM : aller-retour, données illisibles sans la clé, altération détectée', () => {
    const key = new Uint8Array(32).map((_, i) => i * 7);
    const plain = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const sealed = encryptBytes(key, plain);
    expect(Array.from(sealed)).not.toEqual(expect.arrayContaining(Array.from(plain.subarray(0, 3))));
    expect(Array.from(decryptBytes(key, sealed))).toEqual(Array.from(plain));
    const other = new Uint8Array(32).fill(1);
    expect(() => decryptBytes(other, sealed)).toThrow();
    const tampered = sealed.slice();
    tampered[tampered.length - 1] ^= 1;
    expect(() => decryptBytes(key, tampered)).toThrow();
    expect(encryptBytes(key, plain)).not.toEqual(sealed); // nonce aléatoire
  });
  it('redactForLogs retire images, URI et base64', () => {
    const out = JSON.stringify(redactForLogs({ message: 'Analyse impossible', photoUri: 'file:///x.jpg', nested: { b: 'data:image/jpeg;base64,AAAA', big: 'A'.repeat(400) }, bytes: new Uint8Array(3) }));
    expect(out).toContain('Analyse impossible');
    expect(out).not.toMatch(/file:|data:image|AAAAAAAA/);
  });
});

describe('messages prudents', () => {
  it('glaire : jamais d’affirmation d’ovulation', () => {
    for (const c of ['dry', 'sticky', 'creamy', 'egg_white', 'watery'] as const) expect(observationMessage(c)).toContain(NO_OVULATION_PROOF);
    expect(photoSuggestionMessage({ analyzable: true, category: 'egg_white', confidence: 0.7 })).toBe('L’aspect semble compatible avec une période potentiellement fertile, mais une photo de glaire cervicale ne permet pas de confirmer une ovulation.');
    expect(photoSuggestionMessage({ analyzable: true, category: 'unusual', confidence: 0.5 })).toMatch(/ne pose pas de diagnostic.*professionnel/);
    expect(photoSuggestionMessage({ analyzable: false, category: 'unanalyzable', confidence: 0 })).toMatch(/n’a pas pu être analysée/);
  });
  it('calendrier : rapports masqués si l’option est désactivée', () => {
    const input = { periods: [], observations: [], ovulationTests: [], pregnancyTests: [], symptoms: [] };
    expect(buildDayEvents({ ...input, intercourse: null }).size).toBe(0);
    expect(buildDayEvents({ ...input, intercourse: [{ id: 'r', occurred_on: '2026-10-10' }] }).get('2026-10-10')?.[0].kind).toBe('intercourse');
  });
  it('estimation croisée : test LH + glaire → estimation, jamais « confirmée »', () => {
    const e = crossedOvulationEstimate([], '2026-10-01', {
      ovulationTests: [{ id: 'a', tested_at: '2026-10-13T08:00:00', result: 'positive', note: null }],
      observations: [{ id: 'o', observed_on: '2026-10-12', bbt_celsius: null, cervical_mucus: 'egg_white', note: null }],
    }, '2026-10-17');
    expect(e?.basis).toBe('lh_test_and_mucus');
    expect(e?.ovulation).toBe('2026-10-14');
    expect(e?.text).toMatch(/estimation/i);
    expect(e?.text).not.toMatch(/confirmée|certaine/i);
  });
});
