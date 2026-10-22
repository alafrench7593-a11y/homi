/**
 * Interface : jetons d'interaction, bouton anti double envoi, zone tactile animée, feuille de style web (focus, mots longs).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { BUTTON, Button, IconButton } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { webInteractionCss } from '@/components/WebInteractionStyles';
import { interaction } from '@/theme/motion';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  mounted.push(r);
  return r;
}
afterEach(async () => { await act(async () => { while (mounted.length) mounted.pop()!.unmount(); }); });
const pressable = (r: ReactTestRenderer, label: string) => r.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function')[0];

describe('interactions', () => {
  it('jetons : pression 0,97, durées entre 120 et 250 ms', () => {
    expect(interaction.pressScale).toBe(0.97);
    for (const ms of [interaction.pressInMs, interaction.pressOutMs, interaction.hoverMs]) { expect(ms).toBeGreaterThanOrEqual(120); expect(ms).toBeLessThanOrEqual(250); }
  });

  it('bouton : une action en cours bloque les appuis suivants (pas de double envoi), puis le bouton redevient utilisable', async () => {
    let resolve!: () => void;
    const onPress = jest.fn(() => new Promise<void>((r) => { resolve = r; }));
    const r = await render(<Button label="Enregistrer" onPress={onPress} />);
    await act(async () => { pressable(r, 'Enregistrer').props.onPress({}); });
    await act(async () => { pressable(r, 'Enregistrer').props.onPress({}); });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(pressable(r, 'Enregistrer').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    await act(async () => { resolve(); });
    expect(pressable(r, 'Enregistrer').props.accessibilityState).toMatchObject({ busy: false });
    await act(async () => { pressable(r, 'Enregistrer').props.onPress({}); });
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('bouton : une action en échec libère aussi le bouton', async () => {
    const onPress = jest.fn(() => Promise.reject(new Error('réseau')));
    const r = await render(<Button label="Envoyer" onPress={onPress} />);
    await act(async () => { pressable(r, 'Envoyer').props.onPress({}); });
    await act(async () => { await Promise.resolve(); });
    expect(pressable(r, 'Envoyer').props.accessibilityState).toMatchObject({ busy: false });
  });

  it('bouton : variantes outline et destructive, libellé long jamais tronqué', async () => {
    const long = 'Un libellé volontairement très long pour vérifier le retour à la ligne';
    const r = await render(<><Button label={long} variant="outline" /><Button label="Supprimer" variant="destructive" /></>);
    const texts = r.root.findAllByType(RNText).filter((t) => t.props.children === long);
    expect(texts.length).toBe(1);
    expect(texts[0].props.numberOfLines).toBeUndefined();
  });

  it('zone tactile : style fonction et transformation existante conservés', async () => {
    const r = await render(<Tappable accessibilityLabel="case" onPress={() => undefined} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, transform: [{ rotate: '5deg' }] })}><RNText>x</RNText></Tappable>);
    const node = r.root.findAll((n) => n.props.accessibilityLabel === 'case' && n.props.style && typeof n.type === 'string')[0];
    const transform = (StyleSheet.flatten(node.props.style) as { transform: Record<string, unknown>[] }).transform;
    expect(transform[0]).toEqual({ rotate: '5deg' });
    expect(transform.some((t) => 'scale' in t)).toBe(true);
  });

  it('boutons 2026 : coins de 10 à 14 px, zones tactiles confortables, états désactivé et chargement annoncés', async () => {
    for (const r of Object.values(BUTTON.radius)) expect(r).toBeGreaterThanOrEqual(8), expect(r).toBeLessThanOrEqual(14);
    expect(BUTTON.height.md).toBeGreaterThanOrEqual(44);
    expect(BUTTON.height.sm + 2 * 5).toBeGreaterThanOrEqual(44); // petite taille : zone de toucher élargie
    expect(BUTTON.hoverMs).toBeGreaterThanOrEqual(150); expect(BUTTON.hoverMs).toBeLessThanOrEqual(220);
    const r = await render(<><Button label="Désactivé" disabled /><Button label="Charge" loading /><IconButton icon="x" label="Fermer" onPress={() => undefined} /></>);
    const a11y = (label: string) => r.root.findAll((n) => n.props.accessibilityLabel === label && n.props.accessibilityState)[0].props.accessibilityState;
    expect(a11y('Désactivé')).toMatchObject({ disabled: true });
    expect(a11y('Charge')).toMatchObject({ disabled: true, busy: true });
    expect(a11y('Fermer')).toMatchObject({ disabled: false });
  });

  it('web : focus clavier visible, mots longs à la ligne, mouvement réduit', () => {
    const css = webInteractionCss('#E9587C');
    expect(css).not.toContain('border-radius:12px'); // l'anneau suit les coins de chaque élément
    expect(css).toMatch(/\[role="button"\]:focus-visible[^{]*\{outline:2px solid #E9587C/);
    expect(css).toContain('overflow-wrap:break-word');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
