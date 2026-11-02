-- Campagne QA, lot E (20261104001000_feed_performance, 20261104001100_articles_list) :
-- fils de la communauté réécrits pour la performance → mêmes lignes visibles pour chaque personne ;
-- community_feed / member_posts / member_comments = vues filtrées et triées ; liste d'articles légère.
\set FA 'f5a00000-0000-4000-8000-000000000001'
\set FB 'f5a00000-0000-4000-8000-000000000002'
\set FC 'f5a00000-0000-4000-8000-000000000003'
\set FD 'f5a00000-0000-4000-8000-000000000004'
\set FE 'f5a00000-0000-4000-8000-000000000005'
\set FM 'f5a00000-0000-4000-8000-000000000006'
\set FX 'f5a00000-0000-4000-8000-000000000007'
\set GP 'f5a00000-0000-4000-8000-0000000000f1'
\set GA 'f5a00000-0000-4000-8000-0000000000f2'
reset role;
-- FA autrice (publique, anonyme, masquée) ; FB bloque FC ; FX bloque FB ; FD membre du groupe privé ; FE non membre ; FM modératrice
insert into auth.users (id, email) values (:'FA', 'fp-a@exemple.test'), (:'FB', 'fp-b@exemple.test'), (:'FC', 'fp-c@exemple.test'),
  (:'FD', 'fp-d@exemple.test'), (:'FE', 'fp-e@exemple.test'), (:'FM', 'fp-m@exemple.test'), (:'FX', 'fp-x@exemple.test');
insert into public.community_profiles (user_id, pseudonym, handle, rules_accepted_at) values
  (:'FA', 'Fp Autrice', 'fp_autrice', now()), (:'FB', 'Fp Bloqueuse', 'fp_bloqueuse', now()), (:'FC', 'Fp Bloquee', 'fp_bloquee', now()),
  (:'FD', 'Fp Membre', 'fp_membre', now()), (:'FE', 'Fp Externe', 'fp_externe', now()), (:'FM', 'Fp Moderation', 'fp_moderation', now()),
  (:'FX', 'Fp Bloque B', 'fp_bloque_b', now());
insert into public.user_roles (user_id, role) values (:'FM', 'moderator');
insert into public.user_blocks (blocker_id, blocked_id) values (:'FB', :'FC'), (:'FX', :'FB');
insert into public.community_groups (id, slug, name, kind, owner_id) values (:'GP', 'fp-prive', 'Fp groupe privé', 'private', :'FD');
insert into public.community_groups (id, slug, name, kind, archived) values (:'GA', 'fp-archive', 'Fp thème archivé', 'theme', true);
insert into public.group_members (group_id, user_id, role) values (:'GP', :'FD', 'owner'), (:'GA', :'FE', 'member');

-- Données posées directement (déclencheurs de garde et de notification contournés : seul l'affichage est testé).
-- Les publications de FC sont les plus récentes : pour FB (qui la bloque) le fil doit passer plusieurs lots.
set session_replication_role = replica;
insert into public.posts (id, forum_id, author_id, title, body, anonymous, status, group_id, created_at)
select ('f5a00000-0000-4000-8000-0000000001' || lpad(n::text, 2, '0'))::uuid, (select id from public.forums where slug = 'grossesse'),
       a::uuid, 'Fp ' || n, 'Publication de test ' || n, anon, st, g::uuid, now() + (n || ' minutes')::interval
from (values (1, :'FA', false, 'visible', null), (2, :'FA', true, 'visible', null), (3, :'FA', false, 'hidden', null),
             (4, :'FD', false, 'visible', :'GP'), (5, :'FE', false, 'visible', :'GA'), (6, :'FB', false, 'visible', null),
             (7, :'FX', false, 'visible', null), (8, :'FA', false, 'pending_review', null), (9, :'FE', false, 'visible', null),
             (10, :'FC', false, 'visible', null), (11, :'FC', false, 'visible', null), (12, :'FC', false, 'visible', null),
             (13, :'FC', true, 'visible', null), (14, :'FC', false, 'visible', null)) v(n, a, anon, st, g);
insert into public.comments (id, post_id, author_id, body, status, created_at)
select ('f5a00000-0000-4000-8000-0000000002' || lpad(n::text, 2, '0'))::uuid, ('f5a00000-0000-4000-8000-0000000001' || lpad(p::text, 2, '0'))::uuid,
       a::uuid, 'Commentaire de test ' || n, st, now() + (n || ' minutes')::interval
from (values (1, 1, :'FC', 'visible'), (2, 1, :'FE', 'visible'), (3, 2, :'FA', 'visible'), (4, 2, :'FB', 'visible'),
             (5, 4, :'FD', 'visible'), (6, 1, :'FB', 'hidden'), (7, 9, :'FA', 'visible'), (8, 10, :'FE', 'visible'),
             (9, 6, :'FA', 'visible'), (10, 7, :'FA', 'visible'), (11, 3, :'FE', 'visible')) v(n, p, a, st);
set session_replication_role = origin;
insert into public.saved_posts (post_id, user_id) values ('f5a00000-0000-4000-8000-000000000101', :'FB'), ('f5a00000-0000-4000-8000-000000000110', :'FB');
insert into public.post_likes (post_id, user_id) values ('f5a00000-0000-4000-8000-000000000101', :'FE');

-- 1. Mêmes lignes visibles qu'avec les anciennes règles (fonctions is_blocked_between, can_see_group, has_role),
--    pour chaque personne : publications et commentaires, toutes colonnes de visibilité
do $$
declare
  v uuid; v_ref text; v_got text; v_name text;
begin
  for v, v_name in select * from (values
      ('f5a00000-0000-4000-8000-000000000001'::uuid, 'autrice'), ('f5a00000-0000-4000-8000-000000000002', 'bloqueuse'),
      ('f5a00000-0000-4000-8000-000000000003', 'bloquée'), ('f5a00000-0000-4000-8000-000000000004', 'membre du groupe privé'),
      ('f5a00000-0000-4000-8000-000000000005', 'non membre'), ('f5a00000-0000-4000-8000-000000000006', 'modératrice'),
      ('f5a00000-0000-4000-8000-000000000007', 'bloque la bloqueuse')) x(u, n)
  loop
    perform set_config('request.jwt.claim.sub', v::text, true);
    select string_agg(p.id::text, ',' order by p.id) into v_ref from public.posts p
    where (p.group_id is null or public.can_see_group(p.group_id) or p.author_id = auth.uid())
      and ((p.status = 'visible' and not public.is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or public.has_role('moderator'));
    select string_agg(f.id::text, ',' order by f.id) into v_got from public.forum_feed f;
    perform tests.ok(v_got is not distinct from v_ref, 'fil (performance) : mêmes publications visibles qu''avant — ' || v_name, v_got || ' / attendu ' || v_ref);
    select string_agg(c.id::text, ',' order by c.id) into v_ref from public.comments c join public.posts p on p.id = c.post_id
    where (p.group_id is null or public.can_see_group(p.group_id) or p.author_id = auth.uid() or c.author_id = auth.uid())
      and ((c.status = 'visible' and not public.is_blocked_between(c.author_id, auth.uid())
            and ((p.status = 'visible' and not public.is_blocked_between(p.author_id, auth.uid())) or p.author_id = auth.uid() or public.has_role('moderator')))
           or c.author_id = auth.uid() or public.has_role('moderator'));
    select string_agg(c.id::text, ',' order by c.id) into v_got from public.comment_feed c;
    perform tests.ok(v_got is not distinct from v_ref, 'commentaires (performance) : mêmes commentaires visibles qu''avant — ' || v_name, v_got || ' / attendu ' || v_ref);
    -- anonymat, photos, badge : mêmes valeurs que les anciennes expressions
    perform tests.ok(not exists (select 1 from public.forum_feed f join public.posts p on p.id = f.id
        where f.author_handle is distinct from (case when p.anonymous then null else (select handle from public.community_profiles where user_id = p.author_id) end)
           or f.author_badge is distinct from (case when p.anonymous then false else public.premium_badge(p.author_id) end)
           or f.is_mine is distinct from (p.author_id = auth.uid())),
      'fil (performance) : pseudo, badge et « à moi » inchangés — ' || v_name);
    perform tests.ok(not exists (select 1 from public.comment_feed v join public.comments c on c.id = v.id join public.posts p on p.id = c.post_id
        where v.author_handle is distinct from (case when p.anonymous and c.author_id = p.author_id then null else (select handle from public.community_profiles where user_id = c.author_id) end)
           or v.author_badge is distinct from (case when p.anonymous and c.author_id = p.author_id then false else public.premium_badge(c.author_id) end)),
      'commentaires (performance) : pseudo et badge inchangés (commentaire anonyme de l''autrice) — ' || v_name);
    -- 2. fonctions de lecture = vues filtrées et triées
    perform tests.ok((select array_agg(id) from public.community_feed(null, 100))
        is not distinct from (select array_agg(id) from (select id from public.forum_feed order by created_at desc, id desc limit 100) t),
      'community_feed = 100 plus récentes de forum_feed — ' || v_name);
    perform tests.ok((select array_agg(id) from public.community_feed(null, 1))
        is not distinct from (select array_agg(id) from (select id from public.forum_feed order by created_at desc, id desc limit 1) t),
      'community_feed (limite 1, plusieurs lots) = forum_feed — ' || v_name);
    perform tests.ok((select array_agg(id) from public.community_feed((select id from public.forums where slug = 'grossesse'), 3))
        is not distinct from (select array_agg(id) from (select id from public.forum_feed where forum_slug = 'grossesse' order by created_at desc, id desc limit 3) t),
      'community_feed (catégorie) = forum_feed filtré — ' || v_name);
    perform tests.ok((select array_agg(id) from public.member_posts('fp_autrice', 100))
        is not distinct from (select array_agg(id) from (select id from public.forum_feed where author_handle = 'fp_autrice' order by created_at desc, id desc) t),
      'member_posts = forum_feed filtré sur le pseudo — ' || v_name);
    perform tests.ok((select array_agg(id) from public.member_posts('fp_bloquee', 2))
        is not distinct from (select array_agg(id) from (select id from public.forum_feed where author_handle = 'fp_bloquee' order by created_at desc, id desc limit 2) t),
      'member_posts (membre bloqué ou non, limite 2) = forum_feed filtré — ' || v_name);
    perform tests.ok((select array_agg(id) from public.member_comments('fp_autrice', 100))
        is not distinct from (select array_agg(id) from (select id from public.comment_feed where author_handle = 'fp_autrice' order by created_at desc, id desc) t),
      'member_comments = comment_feed filtré sur le pseudo — ' || v_name);
  end loop;
end $$;

-- 3. Cas précis, en rôle authenticated
set role authenticated;
set request.jwt.claim.sub = :'FB';
select tests.ok((select count(*) from public.community_feed(null, 100) where id in ('f5a00000-0000-4000-8000-000000000110', 'f5a00000-0000-4000-8000-000000000111',
    'f5a00000-0000-4000-8000-000000000112', 'f5a00000-0000-4000-8000-000000000113', 'f5a00000-0000-4000-8000-000000000114')) = 0
  and (select count(*) from public.community_feed(null, 100) where id = 'f5a00000-0000-4000-8000-000000000101') = 1,
  'community_feed : la personne bloquée n''apparaît pas, les autres oui');
select tests.ok((select count(*) from public.member_posts('fp_bloquee', 100)) = 0 and (select count(*) from public.member_comments('fp_bloquee', 100)) = 0,
  'member_posts / member_comments : rien d''une personne bloquée');
select tests.ok((select count(*) from public.member_posts('fp_autrice', 100) where anonymous) = 0
  and not exists (select 1 from public.member_posts('fp_autrice', 100) where id in ('f5a00000-0000-4000-8000-000000000102', 'f5a00000-0000-4000-8000-000000000103')),
  'member_posts : ni publication anonyme ni publication masquée');
select tests.ok(not exists (select 1 from public.member_comments('fp_autrice', 100) where id = 'f5a00000-0000-4000-8000-000000000203'),
  'member_comments : le commentaire de l''autrice sous sa publication anonyme n''est pas rattaché à son pseudo');
select tests.ok((select count(*) from public.member_posts('fp_inconnu', 100)) = 0 and (select count(*) from public.member_comments(null, 100)) = 0,
  'member_posts / member_comments : pseudo inconnu ou vide → aucune ligne');
set request.jwt.claim.sub = :'FE';
select tests.ok(not exists (select 1 from public.community_feed(null, 100) where id = 'f5a00000-0000-4000-8000-000000000104')
  and (select count(*) from public.member_posts('fp_membre', 100)) = 0 and (select count(*) from public.member_comments('fp_membre', 100)) = 0,
  'groupe privé : rien pour une non-membre (fil et profil du membre)');
select tests.ok(exists (select 1 from public.community_feed(null, 100) where id = 'f5a00000-0000-4000-8000-000000000105'),
  'thème archivé : visible pour sa membre');
set request.jwt.claim.sub = :'FD';
select tests.ok(exists (select 1 from public.community_feed(null, 100) where id = 'f5a00000-0000-4000-8000-000000000104')
  and exists (select 1 from public.member_comments('fp_membre', 100) where id = 'f5a00000-0000-4000-8000-000000000205'),
  'groupe privé : visible pour sa membre (fil et commentaires)');
set request.jwt.claim.sub = :'FM';
select tests.ok(exists (select 1 from public.member_posts('fp_autrice', 100) where id = 'f5a00000-0000-4000-8000-000000000103')
  and exists (select 1 from public.community_feed(null, 100) where id = 'f5a00000-0000-4000-8000-000000000104'),
  'modération : publications masquées et groupe privé visibles');
select tests.throws($$select * from public._forum_feed_page(null, null, 10)$$, 'fonction interne _forum_feed_page non appelable par l''application');
reset role;
set role anon;
select tests.throws($$select * from public.community_feed(null, 10)$$, 'community_feed refusée sans connexion');
select tests.throws($$select * from public.member_comments('fp_autrice', 10)$$, 'member_comments refusée sans connexion');
reset role;
select set_config('request.jwt.claim.sub', '', false);
select tests.ok((select count(*) from public.community_feed(null, 10)) = 0, 'community_feed : aucune ligne sans personne connectée');

-- 4. Structure : barrière de sécurité conservée, index présents
select tests.ok((select bool_and('security_barrier=true' = any (reloptions)) from pg_class where oid in ('public.forum_feed'::regclass, 'public.comment_feed'::regclass)),
  'forum_feed et comment_feed restent security_barrier');
select tests.ok((select count(*) from pg_indexes where schemaname = 'public'
  and indexname in ('posts_created_at_idx', 'posts_forum_created_at_idx', 'comments_author_created_at_idx')) = 3,
  'index du fil et des commentaires par membre présents');

-- 5. Liste d'articles : english_ready = même règle que localizeArticle (titre ET texte anglais non vides)
select tests.ok(not exists (select 1 from public.articles a
    where public.english_ready(a) is distinct from (coalesce(a.title_en, '') <> '' and coalesce(a.body_md_en, '') <> '')),
  'articles : english_ready conforme aux colonnes anglaises');
select tests.ok(public.english_ready(jsonb_populate_record(null::public.articles, '{"title_en": "Title", "body_md_en": ""}')) = false
  and public.english_ready(jsonb_populate_record(null::public.articles, '{"title_en": "", "body_md_en": "Text"}')) = false
  and public.english_ready(jsonb_populate_record(null::public.articles, '{"title_en": "Title", "body_md_en": "Text"}')) = true,
  'articles : « anglais prêt » seulement avec titre ET texte anglais');
set role authenticated;
set request.jwt.claim.sub = :'FE';
select tests.ok((select count(*) from public.articles a where public.english_ready(a) is not null) = (select count(*) from public.articles),
  'articles : english_ready lisible par l''application');
reset role;
