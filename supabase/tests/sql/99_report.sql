\pset footer off
select case when ok then '  ✓' else '  ✗' end as " ", name as "vérification", case when not ok then detail end as "détail"
from tests.results order by n;

select count(*) filter (where ok) as "réussis", count(*) filter (where not ok) as "échoués" from tests.results;

do $$
begin
  if exists (select 1 from tests.results where not ok) then
    raise exception 'Des tests de sécurité ont échoué';
  end if;
end $$;
