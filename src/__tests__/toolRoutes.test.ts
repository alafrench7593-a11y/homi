/**
 * Liens des catalogues d'outils (hubs Santé / Bébé / Famille, accueil, « Tous mes outils », recherche) : chaque
 * `href` correspond à une route qui existe (src/lib/routes.generated.ts, généré par scripts/gen-routes.js).
 * Garde-fou v5 : /sleep, /child et /assistant n'ont PAS d'écran d'index (routes dynamiques) — un lien sans
 * paramètre vers ces sections ouvrirait « Page introuvable ». /guide en a un depuis le centre d'outils (17/11/2026) :
 * c'est la route de l'outil unique « Guides pratiques ».
 */
import { setLocale } from '@/i18n';
import { accountEntries, toolCatalog } from '@/lib/domain/toolCatalog';
import { TOOL_CATEGORIES, TOOLS, type ScopeCtx } from '@/lib/journeys/tools';
import { APP_ROUTES } from '@/lib/routes.generated';
import { HUB_KEYS, HUB_PINNED } from '@/features/hubs/hubMap';

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

  it('/sleep, /child : pas d’index (un lien sans paramètre serait cassé) ; /guide est l’index des guides ; /assistant = HOMI Aura', () => {
    for (const p of ['/sleep', '/child']) expect(routeExists(p)).toBe(false);
    expect(routeExists('/guide')).toBe(true);
    expect(routeExists('/assistant')).toBe(true); // HOMI Aura (20/11/2026), entrées /assistant?theme=<id>
  });

  it('centre d’outils : /tools et une route par catégorie (dont « Mon compte et réglages »)', () => {
    expect(routeExists('/tools')).toBe(true);
    for (const c of [...TOOL_CATEGORIES, 'account']) expect(routeExists(`/tools/${c}`)).toBe(true);
  });

  it.each(CTXS.map((c, i) => [`${c.scope}#${i}`, c]))('« %s » : chaque outil du catalogue ouvre une route existante', (_n, ctx) => {
    const entries = [...toolCatalog(ctx as ScopeCtx), ...accountEntries(ctx as ScopeCtx)];
    const bad = entries.filter((t) => !routeExists(t.href)).map((t) => `${t.key} → ${t.href}`);
    expect(bad).toEqual([]);
    // sous-accès (onglets, filtres, guides) : mêmes exigences
    const badSubs = entries.flatMap((t) => t.subs).filter((x) => !routeExists(x.href)).map((x) => `${x.id} → ${x.href}`);
    expect(badSubs).toEqual([]);
  });

  it('chaque outil du registre central, quel que soit le profil, a un lien valide (ou aucun lien)', () => {
    const bad: string[] = [];
    for (const def of TOOLS) for (const ctx of CTXS) {
      const href = def.href(ctx);
      if (href && !routeExists(href)) bad.push(`${def.id} → ${href}`);
      for (const sub of def.subs ?? []) {
        const h = sub.href(ctx);
        if (h && !routeExists(h)) bad.push(`${def.id}.${sub.id} → ${h}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('outils mis en avant dans les onglets : des outils du registre (leur route est vérifiée ci-dessus)', () => {
    for (const hub of HUB_KEYS) for (const id of HUB_PINNED[hub]) expect(TOOLS.some((d) => d.id === id)).toBe(true);
  });
});
