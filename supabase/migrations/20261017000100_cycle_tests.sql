-- =====================================================================
-- Toi & Moi — « Comprendre mon cycle et mes tests »
--   * glaire cervicale : vocabulaire élargi, texture, sensation et
--     suggestion (facultative) issue d'une photo ;
--   * tests d'ovulation et de grossesse : marque, format, délai de
--     lecture, résultat d'analyse de photo (toujours confirmé par la
--     personne) ;
--   * préférences du suivi de cycle ;
--   * stockage privé « cycle-private » des photos CHIFFRÉES.
--
-- Toutes ces données sont INTIMES : RLS propriétaire uniquement, jamais
-- partagées avec le foyer ni le coparent. Seul l'export RGPD de la
-- personne elle-même les contient (sans le contenu des fichiers).
-- =====================================================================

-- Chemin d'une photo chiffrée : « <uid propriétaire>/<uuid>.enc »
-- (le premier segment DOIT être l'identifiant de la propriétaire de la ligne)

-- ---------------------------------------------------------------------
-- Observations de glaire cervicale
-- ---------------------------------------------------------------------
alter table public.fertility_observations drop constraint if exists fertility_observations_cervical_mucus_check;
alter table public.fertility_observations add constraint fertility_observations_cervical_mucus_check
  -- dry = sèche ou absente, sticky = épaisse ou collante, creamy = crémeuse,
  -- egg_white = transparente et étirable, watery = aqueuse,
  -- unusual = inhabituelle, unknown = je ne sais pas
  check (cervical_mucus in ('dry','sticky','creamy','egg_white','watery','unusual','unknown'));

alter table public.fertility_observations
  add column mucus_texture text
    check (mucus_texture in ('stretchy','sticky','creamy','liquid','lumpy','unknown')),
  add column mucus_sensation text
    check (mucus_sensation in ('dry','damp','wet','slippery','unknown')),
  -- Suggestion pédagogique issue d'une photo : jamais une conclusion, la personne choisit elle-même
  add column photo_suggestion text
    check (photo_suggestion in ('dry','sticky','creamy','egg_white','watery','unusual','unanalyzable')),
  add column photo_confidence numeric(3,2) check (photo_confidence between 0 and 1),
  add column photo_path text,
  add constraint fertility_observations_photo_path_check
    check (photo_path is null or (photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.enc$' and split_part(photo_path, '/', 1) = user_id::text));

-- « Au moins une valeur » : la texture ou la sensation seules suffisent désormais
alter table public.fertility_observations drop constraint if exists fertility_observations_check;
alter table public.fertility_observations add constraint fertility_observations_check
  check (bbt_celsius is not null or cervical_mucus is not null or mucus_texture is not null
         or mucus_sensation is not null or note is not null);

-- ---------------------------------------------------------------------
-- Tests d'ovulation (LH)
-- ---------------------------------------------------------------------
alter table public.ovulation_tests drop constraint if exists ovulation_tests_result_check;
alter table public.ovulation_tests add constraint ovulation_tests_result_check
  check (result in ('negative','positive','peak','invalid','uncertain'));

alter table public.ovulation_tests
  add column brand_id text check (char_length(brand_id) <= 60),
  add column brand_label text check (char_length(brand_label) <= 80),
  add column format text check (format in ('lines','digital')),
  add column minutes_after int check (minutes_after between 0 and 1440),
  add column within_read_window text check (within_read_window in ('yes','no','unknown')),
  add column analysis_outcome text
    check (analysis_outcome in ('lh_peak_possible','lh_peak_not_detected','invalid','uncertain','unusable')),
  add column analysis_confidence numeric(3,2) check (analysis_confidence between 0 and 1),
  add column analysis_method text check (analysis_method in ('on_device_lines','on_device_ocr','manual')),
  add column user_confirmed boolean not null default false,
  add column photo_path text,
  add constraint ovulation_tests_photo_path_check
    check (photo_path is null or (photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.enc$' and split_part(photo_path, '/', 1) = user_id::text));

-- ---------------------------------------------------------------------
-- Tests de grossesse (hCG)
-- ---------------------------------------------------------------------
alter table public.pregnancy_tests drop constraint if exists pregnancy_tests_result_check;
alter table public.pregnancy_tests add constraint pregnancy_tests_result_check
  check (result in ('negative','positive','faint','invalid','uncertain'));

alter table public.pregnancy_tests
  add column brand_id text check (char_length(brand_id) <= 60),
  add column brand_label text check (char_length(brand_label) <= 80),
  add column format text check (format in ('lines','cross','digital')),
  add column minutes_after int check (minutes_after between 0 and 1440),
  add column within_read_window text check (within_read_window in ('yes','no','unknown')),
  add column analysis_outcome text
    check (analysis_outcome in ('possibly_positive','possibly_negative','invalid','uncertain','unusable')),
  add column analysis_confidence numeric(3,2) check (analysis_confidence between 0 and 1),
  add column analysis_method text check (analysis_method in ('on_device_lines','on_device_ocr','manual')),
  add column user_confirmed boolean not null default false,
  add column expected_period_on date,
  add column photo_path text,
  add constraint pregnancy_tests_photo_path_check
    check (photo_path is null or (photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.enc$' and split_part(photo_path, '/', 1) = user_id::text));

-- ---------------------------------------------------------------------
-- Préférences du suivi de cycle (une ligne par personne)
-- ---------------------------------------------------------------------
create table public.cycle_preferences (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  track_intercourse boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger cycle_preferences_touch before update on public.cycle_preferences
  for each row execute function public.touch_updated_at();

select public._apply_owner_policies('cycle_preferences');
revoke all on public.cycle_preferences from anon;

-- ---------------------------------------------------------------------
-- Stockage privé des photos du cycle (glaire, tests)
--
-- Les fichiers sont chiffrés (AES-GCM) SUR LE TÉLÉPHONE avant l'envoi ;
-- la clé reste dans le trousseau sécurisé de l'appareil. Le serveur ne
-- voit donc jamais d'image en clair : uniquement des octets opaques
-- (application/octet-stream). Chemin : « <uid>/<uuid>.enc ».
-- Aucune politique de mise à jour : un fichier se supprime puis se renvoie.
-- Note : split_part(name, '/', 1) équivaut à (storage.foldername(name))[1].
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cycle-private', 'cycle-private', false, 6291456, array['application/octet-stream'])
on conflict (id) do nothing;

create policy "cycle-private read" on storage.objects for select to authenticated
  using (bucket_id = 'cycle-private' and split_part(name, '/', 1) = auth.uid()::text);
create policy "cycle-private upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'cycle-private' and split_part(name, '/', 1) = auth.uid()::text
              and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.enc$');
create policy "cycle-private delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cycle-private' and split_part(name, '/', 1) = auth.uid()::text);

-- ---------------------------------------------------------------------
-- Export RGPD : ajout des préférences du cycle. Les nouvelles colonnes
-- des tests et observations sont déjà incluses (lignes complètes) ;
-- le contenu des fichiers chiffrés n'est jamais exporté.
-- ---------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_v4;
revoke execute on function public._export_my_data_v4() from public, anon, authenticated;

create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  v := public._export_my_data_v4();
  v := jsonb_set(v, '{personal}', (v -> 'personal') || jsonb_build_object(
    'cycle_preferences', (select coalesce(jsonb_agg(t), '[]') from public.cycle_preferences t where user_id = v_uid)
  ));
  return v;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- Suppression du compte : les lignes partent en cascade avec auth.users ;
-- les fichiers « cycle-private/<uid>/… » sont effacés par la fonction
-- backend delete-account.
