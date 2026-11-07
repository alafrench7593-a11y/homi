/**
 * Suivi PMA (IIU, FIV, ICSI, transfert d'embryon congelé…) : un carnet personnel pour ne rien oublier pendant
 * un protocole. Les traitements sont recopiés TELS QU'ÉCRITS sur l'ordonnance (nom, voie, dose, heure donnée
 * par le centre) : l'application ne propose, ne calcule ni ne corrige aucune dose. Rappel quotidien à l'heure
 * indiquée, coche « pris », étapes (contrôles, déclenchement, ponction, transfert, test), export pour le centre.
 * Strictement personnel : rien n'est visible par le foyer (tables pma_*, user_id = auth.uid()).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Chip, Field, ListRow, Loading, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  syncPmaMedReminder, useDeletePmaMed, usePmaLogs, usePmaMeds, usePmaProtocols, useSavePmaMed,
  type PmaKind, type PmaLog, type PmaLogKind, type PmaMed, type PmaProtocol, type PmaRoute,
} from '@/lib/data/hooks-tools6';
import { daysBetween, formatTime, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { exportTextFile } from '@/lib/exportData';
import { callNumber } from '@/lib/links';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const KINDS: PmaKind[] = ['iiu', 'fiv', 'icsi', 'tec', 'stimulation', 'other'];
const ROUTES: PmaRoute[] = ['injection', 'oral', 'vaginal', 'patch', 'nasal', 'other'];
const STEPS: PmaLogKind[] = ['monitoring', 'ultrasound', 'blood', 'trigger', 'retrieval', 'transfer', 'test', 'note'];
const STEP_ICON: Record<PmaLogKind, 'droplet' | 'eye' | 'activity' | 'zap' | 'target' | 'heart' | 'check-circle' | 'edit-3' | 'check'> = {
  dose: 'check', monitoring: 'activity', ultrasound: 'eye', blood: 'droplet', trigger: 'zap', retrieval: 'target', transfer: 'heart', test: 'check-circle', note: 'edit-3',
};
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : '');
const validTime = (v: string) => /^([01]?\d|2[0-3])[:h]([0-5]\d)$/.test(v.trim());
const normTime = (v: string) => { const m = v.trim().match(/^(\d{1,2})[:h](\d{2})$/); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null; };

function ProtocolForm({ visible, onClose }: { visible: boolean; onClose: (created?: string) => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const uid = useUserId();
  const [kind, setKind] = useState<PmaKind>('fiv');
  const [label, setLabel] = useState('');
  const [start, setStart] = useState(toFrDate(todayISO()));
  const [center, setCenter] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    const started = frToISO(start);
    if (!started) return toast(tr('pma.errDate'), 'error');
    setBusy(true);
    try {
      const rows = await backend.insert<PmaProtocol>('pma_protocols', {
        user_id: uid, kind, label: (label.trim() || tr(`pma.kind.${kind}` as TKey)).slice(0, 80), started_on: started,
        center: center.trim() || null, center_phone: phone.trim() || null,
      });
      inv('pma_protocols');
      onClose(rows[0]?.id);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <Sheet visible={visible} onClose={() => onClose()} title={tr('pma.newProtocol')}>
      <Text variant="label">{tr('pma.kind')}</Text>
      <Row wrap>{KINDS.map((k) => <Chip key={k} label={tr(`pma.kind.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} testID={`pma-kind-${k}`} />)}</Row>
      <Field label={tr('pma.label')} optional value={label} onChangeText={setLabel} maxLength={80} placeholder={tr('pma.labelPh')} />
      <Field label={tr('pma.start')} value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" placeholder={tr('u1.rem.phDate')} />
      <Field label={tr('pma.center')} optional value={center} onChangeText={setCenter} maxLength={120} />
      <Field label={tr('pma.centerPhone')} optional value={phone} onChangeText={setPhone} maxLength={30} keyboardType="phone-pad" />
      <Button label={tr('pma.create')} loading={busy} onPress={() => void save()} testID="pma-protocol-save" />
    </Sheet>
  );
}

function MedForm({ protocolId, med, visible, onClose }: { protocolId: string; med?: PmaMed; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const save = useSavePmaMed();
  const del = useDeletePmaMed();
  const [name, setName] = useState(med?.name ?? '');
  const [route, setRoute] = useState<PmaRoute>(med?.route ?? 'injection');
  const [dose, setDose] = useState(med?.dose_text ?? '');
  const [time, setTime] = useState(hhmm(med?.take_time ?? null));
  const [start, setStart] = useState(med?.start_on ? toFrDate(med.start_on) : toFrDate(todayISO()));
  const [end, setEnd] = useState(med?.end_on ? toFrDate(med.end_on) : '');
  const [remind, setRemind] = useState(med ? !!med.take_time : true);
  React.useEffect(() => {
    if (!visible) return;
    setName(med?.name ?? ''); setRoute(med?.route ?? 'injection'); setDose(med?.dose_text ?? ''); setTime(hhmm(med?.take_time ?? null));
    setStart(med?.start_on ? toFrDate(med.start_on) : toFrDate(todayISO())); setEnd(med?.end_on ? toFrDate(med.end_on) : ''); setRemind(med ? !!med.take_time : true);
  }, [visible, med]);
  async function submit() {
    if (!name.trim()) return toast(tr('pma.errName'), 'error');
    if (time && !validTime(time)) return toast(tr('pma.errTime'), 'error');
    const startOn = start ? frToISO(start) : null;
    const endOn = end ? frToISO(end) : null;
    if ((start && !startOn) || (end && !endOn)) return toast(tr('pma.errDate'), 'error');
    if (startOn && endOn && endOn < startOn) return toast(tr('pma.errEnd'), 'error');
    try {
      await save.mutateAsync({
        id: med?.id, today: todayISO(), reminder: remind && !!time,
        row: { protocol_id: protocolId, name: name.trim().slice(0, 80), route, dose_text: dose.trim() || null, take_time: time ? normTime(time) : null, start_on: startOn, end_on: endOn, active: med?.active ?? true },
      });
      toast(remind && time ? tr('pma.savedRemind', { time: normTime(time) ?? '' }) : tr('pma.saved'));
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove() {
    if (!med || !(await confirm(tr('common.delete'), tr('pma.deleteMedQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(med.id); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={med ? tr('pma.editMed') : tr('pma.addMed')}>
      <Banner tone="info" icon="file-text">{tr('pma.asPrescribed')}</Banner>
      <Field label={tr('pma.medName')} value={name} onChangeText={setName} maxLength={80} placeholder={tr('pma.medNamePh')} testID="pma-med-name" />
      <Text variant="label">{tr('pma.route')}</Text>
      <Row wrap>{ROUTES.map((r) => <Chip key={r} label={tr(`pma.route.${r}` as TKey)} selected={route === r} onPress={() => setRoute(r)} />)}</Row>
      <Field label={tr('pma.dose')} optional value={dose} onChangeText={setDose} maxLength={120} hint={tr('pma.doseHint')} />
      <Field label={tr('pma.time')} optional value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="20:00" hint={tr('pma.timeHint')} testID="pma-med-time" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('pma.from')} optional value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><Field label={tr('pma.to')} optional value={end} onChangeText={setEnd} keyboardType="numbers-and-punctuation" placeholder={tr('u1.rem.phDate')} /></View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
        <Text style={{ flex: 1 }}>{tr('pma.remind')}</Text>
        <Toggle label={tr('pma.remind')} value={remind} onChange={setRemind} />
      </View>
      <Button label={tr('common.save')} loading={save.isPending} onPress={() => void submit()} testID="pma-med-save" />
      {med ? <Button label={tr('common.delete')} variant="ghost" onPress={() => void remove()} /> : null}
    </Sheet>
  );
}

export default function PmaTracker() {
  const toast = useToast();
  const inv = useInvalidate();
  const uid = useUserId();
  const protocolsQ = usePmaProtocols();
  const protocols = protocolsQ.data ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const current = protocols.find((p) => p.id === selected) ?? protocols.find((p) => !p.ended_on) ?? protocols[0] ?? null;
  const medsQ = usePmaMeds(current?.id);
  const logsQ = usePmaLogs(current?.id);
  const meds = medsQ.data ?? [];
  const logs = logsQ.data ?? [];
  const [newOpen, setNewOpen] = useState(false);
  const [medOpen, setMedOpen] = useState(false);
  const [editMed, setEditMed] = useState<PmaMed | undefined>();
  const [step, setStep] = useState<PmaLogKind | null>(null);
  const [stepNote, setStepNote] = useState('');
  const today = todayISO();
  const takenToday = useMemo(() => new Map(meds.map((m) => [m.id, logs.filter((l) => l.kind === 'dose' && l.med_id === m.id && l.happened_at.slice(0, 10) === today)])), [meds, logs, today]);
  const activeMeds = meds.filter((m) => m.active && (!m.end_on || m.end_on >= today) && (!m.start_on || m.start_on <= today));
  const dosesDone = activeMeds.filter((m) => (takenToday.get(m.id)?.length ?? 0) > 0).length;
  const label = (l: PmaLog) => (l.kind === 'dose' ? tr('pma.doseOf', { name: meds.find((m) => m.id === l.med_id)?.name ?? tr('pma.med') }) : tr(`pma.step.${l.kind}` as TKey));

  async function addLog(kind: PmaLogKind, medId?: string, note?: string) {
    if (!current) return;
    try {
      await backend.insert('pma_logs', { user_id: uid, protocol_id: current.id, med_id: medId ?? null, kind, note: note?.trim() || null, happened_at: new Date().toISOString() });
      inv('pma_logs');
      toast(kind === 'dose' ? tr('pma.taken') : tr('pma.stepSaved'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function removeLog(l: PmaLog) {
    if (!(await confirm(tr('common.delete'), tr('pma.deleteLogQ'), tr('common.delete')))) return;
    try { await backend.remove('pma_logs', [eq('id', l.id)]); inv('pma_logs'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function endProtocol() {
    if (!current || !(await confirm(tr('pma.end'), tr('pma.endQ'), tr('pma.end'), false))) return;
    try {
      await backend.update('pma_protocols', { ended_on: today < current.started_on ? current.started_on : today }, [eq('id', current.id)]);
      for (const m of meds.filter((x) => x.active)) {
        await backend.update('pma_meds', { active: false }, [eq('id', m.id)]);
      }
      if (uid) {
        for (const m of meds) await syncPmaMedReminder(uid, { ...m, active: false }, today);
      }
      inv('pma_protocols', 'pma_meds', 'reminders');
      toast(tr('pma.ended'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function share() {
    if (!current) return;
    const lines = [tr('pma.exportTitle', { label: current.label }), tr('pma.exportStart', { date: formatDate(current.started_on, { day: 'numeric', month: 'long', year: 'numeric' }) }), ''];
    lines.push(tr('pma.meds'));
    for (const m of meds) lines.push(`• ${m.name} — ${tr(`pma.route.${m.route}` as TKey)}${m.dose_text ? ` — ${m.dose_text}` : ''}${m.take_time ? ` — ${hhmm(m.take_time)}` : ''}`);
    lines.push('', tr('pma.journal'));
    for (const l of [...logs].reverse()) lines.push(`${formatDate(l.happened_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — ${label(l)}${l.note ? ` : ${l.note}` : ''}`);
    try { await exportTextFile(lines.join('\n'), 'suivi-pma.txt', 'text/plain'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (protocolsQ.isLoading) return <Screen back title={tr('tool.pma_tracker')}><Loading /></Screen>;

  return (
    <Screen back title={tr('tool.pma_tracker')} subtitle={tr('tool.pma_tracker.sub')}>
      <Text muted>{tr('pma.intro')}</Text>
      <Banner tone="warning" icon="phone">{tr('pma.alert')}</Banner>
      {!current ? (
        <EmptyState icon="calendar" title={tr('pma.none')} body={tr('pma.noneD')} action={{ label: tr('pma.newProtocol'), onPress: () => setNewOpen(true) }} />
      ) : (
        <>
          {protocols.length > 1 ? (
            <Row wrap>{protocols.map((p) => <Chip key={p.id} label={p.label} selected={p.id === current.id} onPress={() => setSelected(p.id)} />)}</Row>
          ) : null}
          <TodaySummary title={current.label} items={[
            { icon: 'calendar', value: current.ended_on ? tr('pma.endedShort') : tr('pma.dayN', { n: Math.max(1, daysBetween(current.started_on, today) + 1) }), label: tr(`pma.kind.${current.kind}` as TKey) },
            { icon: 'check', value: `${dosesDone}/${activeMeds.length}`, label: tr('pma.today'), testID: 'pma-today' },
          ]} />
          {current.center_phone ? <Button label={tr('pma.callCenter', { center: current.center ?? tr('pma.myCenter') })} icon="phone" variant="secondary" onPress={() => callNumber(current.center_phone!, toast)} /> : null}

          <SectionTitle title={tr('pma.meds')} action={current.ended_on ? undefined : tr('pma.addMed')} onAction={current.ended_on ? undefined : () => { setEditMed(undefined); setMedOpen(true); }} />
          {!meds.length ? <Card tone="soft"><Text muted>{tr('pma.noMeds')}</Text></Card> : (
            <Card padded={false}>
              {meds.map((m) => {
                const done = takenToday.get(m.id) ?? [];
                const live = activeMeds.includes(m);
                return (
                  <ListRow key={m.id} icon={m.route === 'injection' ? 'crosshair' : 'package'} testID={`pma-med-${m.id}`}
                    title={m.name}
                    subtitle={[tr(`pma.route.${m.route}` as TKey), m.dose_text, m.take_time ? hhmm(m.take_time) : null, done.length ? tr('pma.takenAt', { time: formatTime(done[0].happened_at) }) : null].filter(Boolean).join(' · ')}
                    onPress={() => { setEditMed(m); setMedOpen(true); }}
                    right={live ? <Button label={done.length ? tr('pma.again') : tr('pma.take')} size="sm" variant={done.length ? 'secondary' : 'primary'} onPress={() => void addLog('dose', m.id)} testID={`pma-take-${m.id}`} /> : undefined} />
                );
              })}
            </Card>
          )}
          <Text variant="small" muted>{tr('pma.forgot')}</Text>

          <SectionTitle title={tr('pma.steps')} />
          <Card>
            <Row wrap>{STEPS.map((k) => <Chip key={k} label={tr(`pma.step.${k}` as TKey)} selected={step === k} onPress={() => setStep(step === k ? null : k)} testID={`pma-step-${k}`} />)}</Row>
            {step ? (
              <>
                <Field label={tr('pma.stepNote')} optional value={stepNote} onChangeText={setStepNote} maxLength={500} multiline placeholder={tr('pma.stepNotePh')} />
                <Button label={tr('pma.stepAdd')} onPress={() => { void addLog(step, undefined, stepNote); setStep(null); setStepNote(''); }} testID="pma-step-save" />
              </>
            ) : null}
          </Card>

          <SectionTitle title={tr('pma.journal')} action={logs.length ? tr('pma.share') : undefined} onAction={logs.length ? () => void share() : undefined} />
          {!logs.length ? <Card tone="soft"><Text muted>{tr('pma.noLogs')}</Text></Card> : (
            <Card padded={false}>
              {logs.slice(0, 80).map((l) => (
                <ListRow key={l.id} icon={STEP_ICON[l.kind]} title={label(l)}
                  subtitle={`${formatDate(l.happened_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${l.note ? ` · ${l.note}` : ''}`}
                  onPress={() => void removeLog(l)} />
              ))}
            </Card>
          )}

          <Card tone="lavender">
            <Text weight="bold">{tr('pma.together')}</Text>
            <Text variant="small">{tr('pma.togetherD')}</Text>
            <Button label={tr('pma.togetherBtn')} size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/settings/reminders')} />
          </Card>
          <Button label={tr('pma.questions')} icon="clipboard" variant="secondary" onPress={() => router.push('/consult/questions')} />
          {!current.ended_on ? <Button label={tr('pma.end')} variant="ghost" onPress={() => void endProtocol()} /> : null}
          <Button label={tr('pma.newProtocol')} icon="plus" variant="ghost" onPress={() => setNewOpen(true)} />
        </>
      )}
      <ProtocolForm visible={newOpen} onClose={(id) => { setNewOpen(false); if (id) setSelected(id); }} />
      {current ? <MedForm protocolId={current.id} med={editMed} visible={medOpen} onClose={() => setMedOpen(false)} /> : null}
    </Screen>
  );
}
