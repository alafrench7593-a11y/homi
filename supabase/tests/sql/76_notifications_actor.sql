-- A-06 (campagne QA du 02/11/2026) : la suppression d'un compte efface les notifications qu'il a
-- provoquées chez les autres (pseudonyme, extraits) ; un commentaire supprimé emporte ses notifications.
\set NA 'f6a00000-0000-4000-8000-000000000001'
\set NB 'f6a00000-0000-4000-8000-000000000002'
\set NP 'f6a00000-0000-4000-8000-0000000000a1'
reset role;
insert into auth.users (id, email) values (:'NA', 'notif-a@exemple.test'), (:'NB', 'notif-b@exemple.test');

set role authenticated; set request.jwt.claim.sub = :'NB';
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Paul_QA', 'Lyon');
insert into public.posts (id, forum_id, title, body) values (:'NP', (select id from public.forums where slug = 'grossesse'), 'Question', 'Ma question');

set request.jwt.claim.sub = :'NA';
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Ines_QA', 'Lille');
insert into public.comments (post_id, body) values (:'NP', 'Commentaire d''Ines');
insert into public.comments (post_id, body) values (:'NP', 'Deuxième commentaire');

reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'NB' and payload ->> 'actor' = :'NA') >= 2,
  'notifications : l''actrice est retenue');
delete from public.comments where body = 'Deuxième commentaire';
select tests.ok((select count(*) from public.notifications where user_id = :'NB' and body like 'Deuxième%') = 0,
  'notifications : un commentaire supprimé emporte ses notifications');

set role service_role;
select public.delete_user_account(:'NA');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'NB' and (title like '%Ines_QA%' or body like '%Ines%')) = 0,
  'suppression de compte : plus aucune notification ne montre le pseudonyme ni le texte de la personne supprimée');
select tests.ok((select count(*) from public.posts where id = :'NP') = 1, 'suppression de compte : la publication de l''autre personne reste');
