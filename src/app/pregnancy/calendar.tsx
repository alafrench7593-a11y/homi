/**
 * Calendrier automatique de grossesse : SA, SG, trimestre, terme, et fenêtres générales des trois échographies
 * converties en dates du profil (« Période indicative », « À confirmer avec votre sage-femme ou votre médecin »).
 *  · « Ajouter mon véritable rendez-vous » : date, heure facultative, lieu, note, documents, rappels ; modifier, supprimer.
 *  · Terme corrigé : les fenêtres sont recalculées ; un rendez-vous confirmé n'est JAMAIS déplacé sans accord.
 *  · Grossesse multiple ou suivi particulier : aucun calendrier supplémentaire automatique ; on enregistre celui
 *    de l'équipe médicale.
 * Gratuit : ces informations ne passent jamais par Premium.
 */
import React, { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { AppointmentSheet, AttachedDocs, appointmentWhen, DocumentsSheet, RemindersSheet } from '@/features/care/CareSheets';
import { useActivePregnancy, useAppointments } from '@/lib/data/hooks';
import { useCalendarAppointments, type CareAppointment } from '@/lib/data/hooks-care';
import { APPOINTMENT_CHOICES, confirmedOutsideWindow, pregnancySummary, ultrasoundWindows, WINDOW_CHOICES, windowState, type EchoKey, type EchoWindow } from '@/lib/domain/pregnancyCare';
import { todayISO } from '@/lib/domain/dates';
import { CARE_SOURCES } from '@/content/pregnancyCare';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { daysUntil, pregnancyThread, type PregThreadItem } from '@/lib/domain/pregnancyThread';
import { PregnancyThread } from '@/features/pregnancyThread';

const dayLabel = (iso: string) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'long' });
const saLabel = ([w, d]: [number, number]) => (d ? tr('care.cal.saPlus', { w, d }) : tr('care.cal.sa', { w }));

export default function PregnancyCalendar() {
  const t = useTheme();
  const pregnancy = useActivePregnancy();
  const echoQ = useCalendarAppointments({ pregnancyId: pregnancy?.id, kind: 'ultrasound' });
  const all = useAppointments({}).data;
  const [editing, setEditing] = useState<{ key: EchoKey | null; appt: CareAppointment | null; window: EchoWindow | null } | null>(null);
  const [reminding, setReminding] = useState<{ window: EchoWindow | null; appt: CareAppointment | null } | null>(null);
  const [docsFor, setDocsFor] = useState<CareAppointment | null>(null);
  const today = todayISO();
  const windows = useMemo(() => (pregnancy ? ultrasoundWindows(pregnancy.due_date) : []), [pregnancy]);
  if (!pregnancy) {
    return <Screen back title={tr('care.cal.title')}>{pregnancy === undefined ? <Skeleton rows={3} /> : <EmptyState icon="calendar" title={tr('care.cal.noPregnancy')} body={tr('care.cal.noPregnancyBody')} />}</Screen>;
  }
  const s = pregnancySummary(pregnancy.due_date, today);
  const echoAppts = echoQ.data ?? [];
  const byKey = (k: EchoKey) => echoAppts.find((a) => (a.calendar_keys ?? []).includes(k));
  const moved = confirmedOutsideWindow(echoAppts, pregnancy.due_date);
  const others = (all ?? []).filter((a) => a.pregnancy_id === pregnancy.id && !echoAppts.some((e) => e.id === a.id)) as CareAppointment[];
  const multiple = pregnancy.multiplicity !== 'single';
  const name = (k: EchoKey) => tr(`care.cal.${k}` as TKey);

  return (
    <Screen back title={tr('care.cal.title')} subtitle={tr('care.cal.subtitle')}
      action={{ label: tr('care.cal.addTeam'), icon: 'plus', onPress: () => setEditing({ key: null, appt: null, window: null }), testID: 'preg-cal-add-team' }}>
      <View testID="preg-cal-summary" style={{ gap: spacing.xs }}>
        <TodaySummary title={tr('care.cal.due', { date: formatDate(`${s.due}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }) })} items={[
          { icon: 'moon', label: tr('care.cal.sa.label'), value: s.extraDays ? tr('care.cal.saPlus', { w: s.weeksSA, d: s.extraDays }) : tr('care.cal.sa', { w: s.weeksSA }) },
          { icon: 'sun', label: tr('care.cal.sg.label'), value: tr('care.cal.sg', { w: s.weeksSG }) },
          { icon: 'layers', label: tr('care.cal.trimester.label'), value: tr('care.cal.trimester', { count: s.trimester }) },
        ]} />
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption" muted style={{ flex: 1 }}>{tr(`care.cal.source.${pregnancy.due_date_source}` as TKey)}</Text>
          <Button label={tr('care.cal.fixDate')} size="sm" variant="ghost" icon="edit-3" onPress={() => router.push('/pregnancy/edit')} testID="preg-cal-fix" />
        </Row>
      </View>

      <PregnancyThread
        title={tr('pc.cal.thread' as TKey)}
        caption={tr('pc.cal.threadCaption' as TKey)}
        items={pregnancyThread({
          today, due: pregnancy.due_date, windows,
          echoAppts: windows.flatMap((w) => { const a = byKey(w.key); return a ? [{ key: w.key, id: a.id, date: a.starts_at.slice(0, 10) }] : []; }),
          appts: others.map((a) => ({ id: a.id, date: a.starts_at.slice(0, 10) })),
        })}
        labelOf={(it: PregThreadItem) => {
          const soon = (d: string) => (d > today ? tr('pc.cal.inDays' as TKey, { count: daysUntil(today, d) }) : null);
          const tag = it.state === 'done' ? tr('pc.cal.done' as TKey) : it.state === 'next' ? tr('pc.cal.next' as TKey) : undefined;
          if (it.kind === 'today') return { title: s.extraDays ? tr('care.cal.saPlus', { w: s.weeksSA, d: s.extraDays }) : tr('care.cal.sa', { w: s.weeksSA }), sub: dayLabel(today), tag: tr('pc.cal.today' as TKey) };
          if (it.kind === 'due') return { title: dayLabel(it.date), sub: soon(it.date) ?? undefined, tag: tr('pc.cal.due' as TKey) };
          if (it.kind === 'echo') {
            const w = windows.find((x) => x.key === it.ref)!;
            const appt = byKey(w.key);
            const st = windowState(w, today);
            return { title: name(w.key), sub: [appt ? appointmentWhen(appt) : `${dayLabel(w.from)} → ${dayLabel(w.to)}`, soon(it.date)].filter(Boolean).join(' · '), tag: tag ?? tr(`care.cal.state.${st}` as TKey) };
          }
          const a = others.find((x) => x.id === it.ref)!;
          return { title: a.title, sub: [appointmentWhen(a), soon(it.date)].filter(Boolean).join(' · '), tag };
        }}
        onPress={(it: PregThreadItem) => {
          if (it.kind === 'echo') { const w = windows.find((x) => x.key === it.ref)!; setEditing({ key: w.key, appt: byKey(w.key) ?? null, window: w }); }
          else if (it.kind === 'appt') { const a = others.find((x) => x.id === it.ref); if (a) setEditing({ key: null, appt: a, window: null }); }
        }}
      />

      {multiple ? <View testID="preg-cal-multiple"><Banner tone="info" title={tr('care.cal.multipleTitle')}>{tr('care.cal.multipleBody')}</Banner></View> : null}
      {moved.map((m) => {
        const a = echoAppts.find((x) => x.id === m.id)!;
        return (
          <View key={m.id} testID={`preg-cal-moved-${m.key}`}>
            <Banner tone="warning" title={tr('care.cal.movedTitle', { name: name(m.key) })}>
              <Text variant="small">{tr('care.cal.movedBody', { when: appointmentWhen(a), from: dayLabel(m.window.from), to: dayLabel(m.window.to) })}</Text>
              <Button label={tr('care.cal.movedEdit')} size="sm" variant="secondary" onPress={() => setEditing({ key: m.key, appt: a, window: m.window })} />
            </Banner>
          </View>
        );
      })}

      <SectionTitle title={tr('care.cal.echos')} />
      {windows.map((w) => {
        const appt = byKey(w.key);
        const st = windowState(w, today);
        return (
          <Card key={w.key}>
            <View testID={`echo-${w.key}`} style={{ gap: 4 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text weight="bold" style={{ flex: 1 }}>{name(w.key)}</Text>
                <Text variant="caption" weight="bold" color={st === 'current' || st === 'soon' ? t.colors.primary : t.colors.textMuted}>{tr(`care.cal.state.${st}` as TKey)}</Text>
              </Row>
              <Text variant="small" testID={`echo-window-${w.key}`}>{tr('care.cal.window', { name: name(w.key).toLowerCase(), from: dayLabel(w.from), to: dayLabel(w.to) })}</Text>
              <Text variant="caption" muted>{tr('care.cal.windowSA', { from: saLabel(w.fromSA), to: saLabel(w.toSA) })} · {tr('care.cal.indicative')}</Text>
              {appt ? (
                <View style={{ gap: 4, marginTop: spacing.xs }} testID={`echo-appt-${w.key}`}>
                  <Row style={{ alignItems: 'center', gap: 6 }}><Icon name="check-circle" size={16} color={t.colors.success} /><Text weight="bold" style={{ flex: 1 }}>{tr('care.cal.planned', { when: appointmentWhen(appt) })}</Text></Row>
                  {appt.location_label ? <Text variant="small" muted>{appt.location_label}</Text> : null}
                  {appt.notes ? <Text variant="small" muted>{appt.notes}</Text> : null}
                  <AttachedDocs ids={appt.document_ids} />
                  <Row wrap>
                    <Button label={tr('care.cal.edit')} size="sm" variant="secondary" icon="edit-3" onPress={() => setEditing({ key: w.key, appt, window: w })} testID={`echo-edit-${w.key}`} />
                    <Button label={tr('care.cal.reminders')} size="sm" variant="secondary" icon="bell" onPress={() => setReminding({ window: null, appt })} testID={`echo-appt-remind-${w.key}`} />
                    <Button label={tr('care.cal.documents')} size="sm" variant="ghost" icon="paperclip" onPress={() => setDocsFor(appt)} testID={`echo-docs-${w.key}`} />
                  </Row>
                </View>
              ) : (
                <>
                  <Text variant="small" muted>{tr('care.cal.confirmWith')}</Text>
                  {st !== 'past' ? (
                    <Row wrap style={{ marginTop: spacing.xs }}>
                      <Button label={tr('care.cal.addReal')} size="sm" icon="plus" onPress={() => setEditing({ key: w.key, appt: null, window: w })} testID={`echo-add-${w.key}`} />
                      <Button label={tr('care.cal.remind')} size="sm" variant="secondary" icon="bell" onPress={() => setReminding({ window: w, appt: null })} testID={`echo-remind-${w.key}`} />
                    </Row>
                  ) : <Button label={tr('care.cal.addPast')} size="sm" variant="ghost" onPress={() => setEditing({ key: w.key, appt: null, window: w })} />}
                </>
              )}
            </View>
          </Card>
        );
      })}

      <SectionTitle title={tr('care.cal.team')} />
      <Text variant="small" muted>{tr('care.cal.teamBody')}</Text>
      {others.map((a) => (
        <Tappable key={a.id} accessibilityRole="button" onPress={() => setEditing({ key: null, appt: a, window: null })}>
          <Card><Text weight="bold">{a.title}</Text><Text variant="small" muted>{appointmentWhen(a)}{a.location_label ? ` · ${a.location_label}` : ''}</Text></Card>
        </Tappable>
      ))}

      <View style={{ gap: 2 }}>
        <Text variant="caption" muted>{tr('care.cal.sources')}</Text>
        {[CARE_SOURCES.ameliProgramme1, CARE_SOURCES.ameliMensuel].map((src) => (
          <Tappable key={src.url} accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
            <Text variant="caption" color={t.colors.primary}>{src.label}{src.published ? ` (${formatDate(`${src.published}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' })})` : ''}</Text>
          </Tappable>
        ))}
        <Text variant="caption" muted>{tr('care.cal.disclaimer')}</Text>
      </View>

      <AppointmentSheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        existing={editing?.appt ?? null}
        window={editing?.window ?? null}
        base={{
          kind: editing?.key ? 'ultrasound' : editing?.appt?.kind ?? 'consultation',
          title: editing?.key ? name(editing.key) : tr('care.cal.teamDefault'),
          calendarKeys: editing?.key ? [editing.key] : editing?.appt?.calendar_keys ?? [],
          pregnancyId: pregnancy.id,
          householdId: pregnancy.household_id,
        }}
      />
      <RemindersSheet
        visible={!!reminding}
        onClose={() => setReminding(null)}
        choices={reminding?.appt ? APPOINTMENT_CHOICES : WINDOW_CHOICES}
        target={reminding?.appt ? new Date(reminding.appt.starts_at) : reminding?.window ? new Date(`${reminding.window.from}T09:00:00`) : null}
        allDay={reminding?.appt ? reminding.appt.time_set === false : true}
        title={reminding?.appt ? tr('care.cal.notifApptTitle') : tr('care.cal.notifWindowTitle')}
        body={reminding?.appt ? tr('care.cal.notifAppt', { when: appointmentWhen(reminding.appt) }) : reminding?.window ? tr('care.cal.notifWindow', { name: name(reminding.window.key).toLowerCase() }) : ''}
        deepLink={`/pregnancy/calendar?${reminding?.appt ? `appt=${reminding.appt.id}` : `w=${reminding?.window?.key ?? ''}`}`}
        link={{ category: 'ultrasound', pregnancyId: pregnancy.id, appointmentId: reminding?.appt?.id ?? null, journeyType: 'pregnancy' }}
      />
      <DocumentsSheet visible={!!docsFor} onClose={() => setDocsFor(null)} target={docsFor ? { table: 'appointments', id: docsFor.id } : null} selected={docsFor?.document_ids ?? []} pregnancyId={pregnancy.id} />
    </Screen>
  );
}
