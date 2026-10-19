-- =====================================================================
-- Cycle v2 : valeurs autorisées, isolation stricte entre deux comptes (même foyer compris), export, effacement.
-- =====================================================================
\set INES 'c4c1e000-0000-4000-8000-000000000001'
\set JADE 'c4c1e000-0000-4000-8000-000000000002'
\set FOY  'c4c1e000-0000-4000-8000-0000000000f1'
insert into auth.users (id, email) values (:'INES', 'cy-ines@exemple.test'), (:'JADE', 'cy-jade@exemple.test');
insert into public.households (id, name, created_by) values (:'FOY', 'Foyer Inès', :'INES');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'FOY', :'JADE', 'coparent',
  array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health','documents','pregnancy','lists','names','profile']);

set role authenticated; set request.jwt.claim.sub = :'INES';
insert into public.period_entries (start_date, end_date, flow, note) values ('2026-09-01', '2026-09-05', 'very_heavy', 'Douloureux'), ('2026-09-29', null, 'spotting', null);
select tests.ok(tests.count('select * from public.period_entries') = 2, 'cycle v2 : flux « très léger » et « très abondant » acceptés');
select tests.throws($$insert into public.period_entries (start_date, flow) values ('2026-08-01', 'torrentiel')$$, 'cycle v2 : flux inconnu refusé');
insert into public.symptom_logs (logged_on, symptom_keys, intensities, mood, energy, sleep, stress, note)
  values ('2026-09-02', array['cramps','headache'], '{"cramps":3,"headache":1}', 2, 2, 3, 4, 'Journée difficile');
select tests.ok((select note = 'Journée difficile' and energy = 2 from public.symptom_logs where logged_on = '2026-09-02'), 'cycle v2 : symptômes datés dans le passé, intensité, énergie, note');
select tests.throws($$insert into public.symptom_logs (logged_on, symptom_keys) values ('2026-09-03', array['diagnostic_auto'])$$, 'cycle v2 : symptôme inconnu refusé');
select tests.throws($$insert into public.symptom_logs (logged_on, symptom_keys, intensities) values ('2026-09-03', array['cramps'], '{"nausea":2}')$$, 'cycle v2 : intensité pour un symptôme non coché refusée');
select tests.throws($$insert into public.symptom_logs (logged_on, symptom_keys, intensities) values ('2026-09-03', array['cramps'], '{"cramps":7}')$$, 'cycle v2 : intensité hors de 1 à 3 refusée');
select tests.throws($$insert into public.symptom_logs (logged_on, mood) values ('2026-09-03', 9)$$, 'cycle v2 : humeur hors de 1 à 5 refusée');
insert into public.discharge_logs (amount, color, textures, odor, symptoms, pregnancy, antibiotics, note)
  values ('moderate', 'clear', array['elastic','slippery'], 'none', array['none'], 'no', false, 'Milieu de cycle');
select tests.ok(tests.count('select * from public.discharge_logs') = 1, 'pertes : observation complète enregistrée');
select tests.throws($$insert into public.discharge_logs (amount) values ('beaucoup')$$, 'pertes : quantité inconnue refusée');
select tests.throws($$insert into public.discharge_logs (textures) values (array['gluante'])$$, 'pertes : texture inconnue refusée');
select tests.throws($$insert into public.discharge_logs (symptoms) values (array['none','itching'])$$, 'pertes : « aucun symptôme » combiné à un symptôme refusé');
select tests.throws($$insert into public.discharge_logs (recent_sex) values (true)$$, 'pertes : observation vide refusée');
insert into public.bleeding_logs (occurred_on, kind, amount, pain, pregnancy) values ('2026-09-15', 'after_sex', 'spotting', false, 'no');
select tests.throws($$insert into public.bleeding_logs (occurred_on, kind) values ('2026-09-16', 'normal')$$, 'saignements : type inconnu refusé');
insert into public.cycle_journal (entry_on, body, mood) values ('2026-09-02', 'Note très personnelle', 3);
select tests.throws($$insert into public.cycle_journal (entry_on, body) values ('2026-09-02', '   ')$$, 'journal : entrée vide refusée');
insert into public.cycle_preferences (hide_on_home) values (true);

-- Jade, même foyer avec tous les droits : RIEN du cycle d'Inès, même avec l'identifiant
set request.jwt.claim.sub = :'JADE';
select tests.ok(tests.count('select * from public.period_entries') + tests.count('select * from public.symptom_logs') + tests.count('select * from public.discharge_logs')
  + tests.count('select * from public.bleeding_logs') + tests.count('select * from public.cycle_journal') + tests.count('select * from public.cycle_preferences') = 0,
  'cycle v2 : aucune donnée du cycle visible par un autre membre du foyer');
update public.discharge_logs set note = 'piraté';
delete from public.cycle_journal;
select tests.throws(format($$insert into public.discharge_logs (user_id, color) values (%L, 'white')$$, :'INES'), 'cycle v2 : impossible d''écrire au nom d''un autre compte');
select tests.ok((select coalesce(jsonb_array_length(public.export_my_data() -> 'discharge_logs'), 0)) = 0, 'export : Jade n''exporte pas les pertes d''Inès');
select public.delete_my_cycle_data();

set request.jwt.claim.sub = :'INES';
select tests.ok((select note from public.discharge_logs) = 'Milieu de cycle' and tests.count('select * from public.cycle_journal') = 1, 'cycle v2 : ni modification ni suppression par un autre compte');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'discharge_logs') = 1 and jsonb_array_length(public.export_my_data() -> 'cycle_journal') = 1
  and jsonb_array_length(public.export_my_data() -> 'bleeding_logs') = 1, 'export : pertes, saignements et journal inclus');
select tests.ok(not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('discharge_logs','bleeding_logs','cycle_journal','period_entries','symptom_logs')),
  'cycle v2 : aucune donnée du cycle publiée en temps réel');
select public.delete_my_cycle_data();
select tests.ok(tests.count('select * from public.period_entries') + tests.count('select * from public.symptom_logs') + tests.count('select * from public.discharge_logs')
  + tests.count('select * from public.bleeding_logs') + tests.count('select * from public.cycle_journal') = 0, 'effacement : toutes les données du cycle supprimées');
reset role;
select tests.ok(exists (select 1 from auth.users where id = :'INES'), 'effacement : le compte est conservé');
