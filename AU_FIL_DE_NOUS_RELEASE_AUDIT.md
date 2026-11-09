# Au fil de nous : audit de publication

> Établi le 9 novembre 2026 sur le code local (commits `0c492af`, `ec0f076`, `958f2cf`, **non poussés**).
> Rien n'a été déployé, soumis ou modifié en production. Légende : **VÉRIFIÉ** = test exécuté avec preuve ;
> **NON VÉRIFIÉ** = pas exécuté (jamais compté comme réussi).

## A. Verdict

**NOT READY** pour une publication sur l'App Store ou Google Play.

Le code est stable : tous les tests automatiques passent et aucune faille de sécurité grave n'a été trouvée. Mais des
**bloquants hors code** empêchent la soumission (§ J) et **rien n'a été testé sur un vrai téléphone**. Une **bêta
interne** (TestFlight, testeurs internes) devient envisageable une fois les migrations déployées (avec ton accord)
et après une première passe sur appareil.

| Contrôle | Résultat | Preuve |
|---|---|---|
| TypeScript (`npx tsc --noEmit -p .`) | VÉRIFIÉ : 0 erreur | exécution du 09/11 |
| Tests unitaires (jest) | VÉRIFIÉ : 1426 réussis / 1426, 125 suites | exécution du 09/11 (condition des commits) |
| Tests base de données (`supabase/tests/run-local.sh`) | VÉRIFIÉ : 1517 réussis, 0 échec | exécution du 09/11, migrations comprises |
| Textes en dur (`scripts/i18n-scan.js`) | VÉRIFIÉ : 0 | exécution du 09/11 |
| Fonctions serveur (`deno check`) | VÉRIFIÉ : 9 fonctions modifiées sans erreur | exécution du 09/11 |
| Tests sur iPhone / Android réels | **NON VÉRIFIÉ** | aucun appareil disponible ici |
| ESLint | **NON VÉRIFIÉ** | pas configuré dans le projet |

## B. Clavier (priorité de la mission)

- Composant commun `src/components/keyboard.tsx` (test `keyboard.test.tsx` réussi). Il est utilisé dans le chat,
  les commentaires de la communauté et les cartes d'accueil.
- Vérifié dans un navigateur web en tailles 375×667 et 320×568 : champ visible au-dessus du clavier, touche
  « Entrée » qui passe au champ suivant, fermeture de feuille.
- **Le travail de l'agent clavier était encore en cours à la rédaction** (feuille « rendez-vous »). Son rapport sera
  ajouté ici avec ses preuves.
- **NON VÉRIFIÉ** : le comportement réel du clavier iOS et Android (le web ne simule pas le clavier natif).

## C. Écrans et navigation (216 routes)

- VÉRIFIÉ : les 216 routes ont été parcourues par un robot. Les faux « introuvable » sont corrigés et il n'y a plus de
  lien mort (matrice `matrice_finale.csv`).
- VÉRIFIÉ (navigateur, compte de démonstration, 09/11) :
  - compte gratuit : Suivi, Outils et Questions affichent l'écran Premium verrouillé ; Réglages, Urgences et
    Confidentialité restent ouverts ;
  - compte Premium : aucun verrou, et l'assistant affiche « Bientôt disponible » ;
  - les réponses issues des articles (`/assistant/local`) restent accessibles.
- Mise en page : 28 correctifs de style, sans aucune fonctionnalité supprimée.
- Écran de chargement pendant la vérification de session (`session-loading`).
- Avertissement connu, **sans effet utilisateur** : en mode développement web, React signale les attributs
  d'accessibilité des illustrations SVG. Il est conservé volontairement, car les retirer dégraderait VoiceOver et
  TalkBack.

## D. Outils (141)

- VÉRIFIÉ par 4 agents : environ 10 bugs corrigés et aucun lien mort.
- Corrigé le 09/11 : un outil mis en favori depuis « Outils des autres profils » apparaît désormais dans « Mes
  raccourcis » et s'ouvre sur le bon profil.
- Corrigé : la modification d'un traitement reprend l'état réel de ses rappels.
- **NON VÉRIFIÉ** à l'écran : la création d'un rappel, 2 outils « projet bébé » et 1 outil post-partum, signalés par
  les agents comme non parcourus de bout en bout.

## E. Performance

- **NON VÉRIFIÉ / NON MESURÉ** : aucune mesure avant/après (démarrage, mémoire, taille du paquet) n'a été faite.
  À mesurer sur une build de production installée sur un appareil.

## F. Supabase et sécurité

- VÉRIFIÉ : aucun problème P0 ni P1. Les problèmes P2 et P3 sont corrigés par la migration `20261109000100_audit_acces`
  (réversible) et testés (`92`, `93`). Exemple : on ne peut plus vérifier si une personne appartient au foyer d'une
  autre famille.
- Premium strict côté serveur : déclencheur `_require_premium_write`, et `requirePremium()` dans 6 fonctions payantes
  (lecture de documents, scanner, lieux, produits, photo de cycle).
- Aucun secret dans le code ni dans les commits (recherche des motifs de clés le 09/11).
- **Migrations non déployées.** Le déploiement attend ton accord.

## G. Paiements (RevenueCat)

- Prix dans l'app : 10,99 € par mois (seule formule avec 3 jours d'essai), 49,99 € par an, 79,99 € à vie. L'offre
  Assistant IA à 5 € est conservée mais affichée « bientôt disponible ».
- Le bouton d'achat n'annonce un essai que si la boutique le propose vraiment. Le droit Premium vient toujours du
  serveur (`has_premium`).
- **NON VÉRIFIÉ** : un achat réel ou sandbox, la restauration et le renouvellement. Les produits ne sont pas encore
  créés dans les consoles (§ J).

## H. Notifications et hors connexion

- 15 correctifs, dont :
  - le « rappeler dans 30 min » d'un traitement garde ses boutons « Pris / Plus tard » ;
  - les notifications envoyées sont rédigées en 5 langues ;
  - un message prévient quand une saisie hors connexion n'a pas pu être synchronisée.
- Tests `medNotifsOffline`, `doneNotifications` et `medDst` réussis.
- **NON VÉRIFIÉ** : la réception réelle des notifications push sur un appareil.

## I. Langues (fr, en, es, de, it)

- VÉRIFIÉ : l'interface est complète dans les 5 langues, sans collision de clés (test `i18nNoCollision`).
- Les 1133 articles sont traduits en es, de et it, au statut **à relire**, donc **non publiés** (règle respectée).
- Décision à prendre : la coupure des mots longs en allemand sur les petits écrans.

## J. Préparation des boutiques et actions restantes

**À faire par toi (bloquants) :**

1. Faire valider les CGU et la politique de confidentialité par un juriste, puis les publier à des URL publiques.
   Prévoir aussi une URL de support et une page web de suppression de compte.
2. Créer la clé Apple de révocation « Se connecter avec Apple » (nécessaire à la suppression de compte).
3. Créer les produits d'abonnement dans App Store Connect et Google Play, et les relier à RevenueCat.
4. Créer un compte de démonstration Premium pour l'équipe de revue d'Apple.
5. Vérifier le type de compte développeur : Apple demande une organisation pour une app de santé.
6. Remplacer la clé Gemini (forfait payant) avant de rallumer l'assistant. Supprimer les jetons `sbp_` exposés.

**À faire avec ton accord :**

- Déployer les 7 migrations et les fonctions serveur.
- Produire une nouvelle build TestFlight.
- Faire relire puis publier les traductions d'articles.

**Pour rallumer l'assistant IA :**

1. Passer `aiAssistantOnline: true` dans `src/config/features.ts`.
2. Définir le secret serveur `ASSISTANT_ENABLED=true`.

Détail complet de la soumission : `PUBLICATION.md`.
