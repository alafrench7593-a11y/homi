/**
 * Humeur → journal : pièces visuelles partagées par `/me/mood`, `/me/diary` et `/me/mood/[id]` (refonte v3).
 *  - `MoodOrbs` : sélecteur « Lightly » (orbes de verre givré, UNE lumière qui se déplace vers le choix, choix qui se
 *    rapprochent) + libellé explicite du choix, annoncé aux lecteurs d'écran.
 *  - `Reveal` : la zone de saisie apparaît après le choix (fondu + montée 8 px, 280 ms `decelerate` ; Réduire les
 *    animations : affichée telle quelle). Transform et opacité seulement.
 *  - `EntryRow` : ligne d'historique sur surface MATE, source de la transition carte → détail (`MorphSource`).
 *  - `SaveResult` : confirmation selon le résultat RÉEL (enregistré / gardé hors ligne / erreur).
 *  - `SupportBanner` : relais d'aide (inchangé sur le fond).
 */
import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import { ChoiceGroup, PrimaryButton, SecondaryButton, type ChoiceOption } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { EmergencyList } from '@/components/Family';
import { Banner, Icon, Text } from '@/components/ui';
import { MorphSource } from '@/motion/Morph';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing, typography } from '@/theme/tokens';
import { formatDate, formatTime, t as tr, type TKey } from '@/i18n';
import type { MoodCheckin } from '@/lib/types';
import { entryMorphId, excerpt, FEELING_KEYS, fromMoodKey, MOOD_ICON, MOOD_KEYS, toMoodKey, type Mood, type MoodKey, type SaveOutcome } from './model';

export const moodLabel = (m: number) => tr(`u8.mood.m${m}` as TKey);
export const feelingLabel = (f: string) => (FEELING_KEYS[f] ? tr(`u8.mood.fl.${FEELING_KEYS[f]}` as TKey) : f);
export const capitalize = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** Sélecteur d'humeur + libellé explicite du choix. */
export function MoodOrbs({ value, onChange, label, hint, testIDPrefix }: { value: Mood | null; onChange: (m: Mood) => void; label: string; hint?: string; testIDPrefix: string }) {
  const t = useTheme();
  const options: ChoiceOption<MoodKey>[] = MOOD_KEYS.map((k) => ({ value: k, label: moodLabel(Number(k)), icon: MOOD_ICON[Number(k) as Mood], testID: `${testIDPrefix}-${k}` }));
  return (
    <View style={{ gap: spacing.xs }}>
      {/* rangée un peu plus large que la colonne : à 320 px, les libellés des 5 orbes gardent leurs mots entiers */}
      <View style={{ marginHorizontal: -spacing.sm }}>
        <ChoiceGroup variant="orbs" light="travel" label={label} value={toMoodKey(value)} options={options}
          onChange={(k) => { const m = fromMoodKey(k); if (m) onChange(m); }} testID={`${testIDPrefix}-group`} />
      </View>
      {/* libellé explicite : ce qui est choisi, en toutes lettres (et annoncé) */}
      <View accessibilityLiveRegion="polite" style={{ minHeight: typography.editorialS.lineHeight * 1.4, justifyContent: 'center' }}>
        {value ? (
          <Text testID={`${testIDPrefix}-chosen`} center style={{ fontFamily: fonts.serifItalic, fontSize: typography.editorialS.fontSize, lineHeight: typography.editorialS.lineHeight, color: t.colors.text }}>
            {tr('mj.chosen', { mood: moodLabel(value) })}
          </Text>
        ) : hint ? <Text variant="small" muted center>{hint}</Text> : null}
      </View>
    </View>
  );
}

/** Apparition naturelle de la zone de saisie après le choix. */
export function Reveal({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const m = useMotion();
  const p = useSharedValue(m.off ? 1 : 0);
  useEffect(() => {
    p.value = m.timing(1, 280, 'decelerate');
    return () => cancelAnimation(p);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const a = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * (m.level === 'full' ? 8 : 0) }] }));
  return <Animated.View testID={testID} style={[{ gap: spacing.md }, style, a]}>{children}</Animated.View>;
}

/** Ligne d'historique (surface mate) → détail par transition carte → détail. */
export function EntryRow({ m, onOpen, testID, showExcerpt = true }: { m: MoodCheckin; onOpen: () => void; testID?: string; showExcerpt?: boolean }) {
  const t = useTheme();
  const d = new Date(m.checked_at);
  const sub = [m.feelings.map(feelingLabel).join(', '), showExcerpt ? excerpt(m.journal) : ''].filter(Boolean).join(' — ');
  return (
    <MorphSource id={entryMorphId(m.id)} onOpen={onOpen} radius={radius.lg} testID={testID}
      accessibilityLabel={tr('mj.entryA11y', { date: formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }), mood: moodLabel(m.mood) })}>
      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <View style={{ alignItems: 'center', minWidth: 42 }}>
          <Text style={{ fontFamily: fonts.serifItalic, fontSize: 30, lineHeight: 34, color: t.colors.primary }} maxFontSizeMultiplier={1.3}>{d.getDate()}</Text>
          <Text variant="caption" muted>{formatDate(d, { weekday: 'short' }).replace('.', '')}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={m.safety_concern ? 'life-buoy' : MOOD_ICON[m.mood]} size={15} color={t.colors.lavender} />
            <Text variant="small" weight="bold" style={{ flexShrink: 1 }}>{moodLabel(m.mood)}</Text>
            <Text variant="caption" muted>{formatTime(d)}</Text>
          </View>
          {sub ? <Text variant="small" muted numberOfLines={3} intentionalTruncation>{sub}</Text> : null}
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </MatteSurface>
    </MorphSource>
  );
}

/** Confirmation qui reflète le résultat réel de l'enregistrement. */
export function SaveResult({ outcome, sentTitle, sentBody, onRetry, onNext, nextLabel, testID = 'save-result' }: {
  outcome: SaveOutcome; sentTitle: string; sentBody?: string; onRetry?: () => unknown; onNext?: () => void; nextLabel?: string; testID?: string;
}) {
  const t = useTheme();
  if (outcome.kind === 'error') {
    return (
      <View testID={`${testID}-error`} accessibilityLiveRegion="assertive">
        <MatteSurface padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="alert-circle" size={20} color={t.colors.danger} />
            <Text weight="bold" color={t.colors.danger} style={{ flex: 1 }}>{tr('mj.result.errTitle')}</Text>
          </View>
          <Text variant="small">{outcome.message}</Text>
          {onRetry ? <SecondaryButton label={tr('mj.result.retry')} icon="rotate-ccw" size="sm" onPress={onRetry} style={{ alignSelf: 'flex-start' }} /> : null}
        </MatteSurface>
      </View>
    );
  }
  const queued = outcome.kind === 'queued';
  const color = queued ? t.colors.warning : t.colors.success;
  return (
    <View testID={`${testID}-${outcome.kind}`} accessibilityLiveRegion="polite">
      <MatteSurface padded={spacing.md} contentStyle={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <Icon name={queued ? 'cloud-off' : 'check-circle'} size={20} color={color} />
          <Text weight="bold" style={{ flex: 1 }}>{queued ? tr('mj.result.queuedTitle') : sentTitle}</Text>
        </View>
        <Text variant="small" muted>{tr('mj.result.at', { mood: moodLabel(outcome.mood), time: formatTime(outcome.at) })}</Text>
        <Text variant="small">{queued ? tr('mj.result.queuedBody') : sentBody ?? tr('mj.result.sentBody')}</Text>
        {onNext && nextLabel ? <SecondaryButton label={nextLabel} icon="feather" size="sm" onPress={onNext} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} testID={`${testID}-next`} /> : null}
      </MatteSurface>
    </View>
  );
}

/** Relais d'aide : numéros directs, puis toutes les ressources. */
export function SupportBanner({ urgent, testID }: { urgent: boolean; testID?: string }) {
  return (
    <View testID={testID}>
      <Banner tone={urgent ? 'danger' : 'warning'} title={urgent ? tr('u8.mood.support.urgentTitle') : tr('u8.mood.support.softTitle')}
        action={(
          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            <EmergencyList compact />
            <SecondaryButton label={tr('u8.mood.support.allHelp')} size="sm" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ alignSelf: 'flex-start' }} />
          </View>
        )}>
        <Text variant="small">{urgent ? tr('u8.mood.support.urgent') : tr('u8.mood.support.soft')}</Text>
      </Banner>
    </View>
  );
}

/**
 * Bouton principal d'un composeur : largeur stable (pleine), une seule soumission, visible au-dessus du clavier.
 * TOUJOURS présent (désactivé tant qu'aucune humeur n'est choisie) : il ne disparaît pas sous le doigt après l'envoi,
 * un double appui ne peut donc pas tomber sur la liste dessous ; il ne s'allume qu'avec le choix (un seul point focal).
 */
export function ComposerAction({ label, shortLabel, onPress, testID, icon = 'check', disabled }: { label: string; shortLabel?: string; onPress: () => Promise<unknown>; testID: string; icon?: React.ComponentProps<typeof PrimaryButton>['icon']; disabled?: boolean }) {
  // libellé court (petit écran, texte agrandi) : le bouton reste sur une ligne, le lecteur d'écran lit `label`
  return <PrimaryButton label={label} shortLabel={shortLabel} icon={icon} size="lg" full onPress={onPress} testID={testID} disabled={disabled} />;
}

export const timeLabel = (iso: string) => formatTime(iso);
