-- Charge HOMI Ambassadors (données fictives, base locale jetable) : 100 000 abonnés attribués, 1er paiement,
-- webhook rejoué pour tous (aucune 2e commission), 6 mois pour 10 000 d'entre eux, tableau de bord et seuils.
-- Usage : AMB_LOAD=1 bash supabase/tests/run-local.sh
\timing on
reset role;
insert into auth.users (id, email) values ('cccc0000-0000-4000-8000-0000000000a1', 'load-amb@exemple.test');
insert into public.affiliates (user_id, code, status, first_name, last_name, contact_email, country, profile_type, terms_version)
  values ('cccc0000-0000-4000-8000-0000000000a1', 'load-amb', 'active', 'Load', 'Test', 'load-amb@exemple.test', 'FR', 'createur', 'v1-2026-11');
insert into auth.users (id, email) select gen_random_uuid(), 'load-' || i || '@exemple.test' from generate_series(1, 100000) i;
insert into public.affiliate_attributions (user_id, affiliate_id, source, campaign, feature, attributed_at)
  select u.id, (select id from public.affiliates where code = 'load-amb'), 'link', '', '', now() - interval '1 day'
  from auth.users u where u.email like 'load-%@exemple.test' and u.email <> 'load-amb@exemple.test';
\echo '1er paiement × 100 000 (10 lots de 10 000, statistiques mises à jour entre les lots comme le ferait l''autovacuum)'
analyze;
create temp table load_users as select user_id, row_number() over (order by user_id) rn from public.affiliate_attributions;
select count(*) filter (where r = 'ok') as ok_lot_0 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 0 and rn <= 10000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_1 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 10000 and rn <= 20000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_2 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 20000 and rn <= 30000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_3 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 30000 and rn <= 40000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_4 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 40000 and rn <= 50000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_5 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 50000 and rn <= 60000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_6 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 60000 and rn <= 70000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_7 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 70000 and rn <= 80000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_8 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 80000 and rn <= 90000) x;
analyze public.affiliate_ledger;
select count(*) filter (where r = 'ok') as ok_lot_9 from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1250, null, 'production', 'APP_STORE') r
  from load_users where rn > 90000 and rn <= 100000) x;
analyze public.affiliate_ledger;
\echo 'webhook rejoué × 100 000'
select count(*) filter (where r = 'duplicate') as duplicates from (
  select public.affiliate_record_commission(user_id, 'L1-' || user_id, 'homi_premium_monthly', 1062, 'EUR', now()) r from public.affiliate_attributions) x;
\echo 'mois 2 à 7 pour 10 000 abonnés (le 7e doit être refusé)'
select r, count(*) from (
  select public.affiliate_record_commission(a.user_id, 'L' || m || '-' || a.user_id, 'homi_premium_monthly', 1062, 'EUR', now() + make_interval(months => m - 1) - interval '1 second') r
  from (select user_id from public.affiliate_attributions order by user_id limit 10000) a, generate_series(2, 7) m) x group by r order by r;
\echo 'contrôles'
select (select count(*) from public.affiliate_ledger where kind = 'commission') = 150000 as nb_ok,
       (select sum(amount_minor) from public.affiliate_ledger where kind = 'commission') = 150000::bigint * 319 as somme_ok,
       (select max(n) from (select count(*) n from public.affiliate_ledger where kind = 'commission' group by customer_id) z) = 6 as max6_ok;
\echo 'tableau de bord ambassadeur (agrégats)'
set role authenticated; set request.jwt.claim.sub = 'cccc0000-0000-4000-8000-0000000000a1';
select (public.affiliate_my_summary() ->> 'paying')::int as paying, public.affiliate_my_summary() -> 'by_currency' as totaux;
reset role;
\echo 'libération quotidienne'
update public.affiliate_ledger set available_at = now() - interval '1 day' where kind = 'commission';
select public.affiliate_release_due() as liberees;
