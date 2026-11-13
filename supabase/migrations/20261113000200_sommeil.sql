-- =====================================================================
-- Sommeil de l'enfant — journal daté (13/11/2026), migration ADDITIVE.
--
-- Ce qu'elle fait :
--   sleep_notes : notes datées sur le sommeil d'UN enfant, de deux sortes :
--     · 'difficulty'     : une difficulté vécue (endormissement, réveils fréquents, siestes courtes…), avec un
--                          texte libre facultatif ;
--     · 'routine_change' : un changement de routine (nouvelle heure de coucher, reprise de la crèche, voyage…).
--   Ces notes alimentent l'historique des nuits et le résumé à montrer au pédiatre. Elles ne servent à aucun calcul,
--   aucune note ni aucune comparaison.
--
-- Pourquoi une table : le profil de sommeil (sleep_profiles.difficulties) ne garde qu'une liste sans date, et les
--   relevés (sleeps.note) sont attachés à un sommeil précis. Un journal daté, indépendant d'un sommeil, n'existait pas.
--
-- Règles d'accès (identiques aux autres données du sommeil de l'enfant) :
--   · foyer, domaine 'daily' (_apply_household_policies) ;
--   · partage par profil : can_access_child (restrictive) — un membre limité à un enfant ne voit pas les autres ;
--   · l'enfant doit appartenir au foyer indiqué (déclencheur sleep_child_in_household, déjà existant) ;
--   · nouvelle saisie réservée au Premium strict, comme sleeps (_require_premium_write) ;
--   · incluse dans l'export RGPD (export_my_data).
--
-- Retour arrière (après accord) :
--   drop function public.export_my_data(); alter function public._export_my_data_sommeil() rename to export_my_data;
--   drop table public.sleep_notes;
-- =====================================================================

create table if not exists public.sleep_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid unique,
  household_id uuid not null references public.households(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('difficulty', 'routine_change')),
  noted_at timestamptz not null default now(),
  tags text[] not null default '{}'
    check (tags <@ array['falling_asleep', 'night_wakings', 'short_naps', 'early_waking', 'irregular', 'other']::text[]
      and coalesce(array_length(tags, 1), 0) <= 6),
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- une note n'est jamais vide, ni datée dans le futur
  constraint sleep_notes_not_empty check (coalesce(array_length(tags, 1), 0) > 0 or (note is not null and char_length(btrim(note)) > 0)),
  constraint sleep_notes_not_future check (noted_at <= now() + interval '5 minutes')
);
create index if not exists sleep_notes_child_idx on public.sleep_notes (child_id, noted_at desc);
create index if not exists sleep_notes_household_idx on public.sleep_notes (household_id);
create index if not exists sleep_notes_created_by_idx on public.sleep_notes (created_by);
select public._apply_household_policies('sleep_notes', 'daily');

drop trigger if exists sleep_notes_child on public.sleep_notes;
create trigger sleep_notes_child before insert or update of child_id, household_id on public.sleep_notes
  for each row execute function public.sleep_child_in_household();

drop policy if exists sleep_notes_child_id_scope on public.sleep_notes;
create policy sleep_notes_child_id_scope on public.sleep_notes as restrictive for all to authenticated
  using (public.can_access_child(child_id)) with check (public.can_access_child(child_id));

-- Premium strict : même garde que les relevés de sommeil
drop trigger if exists sleep_notes_premium_write on public.sleep_notes;
create trigger sleep_notes_premium_write before insert or update on public.sleep_notes
  for each row execute function public._require_premium_write('premium');

-- Export RGPD : les notes des enfants accessibles
alter function public.export_my_data() rename to _export_my_data_sommeil;
revoke execute on function public._export_my_data_sommeil() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_sommeil() || jsonb_build_object(
    'sleep_notes', (select coalesce(jsonb_agg(to_jsonb(n) order by n.noted_at), '[]') from public.sleep_notes n
      where n.household_id in (select m.household_id from public.household_members m where m.user_id = v_uid)
        and public.can_access_child(n.child_id)));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
