import { PRIVACY } from '@/content/legal';
import { PRIVACY_POLICY, PRIVACY_POLICY_VERSION } from '@/content/privacy-policy';
import * as fs from 'fs';
import * as path from 'path';

describe('politique de confidentialité', () => {
  it('une seule source de texte (inscription et Réglages)', () => {
    expect(PRIVACY_POLICY).toBe(PRIVACY.sections);
    // même version que celle enregistrée à l'inscription (LEGAL_VERSIONS.privacy)
    const authFlow = fs.readFileSync(path.join(__dirname, '../lib/authFlow.ts'), 'utf8');
    expect(authFlow).toContain(`privacy: '${PRIVACY_POLICY_VERSION}'`);
  });
  it('nomme les services externes réellement utilisés', () => {
    const txt = PRIVACY.sections.map((s) => s.body).join(' ');
    for (const service of ['Google Gemini', 'Supabase', 'RevenueCat', 'OpenStreetMap', 'Wikimedia', 'Open Food Facts']) expect(txt).toContain(service);
    expect(txt).toMatch(/document/);
    expect(txt).toMatch(/communauté/);
  });
});
