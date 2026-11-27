---
name: seo-agency
description: Transforme un mot-clé approuvé en page HOMI originale, vérifiée et indexable (chaîne Strategist → SERP → Writer → Technical SEO → Editor → Repair → Delivery). À utiliser pour toute nouvelle page SEO du site homifamille.com.
---
# seo-agency — méthode (prompt 7)
PURPOSE : un mot-clé approuvé → une page originale, vérifiée, publiable, indexable.
WORKFLOW (sous-agents de `.claude/agents/`) :
1. seo-strategist : données réelles → `docs/growth/projects/<slug>/BRIEF.md` (prompt 2) → validation.
2. serp-analyst : `SERP.md`, KEEP / MAKE OURS (prompt 3).
3. content-writer : `OUTLINE.md` puis code source (docs/growth/prompts/3b-outline-writing.md).
4. technical-seo : HTML brut, liens, schema, sitemap, canonical (prompt 4) ; + qa-engineer, apple-design-engineer, medical-compliance si santé.
5. independent-editor : page rendue, 3 défauts, modèle parent (prompt 5).
6. Repair : prompt 6, 2 cycles max.
7. Delivery : rapports + **demande d'autorisation à la propriétaire** ; après accord : push `homi/fondations`, vérification en ligne, IndexNow, ligne au JOURNAL avec contrôles J+14/J+28.
RULES : aucun chiffre sans source ; aucune validation ignorée ; aucune page non examinée approuvée ; corrections locales ; tout conservé dans `docs/growth/projects/<slug>/` ; aucune fonction inventée ; aucune donnée privée.
OUTPUT : page source, URL publiée si autorisée, rapport HTML brut, rapport éditeur, rapport conformité, rapport QA, journal Search Console, résultats J+14/J+28.
Chaque défaut récurrent → nouvelle règle dans `docs/growth/AGENCY-MANUAL.md`.
