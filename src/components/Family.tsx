/** Composants transverses : sélecteur de profil, bouton « Poser une question », accès premium, urgences. */
import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { useActivePregnancy, useActiveSubject, useEmergencyResources, useExpectedBabies, useJourneyState, usePremium, useTrackedChildren } from '@/lib/data/hooks';
import { childAge, initials } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { isDemo } from '@/lib/backend';
import { t as tr, type TKey } from '@/i18n';
import { Banner, Button, Card, haptic, Icon, type IconName, Row, Text } from './ui';
import { initialsColor } from './Illustrations';
import { Sheet, useToast } from './Overlays';
import { Tappable } from '@/components/Tappable';

function Avatar({ label, color, icon, size = 40 }: { label?: string; color: string; icon?: IconName; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      {icon ? <Icon name={icon} size={size * 0.45} color="#2B2433" /> : <Text weight="bold" color="#2B2433" variant="small">{label}</Text>}
    </View>
  );
}

/** Passer d'une grossesse à un enfant, d'un enfant à l'autre, au profil familial ou à « Moi ». */
export function ProfileSwitcher() {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const { subject, setSubject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const js = useJourneyState();
  const { data: babies } = useExpectedBabies(pregnancy?.id);

  const items: { key: string; label: string; sub: string; avatar: React.ReactNode; active: boolean; onPress: () => void }[] = [];
  // Ordre : Moi, Ma grossesse, chaque enfant (prénom seul), la famille ; puis « Ajouter un profil »
  items.push({ key: 'me', label: tr('pj.subject.me'), sub: js.body && js.body.type !== 'pregnancy' ? tr(`pj.type.${js.body.type}` as TKey) : tr('pj.subject.meSub'), avatar: <Avatar color="#F3D9D3" icon="heart" />, active: subject.type === 'me', onPress: () => setSubject({ type: 'me' }) });
  if (pregnancy) {
    const p = pregnancyProgress(pregnancy.due_date);
    const names = babies?.map((b) => b.nickname).filter(Boolean).join(' · ');
    items.push({
      key: 'preg', label: tr('pj.subject.pregnancy'), sub: `${names ? `${names} · ` : ''}${p.label}`,
      avatar: <Avatar color="#E8D9B8" icon="moon" />, active: subject.type === 'pregnancy',
      onPress: () => setSubject({ type: 'pregnancy', id: pregnancy.id }),
    });
  }
  for (const c of children ?? []) {
    const baby = js.childType(c.id) === 'baby';
    items.push({
      key: c.id, label: c.first_name, sub: `${tr(baby ? 'pj.kind.baby' : 'pj.kind.child')} · ${childAge(c.birth_date).label}`,
      avatar: <Avatar label={initials(c.first_name)} color={initialsColor(c.id)} />, active: subject.type === 'child' && subject.id === c.id,
      onPress: () => setSubject({ type: 'child', id: c.id }),
    });
  }
  if ((children?.length ?? 0) + (pregnancy ? 1 : 0) > 1) {
    items.push({ key: 'family', label: tr('pj.subject.family'), sub: tr('pj.subject.familySub'), avatar: <Avatar color="#D6CEF0" icon="users" />, active: subject.type === 'family', onPress: () => setSubject({ type: 'family' }) });
  }
  const current = items.find((i) => i.active) ?? items[0];
  const others = items.filter((i) => i !== current).slice(0, 3);

  return (
    <>
      <Tappable
        accessibilityRole="button"
        testID="profile-switcher"
        accessibilityLabel={tr('pj.switcher.a11y', { name: current.label })}
        onPress={() => { haptic('selection'); setOpen(true); }}
        style={({ pressed }) => [styles.switcher, { backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderColor: t.colors.border }]}
      >
        <View style={{ flexDirection: 'row' }}>
          {current.avatar}
          {others.map((o, i) => (
            <View key={o.key} style={{ marginLeft: -12, zIndex: -i - 1, opacity: 0.9, borderWidth: 2, borderColor: t.colors.surface, borderRadius: 22 }}>{o.avatar}</View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold">{current.label}</Text>
          <Text variant="caption" muted>{current.sub}</Text>
        </View>
        <Icon name="chevron-down" size={18} color={t.colors.textMuted} />
      </Tappable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('pj.switcher.title')}>
        {items.map((it) => (
          <Tappable
            key={it.key}
            testID={`subject-${it.key}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: it.active }}
            accessibilityLabel={`${it.label}, ${it.sub}`}
            onPress={() => { haptic('selection'); it.onPress(); setOpen(false); }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: it.active ? t.colors.surfaceAlt : pressed ? t.colors.background : 'transparent' })}
          >
            {it.avatar}
            <View style={{ flex: 1 }}>
              <Text weight="bold">{it.label}</Text>
              <Text variant="small" muted>{it.sub}</Text>
            </View>
            {it.active && <Icon name="check" color={t.colors.text} />}
          </Tappable>
        ))}
        <Tappable
          testID="subject-add"
          accessibilityRole="button"
          accessibilityLabel={tr('pj.switcher.add')}
          onPress={() => { setOpen(false); router.push('/journeys'); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg }}
        >
          <Avatar color={t.colors.surfaceAlt} icon="plus" />
          <Text weight="bold" color={t.colors.primary}>{tr('pj.switcher.add')}</Text>
        </Tappable>
      </Sheet>
    </>
  );
}

/** Le bouton « Poser une question » accessible partout. */
export function AskFab({ bottom = 0 }: { bottom?: number }) {
  const t = useTheme();
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={tr('ask.button')}
      accessibilityHint="Ouvre l’assistant d’intelligence artificielle"
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
      <Text variant="small" muted style={{ marginTop: 6 }}>Cette fonction fait partie de Toi & Moi Premium. Le suivi essentiel, la communauté et toutes les informations de sécurité restent gratuits.</Text>
      <Button label="Découvrir l’abonnement" variant="secondary" size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />
    </Card>
  );
}

/** Numéros d'urgence — toujours gratuits, accessibles sans connexion internet une fois chargés. */
export function EmergencyList({ compact }: { compact?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const { data } = useEmergencyResources();
  const list = compact ? data?.filter((r) => ['15', '112', '3114'].includes(r.phone)) : data;
  return (
    <View style={{ gap: spacing.xs }}>
      {(list ?? FALLBACK).map((r) => (
        <Tappable
          key={r.phone}
          accessibilityRole="button"
          accessibilityLabel={`Appeler le ${r.phone.split('').join(' ')}, ${r.label}`}
          onPress={() => { Linking.openURL(`tel:${r.phone}`).catch(() => toast(`Impossible de lancer l’appel ici : composez le ${r.phone} depuis votre téléphone.`, 'error')); }}
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

// Toujours disponible, même sans réseau ni base
const FALLBACK = [
  { phone: '15', label: 'SAMU', description: 'Urgence médicale', available: '24 h/24' },
  { phone: '112', label: 'Numéro d’urgence européen', description: 'Toute urgence', available: '24 h/24' },
  { phone: '3114', label: 'Prévention du suicide', description: 'Gratuit et confidentiel', available: '24 h/24' },
];

export function DemoBanner() {
  if (!isDemo) return null;
  return <Banner tone="demo" title="Mode démonstration">{'Vos données restent uniquement sur cet appareil. Connectez Supabase pour la synchronisation, le partage familial et les notifications push (voir README).'}</Banner>;
}

export function EmergencyShortcut() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel="Besoin d’aide maintenant : numéros d’urgence"
      onPress={() => router.push('/emergency')}
      hitSlop={8}
      style={{ position: 'absolute', top: insets.top + 6, right: spacing.md, minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.dangerSoft }}
    >
      <Icon name="life-buoy" size={20} color={t.colors.danger} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 8, paddingRight: spacing.md, borderRadius: radius.pill, borderWidth: 1, minHeight: 58 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 6, paddingLeft: 6, paddingRight: 14, borderRadius: radius.pill, borderWidth: 1.2, minHeight: MIN_TOUCH + 4 },
  add: { paddingHorizontal: 14, paddingRight: 14, justifyContent: 'center' },
  fab: { position: 'absolute', right: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, minHeight: 52, borderRadius: 14, shadowColor: '#5B3A2E', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  emergency: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, minHeight: 64 },
  phone: { minWidth: 64, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
