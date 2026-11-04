-- =====================================================================
-- Rappels personnels (5 actifs en version gratuite) : la limite ne se contourne pas par une MODIFICATION
-- (désactiver → créer → réactiver, ou changer la catégorie d'un rappel « médicament » en « personnel »).
-- Les rappels déjà créés restent modifiables et désactivables ; un abonné Premium n'est pas limité.
-- Voir supabase/migrations/20261106000100_custom_reminders_quota_update.sql
-- =====================================================================
\set RQ 'f1e1a000-0000-4000-8000-0000000000a1'
insert into auth.users (id, email) values (:'RQ', 'rappels-quota@exemple.test');

set role authenticated; set request.jwt.claim.sub = :'RQ';
insert into public.reminders (user_id, category, title, schedule)
  select auth.uid(), 'custom', 'Perso ' || g, '{"type":"daily","hour":9,"minute":0}'::jsonb from generate_series(1, 5) g;
select tests.throws($$insert into public.reminders (user_id, category, title, schedule) values (auth.uid(), 'custom', 'Perso 6', '{"type":"daily","hour":9,"minute":0}'::jsonb)$$,
  'rappels personnels (modif.) : 6e rappel actif refusé à la création');

-- Désactiver un rappel : toujours possible ; en créer un autre : possible (4 actifs)
update public.reminders set enabled = false where title = 'Perso 1';
select tests.ok(tests.count('select * from public.reminders where enabled') = 4, 'rappels personnels (modif.) : désactivation acceptée');
insert into public.reminders (user_id, category, title, schedule) values (auth.uid(), 'custom', 'Perso 6', '{"type":"daily","hour":9,"minute":0}'::jsonb);
-- Réactiver le rappel désactivé alors que 5 sont déjà actifs : refusé
select tests.throws($$update public.reminders set enabled = true where title = 'Perso 1'$$, 'rappels personnels (modif.) : réactivation au-delà de la limite refusée');
select tests.ok(tests.count('select * from public.reminders where enabled and category = ''custom''') = 5, 'rappels personnels (modif.) : toujours 5 actifs');

-- Changer la catégorie d'un rappel non limité (médicament) en rappel personnel : refusé au-delà de la limite
insert into public.reminders (user_id, category, title, schedule) values (auth.uid(), 'medication', 'Traitement', '{"type":"daily","hour":8,"minute":0}'::jsonb);
select tests.throws($$update public.reminders set category = 'custom' where title = 'Traitement'$$, 'rappels personnels (modif.) : changement de catégorie vers « personnel » refusé au-delà de la limite');

-- Modifier un rappel personnel déjà actif (titre, horaire, même en renvoyant enabled = true) : toujours possible
update public.reminders set title = 'Perso 2 bis', enabled = true where title = 'Perso 2';
select tests.ok(tests.count('select * from public.reminders where title = ''Perso 2 bis''') = 1, 'rappels personnels (modif.) : modification d''un rappel existant acceptée (données déjà créées)');
reset role;

-- Premium : réactivation sans limite gratuite
select tests.set_premium(:'RQ', true);
set role authenticated; set request.jwt.claim.sub = :'RQ';
update public.reminders set enabled = true where title = 'Perso 1';
select tests.ok(tests.count('select * from public.reminders where enabled and category = ''custom''') = 6, 'rappels personnels (modif.) : Premium, réactivation acceptée');
reset role;

-- Fin de l'abonnement : les 6 rappels restent actifs et modifiables (rien n'est retiré), aucun nouveau au-delà de 5
select tests.set_premium(:'RQ', false);
set role authenticated; set request.jwt.claim.sub = :'RQ';
update public.reminders set title = 'Perso 3 bis' where title = 'Perso 3';
select tests.ok(tests.count('select * from public.reminders where enabled and category = ''custom''') = 6, 'rappels personnels (modif.) : après la fin de Premium, les rappels déjà actifs restent actifs et modifiables');
update public.reminders set enabled = false where title = 'Perso 4';
select tests.throws($$update public.reminders set enabled = true where title = 'Perso 4'$$, 'rappels personnels (modif.) : après la fin de Premium, pas de réactivation au-delà de 5');
reset role;
delete from public.subscriptions where user_id = :'RQ';
