-- =====================================================================
-- Messagerie privée : suivi mutuel = conversation ouverte, sinon demande (3 messages, sans coordonnées),
-- acceptation / refus silencieux, blocage, lecture réservée aux deux participantes, aucune écriture directe,
-- notification sans texte, idempotence, signalement avec pièces réservées à la modération.
-- =====================================================================
\set M1 'd3d3d3d3-0000-4000-8000-000000000001'
\set M2 'd3d3d3d3-0000-4000-8000-000000000002'
\set M3 'd3d3d3d3-0000-4000-8000-000000000003'
\set M4 'd3d3d3d3-0000-4000-8000-000000000004'
\set MOD 'd3d3d3d3-0000-4000-8000-000000000009'
reset role;
insert into auth.users (id, email) values (:'M1', 'dm-un@exemple.test'), (:'M2', 'dm-deux@exemple.test'), (:'M3', 'dm-trois@exemple.test'),
  (:'M4', 'dm-quatre@exemple.test'), (:'MOD', 'dm-mod@exemple.test');
insert into public.user_roles (user_id, role) values (:'MOD', 'moderator');
create table tests.dm_ids (k text primary key, id uuid);
grant all on tests.dm_ids to authenticated;

set role authenticated; set request.jwt.claim.sub = :'M1';
insert into public.community_profiles (user_id, pseudonym, rules_accepted_at) values (auth.uid(), 'Dm Alice', now());
reset role; set role authenticated; set request.jwt.claim.sub = :'M2';
insert into public.community_profiles (user_id, pseudonym, rules_accepted_at) values (auth.uid(), 'Dm Bea', now());
reset role; set role authenticated; set request.jwt.claim.sub = :'M3';
insert into public.community_profiles (user_id, pseudonym, rules_accepted_at) values (auth.uid(), 'Dm Chloe', now());
select tests.throws($$select public.dm_open('dm_chloe')$$, 'ouvrir : pas de conversation avec soi-même');
select tests.throws($$select public.dm_open('personne_inconnue')$$, 'ouvrir : membre introuvable');
reset role; set role authenticated; set request.jwt.claim.sub = :'M4';
select tests.throws($$select public.dm_open('dm_alice')$$, 'ouvrir : profil communautaire exigé');
reset role;

-- ---------------------------------------------------------------- Suivi mutuel : conversation ouverte
set role authenticated; set request.jwt.claim.sub = :'M1';
select public.follow_member('dm_bea');
reset role; set role authenticated; set request.jwt.claim.sub = :'M2';
select public.follow_member('dm_alice');
insert into tests.dm_ids values ('ab', public.dm_open('dm_alice'));
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'ab')) ->> 'status') = 'open', 'suivi mutuel : conversation ouverte d''emblée');
select tests.ok(public.dm_open('@Dm_Alice') = (select id from tests.dm_ids where k = 'ab'), 'ouvrir deux fois : la même conversation');
select tests.ok(public.dm_inbox() = '[]'::jsonb, 'boîte : une conversation sans message n''apparaît pas');
select tests.ok((public.dm_send((select id from tests.dm_ids where k = 'ab'), '  Bonjour Alice !  ', 'aaaaaaaa-0000-4000-8000-000000000001') ->> 'body') = 'Bonjour Alice !', 'envoyer : texte nettoyé');
select tests.ok((public.dm_send((select id from tests.dm_ids where k = 'ab'), 'Bonjour Alice !', 'aaaaaaaa-0000-4000-8000-000000000001') ->> 'body') = 'Bonjour Alice !'
  and (select count(*) from public.dm_messages) = 1, 'envoyer : un nouvel essai avec le même identifiant ne double pas le message');
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ab'), '   ', 'aaaaaaaa-0000-4000-8000-000000000002')$$, 'envoyer : message vide refusé');
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ab'), repeat('x', 2001), 'aaaaaaaa-0000-4000-8000-000000000003')$$, 'envoyer : 2 000 caractères au plus');
select tests.throws($$insert into public.dm_messages (conversation_id, sender_id, body, client_id) values ((select id from tests.dm_ids where k = 'ab'), auth.uid(), 'direct', gen_random_uuid())$$, 'écriture directe d''un message : refusée');
select tests.throws($$update public.dm_messages set body = 'modifié'$$, 'modification directe d''un message : refusée');
select tests.throws($$delete from public.dm_messages$$, 'suppression directe d''un message : refusée');
select tests.throws($$update public.dm_participants set unread_count = 0$$, 'écriture directe des non-lus : refusée');
select tests.throws($$update public.dm_conversations set status = 'open'$$, 'écriture directe d''une conversation : refusée');
select tests.throws($$select requested_by from public.dm_conversations$$, 'conversation : « qui a demandé » non lisible directement');
reset role;

set role authenticated; set request.jwt.claim.sub = :'M1';
select tests.ok((public.dm_unread() ->> 'messages')::int = 1 and (public.dm_unread() ->> 'requests')::int = 0, 'non-lus : 1 message pour la destinataire');
select tests.ok(jsonb_array_length(public.dm_inbox()) = 1 and (public.dm_inbox() -> 0 ->> 'handle') = 'dm_bea' and (public.dm_inbox() -> 0 ->> 'last_body') = 'Bonjour Alice !'
  and (public.dm_inbox() -> 0 ->> 'last_mine') = 'false', 'boîte : conversation, interlocutrice et aperçu');
select tests.ok((select count(*) from public.notifications where user_id = auth.uid() and category = 'community_message' and body is null
  and title = 'Vous avez un nouveau message privé' and deep_link = '/community/messages/' || (select id from tests.dm_ids where k = 'ab')) = 1, 'notification : sans le texte du message');
select tests.ok(not exists (select 1 from public.notifications where category = 'community_message' and (coalesce(body, '') || title || payload::text) like '%Bonjour%'), 'notification : aucun contenu de message, nulle part');
select tests.ok(jsonb_array_length(public.dm_messages_list((select id from tests.dm_ids where k = 'ab'))) = 1
  and (public.dm_messages_list((select id from tests.dm_ids where k = 'ab')) -> 0 ->> 'mine') = 'false', 'messages : lus par la destinataire');
select public.dm_mark_read((select id from tests.dm_ids where k = 'ab'));
select tests.ok((public.dm_unread() ->> 'messages')::int = 0, 'marquer comme lu : compteur à zéro');
select public.dm_send((select id from tests.dm_ids where k = 'ab'), 'Bonjour Béa, ravie !', 'bbbbbbbb-0000-4000-8000-000000000001');
select public.dm_send((select id from tests.dm_ids where k = 'ab'), 'Mon numéro : 06 12 34 56 78', 'bbbbbbbb-0000-4000-8000-000000000002');
select tests.ok((select count(*) from public.dm_messages where conversation_id = (select id from tests.dm_ids where k = 'ab')) = 3, 'conversation ouverte : coordonnées permises entre personnes qui se suivent');
reset role;
select tests.ok((select count(*) from public.notifications where user_id = :'M2' and category = 'community_message') = 1, 'notification : une seule par série de messages non lus');

-- ---------------------------------------------------------------- Étrangère : rien de lisible
set role authenticated; set request.jwt.claim.sub = :'M3';
select tests.ok((select count(*) from public.dm_messages) = 0 and (select count(*) from public.dm_conversations) = 0 and (select count(*) from public.dm_participants) = 0, 'RLS : une tierce personne ne lit ni conversation ni message');
select tests.ok(public.dm_messages_list((select id from tests.dm_ids where k = 'ab')) = '[]'::jsonb and public.dm_conversation((select id from tests.dm_ids where k = 'ab')) is null, 'fonctions de lecture : rien pour une tierce personne');
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ab'), 'intrusion', 'cccccccc-0000-4000-8000-000000000001')$$, 'envoyer dans la conversation d''autrui : refusé');
select tests.throws($$select public.dm_respond((select id from tests.dm_ids where k = 'ab'), true)$$, 'répondre à la demande d''autrui : refusé');
select tests.throws($$select public.dm_report((select id from tests.dm_ids where k = 'ab'), 'harassment')$$, 'signaler la conversation d''autrui : refusé');
select tests.ok((select count(*) from public.dm_report_evidence) = 0, 'pièces de signalement : invisibles pour un membre');

-- ---------------------------------------------------------------- Sans suivi mutuel : demande de message
insert into tests.dm_ids values ('ca', public.dm_open('dm_alice'));
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'ca')) ->> 'status') = 'request_sent', 'sans suivi mutuel : demande de message');
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ca'), 'Écris-moi sur chloe@exemple.fr', 'cccccccc-0000-4000-8000-000000000002')$$, 'demande : coordonnées refusées');
select public.dm_send((select id from tests.dm_ids where k = 'ca'), 'Bonjour, nous avons des jumeaux du même âge.', 'cccccccc-0000-4000-8000-000000000003');
select public.dm_send((select id from tests.dm_ids where k = 'ca'), 'Deuxième message', 'cccccccc-0000-4000-8000-000000000004');
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'ca')) ->> 'request_left')::int = 1, 'demande : messages restants annoncés');
select public.dm_send((select id from tests.dm_ids where k = 'ca'), 'Troisième message', 'cccccccc-0000-4000-8000-000000000005');
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ca'), 'Quatrième message', 'cccccccc-0000-4000-8000-000000000006')$$, 'demande : 3 messages au plus avant acceptation');
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'ca')) ->> 'can_send') = 'false', 'demande : envoi fermé une fois la limite atteinte');
select tests.throws($$select public.dm_respond((select id from tests.dm_ids where k = 'ca'), true)$$, 'demande : la demandeuse ne peut pas l''accepter elle-même');
reset role;

set role authenticated; set request.jwt.claim.sub = :'M1';
select tests.ok((public.dm_unread() ->> 'requests')::int = 1 and (public.dm_unread() ->> 'messages')::int = 0, 'demande reçue : comptée à part des messages');
select tests.ok((select count(*) from public.notifications where user_id = auth.uid() and title = 'Vous avez une demande de message' and body is null) = 1, 'demande : une notification, sans texte');
select tests.ok((select count(*) from jsonb_array_elements(public.dm_inbox()) e where e ->> 'status' = 'request_received') = 1, 'boîte : demande reçue');
select public.dm_respond((select id from tests.dm_ids where k = 'ca'), false);
select tests.ok((select count(*) from jsonb_array_elements(public.dm_inbox()) e where e ->> 'handle' = 'dm_chloe') = 0, 'refus : la demande disparaît de ma boîte');
select tests.ok(public.dm_messages_list((select id from tests.dm_ids where k = 'ca')) = '[]'::jsonb, 'refus : ses messages ne me sont plus présentés');
reset role;

set role authenticated; set request.jwt.claim.sub = :'M3';
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'ca')) ->> 'status') = 'request_sent', 'refus : jamais annoncé à la demandeuse');
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ca'), 'Vous êtes là ?', 'cccccccc-0000-4000-8000-000000000007')$$, 'refus : la demandeuse ne peut plus écrire');
reset role;

-- Celle qui a refusé peut rouvrir en écrivant elle-même
set role authenticated; set request.jwt.claim.sub = :'M1';
select public.dm_open('dm_chloe');
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'ca')) ->> 'status') = 'open', 'refus : la destinataire peut rouvrir la conversation');
reset role;

-- Accepter une demande
set role authenticated; set request.jwt.claim.sub = :'M3';
insert into tests.dm_ids values ('cb', public.dm_open('dm_bea'));
select public.dm_send((select id from tests.dm_ids where k = 'cb'), 'Bonjour Béa', 'cccccccc-0000-4000-8000-000000000010');
reset role; set role authenticated; set request.jwt.claim.sub = :'M2';
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'cb')) ->> 'status') = 'request_received', 'demande reçue par Béa');
select public.dm_respond((select id from tests.dm_ids where k = 'cb'), true);
select tests.ok((public.dm_conversation((select id from tests.dm_ids where k = 'cb')) ->> 'status') = 'open', 'accepter : conversation ouverte');
select public.dm_send((select id from tests.dm_ids where k = 'cb'), 'Bonjour Chloé', 'bbbbbbbb-0000-4000-8000-000000000010');

select tests.ok((public.export_my_data() -> 'private_messages' -> 'messages_sent') @> '[{"body": "Bonjour Chloé"}]'::jsonb
  and not (public.export_my_data() -> 'private_messages')::text like '%Bonjour Béa%'
  and jsonb_array_length(public.export_my_data() -> 'private_messages' -> 'conversations') = 2, 'export RGPD : mes conversations et mes messages envoyés, pas ceux des autres');

-- ---------------------------------------------------------------- Signaler, puis bloquer
select public.dm_report((select id from tests.dm_ids where k = 'cb'), 'harassment', 'Messages insistants');
select tests.throws($$select public.dm_report((select id from tests.dm_ids where k = 'cb'), 'spam')$$, 'signaler : une seule fois tant que le signalement est ouvert');
select public.block_member('dm_chloe');
select tests.ok((select count(*) from jsonb_array_elements(public.dm_inbox()) e where e ->> 'handle' = 'dm_chloe') = 0, 'blocage : la conversation disparaît de ma boîte');
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'cb'), 'encore', 'bbbbbbbb-0000-4000-8000-000000000011')$$, 'blocage : je ne peux plus lui écrire');
reset role;
set role authenticated; set request.jwt.claim.sub = :'M3';
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'cb'), 'pourquoi ?', 'cccccccc-0000-4000-8000-000000000011')$$, 'blocage : elle ne peut plus m''écrire');
select tests.throws($$select public.dm_open('dm_bea')$$, 'blocage : impossible d''ouvrir une conversation');
select tests.ok((select count(*) from jsonb_array_elements(public.dm_inbox()) e where e ->> 'handle' = 'dm_bea') = 0 and public.dm_messages_list((select id from tests.dm_ids where k = 'cb')) = '[]'::jsonb,
  'blocage : la conversation disparaît aussi chez la personne bloquée');
reset role;

set role authenticated; set request.jwt.claim.sub = :'MOD';
select tests.ok((select count(*) from public.dm_report_evidence e join public.reports r on r.id = e.report_id where r.reported_user = :'M3' and r.reason = 'harassment'
  and jsonb_array_length(e.messages) = 1 and (e.messages -> 0 ->> 'body') = 'Bonjour Béa') = 1, 'signalement : la modération voit les messages de la personne signalée, pas ceux de la plaignante');
select tests.ok((select count(*) from public.dm_messages) = 0, 'modération : aucun accès général aux messages privés');
reset role;

-- ---------------------------------------------------------------- Suspension, débit, temps réel, suppression de compte
update public.community_profiles set suspended_until = now() + interval '2 days' where user_id = :'M2';
set role authenticated; set request.jwt.claim.sub = :'M2';
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ab'), 'suspendue', 'bbbbbbbb-0000-4000-8000-000000000020')$$, 'suspension : pas de message privé');
reset role;
update public.community_profiles set suspended_until = null where user_id = :'M2';
insert into public.dm_messages (conversation_id, sender_id, body, client_id)
  select (select id from tests.dm_ids where k = 'ab'), :'M2', 'rafale ' || g, gen_random_uuid() from generate_series(1, 20) g;
set role authenticated; set request.jwt.claim.sub = :'M2';
select tests.throws($$select public.dm_send((select id from tests.dm_ids where k = 'ab'), 'un de trop', 'bbbbbbbb-0000-4000-8000-000000000021')$$, 'débit : 20 messages par minute au plus');
reset role;
select tests.ok((select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'dm_participants') = 1
  and (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'dm_messages') = 0, 'temps réel : seule la ligne participante est publiée, pas le texte des messages');
delete from auth.users where id = :'M2';
select tests.ok((select count(*) from public.dm_conversations where :'M2' in (user_a, user_b)) = 0 and (select count(*) from public.dm_messages where sender_id = :'M2') = 0,
  'suppression de compte : conversations et messages effacés');
drop table tests.dm_ids;
