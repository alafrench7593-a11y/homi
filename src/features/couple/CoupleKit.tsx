/**
 * Briques de l'espace du co-parent et de « Se comprendre » (19/11/2026).
 *  - InviteOtherParent : « Ajouter l'autre parent à votre famille ? » → Inviter maintenant / Plus tard. Le lien à usage
 *    unique (7 jours, révocable) est créé dans Réglages › Famille (mécanisme existant, create_household_invitation).
 *  - ConfirmSend : confirmation qui montre le texte EXACT et le destinataire ; rien ne part sans elle.
 *  - HelpLine : ligne sobre vers un professionnel de santé et les ressources d'aide de l'app (« Je craque », numéros).
 */
import React, { useEffect, useState } from 'react';
import { glassEdge } from '@/components/glass/GlassRim';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Sheet } from '@/components/Overlays';
import { GlassCard } from '@/components/glass';
import { Button, Icon, Row, Text, Toggle } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { useHouseholdMembers, useMyMembership } from '@/lib/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const LATER_KEY = 'homi.invite.otherParent.later';

/** Proposée à la personne qui a créé le foyer tant qu'aucun autre adulte ne l'a rejoint ; « Plus tard » la range. */
export function InviteOtherParent({ testID = 'invite-other-parent' }: { testID?: string }) {
  const me = useUserId();
  const membership = useMyMembership();
  const { data: members } = useHouseholdMembers();
  const [later, setLater] = useState<boolean | null>(null);
  useEffect(() => { AsyncStorage.getItem(`${LATER_KEY}.${me ?? ''}`).then((v) => setLater(v === '1')).catch(() => setLater(false)); }, [me]);
  const alone = !(members ?? []).some((m) => m.user_id !== me && (m.role === 'owner' || m.role === 'coparent'));
  if (later !== false || membership?.role !== 'owner' || !members || !alone) return null;
  return (
    <GlassCard testID={testID}>
      <View style={{ gap: spacing.sm }}>
        <Row gap={spacing.sm} style={{ alignItems: 'center' }}>
          <Icon name="user-plus" size={20} />
          <Text weight="bold" style={{ flex: 1 }} accessibilityRole="header">{tr('cp2.inv.title')}</Text>
        </Row>
        <Text variant="small" muted>{tr('cp2.inv.body')}</Text>
        <Row gap={spacing.sm} wrap>
          <Button label={tr('cp2.inv.now')} icon="link" size="sm" onPress={() => router.push('/settings/family')} testID={`${testID}-now`} />
          <Button label={tr('cp2.inv.later')} variant="ghost" size="sm" testID={`${testID}-later`}
            onPress={() => { setLater(true); void AsyncStorage.setItem(`${LATER_KEY}.${me ?? ''}`, '1').catch(() => undefined); }} />
        </Row>
      </View>
    </GlassCard>
  );
}

/** Confirmation d'envoi : le texte exact, le destinataire, et deux choix clairs. */
export function ConfirmSend({ visible, name, text, busy, onConfirm, onClose, testID = 'und-confirm' }: {
  visible: boolean; name: string; text: string; busy?: boolean; onConfirm: () => void; onClose: () => void; testID?: string;
}) {
  const t = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('und.confirm.title')}>
      <View style={{ gap: spacing.sm }} testID={testID}>
        <Text variant="small" weight="bold" testID={`${testID}-to`}>{tr('und.confirm.to', { name })}</Text>
        <View style={{ borderRadius: radius.md, ...glassEdge(t), padding: spacing.sm, backgroundColor: t.colors.surface }}>
          <Text testID={`${testID}-text`} selectable>{text}</Text>
        </View>
        <Button label={tr('und.confirm.go')} icon="send" full loading={busy} onPress={onConfirm} testID={`${testID}-go`} />
        <Button label={tr('und.confirm.back')} variant="ghost" full onPress={onClose} testID={`${testID}-back`} />
      </View>
    </Sheet>
  );
}

/** Ligne de réglage lisible : libellé visible à gauche, interrupteur à droite (≥ 44 pt, VoiceOver : « interrupteur »). */
export function SwitchRow({ label, value, onChange, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }} testID={testID}>
      <Text style={{ flex: 1 }}>{label}</Text>
      <Toggle label={label} value={value} onChange={onChange} />
    </View>
  );
}

export function HelpLine({ testID = 'und-help' }: { testID?: string }) {
  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      <Text variant="small" muted>{tr('und.help')}</Text>
      <Row gap={spacing.sm} wrap>
        <Button label={tr('und.helpSos')} size="sm" variant="secondary" icon="life-buoy" onPress={() => router.push('/family/sos')} testID={`${testID}-sos`} />
        <Button label={tr('und.helpNumbers')} size="sm" variant="ghost" icon="phone" onPress={() => router.push('/emergency')} />
      </Row>
    </View>
  );
}
