/**
 * « Je suis à bout » — suivi des bilans (22/11/2026). Mêmes lignes que le questionnaire (`exhaustion_checkins`,
 * strictement personnelles) :
 *  · donnée principale : le niveau de fatigue RESSENTIE du dernier bilan, tel que l'écran le formule déjà (jamais un
 *    diagnostic, aucun chiffre ni score affiché), sa date dessous ; aucun bilan → « Aucun bilan noté » en pointillé ;
 *  · les bilans passés (date en colonne fixe, niveau ressenti, heure, chevron) ;
 *  · toucher un bilan → sa fiche (Tray, bilan gardé dans l'adresse `?check=`) : les 6 réponses notées, et « Corriger »
 *    une réponse mal touchée — valeurs provisoires, Annuler, Enregistrer verrouillé, brouillon gardé si l'écriture
 *    échoue. Le niveau se relit ensuite avec la même règle que le questionnaire.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass } from '@/components/glass';
import { useTray } from '@/components/reacticx/tray';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { EditActions, EditHeader, EntryTray, useGuardedSave } from '@/features/quickTrack/EntryTray';
import { HmEmpty, HmRow, TABULAR } from '@/features/homeTrack/kit';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import type { ExhaustionCheckin } from '@/lib/data/hooks-mental';
import { answersComplete } from '@/lib/domain/careTrack';
import { EXHAUSTION_QUESTIONS, exhaustionLevel } from '@/lib/domain/mentalLoad';
import { clock } from '@/lib/domain/sleepPlanner';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const levelText = (c: ExhaustionCheckin) => tr(`cm.ex.r.${exhaustionLevel(c.answers).level}` as TKey);
const answerText = (v: number | undefined) => (v == null ? tr('ct.nothing') : tr(`cm.ex.a.${v}` as TKey));
const when = (c: ExhaustionCheckin) => formatDate(c.created_at, { weekday: 'long', day: 'numeric', month: 'long' });

export function ExhaustionTrack({ checks }: { checks: readonly ExhaustionCheckin[] }) {
  const t = useTheme();
  const { check } = useLocalSearchParams<{ check?: string }>();
  const last = checks[0] ?? null;
  const opened = check ? checks.find((c) => c.id === check) ?? null : null;
  return (
    <View style={{ gap: spacing.sm }} testID="ct-ex">
      {last ? (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }} testID="ct-ex-hero">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name="battery" size={16} color={t.colors.textMuted} />
            <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('ct.ex.lastTitle')}</Text>
          </View>
          <Text testID="ct-ex-hero-value" maxFontSizeMultiplier={1.3} accessibilityRole="header"
            style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.6, fontFamily: fonts.display, color: t.colors.text }}>{levelText(last)}</Text>
          <Text weight="bold" style={TABULAR}>{tr('ct.ex.on', { date: when(last), time: clock(new Date(last.created_at)) })}</Text>
          <Text variant="caption" muted>{tr('ct.ex.felt')}</Text>
        </Glass>
      ) : <HmEmpty testID="ct-ex-none" label={tr('ct.ex.none')} />}
      {checks.length ? (
        <View testID="ct-ex-list">
          <Text variant="label" muted accessibilityRole="header">{tr('ct.ex.history')}</Text>
          <MotionList>{checks.map((c) => (
            <MotionItem key={c.id}>
              <HmRow time={formatDate(c.created_at, { day: 'numeric', month: 'short' })} icon="battery" title={levelText(c)} detail={clock(new Date(c.created_at))}
                testID={`ct-ex-row-${c.id}`} a11y={`${when(c)}. ${levelText(c)}. ${tr('ct.openToFix')}`} onPress={() => router.setParams({ check: c.id } as never)} />
            </MotionItem>
          ))}</MotionList>
        </View>
      ) : null}
      {opened ? <CheckTray c={opened} onClose={() => router.setParams({ check: undefined } as never)} /> : null}
    </View>
  );
}

function CheckTray({ c, onClose }: { c: ExhaustionCheckin; onClose: () => void }) {
  return (
    <EntryTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="ct-ex-tray"
      title={when(c)} hero={clock(new Date(c.created_at))}
      lines={[levelText(c), ...EXHAUSTION_QUESTIONS.map((q, i) => `${answerText(c.answers[i])} · ${tr(`cm.ex.q.${q}` as TKey)}`)]}
      editLabel={tr('ct.fix')}
      editor={<CheckEditor key={`${c.id}:${c.answers.join()}`} c={c} onDone={onClose} />} />
  );
}

/**
 * Correction des 6 réponses : valeurs PROVISOIRES, liste qui défile dans la fiche (6 questions ne tiennent pas sur un
 * petit écran), Annuler restitue les réponses notées, Enregistrer verrouillé contre le double appui, brouillon gardé
 * si l'écriture échoue.
 */
function CheckEditor({ c, onDone }: { c: ExhaustionCheckin; onDone: () => void }) {
  const t = useTheme();
  const { goBack } = useTray();
  const edit = useCareEdit('exhaustion_checkins');
  const g = useGuardedSave();
  const [draft, setDraft] = useState<(number | null)[]>(EXHAUSTION_QUESTIONS.map((_, i) => c.answers[i] ?? null));
  const [closing, setClosing] = useState(false);
  const changed = draft.some((v, i) => v !== (c.answers[i] ?? null));
  const complete = answersComplete(draft);
  const cancel = () => { setDraft(EXHAUSTION_QUESTIONS.map((_, i) => c.answers[i] ?? null)); g.setError(null); goBack(); };
  const save = async () => {
    if (closing) return;
    const ok = await g.run(async () => {
      if (!answersComplete(draft)) return tr('ct.ex.incomplete');
      const res = await edit(c.id, { answers: draft }, c as unknown as Record<string, unknown>);
      return res === 'changed' ? tr('ct.changedMeanwhile') : 'ok';
    });
    // La fiche reste un instant (bouton verrouillé) : le second appui d'un double appui ne tombe pas sur l'écran dessous
    if (ok) { setClosing(true); haptic('success'); setTimeout(onDone, 400); }
  };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="ct-ex-tray-edit">
      <EditHeader title={tr('ct.ex.fixTitle')} />
      <Text weight="bold" testID="ct-ex-tray-edit-level" accessibilityLiveRegion="polite">
        {complete ? tr(`cm.ex.r.${exhaustionLevel(draft as number[]).level}` as TKey) : tr('ct.ex.incomplete')}
      </Text>
      <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: spacing.sm }} keyboardShouldPersistTaps="handled">
        {EXHAUSTION_QUESTIONS.map((q, qi) => (
          <View key={q} style={{ gap: 4 }} accessibilityRole="radiogroup" accessibilityLabel={tr(`cm.ex.q.${q}` as TKey)}>
            <Text variant="small" weight="medium">{tr(`cm.ex.q.${q}` as TKey)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[0, 1, 2, 3].map((v) => {
                const on = draft[qi] === v;
                const was = (c.answers[qi] ?? null) === v;
                return (
                  <Tappable key={v} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={answerText(v)} testID={`ct-ex-tray-edit-${q}-${v}`}
                    onPress={() => { haptic('selection'); g.setError(null); setDraft((d) => d.map((x, j) => (j === qi ? v : x))); }}
                    style={({ pressed }) => ({ minHeight: MIN_TOUCH, paddingHorizontal: spacing.sm, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 4,
                      borderWidth: on ? 2 : 1, borderStyle: was && !on ? 'dashed' : 'solid', borderColor: on ? t.colors.text : t.colors.border, backgroundColor: on ? t.colors.text : 'transparent', opacity: pressed ? 0.7 : 1 })}>
                    {on ? <Icon name="check" size={14} color={t.colors.background} /> : null}
                    <Text variant="small" weight={on ? 'bold' : 'medium'} color={on ? t.colors.background : t.colors.text}>{answerText(v)}</Text>
                  </Tappable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      {changed ? <Text variant="caption" muted testID="ct-ex-tray-edit-provisional">{tr('hm.fix.provisional')}</Text> : null}
      <EditActions onCancel={cancel} onSave={() => void save()} canSave={changed && complete && !closing} busy={g.busy || closing} error={g.error} testID="ct-ex-tray-edit" />
    </View>
  );
}
