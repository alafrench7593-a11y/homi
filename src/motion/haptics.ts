/**
 * Retour haptique discret des primitives de mouvement : mêmes règles que `haptic()` de src/components/ui.tsx
 * (jamais sur le web ; seulement si « Vibrations » est actif ; la nuit, seulement avec l'accord explicite).
 * Dupliqué volontairement (quelques lignes) pour que src/motion ne dépende pas de ui.tsx (pas de cycle quand
 * ui.tsx migrera vers ces primitives).
 */
import * as Haptics from 'expo-haptics';
import { useUiStore } from '@/lib/store';
import { hapticsSupported } from '@/theme/motion';

/**
 * Nuit calme (24/11/2026, avis concurrents : une vibration à la saisie réveillait le bébé) : entre 21 h et 7 h, aucune
 * vibration sans l'accord explicite « Vibrations la nuit », même si le mode nuit n'a pas été activé à la main.
 */
export function hapticsMuted(s: { hapticsEnabled: boolean; nightMode: boolean; nightVibrations: boolean }, now: Date = new Date()): boolean {
  if (!s.hapticsEnabled) return true;
  const h = now.getHours();
  return (s.nightMode || h >= 21 || h < 7) && !s.nightVibrations;
}

export type MotionHaptic = 'light' | 'selection' | 'success' | 'warning' | 'error' | 'none';

export function motionHaptic(kind: MotionHaptic = 'light') {
  if (kind === 'none' || !hapticsSupported) return;
  const s = useUiStore.getState();
  if (hapticsMuted(s)) return;
  try {
    const N = Haptics.NotificationFeedbackType;
    const p = kind === 'selection' ? Haptics.selectionAsync()
      : kind === 'success' ? Haptics.notificationAsync(N.Success)
        : kind === 'warning' ? Haptics.notificationAsync(N.Warning)
          : kind === 'error' ? Haptics.notificationAsync(N.Error)
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.resolve(p).catch(() => undefined);
  } catch {
    // retour haptique indisponible (simulateur)
  }
}
