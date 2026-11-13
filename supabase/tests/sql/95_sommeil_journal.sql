-- =====================================================================
-- Journal du sommeil de l'enfant (sleep_notes, 13/11/2026) : difficultés et changements de routine datés,
-- un journal par enfant (jumeaux séparés), partage par profil respecté, autre foyer exclu, Premium strict,
-- contraintes (sorte, étiquettes, note non vide, pas de date future), export RGPD.
-- =====================================================================
\set NM 'f1e1b000-0000-4000-8000-000000000021'
\set NC 'f1e1b000-0000-4000-8000-000000000022'
\set NX 'f1e1b000-0000-4000-8000-000000000023'
reset role; set request.jwt.claim.sub = '';
create temp table sn_policy as select strict from public.premium_policy where id;
grant select on sn_policy to authenticated;
update public.premium_policy set strict = true;
insert into auth.users (id, email) values (:'NM', 'sn-mere@exemple.test'), (:'NC', 'sn-copa@exemple.test'), (:'NX', 'sn-autre@exemple.test');
select tests.set_premium(:'NM', true);

set role authenticated; set request.jwt.claim.sub = :'NM';
create temp table sn_ctx as select public.create_household('Foyer journal sommeil') as hid;
grant select on sn_ctx to authenticated;
insert into public.children (household_id, first_name, birth_date) select hid, 'Nina', current_date - 200 from sn_ctx;
insert into public.children (household_id, first_name, birth_date) select hid, 'Noé', current_date - 200 from sn_ctx;
create temp table sn_kids as select id, first_name from public.children where household_id = (select hid from sn_ctx);
grant select on sn_kids to authenticated;

-- Saisies valides, une par enfant (jumeaux : jamais mélangées)
insert into public.sleep_notes (household_id, child_id, kind, tags, note)
  select (select hid from sn_ctx), id, 'difficulty', array['night_wakings'], 'Réveillée trois fois' from sn_kids where first_name = 'Nina';
insert into public.sleep_notes (household_id, child_id, kind, note, noted_at)
  select (select hid from sn_ctx), id, 'routine_change', 'Reprise de la crèche', now() - interval '2 days' from sn_kids where first_name = 'Noé';
select tests.ok(tests.count('select * from public.sleep_notes') = 2, 'journal du sommeil : une note par enfant, enregistrées');
select tests.ok(tests.count(format('select * from public.sleep_notes where child_id = %L', (select id from sn_kids where first_name = 'Nina'))) = 1, 'jumeaux : la note de Noé n''apparaît pas chez Nina');

-- Contraintes
select tests.throws($$insert into public.sleep_notes (household_id, child_id, kind, note) select (select hid from sn_ctx), id, 'score', 'x' from sn_kids where first_name = 'Nina'$$, 'sorte de note : difficulté ou changement de routine seulement');
select tests.throws($$insert into public.sleep_notes (household_id, child_id, kind, tags) select (select hid from sn_ctx), id, 'difficulty', array['laisser_pleurer'] from sn_kids where first_name = 'Nina'$$, 'étiquettes : seulement la liste proposée');
select tests.throws($$insert into public.sleep_notes (household_id, child_id, kind, note) select (select hid from sn_ctx), id, 'difficulty', '   ' from sn_kids where first_name = 'Nina'$$, 'note vide refusée');
select tests.throws($$insert into public.sleep_notes (household_id, child_id, kind, note, noted_at) select (select hid from sn_ctx), id, 'difficulty', 'demain', now() + interval '1 day' from sn_kids where first_name = 'Nina'$$, 'note datée dans le futur refusée');
select tests.throws($$insert into public.sleep_notes (household_id, child_id, kind, note) select (select hid from sn_ctx), id, 'difficulty', repeat('a', 1001) from sn_kids where first_name = 'Nina'$$, 'note limitée à 1 000 caractères');

-- Invitation d'un coparent limité à Nina
create temp table sn_inv as select public.create_household_invitation((select hid from sn_ctx), 'coparent', array['daily'], array['daily'], null, array[(select id from sn_kids where first_name = 'Nina')], false) as token;
grant select on sn_inv to authenticated;
reset role;
select tests.set_premium(:'NC', true);

set role authenticated; set request.jwt.claim.sub = :'NC';
select public.accept_household_invitation((select token from sn_inv));
select tests.ok(tests.count('select * from public.sleep_notes') = 1, 'partage par profil : le coparent ne voit que le journal de Nina');
select tests.throws($$insert into public.sleep_notes (household_id, child_id, kind, note) select (select hid from sn_ctx), id, 'difficulty', 'intrusion' from sn_kids where first_name = 'Noé'$$, 'partage par profil : aucune écriture dans le journal de Noé');
update public.sleep_notes set note = 'modifié par le coparent' where child_id = (select id from sn_kids where first_name = 'Noé');
reset role;
select tests.ok((select note from public.sleep_notes where child_id = (select id from sn_kids where first_name = 'Noé')) = 'Reprise de la crèche', 'partage par profil : la note de Noé n''est pas modifiable par le coparent');
set role authenticated; set request.jwt.claim.sub = :'NC';
insert into public.sleep_notes (household_id, child_id, kind, tags) select (select hid from sn_ctx), id, 'difficulty', array['falling_asleep'] from sn_kids where first_name = 'Nina';
select tests.ok(tests.count('select * from public.sleep_notes') = 2, 'le coparent peut noter une difficulté pour Nina');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'sleep_notes') = 2, 'export RGPD du coparent : seulement les notes accessibles');
reset role;

-- Autre foyer : rien de visible, impossible d'écrire chez l'enfant d'un autre foyer
set role authenticated; set request.jwt.claim.sub = :'NX';
create temp table sn_other as select public.create_household('Autre foyer journal') as hid;
select tests.ok(tests.count('select * from public.sleep_notes') = 0, 'autre foyer : aucune note visible');
select tests.throws(format($$insert into public.sleep_notes (household_id, child_id, kind, note) values (%L, %L, 'difficulty', 'x')$$, (select hid from sn_ctx), (select id from sn_kids where first_name = 'Nina')), 'autre foyer : écriture refusée (RLS)');
select tests.throws(format($$insert into public.sleep_notes (household_id, child_id, kind, note) values (%L, %L, 'difficulty', 'x')$$, (select hid from sn_other), (select id from sn_kids where first_name = 'Nina')), 'impossible de rattacher une note à l''enfant d''un autre foyer');
delete from public.sleep_notes;
reset role;
select tests.ok((select count(*) from public.sleep_notes where household_id = (select hid from sn_ctx)) = 3, 'autre foyer : suppression sans effet');

-- Premium strict : sans abonnement (ni personnel ni partagé par le coparent), lecture et export libres, aucun ajout
select tests.set_premium(:'NM', false);
select tests.set_premium(:'NC', false);
set role authenticated; set request.jwt.claim.sub = :'NM';
select tests.ok(tests.count('select * from public.sleep_notes') = 3, 'sans abonnement : le journal reste lisible');
select tests.throws($$insert into public.sleep_notes (household_id, child_id, kind, note) select (select hid from sn_ctx), id, 'difficulty', 'gratuit' from sn_kids where first_name = 'Nina'$$, 'Premium strict : nouvelle note refusée sans abonnement');
reset role;

set role authenticated; set request.jwt.claim.sub = :'NM';
select tests.ok(jsonb_array_length(public.export_my_data() -> 'sleep_notes') = 3, 'export RGPD : toutes les notes du foyer pour la mère');
delete from public.sleep_notes where kind = 'routine_change';
select tests.ok(tests.count('select * from public.sleep_notes') = 2, 'suppression d''une note par un membre autorisé');
reset role;
update public.premium_policy set strict = (select strict from sn_policy);
