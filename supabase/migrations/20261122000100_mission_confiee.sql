-- =====================================================================================================================
-- Notification de nouvelle mission : « <Prénom> t’a confié une mission » (22/11/2026). Migration ADDITIVE et
-- idempotente (à relire avant application) : une fonction ajoutée, le consommateur des événements mission.* remplacé.
-- Aucune table, aucune colonne, aucune donnée modifiée ; les notifications déjà créées restent telles quelles.
--
--  * Titre : « <Prénom> t’a confié une mission » (tutoiement entre parents), dans la langue du DESTINATAIRE
--    (profiles.locale : fr, en, es, de, it ; français sinon). Sans prénom affiché : « On t’a confié une mission ».
--    Le titre ne contient jamais la mission (avant : « Nouvelle mission : <titre> »).
--  * Texte : le titre de la mission SEULEMENT si le destinataire a choisi le détail sur l’écran verrouillé
--    (notification_settings.lockscreen_details, faux par défaut). Réglage de discrétion actif (cas par défaut) :
--    un texte sans contenu (« Ouvre HOMI pour répondre quand tu peux. »).
--  * Les autres événements (acceptée, terminée, annulée…) gardent leurs textes ; le reste du consommateur est la
--    copie exacte de la version de 20261119100000_confidentialite_coparent.sql (destinataires, préférences,
--    courses et stocks liés).
--  * Données jointes : « entrusted » = true (titre sans contenu). send-push (supabase/functions/_shared/push-rules.ts)
--    affiche alors ce titre sur l’écran verrouillé, avec un texte générique, sauf détail autorisé ; une notification
--    créée avant cette migration (titre « Nouvelle mission : <mission> ») reste entièrement générique.
--
-- Retour arrière : réappliquer public._consume_mission_event de 20261119100000_confidentialite_coparent.sql, puis
--   drop function if exists public._mission_entrusted_text(text, text, text, boolean);
-- =====================================================================================================================

-- Texte de la notification « nouvelle mission » pour UN destinataire (miroir : missionEntrustedText() dans
-- src/lib/domain/missions.ts). p_name : prénom affiché de la personne qui confie (NULL : inconnu) ; p_details :
-- le destinataire a choisi le détail des notifications (sinon : aucun contenu de la mission).
create or replace function public._mission_entrusted_text(p_lang text, p_name text, p_title text, p_details boolean, out title text, out body text)
language sql immutable as $$
  select left(case coalesce(p_lang, 'fr')
      when 'en' then case when p_name is null then 'You’ve been entrusted with a mission' else p_name || ' has entrusted you with a mission' end
      when 'es' then case when p_name is null then 'Te han confiado una misión' else p_name || ' te ha confiado una misión' end
      when 'de' then case when p_name is null then 'Dir wurde ein Auftrag anvertraut' else p_name || ' hat dir einen Auftrag anvertraut' end
      when 'it' then case when p_name is null then 'Ti è stata affidata una missione' else p_name || ' ti ha affidato una missione' end
      else case when p_name is null then 'On t’a confié une mission' else p_name || ' t’a confié une mission' end
    end, 160),
    case when coalesce(p_details, false) and nullif(btrim(coalesce(p_title, '')), '') is not null then left(btrim(p_title), 160)
      else case coalesce(p_lang, 'fr')
        when 'en' then 'Open HOMI to reply when you can.'
        when 'es' then 'Abre HOMI para responder cuando puedas.'
        when 'de' then 'Öffne HOMI, um zu antworten, wenn du kannst.'
        when 'it' then 'Apri HOMI per rispondere quando puoi.'
        else 'Ouvre HOMI pour répondre quand tu peux.' end
    end;
$$;
revoke execute on function public._mission_entrusted_text(text, text, text, boolean) from public, anon, authenticated;

-- Consommateur des événements mission.* (version de 20261119100000_confidentialite_coparent.sql) + :
--  * « mission.requested » : « <Prénom> t’a confié une mission », langue et discrétion du destinataire.
create or replace function public._consume_mission_event(e public.household_events)
returns void language plpgsql security definer set search_path = public as $function$
declare
  t public.family_tasks; n record; v_to uuid; v_open boolean := false; v_list uuid; v_item uuid; v_label text; v_key uuid; v_stock uuid;
  v_prev text := coalesce(current_setting('homi.mission_action', true), '');
  v_actor text;
begin
  select * into t from public.family_tasks where id = nullif(e.payload ->> 'task_id', '')::uuid and household_id = e.household_id;
  if not found then return; end if;

  -- a) Notification au bon destinataire (texte neutre ; jamais à l'auteur du fait ; une seule fois par événement)
  v_to := case e.type::text
    when 'mission.requested' then t.assignee_id
    when 'mission.reminded'  then t.assignee_id
    when 'mission.cancelled' then t.assignee_id
    when 'mission.started'   then null
    else t.created_by end;
  v_open := e.type::text = 'mission.requested' and t.assignee_id is null;
  if e.type::text <> 'mission.started' and (v_to is not null or v_open) then
    select * into n from public._mission_notification(e.type::text, t.title);
    v_actor := public._first_name_of(e.actor_id);
    insert into public.notifications(user_id, category, title, body, deep_link, payload)
      select m.user_id, 'family',
             case
               -- Nouvelle mission : « <Prénom> t’a confié une mission » (langue du destinataire ; jamais la mission dans le titre)
               when e.type::text = 'mission.requested' then (public._mission_entrusted_text(pr.locale, v_actor, t.title, ns.lockscreen_details)).title
               -- Mission terminée : « <Prénom> a terminé : <mission> » (prénom affiché de la personne qui l'a faite)
               when e.type::text = 'mission.completed' then left(coalesce(public._first_name_of(e.actor_id), 'Quelqu’un') || ' a terminé : ' || t.title, 160)
               else n.title end,
             case when e.type::text = 'mission.requested' then (public._mission_entrusted_text(pr.locale, v_actor, t.title, ns.lockscreen_details)).body else n.body end,
             '/family/missions/' || t.id,
             -- « entrusted » : titre sans contenu (send-push peut l'afficher tel quel sur l'écran verrouillé)
             jsonb_build_object('task_id', t.id, 'event_id', e.id, 'mission', e.type::text)
               || case when e.type::text = 'mission.requested' then jsonb_build_object('entrusted', true) else '{}'::jsonb end
      from public.household_members m
      left join public.profiles pr on pr.id = m.user_id
      left join public.notification_settings ns on ns.user_id = m.user_id
      where m.household_id = t.household_id
        and m.user_id is distinct from e.actor_id
        and (case when v_open then m.user_id is distinct from t.created_by else m.user_id = v_to end)
        and (m.role = 'owner' or 'lists' = any(m.can_view))
        and (t.child_id is null or public._member_child_allowed(m.role, m.child_scope, t.child_id))
        -- préférence de la personne : « Mission terminée » seulement si elle l'a gardée active (par défaut : oui)
        and not (e.type::text = 'mission.completed' and coalesce(ns.mission_done, true) = false)
        and not exists (select 1 from public.notifications x where x.user_id = m.user_id and x.payload ->> 'event_id' = e.id::text);
  end if;

  -- b) Mission d'achat acceptée (ou commencée) : l'article de courses lié existe, une seule fois, relié au stock
  if e.type::text in ('mission.accepted', 'mission.started') and t.shopping_item_id is null and t.mission_state in ('accepted', 'in_progress')
     and (t.product_label is not null or t.category = 'shopping') then
    v_label := left(btrim(coalesce(t.product_label, t.title)), 120);
    v_stock := coalesce(t.stock_id, public._stock_match(t.household_id, v_label));
    select id into v_list from public.shopping_lists where household_id = t.household_id order by created_at desc limit 1;
    if v_list is null then
      insert into public.shopping_lists(household_id, title, created_by) values (t.household_id, 'Courses', coalesce(e.actor_id, t.created_by))
        returning id into v_list;
    end if;
    select id into v_item from public.shopping_items
      where list_id = v_list and not checked and public._norm_label(label) = public._norm_label(v_label) order by position, id limit 1;
    if v_item is null then
      v_key := md5('mission-item:' || t.id::text)::uuid;
      insert into public.shopping_items(list_id, household_id, label, client_id, position, stock_id, category, assignee_id)
        values (v_list, t.household_id, v_label, v_key, coalesce((select max(position) + 1 from public.shopping_items where list_id = v_list), 0),
                v_stock, (select category from public.household_stocks where id = v_stock), t.assignee_id)
        on conflict (household_id, client_id) do nothing
        returning id into v_item;
      if v_item is null then select id into v_item from public.shopping_items where household_id = t.household_id and client_id = v_key; end if;
    elsif v_stock is not null then
      update public.shopping_items set stock_id = v_stock where id = v_item and stock_id is null;
    end if;
    perform set_config('homi.mission_action', 'on', true);
    update public.family_tasks set shopping_item_id = v_item where id = t.id and shopping_item_id is null;
    perform set_config('homi.mission_action', v_prev, true);
  end if;

  -- c) Mission terminée : l'article lié est coché (une seule fois ; jamais décoché par ce chemin). Le fait
  --    shopping.item_checked qui en découle retrouvera la mission déjà terminée : aucune boucle.
  if e.type::text = 'mission.completed' and t.shopping_item_id is not null then
    update public.shopping_items set checked = true, checked_by = coalesce(e.actor_id, checked_by), checked_at = now()
      where id = t.shopping_item_id and household_id = t.household_id and not checked;
  end if;
end $function$;
revoke execute on function public._consume_mission_event(public.household_events) from public, anon, authenticated;
