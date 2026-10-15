/**
 * Mode nuit : ambiance très sombre et chaude, gros boutons, animations lentes, aucun son.
 * Ne modifie jamais la luminosité du téléphone et laisse l'accès aux urgences visible.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StarField } from '@/components/StarField';
import { Chip, haptic, Icon, Row, Text, Toggle } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useAddLog, useChildren, useInvalidate, useLogs, useOpenSleep } from '@/lib/data/hooks';
import { useUiStore } from '@/lib/store';
import { formatDuration, formatTime, timeAgo } from '@/lib/domain/dates';
import type { Breastfeed, Diaper } from '@/lib/types';
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
  const { data: children } = useChildren();
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

  async function toggleSleep() {
    if (!child) return;
    try {
      if (openSleep) {
        await backend.update('sleeps', { ended_at: new Date().toISOString() }, [eq('id', openSleep.id)]);
        inv('sleeps');
        toast(`Sommeil enregistré : ${formatDuration(elapsedMin)}.`);
      } else {
        await addSleep.mutateAsync({ child_id: child.id, household_id: child.household_id, started_at: new Date().toISOString() });
        toast('Bonne nuit. Le sommeil est en cours.', 'info');
      }
      haptic('success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    }
  }

  async function addWakeup() {
    if (!openSleep) return;
    const current = await backend.select<{ wakeups: number }>({ table: 'sleeps', filters: [eq('id', openSleep.id)] });
    await backend.update('sleeps', { wakeups: (current[0]?.wakeups ?? 0) + 1 }, [eq('id', openSleep.id)]);
    inv('sleeps');
    toast('Réveil noté.', 'info');
  }

  async function feed(side: 'left' | 'right') {
    if (!child) return;
    if (feedStart && feedStart.side === side) {
      await addFeed.mutateAsync({ child_id: child.id, household_id: child.household_id, side, started_at: feedStart.at.toISOString(), ended_at: new Date().toISOString() });
      toast(`Tétée enregistrée (${formatDuration((Date.now() - feedStart.at.getTime()) / 60000)}).`);
      setFeedStart(null);
    } else {
      setFeedStart({ side, at: new Date() });
    }
  }

  async function diaper() {
    if (!child) return;
    await addDiaper.mutateAsync({ child_id: child.id, household_id: child.household_id, at: new Date().toISOString(), wet: true, stool: false });
    toast('Couche enregistrée.');
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#070A1C' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#05071A', '#0D1129', '#141A3D']} style={{ position: 'absolute', inset: 0 } as never} />
      <StarField density={60} />
      <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
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

        {!child ? (
          <Text color={TEXT} center style={{ marginTop: spacing.xxl }}>Ajoutez le profil d’un enfant pour utiliser le mode nuit.</Text>
        ) : (
          <>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
              <Text variant="small" color={MUTED}>{child.first_name}</Text>
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
              <Text variant="small" color={MUTED}>Vibrations</Text>
              <Toggle label="Vibrations en mode nuit" value={vibrations} onChange={setVibrations} />
            </Row>
            <Text variant="caption" color={MUTED} center>Aucun son. La luminosité de votre téléphone n’est pas modifiée.</Text>
          </>
        )}
      </View>
    </View>
  );
}
