/** Étape 2 — rapports de plantage : rien sans accord, et jamais de donnée personnelle ou de santé. */
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), captureException: jest.fn() }));

import { scrubEvent, scrubText, setCrashReportingAllowed } from '@/lib/crashReporting';

describe('nettoyage des rapports', () => {
  it('identifiants, e-mails, paramètres d’URL et nombres longs retirés', () => {
    const s = scrubText('Erreur sur /child/55b64dbb-f64e-48fc-8d5f-aae8ca6b1578?tab=sante pour sarah@exemple.fr (210000 ml)')!;
    expect(s).not.toMatch(/55b64dbb|sarah@|tab=sante|210000/);
    expect(s).toContain(':id');
  });

  it('sans accord, aucun événement ne part', () => {
    setCrashReportingAllowed(true); // pas de DSN en test : reste refusé
    expect(scrubEvent({ message: 'x' } as never)).toBeNull();
  });
});
