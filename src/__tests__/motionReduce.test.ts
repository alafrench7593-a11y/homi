/** « Réduire les animations » : les animations instantanées doivent rester composables (séquence/parallèle). */
import { Animated } from 'react-native';
import { springTo, timeTo } from '@/theme/motion';

describe('animations instantanées (réduire les animations)', () => {
  it('rappellent la fin avec { finished: true } et posent la valeur finale', () => {
    const v = new Animated.Value(0);
    const cb = jest.fn();
    timeTo(v, 1, 300, true).start(cb);
    expect(cb).toHaveBeenCalledWith({ finished: true });
    expect((v as unknown as { __getValue: () => number }).__getValue()).toBe(1);
    const cb2 = jest.fn();
    springTo(v, 0, 'pop', true).start(cb2);
    expect(cb2).toHaveBeenCalledWith({ finished: true });
  });
  it('fonctionnent dans une séquence sans erreur', () => {
    const v = new Animated.Value(0);
    const done = jest.fn();
    expect(() => Animated.sequence([timeTo(v, 1, 300, true), springTo(v, 2, 'pop', true)]).start(done)).not.toThrow();
    expect(done).toHaveBeenCalledWith({ finished: true });
  });
});
