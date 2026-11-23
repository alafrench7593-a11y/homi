# HOMI — architecture (synthèse, à lire avant tout audit)

Mise à jour : 23/11/2026. Détail historique : `docs/AUDIT_LANCEMENT_2026-11-23.md`. Avancement : `docs/SUIVI.md`.

## Pile
Expo SDK 57 (Expo Router, React Native, react-native-web), TypeScript, Reanimated ; TanStack Query (cache persisté,
clés privées exclues) ; Zustand (UI, visite guidée, relais) ; Supabase (Postgres + RLS, Storage, Edge Functions Deno,
pg_cron) ; RevenueCat (Premium, crédits Aura) ; Sentry opt-in ; EAS Build/Submit ; Vercel (site + /demo + /app).

## Structure
- `src/app/` : 307 écrans (Expo Router). Onglets `(tabs)` : Aujourd’hui, Moi, +, Enfant, Famille ; Aura = `/assistant` et `/ask`.
- `src/features/<domaine>/` : composants métier ; `src/components/` : UI partagée (verre liquide : `components/glass`).
- `src/lib/data/hooks*.ts` : accès aux données (une seule source : `backend` = Supabase ou moteur de démo local).
  Écritures du quotidien : `useAddLog(kind)` → `insertOrQueue` (file hors ligne, `client_id` anti-doublon) →
  invalidation du cache de la table → tous les écrans (outil, accueil, graphiques, historique, Aura) se mettent à jour.
- `src/lib/journeys/tools.ts` : **registre central des outils** (127 outils + 9 entrées de compte) : id, catégorie,
  portées (profil), route, sous-accès. `toolsFor(scope)` = catalogue affiché ; `screenAllowed` = garde des écrans.
- `src/lib/domain/` : logique pure testée (sommeil, cycle, repas, vaccins, recherche d’outils…).
- `src/i18n/<fr|en|de|es|it>/` : textes ; `supabase/migrations/` : 149 migrations ; `supabase/tests/` : RLS (PG16 éphémère).

## Données (Supabase)
Foyer (`households`, `household_members` : rôle, `can_view`/`can_edit` par domaine, `child_scope`, accès grossesse) ;
enfants, grossesses, parcours (`user_journeys`) ; suivis (`sleeps`, `bottles`, `feedings`, `diapers`, mesures…) ;
agenda, tâches, missions ; documents et photos (Storage, chemins par foyer/enfant) ; Aura (`assistant_*`, crédits).
RLS partout ; droits enfant par enfant (`child_scope`), corrigés et déployés le 23/11 (B1–B3).

## Démo
`/demo` et le web sans session : moteur local (`toietmoi.demo.v1` en localStorage), famille fictive, 0 requête backend.

## Décisions
- Le web ne vend rien (Premium dans l’app iOS) ; aperçu du paywall en dev : `/start/offers?apercu=1`.
- Le catalogue est filtré par profil ; le cycle menstruel est toujours proposé dans « Moi ».
- Aucune écriture par l’IA : Aura prépare, le parent confirme, l’app écrit par les hooks existants (voir AURA_IMPLEMENTATION).

## Problèmes connus
Conservation `20261208000100` non déployée en prod ; prénoms non masqués dans les textes libres envoyés au modèle ;
analytics grossesse ↔ compte ; journal du foyer sans purge ; iPhone réel non rejoué ; Google OAuth non configuré.
