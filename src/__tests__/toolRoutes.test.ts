/**
 * Liens des catalogues d'outils (hubs Santé / Bébé / Famille, accueil, « Tous mes outils », recherche) : chaque
 * `href` correspond à une route qui existe (src/lib/routes.generated.ts, généré par scripts/gen-routes.js).
 * Garde-fou v5 : /sleep, /child, /guide et /assistant n'ont PAS d'écran d'index (routes dynamiques) — un lien sans
 * paramètre vers ces sections ouvrirait « Page introuvable ».
 */
import { setLocale } from '@/i18n';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import { TOOLS, type ScopeCtx } from '@/lib/journeys/tools';
import { APP_ROUTES } from '@/lib/routes.generated';
import { HUB_ENTRIES, HUB_KEYS } from '@/features/hubs/hubMap';

const CTXS: ScopeCtx[] = [
  { scope: 'avoid' }, { scope: 'ttc' }, { scope: 'cycle' }, { scope: 'none' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1', postpartum: true }, { scope: 'postpartum', postpartum: true }, { scope: 'baby', childId: 'c1', postpartum: true },
  { scope: 'baby', childId: 'c1' }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];

/** Chemin d'un lien (sans requête, sans ancre, sans groupe de routes « (tabs) »). */
function pathOf(href: string) {
  const p = href.split(/[?#]/)[0].replace(/\/\([^)]+\)/g, '').replace(/\/+$/, '');
  return p || '/';
}
const PATTERNS = APP_ROUTES.map((r) => new RegExp(`^${r.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+')}$`));
const routeExists = (href: string) => PATTERNS.some((re) => re.test(pathOf(href)));

describe('liens des outils → routes existantes', () => {
  beforeAll(() => setLocale('fr'));

  it('le comparateur reconnaît routes statiques, dynamiques, groupes et requêtes', () => {
    expect(routeExists('/(tabs)/ask')).toBe(true);
    expect(routeExists('/child/c1/growth')).toBe(true);
    expect(routeExists('/teeth?child=c1')).toBe(true);
    expect(routeExists('/cette-page-nexiste-pas')).toBe(false);
  });

  it('/sleep, /child, /guide, /assistant : pas d’index (un lien sans paramètre serait cassé)', () => {
    for (const p of ['/sleep', '/child', '/guide', '/assistant']) expect(routeExists(p)).toBe(false);
  });

  it.each(CTXS.map((c, i) => [`${c.scope}#${i}`, c]))('« %s » : chaque outil du catalogue ouvre une route existante', (_n, ctx) => {
    const bad = toolCatalog(ctx as ScopeCtx).filter((t) => !routeExists(t.href)).map((t) => `${t.key} → ${t.href}`);
    expect(bad).toEqual([]);
  });

  it('chaque outil du registre central, quel que soit le profil, a un lien valide (ou aucun lien)', () => {
    const bad: string[] = [];
    for (const def of TOOLS) for (const ctx of CTXS) {
      const href = def.href(ctx);
      if (href && !routeExists(href)) bad.push(`${def.id} → ${href}`);
    }
    expect(bad).toEqual([]);
  });

  it('accès directs des hubs : routes existantes', () => {
    for (const hub of HUB_KEYS) for (const e of HUB_ENTRIES[hub]) expect(routeExists(e.href)).toBe(true);
  });
});
