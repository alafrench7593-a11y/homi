/**
 * Accueil sans compte (HOMI v5 « Lumière corail ») :
 *  - en tête, le logo HOMI PETIT (symbole + HOMI, encre / ivoire), la langue et l'aide (icône + libellé, sans capsule) ;
 *  - l'illustration `famille` sur le halo corail (taille fixe, se resserre sur petit écran), seule image de l'écran ;
 *  - un titre aéré, une phrase ;
 *  - hiérarchie des actions : « Commencer » (principal) → « J'ai déjà un compte » (secondaire sobre) →
 *    « Découvrir sans compte » (lien).
 * Les deux premiers boutons sans compte mènent au parcours /start (démo guidée par Aura AVANT tout compte, décision
 * de la propriétaire du 04/12/2026) ; la famille d'exemple reste accessible depuis le résultat de la démo (/start/sample).
 * Texte et boutons sont rendus dès la première image : seule l'illustration arrive en douceur.
 */
import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDemoInset } from '@/components/demoInset';
import { Button, Icon, IconButton, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { BrandWordmark } from '@/components/BrandLogo';
import { HeroArt, heroSize } from '@/features/entry/HeroArt';
import { isDemo } from '@/lib/backend';
import { prefetchDemoContent } from '@/lib/lazyContent';
import { getLocale, t as tr } from '@/i18n';
import { localeInfo } from '@/i18n/locales';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing, typography } from '@/theme/tokens';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  const win = useWindowDimensions();
  const t = useTheme();
  // Visite (ticket 1) : la démonstration se télécharge pendant la lecture de l'écran, au repos
  React.useEffect(() => { prefetchDemoContent(); }, []);
  const short = win.height < 640;
  // Illustration : la plus grande possible en gardant titre et trois actions au premier écran (320 × 568 compris)
  const art = heroSize(win, { max: 300, min: 132, reserve: short ? 420 : 500 });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: topInset + spacing.xs, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* En-tête : la marque (petite), la langue, l'aide — sans capsule */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, minHeight: MIN_TOUCH }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <BrandWordmark height={20} testID="welcome-wordmark" />
          </View>
          <IconButton icon="globe" label={tr('welcome.language', { language: localeInfo(getLocale()).native })} onPress={() => router.push({ pathname: '/intro', params: { scene: 'start' } })} testID="welcome-language" />
          <Tappable
            accessibilityRole="button"
            accessibilityLabel={tr('welcome.helpA11y')}
            onPress={() => router.push('/emergency')}
            testID="welcome-help"
            style={({ pressed }) => ({ minHeight: MIN_TOUCH, paddingHorizontal: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.6 : 1 })}
          >
            <Icon name="life-buoy" size={18} color={t.colors.text} />
            <Text variant="small" weight="bold" numberOfLines={1}>{tr('welcome.help')}</Text>
          </Tappable>
        </View>

        {/* L'illustration sur le halo corail : seul point focal */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: art + spacing.md, paddingTop: spacing.sm }}>
          <HeroArt name="famille" size={art} testID="welcome-hero" />
        </View>

        {/* Titre et phrase : disponibles immédiatement */}
        <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xs }}>
          <Text center accessibilityRole="header" maxFontSizeMultiplier={1.3} testID="welcome-title"
            style={[typography.display, { fontSize: short ? 28 : 34, lineHeight: short ? 34 : 40, color: t.colors.text, maxWidth: 340 }]}>
            {tr('e5.welcome.title')}
          </Text>
          <Text center muted style={{ maxWidth: 320 }}>{tr('e5.welcome.lead')}</Text>
        </View>

        {/* Une action principale, une secondaire sobre, un lien */}
        <View style={{ gap: spacing.xs, marginTop: short ? spacing.md : spacing.xl, alignSelf: 'stretch' }}>
          <Button label={tr('welcome.start')} size="lg" full onPress={() => router.push('/start?from=welcome_start' as never)} testID="welcome-start" />
          <Button label={tr('welcome.coparent')} icon="users" variant="secondary" size="lg" full onPress={() => router.push('/join' as never)} testID="welcome-coparent" />
          <Button label={tr('e5.welcome.haveAccount')} variant="secondary" size="lg" full onPress={() => router.push('/auth/sign-in')} testID="welcome-sign-in" />
          <Button label={tr('welcome.demo')} variant="ghost" full onPress={() => router.push('/start?from=welcome_demo' as never)} testID="welcome-demo" />
        </View>
        {isDemo ? <Text variant="caption" center muted style={{ marginTop: spacing.xs }}>{tr('demo.banner')}</Text> : null}
      </ScrollView>
    </View>
  );
}
