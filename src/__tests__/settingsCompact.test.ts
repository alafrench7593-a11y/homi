/**
 * Réglages compacts (examen App Store) : la page tient sur un écran, l'aide et les textes légaux sont à part,
 * aucun outil ni texte de développement n'est visible en démonstration.
 */
import { DICTIONARIES } from '@/i18n/dictionaries';
import { isFreeRoute } from '@/lib/premium/access';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: string): string };

const index = fs.readFileSync('src/app/settings/index.tsx', 'utf8');
const help = fs.readFileSync('src/app/settings/help.tsx', 'utf8');

describe('Réglages compacts', () => {
  it('la suppression du compte reste en tête, l’aide et les textes légaux passent sur une page à part', () => {
    expect(index.indexOf('settings-delete-account')).toBeLessThan(index.indexOf("SectionTitle title={tr('settings.profile')}"));
    expect(index).toMatch(/\/settings\/help/);
    for (const id of ['settings-terms', 'settings-privacy-policy', 'settings-legal-notice', 'settings-tour', 'settings-discover']) {
      expect(index).not.toContain(id);
      expect(help).toContain(id);
    }
  });

  it('galeries de contrôle : mode développeur seulement, jamais en démonstration', () => {
    expect(index).not.toMatch(/devMode \|\| isDemo/);
    expect(index).toMatch(/devMode \? \([\s\S]*settings-glass-gallery/);
  });

  it('bandeau de démonstration sans jargon technique, dans les 5 langues', () => {
    for (const [lang, dict] of Object.entries(DICTIONARIES)) {
      const body = String(dict['u7.family.demoBody']);
      expect([lang, /Supabase|README|push/i.test(body)]).toEqual([lang, false]);
      expect(dict['settings.helpInfo']).toBeTruthy();
      expect(dict['settings.legal']).toBeTruthy();
    }
  });
});

describe('Aide et informations sans abonnement', () => {
  it('la page d’aide (textes légaux, contact) ne passe jamais par le paywall', () => {
    expect(isFreeRoute('/settings/help')).toBe(true);
    expect(isFreeRoute('/settings')).toBe(true);
  });
});
