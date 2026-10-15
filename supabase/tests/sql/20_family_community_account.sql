\set CAMILLE '11111111-1111-4111-8111-111111111111'
\set ALEX    '22222222-2222-4222-8222-222222222222'
\set ZOE     '33333333-3333-4333-8333-333333333333'
\set FAMILLE 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
\set LINA    'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

-- ================================================================ ALEX (coparent : voit tout, écrit le quotidien)
set role authenticated; set request.jwt.claim.sub = :'ALEX';

-- Suivi quotidien
insert into public.bottles (child_id, household_id, at, prepared_ml, consumed_ml, milk_type)
values (:'LINA', :'FAMILLE', now(), 150, 120, 'Lait 2e âge');
insert into public.diapers (child_id, household_id, at, wet, stool) values (:'LINA', :'FAMILLE', now(), true, true);
select tests.ok(tests.count('select * from public.bottles where child_id = ''cccccccc-cccc-4ccc-8ccc-cccccccccccc''') = 2, 'biberon : ajout par le coparent et historique (2 entrées)');
select tests.ok(tests.count('select * from public.diapers') = 2, 'couche : ajout par le coparent');
select tests.throws($$insert into public.bottles (child_id, household_id, at, prepared_ml, consumed_ml) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now(), 100, 150)$$,
  'biberon : quantité bue supérieure à la quantité préparée refusée');
select tests.throws($$insert into public.diapers (child_id, household_id, at) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now())$$,
  'couche : entrée vide refusée');

-- Sommeil : démarrage, arrêt, un seul sommeil en cours
insert into public.sleeps (child_id, household_id, started_at) values (:'LINA', :'FAMILLE', now() - interval '40 minutes');
select tests.throws($$insert into public.sleeps (child_id, household_id, started_at) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now())$$,
  'sommeil : un seul sommeil en cours par enfant');
update public.sleeps set ended_at = now() where child_id = :'LINA' and ended_at is null;
select tests.ok(tests.count('select * from public.sleeps where ended_at is null') = 0, 'sommeil : arrêt enregistré');
select tests.throws($$update public.sleeps set ended_at = started_at - interval '1 minute' where child_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  'sommeil : fin antérieure au début refusée');

-- Idempotence hors connexion : renvoyer la même entrée ne crée pas de doublon
insert into public.bottles (client_id, child_id, household_id, at, prepared_ml) values ('99999999-9999-4999-8999-999999999999', :'LINA', :'FAMILLE', now(), 90)
  on conflict (client_id) do nothing;
insert into public.bottles (client_id, child_id, household_id, at, prepared_ml) values ('99999999-9999-4999-8999-999999999999', :'LINA', :'FAMILLE', now(), 90)
  on conflict (client_id) do nothing;
select tests.ok(tests.count('select * from public.bottles where client_id = ''99999999-9999-4999-8999-999999999999''') = 1, 'hors connexion : synchronisation idempotente (pas de doublon)');

-- Permissions du coparent
select tests.ok(tests.count('select * from public.child_measurements') = 3, 'coparent : lecture des mesures (domaine santé en lecture)');
select tests.throws($$insert into public.child_measurements (child_id, household_id, measured_on, weight_kg) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date, 10.2)$$,
  'coparent : écriture des mesures refusée sans permission « santé »');
select tests.ok(tests.count('select * from public.documents') = 1, 'coparent : document privé de Camille invisible, document partagé visible');
select tests.ok(tests.count('select * from storage.objects where name like ''%prise-de-sang%''') = 0, 'coparent : fichier privé inaccessible dans le stockage');
select tests.ok(tests.count('select * from storage.objects where name like ''%echo-t2%''') = 1, 'coparent : fichier partagé accessible (URL signée possible)');
update public.household_members set can_edit = array['daily','health','documents','pregnancy','lists','names','profile'] where user_id = auth.uid();
select tests.ok((select not ('health' = any(can_edit)) from public.household_members where user_id = :'ALEX' and household_id = :'FAMILLE'),
  'coparent : impossible de s''attribuer soi-même des droits');
select tests.ok(tests.count('select * from public.reminders') = 0, 'isolation : Alex ne voit pas les rappels personnels de Camille');
select tests.ok(tests.count('select * from public.notifications') = 0, 'isolation : boîte de notifications vide pour Alex');

-- Commentaire sur la publication de Camille -> notification
insert into public.community_profiles (user_id, pseudonym) values (auth.uid(), 'Alex_P') on conflict (user_id) do nothing;
insert into public.comments (post_id, body)
  values ((select id from public.posts where title like 'Vos astuces%'), 'Un tableau de relais pour les nuits nous a sauvés !');
select tests.ok((select comment_count from public.forum_feed where title like 'Vos astuces%') = 1, 'communauté : compteur de commentaires');
select tests.throws($$select * from public.consume_assistant_quota('22222222-2222-4222-8222-222222222222')$$, 'assistant : quota non manipulable par le client');
select tests.throws($$select public.moderate('hide', (select id from public.posts limit 1))$$, 'modération : réservée aux modérateurs');
select tests.throws($$select public.admin_stats()$$, 'administration : statistiques réservées aux administrateurs');
reset role;

-- ================================================================ CAMILLE (propriétaire)
set role authenticated; set request.jwt.claim.sub = :'CAMILLE';
select tests.ok(tests.count('select * from public.notifications where category = ''community_comment''') = 1, 'notification : réception d''une notification de commentaire');
delete from public.notifications where category = 'community_comment';
select tests.ok(tests.count('select * from public.notifications') = 0, 'notification : suppression depuis le centre de notifications');

-- Révocation d'un domaine pour le coparent
update public.household_members set can_view = array['daily','profile','lists','names'] where user_id = :'ALEX' and household_id = :'FAMILLE';
reset role;
set role authenticated; set request.jwt.claim.sub = :'ALEX';
select tests.ok(tests.count('select * from public.child_measurements') = 0, 'révocation : le coparent ne voit plus les mesures');
select tests.ok(tests.count('select * from public.documents') = 0, 'révocation : le coparent ne voit plus les documents');
select tests.ok(tests.count('select * from public.bottles') >= 1, 'révocation : le quotidien reste partagé');
reset role;

-- Suppression d'un document
set role authenticated; set request.jwt.claim.sub = :'CAMILLE';
delete from public.documents where title = 'Échographie T2';
delete from storage.objects where name like '%echo-t2.pdf';
select tests.ok(tests.count('select * from public.documents where title = ''Échographie T2''') = 0, 'documents : suppression');

-- Signalements : masquage automatique au 3e
select tests.ok(public.has_role('admin'), 'administration : Camille est administratrice');
reset role;

-- ---------------------------------------------------------------- Signalements
set role authenticated; set request.jwt.claim.sub = :'ALEX';
insert into public.reports (post_id, reason) select id, 'spam' from public.posts where title = 'Bonjour à toutes';
select tests.throws($$insert into public.reports (post_id, reason) select id, 'spam' from public.posts where title = 'Bonjour à toutes'$$, 'signalement : un seul par personne et par contenu');
reset role;
set role authenticated; set request.jwt.claim.sub = :'CAMILLE';
insert into public.reports (post_id, reason) select id, 'harassment' from public.posts where title = 'Bonjour à toutes';
reset role;
insert into auth.users (id, email) values ('44444444-4444-4444-8444-444444444444', 'sam@exemple.test');
set role authenticated; set request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
select tests.ok(tests.count('select * from public.reports') = 0, 'signalement : on ne voit pas les signalements des autres');
insert into public.reports (post_id, reason) select id, 'inappropriate' from public.posts where title = 'Bonjour à toutes';
select tests.ok(tests.count('select * from public.forum_feed where title = ''Bonjour à toutes''') = 0, 'signalement : publication masquée automatiquement au 3e signalement');
reset role;
set role authenticated; set request.jwt.claim.sub = :'CAMILLE';
select tests.ok(tests.count('select * from public.moderation_actions where action = ''auto_hide''') = 1, 'modération : historique de l''action automatique');
select public.moderate('restore', (select id from public.posts where title = 'Bonjour à toutes'), null, null, 'Signalements non fondés');
select tests.ok((select status from public.posts where title = 'Bonjour à toutes') = 'visible', 'modération : restauration par une administratrice');
select tests.ok((public.admin_stats() ->> 'accounts')::int >= 3, 'administration : statistiques agrégées');
reset role;

-- ---------------------------------------------------------------- Blocage
set role authenticated; set request.jwt.claim.sub = :'ZOE';
select tests.ok(tests.count('select * from public.forum_feed where title like ''Vos astuces%''') = 1, 'blocage : publication visible avant blocage');
select public.block_author((select id from public.forum_feed where title like 'Vos astuces%'));
select tests.ok(tests.count('select * from public.forum_feed where title like ''Vos astuces%''') = 0, 'blocage : publication de la personne bloquée masquée');
reset role;

-- ---------------------------------------------------------------- Abonnement (côté serveur)
set role service_role;
select tests.ok((select bool_and(allowed) from (select (public.consume_assistant_quota(:'ZOE')).allowed from generate_series(1,5)) s), 'abonnement : 5 questions gratuites accordées');
select tests.ok(not (select allowed from public.consume_assistant_quota(:'ZOE')), 'abonnement : 6e question refusée en version gratuite');
insert into public.subscriptions (user_id, status, product_id, store, period_type, expires_at)
values (:'CAMILLE', 'active', 'toietmoi_premium_annual', 'test', 'annual', now() + interval '1 year');
reset role;
set role authenticated; set request.jwt.claim.sub = :'CAMILLE';
select tests.ok(public.has_premium(), 'abonnement : droits premium actifs après validation serveur');
reset role;
set role authenticated; set request.jwt.claim.sub = :'ALEX';
select tests.ok(public.has_premium(), 'abonnement : le coparent profite de l''abonnement du foyer');
reset role;
set role authenticated; set request.jwt.claim.sub = :'ZOE';
select tests.ok(not public.has_premium(), 'abonnement : Zoé reste en version gratuite');
reset role;
set role service_role;
update public.subscriptions set status = 'expired', expires_at = now() - interval '1 day' where user_id = :'CAMILLE';
reset role;
set role authenticated; set request.jwt.claim.sub = :'CAMILLE';
select tests.ok(not public.has_premium(), 'abonnement : droits retirés à l''expiration');
reset role;

-- ---------------------------------------------------------------- Accès anonyme
set role anon;
select tests.ok(tests.count('select * from public.children') = 0 and tests.count('select * from public.mood_checkins') = 0, 'anonyme : aucune donnée privée');
select tests.ok(tests.count('select * from public.emergency_resources') >= 3, 'anonyme : ressources d''urgence accessibles sans compte');
reset role;

-- ---------------------------------------------------------------- Export RGPD
set role authenticated; set request.jwt.claim.sub = :'ALEX';
select tests.ok((public.export_my_data() -> 'personal' -> 'maternal_weights') = '[]'::jsonb, 'export : ne contient aucune donnée personnelle d''autrui');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'households') = 1, 'export : contient le foyer partagé');
reset role;

-- ---------------------------------------------------------------- Suppression du compte
set role service_role;
select tests.ok(coalesce(array_length(public.delete_user_account(:'CAMILLE'), 1), 0) >= 1, 'suppression : renvoie les fichiers privés à effacer du stockage');
reset role;
select tests.ok((select count(*) from auth.users where id = :'CAMILLE') = 0, 'suppression : compte supprimé');
select tests.ok((select count(*) from public.profiles where id = :'CAMILLE') = 0, 'suppression : profil supprimé');
select tests.ok((select role from public.household_members where household_id = :'FAMILLE' and user_id = :'ALEX') = 'owner', 'suppression : foyer partagé transmis au coparent');
select tests.ok((select count(*) from public.children where household_id = :'FAMILLE') = 2, 'suppression : les enfants du foyer partagé sont conservés pour le coparent');
select tests.ok((select count(*) from public.documents where private_to_uploader) = 0, 'suppression : documents privés supprimés');
select tests.ok((select count(*) from public.posts where author_id = :'CAMILLE') = 0, 'suppression : contenus communautaires supprimés');
