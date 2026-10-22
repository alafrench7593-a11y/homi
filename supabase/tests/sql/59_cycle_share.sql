-- =====================================================================
-- Partage du cycle avec le ou la partenaire : Premium, même foyer, éléments choisis, jamais l'intime, révocable.
-- =====================================================================
\set SA 'c5a1e000-0000-4000-8000-000000000001'
\set SB 'c5a1e000-0000-4000-8000-000000000002'
\set SC 'c5a1e000-0000-4000-8000-000000000003'
\set FO 'c5a1e000-0000-4000-8000-0000000000f0'
reset role;
insert into auth.users (id, email) values (:'SA', 'share-a@exemple.test'), (:'SB', 'share-b@exemple.test'), (:'SC', 'share-c@exemple.test');
insert into public.households (id, name, created_by) values (:'FO', 'Foyer partage', :'SA');
insert into public.household_members (household_id, user_id, role) values (:'FO', :'SA', 'owner'), (:'FO', :'SB', 'coparent') on conflict do nothing;
update public.profiles set display_name = 'Camille' where id = :'SA';

set role authenticated; set request.jwt.claim.sub = :'SA';
insert into public.period_entries (start_date, end_date) values (current_date - 30, current_date - 26), (current_date - 2, null);
insert into public.cycle_preferences (user_id, track_intercourse) values (:'SA', true);
insert into public.intercourse_logs (occurred_on, condom) values (current_date - 1, 'no');
insert into public.symptom_logs (logged_on, symptom_keys, moods, note, tags) values (current_date - 1, array['cramps','libido_up','dyspareunia'], array['calm'], 'note privée', array['secret']);
insert into public.contraception_logs (kind) values ('pill_missed');
select tests.throws(format($$insert into public.cycle_shares (partner_id) values (%L)$$, :'SB'), 'partage : fonction Premium');
reset role;
select tests.set_premium(:'SA', true);
set role authenticated; set request.jwt.claim.sub = :'SA';
select tests.throws(format($$insert into public.cycle_shares (partner_id) values (%L)$$, :'SC'), 'partage : seulement avec un membre du foyer');
insert into public.cycle_shares (partner_id, share_period, share_mood, share_symptoms) values (:'SB', true, true, true);
select tests.ok(tests.count('select * from public.cycle_shares') = 1, 'partage : créé, éléments choisis');
reset role;

set role authenticated; set request.jwt.claim.sub = :'SB';
select tests.ok((select display_name = 'Camille' and not paused from public.cycle_shared_with_me()), 'partenaire : voit le partage et le prénom');
select tests.ok(jsonb_array_length(public.partner_cycle(:'SA') -> 'periods') = 2, 'partenaire : dates des règles partagées');
select tests.ok((public.partner_cycle(:'SA') -> 'symptoms' -> 0 -> 'keys') = '["cramps"]'::jsonb, 'partenaire : symptômes sans libido ni douleur intime');
select tests.ok(public.partner_cycle(:'SA')::text !~ '(note privée|secret|pill_missed|intercourse|condom)', 'partenaire : jamais rapports, contraception, notes ni étiquettes');
select tests.ok(tests.count('select * from public.period_entries') + tests.count('select * from public.intercourse_logs') + tests.count('select * from public.symptom_logs') = 0, 'partenaire : aucun accès direct aux tables');
select tests.throws(format($$update public.cycle_shares set share_fertile = true where owner_id = %L$$, :'SA') || '; select 1/(select count(*) from public.cycle_shares where share_fertile)', 'partenaire : ne peut pas élargir le partage');
reset role;
set role authenticated; set request.jwt.claim.sub = :'SC';
select tests.throws(format($$select public.partner_cycle(%L)$$, :'SA'), 'autre personne : aucun partage');
reset role;

-- Fin d'abonnement : partage en pause, rien n'est supprimé
select tests.set_premium(:'SA', false);
set role authenticated; set request.jwt.claim.sub = :'SB';
select tests.ok((public.partner_cycle(:'SA') ->> 'paused')::boolean and (select paused from public.cycle_shared_with_me()), 'fin d''abonnement : partage en pause');
reset role;
select tests.set_premium(:'SA', true);
-- Révocation par la personne, puis export et effacement
set role authenticated; set request.jwt.claim.sub = :'SA';
select tests.ok(jsonb_array_length(public.export_my_data() -> 'cycle_shares') = 1, 'export RGPD : partages inclus');
delete from public.cycle_shares where partner_id = :'SB';
select tests.ok(tests.count('select * from public.cycle_shares') = 0, 'révocation immédiate');
insert into public.cycle_shares (partner_id) values (:'SB');
select public.delete_my_cycle_data();
select tests.ok(tests.count('select * from public.cycle_shares') = 0, 'effacer le cycle arrête aussi les partages');
reset role;
