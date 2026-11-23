-- =====================================================================
-- Audit n°7 « Parcours du foyer et intégrations » (18/11/2026) — reproductions F1, F2 (rouges avant
-- 20261118000700_audit_foyer_integrations.sql) et cycle de vie complet d'une invitation par rôle :
-- propriétaire, co-parent, nounou limitée à un enfant, membre parti, autre foyer.
-- =====================================================================
\set OW 'ab98f700-0000-4000-8000-000000000001'
\set CP 'ab98f700-0000-4000-8000-000000000002'
\set NN 'ab98f700-0000-4000-8000-000000000003'
\set XO 'ab98f700-0000-4000-8000-000000000006'
\set H  'ab98f700-0000-4000-8000-0000000000a1'
\set K1 'ab98f700-0000-4000-8000-0000000000c1'
\set K2 'ab98f700-0000-4000-8000-0000000000c2'
\set PG 'ab98f700-0000-4000-8000-0000000000d1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f7-proprietaire@exemple.test'), (:'CP', 'f7-coparent@exemple.test'),
  (:'NN', 'f7-nounou@exemple.test'), (:'XO', 'f7-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98y', :'OW');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Léa', '2024-01-01'), (:'K2', :'H', 'Tom', '2022-01-01');
insert into public.pregnancies (id, household_id, due_date) values (:'PG', :'H', (current_date + 90));
select tests.set_premium(:'OW', true);

set role authenticated;
-- ---------------------------------------------------------------- invitations créées par la propriétaire
set request.jwt.claim.sub = :'OW';
select public.create_household_invitation(:'H', 'coparent') as tok_cp \gset
select public.create_household_invitation(:'H', 'caregiver', '{daily,lists}', '{daily}', null, array[:'K1']::uuid[], false) as tok_nn \gset
select public.create_household_invitation(:'H', 'caregiver', '{daily,lists}', '{daily}', null, array[:'K1']::uuid[], false) as tok_exp \gset
select public.create_household_invitation(:'H', 'caregiver', '{daily,lists}', '{daily}', null, array[:'K1']::uuid[], false) as tok_rev \gset
select tests.ok((select count(*) from public.household_invitations where household_id = :'H') = 4, 'invitation : la propriétaire voit ses 4 invitations');
select tests.ok((select count(*) from public.household_invitations where household_id = :'H' and token_hash is not null and char_length(token_hash) = 64) = 4,
  'invitation : seule l''empreinte du code est stockée');
-- F1 : la propriétaire ouvre son propre lien → refus, l'invitation reste utilisable
select tests.throws(format('select public.accept_household_invitation(%L)', :'tok_cp'), 'F1 : la propriétaire ne « s''accepte » pas elle-même (déjà membre)');
select tests.ok((select accepted_at is null from public.household_invitations where token_hash = encode(extensions.digest(:'tok_cp', 'sha256'), 'hex')),
  'F1 : lien ouvert par la propriétaire → invitation non consommée');

-- ---------------------------------------------------------------- co-parent
set request.jwt.claim.sub = :'CP';
select tests.ok(public.accept_household_invitation(:'tok_cp') = :'H', 'invitation : le co-parent accepte et rejoint le foyer');
select tests.throws(format('select public.accept_household_invitation(%L)', :'tok_cp'), 'invitation : un code déjà utilisé est refusé');
select tests.throws('select public.create_household_invitation(''ab98f700-0000-4000-8000-0000000000a1''::uuid, ''caregiver'')', 'invitation : un co-parent ne peut pas inviter');
select tests.ok(tests.count('select 1 from public.household_invitations where household_id = ''ab98f700-0000-4000-8000-0000000000a1''') = 0, 'invitation : un co-parent ne lit pas les invitations (codes, rôles)');
update public.household_invitations set revoked_at = now() where household_id = :'H';
reset role;
select tests.ok((select count(*) from public.household_invitations where household_id = :'H' and revoked_at is not null) = 0, 'invitation : un co-parent ne peut pas révoquer');
set role authenticated; set request.jwt.claim.sub = :'CP';
-- F1 : le co-parent ouvre le lien destiné à la nounou → refus, droits intacts, invitation intacte
select tests.throws(format('select public.accept_household_invitation(%L)', :'tok_nn'), 'F1 : un co-parent qui ouvre le lien de la nounou est refusé');
reset role;
select tests.ok((select role = 'coparent' and 'documents' = any(can_view) and 'pregnancy' = any(can_view) and child_scope is null and pregnancy_access
                   from public.household_members where household_id = :'H' and user_id = :'CP'),
  'F1 : droits du co-parent inchangés (domaines, tous les enfants, grossesse) — avant : réduits à ceux de la nounou');
select tests.ok((select accepted_at is null from public.household_invitations where token_hash = encode(extensions.digest(:'tok_nn', 'sha256'), 'hex')),
  'F1 : invitation de la nounou non consommée par le co-parent');

-- ---------------------------------------------------------------- nounou limitée à Léa
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(public.accept_household_invitation(:'tok_nn') = :'H', 'invitation : la nounou accepte le lien qui lui était destiné');
-- F1 : la nounou ouvre ensuite un lien co-parent → refus, rôle et périmètre inchangés
set request.jwt.claim.sub = :'OW';
select public.create_household_invitation(:'H', 'coparent') as tok_cp2 \gset
set request.jwt.claim.sub = :'NN';
select tests.throws(format('select public.accept_household_invitation(%L)', :'tok_cp2'), 'F1 : une nounou ne s''élargit pas par un lien co-parent (déjà membre)');
reset role;
select tests.ok((select role = 'caregiver' and can_view = '{daily,lists}' and child_scope = array[:'K1']::uuid[] and not pregnancy_access
                   from public.household_members where household_id = :'H' and user_id = :'NN'),
  'F1 : nounou toujours limitée (quotidien + listes, Léa seule, grossesse fermée) — avant : tous les domaines, grossesse ouverte');
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select 1 from public.children where household_id = ''ab98f700-0000-4000-8000-0000000000a1''') = 1, 'nounou : voit seulement l''enfant confié');
select tests.ok(tests.count('select 1 from public.pregnancies where household_id = ''ab98f700-0000-4000-8000-0000000000a1''') = 0, 'nounou : grossesse fermée');
select tests.ok(tests.count('select 1 from public.household_invitations') = 0, 'nounou : aucune invitation lisible');

-- ---------------------------------------------------------------- expiration, révocation, autre foyer
reset role;
update public.household_invitations set expires_at = now() - interval '1 minute' where token_hash = encode(extensions.digest(:'tok_exp', 'sha256'), 'hex');
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.household_invitations set revoked_at = now() where token_hash = encode(extensions.digest(:'tok_rev', 'sha256'), 'hex');
set request.jwt.claim.sub = :'XO';
select tests.throws(format('select public.accept_household_invitation(%L)', :'tok_exp'), 'invitation : expirée → refusée');
select tests.throws(format('select public.accept_household_invitation(%L)', :'tok_rev'), 'invitation : révoquée → refusée');
select tests.throws('select public.accept_household_invitation(''code-invente'')', 'invitation : code inventé → refusé');
select tests.ok(tests.count('select 1 from public.household_members where household_id = ''ab98f700-0000-4000-8000-0000000000a1''') = 0, 'autre foyer : aucun membre lisible après les refus');
select tests.ok(not exists (select 1 from public.household_member_names(:'H')), 'autre foyer : aucun prénom du foyer');
-- sans compte
reset role; set role anon; set request.jwt.claim.sub = '';
select tests.throws(format('select public.accept_household_invitation(%L)', :'tok_cp2'), 'invitation : sans compte → refusée');
reset role;

-- ---------------------------------------------------------------- F2 : agenda externe et missions refusées
set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.create_mission(:'H', 'Acheter du lait 98y', p_assignee => :'NN', p_due_at => now() + interval '3 hours'))->>'id' as m_dec \gset
select (public.create_mission(:'H', 'Goûter de Léa 98y', p_assignee => :'NN', p_child_id => :'K1', p_due_at => now() + interval '2 hours'))->>'id' as m_ok \gset
select (public.create_mission(:'H', 'Bain de Tom 98y', p_assignee => :'CP', p_child_id => :'K2', p_due_at => now() + interval '2 hours'))->>'id' as m_tom \gset
set request.jwt.claim.sub = :'NN';
select tests.ok(public.mission_respond(:'m_dec', 'decline') ->> 'status' = 'ok', 'mission : refus sans justification');
select tests.ok(public.mission_respond(:'m_ok', 'accept') ->> 'status' = 'ok', 'mission : acceptée par la nounou');
select tests.ok(public.mission_respond(:'m_tom', 'accept') ->> 'status' = 'not_found', 'mission d''un enfant non confié : introuvable pour la nounou');
select token as feed_nn from public.create_calendar_feed(:'H') \gset
set request.jwt.claim.sub = :'OW';
select token as feed_ow from public.create_calendar_feed(:'H') \gset
-- calendar_feed_data est appelée par la fonction calendar-feed (service, sans session)
reset role; set request.jwt.claim.sub = '';
select tests.ok(not exists (select 1 from jsonb_array_elements(public.calendar_feed_data(:'feed_nn') -> 'tasks') x where x ->> 'id' = :'m_dec'),
  'F2 : mission refusée absente de l''agenda externe de la nounou (avant : présente, statut « todo »)');
select tests.ok(not exists (select 1 from jsonb_array_elements(public.calendar_feed_data(:'feed_ow') -> 'tasks') x where x ->> 'id' = :'m_dec'),
  'F2 : mission refusée absente de l''agenda externe de la demandeuse (comme dans l''application)');
select tests.ok(exists (select 1 from jsonb_array_elements(public.calendar_feed_data(:'feed_nn') -> 'tasks') x where x ->> 'id' = :'m_ok' and x ->> 'mission_state' = 'accepted'),
  'F2 : mission acceptée présente, avec son état (filtre commun itemsBetween)');
select tests.ok(not exists (select 1 from jsonb_array_elements(public.calendar_feed_data(:'feed_nn') -> 'tasks') x where x ->> 'id' = :'m_tom'),
  'agenda externe : mission d''un enfant non confié absente pour la nounou');

-- ---------------------------------------------------------------- départ de la nounou
set role authenticated; set request.jwt.claim.sub = :'NN';
delete from public.household_members where household_id = :'H' and user_id = :'NN';
select tests.ok(tests.count('select 1 from public.family_tasks where household_id = ''ab98f700-0000-4000-8000-0000000000a1''') = 0, 'départ : plus aucune tâche ni mission lisible');
select tests.ok(tests.count('select 1 from public.children where household_id = ''ab98f700-0000-4000-8000-0000000000a1''') = 0, 'départ : plus aucun enfant lisible');
select tests.ok(public.mission_respond(:'m_ok', 'complete') ->> 'status' = 'not_found', 'départ : mission_respond → introuvable');
reset role; set request.jwt.claim.sub = '';
select tests.ok(public.calendar_feed_data(:'feed_nn') is null, 'départ : l''agenda externe de l''ex-nounou ne renvoie plus rien');
select tests.ok(public.calendar_feed_data(:'feed_ow') is not null, 'départ : l''agenda de la propriétaire continue');
