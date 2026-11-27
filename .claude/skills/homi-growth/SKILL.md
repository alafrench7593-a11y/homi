---
name: homi-growth
description: Agence de croissance HOMI (SEO, GEO, outils gratuits, conversion) sur le site web/site. À utiliser pour toute page, article, outil gratuit ou analyse d'acquisition du site homifamille.com.
---
# HOMI Growth — mode opératoire permanent

## Avant d'écrire
1. Lire `docs/SUIVI.md` (fin), `docs/growth/HOMI-KNOWLEDGE.md` (régénérer si l'app a changé : `node scripts/web/gen-knowledge.mjs`).
2. Données réelles seulement : Search Console via Windsor.ai (`searchconsole`, compte `sc-domain:homifamille.com`). Aucun volume, position, avis, chiffre d'utilisateurs inventé. Pas de source → écrire « non mesuré ».

## Une page = ce cycle
BRIEF (requête, intention, outil HOMI lié, URL) → SERP si accès → plan → écriture dans `web/site` (générateurs `hubs.mjs`, `univers.mjs`, `outils.mjs`, `scripts/web/build-site.mjs`) → contrôle technique → relecture indépendante → publication.
- Contrôle technique : `VERCEL_ENV=production node scripts/web/build-site.mjs dist`, serveur `python3 -m http.server` dans dist, Playwright 320/390/1366 (0 débordement, 0 erreur JS, 1 seul H1), `e2e/site_menu_contact.py`, JSON-LD = contenu visible.
- Relecture indépendante : session séparée (ou sous-agent) qui lit la page rendue, pas le résumé ; format WHERE / OBSERVATION / WHY / FIX / PRESERVE / RECHECK ; 2 cycles de réparation max.
- Publication : push `homi/fondations` (= production Vercel), vérifier en ligne, IndexNow (clé `web/site/indexnow.txt`, hôte api.indexnow.org autorisé).

## Règles permanentes (issues d'erreurs passées)
- Aucun outil, fonction d'Aura, prix ou chiffre non présent dans le code ou la config (les générateurs échouent sur un id inconnu).
- Santé : sources officielles (HAS, ameli, Santé publique France, ANSES, OMS) ; jamais de dose, diagnostic, posologie ; contenu santé non relu = non publié.
- Pas de lien App Store tant que l'app n'est pas publiée ; tarifs = grille configurée dans `src/lib/premium/plans.ts`.
- Nom de l'éditeur seulement dans les pages légales. Site au vouvoiement (l'app tutoie).
- Pages web : fond blanc, pas de cartes répétées sans info propre, cibles ≥ 44 px, `min-width:0` sur les grilles, guillemets insécables, mouvement en CSS et désactivé si réduction demandée.
- Outils gratuits : calcul local, rien envoyé, stockage local seulement pour les coches.
- Économie : recherches ciblées, réutiliser les générateurs, une ligne dans `docs/SUIVI.md` par lot.

## Routine quotidienne automatique (tâche planifiée « HOMI SEO quotidien »)
Une session neuve chaque matin, pilotée par le sous-agent `ceo-orchestrator` qui délègue aux agents de `.claude/agents/` selon la tâche (pas les 24 chaque jour). Méthode des pages : skill `seo-agency`. Faire UN lot complet, pas plus :
1. `git fetch origin homi/fondations && git checkout -B homi/seo-auto origin/homi/fondations`. Lire la fin de `docs/SUIVI.md` et `docs/growth/JOURNAL.md` (créer s'il manque) pour ne pas refaire la veille.
2. Données : Search Console via Windsor.ai (`searchconsole`, 28 derniers jours : requêtes, pages, impressions, position). Sans donnée : le dire et choisir dans `docs/growth/BACKLOG.md`.
3. Choisir l'action au plus fort impact parmi : (a) page existante avec impressions mais CTR faible → titre/description/FAQ ; (b) requête sans page dédiée → nouvelle page univers/outil (générateurs existants) ; (c) défaut technique (lien mort, H1, JSON-LD, poids) ; (d) élément du backlog.
4. Construire, puis contrôle technique (build, Playwright 320/390/1366, e2e menu).
5. Relecture indépendante par un sous-agent (page rendue, format WHERE/OBSERVATION/WHY/FIX/PRESERVE/RECHECK). 2 cycles de réparation max.
6. Ne jamais publier seul (Partie 28 du prompt d'agence, 27/11) : pousser sur `homi/seo-auto`, écrire dans le rapport du jour « À valider : <URL locale/branche>, preuves, défauts restants ». La propriétaire valide ; seule une session qu'elle lance publie sur `homi/fondations`.
7. Journal : une ligne dans `docs/growth/JOURNAL.md` (date, action, URL, preuve, mesure avant) et une dans `docs/SUIVI.md`. Commit + push.
Interdits en automatique : prix, abonnements, commissions, données Supabase, publication sur les réseaux, envoi d'e-mails, nouvelle dépendance, suppression de page.

## Revue hebdomadaire (tâche « HOMI SEO revue hebdo », lundi)
Search Console 7 j vs 7 j précédents (clics, impressions, CTR, positions par page), pages à J+7/J+14/J+28 du journal, mise à jour de `docs/growth/BACKLOG.md` (10 actions classées), rapport court dans `docs/growth/RAPPORTS.md`. Ne rien publier ce jour-là sauf correctif P0.
