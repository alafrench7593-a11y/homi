-- =====================================================================
-- Angles morts de confidentialité (20261123000100_confidentialite_rappels_couple.sql) et marque (20261123000200).
-- Comptes : Camille (propriétaire), Sam (co-parent), Zoé (nounou), Mamie (grand-parent invitée, rôle « caregiver »),
-- Alex (ancien co-parent, retiré du foyer), Intrus (personne extérieure).
-- =====================================================================
\set OW 'e0c30000-0000-4000-8000-000000000001'
\set CP 'e0c30000-0000-4000-8000-000000000002'
\set NN 'e0c30000-0000-4000-8000-000000000003'
\set GP 'e0c30000-0000-4000-8000-000000000004'
\set EX 'e0c30000-0000-4000-8000-000000000005'
\set XO 'e0c30000-0000-4000-8000-000000000006'
\set H  'e0c30000-0000-4000-8000-0000000000a1'
\set HX 'e0c30000-0000-4000-8000-0000000000a2'
\set K  'e0c30000-0000-4000-8000-0000000000c1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'ze-camille@exemple.test'), (:'CP', 'ze-sam@exemple.test'), (:'NN', 'ze-zoe@exemple.test'),
  (:'GP', 'ze-mamie@exemple.test'), (:'EX', 'ze-alex@exemple.test'), (:'XO', 'ze-intrus@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer ze', :'OW'), (:'HX', 'Autre foyer ze', :'XO');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'HX', :'XO', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K', :'H', 'Lina', current_date - 200);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,names,profile}', '{daily,health,lists}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,lists,names,profile}', '{daily,health,lists}', null),
  (:'H', :'NN', 'caregiver', '{daily,health,lists}', '{daily,lists}', array[:'K']::uuid[]),
  (:'H', :'GP', 'caregiver', '{daily,health,lists,documents,profile}', '{daily,lists}', null);

-- Rappels de Camille : santé personnelle partagée, rappels du foyer partagés, rappel non partagé
insert into public.reminders (user_id, household_id, child_id, category, title, schedule, deep_link, shared) values
  (:'OW', :'H', null, 'custom',     'ze Pilule',            '{"type":"daily","hour":21,"minute":0}', '/contraception', true),
  (:'OW', :'H', null, 'medication', 'ze Traitement perso',  '{"type":"daily","hour":8,"minute":0}',  '/medications?who=me&dose=08%3A00', true),
  (:'OW', :'H', null, 'tracking',   'ze Noter mes règles',  '{"type":"daily","hour":20,"minute":0}', '/cycle', true),
  (:'OW', :'H', :'K', 'bottle',     'ze Biberon de Lina',   '{"type":"daily","hour":7,"minute":0}',  '/', true),
  (:'OW', :'H', null, 'custom',     'ze Sortir les poubelles', '{"type":"weekly","weekdays":[2],"hour":20,"minute":0}', '/', true),
  (:'OW', :'H', null, 'custom',     'ze Pilule secrète',    '{"type":"daily","hour":21,"minute":0}', '/contraception', false);
-- Point de couple de la semaine, ressenti privé de Sam
insert into public.couple_checkins (household_id, week_of, heavy, decisions, thanks, created_by) values (:'H', date_trunc('week', current_date)::date, 'ze lourd', 'ze décisions', 'ze merci', :'OW');
insert into public.couple_feelings (user_id, feelings, note) values (:'CP', '{tired}', 'ze ressenti de Sam');
select tests.set_premium(:'OW', true);

-- Message « Se comprendre » de Camille à Sam et à Alex (avant son départ)
set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.couple_send(:'H', :'CP', 'share', 'ze message pour Sam')).id is not null as sent \gset
select (public.couple_send(:'H', :'EX', 'share', 'ze message pour Alex')).id is not null as sent_ex \gset
reset role;
-- Alex quitte le foyer (ancien membre)
delete from public.household_members where household_id = :'H' and user_id = :'EX';

-- ================================================================ structure
select tests.ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reminders'
  and policyname = 'reminders_personal_health_parents' and permissive = 'RESTRICTIVE' and cmd = 'SELECT'),
  'rappels santé : verrou restrictif « parents seulement » en place');
select tests.ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'couple_checkins'
  and policyname = 'couple_checkins_active_parents' and permissive = 'RESTRICTIVE'),
  'point de couple : verrou restrictif « adultes actifs » en place');
select tests.ok(public._reminder_is_personal_health('custom', null, null, null, '/contraception')
  and public._reminder_is_personal_health('medication', null, null, null, '/')
  and public._reminder_is_personal_health('tracking', null, null, null, '/fertility/pma?med=1')
  and not public._reminder_is_personal_health('medication', :'K', null, null, '/medications')
  and not public._reminder_is_personal_health('bottle', :'K', null, null, '/')
  and not public._reminder_is_personal_health('custom', null, null, null, '/'),
  'rappels santé : pilule, cycle, PMA, traitement personnel reconnus ; rappels de l''enfant et du foyer non visés');
select tests.ok(not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'
  and tablename in ('reminders', 'couple_checkins', 'couple_feelings')),
  'temps réel : rappels, point de couple et ressentis jamais publiés');
select tests.ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'couple_messages')
  and (select relreplident = 'd' from pg_class where oid = 'public.couple_messages'::regclass),
  'temps réel : couple_messages publiée avec l''identité par défaut (une suppression ne transporte que l''identifiant)');
select tests.ok((select array_agg(policyname::text order by policyname) from pg_policies where schemaname = 'public' and tablename = 'couple_feelings')
  = array['couple_feelings_owner'] and (select qual from pg_policies where tablename = 'couple_feelings' and policyname = 'couple_feelings_owner') = '(user_id = auth.uid())',
  'Se comprendre : ressentis lisibles par leur autrice seule (une seule politique)');
select tests.ok(not has_table_privilege('anon', 'public.couple_feelings', 'select') and not has_table_privilege('anon', 'public.couple_messages', 'select')
  and not has_table_privilege('authenticated', 'public.couple_messages', 'insert') and not has_table_privilege('authenticated', 'public.couple_messages', 'update'),
  'Se comprendre : aucune lecture anonyme ; messages écrits seulement par couple_send()');

-- ================================================================ rappels partagés
set role authenticated;
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.reminders where title like ''ze %''') = 6, 'rappels : Camille voit tous ses rappels');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.reminders where title like ''ze %''') = 5
  and tests.count('select * from public.reminders where title = ''ze Pilule''') = 1
  and tests.count('select * from public.reminders where title = ''ze Pilule secrète''') = 0,
  'rappels : l''autre parent voit ce que Camille a partagé (pilule comprise), jamais ce qu''elle n''a pas partagé');
do $$
declare who uuid; n bigint;
begin
  foreach who in array array['e0c30000-0000-4000-8000-000000000003', 'e0c30000-0000-4000-8000-000000000004',
                             'e0c30000-0000-4000-8000-000000000005', 'e0c30000-0000-4000-8000-000000000006']::uuid[] loop
    perform set_config('request.jwt.claim.sub', who::text, true);
    select count(*) into n from public.reminders where title in ('ze Pilule', 'ze Traitement perso', 'ze Noter mes règles', 'ze Pilule secrète');
    perform tests.ok(n = 0, 'rappels santé : invisibles pour ' || case who
      when 'e0c30000-0000-4000-8000-000000000003' then 'la nounou' when 'e0c30000-0000-4000-8000-000000000004' then 'la grand-mère invitée'
      when 'e0c30000-0000-4000-8000-000000000005' then 'l''ancien membre' else 'une personne extérieure' end);
  end loop;
end $$;

-- Défense en profondeur : même SANS le verrou nounou (20261121000200), la nature « santé » suffit à fermer la lecture.
reset role;
begin;
drop policy reminders_caregiver_closed on public.reminders;
set local role authenticated;
set local request.jwt.claim.sub = :'GP';
select count(*) filter (where title in ('ze Pilule', 'ze Traitement perso', 'ze Noter mes règles')) as gp_health,
       count(*) filter (where title = 'ze Sortir les poubelles') as gp_other
  from public.reminders \gset
rollback;
select tests.ok(:gp_health = 0, 'rappels santé : fermés à un rôle non parent même sans le verrou par rôle (règle attachée à la nature du rappel)');
select tests.ok(:gp_other = 1, 'rappels santé : le verrou ne vise que la santé personnelle (les autres rappels partagés suivent la règle du foyer)');
select tests.ok(exists (select 1 from pg_policies where tablename = 'reminders' and policyname = 'reminders_caregiver_closed'),
  'rappels : verrou nounou rétabli après la vérification');

-- ================================================================ point de couple (bilan commun des deux parents)
set role authenticated;
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.couple_checkins where heavy = ''ze lourd''') = 1, 'point de couple : Camille le lit');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.couple_checkins where heavy = ''ze lourd''') = 1, 'point de couple : Sam (autre parent) le lit — bilan commun');
update public.couple_checkins set thanks = 'ze merci de Sam' where heavy = 'ze lourd';
select tests.ok(tests.count('select * from public.couple_checkins where thanks = ''ze merci de Sam''') = 1, 'point de couple : Sam le complète');
do $$
declare who uuid; n bigint;
begin
  foreach who in array array['e0c30000-0000-4000-8000-000000000003', 'e0c30000-0000-4000-8000-000000000004',
                             'e0c30000-0000-4000-8000-000000000005', 'e0c30000-0000-4000-8000-000000000006']::uuid[] loop
    perform set_config('request.jwt.claim.sub', who::text, true);
    select count(*) into n from public.couple_checkins where heavy = 'ze lourd';
    perform tests.ok(n = 0, 'point de couple : invisible pour ' || case who
      when 'e0c30000-0000-4000-8000-000000000003' then 'la nounou' when 'e0c30000-0000-4000-8000-000000000004' then 'la grand-mère invitée'
      when 'e0c30000-0000-4000-8000-000000000005' then 'l''ancien membre' else 'une personne extérieure' end);
  end loop;
end $$;
set request.jwt.claim.sub = :'NN';
select tests.throws($$insert into public.couple_checkins (household_id, week_of, heavy) values ('e0c30000-0000-4000-8000-0000000000a1', current_date + 7, 'nounou')$$,
  'point de couple : la nounou ne peut pas en écrire');
set request.jwt.claim.sub = :'EX';
update public.couple_checkins set heavy = 'modifié par Alex' where household_id = :'H';
reset role;
select tests.ok(not exists (select 1 from public.couple_checkins where heavy = 'modifié par Alex'), 'point de couple : l''ancien membre ne peut plus le modifier');

-- ================================================================ Se comprendre
set role authenticated;
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.couple_feelings where note = ''ze ressenti de Sam''') = 1, 'ressenti : Sam relit le sien');
select tests.ok(tests.count('select * from public.couple_messages where body = ''ze message pour Sam''') = 1, 'message : le destinataire le lit');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.couple_feelings where note = ''ze ressenti de Sam''') = 0, 'ressenti : l''autre parent ne lit pas le ressenti privé');
select tests.ok(tests.count('select * from public.couple_messages where body like ''ze message pour %''') = 2, 'message : l''autrice relit ses messages');
do $$
declare who uuid; n bigint; f bigint;
begin
  foreach who in array array['e0c30000-0000-4000-8000-000000000003', 'e0c30000-0000-4000-8000-000000000004',
                             'e0c30000-0000-4000-8000-000000000005', 'e0c30000-0000-4000-8000-000000000006']::uuid[] loop
    perform set_config('request.jwt.claim.sub', who::text, true);
    select count(*) into n from public.couple_messages where body like 'ze message pour %';
    select count(*) into f from public.couple_feelings where note like 'ze %';
    perform tests.ok(n = 0 and f = 0, 'Se comprendre : messages et ressentis invisibles pour ' || case who
      when 'e0c30000-0000-4000-8000-000000000003' then 'la nounou' when 'e0c30000-0000-4000-8000-000000000004' then 'la grand-mère invitée'
      when 'e0c30000-0000-4000-8000-000000000005' then 'l''ancien membre (même destinataire d''un message)' else 'une personne extérieure' end);
  end loop;
end $$;
set request.jwt.claim.sub = :'NN';
select tests.throws($$select public.couple_send('e0c30000-0000-4000-8000-0000000000a1', 'e0c30000-0000-4000-8000-000000000001', 'share', 'nounou')$$,
  'Se comprendre : la nounou ne peut pas écrire dans l''espace du couple');
set request.jwt.claim.sub = :'OW';
select tests.throws($$select public.couple_send('e0c30000-0000-4000-8000-0000000000a1', 'e0c30000-0000-4000-8000-000000000004', 'share', 'pour mamie')$$,
  'Se comprendre : impossible d''écrire à la grand-mère invitée (adultes du couple seulement)');
select tests.throws($$select public.couple_send('e0c30000-0000-4000-8000-0000000000a1', 'e0c30000-0000-4000-8000-000000000005', 'share', 'pour Alex parti')$$,
  'Se comprendre : impossible d''écrire à un ancien membre');
reset role;

-- ================================================================ idempotence et marque
\ir ../../migrations/20261123000100_confidentialite_rappels_couple.sql
\ir ../../migrations/20261123000200_marque_homi_articles.sql
select tests.ok((select count(*) from pg_policies where tablename = 'reminders' and policyname = 'reminders_personal_health_parents') = 1
  and (select count(*) from pg_policies where tablename = 'couple_checkins' and policyname = 'couple_checkins_active_parents') = 1,
  'migration de confidentialité rejouée sans doublon');
select tests.ok(not exists (select 1 from public.articles a where to_jsonb(a)::text like '%Au fil de nous%'),
  'marque : plus aucun article ne mentionne l''ancienne marque');
