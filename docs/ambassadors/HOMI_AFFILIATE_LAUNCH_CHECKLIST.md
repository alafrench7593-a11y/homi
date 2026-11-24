# HOMI Ambassadors — état et check-list de lancement (24/11/2026)

## Fait (branche `homi/ambassadors`, rien en production)
- Base : migration `20261209000100_ambassadors.sql` (tables, RLS, RPC, audit, export RGPD) — **non déployée**.
- Serveur : webhook RevenueCat → commission sur l'encaissé net, idempotente ; remboursement → écriture négative.
- App : `/r/<code>` (clic anonyme agrégé, code gardé 30 j), code facultatif à l'inscription, rattachement après connexion,
  `/ambassadors` (programme + simulateur estimatif, aucun prix d'abonnement), `/ambassadors/apply`, `/ambassadors/dashboard`
  (agrégats seulement), `/admin/ambassadors` (support : valider/refuser/suspendre ; finance : versement manuel avec référence),
  entrée dans Réglages. Programme hors Premium.
- Tests : SQL 2831/0 (dont 37 Ambassadors) ; Jest complet 4726/4726 ; parcours navigateur `e2e/ambassadors.py` 20/20.

## Avant mise en service (propriétaire)
1. **Accord explicite** pour déployer la migration en production (projet `ploatloxxigplpdsqyri`).
2. ~~Conditions du programme~~ : validées le 24/11 ; entité = David PRINCIVIL EI (France), mentions légales inchangées.
3. Versements par virement SEPA depuis le compte de l'EI ; collecter IBAN et statut fiscal de chaque ambassadeur (en France : SIRET si auto-entrepreneur, sinon déclaration en BNC). Vérifier avec le comptable le traitement des commissions dans la comptabilité de l'EI.
4. Revérifier dans la doc RevenueCat les champs `price_in_purchased_currency`, `tax_percentage`, `commission_percentage`,
   `takehome_percentage` (sinon : aucune commission calculée, par sécurité).
5. Domaine officiel du site → `EXPO_PUBLIC_SITE_URL` pour les liens de partage dans l'app mobile (sur le web : adresse courante).
6. Donner les rôles `support` / `finance` aux bonnes personnes (table `user_roles`).
7. Tâche planifiée appelant `affiliate_release_due()` chaque jour (passage « en attente » → « disponible » après 45 j).
8. Test en sandbox RevenueCat (achat, renouvellement, remboursement) avant le premier ambassadeur réel.

## Limites connues
- Mobile : pas de « lien différé » (un clic qui mène à l'App Store perd le code) → le code saisi à l'inscription est la voie principale.
- QR code non fait (évite une dépendance ; l'app peut partager le lien).
- Paliers (`tier`) stockés mais sans règle différenciée pour l'instant.
