/**
 * Sélecteur de profil UNIVERSEL (refonte du 17/11/2026) : remplace la carte + feuille, la rangée de bulles et les
 * capsules des hubs. Une rangée horizontale d'avatars — Moi, ma grossesse, chaque enfant suivi, toute la famille —
 * présente en tête d'Aujourd'hui, de Moi / Enfant / Famille, de Mes outils et de l'agenda.
 *
 *  - Rendu par `GlassProfileSwitcher` (bibliothèque de verre) : profil actif nettement marqué par UN anneau qui GLISSE
 *    vers l'avatar choisi + prénom en gras (forme + graisse, pas la couleur seule), état « choisi » annoncé.
 *  - Changement COORDONNÉ (`profileTransition`) : l'anneau part tout de suite, le contenu du profil précédent s'efface,
 *    puis le nouveau profil est rendu à neuf (clé par profil) et entre en léger décalé. Immédiat avec « Réduire les
 *    animations ».
 *  - Permissions : la liste ne contient QUE ce que le serveur renvoie à ce compte (enfants filtrés par la RLS et le
 *    périmètre par enfant, grossesse fermée à une nounou) et les parcours suivis ; rien n'est déduit ni inventé ici.
 *  - `ProfileSwipe` : glissement horizontal entre profils (accueil, hubs). Il ne capte pas le bord gauche (retour
 *    iOS), cède au défilement vertical (activeOffsetX / failOffsetY) et aux carrousels horizontaux (`SwipeExclude`).
 *    Un toucher sur un avatar reste l'alternative accessible (VoiceOver, TalkBack).
 *  - Changer de profil ne fait que changer `subject` dans le magasin : aucune feuille ouverte n'est démontée.
 *
 * Règles worklets : aucune ref React lue sur le fil UI (shared values), aucune fonction locale confiée à
 * `scheduleOnRN` (elles sont déclarées dans le composant), aucun paramètre par défaut lisant la fermeture.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { GlassProfileSwitcher, type GlassProfile } from './glass';
import { changeProfile, usePendingProfile } from './profileTransition';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { motionSpring, motionTiming, useMotion } from '@/motion';
import { useActivePregnancy, useActiveSubject, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useAuth } from '@/lib/auth';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { t as tr } from '@/i18n';
import { ChildAvatar } from '@/features/childAvatar';
import { Tappable } from './Tappable';
import { UserAvatar } from './UserAvatar';
import { avatarInitial } from './AccountActions';
import { haptic, Icon, Text, type IconName } from './ui';
import { activeProfileIndex, neighbourIndex, profileEntries, SWIPE, swipeDirection, type ProfileEntry } from './profileList';

export { activeProfileIndex, neighbourIndex, profileEntries, SWIPE, swipeDirection, type ProfileEntry, type ProfileKind } from './profileList';

/** Liste, profil actif et changement de profil : la même source pour la rangée, le glissement et l'indicateur. */
export function useProfileList() {
  const { subject, setSubject } = useActiveSubject();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const m = useMotion();
  const list = useMemo(() => profileEntries({ pregnancyId: pregnancy?.id, children }), [pregnancy?.id, children]);
  const index = activeProfileIndex(list, subject);
  /** Change de profil (transition coordonnée) ; `silent` : l'haptique est déjà partie (toucher d'un avatar). */
  const select = (i: number, silent?: boolean) => {
    const e = list[i];
    if (!e || i === index) return;
    if (!silent) haptic('selection');
    changeProfile(e.key, i > index ? 1 : -1, m.level, () => setSubject(e.subject));
  };
  return { list, index, select, pregnancy, active: list[index] };
}

const SIZE = 48;
const ITEM_W = 68;

function Glyph({ icon }: { icon: IconName }) {
  const t = useTheme();
  return (
    <View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
      <Icon name={icon} size={22} color={t.colors.primary} />
    </View>
  );
}

export interface ProfileSwitcherProps {
  /** Indicateur de pages sous la rangée (écrans où l'on glisse entre profils). */
  pager?: boolean;
  /** « Ajouter un profil » en bout de rangée (défaut : oui). */
  add?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function ProfileSwitcher({ pager = false, add = true, testID = 'profile-switcher', style }: ProfileSwitcherProps = {}) {
  const { list, index, select, pregnancy } = useProfileList();
  const { data: profile } = useProfile();
  const { session } = useAuth();
  const swipe = useContext(SwipeCtx);
  const pendingKey = usePendingProfile();
  const scrollProps = useMemo(() => ({ onStartShouldSetResponderCapture: () => { swipe?.exclude(); return false; } }), [swipe]);

  const label = (e: ProfileEntry) => (e.kind === 'me' ? tr('pj.subject.me') : e.kind === 'pregnancy' ? tr('ps.pregnancy') : e.kind === 'family' ? tr('ps.family') : e.child!.first_name);
  const a11y = (e: ProfileEntry) => (e.kind === 'me' ? tr('pj.bubble.meA11y', { name: profile?.display_name?.trim() || tr('pj.subject.me') })
    : e.kind === 'pregnancy' ? `${tr('pj.subject.pregnancy')}${pregnancy ? `, ${pregnancyProgress(pregnancy.due_date).label}` : ''}`
      : e.kind === 'family' ? tr('pj.subject.family') : `${e.child!.first_name}, ${childAge(e.child!.birth_date).label}`);
  const profiles: GlassProfile[] = list.map((e) => ({
    key: e.key,
    label: label(e),
    accessibilityLabel: a11y(e),
    testID: `subject-${e.key}`,
    avatar: e.kind === 'me' ? <UserAvatar path={profile?.avatar_path} initial={avatarInitial(profile?.display_name, session?.email)} size={SIZE} testID="subject-me-avatar" />
      : e.kind === 'child' ? <ChildAvatar child={e.child!} size={SIZE} />
        : <Glyph icon={e.kind === 'pregnancy' ? 'heart' : 'users'} />,
  }));
  // Profil visé pendant la transition : l'anneau s'y rend tout de suite, le contenu suit
  const activeKey = pendingKey && list.some((e) => e.key === pendingKey) ? pendingKey : list[index]?.key ?? '';

  return (
    <View testID={testID} style={[{ gap: 4 }, style]}>
      <GlassProfileSwitcher
        profiles={profiles}
        activeKey={activeKey}
        onChange={(key) => select(list.findIndex((e) => e.key === key), true)}
        onAdd={add ? () => { haptic('selection'); router.push('/journeys'); } : undefined}
        addLabel={tr('pj.switcher.add')}
        addCaption={tr('pj.bubble.add')}
        addTestID="subject-add"
        ringTestID="profile-ring"
        label={tr('ps.a11y')}
        size={SIZE}
        scrollProps={scrollProps}
        testID={`${testID}-row`}
      />
      {pager && list.length > 1 ? <ProfilePager count={list.length} index={Math.max(0, list.findIndex((e) => e.key === activeKey))} /> : null}
    </View>
  );
}

/** Indicateur de pages : un point par profil, le profil affiché en trait allongé (forme, pas la couleur seule). */
export function ProfilePager({ count, index }: { count: number; index: number }) {
  const t = useTheme();
  return (
    <View testID="profile-pager" accessibilityRole="text" accessibilityLabel={tr('ps.pagerA11y', { n: index + 1, total: count })}
      style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, height: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} testID={i === index ? 'profile-pager-active' : undefined}
          style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? t.colors.primary : t.material.lines.track }} />
      ))}
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ glissement entre profils
const SwipeCtx = createContext<{ exclude: () => void; excludedAt: SharedValue<number> } | null>(null);

/**
 * Zone à défilement horizontal (carrousel) placée dans un `ProfileSwipe` : un geste qui y commence fait défiler le
 * carrousel et ne change JAMAIS de profil.
 */
export function SwipeExclude({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const swipe = useContext(SwipeCtx);
  return <View style={style} onStartShouldSetResponderCapture={() => { swipe?.exclude(); return false; }}>{children}</View>;
}

/** Même exclusion, à poser directement sur un `ScrollView` horizontal : `<ScrollView horizontal {...useSwipeExclude()} />`. */
export function useSwipeExclude() {
  const swipe = useContext(SwipeCtx);
  return useMemo(() => ({ onStartShouldSetResponderCapture: () => { swipe?.exclude(); return false; } }), [swipe]);
}

/**
 * Enveloppe d'un écran de profil : glisser à gauche / à droite passe au profil suivant / précédent ; le contenu suit
 * légèrement le doigt, puis la transition coordonnée prend le relais (`ProfileStage` : voile frère, jamais l'opacité
 * d'un ancêtre). « Réduire les animations » : changement immédiat, sans glissement.
 */
export function ProfileSwipe({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const m = useMotion();
  const { list, index, select } = useProfileList();
  const level = useSharedValue(m.level);
  useEffect(() => { level.value = m.level; }, [m.level, level]);
  const tx = useSharedValue(0);
  const began = useSharedValue(0);
  const excludedAt = useSharedValue(0);
  const ctx = useMemo(() => ({ exclude: () => { excludedAt.value = Date.now(); }, excludedAt }), [excludedAt]);
  // Web : l'appui d'un bouton y part de l'événement « click », émis même après un glissement à la souris → on l'arrête
  // en phase de capture pendant la demi-seconde qui suit un glissement (sur iOS / Android, le geste natif annule déjà
  // l'appui en cours : rien à faire)
  const swipedAt = useSharedValue(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const guard = (e: Event) => { if (Date.now() - swipedAt.value < 500) { e.stopPropagation(); e.preventDefault(); } };
    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [swipedAt]);

  // L'entrée du nouveau profil (voile + décalage) est celle de `ProfileStage` : ici, seulement le suivi du doigt

  // Déclarées dans le composant (jamais dans le worklet) : confiées à scheduleOnRN à la fin du geste
  const count = list.length;
  const goNext = () => select(neighbourIndex(count, index, 1));
  const goPrev = () => select(neighbourIndex(count, index, -1));

  const pan = Gesture.Pan()
    .enabled(count > 1)
    // défilement vertical prioritaire ; bord gauche laissé au geste de retour iOS
    .activeOffsetX([-SWIPE.activeX, SWIPE.activeX])
    .failOffsetY([-SWIPE.failY, SWIPE.failY])
    .hitSlop({ left: -SWIPE.edge })
    .onBegin(() => { began.value = Date.now(); })
    .onStart(() => { swipedAt.value = Date.now(); })
    .onUpdate((e) => {
      if (excludedAt.value > began.value - 400 || level.value !== 'full') return;
      tx.value = e.translationX * 0.3;
    })
    .onEnd((e) => {
      const blocked = excludedAt.value > began.value - 400;
      const dir = blocked ? 0 : swipeDirection(e.translationX, e.velocityX);
      if (dir === 1) scheduleOnRN(goNext);
      else if (dir === -1) scheduleOnRN(goPrev);
      swipedAt.value = Date.now();
      tx.value = motionTiming(level.value, 0, 200, 'decelerate');
    });
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  return (
    <SwipeCtx.Provider value={ctx}>
      <GestureDetector gesture={pan} touchAction="pan-y">
        {/* Vue hôte du geste, non aplatie ; l'animation est dessous. */}
        <View testID="profile-swipe" collapsable={false}>
          <Animated.View style={[style, anim]}>{children}</Animated.View>
        </View>
      </GestureDetector>
    </SwipeCtx.Provider>
  );
}

/** Clé du profil affiché (rendu par profil : `ProfileStage profileKey`). */
export function useActiveProfileKey(): string {
  const { active } = useProfileList();
  return active?.key ?? 'none';
}
