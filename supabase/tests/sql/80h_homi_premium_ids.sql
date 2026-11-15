-- =====================================================================
-- HOMI Premium (migration 20261119000200_homi_premium_ids.sql) : droit HOMI_PREMIUM par défaut, produits
-- homi_premium_*, et robustesse : une ancienne ligne au nom d'« Au fil de nous » garde ses droits jusqu'à l'échéance.
-- =====================================================================
\set HA 'ab0e0000-0000-4000-8000-0000000001a1'
\set HB 'ab0e0000-0000-4000-8000-0000000001a2'

reset role;
insert into auth.users (id, email) values (:'HA', 'homi-a@exemple.test'), (:'HB', 'homi-b@exemple.test');

insert into public.subscriptions (user_id, status, store, period_type, product_id, expires_at)
values (:'HA', 'active', 'app_store', 'six_months', 'homi_premium_6months', now() + interval '180 days');
select tests.ok((select entitlement from public.subscriptions where user_id = :'HA') = 'HOMI_PREMIUM', 'droit par défaut : HOMI_PREMIUM');
select tests.ok(public._premium_of(:'HA'), 'formule homi_premium_6months active : Premium');

-- Ancienne étiquette (aucune en production) : toujours reconnue, droits jusqu'à l'échéance
insert into public.subscriptions (user_id, entitlement, status, store, period_type, product_id, expires_at)
values (:'HB', 'AU_FIL_DE_NOUS_PREMIUM', 'active', 'app_store', 'annual', 'aufildenous_premium_annual', now() + interval '30 days');
select tests.ok(public._premium_of(:'HB'), 'ancienne ligne au nom d''Au fil de nous : droits conservés jusqu''à l''échéance');
update public.subscriptions set expires_at = now() - interval '1 day', status = 'expired' where user_id = :'HB';
select tests.ok(not public._premium_of(:'HB'), 'ancienne ligne expirée : plus de Premium');

select tests.ok(
  (select column_default from information_schema.columns where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'entitlement') like '%HOMI_PREMIUM%',
  'valeur par défaut de la colonne : HOMI_PREMIUM');

delete from public.subscriptions where user_id in (:'HA', :'HB');
delete from auth.users where id in (:'HA', :'HB');
