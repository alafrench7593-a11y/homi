-- =====================================================================================================================
-- Couple → « Se comprendre » (19/11/2026). Tables DÉDIÉES, séparées de la messagerie de la communauté.
--  * couple_feelings : « Comment je me sens » — PRIVÉ, lisible par son autrice seule (aucune colonne foyer).
--  * couple_messages : ce qu'une personne choisit d'envoyer à l'autre adulte du foyer, et les réponses.
--    Lisible par l'autrice et le destinataire explicite seulement, tant qu'ils sont adultes ACTIFS du foyer
--    (un adulte retiré perd l'accès immédiatement) ; supprimable par l'autrice ; écrit seulement par couple_send().
--  * Notification au texte FIXE, sans aucun contenu du message (ni titre, ni corps, ni données jointes).
-- Interdits de conception (gardés par src/__tests__/understandGuards.test.ts) : aucun compteur de refus, aucun score,
-- aucune statistique, aucune relance planifiée, aucun journal d'audit du contenu.
-- =====================================================================================================================

create table if not exists public.couple_feelings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  feelings text[] not null default '{}' check (cardinality(feelings) <= 9
    and feelings <@ array['tired', 'rest', 'overwhelmed', 'tenderness', 'talk', 'me_time', 'lonely', 'stressed', 'together']::text[]),
  note text check (note is null or char_length(note) <= 1000),
  client_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index if not exists couple_feelings_user_idx on public.couple_feelings(user_id, created_at desc);
alter table public.couple_feelings enable row level security;
drop policy if exists couple_feelings_owner on public.couple_feelings;
create policy couple_feelings_owner on public.couple_feelings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.couple_feelings from anon;
grant select, insert, update, delete on public.couple_feelings to authenticated;

create table if not exists public.couple_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('share', 'reply', 'request', 'offer')),
  situation text check (situation is null or situation in ('fatigue', 'mental_load', 'tenderness', 'time', 'postpartum', 'fear', 'no_sex_now')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  reply_to uuid references public.couple_messages(id) on delete set null,
  task_id uuid references public.family_tasks(id) on delete set null,
  client_id uuid,
  created_at timestamptz not null default now(),
  check (author_id <> recipient_id),
  unique (author_id, client_id)
);
create index if not exists couple_messages_pair_idx on public.couple_messages(household_id, created_at desc);
create index if not exists couple_messages_recipient_idx on public.couple_messages(recipient_id);
create index if not exists couple_messages_reply_idx on public.couple_messages(reply_to);
create index if not exists couple_messages_task_idx on public.couple_messages(task_id);
alter table public.couple_messages enable row level security;
drop policy if exists couple_messages_read on public.couple_messages;
create policy couple_messages_read on public.couple_messages for select to authenticated
  using ((author_id = auth.uid() or recipient_id = auth.uid()) and public._is_parent_in(household_id));
drop policy if exists couple_messages_delete on public.couple_messages;
create policy couple_messages_delete on public.couple_messages for delete to authenticated
  using (author_id = auth.uid());
revoke all on public.couple_messages from anon;
revoke insert, update, truncate on public.couple_messages from authenticated;
grant select, delete on public.couple_messages to authenticated;

-- Envoi (partage, réponse, demande, proposition). Rejeu (même client_id) : même message, aucune notification de plus.
create or replace function public.couple_send(p_household uuid, p_recipient uuid, p_kind text, p_body text, p_situation text default null,
  p_reply_to uuid default null, p_task uuid default null, p_client_id uuid default null)
returns public.couple_messages language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r public.couple_messages; v_name text; v_discreet boolean;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if not public._is_parent_in(p_household, v_uid) or not public._is_parent_in(p_household, p_recipient) or p_recipient = v_uid then
    raise exception 'Ce message ne peut être envoyé qu''à l''autre adulte de votre foyer.' using errcode = '42501';
  end if;
  if p_client_id is not null then
    select * into r from public.couple_messages where author_id = v_uid and client_id = p_client_id;
    if found then return r; end if;
  end if;
  if p_reply_to is not null and not exists (select 1 from public.couple_messages x where x.id = p_reply_to and x.household_id = p_household
       and ((x.author_id = v_uid and x.recipient_id = p_recipient) or (x.author_id = p_recipient and x.recipient_id = v_uid))) then
    raise exception 'Message introuvable.' using errcode = '22023';
  end if;
  if p_task is not null and not exists (select 1 from public.family_tasks t where t.id = p_task and t.household_id = p_household) then
    raise exception 'Tâche introuvable dans ce foyer.' using errcode = '22023';
  end if;
  insert into public.couple_messages(household_id, author_id, recipient_id, kind, situation, body, reply_to, task_id, client_id)
    values (p_household, v_uid, p_recipient, p_kind, p_situation, btrim(p_body), p_reply_to, p_task, p_client_id)
    returning * into r;
  -- Notification : texte fixe ; le prénom seulement si le destinataire n'a pas choisi la discrétion. Jamais le contenu.
  select coalesce((select s.couple_discreet from public.notification_settings s where s.user_id = p_recipient), false) into v_discreet;
  v_name := case when v_discreet then null else public._first_name_of(v_uid) end;
  insert into public.notifications(user_id, category, title, body, deep_link, payload)
    values (p_recipient, 'family',
            case when v_name is null then 'Votre partenaire souhaite partager quelque chose avec vous'
                 else v_name || ' souhaite partager quelque chose avec vous' end,
            'Ouvrez HOMI quand vous le souhaitez.', '/family/understand/inbox', jsonb_build_object('couple', true));
  return r;
end $$;
revoke execute on function public.couple_send(uuid, uuid, text, text, text, uuid, uuid, uuid) from public, anon;
grant execute on function public.couple_send(uuid, uuid, text, text, text, uuid, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------- export RGPD (« Exporter mes données »)
-- Version de 20261117000100_audit_securite_backend.sql + mes ressentis, les messages que j'ai écrits ou reçus,
-- mes réglages de profil familial. export_my_data() (security INVOKER) filtre ensuite sous RLS.
create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  return public._export_my_data_v29() || jsonb_build_object('couple', jsonb_build_object(
    'feelings', (select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at), '[]') from public.couple_feelings f where f.user_id = v_uid),
    'messages', (select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]') from public.couple_messages m
                 where (m.author_id = v_uid or m.recipient_id = v_uid) and public._is_parent_in(m.household_id, v_uid)),
    'family_profile', (select coalesce(jsonb_agg(to_jsonb(p)), '[]') from public.family_member_profiles p where p.user_id = v_uid)));
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;
