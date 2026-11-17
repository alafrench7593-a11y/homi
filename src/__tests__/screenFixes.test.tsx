/**
 * Défauts d'écran corrigés le 17/11/2026 :
 *  - carte « À lire » : hauteur maîtrisée (vignette fixe, lignes limitées, aucun pourcentage de hauteur) ;
 *  - pavés numériques iOS : barre « Suivant / OK » au-dessus du clavier, rien sur Android ;
 *  - « OK » suit l'ordre visuel des champs (comme « Suivant ») ;
 *  - feuille du bas : un appui sur le voile ferme d'abord le clavier ;
 *  - écran verrouillé : pas de flèche Retour sur « / » ; jauge d'intensité animée par `scaleX`.
 * Le rendu réel sur iPhone (hauteurs, clavier logiciel) ne se vérifie que sur appareil.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/' };
});

import React from 'react';
import { Keyboard, Platform, StyleSheet, TextInput } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { KeyboardScopeContext, needsKeyboardAccessory, useKeyboardScopeFor, visualOrder, type KeyboardScope } from '@/components/keyboard';
import { Field } from '@/components/ui';
import { Sheet } from '@/components/Overlays';
import { gateHasBack } from '@/components/PremiumGate';
import { ARTICLE_ART, ArticleCard } from '@/features/cocoon/Cocoon';
import { IntensityMeter } from '@/features/cycle/PainKit';
import { setLocale, t as tr } from '@/i18n';
import type { Article } from '@/lib/types';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.restoreAllMocks();
});
const flat = (n: ReactTestInstance) => (StyleSheet.flatten(n.props.style) ?? {}) as Record<string, unknown>;
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id);
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}

// ─── 1. Carte « À lire » ─────────────────────────────────────────────────────
const article = {
  id: 'a1', slug: 'sommeil-bebe', category_id: null, title: 'Le sommeil de bébé, mois après mois : repères, rythmes et idées reçues à oublier',
  summary: 'Un très long résumé. '.repeat(30), body_md: 'mot '.repeat(600), journeys: [], min_week: null, max_week: null, min_age_months: null, max_age_months: null,
  postpartum: false, tags: ['sommeil'], author_name: null, reviewer_name: null, reviewer_qualification: null, sources: [], validated_at: null,
  updated_on: '2026-11-01', status: 'published', is_premium: false, is_safety_critical: false,
} as Article;

describe('carte « À lire » : hauteur maîtrisée', () => {
  it('vignette carrée aux dimensions fixes, sans étirement', async () => {
    const r = await render(<ArticleCard article={article} premium />);
    const art = byId(r, 'article-art').map(flat).find((s) => s.width !== undefined)!;
    expect(art.width).toBe(ARTICLE_ART);
    expect(art.height).toBe(ARTICLE_ART);
    expect(ARTICLE_ART).toBe(88);
    expect(art.borderRadius).toBeGreaterThan(0);
    expect(art.alignSelf).toBeUndefined();
  });

  it('aucune hauteur en pourcentage, aucun marginTop auto, aucun étirement vertical dans la carte', async () => {
    const r = await render(<ArticleCard article={article} premium />);
    const card = byId(r, 'cocoon-article')[0];
    const bad: string[] = [];
    for (const n of card.findAll((x) => x.props.style !== undefined || x.props.height !== undefined)) {
      const s = flat(n);
      if (typeof s.height === 'string' || typeof s.minHeight === 'string') bad.push(`hauteur ${String(s.height ?? s.minHeight)}`);
      if (typeof n.props.height === 'string' && n.props.height.includes('%')) bad.push(`svg ${n.props.height}`);
      if (s.marginTop === 'auto') bad.push('marginTop auto');
      if (s.alignSelf === 'stretch') bad.push('alignSelf stretch');
      if (s.flex === 1 && s.flexDirection !== 'row' && n.props.testID === 'cocoon-article-row') bad.push('rangée flex');
    }
    expect(bad).toEqual([]);
    // la rangée aligne ses enfants en haut : la vignette ne suit pas la hauteur du texte
    expect(flat(byId(r, 'cocoon-article-row')[0]).alignItems).toBe('flex-start');
  });

  it('titre sur 2 lignes, aperçu sur 3 lignes, lien « Lire l’article »', async () => {
    const r = await render(<ArticleCard article={article} premium />);
    expect(byId(r, 'article-title')[0].props.numberOfLines).toBe(2);
    expect(byId(r, 'article-summary')[0].props.numberOfLines).toBe(3);
    expect(byId(r, 'article-reading')[0].props.numberOfLines).toBe(1);
    expect(texts(byId(r, 'article-link')[0])).toContain(tr('coc.article.readFull'));
    // grande taille de texte : le lien grandit (hauteur minimale, pas de hauteur fixe) et son libellé peut passer à la ligne
    const link = flat(byId(r, 'article-link')[0]);
    expect(link.height).toBeUndefined();
    expect(link.minHeight).toBeGreaterThanOrEqual(36);
  });

  it('libellé du lien présent dans les 5 langues', () => {
    const seen = new Set<string>();
    for (const l of ['fr', 'en', 'de', 'es', 'it'] as const) {
      setLocale(l);
      const v = tr('coc.article.readFull');
      expect(v).not.toBe('coc.article.readFull');
      seen.add(v);
      expect(tr('common.next')).not.toBe('common.next');
      expect(tr('cy.dis.notFound')).not.toBe('cy.dis.notFound');
    }
    setLocale('fr');
    expect(seen.size).toBe(5);
  });
});

// ─── 2. Pavés numériques iOS ─────────────────────────────────────────────────
let scopeRef: KeyboardScope | null = null;
function Scope({ children }: { children: React.ReactNode }) {
  const scroll = React.useRef(null);
  const { scope } = useKeyboardScopeFor(scroll);
  scopeRef = scope;
  return <KeyboardScopeContext.Provider value={scope}>{children}</KeyboardScopeContext.Provider>;
}
const inputs = (r: ReactTestRenderer) => r.root.findAllByType(TextInput);
function place(r: ReactTestRenderer, ys: number[]) {
  return inputs(r).map((n, i) => {
    const inst = n.instance as { measureInWindow: unknown; focus: unknown };
    inst.measureInWindow = (cb: (x: number, y: number, w: number, h: number) => void) => cb(0, ys[i], 300, 44);
    const focus = jest.fn();
    inst.focus = focus;
    return focus;
  });
}
const accessory = (r: ReactTestRenderer) => r.root.findAll((n) => n.props.testID === 'field-accessory' && typeof n.props.onPress === 'function');
function withOS<T>(os: 'ios' | 'android' | 'web', fn: () => Promise<T>): Promise<T> {
  const before = Platform.OS;
  (Platform as { OS: string }).OS = os;
  return fn().finally(() => { (Platform as { OS: string }).OS = before; });
}

describe('pavés numériques sans touche de validation', () => {
  it('règle : seulement iOS, seulement number-pad / decimal-pad / phone-pad', () => {
    for (const k of ['number-pad', 'decimal-pad', 'phone-pad']) {
      expect(needsKeyboardAccessory(k, 'ios')).toBe(true);
      expect(needsKeyboardAccessory(k, 'android')).toBe(false);
      expect(needsKeyboardAccessory(k, 'web')).toBe(false);
    }
    for (const k of [undefined, 'default', 'numeric', 'email-address', 'numbers-and-punctuation']) expect(needsKeyboardAccessory(k, 'ios')).toBe(false);
  });

  it('iOS : barre reliée au champ ; « Suivant » passe au champ suivant, « OK » ferme le clavier', async () => {
    await withOS('ios', async () => {
      const r = await render(<Scope><Field label="Poids" keyboardType="decimal-pad" /><Field label="Taille" keyboardType="number-pad" /></Scope>);
      const [a, b] = inputs(r).map((n) => n.props);
      expect(typeof a.inputAccessoryViewID).toBe('string');
      expect(a.inputAccessoryViewID).not.toBe(b.inputAccessoryViewID);
      const bars = accessory(r);
      expect(bars.map((n) => n.props.accessibilityLabel)).toEqual([tr('common.next'), tr('common.ok')]);
      const focus = place(r, [100, 200]);
      const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
      await act(async () => { bars[0].props.onPress(); });
      expect(focus[1]).toHaveBeenCalledTimes(1);
      expect(dismiss).not.toHaveBeenCalled();
      await act(async () => { bars[1].props.onPress(); });
      expect(dismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('iOS, champ hors portée : « OK » ferme le clavier', async () => {
    await withOS('ios', async () => {
      const r = await render(<Field label="Téléphone" keyboardType="phone-pad" />);
      const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
      const [bar] = accessory(r);
      expect(bar.props.accessibilityLabel).toBe(tr('common.ok'));
      bar.props.onPress();
      expect(dismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('iOS : pas de barre pour un clavier qui a déjà sa touche Retour, ni pour un champ non modifiable', async () => {
    await withOS('ios', async () => {
      const r = await render(<Scope><Field label="Nom" /><Field label="Code" keyboardType="numeric" /><Field label="Fixe" keyboardType="number-pad" editable={false} /></Scope>);
      expect(accessory(r)).toHaveLength(0);
      expect(inputs(r).every((n) => n.props.inputAccessoryViewID === undefined)).toBe(true);
    });
  });

  it('Android et web : rien ne change (ni barre, ni identifiant)', async () => {
    for (const os of ['android', 'web'] as const) {
      await withOS(os, async () => {
        const r = await render(<Scope><Field label="Poids" keyboardType="decimal-pad" /><Field label="Taille" keyboardType="number-pad" /></Scope>);
        expect(accessory(r)).toHaveLength(0);
        expect(inputs(r).every((n) => n.props.inputAccessoryViewID === undefined)).toBe(true);
      });
    }
  });
});

describe('« OK » suit l’ordre visuel (comme « Suivant »)', () => {
  it('visualOrder : haut → bas, puis gauche → droite, champs masqués ignorés', () => {
    const box = (x: number, y: number, w = 100) => ({ x, y, width: w, height: 44 });
    expect(visualOrder([box(0, 500), box(0, 100), box(200, 102), null, box(0, 300, 0)])).toEqual([1, 2, 0]);
  });

  it('le dernier champ à l’écran affiche « OK », même inscrit en premier', async () => {
    const r = await render(<Scope><Field label="Bas" /><Field label="Haut" /><Field label="Milieu" /></Scope>);
    // sans mesure : ordre d'inscription (repli)
    expect(inputs(r).map((n) => n.props.returnKeyType)).toEqual(['next', 'next', 'done']);
    place(r, [500, 100, 300]);
    await act(async () => { scopeRef!.reveal(inputs(r)[1].instance as TextInput); await Promise.resolve(); await Promise.resolve(); });
    expect(inputs(r).map((n) => n.props.returnKeyType)).toEqual(['done', 'next', 'next']);
    // et « Suivant » depuis le dernier champ visuel ferme bien le clavier (même ordre)
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    await act(async () => { inputs(r)[0].props.onSubmitEditing(); });
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});

// ─── 3. Feuille du bas ───────────────────────────────────────────────────────
describe('Sheet : clavier', () => {
  function listeners() {
    const map = new Map<string, Set<() => void>>();
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((e: string, h: () => void) => {
      if (!map.has(e)) map.set(e, new Set());
      map.get(e)!.add(h);
      return { remove: () => map.get(e)!.delete(h) };
    }) as never);
    return (e: string) => map.get(e)?.forEach((h) => h());
  }

  it('clavier ouvert : le voile ferme d’abord le clavier ; clavier fermé : il ferme la feuille', async () => {
    const emit = listeners();
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    const onClose = jest.fn();
    const r = await render(<Sheet visible onClose={onClose} title="Ajouter"><Field label="Nom" /></Sheet>);
    const backdrop = () => byId(r, 'sheet-backdrop').find((n) => typeof n.props.onPress === 'function')!;
    await act(async () => { emit('keyboardWillShow'); });
    await act(async () => { backdrop().props.onPress(); });
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { emit('keyboardWillHide'); });
    await act(async () => { backdrop().props.onPress(); });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('le contenu ferme le clavier au glissement et garde les appuis', async () => {
    listeners();
    const r = await render(<Sheet visible onClose={() => undefined} title="Ajouter"><Field label="Nom" /></Sheet>);
    const scroll = byId(r, 'sheet-scroll')[0];
    expect(scroll.props.keyboardDismissMode).toBe('on-drag');
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  });
});

// ─── 6. Écran verrouillé ─────────────────────────────────────────────────────
describe('écran Premium verrouillé : flèche Retour', () => {
  it('masquée sur la racine, visible ailleurs', () => {
    expect(gateHasBack('/')).toBe(false);
    expect(gateHasBack('')).toBe(false);
    expect(gateHasBack('/?x=1')).toBe(false);
    expect(gateHasBack('/baby')).toBe(true);
    expect(gateHasBack('/child/abc/growth')).toBe(true);
  });
});

// ─── 8. Jauge d'intensité ────────────────────────────────────────────────────
describe('jauge d’intensité (douleur)', () => {
  it('animée par scaleX depuis la gauche, jamais par width (pilote natif)', async () => {
    const r = await render(<IntensityMeter value={4} onChange={() => undefined} />);
    const fill = byId(r, 'intensity-fill').map(flat).find((s) => s.transform !== undefined)!;
    expect(fill.width).toBe('100%');
    expect(fill.transformOrigin).toBe('left');
    expect(Object.keys((fill.transform as Record<string, unknown>[])[0])).toEqual(['scaleX']);
  });
});
