/**
 * 150 — Suivi des absences et congés : absences de l'enfant, congés de la nounou, fermetures. Saisis par un parent ;
 * la nounou confirmée saisit SES congés (le serveur pose le genre et la personne) et voit l'absence de l'enfant gardé.
 * Visibles dans le planning (148) et dans le total des heures (149).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, Icon, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { daysBetween, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useUserId } from '@/lib/auth';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCareLinks } from '@/lib/data/hooks-nounou';
import { useAbsences, useAddAbsence, useDeleteAbsence, type PrepChild } from '@/lib/data/hooks-childcarePrep';
import { localDay, type Absence, type AbsenceKind } from '@/features/childcarePrep/domain';
import { ChildPicker, usePrepChild } from '@/features/childcarePrep/ui';

const KINDS: AbsenceKind[] = ['child', 'caregiver_leave', 'closure'];
const ICON: Record<AbsenceKind, 'user-x' | 'sun' | 'lock'> = { child: 'user-x', caregiver_leave: 'sun', closure: 'lock' };
const short = (d: string) => formatDate(localDay(d), { day: 'numeric', month: 'short' });

function AbsenceEditor({ visible, onClose, child }: { visible: boolean; onClose: () => void; child: PrepChild }) {
  const toast = useToast();
  const me = useUserId();
  const add = useAddAbsence();
  const parent = child.role === 'parent';
  const links = useCareLinks(parent ? child.id : null).data ?? [];
  const nannies = links.filter((l) => l.confirmed_at && !l.revoked_at && l.caregiver_id);
  const [kind, setKind] = useState<AbsenceKind>('child');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [who, setWho] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setKind(parent ? 'child' : 'caregiver_leave'); setFrom(toFrDate(todayISO())); setTo(toFrDate(todayISO())); setNote(''); setWho(null); setErr(null);
  }, [visible, parent]);
  async function submit() {
    const f = frToISO(from); const t2 = frToISO(to);
    if (!f || !t2) return setErr(tr('gp.err.date'));
    if (t2 < f) return setErr(tr('pma.errEnd'));
    setErr(null);
    try {
      const r = await add.mutateAsync({
        household_id: child.household_id, child_id: child.id, kind: parent ? kind : 'caregiver_leave', from_on: f, to_on: t2, note: note.trim() || null,
        caregiver_id: parent ? (kind === 'caregiver_leave' ? who : null) : me ?? null,
      });
      toast(tr(r === 'queued' ? 'gp.savedOffline' : 'gp.ab.saved'), 'success');
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={parent ? tr('gp.ab.add') : tr('gp.ab.addLeave')}>
      {parent ? (
        <Row wrap>{KINDS.map((k) => <Chip key={k} label={tr(`gp.ab.kind.${k}` as TKey)} selected={kind === k} onPress={() => setKind(k)} testID={`gp-ab-kind-${k}`} />)}</Row>
      ) : <Text variant="small" muted>{tr('gp.ab.caregiverHint')}</Text>}
      {parent && kind === 'caregiver_leave' && nannies.length ? (
        <Row wrap>{nannies.map((l) => <Chip key={l.id} label={l.label ?? tr('nn.home.title')} selected={who === l.caregiver_id} onPress={() => setWho(who === l.caregiver_id ? null : l.caregiver_id)} />)}</Row>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('gp.ab.from')} value={from} onChangeText={setFrom} keyboardType="numbers-and-punctuation" hint={tr('gp.f.dateHint')} testID="gp-ab-from" /></View>
        <View style={{ flex: 1 }}><Field label={tr('gp.ab.to')} value={to} onChangeText={setTo} keyboardType="numbers-and-punctuation" testID="gp-ab-to" /></View>
      </View>
      <Field label={tr('gp.ab.note')} optional value={note} onChangeText={setNote} maxLength={300} placeholder={tr('gp.ab.notePh')} testID="gp-ab-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={add.isPending} onPress={() => void submit()} testID="gp-ab-save" />
    </GlassSheet>
  );
}

export default function CareAbsences() {
  const theme = useTheme();
  const toast = useToast();
  const me = useUserId();
  const { children, child, setChild, loading } = usePrepChild();
  const absQ = useAbsences(child?.id ?? null);
  const del = useDeleteAbsence();
  const [open, setOpen] = useState(false);
  const today = todayISO();
  const { upcoming, past } = useMemo(() => {
    const all = absQ.data ?? [];
    return { upcoming: all.filter((a) => a.to_on >= today), past: all.filter((a) => a.to_on < today).reverse() };
  }, [absQ.data, today]);

  if (loading || (absQ.isLoading && !absQ.data && child)) return <Screen back title={tr('gp.tool.absences')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child) return <Screen back title={tr('gp.tool.absences')} tool={false}><EmptyState icon="sun" title={tr('gp.tool.absences')} body={tr('gp.noChild')} /></Screen>;
  const parent = child.role === 'parent';
  const canDelete = (a: Absence) => !a._pending && (parent || (a.kind === 'caregiver_leave' && a.caregiver_id === me));
  async function remove(a: Absence) {
    if (!canDelete(a) || !(await confirm(tr('common.delete'), tr('gp.ab.deleteQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(a.id); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const row = (a: Absence) => {
    const n = daysBetween(a.from_on, a.to_on) + 1;
    const range = a.from_on === a.to_on ? formatDate(localDay(a.from_on), { weekday: 'long', day: 'numeric', month: 'long' }) : tr('gp.ab.range', { from: short(a.from_on), to: short(a.to_on) });
    return (
      <ListRow key={a.id} icon={ICON[a.kind]} title={a.kind === 'caregiver_leave' && a.caregiver_id === me ? tr('gp.ab.yours') : tr(`gp.ab.kind.${a.kind}` as TKey)}
        subtitle={[range, a.note, a._pending ? tr('gp.hr.pending') : ''].filter(Boolean).join(' · ')} value={tr('gp.ab.days', { count: n })}
        onPress={canDelete(a) ? () => void remove(a) : undefined} right={canDelete(a) ? <Icon name="trash-2" size={18} color={theme.colors.textMuted} /> : undefined} testID={`gp-ab-${a.kind}-${a.from_on}`} />
    );
  };
  return (
    <Screen back title={tr('gp.tool.absences')} subtitle={tr('gp.ab.intro')} tool={false}
      action={{ label: parent ? tr('gp.ab.add') : tr('gp.ab.addLeave'), icon: 'plus', onPress: () => setOpen(true), testID: 'gp-ab-add' }}>
      <ChildPicker list={children} value={child.id} onChange={setChild} />
      {!parent ? <Banner tone="info" icon="sun">{tr('gp.ab.caregiverHint')}</Banner> : null}
      {absQ.isError && !absQ.data ? <ErrorView error={absQ.error} onRetry={() => void absQ.refetch()} /> : !upcoming.length && !past.length ? <EmptyState icon="sun" title={tr('gp.tool.absences')} body={tr('gp.ab.empty')} /> : null}
      {upcoming.length ? <ListGroup title={tr('gp.ab.upcoming')} testID="gp-ab-upcoming">{upcoming.map(row)}</ListGroup> : null}
      {past.length ? <ListGroup title={tr('gp.ab.past')}>{past.slice(0, 30).map(row)}</ListGroup> : null}
      <AbsenceEditor visible={open} onClose={() => setOpen(false)} child={child} />
    </Screen>
  );
}
