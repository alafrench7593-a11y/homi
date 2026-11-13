/** Univers de la grossesse : illustration 3D artistique, semaine par semaine, compte à rebours. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { GlassSurface } from '@/components/Glass';
import { useTheme } from '@/theme/ThemeProvider';
import { FetusArt } from '@/components/FetusArt';
import { WeeksRing } from '@/components/DayClock';
import { ProgressRing } from '@/components/Charts';
import { Banner, Button, Card, Chip, Field, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useAppointments, useExpectedBabies, useInvalidate, useJourneyState, usePregnancies, useProfile, useRows } from '@/lib/data/hooks';
import { useUiStore } from '@/lib/store';
import { friendlyError } from '@/lib/data/hooks-settings';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { FETAL_SIZE_SOURCE, formatLength, formatWeight, weekInfo } from '@/lib/domain/fetalWeeks';
import type { ExpectedBaby } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr, formatDate, getLocale } from '@/i18n';

// HOMI : lilas d'abord (un seul bébé), puis champagne et mauve pour les jumeaux et triplés
const HUES = ['lavande', 'or', 'rose'] as const;
const multLabel = (m: string) => tr(`u2.preg.mult_${m}` as never);
const countdownText = (days: number) => {
  if (days > 1) {
    const w = Math.floor(days / 7);
    const d = days % 7;
    if (w === 0) return tr('u2.preg.cd_days', { count: d });
    return `${tr('u2.preg.cd_weeks', { count: w })}${d ? ` ${tr('u2.preg.cd_and_days', { count: d })}` : ''}`;
  }
  if (days === 1) return tr('u2.preg.cd_tomorrow');
  if (days === 0) return tr('u2.preg.cd_today');
  return tr('u2.preg.cd_after', { count: -days });
};


type Rubric = { key: string; icon: Parameters<typeof Icon>[0]['name']; title: string; subtitle?: string; to: string | { pathname: string; params?: Record<string, string> } };
/** Les rubriques de « Ma grossesse », dans l'ordre demandé ; chacune ouvre un écran existant. */
function rubrics(showWeight: boolean, docs: number): Rubric[] {
  return [
    { key: 'week', icon: 'star', title: tr('u2.preg.r_week'), subtitle: tr('u2.preg.r_week_sub'), to: '#week' },
    { key: 'body', icon: 'heart', title: tr('u2.preg.r_body'), subtitle: tr('u2.preg.r_body_sub'), to: { pathname: '/library', params: { cat: 'grossesse' } } },
    ...(showWeight ? [{ key: 'weight', icon: 'trending-up', title: tr('u2.preg.r_weight'), subtitle: tr('u2.preg.r_weight_sub'), to: '/pregnancy/weight' } as Rubric] : []),
    { key: 'sleep', icon: 'moon', title: tr('u2.preg.r_sleep'), subtitle: tr('u2.preg.r_sleep_sub'), to: '/me/sleep' },
    { key: 'mood', icon: 'smile', title: tr('u2.preg.r_mood'), subtitle: tr('u2.preg.r_mood_sub'), to: '/me/mood' },
    { key: 'feel', icon: 'feather', title: tr('u2.preg.r_feel'), subtitle: tr('u2.preg.r_feel_sub'), to: '/pregnancy/feel' },
    { key: 'meals', icon: 'coffee', title: tr('u2.preg.r_eat'), subtitle: tr('u2.preg.r_eat_sub'), to: '/pregnancy/eat' },
    { key: 'appointments', icon: 'calendar', title: tr('u2.preg.r_appts'), to: { pathname: '/appointments', params: { for: 'pregnancy' } } },
    { key: 'calendar', icon: 'clipboard', title: tr('u2.preg.r_cal'), subtitle: tr('u2.preg.r_cal_sub'), to: '/pregnancy/calendar' },
    { key: 'docs', icon: 'folder', title: tr('u2.preg.r_docs'), subtitle: docs ? tr('u2.preg.r_docs_count', { count: docs }) : undefined, to: '/documents' },
    { key: 'birth', icon: 'book-open', title: tr('u2.preg.r_birth'), subtitle: tr('u2.preg.r_birth_sub'), to: { pathname: '/library', params: { cat: 'accouchement' } } },
    { key: 'lists', icon: 'check-square', title: tr('u2.preg.r_lists'), subtitle: tr('u2.preg.r_lists_sub'), to: '/lists' },
    { key: 'names', icon: 'type', title: tr('u2.preg.r_names'), to: '/names' },
    { key: 'articles', icon: 'book', title: tr('u2.preg.r_articles'), to: { pathname: '/library', params: { journey: 'pregnant' } } },
    { key: 'assistant', icon: 'message-circle', title: tr('u2.preg.r_ai'), subtitle: tr('u2.preg.r_ai_sub'), to: '/(tabs)/ask' },
    { key: 'community', icon: 'users', title: tr('u2.preg.r_community'), to: '/(tabs)/community' },
    { key: 'supplement', icon: 'bell', title: tr('u2.preg.r_supp'), subtitle: tr('u2.preg.r_supp_sub'), to: { pathname: '/settings/reminders', params: { new: 'supplement' } } },
  ];
}
// Minuit HOMI : champagne, perle, lilas grisé (≥ 4,5:1 sur le fond sombre)
const GOLD = '#E9CFA4';
const TEXT = '#F7F4FB';
const MUTED = '#C3B8DD';

function BabyNotes({ baby }: { baby: ExpectedBaby }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [nickname, setNickname] = useState(baby.nickname ?? '');
  const [notes, setNotes] = useState(baby.notes ?? '');
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await backend.update('expected_babies', { nickname: nickname.trim() || null, notes: notes.trim() || null }, [eq('id', baby.id)]);
      inv('expected_babies');
      toast(tr('u2.preg.saved'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card>
      <Text weight="bold">{tr('u2.preg.baby_n', { n: baby.position })}</Text>
      <Field label={tr('u2.preg.nickname')} optional value={nickname} onChangeText={setNickname} maxLength={40} />
      <Field label={tr('u2.preg.notes')} optional value={notes} onChangeText={setNotes} multiline maxLength={4000} />
      <Button label={tr('u2.preg.save')} size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} loading={saving} onPress={save} />
    </Card>
  );
}

export default function PregnancyUniverse() {
  const th = useTheme();
  const heroGold = th.isDark ? GOLD : th.colors.gold;
  const heroText = th.isDark ? TEXT : th.colors.text;
  const heroMuted = th.isDark ? MUTED : th.colors.textMuted;
  const pregnanciesQ = usePregnancies();
  // Seule la grossesse d'un parcours « grossesse » actif s'affiche (jamais une ancienne grossesse)
  const js = useJourneyState();
  const pregnancy = pregnanciesQ.data?.find((x) => x.status === 'active' && js.pregnancyIds.includes(x.id)) ?? null;
  const { data: babies } = useExpectedBabies(pregnancy?.id);
  const { data: profile } = useProfile();
  const p = pregnancy ? pregnancyProgress(pregnancy.due_date) : null;
  const [week, setWeek] = useState<number | null>(null);
  const [selected, setSelected] = useState(0);
  const simple = useUiStore((st) => st.simpleMode);
  const { setSubject } = useActiveSubject();
  const [allRubrics, setAllRubrics] = useState(false);
  const { data: appts } = useAppointments({ upcomingOnly: true });
  const { data: docs } = useRows<{ id: string }>(['documents', 'preg', pregnancy?.id ?? ''], pregnancy ? { table: 'documents', filters: [eq('pregnancy_id', pregnancy.id)] } : null);

  if (pregnanciesQ.isLoading && !pregnanciesQ.data) {
    return <Screen back title={tr('u2.preg.title')}><Skeleton kind="card" rows={3} /></Screen>;
  }
  if (pregnanciesQ.isError && !pregnanciesQ.data) {
    return <Screen back title={tr('u2.preg.title')}><ErrorView error={pregnanciesQ.error} onRetry={() => void pregnanciesQ.refetch()} /></Screen>;
  }
  if (!pregnancy || !p) {
    return (
      <Screen back title={tr('u2.preg.title')}>
        <EmptyState icon="heart" title={tr('u2.preg.none')} body={tr('u2.preg.none_body')} action={{ label: tr('u2.preg.add'), onPress: () => router.replace('/profiles/new') }} />
      </Screen>
    );
  }
  const w = week ?? p.weeksSA;
  const info = weekInfo(w);
  const n = Math.max(1, babies?.length ?? 1);
  const multiple = pregnancy.multiplicity !== 'single' && pregnancy.multiplicity !== 'unknown';

  const nextAppt = (appts ?? []).filter((x) => x.pregnancy_id === pregnancy.id && Date.parse(x.starts_at) >= Date.now()).sort((x, y) => x.starts_at.localeCompare(y.starts_at))[0];

  return (
    <Screen back stars
      action={{ label: tr('u2.preg.how_feel'), icon: 'feather', onPress: () => { setSubject({ type: 'pregnancy', id: pregnancy.id }); router.push('/pregnancy/feel'); }, testID: 'preg-main-action' }}>
      {/* carte transparente : le fond de l'application (vidéo jour / nuit) reste visible derrière le bébé */}
      <View style={{ paddingVertical: spacing.md, gap: spacing.sm }} testID="preg-hero">
        <Text variant="small" color={heroGold} center>{multLabel(pregnancy.multiplicity)}</Text>
        <Text variant="hero" color={heroText} center>{w} {tr('f5.wksShort')}</Text>
        <Text center color={heroMuted}>{tr('u2.preg.weeks_trimester', { weeks: Math.max(0, w - 2), trimester: w < 15 ? 1 : w < 29 ? 2 : 3 })}</Text>
        <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
          <WeeksRing week={w} size={310}><FetusArt week={w} growth={info.growth} size={n > 1 ? 220 : 250} hue={HUES[selected % 3]} accessibilityLabel={babies?.[selected]?.nickname ? tr('u2.preg.art_a11y_named', { name: babies[selected].nickname as string, week: w }) : tr('u2.preg.art_a11y', { week: w })} /></WeeksRing>
        </View>
        {n > 1 && (
          <Row wrap style={{ justifyContent: 'center' }}>
            {babies!.map((b, i) => <Chip key={b.id} label={b.nickname ?? tr('u2.preg.baby_n', { n: b.position })} selected={selected === i} onPress={() => setSelected(i)} />)}
          </Row>
        )}
        <Text center color={heroText}>{tr('u2.preg.size_of')}<Text weight="bold" color={heroGold}>{info.compare.replace(/^une? /, (m) => m === 'une ' ? 'une ' : 'un ')}</Text></Text>
        <Text center variant="small" color={heroMuted} testID="fetal-size">{tr('u2.preg.avg_size', { length: formatLength(info.lengthCm), weight: formatWeight(info.weightG) })}</Text>
        <Text center variant="caption" color={heroMuted} testID="fetal-source">{tr('u2.preg.source', { name: FETAL_SIZE_SOURCE.name, date: formatDate(FETAL_SIZE_SOURCE.updatedOn, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) })}</Text>
        <Text center variant="caption" color={heroMuted}>{tr('u2.preg.illustration_note')}</Text>
        {multiple && <Text center variant="caption" color={heroMuted}>{tr('u2.preg.multiple_note')}</Text>}
      </View>

      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} accessibilityLabel={tr('u2.preg.choose_week')}>
        {Array.from({ length: 39 }, (_, i) => i + 4).map((s) => (
          <Tappable key={s} accessibilityRole="button" accessibilityState={{ selected: s === w }} accessibilityLabel={tr('u2.preg.week_n', { n: s })} onPress={() => setWeek(s === p.weeksSA ? null : s)} style={{ width: 46, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: s === w ? th.colors.primary : s === p.weeksSA ? th.colors.accentSoft : 'transparent', borderWidth: 1, borderColor: th.isDark ? 'rgba(205,190,250,0.33)' : 'rgba(91,42,134,0.25)' }}>
            <Text variant="small" weight="bold" color={s === w ? th.colors.primaryText : undefined}>{s}</Text>
          </Tappable>
        ))}
      </ScrollView>
      {week !== null && <Button label={tr('u2.preg.back_to_week')} variant="ghost" size="sm" onPress={() => setWeek(null)} />}

      <Row style={{ gap: spacing.md }}>
        <ProgressRing progress={p.progress} size={96} label={tr('u2.preg.progress_a11y', { pct: Math.round(p.progress * 100) })}>
          <Text variant="heading">{Math.round(p.progress * 100)}%</Text>
        </ProgressRing>
        <View style={{ flex: 1 }}>
          <TodaySummary title={tr('u2.preg.due_term')} items={[
            { icon: 'calendar', value: formatDate(pregnancy.due_date, { day: 'numeric', month: 'long', timeZone: 'UTC' }), label: pregnancy.due_date_source === 'lmp' ? tr('u2.preg.est_lmp') : tr('u2.preg.date_by_you') },
            { icon: 'clock', value: p.daysToDue > 0 ? `J-${p.daysToDue}` : '—', label: countdownText(p.daysToDue) },
          ]} />
        </View>
      </Row>

      <SectionTitle title={tr('u2.preg.baby_this_week')} />
      <Card>{info.baby.map((b) => <Row key={b} style={{ alignItems: 'flex-start', paddingVertical: 4 }}><Icon name="star" size={14} /><Text style={{ flex: 1 }}>{b}</Text></Row>)}</Card>
      <SectionTitle title={tr('u2.preg.you_maybe')} />
      <Card tone="soft">{info.mother.map((m) => <Row key={m} style={{ alignItems: 'flex-start', paddingVertical: 4 }}><Icon name="heart" size={14} /><Text style={{ flex: 1 }}>{m}</Text></Row>)}</Card>
      <Banner tone="warning">{tr('u2.preg.warning')}</Banner>

      <Card onPress={() => router.push({ pathname: '/appointments', params: { for: 'pregnancy' } })} accessibilityLabel={tr('u2.preg.next_appt_a11y')}>
        <View testID="preg-next-appt"><ListRow icon="calendar" title={nextAppt ? nextAppt.title : tr('u2.preg.no_appt')} subtitle={nextAppt ? formatDate(nextAppt.starts_at, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : tr('u2.preg.add_appt')} /></View>
      </Card>

      <SectionTitle title={tr('u2.preg.my_pregnancy')} />
      <View style={{ gap: spacing.sm }}>
        {(() => {
          const list = rubrics(!profile?.hide_weight_module, docs?.length ?? 0);
          const shown = simple && !allRubrics ? list.slice(0, 6) : list;
          return (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {shown.map((r) => (
                  <View key={r.key} testID={`preg-rubric-${r.key}`} style={{ flexBasis: '47%', flexGrow: 1 }}>
                    <Tappable accessibilityRole="button" accessibilityLabel={r.subtitle ? `${r.title}. ${r.subtitle}` : r.title}
                      onPress={() => { if (r.to === '#week') { setWeek(null); return; } setSubject({ type: 'pregnancy', id: pregnancy.id }); router.push(r.to as never); }}>
                      <GlassSurface fill={th.colors.surface} depth={1} radius={20}>
                        <View style={{ padding: spacing.md, gap: 6, minHeight: 92 }}>
                          <Icon name={r.icon} size={20} color={th.colors.primary} />
                          <Text weight="bold" numberOfLines={2}>{r.title}</Text>
                          {r.subtitle ? <Text variant="caption" muted numberOfLines={1}>{r.subtitle}</Text> : null}
                        </View>
                      </GlassSurface>
                    </Tappable>
                  </View>
                ))}
              </View>
              {simple && list.length > 6 ? <Button label={allRubrics ? tr('u2.preg.see_less') : tr('u2.preg.see_more', { count: list.length - 6 })} variant="ghost" size="sm" onPress={() => setAllRubrics((v) => !v)} testID="preg-rubrics-more" /> : null}
            </>
          );
        })()}
        <ListRow icon="edit-3" title={tr('u2.preg.edit')} subtitle={tr('u2.preg.edit_sub')} onPress={() => router.push('/pregnancy/edit')} />
      </View>

      {multiple && (
        <>
          <SectionTitle title={tr('u2.preg.each_baby')} />
          {babies?.map((b) => <BabyNotes key={b.id} baby={b} />)}
          <Card tone="lavender" onPress={() => router.push({ pathname: '/assistant/chat', params: { q: tr('u2.preg.q_multiple') } })}>
            <Text weight="bold">{tr('u2.preg.q_title')}</Text>
            <Text variant="small" muted>{tr('u2.preg.q_sub')}</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
