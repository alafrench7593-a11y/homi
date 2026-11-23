-- =====================================================================
-- Conservation des données (audit de confidentialité du 23/11/2026, préproduction).
--
-- Constat : le réglage « Durée de conservation de l'historique » (privacy_settings.retention_months, 6 à 120 mois,
-- 36 par défaut) n'était appliqué nulle part, et aucune purge n'était planifiée (photos de la nounou, crédits,
-- fichiers en échec, notifications, mesure d'audience conservées sans limite).
--
-- Cette migration :
--   1. purge chaque jour l'HISTORIQUE PERSONNEL de chaque personne au-delà de la durée qu'elle a choisie :
--      conversations et retours de l'assistant, bilans d'humeur / journal intime, scans de produits et leurs résultats ;
--   2. applique des durées fixes : notifications 90 jours, événements de mesure d'audience 13 mois, fichiers dont
--      la suppression échoue (5 essais) 30 jours ;
--   3. lance les maintenances existantes jamais planifiées : photos de l'espace nounou expirées (durée choisie par le
--      foyer), réserves de crédits orphelines.
-- Les données PARTAGÉES du foyer (suivis des enfants, documents, agenda) ne sont pas concernées : elles restent tant
-- que le foyer existe, ou jusqu'à leur suppression par une personne autorisée (texte du réglage mis à jour).
--
-- Retour arrière : select cron.unschedule('homi-conservation'); drop function public.purge_by_retention();
-- =====================================================================

-- pg_cron (Supabase) : planification si l'extension est disponible ; ailleurs (banc de test PostgreSQL nu) la
-- fonction existe et reste appelable, sans planification
do $$ begin create extension if not exists pg_cron; exception when others then raise notice 'pg_cron indisponible : purge non planifiée'; end $$;

create or replace function public.purge_by_retention()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r jsonb := '{}'::jsonb;
  n int;
  h uuid;
begin
  -- 1. Historique personnel : durée choisie par chaque personne
  create temporary table if not exists _cutoffs (user_id uuid primary key, cutoff timestamptz) on commit drop;
  truncate _cutoffs;
  insert into _cutoffs select user_id, now() - make_interval(months => retention_months) from public.privacy_settings;

  delete from public.assistant_messages m using _cutoffs c where m.user_id = c.user_id and m.created_at < c.cutoff;
  get diagnostics n = row_count; r := r || jsonb_build_object('assistant_messages', n);
  delete from public.assistant_conversations v using _cutoffs c
   where v.user_id = c.user_id and v.created_at < c.cutoff
     and not exists (select 1 from public.assistant_messages m where m.conversation_id = v.id);
  get diagnostics n = row_count; r := r || jsonb_build_object('assistant_conversations', n);
  delete from public.assistant_feedback f using _cutoffs c where f.user_id = c.user_id and f.created_at < c.cutoff;
  get diagnostics n = row_count; r := r || jsonb_build_object('assistant_feedback', n);
  delete from public.mood_checkins x using _cutoffs c where x.user_id = c.user_id and x.created_at < c.cutoff;
  get diagnostics n = row_count; r := r || jsonb_build_object('mood_checkins', n);
  delete from public.scan_results x using _cutoffs c where x.user_id = c.user_id and x.created_at < c.cutoff;
  get diagnostics n = row_count; r := r || jsonb_build_object('scan_results', n);
  delete from public.product_scans x using _cutoffs c where x.user_id = c.user_id and x.created_at < c.cutoff;
  get diagnostics n = row_count; r := r || jsonb_build_object('product_scans', n);

  -- 2. Durées fixes
  delete from public.notifications where created_at < now() - interval '90 days';
  get diagnostics n = row_count; r := r || jsonb_build_object('notifications', n);
  delete from public.analytics_events where created_at < now() - interval '13 months';
  get diagnostics n = row_count; r := r || jsonb_build_object('analytics_events', n);
  delete from public.storage_deletions where attempts >= 5 and queued_at < now() - interval '30 days';
  get diagnostics n = row_count; r := r || jsonb_build_object('storage_deletions_echecs', n);

  -- 3. Maintenances existantes, jamais planifiées jusqu'ici
  n := 0;
  for h in select distinct household_id from public.childcare_photos loop
    n := n + coalesce(public.childcare_purge_expired(h), 0);
  end loop;
  r := r || jsonb_build_object('childcare_photos', n);
  r := r || jsonb_build_object('credits', public.credits_maintenance());
  return r;
end;
$$;

revoke all on function public.purge_by_retention() from public, anon, authenticated;

-- Chaque nuit à 3 h 17 (UTC), en dehors des heures de pointe
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'homi-conservation';
    perform cron.schedule('homi-conservation', '17 3 * * *', 'select public.purge_by_retention()');
  end if;
end $$;
