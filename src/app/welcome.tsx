/** Accueil avant connexion : aurore liquide, verre, titre qui se dévoile ligne par ligne. */
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Appear } from '@/components/Appear';
import { Button, Icon, type IconName, Text } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import { BRAND } from '@/config/brand';
import { getLocale, t as tr } from '@/i18n';
import { localeInfo } from '@/i18n/locales';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { BrandLine, BrandLogo } from '@/components/BrandLogo';

function Sparkle({ color }: { color: string }) {
  return (
    <Svg width={16} height={18} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill={color} d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
    </Svg>
  );
}

const STATS: { icon: IconName; key: 'welcome.stat1' | 'welcome.stat2' | 'welcome.stat3' }[] = [
  { icon: 'moon', key: 'welcome.stat1' },
  { icon: 'life-buoy', key: 'welcome.stat2' },
  { icon: 'users', key: 'welcome.stat3' },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const narrow = useWindowDimensions().width < 360;
  const t = useTheme();
  const ink = t.colors.text;
  const muted = t.colors.textMuted;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg }}>
        {/* En-tête : logo + aide */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <Appear kind="scale" delay={0.08} style={{ flexShrink: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }} accessibilityRole="header" accessibilityLabel={BRAND.name}>
              <BrandLogo size={28} />
              {/* D-12 : à 320 px, le nom se raccourcit au lieu de pousser « Aide » hors de l'écran */}
              <Text weight="bold" numberOfLines={1} style={{ fontSize: 16, letterSpacing: -0.4, flexShrink: 1 }}>{BRAND.name}</Text>
            </View>
          </Appear>
          <Appear kind="scale" delay={0.3}>
            <Tappable accessibilityRole="button" accessibilityLabel={tr('welcome.language', { language: localeInfo(getLocale()).native })} onPress={() => router.push('/intro')} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: narrow ? 8 : 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}>
              <Icon name="globe" size={16} color={t.colors.text} />
              <Text variant="small" weight="medium" numberOfLines={1}>{narrow ? getLocale().toUpperCase() : localeInfo(getLocale()).native}</Text>
            </Tappable>
          </Appear>
          <Appear kind="scale" delay={0.34}>
            <Tappable accessibilityRole="button" accessibilityLabel={tr('welcome.helpA11y')} onPress={() => router.push('/emergency')} style={({ pressed }) => ({ minHeight: 40, paddingHorizontal: narrow ? 10 : 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: t.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.95)', backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', opacity: pressed ? 0.8 : 1 })}>
              <Icon name="life-buoy" size={16} color={t.colors.heart} />
              <Text variant="small" weight="medium" numberOfLines={1}>{tr('welcome.help')}</Text>
            </Tappable>
          </Appear>
        </View>

        {/* Illustration */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Appear kind="pop" delay={0.2} duration={1.3}>
            <View accessibilityRole="image" accessibilityLabel={BRAND.name}>
              <BrandLine size={260} />
            </View>
          </Appear>
        </View>

        {/* Texte principal, en bas et centré */}
        <View style={{ alignItems: 'center' }}>
          <Appear kind="pop" delay={0.22}>
            <LinearGradient colors={t.isDark ? ['rgba(231,192,143,0.45)', 'rgba(42,36,72,0.65)', 'rgba(31,35,68,0.75)'] : ['rgba(230,190,150,0.7)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.95)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, marginBottom: 18 }}>
              <Sparkle color={t.isDark ? '#FFFFFF' : '#87533F'} />
              <Text variant="small" color={ink}>{tr('brand.tagline')}</Text>
            </LinearGradient>
          </Appear>
          <View accessibilityRole="header" accessible accessibilityLabel={tr('welcome.titleA11y')}>
            <Appear kind="mask" delay={0.42}>
              <Text center style={{ fontFamily: fonts.displayMedium, fontSize: 38, lineHeight: 44, letterSpacing: -1.6, color: ink }}>
                {tr('welcome.title1')}
              </Text>
            </Appear>
            <Appear kind="mask" delay={0.62}>
              <Text center style={{ fontFamily: fonts.displayMedium, fontSize: 38, lineHeight: 46, letterSpacing: -1.6, color: ink }}>
                <Text style={{ fontFamily: fonts.serifItalic, fontSize: 43, letterSpacing: -0.8, color: t.isDark ? '#E7C08F' : '#9A5A48' }}>{tr('welcome.title2a')}</Text>{tr('welcome.title2b')}
              </Text>
            </Appear>
          </View>
          <Appear kind="soft" delay={0.82} duration={1.25}>
            <Text center color={muted} style={{ marginTop: 14, maxWidth: 330, fontSize: 15.5, lineHeight: 24 }}>
              {tr('welcome.body')}
            </Text>
          </Appear>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' }}>
            <Appear kind="btn" delay={0.96} style={{ flex: 1 }}>
              <Button label={tr('welcome.start')} onPress={() => router.push('/auth/sign-up')} full />
            </Appear>
            <Appear kind="side" delay={1.1} style={{ flex: 1 }}>
              <Button label={tr('welcome.haveAccount')} variant="secondary" onPress={() => router.push('/auth/sign-in')} full />
            </Appear>
          </View>
          <Appear kind="soft" delay={1.2} style={{ alignSelf: 'stretch', marginTop: 16 }}>
            <Button label={tr('welcome.demo')} variant="ghost" icon="eye" onPress={async () => { await startDemoWithoutAccount(); router.replace('/(tabs)'); }} full />
          </Appear>
        </View>

        {/* Repères en bas */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 26 }}>
          {STATS.map((s, i) => (
            <Appear key={s.key} kind="stat" delay={1.12 + i * 0.16} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)' }}>
                <Icon name={s.icon} size={15} color={ink} />
              </View>
              <Text variant="caption" center color={muted} style={{ minHeight: 34 }}>{tr(s.key)}</Text>
            </Appear>
          ))}
        </View>
        {isDemo && <Text variant="caption" center color={muted} style={{ marginTop: 4, minHeight: MIN_TOUCH / 2 }}>{tr('demo.banner')}</Text>}
      </View>
    </View>
  );
}
