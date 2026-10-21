-- =====================================================================
-- Communauté v2 : identifiants « @ », visibilité du profil, anonymat réel, photos et stockage,
-- modification de ses contenus, notifications par type, informations sensibles, blocage, export.
-- =====================================================================
\set C1 'c2c2c2c2-0000-4000-8000-000000000001'
\set C2 'c2c2c2c2-0000-4000-8000-000000000002'
\set C3 'c2c2c2c2-0000-4000-8000-000000000003'
\set C4 'c2c2c2c2-0000-4000-8000-000000000004'
reset role;
insert into auth.users (id, email) values (:'C1', 'v2-un@exemple.test'), (:'C2', 'v2-deux@exemple.test'), (:'C3', 'v2-trois@exemple.test'), (:'C4', 'v2-quatre@exemple.test');

-- ---------------------------------------------------------------- Profils et identifiants
set role authenticated; set request.jwt.claim.sub = :'C1';
insert into public.community_profiles (user_id, pseudonym, bio, visibility, journey_label, rules_accepted_at)
  values (auth.uid(), 'Maëlle Étoile', 'Maman de deux enfants, curieuse de tout.', 'members', 'enfant', now());
select tests.ok((select handle from public.community_profiles where user_id = auth.uid()) = 'maelle_etoile', 'identifiant : généré depuis le pseudonyme (sans accents, minuscules)');
update public.community_profiles set handle = '@Maelle_75' where user_id = auth.uid();
select tests.ok((select handle from public.community_profiles where user_id = auth.uid()) = 'maelle_75', 'identifiant : choisi, « @ » retiré, minuscules');
select tests.throws($$update public.community_profiles set handle = 'a b' where user_id = auth.uid()$$, 'identifiant : format refusé');
select tests.throws($$update public.community_profiles set handle = 'moderation' where user_id = auth.uid()$$, 'identifiant : nom réservé refusé');
select tests.throws($$update public.community_profiles set suspended_until = null, handle = 'maelle_75', bio = repeat('x', 400) where user_id = auth.uid()$$, 'présentation : 280 caractères au plus');
select tests.throws($$update public.community_profiles set avatar_path = 'c2c2c2c2-0000-4000-8000-000000000002/avatar.jpg' where user_id = auth.uid()$$, 'avatar : uniquement un fichier déposé par soi-même');
update public.community_profiles set avatar_path = auth.uid()::text || '/avatar-1.jpg' where user_id = auth.uid();
select tests.ok((select (public.my_community_profile() ->> 'bio')) = 'Maman de deux enfants, curieuse de tout.', 'mon profil : présentation lisible par sa propriétaire');
reset role;

set role authenticated; set request.jwt.claim.sub = :'C2';
insert into public.community_profiles (user_id, pseudonym, bio, visibility) values (auth.uid(), 'Papa Lune', 'Je préfère rester discret.', 'minimal');
select tests.throws($$update public.community_profiles set handle = 'maelle_75' where user_id = auth.uid()$$, 'identifiant : unique');
select tests.throws($$select bio from public.community_profiles$$, 'confidentialité : la présentation n''est pas lisible directement');
select tests.ok(tests.count($$select pseudonym, handle, avatar_path from public.community_profiles$$) >= 2, 'profils : pseudonyme, identifiant et avatar lisibles');
select tests.ok((public.community_member('@maelle_75') ->> 'bio') = 'Maman de deux enfants, curieuse de tout.'
  and (public.community_member('maelle_75') ->> 'journey_label') = 'enfant' and (public.community_member('maelle_75') ->> 'joined_month') is not null,
  'profil d''un membre : informations rendues publiques visibles');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.ok((public.community_member('papa_lune') ->> 'bio') is null and (public.community_member('papa_lune') ->> 'posts_count') is null
  and (public.community_member('papa_lune') ->> 'pseudonym') = 'Papa Lune', 'profil minimal : ni présentation ni statistiques pour les autres');
reset role;

-- ---------------------------------------------------------------- Publications : sans titre, témoignage, anonymat réel
set role authenticated; set request.jwt.claim.sub = :'C2';
insert into public.posts (forum_id, body, kind, anonymous) values
  ((select id from public.forums where slug = 'post-partum'), 'Je me sens très seule depuis la naissance, est-ce que ça vous est arrivé ?', 'testimony', true);
insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug = 'sommeil'), 'Siestes courtes', 'Notre fils fait des siestes de 30 minutes, vous aussi ?');
select tests.ok((select is_mine and pseudonym is null and author_handle is null from public.forum_feed where kind = 'testimony'), 'anonymat : ma publication anonyme sans pseudonyme affiché');
reset role;

set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.ok((select pseudonym is null and author_handle is null and avatar_path is null and not is_mine from public.forum_feed where kind = 'testimony'),
  'anonymat : les autres ne voient ni pseudonyme ni identifiant');
select tests.throws($$select author_id from public.posts$$, 'anonymat : l''auteur réel est illisible (droits par colonne)');
select tests.throws($$select count(*) from public.posts where author_id = 'c2c2c2c2-0000-4000-8000-000000000002'$$, 'anonymat : impossible de filtrer par auteur');
select tests.ok((select title is null from public.forum_feed where kind = 'testimony'), 'publication : titre facultatif');
insert into public.comments (post_id, body) select id, 'Oui, parlez-en à votre sage-femme, ça m''a aidée.' from public.forum_feed where kind = 'testimony';
reset role;

set role authenticated; set request.jwt.claim.sub = :'C2';
insert into public.comments (post_id, parent_id, body)
  select post_id, id, 'Merci beaucoup, ça me rassure.' from public.comment_feed where body like 'Oui, parlez-en%';
reset role;
set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.ok((select anonymous and pseudonym is null and is_op from public.comment_feed where body = 'Merci beaucoup, ça me rassure.'),
  'anonymat : la réponse de l''autrice anonyme reste anonyme');
select tests.ok((select title from public.notifications where category = 'community_reply' order by created_at desc limit 1) = 'L’auteur·rice de la publication a répondu à votre commentaire',
  'anonymat : la notification ne révèle pas l''identité');
select tests.ok((select deep_link from public.notifications where category = 'community_reply' order by created_at desc limit 1) like '/community/post/%?comment=%',
  'notification : ouvre directement le commentaire');
reset role;

-- ---------------------------------------------------------------- Modifier ses contenus
set role authenticated; set request.jwt.claim.sub = :'C2';
update public.posts set body = 'Notre fils fait des siestes de 30 minutes seulement, vous aussi ?' where title = 'Siestes courtes';
select tests.ok((select edited_at is not null and status = 'visible' from public.forum_feed where title = 'Siestes courtes'), 'modification : texte modifié, date de modification');
update public.posts set anonymous = true where title = 'Siestes courtes';
select tests.ok((select not anonymous from public.forum_feed where title = 'Siestes courtes'), 'modification : l''anonymat ne change pas après publication');
update public.posts set body = 'Écrivez-moi au 06 11 22 33 44' where title = 'Siestes courtes';
select tests.ok((select status from public.forum_feed where title = 'Siestes courtes') = 'pending_review', 'modification : numéro ajouté → relecture');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C1';
update public.posts set body = 'Piratage' where title = 'Siestes courtes';
select tests.ok(tests.count($$select * from public.forum_feed where body = 'Piratage'$$) = 0, 'modification : impossible de modifier la publication d''un autre membre');
update public.comments set body = 'Oui, parlez-en à votre sage-femme ou à la PMI.' where body like 'Oui, parlez-en%';
select tests.ok((select edited_at is not null from public.comment_feed where body = 'Oui, parlez-en à votre sage-femme ou à la PMI.'), 'modification : commentaire modifié');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C2';
update public.comments set body = 'Changé par un autre' where body like 'Oui, parlez-en%';
select tests.ok(tests.count($$select * from public.comment_feed where body = 'Changé par un autre'$$) = 0, 'modification : impossible de modifier le commentaire d''un autre membre');
reset role;

-- ---------------------------------------------------------------- Informations sensibles et spam
set role authenticated; set request.jwt.claim.sub = :'C1';
insert into public.posts (forum_id, body) values ((select id from public.forums where slug = 'questions-generales'), 'On habite au 12 rue des Lilas, passez nous voir');
select tests.ok((select status from public.forum_feed where body like 'On habite%') = 'pending_review', 'sensible : adresse → relecture');
insert into public.posts (forum_id, body) values ((select id from public.forums where slug = 'nouveau-ne'), 'Ma fille est née le 03/04/2026 à la maternité');
select tests.ok((select status from public.forum_feed where body like 'Ma fille est née%') = 'pending_review', 'sensible : date de naissance complète → relecture');
insert into public.posts (forum_id, body) values ((select id from public.forums where slug = 'questions-generales'), 'Rendez-vous ici 48.85661, 2.35222');
select tests.ok((select status from public.forum_feed where body like 'Rendez-vous ici%') = 'pending_review', 'sensible : coordonnées GPS → relecture');
insert into public.posts (forum_id, body) values ((select id from public.forums where slug = 'sommeil'), 'Une question sur les réveils nocturnes de bébé');
select tests.throws($$insert into public.posts (forum_id, body) values ((select id from public.forums where slug = 'sommeil'), 'Une question sur les réveils nocturnes de bébé')$$, 'spam : doublon refusé');
reset role;

-- ---------------------------------------------------------------- Photos et stockage
set role authenticated; set request.jwt.claim.sub = :'C1';
insert into public.post_photos (post_id, path, width, height, position)
  select id, auth.uid()::text || '/p' || g || '.jpg', 1200, 900, g - 1 from public.forum_feed, generate_series(1, 4) g where body like 'Une question sur les réveils%';
select tests.ok((select jsonb_array_length(photos) from public.forum_feed where body like 'Une question sur les réveils%') = 4, 'photos : jusqu''à 4 par publication, dans le fil');
select tests.throws($$insert into public.post_photos (post_id, path) select id, auth.uid()::text || '/p5.jpg' from public.forum_feed where body like 'Une question sur les réveils%'$$, 'photos : 5e photo refusée');
reset role;
select id as other_post from public.posts where body like 'Je me sens très seule%' \gset
set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.throws(format($f$insert into public.post_photos (post_id, path) values (%L, auth.uid()::text || '/x.jpg')$f$, :'other_post'), 'photos : impossible d''ajouter une photo à la publication d''un autre');
select tests.throws($$select author_id from public.post_photos$$, 'photos : auteur illisible');
insert into storage.objects (bucket_id, name) values ('community', 'c2c2c2c2-0000-4000-8000-000000000001/p1.jpg');
select tests.throws($$insert into storage.objects (bucket_id, name) values ('community', 'c2c2c2c2-0000-4000-8000-000000000002/intrus.jpg')$$, 'stockage : dépôt uniquement dans son propre dossier');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C2';
select tests.ok(tests.count($$select * from storage.objects where bucket_id = 'community' and name like '%/p1.jpg'$$) = 1, 'stockage : photo d''une publication visible lisible par les membres');
select tests.ok(tests.count($$select * from storage.objects where bucket_id = 'community' and name like '%/p1.jpg'$$) = 1
  and tests.count($$select * from public.forum_feed where body like 'On habite%'$$) = 0, 'confidentialité : contenu en relecture invisible pour les autres');
delete from storage.objects where bucket_id = 'community' and name like '%/p1.jpg';
select tests.ok(tests.count($$select * from storage.objects where bucket_id = 'community' and name like '%/p1.jpg'$$) = 1, 'stockage : impossible de supprimer la photo d''une autre personne');
reset role;
set role anon; set request.jwt.claim.sub = '';
select tests.throws($$select * from public.forum_feed$$, 'confidentialité : aucun accès sans connexion');
reset role;

-- ---------------------------------------------------------------- Réactions, enregistrées, préférences de notification
set role authenticated; set request.jwt.claim.sub = :'C2';
insert into public.post_likes (post_id) select id from public.forum_feed where body like 'Une question sur les réveils%';
delete from public.post_likes where user_id = auth.uid();
insert into public.post_likes (post_id) select id from public.forum_feed where body like 'Une question sur les réveils%';
insert into public.saved_posts (post_id) select id from public.forum_feed where body like 'Une question sur les réveils%';
reset role;
set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_like'$$) = 1, 'réaction : une seule notification (pas de rafale)');
insert into public.community_notification_prefs (user_id, post_comment) values (auth.uid(), false);
reset role;
set role authenticated; set request.jwt.claim.sub = :'C3';
insert into public.community_profiles (user_id, pseudonym) values (auth.uid(), 'Troisième voix');
insert into public.comments (post_id, body) select id, 'Chez nous ça s''est arrangé vers 8 mois.' from public.forum_feed where body like 'Une question sur les réveils%';
reset role;
set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_comment' and body like 'Chez nous%'$$) = 0, 'préférences : notification « commentaire » désactivée');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C2';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_saved'$$) = 1, 'enregistrées : nouvelle réponse notifiée');
reset role;

-- ---------------------------------------------------------------- Modération : l'autrice est informée
set role authenticated; set request.jwt.claim.sub = :'C2';
insert into public.reports (post_id, reason) select id, 'spam' from public.forum_feed where body like 'Une question sur les réveils%';
reset role;
set role authenticated; set request.jwt.claim.sub = :'C3';
insert into public.reports (post_id, reason) select id, 'spam' from public.forum_feed where body like 'Une question sur les réveils%';
reset role;
set role authenticated; set request.jwt.claim.sub = :'C4';
insert into public.community_profiles (user_id, pseudonym) values (auth.uid(), 'Quatrième voix');
insert into public.reports (post_id, reason) select id, 'spam' from public.forum_feed where body like 'Une question sur les réveils%';
select tests.throws($$select public.moderation_queue()$$, 'modération : file réservée aux modérateurs');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_moderation'$$) = 1, 'modération : l''autrice est informée du masquage');
select tests.ok((select status from public.forum_feed where body like 'Une question sur les réveils%') = 'hidden', 'modération : la publication reste visible pour son autrice (masquée)');
reset role;

-- ---------------------------------------------------------------- Blocage par profil, mes chiffres, export, suppression
set role authenticated; set request.jwt.claim.sub = :'C1';
select public.block_member('@papa_lune');
select tests.ok((public.community_member('papa_lune') ->> 'blocked')::boolean, 'blocage : depuis le profil d''un membre');
select tests.ok(tests.count($$select * from public.forum_feed where title = 'Siestes courtes'$$) = 0, 'blocage : ses publications disparaissent du fil');
select tests.ok((public.my_community_profile() ->> 'posts_count')::int = 4 and (public.my_community_profile() ->> 'photos_count')::int = 4 and (public.my_community_profile() ->> 'comments_count')::int = 1,
  'mon profil : nombre de publications, de photos et de commentaires');
select tests.ok(public.export_my_data() ? 'community_profile' and jsonb_array_length(public.export_my_data() -> 'community_photos') = 4 and jsonb_array_length(public.export_my_data() -> 'community_blocks') = 1,
  'export RGPD : profil, photos et blocages inclus');
delete from public.posts where body like 'Ma fille est née%';
select tests.ok(tests.count($$select * from public.forum_feed where body like 'Ma fille est née%'$$) = 0, 'suppression : publication supprimée définitivement');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C2';
select tests.ok((public.community_member('maelle_75') ->> 'unavailable')::boolean and (public.community_member('maelle_75') ->> 'bio') is null, 'blocage : la personne bloquée ne voit plus le profil');
reset role;

-- ---------------------------------------------------------------- Signaler un membre
set role authenticated; set request.jwt.claim.sub = :'C3';
select public.report_member('@maelle_75', 'harassment', 'Messages insistants');
select tests.throws($$select public.report_member('maelle_75', 'harassment')$$, 'signalement d''un membre : une seule fois tant qu''il est ouvert');
select tests.throws($$select public.report_member('troisieme_voix', 'spam')$$, 'signalement d''un membre : impossible de se signaler soi-même');
select tests.ok(tests.count($$select * from public.reports where reported_user is not null$$) = 1, 'signalement d''un membre : enregistré pour la modération');
reset role;
set role authenticated; set request.jwt.claim.sub = :'C1';
select tests.ok(tests.count($$select * from public.reports where reported_user is not null$$) = 0, 'signalement d''un membre : invisible pour la personne signalée');
reset role;
