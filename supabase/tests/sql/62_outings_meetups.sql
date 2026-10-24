-- =====================================================================
-- « Sorties & rencontres » : rencontres de groupe dans un lieu public, inscriptions, blocages, signalements,
-- lieux proposés jamais visibles avant validation, liste des participantes jamais publique.
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

-- Proposer une rencontre : profil communautaire, lieu public référencé, groupe de 3 places au moins, date encadrée
set role authenticated; set request.jwt.claim.sub = :'MA';
insert into public.community_meetups (id, title, activity, place_ref, place_name, place_address, lat, lon, city_label, starts_at, child_age_min, child_age_max, capacity)
  values (:'R1', 'Pique-nique au parc', 'Pique-nique et jeux sur l''aire de jeux, apportez une couverture.', 'osm:way/123456', 'Parc de la Tête d''Or', 'Boulevard des Belges, Lyon', 45.777, 4.855, 'Lyon', now() + interval '3 days', 0, 3, 3);
select tests.ok((select status = 'visible' and participants_count = 1 from public.community_meetups where id = :'R1'), 'rencontre : visible, l''organisatrice participe d''office');
select tests.throws(format($$insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values ('Café', 'Un café à deux', 'osm:node/1', 'Café', 45, 4, now() + interval '2 days', 2)$$), 'rencontre : jamais à deux (3 places au moins)');
select tests.throws(format($$insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values ('Chez moi', 'Goûter à la maison', 'domicile:12 rue des Lilas', 'Chez moi', 45, 4, now() + interval '2 days', 4)$$), 'rencontre : uniquement dans un lieu public référencé');
select tests.throws(format($$insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values ('Passée', 'Balade', 'osm:node/1', 'Parc', 45, 4, now() - interval '1 day', 4)$$), 'rencontre : jamais dans le passé');
select tests.throws(format($$insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values ('Lointaine', 'Balade', 'osm:node/1', 'Parc', 45, 4, now() + interval '90 days', 4)$$), 'rencontre : au plus 60 jours à l''avance');
select tests.throws(format($$insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values ('Lieu non validé', 'Balade', 'sugg:%s', 'Lieu', 45, 4, now() + interval '2 days', 4)$$, gen_random_uuid()), 'rencontre : un lieu proposé doit être validé');
select tests.throws(format($$insert into public.community_meetups (organizer_id, title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values (%L, 'Usurpée', 'Balade', 'osm:node/1', 'Parc', 45, 4, now() + interval '2 days', 4)$$, :'MB'), 'rencontre : impossible au nom d''une autre');
insert into public.community_meetups (id, title, activity, place_ref, place_name, lat, lon, starts_at, capacity)
  values (:'R2', 'Balade poussette', 'Appelez-moi au 06 12 34 56 78 pour les détails', 'osm:node/42', 'Quais du Rhône', 45.76, 4.84, now() + interval '5 days', 6);
select tests.ok((select status from public.community_meetups where id = :'R2') = 'pending_review', 'rencontre : coordonnées personnelles -> relue par la modération avant affichage');
update public.community_meetups set status = 'visible' where id = :'R2';
select tests.ok((select status from public.community_meetups where id = :'R2') = 'pending_review', 'annonce à relire : l''organisatrice ne peut pas la remettre en ligne elle-même');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MNP';
select tests.throws(format($$insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity) values ('Sans profil', 'Balade', 'osm:node/1', 'Parc', 45, 4, now() + interval '2 days', 4)$$), 'rencontre : profil communautaire obligatoire');
reset role;

-- Visibilité : annonce relue invisible des autres ; participantes jamais listées
set role authenticated; set request.jwt.claim.sub = :'MB';
select tests.ok(tests.count('select * from public.community_meetups') = 1, 'annonce à relire : invisible des autres membres');
insert into public.meetup_participants (meetup_id) values (:'R1');
select tests.throws(format($$insert into public.meetup_participants (meetup_id) values (%L)$$, :'R1'), 'je participe : une seule fois');
select tests.throws(format($$insert into public.meetup_participants (meetup_id) values (%L)$$, :'R2'), 'je participe : impossible sur une annonce à relire');
select tests.throws(format($$insert into public.meetup_participants (meetup_id, user_id) values (%L, %L)$$, :'R1', :'MC'), 'je participe : impossible d''inscrire une autre personne');
update public.community_meetups set title = 'Détournée' where id = :'R1';
select tests.ok((select title from public.community_meetups where id = :'R1') = 'Pique-nique au parc', 'rencontre : seule l''organisatrice la modifie');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MC';
insert into public.meetup_participants (meetup_id) values (:'R1');
select tests.ok(tests.count('select * from public.meetup_participants') = 1, 'participantes : chacune ne voit que sa propre inscription');
select tests.ok((select participants_count from public.community_meetups where id = :'R1') = 3, 'places : compteur tenu à jour');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MD';
select tests.throws(format($$insert into public.meetup_participants (meetup_id) values (%L)$$, :'R1'), 'rencontre complète : plus d''inscription');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MC';
delete from public.meetup_participants where meetup_id = :'R1';
select tests.ok((select participants_count from public.community_meetups where id = :'R1') = 2, 'annuler ma participation : la place se libère');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MA';
select tests.throws(format($$update public.community_meetups set capacity = 1 where id = %L$$, :'R1'), 'rencontre : jamais moins de places que d''inscrites');
select tests.throws(format($$update public.community_meetups set place_ref = 'osm:node/9' where id = %L$$, :'R1'), 'rencontre : le lieu ne change pas après publication');
update public.community_meetups set participants_count = 0 where id = :'R1';
select tests.ok((select participants_count from public.community_meetups where id = :'R1') = 2, 'compteur : jamais modifiable à la main');
-- Blocage : l'organisatrice bloque D -> D ne voit plus l'annonce et ne peut pas s'inscrire
insert into public.user_blocks (blocked_id) values (:'MD');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MD';
select tests.ok(tests.count(format('select * from public.community_meetups where id = %L', :'R1')) = 0, 'blocage : l''annonce disparaît pour la personne bloquée');
select tests.throws(format($$insert into public.meetup_participants (meetup_id) values (%L)$$, :'R1'), 'blocage : inscription impossible');
reset role;

-- Signalements : annonce et lieu proposé ; 3 signalements -> annonce mise de côté
set role authenticated; set request.jwt.claim.sub = :'MB';
insert into public.reports (meetup_id, reason, details) values (:'R1', 'inappropriate', 'Annonce douteuse');
select tests.throws(format($$insert into public.reports (meetup_id, reason) values (%L, 'spam')$$, :'R1'), 'signalement : une seule fois par annonce');
select tests.throws(format($$insert into public.reports (meetup_id, post_id, reason) values (%L, null, 'spam'), (null, null, 'spam')$$, :'R1'), 'signalement : une seule cible');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MC'; insert into public.reports (meetup_id, reason) values (:'R1', 'spam'); reset role;
set role authenticated; set request.jwt.claim.sub = :'ME'; insert into public.reports (meetup_id, reason) values (:'R1', 'danger'); reset role;
set role authenticated; set request.jwt.claim.sub = :'ME';
select tests.ok(tests.count(format('select * from public.community_meetups where id = %L', :'R1')) = 0, '3 signalements : annonce retirée de l''affichage en attendant la modération');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MMOD';
select tests.ok(tests.count(format('select * from public.reports where meetup_id = %L', :'R1')) = 3, 'modération : lit les signalements d''annonces');
update public.community_meetups set status = 'removed' where id = :'R1';
reset role;
set role authenticated; set request.jwt.claim.sub = :'MA';
select tests.throws(format($$update public.community_meetups set status = 'visible' where id = %L$$, :'R1'), 'annonce retirée : l''organisatrice ne peut pas la republier');
update public.community_meetups set status = 'cancelled' where id = :'R2';
select tests.ok((select status from public.community_meetups where id = :'R2') = 'cancelled', 'organisatrice : peut annuler sa rencontre');
reset role;

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
insert into public.community_meetups (title, activity, place_ref, place_name, lat, lon, starts_at, capacity)
  select 'Goûter au café', 'Goûter entre parents et bébés', 'sugg:' || id, name, lat, lon, now() + interval '4 days', 5 from public.place_suggestions where name = 'Café des petits';
select tests.ok(tests.count('select * from public.community_meetups where place_ref like ''sugg:%''') = 1, 'rencontre possible dans un lieu proposé validé');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'community_meetups') = 1 and jsonb_array_length(public.export_my_data() -> 'meetup_participations') = 1, 'export RGPD : rencontres et participations');
reset role;
set role anon;
select tests.ok(tests.count('select * from public.community_meetups') = 0 and tests.count('select * from public.place_suggestions') = 0, 'rencontres et lieux proposés : jamais lisibles sans connexion');
reset role;
