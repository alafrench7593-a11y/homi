-- =====================================================================
-- Consentements d'inscription enregistrés par le déclencheur, à partir
-- des métadonnées envoyées par le formulaire (18 ans, CGU, confidentialité).
-- =====================================================================
\set FANNY 'b9b9b9b9-0000-4000-8000-000000000001'
\set GASPARD 'b9b9b9b9-0000-4000-8000-000000000002'
\set HUGO 'b9b9b9b9-0000-4000-8000-000000000003'

insert into auth.users (id, email, raw_user_meta_data) values
 (:'FANNY', 'meta-fanny@exemple.test', '{"adult_confirmed": true, "terms_version": "2026-10", "privacy_version": "2026-10"}'),
 (:'GASPARD', 'meta-gaspard@exemple.test', '{}'),
 (:'HUGO', 'meta-hugo@exemple.test', '{"adult_confirmed": false, "terms_version": "2026-10", "privacy_version": "2026-10"}');

select tests.ok((select count(*) from public.consents where user_id = :'FANNY') = 3, 'inscription avec accord : trois consentements enregistrés');
select tests.ok((select array_agg(purpose order by purpose) from public.consents where user_id = :'FANNY') = array['adult_confirmation','privacy_policy','terms'], 'inscription : CGU, confidentialité et majorité');
select tests.ok((select bool_and(granted and version = '2026-10' and created_at is not null) from public.consents where user_id = :'FANNY'), 'inscription : versions et horodatage');
select tests.ok((select count(*) from public.consents where user_id = :'GASPARD') = 0, 'inscription sans métadonnées (Apple/Google) : aucun consentement inventé');
select tests.ok((select count(*) from public.consents where user_id = :'HUGO') = 0, 'majorité non confirmée : aucun consentement');
select tests.ok((select count(*) from public.households where created_by = :'FANNY') = 1, 'inscription avec métadonnées : le foyer est toujours créé');
