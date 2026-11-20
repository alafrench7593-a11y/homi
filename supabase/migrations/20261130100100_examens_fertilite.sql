-- =====================================================================
-- Calendrier des examens du parcours fertilité (30/11/2026) — outil 27
-- Écran : src/app/fertility/exams.tsx (le guide existant reste la lecture ; les examens datés sont des RENDEZ-VOUS).
-- Tests : supabase/tests/sql/98zk_partiels2.sql
--
-- ADDITIF ET IDEMPOTENT. Un examen daté est un rendez-vous (table appointments : rappel, agenda, calendrier du
-- téléphone, mêmes règles de confidentialité — privé par défaut, partage choisi). On ajoute seulement :
--  - care_track : le parcours auquel le rendez-vous se rattache (« fertility ») pour que le calendrier des examens ne
--    montre que ceux-là ; NULL pour tous les autres rendez-vous (aucun changement de comportement).
--  - result_note : ce que la personne veut noter après l'examen (sans interprétation par l'application).
--  Aucun calendrier médical n'est inventé : seules les dates saisies existent.
-- Retour arrière : en fin de fichier.
-- =====================================================================
alter table public.appointments add column if not exists care_track text;
alter table public.appointments add column if not exists result_note text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'appointments_care_track_check' and conrelid = 'public.appointments'::regclass) then
    alter table public.appointments add constraint appointments_care_track_check check (care_track is null or care_track in ('fertility'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'appointments_result_note_check' and conrelid = 'public.appointments'::regclass) then
    alter table public.appointments add constraint appointments_result_note_check check (result_note is null or char_length(result_note) <= 1000);
  end if;
end $$;
create index if not exists appointments_care_track_idx on public.appointments(household_id, care_track) where care_track is not null;
comment on column public.appointments.care_track is 'Parcours du rendez-vous (« fertility » : calendrier des examens) ; NULL sinon.';
comment on column public.appointments.result_note is 'Note personnelle après l''examen (aucune interprétation par l''application).';

-- ---------------------------------------------------------------- Retour arrière (après accord)
-- alter table public.appointments drop constraint if exists appointments_care_track_check, drop constraint if exists appointments_result_note_check,
--   drop column if exists care_track, drop column if exists result_note;
