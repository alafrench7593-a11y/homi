/**
 * Compléments du paywall (24/11/2026, demande de la propriétaire : présenter HOMI comme une vitrine, captures réelles,
 * FAQ, contact) :
 *  - `PaywallShowcase` : carrousel de VRAIES captures de l'application (démo, données fictives), une légende par écran ;
 *    défilement au doigt, aucune animation automatique (pas de boucle) ;
 *  - `PaywallFaq` : questions qui freinent l'achat (essai, annulation, co-parent, données, crédits Aura), réponses
 *    courtes et exactes ; dépliables ;
 *  - lien de contact vers l'adresse d'assistance officielle (`BRAND.supportEmail`).
 */
import React, { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Icon, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { Reveal } from '@/motion/Reveal';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const SHOTS = [
  { key: 'accueil', src: require('../../../assets/paywall/accueil.webp') },
  { key: 'biberon', src: require('../../../assets/paywall/biberon.webp') },
  { key: 'allaitement', src: require('../../../assets/paywall/allaitement.webp') },
  { key: 'croissance', src: require('../../../assets/paywall/croissance.webp') },
  { key: 'relais', src: require('../../../assets/paywall/relais-nuit.webp') },
  { key: 'aura', src: require('../../../assets/paywall/aura.webp') },
] as const;

const MIN_TOUCH = 44;

export function PaywallShowcase() {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const w = Math.min(190, Math.round(Math.min(width, 560) * 0.46));
  const h = Math.round(w * (1620 / 780));
  const [index, setIndex] = useState(0);
  return (
    <View style={{ gap: spacing.sm }} testID="fw-pw-showcase">
      <Text variant="heading" center accessibilityRole="header">{tr('pw3.show.title')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={w + spacing.sm} decelerationRate="fast"
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xs }}
        onScroll={(e) => setIndex(Math.max(0, Math.min(SHOTS.length - 1, Math.round(e.nativeEvent.contentOffset.x / (w + spacing.sm)))))} scrollEventThrottle={64}>
        {SHOTS.map((s) => (
          <View key={s.key} style={{ width: w, gap: spacing.xs }} accessible accessibilityRole="image" accessibilityLabel={tr(`pw3.show.${s.key}` as never)} testID={`fw-pw-shot-${s.key}`}>
            <View style={{ width: w, height: h, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: th.colors.border, backgroundColor: th.colors.surface }}>
              <Image source={s.src} style={{ width: w, height: h }} resizeMode="cover" accessibilityIgnoresInvertColors />
            </View>
            <Text variant="caption" center muted>{tr(`pw3.show.${s.key}` as never)}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SHOTS.map((s, i) => <View key={s.key} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? th.colors.text : th.colors.border }} />)}
      </View>
      <Text variant="caption" center muted>{tr('pw3.show.note')}</Text>
    </View>
  );
}

const FAQ = ['trial', 'cancel', 'coparent', 'data', 'credits'] as const;

export function PaywallFaq() {
  const th = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <View style={{ gap: spacing.xs }} testID="fw-pw-faq">
      <Text variant="heading" accessibilityRole="header">{tr('pw3.faq.title')}</Text>
      {FAQ.map((k) => {
        const on = open === k;
        return (
          <View key={k} style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: th.colors.border, backgroundColor: th.colors.surface }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: on }} onPress={() => setOpen(on ? null : k)} testID={`fw-pw-faq-${k}`}
              style={{ minHeight: MIN_TOUCH + 8, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
              <Text weight="medium" style={{ flex: 1 }}>{tr(`pw3.faq.${k}.q` as never)}</Text>
              <Icon name={on ? 'chevron-up' : 'chevron-down'} size={18} color={th.colors.textMuted} />
            </Pressable>
            <Reveal visible={on}>
              <Text variant="small" muted style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }} testID={`fw-pw-faq-${k}-a`}>{tr(`pw3.faq.${k}.a` as never)}</Text>
            </Reveal>
          </View>
        );
      })}
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`mailto:${BRAND.supportEmail}?subject=${encodeURIComponent(tr('pw3.contact.subject'))}`)} testID="fw-pw-contact"
        style={{ minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
        <Icon name="mail" size={16} color={th.colors.primary} />
        <Text variant="small" weight="bold" color={th.colors.primary}>{tr('pw3.contact.cta')}</Text>
      </Pressable>
    </View>
  );
}
