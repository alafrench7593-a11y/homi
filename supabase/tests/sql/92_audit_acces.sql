-- =====================================================================
-- Audit des accès (09/11/2026) : tentatives d'accès d'une AUTRE FAMILLE, d'un co-parent aux droits
-- limités, d'un profil enfant masqué, d'un visiteur sans compte (anon) et d'un COMPTE SUPPRIMÉ dont le
-- jeton de connexion serait encore valide. Vise surtout les tables sensibles qui n'avaient encore aucun
-- test d'isolation (allaitement, tire-lait, repas, étapes, santé, besoins particuliers, bébés attendus,
-- prénoms, listes, papiers, bilan du couple, traitements personnels, cercle de soutien, appareils push,
-- favoris, quota assistant, invitations au foyer).
-- Les vérifications « génériques » parcourent TOUTES les tables publiques qui portent une colonne
-- household_id ou user_id : une table ajoutée plus tard sans RLS correcte fera échouer ce fichier.
-- =====================================================================
\set AM 'd0920000-0000-4000-8000-000000000001'
\set AP 'd0920000-0000-4000-8000-000000000002'
\set AX 'd0920000-0000-4000-8000-000000000003'
\set AS 'd0920000-0000-4000-8000-000000000004'
\set AH 'd0920000-0000-4000-8000-0000000000a1'
\set XH 'd0920000-0000-4000-8000-0000000000a2'
\set ENF 'd0920000-0000-4000-8000-0000000000c1'
\set ENFX 'd0920000-0000-4000-8000-0000000000c2'
\set GRO 'd0920000-0000-4000-8000-0000000000b1'
\set NF 'd0920000-0000-4000-8000-0000000000e1'
\set CL 'd0920000-0000-4000-8000-0000000000e2'

-- ---------------------------------------------------------------- Mise en place (serveur)
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values
  (:'AM', 'audit-maman@exemple.test'), (:'AP', 'audit-coparent@exemple.test'),
  (:'AX', 'audit-autre@exemple.test'), (:'AS', 'audit-supprime@exemple.test');
insert into public.households (id, name, created_by) values (:'AH', 'Foyer audit', :'AM'), (:'XH', 'Autre famille', :'AX');
insert into public.household_members (household_id, user_id, role) values (:'AH', :'AM', 'owner'), (:'XH', :'AX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
-- Co-parent aux droits limités au quotidien ; co-parent « complet » qui supprimera son compte
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'AH', :'AP', 'coparent', '{daily}', '{daily}'),
  (:'AH', :'AS', 'coparent', '{daily,health,documents,pregnancy,lists,names,profile}', '{daily,health,documents,pregnancy,lists,names,profile}');
insert into public.children (id, household_id, first_name, birth_date) values (:'ENF', :'AH', 'Audit', current_date - 200), (:'ENFX', :'XH', 'Autre', current_date - 100);
insert into public.pregnancies (id, household_id, carrier_user_id, due_date) values (:'GRO', :'AH', :'AM', current_date + 120);

-- Données sensibles du foyer de la maman
insert into public.breastfeeds (child_id, household_id, side, started_at) values (:'ENF', :'AH', 'left', now() - interval '2 hours');
insert into public.pumpings (child_id, household_id, at, amount_ml) values (:'ENF', :'AH', now() - interval '3 hours', 90);
insert into public.meals (child_id, household_id, at, foods) values (:'ENF', :'AH', now(), '{carotte}');
insert into public.child_milestones (child_id, household_id, kind, title) values (:'ENF', :'AH', 'milestone', 'Premier sourire');
insert into public.child_health_items (child_id, household_id, kind, label) values (:'ENF', :'AH', 'allergy', 'Allergie arachide');
insert into public.child_need_entries (household_id, child_id, kind, title) values (:'AH', :'ENF', 'assessment', 'Bilan orthophonie');
insert into public.expected_babies (pregnancy_id, household_id, position) values (:'GRO', :'AH', 1);
insert into public.name_favorites (id, household_id, name) values (:'NF', :'AH', 'Prénom secret');
insert into public.name_votes (favorite_id, household_id, user_id, vote) values (:'NF', :'AH', :'AM', 1);
insert into public.checklists (id, household_id, kind, title) values (:'CL', :'AH', 'maternity_bag', 'Valise maternité');
insert into public.checklist_items (checklist_id, household_id, label) values (:'CL', :'AH', 'Pyjama');
insert into public.family_papers (household_id, kind) values (:'AH', 'carte_vitale');
insert into public.couple_checkins (household_id, week_of, heavy) values (:'AH', current_date, 'Semaine difficile');
-- invitation : réservée à une abonnée (déclencheur Premium), déposée au nom de la maman abonnée
select tests.set_premium(:'AM', true);
set request.jwt.claim.sub = :'AM';
insert into public.household_invitations (household_id, invited_by, token_hash, can_view, can_edit) values (:'AH', :'AM', 'audit92-empreinte', '{daily}', '{daily}');
set request.jwt.claim.sub = '';
select tests.set_premium(:'AM', false);
-- Données personnelles de la maman
insert into public.my_treatments (user_id, name, dose_text, times, start_date) values (:'AM', 'Fer', '1 comprimé', '{08:00}', current_date);
insert into public.support_circle (user_id, name) values (:'AM', 'Ma sœur');
insert into public.favorites (user_id, item_type, item_id) values (:'AM', 'article', gen_random_uuid());
insert into public.push_devices (user_id, expo_push_token, platform) values (:'AM', 'ExponentPushToken[audit92-maman]', 'ios');
insert into public.assistant_usage (user_id, month, questions) values (:'AM', date_trunc('month', now())::date, 2);
insert into storage.objects (bucket_id, name, owner) values ('cycle-private', :'AM' || '/' || gen_random_uuid() || '.enc', :'AM');
-- Données personnelles du compte qui sera supprimé
insert into public.my_treatments (user_id, name, dose_text, times, start_date) values (:'AS', 'Vitamine D', '1 ampoule', '{09:00}', current_date);
insert into public.support_circle (user_id, name) values (:'AS', 'Un ami');
insert into public.push_devices (user_id, expo_push_token, platform) values (:'AS', 'ExponentPushToken[audit92-supprime]', 'android');
insert into public.mood_checkins (user_id, mood, journal) values (:'AS', 2, 'Journal privé');

-- Contrôle de la mise en place (le service voit tout)
select tests.ok((select count(*) from public.breastfeeds where household_id = :'AH') = 1
  and (select count(*) from public.name_favorites where household_id = :'AH') = 1, 'audit accès : données de test du foyer en place');

-- ================================================================ AUTRE FAMILLE
set role authenticated; set request.jwt.claim.sub = :'AX';

-- Lecture : tables ciblées une à une
select tests.ok(tests.count('select * from public.breastfeeds where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : allaitements invisibles');
select tests.ok(tests.count('select * from public.pumpings where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : tire-lait invisible');
select tests.ok(tests.count('select * from public.meals where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : repas de l''enfant invisibles');
select tests.ok(tests.count('select * from public.child_milestones where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : étapes de l''enfant invisibles');
select tests.ok(tests.count('select * from public.child_health_items where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : fiche santé de l''enfant invisible');
select tests.ok(tests.count('select * from public.child_need_entries where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : suivi « besoins particuliers » invisible');
select tests.ok(tests.count('select * from public.expected_babies where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : bébés attendus invisibles');
select tests.ok(tests.count('select * from public.name_favorites where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : liste de prénoms invisible');
select tests.ok(tests.count('select * from public.name_votes where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : votes sur les prénoms invisibles');
select tests.ok(tests.count('select * from public.checklist_items where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : listes (valise maternité) invisibles');
select tests.ok(tests.count('select * from public.family_papers where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : papiers de la famille invisibles');
select tests.ok(tests.count('select * from public.couple_checkins where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : bilan du couple invisible');
select tests.ok(tests.count('select * from public.household_invitations where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 0, 'autre famille : invitations du foyer invisibles');
select tests.ok(tests.count('select * from public.my_treatments where user_id = ''d0920000-0000-4000-8000-000000000001''') = 0, 'autre famille : traitements personnels invisibles');
select tests.ok(tests.count('select * from public.support_circle where user_id = ''d0920000-0000-4000-8000-000000000001''') = 0, 'autre famille : cercle de soutien invisible');
select tests.ok(tests.count('select * from public.favorites where user_id = ''d0920000-0000-4000-8000-000000000001''') = 0, 'autre famille : favoris invisibles');
select tests.ok(tests.count('select * from public.push_devices where user_id = ''d0920000-0000-4000-8000-000000000001''') = 0, 'autre famille : jetons push invisibles');
select tests.ok(tests.count('select * from public.assistant_usage where user_id = ''d0920000-0000-4000-8000-000000000001''') = 0, 'autre famille : quota assistant d''autrui invisible');
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''cycle-private'' and name like ''d0920000-0000-4000-8000-000000000001/%''') = 0, 'autre famille : photos chiffrées du cycle invisibles');
select tests.ok(not public.can_access_child(:'ENF') and not public.can_access_pregnancy(:'GRO'), 'autre famille : aucun droit sur l''enfant ni la grossesse');

-- Lecture : TOUTES les tables du foyer et toutes les tables personnelles (aucune ligne étrangère)
do $$
declare r record; n bigint;
begin
  for r in select c.relname from pg_class c join pg_attribute a on a.attrelid = c.oid
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and a.attname = 'household_id' and not a.attisdropped order by 1 loop
    begin
      execute format('select count(*) from public.%I where household_id is not null and not public.is_household_member(household_id)', r.relname) into n;
    exception when insufficient_privilege then n := 0;
    end;
    perform tests.ok(n = 0, 'autre famille (générique) : aucune ligne d''un foyer étranger dans ' || r.relname, n || ' ligne(s) visible(s)');
  end loop;
  for r in select c.relname from pg_class c join pg_attribute a on a.attrelid = c.oid
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and a.attname = 'user_id' and not a.attisdropped
             and c.relname not in ('community_profiles', 'place_suggestions') -- pseudonymes publics, lieux approuvés
           order by 1 loop
    begin
      execute format('select count(*) from public.%I where user_id is distinct from auth.uid()', r.relname) into n;
    exception when insufficient_privilege then n := 0;
    end;
    perform tests.ok(n = 0, 'autre famille (générique) : aucune donnée personnelle d''autrui dans ' || r.relname, n || ' ligne(s) visible(s)');
  end loop;
end $$;

-- Écriture : impossible d'ajouter, modifier ou effacer dans le foyer de la maman
select tests.throws($$insert into public.breastfeeds (child_id, household_id, side, started_at) values ('d0920000-0000-4000-8000-0000000000c1', 'd0920000-0000-4000-8000-0000000000a2', 'left', now())$$,
  'autre famille : allaitement sur l''enfant d''un autre foyer refusé (foyer recalculé)');
select tests.throws($$insert into public.child_need_entries (household_id, child_id, kind, title) values ('d0920000-0000-4000-8000-0000000000a2', 'd0920000-0000-4000-8000-0000000000c1', 'observation', 'x')$$,
  'autre famille : suivi rattaché à l''enfant d''un autre foyer refusé');
select tests.throws($$insert into public.name_favorites (household_id, name) values ('d0920000-0000-4000-8000-0000000000a1', 'Intrus')$$, 'autre famille : ajout de prénom dans un foyer étranger refusé');
select tests.throws($$insert into public.checklist_items (checklist_id, household_id, label) values ('d0920000-0000-4000-8000-0000000000e2', 'd0920000-0000-4000-8000-0000000000a1', 'Intrus')$$, 'autre famille : ajout dans une liste étrangère refusé');
select tests.throws($$insert into public.couple_checkins (household_id, week_of) values ('d0920000-0000-4000-8000-0000000000a1', current_date - 7)$$, 'autre famille : bilan du couple d''un foyer étranger refusé');
select tests.throws($$insert into public.expected_babies (pregnancy_id, household_id, position) values ('d0920000-0000-4000-8000-0000000000b1', 'd0920000-0000-4000-8000-0000000000a2', 2)$$, 'autre famille : bébé attendu sur une grossesse étrangère refusé');
select tests.throws($$insert into public.children (household_id, first_name, birth_date) values ('d0920000-0000-4000-8000-0000000000a1', 'Intrus', current_date)$$, 'autre famille : création d''un profil enfant dans un foyer étranger refusée');
select tests.throws($$insert into public.household_members (household_id, user_id, role) values ('d0920000-0000-4000-8000-0000000000a1', auth.uid(), 'coparent')$$, 'autre famille : impossible de s''ajouter soi-même au foyer');
select tests.throws($$insert into public.household_invitations (household_id, invited_by, token_hash, can_view, can_edit) values ('d0920000-0000-4000-8000-0000000000a1', auth.uid(), 'x', '{daily}', '{daily}')$$, 'autre famille : fabrication d''une invitation refusée');
select tests.throws($$insert into public.my_treatments (user_id, name, dose_text, times, start_date) values ('d0920000-0000-4000-8000-000000000001', 'x', 'x', '{08:00}', current_date)$$, 'autre famille : traitement au nom d''une autre personne refusé');
select tests.throws($$insert into public.push_devices (user_id, expo_push_token, platform) values ('d0920000-0000-4000-8000-000000000001', 'ExponentPushToken[vol]', 'ios')$$, 'autre famille : jeton push au nom d''une autre personne refusé');
select tests.throws($$select public.set_member_scope('d0920000-0000-4000-8000-0000000000a1', 'd0920000-0000-4000-8000-000000000002', null, true)$$, 'autre famille : impossible de changer les profils partagés d''un foyer étranger');
update public.child_health_items set label = 'modifié' where household_id = :'AH';
update public.name_favorites set name = 'modifié' where household_id = :'AH';
update public.my_treatments set dose_text = '10 comprimés' where user_id = :'AM';
update public.household_members set can_view = '{daily,health,documents,pregnancy,lists,names,profile}' where household_id = :'AH';
delete from public.breastfeeds where household_id = :'AH';
delete from public.family_papers where household_id = :'AH';
delete from public.support_circle where user_id = :'AM';
delete from public.household_members where household_id = :'AH';
reset role;
select tests.ok((select label from public.child_health_items where household_id = :'AH') = 'Allergie arachide'
  and (select name from public.name_favorites where id = :'NF') = 'Prénom secret'
  and (select dose_text from public.my_treatments where user_id = :'AM') = '1 comprimé', 'autre famille : modifications sans effet (santé, prénoms, traitement)');
select tests.ok((select can_view from public.household_members where household_id = :'AH' and user_id = :'AP') = '{daily}', 'autre famille : droits du co-parent inchangés');
select tests.ok((select count(*) from public.breastfeeds where household_id = :'AH') = 1
  and (select count(*) from public.family_papers where household_id = :'AH') = 1
  and (select count(*) from public.support_circle where user_id = :'AM') = 1
  and (select count(*) from public.household_members where household_id = :'AH') = 3, 'autre famille : suppressions sans effet');

-- ================================================================ VISITEUR SANS COMPTE (anon)
set role anon; set request.jwt.claim.sub = '';
do $$
declare r record; n bigint; leaks text[] := '{}';
begin
  for r in select distinct c.relname from pg_class c join pg_attribute a on a.attrelid = c.oid
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and a.attname in ('household_id', 'user_id', 'author_id', 'owner_id', 'created_by') and not a.attisdropped
             and c.relname not in ('articles', 'kid_products', 'product_prices', 'videos') -- contenus éditoriaux publiés
           order by 1 loop
    begin
      execute format('select count(*) from public.%I', r.relname) into n;
    exception when insufficient_privilege then n := 0;
    end;
    if n > 0 then leaks := leaks || r.relname; end if;
  end loop;
  perform tests.ok(cardinality(leaks) = 0, 'sans compte : aucune donnée de foyer ni de membre lisible', array_to_string(leaks, ', '));
end $$;
select tests.throws($$select public.create_household('Anonyme')$$, 'sans compte : création de foyer refusée');
select tests.throws($$insert into public.breastfeeds (child_id, household_id, side, started_at) values ('d0920000-0000-4000-8000-0000000000c1', 'd0920000-0000-4000-8000-0000000000a1', 'left', now())$$, 'sans compte : écriture refusée');
select tests.throws($$select public.admin_stats()$$, 'sans compte : statistiques d''administration refusées');
select tests.ok(not public.has_premium('d0920000-0000-4000-8000-000000000001'), 'sans compte : statut Premium d''autrui non révélé');
reset role;

-- ================================================================ CO-PARENT AUX DROITS LIMITÉS
set role authenticated; set request.jwt.claim.sub = :'AP';
select tests.ok(tests.count('select * from public.breastfeeds') = 1 and tests.count('select * from public.meals') = 1, 'co-parent (quotidien) : voit l''allaitement et les repas');
select tests.ok(tests.count('select * from public.child_health_items') = 0 and tests.count('select * from public.child_need_entries') = 0, 'co-parent (quotidien) : santé et besoins particuliers non partagés → invisibles');
select tests.ok(tests.count('select * from public.expected_babies') = 0 and tests.count('select * from public.name_favorites') = 0
  and tests.count('select * from public.checklist_items') = 0 and tests.count('select * from public.family_papers') = 0, 'co-parent (quotidien) : grossesse, prénoms, listes et papiers non partagés → invisibles');
select tests.ok(tests.count('select * from public.household_invitations') = 0, 'co-parent : invitations réservées à la propriétaire');
select tests.ok(tests.count('select * from public.my_treatments') = 0 and tests.count('select * from public.support_circle') = 0, 'co-parent : traitements et cercle de soutien de la maman restent privés');
select tests.throws($$insert into public.child_health_items (child_id, household_id, kind, label) values ('d0920000-0000-4000-8000-0000000000c1', 'd0920000-0000-4000-8000-0000000000a1', 'info', 'x')$$, 'co-parent (quotidien) : écriture santé refusée');
select tests.throws($$select public.create_household_invitation('d0920000-0000-4000-8000-0000000000a1')$$, 'co-parent : ne peut pas inviter');
select tests.throws($$select public.set_member_scope('d0920000-0000-4000-8000-0000000000a1', auth.uid(), null, true)$$, 'co-parent : ne peut pas élargir ses propres profils partagés');
update public.household_members set can_view = '{daily,health}' where user_id = auth.uid();
reset role;
select tests.ok((select can_view from public.household_members where household_id = :'AH' and user_id = :'AP') = '{daily}', 'co-parent : impossible de s''attribuer des droits');

-- Profil enfant masqué : la propriétaire retire l'enfant des profils partagés avec le co-parent
set role authenticated; set request.jwt.claim.sub = :'AM';
select public.set_member_scope(:'AH', :'AP', array[]::uuid[], true);
set request.jwt.claim.sub = :'AP';
select tests.ok(tests.count('select * from public.breastfeeds') = 0 and tests.count('select * from public.children where id = ''d0920000-0000-4000-8000-0000000000c1''') = 0, 'profil enfant masqué : le co-parent ne voit plus l''enfant ni son suivi');
select tests.throws($$insert into public.meals (child_id, household_id, at) values ('d0920000-0000-4000-8000-0000000000c1', 'd0920000-0000-4000-8000-0000000000a1', now())$$, 'profil enfant masqué : écriture sur cet enfant refusée');
set request.jwt.claim.sub = :'AM';
select public.set_member_scope(:'AH', :'AP', null, true);
set request.jwt.claim.sub = :'AP';
select tests.ok(tests.count('select * from public.breastfeeds') = 1, 'profil enfant de nouveau partagé : suivi visible');
reset role;

-- ================================================================ COMPTE SUPPRIMÉ
set role authenticated; set request.jwt.claim.sub = :'AS';
select tests.ok(tests.count('select * from public.child_health_items') = 1 and tests.count('select * from public.my_treatments') = 1, 'compte à supprimer : accès normal avant suppression');
reset role; set request.jwt.claim.sub = '';
select public.delete_user_account(:'AS');
select tests.ok(not exists (select 1 from auth.users where id = :'AS'), 'compte supprimé : identité effacée');
select tests.ok(not exists (select 1 from public.household_members where user_id = :'AS'), 'compte supprimé : retiré du foyer');
select tests.ok((select count(*) from public.my_treatments where user_id = :'AS') = 0 and (select count(*) from public.support_circle where user_id = :'AS') = 0
  and (select count(*) from public.push_devices where user_id = :'AS') = 0 and (select count(*) from public.mood_checkins where user_id = :'AS') = 0,
  'compte supprimé : traitements, cercle, jetons push et journal effacés');
select tests.ok((select count(*) from public.breastfeeds where household_id = :'AH') = 1 and (select count(*) from public.my_treatments where user_id = :'AM') = 1,
  'compte supprimé : les données du foyer et de la maman sont conservées');
select tests.set_premium(:'AM', true);
set role authenticated; set request.jwt.claim.sub = :'AM';
create temp table audit92_inv as select public.create_household_invitation(:'AH', 'coparent', array['daily'], array['daily']) as token;
grant select on audit92_inv to authenticated;
reset role;
select tests.set_premium(:'AM', false);

-- Jeton de connexion encore valide après la suppression (jusqu'à son expiration)
set role authenticated; set request.jwt.claim.sub = :'AS';
do $$
declare r record; n bigint; leaks text[] := '{}';
begin
  for r in select distinct c.relname from pg_class c join pg_attribute a on a.attrelid = c.oid
           where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and a.attname in ('household_id', 'user_id') and not a.attisdropped
             and c.relname not in ('community_profiles', 'place_suggestions')
           order by 1 loop
    begin
      -- lignes rattachées à un foyer ou à une personne (les contenus éditoriaux sans foyer restent publics)
      execute format('select count(*) from public.%I where %I is not null', r.relname,
        case when exists (select 1 from pg_attribute where attrelid = ('public.' || quote_ident(r.relname))::regclass and attname = 'household_id' and not attisdropped) then 'household_id' else 'user_id' end) into n;
    exception when insufficient_privilege then n := 0;
    end;
    if n > 0 then leaks := leaks || r.relname; end if;
  end loop;
  perform tests.ok(cardinality(leaks) = 0, 'compte supprimé (jeton encore valide) : plus aucune donnée de foyer ni personnelle lisible', array_to_string(leaks, ', '));
end $$;
select tests.ok(not public.can_access_household(:'AH', 'daily', false) and not public.can_access_child(:'ENF'), 'compte supprimé : plus aucun droit sur le foyer ni l''enfant');
select tests.throws($$insert into public.breastfeeds (child_id, household_id, side, started_at) values ('d0920000-0000-4000-8000-0000000000c1', 'd0920000-0000-4000-8000-0000000000a1', 'right', now())$$, 'compte supprimé : écriture dans l''ancien foyer refusée');
select tests.throws($$insert into public.my_treatments (name, dose_text, times, start_date) values ('x', 'x', '{08:00}', current_date)$$, 'compte supprimé : nouvelle donnée personnelle refusée');
select tests.throws($$select public.accept_household_invitation((select token from audit92_inv))$$, 'compte supprimé : impossible de rejoindre un foyer avec une invitation');
select tests.throws($$select public.create_household('Foyer fantôme')$$, 'compte supprimé : impossible de recréer un foyer');
select tests.throws($$insert into public.community_profiles (user_id, pseudonym) values (auth.uid(), 'Fantome_92')$$, 'compte supprimé : impossible de recréer un profil communauté');
select tests.ok(not jsonb_path_exists(coalesce(public.export_my_data(), '{}'::jsonb), '$.** ? (@ == "Allergie arachide" || @ == "Fer")'), 'compte supprimé : l''export ne contient aucune donnée du foyer');
reset role;

-- La maman garde tout, le co-parent restant aussi
set role authenticated; set request.jwt.claim.sub = :'AM';
select tests.ok(tests.count('select * from public.child_health_items') = 1 and tests.count('select * from public.household_members where household_id = ''d0920000-0000-4000-8000-0000000000a1''') = 2,
  'compte supprimé : la maman garde ses données et voit le foyer à jour');
reset role;
