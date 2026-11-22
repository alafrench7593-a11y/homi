/**
 * `Glass` — le matériau « Liquid Glass » de HOMI (HOMI_DESIGN_SYSTEM.md § 10). Trois niveaux, choisis à l'exécution :
 *
 *  1. `native` — verre d'iOS 26 (`expo-glass-effect` 57 : `GlassView`, après `isLiquidGlassAvailable()` ET
 *     `isGlassEffectAPIAvailable()`, voir `surfaces/nativeGlass.ts`) ;
 *  2. `blur`   — flou RÉEL (`expo-blur` : UIVisualEffectView sur iOS < 26, `backdrop-filter` sur le web) + voile de
 *     contraste teinté par la palette + liseré clair + reflet discret ;
 *  3. `opaque` — surface du thème, même forme, quand « Réduire la transparence » est activé, en mode nuit (soins de
 *     nuit : rien ne brille) et là où le flou n'existe pas (Android sans cible de flou, voir `GlassBlurTarget`).
 *
 * Jamais un simple fond blanc translucide présenté comme du verre : sans flou, la surface est opaque.
 *
 * Variantes (`src/theme/glass.ts`) : `chrome` (barres, boutons flottants, recherche, menus), `sheet` (feuille, fenêtre
 * modale), `card` (PETITES surfaces uniquement). Une zone riche en texte reste une surface opaque (`Card`, `Surface`).
 *
 * Le matériau est une SOUS-COUCHE (`GlassMaterial`, position absolue, sans interaction) : le contenu est posé
 * au-dessus, dans le flux normal — même mise en page aux trois niveaux. Ne jamais animer l'opacité d'un ancêtre d'un
 * verre (le flou et le verre natif se figent ou disparaissent) : animer transform, ou fondre un calque frère.
 */
import React, { createContext, useContext } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius as R } from '@/theme/tokens';
import { glassSpec, resolveGlassTier, type GlassSpec, type GlassTier, type GlassVariant } from '@/theme/glass';
import { BLUR_OK, LIQUID_GLASS_NATIVE, NativeGlass, useReduceTransparency } from '../surfaces/nativeGlass';
import { GlassRim } from './GlassRim';
import { LiquidLensMaterial } from './liquid/LiquidLens';
import { useLensStore } from './liquid/store';

/** Niveau imposé à tout un sous-arbre (galerie de QA, tests). L'accessibilité garde la priorité. */
const GlassTierContext = createContext<GlassTier | null>(null);
export const GlassTierProvider = GlassTierContext.Provider;

/**
 * Android : `expo-blur` 57 ne floute qu'une CIBLE déclarée (`BlurTargetView`), sur Android 12+. L'écran qui veut du
 * verre flouté enveloppe son contenu dans un `BlurTargetView` et publie sa ref ici ; sans elle, le verre est opaque.
 */
const GlassBlurTargetContext = createContext<React.RefObject<View | null> | null>(null);
export const GlassBlurTarget = GlassBlurTargetContext.Provider;

const ANDROID_BLUR_API = 31;

/** Niveau de verre réellement rendu ici (réglages d'accessibilité, thème, plateforme, niveau imposé). */
export function useGlassTier(forced?: GlassTier | null): GlassTier {
  const t = useTheme();
  const reduceTransparency = useReduceTransparency();
  const inherited = useContext(GlassTierContext);
  const target = useContext(GlassBlurTargetContext);
  const blur = BLUR_OK || (Platform.OS === 'android' && !!target && Number(Platform.Version) >= ANDROID_BLUR_API);
  return resolveGlassTier({ reduceTransparency, night: t.name === 'night', nativeGlass: LIQUID_GLASS_NATIVE, blur, forced: forced ?? inherited });
}

/** Jetons du verre pour le thème affiché + niveau rendu. */
export function useGlass(variant: GlassVariant = 'chrome', forced?: GlassTier | null): { spec: GlassSpec; tier: GlassTier } {
  const t = useTheme();
  return { spec: glassSpec(t, variant), tier: useGlassTier(forced) };
}

const cornerOf = (radius: number, edges: 'all' | 'top'): ViewStyle =>
  (edges === 'top' ? { borderTopLeftRadius: radius, borderTopRightRadius: radius } : { borderRadius: radius });

export interface GlassMaterialProps {
  variant?: GlassVariant;
  radius?: number;
  /** `top` : panneau du bas (coins supérieurs seulement, pas de liseré en bas) */
  edges?: 'all' | 'top';
  /** Reflet discret en haut (niveau `blur`) */
  reflet?: boolean;
  tier?: GlassTier | null;
  testID?: string;
}

/** Sous-couche de verre : à poser en premier enfant d'un conteneur à coins arrondis (elle le remplit). */
export function GlassMaterial({ variant = 'chrome', radius = R.xl, edges = 'all', reflet = true, tier: forced, testID = 'glass' }: GlassMaterialProps) {
  const { spec, tier } = useGlass(variant, forced);
  const lens = useLensStore((st) => st.params);
  // Verre LIQUIDE PARTOUT (rendu validé le 22/11/2026) : il remplace le niveau « flou » (web, iOS < 26), avec les
  // réglages du laboratoire. Barres, boutons, recherche, sélecteurs, feuilles, menus : lentille complète (réfraction).
  // Cartes de contenu (`card`) : même lèvre, reflet et ombre, sur la surface du thème (lisibilité des textes), sans
  // filtre de réfraction. Inchangés : verre natif iOS 26 (déjà le Liquid Glass d'Apple) et opaque (Réduire la
  // transparence, nuit, niveau imposé).
  const liquid = tier === 'blur';
  const corner = cornerOf(radius, edges);
  const open = edges === 'top' ? { borderBottomWidth: 0 } : null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      testID={`${testID}-material`} style={[StyleSheet.absoluteFill, corner, styles.clip]}>
      {liquid ? (
        <LiquidLensMaterial radius={radius} params={lens} edges={edges} testID={`${testID}-liquid`}
          refract={variant !== 'card'} fill={variant === 'card' ? spec.veil : undefined} />
      ) : tier === 'native' && NativeGlass ? (
        <NativeGlass testID={`${testID}-native`} style={[StyleSheet.absoluteFill, corner]} glassEffectStyle={spec.nativeStyle} tintColor={spec.nativeTint} colorScheme={spec.colorScheme} />
      ) : (
        <>
          <View testID={`${testID}-opaque`} style={[StyleSheet.absoluteFill, corner, open, { backgroundColor: spec.opaque, borderWidth: StyleSheet.hairlineWidth, borderColor: spec.opaqueEdge }]} />
          {edges === 'all' ? <GlassRim radius={radius} strength={0.6} /> : null}
        </>
      )}
    </View>
  );
}

export interface GlassProps extends Omit<ViewProps, 'style'>, Omit<GlassMaterialProps, 'testID'> {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Style du contenu (marges intérieures…) : le contenu est alors enveloppé */
  contentStyle?: StyleProp<ViewStyle>;
  /** Ombre portée du verre (aucune la nuit) */
  shadow?: boolean;
}

/** Ombre d'un verre + contour extérieur très fin (détache le verre d'un fond de même clarté). */
export function glassShadow(spec: GlassSpec, tier: GlassTier, pressed = false) {
  const base = (pressed ? spec.shadowPressed : spec.shadow) ?? [];
  if (!base.length) return undefined;
  return tier === 'blur' ? [...base, { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: StyleSheet.hairlineWidth, color: spec.outline }] : base;
}

/** Surface de verre : sous-couche + contenu. */
export function Glass({ variant = 'chrome', radius = R.xl, edges = 'all', reflet, tier: forced, children, style, contentStyle, shadow = true, testID, ...rest }: GlassProps) {
  const { spec, tier } = useGlass(variant, forced);
  return (
    <View testID={testID} {...rest} style={[cornerOf(radius, edges), shadow ? { boxShadow: glassShadow(spec, tier) } : null, style]}>
      <GlassMaterial variant={variant} radius={radius} edges={edges} reflet={reflet} tier={forced} testID={testID} />
      {contentStyle ? <View style={contentStyle}>{children}</View> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  reflet: { position: 'absolute', top: 0, left: 0, right: 0, height: '58%' },
});
