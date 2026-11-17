/**
 * HOMI — matrice des outils.
 * Garde-fou : aucune FONCTIONNALITÉ ne doit disparaître pendant la refonte. Référence d'origine : 148 entrées de
 * catalogue (une par `thème:adresse`, le même outil comptant plusieurs fois) et 17 thèmes non vides.
 * Depuis le centre d'outils (17/11/2026), un besoin = une entrée : 120 outils. Le garde-fou ne compte donc plus des
 * lignes, il vérifie que CHAQUE entrée de l'ancien catalogue (138 adresses relevées avant la fusion) mène toujours
 * à un outil ou à un sous-accès actuel, et que les 17 thèmes visuels restent utilisés.
 * Avec HOMI_MATRIX_OUT=<chemin.csv>, écrit aussi la matrice (outil × parcours) utilisée par MATRICE_OUTILS.csv.
 */
const fs = require('fs') as { writeFileSync(p: string, data: string): void };

import { setLocale } from '@/i18n';
import { categoryTitle, THEMES, toolCatalog } from '@/lib/domain/toolCatalog';
import { LEGACY_PATHS } from '@/lib/domain/toolLegacy';
import { allowedToolIds, canonicalToolId, REAL_TOOLS, TOOL_BY_ID, type ScopeCtx } from '@/lib/journeys/tools';

const CTXS: ScopeCtx[] = [
  { scope: 'avoid' }, { scope: 'ttc' }, { scope: 'cycle' }, { scope: 'none' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1', postpartum: true }, { scope: 'baby', childId: 'c1', postpartum: true }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];
const BASELINE_TOOLS = 120;
const BASELINE_THEMES = 17;
const BASELINE_LEGACY = 138;

const csvCell = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

describe('HOMI : matrice des outils', () => {
  beforeAll(() => setLocale('fr'));

  it(`conserve ${BASELINE_TOOLS} outils (un besoin = une entrée) et ${BASELINE_THEMES} thèmes non vides`, () => {
    const rows = new Map<string, { tool: ReturnType<typeof toolCatalog>[number]; scopes: Set<string> }>();
    for (const ctx of CTXS) {
      for (const tool of toolCatalog(ctx)) {
        const row = rows.get(tool.id) ?? { tool, scopes: new Set<string>() };
        row.scopes.add(ctx.scope);
        rows.set(tool.id, row);
      }
    }
    const themesUsed = new Set([...rows.values()].map((r) => r.tool.theme));
    expect(rows.size).toBe(BASELINE_TOOLS);
    expect(rows.size).toBe(REAL_TOOLS.length); // chaque outil du registre est atteignable par au moins un profil
    expect(themesUsed.size).toBeGreaterThanOrEqual(BASELINE_THEMES);

    const out = process.env.HOMI_MATRIX_OUT;
    if (!out) return;
    const themeTitle = new Map(THEMES.map((t) => [t.key, t.title]));
    const header = ['id', 'theme', 'theme_titre', 'outil_cle', 'libelle_fr', 'ecran', 'urgent', ...CTXS.map((c) => `parcours_${c.scope}`),
      'statut_source', 'statut_homi', 'risque', 'test_existant', 'preuve_reddit',
      'categorie', 'categorie_titre', 'description_fr', 'profils', 'premium', 'sous_acces', 'anciens_identifiants'];
    const lines = [...rows.entries()].map(([id, { tool: r, scopes }]) => {
      const def = TOOL_BY_ID[id];
      return [id, r.theme, themeTitle.get(r.theme) ?? '', r.key, r.label, r.href, r.urgent ? 'oui' : 'non',
        ...CTXS.map((c) => (scopes.has(c.scope) ? 'x' : '')), 'existant (catalogue premium-experience)', 'centre d’outils (17/11/2026)', '', '', '',
        r.category, categoryTitle(r.category), r.sub ?? '', r.profiles.join(' '), r.free ? 'gratuit' : 'Premium',
        (def.subs ?? []).map((s) => `${id}.${s.id}`).join(' '), [...(def.aliases ?? []), ...(def.subs ?? []).map((s) => s.legacy)].join(' '),
      ].map(String).map(csvCell).join(',');
    });
    fs.writeFileSync(out, [header.join(','), ...lines].join('\n') + '\n');
  });

  it(`aucune fonctionnalité perdue : les ${BASELINE_LEGACY} adresses de l’ancien catalogue mènent toujours quelque part`, () => {
    const paths = Object.entries(LEGACY_PATHS);
    expect(paths.length).toBe(BASELINE_LEGACY);
    const reachable = new Set(CTXS.flatMap((c) => allowedToolIds(c)));
    const lost = paths.filter(([, oldId]) => {
      const now = canonicalToolId(oldId);
      return !now || !reachable.has(now);
    }).map(([p, oldId]) => `${oldId} (${p})`);
    expect(lost).toEqual([]);
  });
});
