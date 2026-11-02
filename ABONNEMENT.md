# Abonnement « Au fil de nous Premium » — mise en service pas à pas

Ce guide décrit tout ce qui se fait **dans les consoles** (App Store Connect, Google Play Console, RevenueCat, Supabase) et
les tests à faire **sur un vrai téléphone**. Le code est prêt ; aucun achat réel n'a été fait pendant le développement.

Les libellés des consoles évoluent : si un menu a changé de nom, cherchez le libellé le plus proche. Aucune clé, aucun
secret ne doit être collé dans ce dépôt ni dans l'application : seules les **clés publiques** RevenueCat vont dans
l'application (`EXPO_PUBLIC_…`), tout le reste est un **secret Supabase**.

---

## 0. Ce qui est attendu par le code

| Élément | Valeur |
|---|---|
| Droit (entitlement) RevenueCat | `AU_FIL_DE_NOUS_PREMIUM` (secret serveur `REVENUECAT_ENTITLEMENT`, valeur par défaut identique) |
| Offering | l'offering **courante** (« Current ») de RevenueCat, identifiant recommandé `default` |
| Packages | `$rc_monthly` (Monthly), `$rc_six_month` (6 Month), `$rc_annual` (Annual) |
| Produit mensuel | `aufildenous_premium_monthly` — 10,99 € / mois — **essai gratuit 3 jours** (nouveaux abonnés) |
| Produit 6 mois | `aufildenous_premium_6months` — 54,99 € / 6 mois — pas d'essai |
| Produit annuel | `aufildenous_premium_annual` — 99,99 € / an — pas d'essai |
| appUserID RevenueCat | identifiant Supabase de l'utilisatrice (UUID) |

- Les 3 formules donnent **exactement le même Premium** (un seul droit).
- L'application affiche **toujours les prix renvoyés par la boutique** (`priceString`), calcule le prix par mois et
  l'économie par rapport au mensuel à partir de ces prix réels. La grille 10,99 / 54,99 / 99,99 n'est affichée qu'en
  **démonstration** (« Découvrir sans compte »), avec la mention « Montants de démonstration ».
- L'essai n'est affiché que si la boutique le propose réellement à la personne (iOS : éligibilité confirmée par Apple ;
  Android : phase gratuite présente dans l'option appliquée à l'achat).
- Partage : l'abonné·e + **un seul** co-parent adulte du foyer (2 comptes adultes maximum).

---

## 1. App Store Connect (iPhone)

Prérequis : contrat **Apps payantes** signé et informations bancaires / fiscales complètes
(App Store Connect › **Accords, taxes et banques**).

### 1.1 Groupe d'abonnements et 3 produits
1. App Store Connect › **Apps** › *Au fil de nous* › colonne de gauche **Monétisation** › **Abonnements**.
2. **Groupes d'abonnements** › **+** (Créer) › nom de référence : `Au fil de nous Premium`.
   Les **3 produits doivent être dans ce même groupe** : c'est ce qui permet de changer de formule sans double abonnement.
3. Dans le groupe › **Créer** (ou **+**) pour chaque produit :

   | Nom de référence | ID du produit | Durée |
   |---|---|---|
   | Premium mensuel | `aufildenous_premium_monthly` | 1 mois |
   | Premium 6 mois | `aufildenous_premium_6months` | 6 mois |
   | Premium 12 mois | `aufildenous_premium_annual` | 1 an |

4. Pour chaque produit :
   - **Disponibilité** : pays où l'app est vendue.
   - **Prix de l'abonnement** › **Ajouter un prix** (ou « Configurer le prix ») › pays de référence **France** ›
     10,99 € / 54,99 € / 99,99 € (si Apple ne propose pas exactement ce palier, choisir le plus proche : l'appli affichera
     de toute façon le prix réel). Laisser Apple calculer les autres pays ou les ajuster.
   - **Localisation de l'App Store** › **+** : français et anglais (nom affiché, description).
   - **Informations pour la revue** : capture d'écran de la page Premium (écran *AU FIL DE NOUS PREMIUM* de l'app).
5. **Essai gratuit de 3 jours, sur le mensuel uniquement** : produit `aufildenous_premium_monthly` › section
   **Prix de l'abonnement** › **+** à côté de « Offres de lancement » (Introductory Offers) › **Créer une offre de lancement**
   › pays : tous › date de début : aujourd'hui, sans fin › type **Gratuit** › durée **3 jours**.
   Ne créez **aucune** offre de lancement sur les produits 6 mois et 12 mois.

### 1.2 Niveaux de service (changement de formule)
Dans le groupe **Au fil de nous Premium**, la liste des produits se classe par **niveau** (glisser-déposer, puis
**Enregistrer**). Recommandation :

| Niveau | Produit |
|---|---|
| 1 (le plus élevé) | `aufildenous_premium_annual` |
| 2 | `aufildenous_premium_6months` |
| 3 | `aufildenous_premium_monthly` |

Effet (règles Apple) : passer à un niveau supérieur (mensuel → 12 mois) prend effet **immédiatement** avec un
remboursement au prorata de la période restante ; passer à un niveau inférieur (12 mois → mensuel) prend effet **à la
prochaine échéance**. C'est le même comportement que celui programmé pour Google Play dans l'application.

### 1.3 Réglages du groupe
- **Période de grâce de facturation** (Billing Grace Period) : page **Abonnements** › **Période de grâce de facturation**
  › activer (6 ou 16 jours) pour tous les abonnés. L'appli affiche alors « Période de grâce » et garde Premium.
- **Notifications du serveur App Store** : **Informations sur l'app** (App Information) › **Notifications du serveur
  App Store** › URL de production **et** URL de sandbox = l'URL « Apple Server Notification URL » donnée par RevenueCat
  (RevenueCat › Project settings › Apps › votre app iOS), version 2.
- **Clé In-App Purchase** : **Utilisateurs et accès** › **Intégrations** › **Achats intégrés** (In-App Purchase) › **+** ›
  télécharger le fichier `.p8` (une seule fois) → à téléverser dans RevenueCat (§ 3.2). Notez l'ID de la clé et l'Issuer ID.

### 1.4 Compte Sandbox
**Utilisateurs et accès** › **Sandbox** › **Comptes de test** › **+** : prénom, nom, une adresse e-mail **jamais utilisée**
comme identifiant Apple, mot de passe, pays **France**. Sur l'iPhone de test : **Réglages** › **App Store** › en bas
**Compte Sandbox** › se connecter. Les abonnements Sandbox se renouvellent en accéléré (1 mois ≈ 5 minutes,
1 an ≈ 1 heure, 3 jours d'essai ≈ quelques minutes) : idéal pour les scénarios ci-dessous.

---

## 2. Google Play Console (Android)

Prérequis : profil de paiement marchand (Play Console › **Paramètres** › **Profil de paiement**).

### 2.1 Un abonnement à 3 offres de base (recommandé) — ou 3 abonnements
Google recommande **un abonnement avec plusieurs offres de base** ; RevenueCat et l'application gèrent **les deux**
modèles (produits « `abonnement:offre-de-base` » ou 3 identifiants distincts).

**Modèle recommandé** — Play Console › votre app › **Monétiser avec Play** › **Produits** › **Abonnements** ›
**Créer un abonnement** :
1. ID produit : `aufildenous_premium`, nom : *Au fil de nous Premium* (avantages en français et en anglais).
2. **Ajouter une offre de base** (3 fois), type **Renouvellement automatique** :

   | ID de l'offre de base | Période de facturation | Prix (France) |
   |---|---|---|
   | `monthly` | 1 mois | 10,99 € |
   | `six-months` | 6 mois | 54,99 € |
   | `annual` | 1 an | 99,99 € |

   Pour chacune : **Période de grâce** (ex. 7 jours) et **Suspension du compte** (account hold, ex. 30 jours) ;
   option « Autoriser la reprise / la mise en pause » selon votre choix (la pause est gérée par l'appli : « En pause »).
   **Activer** chaque offre de base.
3. **Offre d'essai 3 jours, sur `monthly` uniquement** : dans l'offre de base `monthly` › **Ajouter une offre** ›
   ID `essai-3-jours` › **Éligibilité** : *Acquisition de nouveaux clients* › « N'a jamais eu cet abonnement »
   (éligibilité **déterminée par Google** : surtout pas « déterminée par le développeur », que RevenueCat pourrait appliquer
   automatiquement) › **Phase** : *Essai sans frais*, durée **3 jours** › **Activer**.
   Google retire automatiquement cette offre aux personnes qui l'ont déjà utilisée : l'appli n'affiche alors plus l'essai.

**Modèle alternatif (3 abonnements)** : créer 3 abonnements `aufildenous_premium_monthly`, `aufildenous_premium_6months`,
`aufildenous_premium_annual` (une offre de base chacun), l'offre d'essai seulement sur le mensuel. L'application transmet
alors à Google l'abonnement en cours lors d'un changement de formule (sinon Google créerait un second abonnement).

### 2.2 Notifications et accès pour RevenueCat
- **Notifications en temps réel pour les développeurs** : Play Console › **Monétiser avec Play** › **Configuration de la
  monétisation** › *Notifications en temps réel* › nom du sujet Pub/Sub fourni par RevenueCat (RevenueCat › votre app
  Android › *Google developer notifications* › « Connect to Google »).
- **Compte de service** : suivre l'assistant RevenueCat (Google Cloud › IAM › Comptes de service › créer, clé JSON),
  puis Play Console › **Utilisateurs et autorisations** › **Inviter** l'adresse du compte de service avec les droits
  « Afficher les données financières », « Gérer les commandes et les abonnements ». Téléverser le JSON dans RevenueCat.
  Compter jusqu'à 36 h avant que Google valide les droits.

### 2.3 Testeurs
- **Testeurs de licence** : Play Console (niveau compte) › **Paramètres** › **Test des licences** › ajouter les adresses
  Gmail des testeurs › réponse de licence *RESPOND_NORMALLY*. Les abonnements de test se renouvellent en accéléré
  (durées raccourcies à quelques minutes ; voir la page « Tester les abonnements » de Google Play).
- **Test interne** : **Tests** › **Test interne** › créer une version avec le build EAS Android et ajouter les testeurs
  (les achats ne fonctionnent qu'avec une version installée depuis Google Play).

---

## 3. RevenueCat

### 3.1 Projet et apps
1. https://app.revenuecat.com › **Create new project** › *Au fil de nous*.
2. **Project settings** › **Apps** › **+ New** › *App Store* : bundle ID de l'app, **In-App Purchase Key** (fichier `.p8`,
   ID de clé, Issuer ID, § 1.3). Copier l'« Apple Server Notification URL » dans App Store Connect (§ 1.3).
3. **+ New** › *Play Store* : nom du package Android, JSON du compte de service (§ 2.2), notifications Google (§ 2.2).

### 3.2 Produits, droit, offering
1. **Product catalog** › **Products** › **+ New** / **Import** : les 3 produits Apple et les 3 produits Google
   (modèle recommandé : `aufildenous_premium:monthly`, `aufildenous_premium:six-months`, `aufildenous_premium:annual`).
2. **Product catalog** › **Entitlements** › **+ New** › identifiant **`AU_FIL_DE_NOUS_PREMIUM`** › **Attach** les 6 produits.
3. **Product catalog** › **Offerings** › **+ New** › identifiant `default` › **Make current** (doit être l'offering courante).
   Dans l'offering › **+ New package** (3 fois) :

   | Package | Produit Apple | Produit Google |
   |---|---|---|
   | **Monthly** (`$rc_monthly`) | `aufildenous_premium_monthly` | `aufildenous_premium:monthly` |
   | **6 Month** (`$rc_six_month`) | `aufildenous_premium_6months` | `aufildenous_premium:six-months` |
   | **Annual** (`$rc_annual`) | `aufildenous_premium_annual` | `aufildenous_premium:annual` |

   Sur Google, si l'offre `essai-3-jours` ne doit **jamais** s'appliquer à une autre offre de base, ne lui mettez pas
   l'étiquette `rc-ignore-offer` ; mettez cette étiquette sur toute offre « déterminée par le développeur » que vous
   ne voulez pas voir appliquée automatiquement.

### 3.3 Clés
**Project settings** › **API keys** :
- clé publique de l'app iOS (`appl_…`) → variable de build **`EXPO_PUBLIC_REVENUECAT_APPLE_KEY`** ;
- clé publique de l'app Android (`goog_…`) → **`EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`** ;
- **Secret API keys** › **+ New** : une clé secrète utilisable avec l'API REST **v1** (le serveur appelle
  `GET` et `DELETE https://api.revenuecat.com/v1/subscribers/{app_user_id}`) → secret Supabase
  **`REVENUECAT_SECRET_API_KEY`**. Ne jamais la mettre dans l'application ni dans `.env` commité.

Les variables `EXPO_PUBLIC_…` se renseignent dans EAS (`eas env:create` ou expo.dev › projet › **Environment variables**),
pour les profils *development*, *preview* et *production*.

### 3.4 Webhook
**Integrations** › **Webhooks** › **Add new configuration** :
- **Name** : Supabase ;
- **URL** : `https://<ref>.supabase.co/functions/v1/revenuecat-webhook` ;
- **Authorization header value** : `Bearer <valeur de REVENUECAT_WEBHOOK_SECRET>` (une longue chaîne aléatoire,
  par ex. `openssl rand -hex 32`, mise aussi dans les secrets Supabase) ;
- **Environment** : *Both* (production et sandbox) pendant les tests ; ensuite *Production* si vous ne voulez plus que les
  achats Sandbox modifient la base (sinon ils sont enregistrés avec `environment = sandbox`, visibles dans « Mon abonnement ») ;
- **App** : toutes ; **Events** : tous.
Puis **Send test event** : la fonction répond `200 { ok: true, test: true }`.

### 3.5 Comportement de transfert (restauration)
**Project settings** › **General** › **Restore behavior** › **Transfer to new App User ID** (valeur par défaut,
recommandée par RevenueCat quand un compte est obligatoire avant l'achat). Si un même identifiant Apple / Google est
utilisé sur deux comptes Au fil de nous, l'achat suit le compte qui restaure ; le serveur reçoit `TRANSFER` et retire
les droits de l'ancien compte. « Keep with original App User ID » bloquerait la restauration sur le nouveau compte.

---

## 4. Supabase

### 4.1 Secrets (noms seulement)
Supabase › **Edge Functions** › **Secrets** (ou `supabase secrets set NOM=valeur`, sans jamais commiter la valeur) :

| Nom | Rôle |
|---|---|
| `REVENUECAT_WEBHOOK_SECRET` | valeur attendue dans l'en-tête `Authorization: Bearer …` du webhook |
| `REVENUECAT_SECRET_API_KEY` | relecture de la fiche abonné (webhook, `subscription-sync`) et suppression du client RevenueCat avec le compte |
| `REVENUECAT_ENTITLEMENT` | `AU_FIL_DE_NOUS_PREMIUM` (facultatif : c'est la valeur par défaut) |

### 4.2 Base et fonctions
```bash
supabase db push                                    # applique 20261105000100_subscription_v2.sql (additive)
supabase functions deploy revenuecat-webhook        # verify_jwt = false (secret partagé), voir supabase/config.toml
supabase functions deploy subscription-sync         # verify_jwt = true (jeton de connexion obligatoire)
supabase functions deploy delete-account
# ou tout d'un coup : ./scripts/deploy-supabase.sh <project-ref>
```
La migration ajoute des colonnes à `subscriptions` (début, fin d'essai, prix, devise, remboursement, pause…), les statuts
`refunded` et `paused`, la formule `six_months`, la règle « échéance nulle ≠ Premium sans fin » et le partage limité à
un co-parent. Aucune colonne ni donnée n'est supprimée ; un bloc de retour arrière est en fin de fichier.

### 4.3 Build
Les achats intégrés ne fonctionnent **ni dans Expo Go ni sur le web** : build de développement ou TestFlight / test interne
(`eas build --profile development --platform ios|android`). Sur le web, la page Premium indique que l'abonnement se prend
dans l'application iPhone / Android.

---

## 5. Tests manuels sur appareil (Sandbox Apple / testeurs Google)

À faire sur iPhone (compte Sandbox) **et** sur Android (testeur de licence, version installée depuis le test interne).
Après chaque étape, vérifier dans l'app **Profil › MON ABONNEMENT** (formule, statut, dates, prix, boutique « achat de
test ») et, dans Supabase, la ligne de `public.subscriptions` de la personne. RevenueCat › **Customers** › rechercher
l'UUID Supabase montre l'historique des événements.

| # | Scénario | Comment | Résultat attendu |
|---|---|---|---|
| 1 | Gratuit | Nouveau compte, ne rien acheter | Statut « Gratuit » ; fonctions Premium en aperçu ; aucune fonction gratuite bloquée |
| 2 | Éligible à l'essai | Nouveau compte Sandbox / testeur jamais abonné, ouvrir la page Premium | Mensuel : « 3 jours gratuits » et « Essai gratuit de 3 jours, puis premier prélèvement de … le … » ; 6 et 12 mois : aucun essai |
| 3 | Pendant l'essai | Acheter le mensuel avec l'essai | Statut « Essai », « Fin de l'essai » = J+3 ; fonctions Premium débloquées après confirmation serveur |
| 4 | Après l'essai | Laisser l'essai se terminer (accéléré) ; puis refaire en résiliant pendant l'essai | Sans résiliation : « Actif », prix du mensuel ; avec résiliation : retour « Gratuit » / « Expiré », données conservées |
| 5 | Mensuel actif | Acheter le mensuel (compte déjà passé par l'essai) | Pas d'essai proposé ; « Actif », « Mensuel », prochain renouvellement à M+1 |
| 6 | Semestriel actif | Acheter 6 mois | « 6 mois », badge ÉCONOMISEZ, économie calculée sur les prix réels |
| 7 | Annuel actif | Acheter 12 mois | « 12 mois », badge MEILLEURE OFFRE, prix par mois calculé |
| 8 | Annulation | Résilier dans Réglages › Abonnements (iOS) / Play Store › Abonnements | « Annulé », droits jusqu'à l'échéance, puis « Expiré » ; notification « Renouvellement désactivé » |
| 9 | Échec de paiement | iOS : App Store Connect › Utilisateurs et accès › Sandbox › compte de test › activer l'échec de renouvellement (« Interrupt purchases » / « Billing retry », selon la version) ; Android : avant un renouvellement, remplacer le moyen de paiement du testeur par la carte de test « toujours refusée » dans Play Store › Paiements et abonnements | « Période de grâce » (Premium maintenu) puis « Problème de paiement » ; bannière « mettre à jour le moyen de paiement » |
| 10 | Restauration | Supprimer la ligne `subscriptions` dans Supabase (environnement de test) puis « Restaurer mes achats » | `subscription-sync` relit RevenueCat : la ligne revient, Premium revient |
| 11 | Changement de téléphone | Se connecter au même compte sur un 2ᵉ appareil (même identifiant Apple / Google) | Même Premium sans rachat (même appUserID) ; « Restaurer » non nécessaire |
| 12 | Suppression de compte | Profil › Supprimer le compte (abonnement en cours) | Compte et ligne supprimés ; client RevenueCat supprimé (RevenueCat › Customers : introuvable) ; l'abonnement boutique reste à résilier dans le store (rappel dans les CGU) |
| 13 | Réinstallation | Désinstaller, réinstaller, se reconnecter | Premium retrouvé automatiquement (synchronisation à l'ouverture si nécessaire) |
| 14 | Remboursement | iOS : demande de remboursement Sandbox (reportaproblem / StoreKit « Refund ») ; Google : Play Console › Commandes › Rembourser (révoquer) | Webhook `CANCELLATION` + `cancel_reason = CUSTOMER_SUPPORT` → « Remboursé », **droits retirés immédiatement**, notification « Abonnement remboursé » |
| 15 | Tentative de contournement | Couper le réseau pendant l'achat ; tenter `insert/update` sur `subscriptions` avec la clé anon ; modifier l'heure du téléphone | Aucun Premium sans confirmation du serveur ; écritures refusées (testé aussi dans `supabase/tests/sql/80_subscription_v2.sql`) |
| + | Changement de formule | Mensuel → 12 mois, puis 12 mois → mensuel | Une seule souscription dans le store ; montée immédiate (prorata), descente à l'échéance ; « Mon abonnement » affiche la formule effective |
| + | Partage | Abonnée + co-parent + 2ᵉ co-parent + accompagnant | Seul le 1ᵉʳ co-parent arrivé a Premium (« Offert par … ») ; le 2ᵉ co-parent et l'accompagnant restent en gratuit |
| + | Anglais | Langue de l'appli en anglais | Page, feuille et « My subscription » entièrement en anglais ; notifications du webhook en anglais si la langue du profil est `en` |

Documentation RevenueCat utilisée :
- Événements et champs du webhook : https://www.revenuecat.com/docs/event-types-and-fields
- Webhooks (en-tête d'autorisation, nouvelles tentatives, relire `GET /subscribers`) : https://www.revenuecat.com/docs/integrations/webhooks
- API REST v1 (lecture / suppression d'un client) : https://www.revenuecat.com/docs/api-v1/customers
- Offres et éligibilité (Google Play, iOS) : https://www.revenuecat.com/docs/subscription-guidance/subscription-offers
- Comportement de restauration / transfert : https://www.revenuecat.com/docs/projects/restore-behavior
