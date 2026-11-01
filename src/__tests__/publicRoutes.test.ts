import { isPublicRoute } from '@/lib/publicRoutes';

describe('garde de session : écrans publics', () => {
  it('accueil, connexion, mentions légales, urgences et invitation restent ouverts sans compte', () => {
    for (const p of ['/', '/welcome', '/intro', '/cinematic', '/auth/sign-in', '/auth/callback', '/legal/privacy', '/emergency', '/settings/family']) {
      expect(isPublicRoute(p)).toBe(true);
    }
  });
  it('les écrans de données exigent une session', () => {
    for (const p of ['/bottle/abc', '/settings', '/settings/home', '/cycle', '/onboarding', '/child/1', '/welcomeX', '/emergency-x']) {
      expect(isPublicRoute(p)).toBe(false);
    }
  });
});
