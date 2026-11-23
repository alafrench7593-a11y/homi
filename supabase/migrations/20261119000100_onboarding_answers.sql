-- =====================================================================
-- HOMI — Onboarding v2 « première ouverture immersive » (19/11/2026)
-- Réponses du parcours d'accueil enregistrées sur le profil :
--   * profiles.onboarding_answers : situation, besoins, foyer, répartition des tâches et recommandations calculées
--     (aucun prénom, aucune date : la grossesse et les enfants restent dans leurs propres tables) ;
--   * profiles.onboarding_version : version du parcours qui les a produites (1 = ancien onboarding, 2 = v2).
-- Confidentialité : la table profiles est déjà sous RLS (profiles_self_select / profiles_self_update : id = auth.uid()) ;
-- ces colonnes en héritent — personne d'autre que la personne elle-même ne les lit ni ne les modifie. Elles ne sont
-- PAS exposées par household_member_names (5 colonnes fixes). L'export RGPD (profil complet) les inclut d'office.
-- Rétablir : alter table public.profiles drop column onboarding_answers, drop column onboarding_version;
-- =====================================================================

alter table public.profiles
  add column if not exists onboarding_answers jsonb,
  add column if not exists onboarding_version smallint;

-- Forme et taille bornées : un objet JSON de quelques centaines d'octets (on refuse tout gros contenu arbitraire)
alter table public.profiles drop constraint if exists profiles_onboarding_answers_shape;
alter table public.profiles
  add constraint profiles_onboarding_answers_shape
  check (onboarding_answers is null or (jsonb_typeof(onboarding_answers) = 'object' and pg_column_size(onboarding_answers) < 8000));

alter table public.profiles drop constraint if exists profiles_onboarding_version_range;
alter table public.profiles
  add constraint profiles_onboarding_version_range
  check (onboarding_version is null or onboarding_version between 1 and 100);

comment on column public.profiles.onboarding_answers is 'Onboarding v2 : réponses (situation, besoins, foyer, répartition) et recommandations calculées. Lisible par la personne seule (RLS profiles).';
comment on column public.profiles.onboarding_version is 'Version du parcours d''accueil qui a produit onboarding_answers.';

-- Garde-fou : la RLS de profiles doit rester active (cette migration n'ajoute aucune politique)
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass) then
    raise exception 'RLS désactivée sur public.profiles : onboarding_answers serait lisible par tous';
  end if;
end $$;
