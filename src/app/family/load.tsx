/**
 * « Qui y pense » : sur les 30 derniers jours, qui a noté les choses à faire (penser), qui les a faites, à qui elles
 * sont confiées, et qui porte quels domaines. Présenté sans jugement, pour en parler à deux.
 * 23/11/2026 : correction directe — porteur d'un domaine ou d'une tâche changé dans une fiche (LoadFix), tâche ou
 * domaine ouvert gardé dans l'adresse ; lecture seule sans droit d'édition.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Text } from '@/components/ui';
import { useFamilyTasks, usePeople } from '@/lib/data/hooks-family-load';
import { useDomains } from '@/lib/data/hooks-mental';
import { mentalLoad, shares, type LoadRow } from '@/lib/domain/mentalLoad';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { toolBlurb, toolName } from '@/lib/domain/toolCatalog';
import { useUserId } from '@/lib/auth';
import { AuraAnalysis } from '@/features/aura/AuraAnalysis';
import { loadAggregate } from '@/features/aura/analysis';
import { LoadTrack } from '@/features/homeTrack/LoadTrack';
import { LoadFix } from '@/features/finishFamily/LoadFix';

const MEASURES: (keyof Omit<LoadRow, 'person'>)[] = ['thought', 'done', 'assigned', 'domains'];

export default function MentalLoad() {
  const t = useTheme();
  const { people, labelOf } = usePeople();
  const tasksQ = useFamilyTasks();
  const domainsQ = useDomains();
  const tasks = useMemo(() => tasksQ.data ?? [], [tasksQ.data]);
  const domains = useMemo(() => domainsQ.data ?? [], [domainsQ.data]);
  // `people` est recréé à chaque rendu : la clé stable est la liste des identifiants
  const ids = people.map((p) => p.id).join('|');
  const rows = useMemo(() => mentalLoad(tasks, domains, ids ? ids.split('|') : []), [tasks, domains, ids]);
  const colors = [t.colors.primary, t.colors.lavender, t.colors.gold, t.colors.success];
  const any = rows.some((r) => r.thought + r.done + r.assigned + r.domains > 0);
  const me = useUserId();
  // Pas de faux « pas encore de données » pendant le chargement ou après une erreur
  const loading = (tasksQ.isLoading && !tasksQ.data) || (domainsQ.isLoading && !domainsQ.data);
  const failed = !loading && ((tasksQ.isError && !tasksQ.data) || (domainsQ.isError && !domainsQ.data));
  return (
    <Screen back title={toolName('mental_load')} subtitle={toolBlurb('mental_load')}>
      <LoadTrack tasks={tasks} people={people.map((p) => p.id)} labelOf={labelOf} onOpen={(id) => router.setParams({ task: id } as never)} />
      <Text muted>{tr('cm.load.intro')}</Text>
      {loading ? <Skeleton kind="card" rows={2} />
        : failed ? <ErrorView error={tasksQ.error ?? domainsQ.error} onRetry={() => { void tasksQ.refetch(); void domainsQ.refetch(); }} />
        : !any ? <EmptyState icon="pie-chart" title={tr('cm.load.none')} body={tr('cm.load.noneD')} action={{ label: toolName('brain_dump'), onPress: () => router.push('/family/brain-dump') }} /> : MEASURES.map((m) => {
        const s = shares(rows, m);
        const title = tr(`cm.load.${m}` as TKey);
        // Lecteur d'écran : la barre se lit en une phrase (personne, part, nombre), pas comme des blocs de couleur muets
        const summary = s ? `${title} : ${rows.map((r) => `${labelOf(r.person)} ${s[r.person]} % (${r[m]})`).join(', ')}` : title;
        return (
          <Card key={m} testID={`load-${m}`}>
            <Text weight="bold" accessibilityRole="header">{title}</Text>
            <Text variant="caption" muted>{tr(`cm.load.${m}.d` as TKey)}</Text>
            {s ? (
              <>
                <View accessible accessibilityRole="image" accessibilityLabel={summary} style={{ flexDirection: 'row', height: 14, borderRadius: radius.sm, overflow: 'hidden', marginTop: spacing.xs }}>
                  {rows.map((r, i) => <View key={r.person} style={{ flex: Math.max(s[r.person], 0.0001), backgroundColor: colors[i % colors.length] }} />)}
                </View>
                {rows.map((r, i) => (
                  <View key={r.person} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors[i % colors.length] }} />
                    {/* Chiffres tabulaires : les parts s'alignent d'une ligne à l'autre */}
                    <Text variant="small" style={{ flex: 1 }}>{labelOf(r.person)}</Text>
                    <Text variant="small" weight="bold" style={{ fontVariant: ['tabular-nums'] }}>{s[r.person]} %</Text>
                    <Text variant="small" muted style={{ fontVariant: ['tabular-nums'] }}>({r[m]})</Text>
                  </View>
                ))}
              </>
            ) : <Text variant="small" muted>{tr('cm.load.nothing')}</Text>}
          </Card>
        );
      })}
      {/* Qui porte quoi : changer le porteur d'un domaine ou d'une tâche dans une fiche (mêmes écritures que Domaines / Tâches) */}
      <LoadFix tasks={tasks} domains={domains} people={people} labelOf={labelOf} />
      <Banner tone="info" icon="heart">{tr('cm.load.talk')}</Banner>
      {/* « Analyser avec HOMI Aura » (plan d'action) : comptes « moi / l'autre adulte » et catégories, après accord */}
      {any ? <AuraAnalysis kind="load" data={loadAggregate(rows, me, tasks as { category?: string | null; created_at: string }[])} /> : null}
      <Button label={toolName('couple_week')} icon="coffee" variant="secondary" onPress={() => router.push('/family/couple')} />
    </Screen>
  );
}
