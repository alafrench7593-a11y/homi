/**
 * Briques du suivi de l'enfant : chronomètre de biberon (cercle animé, horodatages fiables),
 * cartes de repères de sécurité sourcées, repères de couchage, schéma des dents de lait.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, View } from 'react-native';
import { ProgressRing } from '@/components/Charts';
import { usePop } from '@/components/Motion';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Row, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useInvalidate, useRows } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { PRIMARY_TEETH, bottleElapsed, formatChrono, resumePatch, type SafetyNotice } from '@/lib/domain/childCare';
import { CHILD_SOURCES, DEHYDRATION_SIGNS, SAFE_SLEEP } from '@/content/childSafety';
import type { Child } from '@/lib/types';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

// ------------------------------------------------------------------ chronomètre de biberon
interface RunningBottle { id: string; started_at: string; paused_at: string | null; paused_seconds: number; ended_at: string | null; prepared_ml: number | null }

export function BottleStopwatch({ child }: { child: Child }) {
  const toast = useToast();
  const inv = useInvalidate();
  const reduce = useReduceMotion();
  const q = useRows<RunningBottle>(['bottles', child.id, 'running'], { table: 'bottles', filters: [eq('child_id', child.id), eq('in_progress', true)], limit: 1 });
  const running = q.data?.[0] ?? null;
  const now = useNow(1000);
  const [finishing, setFinishing] = useState(false);
  const [prepared, setPrepared] = useState('');
  const [consumed, setConsumed] = useState('');
  const [milk, setMilk] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const paused = !!running?.paused_at;

  useEffect(() => {
    if (!running || paused || reduce) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [running?.id, paused, reduce, pulse]);

  const elapsed = running ? bottleElapsed(running, now) : 0;
  const act = async (fn: () => Promise<unknown>, msg?: string) => {
    setBusy(true);
    try { await fn(); inv('bottles'); if (msg) toast(msg); } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  };
  const start = () => { haptic('success'); return act(() => backend.insert('bottles', { child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), started_at: new Date().toISOString(), in_progress: true }), 'C’est parti. Le temps continue même si vous quittez l’écran.'); };
  const pause = () => act(() => backend.update('bottles', { paused_at: new Date().toISOString() }, [eq('id', running!.id)]));
  const resume = () => act(() => backend.update('bottles', resumePatch(running!), [eq('id', running!.id)]));

  async function finish() {
    if (!running) return;
    const p = prepared.trim() ? Number(prepared) : null;
    const c = consumed.trim() ? Number(consumed) : null;
    if ((p != null && (!Number.isInteger(p) || p < 0 || p > 500)) || (c != null && (!Number.isInteger(c) || c < 0 || c > 500))) return toast('Quantités entre 0 et 500 ml.', 'error');
    if (p != null && c != null && c > p) return toast('La quantité bue ne peut pas dépasser la quantité préparée.', 'error');
    const end = new Date();
    const patch = { ...resumePatch(running, end), ended_at: (running.paused_at ? new Date(running.paused_at) : end).toISOString(), in_progress: false, at: running.started_at, prepared_ml: p, consumed_ml: c, milk_type: milk.trim() || null, note: note.trim() || null };
    await act(() => backend.update('bottles', patch, [eq('id', running.id)]), `Biberon enregistré : ${formatChrono(bottleElapsed({ ...running, ...patch }))} de prise.`);
    haptic('success');
    setFinishing(false); setPrepared(''); setConsumed(''); setMilk(''); setNote('');
  }
  const cancel = () => act(() => backend.remove('bottles', [eq('id', running!.id)]), 'Chronomètre annulé.');

  return (
    <Card>
      <Row style={{ alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] }}>
          <ProgressRing progress={running ? (elapsed % 60) / 60 : 0} size={104} label={running ? `Prise en cours depuis ${formatChrono(elapsed)}${paused ? ', en pause' : ''}` : 'Chronomètre arrêté'}>
            <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>{formatChrono(elapsed)}</Text>
            <Text variant="caption" muted>{running ? (paused ? 'en pause' : 'en cours') : 'prise'}</Text>
          </ProgressRing>
        </Animated.View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text weight="bold">Chronomètre de prise</Text>
          {!running ? (
            <>
              <Text variant="caption" muted>Démarrez au début du biberon. Le temps est calculé à partir de l’heure de début.</Text>
              <Button label="Démarrer" icon="play" size="sm" onPress={start} loading={busy} style={{ alignSelf: 'flex-start' }} />
            </>
          ) : (
            <Row wrap>
              {paused ? <Button label="Reprendre" icon="play" size="sm" onPress={resume} loading={busy} /> : <Button label="Pause" icon="pause" size="sm" variant="secondary" onPress={pause} loading={busy} />}
              <Button label="Terminer" icon="check" size="sm" onPress={() => setFinishing(true)} />
            </Row>
          )}
          {running ? <Text variant="caption" muted>Début : {new Date(running.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text> : null}
        </View>
      </Row>
      {finishing && running ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Row>
            <View style={{ flex: 1 }}><Field label="Préparé (ml)" optional value={prepared} onChangeText={setPrepared} keyboardType="number-pad" maxLength={3} /></View>
            <View style={{ flex: 1 }}><Field label="Bu (ml)" optional value={consumed} onChangeText={setConsumed} keyboardType="number-pad" maxLength={3} /></View>
          </Row>
          <Field label="Type de lait" optional value={milk} onChangeText={setMilk} maxLength={80} />
          <Field label="Note" optional value={note} onChangeText={setNote} maxLength={1000} />
          <Text variant="caption" muted>Les quantités sont celles que vous avez préparées et observées : l’application n’en calcule ni n’en recommande.</Text>
          <Row wrap>
            <Button label="Enregistrer le biberon" icon="check" onPress={finish} loading={busy} />
            <Button label="Annuler ce chronomètre" variant="ghost" onPress={cancel} />
          </Row>
        </View>
      ) : null}
    </Card>
  );
}

// ------------------------------------------------------------------ repères de sécurité
export function SafetyNoticeCard({ n }: { n: SafetyNotice }) {
  const t = useTheme();
  const src = CHILD_SOURCES[n.source];
  return (
    <Banner tone={n.level === 'watch' ? 'warning' : 'danger'} title={n.title}>
      <Text variant="small">{n.body}</Text>
      {n.source === 'dehydration' ? (
        <View style={{ marginTop: 4 }}>
          <Text variant="small" weight="bold">Signes de déshydratation à surveiller :</Text>
          {DEHYDRATION_SIGNS.map((s) => <Text key={s} variant="small">• {s}</Text>)}
        </View>
      ) : null}
      <Text variant="caption" muted style={{ marginTop: 4 }}>Ce repère ne dit pas ce que votre enfant a : seul un professionnel peut le faire.</Text>
      <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(src.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
        <Text variant="caption" color={t.colors.primary}>Source : {src.publisher}</Text>
      </Tappable>
    </Banner>
  );
}

export function SafeSleepCard() {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Card tone="soft" onPress={() => setOpen((v) => !v)} accessibilityLabel="Repères pour un couchage sûr">
      <Text weight="bold">Repères pour un couchage sûr</Text>
      {open ? (
        <View style={{ gap: 4, marginTop: 6 }}>
          {SAFE_SLEEP.map((s) => <Text key={s} variant="small">• {s}</Text>)}
          <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(CHILD_SOURCES.sleep.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
            <Text variant="caption" color={t.colors.primary}>Source : {CHILD_SOURCES.sleep.publisher}</Text>
          </Tappable>
        </View>
      ) : <Text variant="caption" muted>Touchez pour afficher les 7 repères.</Text>}
    </Card>
  );
}

// ------------------------------------------------------------------ schéma des dents de lait
export function ToothChart({ present, onPick }: { present: Set<string>; onPick: (label: string) => void }) {
  const t = useTheme();
  const W = 300;
  const tooth = (arch: 'top' | 'bottom', index: number) => {
    const angle = Math.PI * (0.08 + (index / 9) * 0.84);
    const rx = 120, ry = 80, cx = W / 2;
    const x = cx - Math.cos(angle) * rx;
    const y = arch === 'top' ? 100 - Math.sin(angle) * ry : 130 + Math.sin(angle) * ry;
    return { x, y };
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: W, height: 230 }}>
        {PRIMARY_TEETH.map((d) => {
          const p = tooth(d.arch, d.index);
          return <ToothDot key={d.id} label={d.label} on={present.has(d.label)} x={p.x} y={p.y} size={d.label.includes('molaire') ? 26 : 22} onPick={onPick} />;
        })}
        <Text variant="caption" muted style={{ position: 'absolute', top: 104, width: W, textAlign: 'center' }}>haut ↑   ·   bas ↓</Text>
      </View>
      <Row wrap style={{ justifyContent: 'center' }}>
        <Chip label={`${present.size} / 20 notées`} />
      </Row>
    </View>
  );
}

/** Une dent : s'illumine et « éclot » quand elle est notée (halo bref), reste sobre sinon. */
function ToothDot({ label, on, x, y, size, onPick }: { label: string; on: boolean; x: number; y: number; size: number; onPick: (l: string) => void }) {
  const t = useTheme();
  const pop = usePop(on, 1.35);
  return (
    <Tappable accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={() => { haptic('selection'); onPick(label); }} hitSlop={4}
      style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }}>
      <Animated.View style={[{ flex: 1, borderRadius: size / 3, borderWidth: 2, borderColor: on ? t.colors.primary : t.colors.lavender, backgroundColor: on ? t.colors.primary : t.colors.surfaceAlt }, pop]} />
    </Tappable>
  );
}
