import { lockedTools, toolCatalog } from '@/lib/domain/toolCatalog';

describe('outils hors profil : grisés et déblocables', () => {
  it('foyer « famille » seul : les outils de grossesse et de bébé sont proposés verrouillés, avec leur parcours', () => {
    const reachable = new Set(toolCatalog({ scope: 'family' }).map((t) => t.id));
    const locked = lockedTools(reachable);
    expect(locked.length).toBeGreaterThan(10);
    for (const l of locked) {
      expect(reachable.has(l.tool.id)).toBe(false);
      expect(l.scopes.length).toBeGreaterThan(0);
      expect(['community', 'account']).not.toContain(l.tool.category);
    }
    expect(new Set(locked.map((l) => l.tool.id)).size).toBe(locked.length);
    expect(locked.some((l) => l.scopes.includes('pregnancy'))).toBe(true);
  });
  it('tout est atteignable : rien de verrouillé', () => {
    const all = new Set(lockedTools(new Set()).map((l) => l.tool.id));
    expect(lockedTools(all)).toEqual([]);
  });
});
