-- =====================================================================
-- Modération v2 (20261214000100_moderation_v2.sql) : haine et contenus sur les enfants bloqués, insultes, menaces,
-- sexe explicite et détresse en relecture, aucun faux positif sur des phrases de parents ordinaires.
-- =====================================================================
reset role; set request.jwt.claim.sub = '';
select tests.throws($$select public.community_text_needs_review('du contenu pedoporn ici')$$, 'modération v2 : contenu sexualisant des enfants bloqué');
select tests.throws($$select public.community_text_needs_review('sale bougnoule')$$, 'modération v2 : propos haineux bloqué');
select tests.ok(public.community_text_needs_review('t''es qu''une connasse'), 'modération v2 : insulte → relecture');
select tests.ok(public.community_text_needs_review('you are a stupid bitch'), 'modération v2 : insulte anglaise → relecture');
select tests.ok(public.community_text_needs_review('je vais te retrouver'), 'modération v2 : menace → relecture');
select tests.ok(public.community_text_needs_review('j''ai envie de mourir ce soir'), 'modération v2 : détresse → relecture');
select tests.ok(not public.community_text_needs_review('Mon bébé a du retard pour ses dents, la sieste a duré 2 h, la nuit était difficile'),
  'modération v2 : phrase ordinaire de parent → publiée sans relecture');
select tests.ok(not public.community_text_needs_review('Il faut tuer le temps pendant la tétée de nuit'), 'modération v2 : « tuer le temps » n’est pas une menace');
select tests.ok((select count(*) from public.moderation_terms where reason like 'v2 · %') = 8, 'modération v2 : 8 règles ajoutées');
select tests.ok(exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reports' and column_name = 'alerted_at'),
  'modération v2 : colonne reports.alerted_at');
