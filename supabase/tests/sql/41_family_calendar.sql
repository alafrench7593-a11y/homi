-- =====================================================================
-- Agenda familial : événements du foyer, droits, cloisonnement.
-- =====================================================================
\set ELI  'f3f3f3f3-0000-4000-8000-000000000001'
\set FAB  'f3f3f3f3-0000-4000-8000-000000000002'
\set GUS  'f3f3f3f3-0000-4000-8000-000000000003'
\set FOYER 'f3f3f3f3-0000-4000-8000-0000000000f0'
\set ENFANT 'f3f3f3f3-0000-4000-8000-0000000000c1'

insert into auth.users (id, email) values (:'ELI', 'cal-eli@exemple.test'), (:'FAB', 'cal-fab@exemple.test'), (:'GUS', 'cal-gus@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer d''Éli', :'ELI');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'FOYER', :'FAB', 'caregiver', array['lists'], array[]::text[]);
insert into public.children (id, household_id, first_name, birth_date) values (:'ENFANT', :'FOYER', 'Lou', current_date - 400);
-- Depuis le 13/11/2026 : une nounou voit seulement les enfants qui lui sont confiés explicitement
update public.household_members set child_scope = array[:'ENFANT']::uuid[] where household_id = :'FOYER' and user_id = :'FAB';

set role authenticated; set request.jwt.claim.sub = :'ELI';
insert into public.family_events (household_id, child_id, kind, title, starts_at, ends_at, recurrence)
  values (:'FOYER', :'ENFANT', 'activity', 'Bébés nageurs', now() + interval '2 days', now() + interval '2 days 1 hour', '{"type":"weekly","until":"2027-06-30"}');
select tests.ok(tests.count('select * from public.family_events') = 1, 'agenda : Éli crée un événement récurrent');
update public.family_events set starts_at = starts_at + interval '1 day', ends_at = ends_at + interval '1 day';
select tests.ok((select updated_by = :'ELI' from public.family_events), 'agenda : un déplacement est attribué à son auteur');
select tests.throws(format($$insert into public.family_events (household_id, title, starts_at, ends_at) values (%L, 'X', now(), now() - interval '1 hour')$$, :'FOYER'), 'agenda : fin avant le début refusée');
select tests.throws(format($$insert into public.family_events (household_id, title, starts_at, recurrence) values (%L, 'X', now(), '{"type":"yearly"}')$$, :'FOYER'), 'agenda : récurrence inconnue refusée');

set request.jwt.claim.sub = :'FAB';
select tests.ok(tests.count('select * from public.family_events') = 1, 'agenda : un proche avec « Listes et organisation » voit l''agenda');
update public.family_events set title = 'modifié';
select tests.ok((select title = 'Bébés nageurs' from public.family_events), 'agenda : sans droit de modification, le proche ne peut rien changer');

set request.jwt.claim.sub = :'GUS';
select tests.ok(tests.count('select * from public.family_events') = 0, 'agenda : rien de visible hors du foyer');
select tests.throws(format($$insert into public.family_events (household_id, title, starts_at) values (%L, 'Intrus', now())$$, :'FOYER'), 'agenda : impossible d''écrire dans un foyer étranger');
reset role;
