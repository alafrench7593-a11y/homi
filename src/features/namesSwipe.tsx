/**
 * Prénoms en « coups de cœur » : un prénom à la fois, en grand. Glisser vers la droite (ou ♥) = favori,
 * vers la gauche (ou ✕) = passer. Les prénoms déjà en favoris et ceux déjà vus pendant la session sont écartés.
 * Boutons toujours présents (le glissement n'est jamais le seul moyen). Animations réduites : sans glissement animé.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { GlassSurface } from '@/components/Glass';
import { IconButton, Text, haptic } from '@/components/ui';
import { deck } from '@/lib/domain/quickPicks';
import type { NameEntry } from '@/lib/domain/names';
import { getLocale } from '@/i18n';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const L = (fr: string, en: string) => (getLocale().startsWith('fr') ? fr : en);
const THRESHOLD = 90;

export function NameSwipeDeck({ names, favorites, onLike, describe }: {
  names: NameEntry[];
  /** Clés (normalisées) des prénoms déjà en favoris. */
  favorites: Set<string>;
  onLike: (n: NameEntry) => void;
  describe: (n: NameEntry) => string;
}) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [liked, setLiked] = useState(0);
  const pile = useMemo(() => deck(names, (n) => n.key, favorites, seen).slice(0, 2), [names, favorites, seen]);
  const current = pile[0];
  const x = useRef(new Animated.Value(0)).current;

  const done = (like: boolean) => {
    if (!current) return;
    haptic(like ? 'success' : 'selection');
    if (like) { onLike(current); setLiked((n) => n + 1); }
    setSeen((s) => new Set(s).add(current.key));
    x.setValue(0);
  };
  const fling = (like: boolean) => {
    if (reduce) return done(like);
    Animated.timing(x, { toValue: like ? 420 : -420, duration: 220, useNativeDriver: false }).start(() => done(like));
  };
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_e, g) => x.setValue(g.dx),
    onPanResponderRelease: (_e, g) => {
      if (g.dx > THRESHOLD) fling(true);
      else if (g.dx < -THRESHOLD) fling(false);
      else Animated.spring(x, { toValue: 0, useNativeDriver: false, friction: 6 }).start();
    },
  }), [current?.key, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) {
    return (
      <GlassSurface fill={t.colors.surface} depth={2} radius={28}>
        <View style={{ padding: spacing.xl, alignItems: 'center', gap: 6 }} testID="names-swipe-empty">
          <Text variant="heading" center>{L('Plus de prénoms avec ces filtres', 'No more names with these filters')}</Text>
          <Text muted center>{L('Changez de filtre ou retrouvez vos coups de cœur dans les favoris.', 'Change filters or find your picks in favourites.')}</Text>
        </View>
      </GlassSurface>
    );
  }
  const rotate = x.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-12deg', '0deg', '12deg'] });
  const likeOp = x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOp = x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  return (
    <View style={{ gap: spacing.md }} testID="names-swipe">
      <Text variant="caption" muted center>{L('Glissez à droite : favori · à gauche : passer', 'Swipe right: favourite · left: skip')}{liked ? ` · ${liked} ♥` : ''}</Text>
      <View style={{ height: 230 }}>
        {pile[1] ? (
          <View style={{ position: 'absolute', left: 14, right: 14, top: 10, bottom: -6, opacity: 0.55 }}>
            <GlassSurface fill={t.colors.surface} depth={1} radius={28} style={{ flex: 1 }}><View /></GlassSurface>
          </View>
        ) : null}
        <Animated.View {...pan.panHandlers} style={{ flex: 1, transform: [{ translateX: x }, { rotate }] }} accessibilityLabel={`${current.name}. ${describe(current)}`}>
          <GlassSurface fill={t.colors.surface} depth={3} radius={28} style={{ flex: 1 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 8 }} testID="names-swipe-card">
              <Text style={{ fontSize: 44, lineHeight: 52 }} weight="bold" center>{current.name}</Text>
              <Text muted center numberOfLines={3}>{describe(current)}</Text>
            </View>
            <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 18, left: 18, opacity: likeOp, transform: [{ rotate: '-10deg' }], borderWidth: 2, borderColor: t.colors.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}>
              <Text weight="bold" color={t.colors.primary}>♥ {L('FAVORI', 'LIKE')}</Text>
            </Animated.View>
            <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 18, right: 18, opacity: passOp, transform: [{ rotate: '10deg' }], borderWidth: 2, borderColor: t.colors.textMuted, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}>
              <Text weight="bold" color={t.colors.textMuted}>{L('PASSER', 'SKIP')}</Text>
            </Animated.View>
          </GlassSurface>
        </Animated.View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl }}>
        <IconButton icon="x" tone="filled" size={26} label={L(`Passer ${current.name}`, `Skip ${current.name}`)} onPress={() => fling(false)} />
        <IconButton icon="heart" tone="primary" size={26} label={L(`Ajouter ${current.name} aux favoris`, `Add ${current.name} to favourites`)} onPress={() => fling(true)} />
      </View>
    </View>
  );
}
