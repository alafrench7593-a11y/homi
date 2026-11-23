/**
 * Révocation côté appareil (14/11/2026) : quand l'appareil constate qu'il n'appartient plus à un foyer (retrait par la
 * propriétaire, départ volontaire), le cache React Query de ce foyer et ses saisies en attente sont effacés ;
 * rien d'un autre foyer n'est touché, et la persistance du cache (AsyncStorage) ne le garde plus.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: () => () => undefined, fetch: async () => ({ isConnected: true }) }));

import { QueryClient } from '@tanstack/react-query';
import { dehydrate } from '@tanstack/react-query';
import { lostHouseholds, purgeHouseholdCache, queryTouchesHousehold } from '@/lib/householdPurge';
import { purgeQueueForHousehold, useOfflineStore } from '@/lib/offline';

const H1 = 'h-retire';
const H2 = 'h-garde';
const ME = 'u-moi';

function seed() {
  const qc = new QueryClient();
  qc.setQueryData([ME, 'family_tasks', H1], [{ id: 't1', household_id: H1, title: 'Acheter des couches' }]);
  qc.setQueryData([ME, 'members', H1], [{ household_id: H1, user_id: ME }]);
  qc.setQueryData([ME, 'household', H1], [{ id: H1, name: 'Foyer quitté' }]);
  // Clé sans identifiant de foyer (par enfant) : reconnue par ses lignes
  qc.setQueryData([ME, 'bottles', 'enfant-1', '7'], [{ id: 'b1', household_id: H1, child_id: 'enfant-1' }]);
  qc.setQueryData([ME, 'child', 'enfant-1'], { id: 'enfant-1', household_id: H1, first_name: 'Lou' });
  // Autre foyer et données personnelles : intacts
  qc.setQueryData([ME, 'family_tasks', H2], [{ id: 't2', household_id: H2, title: 'Sortir le chien' }]);
  qc.setQueryData([ME, 'memberships'], [{ household_id: H2, user_id: ME }]);
  qc.setQueryData([ME, 'profile'], [{ id: ME, display_name: 'Camille' }]);
  return qc;
}

describe('purge du cache local après un retrait ou un départ', () => {
  it('foyers perdus : connus de l’appareil mais absents de la liste fraîche', () => {
    expect(lostHouseholds([H1, H2], [H2])).toEqual([H1]);
    expect(lostHouseholds([H1, H1, ''], [])).toEqual([H1]);
    expect(lostHouseholds([], [H2])).toEqual([]);
    expect(lostHouseholds([H2], [H2, H1])).toEqual([]);
  });

  it('efface toutes les requêtes du foyer quitté (clé ou lignes), garde le reste', () => {
    const qc = seed();
    const before = qc.getQueryCache().getAll().length;
    const n = purgeHouseholdCache(qc, H1);
    expect(n).toBe(5);
    expect(qc.getQueryCache().getAll().length).toBe(before - 5);
    expect(qc.getQueryData([ME, 'family_tasks', H1])).toBeUndefined();
    expect(qc.getQueryData([ME, 'bottles', 'enfant-1', '7'])).toBeUndefined();
    expect(qc.getQueryData([ME, 'child', 'enfant-1'])).toBeUndefined();
    expect(qc.getQueryData([ME, 'family_tasks', H2])).toEqual([{ id: 't2', household_id: H2, title: 'Sortir le chien' }]);
    expect(qc.getQueryData([ME, 'profile'])).toBeTruthy();
    // Ce qui sera réécrit sur le téléphone (persistance) ne contient plus rien du foyer quitté
    expect(JSON.stringify(dehydrate(qc))).not.toContain(H1);
  });

  it('une requête est rattachée au foyer par sa clé ou ses lignes, jamais par hasard', () => {
    const q = (queryKey: unknown[], data: unknown) => ({ queryKey, state: { data } }) as never;
    expect(queryTouchesHousehold(q([ME, 'x', H1], []), H1)).toBe(true);
    expect(queryTouchesHousehold(q([ME, 'x'], [{ household_id: H1 }]), H1)).toBe(true);
    expect(queryTouchesHousehold(q([ME, 'x'], { household_id: H1 }), H1)).toBe(true);
    expect(queryTouchesHousehold(q([ME, 'x'], [{ household_id: H2 }, { title: H1 }]), H1)).toBe(false);
    expect(queryTouchesHousehold(q([ME, `${H1}-suffixe`], null), H1)).toBe(false);
  });

  it('retire de la file hors ligne les saisies et refus de ce foyer seulement', async () => {
    useOfflineStore.setState({
      pending: [
        { id: 'p1', table: 'family_tasks', row: { client_id: 'p1', household_id: H1, title: 'x' }, queuedAt: '2026-11-14T08:00:00Z', owner: ME },
        { id: 'p2', table: 'diapers', row: { client_id: 'p2', household_id: H2 }, queuedAt: '2026-11-14T08:00:00Z', owner: ME },
      ],
      conflicts: [{ id: 'c1', table: 'shopping_items', row: { client_id: 'c1', household_id: H1 }, queuedAt: '2026-11-14T08:00:00Z', owner: ME, error: 'refus' }],
    });
    expect(await purgeQueueForHousehold(H1)).toBe(2);
    expect(useOfflineStore.getState().pending.map((o) => o.id)).toEqual(['p2']);
    expect(useOfflineStore.getState().conflicts).toEqual([]);
    expect(await purgeQueueForHousehold(H1)).toBe(0);
  });
});
