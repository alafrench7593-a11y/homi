# Tests sur iPhone — onboarding et Premium (TestFlight)

Ce que le web ne peut pas prouver : fluidité réelle (60/120 i/s), retour haptique, VoiceOver, StoreKit, essai
gratuit, restauration. À faire sur un iPhone avec la version TestFlight, compte **Sandbox** connecté
(Réglages › App Store › Compte Sandbox). Noter pour chaque ligne : OK / KO + capture ou vidéo d'écran.

## 1. Appareils et réglages à couvrir

| Cas | Comment |
|---|---|
| Petit écran | iPhone SE / mini (ou Zoom d'affichage « Plus grand ») |
| Grand écran | iPhone Pro Max |
| Sombre / clair | Centre de contrôle › Mode sombre |
| Texte agrandi | Réglages › Accessibilité › Affichage et taille du texte › Texte plus grand (au maximum) |
| Réduire les animations | Réglages › Accessibilité › Mouvement › Réduire les animations |
| VoiceOver | Réglages › Accessibilité › VoiceOver (triple clic sur le bouton latéral) |
| Économie d'énergie | Centre de contrôle › Mode économie d'énergie (ProMotion limité à 60 i/s) |

## 2. Onboarding (8 temps)

| # | Vérifier | Attendu |
|---|---|---|
| O1 | Premier lancement | Le logo maison s'anime **une seule fois**, bouton « Commencer » utilisable tout de suite |
| O2 | Où en êtes-vous ? | Sélection animée + petite vibration ; « Espaces ouverts » se met à jour |
| O3 | Besoins / foyer | 2 choix max classés ; outils mis en avant changent en direct ; cercle d'avatars |
| O4 | Qui s'en occupe ? | La carte suit le doigt sans saccade, part vers la personne ; boutons équivalents |
| O5 | Démonstration | Vrais composants, mention « Exemple », la tâche se coche avec sa coche ✓ |
| O6 | Votre HOMI | Objectif, priorité, 3 outils et première action cohérents avec les réponses |
| O7 | Accords | Données de santé obligatoire ; les autres facultatifs ; liens CGU / confidentialité |
| O8 | Révélation | Les fenêtres s'allument au fil des enregistrements, aucun score |
| O9 | Premium | « Voir les formules » et « Continuer sans Premium » visibles ; écran sauté si déjà abonné |
| O10 | Interruption | Quitter l'app au temps 4, la rouvrir : reprise au même endroit, réponses conservées |
| O11 | Hors réseau | Mode avion à l'étape accords : message clair, rien de perdu, réessai possible |
| O12 | Compte existant | Se reconnecter avec un compte ayant fini l'onboarding : arrivée directe sur l'accueil |
| O13 | Supabase | Après l'onboarding, la ligne `profiles.onboarding_answers` est remplie (vérif. côté serveur) |

## 3. Premium (Sandbox, aucun vrai paiement)

| # | Vérifier | Attendu |
|---|---|---|
| P1 | Ouverture | Prix **réels** de l'App Store (14,99 / 69,99 / 119,99 €), formules + bouton visibles sans défiler |
| P2 | Essai éligible | « Commencer l'essai de 3 jours » + frise avec la date réelle J+3 et le prix |
| P3 | Achat annuel | Feuille Apple → succès → Premium actif, vue « abonné » (formule, renouvellement) |
| P4 | Serveur | Supabase `subscriptions` à jour (webhook RevenueCat reçu) |
| P5 | Restauration | Supprimer / réinstaller l'app → « Restaurer les achats » → Premium revient |
| P6 | Changement de formule | Mensuel → annuel : immédiat ; annuel → mensuel : à l'échéance |
| P7 | Annulation | Réglages iOS › Abonnements › Annuler → accès conservé jusqu'à l'échéance |
| P8 | Expiration | En Sandbox l'abonnement expire vite (≈ minutes) → retour au paywall, données conservées |
| P9 | Achat annulé | Fermer la feuille Apple → message neutre, aucun faux succès |
| P10 | Réseau coupé | Mode avion au moment d'acheter → erreur claire, réessai possible |
| P11 | Non éligible | Compte Sandbox ayant déjà eu l'essai → **aucune** mention d'essai, prix plein |
| P12 | Co-parent | Le second adulte du foyer profite de Premium sans payer |

## 4. Performance (version TestFlight, pas en développement)

- Réglages › Développeur › (si disponible) ou Xcode Instruments sur Mac : images/s pendant les transitions
  d'onboarding, le geste du temps 4 et la sélection des formules. Cible : 60 i/s stables, 120 i/s sur ProMotion.
- Sans Mac : filmer l'écran (Centre de contrôle › Enregistrement) et signaler tout à-coup visible.
- Aucun écran blanc entre deux étapes ; ouverture de l'app à froid < 2 s jusqu'au premier écran utile.

## 5. Accessibilité

- VoiceOver lit chaque choix avec son état (« sélectionné »), chaque formule avec prix, période, essai.
- Texte au maximum : rien n'est coupé, les boutons restent visibles (défilement possible).
- Réduire les animations : états finaux immédiats, aucun mouvement de parallaxe.
