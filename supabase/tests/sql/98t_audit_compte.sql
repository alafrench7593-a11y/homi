-- Audit n° 2 « Authentification et compte » (13/11/2026) :
--  * suppression de compte : plus aucune ligne liée à la personne, foyer partagé conservé pour l'autre parent,
--    aucun accès résiduel avec un jeton encore valide ;
--  * documents privés : jamais recopiés dans le journal d'audit du foyer (avant comme après la suppression) ;
--  * export RGPD : données de compte complètes, sans jeton.
\set A  'a2a00000-0000-4000-8000-0000000000a1'
\set B  'a2a00000-0000-4000-8000-0000000000b2'
\set S  'a2a00000-0000-4000-8000-0000000000c3'
\set H  'a2a00000-0000-4000-8000-0000000000f1'
\set HS 'a2a00000-0000-4000-8000-0000000000f2'
\set K  'a2a00000-0000-4000-8000-0000000000e1'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'A', 'audit2-a@exemple.test'), (:'B', 'audit2-b@exemple.test'), (:'S', 'audit2-solo@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer partagé', :'A'), (:'HS', 'Foyer solo', :'S');
insert into public.household_members (household_id, user_id, role) values (:'H', :'A', 'owner'), (:'HS', :'S', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'H', :'B', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','documents']);
insert into public.children (id, household_id, first_name, birth_date) values (:'K', :'H', 'Lina', current_date - 100);
insert into public.member_follows (follower_id, followee_id) values (:'B', :'A');

-- B dépose un document privé (valeur par défaut) et un document partagé, en tant que client
set role authenticated; set request.jwt.claim.sub = :'B';
insert into public.documents (household_id, uploaded_by, category, title, storage_path, mime_type, size_bytes, notes)
values (:'H', :'B', 'other', 'Bilan confidentiel', :'H' || '/b-prive.pdf', 'application/pdf', 10, 'note intime');
insert into public.documents (household_id, uploaded_by, category, title, storage_path, mime_type, size_bytes, private_to_uploader)
values (:'H', :'B', 'other', 'Carnet de vaccination', :'H' || '/b-partage.pdf', 'application/pdf', 10, false);
select tests.ok((public.export_my_data() -> 'account_extra' -> 'following' -> 0 ->> 'followee_id') = :'A',
  'audit compte : l''export contient les abonnements de la communauté');
select tests.ok(public.export_my_data() ? 'account_extra' and (public.export_my_data() -> 'account_extra') ? 'calendar_feeds'
  and position('token_hash' in public.export_my_data()::text) = 0,
  'audit compte : l''export contient les liens d''agenda, sans leur empreinte');

-- A (propriétaire, droit « documents ») ne voit ni le document privé ni son titre dans le journal
set request.jwt.claim.sub = :'A';
select tests.ok((select count(*) from public.documents where household_id = :'H' and title = 'Bilan confidentiel') = 0,
  'audit compte : la propriétaire ne voit pas le document privé du coparent');
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H' and table_name = 'documents'
                 and (after::text like '%confidentiel%' or after::text like '%intime%')) = 0,
  'audit compte : le titre et les notes d''un document privé ne sont pas recopiés dans le journal du foyer');
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H' and table_name = 'documents'
                 and after::text like '%Carnet de vaccination%') = 1,
  'audit compte : un document partagé reste journalisé');

-- Suppression du compte de B (fonction serveur, rôle service)
reset role; set request.jwt.claim.sub = '';
set role service_role;
select public.delete_user_account(:'B') as chemins_b \gset
reset role;
select tests.ok(:'chemins_b' like '%b-prive.pdf%' and :'chemins_b' not like '%b-partage.pdf%',
  'audit compte : seul le fichier privé de la personne supprimée est à effacer du stockage');
-- Plus aucune ligne liée à B, dans TOUTES les tables qui référencent auth.users
do $$
declare r record; v bigint; v_left text := '';
begin
  for r in select c.conrelid::regclass as t, a.attname as col
             from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
            where c.contype = 'f' and c.confrelid = 'auth.users'::regclass loop
    execute format('select count(*) from %s where %I = %L', r.t, r.col, 'a2a00000-0000-4000-8000-0000000000b2') into v;
    if v > 0 then v_left := v_left || r.t || '.' || r.col || ' '; end if;
  end loop;
  perform tests.ok(v_left = '', 'audit compte : aucune ligne ne référence plus la personne supprimée', v_left);
end $$;
select tests.ok((select count(*) from auth.users where id = :'B') = 0, 'audit compte : l''identité de connexion est supprimée');
select tests.ok((select count(*) from public.household_audit_log where household_id = :'H'
                 and (coalesce(before::text, '') || coalesce(after::text, '')) like '%confidentiel%') = 0,
  'audit compte : la suppression du compte n''inscrit pas le titre du document privé dans le journal');
-- Le foyer partagé et l'enfant restent à A ; le document partagé aussi (auteur effacé)
set role authenticated; set request.jwt.claim.sub = :'A';
select tests.ok((select count(*) from public.households where id = :'H') = 1 and (select count(*) from public.children where id = :'K') = 1,
  'audit compte : le foyer partagé et l''enfant restent visibles pour l''autre parent');
select tests.ok((select count(*) from public.documents where storage_path = :'H' || '/b-partage.pdf' and uploaded_by is null) = 1,
  'audit compte : le document partagé reste au foyer, sans auteur');
-- Jeton encore valide de B (jusqu'à son expiration) : plus aucun accès
set request.jwt.claim.sub = :'B';
select tests.ok((select count(*) from public.households) = 0 and (select count(*) from public.children) = 0
  and (select count(*) from public.documents) = 0 and (select count(*) from public.household_members) = 0,
  'audit compte : un jeton encore valide de la personne supprimée ne lit plus rien du foyer');
select tests.throws($q$insert into public.family_tasks (household_id, title) values ('a2a00000-0000-4000-8000-0000000000f1', 'x')$q$,
  'audit compte : un jeton encore valide de la personne supprimée ne peut plus écrire dans le foyer');
select tests.throws($q$select public.ensure_my_account()$q$,
  'audit compte : un jeton encore valide ne recrée pas de compte fantôme');
reset role; set request.jwt.claim.sub = '';
select tests.ok((select count(*) from public.profiles where id = :'B') = 0, 'audit compte : aucun profil fantôme recréé');

-- Personne seule dans son foyer : le foyer disparaît avec le compte
set role service_role;
select public.delete_user_account(:'S');
reset role;
select tests.ok((select count(*) from public.households where id = :'HS') = 0
  and (select count(*) from public.household_audit_log where household_id = :'HS') = 0,
  'audit compte : foyer non partagé supprimé avec son journal');
-- Réservé au serveur
set role authenticated; set request.jwt.claim.sub = :'A';
select tests.throws($q$select public.delete_user_account('a2a00000-0000-4000-8000-0000000000a1')$q$,
  'audit compte : delete_user_account n''est pas appelable depuis l''application');
reset role; set request.jwt.claim.sub = '';
