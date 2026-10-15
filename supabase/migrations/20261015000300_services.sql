-- =====================================================================
-- Toi & Moi — 0003 Rappels, notifications, contenus, assistant,
-- abonnements, produits, ressources d'urgence
-- =====================================================================

-- ---------------------------------------------------------------------
-- Appareils et rappels
-- ---------------------------------------------------------------------
create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios','android')),
  device_label text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
select public._apply_owner_policies('push_devices');

-- schedule : {"type":"once","at":"2026-11-02T09:30:00+01:00"}
--            {"type":"daily","hour":8,"minute":0}
--            {"type":"weekly","weekdays":[1,3,5],"hour":20,"minute":30}   (1 = lundi … 7 = dimanche)
--            {"type":"interval","minutes":180,"from_hour":6,"to_hour":22}
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  child_id uuid references public.children(id) on delete cascade,
  pregnancy_id uuid references public.pregnancies(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  category text not null check (category in ('appointment','ultrasound','exam','checklist','bottle','meal','medication','tracking','postnatal','custom')),
  title text not null check (char_length(title) between 1 and 80),
  body text check (char_length(body) <= 240),
  schedule jsonb not null check (schedule ? 'type' and schedule->>'type' in ('once','daily','weekly','interval')),
  timezone text not null default 'Europe/Paris',
  enabled boolean not null default true,
  snoozed_until timestamptz,
  deep_link text check (deep_link is null or deep_link like '/%'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reminders_user_idx on public.reminders(user_id) where enabled;
create trigger reminders_touch before update on public.reminders for each row execute function public.touch_updated_at();
alter table public.reminders enable row level security;
create policy reminders_owner on public.reminders for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (household_id is null or public.is_household_member(household_id)));

-- Centre de notifications (boîte de réception)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('reminder','community_reply','community_comment','assistant','subscription','product_recall','system')),
  title text not null,
  body text,
  deep_link text,
  payload jsonb not null default '{}',
  read_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_owner_sel on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_owner_upd on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_owner_del on public.notifications for delete to authenticated using (user_id = auth.uid());
-- Insertion : uniquement par le serveur (triggers / fonctions / service_role)

-- ---------------------------------------------------------------------
-- Contenus éditoriaux (articles, vidéos) avec traçabilité des sources
-- ---------------------------------------------------------------------
create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  icon text,
  position int not null default 0
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid references public.content_categories(id) on delete set null,
  title text not null,
  summary text not null,
  body_md text not null,
  journeys text[] not null default '{}',
  min_week smallint, max_week smallint,            -- semaines d'aménorrhée
  min_age_months smallint, max_age_months smallint, -- âge de l'enfant
  postpartum boolean not null default false,
  tags text[] not null default '{}',
  author_name text,
  reviewer_name text,          -- jamais inventé : NULL tant qu'aucun professionnel n'a relu
  reviewer_qualification text,
  sources jsonb not null default '[]', -- [{"label":"Assurance Maladie","url":"https://…","consulted_on":"2026-10-01"}]
  validated_at date,
  updated_on date not null default current_date,
  status text not null default 'draft' check (status in ('draft','in_review','published','archived')),
  is_premium boolean not null default false,
  is_safety_critical boolean not null default false, -- toujours gratuit
  created_at timestamptz not null default now(),
  check (not (is_premium and is_safety_critical))
);
create index articles_published_idx on public.articles(status, updated_on desc);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.content_categories(id) on delete set null,
  video_url text,
  duration_s int,
  min_age_months smallint, max_age_months smallint,
  journeys text[] not null default '{}',
  validator_name text,
  validator_qualification text,
  validated_at date,
  contraindications text,
  when_to_consult text,
  sources jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','in_review','published','archived')),
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  -- Une vidéo ne peut être publiée sans validation professionnelle renseignée
  check (status <> 'published' or (validator_name is not null and validated_at is not null))
);

create table public.favorites (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('article','video','recipe','assistant_answer','product')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
select public._apply_owner_policies('favorites');

alter table public.content_categories enable row level security;
alter table public.articles enable row level security;
alter table public.videos enable row level security;
create policy categories_read on public.content_categories for select to anon, authenticated using (true);
create policy categories_edit on public.content_categories for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy articles_read on public.articles for select to anon, authenticated using (status = 'published' or public.has_role('editor'));
create policy articles_edit on public.articles for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy videos_read on public.videos for select to anon, authenticated using (status = 'published' or public.has_role('editor'));
create policy videos_edit on public.videos for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

-- ---------------------------------------------------------------------
-- Ressources d'urgence (configurables par l'admin, toujours gratuites)
-- ---------------------------------------------------------------------
create table public.emergency_resources (
  id uuid primary key default gen_random_uuid(),
  country text not null default 'FR',
  label text not null,
  phone text not null,
  description text not null,
  kind text not null check (kind in ('emergency','suicide_prevention','poison','parenting_support','violence','other')),
  available text,
  position int not null default 0,
  active boolean not null default true
);
alter table public.emergency_resources enable row level security;
create policy emergency_read on public.emergency_resources for select to anon, authenticated using (active or public.has_role('admin'));
create policy emergency_admin on public.emergency_resources for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- ---------------------------------------------------------------------
-- Abonnements : écrits UNIQUEMENT par le serveur (webhook RevenueCat)
-- ---------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entitlement text not null default 'premium',
  status text not null default 'none' check (status in ('none','trial','active','grace','cancelled','expired','billing_issue')),
  product_id text,
  store text check (store in ('app_store','play_store','test','promotional')),
  period_type text check (period_type in ('monthly','annual','trial','lifetime')),
  expires_at timestamptz,
  will_renew boolean,
  last_event text,
  last_event_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy subscriptions_self on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy subscriptions_admin on public.subscriptions for select to authenticated using (public.has_role('admin'));

-- Droits premium : abonnement personnel actif OU propriétaire d'un foyer partagé abonné
create or replace function public.has_premium(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.status in ('trial','active','grace','cancelled')
      and (s.expires_at is null or s.expires_at > now())
      and (
        s.user_id = p_user
        or s.user_id in (
          select owner.user_id from public.household_members me
          join public.household_members owner on owner.household_id = me.household_id and owner.role = 'owner'
          where me.user_id = p_user
        )
      )
  );
$$;

-- Limites de la version gratuite (vérifiées côté serveur)
create table public.plan_limits (
  key text primary key,
  free_value int not null,
  premium_value int not null,
  description text
);
insert into public.plan_limits values
  ('assistant_questions_per_month', 5, 300, 'Questions à l''assistant par mois'),
  ('documents_count', 15, 2000, 'Documents dans le coffre'),
  ('children_count', 3, 12, 'Profils enfants actifs par foyer'),
  ('checklists_count', 4, 100, 'Listes de préparation par foyer'),
  ('product_scans_per_month', 10, 1000, 'Scans détaillés de produits par mois');
alter table public.plan_limits enable row level security;
create policy plan_limits_read on public.plan_limits for select to anon, authenticated using (true);

create or replace function public.plan_limit(p_key text, p_user uuid default auth.uid())
returns int language sql stable security definer set search_path = public as $$
  select case when public.has_premium(p_user) then premium_value else free_value end
  from public.plan_limits where key = p_key;
$$;

-- Application des quotas à l'insertion
create or replace function public.enforce_household_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_key text := tg_argv[0]; v_count int; v_limit int; v_owner uuid;
begin
  select user_id into v_owner from public.household_members where household_id = new.household_id and role = 'owner';
  v_limit := public.plan_limit(v_key, v_owner);
  execute format('select count(*) from public.%I where household_id = $1', tg_table_name) into v_count using new.household_id;
  if v_count >= v_limit then
    raise exception 'Limite de la version gratuite atteinte (%)', v_key using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
create trigger documents_quota before insert on public.documents for each row execute function public.enforce_household_quota('documents_count');
create trigger checklists_quota before insert on public.checklists for each row execute function public.enforce_household_quota('checklists_count');
create trigger children_quota before insert on public.children for each row execute function public.enforce_household_quota('children_count');

-- ---------------------------------------------------------------------
-- Assistant conversationnel
-- ---------------------------------------------------------------------
create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Nouvelle question' check (char_length(title) <= 120),
  context_snapshot jsonb not null default '{}', -- parcours, semaine, âge : jamais de nom ni de document
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assistant_conversations_idx on public.assistant_conversations(user_id, updated_at desc);

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 12000),
  sources jsonb not null default '[]',
  safety_flags text[] not null default '{}',
  feedback smallint check (feedback in (-1, 1)),
  saved boolean not null default false,
  created_at timestamptz not null default now()
);
create index assistant_messages_idx on public.assistant_messages(conversation_id, created_at);

create table public.assistant_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  questions int not null default 0,
  primary key (user_id, month)
);

alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.assistant_usage enable row level security;
create policy conv_owner on public.assistant_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy msg_owner_sel on public.assistant_messages for select to authenticated using (user_id = auth.uid());
create policy msg_owner_del on public.assistant_messages for delete to authenticated using (user_id = auth.uid());
-- Le client ne peut modifier QUE le retour utile/pas utile et l'enregistrement
create policy msg_owner_feedback on public.assistant_messages for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.assistant_messages from authenticated;
grant update (feedback, saved) on public.assistant_messages to authenticated;
create policy usage_owner on public.assistant_usage for select to authenticated using (user_id = auth.uid());
-- Insertion des messages : par la fonction backend « assistant » (service_role)

-- Réserve atomiquement une question dans le quota mensuel (appelée par la fonction backend)
create or replace function public.consume_assistant_quota(p_user uuid)
returns table(allowed boolean, used int, quota int)
language plpgsql security definer set search_path = public as $$
declare v_month date := date_trunc('month', now())::date; v_quota int; v_used int;
begin
  v_quota := public.plan_limit('assistant_questions_per_month', p_user);
  insert into public.assistant_usage(user_id, month, questions) values (p_user, v_month, 0)
  on conflict do nothing;
  update public.assistant_usage set questions = questions + 1
   where user_id = p_user and month = v_month and questions < v_quota
  returning questions into v_used;
  if v_used is null then
    select questions into v_used from public.assistant_usage where user_id = p_user and month = v_month;
    return query select false, v_used, v_quota;
  else
    return query select true, v_used, v_quota;
  end if;
end $$;
revoke execute on function public.consume_assistant_quota(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Produits, rappels officiels, scans
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  barcode text unique,
  name text not null,
  brand text,
  category text not null check (category in ('cream','shampoo','wash_gel','wipes','diapers','laundry','household','sunscreen','food','drink','baby_equipment','other')),
  ingredients text[],
  declared_allergens text[] not null default '{}',
  attributes jsonb not null default '{}', -- ex. {"raw_milk":true,"cheese_type":"soft","fragrance":true}
  data_source text not null,
  data_retrieved_at date not null,
  is_demo boolean not null default false, -- base fictive clairement identifiée
  created_at timestamptz not null default now()
);

create table public.product_recalls (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  barcode text,
  lot_numbers text[] not null default '{}',
  title text not null,
  reason text not null,
  recommended_action text,
  official_url text,
  source text not null,
  published_on date not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_recalls_barcode_idx on public.product_recalls(barcode);

create table public.product_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  barcode text,
  method text not null check (method in ('barcode','photo','import','ingredients_photo','manual')),
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
select public._apply_owner_policies('product_scans');

alter table public.products enable row level security;
alter table public.product_recalls enable row level security;
create policy products_read on public.products for select to authenticated using (true);
create policy products_admin on public.products for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy recalls_read on public.product_recalls for select to anon, authenticated using (true);
create policy recalls_admin on public.product_recalls for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
