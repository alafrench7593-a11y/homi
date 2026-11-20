/**
 * 132 — Jeux éducatifs adaptés à l'âge (dans « Je grandis ») : 32 jeux et activités écrits à l'avance
 * (src/content/games), par tranche d'âge (0–1, 1–3, 3–6, 6–10 ans), avec du matériel du quotidien et un rappel de
 * sécurité. Filtres âge, durée, intérieur / extérieur ; favoris et « on l'a fait » par enfant (aucune série, aucun
 * objectif). La lecture « Activités et jeux par âge » (guides.activities) reste accessible.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { GlassSurface } from '@/components/Glass';
import { Banner, Button, Chip, Icon, ListRow, Row, Text, haptic } from '@/components/ui';
import { GAME_BANDS, gameText, type GameId, type GameMeta } from '@/content/games';
import { formatDate, getLocale, t as tr, type TKey } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useGameMarks, useSaveGameMark } from '@/lib/data/hooks-partiels2';
import { todayISO } from '@/lib/domain/dates';
import { ageInMonths } from '@/lib/domain/discoveries';
import { bandForMonths, filterGames, markOf, nextMark, type Duration, type GameMark, type PlaceFilter } from '@/features/games/domain';
import { ChildToolGate, useParentChild } from '@/features/childTools/ChildToolGate';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const DURATIONS: Duration[] = ['short', 'medium', 'long'];
const PLACES: PlaceFilter[] = ['in', 'out'];

export default function Games() {
  const state = useParentChild();
  const gate = ChildToolGate({ title: tr('p2.gm.title'), state });
  if (gate) return gate;
  return <GamesBody child={state.child!} />;
}

function GamesBody({ child }: { child: Child }) {
  const toast = useToast();
  const marksQ = useGameMarks(child.id);
  const save = useSaveGameMark();
  const lang = getLocale();
  const current = bandForMonths(ageInMonths(child.birth_date, todayISO()));
  const [band, setBand] = useState<typeof current | null>(current);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [place, setPlace] = useState<PlaceFilter | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpen] = useState<GameMeta | null>(null);
  const marks = useMemo(() => marksQ.data ?? [], [marksQ.data]);
  const list = useMemo(() => filterGames({ band, duration, place, favoritesOnly: favOnly }, marks), [band, duration, place, favOnly, marks]);
  if (marksQ.isLoading && !marksQ.data) return <Screen back title={tr('p2.gm.title')}><Skeleton rows={4} /></Screen>;
  if (marksQ.isError && !marksQ.data) return <Screen back title={tr('p2.gm.title')}><ErrorView error={marksQ.error} onRetry={() => void marksQ.refetch()} /></Screen>;

  async function mark(g: GameMeta, action: 'favorite' | 'done') {
    const prev = markOf(marks, g.id);
    try {
      const r = await save.mutateAsync({ id: prev?.id, household_id: child.household_id, child_id: child.id, game_key: g.id, ...nextMark(prev, action, todayISO()) });
      haptic('success');
      if (action === 'done') toast(tr(r.queued ? 'p2.savedOffline' : 'p2.gm.doneSaved', { name: child.first_name }), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Screen back title={tr('p2.gm.title')} subtitle={tr('p2.gm.sub', { name: child.first_name })}>
      <Banner tone="info" icon="shield" title={tr('p2.gm.safetyT')}>{tr('p2.gm.safety')}</Banner>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip label={tr('p2.gm.allAges')} selected={!band} onPress={() => setBand(null)} testID="gm-band-all" />
        {GAME_BANDS.map((b) => <Chip key={b} label={tr(`p2.gm.band.${b}` as TKey) + (b === current ? ` · ${tr('gr.now')}` : '')} selected={band === b} onPress={() => setBand(b)} testID={`gm-band-${b}`} />)}
      </ScrollView>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {DURATIONS.map((d) => <Chip key={d} label={tr(`p2.gm.dur.${d}` as TKey)} icon="clock" selected={duration === d} onPress={() => setDuration(duration === d ? null : d)} testID={`gm-dur-${d}`} />)}
        {PLACES.map((p) => <Chip key={p} label={tr(`p2.gm.place.${p}` as TKey)} icon={p === 'in' ? 'home' : 'sun'} selected={place === p} onPress={() => setPlace(place === p ? null : p)} testID={`gm-place-${p}`} />)}
        <Chip label={tr('p2.gm.favorites')} icon="star" selected={favOnly} onPress={() => setFavOnly((v) => !v)} testID="gm-fav-only" />
      </ScrollView>
      <Text variant="caption" muted testID="gm-count">{tr('p2.gm.count', { count: list.length })}</Text>
      <View style={{ gap: spacing.sm }} testID="gm-list">
        {list.length ? list.map((g) => <GameCard key={g.id} g={g} lang={lang} m={markOf(marks, g.id)} onOpen={() => setOpen(g)} onFav={() => void mark(g, 'favorite')} />)
          : <Text muted variant="small" testID="gm-none">{favOnly ? tr('p2.gm.noFav') : tr('p2.gm.none')}</Text>}
      </View>
      <ListRow icon="book-open" title={tr('p2.gm.readMore')} subtitle={tr('p2.gm.readMoreSub')} onPress={() => router.push('/guide/activities' as never)} testID="gm-guide" />
      <GameSheet g={open} lang={lang} m={open ? markOf(marks, open.id) : undefined} name={child.first_name} busy={save.isPending}
        onClose={() => setOpen(null)} onFav={() => open && void mark(open, 'favorite')} onDone={() => open && void mark(open, 'done')} />
    </Screen>
  );
}

const meta = (g: GameMeta) => `${tr('p2.gm.minutes', { count: g.minutes })} · ${tr(`p2.gm.where.${g.place}` as TKey)}`;
const doneText = (m?: GameMark) => (m && m.done_count && m.last_done_on
  ? tr('p2.gm.doneCount', { count: m.done_count, date: formatDate(`${m.last_done_on}T12:00:00`, { day: 'numeric', month: 'short' }) }) : null);

function GameCard({ g, lang, m, onOpen, onFav }: { g: GameMeta; lang: string; m?: GameMark; onOpen: () => void; onFav: () => void }) {
  const t = useTheme();
  const txt = gameText(g.id as GameId, lang);
  const done = doneText(m);
  return (
    <View>
      <Tappable accessibilityRole="button" onPress={onOpen} testID={`gm-card-${g.id}`} accessibilityLabel={`${txt.title}. ${meta(g)}${done ? `. ${done}` : ''}`}>
        <GlassSurface fill={t.colors.surface} depth={1} radius={20} padded={spacing.sm + 4}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.surface.sunken }}>
              <Icon name={g.icon} size={18} color={t.colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold">{txt.title}</Text>
              <Text variant="caption" muted>{meta(g)}</Text>
              {done ? <Text variant="caption" color={t.colors.success}>{done}</Text> : null}
            </View>
            <View style={{ width: 44 }} />
          </View>
        </GlassSurface>
      </Tappable>
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, right: spacing.xs, justifyContent: 'center' }}>
        <Tappable bare accessibilityRole="button" accessibilityState={{ selected: !!m?.favorite }} accessibilityLabel={m?.favorite ? tr('p2.gm.unfav', { title: txt.title }) : tr('p2.gm.fav', { title: txt.title })}
          onPress={onFav} hitSlop={6} testID={`gm-fav-${g.id}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="star" size={20} color={m?.favorite ? t.colors.gold : t.colors.textMuted} />
        </Tappable>
      </View>
    </View>
  );
}

function GameSheet({ g, lang, m, name, busy, onClose, onFav, onDone }: { g: GameMeta | null; lang: string; m?: GameMark; name: string; busy: boolean; onClose: () => void; onFav: () => void; onDone: () => void }) {
  const txt = g ? gameText(g.id as GameId, lang) : null;
  const done = doneText(m);
  return (
    <GlassSheet visible={!!g} onClose={onClose} title={txt?.title ?? ''}>
      {g && txt ? (
        <View style={{ gap: spacing.sm }} testID="gm-sheet">
          <Text variant="caption" muted>{tr(`p2.gm.band.${g.band}` as TKey)} · {meta(g)}</Text>
          <Text>{txt.how}</Text>
          <View style={{ gap: 2 }}>
            <Text variant="small" weight="bold">{tr('p2.gm.material')}</Text>
            <Text variant="small">{txt.material}</Text>
          </View>
          {txt.safety ? <Banner tone="warning" icon="shield">{txt.safety}</Banner> : null}
          {done ? <Text variant="small" muted testID="gm-sheet-done">{done}</Text> : null}
          <Row wrap>
            <Button label={tr('p2.gm.didIt')} icon="check" loading={busy} onPress={onDone} testID="gm-done" />
            <Button label={m?.favorite ? tr('p2.gm.inFav') : tr('p2.gm.addFav')} icon="star" variant="secondary" onPress={onFav} testID="gm-sheet-fav" />
          </Row>
          <Text variant="caption" muted>{tr('p2.gm.noPressure', { name })}</Text>
        </View>
      ) : <View />}
    </GlassSheet>
  );
}
