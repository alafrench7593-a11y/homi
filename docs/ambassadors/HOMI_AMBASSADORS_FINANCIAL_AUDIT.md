# HOMI Ambassadors — audit financier (24/11/2026)

> **Statut : NON prêt pour des versements réels.** Le moteur est corrigé et testé en local. Les corrections
> NE SONT PAS déployées en production : il faut d'abord ta validation des décisions listées en §9.
> Ordre de déploiement imposé : 1) migration `20261211000100_ambassadors_finance.sql`, 2) webhook. L'ordre inverse
> casserait le webhook, car la nouvelle fonction a plus de paramètres.

## 1. Règles réellement configurées et différences avec ta configuration de référence

| Règle | Ta référence (prompt) | Configuré (conditions v1-2026-11 validées le 24/11, base, site, app) | Écart |
|---|---|---|---|
| Taux standard | 30 % | 30 % (`percent_bp = 3000`) | — |
| Assiette | revenus nets réellement encaissés | encaissé net calculé depuis RevenueCat : brut × (1 − taxe − commission boutique) | — (voir §5 réconciliation) |
| Durée | 6 premiers mois **payants** éligibles | paiements intervenus dans les **6 mois qui suivent le 1er paiement**, et 6 paiements commissionnés au maximum | **à trancher** : une interruption ne prolonge pas la période (règle actuelle, écrite au contrat) |
| Seuil de versement | **50 €** | **30 €** (conditions validées, site, app, base) | **ÉCART** : non modifié, car ce sont des conditions déjà validées |
| Versement | mensuel | dès le seuil, après validation par la finance (pas de calendrier) | **à trancher** |
| Inscription / audience / plafond | gratuite / aucun minimum / aucun plafond | idem | — |
| Essai gratuit | 3 jours | jamais commissionné (prix 0 ou période TRIAL) | — |
| Option familiale | supplément de 5 € | il n'y a **pas de supplément** : « HOMI Famille » est un **produit distinct** (`homi_family_*`, 19,99 €/mois d'après les CGU), commissionné comme les autres sur son net | **à trancher** |
| Semestriel 69,99 € / annuel 119,99 € | règle explicite, à valider (ex. prorata 6/12) | contrat actuel : 30 % du net de **chaque paiement** dans les 6 mois → un annuel payé au mois 0 est commissionné **en entier** | **à trancher** (risque §8) |
| Niveaux Silver 31 / Gold 33 / Elite 35 % | non activés sans validation | aucun niveau actif (colonne `tier` stockée, sans effet) | — |

## 2. Formules (une seule source par étage)

- **Encaissé net** (serveur, `supabase/functions/_shared/affiliate.ts`) : `net = arrondi_half_up(brut × (1 − tax_percentage − commission_percentage))`
  en unités mineures. D'après la doc RevenueCat (vérifiée le 24/11), les deux taux sont des **parts du brut** ; on ne les enchaîne
  pas, ce qui évite toute double déduction. Si un champ manque : **aucune commission** (jamais d'estimation depuis un prix).
- **Commission** (base, `affiliate_record_commission`) : `commission = (net × taux_bp + 5000) / 10000` (entiers, half-up, par transaction).
- **Reste HOMI** = net − commission. Ce n'est **pas** un bénéfice : il reste les coûts (Supabase, IA, support, paiement, impôts).
- **Simulateurs** (site `/ambassadeurs/` et app `/ambassadors`) : même module `src/lib/affiliateProgram.ts`, même arrondi. Ils
  partent d'un **net d'exemple** et n'affichent aucun prix. Le résultat est une estimation, présentée comme telle.
- Aucun calcul de commission dans l'app, le navigateur ou Aura : ils ne font qu'afficher les agrégats du serveur (`affiliate_my_summary`).

## 3. Erreurs détectées et corrections

| # | Problème détecté | Gravité | Avant | Après |
|---|---|---|---|---|
| 1 | Taxe et commission boutique enchaînées | élevée | net surestimé d'environ 3 % | formule RevenueCat (parts du brut) |
| 2 | Achats de test (sandbox) commissionnés | élevée | un achat de test d'un client rattaché créait une vraie commission | ignorés dans le webhook **et** en base (`sandbox_ignored`) |
| 3 | Client déjà abonné qui saisit un code ensuite | élevée | son prochain renouvellement était commissionné | refusé (`already_customer`) au rattachement et à la commission |
| 4 | 7ᵉ paiement daté quelques secondes avant la fin des 6 mois | moyenne | commissionné | 6 paiements commissionnés au maximum par client (en plus de la fenêtre) |
| 5 | Arrondi à l'inférieur | faible | 3,18 € / 19,08 € | half-up partout : 3,19 € / 19,14 € (ta référence) |
| 6 | Deux validations de versement simultanées | élevée | double paiement possible | verrou par ambassadeur, référence de virement obligatoire et unique |
| 7 | Registre modifiable | moyenne | montants modifiables ou supprimables par un rôle serveur | ajout seul : montants et références figés, suppression interdite, transitions de statut contrôlées |
| 8 | Traçabilité | moyenne | net seul | brut, taxe, commission boutique, taux, version des conditions, événement, environnement, boutique |
| 9 | Performance | moyenne | contrôle des 6 paiements sans index (coût qui croît avec le volume) | index `(customer_id, kind)` |
| 10 | `takehome_percentage` (champ déprécié) | faible | utilisé en repli | ignoré |
| 11 | Deux moteurs (site / app) | élevée | deux programmes concurrents | un seul moteur (voir `docs/AMBASSADEURS.md`) |

Aucune écriture existante n'a été modifiée (le registre de production est vide).

## 4. Statuts

Actuels : `pending` (en attente, délai de 45 j) → `available` (versable) → `paid` ; `reversed` (annulée) ; écritures
`reversal` (négatives), `adjustment`, `payout`. Les statuts **ESTIMATED / CONFIRMED / PROCESSING / FAILED / DISPUTED** de ta
liste n'existent pas encore : il faut d'abord la réconciliation (§5). Aujourd'hui, `pending` joue le rôle d'« estimé non
retirable », et un versement n'est marqué `paid` que lorsque la finance saisit la référence du virement **déjà effectué**.

## 5. Estimation ≠ encaissement : réconciliation

Les montants RevenueCat (taxe, commission boutique) sont des **estimations**. Méthode retenue (à outiller) : chaque mois,
rapprocher les commissions `pending` des rapports de reversement App Store Connect et Google Play (par transaction quand
c'est possible, sinon par produit, pays et mois). Un écart non résolu laisse la commission en attente. Ce n'est pas encore
automatisé : avant le premier versement réel, la finance compare le total net du mois aux rapports Apple et Google.

## 6. Remboursements

Remboursement (CANCELLATION/EXPIRATION avec motif CUSTOMER_SUPPORT) → écriture négative de même montant. Si la commission
n'est pas encore versée, elle est annulée. Si elle l'est déjà, le montant est déduit du prochain versement ; il n'y a jamais
de prélèvement. **Limites** : RevenueCat ne signale que le remboursement de la **dernière** période, et un remboursement
**partiel** annule la commission entière. Contrôle mensuel manuel par la finance en attendant.

## 7. Tests exécutés (local, données fictives, aucun paiement réel)

- SQL : **2852 / 0** (dont `98zr_ambassadors.sql` et `98zs_ambassadors_finance.sql`). Couvert : achat initial, renouvellements,
  6 paiements puis refus du 7ᵉ (y compris daté trop tôt), fin de fenêtre, attribution expirée, auto-affiliation, dernier code
  gagne, attribution figée, client déjà payant, sandbox, webhook rejoué, remboursement avant et après versement, seuil
  < / = / > 30 €, double versement, référence dupliquée, accès non autorisé (client, ambassadeur), modification ou
  suppression du registre, total exact 19,14 €.
- Jest : serveur (formule RevenueCat, half-up, essai à 0, remboursement négatif, sandbox, devise sans décimales, webhook
  en échec puis réessayé sans double compte) et simulateur partagé (3,19 € et 19,14 €).
- Parcours navigateur : 28 / 28 (site → `?ref` → inscription → candidature → validation → versement → tableau de bord).
- Charge : voir §7 bis.

### 7 bis. Test de charge (local, 100 000 abonnés fictifs, `AMB_LOAD=1 bash supabase/tests/run-local.sh`)

| Étape | Résultat | Durée |
|---|---|---:|
| 1er paiement × 100 000 (10 lots) | 100 000 commissions `ok` | ≈ 1,5 s par lot de 10 000 |
| Webhook rejoué × 100 000 | 100 000 `duplicate`, aucune 2ᵉ commission | 10,2 s |
| Mois 2 à 7 pour 10 000 abonnés (7ᵉ daté 1 s avant la fin) | 50 000 `ok`, 10 000 `period_over` | 6,6 s |
| Contrôles | 150 000 commissions, somme exacte 150 000 × 3,19 € = 478 500 €, 6 au maximum par client | 0,09 s |
| Tableau de bord ambassadeur (100 000 abonnés) | agrégats corrects | 0,11 s |
| Libération quotidienne | 150 000 passées en « disponible » | 4,6 s |

Constat : un seul appel géant (100 000 commissions dans une transaction, sur un registre sans statistiques) devient très
lent, car le plan d'exécution reste celui d'une table vide. En production, chaque webhook est une transaction et l'autovacuum
met les statistiques à jour : ce cas ne se produit pas. Pour un éventuel import massif, procéder par lots avec `analyze`.

## 8. Simulations (formules entières du moteur, TVA 20 %, estimations : jamais des revenus réels)


**Apple 15 %** — 14,99 € TTC : net 10,62 €, commission 30 % 3,19 €, reste HOMI 7,43 € ; à 35 % : 3,72 €

| Abonnés commissionnés | CA TTC mensuel | Revenus nets plateforme | Commissions (30 %) | Reste HOMI avant autres coûts |
|---:|---:|---:|---:|---:|
| 10 | 149,90 € | 106,20 € | 31,90 € | 74,30 € |
| 100 | 1 499,00 € | 1 062,00 € | 319,00 € | 743,00 € |
| 500 | 7 495,00 € | 5 310,00 € | 1 595,00 € | 3 715,00 € |
| 1000 | 14 990,00 € | 10 620,00 € | 3 190,00 € | 7 430,00 € |
| 5000 | 74 950,00 € | 53 100,00 € | 15 950,00 € | 37 150,00 € |
| 10000 | 149 900,00 € | 106 200,00 € | 31 900,00 € | 74 300,00 € |
| 50000 | 749 500,00 € | 531 000,00 € | 159 500,00 € | 371 500,00 € |
| 100000 | 1 499 000,00 € | 1 062 000,00 € | 319 000,00 € | 743 000,00 € |

**Apple 30 %** — 14,99 € TTC : net 8,74 €, commission 30 % 2,62 €, reste HOMI 6,12 € ; à 35 % : 3,06 €

| Abonnés commissionnés | CA TTC mensuel | Revenus nets plateforme | Commissions (30 %) | Reste HOMI avant autres coûts |
|---:|---:|---:|---:|---:|
| 10 | 149,90 € | 87,40 € | 26,20 € | 61,20 € |
| 100 | 1 499,00 € | 874,00 € | 262,00 € | 612,00 € |
| 500 | 7 495,00 € | 4 370,00 € | 1 310,00 € | 3 060,00 € |
| 1000 | 14 990,00 € | 8 740,00 € | 2 620,00 € | 6 120,00 € |
| 5000 | 74 950,00 € | 43 700,00 € | 13 100,00 € | 30 600,00 € |
| 10000 | 149 900,00 € | 87 400,00 € | 26 200,00 € | 61 200,00 € |
| 50000 | 749 500,00 € | 437 000,00 € | 131 000,00 € | 306 000,00 € |
| 100000 | 1 499 000,00 € | 874 000,00 € | 262 000,00 € | 612 000,00 € |

**Un abonné mensuel (Apple 15 %), 12 mois** : 6 × 3,19 € = 19,14 € pour l'ambassadeur ; HOMI garde 44,58 € (mois 1-6) + 63,72 € (mois 7-12) = 108,30 € avant coûts.

| Scénario (1 000 abonnés recrutés, Apple 15 %) | Commissions totales | Reste HOMI sur 12 mois |
|---|---:|---:|
| restent 12 mois | 19 140,00 € | 108 300,00 € |
| remboursements 5 % | 18 183,00 € | 102 885,00 € |
| remboursements 10 % | 17 226,00 € | 97 470,00 € |
| désabonnement après 1 mois | 3 190,00 € | 7 430,00 € |
| désabonnement après 3 mois | 9 570,00 € | 22 290,00 € |

Coûts IA et infrastructure, frais de versement : non chiffrés ici (aucune donnée de coût réelle dans le dépôt).

**Risque annuel** (contrat actuel) : un annuel à 119,99 € TTC donne environ 85 € net → **≈ 25,5 € de commission** en une
fois, contre 19,14 € pour 6 mois de mensuel. Le prorata 6/12 donnerait ≈ 12,75 €.

## 9. Décisions nécessitant ta validation (aucune n'est appliquée)

1. **Seuil : 30 € (validé) ou 50 € (ton prompt) ?** Passer à 50 € = nouvelle version des conditions, sans effet sur les soldes déjà acquis.
2. **Annuel et semestriel** : 30 % du paiement entier (contrat actuel) ou prorata des 6 mois éligibles (6/12 pour l'annuel ; 6/6 pour le semestriel) ?
3. **Famille** : commissionnée comme les autres produits (actuel) ou exclue / à un autre taux ?
4. **Interruption d'abonnement** : la fenêtre de 6 mois continue de courir (actuel) ou se suspend ?
5. **Calendrier de versement** : mensuel à date fixe ou dès le seuil (actuel) ?
6. **Devises** : seuil de 30 unités appliqué par devise (30 USD, 30 GBP, **30 AED ≈ 7,5 €**). Proposition : versements en EUR
   uniquement, avec conversion documentée (taux, date, source) à ajouter.
7. **Niveaux** (31 / 33 / 35 %) : seuils et portée (nouveaux abonnés seulement ?).
8. Déploiement en production de la migration `20261211000100` puis du webhook (une fois 1 à 7 tranchés).

## 10. Risques restants

- Réconciliation avec les rapports Apple et Google non automatisée (§5).
- Remboursements partiels et de périodes antérieures (§6).
- Taux réel de commission Apple (Small Business 15 % ou 30 %) non vérifié dans App Store Connect : le moteur utilise le taux
  transmis par RevenueCat pour chaque transaction, donc pas d'hypothèse codée en dur.
- Pas encore de tableau de bord financier administrateur (CA, taxes, frais, marges, alertes) : les données nécessaires sont
  maintenant stockées (§3 n° 8). Ce sera l'étape suivante, une fois les règles validées.
- Aura n'a aucun accès aux gains : elle ne doit pas répondre sur les montants. Un branchement sur `affiliate_my_summary` reste à faire.
- HOMI Store : non développé. Le moteur accepte une règle par produit (`product_ids`) ; aucun taux d'abonnement n'est appliqué aux produits physiques.
