/**
 * Feuille d'une session de sommeil (Tray de Reacticx, MIT — src/components/reacticx) posée sur le verre HOMI.
 *  · vue « session » : la durée en grand (« 1 h 25 »), les heures, la note, où elle se situe par rapport à ses siestes
 *    comparables, puis « Analyser avec Aura » (ouvre Aura dans le contexte de CETTE session), « Comparer », « Modifier » ;
 *  · vue « comparer » : graphique Victory Native XL (siestes comparables + celle-ci), lu au doigt.
 * La feuille se tire vers le bas pour se fermer ; Réduire les animations est respecté par le Tray.
 */
import React from 'react';
import { View } from 'react-native';
import { Tray, useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Icon, Text } from '@/components/ui';
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

export function NapSessionTray({ child, all, session, open, onOpenChange, onAnalyze, onEdit }: {
  child: Child; all: readonly Sleep[]; session: Sleep | null; open: boolean; onOpenChange: (v: boolean) => void;
  onAnalyze: (s: Sleep) => void; onEdit: (s: Sleep) => void;
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
                {f.w.samples.length ? <CompareTrigger /> : null}
                <GlassButton variant="tertiary" icon="edit-2" label={tr('nn.sel.edit')} testID="nap-tray-edit" onPress={() => { onOpenChange(false); onEdit(session); }} />
              </View>
            </View>
          </View>
        </Tray.View>
        <Tray.View id="compare">
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="nap-tray-compare">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Tray.Back><View testID="nap-tray-back" accessibilityLabel={tr('nn.tray.back')}><Icon name="chevron-left" size={22} color={t.colors.text} /></View></Tray.Back>
              <Text variant="label" style={{ flex: 1 }} accessibilityRole="header">{tr('nn.tray.compareTitle')}</Text>
            </View>
            <NapCompare samples={f.w.samples} current={{ started_at: session.started_at, minutes: f.minutes, label: tr('nn.tray.this') }} low={f.w.low} high={f.w.high} />
            <Text variant="caption" muted>{tr('nn.facts.rule')}</Text>
            <GlassButton variant="primary" full icon="message-circle" label={tr('nn.tray.analyze')} testID="nap-tray-analyze-2" onPress={() => { onOpenChange(false); onAnalyze(session); }} />
          </View>
        </Tray.View>
      </Tray.Content>
    </Tray>
  );
}

/** « Comparer » : pousse la vue du graphique dans la même feuille (transition latérale du Tray). */
function CompareTrigger() {
  const { setView } = useTray();
  return <GlassButton variant="secondary" icon="bar-chart-2" label={tr('nn.tray.compare')} testID="nap-tray-compare-open" onPress={() => setView('compare')} />;
}
