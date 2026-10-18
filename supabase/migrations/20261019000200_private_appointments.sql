-- =====================================================================
-- Rendez-vous privés : un rendez-vous peut être réservé à la personne qui
-- l'a créé (consultation post-partum, psychologue…). Par défaut, rien ne
-- change : les rendez-vous restent partagés avec le foyer (domaine santé).
-- =====================================================================
alter table public.appointments add column if not exists private_to_creator boolean not null default false;
alter table public.appointments add constraint appointments_private_needs_creator check (not private_to_creator or created_by is not null);

drop policy if exists appointments_sel on public.appointments;
drop policy if exists appointments_ins on public.appointments;
drop policy if exists appointments_upd on public.appointments;
drop policy if exists appointments_del on public.appointments;

create policy appointments_sel on public.appointments for select to authenticated
  using (public.can_access_household(household_id, 'health', false) and (not private_to_creator or created_by = auth.uid()));
create policy appointments_ins on public.appointments for insert to authenticated
  with check (public.can_access_household(household_id, 'health', true) and (not private_to_creator or created_by = auth.uid()));
create policy appointments_upd on public.appointments for update to authenticated
  using (public.can_access_household(household_id, 'health', true) and (not private_to_creator or created_by = auth.uid()))
  with check (public.can_access_household(household_id, 'health', true) and (not private_to_creator or created_by = auth.uid()));
create policy appointments_del on public.appointments for delete to authenticated
  using (public.can_access_household(household_id, 'health', true) and (not private_to_creator or created_by = auth.uid()));
