/**
 * Dents de lait — suivi (22/11/2026). Même donnée que le schéma dentaire (`child_milestones`, kind = 'tooth') :
 *  · donnée principale : le nombre de dents NOTÉES (jamais une norme, jamais un « retard »), la dernière date dessous ;
 *    aucune dent : « Aucune dent notée » en pointillé (jamais 0) ;
 *  · liste des dents de la plus récente à la plus ancienne (date en colonne fixe, sans date à la fin) ;
 *  · toucher une dent → sa fiche (Tray, dent gardée dans l'adresse `?tooth=`) : « Corriger » la date et la note.
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui';
import { HmHero, HmRow } from '@/features/homeTrack/kit';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { t as tr } from '@/i18n';
import type { Milestone } from '@/lib/data/hooks-family';
import { teethByDate, teethFacts } from '@/lib/domain/careTrack';
import { spacing } from '@/theme/tokens';
import { longDate, MomentTray, shortDate } from './MomentTray';

export function TeethHero({ teeth }: { teeth: readonly Milestone[] }) {
  const f = teethFacts(teeth);
  return (
    <HmHero testID="ct-teeth-hero" value={f.count ? String(f.count) : null} emptyLabel={tr('ct.teeth.none')}
      unit={f.count ? tr('ct.teeth.unit', { count: f.count }) : null}
      caption={f.last ? tr('ct.teeth.lastOn', { date: longDate(f.last) }) : f.count ? tr('ct.teeth.noDates') : null} />
  );
}

export function TeethList({ teeth, birthDate }: { teeth: readonly Milestone[]; birthDate: string }) {
  const { tooth } = useLocalSearchParams<{ tooth?: string }>();
  const opened = tooth ? teeth.find((m) => m.id === tooth) ?? null : null;
  if (!teeth.length) return null;
  return (
    <View style={{ gap: spacing.xs }} testID="ct-teeth-list">
      <Text variant="label" muted accessibilityRole="header">{tr('ct.teeth.listTitle')}</Text>
      <MotionList>{teethByDate(teeth).map((m) => (
        <MotionItem key={m.id}>
          <HmRow time={m.happened_on ? shortDate(m.happened_on) : null} icon="circle" title={m.title}
            detail={[m.happened_on ? longDate(m.happened_on) : tr('ct.noDate'), m.note].filter(Boolean).join(' · ')}
            testID={`ct-teeth-row-${m.id}`} a11y={`${m.title}. ${m.happened_on ? longDate(m.happened_on) : tr('ct.noDate')}. ${tr('ct.openToFix')}`}
            onPress={() => router.setParams({ tooth: m.id } as never)} />
        </MotionItem>
      ))}</MotionList>
      <MomentTray moment={opened} birthDate={birthDate} testID="ct-teeth-tray" onClose={() => router.setParams({ tooth: undefined } as never)} />
    </View>
  );
}
