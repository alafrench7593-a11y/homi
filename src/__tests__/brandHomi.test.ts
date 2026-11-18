/**
 * Marque HOMI dans ce que voit un utilisateur côté serveur (notifications d'abonnement, e-mails, invites de l'IA).
 * Les identifiants techniques des produits réels (« aufildenous_* ») ne sont PAS des textes affichés : ils restent.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { noticeFor } from '../../supabase/functions/_shared/revenuecat';

const OLD = /Au fil de nous/i;

it.each(['fr', 'en', 'es', 'de', 'it'])('notification « abonnement terminé » en %s : HOMI Premium, jamais l’ancienne marque', (lang) => {
  const n = noticeFor({ type: 'EXPIRATION' }, 'expired', lang);
  expect(n?.body).toContain('HOMI Premium');
  expect(`${n?.title} ${n?.body}`).not.toMatch(OLD);
});

it('aucune fonction serveur n’affiche plus l’ancienne marque (textes, valeur par défaut de APP_NAME, invites)', () => {
  const root = join(__dirname, '../../supabase/functions');
  const files: string[] = [];
  const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.ts')) files.push(p); });
  walk(root);
  const hits = files.filter((f) => OLD.test(readFileSync(f, 'utf8')));
  expect(hits).toEqual([]);
});
