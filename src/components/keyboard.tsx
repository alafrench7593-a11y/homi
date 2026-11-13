/**
 * Clavier : une seule mécanique pour toute l'appli (iPhone, Android, web).
 *
 * - `Screen` et `Sheet` posent un `KeyboardAvoidingView` en `padding` (iOS ET Android : depuis Expo 54, Android
 *   est toujours « edge-to-edge » et `adjustResize` ne réduit plus la fenêtre, le clavier recouvrait donc le bas
 *   de l'écran) et fournissent une « portée clavier » (`KeyboardScope`) autour de leur zone qui défile.
 * - `Field` s'inscrit dans la portée : au focus, la zone défile pour garder le champ visible au-dessus du clavier ;
 *   la touche « Suivant » passe au champ suivant (ordre visuel), « OK » sur le dernier ferme le clavier.
 * - Quand l'écran est quitté (navigation, retour) ou la fenêtre fermée, le clavier ouvert par un de ses champs se ferme.
 *
 * Aucune dépendance ajoutée : seulement les API de React Native (Keyboard, TextInput.State, measureInWindow).
 */
import React from 'react';
import { Keyboard, Platform, TextInput, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { ScreenChromeContext } from './screenChrome';

type Measurable = { measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void };
type Box = { x: number; y: number; width: number; height: number };

/** Marge gardée entre le champ et le bord (clavier, bouton du bas). */
export const REVEAL_MARGIN = 24;

/**
 * Nouveau décalage de défilement pour que le champ [fieldTop, fieldBottom] tienne dans la zone visible
 * [viewTop, viewBottom] (coordonnées fenêtre). `null` : rien à faire. Un champ plus haut que la zone (long texte
 * multiligne) est aligné par son haut.
 */
export function revealOffset(p: { fieldTop: number; fieldBottom: number; viewTop: number; viewBottom: number; offset: number; margin?: number }): number | null {
  const margin = p.margin ?? REVEAL_MARGIN;
  const top = p.viewTop + margin;
  const bottom = p.viewBottom - margin;
  if (!(bottom > top)) return null;
  if (p.fieldTop < top) return Math.max(0, p.offset - (top - p.fieldTop));
  if (p.fieldBottom > bottom) {
    const tall = p.fieldBottom - p.fieldTop > bottom - top;
    return Math.max(0, p.offset + (tall ? p.fieldTop - top : p.fieldBottom - bottom));
  }
  return null;
}

/**
 * Ordre visuel des champs (haut → bas, puis gauche → droite ; deux champs côte à côte à quelques points près
 * comptent comme la même ligne). Renvoie l'index du champ qui suit `current`, ou -1.
 */
export function nextInVisualOrder(boxes: (Box | null)[], current: number): number {
  const ROW = 8;
  const cur = boxes[current];
  if (!cur) return -1;
  const order = boxes
    .map((b, i) => ({ b, i }))
    .filter((e): e is { b: Box; i: number } => !!e.b && e.b.width > 0 && e.b.height > 0)
    .sort((a, b) => (Math.abs(a.b.y - b.b.y) <= ROW ? a.b.x - b.b.x : a.b.y - b.b.y));
  const at = order.findIndex((e) => e.i === current);
  return at >= 0 && at + 1 < order.length ? order[at + 1].i : -1;
}

/** Lance `cb` quand le clavier est affiché (ou peu après s'il l'est déjà / s'il n'y a pas de clavier logiciel). */
export function whenKeyboardShown(cb: () => void, fallbackMs = 450): () => void {
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sub: { remove: () => void } | undefined;
  const cancel = () => { done = true; sub?.remove(); if (timer) clearTimeout(timer); };
  const run = () => { if (done) return; cancel(); cb(); };
  if (Keyboard.isVisible()) {
    timer = setTimeout(run, 60);
    return cancel;
  }
  // La mise en page (KeyboardAvoidingView) suit l'événement : on laisse passer une image
  sub = Keyboard.addListener('keyboardDidShow', () => { if (timer) clearTimeout(timer); timer = setTimeout(run, 80); });
  timer = setTimeout(run, fallbackMs);
  return cancel;
}

const measure = (node: Measurable | null | undefined) =>
  new Promise<Box | null>((resolve) => {
    if (!node?.measureInWindow) return resolve(null);
    try { node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height })); } catch { resolve(null); }
  });

/** `editable` : le champ peut recevoir le focus (« Suivant » peut aller d'un champ d'une ligne vers un champ multiligne). */
/** Le champ est-il toujours monté et focalisé ? (natif : isFocused ; web : nœud DOM actif) */
export function stillFocused(input: TextInput | null): boolean {
  if (!input) return false;
  const i = input as unknown as { isFocused?: () => boolean };
  if (typeof i.isFocused === 'function') {
    try { return i.isFocused(); } catch { return false; }
  }
  const doc = (globalThis as { document?: { activeElement?: unknown } }).document;
  return !!doc && doc.activeElement === (input as unknown);
}

type FieldEntry = { ref: React.RefObject<TextInput | null>; editable: () => boolean };

export interface KeyboardScope {
  /** Garde le champ visible (au focus). */
  reveal: (input: TextInput | null) => void;
  /** Inscription d'un champ (ordre « Suivant »). */
  register: (entry: FieldEntry) => () => void;
  /** Champ suivant ; `false` s'il n'y en a pas (le clavier est alors fermé). */
  focusNext: (input: TextInput | null) => Promise<boolean>;
  /** Le champ est-il le dernier champ inscrit (pour « OK » au lieu de « Suivant ») ? */
  isLast: (entry: FieldEntry) => boolean;
  subscribe: (cb: () => void) => () => void;
  version: () => number;
  /** Ferme le clavier s'il a été ouvert par un champ de cette portée. */
  dismissIfOwned: () => void;
}

export const KeyboardScopeContext = React.createContext<KeyboardScope | null>(null);
export const useKeyboardScope = () => React.useContext(KeyboardScopeContext);

type ScrollTarget = Measurable & { scrollTo?: (o: { x?: number; y: number; animated?: boolean }) => void; scrollToOffset?: (o: { offset: number; animated?: boolean }) => void };

/**
 * Portée clavier d'une zone qui défile (ScrollView de `Screen` ou de `Sheet`) : à brancher sur `ref` et `onScroll`.
 */
export function useKeyboardScopeFor(scrollRef: React.RefObject<ScrollTarget | null>, opts?: { chrome?: boolean }) {
  const offset = React.useRef(0);
  // Zone inscrite auprès de l'écran (en-tête qui se replie, `useScreenScroll`) ; une feuille (Sheet) ne s'inscrit pas
  const chromeCtx = React.useContext(ScreenChromeContext);
  const chrome = opts?.chrome === false ? null : chromeCtx;
  React.useEffect(() => chrome?.register({ ref: scrollRef, offset: () => offset.current }), [chrome, scrollRef]);
  const entries = React.useRef<FieldEntry[]>([]);
  const listeners = React.useRef(new Set<() => void>());
  const ver = React.useRef(0);
  const lastFocused = React.useRef<TextInput | null>(null);
  const pending = React.useRef<(() => void) | null>(null);

  const scope = React.useMemo<KeyboardScope>(() => {
    const bump = () => { ver.current += 1; listeners.current.forEach((l) => l()); };
    const scrollToReveal = async (input: TextInput | null) => {
      const scroller = scrollRef.current;
      if (!input || !scroller) return;
      // Garde : le champ a été quitté (autre appui, fermeture) ou démonté entre le focus et ce défilement différé
      if (!stillFocused(input)) return;
      const [field, view] = await Promise.all([measure(input as unknown as Measurable), measure(scroller)]);
      if (!field || !view || view.height <= 0) return;
      let viewBottom = view.y + view.height;
      const kb = Platform.OS !== 'web' && Keyboard.isVisible() ? Keyboard.metrics() : undefined;
      if (kb && kb.screenY > 0) viewBottom = Math.min(viewBottom, kb.screenY);
      const y = revealOffset({ fieldTop: field.y, fieldBottom: field.y + field.height, viewTop: view.y, viewBottom, offset: offset.current });
      if (y == null || !stillFocused(input)) return;
      if (scroller.scrollTo) scroller.scrollTo({ y, animated: true });
      else scroller.scrollToOffset?.({ offset: y, animated: true });
    };
    return {
      reveal: (input) => {
        lastFocused.current = input;
        pending.current?.();
        pending.current = whenKeyboardShown(() => { pending.current = null; void scrollToReveal(input); });
      },
      register: (entry) => {
        entries.current.push(entry);
        bump();
        return () => { entries.current = entries.current.filter((e) => e !== entry); bump(); };
      },
      focusNext: async (input) => {
        const list = entries.current.filter((e) => e.editable() && e.ref.current);
        const current = list.findIndex((e) => e.ref.current === input);
        if (current >= 0) {
          const boxes = await Promise.all(list.map((e) => measure(e.ref.current as unknown as Measurable)));
          const next = nextInVisualOrder(boxes, current);
          if (next >= 0) { list[next].ref.current?.focus(); return true; }
        }
        Keyboard.dismiss();
        return false;
      },
      isLast: (entry) => {
        const list = entries.current.filter((e) => e.editable());
        return list.length === 0 || list[list.length - 1] === entry;
      },
      subscribe: (cb) => { listeners.current.add(cb); return () => { listeners.current.delete(cb); }; },
      version: () => ver.current,
      dismissIfOwned: () => {
        pending.current?.();
        pending.current = null;
        // Web (react-native-web) : seulement `currentlyFocusedField`, qui renvoie le nœud DOM (= la référence du champ)
        const state = TextInput.State as unknown as { currentlyFocusedInput?: () => unknown; currentlyFocusedField?: () => unknown };
        const focused = state.currentlyFocusedInput ? state.currentlyFocusedInput() : state.currentlyFocusedField?.();
        if (!focused) return;
        const owned = focused === lastFocused.current || entries.current.some((e) => e.ref.current === focused);
        if (owned) Keyboard.dismiss();
      },
    };
  }, [scrollRef]);

  React.useEffect(() => () => { pending.current?.(); }, []);
  // Web : le clavier s'ouvre APRÈS le focus (zone visible réduite) ; le champ actif est alors ramené en vue
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    startWebKeyboard();
    const f = () => { if (webKb.open && lastFocused.current && stillFocused(lastFocused.current)) scope.reveal(lastFocused.current); };
    webKb.subs.add(f);
    return () => { webKb.subs.delete(f); };
  }, [scope]);

  const onScroll = React.useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => { offset.current = e.nativeEvent.contentOffset.y; chrome?.onScroll(e); }, [chrome]);
  return { scope, onScroll };
}

/** Champ direct (TextInput hors `Field`) : à brancher sur `onFocus` pour rester visible au-dessus du clavier. */
export function useRevealOnFocus(ref: React.RefObject<TextInput | null>) {
  const scope = useKeyboardScope();
  return React.useCallback(() => { scope?.reveal(ref.current); }, [scope, ref]);
}

/**
 * Web : le clavier logiciel des navigateurs mobiles ne déclenche aucun événement `Keyboard` ; il RÉDUIT la zone
 * visible (`visualViewport`, ou la fenêtre sur Android). On le considère ouvert quand un champ de saisie a le focus
 * ET que la hauteur visible a perdu au moins `WEB_KEYBOARD_MIN` px par rapport à la plus grande hauteur vue à la
 * même largeur (logique pure, testée).
 */
export const WEB_KEYBOARD_MIN = 120;
export function webKeyboardOpen(p: { editing: boolean; height: number; maxHeight: number }): boolean {
  return p.editing && p.maxHeight - p.height >= WEB_KEYBOARD_MIN;
}

type WebWin = { innerWidth: number; innerHeight: number; visualViewport?: { height: number; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void } | null; addEventListener: (t: string, f: () => void, o?: boolean) => void; removeEventListener: (t: string, f: () => void, o?: boolean) => void };
const webKb = { open: false, maxH: 0, width: 0, subs: new Set<() => void>(), started: false };
function webEditing(): boolean {
  const d = (globalThis as { document?: { activeElement?: { tagName?: string; type?: string; isContentEditable?: boolean } | null } }).document;
  const a = d?.activeElement;
  if (!a) return false;
  if (a.tagName === 'TEXTAREA' || a.isContentEditable) return true;
  return a.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|range|color|file|hidden|reset|image)$/i.test(a.type ?? '');
}
function startWebKeyboard() {
  const w = globalThis as unknown as WebWin;
  if (webKb.started || typeof w.addEventListener !== 'function') return;
  webKb.started = true;
  const update = () => {
    const h = w.visualViewport?.height ?? w.innerHeight;
    if (w.innerWidth !== webKb.width) { webKb.width = w.innerWidth; webKb.maxH = 0; }
    // la plus grande hauteur n'est retenue que sans champ actif (sinon le clavier fausserait la référence)
    if (!webEditing() || h > webKb.maxH) webKb.maxH = Math.max(webKb.maxH, h);
    const open = webKeyboardOpen({ editing: webEditing(), height: h, maxHeight: webKb.maxH });
    if (open !== webKb.open) { webKb.open = open; webKb.subs.forEach((f) => f()); }
  };
  w.addEventListener('resize', update);
  w.addEventListener('focusin', update, true);
  w.addEventListener('focusout', () => setTimeout(update, 0), true);
  w.visualViewport?.addEventListener('resize', update);
  update();
}

/** Le clavier logiciel est-il affiché ? (iOS : dès qu'il commence à monter ; web : zone visible réduite pendant une saisie.) */
export function useKeyboardVisible() {
  const [visible, setVisible] = React.useState(() => (Platform.OS === 'web' ? webKb.open : false));
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      startWebKeyboard();
      const f = () => setVisible(webKb.open);
      webKb.subs.add(f);
      f();
      return () => { webKb.subs.delete(f); };
    }
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return visible;
}

/** `behavior` commun des KeyboardAvoidingView de l'appli (le web n'a pas de clavier logiciel à éviter). */
export const KEYBOARD_BEHAVIOR = Platform.OS === 'web' ? undefined : ('padding' as const);
