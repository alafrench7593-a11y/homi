-- =====================================================================
-- Documents v2 : gestionnaire de documents de santé et de famille.
--  1. Privé par défaut : un nouveau document n'est visible que par la personne qui l'a déposé.
--     Le partage avec le foyer est un choix explicite, révocable (retour à « privé »).
--  2. Le texte lu, les champs extraits et les résumés suivent EXACTEMENT les droits du document
--     (correction : ils suivaient auparavant les droits du foyer, même pour un document privé).
--  3. Classification élargie + catégories personnalisées, profil associé, favoris, archives.
--  4. Texte lu (OCR) et statut de vérification : rien n'est « vérifié » sans geste de l'utilisatrice ;
--     « confirmé par un professionnel » exige une mention de la source.
--  5. Suppression : le texte, les extractions, les résumés et les rappels créés depuis le document disparaissent avec lui.
-- =====================================================================

-- 1. Privé par défaut (les documents existants gardent leur réglage actuel)
alter table public.documents alter column private_to_uploader set default true;

-- 3. Classification
alter table public.documents drop constraint if exists documents_category_check;
alter table public.documents add constraint documents_category_check check (category in (
  -- historiques
  'ultrasound','report','blood_test','prescription','letter','photo','other',
  -- santé personnelle
  'exam_result','consultation','hospital','certificate','vaccination','allergy','chronic','dental','eye','physio','psych','gyneco',
  -- grossesse et maternité
  'prenatal','pregnancy_report','maternity','birth','postnatal',
  -- enfants
  'health_book','growth','development',
  -- autres
  'insurance','admin','invoice','appointment','personal','custom'
));
alter table public.documents
  add column if not exists custom_category text check (custom_category is null or char_length(btrim(custom_category)) between 1 and 40),
  add column if not exists favorite boolean not null default false,
  add column if not exists archived boolean not null default false,
  add column if not exists page_count int not null default 1 check (page_count between 1 and 200),
  add column if not exists ocr_text text check (ocr_text is null or char_length(ocr_text) <= 200000),
  add column if not exists ocr_source text check (ocr_source is null or ocr_source in ('device','server','manual')),
  add column if not exists review_status text not null default 'none' check (review_status in ('none','to_verify','verified')),
  add column if not exists updated_at timestamptz not null default now();
alter table public.documents add constraint documents_custom_needs_label check (category <> 'custom' or custom_category is not null);
-- Un document concerne au plus un profil : moi (aucun lien), un enfant, ou une grossesse
alter table public.documents add constraint documents_single_subject check (child_id is null or pregnancy_id is null);

-- Le profil associé doit appartenir au même foyer
create or replace function public.documents_check_subject()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.child_id is not null and not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Profil enfant hors du foyer' using errcode = '42501';
  end if;
  if new.pregnancy_id is not null and not exists (select 1 from public.pregnancies p where p.id = new.pregnancy_id and p.household_id = new.household_id) then
    raise exception 'Grossesse hors du foyer' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists documents_subject on public.documents;
create trigger documents_subject before insert or update on public.documents
  for each row execute function public.documents_check_subject();

-- Droits : un document privé ne se modifie et ne se supprime que par la personne qui l'a déposé
drop policy if exists documents_upd on public.documents;
create policy documents_upd on public.documents for update to authenticated
  using (uploaded_by = auth.uid() or (not private_to_uploader and public.is_household_owner(household_id)))
  with check (public.can_access_household(household_id, 'documents', true) and (uploaded_by = auth.uid() or not private_to_uploader));
drop policy if exists documents_del on public.documents;
create policy documents_del on public.documents for delete to authenticated
  using (uploaded_by = auth.uid() or (not private_to_uploader and public.is_household_owner(household_id)));

-- Le fichier d'un document privé ne peut être supprimé que par la personne qui l'a déposé
create or replace function public.document_file_is_private(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select d.private_to_uploader and d.uploaded_by <> auth.uid() from public.documents d where d.storage_path = p_name), false);
$$;
drop policy if exists "documents delete" on storage.objects;
create policy "documents delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (owner = auth.uid() or (public.is_household_owner(public.storage_household(name)) and not public.document_file_is_private(name))));

-- 2 et 4. Extractions (champs lus, texte, résumés) : mêmes droits que le document
alter table public.document_extractions
  add column if not exists kind text not null default 'fields' check (kind in ('fields','reading','summary')),
  add column if not exists level text check (level is null or level in ('quick','detailed','simple')),
  add column if not exists source text check (source is null or source in ('device','server','manual','local')),
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists professional_note text check (professional_note is null or char_length(professional_note) between 1 and 300);
alter table public.document_extractions drop constraint if exists document_extractions_status_check;
alter table public.document_extractions add constraint document_extractions_status_check
  check (status in ('to_verify','verified','professional','rejected'));
alter table public.document_extractions add constraint document_extractions_professional_documented
  check (status <> 'professional' or professional_note is not null);

drop policy if exists document_extractions_sel on public.document_extractions;
drop policy if exists document_extractions_ins on public.document_extractions;
drop policy if exists document_extractions_upd on public.document_extractions;
drop policy if exists document_extractions_del on public.document_extractions;
-- La sous-requête est soumise à la RLS de « documents » : un document invisible rend ses extractions invisibles.
create policy document_extractions_sel on public.document_extractions for select to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id));
create policy document_extractions_ins on public.document_extractions for insert to authenticated
  with check (exists (select 1 from public.documents d where d.id = document_id and public.can_access_household(d.household_id, 'documents', true)));
create policy document_extractions_upd on public.document_extractions for update to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id and public.can_access_household(d.household_id, 'documents', true)))
  with check (exists (select 1 from public.documents d where d.id = document_id and public.can_access_household(d.household_id, 'documents', true)));
create policy document_extractions_del on public.document_extractions for delete to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id and public.can_access_household(d.household_id, 'documents', true)));

-- La vérification est horodatée par le serveur, au nom de la personne connectée
create or replace function public.document_extractions_stamp()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status in ('verified','professional') and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    new.verified_by := auth.uid();
    new.verified_at := now();
  elsif new.status in ('to_verify','rejected') then
    new.verified_by := null;
    new.verified_at := null;
  end if;
  return new;
end $$;
drop trigger if exists document_extractions_stamp on public.document_extractions;
create trigger document_extractions_stamp before insert or update on public.document_extractions
  for each row execute function public.document_extractions_stamp();

-- 5. Suppression : rappels créés depuis le document (lien profond « /documents/<id> »)
create or replace function public.documents_cleanup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.reminders where deep_link = '/documents/' || old.id::text;
  return old;
end $$;
drop trigger if exists documents_cleanup on public.documents;
create trigger documents_cleanup after delete on public.documents
  for each row execute function public.documents_cleanup();

create index if not exists documents_subject_idx on public.documents(household_id, child_id, pregnancy_id);
