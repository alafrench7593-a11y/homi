/**
 * Fond des pages du bébé et de l'enfant, en journée : la vidéo des galets en alternance avec le passage de l'histoire
 * en 3D qui correspond à l'âge de l'enfant (le bébé dans les bras avant 1 an, l'enfant qui marche main dans la main
 * ensuite). La nuit, le fond nocturne habituel reste.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useChildren } from '@/lib/data/hooks';
import { childAge } from '@/lib/domain/child';
import { useTheme } from '@/theme/ThemeProvider';

/** Lecteur vidéo chargé à la demande : si le module vidéo est indisponible (tests, appareil), pas de vidéo. */
let video: typeof import('@/components/VideoBackdrop') | null | undefined;
function videoModule() {
  if (video === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    try { video = require('@/components/VideoBackdrop'); } catch { video = null; }
  }
  return video;
}

/** Adresses des pages qui parlent d'un bébé ou d'un enfant. */
const CHILD_PATH = /^\/(child|bottle|sleep|teeth|night|track|discoveries)(\/|$)/;
export function isChildPage(pathname: string, toolId?: string | null): boolean {
  return CHILD_PATH.test(pathname) || (!!toolId && /^(kid_|baby_|pp_feeding|pp_bottle)/.test(toolId));
}

export function ChildBackdrop() {
  const t = useTheme();
  const vm = videoModule();
  const params = useLocalSearchParams<{ id?: string; childId?: string; child?: string }>();
  const { data: children } = useChildren();
  const want = [params.childId, params.child, params.id].find((v) => typeof v === 'string' && v.length > 0);
  const ageYears: number | null = useMemo(() => {
    const list = children ?? [];
    const kid = list.find((c) => c.id === want) ?? (list.length === 1 ? list[0] : null);
    return kid?.birth_date ? childAge(kid.birth_date).days / 365.25 : null;
  }, [children, want]);
  if (t.isDark || !vm) return null;
  const story = ageYears != null && ageYears < 1 ? vm.STORY_BABY_CLIP : vm.STORY_WALK_CLIP;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="child-backdrop">
      <vm.VideoBackdrop only={[vm.GALETS_CLIP, story]} />
    </View>
  );
}
