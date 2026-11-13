import type { cinema as fr } from '../fr/cinema';
import type { Messages } from '../types';

/** Cinematic introduction (first launch, can be replayed from Settings › My home). */
export const cinema: Messages<typeof fr> = {
  'cine.a11y': 'Animated introduction to HOMI',
  'cine.skip': 'Skip',
  'cine.skipA11y': 'Skip the introduction',
  'cine.logo.tagline': 'With you at every step of your story',
  'cine.replay': 'Watch the animated introduction again',
};
