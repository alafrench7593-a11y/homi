/** D-14 (QA 02/11/2026) : « Retour » depuis un lien direct remonte à l'écran parent. */
const { execFileSync } = require('child_process') as { execFileSync(cmd: string, args: string[], o: object): unknown };
import { parentRoute } from '@/lib/parentRoute';

it('la liste des routes est à jour', () => {
  expect(() => execFileSync('node', ['scripts/gen-routes.js', '--check'], { stdio: 'pipe' })).not.toThrow();
});

it('remonte à l’écran parent existant', () => {
  expect(parentRoute('/child/abc/discoveries')).toBe('/child/abc');
  expect(parentRoute('/community/post/123')).toBe('/community');
  expect(parentRoute('/pregnancy/calendar')).toBe('/pregnancy');
  expect(parentRoute('/settings/language?x=1')).toBe('/settings');
  expect(parentRoute('/article/reflux')).toBe('/library');
  expect(parentRoute('/assistant/chat')).toBe('/ask');
  expect(parentRoute('/sleep/abc')).toBe('/baby');
  expect(parentRoute('/today')).toBe('/');
  expect(parentRoute('/')).toBe('/');
});

// Audit navigation 13/11/2026 (docs/audit/01_navigation.md, N-02 et N-03)
it('un segment fixe n’est jamais pris pour un identifiant d’enfant', () => {
  expect(parentRoute('/sleep/help/abc')).toBe('/baby');
  expect(parentRoute('/sleep/difficult/abc')).toBe('/baby');
  expect(parentRoute('/sleep/tonight')).toBe('/baby');
});
it('profil d’un enfant ouvert par lien direct : Retour vers l’onglet Bébé', () => {
  expect(parentRoute('/child/abc')).toBe('/baby');
  expect(parentRoute('/child/abc/vaccines')).toBe('/child/abc');
  expect(parentRoute('/bottle/abc')).toBe('/bottle');
  expect(parentRoute('/family/missions/m1')).toBe('/family/missions');
  expect(parentRoute('/fertility/test/ovulation')).toBe('/fertility');
});

// Audit 01 N-07 : « Fermer » des écrans plein écran du sommeil ouverts par lien direct → onglet Bébé, pas l'Accueil
jest.mock('expo-router', () => ({ router: { canGoBack: jest.fn(() => false), back: jest.fn(), replace: jest.fn() } }));
it('goUp : lien direct → écran parent ; avec historique → retour', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { router } = require('expo-router') as { router: { canGoBack: jest.Mock; back: jest.Mock; replace: jest.Mock } };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { goUp } = require('@/lib/links') as typeof import('@/lib/links');
  goUp('/sleep/tonight');
  goUp('/sleep/difficult/abc');
  expect(router.replace.mock.calls).toEqual([['/baby'], ['/baby']]);
  router.canGoBack.mockReturnValue(true);
  goUp('/sleep/tonight');
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledTimes(2);
});
