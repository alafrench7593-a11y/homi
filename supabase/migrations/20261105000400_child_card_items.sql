-- =====================================================================
-- Fiche de mon enfant (04/11/2026, scripts 93 « Il n'est pas mal élevé » et 95 « L'allergie à la cantine »)
--  * Deux nouveaux types dans child_health_items : « soothe » (ce qui l'apaise : bruit, lumière, objet, phrase…)
--    et « info » (à savoir pour l'école, la nounou, les grands-parents).
--  * Additif et réversible : retour arrière = supprimer ces lignes puis remettre la contrainte à 4 valeurs.
-- =====================================================================
alter table public.child_health_items drop constraint if exists child_health_items_kind_check;
alter table public.child_health_items add constraint child_health_items_kind_check
  check (kind in ('vaccine_to_check','allergy','treatment','contact','soothe','info'));
