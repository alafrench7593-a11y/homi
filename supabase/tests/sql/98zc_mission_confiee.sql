-- =====================================================================
-- Notification de nouvelle mission (20261122000100_mission_confiee.sql) : « <Prénom> t’a confié une mission »,
-- dans la langue du destinataire, sans le contenu de la mission quand la discrétion est active (défaut).
-- =====================================================================
\set OW 'e22c0000-0000-4000-8000-000000000001'
\set CP 'e22c0000-0000-4000-8000-000000000002'
\set H  'e22c0000-0000-4000-8000-0000000000a1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'zc-lea@exemple.test'), (:'CP', 'zc-sam@exemple.test');
update public.profiles set display_name = '  Léa   Martin ' where id = :'OW';
update public.profiles set display_name = 'Sam', locale = 'fr' where id = :'CP';
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zc', :'OW');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'H', :'CP', 'coparent', '{daily,lists}', '{daily,lists}');
select tests.set_premium(:'OW', true);
create temp table zc (k text primary key, id uuid);
grant all on zc to authenticated;

-- ---------------------------------------------------------------- textes (fonction pure)
select tests.ok((public._mission_entrusted_text('fr', 'Léa', 'Acheter du lait', false)).title = 'Léa t’a confié une mission'
  and (public._mission_entrusted_text('fr', 'Léa', 'Acheter du lait', false)).body = 'Ouvre HOMI pour répondre quand tu peux.',
  'mission confiée : français, tutoiement, aucun contenu quand la discrétion est active');
select tests.ok((public._mission_entrusted_text('fr', 'Léa', 'Acheter du lait', true)).body = 'Acheter du lait',
  'mission confiée : le titre de la mission en texte seulement si le détail est autorisé');
select tests.ok((public._mission_entrusted_text('en', 'Léa', 'x', false)).title = 'Léa has entrusted you with a mission'
  and (public._mission_entrusted_text('es', 'Léa', 'x', false)).title = 'Léa te ha confiado una misión'
  and (public._mission_entrusted_text('de', 'Léa', 'x', false)).title = 'Léa hat dir einen Auftrag anvertraut'
  and (public._mission_entrusted_text('it', 'Léa', 'x', false)).title = 'Léa ti ha affidato una missione'
  and (public._mission_entrusted_text(null, 'Léa', 'x', false)).title = 'Léa t’a confié une mission',
  'mission confiée : cinq langues (français par défaut)');
select tests.ok((public._mission_entrusted_text('fr', null, 'x', false)).title = 'On t’a confié une mission'
  and (public._mission_entrusted_text('en', null, 'x', false)).title = 'You’ve been entrusted with a mission',
  'mission confiée : sans prénom affiché, une tournure sans nom');
select tests.ok(not has_function_privilege('authenticated', 'public._mission_entrusted_text(text, text, text, boolean)', 'execute'),
  'mission confiée : fonction interne, non appelable par un compte');

-- ---------------------------------------------------------------- consommateur : discrétion par défaut
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into zc select 'A', (public.create_mission(:'H', 'Prendre rendez-vous chez le pédiatre', :'CP', 'health') ->> 'id')::uuid;
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and payload ->> 'task_id' = (select id::text from zc where k = 'A')
  and title = 'Léa t’a confié une mission' and body = 'Ouvre HOMI pour répondre quand tu peux.' and payload ->> 'entrusted' = 'true') = 1,
  'nouvelle mission : « Léa t’a confié une mission » (prénom affiché, premier mot)');
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and (title like '%pédiatre%' or body like '%pédiatre%')) = 0,
  'nouvelle mission : discrétion active par défaut → aucun contenu de la mission dans la notification');
select tests.ok((select count(*) from public.notifications where user_id = :'OW') = 0, 'nouvelle mission : rien pour la personne qui confie');

-- ---------------------------------------------------------------- détail autorisé, puis langue du destinataire
insert into public.notification_settings (user_id, lockscreen_details) values (:'CP', true)
  on conflict (user_id) do update set lockscreen_details = true;
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into zc select 'B', (public.create_mission(:'H', 'Acheter du lait', :'CP', 'shopping') ->> 'id')::uuid;
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and payload ->> 'task_id' = (select id::text from zc where k = 'B')
  and title = 'Léa t’a confié une mission' and body = 'Acheter du lait') = 1,
  'nouvelle mission : détail autorisé → la mission en texte, jamais dans le titre');
update public.profiles set locale = 'en' where id = :'CP';
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into zc select 'C', (public.create_mission(:'H', 'Sortir les poubelles', :'CP', 'housework') ->> 'id')::uuid;
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and payload ->> 'task_id' = (select id::text from zc where k = 'C')
  and title = 'Léa has entrusted you with a mission') = 1, 'nouvelle mission : dans la langue du destinataire');
-- les autres événements gardent leurs textes
set role authenticated; set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from zc where k = 'C'), 'accept');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title = 'Mission acceptée : Sortir les poubelles') = 1,
  'mission acceptée : texte inchangé');

-- ---------------------------------------------------------------- idempotence : la migration se rejoue sans erreur ni doublon
\ir ../../migrations/20261122000100_mission_confiee.sql
select tests.ok((select count(*) from pg_proc where proname = '_mission_entrusted_text') = 1
  and (select count(*) from public.notifications where user_id = :'CP' and payload ->> 'mission' = 'mission.requested') = 3,
  'migration rejouée : une seule fonction, aucune notification ajoutée');
reset role;
