/**
 * Accueil — l'allaitement de l'enfant affiché, en un regard (22/11/2026) : tétée en cours (« Léa tète depuis 14 h 26 ·
 * Gauche », chrono qui avance) ou la dernière (« Dernière tétée de Léa · 11 h 07 – 11 h 24 · Droite 17 min »).
 * Même donnée que la mini-app (`breastfeeds`). Un toucher ouvre l'allaitement avec CETTE tétée sélectionnée
 * (« /track/breastfeed?child=…&feed=… »). Rien depuis deux jours : la carte ne s'affiche pas (pas de zéro inventé).
 * À insérer dans l'accueil par l'intégrateur : <BreastHomeCard child={child} />.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useLogs } from '@/lib/data/hooks';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { currentSide, feedMinutes, feedSeconds, lastFeed, stopwatch, type FeedLike } from '@/lib/domain/breastSession';
import type { Breastfeed, Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { sideLabel, sidesText } from './BreastNow';
import { TABULAR, useTicker } from './SessionBand';

export function BreastHomeCard({ child }: { child: Child }) {
  const t = useTheme();
  const q = useLogs<Breastfeed>('breastfeed', child.id, 2, { includePending: true });
  const probe = lastFeed((q.data ?? []) as FeedLike[], child.id, new Date());
  const now = useTicker(!!probe?.ongoing);
  const last = lastFeed((q.data ?? []) as FeedLike[], child.id, now);
  if (!last) return null;
  const f = last.feed;
  const title = last.ongoing
    ? tr('bt.home.ongoing', { name: child.first_name, time: clock(new Date(f.started_at)), side: sideLabel(currentSide(f, now) ?? f.side) })
    : tr('bt.home.last', { name: child.first_name });
  const big = last.ongoing ? stopwatch(feedSeconds(f, now).total ?? 0) : (() => { const m = feedMinutes(f, now).total; return m != null ? span(m) : '—'; })();
  const detail = last.ongoing
    ? tr('bt.hero.sides', { left: stopwatch(feedSeconds(f, now).left ?? 0), right: stopwatch(feedSeconds(f, now).right ?? 0) })
    : `${tr('bt.tray.range', { from: clock(new Date(f.started_at)), to: f.ended_at ? clock(new Date(f.ended_at)) : '…' })} · ${sidesText(f, now)}`;
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`${title}. ${big}. ${detail}. ${tr('bt.home.open')}`} testID="home-breast"
      onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id, feed: f.id } } as never)}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="droplet" size={16} color={last.ongoing ? t.colors.primary : t.colors.textMuted} />
          <Text variant="small" weight="medium" style={{ flex: 1 }} numberOfLines={2} testID="home-breast-title">{title}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text testID="home-breast-duration" maxFontSizeMultiplier={1.3} style={[{ fontSize: 40, lineHeight: 46, letterSpacing: -1, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{big}</Text>
          <Text weight="bold" style={TABULAR} testID="home-breast-detail">{detail}</Text>
        </View>
        {f.note ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="message-square" size={14} color={t.colors.primary} />
            <Text variant="small" muted numberOfLines={1} style={{ flex: 1 }}>{f.note}</Text>
          </View>
        ) : null}
      </Glass>
    </Tappable>
  );
}
