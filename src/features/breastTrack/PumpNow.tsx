/**
 * TIRE-LAIT — la journée des séances (22/11/2026). Une séance = une ligne de `pumpings` (heure, ml, côté).
 *  1. PREMIER REGARD : dernière séance, total du jour en ml (chiffres de largeur fixe ; rien de noté ≠ 0 ml) ;
 *     saisie au pouce : côté, quantité (±10 ml, valeurs rapides), « Noter maintenant » (protégé du double appui).
 *  2. EXPLORATION : frise du jour touchable (hauteur = ml), liste équivalente, 7 derniers jours en ml.
 *  3. CORRECTION : fiche (Tray) d'une séance, quantité PROVISOIRE, Annuler, Enregistrer, brouillon gardé si échec.
 * Pas de minuteur : la table ne garde pas de durée de séance (aucune durée inventée).
 */
import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Tray, useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton, GlassSegmentedControl } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { Field, haptic, Icon, Text } from '@/components/ui';
import { MilkStockLink } from '@/features/feeding/TrackLinks';
import { formatDate, t as tr } from '@/i18n';
import { useLogs } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { usePumpActions } from '@/lib/data/hooks-breast';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { clock } from '@/lib/domain/sleepPlanner';
import { lastPump, parsePumpMl, pumpsByDay, type PumpLike } from '@/lib/domain/pumpSession';
import type { Child, Pumping } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { COOLDOWN_MS, dayDate, sideLabel } from './BreastNow';
import { SessionBand, TABULAR, useTicker, WeekBars, type BandItem } from './SessionBand';

type PSide = 'left' | 'right' | 'both';
const PRESETS = [60, 80, 100, 120, 150];
const BIG = { fontSize: 56, lineHeight: 62, letterSpacing: -1.5 } as const;

export function pumpLine(p: PumpLike): string {
  return p.side ? tr('bt.pump.row', { time: clock(new Date(p.at)), ml: p.amount_ml, side: sideLabel(p.side) }) : tr('bt.pump.rowNoSide', { time: clock(new Date(p.at)), ml: p.amount_ml });
}

function QuickPump({ child, lastSide }: { child: Child; lastSide: PSide | null }) {
  const t = useTheme();
  const toast = useToast();
  const act = usePumpActions(child);
  const [side, setSide] = useState<PSide>(lastSide ?? 'both');
  const [ml, setMl] = useState(100);
  const inflight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (inflight.current) return;                 // double appui : une seule séance
    inflight.current = true; setBusy(true); setError(null);
    let ok = false;
    try {
      const r = await act.add(ml, side, new Date());
      ok = true;
      haptic('success');
      toast(r === 'queued' ? tr('bt.pump.queued') : tr('bt.pump.saved', { ml }), r === 'queued' ? 'info' : 'success');
    } catch (e) { setError(friendlyError(e, tr('bt.err.failed'))); }
    finally {
      setBusy(false);
      // Le second appui d'un double appui arrive souvent après l'écriture : ignoré un court instant
      if (ok) setTimeout(() => { inflight.current = false; }, COOLDOWN_MS); else inflight.current = false;
    }
  };
  return (
    <View style={{ gap: spacing.sm }} testID="bt-pump-quick">
      <GlassSegmentedControl label={tr('bt.pump.side')} value={side} onChange={setSide} testID="bt-pump-side"
        options={(['left', 'right', 'both'] as PSide[]).map((s) => ({ value: s, label: sideLabel(s), testID: `bt-pump-side-${s}` }))} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <GlassButton variant="secondary" label={tr('bt.pump.minus')} testID="bt-pump-minus" onPress={() => setMl((v) => Math.max(0, v - 10))} />
        <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={tr('bt.pump.amountA11y', { ml })}>
          <Text testID="bt-pump-ml" maxFontSizeMultiplier={1.2} style={[{ fontSize: 26, lineHeight: 32, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{`${ml} ml`}</Text>
        </View>
        <GlassButton variant="secondary" label={tr('bt.pump.plus')} testID="bt-pump-plus" onPress={() => setMl((v) => Math.min(1000, v + 10))} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
        {PRESETS.map((v) => (
          <Tappable key={v} accessibilityRole="button" accessibilityState={{ selected: v === ml }} onPress={() => setMl(v)} testID={`bt-pump-preset-${v}`}
            style={{ minHeight: 44, minWidth: 56, paddingHorizontal: spacing.sm, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
              backgroundColor: v === ml ? t.colors.text : 'transparent', borderWidth: 1.5, borderColor: v === ml ? t.colors.text : t.colors.border }}>
            <Text weight="bold" color={v === ml ? t.colors.background : t.colors.text} style={TABULAR}>{String(v)}</Text>
          </Tappable>
        ))}
      </View>
      <GlassButton variant="primary" size="lg" full icon="check" label={tr('bt.pump.save', { ml })} disabled={busy} onPress={() => void save()} testID="bt-pump-save" />
      {error ? <Text variant="small" color={t.colors.danger} testID="bt-pump-error" accessibilityLiveRegion="assertive">{error}</Text> : null}
    </View>
  );
}

export function PumpNow({ child, focus }: { child: Child; focus?: string | null }) {
  const t = useTheme();
  const q = useLogs<Pumping>('pumping', child.id, 8, { includePending: true });
  const all = useMemo(() => (q.data ?? []).filter((p) => p.child_id === child.id) as (Pumping & PumpLike)[], [q.data, child.id]);
  const now = useTicker(false);
  const [sel, setSel] = useState<string | null>(focus ?? null);
  const [trayId, setTrayId] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const openPump = (id: string) => { setSel(id); setTrayId(id); setTrayOpen(true); };
  const week = pumpsByDay(all, child.id, now, 7);
  const today = week[6];
  const last = lastPump(all, child.id);
  const maxMl = Math.max(150, ...today.sessions.map((p) => p.amount_ml));
  const items: BandItem[] = today.sessions.map((p) => {
    const d = new Date(p.at); const m = d.getHours() * 60 + d.getMinutes();
    return { id: p.id, start: m, end: m, pieces: [{ lane: 'all', start: m, end: m + 4, kind: 'solid', height: Math.max(0.12, p.amount_ml / maxMl) }], note: p.note, text: pumpLine(p) };
  });
  const title = last ? tr('bt.pump.last', { time: clock(new Date(last.at)), ago: agoLabel(last.at, now) }) : tr('bt.pump.none');
  return (
    <View style={{ gap: spacing.sm }}>
      <Glass variant="card" radius={radius.xl} testID="bt-pump-hero" contentStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text variant="heading" accessibilityRole="header" testID="bt-pump-title">{title}</Text>
        <View style={{ gap: 2 }} accessible accessibilityLabel={today.ml != null ? tr('bt.pump.todayA11y', { ml: today.ml, count: today.count }) : tr('bt.pump.todayNone')}>
          <Text testID="bt-pump-today" maxFontSizeMultiplier={1.3} style={[BIG, { fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{today.ml != null ? `${today.ml} ml` : '—'}</Text>
          <Text variant="small" muted>{today.ml != null ? tr('bt.pump.todayLabel', { count: today.count }) : tr('bt.pump.todayNone')}</Text>
        </View>
        <QuickPump child={child} lastSide={last?.side ?? null} />
      </Glass>
      <SessionBand testID="bt-pump-band" title={tr('bt.pump.bandTitle')} total={today.ml != null ? tr('bt.pump.total', { count: today.count, ml: today.ml }) : tr('bt.band.none')}
        items={items} lanes={[]} now={now} selectedId={sel} onSelect={setSel} onOpen={openPump} hint={tr('bt.pump.hint')}
        a11y={tr('bt.pump.a11y', { list: items.map((i) => i.text).join('. ') || tr('bt.band.none') })}
        legend={[{ kind: 'solid', label: tr('bt.pump.legend') }, { kind: 'gap', label: tr('bt.band.legendGap') }]} />
      <WeekBars title={tr('bt.pump.weekTitle')} testID="bt-pump-week"
        days={week.map((d) => ({ key: d.day, label: formatDate(dayDate(d.day), { weekday: 'narrow' }), value: d.ml, text: d.ml != null ? String(d.ml) : '—',
          a11y: `${formatDate(dayDate(d.day), { weekday: 'long', day: 'numeric' })} : ${d.ml != null ? tr('bt.pump.todayA11y', { ml: d.ml, count: d.count }) : tr('bt.band.legendGap')}` }))} />
      <MilkStockLink childId={child.id} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <GlassButton variant="secondary" icon="edit-3" label={tr('bt.pump.manual')} testID="bt-pump-manual"
          onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'pumping', child: child.id, manual: '1' } } as never)} />
        <GlassButton variant="tertiary" icon="droplet" label={tr('bt.breastLink')} testID="bt-breast-link"
          onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id } } as never)} />
      </View>
      <PumpTray child={child} pump={trayId ? all.find((p) => p.id === trayId) ?? null : null} open={trayOpen} onOpenChange={setTrayOpen}
        onEditAll={(p) => router.push({ pathname: '/track/[kind]', params: { kind: 'pumping', child: child.id, id: p.id } } as never)} />
    </View>
  );
}

function PumpTray({ child, pump, open, onOpenChange, onEditAll }: { child: Child; pump: Pumping | null; open: boolean; onOpenChange: (v: boolean) => void; onEditAll: (p: Pumping) => void }) {
  const t = useTheme();
  if (!pump) return null;
  const palette = { surface: 'transparent', border: t.colors.border, handle: t.colors.textMuted, text: t.colors.text, mutedText: t.colors.textMuted, backdrop: t.colors.overlay };
  return (
    <Tray open={open} onOpenChange={onOpenChange} defaultView="pump" palette={palette} theme={t.isDark ? 'dark' : 'light'} radius={34} motion={{ viewAxis: 'x', viewSlide: 60, viewStartScale: 1 }}>
      <Tray.Content surface={<Glass variant="sheet" radius={34} style={{ flex: 1 }} />}>
        <Tray.View id="pump">
          <View testID="bt-pump-tray" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="label" muted style={{ flex: 1 }} accessibilityRole="header">{tr('bt.pump.trayTitle', { time: clock(new Date(pump.at)) })}</Text>
              <Tray.Close><View accessibilityLabel={tr('bt.tray.close')}><Icon name="x" size={20} color={t.colors.text} /></View></Tray.Close>
            </View>
            <Text testID="bt-pump-tray-ml" maxFontSizeMultiplier={1.3} style={[{ fontSize: 64, lineHeight: 70, letterSpacing: -2, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{`${pump.amount_ml} ml`}</Text>
            <Text weight="bold" style={TABULAR}>{`${formatDate(pump.at, { weekday: 'long', day: 'numeric', month: 'long' })} · ${clock(new Date(pump.at))}${pump.side ? ` · ${sideLabel(pump.side)}` : ''}`}</Text>
            {pump.note ? (
              <Glass variant="card" radius={radius.lg} contentStyle={{ padding: spacing.sm, flexDirection: 'row', gap: spacing.xs }}>
                <Icon name="message-square" size={16} color={t.colors.primary} />
                <Text style={{ flex: 1 }}>{pump.note}</Text>
              </Glass>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
              <PushAmount />
              <GlassButton variant="tertiary" icon="edit-2" label={tr('bt.tray.editAll')} testID="bt-pump-tray-edit" onPress={() => { onOpenChange(false); onEditAll(pump); }} />
            </View>
          </View>
        </Tray.View>
        <Tray.View id="amount">
          <EditAmount key={`${pump.id}:${pump.amount_ml}`} child={child} pump={pump} />
        </Tray.View>
      </Tray.Content>
    </Tray>
  );
}

function PushAmount() {
  const { setView } = useTray();
  return <GlassButton variant="secondary" icon="sliders" label={tr('bt.pump.fixAmount')} testID="bt-pump-tray-fix" onPress={() => setView('amount')} />;
}

function EditAmount({ child, pump }: { child: Child; pump: Pumping }) {
  const t = useTheme();
  const act = usePumpActions(child);
  const { goBack } = useTray();
  const [text, setText] = useState(String(pump.amount_ml));
  const inflight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ml = parsePumpMl(text);
  const changed = ml != null && ml !== pump.amount_ml;
  const step = (d: number) => { setText(String(Math.min(1000, Math.max(0, (ml ?? pump.amount_ml) + d)))); setError(null); };
  const save = async () => {
    if (inflight.current || ml == null) return;
    inflight.current = true; setBusy(true); setError(null);
    try { await act.edit(pump, { amount_ml: ml }); haptic('success'); goBack(); }
    catch (e) { setError(friendlyError(e, tr('bt.err.failed'))); }
    finally { inflight.current = false; setBusy(false); }
  };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="bt-pump-edit">
      <Text variant="label" accessibilityRole="header">{tr('bt.pump.fixAmount')}</Text>
      <Text testID="bt-pump-edit-ml" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={[{ fontSize: 64, lineHeight: 70, letterSpacing: -2, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{ml != null ? `${ml} ml` : '—'}</Text>
      <Text variant="small" muted style={TABULAR}>{changed ? tr('bt.pump.was', { ml: pump.amount_ml }) : ' '}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <GlassButton variant="secondary" label={tr('bt.pump.minus')} testID="bt-pump-edit-minus" onPress={() => step(-10)} />
        <View style={{ flex: 1 }}><Field label={tr('bt.pump.amountLabel')} value={text} onChangeText={(v) => { setText(v); setError(null); }} keyboardType="number-pad" maxLength={4} suffix="ml" testID="bt-pump-edit-field" error={ml != null ? undefined : tr('bt.pump.badMl')} /></View>
        <GlassButton variant="secondary" label={tr('bt.pump.plus')} testID="bt-pump-edit-plus" onPress={() => step(10)} />
      </View>
      {error ? <Text variant="small" color={t.colors.danger} testID="bt-pump-edit-error" accessibilityLiveRegion="assertive">{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('bt.edit.cancel')} testID="bt-pump-edit-cancel" onPress={() => { setText(String(pump.amount_ml)); setError(null); goBack(); }} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="primary" full label={tr('bt.edit.save')} testID="bt-pump-edit-save" disabled={!changed || busy} onPress={() => void save()} /></View>
      </View>
    </View>
  );
}
