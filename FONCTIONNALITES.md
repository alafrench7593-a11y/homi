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
Tâches partagées, actions rapides de relais, relais nocturne, temps pour soi, journée difficile, urgence organisationnelle, routines, bilan hebdomadaire, signaux de surcharge. ⬜

### Lot C — Calendrier, journal unifié, accueil personnalisable, intro (§ 4, 5, 17, 18)
⬜

### Lot D — Compléments du suivi de l'enfant (§ 6–16)
Chronomètre de prise de biberon, sommeil sieste/nuit + sommeil sûr, aspect des selles / vomissements, humeur de l'enfant, schéma dentaire, développement, souvenirs avec photos, santé (observations, maladies suivies), vaccins, liste « à éviter », recommandations éditoriales. ⬜

## 3. Décisions et limites documentées

- **EPDS non intégrée.** Le Royal College of Psychiatrists détient les droits ; la diffusion à des tiers (ce qu'est une app) exige une autorisation écrite, et l'intégration complète a déjà été refusée à un logiciel clinique (documentation CamCOPS). Conformément au § 22.4, l'app propose un check-in de bien-être **non diagnostique**. À rouvrir uniquement avec une autorisation écrite et la version française validée (Guedeney & Fermanian, 1998).
- **Ressources d'urgence par pays.** France vérifiée (3114 gratuit 24 h/24 ; 15 ou 112 en cas de risque imminent — sante.gouv.fr). Pour les autres pays, l'app affiche le 112 européen et invite à composer le numéro d'urgence local ; les lignes nationales seront ajoutées dans `emergency_resources` après vérification.
