-- Documents : le fichier doit être rangé dans le dossier du foyer du document, et ne peut plus être déplacé.
-- Consentement « photo de cycle analysée par l'IA » : motif accepté.
\set DA 'e9a00000-0000-4000-8000-000000000001'
\set DB 'e9a00000-0000-4000-8000-000000000002'
\set HA 'e9a00000-0000-4000-8000-0000000000a1'
\set HB 'e9a00000-0000-4000-8000-0000000000b1'
reset role;
insert into auth.users (id, email) values (:'DA', 'doc-a@exemple.test'), (:'DB', 'doc-b@exemple.test');
insert into public.households (id, name, created_by) values (:'HA', 'Foyer A', :'DA'), (:'HB', 'Foyer B', :'DB');
insert into public.household_members (household_id, user_id, role) values (:'HA', :'DA', 'owner'), (:'HB', :'DB', 'owner')
  on conflict (household_id, user_id) do update set role = 'owner';

set role authenticated; set request.jwt.claim.sub = :'DB';
do $$
declare v_msg text := '';
begin
  -- B tente de rattacher à SON foyer un fichier rangé dans le dossier du foyer A
  begin
    insert into public.documents (household_id, uploaded_by, title, category, storage_path, mime_type, size_bytes)
    values ('e9a00000-0000-4000-8000-0000000000b1', 'e9a00000-0000-4000-8000-000000000002', 'Volé', 'other',
            'e9a00000-0000-4000-8000-0000000000a1/0b1e0000-0000-4000-8000-000000000001.pdf', 'application/pdf', 10);
  exception when others then v_msg := sqlerrm;
  end;
  insert into tests.results(name, ok, detail) values
    ('documents : impossible de rattacher le fichier d’un autre foyer', v_msg like '%documents_storage_path_household%', v_msg);

  v_msg := '';
  begin
    insert into public.documents (household_id, uploaded_by, title, category, storage_path, mime_type, size_bytes)
    values ('e9a00000-0000-4000-8000-0000000000b1', 'e9a00000-0000-4000-8000-000000000002', 'Le mien', 'other',
            'e9a00000-0000-4000-8000-0000000000b1/0b1e0000-0000-4000-8000-000000000002.pdf', 'application/pdf', 10);
  exception when others then v_msg := sqlerrm;
  end;
  insert into tests.results(name, ok, detail) values ('documents : un fichier de son propre foyer s’enregistre', v_msg = '', v_msg);

  v_msg := '';
  begin
    update public.documents set storage_path = 'e9a00000-0000-4000-8000-0000000000b1/0b1e0000-0000-4000-8000-000000000003.pdf'
    where storage_path = 'e9a00000-0000-4000-8000-0000000000b1/0b1e0000-0000-4000-8000-000000000002.pdf';
  exception when others then v_msg := sqlerrm;
  end;
  insert into tests.results(name, ok, detail) values ('documents : le fichier d’un document ne peut pas être déplacé', v_msg like '%ne peut pas être déplacé%', v_msg);
end $$;
reset role;

do $$
declare v_msg text := '';
begin
  begin
    insert into public.consents (user_id, purpose, granted) values ('e9a00000-0000-4000-8000-000000000001', 'cycle_photo_ai', true);
  exception when others then v_msg := sqlerrm;
  end;
  insert into tests.results(name, ok, detail) values ('consentement : motif « photo de cycle analysée par l’IA » accepté', v_msg = '', v_msg);
end $$;
