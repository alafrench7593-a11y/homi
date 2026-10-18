/** Accueil avant connexion : aurore liquide, verre, titre qui se dévoile ligne par ligne. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Appear } from '@/components/Appear';
import { FetusArt } from '@/components/FetusArt';
import { WeeksRing } from '@/components/DayClock';
import { Button, Icon, type IconName, Text } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import { BRAND } from '@/config/brand';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, NACRE, spacing } from '@/theme/tokens';

function Sparkle({ color }: { color: string }) {
  return (
    <Svg width={16} height={18} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill={color} d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
    </Svg>
  );
}

const STATS: { icon: IconName; label: string }[] = [
  { icon: 'moon', label: '38 semaines illustrées' },
  { icon: 'life-buoy', label: 'Urgences toujours gratuites' },
  { icon: 'users', label: 'À vivre à deux' },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const ink = t.colors.text;
  const muted = t.colors.textMuted;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg }}>
        {/* En-tête : logo + aide */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Appear kind="scale" delay={0.08}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }} accessibilityRole="header" accessibilityLabel={BRAND.name}>
              <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 24, height: 24, borderRadius: 8, transform: [{ rotate: '-30deg' }] }} />
              <Text weight="bold" style={{ fontSize: 16, letterSpacing: -0.4 }}>{BRAND.name}</Text>
            </View>
          </Appear>
          <Appear kind="scale" delay={0.34}>
            <Pressable accessibilityRole="button" accessibilityLabel="Besoin d’aide maintenant" onPress={() => router.push('/emergency')} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: t.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.95)', backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', opacity: pressed ? 0.8 : 1 })}>
              <Icon name="life-buoy" size={16} color={t.colors.heart} />
              <Text variant="small" weight="medium">Aide</Text>
            </Pressable>
          </Appear>
        </View>

        {/* Illustration */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Appear kind="pop" delay={0.2} duration={1.3}>
            <WeeksRing week={24} size={236}>
              <FetusArt week={24} growth={0.55} size={176} interactive={false} accessibilityLabel="Illustration artistique d’un bébé à 24 semaines, pas une échographie" />
            </WeeksRing>
          </Appear>
        </View>

        {/* Texte principal, en bas et centré */}
        <View style={{ alignItems: 'center' }}>
          <Appear kind="pop" delay={0.22}>
            <LinearGradient colors={t.isDark ? ['rgba(255,170,200,0.55)', 'rgba(60,30,70,0.6)', 'rgba(20,10,28,0.7)'] : ['rgba(255,170,200,0.65)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.95)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, marginBottom: 18 }}>
              <Sparkle color={t.isDark ? '#FFFFFF' : '#E9587C'} />
              <Text variant="small" color={ink}>{BRAND.tagline}</Text>
            </LinearGradient>
          </Appear>
          <View accessibilityRole="header" accessible accessibilityLabel="Vivez chaque étape, ensemble et en douceur.">
            <Appear kind="mask" delay={0.42}>
              <Text center style={{ fontFamily: fonts.displayMedium, fontSize: 38, lineHeight: 44, letterSpacing: -1.6, color: ink }}>
                Vivez chaque étape,
              </Text>
            </Appear>
            <Appear kind="mask" delay={0.62}>
              <Text center style={{ fontFamily: fonts.displayMedium, fontSize: 38, lineHeight: 46, letterSpacing: -1.6, color: ink }}>
                <Text style={{ fontFamily: fonts.serifItalic, fontSize: 43, letterSpacing: -0.8, color: t.isDark ? '#FFB3C8' : '#D9507A' }}>ensemble</Text> et en douceur.
              </Text>
            </Appear>
          </View>
          <Appear kind="soft" delay={0.82} duration={1.25}>
            <Text center color={muted} style={{ marginTop: 14, maxWidth: 330, fontSize: 15.5, lineHeight: 24 }}>
              Grossesse, naissance, premiers mois et enfance : une seule application qui grandit avec votre famille.
            </Text>
          </Appear>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' }}>
            <Appear kind="btn" delay={0.96} style={{ flex: 1 }}>
              <Button label="Commencer" onPress={() => router.push('/auth/sign-up')} full />
            </Appear>
            <Appear kind="side" delay={1.1} style={{ flex: 1 }}>
              <Button label="J’ai un compte" variant="secondary" onPress={() => router.push('/auth/sign-in')} full />
            </Appear>
          </View>
          <Appear kind="soft" delay={1.2} style={{ alignSelf: 'stretch' }}>
            <Button label="Découvrir sans compte" variant="ghost" icon="eye" onPress={async () => { await startDemoWithoutAccount(); router.replace('/(tabs)'); }} full />
          </Appear>
        </View>

        {/* Repères en bas */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 26 }}>
          {STATS.map((s, i) => (
            <Appear key={s.label} kind="stat" delay={1.12 + i * 0.16} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)' }}>
                <Icon name={s.icon} size={15} color={ink} />
              </View>
              <Text variant="caption" center color={muted} style={{ minHeight: 34 }}>{s.label}</Text>
            </Appear>
          ))}
        </View>
        {isDemo && <Text variant="caption" center color={muted} style={{ marginTop: 4, minHeight: MIN_TOUCH / 2 }}>Mode démonstration : les données restent sur cet appareil.</Text>}
      </View>
    </View>
  );
}
