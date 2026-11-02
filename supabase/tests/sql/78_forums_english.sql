-- QA D-09 / D-10 (20261104001700_forums_english) : chaque espace de la communauté a un nom et une description en
-- anglais ; le français reste intact ; les colonnes anglaises se lisent avec les mêmes droits que le reste.
reset role;
select tests.ok((select count(*) from public.forums where not archived) = 14, 'forums : 14 espaces actifs');
select tests.ok(not exists (select 1 from public.forums where not archived and (coalesce(title_en, '') = '' or coalesce(description_en, '') = '')),
  'forums : chaque espace actif a un nom et une description en anglais');
select tests.ok((select title from public.forums where slug = 'jumeaux-triples') = 'Jumeaux et triplés', 'forums : nom français inchangé');
select tests.ok((select title_en from public.forums where slug = 'jumeaux-triples') = 'Twins and triplets', 'forums : nom anglais posé');
select tests.ok(not exists (select 1 from public.forums where not archived and (title_en ~ '[àâçéèêëîïôûùüÿœ]' or description_en ~ '[àâçéèêëîïôûùüÿœ]')),
  'forums : aucun accent français dans les textes anglais');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000d1';
select tests.ok((select title_en from public.forums where slug = 'questions-generales') = 'General questions', 'forums : nom anglais lisible par une personne connectée');
reset role;
-- QA D-10 (20261104001900_articles_en_reference) : les 14 articles de référence ont leur version anglaise complète.
select tests.ok((select count(*) from public.articles a where a.slug in ('baby-blues-ou-depression', 'cesarienne', 'contraception-urgence',
  'cycle-fenetre-fertile', 'debut-diversification', 'demander-de-l-aide', 'diastasis', 'fromages-grossesse', 'hormones-apres-naissance',
  'nuits-jumeaux', 'perinee-role', 'premiers-jours-retour-maison', 'signes-du-travail', 'valise-maternite') and public.english_ready(a)) = 14,
  'articles de référence : titre et texte anglais posés pour les 14');
select tests.ok((select title from public.articles where slug = 'valise-maternite') = 'Préparer sa valise de maternité', 'articles de référence : titre français inchangé');
