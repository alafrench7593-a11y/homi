/**
 * Cartes de suivi quotidien : élégantes, chaleureuses, utilisables d'une main.
 * Chaque carte : icône originale (dessin vectoriel propre à Toi & Moi), fond doux légèrement coloré, coins arrondis,
 * légère profondeur, animation discrète au toucher, retour haptique facultatif, dernière information, et un bouton
 * « + » d'ajout rapide bien visible. Quatre actions utiles au profil affiché ; les autres dans « Voir tous les suivis ».
 * Mode nuit (thème sombre) : fond bleu nuit, contraste lisible, animations réduites.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Button, haptic, Icon, Row, Text } from '@/components/ui';
import { Sheet, useToast } from '@/components/Overlays';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { useAppointments, useLogs, useMeasurements, useMaternalWeights, useMoods, useOpenSleep, useProfile } from '@/lib/data/hooks';
import { useTreatments } from '@/lib/data/hooks-needs';
import { useParentSleepLogs } from '@/lib/data/hooks-sleep';
import { SleepError, useSleepActions } from '@/lib/data/hooks-sleepPlanner';
import { friendlyError } from '@/lib/data/hooks-settings';
import { childAge } from '@/lib/domain/child';
import { childTrackProfile, lastInfo, nextDose, TRACK_LABEL, trackActions, type LastData, type TrackKey, type TrackProfile } from '@/lib/domain/trackingCards';
import { useUiStore } from '@/lib/store';
import type { Bottle, Breastfeed, Child, Diaper, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, radius, spacing } from '@/theme/tokens';

// ─── Teintes douces (jour) et bleu nuit (nuit) ─────────────────────────────────────────────────────

const TINT: Record<TrackKey, { bg: string; ink: string }> = {
  bottle: { bg: '#FFEFE6', ink: '#D2693C' }, breastfeed: { bg: '#FFE9F0', ink: '#C2416E' }, diaper: { bg: '#E9F4FF', ink: '#3A78B5' },
  sleep: { bg: '#EEEAFF', ink: '#6A52D6' }, meal: { bg: '#EAF7EC', ink: '#3C8C55' }, pumping: { bg: '#FBEAF5', ink: '#A6448A' },
  observation: { bg: '#FFF4E0', ink: '#B7791F' }, growth: { bg: '#E6F6F4', ink: '#2A8A80' }, medication: { bg: '#F1ECFF', ink: '#5E4CC2' },
  appointment: { bg: '#FFEDEB', ink: '#C25145' }, mother_sleep: { bg: '#EAEDFF', ink: '#4F5EC4' }, mood: { bg: '#FFF3E6', ink: '#C27A2C' },
  weight: { bg: '#EEF2F6', ink: '#5B6B7C' },
};
const NIGHT = { bg: '#141A36', border: '#232B55', text: '#D6DCF5', muted: '#8E97C2', plus: '#2B3670' };

/** Icônes originales (trait arrondi, 24×24). */
export function TrackIcon({ k, color, size = 26 }: { k: TrackKey; color: string; size?: number }) {
  const p = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const body = (() => {
    switch (k) {
      case 'bottle': return <><Path {...p} d="M10 2.5h4M10.5 2.5v2.2c0 .8-.6 1.1-1.3 1.6C8 7.1 7.5 8.3 7.5 9.8V19a2.5 2.5 0 0 0 2.5 2.5h4A2.5 2.5 0 0 0 16.5 19V9.8c0-1.5-.5-2.7-1.7-3.5c-.7-.5-1.3-.8-1.3-1.6V2.5" /><Path {...p} d="M7.5 12h3M7.5 15h3M7.5 18h3" /></>;
      case 'breastfeed': return <><Path {...p} d="M12 3.5c3.6 4 6 7.3 6 10.3a6 6 0 0 1-12 0c0-3 2.4-6.3 6-10.3z" /><Path {...p} d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.2" /></>;
      case 'diaper': return <><Path {...p} d="M3.5 7.5h17v3.2c0 5.2-3.8 9-8.5 9s-8.5-3.8-8.5-9z" /><Path {...p} d="M3.5 10.5c2.4 0 3.9 1.3 4.6 3.4M20.5 10.5c-2.4 0-3.9 1.3-4.6 3.4" /><Circle cx="12" cy="7.5" r="0.9" fill={color} /></>;
      case 'sleep': return <><Path {...p} d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" /><Path {...p} d="M15 3.5h3l-3 3.5h3" /></>;
      case 'meal': return <><Path {...p} d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" /><Path {...p} d="M8 20.5h8M16.5 3.5l-3 7M14 3.5l-2.5 7" /></>;
      case 'pumping': return <><Path {...p} d="M7 9a5 5 0 0 1 10 0v1.5H7z" /><Path {...p} d="M10 10.5v3h4v-3M10.5 13.5l-1 7h5l-1-7" /></>;
      case 'observation': return <><Path {...p} d="M10 14.8V5a2 2 0 0 1 4 0v9.8a4 4 0 1 1-4 0z" /><Path {...p} d="M12 9v7" /></>;
      case 'growth': return <><Rect {...p} x="4" y="3.5" width="7" height="17" rx="1.5" /><Path {...p} d="M4 7.5h3M4 11.5h4M4 15.5h3M15 20.5V9.5M15 9.5l-2.5 2.5M15 9.5l2.5 2.5" /></>;
      case 'medication': return <><Rect {...p} x="3.2" y="8.3" width="17.6" height="7.4" rx="3.7" transform="rotate(-35 12 12)" /><Path {...p} d="M9.6 8.6l4.8 6.8" /></>;
      case 'appointment': return <><Rect {...p} x="3.5" y="5" width="17" height="15.5" rx="3" /><Path {...p} d="M8 3v4M16 3v4M3.5 10h17" /><Circle cx="12" cy="15" r="1.6" fill={color} /></>;
      case 'mother_sleep': return <><Path {...p} d="M3.5 16.5h17M5 16.5V10a2 2 0 0 1 2-2h3.5a2 2 0 0 1 2 2v1h6a2 2 0 0 1 2 2v3.5M3.5 19.5v-3M20.5 19.5v-3" /><Path {...p} d="M16 3.5h3l-3 3h3" /></>;
      case 'mood': return <><Circle {...p} cx="12" cy="12" r="8.5" /><Path {...p} d="M8.5 14c.9 1.4 2.1 2 3.5 2s2.6-.6 3.5-2" /><Circle cx="9" cy="10" r="1" fill={color} /><Circle cx="15" cy="10" r="1" fill={color} /></>;
      case 'weight': return <><Rect {...p} x="3.5" y="4" width="17" height="16.5" rx="4" /><Path {...p} d="M8.5 9.5a5 5 0 0 1 7 0L13 12" /></>;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">{body}</Svg>;
}

// ─── Carte ─────────────────────────────────────────────────────────────────────────────────────────

export interface TrackCardModel { key: TrackKey; info: string; onOpen: () => void; onAdd: () => void; addLabel?: string; active?: boolean }

export function TrackActionCard({ m, compact }: { m: TrackCardModel; compact?: boolean }) {
  const t = useTheme();
  const reduceSetting = useReduceMotion();
  const night = t.isDark;
  const reduce = reduceSetting || night; // animations réduites la nuit
  const scale = useRef(new Animated.Value(1)).current;
  const tint = TINT[m.key];
  const bg = night ? NIGHT.bg : tint.bg;
  const ink = night ? '#AFC0FF' : tint.ink;
  const press = (to: number) => { if (!reduce) Animated.spring(scale, { toValue: to, useNativeDriver: NATIVE_DRIVER, speed: 40, bounciness: to === 1 ? 6 : 0 }).start(); };
  return (
    <Animated.View style={{ flexBasis: compact ? '100%' : '47%', flexGrow: 1, transform: [{ scale }] }} testID={`track-card-${m.key}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${TRACK_LABEL[m.key]}. ${m.info}`}
        accessibilityHint="Ouvre le suivi"
        onPress={() => { haptic('selection'); m.onOpen(); }}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        style={{
          minHeight: compact ? 76 : 132, borderRadius: radius.xl, padding: spacing.sm + 2, backgroundColor: bg, borderWidth: 1,
          borderColor: night ? NIGHT.border : 'rgba(255,255,255,0.7)', gap: 6,
          shadowColor: night ? '#000' : tint.ink, shadowOpacity: night ? 0.35 : 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3,
          flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : 'stretch',
        }}
      >
        <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <View style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: night ? '#1E2650' : 'rgba(255,255,255,0.75)' }}>
            <TrackIcon k={m.key} color={ink} />
          </View>
          {compact ? null : <AddButton m={m} ink={ink} night={night} />}
        </Row>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold" color={night ? NIGHT.text : undefined}>{TRACK_LABEL[m.key]}</Text>
          <Text variant="small" color={night ? NIGHT.muted : undefined} muted={!night} numberOfLines={4} testID={`track-info-${m.key}`}>{m.info}</Text>
        </View>
        {compact ? <AddButton m={m} ink={ink} night={night} /> : null}
      </Pressable>
    </Animated.View>
  );
}

function AddButton({ m, ink, night }: { m: TrackCardModel; ink: string; night: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={m.addLabel ?? `Ajouter : ${TRACK_LABEL[m.key]}`}
      hitSlop={8}
      onPress={() => { haptic('light'); m.onAdd(); }}
      testID={`track-add-${m.key}`}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: night ? NIGHT.plus : ink, opacity: pressed ? 0.85 : 1 })}
    >
      <Icon name={m.active ? 'sun' : 'plus'} size={22} color="#FFFFFF" />
    </Pressable>
  );
}

function CardsGrid({ primary, more, title }: { primary: TrackCardModel[]; more: TrackCardModel[]; title: string }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const hapticsOn = useUiStore((s) => s.hapticsEnabled);
  const setHaptics = useUiStore((s) => s.setHaptics);
  return (
    <View style={{ gap: spacing.sm }} testID="track-cards">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {primary.map((m) => <TrackActionCard key={m.key} m={m} />)}
      </View>
      <Button label={`Voir tous les suivis${more.length ? ` (${more.length})` : ''}`} variant="ghost" icon="grid" onPress={() => setOpen(true)} testID="track-see-all" />
      <Sheet visible={open} onClose={() => setOpen(false)} title={title}>
        <View style={{ gap: spacing.sm }} testID="track-all">
          {[...primary, ...more].map((m) => <TrackActionCard key={m.key} m={{ ...m, onOpen: () => { setOpen(false); m.onOpen(); }, onAdd: () => { setOpen(false); m.onAdd(); } }} compact />)}
        </View>
        <ToggleRow label="Retour haptique" hint="Une légère vibration quand vous touchez une carte (si le téléphone le permet)." value={hapticsOn} onChange={setHaptics} />
        {t.isDark ? <Text variant="caption" muted>Mode nuit : couleurs adoucies et animations réduites.</Text> : null}
      </Sheet>
    </View>
  );
}

// ─── Enfant ────────────────────────────────────────────────────────────────────────────────────────

const latest = <T,>(rows: T[] | undefined): T | null => (rows && rows.length ? rows[0] : null);

export function ChildTrackCards({ child, journey }: { child: Child; journey?: 'baby' | 'child' | null }) {
  const toast = useToast();
  const id = child.id;
  const bottles = useLogs<Bottle>('bottle', id, 7).data;
  const feeds = useLogs<Breastfeed>('breastfeed', id, 7).data;
  const diapers = useLogs<Diaper>('diaper', id, 7).data;
  const sleeps = useLogs<Sleep>('sleep', id, 7).data;
  const meals = useLogs<Meal>('meal', id, 7).data;
  const pumpings = useLogs<Pumping>('pumping', id, 7).data;
  const obs = useLogs<Observation>('observation', id, 7).data;
  const measures = useMeasurements(id).data;
  const treatments = useTreatments(id).data;
  const appts = useAppointments({ upcomingOnly: true }).data;
  const openSleep = useOpenSleep(id);
  const act = useSleepActions(child);
  const months = childAge(child.birth_date).months;
  const profile: TrackProfile = childTrackProfile(months, { journey, mealsEnabled: child.enabled_tracking.includes('meal') });
  const { primary, more } = trackActions({ profile, enabled: child.enabled_tracking, ageMonths: journey === 'baby' ? Math.min(months, 23) : months });

  const activeTreatment = (treatments ?? []).find((x) => x.active && (!x.end_date || x.end_date >= new Date().toISOString().slice(0, 10)));
  const data: LastData = {
    bottle: latest(bottles), breastfeed: latest(feeds), diaper: latest(diapers), meal: latest(meals), pumping: latest(pumpings), observation: latest(obs),
    sleep: openSleep ? { started_at: openSleep.started_at, ended_at: null } : latest([...(sleeps ?? [])].filter((s) => s.ended_at).sort((a, b) => b.ended_at!.localeCompare(a.ended_at!))),
    growth: latest([...(measures ?? [])].sort((a, b) => b.measured_on.localeCompare(a.measured_on))),
    medication: activeTreatment ? { name: activeTreatment.name, nextAt: nextDose(activeTreatment.times) } : null,
    appointment: latest((appts ?? []).filter((a) => a.child_id === id)),
  };

  async function toggleSleep() {
    try {
      if (openSleep) { await act.awake(new Date()); toast(`Réveil de ${child.first_name} noté.`, 'success'); }
      else { const h = new Date().getHours(); await act.asleep(new Date(), h >= 19 || h < 7 ? 'night' : 'nap'); toast(`${child.first_name} dort : sommeil noté.`, 'success'); }
    } catch (e) { toast(e instanceof SleepError ? e.message : friendlyError(e), 'error'); }
  }

  const track = (kind: string) => () => router.push({ pathname: '/track/[kind]', params: { kind, child: id } });
  const model = (k: TrackKey): TrackCardModel => {
    const info = lastInfo(k, data, { name: child.first_name, sex: child.sex });
    switch (k) {
      case 'bottle': return { key: k, info, onOpen: () => router.push(`/bottle/${id}` as never), onAdd: track('bottle') };
      case 'sleep': return { key: k, info, onOpen: () => router.push(`/sleep/${id}` as never), onAdd: toggleSleep, active: !!openSleep, addLabel: openSleep ? `${child.first_name} se réveille` : `${child.first_name} s’endort` };
      case 'meal': return { key: k, info, onOpen: track('meal'), onAdd: track('meal') };
      case 'growth': return { key: k, info, onOpen: () => router.push(`/child/${id}/growth`), onAdd: () => router.push(`/child/${id}/growth`) };
      case 'medication': return { key: k, info, onOpen: () => router.push(`/child/${id}/needs?tab=treatments` as never), onAdd: () => router.push(`/child/${id}/needs?tab=treatments` as never), addLabel: 'Voir les traitements prescrits' };
      case 'appointment': return { key: k, info, onOpen: () => router.push('/appointments'), onAdd: () => router.push({ pathname: '/appointments', params: { new: 'quick', child: id } } as never), addLabel: 'Ajouter un rendez-vous' };
      default: return { key: k, info, onOpen: track(k), onAdd: track(k) };
    }
  };
  return <CardsGrid primary={primary.map(model)} more={more.map(model)} title={`Tous les suivis de ${child.first_name}`} />;
}

// ─── Grossesse (jamais de biberon, de tétée ni de couche) ──────────────────────────────────────────

export function PregnancyTrackCards({ pregnancyId }: { pregnancyId: string | null }) {
  const { data: profile } = useProfile();
  const sleepLogs = useParentSleepLogs(5).data;
  const moods = useMoods(5).data;
  const weights = useMaternalWeights(pregnancyId).data;
  const appts = useAppointments({ upcomingOnly: true }).data;
  const { primary, more } = trackActions({ profile: 'pregnancy', hideWeight: !!profile?.hide_weight_module });
  const data: LastData = useMemo(() => ({
    mother_sleep: latest([...(sleepLogs ?? [])].sort((a, b) => b.log_date.localeCompare(a.log_date))),
    mood: latest(moods),
    weight: latest([...(weights ?? [])].sort((a, b) => b.measured_on.localeCompare(a.measured_on))),
    appointment: latest((appts ?? []).filter((a) => !a.child_id)),
    meal: null,
  }), [sleepLogs, moods, weights, appts]);
  const model = (k: TrackKey): TrackCardModel => {
    const info = k === 'meal' ? 'Idées de repas adaptés à la grossesse' : lastInfo(k, data);
    switch (k) {
      case 'mother_sleep': return { key: k, info, onOpen: () => router.push('/me/sleep'), onAdd: () => router.push('/me/sleep') };
      case 'mood': return { key: k, info, onOpen: () => router.push('/me/mood'), onAdd: () => router.push('/me/mood') };
      case 'meal': return { key: k, info, onOpen: () => router.push('/meals'), onAdd: () => router.push('/meals'), addLabel: 'Trouver une idée de repas' };
      case 'weight': return { key: k, info, onOpen: () => router.push('/pregnancy/weight'), onAdd: () => router.push('/pregnancy/weight') };
      default: return { key: k, info, onOpen: () => router.push('/appointments'), onAdd: () => router.push({ pathname: '/appointments', params: { new: 'quick' } } as never), addLabel: 'Ajouter un rendez-vous' };
    }
  };
  return <CardsGrid primary={primary.map(model)} more={more.map(model)} title="Tous mes suivis" />;
}
