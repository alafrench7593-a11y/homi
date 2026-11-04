-- =====================================================================
-- « Mes questions pour le rendez-vous » partout (04/11/2026, script 80 « J'ai oublié toutes mes questions »)
--  * Les questions de consultation existaient pour les parcours fertilité, contraception et post-partum.
--    Elles s'ouvrent à la grossesse, à chaque enfant (colonne child_id) et à « moi » en général.
--  * Migration additive et réversible : aucune ligne modifiée ni supprimée.
--    Retour arrière : alter table public.consultation_questions drop column child_id ;
--                     remettre la contrainte check (journey in ('ttc','avoid','postpartum')).
-- =====================================================================
alter table public.consultation_questions add column if not exists child_id uuid references public.children(id) on delete cascade;
alter table public.consultation_questions drop constraint if exists consultation_questions_journey_check;
alter table public.consultation_questions add constraint consultation_questions_journey_check
  check (journey in ('ttc','avoid','postpartum','pregnancy','child','general'));
-- Une question d'enfant appartient à un enfant du foyer de la personne (même règle que les autres tables filles)
alter table public.consultation_questions drop constraint if exists consultation_questions_child_journey_check;
alter table public.consultation_questions add constraint consultation_questions_child_journey_check
  check (child_id is null or journey = 'child');
create index if not exists consultation_questions_child_idx on public.consultation_questions(user_id, child_id) where child_id is not null;
