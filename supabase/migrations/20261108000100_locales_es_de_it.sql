-- =====================================================================
-- Langues de l'application (08/11/2026) : espagnol, allemand, italien en plus du français et de l'anglais.
-- Additif : on élargit seulement la contrainte de profiles.locale (aucune donnée modifiée).
-- Retour arrière (après accord, et seulement si aucun profil n'utilise es/de/it) :
--   alter table public.profiles drop constraint profiles_locale_check;
--   alter table public.profiles add constraint profiles_locale_check check (locale in ('fr','en'));
-- =====================================================================
alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check check (locale in ('fr', 'en', 'es', 'de', 'it'));
