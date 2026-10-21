-- Nouveau catalogue de recettes (octobre 2026).
-- 1. Congélation : champ rédigé affiché sur chaque fiche.
-- 2. « Je n'aime pas cette idée » : idées masquées par personne (comme les favoris), jamais supprimées de la bibliothèque.
-- 3. Suppression DÉFINITIVE de l'ancien catalogue de la bibliothèque (recettes sans propriétaire), à la demande de
--    l'éditrice. Le nouveau catalogue (et la purée carotte et pomme de terre, dont la photo a été fournie) est inséré par
--    20261021000200_recipes_v2_seed.sql. Les recettes personnelles des familles ne sont jamais touchées.
--    Favoris, menus et listes qui citaient une recette supprimée la perdent (on delete cascade).

alter table public.recipes add column if not exists freezing text check (char_length(freezing) <= 600);

create table if not exists public.recipe_dislikes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipe_slug text not null references public.recipes(slug) on delete cascade on update cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_slug)
);
alter table public.recipe_dislikes enable row level security;
drop policy if exists recipe_dislikes_own on public.recipe_dislikes;
create policy recipe_dislikes_own on public.recipe_dislikes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

delete from public.recipes where owner_id is null;

