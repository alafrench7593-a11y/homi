-- =====================================================================
-- Abonnement v2 : statuts nouveaux (remboursé, en pause, 6 mois), échéance nulle, impossible de
-- s'octroyer Premium, partage limité à l'abonné·e + un seul co-parent, export RGPD.
-- =====================================================================
\set SA 'ab0e0000-0000-4000-8000-000000000001'
\set SB 'ab0e0000-0000-4000-8000-000000000002'
\set SC 'ab0e0000-0000-4000-8000-000000000003'
\set SD 'ab0e0000-0000-4000-8000-000000000004'
\set SE 'ab0e0000-0000-4000-8000-000000000005'
\set SF 'ab0e0000-0000-4000-8000-000000000006'
\set SG 'ab0e0000-0000-4000-8000-000000000007'
\set H1 'ab0e0000-0000-4000-8000-0000000000a1'
\set H2 'ab0e0000-0000-4000-8000-0000000000a2'
\set H3 'ab0e0000-0000-4000-8000-0000000000a3'
reset role;
insert into auth.users (id, email) values
  (:'SA', 'sub-a@exemple.test'), (:'SB', 'sub-b@exemple.test'), (:'SC', 'sub-c@exemple.test'),
  (:'SD', 'sub-d@exemple.test'), (:'SE', 'sub-e@exemple.test'), (:'SF', 'sub-f@exemple.test'), (:'SG', 'sub-g@exemple.test');

-- ---------------------------------------------------------------- Valeurs par défaut et statuts acceptés
insert into public.subscriptions (user_id) values (:'SG');
select tests.ok((select entitlement from public.subscriptions where user_id = :'SG') = 'AU_FIL_DE_NOUS_PREMIUM', 'droit par défaut : AU_FIL_DE_NOUS_PREMIUM');
select tests.ok((select status from public.subscriptions where user_id = :'SG') = 'none', 'statut par défaut : aucun abonnement');
update public.subscriptions set status = 'refunded', refunded_at = now() where user_id = :'SG';
update public.subscriptions set status = 'paused', resumes_at = now() + interval '30 days' where user_id = :'SG';
update public.subscriptions set period_type = 'six_months', price = 54.99, currency = 'EUR', environment = 'sandbox' where user_id = :'SG';
select tests.ok((select status = 'paused' and period_type = 'six_months' and currency = 'EUR' from public.subscriptions where user_id = :'SG'), 'statuts nouveaux acceptés : remboursé, en pause, formule 6 mois, prix et devise');
select tests.throws(format($$update public.subscriptions set status = 'gratuit_a_vie' where user_id = %L$$, :'SG'), 'statut inconnu refusé');
select tests.throws(format($$update public.subscriptions set currency = 'euros' where user_id = %L$$, :'SG'), 'devise invalide refusée');
select tests.throws(format($$update public.subscriptions set period_type = 'weekly' where user_id = %L$$, :'SG'), 'période inconnue refusée');
delete from public.subscriptions where user_id = :'SG';

-- ---------------------------------------------------------------- Droits selon le statut et l'échéance
create or replace function pg_temp.grants(p_status text, p_exp interval, p_store text default 'app_store', p_period text default 'monthly') returns boolean language plpgsql as $$
begin
  delete from public.subscriptions where user_id = 'ab0e0000-0000-4000-8000-000000000007';
  insert into public.subscriptions (user_id, status, store, period_type, expires_at)
  values ('ab0e0000-0000-4000-8000-000000000007', p_status, p_store, p_period, case when p_exp is null then null else now() + p_exp end);
  return public._premium_of('ab0e0000-0000-4000-8000-000000000007');
end $$;
select tests.ok(pg_temp.grants('active', interval '180 days', 'app_store', 'six_months'), 'formule 6 mois active : Premium');
select tests.ok(pg_temp.grants('active', interval '365 days', 'play_store', 'annual'), 'formule 12 mois active : Premium');
select tests.ok(not pg_temp.grants('refunded', interval '20 days'), 'remboursé : plus de Premium, même avant l''échéance');
select tests.ok(not pg_temp.grants('refunded', null), 'remboursé sans échéance : plus de Premium');
select tests.ok(not pg_temp.grants('active', null), 'échéance nulle (abonnement boutique) : plus de Premium sans fin');
select tests.ok(not pg_temp.grants('cancelled', null), 'annulé sans échéance : plus de Premium');
select tests.ok(not pg_temp.grants('trial', null), 'essai sans échéance : plus de Premium');
select tests.ok(pg_temp.grants('active', null, 'promotional', 'monthly'), 'octroi promotionnel sans fin explicite : Premium');
select tests.ok(pg_temp.grants('active', null, 'app_store', 'lifetime'), 'achat à vie explicite : Premium');
select tests.ok(pg_temp.grants('paused', interval '5 days'), 'pause programmée : Premium jusqu''à l''échéance');
select tests.ok(not pg_temp.grants('paused', interval '-1 day'), 'pause effective : plus de Premium');
select tests.ok(not pg_temp.grants('billing_issue', interval '5 days'), 'échec de paiement hors période de grâce : pas de Premium');
select tests.ok(pg_temp.grants('grace', interval '5 days'), 'période de grâce : Premium maintenu');
select tests.ok(not pg_temp.grants('expired', interval '-1 day'), 'expiré : pas de Premium');
delete from public.subscriptions where user_id = :'SG';

-- ---------------------------------------------------------------- Impossible de s'octroyer Premium
set role authenticated; set request.jwt.claim.sub = :'SG';
select tests.throws(format($$insert into public.subscriptions (user_id, status, expires_at) values (%L, 'active', now() + interval '1 year')$$, :'SG'), 'insertion directe d''un abonnement refusée');
reset role;
insert into public.subscriptions (user_id, status, store, period_type, expires_at) values (:'SG', 'expired', 'app_store', 'monthly', now() - interval '1 day');
set role authenticated; set request.jwt.claim.sub = :'SG';
select tests.throws(format($$update public.subscriptions set status = 'active', expires_at = now() + interval '1 year' where user_id = %L$$, :'SG'), 'modification de son abonnement refusée');
select tests.throws(format($$delete from public.subscriptions where user_id = %L$$, :'SG'), 'suppression de son abonnement refusée');
select tests.throws($$select public._premium_of()$$, 'fonction interne _premium_of non appelable');
select tests.throws($$select public._subscription_grants('active', null, 'promotional', 'lifetime')$$, 'fonction interne _subscription_grants non appelable');
select tests.throws(format($$select public._premium_partner_of(%L)$$, :'SG'), 'fonction interne _premium_partner_of non appelable');
select tests.throws($$select public.set_demo_subscription(true)$$, 'aucune RPC d''abonnement de démonstration côté serveur');
select tests.ok(not public.has_premium(), 'après ces tentatives : toujours pas de Premium');
reset role;
select tests.ok((select status = 'expired' from public.subscriptions where user_id = :'SG'), 'ligne d''abonnement inchangée après les tentatives');

-- ---------------------------------------------------------------- Partage : abonné·e + un seul co-parent
-- Foyer H1 : SA propriétaire abonnée ; SB co-parent (arrivé en premier) ; SC co-parent (arrivé ensuite) ; SD accompagnant.
insert into public.households (id, name, created_by) values (:'H1', 'Foyer partage 1', :'SA'), (:'H2', 'Foyer partage 2', :'SA'), (:'H3', 'Foyer partage 3', :'SE');
insert into public.household_members (household_id, user_id, role, joined_at) values (:'H1', :'SA', 'owner', '2026-01-01')
  on conflict (household_id, user_id) do update set role = 'owner', joined_at = excluded.joined_at;
insert into public.household_members (household_id, user_id, role, joined_at) values
  (:'H1', :'SB', 'coparent', '2026-02-01'), (:'H1', :'SC', 'coparent', '2026-03-01'), (:'H1', :'SD', 'caregiver', '2026-01-15');
-- Depuis le 13/11/2026 (migration 20261113000300), seul Premium Famille est partagé : la règle « un seul co-parent » s'y applique
insert into public.subscriptions (user_id, entitlement, product_id, status, store, period_type, expires_at, will_renew) values (:'SA', 'AU_FIL_DE_NOUS_FAMILLE', 'aufildenous_family_monthly', 'active', 'app_store', 'monthly', now() + interval '300 days', true)
  on conflict (user_id) do update set status = excluded.status, expires_at = excluded.expires_at, entitlement = excluded.entitlement, product_id = excluded.product_id;
select tests.ok(public._premium_of(:'SA'), 'partage : l''abonnée a Premium');
select tests.ok(public._premium_of(:'SB'), 'partage : le premier co-parent arrivé a Premium');
select tests.ok(not public._premium_of(:'SC'), 'partage : un second co-parent n''a pas Premium (2 adultes au maximum)');
select tests.ok(not public._premium_of(:'SD'), 'partage : un accompagnant n''a pas Premium');
select tests.ok(public._premium_partner_of(:'SA') = :'SB', 'partage : bénéficiaire déterministe (premier arrivé)');
-- Deuxième foyer de la même abonnée : toujours UN seul bénéficiaire en tout
insert into public.household_members (household_id, user_id, role, joined_at) values (:'H2', :'SA', 'owner', '2026-01-01')
  on conflict (household_id, user_id) do update set role = 'owner', joined_at = excluded.joined_at;
insert into public.household_members (household_id, user_id, role, joined_at) values (:'H2', :'SF', 'coparent', '2026-04-01');
select tests.ok(not public._premium_of(:'SF'), 'partage : un co-parent d''un autre foyer de l''abonnée n''a pas Premium');
select tests.ok((select count(*) from (values (:'SB'::uuid), (:'SC'::uuid), (:'SD'::uuid), (:'SF'::uuid)) v(u) where public._premium_of(v.u)) = 1, 'partage : un seul compte bénéficiaire, quel que soit le nombre de foyers');
-- Départ du bénéficiaire : le co-parent suivant (par date d'arrivée) en profite
delete from public.household_members where household_id = :'H1' and user_id = :'SB';
select tests.ok(not public._premium_of(:'SB'), 'partage : un co-parent qui quitte le foyer perd Premium');
select tests.ok(public._premium_of(:'SC') and not public._premium_of(:'SF'), 'partage : le co-parent suivant (arrivé avant les autres) devient bénéficiaire');
-- Égalité de date : le plus petit identifiant (règle stable)
update public.household_members set joined_at = '2026-03-01' where household_id = :'H2' and user_id = :'SF';
update public.household_members set joined_at = '2026-03-01' where household_id = :'H1' and user_id = :'SC';
select tests.ok(public._premium_partner_of(:'SA') = least(:'SC'::uuid, :'SF'::uuid), 'partage : égalité de date départagée par l''identifiant');
-- Abonné·e co-parent : partage avec la propriétaire du foyer
insert into public.household_members (household_id, user_id, role, joined_at) values (:'H3', :'SE', 'owner', '2026-01-01')
  on conflict (household_id, user_id) do update set role = 'owner', joined_at = excluded.joined_at;
insert into public.household_members (household_id, user_id, role, joined_at) values (:'H3', :'SG', 'coparent', '2026-02-01');
update public.subscriptions set status = 'active', expires_at = now() + interval '20 days', entitlement = 'AU_FIL_DE_NOUS_FAMILLE', product_id = 'aufildenous_family_monthly' where user_id = :'SG';
select tests.ok(public._premium_of(:'SE'), 'partage : un co-parent abonné partage avec la propriétaire du foyer');
-- Fin de l'abonnement : fin du partage
update public.subscriptions set status = 'refunded', refunded_at = now() where user_id = :'SA';
select tests.ok(not public._premium_of(:'SA') and not public._premium_of(:'SC'), 'remboursement : plus de Premium pour l''abonnée ni pour le co-parent');
update public.subscriptions set status = 'active', refunded_at = null where user_id = :'SA';

-- ---------------------------------------------------------------- Vu de l'application (pour soi seulement)
create temp table sv2_partner as select public._premium_partner_of(:'SA') as id;
grant select on sv2_partner to authenticated;
set role authenticated; set request.jwt.claim.sub = :'SA';
select tests.ok((public.my_premium_share()->'shared_with'->>'user_id')::uuid = (select id from sv2_partner), 'mon abonnement : je vois avec qui il est partagé');
select tests.ok(public.has_premium() and not public.has_premium(:'SC'), 'has_premium : réponse réelle pour soi seulement');
reset role;
set role authenticated; set request.jwt.claim.sub = :'SD';
select tests.ok(public.my_premium_share()->'shared_by' = 'null'::jsonb and public.my_premium_share()->'shared_with' = 'null'::jsonb, 'accompagnant : aucun partage');
select tests.ok(not public.has_premium(), 'accompagnant : version gratuite');
reset role;

-- ---------------------------------------------------------------- Export RGPD
set role authenticated; set request.jwt.claim.sub = :'SG';
select tests.ok((public.export_my_data()->'subscription'->0) ?& array['status','period_type','started_at','trial_ends_at','price','currency','refunded_at','cancel_reason'], 'export RGPD : abonnement avec les nouvelles colonnes');
reset role;
