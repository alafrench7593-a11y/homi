/**
 * Journaux d'observations du cycle (22/11/2026) — même geste « journal du jour » (`CycleDayPanel`) :
 *  · Pertes (discharge_logs, horodatées) : heure en colonne ; la fiche corrige le jour, l'heure, la quantité et la note ;
 *  · Saignements inhabituels (bleeding_logs) : la fiche corrige le jour, la quantité et la note ; l'orientation déjà
 *    calculée par l'écran (`bleedingOrientation`, sur des signes SAISIS) s'affiche aussitôt sur la valeur provisoire ;
 *  · Journal du cycle (cycle_journal) : la fiche corrige le jour, l'humeur et le texte ;
 *  · Journal de ma contraception (contraception_logs, kind = effect) : la fiche corrige le jour, l'effet et la note.
 * Écritures : mêmes chemins que les formulaires (`saveOwn` / `removeOwn` / table contraception_logs), puis relecture.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, type IconName } from '@/components/ui';
import { formatTime, t as tr, type TKey } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { removeOwn, saveOwn, useBleedingLogs, useCycleJournal, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { useContraceptionLogs } from '@/lib/data/hooks-cycle3';
import { friendlyError } from '@/lib/data/hooks-settings';
import { bleedingOrientation, DISCHARGE } from '@/lib/domain/cycleV2';
import { clockOf, itemsOfDay, localDay, moveToDay, stripDays, withClock, type DayItem } from '@/lib/domain/cycleTrack';
import { useDischargeLabels } from '@/features/cycle/discharge';
import { useEmergencyNumbers } from '@/features/cycle/emergency';
import { CycleDayPanel, dayLong, useCycleDay, type JournalRow } from './CycleDayPanel';
import { CycleEntrySheet, type EditorSpec } from './CycleEntrySheet';

const failed = (e: unknown) => tr('cy.tk.edit.failed', { reason: friendlyError(e) });
const notesBubble = (d: { count: number | null }) => (d.count == null ? tr('cy.tk.nothing') : tr('cy.tk.notes', { count: d.count }));

/** Ouvre la fiche d'une saisie (id dans l'état local ; le jour reste dans l'adresse). */
function useSheet() {
  const [id, setId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  return { id, visible, setVisible, open: (x: string) => { setId(x); setVisible(true); } };
}

// ─── Pertes ──────────────────────────────────────────────────────────────────────────────────────────────────

export function DischargeJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useDischargeLogs();
  const inv = useInvalidate();
  const L = useDischargeLabels();
  const items = useMemo(() => (q.data ?? []).map((l) => ({ id: l.id, day: localDay(l.observed_at), at: l.observed_at, log: l })), [q.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const list = itemsOfDay(items, day);
  const sh = useSheet();
  const sel = items.find((x) => x.id === sh.id) ?? null;
  const amount = (v: string | null | undefined) => (v ? tr(`cy.dis.amount.${v}` as TKey) : tr('cy.tk.dis.hero'));
  const editor = (l: (typeof items)[number]['log']): EditorSpec => ({
    title: tr('cy.tk.dis.fixTitle'),
    fields: [
      { key: 'day', kind: 'day', label: tr('cy.tk.edit.dayLabel') },
      { key: 'time', kind: 'time', label: tr('cy.tk.edit.time') },
      { key: 'amount', kind: 'choice', label: tr('cy.dis.amountQ' as TKey), options: DISCHARGE.amount.map((v) => ({ value: v, label: tr(`cy.dis.amount.${v}` as TKey) })), allowNone: true },
      { key: 'note', kind: 'text', label: tr('cy.dis.note'), maxLength: 2000, multiline: true },
    ],
    initial: { day: localDay(l.observed_at), time: clockOf(l.observed_at), amount: l.amount, note: l.note ?? '' },
    heroOf: (d) => amount(d.amount as string | null),
    onSave: async (d) => {
      const at = withClock(moveToDay(l.observed_at, String(d.day)), String(d.time));
      if (!at) return tr('cy.tk.edit.badTime');
      if (Date.parse(at) > Date.now()) return tr('cy.tk.edit.day.future');
      try { await saveOwn('discharge_logs', { observed_at: at, amount: d.amount ?? null, note: String(d.note ?? '').trim() || null }, l.id); inv('discharge_logs'); return 'ok'; } catch (e) { return failed(e); }
    },
    onDelete: async () => { try { await removeOwn('discharge_logs', l.id); inv('discharge_logs'); return 'ok'; } catch (e) { return failed(e); } },
  });
  return (
    <>
      <CycleDayPanel loading={q.isLoading && !q.data} testID="ck-dis" label={tr('cy.tk.dis.label')} day={day} mode="marks"
        hero={list.length ? String(list.length) : null} unit={list.length ? tr('cy.tk.dis.unit', { count: list.length }) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={notesBubble} describe={notesBubble}
        rows={list.map((x) => ({ id: x.id, time: formatTime(x.at), icon: 'droplet', title: L.summary(x.log) || tr('cy.dis.noDetail'), detail: x.log.note, onPress: () => sh.open(x.id) }))} />
      {sel ? (
        <CycleEntrySheet open={sh.visible} onOpenChange={sh.setVisible} testID="ck-dis-tray" title={tr('cy.dis.title')} hero={amount(sel.log.amount)}
          lines={[`${dayLong(sel.day)} · ${formatTime(sel.at)}`, L.summary(sel.log) || null, sel.log.note]}
          editorKey={`${sel.id}:${sel.log.observed_at}:${sel.log.amount}:${sel.log.note}`} editor={editor(sel.log)}
          onFullForm={() => router.push(`/cycle/discharge/${sel.id}` as never)} />
      ) : null}
    </>
  );
}

// ─── Saignements inhabituels ─────────────────────────────────────────────────────────────────────────────────

const BLEED_AMOUNTS = ['spotting', 'light', 'moderate', 'heavy', 'very_heavy'] as const;

export function BleedingJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useBleedingLogs();
  const inv = useInvalidate();
  const emergency = useEmergencyNumbers();
  const items = useMemo(() => (q.data ?? []).map((b) => ({ id: b.id, day: b.occurred_on, at: null, log: b })), [q.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const list = itemsOfDay(items, day);
  const sh = useSheet();
  const sel = items.find((x) => x.id === sh.id) ?? null;
  const kind = (k: string) => tr(`cy.bl.kind.${k}` as TKey);
  const amt = (a: string | null | undefined) => (a ? tr(`cy.bl.amount.${a}` as TKey) : null);
  const editor = (b: (typeof items)[number]['log']): EditorSpec => ({
    title: tr('cy.tk.bl.fixTitle'),
    fields: [
      { key: 'day', kind: 'day', label: tr('cy.tk.edit.dayLabel') },
      { key: 'amount', kind: 'choice', label: tr('cy.bl.amountQ'), options: BLEED_AMOUNTS.map((v) => ({ value: v, label: tr(`cy.bl.amount.${v}` as TKey) })), allowNone: true },
      { key: 'note', kind: 'text', label: tr('cy.dis.note'), maxLength: 2000, multiline: true },
    ],
    initial: { day: b.occurred_on, amount: b.amount, note: b.note ?? '' },
    heroOf: (d) => amt(d.amount as string | null) ?? kind(b.kind),
    // Orientation de l'écran (signes saisis), recalculée sur la valeur provisoire : l'accès à l'aide n'attend pas l'enregistrement
    notice: (d) => {
      const o = bleedingOrientation({ kind: b.kind, amount: d.amount as string | null, pain: b.pain, pregnancy: b.pregnancy });
      if (o === 'urgent') return <Banner tone="danger" title={tr('cy.orient.urgentTitle')} action={<Button label={tr('cy.orient.call')} variant="danger" size="sm" onPress={() => router.push('/emergency')} />}>{tr('cy.orient.urgentBleeding', { numbers: emergency })}</Banner>;
      if (o === 'see_soon') return <Banner tone="warning" title={tr('cy.orient.seeTitle')}>{tr('cy.orient.seeBleeding')}</Banner>;
      return null;
    },
    onSave: async (d) => {
      try { await saveOwn('bleeding_logs', { occurred_on: d.day, amount: d.amount ?? null, note: String(d.note ?? '').trim() || null }, b.id); inv('bleeding_logs'); return 'ok'; } catch (e) { return failed(e); }
    },
    onDelete: async () => { try { await removeOwn('bleeding_logs', b.id); inv('bleeding_logs'); return 'ok'; } catch (e) { return failed(e); } },
  });
  return (
    <>
      <CycleDayPanel loading={q.isLoading && !q.data} testID="ck-bl" label={tr('cy.tk.bl.label')} day={day} mode="marks"
        hero={list.length ? String(list.length) : null} unit={list.length ? tr('cy.tk.bl.unit', { count: list.length }) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={notesBubble} describe={notesBubble}
        rows={list.map((x) => ({ id: x.id, time: null, icon: 'alert-triangle', title: kind(x.log.kind), detail: [amt(x.log.amount), x.log.pain ? tr('cy.bl.withPain') : null, x.log.note].filter(Boolean).join(' · ') || null, onPress: () => sh.open(x.id) }))} />
      {sel ? (
        <CycleEntrySheet open={sh.visible} onOpenChange={sh.setVisible} testID="ck-bl-tray" title={tr('cy.bl.title')} hero={amt(sel.log.amount) ?? kind(sel.log.kind)}
          lines={[dayLong(sel.day), kind(sel.log.kind), sel.log.pain ? tr('cy.bl.withPain') : null, sel.log.note]}
          editorKey={`${sel.id}:${sel.log.occurred_on}:${sel.log.amount}:${sel.log.note}`} editor={editor(sel.log)}
          onFullForm={() => router.setParams({ id: sel.id } as never)} />
      ) : null}
    </>
  );
}

// ─── Journal du cycle ────────────────────────────────────────────────────────────────────────────────────────

export function CycleNotesJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useCycleJournal();
  const inv = useInvalidate();
  const items = useMemo(() => (q.data ?? []).map((e) => ({ id: e.id, day: e.entry_on, at: e.updated_at ?? null, log: e })), [q.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const list = itemsOfDay(items, day);
  const sh = useSheet();
  const sel = items.find((x) => x.id === sh.id) ?? null;
  const heroOf = (mood: unknown) => (typeof mood === 'number' ? tr('cy.jr.moodValue', { n: mood }) : tr('cy.tk.jr.hero'));
  const editor = (e: (typeof items)[number]['log']): EditorSpec => ({
    title: tr('cy.jr.editTitle'),
    fields: [
      { key: 'day', kind: 'day', label: tr('cy.tk.edit.dayLabel') },
      { key: 'mood', kind: 'scale', label: tr('cy.scale.mood'), min: 1, max: 5, allowNone: true, low: tr('cy.scale.low'), high: tr('cy.scale.high') },
      { key: 'body', kind: 'text', label: tr('cy.jr.body'), maxLength: 10000, multiline: true },
    ],
    initial: { day: e.entry_on, mood: e.mood, body: e.body },
    heroOf: (d) => heroOf(d.mood),
    validate: (d) => (String(d.body ?? '').trim() ? null : tr('cy.jr.errEmpty')),
    onSave: async (d) => {
      try { await saveOwn('cycle_journal', { entry_on: d.day, mood: d.mood ?? null, body: String(d.body).trim() }, e.id); inv('cycle_journal'); return 'ok'; } catch (er) { return failed(er); }
    },
    onDelete: async () => { try { await removeOwn('cycle_journal', e.id); inv('cycle_journal'); return 'ok'; } catch (er) { return failed(er); } },
  });
  return (
    <>
      <CycleDayPanel loading={q.isLoading && !q.data} testID="ck-jr" label={tr('cy.tk.jr.label')} day={day} mode="marks"
        hero={list.length ? String(list.length) : null} unit={list.length ? tr('cy.tk.jr.unit', { count: list.length }) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={notesBubble} describe={notesBubble}
        rows={list.map((x) => ({ id: x.id, time: null, icon: 'edit-3', title: firstLine(x.log.body), detail: x.log.mood ? tr('cy.jr.moodValue', { n: x.log.mood }) : null, onPress: () => sh.open(x.id) }))} />
      {sel ? (
        <CycleEntrySheet open={sh.visible} onOpenChange={sh.setVisible} testID="ck-jr-tray" title={tr('cy.jr.title')} hero={heroOf(sel.log.mood)}
          lines={[dayLong(sel.day), sel.log.body]}
          editorKey={`${sel.id}:${sel.log.entry_on}:${sel.log.mood}:${sel.log.body}`} editor={editor(sel.log)} />
      ) : null}
    </>
  );
}
const firstLine = (s: string) => { const l = s.trim().split('\n')[0]; return l.length > 80 ? `${l.slice(0, 79)}…` : l; };

// ─── Journal de ma contraception ─────────────────────────────────────────────────────────────────────────────

export const CONTRA_EFFECTS = ['mood', 'bleeding', 'pain', 'libido', 'skin', 'weight', 'headache', 'nausea', 'other'] as const;
export type ContraEffect = (typeof CONTRA_EFFECTS)[number];
export const effectLabel = (l: { label: string | null }) => (CONTRA_EFFECTS.includes(l.label as ContraEffect) ? tr(`cj.effect.${l.label}` as TKey) : l.label ?? tr('cj.effect.other'));

export function ContraceptionEffectJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useContraceptionLogs(400);
  const inv = useInvalidate();
  const items = useMemo(() => (q.data ?? []).filter((l) => l.kind === 'effect').map((l) => ({ id: l.id, day: l.logged_on, at: null, log: l })), [q.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const list = itemsOfDay(items, day);
  const sh = useSheet();
  const sel = items.find((x) => x.id === sh.id) ?? null;
  const note = (l: { note?: string | null }) => l.note ?? null;
  const editor = (l: (typeof items)[number]['log']): EditorSpec => ({
    title: tr('cy.tk.cj.fixTitle'),
    fields: [
      { key: 'day', kind: 'day', label: tr('cy.tk.edit.dayLabel') },
      { key: 'effect', kind: 'choice', label: tr('cj.what'), options: CONTRA_EFFECTS.map((v) => ({ value: v, label: tr(`cj.effect.${v}` as TKey) })) },
      { key: 'note', kind: 'text', label: tr('cj.note'), maxLength: 500, multiline: true },
    ],
    initial: { day: l.logged_on, effect: l.label, note: note(l as { note?: string | null }) ?? '' },
    heroOf: (d) => effectLabel({ label: d.effect as string | null }),
    onSave: async (d) => {
      try {
        await backend.update('contraception_logs', { logged_on: d.day, label: d.effect, note: String(d.note ?? '').trim() || null }, [eq('id', l.id)]);
        inv('contraception_logs');
        return 'ok';
      } catch (e) { return failed(e); }
    },
    onDelete: async () => { try { await backend.remove('contraception_logs', [eq('id', l.id)]); inv('contraception_logs'); return 'ok'; } catch (e) { return failed(e); } },
  });
  const rows: JournalRow[] = list.map((x) => ({ id: x.id, time: null, icon: 'pen-tool' as IconName, title: effectLabel(x.log), detail: note(x.log as { note?: string | null }), onPress: () => sh.open(x.id) }));
  return (
    <View>
      <CycleDayPanel loading={q.isLoading && !q.data} testID="ck-cj" label={tr('cy.tk.cj.label')} day={day} mode="marks"
        hero={list.length ? String(list.length) : null} unit={list.length ? tr('cy.tk.cj.unit', { count: list.length }) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={notesBubble} describe={notesBubble} rows={rows} />
      {sel ? (
        <CycleEntrySheet open={sh.visible} onOpenChange={sh.setVisible} testID="ck-cj-tray" title={tr('cy.tk.cj.label')} hero={effectLabel(sel.log)}
          lines={[dayLong(sel.day), note(sel.log as { note?: string | null })]}
          editorKey={`${sel.id}:${sel.log.logged_on}:${sel.log.label}:${note(sel.log as { note?: string | null })}`} editor={editor(sel.log)} />
      ) : null}
    </View>
  );
}

export type { DayItem };
