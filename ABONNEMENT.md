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
| Produit Famille (26/11/2026, **identifiant proposé, à confirmer**) | **`homi_family_monthly`** — 1 mois — **19,99 €** — même groupe, **niveau le plus élevé** |
| Packs de crédits HOMI IA (achats **consommables**, identifiants proposés) | **`homi_credits_300`** 2,99 € · **`homi_credits_800`** 5,99 € · **`homi_credits_2000`** 11,99 € |
| Droit (entitlement) RevenueCat | **`HOMI_PREMIUM`** (les 4 abonnements, Famille compris ; les packs : **aucun** droit) |
| Offering RevenueCat | **`default`**, marquée **Current** ; offering **`credits`** pour les 3 packs |
| Packages | **`$rc_monthly`** (Monthly), **`$rc_six_month`** (6 Month), **`$rc_annual`** (Annual), **`family_monthly`** (personnalisé, produit Famille) |
| Webhook | `https://ploatloxxigplpdsqyri.supabase.co/functions/v1/revenuecat-webhook` |
| appUserID RevenueCat | identifiant Supabase (UUID) de la personne connectée |

Ce que fait l'application avec ces réglages :

- **Prix** : l'écran Premium affiche **toujours les prix renvoyés par l'App Store** (StoreKit, via RevenueCat). Le prix
  par mois et l'économie (« économie de 33 % ») sont **calculés** à partir de ces prix réels, arrondis vers le bas. Avec
  la grille ci-dessus : 6 mois ≈ 11,67 €/mois (économie de 22 %), 12 mois ≈ 10,00 €/mois (économie de 33 %). La grille
  n'est écrite dans le code **que pour le mode démonstration** (« Découvrir sans compte »), signalée comme telle.
- **Essai** : la chronologie « Aujourd'hui → Pendant 3 jours (date exacte de fin) → Le <date> : premier prélèvement et
  son montant », la marche à suivre pour annuler et le bouton « Commencer l'essai de 3 jours »
  n'apparaissent **que si** l'App Store propose une offre d'introduction gratuite sur la formule choisie **et** qu'Apple
  confirme que la personne y a droit (Apple n'accorde l'essai qu'**une fois par groupe d'abonnements**). Sinon le bouton
  dit « S'abonner — 119,99 € / an » (prix réel).
- Les 3 formules Premium donnent **exactement le même Premium**. Un abonnement Premium couvre l'abonné·e et **un**
  co-parent adulte du foyer, sans supplément, avec **1 000 crédits HOMI IA par mois** (compte du payeur, partagé avec cet
  adulte).
- **HOMI Famille** (26/11/2026) : le même Premium pour **tous les adultes** (owner / coparent) du foyer de la personne
  abonnée, et **1 500 crédits HOMI IA par mois en commun**. C'est le niveau le plus élevé du groupe : depuis Premium, la
  montée est immédiate (prix au prorata par Apple). La formule est reconnue par l'**identifiant de produit**
  (`homi_family_*`), jamais par le type de package. Une nounou invitée ne reçoit pas Premium.
- **Crédits HOMI IA** : règles, coûts, packs, tables et tests : **[docs/CREDITS_IA.md](docs/CREDITS_IA.md)**. Sans
  abonnement, aucun crédit (Premium strict) ; les packs ne se proposent qu'avec un abonnement actif. La page
  d'abonnement explique les crédits **sans promesse** : tant que l'assistant n'est pas ouvert, elle l'écrit.
- Les anciennes offres « Assistant IA » (`aufildenous_ai_monthly`) et outils à vie (`aufildenous_tool_*`) ne sont **plus
  affichées ni vendues** (données conservées, droits passés honorés) : docs/CREDITS_IA.md § 9.
- **Renouvellement automatique** : écrit en clair juste sous le bouton d'achat (« Renouvellement automatique : 119,99 €
  par an, jusqu'à résiliation. »), donc visible en même temps que lui sans défiler, sur l'écran Premium comme sur la page
  d'abonnement (même bloc `PurchaseCta`).
- Un·e abonné·e qui rouvre l'écran Premium voit **sa formule actuelle et « Gérer l'abonnement »**, jamais l'offre de
  nouveau client.
- Aucune notification de fin d'essai n'est programmée par HOMI : l'écran ne promet donc aucun rappel.

### 0.1 Modèle « Premium strict » (rappel)
Sans Premium, un compte garde : inscription, connexion, présentation, onboarding, profil, réglages (compte,
confidentialité, langue, notifications, foyer, synchronisation, abonnement), **export et suppression de toutes ses
données**, urgences, alertes officielles de rappel de produits, sources, mentions légales, « Donner mon avis ».
Le reste affiche l'écran Premium : les écrans de suivi étant réservés, les données déjà saisies ne se **consultent**
plus à l'écran sans Premium — elles restent conservées et s'exportent (Réglages › Confidentialité). Le serveur refuse les nouvelles saisies sans Premium
(`20261108000300_premium_strict.sql`) ; **aucune donnée n'est supprimée à la fin d'un abonnement**. Interrupteur de
secours (admin) : `update public.premium_policy set strict = false;`.

### 0.2 Ce que la page d'abonnement affirme, et d'où vient chaque affirmation (17/11/2026)

Page : **Réglages › Abonnement** (`src/app/settings/subscription.tsx`). Le contenu du comparatif est déclaré dans
`src/features/premium/offerModel.ts` ; `src/__tests__/subscriptionPage.test.tsx` échoue si une affirmation cesse d'être
vraie dans le code. Textes : `src/i18n/<langue>/sub3.ts` (5 langues), `pay2.ts`, `sub2.ts`.

**Bloc « Sans abonnement »** — n'est annoncé que ce qui s'ouvre réellement sans Premium (`isFreeRoute`,
`src/lib/premium/access.ts`, lignes 15 à 25) :

| Ce que dit la page | Preuve |
|---|---|
| Urgences : numéros d'urgence, contraception d'urgence, « Je craque », mode urgence du foyer | `access.ts:22` (`/emergency`, `/contraception/emergency`, `/family/(sos\|urgent)`) ; outils `emergency`, `avoid_emergency`, `family_sos`, `family_urgent` du registre |
| Aide après la naissance, alertes officielles de rappel de produits, sources et références | `access.ts:22` (`/postpartum/support`), `access.ts:24` (`/scanner/recalls`), `access.ts:20` (`/sources`) ; outils `pp_support`, `recall_alerts`, `sources` |
| Compte, profil, parcours, présentation de HOMI | `access.ts:16-19` (`/discover`, `/journeys`, `/profiles/new`, `/profile`, `/settings/account`) |
| Réglages : confidentialité, langue, notifications, foyer, synchronisation, abonnement | `access.ts:19` (liste fermée ; **`/settings/appearance`, `/settings/home`, `/settings/reminders`, `/settings/services`, `/settings/iphone-calendar` n'y sont pas** : la page ne les annonce pas) |
| Export de toutes les données, suppression du compte ; rien n'est effacé à la fin d'un abonnement | `/settings/privacy` (`access.ts:19`, `src/app/settings/privacy.tsx`) ; `supabase/migrations/20261108000300_premium_strict.sql:17` (« Aucune donnée n'est modifiée ni supprimée ») |
| Mentions légales, « Donner mon avis » | `access.ts:16` (`/legal/…`), `access.ts:20` (`/feedback`) |

Outils gratuits du registre (`src/lib/journeys/tools.ts`, statut calculé par `isFreeRoute`) : **7 outils sur 120** —
`emergency`, `sources`, `avoid_emergency`, `pp_support`, `family_urgent`, `family_sos`, `recall_alerts`. (L'audit en
comptait 9 : les deux autres, `settings` et `journeys`, sont des entrées « Mon compte », pas des outils.)

**Bloc « HOMI Premium »** — quatre besoins ; chaque outil cité existe dans le registre et est réservé à Premium
(test « chaque outil cité existe dans le registre et est réservé ») :

| Besoin | Outils du registre cités |
|---|---|
| Pour moi | `cycle_home`, `avoid_contraception`, `ttc_cycle`, `preg_evolution`, `pp_recovery`, `mood`, `sleep` |
| Pour mon enfant | `baby_bottle`, `baby_breastfeed`, `baby_diaper`, `kid_sleep`, `baby_foods`, `kid_grow`, `kid_vaccines`, `kid_treatments` |
| Pour ma famille | `family_tasks`, `family_routines`, `family_calendar`, `family_shopping`, `family_stocks`, `family_nights`, `mental_load` |
| Mes outils | `meals`, `meal_menu`, `scan_product`, `documents`, `appointments`, `summary`, `library`, `community` |

L'assistant IA n'est **pas** annoncé (`src/config/features.ts` : `aiAssistantOnline: false`, « bientôt disponible »).

**Bloc « En famille »** :

| Ce que dit la page | Preuve |
|---|---|
| Un autre adulte du foyer profite du même Premium sans supplément | `public._premium_of` (`supabase/migrations/20261105000100_subscription_v2.sql:91-108`) : droit accordé à l'abonné·e **ou** à l'adulte (rôle `owner` / `coparent`) désigné par `_premium_partner_of` ; aucun produit ni prix associé |
| Un seul autre adulte : le premier co-parent arrivé dans le foyer de l'abonné·e, sinon la personne qui a créé le foyer que l'abonné·e a rejoint | `public._premium_partner_of` (même fichier, lignes 72-89 : `order by prio, since, partner limit 1`) |
| Une nounou invitée ouvre sans abonnement les écrans de garde et y enregistre ses saisies ; elle ne reçoit pas Premium pour ses propres outils | `supabase/migrations/20261113000100_caregiver_premium.sql:43` (`_require_premium_write` : saisie d'un membre `caregiver` dans le foyer jamais bloquée) et `:58` (`my_access.caregiver`) ; `CAREGIVER_ROUTES` (`access.ts:35`) ; `_premium_of` ne donne rien au rôle `caregiver` |

**Formules, essai, conditions** (mêmes fonctions sur l'écran Premium et sur la page : `src/features/premium/paywallModel.ts`) :

| Ce que dit la page | Preuve |
|---|---|
| Prix de chaque formule | `priceString` de la boutique (`buildPlans`, `src/lib/premium/plans.ts`) ; démonstration : `DEMO_GRID` (`plans.ts:35`), signalée « Démonstration » |
| « 10,00 € / mois », « économie de 33 % » | `perMonthAmount` (`plans.ts:105`), `savingsPct` (`plans.ts:98`) — calculés sur les prix réels, jamais écrits |
| « Le plus avantageux » + « son prix ramené au mois est le plus bas » | `recommendedPeriod` (`paywallModel.ts:17`) : la formule à la plus forte économie calculée ; aucune économie calculable → aucun badge |
| Essai : durée, date de fin, date et montant du premier prélèvement, comment annuler | `trialDaysOf` (`plans.ts:87`), `applyTrialEligibility` (`src/lib/purchases.ts:124`, éligibilité confirmée par Apple), `billingDates` (`plans.ts:145`), `trialTimeline` (`paywallModel.ts:57`) |
| Non éligible : aucune mention d'essai | `trialDays = 0` → `trialTimeline` vide, bouton « S'abonner — <prix> / <période> », `purchaseTerms` sans essai (`paywallModel.ts:87`) |
| Renouvellement automatique, annulation, origine du prix | `purchaseTerms` → bloc `PurchaseCta` / `PurchaseFinePrint` (`src/features/premium/PurchaseCta.tsx`) |
| Vue abonné : formule, échéance ou fin d'accès, origine (achat personnel / partagé par …) | `entitlement` (`src/lib/premium/entitlement.ts`), `subscriberSummary` (`paywallModel.ts:120`), RPC `my_premium_share` |
| « Gérer mon abonnement » | abonné·e : feuille Apple `showManageSubscriptions` (`purchases.ts`) ; sinon lien `MANAGE_URLS` (`src/lib/purchaseMode.ts`) : `https://apps.apple.com/account/subscriptions` |

Garde-fous : aucun compte à rebours, aucune urgence, aucune case à cocher ; « Continuer sans m'abonner » toujours
affiché ; la formule conseillée est seulement présélectionnée (bouton radio, modifiable d'un geste) ; les textes
d'abonnement des 5 langues ne contiennent ni prix, ni pourcentage, ni durée d'essai en dur (test Jest).

**Démonstration** (aucune boutique) : l'essai n'y est proposé qu'une fois par compte (`demo_trial_used`,
`src/lib/backend/demo.ts`), et le partage familial rejoue la règle du serveur (`premiumPartnerOf`, `my_premium_share`).

**Écarts connus entre le code et la configuration de la boutique** (non corrigés ici, à trancher) :
- `aufildenous_ai_monthly` (droit `ASSISTANT_IA`) et `aufildenous_tool_*` (droits `TOOL_…`) sont de **vrais identifiants
  de produits et de droits** dans le code (`src/lib/premium/offers.ts`, table `public.paid_tools` des migrations
  `20261107000200` et `20261107000300`, `purchaseOffer`). Ils ne correspondent à aucun des trois produits de la boutique
  HOMI. Ils n'ont pas été renommés ; la carte « Assistant IA » a été retirée de la page d'abonnement (offre sans produit).
- `/settings/appearance` (palettes) est réservé à Premium par `access.ts` : sans doute involontaire.
- Les textes `ALWAYS_FREE` (`src/lib/premium/features*.ts`) promettent encore « accès à toutes les données déjà créées »
  et « signalement et blocage dans la communauté » : ces écrans sont réservés. Ils ne sont plus affichés par la page.

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
| 1 (le plus élevé) | `homi_family_monthly` (HOMI Famille, 19,99 €/mois) |
| 2 | `homi_premium_annual` |
| 3 | `homi_premium_6months` |
| 4 | `homi_premium_monthly` |

Famille au niveau 1 : passer de n'importe quel Premium à Famille prend effet **tout de suite** (prorata) ; revenir de
Famille à Premium prend effet à l'échéance. Créez le produit Famille comme les autres (§ 1.2 : durée 1 mois, prix
19,99 €, localisation « HOMI Famille », sans essai gratuit : Apple ne l'accorderait de toute façon qu'une fois par groupe).
Les **3 packs de crédits** se créent ailleurs : **Monétisation › Achats intégrés › +** › type **Consommable** — voir
docs/CREDITS_IA.md § 7.

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
`homi_premium_6months`, `homi_premium_annual`, `homi_family_monthly` (abonnements) et `homi_credits_300`,
`homi_credits_800`, `homi_credits_2000` (consommables) — app : HOMI iOS.

### 2.4 Droit `HOMI_PREMIUM`
**Product catalog** › **Entitlements** › **+ New** › identifiant **`HOMI_PREMIUM`** (description « HOMI Premium ») ›
**Attach** › cocher les **4** abonnements (dont `homi_family_monthly`). **Ne pas** rattacher les packs de crédits à un
droit : ils sont crédités par le webhook (NON_RENEWING_PURCHASE) dans le grand livre du serveur.

### 2.5 Offering `default` et ses 3 packages
**Product catalog** › **Offerings** › **+ New** › identifiant **`default`**, description « HOMI Premium » › puis
**Make current** (elle doit être l'offering courante). Dans l'offering › **+ New package**, trois fois :

| Package (identifiant) | Produit iOS |
|---|---|
| **Monthly** (`$rc_monthly`) | `homi_premium_monthly` |
| **6 Month** (`$rc_six_month`) | `homi_premium_6months` |
| **Annual** (`$rc_annual`) | `homi_premium_annual` |
| **Custom** `family_monthly` | `homi_family_monthly` |

Puis une **seconde** offering **`credits`** (sans « Make current ») avec 3 packages personnalisés `credits_300`,
`credits_800`, `credits_2000` → `homi_credits_300`, `homi_credits_800`, `homi_credits_2000`.

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
# Crédits HOMI IA (26/11/2026) : migration 20261126000100_credits_ia.sql, puis
supabase functions deploy assistant assistant-demo scan-explain document-read document-extract community-ai cycle-photo
```
Ordre complet de mise en service des crédits : docs/CREDITS_IA.md § 8.
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
| 1 | Prix réels | Ouvrir l'écran Premium, puis Réglages › Abonnement | 3 formules aux prix de l'App Store ; 12 mois en tête « Le plus avantageux » ; « économie de 22 % / 33 % » calculées ; renouvellement automatique lisible sous le bouton sans défiler ; aucune mention « démonstration » |
| 2 | Essai éligible | Compte Sandbox neuf | « 3 jours offerts » sur chaque formule ; chronologie avec la date réelle J+3 ; bouton « Commencer l'essai de 3 jours » |
| 3 | Achat avec essai | Choisir 12 mois › Commencer l'essai › valider la feuille Apple | Feuille Apple « essai gratuit de 3 jours » ; Premium ouvert **après** confirmation du serveur ; statut « Essai », fin d'essai = J+3 |
| 4 | Fin d'essai | Laisser l'essai se terminer (quelques minutes en Sandbox) | Statut « Actif », premier prélèvement au prix de la formule |
| 5 | Essai déjà utilisé | Rouvrir Premium avec le même compte Sandbox, sans abonnement | **Aucun** essai affiché ; bouton « S'abonner — <prix> / <période> » |
| 6 | Achat sans essai | Compte Sandbox ayant déjà eu l'essai | Prélèvement immédiat ; statut « Actif » |
| 7 | Abonné·e | Rouvrir `/premium` et Réglages › Abonnement en étant abonné·e | Formule actuelle, prochaine échéance, origine « Achat personnel », « Gérer mon abonnement » (feuille Apple), « Changer de formule » sans essai ; aucune offre de nouveau client |
| 7 bis | Abonné·e partagé·e | Second compte adulte (co-parent) du foyer d'un·e abonné·e, sans achat | « Premium vous est offert par <prénom> », origine « Partagé par <prénom> », ni formules ni bouton de gestion |
| 7 ter | Gérer sans abonnement | Réglages › Abonnement › « Gérer mon abonnement » sans abonnement | La page Abonnements du compte Apple s'ouvre |
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
| 18 | Famille | Premium mensuel › Réglages › Abonnement › « Passer à Famille » | Feuille Apple (prorata) ; formule « Famille » ; 1 500 crédits dans « Mes crédits » ; co-parents du foyer en Premium |
| 19 | Crédits et packs | Scénarios détaillés : docs/CREDITS_IA.md § 6 | — |

Ce qui est vérifié automatiquement dans le dépôt (sans StoreKit) : grille et calculs (Jest), éligibilité à l'essai
(`applyTrialEligibility`, Jest), page d'abonnement et preuves du comparatif (`subscriptionPage.test.tsx`), issues
d'achat simulées (Ask to Buy, annulation, réseau), logique serveur (Deno et
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
