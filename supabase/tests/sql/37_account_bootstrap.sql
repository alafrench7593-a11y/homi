-- =====================================================================
-- Inscription : création atomique profil + foyer, rattrapage au login,
-- consentements d'inscription, reprise de l'onboarding, nettoyage du
-- foyer automatique vide lorsqu'on rejoint un autre foyer.
-- Identités propres à ce fichier : Anaïs, Bastien, Chloé, Diane, Élise.
-- =====================================================================
\set ANAIS   'b8b8b8b8-0000-4000-8000-000000000001'
\set BASTIEN 'b8b8b8b8-0000-4000-8000-000000000002'
\set CHLOE   'b8b8b8b8-0000-4000-8000-000000000003'
\set DIANE   'b8b8b8b8-0000-4000-8000-000000000004'
\set ELISE   'b8b8b8b8-0000-4000-8000-000000000005'

insert into auth.users (id, email) values
 (:'ANAIS', 'bootstrap-anais@exemple.test'), (:'BASTIEN', 'bootstrap-bastien@exemple.test'),
 (:'CHLOE', 'bootstrap-chloe@exemple.test'), (:'DIANE', 'bootstrap-diane@exemple.test');

-- ---------------------------------------------------------------- Inscription atomique
select tests.ok((select count(*) from public.profiles where id = :'ANAIS') = 1, 'inscription : profil créé par le trigger');
select tests.ok((select count(*) from public.privacy_settings where user_id = :'ANAIS') = 1, 'inscription : paramètres de confidentialité créés par le trigger');
select tests.ok((select count(*) from public.households where created_by = :'ANAIS') = 1, 'inscription : exactement un foyer créé');
select tests.ok((select name = 'Ma famille' and auto_created from public.households where created_by = :'ANAIS'), 'inscription : foyer « Ma famille » marqué auto_created');
select tests.ok((select count(*) from public.household_members m join public.households h on h.id = m.household_id
                  where h.created_by = :'ANAIS') = 1, 'inscription : une seule adhésion (pas de doublon avec on_household_created)');
select tests.ok((select role = 'owner' and 'health' = any(can_edit) from public.household_members m join public.households h on h.id = m.household_id
                  where h.created_by = :'ANAIS' and m.user_id = :'ANAIS'), 'inscription : l''utilisateur est propriétaire avec tous les droits');
select tests.ok((select count(*) from auth.users u where u.email like 'bootstrap-%'
                  and not exists (select 1 from public.household_members m where m.user_id = u.id)) = 0,
  'inscription : aucun compte sans foyer');
select tests.ok((select count(*) from public.households where not auto_created and created_by = :'ANAIS') = 0, 'foyer : auto_created vaut false par défaut');

-- Atomicité : si la transaction d'inscription échoue, rien ne subsiste
do $$
begin
  begin
    insert into auth.users (id, email) values ('b8b8b8b8-0000-4000-8000-000000000005', 'bootstrap-elise@exemple.test');
    raise exception 'échec simulé après inscription';
  exception when others then null;
  end;
end $$;
select tests.ok((select count(*) from public.profiles where id = :'ELISE') = 0
            and (select count(*) from public.households where created_by = :'ELISE') = 0,
  'inscription : profil et foyer annulés avec la transaction (atomicité)');

create temp table bs_ctx as
  select (select id from public.households where created_by = :'ANAIS') as anais_hid,
         (select id from public.households where created_by = :'BASTIEN') as bastien_hid,
         (select id from public.households where created_by = :'CHLOE') as chloe_hid;
grant select on bs_ctx to authenticated;

-- ---------------------------------------------------------------- Accès anonyme / non connecté
set role anon;
select tests.throws($$select public.ensure_my_account()$$, 'rattrapage : anonyme ne peut pas appeler ensure_my_account');
select tests.throws($$select public.record_signup_consents('2026-10', '2026-10', true)$$, 'consentements : anonyme ne peut pas appeler record_signup_consents');
reset role;
set role authenticated; set request.jwt.claim.sub = '';
select tests.throws($$select public.ensure_my_account()$$, 'rattrapage : refusé sans utilisateur connecté (42501)');
reset role;

-- ---------------------------------------------------------------- Rattrapage au login
-- Diane : profil, confidentialité et foyer perdus (inscription antérieure, incident…)
delete from public.households where created_by = :'DIANE';
delete from public.privacy_settings where user_id = :'DIANE';
delete from public.profiles where id = :'DIANE';
set role authenticated; set request.jwt.claim.sub = :'DIANE';
create temp table bs_repair as select public.ensure_my_account() as r;
select tests.ok((select (r ->> 'profile_created')::boolean from bs_repair), 'rattrapage : profil recréé');
select tests.ok((select (r ->> 'household_created')::boolean from bs_repair), 'rattrapage : foyer recréé');
select tests.ok(tests.count('select * from public.profiles where id = auth.uid()') = 1, 'rattrapage : profil lisible ensuite');
select tests.ok(tests.count('select * from public.privacy_settings where user_id = auth.uid()') = 1, 'rattrapage : paramètres de confidentialité recréés');
select tests.ok(tests.count('select * from public.households h, bs_repair where h.id = (r ->> ''household_id'')::uuid and h.auto_created') = 1, 'rattrapage : foyer renvoyé, marqué auto_created');
select tests.ok(tests.count('select * from public.household_members m, bs_repair where m.household_id = (r ->> ''household_id'')::uuid and m.user_id = auth.uid() and m.role = ''owner''') = 1, 'rattrapage : adhésion propriétaire créée');
create temp table bs_repair2 as select public.ensure_my_account() as r;
select tests.ok((select not (r ->> 'profile_created')::boolean and not (r ->> 'household_created')::boolean from bs_repair2), 'rattrapage : idempotent (second appel ne crée rien)');
select tests.ok((select a.r -> 'household_id' = b.r -> 'household_id' from bs_repair a, bs_repair2 b), 'rattrapage : même foyer renvoyé au second appel');
select tests.ok(tests.count('select * from public.household_members where user_id = auth.uid()') = 1, 'rattrapage : toujours un seul foyer');
reset role;
set role authenticated; set request.jwt.claim.sub = :'ANAIS';
select tests.ok((select r ->> 'household_id' = (select anais_hid::text from bs_ctx) and not (r ->> 'household_created')::boolean
                   from (select public.ensure_my_account() as r) q), 'rattrapage : compte complet inchangé');
reset role;

-- ---------------------------------------------------------------- Consentements d'inscription
set role authenticated; set request.jwt.claim.sub = :'ANAIS';
select tests.throws($$select public.record_signup_consents('2026-10', '2026-10', false)$$, 'consentements : refus si moins de 18 ans');
select tests.throws($$select public.record_signup_consents('2026-10', '2026-10', null)$$, 'consentements : refus si majorité non confirmée');
select tests.ok(tests.count('select * from public.consents') = 0, 'consentements : rien enregistré après un refus');
create temp table bs_consent as select public.record_signup_consents('cgu-2026-10', 'pc-2026-10', true) as at;
select tests.ok(tests.count('select * from public.consents where granted') = 3, 'consentements : 3 lignes enregistrées');
select tests.ok(tests.count('select * from public.consents c, bs_consent b where c.created_at = b.at') = 3, 'consentements : horodatage renvoyé identique aux lignes');
select tests.ok(tests.count($$select * from public.consents where (purpose, version) in (('terms','cgu-2026-10'), ('privacy_policy','pc-2026-10'), ('adult_confirmation','cgu-2026-10'))$$) = 3,
  'consentements : finalités et versions correctes');
select public.record_signup_consents('cgu-2026-10', 'pc-2026-10', true);
select tests.ok(tests.count('select * from public.consents') = 6, 'consentements : second appel sans erreur');
insert into public.consents (user_id, purpose, granted) values (auth.uid(), 'privacy_policy', true);
select tests.throws($$insert into public.consents (user_id, purpose, granted) values (auth.uid(), 'inconnu', true)$$, 'consentements : finalité inconnue refusée');
reset role;
set role authenticated; set request.jwt.claim.sub = :'BASTIEN';
select tests.ok(tests.count('select * from public.consents') = 0, 'consentements : Bastien ne voit pas ceux d''Anaïs');
reset role;

-- ---------------------------------------------------------------- Reprise de l'onboarding
set role authenticated; set request.jwt.claim.sub = :'ANAIS';
update public.profiles set onboarding_state = '{"step":"journeys","answers":{"journeys":["pregnant"]}}' where id = auth.uid();
select tests.ok((select onboarding_state ->> 'step' from public.profiles where id = auth.uid()) = 'journeys', 'onboarding : état de reprise enregistré et relu');
select tests.throws($$update public.profiles set onboarding_state = jsonb_build_object('x', (select string_agg(md5(i::text), '') from generate_series(1, 1000) i)) where id = auth.uid()$$,
  'onboarding : état trop volumineux refusé');
reset role;

-- ---------------------------------------------------------------- Isolation (RLS)
set role authenticated; set request.jwt.claim.sub = :'BASTIEN';
select tests.ok(tests.count($$select * from public.profiles where id = 'b8b8b8b8-0000-4000-8000-000000000001'$$) = 0, 'isolation : Bastien ne lit pas le profil d''Anaïs');
select tests.ok(tests.count($$select onboarding_state from public.profiles where onboarding_state is not null$$) = 0, 'isolation : Bastien ne lit pas l''état d''onboarding d''Anaïs');
update public.profiles set onboarding_state = '{"step":"pirate"}', display_name = 'Pirate' where id = :'ANAIS';
select tests.ok(tests.count('select * from public.households h, bs_ctx c where h.id = c.anais_hid') = 0, 'isolation : Bastien ne voit pas le foyer d''Anaïs');
select tests.ok(tests.count('select * from public.household_members m, bs_ctx c where m.household_id = c.anais_hid') = 0, 'isolation : Bastien ne voit pas les membres du foyer d''Anaïs');
select tests.throws($$insert into public.household_members (household_id, user_id, role) select anais_hid, auth.uid(), 'coparent' from bs_ctx$$,
  'isolation : Bastien ne peut pas s''ajouter au foyer d''Anaïs');
select tests.throws($$insert into public.household_members (household_id, user_id, role) select anais_hid, auth.uid(), 'owner' from bs_ctx$$,
  'isolation : Bastien ne peut pas se déclarer propriétaire du foyer d''Anaïs');
update public.households set name = 'Piraté' where id = (select anais_hid from bs_ctx);
delete from public.households where id = (select anais_hid from bs_ctx);
reset role;
select tests.ok((select onboarding_state ->> 'step' = 'journeys' and display_name is null from public.profiles where id = :'ANAIS'), 'isolation : Bastien ne peut pas modifier le profil d''Anaïs');
select tests.ok((select name from public.households where id = (select anais_hid from bs_ctx)) = 'Ma famille', 'isolation : Bastien ne peut ni renommer ni supprimer le foyer d''Anaïs');
select tests.ok((select count(*) from public.household_members where household_id = (select anais_hid from bs_ctx)) = 1, 'isolation : aucune adhésion ajoutée au foyer d''Anaïs');

-- ---------------------------------------------------------------- Invitation et foyer automatique
-- 1) Bastien (foyer automatique vide) rejoint le foyer d'Anaïs → son foyer vide disparaît
set role authenticated; set request.jwt.claim.sub = :'ANAIS';
create temp table bs_inv_b as select public.create_household_invitation((select anais_hid from bs_ctx)) as token;
grant select on bs_inv_b to authenticated;
reset role;
set role authenticated; set request.jwt.claim.sub = :'BASTIEN';
select tests.ok(public.accept_household_invitation((select token from bs_inv_b)) = (select anais_hid from bs_ctx), 'invitation : Bastien rejoint le foyer d''Anaïs');
select tests.ok(tests.count('select * from public.household_members where user_id = auth.uid()') = 1, 'invitation : Bastien n''est plus membre que du foyer d''Anaïs');
select tests.ok((select r ->> 'household_id' = (select anais_hid::text from bs_ctx) and not (r ->> 'household_created')::boolean
                   from (select public.ensure_my_account() as r) q), 'rattrapage : le foyer partagé suffit (aucun foyer recréé)');
reset role;
select tests.ok((select count(*) from public.households where id = (select bastien_hid from bs_ctx)) = 0, 'invitation : foyer automatique vide de Bastien supprimé');

-- 2) Chloé a déjà ajouté un enfant dans son foyer automatique → foyer conservé
set role authenticated; set request.jwt.claim.sub = :'CHLOE';
insert into public.children (household_id, first_name, birth_date) select chloe_hid, 'Jade', current_date - 60 from bs_ctx;
reset role;
set role authenticated; set request.jwt.claim.sub = :'DIANE';
create temp table bs_inv_c as select public.create_household_invitation((select (r ->> 'household_id')::uuid from bs_repair)) as token;
grant select on bs_inv_c to authenticated;
reset role;
set role authenticated; set request.jwt.claim.sub = :'CHLOE';
select tests.ok(public.accept_household_invitation((select token from bs_inv_c)) = (select (r ->> 'household_id')::uuid from bs_repair), 'invitation : Chloé rejoint le foyer de Diane');
select tests.ok(tests.count('select * from public.household_members where user_id = auth.uid()') = 2, 'invitation : Chloé reste membre de ses deux foyers');
reset role;
select tests.ok((select count(*) from public.households where id = (select chloe_hid from bs_ctx)) = 1, 'invitation : foyer automatique avec un enfant conservé');
select tests.ok((select count(*) from public.children where household_id = (select chloe_hid from bs_ctx)) = 1, 'invitation : l''enfant de Chloé est intact');

-- 3) Diane (foyer automatique sans donnée mais avec Chloé comme membre) rejoint Anaïs → foyer conservé
set role authenticated; set request.jwt.claim.sub = :'ANAIS';
create temp table bs_inv_d as select public.create_household_invitation((select anais_hid from bs_ctx)) as token;
grant select on bs_inv_d to authenticated;
reset role;
set role authenticated; set request.jwt.claim.sub = :'DIANE';
select tests.ok(public.accept_household_invitation((select token from bs_inv_d)) = (select anais_hid from bs_ctx), 'invitation : Diane rejoint le foyer d''Anaïs');
reset role;
select tests.ok((select count(*) from public.households where id = (select (r ->> 'household_id')::uuid from bs_repair)) = 1, 'invitation : foyer automatique partagé avec un autre membre conservé');
