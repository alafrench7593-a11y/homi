/**
 * « Suivre mon cycle » : une seule catégorie, trois objectifs (suivre, éviter une grossesse, concevoir).
 * Changer d'objectif ARCHIVE l'ancien parcours et en ouvre un nouveau : les règles, symptômes, tests et notes
 * (tables propres à la personne, indépendantes du parcours) sont toujours conservés. Jamais de suppression ici.
 */
import React from 'react';
import { View } from 'react-native';
import { Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, haptic, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useUserId } from '@/lib/auth';
import { useActivePregnancy, useActiveSubject, useJourneyState } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import { useRunJourneyOps } from '@/lib/journeys/manager';
import { planChange } from '@/lib/journeys/model';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export type Objective = 'cycle' | 'avoid' | 'ttc';
export const OBJECTIVES: { key: Objective; icon: 'calendar' | 'shield' | 'sunrise' }[] = [
  { key: 'cycle', icon: 'calendar' }, { key: 'avoid', icon: 'shield' }, { key: 'ttc', icon: 'sunrise' },
];

/** Objectif actuel (parcours « corps » actif), ou null. */
export function useObjective(): Objective | null {
  const js = useJourneyState();
  const t = js.body?.type;
  return t === 'cycle' || t === 'avoid' || t === 'ttc' ? t : null;
}

export function useChangeObjective() {
  const userId = useUserId();
  const js = useJourneyState();
  const pregnancy = useActivePregnancy();
  const { setSubject } = useActiveSubject();
  const { run, busy } = useRunJourneyOps();
  const toast = useToast();
  async function change(target: Objective) {
    if (!userId) return false;
    try {
      const ops = planChange(js.rows, userId, { type: target }, 'archive', todayISO(), pregnancy ? [pregnancy.id] : []);
      if (ops.length) await run(ops);
      setSubject({ type: 'me' });
      haptic('success');
      toast(tr('pj.objective.done', { name: tr(`pj.objective.label.${target}` as TKey) }), 'success');
      return true;
    } catch (e) {
      toast(friendlyError(e), 'error');
      return false;
    }
  }
  return { change, busy };
}

/**
 * Choix de l'objectif. `onPick` (facultatif) remplace le changement direct : utilisé quand une grossesse est en cours,
 * pour passer par la confirmation habituelle (la grossesse n'est jamais fermée sans confirmation).
 */
export function ObjectivePicker({ visible, onClose, onDone, onPick }: { visible: boolean; onClose: () => void; onDone?: (o: Objective) => void; onPick?: (o: Objective) => void }) {
  const t = useTheme();
  const current = useObjective();
  const { change, busy } = useChangeObjective();
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('pj.objective.title')}>
      <View style={{ gap: spacing.xs }}>
        {OBJECTIVES.map((o) => {
          const on = current === o.key;
          return (
            <Tappable key={o.key} testID={`objective-${o.key}`} accessibilityRole="radio" accessibilityState={{ selected: on }} disabled={busy}
              accessibilityLabel={`${tr(`pj.choice.${o.key}` as TKey)}. ${tr(`pj.choice.${o.key}.hint` as TKey)}`}
              onPress={async () => { if (on) { onClose(); return; } if (onPick) { onClose(); onPick(o.key); return; } if (await change(o.key)) { onClose(); onDone?.(o.key); } }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.4, borderColor: on ? t.colors.primary : t.colors.border }}>
              <Icon name={o.icon} color={on ? t.colors.primary : t.colors.text} />
              <View style={{ flex: 1 }}>
                <Text weight="bold">{tr(`pj.choice.${o.key}` as TKey)}</Text>
                <Text variant="small" muted>{tr(`pj.choice.${o.key}.hint` as TKey)}</Text>
              </View>
              {on ? <Icon name="check-circle" color={t.colors.primary} /> : null}
            </Tappable>
          );
        })}
        <Banner tone="info">{tr('pj.objective.keep')}</Banner>
      </View>
    </Sheet>
  );
}

/** Ligne « Mon objectif : … · Changer d'objectif ». */
export function ObjectiveRow() {
  const objective = useObjective();
  const [open, setOpen] = React.useState(false);
  if (!objective) return null;
  return (
    <>
      <View testID="cycle-objective"><Row style={{ justifyContent: 'space-between' }}>
        <Text weight="bold" style={{ flex: 1 }}>{tr('pj.objective', { name: tr(`pj.objective.label.${objective}` as TKey) })}</Text>
        <Button label={tr('pj.objective.change')} size="sm" variant="ghost" icon="refresh-cw" onPress={() => setOpen(true)} testID="objective-change" />
      </Row></View>
      <ObjectivePicker visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
