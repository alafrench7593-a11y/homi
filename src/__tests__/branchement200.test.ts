/**
 * Branchement au catalogue des numéros complétés le 30/11/2026 (lots A, B et C de la liste des 200) :
 * visibles sur leur route exacte, pictogramme du manifeste, accès Premium (nounou exclue sauf écrans de garde déjà
 * ouverts), recherche (« aide », « assistant », « IA » → HOMI Aura et Découvrir HOMI), recommandations (Animaux
 * seulement avec un animal enregistré), en-tête et lectures des quatre vues de l'enfant.
 */
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { setLocale } from '@/i18n';
import { toolIconName } from '@/brand/icons/resolve';
import { VIEW_ICON } from '@/brand/icons';
import { toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import { searchCatalog } from '@/lib/domain/toolSearch';
import { toolForPath } from '@/lib/domain/toolForPath';
import { TOOL_TOPICS, toolTopic } from '@/lib/domain/toolArticles';
import { H200_BY_N } from '@/lib/journeys/homi200';
import { SCOPES, type ScopeCtx } from '@/lib/journeys/tools';
import { gateFor } from '@/lib/premium/access';
import type { AccessInfo } from '@/lib/premium/offers';
import { buildFacts, reasonText, recommend, toolMeta } from '@/lib/personalization';

const LOT_A = [27, 129, 132, 136, 137, 175, 177, 199];
const LOT_B = [42, 50, 51, 53, 57, 72, 75, 80, 81, 83, 84, 120, 123];
const LOT_C = [29, 49, 64, 82, 110, 124, 140, 174, 190, 197, 200];
const ALL = [...LOT_A, ...LOT_B, ...LOT_C];

const nanny = { caregiver: true, strict: true, ai: false, tools: [] } as unknown as AccessInfo;
const aiOnly = { caregiver: false, strict: true, ai: true, tools: [] } as unknown as AccessInfo;

function fullCatalog(): CatalogTool[] {
  const out: CatalogTool[] = [];
  for (const scope of SCOPES) {
    const ctx: ScopeCtx = { scope, childId: scope === 'baby' || scope === 'child' ? 'c1' : null, pregnancyId: 'p1', babyId: 'c1', postpartum: true };
    for (const t of toolCatalog(ctx)) {
      const prev = out.find((x) => x.id === t.id);
      if (!prev) { out.push({ ...t, fns: [...(t.fns ?? [])] }); continue; }
      for (const f of t.fns ?? []) if (!prev.fns!.some((x) => x.id === f.id)) prev.fns!.push(f);
    }
  }
  return out;
}
const hrefOf = (n: number) => fullCatalog().flatMap((t) => t.fns ?? []).find((f) => f.id === `h200_${n}`)?.href ?? '';

describe('numéros complétés : branchés au catalogue', () => {
  beforeAll(() => setLocale('fr'));

  it('disponibles, vue nommée, pictogramme propre', () => {
    for (const n of ALL) {
      const e = H200_BY_N[n];
      expect([n, e.kind, e.isAvailable]).toEqual([n, 'view', true]);
      expect([n, !!hrefOf(n)]).toEqual([n, true]);
      expect([n, toolIconName(e.id)]).not.toEqual([n, null]);
    }
    for (const n of [...LOT_A, ...LOT_B].filter((x) => x !== 57)) expect([n, VIEW_ICON[`h200_${n}`]]).not.toEqual([n, undefined]);
  });

  it('HOMI Aura : route /assistant?theme=…, IA centrale sauf 174 et 200 (repli local)', () => {
    const THEMES: Record<number, string> = { 29: 'fertility', 49: 'pregnancy', 64: 'postpartum', 82: 'breastfeeding', 110: 'baby_health', 124: 'diversification', 140: 'education', 174: 'emotion_translator', 190: 'household', 197: 'personal', 200: 'discovery' };
    for (const n of LOT_C) {
      expect([n, hrefOf(n)]).toEqual([n, `/assistant?theme=${THEMES[n]}`]);
      expect([n, H200_BY_N[n].ai]).toEqual([n, n === 174 || n === 200 ? 'optional' : 'central']);
      expect([n, toolMeta(`h200_${n}`)?.aiMode]).toEqual([n, H200_BY_N[n].ai]);
    }
  });

  it('accès : Premium ; nounou exclue (sauf écrans de garde déjà ouverts : biberons, relais de nuit, découvertes)', () => {
    const NANNY_OPEN = new Set([75, 80, 83, 84, 120, 123]);
    for (const n of ALL) {
      const path = hrefOf(n);
      if (n === 51) { expect(gateFor(path, false)).toBe('open'); continue; } // personnes de confiance : jamais derrière un abonnement
      expect([n, gateFor(path, false)]).toEqual([n, 'locked']);
      expect([n, gateFor(path, true)]).toEqual([n, 'open']);
      expect([n, gateFor(path, false, nanny)]).toEqual([n, NANNY_OPEN.has(n) ? 'open' : 'locked']);
    }
    for (const n of LOT_C) expect([n, gateFor(hrefOf(n), false, aiOnly)]).toEqual([n, 'open']);
    for (const p of ['/child/c1/language', '/child/c1/games', '/child/c1/activities', '/child/c1/homework', '/family/understand', '/documents/labs']) {
      expect([p, gateFor(p, false, nanny)]).toEqual([p, 'locked']);
    }
  });

  it('recherche : « aide », « assistant », « IA », « je ne sais pas par où commencer » → HOMI Aura et Découvrir HOMI', () => {
    const cat = fullCatalog();
    for (const q of ['aide', 'assistant', 'IA', 'l’IA', 'je ne sais pas par où commencer']) {
      const top = searchCatalog(cat, q).results.slice(0, 2).map((r) => r.tool.id).sort();
      expect([q, top]).toEqual([q, ['h200_197', 'h200_200']]);
    }
    // « aide » dans une phrase garde son sens (l'outil du besoin, pas l'assistante)
    expect(searchCatalog(cat, 'aide pour endormir bébé').results[0]?.tool.id).not.toBe('h200_197');
    for (const [q, id] of [['journal du langage', 'h200_129'], ['jeux éducatifs', 'h200_132'], ['activités extrascolaires', 'h200_136'], ['devoirs', 'h200_137'],
      ['baromètre du couple', 'h200_177'], ['analyses de sang', 'h200_42'], ['allaitement mixte', 'h200_75'], ['consultante en lactation', 'h200_81'],
      ['refus alimentaire', 'h200_123'], ['DME', 'h200_120'], ['export du journal alimentaire', 'h200_84'], ['souvenirs de grossesse', 'h200_50']] as const) {
      expect([q, searchCatalog(cat, q).results.slice(0, 3).map((r) => r.tool.id)]).toEqual([q, expect.arrayContaining([id])]);
    }
    setLocale('en' as never);
    expect(searchCatalog(fullCatalog(), 'help').results.slice(0, 2).map((r) => r.tool.id).sort()).toEqual(['h200_197', 'h200_200']);
    expect(searchCatalog(fullCatalog(), 'homework').results.slice(0, 3).map((r) => r.tool.id)).toContain('h200_137');
    for (const [lang, q, id] of [['de', 'Sprachtagebuch', 'h200_129'], ['es', 'Lactancia mixta', 'h200_75'], ['it', 'Compiti', 'h200_137']] as const) {
      setLocale(lang as never);
      expect([lang, searchCatalog(fullCatalog(), q).results.slice(0, 3).map((r) => r.tool.id)]).toEqual([lang, expect.arrayContaining([id])]);
    }
    setLocale('fr');
  });

  it('Animaux : recommandé seulement quand le foyer a un animal enregistré', () => {
    const input = { now: new Date(2026, 10, 20), role: 'owner' as const, answers: { v: 3, profile: [], household: 'partner', invite: false, feeding: null, priorities: [] } };
    expect(recommend(buildFacts(input), {}, { max: 40 }).map((r) => r.id)).not.toContain('h200_189');
    const withPet = recommend(buildFacts({ ...input, pets: 1 }), {}, { max: 40 });
    const pet = withPet.find((r) => r.id === 'h200_189');
    expect(pet).toBeDefined();
    expect(reasonText(pet!.reason)).toBe('Parce qu’un animal vit dans ton foyer');
  });

  it('vues de l’enfant : leur pictogramme dans l’en-tête et leurs propres lectures', () => {
    for (const [path, n] of [['/child/abc/language', 129], ['/child/abc/games', 132], ['/child/abc/activities', 136], ['/child/abc/homework', 137]] as const) {
      expect([path, toolForPath(path)?.id]).toEqual([path, `h200_${n}`]);
      expect(toolIconName(`h200_${n}`)).toBe(VIEW_ICON[`h200_${n}`]);
      expect(toolTopic(`h200_${n}`)).not.toBe(toolTopic('kid_profile'));
    }
    expect(toolTopic('h200_136')).toBe(TOOL_TOPICS.guide_sport);
    expect(toolTopic('h200_137')).toBe(TOOL_TOPICS.child_homework);
    expect(toolForPath('/child/abc')?.id).toBe('kid_profile');
  });
});
