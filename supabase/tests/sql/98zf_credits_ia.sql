-- =====================================================================
-- Crédits IA (20261126000100_credits_ia.sql) : grand livre, réserves, octrois, packs, Famille, RLS, interrupteur.
-- Comptes :
--   Pia (Premium, propriétaire du foyer H1) et Quentin (co-parent de H1 : partenaire qui reçoit le Premium) ;
--   Fanny (Famille, propriétaire de H2), Gaël et Gina (co-parents de H2), Xavier (ancien co-parent de H2, retiré),
--   Clara (nounou de H2), Nina (sans abonnement), Tom (essai puis consommation), Uma (annuel), Vic (concurrence).
-- =====================================================================
\set P  'cc260000-0000-4000-8000-000000000001'
\set Q  'cc260000-0000-4000-8000-000000000002'
\set F  'cc260000-0000-4000-8000-000000000003'
\set G  'cc260000-0000-4000-8000-000000000004'
\set G2 'cc260000-0000-4000-8000-000000000005'
\set X  'cc260000-0000-4000-8000-000000000006'
\set C  'cc260000-0000-4000-8000-000000000007'
\set N  'cc260000-0000-4000-8000-000000000008'
\set TT 'cc260000-0000-4000-8000-000000000009'
\set U  'cc260000-0000-4000-8000-00000000000a'
\set V  'cc260000-0000-4000-8000-00000000000b'
\set H1 'cc260000-0000-4000-8000-0000000000a1'
\set H2 'cc260000-0000-4000-8000-0000000000a2'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'P', 'cr-pia@exemple.test'), (:'Q', 'cr-quentin@exemple.test'), (:'F', 'cr-fanny@exemple.test'),
  (:'G', 'cr-gael@exemple.test'), (:'G2', 'cr-gina@exemple.test'), (:'X', 'cr-xavier@exemple.test'), (:'C', 'cr-clara@exemple.test'),
  (:'N', 'cr-nina@exemple.test'), (:'TT', 'cr-tom@exemple.test'), (:'U', 'cr-uma@exemple.test'), (:'V', 'cr-vic@exemple.test');
insert into public.households (id, name, created_by) values (:'H1', 'Foyer crédits 1', :'P'), (:'H2', 'Foyer crédits 2', :'F');
insert into public.household_members (household_id, user_id, role) values (:'H1', :'P', 'owner'), (:'H2', :'F', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values
  (:'H1', :'Q', 'coparent'), (:'H2', :'G', 'coparent'), (:'H2', :'G2', 'coparent'), (:'H2', :'X', 'coparent'), (:'H2', :'C', 'caregiver');
select tests.set_premium(:'P', true);
select tests.set_premium(:'TT', true);
select tests.set_premium(:'V', true);
insert into public.subscriptions (user_id, status, store, period_type, product_id, expires_at, will_renew)
values (:'F', 'active', 'test', 'monthly', 'homi_family_monthly', now() + interval '30 days', true),
       (:'U', 'active', 'test', 'annual', 'homi_premium_annual', now() + interval '300 days', true);

-- ================================================================ structure et formule
select tests.ok((select tier from public.subscriptions where user_id = :'P') = 'premium'
  and (select tier from public.subscriptions where user_id = :'F') = 'family',
  'crédits : formule déduite de l''identifiant de produit (homi_family_* → family)');
select tests.throws($$update public.subscriptions set tier = 'family' where user_id = 'cc260000-0000-4000-8000-000000000001'$$,
  'crédits : la formule est une colonne générée (jamais écrite)');
select tests.ok(public._premium_of(:'G') and public._premium_of(:'G2') and public._premium_of(:'Q')
  and public._premium_of(:'X') and not public._premium_of(:'C') and not public._premium_of(:'N'),
  'Famille : Premium pour tous les adultes du foyer (pas la nounou) ; Premium : le partenaire ; sans abonnement : rien');
select tests.ok(not has_function_privilege('authenticated', 'public.credits_reserve(uuid, text, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.credits_commit(uuid, uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.credits_release(uuid, uuid, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.credits_purchase(uuid, text, text, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.credits_grant_monthly(uuid, text, timestamptz, boolean, text, text)', 'execute')
  and not has_function_privilege('anon', 'public.credits_status()', 'execute')
  and has_function_privilege('authenticated', 'public.credits_status()', 'execute')
  and has_function_privilege('service_role', 'public.credits_reserve(uuid, text, text)', 'execute'),
  'crédits : réserve, débit, restitution, octroi et achat réservés au serveur ; lecture du solde pour la personne connectée');
select tests.ok(not has_table_privilege('authenticated', 'public.credit_ledger', 'insert') and not has_table_privilege('authenticated', 'public.credit_ledger', 'update')
  and not has_table_privilege('authenticated', 'public.credit_accounts', 'update') and not has_table_privilege('authenticated', 'public.credit_reservations', 'select')
  and not has_table_privilege('anon', 'public.credit_accounts', 'select') and not has_table_privilege('authenticated', 'public.credit_settings', 'update'),
  'crédits : aucune écriture directe par un client, réserves invisibles');

-- ================================================================ sans abonnement (Premium strict)
select tests.ok(public.credits_reserve(:'N', 'assistant_question', 'k-nina-0001') ->> 'error' = 'premium_required',
  'sans abonnement : aucune réserve possible (premium_required)');
set role authenticated; set request.jwt.claim.sub = :'N';
select tests.ok((public.credits_status() ->> 'subscribed')::boolean = false and (public.credits_status() ->> 'monthly_remaining')::int = 0,
  'sans abonnement : solde nul, non abonné');
reset role;

-- ================================================================ octroi mensuel Premium + idempotence
select tests.ok((public.credits_grant_monthly(:'P', 'premium', now() + interval '30 days', false, 'grant:pia:1', 'revenuecat') ->> 'monthly_remaining')::int = 1000,
  'octroi : 1 000 crédits pour Premium (INITIAL_PURCHASE)');
select tests.ok((public.credits_grant_monthly(:'P', 'premium', now() + interval '30 days', false, 'grant:pia:1', 'revenuecat') ->> 'replay')::boolean
  and (select monthly_balance from public.credit_accounts where payer_id = :'P') = 1000,
  'octroi : même événement reçu deux fois → un seul octroi');
select tests.ok(public.credits_grant_monthly(:'P', 'premium', now() + interval '30 days', false, 'grant:pia:1b', 'revenuecat') ->> 'skipped' = 'recent_grant',
  'octroi : second octroi de même formule dans les 12 h ignoré (PRODUCT_CHANGE + RENEWAL)');

-- ================================================================ réserve / débit / restitution
select (public.credits_reserve(:'Q', 'assistant_question', 'k-quentin-0001') ->> 'reservation_id') as rq1 \gset
select tests.ok((select monthly_balance from public.credit_accounts where payer_id = :'P') = 999
  and (select account_id from public.credit_reservations where id = :'rq1') = (select id from public.credit_accounts where payer_id = :'P'),
  'partenaire Premium : la réserve se fait sur le compte du payeur (partagé)');
select tests.ok(public.credits_reserve(:'Q', 'assistant_question', 'k-quentin-0001') ->> 'reservation_id' = :'rq1'
  and (public.credits_reserve(:'Q', 'assistant_question', 'k-quentin-0001') ->> 'replay')::boolean
  and (select monthly_balance from public.credit_accounts where payer_id = :'P') = 999,
  'idempotence : même clé deux fois → même réserve, aucun second débit');
select public.credits_commit(:'Q', :'rq1') ->> 'ok' as c1, public.credits_commit(:'Q', :'rq1') ->> 'replay' as c2 \gset
select tests.ok(:'c1'::boolean and :'c2'::boolean
  and (select count(*) from public.credit_ledger where reservation_id = :'rq1' and kind = 'debit') = 1,
  'débit : un seul débit même si la confirmation est rejouée');
select tests.ok(public.credits_release(:'Q', :'rq1') ->> 'error' = 'reservation_closed'
  and (select monthly_balance from public.credit_accounts where payer_id = :'P') = 999,
  'restitution : impossible après un débit');
select tests.ok(public.credits_commit(:'P', :'rq1') ->> 'error' = 'not_found', 'débit : seule la personne qui a réservé peut confirmer');
select (public.credits_reserve(:'P', 'assistant_question', 'k-pia-00000001') ->> 'reservation_id') as rp1 \gset
select (select monthly_balance from public.credit_accounts where payer_id = :'P') as b1 \gset
select public.credits_release(:'P', :'rp1', 'stream_cut') ->> 'ok' as rl \gset
select tests.ok(:b1 = 998 and :'rl'::boolean
  and (select monthly_balance from public.credit_accounts where payer_id = :'P') = 999
  and (select status from public.credit_reservations where id = :'rp1') = 'released'
  and (public.credits_commit(:'P', :'rp1') ->> 'error') = 'reservation_closed',
  'restitution : diffusion coupée → crédit rendu, plus de débit possible');
select tests.ok(public.credits_reserve(:'P', 'action_inconnue', 'k-pia-00000002') ->> 'error' = 'unknown_action'
  and public.credits_reserve(:'P', 'assistant_question', 'court') ->> 'error' = 'bad_idempotency_key',
  'réserve : action inconnue et clé invalide refusées');

-- ================================================================ réserve orpheline
select (public.credits_reserve(:'P', 'tool_analysis', 'k-pia-00000003') ->> 'reservation_id') as rp2 \gset
update public.credit_reservations set expires_at = now() - interval '1 minute' where id = :'rp2';
set role authenticated; set request.jwt.claim.sub = :'P';
select tests.ok((public.credits_status() ->> 'monthly_remaining')::int = 999, 'réserve orpheline : restituée automatiquement à la lecture du solde');
reset role;
select tests.ok((select status from public.credit_reservations where id = :'rp2') = 'expired'
  and exists (select 1 from public.credit_ledger where reservation_id = :'rp2' and kind = 'release' and meta ->> 'reason' = 'orphan_timeout'),
  'réserve orpheline : statut expiré, restitution journalisée');
select (public.credits_reserve(:'P', 'tool_analysis', 'k-pia-00000004') ->> 'reservation_id') as rp3 \gset
update public.credit_reservations set expires_at = now() - interval '1 minute' where id = :'rp3';
select public.credits_maintenance() ->> 'expired_reservations' as mx \gset
select tests.ok(:mx >= 1 and (select status from public.credit_reservations where id = :'rp3') = 'expired',
  'maintenance : les réserves orphelines de tous les comptes sont restituées');

-- ================================================================ ordre mensuel → acheté (essai : 50 crédits)
select tests.ok((public.credits_grant_monthly(:'TT', 'premium', now() + interval '3 days', true, 'grant:tom:trial', 'revenuecat') ->> 'monthly_remaining')::int = 50,
  'essai : 50 crédits (le total est accordé à la conversion)');
select public.credits_purchase(:'TT', 'homi_credits_300', 'tx-tom-1') ->> 'credited' as cr1 \gset
select public.credits_purchase(:'TT', 'homi_credits_300', 'tx-tom-1') ->> 'replay' as cr2 \gset
select tests.ok(:cr1 = 300 and :'cr2'::boolean
  and (select purchased_balance from public.credit_accounts where payer_id = :'TT') = 300,
  'achat : pack de 300 crédité une seule fois (idempotence sur la transaction)');
update public.credit_settings set value = '30' where key = 'cost.tool_analysis';
select (public.credits_reserve(:'TT', 'tool_analysis', 'k-tom-0000001') ->> 'reservation_id') as rt1 \gset
select (public.credits_reserve(:'TT', 'tool_analysis', 'k-tom-0000002') ->> 'reservation_id') as rt2 \gset
select tests.ok((select (from_monthly, from_purchased) = (30, 0) from public.credit_reservations where id = :'rt1')
  and (select (from_monthly, from_purchased) = (20, 10) from public.credit_reservations where id = :'rt2')
  and (select (monthly_balance, purchased_balance) = (0, 290) from public.credit_accounts where payer_id = :'TT'),
  'ordre : les crédits mensuels d''abord, puis les crédits achetés');
select public.credits_commit(:'TT', :'rt1'), public.credits_commit(:'TT', :'rt2');
-- Remboursement partiel : 300 achetés, 10 + 280 consommés → 10 crédits non consommés retirés
update public.credit_settings set value = '280' where key = 'cost.tool_analysis';
select (public.credits_reserve(:'TT', 'tool_analysis', 'k-tom-0000003') ->> 'reservation_id') as rt3 \gset
select public.credits_commit(:'TT', :'rt3');
update public.credit_settings set value = '3' where key = 'cost.tool_analysis';
select public.credits_refund_purchase('tx-tom-1') ->> 'removed' as rm1 \gset
select public.credits_refund_purchase('tx-tom-1') ->> 'replay' as rm2 \gset
select tests.ok(:rm1 = 10 and :'rm2'::boolean
  and (select (meta ->> 'already_consumed')::int from public.credit_ledger where idempotency_key = 'refund:tx-tom-1') = 290
  and (select purchased_balance from public.credit_accounts where payer_id = :'TT') = 0,
  'remboursement : crédits non consommés du pack retirés, part consommée journalisée, solde jamais négatif, idempotent');
select tests.ok(public.credits_reserve(:'TT', 'assistant_question', 'k-tom-0000004') ->> 'error' = 'insufficient_credits'
  and (public.credits_reserve(:'TT', 'assistant_question', 'k-tom-0000005') ->> 'next_renewal') is not null,
  'solde épuisé : refus « insufficient_credits » avec la date de renouvellement');
select tests.ok(public.credits_refund_purchase('tx-inconnue') ->> 'error' = 'not_found'
  and public.credits_purchase(:'TT', 'homi_credits_999', 'tx-tom-2') ->> 'error' = 'unknown_product',
  'achat : produit inconnu et remboursement d''une transaction inconnue refusés');

-- ================================================================ expiration au renouvellement (sans report)
update public.credit_accounts set period_start = now() - interval '2 days' where payer_id = :'P';
select (public.credits_reserve(:'P', 'assistant_question', 'k-pia-00000005') ->> 'reservation_id') as rp4 \gset
select public.credits_purchase(:'P', 'homi_credits_800', 'tx-pia-1');
select public.credits_grant_monthly(:'P', 'premium', now() + interval '30 days', false, 'grant:pia:2', 'revenuecat');
select tests.ok((select (monthly_balance, purchased_balance) = (1000, 800) from public.credit_accounts where payer_id = :'P')
  and exists (select 1 from public.credit_ledger where idempotency_key = 'expire:grant:pia:2' and monthly_delta = -998),
  'renouvellement : les crédits mensuels restants expirent, les crédits achetés restent');
select public.credits_release(:'P', :'rp4') ->> 'ok' as rl4 \gset
select tests.ok(:'rl4'::boolean
  and (select monthly_balance from public.credit_accounts where payer_id = :'P') = 1000
  and (select (meta ->> 'monthly_lapsed')::int from public.credit_ledger where idempotency_key = 'release:' || :'rp4') = 1,
  'renouvellement : une réserve d''une période close ne rend pas de crédit mensuel expiré (journalisé)');

-- ================================================================ formule annuelle : mois suivant décidé par le serveur
select public.credits_grant_monthly(:'U', 'premium', now() + interval '300 days', false, 'grant:uma:1', 'revenuecat');
update public.credit_accounts set period_start = now() - interval '40 days', period_end = now() - interval '10 days' where payer_id = :'U';
select public.credits_reserve(:'U', 'tool_analysis', 'k-uma-00000001') ->> 'ok' as ur \gset
set role authenticated; set request.jwt.claim.sub = :'U';
select tests.ok((public.credits_status() ->> 'monthly_remaining')::int = 997 and (public.credits_status() ->> 'next_renewal')::timestamptz > now(),
  'annuel : nouveau mois de crédits à l''échéance mensuelle, sans attendre le renouvellement annuel');
select tests.ok(:'ur'::boolean and exists (select 1 from public.credit_ledger l join public.credit_accounts a on a.id = l.account_id
    where a.payer_id = :'U' and l.kind = 'expire' and l.monthly_delta = -1000),
  'annuel : le reste du mois précédent expire');
reset role;

-- ================================================================ Famille : solde commun du foyer
select public.credits_grant_monthly(:'F', 'family', now() + interval '30 days', false, 'grant:fanny:1', 'revenuecat');
select tests.ok((select (holder_kind, household_id, monthly_balance) = ('household', :'H2'::uuid, 1500) from public.credit_accounts where payer_id = :'F'),
  'Famille : 1 500 crédits, compte détenu par le foyer');
select (public.credits_reserve(:'G', 'assistant_question', 'k-gael-000001') ->> 'reservation_id') as rg1 \gset
select (public.credits_reserve(:'G2', 'assistant_question', 'k-gina-000001') ->> 'reservation_id') as rg2 \gset
select public.credits_commit(:'G', :'rg1'), public.credits_commit(:'G2', :'rg2');
-- Xavier utilise le solde du foyer, puis quitte le foyer (ancien membre)
select (public.credits_reserve(:'X', 'assistant_question', 'k-xavier-00000') ->> 'reservation_id') as rx1 \gset
select public.credits_commit(:'X', :'rx1');
delete from public.household_members where household_id = :'H2' and user_id = :'X';
select tests.ok(not public._premium_of(:'X'), 'ancien membre : plus de Premium Famille');
select tests.ok((select monthly_balance from public.credit_accounts where payer_id = :'F') = 1497
  and (select count(distinct account_id) from public.credit_reservations where id in (:'rg1', :'rg2')) = 1,
  'Famille : les adultes du foyer dépensent le même solde');
select tests.ok(public.credits_reserve(:'X', 'assistant_question', 'k-xavier-00001') ->> 'error' = 'premium_required'
  and public.credits_reserve(:'C', 'assistant_question', 'k-clara-000001') ->> 'error' = 'premium_required',
  'Famille : la nounou et l''ancien membre n''ont aucun crédit');
set role authenticated; set request.jwt.claim.sub = :'G';
select tests.ok(tests.count('select * from public.credit_accounts') = 1 and (public.credits_status() ->> 'monthly_remaining')::int = 1497
  and (public.credits_status() ->> 'holder_kind') = 'household'
  and tests.count('select * from public.credits_history(null, 50) where kind = ''debit''') = 3
  and tests.count('select * from public.credits_history(null, 50) where kind = ''debit'' and by_me') = 1,
  'Famille : un adulte du foyer lit le solde commun et l''historique (sans contenu de question)');
set request.jwt.claim.sub = :'X';
select tests.ok(tests.count('select * from public.credit_accounts') = 0 and tests.count('select * from public.credit_ledger') = 0
  and (public.credits_status() ->> 'subscribed')::boolean = false,
  'ancien membre : plus aucune lecture du solde ni de l''historique du foyer');
set request.jwt.claim.sub = :'C';
select tests.ok(tests.count('select * from public.credit_accounts') = 0, 'nounou : aucun accès aux crédits du foyer');

-- ================================================================ RLS Premium
set request.jwt.claim.sub = :'Q';
select tests.ok(tests.count('select * from public.credit_accounts') = 1 and tests.count('select * from public.credit_balances') = 1
  and (select monthly_remaining from public.credit_balances) = 1000,
  'Premium : le second adulte lit le solde partagé (vue credit_balances)');
set request.jwt.claim.sub = :'N';
select tests.ok(tests.count('select * from public.credit_accounts where payer_id = ''cc260000-0000-4000-8000-000000000001''') = 0
  and tests.count('select * from public.credit_ledger l join public.credit_accounts a on a.id = l.account_id where a.payer_id = ''cc260000-0000-4000-8000-000000000001''') = 0,
  'RLS : personne extérieure → aucun solde ni historique d''autrui');
select tests.throws($$insert into public.credit_ledger (account_id, kind, amount, idempotency_key) select id, 'adjust', 1000, 'pirate' from public.credit_accounts limit 1$$,
  'RLS : aucune écriture directe dans le grand livre');
select tests.throws($$select public.credits_reserve('cc260000-0000-4000-8000-000000000008', 'assistant_question', 'k-pirate-0001')$$,
  'RLS : un client ne peut pas réserver lui-même');
reset role;
select tests.throws($$update public.credit_ledger set amount = 99999 where idempotency_key = 'grant:pia:1'$$, 'grand livre : modification interdite (append-only)');
select tests.throws($$delete from public.credit_ledger where idempotency_key = 'grant:pia:1'$$, 'grand livre : suppression interdite (append-only)');

-- Achat sans abonnement (pack payé) : crédité au compte de la personne, inutilisable sans abonnement
select public.credits_purchase(:'N', 'homi_credits_300', 'tx-nina-1');
select tests.ok((select purchased_balance from public.credit_accounts where payer_id = :'N') = 300
  and public.credits_reserve(:'N', 'assistant_question', 'k-nina-0002') ->> 'error' = 'premium_required',
  'achat sans abonnement : jamais perdu, mais utilisable seulement avec un abonnement actif');

-- ================================================================ interrupteur de l'IA
update public.credit_settings set value = 'false' where key = 'ai.enabled';
set role authenticated; set request.jwt.claim.sub = :'P';
select tests.ok((public.credits_config() ->> 'ai_enabled')::boolean = false, 'interrupteur : l''application voit l''IA coupée');
reset role;
select tests.ok(public.credits_reserve(:'P', 'assistant_question', 'k-pia-00000006') ->> 'error' = 'ai_disabled', 'interrupteur : aucune réserve quand l''IA est coupée');
update public.credit_settings set value = 'true' where key = 'ai.enabled';

-- ================================================================ concurrence : deux réserves simultanées sur le dernier crédit
select public.credits_grant_monthly(:'V', 'premium', now() + interval '30 days', false, 'grant:vic:1', 'revenuecat');
update public.credit_settings set value = '999' where key = 'cost.journal_summary';
select (public.credits_reserve(:'V', 'journal_summary', 'k-vic-0000000') ->> 'reservation_id') as rv0 \gset
select public.credits_commit(:'V', :'rv0');
update public.credit_settings set value = '5' where key = 'cost.journal_summary';
select tests.ok((select monthly_balance + purchased_balance from public.credit_accounts where payer_id = :'V') = 1, 'concurrence : il reste exactement 1 crédit');
create extension if not exists dblink schema tests;
select format('host=%s port=%s dbname=%s user=%s', split_part(current_setting('unix_socket_directories'), ',', 1),
              current_setting('port'), current_database(), current_user) as conn \gset
select tests.dblink_connect('c1', :'conn'), tests.dblink_connect('c2', :'conn');
select tests.dblink_exec('c1', 'begin');
select r1 from tests.dblink('c1', $q$select public.credits_reserve('cc260000-0000-4000-8000-00000000000b', 'assistant_question', 'k-vic-concur-1')::text$q$) as t(r1 text) \gset
select tests.dblink_send_query('c2', $q$select public.credits_reserve('cc260000-0000-4000-8000-00000000000b', 'assistant_question', 'k-vic-concur-2')::text$q$);
select pg_sleep(0.4);
select tests.ok(tests.dblink_is_busy('c2') = 1, 'concurrence : la seconde réserve attend le verrou de la première');
select tests.dblink_exec('c1', 'commit');
select r2 from tests.dblink_get_result('c2') as t(r2 text) \gset
select tests.dblink_disconnect('c1'), tests.dblink_disconnect('c2');
select tests.ok((:'r1')::jsonb ->> 'ok' = 'true' and (:'r2')::jsonb ->> 'error' = 'insufficient_credits'
  and (select monthly_balance + purchased_balance from public.credit_accounts where payer_id = :'V') = 0
  and (select count(*) from public.credit_reservations r join public.credit_accounts a on a.id = r.account_id where a.payer_id = :'V' and r.status = 'held') = 1,
  'concurrence : une seule réserve obtient le dernier crédit, l''autre reçoit insufficient_credits');

-- ================================================================ invariant du grand livre
select tests.ok(not exists (
  select 1 from public.credit_accounts a
  where a.monthly_balance <> coalesce((select sum(monthly_delta) from public.credit_ledger l where l.account_id = a.id), 0)
     or a.purchased_balance <> coalesce((select sum(purchased_delta) from public.credit_ledger l where l.account_id = a.id), 0)),
  'grand livre : chaque solde est exactement la somme de ses mouvements');
select tests.ok(not exists (select 1 from public.credit_accounts where monthly_balance < 0 or purchased_balance < 0), 'grand livre : aucun solde négatif');
