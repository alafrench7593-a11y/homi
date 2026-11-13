/**
 * Mode urgence organisationnelle : interface minimale pour les moments de surcharge importante.
 * Gros boutons, aucun formulaire long, aucune animation. Ne remplace pas les services d'urgence.
 */
import React, { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { useToast } from '@/components/Overlays';
import { callNumber, goBack } from '@/lib/links';
import { haptic, Icon, type IconName, Text } from '@/components/ui';
import { ChildEssentials } from '@/features/familyLoad';
import { useBatchTasks, useCreateRequest, useFamilyTasks } from '@/lib/data/hooks-family-load';
import { useTrustedContacts } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import { lightenDay } from '@/lib/domain/familyLoad';
import { todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr } from '@/i18n';
import { useTapShield } from '@/features/tapShield';

function Big({ icon, label, onPress, tone }: { icon: IconName; label: string; onPress: () => void; tone?: 'danger' }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={label} onPress={() => { haptic('selection'); onPress(); }}
      style={({ pressed }) => ({ minHeight: 76, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: tone === 'danger' ? t.colors.dangerSoft : t.colors.surface, borderWidth: 1, borderColor: t.colors.border, opacity: pressed ? 0.85 : 1 })}>
      <Icon name={icon} size={26} color={tone === 'danger' ? t.colors.danger : t.colors.primary} />
      <Text weight="bold" style={{ fontSize: 19, flex: 1 }}>{label}</Text>
    </Tappable>
  );
}

export default function OrgEmergency() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  const toast = useToast();
  const ask = useCreateRequest();
  const batch = useBatchTasks();
  const { data: tasks } = useFamilyTasks();
  const { data: contacts } = useTrustedContacts();
  const [showChild, setShowChild] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const { plan } = lightenDay(tasks ?? [], todayISO());

  // Double appui sur une grande touche : une seule demande envoyée au foyer
  const sending = useRef(false);
  const { arm, shielded } = useTapShield();
  const send = (kind: 'relay' | 'help_today', msg: string) => {
    if (sending.current || shielded()) return;
    sending.current = true;
    ask.mutateAsync({ kind }).then(() => { arm(); toast(msg); }).catch((e) => toast(friendlyError(e), 'error')).finally(() => { sending.current = false; });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingTop: topInset + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.sm }}>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('u2.urgent.back_label')} onPress={() => goBack()} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text weight="bold" color={t.colors.primary}>{tr('u2.urgent.back')}</Text>
      </Tappable>
      <Text variant="title" accessibilityRole="header">{tr('u2.urgent.title')}</Text>
      {/* urgence vitale toujours en premier, sans animation */}
      <Big icon="alert-octagon" label={tr('u2.urgent.medical')} tone="danger" onPress={() => router.push('/emergency')} />

      <Big icon="users" label={tr('u2.urgent.relay')} onPress={() => send('relay', tr('u2.urgent.relay_sent'))} />
      <Big icon="life-buoy" label={tr('u2.urgent.help')} onPress={() => send('help_today', tr('u2.urgent.help_sent'))} />
      <Big icon="share" label={tr('u2.urgent.delegate')} onPress={() => router.push('/family')} />
      <Big icon="skip-forward" label={plan.length ? tr('u2.urgent.postpone', { count: plan.length }) : tr('u2.urgent.nothing_postpone')} onPress={() => (plan.length ? batch.mutateAsync({ postpone: plan.map((p) => ({ id: p.id, to: p.to })) }).then(() => toast(tr('u2.urgent.postponed'))).catch((e) => toast(friendlyError(e), 'error')) : undefined)} />
      <Big icon="phone" label={tr('u2.urgent.call_trusted')} onPress={() => setShowContacts((v) => !v)} />
      {showContacts ? (
        <View style={{ gap: spacing.xs }}>
          {(contacts ?? []).filter((c) => c.phone).map((c) => <Big key={c.id} icon="phone-call" label={`${c.name}${c.relation ? ` (${c.relation})` : ''}`} onPress={() => callNumber(c.phone!, toast)} />)}
          {!(contacts ?? []).some((c) => c.phone) ? <Text>{tr('u2.urgent.no_number')}</Text> : null}
        </View>
      ) : null}
      <Big icon="heart" label={tr('u2.urgent.child_info')} onPress={() => setShowChild((v) => !v)} />
      {showChild ? <ChildEssentials large /> : null}

      <Text variant="small" muted>{tr('u2.urgent.disclaimer')}</Text>
    </ScrollView>
  );
}
