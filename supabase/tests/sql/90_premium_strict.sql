-- Premium strict (08/11/2026) : nouvelles saisies réservées au Premium ; lecture, suppression, export, profil,
-- réglages, signalements et avis toujours libres ; co-parent d'une abonnée couvert ; offre IA = assistant ;
-- outil acheté à vie honoré ; plus de mois gratuit des outils ; interrupteur réservé aux admins.
\set PA 'd0900000-0000-4000-8000-000000000001'
\set PB 'd0900000-0000-4000-8000-000000000002'
\set PC 'd0900000-0000-4000-8000-000000000003'
\set PH 'd0900000-0000-4000-8000-0000000000aa'
reset role; set request.jwt.claim.sub = '';
update public.premium_policy set strict = true;
insert into auth.users (id, email) values (:'PA', 'strict-a@exemple.test'), (:'PB', 'strict-b@exemple.test'), (:'PC', 'strict-c@exemple.test');
insert into public.households (id, name, created_by) values (:'PH', 'Foyer strict', :'PA');
insert into public.household_members (household_id, user_id, role) values (:'PH', :'PA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'PH', :'PB', 'coparent') on conflict do nothing;
-- donnée créée avant (quand le compte avait encore le droit d'écrire) : jamais effacée
insert into public.mood_checkins (user_id, mood) values (:'PC', 3);

-- 1. Compte gratuit : aucune nouvelle saisie, mais lecture, suppression et réglages libres
set role authenticated; set request.jwt.claim.sub = :'PC';
select tests.ok(public.premium_strict(), 'strict : verrouillage actif par défaut');
select tests.throws($$insert into public.mood_checkins (mood) values (4)$$, 'strict : nouvelle saisie refusée sans Premium');
select tests.throws($$update public.mood_checkins set mood = 5$$, 'strict : modification refusée sans Premium');
select tests.throws($$insert into public.assistant_conversations (title) values ('Q')$$, 'strict : assistant refusé sans Premium ni offre IA');
select tests.throws($$insert into public.pma_protocols (label, started_on) values ('FIV', current_date)$$, 'strict : outil non acheté refusé (plus de mois gratuit)');
select tests.ok((select count(*) from public.mood_checkins) = 1, 'strict : les données déjà créées restent lisibles');
select tests.ok(jsonb_path_exists(public.export_my_data(), '$.** ? (@.mood == 3)'), 'strict : export complet sans Premium');
select tests.ok((public.my_access()->>'trial_until') is null and (public.my_access()->>'strict')::boolean, 'strict : my_access sans mois gratuit');
update public.profiles set display_name = 'Clara' where id = :'PC';
select tests.ok(true, 'strict : le profil reste modifiable');
insert into public.app_feedback (kind, body) values ('idea', 'Une idée');
select tests.ok((select count(*) from public.app_feedback) = 1, 'strict : « Donner mon avis » reste libre');
update public.premium_policy set strict = false;
select tests.ok(public.premium_strict(), 'strict : un compte ordinaire ne peut pas désactiver le verrouillage');
delete from public.mood_checkins;
reset role;
select tests.ok((select count(*) from public.mood_checkins where user_id = :'PC') = 0, 'strict : suppression toujours possible');

-- 2. Abonnée et co-parent couvert
select tests.set_premium(:'PA', true);
set role authenticated; set request.jwt.claim.sub = :'PA';
insert into public.mood_checkins (mood) values (4);
select tests.ok((select count(*) from public.mood_checkins) = 1, 'strict : abonnée : saisie acceptée');
set request.jwt.claim.sub = :'PB';
insert into public.mood_checkins (mood) values (2);
select tests.ok((select count(*) from public.mood_checkins) = 1, 'strict : co-parent couvert par l''abonnement du foyer');
reset role;
select tests.set_premium(:'PA', false);
set role authenticated; set request.jwt.claim.sub = :'PA';
select tests.throws($$insert into public.mood_checkins (mood) values (4)$$, 'strict : abonnement expiré : saisie refusée');
select tests.ok((select count(*) from public.mood_checkins) = 1, 'strict : abonnement expiré : données conservées');

-- 3. Offre Assistant IA et outil acheté à vie
reset role;
insert into public.entitlement_grants (user_id, entitlement, active) values (:'PC', 'ASSISTANT_IA', true), (:'PC', 'TOOL_PMA_TRACKER', true);
set role authenticated; set request.jwt.claim.sub = :'PC';
insert into public.assistant_conversations (title) values ('Question');
select tests.ok((select count(*) from public.assistant_conversations) = 1, 'strict : offre IA : assistant ouvert');
select tests.throws($$insert into public.mood_checkins (mood) values (4)$$, 'strict : offre IA seule : le reste reste réservé');
insert into public.pma_protocols (label, started_on) values ('FIV', current_date);
select tests.ok((select count(*) from public.pma_protocols) = 1, 'strict : outil acheté à vie honoré');

-- 4. Écritures du serveur jamais bloquées ; interrupteur admin
reset role; set request.jwt.claim.sub = '';
insert into public.mood_checkins (user_id, mood) values (:'PC', 3);
select tests.ok((select count(*) from public.mood_checkins where user_id = :'PC') = 1, 'strict : écriture serveur (service) acceptée');
update public.premium_policy set strict = false;
set role authenticated; set request.jwt.claim.sub = :'PC';
insert into public.mood_checkins (mood) values (4);
select tests.ok((select count(*) from public.mood_checkins) = 2, 'strict : interrupteur désactivé : ancien modèle');
reset role;
-- les tests suivants (99_report) tournent comme les précédents, sans verrouillage
update public.premium_policy set strict = false;
