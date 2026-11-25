import { usageBreakdown, usageLevel, usagePercent } from '@/lib/credits/model';

const s = (allowance: number, remaining: number, purchased = 0) => ({ monthly_allowance: allowance, monthly_remaining: remaining, purchased_remaining: purchased });

describe('Utilisation Aura (pourcentage du serveur, seuils 75/90/100)', () => {
  it('pourcentage utilisé', () => {
    expect(usagePercent(s(1000, 1000))).toBe(0);
    expect(usagePercent(s(1000, 520))).toBe(48);
    expect(usagePercent(s(1000, 0))).toBe(100);
    expect(usagePercent(s(1000, 1200))).toBe(0); // jamais négatif
    expect(usagePercent(s(0, 0))).toBeNull(); // pas d'abonnement : rien d'inventé
    expect(usagePercent(null)).toBeNull();
  });
  it('seuils', () => {
    expect(usageLevel(s(1000, 300))).toBe('ok');
    expect(usageLevel(s(1000, 250))).toBe('high');
    expect(usageLevel(s(1000, 100))).toBe('almost');
    expect(usageLevel(s(1000, 0))).toBe('full');
    expect(usageLevel(s(1000, 0, 50))).toBe('almost'); // crédits achetés encore disponibles
  });
  it('répartition par catégorie, période en cours seulement, remboursements déduits', () => {
    const rows = [
      { kind: 'debit' as const, action: 'assistant_question', amount: -1, created_at: '2026-11-20T10:00:00Z' },
      { kind: 'debit' as const, action: 'assistant_question', amount: -1, created_at: '2026-11-21T10:00:00Z' },
      { kind: 'debit' as const, action: 'document_read', amount: -5, created_at: '2026-11-21T11:00:00Z' },
      { kind: 'refund' as const, action: 'document_read', amount: 5, created_at: '2026-11-21T11:01:00Z' },
      { kind: 'debit' as const, action: 'tool_analysis', amount: -3, created_at: '2026-11-22T11:00:00Z' },
      { kind: 'debit' as const, action: 'tool_analysis', amount: -3, created_at: '2026-10-01T11:00:00Z' }, // période précédente
      { kind: 'purchase' as const, action: null, amount: 300, created_at: '2026-11-22T12:00:00Z' },
    ];
    expect(usageBreakdown(rows, '2026-11-15T00:00:00Z')).toEqual([{ group: 'analysis', used: 3 }, { group: 'assist', used: 2 }]);
  });
});
