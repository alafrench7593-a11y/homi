-- =====================================================================
-- Cycle : réponses facultatives (rapports, douleurs, pertes), cohérence, isolation entre comptes, effacement.
-- =====================================================================
\set MAYA 'c4c1e000-0000-4000-8000-000000000011'
\set LOU  'c4c1e000-0000-4000-8000-000000000012'
insert into auth.users (id, email) values (:'MAYA', 'adv-maya@exemple.test'), (:'LOU', 'adv-lou@exemple.test');

set role authenticated; set request.jwt.claim.sub = :'MAYA';
-- Rapport sans aucun détail : toujours possible
insert into public.intercourse_logs (occurred_on) values ('2026-10-10');
select tests.ok((select condom is null and pregnancy_wish is null from public.intercourse_logs where occurred_on = '2026-10-10'),
  'rapport : enregistrable sans aucun détail (absence de réponse ≠ « non »)');
insert into public.intercourse_logs (occurred_on, occurred_time, condom, condom_incident, usual_contraception, ejaculation, ec_taken, pregnancy_wish)
  values ('2026-10-12', '22:30', 'yes', 'broke', 'no', 'prefer_not', 'no', 'no');
select tests.ok(tests.count('select * from public.intercourse_logs') = 2, 'rapport : réponses facultatives, « je préfère ne pas répondre » accepté');
select tests.throws($$insert into public.intercourse_logs (occurred_on, condom, condom_incident) values ('2026-10-13', 'no', 'broke')$$,
  'rapport : incident de préservatif refusé si aucun préservatif');
select tests.throws($$insert into public.intercourse_logs (occurred_on, condom) values ('2026-10-13', 'peut-être')$$, 'rapport : valeur inconnue refusée');
update public.intercourse_logs set ec_taken = 'yes', professional_seen = 'yes' where occurred_on = '2026-10-12';
select tests.ok((select ec_taken = 'yes' and updated_at >= created_at from public.intercourse_logs where occurred_on = '2026-10-12'), 'rapport : réponse modifiable');

-- Douleurs dans la fiche du jour
insert into public.symptom_logs (logged_on, symptom_keys, pain_intensity, pain_locations, pain_pattern, pain_impact, pain_associated, pain_relief)
  values ('2026-10-05', array['cramps'], 8, array['lower_abdomen','lower_back'], 'worse', array['work','sleep'], array['nausea'], 'not_helped');
select tests.ok((select pain_intensity = 8 and 'lower_back' = any(pain_locations) from public.symptom_logs where logged_on = '2026-10-05'), 'douleurs : intensité 0–10, zones, retentissement');
select tests.throws($$insert into public.symptom_logs (logged_on, pain_intensity) values ('2026-10-06', 11)$$, 'douleurs : intensité au-delà de 10 refusée');
select tests.throws($$insert into public.symptom_logs (logged_on, pain_locations) values ('2026-10-06', array['ovaire_gauche'])$$, 'douleurs : zone inconnue refusée');
select tests.throws($$insert into public.symptom_logs (logged_on, pain_impact) values ('2026-10-06', array['none','work'])$$, 'douleurs : « aucun retentissement » exclusif');

-- Pertes : nouvelles valeurs
insert into public.discharge_logs (amount, color, textures, symptoms) values ('usual', 'blood', array['unsure'], array['pelvic_pain','fever']);
select tests.ok(tests.count('select * from public.discharge_logs') = 1, 'pertes : quantité habituelle, présence de sang, fièvre, douleur pelvienne acceptées');

-- Préférences : conseils activés et notifications neutres par défaut
insert into public.cycle_preferences (track_intercourse) values (true);
select tests.ok((select advice_enabled and not detailed_notifications from public.cycle_preferences), 'préférences : conseils activés, notifications neutres par défaut');

-- Lou ne voit, ne modifie ni ne supprime rien
set request.jwt.claim.sub = :'LOU';
select tests.ok(tests.count('select * from public.intercourse_logs') + tests.count('select * from public.symptom_logs') + tests.count('select * from public.discharge_logs') = 0,
  'isolation : rapports, douleurs et pertes invisibles pour un autre compte');
update public.intercourse_logs set pregnancy_wish = 'yes';
delete from public.symptom_logs;
select tests.throws(format($$insert into public.intercourse_logs (user_id, occurred_on) values (%L, '2026-10-01')$$, :'MAYA'), 'isolation : impossible d''écrire au nom d''un autre compte');

set request.jwt.claim.sub = :'MAYA';
select tests.ok((select pregnancy_wish = 'no' from public.intercourse_logs where occurred_on = '2026-10-12') and tests.count('select * from public.symptom_logs') = 1,
  'isolation : ni modification ni suppression par un autre compte');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'personal' -> 'intercourse_logs') = 2
  and (public.export_my_data() -> 'personal' -> 'intercourse_logs')::text like '%"condom_incident": "broke"%', 'export : rapports inclus avec leurs détails');
select public.delete_my_cycle_data();
select tests.ok(tests.count('select * from public.intercourse_logs') + tests.count('select * from public.symptom_logs') + tests.count('select * from public.discharge_logs') = 0,
  'effacement : rapports, douleurs et pertes supprimés');
reset role;
