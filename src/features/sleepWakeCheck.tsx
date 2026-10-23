/**
 * « Me rappeler de vérifier » pendant une sieste : rappel programmé UNIQUEMENT à la demande du parent
 * (jamais par défaut), jamais formulé comme un ordre de réveiller l'enfant. Un seul rappel par enfant :
 * en programmer un nouveau remplace le précédent ; il se reporte ou s'annule.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useToast } from '@/components/Overlays';
import { Button, Chip, Row, Text } from '@/components/ui';
import { useReminders } from '@/lib/data/hooks';
import { friendlyError, useDeleteReminder, useSaveReminder } from '@/lib/data/hooks-settings';
import type { Child, Reminder } from '@/lib/types';
import { spacing } from '@/theme/tokens';

export const WAKE_CHECK_DELAYS = [30, 45, 60, 90] as const;
export const wakeCheckLink = (childId: string) => `/sleep/${childId}?check=1`;
export function wakeCheckBody(child: Pick<Child, 'first_name' | 'sex'>) {
  const awake = child.sex === 'female' ? 'réveillée' : child.sex === 'male' ? 'réveillé' : 'réveillé(e)';
  return `Rappel que vous avez programmé : vérifier si ${child.first_name} est ${awake}.`;
}
const clock = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
const atOf = (r: Reminder) => (r.schedule as { type: string; at?: string }).type === 'once' ? new Date((r.schedule as { at: string }).at) : null;

export function WakeCheckReminder({ child }: { child: Child }) {
  const toast = useToast();
  const { data: reminders } = useReminders();
  const save = useSaveReminder();
  const del = useDeleteReminder();
  const [busy, setBusy] = useState(false);
  const mine = (reminders ?? []).filter((r) => r.deep_link === wakeCheckLink(child.id));
  const upcoming = mine.map((r) => ({ r, at: atOf(r) })).find((x) => x.at && x.at.getTime() > Date.now() && x.r.enabled);

  async function program(minutes: number) {
    setBusy(true);
    try {
      // un seul rappel de vérification par enfant : l'ancien est remplacé, jamais doublé
      for (const r of mine) await del.mutateAsync(r.id);
      const at = new Date(Date.now() + minutes * 60_000);
      await save.mutateAsync({ draft: { title: `Sieste de ${child.first_name}`, body: wakeCheckBody(child), category: 'tracking', schedule: { type: 'once', at: at.toISOString() }, enabled: true, deep_link: wakeCheckLink(child.id), child_id: child.id } });
      toast(`Rappel programmé à ${clock(at)}.`, 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function cancel() {
    setBusy(true);
    try { for (const r of mine) await del.mutateAsync(r.id); toast('Rappel annulé.'); } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: spacing.xs }} testID="wake-check">
      {upcoming ? (
        <>
          <Text variant="small" testID="wake-check-at">{`Rappel de vérification programmé à ${clock(upcoming.at!)}.`}</Text>
          <Row wrap>
            <Button label="Reporter de 15 min" size="sm" variant="secondary" icon="clock" loading={busy}
              onPress={() => void program(Math.max(15, Math.round((upcoming.at!.getTime() - Date.now()) / 60_000) + 15))} testID="wake-check-snooze" />
            <Button label="Annuler" size="sm" variant="ghost" icon="x" loading={busy} onPress={cancel} testID="wake-check-cancel" />
          </Row>
        </>
      ) : (
        <>
          <Text variant="small" muted>Si vous le souhaitez : un rappel pour aller vérifier s’il dort encore. Aucun rappel n’est programmé sans votre demande.</Text>
          <Row wrap>{WAKE_CHECK_DELAYS.map((m) => <Chip key={m} label={m < 60 ? `Dans ${m} min` : `Dans ${m / 60 === 1 ? '1 h' : '1 h 30'}`} onPress={() => void program(m)} testID={`wake-check-${m}`} />)}</Row>
        </>
      )}
    </View>
  );
}
