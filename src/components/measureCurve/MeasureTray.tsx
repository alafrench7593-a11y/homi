/**
 * Fiche d'une mesure (Tray de Reacticx posé sur le verre HOMI), commune aux trois courbes (22/11/2026).
 *  · vue « mesure » : la valeur en grand AVEC son unité, la date, la note (ou « Aucune note »), les détails d'origine ;
 *  · vue « corriger » : valeur PROVISOIRE en grand, champ + pas −/+, Annuler (restitue la valeur notée), Enregistrer
 *    verrouillé contre le double appui (ref `inflight`) ; en cas d'échec, la saisie reste affichée avec le message.
 * Même gabarit que src/features/napLive/NapSessionTray.tsx. L'écriture passe par `onSave` (le chemin de l'écran).
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Tray, useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Field, haptic, Icon, Text } from '@/components/ui';
import { formatNumber, t as tr } from '@/i18n';
import { nudge, parseMeasure } from '@/lib/domain/measureCurve';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { dayLabel } from './MeasureCurve';

const TABULAR = { fontVariant: ['tabular-nums' as const] };

export interface MeasureItem { id: string; value: number; date: string; note?: string | null; details?: readonly string[] }

export interface MeasureTrayProps {
  item: MeasureItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  unit: string;
  digits: number;
  /** Pas des boutons −/+ (ex. 0,1 kg ; 0,5 cm ; 0,05 °C) */
  step: number;
  min: number;
  max: number;
  /** Écriture réelle (même chemin que le formulaire de l'écran). Doit rejeter en cas d'échec. */
  onSave: (item: MeasureItem, value: number) => Promise<void>;
  onSaved?: (item: MeasureItem, value: number) => void;
  testID?: string;
}

export function MeasureTray({ item, open, onOpenChange, title, unit, digits, step, min, max, onSave, onSaved, testID = 'measure-tray' }: MeasureTrayProps) {
  const t = useTheme();
  // Retour de « corriger » après Enregistrer : un double appui ne doit pas rouvrir la correction pendant la transition
  const backAt = useRef(0);
  if (!item) return null;
  const fmt = (v: number) => formatNumber(v, { maximumFractionDigits: digits });
  const palette = { surface: 'transparent', border: t.colors.border, handle: t.colors.textMuted, text: t.colors.text, mutedText: t.colors.textMuted, backdrop: t.colors.overlay };
  return (
    <Tray open={open} onOpenChange={onOpenChange} defaultView="measure" palette={palette} theme={t.isDark ? 'dark' : 'light'} radius={34}
      motion={{ viewAxis: 'x', viewSlide: 60, viewStartScale: 1 }}>
      <Tray.Content surface={<Glass variant="sheet" radius={34} style={{ flex: 1 }} />}>
        <Tray.View id="measure">
          <View testID={testID} style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="label" muted style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
              <Tray.Close><View accessibilityLabel={tr('ct.tray.close')} testID={`${testID}-close`}><Icon name="x" size={20} color={t.colors.text} /></View></Tray.Close>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }} accessible accessibilityLabel={tr('ct.value', { value: fmt(item.value), unit })}>
              <Text testID={`${testID}-value`} maxFontSizeMultiplier={1.3} style={[{ fontSize: 64, lineHeight: 70, letterSpacing: -2, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{fmt(item.value)}</Text>
              <Text testID={`${testID}-unit`} style={{ fontSize: 24, fontFamily: fonts.bodyBold, color: t.colors.textMuted }}>{unit}</Text>
            </View>
            <Text weight="bold" style={TABULAR} testID={`${testID}-date`}>{tr('ct.tray.on', { date: dayLabel(item.date) })}</Text>
            <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.sm, flexDirection: 'row', gap: spacing.xs }} testID={`${testID}-note`}>
              <Icon name="message-square" size={16} color={item.note ? t.colors.primary : t.colors.textMuted} />
              <Text style={{ flex: 1 }} muted={!item.note} accessibilityLabel={item.note ? tr('ct.tray.noteA11y', { note: item.note }) : undefined}>{item.note || tr('ct.tray.noNote')}</Text>
            </Glass>
            {item.details?.map((d) => <Text key={d} variant="small" muted>{d}</Text>)}
            <View style={{ marginTop: spacing.xs }}>
              <PushEdit label={tr('ct.tray.fix')} testID={`${testID}-fix`} backAt={backAt} />
            </View>
          </View>
        </Tray.View>
        <Tray.View id="edit">
          <EditValueView key={item.id} item={item} unit={unit} digits={digits} step={step} min={min} max={max} onSave={onSave} onSaved={onSaved} testID={testID} onBack={() => { backAt.current = Date.now(); }} />
        </Tray.View>
      </Tray.Content>
    </Tray>
  );
}

function PushEdit({ label, testID, backAt }: { label: string; testID: string; backAt: React.MutableRefObject<number> }) {
  const { setView } = useTray();
  return <GlassButton variant="secondary" full icon="edit-2" label={label} testID={testID} onPress={() => { if (Date.now() - backAt.current > 800) setView('edit'); }} />;
}

const toText = (v: number, digits: number) => formatNumber(v, { maximumFractionDigits: digits, useGrouping: false });

function EditValueView({ item, unit, digits, step, min, max, onSave, onSaved, testID, onBack }: {
  item: MeasureItem; unit: string; digits: number; step: number; min: number; max: number;
  onSave: MeasureTrayProps['onSave']; onSaved?: MeasureTrayProps['onSaved']; testID: string; onBack: () => void;
}) {
  const t = useTheme();
  const { goBack } = useTray();
  const [text, setText] = useState(toText(item.value, digits));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  // Valeur d'origine modifiée (correction enregistrée) : le champ repart d'elle, sans remonter la vue pendant la transition
  useEffect(() => { if (!inflight.current) setText(toText(item.value, digits)); }, [item.value, digits]);
  const value = parseMeasure(text, min, max);
  const changed = value != null && value !== item.value;
  const fmt = (v: number) => formatNumber(v, { maximumFractionDigits: digits });
  const stepText = formatNumber(step, { maximumFractionDigits: 3 });
  const move = (d: number) => { setText(toText(nudge(value ?? item.value, d, digits, min, max), digits)); setError(null); };
  const cancel = () => { setText(toText(item.value, digits)); setError(null); goBack(); };
  const save = async () => {
    if (inflight.current || value == null || !changed) return; // double appui : une seule écriture
    inflight.current = true; setBusy(true); setError(null);
    try {
      await onSave(item, value);
      haptic('success');
      onBack();
      goBack();
      onSaved?.(item, value);
    } catch (e) {
      setError(`${tr('ct.edit.failed')}${e instanceof Error && e.message ? ` (${e.message})` : ''}`);
    } finally { inflight.current = false; setBusy(false); }
  };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID={`${testID}-editor`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Tray.Back><View testID={`${testID}-back`} accessibilityLabel={tr('ct.tray.back')}><Icon name="chevron-left" size={22} color={t.colors.text} /></View></Tray.Back>
        <Text variant="label" style={{ flex: 1 }} accessibilityRole="header">{tr('ct.edit.title')}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
        <Text testID={`${testID}-provisional`} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3}
          style={[{ fontSize: 64, lineHeight: 70, letterSpacing: -2, fontFamily: fonts.display, color: changed ? t.colors.primary : t.colors.text }, TABULAR]}>{value != null ? fmt(value) : '—'}</Text>
        <Text style={{ fontSize: 24, fontFamily: fonts.bodyBold, color: t.colors.textMuted }}>{unit}</Text>
      </View>
      <Text variant="small" muted style={TABULAR} testID={`${testID}-was`}>{tr('ct.edit.was', { value: tr('ct.value', { value: fmt(item.value), unit }) })}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <GlassButton variant="secondary" label={tr('ct.edit.minus', { step: stepText })} accessibilityLabel={tr('ct.edit.minusA11y', { step: stepText, unit })} testID={`${testID}-minus`} onPress={() => move(-step)} />
        <View style={{ flex: 1 }}>
          <Field label={tr('ct.edit.label')} value={text} onChangeText={(v) => { setText(v); setError(null); }} keyboardType="decimal-pad" suffix={unit} maxLength={8} testID={`${testID}-input`}
            error={value == null ? tr('ct.edit.bad', { min: fmt(min), max: fmt(max), unit }) : undefined} />
        </View>
        <GlassButton variant="secondary" label={tr('ct.edit.plus', { step: stepText })} accessibilityLabel={tr('ct.edit.plusA11y', { step: stepText, unit })} testID={`${testID}-plus`} onPress={() => move(step)} />
      </View>
      {error ? <Text variant="small" color={t.colors.danger} testID={`${testID}-error`} accessibilityLiveRegion="assertive">{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('ct.edit.cancel')} testID={`${testID}-cancel`} onPress={cancel} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="primary" full label={tr('ct.edit.save')} testID={`${testID}-save`} disabled={!changed || busy} onPress={save} /></View>
      </View>
    </View>
  );
}
