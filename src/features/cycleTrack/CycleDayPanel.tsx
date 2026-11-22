/**
 * Panneau commun des journaux du cycle (22/11/2026) — même gabarit pour toutes les apps de suivi de la catégorie :
 *  1. le jour choisi (conservé dans l'adresse : `?date=AAAA-MM-JJ`), sa donnée principale EN GRAND (chiffres de largeur
 *     fixe) et son unité juste dessous ; « Rien de noté » quand le jour est vide — jamais un zéro ;
 *  2. la bande de 7 jours dans un panneau de verre dense (journal ou échelle d'intensité, bulle de valeur) ;
 *  3. les saisies du jour : heure en colonne fixe à gauche (ou « Journée »), pictogramme, libellé + détail, chevron ;
 *     toucher une ligne ouvre sa fiche (Tray) pour la relire et la corriger.
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { addDays, todayISO } from '@/lib/domain/dates';
import { lastDays, parseDayParam, stripEnd, type StripDay } from '@/lib/domain/cycleTrack';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { CycleDayStrip } from './CycleDayStrip';

export const TABULAR = { fontVariant: ['tabular-nums' as const] };
/** Jour dans une phrase (« corriger la douleur du dimanche 22 novembre ») */
export const dayInline = (iso: string) => formatDate(`${iso}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });
export const dayLong = (iso: string) => formatDate(`${iso}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());

/**
 * Jour choisi d'un journal, lu et écrit dans l'adresse (`?date=`) : il survit au retour, à l'ouverture d'Aura ou d'un
 * autre écran, et les formulaires existants (qui lisent déjà `?date=`) se placent sur lui.
 */
export function useCycleDay(param = 'date') {
  const p = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const today = todayISO();
  const day = parseDayParam(p[param], today);
  const setDay = (d: string) => router.setParams({ [param]: d } as never);
  const shift = (delta: number) => { const n = addDays(day, delta); setDay(n > today ? today : n); };
  const days = lastDays(stripEnd(day, today, 7), 7);
  return { day, today, days, setDay, shift, canForward: days[days.length - 1] < today };
}

export interface JournalRow { id: string; time: string | null; icon: IconName; title: string; detail?: string | null; a11y?: string; onPress: () => void }

export function CycleDayPanel({ testID, label, day, loading, hero, unit, heroA11y, strip, mode, max, bubbleOf, describe, onSelect, onShift, canForward, rows, footer }: {
  testID: string;
  /** Ce que mesure le journal (« Douleur la plus forte notée », « Symptômes notés ») */
  label: string;
  day: string;
  /** Lecture en cours : ni « rien de noté », ni liste (on ne sait pas encore) */
  loading?: boolean;
  /** Donnée principale du jour ; null = rien de noté */
  hero: string | null;
  unit?: string | null;
  heroA11y?: string;
  strip: StripDay[];
  mode: 'marks' | 'scale';
  max?: number;
  bubbleOf: (d: StripDay) => string;
  describe: (d: StripDay) => string;
  onSelect: (day: string) => void;
  onShift: (delta: -7 | 7) => void;
  canForward: boolean;
  rows: JournalRow[];
  footer?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.xs }}>
        <Text variant="label" muted accessibilityRole="header">{label}</Text>
        <Text variant="small" weight="medium" testID={`${testID}-day`}>{dayLong(day)}</Text>
        <View accessible accessibilityLabel={heroA11y ?? (hero ? [hero, unit].filter(Boolean).join(' ') : tr('cy.tk.nothing'))} style={{ alignItems: 'center', gap: 2, paddingVertical: spacing.xs }}>
          {loading ? (
            <Text testID={`${testID}-loading`} style={{ fontSize: 30, lineHeight: 38, fontFamily: fonts.display, color: t.colors.textMuted }} accessibilityLabel={tr('cy.tk.loading')}>…</Text>
          ) : hero ? (
            <Text testID={`${testID}-hero`} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit
              style={[{ fontSize: 56, lineHeight: 62, letterSpacing: -1.5, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{hero}</Text>
          ) : (
            <Text testID={`${testID}-hero`} maxFontSizeMultiplier={1.3} style={{ fontSize: 30, lineHeight: 38, fontFamily: fonts.display, color: t.colors.textMuted }}>{tr('cy.tk.nothing')}</Text>
          )}
          {hero && unit ? <Text variant="small" muted style={TABULAR} testID={`${testID}-unit`}>{unit}</Text> : null}
        </View>
        <CycleDayStrip days={strip} selected={day} onSelect={onSelect} onShift={onShift} canForward={canForward} mode={mode} max={max}
          bubbleOf={bubbleOf} describe={describe} testID={`${testID}-strip`} />
      </Glass>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 2 }} testID={`${testID}-list`}>
        <Text variant="label">{tr('cy.tk.dayEntries', { date: formatDate(`${day}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' }) })}</Text>
        {loading ? null : rows.length ? rows.map((r) => (
          <Tappable key={r.id} accessibilityRole="button" testID={`${testID}-row-${r.id}`} onPress={r.onPress}
            accessibilityLabel={r.a11y ?? [r.time ?? tr('cy.tk.allDay'), r.title, r.detail, tr('cy.tk.openToFix')].filter(Boolean).join('. ')}
            style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1, paddingVertical: 4 })}>
            <Text weight="bold" variant={r.time ? undefined : 'small'} muted={!r.time} style={[{ width: 64 }, TABULAR]}>{r.time ?? tr('cy.tk.allDay')}</Text>
            <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
              <Icon name={r.icon} size={15} color={t.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="medium" numberOfLines={2}>{r.title}</Text>
              {r.detail ? <Text variant="small" muted numberOfLines={2} style={TABULAR}>{r.detail}</Text> : null}
            </View>
            <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
          </Tappable>
        )) : (
          <View testID={`${testID}-empty`} style={{ minHeight: 56, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing.sm, marginTop: 4 }}>
            <Text variant="small" muted center>{tr('cy.tk.nothingDay')}</Text>
          </View>
        )}
        {footer}
      </Glass>
    </View>
  );
}
