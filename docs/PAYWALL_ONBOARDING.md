# Onboarding « première réussite » et paywall iOS — refonte du 03/12/2026

Branche locale `homi/paywall-onboarding` (créée depuis `homi/fondations`, f37bca1). Aucune action en production :
aucune migration appliquée, aucun prix modifié, aucun build, aucune soumission, aucun push.

## 0. Skill « Paywall Designer » : ce qui a pu être exécuté

- **SKILL.md non obtenu.** `www.tobiadonadon.com` était d'abord bloqué par le réseau de la session (WebFetch : ENOTFOUND ;
  curl : CONNECT 403). Le coordinateur a ensuite ouvert la page : le SKILL.md est derrière un formulaire « Get it free »
  qui demande une adresse e-mail ; l'adresse de la propriétaire n'a pas été transmise à ce service tiers. Rien n'a été
  inventé sur son contenu.
- **Cadre appliqué d'après la page PUBLIQUE du skill** (transmise par le coordinateur) : trois volets — Onboarding
  (« redesigned to sell »), Pricing (« priced against what your competitors charge », comparaison en équivalent mensuel),
  Paywall (« the paywall that closes it. Then the code. ») ; parcours exemple en 12 écrans, « every screen has one job » :
  promesse, choisir, niveau, motif, ce que tu vas obtenir, objectif, tu choisis quand, une leçon AVANT tout compte,
  la première réussite, le compte APRÈS la réussite, la conclusion (paywall), après le oui.
- Étapes exécutées, une par une :
  1. **Audit tarifaire** — fait (§ 2), sans afficher de prix concurrent dans l'app ; l'étude concurrents (prix NON
     vérifiés) vient d'une autre personne : elle est seulement citée pour situer HOMI.
  2. **Analyse du parcours avant / après paywall** — faite sur le code et en rejouant l'export web (§ 1, § 3).
  3. **Trois directions visuelles** — faites en écrans RÉELS (`PaywallView`, route `/dev/paywall`), capturées (§ 5).
  4. **Critique** — faite (§ 5) ; **pas de sous-agent indépendant** : cette session n'a pas d'outil pour lancer un
     agent qui ne verrait que les PNG. La critique est donc la mienne, à relire par une personne extérieure.
  5. **« Then the code »** — le résultat est du code Expo / React Native intégré au dépôt (aucun SwiftUI).
- Le parcours en 12 écrans du skill a été **raccourci** comme le demande le brief : étape de vie (« choisir »), besoin
  (« motif »), démo avant compte (« leçon »), résultat (« première réussite »), paywall (« conclusion »), compte juste
  avant le paiement (« compte après la réussite »), confirmation (« après le oui »), rappel (« tu choisis quand »).

## 1. Audit de l'existant (homi/fondations, f37bca1)

| Domaine | Constat (fichier) |
|---|---|
| Première ouverture | `/intro` « Je suis… » (5 profils → 3 tableaux d'outils → Commencer / compte / démo) puis `/welcome`. Aucune action réalisée avant le compte. |
| Inscription | « Commencer » → `/auth/sign-up` immédiatement : compte demandé AVANT toute valeur. |
| Onboarding | `src/app/onboarding.tsx` : 6 étapes + révélation + écran Premium + visite guidée, APRÈS le compte. |
| Paywall | `src/features/Paywall.tsx` (/premium, PremiumGate « Cet espace fait partie de Premium », clés `pay2.*`) : 3 formules, frise d'essai, bouton exact, restauration ; titre générique, aucun lien avec un besoin. |
| Abonnement | `src/app/settings/subscription.tsx` + `src/features/credits/FamilyOffer.tsx` (Famille 19,99 €, crédits). |
| Catalogue | `src/lib/purchases.ts` : prix StoreKit via RevenueCat, éligibilité à l'essai (`checkTrialOrIntroductoryPriceEligibility`), achat confirmé seulement par le serveur (`has_premium`). **Le SDK n'était configuré qu'avec un compte** : impossible d'afficher les prix réels avant l'inscription. |
| Démo | « Découvrir sans compte » (`startDemoWithoutAccount`) : famille d'exemple, faux magasin (grille `DEMO_GRID` signalée). |
| Design system | `@/components/ui`, `@/components/glass`, `@/motion` (réduction des mouvements), tokens de thème, `HomiIcon`, illustrations `HeroArt`. |
| Traductions | 5 langues, tutoiement verrouillé par `src/__tests__/tutoiement.test.ts`. |
| Notifications | `src/lib/notifications.ts`, règle d'écran verrouillé neutre (`HOMI_NOTIFICATION_RULES.md`) ; aucun rappel de fin d'essai. |
| Analytics | **Aucun module d'analyse** ; seulement le consentement `analytics` (privacy_settings.analytics_enabled, faux par défaut). |
| Droits | Premium = abonné·e + 1 co-parent (`_premium_partner_of`) ; Famille = tous les adultes owner/coparent + 1 500 crédits communs ; nounou jamais Premium (tests SQL « Famille : Premium pour tous les adultes du foyer (pas la nounou) », « Famille : la nounou et l'ancien membre n'ont aucun crédit » : verts). |
| Outils mis en avant | Valise de maternité (`src/content/checklists.ts`, `maternity_bag`, outil `/lists`) ✔ ; journal sommeil / repas (`planDay`, `SleepTimeline`, `/track`) ✔ ; routines visuelles enfant (`/family/kid-routines`, pictogrammes) ✔ ; partage co-parent (Mes informations, partages par domaine ; humeur et journal intime propriétaires seuls ; cycle : partage explicite) ✔. Tous existent : aucune promesse adaptée. |

### Frictions observées en rejouant l'export web actuel
1. **« Découvrir sans compte » arrive DIRECTEMENT sur « Cet espace fait partie de Premium »** (accueil et /tools) : la
   famille d'exemple n'a aucun abonnement ; les notes App Review promettent pourtant « explore with sample data »
   (signalé aussi par le coordinateur).
2. « Commencer » demande un compte avant la moindre valeur ; le paywall n'arrive qu'après 6 étapes d'onboarding.
3. Titre du paywall générique, sans rapport avec ce que la personne veut faire.
4. Avant le compte, aucun prix réel possible (SDK RevenueCat configuré seulement à la connexion).
5. Famille présentée dans une autre page (Réglages › Abonnement) : risque de lire Famille comme « +5 € pour le co-parent ».
6. Après l'achat : retour à l'accueil, sans ouvrir l'outil qui avait motivé l'achat, sans rappel avant le paiement.

## 2. Audit tarifaire

| | Référence (France) | Grille de démonstration (`DEMO_GRID`) | Documentation du dépôt (ABONNEMENT.md) | Catalogue App Store / RevenueCat réel |
|---|---|---|---|---|
| Premium mensuel | 14,99 € | 14,99 € (essai 3 j) | 14,99 €, essai 3 j | **non vérifiable ici** |
| Premium 6 mois | 69,99 € | 69,99 € (essai 3 j) | 69,99 €, essai 3 j | non vérifiable |
| Premium annuel | 119,99 € | 119,99 € (essai 3 j) | 119,99 €, essai 3 j | non vérifiable |
| Famille mensuel | 19,99 € | 19,99 € (**sans essai**) | 19,99 €, essai non documenté | non vérifiable |

Écarts à signaler (aucun prix modifié) :
- **Famille et essai** : la référence dit « essai 3 jours si éligible » ; la grille de démonstration et ABONNEMENT.md ne
  prévoient pas d'essai pour `homi_family_monthly_v2`. Apple n'accorde l'essai qu'une fois par groupe : à trancher dans
  App Store Connect. Le code affiche ce que StoreKit renvoie (aucune promesse sinon).
- Économies affichées (base explicite « par rapport à 12 × 14,99 € ») : annuel −33 %, 6 mois −22 % — calculées, jamais écrites.
- Positionnement (étude concurrents, prix NON vérifiés, jamais affichés dans l'app) : le partage avec le co-parent est
  inclus sans supplément chez les concurrents cités ; HOMI l'inclut dès Premium — la carte Premium le dit (« Pour toi et
  ton ou ta co-parent »), Famille est présentée comme « Tous les adultes du foyer + 1 500 crédits Aura partagés ».
  Essais concurrents 7–14 j (non vérifiés) contre 3 j chez HOMI : levier à tester, pas un écart de catalogue.
- Crédits Aura : 1 000 / mois (Premium), 1 500 partagés (Famille), **0 pendant l'essai** ; l'assistant en ligne est
  encore fermé (`aiAssistantOnline = false`) : le bénéfice « crédits » porte la mention « (Aura ouvre bientôt) ».

## 3. Parcours retenu

| # | Écran (un rôle) | Route | Notes |
|---|---|---|---|
| 1 | Étape de vie : grossesse / bébé / enfant jusqu'à 10 ans | `/start` | Bulle d'Aura (message prédéfini). « J'ai déjà un compte ». |
| 2 | « Qu'est-ce qui te faciliterait la journée ? » | `/start` | 2 réponses par étape (≤ 4) : le besoin propre à l'étape + « Me relayer avec mon ou ma co-parent ». |
| 3 | Mini-démo guidée par Aura | `/start` | Vrais composants (CompletionCheck, planDay + SleepTimeline, pictogrammes des routines), pastille « Exemple », aucun appel IA ni réseau. |
| 4 | Résultat juste après l'action + « Au quotidien, tu retrouverais » | `/start` | « Voir les offres », « Refaire la démo ». |
| 5 | Paywall de conclusion (titre A/B + aperçu du résultat) | `/start/offers` | § 4. |
| 6 | Compte (inscription / connexion) ENTRE le choix et l'achat | `/auth/sign-up` | Progression gardée (`homi.pending-firstwin.v1`), reprise au paywall (« Ton compte est prêt »), formule présélectionnée. |
| 7 | Confirmation (après le oui) | `/start/done` | Formule, montant, date confirmée, outil essayé, invitation, rappel, gestion. |

Démos et titres : grossesse → cocher la valise → « Prépare l'arrivée de bébé étape par étape » ; bébé → ajouter une
sieste, heure visible → « Repas et siestes, au même endroit » ; enfant → ajouter puis cocher une étape → « Des matins où
chacun sait quoi faire » ; relais → ce que Sam (exemple) verrait / ce qui reste privé, confier une mission →
« Relayez-vous sans vous répéter » (Premium suffit : un co-parent inclus ; Famille élargit à tous les adultes).

Première ouverture sans compte : `/` → `/start` (au lieu de `/intro`, qui reste rejouable). « Commencer » (accueil) → `/start`.
« Découvrir sans compte » garde la famille d'exemple (scripts e2e et notes App Review existants) : la friction n°1 reste
sur ce chemin-là — voir § 8.

## 4. Paywall réel (`src/features/firstWin/`)

- Titre : variante A/B (`paywallTitleKey`) + aperçu du résultat de la démo.
- ≤ 3 bénéfices de la formule choisie (`benefitsFor`) : l'outil essayé, le partage (co-parent / tous les adultes), les crédits Aura (au premier paiement, « Aura ouvre bientôt »).
- Cartes (`offerCards`) : nom, accès inclus, **montant total facturé** (« 119,99 € par an »), équivalent mensuel en complément, économie avec sa base.
- Frise (`timelineFor`) : Aujourd'hui (accès immédiat) → date, montant exact et périodicité du premier paiement ; « Dates calculées pour un démarrage aujourd'hui » avant l'achat, « Date confirmée par la boutique » après.
- Bouton (`ctaFor`) : « Démarrer mes 3 jours gratuits » seulement si l'essai est confirmé (StoreKit + éligibilité du compte) ; sinon « S'abonner à 14,99 €/mois » (montant du magasin).
- Conditions sous le bouton (`termsFor`) : « Gratuit jusqu'au 6 décembre, puis 14,99 €/mois. Renouvellement automatique. »
- Croix visible → retour au résultat de la démo ; « Voir les offres » y ramène. Restaurer, Conditions, Confidentialité.
- États (`catalogState`, `phaseView`) : chargement, hors ligne, prix indisponible (Réessayer, achat désactivé), web sans magasin ; annulé, en attente d'approbation, en attente du serveur, échec, confirmé ; restauration (trouvée, rien, échec).
- Accès : Premium n'est ouvert que si `purchase()` renvoie « confirmed » (droit vu par le serveur). Un compte abonné ne voit jamais `/start` ni `/start/offers`.
- RevenueCat : `ensureCatalogConfigured()` configure le SDK en **anonyme pour lire le catalogue** avant l'inscription ; `purchase()` lève `PurchaseError('account_required')` sans compte connecté (logIn fait) → l'écran envoie vers l'inscription.

## 5. Trois directions et critique

Écrans réels (`src/features/firstWin/PaywallView.tsx`, prop `direction`), rendus par `/dev/paywall?direction=A|B|C&trial=1|0`
(date fixe 03/12/2026 10:30, grille de démonstration signalée), capturés par `e2e/paywall_premiere_reussite.py` à 390 × 844
et 320 × 568 (deviceScaleFactor 2) : `maquette_<A|B|C>_<essai|sans-essai>_<390|320>.png` (+ `_page.png` = page entière),
dans le dossier de captures de la session (non versionné).

- **A « Résultat d'abord »** (Parlo) : aperçu du résultat en grand, 3 bénéfices, 4 cartes, frise sous les cartes.
- **B « Essai expliqué »** (Headspace + Strava) : aperçu du résultat sur une ligne, puis la frise « Aujourd'hui → 6 décembre :
  premier paiement 14,99 €, puis 14,99 € par mois » en carte, puis les formules ; la frise suit la formule choisie.
- **C « Formules comparées »** : « Pour qui » (à deux / tout le foyer), durée, tableau « Combien tu paies ».
- Communs : bouton + conditions toujours visibles en pied d'écran (Calm : montant et date lisibles au moment de décider),
  croix visible (retour au résultat), Restaurer / Conditions / Confidentialité, note « compte juste avant de payer ».

### Critique (première passe, notes sur 5 — critique faite par moi, PAS par un sous-agent indépendant)

| Critère | A | B | C |
|---|---|---|---|
| Compréhension du bénéfice en 5 s | 4 (titre + grand aperçu) | 4 | 3 (le sélecteur prend la place) |
| Envie de continuer après la démo | 4 | 4 | 3 |
| Lisibilité du prix total, de la date et des conditions | 3 (frise sous le pli, après 4 cartes) | 5 (date et montant en tête, répétés sous le bouton) | 4 (tableau clair mais sous le pli) |
| Facilité à fermer et à retrouver la démo | 5 | 5 | 5 |
| Cohérence avec HOMI | 4 | 4 | 3 (libellé de segment coupé « co-parent ») |
| **Total / 25** | **20** | **22** | **18** |

Défauts relevés et corrigés avant intégration :
1. Formule présélectionnée (mensuel) en 3ᵉ position, sous le pli → ordre « mensuel, 6 mois, annuel, Famille » (du plus
   court au plus long engagement) : la formule choisie est visible avec la frise.
2. Césure automatique du web (« Re-nouvellement », « re-pas ») → `hyphens: manual` sur les textes du parcours.
3. C : segment « Toi et ton ou ta co-parent » coupé, ligne d'accès répétée → « À deux » / « Tout le foyer », ligne retirée.
4. « 33 % » coupé en fin de ligne → espace insécable avant « % » (fr, de, es).
5. Hors ligne : bouton désactivé qui disait « Réessayer » → « Achat indisponible pour l'instant » (le « Réessayer » reste dans la page) ;
   une erreur réseau du catalogue est classée « hors ligne ».
6. Présélection faite parfois sur un catalogue partiel (Famille arrivé avant Premium) → présélection seulement quand le catalogue Premium est prêt.

**Retenu : B « Essai expliqué »** (`INTEGRATED_DIRECTION = 'B'`, `src/features/firstWin/Offers.tsx`) : meilleure note sur le
critère le plus lié à la confiance et aux remboursements (prix total, date, conditions) sans perdre le lien avec la démo
(aperçu du résultat juste sous le titre). Les deux autres directions restent rendables (`/dev/paywall`) pour un test ultérieur.

## 6. Mesure et test A/B

Module local `src/lib/analytics/events.ts` (sans dépendance), branché dans `src/app/_layout.tsx` :
consentement « mesure d'audience » existant ; sans compte → file sur l'appareil (200 / 30 jours) ; refus → file vidée ;
accord → table `analytics_events` (migration `20261203000100_paywall_analytics.sql`, RLS : insertion seulement avec
`analytics_enabled`, aucune lecture par les comptes, propriétés en liste blanche vérifiée par contrainte SQL).

| Événement | Où | Propriétés |
|---|---|---|
| onboarding_started | arrivée sur /start sans progression | source |
| demo_completed | action de la démo | stage, need, step |
| paywall_viewed | catalogue prêt | stage, need, variant, direction |
| plan_selected | changement de formule | + tier, period, trial |
| paywall_closed | croix | + tier, period |
| account_required | bouton sans compte | + tier, period |
| purchase_outcome | issue d'achat | + outcome |
| trial_confirmed | achat confirmé avec essai | + tier, period |
| reminder_set | rappel | outcome |
| **first_billing_confirmed** | **serveur** : webhook RevenueCat (`supabase/functions/_shared/conversion.ts`) — RENEWAL de conversion d'essai (`is_trial_conversion`, sinon abonnement encore « trial ») ou INITIAL_PURCHASE payé tout de suite ; table `conversion_events`, unique (kind, transaction_id) | transaction, produit, after_trial, magasin, environnement |

Jamais de donnée de santé, d'enfant ou de journal : `sanitize()` (liste blanche + valeurs `[a-z0-9_]{1,32}`) et contrainte SQL.

**Protocole A/B « titre du paywall »** : variante `generic` (« Tout HOMI, pour toi et ta famille ») contre `need`
(titre qui reprend le besoin) ; même démo, même design, mêmes prix. Assignation stable par installation :
`assignVariant(installId)` = FNV-1a(`paywall_title_v1:<install_id>`) mod 2 (identifiant d'installation aléatoire,
`homi.install-id.v1`). **Métrique principale : première facturation confirmée après la fenêtre d'essai / personnes
exposées** (vue `paywall_ab_results`, production seulement). Secondaires : trial_confirmed / exposés, paywall_closed /
exposés. Durée : jusqu'à au moins 14 jours après la dernière exposition comptée (essai 3 j + délai de facturation) ;
décider sur un écart significatif (test de deux proportions, α = 5 %), pas avant. Limite : seules les personnes qui ont
accepté la mesure sont comptées (biais de consentement identique dans les deux bras).

## 7. Vérifications

Exécutées le 03/12/2026 sur la branche `homi/paywall-onboarding` :

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | 0 erreur |
| `node scripts/i18n-scan.js` | 0 texte en dur |
| `node scripts/gen-routes.js --check` | 297 routes (293 + `/start`, `/start/offers`, `/start/done`, `/dev/paywall`) |
| `node scripts/homi/inventory.mjs --check` | à jour (297 routes, 298 fichiers) |
| `node scripts/homi/privacy-check.mjs` | tous les contrôles au vert |
| Jest (suite complète) | 207 suites, 3 373 tests, tous verts (dont `src/__tests__/firstWin.test.ts` : 33 tests) |
| Tests SQL (`supabase/tests/run-local.sh`, PostgreSQL 16 local) | 2 774 réussis, 0 échec (dont `98zn_paywall_analytics.sql` : 10) — migration NON appliquée ailleurs |
| e2e Playwright `e2e/paywall_premiere_reussite.py` (export web) | 101 / 101 vérifications, 0 erreur console, 0 débordement |

Rejoué dans l'e2e : première ouverture → /start ; retour arrière ; démo conservée ; croix → résultat ; « Voir les
offres » ; changement de formule (montant, frise, conditions, bouton) ; essai disponible / indisponible ; compte entre
le choix et l'achat, reprise au paywall avec la formule gardée ; achat annulé, en attente d'approbation, en attente du
serveur, échec réseau ; restauration sans achat ; achat confirmé → confirmation (formule, date, montant, outil,
invitation, gestion) ; rappel (état réel « disponible dans l'application iPhone » sur le web) ; catalogue hors ligne
(achat désactivé) ; abonné·e renvoyé·e hors de /start et /start/offers ; grossesse, enfant, relais (sections privées) ;
anglais ; réduction des mouvements ; 320 et 390 de large ; texte agrandi (approximation : zoom 130 %).

Point restant vu sur les captures : à 320 × 568, le pied (note de compte + bouton + conditions) occupe environ 40 % de
l'écran ; tout reste lisible et défilable, mais la note « compte juste avant de payer » pourrait être masquée sur très
petit écran.

## 8. Réglages encore nécessaires (hors code)

- App Store Connect : vérifier les 4 produits et prix (§ 2), l'offre d'introduction « 3 jours gratuits » sur les 3 Premium, décider l'essai Famille.
- RevenueCat : offering « default » = 3 Premium + `family_monthly` ; webhook déjà en place ; aucun réglage nouveau pour `first_billing_confirmed` (il lit `is_trial_conversion`).
- Supabase : appliquer `20261203000100_paywall_analytics.sql` (non appliquée), puis déployer `revenuecat-webhook`.
- Mettre à jour les notes App Review : la démo guidée (« Commencer », sans compte) montre l'action utile avant le paywall ; la famille d'exemple (« Découvrir sans compte ») reste derrière Premium — à trancher (ouvrir la famille d'exemple en essai de démonstration ou rediriger ce bouton vers /start).
- Textes de la politique de confidentialité : mentionner la mesure du parcours d'abonnement (événements listés § 6) si elle est activée.

## 9. Non vérifiable ici

- Achats sandbox réels sur iPhone (StoreKit, RevenueCat, webhook, éligibilité Apple, Ask to Buy réel).
- VoiceOver réel, Dynamic Type réel (le web n'a qu'une approximation par zoom), notifications réelles (le rappel affiche « disponible dans l'application iPhone » sur le web).
- Tests Deno des fonctions serveur (Deno absent de la session) : la logique `firstBillingOf` est testée par Jest.
