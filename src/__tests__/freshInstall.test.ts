/**
 * Réinstallation sur iPhone : le trousseau garde la session, l'appli doit l'oublier au premier démarrage après une
 * installation fraîche, mais JAMAIS après une simple mise à jour ni à un démarrage habituel.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { decideFreshInstall, ensureFreshInstallHandled, INSTALL_MARKER, resetFreshInstallForTests, UI_STORE_KEY } from '@/lib/backend/freshInstall';

beforeEach(async () => { await AsyncStorage.clear(); resetFreshInstallForTests(); });

describe('décision', () => {
  it('marqueur présent → démarrage habituel', () => expect(decideFreshInstall('2026-11-04', null)).toBe('keep'));
  it('pas de marqueur, préférences présentes → mise à jour', () => expect(decideFreshInstall(null, '{"state":{}}')).toBe('update'));
  it('ni marqueur ni préférences → installation fraîche', () => expect(decideFreshInstall(null, null)).toBe('fresh'));
});

describe('au démarrage', () => {
  it('installation fraîche : la session du trousseau est effacée et le marqueur posé', async () => {
    const clear = jest.fn(async () => undefined);
    expect(await ensureFreshInstallHandled(clear)).toBe('fresh');
    expect(clear).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(INSTALL_MARKER)).toBeTruthy();
  });

  it('mise à jour d’une appli déjà utilisée : la session est gardée, le marqueur posé', async () => {
    await AsyncStorage.setItem(UI_STORE_KEY, '{"state":{"introSeen":true}}');
    const clear = jest.fn(async () => undefined);
    expect(await ensureFreshInstallHandled(clear)).toBe('update');
    expect(clear).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(INSTALL_MARKER)).toBeTruthy();
  });

  it('démarrage habituel : rien ne change', async () => {
    await AsyncStorage.setItem(INSTALL_MARKER, '2026-11-04T10:00:00.000Z');
    const clear = jest.fn(async () => undefined);
    expect(await ensureFreshInstallHandled(clear)).toBe('keep');
    expect(clear).not.toHaveBeenCalled();
  });

  it('une seule vérification par lancement, même si la session est lue plusieurs fois', async () => {
    const clear = jest.fn(async () => undefined);
    await Promise.all([ensureFreshInstallHandled(clear), ensureFreshInstallHandled(clear), ensureFreshInstallHandled(clear)]);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('stockage illisible : la session est gardée (jamais de déconnexion surprise)', async () => {
    const spy = jest.spyOn(AsyncStorage, 'multiGet').mockRejectedValueOnce(new Error('disque'));
    const clear = jest.fn(async () => undefined);
    expect(await ensureFreshInstallHandled(clear)).toBe('keep');
    expect(clear).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
