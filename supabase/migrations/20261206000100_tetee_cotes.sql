-- =====================================================================
-- Allaitement (22/11/2026) : durée de CHAQUE côté dans la MÊME tétée.
--
-- Une tétée reste UNE ligne de public.breastfeeds. Les passages d'un côté à l'autre sont gardés dans `segments` :
--   [{ "side": "left"|"right", "from": "<horodatage>", "to": "<horodatage>"|null }, …]  (to = null : côté en cours)
-- `side` garde son sens actuel (gauche, droite, « les deux » dès que les deux côtés ont été pris) : les écrans, exports
-- et rappels existants continuent de fonctionner. Colonne facultative : les anciennes tétées (sans segments) gardent un
-- côté unique sur toute leur durée, ou une répartition « non notée » pour « les deux ».
-- L'application fonctionne AVANT ce déploiement : si la colonne manque (PGRST204), elle écrit sans `segments`.
-- Aucune autre table, aucune politique d'accès modifiée (les politiques « daily » du foyer s'appliquent déjà).
-- Export RGPD : `breastfeeds` est exporté ligne entière (to_jsonb) : la colonne y figure sans autre changement.
-- =====================================================================
alter table public.breastfeeds add column if not exists segments jsonb;

alter table public.breastfeeds drop constraint if exists breastfeeds_segments_check;
alter table public.breastfeeds add constraint breastfeeds_segments_check check (
  segments is null or (jsonb_typeof(segments) = 'array' and jsonb_array_length(segments) between 1 and 40)
);

-- ---------------------------------------------------------------- Retour arrière (données de répartition perdues)
-- alter table public.breastfeeds drop constraint if exists breastfeeds_segments_check, drop column if exists segments;
