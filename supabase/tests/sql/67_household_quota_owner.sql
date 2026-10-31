-- Quota du foyer : il s'applique aussi quand c'est un COPARENT qui ajoute (régression des « oracles »).
\set QA 'e7a00000-0000-4000-8000-000000000001'
\set QB 'e7a00000-0000-4000-8000-000000000002'
\set QH 'e7a00000-0000-4000-8000-0000000000f1'
reset role;
insert into auth.users (id, email) values (:'QA', 'quota-a@exemple.test'), (:'QB', 'quota-b@exemple.test');
insert into public.households (id, name, created_by) values (:'QH', 'Foyer quota', :'QA');
insert into public.household_members (household_id, user_id, role) values (:'QH', :'QA', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'QH', :'QB', 'coparent')
  on conflict do nothing;
-- La propriétaire (gratuite) remplit le quota de listes (4)
set request.jwt.claim.sub = '';
insert into public.checklists (household_id, kind, title)
  select :'QH', 'custom', 'Liste ' || g from generate_series(1, (select free_value from public.plan_limits where key = 'checklists_count')) g;

set role authenticated; set request.jwt.claim.sub = :'QB';
do $$
declare v_msg text := '';
begin
  begin
    insert into public.checklists (household_id, kind, title) values ('e7a00000-0000-4000-8000-0000000000f1', 'custom', 'Une de trop');
  exception when others then v_msg := sqlerrm;
  end;
  insert into tests.results(name, ok, detail) values
    ('quota foyer : un coparent ne peut pas dépasser la limite gratuite de la propriétaire', v_msg like 'Limite de la version gratuite atteinte%', v_msg);
end $$;
reset role;

-- Si la propriétaire devient Premium, le coparent peut ajouter
insert into public.subscriptions (user_id, status, store, period_type, expires_at, will_renew)
  values (:'QA', 'active', 'test', 'monthly', now() + interval '20 days', true);
set role authenticated; set request.jwt.claim.sub = :'QB';
do $$
declare v_ok boolean := true; v_msg text := '';
begin
  begin
    insert into public.checklists (household_id, kind, title) values ('e7a00000-0000-4000-8000-0000000000f1', 'custom', 'Avec Premium');
  exception when others then v_ok := false; v_msg := sqlerrm;
  end;
  insert into tests.results(name, ok, detail) values ('quota foyer : Premium de la propriétaire lève la limite pour le coparent', v_ok, v_msg);
end $$;
reset role;
