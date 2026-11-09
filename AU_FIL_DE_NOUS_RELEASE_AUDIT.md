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

Un seul mécanisme partagé (`Screen`, `Sheet`, `Field` et `src/components/keyboard.tsx`), sans nouvelle dépendance.

| Prio | Problème corrigé |
|---|---|
| P0 | Android : le clavier recouvrait le bas de tous les écrans. Avec l'affichage plein écran imposé par Expo 57, la fenêtre ne se redimensionne plus ; correction : `behavior="padding"` sur iOS et Android. |
| P0 | Les ≈ 45 feuilles (`Sheet`) étaient recouvertes par le clavier. Elles remontent maintenant et leur contenu défile. |
| P1 | iOS : un champ en bas d'un long formulaire restait caché. L'écran défile désormais vers le champ actif. |
| P1 | La touche « Suivant » fermait le clavier au lieu de passer au champ suivant (connexion, inscription, etc.). Elle passe maintenant au champ suivant ; le dernier champ affiche « OK ». |
| P1 | Le clavier restait ouvert après un envoi, ou sur l'écran suivant. Il se ferme à l'envoi et en quittant l'écran ou la feuille. |
| P1 | Le premier toucher était ignoré sur les pastilles quand le clavier était ouvert. Corrigé par `keyboardShouldPersistTaps` sur 27 listes. |
| P2 | Plusieurs points corrigés : la touche « Envoyer » de l'onglet Questions, le texte des champs multilignes sur Android, l'espace vide au-dessus du clavier et le décalage dans les modales iOS. |

- VÉRIFIÉ : `keyboard.test.tsx` réussit 21 tests sur 21, en configuration iOS comme Android. L'ensemble de la suite
  jest réussit 1426 tests sur 1426.
- VÉRIFIÉ dans le navigateur, sur 22 écrans de saisie et 3 formats (375×667, 320×568, Android émulé) : focus, accents,
  enchaînement des champs, envoi, feuille « Nouveau rendez-vous » entièrement visible. Aucun défaut trouvé.
- Inventaire : 119 fichiers et environ 400 champs. Ceux qui n'ont pas été ouverts un par un bénéficient des corrections
  des composants partagés, mais n'ont été relus que dans le code.
- **NON VÉRIFIÉ** (appareil ou simulateur nécessaire) :
  - la remontée réelle des écrans et des feuilles au-dessus du clavier natif, en particulier les feuilles sur Android ;
  - les modales iOS ;
  - les claviers en 5 langues ;
  - la grande taille de texte et la rotation.
- Restes : P1, un essai sur Android 15/16 et sur iPhone ; P2, le défilement automatique dans les listes
  virtualisées ; P3, le libellé « OK » au lieu de « Suivant » sur un champ qui apparaît en cours de saisie ;
  P3, pas de fermeture du clavier en faisant glisser la page.
- Bibliothèque `react-native-keyboard-controller` : non installée. Elle ne serait utile que si les essais sur
  appareil montrent des saccades sur Android, et elle demanderait une nouvelle build native.

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

**Fait le 10/11/2026 :**

- **Textes juridiques complétés** dans les 5 langues : CGU, confidentialité (responsable du traitement, transferts hors
  Union européenne, assistant suspendu), mentions légales, suppression de compte sans l'app, aide. Le bandeau
  « Brouillon » est retiré, à ta demande. Éditeur : David PRINCIVIL (particulier), contact aufildenous@outlook.fr, sans
  adresse postale. Version des documents : 2026-11. **Ces textes n'ont pas été relus par un juriste.**
- **Pages publiques** prêtes (`legal-site/`, 25 pages : 5 documents × 5 langues), générées depuis les textes de l'app.
  Un test vérifie qu'elles restent identiques. Leur mise en ligne se fait avec `mettre-a-jour-v7.command`
  (EAS Hosting) : **NON VÉRIFIÉ** tant que ce script n'a pas tourné.
- **Révocation « Se connecter avec Apple »** codée : l'app transmet un code Apple à la suppression du compte, et le
  serveur l'échange puis le révoque. Testé avec une clé de test et un serveur Apple simulé. **NON VÉRIFIÉ** avec la
  vraie clé Apple.
- **Premium strict** : installé mais en attente (migration `20261110000100`) tant que l'achat n'est pas possible.
  L'offre Premium reste visible.

**Reste à faire par toi :**

1. Créer la clé « Sign in with Apple », puis lancer `configurer-apple.command`. Le fichier
   `AuthKey_8G4N6JNZGG.p8` de tes Téléchargements n'a pas été ouvert : vérifie dans le portail Apple de quel type de
   clé il s'agit.
2. Créer les produits d'abonnement dans les boutiques et les relier à RevenueCat.
3. Créer le compte de démonstration pour Apple et vérifier le type de compte développeur. En tant que particulier,
   Apple peut refuser une app de santé (règle 5.1.1 ix).
4. Indiquer la région d'hébergement Supabase : Dashboard › Settings › General, puis la reporter dans la politique de
   confidentialité, section « Hébergement ».
5. Faire relire les textes par un juriste (recommandé). Pour vendre des abonnements, un statut d'entrepreneur
   (micro-entreprise, par exemple) et une adresse dans les mentions légales sont en principe exigés.
6. Remplacer la clé Gemini, puis supprimer les jetons `sbp_` exposés.

**À faire avec ton accord :**

- Déployer les 7 migrations et les fonctions serveur.
- Produire une nouvelle build TestFlight.
- Faire relire puis publier les traductions d'articles.

**Pour rallumer l'assistant IA :**

1. Passer `aiAssistantOnline: true` dans `src/config/features.ts`.
2. Définir le secret serveur `ASSISTANT_ENABLED=true`.

Détail complet de la soumission : `PUBLICATION.md`.
