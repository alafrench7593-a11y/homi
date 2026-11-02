# Audit de « Au fil de nous » — étape 0

Date : 18 octobre 2026. Version auditée : commit `197d56b`.

**Méthode**
- Version web de démonstration parcourue automatiquement : 80 écrans, déconnecté puis connecté avec la famille exemple. Les messages console et les erreurs ont été relevés, et chaque bouton a été cliqué (14 au maximum par écran) pour vérifier qu'il a un effet.
- Relecture du code de l'inscription, de la session, de l'onboarding, de l'invitation et de la configuration.
- **Pas de simulateur iOS ni Android dans l'environnement de travail** (ni macOS, ni SDK Android). Tout ce qui est propre au téléphone est marqué « à vérifier sur téléphone ».

**Gravité** : 🔴 bloquant · 🟠 gênant · 🟡 cosmétique.
**Statut** : à corriger, avec l'étape prévue (1 à 4). Les points corrigés sont marqués ✅ dans la section « Suivi des corrections » en fin de document.

---

## 1. Plantages et écrans morts

| # | Gravité | Problème | Reproduire | Étape |
|---|---|---|---|---|
| A1 | 🔴 | **Pas d'ErrorBoundary global** : une seule erreur de rendu laisse toute l'app en écran blanc, sans retour possible. | Ouvrir `/track/feeding` (type de saisie inconnu) → erreur « Cannot read properties of undefined (reading 'label') » → écran blanc. Tous les écrans visités ensuite restent blancs. | 2 |
| A2 | 🔴 | `track/[kind]` plante sur un paramètre inconnu au lieu d'afficher « Écran introuvable ». | Idem A1 (un lien ou une notification mal formés suffisent). | 2 |
| A3 | 🟠 | La page « introuvable » (`+not-found`) affiche « Bientôt disponible — Écran en cours de développement » : c'est un écran mort qui laisse croire à une fonction prévue. | Ouvrir n'importe quelle adresse inexistante. | 2 |

## 2. Inscription, connexion, session

| # | Gravité | Problème | Reproduire | Étape |
|---|---|---|---|---|
| B1 | 🔴 | **Le lien « mot de passe oublié » ne ramène pas à l'écran du nouveau mot de passe.** `toietmoi://auth/reset` ne figure pas dans `additional_redirect_urls` (`supabase/config.toml`). Supabase redirige donc vers `site_url`, et l'écran de réinitialisation ne reçoit jamais le code. | Demander un lien de réinitialisation, l'ouvrir. *(à confirmer avec un vrai projet Supabase)* | 1 |
| B2 | 🔴 | L'écran `auth/reset` affiche le formulaire même sans session de récupération. L'envoi échoue alors avec « Auth session missing » en anglais. L'événement `PASSWORD_RECOVERY` est ignoré. | Ouvrir `/auth/reset` directement, saisir un mot de passe. | 1 |
| B3 | 🟠 | Lien expiré mal géré : `auth/callback` ne lit pas `error_code=otp_expired`. Il affiche « Lien incomplet » au lieu de « Lien expiré » avec un bouton « Renvoyer un lien ». | Ouvrir `/auth/callback?error_code=otp_expired&error_description=…`. | 1 |
| B4 | 🟠 | L'écran « Vérifiez vos e-mails » n'a **pas de bouton « Renvoyer »** et pas de délai de 60 s. | S'inscrire avec Supabase configuré. | 1 |
| B5 | 🟠 | **Erreurs Supabase non traduites** : trop de tentatives (429 / `over_email_send_rate_limit` / « For security purposes… »), lien expiré, session absente, même mot de passe. Le message anglais brut s'affiche. | Demander 5 réinitialisations en 1 h (limite `email_sent = 4`). | 1 |
| B6 | 🟠 | Validation seulement à l'envoi, pas en direct. Règle actuelle : 10 caractères + majuscule, minuscule et chiffre (la demande est 8 minimum, règles affichées). Pas de bouton afficher/masquer. | Écran d'inscription. | 1 |
| B7 | 🟡 | La touche « Entrée » du clavier envoie le formulaire sans le verrou anti double-envoi. | Taper deux fois Entrée sur le champ mot de passe. | 1 |
| B8 | 🟠 | **Pas de connexion Apple ni Google.** | — | 1 |
| B9 | 🔴 | **Le foyer n'est pas créé à l'inscription**, seulement à la fin de l'onboarding. Le déclencheur `handle_new_user` crée le profil et les réglages, pas le foyer. Si le profil manque, l'onboarding tourne en boucle sans erreur (l'`update` ne touche aucune ligne). | Supprimer la ligne `profiles` d'un compte puis se connecter. | 1 |
| B10 | 🟠 | Fin d'onboarding non atomique : en cas d'erreur suivie d'un nouvel essai, la grossesse ou les enfants sont créés en double. | Couper le réseau au dernier écran, réessayer. | 1 |
| B11 | 🟠 | **Onboarding non sauvegardé entre les étapes** : fermer l'app fait repartir du début. | Fermer l'app à l'étape 3. | 1 |
| B12 | 🔴 | **Pas de case « J'ai 18 ans ou plus », pas de liens vers les CGU et la politique de confidentialité.** L'accord n'est enregistré qu'à la fin de l'onboarding, pas à l'inscription. | Écran d'inscription. | 1 |
| B13 | 🔴 | **Invitation du coparent perdue s'il n'a pas de compte** : le code n'est pas conservé pendant l'inscription, et l'écran d'acceptation n'exige pas d'être connecté. | Ouvrir le lien d'invitation déconnecté, puis s'inscrire. | 1 |
| B14 | 🟡 | Mode démo : il faut créer un compte local pour y accéder, et le bandeau « Démonstration » n'est pas visible en permanence. | Ouvrir l'app sans clés Supabase. | 1 |
| B15 | ✅ | Session : stockage sécurisé (SecureStore), rafraîchissement automatique et déconnexion déjà en place. | — | — |

## 3. Fiabilité générale

| # | Gravité | Problème | Reproduire | Étape |
|---|---|---|---|---|
| C1 | 🟠 | **Pas de suivi des plantages** (Sentry), alors que l'onboarding demande l'accord pour les « rapports d'erreurs ». | — | 2 |
| C2 | 🟠 | File hors ligne partielle : seules les saisies du suivi passent par la file (biberon, tétée, couche, sommeil, repas, observations). Ni les minuteurs, ni les règles, ni les rendez-vous. L'écran « Synchronisation » annoncé dans le code n'existe pas. | Couper le réseau, noter des règles. | 2 |
| C3 | 🟡 | Autorisation des notifications demandée sans explication préalable depuis les rappels, le biberon et les rendez-vous. Seul l'onboarding explique avant. | Activer un rappel de biberon. | 2 |
| C4 | 🟠 | **Aucune liste virtualisée** : tout est rendu d'un bloc, ce qui deviendra lent avec un long historique. | Historique avec des centaines d'entrées. | 2 |
| C5 | 🟠 | Accessibilité web : pastilles, interrupteurs et onglets n'exposent pas `aria-checked` / `aria-selected`, donc un lecteur d'écran ne sait pas s'ils sont activés. Sur téléphone, l'état est transmis (à vérifier avec VoiceOver et TalkBack). Pastilles et segments font 40 px de haut, moins que les 44 px demandés. | `/fertility/body`, toucher « Crémeuse ». | 2 |
| C6 | 🟡 | Le fond vidéo n'est pas mis en pause en arrière-plan ni désactivé en mode économie d'énergie. Hors connexion, il produit une erreur console (le fichier ne se charge pas ; l'aurore prend le relais). | Couper le réseau puis ouvrir l'app. | 2 |
| C7 | 🟡 | Export des données en JSON seulement, pas de PDF. | Profil › Confidentialité. | 2 |
| C8 | 🟠 | Pas d'écran « État des services » (mode développeur). | — | 2 |
| C9 | 🟡 | Avertissements console du web, sans effet sur l'usage : « useNativeDriver is not supported », « push token listener not supported on web ». | Console du navigateur. | 2 |
| C10 | ✅ | Pas de texte anglais trouvé dans l'interface, sauf les erreurs Supabase non traduites (B5). | — | — |
| C11 | ✅ | Suppression du compte dans l'app déjà en place, avec confirmation par saisie de « SUPPRIMER ». | — | — |

## 4. Configuration

| # | Gravité | Problème | Étape |
|---|---|---|---|
| D1 | 🔴 | `.env.example` incomplet : il manque `SEND_EMAIL_HOOK_SECRET` (e-mails d'authentification) et `PUSH_WEBHOOK_SECRET` (notifications push : la fonction plante sans lui). | 4 (corrigé dès l'étape 1 pour le premier) |
| D2 | 🟠 | Variables manquantes : `REVENUECAT_SECRET_API_KEY`. Les scripts d'import lisent `SUPABASE_URL` alors que `.env.example` ne propose que `EXPO_PUBLIC_SUPABASE_URL`. | 4 |
| D3 | 🟠 | Pas de Privacy Manifest iOS. Le message de permission des notifications n'est pas personnalisé. | 4 |
| D4 | 🟠 | Android `SCHEDULE_EXACT_ALARM` demande une justification sur le Play Store, ou le passage à `USE_EXACT_ALARM`. | 4 |
| D5 | ✅ | Schéma de lien profond `toietmoi` déclaré. Profils EAS development, preview et production présents. Mode démo automatique sans clés. | — |

## 5. Bibou : ce qui existe déjà

| Demandé | Existant | Décision proposée |
|---|---|---|
| `feedings` | `bottles` et `breastfeeds` (+ `pumpings`) | garder ces tables et ajouter une vue `feedings` qui les réunit |
| `bottle_timers` | ✅ existe | compléter (répétition, « qui a donné ») |
| `milk_products` | ❌ | créer |
| `child_milk_watch` | ❌ | créer (surveillance des rappels) |
| `scan_history` | `product_scans`, `scan_results`, `scan_favorites`, `scan_recall_alerts` | garder ces tables et ajouter une vue `scan_history` |
| Domaine « Repas bébé » | ❌ (les repas relèvent de `daily`) | ajouter le domaine `feeding` aux permissions du foyer |

Dettes notées lors des étapes précédentes :
- `bottle_timers` absent de l'export RGPD ;
- pas de notification au coparent quand un minuteur est lancé ;
- le bouton « Copier » nécessite `expo-clipboard`.

---

## Suivi des corrections

### Étape 1 — inscription et connexion (terminée le 18/10/2026)

| # | Statut | Correction | Preuve |
|---|---|---|---|
| B1 | ✅ | `toietmoi://auth/reset`, `toietmoi://auth/callback`, `toietmoi://**` et les adresses web ajoutés à `additional_redirect_urls`. L'adresse de retour est calculée selon la plateforme : schéma de l'app sur téléphone, URL du site sur le web. **À recopier dans le tableau de bord Supabase de production (SETUP.md).** | parcours D (`e2e/etape1_auth.py`) |
| B2 | ✅ | `auth/reset` vérifie le lien (code ou session) avant d'afficher le formulaire, sinon « Ce lien n'est plus valable » + nouveau lien. Confirmation du mot de passe ajoutée. | parcours D |
| B3 | ✅ | `parseAuthCallback` lit la requête et le fragment `#` : écran « Lien expiré » avec renvoi d'un nouveau lien. | `authFlow.test.ts`, parcours B |
| B4 | ✅ | Bouton « Renvoyer l'e-mail » avec compte à rebours de 60 s (inscription, lien expiré, mot de passe oublié). | `authFlow.test.ts`, parcours A |
| B5 | ✅ | `friendlyAuthError` couvre 14 cas, avec un message générique en français par défaut. Les erreurs de base de données ne renvoient plus le texte brut. | 14 cas dans `authFlow.test.ts`, parcours C |
| B6 | ✅ | 8 caractères, une lettre et un chiffre, règles cochées en direct, bouton afficher/masquer, validation de l'e-mail au départ du champ. | parcours A |
| B7 | ✅ | Verrou contre le double envoi (bouton et touche Entrée) sur l'inscription, la connexion et le nouveau mot de passe. | parcours A : une seule inscription malgré 3 envois |
| B8 | ✅ | Apple : natif sur iPhone (bouton officiel, jeton + nonce), par navigateur ailleurs. Google : navigateur sécurisé (OAuth + PKCE). **Fournisseurs à activer dans Supabase, essai réel sur téléphone à faire.** | code (`socialAuth.ts`) |
| B9 | ✅ | Le déclencheur crée profil, réglages et foyer dans la même transaction. `ensure_my_account()` les rattrape à chaque connexion. | `37_account_bootstrap.sql` (52 contrôles) |
| B10 | ✅ | La fin d'onboarding ne recrée ni la grossesse ni les enfants déjà enregistrés, et un verrou empêche le double envoi. | code + parcours A (un seul foyer, un seul enfant) |
| B11 | ✅ | Brouillon sauvegardé à chaque modification, sur l'appareil et dans `profiles.onboarding_state`, repris à la réouverture puis effacé à la fin. | parcours A (rechargement à l'étape « enfants ») |
| B12 | ✅ | Cases « J'ai 18 ans ou plus » et CGU / confidentialité (avec liens), horodatées par le déclencheur à l'inscription. Pour Apple et Google, l'accord est demandé à l'onboarding (`record_signup_consents`). | `38_signup_consents_metadata.sql`, parcours A |
| B13 | ✅ | Lien ouvert sans compte : écran d'invitation, code gardé pendant l'inscription, puis proposé à la première connexion. Le foyer automatique vide de la personne invitée est supprimé quand elle rejoint le foyer. | parcours E, `37_account_bootstrap.sql` |
| B14 | ✅ | « Découvrir sans compte » sur l'écran d'accueil. La démonstration tourne sur l'appareil (aucune requête vers la vraie base), avec un bandeau « Démonstration » permanent et un lien « Quitter ». | parcours F |
| D1 | ✅ (partiel) | `SEND_EMAIL_HOOK_SECRET`, `PUSH_WEBHOOK_SECRET` et les variables Apple / Google ajoutés à `.env.example`. Le reste est prévu à l'étape 4. | — |
| — | ✅ | Bug trouvé en route : l'appel de rattrapage partait depuis l'écouteur de session de Supabase, ce qui peut bloquer la session. Il est maintenant différé. | parcours D |

### Étape 2 — fiabilité générale (terminée le 18/10/2026)

| # | Statut | Correction | Preuve |
|---|---|---|---|
| A1 | ✅ | Écran d'erreur global (`ErrorBoundary` d'expo-router) : « Réessayer » ou « Revenir à l'accueil », plus jamais d'écran blanc. | parcours des écrans |
| A2 | ✅ | `track/[kind]` : un type inconnu affiche « Ce type de saisie n'existe pas » avec un lien vers Suivi. | parcours des écrans (`/track/feeding`) |
| A3 | ✅ | Page introuvable claire (« Cette page n'existe pas »), au lieu de « Bientôt disponible ». | parcours des écrans |
| — | ✅ | **Quatre états sur tous les écrans** : squelettes au chargement, état vide avec une action utile, erreur avec « Réessayer », écrans « introuvable » pour les identifiants inconnus. Environ 80 écritures qui échouaient en silence affichent maintenant une erreur en français, avec des boutons bloqués pendant l'envoi. | composants `States.tsx`, rapports des deux passes |
| C1 | ✅ | Sentry branché, actif seulement avec un DSN **et** l'accord de la personne. Pas d'identifiant, pas d'e-mail, pas de contenu d'écran. Messages et chemins nettoyés. | `crashReporting.test.ts` |
| C2 | ✅ | File hors ligne étendue à toutes les saisies : suivi bébé, règles, symptômes, tests, glaire et température, humeur, poids, mesures, étapes, santé, aliments, rapports. Pastille « Hors ligne » visible partout, écran « Synchronisation » (en attente / à vérifier, réessayer, retirer). | `offlineQueue.test.ts` (5 cas) |
| C3 | ✅ | Explication dans l'app avant chaque demande système de notifications (biberon, rendez-vous, rappels), et lien vers les réglages si les notifications sont refusées. | code |
| C4 | ✅ | Listes longues virtualisées (`VirtualList` / `FlatList`) : historiques, fil et commentaires de la communauté, conversations, documents, notifications, bibliothèque, prénoms, scans, biberons, modération. | rapports des deux passes |
| C5 | ✅ | Pastilles, interrupteurs et onglets annoncent leur état (`aria-checked`) ; cibles tactiles d'au moins 44 px. Contrastes vérifiés pour les 3 thèmes. **Palette de marque verrouillée à ta demande** : les 3 couleurs que j'avais assombries ont été remises à l'identique. Les écarts restants, tous dans le thème clair, sont mesurés et listés dans le test : liens roses 3,2:1, erreurs 4,3:1, texte blanc des boutons 3,4:1. Ils sont compensés par la graisse, la taille et une ombre de texte. | `contrast.test.ts` (40 contrôles) |
| C6 | ✅ | Fond vidéo en pause quand l'app passe en arrière-plan, et désactivé en mode économie d'énergie ou « réduire les animations » : l'aurore prend le relais. | code |
| C7 | ✅ | « Mon compte » : changement du mot de passe, export JSON **et PDF lisible**, suppression du compte avec saisie de « SUPPRIMER ». Données et photos effacées sur le serveur, plus effacement local (cache, file, brouillons, rappels, clé des photos). | code |
| C8 | ✅ | Écran « État des services » en mode développeur (7 appuis sur la version), avec la fonction `service-status` qui ne renvoie que des booléens. | `service_status_test.ts` |
| C9 | ✅ | Avertissement console « useNativeDriver » supprimé sur le web. | parcours des écrans |
| D1 | ✅ | `EXPO_PUBLIC_SENTRY_DSN` ajouté à `.env.example`. | — |

**À vérifier sur téléphone** (impossible ici) :
- réception d'un rappel app fermée sur iOS et Android ;
- VoiceOver et TalkBack ;
- taille de texte dynamique au maximum ;
- mode économie d'énergie ;
- temps de démarrage sur un appareil d'entrée de gamme.

### QA E-06 — version web : chargement à la demande (02/11/2026)

**Ce qui a changé.** Les contenus lourds ne sont plus dans le fichier JavaScript de démarrage de la version web. Ils sont chargés par `import()` à leur première utilisation (`src/lib/lazyContent.web.ts`) :
- catalogues et articles FR et EN de la démonstration (`src/lib/backend/demoCatalog.ts`) : à l'ouverture de la démonstration ;
- copie embarquée des recettes : à l'ouverture de la démonstration, ou si la base n'a pas encore les recettes ;
- `pdf-lib` : à la première création de PDF.

Sur iOS et Android, `src/lib/lazyContent.ts` fait un simple `require`. Vérifié par un export iOS et Android : un seul bundle (22,4 Mo), avec les articles FR et EN, les recettes, les prénoms et pdf-lib. Tout reste embarqué et disponible hors ligne.

Les routes asynchrones d'Expo Router (`asyncRoutes`) ont été essayées puis **laissées désactivées** : avec le processeur ralenti (×6), des écrans ouverts directement par leur adresse (`/names`, `/meals`) restaient vides. Avec les routes asynchrones seules, sans le chargement à la demande, l'entrée dans la démo ne se terminait même pas. Cet essai a été fait alors que le disque de la machine était plein : il faut le refaire avant de les réactiver.

**Mesures** (export démo, `web_firstload.py`, cache vide, médiane de 3 essais, CPU ×4) :

| | Avant | Après |
|---|---|---|
| JS de démarrage (octets) | 20 396 210 | 8 936 974 |
| JS de démarrage, gzip -9 | 5 723 326 | 2 445 281 |
| 4G 9 Mbit/s, brut : bouton d'accueil visible | 23,9 s | 12,4 s |
| 4G, gzip : bouton d'accueil visible | 10,3 s | 6,0 s |
| Slow 4G 1,6 Mbit/s, brut : bouton visible | 109,8 s | 51,5 s |
| Slow 4G, gzip : bouton visible | 34,7 s | 17,3 s |
| 4G, gzip : clic « Découvrir sans compte » → accueil | 3,3 s | 6,8 s |
| Slow 4G, gzip : clic → accueil | 2,1 s | 23,0 s |

**Limite.** Avec la démonstration, les 11,2 Mo de contenus (3,2 Mo en gzip) sont toujours téléchargés : ils le sont après le premier écran au lieu d'avant. Le temps total jusqu'à l'accueil de la démo change donc peu. Mesures :
- 4G gzip : 13,6 s avant, 12,8 s après ;
- slow 4G gzip : 36,9 s avant, 40,3 s après.

Avec le vrai backend Supabase, hors démonstration, le catalogue de démo n'est pas téléchargé. Je l'ai déduit du code, sans le mesurer : il n'y a pas de serveur Supabase ici. La copie des recettes (0,6 Mo) est en revanche chargée en anglais, ou si la base n'a pas encore les recettes.

**Hébergement.** Il doit servir les fichiers en brotli ou gzip, avec un cache long sur `_expo/static/` (voir README, « Version web »). Pour un essai local : `python3 e2e/spa_server.py dist 8822 --gzip`.
