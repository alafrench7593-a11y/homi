/**
 * Mode nuit : ambiance très sombre et chaude, gros boutons, animations lentes, aucun son.
 * Ne modifie jamais la luminosité du téléphone et laisse l'accès aux urgences visible.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StarField } from '@/components/StarField';
import { Button, Chip, haptic, Icon, Row, Text, Toggle } from '@/components/ui';
import { ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useAddLog, useChildren, useInvalidate, useLogs, useOpenSleep } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useUiStore } from '@/lib/store';
import { formatDuration, formatTime, timeAgo } from '@/lib/domain/dates';
import type { Breastfeed, Diaper } from '@/lib/types';
import { Aurora } from '@/components/Aurora';
import { radius, spacing } from '@/theme/tokens';

const GOLD = '#FF8FB1';
const TEXT = '#F2DFC1';
const MUTED = '#B8A88F';

function BigButton({ icon, label, sub, onPress }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      onPress={() => { haptic('light'); onPress(); }}
      style={({ pressed }) => ({ flex: 1, minHeight: 92, borderRadius: radius.lg, backgroundColor: pressed ? '#262E5C' : '#161C40', borderWidth: 1, borderColor: '#262E5C', alignItems: 'center', justifyContent: 'center', gap: 4, padding: spacing.xs })}
    >
      <Icon name={icon} color={GOLD} size={24} />
      <Text weight="medium" color={TEXT} center>{label}</Text>
      {sub ? <Text variant="caption" color={MUTED} center>{sub}</Text> : null}
    </Pressable>
  );
}

export default function NightMode() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const inv = useInvalidate();
  const setNightMode = useUiStore((s) => s.setNightMode);
  const vibrations = useUiStore((s) => s.nightVibrations);
  const setVibrations = useUiStore((s) => s.setNightVibrations);
  const { subject, setSubject } = useActiveSubject();
  const childrenQ = useChildren();
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
      toast(friendlyError(e, 'Action impossible. Réessayez dans un instant.'), 'error');
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
        toast(`Sommeil enregistré : ${formatDuration(elapsedMin)}.`);
      } else {
        await addSleep.mutateAsync({ child_id: child.id, household_id: child.household_id, started_at: new Date().toISOString(), kind: new Date().getHours() >= 19 || new Date().getHours() < 7 ? 'night' : 'nap' });
        toast('Bonne nuit. Le sommeil est en cours.', 'info');
      }
      haptic('success');
    } catch (e) {
      toast(friendlyError(e, 'Action impossible. Réessayez dans un instant.'), 'error');
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
      toast('Réveil noté.', 'info');
    });
  }

  async function feed(side: 'left' | 'right') {
    if (!child) return;
    if (feedStart && feedStart.side === side) {
      const start = feedStart;
      await run('feed', async () => {
        await addFeed.mutateAsync({ child_id: child.id, household_id: child.household_id, side, started_at: start.at.toISOString(), ended_at: new Date().toISOString() });
        toast(`Tétée enregistrée (${formatDuration((Date.now() - start.at.getTime()) / 60000)}).`);
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
      toast('Couche enregistrée.');
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0912', overflow: 'hidden' }}>
      <StatusBar style="light" />
      <Aurora mood="lowlight" />
      <StarField density={40} color="#F3D6DF" />
      {/* Défilement : sur petit écran (ou texte agrandi) rien n'est coupé ; le décor reste à l'intérieur de l'écran */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quitter le mode nuit" onPress={() => router.back()} hitSlop={10} style={{ minHeight: 48, justifyContent: 'center' }}>
            <Row gap={6}><Icon name="x" color={MUTED} size={20} /><Text color={MUTED}>Quitter</Text></Row>
          </Pressable>
          <Text variant="small" color={MUTED}>{formatTime(new Date(now))}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Numéros d’urgence" onPress={() => router.push('/emergency')} hitSlop={10} style={{ minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="life-buoy" color="#F0A0A0" size={22} />
          </Pressable>
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
            <Text color={TEXT} center>Ajoutez le profil d’un enfant pour utiliser le mode nuit.</Text>
            <Button label="Ajouter un enfant" icon="plus" variant="night" onPress={() => router.push('/profiles/new?kind=child' as never)} />
          </View>
        ) : (
          <>
            <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
              <Text variant="small" color={MUTED} center>{child.first_name}</Text>
              {openSleep ? (
                <>
                  <Text variant="small" color={GOLD}>dort depuis</Text>
                  <Text style={{ fontSize: 56, lineHeight: 64 }} color={TEXT} accessibilityLiveRegion="polite">{formatDuration(elapsedMin)}</Text>
                  <Text variant="small" color={MUTED}>depuis {formatTime(openSleep.started_at)}</Text>
                </>
              ) : (
                <Text variant="title" color={TEXT} center>Éveil</Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={openSleep ? 'Arrêter le sommeil' : 'Démarrer le sommeil'}
                accessibilityState={{ busy: busy === 'sleep' }}
                onPress={toggleSleep}
                style={({ pressed }) => ({ marginTop: spacing.md, width: 168, height: 168, borderRadius: 84, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#1D2450' : 'rgba(226,184,132,0.08)' })}
              >
                <Icon name={openSleep ? 'sun' : 'moon'} color={GOLD} size={34} />
                <Text weight="medium" color={TEXT} style={{ marginTop: 6 }}>{openSleep ? 'Réveil' : 'Il/elle dort'}</Text>
              </Pressable>
              {openSleep && (
                <Pressable onPress={addWakeup} accessibilityRole="button" accessibilityLabel="Noter un réveil nocturne" style={{ minHeight: 48, justifyContent: 'center' }}>
                  <Text color={GOLD}>+ Noter un réveil</Text>
                </Pressable>
              )}
            </View>

            {feedStart && (
              <Text center color={GOLD} accessibilityLiveRegion="polite">Tétée {feedStart.side === 'left' ? 'gauche' : 'droite'} en cours depuis {timeAgo(feedStart.at).replace('il y a ', '')} — touchez à nouveau pour terminer</Text>
            )}
            <Row>
              <BigButton icon="droplet" label={feedStart?.side === 'left' ? 'Terminer' : 'Sein gauche'} sub={feeds?.[0] ? `dernière : ${timeAgo(feeds[0].started_at)}` : undefined} onPress={() => feed('left')} />
              <BigButton icon="droplet" label={feedStart?.side === 'right' ? 'Terminer' : 'Sein droit'} onPress={() => feed('right')} />
            </Row>
            <Row>
              <BigButton icon="coffee" label="Biberon" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: child.id } })} />
              <BigButton icon="wind" label="Couche" sub={diapers?.[0] ? `dernière : ${timeAgo(diapers[0].at)}` : undefined} onPress={diaper} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="small" color={MUTED} style={{ flex: 1 }}>Vibrations</Text>
              <Toggle label="Vibrations en mode nuit" value={vibrations} onChange={setVibrations} />
            </Row>
            <Text variant="caption" color={MUTED} center>Aucun son. La luminosité de votre téléphone n’est pas modifiée.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
