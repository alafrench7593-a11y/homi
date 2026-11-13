-- Album photo par enfant : photos privées par défaut au foyer, droits du foyer ET de l'enfant,
-- photo « privée » visible de son autrice seulement, fichiers jamais publics, suppression du compte.
\set PO 'c0e64000-0000-4000-8000-000000000001'
\set PC 'c0e64000-0000-4000-8000-000000000002'
\set PV 'c0e64000-0000-4000-8000-000000000003'
\set PS 'c0e64000-0000-4000-8000-000000000004'
\set PX 'c0e64000-0000-4000-8000-000000000005'
\set H  'c0e64000-0000-4000-8000-0000000000a1'
\set H2 'c0e64000-0000-4000-8000-0000000000a2'
\set K1 'c0e64000-0000-4000-8000-0000000000b1'
\set K2 'c0e64000-0000-4000-8000-0000000000b2'
\set KX 'c0e64000-0000-4000-8000-0000000000b3'
\set F1 'c0e64000-0000-4000-8000-0000000000f1'
\set F2 'c0e64000-0000-4000-8000-0000000000f2'
\set F3 'c0e64000-0000-4000-8000-0000000000f3'
\set F4 'c0e64000-0000-4000-8000-0000000000f4'

reset role;
insert into auth.users (id, email) values
  (:'PO', 'album-proprio@exemple.test'), (:'PC', 'album-coparent@exemple.test'), (:'PV', 'album-lecture@exemple.test'),
  (:'PS', 'album-restreint@exemple.test'), (:'PX', 'album-inconnue@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer album', :'PO'), (:'H2', 'Autre foyer', :'PX');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'H', :'PC', 'coparent', array['daily','health','profile'], array['daily','profile']),
  (:'H', :'PV', 'caregiver', array['daily','profile'], array['daily']);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'PS', 'caregiver', array['daily','profile'], array['daily','profile'], array[:'K2']::uuid[]);
insert into public.children (id, household_id, first_name, birth_date) values
  (:'K1', :'H', 'Lou', current_date - 400), (:'K2', :'H', 'Sacha', current_date - 1200), (:'KX', :'H2', 'Nil', current_date - 200);
-- Depuis le 13/11/2026 : une nounou sans choix d'enfants n'en voit aucun ; PV garde les deux enfants
update public.household_members set child_scope = array[:'K1', :'K2']::uuid[] where household_id = :'H' and user_id = :'PV';
insert into storage.objects (bucket_id, name, owner) values
  ('child-photos', :'H' || '/' || :'K1' || '/' || :'F1' || '.jpg', :'PO');

select tests.ok((select public = false from storage.buckets where id = 'child-photos'), 'album : espace de stockage non public');

-- ================================================================ propriétaire
set role authenticated; set request.jwt.claim.sub = :'PO';
insert into public.child_photos (household_id, child_id, storage_path, taken_on, caption, created_by)
  values (:'H', :'K1', :'H' || '/' || :'K1' || '/' || :'F1' || '.jpg', current_date - 3, 'Premier sourire', :'PX');
select tests.ok((select created_by = :'PO'::uuid from public.child_photos where storage_path like '%' || :'F1' || '%'), 'album : l''autrice est imposée par le serveur (pas d''usurpation)');
select tests.ok((select visibility = 'household' from public.child_photos where storage_path like '%' || :'F1' || '%'), 'album : partagée avec le foyer par défaut');
select tests.throws(format('insert into public.child_photos (household_id, child_id, storage_path) values (%L, %L, %L)', :'H', :'KX', :'H' || '/' || :'KX' || '/' || :'F2' || '.jpg'), 'album : impossible de rattacher l''enfant d''un autre foyer');
select tests.throws(format('insert into public.child_photos (household_id, child_id, storage_path) values (%L, %L, %L)', :'H', :'K1', 'autre/chemin.jpg'), 'album : chemin de fichier contrôlé');
select tests.throws(format('insert into public.child_photos (household_id, child_id, storage_path, taken_on) values (%L, %L, %L, current_date + 30)', :'H', :'K1', :'H' || '/' || :'K1' || '/' || :'F2' || '.jpg'), 'album : date dans le futur refusée');
select tests.ok(tests.count(format('select * from storage.objects where bucket_id = ''child-photos'' and name like %L', '%' || :'F1' || '%')) = 1, 'album : la propriétaire lit le fichier');
select tests.throws(format('insert into storage.objects (bucket_id, name) values (''child-photos'', %L)', :'H2' || '/' || :'KX' || '/' || :'F4' || '.jpg'), 'album : dépôt refusé dans un autre foyer');
select tests.throws(format('insert into storage.objects (bucket_id, name) values (''child-photos'', %L)', :'H' || '/' || :'KX' || '/' || :'F4' || '.jpg'), 'album : dépôt refusé pour un enfant d''un autre foyer');

-- ================================================================ coparent (profil : lecture + écriture)
set request.jwt.claim.sub = :'PC';
select tests.ok(tests.count('select * from public.child_photos') = 1, 'album : le coparent voit la photo partagée');
insert into storage.objects (bucket_id, name) values ('child-photos', :'H' || '/' || :'K1' || '/' || :'F2' || '.jpg');
insert into public.child_photos (household_id, child_id, storage_path, caption, visibility)
  values (:'H', :'K1', :'H' || '/' || :'K1' || '/' || :'F2' || '.jpg', 'Juste pour moi', 'private');
insert into storage.objects (bucket_id, name) values ('child-photos', :'H' || '/' || :'K1' || '/' || :'F3' || '.jpg');
insert into public.child_photos (household_id, child_id, storage_path, caption)
  values (:'H', :'K1', :'H' || '/' || :'K1' || '/' || :'F3' || '.jpg', 'Au parc');
update public.child_photos set caption = 'Premier vrai sourire' where storage_path like '%' || :'F1' || '%';
select tests.ok((select caption = 'Premier vrai sourire' from public.child_photos where storage_path like '%' || :'F1' || '%'), 'album : le coparent avec droit d''écriture modifie la légende');
select tests.throws(format('update public.child_photos set storage_path = %L where storage_path like %L', :'H' || '/' || :'K1' || '/' || :'F4' || '.jpg', '%' || :'F1' || '%'), 'album : le fichier d''une photo ne peut pas être remplacé');

-- ================================================================ propriétaire et photo privée d'une autre personne
set request.jwt.claim.sub = :'PO';
select tests.ok(tests.count(format('select * from public.child_photos where storage_path like %L', '%' || :'F2' || '%')) = 0, 'album : photo privée invisible même pour la propriétaire du foyer');
select tests.ok(tests.count(format('select * from storage.objects where bucket_id = ''child-photos'' and name like %L', '%' || :'F2' || '%')) = 0, 'album : fichier d''une photo privée illisible pour les autres');
update public.child_photos set visibility = 'household' where storage_path like '%' || :'F2' || '%';
reset role;
select tests.ok((select visibility = 'private' from public.child_photos where storage_path like '%' || :'F2' || '%'), 'album : personne d''autre ne peut rendre publique une photo privée');
set role authenticated; set request.jwt.claim.sub = :'PO';
delete from public.child_photos where storage_path like '%' || :'F3' || '%';
reset role;
select tests.ok((select count(*) = 0 from public.child_photos where storage_path like '%' || :'F3' || '%'), 'album : la propriétaire du foyer peut retirer une photo partagée');

-- ================================================================ lecture seule
set role authenticated; set request.jwt.claim.sub = :'PV';
select tests.ok(tests.count('select * from public.child_photos') = 1, 'album : lecture seule voit les photos partagées (pas les privées)');
select tests.throws(format('insert into public.child_photos (household_id, child_id, storage_path) values (%L, %L, %L)', :'H', :'K1', :'H' || '/' || :'K1' || '/' || :'F4' || '.jpg'), 'album : lecture seule ne peut pas ajouter');
update public.child_photos set caption = 'piratée' where storage_path like '%' || :'F1' || '%';
delete from public.child_photos where storage_path like '%' || :'F1' || '%';
reset role;
select tests.ok((select caption = 'Premier vrai sourire' from public.child_photos where storage_path like '%' || :'F1' || '%'), 'album : lecture seule ne peut ni modifier ni supprimer');

-- ================================================================ accès limité à un autre enfant
set role authenticated; set request.jwt.claim.sub = :'PS';
select tests.ok(tests.count('select * from public.child_photos') = 0, 'album : une personne limitée à un autre enfant ne voit pas ces photos');
select tests.throws(format('insert into storage.objects (bucket_id, name) values (''child-photos'', %L)', :'H' || '/' || :'K1' || '/' || :'F4' || '.jpg'), 'album : dépôt refusé pour un enfant non autorisé');

-- ================================================================ inconnue et anonyme
set request.jwt.claim.sub = :'PX';
select tests.ok(tests.count('select * from public.child_photos') = 0, 'album : une autre famille ne voit aucune photo');
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''child-photos''') = 0, 'album : une autre famille ne lit aucun fichier');
reset role; set role anon; set request.jwt.claim.sub = '';
select tests.throws('select * from public.child_photos', 'album : aucun accès sans connexion');
reset role;

-- ================================================================ suppression de compte (serveur)
select tests.ok((select :'H' || '/' || :'K1' || '/' || :'F2' || '.jpg' = any(public.child_photo_paths_for_account(:'PC'))), 'suppression du compte : les photos privées de la personne sont effacées');
select tests.ok((select not (:'H' || '/' || :'K1' || '/' || :'F1' || '.jpg' = any(public.child_photo_paths_for_account(:'PO')))), 'suppression du compte : un foyer conservé garde ses photos partagées');
select tests.ok((select public.forget_private_child_photos(:'PC') = 1), 'suppression du compte : lignes des photos privées retirées');
select tests.ok((select count(*) = 1 from public.child_photos where household_id = :'H'), 'suppression du compte : la photo partagée reste au foyer');
select tests.ok(not has_function_privilege('authenticated', 'public.child_photo_paths_for_account(uuid)', 'execute'), 'suppression du compte : fonction réservée au serveur');
set role authenticated; set request.jwt.claim.sub = :'PO';
select tests.ok((public.export_my_data() -> 'child_photos') is not null and jsonb_array_length(public.export_my_data() -> 'child_photos') = 1, 'export RGPD : photos ajoutées par la personne');
reset role;
