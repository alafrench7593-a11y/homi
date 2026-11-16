/**
 * Temps 2 — Situation : « Où en êtes-vous ? ». Une question, une liste calme (`ChoiceList`) : pastille d'icône,
 * libellé, précision, case cochée. L'illustration de tête (onboarding.tsx) suit la situation principale choisie
 * (fondu enchaîné). Conséquence visible tout de suite : la ligne « Espaces ouverts » se compose sous la liste.
 * Suivre son cycle : l'objectif se choisit dans un sélecteur (le seul contrôle en verre de l'écran).
 * Un seul suivi du corps à la fois (projet bébé, grossesse, cycle).
 */
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { ChoiceGroup } from '@/components/controls';
import { Text, type IconName } from '@/components/ui';
import { Reveal, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { IDENTITY, radius, spacing } from '@/theme/tokens';
import { formatList, t as tr, type TKey } from '@/i18n';
import { SITUATIONS, toggleSituation, type CycleGoal, type Situation } from '@/lib/onboarding/personalize';
import { ChoiceList, ChoiceRow, StepTitle } from './kit';

export const SITUATION_ICON: Record<Situation, IconName> = { ttc: 'sunrise', pregnant: 'moon', baby: 'sun', kids: 'users', cycle: 'calendar', home: 'home' };
type SpaceKey = 'health' | 'baby' | 'family';
/** Teinte décorative de chaque espace ouvert : les trois tons de l'identité v5 (corail, rose, lilas), jamais un texte. */
const SPACE_HUE: Record<SpaceKey, string> = { health: IDENTITY.lilac, baby: IDENTITY.rose, family: IDENTITY.coral };
export const SITUATION_SPACE: Record<Situation, SpaceKey> = { ttc: 'health', pregnant: 'health', cycle: 'health', baby: 'baby', kids: 'baby', home: 'family' };

export function SituationStep({ situations, cycleGoal, onChange, onGoal }: {
  situations: Situation[]; cycleGoal: CycleGoal; onChange: (s: Situation[]) => void; onGoal: (g: CycleGoal) => void;
}) {
  const t = useTheme();
  const m = useMotion();
  const spaces = [...new Set(situations.map((s) => SITUATION_SPACE[s]))];
  const anim = m.level === 'full';
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o2.sit.title')} lead={tr('e5.onb.sit.lead')} />
      <ChoiceList label={tr('o2.sit.title')} testID="onb-situations">
        {SITUATIONS.map((s) => (
          <ChoiceRow key={s} testID={`onb-sit-${s}`} icon={SITUATION_ICON[s]} label={tr(`o2.sit.${s}` as TKey)} hint={tr(`o2.sit.${s}.hint` as TKey)}
            selected={situations.includes(s)} onPress={() => onChange(toggleSituation(situations, s))} />
        ))}
      </ChoiceList>
      <Reveal visible={situations.includes('cycle')} scrollIntoView testID="onb-cycle-goal" style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('o2.sit.goal')}</Text>
        <ChoiceGroup<CycleGoal> label={tr('o2.sit.goal')} value={cycleGoal} onChange={onGoal}
          options={[{ value: 'cycle', label: tr('o2.sit.goal.cycle'), testID: 'onb-goal-cycle' }, { value: 'avoid', label: tr('o2.sit.goal.avoid'), testID: 'onb-goal-avoid' }]} />
      </Reveal>
      {/* Conséquence visible : les espaces de HOMI que ces réponses ouvrent (statuts, pas des boutons) */}
      <View accessibilityLiveRegion="polite" accessible accessibilityLabel={spaces.length ? tr('o2.sit.opens', { list: formatList(spaces.map((x) => tr(`o2.space.${x}` as TKey))) }) : tr('o2.sit.opensNone')}
        style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 32 }} testID="onb-spaces">
        <Text variant="small" muted>{spaces.length ? tr('o2.sit.opensLabel') : tr('o2.sit.opensNone')}</Text>
        {spaces.map((sp) => (
          <Animated.View key={sp} entering={anim ? FadeIn.duration(220) : undefined} exiting={anim ? FadeOut.duration(140) : undefined} layout={anim ? LinearTransition.springify().damping(30).stiffness(280) : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: t.tokens.border.rest }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SPACE_HUE[sp] }} />
            <Text variant="small" weight="bold">{tr(`o2.space.${sp}` as TKey)}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
