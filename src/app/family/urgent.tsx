/**
 * Mode urgence organisationnelle : interface minimale pour les moments de surcharge importante.
 * Gros boutons, aucun formulaire long, aucune animation. Ne remplace pas les services d'urgence.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const toast = useToast();
  const ask = useCreateRequest();
  const batch = useBatchTasks();
  const { data: tasks } = useFamilyTasks();
  const { data: contacts } = useTrustedContacts();
  const [showChild, setShowChild] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const { plan } = lightenDay(tasks ?? [], todayISO());

  const send = (kind: 'relay' | 'help_today', msg: string) => ask.mutateAsync({ kind }).then(() => toast(msg)).catch((e) => toast(friendlyError(e), 'error'));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.sm }}>
      <Tappable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => goBack()} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text weight="bold" color={t.colors.primary}>← Retour</Text>
      </Tappable>
      <Text variant="title" accessibilityRole="header">Respirez. Une chose à la fois.</Text>
      {/* urgence vitale toujours en premier, sans animation */}
      <Big icon="alert-octagon" label="Urgence médicale ou danger : 15 · 112 · 3114" tone="danger" onPress={() => router.push('/emergency')} />

      <Big icon="users" label="Demander un relais" onPress={() => send('relay', 'Demande de relais envoyée.')} />
      <Big icon="life-buoy" label="J’ai besoin d’aide aujourd’hui" onPress={() => send('help_today', 'Demande d’aide envoyée.')} />
      <Big icon="share" label="Déléguer une tâche" onPress={() => router.push('/family')} />
      <Big icon="skip-forward" label={plan.length ? `Reporter ${plan.length} tâche${plan.length > 1 ? 's' : ''} non essentielle${plan.length > 1 ? 's' : ''} à demain` : 'Rien à reporter'} onPress={() => (plan.length ? batch.mutateAsync({ postpone: plan.map((p) => ({ id: p.id, to: p.to })) }).then(() => toast('Reporté à demain.')).catch((e) => toast(friendlyError(e), 'error')) : undefined)} />
      <Big icon="phone" label="Appeler une personne de confiance" onPress={() => setShowContacts((v) => !v)} />
      {showContacts ? (
        <View style={{ gap: spacing.xs }}>
          {(contacts ?? []).filter((c) => c.phone).map((c) => <Big key={c.id} icon="phone-call" label={`${c.name}${c.relation ? ` (${c.relation})` : ''}`} onPress={() => callNumber(c.phone!, toast)} />)}
          {!(contacts ?? []).some((c) => c.phone) ? <Text>Aucun numéro enregistré. Ajoutez-en dans Après la naissance › Mon plan de soutien.</Text> : null}
        </View>
      ) : null}
      <Big icon="heart" label="Infos indispensables des enfants" onPress={() => setShowChild((v) => !v)} />
      {showChild ? <ChildEssentials large /> : null}

      <Text variant="small" muted>Ce mode aide à s’organiser. Il ne remplace pas les services d’urgence médicale ou psychologique.</Text>
    </ScrollView>
  );
}
