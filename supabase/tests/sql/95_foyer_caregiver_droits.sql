-- =====================================================================
-- Fondations du foyer (13/11/2026) — A et B
--   A. Une nounou (caregiver) active n'est jamais bloquée par le Premium strict pour ses saisies dans
--      le foyer qui l'emploie ; elle ne reçoit pas le Premium pour autant ; un co-parent sans Premium
--      reste bloqué ; un membre retiré perd tout.
--   B. Enfants autorisés (nounou sans choix = aucun enfant), fiche de sécurité, partage document par
--      document, papiers invisibles, révocation immédiate, autre foyer.
-- =====================================================================
\set OW 'd0950000-0000-4000-8000-000000000001'
\set CP 'd0950000-0000-4000-8000-000000000002'
\set NN 'd0950000-0000-4000-8000-000000000003'
\set N2 'd0950000-0000-4000-8000-000000000004'
\set XX 'd0950000-0000-4000-8000-000000000005'
\set N3 'd0950000-0000-4000-8000-000000000006'
\set H  'd0950000-0000-4000-8000-0000000000a1'
\set XH 'd0950000-0000-4000-8000-0000000000a2'
\set K1 'd0950000-0000-4000-8000-0000000000c1'
\set K2 'd0950000-0000-4000-8000-0000000000c2'
\set KX 'd0950000-0000-4000-8000-0000000000c3'
\set D1 'd0950000-0000-4000-8000-0000000000d1'
\set D2 'd0950000-0000-4000-8000-0000000000d2'
\set SL 'd0950000-0000-4000-8000-0000000000e1'
\set RT 'd0950000-0000-4000-8000-0000000000e2'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f95-owner@exemple.test'), (:'CP', 'f95-coparent@exemple.test'),
  (:'NN', 'f95-nounou@exemple.test'), (:'N2', 'f95-nounou2@exemple.test'), (:'XX', 'f95-autre@exemple.test'), (:'N3', 'f95-nounou3@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 95', :'OW'), (:'XH', 'Autre 95', :'XX');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'XH', :'XX', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.children (id, household_id, first_name, birth_date, allergies_declared) values
  (:'K1', :'H', 'Lou', current_date - 300, '{arachide}'), (:'K2', :'H', 'Max', current_date - 900, '{}'), (:'KX', :'XH', 'Autre', current_date - 100, '{}');
-- Co-parent sans choix d'enfants (= tous) ; nounou avec Lou seulement ; nounou 2 sans choix (= aucun)
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists}', null),
  (:'H', :'NN', 'caregiver', '{daily,lists,documents}', '{daily,lists}', array[:'K1']::uuid[]),
  (:'H', :'N2', 'caregiver', '{daily,lists}', '{daily}', null);
insert into public.bottles (child_id, household_id, at, prepared_ml) values (:'K1', :'H', now() - interval '1 hour', 120), (:'K2', :'H', now() - interval '2 hours', 180);
insert into public.child_health_items (child_id, household_id, kind, label) values (:'K1', :'H', 'allergy', 'Arachide : stylo adrénaline dans le sac'),
  (:'K1', :'H', 'info', 'Suivi orthophonie (confidentiel)');
insert into public.house_notes (household_id, child_id, title) values (:'H', :'K2', 'Note sur Max');
insert into public.kid_routines (id, household_id, child_id, title, steps) values (:'RT', :'H', :'K2', 'Coucher de Max', '["bain"]');
insert into public.kid_routine_checks (household_id, routine_id, on_date, step) values (:'H', :'RT', current_date, 0);
insert into public.family_papers (household_id, kind) values (:'H', 'carte_vitale');
insert into public.shopping_lists (id, household_id, title) values (:'SL', :'H', 'Courses');
update public.premium_policy set strict = true;

-- ================================================================ A. Premium strict × nounou
set role authenticated; set request.jwt.claim.sub = :'NN';
insert into public.bottles (child_id, household_id, at, prepared_ml) values (:'K1', :'H', now(), 150);
select tests.ok(tests.count('select * from public.bottles where prepared_ml = 150') = 1, 'nounou : biberon enregistré sans Premium (la famille paie)');
insert into public.family_tasks (household_id, title) values (:'H', 'Goûter de Lou');
select tests.ok(tests.count('select * from public.family_tasks where title = ''Goûter de Lou''') = 1, 'nounou : tâche du foyer enregistrée sans Premium');
insert into public.shopping_items (list_id, household_id, label) values (:'SL', :'H', 'Compotes');
update public.shopping_items set checked = true where label = 'Compotes';
select tests.ok(tests.count('select * from public.shopping_items where checked') = 1, 'nounou : article de courses ajouté et coché sans Premium');
select tests.ok((public.my_access()->>'caregiver')::boolean and not (public.my_access()->>'premium')::boolean, 'nounou : my_access signale la garde, sans accorder le Premium');
select tests.throws($$insert into public.mood_checkins (mood) values (3)$$, 'nounou : ses données personnelles restent soumises au Premium');
select tests.throws($$insert into public.bottles (child_id, household_id, at) values ('d0950000-0000-4000-8000-0000000000c2', 'd0950000-0000-4000-8000-0000000000a1', now())$$, 'nounou : biberon d''un enfant non confié refusé');
select tests.throws($$insert into public.bottles (child_id, household_id, at) values ('d0950000-0000-4000-8000-0000000000c3', 'd0950000-0000-4000-8000-0000000000a2', now())$$, 'nounou : écriture dans un autre foyer refusée');
select tests.throws($$insert into public.child_health_items (child_id, household_id, kind, label) values ('d0950000-0000-4000-8000-0000000000c1', 'd0950000-0000-4000-8000-0000000000a1', 'info', 'x')$$, 'nounou : l''exemption Premium n''ouvre pas la santé (droits inchangés)');
set request.jwt.claim.sub = :'CP';
select tests.throws($$insert into public.family_tasks (household_id, title) values ('d0950000-0000-4000-8000-0000000000a1', 'Tâche du co-parent')$$, 'co-parent sans Premium : toujours bloqué par le Premium strict');
reset role;
select tests.ok(not public._premium_of(:'NN'), 'nounou : _premium_of reste faux (pas de Premium accordé)');
select tests.set_premium(:'OW', true);
set role authenticated; set request.jwt.claim.sub = :'CP';
insert into public.family_tasks (household_id, title) values (:'H', 'Tâche du co-parent');
select tests.ok(tests.count('select * from public.family_tasks where title = ''Tâche du co-parent''') = 1, 'co-parent : couvert par le Premium de la propriétaire');
reset role;
select tests.set_premium(:'OW', false);

-- ================================================================ B. Enfants autorisés
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.children') = 1 and tests.count('select * from public.children where id = ''d0950000-0000-4000-8000-0000000000c1''') = 1,
  'nounou : voit la fiche de l''enfant confié (sans le domaine profil), pas l''autre');
select tests.ok(tests.count('select * from public.bottles') = 2 and tests.count('select * from public.bottles where child_id = ''d0950000-0000-4000-8000-0000000000c2''') = 0, 'nounou : suivi limité à l''enfant confié');
select tests.ok(tests.count('select * from public.house_notes') = 0 and tests.count('select * from public.kid_routines') = 0 and tests.count('select * from public.kid_routine_checks') = 0,
  'nounou : notes, routines et cases cochées d''un enfant non confié invisibles (tables récentes couvertes)');
select tests.ok(tests.count('select * from public.child_health_items') = 0, 'nounou : santé non partagée → invisible');
select tests.ok(public.child_safety_card(:'K1') -> 'allergies_declared' ? 'arachide'
  and jsonb_array_length(public.child_safety_card(:'K1') -> 'items') = 1, 'nounou : fiche de sécurité (allergie, consigne) de l''enfant confié, sans le reste de la santé');
select tests.throws($$select public.child_safety_card('d0950000-0000-4000-8000-0000000000c2')$$, 'nounou : fiche de sécurité d''un enfant non confié refusée');
select tests.throws($$select public.child_safety_card('d0950000-0000-4000-8000-0000000000c3')$$, 'nounou : fiche de sécurité d''un enfant d''un autre foyer refusée');
select tests.throws($$select public.set_member_scope('d0950000-0000-4000-8000-0000000000a1', auth.uid(), null, true)$$, 'nounou : ne peut pas élargir ses enfants autorisés');
update public.household_members set child_scope = null where user_id = auth.uid();
select tests.ok(tests.count('select * from public.children') = 1, 'nounou : modification directe de son périmètre sans effet');
set request.jwt.claim.sub = :'N2';
select tests.ok(tests.count('select * from public.children') = 0 and tests.count('select * from public.bottles') = 0 and not public.can_access_child(:'K1'),
  'nounou sans choix d''enfants : aucun enfant visible (défaut fermé)');
select tests.throws($$insert into public.bottles (child_id, household_id, at) values ('d0950000-0000-4000-8000-0000000000c1', 'd0950000-0000-4000-8000-0000000000a1', now())$$, 'nounou sans choix d''enfants : aucune saisie possible');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.children') = 2 and tests.count('select * from public.bottles') = 3, 'co-parent sans choix : tous les enfants (comportement inchangé)');
set request.jwt.claim.sub = :'OW';
select public.set_member_scope(:'H', :'N2', array[:'K2']::uuid[], false);
set request.jwt.claim.sub = :'N2';
select tests.ok(tests.count('select * from public.children') = 1 and tests.count('select * from public.bottles where child_id = ''d0950000-0000-4000-8000-0000000000c2''') = 1,
  'nounou : enfant choisi par la propriétaire → visible immédiatement');
reset role;
-- Rôle changé co-parent → nounou : le « tous les enfants » ne suit pas
update public.household_members set role = 'caregiver' where household_id = :'H' and user_id = :'CP';
select tests.ok((select child_scope from public.household_members where household_id = :'H' and user_id = :'CP') = '{}', 'changement de rôle vers nounou : périmètre remis à zéro');
update public.household_members set role = 'coparent', child_scope = null where household_id = :'H' and user_id = :'CP';
-- Invitation « nounou » sans choix d'enfants : acceptée = aucun enfant
select tests.set_premium(:'OW', true);
set role authenticated; set request.jwt.claim.sub = :'OW';
create temp table f95_inv as select public.create_household_invitation(:'H', 'caregiver', array['daily'], array['daily']) as token;
grant select on f95_inv to authenticated;
set request.jwt.claim.sub = :'N3';
select public.accept_household_invitation((select token from f95_inv));
select tests.ok(tests.count('select * from public.children') = 0 and tests.count('select * from public.bottles') = 0, 'invitation nounou sans choix d''enfants : aucun enfant après acceptation');
reset role;
select tests.set_premium(:'OW', false);

-- ================================================================ B. Documents partagés un par un
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into storage.objects (bucket_id, name) values ('documents', 'd0950000-0000-4000-8000-0000000000a1/ordonnance.pdf'), ('documents', 'd0950000-0000-4000-8000-0000000000a1/contrat.pdf');
reset role; set request.jwt.claim.sub = '';
insert into public.documents (id, household_id, uploaded_by, category, title, storage_path, mime_type, size_bytes, private_to_uploader) values
  (:'D1', :'H', :'OW', 'other', 'Consignes de sortie', 'd0950000-0000-4000-8000-0000000000a1/ordonnance.pdf', 'application/pdf', 1000, false),
  (:'D2', :'H', :'OW', 'other', 'Contrat de travail', 'd0950000-0000-4000-8000-0000000000a1/contrat.pdf', 'application/pdf', 1000, false);
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.documents') = 0 and tests.count('select * from storage.objects where bucket_id = ''documents''') = 0,
  'nounou : aucun document non partagé, même avec le domaine documents (métadonnées et fichiers)');
select tests.ok(tests.count('select * from public.family_papers') = 0, 'nounou : papiers de la famille invisibles');
select tests.throws($$insert into public.document_shares (document_id, user_id) values ('d0950000-0000-4000-8000-0000000000d2', auth.uid())$$, 'nounou : ne peut pas se partager un document');
set request.jwt.claim.sub = :'XX';
select tests.throws($$insert into public.document_shares (document_id, user_id) values ('d0950000-0000-4000-8000-0000000000d1', auth.uid())$$, 'autre foyer : partage d''un document étranger refusé');
set request.jwt.claim.sub = :'OW';
insert into public.document_shares (document_id, user_id) values (:'D1', :'NN');
select tests.throws($$insert into public.document_shares (document_id, user_id) values ('d0950000-0000-4000-8000-0000000000d2', 'd0950000-0000-4000-8000-000000000005')$$, 'partage à une personne hors du foyer refusé');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.documents') = 1 and tests.count('select * from public.documents where id = ''d0950000-0000-4000-8000-0000000000d1''') = 1,
  'nounou : seul le document partagé est visible');
select tests.ok(tests.count('select * from storage.objects where bucket_id = ''documents''') = 1, 'nounou : seul le fichier partagé est lisible');
select tests.ok(tests.count('select * from public.document_shares') = 1, 'nounou : voit ses propres partages');
set request.jwt.claim.sub = :'N2';
select tests.ok(tests.count('select * from public.documents') = 0 and tests.count('select * from public.document_shares') = 0, 'autre nounou : ne voit ni le document ni le partage d''autrui');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.documents') = 2, 'co-parent : documents du foyer visibles (règle inchangée)');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.document_shares') = 0 and tests.count('select * from public.documents') = 0, 'autre foyer : ni documents ni partages visibles');
reset role;

-- ================================================================ Révocation immédiate
set role authenticated; set request.jwt.claim.sub = :'OW';
delete from public.household_members where household_id = :'H' and user_id = :'NN';
reset role;
select tests.ok(not exists (select 1 from public.document_shares where user_id = :'NN'), 'révocation : les partages de documents de la nounou sont effacés');
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.children') = 0 and tests.count('select * from public.bottles') = 0 and tests.count('select * from public.documents') = 0
  and tests.count('select * from public.family_tasks') = 0 and tests.count('select * from public.shopping_items') = 0, 'révocation : plus aucune lecture (enfants, suivi, documents, tâches, courses)');
select tests.throws($$insert into public.bottles (child_id, household_id, at) values ('d0950000-0000-4000-8000-0000000000c1', 'd0950000-0000-4000-8000-0000000000a1', now())$$, 'révocation : plus aucune saisie');
select tests.throws($$insert into public.family_tasks (household_id, title) values ('d0950000-0000-4000-8000-0000000000a1', 'x')$$, 'révocation : plus aucune tâche');
select tests.ok(not (public.my_access()->>'caregiver')::boolean, 'révocation : plus de statut nounou');
select tests.throws($$select public.child_safety_card('d0950000-0000-4000-8000-0000000000c1')$$, 'révocation : fiche de sécurité refusée');
reset role;
update public.premium_policy set strict = false;
