-- =====================================================================
-- Réorganisation par profil (20 octobre 2026)
--  · Vaccins : la dose du calendrier officiel à laquelle correspond une vaccination notée (calendar_key)
--  · Rendez-vous : « fait » (completed_at), pour marquer un rendez-vous de vaccination comme réalisé
--  · Articles et vidéos : statut éditorial honnête (Brouillon généré par IA / À vérifier / Relu / Validé pour publication),
--    indépendant de la visibilité ; nouvelles catégories « Sexualité » et « Sommeil »
--  · Contenu des vidéos de gestes de santé : jamais publié sans validation par un professionnel qualifié
-- =====================================================================

alter table public.child_vaccinations add column if not exists calendar_key text check (calendar_key is null or calendar_key ~ '^[a-z0-9_]{2,40}$');
create unique index if not exists child_vaccinations_calendar_key_idx on public.child_vaccinations(child_id, calendar_key) where calendar_key is not null;

alter table public.appointments add column if not exists completed_at timestamptz;
alter table public.appointments add column if not exists calendar_keys text[] not null default '{}';

-- Statut éditorial des contenus (les 14 articles existants ont été rédigés avec l'aide d'une IA : « À vérifier »)
alter table public.articles add column if not exists editorial_status text not null default 'to_review'
  check (editorial_status in ('ai_draft', 'to_review', 'reviewed', 'validated'));
alter table public.videos add column if not exists editorial_status text not null default 'to_review'
  check (editorial_status in ('ai_draft', 'to_review', 'reviewed', 'validated'));
alter table public.videos add column if not exists health_gesture boolean not null default false;

-- Un statut « Relu » ou « Validé » exige le nom et la qualification de la personne (jamais inventés)
alter table public.articles add constraint articles_validation_needs_reviewer
  check (editorial_status not in ('reviewed', 'validated') or (reviewer_name is not null and reviewer_qualification is not null)) not valid;
alter table public.videos add constraint videos_validation_needs_validator
  check (editorial_status not in ('reviewed', 'validated') or (validator_name is not null and validator_qualification is not null)) not valid;
-- Une vidéo de geste de santé n'est publiée qu'après validation par un professionnel qualifié
alter table public.videos add constraint videos_health_gesture_validated
  check (not (health_gesture and status = 'published') or (editorial_status = 'validated' and validator_name is not null and validator_qualification is not null and validated_at is not null)) not valid;

update public.articles set editorial_status = 'to_review' where reviewer_name is null;

insert into public.content_categories (slug, label, icon, position)
values ('sexualite', 'Sexualité et couple', 'heart', 10), ('sommeil', 'Sommeil', 'moon', 11)
on conflict (slug) do nothing;
