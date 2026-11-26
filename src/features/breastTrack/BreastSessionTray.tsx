/**
 * Fiche d'une tétée (Tray de Reacticx, MIT — src/components/reacticx) posée sur le verre HOMI (22/11/2026).
 *  · vue « tétée » : durée en grand, heures, durée de CHAQUE côté (barres sur la même échelle), note ;
 *  · « Corriger la fin » et « Corriger un côté » : valeur PROVISOIRE en grand (durée, côtés, nouvelle fin), Annuler
 *    rend les valeurs d'origine, Enregistrer = une seule écriture même en double appui (ref `inflight`) ; en cas
 *    d'échec, le brouillon reste affiché avec le message ;
 *  · « Tout modifier » ouvre le formulaire complet (note, suppression).
 */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Tray, useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton, GlassSegmentedControl } from '@/components/glass';
import { MatteSurface } from '@/components/surfaces';
import { Field, haptic, Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useBreastActions } from '@/lib/data/hooks-breast';
import { clock, span } from '@/lib/domain/sleepPlanner';
import {
  feedMinutes, isOngoing, proposedFeedEnd, withEnd, withSideMinutes, type BreastSide, type FeedDurations, type FeedLike,
} from '@/lib/domain/breastSession';
import type { Breastfeed, Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { sideLabel } from './BreastNow';
import { TABULAR } from './SessionBand';

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const BIG = { fontSize: 64, lineHeight: 70, letterSpacing: -2 } as const;

/** Durées par côté en barres sur une même échelle ; côté non noté = cadre en tirets « non noté ». */
function SideBars({ m, scale, testID }: { m: FeedDurations; scale: number; testID: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }} testID={testID}>
      {(['left', 'right'] as const).map((s) => {
        const v = s === 'left' ? m.left : m.right;
        return (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} accessible accessibilityLabel={`${sideLabel(s)} : ${v != null ? span(v) : tr('bt.tray.notNoted')}`}>
            <Text weight="bold" style={{ width: 64 }}>{sideLabel(s)}</Text>
            <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}>
              {v != null ? <View style={{ width: `${Math.min(100, (v / Math.max(scale, 1)) * 100)}%`, height: 12, borderRadius: 6, backgroundColor: t.colors.text }} />
                : <View style={{ flex: 1, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted }} />}
            </View>
            <Text style={[{ width: 72, textAlign: 'right' }, TABULAR]} testID={`${testID}-${s}`}>{v != null ? span(v) : tr('bt.tray.notNoted')}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function BreastSessionTray({ child, feed, now, open, onOpenChange, onEditAll, onSaved }: {
  child: Child; feed: Breastfeed | null; now: Date; open: boolean; onOpenChange: (v: boolean) => void;
  onEditAll: (f: Breastfeed) => void; onSaved?: (f: Breastfeed) => void;
}) {
  const t = useTheme();
  if (!feed) return null;
  const f = feed as FeedLike;
  const ongoing = isOngoing(f, now);
  const m = feedMinutes(f, now);
  const range = tr('bt.tray.range', { from: clock(new Date(f.started_at)), to: f.ended_at ? clock(new Date(f.ended_at)) : ongoing ? tr('bt.tray.ongoing') : '…' });
  const palette = { surface: 'transparent', border: t.colors.border, handle: t.colors.textMuted, text: t.colors.text, mutedText: t.colors.textMuted, backdrop: t.colors.overlay };
  const done = !!f.ended_at;
  return (
    <Tray open={open} onOpenChange={onOpenChange} defaultView="feed" palette={palette} theme={t.isDark ? 'dark' : 'light'} radius={radius.sheet}
      motion={{ viewAxis: 'x', viewSlide: 60, viewStartScale: 1 }}>
      <Tray.Content surface={<Glass variant="sheet" radius={radius.sheet} style={{ flex: 1 }} />}>
        <Tray.View id="feed">
          <View testID="bt-tray" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="label" muted style={{ flex: 1 }} accessibilityRole="header">{tr('bt.tray.title', { name: child.first_name })}</Text>
              <Tray.Close><View accessibilityLabel={tr('bt.tray.close')}><Icon name="x" size={20} color={t.colors.text} /></View></Tray.Close>
            </View>
            <Text testID="bt-tray-duration" maxFontSizeMultiplier={1.3} style={[BIG, { fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{m.total != null ? span(m.total) : '—'}</Text>
            <Text weight="bold" style={TABULAR} testID="bt-tray-range">{range}</Text>
            {m.total == null ? <Text variant="small" muted>{tr('bt.row.noDuration')}</Text> : null}
            <SideBars m={m} scale={Math.max(m.left ?? 0, m.right ?? 0, 1)} testID="bt-tray-sides" />
            {f.note ? (
              <MatteSurface radius={radius.md} contentStyle={{ padding: spacing.sm, flexDirection: 'row', gap: spacing.xs }} testID="bt-tray-note">
                <Icon name="message-square" size={16} color={t.colors.primary} />
                <Text style={{ flex: 1 }}>{f.note}</Text>
              </MatteSurface>
            ) : null}
            {ongoing ? <Text variant="small" muted>{tr('bt.tray.ongoingHint')}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
              {done ? <PushView view="end" icon="clock" label={tr('bt.tray.fixEnd')} testID="bt-tray-fix-end" /> : null}
              {done ? <PushView view="side" icon="sliders" label={tr('bt.tray.fixSide')} testID="bt-tray-fix-side" /> : null}
              <GlassButton variant="tertiary" icon="edit-2" label={tr('bt.tray.editAll')} testID="bt-tray-edit" onPress={() => { onOpenChange(false); onEditAll(feed); }} />
            </View>
          </View>
        </Tray.View>
        <Tray.View id="end">
          <EditEndView key={`${f.id}:${f.ended_at}`} child={child} feed={feed} now={now} onSaved={onSaved} />
        </Tray.View>
        <Tray.View id="side">
          <EditSideView key={`${f.id}:${f.ended_at}:${JSON.stringify(f.segments ?? null)}`} child={child} feed={feed} now={now} onSaved={onSaved} />
        </Tray.View>
      </Tray.Content>
    </Tray>
  );
}

function PushView({ view, icon, label, testID }: { view: string; icon: 'clock' | 'sliders'; label: string; testID: string }) {
  const { setView } = useTray();
  return <GlassButton variant="secondary" icon={icon} label={label} testID={testID} onPress={() => setView(view)} />;
}

/** Enregistrement commun aux deux vues : une seule écriture, brouillon gardé en cas d'échec. */
function useSave(child: Child, feed: Breastfeed, onSaved?: (f: Breastfeed) => void) {
  const act = useBreastActions(child);
  const { goBack } = useTray();
  const inflight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (patch: Record<string, unknown> | null) => {
    if (inflight.current || !patch) return;          // double appui : une seule écriture
    inflight.current = true; setBusy(true); setError(null);
    try {
      await act.edit(feed, patch);
      haptic('success');
      onSaved?.({ ...feed, ...patch } as Breastfeed);
      goBack();
    } catch (e) {
      setError(friendlyError(e, tr('bt.err.failed')));
      haptic('warning');
    } finally { inflight.current = false; setBusy(false); }
  };
  return { save, busy, error, setError, goBack };
}

function Footer({ onCancel, onSave, canSave, testID }: { onCancel: () => void; onSave: () => void; canSave: boolean; testID: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('bt.edit.cancel')} testID={`${testID}-cancel`} onPress={onCancel} /></View>
      <View style={{ flex: 1 }}><GlassButton variant="primary" full label={tr('bt.edit.save')} testID={`${testID}-save`} disabled={!canSave} onPress={onSave} /></View>
    </View>
  );
}

function EditEndView({ child, feed, now, onSaved }: { child: Child; feed: Breastfeed; now: Date; onSaved?: (f: Breastfeed) => void }) {
  const t = useTheme();
  const f = feed as FeedLike;
  const end0 = new Date(f.ended_at ?? now);
  const [text, setText] = useState(hhmm(end0));
  const { save, busy, error, setError, goBack } = useSave(child, feed, onSaved);
  const end = proposedFeedEnd(f, text);
  const patch = end ? withEnd(f, end) : null;
  const m = patch ? feedMinutes({ ...f, ...patch }, now) : null;
  const changed = !!end && end.getTime() !== end0.getTime();
  const step = (d: number) => { const b = end ?? end0; setText(hhmm(new Date(b.getTime() + d * 60_000))); setError(null); };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="bt-edit-end">
      <Text variant="label" accessibilityRole="header">{tr('bt.edit.endTitle')}</Text>
      <Text testID="bt-edit-end-duration" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={[BIG, { fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{m?.total != null ? span(m.total) : '—'}</Text>
      <Text weight="bold" style={TABULAR} testID="bt-edit-end-proposed">
        {end && changed ? tr('bt.edit.proposed', { time: clock(end) }) : tr('bt.tray.range', { from: clock(new Date(f.started_at)), to: clock(end0) })}
      </Text>
      {m ? <SideBars m={m} scale={Math.max(feedMinutes(f, now).total ?? 0, m.total ?? 0, 1)} testID="bt-edit-end-sides" /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <GlassButton variant="secondary" label={tr('bt.edit.minus5')} testID="bt-edit-end-minus" onPress={() => step(-5)} />
        <View style={{ flex: 1 }}><Field label={tr('bt.edit.endLabel')} value={text} onChangeText={(v) => { setText(v); setError(null); }} keyboardType="numbers-and-punctuation" maxLength={5} testID="bt-edit-end-field" error={patch ? undefined : tr('bt.edit.badTime')} /></View>
        <GlassButton variant="secondary" label={tr('bt.edit.plus5')} testID="bt-edit-end-plus" onPress={() => step(5)} />
      </View>
      {error ? <Text variant="small" color={t.colors.danger} testID="bt-edit-error" accessibilityLiveRegion="assertive">{error}</Text> : null}
      <Footer testID="bt-edit-end" canSave={changed && !!patch && !busy} onCancel={() => { setText(hhmm(end0)); setError(null); goBack(); }} onSave={() => void save(patch)} />
    </View>
  );
}

function EditSideView({ child, feed, now, onSaved }: { child: Child; feed: Breastfeed; now: Date; onSaved?: (f: Breastfeed) => void }) {
  const t = useTheme();
  const f = feed as FeedLike;
  const m0 = feedMinutes(f, now);
  const [side, setSide] = useState<BreastSide>(f.side === 'right' ? 'right' : 'left');
  const orig = (s: BreastSide) => (s === 'left' ? m0.left : m0.right);
  const [text, setText] = useState(orig(side) != null ? String(orig(side)) : '');
  const { save, busy, error, setError, goBack } = useSave(child, feed, onSaved);
  const n = /^\d{1,3}$/.test(text.trim()) ? Number(text.trim()) : null;
  const patch = n != null ? withSideMinutes(f, side, n, now) : null;
  const m = patch ? feedMinutes({ ...f, ...patch }, now) : null;
  const changed = n != null && n !== orig(side);
  const choose = (s: BreastSide) => { setSide(s); setText(orig(s) != null ? String(orig(s)) : ''); setError(null); };
  const step = (d: number) => { setText(String(Math.max(0, (n ?? orig(side) ?? 0) + d))); setError(null); };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="bt-edit-side">
      <Text variant="label" accessibilityRole="header">{tr('bt.edit.sideTitle')}</Text>
      <GlassSegmentedControl label={tr('bt.edit.sideWhich')} value={side} onChange={choose} testID="bt-edit-side-which"
        options={[{ value: 'left' as BreastSide, label: sideLabel('left'), testID: 'bt-edit-side-left' }, { value: 'right' as BreastSide, label: sideLabel('right'), testID: 'bt-edit-side-right' }]} />
      <Text testID="bt-edit-side-total" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3} style={[BIG, { fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{m?.total != null ? span(m.total) : '—'}</Text>
      {m ? <SideBars m={m} scale={Math.max(m.left ?? 0, m.right ?? 0, m0.left ?? 0, m0.right ?? 0, 1)} testID="bt-edit-side-bars" /> : null}
      {patch && changed ? <Text weight="bold" style={TABULAR} testID="bt-edit-side-end">{tr('bt.edit.newEnd', { time: clock(new Date(patch.ended_at)).replace(/ /g, '\u00a0') })}</Text> : null}
      {m0.left == null ? <Text variant="small" muted>{tr('bt.edit.noSplitHint')}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <GlassButton variant="secondary" label={tr('bt.edit.minus1')} testID="bt-edit-side-minus" onPress={() => step(-1)} />
        <View style={{ flex: 1 }}><Field label={tr('bt.edit.sideLabel', { side: sideLabel(side) })} value={text} onChangeText={(v) => { setText(v); setError(null); }} keyboardType="number-pad" maxLength={3} suffix="min" testID="bt-edit-side-field" error={patch || !text ? undefined : tr('bt.edit.badMin')} /></View>
        <GlassButton variant="secondary" label={tr('bt.edit.plus1')} testID="bt-edit-side-plus" onPress={() => step(1)} />
      </View>
      {error ? <Text variant="small" color={t.colors.danger} testID="bt-edit-error" accessibilityLiveRegion="assertive">{error}</Text> : null}
      <Footer testID="bt-edit-side" canSave={changed && !!patch && !busy} onCancel={() => { choose(f.side === 'right' ? 'right' : 'left'); goBack(); }} onSave={() => void save(patch)} />
    </View>
  );
}
