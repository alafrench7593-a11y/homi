/**
 * Accueil sans compte (HOMI, entrée Keynote) : le mot-symbole HOMI en en-tête, UN point focal (la lentille du logotype
 * sur le halo de la palette, révélée en profondeur), un titre, une phrase, UNE action principale (« Commencer »). Texte et boutons sont là dès la première
 * image : seule la scène s'anime. Options en boutons ronds (langue) ; l'aide reste nommée en toutes lettres.
 * Couleurs : thème uniquement.
 */
import React, { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { StatusBar } from 'expo-status-bar';
import { Button, Icon, IconButton, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { BrandWordmark } from '@/components/BrandLogo';
import { FocalMark } from '@/features/entry/EntryKit';
import { isDemo } from '@/lib/backend';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import { getLocale, t as tr } from '@/i18n';
import { localeInfo } from '@/i18n/locales';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  const win = useWindowDimensions();
  const t = useTheme();
  // Écran court (320×568) : le point focal se resserre pour garder les actions au premier écran
  const focal = Math.round(Math.max(150, Math.min(300, win.height - 470)));
  const [starting, setStarting] = useState(false);

  async function demo() {
    if (starting) return;
    setStarting(true);
    try {
      await startDemoWithoutAccount();
      router.replace('/(tabs)');
    } finally {
      setStarting(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: topInset + spacing.xs, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* En-tête : marque, langue (bouton rond), aide (toujours nommée) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: MIN_TOUCH }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <BrandWordmark height={22} testID="welcome-wordmark" />
          </View>
          <IconButton icon="globe" tone="filled" label={tr('welcome.language', { language: localeInfo(getLocale()).native })} onPress={() => router.push({ pathname: '/intro', params: { scene: 'start' } })} />
          <Tappable
            accessibilityRole="button"
            accessibilityLabel={tr('welcome.helpA11y')}
            onPress={() => router.push('/emergency')}
            style={({ pressed }) => ({ minHeight: MIN_TOUCH, paddingHorizontal: spacing.md, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: t.material.glass.inset.edge, backgroundColor: t.material.glass.inset.fill, opacity: pressed ? 0.8 : 1 })}
          >
            <Icon name="life-buoy" size={16} color={t.colors.heart} />
            <Text variant="small" weight="bold" numberOfLines={1}>{tr('welcome.help')}</Text>
          </Tappable>
        </View>

        {/* Point focal unique : la scène se révèle en profondeur */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: focal }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <FocalMark logo size={focal} />
        </View>

        {/* Titre, phrase et actions : disponibles immédiatement */}
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text variant="label" color={t.colors.primary} center>{tr('brand.tagline')}</Text>
          <Text center accessibilityRole="header" accessibilityLabel={tr('welcome.titleA11y')} maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.displayMedium, fontSize: 34, lineHeight: 40, letterSpacing: -1.2, color: t.colors.text }}>
            {tr('welcome.title1')}{'\n'}
            <Text maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.serifItalic, fontSize: 38, letterSpacing: -0.6, color: t.colors.primary }}>{tr('welcome.title2a')}</Text>{tr('welcome.title2b')}
          </Text>
          <Text center muted style={{ maxWidth: 340 }}>{tr('welcome.body')}</Text>
        </View>

        <View style={{ gap: spacing.xs, marginTop: spacing.lg, alignSelf: 'stretch' }}>
          <Button label={tr('welcome.start')} size="lg" icon="arrow-right" full onPress={() => router.push('/auth/sign-up')} testID="welcome-start" />
          <Button label={tr('welcome.haveAccount')} variant="ghost" full onPress={() => router.push('/auth/sign-in')} />
          <Button label={tr('welcome.demo')} variant="ghost" icon="eye" full loading={starting} onPress={demo} />
        </View>
        {isDemo ? <Text variant="caption" center muted style={{ marginTop: spacing.xs }}>{tr('demo.banner')}</Text> : null}
      </ScrollView>
    </View>
  );
}
