-- =====================================================================
-- Courses et stocks (15/11/2026, phase 6) — HOMI_SHOPPING_STOCKS_SPEC.md
--
-- 1. Liste de courses partagée (shopping_items, existante, COMPLÉTÉE — pas de seconde table) : marque, taille,
--    catégorie, responsable, photo (= document du foyer, sous ses propres droits, comme la pièce jointe d'une
--    mission), auteur et date d'ajout, lien vers un stock ; unités « du quotidien » (paquet, boîte…). Auteur de la
--    coche posé par le serveur. Journal d'audit branché (_attach_audit). Publication temps réel : shopping_lists,
--    shopping_items et household_stocks rejoignent supabase_realtime. Fusion de doublons : merge_shopping_items()
--    (les liens mission / stock de l'article fusionné sont repris, rien n'est perdu).
-- 2. Inventaire du foyer (household_stocks, NOUVELLE source de vérité ; le garde-manger local de l'appareil y est
--    migré à la première synchronisation, sans perte ni doublon : client_id déterministe + index unique sur
--    l'ingrédient). Quantité ESTIMÉE saisie par la famille (NULL = non renseignée, jamais inventée), seuil, fréquence,
--    responsable, rappel, enfant (périmètre nounou appliqué) et animal (pet_id sans clé étrangère, module à venir).
--    RLS foyer (domaine « lists »), client_id / version / update_if_version, audit, Premium strict (exemption nounou).
-- 3. Réapprovisionnement, tout par household_events (aucun déclencheur ad hoc entre modules) :
--      seuil atteint → stock.low → consommateur : état « suggested » + notification neutre au responsable
--      (AUCUNE mission créée) → stock_restock('confirm') par un membre autorisé → create_mission() (responsable
--      du domaine par défaut, client_id déterministe : rejouer = même mission) + stock.restock_confirmed →
--      consommateur : mission ↔ stock reliés (« ordered ») → mission acceptée → article de courses lié au stock
--      (mécanisme mission → courses existant, sans doublon) → article coché → shopping.item_checked → consommateur :
--      stock « bought » (quantité INCHANGÉE) → stock_validate_purchase() : quantité mise à jour sur validation
--      EXPLICITE, stock.purchase_confirmed publié pour le futur module Budget (laissé « pending » : son consommateur
--      n'existe pas encore ; aucun montant).
-- 4. Boucle manquante fermée : article coché → shopping.item_checked → la mission liée passe « Terminée » SEULEMENT
--    si c'est son destinataire qui coche (mission_respond, mêmes règles) ; sinon il reçoit une proposition neutre, rien
--    n'est forcé. Anti-boucle : mission terminée → article coché → shopping.item_checked (profondeur 1) → la mission est
--    déjà terminée, rien ne se rejoue ; le répartiteur restaure le contexte de l'événement parent.
--
-- Tests : supabase/tests/sql/98s_courses_stocks.sql
-- Retour arrière : drop function public.stock_restock, public.stock_validate_purchase, public.merge_shopping_items,
--   public._consume_stock_event, public._stock_rpc_active, public._stock_match, public._norm_label,
--   public.household_stocks_guard, public.household_stocks_emit_events, public.shopping_items_guard,
--   public.shopping_items_emit_events, public.family_tasks_stock_guard; drop table public.household_stocks;
--   alter table public.shopping_items drop column brand, size, category, assignee_id, stock_id, document_id, created_by,
--   created_at; alter table public.family_tasks drop column stock_id; recréer _consume_mission_event,
--   _dispatch_household_event, process_household_events depuis 20261114000300, update_if_version depuis
--   20261113000500, export_my_data : alter function public._export_my_data_v28() rename to export_my_data.
-- =====================================================================

-- ---------------------------------------------------------------- utilitaires
create or replace function public._norm_label(p text)
returns text language sql immutable as $$
  select lower(btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')));
$$;

create or replace function public._stock_rpc_active()
returns boolean language sql stable as $$
  select coalesce(current_setting('homi.stock_action', true), '') = 'on';
$$;

-- ---------------------------------------------------------------- 2. inventaire du foyer
create table if not exists public.household_stocks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 80),
  category text not null default 'other'
    check (category in ('diapers', 'wipes', 'milk', 'laundry', 'toilet_paper', 'cleaning', 'pet_food', 'food', 'other')),
  brand text check (char_length(btrim(brand)) between 1 and 60),
  size text check (char_length(btrim(size)) between 1 and 40),
  qty_estimate numeric(10,2) check (qty_estimate >= 0 and qty_estimate <= 100000),     -- NULL = non renseignée
  unit text check (unit in ('u', 'paquet', 'boite', 'bouteille', 'rouleau', 'sac', 'kg', 'l', 'g', 'ml')),
  threshold numeric(10,2) check (threshold >= 0 and threshold <= 100000),                -- NULL = pas de seuil
  frequency_days smallint check (frequency_days between 1 and 365),
  responsible_id uuid references auth.users(id) on delete set null,
  reminder boolean not null default true,
  child_id uuid references public.children(id) on delete set null,
  pet_id uuid,                                                                            -- module animaux à venir (pas de clé étrangère)
  ingredient_key text check (ingredient_key ~ '^[a-z0-9_]{1,60}$'),                       -- garde-manger migré
  source text not null default 'manual' check (source in ('manual', 'pantry')),
  notes text check (char_length(notes) <= 300),
  -- posés par le serveur seulement
  restock_state text not null default 'ok' check (restock_state in ('ok', 'suggested', 'dismissed', 'ordered', 'bought')),
  low_since timestamptz,
  restock_task_id uuid references public.family_tasks(id) on delete set null,
  restock_item_id uuid references public.shopping_items(id) on delete set null,
  last_purchase_at timestamptz,
  last_validated_by uuid references auth.users(id) on delete set null,
  client_id uuid,
  version integer not null default 1,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_stocks_client_uniq unique (household_id, client_id)
);
create index if not exists household_stocks_household_idx on public.household_stocks(household_id, category);
create unique index if not exists household_stocks_ingredient_uniq on public.household_stocks(household_id, ingredient_key) where ingredient_key is not null;
create index if not exists household_stocks_responsible_idx on public.household_stocks(responsible_id);
create index if not exists household_stocks_child_idx on public.household_stocks(child_id);
create index if not exists household_stocks_task_idx on public.household_stocks(restock_task_id);
create index if not exists household_stocks_item_idx on public.household_stocks(restock_item_id);
create index if not exists household_stocks_validated_by_idx on public.household_stocks(last_validated_by);
create index if not exists household_stocks_created_by_idx on public.household_stocks(created_by);

select public._apply_household_policies('household_stocks', 'lists');
-- Périmètre nounou : un stock lié à un enfant non confié est invisible et non modifiable
drop policy if exists household_stocks_child_scope on public.household_stocks;
create policy household_stocks_child_scope on public.household_stocks as restrictive for all to authenticated
  using (child_id is null or public.can_access_child(child_id)) with check (child_id is null or public.can_access_child(child_id));
grant select, insert, update, delete on public.household_stocks to authenticated;

drop trigger if exists household_stocks_version on public.household_stocks;
create trigger household_stocks_version before insert or update on public.household_stocks
  for each row execute function public._bump_version();
drop trigger if exists household_stocks_premium_write on public.household_stocks;
create trigger household_stocks_premium_write before insert or update on public.household_stocks
  for each row execute function public._require_premium_write('premium');

-- ---------------------------------------------------------------- 1. liste de courses complétée
alter table public.shopping_items add column if not exists brand text check (char_length(btrim(brand)) between 1 and 60);
alter table public.shopping_items add column if not exists size text check (char_length(btrim(size)) between 1 and 40);
alter table public.shopping_items add column if not exists category text
  check (category in ('diapers', 'wipes', 'milk', 'laundry', 'toilet_paper', 'cleaning', 'pet_food', 'food', 'other'));
alter table public.shopping_items add column if not exists assignee_id uuid references auth.users(id) on delete set null;
alter table public.shopping_items add column if not exists stock_id uuid references public.household_stocks(id) on delete set null;
alter table public.shopping_items add column if not exists document_id uuid references public.documents(id) on delete set null;
alter table public.shopping_items add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
alter table public.shopping_items add column if not exists created_at timestamptz not null default now();
alter table public.shopping_items drop constraint if exists shopping_items_unit_check;
alter table public.shopping_items add constraint shopping_items_unit_check
  check (unit in ('g', 'ml', 'u', 'cs', 'cc', 'pincee', 'paquet', 'boite', 'bouteille', 'rouleau', 'sac', 'kg', 'l'));
create index if not exists shopping_items_assignee_idx on public.shopping_items(assignee_id);
create index if not exists shopping_items_stock_idx on public.shopping_items(stock_id);
create index if not exists shopping_items_document_idx on public.shopping_items(document_id);
create index if not exists shopping_items_created_by_idx on public.shopping_items(created_by);

alter table public.family_tasks add column if not exists stock_id uuid references public.household_stocks(id) on delete set null;
create index if not exists family_tasks_stock_idx on public.family_tasks(stock_id);

-- Liens d'un article : toujours dans le même foyer ; responsable = membre ayant accès aux listes ; auteur de la coche
-- posé par le serveur (jamais celui que l'appareil prétend).
create or replace function public.shopping_items_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stock_id is not null and not exists (select 1 from public.household_stocks where id = new.stock_id and household_id = new.household_id) then
    raise exception 'Stock introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if new.document_id is not null and not exists (select 1 from public.documents where id = new.document_id and household_id = new.household_id) then
    raise exception 'Document introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if new.assignee_id is not null and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id)
     and not public._mission_can_receive(new.household_id, new.assignee_id, null) then
    raise exception 'Cette personne ne peut pas s''occuper de cet article (hors du foyer ou sans accès aux listes).' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' then new.created_by := old.created_by; new.created_at := old.created_at; end if;
  if auth.uid() is not null and (tg_op = 'INSERT' or new.checked is distinct from old.checked) then
    if new.checked then new.checked_by := auth.uid(); new.checked_at := now();
    else new.checked_by := null; new.checked_at := null; end if;
  end if;
  return new;
end $$;
revoke execute on function public.shopping_items_guard() from public, anon, authenticated;
drop trigger if exists shopping_items_guard on public.shopping_items;
create trigger shopping_items_guard before insert or update on public.shopping_items
  for each row execute function public.shopping_items_guard();

-- Un lien mission → stock n'est posé que par le serveur (consommateur du réapprovisionnement)
create or replace function public.family_tasks_stock_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stock_id is not null and not exists (select 1 from public.household_stocks where id = new.stock_id and household_id = new.household_id) then
    raise exception 'Stock introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if auth.uid() is not null and not public._stock_rpc_active()
     and new.stock_id is distinct from (case when tg_op = 'UPDATE' then old.stock_id end) then
    raise exception 'Le lien avec un stock est posé par « Réapprovisionner ».' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.family_tasks_stock_guard() from public, anon, authenticated;
drop trigger if exists family_tasks_stock_guard on public.family_tasks;
create trigger family_tasks_stock_guard before insert or update of stock_id on public.family_tasks
  for each row execute function public.family_tasks_stock_guard();

-- ---------------------------------------------------------------- garde du stock : colonnes du serveur, niveau
create or replace function public.household_stocks_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_low boolean;
begin
  if new.child_id is not null and not exists (select 1 from public.children where id = new.child_id and household_id = new.household_id) then
    raise exception 'Enfant introuvable dans ce foyer.' using errcode = '22023';
  end if;
  if new.responsible_id is not null and (tg_op = 'INSERT' or new.responsible_id is distinct from old.responsible_id)
     and not public._mission_can_receive(new.household_id, new.responsible_id, new.child_id) then
    raise exception 'Cette personne ne peut pas s''occuper de ce stock (hors du foyer, sans accès aux listes ou à cet enfant).' using errcode = '22023';
  end if;
  -- État du réapprovisionnement, achats, validations : jamais posés par l'appareil
  if auth.uid() is not null and not public._stock_rpc_active() then
    if tg_op = 'INSERT' then
      new.restock_state := 'ok'; new.low_since := null; new.restock_task_id := null; new.restock_item_id := null;
      new.last_purchase_at := null; new.last_validated_by := null; new.created_by := auth.uid();
    else
      new.restock_state := old.restock_state; new.low_since := old.low_since; new.restock_task_id := old.restock_task_id;
      new.restock_item_id := old.restock_item_id; new.last_purchase_at := old.last_purchase_at; new.last_validated_by := old.last_validated_by;
    end if;
  end if;
  if tg_op = 'UPDATE' then new.created_by := old.created_by; new.created_at := old.created_at; new.household_id := old.household_id; end if;
  -- Niveau (miroir : stockLevel() dans src/lib/domain/stocks.ts) : bas seulement si la famille a saisi les deux valeurs
  v_low := new.qty_estimate is not null and new.threshold is not null and new.qty_estimate <= new.threshold;
  if not v_low then
    new.low_since := null;
    if new.restock_state in ('suggested', 'dismissed') then new.restock_state := 'ok'; end if;
  elsif new.low_since is null then
    new.low_since := now();
  end if;
  return new;
end $$;
revoke execute on function public.household_stocks_guard() from public, anon, authenticated;
drop trigger if exists household_stocks_guard on public.household_stocks;
create trigger household_stocks_guard before insert or update on public.household_stocks
  for each row execute function public.household_stocks_guard();

-- Seuil atteint → fait « stock.low » (une fois par période basse : clé = début de la période)
create or replace function public.household_stocks_emit_events()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_event uuid;
begin
  if new.low_since is not null and new.restock_state = 'ok'
     and (tg_op = 'INSERT' or new.low_since is distinct from old.low_since) then
    v_event := public._emit_household_event(new.household_id, 'stock.low', 'household_stocks', new.id::text,
      jsonb_strip_nulls(jsonb_build_object('stock_id', new.id, 'label', new.label, 'category', new.category, 'qty_estimate', new.qty_estimate,
        'threshold', new.threshold, 'unit', new.unit, 'responsible_id', new.responsible_id, 'child_id', new.child_id, 'pet_id', new.pet_id)),
      'stock.low:' || new.id || ':' || to_char(new.low_since at time zone 'UTC', 'YYYYMMDD"T"HH24MISS.US'));
    perform public._dispatch_household_event(v_event);
  end if;
  return null;
end $$;
revoke execute on function public.household_stocks_emit_events() from public, anon, authenticated;
drop trigger if exists household_stocks_events on public.household_stocks;
create trigger household_stocks_events after insert or update on public.household_stocks
  for each row execute function public.household_stocks_emit_events();

-- Article coché → fait « shopping.item_checked » (clé = version : décocher puis recocher = nouveau fait)
create or replace function public.shopping_items_emit_events()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_event uuid;
begin
  if new.checked and not old.checked then
    v_event := public._emit_household_event(new.household_id, 'shopping.item_checked', 'shopping_items', new.id::text,
      jsonb_strip_nulls(jsonb_build_object('item_id', new.id, 'label', new.label, 'list_id', new.list_id, 'stock_id', new.stock_id,
        'checked_by', new.checked_by, 'qty', new.qty, 'unit', new.unit)),
      'shopping.item_checked:' || new.id || ':' || new.version);
    perform public._dispatch_household_event(v_event);
  end if;
  return null;
end $$;
revoke execute on function public.shopping_items_emit_events() from public, anon, authenticated;
drop trigger if exists shopping_items_events on public.shopping_items;
create trigger shopping_items_events after update of checked on public.shopping_items
  for each row execute function public.shopping_items_emit_events();

-- Stock correspondant à un produit (même libellé, ou libellé + taille) — sert à relier une mission d'achat à son stock
create or replace function public._stock_match(p_household uuid, p_label text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.household_stocks
   where household_id = p_household
     and (public._norm_label(label) = public._norm_label(p_label) or public._norm_label(label || ' ' || coalesce(size, '')) = public._norm_label(p_label))
   order by created_at, id limit 1;
$$;
revoke execute on function public._stock_match(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- consommateur des missions (version de 20261114000300
-- + lien stock : l'article créé ou rattaché à l'acceptation porte le stock de la mission, ou celui du même produit)
create or replace function public._consume_mission_event(e public.household_events)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.family_tasks; n record; v_to uuid; v_open boolean := false; v_list uuid; v_item uuid; v_label text; v_key uuid; v_stock uuid;
  v_prev text := coalesce(current_setting('homi.mission_action', true), '');
begin
  select * into t from public.family_tasks where id = nullif(e.payload ->> 'task_id', '')::uuid and household_id = e.household_id;
  if not found then return; end if;

  -- a) Notification au bon destinataire (texte neutre ; jamais à l'auteur du fait ; une seule fois par événement)
  v_to := case e.type::text
    when 'mission.requested' then t.assignee_id
    when 'mission.reminded'  then t.assignee_id
    when 'mission.cancelled' then t.assignee_id
    when 'mission.started'   then null
    else t.created_by end;
  v_open := e.type::text = 'mission.requested' and t.assignee_id is null;
  if e.type::text <> 'mission.started' and (v_to is not null or v_open) then
    select * into n from public._mission_notification(e.type::text, t.title);
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      select m.user_id, 'family', n.title, n.body, '/family/missions/' || t.id,
             jsonb_build_object('task_id', t.id, 'event_id', e.id, 'mission', e.type::text)
      from public.household_members m
      where m.household_id = t.household_id
        and m.user_id is distinct from e.actor_id
        and (case when v_open then m.user_id is distinct from t.created_by else m.user_id = v_to end)
        and (m.role = 'owner' or 'lists' = any(m.can_view))
        and (t.child_id is null or public._member_child_allowed(m.role, m.child_scope, t.child_id))
        and not exists (select 1 from public.notifications x where x.user_id = m.user_id and x.payload ->> 'event_id' = e.id::text);
  end if;

  -- b) Mission d'achat acceptée (ou commencée) : l'article de courses lié existe, une seule fois, relié au stock
  if e.type::text in ('mission.accepted', 'mission.started') and t.shopping_item_id is null and t.mission_state in ('accepted', 'in_progress')
     and (t.product_label is not null or t.category = 'shopping') then
    v_label := left(btrim(coalesce(t.product_label, t.title)), 120);
    v_stock := coalesce(t.stock_id, public._stock_match(t.household_id, v_label));
    select id into v_list from public.shopping_lists where household_id = t.household_id order by created_at desc limit 1;
    if v_list is null then
      insert into public.shopping_lists(household_id, title, created_by) values (t.household_id, 'Courses', coalesce(e.actor_id, t.created_by))
        returning id into v_list;
    end if;
    select id into v_item from public.shopping_items
      where list_id = v_list and not checked and public._norm_label(label) = public._norm_label(v_label) order by position, id limit 1;
    if v_item is null then
      v_key := md5('mission-item:' || t.id::text)::uuid;
      insert into public.shopping_items(list_id, household_id, label, client_id, position, stock_id, category, assignee_id)
        values (v_list, t.household_id, v_label, v_key, coalesce((select max(position) + 1 from public.shopping_items where list_id = v_list), 0),
                v_stock, (select category from public.household_stocks where id = v_stock), t.assignee_id)
        on conflict (household_id, client_id) do nothing
        returning id into v_item;
      if v_item is null then select id into v_item from public.shopping_items where household_id = t.household_id and client_id = v_key; end if;
    elsif v_stock is not null then
      update public.shopping_items set stock_id = v_stock where id = v_item and stock_id is null;
    end if;
    perform set_config('homi.mission_action', 'on', true);
    update public.family_tasks set shopping_item_id = v_item where id = t.id and shopping_item_id is null;
    perform set_config('homi.mission_action', v_prev, true);
  end if;

  -- c) Mission terminée : l'article lié est coché (une seule fois ; jamais décoché par ce chemin). Le fait
  --    shopping.item_checked qui en découle retrouvera la mission déjà terminée : aucune boucle.
  if e.type::text = 'mission.completed' and t.shopping_item_id is not null then
    update public.shopping_items set checked = true, checked_by = coalesce(e.actor_id, checked_by), checked_at = now()
      where id = t.shopping_item_id and household_id = t.household_id and not checked;
  end if;
end $$;
revoke execute on function public._consume_mission_event(public.household_events) from public, anon, authenticated;

-- ---------------------------------------------------------------- 3. consommateur courses / stocks
create or replace function public._consume_stock_event(e public.household_events)
returns void language plpgsql security definer set search_path = public as $$
declare
  s public.household_stocks; i public.shopping_items; t public.family_tasks; v_to uuid; v_prev text := coalesce(current_setting('homi.stock_action', true), '');
begin
  if e.type::text = 'stock.low' then
    select * into s from public.household_stocks where id = nullif(e.payload ->> 'stock_id', '')::uuid and household_id = e.household_id;
    if not found or s.low_since is null or s.restock_state <> 'ok' then return; end if;   -- remonté entre-temps, ou déjà en cours
    perform set_config('homi.stock_action', 'on', true);
    update public.household_stocks set restock_state = 'suggested' where id = s.id and restock_state = 'ok';
    perform set_config('homi.stock_action', v_prev, true);
    -- Suggestion seulement : AUCUNE mission. Notification neutre au responsable du stock (sinon du domaine « courses »)
    v_to := coalesce(s.responsible_id, (select d.owner_id from public.family_domains d where d.household_id = s.household_id and d.key = 'shopping'));
    if v_to is not null and v_to is distinct from e.actor_id and public._mission_can_receive(s.household_id, v_to, s.child_id) and s.reminder then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
        select v_to, 'family', left('Stock bas : ' || s.label, 160), 'HOMI propose de prévoir le réapprovisionnement. Rien n’est créé sans votre accord.',
               '/family/stocks/' || s.id, jsonb_build_object('stock_id', s.id, 'event_id', e.id, 'stock', 'low')
        where not exists (select 1 from public.notifications x where x.user_id = v_to and x.payload ->> 'event_id' = e.id::text);
    end if;

  elsif e.type::text = 'stock.restock_confirmed' then
    perform set_config('homi.stock_action', 'on', true);
    update public.household_stocks set restock_state = 'ordered', restock_task_id = nullif(e.payload ->> 'task_id', '')::uuid
      where id = nullif(e.payload ->> 'stock_id', '')::uuid and household_id = e.household_id and restock_state in ('ok', 'suggested', 'dismissed');
    update public.family_tasks set stock_id = nullif(e.payload ->> 'stock_id', '')::uuid
      where id = nullif(e.payload ->> 'task_id', '')::uuid and household_id = e.household_id and stock_id is null;
    perform set_config('homi.stock_action', v_prev, true);

  elsif e.type::text = 'stock.restock_dismissed' then
    perform set_config('homi.stock_action', 'on', true);
    update public.household_stocks set restock_state = 'dismissed'
      where id = nullif(e.payload ->> 'stock_id', '')::uuid and household_id = e.household_id and restock_state = 'suggested';
    perform set_config('homi.stock_action', v_prev, true);

  elsif e.type::text = 'shopping.item_checked' then
    select * into i from public.shopping_items where id = nullif(e.payload ->> 'item_id', '')::uuid and household_id = e.household_id;
    if not found or not i.checked then return; end if;                 -- décoché entre-temps : rien
    -- a) Missions liées encore ouvertes : terminées seulement par leur destinataire ; sinon proposition neutre
    for t in select * from public.family_tasks
              where shopping_item_id = i.id and household_id = i.household_id and mission_state in ('pending', 'accepted', 'in_progress', 'postponed')
    loop
      if t.assignee_id is not null and t.assignee_id = e.actor_id and auth.uid() = e.actor_id then
        begin
          perform public.mission_respond(t.id, 'complete');
        exception when others then null;                                -- règle de la mission non remplie : on ne force rien
        end;
      elsif t.assignee_id is not null and t.assignee_id is distinct from e.actor_id then
        insert into public.notifications(user_id, category, title, body, deep_link, payload)
          select t.assignee_id, 'family', left('Article coché : ' || i.label, 160), 'Si la mission est faite, vous pouvez la terminer dans HOMI.',
                 '/family/missions/' || t.id, jsonb_build_object('task_id', t.id, 'event_id', e.id, 'mission', 'item_checked')
          where public._mission_can_receive(t.household_id, t.assignee_id, t.child_id)
            and not exists (select 1 from public.notifications x where x.user_id = t.assignee_id and x.payload ->> 'event_id' = e.id::text);
      end if;
    end loop;
    -- b) Stock lié : « acheté, à valider ». La quantité ne change PAS ici (validation explicite seulement).
    if i.stock_id is not null then
      perform set_config('homi.stock_action', 'on', true);
      update public.household_stocks set restock_state = 'bought', restock_item_id = i.id
        where id = i.stock_id and household_id = i.household_id and restock_state <> 'bought';
      perform set_config('homi.stock_action', v_prev, true);
    end if;
  end if;
end $$;
revoke execute on function public._consume_stock_event(public.household_events) from public, anon, authenticated;

-- Répartiteur (version de 20261114000300 + courses / stocks) : restaure le contexte de l'événement parent, pour qu'un
-- fait émis APRÈS un traitement imbriqué garde sa chaîne d'origine (anti-boucle).
create or replace function public._dispatch_household_event(p_event uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e public.household_events; v_parent uuid := public._current_event_id();
begin
  update public.household_events set status = 'processing', attempts = attempts + 1
   where id = p_event and status = 'pending' and available_at <= now()
     and (type::text like 'mission.%' or type::text in ('stock.low', 'stock.restock_confirmed', 'stock.restock_dismissed', 'shopping.item_checked'))
   returning * into e;
  if not found then return; end if;                                  -- déjà traité, sauté, réservé ailleurs, ou sans consommateur
  begin
    perform public._begin_event_processing(e.id);
    if e.type::text like 'mission.%' then perform public._consume_mission_event(e);
    else perform public._consume_stock_event(e); end if;
    perform public._begin_event_processing(v_parent);
    perform public.finish_household_event(e.id, true);
  exception when others then
    perform public._begin_event_processing(v_parent);
    perform public.finish_household_event(e.id, false, sqlerrm);
  end;
end $$;
revoke execute on function public._dispatch_household_event(uuid) from public, anon, authenticated;

create or replace function public.process_household_events(p_limit int default 100)
returns int language plpgsql security definer set search_path = public as $$
declare e public.household_events; v_n int := 0;
begin
  for e in select * from public.claim_household_events(p_limit, array['mission.requested', 'mission.accepted', 'mission.declined',
      'mission.postponed', 'mission.started', 'mission.completed', 'mission.cancelled', 'mission.question', 'mission.reminded',
      'stock.low', 'stock.restock_confirmed', 'stock.restock_dismissed', 'shopping.item_checked']::public.household_event_type[])
  loop
    begin
      perform public._begin_event_processing(e.id);
      if e.type::text like 'mission.%' then perform public._consume_mission_event(e);
      else perform public._consume_stock_event(e); end if;
      perform public._begin_event_processing(null);
      perform public.finish_household_event(e.id, true);
      v_n := v_n + 1;
    exception when others then
      perform public._begin_event_processing(null);
      perform public.finish_household_event(e.id, false, sqlerrm);
    end;
  end loop;
  return v_n;
end $$;
revoke execute on function public.process_household_events(int) from public, anon, authenticated;
grant execute on function public.process_household_events(int) to service_role;

-- ---------------------------------------------------------------- RPC : confirmer / écarter une suggestion
-- p_action : confirm (crée la mission, responsable du domaine par défaut) · dismiss (pas maintenant).
-- Résultat : { status: ok | not_found | conflict, unchanged?, task?, row? }.
create or replace function public.stock_restock(p_stock uuid, p_action text default 'confirm', p_assignee uuid default null,
  p_title text default null, p_due_at timestamptz default null, p_expected_version integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); s public.household_stocks; v_task jsonb; v_event uuid; v_assignee uuid := p_assignee; v_domain text;
  v_category text; v_product text; v_period text;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_action not in ('confirm', 'dismiss') then raise exception 'Action inconnue : %', p_action using errcode = '22023'; end if;
  select * into s from public.household_stocks where id = p_stock for update;
  -- Ce que la personne ne peut pas voir n'existe pas pour elle (autre foyer, ex-membre, enfant non confié)
  if not found or not public.can_access_household(s.household_id, 'lists', false)
     or (s.child_id is not null and not public.can_access_child(s.child_id)) then
    return jsonb_build_object('status', 'not_found');
  end if;
  if not public.can_access_household(s.household_id, 'lists', true) then
    raise exception 'Vous ne pouvez pas modifier les stocks de ce foyer.' using errcode = '42501';
  end if;
  if p_expected_version is not null and p_expected_version <> s.version then
    return jsonb_build_object('status', 'conflict', 'row', to_jsonb(s));
  end if;
  v_period := to_char(coalesce(s.low_since, s.created_at) at time zone 'UTC', 'YYYYMMDD"T"HH24MISS.US');

  if p_action = 'dismiss' then
    if s.restock_state <> 'suggested' then
      return jsonb_build_object('status', 'ok', 'unchanged', true, 'row', to_jsonb(s));
    end if;
    v_event := public._emit_household_event(s.household_id, 'stock.restock_dismissed', 'household_stocks', s.id::text,
      jsonb_build_object('stock_id', s.id, 'label', s.label), 'stock.restock_dismissed:' || s.id || ':' || v_period);
    perform public._dispatch_household_event(v_event);
    select * into s from public.household_stocks where id = s.id;
    return jsonb_build_object('status', 'ok', 'row', to_jsonb(s));
  end if;

  -- Rejoué (double appui, file) : la mission déjà créée est renvoyée, rien de neuf
  if s.restock_state in ('ordered', 'bought') and s.restock_task_id is not null then
    return jsonb_build_object('status', 'ok', 'unchanged', true, 'task', (select to_jsonb(t) from public.family_tasks t where t.id = s.restock_task_id), 'row', to_jsonb(s));
  end if;

  v_category := case when s.category = 'pet_food' then 'pets' when s.category in ('diapers', 'wipes', 'milk') then 'diapers' else 'shopping' end;
  v_product := left(btrim(s.label || coalesce(' ' || s.size, '')), 120);
  -- Responsable par défaut : celui du domaine (family_domains, via create_mission), sinon le responsable du stock
  if v_assignee is null then
    v_domain := public._mission_domain_of(v_category);
    if not exists (select 1 from public.family_domains d where d.household_id = s.household_id and d.key = v_domain
                     and d.owner_id is distinct from v_uid and public._mission_can_receive(s.household_id, d.owner_id, s.child_id))
       and s.responsible_id is distinct from v_uid then
      v_assignee := s.responsible_id;
    end if;
  end if;
  v_task := public.create_mission(s.household_id, coalesce(nullif(btrim(p_title), ''), left('Racheter : ' || v_product, 120)), v_assignee, v_category,
    null, p_due_at, false, 'normal', null, s.child_id, s.pet_id, null, v_product, null, null,
    md5('restock:' || s.id::text || ':' || v_period)::uuid);
  v_event := public._emit_household_event(s.household_id, 'stock.restock_confirmed', 'household_stocks', s.id::text,
    jsonb_build_object('stock_id', s.id, 'task_id', v_task ->> 'id', 'label', s.label, 'assignee_id', v_task ->> 'assignee_id'),
    'stock.restock_confirmed:' || s.id || ':' || (v_task ->> 'id'));
  perform public._dispatch_household_event(v_event);
  select * into s from public.household_stocks where id = s.id;
  return jsonb_build_object('status', 'ok', 'task', (select to_jsonb(t) from public.family_tasks t where t.id = (v_task ->> 'id')::uuid), 'row', to_jsonb(s));
end $$;
revoke execute on function public.stock_restock(uuid, text, uuid, text, timestamptz, integer) from public, anon;
grant execute on function public.stock_restock(uuid, text, uuid, text, timestamptz, integer) to authenticated;

-- ---------------------------------------------------------------- RPC : valider l'achat (quantité mise à jour ICI seulement)
-- p_mode : add (quantité achetée ajoutée à l'estimation) · set (nouvelle estimation saisie). Jamais de quantité inventée.
-- Publie stock.purchase_confirmed (laissé « pending » pour le futur module Budget, aucun montant).
create or replace function public.stock_validate_purchase(p_stock uuid, p_qty numeric, p_mode text default 'add', p_expected_version integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); s public.household_stocks; v_before numeric; v_after numeric; v_task uuid; v_item uuid;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  if p_mode not in ('add', 'set') then raise exception 'Mode inconnu : %', p_mode using errcode = '22023'; end if;
  if p_qty is null or p_qty < 0 or (p_mode = 'add' and p_qty = 0) or p_qty > 100000 then
    raise exception 'Indiquez la quantité achetée (ou la nouvelle estimation).' using errcode = '22023';
  end if;
  select * into s from public.household_stocks where id = p_stock for update;
  if not found or not public.can_access_household(s.household_id, 'lists', false)
     or (s.child_id is not null and not public.can_access_child(s.child_id)) then
    return jsonb_build_object('status', 'not_found');
  end if;
  if not public.can_access_household(s.household_id, 'lists', true) then
    raise exception 'Vous ne pouvez pas modifier les stocks de ce foyer.' using errcode = '42501';
  end if;
  if p_expected_version is not null and p_expected_version <> s.version then
    return jsonb_build_object('status', 'conflict', 'row', to_jsonb(s));
  end if;
  v_before := s.qty_estimate; v_task := s.restock_task_id; v_item := s.restock_item_id;
  v_after := case when p_mode = 'set' then p_qty else coalesce(s.qty_estimate, 0) + p_qty end;
  perform set_config('homi.stock_action', 'on', true);
  update public.household_stocks set qty_estimate = v_after, low_since = null, restock_state = 'ok', restock_task_id = null, restock_item_id = null,
         last_purchase_at = now(), last_validated_by = v_uid
   where id = s.id returning * into s;
  perform set_config('homi.stock_action', '', true);
  perform public._emit_household_event(s.household_id, 'stock.purchase_confirmed', 'household_stocks', s.id::text,
    jsonb_strip_nulls(jsonb_build_object('stock_id', s.id, 'label', s.label, 'category', s.category, 'mode', p_mode,
      'qty_added', case when p_mode = 'add' then p_qty end, 'qty_before', v_before, 'qty_after', v_after, 'unit', s.unit,
      'task_id', v_task, 'item_id', v_item, 'validated_by', v_uid, 'validated_at', s.last_purchase_at)),
    'stock.purchase_confirmed:' || s.id || ':' || s.version);
  return jsonb_build_object('status', 'ok', 'row', to_jsonb(s));
end $$;
revoke execute on function public.stock_validate_purchase(uuid, numeric, text, integer) from public, anon;
grant execute on function public.stock_validate_purchase(uuid, numeric, text, integer) to authenticated;

-- ---------------------------------------------------------------- RPC : fusionner deux articles identiques
-- Garde p_keep, additionne les quantités (si les deux en ont), reprend les liens (missions, stock) de p_drop, puis l'efface.
create or replace function public.merge_shopping_items(p_keep uuid, p_drop uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k public.shopping_items; d public.shopping_items;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into k from public.shopping_items where id = p_keep for update;
  select * into d from public.shopping_items where id = p_drop for update;
  if k.id is null or d.id is null or k.id = d.id or k.household_id <> d.household_id
     or not public.can_access_household(k.household_id, 'lists', true) then
    return jsonb_build_object('status', 'not_found');
  end if;
  if k.checked or d.checked then raise exception 'Seuls deux articles encore à acheter se fusionnent.' using errcode = '22023'; end if;
  perform set_config('homi.mission_action', 'on', true);
  update public.family_tasks set shopping_item_id = k.id where shopping_item_id = d.id and household_id = k.household_id;
  perform set_config('homi.mission_action', '', true);
  perform set_config('homi.stock_action', 'on', true);
  update public.household_stocks set restock_item_id = k.id where restock_item_id = d.id and household_id = k.household_id;
  perform set_config('homi.stock_action', '', true);
  update public.shopping_items set
    qty = case when k.qty is not null and d.qty is not null and k.unit is not distinct from d.unit then k.qty + d.qty else coalesce(k.qty, d.qty) end,
    unit = coalesce(k.unit, d.unit), brand = coalesce(k.brand, d.brand), size = coalesce(k.size, d.size), category = coalesce(k.category, d.category),
    stock_id = coalesce(k.stock_id, d.stock_id), assignee_id = coalesce(k.assignee_id, d.assignee_id)
   where id = k.id returning * into k;
  delete from public.shopping_items where id = d.id;
  return jsonb_build_object('status', 'ok', 'row', to_jsonb(k));
end $$;
revoke execute on function public.merge_shopping_items(uuid, uuid) from public, anon;
grant execute on function public.merge_shopping_items(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------- conflits d'édition : nouvelles colonnes modifiables
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
    when 'shopping_items' then array['label', 'qty', 'unit', 'aisle', 'at_home', 'checked', 'position', 'brand', 'size', 'category', 'assignee_id', 'document_id']
    when 'household_stocks' then array['label', 'category', 'brand', 'size', 'qty_estimate', 'unit', 'threshold', 'frequency_days', 'responsible_id',
                                       'reminder', 'child_id', 'notes']
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
  if v_row is null then return jsonb_build_object('status', 'not_found'); end if;
  if (v_row ->> 'version')::int = p_expected_version then
    return jsonb_build_object('status', 'forbidden');
  end if;
  return jsonb_build_object('status', 'conflict', 'row', v_row);
end $$;
revoke execute on function public.update_if_version(text, uuid, integer, jsonb) from public, anon;
grant execute on function public.update_if_version(text, uuid, integer, jsonb) to authenticated;

-- ---------------------------------------------------------------- journal d'audit, temps réel, export
select public._attach_audit('shopping_lists', 'lists');
select public._attach_audit('shopping_items', 'lists');
select public._attach_audit('household_stocks', 'lists');

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['shopping_lists', 'shopping_items', 'household_stocks'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

alter function public.export_my_data() rename to _export_my_data_v28;
revoke execute on function public._export_my_data_v28() from public, anon, authenticated;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  return public._export_my_data_v28() || jsonb_build_object(
    'household_stocks', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]') from public.household_stocks s
      where s.household_id in (select m.household_id from public.household_members m where m.user_id = v_uid)
        and public.can_access_household(s.household_id, 'lists', false)
        and (s.child_id is null or public.can_access_child(s.child_id))));
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
