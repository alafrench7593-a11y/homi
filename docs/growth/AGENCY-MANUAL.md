# Manuel de l'agence HOMI (prompt 1 — Agency Manual)

Chaîne obligatoire pour chaque page : **Données → BRIEF → SERP → OUTLINE → code source → contrôle technique → éditeur indépendant → réparation → validation de la propriétaire → publication → suivi.**
Ce manuel complète `CLAUDE.md` / `AGENTS.md` du dépôt (règles du projet, prioritaires) ; il ne les remplace pas.

## Règles opérationnelles
1. Aucune page avant un BRIEF.md validé. 2. Chiffres (volume, difficulté, position, impressions) seulement depuis une source réelle, datée ; sinon « non disponible ». 3. Jamais de fonctionnalité, prix, test, utilisateur, témoignage ou chiffre inventé (référence : `HOMI-KNOWLEDGE.md`). 4. Une page = une intention. 5. Lire les 10 premiers résultats avant de choisir le format. 6. Chaque section répond à une question réelle. 7. HTML brut vérifié avant toute indexation. 8. Page rendue examinée, pas le brouillon. 9. Corrections locales. 10. Briefs, outlines, rapports conservés dans `docs/growth/projects/<slug>/`. 11. Aucun contrôle supprimé pour passer une validation. 12. Santé sensible : validation humaine qualifiée avant publication. 13. Aucune preuve scientifique inventée. 14. Aura n'est pas médecin. 15. Aucune donnée privée de famille. 16. Pas de reconstruction d'une page approuvée pour un défaut mineur. 17. Toute erreur récurrente devient une règle ici.

## Style
Pas d'introduction générique, de bourrage de mots-clés, de FAQ inventée, de tableau copié, de faux témoignage, de statistique sans source, de prix non daté, de capture artificielle présentée comme réelle, de contenu seulement publicitaire, de promesse médicale, de culpabilisation des parents. Site au vouvoiement.

## Une page est terminée quand
brief respecté · contrôles techniques passés · informations vérifiables · éditeur indépendant favorable · conformité faite · aucun défaut critique restant · **publication validée par la propriétaire** (Partie 28).

## Autonomie (Partie 28)
Autorisé sans demande : recherche, analyse, audit, briefs, rédaction de briefs validés, développement local, tests, corrections locales, documentation, push sur `homi/seo-auto`.
Validation obligatoire : publication en production (`homi/fondations`), prix, abonnements, commissions, paiements, dépenses, données sensibles, contenus médicaux, suppression d'URL.

## Règles apprises (ajouter ici après chaque défaut récurrent)
- La transformation tu → vous casse les accords (« vous le souhaites ») : relire chaque phrase transformée.
- Un résultat calculé doit être visible sans défilement sur mobile (barre d'état).
- Grilles : `min-width: 0` sur les enfants, sinon débordement horizontal.
- Guillemets « » toujours insécables.
- Contenu repris de l'app : dédoublonner et vérifier les libellés santé avant le site.
