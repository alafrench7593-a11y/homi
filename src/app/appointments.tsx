/** Rendez-vous du foyer : à venir et passés, ajout / modification / suppression, rappel facultatif. */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyStateCard } from '@/components/ui-extra';
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
import { spacing } from '@/theme/tokens';

const KINDS: { value: AppointmentKind; label: string; icon: IconName }[] = [
  { value: 'consultation', label: 'Consultation', icon: 'user' },
  { value: 'ultrasound', label: 'Échographie', icon: 'radio' },
  { value: 'exam', label: 'Examen', icon: 'clipboard' },
  { value: 'blood_test', label: 'Prise de sang', icon: 'droplet' },
  { value: 'postnatal', label: 'Visite postnatale', icon: 'heart' },
  { value: 'perineal_rehab', label: 'Rééducation', icon: 'feather' },
  { value: 'pediatric', label: 'Pédiatre', icon: 'smile' },
  { value: 'vaccination', label: 'Vaccin', icon: 'shield' },
  { value: 'other', label: 'Autre', icon: 'calendar' },
];
const kindMeta = (k: AppointmentKind) => KINDS.find((x) => x.value === k) ?? KINDS[KINDS.length - 1];

const LEADS: { value: string; label: string }[] = [
  { value: '0', label: 'Aucun' }, { value: '60', label: '1 h avant' }, { value: '180', label: '3 h avant' }, { value: '1440', label: 'La veille' },
];

type Concern = 'me' | 'pregnancy' | `child:${string}`;

interface Draft {
  id: string | null; kind: AppointmentKind; title: string; date: string; time: string; location: string; notes: string; questions: string; concern: Concern; lead: ReminderLead; private: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtWhen = (iso: string) => new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

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
  const { data: appointments, isLoading } = useAppointments();
  const { data: reminders } = useReminders(); // programme aussi les notifications locales
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

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
    { value: 'me', label: 'Moi' },
    ...(pregnancy ? [{ value: 'pregnancy' as Concern, label: 'Grossesse' }] : []),
    ...(children ?? []).map((c) => ({ value: `child:${c.id}` as Concern, label: c.first_name })),
  ];
  const concernLabel = (a: Appointment) =>
    a.child_id ? children?.find((c) => c.id === a.child_id)?.first_name ?? 'Enfant' : a.pregnancy_id ? 'Grossesse' : a.for_parent ? 'Moi' : null;

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
  const focusLabel = focus ? (focus === 'pregnancy' ? 'Grossesse' : children?.find((c) => c.id === focus.slice(6))?.first_name ?? null) : null;

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
    if (!draft.title.trim()) e.title = 'Donnez un nom à ce rendez-vous.';
    if (!iso) e.date = 'Format attendu : JJ/MM/AAAA.';
    if (!m || Number(m[1]) > 23 || Number(m[2] ?? 0) > 59) e.time = 'Format attendu : 14h30.';
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
      if (draft.lead && notificationsSupported) await askNotificationPermission('Pour vous rappeler ce rendez-vous à l’avance.').catch(() => undefined);
      await setAppointmentReminder(appt, draft.lead, reminders ?? []);
      inv('appointments', 'reminders');
      haptic('success');
      toast(draft.id ? 'Rendez-vous modifié.' : 'Rendez-vous ajouté.');
      setDraft(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Enregistrement impossible.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Appointment) {
    if (!(await confirm('Supprimer ce rendez-vous ?', `« ${a.title} » et son rappel éventuel seront supprimés.`, 'Supprimer'))) return;
    await backend.remove('reminders', [eq('appointment_id', a.id)]).catch(() => undefined);
    await backend.remove('appointments', [eq('id', a.id)]);
    inv('appointments', 'reminders');
    setDraft(null);
    toast('Rendez-vous supprimé.');
  }

  function renderAppt(a: Appointment, faded?: boolean) {
    const meta = kindMeta(a.kind);
    const who = concernLabel(a);
    const rem = reminderFor(a.id);
    return (
      <Card key={a.id} onPress={() => openEdit(a)} accessibilityLabel={`${a.title}, ${fmtWhen(a.starts_at)}. Modifier`} style={faded ? { opacity: 0.8 } : undefined}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Icon name={meta.icon} color={t.colors.lavender} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{a.title}</Text>
            <Text variant="small">{fmtWhen(a.starts_at)}</Text>
            <Text variant="caption" muted>{[meta.label, who, a.location_label].filter(Boolean).join(' · ')}</Text>
            {a.questions.length > 0 && <Text variant="caption" muted>{a.questions.length} question{a.questions.length > 1 ? 's' : ''} à poser</Text>}
          </View>
          {rem && !faded && <Icon name="bell" size={16} color={t.colors.textMuted} />}
        </Row>
      </Card>
    );
  }

  return (
    <Screen back title="Rendez-vous" subtitle="Consultations, échographies, examens, questions à poser."
      action={{ label: 'Ajouter un rendez-vous', icon: 'plus', onPress: openNew, testID: 'appointments-add' }}>
      {!isLoading ? (() => {
        const next = upcoming[0];
        const days = next ? Math.round((new Date(next.starts_at).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
        return (
          <TodaySummary title="En bref" items={[
            { icon: 'clock', value: days == null ? '—' : days <= 0 ? 'Aujourd’hui' : days === 1 ? 'Demain' : `J-${days}`, label: next ? `Prochain : ${next.title}` : 'Prochain rendez-vous' },
            { icon: 'calendar', value: String(upcoming.length), label: 'À venir' },
            { icon: 'help-circle', value: String(upcoming.reduce((n, a) => n + a.questions.length, 0)), label: 'Questions à poser' },
          ]} />
        );
      })() : null}
      {focusLabel ? (
        <Row wrap>
          <Chip label={`Pour ${focusLabel}`} selected={!everyone} onPress={() => setEveryone(false)} />
          <Chip label="Toute la famille" selected={everyone} onPress={() => setEveryone(true)} />
        </Row>
      ) : null}
      <SectionTitle title="À venir" />
      {upcoming.map((a) => renderAppt(a))}
      {!isLoading && !upcoming.length && <EmptyStateCard illustration="leaf" title="Aucun rendez-vous à venir" text="Notez vos prochains rendez-vous pour les retrouver ici, avec les questions que vous voulez poser." />}

      {past.length > 0 && (
        <>
          <SectionTitle title="Passés" action={past.length > 5 ? (showAllPast ? 'Réduire' : 'Tout afficher') : undefined} onAction={() => setShowAllPast((v) => !v)} />
          {(showAllPast ? past : past.slice(0, 5)).map((a) => renderAppt(a, true))}
        </>
      )}

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}>
        {draft && (
          <>
            <Text variant="label">Type</Text>
            <Row wrap>
              {KINDS.map((k) => (
                <Chip key={k.value} label={k.label} icon={k.icon} selected={draft.kind === k.value} onPress={() => { set('kind', k.value); if (!draft.title.trim() || KINDS.some((x) => x.label === draft.title)) set('title', k.label); }} />
              ))}
            </Row>
            <Field label="Intitulé" value={draft.title} onChangeText={(v) => set('title', v)} error={errors.title} maxLength={120} placeholder="Échographie du 2e trimestre" />
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 3 }}><Field label="Date" value={draft.date} onChangeText={(v) => set('date', v)} error={errors.date} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
              <View style={{ flex: 2 }}><Field label="Heure" value={draft.time} onChangeText={(v) => set('time', v)} error={errors.time} placeholder="14h30" keyboardType="numbers-and-punctuation" /></View>
            </Row>
            {concerns.length > 1 && (
              <>
                <Text variant="label">Pour qui ?</Text>
                <Row wrap>{concerns.map((c) => <Chip key={c.value} label={c.label} selected={draft.concern === c.value} onPress={() => set('concern', c.value)} />)}</Row>
              </>
            )}
            {draft.concern === 'me' ? (
              <Row style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="medium">Visible uniquement par moi</Text>
                  <Text variant="caption" muted>Sinon, ce rendez-vous apparaît aux membres du foyer qui ont accès à la santé.</Text>
                </View>
                <Toggle label="Visible uniquement par moi" value={draft.private} onChange={(v) => set('private', v)} />
              </Row>
            ) : null}
            <Field label="Lieu" optional value={draft.location} onChangeText={(v) => set('location', v)} maxLength={160} placeholder="Maternité, cabinet…" />
            <Field label="Questions à poser" optional value={draft.questions} onChangeText={(v) => set('questions', v)} multiline hint="Une question par ligne." style={{ minHeight: 90, textAlignVertical: 'top' }} />
            <Field label="Notes" optional value={draft.notes} onChangeText={(v) => set('notes', v)} multiline maxLength={4000} style={{ minHeight: 70, textAlignVertical: 'top' }} />
            <Text variant="label">Rappel</Text>
            <Segmented label="Rappel" value={String(draft.lead)} onChange={(v) => set('lead', Number(v) as ReminderLead)} options={LEADS} />
            {draft.lead !== 0 && !notificationsSupported && <Banner tone="info">{'Les rappels s’affichent sur votre téléphone (iOS ou Android). Sur le web, ils sont enregistrés mais ne sonnent pas.'}</Banner>}
            <Button label={draft.id ? 'Enregistrer les modifications' : 'Ajouter'} onPress={save} loading={saving} full />
            {draft.id && <Button label="Supprimer ce rendez-vous" variant="ghost" onPress={() => { const a = appointments?.find((x) => x.id === draft.id); if (a) remove(a); }} />}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
