-- =====================================================================================================================
-- Marque (23/11/2026) : l'ancienne marque « Au fil de nous » restait dans le TEXTE éditorial de 4 articles
-- (français, anglais, espagnol, allemand, italien), visible des lecteurs. Remplacement par « HOMI ».
-- Migration ADDITIVE et IDEMPOTENTE : seul le contenu éditorial publié par l'équipe (table articles : titres, résumés,
-- corps, auteur) est concerné ; aucune donnée saisie par un utilisateur, aucun identifiant technique
-- (produits « aufildenous_* », identifiant d'application) n'est touché. Rejouée, elle ne change plus rien.
-- Sources corrigées en parallèle : content-i18n/articles/<langue>/*.json (le français du code était déjà à jour).
-- Retour arrière : sans objet (texte éditorial) ; réappliquer les migrations d'articles d'origine si nécessaire.
-- =====================================================================================================================
do $$
declare c text;
begin
  for c in
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'articles' and data_type = 'text'
      and (column_name ~ '^(title|summary|body_md)(_[a-z]{2})?$' or column_name = 'author_name')
  loop
    execute format('update public.articles set %1$I = replace(%1$I, %2$L, %3$L) where %1$I like %4$L', c, 'Au fil de nous', 'HOMI', '%Au fil de nous%');
  end loop;
end $$;
