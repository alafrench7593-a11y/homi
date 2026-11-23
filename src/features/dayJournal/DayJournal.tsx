/**
 * « Journal de Lina » — planche 2 du brief client (« Journal et comparaison hebdomadaire ») : en-tête sobre (nom, date),
 * navigation par jour (jour dans l'adresse `?day=`), trois tuiles vers les mini-apps (Sommeil, Biberon, Couche), les
 * événements de toutes natures mélangés par heure (heure en colonne fixe, pastille, libellé + détail, chevron), et une
 * seule action en bas : « Ajouter un événement ». Une journée sans saisie reste « rien de noté ».
 * Même donnée source que les mini-apps (journalItems → relayItems) ; un toucher ouvre l'événement dans sa mini-app.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass, GlassButton, GlassIconButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { journalDay, journalItems, shiftDay } from '@/lib/domain/dayJournal';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { isDayNap } from '@/lib/domain/sleepSummary';
import type { RelayItem } from '@/lib/domain/relayDraft';
import type { Bottle, Breastfeed, Child, Diaper, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const ICON: Record<RelayItem['kind'], IconName> = { sleep: 'moon', bottle: 'coffee', diaper: 'wind', breastfeed: 'droplet' };
const TIME_COL = 64;

function describe(i: RelayItem, sleeps: readonly Sleep[]): { label: string; detail: string } {
  if (i.kind === 'sleep') {
    const s = sleeps.find((x) => x.id === i.id);
    const label = !i.end ? tr('dj.sleepOn') : s && !isDayNap(s) ? tr('dj.nightEnd') : tr('dj.napEnd');
    const range = `${clock(new Date(i.start))} – ${i.end ? clock(new Date(i.end)) : '…'}`;
    return { label, detail: [range, span(i.minutes), i.note].filter(Boolean).join(' · ') };
  }
  if (i.kind === 'bottle') return { label: tr('dj.bottle'), detail: i.ml != null ? tr('dj.ml', { ml: i.ml }) : tr('dj.noQty') };
  if (i.kind === 'diaper') return { label: tr('dj.diaper'), detail: tr(i.wet && i.stool ? 'dj.wetStool' : i.wet ? 'dj.wet' : i.stool ? 'dj.stool' : 'dj.dry') };
  return { label: tr('dj.feed'), detail: `${span(i.minutes)} · ${tr(i.side === 'left' ? 'dj.left' : i.side === 'right' ? 'dj.right' : 'dj.both')}` };
}

function open(i: RelayItem, childId: string) {
  haptic('selection');
  if (i.kind === 'sleep') router.push({ pathname: '/sleep/[childId]', params: { childId, nap: i.id } } as never);
  else if (i.kind === 'bottle') router.push(`/bottle/${childId}` as never);
  else router.push({ pathname: '/track/[kind]', params: { kind: i.kind, child: childId } } as never);
}

export function DayJournal({ child, sleeps, bottles, diapers, breastfeeds, loadedDays }: {
  child: Child; sleeps: readonly Sleep[]; bottles: readonly Bottle[]; diapers: readonly Diaper[]; breastfeeds: readonly Breastfeed[]; loadedDays: number;
}) {
  const t = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
  const now = new Date();
  const day = journalDay(typeof params.day === 'string' ? params.day : null, now);
  const today = journalDay(null, now);
  const oldest = shiftDay(today, -(loadedDays - 1), now);
  const [adding, setAdding] = useState(false);
  const items = journalItems({ childId: child.id, day, now, sleeps, bottles, diapers, breastfeeds });
  const dayDate = `${day}T12:00:00`;
  const dayName = day === today ? tr('dj.today') : day === shiftDay(today, -1, now) ? tr('dj.yesterday') : formatDate(dayDate, { weekday: 'long', day: 'numeric', month: 'short' });
  const go = (d: string) => { haptic('selection'); router.setParams({ day: d === today ? undefined : d } as never); };
  const tiles: { icon: IconName; label: string; onPress: () => void; testID: string }[] = [
    { icon: 'moon', label: tr('dj.sleep'), testID: 'dj-tile-sleep', onPress: () => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id } } as never) },
    { icon: 'coffee', label: tr('dj.bottle'), testID: 'dj-tile-bottle', onPress: () => router.push(`/bottle/${child.id}` as never) },
    { icon: 'wind', label: tr('dj.diaper'), testID: 'dj-tile-diaper', onPress: () => router.push({ pathname: '/track/[kind]', params: { kind: 'diaper', child: child.id } } as never) },
  ];
  const add: { icon: IconName; label: string; kind: string }[] = [
    { icon: 'moon', label: tr('dj.sleep'), kind: 'sleep' }, { icon: 'coffee', label: tr('dj.bottle'), kind: 'bottle' },
    { icon: 'wind', label: tr('dj.diaper'), kind: 'diaper' }, { icon: 'droplet', label: tr('dj.feed'), kind: 'breastfeed' },
  ];
  return (
    <View style={{ gap: spacing.sm }} testID="day-journal">
      <View style={{ gap: 2 }}>
        <Text variant="title" accessibilityRole="header" numberOfLines={1}>{tr('dj.title', { name: child.first_name })}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="calendar" size={14} color={t.colors.textMuted} />
          <Text variant="small" muted testID="dj-date">{formatDate(dayDate, { day: 'numeric', month: 'long' })}</Text>
        </View>
      </View>
      {/* Navigation par jour : le jour choisi reste dans l'adresse (retour, partage, rechargement) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <GlassIconButton icon="chevron-left" label={tr('dj.prev')} size={44} testID="dj-prev" disabled={day <= oldest} onPress={() => go(shiftDay(day, -1, now))} />
        <Glass variant="card" radius={999} style={{ flex: 1 }} contentStyle={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md }}>
          <Text weight="bold" testID="dj-day" numberOfLines={1}>{dayName.replace(/^./, (c) => c.toUpperCase())}</Text>
        </Glass>
        <GlassIconButton icon="chevron-right" label={tr('dj.next')} size={44} testID="dj-next" disabled={day >= today} onPress={() => go(shiftDay(day, 1, now))} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {tiles.map((x) => (
          <Tappable key={x.testID} accessibilityRole="button" accessibilityLabel={x.label} testID={x.testID} onPress={x.onPress} style={{ flex: 1 }}>
            <Glass variant="card" radius={radius.lg} contentStyle={{ minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name={x.icon} size={20} color={t.colors.text} />
              <Text variant="small" weight="medium" numberOfLines={1}>{x.label}</Text>
            </Glass>
          </Tappable>
        ))}
      </View>
      <Text variant="label" accessibilityRole="header" style={{ marginTop: spacing.xs }}>{dayName.replace(/^./, (c) => c.toUpperCase())}</Text>
      {items.length ? (
        <View style={{ gap: spacing.xs }} testID="dj-list">
          {[...items].reverse().map((i, n, all) => {
            const d = describe(i, sleeps);
            const time = clock(new Date(i.at));
            return (
              <View key={`${i.kind}-${i.id}`} style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing.xs }}>
                {/* fil du temps : point + trait vertical, heure en colonne fixe */}
                <View style={{ width: 10, alignItems: 'center' }}>
                  <View style={{ flex: 1, width: StyleSheet.hairlineWidth * 2, backgroundColor: n ? t.colors.border : 'transparent' }} />
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.textMuted }} />
                  <View style={{ flex: 1, width: StyleSheet.hairlineWidth * 2, backgroundColor: n < all.length - 1 ? t.colors.border : 'transparent' }} />
                </View>
                <Tappable accessibilityRole="button" accessibilityLabel={tr('dj.rowA11y', { time, label: d.label, detail: d.detail })} testID="dj-row" onPress={() => open(i, child.id)} style={{ flex: 1 }}>
                  <Glass variant="card" radius={radius.lg} contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
                    <Text weight="bold" style={{ width: TIME_COL, fontVariant: ['tabular-nums'] }}>{time}</Text>
                    <Icon name={ICON[i.kind]} size={18} color={t.colors.text} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text weight="medium" numberOfLines={1}>{d.label}</Text>
                      <Text variant="caption" muted numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>{d.detail}</Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
                  </Glass>
                </Tappable>
              </View>
            );
          })}
        </View>
      ) : (
        <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.md, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.border, borderRadius: radius.lg }}>
          <Text variant="small" muted testID="dj-none">{tr('dj.none')}</Text>
        </Glass>
      )}
      {adding ? (
        <View style={{ gap: spacing.xs }} testID="dj-add-choices">
          <Text variant="small" muted>{tr('dj.addHint')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {add.map((a) => (
              <GlassButton key={a.kind} variant="secondary" size="sm" icon={a.icon} label={a.label} testID={`dj-add-${a.kind}`}
                onPress={() => { setAdding(false); if (a.kind === 'sleep') router.push({ pathname: '/sleep/[childId]', params: { childId: child.id } } as never); else router.push({ pathname: '/track/[kind]', params: { kind: a.kind, child: child.id } } as never); }} />
            ))}
          </View>
        </View>
      ) : null}
      <GlassButton variant="secondary" full icon={adding ? 'x' : 'plus'} label={tr('dj.add')} testID="dj-add" onPress={() => { haptic('light'); setAdding((v) => !v); }} />
    </View>
  );
}
