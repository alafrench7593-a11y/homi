/**
 * Traitements : prises du jour (Pris, Reporter, Ignorer, note) et liste, pour un enfant OU pour la maman.
 * Extrait de la fiche « Besoins particuliers » de l'enfant (07/11/2026) pour servir aussi l'écran « Médicaments ».
 * Règle absolue : le nom et la dose sont recopiés de l'ordonnance ou de la notice ; l'application ne calcule,
 * ne propose ni ne modifie aucune dose.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useReminders } from '@/lib/data/hooks';
import { View } from 'react-native';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, ListRow, Row, Segmented, SectionTitle, Text, Toggle } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useTheme } from '@/theme/ThemeProvider';
import { dosesFor, type Dose } from '@/features/needs';
import { useNow } from '@/lib/data/hooks-bottle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteTreatment, useLogDose, useSaveTreatment, useTreatmentLogs, useTreatments, type Treatment, type TreatmentLog } from '@/lib/data/hooks-needs';
import { useDeleteMyTreatment, useLogMyDose, useMyTreatmentLogs, useMyTreatments, useSaveMyTreatment, useUnlogDose, type MyTreatment, type MyTreatmentLog } from '@/lib/data/hooks-myTreatments';
import { formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { getPermission, notificationsSupported, requestPermission, snoozeLocally, type PermissionState } from '@/lib/notifications';
import { toFrDate } from '@/lib/validation';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { useTapShield } from '@/features/tapShield';

interface TDraft { name: string; dose: string; times: string; frequency: Treatment['frequency']; weekdays: number[]; start: string; end: string; instructions: string; prescriber: string; reminders: boolean; active: boolean }
const emptyT = (): TDraft => ({ name: '', dose: '', times: '', frequency: 'daily', weekdays: [], start: toFrDate(todayISO()), end: '', instructions: '', prescriber: '', reminders: true, active: true });
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

function validateT(d: TDraft): { errors: Record<string, string>; row?: Omit<Treatment, 'id' | 'household_id' | 'created_at' | 'child_id'> } {
  const e: Record<string, string> = {};
  if (!d.name.trim()) e.name = tr('nd.t.err.name');
  if (!d.dose.trim()) e.dose = tr('nd.t.err.dose');
  const times = d.times.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
  if (d.frequency !== 'as_prescribed' && (!times.length || times.length > 6 || times.some((x) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(x)))) e.times = tr('nd.t.err.times');
  if (d.frequency === 'weekly' && !d.weekdays.length) e.weekdays = tr('nd.t.err.weekdays');
  const start = frToISO(d.start);
  if (!start) e.start = tr('pj.start.err.format');
  const end = d.end.trim() ? frToISO(d.end) : null;
  if (d.end.trim() && !end) e.end = tr('pj.start.err.format');
  else if (end && start && end < start) e.end = tr('nd.t.err.end');
  if (Object.keys(e).length) return { errors: e };
  return {
    errors: e,
    row: {
      name: d.name.trim(), dose_text: d.dose.trim(), times: times.length ? [...new Set(times)].sort() : ['08:00'], frequency: d.frequency, weekdays: d.frequency === 'weekly' ? d.weekdays : [],
      start_date: start!, end_date: end, instructions: d.instructions.trim() || null, prescriber: d.prescriber.trim() || null, active: d.active,
    },
  };
}

export type TreatmentScope = { kind: 'child'; childId: string; childName: string } | { kind: 'me' };
type AnyTreatment = Treatment | MyTreatment;
type AnyLog = TreatmentLog | MyTreatmentLog;

export function TreatmentsPanel({ scope, noteDose, askTime, compact }: { scope: TreatmentScope; noteDose?: string; askTime?: string; compact?: boolean }) {
  const isChild = scope.kind === 'child';
  const childId = isChild ? scope.childId : null;
  const childName = isChild ? scope.childName : '';
  const label = (name: string) => (isChild ? `${childName} · ${name}` : name);
  const url = isChild ? `/child/${childId}/needs?tab=treatments` : '/medications?who=me';
  const tid = (x: string) => (isChild ? x : `me-${x}`);
  const toast = useToast();
  // Notifications refusées sur ce téléphone : les rappels ne sonneront pas, on le dit clairement (09/11/2026)
  const [perm, setPerm] = useState<PermissionState>('granted');
  useEffect(() => { void getPermission().then(setPerm).catch(() => undefined); }, []);
  const th = useTheme();
  const now = useNow(60_000);
  const childQ = useTreatments(childId);
  const myQ = useMyTreatments();
  const treatments: AnyTreatment[] | undefined = isChild ? childQ.data : myQ.data;
  const isLoading = isChild ? childQ.isLoading : myQ.isLoading;
  const ids = (treatments ?? []).map((x) => x.id);
  const dayStart = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }, [now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const childLogs = useTreatmentLogs(isChild ? ids : [], dayStart.toISOString()).data;
  const myLogs = useMyTreatmentLogs(isChild ? [] : ids, dayStart.toISOString()).data;
  const logs: AnyLog[] | undefined = isChild ? childLogs : myLogs;
  const doses = useMemo(() => dosesFor<AnyTreatment, AnyLog>(dayStart, treatments ?? [], logs ?? []), [dayStart, treatments, logs]);
  // Mes rappels : l'interrupteur « Rappels » reprend l'état réel du traitement en modification (09/11/2026)
  const myReminders = useReminders().data;
  const saveChild = useSaveTreatment();
  const saveMine = useSaveMyTreatment();
  const save = isChild ? saveChild : saveMine;
  const removeChild = useDeleteTreatment();
  const removeMine = useDeleteMyTreatment();
  const logChild = useLogDose();
  const logMine = useLogMyDose();
  const unlog = useUnlogDose();
  const [editing, setEditing] = useState<AnyTreatment | 'new' | null>(null);
  const [draft, setDraft] = useState<TDraft>(emptyT());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [noteFor, setNoteFor] = useState<Dose<AnyTreatment, AnyLog> | null>(null);
  // La feuille reste affichée pendant sa fermeture : un double appui sur « Enregistrer » ne crée pas le traitement deux fois
  const { arm, guard } = useTapShield();
  const [note, setNote] = useState('');

  // Ouverture depuis la notification « Ajouter une note »
  useEffect(() => {
    if (!noteDose || noteFor) return;
    const d = doses.find((x) => x.time === noteDose);
    if (d) { setNoteFor(d); setNote(d.log?.note ?? ''); }
  }, [noteDose, doses]); // eslint-disable-line react-hooks/exhaustive-deps

  function edit(t: AnyTreatment | 'new') {
    setEditing(t);
    setErrors({});
    setDraft(t === 'new' ? emptyT() : {
      name: t.name, dose: t.dose_text, times: t.times.join(', '), frequency: t.frequency, weekdays: t.weekdays, start: toFrDate(t.start_date), end: t.end_date ? toFrDate(t.end_date) : '',
      instructions: t.instructions ?? '', prescriber: t.prescriber ?? '',
      reminders: myReminders ? myReminders.some((r) => (r.treatment_id === t.id || r.my_treatment_id === t.id) && r.enabled !== false) : true, active: t.active,
    });
  }
  async function submit() {
    const v = validateT(draft);
    setErrors(v.errors);
    if (!v.row) return;
    try {
      const id = editing && editing !== 'new' ? editing.id : null;
      if (isChild) await saveChild.mutateAsync({ id, childName, reminders: draft.reminders, row: { ...v.row, child_id: childId! } });
      else await saveMine.mutateAsync({ id, reminders: draft.reminders, row: v.row });
      arm();
      setEditing(null);
      toast(tr('nd.t.saved'), 'success');
    } catch (e) { setErrors({ form: friendlyError(e) }); }
  }
  async function answer(d: Dose<AnyTreatment, AnyLog>, status: 'taken' | 'snoozed' | 'skipped', withNote?: string | null) {
    try {
      const v = { treatment_id: d.treatment.id, scheduled_for: d.scheduledFor, status, note: withNote ?? d.log?.note ?? null, existingId: d.log?.id };
      const res = isChild ? await logChild.mutateAsync(v) : await logMine.mutateAsync(v);
      if (res === 'queued') toast(tr('u7.track.queued'), 'info');
      // Écran verrouillé : texte neutre, ni prénom, ni médicament, ni dose (même règle que les rappels, 09/11/2026)
      if (status === 'snoozed') await snoozeLocally(tr('l3.notif.lock_title'), tr('l3.notif.lock_body'), url).catch(() => undefined);
      haptic('success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const set = <K extends keyof TDraft>(k: K, v: TDraft[K]) => setDraft((x) => ({ ...x, [k]: v }));

  return (
    <View style={{ gap: spacing.sm }}>
      {compact ? null : <Banner tone="warning">{tr('nd.t.rule')}</Banner>}
      {askTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(askTime) ? (
        <View testID="treatment-ask-time">
          <Card tone="soft">
            <Text weight="bold">{isChild ? tr('nd.t.askTime', { time: askTime, name: childName }) : tr('med.askTime', { time: askTime })}</Text>
            {(treatments ?? []).filter((x) => x.active).length ? (
              <>
                <Text variant="small" muted>{tr('nd.t.askChoose')}</Text>
                {(treatments ?? []).filter((x) => x.active).map((x) => (
                  <Button key={x.id} label={`${x.name} · ${x.dose_text}`} size="sm" variant="secondary" style={{ marginTop: 6, alignSelf: 'flex-start' }}
                    onPress={() => { edit(x); setDraft((d) => ({ ...d, frequency: d.frequency === 'as_prescribed' ? 'daily' : d.frequency, times: [...new Set([...d.times.split(/[,;\s]+/).filter(Boolean), askTime])].sort().join(', ') })); }} />
                ))}
              </>
            ) : <Text variant="small">{isChild ? tr('nd.t.askNone', { name: childName }) : tr('med.askNone')}</Text>}
          </Card>
        </View>
      ) : null}
      <SectionTitle title={tr('nd.t.today')} />
      {isLoading ? <Skeleton rows={2} /> : !doses.length ? <Text muted>{tr('nd.t.noDose')}</Text> : doses.map((d) => (
        <Card key={`${d.treatment.id}-${d.time}`}>
          <View testID={tid(`dose-${d.time}`)}>
            <Row style={{ alignItems: 'center', gap: spacing.md }}>
              {/* case à cocher : « donné » en un geste */}
              <Tappable bare accessibilityRole="checkbox" accessibilityState={{ checked: d.log?.status === 'taken' }} aria-checked={d.log?.status === 'taken'} accessibilityLabel={`${tr('nd.t.taken')} — ${d.time} · ${d.treatment.name}`}
                onPress={() => {
                  haptic('success');
                  // un second appui décoche (prise notée par erreur)
                  if (d.log?.status === 'taken') unlog.mutate({ table: isChild ? 'treatment_logs' : 'my_treatment_logs', id: d.log.id });
                  else void answer(d, 'taken');
                }} testID={tid(`dose-taken-${d.time}`)} hitSlop={8}
                style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2,
                  borderColor: d.log?.status === 'taken' ? th.colors.gold : th.colors.primary, backgroundColor: d.log?.status === 'taken' ? th.colors.gold : 'transparent' }}>
                {d.log?.status === 'taken' ? <Icon name="check" size={20} color="#FFFFFF" /> : null}
              </Tappable>
              <View style={{ flex: 1 }}>
                <Text weight="bold" style={{ fontSize: 18 }}>{d.time} <Text weight="bold">· {d.treatment.name}</Text></Text>
                <Text variant="small">{d.treatment.dose_text}</Text>
                {d.treatment.instructions ? <Text variant="small" muted>{d.treatment.instructions}</Text> : null}
                {d.log ? <Text variant="small" weight="bold" color={d.log.status === 'taken' ? th.colors.gold : undefined} style={{ marginTop: 2 }} testID={tid(`dose-status-${d.time}`)}>{tr(`nd.t.status.${d.log.status}` as TKey)}{d.log.note ? ` · ${d.log.note}` : ''}</Text> : null}
              </View>
            </Row>
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('nd.t.snooze')} size="sm" variant="ghost" onPress={() => answer(d, 'snoozed')} />
              <Button label={tr('nd.t.skip')} size="sm" variant="ghost" onPress={() => answer(d, 'skipped')} />
              <Button label={tr('nd.t.note')} size="sm" variant="ghost" onPress={() => { setNoteFor(d); setNote(d.log?.note ?? ''); }} />
            </Row>
          </View>
        </Card>
      ))}

      <SectionTitle title={tr('nd.t.list')} />
      {(treatments ?? []).map((t) => (
        <Card key={t.id}>
          <ListRow icon="clipboard" testID={tid(`treatment-${t.name}`)} title={t.name} subtitle={`${t.dose_text} · ${t.frequency === 'as_prescribed' ? tr('nd.t.freq.as_prescribed') : t.times.join(', ')} · ${tr('nd.t.from', { date: formatDateFr(t.start_date) })}${t.end_date ? ` ${tr('nd.t.to', { date: formatDateFr(t.end_date) })}` : ''}${t.active ? '' : ` · ${tr('nd.t.paused')}`}`} onPress={() => edit(t)} />
        </Card>
      ))}
      <Button label={isChild ? tr('nd.t.add') : tr('med.addMine')} icon="plus" onPress={() => edit('new')} testID={tid('treatment-add')} />

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? tr('nd.t.add') : tr('nd.t.edit')}>
        {errors.form ? <Banner tone="danger">{errors.form}</Banner> : null}
        <Text variant="small" muted>{tr('nd.t.copyHint')}</Text>
        {!isChild ? <Banner tone="info">{tr('med.mineHint')}</Banner> : null}
        <Field label={tr('nd.t.name')} value={draft.name} onChangeText={(v) => set('name', v)} error={errors.name} maxLength={120} testID="t-name" />
        <Field label={tr('nd.t.dose')} value={draft.dose} onChangeText={(v) => set('dose', v)} error={errors.dose} maxLength={120} hint={tr('nd.t.doseHint')} testID="t-dose" />
        <Segmented label={tr('nd.t.frequency')} value={draft.frequency} onChange={(v) => set('frequency', v)} options={[
          { value: 'daily', label: tr('nd.t.freq.daily') }, { value: 'weekly', label: tr('nd.t.freq.weekly') }, { value: 'as_prescribed', label: tr('nd.t.freq.as_prescribed') },
        ]} />
        {draft.frequency === 'weekly' ? (
          <>
            <Row wrap>{WEEKDAYS.map((d) => <Chip key={d} label={tr(`nd.wd.${d}` as TKey)} selected={draft.weekdays.includes(d)} onPress={() => set('weekdays', draft.weekdays.includes(d) ? draft.weekdays.filter((x) => x !== d) : [...draft.weekdays, d].sort())} />)}</Row>
            {errors.weekdays ? <Text variant="small" color="#C0392B">{errors.weekdays}</Text> : null}
          </>
        ) : null}
        {draft.frequency !== 'as_prescribed' ? <Field label={tr('nd.t.times')} value={draft.times} onChangeText={(v) => set('times', v)} error={errors.times} placeholder="08:00, 16:00" keyboardType="numbers-and-punctuation" testID="t-times" /> : null}
        <Row>
          <View style={{ flex: 1 }}><Field label={tr('nd.t.start')} value={draft.start} onChangeText={(v) => set('start', v)} error={errors.start} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
          <View style={{ flex: 1 }}><Field label={tr('nd.t.end')} optional value={draft.end} onChangeText={(v) => set('end', v)} error={errors.end} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" /></View>
        </Row>
        <Field label={tr('nd.t.instructions')} optional value={draft.instructions} onChangeText={(v) => set('instructions', v)} multiline maxLength={2000} />
        <Field label={tr('nd.t.prescriber')} optional value={draft.prescriber} onChangeText={(v) => set('prescriber', v)} maxLength={120} />
        <Toggle label={tr('nd.t.reminders')} value={draft.reminders} onChange={(v) => set('reminders', v)} />
        {draft.reminders && notificationsSupported && perm !== 'granted' ? (
          <Banner tone="warning" icon="bell-off" title={tr('nt.permOff')}
            action={<Button label={tr('nt.permAsk')} size="sm" onPress={() => void requestPermission().then((p) => { setPerm(p); if (p !== 'granted') toast(tr('nt.permDenied'), 'info'); })} />}>
            {tr('nt.permOffD')}
          </Banner>
        ) : null}
        <Toggle label={tr('nd.t.active')} value={draft.active} onChange={(v) => set('active', v)} />
        <Button label={tr('common.save')} loading={save.isPending} onPress={guard(() => submit())} testID="t-save" />
        {editing && editing !== 'new' ? <Button label={tr('common.delete')} variant="ghost" icon="trash-2" onPress={async () => {
          if (!(await confirm(tr('nd.t.deleteTitle'), editing.name, tr('common.delete')))) return;
          try {
            if (isChild) await removeChild.mutateAsync(editing.id); else await removeMine.mutateAsync(editing.id);
            setEditing(null); // la fiche ne se ferme qu'une fois la suppression réussie
          } catch (e) { toast(friendlyError(e), 'error'); }
        }} /> : null}
      </Sheet>

      <Sheet visible={!!noteFor} onClose={() => setNoteFor(null)} title={tr('nd.t.note')}>
        <Field label={tr('nd.t.noteLabel')} value={note} onChangeText={setNote} multiline maxLength={1000} />
        <Button label={tr('common.save')} onPress={() => { if (noteFor) void answer(noteFor, noteFor.log?.status ?? 'taken', note.trim() || null); setNoteFor(null); }} />
      </Sheet>
    </View>
  );
}
