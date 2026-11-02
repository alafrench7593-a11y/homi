# Mise en service du vrai serveur

Tout se fait **depuis votre ordinateur et vos tableaux de bord**. Ne collez jamais une clé secrète dans une conversation : elles vont dans votre fichier `.env` local (jamais commité) et dans les secrets de Supabase.

## 1. Comptes à créer
| Service | Pour quoi | Où trouver la valeur |
|---|---|---|
| Supabase (région UE) | Base de données, connexion, fichiers, fonctions | Project Settings › API |
| Google AI Studio | Assistant, résumés, lecture de documents (Gemini) | Get API key |
| RevenueCat + App Store Connect + Google Play | Abonnements | Project settings › API keys |
| Expo / EAS | Builds, notifications push | expo.dev › Access tokens |
| Resend | E-mails en français | API Keys + domaine vérifié |
| Sentry (facultatif) | Plantages, avec accord de la personne | Client Keys (DSN) |

## 2. Remplir `.env`
`cp .env.example .env`, puis compléter chaque ligne (les commentaires du fichier disent où trouver chaque valeur). Les variables `EXPO_PUBLIC_*` sont visibles dans l'application : **aucun secret** dedans.

## 3. Lancer le script
```bash
./scripts/deploy-supabase.sh <project-ref> --dry-run   # vérifie sans rien changer
./scripts/deploy-supabase.sh <project-ref>
```
Il applique les migrations, enregistre les secrets serveur sans les afficher, déploie les 13 fonctions et vérifie que `service-status` répond.

## 4. Réglages dans les tableaux de bord
1. **Supabase › Authentication › URL configuration** : ajouter `toietmoi://auth/callback`.
2. **Authentication › Hooks › Send Email** : fonction `auth-email`, secret `SEND_EMAIL_HOOK_SECRET`.
3. **Authentication › Providers** : Apple et Google (voir `.env.example`).
4. **Database › Webhooks** : `INSERT` sur `public.notifications` → fonction `send-push`, en-tête secret `PUSH_WEBHOOK_SECRET`.
5. **Database › Replication** : vérifier la publication `supabase_realtime`.
6. **Abonnement Premium** : suivre **[ABONNEMENT.md](../ABONNEMENT.md)** (pas à pas). En résumé :
   - **App Store Connect** : un groupe d'abonnements « Au fil de nous Premium » avec 3 produits — `aufildenous_premium_monthly` (1 mois, **10,99 €**, offre de lancement « Essai gratuit » de **3 jours**), `aufildenous_premium_6months` (6 mois, **54,99 €**), `aufildenous_premium_annual` (1 an, **99,99 €**) ; aucun essai sur 6 et 12 mois.
   - **Google Play Console** : mêmes formules (1 abonnement à 3 offres de base, ou 3 abonnements), offre « essai gratuit 3 jours » réservée aux nouveaux clients sur le mensuel.
   - **RevenueCat** : entitlement `AU_FIL_DE_NOUS_PREMIUM`, offering courante avec les packages Monthly, 6 Month et Annual ; webhook vers `https://<ref>.supabase.co/functions/v1/revenuecat-webhook` avec l'en-tête `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`. L'appli lit les prix et l'essai **depuis la boutique** et n'affiche l'essai que si la boutique confirme l'éligibilité.
   - Secrets serveur : `REVENUECAT_WEBHOOK_SECRET`, `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_ENTITLEMENT` ; fonctions `revenuecat-webhook` et `subscription-sync` déployées.
   - Test : compte Sandbox Apple / testeur de licence Google sur un build de développement ou TestFlight (jamais dans Expo Go).
7. **EAS** : `eas credentials` pour les clés APNs (iOS) et FCM (Android).

## 5. Vérifications à faire une fois en ligne
- [ ] Inscription, e-mail de confirmation reçu en français, connexion, déconnexion.
- [ ] Deux téléphones dans le même foyer : une saisie apparaît sur l'autre (synchronisation en temps réel).
- [ ] Partage du cycle avec le ou la partenaire : visible, puis révoqué → plus visible.
- [ ] Assistant : une question simple, puis une question d'urgence (réponse d'orientation immédiate).
- [ ] Abonnement en mode test (sandbox Apple / testeurs Google) : achat, restauration, résiliation, fin d'abonnement.
- [ ] Notification push (réponse dans la communauté).
- [ ] Export RGPD et suppression du compte.
- [ ] Supprimer les comptes de démonstration du seed.


## Album photo des enfants (migration 20261031000100)

Appliquer la migration `20261031000100_child_photos.sql` (crée l'espace privé `child-photos`, la table `child_photos` et ses règles), puis redéployer la fonction `delete-account` (efface aussi les photos lors de la suppression d'un compte).

## Gemini (assistant, scanner, photo de glaire)

La clé `GEMINI_API_KEY` doit venir d'un projet Google **avec facturation activée** (offre payante) : les conditions de l'API Gemini n'autorisent que l'offre payante pour des utilisatrices dans l'Espace économique européen, et seule l'offre payante garantit que les données ne servent pas à entraîner les modèles. Même en offre payante, Google conserve les requêtes jusqu'à 55 jours pour détecter les abus (mentionné dans l'appli).
