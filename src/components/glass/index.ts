/**
 * Bibliothèque « Liquid Glass » HOMI (HOMI_DESIGN_SYSTEM.md § 10) — un seul point d'entrée :
 *   import { Glass, GlassButton, GlassTabBar, GlassToolCard, GlassSheet } from '@/components/glass';
 * Le mouvement vient de `@/motion` (pression, indicateur, favori, secousse, coche, squelettes, glisser-déposer).
 */
export { Glass, GlassBlurTarget, GlassMaterial, glassShadow, GlassTierProvider, useGlass, useGlassTier, type GlassMaterialProps, type GlassProps } from './Glass';
export { GlassButton, glassButtonColors, GlassFab, GlassIconButton, type GlassButtonProps, type GlassButtonSize, type GlassButtonState, type GlassButtonVariant } from './GlassButton';
export { GlassCard, GlassToolCard, GlassToolCardSkeleton, type GlassCardProps, type GlassToolCardProps } from './GlassCard';
export {
  GLASS_PROFILE, GLASS_TAB_BAR, GlassProfileSwitcher, GlassSegmentedControl, GlassTabBar,
  type GlassProfile, type GlassSegment, type GlassTab, type GlassTabBarProps,
} from './GlassNavigation';
export { GLASS_SEARCH, GlassSearchBar, type GlassSearchBarProps } from './GlassSearchBar';
export {
  GLASS_MENU, GLASS_TOAST, GlassMenu, GlassModal, GlassSheet, GlassToast, GlassToastProvider, menuPosition, useMenuAnchor,
  type GlassMenuItem, type GlassModalAction, type MenuAnchor,
} from './GlassOverlays';
export { glassSpec, resolveGlassTier, type GlassSpec, type GlassTier, type GlassVariant } from '@/theme/glass';
