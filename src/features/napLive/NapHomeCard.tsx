/**
 * Accueil — la sieste de l'enfant affiché, en un regard : en cours (« Léa dort depuis 13 h 10 », durée qui avance) ou
 * la dernière du jour (« 1 h 25 », heures, note). Un toucher ouvre Sommeil avec CETTE session sélectionnée sur la
 * chronologie (« /sleep/<enfant>?nap=<session> »). Rien du jour : la carte ne s'affiche pas (pas de rangée de zéros).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { napState } from './NapNow';
import { isDayNap } from '@/lib/domain/sleepSummary';

export function NapHomeCard({ child }: { child: Child }) {
  const t = useTheme();
  const { sleeps, now } = useSleepPlan(child);
  const st = napState(child, (sleeps ?? []) as Sleep[], now);
  // « Dernière sieste » : jamais une nuit (même règle que la catégorie : isDayNap)
  const last = st.open ?? [...st.today].filter((s) => s.ended_at && isDayNap(s)).sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null;
  if (!last) return null;
  const minutes = Math.max(0, Math.round(((last.ended_at ? Date.parse(last.ended_at) : now.getTime()) - Date.parse(last.started_at)) / 60_000));
  const title = st.open ? tr('nn.home.ongoing', { name: child.first_name, time: clock(new Date(last.started_at)) }) : tr('nn.home.last', { name: child.first_name });
  const range = tr('nn.tray.range', { from: clock(new Date(last.started_at)), to: last.ended_at ? clock(new Date(last.ended_at)) : '…' });
  return (
    <View style={{ gap: spacing.xs }}>
    <Tappable accessibilityRole="button" accessibilityLabel={`${title}. ${span(minutes)}. ${range}. ${tr('nn.home.open')}`} testID="home-nap"
      onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, nap: last.id } } as never)}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="moon" size={16} color={st.open ? t.colors.primary : t.colors.textMuted} />
          <Text variant="small" weight="medium" style={{ flex: 1 }} numberOfLines={2}>{title}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text testID="home-nap-duration" maxFontSizeMultiplier={1.3} style={{ fontSize: 40, lineHeight: 46, letterSpacing: -1, fontFamily: fonts.display, color: t.colors.text, fontVariant: ['tabular-nums'] }}>{span(minutes)}</Text>
          <Text weight="bold" style={{ fontVariant: ['tabular-nums'] }}>{range}</Text>
        </View>
        {last.note ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="message-square" size={14} color={t.colors.primary} />
            <Text variant="small" muted numberOfLines={1} style={{ flex: 1 }}>{last.note}</Text>
          </View>
        ) : null}
      </Glass>
    </Tappable>
    {/* Juste dessous : le relais (lit les mêmes sessions) */}
    <GlassButton variant="secondary" icon="send" label={tr('nn.home.relay')} testID="home-relay" style={{ alignSelf: 'flex-start' }}
      onPress={() => router.push({ pathname: '/family/relay', params: { child: child.id } } as never)} />
    </View>
  );
}
