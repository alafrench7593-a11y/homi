/**
 * Point du jour « en 3 taps » : une question à la fois, en grand (je me sens, ma fatigue, mon sommeil).
 * Un tap répond et passe à la suivante ; à la fin, un récapitulatif modifiable. Rien n'est enregistré
 * sans le bouton « Enregistrer » de l'écran ; les questions de sécurité restent juste en dessous.
 */
import React from 'react';
import { View } from 'react-native';
import { GlassSurface } from '@/components/Glass';
import { Button, Icon, Text, haptic } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { SCALES, type CheckinInput } from '@/lib/domain/postpartum';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export const EXPRESS_KEYS = ['feeling', 'fatigue', 'sleep_quality'] as const;
type ExpressKey = (typeof EXPRESS_KEYS)[number];

/** Étape suivante à répondre (index), ou EXPRESS_KEYS.length si tout est répondu. */
export function expressStep(v: Pick<CheckinInput, ExpressKey>): number {
  const i = EXPRESS_KEYS.findIndex((k) => v[k] == null);
  return i === -1 ? EXPRESS_KEYS.length : i;
}

export function PostpartumExpress({ value, onAnswer, testID = 'pp-express' }: {
  value: Pick<CheckinInput, ExpressKey>;
  onAnswer: (k: ExpressKey, n: number | null) => void;
  testID?: string;
}) {
  const t = useTheme();
  const [forced, setForced] = React.useState<number | null>(null);
  const step = forced ?? expressStep(value);
  const done = step >= EXPRESS_KEYS.length;
  const scale = (k: ExpressKey) => SCALES.find((s) => s.key === k)!;
  return (
    <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
      <View style={{ padding: spacing.lg, gap: spacing.md }} testID={testID}>
        {/* progression : trois perles dorées */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {EXPRESS_KEYS.map((k, i) => (
            <Tappable key={k} bare accessibilityRole="button" accessibilityLabel={scale(k).label} onPress={() => setForced(i)} hitSlop={8}>
              <View style={{ width: i === step ? 26 : 10, height: 10, borderRadius: 5, backgroundColor: value[k] != null ? t.colors.gold : i === step ? t.colors.primary : tint(t.colors.gold, 0.3) }} />
            </Tappable>
          ))}
          <Text variant="caption" muted style={{ marginLeft: 'auto' }}>{done ? '3/3' : `${step + 1}/3`}</Text>
        </View>
        {done ? (
          <View style={{ gap: spacing.sm }} testID={`${testID}-done`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="check-circle" color={t.colors.gold} />
              <Text variant="heading">C’est noté, en 3 taps.</Text>
            </View>
            {EXPRESS_KEYS.map((k, i) => (
              <Tappable key={k} bare accessibilityRole="button" accessibilityLabel={`Modifier : ${scale(k).label}`} onPress={() => setForced(i)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text variant="small" muted>{scale(k).label}</Text>
                  <Text variant="small" weight="bold">{value[k]}/5</Text>
                </View>
              </Tappable>
            ))}
            <Text variant="caption" muted>Touchez une ligne pour la changer, puis enregistrez.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading" accessibilityRole="header">{scale(EXPRESS_KEYS[step]).label}</Text>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const k = EXPRESS_KEYS[step];
                const selected = value[k] === n;
                return (
                  <Tappable key={n} accessibilityRole="radio" accessibilityState={{ selected }}
                    accessibilityLabel={`${scale(k).label} : ${n} sur 5${n === 1 ? ` (${scale(k).low})` : n === 5 ? ` (${scale(k).high})` : ''}`}
                    onPress={() => { haptic('selection'); onAnswer(k, n); setForced(null); }}
                    style={{ flex: 1 }} testID={`${testID}-${k}-${n}`}>
                    <View style={{ height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2,
                      borderColor: selected ? t.colors.primary : t.colors.border, backgroundColor: selected ? t.colors.primary : tint(t.colors.gold, t.isDark ? 0.12 : 0.08) }}>
                      <Text weight="bold" style={{ fontSize: 22 }} color={selected ? t.colors.primaryText : t.colors.text}>{n}</Text>
                    </View>
                  </Tappable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" muted>{scale(EXPRESS_KEYS[step]).low}</Text>
              <Text variant="caption" muted>{scale(EXPRESS_KEYS[step]).high}</Text>
            </View>
            {step > 0 ? <Button label="Question précédente" size="sm" variant="ghost" icon="arrow-left" onPress={() => setForced(step - 1)} style={{ alignSelf: 'flex-start' }} /> : null}
          </View>
        )}
      </View>
    </GlassSurface>
  );
}
