-- =====================================================================================================================
-- « Se comprendre » en temps réel (22/11/2026). Migration ADDITIVE et idempotente (à relire avant application) :
-- couple_messages rejoint la publication supabase_realtime ; aucune table, colonne, politique ni donnée modifiée.
--
-- Pourquoi c'est sans risque d'exposition :
--  * Supabase Realtime (postgres_changes) applique la politique de LECTURE de chaque abonné avant d'envoyer une
--    insertion : celle de couple_messages (20261119100100_se_comprendre.sql) n'autorise que l'auteur et le
--    destinataire, adultes actifs du foyer (public._is_parent_in). La nounou, un autre adulte du foyer ou une
--    personne extérieure ne reçoivent donc rien (mêmes règles que la lecture directe, testées dans
--    98zb_coparent_confidentialite.sql) ;
--  * aucune modification possible (pas de droit UPDATE) : aucun événement de mise à jour ;
--  * suppression (par son auteur) : l'identité de réplication reste celle PAR DÉFAUT (clé primaire seule), donc
--    l'événement ne porte que l'identifiant du message, jamais son texte, son foyer ni ses personnes.
-- L'application s'abonne en filtrant sur son foyer (src/lib/sync.ts) ; le rafraîchissement toutes les 30 s n'est
-- plus utilisé que lorsque le temps réel est indisponible.
--
-- Retour arrière : alter publication supabase_realtime drop table public.couple_messages;
-- =====================================================================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'couple_messages') then
    alter publication supabase_realtime add table public.couple_messages;
  end if;
end $$;
