/** Historique des biberons d'un enfant : vue jour / semaine, modification, suppression, résumé de consultation. */
import React, { useMemo, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BarChart } from '@/components/Charts';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, IconButton, Loading, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { copyText } from '@/features/bottle';
import { useChildren, useDeleteRow } from '@/lib/data/hooks';
import { useBottleHistory, useRecorderLabel } from '@/lib/data/hooks-bottle';
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
  const { data: children } = useChildren();
  const childId = params.child || children?.[0]?.id || '';
  const child = children?.find((c) => c.id === childId) ?? null;
  const { data: bottles, isLoading } = useBottleHistory(childId, 8);
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
    if (!(await confirm('Supprimer ce biberon ?', `Le biberon de ${formatClock(at)} sera supprimé pour toutes les personnes du foyer.`, 'Supprimer'))) return;
    try {
      await del.mutateAsync(id);
      toast('Biberon supprimé.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Suppression impossible.', 'error');
    }
  }

  function openSummary() {
    if (!child) return;
    setSummary(consultationSummary({ childName: child.first_name, bottles: bottles ?? [], recordedBy: recorder }));
  }

  if (!childId) {
    return (
      <Screen back title="Historique des biberons">
        <Banner tone="info">{'Ajoutez d’abord le profil d’un enfant.'}</Banner>
      </Screen>
    );
  }

  return (
    <Screen back title="Historique des biberons" subtitle={child ? `${child.first_name} · 7 derniers jours` : undefined}>
      {children && children.length > 1 && (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.setParams({ child: c.id })} />)}
        </Row>
      )}
      <Segmented label="Affichage" value={view} onChange={setView} options={[{ value: 'day', label: 'Jour' }, { value: 'week', label: 'Semaine' }]} />

      {isLoading ? <Loading /> : view === 'day' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {days.map((k, i) => (
              <Chip key={k} label={i === 0 ? 'Aujourd’hui' : i === 1 ? 'Hier' : `${shortDay(k)} ${Number(k.slice(8, 10))}`} selected={k === day} onPress={() => setDay(k)} />
            ))}
          </ScrollView>
          <SectionTitle title={`${dayLabel(day)[0].toUpperCase()}${dayLabel(day).slice(1)}`} />
          {!list.length ? (
            <Text muted center style={{ paddingVertical: spacing.lg }}>Aucun biberon enregistré ce jour-là.</Text>
          ) : list.map((b) => {
            const who = recorder(b.created_by);
            return (
              <Card key={b.id}>
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
          })}
        </>
      ) : (
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
      )}

      <Button label="Résumé pour une consultation (7 jours)" icon="file-text" variant="secondary" disabled={!child} onPress={openSummary} />
      <Text variant="caption" muted>Relevé de vos saisies, sans interprétation. Ne remplace pas l’avis d’un professionnel de santé.</Text>

      <Sheet visible={summary != null} onClose={() => setSummary(null)} title="Résumé à partager">
        <Row wrap>
          <Button label="Partager" icon="share-2" size="sm" onPress={() => Share.share({ message: summary ?? '', title: `Biberons de ${child?.first_name ?? ''}` }).catch(() => undefined)} />
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
