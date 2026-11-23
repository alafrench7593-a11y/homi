/**
 * Répartition de la charge mentale — correction directe (23/11/2026). « Qui porte quoi » sans quitter l'écran :
 *  · domaines : porteur en colonne, un domaine → sa fiche (DomainOwnerTray, la même que « Domaines ») ;
 *  · tâches à faire : échéance en colonne fixe, qui la porte ; une tâche → sa fiche (TaskCarrierTray, `useSaveTask`) ;
 *  · élément ouvert gardé dans l'adresse (« ?domain= », « ?task= ») ; les tâches faites de la semaine (LoadTrack)
 *    ouvrent la même fiche. Sans droit d'édition : fiches en lecture seule.
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React from 'react';
import { View } from 'react-native';
import { SectionTitle, Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import type { Person } from '@/lib/data/hooks-family-load';
import type { FamilyDomain } from '@/lib/data/hooks-mental';
import type { FamilyTask } from '@/lib/domain/familyLoad';
import { DOMAINS, type DomainKey } from '@/lib/domain/mentalLoad';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmRow } from '@/features/homeTrack/kit';
import { DomainOwnerTray, TaskCarrierTray, useCanEditLists, useOpenParam } from './shared';

const MAX_OPEN = 12;

export function LoadFix({ tasks, domains, people, labelOf }: {
  tasks: readonly FamilyTask[]; domains: readonly FamilyDomain[]; people: readonly Person[]; labelOf: (id: string | null | undefined) => string;
}) {
  const canEdit = useCanEditLists();
  const [taskId, setTask] = useOpenParam('task');
  const [domainKey, setDomain] = useOpenParam('domain');
  const owner = new Map(domains.map((d) => [d.key, d.owner_id]));
  const open = tasks.filter((t) => t.status === 'todo')
    .sort((a, b) => ((a.due_at ?? '9999') < (b.due_at ?? '9999') ? -1 : (a.due_at ?? '9999') > (b.due_at ?? '9999') ? 1 : 0));
  const opened = taskId ? tasks.find((t) => t.id === taskId) ?? null : null;
  const dom = (DOMAINS as readonly string[]).includes(domainKey ?? '') ? (domainKey as DomainKey) : null;
  return (
    <View style={{ gap: spacing.sm }} testID="ff-load-fix">
      <SectionTitle title={tr('ff.load.title')} />
      <Text variant="small" muted>{canEdit ? tr('ff.load.intro') : tr('ff.readOnly')}</Text>
      <Text variant="label" muted>{tr('ff.load.domains')}</Text>
      <MotionList testID="ff-load-domains">
        {DOMAINS.map((k) => (
          <MotionItem key={k}>
            <HmRow time={null} icon="users" title={tr(`cm.domain.${k}` as TKey)} testID={`ff-load-dom-${k}`}
              detail={owner.get(k) ? tr('cm.dom.owner', { person: labelOf(owner.get(k)) }) : tr('rs.dom.freeOne')}
              onPress={() => setDomain(k)} />
          </MotionItem>
        ))}
      </MotionList>
      <Text variant="label" muted>{tr('ff.load.open')}</Text>
      {open.length ? (
        <MotionList testID="ff-load-open">
          {open.slice(0, MAX_OPEN).map((t) => (
            <MotionItem key={t.id}>
              <HmRow time={t.due_at ? formatDate(t.due_at, { day: 'numeric', month: 'short' }) : null} icon="check-square" title={t.title} testID={`ff-load-task-${t.id}`}
                detail={t.assignee_id ? tr('ff.task.carried', { who: labelOf(t.assignee_id) }) : tr('ff.task.nobodyLine')} onPress={() => setTask(t.id)} />
            </MotionItem>
          ))}
        </MotionList>
      ) : <HmEmpty label={tr('ff.load.openEmpty')} testID="ff-load-open-empty" />}
      {open.length > MAX_OPEN ? <Text variant="caption" muted>{tr('ff.load.more', { count: open.length - MAX_OPEN })}</Text> : null}
      <TaskCarrierTray task={opened} onClose={() => setTask(null)} people={people} labelOf={labelOf} canEdit={canEdit} testID="ff-load-tray" />
      <DomainOwnerTray domain={dom} onClose={() => setDomain(null)} people={people} labelOf={labelOf} canEdit={canEdit} testID="ff-load-dom-tray" />
    </View>
  );
}
