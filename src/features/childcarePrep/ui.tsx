/**
 * Avant la garde — éléments partagés des écrans : choix de l'enfant ou de la candidate, montants, liens officiels,
 * formulaire de fiche (feuille de verre : couche temporaire au-dessus de l'écran).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Chip, Field, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { openLink } from '@/lib/links';
import { frToISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteCandidate, usePrepChildren, useSaveCandidate, type PrepChild } from '@/lib/data/hooks-childcarePrep';
import { spacing } from '@/theme/tokens';
import {
  CANDIDATE_KINDS, CANDIDATE_STATUSES, OFFICIAL, parseAmount, type Candidate, type CandidateKind, type CandidateStatus, type RateMode,
} from './domain';

export const money = (n: number) => formatNumber(n, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const kindLabel = (k: CandidateKind) => tr(`gp.kind.${k}` as TKey);
export const statusLabel = (s: CandidateStatus) => tr(`gp.status.${s}` as TKey);
export { OFFICIAL };
export const STATUS_ICON: Record<CandidateStatus, 'phone' | 'calendar' | 'eye' | 'check-circle' | 'x-circle'> = {
  to_contact: 'phone', interview: 'calendar', visited: 'eye', chosen: 'check-circle', dismissed: 'x-circle',
};

export function SourceLinks({ keys, title, testID }: { keys: (keyof typeof OFFICIAL)[]; title: string; testID?: string }) {
  const toast = useToast();
  return (
    <ListGroup title={title} footer={tr('gp.modes.consulted')} testID={testID}>
      {keys.map((k) => {
        const s = OFFICIAL[k];
        const label = tr(s.label as TKey);
        return <ListRow key={k} icon="external-link" title={label} subtitle={s.url.replace(/^https:\/\/(www\.)?/, '').split('/')[0]} onPress={() => openLink(s.url, toast)} testID={`gp-src-${k}`} />;
      })}
    </ListGroup>
  );
}

/** Enfant de l'écran : celui de l'adresse (?child=), sinon le premier ; rôle de la personne pour cet enfant. */
export function usePrepChild() {
  const params = useLocalSearchParams<{ child?: string }>();
  const { children, loading } = usePrepChildren();
  const [picked, setPicked] = useState<string | null>(typeof params.child === 'string' ? params.child : null);
  const child = children.find((c) => c.id === picked) ?? children[0] ?? null;
  return { children, child, setChild: setPicked, loading };
}

export function ChildPicker({ list, value, onChange }: { list: PrepChild[]; value: string | null; onChange: (id: string) => void }) {
  if (list.length < 2) return null;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{tr('gp.child')}</Text>
      <Row wrap>{list.map((c) => <Chip key={c.id} label={c.first_name} selected={value === c.id} onPress={() => onChange(c.id)} testID={`gp-child-${c.id}`} />)}</Row>
    </View>
  );
}

export function CandidatePicker({ list, value, onChange }: { list: Candidate[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{tr('gp.iv.pick')}</Text>
      <Row wrap>{list.map((c) => <Chip key={c.id} label={c.name} selected={value === c.id} onPress={() => onChange(c.id)} testID={`gp-pick-${c.id}`} />)}</Row>
    </View>
  );
}

// ---------------------------------------------------------------- formulaire de fiche (143) et tarif (146)
type Draft = Record<'name' | 'phone' | 'email' | 'address' | 'availability' | 'hourly_rate' | 'hours_per_week' | 'weeks_per_year' | 'days_per_week'
  | 'monthly_fee' | 'meal_fee_per_day' | 'upkeep_fee_per_day' | 'other_monthly' | 'date' | 'notes', string>;
const AMOUNTS: { key: keyof Draft; max: number; err: TKey }[] = [
  { key: 'hourly_rate', max: 200, err: 'gp.err.max' }, { key: 'hours_per_week', max: 80, err: 'gp.err.hours' }, { key: 'weeks_per_year', max: 52, err: 'gp.err.weeks' },
  { key: 'days_per_week', max: 7, err: 'gp.err.days' }, { key: 'monthly_fee', max: 10000, err: 'gp.err.max' }, { key: 'meal_fee_per_day', max: 100, err: 'gp.err.max' },
  { key: 'upkeep_fee_per_day', max: 100, err: 'gp.err.max' }, { key: 'other_monthly', max: 5000, err: 'gp.err.max' },
];
const txt = (v: number | string | null | undefined) => (v == null ? '' : String(v).replace('.', ','));

function draftOf(c?: Candidate | null): Draft {
  return {
    name: c?.name ?? '', phone: c?.phone ?? '', email: c?.email ?? '', address: c?.address ?? '', availability: c?.availability ?? '',
    hourly_rate: txt(c?.hourly_rate), hours_per_week: txt(c?.hours_per_week), weeks_per_year: txt(c?.weeks_per_year ?? 52), days_per_week: txt(c?.days_per_week),
    monthly_fee: txt(c?.monthly_fee), meal_fee_per_day: txt(c?.meal_fee_per_day), upkeep_fee_per_day: txt(c?.upkeep_fee_per_day), other_monthly: txt(c?.other_monthly),
    date: c?.interview_at ? toFrDate(c.interview_at.slice(0, 10)) : '', notes: c?.notes ?? '',
  };
}

/**
 * Fiche de candidate : création ou modification. `priceOnly` : seulement le tarif et les frais (depuis le budget).
 * Enregistrement hors ligne possible (file d'attente) ; suppression : en ligne, après confirmation.
 */
export function CandidateEditor({ visible, onClose, householdId, candidate, priceOnly, onSaved }: {
  visible: boolean; onClose: () => void; householdId: string; candidate?: Candidate | null; priceOnly?: boolean; onSaved?: (id: string) => void;
}) {
  const toast = useToast();
  const save = useSaveCandidate();
  const del = useDeleteCandidate();
  const [d, setD] = useState<Draft>(draftOf(candidate));
  const [kind, setKind] = useState<CandidateKind>(candidate?.kind ?? 'assmat');
  const [status, setStatus] = useState<CandidateStatus>(candidate?.status ?? 'to_contact');
  const [mode, setMode] = useState<RateMode>(candidate?.rate_mode ?? 'hourly');
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  useEffect(() => {
    if (!visible) return;
    setD(draftOf(candidate)); setKind(candidate?.kind ?? 'assmat'); setStatus(candidate?.status ?? 'to_contact');
    setMode(candidate?.rate_mode ?? 'hourly'); setErrors({});
  }, [visible, candidate]);
  const set = (k: keyof Draft) => (v: string) => setD((x) => ({ ...x, [k]: v }));

  async function submit() {
    const e: Partial<Record<keyof Draft, string>> = {};
    if (!d.name.trim()) e.name = tr('gp.err.name');
    const nums: Record<string, number | null> = {};
    for (const a of AMOUNTS) {
      const n = parseAmount(d[a.key]);
      if (n != null && Number.isNaN(n)) e[a.key] = tr('gp.err.amount');
      else if (n != null && (n > a.max || (a.key === 'weeks_per_year' && n < 1))) e[a.key] = tr(a.err);
      nums[a.key] = n != null && !Number.isNaN(n) ? n : null;
    }
    const date = d.date.trim() ? frToISO(d.date) : null;
    if (d.date.trim() && !date) e.date = tr('gp.err.date');
    setErrors(e);
    if (Object.keys(e).length) return;
    const row: Partial<Candidate> & { household_id: string } = {
      ...(candidate ? { id: candidate.id } : {}),
      household_id: householdId, name: d.name.trim().slice(0, 80), kind, status,
      phone: d.phone.trim() || null, email: d.email.trim() || null, address: d.address.trim() || null, availability: d.availability.trim() || null,
      rate_mode: mode, hourly_rate: nums.hourly_rate, hours_per_week: nums.hours_per_week, weeks_per_year: Math.round(nums.weeks_per_year ?? 52),
      days_per_week: nums.days_per_week, monthly_fee: nums.monthly_fee, meal_fee_per_day: nums.meal_fee_per_day, upkeep_fee_per_day: nums.upkeep_fee_per_day,
      other_monthly: nums.other_monthly,
      interview_at: date ? `${date}T12:00:00.000Z` : null, notes: d.notes.trim() || null,
    };
    try {
      const r = await save.mutateAsync(row);
      toast(tr(r.queued ? 'gp.savedOffline' : 'gp.saved'), 'success');
      onSaved?.(r.id);
      onClose();
    } catch (err) { toast(friendlyError(err), 'error'); }
  }
  async function remove() {
    if (!candidate || !(await confirm(tr('gp.f.delete'), tr('gp.f.deleteQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(candidate.id); toast(tr('gp.deleted')); onClose(); } catch (err) { toast(friendlyError(err), 'error'); }
  }

  const amount = (k: keyof Draft, label: string, testID: string) => (
    <Field label={label} optional value={d[k]} onChangeText={set(k)} keyboardType="decimal-pad" error={errors[k]} testID={testID} />
  );
  return (
    <GlassSheet visible={visible} onClose={onClose} title={priceOnly ? tr('gp.bd.edit') : candidate ? tr('gp.fiche.edit') : tr('gp.fiche.new')}>
      {priceOnly ? null : (
        <>
          <Field label={tr('gp.f.name')} value={d.name} onChangeText={set('name')} maxLength={80} placeholder={tr('gp.f.namePh')} error={errors.name} testID="gp-f-name" />
          <Text variant="label">{tr('gp.f.kind')}</Text>
          <Row wrap>{CANDIDATE_KINDS.map((k) => <Chip key={k} label={kindLabel(k)} selected={kind === k} onPress={() => setKind(k)} testID={`gp-f-kind-${k}`} />)}</Row>
          <Text variant="label">{tr('gp.f.status')}</Text>
          <Row wrap>{CANDIDATE_STATUSES.map((s) => <Chip key={s} label={statusLabel(s)} selected={status === s} onPress={() => setStatus(s)} testID={`gp-f-status-${s}`} />)}</Row>
          <Field label={tr('gp.f.phone')} optional value={d.phone} onChangeText={set('phone')} maxLength={40} keyboardType="phone-pad" testID="gp-f-phone" />
          <Field label={tr('gp.f.email')} optional value={d.email} onChangeText={set('email')} maxLength={120} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} testID="gp-f-email" />
          <Field label={tr('gp.f.address')} optional value={d.address} onChangeText={set('address')} maxLength={200} testID="gp-f-address" />
          <Field label={tr('gp.f.availability')} optional value={d.availability} onChangeText={set('availability')} maxLength={300} placeholder={tr('gp.f.availabilityPh')} testID="gp-f-availability" />
        </>
      )}
      <Text variant="label">{tr('gp.f.rateMode')}</Text>
      <Row wrap>
        <Chip label={tr('gp.f.hourly')} selected={mode === 'hourly'} onPress={() => setMode('hourly')} testID="gp-f-mode-hourly" />
        <Chip label={tr('gp.f.monthly')} selected={mode === 'monthly'} onPress={() => setMode('monthly')} testID="gp-f-mode-monthly" />
      </Row>
      {mode === 'hourly' ? (
        <>
          {amount('hourly_rate', tr('gp.f.hourlyRate'), 'gp-f-rate')}
          {amount('hours_per_week', tr('gp.f.hoursPerWeek'), 'gp-f-hours')}
          <Field label={tr('gp.f.weeks')} value={d.weeks_per_year} onChangeText={set('weeks_per_year')} keyboardType="number-pad" hint={tr('gp.f.weeksHint')} error={errors.weeks_per_year} testID="gp-f-weeks" />
        </>
      ) : amount('monthly_fee', tr('gp.f.monthlyFee'), 'gp-f-monthly')}
      {amount('days_per_week', tr('gp.f.daysPerWeek'), 'gp-f-days')}
      {amount('meal_fee_per_day', tr('gp.f.mealFee'), 'gp-f-meal')}
      {amount('upkeep_fee_per_day', tr('gp.f.upkeepFee'), 'gp-f-upkeep')}
      {amount('other_monthly', tr('gp.f.otherMonthly'), 'gp-f-other')}
      {priceOnly ? null : (
        <>
          <Field label={tr('gp.f.dateAt')} optional value={d.date} onChangeText={set('date')} keyboardType="numbers-and-punctuation" placeholder={tr('gp.f.dateHint')} error={errors.date} testID="gp-f-date" />
          <Field label={tr('gp.f.notes')} optional value={d.notes} onChangeText={set('notes')} maxLength={2000} multiline style={{ minHeight: 88 }} testID="gp-f-notes" />
        </>
      )}
      <Button label={tr('gp.f.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="gp-f-save" />
      {candidate && !priceOnly ? <Button label={tr('gp.f.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="gp-f-delete" /> : null}
    </GlassSheet>
  );
}
