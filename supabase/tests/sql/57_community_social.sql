-- =====================================================================
-- Communauté : mini-réseau social (suivre, abonnements, groupes, sondages, mentions, épinglage)
-- et droits Gratuit / Premium (profil personnalisé, badge, dossiers, albums, recherche avancée, journal, ateliers).
-- =====================================================================
\set S1 '5ec1a100-0000-4000-8000-000000000001'
\set S2 '5ec1a100-0000-4000-8000-000000000002'
\set S3 '5ec1a100-0000-4000-8000-000000000003'
\set S4 '5ec1a100-0000-4000-8000-000000000004'
\set MOD '5ec1a100-0000-4000-8000-000000000009'
reset role;
insert into auth.users (id, email) values (:'S1', 'soc-un@exemple.test'), (:'S2', 'soc-deux@exemple.test'), (:'S3', 'soc-trois@exemple.test'),
  (:'S4', 'soc-quatre@exemple.test'), (:'MOD', 'soc-mod@exemple.test');
insert into public.user_roles (user_id, role) values (:'MOD', 'moderator');

set role authenticated; set request.jwt.claim.sub = :'S1';
insert into public.community_profiles (user_id, pseudonym, handle, rules_accepted_at) values (auth.uid(), 'Iris Soleil', 'iris_soleil', now());
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
insert into public.community_profiles (user_id, pseudonym, handle, rules_accepted_at) values (auth.uid(), 'Noah Papa', 'noah_papa', now());
reset role;
set role authenticated; set request.jwt.claim.sub = :'S3';
insert into public.community_profiles (user_id, pseudonym, handle, rules_accepted_at) values (auth.uid(), 'Lou Nuit', 'lou_nuit', now());
reset role;
set role authenticated; set request.jwt.claim.sub = :'MOD';
insert into public.community_profiles (user_id, pseudonym, handle, rules_accepted_at) values (auth.uid(), 'Équipe modération', 'equipe_mod', now());
reset role;

-- ---------------------------------------------------------------- Suivre un membre
set role authenticated; set request.jwt.claim.sub = :'S4';
select tests.throws($$select public.follow_member('iris_soleil')$$, 'suivre : profil communautaire nécessaire');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
select public.follow_member('@iris_soleil');
select public.follow_member('iris_soleil');
select tests.ok(tests.count($$select * from public.member_follows$$) = 1, 'suivre : une seule fois');
select tests.throws($$select public.follow_member('noah_papa')$$, 'suivre : impossible de se suivre soi-même');
select tests.throws($$insert into public.member_follows (follower_id, followee_id) values (auth.uid(), '5ec1a100-0000-4000-8000-000000000003')$$, 'suivre : uniquement par la fonction dédiée');
select tests.ok(jsonb_array_length(public.my_follows()) = 1 and (public.my_follows() -> 0 ->> 'handle') = 'iris_soleil', 'suivre : liste des membres que je suis');
select tests.ok((public.community_member('iris_soleil') ->> 'is_following')::boolean, 'suivre : visible sur le profil du membre');
select tests.ok(not (public.community_member('iris_soleil') ? 'followers_count'), 'pas de concours de popularité : aucun nombre d''abonné·es sur un profil public');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S3';
select public.follow_member('iris_soleil');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.ok(tests.count($$select * from public.member_follows$$) = 0, 'suivre : la liste de mes abonné·es n''est pas lisible');
select tests.ok((public.my_community_profile() ->> 'followers_count')::int = 2, 'suivre : je connais seule mon nombre d''abonné·es');
select tests.ok(tests.count($$select * from public.notifications where category = 'community_follow'$$) = 2, 'suivre : une notification par nouvelle personne (pas de doublon)');
reset role;

-- ---------------------------------------------------------------- Catégories suivies
set role authenticated; set request.jwt.claim.sub = :'S2';
insert into public.forum_subscriptions (forum_id) select id from public.forums where slug in ('sommeil', 'biberon');
select tests.ok(tests.count($$select * from public.forum_subscriptions$$) = 2, 'catégories : abonnement à plusieurs catégories (gratuit)');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.ok(tests.count($$select * from public.forum_subscriptions$$) = 0, 'catégories : abonnements privés');
reset role;

-- ---------------------------------------------------------------- Publications des membres suivis, mentions, anonymat
reset role;
insert into public.community_notification_prefs (user_id, followed_post) values (:'S2', true);
set role authenticated; set request.jwt.claim.sub = :'S1';
insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug = 'sommeil'), 'Nuits hachées', 'Des idées pour les réveils à 3 h ? @lou_nuit tu en parlais l''autre jour.');
insert into public.posts (forum_id, body, kind, anonymous) values ((select id from public.forums where slug = 'post-partum'), 'Je me sens dépassée certains soirs, et vous ?', 'testimony', true);
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
select tests.ok((select following_author from public.forum_feed where title = 'Nuits hachées'), 'fil Abonnements : publication d''un membre suivi reconnue');
select tests.ok(not (select following_author from public.forum_feed where kind = 'testimony' and body like 'Je me sens dépassée%'), 'anonymat : une publication anonyme n''est jamais rattachée au membre suivi');
select tests.ok(tests.count($$select * from public.notifications where category = 'community_follow' and title like '%a publié%'$$) = 1,
  'membres suivis : notification de nouvelle publication (si activée), jamais pour la publication anonyme');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S3';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_mention'$$) = 1, 'mention : la personne mentionnée est prévenue');
select tests.ok(tests.count($$select * from public.notifications where category = 'community_follow'$$) = 0, 'membres suivis : désactivé par défaut (pas de notifications inutiles)');
update public.community_notification_prefs set mention = false where user_id = auth.uid();
insert into public.community_notification_prefs (user_id, mention) values (auth.uid(), false) on conflict (user_id) do update set mention = false;
reset role;
set role authenticated; set request.jwt.claim.sub = :'S1';
insert into public.comments (post_id, body) select id, 'Merci @lou_nuit !' from public.forum_feed where title = 'Nuits hachées';
reset role;
set role authenticated; set request.jwt.claim.sub = :'S3';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_mention'$$) = 1, 'mention : réglage désactivable séparément');
reset role;

-- ---------------------------------------------------------------- Sondages
set role authenticated; set request.jwt.claim.sub = :'S2';
insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug = 'biberon'), 'Quelle température ?', 'Vous donnez le biberon à quelle température ?');
insert into public.post_polls (post_id) select id from public.forum_feed where title = 'Quelle température ?';
insert into public.poll_options (post_id, label, position) select id, 'Température ambiante', 0 from public.forum_feed where title = 'Quelle température ?';
insert into public.poll_options (post_id, label, position) select id, 'Tiède', 1 from public.forum_feed where title = 'Quelle température ?';
reset role;
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.throws($$insert into public.poll_options (post_id, label, position) select id, 'Intrus', 2 from public.forum_feed where title = 'Quelle température ?'$$,
  'sondage : seule l''autrice ajoute des choix');
select public.vote_poll((select id from public.forum_feed where title = 'Quelle température ?'),
  array[(select o.id from public.poll_options o join public.forum_feed f on f.id = o.post_id where f.title = 'Quelle température ?' and o.position = 1)]);
select tests.throws($$select public.vote_poll((select id from public.forum_feed where title = 'Quelle température ?'),
  (select array_agg(o.id) from public.poll_options o join public.forum_feed f on f.id = o.post_id where f.title = 'Quelle température ?'))$$, 'sondage : un seul choix si non multiple');
select public.vote_poll((select id from public.forum_feed where title = 'Quelle température ?'),
  array[(select o.id from public.poll_options o join public.forum_feed f on f.id = o.post_id where f.title = 'Quelle température ?' and o.position = 0)]);
select tests.ok(((select poll from public.forum_feed where title = 'Quelle température ?') ->> 'total')::int = 1
  and ((select poll from public.forum_feed where title = 'Quelle température ?') -> 'options' -> 0 ->> 'mine')::boolean,
  'sondage : vote modifiable, résultat et « mon choix »');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
select tests.ok(tests.count($$select * from public.poll_votes$$) = 0, 'sondage : votes anonymes (personne ne voit qui a voté)');
select tests.ok(((select poll from public.forum_feed where title = 'Quelle température ?') -> 'options' -> 0 ->> 'votes')::int = 1, 'sondage : totaux visibles');
reset role;

-- ---------------------------------------------------------------- Groupes thématiques et par mois
set role authenticated; set request.jwt.claim.sub = :'S1';
select public.join_group((select id from public.community_groups where slug = 'parents-solo'));
select tests.ok(((select g from jsonb_array_elements(public.community_groups_overview()) g where g ->> 'slug' = 'parents-solo') ->> 'is_member')::boolean, 'groupe thématique : rejoindre');
insert into public.posts (forum_id, group_id, body) values ((select id from public.forums where slug = 'questions-generales'), (select id from public.community_groups where slug = 'parents-solo'), 'Comment vous organisez-vous le mercredi ?');
select public.join_cohort_group('birth', (date_trunc('month', now()) - interval '3 months')::date);
select tests.ok((select name from public.community_groups where kind = 'cohort' and cohort_type = 'birth') like 'Bébés nés en %', 'groupe par mois : créé avec un nom clair');
select tests.throws($$select public.join_cohort_group('birth', (now() + interval '2 months')::date)$$, 'groupe par mois : mois futur refusé pour une naissance');
select tests.throws($$select public.join_cohort_group('due', (now() + interval '3 years')::date)$$, 'groupe par mois : terme trop lointain refusé');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
select tests.ok(tests.count($$select * from public.forum_feed where body like 'Comment vous organisez-vous%'$$) = 1, 'groupe thématique : publications lisibles par tous les membres');
select tests.throws($$insert into public.comments (post_id, body) select id, 'Pareil ici' from public.forum_feed where body like 'Comment vous organisez-vous%'$$, 'groupe : rejoindre pour répondre');
select public.join_cohort_group('birth', (date_trunc('month', now()) - interval '3 months')::date);
select tests.ok((select member_count from public.community_groups where kind = 'cohort' and cohort_type = 'birth') = 2, 'groupe par mois : même groupe pour le même mois');
reset role;

-- ---------------------------------------------------------------- Groupe privé (création Premium) et invitations
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.throws($$select public.create_private_group('Mamans du quartier', 'Entre nous')$$, 'groupe privé : création réservée à Premium');
reset role;
select tests.set_premium(:'S1', true);
set role authenticated; set request.jwt.claim.sub = :'S1';
select public.create_private_group('Copines de la maternité', 'Notre petit groupe');
select tests.throws($$select public.create_private_group('Appelez-moi 06 12 34 56 78', null)$$, 'groupe privé : pas d''informations personnelles dans le nom');
select public.invite_to_group((select id from public.community_groups where kind = 'private'), '@noah_papa');
insert into public.posts (forum_id, group_id, title, body) values ((select id from public.forums where slug = 'questions-generales'), (select id from public.community_groups where kind = 'private'),
  'Rendez-vous', 'On se retrouve au parc samedi ? @lou_nuit');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S3';
select tests.ok(tests.count($$select * from public.forum_feed where title = 'Rendez-vous'$$) = 0, 'groupe privé : publications invisibles hors du groupe');
select tests.ok(tests.count($$select * from public.community_groups where kind = 'private'$$) = 0, 'groupe privé : invisible sans invitation');
select tests.ok(tests.count($$select * from public.notifications where body like 'On se retrouve%'$$) = 0, 'mention : jamais pour une personne extérieure au groupe privé');
select tests.ok(tests.count($$select * from public.search_posts('parc')$$) = 0, 'recherche : n''expose pas les groupes privés');
select tests.throws($$select public.join_group((select id from public.community_groups where name = 'Copines de la maternité'))$$, 'groupe privé : impossible de rejoindre sans invitation');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_group' and title like '%vous invite%'$$) = 1, 'invitation : notification envoyée');
select tests.ok(tests.count($$select * from public.community_groups where kind = 'private'$$) = 1, 'invitation : le groupe est visible par la personne invitée');
select tests.ok(tests.count($$select * from public.forum_feed where title = 'Rendez-vous'$$) = 0, 'invitation : contenu invisible avant d''accepter');
select public.respond_group_invitation((select id from public.group_invitations where status = 'pending'), true);
select tests.ok(tests.count($$select * from public.forum_feed where title = 'Rendez-vous'$$) = 1, 'invitation acceptée : publications du groupe visibles');
select tests.ok(jsonb_array_length(public.group_detail((select id from public.community_groups where kind = 'private')) -> 'members') = 2, 'groupe privé : liste des membres visible par les membres');
select tests.throws($$select public.invite_to_group((select id from public.community_groups where kind = 'private'), 'lou_nuit')$$, 'groupe privé : seule la créatrice invite');
select tests.throws($$select public.pin_post((select id from public.forum_feed where title = 'Rendez-vous'), true)$$, 'épinglage : pas pour un simple membre');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S1';
update public.posts set pinned_at = now() where id = (select id from public.forum_feed where title = 'Nuits hachées');
select tests.ok((select pinned_at is null from public.forum_feed where title = 'Nuits hachées'), 'épinglage : impossible par une modification directe');
select public.pin_post((select id from public.forum_feed where title = 'Rendez-vous'), true);
select tests.ok((select pinned_at is not null from public.forum_feed where title = 'Rendez-vous'), 'épinglage : la créatrice épingle dans son groupe privé');
select tests.ok(tests.count($$select * from public.notifications where category = 'community_mention' and body like 'On se retrouve%'$$) = 0, 'mention : rien pour l''autrice');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MOD';
select public.pin_post((select id from public.forum_feed where title = 'Nuits hachées'), true);
select tests.ok((select pinned_at is not null from public.forum_feed where title = 'Nuits hachées'), 'épinglage : la modération épingle dans une catégorie');
reset role;
-- Fin de l'abonnement : le groupe reste lisible et utilisable par ses membres, les nouvelles invitations sont en pause
select tests.set_premium(:'S1', false);
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.throws($$select public.invite_to_group((select id from public.community_groups where kind = 'private'), 'lou_nuit')$$, 'fin d''abonnement : nouvelles invitations en pause');
select tests.ok(tests.count($$select * from public.forum_feed where title = 'Rendez-vous'$$) = 1, 'fin d''abonnement : le groupe et ses publications restent accessibles');
select tests.ok((public.group_detail((select id from public.community_groups where kind = 'private')) ->> 'can_invite') = 'false', 'fin d''abonnement : indiqué à la créatrice');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
insert into public.comments (post_id, body) select id, 'Oui, avec plaisir' from public.forum_feed where title = 'Rendez-vous';
select tests.ok(tests.count($$select * from public.comment_feed where body = 'Oui, avec plaisir'$$) = 1, 'fin d''abonnement : les membres continuent d''échanger');
select tests.ok((public.group_detail((select id from public.community_groups where kind = 'private')) ->> 'can_invite') is null, 'abonnement de la créatrice jamais exposé aux membres');
reset role;

-- ---------------------------------------------------------------- Profil Premium et badge
set role authenticated; set request.jwt.claim.sub = :'S3';
select tests.throws($$update public.community_profiles set accent = 'menthe' where user_id = auth.uid()$$, 'profil personnalisé : couleur réservée à Premium');
select tests.throws($$update public.community_profiles set show_premium_badge = true where user_id = auth.uid()$$, 'badge : réservé aux abonné·es');
reset role;
select tests.set_premium(:'S3', true);
set role authenticated; set request.jwt.claim.sub = :'S3';
update public.community_profiles set accent = 'menthe', banner = 'prairie', about = 'Maman de jumeaux, j''aime les balades.' where user_id = auth.uid();
select tests.ok(not (public.community_member('lou_nuit') ->> 'premium_badge')::boolean, 'badge : facultatif (masqué par défaut)');
update public.community_profiles set show_premium_badge = true where user_id = auth.uid();
select tests.ok((public.community_member('lou_nuit') ->> 'premium_badge')::boolean and (public.community_member('lou_nuit') ->> 'accent') = 'menthe', 'profil Premium : couleur, présentation et badge choisi');
select tests.throws($$update public.community_profiles set accent = 'violet' where user_id = auth.uid()$$, 'profil : couleur hors palette refusée');
reset role;
select tests.set_premium(:'S3', false);
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.ok(not (public.community_member('lou_nuit') ->> 'premium_badge')::boolean and (public.community_member('lou_nuit') ->> 'about') like 'Maman de jumeaux%',
  'fin d''abonnement : badge retiré, personnalisation conservée en lecture');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S3';
update public.community_profiles set accent = null, about = null where user_id = auth.uid();
select tests.ok((public.my_community_profile() ->> 'accent') is null, 'fin d''abonnement : la personnalisation peut toujours être retirée');
reset role;

-- ---------------------------------------------------------------- Dossiers d'enregistrements, albums, journal, recherche avancée
set role authenticated; set request.jwt.claim.sub = :'S2';
insert into public.saved_posts (post_id) select id from public.forum_feed where title = 'Nuits hachées';
select tests.throws($$insert into public.saved_folders (name) values ('Sommeil')$$, 'dossiers : réservés à Premium');
select tests.ok(tests.count($$select * from public.forum_feed where saved$$) = 1, 'enregistrer : toujours gratuit');
select tests.throws($$select * from public.search_posts_advanced('réveils', null, null, false, null, false, null, null, 20)$$, 'recherche avancée : Premium');
select tests.ok(tests.count($$select * from public.search_posts('hachées')$$) = 1, 'recherche simple : gratuite');
select tests.throws($$select public.my_community_activity()$$, 'journal d''activité : Premium');
select tests.throws($$insert into public.community_albums (title) values ('Premiers pas')$$, 'albums : création réservée à Premium');
reset role;
select tests.set_premium(:'S2', true);
set role authenticated; set request.jwt.claim.sub = :'S2';
insert into public.saved_folders (name) values ('Sommeil');
update public.saved_posts set folder_id = (select id from public.saved_folders limit 1);
select tests.ok((select saved_folder_id is not null from public.forum_feed where title = 'Nuits hachées'), 'dossiers : ranger une publication enregistrée');
select tests.ok(tests.count($$select * from public.search_posts_advanced(null, array[(select id from public.forums where slug = 'biberon')], 'poll', false, null, false, null, null, 20)$$) = 1,
  'recherche avancée : par catégorie et par type (sondage)');
select tests.ok(tests.count($$select * from public.search_posts_advanced(null, null, null, false, null, false, '@iris_soleil', null, 20)$$) = 2,
  'recherche avancée : par membre (jamais les publications anonymes)');
select tests.ok(jsonb_array_length(public.my_community_activity()) >= 3, 'journal d''activité : publications, réactions, enregistrements');
insert into public.community_albums (title) values ('Premiers pas');
insert into public.album_photos (album_id, path) select id, auth.uid()::text || '/album-1.jpg' from public.community_albums;
select tests.throws($$insert into public.album_photos (album_id, path) select id, '5ec1a100-0000-4000-8000-000000000001/album-x.jpg' from public.community_albums$$, 'albums : photos déposées par la propriétaire seulement');
select public.share_album((select id from public.community_albums), 'iris_soleil');
reset role;
reset role;
insert into storage.objects (bucket_id, name) values ('community', '5ec1a100-0000-4000-8000-000000000002/album-1.jpg');
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.ok(jsonb_array_length(public.my_albums()) = 1 and (public.my_albums() -> 0 ->> 'photo_count')::int = 1, 'albums : visible par la personne choisie');
select tests.ok(tests.count($$select * from storage.objects where name = '5ec1a100-0000-4000-8000-000000000002/album-1.jpg'$$) = 1, 'albums : photo lisible par la personne choisie');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S3';
select tests.ok(jsonb_array_length(public.my_albums()) = 0 and tests.count($$select * from public.community_albums$$) = 0, 'albums : invisibles pour les autres membres');
select tests.ok(tests.count($$select * from storage.objects where name = '5ec1a100-0000-4000-8000-000000000002/album-1.jpg'$$) = 0, 'albums : photo illisible pour les autres');
reset role;
select tests.set_premium(:'S2', false);
set role authenticated; set request.jwt.claim.sub = :'S2';
select tests.ok(jsonb_array_length(public.my_albums()) = 1 and tests.count($$select * from public.saved_folders$$) = 1, 'fin d''abonnement : albums et dossiers conservés en lecture');
select tests.throws($$insert into public.album_photos (album_id, path) select id, auth.uid()::text || '/album-2.jpg' from public.community_albums$$, 'fin d''abonnement : ajout de photos en pause');
update public.saved_posts set folder_id = null;
select tests.ok(tests.count($$select * from public.saved_posts where folder_id is null$$) = 1, 'fin d''abonnement : retirer d''un dossier reste possible');
reset role;

-- ---------------------------------------------------------------- Sujets consultés, ateliers, résumé quotidien
set role authenticated; set request.jwt.claim.sub = :'S2';
select public.note_topic_view((select id from public.forum_feed where title = 'Nuits hachées'));
select public.note_topic_view((select id from public.forum_feed where title = 'Nuits hachées'));
select tests.ok((select views from public.community_topic_views) = 2, 'sujets consultés : comptés pour « Pour vous »');
delete from public.community_topic_views;
select tests.ok(tests.count($$select * from public.community_topic_views$$) = 0, 'sujets consultés : effaçables');
insert into public.daily_digest_prefs (morning, morning_time, evening, hidden_items) values (true, '07:30', true, '{recipes}');
select tests.throws($$insert into public.daily_digest_prefs (user_id, morning) values ('5ec1a100-0000-4000-8000-000000000001', true)$$, 'résumé quotidien : réglages personnels uniquement');
select tests.throws($$update public.daily_digest_prefs set hidden_items = '{inconnu}'$$, 'résumé quotidien : rubriques connues');
reset role;
insert into public.community_events (title, kind, starts_at, premium_only, join_url) values ('Atelier sommeil des 6-12 mois', 'atelier', now() + interval '7 days', true, 'https://exemple.test/salle');
set role authenticated; set request.jwt.claim.sub = :'S2';
select tests.throws($$select join_url from public.community_events$$, 'ateliers : lien de connexion jamais lisible directement');
select tests.throws($$insert into public.event_registrations (event_id) select id from public.community_events$$, 'ateliers : inscription Premium');
reset role;
select tests.set_premium(:'S2', true);
set role authenticated; set request.jwt.claim.sub = :'S2';
insert into public.event_registrations (event_id) select id from public.community_events;
select tests.ok(public.event_join_link((select id from public.community_events)) = 'https://exemple.test/salle', 'ateliers : lien transmis aux inscrit·es');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.ok(public.event_join_link((select id from public.community_events)) is null, 'ateliers : pas de lien sans inscription');
reset role;

-- ---------------------------------------------------------------- Recherche de membres, blocage, export
set role authenticated; set request.jwt.claim.sub = :'S1';
select tests.ok(jsonb_array_length(public.search_members('noah')) = 1 and not ((public.search_members('noah') -> 0) ? 'bio'), 'recherche de membres : pseudonyme ou identifiant, sans données privées');
select public.block_member('noah_papa');
reset role;
set role authenticated; set request.jwt.claim.sub = :'S2';
select tests.ok(jsonb_array_length(public.my_follows()) = 0, 'blocage : les abonnements s''arrêtent');
select tests.ok(jsonb_array_length(public.my_albums()) = 1 and (public.my_albums() -> 0 -> 'shared_with') = '[]'::jsonb, 'blocage : le partage d''album s''arrête');
select tests.ok(jsonb_array_length(public.search_members('iris')) = 0, 'blocage : le membre n''apparaît plus dans la recherche');
select tests.ok(public.export_my_data() ? 'community_following' and public.export_my_data() ? 'community_groups' and public.export_my_data() ? 'community_albums'
  and public.export_my_data() ? 'daily_digest_prefs' and public.export_my_data() ? 'community_topic_views', 'export RGPD : abonnements, groupes, albums, réglages, sujets consultés');
reset role;

-- ---------------------------------------------------------------- Quota du résumé et de la traduction (fonction community-ai)
set role authenticated; set request.jwt.claim.sub = :'S3';
select tests.ok(not (select allowed from public.consume_feature_quota('community_ai_per_month')), 'résumé IA : aucun en version gratuite');
reset role;
select tests.set_premium(:'S3', true);
set role authenticated; set request.jwt.claim.sub = :'S3';
select tests.ok((select allowed from public.consume_feature_quota('community_ai_per_month')), 'résumé IA : quota Premium');
reset role;
