-- Téléphone partagé (campagne QA du 02/11/2026, lot A) : le jeton push suit le compte connecté.
\set PA 'f4a00000-0000-4000-8000-000000000001'
\set PB 'f4a00000-0000-4000-8000-000000000002'
reset role;
insert into auth.users (id, email) values (:'PA', 'push-a@exemple.test'), (:'PB', 'push-b@exemple.test');
set role authenticated; set request.jwt.claim.sub = :'PA';
select public.claim_push_device('ExponentPushToken[partage-0123456789]', 'ios', 'iPhone');
set request.jwt.claim.sub = :'PB';
select public.claim_push_device('ExponentPushToken[partage-0123456789]', 'ios', 'iPhone');
reset role;
select tests.ok((select array_agg(user_id::text) from public.push_devices where expo_push_token = 'ExponentPushToken[partage-0123456789]') = array[:'PB'],
  'notifications : sur un téléphone partagé, le jeton passe au compte connecté');
set role authenticated; set request.jwt.claim.sub = :'PA';
select public.release_push_device('ExponentPushToken[partage-0123456789]');
reset role;
select tests.ok((select count(*) from public.push_devices where expo_push_token = 'ExponentPushToken[partage-0123456789]') = 1,
  'notifications : l''ancien compte ne peut pas retirer le jeton du compte actuel');
set role authenticated; set request.jwt.claim.sub = :'PB';
select public.release_push_device('ExponentPushToken[partage-0123456789]');
select tests.throws($$select public.claim_push_device('pas-un-jeton', 'ios', null)$$, 'notifications : jeton invalide refusé');
reset role;
select tests.ok((select count(*) from public.push_devices where expo_push_token = 'ExponentPushToken[partage-0123456789]') = 0,
  'notifications : la déconnexion retire le jeton du téléphone');
