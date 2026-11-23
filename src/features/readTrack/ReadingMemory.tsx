/**
 * Lecture (22/11/2026) — pièces communes des apps de lecture et d'aide, d'après la direction artistique du client :
 *  · `ReadingMemory` (dans le contenu du `Screen`) : à l'ouverture d'un contenu LONG, il devient « dernier contenu » du profil affiché et sa
 *    position de défilement est restaurée ; la position est gardée pendant la lecture et en quittant l'écran ;
 *  · `ResumeCard` : « Reprendre la lecture » (verre dense, titre, date, chevron) ;
 *  · `StarToggle` : favori — sélection lisible sans couleur (pastille pleine + libellé d'accessibilité) ;
 *  · `ReadingFavorites` : favoris du profil, liste à chevron.
 * Pas de frise ni de courbe : ce sont des apps de lecture.
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { ScreenChromeContext, type ScrollerEntry } from '@/components/screenChrome';
import { whoopEdge } from '@/components/stage/WhoopSheen';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, ListGroup, Text, type IconName } from '@/components/ui';
import { HmRow } from '@/features/homeTrack/kit';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { useScope } from '@/lib/data/hooks-scope';
import { EMPTY_READING, favoritesOf, isFav, profileKey, restoreY, resumeOf, type ProfileReading, type ReadKind, type ReadRef } from '@/lib/domain/readTrack';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { useReadingStore } from './readingStore';

export const KIND_ICON: Record<ReadKind, IconName> = { article: 'file-text', guide: 'bookmark', night: 'moon', source: 'link' };

/** Clé du profil affiché (compte + enfant / grossesse / moi). */
export function useReadingProfile(): string {
  const userId = useUserId();
  const s = useScope();
  return profileKey({ userId, scope: s.scope, childId: s.childId, pregnancyId: s.pregnancyId });
}

export function useProfileReading(): { key: string; data: ProfileReading } {
  const key = useReadingProfile();
  const data = useReadingStore((s) => s.byProfile[key]) ?? EMPTY_READING;
  return { key, data };
}

function useHydrated() {
  const [ok, setOk] = useState(() => useReadingStore.persist?.hasHydrated?.() ?? true);
  useEffect(() => {
    if (ok) return;
    const off = useReadingStore.persist?.onFinishHydration?.(() => setOk(true));
    if (useReadingStore.persist?.hasHydrated?.()) setOk(true);
    return off;
  }, [ok]);
  return ok;
}

/**
 * Contenu long ouvert : mémorise l'ouverture, restaure la position, garde la position (toutes les 0,8 s si elle a
 * bougé, et en quittant). `ref` nul tant que le contenu n'est pas chargé.
 */
export function useReadingMemory(ref: ReadRef | null): void {
  const chrome = useContext(ScreenChromeContext) as ({ current?: () => ScrollerEntry | null } & object) | null;
  const { key, data } = useProfileReading();
  const hydrated = useHydrated();
  const open = useReadingStore((s) => s.open);
  const position = useReadingStore((s) => s.position);
  const dataRef = useRef(data);
  dataRef.current = data;
  const id = ref ? `${ref.kind}:${ref.id}` : null;
  useEffect(() => {
    if (!ref || !hydrated) return;
    const target = restoreY(dataRef.current, ref.kind, ref.id);
    open(key, ref);
    const entry = () => chrome?.current?.() ?? null;
    let lastSaved = target ?? -1;
    let restored = target == null;
    let tries = 0;
    const go = (y: number) => {
      const s = entry()?.ref.current;
      if (!s) return false;
      if (s.scrollTo) s.scrollTo({ y, animated: false }); else s.scrollToOffset?.({ offset: y, animated: false });
      return true;
    };
    // Le contenu se met en page en plusieurs temps : on réessaie jusqu'à atteindre la position (1,5 s au plus)
    const restore = setInterval(() => {
      tries += 1;
      if (restored || tries > 10) { clearInterval(restore); restored = true; return; }
      if (!go(target ?? 0)) return;
      const off = entry()?.offset() ?? 0;
      if (Math.abs(off - (target ?? 0)) < 4 && tries > 2) { restored = true; clearInterval(restore); }
    }, 150);
    const track = setInterval(() => {
      if (!restored) return;
      const off = entry()?.offset();
      if (off == null || Math.abs(off - lastSaved) < 24) return;
      lastSaved = off;
      position(key, ref.kind, ref.id, off);
    }, 800);
    return () => {
      clearInterval(restore); clearInterval(track);
      const off = entry()?.offset();
      if (restored && off != null) position(key, ref.kind, ref.id, off);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, key, hydrated]);
}

/**
 * À poser DANS le contenu d'un `Screen` (le défilement de l'écran n'est accessible qu'à ses enfants). Ne rend rien.
 */
export function ReadingMemory({ item }: { item: ReadRef | null }) {
  useReadingMemory(item);
  return null;
}

/** Favori : pastille pleine quand actif (lisible sans couleur), libellé d'accessibilité explicite. */
export function StarToggle({ active, onPress, title, testID }: { active: boolean; onPress: () => void; title: string; testID?: string }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityState={{ selected: active }} testID={testID}
      accessibilityLabel={active ? tr('rt.fav.remove', { title }) : tr('rt.fav.add', { title })}
      onPress={() => { haptic('selection'); onPress(); }} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: active ? 0 : 1, borderColor: t.colors.border,
        backgroundColor: active ? t.colors.text : 'transparent', ...(active ? whoopEdge(t, t.colors.text) : null) }}>
        <Icon name="star" size={17} color={active ? t.colors.background : t.colors.textMuted} />
      </View>
    </Tappable>
  );
}

/** Étoile reliée au magasin du profil affiché. */
export function ReadStar({ refItem, testID }: { refItem: ReadRef; testID?: string }) {
  const { key, data } = useProfileReading();
  const toggle = useReadingStore((s) => s.toggle);
  return <StarToggle active={isFav(data, refItem.kind, refItem.id)} title={refItem.title} onPress={() => toggle(key, refItem)} testID={testID} />;
}

/** « Reprendre la lecture » : dernier contenu long ouvert dans ce profil (sauf celui affiché). */
export function ResumeCard({ kinds, except, testID = 'rt-resume' }: { kinds?: ReadKind[]; except?: { kind: ReadKind; id: string } | null; testID?: string }) {
  const t = useTheme();
  const { data } = useProfileReading();
  const last = resumeOf(data, { kinds, except });
  if (!last) return null;
  const when = formatDate(last.at, { weekday: 'long', day: 'numeric', month: 'long' });
  const detail = last.y >= 48 ? tr('rt.resume.kept', { when }) : tr('rt.resume.opened', { when });
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.sm }} testID={testID}>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('rt.resume.a11y', { title: last.title, detail })} testID={`${testID}-open`}
        onPress={() => router.push(last.href as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
          <Icon name={KIND_ICON[last.kind]} size={18} color={t.colors.text} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" muted weight="bold">{tr('rt.resume.title')}</Text>
          <Text weight="bold" numberOfLines={2}>{last.title}</Text>
          <Text variant="caption" muted>{detail}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Tappable>
    </Glass>
  );
}

/** Favoris (étoile) du profil affiché, pour les types donnés. Rien si aucun. */
export function ReadingFavorites({ kinds, testID = 'rt-favs', title }: { kinds: ReadKind[]; testID?: string; title?: string }) {
  const { data } = useProfileReading();
  const favs = useMemo(() => favoritesOf(data, kinds), [data, kinds]);
  if (!favs.length) return null;
  return (
    <ListGroup title={title ?? tr('rt.fav.title', { count: favs.length })} testID={testID}>
      {favs.map((f) => (
        <View key={`${f.kind}:${f.id}`} style={{ paddingHorizontal: spacing.md }}>
          <HmRow icon={KIND_ICON[f.kind]} title={f.title} detail={tr(`rt.kind.${f.kind}` as TKey)} onPress={() => router.push(f.href as never)} testID={`${testID}-${f.kind}-${f.id}`} />
        </View>
      ))}
    </ListGroup>
  );
}
