// Aura : recherche d'outils (fonction `search_tools`) et validation des propositions (brief du 21/11/2026).
import { sanitizeActions, sanitizeCatalog, searchAuraCatalog, toAction } from './aura-tools.ts';
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
const TODAY = '2026-11-21';
const CATALOG = sanitizeCatalog([
  { id: 'baby_breastfeed', name: 'Allaitement', blurb: 'Chronomètre de tétée, sein gauche ou droit.', words: 'allaitement; tétée; tétées; sein; seins; allaiter; téter', route: '/feeding/breast' },
  { id: 'baby_bottle', name: 'Noter un biberon', blurb: 'Enregistre un biberon en un geste.', words: 'biberon; lait; quantité bue', route: '/bottle' },
  { id: 'kid_sleep', name: 'Sommeil de l’enfant', blurb: 'Note les siestes, les nuits et les réveils.', words: 'sommeil; dormir; dodo; sieste; nuit', route: '/night' },
]);

Deno.test('« Mon bébé prend le sein » → Allaitement', () => {
  assertEquals(searchAuraCatalog(CATALOG, 'Mon bébé prend le sein')[0]?.id, 'baby_breastfeed');
});

Deno.test('« Où noter sa sieste ? » → outil sommeil (plus de mots couverts que « Noter un biberon »)', () => {
  assertEquals(searchAuraCatalog(CATALOG, 'Où noter sa sieste ?')[0]?.id, 'kid_sleep');
});

Deno.test('outil inventé ou route externe : aucune proposition, aucun lien', () => {
  assertEquals(toAction('propose_open_tool', { tool_id: 'outil_invente' }, CATALOG, TODAY), null);
  assertEquals(sanitizeCatalog([{ id: 'evil', name: 'x', route: 'https://evil.test' }]), []);
  const kept = sanitizeActions([{ type: 'open_tool', id: 'outil_invente' }, { type: 'open_tool', id: 'baby_breastfeed', label: 'Allaitement' }, { type: 'delete_all' }], new Set(CATALOG.map((c) => c.id)), TODAY);
  assertEquals(kept.map((a) => a.type), ['open_tool']);
});
