/**
 * Clavier (components/keyboard.tsx + Field) : défilement vers le champ actif, ordre « Suivant », fermeture du clavier
 * sur le dernier champ et quand l'écran ou la feuille est quitté. Le clavier logiciel lui-même n'existe pas en test :
 * l'effet réel sur la hauteur d'écran se vérifie sur appareil.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { Keyboard, TextInput } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { KeyboardScopeContext, nextInVisualOrder, revealOffset, stillFocused, useKeyboardScopeFor, whenKeyboardShown, type KeyboardScope } from '@/components/keyboard';
import { Field } from '@/components/ui';

describe('revealOffset', () => {
  const base = { viewTop: 100, viewBottom: 500, offset: 200, margin: 20 };
  it('ne bouge pas un champ déjà visible', () => {
    expect(revealOffset({ ...base, fieldTop: 200, fieldBottom: 260 })).toBeNull();
  });
  it('remonte un champ caché sous le clavier (bas de zone)', () => {
    // bas visible = 480 ; champ jusqu'à 600 → +120
    expect(revealOffset({ ...base, fieldTop: 550, fieldBottom: 600 })).toBe(320);
  });
  it('redescend un champ passé au-dessus de la zone', () => {
    expect(revealOffset({ ...base, fieldTop: 60, fieldBottom: 100 })).toBe(140);
  });
  it('aligne par le haut un champ plus haut que la zone (long texte multiligne)', () => {
    expect(revealOffset({ ...base, fieldTop: 400, fieldBottom: 1200 })).toBe(480);
  });
  it('jamais de décalage négatif ni de calcul sur une zone vide', () => {
    expect(revealOffset({ ...base, offset: 0, fieldTop: 0, fieldBottom: 40 })).toBe(0);
    expect(revealOffset({ ...base, viewBottom: 120, fieldTop: 600, fieldBottom: 640 })).toBeNull();
  });
});

describe('nextInVisualOrder', () => {
  const box = (x: number, y: number) => ({ x, y, width: 100, height: 44 });
  it('suit l’ordre visuel, pas l’ordre d’inscription', () => {
    // inscrit : [bas, haut, milieu]
    expect(nextInVisualOrder([box(0, 500), box(0, 100), box(0, 300)], 1)).toBe(2);
    expect(nextInVisualOrder([box(0, 500), box(0, 100), box(0, 300)], 2)).toBe(0);
    expect(nextInVisualOrder([box(0, 500), box(0, 100), box(0, 300)], 0)).toBe(-1);
  });
  it('deux champs côte à côte : gauche puis droite', () => {
    expect(nextInVisualOrder([box(200, 102), box(0, 100), box(0, 300)], 1)).toBe(0);
    expect(nextInVisualOrder([box(200, 102), box(0, 100), box(0, 300)], 0)).toBe(2);
  });
  it('ignore les champs masqués (taille nulle ou non mesurés)', () => {
    expect(nextInVisualOrder([box(0, 100), { x: 0, y: 200, width: 0, height: 0 }, null, box(0, 400)], 0)).toBe(3);
  });
});

describe('whenKeyboardShown', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
  it('attend l’apparition du clavier, une seule fois', () => {
    let handler: (() => void) | undefined;
    const remove = jest.fn();
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((_e: string, h: () => void) => { handler = h; return { remove }; }) as never);
    const cb = jest.fn();
    whenKeyboardShown(cb);
    handler?.();
    jest.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
  });
  it('sans événement (clavier matériel, web) : repli après un délai', () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    const cb = jest.fn();
    whenKeyboardShown(cb, 450);
    jest.advanceTimersByTime(449);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2);
    expect(cb).toHaveBeenCalledTimes(1);
  });
  it('annulable (champ quitté avant l’apparition du clavier)', () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const cb = jest.fn();
    const cancel = whenKeyboardShown(cb);
    cancel();
    jest.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });
});

// ─── Field dans une portée clavier ───────────────────────────────────────────
let scopeRef: KeyboardScope | null = null;
function Scope({ children }: { children: React.ReactNode }) {
  const scroll = React.useRef(null);
  const { scope } = useKeyboardScopeFor(scroll);
  scopeRef = scope;
  return <KeyboardScopeContext.Provider value={scope}>{children}</KeyboardScopeContext.Provider>;
}

async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(el); });
  return r;
}
const inputs = (r: ReactTestRenderer) => r.root.findAllByType(TextInput);
/** Position à l'écran simulée pour chaque champ (ordre visuel) + focus espionné. */
function place(r: ReactTestRenderer, ys: number[]) {
  return inputs(r).map((n, i) => {
    const inst = n.instance as { measureInWindow: unknown; focus: unknown };
    inst.measureInWindow = (cb: (x: number, y: number, w: number, h: number) => void) => cb(0, ys[i], 300, 44);
    const focus = jest.fn();
    inst.focus = focus;
    return focus;
  });
}

describe('Field : « Suivant » et fermeture du clavier', () => {
  afterEach(() => jest.restoreAllMocks());

  it('« Suivant » sur les premiers champs, « OK » sur le dernier, sans fermer le clavier entre deux', async () => {
    const r = await render(<Scope><Field label="E-mail" /><Field label="Prénom" /><Field label="Ville" /></Scope>);
    const p = inputs(r).map((n) => n.props);
    expect(p.map((x) => x.returnKeyType)).toEqual(['next', 'next', 'done']);
    expect(p.every((x) => x.submitBehavior === 'submit' && x.blurOnSubmit === false)).toBe(true);
  });

  it('« Suivant » donne le focus au champ suivant à l’écran (y compris un champ multiligne)', async () => {
    const r = await render(<Scope><Field label="Titre" /><Field label="Texte" multiline /></Scope>);
    const focus = place(r, [100, 200]);
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await act(async () => { inputs(r)[0].props.onSubmitEditing(); });
    expect(focus[1]).toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
    // le multiligne garde le retour à la ligne : pas d'enchaînement imposé
    expect(inputs(r)[1].props.submitBehavior).toBeUndefined();
  });

  it('le dernier champ ferme le clavier (Keyboard.dismiss) au lieu de rester ouvert', async () => {
    const r = await render(<Scope><Field label="A" /><Field label="B" /></Scope>);
    place(r, [100, 200]);
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    await act(async () => { inputs(r)[1].props.onSubmitEditing(); });
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('un champ avec sa propre action (envoyer, chercher…) garde son comportement', async () => {
    const onSubmit = jest.fn();
    const r = await render(<Scope><Field label="Mot de passe" onSubmitEditing={onSubmit} returnKeyType="go" /><Field label="Recherche" returnKeyType="search" /></Scope>);
    const [a, b] = inputs(r).map((n) => n.props);
    expect(a.returnKeyType).toBe('go');
    expect(a.submitBehavior).toBeUndefined();
    a.onSubmitEditing();
    expect(onSubmit).toHaveBeenCalled();
    expect(b.returnKeyType).toBe('search');
    expect(b.submitBehavior).toBeUndefined();
  });

  it('hors portée (composant isolé) : comportement React Native inchangé', async () => {
    const r = await render(<Field label="Seul" />);
    const p = inputs(r)[0].props;
    expect(p.returnKeyType).toBeUndefined();
    expect(p.submitBehavior).toBeUndefined();
  });

  it('multiligne : texte aligné en haut (Android)', async () => {
    const r = await render(<Scope><Field label="Notes" multiline /></Scope>);
    const style = ([] as object[]).concat(...[inputs(r)[0].props.style].flat(3)).filter(Boolean);
    expect(style.some((s) => (s as { textAlignVertical?: string }).textAlignVertical === 'top')).toBe(true);
  });

  it('la référence transmise reste le vrai champ (focus() des écrans appelants)', async () => {
    const ref = React.createRef<TextInput>();
    const r = await render(<Scope><Field ref={ref} label="Commentaire" /></Scope>);
    expect(ref.current).toBe(inputs(r)[0].instance);
  });

  it('quitter l’écran ferme le clavier seulement s’il a été ouvert par un de ses champs', async () => {
    const r = await render(<Scope><Field label="A" /></Scope>);
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    const state = TextInput.State as unknown as { currentlyFocusedInput: () => unknown };
    const focused = jest.spyOn(state, 'currentlyFocusedInput');
    focused.mockReturnValue({ autre: 'champ d’un autre écran' });
    scopeRef?.dismissIfOwned();
    expect(dismiss).not.toHaveBeenCalled();
    focused.mockReturnValue(inputs(r)[0].instance);
    scopeRef?.dismissIfOwned();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});

describe('défilement différé « garder le champ visible »', () => {
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
  let scope: KeyboardScope | null = null;
  const scrollTo = jest.fn();
  const scroller = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(0, 0, 375, 400), scrollTo };
  function Host() {
    const ref = React.useRef(scroller);
    scope = useKeyboardScopeFor(ref).scope;
    return null;
  }
  const field = (focused: boolean) => ({ isFocused: () => focused, measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(0, 600, 300, 44) }) as unknown as TextInput;

  it('défile vers un champ toujours focalisé', async () => {
    jest.useFakeTimers(); scrollTo.mockClear();
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    await render(<Host />);
    scope!.reveal(field(true));
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
  it('ne déplace rien si le champ a été quitté (ou démonté) avant le délai', async () => {
    jest.useFakeTimers(); scrollTo.mockClear();
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    await render(<Host />);
    scope!.reveal(field(false));
    scope!.reveal(null);
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(stillFocused(null)).toBe(false);
  });
});
