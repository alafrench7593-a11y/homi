-- =====================================================================
-- Audit n°3 « Sécurité backend et permissions » (16/11/2026) — vérifications GÉNÉRIQUES.
-- Exécuté APRÈS tous les autres fichiers : les tables contiennent alors les données de dizaines de foyers
-- de test, ce qui donne des lignes « étrangères » à presque toutes les tables.
--
-- A. Catalogue : RLS partout, fonctions security definer (search_path, droits d'exécution anon), vues,
--    stockage, publication Realtime, politiques d'écriture « true ».
-- B. Requêtes croisées AUTOMATIQUES sur TOUTES les tables publiques à colonne household_id / user_id,
--    pour 4 identités : autre foyer (propriétaire d'un foyer neuf), membre révoqué, nounou à périmètre
--    d'enfants, visiteur sans compte (anon). Pour chaque table :
--      lecture  : aucune ligne d'un autre foyer / d'une autre personne visible ;
--      modif.   : UPDATE d'une colonne modifiable sur les lignes étrangères → 0 ligne touchée ;
--      effacem. : DELETE sur les lignes étrangères → 0 ligne effacée ;
--      ajout    : copie d'une ligne étrangère (nouvel id) insérée sous l'identité testée → refusée.
--    Chaque écriture tentée est annulée (sous-transaction), quel que soit son résultat.
-- C. Nounou : aucune ligne d'un enfant non confié, ni journal d'audit, ni événements du foyer.
-- D. anon : aucune écriture possible sur AUCUNE table publique.
-- Une table ajoutée plus tard est vérifiée sans rien écrire ici.
-- =====================================================================
\set GO 'ae980000-0000-4000-8000-000000000001'
\set GC 'ae980000-0000-4000-8000-000000000002'
\set GN 'ae980000-0000-4000-8000-000000000003'
\set GR 'ae980000-0000-4000-8000-000000000004'
\set GX 'ae980000-0000-4000-8000-000000000005'
\set GH 'ae980000-0000-4000-8000-0000000000a1'
\set GXH 'ae980000-0000-4000-8000-0000000000a2'
\set GK1 'ae980000-0000-4000-8000-0000000000c1'
\set GK2 'ae980000-0000-4000-8000-0000000000c2'

-- ---------------------------------------------------------------- Mise en place (serveur)
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'GO', 'g98z-owner@exemple.test'), (:'GC', 'g98z-coparent@exemple.test'),
  (:'GN', 'g98z-nounou@exemple.test'), (:'GR', 'g98z-revoque@exemple.test'), (:'GX', 'g98z-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'GH', 'Foyer 98z', :'GO'), (:'GXH', 'Autre foyer 98z', :'GX');
insert into public.household_members (household_id, user_id, role) values (:'GH', :'GO', 'owner'), (:'GXH', :'GX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'GK1', :'GH', 'Lina', current_date - 400), (:'GK2', :'GH', 'Noé', current_date - 800);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'GH', :'GC', 'coparent', '{daily,health,documents,pregnancy,lists,names,profile}', '{daily,health,documents,pregnancy,lists,names,profile}', null),
  (:'GH', :'GN', 'caregiver', '{daily,lists,documents,health,profile}', '{daily,lists}', array[:'GK1']::uuid[]),
  (:'GH', :'GR', 'coparent', '{daily,health,documents,pregnancy,lists,names,profile}', '{daily,health,documents,pregnancy,lists,names,profile}', null);

-- Données du foyer 98z sur l'enfant NON confié à la nounou (Noé) : une copie d'une ligne existante pour CHAQUE
-- table à child_id (au mieux : une table dont les contraintes refusent la copie est simplement ignorée).
do $$
declare r record; j jsonb; cols text; k2 uuid := 'ae980000-0000-4000-8000-0000000000c2'; h uuid := 'ae980000-0000-4000-8000-0000000000a1';
begin
  for r in select c.relname from pg_class c
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
             and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'child_id' and not a.attisdropped)
             and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'household_id' and not a.attisdropped)
           order by 1 loop
    execute format('select to_jsonb(t) from public.%I t where child_id is not null limit 1', r.relname) into j;
    continue when j is null;
    j := j || jsonb_build_object('child_id', k2, 'household_id', h);
    if j ? 'client_id' then j := j || jsonb_build_object('client_id', gen_random_uuid()); end if;
    select string_agg(quote_ident(a.attname), ',') into cols from pg_attribute a
      where a.attrelid = ('public.' || quote_ident(r.relname))::regclass and a.attnum > 0 and not a.attisdropped
        and a.attgenerated = '' and a.attidentity = '' and a.attname <> 'id' and j ? a.attname;
    begin
      execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)', r.relname, cols, cols, r.relname) using j;
    exception when others then null;
    end;
  end loop;
end $$;
insert into public.family_tasks (household_id, title, child_id, created_by) values (:'GH', 'Vaccin de Noé', :'GK2', :'GO');
insert into public.documents (household_id, child_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader, uploaded_by)
  values (:'GH', :'GK2', 'health_book', 'Carnet de Noé', :'GH' || '/carnet-noe.pdf', 'application/pdf', 1000, false, :'GO');
-- Le membre « révoqué » a écrit dans le foyer, puis il est retiré par la propriétaire
insert into public.family_tasks (household_id, title, created_by) values (:'GH', 'Tâche du futur ex-membre', :'GR');
delete from public.household_members where household_id = :'GH' and user_id = :'GR';

select tests.ok((select count(*) from public.bottles where household_id = :'GH' and child_id = :'GK2') >= 0, 'générique : mise en place du foyer 98z');

-- Fonction de test : vérifications croisées pour une identité (rôle + sujet). Exécutée en superutilisateur,
-- elle change elle-même de rôle pour chaque tentative et annule toute écriture.
create or replace function tests.cross_check(p_label text, p_role text, p_sub uuid, p_child_scope uuid[] default null)
returns void language plpgsql as $f$
declare
  r record; n bigint; n0 bigint; n1 bigint; j jsonb; cols text; col text; me text := coalesce(p_sub::text, '');
  my_h uuid[]; has_h boolean; has_u boolean; foreign_cond text; leaks_sel text[] := '{}'; leaks_upd text[] := '{}';
  leaks_del text[] := '{}'; leaks_ins text[] := '{}'; v_tbl regclass;
begin
  select coalesce(array_agg(household_id), '{}') into my_h from public.household_members where user_id = p_sub;
  for r in select c.oid, c.relname from pg_class c
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
             and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname in ('household_id', 'user_id') and not a.attisdropped)
           order by 1 loop
    v_tbl := r.oid;
    has_h := exists (select 1 from pg_attribute a where a.attrelid = r.oid and a.attname = 'household_id' and not a.attisdropped);
    has_u := exists (select 1 from pg_attribute a where a.attrelid = r.oid and a.attname = 'user_id' and not a.attisdropped);
    -- « étranger » : rattaché à un foyer dont l'identité n'est pas membre, ou (sans foyer) à une autre personne
    foreign_cond := case
      when has_h and has_u then format('((household_id is not null and household_id <> all(%L::uuid[])) or (household_id is null and user_id is not null and user_id::text <> %L)) and (user_id is null or user_id::text <> %L)', my_h, me, me)
      when has_h then format('household_id is not null and household_id <> all(%L::uuid[])', my_h)
      else format('user_id is not null and user_id::text <> %L', me) end;
    if p_child_scope is not null and exists (select 1 from pg_attribute a where a.attrelid = r.oid and a.attname = 'child_id' and not a.attisdropped) then
      -- nounou : les lignes d'un enfant non confié de SON foyer sont aussi « étrangères »
      foreign_cond := format('(%s) or (child_id is not null and child_id <> all(%L::uuid[]))', foreign_cond, p_child_scope);
    end if;
    -- tables publiques par conception (pseudonymes de la communauté, lieux approuvés)
    continue when r.relname in ('community_profiles', 'place_suggestions');

    -- Lecture
    perform set_config('request.jwt.claim.sub', me, true);
    execute 'set local role ' || p_role;
    begin
      execute format('select count(*) from public.%I where %s', r.relname, foreign_cond) into n;
    exception when insufficient_privilege then n := 0;
    end;
    reset role;
    if n > 0 then leaks_sel := leaks_sel || (r.relname || ':' || n); end if;

    -- Modification : une colonne que le rôle a le droit de modifier (household_id de préférence)
    select a.attname into col from pg_attribute a
      where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = '' and a.attidentity = ''
        and has_column_privilege(p_role, r.oid, a.attname, 'UPDATE')
      order by (a.attname = 'household_id') desc, (a.attname = 'user_id') desc, a.attnum limit 1;
    if col is not null then
      n := 0;
      begin
        perform set_config('request.jwt.claim.sub', me, true);
        execute 'set local role ' || p_role;
        execute format('update public.%I set %I = %I where %s', r.relname, col, col, foreign_cond);
        get diagnostics n = row_count;
        raise exception 'tests_rollback';
      exception when others then
        if sqlerrm <> 'tests_rollback' then n := 0; end if;
      end;
      reset role;
      if n > 0 then leaks_upd := leaks_upd || (r.relname || ':' || n); end if;
    end if;

    -- Effacement
    if has_table_privilege(p_role, r.oid, 'DELETE') then
      n := 0;
      begin
        perform set_config('request.jwt.claim.sub', me, true);
        execute 'set local role ' || p_role;
        execute format('delete from public.%I where %s', r.relname, foreign_cond);
        get diagnostics n = row_count;
        raise exception 'tests_rollback';
      exception when others then
        if sqlerrm <> 'tests_rollback' then n := 0; end if;
      end;
      reset role;
      if n > 0 then leaks_del := leaks_del || (r.relname || ':' || n); end if;
    end if;

    -- Ajout : copie d'une ligne étrangère (lue par le serveur), nouvel identifiant
    if has_table_privilege(p_role, r.oid, 'INSERT') then
      execute format('select to_jsonb(t) from public.%I t where %s limit 1', r.relname, foreign_cond) into j;
      if j is not null then
        if j ? 'client_id' then j := j || jsonb_build_object('client_id', gen_random_uuid()); end if;
        select string_agg(quote_ident(a.attname), ',') into cols from pg_attribute a
          where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = '' and a.attidentity = ''
            and a.attname <> 'id' and j ? a.attname and has_column_privilege(p_role, r.oid, a.attname, 'INSERT');
        execute format('select count(*) from public.%I where %s', r.relname, foreign_cond) into n0;
        n1 := n0;
        begin
          perform set_config('request.jwt.claim.sub', me, true);
          execute 'set local role ' || p_role;
          execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1)', r.relname, cols, cols, r.relname) using j;
          reset role;
          execute format('select count(*) from public.%I where %s', r.relname, foreign_cond) into n1;
          raise exception 'tests_rollback';
        exception when others then
          if sqlerrm <> 'tests_rollback' then n1 := n0; end if;
        end;
        reset role;
        if n1 > n0 then leaks_ins := leaks_ins || r.relname; end if;
      end if;
    end if;
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
  perform tests.ok(cardinality(leaks_sel) = 0, p_label || ' (générique) : aucune ligne étrangère lisible', array_to_string(leaks_sel, ', '));
  perform tests.ok(cardinality(leaks_upd) = 0, p_label || ' (générique) : aucune ligne étrangère modifiable', array_to_string(leaks_upd, ', '));
  perform tests.ok(cardinality(leaks_del) = 0, p_label || ' (générique) : aucune ligne étrangère effaçable', array_to_string(leaks_del, ', '));
  perform tests.ok(cardinality(leaks_ins) = 0, p_label || ' (générique) : aucune ligne insérable au nom d''un autre foyer ou d''une autre personne', array_to_string(leaks_ins, ', '));
end $f$;

-- ================================================================ B. Requêtes croisées
reset role;
select tests.cross_check('autre foyer', 'authenticated', :'GX');
select tests.cross_check('membre révoqué', 'authenticated', :'GR');
select tests.cross_check('nounou (un enfant confié)', 'authenticated', :'GN', array[:'GK1']::uuid[]);
select tests.cross_check('sans compte (anon)', 'anon', null);
reset role; set request.jwt.claim.sub = '';

-- ================================================================ C. Nounou : journal et événements du foyer
set role authenticated; set request.jwt.claim.sub = :'GN';
select tests.ok(tests.count('select * from public.household_audit_log where household_id = ''ae980000-0000-4000-8000-0000000000a1''') = 0
  and tests.count('select * from public.household_events where household_id = ''ae980000-0000-4000-8000-0000000000a1''') = 0,
  'nounou (générique) : journal d''audit et événements du foyer illisibles');
select tests.ok(tests.count('select * from public.documents where child_id = ''ae980000-0000-4000-8000-0000000000c2''') = 0
  and tests.count('select * from public.family_tasks where child_id = ''ae980000-0000-4000-8000-0000000000c2''') = 0,
  'nounou (générique) : document et tâche d''un enfant non confié invisibles');
reset role;

-- ================================================================ D. Visiteur sans compte : aucune écriture, sur AUCUNE table
do $$
declare r record; n bigint; col text; leaks text[] := '{}';
begin
  for r in select c.oid, c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' order by 1 loop
    select a.attname into col from pg_attribute a
      where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = '' and a.attidentity = ''
        and has_column_privilege('anon', r.oid, a.attname, 'UPDATE') order by a.attnum limit 1;
    n := 0;
    begin
      perform set_config('request.jwt.claim.sub', '', true);
      set local role anon;
      if col is not null then execute format('update public.%I set %I = %I', r.relname, col, col); get diagnostics n = row_count; end if;
      if n = 0 and has_table_privilege('anon', r.oid, 'DELETE') then execute format('delete from public.%I', r.relname); get diagnostics n = row_count; end if;
      raise exception 'tests_rollback';
    exception when others then
      if sqlerrm <> 'tests_rollback' then n := 0; end if;
    end;
    reset role;
    if n > 0 then leaks := leaks || r.relname; end if;
  end loop;
  perform tests.ok(cardinality(leaks) = 0, 'sans compte (générique) : aucune ligne modifiable ni effaçable dans les ' ||
    (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r') || ' tables publiques', array_to_string(leaks, ', '));
end $$;

-- Compte connecté ordinaire (aucun rôle d'administration) : tables SANS foyer ni personne (catalogues, communauté…) :
-- seules ses propres lignes (une colonne vaut son identifiant) sont modifiables ou effaçables.
do $$
declare r record; n bigint; col text; leaks text[] := '{}'; me text := 'ae980000-0000-4000-8000-000000000005';
begin
  for r in select c.oid, c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
             and not exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname in ('household_id', 'user_id') and not a.attisdropped)
           order by 1 loop
    select a.attname into col from pg_attribute a
      where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped and a.attgenerated = '' and a.attidentity = ''
        and has_column_privilege('authenticated', r.oid, a.attname, 'UPDATE') order by a.attnum limit 1;
    n := 0;
    begin
      perform set_config('request.jwt.claim.sub', me, true);
      set local role authenticated;
      if col is not null then
        execute format('with u as (update public.%I t set %I = %I returning to_jsonb(t) j) select count(*) from u
          where not exists (select 1 from jsonb_each_text(u.j) e where e.value in (%L, %L))', r.relname, col, col, me, 'ae980000-0000-4000-8000-0000000000a2') into n;
      end if;
      raise exception 'tests_rollback';
    exception when others then
      if sqlerrm <> 'tests_rollback' then n := 0; end if;
    end;
    reset role;
    if n > 0 then leaks := leaks || ('update ' || r.relname); end if;
    n := 0;
    begin
      perform set_config('request.jwt.claim.sub', me, true);
      set local role authenticated;
      execute format('with u as (delete from public.%I t returning to_jsonb(t) j) select count(*) from u
        where not exists (select 1 from jsonb_each_text(u.j) e where e.value in (%L, %L))', r.relname, me, 'ae980000-0000-4000-8000-0000000000a2') into n;
      raise exception 'tests_rollback';
    exception when others then
      if sqlerrm <> 'tests_rollback' then n := 0; end if;
    end;
    reset role;
    if n > 0 then leaks := leaks || ('delete ' || r.relname); end if;
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
  perform tests.ok(cardinality(leaks) = 0, 'compte ordinaire (générique) : catalogues et contenus d''autrui non modifiables ni effaçables', array_to_string(leaks, ', '));
end $$;

-- ================================================================ A. Catalogue
select tests.ok(not exists (select 1 from pg_class where relnamespace = 'public'::regnamespace and relkind in ('r', 'p') and not relrowsecurity),
  'catalogue : RLS activée sur toutes les tables publiques',
  (select string_agg(relname, ', ') from pg_class where relnamespace = 'public'::regnamespace and relkind in ('r', 'p') and not relrowsecurity));
select tests.ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')),
  'catalogue : toute fonction security definer a un search_path fixé',
  (select string_agg(p.oid::regprocedure::text, ', ') from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')));
-- Vues : invocateur (RLS de la personne) ou, pour les deux fils de la communauté (anonymat), filtre explicite sur auth.uid()
select tests.ok(not exists (select 1 from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('v', 'm')
    and not coalesce('security_invoker=true' = any(c.reloptions), false)
    and not (c.relname in ('forum_feed', 'comment_feed') and pg_get_viewdef(c.oid) like '%auth.uid()%IS NOT NULL%')),
  'catalogue : vues en security_invoker (ou filtre explicite documenté)',
  (select string_agg(relname, ', ') from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('v', 'm')
     and not coalesce('security_invoker=true' = any(c.reloptions), false) and c.relname not in ('forum_feed', 'comment_feed')));
select tests.ok(not has_table_privilege('anon', 'public.forum_feed', 'select') and not has_table_privilege('anon', 'public.comment_feed', 'select'),
  'catalogue : fils de la communauté illisibles sans compte');
select tests.ok(not exists (select 1 from storage.buckets where public), 'stockage : aucun espace public (liens signés uniquement)',
  (select string_agg(id, ', ') from storage.buckets where public));
select tests.ok(not exists (select 1 from storage.buckets b where not exists (select 1 from pg_policies p where p.schemaname = 'storage' and p.tablename = 'objects' and p.qual || coalesce(p.with_check, '') like '%''' || b.id || '''%'))
  and not exists (select 1 from pg_policies where schemaname = 'storage' and 'anon' = any(roles)),
  'stockage : chaque espace a ses politiques, aucune pour anon');
select tests.ok(not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd in ('UPDATE', 'ALL')),
  'stockage : aucun remplacement de fichier par un client (pas de politique UPDATE)');
-- Realtime : seules des tables sous RLS, rattachées à un foyer ou à une personne
select tests.ok(not exists (select 1 from pg_publication_tables pt join pg_class c on c.oid = ('public.' || quote_ident(pt.tablename))::regclass
    where pt.pubname = 'supabase_realtime' and pt.schemaname = 'public'
      and (not c.relrowsecurity or not exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname in ('household_id', 'user_id') and not a.attisdropped))),
  'realtime : tables publiées sous RLS et rattachées à un foyer ou à une personne');
-- Aucune politique d'écriture permissive inconditionnelle
select tests.ok(not exists (select 1 from pg_policies where schemaname in ('public', 'storage') and permissive = 'PERMISSIVE'
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL') and (qual = 'true' or with_check = 'true')),
  'politiques : aucune écriture permissive « true »',
  (select string_agg(tablename || '.' || policyname, ', ') from pg_policies where schemaname in ('public', 'storage') and permissive = 'PERMISSIVE'
     and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL') and (qual = 'true' or with_check = 'true')));
select tests.ok(not exists (select 1 from pg_policies where schemaname = 'public' and 'anon' = any(roles) and cmd <> 'SELECT'),
  'politiques : aucune écriture ouverte au visiteur sans compte');

-- ================================================================ E. Export RGPD ⊆ ce que la personne peut lire
-- Toute ligne d'un foyer (objet portant id + household_id) présente dans export_my_data() doit être lisible par la
-- personne sous RLS, ou être de sa main (une colonne d'auteur vaut son identifiant).
create or replace function tests.export_leaks(p_sub uuid) returns text language plpgsql as $f$
declare v jsonb; r record; ids uuid[] := '{}'; part uuid[]; leaked text[] := '{}';
begin
  perform set_config('request.jwt.claim.sub', p_sub::text, true);
  set local role authenticated;
  v := public.export_my_data();
  for r in select c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
             and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'household_id' and not a.attisdropped)
             and exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'id' and a.atttypid = 'uuid'::regtype and not a.attisdropped) loop
    begin
      execute format('select array_agg(id) from public.%I', r.relname) into part;
    exception when insufficient_privilege then part := null;
    end;
    ids := ids || coalesce(part, '{}');
  end loop;
  reset role;
  select coalesce(array_agg(distinct o ->> 'id'), '{}') into leaked
    from jsonb_path_query(v, 'strict $.**') o
   where jsonb_typeof(o) = 'object' and o ? 'id' and o ? 'household_id'
     and (o ->> 'id') ~ '^[0-9a-f-]{36}$' and (o ->> 'id')::uuid <> all(ids)
     and not exists (select 1 from jsonb_each_text(o) e
                     where e.key in ('user_id', 'created_by', 'uploaded_by', 'author_id', 'actor_id', 'from_user', 'logged_by', 'added_by', 'shared_by', 'done_by', 'carrier_user_id')
                       and e.value = p_sub::text);
  return case when cardinality(leaked) = 0 then null else cardinality(leaked) || ' ligne(s) : ' || array_to_string(leaked[1:5], ', ') end;
end $f$;
reset role;
-- co-parent aux droits limités au quotidien
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'GH', :'GX', 'coparent', '{daily}', '{daily}');
select tests.ok(tests.export_leaks(:'GN') is null, 'export (générique) : la nounou n''exporte que ce qu''elle peut lire', tests.export_leaks(:'GN'));
select tests.ok(tests.export_leaks(:'GX') is null, 'export (générique) : un co-parent limité au quotidien n''exporte que ce qu''il peut lire', tests.export_leaks(:'GX'));
select tests.ok(tests.export_leaks(:'GC') is null, 'export (générique) : un co-parent complet n''exporte que ce qu''il peut lire', tests.export_leaks(:'GC'));
select tests.ok(tests.export_leaks(:'GO') is null, 'export (générique) : la propriétaire n''exporte que ce qu''elle peut lire', tests.export_leaks(:'GO'));
delete from public.household_members where household_id = :'GH' and user_id = :'GX';
reset role; set request.jwt.claim.sub = '';
