/**
 * Symptômes et Douleur — deux journaux sur la MÊME fiche du jour (symptom_logs, une ligne par jour) :
 *  · Symptômes (journal du jour) : chaque symptôme, humeur, énergie, sommeil, stress et note est une ligne du jour ;
 *    la fiche corrige la liste des symptômes, l'humeur, l'énergie et la note (provisoire jusqu'à Enregistrer) ;
 *  · Douleur (échelle d'intensité 0–10) : une barre par jour, « 0/10 » noté ≠ rien de noté ; la fiche corrige
 *    l'intensité. Les zones, le retentissement et le reste restent dans le formulaire complet (en dessous).
 * Écriture : même chemin que les formulaires (`saveOwn('symptom_logs', …)` puis relecture de la table). Effacer les
 * symptômes d'un jour garde sa douleur, et inversement. Aucune conclusion médicale.
 */
import React, { useMemo, useState } from 'react';
import { useInvalidate } from '@/lib/data/hooks';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { saveOwn, useAllSymptomLogs } from '@/lib/data/hooks-cycle2';
import type { SymptomLog } from '@/lib/data/hooks-me';
import { friendlyError } from '@/lib/data/hooks-settings';
import { INTIMATE_SYMPTOMS, SYMPTOM_KEYS, symptomKeysOf, type SymptomKey } from '@/lib/domain/cycleV2';
import { itemsOfDay, stripDays, type DayItem } from '@/lib/domain/cycleTrack';
import { t as tr, type TKey } from '@/i18n';
import type { IconName } from '@/components/ui';
import { CycleDayPanel, dayLong, useCycleDay } from './CycleDayPanel';
import { CycleEntrySheet, type EditorSpec } from './CycleEntrySheet';

const symLabel = (k: string) => tr(`cy.sym.${k}` as TKey);
const SCALES = ['mood', 'energy', 'sleep', 'stress'] as const;
const SCALE_ICON: Record<(typeof SCALES)[number], IconName> = { mood: 'smile', energy: 'zap', sleep: 'moon', stress: 'wind' };

interface SymItem extends DayItem { log: SymptomLog; part: string; icon: IconName; title: string; detail: string | null }

/** Ce qui est noté dans une fiche du jour (hors douleur) : une ligne par symptôme, échelle et note. */
export function symptomItems(logs: readonly SymptomLog[]): SymItem[] {
  const out: SymItem[] = [];
  for (const l of logs) {
    const ints = (l.intensities ?? {}) as Record<string, number>;
    for (const k of symptomKeysOf(l)) out.push({ id: `${l.id}:${k}`, day: l.logged_on, log: l, part: k, icon: 'activity', title: symLabel(k), detail: ints[k] ? tr(`cy.sym.int${ints[k]}` as TKey) : null });
    for (const s of SCALES) if (l[s] != null) out.push({ id: `${l.id}:${s}`, day: l.logged_on, log: l, part: s, icon: SCALE_ICON[s], title: tr(`cy.sym.${s}` as TKey), detail: `${l[s]}/5` });
    if (l.note) out.push({ id: `${l.id}:note`, day: l.logged_on, log: l, part: 'note', icon: 'edit-3', title: tr('cy.sym.note'), detail: l.note });
  }
  return out;
}

export function SymptomJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useAllSymptomLogs();
  const inv = useInvalidate();
  const { prefs } = useCyclePreferences();
  const items = useMemo(() => symptomItems(q.data ?? []), [q.data]);
  const strip = useMemo(() => stripDays(items, days), [items, days]);
  const today = itemsOfDay(items, day);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sel = items.find((x) => x.id === openId) ?? null;
  const keysCount = today.filter((x) => x.icon === 'activity').length;
  const options = SYMPTOM_KEYS.filter((k) => prefs.track_intercourse || !INTIMATE_SYMPTOMS.includes(k)).map((k) => ({ value: k, label: symLabel(k) }));

  const editor = (log: SymptomLog): EditorSpec => ({
    title: tr('cy.tk.sym.fixTitle', { date: dayLong(log.logged_on) }),
    fields: [
      { key: 'keys', kind: 'multi', label: tr('cy.sym.list'), options },
      { key: 'mood', kind: 'scale', label: tr('cy.sym.mood'), min: 1, max: 5, allowNone: true, low: tr('cy.scale.low'), high: tr('cy.scale.high') },
      { key: 'energy', kind: 'scale', label: tr('cy.sym.energy'), min: 1, max: 5, allowNone: true, low: tr('cy.scale.low'), high: tr('cy.scale.high') },
      { key: 'note', kind: 'text', label: tr('cy.sym.note'), maxLength: 2000, multiline: true },
    ],
    initial: { keys: symptomKeysOf(log), mood: log.mood ?? null, energy: log.energy ?? null, note: log.note ?? '' },
    heroOf: (d) => tr('cy.tk.sym.count', { count: (d.keys as string[]).length }),
    onSave: async (d) => {
      try {
        const keys = d.keys as SymptomKey[];
        const ints = Object.fromEntries(Object.entries((log.intensities ?? {}) as Record<string, number>).filter(([k]) => keys.includes(k as SymptomKey)));
        await saveOwn('symptom_logs', { symptom_keys: keys, symptoms: [], intensities: ints, mood: d.mood ?? null, energy: d.energy ?? null, note: String(d.note ?? '').trim() || null }, log.id);
        inv('symptom_logs');
        return 'ok';
      } catch (e) { return tr('cy.tk.edit.failed', { reason: friendlyError(e) }); }
    },
    onDelete: async () => {
      try {
        // La douleur du même jour reste notée
        await saveOwn('symptom_logs', { symptom_keys: [], symptoms: [], intensities: {}, mood: null, energy: null, sleep: null, stress: null, note: null }, log.id);
        inv('symptom_logs');
        return 'ok';
      } catch (e) { return tr('cy.tk.edit.failed', { reason: friendlyError(e) }); }
    },
    deleteLabel: tr('cy.tk.sym.clear'),
  });

  return (
    <>
      <CycleDayPanel testID="ck-sym" label={tr('cy.tk.sym.label')} day={day} mode="marks"
        hero={today.length ? String(keysCount || today.length) : null}
        unit={today.length ? (keysCount ? tr('cy.tk.sym.unit', { count: keysCount }) : tr('cy.tk.sym.otherUnit', { count: today.length })) : null}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward}
        bubbleOf={(d) => (d.count == null ? tr('cy.tk.nothing') : tr('cy.tk.notes', { count: d.count }))}
        describe={(d) => (d.count == null ? tr('cy.tk.nothing') : tr('cy.tk.notes', { count: d.count }))}
        rows={today.map((x) => ({ id: x.id, time: null, icon: x.icon, title: x.title, detail: x.detail, onPress: () => { setOpenId(x.id); setVisible(true); } }))} />
      {sel ? (
        <CycleEntrySheet open={visible} onOpenChange={setVisible} testID="ck-sym-tray" title={tr('cy.sym.title')}
          hero={sel.title} lines={[dayLong(sel.day), sel.detail]}
          editorKey={`${sel.log.id}:${JSON.stringify([sel.log.symptom_keys, sel.log.mood, sel.log.energy, sel.log.note])}`} editor={editor(sel.log)} />
      ) : null}
    </>
  );
}

interface PainItem extends DayItem { log: SymptomLog; value: number }

export function PainJournal() {
  const { day, days, setDay, shift, canForward } = useCycleDay();
  const q = useAllSymptomLogs();
  const inv = useInvalidate();
  const items = useMemo<PainItem[]>(() => (q.data ?? []).filter((l) => l.pain_intensity != null).map((l) => ({ id: l.id, day: l.logged_on, log: l, value: l.pain_intensity as number })), [q.data]);
  const strip = useMemo(() => stripDays(items, days, (x) => x.value), [items, days]);
  const sel = items.find((x) => x.day === day) ?? null;
  const [visible, setVisible] = useState(false);
  const zone = (z: string) => tr(`cy.pain.zone.${z}` as TKey);
  const rows = sel ? [
    { id: 'intensity', time: null, icon: 'zap' as IconName, title: tr('cy.tk.pain.row', { n: sel.value }), detail: (sel.log.pain_locations ?? []).map(zone).join(', ') || null, onPress: () => setVisible(true) },
    ...((sel.log.pain_impact ?? []).length ? [{ id: 'impact', time: null, icon: 'alert-circle' as IconName, title: tr('cy.pain.impactQ'), detail: (sel.log.pain_impact ?? []).map((v) => tr(`cy.pain.impact.${v}` as TKey)).join(', '), onPress: () => setVisible(true) }] : []),
    ...(sel.log.pain_duration ? [{ id: 'duration', time: null, icon: 'clock' as IconName, title: tr('cy.pain.durationQ'), detail: tr(`cy.pain.duration.${sel.log.pain_duration}` as TKey), onPress: () => setVisible(true) }] : []),
  ] : [];

  const editor = (log: SymptomLog): EditorSpec => ({
    title: tr('cy.tk.pain.fixTitle', { date: dayLong(log.logged_on) }),
    fields: [{ key: 'v', kind: 'scale', label: tr('cy.tk.pain.scale'), min: 0, max: 10, low: tr('cy.tk.pain.low'), high: tr('cy.tk.pain.high') }],
    initial: { v: log.pain_intensity ?? null },
    heroOf: (d) => (d.v == null ? tr('cy.tk.nothing') : `${d.v}/10`),
    validate: (d) => (d.v == null ? tr('cy.pain.errIntensity') : null),
    onSave: async (d) => {
      try { await saveOwn('symptom_logs', { pain_intensity: d.v }, log.id); inv('symptom_logs'); return 'ok'; } catch (e) { return tr('cy.tk.edit.failed', { reason: friendlyError(e) }); }
    },
    onDelete: async () => {
      try {
        // Les symptômes, l'humeur et la note du même jour restent notés
        await saveOwn('symptom_logs', { pain_intensity: null, pain_locations: [], pain_duration: null, pain_onset: null, pain_pattern: null, pain_impact: [], pain_associated: [], pain_pregnancy: null, pain_relief: null, pain_meds: null }, log.id);
        inv('symptom_logs');
        return 'ok';
      } catch (e) { return tr('cy.tk.edit.failed', { reason: friendlyError(e) }); }
    },
    deleteLabel: tr('cy.tk.pain.clear'),
  });

  return (
    <>
      <CycleDayPanel testID="ck-pain" label={tr('cy.tk.pain.label')} day={day} mode="scale" max={10}
        hero={sel ? String(sel.value) : null} unit={sel ? tr('cy.tk.pain.unit') : null} heroA11y={sel ? tr('cy.tk.pain.row', { n: sel.value }) : undefined}
        strip={strip} onSelect={setDay} onShift={shift} canForward={canForward}
        bubbleOf={(d) => (d.value == null ? tr('cy.tk.nothing') : `${d.value}/10`)}
        describe={(d) => (d.value == null ? tr('cy.tk.nothing') : tr('cy.tk.pain.row', { n: d.value }))}
        rows={rows} />
      {sel ? (
        <CycleEntrySheet open={visible} onOpenChange={setVisible} testID="ck-pain-tray" title={tr('cy.pain.title')}
          hero={`${sel.value}/10`} heroLabel={tr('cy.tk.pain.row', { n: sel.value })}
          lines={[dayLong(sel.day), (sel.log.pain_locations ?? []).map(zone).join(', ') || null]}
          editorKey={`${sel.id}:${sel.value}`} editor={editor(sel.log)} />
      ) : null}
    </>
  );
}
