/**
 * Espace Nounou (21/11/2026) — logique pure : fusion des doublons, récapitulatif sans invention, métadonnées JPEG
 * (EXIF GPS) retirées, photo de groupe bloquée, accueil d'un compte nounou, écrans ouverts / fermés à une nounou,
 * et garde-fou anti-surveillance (aucun accusé de lecture, aucune présence, aucun « vu à »).
 */
import {
  buildTimeline, canSharePhoto, carePhotoPath, findDuplicate, fitCarePhoto, isAlreadyUploaded, isCaregiverOnly,
  jpegMetadataReport, lastDefaults, mergePatch, stripJpegMetadata, summarizeDay, type CareItem,
} from '@/lib/domain/nounou';
import { gateFor } from '@/lib/premium/access';
import type { AccessInfo } from '@/lib/premium/offers';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; readdirSync(p: string): string[]; statSync(p: string): { isDirectory(): boolean } };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as { join(...p: string[]): string; resolve(...p: string[]): string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jpeg = require('jpeg-js') as { decode(b: Uint8Array, o?: { useTArray?: boolean }): { width: number; height: number; data: Uint8Array } };

// Buffer de Node (tests seulement)
const Buffer = (globalThis as unknown as { Buffer: { from(x: unknown, enc?: string): Uint8Array & { toString(e: string): string; equals(o: Uint8Array): boolean } } }).Buffer;
const CHILD = '11111111-1111-4111-8111-111111111111';
const at = (h: number, m = 0) => new Date(2026, 10, 21, h, m).toISOString();
const items = (rows: Record<string, Record<string, unknown>[]>) => buildTimeline(rows);

describe('fusion des doublons', () => {
  const existing = items({ bottles: [{ id: 'b1', child_id: CHILD, at: at(10, 5), consumed_ml: 120, created_by: 'parent', origin: 'parent', note: 'Tout bu' }] });
  it('propose la fusion pour le même type, le même enfant et une heure proche', () => {
    expect(findDuplicate({ kind: 'bottle', childId: CHILD, at: at(10, 15) }, existing)?.id).toBe('b1');
  });
  it('ne propose rien si l’heure est éloignée, le type ou l’enfant différent', () => {
    expect(findDuplicate({ kind: 'bottle', childId: CHILD, at: at(11, 0) }, existing)).toBeNull();
    expect(findDuplicate({ kind: 'meal', childId: CHILD, at: at(10, 5) }, existing)).toBeNull();
    expect(findDuplicate({ kind: 'bottle', childId: '22222222-2222-4222-8222-222222222222', at: at(10, 5) }, existing)).toBeNull();
  });
  it('ne fusionne jamais une observation (une information importante reste à part) ni une photo', () => {
    const obs = items({ child_observations: [{ id: 'o1', child_id: CHILD, at: at(10), kind: 'note', important: true }] });
    expect(findDuplicate({ kind: 'observation', childId: CHILD, at: at(10) }, obs)).toBeNull();
    expect(findDuplicate({ kind: 'photo', childId: CHILD, at: at(10) }, obs)).toBeNull();
  });
  it('complète sans écraser : champs vides remplis, remarques mises bout à bout', () => {
    const p = mergePatch('bottles', { consumed_ml: 120, milk_type: null, note: 'Tout bu' }, { consumed_ml: 90, milk_type: 'infant_formula', note: 'Rot après' });
    expect(p).toEqual({ milk_type: 'infant_formula', note: 'Tout bu · Rot après' });
    expect(mergePatch('bottles', { consumed_ml: 120, note: 'Tout bu' }, { consumed_ml: 120, note: 'Tout bu' })).toEqual({});
  });
  it('une sieste sans fin reçoit la fin connue par l’autre saisie', () => {
    expect(mergePatch('sleeps', { started_at: at(13), ended_at: null }, { started_at: at(13, 5), ended_at: at(14, 30) })).toEqual({ ended_at: at(14, 30) });
  });
  it('valeurs par défaut = dernière saisie du même type (ni heure ni remarque)', () => {
    expect(lastDefaults('bottle', existing)).toEqual({ consumed_ml: 120, milk_type: null });
  });
});

describe('récapitulatif sans invention', () => {
  it('« non renseigné » (null) quand rien n’est saisi, jamais zéro inventé', () => {
    const s = summarizeDay([]);
    expect(s.bottles).toEqual({ count: 0, totalMl: null, withoutAmount: 0 });
    expect(s.sleep.totalMinutes).toBeNull();
    expect(s.arrival).toBeNull();
  });
  it('total en ml : seulement les quantités saisies ; les biberons sans quantité sont comptés à part, sans estimation', () => {
    const s = summarizeDay(items({ bottles: [
      { id: '1', at: at(9), consumed_ml: 120 }, { id: '2', at: at(12), consumed_ml: 150 }, { id: '3', at: at(15), consumed_ml: null, prepared_ml: 180 },
    ] }));
    expect(s.bottles).toEqual({ count: 3, totalMl: 270, withoutAmount: 1 });
  });
  it('sommeil : durée des siestes terminées seulement ; une sieste en cours n’est pas estimée', () => {
    const s = summarizeDay(items({ sleeps: [
      { id: 's1', started_at: at(10), ended_at: at(11, 30) }, { id: 's2', started_at: at(14), ended_at: null },
    ] }));
    expect(s.sleep).toEqual({ count: 2, totalMinutes: 90, ongoing: 1 });
  });
  it('arrivée, départ, changes, observations importantes et photos', () => {
    const s = summarizeDay(items({
      childcare_events: [{ id: 'a', kind: 'arrival', at: at(8, 30) }, { id: 'd', kind: 'departure', at: at(17, 45) }, { id: 'x', kind: 'activity', at: at(10) }],
      diapers: [{ id: 'c', at: at(9), wet: true, stool: false }, { id: 'c2', at: at(13), wet: true, stool: true }],
      child_observations: [{ id: 'o', kind: 'note', at: at(11), important: true }, { id: 'o2', kind: 'symptom', at: at(11) }],
      childcare_photos: [{ id: 'p', taken_at: at(16), author_id: 'n' }],
    }));
    expect(s.arrival).toBe(at(8, 30));
    expect(s.departure).toBe(at(17, 45));
    expect(s.diapers).toEqual({ count: 2, wet: 2, stool: 1 });
    expect(s.activities.count).toBe(1);
    expect(s.observations).toEqual({ count: 1, important: 1 }); // un symptôme du suivi santé n'entre pas dans le carnet
    expect(s.photos.count).toBe(1);
  });
  it('chronologie : saisies en attente gardées une seule fois (même client_id)', () => {
    const tl = buildTimeline({ bottles: [{ id: 'srv', client_id: 'c1', at: at(9) }, { id: 'c1', client_id: 'c1', at: at(9), _pending: true }] });
    expect(tl).toHaveLength(1);
  });
});

describe('photos : métadonnées retirées (EXIF GPS)', () => {
  // JPEG 24 × 16 produit par sharp avec un EXIF contenant marque, modèle et position GPS (48°51′24″ N, 2°21′3″ E)
  const FIXTURE = '/9j/4QFQRXhpZgAASUkqAAgAAAAJAA8BAgAKAAAAigAAABABAgADAAAAWDEAABIBAwABAAAAAQAAABoBBQABAAAAegAAABsBBQABAAAAggAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAlAAAACWIBAABAAAA4gAAAAAAAAA4YwAA6AMAADhjAADoAwAAVGVzdFBob25lAAYAAJAHAAQAAAAwMjEwAZEHAAQAAAABAgMAAKAHAAQAAAAwMTAwAaADAAEAAAD//wAAAqAEAAEAAAAYAAAAA6AEAAEAAAAQAAAAAAAAAAQAAQACAAIAAABOAAAAAgAFAAMAAAAwAQAAAwACAAIAAABFAAAABAAFAAMAAAAYAQAAAAAAAAIAAAABAAAAFQAAAAEAAAAsAQAAZAAAADAAAAABAAAAMwAAAAEAAABgCQAAZAAAAP/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIABAAGAMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAAABv/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKACfWAAD//Z';
  const bytes = new Uint8Array(Buffer.from(FIXTURE, 'base64'));
  const latin = (b: Uint8Array) => Buffer.from(b).toString('latin1');

  it('le fichier de test porte bien un EXIF avec position GPS', () => {
    expect(jpegMetadataReport(bytes)).toMatchObject({ exif: true, gps: true });
    expect(latin(bytes)).toContain('TestPhone');
  });
  it('après nettoyage : plus d’EXIF, plus de GPS, plus de marque d’appareil', () => {
    const out = stripJpegMetadata(bytes);
    expect(jpegMetadataReport(out)).toEqual({ exif: false, gps: false, xmp: false, comment: false });
    expect(latin(out)).not.toContain('Exif');
    expect(latin(out)).not.toContain('TestPhone');
    expect(out.length).toBeLessThan(bytes.length);
  });
  it('l’image elle-même est intacte (mêmes pixels décodés)', () => {
    const a = jpeg.decode(bytes, { useTArray: true });
    const b = jpeg.decode(stripJpegMetadata(bytes), { useTArray: true });
    expect([b.width, b.height]).toEqual([24, 16]);
    expect(Buffer.from(b.data).equals(Buffer.from(a.data))).toBe(true);
  });
  it('un nettoyage répété est stable ; un fichier qui n’est pas un JPEG est refusé', () => {
    const once = stripJpegMetadata(bytes);
    expect(Buffer.from(stripJpegMetadata(once)).equals(Buffer.from(once))).toBe(true);
    expect(() => stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toThrow('not_jpeg');
  });
  it('réduction : grand côté 1600 px, proportions gardées, jamais d’agrandissement', () => {
    expect(fitCarePhoto(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitCarePhoto(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('envoi idempotent : chemin déterminé par l’identifiant client ; un fichier déjà déposé n’est pas une erreur', () => {
    const h = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; const c = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    expect(carePhotoPath(h, CHILD, c)).toBe(carePhotoPath(h, CHILD, c));
    expect(carePhotoPath(h, CHILD, c)).toBe(`${h}/${CHILD}/${c}.jpg`);
    expect(() => carePhotoPath('../x', CHILD, c)).toThrow();
    expect(isAlreadyUploaded({ message: 'The resource already exists', statusCode: '409' })).toBe(true);
    expect(isAlreadyUploaded({ message: 'Network request failed' })).toBe(false);
  });
});

describe('confidentialité du partage', () => {
  it('photo de groupe : partage bloqué ; photos non autorisées : bloqué ; réponse et confirmation exigées', () => {
    expect(canSharePhoto({ photosAllowed: true, otherChildren: true, confirmed: true })).toBe('group_photo');
    expect(canSharePhoto({ photosAllowed: false, otherChildren: false, confirmed: true })).toBe('not_allowed');
    expect(canSharePhoto({ photosAllowed: true, otherChildren: null, confirmed: true })).toBe('answer_needed');
    expect(canSharePhoto({ photosAllowed: true, otherChildren: false, confirmed: false })).toBe('confirm_needed');
    expect(canSharePhoto({ photosAllowed: true, otherChildren: false, confirmed: true })).toBe('ok');
  });
});

describe('nounou : accueil et écrans', () => {
  const access = (over: Partial<AccessInfo> = {}): AccessInfo => ({ premium: false, ai: false, trial_until: null, strict: true, tools: [], ...over });
  it('compte seulement nounou → accueil « Mes gardes » ; parent (même nounou ailleurs) → accueil habituel', () => {
    expect(isCaregiverOnly([{ household_id: 'a', role: 'caregiver' }, { household_id: 'b', role: 'caregiver' }])).toBe(true);
    expect(isCaregiverOnly([{ household_id: 'a', role: 'caregiver' }, { household_id: 'c', role: 'owner' }])).toBe(false);
    expect(isCaregiverOnly([])).toBe(false);
  });
  it('l’espace nounou est ouvert à une nounou sans Premium ; les écrans d’adultes restent fermés', () => {
    for (const p of ['/garde', '/garde/abc', '/garde/abc/photo', '/garde/abc/messages']) expect([p, gateFor(p, false, access({ caregiver: true }))]).toEqual([p, 'open']);
    for (const p of ['/family/couple', '/family/load', '/family/me-time', '/family/papers']) expect([p, gateFor(p, false, access({ caregiver: true }))]).toEqual([p, 'locked']);
    expect(gateFor('/garde/abc', false, access())).toBe('locked'); // l'espace d'un enfant : Premium de la famille ou garde confirmée
    expect(gateFor('/garde/rejoindre', false, access())).toBe('open'); // rejoindre une garde : toujours possible
  });
});

describe('garde-fou anti-surveillance (messagerie parents–nounou)', () => {
  const ROOT = path.resolve('.');
  const files: string[] = [];
  const walk = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else files.push(p); } };
  walk(path.join(ROOT, 'src/app/garde'));
  walk(path.join(ROOT, 'src/features/nounou'));
  files.push(path.join(ROOT, 'src/lib/data/hooks-nounou.ts'), path.join(ROOT, 'src/lib/domain/nounou.ts'));
  const FORBIDDEN = /\b(read_at|readAt|seen_at|seenAt|last_seen|lastSeen|is_online|isOnline|online_at|presence|typing|delivered_at|readReceipt|lastActive|last_active)\b/;
  it('aucun accusé de lecture, aucun « en ligne », aucun « vu à », aucune indication de frappe dans le code', () => {
    const hits = files.filter((f) => FORBIDDEN.test(fs.readFileSync(f, 'utf8'))).map((f) => f.replace(ROOT, ''));
    expect(hits).toEqual([]);
  });
  it('la table childcare_messages n’a aucune colonne de lecture ou de présence ; aucune relance automatique planifiée', () => {
    const sql = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261121000100_espace_nounou.sql'), 'utf8');
    const table = sql.slice(sql.indexOf('create table if not exists public.childcare_messages'), sql.indexOf(');', sql.indexOf('create table if not exists public.childcare_messages')));
    expect(table).toContain('body text');
    expect(table).not.toMatch(/read|seen|online|presence|typing|delivered/i);
    expect(sql).not.toMatch(/cron\.schedule|reminder|relance/i);
  });
  it('les notifications de la garde ne transportent ni image ni contenu', () => {
    const sql = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261121000100_espace_nounou.sql'), 'utf8');
    const fn = sql.slice(sql.indexOf('create or replace function public._childcare_notify'), sql.indexOf('revoke execute on function public._childcare_notify'));
    expect(fn).not.toMatch(/storage_path|caption|new\.body|image|attachment/i);
  });
});

// Le type CareItem reste exporté pour les écrans
export type _CareItem = CareItem;
