/**
 * Registre des ANCRES de la visite guidée : un élément réel de l'interface (sélecteur de profil, « Mes outils »,
 * recherche, bouton central, étoile, lien vers l'agenda, « Personnaliser ») s'inscrit sous un identifiant ; la
 * superposition le mesure dans la fenêtre (`measureInWindow`) pour poser la découpe exactement dessus, et peut faire
 * défiler son écran jusqu'à lui.
 *
 *   const anchor = useTourAnchor('quick-add');
 *   <View {...anchor}>…</View>
 *
 * Coût nul pour l'élément : une ref, un `onLayout` qui prévient la superposition (aucun rendu de l'élément), une
 * inscription au montage. Plusieurs éléments peuvent porter le même identifiant (une étoile par outil, un sélecteur par
 * écran) : la superposition choisit le premier VISIBLE sur l'écran affiché (`useScreenFocused`).
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import { useScreenFocused, useScreenScroll } from '@/components/screenChrome';
import type { Rect } from './model';

export interface AnchorEntry {
  id: string;
  order: number;
  measure: () => Promise<Rect | null>;
  reveal: () => Promise<void>;
  focused: () => boolean;
}

const registry = new Map<string, Set<AnchorEntry>>();
const listeners = new Set<() => void>();
let seq = 0;
const notify = () => listeners.forEach((l) => l());

export function onAnchorsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
/** Éléments inscrits sous un identifiant, dans l'ordre d'inscription. */
export function anchorEntries(id: string): AnchorEntry[] {
  return [...(registry.get(id) ?? [])].sort((a, b) => a.order - b.order);
}
/** Inscription directe (tests, éléments sans composant React). */
export function registerAnchor(e: Omit<AnchorEntry, 'order'>): () => void {
  const entry = { ...e, order: seq++ };
  const set = registry.get(e.id) ?? new Set<AnchorEntry>();
  set.add(entry);
  registry.set(e.id, set);
  notify();
  return () => { set.delete(entry); if (!set.size) registry.delete(e.id); notify(); };
}

type Measurable = { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void };
export function measureNode(n: Measurable | null | undefined): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!n?.measureInWindow) return resolve(null);
    // Une vue détachée (écran en arrière-plan) peut ne jamais répondre : on n'attend pas plus de 250 ms
    const timer = setTimeout(() => resolve(null), 250);
    try {
      n.measureInWindow((x, y, width, height) => { clearTimeout(timer); resolve(Number.isFinite(x) && Number.isFinite(y) ? { x, y, width, height } : null); });
    } catch { clearTimeout(timer); resolve(null); }
  });
}

/** Pose une ancre de visite sur la vue qui reçoit les props rendues. */
export function useTourAnchor(id: string) {
  const ref = useRef<View>(null);
  const scroll = useScreenScroll();
  const focused = useScreenFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  useEffect(() => registerAnchor({
    id,
    measure: () => measureNode(ref.current as unknown as Measurable),
    // défilement jusqu'à l'élément : amené au tiers haut de l'écran (jamais sous la pastille « Démo » ou l'en-tête)
    reveal: () => scroll.bringToThird(ref.current as unknown as Measurable),
    focused: () => focusedRef.current,
  }), [id, scroll]);
  useEffect(() => { notify(); }, [focused]);
  const onLayout = useCallback((_e: LayoutChangeEvent) => notify(), []);
  return useMemo(() => ({ ref, onLayout, collapsable: false as const }), [onLayout]);
}
