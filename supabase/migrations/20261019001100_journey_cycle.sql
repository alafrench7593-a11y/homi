-- =====================================================================
-- Parcours « suivre simplement mon cycle » (sans objectif de grossesse ni de contraception).
-- Élargit la liste autorisée : aucune donnée existante n'est modifiée.
-- =====================================================================
alter table public.profiles drop constraint if exists profiles_journeys_check;
alter table public.profiles add constraint profiles_journeys_check
  check (journeys <@ array['avoid','ttc','cycle','pregnant','newborn','child','family']::text[]);

-- Centres d'intérêt facultatifs choisis à l'inscription (santé, communauté) : liste fermée, 8 au plus.
alter table public.profiles drop constraint if exists profiles_interests_check;
alter table public.profiles add constraint profiles_interests_check
  check (cardinality(interests) <= 8 and interests <@ array['health','community']::text[]) not valid;
