-- =====================================================================
-- Brouillons de recettes IA invisibles des parents, prix vérifiés, catalogue de produits, rubrique sources.
-- =====================================================================
\set PAR 'e0e0a000-0000-4000-8000-000000000001'
\set EDI 'e0e0a000-0000-4000-8000-000000000002'
insert into auth.users (id, email) values (:'PAR', 'n-par@exemple.test'), (:'EDI', 'n-edi@exemple.test');
insert into public.profiles (id, display_name) values (:'PAR', 'Parent'), (:'EDI', 'Éditeur') on conflict (id) do nothing;
insert into public.user_roles (user_id, role) values (:'EDI', 'editor');

select tests.ok(tests.count('select * from public.recipes where owner_id is null and status = ''ai_draft''') >= 450, 'brouillons : au moins 450 brouillons importés');
select tests.ok(tests.count('select * from public.recipes r where owner_id is null and not exists (select 1 from public.recipe_steps s where s.recipe_id = r.id)') = 0, 'brouillons : chaque recette a ses étapes');
select tests.ok(tests.count('select * from public.recipes where meals @> array[''dessert'']') > 0, 'recettes : repas « dessert » accepté');

set role authenticated; set request.jwt.claim.sub = :'PAR';
select tests.ok(tests.count('select * from public.recipes where status = ''ai_draft'' and owner_id is null') = 0, 'brouillons : invisibles des parents');
select tests.ok(tests.count('select * from public.recipe_steps s join public.recipes r on r.id = s.recipe_id where r.status = ''ai_draft'' and r.owner_id is null') = 0, 'brouillons : étapes invisibles aussi');
select tests.throws($$insert into public.ingredient_prices (ingredient_key, price_per_kg, source, checked_on) values ('carrot', 1.5, 'manual', current_date)$$, 'prix : saisie réservée à l''équipe');
select tests.throws($$insert into public.kid_products (barcode, category, name, data_source) values ('3000000000001', 'wash', 'Gel lavant', 'manual')$$, 'produits : ajout réservé à l''équipe');
reset role;

set role authenticated; set request.jwt.claim.sub = :'EDI';
select tests.ok(tests.count('select * from public.recipes where status = ''ai_draft'' and owner_id is null') >= 450, 'brouillons : visibles de l''équipe éditoriale');
select tests.throws($$insert into public.ingredient_prices (ingredient_key, price_per_kg, source, checked_on) values ('carrot', 1.5, 'open_prices', current_date)$$, 'prix Open Prices : lien de la source obligatoire');
insert into public.ingredient_prices (ingredient_key, price_per_kg, source, source_url, checked_on) values ('carrot', 1.49, 'open_prices', 'https://prices.openfoodfacts.org/prices/1', current_date);
insert into public.kid_products (barcode, category, name, data_source, status) values ('3000000000002', 'wash', 'Gel lavant test', 'manual', 'draft');
insert into public.product_prices (product_id, price, store_name, store_kind, source, observed_on) select id, 4.9, 'Pharmacie test', 'pharmacy', 'manual', current_date from public.kid_products where barcode = '3000000000002';
select tests.throws($$insert into public.product_prices (product_id, price, store_name, store_kind, source, observed_on) select id, 4.9, 'X', 'pharmacy', 'manual', current_date + 3 from public.kid_products where barcode = '3000000000002'$$, 'prix : jamais daté dans le futur');
reset role;

set role authenticated; set request.jwt.claim.sub = :'PAR';
select tests.ok(tests.count('select * from public.kid_products where barcode = ''3000000000002''') = 0, 'produits : un brouillon n''est pas visible des parents');
select tests.ok(tests.count('select * from public.product_prices') = 0, 'prix : invisibles tant que le produit n''est pas publié');
select tests.ok(tests.count('select * from public.ingredient_prices where ingredient_key = ''carrot''') = 1, 'prix des ingrédients : lisibles par tous');
reset role;
update public.kid_products set status = 'published' where barcode = '3000000000002';
set role authenticated; set request.jwt.claim.sub = :'PAR';
select tests.ok(tests.count('select * from public.product_prices') = 1, 'prix : visibles une fois le produit publié');
reset role;

-- Sources et lectures (migration 0700)
set role authenticated; set request.jwt.claim.sub = :'PAR';
select tests.ok(tests.count('select * from public.external_resources where status = ''published''') >= 20, 'sources : ressources vérifiées lisibles');
select tests.ok(tests.count('select * from public.external_resources where url not like ''https://%''') = 0, 'sources : liens https uniquement');
select tests.throws($$insert into public.external_resources (slug, kind, title, publisher, description, url, consulted_on) values ('x-par', 'institution', 'Titre test', 'Éditeur', 'Résumé', 'https://exemple.fr', current_date)$$, 'sources : ajout réservé à l''équipe');
reset role;
set role authenticated; set request.jwt.claim.sub = :'EDI';
insert into public.external_resources (slug, kind, title, publisher, description, url, consulted_on, status) values ('x-edi', 'institution', 'Titre test', 'Éditeur', 'Résumé', 'https://exemple.fr', current_date, 'draft');
select tests.throws($$insert into public.external_resources (slug, kind, title, publisher, description, url, consulted_on) values ('x-http', 'institution', 'Titre test', 'Éditeur', 'Résumé', 'http://exemple.fr', current_date)$$, 'sources : lien non https refusé');
reset role;
set role authenticated; set request.jwt.claim.sub = :'PAR';
select tests.ok(tests.count('select * from public.external_resources where slug = ''x-edi''') = 0, 'sources : un brouillon n''est pas visible des parents');
reset role;
