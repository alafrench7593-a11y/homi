-- =====================================================================
-- Abonnement iCalendar : jeton secret haché, révocation, droits de la personne, vie privée.
-- Ana (propriétaire), Ben (coparent SANS accès santé), Carl (autre foyer).
-- =====================================================================
\set ANA  'e2e2e2e2-0000-4000-8000-000000000201'
\set BEN  'e2e2e2e2-0000-4000-8000-000000000202'
\set CARL 'e2e2e2e2-0000-4000-8000-000000000203'
\set FOYER 'e2e2e2e2-0000-4000-8000-0000000002f0'
\set AUTRE 'e2e2e2e2-0000-4000-8000-0000000002f1'

insert into auth.users (id, email) values (:'ANA', 'cf-ana@exemple.test'), (:'BEN', 'cf-ben@exemple.test'), (:'CARL', 'cf-carl@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer agenda', :'ANA'), (:'AUTRE', 'Autre foyer', :'CARL');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'FOYER', :'BEN', 'coparent', '{lists}', '{lists}');

set role authenticated; set request.jwt.claim.sub = :'ANA';
insert into public.appointments (household_id, kind, title, starts_at) values (:'FOYER', 'pediatric', 'Pédiatre de Lina', now() + interval '3 days');
insert into public.appointments (household_id, kind, title, starts_at, private_to_creator) values (:'FOYER', 'consultation', 'Consultation privée', now() + interval '4 days', true);
insert into public.family_events (household_id, title, starts_at, ends_at) values (:'FOYER', 'Piscine', now() + interval '2 days', now() + interval '2 days 1 hour');
insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at) values (:'FOYER', 'me_time', :'ANA', now() + interval '1 day', now() + interval '1 day 1 hour');
insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at) values (:'FOYER', 'night', :'BEN', now() + interval '1 day', now() + interval '1 day 8 hours');

create temp table jetons(who text, id uuid, token text);
grant all on jetons to authenticated, service_role;
insert into jetons select 'ana', id, token from public.create_calendar_feed(:'FOYER');
select tests.ok((select length(token) >= 40 from jetons where who = 'ana'), 'abonnement : jeton long et aléatoire');
select tests.throws($$select token_hash from public.calendar_feeds$$, 'abonnement : l''empreinte du jeton n''est pas lisible depuis l''application');
select tests.ok(tests.count('select id, label from public.calendar_feeds') = 1, 'abonnement : Ana voit son lien (sans le jeton)');
select tests.throws(format($$select * from public.create_calendar_feed(%L)$$, :'AUTRE'), 'abonnement : impossible pour un foyer dont on n''est pas membre');
select tests.throws($$select public.calendar_feed_data('x')$$, 'abonnement : lecture des données réservée au serveur');

set request.jwt.claim.sub = :'BEN';
insert into jetons select 'ben', id, token from public.create_calendar_feed(:'FOYER');
select tests.ok(tests.count('select id from public.calendar_feeds') = 1, 'abonnement : Ben ne voit que son propre lien');

reset role; set role service_role; reset request.jwt.claim.sub;
create temp table flux as select who, public.calendar_feed_data(token) d from jetons;
select tests.ok((select (d->'feed'->>'include_health_titles')::boolean = false from flux where who = 'ana'), 'flux : titres de santé neutres par défaut');
select tests.ok((select jsonb_array_length(d->'appointments') = 2 from flux where who = 'ana'), 'flux d''Ana : ses deux rendez-vous, dont le privé qu''elle a créé');
select tests.ok((select jsonb_array_length(d->'appointments') = 0 from flux where who = 'ben'), 'flux de Ben : aucun rendez-vous de santé (pas de droit « santé »)');
select tests.ok((select jsonb_array_length(d->'events') = 1 and jsonb_array_length(d->'shifts') = 1 from flux where who = 'ben'), 'flux de Ben : l''activité et la nuit de relais, pas le temps pour soi d''Ana');
select tests.ok((select jsonb_array_length(d->'shifts') = 2 from flux where who = 'ana'), 'flux d''Ana : son temps pour soi et le relais');
select tests.ok(public.calendar_feed_data('jeton-inconnu') is null, 'flux : jeton inconnu → rien');

reset role; set role authenticated; set request.jwt.claim.sub = :'ANA';
select public.revoke_calendar_feed((select id from jetons where who = 'ana'));
select tests.throws(format($$select public.revoke_calendar_feed(%L)$$, (select id from jetons where who = 'ben')), 'révocation : impossible sur le lien de quelqu''un d''autre');
reset role; set role service_role;
select tests.ok(public.calendar_feed_data((select token from jetons where who = 'ana')) is null, 'révocation : le lien cesse immédiatement de fonctionner');
reset role;
delete from public.household_members where household_id = :'FOYER' and user_id = :'BEN';
set role service_role;
select tests.ok(public.calendar_feed_data((select token from jetons where who = 'ben')) is null, 'départ du foyer : le lien ne renvoie plus rien');
reset role;

-- Cache Open Food Facts : réservé au serveur
set role authenticated; set request.jwt.claim.sub = :'ANA';
select tests.throws($$select * from public.open_facts_cache$$, 'cache Open Food Facts : illisible depuis l''application');
select tests.throws($$insert into public.open_facts_cache(key, found) values ('x', false)$$, 'cache Open Food Facts : non modifiable depuis l''application');
reset role;

-- Temps réel : tables partagées publiées, données privées jamais publiées
select tests.ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bottles')
  and exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'care_shifts'), 'temps réel : biberons et relais publiés');
select tests.ok(not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
  and (tablename like 'postpartum%' or tablename like 'mood%' or tablename in ('documents', 'assistant_messages', 'periods', 'calendar_feeds', 'open_facts_cache'))), 'temps réel : humeur, post-partum, cycle, documents, conversations jamais publiés');
