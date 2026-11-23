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
3. Générer le secret (JWT) avec l'outil de la doc Supabase (section « Generate a client secret ») puis l'ajouter dans
   le fournisseur Apple de Supabase, et ajouter `app.homi.family.web` aux Client IDs.

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
   users** peuvent se connecter : y ajouter `homixyz@gmail.com`. Pour tout le monde : **Publish app**.

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

Compte existant : `homixyz@gmail.com` (Premium offert via RevenueCat, 994 crédits Aura sur 1 000).
- Mot de passe oublié : écran de connexion → **Mot de passe oublié** → lien reçu sur la boîte Gmail.
- Offrir Premium à un autre compte dans RevenueCat : https://app.revenuecat.com → projet HOMI → **Customers** →
  chercher l'identifiant (`user_id` Supabase) → **Grant entitlement** → `HOMI_PREMIUM` → durée.
  Doc : https://www.revenuecat.com/docs/dashboard-and-metrics/customer-profile#granting-promotional-entitlements
