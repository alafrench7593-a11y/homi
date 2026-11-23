-- =====================================================================
-- Conservation (audit du 23/11/2026) : la durée choisie par chaque personne s'applique à SON historique ;
-- durées fixes pour les notifications ; rien de récent n'est touché ; fonction non appelable par un client.
-- =====================================================================
\set A 'd0991000-0000-4000-8000-000000000001'
\set B 'd0991000-0000-4000-8000-000000000002'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'A', 'f99c-a@exemple.test'), (:'B', 'f99c-b@exemple.test');
insert into public.privacy_settings (user_id, retention_months) values (:'A', 36), (:'B', 6)
  on conflict (user_id) do update set retention_months = excluded.retention_months;
insert into public.mood_checkins (user_id, mood, journal, created_at, checked_at) values
  (:'A', 3, 'A ancien', now() - interval '4 years', now() - interval '4 years'),
  (:'A', 3, 'A 7 mois', now() - interval '7 months', now() - interval '7 months'),
  (:'B', 3, 'B 7 mois', now() - interval '7 months', now() - interval '7 months'),
  (:'B', 3, 'B récent', now() - interval '1 day', now() - interval '1 day');
insert into public.notifications (user_id, category, title, body, created_at) values
  (:'A', 'system', 'notif ancienne', 'x', now() - interval '120 days'), (:'A', 'system', 'notif récente', 'x', now() - interval '1 day');
select public.purge_by_retention();
select tests.ok(not exists (select 1 from public.mood_checkins where journal = 'A ancien'), 'conservation : au-delà de 36 mois, le journal de A est purgé');
select tests.ok(exists (select 1 from public.mood_checkins where journal = 'A 7 mois'), 'conservation : 7 mois < 36 mois, le journal de A reste');
select tests.ok(not exists (select 1 from public.mood_checkins where journal = 'B 7 mois'), 'conservation : B a choisi 6 mois, son journal de 7 mois est purgé');
select tests.ok(exists (select 1 from public.mood_checkins where journal = 'B récent'), 'conservation : le journal récent de B reste');
select tests.ok(not exists (select 1 from public.notifications where title = 'notif ancienne') and exists (select 1 from public.notifications where title = 'notif récente'),
  'conservation : notifications de plus de 90 jours purgées, récentes gardées');
set role authenticated; set request.jwt.claim.sub = :'A';
select tests.throws($$select public.purge_by_retention()$$, 'conservation : la purge n''est pas appelable par un compte');
reset role; set request.jwt.claim.sub = '';
