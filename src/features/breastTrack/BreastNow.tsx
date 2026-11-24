/**
 * ALLAITEMENT — « maintenant » (22/11/2026), même langage que Sommeil (NapNow) :
 *  1. PREMIER REGARD : « Léa tète depuis 14 h 26 · Gauche », la durée en grand (08:42, chiffres de largeur fixe),
 *     Gauche / Droite au pouce : un toucher démarre, puis passe d'un côté à l'autre DANS LA MÊME tétée ; Terminer.
 *     L'état vient de la donnée (ligne en cours dans `breastfeeds`) : rouvrir l'app retrouve la tétée et son chrono.
 *  2. EXPLORATION : totaux du jour (minutes, par côté ; « rien de noté » ≠ 0), frise du jour touchable (Gauche en
 *     haut, Droite en bas), liste équivalente, 7 derniers jours ; un toucher ouvre la fiche (Tray) de la tétée.
 *  3. CORRECTION : dans la fiche (fin, un côté), valeur provisoire, Annuler, Enregistrer protégé du double appui.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { tint } from '@/components/ToolGlyph';
import { AnimatedProgressRing } from '@/components/motion/AnimatedProgressRing';
import { View } from 'react-native';
import { router } from 'expo-router';
import { StageHero } from '@/components/stage/StageHero';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { Banner, haptic, Text } from '@/components/ui';
import { FeedIssuesToday } from '@/features/feeding/TrackLinks';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useLogs } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useBreastActions } from '@/lib/data/hooks-breast';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { clock, span } from '@/lib/domain/sleepPlanner';
import {
  currentSide, feedMinutes, feedSeconds, feedSegments, feedsByDay, isOngoing, lastFeed, stopwatch, type BreastSide, type FeedLike,
} from '@/lib/domain/breastSession';
import type { Breastfeed, Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { BreastSessionTray } from './BreastSessionTray';
import { SessionBand, TABULAR, useTicker, WeekBars, type BandItem } from './SessionBand';

export const sideLabel = (s: 'left' | 'right' | 'both' | null | undefined) => tr((s === 'left' ? 'bt.side.left' : s === 'right' ? 'bt.side.right' : 'bt.side.both') as TKey);
/** Second appui d'un double appui ignoré après une écriture réussie. */
export const COOLDOWN_MS = 800;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const mod = (d: Date) => d.getHours() * 60 + d.getMinutes();
/** « 2026-11-22 » → date LOCALE (jamais minuit UTC). */
export const dayDate = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };

/** « Gauche 12 min · Droite 9 min », « Droite 17 min », « Les deux · 20 min » (répartition non notée). */
export function sidesText(f: FeedLike, now: Date): string {
  const m = feedMinutes(f, now);
  if (m.total == null) return tr('bt.row.noDuration');
  if (m.left == null || m.right == null) return tr('bt.sides.unknown', { dur: span(m.total) });
  const parts: string[] = [];
  if (m.left > 0 || (f.side === 'left')) parts.push(tr('bt.sides.one', { side: tr('bt.side.left'), dur: span(m.left) }));
  if (m.right > 0 || (f.side === 'right')) parts.push(tr('bt.sides.one', { side: tr('bt.side.right'), dur: span(m.right) }));
  return parts.join(' · ');
}

/** Ligne de la liste : « 14 h 26 – en cours · Gauche », « 11 h 07 – 11 h 24 · Droite 17 min ». */
export function feedLine(f: FeedLike, now: Date): string {
  const from = clock(new Date(f.started_at));
  if (isOngoing(f, now)) return tr('bt.row.ongoing', { from, side: sideLabel(currentSide(f, now)) });
  if (!f.ended_at) return tr('bt.row.noEnd', { from });
  return tr('bt.row.done', { from, to: clock(new Date(f.ended_at)), sides: sidesText(f, now) });
}

/** Éléments de la frise du jour (minutes 0–1440 ; une tétée commencée la veille part de 0 h). */
export function feedBandItems(feeds: readonly FeedLike[], now: Date): BandItem[] {
  const out: BandItem[] = [];
  const clipM = (iso: string) => { const d = new Date(iso); return sameDay(d, now) ? mod(d) : d < now ? 0 : 1440; };
  for (const f of feeds) {
    const ongoing = isOngoing(f, now);
    const endIso = f.ended_at ?? (ongoing ? now.toISOString() : null);
    const start = clipM(f.started_at);
    if (!endIso) {
      if (!sameDay(new Date(f.started_at), now)) continue;
      out.push({ id: f.id, start, end: start, pieces: [{ lane: 'all', start, end: start + 4, kind: 'unknown' }], note: f.note, text: feedLine(f, now) });
      continue;
    }
    const end = clipM(endIso);
    if (!sameDay(new Date(f.started_at), now) && !sameDay(new Date(endIso), now)) continue;
    const segs = feedSegments(f);
    const pieces = segs
      ? segs.map((s, i) => ({ lane: (s.side === 'left' ? 0 : 1) as 0 | 1, start: clipM(s.from), end: clipM(s.to ?? segs[i + 1]?.from ?? endIso), kind: 'solid' as const })).filter((p) => p.end > p.start || segs.length === 1)
      : [{ lane: 'all' as const, start, end, kind: 'hatch' as const }];
    out.push({ id: f.id, start, end: Math.max(end, start + 1), pieces: pieces.length ? pieces : [{ lane: 'all', start, end, kind: 'hatch' }], ongoing, note: f.note, text: feedLine(f, now) });
  }
  return out.sort((a, b) => a.start - b.start);
}

// ─── 1. Premier regard ──────────────────────────────────────────────────────────────────────────

/** Gros sélecteur Gauche / Droite, à portée de pouce. */
function SidePicker({ running, current, last, seconds, onPick, busy }: {
  running: boolean; current: BreastSide | null; last: 'left' | 'right' | 'both' | null; seconds: { left: number | null; right: number | null };
  onPick: (s: BreastSide) => void; busy: boolean;
}) {
  const t = useTheme();
  const total = (seconds.left ?? 0) + (seconds.right ?? 0);
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }} accessibilityRole="radiogroup">
      {(['left', 'right'] as const).map((s) => {
        const on = running && current === s;
        const label = sideLabel(s);
        const sub = on ? tr('bt.pick.current') : running ? tr('bt.pick.switch') : last === s ? tr('bt.pick.lastTime') : tr('bt.pick.start');
        const secs = s === 'left' ? seconds.left : seconds.right;
        const a11y = on ? tr('bt.pick.a11yOn', { side: label }) : running ? tr('bt.pick.a11ySwitch', { side: label }) : tr('bt.pick.a11yStart', { side: label });
        return (
          <Tappable key={s} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: busy }} accessibilityLabel={a11y} disabled={busy || on}
            onPress={() => onPick(s)} testID={`bt-side-${s}`}
            style={{ flex: 1, minHeight: 104, borderRadius: radius.xl, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 2,
              backgroundColor: on ? t.colors.text : 'transparent', borderWidth: on ? 0 : 1.5, borderColor: t.colors.border, opacity: busy ? 0.6 : 1 }}>
            <Text variant="heading" color={on ? t.colors.background : t.colors.text}>{label}</Text>
            {/* Part de CE sein dans la séance en cours (proportion, pas un objectif), chronomètre au centre */}
            {running && secs != null ? (
              <AnimatedProgressRing progress={total ? secs / total : 0} size={66} color={on ? t.colors.background : t.colors.text}
                track={on ? tint(t.colors.background, 0.3) : t.colors.border} testID={`bt-side-${s}-ring`}>
                <Text maxFontSizeMultiplier={1.15} style={[{ fontSize: 15, color: on ? t.colors.background : t.colors.textMuted }, TABULAR]}>{stopwatch(secs)}</Text>
              </AnimatedProgressRing>
            ) : null}
            <Text variant="caption" weight={on ? 'bold' : undefined} color={on ? t.colors.background : t.colors.textMuted}>{sub}</Text>
          </Tappable>
        );
      })}
    </View>
  );
}

export function BreastHero({ child, feeds, now, onOpen, autoStart }: { child: Child; feeds: readonly Breastfeed[]; now: Date; onOpen: (id: string) => void; autoStart?: BreastSide | null }) {
  const t = useTheme();
  const toast = useToast();
  const act = useBreastActions(child);
  const inflight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = lastFeed(feeds as readonly FeedLike[], child.id, now);
  const open = last?.ongoing ? (last.feed as Breastfeed) : null;
  const side = open ? currentSide(open, now) : null;
  const secs = open ? feedSeconds(open, now) : { total: null, left: null, right: null };
  const title = open ? tr('bt.hero.ongoing', { name: child.first_name, time: clock(new Date(open.started_at)), side: sideLabel(side ?? open.side) })
    : last ? tr('bt.hero.last', { time: clock(new Date(last.feed.started_at)), ago: agoLabel(last.feed.ended_at ?? last.feed.started_at, now) })
    : tr('bt.hero.none');
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    if (inflight.current) return;                 // double appui : une seule écriture
    inflight.current = true; setBusy(true); setError(null);
    let ok = false;
    try { const r = await fn(); ok = true; haptic('success'); if (r === 'queued') toast(tr('bt.queued'), 'info'); else if (done) toast(done, 'success'); }
    catch (e) { setError(friendlyError(e, tr('bt.err.failed'))); haptic('warning'); }
    finally {
      // Après une réussite, le second appui d'un double appui (souvent plus lent que l'écriture) est ignoré
      setBusy(false);
      if (ok) setTimeout(() => { inflight.current = false; }, COOLDOWN_MS); else inflight.current = false;
    }
  };
  const pick = (s: BreastSide) => {
    if (!open) return void run(() => act.start(s, new Date()), tr('bt.started', { side: sideLabel(s) }));
    if (side !== s) return void run(() => act.switchSide(open, new Date()), tr('bt.switched', { side: sideLabel(s) }));
  };
  // Depuis Aura (« je commence à gauche » → « Démarrer à gauche ») : le côté démarre UNE fois, données chargées ;
  // le paramètre est retiré aussitôt (un retour sur l'écran ne relance rien) ; le chronomètre tourne ensuite sans IA
  const autoDone = useRef(false);
  useEffect(() => {
    if (!autoStart || autoDone.current) return;
    autoDone.current = true;
    router.setParams({ start: undefined } as never);
    pick(autoStart);
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastDone = last && !last.ongoing ? last.feed : null;
  return (
    <View testID="bt-hero" style={{ gap: spacing.sm }}>
      {/* Scène « Whoop / Keynote » : le minuteur géant sur verre sombre ; anneau = part du côté en cours dans la tétée */}
      <StageHero testID="bt-stage" eyebrow={open ? tr('bt.stage.live') : tr('bt.stage.last')}
        value={open && secs.total != null ? stopwatch(secs.total) : lastDone?.ended_at ? span(Math.max(0, Math.round((Date.parse(lastDone.ended_at) - Date.parse(lastDone.started_at)) / 60000))) : '—'}
        caption={title}
        detail={open && secs.total != null ? tr('bt.hero.sides', { left: stopwatch(secs.left ?? 0), right: stopwatch(secs.right ?? 0) }) : lastDone ? feedLine(lastDone as FeedLike, now) : null}
        progress={open && secs.total ? Math.min(1, ((side === 'right' ? secs.right : secs.left) ?? 0) / Math.max(1, secs.total)) : null}
        ringLabel={open && side ? sideLabel(side) : null} size={68}
        a11y={[title, open && secs.total != null ? tr('bt.hero.elapsedA11y', { dur: span(Math.floor(secs.total / 60)) }) : null].filter(Boolean).join('. ')} />
      {!open && lastDone ? (
        <GlassButton variant="secondary" size="sm" icon="chevron-right" label={tr('bt.stage.open')} testID="bt-hero-last" style={{ alignSelf: 'flex-start' }} onPress={() => onOpen(lastDone.id)} />
      ) : null}
      <SidePicker running={!!open} current={side} last={lastDone?.side ?? null} seconds={{ left: secs.left, right: secs.right }} onPick={pick} busy={busy} />
      {open ? <GlassButton variant="primary" size="lg" full icon="square" label={tr('bt.finish')} testID="bt-finish" disabled={busy}
        onPress={() => void run(() => act.finish(open, new Date()), tr('bt.finished', { dur: span(Math.round((secs.total ?? 0) / 60)) }))} /> : null}
      {error ? <Text variant="small" color={t.colors.danger} testID="bt-error" accessibilityLiveRegion="assertive">{error}</Text> : null}
      <Text variant="caption" muted>{open ? tr('bt.hero.sameFeed') : tr('bt.hero.howto')}</Text>
    </View>
  );
}

// ─── 2. Exploration ─────────────────────────────────────────────────────────────────────────────

function DayTotals({ child, feeds, now }: { child: Child; feeds: readonly Breastfeed[]; now: Date }) {
  const d = feedsByDay(feeds as readonly FeedLike[], child.id, now, 1)[0];
  const cell = (value: string, label: string, testID: string) => (
    <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={`${label} : ${value}`} testID={testID}>
      <Text variant="heading" style={TABULAR}>{value}</Text>
      <Text variant="caption" muted numberOfLines={2}>{label}</Text>
    </View>
  );
  return (
    <Glass variant="card" radius={radius.xl} testID="bt-day" contentStyle={{ padding: spacing.md, gap: spacing.sm }}>
      <Text variant="label" accessibilityRole="header">{tr('bt.day.title')}</Text>
      {d.count ? (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {cell(String(d.count), tr('bt.day.count', { count: d.count }), 'bt-day-count')}
            {cell(d.minutes != null ? span(d.minutes) : '—', d.minutes != null ? tr('bt.day.minutes') : tr('bt.day.noneDuration'), 'bt-day-minutes')}
            {cell(d.left != null ? span(d.left) : '—', tr('bt.side.left'), 'bt-day-left')}
            {cell(d.right != null ? span(d.right) : '—', tr('bt.side.right'), 'bt-day-right')}
          </View>
          {d.noSplit ? <Text variant="caption" muted>{tr('bt.day.noSplit', { count: d.noSplit })}</Text> : null}
          {d.noDuration ? <Text variant="caption" muted>{tr('bt.day.noDuration', { count: d.noDuration })}</Text> : null}
        </>
      ) : <Text muted testID="bt-day-none">{tr('bt.day.none')}</Text>}
    </Glass>
  );
}

export function BreastNow({ child, focusFeed, startSide }: { child: Child; focusFeed?: string | null; startSide?: BreastSide | null }) {
  const q = useLogs<Breastfeed>('breastfeed', child.id, 8, { includePending: true });
  const feeds = useMemo(() => (q.data ?? []).filter((f) => f.child_id === child.id), [q.data, child.id]);
  const anyOpen = feeds.some((f) => isOngoing(f as FeedLike, new Date()));
  const now = useTicker(anyOpen);
  const [sel, setSel] = useState<string | null>(focusFeed ?? null);
  const [zoom, setZoom] = useState<string | null>(focusFeed ?? null);
  const [trayId, setTrayId] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const openFeed = (id: string) => { setSel(id); setZoom(id); router.setParams({ feed: id }); setTrayId(id); setTrayOpen(true); };
  // Lien depuis l'accueil : la tétée est sélectionnée et sa fiche s'ouvre une fois les données là
  const opened = useRef(false);
  const ready = !!focusFeed && feeds.some((f) => f.id === focusFeed);
  useEffect(() => { if (ready && !opened.current) { opened.current = true; openFeed(focusFeed!); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready]);
  const items = useMemo(() => feedBandItems(feeds as readonly FeedLike[], now), [feeds, now]);
  const today = items.filter((i) => i.pieces.length);
  const day = feedsByDay(feeds as readonly FeedLike[], child.id, now, 1)[0];
  const week = feedsByDay(feeds as readonly FeedLike[], child.id, now, 7);
  const listText = today.map((i) => i.text).join('. ');
  return (
    <View style={{ gap: spacing.sm }}>
      <BreastHero child={child} feeds={feeds} now={now} onOpen={openFeed} autoStart={q.data ? startSide ?? null : null} />
      {q.isError && !q.data ? <Banner tone="danger">{tr('bt.err.load')}</Banner> : null}
      <DayTotals child={child} feeds={feeds} now={now} />
      <SessionBand title={tr('bt.band.title')} total={day.count ? tr('bt.band.total', { count: day.count, total: day.minutes != null ? span(day.minutes) : '—' }) : tr('bt.band.none')}
        items={today} lanes={[tr('bt.side.left'), tr('bt.side.right')]} now={now} selectedId={sel} onSelect={setSel} onOpen={openFeed}
        focusId={zoom} onClearFocus={() => setZoom(null)} hint={tr('bt.band.hint')}
        a11y={tr('bt.band.a11y', { name: child.first_name, list: listText || tr('bt.band.none') })}
        legend={[{ kind: 'solid', label: tr('bt.band.legendSide') }, { kind: 'hatch', label: tr('bt.band.legendNoSplit') }, { kind: 'gap', label: tr('bt.band.legendGap') }]} />
      <WeekBars title={tr('bt.week.title')} testID="bt-week"
        days={week.map((d) => ({ key: d.day, label: formatDate(dayDate(d.day), { weekday: 'narrow' }), value: d.minutes, text: d.minutes != null ? String(d.minutes) : '—',
          a11y: `${formatDate(dayDate(d.day), { weekday: 'long', day: 'numeric' })} : ${d.minutes != null ? `${span(d.minutes)}, ${tr('bt.day.count', { count: d.count })}` : d.count ? tr('bt.day.noneDuration') : tr('bt.band.legendGap')}` }))} />
      <Text variant="caption" muted>{tr('bt.week.unit')}</Text>
      <FeedIssuesToday childId={child.id} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <GlassButton variant="secondary" icon="edit-3" label={tr('bt.manual')} testID="bt-manual"
          onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id, manual: '1' } } as never)} />
        <GlassButton variant="tertiary" icon="droplet" label={tr('bt.pumpLink')} testID="bt-pump-link"
          onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'pumping', child: child.id } } as never)} />
      </View>
      <Text variant="caption" muted>{tr('bt.notAdvice')}</Text>
      <BreastSessionTray child={child} feed={trayId ? (feeds.find((f) => f.id === trayId) ?? null) : null} now={now} open={trayOpen} onOpenChange={setTrayOpen}
        onEditAll={(f) => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id, id: f.id } } as never)} />
    </View>
  );
}

