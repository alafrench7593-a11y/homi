-- B-14 (campagne QA du 02/11/2026) : sondage à un seul choix ou déjà clos refusé par le serveur.
\set PA 'f9a00000-0000-4000-8000-000000000001'
\set PP 'f9a00000-0000-4000-8000-0000000000a1'
\set PQ 'f9a00000-0000-4000-8000-0000000000a2'
reset role;
insert into auth.users (id, email) values (:'PA', 'poll-a@exemple.test');
set role authenticated; set request.jwt.claim.sub = :'PA';
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Poll_A', 'Lyon');
insert into public.posts (id, forum_id, title, body) values
  (:'PP', (select id from public.forums where slug = 'grossesse'), 'Sondage', 'Un seul choix'),
  (:'PQ', (select id from public.forums where slug = 'grossesse'), 'Sondage 2', 'Déjà clos');
insert into public.post_polls (post_id) values (:'PP');
insert into public.poll_options (post_id, label, position) values (:'PP', 'Oui', 0);
select tests.throws($$select public.vote_poll('f9a00000-0000-4000-8000-0000000000a1', array[(select id from public.poll_options where post_id = 'f9a00000-0000-4000-8000-0000000000a1')])$$,
  'sondage : vote refusé quand il n''y a qu''un seul choix');
insert into public.poll_options (post_id, label, position) values (:'PP', 'Non', 1);
select public.vote_poll(:'PP', array[(select id from public.poll_options where post_id = :'PP' and position = 0)]);
select tests.ok(true, 'sondage : vote accepté avec deux choix');
select tests.throws($$insert into public.post_polls (post_id, closes_at) values ('f9a00000-0000-4000-8000-0000000000a2', now() - interval '1 hour')$$,
  'sondage : déjà clos à la création refusé');
reset role;
