/**
 * Introduction immersive (première ouverture, rejouable depuis Réglages › Mon accueil).
 * Logo, lumière et profondeur, mission, fonctionnalités, tableau de bord, puis l'onboarding
 * (profil, enfants, famille, rappels). « Passer » est toujours visible : rien n'est bloquant.
 * Avec « réduire les animations », tout s'affiche directement.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Appear } from '@/components/Appear';
import { GlassSurface } from '@/components/Glass';
import { StaggerItem } from '@/components/Motion';
import { Button, haptic, Icon, type IconName, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { useUiStore } from '@/lib/store';
import { duration, easing, timeTo } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NACRE, NATIVE_DRIVER, radius, spacing } from '@/theme/tokens';

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'activity', label: 'Suivi quotidien' }, { icon: 'coffee', label: 'Biberons et repas' }, { icon: 'moon', label: 'Sommeil' },
  { icon: 'wind', label: 'Changes et digestion' }, { icon: 'smile', label: 'Dents' }, { icon: 'trending-up', label: 'Croissance' },
  { icon: 'star', label: 'Souvenirs' }, { icon: 'calendar', label: 'Rendez-vous' }, { icon: 'alert-circle', label: 'Allergies' },
  { icon: 'maximize', label: 'Scanner de produits' }, { icon: 'grid', label: 'Calendrier familial' }, { icon: 'sun', label: 'Après la naissance' },
];

const SLIDES = ['logo', 'mission', 'features', 'dashboard', 'next'] as const;

export default function Intro() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const [i, setI] = useState(0);
  const v = useRef(new Animated.Value(1)).current;
  const dir = useRef(1);
  const glow = useRef(new Animated.Value(0)).current;

  // Lumière qui « respire » derrière le logo (désactivée si animations réduites)
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(glow, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow, reduce]);

  function go(n: number) {
    if (n < 0 || n >= SLIDES.length) return;
    haptic('selection');
    dir.current = n > i ? 1 : -1;
    v.setValue(0);
    setI(n);
    timeTo(v, 1, duration.slow, reduce, easing.decelerate).start();
  }
  function finish() {
    setIntroSeen(true);
    router.replace('/');
  }

  const slide = SLIDES[i];
  const enter = { opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [24 * dir.current, 0] }) }] };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
        <View accessibilityRole="progressbar" accessibilityLabel={`Étape ${i + 1} sur ${SLIDES.length}`} style={{ flexDirection: 'row', gap: 6 }}>
          {SLIDES.map((s, k) => <View key={s} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: k <= i ? t.colors.primary : t.colors.border }} />)}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Passer l’introduction" onPress={finish} style={{ minHeight: 44, paddingHorizontal: spacing.sm, justifyContent: 'center' }}>
          <Text weight="bold" color={t.colors.primary}>Passer</Text>
        </Pressable>
      </View>

      <Animated.View key={slide} style={[{ flex: 1, justifyContent: 'center', gap: spacing.md }, enter]}>
        {slide === 'logo' ? (
          <View style={{ alignItems: 'center', gap: spacing.lg }}>
            <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }}>
                <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 100, opacity: 0.45 }} />
              </Animated.View>
              <Appear kind="pop" delay={0.15} duration={1.2}>
                <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 84, height: 84, borderRadius: 26, transform: [{ rotate: '-30deg' }] }} />
              </Appear>
            </View>
            <Appear kind="mask" delay={0.5}><Text variant="title" center accessibilityRole="header">{BRAND.name}</Text></Appear>
            <Appear kind="soft" delay={0.75}><Text center muted>De la grossesse aux 10 ans de votre enfant.</Text></Appear>
          </View>
        ) : null}

        {slide === 'mission' ? (
          <View style={{ gap: spacing.md }}>
            <Appear kind="mask" delay={0.05}><Text variant="title" accessibilityRole="header">Prendre soin de votre enfant, et de vous.</Text></Appear>
            <Appear kind="soft" delay={0.3}><Text>Suivre le quotidien, garder les souvenirs, partager la charge à deux, et trouver du soutien quand c’est dur. Sans jugement, sans diagnostic.</Text></Appear>
            <Appear kind="soft" delay={0.5}>
              <GlassSurface fill={t.colors.surface} depth={2} padded={spacing.md}>
                <Text variant="small">Vos données de santé restent privées par défaut. Vous choisissez ce que votre famille voit.</Text>
              </GlassSurface>
            </Appear>
          </View>
        ) : null}

        {slide === 'features' ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="title" accessibilityRole="header">Tout au même endroit</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {FEATURES.map((f, k) => (
                <StaggerItem key={f.label} index={k} style={{ width: '48.5%' }}>
                  <GlassSurface fill={t.colors.surface} depth={1} radius={radius.md} padded={spacing.sm} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52 }}>
                    <Icon name={f.icon} size={18} color={t.colors.primary} />
                    <Text variant="small" weight="medium" style={{ flex: 1 }}>{f.label}</Text>
                  </GlassSurface>
                </StaggerItem>
              ))}
            </View>
          </View>
        ) : null}

        {slide === 'dashboard' ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="title" accessibilityRole="header">Votre tableau de bord</Text>
            <Text muted>L’essentiel de la journée en un coup d’œil : dernier biberon, sommeil, rendez-vous, demandes de relais. Vous choisissez l’ordre des cartes.</Text>
            {/* Aperçu illustratif : des formes, aucune donnée inventée */}
            <View accessible accessibilityLabel="Aperçu illustratif du tableau de bord, sans données" style={{ gap: spacing.xs }}>
              {[0.9, 0.6, 0.75].map((w, k) => (
                <StaggerItem key={k} index={k}>
                  <GlassSurface fill={t.colors.surface} depth={k === 0 ? 2 : 1} padded={spacing.md} style={{ gap: 8 }}>
                    <View style={{ width: `${w * 60}%`, height: 10, borderRadius: 5, backgroundColor: t.colors.border }} />
                    <View style={{ width: `${w * 100}%`, height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceAlt }} />
                  </GlassSurface>
                </StaggerItem>
              ))}
            </View>
            <Text variant="caption" muted>Aperçu illustratif : vos vraies informations apparaîtront ici.</Text>
          </View>
        ) : null}

        {slide === 'next' ? (
          <View style={{ gap: spacing.md }}>
            <Text variant="title" accessibilityRole="header">Ensuite, deux minutes</Text>
            {[['user', 'Votre profil et votre parcours'], ['smile', 'Le profil de votre enfant'], ['users', 'Votre famille, si vous le souhaitez'], ['bell', 'Les rappels et modules utiles']].map(([icon, label], k) => (
              <StaggerItem key={label} index={k}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <Icon name={icon as IconName} color={t.colors.primary} />
                  <Text style={{ flex: 1 }}>{label}</Text>
                </View>
              </StaggerItem>
            ))}
            <Text variant="small" muted>Tout est facultatif et modifiable plus tard.</Text>
          </View>
        ) : null}
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {i > 0 ? <Button label="Retour" variant="secondary" onPress={() => go(i - 1)} style={{ flex: 1 }} /> : null}
        <Button label={i === SLIDES.length - 1 ? 'Commencer' : 'Suivant'} icon={i === SLIDES.length - 1 ? 'arrow-right' : undefined} onPress={() => (i === SLIDES.length - 1 ? finish() : go(i + 1))} style={{ flex: 2 }} />
      </View>
    </View>
  );
}
