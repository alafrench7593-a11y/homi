-- =====================================================================
-- Tests de sécurité et de parcours (exécutés en tant que chaque utilisateur)
-- =====================================================================
\set CAMILLE '11111111-1111-4111-8111-111111111111'
\set ALEX    '22222222-2222-4222-8222-222222222222'
\set ZOE     '33333333-3333-4333-8333-333333333333'
\set FAMILLE 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
\set LINA    'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
\set GROSSESSE 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

-- ---------------------------------------------------------------- Inscription
select tests.ok((select count(*) from public.profiles where id = :'ZOE') = 1, 'inscription : profil créé automatiquement');
select tests.ok((select count(*) from public.privacy_settings where user_id = :'ZOE') = 1, 'inscription : paramètres de confidentialité créés');

-- ================================================================ ZOÉ
set role authenticated; set request.jwt.claim.sub = :'ZOE';

select tests.ok((select count(*) from public.profiles) = 1, 'isolation : Zoé ne voit que son propre profil');
select tests.ok(tests.count('select * from public.children') = 0, 'isolation : Zoé ne voit aucun enfant d''un autre foyer');
select tests.ok(tests.count('select * from public.pregnancies') = 0, 'isolation : Zoé ne voit aucune grossesse d''un autre foyer');
select tests.ok(tests.count('select * from public.bottles') = 0, 'isolation : Zoé ne voit aucun biberon d''un autre foyer');
select tests.ok(tests.count('select * from public.households where created_by <> auth.uid()') = 0, 'isolation : Zoé ne voit aucun foyer étranger');

-- Création d'un foyer, d'une grossesse et de plusieurs enfants
create temp table zoe_ctx as select public.create_household('Foyer de Zoé') as hid;
grant select on zoe_ctx to authenticated;
select tests.ok(tests.count('select * from public.household_members where user_id = auth.uid() and role = ''owner'' and household_id = (select hid from zoe_ctx)') = 1, 'foyer : la créatrice devient propriétaire');

insert into public.pregnancies (household_id, carrier_user_id, due_date, multiplicity)
  select hid, auth.uid(), current_date + 150, 'single' from zoe_ctx;
select tests.ok(tests.count('select * from public.pregnancies') = 1, 'grossesse : création et lecture par la propriétaire');
select tests.throws($$insert into public.pregnancies (household_id, due_date) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date + 100)$$,
  'grossesse : impossible d''en créer une dans un foyer étranger');
select tests.throws($$insert into public.pregnancies (household_id, due_date, lmp_date) select hid, current_date, current_date + 1 from zoe_ctx$$,
  'grossesse : date des dernières règles postérieure au terme refusée');

insert into public.children (household_id, first_name, birth_date) select hid, 'Iris', current_date - 30 from zoe_ctx;
insert into public.children (household_id, first_name, birth_date, sex) select hid, 'Malo', current_date - 900, 'male' from zoe_ctx;
select tests.ok(tests.count('select * from public.children') = 2, 'enfants : création de plusieurs profils');

-- Usurpation : rattacher un biberon à l'enfant d'un autre foyer
select tests.throws($$insert into public.bottles (child_id, household_id, at, prepared_ml) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', (select hid from zoe_ctx), now(), 120)$$,
  'usurpation : biberon sur l''enfant d''un autre foyer refusé (household_id recalculé)');
select tests.throws($$insert into public.appointments (household_id, child_id, kind, title, starts_at) select hid, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'pediatric', 'x', now() from zoe_ctx$$,
  'usurpation : rendez-vous référant un enfant étranger refusé');

-- Poids pendant la grossesse (donnée personnelle)
insert into public.maternal_weights (measured_on, weight_kg, note) values (current_date, 68.4, 'Avant le rendez-vous');
select tests.ok(tests.count('select * from public.maternal_weights') = 1, 'poids : ajout et lecture par la personne concernée');
select tests.throws($$insert into public.maternal_weights (user_id, measured_on, weight_kg) values ('11111111-1111-4111-8111-111111111111', current_date, 70)$$,
  'poids : impossible d''écrire au nom d''une autre personne');

-- Humeur : bilan facultatif personnel
insert into public.mood_checkins (mood, feelings, journal) values (2, '{fatigue,solitude}', 'Nuit difficile');

-- Communauté : pseudonyme obligatoire, filtres et données personnelles
select tests.throws($$insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug='grossesse'), 'Bonjour à toutes', 'Premier message')$$,
  'communauté : publication impossible sans pseudonyme');
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Zoé_en_attente', 'Lyon');
insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug='grossesse'), 'Bonjour à toutes', 'Premier message de Zoé');
select tests.ok(tests.count('select * from public.forum_feed where is_mine') = 1, 'communauté : création d''une publication');
select tests.throws($$insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug='grossesse'), 'Promo', 'Gagnez au casino')$$,
  'modération : terme bloquant refusé');
insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug='grossesse'), 'Contact', 'Appelez-moi au 06 12 34 56 78');
select tests.ok((select status from public.posts where body like 'Appelez-moi%') = 'pending_review', 'modération : numéro de téléphone mis en relecture');
select tests.throws($$update public.posts set status = 'visible' where body like 'Appelez-moi%'$$, 'modération : l''autrice ne peut pas se republier elle-même');

-- Abonnement : le client ne peut pas s'attribuer de droits
select tests.ok(not public.has_premium(), 'abonnement : Zoé n''est pas premium');
select tests.throws($$insert into public.subscriptions (user_id, status, expires_at) values (auth.uid(), 'active', now() + interval '1 year')$$,
  'abonnement : impossible de s''attribuer un abonnement côté client');
select tests.throws($$select * from public.consume_assistant_quota(auth.uid())$$, 'abonnement : quota assistant non manipulable par le client');
select tests.throws($$insert into public.assistant_messages (conversation_id, role, content) values (gen_random_uuid(), 'assistant', 'faux')$$,
  'assistant : le client ne peut pas fabriquer une réponse');

-- Invitation coparent (Zoé invite Camille)
select tests.set_premium(auth.uid(), true);
create temp table zoe_inv as select public.create_household_invitation((select hid from zoe_ctx), 'coparent', array['daily','profile'], array['daily']) as token;
select tests.set_premium(auth.uid(), false);
grant select on zoe_inv to authenticated;
reset role;

-- ================================================================ CAMILLE
set role authenticated; set request.jwt.claim.sub = :'CAMILLE';
select tests.ok(tests.count('select * from public.maternal_weights') = 0, 'isolation : Camille ne voit pas le poids de Zoé');
select tests.ok(tests.count('select * from public.mood_checkins') = 0, 'isolation : Camille ne voit pas le journal émotionnel de Zoé');
select tests.ok(tests.count('select * from public.children') = 2, 'isolation : Camille ne voit que les enfants de son foyer');
select tests.throws($$select public.create_household_invitation((select hid from zoe_ctx))$$, 'invitation : seul le propriétaire du foyer peut inviter');
select tests.ok(public.accept_household_invitation((select token from zoe_inv)) = (select hid from zoe_ctx), 'invitation : acceptation avec le jeton');
select tests.ok(tests.count('select * from public.children') = 4, 'invitation : Camille voit désormais les enfants du foyer de Zoé');
select tests.ok(tests.count('select * from public.pregnancies where household_id = (select hid from zoe_ctx)') = 0, 'permissions : domaine « grossesse » non accordé → invisible');
select tests.throws($$select public.accept_household_invitation((select token from zoe_inv))$$, 'invitation : jeton à usage unique');

-- Rappels : création, modification, désactivation
insert into public.reminders (household_id, child_id, category, title, schedule)
values (:'FAMILLE', :'LINA', 'bottle', 'Biberon de Lina', '{"type":"interval","minutes":180,"from_hour":6,"to_hour":22}');
select tests.ok(tests.count('select * from public.reminders') = 1, 'rappel : création');
update public.reminders set schedule = '{"type":"daily","hour":7,"minute":30}', title = 'Biberon du matin' where title = 'Biberon de Lina';
select tests.ok((select title from public.reminders) = 'Biberon du matin', 'rappel : modification');
update public.reminders set enabled = false;
select tests.ok((select not enabled from public.reminders), 'rappel : désactivation (annulation)');
select tests.throws($$insert into public.reminders (category, title, schedule) values ('custom','x','{"type":"yearly"}')$$, 'rappel : planification invalide refusée');

-- Documents : métadonnées + fichier privé
insert into storage.objects (bucket_id, name) values ('documents', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/echo-t2.pdf');
-- partage avec le foyer : choix explicite (les documents sont privés par défaut depuis documents v2)
insert into public.documents (household_id, pregnancy_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
values (:'FAMILLE', :'GROSSESSE', 'ultrasound', 'Échographie T2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/echo-t2.pdf', 'application/pdf', 204800, false);
insert into storage.objects (bucket_id, name) values ('documents', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/prise-de-sang.pdf');
insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
values (:'FAMILLE', 'blood_test', 'Prise de sang (privée)', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/prise-de-sang.pdf', 'application/pdf', 1000, true);
select tests.ok(tests.count('select * from public.documents') = 2, 'documents : dépôt');
select tests.throws($$insert into public.documents (household_id, category, title, storage_path, mime_type, size_bytes) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','other','virus','x.exe','application/x-msdownload',10)$$,
  'documents : type de fichier non autorisé refusé');
select tests.throws($$insert into storage.objects (bucket_id, name) select 'documents', hid || '/intrus.pdf' from zoe_ctx$$,
  'documents : dépôt de fichier refusé dans un foyer où l''on n''a pas le droit d''écrire les documents');

reset role;
