# Site web HOMI — `/`, `/demo`, `/app` (23/11/2026, branche `homi/site-web`)

## Architecture
- `/` : page publique **statique** (`web/site/`) — keynote en 5 chapitres, aucune donnée familiale, indexable en production.
  La recherche « Trouve le bon outil avec tes mots » utilise **le même catalogue et le même moteur** que l'app
  (`toolCatalog` + `toolSearch`), compilés pour le navigateur (`scripts/web/bundle-search.mjs`, 112 Ko / 35 Ko gzip).
- `/demo` : coquille de l'app ; famille fictive en local (aucune écriture serveur). `?outil=<id>` ouvre l'outil.
  Démo web : outils ouverts, **aucun tarif ni essai** (`FEATURES.webDemoOpen`, `webWithoutPurchase`).
  Compte réel connecté : écran de choix (jamais de bascule silencieuse).
- `/app` : lancement de l'app ; la garde de session note l'adresse demandée (`src/lib/returnTo.ts`, 30 min, onglet
  courant) et y revient après connexion. L'accueil de l'app affiche l'adresse `/app` (actualisation sûre).
- Pages légales statiques copiées depuis `legal-site/`. `robots.txt`, `sitemap.xml`, `og.png` générés.

## Build
```bash
EXPO_PUBLIC_SUPABASE_URL=… EXPO_PUBLIC_SUPABASE_ANON_KEY=… npx expo export --platform web --output-dir dist
node scripts/web/build-site.mjs dist     # SITE_URL facultatif ; VERCEL_ENV=production → indexation permise
python3 e2e/site_server.py dist 8080     # imite vercel.json (cleanUrls + coquille app.html)
node e2e/site_parcours.mjs http://localhost:8080 <sortie>        # parcours final, 390 pt, captures + vidéo
python3 e2e/site_app_retour.py                                    # /app : retour après connexion, changement de compte
```
Hors production (Preview), toutes les pages sont `noindex` et `robots.txt` interdit tout.

## Déploiement Vercel Preview — bloqué
- Jeton enregistré pour `api.vercel.com` : **refusé par Vercel (`invalidToken`)** deux fois.
- Le connecteur Vercel voit l'équipe `link` (aucun projet) mais ne peut pas créer de projet.
- Il faut l'un des deux : un **jeton Vercel valide** (Account Settings › Tokens, portée équipe `link`), ou un **projet
  `homi-web` créé dans le tableau de bord** (dépôt `homi`, branche `homi/site-web`, réglages lus dans `vercel.json`)
  avec `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` en Preview.
- Après le premier déploiement : ajouter l'URL de retour Auth Supabase (accord de la propriétaire requis).
