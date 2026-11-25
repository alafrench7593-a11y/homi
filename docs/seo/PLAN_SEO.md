# HOMI — SEO / GEO : état et suite (25/11/2026)

## Fait (en code, poussé sur homi/fondations)
- Lot 1 : URL canoniques, liens internes, JSON-LD, llms.txt et sitemap sans « / » final (cohérent avec `trailingSlash: false`).
- Lot 2 : page `/aura` (ce qu'elle fait / ne fait pas, données, FAQ balisée `FAQPage`).
- Lot 3 : `/blog` + 215 articles **non médicaux** (droits et démarches, garde et école, matériel, vie pratique, activités et éveil, éducation) issus de la bibliothèque de l'app, sources officielles citées, JSON-LD `Article` + fil d'Ariane, maillage « À lire aussi », sitemap (227 URL).
  Décision de la propriétaire (25/11) : les catégories santé restent hors du site public jusqu'à relecture professionnelle.

## Reste à faire — dépend d'une décision ou d'un accès
| Sujet | Bloquant |
|---|---|
| Articles santé (≈ 890) | relecture par un professionnel (statut `to_review`) |
| Pages comparatives (Huckleberry, FamilyWall…) | données concurrentes vérifiées et datées ; risque juridique de comparaison inexacte |
| Search Console, Bing Webmaster, Vercel Analytics | comptes de la propriétaire (vérification DNS / balise) |
| Boutons App Store, QR codes, page Tarifs | app non publiée ; pas de prix sur le site public |
| Domaine | apex `homifamille.com` principal, `www` → apex en 308 (réglage Vercel) |

## Limites connues
- Les articles du blog tutoient (ton de l'app) ; le reste du site vouvoie.
- Règles et montants (droits, aides) datés par « consultée le » ; à rafraîchir au moins une fois par an.
