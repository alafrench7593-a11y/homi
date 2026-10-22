-- =====================================================================
-- « Suivre mon cycle » v3 (24 octobre 2026) : un seul espace, trois objectifs, saisie du jour en quelques secondes.
--  · Fiche du jour enrichie (symptom_logs) : humeurs, habitudes, étiquettes, sommeil détaillé, détails des règles.
--  · Nouveaux symptômes : migraine, douleur pendant un rapport, perte d'appétit, gonflement, douleur possiblement liée
--    à l'ovulation, inconfort intime.
--  · Contraception prise / oubliée / changée (contraception_logs), sans jamais recommander ni calculer.
--  · Préférences : favoris (5), icônes intimes affichées ou non, verrouillage biométrique (intime / tout le cycle),
--    anticipation des symptômes (Premium).
--  · Catégories personnalisées (Premium), étiquettes (3 en gratuit), retours sur les conseils.
--  · Confidentialité : un rapport ne s'enregistre qu'après l'activation explicite du suivi de la vie sexuelle ;
--    effacement de la seule vie sexuelle ; export et effacement complets.
-- =====================================================================

-- 1. Fiche du jour
alter table public.symptom_logs
  add column if not exists moods text[] not null default '{}',
  add column if not exists habits text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists sleep_bedtime time,
  add column if not exists sleep_waketime time,
  add column if not exists night_wakings smallint check (night_wakings is null or night_wakings between 0 and 20),
  add column if not exists nap boolean,
  add column if not exists sleep_tags text[] not null default '{}',
  add column if not exists fatigue smallint check (fatigue is null or fatigue between 1 and 5),
  add column if not exists period_color text,
  add column if not exists protection text,
  add column if not exists leak boolean,
  add column if not exists custom_items uuid[] not null default '{}',
  add column if not exists spotting boolean,
  -- Photo privée facultative : chiffrée sur l'appareil, compartiment « cycle-private » (même mécanisme que la glaire)
  add column if not exists photo_path text check (photo_path is null or photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.enc$');

alter table public.symptom_logs drop constraint if exists symptom_logs_moods_check;
alter table public.symptom_logs add constraint symptom_logs_moods_check
  check (moods <@ array['happy','calm','energetic','sensitive','irritable','anxious','sad','stressed','low','stable']::text[]);
alter table public.symptom_logs drop constraint if exists symptom_logs_habits_check;
alter table public.symptom_logs add constraint symptom_logs_habits_check
  check (habits <@ array['sport','walk','hydration','alcohol','tobacco','stress_day','travel','night_work','illness','event']::text[]);
alter table public.symptom_logs drop constraint if exists symptom_logs_sleep_tags_check;
alter table public.symptom_logs add constraint symptom_logs_sleep_tags_check check (sleep_tags <@ array['restful','difficult']::text[]);
create or replace function public.cycle_tags_valid(p text[])
returns boolean language sql immutable as $$
  select cardinality(p) <= 10 and not exists (select 1 from unnest(p) t where char_length(trim(t)) not between 1 and 30 or t ~ '[<>]');
$$;
alter table public.symptom_logs drop constraint if exists symptom_logs_tags_check;
alter table public.symptom_logs add constraint symptom_logs_tags_check check (public.cycle_tags_valid(tags));
alter table public.symptom_logs drop constraint if exists symptom_logs_period_color_check;
alter table public.symptom_logs add constraint symptom_logs_period_color_check check (period_color is null or period_color in ('red','dark_red','brown','pink','other'));
alter table public.symptom_logs drop constraint if exists symptom_logs_protection_check;
alter table public.symptom_logs add constraint symptom_logs_protection_check check (protection is null or protection in ('pad','tampon','cup','period_underwear','disc','other'));

-- Nouveaux symptômes (mêmes valeurs que SYMPTOM_KEYS côté application)
alter table public.symptom_logs drop constraint if exists symptom_logs_keys_check;
alter table public.symptom_logs add constraint symptom_logs_keys_check check (symptom_keys <@ array[
  'cramps','pelvic_pain','back_pain','pain','fatigue','headache','bloating','nausea','breast_tenderness','digestion','constipation','diarrhea',
  'skin','acne','libido_up','libido_down','dizziness','hot_flashes','cravings','insomnia','other',
  'migraine','dyspareunia','appetite_loss','swelling','ovulation_pain','discomfort','pain_other']::text[]);

-- Étiquettes : 3 étiquettes différentes en version gratuite (illimitées en Premium) ; les étiquettes déjà créées restent
create or replace function public.cycle_tags_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if cardinality(new.tags) = 0 or public.has_premium(new.user_id) then return new; end if;
  select count(distinct t) into v_count from (
    select unnest(tags) t from public.symptom_logs where user_id = new.user_id and id <> new.id
    union select unnest(new.tags)) x;
  if v_count > 3 and exists (select 1 from unnest(new.tags) t where t not in (select unnest(tags) from public.symptom_logs where user_id = new.user_id and id <> new.id)) then
    raise exception 'Fonction Premium (cycle_tags)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists symptom_logs_tags_limit on public.symptom_logs;
create trigger symptom_logs_tags_limit before insert or update of tags on public.symptom_logs for each row execute function public.cycle_tags_limit();

-- 2. Contraception prise, oubliée ou changée (déclarée par la personne ; jamais une recommandation)
create table if not exists public.contraception_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  kind text not null check (kind in ('pill_taken','pill_missed','patch_changed','ring_inserted','ring_removed','condom','device_declared','emergency_taken','treatment')),
  label text check (label is null or char_length(label) <= 80),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create unique index if not exists contraception_logs_daily_key on public.contraception_logs(user_id, logged_on, kind) where kind <> 'treatment';
create index if not exists contraception_logs_user_idx on public.contraception_logs(user_id, logged_on desc);
alter table public.contraception_logs enable row level security;
drop policy if exists contraception_logs_own on public.contraception_logs;
create policy contraception_logs_own on public.contraception_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3. Préférences du cycle
alter table public.cycle_preferences
  add column if not exists favorites text[],
  add column if not exists favorites_set_at timestamptz,
  add column if not exists show_intimacy_icons boolean not null default true,
  add column if not exists lock_mode text not null default 'off',
  add column if not exists anticipation boolean not null default false;
alter table public.cycle_preferences drop constraint if exists cycle_preferences_lock_mode_check;
alter table public.cycle_preferences add constraint cycle_preferences_lock_mode_check check (lock_mode in ('off','intimate','cycle'));
alter table public.cycle_preferences drop constraint if exists cycle_preferences_favorites_check;
alter table public.cycle_preferences add constraint cycle_preferences_favorites_check check (favorites is null or cardinality(favorites) <= 5);

-- Anticipation des symptômes : Premium (le réglage existant reste modifiable pour le désactiver)
create or replace function public.cycle_prefs_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.anticipation and not coalesce((case when tg_op = 'UPDATE' then old.anticipation end), false) and not public.has_premium(new.user_id) then
    raise exception 'Fonction Premium (cycle_anticipation)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
drop trigger if exists cycle_preferences_premium on public.cycle_preferences;
create trigger cycle_preferences_premium before insert or update on public.cycle_preferences for each row execute function public.cycle_prefs_premium();

-- 4. Vie sexuelle : uniquement après activation explicite (consentement), jamais partagée
alter table public.consents drop constraint if exists consents_purpose_check;
alter table public.consents add constraint consents_purpose_check check (purpose in
  ('terms','privacy_policy','adult_confirmation','health_data','analytics','crash_reports',
   'ai_assistant','document_reading','marketing','intimate_data'));

create or replace function public.intercourse_requires_optin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select track_intercourse from public.cycle_preferences where user_id = new.user_id), false) then
    raise exception 'Activez d''abord le suivi de la vie sexuelle (facultatif) dans la confidentialité du cycle' using errcode = 'P0001', hint = 'intimate_optin_required';
  end if;
  return new;
end $$;
drop trigger if exists intercourse_logs_optin on public.intercourse_logs;
create trigger intercourse_logs_optin before insert on public.intercourse_logs for each row execute function public.intercourse_requires_optin();

-- Effacer seulement la vie sexuelle (rapports, libido, inconfort, douleur pendant un rapport, préservatif)
create or replace function public.delete_my_intimate_data()
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  delete from public.intercourse_logs where user_id = auth.uid();
  delete from public.contraception_logs where user_id = auth.uid() and kind = 'condom';
  update public.symptom_logs set symptom_keys = array(select k from unnest(symptom_keys) k where k not in ('libido_up','libido_down','dyspareunia','discomfort'))
   where user_id = auth.uid() and symptom_keys && array['libido_up','libido_down','dyspareunia','discomfort'];
end $$;
revoke execute on function public.delete_my_intimate_data() from public, anon;
grant execute on function public.delete_my_intimate_data() to authenticated;

-- 5. Catégories personnalisées (Premium) et retours sur les conseils
create table if not exists public.cycle_custom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 30),
  icon text,
  created_at timestamptz not null default now()
);
alter table public.cycle_custom_items enable row level security;
drop policy if exists cycle_custom_items_own on public.cycle_custom_items;
create policy cycle_custom_items_own on public.cycle_custom_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function public.cycle_custom_items_premium()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_premium(new.user_id) then raise exception 'Fonction Premium (cycle_custom)' using errcode = 'P0001', hint = 'premium_required'; end if;
  if (select count(*) from public.cycle_custom_items where user_id = new.user_id) >= 30 then raise exception '30 catégories personnalisées au plus' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists cycle_custom_items_premium on public.cycle_custom_items;
create trigger cycle_custom_items_premium before insert on public.cycle_custom_items for each row execute function public.cycle_custom_items_premium();

create table if not exists public.cycle_insight_feedback (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  insight_key text not null check (char_length(insight_key) between 1 and 80),
  helpful boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, insight_key)
);
alter table public.cycle_insight_feedback enable row level security;
drop policy if exists cycle_insight_feedback_own on public.cycle_insight_feedback;
create policy cycle_insight_feedback_own on public.cycle_insight_feedback for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 6. Effacement et export
create or replace function public.delete_my_cycle_data()
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  delete from public.period_entries where user_id = auth.uid();
  delete from public.symptom_logs where user_id = auth.uid();
  delete from public.discharge_logs where user_id = auth.uid();
  delete from public.bleeding_logs where user_id = auth.uid();
  delete from public.cycle_journal where user_id = auth.uid();
  delete from public.fertility_observations where user_id = auth.uid();
  delete from public.ovulation_tests where user_id = auth.uid();
  delete from public.pregnancy_tests where user_id = auth.uid();
  delete from public.intercourse_logs where user_id = auth.uid();
  delete from public.contraception_logs where user_id = auth.uid();
  delete from public.cycle_custom_items where user_id = auth.uid();
  delete from public.cycle_insight_feedback where user_id = auth.uid();
end $$;
revoke execute on function public.delete_my_cycle_data() from public, anon;
grant execute on function public.delete_my_cycle_data() to authenticated;

alter function public.export_my_data() rename to _export_my_data_v13;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  return public._export_my_data_v13() || jsonb_build_object(
    'contraception_logs', (select coalesce(jsonb_agg(to_jsonb(c) order by c.logged_on), '[]') from public.contraception_logs c where c.user_id = v_uid),
    'cycle_custom_items', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from public.cycle_custom_items c where c.user_id = v_uid),
    'cycle_insight_feedback', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from public.cycle_insight_feedback c where c.user_id = v_uid),
    'cycle_preferences', (select to_jsonb(p) from public.cycle_preferences p where p.user_id = v_uid));
end $$;
revoke execute on function public._export_my_data_v13() from public, anon, authenticated;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- 7. Communauté : l'onglet « Moi » a quitté la barre ; le message de modération indique le profil communautaire
create or replace function public.on_moderated()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_link text; v_what text; v_post uuid;
begin
  if new.status is not distinct from old.status or auth.uid() is not distinct from new.author_id then return new; end if;
  if tg_table_name = 'posts' then
    v_post := new.id; v_link := '/community/post/' || new.id; v_what := 'Votre publication';
  else
    v_post := new.post_id; v_link := '/community/post/' || new.post_id || '?comment=' || new.id; v_what := 'Votre commentaire';
  end if;
  if new.status in ('hidden', 'removed') and old.status in ('visible', 'pending_review') then
    perform public.community_notify(new.author_id, 'moderation', 'community_moderation',
      v_what || case when new.status = 'removed' then ' a été retiré par la modération' else ' a été masqué en attendant la modération' end,
      'Il ne respecte peut-être pas les règles de la communauté. Vous pouvez le retrouver dans votre profil communautaire.', v_link,
      jsonb_build_object('post_id', v_post, 'status', new.status));
  elsif new.status = 'visible' and old.status in ('pending_review', 'hidden') then
    perform public.community_notify(new.author_id, 'moderation', 'community_moderation', v_what || ' est maintenant visible',
      null, v_link, jsonb_build_object('post_id', v_post, 'status', new.status));
  end if;
  return new;
end $$;

-- 7. Supprimer un parcours du cycle efface aussi les prises de contraception datées de sa période
create or replace function public.delete_journey(p_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare j public.user_journeys; v_from date; v_to date; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  select * into j from public.user_journeys where id = p_id and user_id = v_uid;
  if not found then raise exception 'Parcours introuvable' using errcode = 'P0002'; end if;
  v_from := j.started_on; v_to := coalesce(j.ended_on, current_date);
  if j.type in ('avoid', 'ttc', 'cycle') then
    create temp table if not exists _keep_days (d date primary key) on commit drop;
    delete from _keep_days;
    insert into _keep_days select generate_series(o.started_on, coalesce(o.ended_on, current_date), interval '1 day')::date
      from public.user_journeys o where o.user_id = v_uid and o.id <> j.id and o.type in ('avoid', 'ttc', 'cycle') on conflict do nothing;
    delete from public.period_entries where user_id = v_uid and start_date between v_from and v_to and start_date not in (select d from _keep_days);
    delete from public.symptom_logs where user_id = v_uid and logged_on between v_from and v_to and logged_on not in (select d from _keep_days);
    delete from public.discharge_logs where user_id = v_uid and observed_at::date between v_from and v_to and observed_at::date not in (select d from _keep_days);
    delete from public.bleeding_logs where user_id = v_uid and occurred_on between v_from and v_to and occurred_on not in (select d from _keep_days);
    delete from public.cycle_journal where user_id = v_uid and entry_on between v_from and v_to and entry_on not in (select d from _keep_days);
    delete from public.fertility_observations where user_id = v_uid and observed_on between v_from and v_to and observed_on not in (select d from _keep_days);
    delete from public.ovulation_tests where user_id = v_uid and tested_at::date between v_from and v_to and tested_at::date not in (select d from _keep_days);
    delete from public.pregnancy_tests where user_id = v_uid and tested_at::date between v_from and v_to and tested_at::date not in (select d from _keep_days);
    delete from public.intercourse_logs where user_id = v_uid and occurred_on between v_from and v_to and occurred_on not in (select d from _keep_days);
    delete from public.contraception_logs where user_id = v_uid and logged_on between v_from and v_to and logged_on not in (select d from _keep_days);
    -- rappels : arrêtés seulement si aucun parcours actif du même type ne les utilise encore
    if not exists (select 1 from public.user_journeys o where o.user_id = v_uid and o.id <> j.id and o.type = j.type and o.status = 'active') then
      update public.reminders set enabled = false where user_id = v_uid and journey_type = j.type;
    end if;
  elsif j.type = 'pregnancy' then
    -- Grossesse encore suivie dans un autre parcours actif (conjoint) : seul MON parcours est effacé
    if not exists (select 1 from public.user_journeys o where o.pregnancy_id = j.pregnancy_id and o.id <> j.id and o.status = 'active') then
      delete from public.maternal_weights where pregnancy_id = j.pregnancy_id;
      delete from public.pregnancies where id = j.pregnancy_id; -- bébés attendus, listes, rendez-vous, rappels : en cascade
    end if;
  elsif j.type = 'postpartum' then
    delete from public.postpartum_checkins where user_id = v_uid and checkin_date between v_from and v_to;
    delete from public.postpartum_actions where user_id = v_uid and done_on between v_from and v_to;
    if j.status = 'active' or not exists (select 1 from public.user_journeys o where o.user_id = v_uid and o.id <> j.id and o.type = 'postpartum' and o.status = 'active') then
      delete from public.postpartum_shared_status where user_id = v_uid;
      update public.postpartum_settings set active = false where user_id = v_uid;
    end if;
  end if;
  delete from public.user_journeys where id = j.id;
end $$;
