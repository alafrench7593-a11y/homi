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
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { GlassSurface } from '@/components/Glass';
import { GoldTimeline, type GoldState } from '@/features/goldTimeline';
import { backend, eq } from '@/lib/backend';
import { useChild, useChildren, useInvalidate, useMemberships } from '@/lib/data/hooks';
import { openLink } from '@/lib/links';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useVaccineActions, useVaccineSchedule, type Vaccination, type VaccineAppointment } from '@/lib/data/hooks-vaccines';
import { byVisit, nextDoses, VACCINE_QUESTIONS, type ScheduledDose } from '@/lib/domain/vaccines';
import { vaccineNotice } from '@/lib/domain/vaccineRules';
import { APPOINTMENT_CHOICES, WINDOW_CHOICES } from '@/lib/domain/pregnancyCare';
import { usePostponeVaccine } from '@/lib/data/hooks-care';
import { AppointmentSheet, AttachedDocs, appointmentWhen, DocumentsSheet, RemindersSheet } from '@/features/care/CareSheets';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const SOURCE_KEYS: Vaccination['source'][] = ['carnet', 'professional', 'parent'];
const ageLabel = (m: number, to?: number) => (to ? (m >= 24 ? tr('vx.ageYearsRange', { a: Math.round(m / 12), b: Math.round(to / 12) }) : tr('vx.ageMonthsRange', { a: m, b: to })) : m >= 24 ? tr('vx.ageYears', { count: Math.round(m / 12) }) : tr('vx.ageMonths', { count: m }));
const fmt = (iso: string) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' });

function StateChip({ d }: { d: ScheduledDose }) {
  const t = useTheme();
  const color = d.state === 'done' ? t.colors.success : d.state === 'due' || d.state === 'upcoming' ? t.colors.primary : t.colors.textMuted;
  const icon = d.state === 'done' ? 'check-circle' : d.state === 'planned' ? 'calendar' : d.state === 'postponed' ? 'pause-circle' : d.state === 'check' ? 'help-circle' : 'clock';
  return (
    <Row gap={4} style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
      <Icon name={icon} size={14} color={color} />
      <Text variant="caption" weight="bold" color={color} style={{ flexShrink: 1 }}>{tr(`vx.state.${d.state}` as TKey)}{d.state === 'done' && d.doneOn ? ` · ${toFrDate(d.doneOn)}` : ''}{d.state === 'postponed' && d.postponedTo ? ` · ${tr('vx.until', { date: fmt(d.postponedTo) })}` : ''}</Text>
    </Row>
  );
}

export default function Vaccines() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const { schedule, vaccinations, appointments, postponements, calendar, supported, loading } = useVaccineSchedule(child);
  const postpone = usePostponeVaccine();
  const [apptSheet, setApptSheet] = useState<{ appt: VaccineAppointment | null; keys: string[]; title: string } | null>(null);
  const [remSheet, setRemSheet] = useState<{ appt: VaccineAppointment | null; visit: { months: number; toMonths?: number; date: string; doses: ScheduledDose[] } | null } | null>(null);
  const [docsFor, setDocsFor] = useState<{ table: 'appointments' | 'child_vaccinations'; id: string; ids: string[] } | null>(null);
  const [postTo, setPostTo] = useState('');
  const [postNote, setPostNote] = useState('');
  const act = useVaccineActions(child);
  const [d, setD] = useState<{ id?: string; vaccine: string; date: string; dose: string; lot: string; by: string; source: Vaccination['source']; note: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [visit, setVisit] = useState<{ months: number; toMonths?: number; date: string; doses: ScheduledDose[] } | null>(null);
  const [doneDate, setDoneDate] = useState(toFrDate(todayISO()));
  const [qAppt, setQAppt] = useState<VaccineAppointment | null>(null);
  const [qs, setQs] = useState<string[]>([]);
  const [qFree, setQFree] = useState('');
  const [showAll, setShowAll] = useState(false);

  if (!child) {
    return (
      <Screen back title={tr('vx.title')}>
        {isLoading ? <Skeleton rows={4} /> : loadError ? (
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
  function remindVisit(v: NonNullable<typeof visit>) { setVisit(null); setRemSheet({ appt: null, visit: v }); }
  function planVisit(v: NonNullable<typeof visit>) {
    setVisit(null);
    setApptSheet({ appt: null, keys: v.doses.filter((x) => x.state !== 'done').map((x) => x.key), title: visitTitle(v) });
  }
  async function postponeVisit(v: NonNullable<typeof visit>, cancel = false) {
    if (!child) return;
    const iso = postTo.trim() ? frToISO(postTo) : null;
    if (!cancel && postTo.trim() && !iso) return toast(tr('vx.err.date'), 'error');
    try {
      await postpone.mutateAsync({ child, keys: v.doses.filter((x) => x.state !== 'done').map((x) => x.key), to: iso, note: postNote.trim() || null, cancel });
      toast(tr(cancel ? 'vx.postponeCancelled' : 'vx.postponed'), 'success'); setVisit(null); setPostTo(''); setPostNote('');
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
  // Première visite qui n'est pas entièrement faite et dont une dose est « à faire » ou « bientôt »
  const firstNow = shownVisits.find((v) => v.doses.some((x) => x.state === 'due' || x.state === 'upcoming'));
  async function quickDone(v: NonNullable<typeof visit>) {
    const todo = v.doses.filter((x) => x.state !== 'done');
    if (!todo.length) return;
    if (!(await confirm(tr('mb.vx.quickTitle'), tr('mb.vx.quickBody', { list: todo.map((x) => x.label).join(', ') }), tr('mb.vx.doneToday')))) return;
    try { await act.markDone.mutateAsync({ doses: todo, givenOn: todayISO() }); haptic('success'); toast(tr('vx.markedDone'), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  function newVaccine() { setD({ vaccine: '', date: toFrDate(todayISO()), dose: '', lot: '', by: '', source: 'carnet', note: '' }); }
  function openQuestions(a: VaccineAppointment) { setQAppt(a); setQs(a.questions ?? []); setQFree(''); }

  return (
    <Screen back title={tr('vx.title')} subtitle={tr('vx.subtitle', { name: child.first_name })} right={<IconButton icon="plus" label={tr('vx.add')} onPress={newVaccine} />}
      action={{ label: tr('mb.vx.action'), icon: 'check', onPress: newVaccine, testID: 'vaccine-main-action' }}>
      <TodaySummary title={tr('mb.vx.title')} items={[
        { icon: 'check-circle', value: String(vaccinations.length), label: tr('mb.vx.done') },
        { icon: 'clock', value: nextVisits[0] ? ageLabel(nextVisits[0].months, nextVisits[0].toMonths) : '—', label: tr('mb.vx.next') },
        { icon: 'calendar', value: String(open.length), label: tr('mb.vx.appts') },
      ]} />
      {/* Source officielle et date de mise à jour : jamais deviner */}
      <View testID="vaccine-source">
        <Banner tone="info" title={tr('vx.calendarTitle', { label: calendar.label })}>
          <Text variant="small">{tr('vx.calendarBody', { updated: formatDate(`${calendar.updated}T12:00:00`, { month: 'long', year: 'numeric' }), checked: fmt(calendar.checked) })}</Text>
          <Text variant="caption" muted testID="vaccine-version">{tr('vx.version', { version: calendar.version, country: calendar.country })}</Text>
          {!supported ? <Text variant="small" weight="bold">{tr('vx.otherCountry')}</Text> : null}
          {Object.values(calendar.sources).map((s) => (
            <Tappable key={s.key} accessibilityRole="link" onPress={() => openLink(s.url, toast)} style={{ minHeight: 36, justifyContent: 'center' }}>
              <Text variant="caption" color={t.colors.primary}>{s.label} ({fmt(s.published)})</Text>
            </Tappable>
          ))}
        </Banner>
      </View>

      <SectionTitle title={tr('vx.next')} />
      <Text variant="caption" muted testID="vaccine-confirm-with">{tr('vx.indicative')}</Text>
      {loading && !schedule ? <Skeleton rows={2} /> : !nextVisits.length ? <Text muted>{tr('vx.nothingSoon')}</Text> : nextVisits.map((v) => (
        <Card key={`${v.months}-${v.toMonths ?? ''}`}>
          <View testID={`vaccine-next-${v.months}`}>
            <Text weight="bold">{ageLabel(v.months, v.toMonths)} · {v.toMonths ? `${fmt(v.date)} – ${fmt(v.doses[0].dateTo!)}` : tr('vx.around', { date: fmt(v.date) })}</Text>
            {v.doses.map((x) => (
              <View key={x.key} style={{ marginTop: 4 }}>
                <Text variant="small">{x.label} — {x.dose} · <Text variant="small" weight="bold">{tr(x.status === 'mandatory' ? 'vx.mandatory' : 'vx.recommended')}</Text></Text>
                <StateChip d={x} />
                {x.shifted ? <Text variant="caption" muted>{tr('vx.shifted')}</Text> : null}
              </View>
            ))}
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('vx.remind')} icon="bell" size="sm" variant="secondary" testID={`vaccine-remind-${v.months}`} onPress={() => remindVisit(v)} />
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
            <Text variant="small" muted>{appointmentWhen(a)}{a.location_label ? ` · ${a.location_label}` : ''}</Text>
            {a.questions?.length ? <Text variant="caption" muted>{tr('vx.questionsCount', { count: a.questions.length })}</Text> : null}
            <AttachedDocs ids={a.document_ids} />
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('vx.complete')} icon="check" size="sm" testID={`vaccine-complete-${a.id}`} onPress={() => completeAppt(a)} />
              <Button label={tr('vx.questions')} icon="help-circle" size="sm" variant="secondary" onPress={() => openQuestions(a)} testID={`vaccine-questions-${a.id}`} />
              <Button label={tr('vx.editAppt')} icon="edit-3" size="sm" variant="secondary" onPress={() => setApptSheet({ appt: a, keys: a.calendar_keys ?? [], title: a.title })} testID={`vaccine-edit-${a.id}`} />
              <Button label={tr('care.cal.reminders')} icon="bell" size="sm" variant="ghost" onPress={() => setRemSheet({ appt: a, visit: null })} testID={`vaccine-appt-remind-${a.id}`} />
              <Button label={tr('care.cal.documents')} icon="paperclip" size="sm" variant="ghost" onPress={() => setDocsFor({ table: 'appointments', id: a.id, ids: a.document_ids ?? [] })} />
            </Row>
          </View>
        </Card>
      ))}
      {doneAppts.length ? <Text variant="caption" muted>{tr('vx.doneAppts', { count: doneAppts.length })}</Text> : null}
      {postponements.length ? <SectionTitle title={tr('vx.postponedTitle')} /> : null}
      {(schedule ?? []).filter((x) => x.state === 'postponed').map((x) => (
        <Card key={x.key}>
          <View testID={`vaccine-postponed-${x.key}`}>
            <Text weight="bold">{x.label}</Text>
            <Text variant="small" muted>{x.dose}{x.postponedTo ? ` · ${tr('vx.until', { date: fmt(x.postponedTo) })}` : ''}</Text>
            {postponements.find((p) => p.calendar_key === x.key)?.note ? <Text variant="small" muted>{postponements.find((p) => p.calendar_key === x.key)!.note}</Text> : null}
            <Button label={tr('vx.postponeCancel')} size="sm" variant="ghost" onPress={() => child && postpone.mutate({ child, keys: [x.key], to: null, note: null, cancel: true })} style={{ alignSelf: 'flex-start' }} />
          </View>
        </Card>
      ))}

      <SectionTitle title={tr('vx.calendar')} />
      {/* Fil des vaccins : chaque visite est une perle (faite, c'est le moment, prévue, plus tard) ; « Fait aujourd'hui » en un geste */}
      <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
        <View style={{ padding: spacing.lg }}>
          <GoldTimeline testID="vaccine-timeline" items={shownVisits.map((v) => {
            const todo = v.doses.filter((x) => x.state !== 'done');
            const state: GoldState = !todo.length ? 'done' : v === firstNow ? 'now' : todo.some((x) => x.state === 'planned') ? 'planned' : 'later';
            return {
              key: `${v.months}-${v.toMonths ?? ''}`,
              title: ageLabel(v.months, v.toMonths),
              tag: !todo.length ? tr('vx.state.done') : tr(`vx.state.${todo[0].state}` as TKey),
              subtitle: `${v.doses.map((x) => x.label).join(' · ')}\n${v.toMonths ? `${fmt(v.date)} – ${fmt(v.doses[0].dateTo!)}` : tr('vx.around', { date: fmt(v.date) })}`,
              state,
              icon: 'shield' as const,
              onPress: () => { setVisit(v); setDoneDate(toFrDate(todayISO())); },
              testID: `vaccine-visit-${v.months}`,
              action: state === 'now' ? { label: tr('mb.vx.doneToday'), onPress: () => void quickDone(v), testID: `vaccine-quick-done-${v.months}` } : undefined,
            };
          })} />
        </View>
      </GlassSurface>
      {!showAll && shownVisits.length < visits.length ? <Button label={tr('vx.showAll')} variant="ghost" onPress={() => setShowAll(true)} /> : null}
      <Card>
        <Text weight="bold">{tr('vx.situational')}</Text>
        {calendar.situational.map((s) => <Text key={s} variant="small" style={{ marginTop: 4 }}>• {s}</Text>)}
      </Card>
      <Text variant="caption" muted>{tr('vx.disclaimer')}</Text>

      <SectionTitle title={tr('vx.registry')} />
      {!vaccinations.length && !loading ? <EmptyState icon="shield" title={tr('vx.none')} body={tr('vx.noneBody')} /> : null}
      {vaccinations.map((v, i) => (
        <StaggerItem key={v.id} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            {/* pièce jointe et suppression à côté de la ligne et non dedans : un bouton dans un bouton est invalide sur le web */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ListRow icon="shield" title={`${v.vaccine}${v.dose_label ? ` · ${v.dose_label}` : ''}`} subtitle={[toFrDate(v.given_on), v.given_by, v.lot ? tr('vx.lot', { lot: v.lot }) : null, tr(`vx.src.${v.source}` as TKey)].filter(Boolean).join(' · ')}
                  onPress={() => setD({ id: v.id, vaccine: v.vaccine, date: toFrDate(v.given_on), dose: v.dose_label ?? '', lot: v.lot ?? '', by: v.given_by ?? '', source: v.source, note: v.note ?? '' })}
                  right={<View />} />
              </View>
              <Row gap={0}><IconButton icon="paperclip" label={tr('vx.attachA11y', { name: v.vaccine })} size={18} onPress={() => setDocsFor({ table: 'child_vaccinations', id: v.id, ids: v.document_ids ?? [] })} /><IconButton icon="trash-2" label={tr('vx.deleteA11y', { name: v.vaccine })} size={18} onPress={() => remove(v)} /></Row>
            </View>
            <AttachedDocs ids={v.document_ids} />
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
                <Button label={tr('vx.remind')} icon="bell" variant="secondary" full onPress={() => remindVisit(visit)} />
                <Button label={tr('vx.plan')} icon="calendar" variant="secondary" full onPress={() => planVisit(visit)} testID="vaccine-plan" />
                <Field label={tr('vx.doneOn')} value={doneDate} onChangeText={setDoneDate} keyboardType="numbers-and-punctuation" testID="vaccine-done-date" />
                <Button label={tr('vx.markDone')} icon="check" full onPress={() => markVisitDone(visit)} testID="vaccine-mark-done" />
                <Text variant="caption" muted>{tr('vx.markDoneNote')}</Text>
                <Text variant="label">{tr('vx.postponeTitle')}</Text>
                <Field label={tr('vx.postponeTo')} optional value={postTo} onChangeText={setPostTo} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" testID="vaccine-postpone-date" />
                <Field label={tr('vx.f.note')} optional value={postNote} onChangeText={setPostNote} maxLength={500} />
                <Button label={tr('vx.postpone')} icon="pause-circle" variant="ghost" full onPress={() => postponeVisit(visit)} testID="vaccine-postpone" />
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
      <AppointmentSheet
        visible={!!apptSheet}
        onClose={() => setApptSheet(null)}
        existing={apptSheet?.appt ?? null}
        base={{ kind: 'vaccination', title: apptSheet?.title ?? '', calendarKeys: apptSheet?.keys ?? [], childId: child.id, householdId: child.household_id }}
      />
      <RemindersSheet
        visible={!!remSheet}
        onClose={() => setRemSheet(null)}
        choices={remSheet?.appt ? APPOINTMENT_CHOICES : WINDOW_CHOICES}
        target={remSheet?.appt ? new Date(remSheet.appt.starts_at) : remSheet?.visit ? new Date(`${remSheet.visit.date}T09:00:00`) : null}
        allDay={remSheet?.appt ? remSheet.appt.time_set === false : true}
        title={tr('vx.notifTitle', { name: child.first_name })}
        body={remSheet?.appt ? tr('vx.notifAppt', { name: child.first_name, when: appointmentWhen(remSheet.appt) }) : vaccineNotice(calendar, child.first_name)}
        deepLink={`/child/${child.id}/vaccines${remSheet?.appt ? `?appt=${remSheet.appt.id}` : remSheet?.visit ? `?visit=${remSheet.visit.months}` : ''}`}
        link={{ category: 'appointment', childId: child.id, appointmentId: remSheet?.appt?.id ?? null }}
      />
      <DocumentsSheet visible={!!docsFor} onClose={() => setDocsFor(null)} target={docsFor ? { table: docsFor.table, id: docsFor.id } : null} selected={docsFor?.ids ?? []} childId={child.id} />
    </Screen>
  );
}
