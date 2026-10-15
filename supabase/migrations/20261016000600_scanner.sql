-- =====================================================================
-- Toi & Moi — 0016-06 Scanner : produits et aliments
--  * Données de référence (lecture : personnes connectées ; écriture : serveur uniquement) :
--      scan_sources, cosing_ingredients (CosIng), ciqual_foods (Ciqual), products, foods, product_recalls
--  * Données personnelles (strictement privées) :
--      product_scans (historique, étendu aux aliments), scan_results, scan_favorites, scan_recall_alerts, scan_usage
--  * Quota mensuel des analyses (plan_limits.product_scans_per_month), consommé côté serveur,
--    non remboursé par la suppression de l'historique. Les rappels officiels restent toujours gratuits.
--  * Rappel officiel publié → notification aux personnes dont l'historique ou les favoris contiennent le produit.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Sources citées par les règles (même liste que src/lib/domain/scanSources.ts)
-- ---------------------------------------------------------------------
create table public.scan_sources (
  id text primary key,
  label text not null,
  publisher text not null,
  url text not null check (url like 'https://%'),
  published_on date,
  consulted_on date not null,
  review text not null default 'verified' check (review in ('verified','to_review')),
  created_at timestamptz not null default now()
);
alter table public.scan_sources enable row level security;
create policy scan_sources_read on public.scan_sources for select to authenticated using (true);

insert into public.scan_sources (id, label, publisher, url, published_on, consulted_on, review) values
 ('eu-1223-2009','Règlement (CE) n° 1223/2009 relatif aux produits cosmétiques','Union européenne (EUR-Lex)','https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32009R1223','2009-11-30','2026-10-16','verified'),
 ('eu-2023-1545','Règlement (UE) 2023/1545 : étiquetage des substances parfumantes allergisantes','Commission européenne (EUR-Lex)','https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1545','2023-07-26','2026-10-16','verified'),
 ('eu-clp-1272-2008','Règlement (CE) n° 1272/2008 (CLP) : classification, étiquetage et emballage des mélanges','Union européenne (EUR-Lex)','https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32008R1272','2008-12-16','2026-10-16','verified'),
 ('eu-inco-1169-2011','Règlement (UE) n° 1169/2011 (INCO) : information des consommateurs sur les denrées alimentaires, dont les allergènes','Union européenne (EUR-Lex)','https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169','2011-10-25','2026-10-16','verified'),
 ('ansm-phenoxy-2019','Décision du 13/03/2019 : produits cosmétiques non rincés contenant du phénoxyéthanol, à ne pas utiliser sur le siège des enfants de 3 ans ou moins','ANSM','https://ansm.sante.fr/actualites/decision-du-13-03-2019-fixant-des-conditions-particulieres-dutilisation-des-produits-cosmetiques-non-rinces-contenant-du-phenoxyethanol-en-precisant-sur-leur-etiquetage-quils-ne-peuvent-pas-etre-utilises-sur-le-siege-des-enfants-de-3-ans-ou-moins','2019-03-13','2026-10-16','verified'),
 ('anses-he-2024','Huiles essentielles : risques et précautions','Anses','https://www.anses.fr/fr/content/huiles-essentielles-risques-et-precautions','2024-12-17','2026-10-16','verified'),
 ('anses-diffuseurs','Sprays et diffuseurs à base d’huiles essentielles : l’Anses appelle à la vigilance','Anses','https://www.anses.fr/fr/content/sprays-et-diffuseurs-base-dhuiles-essentielles-lanses-appelle-la-vigilance',null,'2026-10-16','to_review'),
 ('anses-lait-cru-2022','Fromages au lait cru : quels risques pour la santé et comment mieux les prévenir ?','Anses','https://www.anses.fr/fr/content/fromages-au-lait-cru-quels-risques-pour-la-sante-et-comment-mieux-les-prevenir','2022-04-08','2026-10-16','verified'),
 ('anses-mercure-2024','Méthylmercure : un risque pour la santé en cas de consommation importante de poissons','Anses','https://www.anses.fr/fr/content/methylmercure-un-risque-pour-la-sante-en-cas-de-consommation-importante-de-poissons','2024-10-24','2026-10-16','verified'),
 ('anses-reglisse-2025','Évaluation des risques relatifs à la consommation alimentaire de réglisse (saisine 2022-AUTO-0077)','Anses','https://www.anses.fr/fr/system/files/AP2022-AUTO-0077RA.pdf','2025-05-09','2026-10-16','verified'),
 ('anses-miel-2010','Avis relatif à l’étiquetage du miel : ne pas en donner aux nourrissons de moins d’un an (botulisme infantile)','Anses','https://www.anses.fr/fr/system/files/MIC2010sa0130.pdf','2010-07-13','2026-10-16','verified'),
 ('spf-grossesse-2025','Quels aliments éviter et quelles précautions prendre quand on est enceinte ?','Santé publique France – Manger Bouger (Santé.fr)','https://www.sante.fr/node/7070507','2025-10-15','2026-10-16','verified'),
 ('mpedia-listeriose-2025','Listériose pendant la grossesse, quels aliments éviter ?','mpedia (AFPA) sur Santé.fr','https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter','2025-04-25','2026-10-16','verified'),
 ('sante-alcool','L’alcool pendant la grossesse et l’allaitement','Santé.fr','https://www.sante.fr/node/1871139',null,'2026-10-16','verified'),
 ('spf-pas-a-pas','Pas à pas, votre enfant mange comme un grand (diversification jusqu’à 3 ans)','Santé publique France','https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/documents/brochure/pas-a-pas-votre-enfant-mange-comme-un-grand',null,'2026-10-16','to_review'),
 ('lecrat','Médicaments, vaccins, grossesse et allaitement','CRAT – Centre de référence sur les agents tératogènes (AP-HP)','https://www.lecrat.fr',null,'2026-10-16','to_review'),
 ('rappelconso','RappelConso, site officiel des rappels de produits','Gouvernement (DGCCRF, DGAL, DGS)','https://rappel.conso.gouv.fr',null,'2026-10-16','verified'),
 ('cosing','Base CosIng des ingrédients cosmétiques','Commission européenne','https://ec.europa.eu/growth/tools-databases/cosing/',null,'2026-10-16','verified'),
 ('ciqual','Table de composition nutritionnelle Ciqual','Anses','https://ciqual.anses.fr/',null,'2026-10-16','verified');

-- ---------------------------------------------------------------------
-- CosIng (ingrédients cosmétiques, Commission européenne) — importé par scripts/import-cosing.mjs
-- ---------------------------------------------------------------------
create table public.cosing_ingredients (
  id uuid primary key default gen_random_uuid(),
  inci_name text not null unique,
  cas text,
  ec text,
  functions text[] not null default '{}',
  restrictions text,
  annex_refs text[] not null default '{}',
  source_url text not null default 'https://ec.europa.eu/growth/tools-databases/cosing/',
  updated_on date not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index cosing_inci_lower_idx on public.cosing_ingredients (lower(inci_name));

-- Recherche insensible à la casse d'une liste d'ingrédients (RLS appliquée : personnes connectées)
create or replace function public.cosing_lookup(p_names text[])
returns setof public.cosing_ingredients language sql stable set search_path = public as $$
  select * from public.cosing_ingredients
  where lower(inci_name) = any (select lower(trim(n)) from unnest(p_names[1:200]) n)
  order by is_demo, inci_name;
$$;
revoke execute on function public.cosing_lookup(text[]) from public, anon;
grant execute on function public.cosing_lookup(text[]) to authenticated;
alter table public.cosing_ingredients enable row level security;
create policy cosing_read on public.cosing_ingredients for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- Ciqual (composition nutritionnelle, Anses) — importé par scripts/import-ciqual.mjs
-- ---------------------------------------------------------------------
create table public.ciqual_foods (
  code text primary key,
  nom text not null,
  groupe text,
  sous_groupe text,
  -- valeurs pour 100 g : {"energie_kcal":…, "proteines_g":…, "glucides_g":…, "sucres_g":…, "lipides_g":…, "sel_g":…}
  nutrients jsonb not null default '{}',
  source_version text not null,
  source_date date not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index ciqual_nom_idx on public.ciqual_foods (lower(nom));
alter table public.ciqual_foods enable row level security;
create policy ciqual_read on public.ciqual_foods for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- Produits (référence) : informations utiles à l'analyse ; écriture réservée au serveur
-- ---------------------------------------------------------------------
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check check (category in (
  'cream','oil','shampoo','wash_gel','wipes','diapers','laundry','household','sunscreen','makeup','stretch_marks','perfume','baby_care',
  'medicine','essential_oil','supplement','treatment','food','drink','baby_equipment','other'));
alter table public.products
  add column image_url text check (image_url is null or image_url like 'https://%'),
  add column ingredients_text text check (char_length(ingredients_text) <= 8000),
  add column precautions_text text check (char_length(precautions_text) <= 2000),
  add column period_after_opening text,
  add column product_type text,
  add column nutrition jsonb,
  add column source_url text;
drop policy if exists products_admin on public.products;
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated using (true);

-- Aliments (référence) : alias et lien Ciqual
alter table public.foods
  add column aliases text[] not null default '{}',
  add column ciqual_code text references public.ciqual_foods(code) on delete set null,
  add column is_demo boolean not null default false;
drop policy if exists foods_admin on public.foods;

-- Rappels officiels : cache des fiches RappelConso (clé unique), écriture serveur uniquement
alter table public.product_recalls
  add column source_key text unique,
  add column gtins text[] not null default '{}',
  add column brand text,
  add column product_name text,
  add column risks text,
  add column image_url text,
  add column fetched_at timestamptz not null default now();
create index product_recalls_gtins_idx on public.product_recalls using gin (gtins);
drop policy if exists recalls_admin on public.product_recalls;

-- ---------------------------------------------------------------------
-- Historique des scans (privé) : produits ET aliments
-- ---------------------------------------------------------------------
alter table public.product_scans drop constraint if exists product_scans_method_check;
alter table public.product_scans add constraint product_scans_method_check check (method in ('barcode','photo','photo_barcode','import','ingredients_photo','manual','search'));
alter table public.product_scans
  add column kind text not null default 'product' check (kind in ('product','food')),
  add column food_id uuid references public.foods(id) on delete set null,
  add column product_snapshot jsonb not null default '{}',   -- {name, brand, image_url, type, data_source, retrieved_on}
  add column target_profile text check (target_profile in ('pregnant','breastfeeding','newborn','baby','child','adult')),
  add column target_age_months smallint check (target_age_months between 0 and 240),
  add column answers jsonb not null default '{}',
  add column verdict text check (verdict in (
    'Adapté selon les informations disponibles','Adapté avec précautions','Déconseillé pour ce profil selon la source indiquée','Informations insuffisantes',
    'Adapté sous certaines conditions','À préparer différemment','À éviter pour ce profil selon la source indiquée','Impossible à confirmer')),
  add column certainty text check (certainty in ('high','medium','low')),
  add column sources jsonb not null default '[]',
  add column is_demo boolean not null default false,
  add column analysed_at timestamptz;
alter table public.product_scans add constraint product_scans_verdict_kind check (
  verdict is null
  or (kind = 'product' and verdict in ('Adapté selon les informations disponibles','Adapté avec précautions','Déconseillé pour ce profil selon la source indiquée','Informations insuffisantes'))
  or (kind = 'food' and verdict in ('Adapté selon les informations disponibles','Adapté sous certaines conditions','À préparer différemment','À éviter pour ce profil selon la source indiquée','Impossible à confirmer')));
alter table public.product_scans add constraint product_scans_analysed check ((verdict is null) = (analysed_at is null));
create index product_scans_user_idx on public.product_scans(user_id, created_at desc);
create index product_scans_barcode_idx on public.product_scans(barcode) where barcode is not null;
-- La politique propriétaire existante (product_scans_owner) reste : un scan est privé à la personne.
-- Pas de modification d'un scan analysé (verdict, certitude, sources) par le client :
revoke update on public.product_scans from authenticated;
revoke all on public.product_scans from anon;

-- Résultat détaillé (constats, sources, explication IA éventuelle)
create table public.scan_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null unique references public.product_scans(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  engine_version text not null,
  result jsonb not null,
  explanation jsonb,
  created_at timestamptz not null default now()
);
alter table public.scan_results enable row level security;
create policy scan_results_owner on public.scan_results for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.product_scans s where s.id = scan_id and s.user_id = auth.uid()));
revoke update on public.scan_results from authenticated;
grant update (explanation) on public.scan_results to authenticated;
revoke all on public.scan_results from anon;

-- Favoris
create table public.scan_favorites (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scan_id uuid not null references public.product_scans(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, scan_id)
);
alter table public.scan_favorites enable row level security;
create policy scan_favorites_owner on public.scan_favorites for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.product_scans s where s.id = scan_id and s.user_id = auth.uid()));
revoke all on public.scan_favorites from anon;

-- ---------------------------------------------------------------------
-- Quota mensuel des analyses : compteur non décrémenté par la suppression de l'historique
-- ---------------------------------------------------------------------
create table public.scan_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  analyses int not null default 0,
  primary key (user_id, month)
);
alter table public.scan_usage enable row level security;
create policy scan_usage_self on public.scan_usage for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.scan_usage from authenticated, anon;

create or replace function public.consume_scan_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_month date := date_trunc('month', now())::date; v_quota int; v_used int;
begin
  if new.analysed_at is null then return new; end if;
  v_quota := coalesce(public.plan_limit('product_scans_per_month', new.user_id), 10);
  insert into public.scan_usage(user_id, month, analyses) values (new.user_id, v_month, 0) on conflict do nothing;
  update public.scan_usage set analyses = analyses + 1
   where user_id = new.user_id and month = v_month and analyses < v_quota
  returning analyses into v_used;
  if v_used is null then
    raise exception 'Limite de la version gratuite atteinte (product_scans_per_month)' using errcode = 'P0001', hint = 'premium_required';
  end if;
  return new;
end $$;
create trigger product_scans_quota before insert on public.product_scans for each row execute function public.consume_scan_quota();

create or replace function public.scan_quota_status()
returns table(used int, quota int, remaining int)
language sql stable security definer set search_path = public as $$
  select coalesce(u.analyses, 0), q.quota, greatest(q.quota - coalesce(u.analyses, 0), 0)
  from (select coalesce(public.plan_limit('product_scans_per_month', auth.uid()), 10) as quota) q
  left join public.scan_usage u on u.user_id = auth.uid() and u.month = date_trunc('month', now())::date
  where auth.uid() is not null;
$$;
revoke execute on function public.scan_quota_status() from public, anon;
grant execute on function public.scan_quota_status() to authenticated;
revoke execute on function public.consume_scan_quota() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Alertes de rappel : une seule notification par personne et par rappel
-- ---------------------------------------------------------------------
create table public.scan_recall_alerts (
  user_id uuid not null references auth.users(id) on delete cascade,
  recall_id uuid not null references public.product_recalls(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recall_id)
);
alter table public.scan_recall_alerts enable row level security;
create policy scan_recall_alerts_self on public.scan_recall_alerts for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.scan_recall_alerts from authenticated, anon;

-- Notifie les personnes concernées par un rappel (historique ou favoris), sans doublon
create or replace function public._notify_recall(p_recall uuid, p_user uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare r public.product_recalls; v_count int;
begin
  select * into r from public.product_recalls where id = p_recall;
  if not found then return 0; end if;
  with targets as (
    select distinct s.user_id, (array_agg(s.id order by s.created_at desc))[1] as scan_id
    from public.product_scans s
    where (p_user is null or s.user_id = p_user)
      and ((r.product_id is not null and s.product_id = r.product_id)
        or (s.barcode is not null and (s.barcode = r.barcode or s.barcode = any(r.gtins))))
    group by s.user_id
  ), ins as (
    insert into public.scan_recall_alerts(user_id, recall_id)
    select user_id, r.id from targets
    on conflict do nothing
    returning user_id
  )
  insert into public.notifications(user_id, category, title, body, deep_link, payload)
  select t.user_id, 'product_recall',
         case when r.is_demo then 'Rappel (démonstration) : ' else 'Rappel officiel : ' end || r.title,
         left(r.reason, 240),
         '/scanner/result/' || t.scan_id,
         jsonb_build_object('recall_id', r.id, 'scan_id', t.scan_id, 'is_demo', r.is_demo)
  from targets t join ins on ins.user_id = t.user_id;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke execute on function public._notify_recall(uuid, uuid) from public, anon, authenticated;

create or replace function public.on_product_recall()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public._notify_recall(new.id);
  return new;
end $$;

-- Un produit rappelé ajouté à l'historique déclenche aussi l'alerte (une seule fois)
create or replace function public.on_scan_recall_check()
returns trigger language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if new.barcode is null and new.product_id is null then return new; end if;
  for rid in select id from public.product_recalls
             where (new.barcode is not null and (barcode = new.barcode or new.barcode = any(gtins)))
                or (new.product_id is not null and product_id = new.product_id)
  loop
    perform public._notify_recall(rid, new.user_id);
  end loop;
  return new;
end $$;
create trigger product_scans_recall_check after insert on public.product_scans for each row execute function public.on_scan_recall_check();

-- Vérification à la demande (après une mise à jour du cache par la fonction product-lookup)
create or replace function public.notify_my_recalls()
returns int language plpgsql security definer set search_path = public as $$
declare rid uuid; v_total int := 0;
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  for rid in select distinct r.id from public.product_recalls r
             join public.product_scans s on s.user_id = auth.uid()
              and ((s.barcode is not null and (s.barcode = r.barcode or s.barcode = any(r.gtins))) or (r.product_id is not null and s.product_id = r.product_id))
  loop
    v_total := v_total + public._notify_recall(rid, auth.uid());
  end loop;
  return v_total;
end $$;
revoke execute on function public.notify_my_recalls() from public, anon;
grant execute on function public.notify_my_recalls() to authenticated;

-- ---------------------------------------------------------------------
-- Export RGPD : historique du scanner (données de la seule personne qui exporte)
-- ---------------------------------------------------------------------
alter function public.export_my_data() rename to _export_my_data_v3;
revoke execute on function public._export_my_data_v3() from public, anon, authenticated;

create or replace function public.export_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v jsonb;
begin
  if v_uid is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  v := public._export_my_data_v3();
  v := jsonb_set(v, '{personal}', (v -> 'personal') || jsonb_build_object(
    'product_scans', (select coalesce(jsonb_agg(t order by created_at), '[]') from public.product_scans t where user_id = v_uid),
    'scan_results', (select coalesce(jsonb_agg(t order by created_at), '[]') from public.scan_results t where user_id = v_uid),
    'scan_favorites', (select coalesce(jsonb_agg(t order by created_at), '[]') from public.scan_favorites t where user_id = v_uid)
  ));
  return v;
end $$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
