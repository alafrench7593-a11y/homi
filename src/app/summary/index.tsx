/**
 * Résumés automatiques d'un profil : jour (gratuit), semaine et avant rendez-vous (Premium), résumé familial (Premium).
 * Seulement les faits enregistrés, sans diagnostic. Export PDF ou partage VOLONTAIRE (quota mensuel côté serveur).
 */
import React, { useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BriefStrip, DayList, DayRow, DaySection, DaySeparator, type DayRowSpec } from '@/features/day5/DayParts';
import { byClock, splitTimed } from '@/features/day5/summaryLines';
import { PremiumSection } from '@/components/Premium';
import { Banner, Button, Chip, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { ProfileSwitcher } from '@/components/Family';
import { buildTextPdf } from '@/lib/documents/pdf';
import { deliverFile } from '@/lib/deliverFile';
import { useActivePregnancy, useActiveSubject, useAppointments, useLogs, useMeasurements, useRows, useTrackedChildren } from '@/lib/data/hooks';
import { useTreatmentLogs, useTreatments } from '@/lib/data/hooks-needs';
import { useConsumeQuota, usePremiumAccess, useQuota } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { eq } from '@/lib/backend';
import { childSummary, periodStart, summaryText, type SummaryPeriod, type SummarySection } from '@/lib/domain/summary';
import type { Bottle, Breastfeed, Child, Diaper, MaternalWeight, Meal, Observation, Sleep } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate } from '@/i18n';

const periodLabel = (p: SummaryPeriod): string => tr(p === 'day' ? 'u7.summary.today' : p === 'week' ? 'u7.summary.week' : 'u7.summary.appointment');
const LONG_DT: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };

function useChildSections(child: Child | null, period: SummaryPeriod) {
  const id = child?.id;
  const days = period === 'day' ? 1 : 31;
  const bottles = useLogs<Bottle>('bottle', id, days).data ?? [];
  const feeds = useLogs<Breastfeed>('breastfeed', id, days).data ?? [];
  const sleeps = useLogs<Sleep>('sleep', id, days).data ?? [];
  const diapers = useLogs<Diaper>('diaper', id, days).data ?? [];
  const meals = useLogs<Meal>('meal', id, days).data ?? [];
  const observations = useLogs<Observation>('observation', id, days).data ?? [];
  const treatments = useTreatments(id).data ?? [];
  const now = new Date();
  const appts = (useAppointments().data ?? []).filter((a) => a.child_id === id);
  const lastPast = appts.filter((a) => Date.parse(a.starts_at) < now.getTime()).sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0]?.starts_at ?? null;
  const from = periodStart(period, now, lastPast);
  const treatmentLogs = useTreatmentLogs(treatments.map((t) => t.id), from.toISOString()).data ?? [];
  const measurements = (useMeasurements(id).data ?? []) as never[];
  const next = appts.filter((a) => Date.parse(a.starts_at) >= now.getTime()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null;
  const sections = child ? childSummary({ bottles, feeds, sleeps, diapers, meals, observations, treatments, treatmentLogs, appointments: appts, measurements }, from, new Date(now.getTime() + 60_000)) : [];
  return { sections, from, next };
}

/**
 * Rubriques du résumé : un groupe par rubrique (titre au-dessus, une surface, filets fins). Le total d'abord, puis
 * les faits horodatés en chronologie à horaires ALIGNÉS (colonne d'heures tabulaires, fil fin), du plus tôt au plus tard.
 */
function SectionsView({ sections, timeline }: { sections: SummarySection[]; timeline?: boolean }) {
  if (!sections.length) return <Text muted>{tr('u7.summary.empty')}</Text>;
  return (
    <View style={{ gap: spacing.md }}>
      {sections.map((s) => {
        const timed = timeline ? s.lines.map((l) => ({ l, x: splitTimed(l) })) : s.lines.map((l) => ({ l, x: null }));
        const facts = timed.filter((r) => !r.x).map((r) => r.l);
        const rows: DayRowSpec[] = timed.filter((r) => r.x).map((r, i) => ({ key: `${i}-${r.l}`, time: r.x!.time, title: r.x!.text, state: 'later' as const, pill: null }))
          .sort((a, b) => byClock(a.time, b.time));
        return (
          <DaySection key={s.heading} title={s.heading}>
            <DayList>
              {facts.map((l, i) => (
                <View key={`f${i}`}>
                  {i ? <DaySeparator /> : null}
                  <Text style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>{l}</Text>
                </View>
              ))}
              {rows.map((r, i) => (
                <React.Fragment key={r.key}>
                  {i || facts.length ? <DaySeparator /> : null}
                  <DayRow r={r} first={i === 0} last={i === rows.length - 1} />
                </React.Fragment>
              ))}
            </DayList>
          </DaySection>
        );
      })}
    </View>
  );
}

function FamilyDay({ child }: { child: Child }) {
  const { sections } = useChildSections(child, 'day');
  return (
    <View style={{ gap: 4 }} testID={`family-summary-${child.id}`}>
      <SectionTitle title={child.first_name} />
      <SectionsView timeline sections={sections.filter((s) => s.heading !== tr('l7.sum.h_growth'))} />
    </View>
  );
}

export default function SummaryScreen() {
  const toast = useToast();
  const params = useLocalSearchParams<{ period?: SummaryPeriod; family?: string }>();
  const { subject } = useActiveSubject();
  const { data: children } = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  // Période gardée dans l'adresse (`?period=`) : ouvrir une mini-app puis revenir retrouve la même période
  const period: SummaryPeriod = params.period === 'week' || params.period === 'appointment' ? params.period : 'day';
  const setPeriod = (p: SummaryPeriod) => router.setParams({ period: p === 'day' ? undefined : p } as never);
  const family = params.family === '1' || subject.type === 'family';
  const child = subject.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
  const name = child?.first_name ?? (subject.type === 'pregnancy' ? tr('u7.summary.yourPregnancy') : null);
  const shortName = child?.first_name ?? (subject.type === 'pregnancy' ? tr('u7.summary.pregnancyShort') : null);
  const { sections: childSections, from, next } = useChildSections(child, period);
  const weights = useRows<MaternalWeight>(['maternal_weights', 'summary', pregnancy?.id ?? ''], subject.type === 'pregnancy' && pregnancy ? { table: 'maternal_weights', filters: [eq('pregnancy_id', pregnancy.id)] } : null).data ?? [];
  const allAppts = useAppointments().data ?? [];
  const pregSections: SummarySection[] = useMemo(() => {
    if (subject.type !== 'pregnancy' || !pregnancy) return [];
    const out: SummarySection[] = [];
    const w = weights.filter((x) => Date.parse(x.measured_on) >= from.getTime() - 86_400_000).sort((a, b) => b.measured_on.localeCompare(a.measured_on));
    if (w.length) out.push({ heading: tr('u7.summary.weightNoted'), lines: w.slice(0, 5).map((x) => `${formatDate(x.measured_on)} · ${String(x.weight_kg).replace('.', ',')} kg`) });
    const ap = allAppts.filter((a) => a.pregnancy_id === pregnancy.id && Date.parse(a.starts_at) >= from.getTime()).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 5);
    if (ap.length) out.push({ heading: tr('u7.summary.apptsExams'), lines: ap.map((a) => `${formatDate(a.starts_at, LONG_DT)} · ${a.title}`) });
    return out;
  }, [subject.type, pregnancy?.id, weights, allAppts, from.getTime(), tr('u7.summary.weightNoted')]); // eslint-disable-line react-hooks/exhaustive-deps
  const sections = subject.type === 'pregnancy' ? pregSections : childSections;

  const summaries = usePremiumAccess('summaries', name);
  const exportAccess = usePremiumAccess('summary_export', name);
  const exportQuota = useQuota('summary_exports_per_month');
  const consume = useConsumeQuota('summary_exports_per_month');
  const [busy, setBusy] = useState(false);
  const title = `${tr('u7.summary.titleBase')}${shortName ? ` · ${shortName}` : ''} · ${periodLabel(period).toLowerCase()}`;
  const subtitle = tr('u7.summary.range', { from: formatDate(from, { day: 'numeric', month: 'long' }), to: formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' }) });

  async function exportPdf(mode: 'pdf' | 'share') {
    setBusy(true);
    try {
      if (!exportAccess.premium) {
        const r = await consume();
        if (!r.allowed) { exportAccess.showPreview(<Text variant="small">{tr('u7.summary.previewReady', { count: sections.length, name: name ?? tr('u7.summary.thisProfile') })}</Text>, { used: r.used, quota: r.quota, unit: tr('u7.summary.exportsUnit') }); return; }
      }
      if (mode === 'share' && Platform.OS !== 'web') {
        await Share.share({ title, message: summaryText(title, subtitle, sections) });
      } else {
        const bytes = await buildTextPdf(title, [subtitle, tr('u7.summary.pdfNote')], sections);
        await deliverFile(bytes, `resume-${new Date().toISOString().slice(0, 10)}.pdf`, 'application/pdf', title);
      }
      void exportQuota.refetch();
      toast(tr('u7.summary.ready'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  if (family) {
    return (
      <Screen back title={tr('u7.summary.familyTitle')} subtitle={tr('u7.summary.familySub')}>
        <PremiumSection feature="family_summary" preview={<Text variant="small">{tr('u7.summary.familyPreview', { names: (children ?? []).map((c) => c.first_name).join(', ') || tr('u7.summary.yourChildren') })}</Text>}>
          <View style={{ gap: spacing.sm }} testID="family-summary">{(children ?? []).map((c) => <FamilyDay key={c.id} child={c} />)}</View>
        </PremiumSection>
      </Screen>
    );
  }

  const locked = period !== 'day' && !summaries.premium;
  return (
    <Screen back title={tr('u7.summary.titleBase')} subtitle={name ? tr('u7.summary.forName', { name }) : undefined}
      action={!locked && sections.length && (subject.type === 'child' || subject.type === 'pregnancy')
        ? { label: Platform.OS === 'web' ? tr('u7.summary.downloadPdf') : tr('u7.summary.exportPdf'), icon: 'download', disabled: busy, onPress: () => void exportPdf('pdf'), testID: 'summary-export' } : undefined}>
      <ProfileSwitcher />
      {subject.type === 'child' || subject.type === 'pregnancy' ? (
        <BriefStrip title={periodLabel(period)} testID="summary-brief" items={[
          { value: String(sections.length), label: tr('u7.summary.sectionsFilled', { count: sections.length }) },
          { value: String(sections.reduce((n, x) => n + x.lines.length, 0)), label: tr('u7.summary.itemsLogged') },
        ]} />
      ) : null}
      {subject.type !== 'child' && subject.type !== 'pregnancy' ? <Banner tone="info">{tr('u7.summary.pickProfile')}</Banner> : (
        <>
          <View testID="summary-periods"><Row wrap>
            {(['day', 'week', 'appointment'] as SummaryPeriod[]).map((p) => <Chip key={p} label={periodLabel(p)} selected={period === p} onPress={() => setPeriod(p)} testID={`summary-period-${p}`} />)}
          </Row></View>
          {period === 'appointment' && next ? <Text variant="small" muted>{tr('u7.summary.nextAppt', { title: next.title, date: formatDate(next.starts_at, LONG_DT) })}</Text> : null}
          <Text variant="caption" muted testID="summary-range">{subtitle}</Text>
          {locked ? (
            <PremiumSection feature="summaries" name={name} preview={<Text variant="small">{tr('u7.summary.lockedPreview', { count: sections.length, list: sections.map((s) => s.heading.toLowerCase()).slice(0, 3).join(', ') })}</Text>}><View /></PremiumSection>
          ) : (
            <View testID="summary-sections"><SectionsView sections={sections} timeline={period === 'day'} /></View>
          )}
          {!locked && sections.length ? (
            <View style={{ gap: spacing.xs }}>
              <Row wrap>
                {Platform.OS !== 'web' ? <Button label={tr('u7.summary.shareText')} icon="share" size="sm" variant="secondary" loading={busy} onPress={() => exportPdf('share')} /> : null}
              </Row>
              {!exportAccess.premium && exportQuota.status ? <Text variant="caption" muted testID="summary-export-left">{tr('u7.summary.freeLeft', { count: exportQuota.status.remaining })}</Text> : null}
            </View>
          ) : null}
          <Text variant="caption" muted>{tr('u7.summary.footer')}</Text>
        </>
      )}
    </Screen>
  );
}
