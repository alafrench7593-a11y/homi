/**
 * Biberon en direct (refonte v3) — remplace l'ancien instrument `bottleInstrument.tsx`, mêmes règles de données.
 *
 *  - Chiffres STABLES : chronomètre en chiffres tabulaires, largeur fixe (`sessionClock`).
 *  - Commande principale CIRCULAIRE (`SessionOrb`) toujours au même emplacement : Démarrer → Pause → Reprendre ;
 *    seuls l'icône et le libellé changent. « Terminer » occupe une place réservée à droite (vide au repos), si bien
 *    que la commande principale ne bouge jamais.
 *  - Temps EXACT au retour dans l'application : rien n'est incrémenté, tout est recalculé depuis les horodatages
 *    enregistrés (`bottleElapsed`) ; au retour au premier plan (`AppState` → `active`), l'heure est relue
 *    immédiatement au lieu d'attendre le prochain tic.
 *  - Saisie : récapitulatif dans le panneau du bas gestuel (`Sheet`) ; enregistrement anti double soumission
 *    (`PrimaryButton` + garde interne) ; le résultat affiché est celui RÉELLEMENT enregistré (après réponse).
 *  - Mouvement (`useMotion`) : changement d'état = souffle de la commande (ressort `rebondLeger`) et fondu croisé
 *    de l'icône (150 ms) ; résultat = coche qui apparaît en ressort. Aucune boucle décorative (un chronomètre est à
 *    l'écran). Réduire les animations : états finaux immédiats.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text as RNText, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { PrimaryButton, SecondaryButton, SensitiveButton, IconOrb } from '@/components/controls';
import { OpticalGlass, transparentOf } from '@/components/surfaces';
import { Sheet, useToast } from '@/components/Overlays';
import { Field, haptic, Icon, Row, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useRows } from '@/lib/data/hooks';
import { useBottleTimer, useUpdateBottleTimer } from '@/lib/data/hooks-bottle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { atClock, formatClock, updateLastBottleTime } from '@/lib/domain/bottleTimer';
import { bottleElapsed, resumePatch } from '@/lib/domain/childCare';
import { primaryCommand, sessionClock, sessionSeconds, sessionState, sessionTickMs, type SessionState } from '@/lib/domain/bottleSession';
import type { Child } from '@/lib/types';
import { usePressScale } from '@/motion/PressableScale';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, radius, spacing, typography } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export interface RunningBottle { id: string; started_at: string; paused_at: string | null; paused_seconds: number; ended_at: string | null; prepared_ml: number | null }
export interface SessionResult { seconds: number; consumed: number | null; prepared: number | null; next: string | null }

/** Dimensions (une seule source, testées) : la commande principale et les places latérales ne changent jamais. */
export const SESSION = { orb: 88, side: 56, slot: 92, dialMax: 232 } as const;

// ------------------------------------------------------------------ horloge
/**
 * Heure courante pour l'affichage d'une session : tic de 250 ms en marche, aucun tic au repos ou en pause ;
 * relue tout de suite quand l'application revient au premier plan et quand l'état change.
 */
export function useSessionNow(state: SessionState): Date {
  const [now, setNow] = useState(() => new Date());
  const tick = sessionTickMs(state);
  useEffect(() => {
    setNow(new Date());
    if (tick == null) return undefined;
    const id = setInterval(() => setNow(new Date()), tick);
    return () => clearInterval(id);
  }, [tick, state]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') setNow(new Date()); });
    return () => sub.remove();
  }, []);
  return now;
}

// ------------------------------------------------------------------ données (règles inchangées)
export function useBottleSession(child: Child) {
  const toast = useToast();
  const inv = useInvalidate();
  const reminder = useBottleTimer(child.id);
  const updateTimer = useUpdateBottleTimer();
  const runningQ = useRows<RunningBottle>(['bottles', child.id, 'running'], { table: 'bottles', filters: [eq('child_id', child.id), eq('in_progress', true)], limit: 1 });
  // Une prise terminée ou annulée ici n'est plus « en cours », même avant que la liste soit relue : un appui tardif
  // (double appui juste après l'enregistrement) ne peut plus réécrire la ligne.
  const settled = useRef(new Set<string>());
  const raw = runningQ.data?.[0] ?? null;
  const running = raw && !settled.current.has(raw.id) ? raw : null;
  const state = sessionState(running);
  const now = useSessionNow(state);
  const seconds = sessionSeconds(running, now);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [result, setResult] = useState<SessionResult | null>(null);

  /** Une seule écriture à la fois : un deuxième appui pendant l'enregistrement est ignoré. */
  const run = useCallback(async (fn: () => Promise<unknown>, msg?: string) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    try { await fn(); inv('bottles'); if (msg) toast(msg); return true; } catch (e) { toast(friendlyError(e), 'error'); return false; } finally { inFlight.current = false; setBusy(false); }
  }, [inv, toast]);

  const start = () => {
    setResult(null);
    const at = new Date().toISOString();
    return run(() => backend.insert('bottles', { child_id: child.id, household_id: child.household_id, at, started_at: at, in_progress: true }), tr('u4.bi.started'));
  };
  const pause = () => (running ? run(() => backend.update('bottles', { paused_at: new Date().toISOString() }, [eq('id', running.id)])) : Promise.resolve(false));
  const resume = () => (running ? run(() => backend.update('bottles', resumePatch(running), [eq('id', running.id)])) : Promise.resolve(false));
  const cancel = async () => {
    if (!running) return false;
    const ok = await run(() => backend.remove('bottles', [eq('id', running.id)]), tr('u4.bi.cancelled'));
    if (ok) settled.current.add(running.id);
    return ok;
  };

  /** Enregistre la prise (mêmes contrôles et même mise à jour du rappel que l'instrument d'origine). */
  async function finish(input: { prepared: string; consumed: string; milk: string; note: string }): Promise<boolean> {
    if (!running) return false;
    const p = input.prepared.trim() ? Number(input.prepared) : null;
    const c = input.consumed.trim() ? Number(input.consumed) : null;
    if ((p != null && (!Number.isInteger(p) || p < 0 || p > 500)) || (c != null && (!Number.isInteger(c) || c < 0 || c > 500))) { toast(tr('u4.bi.qtyRange'), 'error'); return false; }
    if (p != null && c != null && c > p) { toast(tr('u4.bi.qtyOver'), 'error'); return false; }
    const end = new Date();
    const patch = { ...resumePatch(running, end), ended_at: (running.paused_at ? new Date(running.paused_at) : end).toISOString(), in_progress: false, at: running.started_at, prepared_ml: p, consumed_ml: c, milk_type: input.milk.trim() || null, note: input.note.trim() || null };
    const secs = bottleElapsed({ ...running, ...patch });
    // Un rappel actif repart de ce biberon (même délai) — comme pour une saisie manuelle.
    let next: string | null = null;
    const ok = await run(async () => {
      await backend.update('bottles', patch, [eq('id', running.id)]);
      const active = reminder.active;
      if (active && Date.parse(running.started_at) >= Date.parse(active.last_bottle_at)) {
        const upd = await updateTimer.mutateAsync({ id: active.id, patch: updateLastBottleTime(active, running.started_at, end) });
        next = (upd as { due_at?: string } | undefined)?.due_at ?? updateLastBottleTime(active, running.started_at, end).due_at;
      }
    });
    if (!ok) return false;
    settled.current.add(running.id);
    toast(next ? tr('u4.bi.savedNext', { time: atClock(next) }) : tr('u4.bi.saved'));
    setResult({ seconds: secs, consumed: c, prepared: p, next });
    return true;
  }

  const primary = () => (state === 'idle' ? start() : state === 'running' ? pause() : resume());
  return { running, state, seconds, busy, result, primary, finish, cancel, isLoading: runningQ.isLoading && !runningQ.data, error: runningQ.isError && !runningQ.data ? runningQ.error : null, refetch: runningQ.refetch };
}

// ------------------------------------------------------------------ commande principale circulaire
/**
 * Bouton rond principal (verre teinté de la palette). Largeur et hauteur FIXES ; pendant l'enregistrement, un
 * indicateur remplace l'icône à la même place et les appuis sont ignorés (`busy`, annoncé).
 */
export function SessionOrb({ icon, label, onPress, busy, testID, pulseKey, size = SESSION.orb }: {
  icon: 'play' | 'pause' | 'plus'; label: string; onPress: () => unknown; busy?: boolean; testID?: string; pulseKey?: string; size?: number;
}) {
  const t = useTheme();
  const m = useMotion();
  const night = t.name === 'night';
  const p = usePressScale({ scale: 0.94, haptic: 'none' });
  const breath = useSharedValue(1);
  const fade = useSharedValue(1);
  const first = useRef(true);
  // changement d'état : souffle bref de la commande + fondu croisé de l'icône
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (m.off) return;
    breath.value = 0.92;
    breath.value = m.spring(1, 'rebondLeger');
    fade.value = 0;
    fade.value = m.timing(1, 150, 'standard');
  }, [pulseKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelAnimation(breath); cancelAnimation(fade); }, [breath, fade]);
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ busy: !!busy }} testID={testID}
      onPress={() => { if (busy) return; void onPress(); }} onPressIn={p.onPressIn} onPressOut={p.onPressOut}
      style={{ width: size, height: size }}>
      <Animated.View style={[{ flex: 1 }, p.style]}>
        <Animated.View style={[{ flex: 1, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary,
          borderWidth: 1, borderColor: t.tokens.border.active,
          boxShadow: night ? undefined : [{ offsetX: 0, offsetY: 10, blurRadius: 28, spreadDistance: -4, color: alpha(t.tokens.accent.glow[0], t.isDark ? 0.5 : 0.42) }] }, bodyStyle]}>
          {!night ? <LinearGradient colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
          {!night ? <LinearGradient pointerEvents="none" colors={[t.material.light.sheen, transparentOf(t.material.light.sheen)]} start={{ x: 0.15, y: 0 }} end={{ x: 0.55, y: 0.7 }} style={StyleSheet.absoluteFill} /> : null}
          <Animated.View style={iconStyle} testID={busy ? `${testID}-busy` : undefined}>
            {busy ? <ActivityIndicator color={t.colors.primaryText} /> : <Icon name={icon} size={Math.round(size * 0.38)} color={t.colors.primaryText} />}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** Libellé sous une commande : largeur fixe (la commande ne bouge pas quand le libellé change). */
function SlotLabel({ children, muted }: { children: string; muted?: boolean }) {
  const t = useTheme();
  return (
    <RNText maxFontSizeMultiplier={1.4} numberOfLines={2} style={{ width: SESSION.slot, textAlign: 'center', color: muted ? t.colors.textMuted : t.colors.text, fontFamily: fonts.bodyMedium, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight }}>{children}</RNText>
  );
}

// ------------------------------------------------------------------ cadran des secondes
const SEG = 60;
function ring(size: number) {
  const c = size / 2;
  const r = c - 8;
  const pt = (deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) }; };
  return Array.from({ length: SEG }, (_, i) => {
    const a = pt(i * 6 + 1); const b = pt(i * 6 + 5);
    return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  });
}

/** Secondes de la minute en cours (valeurs RÉELLES, aucune interpolation) : décoratif, masqué aux lecteurs d'écran. */
function SecondsRing({ size, lit, state }: { size: number; lit: number; state: SessionState }) {
  const t = useTheme();
  const segs = React.useMemo(() => ring(size), [size]);
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {state === 'paused' ? <Circle cx={size / 2} cy={size / 2} r={size / 2 - 20} stroke={t.colors.textMuted} strokeWidth={1.2} strokeDasharray="2 6" fill="none" /> : null}
      {segs.map((d, i) => (
        <Path key={i} d={d} strokeWidth={i % 5 === 0 ? 6 : 4} strokeLinecap="round" fill="none"
          stroke={i < lit ? t.colors.primary : t.material.lines.track} opacity={i < lit && state === 'paused' ? 0.55 : 1} />
      ))}
    </Svg>
  );
}

// ------------------------------------------------------------------ carte de session (point focal de l'écran)
export function BottleSessionCard({ child, onRecordPast }: { child: Child; onRecordPast: () => void }) {
  const t = useTheme();
  const m = useMotion();
  const s = useBottleSession(child);
  const { width, height } = useWindowDimensions();
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState({ prepared: '', consumed: '', milk: '', note: '' });
  // le cadran suit la largeur ET la hauteur : sur 320 × 568, la commande ronde reste visible sans défiler
  const dial = Math.max(168, Math.min(SESSION.dialMax, width - 2 * spacing.lg - 2 * spacing.md - 16, Math.round(height * 0.34)));
  const cmd = primaryCommand(s.state);
  const active = s.state !== 'idle';
  const lit = active ? s.seconds % 60 : 0;
  // le panneau se ferme si la session se termine ailleurs (autre appareil, autre écran)
  useEffect(() => { if (!s.running && sheet) setSheet(false); }, [s.running, sheet]);

  // résultat : la coche apparaît en ressort (réel : seulement après l'enregistrement)
  const check = useSharedValue(1);
  useEffect(() => {
    if (!s.result) return;
    if (m.off) { check.value = 1; return; }
    check.value = 0.6;
    check.value = m.spring(1, 'rebondLeger');
  }, [s.result]); // eslint-disable-line react-hooks/exhaustive-deps
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: check.value }] }));

  const stateLabel = s.state === 'running' ? tr('bs.state.running') : s.state === 'paused' ? tr('bs.state.paused') : s.result ? tr('bs.state.saved') : tr('bs.state.ready');
  const stateIcon = s.state === 'running' ? 'activity' : s.state === 'paused' ? 'pause' : s.result ? 'check-circle' : 'droplet';
  const clock = active ? sessionClock(s.seconds) : s.result ? sessionClock(s.result.seconds) : sessionClock(0);
  const a11yClock = tr('bs.a11y.clock', { state: stateLabel, time: tr('bs.a11y.duration', { min: Math.floor((active ? s.seconds : s.result?.seconds ?? 0) / 60), sec: (active ? s.seconds : s.result?.seconds ?? 0) % 60 }) });

  async function save() {
    const ok = await s.finish(form);
    if (ok) { haptic('success'); setSheet(false); setForm({ prepared: '', consumed: '', milk: '', note: '' }); }
  }

  return (
    <OpticalGlass radius={radius.xl} padded={spacing.md} testID="bottle-session" contentStyle={{ gap: spacing.md, alignItems: 'center' }}>
      <Row style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
        <Text variant="label">{tr('bs.title')}</Text>
        <Row gap={6} testID="bottle-session-state">
          <Icon name={stateIcon} size={14} color={s.state === 'running' ? t.colors.primary : s.result && !active ? t.colors.success : t.colors.textMuted} />
          <Text variant="caption" weight="bold" color={s.state === 'running' ? t.colors.primary : s.result && !active ? t.colors.success : t.colors.textMuted}>{stateLabel}</Text>
        </Row>
      </Row>

      {/* cadran : secondes réelles de la minute en cours + chronomètre à chiffres tabulaires */}
      <View style={{ width: dial, height: dial, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityRole="timer" accessibilityLabel={a11yClock} accessibilityLiveRegion="none" testID="bottle-session-dial">
        <SecondsRing size={dial} lit={lit} state={s.state} />
        {s.result && !active ? (
          <Animated.View style={[{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(t.tokens.status.success, 0.16), marginBottom: 4 }, checkStyle]} testID="bottle-session-check">
            <Icon name="check" size={22} color={t.colors.success} />
          </Animated.View>
        ) : null}
        <RNText testID="bottle-session-clock" maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit
          style={{ color: s.state === 'paused' ? t.colors.textMuted : t.colors.text, fontFamily: fonts.displayItalic, fontSize: 52, lineHeight: 60, letterSpacing: -1.5, fontVariant: ['tabular-nums'] }}>{clock}</RNText>
        <RNText maxFontSizeMultiplier={1.4} numberOfLines={3} style={{ maxWidth: dial * 0.72, textAlign: 'center', color: t.colors.textMuted, fontFamily: fonts.body, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight }}>
          {s.running ? tr('bs.since', { time: formatClock(s.running.started_at) }) : s.result ? (s.result.consumed != null ? tr('u4.bi.drunk', { n: s.result.consumed }) : tr('bs.saved_noqty')) : tr('bs.idle_hint')}
        </RNText>
      </View>

      {/* commandes : la principale reste au centre, « Terminer » a sa place réservée à droite */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }} testID="bottle-session-controls">
        <View style={{ width: SESSION.slot }} />
        <View style={{ width: SESSION.slot, alignItems: 'center', gap: 6 }} testID="bottle-session-primary-slot">
          <SessionOrb icon={cmd.icon} label={tr(cmd.labelKey)} onPress={s.primary} busy={s.busy && !sheet} testID="bottle-session-primary" pulseKey={s.state} />
          <SlotLabel>{tr(cmd.labelKey)}</SlotLabel>
        </View>
        <View style={{ width: SESSION.slot, alignItems: 'center', gap: 6, paddingTop: (SESSION.orb - SESSION.side) / 2 }}>
          {active ? (
            <>
              <IconOrb icon="check" size="lg" label={tr('u4.bi.finish')} onPress={() => { haptic('selection'); setSheet(true); }} disabled={s.busy} testID="bottle-session-finish" />
              <SlotLabel>{tr('u4.bi.finish')}</SlotLabel>
            </>
          ) : <View style={{ width: SESSION.side, height: SESSION.side }} />}
        </View>
      </View>

      {s.result && !active ? (
        <View accessibilityLiveRegion="polite" testID="bottle-session-result" style={{ alignSelf: 'stretch', alignItems: 'center' }}>
          <Text variant="small" center>{s.result.next ? tr('u4.bi.savedNext', { time: atClock(s.result.next) }) : tr('u4.bi.saved')}</Text>
        </View>
      ) : null}

      {!active ? (
        <SecondaryButton label={tr('bs.record_past')} icon="edit-3" size="sm" onPress={onRecordPast} testID="bottle-record" style={{ alignSelf: 'stretch' }} />
      ) : null}

      {/* récapitulatif modifiable avant validation */}
      <Sheet visible={sheet && !!s.running} onClose={() => setSheet(false)} title={tr('u4.bi.recap')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="label">{tr('bs.duration')}</Text>
          <RNText testID="bottle-recap-clock" style={{ color: t.colors.text, fontFamily: fonts.displayItalic, fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.3}>{sessionClock(s.seconds)}</RNText>
        </Row>
        <Row>
          <View style={{ flex: 1 }}><Field label={tr('u4.bi.prepared')} optional value={form.prepared} onChangeText={(v) => setForm((f) => ({ ...f, prepared: v }))} keyboardType="number-pad" maxLength={3} testID="bottle-recap-prepared" /></View>
          <View style={{ flex: 1 }}><Field label={tr('u4.bi.consumed')} optional value={form.consumed} onChangeText={(v) => setForm((f) => ({ ...f, consumed: v }))} keyboardType="number-pad" maxLength={3} testID="bottle-recap-consumed" /></View>
        </Row>
        <Field label={tr('u4.bi.milkType')} optional value={form.milk} onChangeText={(v) => setForm((f) => ({ ...f, milk: v }))} maxLength={80} />
        <Field label={tr('u4.bi.note')} optional value={form.note} onChangeText={(v) => setForm((f) => ({ ...f, note: v }))} maxLength={1000} />
        <Text variant="caption" muted>{tr('u4.bi.correct')}</Text>
        <PrimaryButton label={tr('u4.bi.saveBottle')} icon="check" onPress={save} loading={s.busy} testID="bottle-recap-save" />
        <SecondaryButton label={tr('u4.bi.keepTimer')} onPress={() => setSheet(false)} />
        <SensitiveButton label={tr('bs.cancel_session')} icon="x" size="sm" confirmTitle={tr('bs.cancel_q')} confirmMessage={tr('bs.cancel_body')} confirmLabel={tr('bs.cancel_session')}
          onPress={async () => { const ok = await s.cancel(); if (ok) setSheet(false); }} testID="bottle-recap-cancel" />
      </Sheet>
    </OpticalGlass>
  );
}

/** Ouvre la saisie d'un biberon déjà donné (formulaire existant). */
export const openBottleEntry = (childId: string, timerId?: string | null) =>
  router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, from: 'day', ...(timerId ? { timer: timerId } : {}) } });
