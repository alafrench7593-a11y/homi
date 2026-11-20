-- =====================================================================
-- Espace du co-parent, confidentialité entre adultes, missions terminées, « Se comprendre » (19/11/2026)
-- Migrations 20261119100000_confidentialite_coparent.sql, 20261119100100_se_comprendre.sql.
-- Comptes : Camille (propriétaire, enceinte), Sam (co-parent), Zoé (nounou), Alex (ancien membre), Intrus (non-membre).
-- =====================================================================
\set OW 'c0b10000-0000-4000-8000-000000000001'
\set CP 'c0b10000-0000-4000-8000-000000000002'
\set NN 'c0b10000-0000-4000-8000-000000000003'
\set EX 'c0b10000-0000-4000-8000-000000000004'
\set XO 'c0b10000-0000-4000-8000-000000000005'
\set H  'c0b10000-0000-4000-8000-0000000000a1'
\set HX 'c0b10000-0000-4000-8000-0000000000a2'
\set K  'c0b10000-0000-4000-8000-0000000000c1'
\set P  'c0b10000-0000-4000-8000-0000000000b1'

reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'OW', 'zb-camille@exemple.test'), (:'CP', 'zb-sam@exemple.test'), (:'NN', 'zb-zoe@exemple.test'),
  (:'EX', 'zb-alex@exemple.test'), (:'XO', 'zb-intrus@exemple.test');
update public.profiles set display_name = 'Camille' where id = :'OW';
update public.profiles set display_name = 'Sam Martin' where id = :'CP';
insert into public.households (id, name, created_by) values (:'H', 'Foyer zb', :'OW'), (:'HX', 'Autre foyer zb', :'XO');
insert into public.household_members (household_id, user_id, role) values (:'H', :'OW', 'owner'), (:'HX', :'XO', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope, pregnancy_access) values
  (:'H', :'CP', 'coparent', '{daily,health,documents,pregnancy,lists,names,profile}', '{daily,lists,names}', null, true),
  (:'H', :'EX', 'coparent', '{daily,health,documents,pregnancy,lists,names,profile}', '{daily,lists,names}', null, true);
insert into public.children (id, household_id, first_name, birth_date) values (:'K', :'H', 'Lina', current_date - 400);
insert into public.household_members (household_id, user_id, role, can_view, can_edit, child_scope) values (:'H', :'NN', 'caregiver', '{daily,lists}', '{daily,lists}', array[:'K']::uuid[]);
insert into public.pregnancies (id, household_id, carrier_user_id, due_date) values (:'P', :'H', :'OW', current_date + 120);

-- ================================================================ 1. tables privées : propriétaire seul (structure)
-- Toute politique permissive de lecture des tables de données personnelles se limite à la propriétaire (user_id = auth.uid()).
select tests.ok(not exists (
  select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
  where c.relnamespace = 'public'::regnamespace and p.polpermissive and p.polcmd in ('r', '*')
    and c.relname in ('period_entries', 'bleeding_logs', 'discharge_logs', 'cycle_journal', 'cycle_preferences', 'cycle_custom_items', 'cycle_insight_feedback',
      'symptom_logs', 'intercourse_logs', 'ovulation_tests', 'fertility_observations', 'contraception_logs', 'contraception_methods', 'pma_logs', 'pma_meds',
      'pma_protocols', 'pregnancy_tests', 'pregnancy_symptom_logs', 'maternal_weights', 'mood_checkins', 'daily_checks', 'exhaustion_checkins',
      'parent_sleep_logs', 'postpartum_checkins', 'postpartum_settings', 'postpartum_actions', 'my_treatments', 'my_treatment_logs', 'support_circle',
      'trusted_contacts', 'assistant_conversations', 'notification_settings', 'couple_feelings')
    and pg_get_expr(p.polqual, p.polrelid) <> '(user_id = auth.uid())'), 'privé : 33 tables personnelles lisibles par leur propriétaire seule (aucune autre politique de lecture)');
select tests.ok((select bool_and(c.relrowsecurity) from pg_class c where c.relnamespace = 'public'::regnamespace
  and c.relname in ('couple_feelings', 'couple_messages', 'family_member_profiles', 'period_entries', 'mood_checkins', 'pregnancy_symptom_logs')), 'privé : RLS active sur les nouvelles tables');

-- Données réelles : Camille saisit, personne d'autre ne lit ni n'écrit à sa place
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into public.period_entries (user_id, start_date) values (:'OW', current_date - 3);
insert into public.mood_checkins (user_id, mood, journal) values (:'OW', 2, 'journal intime de Camille');
insert into public.exhaustion_checkins (user_id, answers) values (:'OW', '{3,3,3,3,3,3}');
insert into public.symptom_logs (user_id, logged_on) values (:'OW', current_date);
insert into public.maternal_weights (user_id, measured_on, weight_kg) values (:'OW', current_date, 68.2);
insert into public.couple_feelings (feelings, note) values ('{tired,rest}', 'note privée de Camille');
select tests.ok(tests.count('select * from public.couple_feelings') = 1, 'ressenti : Camille relit son ressenti');
do $$
declare who uuid; t text; n bigint;
begin
  foreach who in array array['c0b10000-0000-4000-8000-000000000002', 'c0b10000-0000-4000-8000-000000000003', 'c0b10000-0000-4000-8000-000000000004', 'c0b10000-0000-4000-8000-000000000005']::uuid[] loop
    perform set_config('request.jwt.claim.sub', who::text, true);
    foreach t in array array['period_entries', 'mood_checkins', 'exhaustion_checkins', 'symptom_logs', 'maternal_weights', 'couple_feelings'] loop
      execute format('select count(*) from public.%I where user_id = %L', t, 'c0b10000-0000-4000-8000-000000000001') into n;
      perform tests.ok(n = 0, format('privé : %s de Camille illisible par %s (négatif)', t,
        case who when 'c0b10000-0000-4000-8000-000000000002' then 'le co-parent' when 'c0b10000-0000-4000-8000-000000000003' then 'la nounou'
                 when 'c0b10000-0000-4000-8000-000000000004' then 'un membre du foyer' else 'un non-membre' end));
      execute format('update public.%I set user_id = user_id where user_id = %L', t, 'c0b10000-0000-4000-8000-000000000001');
      get diagnostics n = row_count;
      perform tests.ok(n = 0, format('privé : %s de Camille non modifiable par un autre compte', t));
    end loop;
  end loop;
  perform set_config('request.jwt.claim.sub', 'c0b10000-0000-4000-8000-000000000001', true);
end $$;
set request.jwt.claim.sub = :'CP';
select tests.throws(format($q$insert into public.period_entries (user_id, start_date) values (%L, current_date)$q$, :'OW'), 'privé : le co-parent n''écrit pas de règles au nom de Camille');
select tests.throws(format($q$insert into public.couple_feelings (user_id, feelings) values (%L, '{tired}')$q$, :'OW'), 'privé : le co-parent n''écrit pas de ressenti au nom de Camille');
select tests.throws($$insert into public.couple_feelings (feelings) values ('{score}')$$, 'ressenti : clé inconnue refusée (liste fermée, pas de score)');
select tests.ok(not public.can_access_pregnancy(:'P'), 'grossesse : fermée au co-parent tant que Camille ne la partage pas');
select tests.ok(tests.count(format('select * from public.pregnancies where id = %L', :'P')) = 0, 'grossesse : ligne illisible par le co-parent (négatif)');
select tests.throws(format($q$select public.set_pregnancy_sharing(%L, true, true)$q$, :'P'), 'grossesse : le co-parent ne s''ouvre pas l''accès lui-même');

-- ================================================================ 2. grossesse : partage choisi par la personne enceinte
set request.jwt.claim.sub = :'OW';
insert into public.notes (household_id, author_id, body, pregnancy_id) values (:'H', :'OW', 'note médicale de grossesse', :'P');
insert into public.appointments (household_id, pregnancy_id, kind, title, starts_at) values (:'H', :'P', 'other', 'Échographie zb', now() + interval '3 days');
insert into public.appointments (household_id, for_parent, kind, title, starts_at) values (:'H', true, 'other', 'Psychologue zb', now() + interval '4 days');
insert into public.appointments (household_id, for_parent, kind, title, starts_at, shared_with_household) values (:'H', true, 'other', 'Dentiste zb partagé', now() + interval '5 days', true);
select public.set_pregnancy_sharing(:'P', true, false);
set request.jwt.claim.sub = :'CP';
select tests.ok(public.can_access_pregnancy(:'P') and tests.count(format('select * from public.pregnancies where id = %L', :'P')) = 1, 'grossesse : partage « essentiel » → le co-parent voit terme et semaine');
select tests.ok(tests.count('select * from public.appointments where title = ''Échographie zb''') = 1, 'grossesse : rendez-vous de grossesse visibles avec le partage essentiel');
select tests.ok(tests.count('select * from public.notes where body = ''note médicale de grossesse''') = 0, 'grossesse : notes médicales toujours fermées sans partage médical (négatif)');
select tests.ok(tests.count('select * from public.appointments where title = ''Psychologue zb''') = 0, 'rendez-vous « pour moi » non partagé : invisible du co-parent (négatif)');
select tests.ok(tests.count('select * from public.appointments where title = ''Dentiste zb partagé''') = 1, 'rendez-vous « pour moi » partagé : visible du co-parent');
update public.pregnancies set share_medical = true where id = :'P';
reset role;
select tests.ok((select share_medical is not true from public.pregnancies where id = :'P'), 'grossesse : le co-parent ne coche pas le partage médical à la place de Camille');
set role authenticated; set request.jwt.claim.sub = :'OW';
select public.set_pregnancy_sharing(:'P', true, true);
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.notes where body = ''note médicale de grossesse''') = 1, 'grossesse : partage médical choisi → note lisible');
set request.jwt.claim.sub = :'NN';
select tests.ok(not public.can_access_pregnancy(:'P'), 'grossesse : la nounou n''y a jamais accès sans accord (pregnancy_access faux)');
set request.jwt.claim.sub = :'OW';
select public.set_pregnancy_sharing(:'P', false, true);
select tests.ok((select share_basics = false and share_medical = false from public.pregnancies where id = :'P'), 'grossesse : retirer l''essentiel retire aussi le médical');

-- Post-partum partagé : les parents seulement (plus la nounou)
insert into public.postpartum_settings (user_id, share_household_id, share_rest_need, share_summary) values (:'OW', :'H', true, true);
insert into public.postpartum_shared_status (household_id, rest_need, summary) values (:'H', 'high', 'Besoin de repos');
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.postpartum_shared_status') = 1, 'post-partum partagé : visible du co-parent');
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.postpartum_shared_status') = 0, 'post-partum partagé : invisible de la nounou (négatif)');

-- ================================================================ 3. profil familial et réglages de partage
set request.jwt.claim.sub = :'CP';
insert into public.family_member_profiles (household_id, family_label, share_availability) values (:'H', 'Papa', true);
select tests.throws(format($q$insert into public.family_member_profiles (household_id, user_id, family_label) values (%L, %L, 'Maman')$q$, :'H', :'OW'),
  'profil familial : personne n''écrit le profil d''un autre adulte');
set request.jwt.claim.sub = :'OW';
select tests.ok((select family_label from public.family_member_profiles where user_id = :'CP') = 'Papa', 'profil familial : Camille lit le rôle choisi par Sam (« Papa »)');
set request.jwt.claim.sub = :'XO';
select tests.ok(tests.count('select * from public.family_member_profiles') = 0, 'profil familial : non-membre → rien (négatif)');

-- ================================================================ 4. Se comprendre : messages
set request.jwt.claim.sub = :'OW';
create temp table zb (k text, id uuid); grant all on zb to authenticated;
insert into zb select 'm1', (public.couple_send(:'H', :'CP', 'share', 'J''ai besoin de repos ce soir.', 'fatigue', null, null, 'c0b10000-0000-4000-8000-00000000e001')).id;
insert into zb select 'm1bis', (public.couple_send(:'H', :'CP', 'share', 'J''ai besoin de repos ce soir.', 'fatigue', null, null, 'c0b10000-0000-4000-8000-00000000e001')).id;
select tests.ok((select count(distinct id) from zb) = 1, 'message : rejeu du même envoi → un seul message (idempotent)');
select tests.throws(format($q$insert into public.couple_messages (household_id, author_id, recipient_id, kind, body) values (%L, %L, %L, 'share', 'x')$q$, :'H', :'OW', :'CP'),
  'message : aucune écriture directe (seulement couple_send)');
select tests.throws(format($q$select public.couple_send(%L, %L, 'share', 'bonjour')$q$, :'H', :'NN'), 'message : jamais à la nounou (adultes du couple seulement)');
select tests.throws(format($q$select public.couple_send(%L, %L, 'share', 'bonjour')$q$, :'H', :'XO'), 'message : jamais à une personne hors du foyer');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and payload ->> 'couple' = 'true') = 1, 'notification : une seule pour le rejeu');
select tests.ok((select title = 'Camille souhaite partager quelque chose avec toi' and body = 'Ouvre HOMI quand tu le souhaites.'
  from public.notifications where user_id = :'CP' and payload ->> 'couple' = 'true'), 'notification : texte fixe avec le prénom');
select tests.ok(not exists (select 1 from public.notifications where user_id in (:'OW', :'CP') and (title || coalesce(body, '') || payload::text || coalesce(deep_link, '')) ilike '%repos ce soir%'),
  'notification : AUCUN contenu du message (titre, texte, données, lien)');
select tests.ok(not exists (select 1 from public.household_audit_log where (coalesce(before::text, '') || coalesce(after::text, '')) ilike '%repos ce soir%') and not exists (select 1 from public.household_events where payload::text ilike '%repos ce soir%'),
  'message : contenu absent du journal d''audit et des événements du foyer');
set role authenticated;
set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.couple_messages') = 1, 'message : le destinataire le lit');
insert into zb select 'r1', (public.couple_send(:'H', :'OW', 'reply', 'Je comprends. Comment je peux t''aider ?', null, (select id from zb where k = 'm1'))).id;
select tests.throws($$update public.couple_messages set body = 'modifié'$$, 'message : aucune modification après envoi (pas de droit UPDATE)');
delete from public.couple_messages where id = (select id from zb where k = 'm1');
select tests.ok(tests.count('select * from public.couple_messages where body = ''J''''ai besoin de repos ce soir.''') = 1, 'message : le destinataire ne le modifie ni ne le supprime');
insert into public.notification_settings (user_id, couple_discreet) values (:'CP', true) on conflict (user_id) do update set couple_discreet = true;
set request.jwt.claim.sub = :'NN';
select tests.ok(tests.count('select * from public.couple_messages') = 0, 'message : la nounou ne lit rien (négatif)');
set request.jwt.claim.sub = :'EX';
select tests.ok(tests.count('select * from public.couple_messages') = 0, 'message : un autre adulte du foyer (ni auteur ni destinataire) ne lit rien (négatif)');
set request.jwt.claim.sub = :'XO';
select tests.ok(tests.count('select * from public.couple_messages') = 0, 'message : non-membre → rien (négatif)');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.couple_messages') = 2, 'message : Camille lit son message et la réponse');
select public.couple_send(:'H', :'CP', 'share', 'Merci.', null, (select id from zb where k = 'r1'));
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and title = 'Ton partenaire souhaite partager quelque chose avec toi') = 1,
  'notification : discrétion choisie par le destinataire → sans prénom');
set role authenticated; set request.jwt.claim.sub = :'OW';
delete from public.couple_messages where id = (select id from zb where k = 'm1');
select tests.ok(tests.count(format('select * from public.couple_messages where id = %L', (select id from zb where k = 'm1'))) = 0, 'message : l''autrice supprime son message');

-- Export : mes ressentis et mes messages, jamais ceux de l'autre
set request.jwt.claim.sub = :'CP';
select tests.ok(jsonb_array_length(public.export_my_data() -> 'couple' -> 'feelings') = 0 and jsonb_array_length(public.export_my_data() -> 'couple' -> 'messages') >= 1,
  'export : le co-parent exporte ses messages, jamais les ressentis de Camille');
select tests.ok(public.export_my_data() ? 'couple' and public.export_my_data() ? 'private_messages', 'export : la clé « couple » s''ajoute sans retirer « private_messages » (messagerie de la communauté)');

-- ================================================================ 5. missions : cycle complet, droits, rejeu, préférence
set request.jwt.claim.sub = :'OW';
insert into zb select 'mis', (public.create_mission(:'H', 'Gérer le coucher ce soir', :'CP', 'childcare'::text) ->> 'id')::uuid;
insert into zb select 'rec', (public.create_mission(:'H', 'Sortir les poubelles', :'CP', 'housework', null, now() + interval '1 hour', false, 'normal', '{"type":"daily"}'::jsonb) ->> 'id')::uuid;
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'CP' and payload ->> 'task_id' = (select id::text from zb where k = 'mis')) = 1, 'mission : le co-parent est prévenu de la nouvelle mission');
set role authenticated; set request.jwt.claim.sub = :'NN';
select tests.throws(format($q$select public.mission_respond(%L, 'complete')$q$, (select id from zb where k = 'mis')), 'mission : la nounou ne termine pas une mission attribuée à quelqu''un d''autre');
set request.jwt.claim.sub = :'XO';
select tests.ok(public.mission_respond((select id from zb where k = 'mis'), 'complete') ->> 'status' = 'not_found', 'mission : non-membre → introuvable');
set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from zb where k = 'mis'), 'start');
select tests.ok((select mission_state from public.family_tasks where id = (select id from zb where k = 'mis')) = 'in_progress', 'mission : « Je m''en occupe » → En cours');
select tests.ok(public.mission_respond((select id from zb where k = 'mis'), 'complete', null, null, null, 1) ->> 'status' = 'conflict', 'mission : version périmée → conflit (aucun état impossible)');
select public.mission_respond((select id from zb where k = 'mis'), 'complete');
select tests.ok(public.mission_respond((select id from zb where k = 'mis'), 'complete') ->> 'unchanged' = 'true', 'mission : « Mission terminée » rejoué (file hors ligne, double appui) → inchangé');
select tests.throws(format($q$select public.mission_respond(%L, 'start')$q$, (select id from zb where k = 'mis')), 'mission : une mission terminée ne redevient pas « à faire »');
reset role;
select tests.ok((select mission_state = 'done' and status = 'done' and done_by = :'CP' and done_at is not null from public.family_tasks where id = (select id from zb where k = 'mis')),
  'mission : terminée en base (statut, réalisée par, date et heure)');
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title = 'Sam a terminé : Gérer le coucher ce soir') = 1, 'mission : « Sam a terminé : … » une seule fois (prénom, pas le rôle)');
-- Préférence : Camille coupe ce type de notification
insert into public.notification_settings (user_id, mission_done) values (:'OW', false) on conflict (user_id) do update set mission_done = false;
set role authenticated; set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from zb where k = 'rec'), 'complete');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'OW' and title like '% a terminé : Sortir les poubelles') = 0, 'mission : préférence coupée → pas de notification « terminée »');
select tests.ok((select count(*) from public.family_tasks where household_id = :'H' and title = 'Sortir les poubelles' and mission_state = 'pending') = 1,
  'mission récurrente : terminer une occurrence crée la suivante une seule fois (la série continue)');
set role authenticated; set request.jwt.claim.sub = :'CP';
select public.mission_respond((select id from zb where k = 'rec'), 'complete');
reset role;
select tests.ok((select count(*) from public.family_tasks where household_id = :'H' and title = 'Sortir les poubelles' and mission_state = 'pending') = 1,
  'mission récurrente : rejouer « terminée » ne crée pas une seconde occurrence');
-- Annulée : ne se termine plus
set role authenticated; set request.jwt.claim.sub = :'OW';
insert into zb select 'can', (public.create_mission(:'H', 'Prendre un rendez-vous', :'CP', 'admin') ->> 'id')::uuid;
select public.mission_respond((select id from zb where k = 'can'), 'cancel');
set request.jwt.claim.sub = :'CP';
select tests.throws(format($q$select public.mission_respond(%L, 'complete')$q$, (select id from zb where k = 'can')), 'mission annulée : ne peut plus être terminée');
-- Historique paginé : lecture par date de réalisation (index dédié)
select tests.ok((select count(*) from public.family_tasks where household_id = :'H' and mission_state = 'done') = 2, 'historique : les deux missions terminées sont lisibles par le co-parent');
select tests.ok(exists (select 1 from pg_indexes where indexname = 'family_tasks_mission_done_idx'), 'historique : index de pagination présent');

-- ================================================================ 6. ancien membre : perd tout immédiatement
reset role;
delete from public.household_members where household_id = :'H' and user_id = :'CP';
set role authenticated; set request.jwt.claim.sub = :'CP';
select tests.ok(tests.count('select * from public.couple_messages') = 0, 'ancien membre : plus aucun message du couple');
select tests.ok(tests.count(format('select * from public.family_tasks where household_id = %L', :'H')) = 0, 'ancien membre : plus aucune mission ni tâche');
select tests.ok(tests.count(format('select * from public.family_member_profiles where household_id = %L', :'H')) = 0, 'ancien membre : plus aucun profil familial');
select tests.ok(not public.can_access_pregnancy(:'P'), 'ancien membre : plus de grossesse');
select tests.ok(public.mission_respond((select id from zb where k = 'rec'), 'complete') ->> 'status' = 'not_found', 'ancien membre : mission introuvable');
select tests.throws(format($q$select public.couple_send(%L, %L, 'share', 'bonjour')$q$, :'H', :'OW'), 'ancien membre : n''écrit plus à l''autre adulte');
set request.jwt.claim.sub = :'OW';
select tests.ok(tests.count('select * from public.couple_messages') >= 1, 'ancien membre : Camille garde son propre fil');

-- ================================================================ 7. invitation de l'autre parent : lien à usage unique
reset role; select tests.set_premium(:'OW', true);
insert into auth.users (id, email) values ('c0b10000-0000-4000-8000-000000000006', 'zb-nouveau@exemple.test'), ('c0b10000-0000-4000-8000-000000000007', 'zb-autre@exemple.test');
set role authenticated; set request.jwt.claim.sub = :'OW';
create temp table zbi (k text, token text); grant all on zbi to authenticated;
insert into zbi select 'ok', public.create_household_invitation(:'H', 'coparent');
insert into zbi select 'rev', public.create_household_invitation(:'H', 'coparent');
insert into zbi select 'exp', public.create_household_invitation(:'H', 'coparent');
update public.household_invitations set revoked_at = now() where token_hash = encode(extensions.digest((select token from zbi where k = 'rev'), 'sha256'), 'hex');
reset role;
update public.household_invitations set expires_at = now() - interval '1 minute' where token_hash = encode(extensions.digest((select token from zbi where k = 'exp'), 'sha256'), 'hex');
set role authenticated; set request.jwt.claim.sub = 'c0b10000-0000-4000-8000-000000000006';
select tests.ok(public.accept_household_invitation((select token from zbi where k = 'ok')) = :'H', 'invitation : l''autre parent crée SON compte et rejoint le foyer');
select tests.ok((select role from public.household_members where household_id = :'H' and user_id = 'c0b10000-0000-4000-8000-000000000006') = 'coparent', 'invitation : rôle co-parent');
select tests.ok(not public.can_access_pregnancy(:'P'), 'invitation : le nouveau co-parent ne lit pas la grossesse non partagée');
set request.jwt.claim.sub = 'c0b10000-0000-4000-8000-000000000007';
select tests.throws(format($q$select public.accept_household_invitation(%L)$q$, (select token from zbi where k = 'ok')), 'invitation : lien déjà utilisé → refusé');
select tests.throws(format($q$select public.accept_household_invitation(%L)$q$, (select token from zbi where k = 'rev')), 'invitation : lien révoqué → refusé');
select tests.throws(format($q$select public.accept_household_invitation(%L)$q$, (select token from zbi where k = 'exp')), 'invitation : lien expiré → refusé');
select tests.ok(tests.count(format('select * from public.household_members where household_id = %L', :'H')) = 0, 'invitation : le compte refusé ne voit rien du foyer');
reset role;
