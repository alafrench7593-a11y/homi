-- =====================================================================
-- « Suivre mon cycle » v3 : fiche du jour enrichie, contraception déclarée, favoris, vie sexuelle sur consentement,
-- verrouillage, étiquettes (3 en gratuit), catégories personnalisées et anticipation (Premium), retours, export, effacement.
-- =====================================================================
\set CA 'c7c1e000-0000-4000-8000-000000000001'
\set CB 'c7c1e000-0000-4000-8000-000000000002'
reset role;
insert into auth.users (id, email) values (:'CA', 'cycle3-a@exemple.test'), (:'CB', 'cycle3-b@exemple.test');

set role authenticated; set request.jwt.claim.sub = :'CA';
-- Fiche du jour : humeurs, habitudes, sommeil, détails des règles, nouveaux symptômes
insert into public.symptom_logs (logged_on, symptom_keys, moods, habits, sleep_bedtime, sleep_waketime, night_wakings, nap, sleep_tags, fatigue, energy, period_color, protection, leak, pain_intensity)
  values (current_date, array['migraine','back_pain','swelling','appetite_loss'], array['sensitive','stressed'], array['walk','hydration'], '23:15', '07:00', 2, false, array['difficult'], 4, 2, 'dark_red', 'cup', false, 6);
select tests.ok((select moods = array['sensitive','stressed'] and fatigue = 4 and protection = 'cup' from public.symptom_logs where logged_on = current_date), 'fiche du jour : humeurs, habitudes, sommeil et détails des règles');
select tests.throws($$insert into public.symptom_logs (logged_on, moods) values (current_date - 1, array['euphorique'])$$, 'humeur : valeur inconnue refusée');
select tests.throws($$insert into public.symptom_logs (logged_on, habits) values (current_date - 1, array['jeu'])$$, 'habitudes : valeur inconnue refusée');
select tests.throws($$insert into public.symptom_logs (logged_on, symptom_keys) values (current_date - 1, array['grippe'])$$, 'symptômes : valeur inconnue refusée');
select tests.throws($$insert into public.symptom_logs (logged_on, night_wakings) values (current_date - 1, 40)$$, 'sommeil : réveils nocturnes bornés');
select tests.throws($$insert into public.symptom_logs (logged_on, tags) values (current_date - 1, array['<script>'])$$, 'étiquettes : caractères interdits');

-- Étiquettes : 3 différentes en gratuit, les existantes restent utilisables
insert into public.symptom_logs (logged_on, tags) values (current_date - 2, array['travail', 'vacances', 'sport intense']);
insert into public.symptom_logs (logged_on, tags) values (current_date - 3, array['travail']);
select tests.throws($$insert into public.symptom_logs (logged_on, tags) values (current_date - 4, array['nouvelle'])$$, 'étiquettes : une 4e étiquette différente est Premium');
reset role;
select tests.set_premium(:'CA', true);
set role authenticated; set request.jwt.claim.sub = :'CA';
insert into public.symptom_logs (logged_on, tags) values (current_date - 4, array['nouvelle']);
select tests.ok(tests.count($$select * from public.symptom_logs where 'nouvelle' = any(tags)$$) = 1, 'étiquettes : illimitées en Premium');
-- Catégories personnalisées : Premium
insert into public.cycle_custom_items (label) values ('Méditation');
select tests.ok(tests.count('select * from public.cycle_custom_items') = 1, 'catégories personnalisées : créées en Premium');
reset role;
select tests.set_premium(:'CA', false);
set role authenticated; set request.jwt.claim.sub = :'CA';
select tests.throws($$insert into public.cycle_custom_items (label) values ('Yoga')$$, 'catégories personnalisées : réservées à Premium');
select tests.ok(tests.count('select * from public.cycle_custom_items') = 1, 'fin d''abonnement : catégories déjà créées conservées');

-- Contraception déclarée (prise, oubli, changement) : une par jour et par type
insert into public.contraception_logs (kind) values ('pill_taken');
select tests.throws($$insert into public.contraception_logs (kind) values ('pill_taken')$$, 'contraception : une prise par jour (pas de doublon)');
insert into public.contraception_logs (logged_on, kind) values (current_date - 1, 'pill_missed');
insert into public.contraception_logs (kind, label) values ('treatment', 'Traitement prescrit');
select tests.throws($$insert into public.contraception_logs (kind) values ('dose_double')$$, 'contraception : type inconnu refusé');
select tests.ok(tests.count('select * from public.contraception_logs') = 3, 'contraception : prise, oubli et traitement déclarés');

-- Favoris et préférences
insert into public.cycle_preferences (favorites, lock_mode, show_intimacy_icons) values (array['period','mood','pain','sleep','contraception'], 'intimate', false);
select tests.throws($$update public.cycle_preferences set favorites = array['a','b','c','d','e','f']$$, 'favoris : 5 au plus');
select tests.throws($$update public.cycle_preferences set lock_mode = 'tout'$$, 'verrouillage : valeur inconnue refusée');
select tests.throws($$update public.cycle_preferences set anticipation = true$$, 'anticipation des symptômes : Premium');

-- Vie sexuelle : consentement explicite avant toute saisie
select tests.throws($$insert into public.intercourse_logs (occurred_on) values (current_date)$$, 'rapports : impossible sans activation explicite du suivi');
update public.cycle_preferences set track_intercourse = true;
insert into public.consents (user_id, purpose, granted, version) values (auth.uid(), 'intimate_data', true, '2026-10');
insert into public.intercourse_logs (occurred_on, condom) values (current_date, 'no');
update public.symptom_logs set symptom_keys = symptom_keys || array['libido_up','dyspareunia'] where logged_on = current_date;
insert into public.contraception_logs (kind) values ('condom');
select tests.ok(tests.count('select * from public.intercourse_logs') = 1, 'rapports : enregistrés après consentement');
reset role;
set role authenticated; set request.jwt.claim.sub = :'CB';
select tests.ok(tests.count('select * from public.intercourse_logs') + tests.count('select * from public.contraception_logs') + tests.count('select * from public.cycle_custom_items') = 0,
  'confidentialité : un autre compte ne voit rien');
select tests.throws(format($$insert into public.contraception_logs (user_id, kind) values (%L, 'pill_taken')$$, :'CA'), 'isolation : impossible d''écrire au nom d''un autre compte');
reset role;
set role authenticated; set request.jwt.claim.sub = :'CA';
insert into public.cycle_insight_feedback (insight_key, helpful) values ('trend:back_pain:pre_period', false);
select tests.ok((public.export_my_data() ? 'contraception_logs') and jsonb_array_length(public.export_my_data() -> 'contraception_logs') = 4
  and (public.export_my_data() -> 'cycle_preferences' ->> 'lock_mode') = 'intimate', 'export RGPD : contraception, préférences et retours inclus');
-- Effacer la seule vie sexuelle
select public.delete_my_intimate_data();
select tests.ok(tests.count('select * from public.intercourse_logs') = 0 and tests.count($$select * from public.contraception_logs where kind = 'condom'$$) = 0
  and (select not (symptom_keys && array['libido_up','dyspareunia']) and 'migraine' = any(symptom_keys) from public.symptom_logs where logged_on = current_date)
  and tests.count($$select * from public.contraception_logs where kind = 'pill_taken'$$) = 1,
  'vie sexuelle : effacée seule, le reste du suivi est conservé');
-- Tout effacer
select public.delete_my_cycle_data();
select tests.ok(tests.count('select * from public.contraception_logs') + tests.count('select * from public.symptom_logs') + tests.count('select * from public.cycle_custom_items') + tests.count('select * from public.cycle_insight_feedback') = 0,
  'effacement : toutes les données du cycle supprimées');
reset role;
-- Supprimer un parcours du cycle efface aussi les prises datées de sa période
set role authenticated; set request.jwt.claim.sub = :'CA';
insert into public.user_journeys (id, type, status, started_on, ended_on, end_reason) values ('c7c1e000-0000-4000-8000-0000000000aa', 'avoid', 'archived', current_date - 3, current_date, 'changed')
  on conflict do nothing;
insert into public.contraception_logs (logged_on, kind) values (current_date - 1, 'pill_taken');
select public.delete_journey('c7c1e000-0000-4000-8000-0000000000aa');
select tests.ok(tests.count('select * from public.contraception_logs') = 0, 'suppression d''un parcours : prises de contraception de sa période effacées');
reset role;
