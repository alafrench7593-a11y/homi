# Toi & Moi — fonctionnalités : fait / à faire

Document vivant tenu pendant la mise en œuvre du « prompt maître ultime » (plateforme familiale 0–10 ans + post-partum).
Règles qui s'appliquent à chaque ligne : **aucune couleur modifiée** (test `palette de marque inchangée`), **rien de supprimé**, migrations **non destructives**, **aucun diagnostic, aucune dose, aucune quantité calculée**, **aucune donnée fictive présentée comme réelle**, secrets uniquement côté serveur.

Légende : ✅ fait et testé · 🟡 partiel (détail donné) · ⬜ à faire · 🚫 volontairement non fait (raison donnée)

## 1. Ce qui existait avant ce chantier (conservé tel quel)

| Domaine | État | Où |
|---|---|---|
| Design Liquid Glass + système de mouvement | ✅ | `src/theme/motion.ts`, `src/components/{Motion,Glass}.tsx` |
| Grossesse, bébés attendus, poids, échographies | ✅ | `src/app/pregnancy/*` |
| Biberon : saisie préparé/bu/type de lait/notes, compte à rebours jusqu'au prochain, historique jour/semaine, résumé consultation | ✅ | `src/app/bottle/*`, table `bottle_timers` |
| Tétées, tire-lait, repas, diversification (aliments introduits + réactions), allergènes majeurs signalés | ✅ | `track/[kind]`, `features/child.tsx` |
| Sommeil de l'enfant (mode nuit, réveils comptés) | 🟡 pas de distinction sieste / nuit ni d'heure par réveil | `night.tsx`, table `sleeps` |
| Changes (mouillé / selles) | 🟡 pas d'aspect ni de consistance | table `diapers` |
| Observations (température, médicament noté, symptôme) | ✅ | `child_observations` |
| Dents (20 dents de lait) | 🟡 liste textuelle, date forcée | `teeth.tsx` |
| Croissance (poids/taille/PC), jalons, souvenirs texte | 🟡 pas de courbes de référence, pas de photos | `features/child.tsx` |
| Cycle, fertilité, tests photo analysés sur l'appareil, contraception | ✅ privé par construction | `cycle.tsx`, `fertility/*` |
| Rendez-vous (dont `postnatal`, `vaccination`) avec questions à poser, documents | ✅ | `appointments.tsx`, `documents.tsx` |
| Scanner (code-barres, photo, OCR, nom, saisie manuelle) sur Open Food/Beauty/Products Facts, RappelConso, Ciqual, CosIng | ✅ | `src/app/scanner/*` |
| « Moi aussi » : humeur privée, sommeil du parent, récupération, numéros d'urgence | ✅ | `src/app/me/*`, `emergency.tsx` |
| Foyer, rôles (owner/coparent/caregiver), permissions par domaine, invitations | ✅ | `settings/family.tsx` |
| Rappels (une fois / quotidien / hebdo / intervalle, report), notifications locales et push | ✅ | `settings/reminders.tsx`, `lib/notifications.ts` |
| Communauté modérée, assistant IA sourcé, bibliothèque | ✅ | onglets |

## 2. Chantier en cours — par lots

### Lot A — Suivi post-partum de la mère (prioritaire)
| Exigence (§ du prompt) | État |
|---|---|
| Check-in quotidien < 1 min, facultatif, sautable (22.1) | ✅ `postpartum/checkin.tsx` — 4 questions rapides + « plus de questions » ; un point par jour, modifiable |
| « De quoi auriez-vous le plus besoin aujourd'hui ? » (22.1) | ✅ 7 réponses dont « Je préfère ne pas répondre » |
| Historique et tendances simples, sans récompense ni pénalité (22.2) | ✅ `postpartum/history.tsx` — barres animées sur 14 jours, description neutre ; démarches |
| Espace éducatif baby blues / signes qui justifient une consultation, sourcé (22.3) | ✅ `postpartum/understand.tsx` — 1000 premiers jours, ministère de la Santé ; aucune durée qui fait attendre |
| Questionnaire validé type EPDS (22.4) | 🚫 voir « Décisions » |
| Suivi qui continue au-delà des premières semaines | ✅ ne s'arrête jamais seul (`active` jusqu'à ce qu'elle le désactive) ; rappel du soir facultatif au texte neutre |
| Recommandations graduées selon les besoins déclarés (22.5) | ✅ `supportPlan()` : repos / fatigue-stress / souffrance (dont persistance ≥ 5 jours sur 14) / danger |
| Danger immédiat → orientation humaine urgente (3114 / 15 / 112), jamais une simple notification (22.5) | ✅ affichée dès la case cochée, avant tout enregistrement ; détail jamais stocké ; aucun message au conjoint |
| Partage contrôlé par la mère, privé par défaut, révocable, filtré côté serveur (22.6) | ✅ table `postpartum_shared_status` + déclencheurs de filtre et de révocation ; 28 tests SQL |
| Espace conjoint : comprendre et soutenir + « Comment m'aider ? » (22.7) | ✅ `postpartum/partner.tsx` + carte d'accueil quand elle demande un relais |
| Contacts de confiance, professionnels, questions, démarches, plan de soutien prénatal (22.8) | ✅ `postpartum/support.tsx` ; rendez-vous **privés** possibles (nouvelle colonne `appointments.private_to_creator`, partagés par défaut comme avant) |
| Journal de récupération physique (22.9) | ✅ dans le point du jour + signes d'alerte sourcés (liste POST-BIRTH de l'AWHONN, numéros français) |
| Aucun score, aucune comparaison, langage non culpabilisant — test automatique (22.10) | ✅ `postpartum.test.ts` (22 tests) : textes, contenus et écrans |

### Lot B — Charge familiale (§ 20, 21, 23–28)
| Exigence | État |
|---|---|
| Tâches : titre, catégorie (10), échéance, responsable, priorité, fréquence, statut, notes (§ 20) | ✅ `family/index.tsx`, table `family_tasks` ; récurrence gérée par le serveur (occurrence suivante créée une seule fois) |
| Historique des modifications (§ 20) | ✅ `family_task_events`, écrit uniquement par le serveur ; `family/history.tsx` |
| Actions rapides : je prends le relais, besoin de repos, peux-tu prendre cette tâche, je suis disponible, échanger mon créneau, besoin d'aide aujourd'hui, demander un relais | ✅ `care_requests` ; accepter « prendre cette tâche » la réattribue, accepter un échange réattribue la nuit (côté serveur) |
| Notifications aux membres, texte neutre sur l'écran verrouillé | ✅ catégorie `family` ; « Ouvrez l'application pour répondre » |
| Pas de compétition | ✅ aucun compteur par personne ; test automatique |
| Signaux de surcharge + suggestions, désactivables, non culpabilisants (§ 21) | ✅ `overloadSignals()` : retards, journée chargée, tâches sans responsable, répartition (sans nom ni chiffre), repos demandé ou fatigue déclarée |
| Relais nocturne alterné / fixe / personnalisé, monoparental, confirmations, échanges, conflits (§ 23) | ✅ `family/nights.tsx`, aperçu avant enregistrement |
| Temps pour soi : créneaux libres d'après l'agenda, réserver, relais, reporter, annuler (§ 24) | ✅ `family/me-time.tsx` ; chacun ne réserve que son propre temps (serveur) |
| Journée difficile : essentiel, événements, infos enfant, report validé avant application, aide en un geste (§ 25) | ✅ `family/difficult.tsx` + raccourci sur l'accueil |
| Urgence organisationnelle : minimal, sans animation, gros boutons (§ 26) | ✅ `family/urgent.tsx` |
| Routines avec aperçu et validation (§ 27) | ✅ `family/routines.tsx`, 8 modèles |
| Bilan hebdomadaire neutre ; post-partum seulement si partagé (§ 28) | ✅ `family/review.tsx` |
| Droits | ✅ domaine existant « Listes et organisation » (aucun droit retiré ou ajouté) ; 21 tests SQL |
| Limite | 🟡 les membres apparaissent par leur rôle (« Coparent », « Proche ») : les profils ne sont pas exposés entre membres. |

Corrections au passage : les panneaux du bas ne défilaient plus quand leur contenu était long, et un message pouvait effacer le suivant (ou disparaître aussitôt avec « réduire les animations »).

### Lot C — Calendrier, journal unifié, accueil personnalisable, intro (§ 4, 5, 17, 18)
| Exigence | État |
|---|---|
| Introduction immersive : logo, lumière, mission, fonctionnalités, tableau de bord, puis onboarding ; « Passer » toujours visible ; rejouable ; mémorisée (§ 4) | ✅ `intro.tsx` (première ouverture sans compte) ; « Revoir l'introduction » dans Réglages › Mon accueil |
| Accueil : réordonner, masquer, choisir les raccourcis (§ 5) | ✅ `settings/home.tsx` (préférence gardée sur l'appareil) |
| Accueil : demandes de relais, tâches, post-partum partagé (§ 5) | ✅ cartes « Organisation familiale » et « Après la naissance » |
| Agenda familial : jour, semaine, mois, agenda ; créer, modifier, déplacer, supprimer (§ 18) | ✅ `calendar.tsx`, table `family_events` (domaine « Listes et organisation ») + rendez-vous, tâches, relais, temps pour soi |
| Récurrences, fuseaux horaires, chevauchements (§ 18) | ✅ heure locale conservée au changement d'heure (testé), chevauchements signalés |
| Export iCalendar vers Google / Apple / Outlook (§ 18) | ✅ fichier `.ics` RFC 5545 (VTIMEZONE, RRULE, repli des lignes) — vérifié avec une bibliothèque iCalendar ; rendez-vous privés jamais exportés, santé sous titre neutre par défaut |
| Synchronisation bidirectionnelle Google Agenda / Outlook (API OAuth) | ⬜ non faite : nécessite des identifiants OAuth Google et Microsoft côté serveur et un test réel. L'export .ics est une copie, présentée comme telle. |
| Journal unifié : biberons, repas, sommeil, changes, observations, médicaments notés, dents, souvenirs, rendez-vous, tâches ; filtres, recherche, jour/semaine/mois, statistiques descriptives, export CSV (§ 17) | ✅ `journal.tsx` ; seules les saisies réelles, aucun historique généré |

### Lot D — Compléments du suivi de l'enfant (§ 6–16)
| Exigence | État |
|---|---|
| Biberon : chronomètre début / pause / reprise / fin, cohérent après navigation ou fermeture (§ 6) | ✅ cercle animé sur l'écran biberon ; temps recalculé depuis les horodatages (`bottles.started_at`, `paused_seconds`) ; un seul en cours par enfant (serveur) |
| Aucune quantité ni fréquence prescrite (§ 6) | ✅ quantités saisies par le parent, test automatique |
| Sommeil : sieste / nuit, heure de chaque réveil, repères de couchage sûr sourcés (§ 7) | ✅ (mpedia / AFPA) |
| Changes : couleur, consistance, sang vu ; repères « quand consulter » (§ 8) | ✅ selles pâles → urgence ; noires / rouges / sang → sans attendre (mpedia / AFPA) |
| Vomissements, régurgitations, diarrhée, douleurs, ballonnements, pleurs, méthode de prise de température (§ 8) | ✅ repères : vomissements ou selles liquides répétés, moins de couches mouillées, fièvre avant 3 mois (Manuel MSD, ARS Normandie / carnet de santé) — jamais de diagnostic |
| Humeur et bien-être de l'enfant (§ 9) | ✅ `child/[id]/wellbeing.tsx` |
| Dents : schéma visuel, date choisie, observations, rappel de brossage, rendez-vous (§ 10) | ✅ `teeth.tsx` (données existantes compatibles) ; symptômes jamais attribués aux dents |
| Développement par domaine, frise par année, recherche (§ 11) | ✅ onglet « Moments » |
| Export des mesures de croissance (§ 11) | ✅ CSV |
| Suivi de santé : TDAH (observations par contexte), diabète et maladies suivies (mesures, unités, contexte, consignes du professionnel), sources distinguées, export (§ 12) | ✅ `child/[id]/health-tracking.tsx` ; seuils uniquement depuis le plan du professionnel (refusé sinon, côté serveur) ; aucune dose |
| Vaccins : registre + calendrier officiel (§ 14) | ✅ `child/[id]/vaccines.tsx` ; lien vers le calendrier vaccinal du ministère, pas d'échéances recalculées |
| Scanner : liste « à éviter » du foyer, signalée à chaque scan (§ 15) | ✅ `scanner/avoid.tsx` |
| Courbes de croissance de référence (OMS) | ⬜ non fait : il faut intégrer les tables officielles OMS (LMS) et les faire valider ; l'appli continue d'afficher les mesures sans zone « normale ». |
| Photos et albums de souvenirs | ⬜ non fait : nécessite un stockage privé chiffré pour les photos d'enfants (comme celui des photos de tests du cycle) ; à faire dans un lot dédié. |
| Recommandations de produits (§ 16) | ⬜ non fait : sans catalogue éditorial vérifié, l'application ne recommande rien plutôt que d'inventer. Les données nécessaires (sources, limites, mention sponsorisé / éditorial) sont décrites dans ce document. |

## 3. Relecture de sécurité indépendante (18 octobre 2026)

Un relecteur distinct a revu le code ajouté. Il a trouvé 2 failles bloquantes et 13 autres points ; **tous sont corrigés**, et chaque faille a un test qui la rejoue (`supabase/tests/sql/43_security_review_fixes.sql`, 18 tests).

| Point | Correction |
|---|---|
| Export RGPD : un rendez-vous privé d'un membre apparaissait dans l'export d'un autre (bloquant) | filtré ; l'export inclut aussi les nouvelles données du foyer, selon les droits de chacun |
| Échange de créneau détourné pour s'approprier le temps pour soi d'un autre (bloquant) | seul un relais de nuit de l'auteur est échangeable ; le créneau visé ne change plus |
| Temps pour soi modifiable ou supprimable par un autre membre | réservé à son propriétaire (modification et suppression) |
| Partage post-partum encore visible après le départ du foyer | invisible au départ ; foyer choisi oublié |
| Titre d'une tâche sur l'écran verrouillé ; notification sans contrôle des droits | texte neutre ; envoyée seulement à qui a accès à l'organisation |
| Titre d'un rendez-vous privé dans son rappel | « Rendez-vous » |
| « Fait par » falsifiable, demande traitée rouvrable, professionnel vide accepté | corrigés côté serveur |
| Rappel post-partum en double, questions de sécurité masquées pendant le chargement | corrigés |
| Export CSV : formules Excel possibles | cellules neutralisées (`src/lib/csv.ts`) |
| Fichier .ics : fuseau autre que Paris non décrit | heure UTC dans ce cas |
| Réglage de partage « rendez-vous » inutilisé | retiré |

## 5. Full motion design (18 octobre 2026)

Principe : chaque mouvement est piloté par une donnée réelle (horodatage, saisie, état serveur) ; aucune couleur ajoutée (palette du thème uniquement) ; aucun logo IA ; « réduire les animations » affiche l'état final immédiatement.

**Composants créés**
- `src/components/MotionKit.tsx` : `MotionNumber` (chiffres qui roulent, texte complet pour les lecteurs d'écran), `DrawCheck` (confirmation dessinée), `PulseRing` (onde lumineuse), `useProgress` (apparition des graphiques), `SlideSwap` (glisse directionnelle de période), `Flash` (élément déplacé).
- `src/features/bottleInstrument.tsx` : `BottleInstrument` (instrument en couches : disque de verre, orbite de 60 segments = secondes de la minute, 30 perles = minutes, comète synchronisée sur la seconde réelle, séquence contraction/déploiement + onde au démarrage, pause figée avec anneau pointillé, reprise, résumé modifiable avant validation, coche dessinée) et `ReminderRibbon` (repère du prochain biberon, sans promesse d'alarme).
- `src/features/motionViz.tsx` : `DayRibbon` (journée sur 24 h), `SleepNights` (7 nuits, nuits pleines / siestes en contour), `RelayStrip` (relais de nuit, témoin qui passe à la personne suivante), `DayAvailability` (créneaux libres « respirants », toucher pour réserver), `ScanFrame` (cadre du scanner : coins, balayage, verrouillage), `LoadBar` (tâches du jour : faites / attribuées / sans responsable — des comptes, jamais un score).

**Outils améliorés** : biberon (instrument + ruban de rappel), onglet Suivi (ruban 24 h, nuits de la semaine), graphiques (barres qui poussent, courbes qui se tracent), tâches familiales (case qui se remplit, coche dessinée, trait barrant, sortie de la ligne, annulation si erreur), barre de charge du jour, relais de nuit (ruban + « Prochain relais » sur l'accueil), temps pour soi (disponibilités du jour), agenda (glisse selon la direction, halo sur l'événement déplacé), scanner (cadre vivant, résultat en cascade), dents (pastille qui « pop » à la saisie).

**Correctif** : en mode « réduire les animations », les animations instantanées (`springTo`/`timeTo`) rappelaient la fin sans `{ finished: true }`, ce qui faisait planter les séquences (chaque toast faisait tomber l'écran). Corrigé, test `motionReduce.test.ts`.

**Limites** : pas de transitions à élément partagé (pas de reanimated) ; caméra du scanner non testable sur le web ; pas de photos pour les souvenirs ni de courbes OMS ; les rappels restent des notifications locales, jamais une alarme garantie.

## 6. Catégorie Outils — refonte et synchronisation (18 octobre 2026)

**Catalogue** (`src/lib/domain/toolCatalog.ts`) : tous les outils réels rangés en 18 catégories (alimentation, sommeil, changes, dents, croissance, santé, humeur, grossesse, cycle et post-partum, scanner, calendrier, tâches, relais, temps pour soi, surcharge, souvenirs, rappels et réglages, ressources). Source = `toolCategories` (conservé) + 14 outils existants qui n'y figuraient pas (relais de nuit, temps pour soi, routines, bilan, journal, vaccins, suivi santé, bien-être de l'enfant, produits à éviter, notifications…). Tests : aucun écran historique perdu, identifiants stables pour les favoris.

**Glyphes** (`src/components/ToolGlyph.tsx`) : une silhouette par catégorie (goutte, nuage, dent, bouclier, anneau segmenté, cadre de scan, orbite, soleil, cartes empilées, page…), surface translucide + reflet + liseré, couleurs du thème uniquement (avec transparence), icône posée au centre optique. Animation propre à chaque catégorie (le lait monte, les barres poussent, le bouclier se trace, les segments du cycle s'allument, les coins du scanner se resserrent, le témoin du relais fait un demi-tour, les rayons s'étirent, la coche se dessine…), jouée au survol ou à l'ouverture, jamais en boucle. États : normal, survol, pressé, actif, désactivé (profil enfant à créer). Urgences : sans animation.

**Cartes et écran** (`ToolCard.tsx`, `app/tools.tsx`) : hauteur fixe, contenu centré, zones de texte de hauteur fixe (rien ne saute), grille 2/3/4 colonnes calculée sur la largeur réellement mesurée, recherche sans accents, filtres par catégorie, favoris et « Mes raccourcis » (conservés sur l'appareil), urgences toujours visibles en haut, focus clavier visible. État utile sur les cartes à partir des vraies données (`hooks-tools.ts` : prise en cours, prochain rappel, dernier biberon, dernier change, sommeil en cours, tâches du jour, prochain relais, temps pour soi réservé, prochain rendez-vous, notifications non lues).

**Navigation** : le glyphe de la carte touchée glisse jusqu'à l'en-tête de l'outil ouvert (`toolOrigin.ts` + `Screen`), sans dépendance supplémentaire. Raccourcis de l'accueil : même langage visuel.

**Synchronisation ajoutée** :
- biberon terminé au minuteur → le rappel en cours repart de ce biberon (même délai), comme pour une saisie manuelle ;
- relais de nuit attribué, déplacé, annulé, retiré ou réattribué par un autre → la personne concernée est prévenue (migration `20261019000700_relay_notifications.sql`, test SQL 44) ; un planning de plusieurs nuits = une seule notification ; rien pour ses propres gestes ni pour le temps pour soi ; texte neutre.
- Déjà en place et vérifié dans le navigateur : biberon → historique, onglet Suivi, accueil et cartes Outils ; temps pour soi → agenda et carte ; tâches, rendez-vous, relais → agenda (requêtes partagées, invalidation par table).

**Limite** : les favoris sont conservés sur l'appareil (préférence d'interface), pas synchronisés entre appareils.

## 7. Intégrations et synchronisation (18 octobre 2026)

Le registre complet (statut réel, documentation, variables, limites, tests) est dans **`INTEGRATIONS.md`**. En bref :
- **Courbes OMS** (0–5 ans) dans Croissance : tables officielles intégrées hors ligne, 3 416 valeurs vérifiées, phrases neutres, sans diagnostic.
- **Allergènes** : correspondance français ↔ étiquettes Open Food Facts (bug corrigé), traces « peut contenir », trois niveaux, jamais « sans risque ».
- **Open Food Facts** : cache serveur, quota sous les limites officielles, panne ≠ « introuvable », fiche ancienne datée.
- **Agenda** : abonnement iCalendar par lien secret révocable (Google Agenda, Apple Calendrier, Outlook), droits et vie privée appliqués par la base.
- **Temps réel** entre appareils et membres du foyer (Supabase Realtime), rafraîchissement au retour dans l'application et du réseau ; données privées jamais publiées.
- **Relais de nuit** : notifications serveur en cas de changement par un autre membre.
- Tests ajoutés : SQL 44–45, Deno (calendrier, cache Open Facts), Jest (OMS, allergènes, synchronisation), e2e `agenda_abonnement.py` et `temps_reel.py`.

## 8. Barre de navigation : « Outils » au centre (18 octobre 2026)

- Barre : **Accueil · Suivi · [Outils] · Questions · Profil**. « Outils » est au centre géométrique : deux moitiés de largeur égale ; mesuré à 0 px d'écart sur téléphone, tablette et ordinateur, onglets symétriques.
- La page Outils devient un onglet (même page, même adresse `/tools`, liens existants inchangés) : état actif visible, y compris après rechargement ou lien direct.
- Bouton central : orbe nacrée (dégradé existant), quatre tuiles qui s'écartent puis se reposent au toucher, onde lumineuse, enfoncement en profondeur, anneau blanc quand l'onglet est actif. Réduire les animations : état final immédiat.
- **Rien n'est perdu de l'ancien « + »** : l'appui long sur « Outils » ouvre l'ajout rapide (biberon, tétée, couche, sommeil, repas, note santé, humeur, minuteur, scanner, poser une question), et ces actions sont aussi en haut de la page Outils (« Ajouter maintenant »).
- **Communauté** quitte la barre (symétrie) mais reste accessible : carte « Communauté » dans Outils, espaces par parcours, et tous les liens directs (`/community`, `/(tabs)/community?space=…`).

## 9. Langues et inscription — vague 1 FR + EN (18 octobre 2026)

- **Système multilingue** (`src/i18n/`) : le français est la source ; chaque langue est typée sur ses clés (une clé manquante empêche la compilation). Pluriels par `Intl.PluralRules`, variables `{nom}`, dates/heures/nombres/unités/listes par `Intl`. Une clé absente retombe sur le français (jamais de clé brute à l'écran).
- **Langues disponibles : français et anglais.** 36 autres sont déclarées « en préparation » (dont arabe, hébreu, persan en sens droite-à-gauche) et ne sont pas proposées tant qu'elles ne sont pas traduites et relues.
- **Choix de la langue** : proposée d'après le téléphone (anglais si la langue du téléphone n'est pas disponible), modifiable dans l'introduction, depuis l'accueil (pastille « globe ») et dans Réglages › Langue et pays. Enregistrée sur l'appareil et dans le profil (`profiles.locale`). Le pays est distinct de la langue et fixe les numéros d'urgence affichés.
- **Introduction immersive** : bienvenue + choix de la langue, six univers (cycle, grossesse, enfant, santé, outils, communauté), confidentialité, puis créer un compte / se connecter / essayer sans compte. Glisser pour avancer, « Passer » à tout moment.
- **Inscription et premier parcours** traduits (connexion, inscription, mot de passe oublié/réinitialisation, lien expiré, onboarding, parcours, rappels proposés).
- **Nouveau parcours « Je veux simplement suivre mon cycle »** (sans objectif de grossesse ni contraception) → carte « Mon cycle » neutre sur l'accueil, écran `/cycle`, raccourcis règles/humeur/sommeil/rendez-vous. Migration `20261019001100_journey_cycle.sql`.
- **Centres d'intérêt facultatifs** (santé au quotidien, communauté) enregistrés dans `profiles.interests` (liste fermée).
- **Écran « Votre espace est prêt »** à la fin de l'onboarding : résumé personnalisé (parcours, grossesse, enfants créés, rappels, confidentialité).
- **Accueil et barre de navigation** traduits (salutation, en-tête, raccourcis, onglets, ajout rapide).
- **Garde-fou** : `scripts/i18n-scan.js` repère les textes écrits en dur ; un test bloque toute régression dans les fichiers déjà traduits.

Reste à traduire (vague 2) : les écrans métier (suivi, enfant, grossesse, cycle détaillé, outils, communauté, réglages secondaires, assistant). Compteur du scanner : 3 285 textes en dur dans 114 fichiers (3 560 au départ).

## 10. Navigation : Communauté dans la barre, Profil et Réglages en haut à droite (19 octobre 2026)

- **Barre** : Accueil · Suivi · **Outils** (centre exact) · **Communauté** · Questions. Communauté ouvre la section existante (aucun doublon). Le Profil quitte la barre ; sa route reste valable (liens directs).
- **En-tête** : à droite, Réglages (engrenage) puis l'avatar du Profil (initiale sur dégradé nacré, anneau doré quand le Profil est ouvert, retour au toucher). Il n'existe pas de photo de compte dans le modèle de données : l'avatar par défaut est utilisé partout.
- **Écrans concernés** : Accueil, Suivi, Outils, Communauté, Questions, Mon cycle (et ses variantes « concevoir » / « éviter une grossesse »), Agenda familial, Profil. Les écrans détaillés et formulaires gardent leur bouton Retour, sans en-tête de compte.
- **Accueil** : la date et les icônes (aide, notifications, Réglages, Profil) sur la première ligne, la salutation en pleine largeur dessous (plus de mot coupé sur petit écran). Le raccourci Scanner de l'en-tête est retiré : le scanner reste dans Outils, dans l'ajout rapide (appui long sur Outils) et dans les raccourcis de l'accueil.
- **Profil** : bouton Retour, nouvelle entrée « Mes publications » (pseudonyme, publications et favoris de la communauté). Dans Communauté, l'icône « Mon pseudonyme » devient « @ » pour ne pas se confondre avec le Profil.
- **Test navigateur** : `e2e/navigation.py` (39 vérifications : barre, en-têtes sur 9 écrans, profil, réglages, liens internes, brouillon conservé entre onglets, écran de 320 px, anglais).

## 11. Documents : scanner, lecture, résumé fidèle, carnet de santé (19 octobre 2026)

- **Accueil Documents** (`/documents`) : bouton principal « Scanner un document », import (PDF/fichiers et photos, plusieurs à la fois), recherche en langage courant (« dernière prise de sang », « ordonnances de cette année », « contenant le mot ferritine »), filtres (profil, groupe, favoris, à vérifier, archives), sections « À vérifier » et « Favoris », sélection multiple pour l'export.
- **Scanner** (`/documents/scan`) : photo (autorisation demandée au moment du geste) ou galerie ; sur l'appareil : détection des bords, recadrage par 4 coins, perspective redressée, rotation, couleur / niveaux de gris, lisibilité, alerte de flou, reprise d'une page, ordre des pages, suppression, aperçu ; un seul PDF multipage. Profil associé affiché avant l'enregistrement ; **privé par défaut**.
- **Fiche d'un document** (`/documents/[id]`) : original (lien temporaire de 5 min, aperçu intégré), informations modifiables (avertissement avant de changer de profil), partage avec le foyer explicite et révocable, texte lu (sur l'appareil, par le service de lecture avec accord, ou saisi) et corrigeable, éléments repérés (valeurs + unités + plages recopiées, médicaments, vaccins, échéances) avec statut « extrait automatiquement » → « vérifié par moi » → « confirmé par un professionnel » (source obligatoire), vue ordonnance (archivée par défaut, rien de deviné, aucun conseil de traitement), résumé fidèle en 3 niveaux avec l'origine de chaque information, rappels à partir d'une date confirmée (moment, texte discret, activer/modifier/supprimer), export, archive, suppression complète.
- **Carnet de santé** (`/documents/book`) : par profil (moi, chaque enfant, grossesse) — récents, favoris, derniers résultats, ordonnances, vaccinations documentées, comptes rendus, examens, rendez-vous et échéances, à vérifier, archives. Uniquement des documents réels.
- **Export** (`/documents/export`) : choix des documents, résumés facultatifs, aperçu, risques expliqués, dossier PDF créé sur l'appareil (index + documents), feuille de partage ou téléchargement ; aucun lien public.
- **Sécurité** : migration `20261019001200_documents_v2.sql` (privé par défaut ; extractions soumises aux droits du document — faille corrigée ; document privé non modifiable ni supprimable par la propriétaire du foyer ; profil du même foyer ; suppression en cascade du texte, des extractions, des résumés et des rappels liés), 19 vérifications SQL à deux comptes.
- **Tests** : 40 tests Jest (lecture, résumé, recherche, image, PDF), 4 tests Deno, parcours navigateur `e2e/documents.py` (44 vérifications).

## 12. Module cycle complet, design system du cycle et « zéro débordement » (19 octobre 2026)

- **Palette et composants** (`src/features/cycle/kit.tsx`, uniquement dans le module cycle, choix de la propriétaire) : blanc cassé, rose poudré, lavande, mauve, beige, gris perle, anthracite ; contrastes calculés (AA) ; verre dépoli lisible (flou sur iOS, surface opaque équivalente ailleurs) ; 22 icônes vectorielles dédiées (aucun emoji) ; sélecteurs en puces qui passent à la ligne ; échelles 1–5 ; apparition douce (désactivée si « réduire les animations »).
- **Vue d'ensemble** (`/cycle`, `?all=1` depuis Fertilité et Contraception) : jour du cycle, dernières règles enregistrées, estimations libellées comme telles avec leur fiabilité, symptômes récents, dernière observation de pertes, accès à toutes les rubriques, saisie des règles (5 flux, dates passées, modification et suppression explicites, contrôles de dates), historique, tests (ovulation, grossesse).
- **Calendrier** (`/cycle/calendar`) : mois glissant (geste ou flèches), règles enregistrées (pleines) ≠ estimées (pointillés), fertilité estimée, symptômes, pertes, notes, tests, rendez-vous de la mère ; légende forme + couleur + texte ; détail du jour avec raccourcis de saisie.
- **Symptômes et bien-être** (`/cycle/symptoms?date=`) : 21 symptômes (libido seulement si le suivi de la sexualité est activé), intensité 1–3, humeur, énergie, sommeil, stress, note ; une fiche par jour, complétée plutôt que dupliquée.
- **Pertes vaginales** (`/cycle/discharge`) : 3 étapes (aspect ; odeur et gêne ; contexte : date, heure, jour du cycle et proximité des règles calculés, grossesse, rapport, contraception, produit intime, antibiotiques, note), toutes les listes demandées, orientation immédiate (consulter / urgence) selon des signes saisis, fiches liées ; liste, modification, suppression.
- **10 fiches illustrées** (`/cycle/guides`) : illustration abstraite animée, sources officielles (NHS, ACOG), aucune formulation de diagnostic ni de traitement.
- **Saignements inhabituels** (`/cycle/bleeding`) : 5 situations ; aide d'urgence visible sans rien remplir ; orientation affichée **avant** l'enregistrement.
- **Journal** (`/cycle/journal`), **statistiques descriptives** (`/cycle/stats`, barres animées avec alternative textuelle), **export PDF** (`/cycle/export`, période et rubriques au choix, journal exclu par défaut, fabriqué sur l'appareil), **confidentialité** (`/cycle/privacy` : qui voit quoi, masquage sur l'accueil, sexualité facultative, ce que reçoit l'assistant, effacement de toutes les données du cycle sans supprimer le compte).
- **Carte « Mon cycle » de l'accueil** : éléments choisis et ordonnés, raccourcis (4 au plus), enregistré (fond plein) ≠ estimé (contour pointillé), masquage des données sensibles ; réglages dans `/cycle/home-card` (aussi depuis Réglages › Mon accueil).
- **Base de données** : migration `20261019001300_cycle_v2.sql` (flux à 5 niveaux, symptômes contrôlés, tables `discharge_logs`, `bleeding_logs`, `cycle_journal` réservées à leur propriétaire, `hide_on_home`, export RGPD complété, `delete_my_cycle_data()`), test SQL 48 (22 vérifications, dont deux comptes du même foyer qui ne voient rien l'un de l'autre).
- **Zéro débordement (toute l'app)** : boutons et puces qui passent à la ligne, champs qui ne poussent plus leurs icônes hors de l'écran, en-têtes dont les actions passent à la ligne, cartes Outils à hauteur minimale (plus de titre coupé), mode Nuit défilable, troncatures essentielles supprimées (date, nom du profil, rappels, tâches, notes) ; seules restent les aperçus volontaires (article, message de la communauté) qui s'ouvrent en entier. Audit automatique `e2e/layout_audit.py` (101 pages × 4 configurations : 320 et 390 px, FR et EN, clair et sombre).
- **Tests** : Jest (logique du cycle, libellés FR/EN de chaque valeur, rapport PDF, carte d'accueil, aucun texte en dur), SQL, parcours navigateur `e2e/cycle.py` (27 vérifications), audit de mise en page.

## 13. Conseils personnalisés, douleurs, rapports, roue du cycle (19 octobre 2026)

- **Moteur de conseils** (`src/lib/advice/`) : 18 règles déterministes (rapports, douleurs, pertes, saignements, retard, absence et irrégularité des règles), chacune avec identifiant, informations utilisées, garde-fous, variantes de messages FR/EN, sources et date de révision ; un seul conseil par saisie et par thème (déclencheurs regroupés) ; conseils recalculés à chaque modification ou suppression ; niveaux : information, conseil pratique, à suivre, consultation conseillée, avis médical rapide, urgence. Aucune IA, aucun envoi externe, aucun diagnostic ni traitement.
- **Rapports** (`/cycle/intimacy`, aussi depuis Fertilité) : seule la date est nécessaire ; heure, type, préservatif et incident, contraception habituelle (type, incident), éjaculation, contraception d'urgence, souhait de grossesse, consultation — tout facultatif, avec « je ne sais pas » et « je préfère ne pas répondre » ; saisies masquées par discrétion, modifiables, supprimables.
- **Douleurs** (`/cycle/pain`) : jauge 0–10 (glisser ou −/+, accessible), silhouette simplifiée avec zones (et liste accessible), puis durée, moment, évolution, retentissement, puis — seulement si souhaité — signes associés, grossesse possible, soulagement, médicaments (suivi). Enregistré dans la fiche du jour (pas de doublon). Historique : intensité maximale par cycle, zones, jours perturbés.
- **Pertes** : nouvelles valeurs (quantité habituelle, présence de sang, texture incertaine, douleur pelvienne, fièvre, saignement inhabituel) ; conseil en direct pendant la saisie, récapitulatif après.
- **Récapitulatif** après chaque saisie (`/cycle/recap`) avec les conseils de cette saisie ; **Mes conseils** (`/cycle/advice`, « nouveau » une seule fois) ; **Comprendre le risque de grossesse** (`/cycle/risk`) ; **Trouver un professionnel** (`/cycle/professional`, sans Doctolib — voir INTEGRATIONS §12 ter).
- **Roue du cycle animée** sur la vue d'ensemble : règles enregistrées, phases estimées en pointillés, ovulation estimée en cercle creux, tests positifs enregistrés en point plein (« mesuré »), incertitude affichée, détail par phase ; **« Mes règles ont commencé / sont terminées »** en un geste, récapitulatif, annulation et correction.
- **Confidentialité** : conseils activables (les situations pressantes restent signalées), notifications détaillées désactivées par défaut.
- **Base** : migration `20261019001400_cycle_advice.sql` (colonnes facultatives, retour arrière documenté) ; test SQL 49 (16 vérifications, dont l'isolation entre comptes et l'effacement).
- **Tests** : `src/__tests__/advice.test.ts` (76 tests : les scénarios 1 à 9, retard/absence/irrégularité, cas limites relevés par une relecture indépendante, textes et sources de chaque règle, absence de diagnostic/traitement en FR et en EN) ; `e2e/cycle.py` (parcours réels dans le navigateur, dont les tests 1, 2, 3, 5, 6, 9, 10, 11) ; audit de mise en page étendu à 109 pages × 4 configurations (récapitulatifs remplis avec les textes les plus longs) : aucun débordement.

## 14. Parcours séparés, outils autorisés, besoins particuliers, prénoms (19 octobre 2026)

- **Modèle** : table `user_journeys` (identifiant, type, début, fin facultative, actif/archivé, profil associé : grossesse ou enfant). Plusieurs parcours actifs à la fois (ex. grossesse + deux enfants), jamais deux parcours « corps » incompatibles (éviter / projet bébé / cycle / grossesse). `profiles.journeys` n'est plus écrit par l'app : il est **calculé** par un déclencheur à partir des parcours actifs.
- **Cause du « 26 SA » en projet bébé, corrigée** : la grossesse affichée venait de « la première grossesse active du foyer », sans regarder le parcours. Désormais une grossesse ne s'affiche que si un parcours « grossesse » actif la référence (`visiblePregnancy`) ; une grossesse terminée n'a plus de semaine d'aménorrhée ni de notification.
- **Registre central des outils** (`src/lib/journeys/tools.ts`) : chaque outil déclare les portées où il est autorisé (éviter, projet bébé, cycle, aucun, grossesse, post-partum, bébé, enfant, famille). Il alimente « Tous mes outils », l'accueil, les actions rapides, le bouton « + » et une **garde d'accès** des écrans (`JourneyGuard`) : un lien ancien, une notification passée ou un favori ne rouvrent jamais un parcours terminé. Outils pour tout le monde (scanner, assistant, humeur, sommeil, repas et recettes, rendez-vous, documents, communauté avec forum conseillé) adaptés au profil affiché.
- **Données filtrées, pas seulement masquées** : grossesse (parcours actif), enfants suivis (parcours bébé/enfant), poids de la mère par grossesse, rendez-vous de l'ancienne grossesse retirés, documents et rendez-vous ouverts sur le profil affiché, biberons/couches/tétées toujours rattachés à un enfant né et au prénom affiché avant l'enregistrement.
- **Écrans** : « Modifier mon parcours » (profil, accueil, outils) → `/journeys` (parcours actifs, changer avec confirmation puis archiver par défaut ou supprimer, « Mes parcours précédents ») ; `/journeys/[id]` (données conservées, suppression définitive) ; `/pregnancy/start` (« J'ai un test positif ») ; `/pregnancy/end` (Mon bébé est né / Grossesse terminée / Je préfère ne pas préciser ; un profil par bébé avec heure, poids, taille, terme, photo facultative) ; sélecteur « Ma grossesse / Mon post-partum / Bébé Lina / Enfant Noé / Toute la famille / Moi » ; accueil allégé ; `/meals` ; `/postpartum/recovery` ; `/child/[id]/needs` et `/child/[id]/school`.
- **Neurodéveloppement et besoins particuliers** : onglet de la fiche enfant + outil ; catégories TDAH, TSA, DYS, langage, TDC, tics/Gilles de la Tourette, sensoriel, diagnostic en cours, autre ; suivi (rendez-vous, bilans, professionnels, observations, progrès, émotions, sommeil, routines, école) ; traitements recopiés de l'ordonnance (nom, dose en texte libre, heures, fréquence, dates, instructions, prescripteur), prises du jour et rappels avec Pris / Reporter / Ignorer / Ajouter une note. Aucun calcul de dose, aucune modification, aucun diagnostic.
- **Prénoms** : 12 949 prénoms (INSEE, Licence Ouverte) + liste éditoriale (origine, signification) ; A–Z, féminin/masculin/mixte, longueur, fréquence 2012–2021, origine, recherche, tri, favoris et vote avec le coparent, suggestions pour une fratrie et pour jumeaux/triplés (rapprochements simples annoncés comme tels), liste virtualisée.
- **Base** : migration `20261019001500_parcours.sql` (reprise des données existantes, rien n'est supprimé) ; test SQL 50 (26 vérifications).
- **Tests** : `src/__tests__/journeys.test.ts` (les 14 scénarios sur le vrai code + backend de démonstration) ; `e2e/parcours.py` (43 vérifications dans le navigateur, dont les 14 scénarios) ; `e2e/cycle.py`, `e2e/navigation.py` et l'audit de mise en page mis à jour pour choisir le parcours voulu.

## 15. Repas et recettes (20 octobre 2026)

- **Bibliothèque réelle** : 64 recettes (22 grossesse, 21 bébé, 21 enfant et famille) avec portions, temps de préparation et de cuisson, ingrédients et quantités, étapes détaillées, allergènes (14 allergènes réglementaires, **déduits des ingrédients**), adaptations, conservation, précautions, intérêt nutritionnel (sans promesse), sources et date de contrôle. Contenu : `src/content/recipes/*` ; types, moteur et contrôles : `src/lib/recipes/*`.
- **Statut honnête** : toutes les recettes sont rédigées par une IA (Claude) ; après les contrôles automatiques elles sont « **À vérifier** ». Aucune n'est « Relue » ni « Validée » tant qu'une personne de l'équipe éditoriale ne l'a pas fait (historique journalisé).
- **Contrôles avant publication** (`validate.ts`, bloquants pour la génération de la base) : quantités et unités, chaque ingrédient cité dans les étapes, durées citées cohérentes avec les temps annoncés, cuisson décrite, allergènes = allergènes déduits, sources existantes, licence de l'image, végétarien cohérent, grossesse (aucun aliment à éviter, cuisson à cœur, sources listériose et toxoplasmose, aucune promesse), bébé (étape, source SPF, âge minimal, ni sel ni sucre ni miel avant 1 an, préparation contre l'étouffement, pas de fruits à coque entiers avant 4 ans), doublons.
- **Images** : aucun hébergeur d'images n'était joignable depuis l'environnement de développement ; chaque recette a donc une **illustration générée par programme** (bol, assiette ou verre aux couleurs des ingrédients), étiquetée « Illustration générée », avec source, auteur, licence, droits et indicateur « image générée » enregistrés. Le schéma accepte des photos sous licence ou propres (URL, chemin de stockage) pour les remplacer plus tard.
- **Profil affiché** : grossesse (trimestre), bébé (âge, **texture déclarée qui prime sur l'âge**, aliments déjà introduits, allergies de la fiche, végétarien, sans porc, aliments refusés, recommandations du professionnel, « avis nécessaire avant tout nouvel allergène »), enfant (âge, allergies), famille. Jamais de purée pour une femme enceinte, jamais une recette d'enfant de 5 ans pour un bébé.
- **Écrans** : `/meals` (bibliothèque, catégories selon le profil, filtres durée, budget, saison, chaud/froid, végétarien, sans porc, allergènes exclus, favoris, recherche) ; `/meals/[slug]` (fiche complète, portions ajustables, ajout au menu ou aux courses) ; `/meals/menu` (menu 3 à 7 jours, trimestre, budget, temps, portions, « ce que j'ai », famille avec adaptation pour chaque enfant, remplacer, déplacer, ajouter une recette, enregistrer pour le foyer) ; `/meals/shopping` (liste par rayon, partagée avec le coparent, cases à cocher, « déjà à la maison », ajout libre) ; `/meals/pantry` (« Que puis-je cuisiner avec ce que j'ai ? ») ; `/meals/new` (recette personnelle, ou brouillon de bibliothèque pour l'équipe éditoriale) ; `/meals/settings` (réglages alimentaires de l'enfant) ; `/admin/recipes` (contrôles, Relu / Validé / Retirée, corrections qui renvoient en relecture).
- **Accueil** : une seule carte « Idée repas » adaptée au profil affiché (masquable dans Mon accueil). **Scanner** : après le scan d'un aliment, recettes compatibles, précautions générales (lait cru, poisson fumé, charcuterie, miel avant 1 an…) avec une alternative, et lien « Que puis-je cuisiner avec ce que j'ai ? ».
- **Base** : migration `20261020000100_recipes.sql` (référentiels, recettes, ingrédients, étapes, photos et licences, sources, relectures, favoris, menus, courses, réglages de l'enfant ; RLS : bibliothèque modifiable par les éditeurs seulement, recette personnelle toujours en brouillon) et `20261020000200_recipes_seed.sql` (généré par `scripts/gen-recipes-seed.ts`, qui refuse toute recette en erreur) ; test SQL 51 (16 vérifications). L'ancien contenu `src/content/meals.ts` est remplacé.
- **Tests** : `src/__tests__/recipes.test.ts` (contrôles + 12 scénarios) ; `e2e/recettes.py` (53 vérifications dans le navigateur).

## 16. Réorganisation par profil, vaccins, aide pour la nuit, articles (20 octobre 2026)

- **Accueil = profil affiché** (`src/lib/journeys/relevance.ts`) : rendez-vous, rappels et notifications filtrés selon le profil et le parcours. Sur le profil d'un nouveau-né, plus d'« Échographie du 3e trimestre », de rendez-vous de grossesse ni de SA ; un rendez-vous de grossesse reste visible sur le profil « Ma grossesse ». Une notification d'un parcours terminé ou changé (grossesse archivée, enfant plus suivi, ancien parcours de cycle) n'apparaît plus, ni dans la cloche ni dans la boîte de réception.
- **Outils simplifiés** : catégories « Journal et souvenirs » et « École ou mode de garde » retirées des outils et des raccourcis (les données déjà saisies sont conservées) ; **« Post-partum » n'est plus une catégorie indépendante** : sommeil, humeur, récupération et allaitement de la mère sont rangés dans « Mon bébé est né » tant qu'un post-partum est en cours (plus d'entrée « Mon post-partum » dans le sélecteur ni dans les parcours proposés ; un post-partum déjà commencé est conservé). Dents uniquement pour un bébé ou un enfant. Organisation familiale (tâches, routines, agenda) dans « Moi », « Enfant » et « Toute la famille ».
- **Grossesse** : développement du bébé, rendez-vous et examens, échographies et documents, poids facultatif, sommeil et humeur, repas adaptés, préparation à la naissance, prénoms, articles et vidéos, et une section **« Sexualité pendant la grossesse »** (questions fréquentes, idées reçues, désir, communication dans le couple, quand demander conseil).
- **Mon bébé est né** : biberons et allaitement, minuteur, couches, sommeil, poids et taille, rendez-vous, vaccins, diversification et idées de repas, produits scannés, et le nouvel outil **« Aide pour la nuit »** (`/night/help`) : noter sommeil, réveils et tétées ou biberons (mode nuit), résumé simple de la nuit et des 7 dernières (sans norme ni score), repères généraux par âge, routines apaisantes, couchage en sécurité, quand appeler, questions à préparer (ajoutées au prochain rendez-vous). Aucun diagnostic, aucune promesse, aucune culpabilisation.
- **Vaccins** (`/child/[id]/vaccines`) : calendrier des vaccinations 2026 (ministère chargé de la Santé, avril 2026, actualisé en juillet 2026 ; rotavirus : HAS 12/07/2022), source et date affichées ; dates **indicatives** calculées à partir de la date de naissance ; obligatoire ou recommandé selon l'année de naissance ; jamais « en retard » (« date indicative passée : à vérifier avec le carnet »). Actions : prochaines échéances, créer un rappel, prévoir un rendez-vous, préparer ses questions, marquer le rendez-vous comme fait, noter un vaccin fait (saisie du parent), registre du carnet conservé.
- **Articles et vidéos** : 41 nouveaux articles par parcours (projet bébé 6, éviter une grossesse 4, grossesse 13 dont 5 sur la sexualité, bébé 8, enfant 6, sommeil des parents 4), rédigés avec l'aide d'une IA à partir de 65 pages officielles réellement consultées le 20/10/2026 ; chaque article affiche ses références (date de publication et de consultation) et son statut éditorial (**Brouillon généré par IA / À vérifier / Relu / Validé pour publication**, jamais « relu » ou « validé » sans nom et qualification). Bibliothèque filtrable par parcours. **Vidéos** : aucune vidéo publiée ; une vidéo de geste de santé ne peut être publiée qu'après validation par un professionnel qualifié (contrainte en base) ; sujets en préparation affichés comme tels.
- **Base** : migration `20261020000300_reorganisation.sql` (dose du calendrier sur une vaccination notée, rendez-vous « fait », statut éditorial des articles et vidéos, contraintes de validation, catégories « Sexualité et couple » et « Sommeil ») et `20261020000400_articles_seed.sql` (généré par `scripts/gen-articles-seed.ts`) ; test SQL 52.

## 17. « Éviter une grossesse » et « Projet bébé » : calendrier du cycle (20 octobre 2026)

- **Calendrier du cycle** (`/cycle/calendar`), outil principal visible depuis l'accueil (premier raccourci « Calendrier » ; la carte du cycle d'« Éviter une grossesse » ouvre le calendrier) : toucher un jour pour noter le **début** ou la **fin** des règles, **corriger** un début (« mes règles ont commencé ce jour ») ou **supprimer** une saisie (avec confirmation) ; cycles précédents conservés avec leur durée et celle des règles ; prochaines règles et période fertile **estimées**, avec la mention que les dates sont approximatives et que le cycle peut varier.
- **Éviter une grossesse** : calendrier, règles, symptômes, contraception (méthodes, rappels, contraception d'urgence, consultation). La période fertile peut être affichée, mais **aucun jour n'est présenté comme sans risque** et le calendrier seul n'est pas présenté comme une contraception fiable.
- **Projet bébé** : calendrier, règles, période fertile estimée, tests d'ovulation, tests de grossesse, glaire (facultative), notes et rappels. Aucune semaine de grossesse tant qu'un parcours « Grossesse » n'est pas créé ; les données du cycle restent celles de la personne, jamais mélangées à un autre profil.
- **Tests** : `src/__tests__/reorg.test.ts` (accueil d'un nouveau-né, parcours grossesse, calendrier du cycle, rappels de vaccins, aide pour la nuit) ; `e2e/reorg.py` (38 vérifications dans le navigateur).

## 18. Nutrition 0–10 ans, produits enfants, sources (20 octobre 2026)

- **Recettes** : 64 recettes publiées + **499 brouillons** rédigés par une IA (8 lots, `src/content/recipes/drafts/`), soit 563 recettes documentées (ingrédients du dictionnaire, quantités, étapes, temps, allergènes, précautions, conservation, sources). Repas : petit-déjeuner, déjeuner, dîner, goûter et **dessert** ; besoins : sans lait, sans gluten, sans œuf, sans fruits à coque, riche en fer, en calcium, en fibres. Les brouillons sont **invisibles des parents** (filtre de l'application et règle de la base) tant qu'une personne de l'équipe éditoriale ne les a pas relus dans l'administration. Les remarques mineures restantes de la relecture automatique (quantités, nombre de portions) sont à traiter lors de la relecture humaine.
- **Import** (`/admin/import-recipes`) : lot JSON ou CSV, contrôles automatiques (structure, dictionnaire d'ingrédients, allergènes, âges ≤ 10 ans, sources, sécurité), identifiant déjà utilisé refusé, score affiché, enregistrement au statut « Brouillon IA ». Script équivalent : `npx tsx scripts/check-recipes.ts` puis `scripts/gen-recipes-seed.ts` (migration `20261020000600`).
- **Score nutritionnel éditorial sur 100** (`src/lib/recipes/score.ts`, panneau « Score » de chaque recette, badge sur les cartes) : composition par ingrédient issue de la table **CALNUT 2020 (ANSES, Licence Ouverte)**, comparée aux références de l'**ANSES (21/02/2025)** pour la tranche d'âge (6–11 mois, 1–3, 4–6, 7–10 ans). Base 40 ; + légumes/fruits/légumineuses, fibres, protéines, fer, calcium ; − sucres ajoutés, sel, graisses saturées. Atouts, pistes d'amélioration, nutriments par portion, approximations et méthode affichés. Mention explicite : **score interne de l'application, ni Nutri-Score officiel, ni certification, ni avis médical**. Pas de score pour les recettes de grossesse.
- **Classements** (`/meals/rankings`) : recommandées, économiques, rapides, équilibrées, par tranche d'âge. **Coût par portion** : affiché seulement si un prix vérifié et daté existe pour chaque ingrédient (table `ingredient_prices`), sinon « prix non disponible ». Planning de la semaine et liste de courses : inchangés, dessert compris ; ils n'utilisent que les recettes visibles.
- **Produits enfants** (`/products`, `/products/[id]`, `/products/compare`, administration `/admin/products`) : catalogue de **produits réels seulement**, ajoutés par l'équipe par code-barres depuis Open Food Facts / Open Beauty Facts / Open Products Facts (photo créditée, composition, contenance), catégorie, âge **recopié de l'emballage**, atouts et précautions rédigés par l'équipe, vérificateur obligatoire pour publier. Critères objectifs expliqués (cosmétiques : composition connue, sans parfum, sans huiles essentielles, sans allergènes parfumants à déclarer — règlement (CE) 1223/2009 —, sans phénoxyéthanol dans un produit non rincé pour le siège — décision ANSM du 13/03/2019 ; alimentation : sucres, sel, édulcorants). Filtres : catégorie, âge, budget, composition, marque ; comparateur (3 produits). Un cosmétique n'est jamais présenté comme un traitement. **Le catalogue est vide** tant que l'équipe n'a pas ajouté de produit ; en démonstration, seuls des produits fictifs signalés peuvent être ajoutés.
- **Prix** : prix datés avec magasin, ville, type (pharmacie, grande surface…), prix au litre ou au kilo, lien vendeur s'il est connu et preuve. Deux origines : **Open Prices** (récupérés côté serveur, l'équipe choisit ceux qu'elle garde) ou saisie de l'équipe avec sa source. Jamais de prix dans le futur, jamais de disponibilité affirmée.
- **Sources et lectures** (`/sources`, administration `/admin/resources`) : 22 pages réellement consultées (ameli.fr, Santé.fr, ANSES, Santé publique France / Manger Bouger, mpedia.fr de l'AFPA, *La Revue du Praticien*, INSPQ, EUR-Lex, CALNUT). Titre, éditeur, résumé rédigé par l'équipe, âge, dates de publication et de consultation, lien d'origine ; aucune photo ni aucun extrait recopié. Catégorie « Recettes familiales » vide (aucun site vérifié). Filtres par type et par âge.
- **Navigation** : outils « Produits enfants », « Sources et lectures », « Classements des recettes » ; liens dans l'administration.
- **Base** : migrations `20261020000500_nutrition_produits.sql` (dessert, brouillons invisibles des parents, `ingredient_prices`, `kid_products`, `product_prices`, `external_resources`), `20261020000600_recipes_drafts_seed.sql`, `20261020000700_external_resources_seed.sql` (généré par `scripts/gen-resources-seed.ts`) ; test SQL 53.
- **Tests** : `src/__tests__/nutrition.test.ts`, `supabase/tests/sql/53_nutrition_produits.sql`, `e2e/nutrition.py`.

## 19. Interface : boutons animés, textes adaptatifs (20 octobre 2026)

- **Jetons d'interaction centralisés** (`src/theme/motion.ts`, `interaction`) : pression à 0,97 en 120 ms, relâchement en 200 ms, soulèvement de 2 px au survol (web) en 180 ms, courbes de décélération naturelles. Couleurs, rayons et ombres : ceux du thème existant (aucune couleur modifiée).
- **Bouton** (`Button`) : variantes primary, secondary, **outline**, ghost, danger (**destructive**), night ; tailles sm / md / lg ; hauteur minimale (jamais fixe) : un libellé long passe à la ligne au lieu d'être coupé ; icône avant ou après (`iconRight`) qui s'anime légèrement au survol (flèche qui avance, « + » qui tourne) ; surface éclairée au survol ; chargement en fondu ; **anti double envoi** : si l'action renvoie une promesse, le bouton passe en chargement et ignore les appuis suivants jusqu'à la fin. La confirmation de réussite reste affichée par l'écran après la réussite réelle (message), l'erreur par un message compréhensible.
- **Bouton icône** (`IconButton`, tons plain / filled / primary), **bouton flottant** (`Fab`), **favori** (`FavoriteButton` : saut de l'icône et onde à l'ajout, sur les recettes et les articles), interrupteur (`Toggle`), onglets (`Segmented`, indicateur qui glisse), pastilles (`Chip`).
- **Zones tactiles** : 116 zones tactiles maison (cartes, lignes, cases de calendrier, liens, sélecteurs) passent par `Tappable` (`src/components/Tappable.tsx`) : même pression, même survol que les boutons. Les 14 zones qui ont déjà leur propre animation (instrument du biberon, onglets du dock, cartes d'outils…) et les fonds de fenêtres modales ne sont pas modifiés.
- **Résultats filtrés** (`ResultsFade`) : la liste réapparaît en fondu court quand un filtre, une recherche ou un tri change (recettes, classements, produits, sources).
- **Accessibilité (web)** : anneau de focus clavier visible de la couleur principale sur tout élément interactif ; « réduire les animations » coupe aussi les transitions CSS ; les mots très longs (liens, adresses) passent à la ligne.
- **Grands écrans** : sur tablette et ordinateur, le contenu est une colonne centrée de 760 px maximum (lignes lisibles) ; sur téléphone, pleine largeur. La version web garde son cadre « téléphone » au-delà de 600 px.
- **Audit de mise en page** (`e2e/layout_audit.py`) : 6 configurations (320 et 390 px en français et en anglais, thème sombre, tablette 820 px, ordinateur 1280 px) ; détecte le défilement horizontal de la page, les textes coupés ou hors écran, les libellés qui sortent des boutons et, désormais, les **textes qui se chevauchent**.

## 4. Décisions et limites documentées

- **EPDS non intégrée.** Le Royal College of Psychiatrists détient les droits ; la diffusion à des tiers (ce qu'est une app) exige une autorisation écrite, et l'intégration complète a déjà été refusée à un logiciel clinique (documentation CamCOPS). Conformément au § 22.4, l'app propose un check-in de bien-être **non diagnostique**. À rouvrir uniquement avec une autorisation écrite et la version française validée (Guedeney & Fermanian, 1998).
- **Ressources d'urgence par pays.** France vérifiée (3114 gratuit 24 h/24 ; 15 ou 112 en cas de risque imminent — sante.gouv.fr). Pour les autres pays, l'app affiche le 112 européen et invite à composer le numéro d'urgence local ; les lignes nationales seront ajoutées dans `emergency_resources` après vérification.
