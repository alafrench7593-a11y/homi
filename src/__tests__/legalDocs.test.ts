import { ACCOUNT_DELETION, LEGAL_NOTICE, PRIVACY, SUPPORT, TERMS } from '@/content/legal';
import { BRAND } from '@/config/brand';
import { setLocale } from '@/i18n';

describe('documents juridiques', () => {
  it('éditeur et contact renseignés, plus aucun texte « à compléter »', () => {
    for (const lang of ['fr', 'en', 'es', 'de', 'it'] as const) {
      setLocale(lang);
      const all = [TERMS, PRIVACY, LEGAL_NOTICE, ACCOUNT_DELETION, SUPPORT].flatMap((d) => d.sections.map((s) => s.body)).join(' ');
      expect(all).toContain('David PRINCIVIL');
      expect(all).toContain(BRAND.supportEmail);
      expect(all).not.toMatch(/à compléter|to be completed|por completar|noch zu ergänzen|da completare|à préciser par l’éditeur|à confirmer|to be confirmed|por confirmar|zu bestätigen|da confermare/);
      expect(LEGAL_NOTICE.sections.length).toBe(6);
      expect(ACCOUNT_DELETION.sections.length).toBe(4);
      expect(SUPPORT.sections.length).toBe(4);
    }
    setLocale('fr');
  });
  it('contact public dédié à l’app', () => {
    // HOMI : jamais le contact d'Au fil de nous ; adresse définitive à fournir avant publication (RELEASE_READINESS.md)
    expect(BRAND.supportEmail).not.toBe('aufildenous@outlook.fr');
    expect(BRAND.supportEmail).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });
});
