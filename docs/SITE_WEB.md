# Site web HOMI — `/` et la web app `/app` (23/11/2026, branche `homi/site-web`)

**Décision de la propriétaire (23/11, après-midi) : le site mène à la vraie web app, plus à la démo.** Boutons « Ouvrir HOMI » (/app) et « Créer mon compte » ; cartes d'outils → `/outil/<id>` (connexion si besoin, puis l'outil pour l'enfant affiché). `/demo` reste en place mais n'est plus reliée (noindex, hors sitemap).

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

## Refonte premium — étape 1 (24/11/2026)
- Accueil : titre « Toute votre vie de famille. Enfin réunie. », récit en 7 écrans réels (tableau de bord, sommeil, biberons,
  grossesse/contractions, Aura, relais, organisation), JSON-LD SoftwareApplication + Organization (OS : Web — pas d'iOS tant que l'app n'est pas publiée).
- `/fonctionnalites/` : les 121 outils réels (catalogue de l'app, 6 étapes de vie) écrits dans le HTML, recherche avec le moteur de
  l'app (sans IA), filtres par étape, galerie de 17 captures réelles, BreadcrumbList + ItemList. Ajoutée au sitemap.
- Captures : `e2e/captures_site.py` (version web de l'app, mode démo, famille fictive, iPhone 390×844 @3x → WebP 780 px, bandeau
  « Démo » recadré, rejet automatique des écrans d'erreur/vides). Écartées : dents, vaccins, médicaments, courses (démo sans données),
  Aura (écran d'abonnement), grossesse/cycle/post-partum/co-parent (hors profil de la démo).
- Tests : `e2e/site_fonctionnalites.py` 22/22 (mobile 390 et desktop 1440).

## Étape 2 (24/11/2026) — domaine, menu, contact, GEO
- Domaine officiel : **homifamille.com** (canonique, sitemap, robots, llms.txt en production ; liens ambassadeurs de l'app mobile).
  `SITE_URL` reste prioritaire. À faire côté Vercel : ajouter homifamille.com (+ www) au projet et suivre les DNS indiqués.
- Menu commun (`web/site/partials/menu.html`) : 6 groupes en `<details>` natifs (clavier, Échap, un seul ouvert), menu mobile
  dépliable ; seulement des liens réels (catalogue filtré par `#etape=` et `#q=`). Pied de page commun (`partials/footer.html`).
- `/contact/` : 12 sujets, messagerie pré-remplie vers homixyz@gmail.com ; envoi direct seulement si `CONTACT_ENDPOINT` est
  défini au build. Fonction `supabase/functions/contact` (Resend, validation, pot de miel, limite 5/10 min, pas d'injection
  d'en-tête) **non déployée** : il faut RESEND_API_KEY + RESEND_FROM_EMAIL sur un domaine vérifié (ex. contact@homifamille.com).
- GEO/SEO : `llms.txt` (description factuelle + 121 outils), JSON-LD Organization + ContactPoint + WebSite + SoftwareApplication,
  ContactPage + BreadcrumbList, robots (privé exclu : /app, /auth, /admin, /ambassadors/dashboard, /r/, /demo).
- Tests : `e2e/site_menu_contact.py` 19/19, `site_fonctionnalites.py` 22/22, `ambassadors.py` 28/28 ; 0 débordement sur
  12 largeurs × 5 pages ; Jest `contactForm` 5/5.
