/** Composants transverses : sélecteur de profil, bouton « Poser une question », accès premium, urgences. */
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { useEmergencyResources, usePremium } from '@/lib/data/hooks';
import { isDemo } from '@/lib/backend';
import { getLocale, t as tr } from '@/i18n';
import { emergencyItems, useEmergencyRegion } from '@/lib/domain/emergencyNumbers';
import { Banner, Button, Card, haptic, Icon, Row, Text } from './ui';
import { useToast } from './Overlays';
import { Tappable } from '@/components/Tappable';

/** Sélecteur de profil : composant universel (src/components/ProfileSwitcher), ré-exporté pour les anciens imports. */
export { ProfileSwitcher } from './ProfileSwitcher';

/** Le bouton « Poser une question » accessible partout. */
export function AskFab({ bottom = 0 }: { bottom?: number }) {
  const t = useTheme();
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={tr('ask.button')}
      accessibilityHint={tr('u7.family.askHint')}
      onPress={() => { haptic('light'); router.push('/assistant/chat'); }}
      style={({ pressed }) => [styles.fab, { bottom: bottom + spacing.md, backgroundColor: t.colors.primary, opacity: pressed ? 0.9 : 1 }]}
    >
      <Icon name="message-circle" size={20} color={t.colors.primaryText} />
      <Text weight="medium" color={t.colors.primaryText}>{tr('ask.button')}</Text>
    </Tappable>
  );
}

/** Contenu réservé à l'abonnement. Les informations de sécurité ne passent JAMAIS par ce composant. */
export function PremiumGate({ children, feature }: { children: React.ReactNode; feature: string }) {
  const premium = usePremium();
  if (premium) return <>{children}</>;
  return (
    <Card tone="gold">
      <Row>
        <Icon name="star" size={18} />
        <Text weight="bold" style={{ flex: 1 }}>{feature}</Text>
      </Row>
      <Text variant="small" muted style={{ marginTop: 6 }}>{tr('u7.family.premiumNote')}</Text>
      <Button label={tr('u7.family.discover')} variant="secondary" size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />
    </Card>
  );
}

/** Numéros d'urgence — toujours gratuits, accessibles sans connexion internet une fois chargés. */
export function EmergencyList({ compact }: { compact?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const { data } = useEmergencyResources();
  const region = useEmergencyRegion();
  const all = emergencyItems(region, data, getLocale());
  const list = compact ? (region === 'FR' ? all.filter((r) => ['15', '112', '3114'].includes(r.phone)) : all.slice(0, 3)) : all;
  return (
    <View style={{ gap: spacing.xs }}>
      {list.map((r) => (
        <Tappable
          key={r.phone}
          accessibilityRole="button"
          accessibilityLabel={tr('u7.family.callA11y', { phone: r.phone.split('').join(' '), label: r.label })}
          onPress={() => { Linking.openURL(`tel:${r.phone}`).catch(() => toast(tr('u7.emergency.callFail', { phone: r.phone }), 'error')); }}
          style={({ pressed }) => [styles.emergency, { backgroundColor: t.colors.surface, borderColor: t.colors.border, opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.phone, { backgroundColor: t.colors.dangerSoft }]}>
            <Text weight="bold" color={t.colors.danger} style={{ fontSize: 20, lineHeight: 24 }}>{r.phone}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{r.label}</Text>
            {!compact && <Text variant="small" muted>{r.description}</Text>}
            {r.available ? <Text variant="caption" muted>{r.available}</Text> : null}
          </View>
          <Icon name="phone" size={18} color={t.colors.danger} />
        </Tappable>
      ))}
    </View>
  );
}


export function DemoBanner() {
  if (!isDemo) return null;
  return <Banner tone="demo" title={tr('u7.family.demoTitle')}>{tr('u7.family.demoBody')}</Banner>;
}

export function EmergencyShortcut() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={tr('u7.family.helpA11y')}
      onPress={() => router.push('/emergency')}
      hitSlop={8}
      style={{ position: 'absolute', top: topInset + 6, right: spacing.md, minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.dangerSoft }}
    >
      <Icon name="life-buoy" size={20} color={t.colors.danger} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, minHeight: 52, borderRadius: 14, shadowColor: '#0D0E11', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  emergency: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, minHeight: 64 },
  phone: { minWidth: 64, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
