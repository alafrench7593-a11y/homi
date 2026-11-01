-- =====================================================================
-- 01/11/2026 : application en deux langues distinctes (français / anglais).
-- Ajoute la version anglaise des contenus partagés : articles (titre, résumé, texte) et thèmes.
-- Additif : colonnes facultatives ; tant qu'elles sont vides, l'application affiche le français.
-- Les traductions (à relire, comme les textes français) sont versées par une migration générée.
-- Retour arrière :
--   alter table public.articles drop column if exists title_en, drop column if exists summary_en, drop column if exists body_md_en;
--   alter table public.content_categories drop column if exists label_en;
-- =====================================================================
alter table public.articles add column if not exists title_en text;
alter table public.articles add column if not exists summary_en text;
alter table public.articles add column if not exists body_md_en text;
alter table public.content_categories add column if not exists label_en text;
