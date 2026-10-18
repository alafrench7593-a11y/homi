-- =====================================================================
-- Toi & Moi — Consentements donnés dans le formulaire d'inscription,
-- enregistrés AU MOMENT de l'inscription (même si l'adresse e-mail doit
-- encore être confirmée).
--
-- L'application envoie dans les métadonnées de signUp :
--   { "adult_confirmed": true, "terms_version": "2026-10", "privacy_version": "2026-10" }
-- Le déclencheur d'inscription crée alors, dans la même transaction :
--   profil, réglages de confidentialité, foyer ET trois lignes de consentement
--   (terms, privacy_policy, adult_confirmation) horodatées.
-- Inscription Apple / Google (sans métadonnées) : rien n'est enregistré ici,
-- l'application demande l'accord à l'onboarding (record_signup_consents).
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_terms text := left(nullif(trim(v_meta ->> 'terms_version'), ''), 40);
  v_privacy text := left(nullif(trim(v_meta ->> 'privacy_version'), ''), 40);
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.privacy_settings (user_id) values (new.id) on conflict do nothing;
  if not exists (select 1 from public.household_members where user_id = new.id) then
    insert into public.households (name, created_by, auto_created) values ('Ma famille', new.id, true);
  end if;
  if (v_meta ->> 'adult_confirmed') = 'true' and v_terms is not null and v_privacy is not null then
    insert into public.consents (user_id, purpose, granted, version) values
      (new.id, 'terms', true, v_terms),
      (new.id, 'privacy_policy', true, v_privacy),
      (new.id, 'adult_confirmation', true, v_terms);
  end if;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
