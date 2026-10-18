-- =====================================================================
-- Relais de nuit : la personne concernée est prévenue des changements faits par un autre.
-- =====================================================================
\set ANA  'e2e2e2e2-0000-4000-8000-000000000101'
\set BEN  'e2e2e2e2-0000-4000-8000-000000000102'
\set FOYER 'e2e2e2e2-0000-4000-8000-0000000001f0'

insert into auth.users (id, email) values (:'ANA', 'rn-ana@exemple.test'), (:'BEN', 'rn-ben@exemple.test');
insert into public.households (id, name, created_by) values (:'FOYER', 'Foyer relais', :'ANA');
insert into public.household_members (household_id, user_id, role) values (:'FOYER', :'BEN', 'coparent');

set role authenticated; set request.jwt.claim.sub = :'ANA';
-- planning de 3 nuits confié à Ben : une seule notification
insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at)
  select :'FOYER', 'night', :'BEN', date_trunc('day', now()) + make_interval(days => d, hours => 22), date_trunc('day', now()) + make_interval(days => d, hours => 30)
  from generate_series(1, 3) d;
-- Ana se réserve une nuit à elle-même : pas de notification pour son propre geste
insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at)
  values (:'FOYER', 'night', :'ANA', date_trunc('day', now()) + interval '5 days 22 hours', date_trunc('day', now()) + interval '6 days 6 hours');
-- temps pour soi : privé, jamais notifié
insert into public.care_shifts (household_id, kind, user_id, starts_at, ends_at) values (:'FOYER', 'me_time', :'ANA', now() + interval '2 hours', now() + interval '3 hours');

set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.notifications where payload->>''kind'' = ''night_plan''') = 1, 'relais : un planning de plusieurs nuits = une seule notification');
select tests.ok((select body = 'Ouvrez le planning pour les confirmer.' and deep_link = '/family/nights' from public.notifications where payload->>'kind' = 'night_plan'), 'relais : texte neutre et lien vers le planning');
-- Ben confirme lui-même : rien pour personne
update public.care_shifts set status = 'confirmed' where user_id = :'BEN' and starts_at = (select min(starts_at) from public.care_shifts where user_id = :'BEN');

set request.jwt.claim.sub = :'ANA';
select tests.ok(tests.count('select * from public.notifications') = 0, 'relais : aucune notification pour ses propres gestes (Ana) ni pour le temps pour soi');
-- Ana déplace une nuit de Ben, en retire une autre, en réattribue une à elle-même
update public.care_shifts set starts_at = starts_at + interval '1 hour' where user_id = :'BEN' and starts_at = (select max(starts_at) from public.care_shifts where user_id = :'BEN' and kind = 'night');
delete from public.care_shifts where user_id = :'BEN' and status = 'confirmed';
update public.care_shifts set user_id = :'ANA' where user_id = :'BEN' and kind = 'night' and starts_at = (select min(starts_at) from public.care_shifts where user_id = :'BEN' and kind = 'night');

set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.notifications where payload->>''kind'' = ''night_changed'' and title = ''Une nuit de relais a été déplacée''') = 1, 'relais : Ben est prévenu d''une nuit déplacée');
select tests.ok(tests.count('select * from public.notifications where payload->>''kind'' = ''night_removed''') = 1, 'relais : Ben est prévenu d''une nuit retirée');
select tests.ok(tests.count('select * from public.notifications where payload->>''kind'' = ''night_reassigned''') = 1, 'relais : Ben est prévenu qu''une nuit a été confiée à quelqu''un d''autre');
select tests.ok(tests.count('select * from public.notifications where body ~* ''(santé|humeur|post)''') = 0, 'relais : aucune information de santé dans les notifications');
reset role;
