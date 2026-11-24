# HOMI — Rapport complet de contrôle qualité des outils (24/11/2026)

Branche `homi/fondations`. Aucun build, aucune soumission. Détail outil par outil : `HOMI_TOOL_QA_INVENTORY.md`.

**Environnement réel des tests** : export web de l'application dans Chromium (390 × 844 et 320 × 568), moteur de
démonstration local (aucune donnée de production), Premium simulé. Jest (Node). **Aucun test sur iPhone ni simulateur
iOS** : aucun Mac ou téléphone n'est relié à cet environnement. Rien ci-dessous ne vaut test natif.

## 1. Résultats chiffrés

| Contrôle | Résultat |
|---|---|
| Outils inventoriés | 128 |
| Ouverture sans erreur (ni écran d'erreur, ni erreur JS, ni texte technique) | **128 / 128** |
| Création prouvée (écriture relue dans les données) | 48 |
| Persistance après rechargement prouvée | 45 |
| Modification prouvée | 7 (médicaments, biberon ×3, diversification, sommeil adulte, symptômes cycle) |
| Suppression prouvée | 6 (médicaments, biberon ×3, symptômes cycle, journal du cycle) |
| Outils de saisie non vérifiés | voir l'inventaire (« à tester ») : scanners (caméra), documents (scan), repas, garde, prénoms, fiche enfant, bilan de nuit, journal complet |
| Écrans de consultation (lecture, calcul, articles) | ouverture seule vérifiée |
| Jest | **4 713 / 4 713** |
| Visite guidée (scénario e2e) | 154 / 156 contrôles (2 écarts mineurs voulus, voir §4) |
| Batterie e2e historique (89 scénarios) | 38 réussis après relance un par un ; les 51 autres triés (§5) |

## 2. Bugs trouvés et corrigés pendant ce contrôle

| Bug | Correction | Preuve |
|---|---|---|
| Visite guidée bloquée sur le web : « Revoir la visite » la mettait aussitôt en pause (accueil servi à `/app`) | `tourPath` : `/app` = accueil | `tour.test.ts` ; scénario 0 → 154 contrôles |
| Petit écran : étape 1 de la visite sans bouton « Suivant » (visite bloquée) | bouton Suivant dans le bandeau compact | scénario 320 × 568 |
| « Élément introuvable » dans la visite : l'explication de « Mes apps » cachait la recherche | explication masquée pendant la visite | scénario |
| **Aura** : « Lina vient de boire 120 ml » demandait « Pour quel enfant ? » | prénom cité = enfant concerné (accents, casse, mot entier ; deux prénoms → question) | `auraIntents.test.ts` ; Chromium : une confirmation → biberon de 120 ml enregistré |
| Médicaments : 2 interrupteurs sans libellé visible (« Me rappeler chaque prise », « Traitement en cours ») | libellés affichés | capture |
| Champs date en demi-largeur : « 24/11/202 » coupé | marge du champ date ajustée | capture |
| Vibrations la nuit (avis concurrents : bébé réveillé) | aucune vibration 21 h – 7 h sans accord, même sans mode nuit | `motionSystem.test.tsx` |
| Accès sans paiement à « Moi » et au catalogue | fermés aux comptes non abonnés (décision de la propriétaire) | `premiumStrict.test.ts` |
| Intro sans le relais entre parents | tableau « Relais » ajouté (communauté déjà présente) | Chromium, 8 tableaux sans erreur |

## 3. Parcours métier vérifiés (Chromium)

- **Biberon** : saisie rapide, historique ouvert sans rien saisir, correction 180 → 190 ml, suppression, rechargement.
- **Allaitement / jumeaux** : deux tétées simultanées pour deux nourrissons ; arrêter l'une ne touche pas l'autre ;
  après rechargement, l'autre est toujours en cours.
- **Sommeil enfant** : sieste démarrée, toujours en cours après rechargement, arrêtée.
- **Couches, étapes, dents, vaccins, température** (38,6 accepté ; 48 °C refusé avec message), **diversification**.
- **Médicaments** (parent et enfant) : création + rappel, modification, suppression ; heure obligatoire signalée.
- **Grossesse** : poids, mouvements, ressenti (enregistrement vide refusé avec message).
- **Cycle** : règles, douleurs, saignements, pertes (3 étapes), symptômes, journal.
- **Famille** : tâche rapide, mission en 3 étapes (notification à l'autre parent), « Vider ma tête » (2 tâches après
  vérification), « Je décroche », temps pour soi, cercle d'entraide (parent solo), message « Se comprendre » envoyé
  après confirmation, **relais** (partage + « dernier relais transmis » conservé).
- **Communauté** : publication créée et retrouvée après rechargement.
- **Rendez-vous** avec rappel ; **humeur** et **journal intime**.
- **Neuro** : page sans diagnostic (avertissement affiché) ; aucun mode enfant sur téléphone (supprimé avant).

## 4. Points mineurs restants (non bloquants, documentés)

- Visite guidée 320 × 568 : le bandeau recouvre ~2 px d'une zone déjà grisée (découpe plafonnée à 55 % de l'écran).
- Césures dans les petites cases de statistiques (« Traite-ments », « Prises no-tées ») sur le web.
- 25 textes tronqués à 130 % de taille de texte (audit précédent) ; cibles < 44 px sur le calendrier de cycle.

## 5. Batterie e2e historique

33 scénarios réussis sur 89 au premier passage (4 en parallèle). Les échecs relancés un par un échouent aussi : ce ne
sont pas des échecs de charge. Tri automatique (élément recherché présent ou non dans le code) :
- **périmés** (élément supprimé par les refontes : anciens thèmes de couleur, ancienne recherche de l'accueil,
  ancienne présentation d'Aura, ancien mode enfant…) ou **antérieurs au Premium strict** (écran couvert par l'offre) ;
- **port fixe** (8822 / 8831) : relancés sur ces ports ;
- **à vérifier** : modules de l'accueil (« Au fil de nous », cocon) absents de la configuration par défaut [probable :
  scénario périmé], achat famille de crédits.
Vérifications faites à la main sur les échecs les plus suspects :
- communauté « publication anonyme » : **fonctionne** (publication enregistrée anonyme) ; l'échec vient du scénario ;
- grossesse « formulations » : texte passé au tutoiement (« ta sage-femme ») → scénario périmé ;
- site « noindex » : posé par l'en-tête HTTP de Vercel (`vercel.json`), pas dans le HTML → scénario à adapter ;
- Aura (scénario sans abonnement) : écran couvert par l'offre depuis le Premium strict → scénario périmé.
Aucun échec de la batterie n'a révélé de bug confirmé non corrigé. Les scénarios périmés n'ont pas été réécrits
(environ 45) : ils ne prouvent donc plus rien, ni dans un sens ni dans l'autre.

## 6. Ce qui reste impossible ici

Achats et essai (sandbox Apple / RevenueCat), restauration, suppression de compte et connexion Apple sur iPhone,
notifications réelles, caméra (scanners, documents), deux téléphones synchronisés en temps réel, performance mesurée
sur un iPhone ancien, VoiceOver, Dynamic Island, clavier iOS.

## 7. Décision

**BUILD BLOQUÉ**

Aucun crash ni perte de données constatés sur les parcours testés. Mais le cahier des charges interdit de valider ce
qui n'a pas été testé, et les points du §6 (paiement, compte, notifications, synchronisation, performance) ne peuvent
l'être qu'avec une version installée sur iPhone (build de test interne, sur ordre explicite de la propriétaire), suivie
d'une recette sur appareil.
