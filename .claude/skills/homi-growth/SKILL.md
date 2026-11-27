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
