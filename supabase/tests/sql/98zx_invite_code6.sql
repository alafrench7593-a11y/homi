-- =====================================================================
-- Invitation du coparent par code à 6 chiffres (20261216000100_invitation_code6.sql)
-- =====================================================================
\set P6A 'e6e6e6e6-0001-4e6e-8e6e-e6e6e6e6e6e6'
\set P6B 'e6e6e6e6-0002-4e6e-8e6e-e6e6e6e6e6e6'
\set P6C 'e6e6e6e6-0003-4e6e-8e6e-e6e6e6e6e6e6'
reset role; set request.jwt.claim.sub = '';
insert into auth.users (id, email) values (:'P6A', 'p6a@exemple.test'), (:'P6B', 'p6b@exemple.test'), (:'P6C', 'p6c@exemple.test');
update public.profiles set display_name = 'Jade Martin' where id = :'P6A';
select tests.set_premium(:'P6A', true);

set role authenticated; set request.jwt.claim.sub = :'P6A';
create temp table c6_ctx as select public.create_household('Foyer Jade') as hid;
create temp table c6_inv as select public.create_household_invite_code((select hid from c6_ctx)) as j;
select tests.ok((select j ->> 'code' from c6_inv) ~ '^[0-9]{6}$', 'code 6 : six chiffres');
select tests.ok((select (j ->> 'expires_at')::timestamptz from c6_inv) between now() + interval '47 hours' and now() + interval '49 hours', 'code 6 : valable 48 h');
-- renouveler : l'ancien code ne marche plus
create temp table c6_old as select j ->> 'code' as code from c6_inv;
delete from c6_inv; insert into c6_inv select public.create_household_invite_code((select hid from c6_ctx));
select tests.ok((select count(*) from public.household_invitations where household_id = (select hid from c6_ctx) and short_code and revoked_at is null) = 1, 'code 6 : un seul code actif par foyer');
grant select on c6_ctx, c6_inv, c6_old to anon, authenticated;
reset role;

-- Avant inscription (anonyme) : aperçu minimal
set role anon; set request.jwt.claim.sub = '';
select tests.ok(public.preview_invite_code((select j ->> 'code' from c6_inv)) ->> 'inviter' = 'Jade', 'code 6 : aperçu = prénom de la personne qui invite');
select tests.ok((select count(*) from jsonb_object_keys(public.preview_invite_code((select j ->> 'code' from c6_inv)))) = 3, 'code 6 : aperçu sans autre donnée');
select tests.ok(public.preview_invite_code((select code from c6_old)) is null or (select code from c6_old) = (select j ->> 'code' from c6_inv), 'code 6 : ancien code annulé');
reset role;

-- Le coparent rejoint avec le code
set role authenticated; set request.jwt.claim.sub = :'P6B';
select tests.ok(public.accept_household_invitation('c6:' || (select j ->> 'code' from c6_inv)) = (select hid from c6_ctx), 'code 6 : acceptation');
select tests.ok(public.accept_household_invitation('c6:' || (select j ->> 'code' from c6_inv)) is null, 'code 6 : usage unique');
reset role;
select tests.ok(exists (select 1 from public.notifications where user_id = :'P6A' and payload ->> 'kind' = 'invite_accepted'), 'code 6 : parent principal prévenu');
select tests.ok(exists (select 1 from public.household_members where household_id = (select hid from c6_ctx) and user_id = :'P6B' and role = 'coparent'), 'code 6 : coparent membre');

-- Code expiré
set role authenticated; set request.jwt.claim.sub = :'P6A';
delete from c6_inv; insert into c6_inv select public.create_household_invite_code((select hid from c6_ctx));
reset role;
update public.household_invitations set expires_at = now() - interval '1 minute' where household_id = (select hid from c6_ctx) and short_code and revoked_at is null and accepted_at is null;
set role authenticated; set request.jwt.claim.sub = :'P6C';
select tests.ok(public.accept_household_invitation('c6:' || (select j ->> 'code' from c6_inv)) is null, 'code 6 : expiré refusé');

-- Force brute : au 11e échec en une heure, tout est refusé (même un bon code)
do $$ begin for i in 1..9 loop perform public.accept_household_invitation('c6:' || lpad(i::text, 6, '9')); end loop; end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = :'P6A';
delete from c6_inv; insert into c6_inv select public.create_household_invite_code((select hid from c6_ctx));
reset role;
set role authenticated; set request.jwt.claim.sub = :'P6C';
select tests.throws($$select public.accept_household_invitation('c6:' || (select j ->> 'code' from c6_inv))$$, 'code 6 : bloqué après 10 échecs');
select tests.ok(not exists (select 1 from public.household_members where user_id = :'P6C' and household_id = (select hid from c6_ctx)), 'code 6 : aucune association pendant le blocage');
select tests.ok(tests.count('select * from public.invite_code_attempts') = 0, 'code 6 : registre des essais invisible');
reset role; set request.jwt.claim.sub = '';
