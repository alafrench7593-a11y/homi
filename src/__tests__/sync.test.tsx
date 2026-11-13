jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => ({ __esModule: true, default: { addEventListener: () => () => undefined, fetch: async () => ({ isConnected: true }) } }));
// Relais de données remplacé : on pilote l'état de l'abonnement temps réel (« en direct » / coupé)
const rt: { status?: (s: 'live' | 'offline') => void } = {};
jest.mock('@/lib/backend', () => ({
  backend: { subscribeChanges: (_s: unknown, _c: unknown, onStatus: (s: 'live' | 'offline') => void) => { rt.status = onStatus; return () => undefined; } },
}));
import React from 'react';
import { act, create } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { batcher, changeSpecs, HOUSEHOLD_TABLES, reconnectWatcher, useRealtimeSync } from '@/lib/sync';

describe('synchronisation temps réel', () => {
  it('filtre chaque table par foyer, et les notifications par personne', () => {
    const s = changeSpecs('h1', 'u1');
    expect(s.find((x) => x.table === 'bottles')?.filter).toBe('household_id=eq.h1');
    expect(s.find((x) => x.table === 'notifications')?.filter).toBe('user_id=eq.u1');
    expect(s).toHaveLength(HOUSEHOLD_TABLES.length + 1);
    // jamais de données privées post-partum ni d'humeur dans le flux du foyer
    expect(s.map((x) => x.table).some((t) => /postpartum|mood/.test(t))).toBe(false);
  });
  it('regroupe une rafale de changements en une seule relecture', () => {
    jest.useFakeTimers();
    const flush = jest.fn();
    const b = batcher(flush, 400);
    for (let i = 0; i < 7; i++) b.push('care_shifts');
    b.push('notifications');
    jest.advanceTimersByTime(399);
    expect(flush).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush.mock.calls[0][0].sort()).toEqual(['care_shifts', 'notifications']);
    jest.useRealTimers();
  });
  // Audit 7 (18/11/2026) : après une coupure du temps réel, les changements manqués étaient perdus jusqu'au
  // prochain retour au premier plan ; désormais tout ce que couvre l'abonnement est relu à la reprise.
  it('relit tout au retour du temps réel après une coupure, jamais au premier abonnement', () => {
    const resume = jest.fn();
    const w = reconnectWatcher(resume);
    w('offline');            // connexion en cours (avant le premier « en direct »)
    w('live');
    expect(resume).not.toHaveBeenCalled();
    w('live');               // même état répété : rien
    expect(resume).not.toHaveBeenCalled();
    w('offline');            // coupure
    w('offline');
    w('live');               // reprise → une relecture
    expect(resume).toHaveBeenCalledTimes(1);
    w('live');
    expect(resume).toHaveBeenCalledTimes(1);
    w('offline'); w('live');
    expect(resume).toHaveBeenCalledTimes(2);
  });
  it('useRealtimeSync : la reprise après coupure relit les tâches et les notifications du foyer', () => {
    jest.useFakeTimers();
    const status = (s: 'live' | 'offline') => rt.status?.(s);
    const qc = new QueryClient();
    const spy = jest.spyOn(qc, 'invalidateQueries').mockResolvedValue(undefined);
    function Probe() { useRealtimeSync('h1', 'u1'); return null; }
    act(() => { create(<QueryClientProvider client={qc}><Probe /></QueryClientProvider>); });
    act(() => { status('live'); jest.advanceTimersByTime(500); });
    expect(spy).not.toHaveBeenCalled();
    act(() => { status('offline'); status('live'); jest.advanceTimersByTime(500); });
    expect(spy).toHaveBeenCalledTimes(1);
    const pred = (spy.mock.calls[0][0] as unknown as { predicate: (q: { queryKey: unknown[] }) => boolean }).predicate;
    expect(pred({ queryKey: ['family_tasks', 'h1'] })).toBe(true);
    expect(pred({ queryKey: ['notifications'] })).toBe(true);
    expect(pred({ queryKey: ['profiles'] })).toBe(false);
    jest.useRealTimers();
  });
});
