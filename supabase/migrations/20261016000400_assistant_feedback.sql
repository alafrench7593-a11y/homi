-- =====================================================================
-- Toi & Moi — Assistant IA : retours « Utile / Pas utile », réponses
-- structurées, consentement au contexte par conversation, état du quota
-- =====================================================================

-- Consentement à l'utilisation du contexte, mémorisé PAR conversation
alter table public.assistant_conversations
  add column if not exists context_enabled boolean not null default false;

-- Réponse structurée (sections) et niveau de sécurité de chaque réponse
alter table public.assistant_messages
  add column if not exists structured jsonb,
  add column if not exists safety_level text not null default 'none'
    check (safety_level in ('none','medical_urgent','crisis'));

-- ---------------------------------------------------------------------
-- Retours sur les réponses : un seul retour par personne et par réponse
-- ---------------------------------------------------------------------
create table public.assistant_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.assistant_messages(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, message_id)
);
create index assistant_feedback_message_idx on public.assistant_feedback(message_id);
create trigger assistant_feedback_touch before update on public.assistant_feedback
  for each row execute function public.touch_updated_at();

alter table public.assistant_feedback enable row level security;
-- Propriétaire uniquement, et seulement sur SES réponses d'assistant
create policy feedback_owner_sel on public.assistant_feedback for select to authenticated
  using (user_id = auth.uid());
create policy feedback_owner_ins on public.assistant_feedback for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.assistant_messages m
                where m.id = message_id and m.user_id = auth.uid() and m.role = 'assistant')
  );
create policy feedback_owner_upd on public.assistant_feedback for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.assistant_messages m
                where m.id = message_id and m.user_id = auth.uid() and m.role = 'assistant')
  );
create policy feedback_owner_del on public.assistant_feedback for delete to authenticated
  using (user_id = auth.uid());
revoke all on public.assistant_feedback from anon;

-- Recopie du dernier retour sur le message (affichage de l'historique, export RGPD)
create or replace function public.sync_assistant_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    update public.assistant_messages set feedback = null where id = old.message_id and user_id = old.user_id;
    return old;
  end if;
  update public.assistant_messages set feedback = new.value where id = new.message_id and user_id = new.user_id;
  return new;
end $$;
revoke execute on function public.sync_assistant_feedback() from public, anon, authenticated;
create trigger assistant_feedback_sync after insert or update or delete on public.assistant_feedback
  for each row execute function public.sync_assistant_feedback();

-- Le retour passe désormais par assistant_feedback : le client ne modifie plus
-- directement la colonne feedback (seulement l'enregistrement en favori).
revoke update on public.assistant_messages from authenticated;
grant update (saved) on public.assistant_messages to authenticated;

-- ---------------------------------------------------------------------
-- Quota : consultation par l'application, remboursement par le serveur
-- ---------------------------------------------------------------------
create or replace function public.assistant_quota_status()
returns table(used int, quota int, remaining int)
language sql stable security definer set search_path = public as $$
  select u.used, q.quota, greatest(q.quota - u.used, 0)
  from (select coalesce((select questions from public.assistant_usage
                         where user_id = auth.uid() and month = date_trunc('month', now())::date), 0) as used) u,
       (select public.plan_limit('assistant_questions_per_month', auth.uid()) as quota) q
  where auth.uid() is not null;
$$;
revoke execute on function public.assistant_quota_status() from public, anon;
grant execute on function public.assistant_quota_status() to authenticated;

-- Rend une question si le service d'IA a échoué (appelée par la fonction backend)
create or replace function public.refund_assistant_quota(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update public.assistant_usage set questions = questions - 1
  where user_id = p_user and month = date_trunc('month', now())::date and questions > 0;
$$;
revoke execute on function public.refund_assistant_quota(uuid) from public, anon, authenticated;
