# Crédits HOMI IA — règles, grand livre, achats, mise en service

État au 26/11/2026. Ce document décrit ce que le code fait **réellement** et ce que la propriétaire doit créer dans les
consoles. L'assistant en ligne reste **éteint** (aucune clé Gemini n'existe) : tout a été testé avec des doubles
(base PostgreSQL locale, faux webhook, faux magasin de démonstration). Aucun achat réel, aucun appel à Gemini ou à
RevenueCat n'a été fait.

Fichiers principaux :

| Rôle | Fichier |
|---|---|
| Migration (tables, RPC, RLS, Famille, export RGPD) | `supabase/migrations/20261126000100_credits_ia.sql` |
| Tests SQL | `supabase/tests/sql/98zf_credits_ia.sql` (via `supabase/tests/run-local.sh`) |
| Logique serveur pure (produits, octrois, flux facturé) | `supabase/functions/_shared/credits.ts` |
| Interrupteur serveur de l'IA | `supabase/functions/_shared/ai-switch.ts` |
| Assistant facturé | `supabase/functions/assistant/index.ts` |
| Webhook RevenueCat (packs, octrois) | `supabase/functions/_shared/subscription-run.ts` |
| Modèle côté application | `src/lib/credits/model.ts`, `src/lib/data/hooks-credits.ts` |
| Achats (packs, Famille) | `src/lib/purchases.ts` (`getCreditPacks`, `purchaseCreditPack`, `getFamilyPlans`) |
| Écrans | `src/app/settings/credits.tsx` (« Mes crédits »), `src/features/credits/*` |
| Démonstration (faux magasin, mêmes règles) | `src/lib/backend/demoCredits.ts` |
| Tests Jest | `src/__tests__/creditsServer.test.ts`, `src/__tests__/credits.test.tsx` |
| Parcours navigateur | `e2e/credits_demo.py` |

---

## 1. Décisions de la propriétaire (appliquées telles quelles)

- **Pas de palier gratuit** : Premium strict conservé. Sans abonnement actif, **aucun crédit** ; « Mes crédits » l'explique.
- **API Gemini payante** : la clé `GEMINI_API_KEY` doit appartenir à un projet Google AI Studio / Google Cloud
  **avec facturation activée** (jamais le palier gratuit : ses conditions autorisent Google à utiliser les contenus pour
  améliorer ses produits, ce qui est incompatible avec des données de santé familiales). Le code ne peut pas le vérifier :
  c'est une étape de mise en service (§ 8).
- **Premium 14,99 €/mois — 1 000 crédits/mois. Famille 19,99 €/mois — 1 500 crédits/mois partagés entre les adultes
  du foyer.**
- **Packs** quand les crédits sont épuisés : **300 crédits 2,99 €**, **800 crédits 5,99 €**, **2 000 crédits 11,99 €**.
- **Prix affichés : toujours ceux de la boutique** (StoreKit via RevenueCat). Les montants ci-dessus n'existent dans le
  code que dans la grille de démonstration (`src/lib/premium/plans.ts`), signalée « démonstration » à l'écran.

## 2. Règles par défaut (choisies, toutes réglables côté serveur)

Les règles vivent dans la table `public.credit_settings` (une ligne par réglage). Les changer ne demande **ni nouvelle
version de l'application ni redéploiement** : `update public.credit_settings set value = '…', updated_at = now() where key = '…';`

| Clé | Défaut | Effet |
|---|---|---|
| `rule.consume_order` | `"monthly_first"` | Crédits mensuels d'abord, puis achetés (`"purchased_first"` inverse). |
| `rule.monthly_rollover` | `false` | Les mensuels restants **expirent au renouvellement** (ligne `expire` dans le grand livre). `true` : report. |
| — | — | Les crédits **achetés n'expirent pas** (aucune règle ne les fait expirer). |
| `grant.premium` | `1000` | Octroi mensuel Premium : **un compte par payeur**, partagé avec le second adulte déjà inclus dans Premium. |
| `grant.family` | `1500` | Octroi mensuel Famille : **solde commun du foyer** (compte rattaché au foyer). |
| `grant.trial` | `50` | Pendant l'essai gratuit de 3 jours : 50 crédits ; le total mensuel est accordé à la conversion (RENEWAL). *Choix de l'agent, à valider.* |
| `grant.dedupe_hours` | `12` | Un second octroi de même formule dans ce délai est ignoré (PRODUCT_CHANGE suivi d'un RENEWAL pour la même montée). |
| `packs` | `{"homi_credits_300":300,"homi_credits_800":800,"homi_credits_2000":2000}` | Crédits versés par pack. |
| `rule.purchase_requires_subscription` | `true` | L'application ne propose les packs qu'avec un abonnement actif. Le serveur, lui, **crédite toujours** un achat payé (au compte de l'acheteur), utilisable dès qu'il y a un abonnement. |
| `reservation.ttl_seconds` | `600` | Une réserve non réglée (fonction coupée) est restituée automatiquement après 10 min. |
| `ai.enabled` | `true` | **Interrupteur serveur de l'IA** (§ 10). |

Remboursement d'un pack (CANCELLATION RevenueCat) : on retire **les crédits non consommés du pack** =
`min(crédits du pack, solde acheté actuel)` ; **jamais de solde négatif** ; la part déjà consommée est journalisée
(`meta.already_consumed` de la ligne `refund`). Les crédits achetés n'étant pas répartis par lot, c'est l'interprétation
la plus favorable à la personne qui est appliquée.

Mois suivants d'une formule 6 mois / 12 mois : le renouvellement Apple n'arrive qu'à l'échéance ; le serveur ouvre
lui-même chaque nouveau mois de crédits à l'échéance mensuelle (`_credit_roll`, d'après l'abonnement enregistré par le
webhook, jamais d'après l'application), à la lecture du solde, à la réserve, ou par `credits_maintenance()`.

## 3. Coûts par action (`cost.<action>` dans `credit_settings`)

| Action | Coût | Branché aujourd'hui |
|---|---|---|
| `assistant_question` — question à l'assistant | 1 | **Oui** (fonction `assistant`) |
| `tool_analysis` — « Analyser avec HOMI IA » sur un outil | 3 | Bouton prêt (`AnalyzeWithAI`), posé sur aucun outil |
| `journal_summary` — synthèse de journaux choisis | 5 | Non (fonction à écrire) |
| `action_plan` — plan d'action | 3 | Non |
| `document_read` — lecture d'un document | 5 | Non : `document-read` reste « Premium + limite horaire » |
| `scan_explain` — explication d'un produit scanné | 1 | Non : `scan-explain` idem |
| `cycle_photo` — analyse d'une photo | 3 | Non : `cycle-photo` idem |
| `community_summary` — résumé / traduction d'une discussion | 1 | Non : `community-ai` idem |

Les coûts sont affichés **avant** toute action (bouton « Analyser avec HOMI IA — 3 crédits », confirmation) et lus sur
le serveur (`credits_config`). Les fonctions d'analyse existantes ne débitent pas encore : les brancher demande, dans
chacune, le même schéma que l'assistant (réserve → appel → débit si livré / restitution), décision laissée à la
propriétaire (§ 12).

**Sécurité avant tout** : la détection de détresse et les réponses de sécurité passent **avant** toute vérification de
crédit dans la fonction `assistant` ; elles ne consomment **jamais** de crédit et ne sont **jamais** bloquées par un
solde nul (vérifié par Jest sur le code de la fonction).

## 4. Tables, vue, RPC, RLS

| Objet | Rôle |
|---|---|
| `subscriptions.tier` | Colonne **générée** d'après `product_id` : `homi_family*` → `family`, sinon `premium`. Jamais écrite. |
| `credit_settings` | Réglages (§ 2, § 3). Lecture : personne connectée. Écriture : serveur / console seulement. |
| `credit_accounts` | Un compte par **payeur** (`payer_id`). `household_id` renseigné pour Famille → `holder_kind` (colonne générée) = `household`, sinon `user`. Soldes `monthly_balance`, `purchased_balance` (jamais négatifs), `monthly_allowance`, `period_start`, `period_end` (prochain renouvellement des mensuels). |
| `credit_ledger` | Grand livre **append-only** (déclencheur : ni modification ni suppression, sauf cascade à la suppression du compte). Types : `monthly_grant`, `purchase`, `reserve`, `debit`, `release`, `expire`, `refund`, `adjust`. Colonnes : `amount`, `monthly_delta`, `purchased_delta`, `action`, `source`, `idempotency_key` **unique**, `rc_transaction_id`, `product_id`, `reservation_id`, `actor_id`, `created_at`. Invariant testé : chaque solde = somme de ses mouvements. |
| `credit_reservations` | Réserve → `committed` (débit) ou `released` / `expired` (restitution). Clé `(user_id, idempotency_key)` unique. Invisible des clients. |
| vue `credit_balances` | Solde lisible (security invoker) : mensuel restant, acheté restant, utilisé cette période, prochain renouvellement. |

**RPC serveur** (exécutables par `service_role` uniquement — un client ne peut ni réserver, ni débiter, ni se créditer) :

| RPC | Effet |
|---|---|
| `credits_reserve(p_user, p_action, p_idempotency_key)` | Réserve atomique sous **verrou de ligne** du compte (deux réserves simultanées sont sérialisées). Erreurs : `premium_required` (aucun abonnement), `insufficient_credits` (avec `cost`, soldes, `next_renewal`), `ai_disabled`, `unknown_action`, `bad_idempotency_key`. Même clé → même réserve (`replay`). Expire d'abord les réserves orphelines. |
| `credits_commit(p_user, p_reservation)` | Débit définitif, **seulement si le résultat a été livré**. Idempotent. |
| `credits_release(p_user, p_reservation, p_reason)` | Restitution (échec de l'IA, coupure, réponse bloquée). Une part mensuelle d'une période close ne revient pas (journalisé `monthly_lapsed`). |
| `credits_grant_monthly(p_payer, p_tier, p_period_end, p_trial, p_idempotency_key, p_source)` | Octroi mensuel (expire le reste, sans report). Appelé par le webhook. |
| `credits_purchase(p_user, p_product, p_transaction_id, p_source)` | Pack crédité, idempotent sur la transaction. |
| `credits_refund_purchase(p_transaction_id, p_source)` | Remboursement d'un pack (§ 2). |
| `credits_maintenance()` | Réserves orphelines et mois suivants de tous les comptes. Facultatif : à planifier si pg_cron est activé (`select cron.schedule('credits', '*/10 * * * *', 'select public.credits_maintenance()');`). Sans lui, tout se fait à la volée. |

**RPC de lecture** (personne connectée) : `credits_status()` (solde, formule, renouvellement, interrupteur),
`credits_history(p_before, p_limit)` (historique paginé : type, montant, action, pack, auteur = moi ou non — **jamais**
le contenu d'une question), `credits_config()` (coûts, packs, octrois, interrupteur).

**Qui dépense quel compte** (`_credit_payer_of`) : 1) son propre abonnement actif ; 2) un abonnement **Famille** d'un
adulte (owner / coparent) de son foyer ; 3) l'abonnement **Premium** d'un adulte qui le lui partage
(`_premium_partner_of`). Un **ancien membre** retiré du foyer perd l'accès **à la seconde** ; une **nounou** n'a jamais
accès aux crédits. **RLS** : lecture de son compte et de celui dont on dépend (second adulte Premium, adultes du foyer
Famille) et de son historique ; aucune écriture par un client.

**Famille et Premium** (`_premium_of`) : Premium inchangé (abonné·e + un adulte). Famille ouvre Premium à **tous** les
adultes (owner / coparent) des foyers de la personne abonnée ; pas aux nounous. Le foyer « Famille » des crédits est
celui où vivent d'autres adultes, de préférence celui que la personne a créé.

Export RGPD : rubrique `credits` (comptes dont on est payeur, mouvements, réserves) dans `export_my_data()`.

## 5. Flux

**Assistant** (`supabase/functions/assistant/index.ts`) : interrupteur `ASSISTANT_ENABLED` → authentification → limite
de débit → **sécurité** (détresse : réponse humaine immédiate, gratuite) → consentement → anti-détournement →
IA configurée et ouverte (`GEMINI_API_KEY` + `ai.enabled`) → **réserve** (`request_id` de l'application comme clé
d'idempotence) → appel Gemini → **débit** si la réponse est livrée (SSE : seulement si l'événement `done` est remis à une
connexion encore ouverte), **restitution** sinon (Gemini en erreur, réponse bloquée remplacée par la réponse prudente,
application fermée en cours de diffusion — la lecture de Gemini s'arrête alors aussitôt). Une réserve jamais réglée
(fonction tuée) expire seule. Journaux : codes d'état uniquement. Modèle : secret `GEMINI_MODEL`.

**Webhook RevenueCat** : `NON_RENEWING_PURCHASE` d'un `homi_credits_*` → `credits_purchase` (idempotence sur
`transaction_id`) ; `CANCELLATION` d'un pack → `credits_refund_purchase` ; `INITIAL_PURCHASE` / `RENEWAL` (actif ou
essai) → `credits_grant_monthly` (clé = utilisateur + produit + échéance) ; `PRODUCT_CHANGE` vers `homi_family_*` → octroi
Famille ; descente vers Premium → rien avant le renouvellement. Erreur d'écriture → 500 : RevenueCat réessaie, sans
double crédit. Un pack acheté par un identifiant anonyme est ignoré (l'application connecte toujours le compte avant
l'achat).

**Application** : `insufficient_credits` → feuille « Vous n'avez plus de crédits » (solde, date de retour des mensuels,
3 packs aux prix de la boutique, achat via RevenueCat, restauration de l'abonnement, « Plus tard »). Écran « Mes
crédits » (Réglages › Abonnement › Mes crédits, route `/settings/credits`, ouverte sans abonnement pour expliquer
l'absence de crédits). Après l'achat d'un pack, l'application attend que le **serveur** voie le crédit (20 s), sinon
« vos crédits arrivent ». Un consommable ne se « restaure » pas : le solde est gardé par le serveur (l'écran le dit).

**Démonstration** : faux magasin (`demo_credit_purchase`), octroi à l'abonnement simulé, bouton d'essai « Analyser avec
HOMI IA » sur « Mes crédits » (aucune IA appelée, crédits de démonstration), `demo_credit_adjust` pour fixer un solde.

## 6. Scénarios de test Sandbox (iPhone, après mise en service)

| # | Scénario | Résultat attendu |
|---|---|---|
| C1 | Compte sans abonnement › « Mes crédits » | « Les crédits font partie de HOMI Premium » ; aucun pack ; assistant : `premium_required` |
| C2 | Achat Premium mensuel (sans essai) | `credit_ledger` : `monthly_grant` 1 000 ; « Mes crédits » : 1 000 mensuels, renouvellement = échéance |
| C3 | Achat avec essai 3 jours | 50 crédits ; à la conversion (RENEWAL) : 1 000, ligne `expire` du reste |
| C4 | Question à l'assistant | Réserve puis `debit` 1 ; « Utilisés ce mois-ci » = 1 |
| C5 | Question en mode avion au milieu de la réponse | Aucun `debit` ; `release` (`stream_cut`) ; solde inchangé |
| C6 | Message de détresse (« je veux mourir ») avec solde 0 | Réponse de sécurité immédiate, **aucune** ligne dans le grand livre |
| C7 | Solde à 0 : avant l'achat Sandbox d'un compte de test, réduire `grant.premium` à 2 (`update credit_settings set value='2' where key='grant.premium'`), poser 3 questions, puis remettre 1000 | 402 `insufficient_credits` ; feuille avec les 3 packs aux prix StoreKit |
| C8 | Achat du pack 300 dans la feuille | `NON_RENEWING_PURCHASE` → `purchase` 300 ; solde acheté 300 ; nouvel envoi du webhook (RevenueCat › Customers › Resend) → aucun double crédit |
| C9 | Remboursement du pack (Sandbox › Refund) | `refund` des crédits non consommés, solde jamais négatif, `already_consumed` journalisé |
| C10 | Premium → « Passer à Famille » | Feuille Apple au prorata ; `PRODUCT_CHANGE` → `monthly_grant` 1 500 ; compte `holder_kind = household` ; co-parents du foyer en Premium et sur le même solde |
| C11 | Co-parent retiré du foyer | Plus de Premium Famille, plus de lecture du solde |
| C12 | Renouvellement Sandbox (≈ 5 min) | `expire` du reste mensuel, nouvel octroi ; crédits achetés intacts |
| C13 | `update credit_settings set value='false' where key='ai.enabled'` | Assistant et analyses : « indisponible » ; tous les outils fonctionnent ; remettre `true` |

## 7. À créer par la propriétaire (identifiants exacts — **proposés, à confirmer**)

**App Store Connect** (app HOMI, ASC App ID 6834794892) :
1. **Abonnement** `homi_family_monthly` — « HOMI Famille » — 1 mois — 19,99 € — dans le groupe **HOMI Premium**, au
   **niveau 1** (au-dessus de `homi_premium_annual`) — sans offre de lancement. Localisations FR / EN, capture de la page
   d'abonnement montrant la carte Famille, note de revue : « Famille = même Premium pour tous les adultes du foyer et
   1 500 crédits IA par mois partagés ».
2. **Achats intégrés consommables** (Monétisation › Achats intégrés › + › **Consommable**) :
   `homi_credits_300` (2,99 €), `homi_credits_800` (5,99 €), `homi_credits_2000` (11,99 €) ; nom affiché « 300 crédits
   HOMI IA »… ; description « Crédits pour les analyses HOMI IA. Nécessite un abonnement HOMI Premium ou Famille. Les
   crédits achetés n'expirent pas. » ; capture de la feuille « Vous n'avez plus de crédits ».
3. Fiche App Store : mentionner les achats intégrés ; **App Privacy** : données envoyées à Google (Gemini) quand l'IA
   sera ouverte.

**RevenueCat** (projet HOMI) :
1. Produits : importer `homi_family_monthly`, `homi_credits_300`, `homi_credits_800`, `homi_credits_2000`.
2. Droit `HOMI_PREMIUM` : y rattacher **aussi** `homi_family_monthly` (la formule est lue sur l'identifiant du produit).
   Ne rattacher **aucun** droit aux packs.
3. Offering `default` : ajouter un package personnalisé `family_monthly` → `homi_family_monthly`.
4. Nouvelle offering **`credits`** (non courante) : packages `credits_300`, `credits_800`, `credits_2000`.
5. Webhook existant : rien à changer (tous les événements, dont `NON_RENEWING_PURCHASE`).

**Supabase** : rien à créer à la main (la migration crée les réglages). Secrets déjà prévus : `GEMINI_API_KEY`
(projet **payant**), `GEMINI_MODEL` (facultatif), `ASSISTANT_ENABLED`, `REVENUECAT_*`.

## 8. Ordre de mise en service

1. `supabase db push` (migration `20261126000100_credits_ia.sql`, additive : aucune donnée supprimée).
2. Déployer : `supabase functions deploy revenuecat-webhook assistant assistant-demo scan-explain document-read document-extract community-ai cycle-photo`.
3. App Store Connect et RevenueCat (§ 7). Attendre que les produits soient « Prêts à être soumis ».
4. Nouvelle version de l'application (EAS) contenant ce code : écran « Mes crédits », feuille, carte Famille.
5. Tests Sandbox C1–C13 (§ 6) **avant** d'ouvrir l'IA ; l'assistant peut rester éteint pendant les tests de packs.
6. Clé Gemini d'un projet **avec facturation** : `supabase secrets set GEMINI_API_KEY=… GEMINI_MODEL=…`.
7. Ouvrir l'IA : `supabase secrets set ASSISTANT_ENABLED=true` **et** `aiAssistantOnline: true` dans
   `src/config/features.ts` (nouvelle version). Tant que ces deux étapes ne sont pas faites, l'assistant reste
   « Bientôt disponible » et les pages le disent.
8. Optionnel : planifier `credits_maintenance()` (pg_cron).

## 9. Offres héritées (`aufildenous_ai_monthly`, `aufildenous_tool_*`)

- **Interface** : retirées de partout (carte « Assistant IA » et liste des outils à vie supprimées de
  `ToolOffer.tsx` et de la page d'abonnement).
- **Achat** : `purchaseOffer` refuse tout achat (« Cette offre n'est plus proposée ») ; `getOfferPrices` supprimé.
- **Données** : **rien n'est supprimé** — `paid_tools`, `entitlement_grants`, `_ai_plan_of`, `my_access.tools` restent ;
  un droit acheté avant reste honoré par le serveur (outil ouvert). Les produits n'ont pas à être créés pour HOMI.
- Le parcours `e2e/offres.py` (offres de novembre) décrit l'ancien écran et n'est plus valide.

## 10. Interrupteurs de l'IA et outils sans IA

| Interrupteur | Où | Effet |
|---|---|---|
| `aiAssistantOnline` | `src/config/features.ts` (faux) | L'application affiche « Bientôt disponible » ; `AnalyzeWithAI` affiche « bientôt disponible ». Nouvelle version nécessaire. |
| `ASSISTANT_ENABLED` | secret Supabase (absent) | La fonction `assistant` répond `coming_soon`. |
| **`ai.enabled`** | `credit_settings` (vrai) | **Coupure immédiate, sans nouvelle version** : `assistant`, `assistant-demo`, `scan-explain`, `document-read`, `document-extract`, `community-ai`, `cycle-photo` répondent comme une IA non configurée ; aucune réserve possible ; l'application lit `ai_enabled` (`credits_config`) et masque l'action IA. |

Les outils classiques ne dépendent **jamais** de l'IA : chaque fonction Gemini a déjà un repli « non configuré »
(explication par règles du scanner, saisie manuelle des documents, etc.), et `AnalyzeWithAI` coupé laisse l'outil
entier (`cr.ai.off`). Rien d'autre ne lit la clé Gemini.

## 11. Où poser « Analyser avec HOMI IA » (non posé : à décider)

`<AnalyzeWithAI action="tool_analysis" run={({ requestId }) => backend.invoke('…', { request_id: requestId, … })} />`
(`src/features/credits/AnalyzeWithAI.tsx`) — chaque pose demande une fonction serveur qui réserve / débite comme
l'assistant. Les 10 outils où il apporterait le plus :

1. `kid_sleep` / `kid_sleep_rhythm` — lecture des nuits de la semaine, régularités, pistes.
2. `baby_bottle` — volumes et intervalles des biberons, écarts au rythme habituel.
3. `baby_breastfeed` — rythme des tétées, côtés, durées.
4. `cycle_home` / `cycle_stats` — synthèse du cycle (durées, symptômes récurrents) — consentement santé.
5. `mood` / `me_diary` — synthèse de l'humeur et des déclencheurs (`journal_summary`) — strictement personnel.
6. `documents` — résumé d'un compte rendu ou d'une ordonnance (`document_read`).
7. `mental_load` / `family_domains` — répartition des tâches et proposition de rééquilibrage (`action_plan`).
8. `meal_menu` — menu de la semaine depuis les goûts et le garde-manger.
9. `growth` / `kid_grow` — lecture des courbes et questions à poser au pédiatre.
10. `pp_checkin` / `exhaustion_check` — synthèse post-partum et ressources (avec la sécurité en premier).

## 12. Limites connues et suite

- Les analyses existantes (`scan-explain`, `document-read`, `cycle-photo`, `community-ai`) ne débitent pas encore de
  crédits (Premium + limites horaires inchangés) ; l'interrupteur `ai.enabled` les coupe déjà.
- `assistant-demo` (3 questions/jour/appareil sans compte, si l'assistant est ouvert) n'est pas facturé : c'est un
  usage gratuit de Gemini, à garder éteint si « aucun palier gratuit » doit être strict.
- Anti-fraude : seule la limite de débit existe ; aucune règle sur la vitesse d'achats / remboursements.
- Crédits achetés sans abonnement (achat payé hors application) : conservés, utilisables avec un abonnement.
- `TRANSFER` RevenueCat : l'abonnement suit, les crédits restent au compte payeur d'origine.
- StoreKit et RevenueCat réels non testés (aucune clé) : § 6 sur iPhone.
