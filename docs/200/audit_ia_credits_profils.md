# B — IA (HOMI Aura), crédits, recherche, personnalisation, photo de profil, confidentialité

Audit en LECTURE SEULE du dépôt `/home/user/homi` (Expo SDK 57, `expo ~57.0.33`, `react-native-purchases ^10.14.0`).
Aucun fichier suivi modifié, aucune API externe appelée. Le seul code exécuté est un test Jest d'essai, placé dans le
scratchpad (`probe/__tests__/probe.test.ts`), qui appelle `searchCatalog` sur 55 formulations (voir §3).

Légende : **EXISTANT** = fonctionne et peut servir tel quel · **PARTIEL** = une base existe mais il manque des
morceaux · **ABSENT** = rien dans le code.

---

## Synthèse

| # | Sujet | Statut | En une ligne |
|---|---|---|---|
| 1a | Assistant en ligne (Gemini) | **PARTIEL** (complet mais éteint) | Fonction edge `assistant` complète : sécurité, consentement, quota, SSE, historique. Coupée par deux interrupteurs. |
| 1b | Assistant local (articles, sur l'appareil) | **EXISTANT** | Recherche BM25 dans les articles, aucune IA générative, réservée au Premium. |
| 1c | « HOMI Aura » (ouvrir des outils, synthétiser des journaux, plans, voix) | **ABSENT** | Aucun appel d'outil, aucune synthèse de journal, aucun plan, aucun code vocal. Le micro est désactivé. |
| 1d | Garde-fous et détresse | **PARTIEL** | Bonne détection en FRANÇAIS seulement. Aucun motif anglais. |
| 2a | Crédits (solde, réserve/débit/restitution) | **ABSENT** | Il n'y a qu'un compteur mensuel de questions (`assistant_usage`). Pas de grand livre, pas d'idempotence par requête. |
| 2b | Achats consommables | **ABSENT** | Le webhook ne traite que les *entitlements*. Un consommable RevenueCat n'en crée aucun et serait ignoré. |
| 2c | Abonnement Premium + partage au 2ᵉ adulte | **EXISTANT** | `subscriptions`, `_premium_of` (1 partenaire), webhook robuste (doublons, retards, remboursements, TRANSFER). |
| 2d | Offres héritées (`aufildenous_ai_monthly`, `aufildenous_tool_*`) | **EXISTANT, à retirer ou migrer** | Toujours dans le code et en base ; `purchaseOffer` n'est utilisé que par `ToolOffer.tsx`. |
| 3 | Recherche universelle en langage naturel | **PARTIEL** | Recherche locale des OUTILS dans la langue active (synonymes, pluriels, 1 faute de frappe). 42 requêtes FR + 2 EN testées. Ni articles ni données, pas de recherche dans une autre langue. Essai : ~55 % de bons résultats. |
| 4 | Personnalisation expliquable | **PARTIEL** | Préréglages d'accueil par situation, onboarding v2, favoris et masquage. Pas de moteur de règles. `onboarding_answers` n'est jamais relu. |
| 5 | Photo de profil | **EXISTANT** | Appareil photo / photothèque, recadrage carré, 512 px, JPEG sans EXIF, bucket privé, liens signés, suppression, permissions iOS. |
| 6 | Confidentialité entre parents | **EXISTANT, quelques angles morts** | Émotions, intimité et santé personnelles : propriétaire seule. Grossesse : la personne enceinte. Restent quelques cas à vérifier (§6). |

---

## 1. IA

### 1.1 Ce qui existe

**Interrupteurs (assistant éteint)**
- `src/config/features.ts:10` : `aiAssistantOnline: false`.
- `src/app/assistant/chat.tsx:61` : affiche `AiComingSoonScreen` tant que l'interrupteur est à faux.
- `supabase/functions/assistant/index.ts:47` : renvoie 503 `coming_soon` tant que le secret `ASSISTANT_ENABLED` ne vaut pas `true`.

Il faut donc **deux actions** pour rallumer l'assistant : passer l'interrupteur à vrai ET créer le secret.

**Fonction edge `supabase/functions/assistant/index.ts` (308 lignes), dans l'ordre d'exécution**
1. Authentification JWT. La base est lue avec les droits de la personne (RLS).
2. Limite de débit : 8 questions/min et 120/jour (l.60).
3. Taille de la question bornée.
4. Lecture du consentement `consents.purpose='ai_assistant'` et du réglage d'historique `privacy_settings.ai_history_*` (l.82-96).
5. **Sécurité AVANT tout le reste** (l.129) : `assessSafety` → message de crise et contacts d'urgence. Cette étape ne passe pas par l'IA, ne consomme pas de quota et ne demande pas de consentement.
6. Consentement exigé (l.148).
7. Détection d'injection de consignes (l.152).
8. Quota : `consume_assistant_quota` est réservé AVANT l'appel (l.167). S'il est atteint : erreur 402 `premium_required` ou `quota_reached`.
9. Contexte de la personne envoyé SEULEMENT si elle l'a autorisé, puis nettoyé (`sanitizeContext`).
10. Articles publiés pertinents (recherche `ilike`), cités dans la réponse.
11. Réponse structurée (`parseStructuredAnswer`), contrôlée (`auditAnswer`). Si le contrôle échoue, la réponse est remplacée par une réponse prudente.
12. Diffusion SSE, ou JSON complet.
13. Restitution du quota si Gemini échoue (`refund_assistant_quota`, l.244-247).

**Briques communes (`supabase/functions/_shared/`)**
- `gemini.ts` : fournisseur prévu = **Google Gemini**. Secret `GEMINI_API_KEY`, modèle par défaut `gemini-3.5-flash-lite` (l.12), modifiable par `GEMINI_MODEL`.
- `assistant-prompt.ts` (246 l.) : prompt système, contexte, articles.
- `assistant-format.ts` (319 l.) : format structuré (`short / actions / watch / consult / questions / sources`), anti-injection, SSE.
- `safety.ts` (147 l.) : `assessSafety` (niveaux `crisis` et `medical_urgent`), `crisisMessage`, `auditAnswer`, `urgentContacts`. Le même module est utilisé par l'application, via `src/lib/localAI/engine.ts:12`.

**Tables et fonctions SQL**
- Tables : `assistant_conversations`, `assistant_messages` (avec `safety_flags` et `safety_level`), `assistant_usage` (dans `supabase/migrations/20261015000300_services.sql:245-269`), `assistant_feedback` (`20261016000400_assistant_feedback.sql:19`). RLS : `user_id = auth.uid()`.
- Quota : `consume_assistant_quota` (`20261015000300_services.sql:290`), `refund_assistant_quota` (`20261016000400…:90`), `assistant_quota_status`.
- Règles d'accès :
  - `_plan_limit_of` (`20261110000200_assistant_payant.sql`) : sans Premium et sans l'offre IA, le quota vaut **0**.
  - `premium_policy.assistant_paid = true`.

**Assistant local, sans IA générative**
- Moteur : `src/lib/localAI/engine.ts` (357 l.), recherche BM25 dans des passages d'articles, avec synonymes FR.
- Écran : `src/app/assistant/local.tsx`.
- Accès : bloqué sans Premium. `src/lib/premium/access.ts:31` (`AI_ROUTES = /assistant(/.*)?`) n'ouvre ces écrans qu'avec le Premium ou l'offre IA.

**Écran de discussion `src/app/assistant/chat.tsx`**
- Recueil du consentement (l.286-303), diffusion, quota, retour sur les réponses.
- Contexte de la discussion préparé par `src/features/assistant.ts`.

**Écrans « analyser » qui appellent déjà Gemini**
Chacun est derrière `requirePremium`, avec une limite de débit horaire et, selon le cas, un consentement. Aucun ne compte d'unités :

| Fonction | Écran ou hook appelant | Limite de débit |
|---|---|---|
| `scan-explain` | `src/lib/data/hooks-scanner.ts:251` (explication d'un produit scanné) | 20/h |
| `document-read` | `src/app/documents/[id].tsx:125` | 20/h |
| `document-extract` | — | 10/h |
| `cycle-photo` | `src/lib/data/hooks-cycle.ts:87` (photo d'un test) | 20/h |
| `community-ai` | `src/lib/data/hooks-social.ts:250` (traduction et résumé de publications) | 30/h |

Les autres libellés « Analyser » de l'interface (`u6.sf.analyse`, `u3.fertTest.analyse` « Analyser sur le téléphone ») déclenchent des traitements LOCAUX.

### 1.2 Ce qui manque pour « HOMI Aura »

**Fonctions absentes**
- **Ouvrir des outils.** Rien ne relie l'assistant au registre des outils (`src/lib/journeys/tools.ts`). Il faudrait que la réponse structurée renvoie des identifiants d'outils VALIDÉS par le serveur, puis que l'application les ouvre (`router.push`).
- **Synthétiser des journaux choisis.** Il n'existe ni sélecteur de journaux (`cycle_journal`, `notes`, `mood_checkins`, `bottles`, `sleeps`…) ni assemblage côté serveur. À construire :
  - lecture sous RLS (`db`, jamais `admin`) ;
  - bornes : période et volume ;
  - consentement par catégorie, au minimum « santé » et « émotions/intimité ».
  Le contexte actuel ne transmet que des agrégats (`sanitizeContext`).
- **Plans d'action.** Aucun format de plan ni enregistrement en tâches ou rappels.
- **Mode vocal ElevenLabs.** Aucun code, aucune dépendance (`expo-speech`, `expo-audio`, ElevenLabs). Côté iOS, le micro est explicitement désactivé : `app.config.ts:143` (`microphonePermission: false`) et `:148` (`expo-camera` `microphonePermission: false`). Il manque aussi `NSMicrophoneUsageDescription` dans les 5 langues.

**Garde-fous à compléter**
- **Sécurité en anglais.** `safety.ts` ne contient que des motifs français : une recherche `die|hurt|breath` ne trouve rien. Pour une application FR/EN, c'est un trou critique.
- **Sécurité indépendante des crédits.** Côté serveur, c'est déjà le cas dans `assistant` (l.129, avant la vérification du quota). Il faut garder cet ordre dans tout nouveau point d'entrée et ne jamais débiter un message de crise.
- **« Jamais médecin/psy ».** C'est couvert par le prompt, `auditAnswer` et `CAUTIOUS_ANSWER` (l.30-40). Il manque des tests anglais.

**Consentement et journalisation**
- Le consentement global `ai_assistant` et l'historique facultatif existent.
- Il manque le consentement par type de données transmises (journaux, santé, voix) et la mention d'ElevenLabs comme sous-traitant (texte de confidentialité, `u1.priv.*`).

**Défauts relevés dans le code actuel**
- Flux SSE interrompu après un début de réponse (`index.ts:300`) : la question reste décomptée, sans restitution.
- Aucune clé d'idempotence par requête : un double envoi consomme deux questions.
- `refund_assistant_quota` décrémente le mois COURANT. Si le mois change entre la réserve et la restitution, le mauvais mois est corrigé.
- Valeur par défaut `APP_NAME = 'Au fil de nous'` (`assistant/index.ts:26`) et notifications « Au fil de nous Premium » (`_shared/revenuecat.ts:280,287…`) : il reste l'ancienne marque. Le secret `APP_NAME` corrige le prompt, pas les notifications.

---

## 2. Crédits et achats

### 2.1 Existant

**Premium**
- Table `subscriptions`, droit `HOMI_PREMIUM` (`20261119000200_homi_premium_ids.sql`).
- Produits `homi_premium_monthly / _6months / _annual` (`src/lib/premium/plans.ts:23-26`).
- `_premium_of` (`20261105000100_subscription_v2.sql:91`) : le Premium est partagé avec **UN** partenaire désigné (`_premium_partner_of`), parmi les rôles owner/coparent.

**Webhook RevenueCat**
- `supabase/functions/revenuecat-webhook/index.ts` → `_shared/subscription-run.ts` et `_shared/revenuecat.ts`.
- Secret vérifié.
- Événements en retard (`isStale`) et en double (`isDuplicate`, type + horodatage) ignorés.
- Remboursement (CANCELLATION/EXPIRATION avec `CUSTOMER_SUPPORT`) → statut `refunded`, droits retirés.
- `REFUND_REVERSED` traité.
- `TRANSFER` traité.
- Fiche abonné relue dans l'API REST quand `REVENUECAT_SECRET_API_KEY` est définie.

**Autres droits**
- Table `entitlement_grants` (`20261107000200_offres_ia_outils.sql:22`), copiée depuis la fiche RevenueCat (`grantsFromSubscriber`, `revenuecat.ts:337`).
- Ils sont ignorés quand l'API n'est pas configurée (`subscription-run.ts:160-165`).

**Offres héritées**

| Élément | Emplacement |
|---|---|
| `AI_PRODUCT_ID = 'aufildenous_ai_monthly'`, droit `ASSISTANT_IA`, 250 questions/mois | `src/lib/premium/offers.ts:11-13` |
| `toolProductId` = `aufildenous_tool_*` | `offers.ts:22` |
| Table `paid_tools`, 10 lignes | `20261107000200…:38-60` |
| `purchaseOffer` | `src/lib/purchases.ts:246` |
| Écran qui les vend | `src/features/offers/ToolOffer.tsx:42,72,86` |
| Exception côté serveur `_ai_plan_of` dans `_plan_limit_of` et `_require_premium_write('ai')` | `20261108000300_premium_strict.sql:54` |

**Restauration**
- `restore()` (`purchases.ts:182`) et `subscription-sync`.

**Mode démonstration**
- `set_demo_grant`.

### 2.2 Absent

- **Grand livre de crédits** : il n'y a ni solde, ni mouvements (crédit/débit/réserve/restitution/expiration), ni séparation entre crédits mensuels et crédits achetés, ni ordre de consommation.
- **Comptabilité atomique.** `consume_assistant_quota` est atomique (`update … where questions < quota`), mais :
  - il compte des questions, pas un coût variable ;
  - il n'a pas d'identifiant de requête ;
  - il ne distingue pas une réserve d'un débit définitif.
- **Consommables.** Le webhook ne lit que `subscriber.entitlements`. Un pack consommable apparaît dans `non_subscriptions` / l'événement `NON_RENEWING_PURCHASE` **sans entitlement** :
  - il serait aujourd'hui ignoré (`ignored: 'other_entitlement'`), ou pris pour le Premium ;
  - il faut créditer avec une clé `transaction_id` unique (idempotence) ;
  - pour un remboursement de consommable, il faut décider de débiter, voire de laisser un solde négatif.
- **Côté application** : `purchaseOffer` ne gère que `subscription | lifetime` et attend `my_access` (`purchases.ts:254-266`). Il n'y a pas de cas « consommable → attendre le crédit du solde ».
- **Lutte contre la fraude** : seule existe la limite de débit. Rien sur la vitesse d'achat ou de remboursement, ni sur la réception d'un même `original_transaction_id` sur plusieurs comptes.
- **Libellé « Analyser avec HOMI IA — X crédits »** : il n'existe ni clé i18n ni barème des coûts.

### 2.3 Conformité et options. Chaque option demande une décision de la propriétaire ; rien n'est tranché ici.

**Rappels**
- Des crédits utilisés dans l'application sont du contenu numérique. Sur iOS, ils doivent être vendus par achat intégré **consommable**.
- Les crédits achetés ne doivent pas expirer de façon cachée. Il faut une règle claire, et elle doit être affichée.
- La restauration ne s'applique pas aux consommables (c'est le serveur qui garde le solde). Il faut le dire dans l'interface et ne pas promettre de « Restaurer les crédits ».

**Option A — Packs de crédits consommables (300/2,99 €, 800/5,99 €, 2000/11,99 €)**
- App Store Connect : 3 achats intégrés de type *Consumable* (ex. `homi_credits_300`, `homi_credits_800`, `homi_credits_2000`), avec prix, captures pour la vérification et texte.
- RevenueCat : 3 produits, sans entitlement (ou un entitlement purement indicatif), une offering séparée (ex. `credits`) ou des packages personnalisés.
- Serveur :
  - grand livre ;
  - traitement de `NON_RENEWING_PURCHASE` dans le webhook, avec le `transaction_id` pour l'idempotence ;
  - remboursements (`CANCELLATION` sur un produit non renouvelable) ;
  - RPC `reserve_credits`, `capture_credits` et `release_credits` (idempotentes, avec `request_id`).
- Application :
  - achat avec `Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION` ;
  - attente du solde ;
  - affichage du solde et du coût avant chaque action.
- Textes : conditions et confidentialité (crédits non remboursables sauf par Apple, non transférables) et fiche App Store (mention des achats intégrés).

**Option B — Abonnement « Famille » à 19,99 €/mois avec 1500 crédits partagés**
- App Store Connect : un 4ᵉ produit d'abonnement **dans le MÊME groupe « HOMI Premium »**, à un **niveau** supérieur aux trois produits existants. Monter de Premium à Famille se fait alors immédiatement (au prorata), et redescendre se fait à l'échéance. Il faut définir le rang de chacun dans le groupe.
- Si Famille n'existe qu'en mensuel, il faut décider s'il existe un Famille 6 mois ou annuel.
- RevenueCat : nouveau produit, et soit un nouvel entitlement (ex. `HOMI_FAMILY`) qui inclut aussi `HOMI_PREMIUM` (un produit peut ouvrir deux entitlements), soit le seul `HOMI_PREMIUM` avec un niveau lu sur le produit.
- Code qui casse en l'état :
  - `src/lib/premium/plans.ts:69-72,126` déduit la formule du **type de package** (`$rc_monthly` → `monthly`). Un « Famille mensuel » entrerait en collision avec « Premium mensuel ». Il faut ajouter un niveau (tier) au modèle `Plan`.
  - `subscriptions` (une ligne par personne, un seul droit) et `_premium_of` n'ont pas de notion de niveau. Il faut une colonne `tier` ou un entitlement séparé.
  - `REVENUECAT_ENTITLEMENT` filtre sur un seul nom de droit (`concernsEntitlement`).
- Définir « partagés » : aujourd'hui le Premium est déjà partagé avec UN partenaire sans surcoût. Famille changerait-il le nombre de membres (grands-parents, nounou ?) ou seulement le volume de crédits ?
- Textes : écran Premium, comparatif des formules, `ABONNEMENT.md`, notes pour la vérification Apple.

**Option C — Crédits inclus dans Premium (+1000 par mois)**
- Pas de nouveau produit Apple.
- Serveur : crédit mensuel automatique à chaque `RENEWAL`/`INITIAL_PURCHASE`, ou à date fixe.
- Règle à fixer pour les crédits mensuels non utilisés : expirent-ils ou sont-ils reportés ?
- Règle à fixer pour le partenaire : solde commun ou séparé ?

**Option D — Palier « Gratuit 20 crédits/mois »**
- Contredit le Premium strict actuel. Il faudrait :
  - ouvrir `/assistant/*` sans abonnement (`src/lib/premium/access.ts:31,84-97`) ;
  - changer `_plan_limit_of` / `premium_policy.assistant_paid` (`20261110000200_assistant_payant.sql`) ;
  - lever `_require_premium_write('ai')` sur `assistant_conversations` et `assistant_messages`, ou écrire seulement côté serveur ;
  - revoir les fonctions Gemini protégées par `requirePremium`, si les crédits gratuits doivent aussi servir à « analyser ».
- Conséquences :
  - un coût Gemini par compte gratuit, d'où un risque de comptes multiples créés pour récupérer des crédits (prévoir une vérification de l'e-mail ou une limite par appareil) ;
  - les textes « Premium strict » de l'écran Premium et des notes App Review sont à réécrire.
- Variante prudente : 20 crédits réservés à l'assistant LOCAL et à la sécurité. Mais ces deux usages ne coûtent rien et la sécurité est déjà gratuite.

**Option E — Offres héritées**
- Ne plus vendre `aufildenous_ai_monthly` ni `aufildenous_tool_*` (aujourd'hui `ToolOffer.tsx` peut encore proposer l'offre IA).
- Garder `paid_tools` / `entitlement_grants` pour honorer d'éventuels achats passés. La base HOMI est déclarée « neuve » (`20261119000200…`), donc il n'y en a probablement aucun.
- Si les produits n'existent pas dans App Store Connect pour HOMI, il faut retirer le code mort, ou au moins ne pas l'afficher.

---

## 3. Recherche universelle

### 3.1 Existant
- `src/lib/domain/toolSearch.ts` (161 l.), recherche **locale** :
  - normalisation (accents, apostrophes, ß/œ) ;
  - mots vides en 5 langues (l.22-28) ;
  - racine simple (pluriels) ;
  - début de mot, mot composé, **une faute d'une lettre** (`editOne`, mots d'au moins 5 lettres) ;
  - IDF ; poids nom 3 > mots-clés 2 > description 0,5 ;
  - bonus pour une tournure entière ;
  - seuils d'honnêteté (couverture ≥ 50 %, ≥ 45 % du meilleur) : liste vide plutôt que des résultats au hasard.
- Index : `tool.label`, `th.<outil>.k` (mots-clés i18n, au moins 4 par outil et par langue, vérifié par un test), sous-accès et description. **Langue active uniquement.**
- Tests (`src/__tests__/toolHub.test.ts:214-322`) :
  - **42** couples requête → outil en FR, plus un cas sommeil ;
  - **9** requêtes qui ne doivent rien trouver ;
  - **8** requêtes multilingues, dont **2 en anglais** (« my baby wakes up every night », « shopping list ») ;
  - des tests de classement.
- Où se trouve la barre de recherche :
  - onglet « Outils » `src/app/(tabs)/tools.tsx:60`, masqué de la barre d'onglets (`href: null`, `(tabs)/_layout.tsx:56`) ;
  - feuille `src/features/hubs/ToolSearch.tsx:95`, ouverte par `ToolSearchButton` dans les hubs Moi / Enfant / Famille (`HubScreen.tsx:103`) et sur la page 404 (`+not-found.tsx:32`) ;
  - **absente de l'accueil « Aujourd'hui »** ;
  - la bibliothèque a sa propre recherche d'articles (`src/app/library.tsx:105`).

### 3.2 Essai (Jest, recherche réelle sur tous les outils de tous les profils, 3 premiers résultats)
- Exemple demandé : « mon bébé prend le sein » → `baby_breastfeed` ✔.
- Bon résultat : **~16/30 en FR**, **~15/25 en EN**.
- Échecs ou contresens (extrait) :
  - « il tète toutes les heures » → `brain_dump, cycle_symptoms…` ✘ (« tète » n'est pas reconnu) ;
  - « jumeaux tétées » → ∅ ;
  - « ma fille a 39 de température », « il a vomi après le biberon », « il pleure beaucoup le soir », « il ne veut pas manger de légumes », « donner du doliprane », « qui garde les enfants mercredi » → ∅ ;
  - « déclarer à la caf » → `ttc_start_pregnancy` ✘ ;
  - EN : « teething pain » → `cycle_pain` ✘ ; « period tracker » → `pma_tracker` ✘ ; « baby wont sleep », « fever in toddler », « first words », « nanny handover notes », « shared calendar with my partner », « screen time rules » → ∅.

### 3.3 Ce qui manque pour 100 formulations FR/EN
- Un **jeu de 100 requêtes FR + 100 EN** avec l'outil attendu (et ∅ attendu quand c'est le cas), à ajouter à `toolHub.test.ts`. Aujourd'hui : 2 requêtes EN.
- Un **lexique de concepts commun aux langues**, par exemple `allaitement = sein, tétée, tète, téter, breastfeed, nursing, latch` et `fièvre = température, 38, 39, fever`. Le français et l'anglais pointeraient vers le même outil. Il faudrait aussi pouvoir chercher dans une langue autre que celle de l'interface, avec un repli FR + EN.
- La lemmatisation des verbes (tète/téter, wont/won't), des nombres en contexte (« 39 » → fièvre) et de la tolérance aux fautes sur les mots de 4 lettres.
- Indexer aussi les **articles** (le moteur `localAI/engine.ts` existe déjà) et les **actions** (« noter une tétée » → ouvrir directement la saisie), avec des résultats groupés « Outils / Articles / Actions ».
- Afficher la barre **sur l'accueil**.
- Une étape « IA en ligne » facultative (Aura) seulement si la recherche locale ne trouve rien, avec consentement et crédits. La recherche reste locale par défaut.

---

## 4. Personnalisation

### 4.1 Existant
- **Accueil par situation** : `src/features/homeToday/homeLayout.ts:42-81`.
  - `homeSituation()` choisit entre pregnancy, newborn, child, couple, family, cycle, me et coparent (`coparentHome.ts`).
  - `HOME_PRESETS` est déclaratif et commenté.
  - `resolveHomeLayout`, `moveModule` et `setModuleVisible` gèrent le réordonnancement et le masquage. Ces réglages sont gardés **par situation, sur l'appareil** (`src/lib/store.ts`, `homeLayouts`).
- **Profil affiché** : `ActiveSubject` (`src/lib/store.ts:8-13` : grossesse, enfant, post-partum, famille, moi) et `useScope()` (`src/lib/data/hooks-scope.ts:21`).
- **Onboarding v2** : `src/lib/onboarding/personalize.ts` (320 l.).
  - Entrées : situations, objectif du cycle, 2 besoins au plus (mental_load, sleep, health, appointments, meals, community), mode de garde (`sharing`), aides (nounou/crèche), répartition des tâches.
  - Sorties : `recommendTools`, `firstAction`, `premiumHighlights`.
  - Enregistrement dans `profiles.onboarding_answers` (`src/app/onboarding.tsx:275`).
- **Favoris** :
  - `toolFavorites`, migrés vers des identifiants stables (`src/lib/domain/toolFavorites.ts`), **locaux à l'appareil** ;
  - actions rapides, `dailyActionFavorites`, `cocoonFavorites` et `quickActionFavorites` par profil ;
  - carte du cycle configurable.
- **Données disponibles** :
  - grossesse multiple : `multiple_group` (`src/lib/types.ts:74`), checklist `multiples` ;
  - garde alternée : `custody_plans` ;
  - fatigue : `exhaustion_checkins`, `parent_sleep_logs`, `mood_checkins` ;
  - âge des enfants : `childAge`.

### 4.2 Ce qui manque pour un moteur de règles explicable
- **`onboarding_answers` est écrit mais jamais relu.** Seul `onboarding.tsx` l'utilise. Les besoins déclarés n'influencent ni l'accueil ni les outils après le premier écran.
- Il n'y a **pas de moteur de règles**, seulement des tableaux par situation. Il manque :
  - des règles déclaratives `{ id, si: (signaux) → vrai/faux, alors: modules/outils/articles, poids, explication: clé i18n }` ;
  - un écran « Pourquoi je vois ceci ? » ;
  - la désactivation d'une règle par la personne.
- Signaux à rassembler dans un seul objet pur et testable :
  - rôle (owner, coparent, caregiver ; seul le rôle de foyer existe) ;
  - grossesse et semaine ;
  - âge de chaque enfant en tranches 0-3 m, 3-6 m, 6-12 m, 1-3 a, 3-6 a, 6-10 a ;
  - nombre d'enfants ;
  - jumeaux (`multiple_group` côté enfants : à vérifier) ;
  - garde (`custody_plans`, `sharing`) ;
  - fatigue récente (agrégat **local** des journaux de la personne, jamais ceux du partenaire) ;
  - besoins déclarés.
- Synchronisation : les favoris, épingles et masquages sont locaux. Ils sont perdus en changeant d'appareil (choix assumé dans le code, à confirmer).
- Confidentialité : les règles sur la fatigue ou l'humeur doivent tourner sur l'appareil, à partir des seules données de la personne (RLS déjà propriétaire seule, §6).

---

## 5. Photo de profil

**Existant (complet)**
- Choix de la photo : `src/lib/data/hooks-profilePhoto.ts:20-45`.
  - Permissions demandées à l'usage.
  - `launchCameraAsync` (caméra frontale) / `launchImageLibraryAsync`.
  - `allowsEditing` et `aspect [1,1]` (recadrage natif, sauf sur le web).
  - `exif: false`.
- Traitement de l'image :
  - recadrage carré centré si le recadrage natif n'a pas eu lieu (`centerSquare`, `src/lib/domain/profilePhoto.ts:23`) ;
  - réduction à **512 px**, JPEG qualité 0,82 ;
  - contrôle de la taille maximale de 2 Mo.
- Envoi :
  - bucket **privé** `profile-photos` (`20261107000500_profile_photos.sql:24-26` : jpeg uniquement, 2 Mo) ;
  - chemin imposé par la base `<user_id>/<uuid>.jpg` ;
  - ancienne photo supprimée ; nettoyage si l'envoi échoue (l.65-74).
- Affichage : liens signés d'une heure (`useProfilePhotoUrl`, l.118), dans `UserAvatar` (`src/components/UserAvatar.tsx:14`). Les membres du foyer voient la photo via `member_avatars()` / `shares_household_with`.
- Suppression : bouton et confirmation (`ProfilePhotoSheet.tsx:37,48`) ; dossier effacé par `delete-account`.
- Écrans : `src/app/(tabs)/profile.tsx:139` et `src/features/nounou/CaregiverProfile.tsx:68`. Photo d'un enfant : bucket `avatars` (jpeg/png/webp, 5 Mo, `20261015000500…:13`) via `ChildPhotoSheet`.
- iOS : `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` et `NSPhotoLibraryAddUsageDescription` en 5 langues (`app.config.ts:16-89,140-148`).
- Accès gratuit : `/profile` est une route libre et `profiles` n'est pas une table « strict ».

**Limites et écarts**
- `manipulateAsync` est **déprécié** dans `expo-image-manipulator` 57 (`build/ImageManipulator.d.ts:15`), mais il est encore exporté. Il faudra migrer vers `ImageManipulator.manipulate(...)` avant qu'il ne disparaisse.
- Sur iOS, le recadrage natif est imposé en carré, sans recadrage circulaire ni zoom personnalisé. Un éditeur propre ne se justifie que si la demande l'exige.
- `shares_household_with` montre la photo d'un parent à la nounou et aux grands-parents du foyer. C'est voulu et documenté ; à confirmer.

---

## 6. Confidentialité entre parents (vérification rapide)

**Couvert par la migration `20261119100000_confidentialite_coparent.sql`**
- Grossesse : seule la personne enceinte y a accès, sauf si elle partage l'essentiel (`share_basics`) ou le médical (`share_medical`). Cela vaut pour les notes et documents de grossesse.
- Rendez-vous personnels d'un adulte.
- Post-partum partagé : visible des parents seulement.
- Profil familial et réglages de partage.
- Préférences de notification.

**Déjà propriétaire seule avant cette migration** (`_apply_owner_policies` : `user_id = auth.uid()`)
- Émotions et humeur : `mood_checkins` (`20261015000200…:351`), `exhaustion_checkins` (`20261107000300…:123`), `postpartum_checkins` et `postpartum_actions` (`20261019000100…:78,109`), `daily_checks`.
- Intimité et cycle : `period_entries`, `symptom_logs`, `ovulation_tests`, `pregnancy_tests`, `discharge_logs`, `bleeding_logs`, `cycle_journal` (`20261019001300…:62-93`), `intercourse_logs` (opt-in et suppression dédiée), `contraception_logs` ; `cycle_shares` (partage volontaire, lecture par `partner_id`).
- Santé de l'adulte : `my_treatments`, `my_treatment_logs`, `pma_*`, `parent_sleep_logs`, `maternal_weights`, `consultation_questions`.
- Assistant : `assistant_*`.

**Angles morts à vérifier (aucun accès confirmé, mais aucune protection explicite trouvée)**
1. **`couple_checkins`** (`20261107000300…`) : lisible par les DEUX parents (owner/coparent). Si une réponse individuelle est censée rester privée avant d'être révélée, la RLS ne le garantit pas.
2. **`reminders` partagés** (`20261107000100_six_outils.sql:25-27`) : `is_household_member` donne aussi la lecture à la nounou et aux grands-parents. Un rappel de pilule ou de traitement marqué « partagé » leur serait visible. Il faudrait restreindre aux parents, ou interdire `shared` pour les rappels de cycle et de traitements.
3. **`couple_feelings` / `couple_messages`** (`20261119100100_se_comprendre.sql`) et leur passage en temps réel (`20261122000200…`) : postérieurs à l'audit. Leurs politiques semblent correctes à la lecture (propriétaire / destinataires), mais elles n'ont **pas été revues** par l'audit du 19/11.
4. **Fonctions `SECURITY DEFINER`** : seuls les exports, suppressions et déclencheurs touchent les tables sensibles, et ils filtrent sur `auth.uid()`. Aucune fuite trouvée. Toute future fonction « synthèse Aura » devra lire avec `db` (RLS), jamais avec `admin`.
5. **Contexte envoyé à l'IA** : il est construit dans l'application avec les données lisibles par la personne (RLS), donc jamais celles du partenaire. Il faudra garder cette règle pour la synthèse des journaux.
6. **Documents** : la règle passe par `_document_visible` (`20261113000200…`) et la règle grossesse/médical. Les documents de santé d'un ADULTE non liés à une grossesse suivent la visibilité générale des documents. À confirmer.

---

## Décisions que seule la propriétaire peut prendre

| Décision | Conséquence |
|---|---|
| Garder le **Premium strict** ou ouvrir un **palier Gratuit 20 crédits** | Gratuit : modifier `access.ts`, `_plan_limit_of`, `assistant_paid` et les gardes d'écriture ; coût Gemini et risque d'abus sur les comptes gratuits ; textes Premium et App Review à réécrire. |
| Créer un abonnement **Famille 19,99 €** | 4ᵉ produit dans le groupe « HOMI Premium », avec un niveau et des rangs de montée/descente à définir ; refonte de `plans.ts`, `subscriptions` et `_premium_of` (notion de niveau) ; définir ce qui est « partagé » en plus du partenaire actuel. |
| Vendre des **packs consommables** (3 produits) | Grand livre et webhook à construire ; politique de remboursement (débit, solde négatif ?) ; crédits non restaurables par Apple. |
| **Expiration** des crédits mensuels, report éventuel, **ordre de consommation** (mensuels puis achetés) | Mode de calcul du grand livre et textes légaux. |
| **Solde commun ou séparé** entre les deux adultes | Schéma : solde par foyer ou par personne ; qui peut dépenser. |
| **Barème** : coût en crédits de chaque action (question, synthèse, plan, voix, scan) | Libellé « X crédits », marge par rapport au coût Gemini et ElevenLabs. |
| **Mode vocal** ElevenLabs : oui ou non, et à quel coût en crédits | Clé, sous-traitant à déclarer, micro iOS à activer (fiche App Store « données audio »). |
| **Anciennes offres** `aufildenous_*` : retirer ou honorer | Nettoyage de `ToolOffer.tsx`, `offers.ts`, `paid_tools`. |
| **Nom du modèle** Gemini (`gemini-3.5-flash-lite` par défaut) et région de traitement | Coût par crédit, RGPD. |
| **Synchronisation des favoris et de l'accueil** entre appareils | Nouvelle table ou statu quo (local). |
| **Visibilité de la photo** par la nounou et les grands-parents ; lecture de `couple_checkins` par le partenaire | Politique RLS à garder ou à restreindre. |

## Prérequis externes indispensables

- **Clés (secrets Supabase) absentes aujourd'hui**
  - `GEMINI_API_KEY` (facultatif : `GEMINI_MODEL`) et `ASSISTANT_ENABLED=true`. Sans elles, l'assistant répond `coming_soon` ou `ai_not_configured`.
  - `ELEVENLABS_API_KEY` et un identifiant de voix (`voice_id`), si le mode vocal est retenu.
  - `REVENUECAT_SECRET_API_KEY` est **déjà présente**. Elle est indispensable, car les droits et consommables hors Premium ne sont lus que dans l'API (`subscription-run.ts:160-165`).
- **App Store Connect**
  - 3 consommables de crédits (si l'option A est retenue) ;
  - le produit Famille dans le groupe « HOMI Premium », avec son niveau (option B) ;
  - descriptions et captures pour la vérification ;
  - mise à jour de la fiche App Privacy (données envoyées à Google et, si retenu, données vocales à ElevenLabs).
- **RevenueCat**
  - produits, offering ou packages pour les crédits ;
  - entitlement `HOMI_FAMILY` ou règle de niveau ;
  - webhook déjà branché : le compléter pour `NON_RENEWING_PURCHASE`.
- **Réseau (sortie des fonctions edge Supabase, pas l'application)** : `generativelanguage.googleapis.com` (Gemini), `api.elevenlabs.io` (voix) et `api.revenuecat.com` (déjà utilisé). Aucun hôte supplémentaire côté application si la voix passe par une fonction edge. Un flux audio direct demanderait d'autoriser l'hôte côté application.
- **iOS** : `NSMicrophoneUsageDescription` (5 langues) et `microphonePermission` réactivé dans `app.config.ts:143,148` pour la voix. Il faut ensuite une **nouvelle compilation native** (EAS), car le micro n'est pas une mise à jour OTA.
- **Juridique** : ajouter ElevenLabs (et confirmer Google) aux sous-traitants de la politique de confidentialité ; ajouter aux conditions la règle des crédits (expiration, absence de remboursement hors Apple).
