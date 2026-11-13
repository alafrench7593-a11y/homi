-- =====================================================================
-- Courses et stocks (15/11/2026, phase 6) — RLS des stocks, seuil → suggestion SANS mission automatique,
-- confirmation → mission + article sans doublon (rejeu idempotent), stock modifié seulement après validation,
-- coche par le destinataire → mission terminée, coche par un autre → pas de transition forcée, anti-boucle,
-- historique / audit, fusion de doublons, migration du garde-manger. Scénarios A (étape 8) et F.
-- =====================================================================
\set OW 'd098c000-0000-4000-8000-000000000001'
\set CP 'd098c000-0000-4000-8000-000000000002'
\set NN 'd098c000-0000-4000-8000-000000000003'
\set NV 'd098c000-0000-4000-8000-000000000004'
\set XX 'd098c000-0000-4000-8000-000000000005'
\set H  'd098c000-0000-4000-8000-0000000000a1'
\set XH 'd098c000-0000-4000-8000-0000000000a2'
\set K1 'd098c000-0000-4000-8000-0000000000c1'
\set K2 'd098c000-0000-4000-8000-0000000000c2'
\set L1 'd098c000-0000-4000-8000-0000000000d1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 's98-mere@exemple.test'), (:'CP', 's98-conjoint@exemple.test'), (:'NN', 's98-nounou@exemple.test'),
  (:'NV', 's98-nounou-lecture@exemple.test'), (:'XX', 's98-autre@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98s', :'OW'), (:'XH', 'Autre 98s', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'XH', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 400), (:'K2', :'H', 'Noé', current_date - 2000);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,lists}', '{daily,lists}', null),
  (:'H', :'NN', 'caregiver', '{daily,lists}', '{daily,lists}', array[:'K1']::uuid[]),
  (:'H', :'NV', 'caregiver', '{daily,lists}', '{daily}', array[:'K1']::uuid[]);
insert into public.shopping_lists (id, household_id, title, created_by) values (:'L1', :'H', 'Courses de la semaine', :'OW');
select tests.set_premium(:'OW', true);
create temp table s98 (k text primary key, id uuid);
grant all on s98 to authenticated;

-- ===================================================================== inventaire : création, quantité jamais inventée
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.family_domains (household_id, key, owner_id) values (:'H', 'pets', :'CP') on conflict (household_id, key) do update set owner_id = excluded.owner_id;
insert into public.household_stocks (household_id, label, category, qty_estimate, unit, threshold, frequency_days, responsible_id, client_id)
  values (:'H', 'Croquettes', 'pet_food', 5, 'sac', 2, 30, :'CP', 'd098c000-0000-4000-8000-0000000000e1');
insert into s98 select 'F', id from public.household_stocks where client_id = 'd098c000-0000-4000-8000-0000000000e1';
insert into public.household_stocks (household_id, label, category, threshold) values (:'H', 'Lessive', 'laundry', 1);
insert into s98 select 'LS', id from public.household_stocks where label = 'Lessive';
insert into public.household_stocks (household_id, label, category, size, qty_estimate, unit, threshold) values (:'H', 'Couches', 'diapers', 'taille 4', 40, 'u', 10);
insert into s98 select 'C', id from public.household_stocks where label = 'Couches';
insert into public.household_stocks (household_id, label, category, child_id) values (:'H', 'Lait de Lou', 'milk', :'K1'), (:'H', 'Lait de Noé', 'milk', :'K2');
reset role;
select tests.ok((select restock_state = 'ok' and low_since is null and version = 1 and created_by = :'OW' from public.household_stocks where id = (select id from s98 where k = 'F')),
  'stock F : créé, au-dessus du seuil → rien à suggérer');
select tests.ok((select qty_estimate is null and low_since is null and restock_state = 'ok' from public.household_stocks where id = (select id from s98 where k = 'LS'))
  and (select count(*) from public.household_events where entity_id = (select id::text from s98 where k = 'LS')) = 0,
  'quantité non saisie : jamais considérée comme basse, aucune suggestion (rien d''inventé)');
-- Colonnes du serveur : l'appareil ne les force pas
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.household_stocks set restock_state = 'bought', last_purchase_at = now(), low_since = now() where id = (select id from s98 where k = 'F');
reset role;
select tests.ok((select restock_state = 'ok' and last_purchase_at is null and low_since is null from public.household_stocks where id = (select id from s98 where k = 'F')),
  'garde : état de réapprovisionnement, achat et période basse posés par le serveur seulement');

-- ===================================================================== RLS des stocks
set role authenticated; set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.household_stocks where household_id = ''d098c000-0000-4000-8000-0000000000a1''') = 0, 'autre foyer : aucun stock lisible');
select tests.throws($$insert into public.household_stocks (household_id, label) values ('d098c000-0000-4000-8000-0000000000a1', 'Intrusion')$$, 'autre foyer : ne peut pas créer de stock chez nous');
select tests.ok(public.stock_restock((select id from s98 where k = 'F')) ->> 'status' = 'not_found', 'autre foyer : réapprovisionnement → introuvable');
select tests.ok(public.stock_validate_purchase((select id from s98 where k = 'F'), 3) ->> 'status' = 'not_found', 'autre foyer : validation d''achat → introuvable');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.household_stocks where label = ''Lait de Lou''') = 1
  and tests.count('select * from public.household_stocks where label = ''Lait de Noé''') = 0
  and tests.count('select * from public.household_stocks where label = ''Croquettes''') = 1,
  'nounou (listes) : voit les stocks du foyer et celui de l''enfant confié, pas celui d''un autre enfant');
select tests.throws($$insert into public.household_stocks (household_id, label, child_id) values ('d098c000-0000-4000-8000-0000000000a1', 'Compotes', 'd098c000-0000-4000-8000-0000000000c2')$$,
  'nounou : ne crée pas de stock pour un enfant non confié');
insert into public.household_stocks (household_id, label, category, child_id) values (:'H', 'Lingettes de Lou', 'wipes', :'K1');
select tests.ok(tests.count('select * from public.household_stocks where label = ''Lingettes de Lou''') = 1, 'nounou avec droit d''édition des listes : peut ajouter un stock');
set request.jwt.claim.sub = :'NV';
select tests.ok(tests.count('select * from public.household_stocks where label = ''Croquettes''') = 1, 'nounou en lecture seule : voit les stocks');
select tests.throws($$insert into public.household_stocks (household_id, label) values ('d098c000-0000-4000-8000-0000000000a1', 'Essuie-tout')$$, 'nounou en lecture seule : ne crée pas de stock');
update public.household_stocks set qty_estimate = 0 where label = 'Croquettes';
reset role;
select tests.ok((select qty_estimate = 5 from public.household_stocks where id = (select id from s98 where k = 'F')), 'nounou en lecture seule : ne modifie pas une quantité');
set role authenticated; set request.jwt.claim.sub = :'NV';
select tests.throws(format('select public.stock_restock(%L)', (select id from s98 where k = 'F')), 'nounou en lecture seule : ne confirme pas de réapprovisionnement');

-- ===================================================================== Scénario F : seuil atteint → SUGGESTION, aucune mission
set request.jwt.claim.sub = :'OW';
select tests.ok(public.update_if_version('household_stocks', (select id from s98 where k = 'F'), 2, '{"qty_estimate": 2}') ->> 'status' = 'ok',
  'scénario F : la famille estime 2 sacs (seuil 2), modification versionnée');
reset role;
select tests.ok((select restock_state = 'suggested' and low_since is not null and qty_estimate = 2 from public.household_stocks where id = (select id from s98 where k = 'F')),
  'scénario F : seuil atteint → « suggested » (HOMI suggère)');
select tests.ok((select count(*) from public.household_events where type = 'stock.low' and entity_id = (select id::text from s98 where k = 'F') and status = 'done') = 1,
  'scénario F : fait « stock.low » publié et traité une fois');
select tests.ok((select count(*) from public.family_tasks where household_id = :'H' and (stock_id = (select id from s98 where k = 'F') or product_label = 'Croquettes')) = 0
  and (select count(*) from public.shopping_items where label = 'Croquettes') = 0,
  'scénario F : AUCUNE mission ni article créé sans confirmation');
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and title = 'Stock bas : Croquettes' and deep_link = '/family/stocks/' || (select id from s98 where k = 'F')) = 1,
  'scénario F : le responsable reçoit une suggestion neutre (lien vers le stock)');
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.household_stocks set notes = 'Marque habituelle' where id = (select id from s98 where k = 'F');
reset role;
select tests.ok((select count(*) from public.household_events where type = 'stock.low' and entity_id = (select id::text from s98 where k = 'F')) = 1,
  'toujours bas : une autre modification ne republie pas « stock.low »');

-- ===================================================================== confirmation → mission (responsable du domaine) + rejeu
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into s98 select 'FT', (public.stock_restock((select id from s98 where k = 'F'), 'confirm') -> 'task' ->> 'id')::uuid;
reset role;
select tests.ok((select mission_state = 'pending' and assignee_id = :'CP' and category = 'pets' and product_label = 'Croquettes' and created_by = :'OW'
  and stock_id = (select id from s98 where k = 'F') from public.family_tasks where id = (select id from s98 where k = 'FT')),
  'scénario F : confirmée → mission « À accepter » pour le responsable du domaine « animaux », reliée au stock');
select tests.ok((select restock_state = 'ordered' and restock_task_id = (select id from s98 where k = 'FT') and qty_estimate = 2 from public.household_stocks where id = (select id from s98 where k = 'F')),
  'scénario F : stock « mission en cours », quantité inchangée');
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and title = 'Nouvelle mission : Racheter : Croquettes') = 1,
  'scénario F : le destinataire reçoit « Nouvelle mission » (consommateur des missions)');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok((public.stock_restock((select id from s98 where k = 'F'), 'confirm') ->> 'unchanged')::boolean
  and (public.stock_restock((select id from s98 where k = 'F'), 'confirm') -> 'task' ->> 'id')::uuid = (select id from s98 where k = 'FT'),
  'rejeu : confirmer deux fois → même mission, inchangé');
reset role;
select tests.ok((select count(*) from public.family_tasks where stock_id = (select id from s98 where k = 'F')) = 1
  and (select count(*) from public.household_events where type = 'stock.restock_confirmed' and entity_id = (select id::text from s98 where k = 'F')) = 1,
  'rejeu : une seule mission et un seul « stock.restock_confirmed »');
select public._consume_stock_event(e) from public.household_events e where type = 'stock.restock_confirmed' and entity_id = (select id::text from s98 where k = 'F');
select tests.ok((select restock_task_id = (select id from s98 where k = 'FT') from public.household_stocks where id = (select id from s98 where k = 'F')),
  'idempotence : consommateur du réapprovisionnement rejoué → même lien');

-- Acceptation → article relié au stock (mécanisme mission → courses existant), sans doublon
set role authenticated; set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from s98 where k = 'FT'), 'accept');
reset role;
select tests.ok((select count(*) from public.shopping_items where household_id = :'H' and label = 'Croquettes' and list_id = :'L1' and not checked
  and stock_id = (select id from s98 where k = 'F') and category = 'pet_food') = 1,
  'scénario F : mission acceptée → « Croquettes » dans la liste, relié au stock');
select public._consume_mission_event(e) from public.household_events e where type = 'mission.accepted' and entity_id = (select id::text from s98 where k = 'FT');
select tests.ok((select count(*) from public.shopping_items where household_id = :'H' and label = 'Croquettes') = 1, 'rejeu du consommateur : toujours un seul article');
select tests.ok((select qty_estimate = 2 and restock_state = 'ordered' from public.household_stocks where id = (select id from s98 where k = 'F')),
  'scénario F : la quantité ne bouge pas à l''acceptation');

-- Coche par une AUTRE personne : pas de transition forcée, proposition au destinataire
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.shopping_items set checked = true where label = 'Croquettes' and household_id = :'H';
reset role;
select tests.ok((select mission_state = 'accepted' from public.family_tasks where id = (select id from s98 where k = 'FT')),
  'coche par une autre personne : la mission N''EST PAS terminée à sa place');
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and title = 'Article coché : Croquettes' and deep_link = '/family/missions/' || (select id from s98 where k = 'FT')) = 1,
  'coche par une autre personne : le destinataire reçoit une proposition neutre');
select tests.ok((select checked_by = :'OW' from public.shopping_items where label = 'Croquettes' and household_id = :'H'), 'auteur de la coche posé par le serveur');
select tests.ok((select restock_state = 'bought' and qty_estimate = 2 and restock_item_id is not null from public.household_stocks where id = (select id from s98 where k = 'F')),
  'article coché : stock « acheté, à valider », quantité INCHANGÉE (pas au simple cochage)');
-- Décoché puis coché par le destinataire : la mission se termine
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.shopping_items set checked = false where label = 'Croquettes' and household_id = :'H';
set request.jwt.claim.sub = :'CP';
update public.shopping_items set checked = true where label = 'Croquettes' and household_id = :'H';
reset role;
select tests.ok((select mission_state = 'done' and status = 'done' and done_by = :'CP' from public.family_tasks where id = (select id from s98 where k = 'FT')),
  'coche par le destinataire : la mission liée passe « Terminée »');
select tests.ok((select count(*) from public.family_task_events where task_id = (select id from s98 where k = 'FT') and kind = 'done') = 1
  and (select count(*) from public.household_events where type = 'mission.completed' and entity_id = (select id::text from s98 where k = 'FT')) = 1,
  'anti-boucle : une seule fin de mission, un seul « mission.completed »');
select tests.ok((select count(*) from public.household_events where household_id = :'H' and type = 'shopping.item_checked' and entity_table = 'shopping_items'
  and payload ->> 'label' = 'Croquettes') = 2, 'deux coches = deux faits distincts (clé = version)');
select tests.ok((select depth = 1 and origin_event_id = (select id from public.household_events where household_id = :'H' and type = 'shopping.item_checked' and payload ->> 'label' = 'Croquettes'
  order by created_at desc limit 1) from public.household_events where type = 'mission.completed' and entity_id = (select id::text from s98 where k = 'FT')),
  'chaîne de causalité : « mission.completed » hérite du fait « article coché »');
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title = 'Mission terminée : Racheter : Croquettes') = 1,
  'mission terminée par la coche : la demandeuse reçoit la confirmation');
select tests.ok((select qty_estimate = 2 and restock_state = 'bought' from public.household_stocks where id = (select id from s98 where k = 'F')),
  'mission terminée : quantité toujours inchangée (validation explicite attendue)');

-- Validation explicite → quantité mise à jour, fait « achat confirmé » pour le futur budget
set role authenticated; set request.jwt.claim.sub = :'NV';
select tests.throws(format('select public.stock_validate_purchase(%L, 3)', (select id from s98 where k = 'F')), 'nounou en lecture seule : ne valide pas un achat');
set request.jwt.claim.sub = :'OW';
select tests.throws(format('select public.stock_validate_purchase(%L, 0)', (select id from s98 where k = 'F')), 'validation : une quantité achetée est obligatoire');
select tests.ok(public.stock_validate_purchase((select id from s98 where k = 'F'), 3, 'add',
  (select version from public.household_stocks where id = (select id from s98 where k = 'F'))) ->> 'status' = 'ok', 'scénario F : achat validé (+3 sacs)');
reset role;
select tests.ok((select qty_estimate = 5 and restock_state = 'ok' and low_since is null and restock_task_id is null and last_validated_by = :'OW' and last_purchase_at is not null
  from public.household_stocks where id = (select id from s98 where k = 'F')), 'scénario F : stock mis à jour APRÈS validation (2 + 3 = 5), suggestion close');
select tests.ok((select status = 'pending' and payload ->> 'qty_added' = '3' and payload ->> 'qty_before' = '2.00' and payload ->> 'qty_after' = '5.00'
  and payload ->> 'task_id' = (select id::text from s98 where k = 'FT') and not (payload ? 'amount')
  from public.household_events where type = 'stock.purchase_confirmed' and entity_id = (select id::text from s98 where k = 'F')),
  'budget (futur) : « stock.purchase_confirmed » publié, en attente de son consommateur, sans montant');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.ok(public.stock_validate_purchase((select id from s98 where k = 'F'), 3, 'add',
  (select version - 1 from public.household_stocks where id = (select id from s98 where k = 'F'))) ->> 'status' = 'conflict', 'rejeu de la validation (version lue) → conflit, rien n''est ajouté deux fois');
reset role;
select tests.ok((select qty_estimate = 5 from public.household_stocks where id = (select id from s98 where k = 'F'))
  and (select count(*) from public.household_events where type = 'stock.purchase_confirmed' and entity_id = (select id::text from s98 where k = 'F')) = 1,
  'rejeu de la validation : quantité et fait inchangés');
select tests.ok((select count(*) from public.household_events where household_id = :'H' and status <> 'done'
  and (type::text like 'mission.%' or type::text in ('stock.low', 'stock.restock_confirmed', 'stock.restock_dismissed', 'shopping.item_checked'))) = 0,
  'consommateur planifié : rien d''autre à traiter (faits courses, stocks et missions du foyer traités tout de suite)');

-- ===================================================================== suggestion écartée, nouvelle période basse
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.household_stocks set qty_estimate = 1 where id = (select id from s98 where k = 'LS');
select tests.ok(public.stock_restock((select id from s98 where k = 'LS'), 'dismiss') ->> 'status' = 'ok', 'suggestion écartée (« pas maintenant »)');
reset role;
select tests.ok((select restock_state = 'dismissed' from public.household_stocks where id = (select id from s98 where k = 'LS'))
  and (select count(*) from public.family_tasks where household_id = :'H' and product_label = 'Lessive') = 0, 'écartée : aucune mission');
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.household_stocks set qty_estimate = 4 where id = (select id from s98 where k = 'LS');
update public.household_stocks set qty_estimate = 0 where id = (select id from s98 where k = 'LS');
reset role;
select tests.ok((select restock_state = 'suggested' from public.household_stocks where id = (select id from s98 where k = 'LS'))
  and (select count(*) from public.household_events where type = 'stock.low' and entity_id = (select id::text from s98 where k = 'LS')) = 2,
  'remonté puis de nouveau bas : nouvelle période, nouvelle suggestion');

-- ===================================================================== Scénario A (étape 8) : mission « couches » → stock de couches actualisé
set role authenticated; set request.jwt.claim.sub = :'OW';
update public.household_stocks set qty_estimate = 8 where id = (select id from s98 where k = 'C');
insert into s98 select 'A', (public.create_mission(:'H', 'Acheter des couches taille 4 aujourd''hui', :'CP', 'shopping', null, null, false, 'high', null, null, null, null,
  'Couches taille 4') ->> 'id')::uuid;
set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from s98 where k = 'A'), 'accept');
reset role;
select tests.ok((select stock_id = (select id from s98 where k = 'C') from public.shopping_items where label = 'Couches taille 4' and household_id = :'H'),
  'scénario A : l''article « Couches taille 4 » est relié au stock « Couches » (même produit)');
set role authenticated; set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from s98 where k = 'A'), 'complete');
reset role;
-- Anti-boucle dans l'autre sens : mission terminée → article coché → « shopping.item_checked » → ne re-termine rien
select tests.ok((select checked from public.shopping_items where label = 'Couches taille 4' and household_id = :'H')
  and (select count(*) from public.family_task_events where task_id = (select id from s98 where k = 'A') and kind = 'done') = 1
  and (select count(*) from public.household_events where type = 'mission.completed' and entity_id = (select id::text from s98 where k = 'A')) = 1,
  'anti-boucle : mission terminée → article coché → la mission n''est pas re-terminée');
select tests.ok((select depth = 1 and status = 'done' and origin_event_id = (select id from public.household_events where type = 'mission.completed' and entity_id = (select id::text from s98 where k = 'A'))
  from public.household_events where household_id = :'H' and type = 'shopping.item_checked' and payload ->> 'label' = 'Couches taille 4'),
  'anti-boucle : « article coché » issu de la fin de mission (profondeur 1, traité sans effet)');
select tests.ok((select count(*) from public.household_events where status = 'skipped' and household_id = :'H') = 0, 'aucun fait sauté : la chaîne s''arrête d''elle-même');
select tests.ok((select restock_state = 'bought' and qty_estimate = 8 from public.household_stocks where id = (select id from s98 where k = 'C')),
  'scénario A : couches achetées → stock « à valider », quantité inchangée');
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(public.stock_validate_purchase((select id from s98 where k = 'C'), 52, 'add') ->> 'status' = 'ok', 'scénario A : le conjoint valide l''achat (+52 couches)');
reset role;
select tests.ok((select qty_estimate = 60 and restock_state = 'ok' and last_validated_by = :'CP' from public.household_stocks where id = (select id from s98 where k = 'C')),
  'scénario A (étape 8) : stock de couches actualisé après validation (8 + 52 = 60)');

-- ===================================================================== doublons : fusion sans perte de lien
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.shopping_items (list_id, household_id, label, qty, unit, client_id) values
  (:'L1', :'H', 'Lait', 1, 'bouteille', 'd098c000-0000-4000-8000-0000000000f1'),
  (:'L1', :'H', 'lait ', 2, 'bouteille', 'd098c000-0000-4000-8000-0000000000f2');
insert into s98 select 'ML', (public.create_mission(:'H', 'Prendre du lait', :'CP', 'shopping', null, null, false, 'normal', null, null, null,
  (select id from public.shopping_items where client_id = 'd098c000-0000-4000-8000-0000000000f2'), 'lait') ->> 'id')::uuid;
select tests.ok(public.merge_shopping_items((select id from public.shopping_items where client_id = 'd098c000-0000-4000-8000-0000000000f1'),
  (select id from public.shopping_items where client_id = 'd098c000-0000-4000-8000-0000000000f2')) ->> 'status' = 'ok', 'doublon « lait » : fusion');
reset role;
select tests.ok((select count(*) from public.shopping_items where household_id = :'H' and public._norm_label(label) = 'lait') = 1
  and (select qty = 3 from public.shopping_items where client_id = 'd098c000-0000-4000-8000-0000000000f1'),
  'fusion : un seul article, quantités additionnées (1 + 2)');
select tests.ok((select shopping_item_id = (select id from public.shopping_items where client_id = 'd098c000-0000-4000-8000-0000000000f1')
  from public.family_tasks where id = (select id from s98 where k = 'ML')), 'fusion : la mission liée suit l''article gardé');
set role authenticated; set request.jwt.claim.sub = :'XX';
select tests.ok(public.merge_shopping_items((select id from public.shopping_items where client_id = 'd098c000-0000-4000-8000-0000000000f1' limit 1),
  'd098c000-0000-4000-8000-0000000000f9') ->> 'status' = 'not_found', 'fusion : rien chez un autre foyer');

-- ===================================================================== garde-manger local → stocks (première synchronisation)
set request.jwt.claim.sub = :'OW';
insert into public.household_stocks (household_id, label, category, ingredient_key, source, client_id)
  values (:'H', 'Riz', 'food', 'riz', 'pantry', 'd098c000-0000-4000-8000-0000000000b1') on conflict (household_id, client_id) do nothing;
set request.jwt.claim.sub = :'CP';
insert into public.household_stocks (household_id, label, category, ingredient_key, source, client_id)
  values (:'H', 'Riz', 'food', 'riz', 'pantry', 'd098c000-0000-4000-8000-0000000000b1') on conflict (household_id, client_id) do nothing;
reset role;
select tests.ok((select count(*) from public.household_stocks where household_id = :'H' and ingredient_key = 'riz') = 1
  and (select qty_estimate is null from public.household_stocks where household_id = :'H' and ingredient_key = 'riz'),
  'garde-manger : même saisie envoyée par deux appareils → une seule ligne, quantité non inventée');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws($$insert into public.household_stocks (household_id, label, ingredient_key, source) values ('d098c000-0000-4000-8000-0000000000a1', 'Riz', 'riz', 'pantry')$$,
  'garde-manger : un ingrédient n''existe qu''une fois par foyer');

-- ===================================================================== historique / audit
reset role;
select tests.ok((select count(*) from public.household_audit_log where table_name = 'household_stocks' and row_id = (select id::text from s98 where k = 'F')) >= 4
  and (select count(*) from public.household_audit_log where table_name = 'household_stocks' and row_id = (select id::text from s98 where k = 'F') and action = 'insert' and actor_id = :'OW') = 1,
  'audit : création et modifications du stock journalisées avec leur auteur');
select tests.ok((select count(*) from public.household_audit_log where table_name = 'shopping_items' and household_id = :'H') > 0
  and (select count(*) from public.household_audit_log where table_name = 'shopping_items' and action = 'delete' and household_id = :'H') = 1,
  'audit : articles de courses journalisés (ajouts, coches, fusion)');
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.household_audit_log where table_name = ''household_stocks''') > 0, 'audit : le co-parent (listes) lit l''historique des stocks');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.household_audit_log where table_name = ''household_stocks''') = 0, 'audit : jamais lisible par une nounou');
reset role;
select tests.throws('update public.household_audit_log set action = ''insert'' where table_name = ''household_stocks''', 'audit : non modifiable, même pour le serveur');

-- ===================================================================== temps réel, liens, export
select tests.ok((select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('shopping_lists', 'shopping_items', 'household_stocks')) = 3,
  'temps réel : listes, articles et stocks publiés');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws(format('update public.family_tasks set stock_id = %L where id = %L', (select id from s98 where k = 'C'), (select id from s98 where k = 'ML')),
  'garde : le lien mission → stock n''est posé que par le réapprovisionnement');
select tests.throws(format('update public.shopping_items set assignee_id = %L where client_id = ''d098c000-0000-4000-8000-0000000000f1''', :'XX'),
  'article : responsable hors du foyer refusé');
select tests.ok((public.export_my_data() -> 'household_stocks') @> '[{"label": "Croquettes"}]', 'export RGPD : les stocks du foyer sont exportés');

-- ===================================================================== membre retiré
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'CP';
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.household_stocks where household_id = ''d098c000-0000-4000-8000-0000000000a1''') = 0
  and public.stock_restock((select id from s98 where k = 'LS')) ->> 'status' = 'not_found'
  and public.stock_validate_purchase((select id from s98 where k = 'C'), 1) ->> 'status' = 'not_found',
  'membre retiré : plus aucun stock lisible ni modifiable');
reset role;
