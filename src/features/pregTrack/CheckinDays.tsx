/**
 * Post-partum — bilans datés (22/11/2026). Lit les MÊMES points du jour que l'écran « Point du jour »
 * (`postpartum_checkins`, un par jour) :
 *  · quatorze jours : une pastille par jour (pleine = bilan noté, pointillés = « rien de noté », jamais 0) ;
 *    jour choisi gardé dans l'adresse (`?day=`) ;
 *  · le jour choisi : nombre de réponses en grand, puis chaque échelle rapide « 3 sur 5 » avec ses deux repères ;
 *  · fiche (Tray) : « Corriger » (ou « Noter ce jour » pour un jour vide) = valeurs PROVISOIRES des quatre
 *    échelles rapides, Annuler, Enregistrer verrouillé contre le double appui, brouillon conservé si l'écriture échoue.
 * Aucun score, aucune moyenne notée, aucune interprétation ; les questions de sécurité restent dans le Point du jour.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Text } from '@/components/ui';
import { Scale } from '@/features/postpartum';
import { formatDate, t as tr } from '@/i18n';
import { useSaveCheckin } from '@/lib/data/hooks-postpartum';
import { useNow } from '@/lib/data/hooks-bottle';
import { isoDay } from '@/lib/domain/journalTrack';
import { SCALES, type CheckinInput, type PostpartumCheckin } from '@/lib/domain/postpartum';
import { answered, changedFields, checkinsByDay, QUICK_SCALES, type QuickScale } from '@/lib/domain/pregTrack';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { EditActions, EditHeader, EntryTray, HERO, TABULAR, useGuardedSave } from '@/features/quickTrack/EntryTray';

const BLANK: Omit<CheckinInput, 'checkin_date'> = {
  feeling: null, mood: null, fatigue: null, stress: null, sleep_quality: null, supported: null, coping: null,
  rest_need: null, help_need: null, needs: [], need_other: null, comment: null, physical_fatigue: null, pain: null, pain_note: null,
  recovery: null, feeding_note: null, difficulties: null, scar_feeling: null, perineum_feeling: null, bleeding: null, urgent_orientation_shown: false,
};
const scaleOf = (k: QuickScale) => SCALES.find((s) => s.key === k)!;
const dayTitle = (day: string) => formatDate(`${day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });

export function CheckinDays({ list }: { list: PostpartumCheckin[] }) {
  const t = useTheme();
  const now = useNow(60_000);
  const p = useLocalSearchParams<{ day?: string }>();
  const days = useMemo(() => checkinsByDay(list, now, 14), [list, now]);
  const selDay = days.find((d) => d.day === p.day)?.day ?? isoDay(now);
  const sel = days.find((d) => d.day === selDay)!;
  const [visible, setVisible] = useState(false);
  const c = sel.checkin;
  const n = c ? answered(c) : 0;
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="ppc-days">
      <Text variant="label">{tr('pg.c.fortnight')}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="tablist">
        {days.map((d) => {
          const on = d.day === selDay;
          return (
            <Tappable key={d.day} accessibilityRole="tab" accessibilityState={{ selected: on }} testID={`ppc-day-${d.day}`}
              accessibilityLabel={`${dayTitle(d.day)}. ${d.checkin ? tr('pg.c.noted') : tr('pg.none')}`}
              onPress={() => { haptic('selection'); router.setParams({ day: d.day } as never); }}
              style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 4, minHeight: MIN_TOUCH, opacity: pressed ? 0.6 : 1 })}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: d.checkin ? t.colors.text : 'transparent', opacity: d.checkin && !on ? 0.55 : 1,
                borderWidth: d.checkin ? (on ? 2 : 0) : 1.5, borderStyle: d.checkin ? 'solid' : 'dashed', borderColor: d.checkin ? t.colors.primary : t.colors.textMuted }} />
              <Text variant="caption" muted={!on} weight={on ? 'bold' : undefined} style={TABULAR}>{formatDate(`${d.day}T12:00:00`, { day: 'numeric' })}</Text>
            </Tappable>
          );
        })}
      </View>
      <Text variant="label" testID="ppc-day-title">{dayTitle(selDay)}</Text>
      {c ? (
        <View style={{ gap: spacing.xs }} testID="ppc-day-detail">
          <Text maxFontSizeMultiplier={1.3} style={[HERO, { fontSize: 40, lineHeight: 46, color: t.colors.text }, TABULAR]} testID="ppc-answered">{tr('pg.c.answered', { count: n, total: QUICK_SCALES.length })}</Text>
          {QUICK_SCALES.map((k) => {
            const def = scaleOf(k); const v = c[k];
            return (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
                <Text weight="bold" style={[{ width: 72 }, TABULAR]} testID={`ppc-v-${k}`}>{v != null ? tr('pg.c.outOf', { v }) : '—'}</Text>
                <View style={{ flex: 1 }}>
                  <Text>{def.label}</Text>
                  <Text variant="caption" muted>{v != null ? tr('pg.c.anchors', { low: def.low, high: def.high }) : tr('pg.c.skipped')}</Text>
                </View>
              </View>
            );
          })}
          {c.comment ? <Text variant="small" muted numberOfLines={2}>{tr('pg.note', { note: c.comment })}</Text> : null}
        </View>
      ) : (
        <View testID="ppc-day-none" style={{ minHeight: 48, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="small" muted>{tr('pg.none')}</Text>
        </View>
      )}
      <GlassButton variant="secondary" icon={c ? 'edit-2' : 'plus'} label={c ? tr('pg.c.open') : tr('pg.c.noteDay')} testID="ppc-open" onPress={() => setVisible(true)} />
      <EntryTray open={visible} onOpenChange={setVisible} testID="ppc-tray" title={tr('pg.c.trayTitle', { day: dayTitle(selDay) })}
        hero={c ? tr('pg.c.answered', { count: n, total: QUICK_SCALES.length }) : tr('pg.none')}
        lines={c ? QUICK_SCALES.map((k) => `${scaleOf(k).label} : ${c[k] != null ? tr('pg.c.outOf', { v: c[k]! }) : '—'}`) : [tr('pg.c.emptyHint')]}
        editLabel={c ? tr('pg.fix') : tr('pg.c.noteDay')}
        editor={<CheckinEdit key={`${selDay}:${c?.id ?? ''}:${QUICK_SCALES.map((k) => c?.[k] ?? '').join(',')}`} day={selDay} c={c} />} />
    </Glass>
  );
}

function CheckinEdit({ day, c }: { day: string; c: PostpartumCheckin | null }) {
  const { goBack } = useTray();
  const save = useSaveCheckin();
  const g = useGuardedSave();
  const orig = useMemo(() => Object.fromEntries(QUICK_SCALES.map((k) => [k, c?.[k] ?? null])) as Record<QuickScale, number | null>, [c]);
  const [draft, setDraft] = useState(orig);
  const diff = changedFields(orig, draft);
  const changed = Object.keys(diff).length > 0;
  const cancel = () => { setDraft(orig); g.setError(null); goBack(); };
  const submit = () => g.run(async () => {
    if (c) {
      const { id: _i, user_id: _u, created_at: _c, updated_at: _up, ...rest } = c;
      await save.mutateAsync({ id: c.id, input: { ...rest, ...draft } });
    } else {
      await save.mutateAsync({ id: null, input: { ...BLANK, ...draft, checkin_date: day } });
    }
    haptic('success'); goBack();
    return 'ok';
  });
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="ppc-editor">
      <EditHeader title={c ? tr('pg.c.fixTitle') : tr('pg.c.newTitle')} />
      <Text weight="bold" center testID="ppc-edit-proposed" accessibilityLiveRegion="polite">
        {changed ? tr('pg.c.proposed', { count: answered(draft), total: QUICK_SCALES.length }) : tr('pg.c.recorded', { count: answered(orig), total: QUICK_SCALES.length })}
      </Text>
      {QUICK_SCALES.map((k) => {
        const def = scaleOf(k);
        return <Scale key={k} label={def.label} value={draft[k]} low={def.low} high={def.high} onChange={(v) => { setDraft((d) => ({ ...d, [k]: v })); g.setError(null); }} />;
      })}
      <EditActions onCancel={cancel} onSave={submit} canSave={changed} busy={g.busy} error={g.error} testID="ppc-edit" />
    </View>
  );
}
