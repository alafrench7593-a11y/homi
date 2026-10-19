-- =====================================================================
-- Recettes : bibliothèque complète et honnête (statut « à vérifier »), droits éditoriaux, recettes personnelles,
-- menus et listes de courses partagés avec le coparent, isolation.
-- =====================================================================
\set ANA 'c0c0a000-0000-4000-8000-000000000001'
\set BEN 'c0c0a000-0000-4000-8000-000000000002'
\set OUT 'c0c0a000-0000-4000-8000-000000000003'
\set EDI 'c0c0a000-0000-4000-8000-000000000004'
\set HH  'c0c0a000-0000-4000-8000-0000000000f1'
\set KID 'c0c0a000-0000-4000-8000-0000000000c1'
insert into auth.users (id, email) values (:'ANA', 'r-ana@exemple.test'), (:'BEN', 'r-ben@exemple.test'), (:'OUT', 'r-out@exemple.test'), (:'EDI', 'r-edi@exemple.test');
insert into public.profiles (id, display_name) values (:'ANA', 'Ana'), (:'BEN', 'Ben'), (:'OUT', 'Autre'), (:'EDI', 'Éditrice') on conflict (id) do nothing;
insert into public.households (id, name, created_by) values (:'HH', 'Foyer Ana', :'ANA');
insert into public.household_members (household_id, user_id, role) select :'HH', :'ANA', 'owner' where not exists (select 1 from public.household_members where household_id = :'HH' and user_id = :'ANA');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'HH', :'BEN', 'coparent', array['daily','lists'], array['daily','lists']) on conflict do nothing;
insert into public.children (id, household_id, first_name, birth_date) values (:'KID', :'HH', 'Lou', current_date - 200);
insert into public.user_roles (user_id, role) values (:'EDI', 'editor');

set role authenticated; set request.jwt.claim.sub = :'ANA';
select tests.ok(tests.count('select * from public.recipes where owner_id is null') = 64, 'recettes : 64 recettes de bibliothèque');
select tests.ok(tests.count('select * from public.recipes where owner_id is null and status in (''reviewed'', ''validated'')') = 0, 'recettes : aucune présentée comme relue ou validée');
select tests.ok(tests.count('select * from public.recipes r where owner_id is null and (not exists (select 1 from public.recipe_ingredients i where i.recipe_id = r.id) or (select count(*) from public.recipe_steps s where s.recipe_id = r.id) < 2 or not exists (select 1 from public.recipe_source_links l where l.recipe_id = r.id))') = 0,
  'recettes : chacune a ingrédients, étapes et sources');
select tests.ok(tests.count('select * from public.recipe_photos where generated and license <> '''' and rights <> '''' and author <> ''''') = 64, 'photos : licence, droits et auteur enregistrés, mention « générée »');
select tests.ok(tests.count('select * from public.recipe_reviews where status = ''ai_draft''') = 64, 'validations : l''origine IA est journalisée');
update public.recipes set status = 'validated' where slug = 'puree-lisse-carotte';
select tests.ok((select status from public.recipes where slug = 'puree-lisse-carotte') = 'to_review', 'recettes : statut inchangé sans rôle éditorial');
select tests.throws($$select public.set_recipe_status('puree-lisse-carotte', 'validated', 'x')$$, 'recettes : changement de statut réservé à l''équipe éditoriale');

-- Recette personnelle : brouillon, visible par le foyer, jamais « validée »
insert into public.recipes (slug, title, audiences, meals, servings, prep_min, cook_min, owner_id, household_id, status)
  values ('ma-soupe-ana', 'Ma soupe de légumes', array['family'], array['dinner'], 4, 10, 20, :'ANA', :'HH', 'ai_draft');
select tests.throws(format($$insert into public.recipes (slug, title, audiences, meals, servings, prep_min, cook_min, owner_id, household_id, status) values ('triche', 'Recette validée', array['family'], array['dinner'], 2, 5, 5, %L, %L, 'validated')$$, :'ANA', :'HH'),
  'recettes personnelles : impossible de se donner le statut « validée »');
-- Menu et liste de courses
insert into public.meal_plans (id, household_id, title, days, servings) values ('c0c0a000-0000-4000-8000-0000000000a1', :'HH', 'Semaine', 7, 3);
insert into public.meal_plan_items (plan_id, household_id, day, meal, recipe_slug, servings) values ('c0c0a000-0000-4000-8000-0000000000a1', :'HH', 0, 'dinner', 'veloute-potiron', 3);
insert into public.shopping_lists (id, household_id, plan_id, title) values ('c0c0a000-0000-4000-8000-0000000000b1', :'HH', 'c0c0a000-0000-4000-8000-0000000000a1', 'Courses');
insert into public.shopping_items (list_id, household_id, ingredient_key, label, qty, unit, aisle) values ('c0c0a000-0000-4000-8000-0000000000b1', :'HH', 'pumpkin', 'potiron', 600, 'g', 'fruits_legumes');
insert into public.recipe_favorites (recipe_slug) values ('veloute-potiron');
insert into public.child_food_settings (child_id, household_id, texture, allergen_advice_needed) values (:'KID', :'HH', 'mashed', true);

set request.jwt.claim.sub = :'BEN';
update public.shopping_items set checked = true, checked_by = auth.uid(), checked_at = now() where label = 'potiron';
select tests.ok((select checked from public.shopping_items where label = 'potiron') and tests.count('select * from public.meal_plan_items') = 1
  and tests.count('select * from public.recipes where slug = ''ma-soupe-ana''') = 1, 'courses : le coparent voit le menu, la recette du foyer et coche un produit');
select tests.ok(tests.count('select * from public.recipe_favorites') = 0, 'favoris : personnels');
select tests.ok(tests.count('select * from public.child_food_settings') = 1, 'réglages alimentaires : partagés dans le foyer');

set request.jwt.claim.sub = :'OUT';
select tests.ok(tests.count('select * from public.meal_plans') + tests.count('select * from public.shopping_items') + tests.count('select * from public.child_food_settings')
  + tests.count('select * from public.recipes where owner_id is not null') = 0, 'isolation : rien du foyer n''est visible par une personne extérieure');
select tests.ok(tests.count('select * from public.recipes where owner_id is null') = 64, 'bibliothèque : lisible par tous les comptes');

-- Équipe éditoriale : relire, valider, retirer (journalisé) ; une recette retirée disparaît pour les familles
set request.jwt.claim.sub = :'EDI';
select public.set_recipe_status('puree-lisse-carotte', 'reviewed', 'Relue par la diététicienne');
select public.set_recipe_status('lassi-mangue', 'retired', 'Doublon de test');
select tests.ok((select status from public.recipes where slug = 'puree-lisse-carotte') = 'reviewed'
  and tests.count('select * from public.recipe_reviews r join public.recipes x on x.id = r.recipe_id where x.slug = ''puree-lisse-carotte'' and r.status = ''reviewed'' and r.by_user is not null') = 1,
  'administration : relecture enregistrée avec son auteur');
set request.jwt.claim.sub = :'ANA';
select tests.ok(tests.count('select * from public.recipes where slug = ''lassi-mangue''') = 0, 'administration : une recette retirée n''est plus proposée');
select tests.ok(jsonb_array_length(public.export_my_data() -> 'personal_recipes') = 1, 'export : recettes personnelles incluses');
reset role;
