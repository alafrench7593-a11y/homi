/**
 * Minuteur de biberon — l'instrument de référence du système de mouvement.
 *
 * Composition en couches : disque de verre flottant, orbite de 60 segments (les secondes de la
 * minute en cours s'allument une à une), anneau intérieur de repères (une perle par minute écoulée),
 * comète lumineuse qui parcourt l'orbite, compteur à chiffres roulants, commandes intégrées.
 *
 * Le temps n'est JAMAIS animé artificiellement : chaque seconde affichée est recalculée depuis les
 * horodatages enregistrés (début, pauses). L'animation ne fait qu'interpoler entre deux secondes
 * réelles. Fermer l'application ou changer d'écran ne change rien au chronométrage.
 *
 * Gestes : toucher le centre = démarrer / pause / reprise ; appui long = terminer.
 * Toutes les actions existent aussi en boutons accessibles. « Réduire les animations » : rien ne bouge
 * hors des changements d'état, et l'état actif reste lisible sans la couleur (texte + motif).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { GlassSurface } from '@/components/Glass';
import { DrawCheck, MotionNumber, PulseRing } from '@/components/MotionKit';
import { useToast } from '@/components/Overlays';
import { Button, Field, haptic, Icon, Row, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useRows } from '@/lib/data/hooks';
import { useBottleTimer, useNow, useUpdateBottleTimer } from '@/lib/data/hooks-bottle';
import { atClock, updateLastBottleTime } from '@/lib/domain/bottleTimer';
import { friendlyError } from '@/lib/data/hooks-settings';
import { bottleElapsed, formatChrono, resumePatch } from '@/lib/domain/childCare';
import { formatDuration } from '@/lib/domain/dates';
import type { Child } from '@/lib/types';
import { easing, spring } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';
import { localeTag, t as tr } from '@/i18n';

interface Running { id: string; started_at: string; paused_at: string | null; paused_seconds: number; ended_at: string | null; prepared_ml: number | null }
interface Finished { id: string; at: string; consumed_ml: number | null }

const SIZE = 280;
const C = SIZE / 2;
const R_ORBIT = 116;
const R_BEADS = 94;

const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};
function arc(r: number, from: number, to: number) {
  const a = polar(r, from);
  const b = polar(r, to);
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}
const SEGMENTS = Array.from({ length: 60 }, (_, i) => arc(R_ORBIT, i * 6 + 0.9, i * 6 + 5.1));
const BEADS = Array.from({ length: 30 }, (_, i) => polar(R_BEADS, i * 12));

export function BottleInstrument({ child }: { child: Child }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const reminder = useBottleTimer(child.id);
  const updateTimer = useUpdateBottleTimer();
  const reduce = useReduceMotion();
  const runningQ = useRows<Running>(['bottles', child.id, 'running'], { table: 'bottles', filters: [eq('child_id', child.id), eq('in_progress', true)], limit: 1 });
  const lastQ = useRows<Finished>(['bottles', child.id, 'last-finished'], { table: 'bottles', filters: [eq('child_id', child.id), eq('in_progress', false)], order: [{ col: 'at', asc: false }], limit: 1 });
  const running = runningQ.data?.[0] ?? null;
  const last = lastQ.data?.[0] ?? null;
  const now = useNow(running && !running.paused_at ? 250 : 1000);
  const paused = !!running?.paused_at;
  const state: 'idle' | 'running' | 'paused' = !running ? 'idle' : paused ? 'paused' : 'running';
  const elapsed = running ? bottleElapsed(running, now) : 0;
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(false);
  const [done, setDone] = useState<{ seconds: number; consumed: number | null; prepared: number | null } | null>(null);
  const [prepared, setPrepared] = useState('');
  const [consumed, setConsumed] = useState('');
  const [milk, setMilk] = useState('');
  const [note, setNote] = useState('');
  const [pulse, setPulse] = useState(0);

  // ---------------------------------------------------------------- mouvements
  const body = useRef(new Animated.Value(1)).current;       // contraction / déploiement du disque
  const comet = useRef(new Animated.Value(0)).current;      // position de la comète (0..1 = un tour = 60 s)
  const cometAt = useRef(-1);                                 // dernière cible connue (côté JS)
  const glow = useRef(new Animated.Value(0)).current;       // respiration lumineuse
  const reveal = useRef(new Animated.Value(state === 'idle' ? 0 : 1)).current; // informations complémentaires

  // Comète : alignée sur la seconde RÉELLE ; on interpole seulement jusqu'à la suivante
  useEffect(() => {
    if (reduce) return;
    if (state === 'running') {
      const target = (elapsed % 60) / 60;
      // Nouveau tour, reprise ou retour sur l'écran : on se recale sur la seconde réelle
      if (Math.abs(target - cometAt.current) > 1 / 60 + 0.001) comet.setValue(target);
      const next = target + (1 / 60) * 0.98;
      cometAt.current = next;
      Animated.timing(comet, { toValue: next, duration: 980, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }).start();
    }
  }, [elapsed, state, reduce, comet]);

  // Repos : comète immobile (pause) ou orbite lente décorative (accueil)
  useEffect(() => {
    if (reduce) return;
    if (state === 'idle') {
      comet.setValue(0); cometAt.current = -1;
      const loop = Animated.loop(Animated.timing(comet, { isInteraction: false, toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
      loop.start();
      return () => loop.stop();
    }
    if (state === 'paused') { comet.stopAnimation(); cometAt.current = -1; }
    return undefined;
  }, [state, reduce, comet]);

  // Respiration : rapide et nette en marche, lente en pause, très douce au repos
  useEffect(() => {
    if (reduce) { glow.setValue(0.5); return; }
    const ms = state === 'running' ? 1000 : state === 'paused' ? 2600 : 3200;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { isInteraction: false, toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(glow, { isInteraction: false, toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [state, reduce, glow]);

  useEffect(() => {
    Animated.timing(reveal, { toValue: state === 'idle' ? 0 : 1, duration: reduce ? 0 : 520, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER }).start();
  }, [state, reduce, reveal]);

  function contractThenDeploy() {
    if (reduce) return;
    Animated.sequence([
      Animated.timing(body, { toValue: 0.94, duration: 110, easing: easing.accelerate, useNativeDriver: NATIVE_DRIVER }),
      Animated.spring(body, { toValue: 1, ...spring.release, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  }

  // ---------------------------------------------------------------- actions (données d'abord, animation ensuite)
  const run = async (fn: () => Promise<unknown>, msg?: string) => {
    setBusy(true);
    try { await fn(); inv('bottles'); if (msg) toast(msg); return true; } catch (e) { toast(friendlyError(e), 'error'); return false; } finally { setBusy(false); }
  };
  async function start() {
    haptic('success'); contractThenDeploy(); setPulse((p) => p + 1); setDone(null);
    const at = new Date().toISOString();
    await run(() => backend.insert('bottles', { child_id: child.id, household_id: child.household_id, at, started_at: at, in_progress: true }), tr('u4.bi.started'));
  }
  async function pause() { haptic('light'); contractThenDeploy(); await run(() => backend.update('bottles', { paused_at: new Date().toISOString() }, [eq('id', running!.id)])); }
  async function resume() { haptic('light'); contractThenDeploy(); setPulse((p) => p + 1); await run(() => backend.update('bottles', resumePatch(running!), [eq('id', running!.id)])); }
  function openSummary() { haptic('selection'); setSummary(true); }
  async function cancel() { await run(() => backend.remove('bottles', [eq('id', running!.id)]), tr('u4.bi.cancelled')); setSummary(false); }

  async function finish() {
    if (!running) return;
    const p = prepared.trim() ? Number(prepared) : null;
    const c = consumed.trim() ? Number(consumed) : null;
    if ((p != null && (!Number.isInteger(p) || p < 0 || p > 500)) || (c != null && (!Number.isInteger(c) || c < 0 || c > 500))) return toast(tr('u4.bi.qtyRange'), 'error');
    if (p != null && c != null && c > p) return toast(tr('u4.bi.qtyOver'), 'error');
    const end = new Date();
    const patch = { ...resumePatch(running, end), ended_at: (running.paused_at ? new Date(running.paused_at) : end).toISOString(), in_progress: false, at: running.started_at, prepared_ml: p, consumed_ml: c, milk_type: milk.trim() || null, note: note.trim() || null };
    const seconds = bottleElapsed({ ...running, ...patch });
    // Synchronisation : un rappel actif repart de ce biberon (même délai) — comme pour une saisie manuelle.
    let next: string | null = null;
    const ok = await run(async () => {
      await backend.update('bottles', patch, [eq('id', running.id)]);
      const active = reminder.active;
      if (active && Date.parse(running.started_at) >= Date.parse(active.last_bottle_at)) {
        const upd = await updateTimer.mutateAsync({ id: active.id, patch: updateLastBottleTime(active, running.started_at, end) });
        next = (upd as { due_at?: string } | undefined)?.due_at ?? updateLastBottleTime(active, running.started_at, end).due_at;
      }
    }, undefined);
    if (!ok) return;
    toast(next ? tr('u4.bi.savedNext', { time: atClock(next) }) : tr('u4.bi.saved'));
    haptic('success'); setPulse((x) => x + 1);
    setSummary(false); setDone({ seconds, consumed: c, prepared: p });
    setPrepared(''); setConsumed(''); setMilk(''); setNote('');
  }

  const onCenter = () => (state === 'idle' ? start() : state === 'running' ? pause() : resume());
  const minutes = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const lit = state === 'idle' ? 0 : sec;
  const beads = state === 'idle' ? 0 : Math.min(30, minutes);
  const lastAgo = last ? formatDuration((now.getTime() - Date.parse(last.at)) / 60000) : null;
  const stateText = state === 'running' ? tr('u4.bi.running') : state === 'paused' ? tr('u4.bi.paused') : done ? tr('u4.bi.recorded') : tr('u4.bi.ready');
  const a11y = state === 'idle' ? tr('u4.bi.a11yIdle') : tr('u4.bi.a11y', { state: stateText, min: tr('u4.bi.minutes', { count: minutes }), sec: tr('u4.bi.seconds', { count: sec }), action: state === 'running' ? tr('u4.bi.actPause') : tr('u4.bi.actResume') });

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      <Animated.View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', transform: [{ scale: body }] }}>
        {/* Halo de profondeur sous le disque */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', width: SIZE * 0.92, height: SIZE * 0.92, borderRadius: SIZE, backgroundColor: t.colors.primary,
          opacity: glow.interpolate({ inputRange: [0, 1], outputRange: state === 'running' ? [0.1, 0.22] : [0.05, 0.1] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }} />
        <GlassSurface fill={t.colors.surface} depth={3} radius={SIZE / 2} style={{ position: 'absolute', width: SIZE - 8, height: SIZE - 8 }} />

        {/* Orbite des secondes, perles des minutes, repères */}
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }} accessibilityElementsHidden importantForAccessibility="no">
          <Defs>
            <SvgGradient id="tail" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={t.colors.primary} stopOpacity="0" />
              <Stop offset="1" stopColor={t.colors.primary} stopOpacity="1" />
            </SvgGradient>
          </Defs>
          {state === 'paused' ? <Circle cx={C} cy={C} r={R_ORBIT + 20} stroke={t.colors.textMuted} strokeWidth={1.2} strokeDasharray="2 6" fill="none" /> : null}
          {SEGMENTS.map((d, i) => (
            <Path key={i} d={d} strokeWidth={i % 5 === 0 ? 7 : 5} strokeLinecap="round" fill="none"
              stroke={i < lit ? t.colors.primary : t.colors.lavender} opacity={i < lit ? (state === 'paused' ? 0.55 : 1) : 0.28} />
          ))}
          {BEADS.map((b, i) => (
            <Circle key={i} cx={b.x} cy={b.y} r={i < beads ? 3.6 : 2} fill={t.colors.lavender} opacity={i < beads ? 1 : 0.35} />
          ))}
          {[0, 90, 180, 270].map((deg) => { const a = polar(R_ORBIT - 14, deg); const b = polar(R_ORBIT - 20, deg); return <Path key={deg} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke={t.colors.textMuted} strokeWidth={1.5} strokeLinecap="round" />; })}
        </Svg>

        {/* Comète lumineuse : position = seconde réelle, interpolée entre deux secondes */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', width: SIZE, height: SIZE, opacity: state === 'idle' ? 0.35 : state === 'paused' ? 0.55 : 1,
          transform: [{ rotate: comet.interpolate({ inputRange: [0, 1, 2], outputRange: ['0deg', '360deg', '720deg'] }) }] }}>
          <Svg width={SIZE} height={SIZE}>
            <Path d={arc(R_ORBIT + 12, -38, -3)} stroke={t.colors.primary} strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" fill="none" />
            <Circle cx={polar(R_ORBIT + 12, 0).x} cy={polar(R_ORBIT + 12, 0).y} r={5.5} fill={t.colors.surface} stroke={t.colors.primary} strokeWidth={2.5} />
          </Svg>
        </Animated.View>

        <PulseRing trigger={pulse} size={SIZE - 20} color={t.colors.primary} />

        {/* Centre : compteur et commande intégrée */}
        <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={busy ? undefined : onCenter} onLongPress={state === 'idle' || busy ? undefined : openSummary} delayLongPress={550}
          style={({ pressed }) => ({ width: 168, height: 168, borderRadius: 84, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.96 : 1 }] })}>
          {state === 'idle' && !done ? (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary }}>
                <Icon name="play" size={28} color={t.colors.primaryText} />
              </View>
              <Text weight="bold">{tr('u4.bi.start')}</Text>
              <Text variant="caption" muted>{new Date().toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          ) : done && state === 'idle' ? (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <DrawCheck size={52} color={t.colors.success} />
              <MotionNumber text={formatChrono(done.seconds)} style={{ fontSize: 30, fontWeight: '700', color: t.colors.text }} accessibilityLabel={tr('u4.bi.duration', { x: formatChrono(done.seconds) })} />
              <Text variant="caption" muted>{done.consumed != null ? tr('u4.bi.drunk', { n: done.consumed }) : tr('u4.bi.recorded')}</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 2 }}>
              <MotionNumber text={formatChrono(elapsed)} style={{ fontSize: 46, fontWeight: '700', letterSpacing: -1, color: state === 'paused' ? t.colors.textMuted : t.colors.text }} accessibilityLabel={tr('u4.bi.feedTime', { x: formatChrono(elapsed) })} />
              <Row gap={6} style={{ alignItems: 'center' }}>
                <Icon name={state === 'paused' ? 'pause' : 'activity'} size={14} color={state === 'paused' ? t.colors.textMuted : t.colors.primary} />
                <Text variant="caption" weight="bold" color={state === 'paused' ? t.colors.textMuted : t.colors.primary}>{stateText.toUpperCase()}</Text>
              </Row>
              <Text variant="caption" muted>{state === 'paused' ? tr('u4.bi.tapResume') : tr('u4.bi.longFinish')}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Informations qui se déploient au démarrage */}
      <Row style={{ justifyContent: 'center' }} wrap>
        <Text variant="caption" muted>{lastAgo ? tr('u4.bi.lastAgo', { ago: lastAgo }) : tr('u4.bi.noFeed')}</Text>
        {running ? (
          <Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>
            <Text variant="caption" muted>{tr('u4.bi.begin', { time: new Date(running.started_at).toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' }) })}{minutes >= 1 ? tr('u4.bi.beads', { count: minutes }) : ''}</Text>
          </Animated.View>
        ) : null}
      </Row>

      {/* Commandes accessibles (mêmes actions que les gestes) */}
      {running && !summary ? (
        <Animated.View style={{ opacity: reveal, flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'center' }}>
          {paused ? <Button label={tr('u4.bi.resume')} icon="play" onPress={resume} loading={busy} /> : <Button label={tr('u4.bi.pause')} icon="pause" variant="secondary" onPress={pause} loading={busy} />}
          <Button label={tr('u4.bi.finish')} icon="check" onPress={openSummary} />
        </Animated.View>
      ) : null}

      {/* Récapitulatif modifiable avant validation */}
      {summary && running ? (
        <GlassSurface fill={t.colors.surface} depth={2} padded={spacing.md} style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text weight="bold">{tr('u4.bi.recap')}</Text>
            <MotionNumber text={formatChrono(elapsed)} style={{ fontSize: 22, fontWeight: '700', color: t.colors.text }} />
          </Row>
          <Row>
            <View style={{ flex: 1 }}><Field label={tr('u4.bi.prepared')} optional value={prepared} onChangeText={setPrepared} keyboardType="number-pad" maxLength={3} /></View>
            <View style={{ flex: 1 }}><Field label={tr('u4.bi.consumed')} optional value={consumed} onChangeText={setConsumed} keyboardType="number-pad" maxLength={3} /></View>
          </Row>
          <Field label={tr('u4.bi.milkType')} optional value={milk} onChangeText={setMilk} maxLength={80} />
          <Field label={tr('u4.bi.note')} optional value={note} onChangeText={setNote} maxLength={1000} />
          <Text variant="caption" muted>{tr('u4.bi.correct')}</Text>
          <Row wrap>
            <Button label={tr('u4.bi.saveBottle')} icon="check" onPress={finish} loading={busy} />
            <Button label={tr('u4.bi.keepTimer')} variant="secondary" onPress={() => setSummary(false)} />
            <Button label={tr('u4.bi.cancel')} variant="ghost" onPress={cancel} />
          </Row>
        </GlassSurface>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ rappel du prochain biberon : ruban temporel
/**
 * Ruban qui va du dernier biberon à l'heure du rappel : repères toutes les 30 minutes,
 * remplissage et repère « maintenant » calculés depuis les horodatages enregistrés.
 * Une fois l'heure passée, le repère sort du ruban et le texte l'indique (pas seulement la couleur).
 */
export function ReminderRibbon({ lastAt, dueAt, now, remainingLabel, overdue }: { lastAt: string; dueAt: string; now: Date; remainingLabel: string; overdue: boolean }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const [w, setW] = useState(0);
  const start = Date.parse(lastAt);
  const end = Date.parse(dueAt);
  const total = Math.max(1, end - start);
  const frac = Math.max(0, Math.min(1.08, (now.getTime() - start) / total));
  const v = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: frac, duration: reduce ? 0 : 900, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER }).start(); }, [frac, reduce, v]);
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { isInteraction: false, toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(pulse, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, pulse]);
  const ticks = Math.floor(total / 1800000);
  const hm = (ms: number) => new Date(ms).toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' });
  const inner = Math.max(1, w - 24);
  return (
    <GlassSurface fill={t.colors.surface} depth={2} padded={spacing.md} style={{ alignSelf: 'stretch', gap: spacing.sm }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text variant="caption" muted>{overdue ? tr('u4.bi.rem.past') : tr('u4.bi.rem.in')}</Text>
          <MotionNumber text={remainingLabel} style={{ fontSize: 34, fontWeight: '700', letterSpacing: -0.5, color: overdue ? t.colors.danger : t.colors.text }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" muted>{tr('u4.bi.rem.label')}</Text>
          <Text weight="bold">{hm(end)}</Text>
        </View>
      </Row>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 34, justifyContent: 'center' }}
        accessible accessibilityRole="progressbar" accessibilityLabel={tr('u4.bi.rem.a11y', { start: hm(start), end: hm(end), over: overdue ? tr('u4.bi.rem.overSuffix') : '' })}>
        <View style={{ position: 'absolute', left: 12, right: 12, height: 8, borderRadius: 4, backgroundColor: t.colors.border }} />
        {Array.from({ length: ticks }, (_, i) => (
          <View key={i} style={{ position: 'absolute', left: 12 + (((i + 1) * 1800000) / total) * inner - 1, width: 2, height: 14, borderRadius: 1, backgroundColor: t.colors.textMuted, opacity: 0.35 }} />
        ))}
        {w > 0 ? (
          <>
            <Animated.View style={{ position: 'absolute', left: 12, width: inner, height: 8, borderRadius: 4, backgroundColor: t.colors.primary,
              transform: [{ translateX: v.interpolate({ inputRange: [0, 1.08], outputRange: [-inner / 2, -inner / 2 + (inner * 1.08) / 2], extrapolate: 'clamp' }) }, { scaleX: v.interpolate({ inputRange: [0, 1, 1.08], outputRange: [0.0001, 1, 1], extrapolate: 'clamp' }) }] }} />
            <Animated.View style={{ position: 'absolute', left: 0, width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
              transform: [{ translateX: v.interpolate({ inputRange: [0, 1.08], outputRange: [0, inner * 1.08], extrapolate: 'clamp' }) }] }}>
              <Animated.View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: t.colors.primary,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] }) }] }} />
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: t.colors.surface, borderWidth: 3, borderColor: t.colors.primary }} />
            </Animated.View>
          </>
        ) : null}
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" muted>{tr('u4.bi.rem.lastBottle', { time: hm(start) })}</Text>
        <Text variant="caption" muted>{overdue ? tr('u4.bi.rem.over') : tr('u4.bi.rem.now', { time: hm(now.getTime()) })}</Text>
      </Row>
    </GlassSurface>
  );
}
