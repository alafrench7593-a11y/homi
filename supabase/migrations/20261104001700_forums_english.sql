-- =====================================================================
-- 02/11/2026 (QA D-09 / D-10) : noms et descriptions des espaces de la communauté en anglais.
-- Additif : deux colonnes facultatives sur public.forums ; tant qu'elles sont vides, l'application affiche le
-- français (title / description ne sont jamais modifiés). Mêmes droits que les autres colonnes de la table.
-- Retour arrière :
--   alter table public.forums drop column if exists title_en, drop column if exists description_en;
-- =====================================================================
alter table public.forums add column if not exists title_en text;
alter table public.forums add column if not exists description_en text;

update public.forums f set title_en = v.title_en, description_en = v.description_en
from (values
  ('suivi-cycle', 'Cycle tracking', 'Cycle, periods, contraception, symptoms: share your experience.'),
  ('projet-bebe', 'Trying for a baby', 'Trying to have a child, fertility treatment (ART), waiting, hoping, supporting each other.'),
  ('grossesse', 'Pregnancy', 'Questions and personal stories during pregnancy, up to the birth.'),
  ('jumeaux-triples', 'Twins and triplets', 'Multiple pregnancies and families with twins or triplets.'),
  ('nouveau-ne', 'Newborn', 'The first weeks and months with your baby.'),
  ('allaitement', 'Breastfeeding', 'Breastfeeding, breast pumps, weaning, combination feeding.'),
  ('biberon', 'Bottle feeding', 'Preparation, amounts, choosing a milk, moving to the bottle.'),
  ('sommeil', 'Sleep', 'Nights, naps, bedtime routines, parents'' tiredness.'),
  ('diversification', 'Starting solids and meals', 'First meals, textures, menu ideas, family meals.'),
  ('sante-developpement', 'Health and development', 'Growth, milestones, everyday little worries: personal stories, not diagnoses.'),
  ('neurodeveloppement', 'Neurodevelopmental conditions', 'ADHD, autism (ASD), “dys” learning disorders, language… care pathways, paperwork and support between parents.'),
  ('post-partum', 'Postpartum and mothers'' wellbeing', 'After the birth: recovery, emotions, tiredness, getting help.'),
  ('plusieurs-enfants', 'Parents of several children', 'Organising life with several children, siblings, jealousy.'),
  ('questions-generales', 'General questions', 'Everything else: organisation, school, childcare, family life.')
) as v(slug, title_en, description_en)
where f.slug = v.slug;
