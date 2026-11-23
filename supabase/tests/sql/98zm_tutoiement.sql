-- Tutoiement (02/12/2026) : les textes envoyés par le serveur s'adressent au parent au « tu ».
-- Vérifie la migration 20261202000100_tutoiement : fonctions (notifications, erreurs), numéros d'urgence,
-- contenus éditoriaux semés, et l'idempotence (rejouer la réécriture ne change plus rien).
reset role;

-- ================================================================ 1. fonctions : plus aucune chaîne au « vous » converti
select tests.ok(exists (select 1 from pg_proc pr join pg_namespace ns on ns.oid = pr.pronamespace
  where ns.nspname = 'public' and pr.prosrc like '%Ton partenaire souhaite partager quelque chose avec toi%'),
  'tutoiement : notification « Se comprendre » au « tu »');
select tests.ok(not exists (
  select 1 from pg_proc pr join pg_namespace ns on ns.oid = pr.pronamespace
  where ns.nspname = 'public' and pr.prokind = 'f'
    and pr.prosrc ~ '(Une tâche vous est confiée|Ouvrez HOMI|Ouvrez l’application|a répondu à votre commentaire|Vous avez un nouveau message privé|Créez votre profil communautaire)'),
  'tutoiement : aucune fonction n''envoie encore ces textes au « vous »');
select tests.ok(position('_group_member_of(' in pg_get_functiondef('public.invite_to_group(uuid,text)'::regprocedure)) > 0
  and position('t’invite dans le groupe privé' in pg_get_functiondef('public.invite_to_group(uuid,text)'::regprocedure)) > 0,
  'tutoiement : la réécriture garde la définition actuelle (garde-fous ajoutés après coup conservés)');

-- ================================================================ 2. numéros d'urgence
select tests.ok((select bool_and(description like 'Si tu penses au suicide%') from public.emergency_resources where country = 'FR' and phone = '3114'),
  'tutoiement : description du 3114 au « tu »');

-- ================================================================ 3. contenus éditoriaux semés
select tests.ok((select body_md not like '%faire le point sur votre santé%' and body_md like '%faire le point sur ta santé%'
  from public.articles where slug = 'comprendre-fenetre-fertile'), 'tutoiement : corps d''article converti phrase par phrase');
select tests.ok((select body = 'Lave et épluche les carottes et la pomme de terre, puis coupe-les en morceaux réguliers.' from public.recipe_steps
  where recipe_id = (select id from public.recipes where slug = 'puree-carotte-pomme-de-terre' and owner_id is null) and position = 1),
  'tutoiement : étape de recette à l''impératif singulier');

-- ================================================================ 4. idempotence : rejouer la migration ne change plus rien
create temporary table tutoiement_avant as
  select 'f' as k, pr.oid::text as id, md5(pg_get_functiondef(pr.oid)) as h from pg_proc pr join pg_namespace ns on ns.oid = pr.pronamespace
  where ns.nspname = 'public' and pr.prokind = 'f'
  union all select 'a', slug, md5(coalesce(title, '') || coalesce(summary, '') || coalesce(body_md, '')) from public.articles
  union all select 's', recipe_id::text || '/' || position, md5(body) from public.recipe_steps;
\ir ../../migrations/20261202000100_tutoiement.sql
select tests.ok(not exists (
  select 1 from tutoiement_avant a where (a.k = 'f' and md5(pg_get_functiondef(a.id::oid)) <> a.h)
    or (a.k = 'a' and (select md5(coalesce(title, '') || coalesce(summary, '') || coalesce(body_md, '')) from public.articles where slug = a.id) <> a.h)
    or (a.k = 's' and (select md5(body) from public.recipe_steps where recipe_id::text || '/' || position = a.id) <> a.h)),
  'tutoiement : migration idempotente (rejouée, elle ne change ni fonction, ni article, ni étape)');
drop table tutoiement_avant;
