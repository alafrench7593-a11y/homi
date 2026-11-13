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

/**
 * Calendrier : toujours sombre et lisible (contrastes ≥ 4,5:1 sur le fond).
 * HOMI (13/11/2026) : fond midnight violet, règles en framboise (plus de cuivre ni de rose poudré), fertilité lilas.
 */
export const CAL = {
  bg: '#1D1638', bg2: '#261C4A', line: 'rgba(255,255,255,0.08)', text: '#F7F4FB', soft: '#D6CEEA', muted: '#A99FC4',
  period: '#A8346A', periodText: '#FFFFFF', predicted: 'rgba(255,156,195,0.24)', predictedBorder: '#FF9CC3', predictedText: '#FFD6E6',
  fertile: 'rgba(167,139,250,0.40)', fertileText: '#E6DEFF', ovulation: '#D9CCFF', today: '#FFFFFF',
  symptom: '#F2D49A', intimacy: '#FF9CC3', contraception: '#8FD3B0', selected: '#A8346A',
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
  glass: 'rgba(251,249,254,0.62)', border: 'rgba(255,255,255,0.85)', rim: 'rgba(255,255,255,0.95)', sheen: 'rgba(255,255,255,0.55)',
  wash: ['rgba(228,218,251,0.5)', 'rgba(233,207,164,0.14)', 'rgba(196,178,244,0.40)'], haloA: 'rgba(196,174,255,0.5)', haloB: 'rgba(233,207,164,0.45)', shadow: '#5B2A86',
  text: '#1C1533', soft: '#4A3F63', muted: '#584D72', line: 'rgba(28,21,51,0.08)', chip: 'rgba(255,255,255,0.6)',
  period: ['#B23C74', '#8E2A5A'], periodText: '#FFFFFF', predicted: 'rgba(168,52,106,0.12)', predictedBorder: '#C77AA0', predictedText: '#8E2A5A',
  fertile: 'rgba(143,114,226,0.18)', fertileText: '#4F3AA6', ovulation: '#7A5CE0',
  todayRing: ['#E9CFA4', '#5B2A86'], todayGlow: 'rgba(205,190,250,0.3)', todayShadow: '#5B2A86', todayInner: 'rgba(251,249,254,0.96)',
  symptom: '#8A5A0E', intimacy: '#A8346A', contraception: '#286B40', reminder: '#2A609C',
};
const CAL_NIGHT: CalPalette = {
  glass: 'rgba(29,22,56,0.55)', border: 'rgba(255,255,255,0.14)', rim: 'rgba(255,255,255,0.22)', sheen: 'rgba(255,255,255,0.08)',
  wash: ['rgba(205,190,250,0.14)', 'rgba(233,207,164,0.08)', 'rgba(169,139,255,0.18)'], haloA: 'rgba(169,139,255,0.26)', haloB: 'rgba(233,207,164,0.16)', shadow: '#000000',
  text: '#F7F4FB', soft: '#D6CEEA', muted: '#B3A9CF', line: 'rgba(255,255,255,0.08)', chip: 'rgba(255,255,255,0.08)',
  period: ['#B23C74', '#8E2A5A'], periodText: '#FFFFFF', predicted: 'rgba(255,156,195,0.18)', predictedBorder: '#FF9CC3', predictedText: '#FFD6E6',
  fertile: 'rgba(167,139,250,0.32)', fertileText: '#ECE6FF', ovulation: '#D9CCFF',
  todayRing: ['#E9CFA4', '#CDBEFA'], todayGlow: 'rgba(233,207,164,0.16)', todayShadow: '#E9CFA4', todayInner: 'rgba(22,17,43,0.92)',
  symptom: '#F2D49A', intimacy: '#FF9CC3', contraception: '#8FD3B0', reminder: '#A8CCFF',
};
/** Mode nuit (bébé à 3 h du matin) : même calendrier, lumière encore réduite. */
const CAL_DIM: CalPalette = { ...CAL_NIGHT, glass: 'rgba(15,11,30,0.78)', haloA: 'rgba(169,139,255,0.06)', haloB: 'rgba(233,207,164,0.05)', sheen: 'rgba(255,255,255,0.03)', todayGlow: 'rgba(205,190,250,0.08)' };
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
