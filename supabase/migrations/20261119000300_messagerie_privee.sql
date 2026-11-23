-- =====================================================================
-- Messagerie privée de la communauté (1 à 1, texte seulement dans cette première version).
--
-- Règles
--   * Deux membres qui se suivent mutuellement s'écrivent librement (conversation « ouverte »).
--   * Sinon, le premier message est une « demande de message » : la destinataire l'accepte ou la refuse.
--     Tant qu'elle n'a pas accepté, la demandeuse ne peut envoyer que 3 messages, sans coordonnées ni liens.
--     Un refus n'est jamais annoncé à la demandeuse (pas de représailles).
--   * Aucun message entre deux personnes dont l'une a bloqué l'autre ; la conversation disparaît des deux boîtes.
--   * Seules les deux participantes lisent une conversation (RLS). Personne n'écrit directement dans les tables :
--     toute écriture passe par les fonctions ci-dessous, qui vérifient participation, blocage, suspension et débit.
--   * Notifications : jamais le texte du message (ni dans le centre de notifications, ni dans le push qui en découle).
--   * Signalement : dm_report() alimente la file de modération existante (public.reports) et joint, pour les
--     modératrices seulement, les derniers messages de la personne signalée dans CETTE conversation.
--
-- Additif : 4 nouvelles tables, des fonctions, leur publication temps réel. Deux objets existants sont touchés, sans
-- rien retirer : la liste des catégories de public.notifications est ÉLARGIE d'une valeur ('community_message'), et
-- _export_my_data_raw() (export RGPD) renvoie une clé de plus, « private_messages ». Aucune donnée n'est modifiée.
--
-- Retour arrière (dans cet ordre) :
--   drop function if exists public.dm_report(uuid, text, text), public.dm_unread(), public.dm_messages_list(uuid, timestamptz, int),
--     public.dm_conversation(uuid), public.dm_inbox(), public.dm_mark_read(uuid), public.dm_respond(uuid, boolean),
--     public.dm_send(uuid, text, uuid), public.dm_open(text), public._dm_card(uuid, uuid), public._dm_mutual(uuid, uuid),
--     public.is_dm_participant(uuid);
--   remettre _export_my_data_raw() comme dans 20261117000100 (return public._export_my_data_v29();) puis
--   drop function if exists public._export_my_data_dm();
--   drop table if exists public.dm_report_evidence, public.dm_messages, public.dm_participants, public.dm_conversations;
--   (la catégorie 'community_message' peut rester dans la contrainte : elle n'est plus utilisée)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------
create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'request' check (status in ('request', 'open', 'declined')),
  requested_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  last_message_at timestamptz,
  check (user_a < user_b),
  check (requested_by in (user_a, user_b)),
  unique (user_a, user_b)
);
create index if not exists dm_conversations_b_idx on public.dm_conversations(user_b);
create index if not exists dm_conversations_requested_idx on public.dm_conversations(requested_by, created_at desc);

-- Une ligne par participante : non-lus et dernier passage. C'est la table écoutée en temps réel (filtre user_id).
create table if not exists public.dm_participants (
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unread_count int not null default 0 check (unread_count >= 0),
  last_read_at timestamptz,
  last_message_at timestamptz,
  primary key (conversation_id, user_id)
);
create index if not exists dm_participants_user_idx on public.dm_participants(user_id, last_message_at desc);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  client_id uuid not null,
  created_at timestamptz not null default now(),
  unique (sender_id, client_id)
);
create index if not exists dm_messages_conversation_idx on public.dm_messages(conversation_id, created_at desc);
create index if not exists dm_messages_sender_idx on public.dm_messages(sender_id, created_at desc);

-- Pièces d'un signalement : lisibles par la modération uniquement
create table if not exists public.dm_report_evidence (
  report_id uuid primary key references public.reports(id) on delete cascade,
  conversation_id uuid references public.dm_conversations(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists dm_report_evidence_conversation_idx on public.dm_report_evidence(conversation_id);

-- ---------------------------------------------------------------------
-- 2. Droits : lecture par les deux participantes seulement, aucune écriture directe
-- ---------------------------------------------------------------------
create or replace function public.is_dm_participant(p_conversation uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dm_conversations c
                 where c.id = p_conversation and auth.uid() in (c.user_a, c.user_b));
$$;
revoke execute on function public.is_dm_participant(uuid) from public, anon;
grant execute on function public.is_dm_participant(uuid) to authenticated;

alter table public.dm_conversations enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;
alter table public.dm_report_evidence enable row level security;

revoke all on public.dm_conversations, public.dm_participants, public.dm_messages, public.dm_report_evidence from anon, authenticated;
-- « requested_by » et « declined_at » ne sont pas lisibles directement : un refus ne se devine pas
grant select (id, user_a, user_b, created_at, last_message_at) on public.dm_conversations to authenticated;
grant select on public.dm_participants, public.dm_messages to authenticated;
grant select on public.dm_report_evidence to authenticated;

drop policy if exists dm_conversations_read on public.dm_conversations;
create policy dm_conversations_read on public.dm_conversations for select to authenticated
  using (auth.uid() in (user_a, user_b));
drop policy if exists dm_participants_read on public.dm_participants;
create policy dm_participants_read on public.dm_participants for select to authenticated
  using (user_id = auth.uid());
drop policy if exists dm_messages_read on public.dm_messages;
create policy dm_messages_read on public.dm_messages for select to authenticated
  using (public.is_dm_participant(conversation_id));
drop policy if exists dm_report_evidence_mod on public.dm_report_evidence;
create policy dm_report_evidence_mod on public.dm_report_evidence for select to authenticated
  using (public.has_role('moderator'));
-- Aucune politique INSERT / UPDATE / DELETE : seules les fonctions « security definer » écrivent.

-- ---------------------------------------------------------------------
-- 3. Notifications : nouvelle catégorie (élargissement de la liste, sans relecture des lignes existantes)
-- ---------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_category_check;
alter table public.notifications add constraint notifications_category_check
  check (category in ('reminder','community_reply','community_comment','community_like','community_saved','community_moderation',
                      'community_follow','community_mention','community_group','community_message',
                      'assistant','subscription','product_recall','system','family')) not valid;

-- ---------------------------------------------------------------------
-- 4. Fonctions internes
-- ---------------------------------------------------------------------
create or replace function public._dm_mutual(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.member_follows where follower_id = a and followee_id = b)
     and exists (select 1 from public.member_follows where follower_id = b and followee_id = a);
$$;
revoke execute on function public._dm_mutual(uuid, uuid) from public, anon, authenticated;

-- Carte d'une conversation vue par p_me. null si elle ne doit pas apparaître (blocage, refus côté destinataire).
create or replace function public._dm_card(p_conversation uuid, p_me uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.dm_conversations; v_other uuid; v_p public.community_profiles; v_part public.dm_participants;
  v_last public.dm_messages; v_status text; v_blocked boolean; v_sent int;
begin
  select * into c from public.dm_conversations where id = p_conversation;
  if c.id is null or p_me not in (c.user_a, c.user_b) then return null; end if;
  v_other := case when c.user_a = p_me then c.user_b else c.user_a end;
  v_blocked := exists (select 1 from public.user_blocks where (blocker_id = p_me and blocked_id = v_other) or (blocker_id = v_other and blocked_id = p_me));
  if v_blocked then return null; end if;
  -- Refus : invisible pour celle qui a refusé ; « demande envoyée » pour l'autre (le refus n'est pas annoncé)
  if c.status = 'declined' and c.requested_by <> p_me then return null; end if;
  select * into v_p from public.community_profiles where user_id = v_other;
  if v_p.user_id is null then return null; end if;
  select * into v_part from public.dm_participants where conversation_id = c.id and user_id = p_me;
  select * into v_last from public.dm_messages where conversation_id = c.id order by created_at desc, id desc limit 1;
  v_status := case when c.status = 'open' then 'open' when c.requested_by = p_me then 'request_sent' else 'request_received' end;
  select count(*) into v_sent from public.dm_messages where conversation_id = c.id and sender_id = p_me;
  return jsonb_build_object(
    'id', c.id, 'status', v_status,
    'handle', v_p.handle, 'pseudonym', v_p.pseudonym, 'avatar_path', v_p.avatar_path, 'avatar_preset', v_p.avatar_preset,
    'last_body', left(v_last.body, 140), 'last_at', v_last.created_at, 'last_mine', v_last.sender_id = p_me,
    'unread', coalesce(v_part.unread_count, 0),
    'can_send', c.status = 'open' or (c.status = 'request' and c.requested_by <> p_me) or (c.status = 'request' and v_sent < 3)
                or (c.status = 'declined' and false),
    'request_left', case when c.status <> 'open' and c.requested_by = p_me then greatest(0, 3 - v_sent) else null end);
end $$;
revoke execute on function public._dm_card(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Ouvrir une conversation avec un membre (bouton « Écrire » du profil)
-- ---------------------------------------------------------------------
create or replace function public.dm_open(p_handle text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_target uuid; v_a uuid; v_b uuid; c public.dm_conversations; v_mine public.community_profiles; v_recent int;
begin
  if v_me is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into v_mine from public.community_profiles where user_id = v_me;
  if v_mine.user_id is null then raise exception 'Choisissez un pseudonyme avant d''écrire à un membre' using errcode = 'P0001', hint = 'pseudonym_required'; end if;
  if v_mine.suspended_until is not null and v_mine.suspended_until > now() then
    raise exception 'Votre compte communauté est suspendu jusqu''au %', to_char(v_mine.suspended_until, 'DD/MM/YYYY') using errcode = '42501';
  end if;
  select user_id into v_target from public.community_profiles where handle = lower(trim(leading '@' from trim(coalesce(p_handle, ''))));
  if v_target is null or v_target = v_me then raise exception 'Membre introuvable' using errcode = 'P0001'; end if;
  if exists (select 1 from public.user_blocks where (blocker_id = v_me and blocked_id = v_target) or (blocker_id = v_target and blocked_id = v_me)) then
    raise exception 'Vous ne pouvez pas écrire à ce membre' using errcode = '42501';
  end if;
  v_a := least(v_me, v_target); v_b := greatest(v_me, v_target);
  select * into c from public.dm_conversations where user_a = v_a and user_b = v_b;
  if c.id is not null then
    -- Celle qui avait refusé peut rouvrir la conversation en écrivant elle-même
    if c.status = 'declined' and c.requested_by <> v_me then
      update public.dm_conversations set status = 'open', accepted_at = now(), declined_at = null where id = c.id;
    elsif c.status = 'request' and public._dm_mutual(v_me, v_target) then
      update public.dm_conversations set status = 'open', accepted_at = now() where id = c.id;
    end if;
    return c.id;
  end if;
  if not public._dm_mutual(v_me, v_target) then
    select count(*) into v_recent from public.dm_conversations where requested_by = v_me and status <> 'open' and created_at > now() - interval '24 hours';
    if v_recent >= 10 then raise exception 'Trop de demandes de message aujourd''hui, réessayez demain' using errcode = 'P0001', hint = 'rate_limited'; end if;
  end if;
  insert into public.dm_conversations (user_a, user_b, status, requested_by, accepted_at)
    values (v_a, v_b, case when public._dm_mutual(v_me, v_target) then 'open' else 'request' end, v_me,
            case when public._dm_mutual(v_me, v_target) then now() else null end)
    returning * into c;
  insert into public.dm_participants (conversation_id, user_id) values (c.id, v_a), (c.id, v_b);
  return c.id;
end $$;

-- ---------------------------------------------------------------------
-- 6. Envoyer un message (idempotent : un même p_client_id renvoyé deux fois ne crée qu'un message)
-- ---------------------------------------------------------------------
create or replace function public.dm_send(p_conversation uuid, p_body text, p_client_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); c public.dm_conversations; v_other uuid; v_body text := btrim(coalesce(p_body, ''));
  v_mine public.community_profiles; m public.dm_messages; v_recent int; v_sent int; v_unread int; v_review boolean; v_first boolean;
begin
  if v_me is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_client_id is null then raise exception 'Message invalide' using errcode = '22023'; end if;
  select * into m from public.dm_messages where sender_id = v_me and client_id = p_client_id;
  if m.id is not null then
    return jsonb_build_object('id', m.id, 'body', m.body, 'mine', true, 'created_at', m.created_at, 'client_id', m.client_id);
  end if;
  select * into c from public.dm_conversations where id = p_conversation for update;
  if c.id is null or v_me not in (c.user_a, c.user_b) then raise exception 'Conversation introuvable' using errcode = '42501'; end if;
  v_other := case when c.user_a = v_me then c.user_b else c.user_a end;
  select * into v_mine from public.community_profiles where user_id = v_me;
  if v_mine.user_id is null then raise exception 'Choisissez un pseudonyme avant d''écrire à un membre' using errcode = 'P0001', hint = 'pseudonym_required'; end if;
  if v_mine.suspended_until is not null and v_mine.suspended_until > now() then
    raise exception 'Votre compte communauté est suspendu jusqu''au %', to_char(v_mine.suspended_until, 'DD/MM/YYYY') using errcode = '42501';
  end if;
  -- Même message, que l'autre ait bloqué, refusé ou supprimé son profil : rien ne se devine
  if exists (select 1 from public.user_blocks where (blocker_id = v_me and blocked_id = v_other) or (blocker_id = v_other and blocked_id = v_me))
     or not exists (select 1 from public.community_profiles where user_id = v_other)
     or (c.status = 'declined' and c.requested_by = v_me) then
    raise exception 'Vous ne pouvez pas écrire à ce membre' using errcode = '42501', hint = 'dm_closed';
  end if;
  if char_length(v_body) < 1 then raise exception 'Écrivez un message' using errcode = '22023'; end if;
  if char_length(v_body) > 2000 then raise exception 'Message trop long (2 000 caractères au plus)' using errcode = '22023'; end if;
  -- Débit
  select count(*) into v_recent from public.dm_messages where sender_id = v_me and created_at > now() - interval '1 minute';
  if v_recent >= 20 then raise exception 'Trop de messages en peu de temps, réessayez dans un instant' using errcode = 'P0001', hint = 'rate_limited'; end if;
  select count(*) into v_recent from public.dm_messages where sender_id = v_me and created_at > now() - interval '1 day';
  if v_recent >= 500 then raise exception 'Trop de messages aujourd''hui, réessayez demain' using errcode = 'P0001', hint = 'rate_limited'; end if;
  -- Termes interdits par la modération : erreur (levée par la fonction existante)
  v_review := public.community_text_needs_review(v_body);

  if c.status = 'declined' then
    -- celle qui avait refusé écrit : la conversation s'ouvre
    update public.dm_conversations set status = 'open', accepted_at = now(), declined_at = null where id = c.id;
    c.status := 'open';
  elsif c.status = 'request' then
    if c.requested_by <> v_me or public._dm_mutual(v_me, v_other) then
      -- répondre à une demande l'accepte ; un suivi devenu mutuel ouvre la conversation
      update public.dm_conversations set status = 'open', accepted_at = now() where id = c.id;
      c.status := 'open';
    else
      select count(*) into v_sent from public.dm_messages where conversation_id = c.id and sender_id = v_me;
      if v_sent >= 3 then
        raise exception 'Attendez que ce membre accepte votre demande avant d''envoyer d''autres messages' using errcode = 'P0001', hint = 'request_pending';
      end if;
      if v_review then
        raise exception 'Dans une première demande, n''envoyez ni coordonnées ni liens' using errcode = 'P0001', hint = 'request_contact';
      end if;
    end if;
  end if;

  v_first := not exists (select 1 from public.dm_messages where conversation_id = c.id);
  insert into public.dm_messages (conversation_id, sender_id, body, client_id) values (c.id, v_me, v_body, p_client_id) returning * into m;
  update public.dm_conversations set last_message_at = m.created_at where id = c.id;
  select unread_count into v_unread from public.dm_participants where conversation_id = c.id and user_id = v_other;
  insert into public.dm_participants (conversation_id, user_id, unread_count, last_read_at, last_message_at)
    values (c.id, v_me, 0, m.created_at, m.created_at), (c.id, v_other, 1, null, m.created_at)
    on conflict (conversation_id, user_id) do update set
      last_message_at = excluded.last_message_at,
      unread_count = case when public.dm_participants.user_id = v_me then 0 else public.dm_participants.unread_count + 1 end,
      last_read_at = case when public.dm_participants.user_id = v_me then excluded.last_message_at else public.dm_participants.last_read_at end;
  -- Une notification par série de messages non lus, SANS le texte du message
  if coalesce(v_unread, 0) = 0 then
    perform public.community_notify(v_other, 'private_message', 'community_message',
      case when c.status = 'open' then 'Vous avez un nouveau message privé' else 'Vous avez une demande de message' end,
      null, '/community/messages/' || c.id::text, jsonb_build_object('conversation_id', c.id, 'request', c.status <> 'open'));
  end if;
  return jsonb_build_object('id', m.id, 'body', m.body, 'mine', true, 'created_at', m.created_at, 'client_id', m.client_id);
end $$;

-- ---------------------------------------------------------------------
-- 7. Accepter ou refuser une demande ; marquer comme lu
-- ---------------------------------------------------------------------
create or replace function public.dm_respond(p_conversation uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); c public.dm_conversations;
begin
  select * into c from public.dm_conversations where id = p_conversation for update;
  if c.id is null or v_me is null or v_me not in (c.user_a, c.user_b) then raise exception 'Conversation introuvable' using errcode = '42501'; end if;
  if c.requested_by = v_me then raise exception 'Seule la destinataire peut répondre à une demande' using errcode = '42501'; end if;
  if c.status <> 'request' then return; end if;
  if p_accept then
    update public.dm_conversations set status = 'open', accepted_at = now() where id = c.id;
  else
    update public.dm_conversations set status = 'declined', declined_at = now() where id = c.id;
  end if;
  update public.dm_participants set unread_count = 0, last_read_at = now() where conversation_id = c.id and user_id = v_me;
end $$;

create or replace function public.dm_mark_read(p_conversation uuid)
returns void language sql security definer set search_path = public as $$
  update public.dm_participants set unread_count = 0, last_read_at = now()
   where conversation_id = p_conversation and user_id = auth.uid() and unread_count > 0;
$$;

-- ---------------------------------------------------------------------
-- 8. Lecture : boîte de réception, en-tête d'une conversation, messages, compteur
-- ---------------------------------------------------------------------
create or replace function public.dm_inbox()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(card order by (card ->> 'last_at') desc), '[]'::jsonb)
  from (select public._dm_card(p.conversation_id, auth.uid()) as card
        from public.dm_participants p where p.user_id = auth.uid() and p.last_message_at is not null) x
  where card is not null;
$$;

create or replace function public.dm_conversation(p_conversation uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select public._dm_card(p_conversation, auth.uid());
$$;

create or replace function public.dm_messages_list(p_conversation uuid, p_before timestamptz default null, p_limit int default 50)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  -- mêmes conditions que la carte : ni étrangère, ni bloquée, ni refusée par moi
  if public._dm_card(p_conversation, v_me) is null then return '[]'::jsonb; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'body', body, 'mine', sender_id = v_me, 'created_at', created_at, 'client_id', client_id)
                                    order by created_at, id), '[]'::jsonb)
          from (select * from public.dm_messages where conversation_id = p_conversation and (p_before is null or created_at < p_before)
                order by created_at desc, id desc limit least(greatest(coalesce(p_limit, 50), 1), 100)) m);
end $$;

create or replace function public.dm_unread()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'messages', coalesce(sum((card ->> 'unread')::int) filter (where card ->> 'status' = 'open'), 0),
    'requests', count(*) filter (where card ->> 'status' = 'request_received'))
  from (select public._dm_card(p.conversation_id, auth.uid()) as card
        from public.dm_participants p where p.user_id = auth.uid() and p.last_message_at is not null) x
  where card is not null;
$$;

-- ---------------------------------------------------------------------
-- 9. Signaler une conversation : file de modération existante + pièces réservées à la modération
-- ---------------------------------------------------------------------
create or replace function public.dm_report(p_conversation uuid, p_reason text, p_details text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); c public.dm_conversations; v_other uuid; v_report uuid;
begin
  select * into c from public.dm_conversations where id = p_conversation;
  if c.id is null or v_me is null or v_me not in (c.user_a, c.user_b) then raise exception 'Conversation introuvable' using errcode = '42501'; end if;
  v_other := case when c.user_a = v_me then c.user_b else c.user_a end;
  if exists (select 1 from public.reports where reporter_id = v_me and reported_user = v_other and status = 'open') then
    raise exception 'Vous avez déjà signalé ce membre' using errcode = 'P0001';
  end if;
  insert into public.reports (reporter_id, reported_user, reason, details)
    values (v_me, v_other, p_reason, nullif(trim(coalesce(p_details, '')), '')) returning id into v_report;
  -- Seuls les messages de la personne signalée, dans cette conversation (20 derniers)
  insert into public.dm_report_evidence (report_id, conversation_id, messages)
    select v_report, c.id, coalesce(jsonb_agg(jsonb_build_object('body', body, 'created_at', created_at) order by created_at), '[]'::jsonb)
    from (select body, created_at from public.dm_messages where conversation_id = c.id and sender_id = v_other order by created_at desc limit 20) m;
end $$;

revoke execute on function public.dm_open(text), public.dm_send(uuid, text, uuid), public.dm_respond(uuid, boolean), public.dm_mark_read(uuid),
  public.dm_inbox(), public.dm_conversation(uuid), public.dm_messages_list(uuid, timestamptz, int), public.dm_unread(), public.dm_report(uuid, text, text)
  from public, anon;
grant execute on function public.dm_open(text), public.dm_send(uuid, text, uuid), public.dm_respond(uuid, boolean), public.dm_mark_read(uuid),
  public.dm_inbox(), public.dm_conversation(uuid), public.dm_messages_list(uuid, timestamptz, int), public.dm_unread(), public.dm_report(uuid, text, text)
  to authenticated;

-- ---------------------------------------------------------------------
-- 10. Export RGPD (« Exporter mes données ») : mes conversations et les messages que J'AI écrits.
--     Les messages reçus sont les données de l'autre personne : ils ne sont pas exportés.
--     _export_my_data_raw() est remplacée à l'identique, avec une clé de plus (aucune clé existante ne change).
-- ---------------------------------------------------------------------
create or replace function public._export_my_data_dm()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'conversations', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'with', cp.handle, 'created_at', c.created_at, 'last_message_at', c.last_message_at,
        'unread_count', p.unread_count, 'last_read_at', p.last_read_at) order by c.created_at), '[]'::jsonb)
      from public.dm_participants p join public.dm_conversations c on c.id = p.conversation_id
      left join public.community_profiles cp on cp.user_id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
      where p.user_id = auth.uid() and not (c.status = 'declined' and c.requested_by <> auth.uid())),
    'messages_sent', (select coalesce(jsonb_agg(jsonb_build_object('conversation_id', m.conversation_id, 'body', m.body, 'created_at', m.created_at) order by m.created_at), '[]'::jsonb)
      from public.dm_messages m where m.sender_id = auth.uid()));
$$;
revoke execute on function public._export_my_data_dm() from public, anon, authenticated;

create or replace function public._export_my_data_raw()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('homi.export_filter', true), '') <> 'on' then
    raise exception 'Export : utilisez export_my_data().' using errcode = '42501';
  end if;
  return public._export_my_data_v29() || jsonb_build_object('private_messages', public._export_my_data_dm());
end $$;
revoke execute on function public._export_my_data_raw() from public, anon;
grant execute on function public._export_my_data_raw() to authenticated;

-- ---------------------------------------------------------------------
-- 11. Temps réel : seule la ligne « participante » est publiée (filtrée par user_id côté client, RLS côté serveur).
--     Le texte des messages ne transite donc pas par le canal temps réel.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dm_participants') then
    alter publication supabase_realtime add table public.dm_participants;
  end if;
end $$;
