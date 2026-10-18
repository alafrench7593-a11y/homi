# Audit de « Toi & Moi » — étape 0

Date : 18 octobre 2026. Version auditée : commit `197d56b`.

**Méthode**
- Version web de démonstration parcourue automatiquement : 80 écrans, déconnecté puis connecté avec la famille exemple. Les messages console et les erreurs ont été relevés, et chaque bouton a été cliqué (14 au maximum par écran) pour vérifier qu'il a un effet.
- Relecture du code de l'inscription, de la session, de l'onboarding, de l'invitation et de la configuration.
- **Pas de simulateur iOS ni Android dans l'environnement de travail** (ni macOS, ni SDK Android). Tout ce qui est propre au téléphone est marqué « à vérifier sur téléphone ».

**Gravité** : 🔴 bloquant · 🟠 gênant · 🟡 cosmétique.
**Statut** : à corriger, avec l'étape prévue (1 à 4).

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
