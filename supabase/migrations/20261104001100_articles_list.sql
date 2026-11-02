-- =====================================================================
-- Au fil de nous — Liste d'articles légère (campagne QA, lot E : E-05)
--
-- Constat : useArticles() téléchargeait les 1 122 articles publiés avec leur texte complet
-- (body_md + body_md_en) : 11 Mo de JSON, à chaque ouverture de l'accueil ou de la bibliothèque.
-- Correctif côté application : la liste ne demande plus que les champs de liste ; le texte d'un
-- article est lu à l'ouverture de l'article (et le texte de tous les articles seulement pour la
-- recherche plein texte de la bibliothèque et l'assistant hors ligne, à la demande).
--
-- Problème à résoudre : l'appli n'affiche un article en anglais que si le titre ET le texte anglais
-- existent (localizeArticle). Sans télécharger body_md_en, la liste doit quand même le savoir.
-- → champ calculé PostgREST english_ready : select=…,english_ready sur la table articles.
--   Même règle que localizeArticle (valeurs vides = absentes). Aucune donnée n'est lue en plus :
--   la fonction ne reçoit que la ligne déjà autorisée par la RLS de articles.
--
-- Retour arrière : voir la fin du fichier.
-- =====================================================================

create or replace function public.english_ready(a public.articles)
returns boolean language sql stable set search_path = public as $$
  select coalesce(a.title_en, '') <> '' and coalesce(a.body_md_en, '') <> '';
$$;

comment on function public.english_ready(public.articles) is
  'Champ calculé (liste d''articles) : vrai si l''article a un titre ET un texte anglais (même règle que localizeArticle côté appli).';

grant execute on function public.english_ready(public.articles) to anon, authenticated;

-- =====================================================================
-- Retour arrière (à exécuter à la main si besoin) :
--   drop function if exists public.english_ready(public.articles);
--   -- l'application (useArticles, src/lib/data/hooks.ts) doit alors ne plus demander la colonne english_ready
-- Aucune donnée n'est modifiée par cette migration.
-- =====================================================================
