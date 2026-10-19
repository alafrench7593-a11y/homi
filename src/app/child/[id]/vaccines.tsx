/**
 * Vaccins de l'enfant :
 *  1. Calendrier officiel (France, 2026) : échéances INDICATIVES calculées à partir de la date de naissance, source et
 *     date de mise à jour affichées ; obligatoire / recommandé selon l'année de naissance ; jamais « en retard ».
 *  2. Actions : prochaines échéances, créer un rappel, prévoir un rendez-vous, marquer un rendez-vous comme fait,
 *     noter un vaccin fait (saisie du parent), préparer ses questions.
 *  3. Registre de ce qui a été fait (date, vaccin, injection, lot, par qui, source), comme avant.
 * Ne remplace ni le carnet de santé ni l'avis du médecin.
 */
import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, Icon, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { suggestedStart, useVaccineActions, useVaccineSchedule, type Vaccination, type VaccineAppointment } from '@/lib/data/hooks-vaccines';
import { byVisit, CALENDAR_VERSION, nextDoses, SITUATIONAL, VACCINE_QUESTIONS, VACCINE_SOURCES, type ScheduledDose } from '@/lib/domain/vaccines';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const SOURCE_KEYS: Vaccination['source'][] = ['carnet', 'professional', 'parent'];
const ageLabel = (m: number, to?: number) => (to ? (m >= 24 ? tr('vx.ageYearsRange', { a: Math.round(m / 12), b: Math.round(to / 12) }) : tr('vx.ageMonthsRange', { a: m, b: to })) : m >= 24 ? tr('vx.ageYears', { count: Math.round(m / 12) }) : tr('vx.ageMonths', { count: m }));
const fmt = (iso: string) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' });

function StateChip({ d }: { d: ScheduledDose }) {
  const t = useTheme();
  const color = d.state === 'done' ? t.colors.success : d.state === 'due' || d.state === 'upcoming' ? t.colors.primary : t.colors.textMuted;
  const icon = d.state === 'done' ? 'check-circle' : d.state === 'planned' ? 'calendar' : d.state === 'check' ? 'help-circle' : 'clock';
  return (
    <Row gap={4} style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
      <Icon name={icon} size={14} color={color} />
      <Text variant="caption" weight="bold" color={color} style={{ flexShrink: 1 }}>{tr(`vx.state.${d.state}` as TKey)}{d.state === 'done' && d.doneOn ? ` · ${toFrDate(d.doneOn)}` : ''}</Text>
    </Row>
  );
}

export default function Vaccines() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const { schedule, vaccinations, appointments, loading } = useVaccineSchedule(child);
  const act = useVaccineActions(child);
  const [d, setD] = useState<{ id?: string; vaccine: string; date: string; dose: string; lot: string; by: string; source: Vaccination['source']; note: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [visit, setVisit] = useState<{ months: number; toMonths?: number; date: string; doses: ScheduledDose[] } | null>(null);
  const [doneDate, setDoneDate] = useState(toFrDate(todayISO()));
  const [qAppt, setQAppt] = useState<VaccineAppointment | null>(null);
  const [qs, setQs] = useState<string[]>([]);
  const [qFree, setQFree] = useState('');
  const [showAll, setShowAll] = useState(false);

  if (!child) return <Screen back title={tr('vx.title')}><Skeleton rows={4} /></Screen>;
  const visits = schedule ? byVisit(schedule) : [];
  const next = schedule ? nextDoses(schedule, 6) : [];
  const nextVisits = visits.filter((v) => v.doses.some((x) => next.includes(x)));
  const open = appointments.filter((a) => !a.completed_at);
  const doneAppts = appointments.filter((a) => a.completed_at);
  const shownVisits = showAll ? visits : visits.filter((v) => v.months <= 24 || v.doses.some((x) => x.state !== 'later'));

  async function save() {
    if (!child || !d) return;
    const iso = frToISO(d.date);
    if (!d.vaccine.trim()) return toast(tr('vx.err.vaccine'), 'error');
    if (!iso || iso > todayISO()) return toast(tr('vx.err.date'), 'error');
    const row = { vaccine: d.vaccine.trim(), given_on: iso, dose_label: d.dose.trim() || null, lot: d.lot.trim() || null, given_by: d.by.trim() || null, source: d.source, note: d.note.trim() || null };
    setBusy(true);
    try {
      if (d.id) await backend.update('child_vaccinations', row, [eq('id', d.id)]);
      else await backend.insert('child_vaccinations', { ...row, child_id: child.id, household_id: child.household_id });
      inv('child_vaccinations');
      toast(tr('vx.saved'));
      setD(null);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove(v: Vaccination) {
    if (!(await confirm(tr('vx.deleteTitle'), `${v.vaccine} — ${toFrDate(v.given_on)}`, tr('common.delete')))) return;
    try { await backend.remove('child_vaccinations', [eq('id', v.id)]); inv('child_vaccinations'); toast(tr('vx.deleted')); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const visitTitle = (v: { months: number; toMonths?: number }) => tr('vx.visitTitle', { age: ageLabel(v.months, v.toMonths), name: child.first_name });
  async function remindVisit(v: NonNullable<typeof visit>) {
    try {
      const at = await act.remind.mutateAsync({ title: visitTitle(v), body: tr('vx.reminderBody', { list: v.doses.filter((x) => x.state !== 'done').map((x) => x.label).join(', ') }), date: v.date });
      toast(tr('vx.reminded', { date: at ? fmt(at.slice(0, 10)) : '' }), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function planVisit(v: NonNullable<typeof visit>) {
    try {
      await act.plan.mutateAsync({ title: visitTitle(v), startsAt: suggestedStart(v.date), keys: v.doses.filter((x) => x.state !== 'done').map((x) => x.key) });
      toast(tr('vx.planned'), 'success'); setVisit(null);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function markVisitDone(v: NonNullable<typeof visit>) {
    const iso = frToISO(doneDate);
    if (!iso || iso > todayISO()) return toast(tr('vx.err.date'), 'error');
    try { await act.markDone.mutateAsync({ doses: v.doses.filter((x) => x.state !== 'done'), givenOn: iso }); toast(tr('vx.markedDone'), 'success'); setVisit(null); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function completeAppt(a: VaccineAppointment) {
    const doses = (schedule ?? []).filter((x) => (a.calendar_keys ?? []).includes(x.key) && x.state !== 'done');
    if (!(await confirm(tr('vx.completeTitle'), tr('vx.completeBody', { count: doses.length }), tr('vx.complete')))) return;
    try { await act.complete.mutateAsync({ appt: a, doses }); toast(tr('vx.completed'), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  function openQuestions(a: VaccineAppointment) { setQAppt(a); setQs(a.questions ?? []); setQFree(''); }

  return (
    <Screen back title={tr('vx.title')} subtitle={tr('vx.subtitle', { name: child.first_name })} right={<IconButton icon="plus" label={tr('vx.add')} onPress={() => setD({ vaccine: '', date: toFrDate(todayISO()), dose: '', lot: '', by: '', source: 'carnet', note: '' })} />}>
      {/* Source officielle et date de mise à jour : jamais deviner */}
      <View testID="vaccine-source">
        <Banner tone="info" title={tr('vx.calendarTitle', { label: CALENDAR_VERSION.label })}>
          <Text variant="small">{tr('vx.calendarBody', { updated: formatDate(`${CALENDAR_VERSION.updated}T12:00:00`, { month: 'long', year: 'numeric' }), checked: fmt(CALENDAR_VERSION.checked) })}</Text>
          {Object.values(VACCINE_SOURCES).map((s) => (
            <Pressable key={s.key} accessibilityRole="link" onPress={() => void Linking.openURL(s.url)} style={{ minHeight: 36, justifyContent: 'center' }}>
              <Text variant="caption" color={t.colors.primary}>{s.label} ({fmt(s.published)})</Text>
            </Pressable>
          ))}
        </Banner>
      </View>

      <SectionTitle title={tr('vx.next')} />
      {loading && !schedule ? <Skeleton rows={2} /> : !nextVisits.length ? <Text muted>{tr('vx.nothingSoon')}</Text> : nextVisits.map((v) => (
        <Card key={`${v.months}-${v.toMonths ?? ''}`}>
          <View testID={`vaccine-next-${v.months}`}>
            <Text weight="bold">{ageLabel(v.months, v.toMonths)} · {v.toMonths ? `${fmt(v.date)} – ${fmt(v.doses[0].dateTo!)}` : tr('vx.around', { date: fmt(v.date) })}</Text>
            {v.doses.map((x) => (
              <View key={x.key} style={{ marginTop: 4 }}>
                <Text variant="small">{x.label} — {x.dose} · <Text variant="small" weight="bold">{tr(x.status === 'mandatory' ? 'vx.mandatory' : 'vx.recommended')}</Text></Text>
                <StateChip d={x} />
              </View>
            ))}
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('vx.remind')} icon="bell" size="sm" variant="secondary" testID={`vaccine-remind-${v.months}`} loading={act.remind.isPending} onPress={() => void remindVisit(v)} />
              <Button label={tr('vx.more')} size="sm" variant="ghost" onPress={() => { setVisit(v); setDoneDate(toFrDate(todayISO())); }} testID={`vaccine-open-${v.months}`} />
            </Row>
          </View>
        </Card>
      ))}

      {open.length ? <SectionTitle title={tr('vx.appointments')} /> : null}
      {open.map((a) => (
        <Card key={a.id}>
          <View testID={`vaccine-appt-${a.id}`}>
            <Text weight="bold">{a.title}</Text>
            <Text variant="small" muted>{formatDate(a.starts_at, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
            {a.questions?.length ? <Text variant="caption" muted>{tr('vx.questionsCount', { count: a.questions.length })}</Text> : null}
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('vx.complete')} icon="check" size="sm" testID={`vaccine-complete-${a.id}`} onPress={() => void completeAppt(a)} />
              <Button label={tr('vx.questions')} icon="help-circle" size="sm" variant="secondary" onPress={() => openQuestions(a)} testID={`vaccine-questions-${a.id}`} />
            </Row>
          </View>
        </Card>
      ))}
      {doneAppts.length ? <Text variant="caption" muted>{tr('vx.doneAppts', { count: doneAppts.length })}</Text> : null}

      <SectionTitle title={tr('vx.calendar')} />
      {shownVisits.map((v) => (
        <Pressable key={`${v.months}-${v.toMonths ?? ''}`} accessibilityRole="button" onPress={() => { setVisit(v); setDoneDate(toFrDate(todayISO())); }}>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text weight="bold">{ageLabel(v.months, v.toMonths)}</Text>
              <Text variant="caption" muted>{v.toMonths ? `${fmt(v.date)} – ${fmt(v.doses[0].dateTo!)}` : tr('vx.around', { date: fmt(v.date) })}</Text>
            </Row>
            {v.doses.map((x) => (
              <View key={x.key} style={{ marginTop: 4 }}>
                <Text variant="small">{x.label} — {x.dose}</Text>
                <StateChip d={x} />
              </View>
            ))}
          </Card>
        </Pressable>
      ))}
      {!showAll && shownVisits.length < visits.length ? <Button label={tr('vx.showAll')} variant="ghost" onPress={() => setShowAll(true)} /> : null}
      <Card>
        <Text weight="bold">{tr('vx.situational')}</Text>
        {SITUATIONAL.map((s) => <Text key={s} variant="small" style={{ marginTop: 4 }}>• {s}</Text>)}
      </Card>
      <Text variant="caption" muted>{tr('vx.disclaimer')}</Text>

      <SectionTitle title={tr('vx.registry')} />
      {!vaccinations.length && !loading ? <EmptyState icon="shield" title={tr('vx.none')} body={tr('vx.noneBody')} /> : null}
      {vaccinations.map((v, i) => (
        <StaggerItem key={v.id} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="shield" title={`${v.vaccine}${v.dose_label ? ` · ${v.dose_label}` : ''}`} subtitle={[toFrDate(v.given_on), v.given_by, v.lot ? tr('vx.lot', { lot: v.lot }) : null, tr(`vx.src.${v.source}` as TKey)].filter(Boolean).join(' · ')}
              onPress={() => setD({ id: v.id, vaccine: v.vaccine, date: toFrDate(v.given_on), dose: v.dose_label ?? '', lot: v.lot ?? '', by: v.given_by ?? '', source: v.source, note: v.note ?? '' })}
              right={<IconButton icon="trash-2" label={tr('vx.deleteA11y', { name: v.vaccine })} size={18} onPress={() => remove(v)} />} />
          </Card>
        </StaggerItem>
      ))}
      <Button label={tr('vx.otherAppointment')} variant="ghost" icon="calendar" onPress={() => router.push(`/appointments?child=${child.id}`)} />

      {/* Une visite du calendrier : rappel, rendez-vous, « fait » */}
      <Sheet visible={!!visit} onClose={() => setVisit(null)} title={visit ? ageLabel(visit.months, visit.toMonths) : ''}>
        {visit ? (
          <View style={{ gap: spacing.sm }}>
            {visit.doses.map((x) => (
              <View key={x.key}>
                <Text weight="bold">{x.label}</Text>
                <Text variant="small">{x.dose} · {tr(x.status === 'mandatory' ? 'vx.mandatory' : 'vx.recommended')}</Text>
                {x.note ? <Text variant="caption" muted>{x.note}</Text> : null}
                <StateChip d={x} />
                {x.state === 'done' ? <Button label={tr('vx.undo')} size="sm" variant="ghost" onPress={() => act.undo.mutate(x.key)} /> : null}
              </View>
            ))}
            <Text variant="caption" muted>{tr('vx.indicative')}</Text>
            {visit.doses.some((x) => x.state !== 'done') ? (
              <>
                <Button label={tr('vx.remind')} icon="bell" variant="secondary" full onPress={() => void remindVisit(visit)} />
                <Button label={tr('vx.plan')} icon="calendar" variant="secondary" full onPress={() => void planVisit(visit)} testID="vaccine-plan" />
                <Field label={tr('vx.doneOn')} value={doneDate} onChangeText={setDoneDate} keyboardType="numbers-and-punctuation" testID="vaccine-done-date" />
                <Button label={tr('vx.markDone')} icon="check" full onPress={() => void markVisitDone(visit)} testID="vaccine-mark-done" />
                <Text variant="caption" muted>{tr('vx.markDoneNote')}</Text>
              </>
            ) : null}
          </View>
        ) : null}
      </Sheet>

      {/* Préparer ses questions pour le rendez-vous */}
      <Sheet visible={!!qAppt} onClose={() => setQAppt(null)} title={tr('vx.questions')}>
        <View style={{ gap: spacing.xs }}>
          {VACCINE_QUESTIONS.map((q) => <Chip key={q} label={q} selected={qs.includes(q)} onPress={() => setQs(qs.includes(q) ? qs.filter((x) => x !== q) : [...qs, q])} />)}
          {qs.filter((q) => !VACCINE_QUESTIONS.includes(q)).map((q) => <Chip key={q} label={q} selected onPress={() => setQs(qs.filter((x) => x !== q))} />)}
          <Field label={tr('vx.ownQuestion')} value={qFree} onChangeText={setQFree} maxLength={200} />
          <Button label={tr('vx.addQuestion')} size="sm" variant="ghost" onPress={() => { if (qFree.trim()) { setQs([...qs, qFree.trim()]); setQFree(''); } }} />
          <Button label={tr('common.save')} full testID="vaccine-questions-save" onPress={async () => {
            if (!qAppt) return;
            try { await act.saveQuestions.mutateAsync({ apptId: qAppt.id, questions: qs }); toast(tr('vx.questionsSaved'), 'success'); setQAppt(null); } catch (e) { toast(friendlyError(e), 'error'); }
          }} />
        </View>
      </Sheet>

      {/* Registre : ajouter ou modifier une ligne recopiée du carnet */}
      <Sheet visible={!!d} onClose={() => setD(null)} title={d?.id ? tr('vx.edit') : tr('vx.add')}>
        {d ? (
          <View style={{ gap: spacing.sm }}>
            <Field label={tr('vx.f.vaccine')} value={d.vaccine} onChangeText={(v) => setD({ ...d, vaccine: v })} maxLength={120} placeholder={tr('vx.f.vaccinePh')} />
            <Field label={tr('vx.f.date')} value={d.date} onChangeText={(v) => setD({ ...d, date: v })} placeholder={tr('vx.f.datePh')} keyboardType="numbers-and-punctuation" />
            <Field label={tr('vx.f.dose')} optional value={d.dose} onChangeText={(v) => setD({ ...d, dose: v })} maxLength={60} placeholder={tr('vx.f.dosePh')} />
            <Field label={tr('vx.f.lot')} optional value={d.lot} onChangeText={(v) => setD({ ...d, lot: v })} maxLength={40} />
            <Field label={tr('vx.f.by')} optional value={d.by} onChangeText={(v) => setD({ ...d, by: v })} maxLength={120} placeholder={tr('vx.f.byPh')} />
            <Row wrap>{SOURCE_KEYS.map((k) => <Chip key={k} label={tr(`vx.src.${k}` as TKey)} selected={d.source === k} onPress={() => setD({ ...d, source: k })} />)}</Row>
            <Field label={tr('vx.f.note')} optional value={d.note} onChangeText={(v) => setD({ ...d, note: v })} maxLength={1000} />
            <Button label={tr('common.save')} full onPress={save} loading={busy} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
