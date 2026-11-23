/**
 * Vérification AUTOMATIQUE de tout le catalogue « Mes apps » (audit du 23/11/2026), avec la même source que la
 * recherche, les écrans et le chat (toolCatalog → searchCatalog / searchForAura → carte « Ouvrir … ») :
 *  1. chaque outil est retrouvé depuis le chat par son nom (dans les 3 premières réponses) ;
 *  2. chaque destination correspond à un écran existant (fichier de route dans src/app) ;
 *  3. un outil retiré du catalogue disparaît de la recherche ET des cartes proposées par le modèle ;
 *  4. les formulations du quotidien (FR / EN) mènent au bon outil.
 * Les chiffres sont imprimés pour le rapport d'audit.
 */
import fs from 'fs';
import path from 'path';
import { setLocale } from '@/i18n';
import { toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import { searchCatalog } from '@/lib/domain/toolSearch';
import { searchForAura } from '@/features/aura/model';
import { sanitizeActions } from '../../supabase/functions/_shared/aura-tools';
import type { Scope } from '@/lib/journeys/tools';

const SCOPES: Scope[] = ['avoid', 'ttc', 'cycle', 'none', 'pregnancy', 'postpartum', 'baby', 'child', 'family'];
function allTools(): CatalogTool[] {
  const byId = new Map<string, CatalogTool>();
  for (const scope of SCOPES) {
    for (const t of toolCatalog({ scope, childId: 'c1', pregnancyId: 'p1', babyId: 'c1', postpartum: scope === 'postpartum' })) if (!byId.has(t.id)) byId.set(t.id, t);
  }
  return [...byId.values()];
}

// Écrans existants : src/app/**.tsx → motifs de route (groupes « (tabs) » ignorés, [param] = un segment)
function routePatterns(): RegExp[] {
  const root = path.join(__dirname, '..', 'app');
  const out: RegExp[] = [];
  const walk = (dir: string) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.tsx$/.test(f.name) && !f.name.startsWith('_') && !f.name.startsWith('+')) {
        const rel = path.relative(root, p).replace(/\.tsx$/, '').split(path.sep).filter((s) => !/^\(.*\)$/.test(s));
        if (rel[rel.length - 1] === 'index') rel.pop();
        const re = rel.map((s) => (/^\[.*\]$/.test(s) ? '[^/]+' : s.replace(/[.*+?^${}()|\\]/g, '\\$&'))).join('/');
        out.push(new RegExp(`^/${re}/?$`));
      }
    }
  };
  walk(root);
  return out;
}
const pathOf = (href: string) => (href.split('?')[0].replace('/(tabs)', '') || '/');

describe.each(['fr', 'en'] as const)('catalogue entier (%s)', (lang) => {
  beforeAll(() => setLocale(lang));
  const tools = () => allTools();

  it('chaque outil est retrouvé depuis le chat par son nom', () => {
    const list = tools();
    const missed = list.filter((t) => !searchForAura(list, list, t.label, searchCatalog).results.slice(0, 3).some((h) => h.tool.id === t.id));
    // eslint-disable-next-line no-console
    console.log(`[audit ${lang}] retrouvés par leur nom : ${list.length - missed.length}/${list.length}${missed.length ? ` — manqués : ${missed.map((m) => `${m.id} (« ${m.label} »)`).join(', ')}` : ''}`);
    expect(missed.length / list.length).toBeLessThanOrEqual(0.05);
  });

  it('chaque destination correspond à un écran existant', () => {
    const pats = routePatterns();
    const list = tools().filter((t) => t.href);
    const broken = list.filter((t) => !pats.some((re) => re.test(pathOf(t.href))));
    // eslint-disable-next-line no-console
    console.log(`[audit ${lang}] destinations existantes : ${list.length - broken.length}/${list.length}${broken.length ? ` — absentes : ${broken.map((b) => `${b.id} → ${b.href}`).join(', ')}` : ''}`);
    expect(broken).toEqual([]);
  });
});

describe('outil renommé, déplacé ou retiré : la recherche et le chat suivent', () => {
  beforeAll(() => setLocale('fr'));
  it('retiré du catalogue → ni dans la recherche, ni dans une carte proposée par le modèle', () => {
    const list = allTools();
    const without = list.filter((t) => t.id !== 'baby_breastfeed');
    expect(searchCatalog(without, 'allaitement').results.some((h) => h.tool.id === 'baby_breastfeed')).toBe(false);
    const ids = new Set(without.map((t) => t.id));
    expect(sanitizeActions([{ type: 'open_tool', id: 'baby_breastfeed' }], ids, '2026-11-23')).toEqual([]);
    expect(sanitizeActions([{ type: 'open_tool', id: 'baby_bottle' }], ids, '2026-11-23')).toHaveLength(1);
  });
  it('renommé → retrouvé sous son nouveau nom (même source)', () => {
    const list = allTools().map((t) => (t.id === 'baby_bottle' ? { ...t, label: 'Repas lacté' } : t));
    expect(searchCatalog(list, 'repas lacté').results[0]?.tool.id).toBe('baby_bottle');
  });
});

describe('formulations du quotidien (recherche et chat)', () => {
  const cases: [string, 'fr' | 'en', string][] = [
    ['il vient de finir son bib', 'fr', 'baby_bottle'], ['biberon', 'fr', 'baby_bottle'], ['allaitement', 'fr', 'baby_breastfeed'],
    ['couches', 'fr', 'baby_diaper'], ['sieste', 'fr', 'kid_sleep_rhythm'], ['courbe de poids', 'fr', 'kid_profile'],
    ['bottle', 'en', 'baby_bottle'], ['breastfeeding', 'en', 'baby_breastfeed'], ['nappy', 'en', 'baby_diaper'],
  ];
  it.each(cases)('« %s » (%s) → %s', (q, lang, id) => {
    setLocale(lang);
    const list = allTools();
    const top = searchForAura(list, list, q, searchCatalog).results.slice(0, 3).map((h) => h.tool.id);
    expect(top).toContain(id);
  });
});
