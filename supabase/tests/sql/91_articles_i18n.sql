-- Articles traduits (08/11/2026) : chaque article du catalogue a un titre, un résumé et un texte en es, de et it
-- (avant les tests qui créent leurs propres articles). Les traductions restent invisibles tant que la langue
-- n'est pas publiée dans l'administration (content_locales.articles_published = false).
reset role;
select tests.ok((select count(*) from public.articles where title_es is not null and summary_es is not null and body_md_es is not null) >= 1133, 'articles : catalogue traduit en espagnol (1133 articles)');
select tests.ok((select count(*) from public.articles where title_de is not null and summary_de is not null and body_md_de is not null) >= 1133, 'articles : catalogue traduit en allemand (1133 articles)');
select tests.ok((select count(*) from public.articles where title_it is not null and summary_it is not null and body_md_it is not null) >= 1133, 'articles : catalogue traduit en italien (1133 articles)');
select tests.ok(not exists (select 1 from public.content_locales where articles_published), 'articles : aucune langue publiée avant relecture');
