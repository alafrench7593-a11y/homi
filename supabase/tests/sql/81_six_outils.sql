-- Six outils (07/11/2026) : rappels partagés, suivi PMA, alertes rappels produits pour le foyer,
-- routines en pictogrammes, garde alternée.
\set SA 'f9b00000-0000-4000-8000-000000000001'
\set SB 'f9b00000-0000-4000-8000-000000000002'
\set SC 'f9b00000-0000-4000-8000-000000000003'
\set SH 'f9b00000-0000-4000-8000-0000000000f1'
reset role;
insert into auth.users (id, email) values (:'SA', 'six-a@exemple.test'), (:'SB', 'six-b@exemple.test'), (:'SC', 'six-c@exemple.test');
insert into public.households (id, name, created_by) values (:'SH', 'Foyer six outils', :'SA');
insert into public.household_members (household_id, user_id, role) values (:'SH', :'SA', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'SH', :'SB', 'coparent') on conflict do nothing;

-- 1. Rappels partagés -------------------------------------------------------------------------
set role authenticated; set request.jwt.claim.sub = :'SA';
insert into public.reminders (household_id, category, title, schedule, shared) values
  (:'SH', 'custom', 'Partagé', '{"type":"daily","hour":8,"minute":0}', true),
  (:'SH', 'custom', 'Privé', '{"type":"daily","hour":9,"minute":0}', false);
set request.jwt.claim.sub = :'SB';
select tests.ok((select count(*) from public.reminders where user_id = 'f9b00000-0000-4000-8000-000000000001') = 1,
  'rappel partagé : le membre du foyer voit seulement le rappel partagé');
update public.reminders set title = 'Modifié' where title = 'Partagé';
select tests.ok((select count(*) from public.reminders where title = 'Modifié') = 0,
  'rappel partagé : le membre du foyer ne peut pas le modifier');
delete from public.reminders where title = 'Partagé';
set request.jwt.claim.sub = :'SA';
select tests.ok((select count(*) from public.reminders where title = 'Partagé') = 1,
  'rappel partagé : le membre du foyer ne peut pas le supprimer');
set request.jwt.claim.sub = :'SC';
select tests.ok((select count(*) from public.reminders where user_id = 'f9b00000-0000-4000-8000-000000000001') = 0,
  'rappel partagé : invisible hors du foyer');

-- 2. Suivi PMA (strictement personnel) ---------------------------------------------------------
-- outil réservé (Premium ou achat à vie) depuis la fin du mois gratuit (08/11/2026)
reset role; select tests.set_premium(:'SA', true); set role authenticated;
set request.jwt.claim.sub = :'SA';
insert into public.pma_protocols (id, kind, label, started_on) values ('f9b00000-0000-4000-8000-0000000000c1', 'fiv', 'FIV 1', current_date);
insert into public.pma_meds (id, protocol_id, name, route, dose_text, take_time)
  values ('f9b00000-0000-4000-8000-0000000000d1', 'f9b00000-0000-4000-8000-0000000000c1', 'Traitement A', 'injection', 'selon ordonnance', '20:00');
insert into public.pma_logs (protocol_id, med_id, kind) values ('f9b00000-0000-4000-8000-0000000000c1', 'f9b00000-0000-4000-8000-0000000000d1', 'dose');
select tests.ok((select count(*) from public.pma_logs) = 1, 'PMA : la personne enregistre une prise');
set request.jwt.claim.sub = :'SB';
select tests.ok((select count(*) from public.pma_protocols) + (select count(*) from public.pma_meds) + (select count(*) from public.pma_logs) = 0,
  'PMA : rien n''est visible par le conjoint ni le foyer');
select tests.throws($$insert into public.pma_meds (protocol_id, name) values ('f9b00000-0000-4000-8000-0000000000c1', 'Intrus')$$,
  'PMA : impossible de rattacher un traitement au protocole d''une autre personne');
select tests.throws($$insert into public.pma_meds (protocol_id, name, start_on, end_on) values ('f9b00000-0000-4000-8000-0000000000c1', 'x', current_date, current_date - 1)$$,
  'PMA : fin avant début refusée');

-- 3. Alertes produits rappelés pour le foyer (opt-in) ------------------------------------------
set request.jwt.claim.sub = :'SA';
insert into public.product_scans (barcode, method, confirmed) values ('3000000000017', 'manual', true);
reset role;
insert into public.product_recalls (barcode, title, reason, source, published_on) values ('3000000000017', 'Produit test 1', 'Motif test', 'test', current_date);
select tests.ok((select count(*) from public.notifications where user_id = 'f9b00000-0000-4000-8000-000000000001' and category = 'product_recall') = 1,
  'rappel produit : la personne qui l''a scanné est prévenue (inchangé)');
select tests.ok((select count(*) from public.notifications where user_id = 'f9b00000-0000-4000-8000-000000000002' and category = 'product_recall') = 0,
  'rappel produit : le foyer n''est PAS prévenu sans accord');
set role authenticated; set request.jwt.claim.sub = :'SA';
insert into public.recall_watch_prefs (share_household) values (true);
reset role;
insert into public.product_recalls (barcode, title, reason, source, published_on) values ('3000000000017', 'Produit test 2', 'Motif test', 'test', current_date);
select tests.ok((select count(*) from public.notifications where user_id = 'f9b00000-0000-4000-8000-000000000002' and category = 'product_recall' and deep_link = '/scanner/recalls') = 1,
  'rappel produit : le foyer est prévenu une fois après accord');
select tests.ok((select count(*) from public.notifications where user_id = 'f9b00000-0000-4000-8000-000000000003' and category = 'product_recall') = 0,
  'rappel produit : personne hors du foyer jamais prévenue');
select tests.ok((select count(*) from public.notifications where user_id = 'f9b00000-0000-4000-8000-000000000001' and category = 'product_recall') = 2,
  'rappel produit : pas de doublon pour la personne qui a scanné');

-- 4. Routines en pictogrammes ------------------------------------------------------------------
set role authenticated; set request.jwt.claim.sub = :'SA';
insert into public.kid_routines (id, household_id, title, moment, steps) values
  ('f9b00000-0000-4000-8000-0000000000e1', :'SH', 'Le matin', 'morning', '[{"icon":"toothbrush","label":"Dents"},{"icon":"tshirt-crew","label":"Habits"}]');
set request.jwt.claim.sub = :'SB';
insert into public.kid_routine_checks (household_id, routine_id, on_date, step) values (:'SH', 'f9b00000-0000-4000-8000-0000000000e1', current_date, 0);
select tests.ok((select count(*) from public.kid_routine_checks) = 1, 'routine : l''autre parent coche une étape');
select tests.throws($$insert into public.kid_routine_checks (household_id, routine_id, on_date, step) values ('f9b00000-0000-4000-8000-0000000000f1', 'f9b00000-0000-4000-8000-0000000000e1', current_date, 0)$$,
  'routine : une étape n''est cochée qu''une fois par jour');
select tests.throws($$insert into public.kid_routines (household_id, title, steps) values ('f9b00000-0000-4000-8000-0000000000f1', 'Vide', '[]')$$,
  'routine : au moins une étape');
set request.jwt.claim.sub = :'SC';
select tests.ok((select count(*) from public.kid_routines) = 0, 'routine : invisible hors du foyer');

-- 5. Garde alternée ----------------------------------------------------------------------------
set request.jwt.claim.sub = :'SA';
insert into public.custody_plans (id, household_id, label_a, label_b, pattern, cycle, anchor_on) values
  ('f9b00000-0000-4000-8000-0000000000b1', :'SH', 'Chez maman', 'Chez papa', 'week', 'AAAAAAABBBBBBB', current_date);
insert into public.custody_exceptions (household_id, plan_id, from_on, to_on, side) values (:'SH', 'f9b00000-0000-4000-8000-0000000000b1', current_date + 20, current_date + 27, 'A');
select tests.throws($$insert into public.custody_plans (household_id, label_a, label_b, cycle, anchor_on) values ('f9b00000-0000-4000-8000-0000000000f1', 'A', 'B', 'AABX', current_date)$$,
  'garde alternée : rythme invalide refusé');
set request.jwt.claim.sub = :'SB';
select tests.ok((select count(*) from public.custody_plans) = 1 and (select count(*) from public.custody_exceptions) = 1, 'garde alternée : l''autre parent voit le rythme');
set request.jwt.claim.sub = :'SC';
select tests.ok((select count(*) from public.custody_plans) = 0, 'garde alternée : invisible hors du foyer');

-- 6. Export ------------------------------------------------------------------------------------
set request.jwt.claim.sub = :'SA';
select tests.ok(jsonb_array_length(public.export_my_data()->'pma_logs') = 1 and jsonb_array_length(public.export_my_data()->'custody_plans') = 1,
  'export RGPD : nouveaux outils inclus');
set request.jwt.claim.sub = :'SB';
select tests.ok(jsonb_array_length(public.export_my_data()->'pma_logs') = 0, 'export RGPD : PMA de l''autre personne jamais exportée');
reset role;
