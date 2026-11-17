/**
 * Cartes de verre : `GlassCard`, `GlassToolCard`, et leurs squelettes (HOMI_DESIGN_SYSTEM.md § 10).
 *
 * RÈGLE : le verre `card` est réservé aux PETITES surfaces posées sur un fond vivant (photo, halo, illustration) :
 * une carte d'outil, un résumé de trois lignes. Une zone riche en texte (article, formulaire, liste de données) reste
 * une surface OPAQUE (`Card`, `ListGroup`) : on ne lit pas un paragraphe à travers une vitre.
 *
 * `GlassToolCard` : pictogramme, nom, description multi-lignes, pastille de profil, étoile de favori animée.
 * Au toucher : compression 0,97 (toute la carte, contenu compris) et OMBRE QUI ÉVOLUE — l'ombre de repos se fond dans
 * une ombre de contact (deux calques pré-ombrés, opacité animée : jamais d'ombre recalculée image par image).
 * L'étoile est un bouton FRÈRE de la carte (pas imbriqué) : deux cibles distinctes pour VoiceOver / TalkBack.
 */
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { radius as R, spacing } from '@/theme/tokens';
import { FavoriteStar, SkeletonBone, SkeletonPulse, usePress } from '@/motion';
import { t as tr } from '@/i18n';
import { Icon, Text, type IconName } from '../ui';
import { GlassMaterial, glassShadow, useGlass } from './Glass';

/** Deux calques d'ombre fondus selon la pression (0 = repos, 1 = enfoncé). */
function LiftShadow({ progress, radius }: { progress: ReturnType<typeof usePress>['progress']; radius: number }) {
  const { spec, tier } = useGlass('card');
  const rest = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const down = useAnimatedStyle(() => ({ opacity: progress.value }));
  if (!spec.shadow) return null;
  return (
    <>
      <Animated.View pointerEvents="none" testID="glass-shadow-rest" style={[StyleSheet.absoluteFill, { borderRadius: radius, boxShadow: glassShadow(spec, tier) }, rest]} />
      <Animated.View pointerEvents="none" testID="glass-shadow-pressed" style={[StyleSheet.absoluteFill, { borderRadius: radius, boxShadow: glassShadow(spec, tier, true) }, down]} />
    </>
  );
}

export interface GlassCardProps {
  children: React.ReactNode;
  /** Rend la carte pressable (compression + ombre qui évolue) */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  padded?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Petite surface de verre. Sans `onPress` : simple conteneur. */
export function GlassCard({ children, onPress, accessibilityLabel, accessibilityHint, padded = true, radius = R.lg, style, testID }: GlassCardProps) {
  const p = usePress({ disabled: !onPress, haptic: onPress ? 'light' : 'none' });
  const body = (
    <Animated.View style={[{ borderRadius: radius }, onPress ? null : style, p.style]}>
      <LiftShadow progress={p.progress} radius={radius} />
      <GlassMaterial variant="card" radius={radius} testID={testID ?? 'glass-card'} />
      <View style={padded ? { padding: spacing.md } : null}>{children}</View>
    </Animated.View>
  );
  if (!onPress) return <View testID={testID}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} pressRetentionOffset={16}
      onPressIn={p.onPressIn} onPressOut={p.onPressOut} onPress={onPress} testID={testID} style={style}>
      {body}
    </Pressable>
  );
}

export interface GlassToolCardProps {
  title: string;
  /** Description sur plusieurs lignes (3 au plus par défaut) */
  description?: string;
  /** Pictogramme Feather… */
  icon?: IconName;
  /** …ou un glyphe prêt (ex. `<ToolGlyph />`), prioritaire sur `icon` */
  glyph?: React.ReactNode;
  /** Pastille de profil (« Léa », « Grossesse », « Famille ») */
  profile?: string;
  /** Favori : `undefined` = pas d'étoile */
  favorite?: boolean;
  onToggleFavorite?: (next: boolean) => void;
  onPress: () => void;
  disabled?: boolean;
  descriptionLines?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const WELL = 44;

export function GlassToolCard({ title, description, icon, glyph, profile, favorite, onToggleFavorite, onPress, disabled, descriptionLines = 3, style, testID = 'glass-tool-card' }: GlassToolCardProps) {
  const { spec } = useGlass('card');
  const p = usePress({ disabled });
  const veil = useAnimatedStyle(() => ({ opacity: p.progress.value }));
  const star = favorite !== undefined && !!onToggleFavorite;
  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[title, description, profile].filter(Boolean).join('. ')}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        pressRetentionOffset={16}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        onPress={onPress}
        testID={testID}
      >
        <Animated.View testID={`${testID}-surface`} style={[{ borderRadius: R.lg }, p.style]}>
          <LiftShadow progress={p.progress} radius={R.lg} />
          <GlassMaterial variant="card" radius={R.lg} testID={testID} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: R.lg, backgroundColor: spec.press }, veil]} />
          <View style={[styles.tool, { opacity: disabled ? 0.45 : 1 }]}>
            <View style={styles.head}>
              {glyph ?? (
                <View style={[styles.well, { backgroundColor: spec.indicator, borderColor: spec.indicatorEdge }]}>
                  <Icon name={icon ?? 'grid'} size={22} color={spec.inks.accent} />
                </View>
              )}
              {/* place de l'étoile (bouton frère, posé par-dessus) */}
              {star ? <View style={{ width: 34, height: 34 }} /> : null}
            </View>
            <Text weight="bold" color={spec.inks.text} numberOfLines={2} style={styles.title}>{title}</Text>
            {description ? <Text variant="small" color={spec.inks.muted} numberOfLines={descriptionLines}>{description}</Text> : null}
            {profile ? (
              <View style={[styles.pill, { backgroundColor: spec.indicator, borderColor: spec.indicatorEdge }]}>
                <Icon name="user" size={12} color={spec.inks.muted} />
                <Text variant="caption" weight="medium" color={spec.inks.text} numberOfLines={1} style={{ flexShrink: 1 }}>{profile}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
      {star ? (
        <FavoriteStar active={!!favorite} onToggle={onToggleFavorite!} labelOn={tr('glass.fav.remove')} labelOff={tr('glass.fav.add')}
          color={spec.inks.muted} activeColor={spec.inks.accent} disabled={disabled} testID={`${testID}-star`} style={styles.star} />
      ) : null}
    </View>
  );
}

/** Squelette d'une `GlassToolCard` : même verre, mêmes proportions, os qui respirent. */
export function GlassToolCardSkeleton({ style, testID = 'glass-tool-card-skeleton' }: { style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <View testID={testID} style={[{ borderRadius: R.lg }, style]}>
      <GlassMaterial variant="card" radius={R.lg} testID={testID} />
      <SkeletonPulse label={tr('common.loadingA11y')} style={styles.tool}>
        <SkeletonBone width={WELL} height={WELL} radius={14} />
        <SkeletonBone width="62%" height={16} style={{ marginTop: 4 }} />
        <SkeletonBone width="100%" height={12} />
        <SkeletonBone width="78%" height={12} />
        <SkeletonBone width={72} height={22} radius={11} style={{ marginTop: 2 }} />
      </SkeletonPulse>
    </View>
  );
}

const styles = StyleSheet.create({
  tool: { padding: spacing.md, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  well: { width: WELL, height: WELL, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, minHeight: 24, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginTop: 4, maxWidth: '100%' },
  star: { position: 'absolute', top: spacing.sm, right: spacing.sm },
});
