-- Mini-cadre de test : chaque vérification enregistre un résultat ;
-- le dernier fichier affiche le bilan et échoue s'il y a un échec.
create schema if not exists tests;
create table if not exists tests.results (n serial, name text, ok boolean, detail text);
grant usage on schema tests to anon, authenticated, service_role;
grant all on tests.results to anon, authenticated, service_role;
grant all on sequence tests.results_n_seq to anon, authenticated, service_role;

create or replace function tests.ok(p_cond boolean, p_name text, p_detail text default null)
returns void language plpgsql as $$
begin
  insert into tests.results(name, ok, detail) values (p_name, coalesce(p_cond, false), p_detail);
end $$;

-- Exécute une requête et vérifie qu'elle ÉCHOUE (refus RLS, contrainte…)
create or replace function tests.throws(p_sql text, p_name text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    insert into tests.results(name, ok, detail) values (p_name, false, 'aucune erreur levée');
  exception when others then
    insert into tests.results(name, ok, detail) values (p_name, true, sqlerrm);
  end;
end $$;

create or replace function tests.count(p_sql text) returns bigint language plpgsql as $$
declare v bigint; begin execute 'select count(*) from (' || p_sql || ') q' into v; return v; end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Identités utilisées dans les tests
-- Camille (propriétaire du foyer, admin) / Alex (coparent) / Zoé (inconnue)
insert into auth.users (id, email) values ('33333333-3333-4333-8333-333333333333', 'zoe@exemple.test');
