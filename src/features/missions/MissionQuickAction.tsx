/**
 * Action rapide d'une ligne « Mes missions » (19/11/2026) : À faire → « Je m'en occupe » → En cours → « Mission
 * terminée ». Le serveur tranche (mission_respond, version attendue) ; la confirmation n'apparaît qu'après SA réponse
 * (ou la mise en file hors connexion, annoncée comme telle). Confirmation sobre : coche SuccessCheck, puis la ligne
 * quitte la liste des missions actives (le parent la retire) — pas de confettis, pas de compteur.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useToast } from '@/components/Overlays';
import { Button, Text } from '@/components/ui';
import { SuccessCheck } from '@/motion';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useRespondMission } from '@/lib/data/hooks-missions';
import { viewerOf, type Mission, type MissionAction } from '@/lib/domain/missions';
import { nextOccurrenceLabel } from './MissionCard';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Prochaine étape proposée sur la ligne, ou rien (mission d'un autre, déjà finie, refusée…). */
export function quickActionFor(m: Pick<Mission, 'mission_state' | 'assignee_id' | 'created_by'>, me: string): MissionAction | null {
  if (viewerOf(m, me) !== 'recipient') return null;
  if (m.mission_state === 'pending' || m.mission_state === 'accepted' || m.mission_state === 'postponed') return 'start';
  if (m.mission_state === 'in_progress') return 'complete';
  return null;
}

/**
 * `onFinishing` : appelé AVANT l'envoi de « Mission terminée » ; le parent garde la ligne affichée (même si la liste
 * relue la dit déjà terminée) le temps que la coche se trace, puis `onDone` la retire.
 */
export function MissionQuickAction({ m, me, onFinishing, onAbort, onDone }: {
  m: Mission; me: string; onFinishing?: (id: string) => void; onAbort?: (id: string) => void; onDone: (id: string) => void;
}) {
  const t = useTheme();
  const toast = useToast();
  const respond = useRespondMission();
  const [done, setDone] = useState(false);
  const action = quickActionFor(m, me);
  const next = nextOccurrenceLabel(m);
  if (!action && !done) return null;
  async function run() {
    if (!action) return;
    if (action === 'complete') onFinishing?.(m.id);
    try {
      const out = await respond.mutateAsync({ id: m.id, action, version: m.version });
      if (out?.status === 'conflict') { toast(tr('ht.conflict'), 'error'); onAbort?.(m.id); return; }
      if (out?.queued) toast(tr('cp2.mis.queued'), 'info');
      if (action === 'complete') {
        setDone(true);
        // la coche se trace, puis la ligne quitte les missions actives
        setTimeout(() => onDone(m.id), 900);
      }
    } catch (e) { onAbort?.(m.id); toast(friendlyError(e), 'error'); }
  }
  if (done) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44 }} accessibilityLiveRegion="polite" testID={`mission-done-${m.id}`}>
        <SuccessCheck visible size={22} color={t.colors.success} haptic />
        <View style={{ flexShrink: 1 }}>
          <Text variant="small" weight="bold" color={t.colors.success}>{tr('cp2.mis.doneNow')}</Text>
          {/* Mission récurrente : l'occurrence suivante arrive « À accepter » ; on dit quand, pour qu'elle ne surprenne pas */}
          {next ? <Text variant="small" muted testID={`mission-done-next-${m.id}`}>{next}</Text> : null}
        </View>
      </View>
    );
  }
  return (
    <Button size="sm" variant={action === 'complete' ? 'primary' : 'secondary'} icon={action === 'complete' ? 'check-circle' : 'play'}
      label={tr(action === 'complete' ? 'mis.reply.complete' : 'mis.reply.start')} loading={respond.isPending}
      onPress={() => void run()} testID={`mission-quick-${action}-${m.id}`} />
  );
}
