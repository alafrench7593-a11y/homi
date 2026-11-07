-- =====================================================================
-- Profil « maman solo » (07/11/2026) — migration ADDITIVE.
--   * profiles.family_situation : 'couple' | 'solo' | 'coparenting' (null = non renseigné) ;
--   * support_circle : le cercle d'aide PRIVÉ d'une personne (mamie, amie, voisine…), jamais visible du foyer ;
--   * offduty_periods.relay_contact_id : « Je décroche » peut passer le relais à une personne du cercle.
-- Aucune donnée existante n'est modifiée ni supprimée.
--
-- Retour arrière (après accord) :
--   drop function public.export_my_data(); alter function public._export_my_data_v23() rename to export_my_data;
--   alter table public.offduty_periods drop column relay_contact_id;
--   drop table public.support_circle;
--   alter table public.profiles drop column family_situation;
-- =====================================================================

alter table public.profiles add column if not exists family_situation text
  check (family_situation in ('couple', 'solo', 'coparenting'));

create table if not exists public.support_circle (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  phone text check (phone ~ '^[0-9 +().-]{3,25}$'),
  relation text check (char_length(relation) <= 40),
  helps text[] not null default '{}' check (helps <@ array['nights','pickup','meals','shopping','emergency','listen','admin']::text[]),
  note text check (char_length(note) <= 300),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_circle_user_idx on public.support_circle(user_id, position);
drop trigger if exists support_circle_touch on public.support_circle;
create trigger support_circle_touch before update on public.support_circle for each row execute function public.touch_updated_at();
select public._apply_owner_policies('support_circle');

alter table public.offduty_periods add column if not exists relay_contact_id uuid references public.support_circle(id) on delete set null;
create index if not exists offduty_periods_relay_contact_idx on public.offduty_periods(relay_contact_id);

-- Le contact de relais doit appartenir à la personne qui décroche.
create or replace function public._offduty_contact_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.relay_contact_id is not null and not exists (
    select 1 from public.support_circle c where c.id = new.relay_contact_id and c.user_id = new.user_id) then
    raise exception 'Contact de relais inconnu' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public._offduty_contact_owner() from public, anon, authenticated;
drop trigger if exists offduty_contact_owner on public.offduty_periods;
create trigger offduty_contact_owner before insert or update of relay_contact_id on public.offduty_periods
  for each row execute function public._offduty_contact_owner();

-- Export RGPD
alter function public.export_my_data() rename to _export_my_data_v23;
revoke execute on function public._export_my_data_v23() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v23() || jsonb_build_object(
    'support_circle', (select coalesce(jsonb_agg(to_jsonb(c) order by c.position, c.created_at), '[]') from public.support_circle c where c.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
