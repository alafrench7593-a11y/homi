/**
 * Échéances préparées d'avance : rentrée, vacances, Noël, anniversaires, changement de saison, impôts, papiers qui
 * expirent. Quand la fenêtre de préparation s'ouvre, « Préparer » crée la petite liste de tâches pour la personne qui
 * porte le domaine ; « Pas cette fois » la range. Les dates d'impôts et de rentrée sont des repères : à vérifier.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { useChildren, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { useBatchTasks, usePeople } from '@/lib/data/hooks-family-load';
import { useDomains, useFamilyPapers, usePrepDone } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addDays, todayISO } from '@/lib/domain/dates';
import { prepDue, upcomingPrep, type PrepItem } from '@/lib/domain/mentalLoad';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function Prep() {
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const today = todayISO();
  const children = useChildren().data ?? [];
  const papers = useFamilyPapers().data ?? [];
  const done = usePrepDone().data ?? [];
  const domains = useDomains().data ?? [];
  const { labelOf, me } = usePeople();
  const batch = useBatchTasks();
  const [busy, setBusy] = useState<string | null>(null);
  const items = useMemo(() => upcomingPrep(today, children, papers), [today, children, papers]);
  const state = (it: PrepItem) => done.find((d) => d.key === it.key && d.occurs_on === it.occursOn)?.status ?? null;
  const owner = (it: PrepItem) => domains.find((d) => d.key === it.domain)?.owner_id ?? null;
  const title = (it: PrepItem) => tr(`cm.prep.${it.kind}` as TKey, { name: it.label ?? '' });

  async function mark(it: PrepItem, status: 'prepared' | 'skipped') {
    if (!hid) return;
    setBusy(it.key);
    try {
      if (status === 'prepared') {
        const due = new Date(`${addDays(it.occursOn, -Math.ceil(it.leadDays / 3))}T18:00:00`).toISOString();
        await batch.mutateAsync({ create: it.checklist.map((c) => ({
          title: `${title(it)} : ${tr(`cm.prep.item.${it.kind}.${c}` as TKey)}`.slice(0, 120), category: (it.domain === 'admin' ? 'admin' : it.domain === 'holidays' ? 'packing' : 'organization') as never,
          due_at: due, assignee_id: owner(it) ?? me ?? null, priority: 'normal' as const, essential: false, recurrence: null, notes: null,
        })) });
      }
      await backend.insert('family_prep', { household_id: hid, key: it.key, occurs_on: it.occursOn, status });
      inv('family_prep');
      toast(status === 'prepared' ? tr('cm.prep.prepared', { count: it.checklist.length }) : tr('cm.prep.skippedT'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(null); }
  }

  return (
    <Screen back title={tr('tool.family_prep')} subtitle={tr('tool.family_prep.sub')}>
      <Text muted>{tr('cm.prep.intro')}</Text>
      {!items.length ? <EmptyState icon="calendar" title={tr('cm.prep.none')} body={tr('cm.prep.noneD')} /> : items.map((it) => {
        const st = state(it);
        const open = prepDue(it, today);
        return (
          <Card key={`${it.key}-${it.occursOn}`} tone={open && !st ? 'gold' : 'surface'} testID={`prep-${it.key}`}>
            <Text weight="bold">{title(it)}</Text>
            <Text variant="small" muted>{formatDate(it.occursOn, { weekday: 'long', day: 'numeric', month: 'long' })}{owner(it) ? ` · ${tr('cm.prep.by', { person: labelOf(owner(it)) })}` : ''}</Text>
            <View style={{ marginTop: 4 }}>{it.checklist.map((c) => <Text key={c} variant="small">• {tr(`cm.prep.item.${it.kind}.${c}` as TKey)}</Text>)}</View>
            {st ? <Text variant="caption" weight="bold" style={{ marginTop: 4 }}>{st === 'prepared' ? tr('cm.prep.isPrepared') : tr('cm.prep.isSkipped')}</Text> : (
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' }}>
                <Button label={open ? tr('cm.prep.prepare') : tr('cm.prep.prepareEarly')} size="sm" icon="check-square" loading={busy === it.key} onPress={() => void mark(it, 'prepared')} testID={`prep-do-${it.key}`} />
                <Button label={tr('cm.prep.skip')} size="sm" variant="ghost" onPress={() => void mark(it, 'skipped')} />
              </View>
            )}
          </Card>
        );
      })}
      <Banner tone="info" icon="info">{tr('cm.prep.check')}</Banner>
      <Button label={tr('tool.family_papers')} icon="folder" variant="secondary" onPress={() => router.push('/family/papers')} />
    </Screen>
  );
}
