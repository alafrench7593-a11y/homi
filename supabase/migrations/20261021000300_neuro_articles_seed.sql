-- Articles par parcours — FICHIER GÉNÉRÉ par scripts/gen-articles-seed.ts (ne pas modifier à la main).
-- 17 articles « Neurodéveloppement » accessibles à tous les parents (aucun diagnostic requis), rédigés avec l'aide d'une IA à partir de sources consultées : statut éditorial « à vérifier ».
insert into public.content_categories (slug, label, icon, position) values ('neurodeveloppement', 'Neurodéveloppement', 'compass', 12) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-premiers-signes-se-poser-des-questions', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Se poser des questions sur le développement de son enfant', 'Chaque enfant avance à son rythme, mais certains décalages qui durent méritent d’en parler tôt à un médecin, sans attendre ni s’alarmer.', 'Vous avez l''impression que votre enfant ne fait pas tout à fait comme les autres ? Ce questionnement est fréquent, et il est légitime. Il ne signifie pas qu''il y a forcément un trouble.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Chaque enfant a son propre rythme
Le développement avance par étapes, avec des pauses puis des progrès rapides. Un enfant peut marcher tôt et parler plus tard, ou l''inverse. Un petit recul passager après une maladie, un déménagement ou une naissance dans la famille est aussi possible.

### Ce que vous pouvez observer
Les professionnels regardent plusieurs grands domaines : les grands mouvements (tenir sa tête, s''asseoir, marcher), les gestes fins des mains, le langage, la compréhension et le jeu, et la relation aux autres. Ce qui doit amener à en parler :
- un décalage qui **persiste** dans le temps, dans un ou plusieurs domaines ;
- par exemple, un bébé de 6 mois qui ne tient pas sa tête, ou un enfant de 18 mois qui ne dit ni « papa » ni « maman » ;
- la **perte** de compétences déjà acquises (des mots, des gestes, l''intérêt pour les autres), à tout âge ;
- chez l''enfant scolarisé, des difficultés durables d''attention, de lecture, d''écriture, de calcul, de motricité ou de contrôle des émotions, à l''école comme à la maison.

### Ce que vous pouvez faire
- Notez ce que vous voyez, avec des exemples et l''âge de votre enfant.
- Demandez l''avis de ceux qui le connaissent : crèche, assistante maternelle, enseignant.
- Évitez de comparer sans cesse avec les autres enfants : ce qui compte, c''est la progression de votre enfant.

### Quand en parler et à qui
En cas de doute, **n''attendez pas** : parlez-en à votre médecin traitant, à votre pédiatre ou au médecin de PMI. Il pourra examiner votre enfant et, si besoin, l''orienter vers une plateforme de coordination et d''orientation (PCO). Agir tôt permet de proposer une aide adaptée pendant que le cerveau de l''enfant est encore très malléable. Et si tout va bien, vous serez rassuré.', array['family','newborn','child']::text[], null, null, null, null, false, array['neurodéveloppement','repérage','premiers signes','développement','neuro','neuro-signs']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr (mpedia, AFPA) — Mon enfant a-t-il un retard de développement ?","url":"https://www.sante.fr/mon-enfant-t-il-un-retard-de-developpement","consulted_on":"2026-10-21","published":"2021-01-05"},{"label":"Santé.fr — Lancement de la campagne de repérage « agir tot » dont l’objectif est d’aider les parents a reconnaitre, le plus tôt possible, les signes d’un développement inhabituel chez leur enfant","url":"https://www.sante.fr/node/2666205","consulted_on":"2026-10-21","published":"2020-10-13"},{"label":"Délégation interministérielle autisme-TND (handicap.gouv.fr) — Circulaire du 23 septembre 2021 et livret « Repérer un trouble du neurodéveloppement chez les enfants de 6 à 12 ans »","url":"https://handicap.gouv.fr/sites/handicap/files/2021-12/Reperage-autisme-7-12-ans-pochette.pdf","consulted_on":"2026-10-21","published":"2021-09-23"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-tdah-comprendre', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Le TDAH : comprendre l’attention et l’agitation', 'Le trouble du déficit de l’attention avec ou sans hyperactivité se repère à des difficultés durables, présentes dans plusieurs lieux de vie, et se diagnostique par un médecin.', 'Beaucoup d''enfants bougent, oublient, interrompent : c''est de leur âge. Le TDAH (trouble du déficit de l''attention avec ou sans hyperactivité) est autre chose : un trouble du neurodéveloppement qui gêne vraiment la vie de tous les jours.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Trois grandes dimensions
- **L''inattention** : difficulté à rester concentré, à mémoriser, oublis fréquents, distraction rapide.
- **L''impulsivité** : couper la parole, avoir du mal à retenir un geste, un mot ou une envie.
- **L''hyperactivité** : forte agitation, difficulté à rester assis.

Un enfant peut être surtout inattentif, surtout agité, ou les deux.

### Ce que vous pouvez observer
Pour que les médecins évoquent un TDAH, ces signes doivent être **durables** (plus de six mois), apparaître **dans plusieurs situations** (maison, école, loisirs) et **gêner** réellement l''enfant. Les premiers signes apparaissent en général avant 12 ans. Selon les sources officielles, environ 6 % des enfants seraient concernés, et le TDAH est souvent associé à d''autres difficultés (troubles « dys », sommeil, anxiété).

### Ce que vous pouvez faire
- Proposer des consignes courtes, une à la fois, et des repères visuels (tableau de la journée).
- Prévoir un coin calme pour les devoirs, avec peu de distractions.
- Valoriser les efforts et les réussites, même petites.
- Échanger régulièrement avec l''enseignant : une place près du tableau ou des consignes reformulées peuvent déjà aider.

### Quand en parler et à qui
Si ces difficultés durent et pèsent sur votre enfant ou sur la famille, consultez votre médecin traitant ou votre pédiatre. Il pourra orienter vers un médecin formé au TDAH et, si besoin, vers une plateforme de coordination et d''orientation. Des aménagements scolaires sont possibles avec ou sans dossier MDPH. Le TDAH n''est la faute ni de l''enfant ni des parents.', array['family','newborn','child']::text[], null, null, null, null, false, array['TDAH','attention','hyperactivité','impulsivité','neurodéveloppement','neuro','neuro-adhd']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Mon Parcours Handicap — Qu’est-ce que le trouble du déficit d’attention avec ou sans hyperactivité (TDAH) ?","url":"https://www.monparcourshandicap.gouv.fr/actualite/quest-ce-que-le-trouble-du-deficit-dattention-avec-ou-sans-hyperactivite-tdah","consulted_on":"2026-10-21","published":"2026-06-09"},{"label":"Mon Parcours Handicap — PPRE, PAI, PAP, PPS : en quoi consistent les différentes possibilités d’appui à la scolarisation ?","url":"https://www.monparcourshandicap.gouv.fr/scolarite/ppre-pai-pap-pps-en-quoi-consistent-les-differentes-possibilites-dappui-la-scolarisation","consulted_on":"2026-10-21","published":"2026-05-06"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-autisme-tsa-comprendre', (select id from public.content_categories where slug = 'neurodeveloppement'), 'L’autisme (TSA) : repères pour les parents', 'Le trouble du spectre de l’autisme touche la communication, les relations et les comportements, de façon très variable d’un enfant à l’autre ; repéré tôt, il permet un accompagnement adapté.', 'On parle de « spectre » de l''autisme parce que chaque personne autiste est différente. Le trouble du spectre de l''autisme (TSA) est un trouble du neurodéveloppement qui apparaît dans l''enfance et dure toute la vie. Il concernerait environ une personne sur cent en France.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Deux grandes dimensions
- **La communication et les relations** : langage absent, en retard ou particulier (répétition de mots entendus), difficulté à comprendre les gestes, les expressions ou les sous-entendus, regard inhabituel, peu de partage d''intérêt.
- **Des comportements et intérêts restreints ou répétitifs** : besoin de routines, difficulté face au changement, intérêts très intenses, mouvements répétés, et souvent des **particularités sensorielles** (sensibilité forte ou faible aux bruits, à la lumière, au toucher…).

### Ce que vous pouvez observer
Les signes apparaissent souvent avant 3 ans. Les sources officielles citent par exemple :
- peu de contact visuel ou de sourire partagé vers 6 à 9 mois ;
- peu de réaction au prénom, pas de pointage ni de gestes pour communiquer vers 9 à 12 mois ;
- pas de babillage ou de gestes sociaux à 12 mois, pas de mots à 18 mois ;
- à tout âge : une **perte** du langage ou des compétences sociales, un repli, des réactions sensorielles très fortes.

Un seul signe ne suffit pas à conclure, mais il justifie d''en parler.

### Ce que vous pouvez faire
- Noter ce que vous observez, avec des exemples concrets.
- Garder des routines rassurantes et prévenir des changements.
- Vous rappeler que l''autisme n''est **jamais** causé par l''éducation ou la personnalité des parents.

### Quand en parler et à qui
Parlez-en sans attendre à votre médecin, pédiatre ou médecin de PMI. Il pourra orienter vers une plateforme de coordination et d''orientation : bilans et premières interventions peuvent commencer **avant** tout diagnostic. Pour toute question, Autisme Info Service répond gratuitement au 0 800 71 40 40.', array['family','newborn','child']::text[], null, null, null, null, false, array['autisme','TSA','communication','neurodéveloppement','neuro','neuro-autism']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Maison de l’autisme — Fiche pratique « Qu’est-ce que l’autisme ? »","url":"https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Quest-ce-que-lautisme.pdf","consulted_on":"2026-10-21"},{"label":"Mon Parcours Handicap — La journée mondiale de l’autisme 2026","url":"https://www.monparcourshandicap.gouv.fr/actualite/journee-mondiale-de-sensibilisation-lautisme","consulted_on":"2026-10-21","published":"2026-04-01"},{"label":"info.gouv.fr — La plateforme d’écoute « Autisme Info Service » est désormais accessible","url":"https://www.info.gouv.fr/actualite/la-plateforme-d-ecoute-autisme-info-service-accessible-des-le-2-avril","consulted_on":"2026-10-21","published":"2022-02-23"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-troubles-dys', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Les troubles « dys » : quand apprendre demande plus d’efforts', 'Dyslexie, dyspraxie, dyscalculie… les troubles dys sont des troubles durables et spécifiques des apprentissages, sans lien avec l’intelligence ou la volonté de l’enfant.', 'Votre enfant travaille beaucoup mais lire, écrire ou compter reste très difficile ? Les troubles « dys » sont des troubles du neurodéveloppement **durables** qui touchent une ou plusieurs fonctions précises : langage, gestes, attention, mémoire. Ils ne traduisent ni un manque d''intelligence, ni de la paresse.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Les principaux troubles dys
- **Dyslexie** : lecture lente, hésitante, avec des erreurs, et très fatigante.
- **Dysorthographie** : erreurs fréquentes à l''écrit, souvent associée à la dyslexie.
- **Dysphasie** (trouble du langage oral) : difficulté à comprendre, à trouver ses mots, à construire des phrases.
- **Dyspraxie** : maladresse marquée, gestes qui s''automatisent mal, écriture difficile ; faire deux choses à la fois (écouter et écrire) est très coûteux.
- **Dyscalculie** : difficulté à comprendre les nombres, à compter, à calculer.

Selon le ministère de la Santé, les troubles spécifiques des apprentissages toucheraient au moins 5 à 6 % des enfants.

### Ce que vous pouvez observer
- Des difficultés qui **persistent** malgré l''entraînement et l''aide.
- Une grande fatigue après l''école ou les devoirs.
- Un découragement, une perte de confiance en soi.

### Ce que vous pouvez faire
- Valoriser l''effort plutôt que le résultat.
- Alléger ce qui peut l''être (lire à voix haute pour lui, dicter plutôt qu''écrire).
- En parler avec l''enseignant : des aménagements simples existent (consignes reformulées, police plus grande, moins de copie).

### Quand en parler et à qui
Le repérage peut venir des parents, des enseignants ou des professionnels de la petite enfance. Parlez-en à votre médecin traitant ou au médecin scolaire : le diagnostic se fait le plus souvent en équipe (orthophoniste, psychologue, psychomotricien, ergothérapeute…), coordonnée par un médecin. À l''école, un plan d''accompagnement personnalisé (PAP) peut être mis en place sans dossier MDPH.', array['family','newborn','child']::text[], null, null, null, null, false, array['dys','dyslexie','dyspraxie','dyscalculie','apprentissages','neuro','neuro-dys']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Mon Parcours Handicap — Troubles dys : quels aménagements pour la scolarité ?","url":"https://www.monparcourshandicap.gouv.fr/actualite/troubles-dys-quels-amenagements-pour-la-scolarite","consulted_on":"2026-10-21","published":"2025-10-10"},{"label":"Santé.fr — Les troubles du langage et des apprentissages","url":"https://www.sante.fr/les-troubles-du-langage-et-des-apprentissages","consulted_on":"2026-10-21","published":"2024-08-02"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-troubles-du-langage', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Langage : quand en parler et comment l’encourager', 'Beaucoup de retards de langage sont simples et s’améliorent avec un accompagnement ; certains signes justifient de consulter et de vérifier l’audition.', 'Entre 3 et 6 ans, le langage se développe énormément. C''est aussi à cet âge que certaines difficultés apparaissent. Selon le ministère de la Santé, environ 4 à 5 % des enfants ont un trouble de l''évolution du langage, soit à peu près un enfant par classe.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Quelques repères
- **Vers 3 ans** : l''enfant dit « je » et fait des phrases plus longues. On en parle s''il ne fait pas encore de phrases, a peu de mots, ou n''est compris que par ses parents.
- **Vers 4 ans** : la plupart des enfants prononcent presque tous les sons. On en parle s''il comprend mal les phrases un peu longues, fait des phrases très courtes, déforme beaucoup les mots ou bégaie.
- **Entre 4 et 6 ans** : il joue avec les mots, les rimes, raconte des histoires. On en parle si sa parole reste peu compréhensible, si ses phrases sont « télégraphiques » ou s''il comprend mal.

### Ce que vous pouvez faire au quotidien
- Discuter vraiment avec lui, en prenant le temps d''écouter.
- Lire des histoires, chanter des comptines, jouer aux rimes.
- Plutôt que de lui faire répéter un mot mal dit, **redire la bonne forme** naturellement dans votre réponse.
- Lui demander de vous raconter son histoire préférée, en inversant les rôles.

### Quand en parler et à qui
Au moindre doute, parlez-en à votre médecin : il vérifiera notamment **l''audition**, car une gêne auditive peut freiner le langage, et pourra prescrire un bilan chez un orthophoniste. Des questionnaires de repérage existent aussi à différents âges, et l''école réalise des dépistages.

La bonne nouvelle : beaucoup de retards simples s''améliorent avant 6 ans avec un accompagnement adapté. Quand le trouble est plus durable (dysphasie), une rééducation régulière aide l''enfant à progresser.', array['family','newborn','child']::text[], null, null, null, null, false, array['langage','parole','orthophonie','audition','neurodéveloppement','neuro','neuro-language']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr (mpedia, AFPA) — Troubles du langage de 3 à 6 ans","url":"https://www.sante.fr/troubles-du-langage-de-3-6-ans","consulted_on":"2026-10-21","published":"2021-09-16"},{"label":"Santé.fr — Les troubles du langage et des apprentissages","url":"https://www.sante.fr/les-troubles-du-langage-et-des-apprentissages","consulted_on":"2026-10-21","published":"2024-08-02"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-difficultes-sensorielles', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Bruits, lumières, textures : les particularités sensorielles', 'Certains enfants réagissent très fortement, ou au contraire très peu, aux sensations ; adapter l’environnement peut beaucoup les soulager.', 'Votre enfant se bouche les oreilles au moindre bruit, refuse certaines étiquettes de vêtements, ou semble au contraire ne pas sentir les chocs ? Il peut avoir des **particularités sensorielles**.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### De quoi parle-t-on ?
Chacun perçoit le monde à travers ses sens : ouïe, vue, toucher, goût, odorat, mais aussi l''équilibre et la perception de son corps. Certains enfants sont :
- **hypersensibles** : un bruit, une lumière, une odeur ou un contact les envahit et peut provoquer pleurs, colère ou fuite ;
- **hyposensibles** : ils réagissent peu et cherchent parfois des sensations fortes (tourner, se cogner, toucher tout).

Ces particularités sont fréquentes chez les enfants autistes, mais on les rencontre aussi chez d''autres enfants, avec ou sans trouble. Elles peuvent aussi se manifester par des maux de ventre, des refus alimentaires ou des pleurs difficiles à calmer.

### Ce que vous pouvez observer
- Les situations qui déclenchent un malaise : supermarché, cantine, coiffeur, vêtements, foule.
- Ce qui apaise votre enfant : un endroit calme, un objet, un mouvement.
- Si ces réactions empêchent des activités du quotidien (s''habiller, manger, aller à l''école).

### Ce que vous pouvez faire
- **Adapter l''environnement** : baisser le bruit et la lumière, prévoir un coin refuge.
- Prévenir à l''avance des situations difficiles et de leur durée.
- Respecter certaines préférences (vêtements doux, sans étiquette) sans forcer.
- L''aider à **nommer** ce qu''il ressent, avec des mots, des images ou des histoires.
- Valoriser ses forces : une grande sensibilité va souvent avec une attention fine aux autres et une riche vie intérieure.

### Quand en parler et à qui
Si ces réactions sont intenses, durables ou s''accompagnent d''autres difficultés (langage, relations, motricité), parlez-en à votre médecin ou pédiatre. Il pourra orienter vers des professionnels comme le psychomotricien ou l''ergothérapeute, notamment via une plateforme de coordination et d''orientation.', array['family','newborn','child']::text[], null, null, null, null, false, array['sensorialité','hypersensibilité','autisme','neurodéveloppement','neuro','neuro-sensory']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Maison de l’autisme — Fiche pratique « Qu’est-ce que l’autisme ? »","url":"https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Quest-ce-que-lautisme.pdf","consulted_on":"2026-10-21"},{"label":"Caf (Vies de famille) — Comment apaiser un enfant hypersensible ?","url":"https://caf.fr/allocataires/vies-de-famille/articles/comment-apaiser-un-enfant-hypersensible","consulted_on":"2026-10-21","published":"2022-04-20"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-sommeil', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Sommeil difficile : des pistes pour toute la famille', 'Les troubles du sommeil sont fréquents chez l’enfant, et parfois plus marqués en cas de trouble du neurodéveloppement ; des habitudes régulières aident souvent.', 'Endormissement interminable, réveils la nuit, réveils très tôt… Les troubles du sommeil touchent 20 à 30 % des moins de 6 ans. Ils sont parfois plus présents chez les enfants qui ont un trouble du neurodéveloppement, comme l''autisme ou le TDAH. Et ils fatiguent toute la famille.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Pourquoi c''est important
Le sommeil aide l''enfant à grandir, à consolider ce qu''il a appris et à gérer ses émotions. Un enfant qui dort mal peut être plus irritable, plus agité ou avoir du mal à se concentrer.

### Ce que vous pouvez observer
- Le temps qu''il met à s''endormir, le nombre et la durée des réveils.
- Ce qui se passe avant le coucher : écrans, activités excitantes, repas tardif.
- Des cauchemars répétés, qui peuvent traduire une inquiétude.
- Un changement récent : déménagement, entrée à l''école, naissance.

Un petit carnet tenu sur une ou deux semaines aide beaucoup à y voir clair.

### Ce que vous pouvez faire
- Garder des **horaires réguliers** pour le coucher, le lever, les repas et les siestes.
- Mettre en place un **rituel calme** et prévisible : histoire, chanson, câlin.
- **Éviter les écrans le soir** et les garder hors de la chambre.
- Une chambre sombre, calme, à bonne température ; une petite veilleuse si elle rassure.
- Diminuer progressivement les stimulations en fin de journée.
- Coucher l''enfant encore éveillé pour qu''il apprenne à s''endormir seul.

### Quand en parler et à qui
Si les difficultés durent ou vous épuisent, consultez votre pédiatre ou médecin traitant **sans attendre d''être à bout**. Il cherchera une cause (anxiété, maladie, particularité du développement) et vous aidera à réorganiser les rythmes. Ne donnez pas de vous-même de produit « pour dormir », même à base de plantes : c''est au médecin d''en juger.', array['family','newborn','child']::text[], null, null, null, null, false, array['sommeil','endormissement','réveils nocturnes','neurodéveloppement','neuro','neuro-sleep']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr — Troubles du sommeil chez l’enfant","url":"https://www.sante.fr/node/2055637","consulted_on":"2026-10-21","published":"2026-08-13"},{"label":"Santé.fr (mpedia, AFPA) — Troubles de l’endormissement, réveils et terreurs nocturnes","url":"https://www.sante.fr/node/1068883","consulted_on":"2026-10-21","published":"2023-01-13"},{"label":"Éducation nationale (La mallette des parents) — Les bienfaits du sommeil pour les enfants","url":"https://mallettedesparents.education.gouv.fr/print/pdf/node/181","consulted_on":"2026-10-21","published":"2020-04-23"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-alimentation-selectivite', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Repas compliqués : sélectivité et particularités alimentaires', 'Refuser les aliments nouveaux est fréquent chez l’enfant ; quand la liste des aliments acceptés devient très courte, mieux vaut en parler au médecin.', 'Votre enfant ne mange que quelques aliments, refuse tout ce qui est nouveau, ou trie son assiette selon la couleur ou la texture ? Vous n''êtes pas seul : la réticence à goûter de nouveaux aliments est très courante entre 2 et 10 ans.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Du normal au plus difficile
- La **méfiance envers les aliments nouveaux** est une étape normale du développement.
- Quand elle devient très forte, on parle de **sélectivité alimentaire** : l''enfant accepte de moins en moins d''aliments, parfois un seul type.
- Chez certains enfants, notamment ceux qui ont des particularités sensorielles, la texture, l''odeur, la couleur ou la température jouent un grand rôle. Une peur (de s''étouffer, par exemple) peut aussi être en cause.

### Ce que vous pouvez observer
- La liste des aliments acceptés : s''allonge-t-elle ou se réduit-elle ?
- Ce qui gêne votre enfant : texture, mélange, aspect, odeur.
- Son énergie, sa croissance (courbes du carnet de santé).
- L''ambiance des repas : sont-ils devenus une source d''angoisse ou de conflit ?

### Ce que vous pouvez faire
- **Ne pas forcer** ni obliger à finir l''assiette : la contrainte renforce souvent le refus.
- Proposer un aliment refusé **plusieurs fois**, en petite quantité, à côté d''aliments qu''il aime ; il faut en moyenne 7 à 8 présentations.
- Varier les préparations (cru, cuit, en purée, avec une sauce).
- Manger vous-même l''aliment avec plaisir, en famille, au calme et sans écran.
- L''impliquer dans les courses et la cuisine : toucher et sentir, c''est déjà goûter.
- Éviter d''utiliser la nourriture comme récompense.

### Quand en parler et à qui
Si votre enfant mange très peu d''aliments différents, perd du poids, semble fatigué, ou si les repas deviennent une épreuve, parlez-en à son médecin. Il vérifiera sa croissance et pourra orienter vers un spécialiste ou un professionnel qui aide à sortir du cercle vicieux autour des repas.', array['family','newborn','child']::text[], null, null, null, null, false, array['alimentation','sélectivité alimentaire','repas','sensorialité','neuro','neuro-food']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr — Mon enfant ne mange pas de légumes, la sélectivité alimentaire","url":"https://www.sante.fr/node/1093937","consulted_on":"2026-10-21","published":"2024-10-30"},{"label":"Caf (Vies de famille) — Comment apaiser un enfant hypersensible ?","url":"https://caf.fr/allocataires/vies-de-famille/articles/comment-apaiser-un-enfant-hypersensible","consulted_on":"2026-10-21","published":"2022-04-20"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-emotions', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Colères et émotions débordantes : accompagner son enfant', 'Les grandes colères expriment souvent une frustration que l’enfant ne sait pas encore dire ; on peut l’aider à mettre des mots et chercher de l’aide si elles persistent.', 'Crises de colère, pleurs qui ne s''arrêtent pas, gestes brusques… Les émotions des enfants peuvent être très intenses. Chez certains enfants, en particulier quand la communication ou l''attention sont plus difficiles, elles débordent plus souvent.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Comprendre ce qui se passe
- Avant 2 ans, la colère passe surtout par le corps (taper, attraper). Vers 2 ans, le « non » arrive. Après 3 ans, les mots prennent peu à peu le relais.
- Une colère exprime souvent une **frustration**, une fatigue, une surcharge (bruit, foule) ou une difficulté à se faire comprendre.
- Les difficultés d''apprentissage ou de langage peuvent aussi entraîner anxiété, fatigue et perte de confiance.

### Ce que vous pouvez observer
- Ce qui se passe **juste avant** la crise : changement imprévu, demande difficile, environnement bruyant, faim, fatigue.
- Ce qui aide votre enfant à se calmer.
- La fréquence des crises, et si elles se tournent contre lui-même ou contre les autres.

### Ce que vous pouvez faire
- Rester calme et ferme : votre calme lui sert de modèle.
- L''aider à **nommer ses émotions** (« tu es très en colère parce que… »), avec des livres, des images ou des jeux.
- Prévoir un coin pour se poser et prévenir des changements à l''avance.
- Proposer des activités pour se défouler (sport, danse, dessin).
- Passer des moments calmes ensemble et **valoriser** chaque progrès.
- Après la tempête, en reparler simplement.

### Quand en parler et à qui
Si les crises sont fréquentes et durent au-delà de 3 ans, si votre enfant se fait du mal ou blesse les autres, ou si vous vous sentez dépassé, parlez-en à votre médecin ou pédiatre. Il pourra orienter vers un psychologue, un pédopsychiatre ou une plateforme de coordination si d''autres difficultés de développement sont présentes. Demander de l''aide n''est pas un échec : c''est une façon de prendre soin de votre enfant et de vous.', array['family','newborn','child']::text[], null, null, null, null, false, array['émotions','colère','comportement','neurodéveloppement','neuro','neuro-emotions']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr (mpedia, AFPA) — Comment réagir face à l’agressivité persistante de mon enfant ?","url":"https://www.sante.fr/node/1093941","consulted_on":"2026-10-21","published":"2023-09-01"},{"label":"Caf (Vies de famille) — Comment apaiser un enfant hypersensible ?","url":"https://caf.fr/allocataires/vies-de-famille/articles/comment-apaiser-un-enfant-hypersensible","consulted_on":"2026-10-21","published":"2022-04-20"},{"label":"Santé.fr — Les troubles du langage et des apprentissages","url":"https://www.sante.fr/les-troubles-du-langage-et-des-apprentissages","consulted_on":"2026-10-21","published":"2024-08-02"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-a-qui-parler', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Un doute sur le développement : à qui en parler ?', 'Le médecin traitant, le pédiatre ou le médecin de PMI est la première porte d’entrée ; il peut orienter vers une plateforme de coordination et d’orientation.', 'Vous avez un doute et vous ne savez pas par où commencer ? C''est normal : le parcours peut sembler compliqué. Voici les principales portes d''entrée.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### La première étape : un médecin
- Votre **médecin traitant** ou votre **pédiatre**.
- Le **médecin de PMI** (protection maternelle et infantile), gratuit, pour les jeunes enfants.
- Le **médecin de crèche** ou le **médecin scolaire**.

Ils peuvent examiner votre enfant, écouter vos observations et, si besoin, l''orienter.

### Les plateformes de coordination et d''orientation (PCO)
Dans chaque département, des plateformes accueillent les enfants pour lesquels un trouble du neurodéveloppement est **suspecté**. Il n''y a **pas besoin de diagnostic** pour y être orienté. Ce qu''il faut savoir :
- l''orientation se fait sur **prescription d''un médecin** ;
- elles organisent des bilans et des interventions précoces, au plus près de chez vous ;
- elles concernent les enfants jusqu''à 12 ans (selon les territoires, d''abord les 0-6 ans, puis les 7-12 ans) ;
- certaines séances habituellement non remboursées (psychomotricien, ergothérapeute, psychologue) peuvent être financées : si le parcours est validé, la famille n''avance pas de frais ;
- elles apportent aussi un soutien aux familles dans les démarches.

### D''autres lieux possibles
- Les **CAMSP** (centres d''action médico-sociale précoce), pour les enfants de 0 à 6 ans ; vous pouvez les contacter directement.
- Les **CMPP** (centres médico-psycho-pédagogiques), jusqu''à 20 ans, pour des difficultés d''apprentissage, de langage, de motricité ou de comportement.
- Les **CMP** (centres médico-psychologiques), publics, en cas de souffrance psychique.

Les délais d''attente peuvent être longs : il est utile de prendre contact tôt.

### Pour vous informer
- **Autisme Info Service** : 0 800 71 40 40 (gratuit).
- Le **0 800 360 360** : numéro gratuit pour les personnes handicapées et leurs aidants, qui oriente vers des solutions près de chez vous.

N''hésitez pas à parler de vos doutes : être écouté est déjà une première aide.', array['family','newborn','child']::text[], null, null, null, null, false, array['orientation','PCO','médecin','CAMSP','neurodéveloppement','neuro','neuro-who']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr — Repérage et prise en soins des troubles du neuro-développement grâce aux Plateformes de Coordination et d’Orientation (PCO)","url":"https://www.sante.fr/reperage-et-prise-en-soins-des-troubles-du-neuro-developpement-grace-aux-plateformes-de-coordination","consulted_on":"2026-10-21","published":"2024-02-07"},{"label":"Mon Parcours Handicap — Troubles du neurodéveloppement, autisme : le forfait d’intervention précoce","url":"https://www.monparcourshandicap.gouv.fr/aides/troubles-du-neurodeveloppement-autisme-le-forfait-dintervention-precoce","consulted_on":"2026-10-21","published":"2026-01-20"},{"label":"Mon Parcours Handicap — De quels accompagnements médico-sociaux et sanitaires votre enfant peut-il bénéficier ?","url":"https://www.monparcourshandicap.gouv.fr/scolarite/de-quels-accompagnements-medico-sociaux-et-sanitaires-votre-enfant-peut-il-beneficier","consulted_on":"2026-10-21","published":"2026-01-09"},{"label":"Maison de l’autisme — Fiche pratique « Proche aidant de personne autiste »","url":"https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Proche-aidant-de-personne-autiste.pdf","consulted_on":"2026-10-21"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-preparer-un-rendez-vous', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Bien préparer un rendez-vous au sujet de son enfant', 'Quelques notes concrètes, l’avis de l’école ou de la crèche et une liste de questions aident le médecin à comprendre la situation et vous aident à ne rien oublier.', 'Un rendez-vous passe vite, et l''émotion peut faire oublier l''essentiel. Un peu de préparation aide le professionnel à mieux comprendre votre enfant, et vous aide à repartir avec des réponses.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Avant le rendez-vous
- **Notez vos observations** : ce qui vous questionne, depuis quand, dans quelles situations, avec des exemples précis (« à 2 ans, il ne dit que trois mots », « il se bouche les oreilles à la cantine »).
- Notez aussi **ses points forts** et ce qui l''aide.
- **Demandez l''avis** de la crèche, de l''assistante maternelle ou de l''enseignant : leur regard complète le vôtre. Pour les enfants de 6 à 12 ans, il existe un livret de repérage avec une partie pour la famille, une pour l''enseignant et une pour le médecin.
- Rassemblez le **carnet de santé**, les comptes rendus de bilans déjà faits, éventuellement des vidéos courtes d''un comportement difficile à décrire.
- Préparez **vos questions** par écrit.

### Quelques questions utiles
- Ce que vous observez est-il dans la variabilité habituelle, ou faut-il aller plus loin ?
- Quels bilans sont conseillés, et auprès de qui ?
- Une orientation vers une plateforme de coordination et d''orientation est-elle possible ?
- Que puis-je faire dès maintenant à la maison ?
- Quand faut-il revenir vous voir ?

### Pendant le rendez-vous
- Venez à deux si c''est possible, ou avec une personne de confiance.
- Prenez des notes, ou demandez au professionnel de reformuler.
- Si un mot vous échappe, demandez son explication : il n''y a pas de question bête.
- Vous pouvez dire que vous êtes inquiet : c''est une information importante.

### Après le rendez-vous
- Relisez vos notes, classez les documents dans un même dossier.
- Notez les prochaines étapes et les contacts.
- Si vous n''êtes pas rassuré, vous pouvez demander un autre avis ou reprendre rendez-vous.

Pour une orientation vers une plateforme, une prescription médicale est nécessaire : c''est souvent l''un des objectifs de ce premier rendez-vous.', array['family','newborn','child']::text[], null, null, null, null, false, array['rendez-vous','consultation','préparer','neurodéveloppement','neuro','neuro-appointment']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr (mpedia, AFPA) — Mon enfant a-t-il un retard de développement ?","url":"https://www.sante.fr/mon-enfant-t-il-un-retard-de-developpement","consulted_on":"2026-10-21","published":"2021-01-05"},{"label":"Délégation interministérielle autisme-TND (handicap.gouv.fr) — Circulaire du 23 septembre 2021 et livret « Repérer un trouble du neurodéveloppement chez les enfants de 6 à 12 ans »","url":"https://handicap.gouv.fr/sites/handicap/files/2021-12/Reperage-autisme-7-12-ans-pochette.pdf","consulted_on":"2026-10-21","published":"2021-09-23"},{"label":"Mon Parcours Handicap — Troubles du neurodéveloppement, autisme : le forfait d’intervention précoce","url":"https://www.monparcourshandicap.gouv.fr/aides/troubles-du-neurodeveloppement-autisme-le-forfait-dintervention-precoce","consulted_on":"2026-10-21","published":"2026-01-20"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-professionnels-concernes', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Qui fait quoi ? Les professionnels qui peuvent accompagner votre enfant', 'Médecins, orthophoniste, psychomotricien, ergothérapeute, psychologue… chacun a un rôle précis, souvent coordonné par un médecin.', 'Quand on se pose des questions sur le développement d''un enfant, on découvre de nombreux métiers. Voici à quoi sert chacun, pour vous repérer.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Les médecins
- **Médecin traitant, pédiatre, médecin de PMI, médecin scolaire** : premiers interlocuteurs. Ils examinent l''enfant, prescrivent des bilans et orientent.
- **Pédopsychiatre, neuropédiatre** et médecins formés aux troubles du neurodéveloppement : ils participent au diagnostic et coordonnent souvent le parcours.

### Les professionnels des bilans et de l''accompagnement
- **Orthophoniste** : langage oral et écrit, communication, parfois alimentation. Ses séances sont remboursées sur prescription.
- **Psychomotricien** : coordination des mouvements, repérage dans l''espace, tonus, régulation des émotions par le corps.
- **Ergothérapeute** : autonomie au quotidien (s''habiller, écrire, utiliser des outils), adaptation du matériel, notamment l''ordinateur à l''école.
- **Psychologue** ou **neuropsychologue** : évaluation de l''attention, de la mémoire, du raisonnement ; soutien de l''enfant et de la famille.
- **Orthoptiste** : fonctionnement des yeux et de la vision.

Le diagnostic se fait le plus souvent **à plusieurs**, de façon coordonnée.

### Où les trouver
- En **libéral** (cabinet). Attention : les séances de psychomotricien, d''ergothérapeute et de psychologue ne sont en général pas remboursées par l''Assurance maladie, sauf dans certains dispositifs.
- Via une **plateforme de coordination et d''orientation** : elle peut financer ces séances pour une durée limitée, auprès de professionnels qui ont signé un contrat avec elle.
- Dans un **CAMSP** (0-6 ans), un **CMPP** (jusqu''à 20 ans) ou un **CMP** : soins pris en charge par l''Assurance maladie, mais délais souvent longs.
- Avec une notification de la MDPH, un **Sessad** peut intervenir à domicile ou à l''école.

### Ce que vous pouvez faire
- Demander à chaque professionnel un compte rendu écrit.
- Garder tous les documents dans un même classeur.
- Partager les informations utiles entre professionnels, avec votre accord : c''est votre enfant, vous êtes au cœur de l''équipe.', array['family','newborn','child']::text[], null, null, null, null, false, array['professionnels','orthophoniste','psychomotricien','ergothérapeute','neurodéveloppement','neuro','neuro-professionals']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Mon Parcours Handicap — Troubles dys : quels aménagements pour la scolarité ?","url":"https://www.monparcourshandicap.gouv.fr/actualite/troubles-dys-quels-amenagements-pour-la-scolarite","consulted_on":"2026-10-21","published":"2025-10-10"},{"label":"Mon Parcours Handicap — De quels accompagnements médico-sociaux et sanitaires votre enfant peut-il bénéficier ?","url":"https://www.monparcourshandicap.gouv.fr/scolarite/de-quels-accompagnements-medico-sociaux-et-sanitaires-votre-enfant-peut-il-beneficier","consulted_on":"2026-10-21","published":"2026-01-09"},{"label":"Mon Parcours Handicap — Troubles du neurodéveloppement, autisme : le forfait d’intervention précoce","url":"https://www.monparcourshandicap.gouv.fr/aides/troubles-du-neurodeveloppement-autisme-le-forfait-dintervention-precoce","consulted_on":"2026-10-21","published":"2026-01-20"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-ecole-pap-pps-aesh', (select id from public.content_categories where slug = 'neurodeveloppement'), 'À l’école : PAP, PPS, AESH… s’y retrouver', 'Selon les besoins de l’enfant, l’école peut proposer des aménagements simples, un plan d’accompagnement personnalisé ou, avec la MDPH, un projet personnalisé de scolarisation.', 'L''école peut s''adapter à votre enfant. Les sigles sont nombreux, mais l''idée est simple : trouver la bonne réponse selon ses besoins.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Les aménagements du quotidien
Sans démarche particulière, l''enseignant peut déjà proposer : consignes reformulées, place adaptée dans la classe, police plus grande, moins de copie, documents numériques.

### Les principaux dispositifs
- **PPRE** (programme personnalisé de réussite éducative) : un soutien pédagogique de courte durée, élaboré par l''enseignant.
- **PAI** (projet d''accueil individualisé) : pour un trouble de santé durable (asthme, allergie…), avec les adaptations et, si besoin, la conduite à tenir en urgence.
- **PAP** (plan d''accompagnement personnalisé) : pour des difficultés **durables** liées à un trouble des apprentissages (dys, TDAH…), **sans** passer par la MDPH. Il prévoit des aménagements pédagogiques, par exemple l''intervention d''un professionnel extérieur pendant le temps scolaire.
- **PPS** (projet personnalisé de scolarisation) : pour un élève dont le handicap est reconnu par la **MDPH**. Il peut prévoir une aide humaine, du matériel adapté, des soins, et il est réévalué chaque année.

### L''AESH
L''accompagnant des élèves en situation de handicap aide l''enfant à gagner en autonomie dans ses apprentissages. Cette aide est **décidée par la MDPH** dans le cadre du PPS ; elle peut être individuelle ou partagée entre plusieurs élèves.

### Les personnes et outils à connaître
- **L''équipe éducative** : une réunion avec l''école, que vous pouvez demander. Elle peut remplir le **GEVA-sco**, document qui décrit la scolarité de l''enfant et accompagne un dossier MDPH.
- **L''enseignant référent** : votre interlocuteur pour le suivi du PPS ; il organise chaque année l''équipe de suivi de la scolarisation.
- **Le pôle d''appui à la scolarité (PAS)**, là où il est en place : il apporte une première réponse rapide, sans attendre une reconnaissance de handicap. Les parents peuvent le solliciter.
- Le **0 805 805 110** : numéro vert d''information sur l''école inclusive.

### Ce que vous pouvez faire
Demander un rendez-vous à l''enseignant, puis une équipe éducative si les difficultés persistent. Vous êtes membre de droit de ces réunions et pouvez vous faire accompagner.', array['family','newborn','child']::text[], null, null, null, null, false, array['école','PAP','PPS','AESH','scolarité','neurodéveloppement','neuro','neuro-school']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Mon Parcours Handicap — PPRE, PAI, PAP, PPS : en quoi consistent les différentes possibilités d’appui à la scolarisation ?","url":"https://www.monparcourshandicap.gouv.fr/scolarite/ppre-pai-pap-pps-en-quoi-consistent-les-differentes-possibilites-dappui-la-scolarisation","consulted_on":"2026-10-21","published":"2026-05-06"},{"label":"Mon Parcours Handicap — Quels sont les accompagnements notifiés par la MDPH dans le PPS ?","url":"https://www.monparcourshandicap.gouv.fr/scolarite/quels-sont-les-accompagnements-notifies-par-la-mdph-dans-le-pps","consulted_on":"2026-10-21","published":"2026-07-30"},{"label":"Mon Parcours Handicap — Qu’est-ce que le GEVA-sco ?","url":"https://www.monparcourshandicap.gouv.fr/scolarite/quest-ce-que-le-geva-sco","consulted_on":"2026-10-21","published":"2025-12-23"},{"label":"Éducation nationale (Bulletin officiel n° 27 du 4 juillet 2024) — Déploiement des pôles d’appui à la scolarité préfigurateurs","url":"https://www.education.gouv.fr/bo/2024/Hebdo27/MENE2416076C","consulted_on":"2026-10-21","published":"2024-07-04"},{"label":"Maison de l’autisme — Fiche pratique « Proche aidant de personne autiste »","url":"https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Proche-aidant-de-personne-autiste.pdf","consulted_on":"2026-10-21"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-mdph-demarches', (select id from public.content_categories where slug = 'neurodeveloppement'), 'La MDPH : à quoi elle sert et comment faire une demande', 'La maison départementale des personnes handicapées informe les familles et étudie les demandes de droits et d’accompagnements, notamment pour l’école.', 'Le mot « handicap » peut faire peur. Pourtant, faire une demande à la MDPH, c''est avant tout ouvrir des droits pour que votre enfant soit mieux accompagné. Ce n''est ni une étiquette définitive, ni une obligation.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### À quoi sert la MDPH
La maison départementale des personnes handicapées est un **guichet unique** d''accueil, d''information et de conseil pour les personnes handicapées et leur famille. Elle étudie les demandes et une commission (la CDAPH) prend les décisions, par exemple :
- un **PPS** à l''école, avec si besoin une aide humaine (AESH) ou du matériel adapté ;
- une orientation vers un service comme un Sessad ;
- l''**AEEH** (allocation d''éducation de l''enfant handicapé), versée aux parents pour aider à couvrir les dépenses liées au handicap d''un enfant de moins de 20 ans, avec des compléments possibles ;
- la prestation de compensation du handicap (PCH).

### Comment faire une demande
- Remplir le **formulaire de demande** (Cerfa), qui décrit la vie quotidienne, la scolarité et les besoins.
- Joindre un **certificat médical de moins d''un an**, rempli par un médecin qui suit l''enfant, ainsi que les justificatifs demandés (identité, domicile).
- Pour l''école, ajouter le **GEVA-sco** rempli lors d''une équipe éducative.
- Vous pouvez joindre les bilans déjà réalisés. Un document complémentaire existe pour les troubles du neurodéveloppement : il est **facultatif**.
- Déposer le dossier à la MDPH de votre département ; certaines proposent un dépôt en ligne.

### Ce que vous pouvez faire
- **Anticiper** : pour une rentrée scolaire, il est conseillé de déposer le dossier entre janvier et mars de l''année précédente. Pour un renouvellement, environ 6 mois avant la fin des droits.
- Décrire concrètement une journée type et ce qui est difficile.
- Garder une copie de tout le dossier.
- Vous faire aider : l''accueil de la MDPH, une assistante sociale, une association.

### Bon à savoir
Les décisions peuvent être contestées. Et si votre enfant bénéficie d''un forfait d''intervention précoce via une plateforme, celui-ci s''arrête lorsque l''AEEH commence : parlez-en avec la plateforme pour bien organiser la suite.', array['family','newborn','child']::text[], null, null, null, null, false, array['MDPH','AEEH','démarches','handicap','neurodéveloppement','neuro','neuro-mdph']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Mon Parcours Handicap — Le dépôt du dossier et le traitement de la demande par la maison départementale des personnes handicapées","url":"https://www.monparcourshandicap.gouv.fr/aides/le-depot-du-dossier-et-le-traitement-de-la-demande-par-la-maison-departementale-des-personnes","consulted_on":"2026-10-21","published":"2026-06-18"},{"label":"Mon Parcours Handicap — AEEH : Allocation d’éducation de l’enfant handicapé","url":"https://www.monparcourshandicap.gouv.fr/glossaire/aeeh","consulted_on":"2026-10-21"},{"label":"Mon Parcours Handicap — Troubles du neurodéveloppement, autisme : le forfait d’intervention précoce","url":"https://www.monparcourshandicap.gouv.fr/aides/troubles-du-neurodeveloppement-autisme-le-forfait-dintervention-precoce","consulted_on":"2026-10-21","published":"2026-01-20"},{"label":"Mon Parcours Handicap — PPRE, PAI, PAP, PPS : en quoi consistent les différentes possibilités d’appui à la scolarisation ?","url":"https://www.monparcourshandicap.gouv.fr/scolarite/ppre-pai-pap-pps-en-quoi-consistent-les-differentes-possibilites-dappui-la-scolarisation","consulted_on":"2026-10-21","published":"2026-05-06"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-accompagnement-au-quotidien', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Au quotidien : petites adaptations, grands effets', 'Des repères visuels, des routines prévisibles et beaucoup d’encouragements aident les enfants qui ont des difficultés de développement, avec ou sans diagnostic.', 'Que votre enfant ait un diagnostic ou que vous soyez encore en train de vous interroger, vous pouvez déjà l''aider à la maison. Ces conseils simples sont utiles à beaucoup d''enfants.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Rendre la journée prévisible
- Des **routines** régulières (lever, repas, devoirs, coucher) rassurent.
- Un **emploi du temps visuel** avec des images ou des pictogrammes aide à se repérer.
- **Prévenir** des changements à l''avance (sortie, visite, vacances) et expliquer ce qui va se passer.

### Faciliter la compréhension
- Des **consignes courtes**, une à la fois, avec un geste ou une image.
- Vérifier que l''enfant a compris en lui demandant de reformuler.
- Découper les tâches longues en petites étapes, avec des pauses.

### Adapter l''environnement
- Un coin calme pour se poser ou faire ses devoirs, avec peu de distractions.
- Tenir compte des sensibilités : bruit, lumière, vêtements.
- Limiter les écrans, surtout le soir.

### Encourager
- **Valoriser l''effort** plus que le résultat.
- Repérer et nourrir ses centres d''intérêt et ses talents.
- Proposer des activités qui lui font du bien : sport, musique, dessin, nature.

### Travailler ensemble
- Garder un lien régulier avec l''école et les professionnels : ce qui marche à la maison peut servir en classe, et inversement.
- Les rééducations sont plus efficaces quand on reprend un peu les mêmes idées au quotidien : demandez aux professionnels ce que vous pouvez faire.
- Les plateformes de coordination proposent aussi un soutien aux familles.

### Et pour vous
Accompagner un enfant aux besoins particuliers demande beaucoup d''énergie. Vous n''avez pas à tout faire parfaitement : viser un parent « suffisamment bon » suffit. Prenez aussi des moments pour vous et n''hésitez pas à demander du relais.

Si vous constatez que les difficultés augmentent ou que la fatigue s''installe, parlez-en à votre médecin : c''est une information importante pour adapter l''accompagnement.', array['family','newborn','child']::text[], null, null, null, null, false, array['quotidien','routines','accompagnement','neurodéveloppement','neuro','neuro-daily']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Mon Parcours Handicap — Qu’est-ce que le trouble du déficit d’attention avec ou sans hyperactivité (TDAH) ?","url":"https://www.monparcourshandicap.gouv.fr/actualite/quest-ce-que-le-trouble-du-deficit-dattention-avec-ou-sans-hyperactivite-tdah","consulted_on":"2026-10-21","published":"2026-06-09"},{"label":"Mon Parcours Handicap — Troubles dys : quels aménagements pour la scolarité ?","url":"https://www.monparcourshandicap.gouv.fr/actualite/troubles-dys-quels-amenagements-pour-la-scolarite","consulted_on":"2026-10-21","published":"2025-10-10"},{"label":"Santé.fr — Repérage et prise en soins des troubles du neuro-développement grâce aux Plateformes de Coordination et d’Orientation (PCO)","url":"https://www.sante.fr/reperage-et-prise-en-soins-des-troubles-du-neuro-developpement-grace-aux-plateformes-de-coordination","consulted_on":"2026-10-21","published":"2024-02-07"},{"label":"Santé.fr (Psycom) — La santé mentale des parents","url":"https://www.sante.fr/node/8433119","consulted_on":"2026-10-21","published":"2025-08-04"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-soutien-aux-parents', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Prendre soin de soi quand on accompagne son enfant', 'Fatigue, inquiétude, démarches : les parents aussi ont besoin de soutien ; répit, associations et professionnels de santé mentale peuvent vous aider.', 'Rendez-vous, démarches, nuits courtes, inquiétudes… Accompagner un enfant qui a des difficultés de développement peut être épuisant. Prendre soin de vous n''est pas un luxe : c''est aussi prendre soin de votre enfant.

Seuls des professionnels peuvent poser un diagnostic, pour votre enfant comme pour vous : si vous ne vous sentez pas bien, parlez-en.

### Repérer l''épuisement
On parle d''épuisement parental (burn-out parental) quand on ressent à la fois :
- une **fatigue extrême** ;
- une **distance** avec ses enfants, l''impression de faire les choses « comme un robot » ;
- une **perte de plaisir** à être parent.

Ce n''est pas un manque d''amour : c''est le signe que les contraintes dépassent les ressources.

### Le répit : souffler pour mieux continuer
- **Se faire relayer** : par le coparent, un proche, une baby-sitter, un centre de loisirs.
- **Accueil de jour ou temporaire** et **séjours adaptés**, souvent sur décision de la MDPH ; en urgence, un accueil est parfois possible sans notification.
- **Répit à domicile** : un professionnel vient prendre le relais chez vous.
- **Aide à domicile** de la Caf (technicienne d''intervention sociale et familiale), selon vos revenus.
- **Congé de proche aidant** et allocation journalière du proche aidant, pour s''absenter du travail.
- L''AEEH ou la PCH peuvent financer certains frais de répit.

### Ne pas rester seul
- Les **associations** de familles (par exemple HyperSupers – TDAH France pour le TDAH) écoutent, informent et mettent en lien avec d''autres parents.
- Les **groupes et cafés de parents**, les lieux d''accueil enfants-parents, les points écoute parents.
- Les **centres de ressources autisme** et la Maison de l''autisme pour l''autisme.

### Quand en parler et à qui
- Votre **médecin généraliste**, qui peut aussi vous orienter vers un psychologue ou un psychiatre.
- Le **0 800 360 360**, gratuit, pour trouver des solutions près de chez vous.
- Le **0 800 71 40 40** (Autisme Info Service) pour les questions liées à l''autisme.
- En cas d''idées suicidaires, appelez le **3114**, numéro national de prévention du suicide, ou rendez-vous aux urgences.', array['family','newborn','child']::text[], null, null, null, null, false, array['parents','répit','épuisement parental','santé mentale','aidants','neuro','neuro-parents']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"Santé.fr (Psycom) — La santé mentale des parents","url":"https://www.sante.fr/node/8433119","consulted_on":"2026-10-21","published":"2025-08-04"},{"label":"Mon Parcours Handicap — Les solutions de répit pour les aidants","url":"https://www.monparcourshandicap.gouv.fr/aides/les-solutions-de-repit-pour-les-aidants","consulted_on":"2026-10-21","published":"2025-11-27"},{"label":"Maison de l’autisme — Fiche pratique « Proche aidant de personne autiste »","url":"https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Proche-aidant-de-personne-autiste.pdf","consulted_on":"2026-10-21"},{"label":"Mon Parcours Handicap — Qu’est-ce que le trouble du déficit d’attention avec ou sans hyperactivité (TDAH) ?","url":"https://www.monparcourshandicap.gouv.fr/actualite/quest-ce-que-le-trouble-du-deficit-dattention-avec-ou-sans-hyperactivite-tdah","consulted_on":"2026-10-21","published":"2026-06-09"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values ('neuro-vous-netes-pas-seuls', (select id from public.content_categories where slug = 'neurodeveloppement'), 'Vous n’êtes pas seuls', 'Des milliers de familles vivent des questionnements semblables, et des dispositifs, des professionnels et des associations existent pour vous accompagner pas à pas.', 'Se poser des questions sur le développement de son enfant peut donner l''impression d''être perdu, ou d''être le seul dans cette situation. Ce n''est pas le cas.

Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.

### Beaucoup de familles sont concernées
Selon les sources officielles, les troubles du neurodéveloppement concernent environ **5 % de la population**, soit environ 35 000 naissances chaque année en France. Ils regroupent l''autisme, le TDAH, les troubles dys, les troubles du langage, les troubles du développement intellectuel. Beaucoup de parents ont donc connu les mêmes doutes que vous.

### Ce n''est la faute de personne
Ces troubles sont liés à la façon dont le cerveau se développe, un processus qui commence avant même la naissance. Pour l''autisme par exemple, les sources officielles rappellent que la personnalité des parents ne joue aucun rôle. Vous n''avez rien « raté ».

### Des aides existent, même sans diagnostic
- Les **plateformes de coordination et d''orientation** permettent de commencer bilans et interventions **avant** un diagnostic, sur prescription d''un médecin.
- L''**école** peut adapter la scolarité, avec ou sans dossier MDPH.
- La **MDPH** ouvre des droits lorsque c''est nécessaire.
- Agir tôt aide l''enfant à progresser : chaque enfant peut continuer à se développer avec un accompagnement adapté.

### Des personnes à qui parler
- Votre **médecin**, votre **pédiatre**, la **PMI**.
- **Autisme Info Service** : 0 800 71 40 40, gratuit, pour les familles et les proches.
- Le **0 800 360 360** pour les personnes handicapées et leurs aidants.
- Le **0 805 805 110** pour les questions sur l''école inclusive.
- Les **associations** de familles et les groupes de parents, où l''on échange avec d''autres qui sont passés par là.

### Un pas après l''autre
Vous n''avez pas besoin de tout comprendre ni de tout faire aujourd''hui. Notez vos questions, faites une démarche à la fois, entourez-vous. Votre enfant reste avant tout votre enfant, avec ses forces, sa personnalité et sa façon unique de grandir.

Et si vous sentez que c''est trop lourd, dites-le : demander de l''aide, c''est déjà avancer.', array['family','newborn','child']::text[], null, null, null, null, false, array['soutien','familles','associations','neurodéveloppement','neuro','neuro-not_alone']::text[], 'Rédaction assistée par une IA (Claude, Anthropic)', '[{"label":"ARS Nouvelle-Aquitaine — Troubles du neurodéveloppement (TND)","url":"https://www.nouvelle-aquitaine.ars.sante.fr/troubles-du-neurodeveloppement-tnd","consulted_on":"2026-10-21","published":"2026-06-10"},{"label":"Santé.fr — Repérage et prise en soins des troubles du neuro-développement grâce aux Plateformes de Coordination et d’Orientation (PCO)","url":"https://www.sante.fr/reperage-et-prise-en-soins-des-troubles-du-neuro-developpement-grace-aux-plateformes-de-coordination","consulted_on":"2026-10-21","published":"2024-02-07"},{"label":"info.gouv.fr — La plateforme d’écoute « Autisme Info Service » est désormais accessible","url":"https://www.info.gouv.fr/actualite/la-plateforme-d-ecoute-autisme-info-service-accessible-des-le-2-avril","consulted_on":"2026-10-21","published":"2022-02-23"},{"label":"Maison de l’autisme — Fiche pratique « Proche aidant de personne autiste »","url":"https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Proche-aidant-de-personne-autiste.pdf","consulted_on":"2026-10-21"},{"label":"Maison de l’autisme — Fiche pratique « Qu’est-ce que l’autisme ? »","url":"https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Quest-ce-que-lautisme.pdf","consulted_on":"2026-10-21"}]'::jsonb, '2026-10-21', 'published', 'to_review', false, false) on conflict (slug) do nothing;
