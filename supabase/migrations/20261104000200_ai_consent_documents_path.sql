-- =====================================================================
-- Audit du 01/11/2026 — deux corrections additives.
--
-- 1. Consentement « photo de cycle analysée par l'IA » (cycle_photo_ai)
--    Problème : la fonction cycle-photo envoyait la photo intime à Gemini sur la seule foi d'un
--    booléen envoyé par l'application ; aucune trace en base.
--    Correctif : nouveau motif de consentement ; la fonction enregistre l'accord (horodaté) AVANT
--    tout envoi et refuse si l'enregistrement échoue.
--
-- 2. Documents : le chemin du fichier doit appartenir au foyer du document
--    Problème : documents.storage_path n'était lié à aucun foyer. Un fichier orphelin (envoi réussi,
--    enregistrement échoué) dont on connaissait le chemin pouvait être rattaché à un autre foyer
--    puis lu.
--    Correctif : contrainte « <household_id>/<nom du fichier> » sur les NOUVELLES lignes
--    (NOT VALID : les lignes existantes ne sont pas bloquées) et chemin non modifiable ensuite.
--
-- Aucune donnée supprimée ni modifiée. Retour arrière en fin de fichier.
-- =====================================================================

-- 1. ------------------------------------------------------------------
alter table public.consents drop constraint if exists consents_purpose_check;
alter table public.consents add constraint consents_purpose_check check (purpose in
  ('terms','privacy_policy','adult_confirmation','health_data','analytics','crash_reports',
   'ai_assistant','document_reading','marketing','intimate_data','cycle_photo_ai'));

-- 2. ------------------------------------------------------------------
alter table public.documents drop constraint if exists documents_storage_path_household;
alter table public.documents add constraint documents_storage_path_household check (
  storage_path ~ '^[0-9a-f-]{36}/[^/]+$'
  and split_part(storage_path, '/', 1) = household_id::text
) not valid;

create or replace function public.documents_storage_path_immutable()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.storage_path is distinct from old.storage_path or new.household_id is distinct from old.household_id then
    raise exception 'Le fichier d’un document ne peut pas être déplacé' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists documents_storage_path_immutable on public.documents;
create trigger documents_storage_path_immutable before update of storage_path, household_id on public.documents
  for each row execute function public.documents_storage_path_immutable();

-- Retour arrière :
-- drop trigger if exists documents_storage_path_immutable on public.documents;
-- drop function if exists public.documents_storage_path_immutable();
-- alter table public.documents drop constraint if exists documents_storage_path_household;
-- alter table public.consents drop constraint if exists consents_purpose_check;
-- alter table public.consents add constraint consents_purpose_check check (purpose in
--   ('terms','privacy_policy','adult_confirmation','health_data','analytics','crash_reports',
--    'ai_assistant','document_reading','marketing','intimate_data'));
