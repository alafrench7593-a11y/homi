-- =====================================================================
-- Rappels personnels : la limite gratuite (custom_reminders_count, 5 actifs) est aussi vérifiée à la MODIFICATION.
--
-- Constat (test supabase/tests/sql/81_premium_quota_update.sql) : le déclencheur reminders_custom_quota ne
-- s'exécutait qu'à l'INSERTION. Une application modifiée pouvait dépasser la limite sans abonnement :
--   - désactiver un rappel, en créer un autre, puis réactiver le premier (update enabled = true) ;
--   - créer un rappel « médicament » (jamais limité) puis changer sa catégorie en « personnel ».
-- Gravité : moyenne (contournement d'une fonction Premium par le serveur ; aucune donnée d'autrui exposée).
--
-- Correctif : même fonction, appelée aussi avant UPDATE de enabled / category / treatment_id. Le contrôle ne
-- s'applique que si la ligne DEVIENT un rappel personnel actif (elle ne l'était pas avant) : modifier, désactiver ou
-- renvoyer enabled = true sur un rappel déjà actif reste toujours possible (accès aux données déjà créées, y compris
-- après la fin d'un abonnement). Médicaments prescrits, biberons, vaccins, rendez-vous : jamais limités (inchangé).
-- Le rappel lui-même n'est pas compté (id <> new.id). Limite lue par _plan_limit_of (comme depuis
-- 20261102000100_membership_oracles).
--
-- Retour arrière (à exécuter à la main si nécessaire) :
--   drop trigger if exists reminders_custom_quota_update on public.reminders;
--   -- puis restaurer la fonction d'avant (insertion seulement, identique à 20261021000500_premium.sql
--   -- réécrite par 20261102000100_membership_oracles) :
--   create or replace function public.enforce_custom_reminders()
--   returns trigger language plpgsql security definer set search_path = public as $$
--   declare v_count int; v_limit int;
--   begin
--     if new.category <> 'custom' or new.treatment_id is not null then return new; end if;
--     v_limit := public._plan_limit_of('custom_reminders_count', new.user_id);
--     select count(*) into v_count from public.reminders where user_id = new.user_id and category = 'custom' and treatment_id is null and enabled;
--     if v_count >= v_limit then
--       raise exception 'Limite de la version gratuite atteinte (custom_reminders_count)' using errcode = 'P0001', hint = 'premium_required';
--     end if;
--     return new;
--   end $$;
-- =====================================================================

create or replace function public.enforce_custom_reminders()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int; v_limit int;
begin
  -- Seuls les rappels personnels actifs comptent (jamais un traitement prescrit, un biberon, un vaccin, un rendez-vous)
  if new.category <> 'custom' or new.treatment_id is not null or not coalesce(new.enabled, true) then return new; end if;
  -- Modification d'un rappel déjà personnel et actif : rien ne change dans le décompte
  if tg_op = 'UPDATE' and old.category = 'custom' and old.treatment_id is null and old.enabled then return new; end if;
  v_limit := public._plan_limit_of('custom_reminders_count', new.user_id);
  select count(*) into v_count from public.reminders
    where user_id = new.user_id and category = 'custom' and treatment_id is null and enabled and id <> new.id;
  if v_limit is not null and v_count >= v_limit then
    raise exception 'Limite de la version gratuite atteinte (custom_reminders_count)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;

drop trigger if exists reminders_custom_quota_update on public.reminders;
create trigger reminders_custom_quota_update before update of enabled, category, treatment_id on public.reminders
  for each row execute function public.enforce_custom_reminders();
