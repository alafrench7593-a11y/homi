-- Photo de profil (07/11/2026) : dossier personnel, lecture limitée aux membres des foyers partagés.
\set PA 'fa000000-0000-4000-8000-000000000001'
\set PB 'fa000000-0000-4000-8000-000000000002'
\set PC 'fa000000-0000-4000-8000-000000000003'
\set PH 'fa000000-0000-4000-8000-0000000000f1'
\set F1 'fa000000-0000-4000-8000-00000000a001'
\set F2 'fa000000-0000-4000-8000-00000000a002'
reset role;
insert into auth.users (id, email) values (:'PA', 'photo-a@exemple.test'), (:'PB', 'photo-b@exemple.test'), (:'PC', 'photo-c@exemple.test');
insert into public.households (id, name, created_by) values (:'PH', 'Foyer photo', :'PA');
insert into public.household_members (household_id, user_id, role) values (:'PH', :'PA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'PH', :'PB', 'coparent') on conflict do nothing;

set role authenticated; set request.jwt.claim.sub = :'PA';
insert into storage.objects (bucket_id, name, owner) values ('profile-photos', :'PA' || '/' || :'F1' || '.jpg', :'PA');
select tests.ok(true, 'photo : dépôt dans son propre dossier');
select tests.throws(format('insert into storage.objects (bucket_id, name) values (''profile-photos'', %L)', :'PB' || '/' || :'F2' || '.jpg'), 'photo : dépôt refusé dans le dossier d''une autre personne');
select tests.throws(format('insert into storage.objects (bucket_id, name) values (''profile-photos'', %L)', :'PA' || '/photo.png'), 'photo : nom de fichier imposé');
update public.profiles set avatar_path = :'PA' || '/' || :'F1' || '.jpg' where id = :'PA';
select tests.ok((select avatar_path from public.profiles where id = 'fa000000-0000-4000-8000-000000000001') is not null, 'photo : chemin enregistré sur le profil');
select tests.throws(format('update public.profiles set avatar_path = %L where id = %L', :'PB' || '/' || :'F2' || '.jpg', :'PA'), 'photo : chemin hors de son dossier refusé');

set request.jwt.claim.sub = :'PB';
select tests.ok(tests.count(format('select * from storage.objects where bucket_id = ''profile-photos'' and name like %L', :'PA' || '/%')) = 1, 'photo : l''autre parent du foyer voit la photo');
select tests.ok((select count(*) from public.member_avatars() where user_id = 'fa000000-0000-4000-8000-000000000001') = 1, 'photo : member_avatars donne la photo d''un membre');
select tests.ok((select count(*) from public.profiles where id = 'fa000000-0000-4000-8000-000000000001') = 0, 'photo : le reste du profil reste illisible');
delete from storage.objects where bucket_id = 'profile-photos' and name = :'PA' || '/' || :'F1' || '.jpg';
reset role;
select tests.ok((select count(*) from storage.objects where bucket_id = 'profile-photos' and name = 'fa000000-0000-4000-8000-000000000001/fa000000-0000-4000-8000-00000000a001.jpg') = 1, 'photo : un autre membre ne peut pas la supprimer');
set role authenticated;

set request.jwt.claim.sub = :'PC';
select tests.ok(tests.count(format('select * from storage.objects where bucket_id = ''profile-photos'' and name like %L', :'PA' || '/%')) = 0, 'photo : une personne hors du foyer ne voit rien');
select tests.ok((select count(*) from public.member_avatars()) = 0, 'photo : member_avatars vide hors foyer');

set request.jwt.claim.sub = :'PA';
delete from storage.objects where bucket_id = 'profile-photos' and name = :'PA' || '/' || :'F1' || '.jpg';
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''profile-photos''') = 0, 'photo : suppression de sa propre photo');
select tests.ok((public.export_my_data()->'profile') ? 'avatar_path', 'photo : présente dans l''export RGPD');
reset role;
