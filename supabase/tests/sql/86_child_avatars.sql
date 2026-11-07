-- Photo de profil des enfants (07/11/2026) : l'espace « avatars » respecte le périmètre enfants (child_scope).
\set AO 'c0e86000-0000-4000-8000-000000000001'
\set AS 'c0e86000-0000-4000-8000-000000000002'
\set AX 'c0e86000-0000-4000-8000-000000000003'
\set AH 'c0e86000-0000-4000-8000-0000000000a1'
\set AK1 'c0e86000-0000-4000-8000-0000000000b1'
\set AK2 'c0e86000-0000-4000-8000-0000000000b2'
\set AF1 'c0e86000-0000-4000-8000-0000000000f1'
\set AF2 'c0e86000-0000-4000-8000-0000000000f2'
\set AF3 'c0e86000-0000-4000-8000-0000000000f3'
reset role;
insert into auth.users (id, email) values (:'AO', 'avatar-proprio@exemple.test'), (:'AS', 'avatar-restreinte@exemple.test'), (:'AX', 'avatar-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'AH', 'Foyer avatars', :'AO');
insert into public.household_members (household_id, user_id, role) values (:'AH', :'AO', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'AH', :'AS', 'caregiver', array['daily','profile'], array['daily','profile'], array[:'AK2']::uuid[]);
insert into public.children (id, household_id, first_name, birth_date) values (:'AK1', :'AH', 'Lina', current_date - 300), (:'AK2', :'AH', 'Noé', current_date - 1500);
insert into storage.objects (bucket_id, name, owner) values
  ('avatars', :'AH' || '/children/' || :'AK1' || '.jpg', :'AO'),
  ('avatars', :'AH' || '/children/' || :'AK2' || '/' || :'AF1' || '.jpg', :'AO');

set role authenticated; set request.jwt.claim.sub = :'AO';
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''avatars''') = 2, 'avatar enfant : la propriétaire voit les 2 photos (ancien et nouveau format)');
insert into storage.objects (bucket_id, name) values ('avatars', :'AH' || '/children/' || :'AK1' || '/' || :'AF2' || '.jpg');
select tests.ok(true, 'avatar enfant : la propriétaire dépose une nouvelle photo');

set request.jwt.claim.sub = :'AS';
select tests.ok(tests.count(format('select * from storage.objects where bucket_id = ''avatars'' and name like %L', '%' || :'AK2' || '%')) = 1, 'avatar enfant : la nounou voit la photo de l''enfant qui lui est confié');
select tests.ok(tests.count(format('select * from storage.objects where bucket_id = ''avatars'' and name like %L', '%' || :'AK1' || '%')) = 0, 'avatar enfant : photo d''un enfant hors de son périmètre illisible');
select tests.throws(format('insert into storage.objects (bucket_id, name) values (''avatars'', %L)', :'AH' || '/children/' || :'AK1' || '/' || :'AF3' || '.jpg'), 'avatar enfant : dépôt refusé pour un enfant hors périmètre');
insert into storage.objects (bucket_id, name) values ('avatars', :'AH' || '/children/' || :'AK2' || '/' || :'AF3' || '.jpg');
select tests.ok(true, 'avatar enfant : dépôt accepté pour l''enfant confié');
select tests.throws(format('insert into storage.objects (bucket_id, name) values (''avatars'', %L)', :'AH' || '/children/pas-un-uuid.jpg'), 'avatar enfant : chemin invalide refusé');

set request.jwt.claim.sub = :'AX';
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''avatars''') = 0, 'avatar enfant : une personne hors du foyer ne voit rien');
reset role;
