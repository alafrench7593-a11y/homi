/**
 * Briques visuelles de « Suivre mon cycle » : pastilles modernes (icône, nom court, couleur douce, animation au
 * toucher, état sélectionné bien visible), verrouillage biométrique de la session, couleurs du calendrier sombre.
 */
import React from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import { create } from 'zustand';
import * as LA from 'expo-local-authentication';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { usePop, usePressMotion } from '@/components/Motion';
import { CATEGORY_TINT, categoryOf, PILL_ICON, type CategoryKey } from '@/lib/domain/cycleDaily';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH } from '@/theme/tokens';

/** Calendrier : toujours sombre et lisible (contrastes ≥ 4,5:1 sur le fond). */
export const CAL = {
  bg: '#1F1A24', bg2: '#2A2231', line: 'rgba(255,255,255,0.08)', text: '#F6F1F3', soft: '#CFC6D0', muted: '#9E94A3',
  period: '#B5523C', periodText: '#FFFFFF', predicted: 'rgba(244,182,194,0.26)', predictedBorder: '#F4B6C2', predictedText: '#FBDCE2',
  fertile: 'rgba(167,139,250,0.40)', fertileText: '#E6DEFF', ovulation: '#D9CCFF', today: '#FFFFFF',
  symptom: '#F2C46D', intimacy: '#F4B6C2', contraception: '#8FD3B0', selected: '#B5523C',
};

/** Couleurs du calendrier en verre dépoli, jour et nuit (contrastes du texte ≥ 4,5:1 sur le voile). */
export interface CalPalette {
  glass: string; border: string; rim: string; sheen: string; wash: [string, string, string]; haloA: string; haloB: string; shadow: string;
  text: string; soft: string; muted: string; line: string; chip: string;
  period: [string, string]; periodText: string; predicted: string; predictedBorder: string; predictedText: string;
  fertile: string; fertileText: string; ovulation: string;
  todayRing: [string, string]; todayGlow: string; todayShadow: string; todayInner: string;
  symptom: string; intimacy: string; contraception: string; reminder: string;
}
const CAL_DAY: CalPalette = {
  glass: 'rgba(255,250,248,0.58)', border: 'rgba(255,255,255,0.85)', rim: 'rgba(255,255,255,0.95)', sheen: 'rgba(255,255,255,0.55)',
  wash: ['rgba(247,196,208,0.42)', 'rgba(226,150,120,0.14)', 'rgba(196,178,244,0.40)'], haloA: 'rgba(196,174,255,0.5)', haloB: 'rgba(255,186,202,0.55)', shadow: '#B4507A',
  text: '#2A1A26', soft: '#5E4A57', muted: '#77606D', line: 'rgba(42,26,38,0.08)', chip: 'rgba(255,255,255,0.6)',
  period: ['#B85A43', '#A0432C'], periodText: '#FFFFFF', predicted: 'rgba(226,128,150,0.15)', predictedBorder: '#D9839A', predictedText: '#8E3550',
  fertile: 'rgba(143,114,226,0.18)', fertileText: '#4F3AA6', ovulation: '#7A5CE0',
  todayRing: ['#F08AA6', '#A88BFF'], todayGlow: 'rgba(240,138,166,0.18)', todayShadow: '#E9587C', todayInner: 'rgba(255,250,248,0.96)',
  symptom: '#C27A2C', intimacy: '#C94F7C', contraception: '#2F8A5B', reminder: '#3D6293',
};
const CAL_NIGHT: CalPalette = {
  glass: 'rgba(28,18,38,0.52)', border: 'rgba(255,255,255,0.14)', rim: 'rgba(255,255,255,0.22)', sheen: 'rgba(255,255,255,0.08)',
  wash: ['rgba(255,134,168,0.16)', 'rgba(201,99,75,0.10)', 'rgba(169,139,255,0.18)'], haloA: 'rgba(169,139,255,0.26)', haloB: 'rgba(255,134,168,0.22)', shadow: '#000000',
  text: '#F6F1F3', soft: '#D6CCD6', muted: '#B3A6B8', line: 'rgba(255,255,255,0.08)', chip: 'rgba(255,255,255,0.08)',
  period: ['#C2604A', '#A9472F'], periodText: '#FFFFFF', predicted: 'rgba(244,182,194,0.18)', predictedBorder: '#F4B6C2', predictedText: '#FBDCE2',
  fertile: 'rgba(167,139,250,0.32)', fertileText: '#ECE6FF', ovulation: '#D9CCFF',
  todayRing: ['#FF9CB8', '#B9A2FF'], todayGlow: 'rgba(255,134,168,0.16)', todayShadow: '#FF86A8', todayInner: 'rgba(30,20,40,0.92)',
  symptom: '#F2C46D', intimacy: '#F4B6C2', contraception: '#8FD3B0', reminder: '#9DBAE6',
};
/** Mode nuit (bébé à 3 h du matin) : même calendrier, lumière encore réduite. */
const CAL_DIM: CalPalette = { ...CAL_NIGHT, glass: 'rgba(20,10,17,0.78)', haloA: 'rgba(169,139,255,0.06)', haloB: 'rgba(255,134,168,0.05)', sheen: 'rgba(255,255,255,0.03)', todayGlow: 'rgba(232,154,176,0.08)' };
export function useCalPalette(): CalPalette {
  const t = useTheme();
  return t.name === 'night' ? CAL_DIM : t.isDark ? CAL_NIGHT : CAL_DAY;
}

/** Pastille : une saisie en un geste. */
export function Pill({ id, label, icon, selected, onPress, category, disabled, testID }: {
  id: string; label: string; icon?: IconName; selected: boolean; onPress: () => void; category?: CategoryKey; disabled?: boolean; testID?: string;
}) {
  const t = useTheme();
  const cat = category ?? categoryOf(id) ?? 'notes';
  const tint = CATEGORY_TINT[cat];
  const press = usePressMotion({ pressed: 0.94, hoverLift: -1 });
  const pop = usePop(selected, 1.06);
  const bg = selected ? tint.ink : t.isDark ? 'rgba(255,255,255,0.06)' : tint.bg;
  const fg = selected ? '#FFFFFF' : t.isDark ? t.colors.text : tint.ink;
  return (
    <Animated.View style={[{ maxWidth: '100%' }, press.style, pop]}>
      <Pressable {...press.handlers} disabled={disabled} testID={testID ?? `pill-${id}`}
        accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled }} aria-checked={selected} accessibilityLabel={label}
        onPress={() => { haptic('selection'); onPress(); }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH, paddingHorizontal: 14, borderRadius: 12, backgroundColor: bg,
          borderWidth: 1.5, borderColor: selected ? tint.ink : t.isDark ? 'rgba(255,255,255,0.14)' : 'transparent', opacity: disabled ? 0.5 : 1 }}>
        <Icon name={selected ? 'check' : icon ?? (PILL_ICON[cat] as IconName)} size={16} color={fg} />
        <Text weight="medium" color={fg} style={{ flexShrink: 1 }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export const pillLabel = (id: string) => tr(`c3.p.${id}` as TKey);

// ─── Verrouillage biométrique (session) ────────────────────────────────────────────────────────────

interface LockState { unlockedUntil: number; unlock: () => void; lock: () => void }
/** Déverrouillé pour 5 minutes au plus, en mémoire seulement (jamais enregistré). */
export const useCycleLock = create<LockState>()((set) => ({
  unlockedUntil: 0,
  unlock: () => set({ unlockedUntil: Date.now() + 5 * 60_000 }),
  lock: () => set({ unlockedUntil: 0 }),
}));

/** Biométrie disponible ? (jamais sur le web : on le dit, et le contenu reste accessible). */
export async function biometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LA.hasHardwareAsync()) && (await LA.isEnrolledAsync());
  } catch { return false; }
}
export async function authenticate(): Promise<boolean> {
  if (!(await biometricAvailable())) return true; // rien à vérifier sur cet appareil : réglage appliqué sur un téléphone compatible
  const r = await LA.authenticateAsync({ promptMessage: tr('c3.priv.lockReason'), cancelLabel: tr('common.cancel'), disableDeviceFallback: false });
  return r.success;
}

export function useLocked(scope: 'intimate' | 'cycle', lockMode: string | undefined): boolean {
  const until = useCycleLock((s) => s.unlockedUntil);
  const [available, setAvailable] = React.useState(false);
  React.useEffect(() => { void biometricAvailable().then(setAvailable); }, []);
  if (!available || !lockMode || lockMode === 'off') return false;
  if (scope === 'intimate' ? lockMode !== 'intimate' && lockMode !== 'cycle' : lockMode !== 'cycle') return false;
  return until < Date.now();
}

export function LockedCard({ testID }: { testID?: string }) {
  const t = useTheme();
  const unlock = useCycleLock((s) => s.unlock);
  return (
    <Pressable testID={testID ?? 'cycle-locked'} accessibilityRole="button" accessibilityLabel={tr('c3.priv.unlock')}
      onPress={async () => { if (await authenticate()) { haptic('success'); unlock(); } }}
      style={{ alignItems: 'center', gap: 6, padding: 20, borderRadius: 24, backgroundColor: CAL.bg }}>
      <Icon name="lock" color={CAL.soft} />
      <Text weight="bold" color={CAL.text}>{tr('c3.priv.locked')}</Text>
      <Text variant="small" color={CAL.soft}>{tr('c3.priv.lockedBody')}</Text>
      <View style={{ marginTop: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: t.colors.primary }}>
        <Text weight="bold" color={t.colors.primaryText}>{tr('c3.priv.unlock')}</Text>
      </View>
    </Pressable>
  );
}
