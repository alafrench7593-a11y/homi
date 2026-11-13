/**
 * Cadre arrondi des liens et petites actions (« des boutons pour tout, pas de texte cliquable nu ») : pilule de verre
 * au liseré prune (lilas en sombre), hauteur confortable. Couleurs du design system HOMI (DESIGN_SYSTEM.md).
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
    borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(28,27,32,0.14)',
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
  };
}
