/**
 * Audit 09 (UX, accessibilité, mouvement) — régressions des composants partagés :
 * débordement sur petit écran / texte agrandi / clavier (titre, orbes, sélecteur, bouton principal, en-tête),
 * clavier web, accès au défilement, carte de confirmation, champs web.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: (p: { testID?: string }) => (p.testID ? require('react').createElement('Text', { testID: p.testID }) : null), MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('@/lib/lowPower', () => ({ useLowPower: () => false }));

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { charEm, fitTitleSize, lineCount, orbLayout, textWidth, TITLE_STEPS } from '@/components/layoutFit';
import { pillsFit, ChoiceGroup } from '@/components/controls/ChoiceGroup';
import { headerMode, nextInnerScrolled, HEADER_TIGHT_HEIGHT } from '@/components/Screen';
import { Button, nextLabelStep } from '@/components/ui';
import { webKeyboardOpen, WEB_KEYBOARD_MIN } from '@/components/keyboard';
import { offsetToEnsure, offsetToReveal } from '@/components/screenChrome';
import { confirmationLook } from '@/components/controls/ConfirmationCard';
import { webInteractionCss } from '@/components/WebInteractionStyles';
import { cappedScale } from '@/theme/fontScale';
import { barChartLayout, chartNumber } from '@/components/Charts';
import { CHOICE } from '@/components/controls';
import { MIN_TOUCH, typography } from '@/theme/tokens';

const MOODS = ['Très difficile', 'Difficile', 'Entre les deux', 'Plutôt bien', 'Bien'];

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider>); });
  mounted.push(r);
  return r;
}
afterEach(async () => { await act(async () => { while (mounted.length) mounted.pop()!.unmount(); }); });
const radios = (r: ReactTestRenderer) => r.root.findAll((n) => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function');
const hostIds = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');

describe('estimation de largeur (prudente)', () => {
  it('surestime légèrement les mesures réelles Manrope 700 (canvas, 100 px)', () => {
    // mesures réelles (em par caractère × longueur) relevées dans le navigateur
    const real: Record<string, number> = { difficile: 0.403 * 9, Comment: 0.684 * 7, Enregistrer: 0.497 * 11, Plutôt: 0.5 * 6 };
    for (const [w, em] of Object.entries(real)) {
      const est = textWidth(w, 100);
      expect(est).toBeGreaterThanOrEqual(em * 100 * 0.97);
      expect(est).toBeLessThan(em * 100 * 1.25);
    }
  });
  it('les lettres fines comptent moins que les larges', () => {
    expect(charEm('i')).toBeLessThan(charEm('a'));
    expect(charEm('m')).toBeGreaterThan(charEm('a'));
    expect(charEm('M')).toBeGreaterThan(charEm('A') - 0.01);
  });
  it('lineCount coupe aux espaces et signale un mot trop large (Infinity)', () => {
    expect(lineCount('Comment je me sens', 1000, 32)).toBe(1);
    expect(lineCount('Comment je me sens', 200, 32)).toBe(2);
    expect(lineCount('Anticonstitutionnellement', 100, 16)).toBe(Infinity);
  });
});

describe('titre d’écran qui réduit (2 lignes max, aucun mot coupé)', () => {
  // 320 px − marges (2 × 24) − glyphe 40 + écart 16
  const AVAIL_320 = 320 - 48 - 56;
  it('taille pleine quand il tient', () => {
    expect(fitTitleSize('Réglages', AVAIL_320, 1).fontSize).toBe(32);
  });
  it('réduit avec le texte agrandi 1,3 (plafond du rôle) plutôt que de passer à 3 lignes', () => {
    const scale = cappedScale(1.3, typography.headingXL.maxScale);
    const f = fitTitleSize('Comment je me sens', AVAIL_320, scale);
    expect(f.fontSize).toBeLessThan(32);
    expect(lineCount('Comment je me sens', AVAIL_320, f.fontSize * scale)).toBeLessThanOrEqual(2);
  });
  it('chaque mot tient sur une ligne même au plafond 1,5', () => {
    for (const title of ['Scanner un produit', 'Mon journal intime', 'Accompagnement post-partum', 'Notifications']) {
      const f = fitTitleSize(title, AVAIL_320, 1.5);
      expect(TITLE_STEPS).toContain(f.fontSize as (typeof TITLE_STEPS)[number]);
      const lines = lineCount(title, AVAIL_320, f.fontSize * 1.5);
      if (f.fontSize !== TITLE_STEPS[TITLE_STEPS.length - 1]) expect(lines).toBeLessThanOrEqual(2);
    }
  });
});

describe('orbes : libellés entiers, rangées qui passent à la ligne', () => {
  const ROW_320 = 320 - 48;
  const base = { labels: MOODS, width: ROW_320, fontSize: typography.caption.fontSize, gap: CHOICE.orbGap, minCol: MIN_TOUCH };
  it('320 px, texte normal : une seule rangée de 5 (comportement inchangé)', () => {
    expect(orbLayout({ ...base, scale: 1 })).toMatchObject({ perRow: 5, rows: 1 });
  });
  it('320 px, texte 1,3 : deux rangées équilibrées (3 + 2), « difficile » entier', () => {
    const l = orbLayout({ ...base, scale: 1.3 });
    expect(l.rows).toBe(2);
    expect(l.perRow).toBe(3);
    for (const m of MOODS) expect(lineCount(m, l.col, typography.caption.fontSize * 1.3)).toBeLessThanOrEqual(3);
  });
  it('largeur inconnue (avant mesure) : une rangée', () => {
    expect(orbLayout({ ...base, width: 0 }).rows).toBe(1);
  });
});

describe('sélecteur (pills) → cartes quand un libellé ne tient pas', () => {
  it('libellés courts : reste en pills', () => {
    expect(pillsFit(['Jour', 'Semaine', 'Mois'], 88, 1)).toBe(true);
  });
  it('libellés longs + texte agrandi : bascule (passe à la ligne au lieu de couper)', () => {
    expect(pillsFit(['Moi seulement', 'Tout le foyer', 'Les enfants', 'Personne'], 62, 1.5)).toBe(false);
    // segment étroit sans coche ni icône : toute la largeur sert au libellé
    expect(pillsFit(['Un', 'Deux', 'Trois'], 61, 1)).toBe(true);
  });
  it('rendu : variante cards → radios cochables, description lue, coche sur le choix', async () => {
    const onChange = jest.fn();
    const r = await render(<ChoiceGroup variant="cards" label="Partage" value="a" onChange={onChange}
      options={[{ value: 'a', label: 'Moi', description: 'Visible par vous seule' }, { value: 'b', label: 'Foyer' }]} />);
    const rs = radios(r);
    expect(rs.map((n) => n.props.accessibilityLabel)).toEqual(['Moi, Visible par vous seule', 'Foyer']);
    expect(rs[0].props.accessibilityState).toEqual({ selected: true, checked: true });
    await act(async () => { rs[1].props.onPress(); });
    expect(onChange).toHaveBeenCalledWith('b');
    expect(hostIds(r, 'choice-check')).toHaveLength(1);
  });
  it('rendu : pills trop étroites pour leurs libellés → cartes (rien de coupé)', async () => {
    const r = await render(<ChoiceGroup label="Partage" value="a" onChange={() => undefined} testID="grp"
      options={[{ value: 'a', label: 'Moi seulement' }, { value: 'b', label: 'Tout le foyer' }, { value: 'c', label: 'Les enfants' }, { value: 'd', label: 'Anticonstitutionnellement' }]} />);
    expect(hostIds(r, 'choice-indicator')).toHaveLength(0);
    const grp = r.root.findAll((n) => n.props.testID === 'grp' && typeof n.props.onLayout === 'function')[0];
    await act(async () => { grp.props.onLayout({ nativeEvent: { layout: { width: 272, height: 52 } } }); });
    // bascule en cartes : même groupe, mêmes radios, plus de rail à indicateur
    expect(radios(r)).toHaveLength(4);
    expect(hostIds(r, 'choice-indicator')).toHaveLength(0);
    expect(hostIds(r, 'choice-check')).toHaveLength(1);
  });
});

describe('en-tête d’écran qui se replie', () => {
  it('écran qui défile : grand titre dans le contenu, compact une fois passé', () => {
    expect(headerMode({ scroll: true, keyboard: false, height: 800, innerScrolled: false, scrolledPastTitle: false })).toEqual({ largeInContent: true, largeFixed: false, compact: false });
    expect(headerMode({ scroll: true, keyboard: true, height: 300, innerScrolled: false, scrolledPastTitle: true }).compact).toBe(true);
  });
  it('écran fixe : replié au clavier, en fenêtre basse et au défilement de sa zone', () => {
    const m = (o: Partial<Parameters<typeof headerMode>[0]>) => headerMode({ scroll: false, keyboard: false, height: 800, innerScrolled: false, scrolledPastTitle: false, ...o });
    expect(m({}).largeFixed).toBe(true);
    expect(m({ keyboard: true }).compact).toBe(true);
    expect(m({ height: HEADER_TIGHT_HEIGHT - 1 }).compact).toBe(true);
    expect(m({ innerScrolled: true }).largeFixed).toBe(false);
  });
  it('hystérésis : ne se replie pas si le contenu ne défilerait plus, se déplie seulement en haut', () => {
    expect(nextInnerScrolled(false, { y: 40, contentH: 700, viewH: 400, titleH: 120 })).toBe(true);
    expect(nextInnerScrolled(false, { y: 40, contentH: 540, viewH: 400, titleH: 120 })).toBe(false);
    expect(nextInnerScrolled(true, { y: 10, contentH: 700, viewH: 520, titleH: 120 })).toBe(true);
    expect(nextInnerScrolled(true, { y: 0, contentH: 700, viewH: 520, titleH: 120 })).toBe(false);
  });
});

describe('bouton principal : une ligne (sans icône, puis libellé court)', () => {
  it('avance seulement si le libellé passe à la ligne', () => {
    expect(nextLabelStep(0, { lines: 1, hasIcon: true, hasShort: true })).toBe(0);
    expect(nextLabelStep(0, { lines: 2, hasIcon: true, hasShort: true })).toBe(1);
    expect(nextLabelStep(1, { lines: 2, hasIcon: false, hasShort: true })).toBe(2);
    // sans libellé court : dernier recours, libellé 2 px plus petit ; puis plus rien ne bouge
    expect(nextLabelStep(1, { lines: 2, hasIcon: false, hasShort: false })).toBe(3);
    expect(nextLabelStep(2, { lines: 2, hasIcon: false, hasShort: true })).toBe(3);
    expect(nextLabelStep(3, { lines: 2, hasIcon: false, hasShort: true })).toBe(3);
  });
});

describe('clavier web (navigateurs mobiles)', () => {
  it('ouvert = saisie en cours ET zone visible réduite d’au moins 120 px', () => {
    expect(webKeyboardOpen({ editing: true, height: 308, maxHeight: 568 })).toBe(true);
    expect(webKeyboardOpen({ editing: false, height: 308, maxHeight: 568 })).toBe(false);
    expect(webKeyboardOpen({ editing: true, height: 568 - WEB_KEYBOARD_MIN + 1, maxHeight: 568 })).toBe(false);
  });
});

describe('accès au défilement de Screen', () => {
  it('scrollToNode amène le haut de l’élément sous la marge', () => {
    expect(offsetToReveal({ nodeY: 900, viewY: 100, offset: 200, margin: 16 })).toBe(984);
    expect(offsetToReveal({ nodeY: 50, viewY: 100, offset: 20 })).toBe(0);
  });
  it('ensureVisible ne bouge pas un élément déjà visible, montre un élément sous le pli', () => {
    expect(offsetToEnsure({ nodeY: 300, nodeH: 200, viewY: 100, viewH: 400, offset: 0 })).toBeNull();
    expect(offsetToEnsure({ nodeY: 480, nodeH: 200, viewY: 100, viewH: 400, offset: 50 })).toBe(330);
  });
});

describe('carte de confirmation standard', () => {
  it('trois états, chacun avec icône et titre (jamais la couleur seule)', () => {
    expect(confirmationLook('saved')).toMatchObject({ tone: 'success', icon: 'check-circle', live: 'polite' });
    expect(confirmationLook('offline')).toMatchObject({ tone: 'warning', icon: 'cloud-off', messageKey: 'common.offlineSaved' });
    expect(confirmationLook('error')).toMatchObject({ tone: 'danger', live: 'assertive' });
  });
});

describe('règles web des champs', () => {
  it('champs rétrécissables et un seul anneau de focus', () => {
    const css = webInteractionCss('#123456');
    expect(css).toContain('input,textarea{min-width:0}');
    expect(css).toContain('input[data-field="1"]:focus');
    expect(css).toMatch(/input:not\(\[data-field="1"\]\):focus-visible[^{]*\{outline:2px solid #123456/);
  });
});

describe('graphiques (signalés par l’audit 06)', () => {
  it('axe et valeurs au format de la langue : « 62,7 », pas « 62.7 »', () => {
    expect(chartNumber(62.7)).toBe('62,7');
    expect(chartNumber(62.666)).toBe('62,7');
    expect(chartNumber(3)).toBe('3');
  });
  it('7 barres : libellé et valeur partout', () => {
    const l = barChartLayout([1, 0, 3, 4, 5, 6, 7]);
    expect(l.compact).toBe(false);
    expect([0, 1, 2, 3, 4, 5, 6].every(l.showLabel)).toBe(true);
    expect(l.showValue(1)).toBe(false);
  });
  it('30 barres : une barre par jour, libellés espacés, valeurs sur la dernière et la plus haute seulement', () => {
    const v = Array.from({ length: 30 }, (_, i) => (i === 12 ? 900 : 100 + i));
    const l = barChartLayout(v);
    expect(l.compact).toBe(true);
    const labels = v.map((_, i) => i).filter(l.showLabel);
    expect(labels).toContain(29);
    expect(labels.length).toBeLessThanOrEqual(7);
    expect(v.map((_, i) => i).filter(l.showValue)).toEqual([12, 29]);
  });
});

describe('bouton pleine largeur : rendu', () => {
  const textNodes = (r: ReactTestRenderer, s: string) => r.root.findAll((n) => typeof n.type === 'string' && n.props.children === s);
  it('libellé sur 2 lignes → icône retirée et marges réduites, puis libellé court', async () => {
    const r = await render(<Button label="Enregistrer : Plutôt bien" shortLabel="Enregistrer" icon="check" size="lg" full onPress={() => undefined} />);
    const measure = async (s: string) => {
      // la rangée (icône + libellé) qui contient le libellé porte la mesure
      const node = r.root.findAll((x) => typeof x.props.onLayout === 'function' && x.findAll((y) => y.props.children === s).length > 0 && x.props.accessibilityRole !== 'button').pop()!;
      await act(async () => { node.props.onLayout({ nativeEvent: { layout: { width: 180, height: 22 * 2 * 2 } } }); });
    };
    const icons = () => r.root.findAll((n) => n.props.name === 'check').length;
    expect(icons()).toBeGreaterThan(0);
    await measure('Enregistrer : Plutôt bien');
    expect(icons()).toBe(0);
    await measure('Enregistrer : Plutôt bien');
    expect(textNodes(r, 'Enregistrer').length).toBeGreaterThan(0);
    // le lecteur d'écran lit toujours le libellé complet
    expect(r.root.findAll((n) => n.props.accessibilityLabel === 'Enregistrer : Plutôt bien').length).toBeGreaterThan(0);
  });
});
