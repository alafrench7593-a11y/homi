/**
 * Ajout d'une photo dans la communauté sur iPhone (bug constaté sur appareil réel).
 * Ces tests rejouent le chemin « téléphone » que la version web ne parcourt pas :
 *  - le sélecteur de photos s'ouvre SANS exiger l'accès à toute la photothèque (un refus bloquait tout, pour toujours) ;
 *  - la photo est réduite et encodée en JPEG par le téléphone (jamais par le décodeur JavaScript, qui figeait l'app),
 *    lue par le système de fichiers (jamais fetch(file://…)), nettoyée de ses métadonnées, nettement sous 3 Mo ;
 *  - le chemin d'envoi commence par l'identifiant de la personne, comme l'exige la règle du stockage ;
 *  - type envoyé : image/jpeg, accepté par le stockage (pas de HEIC) ;
 *  - un échec donne une erreur nommée (message traduit), et rien ne reste à moitié envoyé.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockManipulate = jest.fn();
jest.mock('expo-image-manipulator', () => ({ manipulateAsync: (...a: unknown[]) => mockManipulate(...a), SaveFormat: { JPEG: 'jpeg', PNG: 'png' } }));
const mockFileBytes = jest.fn();
jest.mock('expo-file-system', () => ({
  File: class { uri: string; constructor(uri: string) { this.uri = uri; } bytes() { return mockFileBytes(this.uri); } delete() { /* fichier temporaire */ } get exists() { return true; } },
  Paths: { cache: 'file:///cache' },
}));
const mockLaunch = jest.fn();
const mockRequestLibrary = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...a: unknown[]) => mockLaunch(...a),
  requestMediaLibraryPermissionsAsync: (...a: unknown[]) => mockRequestLibrary(...a),
  requestCameraPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(),
}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
const mockUpload = jest.fn();
const mockRemove = jest.fn(async (..._a: unknown[]) => undefined);
jest.mock('@/lib/backend', () => {
  const types = jest.requireActual('@/lib/backend/types');
  return { ...types, isDemo: false, backend: { mode: 'supabase', storage: { upload: (...a: unknown[]) => mockUpload(...a), remove: (...a: unknown[]) => mockRemove(...a) } } };
});

import { Platform } from 'react-native';
import {
  COMMUNITY_MAX_BYTES, COMMUNITY_MIME, COMMUNITY_TARGET_BYTES, CommunityPhotoError, communityPhotoPath, jpegHasMetadata, photoErrorKey, prepareCommunityPhoto, stripJpegMetadata,
} from '@/lib/community/photos';
import * as io from '@/lib/documents/io';
import { uploadPhotos } from '@/lib/data/hooks-community';
import { uploadBody } from '@/lib/backend/supabase';
import { DICTIONARIES } from '@/i18n/dictionaries';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string };

const seg = (marker: number, payload: number[]) => [0xff, marker, ((payload.length + 2) >> 8) & 255, (payload.length + 2) & 255, ...payload];
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
const SCAN = [0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0x33, 0xff, 0xd9];
/** JPEG tel qu'un iPhone l'écrit : JFIF, bloc Exif (avec GPS), profil de couleurs ICC, XMP, commentaire, puis l'image. */
function phoneJpeg(): Uint8Array {
  return Uint8Array.from([
    0xff, 0xd8,
    ...seg(0xe0, ascii('JFIF\0')),
    ...seg(0xe1, ascii('Exif\0\0GPS 48.85N 2.35E iPhone 15')),
    ...seg(0xe2, ascii('ICC_PROFILE\0Display P3')),
    ...seg(0xe1, ascii('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta/>')),
    ...seg(0xfe, ascii('commentaire')),
    ...SCAN,
  ]);
}
const text = (b: Uint8Array) => Array.from(b, (c) => String.fromCharCode(c)).join('');
const USER = 'a1b2c3d4-0000-4000-8000-00000000abcd';

const realOS = Platform.OS;
beforeEach(() => { jest.clearAllMocks(); Platform.OS = 'ios'; });
afterAll(() => { Platform.OS = realOS; });

describe('métadonnées : rien de personnel ne quitte le téléphone', () => {
  it('retire Exif, GPS, XMP et commentaires ; garde l’image et le profil de couleurs', () => {
    const raw = phoneJpeg();
    expect(jpegHasMetadata(raw)).toBe(true);
    const clean = stripJpegMetadata(raw);
    expect(jpegHasMetadata(clean)).toBe(false);
    expect(text(clean)).not.toMatch(/Exif|GPS|iPhone|xmpmeta|commentaire/);
    expect(text(clean)).toContain('ICC_PROFILE');
    expect(Array.from(clean.slice(0, 2))).toEqual([0xff, 0xd8]);
    expect(Array.from(clean.slice(-SCAN.length))).toEqual(SCAN);
  });
  it('un fichier qui n’est pas un JPEG est refusé avec une erreur nommée', () => {
    expect(() => stripJpegMetadata(Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]))).toThrow(CommunityPhotoError); // HEIC
    expect(() => stripJpegMetadata(new Uint8Array(0))).toThrow(CommunityPhotoError);
  });
});

describe('iPhone : préparation d’une photo', () => {
  it('réduit et encode en JPEG par le téléphone, lit le fichier, sans décodeur JavaScript ni fetch', async () => {
    const decode = jest.spyOn(io, 'decodeForScan');
    const fetchSpy = jest.fn();
    const realFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    mockManipulate.mockResolvedValue({ uri: 'file:///cache/out.jpg', width: 1600, height: 1200 });
    mockFileBytes.mockResolvedValue(phoneJpeg());
    try {
      const p = await prepareCommunityPhoto('file:///var/mobile/IMG_0042.HEIC', { width: 4032, height: 3024 });
      expect(mockManipulate).toHaveBeenCalledTimes(1);
      const [uri, actions, opts] = mockManipulate.mock.calls[0];
      expect(uri).toBe('file:///var/mobile/IMG_0042.HEIC');
      expect(actions).toEqual([{ resize: { width: 1600 } }]);
      expect(opts).toMatchObject({ format: 'jpeg' });
      expect(opts.compress).toBeLessThan(1);
      expect(mockFileBytes).toHaveBeenCalledWith('file:///cache/out.jpg');
      expect(decode).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(jpegHasMetadata(p.bytes)).toBe(false);
      expect(p).toMatchObject({ width: 1600, height: 1200 });
      expect(p.previewUri.startsWith('data:image/jpeg;base64,')).toBe(true);
      expect(p.bytes.length).toBeLessThan(COMMUNITY_MAX_BYTES);
    } finally { globalThis.fetch = realFetch; decode.mockRestore(); }
  });
  it('photo en hauteur : c’est le grand côté qui est borné ; petite image : pas d’agrandissement', async () => {
    mockManipulate.mockResolvedValue({ uri: 'file:///cache/out.jpg', width: 1200, height: 1600 });
    mockFileBytes.mockResolvedValue(phoneJpeg());
    await prepareCommunityPhoto('file:///p.jpg', { width: 3024, height: 4032 });
    expect(mockManipulate.mock.calls[0][1]).toEqual([{ resize: { height: 1600 } }]);
    mockManipulate.mockClear();
    await prepareCommunityPhoto('file:///petite.png', { width: 800, height: 600 });
    expect(mockManipulate.mock.calls[0][1]).toEqual([]);
    expect(mockManipulate.mock.calls[0][2]).toMatchObject({ format: 'jpeg' }); // un PNG part quand même en JPEG
  });
  it('fichier encore trop lourd : paliers de réduction jusqu’à passer nettement sous la limite du stockage', async () => {
    let call = 0;
    mockManipulate.mockImplementation(async () => ({ uri: `file:///cache/out-${++call}.jpg`, width: 1600, height: 1200 }));
    // le premier fichier dépasse le poids visé, le deuxième passe
    mockFileBytes.mockImplementation(async (uri: string) => (uri.endsWith('out-1.jpg') ? fakeBigJpeg(COMMUNITY_TARGET_BYTES + 5000) : phoneJpeg()));
    const p = await prepareCommunityPhoto('file:///enorme.jpg', { width: 8064, height: 6048 });
    expect(mockManipulate).toHaveBeenCalledTimes(2);
    expect(mockManipulate.mock.calls[1][1]).toEqual([{ resize: { width: 1280 } }]);
    expect(mockManipulate.mock.calls[1][2].compress).toBeLessThan(mockManipulate.mock.calls[0][2].compress);
    expect(p.bytes.length).toBeLessThanOrEqual(COMMUNITY_TARGET_BYTES);
  });
  it('échecs nommés : image illisible, fichier vide, photo trop lourde → message traduit dans les 5 langues', async () => {
    mockManipulate.mockRejectedValueOnce(new Error('Could not load the image'));
    await expect(prepareCommunityPhoto('file:///x.heic')).rejects.toMatchObject({ code: 'unreadable' });
    mockManipulate.mockResolvedValue({ uri: 'file:///cache/out.jpg', width: 10, height: 10 });
    mockFileBytes.mockResolvedValueOnce(new Uint8Array(0));
    const empty = await prepareCommunityPhoto('file:///x.jpg', { width: 10, height: 10 }).catch((e) => e);
    expect(photoErrorKey(empty)).toBe('cm2.photo.unreadable');
    mockFileBytes.mockResolvedValue(fakeBigJpeg(COMMUNITY_MAX_BYTES + 10));
    const large = await prepareCommunityPhoto('file:///x.jpg', { width: 9000, height: 9000 }).catch((e) => e);
    expect(photoErrorKey(large)).toBe('cm2.photo.tooLarge');
    expect(photoErrorKey(new Error('autre'))).toBeNull();
    for (const lang of ['fr', 'en', 'es', 'de', 'it']) {
      for (const k of ['cm2.photo.unreadable', 'cm2.photo.tooLarge', 'cm2.photo.pickerFailed', 'cm2.photo.sendFailed', 'cm2.photo.anonBlocked', 'l2.sb.fileTooLarge', 'l2.sb.fileType', 'l2.sb.fileEmpty']) {
        expect(typeof DICTIONARIES[lang][k]).toBe('string');
      }
    }
  });
});

function fakeBigJpeg(size: number): Uint8Array {
  const out = new Uint8Array(size);
  out.set([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02]);
  out.set([0xff, 0xd9], size - 2);
  return out;
}

describe('iPhone : choix des photos', () => {
  it('ouvre le sélecteur sans demander l’accès à la photothèque, et transmet les dimensions', async () => {
    mockLaunch.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///a.jpg', fileName: 'IMG_1.HEIC', mimeType: 'image/heic', fileSize: 4_200_000, width: 4032, height: 3024 }] });
    const res = await io.pickPhotos(true);
    expect(mockRequestLibrary).not.toHaveBeenCalled();
    expect(res).toEqual([{ uri: 'file:///a.jpg', name: 'IMG_1.HEIC', mimeType: 'image/heic', size: 4_200_000, width: 4032, height: 3024 }]);
    expect(mockLaunch.mock.calls[0][0]).toMatchObject({ mediaTypes: ['images'], allowsMultipleSelection: true, exif: false });
  });
  it('annulation : liste vide ; refus du système : « denied » ; autre panne : erreur remontée (jamais avalée)', async () => {
    mockLaunch.mockResolvedValueOnce({ canceled: true, assets: null });
    expect(await io.pickPhotos(false)).toEqual([]);
    mockLaunch.mockRejectedValueOnce(new Error('Missing camera or camera roll permission'));
    expect(await io.pickPhotos(false)).toBe('denied');
    mockLaunch.mockRejectedValueOnce(new Error('Picker unavailable'));
    await expect(io.pickPhotos(false)).rejects.toThrow('Picker unavailable');
  });
});

describe('envoi dans le stockage « community »', () => {
  const migration = fs.readFileSync('supabase/migrations/20261022000100_community_v2.sql', 'utf8');
  const social = fs.readFileSync('supabase/migrations/20261023000100_community_social.sql', 'utf8');

  it('le chemin construit par l’application est exactement celui que la règle du stockage attend', () => {
    // règle d'envoi : premier dossier = identifiant de la personne connectée
    expect(migration).toMatch(/create policy "community upload" on storage\.objects for insert to authenticated\s+with check \(bucket_id = 'community' and split_part\(name, '\/', 1\) = auth\.uid\(\)::text\)/);
    const id = '0f0e0d0c-1111-4222-8333-444455556666';
    for (const kind of ['post', 'avatar', 'album'] as const) {
      const path = communityPhotoPath(USER, id, kind);
      expect(path.split('/')[0]).toBe(USER);
      expect(path.split('/')).toHaveLength(2);
      expect(path.endsWith('.jpg')).toBe(true);
    }
    // contraintes des tables qui référencent le fichier
    const postRule = /path text not null unique check \(path ~ '(\^\[0-9a-f-\]\{36\}\/\[A-Za-z0-9_\.-\]\{1,80\}\$)'\)/.exec(migration);
    const albumRule = /path text not null unique check \(path ~ '(\^\[0-9a-f-\]\{36\}\/album-\[A-Za-z0-9_\.-\]\{1,80\}\$)'\)/.exec(social);
    expect(postRule && albumRule).toBeTruthy();
    expect(new RegExp(postRule![1]).test(communityPhotoPath(USER, id))).toBe(true);
    expect(new RegExp(albumRule![1]).test(communityPhotoPath(USER, id, 'album'))).toBe(true);
  });
  it('type et poids acceptés par le stockage : JPEG seulement côté application, limite de 3 Mo respectée', () => {
    const bucket = /values \('community', 'community', false, (\d+), array\[([^\]]+)\]\)/.exec(migration);
    expect(bucket).toBeTruthy();
    expect(Number(bucket![1])).toBe(COMMUNITY_MAX_BYTES);
    expect(bucket![2]).toContain(`'${COMMUNITY_MIME}'`);
    expect(bucket![2]).not.toContain('heic');
    expect(COMMUNITY_TARGET_BYTES).toBeLessThanOrEqual(COMMUNITY_MAX_BYTES / 2);
  });
  it('envoie des octets JPEG avec le bon type, dans le dossier de la personne', async () => {
    mockUpload.mockResolvedValue(undefined);
    const bytes = stripJpegMetadata(phoneJpeg());
    const out = await uploadPhotos(USER, [{ uri: 'file:///a.heic', bytes, width: 1600, height: 1200 }]);
    expect(mockUpload).toHaveBeenCalledTimes(1);
    const [bucket, path, file] = mockUpload.mock.calls[0];
    expect(bucket).toBe('community');
    expect(path.startsWith(`${USER}/`)).toBe(true);
    expect(file).toMatchObject({ mimeType: 'image/jpeg', size: bytes.length });
    expect(file.bytes).toBe(bytes);
    expect(out).toEqual([{ path, width: 1600, height: 1200 }]);
  });
  it('tout ou rien : si une photo est refusée, celles déjà envoyées sont retirées et l’erreur remonte', async () => {
    const bytes = stripJpegMetadata(phoneJpeg());
    mockUpload.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('The object exceeded the maximum allowed size'));
    await expect(uploadPhotos(USER, [{ uri: 'a', bytes }, { uri: 'b', bytes }])).rejects.toThrow(/maximum allowed size/);
    expect(mockRemove).toHaveBeenCalledWith('community', [mockUpload.mock.calls[0][1]]);
  });
  it('fichier local sans octets préparés : lu par le système de fichiers, jamais par fetch(file://) ; vide = erreur', async () => {
    const realFetch = globalThis.fetch;
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      mockFileBytes.mockResolvedValueOnce(Uint8Array.from([1, 2, 3]));
      expect(Array.from(await uploadBody({ uri: 'file:///var/mobile/photo.jpg' }) as Uint8Array)).toEqual([1, 2, 3]);
      expect(fetchSpy).not.toHaveBeenCalled();
      mockFileBytes.mockResolvedValueOnce(new Uint8Array(0));
      await expect(uploadBody({ uri: 'file:///var/mobile/vide.jpg' })).rejects.toMatchObject({ code: 'file_empty' });
      const prepared = Uint8Array.from([9, 9]);
      expect(await uploadBody({ uri: 'file:///x.jpg', bytes: prepared })).toBe(prepared);
    } finally { globalThis.fetch = realFetch; }
  });
});
