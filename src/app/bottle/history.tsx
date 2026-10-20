/** Historique des biberons d'un enfant : vue jour / semaine, modification, suppression, résumé de consultation. */
import React, { useMemo, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BarChart } from '@/components/Charts';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Button, Card, Chip, IconButton, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { copyText } from '@/features/bottle';
import { BottleInstrument } from '@/features/bottleInstrument';
import { useTrackedChildren, useDeleteRow , useActiveSubject } from '@/lib/data/hooks';
import { useBottleHistory, useRecorderLabel } from '@/lib/data/hooks-bottle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { consultationSummary, dailySummaries, dayLabel, groupByDay, lastDays, withIntervals } from '@/lib/domain/bottleHistory';
import { formatClock, formatHM } from '@/lib/domain/bottleTimer';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type View_ = 'day' | 'week';
const SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const shortDay = (key: string) => SHORT[new Date(`${key}T12:00:00Z`).getUTCDay()];

export default function BottleHistory() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ child?: string }>();
  const insets = useSafeAreaInsets();
  const childrenQ = useTrackedChildren();
  const { data: children } = childrenQ;
  const { subject } = useActiveSubject();
  const childId = params.child || (subject.type === 'child' && children?.some((c) => c.id === subject.id) ? subject.id : children?.[0]?.id) || '';
  const child = children?.find((c) => c.id === childId) ?? null;
  const historyQ = useBottleHistory(childId, 8);
  const [chrono, setChrono] = useState(false);
  const { data: bottles } = historyQ;
  const isLoading = historyQ.isLoading && !bottles;
  const loadError = historyQ.isError && !bottles;
  const del = useDeleteRow('bottles');
  const recorder = useRecorderLabel();
  const [view, setView] = useState<View_>('day');
  const days = useMemo(() => lastDays(7), []);
  const [day, setDay] = useState(days[0]);
  const [summary, setSummary] = useState<string | null>(null);

  const enriched = useMemo(() => withIntervals(bottles ?? []), [bottles]);
  const byDay = useMemo(() => groupByDay(enriched), [enriched]);
  const week = useMemo(() => dailySummaries(bottles ?? [], 7), [bottles]);
  const list = byDay.get(day) ?? [];

  async function remove(id: string, at: string) {
    if (del.isPending) return;
    if (!(await confirm('Supprimer ce biberon ?', `Le biberon de ${formatClock(at)} sera supprimé pour toutes les personnes du foyer.`, 'Supprimer'))) return;
    try {
      await del.mutateAsync(id);
      toast('Biberon supprimé.');
    } catch (e) {
      toast(friendlyError(e, 'Suppression impossible. Réessayez dans un instant.'), 'error');
    }
  }

  function openSummary() {
    if (!child) return;
    setSummary(consultationSummary({ childName: child.first_name, bottles: bottles ?? [], recordedBy: recorder }));
  }

  if (!childId) {
    return (
      <Screen back title="Historique des biberons">
        {childrenQ.isLoading && !children ? <Skeleton kind="list" rows={4} /> : childrenQ.isError && !children ? (
          <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} title="Impossible d’afficher l’historique" />
        ) : (
          <EmptyState
            icon="coffee"
            title="Aucun enfant à suivre"
            body="Ajoutez d’abord le profil d’un enfant."
            action={{ label: 'Ajouter un enfant', onPress: () => router.push({ pathname: '/profiles/new', params: { kind: 'child' } }) }}
          />
        )}
      </Screen>
    );
  }

  const addBottle = () => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId } });
  const dayRows = view === 'day' && !isLoading && !loadError ? list : [];

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xxs }}>
      {children && children.length > 1 && (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.setParams({ child: c.id })} />)}
        </Row>
      )}
      {child ? (
        <>
          <Button label={chrono ? 'Masquer le chronomètre de prise' : 'Chronométrer une prise (facultatif)'} variant="ghost" size="sm" icon="watch" onPress={() => setChrono(!chrono)} style={{ alignSelf: 'flex-start' }} />
          {chrono ? <BottleInstrument child={child} /> : null}
        </>
      ) : null}
      <Segmented label="Affichage" value={view} onChange={setView} options={[{ value: 'day', label: 'Jour' }, { value: 'week', label: 'Semaine' }]} />
      {isLoading ? <Skeleton kind="list" rows={4} /> : loadError ? (
        <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title="Impossible d’afficher l’historique" />
      ) : view === 'day' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {days.map((k, i) => (
              <Chip key={k} label={i === 0 ? 'Aujourd’hui' : i === 1 ? 'Hier' : `${shortDay(k)} ${Number(k.slice(8, 10))}`} selected={k === day} onPress={() => setDay(k)} />
            ))}
          </ScrollView>
          <SectionTitle title={`${dayLabel(day)[0].toUpperCase()}${dayLabel(day).slice(1)}`} />
        </>
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>
      {view === 'week' && !isLoading && !loadError ? (
        <>
          <Card>
            <Text weight="medium">Quantité bue enregistrée par jour</Text>
            <BarChart data={[...week].reverse().map((d) => ({ label: shortDay(d.key), value: d.consumedTotal }))} unit="ml" accessibilityLabel="Quantité bue enregistrée chaque jour sur 7 jours" />
            <Text variant="caption" muted>Somme des quantités « bu » saisies. Graphique descriptif : il ne dit pas si c’est suffisant.</Text>
          </Card>
          <Card>
            {week.map((d) => (
              <Row key={d.key} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: t.colors.border, borderRadius: radius.sm }}>
                <Text style={{ flex: 1 }}>{d.label}</Text>
                <Text variant="small" muted>
                  {d.count ? `${d.count} biberon${d.count > 1 ? 's' : ''}${d.consumedCount ? ` · bu ${d.consumedTotal} ml` : ''}${d.preparedCount ? ` · préparé ${d.preparedTotal} ml` : ''}` : '—'}
                </Text>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <Button label="Résumé pour une consultation (7 jours)" icon="file-text" variant="secondary" disabled={!child || isLoading} onPress={openSummary} />
      <Text variant="caption" muted>Relevé de vos saisies, sans interprétation. Ne remplace pas l’avis d’un professionnel de santé.</Text>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} back title="Historique des biberons" subtitle={child ? `${child.first_name} · 7 derniers jours` : undefined}>
      <VirtualList
        data={dayRows}
        keyExtractor={(b) => b.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={view === 'day' && !isLoading && !loadError ? (
          <EmptyState icon="coffee" title="Aucun biberon enregistré ce jour-là." action={{ label: 'Enregistrer un biberon', onPress: addBottle }} />
        ) : null}
        renderItem={({ item: b }) => {
          const who = recorder(b.created_by);
          return (
            <Card>
              <Row style={{ alignItems: 'flex-start' }}>
                <Text variant="heading" style={{ width: 74 }}>{formatClock(b.at)}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="medium">
                    {[b.prepared_ml != null ? `Préparé ${b.prepared_ml} ml` : null, b.consumed_ml != null ? `bu ${b.consumed_ml} ml` : null].filter(Boolean).join(' · ') || 'Quantité non renseignée'}
                  </Text>
                  {b.interval_minutes != null && <Text variant="small" muted>{formatHM(b.interval_minutes)} après le biberon précédent</Text>}
                  {b.milk_type ? <Text variant="small" muted>{b.milk_type}</Text> : null}
                  {b.planned_next_ml != null && <Text variant="small" muted>Prévu pour le suivant : {b.planned_next_ml} ml</Text>}
                  {b.note ? <Text variant="small" italic>« {b.note} »</Text> : null}
                  {who && <Text variant="caption" muted>Enregistré par {who}</Text>}
                </View>
                <View>
                  <IconButton icon="edit-2" label={`Modifier le biberon de ${formatClock(b.at)}`} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, id: b.id } })} />
                  <IconButton icon="trash-2" label={`Supprimer le biberon de ${formatClock(b.at)}`} onPress={() => remove(b.id, b.at)} />
                </View>
              </Row>
            </Card>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />

      <Sheet visible={summary != null} onClose={() => setSummary(null)} title="Résumé à partager">
        <Row wrap>
          <Button label="Partager" icon="share-2" size="sm" onPress={() => Share.share({ message: summary ?? '', title: `Biberons de ${child?.first_name ?? ''}` }).catch(() => toast('Le partage n’est pas disponible sur cet appareil. Utilisez « Copier ».', 'error'))} />
          <Button label="Copier" icon="copy" size="sm" variant="secondary" onPress={async () => {
            const ok = await copyText(summary ?? '');
            toast(ok ? 'Résumé copié.' : 'Appuyez longuement sur le texte pour le sélectionner et le copier.', ok ? 'success' : 'info');
          }} />
        </Row>
        <View style={{ borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, padding: spacing.sm }}>
          <Text selectable variant="caption">{summary}</Text>
        </View>
      </Sheet>
    </Screen>
  );
}
