-- =====================================================================
-- Synchronisation : un relais de nuit attribué, déplacé, retiré ou réattribué
-- par quelqu'un d'autre prévient la personne concernée (notification « family »).
--  - jamais pour son propre geste ; jamais pour le temps pour soi (privé) ;
--  - les échanges acceptés sont déjà annoncés par la demande (pas de doublon) ;
--  - un planning de plusieurs nuits = UNE notification (regroupement sur 10 min, tant qu'elle n'est pas lue).
-- Texte neutre (écran verrouillé) : aucun détail de santé.
-- =====================================================================
create or replace function public.care_shifts_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_row public.care_shifts := coalesce(new, old);
  v_when text;
begin
  if v_row.kind <> 'night' then return null; end if;
  v_when := to_char(v_row.starts_at at time zone 'Europe/Paris', 'DD/MM à HH24:MI');

  if tg_op = 'INSERT' then
    if new.user_id is distinct from v_actor and not exists (
      select 1 from public.notifications n
      where n.user_id = new.user_id and n.category = 'family' and n.read_at is null
        and n.payload->>'kind' = 'night_plan' and n.created_at > now() - interval '10 minutes'
    ) then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
        values (new.user_id, 'family', 'Des nuits de relais vous sont proposées', 'Ouvrez le planning pour les confirmer.', '/family/nights',
                jsonb_build_object('kind', 'night_plan', 'shift_id', new.id));
    end if;
    return null;
  end if;

  if tg_op = 'DELETE' then
    if old.user_id is distinct from v_actor and old.ends_at > now() then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
        values (old.user_id, 'family', 'Une nuit de relais a été retirée', 'Nuit du ' || v_when || '.', '/family/nights', jsonb_build_object('kind', 'night_removed'));
    end if;
    return null;
  end if;

  -- UPDATE : les échanges acceptés passent par la demande (déjà notifiée)
  if new.status = 'swapped' and old.status is distinct from 'swapped' then return null; end if;
  if new.user_id is distinct from old.user_id then
    if new.user_id is distinct from v_actor then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
        values (new.user_id, 'family', 'Une nuit de relais vous est confiée', 'Nuit du ' || v_when || '.', '/family/nights', jsonb_build_object('kind', 'night_assigned', 'shift_id', new.id));
    end if;
    if old.user_id is distinct from v_actor then
      insert into public.notifications(user_id, category, title, body, deep_link, payload)
        values (old.user_id, 'family', 'Une nuit de relais a été confiée à quelqu’un d’autre', 'Nuit du ' || v_when || '.', '/family/nights', jsonb_build_object('kind', 'night_reassigned', 'shift_id', new.id));
    end if;
  elsif new.user_id is distinct from v_actor and (
        new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at
        or (new.status = 'cancelled' and old.status is distinct from 'cancelled')) then
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      values (new.user_id, 'family',
              case when new.status = 'cancelled' then 'Une nuit de relais a été annulée' else 'Une nuit de relais a été déplacée' end,
              'Nuit du ' || v_when || '.', '/family/nights', jsonb_build_object('kind', 'night_changed', 'shift_id', new.id));
  end if;
  return null;
end $$;

create trigger care_shifts_notify after insert or update or delete on public.care_shifts
  for each row execute function public.care_shifts_notify();
revoke all on function public.care_shifts_notify() from public;
