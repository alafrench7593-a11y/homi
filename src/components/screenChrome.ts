/**
 * Liaison entre `Screen` et la zone qui défile de son contenu (la sienne, ou celle d'un écran `scroll={false}` qui
 * gère sa propre liste / son assistant) :
 *  - l'en-tête se replie quand le contenu défile (`onScroll`) ;
 *  - `useScreenScroll()` : remonter en haut, défiler jusqu'à un élément (« Reveal », confirmation, erreur).
 * Les zones qui défilent s'inscrivent d'elles-mêmes via `useKeyboardScopeFor` (src/components/keyboard.tsx).
 */
import React from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type Measurable = { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void };
export type Scroller = Measurable & {
  scrollTo?: (o: { x?: number; y: number; animated?: boolean }) => void;
  scrollToOffset?: (o: { offset: number; animated?: boolean }) => void;
};
export type ScrollerEntry = { ref: React.RefObject<Scroller | null>; offset: () => number };

export interface ScreenChrome {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  register: (entry: ScrollerEntry) => () => void;
}
export const ScreenChromeContext = React.createContext<ScreenChrome | null>(null);

/**
 * L'écran qui contient ce composant est-il affiché ? (`Screen` le fournit ; `true` hors d'un écran.)
 * Les animations décoratives en boucle s'arrêtent quand il est faux : les onglets restent montés en arrière-plan
 * et, sur le web, chaque image d'une boucle Animated coûte du JS (audit 10 : ≈ 1 200 écritures de style/s
 * pendant qu'on consultait un autre onglet).
 */
export const ScreenFocusContext = React.createContext(true);
export function useScreenFocused(): boolean {
  return React.useContext(ScreenFocusContext);
}

/** Marge gardée au-dessus d'un élément vers lequel on fait défiler. */
export const SCROLL_TO_MARGIN = 16;

const measure = (n: Measurable | null | undefined) =>
  new Promise<{ y: number; h: number } | null>((resolve) => {
    if (!n?.measureInWindow) return resolve(null);
    try { n.measureInWindow((_x, y, _w, h) => resolve({ y, h })); } catch { resolve(null); }
  });

/** Décalage pour amener le haut de `node` à `margin` du haut de la zone visible (pur, testé). */
export function offsetToReveal(p: { nodeY: number; viewY: number; offset: number; margin?: number }): number {
  return Math.max(0, p.offset + (p.nodeY - p.viewY) - (p.margin ?? SCROLL_TO_MARGIN));
}

/**
 * Décalage pour qu'un élément qui vient d'apparaître soit visible (pur, testé) : `null` s'il l'est déjà assez
 * (son haut est dans la zone, au moins `peek` px visibles) ; sinon son haut est amené au premier quart de la zone.
 */
export function offsetToEnsure(p: { nodeY: number; nodeH: number; viewY: number; viewH: number; offset: number; peek?: number }): number | null {
  const peek = Math.min(p.peek ?? 96, p.nodeH);
  const visibleTop = p.nodeY >= p.viewY - 1;
  const enough = p.nodeY + peek <= p.viewY + p.viewH;
  if (visibleTop && enough) return null;
  return Math.max(0, p.offset + (p.nodeY - p.viewY) - p.viewH * 0.25);
}

export interface ScreenScroll {
  /** Remonte en haut de l'écran (animé sauf « Réduire les animations », géré par la plateforme). */
  scrollToTop: (animated?: boolean) => void;
  /** Fait défiler pour que l'élément (ref d'une View) soit visible en haut de la zone. */
  scrollToNode: (node: Measurable | null | undefined, animated?: boolean) => Promise<void>;
  /** Ne défile que si l'élément est caché (sous le pli ou au-dessus) : nouvelle section, confirmation, erreur. */
  ensureVisible: (node: Measurable | null | undefined, animated?: boolean) => Promise<void>;
}

/** Accès au défilement de l'écran courant (zone principale de `Screen` ou zone inscrite par l'écran). */
export function useScreenScroll(): ScreenScroll {
  const chrome = React.useContext(ScreenChromeContext) as (ScreenChrome & { current?: () => ScrollerEntry | null }) | null;
  return React.useMemo<ScreenScroll>(() => {
    const target = () => chrome?.current?.() ?? null;
    const go = (s: Scroller | null, y: number, animated: boolean) => {
      if (!s) return;
      if (s.scrollTo) s.scrollTo({ y, animated });
      else s.scrollToOffset?.({ offset: y, animated });
    };
    return {
      scrollToTop: (animated = true) => go(target()?.ref.current ?? null, 0, animated),
      scrollToNode: async (node, animated = true) => {
        const e = target();
        const s = e?.ref.current;
        if (!e || !s || !node) return;
        const [n, v] = await Promise.all([measure(node), measure(s)]);
        if (!n || !v) return;
        go(s, offsetToReveal({ nodeY: n.y, viewY: v.y, offset: e.offset() }), animated);
      },
      ensureVisible: async (node, animated = true) => {
        const e = target();
        const s = e?.ref.current;
        if (!e || !s || !node) return;
        const [n, v] = await Promise.all([measure(node), measure(s)]);
        if (!n || !v) return;
        const y = offsetToEnsure({ nodeY: n.y, nodeH: n.h, viewY: v.y, viewH: v.h, offset: e.offset() });
        if (y != null) go(s, y, animated);
      },
    };
  }, [chrome]);
}
