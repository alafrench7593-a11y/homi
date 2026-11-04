/** Guides thématiques : chaque article cité existe (aucun lien mort), chaque guide a un libellé et un outil. */
import { GUIDES, guideSlugs } from '@/content/guides';
import { LIBRARY_ARTICLES } from '@/content/articles/library';
import { NEURO_LIBRARY } from '@/content/articles/rows';
import { GUIDE_ARTICLES } from '@/content/articles/guide';
import { TOOLS } from '@/lib/journeys/tools';
import { DICTIONARIES } from '@/i18n/dictionaries';

const fr = DICTIONARIES.fr;
const en = DICTIONARIES.en;

const ALL = new Set([...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES].map((a) => a.slug));

describe('guides thématiques', () => {
  it('tous les articles cités existent', () => {
    const missing = GUIDES.flatMap((g) => guideSlugs(g).filter((s) => !ALL.has(s)).map((s) => `${g.id}: ${s}`));
    expect(missing).toEqual([]);
  });
  it('aucun doublon dans un même guide', () => {
    const dups = GUIDES.flatMap((g) => { const all = g.sections.flatMap((s) => s.slugs); return all.filter((s, i) => all.indexOf(s) !== i).map((s) => `${g.id}: ${s}`); });
    expect(dups).toEqual([]);
  });
  it('chaque guide a ses libellés FR et EN et son outil', () => {
    const problems: string[] = [];
    for (const g of GUIDES) {
      for (const dict of [fr, en] as Record<string, string>[]) {
        if (!dict[`gd.${g.id}.title`]) problems.push(`gd.${g.id}.title`);
        if (!dict[`gd.${g.id}.intro`]) problems.push(`gd.${g.id}.intro`);
        for (const s of g.sections) if (!dict[`gd.${g.id}.${s.key}`]) problems.push(`gd.${g.id}.${s.key}`);
        for (const s of g.sections) if (s.tool && !dict[s.tool.label]) problems.push(s.tool.label);
      }
      if (!TOOLS.some((t) => t.href({ scope: 'child', childId: 'x' }) === `/guide/${g.id}` || t.href({ scope: 'none' }) === `/guide/${g.id}` || t.href({ scope: 'pregnancy' }) === `/guide/${g.id}` || t.href({ scope: 'ttc' }) === `/guide/${g.id}`)) problems.push(`outil manquant pour ${g.id}`);
    }
    expect([...new Set(problems)]).toEqual([]);
  });
});
