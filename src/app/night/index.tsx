/**
 * Mode nuit : ambiance très sombre (midnight violet HOMI, accents champagne tamisé), gros boutons, animations lentes, aucun son.
 * Ne modifie jamais la luminosité du téléphone et laisse l'accès aux urgences visible.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { StatusBar } from 'expo-status-bar';
import { StarField } from '@/components/StarField';
import { Button, Chip, haptic, Icon, Row, Text, Toggle } from '@/components/ui';
import { ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useAddLog, useTrackedChildren, useInvalidate, useLogs, useOpenSleep } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useUiStore } from '@/lib/store';
import { formatDuration, formatTime, timeAgo } from '@/lib/domain/dates';
import type { Breastfeed, Diaper } from '@/lib/types';
import { Aurora } from '@/components/Aurora';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr } from '@/i18n';

// Couleurs du thème « Nuit » HOMI (src/theme/tokens.ts) : champagne tamisé, perle lilas, jamais de blanc pur
const GOLD = '#CDB48A';
const TEXT = '#DDD0EC';
const MUTED = '#A598C0';
const BG = '#0F0B1E';
const CARD = '#1A1430';
const CARD_PRESSED = '#2E2650';

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
      <Aurora mood="lowlight" />
      <StarField density={40} color={TEXT} />
      {/* Défilement : sur petit écran (ou texte agrandi) rien n'est coupé ; le décor reste à l'intérieur de l'écran */}
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
              <Text variant="small" color={MUTED} center>{child.first_name}</Text>
              {openSleep ? (
                <>
                  <Text variant="small" color={GOLD}>{tr('u6.night.sleeping_for')}</Text>
                  <Text style={{ fontSize: 56, lineHeight: 64 }} color={TEXT} accessibilityLiveRegion="polite">{formatDuration(elapsedMin)}</Text>
                  <Text variant="small" color={MUTED}>{tr('u6.night.since', { time: formatTime(openSleep.started_at) })}</Text>
                </>
              ) : (
                <Text variant="title" color={TEXT} center>{tr('u6.night.awake')}</Text>
              )}
              <Tappable
                accessibilityRole="button"
                accessibilityLabel={openSleep ? tr('u6.night.stop_sleep') : tr('u6.night.start_sleep')}
                accessibilityState={{ busy: busy === 'sleep' }}
                onPress={toggleSleep}
                style={({ pressed }) => ({ marginTop: spacing.md, width: 168, height: 168, borderRadius: 84, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? CARD_PRESSED : 'rgba(205,180,138,0.08)' })}
              >
                <Icon name={openSleep ? 'sun' : 'moon'} color={GOLD} size={34} />
                <Text weight="medium" color={TEXT} style={{ marginTop: 6 }}>{openSleep ? tr('u6.night.wake') : tr('u6.night.sleeps')}</Text>
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
    </View>
  );
}
