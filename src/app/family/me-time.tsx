/**
 * Temps pour soi : chacun réserve ses propres créneaux de repos, planifie le relais, reporte ou échange.
 * Les propositions s'appuient sur les disponibilités réelles de l'agenda, sans imposer de planning.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, Field, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { parseFrDateTime } from '@/features/familyLoad';
import { useAppointments } from '@/lib/data/hooks';
import { useCareShifts, useCreateRequest, useDeleteShift, useFamilyTasks, usePeople, useSaveShifts, useUpdateShift } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addLocalDays, suggestFreeSlots, type CareShift } from '@/lib/domain/familyLoad';
import { todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmt = (s: { starts_at: string; ends_at: string }) => `${new Date(s.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${hm(s.starts_at)} – ${hm(s.ends_at)}`;

export default function MeTime() {
  const toast = useToast();
  const { me, labelOf } = usePeople();
  const shiftsQ = useCareShifts();
  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const { data: tasks } = useFamilyTasks();
  const save = useSaveShifts();
  const update = useUpdateShift();
  const del = useDeleteShift();
  const ask = useCreateRequest();
  const [which, setWhich] = useState<'today' | 'tomorrow'>('today');
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [from, setFrom] = useState('14h');
  const [to, setTo] = useState('15h30');
  const [note, setNote] = useState('');

  const shifts = shiftsQ.data ?? [];
  const mine = shifts.filter((s) => s.kind === 'me_time' && s.user_id === me && s.status !== 'cancelled' && Date.parse(s.ends_at) > Date.now());
  const others = shifts.filter((s) => s.kind === 'me_time' && s.user_id !== me && s.status !== 'cancelled' && Date.parse(s.ends_at) > Date.now());
  const day = which === 'today' ? todayISO() : addLocalDays(todayISO(), 1);
  const slots = useMemo(() => {
    const busy = [
      ...(appointments ?? []).map((a) => ({ starts_at: a.starts_at, ends_at: new Date(Date.parse(a.starts_at) + 3600000).toISOString() })),
      ...shifts.filter((s) => s.status !== 'cancelled' && (s.user_id === me || s.kind === 'me_time')).map((s) => ({ starts_at: s.starts_at, ends_at: s.ends_at })),
      ...(tasks ?? []).filter((t) => t.status === 'todo' && t.assignee_id === me && t.due_at).map((t) => ({ starts_at: t.due_at!, ends_at: new Date(Date.parse(t.due_at!) + 1800000).toISOString() })),
    ];
    return suggestFreeSlots({ day, busy, now: new Date() });
  }, [appointments, shifts, tasks, me, day]);

  async function reserve(slot: { starts_at: string; ends_at: string }, withRelay: boolean) {
    try {
      await save.mutateAsync([{ kind: 'me_time', user_id: me, starts_at: slot.starts_at, ends_at: slot.ends_at, note: note.trim() || null }]);
      if (withRelay) await ask.mutateAsync({ kind: 'relay', message: `Je réserve ${hm(slot.starts_at)} – ${hm(slot.ends_at)} pour souffler : peux-tu prendre le relais ?`, starts_at: slot.starts_at, ends_at: slot.ends_at });
      setNote('');
      toast(withRelay ? 'Réservé, et demande de relais envoyée.' : 'Moment réservé.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function reserveManual(withRelay: boolean) {
    const a = parseFrDateTime(date, from);
    const b = parseFrDateTime(date, to);
    if (!a || !b || b <= a) return toast('Vérifiez la date et les heures (ex. 14h, 15h30).', 'error');
    if (Date.parse(b) <= Date.now()) return toast('Ce créneau est déjà passé : choisissez une heure à venir.', 'error');
    await reserve({ starts_at: a, ends_at: b }, withRelay);
  }

  async function postpone(s: CareShift) {
    const shift = (iso: string) => new Date(Date.parse(iso) + 86400000).toISOString();
    try { await update.mutateAsync({ id: s.id, patch: { starts_at: shift(s.starts_at), ends_at: shift(s.ends_at) } }); toast('Reporté au lendemain, même heure.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function cancel(s: CareShift) {
    if (!(await confirm('Annuler ce moment ?', fmt(s), 'Annuler le moment'))) return;
    try { await del.mutateAsync(s.id); toast('Annulé.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Temps pour soi" subtitle="Un moment à vous, sans avoir à le justifier.">
      <SectionTitle title="Mes moments réservés" />
      {mine.length === 0 ? <EmptyState icon="sun" title="Aucun moment réservé" body="Même 30 minutes comptent." /> : null}
      {mine.map((s, i) => (
        <StaggerItem key={s.id} index={i}>
          <Card>
            <ListRow icon="sun" title={fmt(s)} subtitle={s.note ?? undefined} />
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label="Demander le relais" size="sm" variant="secondary" onPress={() => ask.mutateAsync({ kind: 'relay', message: `Je souffle ${hm(s.starts_at)} – ${hm(s.ends_at)} : peux-tu prendre le relais ?`, starts_at: s.starts_at, ends_at: s.ends_at }).then(() => toast('Demande envoyée.')).catch((e) => toast(friendlyError(e), 'error'))} />
              <Button label="Reporter à demain" size="sm" variant="ghost" onPress={() => postpone(s)} />
              <Button label="Annuler" size="sm" variant="ghost" onPress={() => cancel(s)} />
            </Row>
          </Card>
        </StaggerItem>
      ))}

      <SectionTitle title="Créneaux libres dans l’agenda" />
      <Segmented label="Jour" value={which} onChange={setWhich} options={[{ value: 'today', label: 'Aujourd’hui' }, { value: 'tomorrow', label: 'Demain' }]} />
      <Card>
        {slots.length === 0 ? <Text variant="small" muted>Pas de créneau d’une heure libre ce jour-là d’après l’agenda. Vous pouvez quand même en réserver un ci-dessous.</Text> : null}
        {slots.map((s) => (
          <View key={s.starts_at} style={{ paddingVertical: 6 }}>
            <Text weight="medium">{hm(s.starts_at)} – {hm(s.ends_at)}</Text>
            <Row wrap style={{ marginTop: 4 }}>
              <Button label="Réserver 1 h" size="sm" onPress={() => reserve({ starts_at: s.starts_at, ends_at: new Date(Math.min(Date.parse(s.ends_at), Date.parse(s.starts_at) + 3600000)).toISOString() }, false)} loading={save.isPending} />
              <Button label="Réserver + demander le relais" size="sm" variant="secondary" onPress={() => reserve({ starts_at: s.starts_at, ends_at: new Date(Math.min(Date.parse(s.ends_at), Date.parse(s.starts_at) + 3600000)).toISOString() }, true)} />
            </Row>
          </View>
        ))}
        <Text variant="caption" muted style={{ marginTop: 6 }}>Calculé à partir des rendez-vous, des relais et de vos tâches datées. Ce n’est qu’une suggestion.</Text>
      </Card>

      <SectionTitle title="Choisir moi-même" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Field label="Date" value={date} onChangeText={setDate} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
          <Row>
            <View style={{ flex: 1 }}><Field label="De" value={from} onChangeText={setFrom} placeholder="14h" /></View>
            <View style={{ flex: 1 }}><Field label="À" value={to} onChangeText={setTo} placeholder="15h30" /></View>
          </Row>
          <Field label="Pour quoi faire ?" optional value={note} onChangeText={setNote} maxLength={300} placeholder="Dormir, marcher, ne rien faire" />
          <Row wrap>
            <Button label="Réserver" icon="sun" onPress={() => reserveManual(false)} loading={save.isPending} />
            <Button label="Réserver + relais" variant="secondary" onPress={() => reserveManual(true)} />
          </Row>
        </View>
      </Card>

      {others.length ? (
        <>
          <SectionTitle title="Les moments des autres" />
          <Card>{others.map((s) => <ListRow key={s.id} icon="sun" title={labelOf(s.user_id)} subtitle={fmt(s)} />)}</Card>
          <Text variant="caption" muted>Pour les protéger : pas de sollicitation pendant ces moments-là.</Text>
        </>
      ) : null}
    </Screen>
  );
}
