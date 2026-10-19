-- =====================================================================
-- Réorganisation par profil : vaccins du calendrier, rendez-vous « faits », statut éditorial des articles et vidéos.
-- =====================================================================
\set ANA 'd0d0a000-0000-4000-8000-000000000001'
\set OUT 'd0d0a000-0000-4000-8000-000000000002'
\set HH  'd0d0a000-0000-4000-8000-0000000000f1'
\set KID 'd0d0a000-0000-4000-8000-0000000000c1'
insert into auth.users (id, email) values (:'ANA', 'v-ana@exemple.test'), (:'OUT', 'v-out@exemple.test');
insert into public.profiles (id, display_name) values (:'ANA', 'Ana'), (:'OUT', 'Autre') on conflict (id) do nothing;
insert into public.households (id, name, created_by) values (:'HH', 'Foyer Ana', :'ANA');
insert into public.household_members (household_id, user_id, role) select :'HH', :'ANA', 'owner' where not exists (select 1 from public.household_members where household_id = :'HH' and user_id = :'ANA');
insert into public.children (id, household_id, first_name, birth_date) values (:'KID', :'HH', 'Lina', current_date - 70);

-- Contenus : statut éditorial honnête
select tests.ok(tests.count('select * from public.articles where editorial_status in (''reviewed'', ''validated'') and (reviewer_name is null or reviewer_qualification is null)') = 0, 'articles : jamais « relu » ou « validé » sans nom et qualification');
select tests.ok(tests.count('select * from public.articles where slug like ''sexualite%'' or category_id = (select id from public.content_categories where slug = ''sexualite'')') >= 5, 'articles : section sexualité pendant la grossesse');
select tests.ok(tests.count('select * from public.articles where editorial_status = ''to_review'' and author_name like ''%IA%''') >= 30, 'articles : bibliothèque par parcours, « à vérifier »');
select tests.ok(tests.count('select * from public.articles a where author_name like ''%IA%'' and (jsonb_array_length(sources) = 0 or exists (select 1 from jsonb_array_elements(a.sources) s where s->>''url'' not like ''https://%'' or s->>''consulted_on'' is null))') = 0, 'articles : chaque article cite des références datées');
select tests.throws($$update public.articles set editorial_status = 'validated' where slug = (select slug from public.articles where author_name like '%IA%' limit 1)$$, 'articles : validation impossible sans relecteur');
select tests.throws($$insert into public.videos (title, health_gesture, status, editorial_status) values ('Massage du bébé', true, 'published', 'to_review')$$, 'vidéos : un geste de santé n''est jamais publié sans validation');
insert into public.videos (title, health_gesture, status, editorial_status, validator_name, validator_qualification, validated_at) values ('Massage du bébé', true, 'published', 'validated', 'Nom', 'Puéricultrice', current_date);
select tests.ok(tests.count('select * from public.videos where title = ''Massage du bébé'' and status = ''published''') = 1, 'vidéos : publiée une fois validée par une professionnelle nommée');

-- Vaccins : dose du calendrier notée par le parent, une seule fois par dose ; rendez-vous fait
set role authenticated; set request.jwt.claim.sub = :'ANA';
insert into public.child_vaccinations (child_id, household_id, vaccine, given_on, dose_label, source, calendar_key) values (:'KID', :'HH', 'Hexavalent', current_date - 5, '1re injection', 'parent', 'hexa_1');
select tests.ok(tests.count('select * from public.child_vaccinations where calendar_key = ''hexa_1''') = 1, 'vaccins : dose du calendrier notée');
select tests.throws($$insert into public.child_vaccinations (child_id, household_id, vaccine, given_on, source, calendar_key) values ('d0d0a000-0000-4000-8000-0000000000c1', 'd0d0a000-0000-4000-8000-0000000000f1', 'Hexavalent', current_date - 4, 'parent', 'hexa_1')$$, 'vaccins : une dose n''est notée qu''une fois');
insert into public.appointments (household_id, child_id, kind, title, starts_at, calendar_keys) values (:'HH', :'KID', 'vaccination', 'Vaccins de 4 mois — Lina', now() + interval '20 days', array['hexa_2', 'pneumo_2']);
update public.appointments set completed_at = now() where child_id = :'KID' and kind = 'vaccination';
select tests.ok(tests.count('select * from public.appointments where child_id = ''d0d0a000-0000-4000-8000-0000000000c1'' and completed_at is not null and calendar_keys @> array[''hexa_2'']') = 1, 'rendez-vous : marqué fait, doses rattachées');
reset role;
set role authenticated; set request.jwt.claim.sub = :'OUT';
select tests.ok(tests.count('select * from public.child_vaccinations where child_id = ''d0d0a000-0000-4000-8000-0000000000c1''') = 0, 'vaccins : invisibles hors du foyer');
reset role;
