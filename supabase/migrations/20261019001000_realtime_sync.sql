-- =====================================================================
-- Synchronisation temps réel entre appareils et membres du foyer (Supabase Realtime).
-- Seules les tables partagées du quotidien et les notifications de la personne sont publiées ;
-- Realtime applique les politiques RLS de lecture de chaque abonné. Les données privées
-- (humeur, post-partum, cycle, documents, conversations) ne sont PAS publiées.
-- =====================================================================
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['bottles','breastfeeds','pumpings','diapers','sleeps','meals','child_observations','child_measurements',
                            'bottle_timers','appointments','family_tasks','care_shifts','care_requests','family_events','checklist_items','notifications'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
