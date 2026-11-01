import { PRIVACY } from '@/content/legal';
import { PRIVACY_POLICY, PRIVACY_POLICY_VERSION } from '@/content/privacy-policy';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string; existsSync(p: string): boolean };

describe('politique de confidentialité', () => {
  it('une seule source de texte (inscription et Réglages)', () => {
    // Même contenu que la politique de l'inscription, dans la langue en cours (lecture à chaque accès)
    expect([...PRIVACY_POLICY]).toEqual(PRIVACY.sections);
    expect(PRIVACY_POLICY[0]).toBe(PRIVACY.sections[0]);
    // même version que celle enregistrée à l'inscription (LEGAL_VERSIONS.privacy)
    const authFlow = fs.readFileSync('src/lib/authFlow.ts', 'utf8');
    expect(authFlow).toContain(`privacy: '${PRIVACY_POLICY_VERSION}'`);
  });
  it('nomme les services externes réellement utilisés', () => {
    const txt = PRIVACY.sections.map((s) => s.body).join(' ');
    for (const service of ['Google Gemini', 'Supabase', 'RevenueCat', 'OpenStreetMap', 'Wikimedia', 'Open Food Facts']) expect(txt).toContain(service);
    expect(txt).toMatch(/document/);
    expect(txt).toMatch(/communauté/);
  });
});
