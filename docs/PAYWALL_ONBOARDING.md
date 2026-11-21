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
sur ce chemin-là — voir § 8. **Mis à jour le 04/12/2026 (§ 10)** : ce bouton mène désormais à /start ; la famille
d'exemple est un lien secondaire du résultat (/start/sample).

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
- Notes App Review : tranché le 04/12/2026 (§ 10) — « Découvrir sans compte » → démo guidée /start ; texte mis à jour dans PUBLICATION.md § 8.
- Textes de la politique de confidentialité : mentionner la mesure du parcours d'abonnement (événements listés § 6) si elle est activée.

## 9. Non vérifiable ici

- Achats sandbox réels sur iPhone (StoreKit, RevenueCat, webhook, éligibilité Apple, Ask to Buy réel).
- VoiceOver réel, Dynamic Type réel (le web n'a qu'une approximation par zoom), notifications réelles (le rappel affiche « disponible dans l'application iPhone » sur le web).
- Tests Deno des fonctions serveur (Deno absent de la session) : la logique `firstBillingOf` est testée par Jest.

## 10. Passe Paywall Designer réelle (04/12/2026)

Branche locale `homi/paywall-designer-pass` (depuis `homi/fondations`, 28232f7). Skill **Paywall Designer 2.1**
(13/11/2026, SKILL.md + references/ + scripts/ lus en entier, fournis par la propriétaire : méthode, pas des ordres).
Aucun prix modifié, aucune action en production, aucune dépendance ajoutée (playwright-core installé dans le dossier du
skill, hors dépôt ; `install.mjs` non exécuté). Le skill vise SwiftUI/StoreKit : tout est adapté à Expo / React Native
et aux composants existants (prix toujours lus par RevenueCat / StoreKit au moment de l'affichage).

### 10.1 Étapes du skill, une par une

| Étape | Statut | Détail |
|---|---|---|
| 0. Lire le produit | faite | Promesse : accueil « Toute la famille, au même endroit », fiche « … à partager avec votre co-parent ». Pas de propriétaire joignable : décisions marquées **supposé** (ci-dessous). |
| 0. `offer.mjs init app` + `before.html` + check « avant » | faite | L'existant n'est pas redessiné à la main : `capture.py` (scratchpad) rejoue le parcours RÉEL sur l'export web et sérialise le DOM de react-native-web dans le kit iPhone du skill (402 × 874, marques `data-pw` posées depuis les testID). `shoot.mjs before.html --offer offer.before.json --talk none --small`. |
| 1. `rivals.mjs` | **pas faite** | itunes.apple.com refusé par le réseau de la session (ENOTFOUND / proxy). Remplacé par l'étude concurrents existante (prix NON vérifiés, jamais affichés dans l'app) reportée dans `rivals` d'offer.json. |
| 1. `offer.mjs check / card / lines` | faite | Carte de prix ci-dessous ; seules les formulations de `lines` servent de gabarit (bouton, ligne légale, frise). |
| 2. `talk.json` + `flow.json` | faite | Acheteur, promesse, moment, 4 doutes (prix, co-parent, oubli d'annuler, compte), après le oui. Chaque `asks` (étape, besoin) est réutilisé plus loin. |
| 3. Dessiner deux versions + check | faite | Pas de maquette HTML : le CODE est modifié puis re-capturé (3 tours : r1, r2, r3). Paire A/B = même écran, seul le héros change : B frise (intégrée), A résultat (`/dev/paywall?direction=A`). |
| 3. Image générée | non faite | Aucun outil d'image utile sans dépenser des crédits ; l'illustration existante `HeroArt` (famille) est réutilisée sur l'écran d'étape. |
| 4. Critique par un critique indépendant (agent qui ne voit que les PNG) | **pas faite de façon indépendante** | Cette session n'a pas d'outil pour lancer un sous-agent. Critique faite par moi selon critique.md (« si tu ne peux pas lancer de critique »), en jouant d'abord l'acheteur méfiant, sur les PNG. 3 tours. |
| 5. Code | faite | Expo / RN (aucun SwiftUI) : PaywallView, Offers, FirstWinFlow, demos, Done, offer.ts, i18n ×5, analytics + migration. |

Fichiers de travail (non versionnés) : `scratchpad/paywall2/designer/` (offer.json, offer.before.json, talk.json,
flow.json, card.txt, lines.txt, before.html, flow-r3*.html, `shots/{before,r1,r2,r3,r3-b,r3-en}/` avec `sheet.png` et
`check.json`).

### 10.2 Carte de prix (`offer.mjs card`, inchangée côté prix)

- Échelle par mois : Premium annuel 10,00 € · 6 mois 11,67 € · mensuel 14,99 € · Famille 19,99 € ; concurrents cités
  (NON vérifiés) de 2,50 € à 17,99 € : l'annuel est dans la fourchette, au niveau des offres « expert ».
- Économies (arrondies à l'inférieur) : annuel −33 %, 6 mois −22 % par rapport au mensuel.
- Avertissements du script : 4 formules payantes (« peut-on en fusionner deux ? ») ; l'essai n'est pas sur Famille → le
  dire là où l'on choisit (fait : « sans essai » sur la carte Famille).
- Test à lancer en premier (héros) : **A frise d'essai** contre **B résultat de la démo**, même titre, mêmes formules,
  même pied ; juger sur le revenu par vue de paywall après remboursements.
- À décider par la propriétaire (**supposé** en attendant) : (1) formule présélectionnée = **annuel** (règle du skill),
  constante `DEFAULT_OFFER` dans `offer.ts`, réversible ; (2) essai Famille dans App Store Connect ; (3) durée d'essai
  3 jours (concurrents 7 à 14 j, non vérifiés). Le test « titre » existant (generic / need) reste en place ; le test
  « héros » est proposé pour la suite, pas lancé en même temps.

### 10.3 Écarts trouvés (règle du skill → existant) et corrections

| Règle (référence) | Existant | Correction |
|---|---|---|
| Paywall ≤ 60 mots, legal compris (screens.md § 1) | 172 mots | 63 (FR, dont 5 de la ligne « Démo » absente en production), 58 (EN) |
| Restaurer / Conditions / Confidentialité visibles sans défiler (markup.md, `unseen`) | en bas du défilement | dans le pied fixe, sous la ligne légale |
| Un seul héros ; aucune liste de bénéfices quand la frise ou le résultat est le héros (§ 2) | aperçu + frise + 3 bénéfices | B : titre + frise ; A : titre + résultat ; bénéfices seulement dans C |
| Deux formules en tête, deux lignes par carte, rien de répété (§ 2) | 4 cartes, 4 lignes, « Pour toi et ton ou ta co-parent » et « 3 jours gratuits » répétés | Annuel + Mensuel ; « Aussi : 6 mois, Famille » déplie le reste ; co-parent dit une fois sous les cartes |
| Formule par défaut : l'annuel, avec l'essai (price.md § 3) | mensuel | annuel (supposé, à confirmer) |
| Le bouton dit ce qu'il fait sans répéter durée ni prix (§ 5.6) | « Démarrer mes 3 jours gratuits » / « S'abonner à 14,99 €/mois » | « Commencer l'essai gratuit » / « M'abonner au mois · pour 6 mois · pour un an » |
| Ligne légale = gabarit `terms` (≤ 20 mots, essai, montant, renouvellement, annulation) | sans « annulable » ; phrase séparée « au moins 24 h avant le renouvellement » | « 3 jours gratuits, puis 119,99 €/an. Renouvellement automatique, annulable à tout moment. » ; la phrase « 24 h » (absente des pages Apple actuelles, rules-detail.md) est retirée ; « comment arrêter » passe sur l'écran après le oui |
| Frise : Aujourd'hui · Rappel · Montant (§ 2, talk.md § 5) | 2 étapes, phrases longues | 3 arrêts en mots-clés ; l'arrêt « Rappel, si tu l'actives » n'apparaît que si l'appareil peut le programmer (iPhone / Android), jamais sur le web |
| L'essai n'est pas plus fort que le prix ; le montant facturé est le plus gros prix | OK | gardé (montant en gras sur la carte, équivalent mensuel plus petit) |
| Onboarding ≤ 35 mots par écran, question en haut, réponses dans la zone du pouce, écho de la réponse précédente (onboarding.md, screens.md § 3) | 47 / 48 mots, réponses en haut, pas d'écho | 33 / 33 mots (warn), cartes en bas, image sur l'écran d'étape, rappel « J'ai un bébé » au-dessus de la question du besoin |
| Résultat ≤ 25 mots, pas de tour des fonctions (§ 2, § 5) | 112 mots (démo complète + « Au quotidien, tu retrouverais » ×3) | 35 mots : titre, phrase courte, version compacte de la démo (le vrai composant, sans le reste) |
| Après le oui : ce qui est acheté, quand ça facture, comment arrêter | pas de « comment arrêter » | « Pour arrêter : Réglages › ton nom › Abonnements. » ; corps du rappel et de l'invitation raccourcis |
| Mesure (onboarding.md § 6) | pas de vue par écran, pas de réponse, pas de début d'achat | `onboarding_step_viewed`, `onboarding_answer`, `purchase_started` (+ migration `20261204000100`, test SQL `98zo`) ; `onboarding_started.source` = first_open / welcome_start / welcome_demo |
| Une seule sortie | croix seule | gardé |

**Décision de la propriétaire appliquée** : « Découvrir sans compte » (/welcome) → `/start?from=welcome_demo` (démo
avant compte). La famille d'exemple reste accessible : lien secondaire « Famille d'exemple » sur le résultat de la démo
(sans compte) → `/start/sample` (même démonstration qu'avant). **« Sans mur immédiat » : non obtenu.** La famille
d'exemple n'a toujours pas Premium : l'accueil d'exemple montre le mur, franchissable par l'essai SIMULÉ sans paiement.
Supprimer ce mur demande de changer le backend de démonstration partagé (`src/lib/backend/demo.ts`, hors périmètre) et
casserait les e2e qui testent ce mur (premium.py, paywall_premium.py, credits_demo.py, offres.py) : à trancher.
`/intro` garde son propre bouton « Découvrir sans compte » vers la famille d'exemple (hors périmètre, non modifié).

E2e mis à jour (75 scripts : `pg.get_by_text('Découvrir sans compte')…click()` → `location.assign('/start/sample')`, même
état qu'avant) : liste exacte dans le commit (`git show --stat`). Non modifié volontairement : `intro_profils.py`
(teste le bouton de /intro).

### 10.4 Critique (tours notés, critère de critique.md, 1 à 5) — critique faite par moi, PAS indépendante

| | Avant | r1 | r3 (intégré) |
|---|---|---|---|
| G1 les 3 acheteurs savent combien et quand | oui (mais montant sous 4 cartes) | oui | oui (frise + ligne légale) |
| G2 rien de faux / non sourcé | oui | oui | oui |
| G3 sortie visible et neutre | oui | oui | oui |
| G4 `shoot.mjs` sans FAIL | non (77) | non (52) | non (37, voir ci-dessous) |
| P1 continue la promesse | 3 | 4 | 4 |
| P2 répond aux vrais doutes | 3 | 4 | 4 |
| P3 offre comprise en 5 s | 2 | 4 | 4 |
| P4 bon moment | 4 | 4 | 4 |
| P5 chaque élément mérite sa place | 2 | 3 | 4 |
| Mots | 1 | 3 | 4 |
| Onboarding | 3 | 4 | 4 |
| D1 appartient au produit | 3 | 3 | 3 |
| D2 hiérarchie | 2 | 4 | 4 |
| D3 typo et espacement | 3 | 3 | 3 |
| D4 richesse tirée du produit | 3 | 3 | 3 |
| D5 finition (petit écran) | 2 | 3 | 3 |

Coupé avant d'ajouter (dans l'ordre) : liste de bénéfices, phrase « 24 h », ligne « Prix de l'App Store », titres
« Comment ça se passe » / « Ta formule » / légende des dates, aperçu du résultat dans B (le titre « need » le reprend),
« Premium » répété sur chaque carte, deux cartes sur quatre (dépliables), « Au quotidien » ×3 sur le résultat, phrases
d'Aura, corps du rappel et de l'invitation. Ajouté : l'arrêt « rappel » de la frise (iPhone), « sans essai » sur Famille,
« Pour arrêter » après le oui, une image sur l'écran d'étape. Refusé : afficher « 3 jours gratuits » sur chaque carte
(warn du check) — l'essai est dit dans la frise et la ligne légale, et Famille dit « sans essai ».

FAIL restants (r3, réponse en une ligne) :
- Démo 97 mots (FR) : c'est le vrai composant (journal de sommeil) demandé par le brief, pas du texte d'écran.
- « La ligne ne dit pas qu'elle renouvelle » (FR seulement) : heuristique anglaise du script (/renew/) ; la ligne dit
  « Renouvellement automatique » ; en anglais le contrôle passe.
- Paywall iPhone B avec l'arrêt « rappel » et le titre « need » : 67 mots (FR) ; formules dépliées : 82 mots — le
  dépliage est un choix de la personne.
- Après le oui : 57 mots (budget 45).
- Petit iPhone (375 × 667) : la 2ᵉ carte et les lignes sous les cartes défilent sous le pied fixe (le check les voit
  « recouvertes ») ; bouton, ligne légale et liens restent visibles.

Ce qu'une note ne prouve pas : que plus de gens paient. Test à lancer d'abord : héros frise (B) contre résultat (A).

### 10.5 Vérifications (04/12/2026)

Voir le rapport de la session (résultats chiffrés : tsc, i18n-scan, gen-routes, inventaire, privacy-check, Jest complet,
tests SQL locaux, e2e `paywall_premiere_reussite.py` avant 101/101 et après, e2e premium / credits_demo comparés à
l'avant). Captures : `scratchpad/paywall2/avant/` et `scratchpad/paywall2/apres/` (390 et 320, avec / sans essai, FR / EN).
