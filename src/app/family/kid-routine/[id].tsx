/**
 * Mode enfant d'une routine : grands pictogrammes que l'enfant touche quand l'étape est faite. Pas de menu,
 * pas de lien sortant ; pour quitter, un parent fait un appui long sur « Parents ».
 * Les cases du jour sont enregistrées pour le foyer (kid_routine_checks) et repartent à zéro chaque jour.
 */
import React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Button, haptic, Loading, Text } from '@/components/ui';
import { useMemberships } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useKidChecks, useKidRoutines, useToggleKidStep } from '@/lib/data/hooks-tools6';
import { todayISO } from '@/lib/domain/dates';
import { goBack } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function KidRoutineMode() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const day = todayISO();
  const routinesQ = useKidRoutines();
  const membershipsQ = useMemberships(); // foyer pas encore connu : chargement, pas « introuvable »
  const routine = (routinesQ.data ?? []).find((r) => r.id === id);
  const checks = (useKidChecks(day).data ?? []).filter((c) => c.routine_id === id);
  const toggle = useToggleKidStep();
  if (!routine) return routinesQ.isLoading || (membershipsQ.isLoading && !membershipsQ.data) ? <Loading /> : <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}><Text>{tr('kr.notFound')}</Text><Button label={tr('common.back')} icon="arrow-left" variant="secondary" onPress={() => goBack('/family/kid-routines')} /></View>;
  const done = new Set(checks.map((c) => c.step));
  const total = routine.steps.length;
  const all = done.size >= total;
  const cols = width > 700 ? 4 : width > 420 ? 3 : 2;
  const tile = Math.floor((Math.min(width, 900) - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols);

  function tap(i: number) {
    const isDone = done.has(i);
    haptic(isDone ? 'light' : done.size + 1 >= total ? 'success' : 'selection');
    toggle.mutate({ routineId: routine!.id, day, step: i, done: !isDone }, { onError: (e) => toast(friendlyError(e), 'error') });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.colors.background }} testID="kid-mode"
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md, alignSelf: 'center', width: '100%', maxWidth: 900 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('kr.parentsA11y')} accessibilityHint={tr('kr.parentsHint')} delayLongPress={600}
          onPress={() => toast(tr('kr.parentsHint'), 'info')} onLongPress={() => goBack('/family/kid-routines')} testID="kid-exit"
          style={{ minHeight: 44, paddingHorizontal: spacing.sm, justifyContent: 'center', borderRadius: radius.md, borderWidth: 0.5, borderColor: t.colors.border }}>
          <Text variant="small" muted>{tr('kr.parents')}</Text>
        </Tappable>
        <Text weight="bold" style={{ fontSize: 22 }} testID="kid-progress">{done.size} / {total}</Text>
      </View>
      <Text variant="title" center accessibilityRole="header" style={{ fontSize: 30, lineHeight: 36 }}>{routine.title}</Text>
      {all ? (
        <View style={{ alignItems: 'center', gap: 4 }} testID="kid-bravo">
          <View style={{ flexDirection: 'row', gap: 6 }}>{[0, 1, 2].map((k) => <MaterialCommunityIcons key={k} name="star" size={44} color={t.colors.gold} />)}</View>
          <Text weight="bold" style={{ fontSize: 26 }}>{tr('kr.bravo')}</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {routine.steps.map((s, i) => {
          const ok = done.has(i);
          return (
            <Tappable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: ok }} accessibilityLabel={s.label} testID={`kid-step-${i}`} onPress={() => tap(i)}
              style={({ pressed }) => ({ width: tile, minHeight: tile, borderRadius: radius.lg, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: ok ? t.colors.accentSoft : t.colors.surface, borderWidth: ok ? 3 : 1, borderColor: ok ? t.colors.success : t.colors.border, opacity: pressed ? 0.85 : 1 })}>
              <MaterialCommunityIcons name={s.icon as never} size={Math.min(84, tile * 0.5)} color={ok ? t.colors.success : t.colors.primary} />
              <Text weight="bold" center style={{ fontSize: 18, lineHeight: 22 }}>{s.label}</Text>
              {ok ? <MaterialCommunityIcons name="check-circle" size={28} color={t.colors.success} style={{ position: 'absolute', top: 8, right: 8 }} /> : null}
            </Tappable>
          );
        })}
      </View>
    </ScrollView>
  );
}
