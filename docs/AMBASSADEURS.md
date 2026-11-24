# Programme Ambassadeurs — un seul programme (site + app), 24/11/2026

- **Site** : `/ambassadeurs/` (web/site/ambassadeurs.html + ambassadeurs-entry.ts) — vitrine, simulateur, `?ref=<code>`.
- **App** : `/ambassadors` (programme), `/ambassadors/apply`, `/ambassadors/dashboard`, `/admin/ambassadors` ; `/r/<code>` ;
  code facultatif à l'inscription ; `/ambassador` (ancienne adresse) redirige vers `/ambassadors`.
- **Règles et simulateur partagés** : `src/lib/affiliateProgram.ts` (30 %, 6 mois, 45 j, attribution 30 j, seuil 30 €).
- **Conditions** : `src/content/legalAmbassadors.ts` → écran `/legal/ambassadors` et page `/conditions-ambassadeurs/`.
- **Serveur** : tables `affiliate_*` (migrations 20261209000100 et 20261210000100, en production), webhook RevenueCat
  (`_shared/affiliate.ts`, déployé v9), tâche quotidienne `homi-affiliate-release`.
- Détail : `docs/ambassadors/`. L'ancienne implémentation parallèle (`ambassador_*`, `referral_attributions`) est retirée du code ET de la production
  (nettoyage du 24/11 par l'autre session, vérifié : 0 table/fonction restante, export RGPD → `_export_my_data_raw_ambassadors`, anon sans droit).