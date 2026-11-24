# Programme Ambassadeurs HOMI (24/11/2026)

## Source de vérité
- `ambassador_terms` (Supabase) : conditions **versionnées**, une seule active. Lecture publique via la vue
  `ambassador_terms_public` (site, app, simulateur). Publier : `admin_publish_ambassador_terms(jsonb)` (admin) → nouvelle
  version active, l'ancienne archivée ; les commissions acquises gardent leur version, leur taux et leurs montants.
- Version 1 : 30 % du net (prix − TVA − commission store), 6 premiers mois payants, 30 jours avant « payable »,
  versement mensuel dès 50 €, niveaux Starter 30 / Silver 31 / Gold 33 / Elite 35 (supérieurs **fermés**), produits
  éligibles : Premium mensuel, 6 mois, annuel, Famille. Lignes futures (Store, Wear, Smart, Play, Books, Box, Mama,
  Learn, Home) préparées et désactivées.

## Flux
1. Candidature (compte HOMI gratuit requis) : app `/ambassador` ; le site `/ambassadeurs/` y mène.
2. Validation : `admin_ambassador_set(id, 'approved')` (admin).
3. Recommandation : lien `https://<site>/?ref=CODE` (gardé 60 jours sur l'appareil, proposé après l'inscription sur le
   web) ou code saisi dans `/ambassador` (« Un parent t'a recommandé HOMI ? »). Une attribution par compte, jamais
   soi-même, jamais après un premier paiement.
4. Paiement réel (webhook RevenueCat) → `_ambassador_accrue` : commission « en attente » ; remboursement →
   `_ambassador_reverse`. Essais, sandbox, montants nuls : rien.
5. `ambassador_release_due()` (à planifier chaque jour) : « en attente » → « payable » après 30 jours.
6. Versement : manuel (virement) par l'admin, table `ambassador_payouts`.

## Calculs
`src/lib/ambassador/commission.ts` = `public.ambassador_split` (tests croisés : 14,99 € → 3,19 €, tableau de la
propriétaire de 10 à 5 000 abonnés).

## À faire avant la mise en service (non fait, accord requis)
- Appliquer la migration `20261210000100_ambassadeurs.sql` en production.
- Planifier `ambassador_release_due()` (pg_cron, quotidien).
- Vérifier dans RevenueCat que les webhooks portent `tax_percentage` / `commission_percentage` (sinon repli sur les
  taux de référence des conditions).
- Contrat ambassadeur et CGU du programme (loi influence commerciale du 9 juin 2023) ; statut fiscal des versements.
- Écran d'administration (validation, versements) ; questions de prix et de commissions dans Aura.
