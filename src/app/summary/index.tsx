/**
 * Résumés automatiques d'un profil : jour (gratuit), semaine et avant rendez-vous (Premium), résumé familial (Premium).
 * Seulement les faits enregistrés, sans diagnostic. Export PDF ou partage VOLONTAIRE (quota mensuel côté serveur).
 */
import React, { useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { PremiumSection } from '@/components/Premium';
import { Banner, Button, Card, Chip, Row, SectionTitle, Text } from '@/components/ui';
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

const PERIOD_LABEL: Record<SummaryPeriod, string> = { day: 'Aujourd’hui', week: '7 derniers jours', appointment: 'Avant le rendez-vous' };

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

function SectionsView({ sections }: { sections: SummarySection[] }) {
  if (!sections.length) return <Text muted>Rien n’a été noté sur cette période.</Text>;
  return (
    <View style={{ gap: spacing.xs }}>
      {sections.map((s) => (
        <Card key={s.heading}>
          <Text weight="bold">{s.heading}</Text>
          {s.lines.map((l, i) => <Text key={i} variant="small">{`• ${l}`}</Text>)}
        </Card>
      ))}
    </View>
  );
}

function FamilyDay({ child }: { child: Child }) {
  const { sections } = useChildSections(child, 'day');
  return (
    <View style={{ gap: 4 }} testID={`family-summary-${child.id}`}>
      <SectionTitle title={child.first_name} />
      <SectionsView sections={sections.filter((s) => s.heading !== 'Mesures de croissance (dernières)')} />
    </View>
  );
}

export default function SummaryScreen() {
  const toast = useToast();
  const params = useLocalSearchParams<{ period?: SummaryPeriod; family?: string }>();
  const { subject } = useActiveSubject();
  const { data: children } = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  const [period, setPeriod] = useState<SummaryPeriod>(params.period === 'week' || params.period === 'appointment' ? params.period : 'day');
  const family = params.family === '1' || subject.type === 'family';
  const child = subject.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
  const name = child?.first_name ?? (subject.type === 'pregnancy' ? 'votre grossesse' : null);
  const { sections: childSections, from, next } = useChildSections(child, period);
  const weights = useRows<MaternalWeight>(['maternal_weights', 'summary', pregnancy?.id ?? ''], subject.type === 'pregnancy' && pregnancy ? { table: 'maternal_weights', filters: [eq('pregnancy_id', pregnancy.id)] } : null).data ?? [];
  const allAppts = useAppointments().data ?? [];
  const pregSections: SummarySection[] = useMemo(() => {
    if (subject.type !== 'pregnancy' || !pregnancy) return [];
    const out: SummarySection[] = [];
    const w = weights.filter((x) => Date.parse(x.measured_on) >= from.getTime() - 86_400_000).sort((a, b) => b.measured_on.localeCompare(a.measured_on));
    if (w.length) out.push({ heading: 'Poids noté', lines: w.slice(0, 5).map((x) => `${new Date(x.measured_on).toLocaleDateString('fr-FR')} · ${String(x.weight_kg).replace('.', ',')} kg`) });
    const ap = allAppts.filter((a) => a.pregnancy_id === pregnancy.id && Date.parse(a.starts_at) >= from.getTime()).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 5);
    if (ap.length) out.push({ heading: 'Rendez-vous et examens', lines: ap.map((a) => `${new Date(a.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · ${a.title}`) });
    return out;
  }, [subject.type, pregnancy?.id, weights, allAppts, from.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const sections = subject.type === 'pregnancy' ? pregSections : childSections;

  const summaries = usePremiumAccess('summaries', name);
  const exportAccess = usePremiumAccess('summary_export', name);
  const exportQuota = useQuota('summary_exports_per_month');
  const consume = useConsumeQuota('summary_exports_per_month');
  const [busy, setBusy] = useState(false);
  const title = `Résumé${name ? ` · ${name.replace(/^votre /, '')}` : ''} · ${PERIOD_LABEL[period].toLowerCase()}`;
  const subtitle = `Du ${from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  async function exportPdf(mode: 'pdf' | 'share') {
    setBusy(true);
    try {
      if (!exportAccess.premium) {
        const r = await consume();
        if (!r.allowed) { exportAccess.showPreview(<Text variant="small">{`${sections.length} rubrique(s) prêtes à exporter pour ${name ?? 'ce profil'}.`}</Text>, { used: r.used, quota: r.quota, unit: 'exports' }); return; }
      }
      if (mode === 'share' && Platform.OS !== 'web') {
        await Share.share({ title, message: summaryText(title, subtitle, sections) });
      } else {
        const bytes = await buildTextPdf(title, [subtitle, 'Faits enregistrés par la famille ; aucun diagnostic ni interprétation médicale.'], sections);
        await deliverFile(bytes, `resume-${new Date().toISOString().slice(0, 10)}.pdf`, 'application/pdf', title);
      }
      void exportQuota.refetch();
      toast('Résumé prêt.', 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  if (family) {
    return (
      <Screen back title="Résumé familial du jour" subtitle="Chaque enfant séparément, sans rien mélanger.">
        <PremiumSection feature="family_summary" preview={<Text variant="small">{`${(children ?? []).map((c) => c.first_name).join(', ') || 'Vos enfants'} : repas, sommeil, couches et rendez-vous du jour, chacun dans sa rubrique.`}</Text>}>
          <View style={{ gap: spacing.sm }} testID="family-summary">{(children ?? []).map((c) => <FamilyDay key={c.id} child={c} />)}</View>
        </PremiumSection>
      </Screen>
    );
  }

  const locked = period !== 'day' && !summaries.premium;
  return (
    <Screen back title="Résumé" subtitle={name ? `Pour ${name}` : undefined}
      action={!locked && sections.length && (subject.type === 'child' || subject.type === 'pregnancy')
        ? { label: Platform.OS === 'web' ? 'Télécharger en PDF' : 'Exporter en PDF', icon: 'download', disabled: busy, onPress: () => void exportPdf('pdf'), testID: 'summary-export' } : undefined}>
      <ProfileSwitcher />
      {subject.type === 'child' || subject.type === 'pregnancy' ? (
        <TodaySummary title={PERIOD_LABEL[period]} items={[
          { icon: 'layers', value: String(sections.length), label: sections.length > 1 ? 'Rubriques remplies' : 'Rubrique remplie' },
          { icon: 'list', value: String(sections.reduce((n, x) => n + x.lines.length, 0)), label: 'Éléments notés' },
          { icon: 'download', value: exportAccess.premium ? '∞' : exportQuota.status ? String(exportQuota.status.remaining) : '—', label: 'Exports restants' },
        ]} />
      ) : null}
      {subject.type !== 'child' && subject.type !== 'pregnancy' ? <Banner tone="info">{'Choisissez un enfant ou votre grossesse pour voir son résumé.'}</Banner> : (
        <>
          <View testID="summary-periods"><Row wrap>
            {(['day', 'week', 'appointment'] as SummaryPeriod[]).map((p) => <Chip key={p} label={PERIOD_LABEL[p]} selected={period === p} onPress={() => setPeriod(p)} />)}
          </Row></View>
          {period === 'appointment' && next ? <Text variant="small" muted>{`Prochain rendez-vous : ${next.title}, ${new Date(next.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}</Text> : null}
          <Text variant="caption" muted testID="summary-range">{subtitle}</Text>
          {locked ? (
            <PremiumSection feature="summaries" name={name} preview={<Text variant="small">{`${sections.length} rubrique(s) déjà remplies avec vos saisies (${sections.map((s) => s.heading.toLowerCase()).slice(0, 3).join(', ')}…).`}</Text>}><View /></PremiumSection>
          ) : (
            <View testID="summary-sections"><SectionsView sections={sections} /></View>
          )}
          {!locked && sections.length ? (
            <View style={{ gap: spacing.xs }}>
              <Row wrap>
                {Platform.OS !== 'web' ? <Button label="Partager le texte" icon="share" size="sm" variant="secondary" loading={busy} onPress={() => exportPdf('share')} /> : null}
              </Row>
              {!exportAccess.premium && exportQuota.status ? <Text variant="caption" muted testID="summary-export-left">{`${exportQuota.status.remaining} export(s) gratuit(s) restant(s) ce mois.`}</Text> : null}
            </View>
          ) : null}
          <Text variant="caption" muted>Faits enregistrés par la famille, sans diagnostic ni interprétation médicale. Rien n’est envoyé sans votre action.</Text>
        </>
      )}
    </Screen>
  );
}
