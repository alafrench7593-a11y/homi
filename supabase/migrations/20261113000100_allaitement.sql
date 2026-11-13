-- =====================================================================
-- Allaitement (mission V6, lot A, 13/11/2026) — migration ADDITIVE.
--
-- Ce qu'elle fait :
--  1. breastfeeds.session_id (facultatif) : relie les segments d'une même tétée chronométrée
--     (gauche puis droite, pauses). Le schéma garde UN côté par ligne ; une session = une ligne par
--     segment, toutes avec le même session_id. Les lignes existantes (session_id null) restent des
--     tétées à part entière.
--  2. pumpings : quantités par sein (left_ml, right_ml), durée facultative (duration_min) et confort
--     en mots (comfort : comfortable / uncomfortable / painful — aucune note chiffrée).
--     amount_ml reste LE TOTAL (inchangé, toujours obligatoire) : rien ne casse pour les écrans existants.
--  3. Nouvelle table milk_stash (réserve de lait) : portions recueillies, conservation, emplacement libre,
--     statut disponible / utilisée / jetée avec sa date. AUCUNE date limite n'est stockée ni calculée
--     (pas de règle sanitaire validée dans le projet : l'application renvoie aux professionnels).
--     Droits : exactement le modèle de pumpings — _apply_household_policies(…, 'daily'), politique
--     restrictive par enfant (can_access_child), foyer recopié depuis l'enfant, garde Premium en écriture,
--     publication temps réel, export RGPD, aucun accès anonyme.
--
-- Pourquoi : chronomètre de tétée avec changement de sein et pause, tirage détaillé, banque de lait.
--
-- Retour arrière (après accord, AUCUNE donnée existante n'est modifiée par cette migration) :
--   drop function public.export_my_data();
--   alter function public._export_my_data_pre_allaitement() rename to export_my_data;
--   grant execute on function public.export_my_data() to authenticated;
--   alter publication supabase_realtime drop table public.milk_stash;
--   drop table public.milk_stash;
--   alter table public.pumpings drop column comfort, drop column duration_min, drop column right_ml, drop column left_ml;
--   drop index public.breastfeeds_session_idx; alter table public.breastfeeds drop column session_id;
-- =====================================================================

-- 1. Tétées : regroupement des segments d'une session --------------------------------------------
alter table public.breastfeeds add column if not exists session_id uuid;
comment on column public.breastfeeds.session_id is 'Tétée chronométrée : identifiant commun aux segments (un sein par ligne). Null pour une saisie simple.';
create index if not exists breastfeeds_session_idx on public.breastfeeds(session_id) where session_id is not null;

-- 2. Tirage détaillé --------------------------------------------------------------------------------
alter table public.pumpings add column if not exists left_ml int check (left_ml between 0 and 1000);
alter table public.pumpings add column if not exists right_ml int check (right_ml between 0 and 1000);
alter table public.pumpings add column if not exists duration_min int check (duration_min between 1 and 300);
alter table public.pumpings add column if not exists comfort text check (comfort in ('comfortable', 'uncomfortable', 'painful'));
comment on column public.pumpings.amount_ml is 'Total tiré (ml). Quand left_ml / right_ml sont saisis, total ≥ leur somme (il peut être corrigé à la main).';
comment on column public.pumpings.comfort is 'Ressenti en mots, sans note chiffrée.';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pumpings_total_covers_sides') then
    alter table public.pumpings add constraint pumpings_total_covers_sides
      check (amount_ml >= coalesce(left_ml, 0) + coalesce(right_ml, 0)) not valid;
    -- Les lignes existantes n'ont ni left_ml ni right_ml : la contrainte est vraie pour elles
    alter table public.pumpings validate constraint pumpings_total_covers_sides;
  end if;
end $$;

-- 3. Réserve de lait ------------------------------------------------------------------------------
create table if not exists public.milk_stash (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  -- Tirage d'origine (facultatif)
  pumping_id uuid references public.pumpings(id) on delete set null,
  volume_ml int not null check (volume_ml between 1 and 1000),
  collected_at timestamptz not null,
  storage text not null check (storage in ('fridge', 'freezer', 'other')),
  location text check (char_length(location) <= 120),
  status text not null default 'available' check (status in ('available', 'used', 'discarded')),
  status_at timestamptz,
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Une portion disponible n'a pas de date de statut ; utilisée ou jetée, elle en a une (jamais avant le recueil)
  constraint milk_stash_status_at check ((status = 'available') = (status_at is null)),
  constraint milk_stash_status_after_collect check (status_at is null or status_at >= collected_at)
);
comment on table public.milk_stash is 'Réserve de lait maternel du foyer : portions, conservation, statut. Aucune date limite n''est stockée ni calculée.';

create index if not exists milk_stash_household_idx on public.milk_stash(household_id);
create index if not exists milk_stash_child_idx on public.milk_stash(child_id, collected_at desc);
create index if not exists milk_stash_available_idx on public.milk_stash(child_id) where status = 'available';
create index if not exists milk_stash_pumping_id_fk_idx on public.milk_stash(pumping_id);
create index if not exists milk_stash_created_by_fk_idx on public.milk_stash(created_by);

-- household_id toujours recopié depuis l'enfant : impossible de viser un foyer étranger
drop trigger if exists milk_stash_household on public.milk_stash;
create trigger milk_stash_household before insert or update of child_id on public.milk_stash
  for each row execute function public.set_household_from_child();
drop trigger if exists milk_stash_touch on public.milk_stash;
create trigger milk_stash_touch before update on public.milk_stash
  for each row execute function public.touch_updated_at();

-- Mêmes droits que pumpings : domaine 'daily' du foyer + restriction par enfant + Premium en écriture
select public._apply_household_policies('milk_stash', 'daily');
drop policy if exists milk_stash_child_id_scope on public.milk_stash;
create policy milk_stash_child_id_scope on public.milk_stash as restrictive for all to authenticated
  using (child_id is null or public.can_access_child(child_id)) with check (child_id is null or public.can_access_child(child_id));
drop trigger if exists milk_stash_premium_write on public.milk_stash;
create trigger milk_stash_premium_write before insert or update on public.milk_stash
  for each row execute function public._require_premium_write('premium');
revoke all on public.milk_stash from anon;

-- Temps réel : même publication que les autres données partagées du suivi (RLS appliquée à chaque abonné)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'milk_stash') then
    alter publication supabase_realtime add table public.milk_stash;
  end if;
end $$;

-- 4. Export RGPD ----------------------------------------------------------------------------------
-- Nom de sauvegarde propre à ce lot (pas de numéro de version : les lots V6 sont intégrés dans un ordre libre)
alter function public.export_my_data() rename to _export_my_data_pre_allaitement;
revoke execute on function public._export_my_data_pre_allaitement() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_pre_allaitement() || jsonb_build_object(
    'milk_stash', (select coalesce(jsonb_agg(to_jsonb(m) order by m.collected_at), '[]') from public.milk_stash m
      where public.can_access_household(m.household_id, 'daily', false) and public.can_access_child(m.child_id)));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
