/**
 * Retour haptique discret des primitives de mouvement : mêmes règles que `haptic()` de src/components/ui.tsx
 * (jamais sur le web ; seulement si « Vibrations » est actif ; la nuit, seulement avec l'accord explicite).
 * Dupliqué volontairement (quelques lignes) pour que src/motion ne dépende pas de ui.tsx (pas de cycle quand
 * ui.tsx migrera vers ces primitives).
 */
import * as Haptics from 'expo-haptics';
import { useUiStore } from '@/lib/store';
import { hapticsSupported } from '@/theme/motion';

export type MotionHaptic = 'light' | 'selection' | 'none';

export function motionHaptic(kind: MotionHaptic = 'light') {
  if (kind === 'none' || !hapticsSupported) return;
  const s = useUiStore.getState();
  if (!s.hapticsEnabled || (s.nightMode && !s.nightVibrations)) return;
  try {
    const p = kind === 'selection' ? Haptics.selectionAsync() : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.resolve(p).catch(() => undefined);
  } catch {
    // retour haptique indisponible (simulateur)
  }
}
