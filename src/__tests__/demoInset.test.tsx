/**
 * Place réservée à la pastille « Démonstration » : nulle hors démo (aucune régression des en-têtes),
 * positive en démo avec une session ouverte, et suffisante pour que la pastille ne recouvre pas la première ligne.
 */
let mockDemo = false;
let mockSession: { userId: string } | null = { userId: 'u1' };
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) }));
jest.mock('@/lib/demoMode', () => ({ useBackendMode: () => ({ isDemo: mockDemo, canLeave: mockDemo }) }));
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: mockSession, ready: true }) }));

import React from 'react';
import { act, create } from 'react-test-renderer';
import { DEMO_INSET, DEMO_PILL_HEIGHT, DEMO_PILL_TOP, useDemoInset, useTopInset } from '@/components/demoInset';

function probe() {
  const out = { demo: -1, top: -1 };
  function Probe() {
    out.demo = useDemoInset();
    out.top = useTopInset();
    return null;
  }
  act(() => { create(<Probe />); });
  return out;
}

describe('useDemoInset', () => {
  afterEach(() => { mockDemo = false; mockSession = { userId: 'u1' }; });

  it('vaut 0 hors démonstration : le haut reste la zone sûre', () => {
    mockDemo = false;
    expect(probe()).toEqual({ demo: 0, top: 47 });
  });

  it('vaut 0 en démonstration sans session (la pastille n’est pas affichée)', () => {
    mockDemo = true;
    mockSession = null;
    expect(probe()).toEqual({ demo: 0, top: 47 });
  });

  it('réserve la hauteur de la pastille en démonstration', () => {
    mockDemo = true;
    const r = probe();
    expect(r.demo).toBe(DEMO_INSET);
    expect(r.demo).toBeGreaterThan(0);
    expect(r.top).toBe(47 + DEMO_INSET);
    // le bas de la pastille reste au-dessus de la place réservée
    expect(DEMO_INSET).toBeGreaterThanOrEqual(DEMO_PILL_TOP + DEMO_PILL_HEIGHT);
  });
});
