-- « Mon enfant a un besoin particulier » : nouveau choix « Je me pose des questions » (aucun diagnostic requis).
-- La contrainte d'origine (sans nom explicite) s'appelle child_needs_kinds_check.
alter table public.child_needs drop constraint if exists child_needs_kinds_check;
alter table public.child_needs add constraint child_needs_kinds_check
  check (kinds <@ array['adhd','asd','dys','language','dcd','tics','sensory','assessment','other','questions']::text[]);
