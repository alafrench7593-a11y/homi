/**
 * Feuilles partagées par le calendrier de grossesse et le calendrier vaccinal :
 *  · AppointmentSheet : confirmer une date, choisir une heure (facultative), un lieu, une note ; modifier, supprimer.
 *    L'application n'invente jamais d'heure ni d'établissement.
 *  · RemindersSheet : rappels choisis (un mois, deux semaines, une semaine avant, la veille, quelques heures avant,
 *    personnalisé) ; rappels existants affichés et supprimables.
 *  · DocumentsSheet : joindre une ordonnance, un compte rendu ou une photo du carnet déjà rangés dans Documents.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useDocuments } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteAppointment, useDeleteReminder, useLinkedReminders, useSaveAppointment, useScheduleReminders, useSetDocuments, type AppointmentDraft, type CareAppointment } from '@/lib/data/hooks-care';
import { reminderDates, type ReminderChoice } from '@/lib/domain/pregnancyCare';
import { frToISO, todayISO, type ISODate } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import type { Reminder } from '@/lib/types';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const hhmm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const localISO = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** « mardi 14 novembre à 15 h 30 » ou « mardi 14 novembre (heure non précisée) ». */
export function appointmentWhen(a: Pick<CareAppointment, 'starts_at' | 'time_set'>): string {
  const day = formatDate(a.starts_at, { weekday: 'long', day: 'numeric', month: 'long' });
  if (a.time_set === false) return tr('care.appt.noTime', { day });
  const d = new Date(a.starts_at);
  return tr('care.appt.at', { day, time: d.getMinutes() ? tr('dom.time.hm', { h: String(d.getHours()), m: String(d.getMinutes()).padStart(2, '0') }) : tr('dom.time.h', { h: String(d.getHours()) }) });
}

export function AppointmentSheet({ visible, onClose, base, existing, suggestedDay, window: win, onSaved }: {
  visible: boolean;
  onClose: () => void;
  base: Omit<AppointmentDraft, 'day' | 'time' | 'location' | 'notes'>;
  existing?: CareAppointment | null;
  /** Jour proposé (début de la période indicative), à confirmer. */
  suggestedDay?: ISODate | null;
  window?: { from: ISODate; to: ISODate } | null;
  onSaved?: (id: string | null) => void;
}) {
  const toast = useToast();
  const save = useSaveAppointment();
  const del = useDeleteAppointment();
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [title, setTitle] = useState(base.title);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setError(null);
    setTitle(existing?.title ?? base.title);
    setDay(existing ? toFrDate(localISO(existing.starts_at)) : suggestedDay ? toFrDate(suggestedDay) : '');
    setTime(existing && existing.time_set !== false ? hhmm(existing.starts_at) : '');
    setPlace(existing?.location_label ?? '');
    setNote(existing?.notes ?? '');
  }, [visible, existing, suggestedDay, base.title]);
  const iso = frToISO(day);
  const outside = !!(iso && win && (iso < win.from || iso > win.to));
  async function submit() {
    if (!iso) return setError(tr('care.appt.errDate'));
    if (time && !/^\d{1,2}[:h ]?\d{0,2}$/i.test(time.trim())) return setError(tr('care.appt.errTime'));
    if (!title.trim()) return setError(tr('care.appt.errTitle'));
    try {
      const id = await save.mutateAsync({ ...base, id: existing?.id, title: title.trim(), day: iso, time: time.trim() || null, location: place, notes: note, documentIds: existing?.document_ids ?? base.documentIds });
      toast(tr(existing ? 'care.appt.updated' : 'care.appt.saved'), 'success');
      onSaved?.(id);
      onClose();
    } catch (e) { setError(friendlyError(e)); }
  }
  async function remove() {
    if (!existing) return;
    if (!(await confirm(tr('care.appt.deleteTitle'), tr('care.appt.deleteBody'), tr('common.delete')))) return;
    try { await del.mutateAsync(existing.id); toast(tr('care.appt.deleted')); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr(existing ? 'care.appt.editTitle' : 'care.appt.addTitle')}>
      <View style={{ gap: spacing.sm }} testID="care-appt-sheet">
        <Text variant="small" muted>{tr('care.appt.honest')}</Text>
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <Field label={tr('care.appt.title')} value={title} onChangeText={setTitle} maxLength={120} testID="care-appt-title" />
        <Field label={tr('care.appt.day')} value={day} onChangeText={setDay} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" testID="care-appt-day" />
        {outside ? <Text variant="caption" muted testID="care-appt-outside">{tr('care.appt.outside')}</Text> : null}
        <Field label={tr('care.appt.time')} optional value={time} onChangeText={setTime} placeholder="15:30" keyboardType="numbers-and-punctuation" hint={tr('care.appt.timeHint')} testID="care-appt-time" />
        <Field label={tr('care.appt.place')} optional value={place} onChangeText={setPlace} maxLength={160} testID="care-appt-place" />
        <Field label={tr('care.appt.note')} optional value={note} onChangeText={setNote} maxLength={1000} multiline />
        <Button label={tr('common.save')} full loading={save.isPending} onPress={submit} testID="care-appt-save" />
        {existing ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={remove} testID="care-appt-delete" /> : null}
      </View>
    </Sheet>
  );
}

const CHOICE_LABEL: Record<ReminderChoice, TKey> = {
  month: 'care.rem.month', two_weeks: 'care.rem.twoWeeks', week: 'care.rem.week', eve: 'care.rem.eve', hours: 'care.rem.hours', custom: 'care.rem.custom',
};

/** Rappels : choix multiples ; un rappel déjà passé n'est jamais programmé. */
export function RemindersSheet({ visible, onClose, choices, target, allDay, title, body, deepLink, link }: {
  visible: boolean;
  onClose: () => void;
  choices: ReminderChoice[];
  target: Date | null;
  allDay?: boolean;
  title: string;
  body: string;
  /** Lien unique de l'échéance : sert à retrouver les rappels déjà programmés. */
  deepLink: string;
  link: { category: Reminder['category']; childId?: string | null; pregnancyId?: string | null; appointmentId?: string | null; journeyType?: string | null };
}) {
  const t = useTheme();
  const toast = useToast();
  const schedule = useScheduleReminders();
  const remove = useDeleteReminder();
  const existing = useLinkedReminders(deepLink);
  const [picked, setPicked] = useState<ReminderChoice[]>([]);
  const [custom, setCustom] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  useEffect(() => { if (visible) { setPicked([]); setCustom(''); } }, [visible]);
  const customDate = (() => {
    const iso = frToISO(custom);
    if (!iso) return null;
    const [h, m] = (customTime.match(/^(\d{1,2})[:h ]?(\d{2})?$/)?.slice(1) ?? ['9', '0']).map((x) => Number(x ?? 0));
    const [y, mo, d] = iso.split('-').map(Number);
    return new Date(y, mo - 1, d, h || 0, m || 0);
  })();
  const dates = target ? reminderDates(target, picked, new Date(), customDate, allDay) : [];
  async function submit() {
    if (!dates.length) return toast(tr('care.rem.none'), 'info');
    try {
      const n = await schedule.mutateAsync({ dates, title, body, deepLink, ...link });
      toast(tr('care.rem.saved', { count: n ?? 0 }), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('care.rem.title')}>
      <View style={{ gap: spacing.sm }} testID="care-rem-sheet">
        <Text variant="small" muted>{body}</Text>
        <Row wrap>
          {choices.map((c) => {
            const past = c !== 'custom' && !!target && !reminderDates(target, [c], new Date(), null, allDay).length;
            return <Chip key={c} label={tr(CHOICE_LABEL[c])} selected={picked.includes(c)} testID={`care-rem-${c}`} accessibilityLabel={past ? tr('care.rem.pastA11y', { label: tr(CHOICE_LABEL[c]) }) : undefined}
              onPress={() => (past ? toast(tr('care.rem.past'), 'info') : setPicked(picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c]))} />;
          })}
        </Row>
        {picked.includes('custom') ? (
          <Row wrap>
            <View style={{ flexGrow: 1, minWidth: 140 }}><Field label={tr('care.rem.customDay')} value={custom} onChangeText={setCustom} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" testID="care-rem-custom-day" /></View>
            <View style={{ width: 110 }}><Field label={tr('care.rem.customTime')} value={customTime} onChangeText={setCustomTime} placeholder="09:00" keyboardType="numbers-and-punctuation" /></View>
          </Row>
        ) : null}
        {dates.length ? <Text variant="caption" muted testID="care-rem-preview">{dates.map((d) => formatDate(d.toISOString(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })).join(' · ')}</Text> : null}
        <Button label={tr('care.rem.create')} icon="bell" full onPress={submit} loading={schedule.isPending} testID="care-rem-save" />
        {existing.length ? <Text variant="label">{tr('care.rem.existing')}</Text> : null}
        {existing.map((r) => (
          <Row key={r.id} style={{ alignItems: 'center' }}>
            <Icon name="bell" size={16} color={t.colors.textMuted} />
            <Text variant="small" style={{ flex: 1 }}>{r.schedule.type === 'once' ? formatDate(r.schedule.at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : r.title}</Text>
            <Button label={tr('common.delete')} size="sm" variant="ghost" onPress={() => remove.mutate(r.id)} />
          </Row>
        ))}
        <Text variant="caption" muted>{tr('care.rem.lockScreen')}</Text>
      </View>
    </Sheet>
  );
}

/** Joindre des documents déjà rangés (filtrés sur la grossesse ou l'enfant), ou en ajouter un nouveau. */
export function DocumentsSheet({ visible, onClose, target, selected, childId, pregnancyId }: {
  visible: boolean;
  onClose: () => void;
  target: { table: 'appointments' | 'child_vaccinations'; id: string } | null;
  selected: string[];
  childId?: string | null;
  pregnancyId?: string | null;
}) {
  const t = useTheme();
  const toast = useToast();
  const docs = useDocuments().data ?? [];
  const setDocs = useSetDocuments();
  const [ids, setIds] = useState<string[]>(selected);
  useEffect(() => { if (visible) setIds(selected); }, [visible, selected]);
  const list = docs.filter((d) => !d.archived && (childId ? d.child_id === childId || !d.child_id : pregnancyId ? d.pregnancy_id === pregnancyId || !d.pregnancy_id : true));
  async function submit() {
    if (!target) return;
    try { await setDocs.mutateAsync({ ...target, ids }); toast(tr('care.doc.saved', { count: ids.length }), 'success'); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('care.doc.title')}>
      <View style={{ gap: spacing.xs }} testID="care-doc-sheet">
        {!list.length ? <Text variant="small" muted>{tr('care.doc.empty')}</Text> : null}
        {list.slice(0, 40).map((d) => {
          const on = ids.includes(d.id);
          return (
            <Tappable key={d.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} testID={`care-doc-${d.id}`} onPress={() => setIds(on ? ids.filter((x) => x !== d.id) : [...ids, d.id])}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
              <Icon name={on ? 'check-square' : 'square'} size={20} color={on ? t.colors.primary : t.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text weight="bold" numberOfLines={1}>{d.title}</Text>
                {d.doc_date ? <Text variant="caption" muted>{toFrDate(d.doc_date)}</Text> : null}
              </View>
            </Tappable>
          );
        })}
        <Button label={tr('care.doc.new')} icon="camera" variant="secondary" onPress={() => { onClose(); router.push('/documents/scan' as never); }} />
        <Button label={tr('common.save')} full onPress={submit} loading={setDocs.isPending} testID="care-doc-save" />
        <Text variant="caption" muted>{tr('care.doc.private')}</Text>
      </View>
    </Sheet>
  );
}

/** Ligne « Documents joints » cliquable (ouvre chaque document). */
export function AttachedDocs({ ids }: { ids?: string[] }) {
  const t = useTheme();
  const docs = useDocuments().data ?? [];
  const list = (ids ?? []).map((id) => docs.find((d) => d.id === id)).filter(Boolean);
  if (!list.length) return null;
  return (
    <View style={{ gap: 2 }}>
      {list.map((d) => (
        <Tappable key={d!.id} accessibilityRole="link" onPress={() => router.push(`/documents/${d!.id}` as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 }}>
          <Icon name="paperclip" size={14} color={t.colors.primary} />
          <Text variant="small" color={t.colors.primary} numberOfLines={1}>{d!.title}</Text>
        </Tappable>
      ))}
    </View>
  );
}

export { todayISO };
