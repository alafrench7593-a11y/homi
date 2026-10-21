-- =====================================================================
-- Planificateur de sommeil personnalisé, par enfant.
--  · sleep_profiles : le profil de sommeil d'UN enfant (heures habituelles, siestes, routine, difficultés,
--    préférences de notifications). Gratuit à remplir : il ne contient que ce que le parent choisit d'indiquer.
--  · sleep_feedback : avis du parent sur une estimation (« juste », « trop tôt », « trop tard ») ; réservé au
--    Premium, comme les estimations personnalisées elles-mêmes. Les avis déjà donnés restent lisibles.
-- Les relevés eux-mêmes (siestes, nuits, réveils nocturnes, tétées et biberons) restent dans leurs tables
-- habituelles et toujours gratuits. Chaque ligne est rattachée à un enfant : aucun mélange entre enfants
-- (jumeaux compris), et le partage par profil (child_scope) s'applique comme ailleurs.
-- =====================================================================

create table if not exists public.sleep_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null unique references public.children(id) on delete cascade,
  gestational_weeks smallint check (gestational_weeks between 22 and 42),
  use_corrected boolean not null default false,
  usual_wake time,
  nap_count smallint check (nap_count between 0 and 6),
  usual_bedtime time,
  feeding text check (feeding in ('breast', 'bottle', 'mixed', 'solids')),
  routine_minutes smallint not null default 20 check (routine_minutes between 5 and 60),
  routine_note text check (char_length(routine_note) <= 300),
  difficulties text[] not null default '{}'
    check (difficulties <@ array['falling_asleep', 'night_wakings', 'short_naps', 'early_waking', 'irregular']::text[]),
  notify jsonb not null default '{"enabled": false}'::jsonb check (jsonb_typeof(notify) = 'object' and pg_column_size(notify) < 2000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
select public._apply_household_policies('sleep_profiles', 'daily');

create table if not exists public.sleep_feedback (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  target text not null check (target in ('nap', 'bedtime')),
  verdict text not null check (verdict in ('right', 'early', 'late')),
  estimated_for timestamptz not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (child_id, target, estimated_for)
);
create index if not exists sleep_feedback_child_idx on public.sleep_feedback (child_id, created_at desc);
select public._apply_household_policies('sleep_feedback', 'daily');
drop trigger if exists sleep_feedback_premium on public.sleep_feedback;
create trigger sleep_feedback_premium before insert on public.sleep_feedback for each row execute function public.require_premium('sleep_insights');

-- L'enfant doit appartenir au foyer indiqué (sinon on pourrait rattacher un profil à l'enfant d'un autre foyer)
create or replace function public.sleep_child_in_household()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant inconnu dans ce foyer' using errcode = '23503';
  end if;
  return new;
end $$;
drop trigger if exists sleep_profiles_child on public.sleep_profiles;
create trigger sleep_profiles_child before insert or update of child_id, household_id on public.sleep_profiles for each row execute function public.sleep_child_in_household();
drop trigger if exists sleep_feedback_child on public.sleep_feedback;
create trigger sleep_feedback_child before insert or update of child_id, household_id on public.sleep_feedback for each row execute function public.sleep_child_in_household();

-- Partage par profil : un membre limité à certains enfants ne voit ni ne modifie le sommeil des autres
drop policy if exists sleep_profiles_child_id_scope on public.sleep_profiles;
create policy sleep_profiles_child_id_scope on public.sleep_profiles as restrictive for all to authenticated
  using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));
drop policy if exists sleep_feedback_child_id_scope on public.sleep_feedback;
create policy sleep_feedback_child_id_scope on public.sleep_feedback as restrictive for all to authenticated
  using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));

-- Export RGPD : profil de sommeil, avis donnés et routine du coucher des enfants accessibles
alter function public.export_my_data() rename to _export_my_data_v10;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  v := public._export_my_data_v10();
  return v || jsonb_build_object(
    'sleep_profiles', (select coalesce(jsonb_agg(t), '[]') from public.sleep_profiles t
      where t.household_id in (select m.household_id from public.household_members m where m.user_id = v_uid) and public.can_access_child(t.child_id)),
    'sleep_feedback', (select coalesce(jsonb_agg(t), '[]') from public.sleep_feedback t
      where t.household_id in (select m.household_id from public.household_members m where m.user_id = v_uid) and public.can_access_child(t.child_id)),
    'bedtime_routines', (select coalesce(jsonb_agg(t), '[]') from public.bedtime_routines t
      where t.household_id in (select m.household_id from public.household_members m where m.user_id = v_uid) and public.can_access_child(t.child_id))
  );
end $$;
revoke execute on function public._export_my_data_v10() from public, anon, authenticated;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
