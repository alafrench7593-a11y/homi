-- =====================================================================
-- Espace Nounou (21/11/2026) — 20261121000100_espace_nounou.sql et 20261121000200_nounou_perimetre.sql
-- Comptes distincts : parent (OW), second parent (CP), nounou confirmée (NN), nounou non confirmée (NU),
-- nounou révoquée (NR), nounou d'un autre enfant (NO), non-membre (XX).
-- =====================================================================
\set OW 'd0b00000-0000-4000-8000-000000000001'
\set CP 'd0b00000-0000-4000-8000-000000000002'
\set NN 'd0b00000-0000-4000-8000-000000000003'
\set NU 'd0b00000-0000-4000-8000-000000000004'
\set NR 'd0b00000-0000-4000-8000-000000000005'
\set NO 'd0b00000-0000-4000-8000-000000000006'
\set XX 'd0b00000-0000-4000-8000-000000000007'
\set H  'd0b00000-0000-4000-8000-0000000000a1'
\set K1 'd0b00000-0000-4000-8000-0000000000c1'
\set K2 'd0b00000-0000-4000-8000-0000000000c2'
\set P1 'd0b00000-0000-4000-8000-0000000000e1'
\set P2 'd0b00000-0000-4000-8000-0000000000e2'
\set P3 'd0b00000-0000-4000-8000-0000000000e3'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'f98zb-parent@exemple.test'), (:'CP', 'f98zb-parent2@exemple.test'),
  (:'NN', 'f98zb-nounou@exemple.test'), (:'NU', 'f98zb-nonconf@exemple.test'), (:'NR', 'f98zb-revoquee@exemple.test'),
  (:'NO', 'f98zb-autre-enfant@exemple.test'), (:'XX', 'f98zb-inconnu@exemple.test');
insert into public.households (id, name, created_by) values (:'H', 'Foyer 98zb', :'OW');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,lists,profile}', '{daily,lists,profile}', null);
insert into public.children (id, household_id, first_name, birth_date) values (:'K1', :'H', 'Lou', current_date - 300), (:'K2', :'H', 'Max', current_date - 700);
insert into public.bottles (child_id, household_id, at, prepared_ml) values (:'K1', :'H', now() - interval '3 hours', 90), (:'K2', :'H', now() - interval '3 hours', 200);
-- Données du foyer hors enfants (périmètre)
insert into public.family_domains (household_id, key) values (:'H', 'repas');
insert into public.family_prep (household_id, key, occurs_on) values (:'H', 'creche', current_date);
insert into public.offduty_periods (household_id, user_id, ends_at) values (:'H', :'OW', now() + interval '2 hours');
set session_replication_role = replica; -- état partagé posé directement (sans le parcours de partage)
insert into public.postpartum_shared_status (user_id, household_id) values (:'OW', :'H');
set session_replication_role = origin;
insert into public.reminders (user_id, household_id, category, title, schedule, shared) values (:'OW', :'H', 'custom', 'Rappel partagé', '{"type":"once"}', true);
select tests.set_premium(:'OW', true);

-- ================================================================ Invitation (parent → nounou), acceptation, confirmation
set role authenticated; set request.jwt.claim.sub = :'OW';
select (public.childcare_invite(:'K1', 'Sophie'))->>'token' as t_nn \gset
select (public.childcare_invite(:'K1', 'Nina'))->>'token' as t_nu \gset
select (public.childcare_invite(:'K1', 'Rose'))->>'token' as t_nr \gset
select (public.childcare_invite(:'K2', 'Odile'))->>'token' as t_no \gset
select (public.childcare_invite(:'K1', 'Expirée'))->>'token' as t_exp \gset
select (public.childcare_invite(:'K1', 'Annulée'))->>'token' as t_rev \gset
select tests.ok(tests.count($$select * from public.household_invitations where role = 'caregiver' and child_scope = '{}' and can_view = '{daily}' and not pregnancy_access and expires_at <= now() + interval '72 hours 1 minute'$$) = 6,
  'invitation : rôle nounou, AUCUN enfant avant confirmation, quotidien seul, grossesse fermée, 72 h');
select tests.ok(tests.count('select * from public.childcare_links where accepted_at is null and caregiver_id is null') = 6, 'invitation : 6 liens en attente');
reset role;
update public.household_invitations set expires_at = now() - interval '1 minute' where id = (select invitation_id from public.childcare_links where label = 'Expirée');
set role authenticated; set request.jwt.claim.sub = :'OW';
select public.childcare_revoke((select id from public.childcare_links where label = 'Annulée'));

set request.jwt.claim.sub = :'XX';
select tests.throws($$select public.childcare_invite('d0b00000-0000-4000-8000-0000000000c1', 'x')$$, 'non-membre : ne peut pas inviter de nounou');
select tests.ok(tests.count('select * from public.childcare_links') = 0, 'non-membre : aucun lien visible');
select tests.throws(format('select public.accept_household_invitation(%L)', :'t_exp'), 'invitation expirée : refusée');
select tests.throws(format('select public.childcare_accept(%L)', :'t_rev'), 'invitation révoquée avant acceptation : refusée');

-- Nounou NN : parcours commun du foyer (inchangé)
set request.jwt.claim.sub = :'NN';
select public.accept_household_invitation(:'t_nn');
select tests.ok(tests.count('select * from public.childcare_links where caregiver_id = auth.uid() and accepted_at is not null and confirmed_at is null') = 1, 'acceptation (parcours commun) : lien « acceptée », pas encore confirmé');
select tests.ok(tests.count('select * from public.children') = 0 and tests.count('select * from public.bottles') = 0,
  'avant confirmation : la nounou ne voit AUCUN enfant ni aucun suivi');
select tests.ok((public.my_childcare()->0->>'status') = 'pending' and (public.my_childcare()->0->'child') = 'null'::jsonb, 'avant confirmation : my_childcare « en attente », sans enfant');
select tests.throws($$insert into public.bottles (child_id, household_id, at) values ('d0b00000-0000-4000-8000-0000000000c1', 'd0b00000-0000-4000-8000-0000000000a1', now())$$, 'avant confirmation : saisie refusée');
select tests.throws(format('select public.childcare_confirm(%L)', (select id from public.childcare_links where caregiver_id = :'NN')), 'la nounou ne peut pas confirmer son propre accès');
select tests.throws(format('select public.accept_household_invitation(%L)', :'t_nn'), 'lien à usage unique : seconde utilisation refusée');
reset role;
select tests.ok(tests.count(format($$select * from public.notifications where payload->>'childcare' = 'accepted' and user_id in (%L, %L)$$, :'OW', :'CP')) = 2,
  'acceptation : les deux parents sont prévenus (accès à confirmer)');

-- NU (non confirmée), NR (sera révoquée), NO (autre enfant) : parcours de l'espace nounou
set role authenticated;
set request.jwt.claim.sub = :'NU'; select public.childcare_accept(:'t_nu');
set request.jwt.claim.sub = :'NR'; select public.childcare_accept(:'t_nr');
set request.jwt.claim.sub = :'NO'; select public.childcare_accept(:'t_no');

-- Confirmation par le SECOND parent
set request.jwt.claim.sub = :'CP';
select public.childcare_confirm(id) from public.childcare_links where caregiver_id in (:'NN', :'NR', :'NO');
select tests.ok(tests.count('select * from public.childcare_links where confirmed_at is not null') = 3, 'second parent : confirme les accès');

set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.children') = 1 and tests.count($$select * from public.bottles$$) = 1
  and tests.count($$select * from public.bottles where child_id = 'd0b00000-0000-4000-8000-0000000000c2'$$) = 0,
  'association à un enfant : après confirmation, la nounou voit Lou et son suivi, pas Max');
select tests.ok((public.my_childcare()->0->>'status') = 'active' and (public.my_childcare()->0->'child'->>'first_name') = 'Lou', 'my_childcare : garde active avec le prénom');

-- ================================================================ Carnet : mêmes tables que le suivi, auteur et origine
insert into public.bottles (client_id, child_id, household_id, at, consumed_ml, milk_type, note, origin)
  values ('d0b00000-0000-4000-8000-00000000b001', :'K1', :'H', now() - interval '2 hours', 150, 'infant_formula', 'A tout bu', 'parent');
insert into public.bottles (client_id, child_id, household_id, at, consumed_ml) values ('d0b00000-0000-4000-8000-00000000b001', :'K1', :'H', now(), 120)
  on conflict (client_id) do nothing;
select tests.ok(tests.count($$select * from public.bottles where client_id = 'd0b00000-0000-4000-8000-00000000b001'$$) = 1, 'biberon : identifiant client idempotent (renvoi = pas de doublon)');
select tests.ok(tests.count($$select * from public.bottles where client_id = 'd0b00000-0000-4000-8000-00000000b001' and origin = 'caregiver' and created_by = 'd0b00000-0000-4000-8000-000000000003'$$) = 1,
  'biberon : origine « nounou » posée par le serveur (déclarée « parent » : corrigée), auteur = nounou');
insert into public.meals (child_id, household_id, at, description, foods) values (:'K1', :'H', now() - interval '1 hour', 'Purée carotte', '{carotte}');
select tests.ok(tests.count($$select * from public.meals where origin = 'caregiver'$$) = 1, 'repas : enregistré dans meals avec origine nounou');
insert into public.sleeps (child_id, household_id, started_at, kind) values (:'K1', :'H', now() - interval '50 minutes', 'nap');
update public.sleeps set ended_at = now() where child_id = :'K1' and ended_at is null;
select tests.ok(tests.count($$select * from public.sleeps where origin = 'caregiver' and ended_at is not null$$) = 1, 'sieste : début puis fin (même ligne)');
insert into public.diapers (child_id, household_id, at, wet) values (:'K1', :'H', now() - interval '30 minutes', true);
select tests.ok(tests.count($$select * from public.diapers where origin = 'caregiver'$$) = 1, 'change : enregistré avec origine nounou');
insert into public.child_observations (child_id, household_id, at, kind, mood, note, to_share) values (:'K1', :'H', now(), 'note', 'happy', 'Joyeux', 'A bien joué');
select tests.ok(tests.count($$select * from public.child_observations where origin = 'caregiver' and mood = 'happy'$$) = 1, 'observation : humeur et information à transmettre');
insert into public.childcare_events (child_id, household_id, kind, activity_type, at) values (:'K1', :'H', 'arrival', null, now() - interval '8 hours'), (:'K1', :'H', 'activity', 'outdoor', now() - interval '3 hours');
select tests.ok(tests.count($$select * from public.childcare_events where origin = 'caregiver'$$) = 2, 'arrivée et activité : enregistrées (childcare_events)');
select tests.throws($$insert into public.childcare_events (child_id, household_id, kind, at) values ('d0b00000-0000-4000-8000-0000000000c2', 'd0b00000-0000-4000-8000-0000000000a1', 'activity', now())$$, 'nounou : activité d''un enfant non confié refusée');
-- Information importante : température MESURÉE, notification prioritaire et neutre aux parents
insert into public.child_observations (child_id, household_id, at, kind, value_num, important, important_kind) values (:'K1', :'H', now(), 'temperature', 38.4, true, 'temperature');
reset role;
select tests.ok(tests.count(format($$select * from public.notifications where payload->>'childcare' = 'important' and urgent and user_id in (%L, %L) and body not like '%%38%%'$$, :'OW', :'CP')) = 2
  and tests.count(format($$select * from public.notifications where payload->>'childcare' = 'important' and user_id = %L$$, :'NN')) = 0,
  'information importante : notification prioritaire aux 2 parents, sans la valeur, pas à la nounou');
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.bottles (child_id, household_id, at, consumed_ml, origin) values (:'K1', :'H', now() - interval '5 hours', 120, 'caregiver');
select tests.ok(tests.count($$select * from public.bottles where created_by = 'd0b00000-0000-4000-8000-000000000001' and origin = 'parent'$$) = 1, 'parent : ne peut pas se déclarer « nounou » (origine parent)');
select tests.ok(tests.count($$select * from public.bottles where origin = 'caregiver' and child_id = 'd0b00000-0000-4000-8000-0000000000c1'$$) = 1, 'intégration : le parent voit le biberon saisi par la nounou');

-- ================================================================ Photos : autorisation, écriture, lecture, partage
set request.jwt.claim.sub = :'NN';
select tests.throws(format($$insert into storage.objects (bucket_id, name) values ('child-photos', '%s/%s/%s.jpg')$$, :'H', :'K1', :'P1'), 'photo : dépôt du fichier refusé tant que les photos ne sont pas autorisées');
select tests.throws(format($$insert into public.childcare_photos (client_id, household_id, child_id, storage_path, only_this_child) values (%L, %L, %L, '%s/%s/%s.jpg', true)$$, :'P1', :'H', :'K1', :'H', :'K1', :'P1'),
  'photo : ligne refusée tant que les photos ne sont pas autorisées');
select tests.throws(format($$select public.childcare_set_settings(%L, true)$$, :'K1'), 'nounou : ne peut pas autoriser les photos elle-même');
set request.jwt.claim.sub = :'OW';
select public.childcare_set_settings(:'K1', p_photos_allowed => true, p_retention => '30d');
select tests.ok(tests.count($$select * from public.childcare_settings where photos_allowed and photos_allowed_at is not null and photos_allowed_by = 'd0b00000-0000-4000-8000-000000000001'$$) = 1
  and tests.count('select * from public.childcare_consents where photos_allowed') = 1, 'autorisation photo : explicite, horodatée, journalisée');
insert into public.childcare_notify_prefs (child_id, photos) values (:'K1', true);
set request.jwt.claim.sub = :'CP';
insert into public.childcare_notify_prefs (child_id, photos) values (:'K1', false);
set request.jwt.claim.sub = :'NN';
insert into storage.objects (bucket_id, name) values ('child-photos', format('%s/%s/%s.jpg', :'H', :'K1', :'P1'));
select tests.throws(format($$insert into public.childcare_photos (client_id, household_id, child_id, storage_path, only_this_child) values (%L, %L, %L, '%s/%s/%s.jpg', false)$$, :'P1', :'H', :'K1', :'H', :'K1', :'P1'),
  'photo de groupe : « d''autres enfants apparaissent » → partage refusé par la base');
insert into public.childcare_photos (client_id, household_id, child_id, storage_path, only_this_child, caption)
  values (:'P1', :'H', :'K1', format('%s/%s/%s.jpg', :'H', :'K1', :'P1'), true, 'Petite promenade au soleil.');
insert into public.childcare_photos (client_id, household_id, child_id, storage_path, only_this_child)
  values (:'P1', :'H', :'K1', format('%s/%s/%s.jpg', :'H', :'K1', :'P1'), true) on conflict (client_id) do nothing;
select tests.ok(tests.count('select * from public.childcare_photos') = 1, 'téléversement : une seule ligne (renvoi idempotent)');
select tests.ok(tests.count($$select * from public.childcare_photos where origin = 'caregiver' and author_id = 'd0b00000-0000-4000-8000-000000000003'$$) = 1, 'photo : auteur et origine posés par le serveur');
select tests.throws(format($$insert into storage.objects (bucket_id, name) values ('child-photos', '%s/%s/%s.jpg')$$, :'H', :'K2', :'P2'), 'photo : fichier pour un enfant non confié refusé');
reset role;
select tests.ok(tests.count($$select * from public.notifications where title = 'HOMI — Nouveau souvenir' and body = 'Une nouvelle photo de bébé est disponible.' and user_id = 'd0b00000-0000-4000-8000-000000000001'$$) = 1,
  'notification : titre et texte exacts, « bébé » par discrétion, au parent qui l''a activée');
select tests.ok(tests.count($$select * from public.notifications where payload->>'childcare' = 'photo' and user_id = 'd0b00000-0000-4000-8000-000000000002'$$) = 0,
  'notification : pas envoyée au parent qui l''a désactivée');
select tests.ok(tests.count($$select * from public.notifications where payload->>'childcare' = 'photo' and (payload ? 'storage_path' or payload ? 'url' or body like '%%promenade%%')$$) = 0,
  'notification : ni image, ni chemin, ni légende');

set role authenticated;
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.childcare_photos') = 1 and tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 1, 'réception côté parent 1 : ligne et fichier lisibles');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.childcare_photos') = 1 and tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 1, 'réception côté parent 2 : ligne et fichier lisibles');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.childcare_photos') = 1, 'auteure (accès actif) : voit sa photo');
set request.jwt.claim.sub = :'NU';
select tests.ok(tests.count('select * from public.childcare_photos') = 0 and tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 0
  and tests.count('select * from public.children') = 0 and tests.count('select * from public.childcare_settings') = 0, 'nounou non confirmée : ni photo, ni fichier, ni enfant, ni réglage');
select tests.throws(format($$insert into storage.objects (bucket_id, name) values ('child-photos', '%s/%s/%s.jpg')$$, :'H', :'K1', :'P3'), 'nounou non confirmée : dépôt de fichier refusé');
set request.jwt.claim.sub = :'NO';
select tests.ok(tests.count('select * from public.childcare_photos') = 0 and tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 0
  and tests.count($$select * from public.bottles where child_id = 'd0b00000-0000-4000-8000-0000000000c1'$$) = 0, 'nounou d''un autre enfant : rien de Lou');
select tests.ok(tests.count($$select * from public.childcare_photos where id is not null$$) = 0, 'nounou d''un autre enfant : aucune photo');
set request.jwt.claim.sub = :'XX';
select tests.ok(tests.count('select * from public.childcare_photos') = 0 and tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 0, 'non-membre : aucune photo ni fichier');
delete from public.childcare_photos;
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.childcare_photos') = 1, 'non-membre : suppression sans effet');

-- Ajout aux souvenirs : même fichier, aucune copie ; un fichier encore référencé ne s'efface pas
select public.childcare_photo_to_memories((select id from public.childcare_photos));
select tests.ok(tests.count(format($$select * from public.child_photos where storage_path = '%s/%s/%s.jpg'$$, :'H', :'K1', :'P1')) = 1, 'souvenirs : photo ajoutée à l''album de l''enfant sans copie du fichier');
delete from public.childcare_photos;
select tests.ok(tests.count('select * from public.childcare_photos') = 0 and tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 1, 'suppression (parent) : ligne supprimée, fichier gardé car dans les souvenirs');
reset role;
select tests.ok(tests.count(format($$select * from public.storage_deletions where path = '%s/%s/%s.jpg'$$, :'H', :'K1', :'P1')) = 0, 'suppression : aucun effacement programmé d''un fichier encore dans l''album');
set role authenticated; set request.jwt.claim.sub = :'OW';
delete from storage.objects where bucket_id = 'child-photos';
select tests.ok(tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 1, 'fichier référencé par l''album : effacement direct refusé');

-- Seconde photo : prénom affiché si la discrétion est levée ; suppression de la ligne ET du fichier
select public.childcare_set_settings(:'K1', p_notify_name => true);
set request.jwt.claim.sub = :'NN';
insert into storage.objects (bucket_id, name) values ('child-photos', format('%s/%s/%s.jpg', :'H', :'K1', :'P2'));
insert into public.childcare_photos (client_id, household_id, child_id, storage_path, only_this_child) values (:'P2', :'H', :'K1', format('%s/%s/%s.jpg', :'H', :'K1', :'P2'), true);
reset role;
select tests.ok(tests.count($$select * from public.notifications where body = 'Une nouvelle photo de Lou est disponible.'$$) = 1, 'notification : prénom quand la discrétion est levée');
set role authenticated; set request.jwt.claim.sub = :'CP';
delete from public.childcare_photos where client_id = :'P2';
delete from storage.objects where name = format('%s/%s/%s.jpg', :'H', :'K1', :'P2');
reset role;
select tests.ok(tests.count(format($$select * from public.childcare_photos where client_id = %L$$, :'P2')) = 0
  and tests.count(format($$select * from public.storage_deletions where path = '%s/%s/%s.jpg'$$, :'H', :'K1', :'P2')) = 1, 'suppression : ligne supprimée et fichier programmé pour effacement');

-- Retrait de l'autorisation : bouton masqué côté app ET écriture refusée par la base
set role authenticated; set request.jwt.claim.sub = :'OW';
select public.childcare_set_settings(:'K1', p_photos_allowed => false);
select tests.ok(tests.count('select * from public.childcare_consents') = 2, 'retrait de l''autorisation : journalisé');
set request.jwt.claim.sub = :'NN';
select tests.throws(format($$insert into storage.objects (bucket_id, name) values ('child-photos', '%s/%s/%s.jpg')$$, :'H', :'K1', :'P3'), 'autorisation retirée : dépôt de fichier refusé');
set request.jwt.claim.sub = :'OW';
select public.childcare_set_settings(:'K1', p_photos_allowed => true);

-- ================================================================ Messagerie parents–nounou
set request.jwt.claim.sub = :'NN';
insert into public.childcare_messages (child_id, body) values (:'K1', 'Il a bien dormi.');
set request.jwt.claim.sub = :'CP';
insert into public.childcare_messages (child_id, body, important) values (:'K1', 'Pensez à la crème.', true);
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.childcare_messages') = 2, 'messagerie : parent voit le fil');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.childcare_messages where important') = 1, 'messagerie : nounou voit le fil et l''information importante');
set request.jwt.claim.sub = :'NU';
select tests.ok(tests.count('select * from public.childcare_messages') = 0, 'messagerie : nounou non confirmée exclue');
select tests.throws($$insert into public.childcare_messages (child_id, body) values ('d0b00000-0000-4000-8000-0000000000c1', 'coucou')$$, 'messagerie : nounou non confirmée ne peut pas écrire');
set request.jwt.claim.sub = :'NO';
select tests.ok(tests.count('select * from public.childcare_messages') = 0, 'messagerie : nounou d''un autre enfant exclue');
set request.jwt.claim.sub = :'XX';
select tests.throws($$insert into public.childcare_messages (child_id, body) values ('d0b00000-0000-4000-8000-0000000000c1', 'coucou')$$, 'messagerie : non-membre ne peut pas écrire');
reset role;
select tests.ok(tests.count($$select * from information_schema.columns where table_schema = 'public' and table_name like 'childcare%' and column_name ~ '(read|seen|online|presence|typing|last_active|delivered)'$$) = 0,
  'anti-surveillance : aucune colonne de lecture, de présence ou de « vu » dans l''espace nounou');
select tests.ok(tests.count(format($$select * from public.notifications where payload->>'childcare' = 'message' and user_id = %L$$, :'NN')) = 1, 'messagerie : la nounou est prévenue du message du parent');

-- ================================================================ Révocation immédiate
set role authenticated; set request.jwt.claim.sub = :'NR';
insert into public.bottles (child_id, household_id, at, consumed_ml) values (:'K1', :'H', now(), 60);
select tests.ok(tests.count('select * from public.bottles') >= 1 and tests.count('select * from public.childcare_messages') = 2, 'avant révocation : accès actif');
set request.jwt.claim.sub = :'OW';
select public.childcare_revoke((select id from public.childcare_links where caregiver_id = :'NR'));
set request.jwt.claim.sub = :'NR';
select tests.ok(tests.count('select * from public.bottles') = 0 and tests.count('select * from public.children') = 0 and tests.count('select * from public.childcare_messages') = 0
  and tests.count('select * from public.childcare_photos') = 0 and tests.count($$select * from storage.objects where bucket_id = 'child-photos'$$) = 0,
  'révocation : plus de suivi, d''enfant, de messages, de photos ni de fichiers (URL signées : courte durée)');
select tests.throws($$insert into public.childcare_messages (child_id, body) values ('d0b00000-0000-4000-8000-0000000000c1', 'encore là ?')$$, 'révocation : messagerie fermée');
select tests.ok(tests.count('select * from public.household_members where user_id = auth.uid()') = 0, 'révocation : plus aucun enfant gardé → retirée du foyer');
select tests.ok(public.my_childcare() = '[]'::jsonb, 'révocation : plus aucune garde');

-- ================================================================ Conservation : purge réelle
reset role;
insert into storage.objects (bucket_id, name, owner) values ('child-photos', format('%s/%s/%s.jpg', :'H', :'K1', :'P3'), :'NN');
insert into public.childcare_photos (client_id, household_id, child_id, author_id, storage_path, only_this_child, taken_at)
  values (:'P3', :'H', :'K1', :'NN', format('%s/%s/%s.jpg', :'H', :'K1', :'P3'), true, now() - interval '40 days');
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(public.childcare_purge_now() = 0, 'purge : sans effet pour une nounou');
set request.jwt.claim.sub = :'OW';
select tests.ok(public.childcare_purge_now() = 1 and tests.count(format($$select * from public.childcare_photos where client_id = %L$$, :'P3')) = 0, 'conservation 30 jours : photo de 40 jours purgée');
reset role;
select tests.ok(tests.count(format($$select * from public.storage_deletions where path = '%s/%s/%s.jpg'$$, :'H', :'K1', :'P3')) = 1, 'purge : fichier programmé pour effacement');
set role authenticated; set request.jwt.claim.sub = :'OW';
select tests.throws($$select public.childcare_purge_expired(null)$$, 'purge globale : réservée au serveur');
reset role;

-- ================================================================ Périmètre de la nounou dans le foyer
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.family_domains') = 0 and tests.count('select * from public.family_prep') = 0, 'périmètre : charge mentale du couple invisible');
select tests.ok(tests.count('select * from public.offduty_periods') = 0 and tests.count('select * from public.postpartum_shared_status') = 0, 'périmètre : périodes des parents et post-partum invisibles');
select tests.ok(tests.count('select * from public.reminders') = 0, 'périmètre : rappels partagés du foyer invisibles');
select tests.ok(tests.count('select * from public.couple_checkins') = 0 and tests.count('select * from public.pregnancies') = 0, 'périmètre : couple et grossesse invisibles');
select tests.throws($$select public.childcare_set_settings('d0b00000-0000-4000-8000-0000000000c1', null, 'forever')$$, 'périmètre : la nounou ne change pas la conservation');
select tests.throws(format('select public.childcare_revoke(%L)', (select id from public.childcare_links where caregiver_id = :'NN')), 'périmètre : la nounou ne gère pas les accès');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.family_domains') = 1 and tests.count('select * from public.reminders') >= 1,
  'périmètre : les parents gardent tout');
reset role;
select tests.set_premium(:'OW', false);
