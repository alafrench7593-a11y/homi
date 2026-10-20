/**
 * Règles globales de la version web (aucun effet sur iOS/Android) :
 *  - focus clavier visible (anneau de la couleur principale du thème) sur tout élément interactif ;
 *  - les mots très longs (adresses, liens, codes) passent à la ligne au lieu de sortir de leur conteneur ;
 *  - « réduire les animations » du système : transitions CSS coupées (les animations JS le sont déjà).
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

const ID = 'toietmoi-interaction-css';

export function webInteractionCss(primary: string) {
  const interactive = ['[role="button"]', '[role="link"]', '[role="tab"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]', 'a[href]'];
  return [
    '*,*::before,*::after{box-sizing:border-box}',
    `${interactive.map((s) => `${s}:focus-visible`).join(',')}{outline:2px solid ${primary};outline-offset:3px;border-radius:12px}`,
    `${interactive.map((s) => `${s}:focus:not(:focus-visible)`).join(',')}{outline:none}`,
    'div[dir="auto"],span[dir="auto"]{overflow-wrap:break-word;word-break:normal;hyphens:auto}',
    '@media (prefers-reduced-motion: reduce){*,*::before,*::after{transition-duration:0.01ms!important;animation-duration:0.01ms!important;scroll-behavior:auto!important}}',
  ].join('\n');
}

export function WebInteractionStyles() {
  const t = useTheme();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let el = document.getElementById(ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = ID;
      document.head.appendChild(el);
    }
    el.textContent = webInteractionCss(t.colors.primary);
  }, [t.colors.primary]);
  return null;
}
