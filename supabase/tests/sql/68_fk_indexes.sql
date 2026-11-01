-- Performance : chaque colonne de liaison (clé étrangère) doit avoir un index,
-- sinon suppressions de compte et contrôles d'accès parcourent toute la table.
reset role;
insert into tests.results(name, ok, detail)
select 'index : toutes les clés étrangères simples sont indexées', count(*) = 0,
       string_agg(c.conrelid::regclass::text || '.' || a.attname, ', ')
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
where c.contype = 'f' and c.connamespace = 'public'::regnamespace and array_length(c.conkey, 1) = 1
  and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1]);

insert into tests.results(name, ok, detail)
select 'sécurité : toutes les tables publiques ont la protection RLS', count(*) = 0, string_agg(c.relname, ', ')
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;
