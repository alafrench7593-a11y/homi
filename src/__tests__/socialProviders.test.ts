import { enabledSocialProviders } from '@/lib/socialProviders';

describe('boutons de connexion Apple / Google', () => {
  it('sont masqués par défaut (fournisseur non activé côté serveur)', () => {
    expect(enabledSocialProviders({})).toEqual({ apple: false, google: false });
  });
  it("ne s'affichent que si la variable vaut 1 ou true", () => {
    expect(enabledSocialProviders({ EXPO_PUBLIC_AUTH_APPLE: '1' })).toEqual({ apple: true, google: false });
    expect(enabledSocialProviders({ EXPO_PUBLIC_AUTH_GOOGLE: 'true' })).toEqual({ apple: false, google: true });
    expect(enabledSocialProviders({ EXPO_PUBLIC_AUTH_APPLE: '0', EXPO_PUBLIC_AUTH_GOOGLE: 'oui' })).toEqual({ apple: false, google: false });
  });
});
