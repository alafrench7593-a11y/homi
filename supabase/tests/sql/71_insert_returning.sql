-- Enregistrer puis relire la ligne (INSERT … RETURNING, comme l'application via PostgREST .select()).
-- Régression P0 de la campagne QA du 02/11/2026 : enfants, grossesses, publications et albums refusés.
\set RA 'f1a00000-0000-4000-8000-000000000001'
\set RB 'f1a00000-0000-4000-8000-000000000002'
\set RH 'f1a00000-0000-4000-8000-0000000000f1'
reset role;
insert into auth.users (id, email) values (:'RA', 'returning-a@exemple.test'), (:'RB', 'returning-b@exemple.test');
insert into public.households (id, name, created_by) values (:'RH', 'Foyer returning', :'RA');
insert into public.household_members (household_id, user_id, role) values (:'RH', :'RA', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';
select tests.set_premium(:'RA', true);

set role authenticated; set request.jwt.claim.sub = :'RA';
insert into public.community_profiles (user_id, pseudonym, area_label) values (auth.uid(), 'Returning_A', 'Lyon');
do $$
declare v_id uuid; v_msg text;
begin
  v_msg := '';
  begin insert into public.children (household_id, first_name, birth_date) values ('f1a00000-0000-4000-8000-0000000000f1', 'Lou', current_date - 30) returning id into v_id;
  exception when others then v_msg := sqlerrm; end;
  insert into tests.results(name, ok, detail) values ('enregistrer puis relire : enfant', v_msg = '' and v_id is not null, v_msg);

  v_msg := ''; v_id := null;
  begin insert into public.pregnancies (household_id, due_date, carrier_user_id) values ('f1a00000-0000-4000-8000-0000000000f1', current_date + 120, 'f1a00000-0000-4000-8000-000000000001') returning id into v_id;
  exception when others then v_msg := sqlerrm; end;
  insert into tests.results(name, ok, detail) values ('enregistrer puis relire : grossesse', v_msg = '' and v_id is not null, v_msg);

  v_msg := ''; v_id := null;
  begin insert into public.posts (forum_id, title, body) values ((select id from public.forums where slug = 'grossesse'), 'Bonjour', 'Premier message') returning id into v_id;
  exception when others then v_msg := sqlerrm; end;
  insert into tests.results(name, ok, detail) values ('enregistrer puis relire : publication', v_msg = '' and v_id is not null, v_msg);

  v_msg := ''; v_id := null;
  begin insert into public.community_albums (owner_id, title) values (auth.uid(), 'Album test') returning id into v_id;
  exception when others then v_msg := sqlerrm; end;
  insert into tests.results(name, ok, detail) values ('enregistrer puis relire : album', v_msg = '' and v_id is not null, v_msg);
end $$;

-- L'isolation ne change pas : une autre personne ne voit ni l'enfant, ni la grossesse, ni l'album
set request.jwt.claim.sub = :'RB';
select tests.ok((select count(*) from public.children where household_id = :'RH') = 0, 'enregistrer puis relire : enfant invisible pour un autre foyer');
select tests.ok((select count(*) from public.pregnancies where household_id = :'RH') = 0, 'enregistrer puis relire : grossesse invisible pour un autre foyer');
select tests.ok((select count(*) from public.community_albums where owner_id = :'RA') = 0, 'enregistrer puis relire : album non partagé invisible');
reset role;
