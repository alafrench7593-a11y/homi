/**
 * Temps 6 — Personnalisation réelle : synthèse CALCULÉE des réponses (`personalize`, testé) présentée comme une fiche
 * éditoriale (pas de cartes répétées) : objectif, priorité, trois outils numérotés (vraies routes de l'application),
 * puis la première action proposée sur une surface calme (v5 : plus de verre hors sélecteur). Les rappels proposés se
 * choisissent ici (aucun n'est activé sans accord) ; les accords (6 bis) suivent.
 */
import React from 'react';
import { View } from 'react-native';
import { Chip, Icon, Text, type IconName } from '@/components/ui';
import { Cascade } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/tokens';
import { t as tr, tMaybe, type TKey } from '@/i18n';
import { toolLabelKey, toolSubKey } from '@/lib/journeys/tools';
import type { ReminderSuggestion } from '@/lib/domain/journeys';
import type { Personalization } from '@/lib/onboarding/personalize';
import { StepTitle } from './kit';
import { NEED_ICON } from './NeedsStep';

export const FIRST_ICON: Record<Personalization['first']['key'], IconName> = {
  bottle: 'coffee', week: 'moon', mission: 'send', period: 'droplet', fertility: 'sunrise', brain_dump: 'edit-3', shopping: 'shopping-cart', appointment: 'calendar', night: 'star',
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: 4, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: t.material.lines.separator }}>
      <Text variant="label">{label}</Text>
      {children}
    </View>
  );
}

export function PlanStep({ plan, reminders, chosen, onToggleReminder }: {
  plan: Personalization; reminders: ReminderSuggestion[]; chosen: string[]; onToggleReminder: (key: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <StepTitle title={tr('o2.plan.title')} lead={tr('o2.plan.lead')} />
      <Cascade index={0}>
        <Fact label={tr('o2.plan.goal')}>
          <Text variant="heading" testID="onb-plan-goal">{tr(`o2.goal.${plan.primary}` as TKey)}</Text>
        </Fact>
      </Cascade>
      <Cascade index={1}>
        <Fact label={tr('o2.plan.need')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name={NEED_ICON[plan.need]} size={18} color={t.colors.primary} />
            <Text weight="bold" testID="onb-plan-need">{tr(`o2.need.${plan.need}` as TKey)}</Text>
          </View>
        </Fact>
      </Cascade>
      <Cascade index={2}>
        <Fact label={tr('o2.plan.tools')}>
          <View style={{ gap: spacing.xs }} testID="onb-plan-tools" accessibilityRole="list">
            {plan.tools.map((x, i) => {
              const sub = tMaybe(toolSubKey(x.id));
              return (
              <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }} accessible accessibilityLabel={[`${i + 1}. ${tr(toolLabelKey(x.id))}`, sub].filter(Boolean).join('. ')}>
                <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: t.colors.primary, width: 34 }}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text weight="bold">{tr(toolLabelKey(x.id))}</Text>
                  {sub ? <Text variant="small" muted>{sub}</Text> : null}
                </View>
                <Icon name={x.icon as IconName} size={18} color={t.colors.textMuted} />
              </View>
              );
            })}
          </View>
        </Fact>
      </Cascade>
      <Cascade index={3}>
        <View testID="onb-plan-first" style={{ borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: t.tokens.border.rest, backgroundColor: t.tokens.surface.opaque }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
              <Icon name={FIRST_ICON[plan.first.key]} size={20} color={t.colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text variant="label">{tr('o2.plan.first')}</Text>
              <Text weight="bold">{tr(`o2.first.${plan.first.key}` as TKey)}</Text>
            </View>
          </View>
        </View>
      </Cascade>
      <Cascade index={4}>
        <View style={{ gap: spacing.xs, paddingTop: spacing.sm }}>
          <Text variant="label">{tr('o2.plan.reminders')}</Text>
          {reminders.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {reminders.map((r) => <Chip key={r.key} testID={`onb-rem-${r.key}`} icon="bell" label={r.label} selected={chosen.includes(r.key)} onPress={() => onToggleReminder(r.key)} />)}
            </View>
          ) : <Text variant="small" muted>{tr('onb.reminders.none')}</Text>}
          <Text variant="caption" muted>{tr('o2.plan.remindersHint')}</Text>
        </View>
      </Cascade>
    </View>
  );
}
