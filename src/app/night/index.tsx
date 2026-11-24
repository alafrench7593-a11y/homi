/**
 * Mode nuit : ambiance très sombre (midnight violet HOMI, accents champagne tamisé), gros boutons, animations lentes, aucun son.
 * Ne modifie jamais la luminosité du téléphone et laisse l'accès aux urgences visible.
 *
 * 23/11/2026 — même patron que les autres outils de sommeil (src/features/napLive), thème nuit gardé :
 *  1. donnée principale EN GRAND : l'état (« Lina dort » / « Lina est éveillée ») et la durée depuis le dernier
 *     changement, en chiffres de largeur fixe, avec l'heure du changement ; puis la commande ronde « {prénom} s'endort » ;
 *  2. les saisies de la nuit (12 dernières heures : sommeils, tétées, biberons, couches) en liste datée, heure en
 *     colonne fixe ; toucher une ligne ouvre SA fiche (Tray) existante pour la relire et la corriger (fin d'un sommeil,
 *     tétée, biberon, couche : mêmes helpers et mêmes gardes que les écrans de jour).
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { StatusBar } from 'expo-status-bar';
import { Button, Chip, haptic, Icon, Row, Text, Toggle } from '@/components/ui';
import { ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useAddLog, useTrackedChildren, useInvalidate, useLogs, useOpenSleep } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useUiStore } from '@/lib/store';
import { formatDuration, formatTime, timeAgo } from '@/lib/domain/dates';
import type { Bottle, Breastfeed, Diaper, Sleep } from '@/lib/types';
import { nightEntries, nightState, type NightEntry } from '@/lib/domain/finishTrack';
import { diaperType } from '@/lib/domain/quickTrack';
import { span } from '@/lib/domain/sleepPlanner';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { NapSessionTray } from '@/features/napLive/NapSessionTray';
import { BreastSessionTray } from '@/features/breastTrack/BreastSessionTray';
import { sideLabel } from '@/features/breastTrack/BreastNow';
import { BottleEntryTray } from '@/features/quickTrack/BottleLog';
import { DiaperEntryTray, diaperLabel } from '@/features/quickTrack/DiaperLog';
import { radius, spacing, themes } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr } from '@/i18n';

// Couleurs du thème « Nuit » HOMI v5 (src/theme/tokens.ts, `themes.night`) : prune très tamisée, jamais de blanc pur
const GOLD = themes.night.colors.gold;
const TEXT = themes.night.colors.text;
const MUTED = themes.night.colors.textMuted;
const BG = themes.night.colors.background;
const CARD = themes.night.colors.surface;
const CARD_PRESSED = themes.night.colors.surfaceAlt;

function BigButton({ icon, label, sub, onPress }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; sub?: string; onPress: () => void }) {
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      onPress={() => { haptic('light'); onPress(); }}
      style={({ pressed }) => ({ flex: 1, minHeight: 92, borderRadius: radius.lg, backgroundColor: pressed ? CARD_PRESSED : CARD, borderWidth: 1, borderColor: CARD_PRESSED, alignItems: 'center', justifyContent: 'center', gap: 4, padding: spacing.xs })}
    >
      <Icon name={icon} color={GOLD} size={24} />
      <Text weight="medium" color={TEXT} center>{label}</Text>
      {sub ? <Text variant="caption" color={MUTED} center>{sub}</Text> : null}
    </Tappable>
  );
}

export default function NightMode() {
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  const toast = useToast();
  const inv = useInvalidate();
  const setNightMode = useUiStore((s) => s.setNightMode);
  const vibrations = useUiStore((s) => s.nightVibrations);
  const setVibrations = useUiStore((s) => s.setNightVibrations);
  const { subject, setSubject } = useActiveSubject();
  const childrenQ = useTrackedChildren();
  const { data: children } = childrenQ;
  const [busy, setBusy] = useState<string | null>(null);
  const childId = subject.type === 'child' ? subject.id : children?.[0]?.id;
  const child = children?.find((c) => c.id === childId);
  const openSleep = useOpenSleep(childId);
  const { data: feeds } = useLogs<Breastfeed>('breastfeed', childId, 1);
  const { data: diapers } = useLogs<Diaper>('diaper', childId, 1);
  const { data: sleeps } = useLogs<Sleep>('sleep', childId, 1);
  const { data: bottles } = useLogs<Bottle>('bottle', childId, 1);
  // Fiche ouverte (Tray) : une saisie de la nuit à relire / corriger
  const [tray, setTray] = useState<NightEntry | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const openEntry = (e: NightEntry) => { haptic('selection'); setTray(e); setTrayOpen(true); };
  const addSleep = useAddLog('sleep');
  const addFeed = useAddLog('breastfeed');
  const addDiaper = useAddLog('diaper');
  const [now, setNow] = useState(Date.now());
  const [feedStart, setFeedStart] = useState<{ side: 'left' | 'right'; at: Date } | null>(null);

  useEffect(() => {
    setNightMode(true);
    return () => setNightMode(false);
  }, [setNightMode]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const elapsedMin = openSleep ? (now - new Date(openSleep.started_at).getTime()) / 60000 : 0;
  // État et durée depuis le dernier changement (sommeil ouvert, sinon fin du dernier sommeil noté)
  const state = childId ? nightState(childId, [...(sleeps ?? []), ...(openSleep && !(sleeps ?? []).some((x) => x.id === openSleep.id) ? [openSleep as Sleep] : [])], new Date(now)) : null;
  const entries = childId ? nightEntries(childId, { sleeps: sleeps ?? [], feeds: feeds ?? [], diapers: diapers ?? [], bottles: (bottles ?? []) as (Bottle & { in_progress?: boolean | null })[] }, new Date(now)) : [];

  /** Une action à la fois : évite les doubles saisies dans le noir, erreur toujours affichée. */
  async function run(key: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast(friendlyError(e, tr('u6.night.action_failed')), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function toggleSleep() {
    if (!child || busy) return;
    setBusy('sleep');
    try {
      if (openSleep) {
        await backend.update('sleeps', { ended_at: new Date().toISOString() }, [eq('id', openSleep.id)]);
        inv('sleeps');
        toast(tr('u6.night.sleep_saved', { duration: formatDuration(elapsedMin) }));
      } else {
        await addSleep.mutateAsync({ child_id: child.id, household_id: child.household_id, started_at: new Date().toISOString(), kind: new Date().getHours() >= 19 || new Date().getHours() < 7 ? 'night' : 'nap' });
        toast(tr('u6.night.good_night'), 'info');
      }
      haptic('success');
    } catch (e) {
      toast(friendlyError(e, tr('u6.night.action_failed')), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function addWakeup() {
    if (!openSleep) return;
    const sleepId = openSleep.id;
    await run('wakeup', async () => {
      const current = await backend.select<{ wakeups: number; wake_events?: { at: string }[] }>({ table: 'sleeps', filters: [eq('id', sleepId)] });
      // L'heure de chaque réveil est gardée (chronologie de la nuit), en plus du compteur
      const events = [...(current[0]?.wake_events ?? []), { at: new Date().toISOString() }].slice(-50);
      await backend.update('sleeps', { wakeups: (current[0]?.wakeups ?? 0) + 1, wake_events: events }, [eq('id', sleepId)]);
      inv('sleeps');
      toast(tr('u6.night.wake_noted'), 'info');
    });
  }

  async function feed(side: 'left' | 'right') {
    if (!child) return;
    if (feedStart && feedStart.side === side) {
      const start = feedStart;
      await run('feed', async () => {
        await addFeed.mutateAsync({ child_id: child.id, household_id: child.household_id, side, started_at: start.at.toISOString(), ended_at: new Date().toISOString() });
        toast(tr('u6.night.feed_saved', { duration: formatDuration((Date.now() - start.at.getTime()) / 60000) }));
        setFeedStart(null);
      });
    } else {
      setFeedStart({ side, at: new Date() });
    }
  }

  async function diaper() {
    if (!child) return;
    await run('diaper', async () => {
      await addDiaper.mutateAsync({ child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), wet: true, stool: false });
      toast(tr('u6.night.diaper_saved'));
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, overflow: 'hidden' }}>
      <StatusBar style="light" />
      {/* Fond uni tamisé (v5 : plus d'aurore ni d'étoiles) ; défilement : sur petit écran rien n'est coupé */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: topInset + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Tappable accessibilityRole="button" accessibilityLabel={tr('u6.night.quit_a11y')} onPress={() => router.back()} hitSlop={10} style={{ minHeight: 48, justifyContent: 'center' }}>
            <Row gap={6}><Icon name="x" color={MUTED} size={20} /><Text color={MUTED}>{tr('u6.night.quit')}</Text></Row>
          </Tappable>
          <Text variant="small" color={MUTED}>{formatTime(new Date(now))}</Text>
          <Tappable accessibilityRole="button" accessibilityLabel={tr('u6.night.emergency')} onPress={() => router.push('/emergency')} hitSlop={10} style={{ minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="life-buoy" color="#F0A0AA" size={22} />
          </Tappable>
        </Row>

        {children && children.length > 1 && (
          <Row wrap>
            {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => setSubject({ type: 'child', id: c.id })} />)}
          </Row>
        )}

        {childrenQ.isLoading && !children ? (
          <View style={{ marginTop: spacing.xl }}><Skeleton kind="card" rows={2} /></View>
        ) : childrenQ.isError && !children ? (
          <View style={{ marginTop: spacing.xl }}><ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} /></View>
        ) : !child ? (
          <View style={{ marginTop: spacing.xxl, gap: spacing.md, alignItems: 'center' }}>
            <Text color={TEXT} center>{tr('u6.night.add_profile')}</Text>
            <Button label={tr('u6.night.add_child')} icon="plus" variant="night" onPress={() => router.push('/profiles/new?kind=child' as never)} />
          </View>
        ) : (
          <>
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
              {/* Donnée principale en grand : l'état et la durée depuis le dernier changement */}
              <View testID="night-hero" accessible accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 2 }}
                accessibilityLabel={[openSleep ? tr('ft.nt.asleep', { name: child.first_name }) : tr('ft.nt.awake', { name: child.first_name }),
                  state?.minutes != null ? span(openSleep ? elapsedMin : state.minutes) : null,
                  state?.since ? tr(openSleep ? 'ft.nt.sinceAsleep' : 'ft.nt.sinceAwake', { time: formatTime(state.since) }) : null].filter(Boolean).join(', ')}>
                <Text variant="small" color={GOLD} center testID="night-state">{openSleep ? tr('ft.nt.asleep', { name: child.first_name }) : tr('ft.nt.awake', { name: child.first_name })}</Text>
                {state?.minutes != null ? (
                  <Text style={[{ fontSize: 64, lineHeight: 72, letterSpacing: -1.5 }, TABULAR]} color={TEXT} testID="night-duration" maxFontSizeMultiplier={1.3}>{span(openSleep ? elapsedMin : state.minutes)}</Text>
                ) : (
                  <Text variant="title" color={TEXT} center testID="night-duration">{tr('u6.night.awake')}</Text>
                )}
                <Text variant="small" color={MUTED} center testID="night-since">{state?.since ? tr(openSleep ? 'ft.nt.sinceAsleep' : 'ft.nt.sinceAwake', { time: formatTime(state.since) }) : tr('ft.nt.noSleep')}</Text>
              </View>
              <Tappable
                accessibilityRole="button"
                accessibilityLabel={openSleep ? tr('u6.night.stop_sleep') : tr('u6.night.start_sleep')}
                accessibilityState={{ busy: busy === 'sleep' }}
                onPress={toggleSleep}
                style={({ pressed }) => ({ marginTop: spacing.md, width: 168, height: 168, borderRadius: 84, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? CARD_PRESSED : 'rgba(205,180,138,0.08)' })}
              >
                <Icon name={openSleep ? 'sun' : 'moon'} color={GOLD} size={34} />
                <Text weight="medium" color={TEXT} style={{ marginTop: 6 }}>{openSleep ? tr('u6.night.wake') : child ? tr('u6.night.fallsAsleep', { name: child.first_name }) : tr('u6.night.sleeps')}</Text>
              </Tappable>
              {openSleep && (
                <Tappable onPress={addWakeup} accessibilityRole="button" accessibilityLabel={tr('u6.night.note_wake_a11y')} style={{ minHeight: 48, justifyContent: 'center' }}>
                  <Text color={GOLD}>{tr('u6.night.note_wake')}</Text>
                </Tappable>
              )}
            </View>

            {/* Cette nuit en un coup d'œil (saisies des dernières 24 h) */}
            <View testID="night-counts" style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }} accessibilityRole="summary"
              accessibilityLabel={tr('u6.night.counts_a11y', { feeds: feeds?.length ?? 0, diapers: diapers?.length ?? 0 })}>
              {[{ icon: 'droplet' as const, n: feeds?.length ?? 0, l: 'feeds' }, { icon: 'wind' as const, n: diapers?.length ?? 0, l: 'diapers' }].map((x) => (
                <Row key={x.l} gap={6}>
                  <Icon name={x.icon} color={GOLD} size={16} />
                  <Text weight="bold" color={TEXT}>{x.n}</Text>
                  <Text variant="small" color={MUTED}>{x.l === 'feeds' ? tr('u6.night.feeds_24h') : tr('u6.night.diapers_24h')}</Text>
                </Row>
              ))}
            </View>

            {/* Saisies de la nuit : heure en colonne fixe ; une ligne ouvre sa fiche pour la corriger */}
            <View style={{ gap: 2 }} testID="night-list">
              <Text variant="label" color={MUTED}>{tr('ft.nt.listTitle')}</Text>
              {entries.length ? (
                <MotionList style={{ gap: 2 }}>{entries.map((e) => (
                  <MotionItem key={`${e.kind}-${e.id}`}><NightRow entry={e} now={now}
                    detail={entryDetail(e, { feeds, diapers, bottles }, now)} onPress={() => openEntry(e)} /></MotionItem>
                ))}</MotionList>
              ) : <Text variant="small" color={MUTED} testID="night-list-empty">{tr('ft.nt.none')}</Text>}
            </View>

            {feedStart && (
              <Text center color={GOLD} accessibilityLiveRegion="polite">{tr(feedStart.side === 'left' ? 'u6.night.feeding_left' : 'u6.night.feeding_right', { duration: formatDuration((now - feedStart.at.getTime()) / 60000) })}</Text>
            )}
            <Row>
              <BigButton icon="droplet" label={feedStart?.side === 'left' ? tr('u6.night.finish') : tr('u6.night.left_breast')} sub={feeds?.[0] ? tr('u6.night.last', { ago: timeAgo(feeds[0].started_at) }) : undefined} onPress={() => feed('left')} />
              <BigButton icon="droplet" label={feedStart?.side === 'right' ? tr('u6.night.finish') : tr('u6.night.right_breast')} onPress={() => feed('right')} />
            </Row>
            <Row>
              <BigButton icon="coffee" label={tr('u6.night.bottle')} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: child.id } })} />
              <BigButton icon="wind" label={tr('u6.night.diaper')} sub={diapers?.[0] ? tr('u6.night.last', { ago: timeAgo(diapers[0].at) }) : undefined} onPress={diaper} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="small" color={MUTED} style={{ flex: 1 }}>{tr('u6.night.vibrations')}</Text>
              <Toggle label={tr('u6.night.vibrations_a11y')} value={vibrations} onChange={setVibrations} />
            </Row>
            <Text variant="caption" color={MUTED} center>{tr('u6.night.footer')}</Text>
          </>
        )}
      </ScrollView>
      {child ? (
        <>
          <NapSessionTray child={child} all={sleeps ?? []} session={tray?.kind === 'sleep' ? (sleeps ?? []).find((x) => x.id === tray.id) ?? null : null}
            open={trayOpen && tray?.kind === 'sleep'} onOpenChange={setTrayOpen}
            onEdit={(x) => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', child: child.id, id: x.id } } as never)}
            onAnalyze={(x) => router.push({ pathname: '/assistant/session', params: { child: child.id, sleep: x.id } } as never)} />
          <BreastSessionTray child={child} feed={tray?.kind === 'feed' ? (feeds ?? []).find((x) => x.id === tray.id) ?? null : null} now={new Date(now)}
            open={trayOpen && tray?.kind === 'feed'} onOpenChange={setTrayOpen}
            onEditAll={(f) => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: child.id, id: f.id } } as never)} />
          <BottleEntryTray child={child} bottle={tray?.kind === 'bottle' ? (bottles ?? []).find((x) => x.id === tray.id) ?? null : null}
            open={trayOpen && tray?.kind === 'bottle'} onOpenChange={setTrayOpen} />
          <DiaperEntryTray child={child} diaper={tray?.kind === 'diaper' ? (diapers ?? []).find((x) => x.id === tray.id) ?? null : null}
            open={trayOpen && tray?.kind === 'diaper'} onOpenChange={setTrayOpen} />
        </>
      ) : null}
    </View>
  );
}

const TABULAR = { fontVariant: ['tabular-nums' as const] };
const KIND_ICON: Record<NightEntry['kind'], React.ComponentProps<typeof Icon>['name']> = { sleep: 'moon', feed: 'droplet', bottle: 'coffee', diaper: 'wind' };

/** Détail d'une saisie de la nuit (durée, côté, quantité, type) : valeurs notées seulement. */
function entryDetail(e: NightEntry, src: { feeds?: Breastfeed[]; diapers?: Diaper[]; bottles?: Bottle[] }, now: number): string {
  if (e.kind === 'sleep') {
    const mins = Math.round(((e.end ? Date.parse(e.end) : now) - Date.parse(e.at)) / 60000);
    return e.end ? tr('ft.nt.range', { to: formatTime(e.end), duration: span(mins) }) : tr('ft.nt.ongoing', { duration: span(mins) });
  }
  if (e.kind === 'feed') {
    const f = src.feeds?.find((x) => x.id === e.id);
    const mins = e.end ? Math.round((Date.parse(e.end) - Date.parse(e.at)) / 60000) : null;
    return [f ? sideLabel(f.side) : null, mins != null ? span(mins) : tr('ft.nt.ongoingShort')].filter(Boolean).join(' · ');
  }
  if (e.kind === 'bottle') {
    const b = src.bottles?.find((x) => x.id === e.id);
    return b?.consumed_ml != null ? tr('qt.b.ml', { n: b.consumed_ml }) : tr('qt.b.noQty');
  }
  const d = src.diapers?.find((x) => x.id === e.id);
  return d ? diaperLabel(diaperType(d)) : '';
}

/** Une saisie de la nuit : heure en colonne fixe, pictogramme, nature + détail, chevron (thème nuit). */
function NightRow({ entry, detail, onPress, now }: { entry: NightEntry; detail: string; onPress: () => void; now: number }) {
  const title = tr(`ft.nt.kind.${entry.kind}` as 'ft.nt.kind.sleep');
  return (
    <Tappable accessibilityRole="button" testID={`night-row-${entry.kind}-${entry.id}`} onPress={onPress}
      accessibilityLabel={`${formatTime(entry.at)}, ${title}, ${detail}, ${timeAgo(entry.at, new Date(now))}. ${tr('ft.nt.openToFix')}`}
      style={({ pressed }) => ({ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: pressed ? CARD_PRESSED : 'transparent' })}>
      <Text weight="bold" color={TEXT} style={[{ minWidth: 60 }, TABULAR]} numberOfLines={1}>{formatTime(entry.at)}</Text>
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CARD_PRESSED }}>
        <Icon name={KIND_ICON[entry.kind]} size={16} color={GOLD} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text weight="medium" color={TEXT}>{title}</Text>
        <Text variant="caption" color={MUTED} style={TABULAR} numberOfLines={1}>{detail}</Text>
      </View>
      <Icon name="chevron-right" size={16} color={MUTED} />
    </Tappable>
  );
}
