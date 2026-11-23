/** Retour après connexion (site web) : chemins internes seulement, jamais un écran public, expiration. */
import { clearReturnTo, peekReturnTo, rememberReturnTo, safeReturnPath } from '@/lib/returnTo';

describe('safeReturnPath', () => {
  it.each([['/settings/appearance', '/settings/appearance'], ['/child/abc?tab=croissance', '/child/abc?tab=croissance']])('accepte %s', (p, e) => {
    expect(safeReturnPath(p)).toBe(e);
  });
  it.each(['//evil.test/x', 'https://evil.test', '/\\evil', '/welcome', '/auth/sign-in', '/app', '/', '/demo', '/start/offers', 'relative'])('refuse %s', (p) => {
    expect(safeReturnPath(p)).toBeNull();
  });
});

describe('mémoire de la destination', () => {
  afterEach(clearReturnTo);
  it('lue tant qu’elle est valable, puis effacée', () => {
    rememberReturnTo('/settings', 1_000);
    expect(peekReturnTo(1_000 + 60_000)).toBe('/settings');
    clearReturnTo();
    expect(peekReturnTo(2_000)).toBeNull();
  });
  it('expire après 30 minutes', () => {
    rememberReturnTo('/settings', 0);
    expect(peekReturnTo(31 * 60_000)).toBeNull();
  });
});
