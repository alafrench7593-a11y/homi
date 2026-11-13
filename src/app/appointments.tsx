/** Rendez-vous du foyer : à venir et passés, ajout / modification / suppression, rappel facultatif. */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyStateCard } from '@/components/ui-extra';
import { ErrorView } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, type IconName, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { ensureHousehold, useActivePregnancy, useActiveSubject, useAppointments, useChildren, useHouseholdId, useInvalidate, useReminders } from '@/lib/data/hooks';
import { leadOf, setAppointmentReminder, type ReminderLead } from '@/lib/data/hooks-me';
import { frToISO } from '@/lib/domain/dates';
import { notificationsSupported } from '@/lib/notifications';
import { askNotificationPermission } from '@/lib/notificationPrompt';
import { toFrDate } from '@/lib/validation';
import type { Appointment, AppointmentKind } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { GlassSurface } from '@/components/Glass';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { countdown } from '@/lib/domain/dayThread';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate } from '@/i18n';

const kinds = (): { value: AppointmentKind; label: string; icon: IconName }[] => [
  { value: 'consultation', label: tr('u1.appt.kind.consultation'), icon: 'user' },
  { value: 'ultrasound', label: tr('u1.appt.kind.ultrasound'), icon: 'radio' },
  { value: 'exam', label: tr('u1.appt.kind.exam'), icon: 'clipboard' },
  { value: 'blood_test', label: tr('u1.appt.kind.blood_test'), icon: 'droplet' },
  { value: 'postnatal', label: tr('u1.appt.kind.postnatal'), icon: 'heart' },
  { value: 'perineal_rehab', label: tr('u1.appt.kind.perineal_rehab'), icon: 'feather' },
  { value: 'pediatric', label: tr('u1.appt.kind.pediatric'), icon: 'smile' },
  { value: 'vaccination', label: tr('u1.appt.kind.vaccination'), icon: 'shield' },
  { value: 'other', label: tr('u1.appt.kind.other'), icon: 'calendar' },
];
const kindMeta = (k: AppointmentKind) => { const all = kinds(); return all.find((x) => x.value === k) ?? all[all.length - 1]; };

const leads = (): { value: string; label: string }[] => [
  { value: '0', label: tr('u1.appt.leadNone') }, { value: '60', label: tr('u1.appt.lead1h') }, { value: '180', label: tr('u1.appt.lead3h') }, { value: '1440', label: tr('u1.appt.leadDay') },
];

type Concern = 'me' | 'pregnancy' | `child:${string}`;

interface Draft {
  id: string | null; kind: AppointmentKind; title: string; date: string; time: string; location: string; notes: string; questions: string; concern: Concern; lead: ReminderLead; private: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtWhen = (iso: string) => formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function emptyDraft(concern: Concern): Draft {
  return { id: null, kind: 'consultation', title: '', date: '', time: '', location: '', notes: '', questions: '', concern, lead: 60, private: false };
}

export default function AppointmentsScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const appointmentsQ = useAppointments();
  const { data: appointments, isLoading } = appointmentsQ;
  // Erreur réseau : jamais présentée comme « aucun rendez-vous »
  const loadFailed = appointmentsQ.isError && !appointments;
  const { data: reminders } = useReminders(); // programme aussi les notifications locales
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  // Questions cochées pendant le rendez-vous (sur cet écran) ; une nouvelle question s'ajoute en un geste
  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const [newQ, setNewQ] = useState('');

  // Profil affiché : par défaut, seulement ses rendez-vous ; ceux d'une ancienne grossesse restent dans « Mes parcours précédents »
  const qp = useLocalSearchParams<{ child?: string; for?: string; all?: string }>();
  const { subject } = useActiveSubject();
  const [everyone, setEveryone] = useState(qp.all === '1');
  const focus: Concern | null = qp.child ? `child:${qp.child}` : qp.for === 'pregnancy' ? 'pregnancy' : subject.type === 'child' ? `child:${subject.id}` : subject.type === 'pregnancy' ? 'pregnancy' : null;
  const { upcoming, past } = useMemo(() => {
    const cutoff = Date.now() - 3600_000;
    const all = (appointments ?? [])
      .filter((a) => !a.pregnancy_id || a.pregnancy_id === pregnancy?.id)
      .filter((a) => everyone || !focus || (focus === 'pregnancy' ? !!a.pregnancy_id : a.child_id === focus.slice(6)));
    return { upcoming: all.filter((a) => Date.parse(a.starts_at) >= cutoff), past: all.filter((a) => Date.parse(a.starts_at) < cutoff).reverse() };
  }, [appointments, pregnancy?.id, everyone, focus]);
  const reminderFor = (id: string) => reminders?.find((r) => r.appointment_id === id);

  const concerns: { value: Concern; label: string }[] = [
    { value: 'me', label: tr('u1.appt.me') },
    ...(pregnancy ? [{ value: 'pregnancy' as Concern, label: tr('u1.appt.pregnancy') }] : []),
    ...(children ?? []).map((c) => ({ value: `child:${c.id}` as Concern, label: c.first_name })),
  ];
  const concernLabel = (a: Appointment) =>
    a.child_id ? children?.find((c) => c.id === a.child_id)?.first_name ?? tr('u1.appt.child') : a.pregnancy_id ? tr('u1.appt.pregnancy') : a.for_parent ? tr('u1.appt.me') : null;

  // Ouverture directe depuis l'espace post-partum : nouveau rendez-vous postnatal, privé par défaut
  const params = useLocalSearchParams<{ new?: string; title?: string; at?: string; child?: string }>();
  useEffect(() => {
    if (params.new === 'postnatal') setDraft({ ...emptyDraft('me'), kind: 'postnatal', private: true });
    // Saisie vocale (« Ajouter le rendez-vous du pédiatre mardi à 15 h ») : formulaire pré-rempli, à vérifier avant d'enregistrer
    if (params.new === 'quick' && params.at && !Number.isNaN(Date.parse(params.at))) {
      const d = new Date(params.at);
      const title = String(params.title ?? '').slice(0, 80);
      setDraft({ ...emptyDraft(params.child ? `child:${params.child}` : 'me'), kind: /p[eé]diatre/i.test(title) ? 'pediatric' : 'consultation', title,
        date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` });
    }
  }, [params.new, params.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const focusLabel = focus ? (focus === 'pregnancy' ? tr('u1.appt.pregnancy') : children?.find((c) => c.id === focus.slice(6))?.first_name ?? null) : null;

  function openNew() {
    setErrors({});
    setDraft(emptyDraft(focus && (focus !== 'pregnancy' || pregnancy) ? focus : 'me'));
  }

  function openEdit(a: Appointment) {
    const d = new Date(a.starts_at);
    setErrors({});
    setDraft({
      id: a.id, kind: a.kind, title: a.title, date: toFrDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`), time: `${pad(d.getHours())}h${pad(d.getMinutes())}`,
      location: a.location_label ?? '', notes: a.notes ?? '', questions: a.questions.join('\n'),
      concern: a.child_id ? `child:${a.child_id}` : a.pregnancy_id ? 'pregnancy' : 'me', lead: leadOf(reminderFor(a.id), a.starts_at), private: !!a.private_to_creator,
    });
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function save() {
    if (!draft) return;
    const e: Record<string, string> = {};
    const iso = frToISO(draft.date);
    const m = draft.time.trim().match(/^(\d{1,2})[h:.]?(\d{2})?$/);
    if (!draft.title.trim()) e.title = tr('u1.appt.errTitle');
    if (!iso) e.date = tr('u1.appt.errDate');
    // F-07 : bornes raisonnables (deux ans en arrière, trois ans en avant)
    else {
      const year = Number(iso.slice(0, 4));
      const now = new Date().getFullYear();
      if (year < now - 2 || year > now + 3) e.date = tr('u1.appt.errRange');
    }
    if (!m || Number(m[1]) > 23 || Number(m[2] ?? 0) > 59) e.time = tr('u1.appt.errTime');
    setErrors(e);
    if (Object.keys(e).length || !iso || !m) return;
    const [y, mo, da] = iso.split('-').map(Number);
    const startsAt = new Date(y, mo - 1, da, Number(m[1]), Number(m[2] ?? 0)).toISOString();
    const childId = draft.concern.startsWith('child:') ? draft.concern.slice(6) : null;
    const row = {
      kind: draft.kind, title: draft.title.trim().slice(0, 120), starts_at: startsAt,
      location_label: draft.location.trim() || null, notes: draft.notes.trim() || null,
      questions: draft.questions.split('\n').map((q) => q.trim()).filter(Boolean),
      for_parent: draft.concern === 'me', pregnancy_id: draft.concern === 'pregnancy' ? pregnancy?.id ?? null : null, child_id: childId,
      // Un rendez-vous personnel peut rester privé (non visible du foyer) ; ceux d'un enfant restent partagés
      private_to_creator: draft.concern === 'me' && draft.private,
    };
    setSaving(true);
    try {
      let appt: Appointment;
      if (draft.id) {
        const [u] = await backend.update<Appointment>('appointments', row, [eq('id', draft.id)]);
        appt = u;
      } else {
        const household_id = hid ?? (await ensureHousehold());
        const [c] = await backend.insert<Appointment>('appointments', { household_id, ...row });
        appt = c;
        if (!hid) inv('memberships');
      }
      if (draft.lead && notificationsSupported) await askNotificationPermission(tr('u1.appt.permWhy')).catch(() => undefined);
      await setAppointmentReminder(appt, draft.lead, reminders ?? []);
      inv('appointments', 'reminders');
      haptic('success');
      toast(draft.id ? tr('u1.appt.modified') : tr('u1.appt.added'));
      setDraft(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : tr('u1.appt.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Appointment) {
    if (!(await confirm(tr('u1.appt.deleteTitle'), tr('u1.appt.deleteBody', { title: a.title }), tr('u1.appt.delete')))) return;
    // Échec (réseau, droits) : message d'erreur, la feuille reste ouverte (jamais d'échec muet ni de faux « supprimé »)
    try {
      await backend.remove('appointments', [eq('id', a.id)]);
    } catch (err) {
      toast(err instanceof Error ? err.message : tr('u1.appt.saveFailed'), 'error');
      return;
    }
    await backend.remove('reminders', [eq('appointment_id', a.id)]).catch(() => undefined);
    inv('appointments', 'reminders');
    setDraft(null);
    toast(tr('u1.appt.deleted'));
  }

  async function addQuestion(a: Appointment) {
    const q = newQ.trim();
    if (!q) return;
    try {
      await backend.update('appointments', { questions: [...a.questions, q.slice(0, 200)] }, [eq('id', a.id)]);
      inv('appointments');
      haptic('success');
      setNewQ('');
      toast(tr('u1.appt.questionAdded'));
    } catch (err) {
      toast(err instanceof Error ? err.message : tr('u1.appt.saveFailed'), 'error');
    }
  }

  /** Prochain rendez-vous en grand : compte à rebours, lieu, questions à cocher pendant la consultation. */
  function NextCard({ a }: { a: Appointment }) {
    const meta = kindMeta(a.kind);
    const who = concernLabel(a);
    const cd = countdown(a.starts_at);
    return (
      <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
        <View style={{ padding: spacing.lg, gap: spacing.sm }} testID="appt-next">
          <Row style={{ alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.primary, t.isDark ? 0.22 : 0.12) }}>
              <Icon name={meta.icon} color={t.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{tr('u1.appt.next')}</Text>
              <Text weight="bold" style={{ fontSize: 26, lineHeight: 31 }} color={t.colors.primary} testID="appt-countdown">{cd.replace(/^./, (c) => c.toUpperCase())}</Text>
            </View>
          </Row>
          <Tappable bare onPress={() => openEdit(a)} accessibilityRole="button" accessibilityLabel={tr('u1.appt.editA11y', { title: a.title, when: fmtWhen(a.starts_at) })}>
            <Text variant="heading">{a.title}</Text>
            <Text variant="small">{fmtWhen(a.starts_at)}</Text>
            <Text variant="caption" muted>{[meta.label, who, a.location_label].filter(Boolean).join(' · ')}</Text>
          </Tappable>
          <View style={{ gap: 6, marginTop: spacing.xs }}>
            <Text variant="label">{tr('u1.appt.questionsToAsk')} {a.questions.length ? `· ${a.questions.filter((_, i) => asked[`${a.id}:${i}`]).length}/${a.questions.length}` : ''}</Text>
            {a.questions.map((q, i) => {
              const k = `${a.id}:${i}`;
              const on = !!asked[k];
              return (
                <Tappable key={k} bare onPress={() => { haptic('selection'); setAsked((m) => ({ ...m, [k]: !m[k] })); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={q} testID={`appt-q-${i}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 0 : 2, borderColor: t.colors.gold, backgroundColor: on ? t.colors.gold : 'transparent' }}>
                    {on ? <Icon name="check" size={13} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none', opacity: on ? 0.6 : 1 }}>{q}</Text>
                </Tappable>
              );
            })}
            <Row style={{ alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Field label={tr('u1.appt.newQuestion')} optional value={newQ} onChangeText={setNewQ} placeholder={tr('u1.appt.newQuestionPh')} onSubmitEditing={() => void addQuestion(a)} returnKeyType="done" testID="appt-q-new" />
              </View>
              <Button label={tr('u1.appt.add')} icon="plus" size="sm" variant="secondary" disabled={!newQ.trim()} onPress={() => void addQuestion(a)} testID="appt-q-add" />
            </Row>
          </View>
        </View>
      </GlassSurface>
    );
  }

  function renderAppt(a: Appointment, faded?: boolean) {
    const meta = kindMeta(a.kind);
    const who = concernLabel(a);
    const rem = reminderFor(a.id);
    return (
      <Card key={a.id} onPress={() => openEdit(a)} accessibilityLabel={tr('u1.appt.editA11y', { title: a.title, when: fmtWhen(a.starts_at) })} style={faded ? { opacity: 0.8 } : undefined}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Icon name={meta.icon} color={t.colors.lavender} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{a.title}</Text>
            <Text variant="small">{fmtWhen(a.starts_at)}</Text>
            <Text variant="caption" muted>{[meta.label, who, a.location_label].filter(Boolean).join(' · ')}</Text>
            {a.questions.length > 0 && <Text variant="caption" muted>{tr('u1.appt.questionsCount', { count: a.questions.length })}</Text>}
          </View>
          {rem && !faded && <Icon name="bell" size={16} color={t.colors.textMuted} />}
        </Row>
      </Card>
    );
  }

  return (
    <Screen back title={tr('u1.appt.title')} subtitle={tr('u1.appt.subtitle')}
      action={{ label: tr('u1.appt.addAppt'), icon: 'plus', onPress: openNew, testID: 'appointments-add' }}>
      {loadFailed ? <ErrorView error={appointmentsQ.error} onRetry={() => void appointmentsQ.refetch()} title={tr('u1.appt.loadError')} /> : null}
      {!isLoading && !loadFailed ? (() => {
        const next = upcoming[0];
        const days = next ? Math.round((new Date(next.starts_at).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
        return (
          <TodaySummary title={tr('u1.appt.brief')} items={[
            { icon: 'clock', value: days == null ? '—' : days <= 0 ? tr('u1.appt.today') : days === 1 ? tr('u1.appt.tomorrow') : tr('u1.appt.inDays', { days }), label: next ? tr('u1.appt.nextNamed', { title: next.title }) : tr('u1.appt.next') },
            { icon: 'calendar', value: String(upcoming.length), label: tr('u1.appt.upcoming') },
            { icon: 'help-circle', value: String(upcoming.reduce((n, a) => n + a.questions.length, 0)), label: tr('u1.appt.questionsToAsk') },
          ]} />
        );
      })() : null}
      {focusLabel ? (
        <Row wrap>
          <Chip label={tr('u1.appt.forName', { name: focusLabel })} selected={!everyone} onPress={() => setEveryone(false)} />
          <Chip label={tr('u1.appt.wholeFamily')} selected={everyone} onPress={() => setEveryone(true)} />
        </Row>
      ) : null}
      {upcoming[0] ? NextCard({ a: upcoming[0] }) : null}
      {upcoming.length > 1 ? <SectionTitle title={tr('u1.appt.then')} /> : null}
      {upcoming.slice(1).map((a) => renderAppt(a))}
      {!isLoading && !loadFailed && !upcoming.length && <EmptyStateCard illustration="leaf" title={tr('u1.appt.emptyTitle')} text={tr('u1.appt.emptyText')} />}

      {past.length > 0 && (
        <>
          <SectionTitle title={tr('u1.appt.past')} action={past.length > 5 ? (showAllPast ? tr('u1.appt.reduce') : tr('u1.appt.showAll')) : undefined} onAction={() => setShowAllPast((v) => !v)} />
          {(showAllPast ? past : past.slice(0, 5)).map((a) => renderAppt(a, true))}
        </>
      )}

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? tr('u1.appt.editTitle') : tr('u1.appt.newTitle')}>
        {draft && (
          <>
            <Text variant="label">{tr('u1.appt.type')}</Text>
            <Row wrap>
              {kinds().map((k) => (
                <Chip key={k.value} label={k.label} icon={k.icon} selected={draft.kind === k.value} onPress={() => { set('kind', k.value); if (!draft.title.trim() || kinds().some((x) => x.label === draft.title)) set('title', k.label); }} />
              ))}
            </Row>
            <Field label={tr('u1.appt.fieldTitle')} value={draft.title} onChangeText={(v) => set('title', v)} error={errors.title} maxLength={120} placeholder={tr('u1.appt.titlePh')} />
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 3 }}><Field label={tr('u1.appt.date')} value={draft.date} onChangeText={(v) => set('date', v)} error={errors.date} placeholder={tr('u1.appt.datePh')} keyboardType="numbers-and-punctuation" /></View>
              <View style={{ flex: 2 }}><Field label={tr('u1.appt.time')} value={draft.time} onChangeText={(v) => set('time', v)} error={errors.time} placeholder={tr('u1.appt.timePh')} keyboardType="numbers-and-punctuation" /></View>
            </Row>
            {concerns.length > 1 && (
              <>
                <Text variant="label">{tr('u1.appt.forWhom')}</Text>
                <Row wrap>{concerns.map((c) => <Chip key={c.value} label={c.label} selected={draft.concern === c.value} onPress={() => set('concern', c.value)} />)}</Row>
              </>
            )}
            {draft.concern === 'me' ? (
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="medium">{tr('u1.appt.privateOnly')}</Text>
                  <Text variant="caption" muted>{tr('u1.appt.privateD')}</Text>
                </View>
                <Toggle label={tr('u1.appt.privateOnly')} value={draft.private} onChange={(v) => set('private', v)} />
              </Row>
            ) : null}
            <Field label={tr('u1.appt.place')} optional value={draft.location} onChangeText={(v) => set('location', v)} maxLength={160} placeholder={tr('u1.appt.placePh')} />
            <Field label={tr('u1.appt.questionsToAsk')} optional value={draft.questions} onChangeText={(v) => set('questions', v)} multiline hint={tr('u1.appt.oneLine')} style={{ minHeight: 90, textAlignVertical: 'top' }} />
            <Field label={tr('u1.appt.notes')} optional value={draft.notes} onChangeText={(v) => set('notes', v)} multiline maxLength={4000} style={{ minHeight: 70, textAlignVertical: 'top' }} />
            <Text variant="label">{tr('u1.appt.reminder')}</Text>
            <Segmented label={tr('u1.appt.reminder')} value={String(draft.lead)} onChange={(v) => set('lead', Number(v) as ReminderLead)} options={leads()} />
            {draft.lead !== 0 && !notificationsSupported && <Banner tone="info">{tr('u1.appt.webNote')}</Banner>}
            <Button label={draft.id ? tr('u1.appt.saveChanges') : tr('u1.appt.add')} onPress={save} loading={saving} full />
            {!!draft.id && <Button label={tr('u1.appt.deleteBtn')} variant="ghost" onPress={() => { const a = appointments?.find((x) => x.id === draft.id); return a ? remove(a) : undefined; }} />}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
