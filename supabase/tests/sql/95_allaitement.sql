-- =====================================================================
-- Allaitement (20261113000100_allaitement.sql) : réserve de lait (milk_stash), tirage détaillé, sessions de tétée.
-- Accès : membre du foyer avec « daily » oui ; autre famille, coparent sans « daily », anonyme : non.
-- =====================================================================
\set LA_MAMAN   'a11a0000-0000-4000-8000-000000000001'
\set LA_PAPA    'a11a0000-0000-4000-8000-000000000002'
\set LA_SANS    'a11a0000-0000-4000-8000-000000000003'
\set LA_LECTURE 'a11a0000-0000-4000-8000-000000000004'
\set LA_AUTRE   'a11a0000-0000-4000-8000-000000000005'

insert into auth.users (id, email) values
  (:'LA_MAMAN', 'la-maman@exemple.test'), (:'LA_PAPA', 'la-papa@exemple.test'), (:'LA_SANS', 'la-sans@exemple.test'),
  (:'LA_LECTURE', 'la-lecture@exemple.test'), (:'LA_AUTRE', 'la-autre@exemple.test');

-- ---------------------------------------------------------------- Maman : foyer, bébé, invitations
set role authenticated; set request.jwt.claim.sub = :'LA_MAMAN';
select tests.set_premium(auth.uid(), true);
create temp table la_ctx as select public.create_household('Foyer allaitement') as hid;
grant select on la_ctx to authenticated;
create temp table la_inv_papa as select public.create_household_invitation((select hid from la_ctx), 'coparent', array['daily','profile'], array['daily']) as token;
create temp table la_inv_sans as select public.create_household_invitation((select hid from la_ctx), 'coparent', array['profile','lists'], array['lists']) as token;
create temp table la_inv_lecture as select public.create_household_invitation((select hid from la_ctx), 'caregiver', array['daily'], array[]::text[]) as token;
grant select on la_inv_papa, la_inv_sans, la_inv_lecture to authenticated;
insert into public.children (household_id, first_name, birth_date) select hid, 'Maëlle', current_date - 30 from la_ctx;
create temp table la_kid as select id from public.children where first_name = 'Maëlle';
grant select on la_kid to authenticated;

-- Réserve de lait : création, lecture, foyer recopié
insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage, location)
  select id, (select hid from la_ctx), 120, now() - interval '2 hours', 'freezer', 'Tiroir du haut' from la_kid;
insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage)
  select id, (select hid from la_ctx), 80, now() - interval '1 hour', 'fridge' from la_kid;
select tests.ok(tests.count('select * from public.milk_stash') = 2, 'réserve : la maman crée et lit ses portions');
select tests.ok((select bool_and(household_id = (select hid from la_ctx)) from public.milk_stash), 'réserve : foyer recopié depuis l''enfant');
select tests.ok((select bool_and(created_by = :'LA_MAMAN' and status = 'available' and status_at is null) from public.milk_stash), 'réserve : « enregistré par » et statut disponible par défaut');

-- Contrôles
select tests.throws($$insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_ctx), 0, now(), 'fridge' from la_kid$$, 'réserve : volume nul refusé');
select tests.throws($$insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_ctx), 50, now(), 'cave' from la_kid$$, 'réserve : conservation limitée à réfrigérateur / congélateur / autre');
select tests.throws($$update public.milk_stash set status = 'used' where storage = 'fridge'$$, 'réserve : « utilisée » sans date refusée');
select tests.throws($$update public.milk_stash set status = 'used', status_at = collected_at - interval '1 day' where storage = 'fridge'$$, 'réserve : date d''utilisation avant le recueil refusée');
update public.milk_stash set status = 'used', status_at = now() where storage = 'fridge';
select tests.ok((select sum(volume_ml) from public.milk_stash where status = 'available') = 120, 'réserve : stock restant = portions disponibles');
select tests.ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'milk_stash' and column_name ~ '(expir|limit|best_before|use_by)'),
  'réserve : aucune date limite de conservation stockée');

-- Tirage détaillé : colonnes facultatives, amount_ml reste le total
insert into public.pumpings (child_id, household_id, at, amount_ml, side, left_ml, right_ml, duration_min, comfort)
  select id, (select hid from la_ctx), now(), 110, 'both', 60, 45, 15, 'comfortable' from la_kid;
insert into public.pumpings (child_id, household_id, at, amount_ml, side) select id, (select hid from la_ctx), now(), 70, 'left' from la_kid;
select tests.ok(tests.count('select * from public.pumpings where child_id = (select id from la_kid)') = 2, 'tirage : saisie détaillée et saisie simple (ancienne forme) acceptées');
select tests.throws($$insert into public.pumpings (child_id, household_id, at, amount_ml, left_ml, right_ml) select id, (select hid from la_ctx), now(), 50, 60, 45 from la_kid$$, 'tirage : total inférieur à la somme des seins refusé');
select tests.throws($$insert into public.pumpings (child_id, household_id, at, amount_ml, comfort) select id, (select hid from la_ctx), now(), 50, 'note 3/5' from la_kid$$, 'tirage : confort en mots seulement');

-- Tétée chronométrée : deux segments reliés par session_id ; même client_id renvoyé = refusé (doublon)
insert into public.breastfeeds (client_id, session_id, child_id, household_id, side, started_at, ended_at)
  select 'a11a0000-0000-4000-8000-00000000a000', 'a11a0000-0000-4000-8000-0000000000ff', id, (select hid from la_ctx), 'left', now() - interval '20 minutes', now() - interval '12 minutes' from la_kid;
insert into public.breastfeeds (client_id, session_id, child_id, household_id, side, started_at, ended_at)
  select 'a11a0000-0000-4000-8000-00000000a001', 'a11a0000-0000-4000-8000-0000000000ff', id, (select hid from la_ctx), 'right', now() - interval '12 minutes', now() - interval '5 minutes' from la_kid;
select tests.throws($$insert into public.breastfeeds (client_id, session_id, child_id, household_id, side, started_at, ended_at)
  select 'a11a0000-0000-4000-8000-00000000a000', 'a11a0000-0000-4000-8000-0000000000ff', id, (select hid from la_ctx), 'left', now() - interval '20 minutes', now() - interval '12 minutes' from la_kid$$,
  'tétée : une session renvoyée (même client_id) n''est pas enregistrée deux fois');
select tests.ok(tests.count('select * from public.breastfeeds where session_id = ''a11a0000-0000-4000-8000-0000000000ff''') = 2, 'tétée : segments d''une même session regroupés');

-- Export RGPD : la réserve est exportée
select tests.ok(jsonb_array_length(public.export_my_data()->'milk_stash') = 2, 'export RGPD : réserve de lait incluse');
reset role;

-- ---------------------------------------------------------------- Autre famille : aucun accès
set role authenticated; set request.jwt.claim.sub = :'LA_AUTRE';
select tests.set_premium(auth.uid(), true);
select tests.ok(tests.count('select * from public.milk_stash') = 0, 'isolation : une autre famille ne voit aucune portion');
update public.milk_stash set volume_ml = 999;
delete from public.milk_stash;
select tests.throws($$insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_ctx), 50, now(), 'fridge' from la_kid$$,
  'isolation : une autre famille ne peut pas ajouter de portion pour cet enfant');
create temp table la_other as select public.create_household('Foyer étranger allaitement') as hid;
grant select on la_other to authenticated;
select tests.throws($$insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_other), 50, now(), 'fridge' from la_kid$$,
  'isolation : impossible de rattacher l''enfant d''un autre foyer à son propre foyer');
select tests.ok(jsonb_array_length(public.export_my_data()->'milk_stash') = 0, 'isolation : rien dans l''export d''une autre famille');
reset role;

-- ---------------------------------------------------------------- Coparent sans « daily »
set role authenticated; set request.jwt.claim.sub = :'LA_SANS';
select tests.set_premium(auth.uid(), true);
select tests.ok(public.accept_household_invitation((select token from la_inv_sans)) = (select hid from la_ctx), 'membre sans « daily » rejoint le foyer');
select tests.ok(tests.count('select * from public.milk_stash') = 0, 'permissions : sans « daily », la réserve n''est pas visible');
update public.milk_stash set status = 'discarded', status_at = now();
select tests.throws($$insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_ctx), 50, now(), 'fridge' from la_kid$$,
  'permissions : sans « daily », impossible d''ajouter une portion');
reset role;

-- ---------------------------------------------------------------- Proche en lecture seule
set role authenticated; set request.jwt.claim.sub = :'LA_LECTURE';
select tests.set_premium(auth.uid(), true);
select tests.ok(public.accept_household_invitation((select token from la_inv_lecture)) = (select hid from la_ctx), 'proche en lecture seule rejoint le foyer');
select tests.ok(tests.count('select * from public.milk_stash') = 2, 'lecture seule : voit la réserve');
update public.milk_stash set status = 'discarded', status_at = now() where status = 'available';
select tests.throws($$insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_ctx), 50, now(), 'fridge' from la_kid$$,
  'lecture seule : impossible d''ajouter une portion');
reset role;

-- ---------------------------------------------------------------- Coparent avec « daily »
set role authenticated; set request.jwt.claim.sub = :'LA_PAPA';
select tests.set_premium(auth.uid(), true);
select tests.ok(public.accept_household_invitation((select token from la_inv_papa)) = (select hid from la_ctx), 'coparent « daily » rejoint le foyer');
select tests.ok(tests.count('select * from public.milk_stash where status = ''available''') = 1, 'coparent « daily » : la lecture seule et les étrangers n''ont rien modifié');
update public.milk_stash set status = 'used', status_at = now() where status = 'available';
select tests.ok(tests.count('select * from public.milk_stash where status = ''available''') = 0, 'coparent « daily » : peut marquer une portion utilisée');
insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_ctx), 60, now(), 'fridge' from la_kid;
select tests.ok(tests.count('select * from public.milk_stash') = 3, 'coparent « daily » : peut ajouter une portion');
reset role;

-- ---------------------------------------------------------------- Restriction par enfant (child_scope)
set role authenticated; set request.jwt.claim.sub = :'LA_MAMAN';
insert into public.children (household_id, first_name, birth_date) select hid, 'Ilan', current_date - 300 from la_ctx;
select public.set_member_scope((select hid from la_ctx), :'LA_PAPA', array[(select id from public.children where first_name = 'Ilan')], true);
reset role;
set role authenticated; set request.jwt.claim.sub = :'LA_PAPA';
select tests.ok(tests.count('select * from public.milk_stash') = 0, 'périmètre : un membre limité à un autre enfant ne voit plus la réserve de ce bébé');
reset role;

-- ---------------------------------------------------------------- Premium strict : écriture réservée
-- L'abonnement d'un membre du foyer est partagé : on retire celui de tous les membres pour ce test
select tests.set_premium(u, false) from unnest(array[:'LA_MAMAN', :'LA_PAPA', :'LA_SANS', :'LA_LECTURE']::uuid[]) u;
update public.premium_policy set strict = true;
set role authenticated; set request.jwt.claim.sub = :'LA_MAMAN';
select tests.throws($$insert into public.milk_stash (child_id, household_id, volume_ml, collected_at, storage) select id, (select hid from la_ctx), 50, now(), 'fridge' from la_kid$$,
  'Premium strict : nouvelle portion refusée sans abonnement (comme les autres saisies de suivi)');
select tests.ok(tests.count('select * from public.milk_stash') = 3, 'Premium strict : la réserve reste lisible');
select tests.set_premium(auth.uid(), true);
reset role;
update public.premium_policy set strict = false;

set role anon;
select tests.throws($$select * from public.milk_stash$$, 'anonyme : aucun accès à la réserve');
reset role;

-- Suppression de l'enfant : sa réserve part avec lui
delete from public.children where id = (select id from la_kid);
select tests.ok((select count(*) from public.milk_stash where child_id = (select id from la_kid)) = 0, 'suppression de l''enfant : réserve effacée');
