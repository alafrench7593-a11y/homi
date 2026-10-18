-- =====================================================================
-- Cache serveur des réponses Open Food / Beauty / Products Facts (données publiques, ODbL),
-- pour respecter leurs quotas (15 lectures et 10 recherches / min / IP) depuis des adresses
-- serveur partagées, et garder la date de récupération affichée. Aucune donnée personnelle.
-- Lecture et écriture réservées au serveur (aucune politique pour les rôles de l'application).
-- =====================================================================
create table public.open_facts_cache (
  key text primary key check (char_length(key) <= 200),
  payload jsonb,
  found boolean not null,
  fetched_at timestamptz not null default now()
);
alter table public.open_facts_cache enable row level security;
revoke all on public.open_facts_cache from anon, authenticated;
create index open_facts_cache_age_idx on public.open_facts_cache(fetched_at);
