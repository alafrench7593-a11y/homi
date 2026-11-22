/**
 * Humeur sur une échelle 1 → 5 — geste commun à « Mon humeur » (`mood_checkins`, privé) et « Humeur de l'enfant »
 * (`child_wellbeing`) — 22/11/2026 :
 *  · 7 colonnes (une par jour) ; le DERNIER relevé du jour est un point posé à sa hauteur sur l'échelle (forme +
 *    position + libellé, jamais la couleur seule) ; jour sans relevé = pointillés « rien de noté » (jamais 0) ;
 *  · aucune moyenne, aucun score : seulement des comptes réels par niveau ;
 *  · toucher un jour (gardé dans l'adresse `?day=`) liste ses relevés (heure en colonne, pictogramme, libellé, chevron) ;
 *  · toucher un relevé → fiche (Tray) ; « Corriger » : niveau et heure PROVISOIRES, Annuler, Enregistrer verrouillé
 *    contre le double appui, brouillon conservé si l'écriture échoue.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useEditHealthRow, type HealthEditTable } from '@/lib/data/hooks-healthTrack';
import { useNow } from '@/lib/data/hooks-bottle';
import { clock } from '@/lib/domain/sleepPlanner';
import { hhmm, proposedTime } from '@/lib/domain/quickTrack';
import { scaleByDay, scaleCounts } from '@/lib/domain/healthTrack';
import { EditActions, EditHeader, EntryTray, HERO, TimeEditor, useGuardedSave } from '@/features/quickTrack/EntryTray';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { JournalList, TABULAR, type JournalRow } from './TimedJournal';

const MIN = 60_000;
const TRACK_H = 96;

export interface ScaleItem { id: string; at: string; value: number | null; detail?: string | null; note?: string | null; raw: Record<string, unknown> }
export interface ScaleConfig {
  /** Libellés des niveaux 1 → 5 */
  labels: readonly string[];
  icons: readonly IconName[];
  table: Extract<HealthEditTable, 'mood_checkins' | 'child_wellbeing'>;
  timeCol: 'checked_at' | 'at';
  valueCol: 'mood';
  /** Une valeur est obligatoire (bilan d'humeur) ou facultative (journal de l'enfant) */
  required: boolean;
}

export function ScaleWeek({ items, config, title, trayTitle, testID }: { items: readonly ScaleItem[]; config: ScaleConfig; title: string; trayTitle: string; testID: string }) {
  const t = useTheme();
  const now = useNow(60_000);
  const params = useLocalSearchParams<{ day?: string; entry?: string }>();
  const days = useMemo(() => scaleByDay(items, now, 7), [items, now]);
  const counts = scaleCounts(days, config.labels.length);
  const selected = days.find((d) => d.day === params.day) ?? days[days.length - 1];
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!params.entry || !items.some((i) => i.id === params.entry)) return;
    setOpenId(params.entry); setVisible(true); router.setParams({ entry: undefined } as never);
  }, [params.entry, items]);
  const open = (id: string) => { setOpenId(id); setVisible(true); };
  const n = config.labels.length;
  const label = (v: number | null) => (v ? config.labels[v - 1] : tr('ht.scale.noLevel'));
  const rows: JournalRow[] = selected.entries.map((e) => ({
    id: e.id, time: clock(new Date(e.at)), icon: e.value ? config.icons[e.value - 1] : 'edit-3', title: label(e.value), detail: e.detail ?? null,
    hasNote: !!e.note, mark: e.value ? 'filled' : 'outline',
  }));
  const item = items.find((i) => i.id === openId) ?? null;
  const known = counts.reduce((a, b) => a + b, 0);
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID={testID}>
      <Text variant="label" accessibilityRole="header">{title}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {/* Repères de l'échelle : pictogramme du haut et du bas, jamais un nombre */}
        <View style={{ height: TRACK_H, justifyContent: 'space-between', paddingVertical: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name={config.icons[n - 1]} size={14} color={t.colors.textMuted} />
          <Icon name={config.icons[0]} size={14} color={t.colors.textMuted} />
        </View>
        {days.map((d) => {
          const on = d.day === selected.day;
          const y = d.last ? ((n - d.last) / (n - 1)) * (TRACK_H - 22) : 0;
          return (
            <Tappable key={d.day} testID={`${testID}-day-${d.day}`} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={`${formatDate(`${d.day}T12:00:00`, { weekday: 'long', day: 'numeric' })} : ${d.last ? label(d.last) : tr('ht.none')}`}
              onPress={() => { haptic('selection'); router.setParams({ day: d.day } as never); }}
              style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 4, minHeight: MIN_TOUCH, opacity: pressed ? 0.7 : 1 })}>
              <View style={{ height: TRACK_H, width: '100%', alignItems: 'center', borderRadius: 10, borderWidth: on ? 1.5 : 0, borderColor: t.colors.text }}>
                <View style={{ position: 'absolute', top: 11, bottom: 11, width: 1, backgroundColor: t.colors.border }} />
                {d.last ? (
                  <View testID={`${testID}-day-${d.day}-k`} style={{ position: 'absolute', top: y, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.text }}>
                    <Icon name={config.icons[d.last - 1]} size={12} color={t.colors.surface} />
                  </View>
                ) : (
                  <View testID={`${testID}-day-${d.day}-u`} style={{ position: 'absolute', bottom: 4, width: 18, height: 14, borderRadius: 5, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted }} />
                )}
              </View>
              <Text variant="caption" muted={!on} weight={on ? 'bold' : undefined}>{formatDate(`${d.day}T12:00:00`, { weekday: 'narrow' })}</Text>
            </Tappable>
          );
        })}
      </View>
      {known ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID={`${testID}-counts`}>
          {counts.map((c, i) => (c ? (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name={config.icons[i]} size={13} color={t.colors.textMuted} />
              <Text variant="caption" muted style={TABULAR}>{`${config.labels[i]} · ${c}`}</Text>
            </View>
          ) : null))}
        </View>
      ) : <Text variant="caption" muted testID={`${testID}-none7`}>{tr('ht.scale.none7')}</Text>}
      <JournalList testID={`${testID}-list`} title={formatDate(`${selected.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}
        count={selected.entries.length ? tr('ht.scale.count', { count: selected.entries.length }) : null}
        rows={rows} onOpen={open} emptyLabel={tr('ht.noneDay')} openHint={tr('ht.openToFix')} />
      <ScaleTray item={item} config={config} title={trayTitle} open={visible && !!item} onOpenChange={setVisible} />
    </Glass>
  );
}

function ScaleTray({ item, config, title, open, onOpenChange }: { item: ScaleItem | null; config: ScaleConfig; title: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!item) return null;
  const at = new Date(item.at);
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID="ht-scale-tray" title={title}
      hero={item.value ? config.labels[item.value - 1] : tr('ht.scale.noLevel')}
      lines={[
        `${tr('ht.obs.atClock', { time: clock(at) })} · ${formatDate(at, { weekday: 'long', day: 'numeric', month: 'long' })}`,
        item.detail ?? null,
        item.note ? tr('ht.note', { note: item.note }) : null,
      ]}
      editLabel={tr('ht.fix')}
      editor={<ScaleEditView key={`${item.id}:${item.at}:${item.value}`} item={item} config={config} />} />
  );
}

function ScaleEditView({ item, config }: { item: ScaleItem; config: ScaleConfig }) {
  const t = useTheme();
  const { goBack } = useTray();
  const edit = useEditHealthRow(config.table);
  const g = useGuardedSave();
  const at0 = new Date(item.at);
  const [time, setTime] = useState(hhmm(at0));
  const [value, setValue] = useState<number | null>(item.value);
  const at = proposedTime(item.at, time);
  const changed = (!!at && at.getTime() !== at0.getTime()) || value !== item.value;
  const valid = !!at && (!config.required || value != null);
  const step = (d: number) => { const b = at ?? at0; const n = new Date(b.getTime() + d * MIN); if (n.getTime() <= Date.now()) setTime(hhmm(n)); g.setError(null); };
  const cancel = () => { setTime(hhmm(at0)); setValue(item.value); g.setError(null); goBack(); };
  const save = () => g.run(async () => {
    if (!at || !valid) return tr('ht.edit.invalid');
    const patch: Record<string, unknown> = {};
    if (at.getTime() !== at0.getTime()) patch[config.timeCol] = at.toISOString();
    if (value !== item.value) patch[config.valueCol] = value;
    const res = await edit(item.id, patch, item.raw);
    if (res === 'changed') return tr('ht.edit.changedMeanwhile');
    haptic('success');
    goBack();
    return 'ok';
  });
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="ht-scale-editor">
      <EditHeader title={tr('ht.scale.fixTitle')} />
      <Text testID="ht-scale-edit-hero" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3}
        style={[HERO, { color: changed ? t.colors.primary : t.colors.text, textAlign: 'center', fontSize: 40, lineHeight: 46 }]}>{value ? config.labels[value - 1] : tr('ht.scale.noLevel')}</Text>
      <Text weight="bold" center style={TABULAR} testID="ht-scale-edit-proposed">
        {changed && at ? tr('ht.obs.proposed', { time: clock(at) }) : tr('ht.obs.recorded', { what: item.value ? config.labels[item.value - 1] : tr('ht.scale.noLevel'), time: clock(at0) })}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={tr('ht.scale.levelLabel')}>
        {config.labels.map((l, i) => {
          const on = value === i + 1;
          return (
            <Tappable key={l} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={l} testID={`ht-scale-edit-${i + 1}`}
              onPress={() => { haptic('selection'); setValue(on && !config.required ? null : i + 1); g.setError(null); }}
              style={({ pressed }) => ({ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 16, borderWidth: on ? 2 : 1,
                borderColor: on ? t.colors.text : t.colors.border, backgroundColor: on ? t.colors.border : 'transparent', opacity: pressed ? 0.7 : 1 })}>
              <Icon name={config.icons[i]} size={20} color={t.colors.text} />
              <Text variant="caption" center numberOfLines={2} weight={on ? 'bold' : undefined} style={{ fontSize: 11 }}>{l}</Text>
            </Tappable>
          );
        })}
      </View>
      <TimeEditor text={time} onText={(v) => { setTime(v); g.setError(null); }} onStep={step} valid={!!at} testID="ht-scale-edit" />
      <EditActions onCancel={cancel} onSave={save} canSave={changed && valid} busy={g.busy} error={g.error} testID="ht-scale-edit" />
    </View>
  );
}
