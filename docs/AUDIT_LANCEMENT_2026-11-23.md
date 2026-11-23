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

## 7. Reprise (23/11, après-midi) — préproduction, contrôles ouverts, réconciliation, web

### 7.1 Préproduction (Supabase local, familles fictives)

Base Supabase locale au niveau de la production (146 migrations), puis `20261206000100_tetee_cotes.sql` et
`20261207000100_confidentialite_audit.sql` appliquées **dans cet ordre**. Comptes fictifs : Alice (propriétaire),
Bob (co-parent complet), Claire (limitée à Lou, sans la grossesse), David (autre foyer).

| Vérification depuis l'interface | Avant les migrations | Après |
|---|---|---|
| Claire ne voit que Lou (accueil, Mes apps, Aura, journal du foyer) | fuite B1 (journal) et B2 (relais biberon) reproduites | **OK** |
| RDV privé d'Alice : invisible pour Bob et Claire, y compris dans le flux calendrier | fuite B3 reproduite (flux iCal) | **OK** |
| Retrait de Zélie à Claire : données effacées du cache | entrées de Zélie restées en cache (2 causes) | **OK** : 0 entrée de Zélie après le retrait et après réouverture (correctif `useScopePurge`) |
| Tétée saisie par côté, relue après déconnexion / reconnexion | côtés non enregistrés | **OK** (gauche 1 min / droite 1 min relus) |
| Fichiers et photos (stockage) : Claire lit la photo de Lou, rien de Zélie, pas le document privé d'Alice ; ne peut ni lister ni déposer dans le dossier de Zélie ; Bob tout sauf le privé ; David rien | — | **OK** (matrice complète) |

Production : les deux migrations ont depuis été appliquées en production avec l'accord de la propriétaire
(148 migrations, vérifié en lecture). **B1, B2, B3 ne bloquent plus.**

### 7.2 Contrôles ouverts (données fictives)

| Sujet | Constat | Gravité | État |
|---|---|---|---|
| Fonctions serveur | jeton vérifié dans chaque fonction ; droits relus côté serveur | — | OK (revue du code) |
| Journaux serveur | aucune donnée personnelle écrite (identifiants techniques seulement) | — | OK |
| Rapports de plantage (Sentry) | désactivés sauf accord ; contenu nettoyé (pas de texte saisi, pas d'e-mail) | — | OK |
| Données transmises à Aura | contexte sommeil sans prénom ; **les textes libres (question, journal) partent tels quels** vers le fournisseur d'IA, prénoms compris | important | **ouvert** : masquage des prénoms à ajouter |
| Mesure d'audience | `analytics_events` relie l'étape « grossesse » à l'identifiant du compte | important | **ouvert** : pseudonymiser ou retirer l'étape |
| Journal d'activité du foyer | jamais purgé | moyen | **ouvert** |
| Cache sur l'appareil | 7 jours, en clair ; données intimes et de santé déjà exclues ; le reste (suivis des enfants) y figure | moyen | accepté pour la bêta, à chiffrer avant lancement |
| `storage-cleanup` | fonction absente de `config.toml` | faible | ouvert |

**Durée de conservation configurée, aujourd'hui, en production : aucune.** Le réglage « Durée de conservation » (6 à
120 mois, 36 par défaut) n'était appliqué nulle part et aucune purge n'était planifiée. Correctif :
`20261208000100_conservation.sql` (testé en base éphémère, `98zq_conservation.sql`) — chaque nuit à 3 h 17 UTC :
historique personnel (conversations Aura, retours, humeur et journal intime, scans) au-delà de la durée choisie par
chaque personne ; notifications 90 jours ; mesure d'audience 13 mois ; fichiers en échec de suppression 30 jours ;
photos de l'espace nounou selon la durée du foyer ; réserves de crédits orphelines. Les suivis partagés du foyer
restent tant que le foyer existe. **Non déployée en production** : à appliquer sur ta validation (tuto dans
`docs/TUTOS_CONFIGURATION.md`, § 7).

## Environnements

- Chromium (Playwright) 402×874, 375×667, 320×568 ; démo locale, horloge figée au 23/11/2026 15 h 20 Paris.
- Jest (preset iOS) ; PostgreSQL 16 éphémère (`supabase/tests/run-local.sh`).
- Preuves : captures et vidéos dans le dossier scratchpad de la session (`livrable/audit_chat`, `audit_crud`, `audit_misc`, `audit_next`).
