-- Audit du 29/10/2026 : l'anonymat d'une publication ne peut plus être levé (ni par la fonction
-- d'étiquette, ni par le chemin des photos), et le blocage entre deux autres membres reste secret.
\set AV 'e5a00000-0000-4000-8000-000000000001'
\set AE 'e5a00000-0000-4000-8000-000000000002'
\set AW 'e5a00000-0000-4000-8000-000000000003'
\set AX 'e5a00000-0000-4000-8000-000000000004'
reset role;
insert into auth.users (id, email) values (:'AV', 'audit-v@exemple.test'), (:'AE', 'audit-e@exemple.test'), (:'AW', 'audit-w@exemple.test'), (:'AX', 'audit-x@exemple.test');
insert into public.user_blocks (blocker_id, blocked_id) values (:'AW', :'AX');

set role authenticated; set request.jwt.claim.sub = :'AV';
insert into public.community_profiles (user_id, pseudonym, visibility) values (auth.uid(), 'Autrice Audit', 'minimal');
insert into public.posts (forum_id, body, kind, anonymous) values ((select id from public.forums where slug = 'post-partum'), 'Audit : témoignage anonyme', 'testimony', true);
insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug = 'sommeil'), 'Audit public', 'Audit : publication signée avec photo');
insert into public.post_photos (post_id, path) select id, auth.uid()::text || '/audit-public.jpg' from public.forum_feed where body = 'Audit : publication signée avec photo';
select tests.throws($$insert into public.post_photos (post_id, path) select id, auth.uid()::text || '/audit-anonyme.jpg' from public.forum_feed where body = 'Audit : témoignage anonyme'$$, 'anonymat : photo refusée dans une publication anonyme');
reset role;
-- photo ancienne (avant correctif) sur une publication anonyme
set session_replication_role = replica; -- simule une photo déposée avant le correctif (déclencheur ignoré)
insert into public.post_photos (post_id, author_id, path) select id, :'AV', :'AV' || '/ancienne-anonyme.jpg' from public.posts where body = 'Audit : témoignage anonyme';
set session_replication_role = origin;
insert into storage.objects (bucket_id, name, owner) values ('community', :'AV' || '/ancienne-anonyme.jpg', :'AV');

set role authenticated; set request.jwt.claim.sub = :'AE';
insert into public.community_profiles (user_id, pseudonym, visibility) values (auth.uid(), 'Curieuse Audit', 'minimal');
select tests.throws(format($q$select public.community_actor_label(%L, (select id from public.forum_feed where body = 'Audit : témoignage anonyme'))$q$, :'AV'), 'anonymat : la fonction d''étiquette n''est plus appelable par les membres');
select tests.ok((select photos = '[]'::jsonb from public.forum_feed where body = 'Audit : témoignage anonyme'), 'anonymat : aucune photo (ni chemin) d''une publication anonyme dans le fil');
select tests.ok(tests.count($$select id from public.post_photos where post_id in (select id from public.posts where anonymous)$$) = 0, 'anonymat : photo d''une publication anonyme illisible dans la table');
select tests.ok(tests.count($$select * from storage.objects where bucket_id = 'community' and name like '%ancienne-anonyme%'$$) = 0, 'anonymat : fichier d''une photo anonyme illisible');
select tests.ok((select jsonb_array_length(photos) = 1 from public.forum_feed where body = 'Audit : publication signée avec photo'), 'photos d''une publication signée : toujours visibles');
select tests.ok(not public.is_blocked_between(:'AW', :'AX'), 'blocage : invisible pour une personne extérieure');
reset role;
set role authenticated; set request.jwt.claim.sub = :'AW';
select tests.ok(public.is_blocked_between(:'AW', :'AX'), 'blocage : connu de la personne concernée');
reset role;
set role authenticated; set request.jwt.claim.sub = :'AV';
select tests.ok((select jsonb_array_length(photos) = 1 from public.forum_feed where body = 'Audit : témoignage anonyme'), 'anonymat : l''autrice voit encore sa propre photo');
reset role; set request.jwt.claim.sub = '';
select tests.ok(public.is_blocked_between(:'AW', :'AX'), 'blocage : le serveur garde la réponse réelle');
select tests.ok(not has_table_privilege('authenticated', 'public.children', 'TRUNCATE') and not has_table_privilege('anon', 'public.posts', 'TRUNCATE'), 'droits : TRUNCATE retiré aux rôles de l''application');
