/**
 * SOMMEIL — « maintenant » (22/11/2026). Écran de référence du langage HOMI pour les outils de suivi :
 *
 *  1. PREMIER REGARD (verre dense, chiffres lisibles) : « Léa dort depuis 13 h 10 », la durée en chiffres de largeur
 *     fixe, où en est la sieste par rapport à sa fenêtre indicative, et la commande utile (fournie par l'écran).
 *  2. EXPLORATION : la journée de 6 h à 22 h en bande tactile. Noté = bloc plein ; fenêtre indicative = zone HACHURÉE
 *     encadrée de tirets ; rien de noté = ligne pointillée. Distinguables sans la couleur. Le doigt glisse sur la bande :
 *     la sieste la plus proche est sélectionnée (retour haptique discret), son heure, sa durée et sa note s'affichent ;
 *     « Modifier » ouvre la vraie feuille de modification. Liste équivalente juste dessous (lecteurs d'écran).
 *  3. INTERPRÉTATION : faits calculés sur l'appareil (nap-window.ts, sans appel au modèle ni crédit), siestes
 *     comparées et règle visibles ; « Analyser avec Aura » envoie ces seuls chiffres (aperçu, accord, crédits annoncés).
 *
 * Mouvement : une sieste qui vient d'être notée SE POSE à sa place (fondu + montée), le total se met à jour ; la
 * sélection suit le doigt sans retard (aucune animation sur la position) ; Réduire les animations : tout est posé.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, NATIVE_DRIVER, radius, spacing } from '@/theme/tokens';
import { napProgress, napWindow, type NapRecord, type NapWindow } from '../../../supabase/functions/_shared/nap-window';

const FROM = 6 * 60;
const TO = 22 * 60;
const MIN = 60_000;
const TICKS = [6, 9, 12, 15, 18, 21];
const minuteOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const TABULAR = { fontVariant: ['tabular-nums' as const] };

export interface NapState {
  mine: Sleep[];
  open: Sleep | null;
  lastWake: Date | null;
  today: Sleep[];
  window: NapWindow | null;
  elapsed: number;
}

/** État calculé (pur) : siestes de CET enfant seulement, sieste ouverte, fenêtre, sommeils du jour. */
export function napState(child: Child, sleeps: readonly Sleep[], now: Date): NapState {
  const mine = sleeps.filter((s) => s.child_id === child.id);
  const open = mine.filter((s) => !s.ended_at).sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null;
  const ended = mine.filter((s) => s.ended_at).sort((a, b) => b.ended_at!.localeCompare(a.ended_at!));
  const today = mine.filter((s) => sameDay(new Date(s.started_at), now) || (s.ended_at ? sameDay(new Date(s.ended_at), now) : !s.ended_at));
  return {
    mine, open,
    lastWake: !open && ended[0] ? new Date(ended[0].ended_at!) : null,
    today,
    window: open ? napWindow(mine as unknown as NapRecord[], child.id, open.started_at) : null,
    elapsed: open ? Math.max(0, Math.round((now.getTime() - Date.parse(open.started_at)) / MIN)) : 0,
  };
}

/** Durée qui avance : minute par minute, chiffres de largeur fixe (« 47 min », « 1 h 05 »). */
function useNow(live: boolean, base: Date) {
  const [now, setNow] = useState(base);
  useEffect(() => { setNow(base); }, [base]);
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, [live]);
  return now;
}

// ─── 1. Premier regard ──────────────────────────────────────────────────────────────────────────

export function NapHero({ child, state, now, actions }: { child: Child; state: NapState; now: Date; actions: React.ReactNode }) {
  const t = useTheme();
  const live = useNow(!!state.open, now);
  const elapsed = state.open ? Math.max(0, Math.round((live.getTime() - Date.parse(state.open.started_at)) / MIN)) : state.lastWake ? Math.round((live.getTime() - state.lastWake.getTime()) / MIN) : null;
  const w = state.window;
  const progress = state.open && w ? napProgress(w, elapsed ?? 0) : 'none';
  const from = state.open && w?.low != null ? clock(Date.parse(state.open.started_at) + w.low * MIN) : null;
  const to = state.open && w?.high != null ? clock(Date.parse(state.open.started_at) + w.high * MIN) : null;
  const title = state.open ? tr('nn.asleep', { name: child.first_name, time: clock(new Date(state.open.started_at)) })
    : state.lastWake ? tr('nn.awake', { time: clock(state.lastWake) }) : tr('nn.fresh');
  const status = progress === 'before' ? tr('nn.before', { from: from!, to: to! })
    : progress === 'inside' ? tr('nn.inside', { low: w!.low!, high: w!.high! })
    : progress === 'beyond' ? tr('nn.beyond', { low: w!.low!, high: w!.high! }) : null;
  return (
    // Planche 1 du brief client : UNE donnée en grand, centrée, la période juste dessous, puis l'action
    <Glass variant="card" radius={radius.xl} testID="nap-hero" contentStyle={{ padding: spacing.lg, gap: spacing.sm, alignItems: 'center' }}>
      <Text variant="small" weight="medium" muted testID="nap-hero-title" accessibilityRole="header" style={{ textAlign: 'center' }}>{title}</Text>
      {elapsed != null ? (
        <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${span(elapsed)} ${tr(state.open ? 'nn.elapsedLabel' : 'nn.awakeLabel')}`}>
          <Text testID="nap-hero-elapsed" maxFontSizeMultiplier={1.3} style={[{ fontSize: 60, lineHeight: 66, letterSpacing: -1.5, fontFamily: fonts.display, color: t.colors.text, textAlign: 'center' }, TABULAR]}>{span(elapsed)}</Text>
          <Text variant="small" muted>{tr(state.open ? 'nn.elapsedLabel' : 'nn.awakeLabel')}</Text>
        </View>
      ) : null}
      {status ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, maxWidth: '100%' }} testID={`nap-hero-${progress}`}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: progress === 'beyond' ? t.colors.text : t.colors.primary }} />
          <Text variant="small" weight="medium" style={{ flexShrink: 1, textAlign: 'center' }}>{status}</Text>
        </View>
      ) : null}
      <View style={{ marginTop: spacing.xs, alignSelf: 'stretch' }}>{actions}</View>
    </Glass>
  );
}

// ─── 2. Exploration : la journée en bande tactile ───────────────────────────────────────────────

interface BandItem { kind: 'nap' | 'window'; id: string; start: number; end: number; sleep?: Sleep; ongoing?: boolean }

/** Éléments de la bande (minutes du jour, bornés à 6 h – 22 h) : siestes notées, sieste en cours, fenêtre indicative. */
export function bandItems(state: NapState, now: Date): BandItem[] {
  const out: BandItem[] = [];
  for (const s of state.today) {
    const a = new Date(s.started_at);
    const b = s.ended_at ? new Date(s.ended_at) : now;
    const start = sameDay(a, now) ? minuteOfDay(a) : 0;
    const end = sameDay(b, now) ? minuteOfDay(b) : 1440;
    if (end < FROM || start > TO) continue;
    out.push({ kind: 'nap', id: s.id, start: Math.max(FROM, start), end: Math.min(TO, Math.max(end, start + 1)), sleep: s, ongoing: !s.ended_at });
  }
  const w = state.window;
  if (state.open && w?.low != null && w.high != null) {
    const s0 = Date.parse(state.open.started_at);
    const a = new Date(s0 + w.low * MIN); const b = new Date(s0 + w.high * MIN);
    if (sameDay(a, now)) out.push({ kind: 'window', id: 'window', start: Math.max(FROM, minuteOfDay(a)), end: Math.min(TO, sameDay(b, now) ? minuteOfDay(b) : TO) });
  }
  return out.sort((x, y) => x.start - y.start);
}

/** Élément sous le doigt : celui qui contient la minute, sinon le plus proche à 25 min près ; les siestes d'abord. */
export function pickAt(items: readonly BandItem[], minute: number): BandItem | null {
  const inside = items.filter((i) => minute >= i.start && minute <= i.end).sort((a, b) => (a.kind === 'nap' ? -1 : 1) - (b.kind === 'nap' ? -1 : 1));
  if (inside[0]) return inside[0];
  let best: BandItem | null = null; let gap = 25;
  for (const i of items) { const d = Math.min(Math.abs(i.start - minute), Math.abs(i.end - minute)); if (d <= gap) { gap = d; best = i; } }
  return best;
}

function Hatch({ color }: { color: string }) {
  // Hachures : lignes fines inclinées, coupées par le cadre (aucune dépendance graphique)
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {Array.from({ length: 40 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', top: -20, bottom: -20, left: i * 7 - 40, width: 1.5, backgroundColor: color, opacity: 0.55, transform: [{ rotate: '35deg' }] }} />
      ))}
    </View>
  );
}

/** Sieste qui vient d'apparaître : elle se pose (fondu + montée). Les autres sont déjà là. */
function Landing({ fresh, children, style }: { fresh: boolean; children?: React.ReactNode; style: object }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(fresh && !m.off ? 0 : 1)).current;
  useEffect(() => {
    if (!fresh || m.off) return;
    Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.bezier(0.2, 0.9, 0.2, 1), useNativeDriver: NATIVE_DRIVER }).start();
  }, [fresh, m.off, v]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }, { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>{children}</Animated.View>;
}

/**
 * Taille d'un segment qui SUIT la donnée : après une correction enregistrée, le début reste ancré et la longueur
 * passe de l'ancienne à la nouvelle valeur sur la même échelle ; l'ancienne fin reste marquée en pointillé un
 * instant. Réduire les animations : pas d'animation, mais l'ancienne fin reste visible (avant / après lisibles).
 */
function Sized({ left, width, children, muted }: { left: number; width: number; children: React.ReactNode; muted: string }) {
  const m = useMotion();
  const w = useRef(new Animated.Value(width)).current;
  const prev = useRef(width);
  const [ghost, setGhost] = useState<number | null>(null);
  useEffect(() => {
    if (Math.abs(prev.current - width) < 0.5) return;
    const old = prev.current; prev.current = width;
    setGhost(old);
    const clear = setTimeout(() => setGhost(null), m.off ? 4000 : 2200);
    if (m.off) w.setValue(width);
    else Animated.timing(w, { toValue: width, duration: 650, easing: Easing.bezier(0.2, 0.9, 0.2, 1), useNativeDriver: false }).start();
    return () => clearTimeout(clear);
  }, [width, m.off, w]);
  return (
    <>
      {ghost != null ? <View pointerEvents="none" testID="nap-band-ghost" style={{ position: 'absolute', left, width: ghost, top: 16, height: 32, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: muted }} /> : null}
      <Animated.View style={{ position: 'absolute', left, top: 16, height: 32, width: w }}>{children}</Animated.View>
    </>
  );
}

export function NapDayBand({ child, state, now, onEdit, selectedId, onSelect, onOpenSession, focusId, onClearFocus }: {
  child: Child; state: NapState; now: Date; onEdit: (s: Sleep) => void;
  /** Sélection pilotée (lien « ?nap= », retour d'Aura) ; `onSelect` la tient à jour. */
  selectedId?: string | null; onSelect?: (id: string | null) => void;
  /** Toucher bref sur une session (sans glisser) : sa feuille s'ouvre. */
  onOpenSession?: (s: Sleep) => void;
  /** Session ouverte : la frise zoome sur elle (échelle FIGÉE tant qu'elle reste ouverte) ; null : toute la journée. */
  focusId?: string | null; onClearFocus?: () => void;
}) {
  const t = useTheme();
  const items = useMemo(() => bandItems(state, now), [state, now]);
  const naps = items.filter((i) => i.kind === 'nap');
  const total = naps.reduce((n, i) => n + (i.end - i.start), 0);
  const [width, setWidth] = useState(0);
  const [sel, setSelState] = useState<BandItem | null>(() => (selectedId ? items.find((i) => i.id === selectedId) ?? null : null));
  const setSel = (i: BandItem | null) => { setSelState(i); onSelect?.(i?.id ?? null); };
  // Sélection imposée de l'extérieur (lien depuis l'accueil, retour d'Aura)
  useEffect(() => { if (selectedId && selectedId !== sel?.id) { const i = items.find((x) => x.id === selectedId); if (i) setSelState(i); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [selectedId, items]);
  const startX = useRef(0);
  const moved = useRef(false);
  // Siestes déjà vues : une nouvelle se pose en mouvement, les anciennes ne bougent pas
  const seen = useRef<Set<string> | null>(null);
  const fresh = (id: string) => !!seen.current && !seen.current.has(id);
  useEffect(() => { seen.current = new Set(naps.map((n) => n.id)); });
  // Sélection tenue à jour si la sieste a été modifiée ou supprimée
  useEffect(() => { if (sel && !items.some((i) => i.id === sel.id)) setSel(null); else if (sel) setSelState(items.find((i) => i.id === sel.id)!); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [items]);
  // Zoom sur la session ouverte : bornes calculées UNE fois à l'ouverture (heures pleines, au moins 3 h), puis
  // figées — une correction de la fin se voit sur la même échelle
  const [zoom, setZoom] = useState<{ id: string; lo: number; hi: number } | null>(null);
  useEffect(() => {
    if (!focusId) { setZoom(null); return; }
    if (zoom?.id === focusId) return;
    const it = items.find((i) => i.id === focusId && i.kind === 'nap');
    if (!it) return;
    const lo = Math.max(0, Math.floor((it.start - 60) / 60) * 60);
    setZoom({ id: focusId, lo, hi: Math.min(1440, Math.max(lo + 180, Math.ceil((it.end + 30) / 60) * 60)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, items]);
  const LO = zoom?.lo ?? FROM; const HI = zoom?.hi ?? TO;
  const ticks = zoom ? Array.from({ length: Math.floor((HI - LO) / 60) + 1 }, (_, k) => LO / 60 + k) : TICKS;
  const x = (m: number) => ((Math.min(HI, Math.max(LO, m)) - LO) / (HI - LO)) * width;
  const touch = (e: GestureResponderEvent) => {
    if (!width) return;
    const m = LO + (Math.max(0, Math.min(width, e.nativeEvent.locationX)) / width) * (HI - LO);
    const p = pickAt(items, m);
    if (p?.id !== sel?.id) { if (p) haptic('selection'); setSel(p); }
  };
  const nowX = x(minuteOfDay(now));
  const list = naps.map((n) => tr(n.ongoing ? 'nn.sel.ongoing' : 'nn.sel.nap', { from: clock(new Date(n.sleep!.started_at)), to: n.sleep!.ended_at ? clock(new Date(n.sleep!.ended_at)) : '', dur: span(n.end - n.start) })).join('. ');
  const selText = sel?.kind === 'window' && state.window
    ? tr('nn.sel.window', { from: clock(Date.parse(state.open!.started_at) + state.window.low! * MIN), to: clock(Date.parse(state.open!.started_at) + state.window.high! * MIN), count: state.window.samples.length })
    : sel?.sleep ? tr(sel.ongoing ? 'nn.sel.ongoing' : 'nn.sel.nap', { from: clock(new Date(sel.sleep.started_at)), to: sel.sleep.ended_at ? clock(new Date(sel.sleep.ended_at)) : '', dur: span(sel.end - sel.start) }) : null;
  return (
    <Glass variant="card" radius={radius.xl} testID="nap-band" contentStyle={{ padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text variant="label" accessibilityRole="header">{tr('nn.band.title')}</Text>
        <Text variant="small" muted style={TABULAR} testID="nap-band-total">{naps.length ? tr('nn.band.total', { count: naps.length, total: span(total) }) : tr('nn.band.none')}</Text>
      </View>
      {zoom ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -4 }}>
          <GlassButton size="sm" variant="tertiary" icon="maximize-2" label={tr('nn.band.allDay')} testID="nap-band-all-day" onPress={() => { setZoom(null); onClearFocus?.(); }} />
        </View>
      ) : null}
      {/* Lecture : sélection courante (au-dessus de la bande, jamais sous le doigt) */}
      <View style={{ minHeight: 44, justifyContent: 'center' }} accessibilityLiveRegion="polite" testID="nap-band-selection">
        {selText ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="bold" style={TABULAR}>{selText}</Text>
              {sel?.sleep?.note ? <Text variant="small" muted numberOfLines={2} testID="nap-band-note">{sel.sleep.note}</Text> : null}
            </View>
            {sel?.sleep ? <GlassButton size="sm" variant="secondary" icon="edit-2" label={tr('nn.sel.edit')} onPress={() => onEdit(sel.sleep!)} testID="nap-band-edit" /> : null}
          </View>
        ) : <Text variant="small" muted>{tr('nn.band.hint')}</Text>}
      </View>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => { startX.current = e.nativeEvent.locationX; moved.current = false; touch(e); }}
        onResponderMove={(e) => { if (Math.abs(e.nativeEvent.locationX - startX.current) > 8) moved.current = true; touch(e); }}
        onResponderRelease={(e) => {
          // Toucher bref sur une session : sa feuille ; glissement : lecture seule (la sélection reste)
          if (moved.current || !onOpenSession || !width) return;
          const m = LO + (Math.max(0, Math.min(width, e.nativeEvent.locationX)) / width) * (HI - LO);
          const p = pickAt(items, m);
          if (p?.sleep) onOpenSession(p.sleep);
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={tr('nn.band.a11y', { name: child.first_name, list: list || tr('nn.band.none') })}
        testID="nap-band-track"
        style={{ height: 64, justifyContent: 'center' }}
      >
        {/* Rien de noté : ligne pointillée */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 31, borderTopWidth: 2, borderStyle: 'dotted', borderColor: t.colors.textMuted, opacity: 0.45 }} />
        {width ? items.filter((i) => i.end > LO && i.start < HI).map((i) => {
          const left = x(i.start); const w = Math.max(i.kind === 'nap' ? 6 : 10, x(i.end) - left);
          const on = sel?.id === i.id;
          if (i.kind === 'window') {
            return (
              <View key={i.id} testID="nap-band-window" style={{ position: 'absolute', left, width: w, top: 12, height: 40, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.primary, overflow: 'hidden', backgroundColor: on ? `${t.colors.primary}22` : 'transparent' }}>
                <Hatch color={t.colors.primary} />
              </View>
            );
          }
          return (
            <Sized key={i.id} left={left} width={w} muted={t.colors.textMuted}>
            <Landing fresh={fresh(i.id)} style={{ flex: 1 }}>
              <View testID={`nap-band-nap-${i.id}`} style={{ flex: 1, borderRadius: 8, backgroundColor: t.colors.text, opacity: on ? 1 : 0.86, borderWidth: on ? 2 : 0, borderColor: t.colors.primary }}>
                {i.ongoing ? <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, borderTopRightRadius: 8, borderBottomRightRadius: 8, backgroundColor: t.colors.primary }} /> : null}
              </View>
              {i.sleep?.note ? <View testID="nap-band-note-dot" style={{ position: 'absolute', top: -9, left: Math.max(0, w / 2 - 4), width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary, borderWidth: 1.5, borderColor: t.colors.background }} /> : null}
            </Landing>
            </Sized>
          );
        }) : null}
        {/* Maintenant */}
        {width && minuteOfDay(now) >= LO && minuteOfDay(now) <= HI ? <View pointerEvents="none" style={{ position: 'absolute', left: nowX - 1, top: 4, bottom: 4, width: 2, borderRadius: 1, backgroundColor: t.colors.primary }} /> : null}
        {sel && width ? <View pointerEvents="none" style={{ position: 'absolute', left: x((sel.start + sel.end) / 2) - 1, top: 0, height: 10, width: 2, backgroundColor: t.colors.text }} /> : null}
      </View>
      {/* Axe : heures alignées sous leurs repères */}
      <View style={{ height: 16 }}>
        {width ? ticks.map((h) => (
          <Text key={h} variant="caption" muted style={[{ position: 'absolute', left: x(h * 60) - 12, width: 24, textAlign: 'center' }, TABULAR]}>{`${h}h`}</Text>
        )) : null}
      </View>
      <Legend />
      {/* Liste équivalente : chaque sieste du jour, touchable pour la modifier */}
      {naps.length ? (
        <View style={{ gap: 2 }} testID="nap-band-list">
          {naps.map((n) => (
            <Tappable key={n.id} accessibilityRole="button" onPress={() => { setSel(n); if (onOpenSession) onOpenSession(n.sleep!); else onEdit(n.sleep!); }} testID="nap-band-row"
              style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: t.colors.text }} />
              <Text style={[{ flex: 1 }, TABULAR]}>{tr(n.ongoing ? 'nn.sel.ongoing' : 'nn.sel.nap', { from: clock(new Date(n.sleep!.started_at)), to: n.sleep!.ended_at ? clock(new Date(n.sleep!.ended_at)) : '', dur: span(n.end - n.start) })}</Text>
              {n.sleep?.note ? <View accessible accessibilityLabel={tr('nn.sel.noteA11y', { note: n.sleep.note })}><Icon name="message-square" size={16} color={t.colors.primary} /></View> : null}
              <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
            </Tappable>
          ))}
        </View>
      ) : null}
    </Glass>
  );
}

function Legend() {
  const t = useTheme();
  const sw = { width: 18, height: 10, borderRadius: 3 };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={[sw, { backgroundColor: t.colors.text }]} /><Text variant="caption" muted>{tr('nn.band.legendObserved')}</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={[sw, { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.primary, overflow: 'hidden' }]}><Hatch color={t.colors.primary} /></View><Text variant="caption" muted>{tr('nn.band.legendWindow')}</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 18, borderTopWidth: 2, borderStyle: 'dotted', borderColor: t.colors.textMuted }} /><Text variant="caption" muted>{tr('nn.band.legendGap')}</Text></View>
    </View>
  );
}

// ─── 3. Interprétation : faits calculés ─────────────────────────────────────────────────────────

export function NapFacts({ state, open: forceOpen }: { state: NapState; open?: number }) {
  const t = useTheme();
  const [show, setShow] = useState(false);
  useEffect(() => { if (forceOpen) setShow(true); }, [forceOpen]);
  const w = state.window;
  if (!state.open || !w) return null;
  const s0 = Date.parse(state.open.started_at);
  const min = w.samples.length ? Math.min(...w.samples.map((s) => s.minutes)) : 0;
  const max = w.samples.length ? Math.max(...w.samples.map((s) => s.minutes)) : 0;
  return (
    <Glass variant="card" radius={radius.xl} testID="nap-facts" contentStyle={{ padding: spacing.md, gap: spacing.sm }}>
      <Text variant="label" accessibilityRole="header">{tr('nn.facts.title')}</Text>
      {w.status === 'ok' ? (
        <>
          <Text testID="nap-facts-ok" style={TABULAR}>{tr('nn.facts.ok', { count: w.samples.length, inRange: w.inRange, low: w.low!, high: w.high! })}</Text>
          <Text weight="bold" testID="nap-facts-window" style={TABULAR}>{tr('nn.facts.window', { from: clock(s0 + w.low! * MIN), to: clock(s0 + w.high! * MIN) })}</Text>
        </>
      ) : w.status === 'dispersed' ? <Text testID="nap-facts-dispersed">{tr('nn.facts.dispersed', { min, max })}</Text>
        : <Text testID="nap-facts-insufficient">{tr('nn.facts.insufficient', { count: w.samples.length })}</Text>}
      {w.periodFrom && w.periodTo ? <Text variant="small" muted testID="nap-facts-period">{tr('nn.facts.period', { from: formatDate(w.periodFrom, { day: 'numeric', month: 'short' }), to: formatDate(w.periodTo, { day: 'numeric', month: 'short' }) })}</Text> : null}
      {w.samples.length ? (
        <Tappable accessibilityRole="button" accessibilityState={{ expanded: show }} onPress={() => setShow((v) => !v)} testID="nap-facts-toggle" style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name={show ? 'chevron-up' : 'chevron-down'} size={16} color={t.colors.text} />
          <Text variant="small" weight="bold">{tr(show ? 'nn.facts.hide' : 'nn.facts.show')}</Text>
        </Tappable>
      ) : null}
      {show ? (
        <View style={{ gap: 4 }} testID="nap-facts-samples">
          {w.samples.map((s) => {
            const inside = w.low != null && w.high != null && s.minutes >= w.low && s.minutes <= w.high;
            return (
              <View key={s.started_at} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                {/* Barre proportionnelle : pleine dans la plage, contour seul hors plage (lisible sans couleur) */}
                <View style={{ width: 90, height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceAlt }}>
                  <View style={{ width: `${Math.min(100, (s.minutes / Math.max(max, 1)) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: inside ? t.colors.text : 'transparent', borderWidth: inside ? 0 : 1.5, borderColor: t.colors.textMuted }} />
                </View>
                <Text variant="small" style={[{ flex: 1 }, TABULAR]}>{tr('nn.facts.sample', { date: formatDate(s.started_at, { weekday: 'short', day: 'numeric' }), time: clock(new Date(s.started_at)), dur: span(s.minutes) })}{inside ? '' : ` · ${tr('nn.facts.outside')}`}</Text>
              </View>
            );
          })}
          <Text variant="caption" muted>{tr('nn.facts.rule')}</Text>
        </View>
      ) : null}
      <Text variant="caption" muted>{tr('nn.facts.notAdvice')}</Text>
    </Glass>
  );
}
