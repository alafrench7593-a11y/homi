-- =====================================================================
-- HOMI Ambassadors (24/11/2026) : candidature, attribution figée, commissions idempotentes sur l'encaissé net,
-- fin de période, remboursement (avant et après versement), seuil de versement, cloisonnement des données.
-- =====================================================================
\set A 'aaaa0000-0000-4000-8000-0000000000a1'
\set C 'aaaa0000-0000-4000-8000-0000000000c1'
\set B 'aaaa0000-0000-4000-8000-0000000000b1'
\set D 'aaaa0000-0000-4000-8000-0000000000d1'
\set ADM 'aaaa0000-0000-4000-8000-0000000000ad'
\set FIN 'aaaa0000-0000-4000-8000-0000000000f1'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'A', 'amb-a@exemple.test'), (:'C', 'amb-c@exemple.test'), (:'B', 'client-b@exemple.test'),
  (:'D', 'client-d@exemple.test'), (:'ADM', 'admin-amb@exemple.test'), (:'FIN', 'finance-amb@exemple.test');
insert into public.user_roles (user_id, role) values (:'ADM', 'admin'), (:'FIN', 'finance');

-- candidatures
set role authenticated; set request.jwt.claim.sub = :'A';
select tests.throws($$select public.affiliate_apply('A', 'Sarah', 'M', 'sarah@exemple.test', 'FR', 'fr', 'maman', 'v1')$$, 'ambassadeurs : code trop court refusé');
select tests.ok((public.affiliate_apply('sarah', 'Sarah', 'M', 'sarah@exemple.test', 'FR', 'fr', 'maman', 'v1')).status = 'pending', 'ambassadeurs : candidature en attente');
set request.jwt.claim.sub = :'C';
select tests.throws($$select public.affiliate_apply('sarah', 'Claire', 'D', 'claire@exemple.test', 'FR', 'fr', 'papa', 'v1')$$, 'ambassadeurs : code déjà pris refusé');
select public.affiliate_apply('claire', 'Claire', 'D', 'claire@exemple.test', 'BE', 'fr', 'createur', 'v1');
select tests.ok((select count(*) from public.affiliates) = 1, 'ambassadeurs : C ne voit que sa propre fiche');
select tests.throws($$select public.affiliate_set_status((select id from public.affiliates where code = 'claire'), 'active')$$, 'ambassadeurs : un ambassadeur ne peut pas se valider');

-- client B : code d'un ambassadeur pas encore validé → inconnu
set request.jwt.claim.sub = :'B';
select tests.ok(public.affiliate_attach('sarah') = 'unknown_code', 'attribution : ambassadeur non validé → code inconnu');

-- validation par l'administration
set request.jwt.claim.sub = :'ADM';
select public.affiliate_set_status(id, 'active') from public.affiliates where code in ('sarah', 'claire');
reset role;
select tests.ok((select count(*) from public.affiliate_audit_logs where action = 'status:active') = 2, 'administration : validations journalisées');

-- clic anonyme, auto-affiliation, attribution
set role anon; set request.jwt.claim.sub = '';
select tests.ok(public.affiliate_record_click('sarah', 'tiktok', 'sommeil'), 'clic : enregistré pour un code actif');
select tests.ok(not public.affiliate_record_click('inconnu'), 'clic : code inconnu ignoré');
set role authenticated; set request.jwt.claim.sub = :'A';
select tests.ok(public.affiliate_attach('sarah') = 'self', 'attribution : auto-affiliation refusée');
set request.jwt.claim.sub = :'B';
select tests.ok(public.affiliate_attach('claire', 'link') = 'ok', 'attribution : premier code');
select tests.ok(public.affiliate_attach('SARAH', 'code', 'tiktok') = 'ok', 'attribution : dernier code valide avant achat gagne (casse ignorée)');
select tests.throws($$select public.affiliate_record_commission(auth.uid(), 'tx-hack', 'homi_premium_monthly', 1062, 'EUR', now())$$, 'commission : un client ne peut pas écrire de commission');
select tests.ok((select count(*) from public.affiliate_ledger) = 0, 'cloisonnement : un client ne lit pas le grand livre');

-- webhook (rôle serveur) : 30 % de 10,62 € net = 3,186 → 3,19 € ; doublon sans effet
reset role;
select tests.ok(public.affiliate_record_commission(:'B', 'tx-1', 'homi_premium_monthly', 1062, 'EUR', now()) = 'ok', 'commission : premier paiement');
select tests.ok(public.affiliate_record_commission(:'B', 'tx-1', 'homi_premium_monthly', 1062, 'EUR', now()) = 'duplicate', 'commission : webhook reçu deux fois → une seule commission');
select tests.ok((select amount_minor from public.affiliate_ledger where transaction_id = 'tx-1' and kind = 'commission') = 319, 'commission : 30 % de l''encaissé net (10,62 € → 3,19 €, arrondi half-up)');
select tests.ok((select a.code from public.affiliate_ledger l join public.affiliates a on a.id = l.affiliate_id where l.transaction_id = 'tx-1') = 'sarah', 'commission : versée au dernier code valide');
set role authenticated; set request.jwt.claim.sub = :'B';
select tests.ok(public.affiliate_attach('claire') = 'locked', 'attribution : figée après le premier paiement');
reset role;
select tests.ok(public.affiliate_record_commission(:'B', 'tx-2', 'homi_premium_monthly', 1062, 'EUR', now() + interval '1 month') = 'ok', 'commission : renouvellement dans la période');
select tests.ok(public.affiliate_record_commission(:'B', 'tx-7', 'homi_premium_monthly', 1062, 'EUR', now() + interval '6 months 1 day') = 'period_over', 'commission : rien après les 6 mois commissionnés');

-- fenêtre d'attribution expirée (code saisi il y a 40 jours, premier paiement aujourd'hui)
set role authenticated; set request.jwt.claim.sub = :'D';
select public.affiliate_attach('sarah');
reset role;
update public.affiliate_attributions set attributed_at = now() - interval '40 days' where user_id = :'D';
select tests.ok(public.affiliate_record_commission(:'D', 'tx-d1', 'homi_premium_monthly', 1062, 'EUR', now()) = 'attribution_expired', 'attribution : au-delà de 30 jours, pas de commission');

-- remboursement d'une commission en attente
select tests.ok(public.affiliate_reverse_commission('tx-2') = 'ok', 'remboursement : écriture négative');
select tests.ok(public.affiliate_reverse_commission('tx-2') = 'duplicate', 'remboursement : reçu deux fois → une seule écriture');
select tests.ok((select status from public.affiliate_ledger where transaction_id = 'tx-2' and kind = 'commission') = 'reversed'
  and (select amount_minor from public.affiliate_ledger where transaction_id = 'tx-2' and kind = 'commission') = 319, 'remboursement : montant d''origine conservé, statut annulé');

-- disponibilité après délai, seuil, versement, remboursement après versement
update public.affiliate_ledger set available_at = now() - interval '1 day' where transaction_id = 'tx-1';
select tests.ok(public.affiliate_release_due() = 1, 'délai : commission devenue disponible');
set role authenticated; set request.jwt.claim.sub = :'FIN';
select tests.throws($$select public.affiliate_record_payout((select id from public.affiliates where code = 'sarah'), 'EUR', 'VIR-1')$$, 'versement : seuil de 30 € non atteint');
reset role;
insert into public.affiliate_ledger (affiliate_id, kind, status, amount_minor, currency, note, created_by)
  select id, 'adjustment', 'available', 3000, 'EUR', 'bonus de lancement', :'ADM' from public.affiliates where code = 'sarah';
set role authenticated; set request.jwt.claim.sub = :'A';
select tests.throws($$select public.affiliate_record_payout((select id from public.affiliates where code = 'sarah'), 'EUR', 'VIR-X')$$, 'versement : réservé à la finance');
set request.jwt.claim.sub = :'FIN';
select tests.ok((public.affiliate_record_payout((select id from public.affiliates where code = 'sarah'), 'EUR', 'VIR-1')).amount_minor = 3319, 'versement : total disponible versé (commission + bonus)');
reset role;
select tests.ok(public.affiliate_reverse_commission('tx-1') = 'ok', 'remboursement après versement : accepté');
select tests.ok((select status from public.affiliate_ledger where transaction_id = 'tx-1' and kind = 'reversal') = 'available'
  and (select amount_minor from public.affiliate_ledger where transaction_id = 'tx-1' and kind = 'reversal') = -319, 'remboursement après versement : déduit du prochain versement');

-- tableau de bord : agrégats, aucune donnée client
set role authenticated; set request.jwt.claim.sub = :'A';
select tests.ok((public.affiliate_my_summary() ->> 'paying')::int = 1 and (public.affiliate_my_summary() ->> 'clicks_30d')::int = 1, 'tableau de bord : agrégats');
select tests.ok(public.affiliate_my_summary()::text not like '%' || :'B' || '%' and public.affiliate_my_summary()::text not like '%client-b%', 'tableau de bord : aucun identifiant ni e-mail de client');
select tests.ok((select count(*) from public.affiliate_attributions) = 0, 'cloisonnement : un ambassadeur ne lit pas les attributions');
select tests.ok((select count(*) from public.affiliates where code = 'claire') = 0, 'cloisonnement : un ambassadeur ne lit pas la fiche d''un autre');
reset role; set request.jwt.claim.sub = '';
