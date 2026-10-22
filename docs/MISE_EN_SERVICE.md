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
6. **RevenueCat** : entitlement `premium`, produits `toietmoi_premium_monthly` et `toietmoi_premium_annual`, webhook vers `https://<ref>.supabase.co/functions/v1/revenuecat-webhook` avec l'en-tête `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
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
