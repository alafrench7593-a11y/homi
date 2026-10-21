-- =====================================================================
-- Planificateur de sommeil : profil par enfant (gratuit), avis sur les estimations (Premium),
-- aucune donnée mélangée entre enfants, partage par profil respecté, export RGPD.
-- =====================================================================
\set SM 'f1e1a000-0000-4000-8000-000000000011'
\set SC 'f1e1a000-0000-4000-8000-000000000012'
\set SX 'f1e1a000-0000-4000-8000-000000000013'
insert into auth.users (id, email) values (:'SM', 's-mere@exemple.test'), (:'SC', 's-copa@exemple.test'), (:'SX', 's-autre@exemple.test');

set role authenticated; set request.jwt.claim.sub = :'SM';
create temp table sp_ctx as select public.create_household('Foyer sommeil test') as hid;
grant select on sp_ctx to authenticated;
insert into public.children (household_id, first_name, birth_date) select hid, 'Jade', current_date - 180 from sp_ctx;
insert into public.children (household_id, first_name, birth_date) select hid, 'Léo', current_date - 180 from sp_ctx;
create temp table sp_kids as select id, first_name from public.children where household_id = (select hid from sp_ctx);
grant select on sp_kids to authenticated;

-- Profil gratuit, un par enfant (jumeaux : deux profils distincts)
insert into public.sleep_profiles (household_id, child_id, usual_wake, nap_count, usual_bedtime, routine_minutes, difficulties, notify)
  select (select hid from sp_ctx), id, '07:00', 3, '19:45', 20, array['short_naps'], '{"enabled": true, "lead": 20, "nap": true}'::jsonb from sp_kids where first_name = 'Jade';
insert into public.sleep_profiles (household_id, child_id, usual_wake, usual_bedtime) select (select hid from sp_ctx), id, '06:30', '20:00' from sp_kids where first_name = 'Léo';
select tests.ok(tests.count('select * from public.sleep_profiles') = 2, 'profil de sommeil : gratuit, un par enfant (jumeaux séparés)');
select tests.throws($$insert into public.sleep_profiles (household_id, child_id) select (select hid from sp_ctx), id from sp_kids where first_name = 'Jade'$$, 'profil de sommeil : un seul profil par enfant');
select tests.throws($$insert into public.sleep_profiles (household_id, child_id, difficulties) select (select hid from sp_ctx), id, array['laisser_pleurer'] from sp_kids where first_name = 'Léo'$$, 'difficultés : seulement la liste proposée');
select tests.throws($$update public.sleep_profiles set nap_count = 9$$, 'nombre de siestes : borné');
select tests.throws($$update public.sleep_profiles set routine_minutes = 300$$, 'durée de routine : bornée');
update public.sleep_profiles set usual_bedtime = '20:15' where child_id = (select id from sp_kids where first_name = 'Léo');
select tests.ok((select usual_bedtime from public.sleep_profiles where child_id = (select id from sp_kids where first_name = 'Jade')) = '19:45', 'modifier le profil de Léo ne touche pas celui de Jade');

-- Avis sur les estimations : Premium
select tests.throws($$insert into public.sleep_feedback (household_id, child_id, target, verdict, estimated_for) select (select hid from sp_ctx), id, 'nap', 'late', now() from sp_kids where first_name = 'Jade'$$, 'avis sur une estimation : réservé au Premium (vérifié côté serveur)');
reset role;
select tests.set_premium(:'SM', true);
set role authenticated; set request.jwt.claim.sub = :'SM';
insert into public.sleep_feedback (household_id, child_id, target, verdict, estimated_for) select (select hid from sp_ctx), id, 'nap', 'late', date_trunc('minute', now()) from sp_kids where first_name = 'Jade';
select tests.ok(tests.count('select * from public.sleep_feedback') = 1, 'Premium : avis enregistré');
select tests.throws($$insert into public.sleep_feedback (household_id, child_id, target, verdict, estimated_for) select (select hid from sp_ctx), id, 'nap', 'early', date_trunc('minute', now()) from sp_kids where first_name = 'Jade'$$, 'un seul avis par estimation');
select tests.throws($$insert into public.sleep_feedback (household_id, child_id, target, verdict, estimated_for) select (select hid from sp_ctx), id, 'nap', 'parfait', now() from sp_kids where first_name = 'Léo'$$, 'avis : juste, trop tôt ou trop tard seulement');
create temp table sp_inv as select public.create_household_invitation((select hid from sp_ctx), 'coparent', array['daily'], array['daily'], null, array[(select id from sp_kids where first_name = 'Jade')], false) as token;
grant select on sp_inv to authenticated;
reset role;
select tests.set_premium(:'SM', false);
set role authenticated; set request.jwt.claim.sub = :'SM';
select tests.ok(tests.count('select * from public.sleep_feedback') = 1, 'fin d''abonnement : les avis déjà donnés restent lisibles');
update public.sleep_profiles set nap_count = 2 where child_id = (select id from sp_kids where first_name = 'Jade');
select tests.ok((select nap_count from public.sleep_profiles where child_id = (select id from sp_kids where first_name = 'Jade')) = 2, 'fin d''abonnement : le profil reste modifiable');
reset role;

-- Partage par profil : le coparent n'a accès qu'à Jade
set role authenticated; set request.jwt.claim.sub = :'SC';
select public.accept_household_invitation((select token from sp_inv));
select tests.ok(tests.count('select * from public.sleep_profiles') = 1 and tests.count('select * from public.sleep_feedback') = 1, 'partage par profil : le coparent voit seulement le sommeil de Jade');
select tests.throws($$insert into public.sleep_profiles (household_id, child_id) select (select hid from sp_ctx), id from sp_kids where first_name = 'Léo' on conflict (child_id) do update set nap_count = 1$$, 'partage par profil : aucune écriture sur le profil de Léo');
update public.sleep_profiles set routine_note = 'Bain puis histoire';
select tests.ok((select routine_note from public.sleep_profiles where child_id = (select id from sp_kids where first_name = 'Jade')) = 'Bain puis histoire', 'le coparent peut ajuster la routine de Jade');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'sleep_profiles') = 1, 'export RGPD du coparent : seulement les profils accessibles');
reset role;

set role authenticated; set request.jwt.claim.sub = :'SM';
select tests.ok(jsonb_array_length(public.export_my_data() -> 'sleep_profiles') = 2 and jsonb_array_length(public.export_my_data() -> 'sleep_feedback') = 1, 'export RGPD : profils de sommeil et avis inclus');
reset role;

-- Personne d'un autre foyer : rien, et impossible de rattacher un profil à un enfant d'un autre foyer
set role authenticated; set request.jwt.claim.sub = :'SX';
create temp table sp_other as select public.create_household('Autre foyer') as hid;
select tests.ok(tests.count('select * from public.sleep_profiles') = 0, 'autre foyer : aucun profil de sommeil visible');
select tests.throws(format($$insert into public.sleep_profiles (household_id, child_id) values (%L, %L)$$, (select hid from sp_other), (select id from sp_kids where first_name = 'Léo')), 'impossible de rattacher un profil à l''enfant d''un autre foyer');
reset role;
