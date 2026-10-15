-- =====================================================================
-- Assistant IA : conversations privées, retours « Utile / Pas utile »,
-- favoris, consentement au contexte, quota (exécuté après 20_*.sql :
-- Camille a été supprimée, Alex et Zoé existent)
-- =====================================================================
\set ALEX    '22222222-2222-4222-8222-222222222222'
\set ZOE     '33333333-3333-4333-8333-333333333333'
\set CONV_Z  'd1d1d1d1-0000-4000-8000-000000000001'
\set CONV_A  'd1d1d1d1-0000-4000-8000-000000000002'
\set Q_Z     'e1e1e1e1-0000-4000-8000-000000000001'
\set R_Z     'e1e1e1e1-0000-4000-8000-000000000002'
\set R_A     'e1e1e1e1-0000-4000-8000-000000000003'

-- ---------------------------------------------------------------- Données (serveur)
set role service_role;
insert into public.assistant_conversations (id, user_id, title) values
  (:'CONV_Z', :'ZOE', 'Sommeil de bébé'),
  (:'CONV_A', :'ALEX', 'Diversification');
insert into public.assistant_messages (id, conversation_id, user_id, role, content) values
  (:'Q_Z', :'CONV_Z', :'ZOE', 'user', 'Comment organiser les siestes ?');
insert into public.assistant_messages (id, conversation_id, user_id, role, content, structured, safety_level) values
  (:'R_Z', :'CONV_Z', :'ZOE', 'assistant', 'Réponse structurée', '{"short":"…","sources":[]}', 'none'),
  (:'R_A', :'CONV_A', :'ALEX', 'assistant', 'Réponse pour Alex', null, 'none');
select tests.throws($$insert into public.assistant_messages (conversation_id, user_id, role, content, safety_level) values ('d1d1d1d1-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'assistant', 'x', 'grave')$$,
  'assistant : niveau de sécurité limité aux valeurs prévues');
reset role;

-- ---------------------------------------------------------------- Zoé
set role authenticated; set request.jwt.claim.sub = :'ZOE';
select tests.ok(tests.count('select * from public.assistant_conversations') = 1, 'assistant : Zoé ne voit que ses conversations');
select tests.ok(tests.count('select * from public.assistant_messages') = 2, 'assistant : Zoé ne voit que ses messages');
select tests.ok(tests.count($$select * from public.assistant_messages where conversation_id = 'd1d1d1d1-0000-4000-8000-000000000002'$$) = 0,
  'assistant : la conversation d''Alex est invisible pour Zoé');

-- Consentement au contexte, mémorisé par conversation
update public.assistant_conversations set context_enabled = true where id = :'CONV_Z';
select tests.ok((select context_enabled from public.assistant_conversations where id = :'CONV_Z'), 'contexte : choix mémorisé sur la conversation');
update public.assistant_conversations set context_enabled = true, title = 'piratage' where id = :'CONV_A';
reset role;
select tests.ok((select not context_enabled and title = 'Diversification' from public.assistant_conversations where id = :'CONV_A'),
  'contexte : impossible de modifier la conversation d''une autre personne');

set role authenticated; set request.jwt.claim.sub = :'ZOE';
-- Retours « Utile / Pas utile »
insert into public.assistant_feedback (message_id, value) values (:'R_Z', 1);
select tests.ok(tests.count('select * from public.assistant_feedback') = 1, 'retour : enregistré sur sa propre réponse');
select tests.ok((select feedback from public.assistant_messages where id = :'R_Z') = 1, 'retour : recopié sur le message');
insert into public.assistant_feedback (user_id, message_id, value) values (:'ZOE', :'R_Z', -1)
  on conflict (user_id, message_id) do update set value = excluded.value;
select tests.ok((select value from public.assistant_feedback where message_id = :'R_Z') = -1, 'retour : modifiable (un seul par réponse)');
select tests.ok((select feedback from public.assistant_messages where id = :'R_Z') = -1, 'retour : modification recopiée sur le message');
select tests.throws($$insert into public.assistant_feedback (message_id, value) values ('e1e1e1e1-0000-4000-8000-000000000001', 1)$$,
  'retour : impossible sur une question (seulement les réponses de l''assistant)');
select tests.throws($$insert into public.assistant_feedback (message_id, value) values ('e1e1e1e1-0000-4000-8000-000000000003', 1)$$,
  'retour : impossible sur la réponse d''une autre personne');
select tests.throws($$insert into public.assistant_feedback (user_id, message_id, value) values ('22222222-2222-4222-8222-222222222222', 'e1e1e1e1-0000-4000-8000-000000000002', 1)$$,
  'retour : impossible au nom d''une autre personne');
select tests.throws($$insert into public.assistant_feedback (message_id, value) values ('e1e1e1e1-0000-4000-8000-000000000002', 5)$$,
  'retour : valeur limitée à -1 ou 1');
select tests.throws($$update public.assistant_feedback set message_id = 'e1e1e1e1-0000-4000-8000-000000000003'$$,
  'retour : impossible de le déplacer vers la réponse d''une autre personne');

-- Favoris et intégrité des réponses
update public.assistant_messages set saved = true where id = :'R_Z';
select tests.ok((select saved from public.assistant_messages where id = :'R_Z'), 'favori : réponse enregistrée');
select tests.throws($$update public.assistant_messages set content = 'réponse modifiée' where id = 'e1e1e1e1-0000-4000-8000-000000000002'$$,
  'assistant : le client ne peut pas réécrire une réponse');
select tests.throws($$update public.assistant_messages set feedback = 1 where id = 'e1e1e1e1-0000-4000-8000-000000000002'$$,
  'assistant : le retour passe uniquement par la table des retours');
update public.assistant_messages set saved = true where id = :'R_A';

-- Quota consultable, non manipulable
select tests.ok((select quota from public.assistant_quota_status()) = 5 and (select remaining from public.assistant_quota_status()) = 0,
  'quota : état consultable (5 questions gratuites, toutes utilisées)');
select tests.throws($$select public.refund_assistant_quota(auth.uid())$$, 'quota : remboursement réservé au serveur');
reset role;
select tests.ok(not (select saved from public.assistant_messages where id = :'R_A'), 'favori : impossible d''enregistrer la réponse d''une autre personne');

-- ---------------------------------------------------------------- Alex
set role authenticated; set request.jwt.claim.sub = :'ALEX';
select tests.ok(tests.count('select * from public.assistant_feedback') = 0, 'retour : Alex ne voit pas les retours de Zoé');
delete from public.assistant_feedback;
select tests.ok(tests.count('select * from public.assistant_conversations') = 1, 'assistant : Alex ne voit que sa conversation');
reset role;
select tests.ok((select count(*) from public.assistant_feedback) = 1, 'retour : Alex ne peut pas supprimer celui de Zoé');

-- ---------------------------------------------------------------- Anonyme
set role anon;
select tests.throws($$select * from public.assistant_feedback$$, 'anonyme : aucun accès aux retours');
select tests.ok(tests.count('select * from public.assistant_conversations') = 0, 'anonyme : aucune conversation');
select tests.throws($$select * from public.assistant_quota_status()$$, 'anonyme : pas d''accès au quota');
reset role;

-- ---------------------------------------------------------------- Serveur : remboursement
set role service_role;
select public.refund_assistant_quota(:'ZOE');
reset role;
set role authenticated; set request.jwt.claim.sub = :'ZOE';
select tests.ok((select remaining from public.assistant_quota_status()) = 1, 'quota : une question rendue après une panne du service');
-- Suppression de la conversation : messages et retours effacés
delete from public.assistant_conversations where id = :'CONV_Z';
reset role;
select tests.ok((select count(*) from public.assistant_messages where conversation_id = :'CONV_Z') = 0
  and (select count(*) from public.assistant_feedback where message_id = :'R_Z') = 0,
  'suppression : messages et retours effacés avec la conversation');
