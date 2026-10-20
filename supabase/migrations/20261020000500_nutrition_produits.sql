-- =====================================================================
-- Nutrition et recettes enfants, catalogue de produits, prix vérifiés, rubrique sources (20 octobre 2026)
--  · Repas « dessert » ; brouillons générés par IA INVISIBLES des parents tant qu'une personne de l'équipe ne les a pas relus
--  · Prix des ingrédients : uniquement vérifiés et datés (Open Prices ou saisie de l'équipe, avec source) — jamais inventés
--  · Catalogue de produits enfants : produits réels (Open Food Facts / Open Beauty Facts / Open Products Facts, par code-barres)
--  · Prix des produits : relevés datés avec magasin et source (Open Prices ou saisie de l'équipe)
--  · Rubrique « sources » : titre, source, résumé court original, lien, âge — jamais de copie d'article ni de photo
-- =====================================================================

-- Recettes : repas « dessert »
alter table public.recipes drop constraint if exists recipes_meals_check;
alter table public.recipes add constraint recipes_meals_check check (cardinality(meals) > 0 and meals <@ array['breakfast','lunch','dinner','snack','dessert']::text[]);

-- Brouillon IA de la bibliothèque : visible seulement de l'équipe éditoriale
create or replace function public.can_read_recipe(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.recipes r where r.id = p_id and (
    (r.owner_id is null and ((r.status not in ('retired', 'ai_draft')) or public.has_role('editor')))
    or (r.owner_id is not null and (r.owner_id = auth.uid() or public.can_access_household(r.household_id, 'lists', false)))))
$$;
drop policy if exists recipes_read on public.recipes;
create policy recipes_read on public.recipes for select to authenticated using (
  (owner_id is null and (status not in ('retired', 'ai_draft') or public.has_role('editor')))
  or (owner_id is not null and (owner_id = auth.uid() or public.can_access_household(household_id, 'lists', false))));

-- ---------------------------------------------------------------- prix des ingrédients (coût par portion)
create table if not exists public.ingredient_prices (
  id uuid primary key default gen_random_uuid(),
  ingredient_key text not null check (ingredient_key ~ '^[a-z0-9_]{2,40}$'),
  price_per_kg numeric(8,2) check (price_per_kg is null or price_per_kg > 0),
  price_per_unit numeric(8,2) check (price_per_unit is null or price_per_unit > 0),
  source text not null check (source in ('open_prices', 'manual')),
  source_url text check (source_url is null or source_url like 'https://%'),
  store_label text check (char_length(store_label) <= 120),
  checked_on date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (price_per_kg is not null or price_per_unit is not null),
  check (source <> 'open_prices' or source_url is not null)
);
create index if not exists ingredient_prices_key_idx on public.ingredient_prices(ingredient_key, checked_on desc);
alter table public.ingredient_prices enable row level security;
create policy ingredient_prices_read on public.ingredient_prices for select to authenticated using (true);
create policy ingredient_prices_editor on public.ingredient_prices for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

-- ---------------------------------------------------------------- catalogue de produits enfants
create table if not exists public.kid_products (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique check (barcode ~ '^[0-9]{8,14}$'),
  category text not null check (category in ('food', 'wash', 'cream', 'sensitive', 'hair', 'teeth', 'sun', 'accessory')),
  brand text check (char_length(brand) <= 120),
  name text not null check (char_length(name) between 1 and 200),
  image_url text check (image_url is null or image_url like 'https://%'),
  image_credit text,
  composition text,
  quantity_label text check (char_length(quantity_label) <= 60),
  quantity_value numeric(10,2) check (quantity_value is null or quantity_value > 0),
  quantity_unit text check (quantity_unit is null or quantity_unit in ('g', 'ml', 'u')),
  -- Âge indiqué par le fabricant (recopié de l'emballage ou de la fiche), jamais déduit
  maker_min_months smallint check (maker_min_months is null or maker_min_months between 0 and 216),
  maker_age_label text check (char_length(maker_age_label) <= 120),
  benefits text[] not null default '{}',
  precautions text[] not null default '{}',
  data_source text not null check (data_source in ('openfoodfacts', 'openbeautyfacts', 'openproductsfacts', 'manual')),
  source_url text check (source_url is null or source_url like 'https://%'),
  data_retrieved_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  reviewed_by_label text,
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kid_products_category_idx on public.kid_products(category, status);
alter table public.kid_products enable row level security;
create policy kid_products_read on public.kid_products for select to authenticated using (status = 'published' or public.has_role('editor'));
create policy kid_products_editor on public.kid_products for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.kid_products(id) on delete cascade,
  price numeric(8,2) not null check (price > 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  store_name text not null check (char_length(store_name) between 1 and 160),
  store_kind text not null check (store_kind in ('pharmacy', 'supermarket', 'baby_store', 'brand', 'online', 'other')),
  store_city text check (char_length(store_city) <= 120),
  product_url text check (product_url is null or product_url like 'https://%'),
  source text not null check (source in ('open_prices', 'manual')),
  source_url text check (source_url is null or source_url like 'https://%'),
  observed_on date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (source <> 'open_prices' or source_url is not null),
  check (observed_on <= current_date)
);
create index if not exists product_prices_product_idx on public.product_prices(product_id, observed_on desc);
alter table public.product_prices enable row level security;
create policy product_prices_read on public.product_prices for select to authenticated using (exists (select 1 from public.kid_products p where p.id = product_id and (p.status = 'published' or public.has_role('editor'))));
create policy product_prices_editor on public.product_prices for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

-- ---------------------------------------------------------------- rubrique « sources » (articles, institutions, blogs, recettes externes)
create table if not exists public.external_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('institution', 'nutrition_org', 'professional_blog', 'family_recipes', 'science')),
  title text not null check (char_length(title) between 3 and 200),
  publisher text not null,
  description text not null check (char_length(description) <= 400),
  url text not null check (url like 'https://%'),
  min_age_months smallint, max_age_months smallint,
  topics text[] not null default '{}',
  references_note text,
  published_on date,
  consulted_on date not null,
  status text not null default 'published' check (status in ('draft', 'published', 'retired')),
  created_at timestamptz not null default now()
);
alter table public.external_resources enable row level security;
create policy external_resources_read on public.external_resources for select to authenticated using (status = 'published' or public.has_role('editor'));
create policy external_resources_editor on public.external_resources for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
