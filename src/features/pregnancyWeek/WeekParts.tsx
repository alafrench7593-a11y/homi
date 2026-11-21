/**
 * Semaine de grossesse (HOMI v5 « Lumière corail ») : pièces de l'écran /pregnancy.
 *  - `WeekHero`     : la semaine (SA) EN GRAND, semaines de grossesse et trimestre, illustration 3D du bébé (image
 *                     artistique de la semaine, FIXE : écran lu) sur un halo corail localisé et immobile ;
 *  - `WeekProgress` : barre de progression lisible en trois trimestres, repère « vous êtes ici », jalons
 *                     (trois échographies, terme) avec leur état (passé, en ce moment, dans N semaines) ;
 *  - `WeekFigures`  : taille et poids moyens en deux tuiles sobres (chiffres tabulaires) + comparaison ;
 *  - `WeekPicker`   : explorer une autre semaine (cases rectangulaires aux angles souples, semaine actuelle repérée).
 * Rien ne bouge pendant la lecture : pas de boucle, pas de fond animé (seul l'appui sur une case répond).
 */
import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CoralHalo } from '@/components/CoralHalo';
import { FetusArt } from '@/components/FetusArt';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { ECHO_WINDOWS } from '@/lib/domain/pregnancyCare';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, linesOf, radius, spacing } from '@/theme/tokens';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { formatLength, formatWeight } from '@/lib/domain/fetalWeeks';
import { MotionItem, MotionList } from '@/motion/ListMotion';

/** Semaines d'aménorrhée affichées sur la barre (terme : 41 SA, repère français). */
export const TERM_SA = 41;
/** Bornes des trimestres (SA révolues) : T1 < 15, T2 < 29, T3 ensuite (même découpage que `pregnancyProgress`). */
export const TRIMESTER_BOUNDS = [0, 15, 29, TERM_SA] as const;
export const trimesterOf = (week: number): 1 | 2 | 3 => (week < 15 ? 1 : week < 29 ? 2 : 3);
export const trimesterLabel = (n: 1 | 2 | 3) => tr(`h5.preg.t${n}` as TKey);

export type MilestoneState = 'done' | 'now' | 'later';
export interface Milestone { key: string; label: string; fromSA: number; toSA: number; state: MilestoneState; inWeeks: number }

/** Jalons de la grossesse à partir de la semaine actuelle (logique pure, testée). */
export function milestonesFor(weeksSA: number): Milestone[] {
  const echos = ECHO_WINDOWS.map((w) => ({ key: w.key, label: tr(`care.cal.${w.key}` as TKey), fromSA: w.fromSA[0], toSA: w.toSA[0] }));
  const all = [...echos, { key: 'term', label: tr('h5.preg.term'), fromSA: TERM_SA, toSA: TERM_SA }];
  return all.map((m) => ({ ...m, state: weeksSA > m.toSA ? 'done' : weeksSA >= m.fromSA ? 'now' : 'later', inWeeks: Math.max(0, m.fromSA - weeksSA) }));
}

// ------------------------------------------------------------------ en-tête : la semaine en grand
export function WeekHero({ week, extraDays, art, multiple, chosen }: {
  week: number; extraDays: number; art: { growth: number; hue?: 'rose' | 'lavande' | 'or'; a11y: string; size: number };
  /** Libellé « Des jumeaux » (grossesse multiple seulement : rien pour un seul bébé) */
  multiple?: string;
  /** Une autre semaine que la semaine actuelle est affichée */
  chosen?: boolean;
}) {
  const t = useTheme();
  const tri = trimesterOf(week);
  const halo = Math.round(art.size * 1.35);
  const days = !chosen && extraDays ? tr('h5.preg.daysA11y', { count: extraDays }) : '';
  return (
    <View style={{ alignItems: 'center', gap: spacing.xs }} testID="preg-hero">
      {multiple ? <Text variant="label" color={t.colors.primary}>{multiple}</Text> : null}
      <View accessible accessibilityRole="header" accessibilityLabel={tr('h5.preg.weekA11y', { weeks: week, days })} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }} testID="preg-week">
        <Text style={styles.bigNumber} maxFontSizeMultiplier={1.2}>{week}</Text>
        <View style={{ paddingBottom: 14, gap: 0 }}>
          <Text style={styles.unit} maxFontSizeMultiplier={1.3}>{tr('f5.wksShort')}</Text>
          {!chosen && extraDays ? <Text variant="small" muted style={{ fontVariant: ['tabular-nums'] }}>+ {extraDays} {tr('f5.daysShort')}</Text> : null}
        </View>
      </View>
      <Text center muted>{tr('h5.preg.sgLine', { weeks: Math.max(0, week - 2), trimester: trimesterLabel(tri) })}</Text>
      <View style={{ width: halo, height: halo, alignItems: 'center', justifyContent: 'center', marginVertical: -spacing.md }}>
        <CoralHalo size={halo} still style={{ position: 'absolute' }} testID="preg-halo" />
        <FetusArt week={week} growth={art.growth} size={art.size} hue={art.hue} still accessibilityLabel={art.a11y} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ progression : trimestres et jalons
export function WeekProgress({ weeksSA, progress, daysToDue, dueLabel }: { weeksSA: number; progress: number; daysToDue: number; dueLabel: string }) {
  const t = useTheme();
  const pct = Math.round(progress * 100);
  const tri = trimesterOf(weeksSA);
  const weeksLeft = Math.max(0, Math.ceil(daysToDue / 7));
  const ms = milestonesFor(weeksSA);
  const pos = (sa: number) => `${Math.min(100, Math.max(0, (sa / TERM_SA) * 100))}%` as const;
  const segs = [0, 1, 2].map((i) => ({ from: TRIMESTER_BOUNDS[i], to: TRIMESTER_BOUNDS[i + 1], n: (i + 1) as 1 | 2 | 3 }));
  return (
    <View style={{ gap: spacing.xs }} testID="preg-progress">
      <Text variant="heading" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('h5.preg.progress')}</Text>
      <View style={[styles.surface, { backgroundColor: t.colors.surface, borderColor: t.colors.border, gap: spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text weight="bold" style={{ fontVariant: ['tabular-nums'] }}>{tr('h5.preg.pct', { pct })}</Text>
          <Text variant="small" muted>{daysToDue > 0 ? tr('h5.preg.left', { count: weeksLeft }) : dueLabel}</Text>
        </View>
        {/* barre : trois segments (trimestres), remplis jusqu'à aujourd'hui ; repère rond ; jalons en encoches */}
        <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}
          accessibilityLabel={tr('h5.preg.progressA11y', { week: weeksSA, pct, trimester: trimesterLabel(tri) })} style={{ height: 28, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 3, height: 10 }}>
            {segs.map((s) => {
              const span = s.to - s.from;
              const fill = Math.min(1, Math.max(0, (weeksSA - s.from) / span));
              return (
                <View key={s.n} style={{ flex: span, borderRadius: 5, overflow: 'hidden', backgroundColor: linesOf(t).track }}>
                  <View style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: t.colors.primary }} />
                </View>
              );
            })}
          </View>
          <MotionList>{ms.filter((m) => m.key !== 'term').map((m) => (
            <MotionItem key={m.key}><View key={m.key} pointerEvents="none" style={{ position: 'absolute', left: pos(m.fromSA), top: 2, width: 2, height: 6, marginLeft: -1, borderRadius: 1, backgroundColor: t.colors.textMuted }} /></MotionItem>
          ))}</MotionList>
          <View pointerEvents="none" style={{ position: 'absolute', left: pos(weeksSA), width: 20, height: 20, marginLeft: -10, borderRadius: 10, backgroundColor: t.colors.primary, borderWidth: 3, borderColor: t.colors.surface }} testID="preg-progress-marker" />
        </View>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: -spacing.xs }}>
          {segs.map((s) => (
            <View key={s.n} style={{ flex: s.to - s.from, minWidth: 0 }}>
              <Text variant="caption" weight={s.n === tri ? 'bold' : undefined} color={s.n === tri ? t.colors.primary : t.colors.textMuted} numberOfLines={2}>{trimesterLabel(s.n)}</Text>
            </View>
          ))}
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text variant="label" muted>{tr('h5.preg.milestones')}</Text>
          <MotionList style={{ gap: spacing.xs }}>{ms.map((m) => <MotionItem key={m.key}><MilestoneLine key={m.key} m={m} /></MotionItem>)}</MotionList>
        </View>
      </View>
    </View>
  );
}

function MilestoneLine({ m }: { m: Milestone }) {
  const t = useTheme();
  const icon: IconName = m.state === 'done' ? 'check' : m.key === 'term' ? 'flag' : m.state === 'now' ? 'activity' : 'circle';
  const range = m.key === 'term' ? `${TERM_SA} ${tr('f5.wksShort')}` : tr('h5.preg.range', { from: m.fromSA, to: m.toSA });
  const state = m.state === 'done' ? tr('h5.preg.stateDone') : m.state === 'now' ? tr('h5.preg.stateNow') : tr('h5.preg.inWeeks', { count: m.inWeeks });
  const now = m.state === 'now';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 }} testID={`preg-milestone-${m.key}`}>
      <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: now ? t.colors.primary : linesOf(t).iconWell }}>
        <Icon name={icon} size={14} color={now ? t.colors.primaryText : m.state === 'done' ? t.colors.textMuted : t.colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="small" weight="medium" muted={m.state === 'done'}>{m.label}</Text>
        <Text variant="caption" muted>{range}</Text>
      </View>
      <Text variant="caption" weight={now ? 'bold' : undefined} color={now ? t.colors.primary : t.colors.textMuted} style={{ flexShrink: 0, maxWidth: '40%', textAlign: 'right' }}>{state}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ chiffres de la semaine
/** Chiffre compact d'une tuile (« 33 cm », « 1,2 kg ») ; avant les premières mesures publiées : phrase (« moins de 5 mm »). */
export function figureLength(cm: number | null) {
  if (cm == null) return formatLength(cm);
  return cm < 1 ? tr('h5.preg.mm', { n: Math.round(cm * 10) }) : tr('h5.preg.cm', { n: formatNumber(cm) });
}
export function figureWeight(g: number | null) {
  if (g == null) return formatWeight(g);
  return g < 1000 ? tr('h5.preg.g', { n: g }) : tr('h5.preg.kg', { n: formatNumber(g / 1000, { maximumFractionDigits: 1 }) });
}

export function WeekFigures({ lengthCm, weightG, compare, notes }: { lengthCm: number | null; weightG: number | null; compare: string; notes: string[] }) {
  const t = useTheme();
  const length = figureLength(lengthCm);
  const weight = figureWeight(weightG);
  const tile = (label: string, value: string, id: string) => (
    <View key={id} style={[styles.surface, { flex: 1, minWidth: 130, backgroundColor: t.colors.surface, borderColor: t.colors.border, gap: 2 }]} testID={id} accessible accessibilityLabel={`${label} : ${value}`}>
      <Text variant="caption" muted>{label}</Text>
      <Text weight="bold" style={{ fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="heading" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{tr('h5.preg.figures')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }} testID="fetal-size">
        {tile(tr('h5.preg.length'), length, 'fetal-length')}
        {tile(tr('h5.preg.weight'), weight, 'fetal-weight')}
      </View>
      <View style={[styles.surface, { backgroundColor: t.colors.surface, borderColor: t.colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }]}>
        <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: linesOf(t).iconWell }}>
          <Icon name="feather" size={18} color={t.colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="caption" muted>{tr('h5.preg.like')}</Text>
          <Text weight="bold">{compare}</Text>
        </View>
      </View>
      {notes.map((n, i) => <Text key={i} variant="caption" muted style={{ paddingHorizontal: spacing.xxs }} testID={i === 0 ? 'fetal-source' : undefined}>{n}</Text>)}
    </View>
  );
}

// ------------------------------------------------------------------ explorer une autre semaine
const CELL = 48;
export function WeekPicker({ current, shown, onPick }: { current: number; shown: number; onPick: (w: number) => void }) {
  const t = useTheme();
  const ref = useRef<ScrollView>(null);
  const first = 4;
  useEffect(() => {
    // la semaine affichée est visible d'emblée (pas besoin de faire défiler depuis la 4e semaine)
    const x = Math.max(0, (shown - first - 2) * (CELL + 6));
    const id = setTimeout(() => ref.current?.scrollTo({ x, animated: false }), 0);
    return () => clearTimeout(id);
  }, [shown]);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('h5.preg.explore')}</Text>
      <ScrollView ref={ref} horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }} accessibilityLabel={tr('u2.preg.choose_week')} testID="preg-week-picker">
        {Array.from({ length: 39 }, (_, i) => i + first).map((s) => {
          const on = s === shown;
          const today = s === current;
          return (
            <Tappable key={s} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={tr('u2.preg.week_n', { n: s })} onPress={() => { haptic('selection'); onPick(s); }}
              testID={`preg-week-${s}`} pressScale={0.95}
              style={{ width: CELL, height: CELL + 4, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? t.tokens.action.fill : today ? linesOf(t).iconWell : t.colors.surface,
                borderWidth: on ? 0 : 1, borderColor: today ? t.colors.primary : t.colors.border }}>
              <Text variant="small" weight="bold" color={on ? t.tokens.action.text : today ? t.colors.primary : t.colors.text} style={{ fontVariant: ['tabular-nums'] }}>{s}</Text>
            </Tappable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bigNumber: { fontFamily: fonts.display, fontSize: 96, lineHeight: 100, letterSpacing: -4, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  surface: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md },
});
