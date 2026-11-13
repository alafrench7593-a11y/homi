/**
 * « Au Fil de Nous — Iconography System » : chaque symbole a un tracé valide, sans texte, dans la zone de la grille ;
 * le composant se rend avec et sans libellé (accessibilité), à l'état actif, et avec l'animation du fil
 * (jouée normalement, état final immédiat quand « réduire les animations » est actif).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { themes } from '@/theme/tokens';
import { ICON_TOKENS, MaternityIcon, strokeLength } from '@/components/icons/MaternityIcon';
import { MATERNITY_ICONS, MATERNITY_ICON_GROUPS, MATERNITY_ICON_NAMES, isMaternityIconName } from '@/components/icons/maternityPaths';
import { circle, pathLength } from '@/components/icons/geometry';

const REQUIRED = [
  'regles', 'cycle', 'ovulation', 'fertilite', 'contraception', 'symptomes', 'temperature', 'test_ovulation', 'grossesse',
  'femme_enceinte', 'echographie', 'rdv_prenatal', 'valise_maternite', 'naissance', 'post_partum', 'retour_des_regles',
  'nouveau_ne', 'allaitement', 'sein_gauche', 'sein_droit', 'tire_lait', 'biberon', 'lait_maternel', 'reserve_lait', 'sommeil',
  'couche', 'croissance', 'repas', 'diversification', 'vaccination', 'premiers_pas', 'developpement', 'jumeaux', 'sevrage',
  'maman', 'papa', 'couple', 'famille', 'partage', 'calendrier_familial', 'taches', 'soutien', 'souvenirs', 'journal',
  'bien_etre', 'fatigue', 'humeur',
];
const PATH_CHARS = /^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]+$/;

describe('tracés', () => {
  it('chaque nom demandé a un tracé (47 symboles, 3 familles, sans doublon)', () => {
    for (const nm of REQUIRED) {
      expect(isMaternityIconName(nm)).toBe(true);
      expect(MATERNITY_ICONS[nm as keyof typeof MATERNITY_ICONS].length).toBeGreaterThan(0);
    }
    const grouped = Object.values(MATERNITY_ICON_GROUPS).flat();
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual([...REQUIRED].sort());
    expect([...MATERNITY_ICON_NAMES].sort()).toEqual([...REQUIRED].sort());
  });

  it('aucun tracé ne contient de texte : uniquement des commandes de chemin et des nombres', () => {
    for (const nm of MATERNITY_ICON_NAMES) {
      for (const s of MATERNITY_ICONS[nm]) {
        expect(s.d).toMatch(PATH_CHARS);
        expect(s.d).not.toMatch(/NaN|Infinity|undefined/);
        expect(s.d.trim()[0]).toMatch(/[Mm]/);
      }
    }
  });

  it('tous les points restent dans la grille 24 × 24 (rien n\'est coupé)', () => {
    for (const nm of MATERNITY_ICON_NAMES) {
      for (const s of MATERNITY_ICONS[nm]) {
        // seuls les tracés absolus sont utilisés : toutes les coordonnées sont des positions
        expect(s.d).not.toMatch(/[mlhvcsqtaz]/);
        const nums = (s.d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
        for (const v of nums) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(24); }
      }
    }
  });

  it('longueur de tracé correcte (cercle, segment) pour l\'animation du fil', () => {
    expect(pathLength(circle(12, 12, 5))).toBeCloseTo(2 * Math.PI * 5, 0);
    expect(pathLength('M2 2L2 12H12')).toBeCloseTo(20, 5);
    expect(pathLength('M2 2l0 10h10')).toBeCloseTo(20, 5);
    for (const nm of MATERNITY_ICON_NAMES) for (const s of MATERNITY_ICONS[nm]) expect(strokeLength(s.d)).toBeGreaterThan(1);
  });

  it('côtés des seins : chaque variante met en avant un seul côté (l\'autre est en retrait)', () => {
    const solidX = (nm: 'sein_gauche' | 'sein_droit') => MATERNITY_ICONS[nm].filter((s) => s.fill === 'solid').map((s) => Number(s.d.slice(1).split(' ')[0]));
    expect(solidX('sein_gauche').every((x) => x < 12)).toBe(true);
    expect(solidX('sein_droit').every((x) => x > 12)).toBe(true);
  });
});

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
  await act(async () => { await Promise.resolve(); });
  mounted.push(r);
  return r;
}
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.restoreAllMocks();
});
const paths = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.props.d === 'string' && typeof n.type !== 'string' && n.props.strokeLinecap === 'round' && !n.parent?.props?.d);
const view = (r: ReactTestRenderer, id: string) => r.root.findAll((n: ReactTestInstance) => n.props.testID === id && n.props.style)[0];

describe('composant MaternityIcon', () => {
  it('se rend pour chaque symbole, taille 24 par défaut, couleur du thème, trait 1,6 arrondi', async () => {
    const r = await render(<>{MATERNITY_ICON_NAMES.map((nm) => <MaternityIcon key={nm} name={nm} testID={`i-${nm}`} />)}</>);
    for (const nm of MATERNITY_ICON_NAMES) expect(view(r, `i-${nm}`)).toBeTruthy();
    const ps = paths(r);
    expect(ps.length).toBeGreaterThanOrEqual(MATERNITY_ICON_NAMES.length);
    for (const p of ps) {
      expect(p.props.strokeWidth).toBe(ICON_TOKENS.stroke);
      expect(p.props.strokeLinejoin).toBe('round');
      // le thème suit l'heure (jour / soir) : couleur principale du thème en cours
      expect(Object.values(themes).map((th) => th.colors.primary)).toContain(p.props.stroke);
    }
    const flat = (s: unknown) => Object.assign({}, ...([] as unknown[]).concat(s as never).flat(3).filter(Boolean));
    expect(flat(view(r, 'i-regles').props.style)).toMatchObject({ width: 24, height: 24 });
  });

  it('sans libellé : masquée aux lecteurs d\'écran ; avec libellé : image annoncée', async () => {
    const r = await render(<><MaternityIcon name="regles" testID="deco" /><MaternityIcon name="regles" label="Règles" testID="lab" /></>);
    const deco = view(r, 'deco');
    expect(deco.props.accessible).toBe(false);
    expect(deco.props.accessibilityElementsHidden).toBe(true);
    expect(deco.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(deco.props.accessibilityLabel).toBeUndefined();
    const lab = view(r, 'lab');
    expect(lab.props.accessible).toBe(true);
    expect(lab.props.accessibilityRole).toBe('image');
    expect(lab.props.accessibilityLabel).toBe('Règles');
  });

  it('état actif : trait renforcé, formes fermées teintées ; couleur et taille personnalisées', async () => {
    const r = await render(<MaternityIcon name="biberon" active color="#123456" size={40} testID="b" />);
    const ps = paths(r);
    expect(ps.every((p) => p.props.strokeWidth === ICON_TOKENS.activeStroke && p.props.stroke === '#123456')).toBe(true);
    expect(ps.some((p) => p.props.fill === '#123456' && p.props.fillOpacity === ICON_TOKENS.tintOpacity)).toBe(true);
  });

  it('animate : le fil se dessine (tirets animés) puis l\'état final est sans tiret', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.useFakeTimers();
    try {
      const r = await render(<MaternityIcon name="femme_enceinte" animate testID="a" />);
      const dashed = r.root.findAll((n) => typeof n.props.strokeDasharray === 'string');
      expect(dashed.length).toBeGreaterThan(0);
      await act(async () => { jest.advanceTimersByTime(ICON_TOKENS.drawMs + ICON_TOKENS.drawStaggerMs * 10 + 500); });
      expect(r.root.findAll((n) => typeof n.props.strokeDasharray === 'string').length).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('animate + « réduire les animations » : état final immédiat, aucun tiret, aucune animation lancée', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const timing = jest.spyOn(Animated, 'timing');
    const r = await render(<MaternityIcon name="cycle" animate label="Cycle" testID="rm" />);
    expect(r.root.findAll((n) => typeof n.props.strokeDasharray === 'string').length).toBe(0);
    expect(paths(r).length).toBe(MATERNITY_ICONS.cycle.length);
    // la première image peut avoir démarré avant la réponse du système ; après, plus aucune animation
    timing.mockClear();
    await act(async () => { await Promise.resolve(); });
    expect(timing).not.toHaveBeenCalled();
  });
});
