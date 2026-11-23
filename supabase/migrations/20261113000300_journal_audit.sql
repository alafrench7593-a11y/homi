-- =====================================================================
-- Fondations du foyer (13/11/2026) — C. Journal d'audit commun du foyer
--
-- Un seul journal, en AJOUT SEUL, pour les tables sensibles : qui (actor_id, NULL = serveur), quand,
-- quoi (table, ligne, action), avant / après RÉSUMÉS (colonnes modifiées seulement, textes tronqués,
-- empreintes et chemins de fichiers jamais copiés), et le foyer.
--   * Alimenté uniquement par déclencheurs (fonction security definer _audit_row) ; aucun client ne peut
--     écrire, modifier ni effacer une entrée (privilèges retirés + déclencheur qui refuse UPDATE, DELETE
--     direct et TRUNCATE, même pour le rôle serveur). Seule la suppression du FOYER (cascade) efface son
--     journal (droit à l'effacement : un foyer supprimé ne laisse rien).
--   * Lecture : propriétaire et co-parents du foyer, selon leurs droits (domaine de la table) ; jamais une
--     nounou ; jamais un autre foyer ; plus rien après un retrait du foyer.
--   * Tables suivies dès maintenant : household_members (droits, rôle, enfants autorisés), household_invitations,
--     documents, document_shares, family_tasks, care_requests. Les futurs modules (pointages, contrats…)
--     s'y branchent par : select public._attach_audit('<table>', '<domaine>');
--
-- Retour arrière : drop table public.household_audit_log cascade; drop function public._audit_row() cascade;
--   drop function public._attach_audit(text, text); drop function public._audit_summary(jsonb);
--   drop function public._audit_guard(); drop function public._audit_readable(uuid, text);
-- =====================================================================

create table if not exists public.household_audit_log (
  id bigint generated always as identity primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  actor_id uuid,                                   -- pas de clé étrangère : l'entrée survit au départ de la personne
  origin text not null check (origin in ('client', 'server')),
  table_name text not null,
  domain text not null,                            -- domaine de droits utilisé pour la lecture
  row_id text,
  action text not null check (action in ('insert', 'update', 'delete')),
  before jsonb,
  after jsonb
);
create index if not exists household_audit_log_household_idx on public.household_audit_log(household_id, occurred_at desc);
create index if not exists household_audit_log_row_idx on public.household_audit_log(table_name, row_id);

-- Résumé d'une ligne : sans empreintes, chemins de fichiers ni horodatages techniques ; textes tronqués
create or replace function public._audit_summary(p jsonb)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_object_agg(key,
           case when jsonb_typeof(value) = 'string' and char_length(value #>> '{}') > 120
                then to_jsonb(left(value #>> '{}', 119) || '…') else value end), '{}'::jsonb)
  from jsonb_each(coalesce(p, '{}'::jsonb))
  where key not in ('token_hash', 'storage_path', 'updated_at', 'created_at', 'version', 'search_vector')
    and key !~ '(_hash|_token|_secret)$';
$$;

create or replace function public._audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_old jsonb; v_new jsonb; v_h uuid; v_before jsonb; v_after jsonb; v_row text; v_uid uuid := auth.uid();
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  v_h := coalesce(nullif(v_new ->> 'household_id', ''), nullif(v_old ->> 'household_id', ''))::uuid;
  -- Foyer en cours de suppression (cascade) : rien à journaliser, le journal part avec le foyer
  if v_h is null or not exists (select 1 from public.households where id = v_h) then return null; end if;
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(e.key, v_old -> e.key), jsonb_object_agg(e.key, e.value)
      into v_before, v_after
      from jsonb_each(v_new) e where (v_old -> e.key) is distinct from e.value;
    v_before := public._audit_summary(v_before);
    v_after := public._audit_summary(v_after);
    if v_after = '{}'::jsonb and v_before = '{}'::jsonb then return null; end if; -- seuls des champs techniques ont changé
  elsif tg_op = 'INSERT' then
    v_after := public._audit_summary(v_new);
  else
    v_before := public._audit_summary(v_old);
  end if;
  v_row := coalesce(v_new ->> 'id', v_old ->> 'id',
                    (coalesce(v_new, v_old) ->> 'document_id') || ':' || (coalesce(v_new, v_old) ->> 'user_id'),
                    coalesce(v_new, v_old) ->> 'user_id');
  insert into public.household_audit_log (household_id, actor_id, origin, table_name, domain, row_id, action, before, after)
  values (v_h, v_uid, case when v_uid is null then 'server' else 'client' end, tg_table_name, tg_argv[0], v_row, lower(tg_op), v_before, v_after);
  return null;
end $$;
revoke execute on function public._audit_row() from public, anon, authenticated;

-- Branchement d'une table sur le journal (réservé aux migrations)
create or replace function public._attach_audit(p_table text, p_domain text)
returns void language plpgsql as $$
begin
  execute format('drop trigger if exists %I on public.%I', p_table || '_audit', p_table);
  execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public._audit_row(%L)',
                 p_table || '_audit', p_table, p_domain);
end $$;
revoke execute on function public._attach_audit(text, text) from public, anon, authenticated;

-- Ajout seul : ni modification, ni effacement direct, ni vidage (même par le serveur)
create or replace function public._audit_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then return old; end if; -- cascade de la suppression du foyer
  raise exception 'Journal d''audit : ajout seul (% interdit)', tg_op using errcode = '42501';
end $$;
drop trigger if exists household_audit_log_guard on public.household_audit_log;
create trigger household_audit_log_guard before update or delete on public.household_audit_log
  for each row execute function public._audit_guard();
drop trigger if exists household_audit_log_no_truncate on public.household_audit_log;
create trigger household_audit_log_no_truncate before truncate on public.household_audit_log
  for each statement execute function public._audit_guard();

-- Lecture : propriétaire et co-parents selon leurs droits ; « household » = membres et invitations
create or replace function public._audit_readable(p_household uuid, p_domain text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = p_household and m.user_id = auth.uid()
      and (m.role = 'owner' or (m.role = 'coparent' and (p_domain = 'household' or p_domain = any(m.can_view)))));
$$;
revoke execute on function public._audit_readable(uuid, text) from public, anon;
grant execute on function public._audit_readable(uuid, text) to authenticated;

alter table public.household_audit_log enable row level security;
drop policy if exists household_audit_log_sel on public.household_audit_log;
create policy household_audit_log_sel on public.household_audit_log for select to authenticated
  using (public._audit_readable(household_id, domain));
revoke insert, update, delete, truncate on public.household_audit_log from anon, authenticated;
grant select on public.household_audit_log to authenticated;

select public._attach_audit('household_members', 'household');
select public._attach_audit('household_invitations', 'household');
select public._attach_audit('documents', 'documents');
select public._attach_audit('document_shares', 'documents');
select public._attach_audit('family_tasks', 'lists');
select public._attach_audit('care_requests', 'lists');
