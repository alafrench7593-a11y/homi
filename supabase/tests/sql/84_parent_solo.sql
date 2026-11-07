-- Profil maman solo (07/11/2026) : situation familiale, cercle d'aide privé, relais « je décroche » vers le cercle.
\set SA 'f9e00000-0000-4000-8000-000000000001'
\set SB 'f9e00000-0000-4000-8000-000000000002'
\set SH 'f9e00000-0000-4000-8000-0000000000f1'
reset role;
insert into auth.users (id, email) values (:'SA', 'solo-a@exemple.test'), (:'SB', 'solo-b@exemple.test');
insert into public.households (id, name, created_by) values (:'SH', 'Foyer solo', :'SA');
insert into public.household_members (household_id, user_id, role) values (:'SH', :'SA', 'owner') on conflict (household_id, user_id) do update set role = 'owner';
insert into public.household_members (household_id, user_id, role) values (:'SH', :'SB', 'caregiver') on conflict do nothing;

set role authenticated; set request.jwt.claim.sub = :'SA';
update public.profiles set family_situation = 'solo' where id = :'SA';
select tests.ok((select family_situation from public.profiles where id = 'f9e00000-0000-4000-8000-000000000001') = 'solo', 'solo : situation familiale enregistrée');
select tests.throws($$update public.profiles set family_situation = 'autre' where id = 'f9e00000-0000-4000-8000-000000000001'$$, 'solo : situation familiale bornée');
insert into public.support_circle (id, name, phone, relation, helps) values ('f9e00000-0000-4000-8000-0000000000c1', 'Mamie Jo', '06 00 00 00 00', 'Ma mère', '{nights,pickup}');
select tests.throws($$insert into public.support_circle (name, helps) values ('Amie', '{teleportation}')$$, 'solo : types d''aide bornés');
select tests.throws($$insert into public.support_circle (name, phone) values ('Amie', 'appelle-moi')$$, 'solo : numéro de téléphone valide');
insert into public.offduty_periods (household_id, ends_at, relay_contact_id) values (:'SH', now() + interval '2 hours', 'f9e00000-0000-4000-8000-0000000000c1');
select tests.ok((select count(*) from public.offduty_periods where relay_contact_id is not null) = 1, 'solo : je décroche avec une personne du cercle');

set request.jwt.claim.sub = :'SB';
select tests.ok((select count(*) from public.support_circle) = 0, 'solo : le cercle d''aide n''est jamais visible du foyer');
insert into public.support_circle (id, name) values ('f9e00000-0000-4000-8000-0000000000c2', 'Voisin');
select tests.throws($$insert into public.offduty_periods (household_id, ends_at, relay_contact_id) values ('f9e00000-0000-4000-8000-0000000000f1', now() + interval '1 hour', 'f9e00000-0000-4000-8000-0000000000c1')$$, 'solo : impossible d''utiliser le contact d''une autre personne');

set request.jwt.claim.sub = :'SA';
select tests.ok(jsonb_array_length(public.export_my_data()->'support_circle') = 1 and public.export_my_data() ? 'family_papers', 'solo : export RGPD complet (cercle + exports précédents)');
reset role;
