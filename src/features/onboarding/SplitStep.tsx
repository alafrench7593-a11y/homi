/**
 * Temps 4 — « Qui s'en occupe ? » : interaction au geste liée aux missions du foyer (src/features/missions).
 * Une pile de tâches réelles du quotidien ; on glisse la carte du dessus vers « Vous » (gauche) ou vers l'autre parent
 * (droite ; seul·e : « Plus tard »). La carte suit le doigt sur le fil UI (Gesture Handler + Reanimated), s'incline,
 * éclaire la personne visée ; relâchée au-delà du seuil (ou lancée), elle part en ressort vers la personne, dont le
 * compteur se pose en « pop » (haptique légère au moment où la carte est confiée). Sinon elle revient en ressort.
 * Accessibilité : boutons « Pour vous » / « Pour … » sous la pile et actions de la carte (lecteurs d'écran).
 * Réduire les animations : pas de trajet, la carte est confiée immédiatement.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, Extrapolation, FadeIn, FadeInUp, LinearTransition, interpolate, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Button, Icon, Text, haptic, type IconName } from '@/components/ui';
import { springs, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { splitCounts, type Assignee, type OnboardingAnswers, type TaskKey } from '@/lib/onboarding/personalize';
import { StepTitle } from './kit';

export const TASK_ICON: Record<TaskKey, IconName> = {
  appt: 'calendar', night: 'moon', shopping: 'shopping-cart', meals: 'coffee', laundry: 'wind', daycare: 'briefcase', nanny: 'clock', school: 'book', admin: 'file-text', bag: 'shopping-bag',
};
/** Seuil de confiance : un tiers de la largeur, ou un lancer franc. */
const COMMIT_RATIO = 0.3;
const FLING = 800;

export function whoLabel(a: Assignee, name: string): string {
  if (a === 'me') return name.trim() || tr('o2.who.you');
  return a === 'other' ? tr('o2.who.other') : tr('o2.who.later');
}

function Zone({ who, label, count, side, drag, width }: { who: Assignee; label: string; count: number; side: -1 | 1; drag: SharedValue<number>; width: number }) {
  const t = useTheme();
  const m = useMotion();
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!count || m.off) return;
    pop.value = withSequence(withTiming(1.18, { duration: 90 }), withSpring(1, springs.rebondLeger));
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps
  const glow = useAnimatedStyle(() => {
    const k = interpolate(drag.value * side, [0, width * COMMIT_RATIO], [0, 1], Extrapolation.CLAMP);
    return { opacity: k, transform: [{ scale: 0.9 + 0.1 * k }] };
  });
  const disc = useAnimatedStyle(() => {
    const k = interpolate(drag.value * side, [0, width * COMMIT_RATIO], [0, 1], Extrapolation.CLAMP);
    return { transform: [{ scale: (1 + 0.08 * k) * pop.value }] };
  });
  const initial = who === 'me' ? (label.trim()[0] ?? '').toUpperCase() : '';
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${label} : ${tr('o2.split.count', { count })}`} testID={`onb-zone-${who}`}>
      <View style={{ width: 76, height: 76, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: t.tokens.halo.color, opacity: 0 }, glow]} />
        <Animated.View style={[{ width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: who === 'me' ? t.tokens.action.fill : t.material.lines.controlFill, borderWidth: who === 'me' ? 0 : 1, borderColor: t.tokens.border.rest }, disc]}>
          {initial ? <Text variant="heading" color={t.tokens.action.text}>{initial}</Text> : <Icon name={who === 'later' ? 'clock' : 'user'} size={22} color={who === 'me' ? t.tokens.action.text : t.colors.text} />}
        </Animated.View>
        <View style={{ position: 'absolute', right: 0, top: 0, minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.surface.opaque, borderWidth: 1, borderColor: t.tokens.border.rest }}>
          <Text variant="caption" weight="bold" testID={`onb-zone-count-${who}`}>{count}</Text>
        </View>
      </View>
      <Text variant="small" weight="bold" center numberOfLines={2}>{label}</Text>
    </View>
  );
}

/** Carte du dessus : suit le doigt, part vers une personne ou revient. */
function TopCard({ task, index, total, drag, width, height, left, right, onAssign }: {
  task: TaskKey; index: number; total: number; drag: SharedValue<number>; width: number; height: number; left: { who: Assignee; label: string }; right: { who: Assignee; label: string };
  onAssign: (task: TaskKey, who: Assignee) => void;
}) {
  const t = useTheme();
  const m = useMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const enter = useSharedValue(m.off ? 1 : 0);
  // 0 → 1 : la carte rejoint la personne (elle se réduit et s'efface DANS l'avatar, sans sortir de l'écran)
  const gone = useSharedValue(0);
  const level = m.level;
  useEffect(() => {
    drag.value = 0;
    enter.value = m.spring(1, 'doux');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const title = tr(`o2.task.${task}` as TKey);
  const commit = (who: Assignee) => { haptic('light'); onAssign(task, who); };
  const fly = (side: -1 | 1, vx: number) => {
    'worklet';
    const who = side < 0 ? left.who : right.who;
    if (level === 'off') { scheduleOnRN(commit, who); return; }
    const ms = Math.abs(vx) > FLING ? 200 : 260;
    const ease = Easing.bezier(0.23, 1, 0.32, 1);
    drag.value = withTiming(0, { duration: ms });
    // vers le centre de l'avatar visé (quart de la largeur, au-dessus de la pile), ease-out fort ; le lancer raccourcit le trajet
    x.value = withTiming(side * width * 0.25, { duration: ms, easing: ease });
    y.value = withTiming(-(height / 2 + 92), { duration: ms, easing: ease });
    gone.value = withTiming(1, { duration: ms, easing: ease }, (done) => { if (done) scheduleOnRN(commit, who); });
  };
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      // au-delà de 35 % de la largeur, résistance : la carte reste presque entière à l'écran
      const lim = width * 0.35;
      const ax = Math.abs(e.translationX);
      x.value = ax > lim ? Math.sign(e.translationX) * (lim + (ax - lim) * 0.3) : e.translationX;
      y.value = e.translationY * 0.2;
      drag.value = e.translationX;
    })
    .onEnd((e) => {
      const far = Math.abs(x.value) > width * COMMIT_RATIO;
      const flung = Math.abs(e.velocityX) > FLING && Math.sign(e.velocityX) === Math.sign(x.value || e.velocityX);
      if (far || flung) {
        fly(x.value + e.velocityX * 0.05 < 0 ? -1 : 1, e.velocityX);
      } else {
        x.value = withSpring(0, { ...springs.panneau, velocity: e.velocityX });
        y.value = withSpring(0, springs.panneau);
        drag.value = withSpring(0, springs.panneau);
      }
    });
  const card = useAnimatedStyle(() => ({
    opacity: enter.value * (1 - gone.value),
    transform: [
      { translateX: x.value },
      { translateY: y.value + (1 - enter.value) * 10 },
      { rotate: `${interpolate(x.value, [-width, width], [-9, 9], Extrapolation.CLAMP)}deg` },
      { scale: (0.96 + 0.04 * enter.value) * (1 - 0.78 * gone.value) },
    ],
  }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View testID={`onb-card-${task}`} collapsable={false}
        accessible accessibilityRole="adjustable" accessibilityLabel={tr('o2.split.cardA11y', { task: title, n: index + 1, total })}
        accessibilityHint={tr('o2.split.cardHint')}
        accessibilityActions={[{ name: 'decrement', label: tr('o2.split.toA11y', { task: title, who: left.label }) }, { name: 'increment', label: tr('o2.split.toA11y', { task: title, who: right.label }) }]}
        onAccessibilityAction={(e) => commit(e.nativeEvent.actionName === 'decrement' ? left.who : right.who)}
        style={[{ position: 'absolute', left: 0, right: 0, top: 0, height, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, justifyContent: 'space-between',
          backgroundColor: t.material.surfaces.matte.fill, borderWidth: 1, borderColor: t.material.surfaces.matte.edge, boxShadow: `0 10px 28px -14px ${t.material.shadowInk}` }, card]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
            <Icon name={TASK_ICON[task]} size={20} color={t.colors.primary} />
          </View>
          <Text variant="caption" muted>{tr('o2.split.position', { n: index + 1, total })}</Text>
        </View>
        <Text variant="heading">{title}</Text>
        {height >= 160 ? <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="chevrons-left" size={18} color={t.colors.textMuted} />
          <Icon name="chevrons-right" size={18} color={t.colors.textMuted} />
        </View> : null}
      </Animated.View>
    </GestureDetector>
  );
}

export function SplitStep({ answers, deck, name, onAssign, onReset }: {
  answers: OnboardingAnswers; deck: TaskKey[]; name: string; onAssign: (task: TaskKey, who: Assignee) => void; onReset: () => void;
}) {
  const t = useTheme();
  const win = useWindowDimensions();
  const [w, setW] = useState(Math.min(win.width - 32, 520));
  const drag = useSharedValue(0);
  const m = useMotion();
  const shared = answers.sharing === 'couple' || answers.sharing === 'coparenting';
  const left = { who: 'me' as Assignee, label: whoLabel('me', name) };
  const right = { who: (shared ? 'other' : 'later') as Assignee, label: whoLabel(shared ? 'other' : 'later', name) };
  const pending = deck.filter((k) => !answers.split[k]);
  const counts = splitCounts(Object.fromEntries(deck.map((k) => [k, answers.split[k]])) as OnboardingAnswers['split']);
  const top = pending[0];
  const next = pending[1];
  const done = !top;
  const cardH = win.height < 640 ? 140 : 172;
  const assigned = deck.filter((k) => answers.split[k]);
  const anim = m.level === 'full';
  return (
    <View style={{ gap: spacing.md }} onLayout={(e) => setW(Math.max(200, e.nativeEvent.layout.width))}>
      <StepTitle title={tr('o2.split.title')} lead={done ? tr('o2.split.done') : tr('o2.split.lead')} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Zone who={left.who} label={left.label} count={counts.me} side={-1} drag={drag} width={w} />
        <Zone who={right.who} label={right.label} count={counts[right.who]} side={1} drag={drag} width={w} />
      </View>
      {!done ? (
        <>
          <View style={{ height: cardH + 18 }} testID="onb-deck">
            {next ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: 14, right: 14, top: 12, height: cardH, borderRadius: radius.lg, backgroundColor: t.material.surfaces.matte.fill, borderWidth: 1, borderColor: t.material.surfaces.matte.edge, opacity: 0.6 }} />
            ) : null}
            <TopCard key={top} task={top} index={deck.indexOf(top)} total={deck.length} drag={drag} width={w} height={cardH} left={left} right={right} onAssign={onAssign} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <AssignButton icon="arrow-left" label={left.label} a11y={tr('o2.split.toA11y', { task: tr(`o2.task.${top}` as TKey), who: left.label })} onPress={() => { haptic('light'); onAssign(top, left.who); }} testID="onb-assign-left" />
            <AssignButton icon="arrow-right" iconRight label={right.label} a11y={tr('o2.split.toA11y', { task: tr(`o2.task.${top}` as TKey), who: right.label })} onPress={() => { haptic('light'); onAssign(top, right.who); }} testID="onb-assign-right" />
          </View>
        </>
      ) : null}
      {/* Registre : chaque tâche confiée s'y inscrit (entrée en fondu + glissement) ; c'est ce que le temps 5 montre */}
      {assigned.length ? (
        <View style={{ gap: 2, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: t.material.lines.separator }} testID={done ? 'onb-split-done' : 'onb-split-ledger'} accessibilityRole="list">
          {assigned.map((k) => (
            <Animated.View key={k} entering={anim ? FadeInUp.duration(240) : undefined} layout={anim ? LinearTransition.duration(220) : undefined}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 }} accessible accessibilityLabel={`${tr(`o2.task.${k}` as TKey)} : ${whoLabel(answers.split[k] ?? 'later', name)}`}>
              <Icon name={TASK_ICON[k]} size={16} color={t.colors.primary} />
              <Text style={{ flex: 1 }}>{tr(`o2.task.${k}` as TKey)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, maxWidth: '45%' }}>
                <Icon name={answers.split[k] === 'me' ? 'arrow-left' : 'arrow-right'} size={14} color={t.colors.textMuted} />
                <Text variant="small" weight="bold" muted numberOfLines={2}>{whoLabel(answers.split[k] ?? 'later', name)}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      ) : null}
      {done ? (
        <Animated.View entering={anim ? FadeIn.duration(240) : undefined} style={{ gap: spacing.sm }}>
          <Text variant="small" muted>{shared ? tr('o2.split.note') : tr('o2.split.noteSolo')}</Text>
          <Button label={tr('o2.split.undo')} variant="ghost" icon="rotate-ccw" onPress={onReset} testID="onb-split-reset" />
        </Animated.View>
      ) : null}
    </View>
  );
}

function AssignButton({ icon, label, a11y, onPress, iconRight, testID }: { icon: IconName; label: string; a11y: string; onPress: () => void; iconRight?: boolean; testID: string }) {
  const t = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress}
      style={({ pressed }) => ({ flex: 1, minHeight: MIN_TOUCH, borderRadius: radius.control, flexDirection: iconRight ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: spacing.sm,
        borderWidth: 1, borderColor: t.tokens.border.rest, backgroundColor: pressed ? t.colors.surfaceAlt : t.material.lines.controlFill })}>
      <Icon name={icon} size={16} color={t.colors.text} />
      <Text variant="small" weight="bold" center style={{ flexShrink: 1 }}>{label}</Text>
    </Pressable>
  );
}
