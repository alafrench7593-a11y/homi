-- =====================================================================
-- « Intimité sans pression » (30/11/2026) — outil 175, dans « Se comprendre » (/family/understand, catégorie
-- « Intimité et proximité »). L'écran couvrait la fatigue, la tendresse, le temps, l'absence d'envie ; il manquait
-- une formulation pour dire une ENVIE de proximité sans rien attendre en retour (« desire »).
-- Tests : supabase/tests/sql/98zk_partiels2.sql, src/__tests__/understandGuards.test.ts
-- ADDITIF ET IDEMPOTENT : la liste des situations acceptées est élargie, rien d'autre ne change (aucun suivi de
-- fréquence, rien n'est envoyé sans confirmation : couple_send inchangée).
-- =====================================================================
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.couple_messages'::regclass and contype = 'c'
    and pg_get_constraintdef(oid) like '%situation%' loop
    execute format('alter table public.couple_messages drop constraint %I', c);
  end loop;
  alter table public.couple_messages add constraint couple_messages_situation_check
    check (situation is null or situation in ('fatigue', 'mental_load', 'tenderness', 'time', 'postpartum', 'fear', 'no_sex_now', 'desire'));
end $$;

-- ---------------------------------------------------------------- Retour arrière (après accord ; supprimer d'abord
-- les messages « desire » ou les passer à NULL) :
-- alter table public.couple_messages drop constraint couple_messages_situation_check;
-- alter table public.couple_messages add constraint couple_messages_situation_check check (situation is null or situation in
--   ('fatigue', 'mental_load', 'tenderness', 'time', 'postpartum', 'fear', 'no_sex_now'));
