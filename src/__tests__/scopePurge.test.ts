/** Accès retiré : les données de l'enfant (ou de la grossesse) quittent le cache de l'appareil (audit du 23/11/2026). */
import { QueryClient } from '@tanstack/react-query';
import { purgeForScope } from '@/lib/scopePurge';

function seeded() {
  const qc = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  qc.setQueryData(['children', 'h1'], [{ id: 'K1', first_name: 'Lina' }, { id: 'K2', first_name: 'Noé' }]);
  qc.setQueryData(['bottles', 'K1', '7'], [{ id: 'b1' }]);
  qc.setQueryData(['bottles', 'K2', '7'], [{ id: 'b2' }]);
  qc.setQueryData(['sleeps', 'K2', 'relay'], [{ id: 's2' }]);
  qc.setQueryData(['pregnancies', 'h1'], [{ id: 'p1' }]);
  return qc;
}

describe('purge du cache quand un accès est retiré', () => {
  it('périmètre réduit à K1 : tout ce qui porte K2 est supprimé, K1 reste', () => {
    const qc = seeded();
    expect(purgeForScope(qc, { child_scope: ['K1'], pregnancy_access: true })).toBe(2);
    expect(qc.getQueryData(['bottles', 'K2', '7'])).toBeUndefined();
    expect(qc.getQueryData(['sleeps', 'K2', 'relay'])).toBeUndefined();
    expect(qc.getQueryData(['bottles', 'K1', '7'])).toEqual([{ id: 'b1' }]);
    expect(qc.getQueryData(['pregnancies', 'h1'])).toEqual([{ id: 'p1' }]);
  });
  it('accès à la grossesse retiré : données de grossesse supprimées ; périmètre complet (null) : rien d’autre', () => {
    const qc = seeded();
    purgeForScope(qc, { child_scope: null, pregnancy_access: false });
    expect(qc.getQueryData(['pregnancies', 'h1'])).toBeUndefined();
    expect(qc.getQueryData(['bottles', 'K2', '7'])).toEqual([{ id: 'b2' }]);
  });
});
