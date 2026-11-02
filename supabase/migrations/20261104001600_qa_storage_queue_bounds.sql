-- =====================================================================
-- Campagne QA du 02/11/2026 — correctifs serveur additifs.
--
-- B-10 (P3) : la base ne supprime jamais les fichiers. Une publication supprimée avec un groupe
--   privé (cascade), un album ou une photo d'enfant effacés par la base laissaient leurs fichiers
--   dans le stockage, sans que personne ne puisse plus les retrouver.
--   → file public.storage_deletions remplie à la suppression des lignes de photos ; la fonction
--   serveur « storage-cleanup » (planifiée) supprime les fichiers puis vide la file.
-- F-07 (P3) : rendez-vous au 01/01/1900 ou en 2199 acceptés. → bornes larges sur les NOUVELLES
--   lignes (NOT VALID : rien d'existant n'est bloqué) ; l'appli applique des bornes plus strictes.
-- C-01 (P4) : rate_limits gardait des droits d'écriture pour anon/authenticated (neutralisés par
--   la RLS seulement). → droits retirés (le serveur y écrit avec service_role).
-- Retour arrière en fin de fichier.
-- =====================================================================

create table if not exists public.storage_deletions (
  id bigint generated always as identity primary key,
  bucket text not null,
  path text not null,
  queued_at timestamptz not null default now(),
  attempts int not null default 0
);
create index if not exists storage_deletions_queued_idx on public.storage_deletions(queued_at);
alter table public.storage_deletions enable row level security; -- aucune politique : service_role uniquement
revoke all on public.storage_deletions from public, anon, authenticated;

create or replace function public.queue_storage_deletion()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_path text := to_jsonb(old) ->> tg_argv[1]; -- colonne du chemin, selon la table
begin
  if v_path is not null then
    insert into public.storage_deletions(bucket, path) values (tg_argv[0], v_path);
  end if;
  return old;
end $$;
revoke execute on function public.queue_storage_deletion() from public, anon, authenticated;

drop trigger if exists post_photos_queue_storage on public.post_photos;
create trigger post_photos_queue_storage after delete on public.post_photos
  for each row execute function public.queue_storage_deletion('community', 'path');
drop trigger if exists album_photos_queue_storage on public.album_photos;
create trigger album_photos_queue_storage after delete on public.album_photos
  for each row execute function public.queue_storage_deletion('community', 'path');
drop trigger if exists child_photos_queue_storage on public.child_photos;
create trigger child_photos_queue_storage after delete on public.child_photos
  for each row execute function public.queue_storage_deletion('child-photos', 'storage_path');

alter table public.appointments drop constraint if exists appointments_starts_at_bounds;
alter table public.appointments add constraint appointments_starts_at_bounds
  check (starts_at >= timestamptz '2000-01-01' and starts_at < timestamptz '2100-01-01') not valid;

revoke all on public.rate_limits from anon, authenticated;

-- Retour arrière :
-- grant select, insert, update, delete on public.rate_limits to anon, authenticated;
-- alter table public.appointments drop constraint if exists appointments_starts_at_bounds;
-- drop trigger if exists child_photos_queue_storage on public.child_photos;
-- drop trigger if exists album_photos_queue_storage on public.album_photos;
-- drop trigger if exists post_photos_queue_storage on public.post_photos;
-- drop function if exists public.queue_storage_deletion();
-- drop table if exists public.storage_deletions;
