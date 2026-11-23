/**
 * 75 — Suivi de l'allaitement mixte · 83 — Analyse des habitudes d'alimentation enregistrées · 84 — Export du journal
 * alimentaire du nourrisson. Vue « Tout le journal » de l'historique des biberons (/bottle/history?scope=all) :
 * tétées, biberons et repas DÉJÀ notés, par jour et par semaine, répartition des prises notées, totaux, heures des
 * prises, export CSV et PDF. Strictement factuel : aucune norme, aucune « bonne quantité », aucun objectif.
 * Les saisies encore hors ligne comptent (marquées « en attente ») ; l'export se fabrique sur l'appareil.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { BarChart } from '@/components/Charts';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, ListGroup, ListRow, Row, Segmented, SectionTitle, Text } from '@/components/ui';
import { BriefStrip } from '@/features/day5/DayParts';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';
import { useLogs } from '@/lib/data/hooks';
import { useRecorderLabel } from '@/lib/data/hooks-bottle';
import { buildTextPdf } from '@/lib/documents/pdf';
import { deliverFile } from '@/lib/deliverFile';
import type { Breastfeed, Bottle, Meal } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { buildEntries, hourBands, journalCsv, journalPdfSections, lastDays, split, sumTotals, totalsOf, weekTotals, type DayTotals, type FeedEntry } from './journal';

const dayTitle = (d: string) => formatDate(`${d}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = (d: string) => formatDate(`${d}T12:00:00`, { weekday: 'short' });

function totalsLine(t: Omit<DayTotals, 'day'>): string {
  return [
    tr('fj.breastCount', { count: t.breast.count }) + (t.breast.withDuration ? ` (${tr('fj.minutes', { n: t.breast.minutes })})` : ''),
    tr('fj.bottleCount', { count: t.bottle.count }) + (t.bottle.withQty ? ` (${tr('fj.ml', { n: t.bottle.ml })})` : ''),
    t.meal.count ? tr('fj.mealCount', { count: t.meal.count }) : null,
  ].filter(Boolean).join(' · ');
}
function entryTitle(e: FeedEntry): string {
  if (e.kind === 'breast') return [tr('fj.kind.breast'), e.side ? tr(`fj.side.${e.side}` as TKey) : null, e.minutes != null ? tr('fj.minutes', { n: e.minutes }) : null].filter(Boolean).join(' · ');
  if (e.kind === 'bottle') return [tr('fj.kind.bottle'), e.ml != null ? (e.mlKind === 'prepared' ? tr('fj.mlPrepared', { n: e.ml }) : tr('fj.ml', { n: e.ml })) : null, e.milk].filter(Boolean).join(' · ');
  return [tr('fj.kind.meal'), e.foods.join(', ') || e.description].filter(Boolean).join(' · ');
}
function entryLine(e: FeedEntry, who: (id: string | null) => string | null): string {
  return [formatTime(e.at), entryTitle(e), e.refused.length ? tr('fj.refused', { list: e.refused.join(', ') }) : null, who(e.by)].filter(Boolean).join(' · ');
}

/** `initialView` : « 7 jours » à l'ouverture depuis « Habitudes d'alimentation » (83, `view=week`). */
export function FeedingJournal({ child, initialView = 'day' }: { child: { id: string; first_name: string }; initialView?: 'day' | 'week' }) {
  const toast = useToast();
  const who = useRecorderLabel();
  const [range, setRange] = useState<7 | 31>(7);
  const bf = useLogs<Breastfeed>('breastfeed', child.id, 31, { includePending: true });
  const bo = useLogs<Bottle>('bottle', child.id, 31, { includePending: true });
  const me = useLogs<Meal>('meal', child.id, 31, { includePending: true });
  const [view, setView] = useState<'day' | 'week'>(initialView);
  const days = useMemo(() => lastDays(7), []);
  const [day, setDay] = useState(days[0]);
  const entries = useMemo(() => buildEntries(bf.data ?? [], bo.data ?? [], me.data ?? []), [bf.data, bo.data, me.data]);
  const loading = (bf.isLoading && !bf.data) || (bo.isLoading && !bo.data) || (me.isLoading && !me.data);
  const failed = (bf.isError && !bf.data) || (bo.isError && !bo.data);
  const week = weekTotals(entries, days);
  const weekSum = sumTotals(week);
  const dayT = totalsOf(entries, day);
  const shown = view === 'day' ? entries.filter((e) => e.day === day) : [];
  const sp = split(view === 'day' ? [dayT] : week);
  const bands = hourBands(entries.filter((e) => days.includes(e.day)));

  async function exportAs(kind: 'csv' | 'pdf') {
    const ds = lastDays(range);
    const list = entries.filter((e) => ds.includes(e.day));
    if (!list.length) return toast(tr('fj.export.empty'), 'info');
    const stamp = new Date().toISOString().slice(0, 10);
    const base = `journal-alimentaire-${child.first_name}-${stamp}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9-]+/g, '-');
    try {
      if (kind === 'csv') {
        const csv = journalCsv(list, {
          date: tr('fj.csv.date'), time: tr('fj.csv.time'), type: tr('fj.csv.type'), duration: tr('fj.csv.duration'), side: tr('fj.csv.side'), quantity: tr('fj.csv.quantity'),
          milk: tr('fj.csv.milk'), foods: tr('fj.csv.foods'), refused: tr('fj.csv.refused'), note: tr('fj.csv.note'), by: tr('fj.csv.by'), prepared: tr('fj.csv.prepared'),
          kinds: { breast: tr('fj.kind.breast'), bottle: tr('fj.kind.bottle'), meal: tr('fj.kind.meal') },
          sides: { left: tr('fj.side.left'), right: tr('fj.side.right'), both: tr('fj.side.both') }, nameOf: (id) => who(id) ?? '',
        });
        await deliverFile(new TextEncoder().encode(csv), `${base}.csv`, 'text/csv', tr('fj.export.title'));
      } else {
        const sum = sumTotals(weekTotals(entries, ds));
        const sections = journalPdfSections(list, ds, { dayTitle, totals: (t) => totalsLine(t), line: (e) => entryLine(e, who), empty: tr('fj.export.emptyDay') });
        const bytes = await buildTextPdf(tr('fj.export.pdfTitle', { name: child.first_name }), [
          tr('fj.export.period', { from: formatDate(`${ds[ds.length - 1]}T12:00:00`), to: formatDate(`${ds[0]}T12:00:00`) }), totalsLine(sum), tr('fj.export.notice'),
        ], sections);
        await deliverFile(bytes, `${base}.pdf`, 'application/pdf', tr('fj.export.title'));
      }
      toast(tr('fj.export.done'), 'success');
    } catch { toast(tr('fj.export.failed'), 'error'); }
  }

  if (loading) return <Skeleton kind="list" rows={4} />;
  if (failed) return <ErrorView error={(bf.error ?? bo.error) as Error} onRetry={() => { void bf.refetch(); void bo.refetch(); void me.refetch(); }} title={tr('fj.loadErr')} />;
  const nothing = !entries.length;
  return (
    <View style={{ gap: spacing.md }} testID="fj-view">
      <Text variant="small" muted>{tr('fj.intro', { name: child.first_name })}</Text>
      {nothing ? (
        <EmptyState icon="coffee" title={tr('fj.emptyTitle')} body={tr('fj.emptyBody')} action={{ label: tr('fj.addFeed'), onPress: () => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id } }) }} />
      ) : (
        <>
          <Segmented label={tr('fj.period')} value={view} onChange={setView} options={[{ value: 'day', label: tr('fj.day'), testID: 'fj-view-day' }, { value: 'week', label: tr('fj.week'), testID: 'fj-view-week' }]} />
          {view === 'day' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {days.map((k, i) => <Chip key={k} label={i === 0 ? tr('fj.today') : i === 1 ? tr('fj.yesterday') : `${shortDay(k)} ${Number(k.slice(8, 10))}`} selected={k === day} onPress={() => setDay(k)} testID={`fj-day-${i}`} />)}
            </ScrollView>
          ) : null}
          <BriefStrip testID="fj-totals" title={view === 'day' ? dayTitle(day) : tr('fj.last7')} items={[
            { value: String((view === 'day' ? dayT : weekSum).breast.count), label: tr('fj.tile.breast', { n: (view === 'day' ? dayT : weekSum).breast.minutes }) },
            { value: String((view === 'day' ? dayT : weekSum).bottle.count), label: tr('fj.tile.bottle', { n: (view === 'day' ? dayT : weekSum).bottle.ml }) },
            { value: String((view === 'day' ? dayT : weekSum).meal.count), label: tr('fj.tile.meal') },
          ]} />
          <Card testID="fj-split">
            <Text weight="bold">{tr('fj.splitTitle')}</Text>
            <Text variant="small" testID="fj-split-line">{sp ? tr('fj.splitLine', { breast: sp.breast, bottle: sp.bottle, nb: sp.breastCount, nbo: sp.bottleCount }) : tr('fj.splitNone')}</Text>
            {(view === 'day' ? dayT : weekSum).breast.count ? (
              <Text variant="caption" muted>{tr('fj.sides', { left: (view === 'day' ? dayT : weekSum).breast.left, right: (view === 'day' ? dayT : weekSum).breast.right, both: (view === 'day' ? dayT : weekSum).breast.both })}</Text>
            ) : null}
          </Card>
          {view === 'day' ? (
            shown.length ? (
              <ListGroup title={dayTitle(day)} testID="fj-list">
                {shown.map((e) => (
                  <ListRow key={`${e.kind}-${e.id}`} icon={e.kind === 'breast' ? 'droplet' : e.kind === 'bottle' ? 'coffee' : 'feather'} title={`${formatTime(e.at)} · ${entryTitle(e)}`}
                    subtitle={[e.refused.length ? tr('fj.refused', { list: e.refused.join(', ') }) : null, e.note, who(e.by), e.pending ? tr('fj.pending') : null].filter(Boolean).join(' · ') || undefined}
                    testID={`fj-row-${e.kind}-${formatTime(e.at).replace(/\D/g, '')}`}
                    onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: e.kind === 'breast' ? 'breastfeed' : e.kind, child: child.id, id: e.id } })} />
                ))}
              </ListGroup>
            ) : <Text variant="small" muted testID="fj-day-empty">{tr('fj.dayEmpty')}</Text>
          ) : (
            <>
              <Card testID="fj-week-chart">
                <Text weight="medium">{tr('fj.chartTitle')}</Text>
                <BarChart data={[...week].reverse().map((d) => ({ label: shortDay(d.day), value: d.feeds }))} unit="" accessibilityLabel={tr('fj.chartA11y')} />
              </Card>
              <ListGroup title={tr('fj.byDay')} testID="fj-week">
                {week.map((d) => <ListRow key={d.day} icon="calendar" title={dayTitle(d.day)} subtitle={d.feeds || d.meal.count ? totalsLine(d) : tr('fj.nothingNoted')} onPress={() => { setDay(d.day); setView('day'); }} />)}
              </ListGroup>
              <Card testID="fj-hours">
                <Text weight="medium">{tr('fj.hoursTitle')}</Text>
                <BarChart data={bands.map((v, i) => ({ label: `${i * 3}h`, value: v }))} unit="" accessibilityLabel={tr('fj.hoursA11y')} />
                <Text variant="caption" muted>{tr('fj.hoursNote')}</Text>
              </Card>
            </>
          )}
          <SectionTitle title={tr('fj.export.title')} />
          <Card testID="fj-export">
            <Text variant="small" muted>{tr('fj.export.intro')}</Text>
            <Row wrap>
              <Chip label={tr('fj.export.r7')} selected={range === 7} onPress={() => setRange(7)} testID="fj-range-7" />
              <Chip label={tr('fj.export.r31')} selected={range === 31} onPress={() => setRange(31)} testID="fj-range-31" />
            </Row>
            <Row wrap>
              <Button label={tr('fj.export.csv')} icon="download" size="sm" variant="secondary" onPress={() => void exportAs('csv')} testID="fj-csv" />
              <Button label={tr('fj.export.pdf')} icon="file-text" size="sm" variant="secondary" onPress={() => void exportAs('pdf')} testID="fj-pdf" />
            </Row>
          </Card>
        </>
      )}
      <Banner tone="info" icon="info">{tr('fj.noNorm')}</Banner>
    </View>
  );
}
