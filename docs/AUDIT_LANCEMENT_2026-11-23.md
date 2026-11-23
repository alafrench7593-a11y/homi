# Audit avant lancement — HOMI — 23/11/2026

Branche `homi/fondations`. Familles fictives, démo locale (Chromium) + base PostgreSQL 16 éphémère pour les règles d'accès.
Aucun build de distribution, aucune soumission, aucune écriture en production.

## Verdict : **lancement bloqué**

Deux raisons, dans l'ordre :

1. **Fuites de confidentialité en production tant que la migration `20261207000100_confidentialite_audit.sql` n'est pas déployée.** Le correctif est écrit et testé (2788 assertions, 0 échec ; sans lui 5 échecs qui reproduisent les fuites). Il attend ta validation.
2. **Rien n'a été vérifié sur iPhone** (clavier natif, gestes, rendu, Liquid Glass natif). Tout le parcours a été joué dans Chromium.

Une fois le point 1 déployé et un passage sur un iPhone réel fait sans défaut bloquant : **utilisable en bêta privée**. Pas « prête au lancement » : il reste 40 outils sans parcours complet vérifié (voir Complétude).

## 1. Confidentialité (bloquant d'abord)

| # | Problème | Correctif | Retest | Environnement | État |
|---|---|---|---|---|---|
| B1 | Journal d'activité du foyer : un parent à droits limités lisait les lignes d'un enfant hors de son périmètre, d'une grossesse sans accès, de documents privés | `_audit_row_readable` dans la politique `household_audit_log_sel` | `98zp_confidentialite_audit.sql` (OW, CL limité à K1, CP, XX autre foyer) | PG16 éphémère | **corrigé, NON déployé** |
| B2 | Relais biberon, stock de lait, portions, dépenses : pas de filtre `child_scope` | politiques restrictives `*_child_id_scope` | idem | PG16 | **corrigé, NON déployé** |
| B3 | Flux calendrier : RDV « pour moi » d'un parent visibles par l'autre | filtre `for_parent` / `shared_with_household` dans `calendar_feed_data` | idem | PG16 | **corrigé, NON déployé** |
| M1 | Même téléphone, déconnexion puis autre compte : favoris, raccourcis, brouillons, file hors ligne, cache d'images de l'ancien compte | `resetAccountState()` au changement d'utilisateur | `accountReset.test.ts` + Chromium : clés `homi.*` vides après déconnexion | Jest + Chromium | corrigé |
| M3 | Accès à un enfant retiré : ses données restaient 7 jours dans le cache enregistré sur l'appareil | `purgeForScope` au changement de périmètre (enfant ou grossesse) | `scopePurge.test.ts` | Jest | corrigé (pas joué en navigateur avec un vrai retrait de droits) |
| — | Carte Aura ancienne après retrait de droits ou changement d'enfant | relecture de la destination, du profil actif et des droits **au tap** | `auraIntents.test.ts` « droits RETIRÉS » ; Chromium : carte « · Noé » après bascule | Jest + Chromium | vérifié |
| m2 | Notifications sur l'écran verrouillé : la quantité peut s'afficher si le parent l'a choisi | aucun (masquer cassait un choix explicite) | — | — | **décision produit** |
| m3 | File d'analytics | effacée avec les clés `homi.*` au changement de compte | — | Jest | corrigé indirectement |
| m4 | Durée de conservation des données | non traité | — | — | **ouvert** |

Également à déployer : `20261206000100_tetee_cotes.sql` (côtés de tétée) — sans elle, la saisie par côtés de l'Allaitement ne s'enregistre pas sur le serveur réel.

**Non vérifié** : fichiers et photos (stockage), fonctions serveur une par une, rapports de plantage, journaux serveur, contenu exact des requêtes IA en production (seul le nettoyage côté serveur est testé : aucun prénom envoyé dans le contexte sommeil).

## 2. Perte de données

| Cas | Résultat | Environnement |
|---|---|---|
| Double tap sur Enregistrer (Sommeil, Biberon, Allaitement, Croissance) | 1 seule saisie à chaque fois | Chromium |
| Échec d'écriture pendant une correction (Biberon, Allaitement, Croissance) | valeur en base inchangée, message « ta saisie est conservée, réessaie », brouillon gardé (160 ml, 14 min, 9,75 kg), nouvelle tentative = 1 ligne | Chromium (panne simulée) |
| Coupure réseau pendant une création | mise en file sur le téléphone ; rejeu avec le même identifiant, doublon ignoré par le serveur (`ignoreDuplicates`) | Jest (`offlineQueue`, `offlineFlushRace`) — pas jouable en démo |
| Persistance après réouverture | Sieste 14 h 20, Biberon 170 ml, Allaitement 14 min, Croissance 9,8 kg : tous relus après rechargement | Chromium |

## 3. Corrigé pendant cet audit (cette session)

| Problème | Correctif | Retest |
|---|---|---|
| **Web : le curseur disparaissait** dès qu'un champ devait défiler pour être visible (ex. 320×568 : taper « 44,5 » dans Périmètre crânien n'écrivait rien) | `DISMISS_ON_DRAG` : plus de fermeture du clavier au défilement sur le web (5 conteneurs) | avant : focus perdu, valeur vide ; après : focus gardé, « 44,5 » ; test Jest |
| Carte Aura « Ajouter un poids » : curseur pas posé | focus posé après la transition d'écran | Chromium : `growth-field-weight_kg` actif |
| Aura répondait « Ouvrir » à « Comment utiliser Biberon ? » / « À quoi sert Relais ? » (bouton « Comment ça marche ? ») | questions d'explication exclues des intentions | 7 formulations FR/EN testées |
| Relais : pas de mot libre du parent ; l'aperçu pouvait changer entre la relecture et l'envoi | mot gardé (effacé après envoi) ; relecture figée ; bandeau + « Actualiser le brouillon » | `relayDraft.test.tsx` |
| Accueil sans prochaine action | « Prochaine étape » locale : « Enregistrer un premier sommeil », « Voir la journée » après une sieste ; prénom si plusieurs enfants ; « Plus tard » = plus reproposée | `nextStep.test.ts` + Chromium (Lina / Noé, réouverture) |
| Recherche « assistant » : un doublon passait devant HOMI Aura | intention explicite couvrant toute la requête prioritaire | `branchement200.test.ts` |
| Couverture visuelle sous le seuil (89,5 %, hérité de la vague 3) | listes du cycle animées | 92,4 % |
| Cache après retrait d'accès (M3) | voir § 1 | — |

Suite complète : **237 suites, 4503 tests, 0 échec** ; typecheck sans erreur. Lint non lancé (consigne).

## 4. Aura — trois résultats chiffrés

| Mesure | Résultat | Comment |
|---|---|---|
| Outils retrouvés par leur nom | **127/127** en français, **127/127** en anglais | automatique (`auraCatalogCoverage.test.ts`) |
| Destination existante pour chaque outil | **127/127** | automatique (route vérifiée dans `src/app`) |
| Action réellement accomplie après le tap, depuis le vrai chat | **7/7** : sein, sieste 14 h 35 → 14 h 20 (enregistrée seulement après le geste du parent, persistante), relais à son père (brouillon, rien envoyé), poids (curseur posé), grossesse, changer d'enfant, « il vient de finir son bib » en mode sans IA | parcours manuels scriptés, Chromium |

Panne de l'IA simulée : **0 appel serveur**, les cartes d'action et les outils fonctionnent.

## 5. Complétude

- Outils distincts au catalogue : **127** (147 entrées en comptant les entrées de compte), chacun compté une fois.
- Bout en bout vérifié dans cette session (créer, voir, corriger, persister, panne) : **5** — Sommeil, Biberon, Allaitement, Croissance, Relais.
- Tableau par outil (`docs/TRACKING_COUVERTURE.md`, état au 22/11, **pas mis à jour après la vague 3**) : FAIT 51 · PARTIEL 15 · SANS SUIVI 30 · À FAIRE 40 (136 lignes).
- Promis mais absent ou partiel (exemples du tableau) : écran nuit du sommeil enfant non refait ; repas, menus et garde-manger « donnée principale seulement » ; mesures de biberon en cuillères à faire.

## 5 bis. Finitions (même jour, après le rapport)

- **Lisibilité du texte sur le verre** : le verre liquide floutait à peine (flou 1,5, voile 24 %) ; sur la barre d'onglets, le contenu se lisait à travers les libellés (« Moi » à 2,6:1). Plancher de lisibilité pour tout verre qui porte du texte (flou ≥ 8, voile ≥ 55 %) ; sur iOS 26 le style passe de `clear` à `regular`. Captures avant/après. Aucun texte blanc posé à nu sur un fond clair trouvé sur 249 routes (les 28 cas détectés étaient des boutons foncés masqués par la barre ou l'en-tête au moment de la capture).
- **13 erreurs de typage** apparaissant dès `expo start` (types générés) : corrigées par un type explicite des styles animés.
- **Outils incomplets** : 0 « À FAIRE », 0 « PARTIEL » (98 FAIT, 38 SANS SUIVI, 136 lignes). Les 15 derniers (repas, vaccins, cycle, mode nuit, école, minuteur biberon, 6 outils famille/couple) ont la donnée en grand, l'élément ouvert dans l'adresse et une fiche de correction ; testés avec le backend de démonstration ; ouverts sans erreur dans Chromium sauf cycle (Premium, pas de parcours cycle dans la démo) ; parcours complet rejoué dans Chromium sur « Ma place » (correction, double appui, réouverture).
- **Vaccins** : « 0 / 0 / 0 » pour un enfant de 13 mois sans dose notée → « 15 à vérifier » (doses passées non notées) ; « à venir » compte les doses dues ou proches.
- Suite complète : **242 suites, 4565 tests, 0 échec** ; typecheck sans erreur ; couverture visuelle 93,1 %.

## 6. Reste à vérifier (non fait)

- **iPhone réel** : clavier natif (barre « Suivant/OK » des pavés numériques), gestes des tiroirs, rendu Liquid Glass iOS 26, grande taille de texte système, petit iPhone (SE).
- Balayage complet des éléments cliquables (fait par écrans clés seulement).
- Comptes : deuxième parent à droits limités joué en base (PG16), pas dans l'interface ; compte grossesse seul joué via Aura uniquement.
- Retrait de droits joué en navigateur (seulement en test unitaire).

## Environnements

- Chromium (Playwright) 402×874, 375×667, 320×568 ; démo locale, horloge figée au 23/11/2026 15 h 20 Paris.
- Jest (preset iOS) ; PostgreSQL 16 éphémère (`supabase/tests/run-local.sh`).
- Preuves : captures et vidéos dans le dossier scratchpad de la session (`livrable/audit_chat`, `audit_crud`, `audit_misc`, `audit_next`).
