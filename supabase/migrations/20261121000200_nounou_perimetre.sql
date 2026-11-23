-- =====================================================================
-- Espace Nounou (21/11/2026) — périmètre d'une nounou (caregiver) : rien du foyer hors des enfants confiés
-- Tests : supabase/tests/sql/98zb_espace_nounou.sql (section « périmètre »)
--
-- Constat (audit de l'espace nounou) : une nounou avec le seul domaine « daily » lisait, en plus du suivi des enfants
-- confiés, des données du foyer SANS enfant :
--   * family_domains, family_prep : répartition de la charge mentale du couple ;
--   * offduty_periods : périodes « hors service » des parents ;
--   * postpartum_shared_status : état post-partum partagé par la mère (politique « membre du foyer ») ;
--   * reminders partagés du foyer (politique « membre du foyer »).
-- Le carnet de la maison (house_notes : codes, contacts) RESTE visible : il est fait pour la personne qui garde
-- (supabase/tests/sql/83_charge_mentale.sql).
-- Correctif : politiques RESTRICTIVES « <table>_caregiver_closed ». Une nounou garde ses propres lignes (ses rappels,
-- ses périodes, un domaine qui lui est confié, une période dont elle est le relais) et tout ce qui porte un enfant confié (inchangé : RLS par enfant). Les parents ne perdent rien.
--
-- RESSERREMENT : une nounou existante qui lisait ces écrans ne les verra plus (aucune donnée supprimée).
-- Retour arrière : drop policy if exists <table>_caregiver_closed on public.<table>; pour chaque table ci-dessous.
-- =====================================================================

drop policy if exists family_domains_caregiver_closed on public.family_domains;
create policy family_domains_caregiver_closed on public.family_domains as restrictive for all to authenticated
  using (owner_id = auth.uid() or not public._is_caregiver_in(household_id))
  with check (owner_id = auth.uid() or not public._is_caregiver_in(household_id));

drop policy if exists family_prep_caregiver_closed on public.family_prep;
create policy family_prep_caregiver_closed on public.family_prep as restrictive for all to authenticated
  using (not public._is_caregiver_in(household_id)) with check (not public._is_caregiver_in(household_id));

drop policy if exists offduty_periods_caregiver_closed on public.offduty_periods;
create policy offduty_periods_caregiver_closed on public.offduty_periods as restrictive for all to authenticated
  using (user_id = auth.uid() or relay_to = auth.uid() or not public._is_caregiver_in(household_id))
  with check (user_id = auth.uid() or not public._is_caregiver_in(household_id));

drop policy if exists postpartum_shared_status_caregiver_closed on public.postpartum_shared_status;
create policy postpartum_shared_status_caregiver_closed on public.postpartum_shared_status as restrictive for all to authenticated
  using (user_id = auth.uid() or not public._is_caregiver_in(household_id))
  with check (user_id = auth.uid() or not public._is_caregiver_in(household_id));

drop policy if exists reminders_caregiver_closed on public.reminders;
create policy reminders_caregiver_closed on public.reminders as restrictive for all to authenticated
  using (user_id = auth.uid() or household_id is null or not public._is_caregiver_in(household_id))
  with check (user_id = auth.uid() or household_id is null or not public._is_caregiver_in(household_id));
