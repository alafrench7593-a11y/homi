import { markToolOpen, normalizePath, takeToolOrigin } from '@/lib/toolOrigin';

describe('continuité carte → outil', () => {
  it('normalise les adresses comme expo-router', () => {
    expect(normalizePath('/(tabs)/track')).toBe('/track');
    expect(normalizePath('/teeth?child=a')).toBe('/teeth');
    expect(normalizePath('/family/')).toBe('/family');
  });
  it('n’est repris qu’une fois, par le bon écran, peu après le toucher', () => {
    markToolOpen({ href: '/family/nights', theme: 'relay', icon: 'moon' });
    expect(takeToolOrigin('/calendar')).toBeNull();
    expect(takeToolOrigin('/family/nights')?.theme).toBe('relay');
    expect(takeToolOrigin('/family/nights')).toBeNull();
    markToolOpen({ href: '/journal', theme: 'memories', icon: 'book' });
    expect(takeToolOrigin('/journal', Date.now() + 5000)).toBeNull();
  });
});
