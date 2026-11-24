# Tutoriels de configuration — HOMI

Pas à pas, avec les liens directs vers tes comptes. Chaque tuto dit ce que tu fais, ce que je fais ensuite, et
comment vérifier. Identifiants utiles : projet Supabase `ploatloxxigplpdsqyri` (homi), app iOS `app.homi.family`,
compte Expo `alafre`, projet Expo `homi`, équipe Vercel `link` (`link-a664`), dépôt GitHub `alafrench7593-a11y/homi`.

---

## 1. Connexion avec Apple (iPhone)

Doc officielle : https://supabase.com/docs/guides/auth/social-login/auth-apple

Pour l'iPhone (connexion native), aucun secret n'est nécessaire : seul l'identifiant de l'app compte.

1. Vérifier la capacité « Sign in with Apple » de l'app chez Apple :
   - ouvrir https://developer.apple.com/account/resources/identifiers/list
   - cliquer sur l'identifiant `app.homi.family`
   - dans « Capabilities », la case **Sign In with Apple** doit être cochée (sinon : la cocher, « Save »).
2. Activer Apple dans Supabase (production) :
   - ouvrir https://supabase.com/dashboard/project/ploatloxxigplpdsqyri/auth/providers
   - cliquer sur **Apple**, activer **Enable Sign in with Apple**
   - champ **Client IDs** : `app.homi.family`
   - laisser « Secret Key » vide (il ne sert qu'à la connexion par le web, voir § 1 bis)
   - **Save**.
   *(Je peux le faire à ta place : réponds « active Apple en prod ».)*
3. Afficher le bouton dans l'app : ajouter la variable de build Expo
   - ouvrir https://expo.dev/accounts/alafre/projects/homi/environment-variables
   - **Add variable** → Name `EXPO_PUBLIC_AUTH_APPLE`, Value `1`, Environments : **production** (et preview si tu
     l'utilises), Visibility **Plain text** → **Save**.
   - doc : https://docs.expo.dev/eas/environment-variables/
4. Nouveau build iPhone (le bouton n'apparaît que dans un build construit après l'étape 3) :
   `npx eas-cli@latest build -p ios --profile production` puis l'envoyer sur TestFlight (voir § 5).

**Vérifier** : dans le build TestFlight, écran de connexion → « Continuer avec Apple » → Face ID → tu arrives sur
l'accueil. Dans https://supabase.com/dashboard/project/ploatloxxigplpdsqyri/auth/users, le compte apparaît avec le
fournisseur « apple ».

### 1 bis. Apple sur le web (plus tard, quand le site sera en ligne)

1. https://developer.apple.com/account/resources/identifiers/list → **+** → **Services IDs** → identifiant
   `app.homi.family.web` → cocher **Sign In with Apple** → **Configure** : domaine `ploatloxxigplpdsqyri.supabase.co`,
   Return URL `https://ploatloxxigplpdsqyri.supabase.co/auth/v1/callback`.
2. https://developer.apple.com/account/resources/authkeys/list → **+** → cocher **Sign in with Apple** → télécharger
   la clé `.p8` (une seule fois possible) et noter le **Key ID** et ton **Team ID** (`L5HM8RN2QD`).
3. Générer le secret : Supabase refuse le `.p8` brut (« Secret key should be a JWT »). Sur ton ordinateur, dans le
   dossier du `.p8`, enregistrer ce script sous `apple-secret.mjs` (Node seul, rien à installer) :

   ```js
   import { createPrivateKey, sign } from 'node:crypto';
   import { readFileSync } from 'node:fs';
   const [, , p8, keyId, teamId, clientId] = process.argv;
   const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
   const now = Math.floor(Date.now() / 1000);
   const head = b64({ alg: 'ES256', kid: keyId });
   const body = b64({ iss: teamId, iat: now, exp: now + 180 * 24 * 3600, aud: 'https://appleid.apple.com', sub: clientId });
   const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key: createPrivateKey(readFileSync(p8)), dsaEncoding: 'ieee-p1363' }).toString('base64url');
   console.log(`${head}.${body}.${sig}`);
   ```

   puis : `node apple-secret.mjs AuthKey_XXXXXXXXXX.p8 <Key ID> L5HM8RN2QD app.homi.family.web`
   Coller la ligne affichée (commence par `eyJ`) dans « Secret Key (for OAuth) » du fournisseur Apple de Supabase et
   ajouter `app.homi.family.web` aux Client IDs (séparés par une virgule). **Expire au bout de 6 mois** (limite Apple) :
   le régénérer avant, sinon la connexion Apple sur le web s'arrête.
   Pour l'iPhone seul : laisser ce champ VIDE (le message « Secret key should be a JWT » vient d'un champ rempli).

---

## 2. Connexion avec Google (Gmail)

Doc officielle : https://supabase.com/docs/guides/auth/social-login/auth-google

1. Écran de consentement :
   - ouvrir https://console.cloud.google.com/auth/overview (créer un projet « HOMI » si demandé)
   - **Get started** : nom de l'app `HOMI`, e-mail d'assistance, audience **External**, e-mail de contact → créer
   - onglet **Branding** : logo, lien de confidentialité `…/confidentialite/`, CGU `…/cgu/` (une fois le site en ligne)
   - onglet **Data access** : garder seulement `openid`, `email`, `profile`.
2. Identifiant OAuth **Web** (utilisé par Supabase) :
   - ouvrir https://console.cloud.google.com/apis/credentials → **Create credentials** → **OAuth client ID**
   - Type : **Web application**, nom « HOMI Supabase »
   - **Authorized redirect URIs** : `https://ploatloxxigplpdsqyri.supabase.co/auth/v1/callback`
   - **Create** → noter le **Client ID** et le **Client secret**.
3. Identifiant OAuth **iOS** (pour l'iPhone) :
   - même page → **Create credentials** → **OAuth client ID** → Type **iOS** → Bundle ID `app.homi.family` → **Create**
   - noter ce **Client ID** iOS.
4. Activer Google dans Supabase :
   - https://supabase.com/dashboard/project/ploatloxxigplpdsqyri/auth/providers → **Google** → activer
   - **Client IDs** : le Client ID Web, puis une virgule, puis le Client ID iOS
   - **Client Secret** : le secret du client Web → **Save**.
   *(Je peux le faire : envoie-moi les deux Client ID dans le chat ; pour le secret, je t'ouvre un formulaire
   sécurisé, ne le colle jamais dans le chat.)*
5. Variable Expo `EXPO_PUBLIC_AUTH_GOOGLE` = `1` (même méthode qu'au § 1.3), puis nouveau build.
6. Tant que l'écran de consentement est en mode « Testing », seuls les comptes Gmail ajoutés dans **Audience → Test
   users** peuvent se connecter : y ajouter `homiyxz@gmail.com`. Pour tout le monde : **Publish app**.

**Vérifier** : écran de connexion → « Continuer avec Google » → choisir le compte Gmail → retour dans l'app connecté.

---

## 3. Adresses autorisées après connexion (Supabase)

Ouvrir https://supabase.com/dashboard/project/ploatloxxigplpdsqyri/auth/url-configuration
- **Site URL** : `homi://` (déjà en place)
- **Redirect URLs** (déjà : `homi://**`, `exp://**`, `http://localhost:8081/**`) : ajouter, quand le site sera en
  ligne, `https://<ton-domaine-vercel>/app/**` et `https://<ton-domaine-vercel>/demo/**`.

---

## 4. Mettre le site en ligne (Vercel : site public, /demo, /app)

Deux options. La configuration (`vercel.json`, `scripts/build-web.sh`, `site/index.html`) est déjà dans le dépôt.

**Option A — me donner l'accès (je déploie et je teste les 3 liens)**
1. Ouvrir https://vercel.com/link-a664/~/settings/members
2. Trouver le compte relié à Claude (rôle actuel : lecture seule) → changer le rôle en **Member** (ou **Developer**).
   Doc des rôles : https://vercel.com/docs/rbac/access-roles
3. M'écrire « c'est fait ».

**Option B — déployer toi-même**
1. Ouvrir https://vercel.com/new → **Import Git Repository** → `alafrench7593-a11y/homi` (si absent : **Adjust GitHub
   App Permissions** et autoriser ce dépôt).
2. Project Name `homi-web`. Framework Preset **Other**. Les commandes viennent de `vercel.json` (ne rien changer).
3. **Environment Variables** :
   - `EXPO_PUBLIC_SUPABASE_URL` = `https://ploatloxxigplpdsqyri.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = la clé **anon** publique (https://supabase.com/dashboard/project/ploatloxxigplpdsqyri/settings/api-keys)
4. **Deploy**, puis dans **Settings → Git → Production Branch** mettre `homi/fondations` (ou déployer cette branche en
   « Preview »).
5. M'envoyer l'adresse : je teste `/`, `/demo` et `/app` et je t'envoie le compte rendu.

La démo `/demo` est construite sans aucune clé Supabase (données fictives seulement) ; le build échoue
volontairement si une adresse de backend réel s'y glisse.

---

## 5. Build iPhone et TestFlight

Doc : https://docs.expo.dev/build/setup/ et https://docs.expo.dev/submit/ios/
1. Sur ton ordinateur, dans le dossier du projet (branche `homi/fondations` à jour) :
   `npx eas-cli@latest build -p ios --profile production`
   (ou autoriser cette commande dans la session Claude Code pour que je la lance).
2. Suivre l'avancement : https://expo.dev/accounts/alafre/projects/homi/builds
3. Envoyer sur TestFlight : `npx eas-cli@latest submit -p ios --latest` (interne uniquement, pas de revue Apple pour
   les testeurs internes).
4. Sur l'iPhone : app **TestFlight** → HOMI → **Mettre à jour**.

Coût : compris dans le crédit de build de la formule Starter (≈ 2 $ par build iOS, 0 € de dépassement ce mois-ci).

---

## 6. Compte Premium de test

Compte existant : `homiyxz@gmail.com` (Premium offert via RevenueCat, 994 crédits Aura sur 1 000).
- Mot de passe oublié : écran de connexion → **Mot de passe oublié** → lien reçu sur la boîte Gmail.
- Offrir Premium à un autre compte dans RevenueCat : https://app.revenuecat.com → projet HOMI → **Customers** →
  chercher l'identifiant (`user_id` Supabase) → **Grant entitlement** → `HOMI_PREMIUM` → durée.
  Doc : https://www.revenuecat.com/docs/dashboard-and-metrics/customer-profile#granting-promotional-entitlements

---

## 7. Activer la conservation des données en production (migration `20261208000100_conservation.sql`)

Ce que ça fait : purge chaque nuit (3 h 17 UTC) l'historique personnel au-delà de la durée choisie par chaque
personne, les notifications de plus de 90 jours et la mesure d'audience de plus de 13 mois. Les suivis des enfants
ne sont pas touchés. Retour arrière en une ligne (en bas).

1. Ouvrir https://github.com/alafrench7593-a11y/homi/blob/homi/fondations/supabase/migrations/20261208000100_conservation.sql
   → bouton **Copy raw file** (icône deux carrés, en haut à droite du fichier).
2. Ouvrir l'éditeur SQL de production : https://supabase.com/dashboard/project/ploatloxxigplpdsqyri/sql/new
3. Coller → **Run**. Attendu : « Success. No rows returned ».
4. Enregistrer la migration comme appliquée (pour que les prochains déploiements ne la rejouent pas) : dans le même
   éditeur, nouvelle requête :
   `insert into supabase_migrations.schema_migrations (version, name) values ('20261208000100', 'conservation') on conflict do nothing;`
   → **Run**.
5. **Vérifier** : https://supabase.com/dashboard/project/ploatloxxigplpdsqyri/integrations/cron/jobs → une tâche
   `homi-conservation`, planification `17 3 * * *`. Ou en SQL : `select jobname, schedule from cron.job;`
6. Premier passage à blanc (facultatif, compte le nombre de lignes purgées) : `select public.purge_by_retention();`
   Attention : cette commande supprime réellement les lignes au-delà des durées.

*(Je peux le faire à ta place : réponds « applique la conservation en prod ».)*

Retour arrière : `select cron.unschedule('homi-conservation'); drop function public.purge_by_retention();`
Doc pg_cron : https://supabase.com/docs/guides/cron

## E-mails d'inscription via Resend (24/11/2026)

Sans cette configuration, Supabase utilise son service de test (2 e-mails par heure, objet en anglais) : les parents ne reçoivent pas leur confirmation.

1. resend.com → Sign up (gratuit). Domains → Add Domain → `homifamille.com`, région Europe (Ireland).
2. Copier les enregistrements DNS affichés (MX `send`, TXT `send` SPF, TXT `resend._domainkey` DKIM, TXT `_dmarc` recommandé) chez le gestionnaire DNS du domaine (Vercel → Domains → homifamille.com → DNS Records, ou le registraire). Resend → Verify DNS Records → « Verified ».
3. Resend → API Keys → Create API Key (nom `homi-supabase`, permission Sending access, domaine homifamille.com) → copier la clé `re_…` (affichée une seule fois).
4. Supabase (projet homi) → Edge Functions → Secrets : `RESEND_API_KEY` = la clé ; `RESEND_FROM_EMAIL` = `HOMI <bonjour@homifamille.com>`.
5. Supabase → Authentication → Hooks → Send Email hook → Enable → HTTPS → `https://ploatloxxigplpdsqyri.supabase.co/functions/v1/auth-email` → Generate secret → copier → Edge Functions → Secrets : `SEND_EMAIL_HOOK_SECRET` = ce secret (avec son préfixe `v1,whsec_`).
6. Ne jamais coller ces clés dans un chat. Prévenir Claude : il vérifie la présence des noms, puis un test d'inscription sur l'adresse de la propriétaire.

## Avant la soumission App Store (24/11/2026, suite à l'audit docs/APP_STORE_AUDIT_2026-11-24.md)

### A. Remettre le site en ligne (Vercel)
vercel.com → projet homi → Deployments → filtre Branch = homi/fondations → dernier déploiement « Ready » → ⋯ → Promote to Production. Vérifier https://homifamille.com/confidentialite/, /aide/, /cgu/, /suppression-compte/.

### B. Clé « Sign in with Apple » (révocation à la suppression du compte, exigée par Apple)
1. developer.apple.com → Account → Certificates, Identifiers & Profiles → Keys → « + ».
2. Nom « HOMI Sign in with Apple », cocher Sign in with Apple → Configure → Primary App ID : app.homi.family → Save → Continue → Register.
3. Download (fichier .p8, téléchargeable UNE seule fois). Noter le Key ID affiché, et le Team ID (en haut à droite ou Membership details).
4. Supabase → projet homi → Edge Functions → Secrets : APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (tout le contenu du .p8, lignes BEGIN/END comprises), APPLE_CLIENT_ID = app.homi.family.
5. Ne jamais coller ces valeurs dans un chat.

### C. Compte de démonstration pour l'examinateur Apple
1. Dans l'app, créer homiyxz+apple@gmail.com (et homiyxz+coparent@gmail.com pour le co-parent) ; les e-mails arrivent dans la boîte homiyxz (alias Gmail « + »). Mot de passe fort, noté hors du dépôt.
2. Remplir quelques données fictives (un enfant, biberons, siestes) et inviter le compte co-parent.
3. RevenueCat → projet HOMI → Customers → chercher le compte (identifiant de l'utilisateur) → Grant promotional entitlement → HOMI_PREMIUM → durée 3 mois.
4. App Store Connect → app → version → App Review Information : Sign-in required = oui, identifiants du compte, notes pour l'examinateur (texte proposé dans l'audit).

### D. Abonnements et packs de crédits avec la version
App Store Connect → app → Monetization → Subscriptions puis In-App Purchases : chaque produit doit être « Ready to Submit » (nom affiché, description, prix, capture du paywall pour l'examen). Puis page de la version → section « In-App Purchases and Subscriptions » → « + » → cocher tous les produits → les soumettre avec la version.

### E. Codes d'offre ambassadeurs (facultatif pour la 1re soumission)
Monetization → Subscriptions → abonnement mensuel → Offer Codes → Create Offer : nom « Ambassadeur −20 % », éligibilité nouveaux abonnés, paiement au fur et à mesure 11,99 € pendant 1 mois → Custom Codes : un code par ambassadeur, lettres et chiffres seulement (LEA20), limite d'utilisations et date de fin.

### F. Confidentialité dans App Store Connect
App Privacy → ajouter : Contact Info › Name ; User Content › Emails or Text Messages ; Usage Data › Product Interaction (Analytics, Linked) ; Diagnostics › Crash Data (App Functionality, Not linked). Aucun « Tracking ». Privacy Policy URL : https://homifamille.com/confidentialite/ (une fois A fait) ; User Privacy Choices URL : https://homifamille.com/suppression-compte/.
