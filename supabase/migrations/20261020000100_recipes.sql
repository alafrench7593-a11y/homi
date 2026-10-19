-- =====================================================================
-- Repas et recettes : bibliothèque (recettes, ingrédients, étapes, allergènes, étapes d'âge, textures, publics,
-- photographies et licences, sources, validations), menus, favoris, listes de courses partagées, réglages
-- alimentaires de l'enfant, recettes personnelles.
--  - Statuts : ai_draft (brouillon généré par IA), to_review (à vérifier), reviewed (relu), validated (validé pour
--    publication), retired (retiré). Une recette rédigée par une IA n'est jamais marquée relue ou validée sans qu'un
--    rôle « editor » ne l'enregistre explicitement (journal recipe_reviews).
--  - Les recettes de la bibliothèque sont lisibles par tous les comptes ; seules les rôles editor/admin les modifient.
--  - Recettes personnelles : visibles par leur auteur et son foyer (droit « lists »), jamais publiées.
-- =====================================================================

-- Référentiels (codes contrôlés)
create table if not exists public.ref_allergens (code text primary key, label text not null);
insert into public.ref_allergens (code, label) values
  ('gluten','Céréales contenant du gluten'),('crustaceans','Crustacés'),('eggs','Œufs'),('fish','Poissons'),('peanuts','Arachides'),
  ('soy','Soja'),('milk','Lait'),('nuts','Fruits à coque'),('celery','Céleri'),('mustard','Moutarde'),('sesame','Graines de sésame'),
  ('sulphites','Anhydride sulfureux et sulfites'),('lupin','Lupin'),('molluscs','Mollusques')
on conflict (code) do nothing;
create table if not exists public.ref_textures (code text primary key, label text not null, rank smallint not null);
insert into public.ref_textures (code, label, rank) values
  ('smooth','Purée lisse',0),('mashed','Écrasée',1),('ground','Moulinée',2),('pieces','Morceaux adaptés',3),('regular','Comme la famille',4)
on conflict (code) do nothing;
create table if not exists public.ref_age_stages (code text primary key, label text not null, from_months smallint not null, to_months smallint not null);
insert into public.ref_age_stages (code, label, from_months, to_months) values
  ('start','Début de la diversification',4,6),('m6_8','Environ 6 à 8 mois',6,9),('m9_12','Environ 9 à 12 mois',9,12),
  ('m12_18','12 à 18 mois',12,18),('m18_24','18 à 24 mois',18,24),('y2_3','2 à 3 ans',24,36)
on conflict (code) do nothing;
create table if not exists public.ref_audiences (code text primary key, label text not null);
insert into public.ref_audiences (code, label) values ('pregnancy','Grossesse'),('baby','Bébé'),('child','Enfant'),('family','Famille')
on conflict (code) do nothing;
create table if not exists public.recipe_sources (
  id text primary key, title text not null, publisher text not null, url text not null check (url ~ '^https://'),
  consulted_on date not null, published_on date
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  summary text not null default '' check (char_length(summary) <= 300),
  audiences text[] not null check (cardinality(audiences) > 0 and audiences <@ array['pregnancy','baby','child','family']::text[]),
  meals text[] not null check (cardinality(meals) > 0 and meals <@ array['breakfast','lunch','dinner','snack']::text[]),
  stages text[] not null default '{}' check (stages <@ array['start','m6_8','m9_12','m12_18','m18_24','y2_3']::text[]),
  min_months smallint check (min_months between 0 and 216),
  max_months smallint check (max_months between 0 and 216),
  textures text[] not null default '{regular}' check (textures <@ array['smooth','mashed','ground','pieces','regular']::text[]),
  servings smallint not null check (servings between 1 and 30),
  serving_label text,
  prep_min smallint not null check (prep_min between 0 and 600),
  cook_min smallint not null check (cook_min between 0 and 600),
  allergens text[] not null default '{}' check (allergens <@ array['gluten','crustaceans','eggs','fish','peanuts','soy','milk','nuts','celery','mustard','sesame','sulphites','lupin','molluscs']::text[]),
  tags text[] not null default '{}',
  adaptations text[] not null default '{}',
  storage text not null default '',
  precautions text[] not null default '{}',
  nutrition text not null default '',
  budget smallint not null default 2 check (budget between 1 and 3),
  seasons text[] not null default '{}' check (seasons <@ array['spring','summer','autumn','winter']::text[]),
  temperature text not null default 'hot' check (temperature in ('hot','cold')),
  family_adaptations jsonb not null default '{}',
  verified_on date,
  status text not null default 'ai_draft' check (status in ('ai_draft','to_review','reviewed','validated','retired')),
  -- recette personnelle (jamais publiée) : auteur et foyer
  owner_id uuid references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_months is null or max_months is null or max_months >= min_months),
  check ((owner_id is null) = (household_id is null))
);
create index if not exists recipes_status_idx on public.recipes(status) where owner_id is null;
create trigger recipes_touch before update on public.recipes for each row execute function public.touch_updated_at();

create table if not exists public.recipe_ingredients (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position smallint not null,
  ingredient_key text not null check (ingredient_key ~ '^[a-z_]{2,40}$'),
  label text not null,
  qty numeric(8,2) check (qty is null or qty > 0),
  unit text check (unit in ('g','ml','u','cs','cc','pincee')),
  note text,
  optional boolean not null default false,
  primary key (recipe_id, position)
);
create table if not exists public.recipe_steps (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position smallint not null,
  body text not null check (char_length(btrim(body)) between 3 and 1000),
  primary key (recipe_id, position)
);
create table if not exists public.recipe_photos (
  recipe_id uuid primary key references public.recipes(id) on delete cascade,
  kind text not null check (kind in ('generated','licensed','owned')),
  source text not null, author text not null, license text not null, url text, rights text not null,
  generated boolean not null, alt text not null, storage_path text,
  -- une photo sous licence doit garder son URL d'origine
  check (kind <> 'licensed' or url is not null)
);
create table if not exists public.recipe_source_links (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  source_id text not null references public.recipe_sources(id) on delete restrict,
  primary key (recipe_id, source_id)
);
-- Journal des validations (qui a relu, quand, avec quelle remarque)
create table if not exists public.recipe_reviews (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  status text not null check (status in ('ai_draft','to_review','reviewed','validated','retired')),
  by_user uuid references auth.users(id) on delete set null,
  by_label text not null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

-- Favoris (personnels), menus et listes de courses (foyer, droit « lists » : partagés avec le coparent)
create table if not exists public.recipe_favorites (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipe_slug text not null references public.recipes(slug) on delete cascade on update cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_slug)
);
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  profile jsonb not null default '{}',
  start_date date not null default current_date,
  days smallint not null check (days between 1 and 14),
  servings smallint not null default 2 check (servings between 1 and 20),
  created_at timestamptz not null default now()
);
create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  day smallint not null check (day between 0 and 13),
  meal text not null check (meal in ('breakfast','lunch','dinner','snack')),
  recipe_slug text not null references public.recipes(slug) on delete cascade on update cascade,
  servings smallint not null check (servings between 1 and 20),
  note text check (char_length(note) <= 600),
  unique (plan_id, day, meal)
);
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plan_id uuid references public.meal_plans(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  ingredient_key text,
  label text not null check (char_length(btrim(label)) between 1 and 120),
  qty numeric(10,2), unit text check (unit in ('g','ml','u','cs','cc','pincee')),
  aisle text not null default 'epicerie',
  at_home boolean not null default false,
  checked boolean not null default false,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz,
  position int not null default 0
);
create index if not exists shopping_items_list_idx on public.shopping_items(list_id, position);

-- Réglages alimentaires de l'enfant (texture, végétarien, refus, conseils du professionnel). Aliments déjà introduits :
-- table existante food_introductions ; allergies déclarées : children.allergies_declared.
create table if not exists public.child_food_settings (
  child_id uuid primary key references public.children(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  texture text check (texture in ('smooth','mashed','ground','pieces','regular')),
  vegetarian boolean not null default false,
  no_pork boolean not null default false,
  refused text[] not null default '{}',
  pro_advice text check (char_length(pro_advice) <= 2000),
  allergen_advice_needed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- droits
alter table public.ref_allergens enable row level security;
alter table public.ref_textures enable row level security;
alter table public.ref_age_stages enable row level security;
alter table public.ref_audiences enable row level security;
alter table public.recipe_sources enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_photos enable row level security;
alter table public.recipe_source_links enable row level security;
alter table public.recipe_reviews enable row level security;
alter table public.recipe_favorites enable row level security;

do $$ declare t text; begin
  foreach t in array array['ref_allergens','ref_textures','ref_age_stages','ref_audiences','recipe_sources'] loop
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    execute format('create policy %I_edit on public.%I for all to authenticated using (public.has_role(''editor'')) with check (public.has_role(''editor''))', t, t);
  end loop;
end $$;

-- Recette visible : bibliothèque non retirée (ou éditeur), ou recette personnelle de mon foyer
create or replace function public.can_read_recipe(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.recipes r where r.id = p_id and (
    (r.owner_id is null and (r.status <> 'retired' or public.has_role('editor')))
    or (r.owner_id is not null and (r.owner_id = auth.uid() or public.can_access_household(r.household_id, 'lists', false)))))
$$;
create or replace function public.can_write_recipe(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.recipes r where r.id = p_id and (
    (r.owner_id is null and public.has_role('editor'))
    or (r.owner_id is not null and (r.owner_id = auth.uid() or public.can_access_household(r.household_id, 'lists', true)))))
$$;
revoke execute on function public.can_read_recipe(uuid), public.can_write_recipe(uuid) from public, anon;
grant execute on function public.can_read_recipe(uuid), public.can_write_recipe(uuid) to authenticated;

create policy recipes_read on public.recipes for select to authenticated using (
  (owner_id is null and (status <> 'retired' or public.has_role('editor')))
  or (owner_id is not null and (owner_id = auth.uid() or public.can_access_household(household_id, 'lists', false))));
-- Bibliothèque : éditeurs seulement. Recette personnelle : son auteur, statut « brouillon » obligatoire (jamais « validée »)
create policy recipes_editor on public.recipes for all to authenticated using (owner_id is null and public.has_role('editor')) with check (owner_id is null and public.has_role('editor'));
create policy recipes_personal_insert on public.recipes for insert to authenticated
  with check (owner_id = auth.uid() and public.can_access_household(household_id, 'lists', true) and status = 'ai_draft' and verified_on is null);
create policy recipes_personal_update on public.recipes for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and status = 'ai_draft');
create policy recipes_personal_delete on public.recipes for delete to authenticated using (owner_id = auth.uid());

do $$ declare t text; begin
  foreach t in array array['recipe_ingredients','recipe_steps','recipe_photos','recipe_source_links'] loop
    execute format('create policy %I_read on public.%I for select to authenticated using (public.can_read_recipe(recipe_id))', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.can_write_recipe(recipe_id)) with check (public.can_write_recipe(recipe_id))', t, t);
  end loop;
end $$;

create policy recipe_reviews_read on public.recipe_reviews for select to authenticated using (public.can_read_recipe(recipe_id));
create policy recipe_reviews_editor on public.recipe_reviews for insert to authenticated with check (public.has_role('editor') and by_user = auth.uid());

-- Changement de statut d'une recette de la bibliothèque : réservé aux éditeurs et journalisé
create or replace function public.set_recipe_status(p_slug text, p_status text, p_note text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if not public.has_role('editor') then raise exception 'Réservé à l’équipe éditoriale' using errcode = '42501'; end if;
  update public.recipes set status = p_status, verified_on = case when p_status in ('reviewed','validated') then current_date else verified_on end
    where slug = p_slug and owner_id is null returning id into v_id;
  if v_id is null then raise exception 'Recette introuvable' using errcode = 'P0002'; end if;
  insert into public.recipe_reviews (recipe_id, status, by_user, by_label, note) values (v_id, p_status, auth.uid(), 'Équipe éditoriale', p_note);
end $$;
revoke execute on function public.set_recipe_status(text, text, text) from public, anon;
grant execute on function public.set_recipe_status(text, text, text) to authenticated;

create policy recipe_favorites_own on public.recipe_favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
select public._apply_household_policies('meal_plans', 'lists');
select public._apply_household_policies('meal_plan_items', 'lists');
select public._apply_household_policies('shopping_lists', 'lists');
select public._apply_household_policies('shopping_items', 'lists');
select public._apply_household_policies('child_food_settings', 'daily');
revoke all on public.recipes, public.recipe_ingredients, public.recipe_steps, public.recipe_photos, public.recipe_source_links, public.recipe_reviews,
  public.recipe_favorites, public.meal_plans, public.meal_plan_items, public.shopping_lists, public.shopping_items, public.child_food_settings,
  public.ref_allergens, public.ref_textures, public.ref_age_stages, public.ref_audiences, public.recipe_sources from anon;

-- Export RGPD : favoris, menus, listes, recettes personnelles, réglages alimentaires
alter function public.export_my_data() rename to _export_my_data_v9;
create or replace function public.export_my_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  v := public._export_my_data_v9();
  return v || jsonb_build_object(
    'recipe_favorites', (select coalesce(jsonb_agg(t), '[]') from public.recipe_favorites t where user_id = v_uid),
    'personal_recipes', (select coalesce(jsonb_agg(t), '[]') from public.recipes t where owner_id = v_uid),
    'meal_plans', (select coalesce(jsonb_agg(t), '[]') from public.meal_plans t where created_by = v_uid),
    'shopping_lists', (select coalesce(jsonb_agg(t), '[]') from public.shopping_lists t where created_by = v_uid)
  );
end $$;
revoke execute on function public._export_my_data_v9() from public, anon, authenticated;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
