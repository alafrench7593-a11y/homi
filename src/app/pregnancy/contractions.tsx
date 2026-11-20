/**
 * 39 — Chronomètre des contractions. Un appui au début, un appui à la fin : chaque contraction est enregistrée avec ses
 * HORODATAGES ABSOLUS dès l'appui (rien ne vit seulement en mémoire : l'application peut passer en arrière-plan ou être
 * fermée). Durée, intervalle, séance, moyennes des 30 et 60 dernières minutes, export pour la maternité.
 * Aucun seuil médical : un rappel fixe invite à suivre les consignes de la maternité ou de la sage-femme, avec un accès
 * aux numéros d'urgence existants.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, haptic, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { BriefStrip } from '@/features/day5/DayParts';
import { WhenFields, whenOf, whenToIso, type WhenValue } from '@/components/CareInputs';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { useActivePregnancy } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useContractions, useDeleteContraction, useSaveContraction } from '@/lib/data/hooks-birthCare';
import { uuid } from '@/lib/uuid';
import { buildTextPdf } from '@/lib/documents/pdf';
import { deliverFile } from '@/lib/deliverFile';
import { clock, currentSessionId, exportSections, fmtSec, shortSec, running, sessions, timed, windowStats, type Contraction } from '@/features/birth/contractions';

const HM = { hour: '2-digit', minute: '2-digit', second: '2-digit' } as const;
const hms = (iso: string) => new Date(iso).toLocaleTimeString(undefined, HM);

function EditSheet({ c, onClose }: { c: Contraction | null; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveContraction();
  const del = useDeleteContraction();
  const [start, setStart] = useState<WhenValue>(whenOf());
  const [seconds, setSeconds] = useState('');
  useEffect(() => {
    if (!c) return;
    setStart(whenOf(c.started_at));
    setSeconds(c.ended_at ? String(Math.round((Date.parse(c.ended_at) - Date.parse(c.started_at)) / 1000)) : '');
  }, [c?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c) return null;
  async function submit() {
    const at = whenToIso(start);
    const s = seconds.trim() ? Number(seconds.trim()) : null;
    if (!at) return toast(tr('ctr.err.time'), 'error');
    if (s != null && (!Number.isInteger(s) || s < 1 || s > 1800)) return toast(tr('ctr.err.duration'), 'error');
    // à la seconde près : l'heure saisie garde les secondes d'origine si la minute n'a pas changé
    const o = whenOf(c!.started_at);
    const startedAt = o.date === start.date && o.time === start.time.trim() ? c!.started_at : at;
    try {
      await save.mutateAsync({ id: c!.id, session_id: c!.session_id, pregnancy_id: c!.pregnancy_id ?? null, started_at: startedAt, ended_at: s == null ? null : new Date(Date.parse(startedAt) + s * 1000).toISOString() });
      toast(tr('ctr.saved'), 'success'); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove() {
    if (!(await confirm(tr('ctr.delete'), tr('ctr.deleteQ'), tr('ctr.delete')))) return;
    try { await del.mutateAsync(c!.id); toast(tr('ctr.deleted'), 'success'); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={tr('ctr.edit')}>
      <WhenFields value={start} onChange={setStart} days="past" timeLabel={tr('ctr.startTime')} testID="ctr-edit-start" />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('ctr.durationSec')}</Text>
        <Row wrap>{['30', '45', '60', '75', '90'].map((s) => <Button key={s} label={tr('ctr.fmt.sec', { s })} size="sm" variant={seconds === s ? 'primary' : 'secondary'} onPress={() => setSeconds(s)} testID={`ctr-edit-dur-${s}`} />)}</Row>
      </View>
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="ctr-edit-save" />
      <Button label={tr('ctr.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="ctr-edit-delete" />
    </GlassSheet>
  );
}

export default function ContractionTimer() {
  const toast = useToast();
  const pregnancy = useActivePregnancy();
  const q = useContractions();
  const save = useSaveContraction();
  const [now, setNow] = useState(() => new Date());
  const [editing, setEditing] = useState<Contraction | null>(null);
  const [newSession, setNewSession] = useState<string | null>(null);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const live = running(list);
  // Affichage seulement : l'heure courante avance chaque seconde ; les durées viennent des horodatages enregistrés
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  const sessionId = newSession ?? currentSessionId(list);
  const session = useMemo(() => timed(list.filter((c) => c.session_id === sessionId)).reverse(), [list, sessionId]);
  const past = useMemo(() => sessions(list).filter((s) => s.id !== sessionId), [list, sessionId]);
  const s30 = windowStats(list, 30, now);
  const s60 = windowStats(list, 60, now);
  const last = session.find((c) => c.ended_at) ?? null;

  async function press() {
    try {
      if (live) {
        haptic('success');
        await save.mutateAsync({ id: live.id, session_id: live.session_id, pregnancy_id: live.pregnancy_id ?? null, started_at: live.started_at, ended_at: new Date().toISOString() });
      } else {
        haptic('light');
        const sid = sessionId ?? uuid();
        await save.mutateAsync({ session_id: sid, pregnancy_id: pregnancy?.id ?? null, started_at: new Date().toISOString(), ended_at: null });
        setNewSession(null);
      }
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function exportFor(kind: 'pdf' | 'text') {
    const title = tr('ctr.export.title');
    const sections = exportSections(list, new Date());
    const subtitle = [tr('ctr.export.generated', { date: formatDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }), tr('ctr.export.note')];
    try {
      if (kind === 'text' && Platform.OS !== 'web') {
        await Share.share({ title, message: [title, ...subtitle, '', ...sections.flatMap((s) => [s.heading, ...s.lines, ''])].join('\n') });
      } else {
        const bytes = await buildTextPdf(title, subtitle, sections);
        await deliverFile(bytes, `contractions-${new Date().toISOString().slice(0, 10)}.pdf`, 'application/pdf', title);
      }
      toast(tr('ctr.export.ready'), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }

  if (q.isLoading && !q.data) return <Screen back title={tr('ctr.title')} tool={false}><Skeleton rows={4} /></Screen>;
  return (
    <Screen back title={tr('ctr.title')} subtitle={tr('ctr.subtitle')} tool={false}
      footer={<Button label={live ? tr('ctr.stop') : tr('ctr.start')} icon={live ? 'square' : 'play'} size="lg" full loading={save.isPending} onPress={() => void press()} testID="ctr-press" />}>
      <Banner tone="info" icon="info" action={<Button label={tr('ctr.emergency')} size="sm" variant="secondary" icon="phone" onPress={() => router.push('/emergency')} testID="ctr-emergency" />}>
        {tr('ctr.followAdvice')}
      </Banner>
      <Card testID="ctr-clock">
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Text variant="caption" muted>{live ? tr('ctr.running') : last ? tr('ctr.sinceLast') : tr('ctr.ready')}</Text>
          <Text variant="hero" accessibilityLiveRegion="polite" testID="ctr-clock-value">{live ? clock(live.started_at, now) : last ? clock(last.started_at, now) : '0:00'}</Text>
          {live ? <Text variant="small" muted>{tr('ctr.startedAt', { time: hms(live.started_at) })}</Text> : null}
        </View>
      </Card>
      <BriefStrip title={tr('ctr.windows')} testID="ctr-stats" items={[
        { value: String(s30.count), label: tr('ctr.stat.count30') },
        { value: shortSec(s30.avgDurationSec), label: tr('ctr.stat.duration30') },
        { value: shortSec(s30.avgIntervalSec), label: tr('ctr.stat.interval30') },
      ]} />
      <BriefStrip title={tr('ctr.windows60')} testID="ctr-stats60" items={[
        { value: String(s60.count), label: tr('ctr.stat.count60') },
        { value: shortSec(s60.avgDurationSec), label: tr('ctr.stat.duration60') },
        { value: shortSec(s60.avgIntervalSec), label: tr('ctr.stat.interval60') },
      ]} />
      <Text variant="caption" muted>{tr('ctr.statsNote')}</Text>

      {session.length ? (
        <ListGroup title={tr('ctr.session')} testID="ctr-session">
          {session.map((c, i) => (
            <ListRow key={c.id} icon={c.ended_at ? 'clock' : 'activity'} title={hms(c.started_at)}
              subtitle={[c.durationSec == null ? tr('ctr.running') : tr('ctr.duration', { d: fmtSec(c.durationSec) }), c.intervalSec != null ? tr('ctr.interval', { d: fmtSec(c.intervalSec) }) : null, c._pending ? tr('ctr.pending') : null].filter(Boolean).join(' · ')}
              onPress={c.ended_at ? () => setEditing(c) : undefined} testID={`ctr-row-${session.length - 1 - i}`} />
          ))}
        </ListGroup>
      ) : (
        <Text muted testID="ctr-empty">{tr('ctr.empty')}</Text>
      )}
      <Row wrap gap={spacing.sm}>
        {session.length && !live ? <Button label={tr('ctr.newSession')} variant="secondary" icon="refresh-cw" size="sm" onPress={() => setNewSession(uuid())} testID="ctr-new-session" /> : null}
        {list.length ? <Button label={Platform.OS === 'web' ? tr('ctr.export.pdfWeb') : tr('ctr.export.pdf')} variant="secondary" icon="download" size="sm" onPress={() => void exportFor('pdf')} testID="ctr-export" /> : null}
        {list.length && Platform.OS !== 'web' ? <Button label={tr('ctr.export.text')} variant="ghost" icon="share" size="sm" onPress={() => void exportFor('text')} /> : null}
      </Row>
      {past.length ? (
        <ListGroup title={tr('ctr.past')} testID="ctr-past">
          {past.slice(0, 10).map((s) => (
            <ListRow key={s.id} icon="list" title={formatDate(s.from, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              subtitle={tr('ctr.pastLine', { count: s.items.length })} />
          ))}
        </ListGroup>
      ) : null}
      <EditSheet c={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}
