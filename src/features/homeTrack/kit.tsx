/**
 * Foyer, couple, école et repas (22/11/2026) — pièces communes des mini-apps de suivi, d'après la direction
 * artistique du client (planches 3–4) :
 *  · `HmHero` : UNE donnée en grand (chiffres de largeur fixe), l'unité / la période juste dessous, puis « reste /
 *    fait » dans un panneau de verre dense ; sans donnée : « Rien de noté » en pointillé, jamais un zéro ;
 *  · `HmWeek` : semaine touchable (jour sélectionné gardé dans l'adresse par `useUrlDay`), un repère par jour —
 *    nombre si quelque chose est noté, anneau pointillé sinon ; la sélection se voit sans couleur (pastille pleine) ;
 *  · `HmRow` : ligne de liste — heure en colonne fixe à gauche, pictogramme, libellé + détail, chevron ;
 *  · `HmFixTray` : fiche d'un élément dans le Tray (gabarit `EntryTray`) avec vue « Corriger » générique : valeurs
 *    PROVISOIRES, Annuler restitue l'original, Enregistrer verrouillé contre le double appui, brouillon gardé si
 *    l'écriture échoue.
 */
import { CheckMark } from '@/motion/CheckMark';
import { whoopEdge } from '@/components/stage/WhoopSheen';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Field, haptic, Icon, Text, type IconName } from '@/components/ui';
import { EditActions, EditHeader, EntryTray, TABULAR, useGuardedSave } from '@/features/quickTrack/EntryTray';
import { formatDate, t as tr } from '@/i18n';
import { hmText, mondayOfDay, parseHm } from '@/lib/domain/homeTrack';
import { dayDate, initialDay, isoDay, parseIsoDay, shiftDay, weekDays } from '@/lib/domain/journalTrack';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export { TABULAR };
const BIG = { fontSize: 52, lineHeight: 58, letterSpacing: -1.4, fontFamily: fonts.display };

// ------------------------------------------------------------------ jour dans l'adresse
/** Jour sélectionné gardé dans l'adresse (« ?day=AAAA-MM-JJ ») : ouvrir une fiche puis revenir retrouve ce jour. */
export function useUrlDay(param = 'day'): [string, (d: string) => void] {
  const qp = useLocalSearchParams<Record<string, string>>();
  const day = initialDay(qp[param], new Date());
  return [day, (d: string) => router.setParams({ [param]: d } as never)];
}

// ------------------------------------------------------------------ donnée principale
export function HmEmpty({ label, testID }: { label?: string; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} accessibilityRole="text" style={{ minHeight: 52, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md }}>
      <Text variant="small" muted center>{label ?? tr('hm.nothing')}</Text>
    </View>
  );
}

export interface HmSplit { label: string; value: string; testID?: string }
export function HmHero({ testID, value, unit, caption, split, emptyLabel, children }: {
  testID: string;
  /** Valeur en grand ; `null` = rien de noté (pointillé, jamais « 0 »). */
  value: string | null;
  unit?: string | null;
  caption?: string | null;
  split?: HmSplit[];
  emptyLabel?: string;
  children?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID={testID}>
      {value == null ? <HmEmpty label={emptyLabel} testID={`${testID}-empty`} /> : (
        <View style={{ alignItems: 'center', gap: 2 }} accessible accessibilityRole="text" accessibilityLabel={[value, unit, caption].filter(Boolean).join(' ')}>
          <Text testID={`${testID}-value`} maxFontSizeMultiplier={1.3} style={[BIG, { color: t.colors.text }, TABULAR]}>{value}</Text>
          {unit ? <Text variant="small" muted center style={TABULAR} testID={`${testID}-unit`}>{unit}</Text> : null}
        </View>
      )}
      {split?.length ? (
        <View style={{ flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, overflow: 'hidden' }}>
          {split.map((s, i) => (
            <View key={s.label} testID={s.testID} accessible accessibilityLabel={`${s.label} : ${s.value}`}
              style={{ flex: 1, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderColor: t.colors.border }}>
              <Text weight="bold" style={TABULAR}>{s.value}</Text>
              <Text variant="caption" muted center>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {caption ? <Text variant="caption" muted center testID={`${testID}-caption`} style={TABULAR}>{caption}</Text> : null}
      {children}
    </Glass>
  );
}

// ------------------------------------------------------------------ semaine touchable
export function HmWeek({ day, onSelect, marks, countLabel, testID = 'hm-week', title }: {
  day: string; onSelect: (d: string) => void;
  /** Par jour : nombre noté, ou `null` (rien de noté) */
  marks: Record<string, number | null>;
  countLabel: (n: number) => string;
  testID?: string;
  title?: string;
}) {
  const t = useTheme();
  const days = weekDays(day);
  const today = isoDay(new Date());
  const pick = (d: string) => { haptic('selection'); onSelect(d); };
  const start = dayDate(days[0]);
  const end = dayDate(days[6]);
  const head = title ?? tr('hm.week.title', { from: formatDate(start, { day: 'numeric', month: start.getMonth() === end.getMonth() ? undefined : 'short' }), to: formatDate(end, { day: 'numeric', month: 'short' }) });
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.sm, gap: spacing.xs }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('hm.week.prev')} testID={`${testID}-prev`} onPress={() => pick(shiftDay(day, -7))}
          style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={t.colors.text} />
        </Tappable>
        <Text weight="bold" center style={[{ flex: 1 }, TABULAR]} accessibilityRole="header" testID={`${testID}-title`}>{head}</Text>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('hm.week.next')} testID={`${testID}-next`} onPress={() => pick(shiftDay(day, 7))}
          style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-right" size={22} color={t.colors.text} />
        </Tappable>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((d) => {
          const on = d === day;
          const n = marks[d] ?? null;
          const date = dayDate(d);
          return (
            <Tappable key={d} accessibilityRole="button" accessibilityState={{ selected: on }} testID={`${testID}-day-${d}`}
              accessibilityLabel={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}. ${n == null ? tr('hm.nothing') : countLabel(n)}`}
              onPress={() => pick(d)} style={{ flex: 1, alignItems: 'center', gap: 3, minHeight: MIN_TOUCH, paddingVertical: 2 }}>
              <Text variant="caption" muted={!on} weight={on ? 'bold' : 'regular'}>{formatDate(date, { weekday: 'short' }).replace('.', '')}</Text>
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.colors.text : 'transparent', ...(on ? whoopEdge(t, t.colors.text) : null), borderWidth: d === today && !on ? 1.5 : 0, borderColor: t.colors.text }}>
                <Text weight="bold" color={on ? t.colors.background : t.colors.text} style={TABULAR}>{date.getDate()}</Text>
              </View>
              {n == null ? <View style={{ width: 16, height: 14, borderRadius: 7, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.border }} />
                : <Text variant="caption" weight="bold" style={[{ minWidth: 16, textAlign: 'center' }, TABULAR]}>{n}</Text>}
            </Tappable>
          );
        })}
      </View>
    </Glass>
  );
}

// ------------------------------------------------------------------ semaine précédente / suivante
export function HmWeekStepper({ monday, onSelect, testID = 'hm-wk' }: { monday: string; onSelect: (monday: string) => void; testID?: string }) {
  const t = useTheme();
  const start = dayDate(monday);
  const end = dayDate(shiftDay(monday, 6));
  const pick = (d: string) => { haptic('selection'); onSelect(d); };
  return (
    <Glass variant="card" radius={radius.pill} contentStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }} testID={testID}>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('hm.week.prev')} testID={`${testID}-prev`} onPress={() => pick(shiftDay(monday, -7))}
        style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-left" size={22} color={t.colors.text} />
      </Tappable>
      <Text weight="bold" center style={[{ flex: 1 }, TABULAR]} accessibilityRole="header" testID={`${testID}-title`}>
        {tr('hm.week.title', { from: formatDate(start, { day: 'numeric', month: start.getMonth() === end.getMonth() ? undefined : 'short' }), to: formatDate(end, { day: 'numeric', month: 'short' }) })}
      </Text>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('hm.week.next')} testID={`${testID}-next`} onPress={() => pick(shiftDay(monday, 7))}
        style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-right" size={22} color={t.colors.text} />
      </Tappable>
    </Glass>
  );
}

/** Lundi de la semaine gardée dans l'adresse (« ?week=AAAA-MM-JJ », ramené au lundi) ; `fallback` sinon. */
export function useUrlWeek(fallback: string, param = 'week'): [string, (monday: string) => void] {
  const qp = useLocalSearchParams<Record<string, string>>();
  const d = parseIsoDay(qp[param]);
  return [d ? mondayOfDay(d) : fallback, (m: string) => router.setParams({ [param]: m } as never)];
}

// ------------------------------------------------------------------ ligne de liste
export function HmRow({ time, icon, title, detail, onPress, testID, a11y, faded, right }: {
  time?: string | null; icon: IconName; title: string; detail?: string | null; onPress?: () => void; testID?: string; a11y?: string; faded?: boolean; right?: React.ReactNode;
}) {
  const t = useTheme();
  const body = (
    <>
      {time !== undefined ? <Text weight="bold" style={[{ minWidth: 62 }, TABULAR]} numberOfLines={1}>{time ?? '—'}</Text> : null}
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
        <Icon name={icon} size={17} color={t.colors.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="medium" style={faded ? { opacity: 0.7 } : undefined}>{title}</Text>
        {detail ? <Text variant="caption" muted style={TABULAR}>{detail}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={16} color={t.colors.textMuted} /> : null)}
    </>
  );
  const style = { flexDirection: 'row' as const, gap: spacing.sm, alignItems: 'center' as const, minHeight: MIN_TOUCH, paddingVertical: 6 };
  return onPress
    ? <Tappable accessibilityRole="button" accessibilityLabel={a11y ?? [time, title, detail].filter(Boolean).join(', ')} testID={testID} onPress={onPress} style={style}>{body}</Tappable>
    : <View testID={testID} style={style} accessible accessibilityLabel={a11y ?? [time, title, detail].filter(Boolean).join(', ')}>{body}</View>;
}

// ------------------------------------------------------------------ fiche de correction
export type HmField =
  | { key: string; label: string; kind: 'text' | 'multiline'; maxLength?: number; hint?: string }
  | { key: string; label: string; kind: 'number'; step: number; unit?: string; hint?: string }
  | { key: string; label: string; kind: 'time'; hint?: string }
  | { key: string; label: string; kind: 'date'; hint?: string }
  | { key: string; label: string; kind: 'toggles'; options: string[] }
  /** Un seul choix parmi des options (valeur : indice) */
  | { key: string; label: string; kind: 'choice'; options: string[] };
export type HmDraft = Record<string, string>;

/** Liste d'indices « 0,2,3 » ↔ ensemble. */
export const togglesOf = (s: string) => (s ? s.split(',').map(Number).filter((n) => Number.isInteger(n)) : []);

export function HmFixTray({ open, onOpenChange, testID, title, hero, heroLabel, lines, fields, initial, validate, onSave, editLabel, editTitle, onFullForm, onDelete, deleteLabel, readOnly }: {
  open: boolean; onOpenChange: (v: boolean) => void; testID: string;
  title: string; hero: string; heroLabel?: string; lines: (string | null | undefined)[];
  fields: HmField[]; initial: HmDraft;
  /** Message d'erreur (le bouton Enregistrer reste verrouillé) ou `null` */
  validate?: (d: HmDraft) => string | null;
  /** 'ok' ou message ; une exception garde aussi le brouillon */
  onSave: (d: HmDraft) => Promise<'ok' | string>;
  editLabel?: string; editTitle?: string;
  onFullForm?: () => void;
  /** Suppression (confirmée par l'appelant) proposée sous la correction */
  onDelete?: () => void;
  deleteLabel?: string;
  /** Lecture seule (membre sans droit d'édition) : la fiche se lit, aucun bouton de correction */
  readOnly?: boolean;
}) {
  // L'éditeur repart des valeurs enregistrées à chaque ouverture
  const [gen, setGen] = useState(0);
  React.useEffect(() => { if (open) setGen((g) => g + 1); }, [open]);
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID={testID} title={title} hero={hero} heroLabel={heroLabel} lines={lines}
      editLabel={editLabel ?? tr('hm.fix.edit')} onFullForm={onFullForm} readOnly={readOnly}
      editor={<HmEditor key={gen} testID={`${testID}-edit`} title={editTitle ?? tr('hm.fix.title', { what: title })} fields={fields} initial={initial} validate={validate}
        onSave={onSave} onDone={() => onOpenChange(false)} onDelete={onDelete ? () => { onOpenChange(false); onDelete(); } : undefined} deleteLabel={deleteLabel} />} />
  );
}

function HmEditor({ testID, title, fields, initial, validate, onSave, onDone, onDelete, deleteLabel }: {
  testID: string; title: string; fields: HmField[]; initial: HmDraft; validate?: (d: HmDraft) => string | null;
  onSave: (d: HmDraft) => Promise<'ok' | string>; onDone: () => void; onDelete?: () => void; deleteLabel?: string;
}) {
  const t = useTheme();
  const { setView } = useTray();
  const [draft, setDraft] = useState<HmDraft>(initial);
  const save = useGuardedSave();
  const dirty = useMemo(() => fields.some((f) => (draft[f.key] ?? '') !== (initial[f.key] ?? '')), [draft, initial, fields]);
  const invalid = validate ? validate(draft) : null;
  const set = (k: string, v: string) => { save.setError(null); setDraft((d) => ({ ...d, [k]: v })); };
  const cancel = () => { setDraft(initial); save.setError(null); setView('entry'); };
  // Après un enregistrement réussi, la fiche reste un instant (bouton verrouillé) : le second appui d'un double appui
  // tombe sur le bouton désactivé, jamais sur l'écran situé dessous
  const [closing, setClosing] = useState(false);
  const submit = async () => {
    if (closing) return;
    if (await save.run(() => onSave(draft))) { setClosing(true); haptic('success'); setTimeout(onDone, 400); }
  };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID={testID}>
      <EditHeader title={title} />
      {fields.map((f) => <FieldEditor key={f.key} f={f} value={draft[f.key] ?? ''} onChange={(v) => set(f.key, v)} testID={`${testID}-${f.key}`} />)}
      {dirty ? <Text variant="caption" muted testID={`${testID}-provisional`}>{tr('hm.fix.provisional')}</Text> : null}
      {invalid && dirty ? <Text variant="small" color={t.colors.danger} testID={`${testID}-invalid`}>{invalid}</Text> : null}
      <EditActions onCancel={cancel} onSave={() => void submit()} canSave={dirty && !invalid && !closing} busy={save.busy || closing} error={save.error} testID={testID} />
      {onDelete ? <GlassButton variant="destructive" icon="trash-2" label={deleteLabel ?? tr('hm.fix.delete')} testID={`${testID}-delete`} onPress={onDelete} /> : null}
    </View>
  );
}

function FieldEditor({ f, value, onChange, testID }: { f: HmField; value: string; onChange: (v: string) => void; testID: string }) {
  const t = useTheme();
  if (f.kind === 'choice') {
    return (
      <View style={{ gap: 4 }} accessibilityRole="radiogroup" accessibilityLabel={f.label}>
        <Text variant="label">{f.label}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {f.options.map((o, i) => {
            const on = value === String(i);
            return (
              <Tappable key={`${i}-${o}`} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={o} testID={`${testID}-${i}`} onPress={() => { haptic('selection'); onChange(String(i)); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: on ? 2 : 1, borderColor: on ? t.colors.text : t.colors.border, backgroundColor: on ? t.colors.text : 'transparent' , ...(on ? whoopEdge(t, t.colors.text) : null)}}>
                <CheckMark checked={on} size={15} color={t.colors.background} />
                <Text weight={on ? 'bold' : 'medium'} color={on ? t.colors.background : t.colors.text}>{o}</Text>
              </Tappable>
            );
          })}
        </View>
      </View>
    );
  }
  if (f.kind === 'toggles') {
    const on = new Set(togglesOf(value));
    const flip = (i: number) => { haptic('selection'); const n = new Set(on); if (n.has(i)) n.delete(i); else n.add(i); onChange([...n].sort((a, b) => a - b).join(',')); };
    return (
      <View style={{ gap: 4 }}>
        <Text variant="label">{f.label}</Text>
        {f.options.map((o, i) => (
          <Tappable key={`${i}-${o}`} accessibilityRole="checkbox" accessibilityState={{ checked: on.has(i) }} accessibilityLabel={o} testID={`${testID}-${i}`} onPress={() => flip(i)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: t.colors.text, backgroundColor: on.has(i) ? t.colors.text : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <CheckMark checked={on.has(i)} size={15} color={t.colors.background} />
            </View>
            <Text style={{ flex: 1 }}>{o}</Text>
          </Tappable>
        ))}
      </View>
    );
  }
  if (f.kind === 'number' || f.kind === 'time') {
    const step = (dir: -1 | 1) => {
      if (f.kind === 'time') { const m = parseHm(value); if (m != null) onChange(hmText((m + dir * 5 + 1440) % 1440)); return; }
      const n = Number(value.replace(',', '.'));
      const base = value.trim() && Number.isFinite(n) ? n : 0;
      onChange(String(Math.max(0, Math.round((base + dir * f.step) * 100) / 100)));
    };
    const minus = f.kind === 'time' ? tr('hm.fix.minus5') : tr('hm.fix.minus', { n: f.step });
    const plus = f.kind === 'time' ? tr('hm.fix.plus5') : tr('hm.fix.plus', { n: f.step });
    return (
      <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <GlassButton variant="secondary" label={minus} testID={`${testID}-minus`} onPress={() => step(-1)} />
        <View style={{ flex: 1 }}>
          <Field label={f.kind === 'number' && f.unit ? `${f.label} (${f.unit})` : f.label} value={value} onChangeText={onChange} keyboardType={f.kind === 'number' ? 'decimal-pad' : 'numbers-and-punctuation'}
            maxLength={f.kind === 'time' ? 5 : 8} testID={testID} style={TABULAR} />
        </View>
        <GlassButton variant="secondary" label={plus} testID={`${testID}-plus`} onPress={() => step(1)} />
      </View>
      {f.hint ? <Text variant="caption" muted>{f.hint}</Text> : null}
      </View>
    );
  }
  if (f.kind === 'date') return <Field label={f.label} value={value} onChangeText={onChange} keyboardType="numbers-and-punctuation" maxLength={10} placeholder={tr('hm.fix.datePh')} hint={f.hint} testID={testID} />;
  return <Field label={f.label} value={value} onChangeText={onChange} multiline={f.kind === 'multiline'} maxLength={f.maxLength ?? 500} hint={f.hint} testID={testID}
    style={f.kind === 'multiline' ? { minHeight: 90, textAlignVertical: 'top' } : undefined} />;
}
