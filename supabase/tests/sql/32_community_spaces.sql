-- Communauté : espaces ouverts à toutes et tous, réponses en fil + notifications,
-- blocage, recherche plein texte, pseudonyme non identifiant.
\set INES 'a5a5a5a5-5555-4555-8555-555555555555'
\set HUGO 'a6a6a6a6-6666-4666-8666-666666666666'
\set LEA  'a7a7a7a7-7777-4777-8777-777777777777'

reset role;
insert into auth.users (id, email) values
 (:'INES', 'ines@exemple.test'), (:'HUGO', 'hugo.martin@exemple.test'), (:'LEA', 'lea@exemple.test');
update public.profiles set journeys = '{ttc}', display_name = 'Inès' where id = :'INES';
update public.profiles set journeys = '{child}', display_name = 'Hugo' where id = :'HUGO';
update public.profiles set journeys = '{pregnant}' where id = :'LEA';

-- ---------------------------------------------------------------- Espaces
set role authenticated; set request.jwt.claim.sub = :'INES';
select tests.ok(tests.count('select * from public.forums') = 15, 'espaces : les 15 espaces sont visibles par chaque membre');
select tests.ok((select string_agg(title, ' · ' order by position) from public.forums) =
  'Éviter une grossesse · Projet bébé · Fertilité · Grossesse · Jumeaux et triplés · Accouchement · Post-partum · Allaitement · Biberon · Sommeil · Diversification · Parents de bébés · Parents d’enfants · Familles nombreuses · Rencontres locales',
  'espaces : titres et ordre attendus');
select tests.ok((select bool_and(is_local = (slug = 'rencontres-locales')) from public.forums), 'espaces : seul « Rencontres locales » est un espace local');

-- Pseudonyme obligatoire, jamais le prénom
select tests.throws($$insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug='parents-bebes'), 'Sans pseudo', 'Message')$$,
  'pseudonyme : requis avant de publier');
select tests.throws($$insert into public.community_profiles (user_id, pseudonym) values ('a5a5a5a5-5555-4555-8555-555555555555', 'inès')$$,
  'pseudonyme : le prénom du profil est refusé');
insert into public.community_profiles (user_id, pseudonym) values (auth.uid(), 'Ines_en_projet');

-- Parcours « Projet bébé » mais publication dans « Parents de bébés » : autorisé
insert into public.posts (forum_id, title, body) values
 ((select id from public.forums where slug='parents-bebes'), 'Question d’une future maman', 'Comment avez-vous organisé la chambre de bébé ?');
select tests.ok(tests.count($$select * from public.forum_feed where title = 'Question d’une future maman' and status = 'visible'$$) = 1,
  'espaces : publication possible dans un espace hors de son parcours');
insert into public.posts (forum_id, title, body, area_label) values
 ((select id from public.forums where slug='rencontres-locales'), 'Balade poussette à Nantes', 'Qui serait partant pour une balade au Jardin des plantes ?', 'Nantes');
select tests.ok(tests.count($$select * from public.forum_feed where area_label = 'Nantes'$$) = 1, 'espaces : publication dans « Rencontres locales » avec zone générale');
reset role;

set role authenticated; set request.jwt.claim.sub = :'HUGO';
select tests.throws($$insert into public.community_profiles (user_id, pseudonym) values ('a6a6a6a6-6666-4666-8666-666666666666', 'hugo.martin')$$,
  'pseudonyme : l''identifiant de l''adresse e-mail est refusé');
insert into public.community_profiles (user_id, pseudonym) values (auth.uid(), 'PapaHugo');
select tests.ok(tests.count($$select * from public.forum_feed where title = 'Question d’une future maman'$$) = 1, 'espaces : un parent d''enfant voit la publication de l''espace « Parents de bébés »');
insert into public.comments (post_id, body)
  values ((select id from public.posts where title = 'Question d’une future maman'), 'Nous avons tout gardé simple : un lit, une commode.');
insert into public.posts (forum_id, title, body) values
 ((select id from public.forums where slug='sommeil'), 'Le post de Hugo', 'Rituel du coucher : bain, histoire, câlin.');
reset role;

-- ---------------------------------------------------------------- Réponses et notifications
set role authenticated; set request.jwt.claim.sub = :'INES';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_comment'$$) = 1, 'notification : commentaire sur ma publication');
insert into public.comments (post_id, parent_id, body)
  select post_id, id, 'Merci beaucoup !' from public.comments where body like 'Nous avons tout gardé%';
select tests.ok(tests.count($$select * from public.comment_feed where parent_id is not null and body = 'Merci beaucoup !'$$) = 1, 'réponses : réponse rattachée à un commentaire');
select tests.ok(tests.count($$select * from public.notifications where category = 'community_reply'$$) = 0, 'notification : aucune notification pour sa propre réponse');
select tests.throws($$insert into public.comments (post_id, parent_id, body)
  select (select id from public.posts where title = 'Balade poussette à Nantes'), id, 'Mauvais fil' from public.comments where body like 'Nous avons tout gardé%'$$,
  'réponses : le commentaire parent doit appartenir à la même publication');
reset role;

set role authenticated; set request.jwt.claim.sub = :'HUGO';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_reply'$$) = 1, 'notification : réponse à mon commentaire');
-- Réponse à une réponse : rattachée au commentaire racine (un seul niveau)
insert into public.comments (post_id, parent_id, body)
  select post_id, id, 'Avec plaisir.' from public.comments where body = 'Merci beaucoup !';
select tests.ok((select parent_id from public.comments where body = 'Avec plaisir.') = (select id from public.comments where body like 'Nous avons tout gardé%'),
  'réponses : un seul niveau d''imbrication (rattachement au commentaire racine)');
reset role;

set role authenticated; set request.jwt.claim.sub = :'INES';
select tests.ok(tests.count($$select * from public.notifications where category = 'community_reply'$$) = 1, 'notification : réponse dans le fil d''un commentaire que j''ai écrit');
select tests.ok((select comment_count from public.forum_feed where title = 'Question d’une future maman') = 3, 'réponses : comptées dans le nombre de commentaires');
reset role;

-- ---------------------------------------------------------------- Blocage
set role authenticated; set request.jwt.claim.sub = :'LEA';
insert into public.community_profiles (user_id, pseudonym) values (auth.uid(), 'Lea_attend');
select tests.ok(tests.count($$select * from public.comment_feed where pseudonym = 'PapaHugo'$$) = 2, 'blocage : commentaires visibles avant blocage');
insert into public.comments (post_id, body) values ((select id from public.posts where title = 'Le post de Hugo'), 'Pareil chez nous.');
select public.block_author((select id from public.posts where title = 'Le post de Hugo'));
select tests.ok(tests.count($$select * from public.forum_feed where pseudonym = 'PapaHugo'$$) = 0, 'blocage : publications de la personne bloquée masquées');
select tests.ok(tests.count($$select * from public.comment_feed where pseudonym = 'PapaHugo'$$) = 0, 'blocage : commentaires et réponses de la personne bloquée masqués');
select tests.ok(tests.count($$select * from public.search_posts('rituel coucher')$$) = 0, 'blocage : contenus bloqués absents de la recherche');
reset role;

select id as lea_comment, post_id as hugo_post from public.comments where body = 'Pareil chez nous.' \gset
set role authenticated; set request.jwt.claim.sub = :'HUGO';
select tests.ok(tests.count($$select * from public.comment_feed where body = 'Pareil chez nous.'$$) = 0, 'blocage : la personne bloquée ne voit plus les contenus de qui l''a bloquée');
select tests.throws(format($f$insert into public.comments (post_id, parent_id, body) values (%L, %L, 'Réponse impossible')$f$, :'hugo_post', :'lea_comment'),
  'blocage : impossible de répondre à une personne qui vous a bloqué');
reset role;

-- ---------------------------------------------------------------- Recherche plein texte
set role authenticated; set request.jwt.claim.sub = :'INES';
select tests.ok(tests.count($$select * from public.search_posts('réveil')$$) >= 1, 'recherche : plein texte en français (« réveil » trouve « Réveils »)');
select tests.ok(tests.count($$select * from public.search_posts('poussette', (select id from public.forums where slug='sommeil'))$$) = 0
  and tests.count($$select * from public.search_posts('poussette', (select id from public.forums where slug='rencontres-locales'))$$) = 1,
  'recherche : filtrage par espace');
-- Termes interdits : mise en relecture
insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug='allaitement'), 'Surplus', 'Je vends mon lait maternel congelé');
select tests.ok((select status from public.posts where title = 'Surplus') = 'pending_review', 'modération : terme sensible mis en relecture');
select tests.ok(tests.count($$select * from public.search_posts('lait maternel')$$) = 0, 'recherche : contenu en relecture non proposé');
reset role;
