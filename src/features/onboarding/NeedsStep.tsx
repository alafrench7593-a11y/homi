/**
 * Temps 3 — Besoins (deux questions utiles, chacune avec sa conséquence visible).
 *  - « Qu'est-ce qui pèse le plus ? » : lignes pleine largeur, deux choix au plus, rang (1, 2) posé en ressort ;
 *    conséquence : les 3 outils que HOMI mettra en avant se recomposent en direct (calcul réel, `recommendTools`).
 *  - « Qui partage le foyer ? » : le cercle du foyer se peuple (vous, l'autre parent, nounou, crèche) et une phrase dit
 *    ce que ce choix change réellement (missions à deux, outils du parent solo, calendrier de garde, accès nounou).
 */
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { ChoiceGroup } from '@/components/controls';
import { Chip, Field, Icon, Text, haptic, type IconName } from '@/components/ui';
import { MattePanel } from '@/features/entry/EntryKit';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { toolLabelKey } from '@/lib/journeys/tools';
import type { FamilySituation } from '@/lib/types';
import { HELPERS, MAX_NEEDS, NEEDS, recommendTools, toggleNeed, type Helper, type Need, type OnboardingAnswers } from '@/lib/onboarding/personalize';
import { ChoiceList, ChoiceRow, StepTitle } from './kit';

export const NEED_ICON: Record<Need, IconName> = { mental_load: 'layers', sleep: 'moon', health: 'activity', appointments: 'calendar', meals: 'shopping-cart', community: 'message-circle' };

export function NeedsStep({ answers, onNeeds }: { answers: OnboardingAnswers; onNeeds: (n: Need[]) => void }) {
  const t = useTheme();
  const m = useMotion();
  const anim = m.level === 'full';
  const tools = answers.needs.length ? recommendTools(answers) : [];
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o2.needs.title')} lead={tr('o2.needs.lead', { max: MAX_NEEDS })} />
      {/* Une liste : le rang (1, 2) se pose en ressort dans le témoin du choix */}
      <ChoiceList label={tr('o2.needs.title')}>
        {NEEDS.map((n) => {
          const rank = answers.needs.indexOf(n) + 1;
          const label = tr(`o2.need.${n}` as TKey);
          return <ChoiceRow key={n} testID={`onb-need-${n}`} icon={NEED_ICON[n]} label={label} selected={!!rank} rank={rank || undefined}
            a11yLabel={rank ? `${label}. ${tr('o2.needs.rankA11y', { n: rank })}` : label} onPress={() => onNeeds(toggleNeed(answers.needs, n))} />;
        })}
      </ChoiceList>
      {/* Conséquence visible : ce que l'accueil mettra en avant (vrais outils, recalculés à chaque choix) */}
      <View testID="onb-needs-effect" accessible accessibilityLiveRegion="polite"
        accessibilityLabel={tools.length ? `${tr('o2.needs.effect')} : ${tools.map((x) => tr(toolLabelKey(x.id))).join(', ')}` : tr('o2.needs.effectNone')}
        style={{ gap: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: t.material.lines.separator }}>
        <Text variant="label">{tools.length ? tr('o2.needs.effect') : tr('o2.needs.effectNone')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {tools.map((x) => (
            <Animated.View key={x.id} entering={anim ? FadeIn.duration(240) : undefined} exiting={anim ? FadeOut.duration(120) : undefined} layout={anim ? LinearTransition.springify().damping(30).stiffness(280) : undefined}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: t.material.lines.iconWell }}>
              <Icon name={x.icon as IconName} size={14} color={t.colors.primary} />
              <Text variant="small" weight="bold">{tr(toolLabelKey(x.id))}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ foyer
type Member = { key: string; label: string; icon?: IconName; initial?: string };

/** Cercle du foyer : chaque personne entre en « pop » (ressort), sort en fondu. */
function HomeCircle({ members }: { members: Member[] }) {
  const t = useTheme();
  const m = useMotion();
  const anim = m.level === 'full';
  return (
    <View accessible accessibilityLabel={members.map((x) => x.label).join(', ')} testID="onb-home-circle"
      style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap', gap: spacing.md, minHeight: 84, paddingVertical: spacing.xs }}>
      {members.map((x, i) => (
        <Animated.View key={x.key} entering={anim ? ZoomIn.springify().damping(19).stiffness(260) : undefined} exiting={anim ? ZoomOut.duration(140) : undefined}
          layout={anim ? LinearTransition.springify().damping(30).stiffness(280) : undefined} style={{ alignItems: 'center', gap: 6, width: 72 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
            backgroundColor: i === 0 ? t.tokens.action.fill : t.material.lines.controlFill, borderWidth: i === 0 ? 0 : 1, borderColor: t.tokens.border.rest }}>
            {x.initial ? <Text variant="heading" color={t.tokens.action.text}>{x.initial}</Text> : <Icon name={x.icon ?? 'user'} size={20} color={i === 0 ? t.tokens.action.text : t.colors.text} />}
          </View>
          <Text variant="caption" weight="bold" center numberOfLines={2}>{x.label}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

export function HouseholdStep({ answers, name, onName, onSharing, onHelpers }: {
  answers: OnboardingAnswers; name: string; onName: (v: string) => void; onSharing: (s: FamilySituation) => void; onHelpers: (h: Helper[]) => void;
}) {
  const t = useTheme();
  const first = name.trim();
  const members: Member[] = [
    { key: 'me', label: first || tr('o2.who.you'), initial: first ? first[0]!.toUpperCase() : undefined, icon: 'user' },
    ...(answers.sharing === 'couple' || answers.sharing === 'coparenting' ? [{ key: 'other', label: tr('o2.who.other'), icon: 'user' as IconName }] : []),
    ...(answers.helpers.includes('nanny') ? [{ key: 'nanny', label: tr('o2.who.nanny'), icon: 'briefcase' as IconName }] : []),
    ...(answers.helpers.includes('daycare') ? [{ key: 'daycare', label: tr('o2.who.daycare'), icon: 'home' as IconName }] : []),
  ];
  const effects: string[] = [
    answers.sharing ? tr(`o2.home.effect.${answers.sharing}` as TKey) : '',
    answers.helpers.includes('nanny') ? tr('o2.home.effect.nanny') : '',
  ].filter(Boolean);
  return (
    <View style={{ gap: spacing.md }}>
      <StepTitle title={tr('o2.home.title')} />
      <HomeCircle members={members} />
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">{tr('o2.home.sharingLabel')}</Text>
        <ChoiceGroup<FamilySituation> label={tr('o2.home.title')} value={answers.sharing} onChange={(v) => { haptic('selection'); onSharing(v); }} testID="onb-sharing"
          options={(['solo', 'couple', 'coparenting'] as const).map((v) => ({ value: v, label: tr(`o2.home.${v}` as TKey), testID: `onb-sharing-${v}` }))} />
        <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('o2.home.helpers')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {HELPERS.map((h) => {
            const on = answers.helpers.includes(h);
            return <Chip key={h} testID={`onb-helper-${h}`} icon={h === 'nanny' ? 'briefcase' : 'home'} label={tr(`o2.home.${h}` as TKey)} selected={on}
              onPress={() => { haptic('selection'); onHelpers(on ? answers.helpers.filter((x) => x !== h) : [...answers.helpers, h]); }} />;
          })}
        </View>
      </View>
      {effects.length ? (
        <View accessibilityLiveRegion="polite" testID="onb-home-effect" style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
          <Icon name="corner-down-right" size={16} color={t.colors.primary} />
          <Text variant="small" style={{ flex: 1 }}>{effects.join(' ')}</Text>
        </View>
      ) : null}
      <MattePanel>
        <Field label={tr('o2.home.nameLabel')} optional value={name} onChangeText={onName} maxLength={40} autoCapitalize="words" testID="onb-name" />
      </MattePanel>
    </View>
  );
}
