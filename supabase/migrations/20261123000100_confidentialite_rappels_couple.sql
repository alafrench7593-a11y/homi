-- =====================================================================================================================
-- Angles morts de confidentialité (audit du 23/11/2026). Migration ADDITIVE et IDEMPOTENTE : une fonction et deux
-- politiques RESTRICTIVES ajoutées ; aucune table, colonne ni donnée modifiée ; aucune politique existante retirée.
-- Tests : supabase/tests/sql/98ze_confidentialite_rappels_couple.sql
--
-- 1. Rappels « partagés » liés à une donnée de santé PERSONNELLE (pilule, contraception, cycle, fertilité, PMA,
--    traitement personnel « Mes traitements », médicament sans enfant) : lisibles par leur propriétaire et, s'il les
--    partage, par l'autre ADULTE ACTIF du foyer (propriétaire / co-parent) seulement — jamais par une nounou ni un
--    grand-parent invité (rôle « caregiver »), ni par un ancien membre.
--    Constat : la politique reminders_household_read (20261107000100_six_outils.sql) ouvrait un rappel partagé à TOUT
--    membre du foyer ; 20261121000200_nounou_perimetre.sql l'a déjà refermé pour le rôle « caregiver ». Ce verrou-ci
--    attache la règle à la NATURE du rappel (santé personnelle → parents seulement) plutôt qu'à l'énumération des
--    rôles : un futur rôle (ex. « grand-parent » distinct de « caregiver ») ne l'ouvrirait pas.
--    Accès retiré : AUCUN aujourd'hui (les seuls lecteurs non propriétaires possibles d'un rappel partagé sont déjà
--    les parents actifs). Les rappels de l'enfant (biberon, traitement prescrit à l'enfant, vaccin) ne sont pas visés.
-- 2. couple_checkins (« Point de couple ») : bilan COMMUN voulu à deux (une ligne par foyer et par semaine, écrite et
--    relue par les deux parents : src/app/family/couple.tsx). Il reste partagé entre les parents. Verrou restrictif
--    ajouté (défense en profondeur, même règle que la politique existante) : adulte ACTIF du foyer (owner / coparent)
--    seulement ; nounou, grand-parent invité, ancien membre et personne extérieure exclus. Accès retiré : aucun.
-- 3. couple_feelings / couple_messages (« Se comprendre ») et leur publication temps réel : revérifiés, conformes,
--    non modifiés (tests ajoutés).
--
-- Retour arrière :
--   drop policy if exists reminders_personal_health_parents on public.reminders;
--   drop policy if exists couple_checkins_active_parents on public.couple_checkins;
--   drop function if exists public._reminder_is_personal_health(text, uuid, uuid, uuid, text);
-- =====================================================================================================================

-- ---------------------------------------------------------------- 1. rappels de santé personnelle
-- Liens profonds des écrans de santé personnelle (src/components/Fertility.tsx, src/app/cycle/kit.tsx,
-- src/lib/data/hooks-tools6.ts « /fertility/pma », src/lib/data/hooks-myTreatments.ts « /medications?who=me »).
create or replace function public._reminder_is_personal_health(p_category text, p_child uuid, p_treatment uuid, p_my_treatment uuid, p_deep_link text)
returns boolean language sql immutable set search_path = public as $$
  select p_my_treatment is not null
      or (p_category = 'medication' and p_child is null and p_treatment is null)
      or coalesce(p_deep_link, '') ~ '^/(contraception|cycle|fertility|pma|ovulation|medications\?who=me|me/)';
$$;
revoke execute on function public._reminder_is_personal_health(text, uuid, uuid, uuid, text) from public, anon;
grant execute on function public._reminder_is_personal_health(text, uuid, uuid, uuid, text) to authenticated, service_role;

drop policy if exists reminders_personal_health_parents on public.reminders;
create policy reminders_personal_health_parents on public.reminders as restrictive for select to authenticated
  using (user_id = auth.uid()
         or not public._reminder_is_personal_health(category, child_id, treatment_id, my_treatment_id, deep_link)
         or public._is_parent_in(household_id));

-- ---------------------------------------------------------------- 2. point de couple : parents actifs seulement
drop policy if exists couple_checkins_active_parents on public.couple_checkins;
create policy couple_checkins_active_parents on public.couple_checkins as restrictive for all to authenticated
  using (public._is_parent_in(household_id)) with check (public._is_parent_in(household_id));
