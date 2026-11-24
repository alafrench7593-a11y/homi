-- =====================================================================
-- HOMI Ambassadors — fiabilité financière (24/11/2026) : arrondi, 6 paiements maximum, client déjà payant,
-- environnement de test, traçabilité, grand livre en ajout seul, seuil de versement exact.
-- =====================================================================
\set A 'bbbb0000-0000-4000-8000-0000000000a1'
\set C1 'bbbb0000-0000-4000-8000-0000000000c1'
\set C2 'bbbb0000-0000-4000-8000-0000000000c2'
\set C3 'bbbb0000-0000-4000-8000-0000000000c3'
\set ADM 'bbbb0000-0000-4000-8000-0000000000ad'
\set FIN 'bbbb0000-0000-4000-8000-0000000000f1'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'A', 'fin-amb@exemple.test'), (:'C1', 'fin-c1@exemple.test'), (:'C2', 'fin-c2@exemple.test'),
  (:'C3', 'fin-c3@exemple.test'), (:'ADM', 'fin-adm@exemple.test'), (:'FIN', 'fin-fin@exemple.test');
insert into public.user_roles (user_id, role) values (:'ADM', 'admin'), (:'FIN', 'finance');
set role authenticated; set request.jwt.claim.sub = :'A';
select public.affiliate_apply('fin-amb', 'Fin', 'A', 'fin-amb@exemple.test', 'FR', 'fr', 'maman', 'v1-2026-11');
set request.jwt.claim.sub = :'ADM';
select public.affiliate_set_status(id, 'active') from public.affiliates where code = 'fin-amb';

-- C1 : abonnement mensuel, 6 paiements commissionnés, pas un de plus
set request.jwt.claim.sub = :'C1';
select tests.ok(public.affiliate_attach('fin-amb') = 'ok', 'finance : attribution');
reset role;
select tests.ok(public.affiliate_record_commission(:'C1', 'f-sbx', 'homi_premium_monthly', 1062, 'EUR', now(), 1499, 1667, 1247, 'ev-sbx', 'SANDBOX', 'APP_STORE') = 'sandbox_ignored', 'finance : achat de test (sandbox) → aucune commission');
select tests.ok((select count(*) from public.affiliate_attributions where user_id = :'C1' and locked_at is null) = 1, 'finance : sandbox ne fige pas l''attribution');
select public.affiliate_record_commission(:'C1', 'f-m' || i, 'homi_premium_monthly', 1062, 'EUR', now() + make_interval(months => i - 1),
  1499, 1667, 1247, 'ev-m' || i, 'PRODUCTION', 'APP_STORE') from generate_series(1, 6) i;
select tests.ok((select count(*) from public.affiliate_ledger where customer_id = :'C1' and kind = 'commission') = 6, 'finance : 6 paiements mensuels commissionnés');
select tests.ok((select sum(amount_minor) from public.affiliate_ledger where customer_id = :'C1' and kind = 'commission') = 1914, 'finance : 6 × 3,19 € = 19,14 € exactement');
select tests.ok(public.affiliate_record_commission(:'C1', 'f-m7', 'homi_premium_monthly', 1062, 'EUR', now() + interval '6 months' - interval '5 seconds') = 'period_over',
  'finance : 7e paiement daté avant la fin de fenêtre → refusé (6 au maximum)');
select tests.ok(public.affiliate_record_commission(:'C1', 'f-m8', 'homi_premium_monthly', 1062, 'EUR', now() + interval '7 months') = 'period_over', 'finance : rien après 6 mois');
select tests.ok((select bool_and(rate_bp = 3000 and terms_version = 'v1-2026-11' and gross_minor = 1499 and tax_bp = 1667 and store_fee_bp = 1247 and environment = 'production' and store = 'APP_STORE' and net_minor = 1062)
  from public.affiliate_ledger where customer_id = :'C1'), 'finance : brut, taxe, commission boutique, taux et version des conditions conservés');
select tests.ok(public.affiliate_record_commission(:'C1', 'f-m1', 'homi_premium_monthly', 1062, 'EUR', now()) = 'duplicate', 'finance : même transaction rejouée → aucune 2e commission');

-- grand livre en ajout seul
select tests.throws($$update public.affiliate_ledger set amount_minor = 99999 where transaction_id = 'f-m1'$$, 'finance : montant non modifiable');
select tests.throws($$delete from public.affiliate_ledger where transaction_id = 'f-m1'$$, 'finance : suppression interdite');
select tests.throws($$update public.affiliate_ledger set status = 'paid' where transaction_id = 'f-m1'$$, 'finance : « en attente » ne passe jamais directement à « versé »');

-- un remboursement libère la place : le paiement suivant (dans la fenêtre) reste commissionnable, le total ne dépasse jamais 6
select tests.ok(public.affiliate_reverse_commission('f-m6') = 'ok', 'finance : remboursement du 6e mois');
select tests.ok((select sum(amount_minor) from public.affiliate_ledger where customer_id = :'C1' and kind in ('commission', 'reversal') and status <> 'reversed') = 1595,
  'finance : solde effectif après remboursement = 5 × 3,19 €');

-- C2 : déjà client payant avant d'entrer un code
insert into public.conversion_events (user_id, kind, transaction_id, product_id, occurred_at) values (:'C2', 'first_billing_confirmed', 'old-tx', 'homi_premium_monthly', now() - interval '3 months');
set role authenticated; set request.jwt.claim.sub = :'C2';
select tests.ok(public.affiliate_attach('fin-amb') = 'already_customer', 'finance : client déjà payant → pas d''attribution');
-- attribution antérieure puis première facturation sur une autre transaction (ex. achat sans code, code saisi ensuite)
set request.jwt.claim.sub = :'C3';
select public.affiliate_attach('fin-amb');
reset role;
insert into public.conversion_events (user_id, kind, transaction_id, product_id, occurred_at) values (:'C3', 'first_billing_confirmed', 'c3-first', 'homi_premium_monthly', now() - interval '1 day');
select tests.ok(public.affiliate_record_commission(:'C3', 'c3-renew', 'homi_premium_monthly', 1062, 'EUR', now()) = 'already_customer', 'finance : renouvellement d''un client existant → aucune commission');

-- seuil de versement exact (30,00 € selon les conditions v1-2026-11)
update public.affiliate_ledger set available_at = now() - interval '1 day' where customer_id = :'C1' and kind = 'commission' and status = 'pending';
select public.affiliate_release_due();
set role authenticated; set request.jwt.claim.sub = :'FIN';
select tests.throws($$select public.affiliate_record_payout((select id from public.affiliates where code = 'fin-amb'), 'EUR', 'VIR-F0')$$, 'finance : 15,95 € disponibles < 30 € → pas de versement');
reset role;
insert into public.affiliate_ledger (affiliate_id, kind, status, amount_minor, currency, note, created_by)
  select id, 'adjustment', 'available', 1405, 'EUR', 'test seuil', :'ADM' from public.affiliates where code = 'fin-amb';
set role authenticated; set request.jwt.claim.sub = :'FIN';
select tests.ok((public.affiliate_record_payout((select id from public.affiliates where code = 'fin-amb'), 'EUR', 'VIR-F1')).amount_minor = 3000, 'finance : exactement 30,00 € → versement autorisé');
select tests.throws($$select public.affiliate_record_payout((select id from public.affiliates where code = 'fin-amb'), 'EUR', 'VIR-F2')$$, 'finance : deuxième versement immédiat → refusé (solde nul)');
reset role;
insert into public.affiliate_ledger (affiliate_id, kind, status, amount_minor, currency, note, created_by)
  select id, 'adjustment', 'available', 5000, 'EUR', 'test référence', :'ADM' from public.affiliates where code = 'fin-amb';
set role authenticated; set request.jwt.claim.sub = :'FIN';
select tests.throws($$select public.affiliate_record_payout((select id from public.affiliates where code = 'fin-amb'), 'EUR', 'vir-f1')$$, 'finance : même référence de virement → refusé (pas de double paiement)');
select tests.throws($$select public.affiliate_record_payout((select id from public.affiliates where code = 'fin-amb'), 'EUR', '  ')$$, 'finance : référence obligatoire');
reset role; set request.jwt.claim.sub = '';
