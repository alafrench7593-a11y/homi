/** Rappels : liste, création, modification, suppression, activation ; notifications locales synchronisées. */
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, Loading, Row, Segmented, SectionTitle, Text, Toggle } from '@/components/ui';
import { EmptyStateCard } from '@/components/ui-extra';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { useProfile, useReminders } from '@/lib/data/hooks';
import { reminderSuggestions } from '@/lib/domain/journeys';
import { friendlyError, useDeleteReminder, useSaveReminder, useToggleReminder, type ReminderDraft } from '@/lib/data/hooks-settings';
import { describeSchedule, IOS_PENDING_LIMIT, nextOccurrence, validateSchedule, type ReminderSchedule, type Weekday } from '@/lib/domain/reminders';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { askNotificationPermission } from '@/lib/notificationPrompt';
import { getPermission, notificationsSupported, scheduledCount, sendTestNotification, type PermissionState } from '@/lib/notifications';
import type { Reminder } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const CATEGORIES: { value: Reminder['category']; label: string }[] = [
  { value: 'custom', label: 'Personnel' },
  { value: 'medication', label: 'Médicament' },
  { value: 'bottle', label: 'Biberon' },
  { value: 'meal', label: 'Repas' },
  { value: 'appointment', label: 'Rendez-vous' },
  { value: 'tracking', label: 'Suivi' },
  { value: 'postnatal', label: 'Post-partum' },
  { value: 'checklist', label: 'Préparatifs' },
];
const WEEKDAYS: { d: Weekday; label: string }[] = [
  { d: 1, label: 'Lun' }, { d: 2, label: 'Mar' }, { d: 3, label: 'Mer' }, { d: 4, label: 'Jeu' }, { d: 5, label: 'Ven' }, { d: 6, label: 'Sam' }, { d: 7, label: 'Dim' },
];
const INTERVALS = [60, 120, 180, 240];
type Kind = ReminderSchedule['type'];

const pad = (n: number) => String(n).padStart(2, '0');
function parseTime(s: string): { hour: number; minute: number } | null {
  const m = s.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{0,2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

interface Form {
  title: string; body: string; category: Reminder['category']; kind: Kind;
  date: string; time: string; weekdays: Weekday[]; every: number; from: string; to: string;
}

function toForm(r?: Reminder): Form {
  const base: Form = { title: '', body: '', category: 'custom', kind: 'daily', date: toFrDate(todayISO()), time: '09:00', weekdays: [1, 2, 3, 4, 5], every: 180, from: '7', to: '21' };
  if (!r) return base;
  const s = r.schedule;
  const f: Form = { ...base, title: r.title, body: r.body ?? '', category: r.category, kind: s.type };
  if (s.type === 'once') {
    const d = new Date(s.at);
    f.date = toFrDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    f.time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } else if (s.type === 'daily') f.time = `${pad(s.hour)}:${pad(s.minute)}`;
  else if (s.type === 'weekly') { f.time = `${pad(s.hour)}:${pad(s.minute)}`; f.weekdays = s.weekdays; }
  else { f.every = s.minutes; f.from = String(s.from_hour); f.to = String(s.to_hour); }
  return f;
}

function buildSchedule(f: Form): { schedule?: ReminderSchedule; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let schedule: ReminderSchedule | undefined;
  const tm = parseTime(f.time);
  if (f.kind !== 'interval' && !tm) errors.time = 'Heure attendue au format HH:MM (ex. 08:30).';
  if (f.kind === 'once') {
    const iso = frToISO(f.date);
    if (!iso) errors.date = 'Date attendue au format JJ/MM/AAAA.';
    if (iso && tm) {
      const [y, mo, d] = iso.split('-').map(Number);
      const at = new Date(y, mo - 1, d, tm.hour, tm.minute);
      if (at.getTime() <= Date.now()) errors.date = 'Choisissez un moment dans le futur.';
      else schedule = { type: 'once', at: at.toISOString() };
    }
  } else if (f.kind === 'daily' && tm) schedule = { type: 'daily', hour: tm.hour, minute: tm.minute };
  else if (f.kind === 'weekly') {
    if (!f.weekdays.length) errors.weekdays = 'Choisissez au moins un jour.';
    else if (tm) schedule = { type: 'weekly', weekdays: [...f.weekdays].sort(), hour: tm.hour, minute: tm.minute };
  } else if (f.kind === 'interval') {
    const from = Number(f.from);
    const to = Number(f.to);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to > 24 || from >= to) errors.range = 'Plage horaire invalide (ex. de 7 à 21 h).';
    else schedule = { type: 'interval', minutes: f.every, from_hour: from, to_hour: to };
  }
  if (schedule && !validateSchedule(schedule)) {
    errors.time = 'Cette planification n’est pas valide.';
    schedule = undefined;
  }
  return { schedule, errors };
}

function ReminderEditor({ reminder, visible, onClose }: { reminder?: Reminder; visible: boolean; onClose: (result?: { skipped: number }) => void }) {
  const t = useTheme();
  const toast = useToast();
  const save = useSaveReminder();
  const del = useDeleteReminder();
  const [f, setF] = useState<Form>(() => toForm(reminder));
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (visible) { setF(toForm(reminder)); setErrors({}); }
  }, [visible, reminder]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    const { schedule, errors: e } = buildSchedule(f);
    if (!f.title.trim()) e.title = 'Donnez un titre à ce rappel.';
    if (f.body.length > 240) e.body = '240 caractères au maximum.';
    setErrors(e);
    if (Object.keys(e).length || !schedule) return;
    const draft: ReminderDraft = { title: f.title.trim().slice(0, 80), body: f.body.trim() || null, category: f.category, schedule, enabled: reminder?.enabled ?? true };
    try {
      const res = await save.mutateAsync({ id: reminder?.id, draft });
      toast(reminder ? 'Rappel modifié.' : 'Rappel créé.');
      onClose(res);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function remove() {
    if (!reminder) return;
    if (!(await confirm('Supprimer ce rappel ?', 'Les notifications programmées seront annulées.', 'Supprimer'))) return;
    try {
      await del.mutateAsync(reminder.id);
      toast('Rappel supprimé.');
      onClose();
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  const preview = buildSchedule(f).schedule;
  return (
    <Sheet visible={visible} onClose={() => onClose()} title={reminder ? 'Modifier le rappel' : 'Nouveau rappel'}>
      <Field label="Titre" value={f.title} onChangeText={(v) => set('title', v)} maxLength={80} error={errors.title} placeholder="ex. Vitamine D" />
      <Field label="Note" optional value={f.body} onChangeText={(v) => set('body', v)} maxLength={240} error={errors.body} hint="Affichée dans la notification. Évitez les informations trop personnelles : l’écran verrouillé peut être vu." />
      <Text variant="label">Catégorie</Text>
      <Row wrap>{CATEGORIES.map((c) => <Chip key={c.value} label={c.label} selected={f.category === c.value} onPress={() => set('category', c.value)} />)}</Row>
      <Segmented label="Fréquence" value={f.kind} onChange={(v) => set('kind', v)} options={[{ value: 'once', label: 'Une fois' }, { value: 'daily', label: 'Chaque jour' }, { value: 'weekly', label: 'Jours choisis' }, { value: 'interval', label: 'Régulier' }]} />
      {f.kind === 'once' ? <Field label="Date" value={f.date} onChangeText={(v) => set('date', v)} keyboardType="numbers-and-punctuation" error={errors.date} placeholder="JJ/MM/AAAA" /> : null}
      {f.kind === 'weekly' ? (
        <View style={{ gap: 6 }}>
          <Text variant="label">Jours</Text>
          <Row wrap>{WEEKDAYS.map((w) => <Chip key={w.d} label={w.label} selected={f.weekdays.includes(w.d)} onPress={() => set('weekdays', f.weekdays.includes(w.d) ? f.weekdays.filter((x) => x !== w.d) : [...f.weekdays, w.d])} />)}</Row>
          {errors.weekdays ? <Text variant="small" color={t.colors.danger}>{errors.weekdays}</Text> : null}
        </View>
      ) : null}
      {f.kind !== 'interval' ? <Field label="Heure" value={f.time} onChangeText={(v) => set('time', v)} keyboardType="numbers-and-punctuation" error={errors.time} placeholder="HH:MM" /> : (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label">Toutes les</Text>
          <Row wrap>{INTERVALS.map((m) => <Chip key={m} label={m < 60 ? `${m} min` : `${m / 60} h`} selected={f.every === m} onPress={() => set('every', m)} />)}</Row>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}><Field label="De" value={f.from} onChangeText={(v) => set('from', v.replace(/\D/g, ''))} keyboardType="number-pad" suffix="h" maxLength={2} /></View>
            <View style={{ flex: 1 }}><Field label="À" value={f.to} onChangeText={(v) => set('to', v.replace(/\D/g, ''))} keyboardType="number-pad" suffix="h" maxLength={2} /></View>
          </Row>
          {errors.range ? <Text variant="small" color={t.colors.danger}>{errors.range}</Text> : null}
        </View>
      )}
      {preview ? <Text variant="small" muted>{`Rappel ${describeSchedule(preview)}.`}</Text> : null}
      <Button label={reminder ? 'Enregistrer' : 'Créer le rappel'} loading={save.isPending} onPress={submit} />
      {reminder ? <Button label="Supprimer ce rappel" variant="ghost" icon="trash-2" loading={del.isPending} onPress={remove} /> : null}
    </Sheet>
  );
}

export default function RemindersScreen() {
  const t = useTheme();
  const toast = useToast();
  const { data: reminders, isLoading, error, refetch } = useReminders();
  const toggle = useToggleReminder();
  const save = useSaveReminder();
  const { data: profile } = useProfile();
  const [permission, setPermission] = useState<PermissionState>(notificationsSupported ? 'undetermined' : 'unsupported');
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [editing, setEditing] = useState<Reminder | undefined>();
  const [open, setOpen] = useState(false);
  const [skipped, setSkipped] = useState(0);

  const refreshStatus = useCallback(() => {
    getPermission().then(setPermission).catch(() => undefined);
    scheduledCount().then(setPendingCount).catch(() => undefined);
  }, []);
  useEffect(refreshStatus, [refreshStatus, reminders]);

  async function ask() {
    const p = await askNotificationPermission('Pour recevoir les rappels que vous avez choisis (biberon, rendez-vous, cycle…).');
    setPermission(p);
    if (p === 'granted') toast('Notifications autorisées.');
    refreshStatus();
  }

  async function onToggle(r: Reminder, enabled: boolean) {
    try {
      const res = await toggle.mutateAsync({ id: r.id, enabled });
      setSkipped(res.skipped);
      refreshStatus();
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const list = reminders ?? [];
  const suggestions = reminderSuggestions(profile?.journeys ?? []).filter((sg) => !list.some((r) => r.title === sg.title));
  return (
    <Screen back title="Rappels" subtitle="Des notifications sur ce téléphone, même hors connexion." footer={<Button label="Nouveau rappel" icon="plus" onPress={() => { setEditing(undefined); setOpen(true); }} />}>
      {permission === 'unsupported' ? (
        <Banner tone="info">{'Les notifications de rappel s’affichent sur téléphone (iOS et Android). Vous pouvez préparer vos rappels ici : ils seront programmés à la prochaine ouverture de l’application sur votre téléphone.'}</Banner>
      ) : permission === 'undetermined' ? (
        <Banner tone="warning" title="Notifications désactivées" action={<Button label="Autoriser les notifications" size="sm" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={ask} />}>
          {'Autorisez les notifications pour recevoir vos rappels à l’heure prévue.'}
        </Banner>
      ) : permission === 'denied' ? (
        <Banner tone="warning" title="Notifications refusées" action={<Button label="Ouvrir les réglages du téléphone" size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => Linking.openSettings().catch(() => undefined)} />}>
          {'Vos rappels sont enregistrés mais ne pourront pas s’afficher tant que les notifications sont refusées pour l’application.'}
        </Banner>
      ) : null}

      {isLoading ? <Loading /> : error ? (
        <Banner tone="danger" title="Impossible d’afficher les rappels" action={<Button label="Réessayer" size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => refetch()} />}>{friendlyError(error)}</Banner>
      ) : list.length === 0 ? (
        <EmptyStateCard illustration="moon" title="Aucun rappel pour l’instant" text="Vitamine, biberon, rendez-vous, rééducation… Créez un rappel et nous vous préviendrons au bon moment." />
      ) : (
        <Card>
          {list.map((r, i) => {
            const next = r.enabled ? nextOccurrence(r.schedule) : null;
            return (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Modifier le rappel ${r.title}`} style={{ flex: 1, minHeight: 48, justifyContent: 'center', opacity: r.enabled ? 1 : 0.55 }} onPress={() => { setEditing(r); setOpen(true); }}>
                  <Text weight="medium">{r.title}</Text>
                  <Text variant="small" muted>{validateSchedule(r.schedule) ? describeSchedule(r.schedule) : 'Planification à corriger'}</Text>
                  {next ? <Text variant="caption" muted>{`Prochain : ${next.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}</Text> : null}
                </Pressable>
                <Toggle label={`${r.enabled ? 'Désactiver' : 'Activer'} le rappel ${r.title}`} value={r.enabled} onChange={(v) => onToggle(r, v)} />
              </View>
            );
          })}
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card>
          <Text weight="bold">Suggestions pour votre parcours</Text>
          <Text variant="small" muted>Rien n’est activé sans vous : ajoutez seulement ce qui vous aide.</Text>
          {suggestions.map((sg) => (
            <View key={sg.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
              <Text style={{ flex: 1 }}>{sg.label}</Text>
              <Button label="Ajouter" size="sm" variant="secondary" onPress={async () => {
                try {
                  await save.mutateAsync({ draft: { category: sg.category, title: sg.title, body: sg.body, schedule: sg.schedule, enabled: true, deep_link: sg.deep_link } });
                  toast('Rappel ajouté.');
                } catch (e) { toast(friendlyError(e), 'error'); }
              }} />
            </View>
          ))}
        </Card>
      )}

      {skipped > 0 ? (
        <Banner tone="warning">{`${skipped} notification${skipped > 1 ? 's n’ont' : ' n’a'} pas pu être programmée${skipped > 1 ? 's' : ''} : la limite du téléphone est atteinte. Désactivez des rappels peu utiles ou espacez-les.`}</Banner>
      ) : null}

      <SectionTitle title="Bon à savoir" />
      <Card tone="soft">
        <Text variant="small">
          {`Sur iPhone, une application ne peut pas programmer plus de ${IOS_PENDING_LIMIT} notifications à l’avance. Un rappel « régulier » en utilise une par horaire de la journée, un rappel « jours choisis » une par jour coché.`}
        </Text>
        {Platform.OS === 'ios' && pendingCount != null ? <Text variant="small" muted style={{ marginTop: 6 }}>{`Actuellement programmées : ${pendingCount} / ${IOS_PENDING_LIMIT}.`}</Text> : null}
        {Platform.OS === 'android' && pendingCount != null ? <Text variant="small" muted style={{ marginTop: 6 }}>{`Actuellement programmées : ${pendingCount}.`}</Text> : null}
        <Text variant="small" muted style={{ marginTop: 6 }}>Les rappels respectent le mode silencieux et « Ne pas déranger » de votre téléphone, ainsi que le changement d’heure.</Text>
      </Card>
      {permission === 'granted' ? (
        <Button label="Envoyer une notification de test" variant="secondary" icon="bell" onPress={async () => { await sendTestNotification(); toast('Notification de test envoyée dans 3 secondes.', 'info'); }} />
      ) : null}

      <ReminderEditor reminder={editing} visible={open} onClose={(res) => { setOpen(false); if (res) setSkipped(res.skipped); refreshStatus(); }} />
    </Screen>
  );
}
