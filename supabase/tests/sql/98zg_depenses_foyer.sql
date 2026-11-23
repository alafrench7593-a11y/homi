-- =====================================================================
-- Dépenses familiales (28/11/2026) — 20261128300100_depenses_foyer.sql
-- Comptes distincts : propriétaire (OW), second parent (CP), nounou confirmée de Lou (NN), non-membre (XX),
-- ancien membre (EX, co-parent retiré du foyer en fin de fichier).
-- =====================================================================
\set OW 'f28a0000-0000-4000-8000-000000000001'
\set CP 'f28a0000-0000-4000-8000-000000000002'
\set NN 'f28a0000-0000-4000-8000-000000000003'
\set XX 'f28a0000-0000-4000-8000-000000000005'
\set EX 'f28a0000-0000-4000-8000-000000000006'
\set H  'f28a0000-0000-4000-8000-0000000000a1'
\set H2 'f28a0000-0000-4000-8000-0000000000a2'
\set K1 'f28a0000-0000-4000-8000-0000000000c1'
\set KX 'f28a0000-0000-4000-8000-0000000000c9'
\set E1 'f28a0000-0000-4000-8000-0000000000e1'
\set E2 'f28a0000-0000-4000-8000-0000000000e2'
\set C1 'f28a0000-0000-4000-8000-0000000000d1'
\set CX 'f28a0000-0000-4000-8000-0000000000d9'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zg-parent@exemple.test'), (:'CP', 'f98zg-parent2@exemple.test'),
  (:'NN', 'f98zg-nounou@exemple.test'), (:'XX', 'f98zg-inconnu@exemple.test'), (:'EX', 'f98zg-ancien@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zg', :'OW'), (:'H2', 'Autre foyer 98zg', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'H2', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null),
  (:'H', :'EX', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null);
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 300), (:'KX', :'H2', 'Zoé', current_date - 900);
select tests.set_premium(:'OW', true); select tests.set_premium(:'CP', true); select tests.set_premium(:'EX', true); select tests.set_premium(:'XX', true);

set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
set request.jwt.claim.sub = :'NN'; select public.childcare_accept(:'t_nn');
set request.jwt.claim.sub = :'OW';
select public.childcare_confirm(id) from public.childcare_links where caregiver_id = :'NN';
insert into public.childcare_candidates (id, household_id, name, kind, rate_mode, monthly_fee) values (:'C1', :'H', 'Crèche Les Lutins', 'creche', 'monthly', 395);
set request.jwt.claim.sub = :'XX';
insert into public.childcare_candidates (id, household_id, name, kind) values (:'CX', :'H2', 'Autre crèche', 'creche');

-- ================================================================ Saisie (propriétaire)
set request.jwt.claim.sub = :'OW';
insert into public.household_expenses (id, household_id, amount, spent_on, category, paid_by, child_id, note, created_by)
  values (:'E1', :'H', 84.30, current_date - 3, 'food', :'OW', null, 'Courses de la semaine', :'CP');
insert into public.household_expenses (id, household_id, amount, spent_on, category, paid_by, child_id, candidate_id, payer_share)
  values (:'E2', :'H', 395, current_date - 1, 'childcare', :'CP', :'K1', :'C1', 50);
select tests.ok(tests.count($$select * from public.household_expenses where created_by = 'f28a0000-0000-4000-8000-000000000001'$$) = 2,
  'dépenses : enregistrées, autrice posée par le serveur (une autrice déclarée est ignorée)');
select tests.throws($$insert into public.household_expenses (household_id, amount, category) values ('f28a0000-0000-4000-8000-0000000000a1', 0, 'food')$$, 'dépense : montant nul refusé');
select tests.throws($$insert into public.household_expenses (household_id, amount, category) values ('f28a0000-0000-4000-8000-0000000000a1', -12, 'food')$$, 'dépense : montant négatif refusé');
select tests.throws($$insert into public.household_expenses (household_id, amount, category) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'casino')$$, 'dépense : catégorie inconnue refusée');
select tests.throws($$insert into public.household_expenses (household_id, amount, category, payer_share) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'food', 120)$$, 'dépense : part supérieure à 100 % refusée');
select tests.throws($$insert into public.household_expenses (household_id, amount, category, paid_by) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'food', 'f28a0000-0000-4000-8000-000000000005')$$,
  'dépense : « payé par » une personne hors du foyer refusé');
select tests.throws($$insert into public.household_expenses (household_id, amount, category, paid_by) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'food', 'f28a0000-0000-4000-8000-000000000003')$$,
  'dépense : « payé par » la nounou refusé (parents seulement)');
select tests.throws($$insert into public.household_expenses (household_id, amount, category, child_id) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'children', 'f28a0000-0000-4000-8000-0000000000c9')$$,
  'dépense : enfant d''un autre foyer refusé');
select tests.throws($$insert into public.household_expenses (household_id, amount, category, candidate_id) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'childcare', 'f28a0000-0000-4000-8000-0000000000d9')$$,
  'dépense : mode de garde d''un autre foyer refusé');
select tests.throws($$insert into public.household_expenses (household_id, amount, category, candidate_id) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'food', 'f28a0000-0000-4000-8000-0000000000d1')$$,
  'dépense : mode de garde rattaché seulement à une dépense de garde');
insert into public.household_expenses (id, household_id, amount, category) values (:'E1', :'H', 84.30, 'food') on conflict (id) do nothing;
select tests.ok(tests.count('select * from public.household_expenses') = 2, 'dépense : envoi répété (même identifiant) sans doublon');

-- ================================================================ Second parent : lit, modifie, supprime
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.household_expenses') = 2, 'second parent : voit les dépenses du foyer');
update public.household_expenses set amount = 86.10, note = 'Courses + pain' where id = :'E1';
select tests.ok(tests.count($$select * from public.household_expenses where amount = 86.10 and created_by = 'f28a0000-0000-4000-8000-000000000001'$$) = 1,
  'second parent : modifie (autrice d''origine conservée)');

-- ================================================================ Nounou, non-membre : rien
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.household_expenses') = 0, 'nounou confirmée : aucune dépense du foyer');
select tests.throws($$insert into public.household_expenses (household_id, amount, category) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'food')$$, 'nounou : saisie refusée');
update public.household_expenses set amount = 1 where household_id = :'H';
delete from public.household_expenses where household_id = :'H';
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count($$select * from public.household_expenses where household_id = 'f28a0000-0000-4000-8000-0000000000a1'$$) = 0, 'non-membre : rien du foyer');
select tests.throws($$insert into public.household_expenses (household_id, amount, category) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'food')$$, 'non-membre : écriture refusée');
update public.household_expenses set amount = 1 where id = :'E1';
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count($$select * from public.household_expenses where amount = 1$$) = 0 and tests.count('select * from public.household_expenses') = 2,
  'nounou et non-membre : modifications et suppressions sans effet');

-- ================================================================ Export RGPD
select tests.ok(jsonb_array_length(public.export_my_data()->'household_expenses') = 2, 'export : dépenses du foyer dans « Exporter mes données »');
set request.jwt.claim.sub = :'NN';
select tests.ok(jsonb_array_length(public.export_my_data()->'household_expenses') = 0, 'export nounou : aucune dépense');

-- ================================================================ Ancien membre
set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.household_expenses') = 2, 'co-parent (avant départ) : voit les dépenses');
insert into public.household_expenses (household_id, amount, category, paid_by) values (:'H', 30, 'leisure', :'EX');
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'EX';
set role authenticated; set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.household_expenses') = 0, 'ancien membre : plus rien');
select tests.throws($$insert into public.household_expenses (household_id, amount, category) values ('f28a0000-0000-4000-8000-0000000000a1', 10, 'food')$$, 'ancien membre : écriture refusée');
set request.jwt.claim.sub = :'OW';
update public.household_expenses set note = 'Sortie au parc' where paid_by = :'EX';
select tests.ok(tests.count($$select * from public.household_expenses where note = 'Sortie au parc'$$) = 1, 'dépense payée par un ancien parent : reste modifiable (historique gardé)');

-- ================================================================ Suppression
delete from public.household_expenses where id = :'E2';
select tests.ok(tests.count('select * from public.household_expenses') = 2, 'propriétaire : suppression d''une dépense');
reset role;
select tests.set_premium(:'OW', false); select tests.set_premium(:'CP', false); select tests.set_premium(:'EX', false); select tests.set_premium(:'XX', false);
