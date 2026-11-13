-- =====================================================================
-- Fondations du foyer (13/11/2026) — E. Hors ligne sans doublon et détection des conflits d'édition
--
-- 1. client_id (uuid généré sur l'appareil) sur family_tasks, care_requests, shopping_items, UNIQUE PAR FOYER
--    (contrainte unique (household_id, client_id)) : la file hors ligne renvoie la même saisie autant de fois
--    que nécessaire (« on conflict (household_id, client_id) do nothing ») sans jamais créer de doublon.
--    Le client_id est figé après création.
-- 2. version (entier, +1 à chaque modification, posé par le serveur) et updated_at sur ces trois tables.
-- 3. update_if_version(table, id, version_attendue, modifications) : mise à jour CONDITIONNELLE. Elle n'écrit
--    que si la ligne est encore à la version que l'appareil a lue ; sinon elle renvoie « conflict » avec la
--    ligne actuelle (l'application montre les deux versions, rien n'est écrasé en silence). Fonction
--    « security invoker » : la RLS et tous les déclencheurs métier s'appliquent comme pour un update direct.
--    Colonnes modifiables : liste blanche par table (jamais household_id, client_id, version, auteurs…).
-- Stratégie complète : HOMI_SYNC_ARCHITECTURE.md (§ Conflits).
--
-- Retour arrière : drop function public.update_if_version(text, uuid, int, jsonb);
--   drop trigger <t>_version on public.<t>; alter table public.<t> drop constraint <t>_client_uniq,
--   drop column client_id, drop column version; (updated_at de care_requests / shopping_items peut rester)
-- =====================================================================

alter table public.family_tasks add column if not exists client_id uuid;
alter table public.family_tasks add column if not exists version integer not null default 1;
alter table public.care_requests add column if not exists client_id uuid;
alter table public.care_requests add column if not exists version integer not null default 1;
alter table public.care_requests add column if not exists updated_at timestamptz not null default now();
alter table public.shopping_items add column if not exists client_id uuid;
alter table public.shopping_items add column if not exists version integer not null default 1;
alter table public.shopping_items add column if not exists updated_at timestamptz not null default now();

do $$
declare t text;
begin
  foreach t in array array['family_tasks', 'care_requests', 'shopping_items'] loop
    if not exists (select 1 from pg_constraint where conname = t || '_client_uniq') then
      execute format('alter table public.%I add constraint %I unique (household_id, client_id)', t, t || '_client_uniq');
    end if;
  end loop;
end $$;

-- Version posée par le serveur (jamais par l'appareil) ; client_id figé
create or replace function public._bump_version()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
  else
    new.client_id := old.client_id;
    new.version := old.version + 1;
    new.updated_at := now();
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['family_tasks', 'care_requests', 'shopping_items'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_version', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public._bump_version()', t || '_version', t);
  end loop;
end $$;

create or replace function public.update_if_version(p_table text, p_id uuid, p_expected_version integer, p_patch jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_allowed text[];
  v_keys text[];
  v_set text;
  v_row jsonb;
begin
  v_allowed := case p_table
    when 'family_tasks' then array['title', 'category', 'due_at', 'assignee_id', 'priority', 'essential', 'recurrence', 'status', 'notes']
    when 'care_requests' then array['status', 'message', 'starts_at', 'ends_at']
    when 'shopping_items' then array['label', 'qty', 'unit', 'aisle', 'at_home', 'checked', 'position']
  end;
  if v_allowed is null then raise exception 'Table non prise en charge : %', p_table using errcode = '22023'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then
    raise exception 'Aucune modification' using errcode = '22023';
  end if;
  select array_agg(k order by k) into v_keys from jsonb_object_keys(p_patch) k;
  if not (v_keys <@ v_allowed) then
    raise exception 'Champ non modifiable : %', array_to_string(array(select unnest(v_keys) except select unnest(v_allowed)), ', ') using errcode = '22023';
  end if;
  select string_agg(format('%I = r.%I', k, k), ', ') into v_set from unnest(v_keys) k;

  execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I, $1) r where t.id = $2 and t.version = $3 returning to_jsonb(t.*)',
                 p_table, v_set, p_table)
    using p_patch, p_id, p_expected_version into v_row;
  if v_row is not null then return jsonb_build_object('status', 'ok', 'row', v_row); end if;

  execute format('select to_jsonb(t.*) from public.%I t where t.id = $1', p_table) using p_id into v_row;
  if v_row is null then return jsonb_build_object('status', 'not_found'); end if;              -- absente ou invisible : rien n'est révélé
  if (v_row ->> 'version')::int = p_expected_version then
    return jsonb_build_object('status', 'forbidden');                                         -- visible mais non modifiable
  end if;
  return jsonb_build_object('status', 'conflict', 'row', v_row);                               -- modifiée entre-temps
end $$;
revoke execute on function public.update_if_version(text, uuid, integer, jsonb) from public, anon;
grant execute on function public.update_if_version(text, uuid, integer, jsonb) to authenticated;
