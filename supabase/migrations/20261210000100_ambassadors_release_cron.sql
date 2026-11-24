-- =====================================================================
-- HOMI Ambassadors : passage quotidien des commissions « en attente » → « disponible » après le délai (45 j).
-- Retour arrière : select cron.unschedule('homi-affiliate-release');
-- Même schéma que 20261208000100_conservation.sql : planifié seulement si pg_cron existe (pas sur le banc PG nu).
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'homi-affiliate-release';
    perform cron.schedule('homi-affiliate-release', '23 4 * * *', 'select public.affiliate_release_due()');
  else
    raise notice 'pg_cron indisponible : libération des commissions non planifiée';
  end if;
end $$;
