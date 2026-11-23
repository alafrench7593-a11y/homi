/**
 * 80 — Organisation des biberons avec le coparent (dans « Relais de nuit », /family/nights?focus=bottles) : qui donne
 * quel biberon, à quelle heure. La personne proposée est celle du relais de nuit à cette heure-là ; le relais se relie
 * au biberon réellement noté dans le suivi existant (« Noter le biberon », ou le biberon noté juste à côté).
 * Parents du foyer seulement ; aucun compteur par personne.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useChildren } from '@/lib/data/hooks';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListGroup, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { WhenFields, whenOf, whenToIso, type WhenValue } from '@/components/CareInputs';
import { SwitchRow } from '@/features/couple/CoupleKit';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';
import { useBottleHistory } from '@/lib/data/hooks-bottle';
import { useCareShifts, usePeople } from '@/lib/data/hooks-family-load';
import { useBottleRelays, useDeleteRelay, useSaveRelays } from '@/lib/data/hooks-partiels';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { FeedingChildPicker } from './ui';
import { matchingBottle, nightPersonAt, planRelays, relayView, sortRelays, validateRelay, type BottleRelay } from './relays';

const WHEN = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } as const;

function RelaySheet({ relay, visible, onClose, hid, childId, parents, me }: {
  relay: BottleRelay | null; visible: boolean; onClose: () => void; hid: string; childId: string; parents: { id: string; label: string }[]; me: string | null;
}) {
  const toast = useToast();
  const save = useSaveRelays();
  const del = useDeleteRelay();
  const shifts = useCareShifts('night').data ?? [];
  const [when, setWhen] = useState<WhenValue>(whenOf());
  const [ml, setMl] = useState('');
  const [person, setPerson] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [count, setCount] = useState(1);
  const [every, setEvery] = useState(3);
  const [alternate, setAlternate] = useState(true);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  React.useEffect(() => {
    if (!visible) return;
    const at = relay?.planned_at ?? new Date(Math.ceil(Date.now() / 1_800_000) * 1_800_000 + 3_600_000).toISOString();
    setWhen(whenOf(at)); setMl(relay?.planned_ml ? String(relay.planned_ml) : ''); setNote(relay?.note ?? ''); setCount(1); setEvery(3); setAlternate(true); setErr(null);
    setPerson(relay?.assigned_to ?? nightPersonAt(at, shifts) ?? me); setTouched(!!relay);
  }, [visible, relay?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  const at = whenToIso(when);
  const night = at ? nightPersonAt(at, shifts) : null;
  function onWhen(v: WhenValue) {
    setWhen(v);
    const iso = whenToIso(v);
    if (!touched && iso) setPerson(nightPersonAt(iso, shifts) ?? person);
  }
  const plan = at && person && !relay ? planRelays({ start: at, everyMinutes: every * 60, count, people: parents.map((p) => p.id), first: person, shifts, alternate }) : [];
  async function submit() {
    const e = validateRelay({ at, ml, person });
    if (e) return setErr(tr(e));
    const planned_ml = ml.trim() ? Number(ml) : null;
    try {
      const rows = relay
        ? [{ ...relay, planned_at: at!, planned_ml, assigned_to: person!, note: note.trim() || null }]
        : plan.map((p) => ({ household_id: hid, child_id: childId, planned_at: p.planned_at, assigned_to: p.assigned_to, planned_ml, note: note.trim() || null }));
      const r = await save.mutateAsync(rows);
      toast(r.queued ? tr('brl.savedOffline') : tr('brl.saved', { count: rows.length }), 'success'); onClose();
    } catch (x) { setErr(friendlyError(x)); }
  }
  async function remove() {
    if (!relay || !(await confirm(tr('brl.delete'), tr('brl.deleteQ'), tr('brl.delete')))) return;
    try { await del.mutateAsync(relay.id); toast(tr('brl.deleted'), 'success'); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  const nameOf = (id: string) => parents.find((p) => p.id === id)?.label ?? tr('u7.people.former');
  return (
    <GlassSheet visible onClose={onClose} title={relay ? tr('brl.edit') : tr('brl.add')}>
      <WhenFields value={when} onChange={onWhen} dateLabel={tr('brl.date')} timeLabel={tr('brl.time')} testID="brl-f-when" />
      <Field label={tr('brl.ml')} optional value={ml} onChangeText={setMl} keyboardType="number-pad" suffix="ml" testID="brl-f-ml" />
      <Text variant="label">{tr('brl.who')}</Text>
      <Row wrap>{parents.map((p) => <Chip key={p.id} label={p.label} selected={person === p.id} onPress={() => { setPerson(p.id); setTouched(true); }} testID={`brl-f-who-${p.id}`} />)}</Row>
      {night ? <Text variant="caption" muted testID="brl-f-night">{tr('brl.nightHint', { name: nameOf(night) })}</Text> : null}
      {!relay ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('brl.repeat')}</Text>
          <Row wrap>{[1, 2, 3, 4].map((n) => <Chip key={n} label={n === 1 ? tr('brl.once') : tr('brl.times', { count: n })} selected={count === n} onPress={() => setCount(n)} testID={`brl-f-count-${n}`} />)}</Row>
          {count > 1 ? (
            <>
              <Row wrap>{[2, 3, 4].map((h) => <Chip key={h} label={tr('brl.every', { h })} selected={every === h} onPress={() => setEvery(h)} testID={`brl-f-every-${h}`} />)}</Row>
              <SwitchRow label={tr('brl.alternate')} value={alternate} onChange={setAlternate} testID="brl-f-alternate" />
              <Card testID="brl-f-preview">
                {plan.map((p) => <Text key={p.planned_at} variant="small">{formatDate(p.planned_at, WHEN)} · {nameOf(p.assigned_to)}</Text>)}
              </Card>
            </>
          ) : null}
        </View>
      ) : null}
      <Field label={tr('brl.note')} optional value={note} onChangeText={setNote} maxLength={300} placeholder={tr('brl.notePh')} testID="brl-f-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="brl-f-save" />
      {relay ? <Button label={tr('brl.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="brl-f-delete" /> : null}
    </GlassSheet>
  );
}

export function BottleRelaysSection() {
  const toast = useToast();
  const { people, labelOf, me } = usePeople();
  const parents = people.filter((p) => p.role === 'owner' || p.role === 'coparent').map((p) => ({ id: p.id, label: p.label }));
  // Enfants du foyer (pas seulement ceux que la personne suit) : le second parent organise aussi les biberons
  const params = useLocalSearchParams<{ child?: string }>();
  const children = useChildren().data ?? [];
  const [picked, setChild] = useState<string | null>(typeof params.child === 'string' ? params.child : null);
  const child = children.find((c) => c.id === picked) ?? children.find((c) => Date.now() - Date.parse(`${c.birth_date}T12:00:00`) < 3 * 365 * 86_400_000) ?? children[0] ?? null;
  const hid = child?.household_id ?? null;
  const q = useBottleRelays(hid, child?.id ?? null);
  const bottles = useBottleHistory(child?.id ?? null, 3).data ?? [];
  const save = useSaveRelays();
  const [sheet, setSheet] = useState<{ relay: BottleRelay | null } | null>(null);
  const { open, done } = useMemo(() => sortRelays(q.data ?? []), [q.data]);
  const isParent = parents.some((p) => p.id === me);
  if (!child || !hid || !isParent) return null;

  async function mark(r: BottleRelay, status: 'given' | 'skipped', bottle?: { id: string; at: string } | null) {
    try {
      const res = await save.mutateAsync([{ ...r, status, given_at: status === 'given' ? bottle?.at ?? new Date().toISOString() : null, bottle_id: status === 'given' ? bottle?.id ?? null : null }]);
      toast(res.queued ? tr('brl.savedOffline') : tr(status === 'given' ? 'brl.markedGiven' : 'brl.markedSkipped'), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  const viewLabel = (r: BottleRelay) => tr(`brl.view.${relayView(r)}` as TKey);
  return (
    <View style={{ gap: spacing.sm }} testID="brl-section">
      <SectionTitle title={tr('brl.title')} action={tr('brl.add')} onAction={() => setSheet({ relay: null })} />
      <Text variant="small" muted>{tr('brl.intro')}</Text>
      <FeedingChildPicker list={children} value={child.id} onChange={setChild} />
      {open.length ? (
        <ListGroup title={tr('brl.open', { name: child.first_name })} testID="brl-open">
          {open.map((r) => {
            const match = matchingBottle(r, bottles, q.data ?? []);
            const mine = r.assigned_to === me;
            return (
              <View key={r.id}>
              <ListRow icon={mine ? 'user' : 'users'} onPress={() => setSheet({ relay: r })} testID={`brl-row-${formatTime(r.planned_at).replace(/\D/g, '')}`}
                title={tr('brl.rowTitle', { time: formatTime(r.planned_at), who: labelOf(r.assigned_to) })}
                subtitle={[formatDate(r.planned_at, { weekday: 'long', day: 'numeric', month: 'long' }), r.planned_ml ? tr('brl.mlValue', { ml: r.planned_ml }) : null, viewLabel(r), r.note,
                  match ? tr('brl.matchHint', { time: formatTime(match.at) }) : null, r._pending ? tr('brl.pending') : null].filter(Boolean).join(' · ')}
              />
              {/* Actions sous la ligne : lisibles à 320 pt */}
              <Row wrap gap={spacing.xs} style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
                    {match ? <Button label={tr('brl.link')} size="sm" onPress={() => void mark(r, 'given', match)} testID={`brl-link-${r.id}`} />
                      : <Button label={tr('brl.record')} size="sm" variant="secondary" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: child.id, relay: r.id } })} testID={`brl-record-${r.id}`} />}
                    {relayView(r) === 'past' ? <Button label={tr('brl.skip')} size="sm" variant="ghost" onPress={() => void mark(r, 'skipped')} testID={`brl-skip-${r.id}`} /> : null}
              </Row>
              </View>
            );
          })}
        </ListGroup>
      ) : <Text variant="small" muted testID="brl-none">{tr('brl.none', { name: child.first_name })}</Text>}
      {done.length ? (
        <ListGroup title={tr('brl.done')} testID="brl-done">
          {done.slice(0, 10).map((r) => {
            const b = r.bottle_id ? bottles.find((x) => x.id === r.bottle_id) : null;
            const qty = b ? (b.consumed_ml ?? b.prepared_ml) : null;
            return (
              <ListRow key={r.id} icon={r.status === 'given' ? 'check-circle' : 'x-circle'} onPress={() => setSheet({ relay: r })}
                title={r.status === 'given' ? tr('brl.givenBy', { who: labelOf(r.assigned_to), time: formatTime(r.given_at ?? r.planned_at) }) : tr('brl.skippedLine', { time: formatTime(r.planned_at) })}
                subtitle={[formatDate(r.planned_at, { weekday: 'long', day: 'numeric', month: 'long' }), qty != null ? tr('brl.mlValue', { ml: qty }) : null, r.bottle_id ? tr('brl.linked') : null].filter(Boolean).join(' · ')} />
            );
          })}
        </ListGroup>
      ) : null}
      <Button label={tr('brl.toBottles')} size="sm" variant="ghost" icon="coffee" onPress={() => router.push({ pathname: '/bottle/[childId]', params: { childId: child.id } })} />
      <RelaySheet relay={sheet?.relay ?? null} visible={!!sheet} onClose={() => setSheet(null)} hid={hid} childId={child.id} parents={parents} me={me} />
    </View>
  );
}
