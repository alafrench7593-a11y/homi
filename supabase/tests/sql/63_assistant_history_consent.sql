-- Assistant IA : historique conservé seulement avec l'accord explicite (et daté) de la personne.
\set HA 'b0e63000-0000-4000-8000-000000000001'
\set HB 'b0e63000-0000-4000-8000-000000000002'
reset role;
insert into auth.users (id, email) values (:'HA', 'histo-a@exemple.test'), (:'HB', 'histo-b@exemple.test');
insert into public.privacy_settings (user_id) values (:'HA'), (:'HB') on conflict do nothing;
select tests.ok((select ai_history_enabled is false and ai_history_consented_at is null from public.privacy_settings where user_id = :'HA'), 'nouveau compte : historique de l''assistant désactivé par défaut');
update public.privacy_settings set ai_history_enabled = true where user_id = :'HB';
select tests.ok((select ai_history_consented_at is null from public.privacy_settings where user_id = :'HB'), 'activation hors de la personne : pas d''accord enregistré');
set role authenticated; set request.jwt.claim.sub = :'HA';
update public.privacy_settings set ai_history_enabled = true where user_id = :'HA';
select tests.ok((select ai_history_consented_at is not null from public.privacy_settings where user_id = :'HA'), 'la personne active l''historique : accord daté');
update public.privacy_settings set ai_history_enabled = false where user_id = :'HA';
select tests.ok((select ai_history_consented_at is null from public.privacy_settings where user_id = :'HA'), 'désactivation : accord retiré');
update public.privacy_settings set ai_history_consented_at = now() where user_id = :'HA';
select tests.ok((select ai_history_consented_at is null or ai_history_enabled is false from public.privacy_settings where user_id = :'HA'), 'un accord ne peut pas être inventé sans activer l''historique');
reset role;
