import { favoriteTools, groupByTheme, searchTools, THEMES, toggleFavorite, toolCatalog, toolId } from '@/lib/domain/toolCatalog';
import { SCOPES, type ScopeCtx } from '@/lib/journeys/tools';

const CTXS: ScopeCtx[] = [
  { scope: 'none' }, { scope: 'ttc' }, { scope: 'avoid' }, { scope: 'cycle' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1' }, { scope: 'baby', childId: 'c1' }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];

describe('catalogue des outils (depuis le registre central)', () => {
  it('donne un thème connu à chaque outil, sans doublon d’identifiant, avec un libellé traduit', () => {
    const keys = new Set(THEMES.map((x) => x.key));
    for (const ctx of CTXS) {
      const cat = toolCatalog(ctx);
      expect(new Set(cat.map((x) => x.id)).size).toBe(cat.length);
      for (const x of cat) { expect(keys.has(x.theme)).toBe(true); expect(x.label).not.toMatch(/^tool\./); expect(x.label.length).toBeGreaterThan(1); }
    }
  });
  it('les urgences sont présentes partout', () => {
    for (const ctx of CTXS) expect(toolCatalog(ctx).find((x) => x.href === '/emergency')?.urgent).toBe(true);
  });
  it('identifiant stable quel que soit l’enfant (favoris)', () => {
    expect(toolId('growth', '/child/abc/growth')).toBe(toolId('growth', '/child/xyz/growth'));
    expect(toolId('feeding', '/bottle/abc')).toBe(toolId('feeding', '/bottle/def'));
    expect(toolId('teeth', '/teeth?child=a')).toBe(toolId('teeth', '/teeth?child=b'));
  });
  it('regroupe dans l’ordre des thèmes et recherche sans tenir compte des accents', () => {
    const cat = toolCatalog({ scope: 'baby', childId: 'c1' });
    expect(groupByTheme(cat)[0].key).toBe('feeding');
    expect(searchTools(toolCatalog({ scope: 'pregnancy' }), 'evolution bebe').map((x) => x.label)).toContain('Évolution du bébé');
    expect(searchTools(cat, 'SOMMEIL').length).toBeGreaterThan(0);
    expect(searchTools(cat, 'zzzzz')).toEqual([]);
  });
  it('favoris : ordre conservé, identifiants obsolètes ignorés', () => {
    const cat = toolCatalog({ scope: 'baby', childId: 'c1' });
    const a = cat[3].id; const b = cat[0].id;
    let favs = toggleFavorite([], a); favs = toggleFavorite(favs, b); favs = toggleFavorite(favs, 'x:obsolete');
    expect(favoriteTools(cat, favs).map((x) => x.id)).toEqual([a, b]);
    expect(toggleFavorite(favs, a)).not.toContain(a);
  });
  it('toutes les portées sont couvertes', () => {
    expect(SCOPES.length).toBe(9);
  });
});
