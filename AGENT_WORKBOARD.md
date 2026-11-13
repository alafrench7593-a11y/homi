# AGENT_WORKBOARD — mission V6 (lancée le 13/11/2026, 01 h 15)

Branche d'intégration : `premium-experience` (dépôt local, rien de poussé). Chaque agent travaille dans son propre
worktree `/home/claude/wt-<agent>` sur la branche `v6-<agent>`, puis l'intégration est faite ici, tests relancés.

| Agent | Périmètre | Fichiers réservés | État |
|---|---|---|---|
| A — Allaitement (Agent 7) | chronomètre tétée (pause, reprise, changement de sein, reprise après fermeture), tirage simultané et volumes, banque de lait, historique mixte | `src/app/track/**`, `src/features/feeding/**` (nouveau), `src/app/feeding/**` (nouveau), migration `…_lactation_*.sql` | en cours |
| B — Sommeil bébé (Agent 7) | audit et compléments du sommeil (réveils, siestes, graphiques 7/14/30 j, relais, résumé pédiatre) | `src/app/sleep/**`, `src/features/sleep*.tsx`, migration `…_sleep_*.sql` | en cours |
| C — Famille & abonnements (Agent 8 + 9) | Premium Famille 15,99 €, droits serveur, « Ce que je partage avec mon partenaire », espace Papa, invitations | `src/app/partner/**`, `src/app/family/papa*`, `src/app/settings/sharing*`, `src/features/Paywall.tsx`, `src/app/settings/subscription.tsx`, `src/lib/premium/**`, `supabase/functions/revenuecat-webhook/**`, migration `…_famille_*.sql` | en cours |
| D — Iconographie (Agent 5) | `MaternityIcon` : pictogrammes SVG originaux au fil doré, versions statiques et tracées | `src/components/icons/**` (nouveau), `MATERNITY_ICONOGRAPHY_SYSTEM.md` | en cours |
| E — Recherche (Agents 2 + skills/MCP) | Reddit (URL vérifiables), skills GitHub, MCP | `REDDIT_PARENT_RESEARCH.md`, `GITHUB_SKILLS_AUDIT.md`, `MCP_INTEGRATIONS_AUDIT.md` | en cours |
| Coordinateur | intégration, tests complets, revue adverse, rapports finaux | `src/i18n/*/index.ts`, `src/lib/routes.generated.ts`, rapports | — |

Règles communes : aucune suppression de fonctionnalité ou de donnée ; migrations versionnées et réversibles, jamais
appliquées en production ; aucun prix inventé ; pas de diagnostic ; textes en 5 langues ; tests réellement exécutés.
