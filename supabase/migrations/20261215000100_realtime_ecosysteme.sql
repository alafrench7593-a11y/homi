-- Écosystème synchronisé (26/11/2026) : album, souvenirs (« premières fois », Mon histoire), santé et vaccins,
-- traitements et prises, premiers mots, dépenses du foyer et relais de biberon rejoignent le temps réel : ce qu'un parent
-- enregistre apparaît chez l'autre sans relancer l'écran. Aucune donnée modifiée ; la RLS de chaque table s'applique
-- aussi aux changements diffusés (un parent ne reçoit que ce qu'il a le droit de lire, photos privées comprises).
-- Retour arrière : alter publication supabase_realtime drop table public.<table>;
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['child_photos','child_milestones','child_health_items','child_vaccinations','child_treatments',
                           'treatment_logs','child_language_entries','household_expenses','bottle_relays'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
