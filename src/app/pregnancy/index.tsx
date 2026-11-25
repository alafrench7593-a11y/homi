/**
 * Semaine de grossesse (HOMI v5 « Lumière corail ») : la semaine (SA) EN GRAND, l'illustration 3D du bébé sur un
 * halo corail localisé (image fixe : écran de suivi lu), la PROGRESSION (trimestres, jalons), les CHIFFRES de la
 * semaine (taille, poids, comparaison) et ce qui est À VENIR (rendez-vous, terme), puis les rubriques de « Ma
 * grossesse » en liste. Une action principale en bas : « Comment je me sens ».
 * 22/11/2026 : semaine explorée dans l'adresse (« ?week= ») ; terme corrigé dans une fiche (DueDateFix) ; repères sur
 * une Card (verre commun) au lieu d'un cadre fait main.
 */
import { AuraQuickBar } from '@/features/aura/AuraEntry';
import { SectionIntro } from '@/features/aura/SectionIntro';
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import { Banner, Button, Card, Chip, Field, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { WeekFigures, WeekHero, WeekPicker, WeekProgress } from '@/features/pregnancyWeek/WeekParts';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useAppointments, useExpectedBabies, useInvalidate, useJourneyState, usePregnancies, useProfile, useRows } from '@/lib/data/hooks';
import { useUiStore } from '@/lib/store';
import { friendlyError } from '@/lib/data/hooks-settings';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { FETAL_SIZE_SOURCE, weekInfo } from '@/lib/domain/fetalWeeks';
import type { ExpectedBaby } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate, getLocale } from '@/i18n';
import { ToolLinks } from '@/features/toolHub/ToolLinks';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { DueDateFix } from '@/features/restTrack/DueDateFix';
import { weekParam } from '@/lib/domain/restTrack';

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


/**
 * Raccourcis de « Ma grossesse », dans l'ordre demandé : des identifiants du registre central uniquement. Nom,
 * description, pictogramme, destination, accès et favori viennent du catalogue (`ToolLinks`).
 */
const PREGNANCY_SHORTCUTS = ['preg_weight', 'preg_feel', 'preg_eat', 'preg_calendar', 'appointments', 'preg_lists', 'preg_names', 'sleep', 'mood', 'documents',
  'library.pregnancy', 'library.birth', 'ask'] as const;

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
  const pregnanciesQ = usePregnancies();
  // Seule la grossesse d'un parcours « grossesse » actif s'affiche (jamais une ancienne grossesse)
  const js = useJourneyState();
  const pregnancy = pregnanciesQ.data?.find((x) => x.status === 'active' && js.pregnancyIds.includes(x.id)) ?? null;
  const { data: babies } = useExpectedBabies(pregnancy?.id);
  const { data: profile } = useProfile();
  const p = pregnancy ? pregnancyProgress(pregnancy.due_date) : null;
  // 22/11/2026 : semaine explorée gardée dans l'adresse (« ?week=24 ») : ouvrir une rubrique puis revenir la retrouve
  const qp = useLocalSearchParams<{ week?: string }>();
  const pickedWeek = weekParam(qp.week);
  const setWeek = (w: number | null) => router.setParams({ week: w == null ? undefined : String(w) } as never);
  const [selected, setSelected] = useState(0);
  const simple = useUiStore((st) => st.simpleMode);
  const { setSubject } = useActiveSubject();
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
  const week = pickedWeek != null && pickedWeek !== p.weeksSA ? pickedWeek : null;
  const w = week ?? p.weeksSA;
  const info = weekInfo(w);
  const n = Math.max(1, babies?.length ?? 1);
  const multiple = pregnancy.multiplicity !== 'single' && pregnancy.multiplicity !== 'unknown';
  const dueDate = formatDate(pregnancy.due_date, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const named = babies?.[selected]?.nickname;
  const go = (to: string) => { setSubject({ type: 'pregnancy', id: pregnancy.id }); router.push(to as never); };

  const nextAppt = (appts ?? []).filter((x) => x.pregnancy_id === pregnancy.id && Date.parse(x.starts_at) >= Date.now()).sort((x, y) => x.starts_at.localeCompare(y.starts_at))[0];
  const subject = { type: 'pregnancy' as const, id: pregnancy.id };

  return (
    <Screen back
      action={{ label: tr('u2.preg.how_feel'), icon: 'feather', onPress: () => go('/pregnancy/feel'), testID: 'preg-main-action' }}>
      <SectionIntro section="pregnancy" />
      <AuraQuickBar examples={['aura.ex.pregAppt', 'aura.ex.pregTools']} testID="preg-aura" />
      <WeekHero week={w} extraDays={p.extraDays} chosen={week !== null} multiple={multiple ? multLabel(pregnancy.multiplicity) : undefined}
        art={{ growth: info.growth, hue: HUES[selected % 3], size: n > 1 ? 210 : 236, a11y: named ? tr('u2.preg.art_a11y_named', { name: named, week: w }) : tr('u2.preg.art_a11y', { week: w }) }} />
      {n > 1 && (
        <Row wrap style={{ justifyContent: 'center' }}>
          {babies!.map((b, i) => <Chip key={b.id} label={b.nickname ?? tr('u2.preg.baby_n', { n: b.position })} selected={selected === i} onPress={() => setSelected(i)} />)}
        </Row>
      )}

      <WeekPicker current={p.weeksSA} shown={w} onPick={(s) => setWeek(s === p.weeksSA ? null : s)} />
      {week !== null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs }} accessibilityLiveRegion="polite">
          <Text variant="small" muted style={{ flexShrink: 1 }}>{tr('h5.preg.viewing', { n: week })}</Text>
          <Button label={tr('u2.preg.back_to_week')} variant="ghost" size="sm" onPress={() => setWeek(null)} testID="preg-back-to-week" />
        </View>
      ) : null}

      <WeekFigures lengthCm={info.lengthCm} weightG={info.weightG} compare={info.compare.replace(/^une? /, (m) => (m === 'une ' ? 'une ' : 'un '))}
        notes={[
          tr('u2.preg.source', { name: FETAL_SIZE_SOURCE.name, date: formatDate(FETAL_SIZE_SOURCE.updatedOn, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) }),
          tr('u2.preg.illustration_note'),
          ...(multiple ? [tr('u2.preg.multiple_note')] : []),
        ]} />

      <WeekProgress weeksSA={p.weeksSA} progress={p.progress} daysToDue={p.daysToDue} dueLabel={countdownText(p.daysToDue)} />

      <Text variant="heading" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs, marginBottom: -spacing.xs }}>{tr('h5.preg.upcoming')}</Text>
      <ListGroup testID="preg-upcoming">
        <ListRow testID="preg-next-appt" icon="calendar" title={nextAppt ? nextAppt.title : tr('u2.preg.no_appt')}
          subtitle={nextAppt ? formatDate(nextAppt.starts_at, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : tr('u2.preg.add_appt')}
          onPress={() => router.push({ pathname: '/appointments', params: { for: 'pregnancy' } })} />
        <ListRow icon="flag" title={tr('u2.preg.due_term')} subtitle={pregnancy.due_date_source === 'lmp' ? tr('u2.preg.est_lmp') : tr('u2.preg.date_by_you')}
          value={dueDate} onPress={() => router.push('/pregnancy/calendar')} testID="preg-due" />
      </ListGroup>
      <DueDateFix pregnancy={pregnancy} />

      <WeekNotes title={tr('u2.preg.baby_this_week')} items={info.baby} />
      <WeekNotes title={tr('u2.preg.you_maybe')} items={info.mother} />
      <Banner tone="warning">{tr('u2.preg.warning')}</Banner>

      <Text variant="heading" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs, marginBottom: -spacing.xs }}>{tr('u2.preg.my_pregnancy')}</Text>
      <ToolLinks ids={PREGNANCY_SHORTCUTS} subject={subject} max={simple ? 7 : undefined} filter={(x) => x.id !== 'preg_weight' || !profile?.hide_weight_module}
        status={{ documents: docs?.length ? tr('u2.preg.r_docs_count', { count: docs.length }) : undefined }} allOf="pregnancy" testID="preg-rubrics" />
      {/* Actions propres à cet écran : rappel de complément, modification de la grossesse (pas des outils) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Chip icon="bell" label={tr('u2.preg.r_supp')} onPress={() => router.push({ pathname: '/settings/reminders', params: { new: 'supplement' } })} testID="preg-action-supplement" />
        <Chip icon="edit-3" label={tr('u2.preg.edit')} onPress={() => router.push('/pregnancy/edit')} testID="preg-rubric-edit" />
      </View>

      {multiple && (
        <>
          <Text variant="heading" accessibilityRole="header">{tr('u2.preg.each_baby')}</Text>
          <MotionList style={{ gap: spacing.md }}>{babies?.map((b) => <MotionItem key={b.id}><BabyNotes key={b.id} baby={b} /></MotionItem>)}</MotionList>
          <Card tone="lavender" onPress={() => router.push({ pathname: '/assistant/chat', params: { q: tr('u2.preg.q_multiple') } })}>
            <Text weight="bold">{tr('u2.preg.q_title')}</Text>
            <Text variant="small" muted>{tr('u2.preg.q_sub')}</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

/** Repères de la semaine (bébé, vous) : une liste simple, puces corail, sur une seule surface. */
function WeekNotes({ title, items }: { title: string; items: string[] }) {
  const th = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="heading" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{title}</Text>
      <Card style={{ gap: spacing.xs }}>
        {items.map((b) => (
          <View key={b} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 9, backgroundColor: th.colors.primary }} />
            <Text style={{ flex: 1 }}>{b}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}
