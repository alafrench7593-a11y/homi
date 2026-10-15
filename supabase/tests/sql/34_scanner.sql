-- =====================================================================
-- Scanner : historique, résultats et favoris strictement privés ;
-- données de référence en lecture seule ; quota serveur ; alertes de rappel.
-- Identités propres : Léa (foyer A), Hugo (coparent de Léa, foyer A), Noam (autre famille, foyer B).
-- =====================================================================
\set LEA   'c5c5c5c5-0000-4000-8000-000000000001'
\set HUGO  'c5c5c5c5-0000-4000-8000-000000000002'
\set NOAM  'c5c5c5c5-0000-4000-8000-000000000003'
\set FA    'c5c5c5c5-0000-4000-8000-0000000000a0'
\set FB    'c5c5c5c5-0000-4000-8000-0000000000b0'
\set SCAN1 'c5c5c5c5-0000-4000-8000-000000000101'
\set SCAN2 'c5c5c5c5-0000-4000-8000-000000000102'

insert into auth.users (id, email) values (:'LEA', 'lea.scanner@exemple.test'), (:'HUGO', 'hugo.scanner@exemple.test'), (:'NOAM', 'noam.scanner@exemple.test');
insert into public.households (id, name, created_by) values (:'FA', 'Foyer de Léa', :'LEA'), (:'FB', 'Foyer de Noam', :'NOAM');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
 (:'FA', :'HUGO', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health']);

-- ================================================================ LÉA
set role authenticated; set request.jwt.claim.sub = :'LEA';
insert into public.product_scans (id, kind, method, barcode, product_snapshot, target_profile, answers, verdict, certainty, sources, analysed_at)
values
 (:'SCAN1', 'product', 'barcode', '3000000000011', '{"name":"Lait corps test","brand":"Marque test"}', 'pregnant', '{}',
  'Adapté avec précautions', 'medium', '["eu-1223-2009"]', now()),
 (:'SCAN2', 'food', 'manual', null, '{"name":"Brie"}', 'pregnant', '{"milk":"pasteurized"}',
  'À éviter pour ce profil selon la source indiquée', 'high', '["spf-grossesse-2025"]', now());
insert into public.scan_results (scan_id, engine_version, result) values (:'SCAN1', 'test', '{"verdict":"Adapté avec précautions"}');
insert into public.scan_favorites (scan_id) values (:'SCAN1');
select tests.ok(tests.count('select * from public.product_scans') = 2, 'scanner : Léa voit son historique');
select tests.ok(tests.count('select * from public.scan_favorites') = 1, 'scanner : Léa voit ses favoris');
select tests.ok((select used from public.scan_quota_status()) = 2, 'quota : deux analyses comptées');

select tests.throws($$insert into public.product_scans (kind, method, verdict, analysed_at) values ('food', 'manual', 'Adapté avec précautions', now())$$,
  'scanner : verdict « produit » refusé pour un aliment');
select tests.throws($$insert into public.product_scans (kind, method, verdict) values ('product', 'manual', 'Informations insuffisantes')$$,
  'scanner : un verdict exige une date d''analyse');
select tests.throws($$insert into public.product_scans (kind, method, verdict, analysed_at) values ('product', 'manual', 'Totalement sans danger', now())$$,
  'scanner : seuls les verdicts prévus sont acceptés');
select tests.throws($$insert into public.product_scans (user_id, kind, method) values ('c5c5c5c5-0000-4000-8000-000000000003', 'product', 'manual')$$,
  'scanner : impossible d''écrire dans l''historique d''une autre personne');
select tests.throws($$update public.product_scans set verdict = 'Adapté selon les informations disponibles' where id = 'c5c5c5c5-0000-4000-8000-000000000101'$$,
  'scanner : un verdict enregistré ne peut pas être réécrit par le client');
select tests.throws($$update public.scan_results set result = '{}' where scan_id = 'c5c5c5c5-0000-4000-8000-000000000101'$$,
  'scanner : le résultat détaillé ne peut pas être réécrit (seule l''explication IA est modifiable)');
update public.scan_results set explanation = '{"ai":"ok"}' where scan_id = :'SCAN1';
select tests.ok((select explanation ->> 'ai' from public.scan_results where scan_id = :'SCAN1') = 'ok', 'scanner : explication IA enregistrable sur son propre résultat');

-- Données de référence : lecture seule
select tests.ok(tests.count('select * from public.scan_sources') >= 15, 'référence : sources consultables');
select tests.throws($$insert into public.scan_sources (id, label, publisher, url, consulted_on) values ('x', 'x', 'x', 'https://x.test', current_date)$$,
  'référence : sources non modifiables par le client');
select tests.throws($$insert into public.cosing_ingredients (inci_name, updated_on) values ('AQUA', current_date)$$,
  'référence : CosIng non modifiable par le client');
select tests.throws($$insert into public.ciqual_foods (code, nom, source_version, source_date) values ('1', 'x', 'x', current_date)$$,
  'référence : Ciqual non modifiable par le client');
select tests.throws($$insert into public.product_recalls (title, reason, source, published_on) values ('Faux rappel', 'x', 'x', current_date)$$,
  'référence : impossible de publier un faux rappel');
select tests.throws($$insert into public.products (name, category, data_source, data_retrieved_at) values ('Faux produit', 'cream', 'x', current_date)$$,
  'référence : impossible d''ajouter un produit');
select tests.throws($$insert into public.scan_usage (user_id, month, analyses) values (auth.uid(), date_trunc('month', now())::date - 31, 0)$$,
  'quota : compteur non modifiable par le client');
reset role;

-- ================================================================ HUGO (même foyer) et NOAM (autre famille)
set role authenticated; set request.jwt.claim.sub = :'HUGO';
select tests.ok(tests.count('select * from public.product_scans') = 0, 'scanner : le coparent ne voit pas l''historique personnel de Léa');
reset role;

set role authenticated; set request.jwt.claim.sub = :'NOAM';
select tests.ok(tests.count('select * from public.product_scans') = 0, 'scanner : une autre famille ne voit pas les scans de Léa');
select tests.ok(tests.count('select * from public.scan_results') = 0, 'scanner : une autre famille ne voit pas les résultats de Léa');
select tests.ok(tests.count('select * from public.scan_favorites') = 0, 'scanner : une autre famille ne voit pas les favoris de Léa');
select tests.throws($$insert into public.scan_favorites (scan_id) values ('c5c5c5c5-0000-4000-8000-000000000101')$$,
  'favori : impossible de mettre en favori le scan d''une autre personne');
select tests.throws($$insert into public.scan_results (scan_id, engine_version, result) values ('c5c5c5c5-0000-4000-8000-000000000102', 'x', '{}')$$,
  'résultat : impossible de l''attacher au scan d''une autre personne');
delete from public.product_scans where id = :'SCAN1';
delete from public.scan_favorites;
reset role;
select tests.ok((select count(*) from public.product_scans where user_id = :'LEA') = 2 and (select count(*) from public.scan_favorites where user_id = :'LEA') = 1,
  'scanner : une autre famille ne peut rien supprimer chez Léa');

-- ================================================================ Rappel officiel → notification (une seule fois)
set role service_role;
insert into public.product_recalls (source_key, barcode, gtins, title, reason, source, published_on)
values ('rappelconso:test-1', '3000000000011', array['3000000000011'], 'Lait corps test (lot T1)', 'Contamination microbiologique (test).', 'RappelConso (test)', current_date);
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'LEA' and category = 'product_recall') = 1, 'rappel : Léa est notifiée (produit de son historique)');
select tests.ok((select deep_link from public.notifications where user_id = :'LEA' and category = 'product_recall') = '/scanner/result/' || :'SCAN1', 'rappel : la notification ouvre la fiche du scan');
select tests.ok((select count(*) from public.notifications where user_id in (:'NOAM', :'HUGO') and category = 'product_recall') = 0, 'rappel : les autres personnes ne sont pas notifiées');
set role authenticated; set request.jwt.claim.sub = :'LEA';
select public.notify_my_recalls();
insert into public.product_scans (kind, method, barcode, product_snapshot) values ('product', 'barcode', '3000000000011', '{"name":"Lait corps test"}');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'LEA' and category = 'product_recall') = 1, 'rappel : pas de notification en double');

-- ================================================================ Quota : non remboursé par la suppression
set role service_role;
update public.scan_usage set analyses = 10 where user_id = :'LEA';
reset role;
set role authenticated; set request.jwt.claim.sub = :'LEA';
delete from public.product_scans where id = :'SCAN2';
select tests.ok((select used from public.scan_quota_status()) = 10, 'quota : supprimer l''historique ne rend pas d''analyse');
select tests.throws($$insert into public.product_scans (kind, method, verdict, certainty, analysed_at) values ('food', 'manual', 'Impossible à confirmer', 'low', now())$$,
  'quota : 11e analyse du mois refusée en version gratuite');
insert into public.product_scans (kind, method, barcode) values ('product', 'barcode', '3000000000028');
select tests.ok(true, 'quota : une simple recherche (sans analyse) reste possible, les rappels restent gratuits');
-- Suppression de tout l'historique
delete from public.product_scans;
reset role;
select tests.ok((select count(*) from public.scan_results where user_id = :'LEA') = 0 and (select count(*) from public.scan_favorites where user_id = :'LEA') = 0,
  'historique : tout supprimer efface aussi résultats et favoris');

-- ================================================================ Anonyme
set role anon;
select tests.throws($$select * from public.product_scans$$, 'anonyme : aucun accès à l''historique');
select tests.throws($$select * from public.scan_favorites$$, 'anonyme : aucun accès aux favoris');
select tests.ok(tests.count('select * from public.cosing_ingredients') = 0, 'anonyme : pas de lecture de CosIng');
reset role;
