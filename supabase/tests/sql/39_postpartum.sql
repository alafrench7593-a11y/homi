-- =====================================================================
-- Suivi post-partum : privé par défaut, partage choisi par la mère,
-- filtré côté serveur, révocation immédiate, rien pour les autres.
-- Iris (mère), Jules (conjoint, foyer avec TOUS les domaines), Zoé (inconnue).
-- =====================================================================
\set IRIS  'd1d1d1d1-0000-4000-8000-000000000001'
\set JULES 'd1d1d1d1-0000-4000-8000-000000000002'
\set ZOE   'd1d1d1d1-0000-4000-8000-000000000003'
\set FOYER 'd1d1d1d1-0000-4000-8000-0000000000f0'

insert into auth.users (id, email) values (:'IRIS', 'pp-iris@exemple.test'), (:'JULES', 'pp-jules@exemple.test'), (:'ZOE', 'pp-zoe@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer d''Iris', :'IRIS');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
 (:'FOYER', :'JULES', 'coparent', array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health','documents','pregnancy','lists','names','profile']);

-- ================================================================ IRIS
set role authenticated; set request.jwt.claim.sub = :'IRIS';

insert into public.postpartum_settings (delivery_date) values (current_date - 20);
select tests.ok((select not (share_rest_need or share_availability or share_relay_requests or share_summary or share_appointments) and share_household_id is null and not reminders_enabled and active
                 from public.postpartum_settings), 'post-partum : rien n''est partagé ni rappelé par défaut, le suivi reste actif');

insert into public.postpartum_checkins (checkin_date, feeling, mood, fatigue, stress, needs, comment, pain, recovery)
  values (current_date, 2, 2, 5, 4, array['rest','relay'], 'Nuit très difficile', 3, 2),
         (current_date - 1, 3, 3, 4, 3, array['no_answer'], null, null, null);
select tests.ok(tests.count('select * from public.postpartum_checkins') = 2, 'post-partum : Iris enregistre et relit ses check-ins');
select tests.throws($$insert into public.postpartum_checkins (checkin_date, mood) values (current_date, 3)$$, 'post-partum : un seul check-in par jour (on le modifie)');
select tests.throws($$insert into public.postpartum_checkins (checkin_date, mood) values (current_date - 9, 6)$$, 'post-partum : échelle hors 1..5 refusée');
select tests.throws($$insert into public.postpartum_checkins (checkin_date, needs) values (current_date - 9, array['diagnostic'])$$, 'post-partum : besoin inconnu refusé');
select tests.ok(not exists (select 1 from information_schema.columns where table_name = 'postpartum_checkins' and column_name ~ '(score|diagnos|risk)'),
  'post-partum : aucune colonne de score, de risque ou de diagnostic');

insert into public.trusted_contacts (kind, name, relation, phone) values ('trusted', 'Maman', 'Ma mère', '06 12 34 56 78'), ('professional', 'Sage-femme Durand', 'Sage-femme', '+33 1 23 45 67 89');
select tests.throws($$insert into public.trusted_contacts (kind, name, phone) values ('trusted', 'X', 'appelle-moi')$$, 'contacts : numéro mal formé refusé');
insert into public.postpartum_actions (kind, note) values ('appointment_booked', 'Sage-femme jeudi');
insert into public.consultation_questions (journey, question) values ('postpartum', 'Est-ce normal de pleurer autant ?');
select tests.ok(tests.count('select * from public.consultation_questions where journey = ''postpartum''') = 1, 'questions : le parcours post-partum est accepté');

-- Partage refusé tant qu'Iris n'a rien autorisé
select tests.throws(format($$insert into public.postpartum_shared_status (household_id, rest_need) values (%L, 'high')$$, :'FOYER'), 'partage : refusé sans autorisation préalable');

-- Iris autorise uniquement le besoin de repos et les demandes de relais
update public.postpartum_settings set share_household_id = :'FOYER', share_rest_need = true, share_relay_requests = true;
insert into public.postpartum_shared_status (household_id, rest_need, availability, relay_requested, relay_note, summary)
  values (:'FOYER', 'high', 'resting', true, 'Peux-tu prendre la nuit ?', 'Je vais très mal');
select tests.ok((select rest_need = 'high' and relay_requested and availability is null and summary is null from public.postpartum_shared_status),
  'partage : seuls les champs autorisés sont conservés (disponibilité et résumé filtrés par le serveur)');
select tests.throws(format($$update public.postpartum_settings set share_household_id = %L$$, 'd1d1d1d1-0000-4000-8000-0000000000aa'), 'partage : impossible vers un foyer dont on n''est pas membre');

-- ================================================================ JULES (conjoint)
set request.jwt.claim.sub = :'JULES';
select tests.ok(tests.count('select * from public.postpartum_checkins') = 0, 'conjoint : aucun accès aux check-ins (même avec tous les domaines)');
select tests.ok(tests.count('select * from public.postpartum_settings') = 0, 'conjoint : aucun accès aux réglages ni au plan de soutien');
select tests.ok(tests.count('select * from public.trusted_contacts') = 0, 'conjoint : aucun accès aux contacts');
select tests.ok(tests.count('select * from public.postpartum_actions') = 0, 'conjoint : aucun accès aux démarches');
select tests.ok(tests.count('select * from public.consultation_questions where journey = ''postpartum''') = 0, 'conjoint : questions privées non visibles');
select tests.ok((select rest_need = 'high' and relay_requested and summary is null from public.postpartum_shared_status), 'conjoint : voit uniquement ce qu''Iris a choisi de partager');
update public.postpartum_shared_status set summary = 'modifié par Jules';
select tests.ok(tests.count('select * from public.postpartum_shared_status where summary is not null') = 0, 'conjoint : ne peut pas modifier le partage d''Iris');

-- ================================================================ ZOÉ (inconnue)
set request.jwt.claim.sub = :'ZOE';
select tests.ok(tests.count('select * from public.postpartum_shared_status') = 0, 'inconnue : rien de visible');

-- ================================================================ révocation
set request.jwt.claim.sub = :'IRIS';
update public.postpartum_settings set share_rest_need = false;
select tests.ok((select rest_need is null and relay_requested from public.postpartum_shared_status), 'révocation : décocher le repos efface aussitôt l''information partagée');
update public.postpartum_settings set share_relay_requests = false;
select tests.ok(tests.count('select * from public.postpartum_shared_status') = 0, 'révocation : plus rien de partagé → la ligne disparaît');
set request.jwt.claim.sub = :'JULES';
select tests.ok(tests.count('select * from public.postpartum_shared_status') = 0, 'révocation : le conjoint ne voit plus rien');

-- ================================================================ export RGPD
set request.jwt.claim.sub = :'IRIS';
select tests.ok(jsonb_array_length(public.export_my_data() -> 'personal' -> 'postpartum_checkins') = 2, 'export : les check-ins d''Iris sont dans son export');
set request.jwt.claim.sub = :'JULES';
select tests.ok(jsonb_array_length(public.export_my_data() -> 'personal' -> 'postpartum_checkins') = 0, 'export : rien d''Iris dans l''export de Jules');
reset role;

-- ================================================================ rendez-vous privés
set role authenticated; set request.jwt.claim.sub = :'IRIS';
insert into public.appointments (household_id, for_parent, kind, title, starts_at, private_to_creator)
  values (:'FOYER', true, 'postnatal', 'Psychologue', now() + interval '2 days', true),
         (:'FOYER', true, 'postnatal', 'Visite postnatale', now() + interval '3 days', false);
select tests.ok(tests.count('select * from public.appointments where household_id = ''d1d1d1d1-0000-4000-8000-0000000000f0''') = 2, 'rendez-vous : Iris voit ses deux rendez-vous');
set request.jwt.claim.sub = :'JULES';
select tests.ok((select array_agg(title) from public.appointments where household_id = 'd1d1d1d1-0000-4000-8000-0000000000f0') = array['Visite postnatale'], 'rendez-vous : le rendez-vous privé n''est pas visible du conjoint, le partagé oui');
update public.appointments set title = 'x' where title = 'Psychologue';
delete from public.appointments where title = 'Psychologue';
set request.jwt.claim.sub = :'IRIS';
select tests.ok(tests.count('select * from public.appointments where title = ''Psychologue''') = 1, 'rendez-vous : le conjoint ne peut ni modifier ni supprimer un rendez-vous privé');
select tests.ok((select not private_to_creator from public.appointments where title = 'Visite postnatale'), 'rendez-vous : partagés par défaut (comportement existant inchangé)');
reset role;
