/**
 * Audit navigation (13/11/2026, docs/audit/01_navigation.md, N-04) : grossesse affichée, l'onglet Bébé ne montrait ni
 * le Sommeil, ni les Repas, ni l'Humeur de l'enfant suivi, ni les Classements des recettes (outils « pour tout le
 * monde » écartés des « autres profils » alors que le profil affiché ne les avait pas). Garde-fou : tout outil d'un
 * profil suivi est soit dans le profil affiché, soit dans « Outils des autres profils ».
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { pickOtherTools } from '@/lib/data/hooks-alltools';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import type { ScopeCtx } from '@/lib/journeys/tools';

const base = { pregnancyId: 'p1', babyId: 'b1', postpartum: false };
const shownCtx: ScopeCtx = { ...base, scope: 'pregnancy' };
const others: ScopeCtx[] = [{ ...base, scope: 'baby', childId: 'b1' }, { ...base, scope: 'child', childId: 'c2' }, { ...base, scope: 'none' }, { ...base, scope: 'family' }];

function reachable() {
  const shown = toolCatalog(shownCtx);
  const already = new Set(shown.map((x) => x.id));
  const out = new Set(shown.map((x) => x.key));
  for (const ctx of others) for (const x of pickOtherTools(toolCatalog(ctx), shown, already)) { already.add(x.id); out.add(x.key); }
  return out;
}

it('grossesse affichée : les outils « pour tout le monde » de l’enfant restent proposés', () => {
  const keys = reachable();
  for (const k of ['kid_sleep', 'kid_mood', 'meals', 'meal_rankings']) expect(keys).toContain(k);
});

it('aucun outil d’un profil suivi n’est introuvable dans les onglets (hors urgences, toujours en tête)', () => {
  const keys = reachable();
  for (const ctx of others) for (const x of toolCatalog(ctx)) if (!x.urgent) expect([x.key, keys.has(x.key)]).toEqual([x.key, true]);
});

it('un outil « pour tout le monde » déjà adapté au profil affiché n’est pas proposé deux fois', () => {
  const shown = toolCatalog(shownCtx);
  const picked = pickOtherTools(toolCatalog(others[0]), shown, new Set(shown.map((x) => x.id)));
  for (const k of ['appointments', 'documents', 'scan_product', 'library']) expect(picked.map((x) => x.key)).not.toContain(k);
});
