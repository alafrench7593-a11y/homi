-- Campagne QA du 02/11/2026 (communauté) : anonymat protégé, pas d'auto-signalement, notifications
-- supprimées avec la publication, publications vides refusées.
\set CA 'f2a00000-0000-4000-8000-000000000001'
\set CB 'f2a00000-0000-4000-8000-000000000002'
reset role;
insert into auth.users (id, email) values (:'CA', 'cqa-a@exemple.test'), (:'CB', 'cqa-b@exemple.test');

set role authenticated; set request.jwt.claim.sub = :'CA';
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Cqa_A', 'Lyon');
insert into public.posts (id, forum_id, title, body, anonymous) values
  ('f2a00000-0000-4000-8000-0000000000a1', (select id from public.forums where slug = 'grossesse'), 'Anonyme', 'Message anonyme', true),
  ('f2a00000-0000-4000-8000-0000000000a2', (select id from public.forums where slug = 'grossesse'), 'Signé', 'Message signé', false);
select tests.throws($$insert into public.reports (reporter_id, post_id, reason) values (auth.uid(), 'f2a00000-0000-4000-8000-0000000000a2', 'spam')$$,
  'communauté : on ne peut pas signaler sa propre publication');
select tests.throws($$insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug = 'grossesse'), 'Vide', '     ')$$,
  'communauté : publication faite d''espaces refusée');

set request.jwt.claim.sub = :'CB';
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Cqa_B', 'Lille');
select tests.throws($$select public.block_author('f2a00000-0000-4000-8000-0000000000a1', null)$$,
  'communauté : bloquer l''autrice d''une publication anonyme est refusé (identité protégée)');
select tests.ok((select count(*) from public.user_blocks where blocker_id = auth.uid()) = 0, 'communauté : aucun blocage enregistré sur un contenu anonyme');
insert into public.post_likes (post_id, user_id) values ('f2a00000-0000-4000-8000-0000000000a2', auth.uid());

reset role;
select tests.ok((select count(*) from public.notifications where payload ->> 'post_id' = 'f2a00000-0000-4000-8000-0000000000a2') >= 1,
  'communauté : la réaction crée une notification');
delete from public.posts where id = 'f2a00000-0000-4000-8000-0000000000a2';
select tests.ok((select count(*) from public.notifications where payload ->> 'post_id' = 'f2a00000-0000-4000-8000-0000000000a2') = 0,
  'communauté : notifications supprimées avec la publication');
