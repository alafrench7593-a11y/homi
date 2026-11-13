-- =====================================================================
-- Audit n°3 « Sécurité backend et permissions » (16/11/2026) — reproductions des failles confirmées.
-- Chaque bloc échouait avant 20261117000100_audit_securite_backend.sql (voir docs/audit/03_securite_backend.md).
--   S1 critique : export RGPD d'une nounou / d'un co-parent limité = tout le foyer (enfants non confiés,
--                 documents non partagés, grossesse fermée, rendez-vous santé…)
--   S2 critique : la propriétaire inscrit N'IMPORTE QUEL compte dans son foyer (réécriture de household_members.user_id)
--   S3 haute    : flux d'agenda (calendar_feed_data) sans le périmètre d'enfants ni de grossesse
--   S4 haute    : un co-parent change la porteuse d'une grossesse → l'ouvre à la nounou, la ferme à la mère
--   S5 haute    : family_tasks.created_by falsifiable → le destinataire s'approprie la mission (annule, modifie)
--   S6 moyenne  : documents.uploaded_by modifiable → confiscation d'un document, contournement de l'accord « lecture IA »
--   S7 basse    : auteurs falsifiables (created_by, logged_by…) sur les saisies du foyer
--   S8 basse    : create_mission rejoué avec le client_id d'une mission d'un enfant non confié la renvoie en entier
--   S9 basse    : fonctions security definer exécutables par anon sans nécessité
-- =====================================================================
\set XO 'ae970000-0000-4000-8000-000000000001'
\set XC 'ae970000-0000-4000-8000-000000000002'
\set XN 'ae970000-0000-4000-8000-000000000003'
\set XM 'ae970000-0000-4000-8000-000000000004'
\set XV 'ae970000-0000-4000-8000-000000000005'
\set XL 'ae970000-0000-4000-8000-000000000006'
\set XH 'ae970000-0000-4000-8000-0000000000a1'
\set XK1 'ae970000-0000-4000-8000-0000000000c1'
\set XK2 'ae970000-0000-4000-8000-0000000000c2'
\set XP 'ae970000-0000-4000-8000-0000000000b1'
\set XD 'ae970000-0000-4000-8000-0000000000d1'
\set XT 'ae970000-0000-4000-8000-0000000000e1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'XO', 'x97-owner@exemple.test'), (:'XC', 'x97-coparent@exemple.test'),
  (:'XN', 'x97-nounou@exemple.test'), (:'XM', 'x97-mere@exemple.test'), (:'XV', 'x97-victime@exemple.test'), (:'XL', 'x97-limite@exemple.test');
update public.profiles set display_name = 'Victime', avatar_path = :'XV' || '/ae970000-0000-4000-8000-00000000f001.jpg' where id = :'XV';
insert into public.households (id, name, created_by) values (:'XH', 'Foyer 97x', :'XO');
insert into public.household_members (household_id, user_id, role) values (:'XH', :'XO', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'XK1', :'XH', 'Lou', current_date - 300), (:'XK2', :'XH', 'Max', current_date - 900);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope, pregnancy_access) values
  (:'XH', :'XC', 'coparent', '{daily,health,documents,pregnancy,lists,names,profile}', '{daily,health,documents,pregnancy,lists,names,profile}', null, true),
  (:'XH', :'XM', 'coparent', '{daily,pregnancy,lists}', '{daily,pregnancy,lists}', null, false),
  (:'XH', :'XL', 'coparent', '{daily}', '{daily}', null, true),
  (:'XH', :'XN', 'caregiver', '{daily,lists,health,pregnancy}', '{daily,lists}', array[:'XK1']::uuid[], false);
-- Données du foyer que la nounou ne doit pas voir (Max n'est pas confié ; document non partagé ; grossesse fermée)
insert into public.pregnancies (id, household_id, carrier_user_id, due_date) values (:'XP', :'XH', :'XM', current_date + 100);
insert into public.bottles (child_id, household_id, at, prepared_ml) values (:'XK2', :'XH', now() - interval '1 hour', 137);
insert into public.family_tasks (household_id, title, child_id, due_at, created_by) values (:'XH', 'Orthophoniste de Max', :'XK2', now() + interval '2 days', :'XO');
insert into public.family_events (household_id, title, child_id, starts_at, created_by) values (:'XH', 'Audience garde de Max', :'XK2', now() + interval '3 days', :'XO');
insert into public.appointments (household_id, child_id, title, starts_at, kind, created_by) values (:'XH', :'XK2', 'Pédopsychiatre Max', now() + interval '4 days', 'other', :'XO');
insert into public.appointments (household_id, pregnancy_id, title, starts_at, kind, created_by) values (:'XH', :'XP', 'Échographie T2', now() + interval '5 days', 'other', :'XO');
insert into public.documents (id, household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader, uploaded_by)
  values (:'XD', :'XH', 'report', 'Bilan de Camille', :'XH' || '/bilan.pdf', 'application/pdf', 100, false, :'XC');
insert into public.consents (user_id, purpose, granted) values (:'XO', 'document_reading', true);

-- ================================================================ S1. Export RGPD
set role authenticated; set request.jwt.claim.sub = :'XN';
select tests.ok(not jsonb_path_exists(public.export_my_data(),
  'strict $.** ? (@ == "Orthophoniste de Max" || @ == "Audience garde de Max" || @ == "Pédopsychiatre Max" || @ == "Échographie T2" || @ == "Bilan de Camille" || @ == 137 || @ == "Max")'),
  'S1 export : la nounou n''exporte ni l''enfant non confié, ni le document non partagé, ni la grossesse fermée');
select tests.ok(jsonb_path_exists(public.export_my_data(), 'strict $.** ? (@ == "Lou")'), 'S1 export : la nounou exporte encore l''enfant qui lui est confié');
set request.jwt.claim.sub = :'XL';
select tests.ok(not jsonb_path_exists(public.export_my_data(), 'strict $.** ? (@ == "Pédopsychiatre Max" || @ == "Bilan de Camille" || @ == "Orthophoniste de Max")'),
  'S1 export : un co-parent limité au quotidien n''exporte ni santé, ni documents, ni organisation');
set request.jwt.claim.sub = :'XO';
select tests.ok(jsonb_path_exists(public.export_my_data(), 'strict $.** ? (@ == "Pédopsychiatre Max")') and jsonb_path_exists(public.export_my_data(), 'strict $.** ? (@ == "Bilan de Camille")'),
  'S1 export : la propriétaire exporte toujours tout son foyer');
select tests.throws($$select public._export_my_data_raw()$$, 'S1 export : la version brute n''est pas appelable directement');
reset role;

-- ================================================================ S2. Inscription forcée d'un compte dans un foyer
set role authenticated; set request.jwt.claim.sub = :'XO';
select tests.throws(format($q$update public.household_members set user_id = %L where household_id = %L and user_id = %L$q$, :'XV', :'XH', :'XL'),
  'S2 membres : la propriétaire ne peut pas remplacer un membre par un autre compte');
select tests.ok(not exists (select 1 from public.household_member_names(:'XH') where user_id = :'XV') and not public.shares_household_with(:'XV'),
  'S2 membres : le compte visé n''apparaît pas dans le foyer (ni prénom, ni photo)');
select tests.throws(format($q$update public.household_members set household_id = (select household_id from public.household_members where user_id = %L and role = 'owner' and household_id <> %L limit 1) where household_id = %L and user_id = %L$q$, :'XO', :'XH', :'XH', :'XL'),
  'S2 membres : un membre ne change pas de foyer par une modification');
update public.household_members set can_view = '{daily,lists}' where household_id = :'XH' and user_id = :'XL';
select tests.ok((select can_view from public.household_members where household_id = :'XH' and user_id = :'XL') = '{daily,lists}', 'S2 membres : la propriétaire modifie toujours les droits');
update public.household_members set can_view = '{daily}' where household_id = :'XH' and user_id = :'XL';
reset role;

-- ================================================================ S3. Flux d'agenda d'une nounou
set role authenticated; set request.jwt.claim.sub = :'XN';
create temp table x97_feed as select token from public.create_calendar_feed(:'XH');
reset role; set request.jwt.claim.sub = '';
select tests.ok(not jsonb_path_exists(public.calendar_feed_data((select token from x97_feed)),
  'strict $.** ? (@ == "Orthophoniste de Max" || @ == "Audience garde de Max" || @ == "Pédopsychiatre Max" || @ == "Échographie T2")'),
  'S3 agenda : le flux de la nounou n''expose ni l''enfant non confié ni la grossesse fermée');
set role authenticated; set request.jwt.claim.sub = :'XO';
create temp table x97_feed_owner as select token from public.create_calendar_feed(:'XH');
reset role; set request.jwt.claim.sub = '';
select tests.ok(jsonb_path_exists(public.calendar_feed_data((select token from x97_feed_owner)), 'strict $.** ? (@ == "Pédopsychiatre Max")')
  and jsonb_path_exists(public.calendar_feed_data((select token from x97_feed_owner)), 'strict $.** ? (@ == "Échographie T2")'),
  'S3 agenda : le flux de la propriétaire garde tout');

-- ================================================================ S4. Porteuse de la grossesse
set role authenticated; set request.jwt.claim.sub = :'XC';
select tests.throws(format($q$update public.pregnancies set carrier_user_id = %L where id = %L$q$, :'XN', :'XP'),
  'S4 grossesse : un co-parent ne désigne pas la nounou comme porteuse');
select tests.throws(format($q$insert into public.pregnancies (household_id, carrier_user_id, due_date) values (%L, %L, current_date + 30)$q$, :'XH', :'XN'),
  'S4 grossesse : un co-parent ne crée pas une grossesse au nom de la nounou');
set request.jwt.claim.sub = :'XN';
select tests.ok(tests.count(format('select * from public.pregnancies where id = %L', :'XP')) = 0, 'S4 grossesse : toujours fermée à la nounou');
set request.jwt.claim.sub = :'XM';
select tests.ok(tests.count(format('select * from public.pregnancies where id = %L', :'XP')) = 1, 'S4 grossesse : la porteuse garde l''accès');
update public.pregnancies set due_date = due_date + 1 where id = :'XP';
set request.jwt.claim.sub = :'XO';
update public.pregnancies set carrier_user_id = :'XC' where id = :'XP';
update public.pregnancies set carrier_user_id = :'XM' where id = :'XP';
reset role;
select tests.ok((select carrier_user_id from public.pregnancies where id = :'XP') = :'XM', 'S4 grossesse : la propriétaire peut encore corriger la porteuse');

-- ================================================================ S5. Mission : auteur falsifié
set role authenticated; set request.jwt.claim.sub = :'XO';
create temp table x97_mission as select (public.create_mission(:'XH', 'Acheter du lait', :'XC')->>'id')::uuid as id;
grant select on x97_mission to authenticated;
set request.jwt.claim.sub = :'XC';
update public.family_tasks set created_by = auth.uid() where id = (select id from x97_mission);
select tests.ok((select created_by from public.family_tasks where id = (select id from x97_mission)) = :'XO', 'S5 mission : le destinataire ne devient pas l''auteur');
select tests.throws($$select public.mission_respond((select id from x97_mission), 'cancel')$$, 'S5 mission : le destinataire ne peut toujours pas l''annuler');
insert into public.family_tasks (household_id, title, created_by) values (:'XH', 'Tâche signée par une autre', :'XO');
select tests.ok((select created_by from public.family_tasks where title = 'Tâche signée par une autre') = :'XC', 'S5 tâches : l''auteur d''une nouvelle tâche est la personne connectée');
reset role;
select tests.ok((select created_by from public.family_tasks where title = 'Orthophoniste de Max') = :'XO', 'S5 tâches : le serveur garde l''auteur qu''il pose');

-- ================================================================ S6. Document : déposant figé
set role authenticated; set request.jwt.claim.sub = :'XO';
update public.documents set uploaded_by = auth.uid() where id = :'XD';
select tests.throws(format($q$update public.documents set uploaded_by = auth.uid(), private_to_uploader = true where id = %L$q$, :'XD'),
  'S6 documents : la propriétaire ne rend pas privé à elle-même le document d''un co-parent');
reset role;
select tests.ok((select uploaded_by from public.documents where id = :'XD') = :'XC', 'S6 documents : la propriétaire ne s''approprie pas le document d''un co-parent');
set role authenticated; set request.jwt.claim.sub = :'XC';
select tests.ok(tests.count(format('select * from public.documents where id = %L', :'XD')) = 1, 'S6 documents : le déposant voit toujours son document');
reset role;

-- ================================================================ S7. Auteurs des saisies (générique)
do $$
declare r record; j record; n bigint; leaks text[] := '{}';
begin
  for r in select c.relname, a.attname from pg_class c join pg_attribute a on a.attrelid = c.oid
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not a.attisdropped and a.atttypid = 'uuid'::regtype
             and (a.attname in ('created_by', 'uploaded_by', 'logged_by', 'invited_by') or (c.relname = 'kid_routine_checks' and a.attname = 'done_by'))
             and exists (select 1 from pg_attribute h where h.attrelid = c.oid and h.attname = 'household_id' and not h.attisdropped)
             and exists (select 1 from pg_attribute h where h.attrelid = c.oid and h.attname = 'id' and not h.attisdropped)
           order by 1, 2 loop
    execute format($q$select t.id::text as rid, t.%1$I as who, (select m.user_id from public.household_members m where m.household_id = t.household_id and m.user_id <> t.%1$I limit 1) as other
                      from public.%2$I t where t.%1$I is not null and exists (select 1 from public.household_members m where m.household_id = t.household_id and m.user_id = t.%1$I)
                        and exists (select 1 from public.household_members m where m.household_id = t.household_id and m.user_id <> t.%1$I) limit 1$q$, r.attname, r.relname) into j;
    continue when j.rid is null;
    n := 0;
    begin
      perform set_config('request.jwt.claim.sub', j.who::text, true);
      set local role authenticated;
      execute format('update public.%I set %I = $1 where id::text = $2', r.relname, r.attname) using j.other, j.rid;
      reset role;
      execute format('select count(*) from public.%I where id::text = $2 and %I = $1', r.relname, r.attname) using j.other, j.rid into n;
      raise exception 'tests_rollback';
    exception when others then if sqlerrm <> 'tests_rollback' then n := 0; end if;
    end;
    reset role;
    if n > 0 then leaks := leaks || (r.relname || '.' || r.attname); end if;
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
  perform tests.ok(cardinality(leaks) = 0, 'S7 auteurs : aucune saisie du foyer ne change d''auteur par une modification', array_to_string(leaks, ', '));
end $$;

-- ================================================================ S8. create_mission rejoué avec un client_id d'une mission invisible
set role authenticated; set request.jwt.claim.sub = :'XO';
select public.create_mission(:'XH', 'Rendez-vous secret de Max', :'XC', 'appointments', null, null, false, 'normal', null, :'XK2', null, null, null, null, null, :'XT');
set request.jwt.claim.sub = :'XN';
select tests.throws(format($q$select public.create_mission(%L, 'x', null, 'other', null, null, false, 'normal', null, null, null, null, null, null, null, %L)$q$, :'XH', :'XT'),
  'S8 missions : un client_id déjà pris par une mission invisible ne la révèle pas');
reset role;

-- ================================================================ S9. Fonctions security definer et visiteur sans compte
select tests.ok(not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef and p.prorettype <> 'trigger'::regtype
    and has_function_privilege('anon', p.oid, 'execute')
    and p.proname not in ('has_role', 'has_premium', 'premium_strict', 'assistant_paid', 'premium_article_teasers', 'is_blocked_between')),
  'S9 fonctions : seules les fonctions nécessaires aux politiques publiques restent exécutables sans compte',
  (select string_agg(p.oid::regprocedure::text, ', ') from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef and p.prorettype <> 'trigger'::regtype
     and has_function_privilege('anon', p.oid, 'execute')
     and p.proname not in ('has_role', 'has_premium', 'premium_strict', 'assistant_paid', 'premium_article_teasers', 'is_blocked_between')));
set role anon; set request.jwt.claim.sub = '';
select tests.ok(tests.count('select * from public.articles') > 0, 'S9 fonctions : les articles publics restent lisibles sans compte');
reset role;
