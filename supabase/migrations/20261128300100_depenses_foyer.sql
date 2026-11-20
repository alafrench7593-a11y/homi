-- =====================================================================
-- Dépenses familiales (28/11/2026) — outil 186 « Gestion des dépenses familiales »
-- Écran : src/app/family/expenses.tsx ; tests : supabase/tests/sql/98zg_depenses_foyer.sql,
-- src/__tests__/foyerTools.test.ts
--
-- ADDITIF ET IDEMPOTENT : une table, ses politiques et ses déclencheurs. Aucune donnée existante réécrite.
--
--  household_expenses : dépense saisie par un parent (montant, date, catégorie, qui a payé, enfant concerné facultatif,
--                       part supportée par celui qui a payé, note). Lien facultatif vers une candidate d'« Avant la
--                       garde » (childcare_candidates) : la dépense de garde réelle est rattachée au mode de garde
--                       choisi, le budget estimé n'est jamais recopié en dépense.
--  Accès : parents du foyer seulement (propriétaire, co-parent). Une nounou, un non-membre ou un ancien membre n'en
--  voient rien. Aucune connexion bancaire, aucun conseil financier : la base ne stocke que les montants saisis.
-- Retour arrière : en fin de fichier.
-- =====================================================================

create table if not exists public.household_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0 and amount <= 100000),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  spent_on date not null default current_date check (spent_on >= date '2000-01-01' and spent_on < date '2100-01-01'),
  category text not null check (category in ('food', 'children', 'childcare', 'health', 'housing', 'leisure', 'other')),
  paid_by uuid references auth.users(id) on delete set null,
  -- part de la dépense supportée par la personne qui a payé (50 = partagée à parts égales, 100 = pour elle seule)
  payer_share smallint not null default 50 check (payer_share between 0 and 100),
  child_id uuid references public.children(id) on delete set null,
  candidate_id uuid references public.childcare_candidates(id) on delete set null,
  note text check (note is null or char_length(note) <= 300),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists household_expenses_household_idx on public.household_expenses(household_id, spent_on);
create index if not exists household_expenses_paid_by_idx on public.household_expenses(paid_by);
create index if not exists household_expenses_child_idx on public.household_expenses(child_id);
create index if not exists household_expenses_candidate_idx on public.household_expenses(candidate_id);
create index if not exists household_expenses_created_by_idx on public.household_expenses(created_by);

-- Cohérence : la personne qui a payé est un parent du foyer ; l'enfant et la candidate sont du même foyer ; une
-- candidate ne se rattache qu'à une dépense de garde.
create or replace function public._household_expense_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- (vérifié à la saisie et quand la valeur change : un ancien parent garde ses dépenses passées)
  if new.paid_by is not null and (tg_op = 'INSERT' or new.paid_by is distinct from old.paid_by) and not exists (select 1 from public.household_members m
      where m.household_id = new.household_id and m.user_id = new.paid_by and m.role in ('owner', 'coparent')) then
    raise exception 'Personne hors du foyer' using errcode = '42501';
  end if;
  if new.child_id is not null and not exists (select 1 from public.children c where c.id = new.child_id and c.household_id = new.household_id) then
    raise exception 'Enfant d''un autre foyer' using errcode = '42501';
  end if;
  if new.candidate_id is not null then
    if new.category <> 'childcare' then raise exception 'Mode de garde : seulement pour une dépense de garde' using errcode = '23514'; end if;
    if not exists (select 1 from public.childcare_candidates c where c.id = new.candidate_id and c.household_id = new.household_id) then
      raise exception 'Mode de garde d''un autre foyer' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public._household_expense_guard() from public, anon, authenticated;

drop trigger if exists household_expenses_guard on public.household_expenses;
create trigger household_expenses_guard before insert or update on public.household_expenses
  for each row execute function public._household_expense_guard();
drop trigger if exists household_expenses_keep_author on public.household_expenses;
create trigger household_expenses_keep_author before insert or update on public.household_expenses
  for each row execute function public._keep_author('created_by');
drop trigger if exists household_expenses_premium_write on public.household_expenses;
create trigger household_expenses_premium_write before insert on public.household_expenses
  for each row execute function public._require_premium_write('premium');
drop trigger if exists household_expenses_touch on public.household_expenses;
create trigger household_expenses_touch before update on public.household_expenses
  for each row execute function public.touch_updated_at();

alter table public.household_expenses enable row level security;
drop policy if exists household_expenses_parents on public.household_expenses;
create policy household_expenses_parents on public.household_expenses for all to authenticated
  using (public._is_household_parent(household_id)) with check (public._is_household_parent(household_id));
grant select, insert, update, delete on public.household_expenses to authenticated;
revoke all on public.household_expenses from anon;

-- ---------------------------------------------------------------- Retour arrière (après accord, données perdues)
-- drop table if exists public.household_expenses;
-- drop function if exists public._household_expense_guard();
