-- =====================================================================
-- « Donner mon avis » (07/11/2026) — migration ADDITIVE.
-- Les mamans signalent un problème, proposent une amélioration ou demandent un ajout, depuis l'application.
--   - la personne voit ses propres avis et leur suivi (statut) ; elle peut les supprimer ;
--   - l'équipe (rôle admin ou moderator) lit tous les avis et change leur statut ; elle ne peut ni les réécrire ni en créer ;
--   - au plus 20 avis par personne et par jour (anti-abus) ;
--   - supprimés avec le compte (cascade), inclus dans l'export RGPD.
-- Aucune donnée de santé n'est jointe automatiquement : seuls l'écran d'origine, la version et la plateforme.
--
-- Retour arrière (après accord) :
--   drop function public.export_my_data(); alter function public._export_my_data_v26() rename to export_my_data;
--   drop table public.app_feedback; drop function public._app_feedback_guard();
-- =====================================================================
create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('bug', 'improve', 'idea', 'other')),
  body text not null check (char_length(btrim(body)) between 3 and 2000),
  screen text check (char_length(screen) <= 200),
  app_version text check (char_length(app_version) <= 40),
  platform text check (platform in ('ios', 'android', 'web')),
  contact_ok boolean not null default false,
  status text not null default 'new' check (status in ('new', 'seen', 'planned', 'done', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_feedback_user_idx on public.app_feedback(user_id, created_at desc);
create index if not exists app_feedback_status_idx on public.app_feedback(status, created_at desc);
create trigger app_feedback_touch before update on public.app_feedback for each row execute function public.touch_updated_at();
alter table public.app_feedback enable row level security;
revoke all on public.app_feedback from anon;

create policy app_feedback_own_sel on public.app_feedback for select to authenticated
  using (user_id = auth.uid() or public.has_role('moderator'));
create policy app_feedback_own_ins on public.app_feedback for insert to authenticated
  with check (user_id = auth.uid() and status = 'new');
create policy app_feedback_own_del on public.app_feedback for delete to authenticated
  using (user_id = auth.uid());
create policy app_feedback_team_upd on public.app_feedback for update to authenticated
  using (public.has_role('moderator')) with check (public.has_role('moderator'));

-- Garde-fous : l'équipe ne change que le statut ; 20 avis par jour au plus
create or replace function public._app_feedback_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id or new.kind is distinct from old.kind or new.body is distinct from old.body
       or new.screen is distinct from old.screen or new.app_version is distinct from old.app_version
       or new.platform is distinct from old.platform or new.contact_ok is distinct from old.contact_ok
       or new.created_at is distinct from old.created_at then
      raise exception 'Seul le statut peut changer' using errcode = '42501';
    end if;
    return new;
  end if;
  if (select count(*) from public.app_feedback f where f.user_id = new.user_id and f.created_at > now() - interval '1 day') >= 20 then
    raise exception 'Trop d''avis aujourd''hui' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public._app_feedback_guard() from public, anon, authenticated;
drop trigger if exists app_feedback_guard on public.app_feedback;
create trigger app_feedback_guard before insert or update on public.app_feedback
  for each row execute function public._app_feedback_guard();

alter function public.export_my_data() rename to _export_my_data_v26;
revoke execute on function public._export_my_data_v26() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v26() || jsonb_build_object(
    'app_feedback', (select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at), '[]') from public.app_feedback f where f.user_id = v_uid));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
