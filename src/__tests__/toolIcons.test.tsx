/**
 * Pictogrammes d'OUTILS (famille HomiIcon, src/brand/icons/tools/*, manifeste src/brand/icons/manifest.ts) :
 *  - chaque entrée visible du catalogue (outils, Communauté, « Mon compte », sous-accès, fonctions de la liste des
 *    200) a un pictogramme existant ; les clés du manifeste sont exactement celles du registre ;
 *  - aucun pictogramme d'outil orphelin ;
 *  - deux outils différents montrés dans une même catégorie n'ont jamais le même pictogramme (sauf partage voulu) ;
 *    deux outils du registre n'en partagent jamais un ;
 *  - grille 24, trait seulement, aucune couleur dans les tracés ;
 *  - `ToolGlyph` rend le pictogramme (décoratif), et l'ancien glyphe pour une entrée inconnue, sans planter.
 */
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { HomiIcon, HOMI_ICONS, INTENTIONAL_SHARES, QUICK_ICON, SUB_ICON, TOOL_ICON, TOOL_ICON_FAMILIES, VIEW_ICON, type HomiIconName } from '@/brand/icons';
import { ToolLogo, toolLogoDef } from '@/brand/toolLogo';
import { toolIconCategory, toolIconName } from '@/brand/icons/resolve';
import { ToolGlyph } from '@/components/ToolGlyph';
import { H200_VIEWS } from '@/lib/journeys/homi200';
import { CHILD_QUICK, quickFor, REAL_TOOLS, SCOPES, subRef, TOOL_CATEGORIES, TOOL_FNS, TOOLS, type ToolShelf } from '@/lib/journeys/tools';
import { ThemeProvider } from '@/theme/ThemeProvider';

const SUB_IDS = TOOLS.flatMap((d) => (d.subs ?? []).map((s) => subRef(d.id, s.id)));
const VIEW_IDS = H200_VIEWS.map((e) => e.id);

describe('manifeste des pictogrammes d’outils', () => {
  it('chaque entrée visible a un pictogramme qui existe', () => {
    const missing = [...TOOLS.map((d) => d.id), ...SUB_IDS, ...VIEW_IDS].filter((id) => {
      const name = toolIconName(id);
      return !name || !(name in HOMI_ICONS);
    });
    expect(missing).toEqual([]);
    // anciens identifiants (outils fusionnés, anciens outils devenus sous-accès) : même pictogramme que leur cible
    expect(toolIconName('pp_feeding')).toBe(TOOL_ICON.baby_breastfeed);
    expect(toolIconName('kid_growth')).toBe(SUB_ICON['kid_profile.growth']);
    expect(toolIconName('h200_1')).toBe(TOOL_ICON.cycle_calendar);
  });

  it('clés du manifeste = registre (aucune clé en trop ou en moins)', () => {
    expect(Object.keys(TOOL_ICON).sort()).toEqual(TOOLS.map((d) => d.id).sort());
    expect(Object.keys(SUB_ICON).sort()).toEqual([...SUB_IDS].sort());
    for (const k of Object.keys(VIEW_ICON)) expect(VIEW_IDS).toContain(k);
    const quick = new Set([...SCOPES.flatMap((s) => quickFor({ scope: s })), ...CHILD_QUICK]);
    for (const k of quick) expect(QUICK_ICON[k]).toBeDefined();
    for (const name of [...Object.values(TOOL_ICON), ...Object.values(SUB_ICON), ...Object.values(VIEW_ICON), ...Object.values(QUICK_ICON)]) expect(HOMI_ICONS).toHaveProperty(name);
  });

  it('aucun pictogramme d’outil orphelin', () => {
    const used = new Set<string>([...Object.values(TOOL_ICON), ...Object.values(SUB_ICON), ...Object.values(VIEW_ICON), ...Object.values(QUICK_ICON), 'gear']);
    const orphans = Object.values(TOOL_ICON_FAMILIES).flatMap((f) => Object.keys(f)).filter((n) => !used.has(n));
    expect(orphans).toEqual([]);
  });

  it('deux outils du registre ne partagent jamais un pictogramme', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const d of REAL_TOOLS) {
      const name = TOOL_ICON[d.id];
      if (seen.has(name)) dup.push(`${seen.get(name)} = ${d.id} (${name})`);
      seen.set(name, d.id);
    }
    expect(dup).toEqual([]);
  });

  it('dans chaque catégorie, deux outils différents se distinguent (partages voulus seulement)', () => {
    const conflicts: string[] = [];
    for (const cat of TOOL_CATEGORIES) {
      // entrées montrées dans la catégorie : [outil parent, pictogramme, identifiant]
      const shown: [string, HomiIconName, string][] = [];
      for (const d of TOOLS) {
        if (d.category === cat || (d.also ?? []).includes(cat as ToolShelf)) shown.push([d.id, TOOL_ICON[d.id], d.id]);
        for (const s of d.subs ?? []) if ((s.category ?? d.category) === cat) shown.push([d.id, toolIconName(subRef(d.id, s.id))!, subRef(d.id, s.id)]);
        for (const s of TOOL_FNS[d.id] ?? []) if ((s.category ?? d.category) === cat) shown.push([d.id, toolIconName(s.id)!, s.id]);
      }
      const owner = new Map<string, [string, string]>();
      for (const [parent, name, id] of shown) {
        const prev = owner.get(name);
        if (prev && prev[0] !== parent && !(name in INTENTIONAL_SHARES)) conflicts.push(`${cat} : ${prev[1]} et ${id} → ${name}`);
        if (!prev) owner.set(name, [parent, id]);
      }
    }
    expect(conflicts).toEqual([]);
  });

  it('couleur : la catégorie où l’entrée est rangée', () => {
    expect(toolIconCategory('baby_bottle')).toBe('feeding');
    expect(toolIconCategory('guides.kidsleep')).toBe('sleep');
    expect(toolIconCategory('h200_41')).toBe('pregnancy');
    expect(toolIconCategory('community')).toBeNull();
    expect(toolIconName('cat.account')).toBe('gear');
    expect(toolIconName('quick.bottle')).toBe(TOOL_ICON.baby_bottle);
  });

  it('pictogrammes d’outils : grille 24, encre au trait, aucune couleur écrite', () => {
    for (const fam of Object.values(TOOL_ICON_FAMILIES)) {
      for (const [name, d] of Object.entries(fam) as [string, { stroke: string; fill?: string; dots?: number[][] }][]) {
        expect([name, d.stroke.startsWith('M')]).toEqual([name, true]);
        expect(`${d.stroke}${d.fill ?? ''}`).not.toMatch(/#|rgb/);
        const nums = `${d.stroke} ${d.fill ?? ''}`.match(/-?\d*\.?\d+/g)!.map(Number);
        expect([name, Math.max(...nums) <= 24]).toEqual([name, true]);
        for (const [x, y, r] of d.dots ?? []) expect([name, x >= 0 && x <= 24 && y >= 0 && y <= 24 && r >= 0.75]).toEqual([name, true]);
      }
    }
  });
});

describe('ToolGlyph', () => {
  const mounted: ReactTestRenderer[] = [];
  afterAll(() => mounted.forEach((r) => act(() => r.unmount())));
  async function render(el: React.ReactElement) {
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<ThemeProvider>{el}</ThemeProvider>); });
    mounted.push(r);
    return r;
  }

  it('rend le LOGO de l’outil (pictogramme HOMI du manifeste sur sa plaque), masqué aux lecteurs d’écran', async () => {
    const r = await render(<ToolGlyph id="baby_bottle" theme="feeding" icon="coffee" size={44} />);
    // direction « verre minéral » (20/11/2026) : ToolGlyph rend ToolLogo, qui dessine le pictogramme du manifeste
    expect(r.root.findAllByType(HomiIcon)).toHaveLength(0);
    const logos = r.root.findAllByType(ToolLogo);
    expect(logos).toHaveLength(1);
    expect(logos[0]!.props.id).toBe('baby_bottle');
    expect(toolLogoDef('baby_bottle')?.icon).toBe('bottlePlus');
    const box = r.root.findAll((n) => n.props.testID === 'tool-icon-baby_bottle')[0]!;
    expect(box.props.accessibilityElementsHidden).toBe(true);
    expect(box.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('repli sur l’ancien glyphe pour une entrée sans pictogramme (aucun plantage)', async () => {
    const r = await render(<ToolGlyph id="outil_inconnu" theme="resources" icon="grid" size={44} />);
    expect(r.root.findAllByType(HomiIcon)).toHaveLength(0);
    const r2 = await render(<ToolGlyph theme="feeding" icon="coffee" size={44} />);
    expect(r2.root.findAllByType(HomiIcon)).toHaveLength(0);
  });
});
