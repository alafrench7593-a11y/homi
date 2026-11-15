# Abonnement « HOMI Premium » — mise en service pas à pas

Guide pour la propriétaire : tout ce qui se fait **dans les consoles** (App Store Connect, RevenueCat, Supabase, EAS) et
les tests à faire **sur un iPhone**. Le code est prêt ; aucun achat réel n'a été fait pendant le développement
(StoreKit et RevenueCat ne sont pas testables dans l'environnement de développement : seul le mode démonstration l'est).

> **HOMI est une application séparée d'« Au fil de nous » et d'IRLY.** Elle a son propre projet RevenueCat, son propre
> groupe d'abonnements Apple, ses propres identifiants de produits et son propre droit. Ne réutilisez **rien** des
> projets Au fil de nous ou IRLY (ni produit, ni clé, ni webhook).

Les libellés des consoles changent souvent : si un menu a été renommé, cherchez le libellé le plus proche. **Aucune clé ni
aucun secret ne doit être collé dans ce dépôt** : seule la clé **publique** RevenueCat va dans l'application
(`EXPO_PUBLIC_REVENUECAT_APPLE_KEY`, variable EAS), tout le reste est un **secret Supabase**.

---

## 0. Ce que le code attend (à recopier à l'identique)

| Élément | Valeur |
|---|---|
| App App Store Connect | **HOMI** — ASC App ID **6834794892** — bundle **`app.homi.family`** |
| Groupe d'abonnements Apple | **HOMI Premium** (les 3 produits dans ce **même** groupe) |
| Produit mensuel | **`homi_premium_monthly`** — 1 mois — **14,99 €** — essai gratuit 3 jours |
| Produit 6 mois | **`homi_premium_6months`** — 6 mois — **69,99 €** — essai gratuit 3 jours |
| Produit annuel | **`homi_premium_annual`** — 1 an — **119,99 €** — essai gratuit 3 jours |
| Droit (entitlement) RevenueCat | **`HOMI_PREMIUM`** |
| Offering RevenueCat | **`default`**, marquée **Current** |
| Packages | **`$rc_monthly`** (Monthly), **`$rc_six_month`** (6 Month), **`$rc_annual`** (Annual) |
| Webhook | `https://ploatloxxigplpdsqyri.supabase.co/functions/v1/revenuecat-webhook` |
| appUserID RevenueCat | identifiant Supabase (UUID) de la personne connectée |

Ce que fait l'application avec ces réglages :

- **Prix** : l'écran Premium affiche **toujours les prix renvoyés par l'App Store** (StoreKit, via RevenueCat). Le prix
  par mois et l'économie (« économie de 33 % ») sont **calculés** à partir de ces prix réels, arrondis vers le bas. Avec
  la grille ci-dessus : 6 mois ≈ 11,67 €/mois (économie de 22 %), 12 mois ≈ 10,00 €/mois (économie de 33 %). La grille
  n'est écrite dans le code **que pour le mode démonstration** (« Découvrir sans compte »), signalée comme telle.
- **Essai** : la chronologie « Aujourd'hui → Pendant 3 jours → Le <date> » et le bouton « Commencer l'essai de 3 jours »
  n'apparaissent **que si** l'App Store propose une offre d'introduction gratuite sur la formule choisie **et** qu'Apple
  confirme que la personne y a droit (Apple n'accorde l'essai qu'**une fois par groupe d'abonnements**). Sinon le bouton
  dit « S'abonner — 119,99 € / an » (prix réel).
- Les 3 formules donnent **exactement le même Premium**. Un abonnement couvre l'abonné·e et **un** co-parent adulte du foyer.
- Un·e abonné·e qui rouvre l'écran Premium voit **sa formule actuelle et « Gérer l'abonnement »**, jamais l'offre de
  nouveau client.
- Aucune notification de fin d'essai n'est programmée par HOMI : l'écran ne promet donc aucun rappel.

### 0.1 Modèle « Premium strict » (rappel)
Sans Premium, un compte garde : inscription, connexion, présentation, onboarding, profil, réglages, **consultation,
export et suppression de toutes ses données**, urgences, alertes officielles de rappel de produits, mentions légales,
« Donner mon avis ». Le reste affiche l'écran Premium. Le serveur refuse les nouvelles saisies sans Premium
(`20261108000300_premium_strict.sql`) ; **aucune donnée n'est supprimée à la fin d'un abonnement**. Interrupteur de
secours (admin) : `update public.premium_policy set strict = false;`.

---

## 1. App Store Connect — app HOMI (ASC App ID 6834794892)

Prérequis : contrat **Apps payantes** signé, informations bancaires et fiscales complètes
(App Store Connect › **Accords, taxes et banques**).

### 1.1 Créer le groupe « HOMI Premium »
1. App Store Connect › **Apps** › **HOMI** (bundle `app.homi.family`).
2. Colonne de gauche › **Monétisation** › **Abonnements**.
3. **Groupes d'abonnements** › **+** › nom de référence : **`HOMI Premium`** › **Créer**.
4. Dans le groupe › **Localisation** › **+** : français (nom affiché « HOMI Premium ») et anglais (« HOMI Premium »).

### 1.2 Créer les 3 abonnements (dans ce groupe)
Dans le groupe **HOMI Premium** › **Créer** (ou **+**), trois fois :

| Nom de référence | ID du produit (à copier exactement) | Durée | Prix France |
|---|---|---|---|
| HOMI Premium mensuel | `homi_premium_monthly` | 1 mois | 14,99 € |
| HOMI Premium 6 mois | `homi_premium_6months` | 6 mois | 69,99 € |
| HOMI Premium 12 mois | `homi_premium_annual` | 1 an | 119,99 € |

Pour **chaque** abonnement :
1. **Disponibilité** : pays où HOMI est vendue.
2. **Prix de l'abonnement** › **Ajouter un prix** › pays de référence **France** › choisir 14,99 € / 69,99 € / 119,99 €
   (si le palier exact n'existe pas, prendre le plus proche : l'application affichera le prix réel). Laisser Apple
   calculer les autres pays.
3. **Localisation de l'App Store** › **+** : français et anglais (nom affiché, description courte, sans promesse).
4. **Informations pour la revue** : une capture de l'écran Premium de HOMI (formules visibles) et une note de revue.
5. **Offre d'introduction « essai gratuit 3 jours »** : section **Prix de l'abonnement** › **+** à côté de
   **Offres de lancement** (Introductory Offers) › **Créer une offre de lancement** › pays : **tous** › début :
   aujourd'hui, **sans date de fin** › type **Gratuit** (Free) › durée **3 jours** › **Confirmer**.
   À faire sur **les trois** abonnements. Rappel : Apple n'accorde une offre de lancement qu'une fois par personne
   **et par groupe** — une personne qui a déjà essayé le mensuel ne verra pas d'essai sur le 12 mois.

### 1.3 Niveaux de service (changement de formule)
Dans le groupe **HOMI Premium**, classez les produits par niveau (glisser-déposer, **Enregistrer**) :

| Niveau | Produit |
|---|---|
| 1 (le plus élevé) | `homi_premium_annual` |
| 2 | `homi_premium_6months` |
| 3 | `homi_premium_monthly` |

Monter de niveau (mensuel → 12 mois) prend effet immédiatement, avec remboursement au prorata ; descendre
(12 mois → mensuel) prend effet à l'échéance. Un seul abonnement à la fois : jamais de double prélèvement.

### 1.4 Réglages du groupe et de l'app
- **Période de grâce de facturation** : page **Abonnements** › **Période de grâce de facturation** › activer
  (6 ou 16 jours). HOMI affiche alors « Période de grâce » et garde Premium.
- **Notifications du serveur App Store** : **Informations sur l'app** › **Notifications du serveur App Store** ›
  URL de production **et** de sandbox = l'« Apple Server Notification URL » de l'app iOS dans RevenueCat (§ 2.2),
  **version 2**.
- **Clé In-App Purchase** : **Utilisateurs et accès** › **Intégrations** › **Achats intégrés** › **+** › nom
  « RevenueCat HOMI » › **Générer** › télécharger le fichier `.p8` (**une seule fois possible**), noter l'**ID de la
  clé** et l'**Issuer ID**. Ce fichier ne va **jamais** dans le dépôt.
- **Clé secrète partagée** (App-Specific Shared Secret, encore demandée par RevenueCat pour les anciens reçus) :
  page **Informations sur l'app** › **Secret partagé propre à l'app** › **Gérer** › **Générer**. À coller seulement
  dans RevenueCat.

### 1.5 Compte Sandbox (pour les tests)
**Utilisateurs et accès** › **Sandbox** › **Comptes de test** › **+** : une adresse e-mail **jamais utilisée** comme
identifiant Apple, pays **France**. Sur l'iPhone de test : **Réglages** › **App Store** › en bas **Compte Sandbox** ›
se connecter. En Sandbox les durées sont accélérées (1 mois ≈ 5 min, 6 mois ≈ 30 min, 1 an ≈ 1 h, 3 jours d'essai ≈
quelques minutes).

---

## 2. RevenueCat — nouveau projet « HOMI »

### 2.1 Projet
1. https://app.revenuecat.com › menu des projets › **+ Create new project** › nom **HOMI**.
   (Un projet **séparé** d'Au fil de nous et d'IRLY : ne pas ajouter HOMI comme app d'un projet existant.)

### 2.2 App iOS
1. **Project settings** › **Apps** › **+ New** › **App Store**.
2. Nom : HOMI iOS ; **Bundle ID** : `app.homi.family`.
3. **In-App Purchase Key** : téléverser le `.p8` (§ 1.4), saisir l'**ID de la clé** et l'**Issuer ID**.
4. **App-Specific Shared Secret** : coller la clé secrète partagée (§ 1.4).
5. **Enregistrer**, puis copier l'**Apple Server Notification URL** affichée et la coller dans App Store Connect (§ 1.4).

### 2.3 Produits
**Product catalog** › **Products** › **+ New** (ou **Import** depuis App Store Connect) : `homi_premium_monthly`,
`homi_premium_6months`, `homi_premium_annual` (app : HOMI iOS).

### 2.4 Droit `HOMI_PREMIUM`
**Product catalog** › **Entitlements** › **+ New** › identifiant **`HOMI_PREMIUM`** (description « HOMI Premium ») ›
**Attach** › cocher les **3** produits.

### 2.5 Offering `default` et ses 3 packages
**Product catalog** › **Offerings** › **+ New** › identifiant **`default`**, description « HOMI Premium » › puis
**Make current** (elle doit être l'offering courante). Dans l'offering › **+ New package**, trois fois :

| Package (identifiant) | Produit iOS |
|---|---|
| **Monthly** (`$rc_monthly`) | `homi_premium_monthly` |
| **6 Month** (`$rc_six_month`) | `homi_premium_6months` |
| **Annual** (`$rc_annual`) | `homi_premium_annual` |

### 2.6 Clés
**Project settings** › **API keys** :
- clé **publique** de l'app iOS (commence par `appl_`) → variable EAS **`EXPO_PUBLIC_REVENUECAT_APPLE_KEY`** (§ 4) ;
- **Secret API keys** › **+ New** › nom « Supabase HOMI » (API **v1**) → secret Supabase **`REVENUECAT_SECRET_API_KEY`**
  (§ 3). Elle ne va **jamais** dans l'application ni dans un fichier du dépôt.

### 2.7 Webhook vers Supabase
1. Générez un secret aléatoire sur votre ordinateur (`openssl rand -hex 32`) ; gardez-le dans votre gestionnaire de mots
   de passe.
2. **Integrations** › **Webhooks** › **+ Add new configuration** :
   - **Name** : Supabase HOMI ;
   - **Webhook URL** : `https://ploatloxxigplpdsqyri.supabase.co/functions/v1/revenuecat-webhook` ;
   - **Authorization header value** : `Bearer <le secret généré>` ;
   - **Environment** : *Both* pendant les tests (les achats Sandbox sont enregistrés avec `environment = sandbox`) ;
   - **Events** : tous.
3. Enregistrez le même secret dans Supabase sous **`REVENUECAT_WEBHOOK_SECRET`** (§ 3), puis **Send test event** :
   la fonction doit répondre `200`.

### 2.8 Restauration
**Project settings** › **General** › **Restore behavior** › **Transfer to new App User ID** (défaut recommandé quand un
compte est obligatoire avant l'achat).

---

## 3. Supabase — secrets et déploiement

Supabase › projet HOMI (`ploatloxxigplpdsqyri`) › **Edge Functions** › **Secrets** (ou
`supabase secrets set NOM=valeur` depuis votre ordinateur, jamais dans un fichier commité) :

| Nom | Valeur |
|---|---|
| `REVENUECAT_SECRET_API_KEY` | clé secrète RevenueCat (§ 2.6) |
| `REVENUECAT_WEBHOOK_SECRET` | le secret du webhook, **sans** le mot `Bearer` (§ 2.7) |
| `REVENUECAT_ENTITLEMENT` | `HOMI_PREMIUM` |

Déploiement :
```bash
supabase db push                                # dont 20261119000200_homi_premium_ids.sql (droit HOMI_PREMIUM par défaut)
supabase functions deploy revenuecat-webhook    # verify_jwt = false (secret partagé)
supabase functions deploy subscription-sync     # verify_jwt = true
supabase functions deploy delete-account
```
La migration `20261119000200_homi_premium_ids.sql` met la valeur par défaut du droit à `HOMI_PREMIUM` et renomme
l'étiquette d'une éventuelle ancienne ligne ; elle ne supprime rien.

---

## 4. EAS — clé publique dans les builds

La clé **publique** iOS se déclare comme variable d'environnement EAS (pas dans le dépôt) :
```bash
bunx eas-cli env:create --name EXPO_PUBLIC_REVENUECAT_APPLE_KEY --value appl_xxxxxxxx \
  --environment development --environment preview --environment production --visibility plaintext
```
(ou expo.dev › projet **@alafre/homi** › **Environment variables**). Une clé publique RevenueCat n'est pas un secret,
mais on ne la commite pas pour pouvoir la changer sans nouvelle version du code. Puis :
```bash
bunx eas-cli build --profile development --platform ios   # build de développement pour les tests Sandbox
```
Les achats ne fonctionnent **ni dans Expo Go ni sur le web** : sur le web, l'écran Premium l'indique.

---

## 5. Tests Sandbox à faire sur iPhone

Build de développement ou TestFlight, compte Sandbox connecté (§ 1.5). Après chaque étape, vérifier :
l'écran **Premium** (`/premium`), **Réglages › Abonnement**, la ligne `public.subscriptions` dans Supabase et
RevenueCat › **Customers** › UUID Supabase (historique des événements).

| # | Scénario | Comment | Résultat attendu |
|---|---|---|---|
| 1 | Prix réels | Ouvrir l'écran Premium | 3 formules aux prix de l'App Store ; 12 mois en tête « Le plus avantageux » ; « économie de 22 % / 33 % » calculées ; aucune mention « démonstration » |
| 2 | Essai éligible | Compte Sandbox neuf | « 3 jours offerts » sur chaque formule ; chronologie avec la date réelle J+3 ; bouton « Commencer l'essai de 3 jours » |
| 3 | Achat avec essai | Choisir 12 mois › Commencer l'essai › valider la feuille Apple | Feuille Apple « essai gratuit de 3 jours » ; Premium ouvert **après** confirmation du serveur ; statut « Essai », fin d'essai = J+3 |
| 4 | Fin d'essai | Laisser l'essai se terminer (quelques minutes en Sandbox) | Statut « Actif », premier prélèvement au prix de la formule |
| 5 | Essai déjà utilisé | Rouvrir Premium avec le même compte Sandbox, sans abonnement | **Aucun** essai affiché ; bouton « S'abonner — <prix> / <période> » |
| 6 | Achat sans essai | Compte Sandbox ayant déjà eu l'essai | Prélèvement immédiat ; statut « Actif » |
| 7 | Abonné·e | Rouvrir `/premium` en étant abonné·e | Formule actuelle + « Gérer l'abonnement » (feuille Apple), aucune offre de nouveau client |
| 8 | Restauration | Supprimer l'app, réinstaller, se reconnecter › « Restaurer les achats » | « Achats restaurés », Premium retrouvé (le serveur relit RevenueCat) |
| 9 | Expiration | Résilier puis laisser la période passer | « Annulé » (Premium jusqu'à l'échéance) puis « Expiré » ; données conservées et exportables |
| 10 | Annulation de la feuille | Ouvrir la feuille Apple puis **Annuler** | Message « Achat annulé. Rien n'a été prélevé. » ; aucun Premium |
| 11 | Annulation d'abonnement | Réglages iOS › [votre nom] › Abonnements › HOMI Premium › Annuler | Webhook `CANCELLATION` → « Annulé », droits jusqu'à l'échéance |
| 12 | Changement de formule | Mensuel → 12 mois, puis 12 mois → mensuel (depuis Gérer l'abonnement) | Un seul abonnement ; montée immédiate (prorata), descente à l'échéance ; formule affichée à jour |
| 13 | Ask to Buy | Compte Sandbox enfant d'un partage familial (ou « Demander l'achat » via StoreKit) | Message « Demande envoyée pour approbation… » ; **aucun** Premium tant que le parent n'a pas accepté ; Premium après acceptation |
| 14 | Réseau coupé | Mode avion au moment de l'achat | Message « Connexion impossible… » ; aucun faux succès ; « Restaurer » retrouve un achat passé |
| 15 | Échec de paiement | App Store Connect › Sandbox › compte de test › interrompre les renouvellements | « Période de grâce » (Premium maintenu) puis « Problème de paiement » |
| 16 | Remboursement | Demande de remboursement Sandbox | « Remboursé », droits retirés immédiatement |
| 17 | Depuis l'onboarding | `/premium?from=onboarding` › acheter, ou « Plus tard » | Retour à l'accueil dans les deux cas |

Ce qui est vérifié automatiquement dans le dépôt (sans StoreKit) : grille et calculs (Jest), éligibilité à l'essai
(`applyTrialEligibility`, Jest), issues d'achat simulées (Ask to Buy, annulation, réseau), logique serveur (Deno et
`supabase/tests/sql/80_subscription_v2.sql`, `80h_homi_premium_ids.sql`), parcours complet en démonstration
(`e2e/paywall_premium.py`).

Documentation RevenueCat :
- Événements du webhook : https://www.revenuecat.com/docs/event-types-and-fields
- Webhooks : https://www.revenuecat.com/docs/integrations/webhooks
- Offres d'introduction et éligibilité : https://www.revenuecat.com/docs/subscription-guidance/subscription-offers
- Restauration : https://www.revenuecat.com/docs/projects/restore-behavior

---

## Annexe — Android (plus tard)

L'application gère aussi Google Play (mêmes 3 formules ; un abonnement `homi_premium` à 3 offres de base `monthly`,
`six-months`, `annual`, ou 3 abonnements aux identifiants ci-dessus ; offre « essai 3 jours » réservée aux nouveaux
clients sur chaque offre de base, éligibilité **déterminée par Google**). Clé publique : `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`.
À configurer quand HOMI sortira sur Android (Play Console › Monétiser › Abonnements ; RevenueCat › + New › Play Store).
