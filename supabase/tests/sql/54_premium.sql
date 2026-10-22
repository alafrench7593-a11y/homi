-- =====================================================================
-- Offre Premium : droits selon l'état de l'abonnement (essai, actif, annulé, grâce, problème de paiement, expiré),
-- quotas mensuels, fonctions réservées vérifiées côté serveur, lecture conservée après la fin, partage par profil.
-- =====================================================================
\set MERE 'f1e1a000-0000-4000-8000-000000000001'
\set COPA 'f1e1a000-0000-4000-8000-000000000002'
insert into auth.users (id, email) values (:'MERE', 'p-mere@exemple.test'), (:'COPA', 'p-copa@exemple.test');

-- ---------------------------------------------------------------- États de l'abonnement (même règle que src/lib/premium/entitlement.ts)
create or replace function pg_temp.sub(p_status text, p_exp interval) returns boolean language plpgsql as $$
begin
  delete from public.subscriptions where user_id = 'f1e1a000-0000-4000-8000-000000000001';
  insert into public.subscriptions (user_id, status, store, period_type, expires_at, will_renew)
  values ('f1e1a000-0000-4000-8000-000000000001', p_status, 'test', 'monthly', case when p_exp is null then null else now() + p_exp end, p_status in ('trial', 'active'));
  return public.has_premium('f1e1a000-0000-4000-8000-000000000001');
end $$;
select tests.ok(pg_temp.sub('trial', interval '5 days'), 'essai en cours : Premium');
select tests.ok(not pg_temp.sub('trial', interval '-1 minute'), 'fin d''essai sans achat : retour à la version gratuite');
select tests.ok(pg_temp.sub('active', interval '20 days'), 'abonnement actif : Premium');
select tests.ok(pg_temp.sub('active', interval '30 days'), 'renouvellement (nouvelle date d''expiration) : Premium prolongé');
select tests.ok(pg_temp.sub('cancelled', interval '3 days'), 'annulé : Premium jusqu''à la fin de la période payée');
select tests.ok(not pg_temp.sub('cancelled', interval '-1 day'), 'annulé puis période terminée : fin du Premium');
select tests.ok(pg_temp.sub('grace', interval '2 days'), 'période de grâce (paiement à régulariser) : Premium maintenu');
select tests.ok(not pg_temp.sub('billing_issue', interval '2 days'), 'problème de paiement non régularisé : Premium en pause');
select tests.ok(not pg_temp.sub('expired', interval '-1 day'), 'expiré : version gratuite');
delete from public.subscriptions where user_id = :'MERE';

-- ---------------------------------------------------------------- Version gratuite : quotas et fonctions réservées
set role authenticated; set request.jwt.claim.sub = :'MERE';
create temp table pm_ctx as select public.create_household('Foyer Premium test') as hid;
grant select on pm_ctx to authenticated;
insert into public.children (household_id, first_name, birth_date) select hid, 'Lina', current_date - 200 from pm_ctx;
insert into public.children (household_id, first_name, birth_date) select hid, 'Noé', current_date - 2000 from pm_ctx;
create temp table pm_kids as select id, first_name from public.children where first_name in ('Lina', 'Noé') and household_id = (select hid from pm_ctx);
grant select on pm_kids to authenticated;
insert into public.bottles (child_id, household_id, at, consumed_ml) select id, (select hid from pm_ctx), now() - interval '2 hours', 150 from pm_kids where first_name = 'Lina';
insert into public.sleeps (child_id, household_id, started_at, ended_at) select id, (select hid from pm_ctx), now() - interval '10 hours', now() - interval '2 hours' from pm_kids where first_name = 'Noé';

select tests.ok((select used from public.feature_quota_status('voice_entries_per_month')) = 0 and (select quota from public.feature_quota_status('voice_entries_per_month')) = 3, 'saisie vocale : 3 essais gratuits par mois');
select tests.ok((select allowed from public.consume_feature_quota('voice_entries_per_month')), 'saisie vocale : 1re utilisation');
select public.consume_feature_quota('voice_entries_per_month'); select public.consume_feature_quota('voice_entries_per_month');
select tests.ok(not (select allowed from public.consume_feature_quota('voice_entries_per_month')) and (select remaining from public.feature_quota_status('voice_entries_per_month')) = 0, 'saisie vocale : limite gratuite atteinte, message côté application');
select tests.throws($$select public.consume_feature_quota('autre_chose_per_month')$$, 'quota : clé inconnue refusée');
select tests.throws($$insert into public.feature_usage (user_id, feature, month, used) values (auth.uid(), 'voice_entries_per_month', current_date, 0)$$, 'quota : impossible de remettre son compteur à zéro');
select tests.throws($$insert into public.meal_plans (household_id, title, days, servings) select hid, 'Semaine', 7, 2 from pm_ctx$$, 'menu hebdomadaire : réservé au Premium (vérifié côté serveur)');
select tests.throws($$select public.create_household_invitation((select hid from pm_ctx))$$, 'invitation du coparent : réservée au Premium');
-- Diversification : quelques aliments gratuits (quota par enfant, 61_discoveries_grow_nearby.sql), catalogue complet Premium
insert into public.food_introductions (child_id, household_id, food_name, first_tried_on) select id, (select hid from pm_ctx), 'Courgette', current_date from pm_kids where first_name = 'Lina';
select tests.ok(tests.count('select * from public.food_introductions') = 1, 'diversification : quelques aliments suivis gratuitement');
select tests.throws($$insert into public.bedtime_routines (household_id, child_id, steps) select (select hid from pm_ctx), id, array['Bain'] from pm_kids where first_name = 'Lina'$$, 'routine du coucher : réservée au Premium');
insert into public.reminders (user_id, household_id, category, title, schedule) select auth.uid(), null, 'custom', 'Perso ' || g, '{"type":"daily","hour":9,"minute":0}'::jsonb from generate_series(1, 5) g;
select tests.throws($$insert into public.reminders (user_id, category, title, schedule) values (auth.uid(), 'custom', 'Perso 6', '{"type":"daily","hour":9,"minute":0}'::jsonb)$$, 'rappels personnels : 5 actifs en version gratuite');
insert into public.reminders (user_id, category, title, schedule) values (auth.uid(), 'medication', 'Noé · Traitement prescrit', '{"type":"daily","hour":17,"minute":0}'::jsonb);
insert into public.reminders (user_id, category, title, schedule) values (auth.uid(), 'appointment', 'Pédiatre', '{"type":"daily","hour":15,"minute":0}'::jsonb);
select tests.ok(tests.count('select * from public.reminders where category in (''medication'', ''appointment'')') = 2, 'rappels de médicament prescrit et de rendez-vous : jamais limités');
reset role;

-- ---------------------------------------------------------------- Premium : tout est possible ; puis fin d'abonnement : lecture conservée
select tests.set_premium(:'MERE', true);
set role authenticated; set request.jwt.claim.sub = :'MERE';
insert into public.meal_plans (household_id, title, days, servings) select hid, 'Semaine Premium', 7, 2 from pm_ctx;
insert into public.food_introductions (child_id, household_id, food_name, first_tried_on) select id, (select hid from pm_ctx), 'Carotte', current_date from pm_kids where first_name = 'Lina';
insert into public.bedtime_routines (household_id, child_id, bedtime, steps) select (select hid from pm_ctx), id, '19:45', array['Bain', 'Histoire', 'Câlin'] from pm_kids where first_name = 'Lina';
select tests.ok((select quota from public.feature_quota_status('voice_entries_per_month')) = 1000, 'Premium : quota de saisie vocale étendu');
-- Invitation du coparent limitée à Lina (ni Noé ni la grossesse)
create temp table pm_inv as select public.create_household_invitation((select hid from pm_ctx), 'coparent', array['daily','profile','health'], array['daily'], null, array[(select id from pm_kids where first_name = 'Lina')], false) as token;
grant select on pm_inv to authenticated;
select tests.throws($$select public.create_household_invitation((select hid from pm_ctx), 'coparent', array['daily'], array['daily'], null, array['00000000-0000-4000-8000-000000000000'::uuid], true)$$, 'invitation : un profil d''un autre foyer est refusé');
reset role;
select tests.set_premium(:'MERE', false);

set role authenticated; set request.jwt.claim.sub = :'MERE';
select tests.ok(tests.count('select * from public.meal_plans') = 1 and tests.count('select * from public.bedtime_routines') = 1 and tests.count('select * from public.reminders') = 7 and tests.count('select * from public.food_introductions') = 2,
  'fin d''abonnement : menus, routine et rappels déjà créés restent consultables');
select tests.throws($$insert into public.meal_plans (household_id, title, days, servings) select hid, 'Nouvelle semaine', 7, 2 from pm_ctx$$, 'fin d''abonnement : nouveau menu hebdomadaire réservé au Premium');
update public.bedtime_routines set steps = array['Bain', 'Histoire'];
select tests.ok((select cardinality(steps) from public.bedtime_routines) = 2, 'fin d''abonnement : la routine existante reste modifiable');
reset role;

-- ---------------------------------------------------------------- Partage par profil (le coparent ne voit que Lina)
set role authenticated; set request.jwt.claim.sub = :'COPA';
select public.accept_household_invitation((select token from pm_inv));
select tests.ok(tests.count('select * from public.children') = 1 and (select first_name from public.children) = 'Lina', 'partage par profil : le coparent ne voit que Lina');
select tests.ok(tests.count('select * from public.bottles') = 1 and tests.count('select * from public.sleeps') = 0, 'partage par profil : aucune donnée de Noé');
select tests.throws($$insert into public.sleeps (child_id, household_id, started_at) select id, (select hid from pm_ctx), now() from pm_kids where first_name = 'Noé'$$, 'partage par profil : impossible d''écrire pour Noé');
insert into public.bottles (child_id, household_id, at, consumed_ml) select id, (select hid from pm_ctx), now() - interval '10 minutes', 120 from pm_kids where first_name = 'Lina';
select tests.ok((select count(distinct created_by) from public.bottles) = 2, 'qui a enregistré : chaque biberon garde son auteur');
reset role;

set role authenticated; set request.jwt.claim.sub = :'MERE';
select tests.ok(tests.count('select * from public.bottles') = 2, 'synchronisation : la mère voit le biberon noté par le coparent (une seule ligne, pas de doublon)');
select public.set_member_scope((select hid from pm_ctx), :'COPA', array[]::uuid[], false);
reset role;
set role authenticated; set request.jwt.claim.sub = :'COPA';
select tests.ok(tests.count('select * from public.children') = 0 and tests.count('select * from public.bottles') = 0, 'révocation d''un profil : effet immédiat');
select tests.throws(format($$select public.set_member_scope(%L, %L, null, true)$$, (select hid from pm_ctx), :'COPA'), 'seul le propriétaire choisit les profils partagés');
reset role;
set role authenticated; set request.jwt.claim.sub = :'MERE';
delete from public.household_members where household_id = (select hid from pm_ctx) and user_id = :'COPA';
reset role;
set role authenticated; set request.jwt.claim.sub = :'COPA';
select tests.ok(tests.count('select * from public.household_members where household_id = ''' || (select hid from pm_ctx) || '''') = 0, 'retrait du coparent : accès coupé immédiatement, même sans abonnement');
reset role;

-- ---------------------------------------------------------------- Contenus premium : texte protégé, aperçu visible ; sécurité toujours gratuite
insert into public.articles (slug, title, summary, body_md, status, is_premium, is_safety_critical, journeys)
  values ('guide-premium-test', 'Guide approfondi', 'Résumé visible', 'Texte réservé', 'published', true, false, array['child']);
set role authenticated; set request.jwt.claim.sub = :'MERE';
select tests.ok(tests.count('select * from public.articles where slug = ''guide-premium-test''') = 0, 'article premium : texte illisible sans abonnement');
select tests.ok(tests.count('select * from public.premium_article_teasers() where slug = ''guide-premium-test''') = 1, 'article premium : titre et résumé visibles (aperçu)');
select tests.ok(tests.count('select * from public.articles where is_safety_critical') = tests.count('select * from public.articles where is_safety_critical and status = ''published'''), 'contenus de sécurité : toujours lisibles');
reset role;
select tests.set_premium(:'MERE', true);
set role authenticated; set request.jwt.claim.sub = :'MERE';
select tests.ok(tests.count('select * from public.articles where slug = ''guide-premium-test''') = 1, 'article premium : lisible avec l''abonnement');
reset role;
