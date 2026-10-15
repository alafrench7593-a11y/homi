-- =====================================================================
-- Toi & Moi — Données de DÉVELOPPEMENT (fictives)
-- Ne jamais exécuter en production.
-- Comptes : camille@exemple.test / alex@exemple.test — mot de passe : ToiEtMoi!2026
-- =====================================================================

-- ---------------------------------------------------------------------
-- Ressources d'urgence (France) — gratuites, toujours visibles
-- ---------------------------------------------------------------------
insert into public.emergency_resources (country, label, phone, description, kind, available, position) values
 ('FR','SAMU','15','Urgence médicale : malaise, difficulté à respirer, bébé qui ne réagit pas, réaction allergique grave.','emergency','24 h/24, 7 j/7',1),
 ('FR','Numéro d''urgence européen','112','Urgence, partout dans l''Union européenne, y compris depuis un téléphone sans forfait.','emergency','24 h/24, 7 j/7',2),
 ('FR','Prévention du suicide','3114','Si vous pensez au suicide, si vous avez peur de vous faire du mal, ou si vous vous inquiétez pour un proche. Gratuit et confidentiel.','suicide_prevention','24 h/24, 7 j/7',3),
 ('FR','Enfance en danger','119','Si un enfant est en danger ou en risque de l''être, ou si vous avez peur de faire du mal à votre enfant.','parenting_support','24 h/24, 7 j/7',4),
 ('FR','Violences Femmes Info','3919','Écoute et orientation pour les femmes victimes de violences et leur entourage.','violence','24 h/24, 7 j/7',5),
 ('FR','Urgence par SMS (personnes sourdes ou malentendantes)','114','Contacter les secours par SMS, fax ou application.','emergency','24 h/24, 7 j/7',6);

-- ---------------------------------------------------------------------
-- Forums
-- ---------------------------------------------------------------------
-- Les 15 espaces sont aussi créés par la migration 20261016000300 : upsert par slug.
insert into public.forums (slug, title, description, journeys, icon, is_local, position) values
 ('eviter-grossesse','Éviter une grossesse','Contraception, oublis, questions avant une consultation, ressentis.','{avoid}','shield',false,1),
 ('projet-bebe','Projet bébé','Essayer d''avoir un enfant, attendre, espérer, se soutenir.','{ttc}','sparkles',false,2),
 ('fertilite','Fertilité','Parcours de PMA, examens, attente et soutien entre personnes concernées.','{ttc}','fertility',false,3),
 ('grossesse','Grossesse','Questions et partages pendant la grossesse.','{pregnant}','moon',false,4),
 ('jumeaux-triples','Jumeaux et triplés','Grossesses multiples et familles de jumeaux ou triplés.','{pregnant,newborn,child}','twins',false,5),
 ('accouchement','Accouchement','Se préparer, raconter son accouchement, projet de naissance.','{pregnant}','birth',false,6),
 ('post-partum','Post-partum','Après la naissance : récupération, émotions, quotidien.','{newborn}','heart',false,7),
 ('allaitement','Allaitement','Allaitement, tire-lait, sevrage, et allaitement mixte.','{newborn}','drop',false,8),
 ('biberon','Biberon','Préparation, quantités, choix du lait, passage au biberon.','{newborn}','bottle',false,9),
 ('sommeil','Sommeil','Nuits, siestes, rituels du coucher, fatigue des parents.','{newborn,child}','sleep',false,10),
 ('diversification','Diversification','Premiers repas, textures, allergènes, idées de menus.','{newborn,child}','food',false,11),
 ('parents-bebes','Parents de bébés','Le quotidien avec un bébé de 0 à 2 ans.','{newborn,child}','baby',false,12),
 ('parents-enfants','Parents d’enfants','De 2 à 10 ans : école, émotions, organisation.','{child,family}','sun',false,13),
 ('familles-nombreuses','Familles nombreuses','Organiser la vie avec plusieurs enfants.','{family}','users',false,14),
 ('rencontres-locales','Rencontres locales','Proposer une rencontre dans un lieu public, par zone générale uniquement.','{}','map',true,15)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, journeys = excluded.journeys, icon = excluded.icon,
  is_local = excluded.is_local, position = excluded.position, archived = false;

insert into public.moderation_terms (pattern, action, reason) values
 ('\m(viagra|casino|crypto ?monnaie)\M','block','spam'),
 ('(vends?|achète|acheter|vente).{0,20}lait maternel','review','vente de lait maternel'),
 ('\m(arrêtez|arrête|arrêter) (le|son|votre) traitement\M','review','conseil médical potentiellement dangereux'),
 ('\m(mon|notre) adresse (est|:)','review','donnée personnelle');

-- ---------------------------------------------------------------------
-- Catégories et articles
-- Les articles ci-dessous sont des TEXTES DE DÉVELOPPEMENT : ils n'ont
-- été relus par aucun professionnel (reviewer_name = NULL). L'application
-- l'affiche clairement. Les sources pointent vers les sites officiels ;
-- la page exacte doit être renseignée lors de la relecture.
-- ---------------------------------------------------------------------
insert into public.content_categories (slug, label, icon, position) values
 ('grossesse','Grossesse','moon',1),('accouchement','Accouchement','sparkles',2),('post-partum','Après la naissance','heart',3),
 ('sante-mentale','Émotions & sante mentale','leaf',4),('bebe','Bébé au quotidien','baby',5),('alimentation','Alimentation','bowl',6),
 ('enfant','Enfant','sun',7),('cycle','Cycle & contraception','circle',8),('reeducation','Rééducation','flower',9);

with s as (select
  '[{"label":"Assurance Maladie — ameli.fr","url":"https://www.ameli.fr"},{"label":"1000 premiers jours","url":"https://www.1000-premiers-jours.fr"}]'::jsonb as ameli_1000,
  '[{"label":"Santé publique France","url":"https://www.santepubliquefrance.fr"},{"label":"3114 — numéro national de prévention du suicide","url":"https://3114.fr"}]'::jsonb as mental,
  '[{"label":"Haute Autorité de santé","url":"https://www.has-sante.fr"},{"label":"Assurance Maladie — ameli.fr","url":"https://www.ameli.fr"}]'::jsonb as has_ameli
)
insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, status, is_premium, is_safety_critical)
select v.slug, (select id from public.content_categories where slug = v.cat), v.title, v.summary, v.body, v.journeys, v.minw, v.maxw, v.mina, v.maxa, v.pp, v.tags, 'Équipe éditoriale Toi & Moi (brouillon)', v.src, 'published', v.premium, v.safety
from s cross join lateral (values
 ('baby-blues-ou-depression','sante-mentale','Baby blues ou dépression du post-partum ?',
  'Deux réalités différentes, et toutes deux méritent d''être prises au sérieux.',
  E'Dans les jours qui suivent la naissance, beaucoup de personnes traversent des moments de larmes, d''irritabilité ou de fatigue intense. On parle souvent de **baby blues** : il apparaît généralement dans les premiers jours et s''estompe en quelques jours.\n\nQuand la tristesse, l''anxiété, la perte d''intérêt ou l''épuisement **durent plus de deux semaines**, s''aggravent, ou apparaissent plus tard dans la première année, il peut s''agir d''une **dépression du post-partum**. Elle peut toucher la mère comme le coparent. Ce n''est ni une faiblesse ni un échec : cela se soigne.\n\n### Ce qui peut aider\n- En parler à une personne de confiance.\n- En parler à votre sage-femme, votre médecin ou votre PMI : ils sont là pour ça.\n- Accepter l''aide pour les repas, les nuits, les courses.\n\n### Quand appeler tout de suite\nSi vous avez des idées de suicide, peur de vous faire du mal ou de faire du mal à votre bébé : appelez le **3114** (prévention du suicide, 24 h/24) ou le **15**. Vous n''êtes pas seule, et vous n''êtes pas seul.',
  '{newborn}'::text[], null::int, null::int, 0, 12, true, '{emotions,post-partum}'::text[], s.mental, false, true),
 ('demander-de-l-aide','sante-mentale','Comment demander de l''aide quand on n''y arrive plus',
  'Des mots simples pour oser dire « j''ai besoin d''aide ».',
  E'Il n''est pas toujours facile de dire que l''on ne va pas bien, surtout quand on a l''impression que tout le monde attend de nous du bonheur.\n\nQuelques phrases peuvent aider à commencer :\n- « Je suis épuisée et j''ai besoin que tu prennes une nuit. »\n- « Je ne me reconnais pas en ce moment, est-ce qu''on peut en parler ? »\n- À un professionnel : « Je me sens triste ou inquiète presque tous les jours depuis plus de deux semaines. »\n\nLa sage-femme, le médecin traitant, le pédiatre ou la PMI peuvent vous orienter. En cas de danger immédiat : **15**, **112** ou **3114**.',
  '{newborn,pregnant}'::text[], null, null, null, null, true, '{emotions}'::text[], s.mental, false, true),
 ('valise-maternite','accouchement','Préparer sa valise de maternité',
  'L''essentiel pour vous, pour bébé et pour les papiers — à adapter à votre maternité.',
  E'Beaucoup de personnes préparent leur valise vers la fin du deuxième trimestre ou au début du troisième, pour être tranquilles. Votre maternité vous remettra souvent sa propre liste : elle prime sur toute liste générale.\n\n### Les papiers\nCarte Vitale, pièce d''identité, dossier de suivi de grossesse, résultats d''examens, carte de groupe sanguin si vous l''avez.\n\n### Pour vous\nVêtements confortables, sous-vêtements adaptés, protections, nécessaire de toilette, chargeur, de quoi grignoter.\n\n### Pour bébé\nQuelques bodies et pyjamas, un bonnet, des chaussettes, une gigoteuse ou une couverture, un siège auto adapté pour le retour.\n\nVous pouvez cocher chaque élément dans la liste « Valise de maternité » de l''onglet Suivi.',
  '{pregnant}'::text[], 24, 41, null, null, false, '{preparation}'::text[], s.ameli_1000, false, false),
 ('signes-du-travail','accouchement','Reconnaître les signes du travail',
  'Contractions, perte des eaux, saignements : quand partir à la maternité ?',
  E'Chaque accouchement est différent. Votre sage-femme ou votre maternité vous indiquera **quand venir**, selon votre situation : suivez en priorité ses consignes.\n\n### Signes fréquents\n- Des contractions qui deviennent régulières, de plus en plus rapprochées et intenses.\n- Une perte des eaux (liquide clair qui s''écoule).\n\n### Appelez ou partez sans attendre si\n- Vous perdez du sang rouge.\n- Le liquide perdu est teinté (vert, marron) ou vous perdez les eaux avant terme.\n- Vous sentez moins bouger votre bébé.\n- Vous avez de la fièvre, un mal de tête intense, des troubles de la vue, une douleur inhabituelle.\n\nEn cas de doute, appelez votre maternité ou le **15**.',
  '{pregnant}'::text[], 30, 42, null, null, false, '{travail}'::text[], s.has_ameli, false, true),
 ('cesarienne','accouchement','Césarienne programmée ou en urgence',
  'Comprendre ce qui peut se passer, sans jugement.',
  E'Une césarienne peut être **programmée** à l''avance pour des raisons médicales, ou décidée **pendant le travail** par l''équipe. Dans les deux cas, c''est un accouchement à part entière.\n\nSi votre accouchement ne ressemble pas à ce que vous aviez imaginé, ce que vous ressentez est légitime. Vous n''avez pas « échoué ». En parler à l''équipe, à votre sage-femme ou lors du rendez-vous postnatal peut aider à mettre des mots sur ce vécu.\n\nAprès une césarienne, la récupération demande du temps : demandez à l''équipe quels mouvements éviter, comment soulager la douleur et quand reprendre la conduite ou le sport.',
  '{pregnant,newborn}'::text[], 28, 42, null, null, true, '{accouchement}'::text[], s.has_ameli, false, false),
 ('premiers-jours-retour-maison','post-partum','Les premiers jours à la maison',
  'Repos, visites, saignements, aide : s''organiser sans culpabiliser.',
  E'Le retour à la maison est souvent un mélange de joie et de fatigue. Il n''y a pas de rythme « normal » à atteindre.\n\n- **Limiter les visites** si vous en avez besoin.\n- **Les saignements** (lochies) diminuent progressivement sur plusieurs semaines. Des saignements très abondants, des caillots importants, de la fièvre ou une douleur qui augmente doivent faire **consulter rapidement**.\n- **La sage-femme à domicile** peut passer après la sortie : n''hésitez pas à poser vos questions.\n\nPensez aussi à vous : manger, boire, dormir dès que possible.',
  '{newborn}'::text[], null, null, 0, 2, true, '{retour-maison}'::text[], s.ameli_1000, false, false),
 ('perinee-role','reeducation','À quoi sert le périnée ?',
  'Un ensemble de muscles discret mais essentiel, mis à rude épreuve par la grossesse.',
  E'Le périnée est un ensemble de muscles et de tissus situé au fond du bassin. Il soutient la vessie, l''utérus et le rectum, et participe à la continence.\n\nLa grossesse et l''accouchement peuvent l''affaiblir, quel que soit le mode d''accouchement. Des fuites urinaires, une sensation de pesanteur ou de gêne ne sont **pas une fatalité** : parlez-en lors du rendez-vous postnatal.\n\nLa rééducation périnéale se fait avec une sage-femme ou un kinésithérapeute, après une évaluation adaptée à votre accouchement. Cette application ne propose pas de programme d''exercices personnalisé.',
  '{newborn}'::text[], null, null, 0, 12, true, '{perinee}'::text[], s.has_ameli, false, false),
 ('diastasis','reeducation','Diastasis des grands droits : comprendre',
  'L''écartement des muscles abdominaux après la grossesse, et à qui en parler.',
  E'Pendant la grossesse, les muscles grands droits de l''abdomen s''écartent pour laisser de la place au bébé. Après la naissance, cet écart se réduit souvent progressivement.\n\nSi vous remarquez un « renflement » au milieu du ventre quand vous vous redressez, ou des douleurs dans le dos, parlez-en à votre sage-femme, votre médecin ou un kinésithérapeute. Ils pourront évaluer la situation et vous dire quand et comment reprendre une activité.\n\nLa rééducation abdominale se fait **généralement après** la rééducation du périnée.',
  '{newborn}'::text[], null, null, 0, 12, true, '{abdominaux}'::text[], s.has_ameli, false, false),
 ('debut-diversification','alimentation','Commencer la diversification',
  'Quand et comment proposer les premiers aliments, à votre rythme et à celui de bébé.',
  E'Les recommandations françaises actuelles indiquent de commencer la diversification **entre 4 et 6 mois**, et pas avant 4 mois, en accord avec le médecin ou le pédiatre qui suit votre enfant.\n\n- Le lait reste l''aliment principal pendant la première année.\n- Les aliments allergènes (œuf, arachide en poudre ou purée lisse, poisson…) peuvent être introduits **dès le début** de la diversification, sans attendre, sauf avis médical contraire.\n- Les textures évoluent progressivement : lisse, puis écrasé, puis petits morceaux fondants.\n\n### Réaction après un aliment\nEn cas de gêne respiratoire, gonflement du visage ou de la bouche, vomissements répétés ou malaise : **appelez le 15**.',
  '{newborn,child}'::text[], null, null, 4, 12, false, '{diversification,allergenes}'::text[], s.ameli_1000, false, false),
 ('fromages-grossesse','grossesse','Fromages et grossesse : ce qu''il faut savoir',
  'Le lait cru, les pâtes molles et la listériose, expliqués simplement.',
  E'Pendant la grossesse, il est recommandé d''éviter certains aliments en raison du risque de **listériose** et de **toxoplasmose**.\n\nPour les fromages, les recommandations officielles conseillent généralement d''éviter les **fromages au lait cru** (sauf fromages à pâte pressée cuite, type comté ou emmental, selon les recommandations en vigueur) et de retirer la croûte des fromages. Vérifiez l''étiquette : la mention « au lait cru » doit y figurer.\n\nCes recommandations peuvent évoluer : référez-vous aux sources officielles à jour et à votre professionnel de santé.',
  '{pregnant}'::text[], 0, 42, null, null, false, '{alimentation}'::text[], s.ameli_1000, false, false),
 ('cycle-fenetre-fertile','cycle','Le cycle et la « fenêtre fertile » : des estimations',
  'Pourquoi un calendrier ne peut jamais garantir quoi que ce soit.',
  E'Le cycle menstruel dure en moyenne autour de 28 jours, mais il varie d''une personne à l''autre et d''un mois à l''autre. L''ovulation survient souvent environ 14 jours **avant** les règles suivantes — ce qui la rend difficile à prévoir à l''avance.\n\nLes dates affichées dans l''application sont des **estimations** calculées à partir de vos saisies. Elles ne permettent **ni de garantir une grossesse, ni de l''éviter**. Pour éviter une grossesse, parlez de contraception avec un médecin, une sage-femme ou un centre de santé sexuelle.',
  '{avoid,ttc}'::text[], null, null, null, null, false, '{cycle}'::text[], s.has_ameli, false, true),
 ('contraception-urgence','cycle','Contraception d''urgence',
  'Que faire après un rapport non ou mal protégé ?',
  E'Après un rapport non protégé (oubli de pilule, préservatif qui a glissé…), une **contraception d''urgence** peut être utilisée. Plus elle est prise tôt, plus elle est efficace.\n\n- La pilule de contraception d''urgence est disponible en pharmacie.\n- Le stérilet au cuivre peut aussi être posé comme contraception d''urgence par un professionnel.\n\nUn pharmacien, un médecin, une sage-femme ou un centre de santé sexuelle peuvent vous conseiller, de façon confidentielle. Pensez aussi au dépistage des infections sexuellement transmissibles.',
  '{avoid}'::text[], null, null, null, null, false, '{contraception}'::text[], s.has_ameli, false, true),
 ('hormones-apres-naissance','post-partum','Hormones après la naissance : ce qui change',
  'Une chute hormonale importante, qui n''explique pas tout.',
  E'Après l''accouchement, les taux d''œstrogènes et de progestérone chutent rapidement. Ces changements peuvent jouer sur l''humeur, le sommeil, la peau, les cheveux ou la libido. L''allaitement modifie aussi l''équilibre hormonal (la prolactine notamment) et peut retarder le retour des règles.\n\nAttention : **les hormones n''expliquent pas tout**. Une grande tristesse, une douleur, une fatigue extrême ou un symptôme qui dure ne doivent jamais être mis uniquement sur le compte des hormones. Parlez-en à un professionnel.',
  '{newborn}'::text[], null, null, 0, 12, true, '{hormones}'::text[], s.ameli_1000, true, false),
 ('nuits-jumeaux','bebe','Organiser les nuits avec des jumeaux',
  'Des pistes concrètes pour tenir dans la durée, à adapter à votre famille.',
  E'Avec deux (ou trois) bébés, l''organisation des nuits devient un vrai sujet d''équipe.\n\n- **Se relayer** par tranches horaires plutôt que de se lever à deux à chaque réveil.\n- **Noter** tétées, biberons et couches de chaque bébé séparément : l''onglet Suivi le permet, bébé par bébé.\n- **Accepter l''aide** extérieure pour une nuit ou une sieste.\n\nChaque bébé a son propre rythme : il est normal qu''ils ne soient pas synchronisés, et il n''y a pas lieu de les comparer.',
  '{newborn,family}'::text[], null, null, 0, 24, false, '{jumeaux,sommeil}'::text[], s.ameli_1000, true, false)
) v(slug, cat, title, summary, body, journeys, minw, maxw, mina, maxa, pp, tags, src, premium, safety);

-- ---------------------------------------------------------------------
-- Aliments (diversification) et prénoms
-- ---------------------------------------------------------------------
insert into public.foods (name, category, is_major_allergen, allergen_group, source) values
 ('Carotte','légume',false,null,'dev'),('Courgette','légume',false,null,'dev'),('Patate douce','légume',false,null,'dev'),
 ('Brocoli','légume',false,null,'dev'),('Petits pois','légume',false,null,'dev'),('Pomme','fruit',false,null,'dev'),
 ('Poire','fruit',false,null,'dev'),('Banane','fruit',false,null,'dev'),('Œuf (bien cuit)','protéine',true,'œuf','dev'),
 ('Poisson blanc','protéine',true,'poisson','dev'),('Purée d''arachide lisse (diluée)','protéine',true,'arachide','dev'),
 ('Yaourt nature','laitage',true,'lait','dev'),('Lentilles corail','légumineuse',false,null,'dev'),('Blé (semoule fine)','féculent',true,'gluten','dev'),
 ('Poulet','protéine',false,null,'dev'),('Avocat','fruit',false,null,'dev');

insert into public.baby_names (name, usage, origin, meaning) values
 ('Camille','{mixed}','latine','servant(e) lors des cérémonies'),('Sacha','{mixed}','russe','diminutif d''Alexandre, « protecteur »'),
 ('Charlie','{mixed}','germanique','« homme libre »'),('Noa','{mixed}','hébraïque','« mouvement »'),('Eden','{mixed}','hébraïque','« délice »'),
 ('Lou','{mixed}','germanique','diminutif de Louise / Louis'),('Alix','{mixed}','germanique','« noble »'),('Maël','{masculine,mixed}','bretonne','« prince »'),
 ('Jade','{feminine}','espagnole','pierre précieuse'),('Louise','{feminine}','germanique','« glorieuse au combat »'),('Ambre','{feminine}','arabe','résine fossile dorée'),
 ('Inès','{feminine}','grecque','« pure »'),('Lina','{feminine}','arabe','« tendre »'),('Rose','{feminine}','latine','la fleur'),('Mila','{feminine}','slave','« chère »'),
 ('Iris','{feminine}','grecque','« arc-en-ciel »'),('Aya','{feminine}','arabe / japonaise','« signe », « couleur »'),('Nour','{feminine,mixed}','arabe','« lumière »'),
 ('Gabriel','{masculine}','hébraïque','« force de Dieu »'),('Léo','{masculine}','latine','« lion »'),('Raphaël','{masculine}','hébraïque','« Dieu guérit »'),
 ('Adam','{masculine}','hébraïque','« homme », « terre »'),('Louis','{masculine}','germanique','« glorieux au combat »'),('Noé','{masculine}','hébraïque','« repos »'),
 ('Malo','{masculine}','bretonne','« brillant », « gage »'),('Ilyes','{masculine}','hébraïque / arabe','forme d''Élie'),('Kenzo','{masculine}','japonaise','« sage », « en bonne santé »'),
 ('Timéo','{masculine}','grecque','« qui honore Dieu »'),('Amara','{feminine}','igbo / sanskrite','« grâce », « éternelle »'),('Kofi','{masculine}','akan','« né un vendredi »');

-- ---------------------------------------------------------------------
-- Produits FICTIFS (base de démonstration, is_demo = true)
-- ---------------------------------------------------------------------
insert into public.products (barcode, name, brand, category, ingredients, declared_allergens, attributes, data_source, data_retrieved_at, is_demo) values
 ('0000000000017','Crème change démo','Marque Démo','cream', array['Aqua','Zinc oxide','Glycerin','Parfum'], '{}', '{"fragrance":true}', 'Base fictive de démonstration', current_date, true),
 ('0000000000024','Brie au lait cru démo','Fromagerie Démo','food', array['Lait cru de vache','Sel','Ferments lactiques','Présure'], array['lait'], '{"raw_milk":true,"cheese_type":"soft"}', 'Base fictive de démonstration', current_date, true),
 ('0000000000031','Comté démo','Fromagerie Démo','food', array['Lait cru de vache','Sel','Ferments','Présure'], array['lait'], '{"raw_milk":true,"cheese_type":"hard_cooked"}', 'Base fictive de démonstration', current_date, true),
 ('0000000000048','Lingettes bébé démo','Marque Démo','wipes', array['Aqua','Glycerin','Sodium benzoate'], '{}', '{"fragrance":false}', 'Base fictive de démonstration', current_date, true),
 ('0000000000055','Purée pomme-poire démo','Petits Pots Démo','food', array['Pomme 60 %','Poire 40 %'], '{}', '{"min_age_months":4}', 'Base fictive de démonstration', current_date, true);

insert into public.product_recalls (barcode, lot_numbers, title, reason, recommended_action, official_url, source, published_on, is_demo)
values ('0000000000024', array['L2026-09'], 'Brie au lait cru démo (lot L2026-09)', 'Exemple fictif : présence possible de Listeria monocytogenes.',
        'Exemple fictif : ne pas consommer, rapporter au point de vente.', 'https://rappel.conso.gouv.fr', 'Rappel fictif de démonstration — format RappelConso', current_date, true);

-- ---------------------------------------------------------------------
-- Comptes de développement
-- ---------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('11111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','camille@exemple.test',
  extensions.crypt('ToiEtMoi!2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
 ('22222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','alex@exemple.test',
  extensions.crypt('ToiEtMoi!2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
 (gen_random_uuid(),'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"camille@exemple.test","email_verified":true}','email',now(),now(),now()),
 (gen_random_uuid(),'22222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222',
  '{"sub":"22222222-2222-4222-8222-222222222222","email":"alex@exemple.test","email_verified":true}','email',now(),now(),now());

update public.profiles set display_name = 'Camille', journeys = '{pregnant,child,family}', onboarding_completed = true
 where id = '11111111-1111-4111-8111-111111111111';
update public.profiles set display_name = 'Alex', journeys = '{pregnant,child}', onboarding_completed = true
 where id = '22222222-2222-4222-8222-222222222222';
insert into public.user_roles values ('11111111-1111-4111-8111-111111111111','admin', now());

insert into public.households (id, name, created_by) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Famille Martin','11111111-1111-4111-8111-111111111111');
insert into public.household_members (household_id, user_id, role, can_view, can_edit) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','coparent',
  array['daily','health','documents','pregnancy','lists','names','profile'], array['daily','lists','names']);

insert into public.pregnancies (id, household_id, carrier_user_id, due_date, multiplicity, topics) values
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',
  current_date + 105, 'twins', '{accouchement,allaitement}');
insert into public.expected_babies (pregnancy_id, household_id, position, nickname) values
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,'Petite Lune'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',2,'Petit Soleil');

insert into public.children (id, household_id, first_name, birth_date, sex) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Lina', current_date - 400, 'female'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Noé', current_date - 2200, null);

insert into public.child_measurements (child_id, household_id, measured_on, weight_kg, height_cm, source) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date - 300, 7.4, 66.0, 'professional'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date - 200, 8.6, 71.5, 'professional'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date - 60, 9.9, 77.0, 'home');

insert into public.bottles (child_id, household_id, at, prepared_ml, consumed_ml, milk_type) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now() - interval '3 hours', 210, 180, 'Lait 2e âge');
insert into public.diapers (child_id, household_id, at, wet, stool) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now() - interval '2 hours', true, false);
insert into public.sleeps (child_id, household_id, started_at, ended_at, wakeups) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now() - interval '14 hours', now() - interval '4 hours', 1);

insert into public.appointments (household_id, pregnancy_id, kind, title, starts_at, location_label, questions) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','ultrasound','Échographie du 3e trimestre', now() + interval '9 days', 'Maternité',
  array['Comment se positionnent les bébés ?','Faut-il prévoir une consultation d''anesthésie ?']);

insert into public.checklists (id, household_id, pregnancy_id, kind, title) values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','maternity_bag','Valise de maternité');
insert into public.checklist_items (checklist_id, household_id, label, position, done) values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Carte Vitale et pièce d''identité',1,true),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Dossier de suivi de grossesse',2,false),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Bodies et pyjamas (x2 bébés)',3,false),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Deux sièges auto adaptés',4,false);

insert into public.community_profiles (user_id, pseudonym, area_label) values
 ('11111111-1111-4111-8111-111111111111','CamilleEtLesJumeaux','Île-de-France'),
 ('22222222-2222-4222-8222-222222222222','Alex_papa','Île-de-France');
insert into public.posts (forum_id, author_id, title, body) values
 ((select id from public.forums where slug='jumeaux-triples'),'11111111-1111-4111-8111-111111111111',
  'Vos astuces pour préparer l''arrivée de jumeaux ?', 'Nous attendons des jumeaux pour l''hiver. Qu''est-ce qui vous a le plus aidés les premières semaines ?'),
 ((select id from public.forums where slug='sommeil'),'22222222-2222-4222-8222-222222222222',
  'Réveils à 5 h du matin', 'Notre fille de 15 mois se réveille tous les jours à 5 h. Des idées pour décaler un peu le réveil ?');
