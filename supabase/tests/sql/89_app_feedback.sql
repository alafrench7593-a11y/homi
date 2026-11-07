-- « Donner mon avis » : chacune voit les siens, l'équipe lit tout et ne change que le statut.
\set FA 'd0890000-0000-4000-8000-000000000001'
\set FB 'd0890000-0000-4000-8000-000000000002'
\set FM 'd0890000-0000-4000-8000-000000000003'
reset role;
insert into auth.users (id, email) values (:'FA', 'avis-a@exemple.test'), (:'FB', 'avis-b@exemple.test'), (:'FM', 'avis-mod@exemple.test');
insert into public.user_roles (user_id, role) values (:'FM', 'moderator');

set role authenticated; set request.jwt.claim.sub = :'FA';
insert into public.app_feedback (kind, body, screen, platform) values ('bug', 'Le bouton biberon ne répond pas', '/track', 'ios');
select tests.ok((select count(*) from public.app_feedback) = 1, 'avis : envoyé et visible par son autrice');
select tests.throws($$insert into public.app_feedback (kind, body) values ('pirate', 'xxxx')$$, 'avis : type borné');
select tests.throws($$insert into public.app_feedback (kind, body) values ('idea', '  ')$$, 'avis : texte obligatoire');
select tests.throws($$insert into public.app_feedback (kind, body, status) values ('idea', 'Ajouter X', 'done')$$, 'avis : impossible de choisir soi-même le statut');
select tests.throws(format('insert into public.app_feedback (user_id, kind, body) values (%L, %L, %L)', :'FB', 'idea', 'au nom de B'), 'avis : impossible d''écrire au nom de quelqu''un');
update public.app_feedback set status = 'done';
select tests.ok((select status from public.app_feedback limit 1) = 'new', 'avis : l''autrice ne peut pas changer le statut');
select tests.ok(jsonb_array_length(public.export_my_data()->'app_feedback') = 1 and public.export_my_data() ? 'my_treatments', 'avis : export RGPD complet');

set request.jwt.claim.sub = :'FB';
select tests.ok((select count(*) from public.app_feedback) = 0, 'avis : invisibles pour les autres membres');

set request.jwt.claim.sub = :'FM';
select tests.ok((select count(*) from public.app_feedback where user_id = :'FA') = 1, 'avis : l''équipe les lit');
update public.app_feedback set status = 'planned' where user_id = :'FA';
select tests.ok((select status from public.app_feedback where user_id = :'FA') = 'planned', 'avis : l''équipe change le statut');
select tests.throws(format('update public.app_feedback set body = %L where user_id = %L', 'réécrit', :'FA'), 'avis : l''équipe ne peut pas réécrire un avis');

set request.jwt.claim.sub = :'FA';
select tests.ok((select status from public.app_feedback limit 1) = 'planned', 'avis : l''autrice voit le suivi');
reset role;
insert into public.app_feedback (user_id, kind, body) select :'FA', 'idea', 'idée ' || g from generate_series(1, 19) g;
select tests.throws(format('insert into public.app_feedback (user_id, kind, body) values (%L, %L, %L)', :'FA', 'idea', 'une de trop'), 'avis : 20 par jour au plus');
set role authenticated; set request.jwt.claim.sub = :'FA';
delete from public.app_feedback;
reset role;
select tests.ok((select count(*) from public.app_feedback where user_id = :'FA') = 0, 'avis : l''autrice peut supprimer les siens');
