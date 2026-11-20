/**
 * Introduction de première ouverture « Je suis… » (20/11/2026) — remplace, AVANT le compte, la keynote « Découvrir
 * HOMI » (qui reste dans Réglages) et l'ancienne introduction en 8 scènes.
 *
 *  0 « Je suis… » : cinq profils (enceinte · jeune parent · parent d'un enfant · papa / coparent · je découvre) ;
 *  1-3 trois tableaux COURTS (une phrase chacun) qui montrent les vrais outils de ce profil (`IntroScenes`) ;
 *  4 « Commencer » / « J'ai déjà un compte » / « Découvrir sans compte » (+ langue, confidentialité).
 *
 * Mouvement (fil UI, Reanimated + Gesture Handler) : UNE valeur partagée `pos` (page, nombre réel) pilote tout —
 * glissement + fondu des tableaux, cascade des éléments (`Layer`, parallaxe par profondeur), pastille de progression
 * qui suit le doigt. Balayage horizontal : le tableau suit le doigt, relâché il se pose en ressort avec la vitesse du
 * geste (seuil : un tiers de la largeur ou un lancer). React n'est mis à jour qu'à l'arrivée (un `scheduleOnRN` par
 * geste, jamais par image). « Passer » à tout moment. Réduire les animations / économie d'énergie : pages posées
 * immédiatement, aucune parallaxe ni cascade, aucune boucle. Poids : composants et SVG, aucune image, aucune vidéo.
 * Règles worklets : aucun paramètre par défaut lisant la fermeture, aucune fonction déclarée dans un worklet confiée à
 * `scheduleOnRN` (`settle` est déclarée dans le composant), aucune ref lue dans un worklet.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, ReduceMotion, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandStack, BrandWordmark } from '@/components/BrandLogo';
import { useTopInset } from '@/components/demoInset';
import { Tappable } from '@/components/Tappable';
import { Button, haptic, Icon, Text } from '@/components/ui';
import { HomiIcon, type HomiIconName } from '@/brand/icons';
import { getLocale, isRTL, t as tr, type TKey } from '@/i18n';
import { availableLocales } from '@/i18n/locales';
import { ExampleBadge } from '@/features/onboarding/kit';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing, typography } from '@/theme/tokens';
import { IntroLayerContext, Layer, SceneView } from './IntroScenes';
import { clampPage, INTRO_PAGES, INTRO_PROFILES, INTRO_SCENES, LAST_PAGE, swipeTarget, type IntroProfile } from './model';

const PROFILE_GLYPH: Record<IntroProfile, HomiIconName> = { pregnant: 'pregnancy', newborn: 'feeding', child: 'child', coparent: 'couple', explore: 'tools' };
const SPRING = { damping: 30, stiffness: 280, mass: 1 } as const;
/** Progression : une case de 16 pt par page, un point de 6 pt centré ; la pastille couvre la case de la page vue. */
const SLOT = 16;
const DOT = 6;

export interface IntroFlowProps {
  /** Page de départ (`?scene=start` : la dernière, après un changement de langue). */
  initialPage?: number;
  initialProfile?: IntroProfile | null;
  onProfile: (p: IntroProfile) => void;
  onLeave: (to: 'sign-up' | 'sign-in' | 'demo') => void;
  onLanguage: (code: string) => void;
  demoBusy?: boolean;
}

export function IntroFlow({ initialPage = 0, initialProfile = null, onProfile, onLeave, onLanguage, demoBusy }: IntroFlowProps) {
  const t = useTheme();
  const m = useMotion();
  const insets = useSafeAreaInsets();
  const top = useTopInset();
  const win = useWindowDimensions();
  const rtl = isRTL();
  const dir = rtl ? -1 : 1;
  const short = win.height < 640;
  const [profile, setProfile] = useState<IntroProfile | null>(initialProfile);
  const [page, setPage] = useState(() => clampPage(initialPage));
  const [width, setWidth] = useState(win.width);
  // Entrée de la toute première page : elle glisse d'un tiers de page (cascade), sauf animations réduites
  const pos = useSharedValue(m.off ? clampPage(initialPage) : clampPage(initialPage) - 0.3);
  const hasProfile = useSharedValue(initialProfile ? 1 : 0);
  useEffect(() => { pos.value = m.off ? page : withSpring(page, { ...SPRING, reduceMotion: ReduceMotion.Never }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Arrivée sur une page (bouton, choix, geste) : React n'est mis à jour qu'ici. */
  const settle = useCallback((n: number) => {
    setPage((cur) => (cur === n ? cur : n));
  }, []);
  const go = useCallback((n: number) => {
    const next = clampPage(n);
    haptic('selection');
    // saut de plusieurs pages (« Passer ») : la page visée arrive d'un tiers de page, sans traverser les autres
    if (!m.off && Math.abs(next - page) > 1) pos.value = next - 0.35 * Math.sign(next - page);
    pos.value = m.off ? next : withSpring(next, { ...SPRING, reduceMotion: ReduceMotion.Never });
    settle(next);
  }, [m.off, pos, settle, page]);

  // Un balayage qui commence sur une carte de profil ne la choisit pas (le web ne retire pas l'appui au geste)
  const dragAt = useRef(0);
  const markDrag = useCallback(() => { dragAt.current = Date.now(); }, []);
  const choose = (p: IntroProfile) => {
    if (Date.now() - dragAt.current < 500) return;
    setProfile(p);
    hasProfile.value = 1;
    onProfile(p);
    go(1);
  };

  // Annonce de la page (lecteurs d'écran)
  const title = page === 0 ? tr('intro6.who.title') : page === LAST_PAGE ? tr('intro6.end.title') : profile ? tr(`intro6.s.${INTRO_SCENES[profile][page - 1]}` as TKey) : '';
  useEffect(() => { if (title) AccessibilityInfo.announceForAccessibility?.(title); }, [title]);

  // ---- balayage horizontal (fil UI)
  const off = m.off;
  const start = useSharedValue(0);
  const pan = useMemo(() => Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onBegin(() => { start.value = pos.value; })
    // un seul aller-retour vers React par geste (à l'activation), jamais par image
    .onStart(() => { scheduleOnRN(markDrag); })
    .onUpdate((e) => {
      if (off) return;
      const raw = start.value - (e.translationX * dir) / Math.max(1, width);
      // bords (et « Je suis… » sans profil) : résistance élastique
      const max = hasProfile.value ? LAST_PAGE : 0;
      pos.value = raw < 0 ? raw * 0.25 : raw > max ? max + (raw - max) * 0.25 : raw;
    })
    .onEnd((e) => {
      const from = Math.round(start.value);
      const target = swipeTarget({ page: from, dx: e.translationX, vx: e.velocityX, width, rtl, hasProfile: hasProfile.value === 1 });
      pos.value = off ? target : withSpring(target, { ...SPRING, velocity: (-e.velocityX * dir) / Math.max(1, width), reduceMotion: ReduceMotion.Never });
      scheduleOnRN(settle, target);
    }), [off, dir, width, rtl, pos, start, hasProfile, settle, markDrag]);

  // ---- pastille de progression : suit `pos` (et donc le doigt)
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: Math.max(0, Math.min(LAST_PAGE, pos.value)) * SLOT * dir }] }));

  const footer = (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.sm, paddingTop: spacing.xs, gap: spacing.xs }}>
      {page === LAST_PAGE ? (
        <>
          <Button label={tr('welcome.start')} size="lg" full iconRight={rtl ? 'arrow-left' : 'arrow-right'} onPress={() => onLeave('sign-up')} testID="intro-start" />
          <Button label={tr('e5.welcome.haveAccount')} variant="secondary" full onPress={() => onLeave('sign-in')} testID="intro-sign-in" />
          <Button label={tr('welcome.demo')} variant="ghost" full loading={demoBusy} onPress={() => onLeave('demo')} testID="intro-demo" />
        </>
      ) : page === 0 ? (
        <Button label={tr('e5.welcome.haveAccount')} variant="ghost" full onPress={() => onLeave('sign-in')} testID="intro-sign-in-early" />
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {/* Précédent : flèche seule (nom accessible complet) — rien ne se coupe à 320 pt */}
          <Button label="" accessibilityLabel={tr('common.back')} icon={rtl ? 'arrow-right' : 'arrow-left'} variant="secondary" onPress={() => go(page - 1)} style={{ width: 56, flexGrow: 0, flexShrink: 0 }} testID="intro-prev" />
          <Button label={tr('common.next')} iconRight={rtl ? 'arrow-left' : 'arrow-right'} onPress={() => go(page + 1)} style={{ flex: 1 }} testID="intro-next" />
        </View>
      )}
    </View>
  );

  const pages = Array.from({ length: INTRO_PAGES }, (_, i) => i).filter((i) => Math.abs(i - page) <= 1);
  return (
    <View style={{ flex: 1 }} testID="intro">
      {/* haut : progression + Passer */}
      <View style={{ paddingTop: top + spacing.xs, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: MIN_TOUCH + top }}>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={tr('intro.progress', { step: page + 1, total: INTRO_PAGES })} accessibilityValue={{ min: 1, max: INTRO_PAGES, now: page + 1 }}
          testID="intro-progress" style={{ width: INTRO_PAGES * SLOT, height: DOT, flexDirection: rtl ? 'row-reverse' : 'row' }}>
          {Array.from({ length: INTRO_PAGES }, (_, i) => (
            <View key={i} style={{ width: SLOT, alignItems: 'center' }}><View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: t.material.lines.track }} /></View>
          ))}
          {/* pastille : vue absolue sans enfant, seule à bouger (elle suit le doigt) */}
          <Animated.View style={[{ position: 'absolute', top: 0, [rtl ? 'right' : 'left']: 1, width: SLOT - 2, height: DOT, borderRadius: DOT / 2, backgroundColor: t.colors.primary }, pill]} />
        </View>
        {page < LAST_PAGE ? (
          <Tappable accessibilityRole="button" accessibilityLabel={tr('intro.skipA11y')} onPress={() => go(LAST_PAGE)} testID="intro-skip"
            style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: spacing.xs, alignItems: 'center', justifyContent: 'center' }}>
            <Text weight="bold" color={t.colors.primary}>{tr('intro.skip')}</Text>
          </Tappable>
        ) : <View style={{ minHeight: MIN_TOUCH }} />}
      </View>

      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, overflow: 'hidden' }} collapsable={false} onLayout={(e) => { const w = Math.round(e.nativeEvent.layout.width); if (w > 0 && w !== width) setWidth(w); }} testID="intro-stage">
          {pages.map((i) => (
            <Page key={i} index={i} width={width} dir={dir} off={m.off} pos={pos}>
              {i === 0 ? <WhoPage profile={profile} onChoose={choose} short={short} />
                : i === LAST_PAGE ? <EndPage onLanguage={onLanguage} short={short} />
                  : profile ? <TableauPage profile={profile} n={i} active={i === page} /> : null}
            </Page>
          ))}
        </View>
      </GestureDetector>
      {footer}
    </View>
  );
}

/** Une page : glisse avec `pos` (largeur entière) et s'efface en s'éloignant ; cachée aux lecteurs hors de l'écran. */
function Page({ index, width, dir, off, pos, children }: { index: number; width: number; dir: number; off: boolean; pos: SharedValue<number>; children: React.ReactNode }) {
  const a = useAnimatedStyle(() => {
    const d = index - pos.value;
    return { opacity: off ? (Math.abs(d) < 0.5 ? 1 : 0) : 1 - Math.min(1, Math.abs(d)) * 0.85, transform: [{ translateX: off ? (Math.abs(d) < 0.5 ? 0 : width * 2) : d * width * dir }] };
  });
  const ctx = useMemo(() => ({ pos, page: index, width, dir, off }), [pos, index, width, dir, off]);
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width, bottom: 0 }, a]} testID={`intro-page-${index}`}>
      <IntroLayerContext.Provider value={ctx}>{children}</IntroLayerContext.Provider>
    </Animated.View>
  );
}

/** Page 0 — « Je suis… » : le logo, une phrase, cinq profils. */
function WhoPage({ profile, onChoose, short }: { profile: IntroProfile | null; onChoose: (p: IntroProfile) => void; short: boolean }) {
  const t = useTheme();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: short ? spacing.sm : spacing.md }} showsVerticalScrollIndicator={false}>
      <Layer depth={0}><BrandWordmark height={short ? 26 : 32} testID="intro-brand" /></Layer>
      <Layer depth={0.6}>
        <Text accessibilityRole="header" style={[typography.display, { fontSize: short ? 26 : 30, lineHeight: short ? 32 : 36, color: t.colors.text }]} testID="intro-who-title">{tr('intro6.who.title')}</Text>
        <Text muted style={{ marginTop: 4 }}>{tr('intro6.who.lead')}</Text>
      </Layer>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.xs }}>
        {INTRO_PROFILES.map((p, i) => {
          const on = profile === p;
          return (
            <Layer key={p} depth={1.2 + i * 0.35}>
              <Tappable accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={tr(`intro6.p.${p}` as TKey)}
                onPress={() => onChoose(p)} testID={`intro-profile-${p}`}
                style={({ pressed }) => ({ minHeight: short ? 50 : 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg,
                  backgroundColor: on ? t.colors.accentSoft : t.material.glass.inset.fill, borderWidth: 1, borderColor: on ? t.colors.primary : t.material.glass.inset.edge, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                <HomiIcon name={PROFILE_GLYPH[p]} size={26} active={on} />
                <Text weight="bold" style={{ flex: 1 }}>{tr(`intro6.p.${p}` as TKey)}</Text>
                <Icon name={isRTL() ? 'chevron-left' : 'chevron-right'} size={18} color={on ? t.colors.primary : t.colors.textMuted} />
              </Tappable>
            </Layer>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** Pages 1-3 — un tableau : une phrase, une scène de vrais composants. */
function TableauPage({ profile, n, active }: { profile: IntroProfile; n: number; active: boolean }) {
  const scene = INTRO_SCENES[profile][n - 1]!;
  const narrow = useWindowDimensions().width < 360;
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }} showsVerticalScrollIndicator={false} testID={`intro-scene-${scene}`}>
      <Layer depth={0}>
        <Text variant="label" muted>{tr(`intro6.p.${profile}` as TKey)}</Text>
        <Text variant="title" accessibilityRole="header" style={{ marginTop: 2, fontSize: narrow ? 22 : 26, lineHeight: narrow ? 28 : 32 }} testID="intro-sentence">{tr(`intro6.s.${scene}` as TKey)}</Text>
      </Layer>
      <Layer depth={0.5}><ExampleBadge label={tr('o2.example')} /></Layer>
      <View pointerEvents="none" accessibilityElementsHidden={false}>
        <SceneView scene={scene} active={active} />
      </View>
    </ScrollView>
  );
}

/** Dernière page — la marque, une phrase, la langue, la confidentialité (les trois actions sont dans le pied). */
function EndPage({ onLanguage, short }: { onLanguage: (code: string) => void; short: boolean }) {
  const t = useTheme();
  const locale = getLocale();
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: short ? spacing.sm : spacing.md }} showsVerticalScrollIndicator={false} testID="intro-scene-start">
      <Layer depth={0}><BrandStack width={short ? 96 : 170} testID="intro-end-brand" /></Layer>
      <Layer depth={0.6}><Text center accessibilityRole="header" style={[typography.display, { fontSize: short ? 22 : 28, lineHeight: short ? 28 : 34, color: t.colors.text, maxWidth: 340 }]}>{tr('intro6.end.title')}</Text></Layer>
      <Layer depth={1.2} style={{ alignSelf: 'stretch', gap: spacing.xs }}>
        <Text variant="small" weight="bold" center>{tr('intro.languageQ')}</Text>
        {/* écran court : les langues sur UNE rangée qui défile (les trois actions du pied restent au premier écran) */}
        <ScrollView horizontal={short} scrollEnabled={short} showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup"
          contentContainerStyle={short ? { gap: spacing.xs, paddingHorizontal: 2 } : { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs, flexGrow: 1 }}>
          {availableLocales().map((l) => {
            const on = l.code === locale;
            return (
              <Tappable key={l.code} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={l.native} onPress={() => onLanguage(l.code)} testID={`intro-lang-${l.code}`}
                style={({ pressed }) => ({ minHeight: MIN_TOUCH, paddingHorizontal: spacing.sm, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4,
                  backgroundColor: on ? t.colors.primary : t.material.glass.inset.fill, borderWidth: 1, borderColor: on ? t.colors.primary : t.material.glass.inset.edge, opacity: pressed ? 0.85 : 1 })}>
                {on ? <Icon name="check" size={14} color={t.colors.primaryText} /> : null}
                <Text variant="small" weight="bold" color={on ? t.colors.primaryText : t.colors.text}>{l.native}</Text>
              </Tappable>
            );
          })}
        </ScrollView>
      </Layer>
      <Layer depth={1.6}><Text variant="caption" muted center style={{ maxWidth: 340 }}>{tr('intro.privacy.body')}</Text></Layer>
    </ScrollView>
  );
}
