-- =====================================================================
-- Fondations du foyer (13/11/2026) — E. client_id unique par foyer, version, mise à jour conditionnelle
--                                     F. heures calmes et confidentialité côté serveur
-- =====================================================================
\set OW 'd0980000-0000-4000-8000-000000000001'
\set CP 'd0980000-0000-4000-8000-000000000002'
\set XX 'd0980000-0000-4000-8000-000000000003'
\set H  'd0980000-0000-4000-8000-0000000000a1'
\set XH 'd0980000-0000-4000-8000-0000000000a2'
\set SL 'd0980000-0000-4000-8000-0000000000e1'
\set C1 'd0980000-0000-4000-8000-0000000000b1'
\set C2 'd0980000-0000-4000-8000-0000000000b2'
\set C3 'd0980000-0000-4000-8000-0000000000b3'
\set NT 'd0980000-0000-4000-8000-0000000000f9'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98-owner@exemple.test'), (:'CP', 'f98-coparent@exemple.test'), (:'XX', 'f98-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98', :'OW'), (:'XH', 'Autre 98', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'XH', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'H', :'CP', 'coparent', '{lists}', '{lists}');
insert into public.shopping_lists (id, household_id, title) values (:'SL', :'H', 'Courses');

-- ================================================================ E. Doublons hors ligne
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.family_tasks (household_id, title, client_id) values (:'H', 'Acheter des couches', :'C1')
  on conflict (household_id, client_id) do nothing;
insert into public.family_tasks (household_id, title, client_id) values (:'H', 'Acheter des couches', :'C1')
  on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.family_tasks where client_id = ''d0980000-0000-4000-8000-0000000000b1''') = 1, 'hors ligne : tâche renvoyée deux fois → une seule ligne');
select tests.throws($$insert into public.family_tasks (household_id, title, client_id) values ('d0980000-0000-4000-8000-0000000000a1', 'Doublon', 'd0980000-0000-4000-8000-0000000000b1')$$,
  'hors ligne : doublon de client_id dans le même foyer refusé');
insert into public.care_requests (household_id, kind, message, client_id) values (:'H', 'rest', 'Je dors 1 h', :'C2') on conflict (household_id, client_id) do nothing;
insert into public.care_requests (household_id, kind, message, client_id) values (:'H', 'rest', 'Je dors 1 h', :'C2') on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.care_requests where client_id = ''d0980000-0000-4000-8000-0000000000b2''') = 1, 'hors ligne : demande renvoyée deux fois → une seule ligne');
insert into public.shopping_items (list_id, household_id, label, client_id) values (:'SL', :'H', 'Lait', :'C3') on conflict (household_id, client_id) do nothing;
insert into public.shopping_items (list_id, household_id, label, client_id) values (:'SL', :'H', 'Lait', :'C3') on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.shopping_items where client_id = ''d0980000-0000-4000-8000-0000000000b3''') = 1, 'hors ligne : article renvoyé deux fois → une seule ligne');
select tests.throws($$insert into public.shopping_items (list_id, household_id, label, client_id) values ('d0980000-0000-4000-8000-0000000000e1', 'd0980000-0000-4000-8000-0000000000a1', 'Lait bis', 'd0980000-0000-4000-8000-0000000000b3')$$,
  'hors ligne : doublon d''article refusé');
set request.jwt.claim.sub = :'XX';
-- Même client_id dans un AUTRE foyer : indépendant (unicité par foyer), et sans rien révéler
insert into public.family_tasks (household_id, title, client_id) values (:'XH', 'Autre tâche', :'C1') on conflict (household_id, client_id) do nothing;
select tests.ok(tests.count('select * from public.family_tasks') = 1, 'hors ligne : même client_id dans un autre foyer accepté (unicité par foyer)');
select tests.throws($$insert into public.family_tasks (household_id, title, client_id) values ('d0980000-0000-4000-8000-0000000000a1', 'Intrus', gen_random_uuid())$$, 'hors ligne : écriture dans un autre foyer refusée');

-- Version posée par le serveur, client_id figé
set request.jwt.claim.sub = :'OW';
select tests.ok((select version from public.family_tasks where client_id = :'C1') = 1, 'version : 1 à la création');
update public.family_tasks set title = 'Acheter des couches taille 3', version = 99, client_id = gen_random_uuid() where client_id = :'C1';
select tests.ok((select version from public.family_tasks where title = 'Acheter des couches taille 3') = 2
  and exists (select 1 from public.family_tasks where client_id = :'C1'), 'version : +1 par modification, impossible à forcer ; client_id figé');

-- Mise à jour conditionnelle : détection du conflit d'édition
create temp table f98_task as select id from public.family_tasks where client_id = :'C1';
grant select on f98_task to authenticated;
select tests.ok(public.update_if_version('family_tasks', (select id from f98_task), 2, '{"title":"Couches taille 3"}') ->> 'status' = 'ok', 'conflit : version attendue = version actuelle → écrit');
set request.jwt.claim.sub = :'CP';
-- Le co-parent avait lu la version 2 hors ligne : sa modification arrive après celle de la propriétaire
select tests.ok((select r ->> 'status' = 'conflict' and (r -> 'row' ->> 'version')::int = 3 and r -> 'row' ->> 'title' = 'Couches taille 3'
  from public.update_if_version('family_tasks', (select id from f98_task), 2, '{"title":"Couches taille 4"}') r), 'conflit : version périmée → « conflict » avec la ligne actuelle, rien n''est écrasé');
select tests.ok((select title from public.family_tasks where id = (select id from f98_task)) = 'Couches taille 3', 'conflit : la modification de la propriétaire est conservée');
select tests.ok(public.update_if_version('family_tasks', (select id from f98_task), 3, '{"status":"done"}') ->> 'status' = 'ok', 'conflit : nouvelle tentative sur la version actuelle → écrit');
select tests.throws($$select public.update_if_version('family_tasks', (select id from f98_task), 4, '{"household_id":"d0980000-0000-4000-8000-0000000000a2"}')$$, 'conflit : champ non modifiable (foyer) refusé');
select tests.throws($$select public.update_if_version('family_tasks', (select id from f98_task), 4, '{"version":1}')$$, 'conflit : version non modifiable directement');
select tests.throws($$select public.update_if_version('documents', (select id from f98_task), 1, '{"title":"x"}')$$, 'conflit : table non prise en charge refusée');
select tests.ok((select r ->> 'status' = 'ok' and (r -> 'row' ->> 'checked')::boolean from public.update_if_version('shopping_items',
  (select id from public.shopping_items where client_id = 'd0980000-0000-4000-8000-0000000000b3'), 1, '{"checked":true}') r), 'conflit : article coché (version 1 → 2)');
set request.jwt.claim.sub = :'XX';
select tests.ok(public.update_if_version('family_tasks', (select id from f98_task), 4, '{"title":"Piraté"}') ->> 'status' = 'not_found', 'conflit : autre foyer → « not_found » (rien n''est révélé)');
reset role;
select tests.ok((select title from public.family_tasks where id = (select id from f98_task)) = 'Couches taille 3', 'conflit : rien écrit par l''autre foyer');
-- Membre révoqué : plus de mise à jour possible
delete from public.household_members where household_id = :'H' and user_id = :'CP';
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(public.update_if_version('family_tasks', (select id from f98_task), 4, '{"title":"Après départ"}') ->> 'status' = 'not_found', 'conflit : membre retiré → plus aucune mise à jour');
reset role;

-- ================================================================ F. Heures calmes et confidentialité (serveur)
-- Sans réglage : 22 h → 7 h, Europe/Paris
select tests.ok(public.push_quiet_until(:'OW', '2026-11-13 22:30:00+01') = '2026-11-14 07:00:00+01', 'heures calmes : 22 h 30 → différée à 7 h le lendemain (réglage par défaut)');
select tests.ok(public.push_quiet_until(:'OW', '2026-11-13 06:10:00+01') = '2026-11-13 07:00:00+01', 'heures calmes : 6 h 10 → différée à 7 h');
select tests.ok(public.push_quiet_until(:'OW', '2026-11-13 12:00:00+01') is null, 'heures calmes : midi → envoi immédiat');
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.notification_settings (quiet_start, quiet_end, time_zone, lockscreen_details) values ('21:00', '08:30', 'America/Montreal', true);
select tests.throws($$insert into public.notification_settings (user_id, quiet_start) values ('d0980000-0000-4000-8000-000000000003', '20:00')$$, 'réglages : impossible de régler les notifications d''autrui');
select tests.throws($$update public.notification_settings set time_zone = 'Mars/Olympus'$$, 'réglages : fuseau horaire inconnu refusé');
select tests.throws($$select public.push_quiet_until('d0980000-0000-4000-8000-000000000001', now())$$, 'heures calmes : calcul réservé au serveur');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.notification_settings') = 0, 'réglages : ceux d''autrui invisibles');
reset role;
select tests.ok(public.push_quiet_until(:'OW', '2026-11-14 03:00:00+00') = '2026-11-14 08:30:00-05', 'heures calmes : fuseau de la personne (Montréal, 22 h locale → 8 h 30 locale)');
update public.notification_settings set quiet_enabled = false where user_id = :'OW';
select tests.ok(public.push_quiet_until(:'OW', '2026-11-14 03:00:00+00') is null, 'heures calmes : désactivées → envoi immédiat');
-- Notification : ni urgence, ni envoi, ni report modifiables par la personne ; seule la lecture lui appartient
insert into public.notifications (id, user_id, category, title, body) values (:'NT', :'OW', 'family', 'Lou a de la fièvre', 'Détail');
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.notifications set urgent = true, pushed_at = now(), deliver_after = now() + interval '1 day' where id = :'NT';
select tests.ok((select not urgent and pushed_at is null and deliver_after is null from public.notifications where id = :'NT'), 'notification : urgence et envoi non falsifiables par l''appli');
select tests.throws($$insert into public.notifications (user_id, category, title, urgent) values (auth.uid(), 'family', 'Fausse urgence', true)$$, 'notification : aucun client ne crée de notification (urgente ou non)');
reset role;
-- L'envoi (send-push) pose pushed_at / deliver_after, jamais read_at : pas de preuve de lecture
update public.notifications set pushed_at = now() where id = :'NT';
select tests.ok((select read_at is null from public.notifications where id = :'NT'), 'notification : l''envoi ne la marque jamais comme lue');
