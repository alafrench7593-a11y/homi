/**
 * Superposition de la visite guidée (montée une fois, au-dessus de la navigation, src/app/_layout.tsx).
 *
 *  - Voile assombri (`colors.overlay`) avec une DÉCOUPE autour de l'élément réel : une vue sans enfant, en position
 *    absolue, dont la bordure géante forme le voile et dont le trou arrondi est l'élément. Sa position et sa taille
 *    passent d'une cible à l'autre en ressort « panneau » sur le fil UI (Réduire les animations : pose immédiate).
 *  - Hors de la découpe (et des zones gestuelles de l'étape), quatre bandes transparentes ARRÊTENT les touchers ;
 *    l'élément ciblé reste touchable et focalisable (VoiceOver).
 *  - Bulle de verre (`Glass` variante `sheet`, opaque avec Réduire la transparence) posée au-dessous ou au-dessus de
 *    l'élément selon la place (`bubblePlacement`), jamais dessus ; elle défile si le texte est agrandi. Progression
 *    « 3 sur 7 », « Précédent », « Plus tard », « Passer », et « Quitter la visite ».
 *  - Indications gestuelles (doigt qui touche, qui glisse, qui fait glisser) : décoratives, masquées aux lecteurs
 *    d'écran, absentes avec Réduire les animations.
 *  - Élément introuvable : défilement jusqu'à lui ; sinon bulle centrée « Je ne trouve pas cet élément » + « Passer
 *    l'étape ». Écran différent : pastille compacte « Visite · 3 sur 7 — Reprendre ». Jamais de blocage : le retour
 *    système et la fermeture de l'application passent toujours (aucune modale, aucun geste capturé).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass, GLASS_TAB_BAR, GlassButton, GlassIconButton } from '@/components/glass';
import { useToast } from '@/components/Overlays';
import { useDemoInset } from '@/components/demoInset';
import { haptic, Text } from '@/components/ui';
import { motionSpring, motionTiming, useMotion, type MotionLevel } from '@/motion';
import { useUserId } from '@/lib/auth';
import { isDemo } from '@/lib/backend';
import { useMemberships } from '@/lib/data/hooks';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { toggleFavorite, toolName } from '@/lib/domain/toolCatalog';
import { onPracticeWrite } from '@/lib/practice';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { anchorEntries, measureNode, onAnchorsChange, type AnchorEntry } from './anchors';
import {
  bubblePlacement, emergencyRecent, holeFor, isEmergencyPath, isTabPath, overlayActive, rectVisible, stepAnchors, stepOnScreen, TOUR_LENGTH, TOUR_STEPS, unionRect,
  type GestureHint, type Rect, type TourStep,
} from './model';
import { lastEmergencyCall, setTourShownPath, tourDispatch, tourEvent, tourProfileCount, useTourProgress, useTourStore } from './store';
import { ToolHintBubble } from './ToolHint';
import { TourHand } from './TourHand';
import { useScreenOpen } from './TourEntry';

/** Actions du réducteur (constantes : aucune chaîne dans le JSX). */
const SKIP_STEP = { type: 'skipStep' } as const;
const FORGET_FAVORITE = { type: 'forgetFavorite' } as const;
const PAD = 6;
/** Pastille « Visite · n sur 7 » : posée au-dessus de la barre d'onglets (76) ou du pied d'un formulaire (≈ 68). */
const PILL_BOTTOM = 84;
/** En dessous de cette place, la bulle devient un bandeau d'une ligne (`STRIP_H`). */
const MIN_BUBBLE = 150;
const STRIP_H = 56;
const GAP = 12;
const VEIL = 2400;
/** Mesure de l'élément : à chaque image (≈ 30 ms) pendant `SETTLE_MS` après une étape ou un défilement, puis au repos. */
const MEASURE_FAST_MS = 32;
const MEASURE_IDLE_MS = 450;
const SETTLE_MS = 700;
/** Arrivée de la découpe : elle part de l'élément agrandi de `ARRIVE_GROW` (jamais du centre de l'écran). */
const ARRIVE_GROW = 10;
const ARRIVE_MS = 160;
/** Délai avant « Je ne trouve pas cet élément » (le temps d'un défilement et d'un chargement). */
const NOT_FOUND_MS = 2200;
const REVEAL_TRIES = 4;
const REVEAL_GAP_MS = 700;

const sameRect = (a: Rect | null, b: Rect | null) => (!a || !b ? a === b : Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1);

/**
 * Premier élément VISIBLE (sur l'écran affiché) de chaque ancre, mesuré dans le repère de la superposition. Toutes les
 * mesures partent EN MÊME TEMPS (une seule attente, au lieu d'une par élément les unes après les autres).
 */
async function measureAnchors(ids: string[], origin: { x: number; y: number }, view: { top: number; bottom: number; width: number }) {
  const found: Rect[] = [];
  const present: AnchorEntry[] = [];
  const perId = await Promise.all(ids.map(async (id) => {
    const entries = anchorEntries(id).filter((e) => e.focused());
    const rects = await Promise.all(entries.map((e) => e.measure()));
    return { entries, rects };
  }));
  for (const { entries, rects } of perId) {
    present.push(...entries.slice(0, 1));
    for (const r of rects) {
      if (!r) continue;
      const local = { x: r.x - origin.x, y: r.y - origin.y, width: r.width, height: r.height };
      if (rectVisible(local, view)) { found.push(local); break; }
    }
  }
  return { found, present };
}

/** Origine de la superposition dans la fenêtre (plein écran : 0,0) — mémorisée, remesurée en parallèle des ancres. */
let lastOrigin = { x: 0, y: 0 };
const EMPTY_GEO = { hole: null, touch: null, lost: false };
/** Nouvelle étape : l'ancienne découpe reste en place le temps de trouver la nouvelle cible (jamais de voile plein qui clignote). */
const KEEP_PREV_MS = 400;
/** Délai avant d'afficher la bulle seule pendant la recherche de l'élément (la mesure arrive d'ordinaire en 1 à 3 images). */
const SEARCH_GRACE_MS = 300;

/** Hôte : progression du compte, événements réels de l'application, superposition, pastille, aides contextuelles. */
export function TourHost() {
  const userId = useUserId();
  const setOwner = useTourStore((s) => s.setOwner);
  useEffect(() => { setOwner(userId || null); }, [userId, setOwner]);
  const progress = useTourProgress();
  const caregiverOnly = isCaregiverOnly(useMemberships().data);
  const pathname = usePathname();
  const emergency = isEmergencyPath(pathname) || emergencyRecent(lastEmergencyCall(), Date.now());
  const active = overlayActive(progress, { caregiverOnly, emergency });
  const finished = useTourStore((s) => s.finished);
  const practice = useTourStore((s) => s.practice);
  const toast = useToast();

  // ---- événements réels : navigation, catégorie ouverte, formulaire refermé
  const formOpen = useRef(false);
  useEffect(() => {
    setTourShownPath(pathname);
    tourEvent({ type: 'route', path: pathname });
    const cat = /^\/tools\/([^/]+)$/.exec(pathname);
    if (cat) tourEvent({ type: 'categoryOpened', id: cat[1] });
    if (formOpen.current && isTabPath(pathname)) { formOpen.current = false; tourEvent({ type: 'quickFormClosed' }); }
    else if (useTourStore.getState().pendingQuick && !isTabPath(pathname)) { formOpen.current = true; useTourStore.setState({ pendingQuick: false }); }
  }, [pathname]);
  // ---- profil changé dans le magasin ; favori ajouté / retiré
  useEffect(() => useUiStore.subscribe((s, prev) => {
    if (s.subject !== prev.subject && JSON.stringify(s.subject) !== JSON.stringify(prev.subject)) tourEvent({ type: 'profileChanged' });
    if (s.toolFavorites !== prev.toolFavorites) {
      const added = s.toolFavorites.find((x) => !prev.toolFavorites.includes(x));
      const removed = prev.toolFavorites.find((x) => !s.toolFavorites.includes(x));
      if (added) tourEvent({ type: 'favoriteChanged', id: added, on: true });
      else if (removed) tourEvent({ type: 'favoriteChanged', id: removed, on: false });
    }
  }), []);
  // ---- exercice : chaque écriture interceptée est dite (une fois par seconde au plus)
  useEffect(() => {
    let last = 0;
    return onPracticeWrite(() => { if (Date.now() - last > 1000) { last = Date.now(); toast(tr('tour.practice.done'), 'success'); } });
  }, [toast]);
  // La visite se ferme d'elle-même pendant une urgence ou pour un compte nounou (rien n'est perdu : « Plus tard »)
  useEffect(() => { if (progress.status === 'running' && (caregiverOnly || emergency)) tourDispatch({ type: 'later' }); }, [progress.status, caregiverOnly, emergency]);

  // Écran recouvert par l'écran Premium (verrouillage strict) : la visite ne s'y pose pas ; elle attend (« Plus tard »)
  const open = useScreenOpen(pathname);
  const step = active && open ? TOUR_STEPS[progress.step] : null;
  useEffect(() => { if (active && !open && TOUR_STEPS[progress.step] && stepOnScreen(TOUR_STEPS[progress.step], pathname)) tourDispatch({ type: 'later' }); }, [active, open, progress.step, pathname]);
  return (
    <>
      {step && stepOnScreen(step, pathname) ? <Spotlight step={step} index={progress.step} path={pathname} /> : null}
      {step && !stepOnScreen(step, pathname) && !(practice && !isTabPath(pathname)) ? <TourPill index={progress.step} step={step} /> : null}
      {finished && !emergency ? <TourFinished /> : null}
      {!emergency ? <ToolHintBubble /> : null}
    </>
  );
}

// ------------------------------------------------------------------------------------------------ superposition
function Spotlight({ step, index, path }: { step: TourStep; index: number; path: string }) {
  const t = useTheme();
  const m = useMotion();
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const demoInset = useDemoInset();
  const rootRef = useRef<View>(null);
  const [frame, setFrame] = useState({ width: win.width, height: win.height });
  // Découpe, zone touchable et « introuvable » dans UN état : une mesure = au plus un rendu (jamais deux à la suite)
  const [geo, setGeo] = useState<{ hole: Rect | null; touch: Rect | null; lost: boolean }>(EMPTY_GEO);
  const { hole, touch, lost } = geo;
  // Recherche de l'élément : la bulle (progression, Plus tard, Passer) apparaît seule après `SEARCH_GRACE_MS` si la
  // découpe n'est toujours pas là — jamais posée au centre puis déplacée quand la mesure arrive tout de suite
  const [waited, setWaited] = useState(false);
  useEffect(() => { setWaited(false); const id = setTimeout(() => setWaited(true), SEARCH_GRACE_MS); return () => clearTimeout(id); }, [index, path]);
  const revealed = useRef(0);
  const lastReveal = useRef(0);
  const settleFrom = useRef(Date.now());
  /** Défilement jusqu'à l'élément : 4 essais au plus, espacés (on ne relance pas pendant un défilement animé). */
  const tryReveal = async (e: AnchorEntry) => {
    const now = Date.now();
    if (revealed.current >= REVEAL_TRIES || now - lastReveal.current < REVEAL_GAP_MS) return;
    revealed.current++;
    lastReveal.current = now;
    settleFrom.current = now; // la découpe suit le défilement image par image
    await e.reveal();
  };
  // Nouvelle étape : la découpe GLISSE de l'ancienne cible à la nouvelle (même vue, pas de remontage)
  useEffect(() => {
    revealed.current = 0; lastReveal.current = 0; settleFrom.current = Date.now();
    setGeo((g) => (g.lost || g.touch ? { hole: g.hole, touch: null, lost: false } : g));
  }, [index, path]);
  const ids = useMemo(() => stepAnchors(step, path), [step, path]);
  const touchIds = useMemo(() => (step.touch ?? []), [step]);

  // ---- mesure de l'élément réel : tout de suite, puis à chaque image pendant l'arrivée (défilement, chargement),
  //      puis au repos ; et à chaque changement d'une ancre (onLayout)
  useEffect(() => {
    let alive = true;
    const started = Date.now();
    let busy = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = async () => {
      if (busy) return;
      busy = true;
      try { await measure(); } finally { busy = false; }
    };
    const loop = () => {
      void run().then(() => {
        if (!alive) return;
        timer = setTimeout(loop, Date.now() - settleFrom.current < SETTLE_MS ? MEASURE_FAST_MS : MEASURE_IDLE_MS);
      });
    };
    const measure = async () => {
      // Zone utile : sous la zone sûre et la pastille « Démo » ; au-dessus de la barre d'onglets sur un onglet
      const dock = isTabPath(path) ? GLASS_TAB_BAR.height + GLASS_TAB_BAR.inset * 2 + GLASS_TAB_BAR.floatGap + insets.bottom : 0;
      const targetsDock = ids.includes('quick-add');
      const view = { top: insets.top + demoInset + 4, bottom: frame.height - (targetsDock ? 4 : dock), width: frame.width };
      // origine, éléments et zones gestuelles mesurés ensemble (l'origine précédente sert tant que la nouvelle n'est pas là)
      const [o, main, extra] = await Promise.all([
        measureNode(rootRef.current as never),
        measureAnchors(ids, lastOrigin, view),
        touchIds.length ? measureAnchors(touchIds, lastOrigin, view) : Promise.resolve(null),
      ]);
      if (!alive) return;
      if (o && (Math.abs(o.x - lastOrigin.x) > 0.5 || Math.abs(o.y - lastOrigin.y) > 0.5)) { lastOrigin = { x: o.x, y: o.y }; return measure(); }
      const { found, present } = main;
      const u = unionRect(found);
      // Plusieurs éléments (prochaine action + actions rapides) : jamais plus de 55 % de l'écran découpé
      // (et jamais sous la barre d'onglets : elle reste hors de la découpe)
      const clamped = u ? { ...u, height: Math.max(24, Math.min(u.height, frame.height * 0.55, view.bottom - PAD - u.y)) } : null;
      const next = clamped ? holeFor(clamped, PAD, frame) : null;
      const tu = extra ? unionRect([...(next ? [next] : []), ...extra.found]) : null;
      const notFound = !next && Date.now() - started > NOT_FOUND_MS && (!present.length || revealed.current >= REVEAL_TRIES);
      setGeo((g) => {
        const nh = next ?? (notFound || Date.now() - started > KEEP_PREV_MS ? null : g.hole);
        const lostNow = next ? false : notFound || g.lost;
        return sameRect(g.hole, nh) && sameRect(g.touch, tu) && g.lost === lostNow ? g : { hole: nh, touch: tu, lost: lostNow };
      });
      if (next) {
        // Un seul élément, à moitié sous la barre d'onglets ou sous l'en-tête : on le remonte au tiers de l'écran
        const cut = u && (u.y + u.height + PAD > view.bottom || u.y - PAD < view.top);
        if (cut && ids.length === 1 && present.length) await tryReveal(present[0]);
        return;
      }
      // Élément présent mais hors champ : on fait défiler son écran jusqu'à lui (une fois)
      if (present.length) await tryReveal(present[0]);
    };
    loop();
    const off = onAnchorsChange(() => { settleFrom.current = Date.now(); void run(); });
    return () => { alive = false; if (timer) clearTimeout(timer); off(); };
  }, [ids, touchIds, frame, insets.top, insets.bottom, demoInset, path]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- annonce (VoiceOver / TalkBack) : compteur, titre et texte de l'étape
  const copy = useStepCopy(step, path);
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(`${tr('tour.progressA11y', { n: index + 1, total: TOUR_LENGTH })}. ${copy.title}. ${copy.body}`);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const top = insets.top + demoInset + spacing.xs;
  const bottom = frame.height - Math.max(insets.bottom, spacing.sm);
  const region = touch ?? hole;
  return (
    <View ref={rootRef} pointerEvents="box-none" style={StyleSheet.absoluteFill} testID="tour-overlay"
      onLayout={(e) => { const { width, height } = e.nativeEvent.layout; setFrame((f) => (f.width === width && f.height === height ? f : { width, height })); }}>
      {hole || lost ? <Cutout hole={lost ? null : hole} lost={lost} frame={frame} level={m.level} /> : null}
      {/* Touchers arrêtés HORS de l'élément (et des zones gestuelles de l'étape) ; sans élément : tout l'écran */}
      {hole || lost ? <Blockers region={lost ? null : region} frame={frame} /> : null}
      {hole && !lost && step.gesture && !m.off ? <HandHint kind={step.gesture} hole={hole} level={m.level} /> : null}
      {/* La bulle n'apparaît qu'avec sa découpe (ou « introuvable ») : jamais posée au centre puis déplacée */}
      {hole || lost || waited ? <Bubble step={step} index={index} copy={copy} hole={lost ? null : hole} lost={lost} top={top} bottom={bottom} width={frame.width} /> : null}
    </View>
  );
}

/**
 * Voile + découpe : une vue SANS ENFANT en position absolue (seule exception admise à l'animation de taille).
 *  - première pose (reprise, lancement) : la découpe naît SUR l'élément, agrandie de 10 px, et se resserre en 160 ms
 *    (ease-out) pendant que le voile apparaît en fondu — jamais un trou qui grandit depuis le centre de l'écran ;
 *  - d'une étape à l'autre : elle glisse en ressort « panneau » ;
 *  - Réduire les animations : posée immédiatement, voile sans fondu.
 */
function Cutout({ hole, lost, frame, level }: { hole: Rect | null; lost: boolean; frame: { width: number; height: number }; level: MotionLevel }) {
  const t = useTheme();
  // Montée seulement quand la cible est connue (ou introuvable) : la première image porte DÉJÀ la découpe sur
  // l'élément (agrandie de 10 px, ou exacte avec Réduire les animations) — aucune image d'attente.
  const g0 = level === 'off' ? 0 : ARRIVE_GROW;
  const start = hole ? { x: hole.x - g0, y: hole.y - g0, width: hole.width + g0 * 2, height: hole.height + g0 * 2 } : { x: frame.width / 2, y: frame.height / 2, width: 0, height: 0 };
  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const w = useSharedValue(start.width);
  const h = useSharedValue(start.height);
  const shown = useSharedValue(level === 'off' ? 1 : 0);
  const placed = useRef(false);
  useEffect(() => {
    if (!hole) {
      if (lost) {
        x.value = frame.width / 2; y.value = frame.height / 2; w.value = 0; h.value = 0;
        shown.value = motionTiming(level, 1, ARRIVE_MS, 'decelerate');
      }
      return;
    }
    if (!placed.current) {
      // première pose : sur l'élément, légèrement agrandie, puis resserrée
      placed.current = true;
      x.value = motionTiming(level, hole.x, ARRIVE_MS, 'decelerate');
      y.value = motionTiming(level, hole.y, ARRIVE_MS, 'decelerate');
      w.value = motionTiming(level, hole.width, ARRIVE_MS, 'decelerate');
      h.value = motionTiming(level, hole.height, ARRIVE_MS, 'decelerate');
      shown.value = motionTiming(level, 1, ARRIVE_MS, 'decelerate');
      return;
    }
    shown.value = motionTiming(level, 1, ARRIVE_MS, 'decelerate');
    x.value = motionSpring(level, hole.x, 'panneau');
    y.value = motionSpring(level, hole.y, 'panneau');
    w.value = motionSpring(level, hole.width, 'panneau');
    h.value = motionSpring(level, hole.height, 'panneau');
  }, [hole, lost, frame.width, frame.height, level, x, y, w, h, shown]);
  useEffect(() => () => { cancelAnimation(x); cancelAnimation(y); cancelAnimation(w); cancelAnimation(h); cancelAnimation(shown); }, [x, y, w, h, shown]);
  const veil = useAnimatedStyle(() => {
    const r = Math.max(0, Math.min(radius.lg, w.value / 2, h.value / 2));
    return { opacity: shown.value, left: x.value - VEIL, top: y.value - VEIL, width: w.value + VEIL * 2, height: h.value + VEIL * 2, borderRadius: VEIL + r };
  });
  const ring = useAnimatedStyle(() => {
    const r = Math.max(0, Math.min(radius.lg, w.value / 2, h.value / 2));
    return { left: x.value - 2, top: y.value - 2, width: w.value + 4, height: h.value + 4, borderRadius: r + 2, opacity: w.value > 4 ? shown.value : 0 };
  });
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      <Animated.View testID="tour-veil" style={[{ position: 'absolute', borderWidth: VEIL, borderColor: t.colors.overlay }, veil]} />
      <Animated.View testID="tour-hole" style={[{ position: 'absolute', borderWidth: 2, borderColor: t.colors.primary }, ring]} />
    </View>
  );
}

/** Quatre bandes transparentes autour de la zone touchable : le reste de l'écran ne réagit pas. */
function Blockers({ region, frame }: { region: Rect | null; frame: { width: number; height: number } }) {
  const block = { position: 'absolute' as const };
  if (!region) return <View testID="tour-block" style={StyleSheet.absoluteFill} />;
  const r = { x: Math.max(0, region.x), y: Math.max(0, region.y), right: Math.min(frame.width, region.x + region.width), bottom: Math.min(frame.height, region.y + region.height) };
  return (
    <>
      <View testID="tour-block-top" style={[block, { left: 0, right: 0, top: 0, height: r.y }]} />
      <View testID="tour-block-bottom" style={[block, { left: 0, right: 0, top: r.bottom, bottom: 0 }]} />
      <View testID="tour-block-left" style={[block, { left: 0, width: r.x, top: r.y, height: r.bottom - r.y }]} />
      <View testID="tour-block-right" style={[block, { left: r.right, right: 0, top: r.y, height: r.bottom - r.y }]} />
    </>
  );
}

/**
 * Main dessinée (`TourHand`) : touche le centre de l'élément, glisse en courbe sur sa largeur (changer de profil) ou
 * fait glisser vers le bas (réordonner). Fil UI, en boucle ; jamais avec Réduire les animations.
 */
function HandHint({ kind, hole, level }: { kind: GestureHint; hole: Rect; level: MotionLevel }) {
  const span = kind === 'swipe' ? Math.min(hole.width * 0.5, 160) : kind === 'drag' ? Math.min(90, hole.height + 60) : 0;
  const point = { x: hole.x + hole.width / 2, y: hole.y + hole.height / 2 };
  return <TourHand kind={kind} point={point} span={span} level={level} />;
}

// ------------------------------------------------------------------------------------------------ textes
const STEP_KEY: Record<TourStep['id'], string> = { home: 'home', profile: 'profile', tools: 'tools', quick: 'quick', favorite: 'favorite', agenda: 'agenda', customize: 'customize' };
function useStepCopy(step: TourStep, path: string): { title: string; body: string } {
  const k = STEP_KEY[step.id];
  const single = step.id === 'profile' && singleProfile();
  const bodyKey = step.id === 'tools' && path === '/tools' ? 'tour.step.tools.bodySearch'
    : step.id === 'quick' && isDemo ? 'tour.step.quick.bodyDemo'
      : single ? 'tour.step.profile.bodySingle' : `tour.step.${k}.body`;
  return { title: tr(`tour.step.${k}.title` as TKey), body: tr(bodyKey as TKey) };
}
/** Un seul profil dans le sélecteur : on ne peut pas en changer, l'étape avance au bouton. */
const singleProfile = () => tourProfileCount() < 2;

// ------------------------------------------------------------------------------------------------ bulle
function Bubble({ step, index, copy, hole, lost, top, bottom, width }: {
  step: TourStep; index: number; copy: { title: string; body: string }; hole: Rect | null; lost: boolean; top: number; bottom: number; width: number;
}) {
  const t = useTheme();
  const m = useMotion();
  const practice = useTourStore((s) => s.practice);
  const setPractice = useTourStore((s) => s.setPractice);
  const [h, setH] = useState(0);
  const place = bubblePlacement({ hole, bubbleH: h || 220, top, bottom, gap: GAP });
  const maxW = Math.min(width - spacing.md * 2, 420);
  const narrow = width < 360;
  const left = (width - maxW) / 2;
  // Entrée : glissé léger depuis l'élément (transform seul : jamais l'opacité d'un ancêtre du verre)
  const ty = useSharedValue(m.off ? 0 : place.side === 'above' ? -10 : 10);
  useEffect(() => { if (!m.off) ty.value = 8; ty.value = motionSpring(m.level, 0, 'panneau'); }, [index, m.level, ty]);
  const enter = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const manual = step.advance === 'manual' || (step.id === 'profile' && singleProfile());
  const go = (a: Parameters<typeof tourDispatch>[0]) => { haptic('selection'); tourDispatch(a); };

  // Ni au-dessus ni au-dessous il n'y a la place d'une bulle (petit écran, élément haut : recherche + résultats) :
  // bandeau compact sur une ligne, posé là où il ne recouvre pas l'élément (en bas, sur la barre d'onglets, sinon en
  // haut). Le texte complet reste annoncé aux lecteurs d'écran ; « Plus tard », « Passer » et « Quitter » y restent.
  if (hole && place.maxH < MIN_BUBBLE) {
    const stripTop = hole.y + hole.height + 4 > bottom - STRIP_H ? top : bottom - STRIP_H;
    return (
      <Animated.View testID="tour-bubble" pointerEvents="box-none" style={[{ position: 'absolute', left, width: maxW, top: stripTop, height: STRIP_H }, enter]}>
        <Glass variant="sheet" radius={radius.lg} accessibilityLiveRegion="polite"
          contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingLeft: spacing.sm, height: STRIP_H }}>
          <Text variant="caption" weight="bold" color={t.colors.primary} testID="tour-progress" accessibilityLabel={tr('tour.progressA11y', { n: index + 1, total: TOUR_LENGTH })}>
            {tr('tour.progress', { n: index + 1, total: TOUR_LENGTH })}
          </Text>
          <Text variant="small" weight="bold" numberOfLines={2} style={{ flex: 1, minWidth: 0 }} testID="tour-title" accessibilityLabel={`${copy.title}. ${copy.body}`}>{copy.title}</Text>
          <GlassIconButton icon="pause" label={tr('tour.later')} plain size={44} onPress={() => go({ type: 'later' })} testID="tour-later" />
          <GlassIconButton icon="skip-forward" label={tr('tour.skip')} plain size={44} onPress={() => go(SKIP_STEP)} testID="tour-skip" />
          <GlassIconButton icon="x" label={tr('tour.quit')} plain size={44} onPress={() => go({ type: 'quit' })} testID="tour-quit" />
        </Glass>
      </Animated.View>
    );
  }

  return (
    <Animated.View testID="tour-bubble" pointerEvents="box-none"
      style={[{ position: 'absolute', left, width: maxW, top: place.y, maxHeight: Math.max(160, place.maxH) }, enter]}>
      <Glass variant="sheet" radius={radius.xl} style={{ maxHeight: Math.max(160, place.maxH) }} accessibilityLiveRegion="polite">
        <ScrollView bounces={false} showsVerticalScrollIndicator contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}
          onContentSizeChange={(_w, ch) => { const v = Math.ceil(ch); if (Math.abs(v - h) > 1) setH(v); }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text variant="caption" weight="bold" color={t.colors.primary} testID="tour-progress" accessibilityLabel={tr('tour.progressA11y', { n: index + 1, total: TOUR_LENGTH })}>
              {tr('tour.progress', { n: index + 1, total: TOUR_LENGTH })}
            </Text>
            <ProgressBar index={index} />
            <GlassIconButton icon="x" label={tr('tour.quit')} plain size={44} onPress={() => go({ type: 'quit' })} testID="tour-quit" />
          </View>
          <Text weight="bold" accessibilityRole="header" testID="tour-title">{lost ? tr('tour.notFoundTitle') : copy.title}</Text>
          <Text variant="small" testID="tour-body">{lost ? tr('tour.notFound') : copy.body}</Text>
          {lost ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <GlassButton label={tr('tour.notFoundSkip')} variant="primary" size="sm" onPress={() => go(SKIP_STEP)} testID="tour-notfound-skip" />
              <GlassButton label={tr('tour.goThere')} variant="secondary" size="sm" onPress={() => router.navigate(step.goTo as never)} testID="tour-goto" />
            </View>
          ) : step.consent ? (
            <View style={{ gap: spacing.xs }}>
              {practice ? <Text variant="small" weight="bold" color={t.colors.primary} testID="tour-practice-on">{tr('tour.practice.banner')}</Text> : (
                <GlassButton label={tr('tour.step.quick.practice')} icon="shield" variant="primary" size="sm" full onPress={() => { haptic('selection'); setPractice(true); }} testID="tour-practice" />
              )}
              <GlassButton label={tr('tour.step.quick.skip')} variant="secondary" size="sm" full onPress={() => go(SKIP_STEP)} testID="tour-skip-step" />
            </View>
          ) : manual ? (
            <GlassButton label={tr('tour.next')} variant="primary" size="sm" full onPress={() => go({ type: 'next' })} testID="tour-next" />
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', columnGap: spacing.xs }}>
            {/* Écran étroit : « Précédent » en flèche seule (nom accessible conservé), les trois actions tiennent sur une ligne */}
            {index > 0 ? (narrow
              ? <GlassIconButton icon="arrow-left" label={tr('tour.prev')} plain size={44} onPress={() => go({ type: 'back' })} testID="tour-prev" />
              : <GlassButton label={tr('tour.prev')} icon="arrow-left" variant="tertiary" size="sm" onPress={() => go({ type: 'back' })} testID="tour-prev" />) : <View />}
            <View style={{ flexDirection: 'row', gap: spacing.xxs }}>
              <GlassButton label={tr('tour.later')} variant="tertiary" size="sm" onPress={() => go({ type: 'later' })} testID="tour-later" />
              <GlassButton label={tr('tour.skip')} variant="tertiary" size="sm" onPress={() => go(SKIP_STEP)} testID="tour-skip" />
            </View>
          </View>
        </ScrollView>
      </Glass>
    </Animated.View>
  );
}

/** Barre de progression : un trait par étape (faite / en cours / à venir), la forme porte l'état (pas la couleur seule). */
function ProgressBar({ index }: { index: number }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 3, alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      {TOUR_STEPS.map((s, i) => (
        <View key={s.id} style={{ flex: i === index ? 2 : 1, height: i === index ? 6 : 4, borderRadius: 3, backgroundColor: i <= index ? t.colors.primary : t.material.lines.track }} />
      ))}
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ pastille
/** Visite en cours, autre écran : pastille compacte en haut (n'arrête aucun toucher). */
function TourPill({ index, step }: { index: number; step: TourStep }) {
  const insets = useSafeAreaInsets();
  return (
    // En bas, au-dessus de la barre d'onglets ou du bouton d'action d'un formulaire (jamais sur l'en-tête et ses boutons)
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, spacing.xs) + PILL_BOTTOM, alignItems: 'center' }} testID="tour-pill">
      <Glass variant="chrome" radius={radius.pill} contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingLeft: spacing.sm, paddingRight: 4, minHeight: 44 }}>
        <Text variant="caption" weight="bold" accessibilityLabel={tr('tour.progressA11y', { n: index + 1, total: TOUR_LENGTH })}>{tr('tour.pill', { n: index + 1, total: TOUR_LENGTH })}</Text>
        <GlassButton label={tr('tour.pillResume')} variant="tertiary" size="sm" onPress={() => router.navigate(step.goTo as never)} testID="tour-pill-resume" />
        <GlassIconButton icon="pause" label={tr('tour.later')} plain size={44} onPress={() => tourDispatch({ type: 'later' })} testID="tour-pill-later" />
      </Glass>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ fin
function TourFinished() {
  const t = useTheme();
  const m = useMotion();
  const progress = useTourProgress();
  const close = useTourStore((s) => s.closeFinished);
  const favIds = useUiStore((s) => s.toolFavorites);
  const setFavIds = useUiStore((s) => s.setToolFavorites);
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const short = win.height < 700;
  const fav = progress.favoriteAdded && favIds.includes(progress.favoriteAdded) ? progress.favoriteAdded : null;
  const [editor, setEditor] = useState<Rect | null>(null);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const e = anchorEntries('home-editor').find((x) => x.focused());
      const r = e ? await e.measure() : null;
      if (alive) setEditor((cur) => (sameRect(cur, r) ? cur : r));
    };
    // l'éditeur vient de s'ouvrir sous la carte : on le remonte (une fois) pour que la liste et le doigt restent visibles
    const reveal = setTimeout(() => { void anchorEntries('home-editor').find((x) => x.focused())?.reveal(); }, 350);
    void run();
    const id = setInterval(() => { void run(); }, 500);
    return () => { alive = false; clearInterval(id); clearTimeout(reveal); };
  }, []);
  useEffect(() => { AccessibilityInfo.announceForAccessibility?.(`${tr('tour.done.title')}. ${tr('tour.done.body')}`); }, []);
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} testID="tour-done">
      {editor && !m.off ? <HandHint kind="drag" hole={{ x: editor.x, y: editor.y, width: editor.width, height: Math.min(editor.height, 160) }} level={m.level} /> : null}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: Math.max(insets.bottom, spacing.sm) + spacing.sm, alignItems: 'center' }}>
        {/* Petit écran (320 × 568) : carte COMPACTE — titre, consigne du geste, puis une rangée « retirer le favori »
            (étoile seule, nom accessible complet) + « Terminer » : elle laisse voir l'éditeur (≤ 30 % de l'écran) */}
        <Glass variant="sheet" radius={radius.xl} style={{ width: '100%', maxWidth: 420, maxHeight: win.height * (short ? 0.32 : 0.42) }} accessibilityLiveRegion="polite">
          <ScrollView bounces={false} contentContainerStyle={{ padding: short ? spacing.sm : spacing.md, gap: spacing.xs }}>
          <Text weight="bold" accessibilityRole="header" accessibilityLabel={`${tr('tour.done.title')}. ${tr('tour.done.body')}`}>{tr('tour.done.title')}</Text>
          {short && editor ? null : <Text variant="small">{tr('tour.done.body')}</Text>}
          {editor ? <Text variant="small" color={t.colors.primary} weight="bold" numberOfLines={short ? 2 : undefined} testID="tour-drag-hint">{tr('tour.done.dragHint')}</Text> : null}
          {short ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {fav ? (
                <GlassIconButton icon="star" label={tr('tour.done.removeFav', { label: toolName(fav) })} size={44} testID="tour-remove-fav"
                  onPress={() => { setFavIds(toggleFavorite(favIds, fav)); tourDispatch(FORGET_FAVORITE); }} />
              ) : null}
              <GlassButton label={tr('tour.done.finish')} variant="primary" size="sm" onPress={close} testID="tour-finish" style={{ flex: 1 }} />
            </View>
          ) : (
            <>
              {fav ? (
                <GlassButton label={tr('tour.done.removeFav', { label: toolName(fav) })} icon="star" variant="secondary" size="sm" full testID="tour-remove-fav"
                  onPress={() => { setFavIds(toggleFavorite(favIds, fav)); tourDispatch(FORGET_FAVORITE); }} />
              ) : null}
              <GlassButton label={tr('tour.done.finish')} variant="primary" size="sm" full onPress={close} testID="tour-finish" />
            </>
          )}
          </ScrollView>
        </Glass>
      </View>
    </View>
  );
}

