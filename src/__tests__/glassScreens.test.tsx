/**
 * Verre branché sur les vrais écrans (18/11/2026) : décalage bas des écrans d'onglet sous la barre flottante,
 * largeur des onglets dans la capsule, changement de profil coordonné (aucun état mélangé), « problème résolu » de la
 * fiche d'outil tiré de l'index de recherche, entrée d'écran sans opacité sur un ancêtre.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import { GLASS_TAB_BAR } from '@/components/glass';
import { DOCK_HEIGHT, dockInner, TAB_SCREEN_INSET } from '@/components/Dock';
import { changeProfile, PROFILE_SWAP, resetProfileTransition } from '@/components/profileTransition';
import { TAB_PATHS } from '@/components/Screen';
import { dockLayout, estimateLabelWidth } from '@/features/hubs/hubMap';
import { toolNeeds } from '@/features/toolHub/ToolSheet';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import { setLocale } from '@/i18n';
import { spacing } from '@/theme/tokens';

const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string };

describe('barre flottante : le dernier élément d’une page reste au-dessus d’elle', () => {
  it('la réserve des écrans d’onglet couvre la capsule, avec ou sans zone sûre', () => {
    const capsule = GLASS_TAB_BAR.height + GLASS_TAB_BAR.inset * 2;
    for (const safe of [0, 20, 34]) {
      // haut de la capsule mesuré depuis le bas de l'écran
      const barTop = capsule + Math.max(safe, GLASS_TAB_BAR.floatGap);
      // marge basse du contenu d'un `Screen` d'onglet (zone sûre + xxl + réserve)
      const contentBottom = safe + spacing.xxl + TAB_SCREEN_INSET;
      expect(contentBottom).toBeGreaterThanOrEqual(barTop + spacing.md);
    }
    expect(TAB_SCREEN_INSET).toBeGreaterThan(DOCK_HEIGHT);
  });

  it('les écrans d’onglet réservent tous TAB_SCREEN_INSET (aucun ancien décalage codé en dur)', () => {
    for (const f of ['src/app/(tabs)/index.tsx', 'src/app/(tabs)/tools.tsx', 'src/features/hubs/HubScreen.tsx', 'src/app/(tabs)/baby.tsx', 'src/app/(tabs)/moi.tsx', 'src/app/(tabs)/track.tsx', 'src/app/(tabs)/profile.tsx']) {
      expect(fs.readFileSync(f, 'utf8')).toMatch(/bottomInset=\{TAB_SCREEN_INSET\}/);
    }
    for (const f of ['src/app/(tabs)/community.tsx', 'src/app/(tabs)/ask.tsx']) expect(fs.readFileSync(f, 'utf8')).toMatch(/TAB_SCREEN_INSET/);
  });

  it('à 320 pt (barre pleine largeur) comme à 390 pt (capsule flottante), les 4 libellés français tiennent en entier', () => {
    setLocale('fr');
    for (const w of [320, 390]) {
      const { inner, floating } = dockInner(w);
      expect(floating).toBe(w >= 360);
      const layout = dockLayout(inner, ['Aujourd’hui', 'Moi', 'Enfant', 'Famille'].map((l) => estimateLabelWidth(l)));
      expect(layout.iconsOnly).toBe(false);
      expect(layout.widths.every((x) => x >= 44)).toBe(true);
    }
  });
});

describe('changement de profil coordonné', () => {
  beforeEach(() => { jest.useFakeTimers(); resetProfileTransition(); });
  afterEach(() => { jest.useRealTimers(); });

  it('« Réduire les animations » : bascule immédiate', () => {
    const commit = jest.fn();
    changeProfile('child:1', 1, 'off', commit);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('animé : le magasin ne change qu’après la sortie (on voit l’ancien profil, jamais un mélange) ; un nouveau choix remplace le précédent', () => {
    const a = jest.fn();
    const b = jest.fn();
    changeProfile('child:1', 1, 'full', a);
    expect(a).not.toHaveBeenCalled();
    jest.advanceTimersByTime(PROFILE_SWAP.outMs - 10);
    changeProfile('pregnancy', -1, 'full', b);
    jest.advanceTimersByTime(PROFILE_SWAP.outMs + 20);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe('fiche d’outil', () => {
  it('« Problème résolu » : tournures de besoin de l’index de recherche (3 mots ou plus), dans la langue active', () => {
    setLocale('fr');
    const tools = toolCatalog({ scope: 'baby', child: null, childId: null, postpartum: false, loaded: true } as never);
    const bottle = tools.find((x) => x.id === 'baby_bottle');
    if (!bottle) return;
    const needs = toolNeeds(bottle);
    expect(needs.length).toBeGreaterThan(0);
    for (const n of needs) expect(n.split(/\s+/).length).toBeGreaterThanOrEqual(3);
  });

  it('« Commencer » est placé avant les détails secondaires (visible sans défiler à 320 × 568)', () => {
    const src = fs.readFileSync('src/features/toolHub/ToolSheet.tsx', 'utf8');
    expect(src.indexOf('tool-sheet-start')).toBeLessThan(src.indexOf("tr('th.sheet.who')"));
    expect(src).toMatch(/<GlassSheet /);
  });
});

describe('verre : jamais d’opacité animée sur un ancêtre', () => {
  it('l’entrée d’écran estompe un voile frère, pas la racine', () => {
    const screen = fs.readFileSync('src/components/Screen.tsx', 'utf8');
    expect(screen).toMatch(/screen-entrance-cover/);
    expect(screen).not.toMatch(/style=\{\[\{ flex: 1, backgroundColor: 'transparent' \}, entrance\]\}/);
    expect(TAB_PATHS.has('/')).toBe(true);
  });

  it('le glissement entre profils ne pose plus d’opacité sur le contenu', () => {
    const src = fs.readFileSync('src/components/ProfileSwitcher.tsx', 'utf8');
    expect(src).not.toMatch(/opacity: fade\.value/);
  });
});
