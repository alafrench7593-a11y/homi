/**
 * HOMI — matrice des outils hérités d'Au fil de nous.
 * Garde-fou : aucun outil ne doit disparaître pendant la refonte (référence : 148 outils, 17 thèmes non vides).
 * Avec HOMI_MATRIX_OUT=<chemin.csv>, écrit aussi la matrice (outil × parcours) utilisée par MATRICE_OUTILS.csv.
 */
const fs = require('fs') as { writeFileSync(p: string, data: string): void };

import { setLocale } from '@/i18n';
import { THEMES, toolCatalog } from '@/lib/domain/toolCatalog';
import type { ScopeCtx } from '@/lib/journeys/tools';

const CTXS: ScopeCtx[] = [
  { scope: 'avoid' }, { scope: 'ttc' }, { scope: 'cycle' }, { scope: 'none' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1' }, { scope: 'baby', childId: 'c1' }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];
const BASELINE_TOOLS = 148;
const BASELINE_THEMES = 17;

const csvCell = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

describe('HOMI : matrice des outils hérités', () => {
  beforeAll(() => setLocale('fr'));

  it(`conserve au moins ${BASELINE_TOOLS} outils et ${BASELINE_THEMES} thèmes non vides`, () => {
    const rows = new Map<string, { theme: string; key: string; label: string; href: string; urgent: boolean; scopes: Set<string> }>();
    for (const ctx of CTXS) {
      for (const tool of toolCatalog(ctx)) {
        const row = rows.get(tool.id) ?? { theme: tool.theme, key: tool.key, label: tool.label, href: tool.href, urgent: !!tool.urgent, scopes: new Set<string>() };
        row.scopes.add(ctx.scope);
        rows.set(tool.id, row);
      }
    }
    const themesUsed = new Set([...rows.values()].map((r) => r.theme));
    expect(rows.size).toBeGreaterThanOrEqual(BASELINE_TOOLS);
    expect(themesUsed.size).toBeGreaterThanOrEqual(BASELINE_THEMES);

    const out = process.env.HOMI_MATRIX_OUT;
    if (!out) return;
    const themeTitle = new Map(THEMES.map((t) => [t.key, t.title]));
    const header = ['id', 'theme', 'theme_titre', 'outil_cle', 'libelle_fr', 'ecran', 'urgent', ...CTXS.map((c) => `parcours_${c.scope}`),
      'statut_source', 'statut_homi', 'risque', 'test_existant', 'preuve_reddit'];
    const lines = [...rows.entries()].map(([id, r]) => [id, r.theme, themeTitle.get(r.theme as never) ?? '', r.key, r.label, r.href, r.urgent ? 'oui' : 'non',
      ...CTXS.map((c) => (r.scopes.has(c.scope) ? 'x' : '')), 'existant (catalogue premium-experience)', 'à refondre (UI HOMI)', '', '', ''].map(String).map(csvCell).join(','));
    fs.writeFileSync(out, [header.join(','), ...lines].join('\n') + '\n');
  });
});
