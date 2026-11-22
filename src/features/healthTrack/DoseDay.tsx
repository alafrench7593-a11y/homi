/**
 * Médicaments — prises d'une journée (22/11/2026). Lit les MÊMES prises que « Ma journée » et les rappels
 * (`treatment_logs`, `my_treatment_logs`) ; rien n'est recopié :
 *  · donnée principale : « 2 / 3 » prises notées ce jour-là ; une journée avec des prises prévues mais aucune réponse
 *    = « rien de noté » (jamais « 0 prise ») ;
 *  · 7 jours en barres (prises notées « prises »), le jour choisi reste dans l'adresse (`?day=`) ;
 *  · une ligne par prise prévue : heure prévue en colonne, case à cocher en un geste (inchangée), nom et dose RECOPIÉS
 *    de l'ordonnance, statut et heure RÉELLE de prise (« prise à 8 h 12 ») ;
 *  · toucher la ligne → fiche (Tray) ; « Corriger » : statut (prise / pas prise) et heure de prise PROVISOIRES,
 *    Annuler, Enregistrer verrouillé contre le double appui, brouillon conservé si l'écriture échoue.
 * Aucune dose n'est proposée, calculée ni modifiée ici.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassSegmentedControl } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useEditHealthRow } from '@/lib/data/hooks-healthTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { hhmm } from '@/lib/domain/quickTrack';
import { doseDay, takenAt, takenTime, type DoseStatus } from '@/lib/domain/healthTrack';
import { CheckMark } from '@/motion/CheckMark';
import { DayBars } from '@/features/quickTrack/DayBars';
import { EditActions, EditHeader, EntryTray, HERO, TimeEditor, useGuardedSave } from '@/features/quickTrack/EntryTray';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { HeroEntry, TABULAR } from './TimedJournal';

const MIN = 60_000;

export interface DoseRow {
  key: string; time: string; who: string; childId: string | null; name: string; dose: string; treatmentId: string; scheduledFor: string;
  log: { id: string; status: DoseStatus; logged_at?: string | null; note?: string | null } | null;
}

export const STATUS_ICON: Record<DoseStatus | 'todo', IconName> = { taken: 'check', skipped: 'x', snoozed: 'clock', todo: 'circle' };
export const statusLabel = (s: DoseStatus | 'todo') => tr(`ht.dose.status.${s}` as TKey);

/** « prise à 8 h 12 », « pas prise », « reportée », « prévue » */
export function doseDetail(r: DoseRow): string {
  const at = takenAt(r);
  if (at) return tr('ht.dose.takenAt', { time: clock(at) });
  return statusLabel(r.log?.status ?? 'todo');
}

export type DoseAnswer = (r: DoseRow, at: Date | undefined, status: 'taken' | 'skipped') => Promise<void>;

export function DoseDay({ days, selected, onSelectDay, rows, onToggle, onAnswer, isToday }: {
  days: { day: string; rows: DoseRow[] }[]; selected: string; onSelectDay: (d: string) => void; rows: DoseRow[];
  /** Case à cocher (un geste) */
  onToggle: (r: DoseRow) => void;
  /** Première réponse depuis la fiche (doit rejeter en cas d'échec : le brouillon reste affiché) */
  onAnswer: DoseAnswer;
  isToday: boolean;
}) {
  const t = useTheme();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sum = doseDay(rows);
  const open = (k: string) => { haptic('selection'); setOpenKey(k); setVisible(true); };
  const sel = rows.find((r) => r.key === openKey) ?? null;
  const dayTitle = formatDate(`${selected}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });
  const anyPlanned = days.some((d) => d.rows.length);
  return (
    <View style={{ gap: spacing.sm }} testID="ht-dose">
      <HeroEntry testID="ht-dose-hero" icon="plus-square" label={isToday ? tr('ht.dose.heroToday') : tr('ht.dose.heroDay', { day: dayTitle })}
        value={sum.planned ? (sum.answered != null ? tr('ht.dose.ratio', { taken: sum.taken, planned: sum.planned }) : tr('ht.none')) : '—'}
        sub={sum.planned ? (sum.answered != null ? tr('ht.dose.split', { taken: sum.taken, skipped: sum.skipped, open: sum.open }) : tr('ht.dose.plannedOnly', { count: sum.planned })) : tr('ht.dose.nonePlanned')}
        a11y={sum.planned ? `${tr('ht.dose.heroToday')}. ${sum.answered != null ? tr('ht.dose.ratio', { taken: sum.taken, planned: sum.planned }) : tr('ht.none')}` : tr('ht.dose.nonePlanned')} />
      {anyPlanned ? (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="ht-dose-week">
          <Text variant="label" accessibilityRole="header">{tr('ht.dose.weekTitle')}</Text>
          <DayBars testID="ht-dose-bars" days={days.map((d) => { const s = doseDay(d.rows); return { day: d.day, value: s.answered != null ? s.taken : null }; })}
            selected={selected} minMax={2} onSelect={onSelectDay}
            describe={(d) => { const s = doseDay(days.find((x) => x.day === d.day)?.rows ?? []); return s.planned ? (s.answered != null ? tr('ht.dose.ratio', { taken: s.taken, planned: s.planned }) : tr('ht.none')) : tr('ht.dose.nonePlanned'); }} />
          <Text variant="caption" muted>{tr('ht.dose.barsHint')}</Text>
        </Glass>
      ) : null}
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 2 }} testID="ht-dose-day">
        <Text variant="label" accessibilityRole="header">{dayTitle}</Text>
        {rows.length ? rows.map((r) => {
          const taken = r.log?.status === 'taken';
          const title = `${r.who} · ${r.name}`;
          return (
            <View key={r.key} style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 }}>
              <Text weight="bold" style={[{ width: 56 }, TABULAR]}>{clock(new Date(r.scheduledFor))}</Text>
              <Tappable bare accessibilityRole="checkbox" accessibilityState={{ checked: taken }} aria-checked={taken}
                accessibilityLabel={taken ? tr('med.untick', { title }) : tr('med.tick', { title })} onPress={() => onToggle(r)} hitSlop={8} testID={`med-check-${r.key}`}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: r.log ? 'solid' : 'dashed', borderColor: taken ? t.colors.text : t.colors.textMuted, backgroundColor: taken ? t.colors.text : 'transparent' }}>
                {r.log && !taken ? <Icon name={STATUS_ICON[r.log.status]} size={16} color={t.colors.textMuted} /> : <CheckMark checked={taken} size={20} color={t.colors.surface} />}
              </Tappable>
              <Tappable accessibilityRole="button" testID={`ht-dose-row-${r.key}`} onPress={() => open(r.key)}
                accessibilityLabel={`${clock(new Date(r.scheduledFor))}, ${title}, ${r.dose}. ${doseDetail(r)}. ${tr('ht.openToFix')}`}
                style={({ pressed }) => ({ flex: 1, minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, opacity: pressed ? 0.6 : 1 })}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2}>{title}</Text>
                  <Text variant="caption" muted numberOfLines={2}>{r.dose}</Text>
                  <Text variant="caption" weight="bold" style={TABULAR} testID={`ht-dose-status-${r.key}`}>{doseDetail(r)}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
              </Tappable>
            </View>
          );
        }) : (
          <View testID="ht-dose-day-none" style={{ minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing.sm }}>
            <Text variant="small" muted center>{tr('ht.dose.nonePlanned')}</Text>
          </View>
        )}
      </Glass>
      <DoseTray row={sel} open={visible && !!sel} onOpenChange={setVisible} onAnswer={onAnswer} />
    </View>
  );
}

function DoseTray({ row, open, onOpenChange, onAnswer }: { row: DoseRow | null; open: boolean; onOpenChange: (v: boolean) => void; onAnswer: DoseAnswer }) {
  if (!row) return null;
  const planned = new Date(row.scheduledFor);
  const status = row.log?.status ?? 'todo';
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID="ht-dose-tray" title={`${row.who} · ${row.name}`}
      hero={statusLabel(status)}
      lines={[
        `${tr('ht.dose.plannedAt', { time: clock(planned) })} · ${doseDetail(row)}`,
        tr('ht.dose.doseLine', { dose: row.dose }),
        formatDate(planned, { weekday: 'long', day: 'numeric', month: 'long' }),
        row.log?.note ? tr('ht.note', { note: row.log.note }) : null,
      ]}
      editLabel={row.log ? tr('ht.fix') : tr('ht.dose.answer')}
      editor={<DoseEditView key={`${row.key}:${row.log?.id}:${row.log?.status}:${row.log?.logged_at}`} row={row} onAnswer={onAnswer} />} />
  );
}

type EditStatus = 'taken' | 'skipped';

function DoseEditView({ row, onAnswer }: { row: DoseRow; onAnswer: DoseAnswer }) {
  const t = useTheme();
  const { goBack } = useTray();
  const table = row.childId ? 'treatment_logs' : 'my_treatment_logs';
  const edit = useEditHealthRow(table);
  const g = useGuardedSave();
  const status0: EditStatus = row.log?.status === 'skipped' ? 'skipped' : 'taken';
  const at0 = takenAt(row) ?? (Date.parse(row.scheduledFor) <= Date.now() ? new Date(row.scheduledFor) : new Date());
  const [status, setStatus] = useState<EditStatus>(status0);
  const [time, setTime] = useState(hhmm(at0));
  const at = status === 'taken' ? takenTime(row.scheduledFor, time) : null;
  const statusChanged = !row.log || row.log.status !== status;
  const timeChanged = status === 'taken' && !!at && (!takenAt(row) || at.getTime() !== takenAt(row)!.getTime());
  const changed = statusChanged || timeChanged;
  const valid = status === 'skipped' || !!at;
  const step = (d: number) => { const b = at ?? at0; const n = new Date(b.getTime() + d * MIN); if (n.getTime() <= Date.now()) setTime(hhmm(n)); g.setError(null); };
  const cancel = () => { setStatus(status0); setTime(hhmm(at0)); g.setError(null); goBack(); };
  const save = () => g.run(async () => {
    if (!valid) return tr('ht.edit.invalid');
    if (!row.log) {
      // Première réponse : même chemin que la case à cocher (file hors connexion comprise), avec l'heure choisie
      await onAnswer(row, at ?? undefined, status);
    } else {
      const patch: Record<string, unknown> = { status };
      patch.logged_at = (status === 'taken' && at ? at : new Date()).toISOString();
      const res = await edit(row.log.id, patch, row.log as unknown as Record<string, unknown>);
      if (res === 'changed') return tr('ht.edit.changedMeanwhile');
    }
    haptic('success');
    goBack();
    return 'ok';
  });
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="ht-dose-editor">
      <EditHeader title={row.log ? tr('ht.dose.fixTitle') : tr('ht.dose.answerTitle')} />
      <Text testID="ht-dose-edit-hero" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3}
        style={[HERO, { color: changed ? t.colors.primary : t.colors.text, textAlign: 'center', fontSize: 40, lineHeight: 46 }, TABULAR]}>
        {status === 'taken' ? (at ? tr('ht.dose.takenAt', { time: clock(at) }) : '—') : statusLabel('skipped')}
      </Text>
      <Text variant="small" muted center>{`${row.who} · ${row.name} — ${row.dose}`}</Text>
      {row.log && changed ? <Text variant="small" muted center testID="ht-dose-edit-before">{tr('ht.dose.before', { what: doseDetail(row) })}</Text> : null}
      <GlassSegmentedControl testID="ht-dose-edit-status" label={tr('ht.dose.statusLabel')} value={status} onChange={(v) => { setStatus(v); g.setError(null); }}
        options={(['taken', 'skipped'] as EditStatus[]).map((v) => ({ value: v, label: statusLabel(v), testID: `ht-dose-edit-${v}` }))} />
      {status === 'taken' ? <TimeEditor text={time} onText={(v) => { setTime(v); g.setError(null); }} onStep={step} valid={!!at} testID="ht-dose-edit" /> : null}
      <Text variant="caption" muted>{tr('ht.dose.noDose')}</Text>
      <EditActions onCancel={cancel} onSave={save} canSave={changed && valid} busy={g.busy} error={g.error} testID="ht-dose-edit" />
    </View>
  );
}
