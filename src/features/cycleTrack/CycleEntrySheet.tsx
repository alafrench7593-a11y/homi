/**
 * Fiche d'une saisie du cycle dans le Tray (Reacticx) posé sur le verre — même gabarit que la fiche d'un biberon ou
 * d'une couche (src/features/quickTrack/EntryTray.tsx, réutilisé tel quel) :
 *  · vue « entrée » : la valeur en grand, le jour (et l'heure), les détails notés ; « Corriger » ; « Formulaire complet » ;
 *  · vue « corriger » (`CycleEditor`) : valeurs PROVISOIRES (rien n'est écrit avant Enregistrer), la valeur provisoire
 *    en grand et la valeur notée dessous, Annuler restitue, Enregistrer verrouillé contre le double appui, brouillon
 *    conservé avec le message si l'écriture échoue ; « Supprimer » après confirmation.
 * Champs génériques : jour (±1 j), heure (±5 min), choix, choix multiples, échelle (0–10, 1–5), texte.
 */
import React, { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useTray } from '@/components/reacticx/tray';
import { GlassButton } from '@/components/glass';
import { confirm } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Chip, Field, haptic, Text } from '@/components/ui';
import { EditActions, EditHeader, EntryTray, HERO, TABULAR, TimeEditor, useGuardedSave } from '@/features/quickTrack/EntryTray';
import { t as tr } from '@/i18n';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { dayEditError, draftChanged } from '@/lib/domain/cycleTrack';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export type Draft = Record<string, unknown>;
export interface Option { value: string; label: string }
export type FieldSpec =
  | { key: string; kind: 'day'; label: string; min?: string | null }
  | { key: string; kind: 'time'; label: string }
  | { key: string; kind: 'choice'; label: string; options: Option[]; allowNone?: boolean }
  | { key: string; kind: 'multi'; label: string; options: Option[] }
  | { key: string; kind: 'scale'; label: string; min: number; max: number; low?: string; high?: string; allowNone?: boolean }
  | { key: string; kind: 'text'; label: string; maxLength?: number; multiline?: boolean };

export interface EditorSpec {
  title: string;
  fields: FieldSpec[];
  initial: Draft;
  /** Valeur montrée en grand (provisoire) */
  heroOf: (d: Draft) => string;
  /** Message bloquant (ex. « choisis un résultat ») ou null */
  validate?: (d: Draft) => string | null;
  /** Information affichée sous le brouillon (ex. orientation déjà calculée par l'écran) */
  notice?: (d: Draft) => React.ReactNode;
  /** Écriture réelle (même chemin que le formulaire). 'ok' ou un message lisible. */
  onSave: (d: Draft) => Promise<'ok' | string>;
  onDelete?: () => Promise<'ok' | string>;
  deleteLabel?: string;
}

export function CycleEntrySheet({ open, onOpenChange, testID, title, hero, heroLabel, lines, editLabel, editor, editorKey, onFullForm }: {
  open: boolean; onOpenChange: (v: boolean) => void; testID: string; title: string; hero: string; heroLabel?: string;
  lines: (string | null | undefined)[]; editLabel?: string; editor: EditorSpec;
  /** Clé de montage de la vue de correction : elle repart des valeurs enregistrées à chaque nouvelle version */
  editorKey: string;
  onFullForm?: () => void;
}) {
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID={testID} title={title} hero={hero} heroLabel={heroLabel} lines={lines}
      editLabel={editLabel ?? tr('cy.tk.fix')} onFullForm={onFullForm}
      editor={<CycleEditor key={editorKey} spec={editor} testID={`${testID}-edit`} onClose={() => onOpenChange(false)} />} />
  );
}

function CycleEditor({ spec, testID, onClose }: { spec: EditorSpec; testID: string; onClose: () => void }) {
  const t = useTheme();
  const { goBack } = useTray();
  const { height } = useWindowDimensions();
  const [draft, setDraft] = useState<Draft>(spec.initial);
  const g = useGuardedSave();
  const today = todayISO();
  const set = (k: string, v: unknown) => { setDraft((d) => ({ ...d, [k]: v })); g.setError(null); };
  // Erreurs de saisie (jour, heure) : elles empêchent l'enregistrement, le brouillon reste
  const fieldError = (f: FieldSpec): string | null => {
    if (f.kind === 'day') {
      const e = dayEditError(draft[f.key] as string | null, today, f.min);
      return e ? tr(`cy.tk.edit.day.${e}` as 'cy.tk.edit.day.bad') : null;
    }
    if (f.kind === 'time') return /^([01]?\d|2[0-3])[:h][0-5]\d$/.test(String(draft[f.key] ?? '').trim()) ? null : tr('cy.tk.edit.badTime');
    return null;
  };
  const invalid = spec.fields.some((f) => fieldError(f) != null);
  const blocking = spec.validate?.(draft) ?? null;
  const changed = draftChanged(draft, spec.initial);
  const cancel = () => { setDraft(spec.initial); g.setError(null); goBack(); };
  const save = () => g.run(async () => {
    if (invalid) return tr('cy.tk.edit.invalid');
    if (blocking) return blocking;
    const r = await spec.onSave(draft);
    if (r !== 'ok') return r;
    haptic('success');
    goBack();
    return 'ok';
  });
  const remove = async () => {
    if (!spec.onDelete) return;
    if (!(await confirm(spec.deleteLabel ?? tr('cy.tk.edit.delete'), tr('cy.tk.edit.deleteBody'), tr('cy.tk.edit.delete')))) return;
    const ok = await g.run(async () => spec.onDelete!());
    if (ok) { haptic('success'); onClose(); }
  };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID={testID}>
      <EditHeader title={spec.title} />
      <Text testID={`${testID}-provisional`} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} numberOfLines={2}
        style={[HERO, { fontSize: 40, lineHeight: 46, textAlign: 'center', color: changed ? t.colors.primary : t.colors.text }, TABULAR]}>{spec.heroOf(draft)}</Text>
      <Text variant="small" muted center style={TABULAR} testID={`${testID}-state`}>
        {changed ? tr('cy.tk.edit.provisional', { value: spec.heroOf(spec.initial) }) : tr('cy.tk.edit.recorded')}
      </Text>
      {/* Orientation (urgence, consulter) toujours visible au-dessus des champs */}
      {spec.notice?.(draft)}
      {/* Champs dans une zone qui défile : les actions restent visibles même avec une longue liste (symptômes) */}
      <ScrollView style={{ maxHeight: Math.max(220, height * 0.42) }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.sm }}>
        {spec.fields.map((f) => <FieldView key={f.key} f={f} value={draft[f.key]} onChange={(v) => set(f.key, v)} error={fieldError(f)} testID={`${testID}-${f.key}`} />)}
      </ScrollView>
      {blocking && changed ? <Text variant="small" color={t.colors.danger} testID={`${testID}-blocking`}>{blocking}</Text> : null}
      <EditActions onCancel={cancel} onSave={save} canSave={changed && !invalid && !blocking} busy={g.busy} error={g.error} testID={testID} />
      {spec.onDelete ? <GlassButton variant="tertiary" icon="trash-2" label={spec.deleteLabel ?? tr('cy.tk.edit.delete')} testID={`${testID}-delete`} disabled={g.busy} onPress={() => void remove()} /> : null}
    </View>
  );
}

function FieldView({ f, value, onChange, error, testID }: { f: FieldSpec; value: unknown; onChange: (v: unknown) => void; error: string | null; testID: string }) {
  const t = useTheme();
  if (f.kind === 'day') return <DayField label={f.label} value={(value as string | null) ?? null} onChange={onChange} error={error} testID={testID} />;
  if (f.kind === 'time') {
    const text = String(value ?? '');
    const step = (d: number) => {
      const m = text.trim().replace('h', ':').match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return;
      const total = (((Number(m[1]) * 60 + Number(m[2]) + d) % 1440) + 1440) % 1440;
      onChange(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
    };
    return <TimeEditor text={text} onText={(v) => onChange(v)} onStep={step} valid={!error} testID={testID} />;
  }
  if (f.kind === 'text') {
    return <Field label={f.label} optional value={String(value ?? '')} onChangeText={(v) => onChange(v)} maxLength={f.maxLength ?? 500} multiline={f.multiline} testID={testID}
      style={f.multiline ? { minHeight: 72, textAlignVertical: 'top' } : undefined} />;
  }
  if (f.kind === 'choice' || f.kind === 'multi') {
    const list = f.kind === 'multi' ? ((value as string[] | null) ?? []) : null;
    return (
      <View style={{ gap: 6 }} accessibilityRole={f.kind === 'choice' ? 'radiogroup' : undefined} accessibilityLabel={f.label}>
        <Text variant="label">{f.label}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {f.options.map((o) => {
            const on = list ? list.includes(o.value) : value === o.value;
            return <Chip key={o.value} label={o.label} selected={on} testID={`${testID}-${o.value}`}
              onPress={() => onChange(list ? (on ? list.filter((x) => x !== o.value) : [...list, o.value]) : on && f.kind === 'choice' && f.allowNone ? null : o.value)} />;
          })}
        </View>
      </View>
    );
  }
  // Échelle : − valeur + et une rangée de crans touchables (un cran = une valeur entière)
  const v = typeof value === 'number' ? value : null;
  const clamp = (x: number) => Math.max(f.min, Math.min(f.max, x));
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{f.label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <GlassButton variant="secondary" label="−" accessibilityLabel={tr('cy.tk.edit.less')} testID={`${testID}-minus`} onPress={() => onChange(clamp((v ?? f.min) - 1))} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 3 }} accessibilityRole="adjustable" accessibilityLabel={f.label}
          accessibilityValue={{ min: f.min, max: f.max, now: v ?? undefined, text: v == null ? tr('cy.tk.nothing') : `${v}/${f.max}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => onChange(clamp((v ?? f.min) + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))}>
          {Array.from({ length: f.max - f.min + 1 }, (_, i) => f.min + i).map((n) => (
            <Tappable key={n} testID={`${testID}-${n}`} accessibilityRole="button" accessibilityLabel={`${n}/${f.max}`} accessibilityState={{ selected: v === n }}
              onPress={() => onChange(f.allowNone && v === n ? null : n)}
              style={({ pressed }) => ({ flex: 1, minHeight: MIN_TOUCH - 8, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
                backgroundColor: v != null && n <= v ? t.colors.text : 'transparent', borderWidth: v === n ? 2 : 1, borderColor: v === n ? t.colors.primary : t.colors.border })}>
              <Text variant="caption" weight={v === n ? 'bold' : undefined} color={v != null && n <= v ? t.colors.surface : t.colors.text} style={TABULAR}>{String(n)}</Text>
            </Tappable>
          ))}
        </View>
        <GlassButton variant="secondary" label="+" accessibilityLabel={tr('cy.tk.edit.more')} testID={`${testID}-plus`} onPress={() => onChange(clamp((v ?? f.min - 1) + 1))} />
      </View>
      {f.low || f.high ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" muted>{f.low ?? ''}</Text><Text variant="caption" muted>{f.high ?? ''}</Text>
        </View>
      ) : null}
    </View>
  );
}

function DayField({ label, value, onChange, error, testID }: { label: string; value: string | null; onChange: (v: string | null) => void; error: string | null; testID: string }) {
  const [text, setText] = useState(toFrDate(value));
  // Annuler restitue le jour noté : le champ suit la valeur quand elle change hors de la saisie
  React.useEffect(() => { if (value && frToISO(text) !== value) setText(toFrDate(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (d: number) => { if (!value) return; const n = addDays(value, d); setText(toFrDate(n)); onChange(n); };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
      <GlassButton variant="secondary" label={tr('cy.tk.edit.dayMinus')} accessibilityLabel={tr('cy.tk.edit.dayMinusA11y')} testID={`${testID}-minus`} onPress={() => step(-1)} />
      <View style={{ flex: 1 }}>
        <Field label={label} value={text} onChangeText={(v) => { setText(v); onChange(frToISO(v)); }} keyboardType="numbers-and-punctuation" maxLength={10} testID={testID} error={error ?? undefined} />
      </View>
      <GlassButton variant="secondary" label={tr('cy.tk.edit.dayPlus')} accessibilityLabel={tr('cy.tk.edit.dayPlusA11y')} testID={`${testID}-plus`} onPress={() => step(1)} />
    </View>
  );
}
