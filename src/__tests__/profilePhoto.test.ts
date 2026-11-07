import { PROFILE_PHOTO_MAX_BYTES, PROFILE_PHOTO_SIDE, centerSquare, isOwnPhotoPath, profilePhotoPath } from '@/lib/domain/profilePhoto';
import { profilePhoto as fr } from '@/i18n/fr/profilePhoto';
import { profilePhoto as en } from '@/i18n/en/profilePhoto';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const F = '33333333-3333-4333-8333-333333333333';

describe('photo de profil', () => {
  it('chemin imposé <moi>/<uuid>.jpg (comme la base)', () => {
    expect(profilePhotoPath(ME, F)).toBe(`${ME}/${F}.jpg`);
    expect(() => profilePhotoPath('../x', F)).toThrow();
    expect(() => profilePhotoPath(ME, 'photo')).toThrow();
  });
  it('on ne supprime jamais le fichier de quelqu’un d’autre', () => {
    expect(isOwnPhotoPath(ME, `${ME}/${F}.jpg`)).toBe(true);
    expect(isOwnPhotoPath(ME, `${OTHER}/${F}.jpg`)).toBe(false);
    expect(isOwnPhotoPath(ME, `${ME}/../${OTHER}/${F}.jpg`)).toBe(false);
    expect(isOwnPhotoPath(ME, null)).toBe(false);
  });
  it('recadrage carré centré', () => {
    expect(centerSquare(1200, 800)).toEqual({ originX: 200, originY: 0, width: 800, height: 800 });
    expect(centerSquare(600, 900)).toEqual({ originX: 0, originY: 150, width: 600, height: 600 });
    expect(centerSquare(512, 512)).toEqual({ originX: 0, originY: 0, width: 512, height: 512 });
  });
  it('petite image légère (cohérent avec la limite du serveur, 2 Mo)', () => {
    expect(PROFILE_PHOTO_SIDE).toBeLessThanOrEqual(1024);
    expect(PROFILE_PHOTO_MAX_BYTES).toBeLessThanOrEqual(2097152);
  });
  it('textes FR et EN complets', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
    expect(fr['pphoto.privacy']).toMatch(/GPS/);
  });
});

import { childAvatarPath, isChildAvatarPath } from '@/lib/domain/profilePhoto';
const H = '44444444-4444-4444-8444-444444444444';
const K = '55555555-5555-4555-8555-555555555555';
describe('photo de profil d’un enfant', () => {
  it('chemin <foyer>/children/<enfant>/<uuid>.jpg', () => {
    expect(childAvatarPath(H, K, F)).toBe(`${H}/children/${K}/${F}.jpg`);
    expect(() => childAvatarPath(H, '../x', F)).toThrow();
  });
  it('n’efface que les photos de cet enfant (nouveau et ancien format)', () => {
    expect(isChildAvatarPath(H, K, `${H}/children/${K}/${F}.jpg`)).toBe(true);
    expect(isChildAvatarPath(H, K, `${H}/children/${K}.jpg`)).toBe(true);
    expect(isChildAvatarPath(H, K, `${H}/children/${ME}/${F}.jpg`)).toBe(false);
    expect(isChildAvatarPath(H, K, `${OTHER}/children/${K}/${F}.jpg`)).toBe(false);
    expect(isChildAvatarPath(H, K, null)).toBe(false);
  });
});
