-- =====================================================================
-- Fondations du foyer (13/11/2026) — D. Événements métier typés (outbox), idempotence, anti-boucle
-- =====================================================================
\set OW 'd0970000-0000-4000-8000-000000000001'
\set NN 'd0970000-0000-4000-8000-000000000002'
\set XX 'd0970000-0000-4000-8000-000000000003'
\set CP 'd0970000-0000-4000-8000-000000000004'
\set H  'd0970000-0000-4000-8000-0000000000a1'
\set XH 'd0970000-0000-4000-8000-0000000000a2'
\set T1 'd0970000-0000-4000-8000-0000000000f1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f97-owner@exemple.test'), (:'NN', 'f97-nounou@exemple.test'), (:'XX', 'f97-autre@exemple.test'), (:'CP', 'f97-coparent@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 97', :'OW'), (:'XH', 'Autre 97', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'XH', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
  (:'H', :'NN', 'caregiver', '{lists}', '{lists}'), (:'H', :'CP', 'coparent', '{lists}', '{lists}');

-- Exemple réel : tâche terminée par la nounou → « task.completed », une seule fois
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.family_tasks (id, household_id, title, assignee_id) values (:'T1', :'H', 'Préparer le sac de Lou', :'NN');
set request.jwt.claim.sub = :'NN';
update public.family_tasks set status = 'done' where id = :'T1';
update public.family_tasks set notes = 'Fait avant 9 h' where id = :'T1';
reset role;
select tests.ok((select count(*) from public.household_events where type = 'task.completed' and entity_id = :'T1') = 1,
  'événements : tâche terminée → un seul « task.completed »');
select tests.ok((select actor_id = :'NN' and status = 'pending' and depth = 0 and payload ->> 'done_by' = :'NN' from public.household_events where type = 'task.completed' and entity_id = :'T1'),
  'événements : acteur, statut « à traiter », profondeur 0 et charge utile');
-- Rouvrir puis terminer à nouveau = un nouveau fait (clé différente)
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.family_tasks set status = 'todo' where id = :'T1';
update public.family_tasks set status = 'done', done_at = now() + interval '1 second' where id = :'T1';
reset role;
select tests.ok((select count(*) from public.household_events where type = 'task.completed' and entity_id = :'T1') = 2
  and (select count(*) from public.household_events where type = 'task.reopened' and entity_id = :'T1') = 1, 'événements : réouverture puis nouvelle fin = 2 faits distincts');

-- Idempotence : la même clé rejouée ne crée rien
create temp table f97 as select public._emit_household_event(:'H', 'shopping.item_checked', 'shopping_items', 'x1', '{"label":"Lait"}', 'test97:lait') as id;
select tests.ok(public._emit_household_event(:'H', 'shopping.item_checked', 'shopping_items', 'x1', '{"label":"Lait"}', 'test97:lait') = (select id from f97)
  and (select count(*) from public.household_events where idempotency_key = 'test97:lait') = 1, 'événements : clé d''idempotence rejouée → même événement, aucun doublon');
select tests.throws($$insert into public.household_events (household_id, type, entity_table, idempotency_key) values ('d0970000-0000-4000-8000-0000000000a1', 'stock.low', 'x', 'test97:lait')$$,
  'événements : clé d''idempotence UNIQUE (insertion directe en double refusée)');
select tests.throws($$select public._emit_household_event(null, 'stock.low', 'x', null, '{}', 'k')$$, 'événements : foyer obligatoire');
select tests.throws($$select public._emit_household_event('d0970000-0000-4000-8000-0000000000a1', 'inconnu', 'x', null, '{}', 'k2')$$, 'événements : type inconnu refusé (énuméré)');

-- Anti-boucle : profondeur et origine héritées du traitement en cours
create temp table f97_claim as select * from public.claim_household_events(10, array['shopping.item_checked']::public.household_event_type[]);
select tests.ok((select count(*) from f97_claim) = 1 and (select status from public.household_events where idempotency_key = 'test97:lait') = 'processing'
  and (select attempts from public.household_events where idempotency_key = 'test97:lait') = 1, 'consommateur : réservation (processing, tentative 1)');
select tests.ok((select count(*) from public.claim_household_events(10, array['shopping.item_checked']::public.household_event_type[])) = 0, 'consommateur : un événement réservé n''est pas distribué deux fois');
-- Le contexte de traitement vit dans la transaction du consommateur
begin;
select public._begin_event_processing((select id from f97));
select public._emit_household_event(:'H', 'stock.low', 'stocks', 'lait', '{}', 'test97:stock-lait');
select tests.ok((select depth = 1 and origin_event_id = (select id from f97) and root_event_id = (select id from f97) and status = 'pending'
  from public.household_events where idempotency_key = 'test97:stock-lait'), 'anti-boucle : événement dérivé = profondeur 1, origine et racine renseignées');
select public._begin_event_processing((select id from public.household_events where idempotency_key = 'test97:stock-lait'));
select public._emit_household_event(:'H', 'shopping.item_checked', 'shopping_items', 'x1', '{}', 'test97:lait-boucle');
select tests.ok((select status = 'skipped' and last_error like 'anti-boucle%'
  from public.household_events where idempotency_key = 'test97:lait-boucle'),
  'anti-boucle : le même fait déjà dans la chaîne → « skipped » (jamais traité)');
select public._begin_event_processing((select id from public.household_events where idempotency_key = 'test97:stock-lait'));
select public._begin_event_processing(public._emit_household_event(:'H', 'expense.recorded', 'expenses', 'e1', '{}', 'test97:p2'));
select public._begin_event_processing(public._emit_household_event(:'H', 'contract.updated', 'contracts', 'c1', '{}', 'test97:p3'));
select public._emit_household_event(:'H', 'timesheet.validated', 'timesheets', 't1', '{}', 'test97:p4');
select tests.ok((select status = 'skipped' and depth = 4 from public.household_events where idempotency_key = 'test97:p4'),
  'anti-boucle : au-delà de 3 niveaux → « skipped »');
select public._begin_event_processing(null);
select public._emit_household_event(:'H', 'stock.low', 'stocks', 'pain', '{}', 'test97:hors-traitement');
select tests.ok((select depth from public.household_events where idempotency_key = 'test97:hors-traitement') = 0,
  'anti-boucle : hors traitement, profondeur 0');
commit;
select public.finish_household_event((select id from f97), false, 'réseau');
select tests.ok((select status = 'pending' and available_at > now() and last_error = 'réseau' from public.household_events where id = (select id from f97)), 'consommateur : échec → nouvel essai différé');
update public.household_events set status = 'processing' where id = (select id from f97);
select public.finish_household_event((select id from f97), true);
select tests.ok((select status = 'done' and processed_at is not null and last_error is null from public.household_events where id = (select id from f97)), 'consommateur : traité → done');

-- Lecture et écriture côté client
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.household_events') >= 3, 'événements : la propriétaire lit les événements de son foyer');
select tests.throws($$select public._emit_household_event('d0970000-0000-4000-8000-0000000000a1', 'stock.low', 'x', null, '{}', 'client-k')$$, 'événements : émission directe par un client refusée');
select tests.throws($$insert into public.household_events (household_id, type, entity_table, idempotency_key) values ('d0970000-0000-4000-8000-0000000000a1', 'stock.low', 'x', 'client-k2')$$, 'événements : insertion directe par un client refusée');
select tests.throws($$select * from public.claim_household_events(10)$$, 'événements : consommation réservée au serveur');
select tests.throws($$update public.household_events set status = 'done'$$, 'événements : modification par un client refusée');
select tests.throws($$delete from public.household_events$$, 'événements : effacement par un client refusé');
select tests.ok(tests.count('select * from public.household_events where status = ''pending''') >= 1, 'événements : file intacte après les tentatives');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.household_events') >= 3, 'événements : co-parent lit les événements du foyer');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.household_events where household_id = ''d0970000-0000-4000-8000-0000000000a1''') = 0, 'événements : une nounou ne lit pas le bus du foyer');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.household_events where household_id = ''d0970000-0000-4000-8000-0000000000a1''') = 0, 'événements : autre foyer : rien de lisible');
reset role;
-- Retrait : l'ancien co-parent ne lit plus rien
delete from public.household_members where household_id = :'H' and user_id = :'CP';
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.household_events where household_id = ''d0970000-0000-4000-8000-0000000000a1''') = 0, 'événements : membre retiré → plus aucune lecture');
reset role;
