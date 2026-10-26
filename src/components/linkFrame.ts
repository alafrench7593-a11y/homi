/**
 * Cadre arrondi des liens et petites actions (refonte du 26/10/2026 : « des boutons pour tout, pas de texte
 * cliquable nu ») : pilule en verre clair, liseré champagne, hauteur confortable.
 */
import type { ViewStyle } from 'react-native';

export function linkFrame(isDark: boolean): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(240,217,207,0.22)' : 'rgba(184,134,90,0.30)',
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,250,246,0.72)',
  };
}
