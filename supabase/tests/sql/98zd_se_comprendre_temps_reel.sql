-- =====================================================================
-- « Se comprendre » en temps réel (20261122000200_se_comprendre_temps_reel.sql) : couple_messages est publiée, et
-- rien de ce qui protège les messages ne change (RLS, droits, identité de réplication).
-- =====================================================================
reset role;
select tests.ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'couple_messages'),
  'temps réel : couple_messages publiée');
select tests.ok(not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'couple_feelings'),
  'temps réel : les ressentis privés (couple_feelings) ne sont jamais publiés');
select tests.ok((select relrowsecurity from pg_class where oid = 'public.couple_messages'::regclass),
  'temps réel : RLS active sur couple_messages (Realtime n''envoie une insertion qu''aux abonnés qui peuvent la lire)');
select tests.ok((select relreplident = 'd' from pg_class where oid = 'public.couple_messages'::regclass),
  'temps réel : identité de réplication par défaut (une suppression ne transporte que l''identifiant, jamais le texte)');
select tests.ok((select array_agg(policyname::text order by policyname) from pg_policies where schemaname = 'public' and tablename = 'couple_messages')
  = array['couple_messages_delete', 'couple_messages_read'],
  'temps réel : lecture réservée à l''auteur et au destinataire (aucune politique plus large)');
select tests.ok((select qual from pg_policies where schemaname = 'public' and tablename = 'couple_messages' and policyname = 'couple_messages_read') like '%author_id = auth.uid()%recipient_id = auth.uid()%_is_parent_in(household_id)%',
  'temps réel : la politique de lecture vérifie auteur ou destinataire, adulte actif du foyer');
select tests.ok(not has_table_privilege('authenticated', 'public.couple_messages', 'update') and not has_table_privilege('anon', 'public.couple_messages', 'select'),
  'temps réel : ni modification (aucun événement de mise à jour), ni lecture anonyme');
-- idempotence : la migration se rejoue sans erreur
\ir ../../migrations/20261122000200_se_comprendre_temps_reel.sql
select tests.ok((select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'couple_messages') = 1,
  'temps réel : migration rejouée sans doublon');
