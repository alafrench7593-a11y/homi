/**
 * Applique la langue choisie à toute l'application :
 *  - au premier lancement, propose la langue du téléphone (si disponible) sans l'enregistrer comme choix ;
 *  - au changement, re-rend toute l'interface (clé de montage) SANS toucher aux données ni à la session ;
 *  - sens d'écriture : `dir` du document sur le web ; I18nManager sur téléphone (droite-à-gauche prêt
 *    pour l'arabe, l'hébreu et le persan, appliqué au prochain lancement comme l'exige React Native) ;
 *  - mémorise la langue dans le profil (colonne `locale`) quand une session existe.
 */
import React, { useEffect, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { router } from 'expo-router';
import { useUiStore } from '@/lib/store';
import { initialLocale, isRTL, getLocale, onLocaleChange, setLocale, syncDocumentLang } from './index';

let restorePath: string | null = null;
/** À appeler juste avant de changer de langue : l'écran courant sera rouvert après le re-rendu. */
export function returnHereAfterLocaleChange(path: string) { restorePath = path; }

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const saved = useUiStore((s) => s.locale);
  const [locale, setLoc] = useState(() => { setLocale(initialLocale(saved)); return getLocale(); });
  useEffect(() => onLocaleChange((code) => {
    setLoc(code);
    // l'interface est remontée : on revient à l'écran d'où la langue a été changée
    const back = restorePath;
    restorePath = null;
    if (back) setTimeout(() => { try { router.replace(back as never); } catch { /* écran indisponible */ } }, 0);
  }), []);
  useEffect(() => { setLocale(initialLocale(saved)); syncDocumentLang(); }, [saved]);
  useEffect(() => {
    const rtl = isRTL();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    } else if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  }, [locale]);
  return <React.Fragment key={locale}>{children}</React.Fragment>;
}

/** Re-rendu d'un composant au changement de langue (pour les composants hors de l'arbre remonté). */
export function useLocale() {
  const [locale, setLoc] = useState(getLocale());
  useEffect(() => onLocaleChange(setLoc), []);
  return locale;
}
