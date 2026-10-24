-- =====================================================================
-- « Sorties près de chez moi » : aucune rencontre entre membres ; lieux proposés jamais visibles avant validation ;
-- signalement d'une erreur sur un lieu proposé.
-- =====================================================================
\set MA 'b0e62000-0000-4000-8000-000000000001'
\set MB 'b0e62000-0000-4000-8000-000000000002'
\set MC 'b0e62000-0000-4000-8000-000000000003'
\set MD 'b0e62000-0000-4000-8000-000000000004'
\set ME 'b0e62000-0000-4000-8000-000000000005'
\set MNP 'b0e62000-0000-4000-8000-000000000006'
\set MMOD 'b0e62000-0000-4000-8000-000000000007'
\set R1 'b0e62000-0000-4000-8000-0000000000a1'
\set R2 'b0e62000-0000-4000-8000-0000000000a2'
reset role;
insert into auth.users (id, email) values (:'MA', 'sortie-a@exemple.test'), (:'MB', 'sortie-b@exemple.test'), (:'MC', 'sortie-c@exemple.test'),
  (:'MD', 'sortie-d@exemple.test'), (:'ME', 'sortie-e@exemple.test'), (:'MNP', 'sortie-np@exemple.test'), (:'MMOD', 'sortie-mod@exemple.test');
insert into public.community_profiles (user_id, pseudonym) values (:'MA', 'Maman Ana'), (:'MB', 'Maman Bea'), (:'MC', 'Maman Cleo'), (:'MD', 'Maman Dora'), (:'ME', 'Maman Elsa'), (:'MMOD', 'Modo Sorties');
insert into public.user_roles (user_id, role) values (:'MMOD', 'moderator') on conflict do nothing;

-- « Sorties près de chez moi » : lieux publics seulement. Aucune rencontre entre membres ne peut être créée.
set role authenticated; set request.jwt.claim.sub = :'MA';
select tests.throws(format($$insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values ('Pique-nique', 'Jeux', 'osm:way/123456', 'Parc', 45.77, 4.85, now() + interval '3 days', 4)$$), 'rencontres entre membres : création refusée');
select tests.ok(tests.count('select * from public.community_meetups') = 0, 'rencontres : aucune annonce visible');
reset role;
select tests.throws(format($$insert into public.community_meetups (id, organizer_id, title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values (%L, %L, 'Pique-nique', 'Jeux', 'osm:way/123456', 'Parc', 45.77, 4.85, now() + interval '3 days', 4)$$, :'R1', :'MA'), 'rencontres : refusées même avec des droits élevés');
select tests.throws(format($$insert into public.meetup_participants (meetup_id, user_id) values (%L, %L)$$, :'R1', :'MB'), 'inscriptions à une rencontre : refusées');

-- Lieux proposés : en attente, jamais affichés avant validation, présentés comme proposés par un membre
set role authenticated; set request.jwt.claim.sub = :'MB';
insert into public.place_suggestions (name, category, address_public, city, lat, lon, equipment, status) values ('Café des petits', 'cafe_family', '3 place Bellecour, Lyon', 'Lyon', 45.757, 4.832, array['highchair','changing_table'], 'approved');
select tests.ok((select status from public.place_suggestions where name = 'Café des petits') = 'pending', 'lieu proposé : toujours en attente à la création');
select tests.throws($$insert into public.place_suggestions (name, category, address_public, lat, lon, equipment) values ('Lieu', 'park', '1 rue X, Lyon', 45, 4, array['piscine'])$$, 'lieu proposé : équipements contrôlés');
select tests.throws($$insert into public.place_suggestions (name, category, address_public, lat, lon, website) values ('Lieu', 'park', '1 rue X, Lyon', 45, 4, 'javascript:alert(1)')$$, 'lieu proposé : site web en https seulement');
update public.place_suggestions set status = 'approved' where name = 'Café des petits';
select tests.ok((select status from public.place_suggestions where name = 'Café des petits') = 'pending', 'lieu proposé : seule la modération valide');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MC';
select tests.ok(tests.count('select * from public.place_suggestions') = 0, 'lieu en attente : invisible des autres membres');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MMOD';
update public.place_suggestions set status = 'approved' where name = 'Café des petits';
reset role;
set role authenticated; set request.jwt.claim.sub = :'MC';
select tests.ok(tests.count('select * from public.place_suggestions') = 1, 'lieu validé : visible de tous');
select tests.ok(tests.count('select user_id from public.place_suggestions') = 1, 'lieu validé : lisible (l''application n''affiche jamais l''auteur)');
insert into public.reports (place_suggestion_id, reason, details) select id, 'other', 'Fermé définitivement' from public.place_suggestions where name = 'Café des petits';
select tests.ok(tests.count('select * from public.reports where place_suggestion_id is not null') = 1, 'signaler une erreur sur un lieu proposé');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'community_meetups') = 0 and jsonb_array_length(public.export_my_data() -> 'place_suggestions') = 0, 'export RGPD : rubriques présentes (vides pour ce membre)');
reset role;
set role anon;
select tests.ok(tests.count('select * from public.community_meetups') = 0 and tests.count('select * from public.place_suggestions') = 0, 'rencontres et lieux proposés : jamais lisibles sans connexion');
reset role;
