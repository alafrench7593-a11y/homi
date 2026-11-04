/**
 * « Je craque » (scripts 53 « Maman solo, 2 h du matin » et 66 « L'heure des pleurs ») : quand les pleurs ne
 * s'arrêtent pas et que la colère monte. Écran volontairement minimal, gros boutons, aucune animation :
 *   1. poser bébé sur le dos dans son lit, sortir de la pièce (il ne risque rien à pleurer quelques minutes seul,
 *      il risque tout s'il est secoué) ; 2. respirer deux minutes (minuteur) ; 3. appeler quelqu'un : mes personnes
 *      de confiance, le relais du foyer, les numéros d'écoute ; 4. en parler au pédiatre.
 * Les contacts sont ceux déjà saisis dans « Soutien » ; rien de nouveau n'est stocké.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, type IconName, Text } from '@/components/ui';
import { useCreateRequest } from '@/lib/data/hooks-family-load';
import { useHouseholdId } from '@/lib/data/hooks';
import { useTrustedContacts } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import { callNumber, goBack } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

function Big({ icon, label, sub, onPress, tone, testID }: { icon: IconName; label: string; sub?: string; onPress: () => void; tone?: 'danger' | 'calm'; testID?: string }) {
  const t = useTheme();
  const bg = tone === 'danger' ? t.colors.dangerSoft : tone === 'calm' ? (t.isDark ? 'rgba(195,178,255,0.14)' : 'rgba(225,215,255,0.6)') : t.colors.surface;
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={label} testID={testID} onPress={() => { haptic('selection'); onPress(); }}
      style={({ pressed }) => ({ minHeight: 76, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: bg, opacity: pressed ? 0.85 : 1 })}>
      <Icon name={icon} size={26} color={tone === 'danger' ? t.colors.danger : t.colors.primary} />
      <View style={{ flex: 1 }}>
        <Text weight="bold" style={{ fontSize: 19 }}>{label}</Text>
        {sub ? <Text variant="small" muted>{sub}</Text> : null}
      </View>
    </Tappable>
  );
}

export default function FamilySos() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const hid = useHouseholdId();
  const ask = useCreateRequest();
  const { data: contacts } = useTrustedContacts();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left == null || left <= 0) return;
    const id = setTimeout(() => setLeft((v) => (v == null ? null : v - 1)), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const people = (contacts ?? []).filter((c) => c.phone);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.sm }} testID="family-sos">
      <Tappable accessibilityRole="button" accessibilityLabel={tr('u2.urgent.back_label')} onPress={() => goBack()} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text weight="bold" color={t.colors.primary}>{tr('u2.urgent.back')}</Text>
      </Tappable>
      <Text variant="title" accessibilityRole="header">{tr('sos.title')}</Text>
      <Text>{tr('sos.intro')}</Text>

      <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('sos.step1')}</Text>
      <Text>{tr('sos.step1D')}</Text>
      <Text weight="bold" color={t.colors.danger}>{tr('sos.neverShake')}</Text>

      <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('sos.step2')}</Text>
      <Big icon="wind" tone="calm" testID="sos-breathe" label={left == null ? tr('sos.breathe') : left > 0 ? tr('sos.breathing', { time: mm(left) }) : tr('sos.breathed')}
        sub={left == null ? tr('sos.breatheD') : undefined} onPress={() => setLeft(left == null || left === 0 ? 120 : null)} />

      <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('sos.step3')}</Text>
      {people.map((c) => (
        <Big key={c.id} icon="phone" label={c.name} sub={c.relation ?? undefined} onPress={() => callNumber(c.phone!, toast)} />
      ))}
      {!people.length ? <Big icon="user-plus" label={tr('sos.addContact')} sub={tr('sos.addContactD')} onPress={() => router.push('/postpartum/support')} /> : null}
      {hid ? <Big icon="users" label={tr('sos.relay')} sub={tr('sos.relayD')} onPress={() => ask.mutateAsync({ kind: 'relay', message: tr('sos.relayMsg') }).then(() => toast(tr('sos.relaySent'))).catch((e) => toast(friendlyError(e), 'error'))} /> : null}
      <Big icon="headphones" label={tr('sos.line')} sub={tr('sos.lineD')} onPress={() => callNumber('3114', toast)} />
      <Big icon="alert-octagon" tone="danger" label={tr('sos.medical')} sub={tr('sos.medicalD')} onPress={() => callNumber('15', toast)} />

      <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('sos.step4')}</Text>
      <Text>{tr('sos.step4D')}</Text>
      <Big icon="book-open" label={tr('sos.articles')} onPress={() => router.push('/night/help')} />
      <Text variant="caption" muted>{tr('sos.footer')}</Text>
    </ScrollView>
  );
}
