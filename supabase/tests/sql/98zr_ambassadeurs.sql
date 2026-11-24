-- =====================================================================
-- Programme Ambassadeurs (24/11/2026) : conditions versionnées et publiques, candidature, code, commissions calculées
-- par le serveur seulement, fenêtre de 6 paiements, remboursement annulé, essai gratuit sans commission, isolation.
-- =====================================================================
\set AMB 'd0992000-0000-4000-8000-000000000001'
\set PAR 'd0992000-0000-4000-8000-000000000002'
\set AUT 'd0992000-0000-4000-8000-000000000003'
\set ADM 'd0992000-0000-4000-8000-000000000004'
\set OTH 'd0992000-0000-4000-8000-000000000005'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'AMB', 'amb@exemple.test'), (:'PAR', 'par@exemple.test'), (:'AUT', 'aut@exemple.test'),
  (:'ADM', 'adm@exemple.test'), (:'OTH', 'oth@exemple.test');
insert into public.user_roles (user_id, role) values (:'ADM', 'admin');

-- Calcul : 14,99 € TTC, TVA 20 %, store 15 %, 30 % → 3,19 € (table de la propriétaire)
select tests.ok((select row(tax_cents, store_fee_cents, net_cents, amount_cents)::text from public.ambassador_split(1499, 20, 15, 30)) = '(250,187,1062,319)',
  'ambassadeurs : 14,99 € → TVA 2,50, store 1,87, net 10,62, commission 3,19');

-- Conditions actives lisibles sans compte (site public, simulateur)
set role anon;
select tests.ok((select base_rate from public.ambassador_terms_public) = 30, 'ambassadeurs : conditions actives lisibles sans compte (vue publique, 30 %)');
select tests.ok((select count(*) from public.ambassador_terms_public) = 1, 'ambassadeurs : une seule version visible du public');
select tests.throws($$select public._ambassador_accrue('d0992000-0000-4000-8000-000000000002', 'tx', 'homi_premium_monthly', 1499, 'EUR', 20, 15, now())$$,
  'ambassadeurs : un visiteur ne peut pas créer de commission');
select tests.throws($$select public.ambassador_apply('X', 'x@exemple.test', 'XXXX', 'particulier', null, '[]', null, true)$$, 'ambassadeurs : candidature impossible sans compte');
-- Candidature avec un compte gratuit
reset role; set role authenticated; set request.jwt.claim.sub = :'OTH';
select tests.ok((public.ambassador_apply('Ines Martin', 'ines@exemple.test', 'ines-25', 'particulier', null, '[]', null, true))->>'code' = 'INES25',
  'ambassadeurs : candidature acceptée (code normalisé INES25, en attente)');
set request.jwt.claim.sub = :'AUT';
select tests.ok((public.ambassador_apply('Autre', 'x@exemple.test', 'INES25', 'particulier', null, '[]', null, true))->>'reason' = 'code_taken', 'ambassadeurs : code déjà pris refusé');
select tests.ok((public.ambassador_apply('Autre', 'y@exemple.test', 'NEWCODE', 'particulier', null, '[]', null, false))->>'reason' = 'terms', 'ambassadeurs : conditions non acceptées → refus');

-- Candidature avec compte
reset role; set role authenticated; set request.jwt.claim.sub = :'AMB';
select tests.ok((public.ambassador_apply('Camille Amb', 'amb@exemple.test', 'CAMILLE', 'auto_entrepreneur', '12345678901234', '[]', 'Instagram 3k', true))->>'ok' = 'true',
  'ambassadeurs : candidature avec compte');
select tests.ok((public.my_ambassador())->>'status' = 'pending', 'ambassadeurs : tableau de bord → en attente de validation');
-- Code non encore validé : inutilisable
set request.jwt.claim.sub = :'PAR';
select tests.ok((public.ambassador_claim('CAMILLE'))->>'reason' = 'unknown', 'ambassadeurs : code en attente de validation non utilisable');
-- Personne d'autre que l'admin ne valide
set request.jwt.claim.sub = :'AMB';
select tests.throws($$select public.admin_ambassador_set((select id from public.ambassadors where code = 'CAMILLE'), 'approved')$$, 'ambassadeurs : un ambassadeur ne peut pas se valider');
set request.jwt.claim.sub = :'ADM';
select public.admin_ambassador_set((select id from public.ambassadors where code = 'CAMILLE'), 'approved');
-- Auto-parrainage interdit
set request.jwt.claim.sub = :'AMB';
select tests.ok((public.ambassador_claim('camille'))->>'reason' = 'self', 'ambassadeurs : impossible d’utiliser son propre code');
-- Le parent apporté saisit le code
set request.jwt.claim.sub = :'PAR';
select tests.ok((public.ambassador_claim(' camille ', 'link'))->>'ok' = 'true', 'ambassadeurs : code valide saisi par un nouveau parent (lien)');
select tests.ok((public.ambassador_claim('CAMILLE'))->>'reason' = 'already', 'ambassadeurs : une seule attribution par compte');

-- Paiements réels (webhook, rôle serveur)
reset role; set request.jwt.claim.sub = '';
select tests.ok((public._ambassador_accrue(:'PAR', 'trial-0', 'homi_premium_monthly', 0, 'EUR', 20, 15, now()))->>'reason' = 'free', 'ambassadeurs : essai gratuit → aucune commission');
select tests.ok((public._ambassador_accrue(:'PAR', 'credits-1', 'homi_credits_300', 499, 'EUR', 20, 15, now()))->>'reason' = 'product', 'ambassadeurs : pack de crédits non éligible');
select public._ambassador_accrue(:'PAR', 'tx-' || g, 'homi_premium_monthly', 1499, 'EUR', 20, 15, now() - make_interval(days => 40 - g)) from generate_series(1, 7) g;
select tests.ok((select count(*) from public.ambassador_commissions where referred_user_id = :'PAR') = 6, 'ambassadeurs : 7 paiements → 6 commissions (6 premiers mois seulement)');
select tests.ok((select sum(amount_cents) from public.ambassador_commissions where referred_user_id = :'PAR') = 6 * 319, 'ambassadeurs : 6 × 3,19 € = 19,14 €');
select tests.ok((public._ambassador_accrue(:'PAR', 'tx-1', 'homi_premium_monthly', 1499, 'EUR', 20, 15, now()))->>'duplicate' = 'true', 'ambassadeurs : webhook rejoué → aucun doublon');
select tests.ok((select locked_at is not null from public.referral_attributions where user_id = :'PAR'), 'ambassadeurs : attribution figée au premier paiement');
-- Remboursement
select tests.ok(public._ambassador_reverse('tx-3'), 'ambassadeurs : remboursement → commission annulée');
select tests.ok((select status from public.ambassador_commissions where transaction_id = 'tx-3') = 'reversed', 'ambassadeurs : statut « annulée »');
-- Délai de remboursement (30 jours) puis payable
select public.ambassador_release_due();
select tests.ok((select count(*) from public.ambassador_commissions where status = 'payable') >= 1
  and not exists (select 1 from public.ambassador_commissions where status = 'payable' and available_at > now()), 'ambassadeurs : payable seulement après 30 jours');
-- Changement de conditions : les commissions acquises gardent leur taux et leur version
set role authenticated; set request.jwt.claim.sub = :'ADM';
select public.admin_publish_ambassador_terms('{"base_rate": 25}');
reset role; set request.jwt.claim.sub = '';
select tests.ok((select count(*) from public.ambassador_terms where status = 'active') = 1 and (select base_rate from public.ambassador_terms where status = 'active') = 25,
  'ambassadeurs : nouvelle version publiée, une seule active');
select tests.ok(not exists (select 1 from public.ambassador_commissions where terms_version <> 1 or rate <> 30), 'ambassadeurs : commissions acquises inchangées (version 1, 30 %)');
set role authenticated; set request.jwt.claim.sub = :'ADM';
select tests.throws($$select public.admin_publish_ambassador_terms('{"base_rate": 40, "max_rate": 35}')$$, 'ambassadeurs : taux de base > maximum refusé');
select public.admin_publish_ambassador_terms('{"base_rate": 30}');

-- Isolation : l'ambassadeur voit ses commissions, pas l'identité ; un autre compte ne voit rien
set request.jwt.claim.sub = :'AMB';
select tests.ok((select count(*) from public.ambassador_commissions) = 6, 'ambassadeurs : l’ambassadeur voit ses 6 commissions');
select tests.ok((select count(*) from public.referral_attributions) = 0, 'ambassadeurs : l’ambassadeur ne voit pas la liste des parents apportés');
select tests.ok(((public.my_ambassador())->>'converted')::int = 1, 'ambassadeurs : tableau de bord → 1 abonné converti');
set request.jwt.claim.sub = :'OTH';
select tests.ok((select count(*) from public.ambassador_commissions) = 0 and (select count(*) from public.ambassadors where code = 'CAMILLE') = 0, 'ambassadeurs : un autre ambassadeur ne voit rien de CAMILLE');
select tests.throws($$insert into public.ambassador_commissions (ambassador_id, transaction_id, product_id, period_index, price_cents, tax_cents, store_fee_cents, net_cents, rate, amount_cents, currency, terms_version, occurred_at, available_at)
  values ((select id from public.ambassadors limit 1), 'x', 'p', 1, 1, 0, 0, 1, 30, 1, 'EUR', 1, now(), now())$$, 'ambassadeurs : aucune écriture directe de commission');
-- Déjà abonné avant le code : pas d'attribution rétroactive
reset role; set request.jwt.claim.sub = '';
insert into public.conversion_events (user_id, kind, transaction_id, occurred_at) values (:'AUT', 'first_billing_confirmed', 'aut-1', now());
set role authenticated; set request.jwt.claim.sub = :'AUT';
select tests.ok((public.ambassador_claim('CAMILLE'))->>'reason' = 'already_paying', 'ambassadeurs : pas d’attribution pour un compte déjà payant');
reset role; set request.jwt.claim.sub = '';
