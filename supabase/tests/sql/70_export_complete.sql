-- Export RGPD : toute table de données personnelles ou du foyer doit figurer dans « Exporter mes données »
-- (sauf données techniques listées ici, avec la raison).
reset role;
insert into tests.results(name, ok, detail)
with defs as (
  select string_agg(pg_get_functiondef(p.oid), ' ') d from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and (p.proname = 'export_my_data' or p.proname like '\_export_my_data%')),
t as (
  select distinct c.table_name from information_schema.columns c
  join information_schema.tables tb using (table_schema, table_name)
  where c.table_schema = 'public' and tb.table_type = 'BASE TABLE'
    and c.column_name in ('household_id','user_id','child_id','created_by','owner_id','author_id','pregnancy_id')
    and c.table_name not in (
      'assistant_usage','feature_usage','scan_usage',          -- compteurs de quota
      'push_devices','calendar_feeds','household_invitations', -- jetons techniques (jamais exportés)
      'user_roles','album_shares','scan_recall_alerts',        -- droits et alertes calculées
      'ingredient_prices','product_prices'))                    -- relevés de prix publics
select 'export RGPD : toutes les tables de données sont exportées', count(*) = 0, string_agg(t.table_name, ', ')
from t, defs where defs.d !~ ('public\.' || t.table_name || '\M');

-- Une note privée d'une autre personne du foyer n'apparaît jamais dans mon export
\set XA 'eaa00000-0000-4000-8000-000000000001'
\set XB 'eaa00000-0000-4000-8000-000000000002'
\set XH 'eaa00000-0000-4000-8000-0000000000f1'
insert into auth.users (id, email) values (:'XA', 'export-a@exemple.test'), (:'XB', 'export-b@exemple.test');
insert into public.households (id, name, created_by) values (:'XH', 'Foyer export', :'XA');
insert into public.household_members (household_id, user_id, role) values (:'XH', :'XA', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'XH', :'XB', 'coparent') on conflict do nothing;
insert into public.notes (household_id, author_id, body, private_to_author) values
  (:'XH', :'XB', 'Note privée de B', true), (:'XH', :'XB', 'Note partagée de B', false);

set role authenticated; set request.jwt.claim.sub = :'XA';
insert into tests.results(name, ok, detail)
select 'export RGPD : les nouvelles rubriques sont présentes',
       e ? 'child_treatments' and e ? 'treatment_logs' and e ? 'notes' and e ? 'food_introductions' and e ? 'saved_posts' and e ? 'subscription',
       null
from (select public.export_my_data() e) x;
insert into tests.results(name, ok, detail)
select 'export RGPD : note partagée du coparent incluse, note privée exclue',
       e->'notes' @> '[{"body":"Note partagée de B"}]' and not (e->'notes' @> '[{"body":"Note privée de B"}]'),
       (e->'notes')::text
from (select public.export_my_data() e) x;
reset role;
