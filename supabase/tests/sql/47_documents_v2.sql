-- =====================================================================
-- Documents v2 : privé par défaut, partage explicite et révocable, extractions liées aux droits du document,
-- profil du même foyer, vérification horodatée, suppression des données dérivées.
-- =====================================================================
\set ANA   'd0c00000-0000-4000-8000-000000000001'
\set BEN   'd0c00000-0000-4000-8000-000000000002'
\set CHLOE 'd0c00000-0000-4000-8000-000000000003'
\set F1    'd0c00000-0000-4000-8000-0000000000f1'
\set F2    'd0c00000-0000-4000-8000-0000000000f2'
\set KID1  'd0c00000-0000-4000-8000-0000000000c1'
\set KID2  'd0c00000-0000-4000-8000-0000000000c2'
\set DOC   'd0c00000-0000-4000-8000-0000000000d1'
\set DOCB  'd0c00000-0000-4000-8000-0000000000d2'

insert into auth.users (id, email) values (:'ANA', 'doc-ana@exemple.test'), (:'BEN', 'doc-ben@exemple.test'), (:'CHLOE', 'doc-chloe@exemple.test');
insert into public.households (id, name, created_by) values (:'F1', 'Foyer Ana', :'ANA'), (:'F2', 'Foyer Chloé', :'CHLOE');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values (:'F1', :'BEN', 'coparent',
  array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','health','documents','pregnancy','lists','names','profile']);
insert into public.children (id, household_id, first_name, birth_date) values (:'KID1', :'F1', 'Léo', '2024-03-01'), (:'KID2', :'F2', 'Mia', '2023-05-01');
insert into storage.objects (bucket_id, name, owner) values
  ('documents', :'F1' || '/ana-ordo.pdf', :'ANA'), ('documents', :'F1' || '/ben-prive.pdf', :'BEN');

-- ---------------------------------------------------------------- Ana dépose un document SANS préciser : il est privé
set role authenticated; set request.jwt.claim.sub = :'ANA';
insert into public.documents (id, household_id, child_id, category, title, storage_path, mime_type, size_bytes, page_count, ocr_text, ocr_source, review_status)
values (:'DOC', :'F1', :'KID1', 'prescription', 'Ordonnance Léo', :'F1' || '/ana-ordo.pdf', 'application/pdf', 2048, 2, 'AMOXICILLINE 250 mg', 'manual', 'to_verify');
select tests.ok((select private_to_uploader from public.documents where id = :'DOC'), 'documents v2 : privé par défaut');
insert into public.document_extractions (document_id, kind, fields, status, source)
values (:'DOC', 'reading', '{"medications":[{"name":"AMOXICILLINE","dose":"250 mg"}]}', 'to_verify', 'local');
insert into public.document_extractions (document_id, kind, level, fields, status, source)
values (:'DOC', 'summary', 'quick', '{"text":"Ordonnance"}', 'to_verify', 'local');
insert into public.reminders (household_id, category, title, schedule, deep_link)
values (:'F1', 'custom', 'Contrôle', '{"type":"once","at":"2030-01-02T09:00:00Z"}', '/documents/' || :'DOC');

-- Ben (même foyer, droits « documents ») : ne voit ni le document privé, ni son texte, ni ses résumés
set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.documents where id = ''d0c00000-0000-4000-8000-0000000000d1''') = 0, 'documents v2 : document privé invisible pour un autre membre du foyer');
select tests.ok(tests.count('select * from public.document_extractions') = 0, 'documents v2 : texte lu et résumés d''un document privé invisibles pour le foyer (faille corrigée)');
select tests.ok(tests.count('select * from storage.objects where name = ''d0c00000-0000-4000-8000-0000000000f1/ana-ordo.pdf''') = 0, 'documents v2 : fichier privé inaccessible (pas d''URL signée possible)');
select tests.throws($$insert into public.document_extractions (document_id, fields) values ('d0c00000-0000-4000-8000-0000000000d1', '{}')$$, 'documents v2 : impossible d''ajouter une extraction à un document invisible');
update public.documents set title = 'Piraté' where id = :'DOC';
-- Chloé (autre foyer) : rien, même en connaissant l'identifiant
set request.jwt.claim.sub = :'CHLOE';
select tests.ok(tests.count('select * from public.documents') = 0 and tests.count('select * from public.document_extractions') = 0, 'documents v2 : un autre compte ne voit rien, même avec l''identifiant');
delete from public.documents where id = :'DOC';
update public.document_extractions set status = 'verified';

-- ---------------------------------------------------------------- Partage explicite, puis révocation
set request.jwt.claim.sub = :'ANA';
select tests.ok((select title from public.documents where id = :'DOC') = 'Ordonnance Léo', 'documents v2 : ni modification ni suppression par un autre compte');
update public.documents set private_to_uploader = false where id = :'DOC';
set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.documents') = 1 and tests.count('select * from public.document_extractions') = 2, 'documents v2 : partagé explicitement → document et extractions visibles du coparent');
set request.jwt.claim.sub = :'ANA';
update public.documents set private_to_uploader = true where id = :'DOC';
set request.jwt.claim.sub = :'BEN';
select tests.ok(tests.count('select * from public.documents') = 0 and tests.count('select * from public.document_extractions') = 0, 'documents v2 : révocation immédiate (document et extractions)');

-- Ben dépose un document privé : la propriétaire du foyer ne peut ni le voir, ni le supprimer, ni effacer le fichier
insert into public.documents (id, household_id, category, title, storage_path, mime_type, size_bytes)
values (:'DOCB', :'F1', 'psych', 'Suivi Ben', :'F1' || '/ben-prive.pdf', 'application/pdf', 1000);
set request.jwt.claim.sub = :'ANA';
delete from public.documents where id = :'DOCB';
delete from storage.objects where name = 'd0c00000-0000-4000-8000-0000000000f1/ben-prive.pdf';
reset role;
select tests.ok(exists (select 1 from public.documents where id = :'DOCB') and exists (select 1 from storage.objects where name = 'd0c00000-0000-4000-8000-0000000000f1/ben-prive.pdf'),
  'documents v2 : la propriétaire du foyer ne supprime pas le document privé d''un membre ni son fichier');

-- ---------------------------------------------------------------- Règles de contenu
set role authenticated; set request.jwt.claim.sub = :'ANA';
select tests.throws($$update public.documents set child_id = 'd0c00000-0000-4000-8000-0000000000c2' where id = 'd0c00000-0000-4000-8000-0000000000d1'$$, 'documents v2 : impossible d''associer l''enfant d''un autre foyer');
select tests.throws($$update public.documents set category = 'custom' where id = 'd0c00000-0000-4000-8000-0000000000d1'$$, 'documents v2 : catégorie personnalisée sans nom refusée');
update public.documents set category = 'custom', custom_category = 'Orthophonie' where id = :'DOC';
select tests.ok((select custom_category from public.documents where id = :'DOC') = 'Orthophonie', 'documents v2 : catégorie personnalisée');
update public.documents set category = 'vaccination', custom_category = null, favorite = true where id = :'DOC';
select tests.ok((select category = 'vaccination' and favorite from public.documents where id = :'DOC'), 'documents v2 : nouvelles catégories et favoris');
select tests.throws($$update public.document_extractions set status = 'professional' where kind = 'reading'$$, 'documents v2 : « confirmé par un professionnel » refusé sans source documentée');
update public.document_extractions set status = 'verified' where kind = 'reading';
select tests.ok((select verified_by = 'd0c00000-0000-4000-8000-000000000001' and verified_at is not null from public.document_extractions where kind = 'reading'), 'documents v2 : vérification horodatée au nom de la personne connectée');
update public.document_extractions set status = 'professional', professional_note = 'Relu avec le pédiatre, consultation du 12/10' where kind = 'reading';
select tests.ok((select status from public.document_extractions where kind = 'reading') = 'professional', 'documents v2 : confirmation professionnelle avec source documentée');

-- ---------------------------------------------------------------- Suppression : données dérivées
delete from public.documents where id = :'DOC';
reset role;
select tests.ok(not exists (select 1 from public.document_extractions where document_id = :'DOC'), 'documents v2 : suppression → texte lu, champs et résumés supprimés');
select tests.ok(not exists (select 1 from public.reminders where deep_link = '/documents/' || :'DOC'), 'documents v2 : suppression → rappels créés depuis le document supprimés');
