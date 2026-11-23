-- Photos d'illustration des recettes générées par IA (ElevenLabs, novembre 2026) : nouveau type « ai_illustration ».
-- Les fichiers sont embarqués dans l'application (assets/recipes/) ; la base n'enregistre que les mentions.
-- Les lignes existantes ne changent pas : l'application applique les mentions de l'illustration aux recettes
-- de la bibliothèque qui ont un fichier (src/lib/recipes/db.ts).
alter table public.recipe_photos drop constraint if exists recipe_photos_kind_check;
alter table public.recipe_photos add constraint recipe_photos_kind_check
  check (kind in ('generated','licensed','owned','ai_illustration'));
