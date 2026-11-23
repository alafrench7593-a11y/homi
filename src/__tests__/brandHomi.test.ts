/**
 * Marque HOMI dans ce que voit un utilisateur côté serveur (notifications d'abonnement, e-mails, invites de l'IA).
 * Les identifiants techniques des produits réels (« aufildenous_* ») ne sont PAS des textes affichés : ils restent.
 */
import { noticeFor } from '../../supabase/functions/_shared/revenuecat';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readdirSync(p: string): string[]; statSync(p: string): { isDirectory(): boolean }; readFileSync(p: string, enc: 'utf8'): string };

const OLD = /Au fil de nous/i;

it.each(['fr', 'en', 'es', 'de', 'it'])('notification « abonnement terminé » en %s : HOMI Premium, jamais l’ancienne marque', (lang) => {
  const n = noticeFor({ type: 'EXPIRATION' }, 'expired', lang);
  expect(n?.body).toContain('HOMI Premium');
  expect(`${n?.title} ${n?.body}`).not.toMatch(OLD);
});

it('aucune fonction serveur n’affiche plus l’ancienne marque (textes, valeur par défaut de APP_NAME, invites)', () => {
  const files: string[] = [];
  const walk = (d: string) => fs.readdirSync(d).forEach((f: string) => { const p = `${d}/${f}`; if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.ts')) files.push(p); });
  walk('supabase/functions');
  expect(files.length).toBeGreaterThan(20);
  const hits = files.filter((f) => OLD.test(fs.readFileSync(f, 'utf8')));
  expect(hits).toEqual([]);
});
