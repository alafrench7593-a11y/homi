/**
 * Journaux du parcours « concevoir » et de la vie intime (22/11/2026) — même geste « journal du jour » :
 *  · Tests (ovulation_tests, pregnancy_tests) : un test = une ligne horodatée ; la fiche corrige le jour, l'heure et le
 *    résultat SAISI (un résultat reste un résultat noté : aucune conclusion sur l'ovulation ou une grossesse) ;
 *  · Glaire (fertility_observations, une observation par jour) : la fiche corrige l'aspect et la note ; la température
 *    du même jour est conservée (même écriture que la courbe de température) ;
 *  · Rapports (intercourse_logs, privé) : la fiche corrige le jour, la protection et la note ;
 *  · PMA (pma_logs du protocole affiché) : la fiche corrige le jour, l'heure et la note d'une prise ou d'une étape.
 */
import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import type { IconName } from '@/components/ui';
import { formatTime, t as tr, type TKey } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useTests } from '@/lib/data/hooks';
import { useDeleteTest } from '@/lib/data/hooks-cycle';
import { removeOwn, saveOwn } from '@/lib/data/hooks-cycle2';
import { useFertilityObservations, useIntercourseLogs, useSaveObservation } from '@/lib/data/hooks-fertility';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { PmaLog } from '@/lib/data/hooks-tools6';
import { clockOf, itemsOfDay, localDay, moveToDay, stripDays, withClock } from '@/lib/domain/cycleTrack';
import { CERVICAL_MUCUS, type CervicalMucus, type IntercourseLog } from '@/lib/types-fertility';
import { CycleDayPanel, dayInline, dayLong, useCycleDay } from './CycleDayPanel';
import { CycleEntrySheet, type EditorSpec } from './CycleEntrySheet';

const failed = (e: unknown) => tr('cy.tk.edit.failed', { reason: friendlyError(e) });
const notesBubble = (d: { count: number | null }) => (d.count == null ? tr('cy.tk.nothing') : tr('cy.tk.notes', { count: d.count }));
function useSheet() {
  const [id, setId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  return { id, visible, setVisible, open: (x: string) => { setId(x); setVisible(true); } };
}
/** Horodatage corrigé (jour + heure) ; message si invalide ou dans le futur. */
function correctedAt(at: string, day: unknown, time: unknown): { at: string } | { error: string } {
  const n = withClock(moveToDay(at, String(day)), String(time));
  if (!n) return { error: tr('cy.tk.edit.badTime') };
  if (Date.parse(n) > Date.now()) return { error: tr('cy.tk.edit.day.future') };
  return { at: n };
}

// ─── Tests d'ovulation et de grossesse ───────────────────────────────────────────────────────────────────────

type Table = 'ovulation_tests' | 'pregnancy_tests';
const RESULTS: Record<Table, string[]> = { ovulation_tests: ['negative', 'positive', 'peak', 'invalid'], pregnancy_tests: ['negative', 'positive', 'faint', 'invalid'] };
const kindLabel = (t: Table) => (t === 'ovulation_tests' ? tr('cy.test.ovulation') : tr('cy.test.pregnancy'));
const resultLabel = (r: string) => tr(`cy.test.r.${r}` as TKey);

export function TestJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const ovuQ = useTests('ovulation_tests');
  const pregQ = useTests('pregnancy_tests');
  const inv = useInvalidate();
  const del = useDeleteTest();
  const items = useMemo(() => [
    ...(ovuQ.data ?? []).map((x) => ({ id: x.id, day: localDay(x.tested_at), at: x.tested_at, table: 'ovulation_tests' as Table, row: x })),
    ...(pregQ.data ?? []).map((x) => ({ id: x.id, day: localDay(x.tested_at), at: x.tested_at, table: 'pregnancy_tests' as Table, row: x })),
  ], [ovuQ.data, pregQ.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const list = itemsOfDay(items, day);
  const latest = list[list.length - 1] ?? null;
  const sh = useSheet();
  const sel = items.find((x) => x.id === sh.id) ?? null;
  const editor = (x: (typeof items)[number]): EditorSpec => ({
    title: tr('cy.tk.ts.fixTitle', { kind: kindLabel(x.table) }),
    fields: [
      { key: 'day', kind: 'day', label: tr('cy.tk.edit.dayLabel') },
      { key: 'time', kind: 'time', label: tr('cy.tk.edit.time') },
      { key: 'result', kind: 'choice', label: tr('cy.test.result'), options: RESULTS[x.table].map((r) => ({ value: r, label: resultLabel(r) })) },
    ],
    initial: { day: x.day, time: clockOf(x.at), result: x.row.result },
    heroOf: (d) => resultLabel(String(d.result)),
    onSave: async (d) => {
      const c = correctedAt(x.at, d.day, d.time);
      if ('error' in c) return c.error;
      try { await saveOwn(x.table, { tested_at: c.at, result: d.result }, x.id); inv(x.table); return 'ok'; } catch (e) { return failed(e); }
    },
    onDelete: async () => {
      try { await del.mutateAsync({ kind: x.table === 'ovulation_tests' ? 'ovulation' : 'pregnancy', id: x.id, photoPath: (x.row as { photo_path?: string | null }).photo_path ?? null }); return 'ok'; } catch (e) { return failed(e); }
    },
  });
  return (
    <>
      <CycleDayPanel loading={(ovuQ.isLoading && !ovuQ.data) || (pregQ.isLoading && !pregQ.data)} testID="ck-ts" label={tr('cy.tk.ts.label')} day={day} mode="marks"
        hero={latest ? resultLabel(latest.row.result) : null} unit={latest ? tr('cy.tk.ts.unit', { kind: kindLabel(latest.table), time: formatTime(latest.at), count: list.length }) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={notesBubble} describe={notesBubble}
        rows={list.map((x) => ({ id: x.id, time: formatTime(x.at), icon: 'check-circle', title: `${kindLabel(x.table)} · ${resultLabel(x.row.result)}`, detail: null, onPress: () => sh.open(x.id) }))} />
      {sel ? (
        <CycleEntrySheet open={sh.visible} onOpenChange={sh.setVisible} testID="ck-ts-tray" title={kindLabel(sel.table)} hero={resultLabel(sel.row.result)}
          lines={[`${dayLong(sel.day)} · ${formatTime(sel.at)}`, tr('cy.tk.ts.asNoted')]}
          editorKey={`${sel.id}:${sel.at}:${sel.row.result}`} editor={editor(sel)} />
      ) : null}
    </>
  );
}

// ─── Glaire cervicale ────────────────────────────────────────────────────────────────────────────────────────

const mucusLabel = (v: string | null | undefined) => CERVICAL_MUCUS.find((m) => m.value === v)?.label ?? tr('cy.tk.nothing');

export function MucusJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useFertilityObservations(400);
  const save = useSaveObservation();
  const items = useMemo(() => (q.data ?? []).filter((o) => o.cervical_mucus != null).map((o) => ({ id: o.id, day: o.observed_on, at: null, obs: o })), [q.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const sel = items.find((x) => x.day === day) ?? null;
  const [visible, setVisible] = useState(false);
  const editor = (o: NonNullable<typeof sel>['obs']): EditorSpec => ({
    title: tr('cy.tk.mu.fixTitle', { date: dayInline(o.observed_on) }),
    fields: [
      { key: 'mucus', kind: 'choice', label: tr('cy.tk.mu.aspect'), options: CERVICAL_MUCUS.map((m) => ({ value: m.value, label: m.label })) },
      { key: 'note', kind: 'text', label: tr('cy.sym.note'), maxLength: 500, multiline: true },
    ],
    initial: { mucus: o.cervical_mucus, note: o.note ?? '' },
    heroOf: (d) => mucusLabel(d.mucus as string),
    onSave: async (d) => {
      // Même écriture que la température : une observation par jour, température conservée
      try { await save.mutateAsync({ observed_on: o.observed_on, bbt_celsius: o.bbt_celsius, cervical_mucus: d.mucus as CervicalMucus, note: String(d.note ?? '').trim() || null }); return 'ok'; } catch (e) { return failed(e); }
    },
    onDelete: async () => {
      try { await save.mutateAsync({ observed_on: o.observed_on, bbt_celsius: o.bbt_celsius, cervical_mucus: null, note: o.note }); return 'ok'; } catch (e) { return failed(e); }
    },
    deleteLabel: tr('cy.tk.mu.clear'),
  });
  return (
    <>
      <CycleDayPanel loading={q.isLoading && !q.data} testID="ck-mu" label={tr('cy.tk.mu.label')} day={day} mode="marks"
        hero={sel ? mucusLabel(sel.obs.cervical_mucus) : null} unit={sel ? tr('cy.tk.mu.unit') : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward}
        bubbleOf={(d) => { const o = items.find((x) => x.day === d.day); return o ? mucusLabel(o.obs.cervical_mucus) : tr('cy.tk.nothing'); }}
        describe={(d) => { const o = items.find((x) => x.day === d.day); return o ? mucusLabel(o.obs.cervical_mucus) : tr('cy.tk.nothing'); }}
        rows={sel ? [{ id: sel.id, time: null, icon: 'eye' as IconName, title: mucusLabel(sel.obs.cervical_mucus), detail: sel.obs.note, onPress: () => setVisible(true) }] : []} />
      {sel ? (
        <CycleEntrySheet open={visible} onOpenChange={setVisible} testID="ck-mu-tray" title={tr('cy.tk.mu.label')} hero={mucusLabel(sel.obs.cervical_mucus)}
          lines={[dayLong(sel.day), sel.obs.note, tr('cy.tk.mu.noConclusion')]}
          editorKey={`${sel.id}:${sel.obs.cervical_mucus}:${sel.obs.note}`} editor={editor(sel.obs)} />
      ) : null}
    </>
  );
}

// ─── Rapports (privé) ────────────────────────────────────────────────────────────────────────────────────────

const A4 = ['yes', 'no', 'unsure', 'prefer_not'] as const;
const ans = (v: string | null | undefined) => (v ? tr(`cy.ans.${v}` as TKey) : null);

export function IntimacyJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useIntercourseLogs(400);
  const inv = useInvalidate();
  const items = useMemo(() => (q.data ?? []).map((l) => ({ id: l.id, day: l.occurred_on, at: l.occurred_time ? `${l.occurred_on}T${l.occurred_time}` : null, log: l })), [q.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const list = itemsOfDay(items, day);
  const sh = useSheet();
  const sel = items.find((x) => x.id === sh.id) ?? null;
  const protection = (l: IntercourseLog) => (l.condom ? tr('cy.tk.sx.condom', { answer: ans(l.condom) ?? '' }) : null);
  const editor = (l: IntercourseLog): EditorSpec => ({
    title: tr('cy.sex.editTitle'),
    fields: [
      { key: 'day', kind: 'day', label: tr('cy.tk.edit.dayLabel') },
      { key: 'condom', kind: 'choice', label: tr('cy.sex.condomQ'), options: A4.map((v) => ({ value: v, label: ans(v)! })), allowNone: true },
      { key: 'note', kind: 'text', label: tr('cy.sex.note'), maxLength: 1000, multiline: true },
    ],
    initial: { day: l.occurred_on, condom: l.condom ?? null, note: l.note ?? '' },
    heroOf: (d) => (d.condom ? tr('cy.tk.sx.condom', { answer: ans(d.condom as string) ?? '' }) : tr('cy.tk.sx.hero')),
    onSave: async (d) => {
      try {
        const patch: Record<string, unknown> = { occurred_on: d.day, condom: d.condom ?? null, note: String(d.note ?? '').trim() || null };
        if (d.condom !== 'yes' && d.condom !== 'unsure') patch.condom_incident = null; // même règle que le formulaire
        await saveOwn('intercourse_logs', patch, l.id); inv('intercourse_logs'); return 'ok';
      } catch (e) { return failed(e); }
    },
    onDelete: async () => { try { await removeOwn('intercourse_logs', l.id); inv('intercourse_logs'); return 'ok'; } catch (e) { return failed(e); } },
  });
  return (
    <>
      <CycleDayPanel loading={q.isLoading && !q.data} testID="ck-sx" label={tr('cy.tk.sx.label')} day={day} mode="marks"
        hero={list.length ? String(list.length) : null} unit={list.length ? tr('cy.tk.sx.unit', { count: list.length }) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={notesBubble} describe={notesBubble}
        rows={list.map((x) => ({ id: x.id, time: x.log.occurred_time ? x.log.occurred_time.slice(0, 5) : null, icon: 'lock', title: tr('cy.tk.sx.hero'), detail: [protection(x.log), x.log.note].filter(Boolean).join(' · ') || null, onPress: () => sh.open(x.id) }))} />
      {sel ? (
        <CycleEntrySheet open={sh.visible} onOpenChange={sh.setVisible} testID="ck-sx-tray" title={tr('cy.sex.title')} hero={tr('cy.tk.sx.hero')}
          lines={[[dayLong(sel.day), sel.log.occurred_time?.slice(0, 5)].filter(Boolean).join(' · '), protection(sel.log), sel.log.note]}
          editorKey={`${sel.id}:${sel.log.occurred_on}:${sel.log.condom}:${sel.log.note}`} editor={editor(sel.log)}
          onFullForm={() => router.setParams({ id: sel.id } as never)} />
      ) : null}
    </>
  );
}

// ─── PMA ─────────────────────────────────────────────────────────────────────────────────────────────────────

export function PmaJournal({ logs, labelOf, iconOf, startedOn }: { logs: readonly PmaLog[]; labelOf: (l: PmaLog) => string; iconOf: (l: PmaLog) => IconName; startedOn: string }) {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const inv = useInvalidate();
  const items = useMemo(() => logs.map((l) => ({ id: l.id, day: localDay(l.happened_at), at: l.happened_at, log: l })), [logs]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const list = itemsOfDay(items, day);
  const sh = useSheet();
  const sel = items.find((x) => x.id === sh.id) ?? null;
  const editor = (l: PmaLog): EditorSpec => ({
    title: tr('cy.tk.pma.fixTitle', { what: labelOf(l) }),
    fields: [
      { key: 'day', kind: 'day', label: tr('cy.tk.edit.dayLabel'), min: startedOn },
      { key: 'time', kind: 'time', label: tr('cy.tk.edit.time') },
      { key: 'note', kind: 'text', label: tr('cy.sym.note'), maxLength: 500, multiline: true },
    ],
    initial: { day: localDay(l.happened_at), time: clockOf(l.happened_at), note: l.note ?? '' },
    heroOf: (d) => String(d.time ?? ''),
    onSave: async (d) => {
      const c = correctedAt(l.happened_at, d.day, d.time);
      if ('error' in c) return c.error;
      try { await backend.update('pma_logs', { happened_at: c.at, note: String(d.note ?? '').trim() || null }, [eq('id', l.id)]); inv('pma_logs'); return 'ok'; } catch (e) { return failed(e); }
    },
    onDelete: async () => { try { await backend.remove('pma_logs', [eq('id', l.id)]); inv('pma_logs'); return 'ok'; } catch (e) { return failed(e); } },
  });
  return (
    <>
      <CycleDayPanel testID="ck-pma" label={tr('cy.tk.pma.label')} day={day} mode="marks"
        hero={list.length ? String(list.length) : null} unit={list.length ? tr('cy.tk.pma.unit', { count: list.length }) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={notesBubble} describe={notesBubble}
        rows={list.map((x) => ({ id: x.id, time: formatTime(x.at), icon: iconOf(x.log), title: labelOf(x.log), detail: x.log.note, onPress: () => sh.open(x.id) }))} />
      {sel ? (
        <CycleEntrySheet open={sh.visible} onOpenChange={sh.setVisible} testID="ck-pma-tray" title={tr('cy.tk.pma.label')} hero={formatTime(sel.at)}
          lines={[labelOf(sel.log), dayLong(sel.day), sel.log.note]}
          editorKey={`${sel.id}:${sel.log.happened_at}:${sel.log.note}`} editor={editor(sel.log)} />
      ) : null}
    </>
  );
}
