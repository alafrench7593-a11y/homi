/**
 * Feuille d'une session de sommeil (Tray de Reacticx, MIT — src/components/reacticx) posée sur le verre HOMI.
 *  · vue « session » : la durée en grand (« 1 h 25 »), les heures, la note, où elle se situe par rapport à ses siestes
 *    comparables, puis « Analyser avec Aura » (ouvre Aura dans le contexte de CETTE session), « Comparer », « Modifier » ;
 *  · vue « comparer » : graphique Victory Native XL (siestes comparables + celle-ci), lu au doigt.
 * La feuille se tire vers le bas pour se fermer ; Réduire les animations est respecté par le Tray.
 */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Tray, useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Field, haptic, Icon, Text } from '@/components/ui';
import { useSleepActions } from '@/lib/data/hooks-sleepPlanner';
import { proposedEnd } from '@/lib/domain/sleepSummary';
import { useMotion } from '@/motion';
import { t as tr } from '@/i18n';
import { clock, span } from '@/lib/domain/sleepPlanner';
import type { Child, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { napWindow, type NapRecord } from '../../../supabase/functions/_shared/nap-window';
import { NapCompare } from './SkiaHost';

const TABULAR = { fontVariant: ['tabular-nums' as const] };

/** Durée et position d'une session terminée par rapport à ses siestes comparables (même règle que la sieste en cours). */
export function sessionFacts(child: Child, all: readonly Sleep[], s: Sleep) {
  const end = s.ended_at ? Date.parse(s.ended_at) : Date.now();
  const minutes = Math.max(0, Math.round((end - Date.parse(s.started_at)) / 60_000));
  const w = napWindow(all.filter((x) => x.child_id === child.id) as unknown as NapRecord[], child.id, s.started_at);
  const where: 'inside' | 'longer' | 'shorter' | 'none' = w.status !== 'ok' || w.low == null || w.high == null ? 'none' : minutes > w.high ? 'longer' : minutes < w.low ? 'shorter' : 'inside';
  return { minutes, w, where };
}

export function NapSessionTray({ child, all, session, open, onOpenChange, onAnalyze, onEdit, onRelay, onSaved, onOpenOther }: {
  child: Child; all: readonly Sleep[]; session: Sleep | null; open: boolean; onOpenChange: (v: boolean) => void;
  onAnalyze: (s: Sleep) => void; onEdit: (s: Sleep) => void; onRelay?: () => void;
  /** Correction enregistrée (la frise anime alors le segment) */
  onSaved?: (s: Sleep) => void;
  /** Une autre session touchée dans le graphique : l'ouvrir */
  onOpenOther?: (id: string) => void;
}) {
  const t = useTheme();
  if (!session) return null;
  const f = sessionFacts(child, all, session);
  const range = tr('nn.tray.range', { from: clock(new Date(session.started_at)), to: session.ended_at ? clock(new Date(session.ended_at)) : '…' });
  const vs = f.where === 'none' ? tr('nn.tray.vsNone')
    : tr(f.where === 'inside' ? 'nn.tray.vsInside' : f.where === 'longer' ? 'nn.tray.vsLonger' : 'nn.tray.vsShorter', { low: f.w.low!, high: f.w.high! });
  const palette = { surface: 'transparent', border: t.colors.border, handle: t.colors.textMuted, text: t.colors.text, mutedText: t.colors.textMuted, backdrop: t.colors.overlay };
  return (
    <Tray open={open} onOpenChange={onOpenChange} defaultView="session" palette={palette} theme={t.isDark ? 'dark' : 'light'} radius={34}
      motion={{ viewAxis: 'x', viewSlide: 60, viewStartScale: 1 }}>
      <Tray.Content surface={<Glass variant="sheet" radius={34} style={{ flex: 1 }} />}>
        <Tray.View id="session">
          <View testID="nap-tray" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="label" muted style={{ flex: 1 }} accessibilityRole="header">{tr('nn.tray.title', { name: child.first_name })}</Text>
              <Tray.Close><Icon name="x" size={20} color={t.colors.text} /></Tray.Close>
            </View>
            <Text testID="nap-tray-duration" maxFontSizeMultiplier={1.3} style={[{ fontSize: 64, lineHeight: 70, letterSpacing: -2, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{span(f.minutes)}</Text>
            <Text weight="bold" style={TABULAR} testID="nap-tray-range">{range}</Text>
            {session.note ? (
              <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.sm, flexDirection: 'row', gap: spacing.xs }} testID="nap-tray-note">
                <Icon name="message-square" size={16} color={t.colors.primary} />
                <Text style={{ flex: 1 }}>{session.note}</Text>
              </Glass>
            ) : null}
            <Text variant="small" muted testID="nap-tray-vs">{vs}</Text>
            <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
              <GlassButton variant="primary" full icon="message-circle" label={tr('nn.tray.analyze')} testID="nap-tray-analyze" onPress={() => { onOpenChange(false); onAnalyze(session); }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {session.ended_at ? <PushView view="edit" icon="clock" label={tr('nn.edit.fixEnd')} testID="nap-tray-fix-end" variant="secondary" /> : null}
                {f.w.samples.length ? <PushView view="compare" icon="bar-chart-2" label={tr('nn.tray.compare')} testID="nap-tray-compare-open" variant="secondary" /> : null}
                {onRelay ? <GlassButton variant="tertiary" icon="repeat" label={tr('nn.tray.relay')} testID="nap-tray-relay" onPress={() => { onOpenChange(false); onRelay(); }} /> : null}
                <GlassButton variant="tertiary" icon="edit-2" label={tr('nn.sel.edit')} testID="nap-tray-edit" onPress={() => { onOpenChange(false); onEdit(session); }} />
              </View>
            </View>
          </View>
        </Tray.View>
        <Tray.View id="edit">
          <EditEndView key={`${session.id}:${session.ended_at}`} child={child} session={session} all={all} onSaved={onSaved} />
        </Tray.View>
        <Tray.View id="compare">
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="nap-tray-compare">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Tray.Back><View testID="nap-tray-back" accessibilityLabel={tr('nn.tray.back')}><Icon name="chevron-left" size={22} color={t.colors.text} /></View></Tray.Back>
              <Text variant="label" style={{ flex: 1 }} accessibilityRole="header">{tr('nn.tray.compareTitle')}</Text>
            </View>
            <NapCompare samples={f.w.samples} current={{ started_at: session.started_at, minutes: f.minutes, label: tr('nn.tray.this'), id: session.id }} low={f.w.low} high={f.w.high}
              onOpen={(id) => { if (id !== session.id) { onOpenChange(false); onOpenOther?.(id); } }} />
            <Text variant="caption" muted>{tr('nn.facts.rule')}</Text>
            <GlassButton variant="primary" full icon="message-circle" label={tr('nn.tray.analyze')} testID="nap-tray-analyze-2" onPress={() => { onOpenChange(false); onAnalyze(session); }} />
          </View>
        </Tray.View>
      </Tray.Content>
    </Tray>
  );
}

/** Pousse une vue dans la même feuille (transition latérale du Tray). */
function PushView({ view, icon, label, testID, variant }: { view: string; icon: 'clock' | 'bar-chart-2'; label: string; testID: string; variant: 'secondary' | 'tertiary' }) {
  const { setView } = useTray();
  return <GlassButton variant={variant} icon={icon} label={label} testID={testID} onPress={() => setView(view)} />;
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const MIN = 60_000;

/**
 * « Modifier la fin » (storyboard états 3 à 5) : début ancré, fin proposée, durée PROVISOIRE en grand, échelle figée
 * sur la session d'origine (on voit le raccourcissement), Annuler restitue les valeurs initiales ; Enregistrer passe
 * par la MÊME opération que la feuille de modification (useSleepActions.edit), une seule écriture même en double appui ;
 * en cas d'échec, le brouillon reste affiché avec le message.
 */
function EditEndView({ child, session, all, onSaved }: { child: Child; session: Sleep; all: readonly Sleep[]; onSaved?: (s: Sleep) => void }) {
  const t = useTheme();
  const m = useMotion();
  const { goBack } = useTray();
  const act = useSleepActions(child);
  const end0 = new Date(session.ended_at ?? Date.now());
  const [text, setText] = useState(hhmm(end0));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const start = new Date(session.started_at);
  const end = proposedEnd(session, text);
  const minutes = end ? Math.round((end.getTime() - start.getTime()) / MIN) : null;
  const changed = !!end && end.getTime() !== end0.getTime();
  // Échelle FIGÉE sur la session d'origine (heures pleines encadrantes, au moins 3 h)
  const from = Math.floor((start.getTime() - 30 * MIN) / 3_600_000) * 3_600_000;
  const to = Math.max(from + 3 * 3_600_000, Math.ceil((end0.getTime() + 30 * MIN) / 3_600_000) * 3_600_000);
  const pct = (ms: number) => `${Math.max(0, Math.min(100, ((ms - from) / (to - from)) * 100))}%` as `${number}%`;
  const step = (d: number) => { const b = end ?? end0; setText(hhmm(new Date(b.getTime() + d * MIN))); setError(null); };
  const cancel = () => { setText(hhmm(end0)); setError(null); goBack(); };
  const save = async () => {
    if (inflight.current || !end) return;           // double appui : une seule écriture
    inflight.current = true; setBusy(true); setError(null);
    try {
      await act.edit(session, { started_at: start, ended_at: end, kind: session.kind === 'night' ? 'night' : 'nap' }, all as Sleep[]);
      haptic('success');
      onSaved?.({ ...session, ended_at: end.toISOString() });
      goBack();
    } catch (e) {
      setError(`${tr('nn.edit.failed')}${e instanceof Error && e.message ? ` (${e.message})` : ''}`);
    } finally { inflight.current = false; setBusy(false); }
  };
  const ticks: number[] = []; for (let h = from; h <= to; h += 3_600_000) ticks.push(h);
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="nap-tray-editor">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="label" style={{ flex: 1 }} accessibilityRole="header">{tr('nn.edit.title')}</Text>
      </View>
      <Text testID="nap-edit-duration" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3}
        style={[{ fontSize: 64, lineHeight: 70, letterSpacing: -2, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{minutes != null && minutes > 0 ? span(minutes) : '—'}</Text>
      <Text weight="bold" style={TABULAR} testID="nap-edit-proposed">
        {end && changed ? tr('nn.edit.proposed', { time: clock(end) }) : tr('nn.tray.range', { from: clock(start), to: clock(end0) })}
      </Text>
      {/* Même échelle avant / après : contour pointillé = fin d'origine, plein = fin proposée */}
      <View style={{ height: 56, justifyContent: 'center' }} accessible accessibilityLabel={`${clock(start)} – ${end ? clock(end) : '…'}`} testID="nap-edit-band">
        <View style={{ position: 'absolute', left: 0, right: 0, top: 40, height: 1, backgroundColor: t.colors.border }} />
        {ticks.map((h) => <View key={h} style={{ position: 'absolute', left: pct(h), top: 36, width: 1, height: 9, backgroundColor: t.colors.textMuted }} />)}
        <View style={{ position: 'absolute', left: pct(start.getTime()), width: `${((end0.getTime() - start.getTime()) / (to - from)) * 100}%`, top: 10, height: 20, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted }} />
        {end ? <View testID="nap-edit-bar" style={{ position: 'absolute', left: pct(start.getTime()), width: `${(Math.max(0, Math.min(end.getTime(), to) - start.getTime()) / (to - from)) * 100}%`, top: 10, height: 20, borderRadius: 10, backgroundColor: t.colors.text, opacity: m.off ? 1 : 0.92 }} /> : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {ticks.map((h) => <Text key={h} variant="caption" muted numberOfLines={1} style={TABULAR}>{`${new Date(h).getHours()} h`}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <GlassButton variant="secondary" label={tr('nn.edit.minus')} testID="nap-edit-minus" onPress={() => step(-5)} />
        <View style={{ flex: 1 }}><Field label={tr('nn.edit.endLabel')} value={text} onChangeText={(v) => { setText(v); setError(null); }} keyboardType="numbers-and-punctuation" maxLength={5} testID="nap-edit-end" error={end ? undefined : tr('nn.edit.badTime')} /></View>
        <GlassButton variant="secondary" label={tr('nn.edit.plus')} testID="nap-edit-plus" onPress={() => step(5)} />
      </View>
      {error ? <Text variant="small" color={t.colors.danger} testID="nap-edit-error" accessibilityLiveRegion="assertive">{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('nn.edit.cancel')} testID="nap-edit-cancel" onPress={cancel} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="primary" full label={tr('nn.edit.save')} testID="nap-edit-save" disabled={!changed || !end || busy} onPress={save} /></View>
      </View>
    </View>
  );
}
