# HOMI Ambassadors — audit, architecture et plan (24/11/2026)

Statut : **conception, aucun code ni aucune donnée de production modifiés.** Branche `homi/ambassadors`.

## 0. Points faibles à trancher d'abord
1. **Entité qui paie** (RÉSOLU 24/11 : David PRINCIVIL EI, France ; plus de société aux Émirats) : les mentions légales nomment *David PRINCIVIL, entrepreneur individuel (EI), France (SIREN 131194466)*, pas une société aux Émirats. Le prompt suppose une société EAU. Les versements, la TVA, les factures d'affiliés et le choix du prestataire de paiement en dépendent.
2. **L'app n'est pas en vente** (aucun produit publié, 0 abonné payant). Un programme d'affiliation avant la première vente n'a rien à attribuer ni à mesurer : le MVP peut être construit, mais le recrutement doit suivre la mise en vente.
3. **Pas de domaine officiel** : sans domaine, ni Universal Links iOS ni App Links Android (le fichier `apple-app-site-association` doit être servi par le domaine des liens). Les liens `/r/<code>` fonctionnent sur le site web, l'attribution après installation repose alors sur le **code saisi** ou la **connexion web préalable**.
4. **« 14 €/mois → 140 000 € pour 10 000 abonnés »** est un chiffre d'affaires brut TTC, pas encaissé (voir §5).

## 1. Ce qui existe et se réutilise (audit ciblé)
| Brique | État | Réutilisation |
|---|---|---|
| Webhook RevenueCat `supabase/functions/revenuecat-webhook` | en place : secret Bearer, relecture API, idempotence par transaction (crédits) | point d'entrée unique ; ajout d'un traitement « commission » après l'écriture de l'abonnement |
| Table `subscriptions` (écrite par le serveur seul) | en place | lien abonné ↔ produit ↔ statut |
| Grand livre des crédits | en place | même modèle (écritures + ajustements, jamais de modification) pour `affiliate_ledger` |
| Rôles (`role = 'admin'` dans `foundation.sql`) + écrans `/admin` | en place, sans rôles finance/support/marketing | ajouter des rôles, réutiliser la garde |
| Site public `web/site` + web app `/app` (Vercel, branche `homi/site-web`) | en place | `/ambassadors`, `/r/<code>`, landing par niche |
| Liens profonds | schéma `homi://` seulement ; aucun Universal Link / App Link | à créer quand un domaine existe |
| Parrainage / affiliation | **inexistant** | à créer |

## 2. Architecture recommandée — interne Supabase + RevenueCat (pas d'outil externe au lancement)
- **Attribution** (sans empreinte d'appareil, sans donnée de santé) :
  1. `/r/<code>?campaign=&feature=` (site) → clic enregistré (compteur agrégé + jeton aléatoire, pas d'IP en clair) → cookie première partie 30 jours → landing → boutons App Store / web app.
  2. Compte créé **sur le web** avec ce cookie → attribution immédiate (le cas le plus fiable).
  3. Sur iPhone : **champ « Code ambassadeur » à l'onboarding** (secours obligatoire, Apple ne transmet aucun paramètre à l'installation).
  4. Plus tard, avec un domaine : Universal Links + presse-papiers **non** utilisé (refusé par l'utilisateur / risqué en revue).
  Règle : **dernier clic valide avant la première transaction**, fenêtre 30 jours ; attribution **figée** à la première transaction payée (aucun changement après achat) ; auto-affiliation refusée (même compte, même foyer).
- **Commissions** : calculées **dans le webhook** à partir des champs RevenueCat de l'événement (montant payé dans la devise, pourcentage reversé par la boutique, taxe), jamais du prix affiché. Événements : achat initial, conversion d'essai, renouvellement (dans la durée commissionnée), remboursement / annulation de transaction → écriture d'ajustement négative. Idempotence : clé = identifiant de transaction RevenueCat.
- **Registre** : `affiliate_ledger` en centimes entiers (`bigint`) + devise ; statuts pending → approved (après délai, ex. 45 j) → available → paid ; aucune ligne modifiée, seulement des ajustements.
- **Versements** : **manuels et validés** au lancement (export + virement), automatisation plus tard.
- **Séparation** : schéma `affiliate` à part, RLS stricte ; un ambassadeur ne voit que des agrégats (jamais un nom, un e-mail ni une donnée familiale d'un client).

## 3. Coûts mensuels estimés (MVP)
- Supabase, Vercel, RevenueCat : **déjà payés / dans les offres actuelles** — surcoût proche de 0 au volume du lancement. [Probable]
- Outils d'attribution (AppsFlyer, Adjust, Branch) : **non retenus** au lancement — coût et valeur faible tant qu'il n'y a pas de volume publicitaire. À revoir au-delà de quelques milliers d'installations / mois.
- Envoi d'e-mails (bienvenue, commission) : service transactionnel déjà nécessaire pour l'authentification ; volume faible.
- Paiement des affiliés : frais du prestataire choisi (virement SEPA manuel ≈ gratuit ; Stripe Connect / Wise : frais par versement). **Tarifs à vérifier au moment du choix, non vérifiés ici.**

## 4. Contraintes Apple et RevenueCat
- Apple : aucun paramètre ne survit à l'installation depuis l'App Store ; pas d'empreinte d'appareil (règle 5.1.2) ; une rémunération des affiliés hors app est permise, mais **pas d'incitation financière dans l'app** liée à l'achat in-app ; la section « Devenir ambassadeur » dans l'app doit rester informative (renvoi vers le web) — à valider à la soumission.
- Les offres « 1 mois offert » au parrain ne s'appliquent pas librement : codes d'offre / offres promotionnelles Apple seulement.
- RevenueCat : source de vérité des abonnements ; les champs exacts de montant net doivent être relus dans la documentation au moment du code (**non revérifiés ici**).

## 5. Modèle de rémunération (chiffres d'exemple, prix réels de la grille : 14,99 € / mois TTC)
| Étape | Mensuel |
|---|---|
| Prix TTC | 14,99 € |
| HT (TVA FR 20 %) | 12,49 € |
| Après commission Apple 15 % (petites entreprises) | **10,62 €** encaissés |
| 30 % de l'encaissé | **3,19 € / mois** |
| Sur 6 mois payés | **≈ 19 € par abonné** |
Annoncer « 4,20 €/mois » serait faux avec cette assiette. Recommandation : **assiette = encaissé net**, 25–30 %, 6 mois, délai de validation 45 jours, seuil 30 €.
10 000 abonnés actifs ≈ 106 000 €/mois **encaissés** (pas 140 000 €), avant coûts IA et infrastructure.

## 6. Plan priorisé
- **MVP (avant recrutement)** : tables + RLS + tests SQL ; `/r/<code>` + clic ; inscription ambassadeur (web) ; code à l'onboarding de l'app ; commissions dans le webhook (sandbox) ; tableau de bord affilié (agrégats) ; écran admin (validation, versements manuels) ; conditions du programme.
- **Phase 2** : landing par niche (6 max, contenu réel), kit marketing, CRM de prospects **vérifiés à la main**, e-mails.
- **Phase 3** : versements automatisés, niveaux, antifraude avancée, international.

## 7. Ce qui demande ton intervention
- Entité juridique qui paie et pays des affiliés (EI France ou société EAU).
- Validation juridique des conditions du programme et de la fiscalité des versements.
- Domaine officiel (liens universels).
- Mise en vente de l'app (sans elle, rien à commissionner).
- Accès RevenueCat sandbox (événements de test) et accord avant toute migration en production.
- Adresse e-mail professionnelle (SPF/DKIM/DMARC) avant toute prospection.
