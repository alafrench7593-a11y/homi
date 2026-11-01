-- Suppression de compte (campagne QA du 02/11/2026, lot A) : transmission du foyer au coparent seulement,
-- documents partagés conservés, documents privés effacés.
\set OWN 'f3a00000-0000-4000-8000-0000000001a1'
\set NOU 'f3a00000-0000-4000-8000-0000000001b2'
\set COP 'f3a00000-0000-4000-8000-0000000001c3'
\set H   'f3a00000-0000-4000-8000-0000000001f1'
\set H2  'f3a00000-0000-4000-8000-0000000001f2'
reset role;
insert into auth.users (id, email) values (:'OWN', 'del-own@exemple.test'), (:'NOU', 'del-nounou@exemple.test'), (:'COP', 'del-cop@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer de la propriétaire', :'OWN'), (:'H2', 'Foyer du coparent', :'COP');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OWN', 'owner'), (:'H2', :'COP', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
-- la nounou rejoint AVANT le coparent
insert into public.household_members (household_id, user_id, role, can_view, can_edit, joined_at) values
  (:'H', :'NOU', 'caregiver', array['daily'], array['daily'], now() - interval '30 days'),
  (:'H', :'COP', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['daily'], now() - interval '10 days');
-- la propriétaire est aussi membre du foyer du coparent et y a déposé un document partagé et un privé
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'H2', :'OWN', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['documents']);
insert into public.documents (household_id, uploaded_by, category, title, storage_path, mime_type, size_bytes, private_to_uploader) values
  (:'H2', :'OWN', 'other', 'Carnet de santé (partagé)', :'H2' || '/carnet.pdf', 'application/pdf', 10, false),
  (:'H2', :'OWN', 'other', 'Note privée', :'H2' || '/prive.pdf', 'application/pdf', 10, true);

set role service_role;
select public.delete_user_account(:'OWN') as chemins \gset
reset role;

select tests.ok((select role from public.household_members where household_id = :'H' and user_id = :'COP') = 'owner',
  'suppression de compte : le foyer passe au coparent');
select tests.ok((select role from public.household_members where household_id = :'H' and user_id = :'NOU') = 'caregiver',
  'suppression de compte : la nounou ne devient jamais propriétaire');
select tests.ok((select count(*) from public.documents where storage_path = :'H2' || '/carnet.pdf' and uploaded_by is null) = 1,
  'suppression de compte : document partagé conservé chez le coparent');
select tests.ok((select count(*) from public.documents where storage_path = :'H2' || '/prive.pdf') = 0,
  'suppression de compte : document privé effacé');
select tests.ok(:'chemins' like '%prive.pdf%' and :'chemins' not like '%carnet.pdf%',
  'suppression de compte : seul le fichier privé est à effacer du stockage');
