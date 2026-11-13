/**
 * « Je grandis » : suivi bienveillant du développement, par tranche d'âge (données de CET enfant uniquement).
 * Pour chaque étape : observée, en cours d'acquisition, pas encore observée, je ne souhaite pas la suivre, note.
 * Jamais de score, de « retard », d'« échec » ni de comparaison : « Chaque enfant évolue à son propre rythme ».
 * Les âges sont des repères généraux (sources affichées), jamais des dates limites ; aucune étape non observée
 * n'est interprétée. Si quelque chose préoccupe le parent : résumé factuel de ses notes pour le pédiatre.
 * Gratuit : étapes principales, sécurité, sources, résumé à l'écran. Premium : toutes les étapes, activités, PDF.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSurface } from '@/components/Glass';
import { PremiumSection } from '@/components/Premium';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, Icon, Row, SectionTitle, Text, haptic } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useChild, useChildren, useMemberships, usePremium } from '@/lib/data/hooks';
import { openLink } from '@/lib/links';
import { useConsumeQuota, usePremiumAccess } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useChildSteps, useSaveStep } from '@/lib/data/hooks-discoveries';
import { AGE_BANDS, STEP_BY_KEY, STEP_CATEGORIES, STEP_SOURCES, STEPS, type StepCategory, type StepDef, type StepStatus } from '@/content/discoveries/steps';
import { ageInMonths, bandFor, factualSummary, recentObservations, stepAvailable, stepsInBand, type ChildStep } from '@/lib/domain/discoveries';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { buildTextPdf } from '@/lib/documents/pdf';
import { deliverFile } from '@/lib/deliverFile';
import { useUiStore } from '@/lib/store';
import { toFrDate } from '@/lib/validation';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { useTapShield } from '@/features/tapShield';

/** Référence stable : un nouveau tableau à chaque lecture du store provoquerait des rendus sans fin. */
const NO_QUESTIONS: string[] = [];
const STATUSES: StepStatus[] = ['observed', 'in_progress', 'not_yet', 'not_tracked'];
const range = (a: number, b: number) => (b >= 24 && a % 12 === 0 && b % 12 === 0 ? tr('gr.rangeYears', { a: a / 12, b: b / 12 }) : tr('gr.rangeMonths', { a, b }));

export default function Grow() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const premium = usePremium();
  const access = usePremiumAccess('development_full', child?.first_name);
  const stepsQ = useChildSteps(child?.id);
  const today = todayISO();
  const age = child ? ageInMonths(child.birth_date, today) : 0;
  const current = bandFor(age);
  const [band, setBand] = useState(current.key);
  const [cat, setCat] = useState<StepCategory | null>(null);
  const [open, setOpen] = useState<StepDef | null>(null);
  const [summary, setSummary] = useState(false);
  useEffect(() => { setBand(current.key); }, [current.key]);
  const rows = stepsQ.data ?? [];
  const byKey = useMemo(() => new Map(rows.map((r) => [r.step_key, r])), [rows]);
  if (!child) {
    return (
      <Screen back title={tr('gr.title')}>
        {isLoading ? <Skeleton rows={3} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('common.cannotShow')} />
        ) : (
          <EmptyState
            icon="user-x"
            title={tr('alb.notFound')}
            body={tr('cm2.member.notFoundBody')}
            action={{ label: tr('pj.blocked.home'), icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }
  const name = child.first_name;
  const b = AGE_BANDS.find((x) => x.key === band)!;
  const list = stepsInBand(b, cat);
  const recent = recentObservations(rows);

  // Action principale : la prochaine étape de la période en cours qui n'a encore rien de noté (sinon la première)
  const bandSteps = stepsInBand(current, null).filter((s) => stepAvailable(s, premium));
  const nextStep = bandSteps.find((s) => !byKey.get(s.key)) ?? bandSteps[0] ?? null;
  const observedCount = rows.filter((r) => r.status === 'observed').length;
  const progressCount = rows.filter((r) => r.status === 'in_progress').length;

  function openStep(s: StepDef) {
    if (!stepAvailable(s, premium)) return access.showPreview(<Text variant="small">{tr('gr.lockedPreview', { name, step: s.title })}</Text>);
    setOpen(s);
  }

  return (
    <Screen back title={tr('gr.title')} subtitle={tr('gr.subtitle', { name, age: tr('dc.age', { count: age }) })}
      action={nextStep ? { label: tr('mb.gr.action'), icon: 'check-circle', onPress: () => openStep(nextStep), testID: 'gr-main-action' } : undefined}>
      <View testID="grow" />
      <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(201,184,255,0.06)', 'rgba(233,207,164,0.05)'] : ['rgba(247,244,251,0.18)', 'rgba(244,240,250,0.12)', 'rgba(246,236,218,0.08)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: -spacing.md, right: -spacing.md, height: 2200, borderRadius: 32 }} />
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.55)' : 'rgba(255,255,255,0.62)'} depth={2} radius={26} padded={spacing.md}>
        <View style={{ gap: 6 }} testID="gr-hero">
          <Text variant="heading">{tr('gr.heroTitle', { name })}</Text>
          <Text variant="small">{tr('gr.rhythm')}</Text>
        </View>
      </GlassSurface>
      <TodaySummary title={tr('mb.gr.title')} items={[
        { icon: 'check-circle', value: String(observedCount), label: tr('mb.gr.observed') },
        { icon: 'loader', value: String(progressCount), label: tr('mb.gr.inProgress') },
        { icon: 'calendar', value: tr(`gr.band.${current.key}` as TKey), label: tr('mb.gr.band') },
      ]} />

      <SectionTitle title={tr('gr.recent')} />
      {recent.length ? (
        <View style={{ gap: 6 }} testID="gr-recent">
          {recent.map((r) => { const s = STEP_BY_KEY[r.step_key]; return s ? (
            <Tappable key={r.id} accessibilityRole="button" onPress={() => openStep(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}>
              <Icon name={r.status === 'observed' ? 'check-circle' : 'loader'} size={18} color={r.status === 'observed' ? (t.colors.success ?? '#3E8E41') : t.colors.primary} />
              <Text style={{ flex: 1 }}>{s.title}</Text>
              <Text variant="caption" muted>{r.observed_on ? formatDate(`${r.observed_on}T12:00:00`, { day: 'numeric', month: 'short' }) : tr(`gr.status.${r.status}` as TKey)}</Text>
            </Tappable>
          ) : null; })}
        </View>
      ) : <Text muted variant="small">{tr('gr.recentNone', { name })}</Text>}

      <SectionTitle title={tr('gr.byAge')} />
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {AGE_BANDS.map((x) => <Chip key={x.key} label={tr(`gr.band.${x.key}` as TKey) + (x.key === current.key ? ` · ${tr('gr.now')}` : '')} selected={band === x.key} onPress={() => setBand(x.key)} testID={`gr-band-${x.key}`} />)}
      </ScrollView>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip label={tr('gr.cat.all')} selected={!cat} onPress={() => setCat(null)} testID="gr-cat-all" />
        {STEP_CATEGORIES.map((c) => <Chip key={c} label={tr(`gr.cat.${c}` as TKey)} selected={cat === c} onPress={() => setCat(cat === c ? null : c)} testID={`gr-cat-${c}`} />)}
      </ScrollView>

      <View style={{ gap: spacing.sm }} testID="gr-steps">
        {list.length ? list.map((s) => <StepCard key={s.key} s={s} row={byKey.get(s.key)} locked={!stepAvailable(s, premium)} onPress={() => openStep(s)} child={child} />)
          : <Text muted variant="small">{band === '36_72' ? tr('gr.beyond') : tr('gr.noneInBand')}</Text>}
      </View>
      {!premium ? <Text variant="caption" muted testID="gr-free-note">{tr('gr.freeNote')}</Text> : null}

      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.58)'} depth={1} radius={22} padded={spacing.md}>
        <View style={{ gap: 6 }}>
          <Text weight="bold">{tr('gr.summary')}</Text>
          <Text variant="small">{tr('gr.summaryHint')}</Text>
          <Button label={tr('gr.summaryOpen')} icon="file-text" variant="secondary" onPress={() => setSummary(true)} testID="gr-summary" />
        </View>
      </GlassSurface>
      <Banner tone="info" icon="info">{tr('gr.concern')}</Banner>
      <View style={{ gap: 2 }}>
        <Text variant="caption" muted>{tr('gr.sources')}</Text>
        {Object.values(STEP_SOURCES).slice(0, 8).map((s) => <SourceLink key={s.url} s={s} />)}
      </View>

      <StepSheet step={open} row={open ? byKey.get(open.key) : undefined} child={child} premium={premium} onClose={() => setOpen(null)} />
      <SummarySheet visible={summary} onClose={() => setSummary(false)} name={name} age={age} rows={rows} childId={child.id} />
    </Screen>
  );
}

function StepCard({ s, row, locked, onPress, child }: { s: StepDef; row?: ChildStep; locked: boolean; onPress: () => void; child: { id: string; household_id: string; first_name: string } }) {
  const t = useTheme();
  const toast = useToast();
  const save = useSaveStep();
  const st = row?.status;
  // Double appui sur « Observé » : une seule étape enregistrée (l'étape n'est relue qu'après l'envoi)
  const sending = useRef(false);
  const { arm, shielded } = useTapShield();
  /** « Observé » en un geste (date du jour, modifiable ensuite en touchant la carte). */
  async function quickObserved() {
    if (sending.current || shielded()) return;
    sending.current = true;
    try {
      await save.mutateAsync({ child, key: s.key, existing: row ?? null, status: 'observed', date: todayISO(), note: row?.note ?? null });
      arm();
      haptic('success');
      toast(tr('gr.saved'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { sending.current = false; }
  }
  const tint = st === 'observed' ? (t.colors.success ?? '#3E8E41') : st === 'in_progress' ? t.colors.primary : t.colors.textMuted;
  const quick = !locked && st !== 'observed';
  // Le bouton « Observé » est posé SUR la carte et non dedans : un bouton dans un bouton est invalide sur le web
  return (
    <View>
    <Tappable accessibilityRole="button" onPress={onPress} testID={`gr-step-${s.key}`}
      accessibilityLabel={`${s.title}. ${tr('gr.around', { range: range(s.around[0], s.around[1]) })}${st ? `. ${tr(`gr.status.${st}` as TKey)}` : ''}${locked ? `. ${tr('gr.locked')}` : ''}`}>
      <GlassSurface fill={t.isDark ? 'rgba(40,32,70,0.5)' : 'rgba(255,255,255,0.6)'} depth={1} radius={20} padded={spacing.sm + 4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tint }}>
            <Icon name={locked ? 'lock' : st === 'observed' ? 'check' : st === 'in_progress' ? 'loader' : st === 'not_tracked' ? 'eye-off' : 'circle'} size={16} color={tint} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{s.title}</Text>
            <Text variant="caption" muted>{tr(`gr.cat.${s.category}` as TKey)} · {tr('gr.around', { range: range(s.around[0], s.around[1]) })}</Text>
            {st ? <Text variant="caption" color={tint} testID={`gr-status-${s.key}`}>{tr(`gr.status.${st}` as TKey)}</Text> : null}
          </View>
          {quick ? (
            // place réservée (invisible) pour le bouton posé au-dessus
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ paddingHorizontal: 12, paddingVertical: 7, opacity: 0 }}>
              <Text variant="caption" weight="bold">{tr('mb.gr.quickObserved')}</Text>
            </View>
          ) : <Icon name="chevron-right" size={18} color={t.colors.textMuted} />}
        </View>
      </GlassSurface>
    </Tappable>
    {quick ? (
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, right: spacing.sm + 4, justifyContent: 'center' }}>
        <Tappable bare accessibilityRole="button" accessibilityLabel={`${tr('mb.gr.quickObserved')} — ${s.title}`} onPress={() => void quickObserved()} hitSlop={8} testID={`gr-quick-${s.key}`}
          style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: t.colors.primary }}>
          <Text variant="caption" weight="bold" color={t.colors.primaryText}>{tr('mb.gr.quickObserved')}</Text>
        </Tappable>
      </View>
    ) : null}
    </View>
  );
}

function SourceLink({ s }: { s: { label: string; url: string; published?: string } }) {
  const t = useTheme();
  const toast = useToast();
  return (
    <Tappable accessibilityRole="link" onPress={() => openLink(s.url, toast)} style={{ minHeight: 32, justifyContent: 'center' }}>
      <Text variant="caption" color={t.colors.primary}>{s.label}{s.published ? ` (${formatDate(`${s.published}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}</Text>
    </Tappable>
  );
}

function StepSheet({ step, row, child, premium, onClose }: { step: StepDef | null; row?: ChildStep; child: { id: string; household_id: string; first_name: string; birth_date?: string | null }; premium: boolean; onClose: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const save = useSaveStep();
  const questions = useUiStore((s) => s.growQuestions?.[child.id] ?? NO_QUESTIONS);
  const setQuestions = useUiStore((s) => s.setGrowQuestions);
  const [status, setStatus] = useState<StepStatus | null>(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!step) return;
    setStatus(row?.status ?? null); setDate(toFrDate(row?.observed_on ?? todayISO())); setNote(row?.note ?? ''); setErr(null);
  }, [step?.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!step) return <Sheet visible={false} onClose={onClose} title=""><View /></Sheet>;
  const s = step;
  const asked = questions.includes(s.ask);
  async function submit() {
    if (!status) return setErr(tr('gr.pickStatus'));
    const iso = status === 'observed' ? frToISO(date) : null;
    if (status === 'observed' && !iso) return setErr(tr('dc.err.date'));
    if (iso && iso > todayISO()) return setErr(tr('dc.err.future'));
    // Une étape observée ne peut pas précéder la naissance (date saisie à la main)
    if (iso && child.birth_date && iso < child.birth_date) return setErr(tr('u7.child.err.beforeBirth'));
    try {
      await save.mutateAsync({ child, key: s.key, existing: row ?? null, status, date: iso, note: note.trim() || null });
      haptic('success');
      toast(tr('gr.saved'), 'success');
      onClose();
    } catch (e) { setErr(friendlyError(e)); }
  }
  return (
    <Sheet visible onClose={onClose} title={s.title}>
      <View style={{ gap: spacing.sm }} testID="gr-sheet">
        <Text variant="caption" muted>{tr(`gr.cat.${s.category}` as TKey)} · {tr('gr.around', { range: range(s.around[0], s.around[1]) })}</Text>
        <Text variant="caption" muted>{tr('gr.aroundNote')}</Text>
        <Block title={tr('gr.what')} text={s.what} />
        <PremiumSection feature="development_full" name={child.first_name} preview={<Text variant="small">{tr('gr.playPreview')}</Text>} testID="gr-play-locked">
          <Block title={tr('gr.play')} text={s.play} testID="gr-play" />
        </PremiumSection>
        <Block title={tr('gr.safety')} text={s.safety} />
        <View style={{ gap: 4 }}>
          <Text variant="small" weight="bold">{tr('gr.ask')}</Text>
          <Text variant="small">{s.ask}</Text>
          <Button label={asked ? tr('gr.questionRemove') : tr('gr.questionAdd')} size="sm" variant="ghost" icon={asked ? 'check' : 'plus'}
            onPress={() => setQuestions(child.id, asked ? questions.filter((q) => q !== s.ask) : [...questions, s.ask])} testID="gr-ask" />
        </View>
        <SourceLink s={STEP_SOURCES[s.source]} />

        <Text variant="label">{tr('gr.statusLabel')}</Text>
        <Row wrap>{STATUSES.map((x) => <Chip key={x} label={tr(`gr.status.${x}` as TKey)} selected={status === x} onPress={() => setStatus(x)} testID={`gr-st-${x}`} />)}</Row>
        {status === 'observed' ? <Field label={tr('gr.date')} value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" testID="gr-date" /> : null}
        <Field label={tr('gr.note')} optional value={note} onChangeText={setNote} multiline maxLength={1000} testID="gr-note" />
        {err ? <Text variant="small" color={t.colors.danger}>{err}</Text> : null}
        <Button label={tr('common.save')} full loading={save.isPending} onPress={submit} testID="gr-save" />
        {!premium && !s.main ? <Text variant="caption" muted>{tr('gr.locked')}</Text> : null}
      </View>
    </Sheet>
  );
}

function Block({ title, text, testID }: { title: string; text: string; testID?: string }) {
  return <View style={{ gap: 2 }} testID={testID}><Text variant="small" weight="bold">{title}</Text><Text variant="small">{text}</Text></View>;
}

function SummarySheet({ visible, onClose, name, age, rows, childId }: { visible: boolean; onClose: () => void; name: string; age: number; rows: ChildStep[]; childId: string }) {
  const toast = useToast();
  const access = usePremiumAccess('summary_export', name);
  const consume = useConsumeQuota('summary_exports_per_month');
  const questions = useUiStore((s) => s.growQuestions?.[childId] ?? NO_QUESTIONS);
  const [busy, setBusy] = useState(false);
  const lines = factualSummary(name, age, rows, questions);
  async function exportIt(mode: 'pdf' | 'share') {
    setBusy(true);
    try {
      if (mode === 'share' && Platform.OS !== 'web') { await Share.share({ message: lines.join('\n') }); return; }
      if (!access.premium) {
        const r = await consume();
        if (!r.allowed) { access.showPreview(<Text variant="small">{tr('gr.summaryPreview', { name })}</Text>, { used: r.used, quota: r.quota, unit: 'exports' }); return; }
      }
      const bytes = await buildTextPdf(tr('gr.summaryTitle', { name }), [lines[0], tr('gr.summaryNote')], [
        { heading: tr('gr.summaryNotes'), lines: lines.slice(1).filter((l) => l.startsWith('•')) },
        { heading: tr('gr.summaryQuestions'), lines: questions.length ? questions : [tr('gr.summaryNoQuestion')] },
      ]);
      await deliverFile(bytes, `je-grandis-${name.toLowerCase()}-${todayISO()}.pdf`, 'application/pdf', tr('gr.summaryTitle', { name }));
      toast(tr('gr.summaryReady'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('gr.summaryTitle', { name })}>
      <View style={{ gap: spacing.sm }} testID="gr-summary-sheet">
        {lines.map((l, i) => <Text key={i} variant={i === 0 ? 'small' : 'body'} weight={i === 0 ? 'bold' : undefined}>{l}</Text>)}
        {lines.length === 1 && !questions.length ? <Text muted variant="small">{tr('gr.summaryEmpty')}</Text> : null}
        <Text variant="caption" muted>{tr('gr.summaryNote')}</Text>
        <Row wrap>
          <Button label={tr('gr.summaryPdf')} icon="download" size="sm" loading={busy} onPress={() => exportIt('pdf')} testID="gr-summary-pdf" />
          {Platform.OS !== 'web' ? <Button label={tr('gr.summaryShare')} icon="share" size="sm" variant="secondary" loading={busy} onPress={() => exportIt('share')} /> : null}
        </Row>
      </View>
    </Sheet>
  );
}
