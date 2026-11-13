/**
 * Audit navigation (13/11/2026, docs/audit/01_navigation.md, N-10) : démonstration reprise à l'ouverture, lien direct
 * ouvert à froid (/household, /settings…) → renvoi vers /welcome. L'écoute de session était branchée sur le VRAI
 * backend avant la reprise de la démonstration ; il annonçait aussitôt « aucune session » (ready sans session) et
 * SessionGuard redirigeait. L'état « prêt sans session » ne doit jamais apparaître quand la démonstration reprend.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/lib/notifications', () => ({ cancelAllLocal: jest.fn(async () => undefined) }));
jest.mock('@/lib/offline', () => ({ setQueueOwner: jest.fn(async () => undefined) }));

const mockDemoSession = { userId: 'demo-user', email: null, providers: [] };
jest.mock('@/lib/backend', () => {
  const listeners = new Set<any>()  // eslint-disable-line @typescript-eslint/no-explicit-any;
  const state = { demo: false };
  const auth = {
    // Vrai backend (Supabase) : annonce immédiatement « aucune session » à l'abonnement ; démonstration : rien
    onChange: (cb: any) =>  // eslint-disable-line @typescript-eslint/no-explicit-any
      { if (!state.demo) cb(null); return () => undefined; },
    getSession: async () => (state.demo ? mockDemoSession : null),
  };
  return {
    backend: { auth, rpc: async () => null, from: () => ({}) },
    onBackendSwitch: (l: any) =>  // eslint-disable-line @typescript-eslint/no-explicit-any
      { listeners.add(l); return () => listeners.delete(l); },
    initBackendMode: async () => {
      await new Promise((done) => setTimeout(done, 20));
      if (!state.demo) { state.demo = true; listeners.forEach((l: any) => l('resume')); }
    },
  };
});

import React from 'react';
import { act, create } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth';

it('reprise de la démonstration : jamais « prête sans session » (pas de renvoi vers /welcome)', async () => {
  const seen: { ready: boolean; session: unknown }[] = [];
  function Probe() { const a = useAuth(); seen.push({ ready: a.ready, session: a.session }); return null; }
  const qc = new QueryClient();
  let r!: ReturnType<typeof create>;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>); });
  await act(async () => { await new Promise((res) => setTimeout(res, 200)); });
  expect(seen.some((x) => x.ready && !x.session)).toBe(false);
  expect(seen[seen.length - 1]).toEqual({ ready: true, session: mockDemoSession });
  await act(async () => { r.unmount(); });
});
