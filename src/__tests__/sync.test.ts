jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => ({ __esModule: true, default: { addEventListener: () => () => undefined, fetch: async () => ({ isConnected: true }) } }));
import { batcher, changeSpecs, HOUSEHOLD_TABLES } from '@/lib/sync';

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
});
