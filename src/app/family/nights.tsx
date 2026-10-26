/**
 * Relais de nuit : qui se lève quelle nuit. Alterné, fixe ou personnalisé — y compris pour une
 * famille monoparentale ou un réseau d'aidants. Aucun score nocturne, aucun compteur par personne.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { RequestSheet } from '@/features/familyLoad';
import { RelayStrip } from '@/features/motionViz';
import { useCareShifts, useDeleteShift, usePeople, useSaveShifts, useUpdateShift } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { planNights, shiftConflicts, type CareShift, type NightPattern } from '@/lib/domain/familyLoad';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

const fmtNight = (s: { starts_at: string; ends_at: string }) => {
  const a = new Date(s.starts_at);
  const b = new Date(s.ends_at);
  return `Nuit du ${a.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${a.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} – ${b.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function NightRelay() {
  const toast = useToast();
  const { people, labelOf, me } = usePeople();
  const shiftsQ = useCareShifts('night');
  const save = useSaveShifts();
  const update = useUpdateShift();
  const del = useDeleteShift();
  const [pattern, setPattern] = useState<NightPattern>('alternate');
  const [order, setOrder] = useState<string[]>([]);
  const [start, setStart] = useState(toFrDate(todayISO()));
  const [nights, setNights] = useState('7');
  const [startHour, setStartHour] = useState('22');
  const [endHour, setEndHour] = useState('6');
  const [custom, setCustom] = useState<Record<number, string>>({});
  const [swap, setSwap] = useState<string | null>(null);

  const chosen = order.length ? order : people.map((p) => p.id);
  const startIso = frToISO(start);
  const n = Math.max(1, Math.min(31, Number(nights) || 0));
  const plan = useMemo(() => (startIso && chosen.length ? planNights({ pattern, people: chosen, startDay: startIso, nights: n, startHour: Number(startHour) || 22, endHour: Number(endHour) || 6, custom: Array.from({ length: n }, (_, i) => custom[i] ?? chosen[i % chosen.length]) }) : []), [pattern, chosen, startIso, n, startHour, endHour, custom]);
  const upcoming = (shiftsQ.data ?? []).filter((s) => s.status !== 'cancelled' && Date.parse(s.ends_at) > Date.now());
  const conflicts = shiftConflicts(plan, upcoming);
  const sortedUp = [...upcoming].sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
  // la nuit en cours ou celle de ce soir (commence avant demain midi)
  const tonight = sortedUp.find((x) => Date.parse(x.starts_at) < new Date(new Date().setHours(36, 0, 0, 0)).getTime());
  const myPending = sortedUp.find((x) => x.user_id === me && x.status === 'planned');

  function toggleOrder(id: string) { setOrder((cur) => { const base = cur.length ? cur : []; return base.includes(id) ? base.filter((x) => x !== id) : [...base, id]; }); }

  async function submit() {
    if (!plan.length) return toast('Vérifiez la date de départ.', 'error');
    const msg = conflicts.length ? `${conflicts.length} nuit(s) chevauchent un relais déjà prévu pour la même personne. Enregistrer quand même ?` : `${plan.length} nuit(s) vont être ajoutées à l’agenda du foyer.`;
    if (!(await confirm('Enregistrer ce planning ?', msg, 'Enregistrer', false))) return;
    try { await save.mutateAsync(plan); toast('Planning enregistré. Chacun peut confirmer sa nuit.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function setStatus(s: CareShift, status: CareShift['status'], msg: string) {
    try { await update.mutateAsync({ id: s.id, patch: { status } }); toast(msg); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove(s: CareShift) {
    if (!(await confirm('Retirer cette nuit du planning ?', fmtNight(s), 'Retirer'))) return;
    try { await del.mutateAsync(s.id); toast('Nuit retirée.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Relais de nuit" subtitle="Qui se lève, quelle nuit. Sans compter les points."
      action={myPending ? { label: 'Je confirme ma prochaine nuit', icon: 'check', onPress: () => setStatus(myPending, 'confirmed', 'Nuit confirmée.'), testID: 'nights-confirm-next' }
        : plan.length ? { label: `Enregistrer ce planning (${plan.length} nuit${plan.length > 1 ? 's' : ''})`, icon: 'calendar', onPress: submit, disabled: save.isPending, testID: 'nights-save-plan' } : undefined}>
      <TodaySummary items={[
        { icon: 'moon', value: tonight ? labelOf(tonight.user_id) : '—', label: 'Cette nuit' },
        { icon: 'calendar', value: String(upcoming.filter((x) => x.user_id === me).length), label: 'Mes nuits à venir' },
        { icon: 'check-circle', value: String(upcoming.filter((x) => x.user_id === me && x.status === 'planned').length), label: 'À confirmer' },
      ]} />
      <SectionTitle title="Nuits prévues" />
      {upcoming.length ? (
        <Card padded={false} style={{ paddingVertical: spacing.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
            <RelayStrip nights={upcoming} labelOf={labelOf} />
          </ScrollView>
        </Card>
      ) : null}
      {shiftsQ.isLoading && !shiftsQ.data ? <Skeleton rows={2} /> : null}
      {shiftsQ.data && upcoming.length === 0 ? <EmptyState icon="moon" title="Aucune nuit prévue" body="Préparez un planning ci-dessous : il reste modifiable à tout moment." /> : null}
      {upcoming.map((s, i) => (
        <StaggerItem key={s.id} index={i}>
          <Card>
            <ListRow icon={s.status === 'confirmed' ? 'check-circle' : s.status === 'swapped' ? 'shuffle' : 'moon'} title={labelOf(s.user_id)} subtitle={`${fmtNight(s)}${s.status === 'confirmed' ? ' · confirmée' : s.status === 'swapped' ? ' · échangée' : ''}`} />
            <Row wrap style={{ marginTop: spacing.xs }}>
              {s.user_id === me && s.status === 'planned' ? <Button label="Je confirme" size="sm" icon="check" onPress={() => setStatus(s, 'confirmed', 'Nuit confirmée.')} /> : null}
              {s.user_id === me ? <Button label="Proposer un échange" size="sm" variant="secondary" onPress={() => setSwap(s.id)} /> : null}
              <Button label="Retirer" size="sm" variant="ghost" onPress={() => remove(s)} />
            </Row>
          </Card>
        </StaggerItem>
      ))}

      <SectionTitle title="Préparer un planning" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Segmented label="Fonctionnement" value={pattern} onChange={setPattern} options={[{ value: 'alternate', label: 'Chacun son tour' }, { value: 'fixed', label: 'Toujours la même personne' }, { value: 'custom', label: 'Nuit par nuit' }]} />
          <Text variant="label">{pattern === 'fixed' ? 'Qui ?' : 'Qui participe (dans l’ordre) ?'}</Text>
          <Row wrap>{people.map((p) => <Chip key={p.id} label={`${p.label}${order.includes(p.id) ? ` (${order.indexOf(p.id) + 1})` : ''}`} selected={order.includes(p.id)} onPress={() => (pattern === 'fixed' ? setOrder([p.id]) : toggleOrder(p.id))} />)}</Row>
          {people.length === 1 ? <Text variant="caption" muted>Vous êtes seul·e dans le foyer : le planning vous aide à voir les nuits à venir. Vous pouvez inviter un proche ou un aidant depuis Réglages › Famille.</Text> : null}
          <Row>
            <View style={{ flex: 2 }}><Field label="À partir du" value={start} onChangeText={setStart} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" error={startIso ? undefined : 'Date non reconnue.'} /></View>
            <View style={{ flex: 1 }}><Field label="Nuits" value={nights} onChangeText={setNights} keyboardType="number-pad" maxLength={2} /></View>
          </Row>
          <Row>
            <View style={{ flex: 1 }}><Field label="De (heure)" value={startHour} onChangeText={setStartHour} keyboardType="number-pad" maxLength={2} /></View>
            <View style={{ flex: 1 }}><Field label="À (heure)" value={endHour} onChangeText={setEndHour} keyboardType="number-pad" maxLength={2} /></View>
          </Row>
        </View>
      </Card>

      {plan.length ? (
        <>
          <SectionTitle title="Aperçu (rien n’est encore enregistré)" />
          <Card>
            {plan.map((p, i) => (
              <View key={p.starts_at} style={{ paddingVertical: 6, gap: 4 }}>
                <Text variant="small" weight="medium">{fmtNight(p)}</Text>
                {pattern === 'custom' ? (
                  <Row wrap>{chosen.map((id) => <Chip key={id} label={labelOf(id)} selected={p.user_id === id} onPress={() => setCustom({ ...custom, [i]: id })} />)}</Row>
                ) : <Text variant="caption" muted>{labelOf(p.user_id)}</Text>}
              </View>
            ))}
          </Card>
          {conflicts.length ? <Banner tone="warning">{`${conflicts.length} nuit(s) chevauchent un relais déjà prévu pour la même personne.`}</Banner> : null}
          <Button label="Enregistrer ce planning" icon="calendar" full onPress={submit} loading={save.isPending} />
        </>
      ) : null}

      <RequestSheet kind={swap ? 'swap_slot' : null} shiftId={swap} onClose={() => setSwap(null)} />
    </Screen>
  );
}
