/**
 * Réinstallation de l'appli : oublier la session restée dans le trousseau.
 *
 * Sur iPhone (et parfois Android), le trousseau où la session de connexion est rangée SURVIT à la suppression de
 * l'appli. Résultat : après « supprimer puis réinstaller », la personne se retrouve déjà connectée, et l'appli saute
 * la vidéo d'ouverture, le choix de la langue et les diapositives — comme si elle n'avait jamais été réinstallée.
 *
 * Règle : au tout premier démarrage après une installation, la session du trousseau est effacée ; après une simple
 * mise à jour, rien ne change. Pour distinguer les deux, on regarde le stockage ordinaire de l'appli (AsyncStorage),
 * lui bien effacé à la désinstallation :
 *   - le marqueur « installée » existe → démarrage habituel, on ne touche à rien ;
 *   - pas de marqueur mais les préférences de l'appli existent (clé `toietmoi.ui`) → c'est une mise à jour d'une
 *     installation déjà utilisée : on pose le marqueur et on garde la session ;
 *   - ni marqueur ni préférences → installation fraîche : la session du trousseau est effacée, puis le marqueur posé.
 * En cas de doute (stockage illisible), on garde la session : mieux vaut un écran de trop qu'une déconnexion surprise.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const INSTALL_MARKER = 'toietmoi.installed.v1';
export const UI_STORE_KEY = 'toietmoi.ui';

export type FreshInstallDecision = 'keep' | 'update' | 'fresh';

/** Décision pure (testée) à partir de ce que contient le stockage ordinaire. */
export function decideFreshInstall(marker: string | null, uiPrefs: string | null): FreshInstallDecision {
  if (marker) return 'keep';
  return uiPrefs ? 'update' : 'fresh';
}

let checked: Promise<FreshInstallDecision> | null = null;

/**
 * À appeler avant la première lecture de la session. `clearSession` efface la session du trousseau.
 * Une seule exécution par lancement.
 */
export function ensureFreshInstallHandled(clearSession: () => Promise<void>): Promise<FreshInstallDecision> {
  if (Platform.OS === 'web') return Promise.resolve('keep');
  if (!checked) {
    checked = (async () => {
      let decision: FreshInstallDecision = 'keep';
      try {
        const [marker, prefs] = await AsyncStorage.multiGet([INSTALL_MARKER, UI_STORE_KEY]);
        decision = decideFreshInstall(marker?.[1] ?? null, prefs?.[1] ?? null);
        if (decision === 'fresh') await clearSession();
        if (decision !== 'keep') await AsyncStorage.setItem(INSTALL_MARKER, new Date().toISOString());
      } catch {
        decision = 'keep';
      }
      return decision;
    })();
  }
  return checked;
}

/** Tests : rejouer la vérification comme à un nouveau lancement. */
export function resetFreshInstallForTests() { checked = null; }
