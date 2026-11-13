/**
 * « Ma journée biberons » (v3) : surface MATE (données à lecture rapide), cadran de 24 h + frise dépliable.
 * - biberons notés (perle pleine, quantités réelles, touchés : modification) ;
 * - le suivant (perle de l'accent, mis en avant SANS clignotement : un chronomètre partage l'écran) ;
 * - créneaux oubliés : « Remplir » en un geste (heure et quantité habituelle pré-remplies, à vérifier) ;
 * - créneaux prévus jusqu'au soir (discrets).
 * Les créneaux viennent seulement du délai choisi par le parent ; sans délai, il le choisit ici en un geste.
 * Couleurs : jetons du thème uniquement (palette affichée, statuts).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MatteSurface } from '@/components/surfaces';
import { Chip, Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { DELAY_PRESETS, formatHM } from '@/lib/domain/bottleTimer';
import { slotClock, type DaySlot } from '@/lib/domain/bottleDayPlan';
import { BottleClock } from './bottleClock';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const NODE = 22;

/** Ouvre la saisie d'un biberon pré-remplie (heure du créneau et quantité habituelle), toujours vérifiable avant d'enregistrer. */
export function openSlot(childId: string, slot: DaySlot, timerId?: string | null) {
  const at = Date.parse(slot.at) > Date.now() ? new Date().toISOString() : slot.at;
  router.push({
    pathname: '/track/[kind]',
    params: { kind: 'bottle', child: childId, at, from: 'day', ...(slot.suggestedMl != null ? { planned: String(slot.suggestedMl) } : {}), ...(timerId ? { timer: timerId } : {}) },
  });
}

export function BottleDayTimeline({ childId, slots, intervalMinutes, timerId, onPickInterval, name }: {
  childId: string;
  slots: DaySlot[];
  intervalMinutes: number | null;
  timerId?: string | null;
  /** Le parent choisit son délai (crée le rappel à partir du dernier biberon). */
  onPickInterval: (minutes: number) => void;
  name: string;
}) {
  if (!slots.length) {
    return (
      <MatteSurface radius={radius.lg} padded={spacing.md} testID="bottle-day-empty" contentStyle={{ gap: 6 }}>
        <Text variant="heading">{tr('u7.bottleDay.title')}</Text>
        <Text muted>{tr('u7.bottleDay.emptyBody', { name })}</Text>
      </MatteSurface>
    );
  }
  return <DayCard {...{ childId, slots, intervalMinutes, timerId, onPickInterval }} />;
}

function DayCard({ childId, slots, intervalMinutes, timerId, onPickInterval }: {
  childId: string; slots: DaySlot[]; intervalMinutes: number | null; timerId?: string | null; onPickInterval: (m: number) => void;
}) {
  const t = useTheme();
  const [showList, setShowList] = useState(false);
  const [w, setW] = useState(0);
  const done = slots.filter((s) => s.status === 'done').length;
  const given = t.tokens.accent.accent2;
  const accent = t.colors.primary;
  const line = t.material.lines.track;
  // le cadran suit la largeur disponible (320 px : ≈ 240 px), sans jamais dépasser 300 px
  const dial = w ? Math.min(300, Math.floor(w)) : 0;
  return (
    <MatteSurface radius={radius.lg} padded={spacing.md} testID="bottle-day" contentStyle={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text variant="heading">{tr('u7.bottleDay.title')}</Text>
        <Text variant="caption" muted>{done}/{slots.length}</Text>
      </View>
      {intervalMinutes ? (
        <Text variant="caption" muted>{tr('u7.bottleDay.every', { interval: formatHM(intervalMinutes) })}</Text>
      ) : (
        <View style={{ gap: 6 }} testID="bottle-day-pick">
          <Text variant="small" muted>{tr('u7.bottleDay.pick')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {DELAY_PRESETS.map((p) => <Chip key={p.minutes} icon="clock" label={p.label} onPress={() => onPickInterval(p.minutes)} testID={`bottle-day-interval-${p.minutes}`} />)}
          </View>
        </View>
      )}

      {/* cadran : la journée d'un coup d'œil */}
      <View style={{ marginTop: spacing.xs }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {dial ? <BottleClock childId={childId} slots={slots} timerId={timerId} size={dial} /> : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md }}>
        {[{ k: 'done', c: given, fill: true }, { k: 'next', c: accent, fill: true }, { k: 'planned', c: given, fill: false }].map((x) => (
          <View key={x.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: x.fill ? x.c : 'transparent', borderWidth: x.fill ? 0 : 1.5, borderColor: x.c, alignItems: 'center', justifyContent: 'center' }}>
              {x.k === 'next' ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: t.colors.primaryText }} /> : null}
            </View>
            <Text variant="caption" muted>{tr(x.k === 'done' ? 'u7.bottleDay.given' : x.k === 'next' ? 'u7.bottleDay.next' : 'u7.bottleDay.planned')}</Text>
          </View>
        ))}
      </View>
      <Tappable accessibilityRole="button" accessibilityState={{ expanded: showList }} onPress={() => setShowList((v) => !v)} testID="bottle-day-toggle"
        style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 44 }}>
        <Text variant="caption" weight="bold" color={accent}>{showList ? tr('u7.bottleDay.hide') : tr('u7.bottleDay.show')}</Text>
        <Icon name={showList ? 'chevron-up' : 'chevron-down'} size={14} color={accent} />
      </Tappable>
      {showList ? <View style={{ marginTop: spacing.xs }}>
        {slots.map((s, i) => {
          const last = i === slots.length - 1;
          const isNext = s.status === 'next';
          const color = s.status === 'done' ? given : isNext ? accent : s.status === 'missed' ? t.tokens.status.danger : t.colors.textMuted;
          const ml = s.status === 'done'
            ? [s.bottle?.prepared_ml != null ? tr('u7.bottleDay.prepared', { ml: s.bottle.prepared_ml }) : null, s.bottle?.consumed_ml != null ? tr('u7.bottleDay.drunk', { ml: s.bottle.consumed_ml }) : null].filter(Boolean).join(' · ') || tr('u7.bottleDay.noted')
            : s.suggestedMl != null ? tr('u7.bottleDay.usual', { ml: s.suggestedMl }) : tr('u7.bottleDay.qty');
          const label = s.status === 'done' ? tr('u7.bottleDay.given') : isNext ? tr('u7.bottleDay.next') : s.status === 'missed' ? tr('u7.bottleDay.toFill') : tr('u7.bottleDay.planned');
          return (
            <View key={`${s.at}-${i}`} style={{ flexDirection: 'row', gap: spacing.md }}>
              {/* fil vertical et perles */}
              <View style={{ width: NODE, alignItems: 'center' }}>
                <View style={{ width: NODE, height: NODE, borderRadius: NODE, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: s.status === 'done' ? given : isNext ? accent : 'transparent', borderWidth: s.status === 'done' || isNext ? 0 : 2, borderColor: color, borderStyle: s.status === 'missed' ? 'dashed' : 'solid' }}>
                  {s.status === 'done' ? <Icon name="check" size={13} color={t.colors.background} /> : isNext ? <Icon name="droplet" size={12} color={t.colors.primaryText} /> : null}
                </View>
                {!last ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: line, marginVertical: 2, borderRadius: 1 }} /> : null}
              </View>
              <Tappable
                bare
                accessibilityRole="button"
                accessibilityLabel={tr(s.status === 'done' ? 'u7.bottleDay.a11yDone' : s.status === 'planned' ? 'u7.bottleDay.a11yPlanned' : 'u7.bottleDay.a11yFill', { label, clock: slotClock(s.at), ml })}
                disabled={s.status === 'planned'}
                onPress={() => (s.status === 'done' && s.bottle ? router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, id: s.bottle.id } }) : openSlot(childId, s, timerId))}
                testID={`bottle-slot-${i}`}
                style={{ flex: 1, marginBottom: last ? 0 : spacing.sm, paddingVertical: isNext ? spacing.sm : 2, paddingHorizontal: isNext ? spacing.sm : 0, borderRadius: radius.md,
                  backgroundColor: isNext ? alpha(t.tokens.accent.glow[0], t.isDark ? 0.12 : 0.1) : 'transparent', borderWidth: isNext ? 1 : 0, borderColor: t.tokens.border.active }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <Text weight="bold" style={{ fontSize: isNext ? 20 : 17, fontVariant: ['tabular-nums'], opacity: s.status === 'planned' ? 0.75 : 1 }}>{slotClock(s.at)}</Text>
                      <Text variant="caption" weight="bold" color={s.status === 'planned' ? t.colors.textMuted : s.status === 'done' ? t.colors.text : color}>{label.toUpperCase()}</Text>
                    </View>
                    <Text variant="small" muted>{ml}</Text>
                  </View>
                  {s.status === 'done' ? <Icon name="edit-2" size={15} color={t.colors.textMuted} /> : s.status === 'planned' ? <Icon name="clock" size={15} color={t.colors.textMuted} /> : (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: isNext ? accent : alpha(t.tokens.accent.glow[0], t.isDark ? 0.16 : 0.12) }}>
                      <Text variant="caption" weight="bold" color={isNext ? t.colors.primaryText : t.colors.text}>{isNext ? tr('u7.bottleDay.log') : tr('u7.bottleDay.fill')}</Text>
                    </View>
                  )}
                </View>
              </Tappable>
            </View>
          );
        })}
      </View> : null}
      <Text variant="caption" muted>{tr('u7.bottleDay.footer')}</Text>
    </MatteSurface>
  );
}
