/** Rappels : liste, création, modification, suppression, activation ; notifications locales synchronisées. */
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, Loading, Row, Segmented, SectionTitle, Text, Toggle } from '@/components/ui';
import { EmptyStateCard } from '@/components/ui-extra';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { useActivePregnancy, useProfile, useReminders } from '@/lib/data/hooks';
import { useLocalSearchParams } from 'expo-router';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { isPremiumRequired } from '@/lib/premium/features';
import { reminderSuggestions } from '@/lib/domain/journeys';
import { usePlanLimits, friendlyError, useDeleteReminder, useSaveReminder, useToggleReminder, type ReminderDraft } from '@/lib/data/hooks-settings';
import { describeSchedule, IOS_PENDING_LIMIT, nextOccurrence, validateSchedule, type ReminderSchedule, type Weekday } from '@/lib/domain/reminders';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { askNotificationPermission } from '@/lib/notificationPrompt';
import { getPermission, notificationsSupported, scheduledCount, sendTestNotification, type PermissionState } from '@/lib/notifications';
import type { Reminder } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr, formatDate } from '@/i18n';

const categories = (): { value: Reminder['category']; label: string }[] => [
  { value: 'custom', label: tr('u1.rem.cat.custom') },
  { value: 'medication', label: tr('u1.rem.cat.medication') },
  { value: 'bottle', label: tr('u1.rem.cat.bottle') },
  { value: 'meal', label: tr('u1.rem.cat.meal') },
  { value: 'appointment', label: tr('u1.rem.cat.appointment') },
  { value: 'tracking', label: tr('u1.rem.cat.tracking') },
  { value: 'postnatal', label: tr('u1.rem.cat.postnatal') },
  { value: 'checklist', label: tr('u1.rem.cat.checklist') },
];
const weekdays = (): { d: Weekday; label: string }[] => [
  { d: 1, label: tr('u1.rem.wd.1') }, { d: 2, label: tr('u1.rem.wd.2') }, { d: 3, label: tr('u1.rem.wd.3') }, { d: 4, label: tr('u1.rem.wd.4') }, { d: 5, label: tr('u1.rem.wd.5') }, { d: 6, label: tr('u1.rem.wd.6') }, { d: 7, label: tr('u1.rem.wd.7') },
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
  title: string; body: string; category: Reminder['category']; kind: Kind; forPregnancy: boolean;
  date: string; time: string; weekdays: Weekday[]; every: number; from: string; to: string;
}

function toForm(r?: Reminder): Form {
  const base: Form = { forPregnancy: false, title: '', body: '', category: 'custom', kind: 'daily', date: toFrDate(todayISO()), time: '09:00', weekdays: [1, 2, 3, 4, 5], every: 180, from: '7', to: '21' };
  if (!r) return base;
  const s = r.schedule;
  const f: Form = { ...base, title: r.title, body: r.body ?? '', category: r.category, kind: s.type, forPregnancy: !!r.pregnancy_id };
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
  if (f.kind !== 'interval' && !tm) errors.time = tr('u1.rem.errTime');
  if (f.kind === 'once') {
    const iso = frToISO(f.date);
    if (!iso) errors.date = tr('u1.rem.errDate');
    if (iso && tm) {
      const [y, mo, d] = iso.split('-').map(Number);
      const at = new Date(y, mo - 1, d, tm.hour, tm.minute);
      if (at.getTime() <= Date.now()) errors.date = tr('u1.rem.errFuture');
      else schedule = { type: 'once', at: at.toISOString() };
    }
  } else if (f.kind === 'daily' && tm) schedule = { type: 'daily', hour: tm.hour, minute: tm.minute };
  else if (f.kind === 'weekly') {
    if (!f.weekdays.length) errors.weekdays = tr('u1.rem.errDays');
    else if (tm) schedule = { type: 'weekly', weekdays: [...f.weekdays].sort(), hour: tm.hour, minute: tm.minute };
  } else if (f.kind === 'interval') {
    const from = Number(f.from);
    const to = Number(f.to);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to > 24 || from >= to) errors.range = tr('u1.rem.errRange');
    else schedule = { type: 'interval', minutes: f.every, from_hour: from, to_hour: to };
  }
  if (schedule && !validateSchedule(schedule)) {
    errors.time = tr('u1.rem.errInvalid');
    schedule = undefined;
  }
  return { schedule, errors };
}

function ReminderEditor({ reminder, visible, onClose, supplement }: { reminder?: Reminder; visible: boolean; onClose: (result?: { skipped: number }) => void; supplement?: boolean }) {
  const t = useTheme();
  const pregnancy = useActivePregnancy();
  const moreReminders = usePremiumAccess('more_reminders');
  const remLimit = usePlanLimits().data?.find((l) => l.key === 'custom_reminders_count')?.free_value ?? 5;
  const toast = useToast();
  const save = useSaveReminder();
  const del = useDeleteReminder();
  const [f, setF] = useState<Form>(() => toForm(reminder));
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (visible) { setF(reminder ? toForm(reminder) : supplement ? { ...toForm(), category: 'medication', kind: 'daily', forPregnancy: !!pregnancy } : toForm()); setErrors({}); }
  }, [visible, reminder, supplement, pregnancy?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const setPreg = (v: boolean) => set('forPregnancy', v);

  async function submit() {
    const { schedule, errors: e } = buildSchedule(f);
    if (!f.title.trim()) e.title = tr('u1.rem.errTitle');
    if (f.body.length > 240) e.body = tr('u1.rem.errBody');
    setErrors(e);
    if (Object.keys(e).length || !schedule) return;
    const draft: ReminderDraft = {
      title: f.title.trim().slice(0, 80), body: f.body.trim() || null, category: f.category, schedule, enabled: reminder?.enabled ?? true,
      // toujours rattaché au bon profil : la grossesse en cours, sinon la personne elle-même
      pregnancy_id: f.forPregnancy ? (reminder?.pregnancy_id ?? pregnancy?.id ?? null) : null,
    };
    try {
      const res = await save.mutateAsync({ id: reminder?.id, draft });
      toast(reminder ? tr('u1.rem.modified') : tr('u1.rem.created'));
      onClose(res);
    } catch (err) {
      // Limite des rappels personnels (jamais pour un médicament prescrit, un biberon, un vaccin ou un rendez-vous)
      if (isPremiumRequired(err)) { moreReminders.showPreview(<Text variant="small">{tr('u1.rem.premiumReady', { title: draft.title })}</Text>, { used: remLimit, quota: remLimit, unit: tr('u1.rem.activeUnit'), monthly: false }); return; }
      toast(friendlyError(err), 'error');
    }
  }

  async function remove() {
    if (!reminder) return;
    if (!(await confirm(tr('u1.rem.deleteTitle'), tr('u1.rem.deleteBody'), tr('u1.rem.delete')))) return;
    try {
      await del.mutateAsync(reminder.id);
      toast(tr('u1.rem.deleted'));
      onClose();
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  const preview = buildSchedule(f).schedule;
  return (
    <Sheet visible={visible} onClose={() => onClose()} title={reminder ? tr('u1.rem.edit') : tr('u1.rem.new')}>
      {f.category === 'medication' ? <Banner tone="info">{tr('u1.rem.medBanner')}</Banner> : null}
      {pregnancy || f.forPregnancy ? (
        <View style={{ gap: 6 }}>
          <Text variant="label">{tr('u1.rem.forWhom')}</Text>
          <Row wrap>
            <Chip label={tr('u1.rem.me')} selected={!f.forPregnancy} onPress={() => setPreg(false)} />
            <Chip label={tr('u1.rem.myPregnancy')} selected={f.forPregnancy} onPress={() => setPreg(true)} />
          </Row>
        </View>
      ) : null}
      <Field label={tr('u1.rem.fieldTitle')} value={f.title} onChangeText={(v) => set('title', v)} maxLength={80} error={errors.title} placeholder={f.category === 'medication' ? tr('u1.rem.phMed') : tr('u1.rem.phOther')} testID="rem-title" />
      <Field label={tr('u1.rem.note')} optional value={f.body} onChangeText={(v) => set('body', v)} maxLength={240} error={errors.body} hint={tr('u1.rem.noteHint')} />
      <Text variant="label">{tr('u1.rem.category')}</Text>
      <Row wrap>{categories().map((c) => <Chip key={c.value} label={c.label} selected={f.category === c.value} onPress={() => set('category', c.value)} />)}</Row>
      <Segmented label={tr('u1.rem.frequency')} value={f.kind} onChange={(v) => set('kind', v)} options={[{ value: 'once', label: tr('u1.rem.once') }, { value: 'daily', label: tr('u1.rem.daily') }, { value: 'weekly', label: tr('u1.rem.weekly') }, { value: 'interval', label: tr('u1.rem.interval') }]} />
      {f.kind === 'once' ? <Field label={tr('u1.rem.date')} value={f.date} onChangeText={(v) => set('date', v)} keyboardType="numbers-and-punctuation" error={errors.date} placeholder={tr('u1.rem.phDate')} /> : null}
      {f.kind === 'weekly' ? (
        <View style={{ gap: 6 }}>
          <Text variant="label">{tr('u1.rem.days')}</Text>
          <Row wrap>{weekdays().map((w) => <Chip key={w.d} label={w.label} selected={f.weekdays.includes(w.d)} onPress={() => set('weekdays', f.weekdays.includes(w.d) ? f.weekdays.filter((x) => x !== w.d) : [...f.weekdays, w.d])} />)}</Row>
          {errors.weekdays ? <Text variant="small" color={t.colors.danger}>{errors.weekdays}</Text> : null}
        </View>
      ) : null}
      {f.kind !== 'interval' ? <Field label={tr('u1.rem.time')} value={f.time} onChangeText={(v) => set('time', v)} keyboardType="numbers-and-punctuation" error={errors.time} placeholder={tr('u1.rem.phTime')} testID="rem-time" /> : (
        <View style={{ gap: spacing.sm }}>
          <Text variant="label">{tr('u1.rem.every')}</Text>
          <Row wrap>{INTERVALS.map((m) => <Chip key={m} label={m < 60 ? `${m} min` : `${m / 60} h`} selected={f.every === m} onPress={() => set('every', m)} />)}</Row>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}><Field label={tr('u1.rem.from')} value={f.from} onChangeText={(v) => set('from', v.replace(/\D/g, ''))} keyboardType="number-pad" suffix="h" maxLength={2} /></View>
            <View style={{ flex: 1 }}><Field label={tr('u1.rem.to')} value={f.to} onChangeText={(v) => set('to', v.replace(/\D/g, ''))} keyboardType="number-pad" suffix="h" maxLength={2} /></View>
          </Row>
          {errors.range ? <Text variant="small" color={t.colors.danger}>{errors.range}</Text> : null}
        </View>
      )}
      {preview ? <Text variant="small" muted>{tr('u1.rem.preview', { schedule: describeSchedule(preview) })}</Text> : null}
      <Button label={reminder ? tr('u1.rem.save') : tr('u1.rem.create')} loading={save.isPending} onPress={submit} />
      {reminder ? <Button label={tr('u1.rem.deleteBtn')} variant="ghost" icon="trash-2" loading={del.isPending} onPress={remove} /> : null}
    </Sheet>
  );
}

export default function RemindersScreen() {
  const t = useTheme();
  const toast = useToast();
  const { data: reminders, isLoading, error, refetch } = useReminders();
  const toggle = useToggleReminder();
  const save = useSaveReminder();
  const moreReminders = usePremiumAccess('more_reminders');
  const remLimit = usePlanLimits().data?.find((l) => l.key === 'custom_reminders_count')?.free_value ?? 5;
  const { data: profile } = useProfile();
  const [permission, setPermission] = useState<PermissionState>(notificationsSupported ? 'undetermined' : 'unsupported');
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [editing, setEditing] = useState<Reminder | undefined>();
  const [open, setOpen] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const qp = useLocalSearchParams<{ new?: string }>();
  const [supplement, setSupplement] = useState(false);
  useEffect(() => { if (qp.new === 'supplement') { setSupplement(true); setEditing(undefined); setOpen(true); } }, [qp.new]);

  const refreshStatus = useCallback(() => {
    getPermission().then(setPermission).catch(() => undefined);
    scheduledCount().then(setPendingCount).catch(() => undefined);
  }, []);
  useEffect(refreshStatus, [refreshStatus, reminders]);

  async function ask() {
    const p = await askNotificationPermission(tr('u1.rem.permWhy'));
    setPermission(p);
    if (p === 'granted') toast(tr('u1.rem.permGranted'));
    refreshStatus();
  }

  async function onToggle(r: Reminder, enabled: boolean) {
    try {
      const res = await toggle.mutateAsync({ id: r.id, enabled });
      setSkipped(res.skipped);
      refreshStatus();
    } catch (e) {
      // Réactiver un rappel personnel au-delà de la limite gratuite (refusé par le serveur) : présentation Premium
      if (isPremiumRequired(e)) { moreReminders.showPreview(undefined, { used: remLimit, quota: remLimit, unit: tr('u1.rem.activeUnit'), monthly: false }); return; }
      toast(friendlyError(e), 'error');
    }
  }

  const list = reminders ?? [];
  const suggestions = reminderSuggestions(profile?.journeys ?? []).filter((sg) => !list.some((r) => r.title === sg.title));
  return (
    <Screen back title={tr('u1.rem.title')} subtitle={tr('u1.rem.subtitle')} footer={<Button label={tr('u1.rem.new')} icon="plus" onPress={() => { setEditing(undefined); setSupplement(false); setOpen(true); }} testID="reminder-new" />}>
      {permission === 'unsupported' ? (
        <Banner tone="info">{tr('u1.rem.unsupported')}</Banner>
      ) : permission === 'undetermined' ? (
        <Banner tone="warning" title={tr('u1.rem.notifOff')} action={<Button label={tr('u1.rem.allow')} size="sm" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={ask} />}>
          {tr('u1.rem.allowBody')}
        </Banner>
      ) : permission === 'denied' ? (
        <Banner tone="warning" title={tr('u1.rem.notifDenied')} action={<Button label={tr('u1.rem.openSettings')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => Linking.openSettings().catch(() => undefined)} />}>
          {tr('u1.rem.deniedBody')}
        </Banner>
      ) : null}

      {isLoading ? <Loading /> : error ? (
        <Banner tone="danger" title={tr('u1.rem.loadError')} action={<Button label={tr('u1.rem.retry')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => refetch()} />}>{friendlyError(error)}</Banner>
      ) : list.length === 0 ? (
        <EmptyStateCard illustration="moon" title={tr('u1.rem.emptyTitle')} text={tr('u1.rem.emptyText')} />
      ) : (
        <Card>
          {list.map((r, i) => {
            const next = r.enabled ? nextOccurrence(r.schedule) : null;
            return (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderTopWidth: i ? 0.5 : 0, borderColor: t.colors.border }}>
                <Tappable accessibilityRole="button" accessibilityLabel={tr('u1.rem.editA11y', { title: r.title })} style={{ flex: 1, minHeight: 48, justifyContent: 'center', opacity: r.enabled ? 1 : 0.55 }} onPress={() => { setEditing(r); setOpen(true); }}>
                  <Text weight="medium">{r.title}{r.pregnancy_id ? ` · ${tr('u1.rem.myPregnancy')}` : ''}</Text>
                  <Text variant="small" muted>{validateSchedule(r.schedule) ? describeSchedule(r.schedule) : tr('u1.rem.fixSchedule')}</Text>
                  {next ? <Text variant="caption" muted>{tr('u1.rem.next', { date: formatDate(next, { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</Text> : null}
                </Tappable>
                <Toggle label={tr(r.enabled ? 'u1.rem.disableA11y' : 'u1.rem.enableA11y', { title: r.title })} value={r.enabled} onChange={(v) => onToggle(r, v)} />
              </View>
            );
          })}
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card>
          <Text weight="bold">{tr('u1.rem.suggestions')}</Text>
          <Text variant="small" muted>{tr('u1.rem.suggestionsD')}</Text>
          {suggestions.map((sg) => (
            <View key={sg.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
              <Text style={{ flex: 1 }}>{sg.label}</Text>
              <Button label={tr('u1.rem.add')} size="sm" variant="secondary" onPress={async () => {
                try {
                  await save.mutateAsync({ draft: { category: sg.category, title: sg.title, body: sg.body, schedule: sg.schedule, enabled: true, deep_link: sg.deep_link } });
                  toast(tr('u1.rem.added'));
                } catch (e) { toast(friendlyError(e), 'error'); }
              }} />
            </View>
          ))}
        </Card>
      )}

      {skipped > 0 ? (
        <Banner tone="warning">{tr('u1.rem.skipped', { count: skipped })}</Banner>
      ) : null}

      <SectionTitle title={tr('u1.rem.goodToKnow')} />
      <Card tone="soft">
        <Text variant="small">
          {tr('u1.rem.iosLimit', { limit: IOS_PENDING_LIMIT })}
        </Text>
        {Platform.OS === 'ios' && pendingCount != null ? <Text variant="small" muted style={{ marginTop: 6 }}>{tr('u1.rem.scheduledIos', { count: pendingCount, limit: IOS_PENDING_LIMIT })}</Text> : null}
        {Platform.OS === 'android' && pendingCount != null ? <Text variant="small" muted style={{ marginTop: 6 }}>{tr('u1.rem.scheduled', { count: pendingCount })}</Text> : null}
        <Text variant="small" muted style={{ marginTop: 6 }}>{tr('u1.rem.silent')}</Text>
      </Card>
      {permission === 'granted' ? (
        <Button label={tr('u1.rem.test')} variant="secondary" icon="bell" onPress={async () => { await sendTestNotification(); toast(tr('u1.rem.testSent'), 'info'); }} />
      ) : null}

      <ReminderEditor reminder={editing} visible={open} supplement={supplement} onClose={(res) => { setOpen(false); setSupplement(false); if (res) setSkipped(res.skipped); refreshStatus(); }} />
    </Screen>
  );
}
