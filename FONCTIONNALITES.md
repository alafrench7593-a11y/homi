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

## 4. Décisions et limites documentées

- **EPDS non intégrée.** Le Royal College of Psychiatrists détient les droits ; la diffusion à des tiers (ce qu'est une app) exige une autorisation écrite, et l'intégration complète a déjà été refusée à un logiciel clinique (documentation CamCOPS). Conformément au § 22.4, l'app propose un check-in de bien-être **non diagnostique**. À rouvrir uniquement avec une autorisation écrite et la version française validée (Guedeney & Fermanian, 1998).
- **Ressources d'urgence par pays.** France vérifiée (3114 gratuit 24 h/24 ; 15 ou 112 en cas de risque imminent — sante.gouv.fr). Pour les autres pays, l'app affiche le 112 européen et invite à composer le numéro d'urgence local ; les lignes nationales seront ajoutées dans `emergency_resources` après vérification.
