-- =====================================================================
-- Partage du cycle avec le ou la partenaire (Premium) : choisi élément par élément, révocable à tout moment,
-- en lecture seule, uniquement avec un membre du même foyer. JAMAIS partagés : rapports, contraception, notes,
-- étiquettes, photos, tests, symptômes intimes. Le partage se met en pause si l'abonnement de la personne prend fin.
-- Retour arrière :
--   drop function public.partner_cycle(uuid); drop function public.cycle_shared_with_me();
--   drop table public.cycle_shares; (puis restaurer export_my_data et delete_my_cycle_data précédents)
-- =====================================================================

create table if not exists public.cycle_shares (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  share_period boolean not null default true,
  share_fertile boolean not null default false,
  share_mood boolean not null default false,
  share_symptoms boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, partner_id),
  check (owner_id <> partner_id)
);
create index if not exists cycle_shares_partner_idx on public.cycle_shares(partner_id);
alter table public.cycle_shares enable row level security;
-- La personne qui partage gère son partage ; le ou la partenaire le voit et peut cesser de le recevoir
drop policy if exists cycle_shares_owner on public.cycle_shares;
create policy cycle_shares_owner on public.cycle_shares for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists cycle_shares_partner_read on public.cycle_shares;
create policy cycle_shares_partner_read on public.cycle_shares for select to authenticated using (partner_id = auth.uid());
drop policy if exists cycle_shares_partner_leave on public.cycle_shares;
create policy cycle_shares_partner_leave on public.cycle_shares for delete to authenticated using (partner_id = auth.uid());

create or replace function public._same_household(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members x join public.household_members y on y.household_id = x.household_id where x.user_id = a and y.user_id = b)
$$;
revoke execute on function public._same_household(uuid, uuid) from public, anon, authenticated;

create or replace function public.cycle_share_check() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public._same_household(new.owner_id, new.partner_id) then
    raise exception 'Partage possible seulement avec un membre de votre foyer' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' and not public.has_premium(new.owner_id) then
    raise exception 'Fonction Premium (cycle_share)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists cycle_shares_check on public.cycle_shares;
create trigger cycle_shares_check before insert or update on public.cycle_shares for each row execute function public.cycle_share_check();

-- Cycles partagés avec moi (prénom affiché, éléments partagés, pause)
create or replace function public.cycle_shared_with_me()
returns table (owner_id uuid, display_name text, share_period boolean, share_fertile boolean, share_mood boolean, share_symptoms boolean, paused boolean)
language sql stable security definer set search_path = public as $$
  select s.owner_id, coalesce(p.display_name, 'Votre partenaire'), s.share_period, s.share_fertile, s.share_mood, s.share_symptoms,
         not public.has_premium(s.owner_id) or not public._same_household(s.owner_id, s.partner_id)
    from public.cycle_shares s left join public.profiles p on p.id = s.owner_id
   where s.partner_id = auth.uid()
$$;
revoke execute on function public.cycle_shared_with_me() from public, anon;
grant execute on function public.cycle_shared_with_me() to authenticated;

-- Données partagées, et seulement elles (les estimations sont recalculées sur le téléphone du ou de la partenaire)
create or replace function public.partner_cycle(p_owner uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.cycle_shares; v_paused boolean;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into s from public.cycle_shares where owner_id = p_owner and partner_id = auth.uid();
  if not found then raise exception 'Aucun partage' using errcode = 'P0002'; end if;
  v_paused := not public.has_premium(p_owner) or not public._same_household(p_owner, auth.uid());
  if v_paused then return jsonb_build_object('paused', true); end if;
  return jsonb_build_object(
    'paused', false,
    'share_period', s.share_period, 'share_fertile', s.share_fertile, 'share_mood', s.share_mood, 'share_symptoms', s.share_symptoms,
    'periods', case when s.share_period or s.share_fertile then (select coalesce(jsonb_agg(jsonb_build_object('start_date', e.start_date, 'end_date', e.end_date) order by e.start_date), '[]')
      from (select start_date, end_date from public.period_entries where user_id = p_owner order by start_date desc limit 12) e) else '[]'::jsonb end,
    'moods', case when s.share_mood then (select coalesce(jsonb_agg(jsonb_build_object('date', l.logged_on, 'moods', l.moods) order by l.logged_on), '[]')
      from public.symptom_logs l where l.user_id = p_owner and l.logged_on >= current_date - 13 and cardinality(l.moods) > 0) else '[]'::jsonb end,
    'symptoms', case when s.share_symptoms then (select coalesce(jsonb_agg(jsonb_build_object('date', l.logged_on,
        'keys', array(select k from unnest(l.symptom_keys) k where k not in ('libido_up','libido_down','dyspareunia','discomfort'))) order by l.logged_on), '[]')
      from public.symptom_logs l where l.user_id = p_owner and l.logged_on >= current_date - 13) else '[]'::jsonb end);
end $$;
revoke execute on function public.partner_cycle(uuid) from public, anon;
grant execute on function public.partner_cycle(uuid) to authenticated;

-- Effacer le cycle arrête aussi les partages ; export RGPD complété
alter function public.delete_my_cycle_data() rename to _delete_my_cycle_data_v3;
revoke execute on function public._delete_my_cycle_data_v3() from public, anon; -- appelée avec les droits de la personne (ses seules lignes)
create or replace function public.delete_my_cycle_data() returns void
language plpgsql security invoker set search_path = public as $$
begin
  perform public._delete_my_cycle_data_v3();
  delete from public.cycle_shares where owner_id = auth.uid();
end $$;
revoke execute on function public.delete_my_cycle_data() from public, anon;
grant execute on function public.delete_my_cycle_data() to authenticated;

alter function public.export_my_data() rename to _export_my_data_v14;
revoke execute on function public._export_my_data_v14() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public._export_my_data_v14() || jsonb_build_object(
    'cycle_shares', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from public.cycle_shares c where c.owner_id = auth.uid() or c.partner_id = auth.uid()));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
