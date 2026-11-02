-- B-10, F-07, C-01 (campagne QA du 02/11/2026).
\set SA 'f7a00000-0000-4000-8000-000000000001'
\set SH 'f7a00000-0000-4000-8000-0000000000f1'
\set SP 'f7a00000-0000-4000-8000-0000000000a1'
reset role;
insert into auth.users (id, email) values (:'SA', 'stock-a@exemple.test');
insert into public.households (id, name, created_by) values (:'SH', 'Foyer stockage', :'SA');
insert into public.household_members (household_id, user_id, role) values (:'SH', :'SA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';

set role authenticated; set request.jwt.claim.sub = :'SA';
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Stock_A', 'Lyon');
insert into public.posts (id, forum_id, title, body) values (:'SP', (select id from public.forums where slug = 'grossesse'), 'Photo', 'Avec photo');
insert into public.post_photos (post_id, path) values (:'SP', :'SA' || '/photo-test.jpg');
insert into public.appointments (household_id, kind, title, starts_at) values (:'SH', 'other', 'Normal', '2026-12-01 10:00+01'); -- contrôle positif
select tests.throws($$insert into public.appointments (household_id, kind, title, starts_at) values ('f7a00000-0000-4000-8000-0000000000f1', 'other', 'Absurde', '1900-01-01')$$,
  'rendez-vous : date de 1900 refusée');
select tests.throws($$select * from public.rate_limits$$, 'rate_limits : aucun droit pour authenticated');
select tests.throws($$select * from public.storage_deletions$$, 'file de nettoyage : invisible pour les utilisatrices');

reset role;
delete from public.posts where id = :'SP';
select tests.ok((select count(*) from public.storage_deletions where bucket = 'community' and path = :'SA' || '/photo-test.jpg') = 1,
  'stockage : le fichier d''une photo supprimée par la base est mis en file de nettoyage');
