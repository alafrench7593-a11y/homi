-- =====================================================================
-- Boîte de médicaments BDPM (20261213000200_medicine_bdpm.sql) : code EAN-13, GTIN-14 du Data Matrix, CIP7,
-- recherche par nom, aucune posologie, lien de notice officielle, accès réservé aux comptes connectés.
-- =====================================================================
\set U 'bd0a0000-0000-4000-8000-000000000001'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'U', 'bdpm-u@exemple.test');
insert into public.medicine_presentations (cip13, cip7, cis, name, form, routes, presentation, holder, marketed) values
  ('3400934615467', '3461546', '66477582', 'DOLIPRANE 2,4 POUR CENT, suspension buvable', 'suspension buvable', 'orale', '1 flacon(s) de 100 ml', 'OPELLA HEALTHCARE FRANCE', true),
  ('3400900000001', '0000001', '60000001', 'DOLIPRANE ANCIEN, comprimé', 'comprimé', 'orale', 'boîte de 8', 'OPELLA HEALTHCARE FRANCE', false),
  ('3400900000002', '0000002', '60000002', 'ZZTEST_%_PRODUIT', 'gélule', 'orale', 'boîte de 10', 'LABO', true);

set role anon; set request.jwt.claim.sub = '';
select tests.throws($$select public.medicine_lookup('3400934615467')$$, 'médicaments : recherche refusée sans compte');
select tests.throws($$select * from public.medicine_presentations$$, 'médicaments : table non aspirable sans compte');
set role authenticated; set request.jwt.claim.sub = :'U';
select tests.throws($$select * from public.medicine_presentations$$, 'médicaments : table non lisible directement');
select tests.ok(public.medicine_lookup('3400934615467')->>'cis' = '66477582', 'médicaments : EAN-13 de la boîte');
select tests.ok(public.medicine_lookup('03400934615467')->>'cis' = '66477582', 'médicaments : GTIN-14 du Data Matrix');
select tests.ok(public.medicine_lookup('3461546')->>'cis' = '66477582', 'médicaments : CIP7');
select tests.ok(public.medicine_lookup('3017620422003') is null and public.medicine_lookup('abc') is null, 'médicaments : code inconnu ou invalide → rien');
select tests.ok(public.medicine_lookup('3400934615467')->>'notice_url' = 'https://base-donnees-publique.medicaments.gouv.fr/medicament/66477582/extrait',
  'médicaments : lien vers la notice officielle');
select tests.ok(public.medicine_lookup('3400934615467')::text !~* 'posolog|dose|mg/kg', 'médicaments : aucune posologie dans la fiche');
select tests.ok(jsonb_array_length(public.medicine_search('doli')) = 2
  and (public.medicine_search('doli')->0->>'marketed')::boolean, 'médicaments : recherche par nom, commercialisé en premier');
select tests.ok(jsonb_array_length(public.medicine_search('do')) = 0, 'médicaments : 3 lettres minimum');
select tests.ok(jsonb_array_length(public.medicine_search('zztest_%')) = 1 and jsonb_array_length(public.medicine_search('zz%')) = 0,
  'médicaments : % et _ pris à la lettre');
reset role; set request.jwt.claim.sub = '';
