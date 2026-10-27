/**
 * Guide complet — lot 14 (27/10/2026) : sport et activités des 6–10 ans
 * (repères d'activité, choix et rythme, questionnaire de santé et certificat, disciplines une à une,
 * motivation, alimentation, chaleur, petites blessures, asthme, surpoids, handicap, extrascolaire, Pass'Sport, violences).
 * Articles rédigés avec l'aide d'une IA à partir de pages officielles ou de référence françaises réellement consultées le 2026-10-27
 * (Santé.fr / Santé publique France, mpedia, ministère des Sports, ministère de l'Éducation nationale, Service-Public.fr,
 * DGCCRF, ameli.fr, ARS, Mon Parcours Handicap, monenfant.fr) : statut « À vérifier ».
 * Aucune marque citée ; les choix de matériel renvoient au marquage CE, aux normes et aux notices.
 */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27. `published` = date de publication, de mise à jour ou de vérification affichée par la page.
const S = {
  santeAP611: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Activité physique de 6 à 11 ans : l’aider à bouger au quotidien', url: 'https://www.sante.fr/node/800507', consulted_on: C, published: '2022-08-30' },
  santeSport: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Les accompagner dans la pratique d’un sport', url: 'https://www.sante.fr/node/800509', consulted_on: C, published: '2021-11-24' },
  mpediaChoix: { label: 'mpedia (Association française de pédiatrie ambulatoire) — Sur quels critères choisir un sport pour mon enfant ?', url: 'https://www.mpedia.fr/art-activites-physiques-quel-sport-choisir/', consulted_on: C, published: '2023-12-22' },
  mpediaCertif: { label: 'mpedia (AFPA) — Activités sportives des enfants : le certificat d’aptitude au sport toujours obligatoire ?', url: 'https://www.mpedia.fr/art-sports-les-certificats-aptitude/', consulted_on: C, published: '2021-10-20' },
  mpediaAlim: { label: 'mpedia (AFPA) — Quelle alimentation donner à un enfant sportif', url: 'https://www.mpedia.fr/art-alimentation-enfant-sportif/', consulted_on: C, published: '2023-12-22' },
  mpediaSurpoids: { label: 'mpedia (AFPA) — Comment gérer le surpoids de votre enfant ?', url: 'https://www.mpedia.fr/art-comment-gerer-le-surpoids/', consulted_on: C, published: '2023-12-22' },
  mpediaChaleur: { label: 'mpedia (AFPA) — Insolation et coup de chaleur : causes, symptômes et prévention', url: 'https://www.mpedia.fr/art-insolation-chaleur/', consulted_on: C, published: '2023-07-21' },
  sportsQuestionnaire: { label: 'Ministère des Sports — Le certificat médical de non-contre-indication remplacé par un questionnaire de santé pour les mineurs', url: 'https://www.sports.gouv.fr/le-certificat-medical-de-non-contre-indication-la-pratique-sportive-remplace-par-un-questionnaire', consulted_on: C, published: '2021-05-08' },
  sportsLicences: { label: 'Ministère des Sports — Rentrée scolaire et prise de licences sportives (communiqué)', url: 'https://www.sports.gouv.fr/rentree-scolaire-et-prise-de-licences-sportives-2205', consulted_on: C, published: '2023-09-10' },
  sportsSRAV: { label: 'Ministère des Sports — Savoir rouler à vélo : présentation du dispositif', url: 'https://www.sports.gouv.fr/presentation-du-dispositif-611', consulted_on: C },
  sportsNoyades: { label: 'Ministère des Sports — Se baigner en toute sécurité : prévention des noyades', url: 'https://www.sports.gouv.fr/prevention-des-noyades', consulted_on: C },
  sportsAPQ: { label: 'Ministère des Sports — « 30 mn d’activité physique quotidienne » : des résultats prometteurs (communiqué)', url: 'https://www.sports.gouv.fr/30mn-d-activite-physique-quotidienne-des-resultats-prometteurs-portes-par-la-dynamique-des-jeux', consulted_on: C, published: '2024-04-04' },
  sportsSignal: { label: 'Ministère des Sports — Violences dans le sport : bilan 2025 de la cellule Signal-Sports', url: 'https://www.sports.gouv.fr/violences-dans-le-sport-bilan-2025-de-la-cellule-signal-sports-10156', consulted_on: C, published: '2026-04-23' },
  sportsAffiche: { label: 'Ministère des Sports — Affiche « Enfants, ados, adultes victimes de violences dans le sport »', url: 'https://www.sports.gouv.fr/sites/default/files/2024-07/ac-signal-sports-9606.pdf', consulted_on: C },
  sportsEducateur: { label: 'Ministère des Sports — Encadrement contre rémunération (éducateurs sportifs)', url: 'https://www.sports.gouv.fr/se-declarer-educateur-sportif', consulted_on: C },
  eduNager: { label: 'Ministère de l’Éducation nationale — Savoir nager', url: 'https://www.education.gouv.fr/savoir-nager-505262', consulted_on: C, published: '2026-08-25' },
  spPassSport: { label: 'Service-Public.fr — Le pass Sport est étendu pour la saison 2026-2027', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A15850', consulted_on: C, published: '2026-09-02' },
  spEngins: { label: 'Service-Public.fr — Trottinette, rollers, skateboard, petit vélo : règles de circulation (fiche F308)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F308', consulted_on: C, published: '2026-08-11' },
  spAssurSport: { label: 'Service-Public.fr — Assurance pour la pratique sportive', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2143', consulted_on: C, published: '2026-05-29' },
  dgccrfParcs: { label: 'DGCCRF — Jeux et loisirs sportifs : 13 parcs suspendus à la suite de contrôles', url: 'https://www.economie.gouv.fr/dgccrf/laction-de-la-dgccrf/les-enquetes-et-les-controles/jeux-et-loisirs-sportifs-13-parcs-suspendus-la-suite-de-controles', consulted_on: C, published: '2026-10-16' },
  dgccrfEPI: { label: 'DGCCRF — Équipements de protection individuelle (EPI) : choisissez un produit sûr !', url: 'https://www.economie.gouv.fr/dgccrf/laction-de-la-dgccrf/les-enquetes/equipements-de-protection-individuelle-epi-choisissez-un', consulted_on: C, published: '2020-05-05' },
  dgccrfVelo: { label: 'DGCCRF — Bicyclette et vélo à assistance électrique : conseils pour un achat en toute sécurité', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/bicyclette-et-velo-assistance-electrique-conseils-pour-un-achat-en-toute-securite', consulted_on: C, published: '2026-07-29' },
  santeChaleur: { label: 'Santé.fr — Fortes chaleurs et canicule : se protéger et protéger ses proches', url: 'https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches', consulted_on: C, published: '2026-06-22' },
  santeSoleil: { label: 'Santé.fr — Comment protéger son enfant du soleil ?', url: 'https://www.sante.fr/comment-proteger-son-enfant-du-soleil', consulted_on: C, published: '2023-07-06' },
  santeBoissons: { label: 'Santé.fr (Fédération française de cardiologie) — Les boissons énergisantes, un risque pour la santé ?', url: 'https://www.sante.fr/les-boissons-energisantes-un-risque-pour-la-sante', consulted_on: C, published: '2022-05-21' },
  santeEntorse: { label: 'Santé.fr — Entorse', url: 'https://www.sante.fr/entorse', consulted_on: C, published: '2026-08-13' },
  ameliEntorse: { label: 'ameli.fr — Entorse de la cheville : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/entorse-cheville/bons-reflexes-que-faire', consulted_on: C, published: '2026-07-02' },
  ameliAsthme: { label: 'ameli.fr — Suivi médical et vie quotidienne de l’enfant et de l’adolescent asthmatiques', url: 'https://www.ameli.fr/assure/sante/themes/asthme-enfant-plus-3-ans/suivi-medical-vie-quotidienne', consulted_on: C },
  ameliUrgences: { label: 'ameli.fr — Les situations d’urgence chez l’enfant', url: 'https://www.ameli.fr/assure/sante/enfants/situations-urgence', consulted_on: C, published: '2024-12-12' },
  arsTete: { label: 'ARS Normandie — Mon enfant s’est cogné la tête', url: 'https://www.normandie.ars.sante.fr/mon-enfant-sest-cogne-la-tete', consulted_on: C, published: '2025-03-12' },
  arsTCCL: { label: 'ARS Île-de-France — Traumatisme crânio-cérébral léger (TCCL)', url: 'https://www.iledefrance.ars.sante.fr/traumatisme-cranio-cerebral-leger-tccl-en-ile-de-france', consulted_on: C, published: '2021-01-20' },
  santeEcrans: { label: 'Santé.fr — #DerrièreLeChiffre : plus de 4 heures d’écran par jour pour les 6-17 ans, qu’est-ce que cela signifie ?', url: 'https://www.sante.fr/derrierelechiffre-plus-de-4-heures-decran-par-jour-pour-les-6-17-ans-quest-ce-que-cela-signifie', consulted_on: C, published: '2025-02-27' },
  handicapChoisir: { label: 'Mon Parcours Handicap — Comment choisir une activité sportive accessible avec son handicap ?', url: 'https://www.monparcourshandicap.gouv.fr/sport/comment-choisir-une-activite-sportive-accessible-avec-son-handicap', consulted_on: C, published: '2025-10-01' },
  monenfantLoisirs: { label: 'monenfant.fr (Cnaf) — Les accueils de loisirs après 3 ans', url: 'https://monenfant.fr/les-accueils-de-loisirs', consulted_on: C, published: '2026-09-09' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis du médecin traitant, du pédiatre ou des professionnels qui suivent votre enfant.';

const KID = { journeys: ['child'] as LibArticle['journeys'], status: 'to_review' as const, min_age_months: 72, max_age_months: 131 };

export const GUIDE_B14: LibArticle[] = [
  // ───────────────────────────── Repères généraux ─────────────────────────────
  {
    ...KID,
    slug: 'une-heure-activite-par-jour-6-10-ans-journee-type',
    title: 'Une heure d’activité par jour entre 6 et 10 ans : à quoi ressemble une journée bien remplie ?',
    summary: 'Trajets, récréation, 30 minutes d’activité à l’école, jeux dehors, club : comment les petits moments s’additionnent pour atteindre l’heure quotidienne recommandée, sans transformer la semaine en marathon.',
    category: 'sport',
    body_md: `« Au moins une heure par jour » : le repère est simple à retenir, mais beaucoup de parents se demandent comment le tenir avec l’école, les devoirs et les trajets. Bonne nouvelle : cette heure n’a pas besoin d’être faite d’un seul bloc, ni dans un club.

## En bref
- Entre 6 et 11 ans, Santé publique France recommande **au moins une heure d’activité physique par jour**, dont **trois fois par semaine des activités intenses** (danse, VTT, jeux de ballon, corde à sauter…).
- Il faut aussi **réduire le temps assis** : pendant le temps libre, se lever au moins toutes les deux heures et limiter les écrans.
- À l’école élémentaire, le dispositif des **30 minutes d’activité physique quotidienne** vient en complément de l’EPS.
- Trajets à pied ou à vélo, jeux au parc et petites tâches de la maison comptent aussi.
- Un sommeil de **9 à 11 heures** par nuit fait partie du même équilibre.

## Comprendre
Les repères pour les 6-11 ans publiés par Santé publique France (Manger Bouger) reposent sur deux idées complémentaires : **bouger davantage** et **rester moins longtemps assis**. Un enfant peut faire du sport le mercredi et passer de longues heures immobile le reste de la semaine : les deux dimensions comptent.

L’école participe à cet objectif. Depuis septembre 2022, le dispositif « 30 minutes d’activité physique quotidienne » est généralisé dans les écoles élémentaires, en complément des cours d’éducation physique et sportive. Le ministère des Sports rappelle qu’il s’appuie sur la recommandation de l’Organisation mondiale de la santé de 60 minutes d’activité par jour pour les enfants. Concrètement, la mise en œuvre varie d’une école à l’autre : n’hésitez pas à demander à l’enseignant comment elle s’organise dans la classe de votre enfant.

Les écrans sont l’un des principaux « concurrents » du mouvement. Santé.fr rappelle qu’une forte exposition favorise la sédentarité, le manque d’activité physique et les troubles du sommeil ; après 6 ans, l’usage conseillé est modéré, encadré et équilibré avec des activités variées.

## Au quotidien
Voici à quoi peut ressembler une journée d’école active, à adapter à votre organisation :
- **Le matin** : aller à l’école à pied, à trottinette ou à vélo quand c’est possible, ou descendre du bus un arrêt plus tôt.
- **À l’école** : récréations, 30 minutes d’activité quotidienne, séances d’EPS.
- **Après la classe** : un détour par l’aire de jeux (cage à grimper, filet, toboggan, tyrolienne), un ballon, une corde à sauter, un jeu de chat.
- **À la maison** : porter les courses, faire son lit, ranger sa chambre, descendre les poubelles : Santé publique France cite ces petites tâches comme des occasions de bouger.
- **Les devoirs et les écrans** : une pause pour se lever et s’étirer, et pas plus de deux heures d’affilée assis sur le temps libre.
- **Le soir** : un rituel calme et un coucher régulier, plutôt tôt.

Le **week-end**, misez sur les sorties en famille : balade à pied ou à vélo, piscine, jardinage. L’exemple des adultes compte beaucoup.

Pour les **activités intenses**, pensez à ce qui essouffle et fait transpirer : courir, danser, sauter, faire du VTT, jouer au ballon. Trois fois par semaine, cela peut être un entraînement en club, une partie de foot à la récréation et une course-poursuite au parc le samedi.

## Questions fréquentes
**Mon enfant fait déjà deux séances de sport par semaine : est-ce suffisant ?**
Le club apporte une belle part d’activité, mais le repère est quotidien. Les autres jours, les trajets, la récréation, les 30 minutes d’activité à l’école et les jeux dehors complètent. Inutile d’ajouter forcément des séances : ce qui compte, c’est de bouger un peu chaque jour.

**Faut-il chronométrer l’heure d’activité ?**
Non. Il s’agit d’un repère, pas d’un examen. Observer la semaine dans son ensemble est plus utile : y a-t-il eu des moments pour courir, sauter, jouer dehors presque chaque jour ?

**Il pleut, il fait nuit tôt : comment faire en hiver ?**
Danser dans le salon, faire un parcours de coussins, jouer à « Jacques a dit », monter les escaliers plutôt que l’ascenseur… Et dès qu’une éclaircie le permet, quelques minutes dehors, bien couvert.

**Les écrans comptent-ils dans le temps assis ?**
Oui. Télévision, jeux vidéo assis, tablettes et trajets en voiture font partie des temps sédentaires que les repères invitent à réduire.

## Quand demander conseil
Parlez-en au médecin traitant ou au pédiatre si votre enfant s’essouffle beaucoup plus vite que ses camarades, se plaint souvent de douleurs à l’effort, semble très fatigué ou si son sommeil est perturbé. En cas de malaise, de perte de connaissance ou de difficulté à respirer pendant une activité, appelez le 15 ou le 112.

${END}`,
    tags: ['activité physique', 'une heure par jour', '6-11 ans', 'sédentarité', 'écrans', 'école', '30 minutes', 'bouger'],
    sources: [S.santeAP611, S.sportsAPQ, S.santeEcrans],
  },
  {
    ...KID,
    slug: 'choisir-un-sport-a-la-rentree-6-10-ans',
    title: 'Choisir un sport pour son enfant de 6 à 10 ans : envies, essais, logistique et budget',
    summary: 'Associer l’enfant au choix, profiter des séances d’essai, regarder la distance, les horaires et le coût réel : la méthode pour trouver une activité qu’il aura envie de retrouver chaque semaine.',
    category: 'sport',
    body_md: `Septembre approche, les forums des associations se remplissent, et la question revient : quel sport choisir ? Il n’existe pas de « meilleur sport » pour un enfant de 6 à 10 ans, mais il existe une bonne façon de choisir.

## En bref
- Le **plaisir** est la clé de la persévérance : associez votre enfant au choix.
- Les **séances d’essai** gratuites et les journées portes ouvertes permettent de tester avant de s’engager.
- Regardez la **logistique** : distance, horaires, trajets sur toute l’année.
- Le coût comprend en général une **licence** (assurance et affiliation à la fédération) et une **cotisation**.
- Entre 6 et 8 ans, les activités d’équilibre, d’attention et de coordination sont à privilégier ; à partir de 8 ans, celles d’endurance.

## Comprendre
Selon Santé publique France (Manger Bouger), un enfant poussé vers une activité qu’il n’aime pas risque de s’en désintéresser et de la vivre comme une corvée. mpedia ajoute que l’enfant reste motivé lorsqu’il se sent **compétent** et qu’il retrouve des camarades ; à l’inverse, choisir à sa place, selon ses propres envies de parent, peut lui mettre une pression inutile.

Santé publique France donne aussi des repères par âge. **Entre 6 et 8 ans**, la danse et la gymnastique travaillent l’équilibre, l’attention et la coordination ; le basket et le tir à l’arc développent l’adresse ; l’escrime et le judo apprennent le respect de l’adversaire ; l’équitation peut aider un enfant timide à prendre confiance. **À partir de 8 ans**, les activités d’endurance, collectives ou individuelles, prennent de l’intérêt : football, basket, handball, rugby, tennis, judo, karaté, athlétisme… Un enfant peu attiré par le sport peut se tourner vers des loisirs comme le roller ou la natation.

Sport individuel ou collectif ? mpedia rappelle qu’il n’y a pas de réponse unique : un sport collectif peut aider un enfant timide à s’ouvrir, un art martial peut canaliser un enfant très agité. Mais un sport choisi uniquement pour « corriger » un trait de caractère risque d’être abandonné si l’enfant ne s’y épanouit pas.

## Au quotidien
- **Commencez par une discussion** : qu’a-t-il envie d’essayer ? Un sport vu à la télévision, celui d’un copain, d’un frère ou d’une sœur ? Notez trois idées.
- **Anticipez** : mpedia signale que les inscriptions ont lieu en général en septembre, mais commencent souvent dès juin pour l’année suivante.
- **Repérez l’offre locale** dans votre budget, puis choisissez parmi elle selon les souhaits de l’enfant.
- **Testez** : une ou deux séances d’essai, un programme multisport sur l’année, ou un stage pendant les vacances.
- **Faites le calcul des trajets** : un club trop éloigné ou des horaires tardifs peuvent user la motivation de toute la famille au fil des mois.
- **Posez des questions au club** : âge des groupes, nombre d’enfants par encadrant, matériel à prévoir, compétitions éventuelles, coût total (licence, cotisation, équipement).
- **Vérifiez les aides** possibles, comme le Pass’Sport pour les familles éligibles.

## Questions fréquentes
**Mon enfant veut faire le même sport que son meilleur ami. Est-ce une bonne raison ?**
Oui, c’en est une. Retrouver un camarade fait partie de ce que l’enfant recherche dans une activité. Si le sport lui plaît moins que prévu, vous en reparlerez en fin de saison.

**Il hésite entre plusieurs activités : faut-il tout essayer ?**
Les séances d’essai sont faites pour cela. Les programmes multisports permettent aussi de découvrir plusieurs disciplines dans l’année avant de se spécialiser.

**Un sport individuel isole-t-il l’enfant ?**
Pas forcément. mpedia souligne que, dans de nombreux sports individuels comme la gymnastique, le tennis de table ou le judo, l’esprit d’équipe reste présent grâce au club.

**Combien coûte une inscription ?**
Les montants varient beaucoup selon les clubs. La plupart des associations sportives sont à but non lucratif ; le prix couvre la licence et une cotisation qui finance le matériel, les locaux et les intervenants.

## Quand demander conseil
Si votre enfant a une maladie chronique (asthme, allergie, problème cardiaque…) ou un handicap, parlez du choix de l’activité avec son médecin, qui pourra conseiller les adaptations utiles. En cas de malaise ou de difficulté à respirer pendant une séance, l’adulte présent appelle le 15 ou le 112.

${END}`,
    tags: ['choisir un sport', 'rentrée', 'inscription', 'club', 'séance d’essai', 'multisport', 'budget', 'licence'],
    sources: [S.mpediaChoix, S.santeSport],
  },
  {
    ...KID,
    slug: 'combien-de-seances-competition-surentrainement-enfant',
    title: 'Combien de séances par semaine, compétition, surentraînement : trouver le bon rythme',
    summary: 'Une à deux séances hebdomadaires suffisent en général entre 6 et 11 ans ; repérer les signes de surentraînement et accompagner la compétition sans pression.',
    category: 'sport',
    body_md: `Votre enfant adore son sport et réclame un entraînement de plus. Ou au contraire, le club lui propose déjà trois séances et des compétitions le week-end. Où placer le curseur entre 6 et 10 ans ?

## En bref
- Entre 6 et 11 ans, **une à deux séances par semaine** suffisent en général, surtout si l’enfant bouge par ailleurs.
- Une troisième séance ou une deuxième activité peut convenir s’il a **peu d’autres occasions de bouger**.
- **Répartissez** les séances dans la semaine plutôt que de les concentrer sur une même journée.
- **Fatigue, blessures répétées, troubles du sommeil, baisse des résultats scolaires** : autant de signes de surentraînement possibles.
- La compétition peut motiver, mais le regard des autres peut aussi décourager un enfant en difficulté.

## Comprendre
mpedia, le site de l’Association française de pédiatrie ambulatoire, donne un repère de rythme : à l’âge de l’école élémentaire, une à deux séances hebdomadaires suffisent généralement. L’heure d’activité quotidienne recommandée n’a pas besoin de se faire en club : jeux, trajets et récréation la complètent.

Certaines disciplines très exigeantes, comme la **gymnastique sportive** ou le **patinage artistique en compétition**, peuvent conduire à un surentraînement. Les signes à surveiller sont la fatigue, les blessures, les troubles du sommeil et la baisse des résultats scolaires.

La compétition, elle, a deux visages. Pour un enfant performant, le regard des autres est flatteur ; pour un enfant en difficulté, il peut devenir décourageant, et la **pression de la compétition** fait partie des raisons d’abandon citées par mpedia. Les sports où le poids ou l’apparence comptent (catégories de poids, danse, gymnastique, patinage) exposent en outre davantage aux dérives alimentaires : mpedia invite à rester attentif et à consulter en cas de doute.

## Au quotidien
- **Faites le point en famille** au début de l’année : combien de soirs sont pris par les activités ? Reste-t-il du temps pour jouer librement, faire ses devoirs sans se presser, dormir suffisamment (9 à 11 heures par nuit entre 6 et 11 ans) ?
- **Écoutez la demande de l’enfant** : une séance de plus parce qu’il en a envie n’a pas le même sens qu’une séance imposée pour progresser.
- **Gardez des jours sans entraînement**, et évitez deux séances le même jour.
- **Parlez avec l’éducateur** des objectifs du groupe : loisir, découverte, compétition ?
- **Après une compétition**, intéressez-vous à ce qu’il a ressenti plutôt qu’au résultat : « Qu’est-ce qui t’a plu ? Qu’est-ce que tu as appris ? »
- **Restez des supporters** au bord du terrain : encourager tout le monde, laisser l’entraîneur entraîner, éviter les remarques sur les erreurs pendant le match.
- **Observez les signaux** : un enfant qui traîne des pieds, dort mal, se blesse souvent ou parle beaucoup de son poids mérite qu’on en discute.

## Questions fréquentes
**Le club propose de passer en groupe « compétition » : faut-il accepter ?**
Parlez-en avec votre enfant et l’éducateur : nombre d’entraînements, déplacements, week-ends occupés. S’il en a envie et que le rythme reste compatible avec l’école, le sommeil et les jeux, l’expérience peut être positive. Rien n’empêche de revenir en loisir ensuite.

**Peut-il faire deux sports différents ?**
Oui, si son emploi du temps le permet. mpedia note qu’une deuxième activité peut être intéressante quand l’enfant a peu d’autres occasions de bouger. Varier les disciplines permet aussi de découvrir d’autres gestes.

**Il a mal aux genoux ou aux talons après chaque entraînement : est-ce le surentraînement ?**
Une douleur qui revient à chaque séance mérite un avis médical. Ne laissez pas votre enfant s’entraîner « en serrant les dents » ; le médecin dira si une pause ou une adaptation est nécessaire.

**Comment réagir s’il pleure après une défaite ?**
Accueillez sa déception sans la minimiser. Une défaite fait partie de l’apprentissage ; votre présence compte davantage que le score.

## Quand demander conseil
Consultez le médecin traitant si la fatigue persiste, si les blessures se répètent, si le sommeil se dégrade ou si votre enfant semble préoccupé par son poids ou son apparence. Si vous percevez un mal-être important, chez lui ou chez vous, le 3114 répond jour et nuit. En cas de malaise ou de blessure grave pendant une activité, appelez le 15 ou le 112.

${END}`,
    tags: ['rythme', 'séances par semaine', 'compétition', 'surentraînement', 'fatigue', 'pression', 'parents supporters'],
    sources: [S.mpediaChoix, S.mpediaAlim, S.santeAP611],
  },
  {
    ...KID,
    slug: 'questionnaire-sante-certificat-medical-licence-enfant',
    title: 'Licence sportive de l’enfant : questionnaire de santé ou certificat médical ?',
    summary: 'Depuis 2021, un questionnaire de santé rempli avec les parents remplace le certificat médical pour la licence des mineurs, sauf réponse positive, disciplines à contraintes particulières ou exigence propre à certains clubs.',
    category: 'droits-demarches',
    body_md: `Chaque rentrée, la même question : faut-il prendre rendez-vous chez le médecin pour le certificat du club ? Pour la plupart des enfants licenciés, la réponse a changé en 2021.

## En bref
- Pour obtenir ou renouveler une licence, ou s’inscrire à une compétition fédérale, un **mineur remplit un questionnaire de santé** avec ses parents, qui vaut **attestation parentale**.
- Si **toutes les réponses sont négatives**, l’attestation suffit.
- Si **au moins une réponse est positive**, une consultation médicale est nécessaire, et le certificat délivré est remis au club ou à la fédération.
- Les **disciplines à contraintes particulières** exigent toujours un certificat (la plongée subaquatique en fait partie).
- Un club **non affilié** à une fédération peut demander un certificat dans son règlement intérieur.

## Comprendre
Le ministère des Sports a annoncé en mai 2021 que le certificat de non-contre-indication était remplacé, pour les mineurs, par un **questionnaire relatif à l’état de santé du sportif mineur**. Le texte est disponible sur Légifrance et sur Service-Public.fr. En septembre 2023, un nouveau communiqué a confirmé que, pour les mineurs, l’obligation de présenter un certificat était supprimée : une attestation issue du questionnaire suffit, à condition que toutes les réponses soient négatives.

Le certificat reste demandé dans plusieurs cas :
- **une réponse positive** au questionnaire : l’enfant consulte, et le médecin délivre si besoin un certificat ;
- **les disciplines à contraintes particulières** : en 2021, la liste comprenait notamment l’alpinisme, la plongée subaquatique, la spéléologie, les sports de combat pouvant se terminer par K.-O., les disciplines utilisant des armes à feu ou à air comprimé, certains sports motorisés ou aériens en compétition, le parachutisme et le rugby. Un décret d’août 2023 a **réduit cette liste** : vérifiez auprès de la fédération concernée ;
- **les structures non affiliées** (associatives ou commerciales) : selon mpedia, le club peut exiger un certificat, non par obligation légale mais par son règlement intérieur ;
- **les compétitions organisées hors fédération** (mairie, association) : l’organisateur peut demander un certificat.

## Au quotidien
- **Lisez les questions avec votre enfant** et répondez honnêtement : elles portent sur son état de santé et ses antécédents.
- **Une seule réponse « oui »** ? Prenez rendez-vous suffisamment tôt avant la rentrée, quand les agendas des médecins sont chargés.
- **Apportez le carnet de santé** à la consultation : mpedia rappelle que le médecin s’intéresse aux antécédents sportifs, familiaux et médicaux.
- **Conservez une copie** de l’attestation ou du certificat.
- **Informez le médecin qui suit votre enfant** de sa pratique sportive s’il a une maladie chronique ou un état de santé pouvant interférer avec le sport, comme le recommande le ministère.
- **Pour l’EPS à l’école**, la logique est différente : le médecin peut rédiger un certificat d’**inaptitude partielle** qui précise les adaptations, plutôt qu’une dispense totale.

## Questions fréquentes
**Le questionnaire supprime-t-il tout suivi médical ?**
Non. mpedia rappelle que l’Assurance Maladie prend en charge des examens de santé réguliers de l’enfant, et que les pédiatres recommandent une visite au moins une fois par an pour suivre la croissance, faire de la prévention et dépister tôt certaines maladies. La visite peut aussi être l’occasion de parler du sport pratiqué.

**Que se passe-t-il pendant une consultation pour le sport ?**
Le médecin interroge sur les antécédents, examine l’enfant (poids, taille, articulations, colonne, cœur, respiration), parle d’hygiène de vie, de vaccins et d’alimentation. Selon le sport ou une maladie comme l’asthme, d’autres examens peuvent être proposés.

**Mon enfant a eu une entorse l’an dernier : dois-je répondre « oui » ?**
Lisez la question précise et répondez ce qui correspond à la situation. En cas de doute, une consultation permet de faire le point.

**Le club demande quand même un certificat : est-ce possible ?**
Si le club n’est pas affilié à une fédération, il peut l’exiger dans son règlement. S’il est affilié, demandez-lui sur quelle règle il s’appuie : discipline à contraintes particulières, règle fédérale ou réponse positive.

## Quand demander conseil
Consultez si une question du questionnaire vous fait hésiter, si votre enfant ressent des douleurs dans la poitrine, des palpitations, un essoufflement inhabituel ou des malaises à l’effort. Une douleur thoracique, une perte de connaissance ou une difficulté à respirer pendant un effort sont des urgences : appelez le 15 ou le 112.

${END}`,
    tags: ['certificat médical', 'questionnaire de santé', 'licence', 'attestation parentale', 'club', 'mineur', 'rentrée sportive', 'EPS'],
    sources: [S.sportsQuestionnaire, S.sportsLicences, S.mpediaCertif],
  },
  // ───────────────────────────── Disciplines ─────────────────────────────
  {
    ...KID,
    slug: 'natation-6-10-ans-apprendre-pass-nautique-savoir-nager',
    title: 'Natation de 6 à 10 ans : apprendre à nager, Pass nautique et savoir-nager en sécurité',
    summary: 'De l’école au club, les étapes de l’apprentissage de la natation, ce que valident le Pass nautique et l’attestation du savoir-nager en sécurité, et les règles de surveillance qui restent indispensables.',
    category: 'sport',
    min_age_months: 72,
    body_md: `Savoir nager est une compétence de sécurité autant qu’un plaisir. Entre 6 et 10 ans, beaucoup d’enfants découvrent la piscine avec l’école, d’autres prennent des cours en club. Voici comment s’y retrouver.

## En bref
- Les noyades restent une cause majeure d’accidents de la vie courante chez les jeunes ; l’Éducation nationale fait du **savoir-nager** un savoir fondamental.
- Le **Pass nautique** (ancien test d’aisance aquatique) valide les premiers acquis : entrer dans l’eau, flotter, aller sous l’eau, se déplacer, sortir.
- L’**attestation du savoir-nager en sécurité (ASNS)** se passe ensuite, visée à la fin de la 6e.
- Un enfant qui sait nager doit **toujours être surveillé** par un adulte dédié.
- Faites évaluer son niveau par un **maître-nageur** avant les vacances.

## Comprendre
Le ministère de l’Éducation nationale décrit l’apprentissage en deux étapes. Le **Pass nautique** s’adresse à tous les élèves, y compris non nageurs, quel que soit leur âge. Il est délivré par les professeurs des écoles et il est exigé pour les activités nautiques en accueil collectif de mineurs (centres de loisirs, colonies).

L’**ASNS** valide ensuite une véritable autonomie en milieu aquatique surveillé. Le test reproduit des situations de mise en sécurité : entrée dans l’eau par une chute arrière, passage sous un obstacle, nage sur le ventre et sur le dos, surplace, demi-tour et accrochage à un point fixe comme l’échelle du bassin. Il est reconnu à l’école comme dans le milieu sportif, et figure dans le livret scolaire.

Le ministère des Sports insiste sur la prévention : apprendre à nager à tout âge avec un maître-nageur, faire évaluer son niveau et celui de ses enfants, et ne jamais relâcher la surveillance. Nager en lac ou en rivière est plus difficile qu’en piscine.

Au-delà de la sécurité, la natation se pratique aussi comme un sport à part entière, en loisir ou en club, et peut séduire des enfants peu attirés par les sports collectifs.

## Au quotidien
- **Renseignez-vous à l’école** : quand ont lieu les séances de natation scolaire ? Votre enfant a-t-il obtenu le Pass nautique ?
- **Pour des cours en club**, demandez la progression proposée, la taille des groupes et la qualification des encadrants.
- **Préparez le sac** : maillot, bonnet si la piscine l’exige, serviette, sandales, gourde, goûter pour la sortie, souvent affamée.
- **Rassurez un enfant qui a peur** : jeux au bord, mettre la tête sous l’eau à son rythme, valoriser chaque progrès.
- **En vacances**, privilégiez les zones de baignade surveillées, respectez les drapeaux et les consignes des sauveteurs, et baignez-vous avec votre enfant.
- **Désignez un adulte** qui surveille et ne fait rien d’autre, même dans une zone surveillée.
- **Entrez dans l’eau progressivement**, surtout si elle est froide ou après une exposition au soleil, et évitez la baignade en cas de frissons ou de malaise.

## Questions fréquentes
**Mon enfant a son Pass nautique : sait-il nager ?**
Le Pass nautique valide les premiers acquis dans l’eau. L’autonomie complète correspond à l’ASNS, qui se passe plus tard. Dans tous les cas, la surveillance reste nécessaire.

**Les brassards suffisent-ils pour être tranquille ?**
Aucun équipement ne remplace la présence d’un adulte attentif à portée de main. Les sources consultées insistent avant tout sur la surveillance permanente.

**Piscine et asthme sont-ils compatibles ?**
Oui, le plus souvent. L’Assurance Maladie classe la natation parmi les sports les moins susceptibles de déclencher l’asthme et conseille, si possible, des bassins peu chlorés.

**À quel âge peut-il aller seul à la piscine avec des copains ?**
Les sources ne fixent pas d’âge. Cela dépend de son niveau évalué par un maître-nageur, du lieu et de la surveillance sur place. Entre 6 et 10 ans, un adulte responsable reste indispensable.

## Quand demander conseil
Si votre enfant a une otite, une maladie chronique ou une peur panique de l’eau, parlez-en au médecin. En cas de noyade ou de suspicion de noyade, sortez l’enfant de l’eau si vous pouvez le faire sans danger et appelez immédiatement le 15 ou le 112 (le 196 depuis le littoral pour les secours en mer). Pensez à vous former aux gestes de premiers secours.

${END}`,
    tags: ['natation', 'apprendre à nager', 'Pass nautique', 'aisance aquatique', 'ASNS', 'piscine', 'noyade', 'surveillance'],
    sources: [S.eduNager, S.sportsNoyades, S.ameliAsthme],
  },
  {
    ...KID,
    slug: 'football-enfant-6-10-ans-ce-qu-il-faut-savoir',
    title: 'Le football entre 6 et 10 ans : inscription, équipement et petits points de vigilance',
    summary: 'Esprit d’équipe, endurance, protège-tibias marqués CE, gourde, chaleur, asthme : ce qu’il faut savoir avant d’inscrire son enfant au foot.',
    category: 'sport',
    body_md: `Le football est souvent le premier sport collectif que réclament les enfants, parfois dès qu’ils savent courir derrière un ballon. Entre 6 et 10 ans, c’est une belle école de l’endurance et du jeu à plusieurs, à condition de bien s’équiper et de garder le plaisir au centre.

## En bref
- Santé publique France cite le football parmi les **sports collectifs d’endurance** intéressants à partir de 8 ans ; les plus jeunes peuvent le découvrir de façon ludique.
- La licence d’un mineur passe par le **questionnaire de santé** rempli avec les parents.
- Les **protège-tibias** sont des équipements de protection : vérifiez le **marquage CE**, la notice et la date de fabrication.
- **Gourde** systématique, équipement adapté, et prudence lors des fortes chaleurs ou des pics de pollution.
- En cas d’**asthme**, le football fait partie des sports plus souvent déclencheurs : un échauffement soigné et un traitement adapté aident.

## Comprendre
Le football fait courir, accélérer, s’arrêter, changer de direction : il développe l’endurance, la coordination et l’esprit d’équipe. Santé publique France (Manger Bouger) recommande, à partir de 8 ans, des activités d’endurance qui restent ludiques tout en se structurant peu à peu.

Côté équipement, la DGCCRF a contrôlé les protections des grands sports collectifs, dont les protège-tibias et protège-chevilles. Certains produits présentaient une mauvaise absorption des chocs ou des marquages et notices lacunaires. Un équipement de protection individuelle doit porter un **marquage CE** visible, lisible et indélébile, et ne peut pas être vendu sans **notice** ni **date de fabrication** ou durée de vie.

L’Assurance Maladie classe le football parmi les sports les plus souvent déclencheurs d’asthme d’effort, sans pour autant l’interdire : si l’asthme est bien contrôlé, tous les sports sont possibles.

## Au quotidien
- **Choisir le club** : renseignez-vous sur les catégories d’âge, le nombre d’entraînements, les matchs du week-end et la place laissée au jeu chez les plus jeunes.
- **L’équipement** : chaussures adaptées au terrain, chaussettes hautes, protège-tibias à sa taille portant le marquage CE, tenue adaptée à la météo. Regardez la notice et la date de fabrication.
- **La gourde** : Santé publique France conseille d’en prévoir une à chaque séance, quel que soit le temps.
- **La chaleur** : lors des fortes chaleurs, évitez les heures les plus chaudes de la journée et faites boire avant, pendant et après l’effort.
- **La pollution** : limitez l’activité quand la pollution de l’air dépasse le seuil d’information et de recommandation.
- **Le soleil** : un chapeau pour les temps d’attente, de l’ombre, et une crème solaire adaptée aux enfants sur les zones découvertes.
- **Au bord du terrain** : encouragez toute l’équipe, laissez l’éducateur donner les consignes, et félicitez l’effort plutôt que le résultat.

## Questions fréquentes
**À partir de quel âge peut-on inscrire un enfant au foot ?**
Les clubs accueillent souvent les enfants dès l’école élémentaire, parfois avant. Renseignez-vous auprès du club sur les groupes d’âge et les formats de jeu proposés.

**Les têtes sont-elles dangereuses pour les enfants ?**
Les sources consultées ne traitent pas spécifiquement de ce point. Demandez au club comment il organise l’apprentissage, et faites examiner votre enfant après tout choc à la tête suivi de symptômes (maux de tête, vertiges, confusion, nausées).

**Mon enfant est asthmatique : peut-il jouer ?**
Le plus souvent oui, si son asthme est bien contrôlé. Un bon échauffement, des pauses et, sur prescription, un traitement à prendre avant l’effort aident. Il doit toujours avoir son dispositif d’inhalation avec lui.

**Il ne joue presque pas pendant les matchs et se décourage : que faire ?**
Parlez-en calmement avec l’éducateur pour comprendre comment il organise le temps de jeu. Se sentir utile à l’équipe compte beaucoup dans l’envie de continuer : le plaisir est l’une des clés de la persévérance.

## Quand demander conseil
Consultez si votre enfant boite, ne peut plus prendre appui sur un pied après une torsion, se plaint d’une douleur persistante ou a reçu un choc à la tête suivi de symptômes. Une perte de connaissance, une confusion, des vomissements ou une gêne respiratoire importante imposent d’appeler le 15 ou le 112.

${END}`,
    tags: ['football', 'foot', 'sport collectif', 'protège-tibias', 'club', 'équipement', 'asthme', 'chaleur'],
    sources: [S.santeSport, S.dgccrfEPI, S.ameliAsthme],
  },
  {
    ...KID,
    slug: 'judo-karate-arts-martiaux-enfant-6-10-ans',
    title: 'Judo, karaté et arts martiaux entre 6 et 10 ans : respect, maîtrise de soi et bonnes questions à poser',
    summary: 'Les arts martiaux apprennent le respect de l’adversaire et peuvent aider un enfant très énergique à canaliser son énergie ; ce qu’il faut savoir sur la licence, les catégories de poids et l’encadrement.',
    category: 'sport',
    body_md: `Ceinture blanche, salut sur le tapis, chutes apprises en riant : le judo et les autres arts martiaux séduisent de nombreux enfants dès l’école élémentaire. Ils apportent des repères, mais demandent aussi quelques vérifications de la part des parents.

## En bref
- Santé publique France cite le **judo** et l’**escrime** parmi les activités qui apprennent le **respect de l’adversaire** dès 6-8 ans, et le judo et le karaté parmi les sports de coordination à partir de 8 ans.
- Un art martial peut aider certains enfants très énergiques à **canaliser leur énergie**, à condition qu’ils y prennent plaisir.
- Pour la licence, le **questionnaire de santé** suffit en général ; les sports de combat **pouvant se terminer par K.-O.** en compétition figuraient en 2021 parmi les disciplines à contraintes particulières, qui exigent un certificat.
- Les **catégories de poids** exposent davantage aux dérives alimentaires : aucune restriction ne doit être imposée à un enfant pour « faire le poids ».
- L’encadrant rémunéré doit être **déclaré et qualifié**.

## Comprendre
Les arts martiaux reposent sur des règles claires : saluer, attendre son tour, contrôler sa force, respecter le partenaire. Pour un enfant de 6 à 10 ans, ces rituels structurent la séance et donnent des repères. Le judo enseigne aussi à tomber sans se faire mal, un apprentissage utile au quotidien.

Côté santé, mpedia rappelle que les sports à catégories de poids (arts martiaux, sports de combat) sont ceux où les enfants sont plus exposés aux régimes et aux troubles du comportement alimentaire. L’alimentation d’un jeune sportif doit couvrir sa croissance et sa dépense : trois repas et un goûter, des féculents à chaque repas, des fruits et légumes, des produits laitiers et des protéines variées.

Pour la licence, le certificat a été remplacé en 2021 par un questionnaire de santé pour les mineurs, rappelle mpedia. À cette date, les disciplines dans lesquelles le combat peut prendre fin par K.-O. en compétition (boxe anglaise, kick-boxing, savate par exemple) figuraient dans la liste des disciplines à contraintes particulières qui exigent un certificat ; cette liste a été réduite en 2023, d’où l’intérêt de vérifier auprès de la fédération.

## Au quotidien
- **Assistez à une séance d’essai** : l’ambiance, la place laissée au jeu, la façon dont l’enseignant corrige les enfants vous en diront beaucoup.
- **Demandez la qualification de l’enseignant** : encadrer contre rémunération exige une qualification reconnue et une déclaration auprès des services de l’État, qui délivrent une carte professionnelle.
- **Équipement** : la tenue (kimono ou tenue spécifique) est souvent la seule dépense importante ; certains clubs en prêtent ou en revendent d’occasion. Pour les disciplines de frappe, renseignez-vous sur les protections exigées et vérifiez leur marquage CE.
- **Hygiène** : ongles courts, pieds propres, tenue lavée régulièrement, sandales pour aller jusqu’au tapis.
- **Gourde** et petite collation pour la sortie.
- **Pas de régime** avant une pesée : si l’enfant change de catégorie, ce n’est pas un problème.

## Questions fréquentes
**Les arts martiaux rendent-ils les enfants plus bagarreurs ?**
Les sources consultées les présentent au contraire comme une école du respect de l’adversaire et de la maîtrise de soi. Si vous observez un changement de comportement inquiétant, parlez-en avec l’enseignant.

**Mon enfant est timide : est-ce adapté ?**
Oui, cela peut l’être. Le cadre ritualisé rassure certains enfants. Comme pour tout sport, l’essentiel est qu’il ait envie d’y retourner.

**Faut-il un certificat médical pour le judo ?**
Pour un mineur licencié, le questionnaire de santé suffit en général, sauf réponse positive. Vérifiez auprès du club, surtout pour la compétition.

**Quand commencer la compétition ?**
Il n’y a pas d’âge imposé dans les sources consultées. Parlez-en avec l’enseignant et avec votre enfant : s’amuser et progresser restent les priorités à cet âge.

## Quand demander conseil
Consultez en cas de douleur articulaire persistante, de choc à la tête suivi de maux de tête, de vertiges ou de confusion, ou si votre enfant se préoccupe beaucoup de son poids. Une perte de connaissance, des vomissements ou une somnolence inhabituelle après un choc imposent d’appeler le 15 ou le 112. Si votre enfant vous confie un geste ou une parole déplacée d’un adulte, appelez le 119.

${END}`,
    tags: ['judo', 'karaté', 'arts martiaux', 'sport de combat', 'respect', 'catégorie de poids', 'kimono', 'licence'],
    sources: [S.santeSport, S.mpediaAlim, S.mpediaCertif],
  },
  {
    ...KID,
    slug: 'gymnastique-enfant-6-10-ans-plaisir-et-vigilance',
    title: 'Gymnastique entre 6 et 10 ans : équilibre, souplesse… et vigilance sur le rythme',
    summary: 'La gymnastique travaille l’équilibre, l’attention et la coordination ; en compétition, elle peut devenir très exigeante : repères pour en profiter sans surentraînement ni pression sur l’apparence.',
    category: 'sport',
    body_md: `Roulades, roues, poutre, trampoline : la gymnastique attire beaucoup d’enfants qui aiment bouger dans tous les sens. C’est une très bonne école de la motricité, à condition de garder un œil sur l’intensité quand la pratique devient compétitive.

## En bref
- Entre 6 et 8 ans, les activités qui développent **équilibre, attention et coordination**, comme la gymnastique et la danse, sont particulièrement adaptées.
- mpedia cite la **gymnastique sportive en compétition** parmi les disciplines pouvant mener au **surentraînement**.
- Signes à surveiller : **fatigue, blessures, troubles du sommeil, baisse des résultats scolaires**.
- Dans les sports où l’apparence compte, les enfants sont plus exposés aux **dérives alimentaires**.
- Pour le trampoline de loisir, les **parcs** doivent être bien entretenus et surveillés.

## Comprendre
La gymnastique existe sous plusieurs formes : gymnastique artistique (sol, agrès), rythmique (avec engins), trampoline, ou encore « baby gym » et éveil gymnique pour les plus petits. Entre 6 et 10 ans, elle développe le schéma corporel, l’équilibre, la force et la souplesse, et apprend à se concentrer avant un mouvement.

mpedia rappelle qu’entre 6 et 11 ans, une à deux séances par semaine suffisent généralement. Certains groupes compétitifs s’entraînent bien davantage : c’est là que le risque de surentraînement apparaît. Les sports où l’apparence compte (danse, gymnastique, patinage) exposent aussi davantage aux régimes et aux troubles du comportement alimentaire, qui doivent être pris en charge rapidement.

Le trampoline mérite une attention particulière lorsqu’il est pratiqué en **parc de loisirs**. En 2024, la DGCCRF a relevé dans certains parcs des cubes de mousse usés ou insuffisants, des filets déchirés ou mal fixés et des consignes insuffisantes sur les âges ; quatre parcs ont été suspendus.

## Au quotidien
- **Choisissez le niveau de pratique** avec votre enfant : loisir, découverte ou compétition. Demandez le nombre d’heures d’entraînement prévu dans chaque groupe.
- **Gardez des jours de repos** et un temps libre pour jouer.
- **Tenue** : vêtements près du corps, cheveux attachés, pas de bijoux.
- **Alimentation** : trois repas et un goûter, sans « faire attention à sa ligne ». Une remarque d’adulte sur le corps d’un enfant peut peser longtemps.
- **Écoutez les douleurs** : une douleur aux poignets, au dos ou aux talons qui revient à chaque séance doit être signalée à l’entraîneur et au médecin.
- **Au parc de trampolines** : vérifiez l’état des filets et des cubes, demandez les certificats de contrôle (de moins d’un an), lisez les consignes et restez à proximité de votre enfant.

## Questions fréquentes
**La gymnastique fait-elle « grandir moins » ?**
Les sources consultées ne l’affirment pas. Ce qui compte, c’est un rythme raisonnable, une alimentation suffisante et un suivi régulier de la croissance chez le médecin.

**Mon enfant veut entrer en section compétition : comment décider ?**
Regardez le volume d’entraînement, les week-ends de compétition et l’impact sur l’école et le sommeil. Parlez-en avec lui et avec l’entraîneur. Un retour en loisir reste toujours possible.

**Le trampoline dans le jardin est-il une bonne idée ?**
Le trampoline fait partie des équipements où les chutes sont fréquentes. Les sources consultées portent sur les parcs ; pour un usage à la maison, suivez la notice, installez-le loin des obstacles et surveillez les enfants.

**Comment savoir si mon enfant est trop fatigué ?**
Endormissement difficile, réveils fréquents, irritabilité, résultats scolaires en baisse, blessures répétées : ces signes doivent faire réévaluer le rythme.

## Quand demander conseil
Consultez si une douleur persiste, si votre enfant se blesse souvent, perd du poids, saute des repas ou parle beaucoup de son corps. En cas de mal-être important, le 3114 répond à toute heure. Une chute avec perte de connaissance, confusion, vomissements ou impossibilité de bouger un membre impose d’appeler le 15 ou le 112.

${END}`,
    tags: ['gymnastique', 'gym', 'trampoline', 'souplesse', 'équilibre', 'surentraînement', 'compétition', 'troubles alimentaires'],
    sources: [S.mpediaChoix, S.mpediaAlim, S.dgccrfParcs],
  },
  {
    ...KID,
    slug: 'danse-enfant-6-10-ans-choisir-son-cours',
    title: 'La danse entre 6 et 10 ans : classique, modern-jazz, hip-hop… comment choisir son cours',
    summary: 'Coordination, rythme, expression : la danse convient aux enfants sensibles aux arts comme aux plus énergiques ; repères pour choisir un cours et rester attentif au rapport au corps.',
    category: 'sport',
    body_md: `Votre enfant danse dès qu’il entend de la musique ? La danse est une activité physique à part entière, qui peut compter parmi les activités intenses recommandées chaque semaine. Encore faut-il trouver le style et le cours qui lui conviennent.

## En bref
- Santé publique France cite la **danse** parmi les activités intenses pour les 6-11 ans et parmi celles qui développent **équilibre, attention et coordination** entre 6 et 8 ans.
- Les activités artistiques (danse, cirque, ballet aquatique) conviennent particulièrement aux enfants **sensibles aux arts**.
- Les styles sont nombreux : classique, modern-jazz, hip-hop, danses africaines… **Le cours d’essai** aide à choisir.
- La danse fait partie des disciplines où l’**apparence** compte : soyez attentifs au rapport de votre enfant à son corps.
- Garçons comme filles peuvent danser : l’envie de l’enfant est le meilleur critère.

## Comprendre
Danser fait travailler le souffle, la coordination, l’équilibre, la mémoire des enchaînements et l’écoute de la musique. Santé publique France range la danse parmi les activités intenses, celles qui essoufflent, à pratiquer au moins trois fois par semaine dans le cadre de l’heure quotidienne d’activité.

Les écoles proposent souvent plusieurs styles : danse classique, modern-jazz, hip-hop, danses africaines… Chaque style a son ambiance : rigueur et posture pour le classique, énergie et improvisation pour le hip-hop, rythme et collectif pour les danses africaines. Santé publique France le rappelle : le plaisir est l’une des clés de la persévérance.

Comme la gymnastique ou le patinage, la danse fait partie des disciplines où l’apparence compte. mpedia signale que ces sports exposent davantage les jeunes aux régimes et aux troubles du comportement alimentaire. Le rôle des adultes (parents, professeurs) est d’éviter tout commentaire sur le poids ou la silhouette.

## Au quotidien
- **Faites essayer plusieurs styles** : beaucoup d’écoles proposent un cours d’essai en septembre ou des portes ouvertes.
- **Observez le cours** : les enfants s’amusent-ils ? Le professeur encourage-t-il chacun ? Le niveau est-il adapté à l’âge ?
- **Tenue** : vêtements confortables, chaussons ou baskets propres selon le style, cheveux attachés.
- **Spectacle de fin d’année** : demandez à l’avance le coût des costumes et les dates des répétitions pour éviter les surprises.
- **Gourde et goûter** : la séance après l’école tombe souvent à l’heure du creux de 16 h.
- **Prolongez à la maison** : danser ensemble sur ses musiques préférées est aussi une façon de bouger en famille.
- **Valorisez le plaisir et l’expression** plutôt que la performance ou la silhouette.

## Questions fréquentes
**Mon fils veut faire de la danse classique, mais il a peur des moqueries.**
Rassurez-le : son envie est légitime. Choisir un cours où d’autres garçons dansent, ou un style qui l’attire, peut l’aider. Si des moqueries surviennent, parlez-en avec le professeur.

**Les pointes, c’est pour quel âge ?**
Les sources consultées ne fixent pas d’âge. C’est une décision qui revient au professeur, selon la maturité et la préparation de l’enfant ; en cas de douleur aux pieds ou aux chevilles, demandez l’avis du médecin.

**La danse peut-elle remplacer un sport ?**
Oui. C’est une activité physique à part entière, qui peut être intense. Elle compte pleinement dans l’heure d’activité quotidienne.

**Mon enfant me dit qu’il doit « maigrir pour le spectacle » : que faire ?**
Prenez cette phrase au sérieux. Parlez-en avec lui, puis avec le professeur, et consultez le médecin si des restrictions alimentaires apparaissent. Les besoins d’un enfant qui grandit et qui danse sont importants.

## Quand demander conseil
Consultez si votre enfant saute des repas, perd du poids, se compare sans cesse aux autres ou se plaint d’une douleur persistante (pieds, chevilles, genoux, dos). En cas de mal-être profond, le 3114 répond jour et nuit. Une blessure avec impossibilité de prendre appui ou un malaise pendant le cours imposent d’appeler le 15 ou le 112.

${END}`,
    tags: ['danse', 'danse classique', 'hip-hop', 'modern-jazz', 'expression', 'cours de danse', 'rapport au corps'],
    sources: [S.santeAP611, S.santeSport, S.mpediaAlim],
  },
  {
    ...KID,
    slug: 'velo-6-10-ans-savoir-rouler-regles-casque',
    title: 'Le vélo de 6 à 10 ans : Savoir rouler à vélo, casque obligatoire et règles de circulation',
    summary: 'Le programme Savoir rouler à vélo, le casque obligatoire avant 12 ans, le trottoir autorisé avant 8 ans seulement, l’équipement exigé : tout pour accompagner votre enfant vers l’autonomie à vélo.',
    category: 'sport',
    body_md: `Le vélo est à la fois un jeu, un sport et un moyen de transport. Entre 6 et 10 ans, l’enfant passe de l’équilibre aux premiers trajets accompagnés sur la route : une étape qui se prépare.

## En bref
- Le dispositif **Savoir rouler à vélo** s’adresse aux 6-11 ans : **10 heures** de formation en trois étapes (pédaler, circuler, rouler sur la voie publique).
- Le **casque attaché, marqué CE**, est **obligatoire avant 12 ans**, que l’enfant conduise ou soit passager, et recommandé ensuite.
- **Avant 8 ans**, l’enfant à vélo est considéré comme un piéton : il peut rouler sur le trottoir, au pas.
- **Dès 8 ans**, il roule sur la chaussée ou la piste cyclable ; sur le trottoir, il pousse son vélo.
- Un vélo doit avoir **deux freins**, une **sonnette**, des **feux** et des **catadioptres**.

## Comprendre
Le ministère des Sports présente le programme **Savoir rouler à vélo** en trois blocs : **Savoir pédaler** (équilibre, pédaler, tourner, freiner), **Savoir circuler** (rouler en groupe en milieu sécurisé, signaler un changement de direction, découvrir les panneaux) et **Savoir rouler à vélo** (circuler en situation réelle sur la voie publique, en autonomie). Il est proposé par des écoles, des centres de loisirs, des mairies et des associations sportives.

Les règles de circulation sont détaillées par Service-Public.fr. Le **petit vélo d’un enfant de moins de 8 ans** n’est pas considéré comme un véhicule : l’enfant est un piéton, roule sur le trottoir à allure modérée et respecte les feux et passages piétons. **À partir de 8 ans**, il doit circuler sur la chaussée ou sur la piste cyclable. Le **casque** est obligatoire jusqu’à 12 ans et fortement recommandé après.

À l’achat, un vélo neuf doit être vendu **monté et réglé**, avec une notice, deux freins indépendants (le rétropédalage seul ne suffit pas), des feux, des catadioptres et un avertisseur sonore. Le casque doit porter le marquage CE ; la norme **NF EN 1078** vaut présomption de conformité, et l’étiquette indique la taille et la date de fabrication.

## Au quotidien
- **Inscrivez votre enfant** à une session Savoir rouler à vélo : renseignez-vous à l’école, à la mairie ou auprès des clubs.
- **Réglez le casque** : bien posé sur le front, sangles attachées sans serrer. Remplacez-le s’il est trop petit ou abîmé.
- **Vérifiez le vélo** avant chaque sortie : freins, pneus gonflés, chaîne, sonnette, éclairage.
- **Entraînez-vous** dans un parc ou une rue calme avant les trajets en ville.
- **Montrez l’exemple** : arrêt au feu rouge, regard par-dessus l’épaule, bras tendu pour tourner.
- **Soyez visibles** : feux avant et arrière en état de marche, catadioptres propres, vêtements clairs quand la luminosité baisse.
- **En famille**, les balades du week-end sont une excellente façon d’atteindre l’heure d’activité quotidienne.

## Questions fréquentes
**À quel âge un enfant peut-il aller seul à l’école à vélo ?**
Les textes ne fixent pas d’âge. Le programme Savoir rouler à vélo vise l’autonomie sur la voie publique ; c’est à vous d’évaluer, selon le trajet et la maturité de votre enfant, quand il est prêt.

**Mon enfant de 9 ans peut-il rouler sur le trottoir ?**
Non, sauf en poussant son vélo à la main. Dès 8 ans, il roule sur la chaussée ou la piste cyclable. Avant 8 ans, le trottoir est autorisé.

**Faut-il racheter un casque après une chute ?**
Les sources consultées ne le précisent pas. Suivez la notice du fabricant et, au moindre doute sur l’état du casque après un choc, remplacez-le.

**Un vélo d’occasion convient-il ?**
Oui, s’il est adapté à la taille de l’enfant et en bon état. Vérifiez les deux freins, la sonnette, l’éclairage et les catadioptres. Depuis 2021, un vélo vendu par un commerçant, neuf ou d’occasion, porte un numéro d’identification inscrit sur le cadre et sur la facture.

## Quand demander conseil
Après une chute, consultez si l’enfant a mal au poignet, boite ou ne peut plus utiliser un membre. Un choc à la tête suivi d’une perte de connaissance, de vomissements, d’une somnolence ou d’un comportement inhabituel impose d’appeler le 15 ou le 112. Surveillez votre enfant pendant les 48 heures qui suivent un choc à la tête.

${END}`,
    tags: ['vélo', 'savoir rouler à vélo', 'casque', 'sécurité routière', 'trottoir', 'piste cyclable', 'équipements obligatoires'],
    sources: [S.sportsSRAV, S.spEngins, S.dgccrfVelo],
  },
  {
    ...KID,
    slug: 'tennis-badminton-sports-de-raquette-enfant',
    title: 'Tennis, badminton, tennis de table : les sports de raquette entre 6 et 10 ans',
    summary: 'Coordination, adresse et concentration : ce que les sports de raquette apportent aux enfants, comment débuter, et les précautions pour jouer dehors au soleil.',
    category: 'sport',
    body_md: `Taper dans une balle ou un volant, viser, se replacer : les sports de raquette demandent beaucoup de coordination, ce qui en fait de bons alliés de l’enfant de l’école élémentaire. Ils se pratiquent en club, mais aussi en famille, dans un parc ou sur une table de ping-pong publique.

## En bref
- Santé publique France cite le **tennis** parmi les sports individuels de **coordination** recommandés à partir de 8 ans.
- mpedia mentionne aussi le **tennis de table** et le **badminton** parmi les disciplines possibles, et rappelle que l’esprit d’équipe existe même dans un sport individuel grâce au club.
- Le matériel doit être **adapté à la taille** de l’enfant : raquette plus courte, balles adaptées aux débutants.
- Dehors, protégez votre enfant du **soleil** : chapeau à bords larges, vêtements couvrants, crème solaire pédiatrique, lunettes adaptées.
- Une **gourde** à chaque séance, quel que soit le temps.

## Comprendre
Les sports de raquette sollicitent la coordination œil-main, l’équilibre, les déplacements rapides et la concentration. Entre 6 et 8 ans, Santé publique France conseille de privilégier ce type de qualités (équilibre, attention, coordination) ; à partir de 8 ans, le tennis fait partie des sports individuels de coordination qui peuvent se structurer peu à peu, tout en restant ludiques.

mpedia rappelle qu’un enfant reste motivé s’il se sent compétent. Les clubs proposent souvent des formats adaptés aux débutants (terrains plus petits, balles plus lentes) qui permettent d’échanger rapidement des balles, et donc de prendre plaisir.

Pour les séances en extérieur, Santé.fr rappelle qu’un enfant qui joue au soleil est autant exposé qu’un enfant immobile sur une serviette. Il est conseillé d’éviter l’exposition entre 10 h et 16 h, de privilégier les vêtements couvrants, un chapeau à bords larges plutôt qu’une casquette, des lunettes de soleil de catégorie 3 ou 4 marquées CE et une crème solaire de gamme pédiatrique renouvelée régulièrement.

## Au quotidien
- **Faites un essai** : beaucoup de clubs ouvrent leurs portes en septembre ; les stages de vacances permettent aussi de découvrir.
- **Matériel** : demandez conseil au club pour la taille de la raquette ; certains en prêtent pour les premières séances. Des chaussures adaptées aux surfaces limitent les glissades et les entorses.
- **Échauffement** : les éducateurs le prévoient en général ; à la maison aussi, quelques minutes de jeu doux avant de « taper fort ».
- **Au soleil** : planifiez si possible les séances le matin ou en fin de journée, avec chapeau, eau et crème.
- **En famille** : badminton au jardin, ping-pong au parc, échanges contre un mur : autant d’occasions de bouger ensemble.
- **Valorisez les progrès** : un premier échange de dix balles est une victoire.

## Questions fréquentes
**Le tennis est-il trop technique pour un enfant de 6 ans ?**
Pas forcément. Les clubs adaptent le matériel et les terrains. Si votre enfant se décourage, une autre activité de coordination (danse, gymnastique) peut convenir pour quelque temps.

**Faut-il un certificat médical pour le tennis ?**
Pour un mineur licencié, le questionnaire de santé suffit en général, sauf si une réponse est positive.

**Mon enfant a mal au coude ou à l’épaule après les séances.**
Signalez-le à l’éducateur (la taille de la raquette ou la technique peuvent être en cause) et consultez si la douleur persiste.

**Le tennis de table compte-t-il vraiment comme activité physique ?**
Oui : déplacements rapides, réflexes, coordination. Pratiqué avec intensité, il essouffle et fait transpirer.

## Quand demander conseil
Consultez si une douleur articulaire persiste, après une torsion de la cheville avec impossibilité de prendre appui, ou si votre enfant présente des signes d’insolation (maux de tête, fatigue inhabituelle, somnolence). Une fièvre élevée avec peau chaude et sèche, des propos incohérents ou un malaise par forte chaleur sont des urgences : appelez le 15 ou le 112.

${END}`,
    tags: ['tennis', 'badminton', 'tennis de table', 'ping-pong', 'raquette', 'coordination', 'soleil', 'club'],
    sources: [S.santeSport, S.mpediaChoix, S.santeSoleil],
  },
  {
    ...KID,
    slug: 'athletisme-course-a-pied-enfant-6-10-ans',
    title: 'Athlétisme et course à pied entre 6 et 10 ans : courir, sauter, lancer en s’amusant',
    summary: 'L’athlétisme fait découvrir toutes les familles de gestes (courses, sauts, lancers) ; repères sur l’endurance après 8 ans, l’hydratation, l’asthme d’effort et la chaleur.',
    category: 'sport',
    body_md: `Courir, sauter, lancer : l’athlétisme reprend les gestes les plus naturels de l’enfance et les transforme en jeux. C’est souvent un excellent sport de base, qui prépare à beaucoup d’autres disciplines.

## En bref
- Santé publique France cite l’**athlétisme** parmi les sports individuels de **coordination** recommandés à partir de 8 ans, âge où l’**endurance** devient intéressante.
- Chez les plus jeunes, l’athlétisme se pratique surtout sous forme de **jeux** variés.
- **Boire régulièrement**, avant et pendant l’effort, sans attendre la soif.
- En cas d’**asthme**, la course de fond fait partie des efforts plus souvent déclencheurs : échauffement progressif et efforts fractionnés aident.
- Par **forte chaleur**, évitez les heures les plus chaudes et raccourcissez les séances.

## Comprendre
L’athlétisme regroupe des courses (vitesse, haies, relais, demi-fond), des sauts (longueur, hauteur) et des lancers. Pour un enfant de l’école élémentaire, les clubs proposent souvent des ateliers ludiques qui font découvrir tous ces gestes. Santé publique France recommande, à partir de 8 ans, de privilégier les activités d’endurance, qui favorisent la santé des muscles et des os ainsi que les compétences sociales et mentales.

L’hydratation est un point clé. mpedia rappelle qu’une hydratation insuffisante est fréquente chez les jeunes sportifs et augmente le risque de crampes, de courbatures et de blessures musculaires. Il est conseillé de boire dès avant le début de l’effort et pendant les pauses, sans attendre d’avoir soif, et d’adapter selon la chaleur, la durée et l’intensité.

Pour les enfants asthmatiques, l’Assurance Maladie range la course de fond parmi les activités plus souvent déclencheuses et le sprint parmi les moins asthmogènes. Elle conseille un bon échauffement, un retour au calme progressif, des efforts brefs entrecoupés de pauses, et, sur prescription, un traitement à prendre avant l’effort.

## Au quotidien
- **Chaussures** : des baskets de sport à la bonne pointure, avec un bon maintien, suffisent pour débuter.
- **Échauffement** : quelques minutes de course lente et de jeux avant d’accélérer.
- **Gourde** à chaque séance, et un goûter simple pour la sortie (fruit, pain, produit laitier).
- **Le jour d’une compétition** : un repas léger et peu gras environ trois heures avant, une petite collation si besoin, selon les conseils de mpedia.
- **Courir en famille** : course-poursuite au parc, petite boucle à allure de conversation, relais avec les frères et sœurs.
- **Respectez les sensations** : on ralentit si on ne peut plus parler, on s’arrête en cas de douleur.
- **Par temps chaud**, préférez le matin ou le soir et adaptez la durée.

## Questions fréquentes
**Mon enfant peut-il courir une longue distance avec moi ?**
Les sources consultées ne fixent pas de distance par âge. Privilégiez le jeu, l’alternance marche et course, et des sorties où il peut parler en courant. Arrêtez-vous au moindre signe de douleur ou de fatigue importante.

**Faut-il des boissons spéciales pour l’effort ?**
Pour l’enfant, l’eau reste la boisson de référence. mpedia évoque l’intérêt possible de boissons adaptées aux efforts longs, mais déconseille fermement les boissons énergisantes, à ne pas confondre avec elles.

**Il a souvent un point de côté : est-ce inquiétant ?**
Un point de côté passe en général en ralentissant et en respirant calmement. S’il revient à chaque séance ou s’accompagne d’autres signes (douleur dans la poitrine, essoufflement inhabituel), consultez.

**Courir sur la route est-il conseillé ?**
Les espaces sans circulation (parcs, stades, chemins) sont plus adaptés aux enfants, avec un adulte présent.

## Quand demander conseil
Consultez si votre enfant s’essouffle anormalement, tousse ou siffle à l’effort, se plaint de douleurs répétées (tibias, talons, genoux) ou boite. Une douleur dans la poitrine, un malaise, une perte de connaissance ou une difficulté à respirer pendant l’effort imposent d’appeler le 15 ou le 112.

${END}`,
    tags: ['athlétisme', 'course à pied', 'courir', 'endurance', 'hydratation', 'asthme d’effort', 'saut', 'lancer'],
    sources: [S.santeSport, S.mpediaAlim, S.ameliAsthme],
  },
  {
    ...KID,
    slug: 'rugby-handball-basket-sports-collectifs-contact-enfant',
    title: 'Rugby, handball, basket : sports collectifs et contacts, ce que les parents doivent savoir',
    summary: 'Les sports collectifs développent l’endurance et l’esprit d’équipe ; certificat spécifique pour le rugby, protections marquées CE, chocs à la tête : les points à vérifier.',
    category: 'sport',
    body_md: `Passer le ballon, défendre ensemble, célébrer un but ou un essai : les sports collectifs plaisent à beaucoup d’enfants très actifs. Certains comportent des contacts, ce qui demande quelques précautions supplémentaires.

## En bref
- **Football, basket, handball et rugby** font partie des sports collectifs d’**endurance** intéressants à partir de 8 ans ; le basket développe aussi l’**adresse** dès 6-8 ans.
- En 2021, le **rugby** (à XV, à XIII et à VII) figurait parmi les disciplines à **contraintes particulières** pour lesquelles un certificat médical reste exigé ; la liste a été revue en 2023 : vérifiez auprès du club.
- Les **protections** (protège-dents, épaulières, protège-tibias…) sont des équipements de protection individuelle : **marquage CE**, notice et date de fabrication.
- Après un **choc à la tête**, des symptômes comme maux de tête, nausées, vertiges ou confusion doivent faire arrêter le jeu et consulter.
- Le plaisir de jouer ensemble prime sur le résultat.

## Comprendre
Les sports collectifs combinent course, changements de rythme, adresse et coopération. Ils peuvent aider un enfant timide à s’ouvrir aux autres. Le rugby, le handball et le basket se jouent souvent dans des formats adaptés aux enfants, avec moins de joueurs et des règles simplifiées.

Pour la licence d’un mineur, le questionnaire de santé remplace en principe le certificat. En 2021, la liste officielle des disciplines à contraintes particulières, pour lesquelles un certificat de non-contre-indication est requis, comprenait toutefois le rugby (mpedia précise : un certificat de moins d’un an). Un décret d’août 2023 a réduit cette liste : le club ou la fédération vous dira ce qui s’applique aujourd’hui.

La DGCCRF a contrôlé les protections des grands sports collectifs (protège-dents, épaulières, protège-tibias, protections articulaires). Elle a relevé des produits qui absorbaient mal les chocs, un protège-dents qui couvrait mal l’arcade dentaire, et des notices ou marquages manquants.

Enfin, l’ARS Île-de-France rappelle qu’une **commotion cérébrale** (traumatisme crânien léger) peut entraîner des maux de tête, des nausées, des vertiges, une vision brouillée, de la fatigue, des troubles de la mémoire ou de l’attention et de l’irritabilité. La plupart des personnes récupèrent en quelques jours ou semaines, mais un suivi est parfois nécessaire.

## Au quotidien
- **Interrogez le club** : formats de jeu par âge, apprentissage progressif des contacts, règles de sécurité, conduite à tenir après un choc.
- **Achetez les protections** à la bonne taille, avec marquage CE visible, notice et date de fabrication. Remplacez-les si elles sont abîmées ou trop petites.
- **Après un choc à la tête**, l’enfant sort du jeu. Prévenez-vous mutuellement entre parents et éducateurs, et surveillez-le les jours suivants.
- **Gourde, tenue adaptée à la météo** et chaussures adaptées au terrain.
- **Encouragez toute l’équipe** depuis la ligne de touche, et laissez l’arbitre arbitrer.
- **Respectez le repos** après une blessure : la reprise se décide avec le médecin.

## Questions fréquentes
**Le rugby est-il trop dangereux pour un enfant ?**
Les sources consultées ne le déconseillent pas : il fait partie des sports collectifs d’endurance proposés aux enfants. Les formats adaptés à l’âge, un encadrement formé et le respect des règles réduisent les risques.

**Mon enfant s’est cogné la tête et dit que tout va bien : peut-il reprendre le match ?**
Par prudence, non. Les symptômes d’une commotion peuvent apparaître ou s’accentuer dans les heures qui suivent. Il vaut mieux le faire examiner et le surveiller.

**Le protège-dents est-il obligatoire ?**
Cela dépend du sport et des règles du club ou de la fédération. Renseignez-vous et choisissez un modèle marqué CE qui couvre bien l’arcade dentaire.

**Mon enfant asthmatique peut-il faire du basket ou du rugby ?**
Si son asthme est bien contrôlé, tous les sports sont en principe possibles, même si le basket et le rugby font partie des plus souvent déclencheurs d’asthme d’effort. Parlez-en avec son médecin.

## Quand demander conseil
Consultez après tout choc à la tête suivi de symptômes, même légers, ou si votre enfant change de comportement, dort mal ou a du mal à se concentrer dans les jours qui suivent. Appelez le 15 ou le 112 en cas de perte de connaissance, de convulsion, de vomissements répétés, de somnolence inhabituelle ou de confusion.

${END}`,
    tags: ['rugby', 'handball', 'basket', 'sport collectif', 'commotion cérébrale', 'protège-dents', 'certificat médical', 'contact'],
    safety_critical: true,
    sources: [S.mpediaCertif, S.dgccrfEPI, S.arsTCCL],
  },
  {
    ...KID,
    slug: 'escalade-accrobranche-parc-trampoline-securite-enfant',
    title: 'Escalade, accrobranche, parcs de trampolines : les vérifications avant de laisser grimper ou sauter',
    summary: 'Ces activités très appréciées des 6-10 ans demandent un matériel en bon état et une surveillance constante ; les conseils de la DGCCRF après ses contrôles de parcs de loisirs.',
    category: 'securite',
    body_md: `Grimper sur un mur, traverser des passerelles dans les arbres, rebondir sur des trampolines : ces activités offrent des sensations fortes et beaucoup de mouvement. Elles reposent aussi sur des équipements qui doivent être en parfait état.

## En bref
- En 2024, la DGCCRF a contrôlé plus de 300 sites de loisirs ; environ **13 % présentaient des manquements**, et **13 parcs ont été suspendus**.
- **Trampolines** : cubes de mousse usés, filets déchirés, consignes d’âge insuffisantes ont été relevés.
- **Accrobranche** : bois abîmé, baudriers périmés, filets troués, consignes absentes.
- **Escalade** : tapis de réception trop fins, vis saillantes, baudriers hors d’usage, absence de contrôle annuel.
- Demandez les **certificats de contrôle** (moins d’un an) et **surveillez les enfants en permanence**.

## Comprendre
L’enquête de la DGCCRF publiée en octobre 2026 montre que ces activités, très fréquentées en famille et lors des anniversaires, restent sensibles à l’usure du matériel. Dans les parcs de trampolines, trois accidents ont été signalés en 2024, dont deux impliquant des enfants. Les contrôleurs ont aussi constaté que certains organismes privés de vérification délivraient des certificats sur la base de normes inadaptées ou minimisaient les défauts.

L’escalade en club est une discipline à part entière, citée par mpedia parmi les sports possibles pour les enfants. Elle développe la force, la coordination, la concentration et la confiance. L’encadrant rémunéré doit être qualifié et déclaré auprès des services de l’État, qui lui délivrent une carte professionnelle, rappelle le ministère des Sports.

## Au quotidien
Les conseils de la DGCCRF aux familles :
- **Lisez les avis récents** et méfiez-vous des commentaires qui signalent du matériel abîmé ou un manque de surveillance.
- **Demandez les certificats de contrôle** : ils doivent dater de moins d’un an.
- **Inspectez l’installation** : filets et cubes intacts sur un trampoline, bois sain et câbles en bon état sur un parcours, tapis épais au pied d’un mur.
- **Vérifiez les consignes** : elles doivent être claires, visibles et expliquées par le personnel (âge minimum, nombre de sauteurs, gestes interdits).
- **Surveillez vos enfants en permanence**, même dans un parc qui paraît sécurisé.

Quelques réflexes en plus :
- **Tenue** : vêtements près du corps, cheveux attachés, pas de bijoux, chaussures fermées pour l’accrobranche.
- **Respectez les âges et tailles minimum** indiqués pour chaque parcours.
- **Respectez le nombre de sauteurs** autorisé sur chaque trampoline et les consignes de comportement.
- **Pause et gourde** régulières : ces activités fatiguent vite.

## Questions fréquentes
**Le personnel doit-il expliquer le fonctionnement des baudriers ?**
Oui, les consignes doivent être présentées par le personnel. En accrobranche, l’enfant doit savoir utiliser son système d’assurage avant de monter ; n’hésitez pas à redemander une démonstration.

**Comment savoir si un parc est contrôlé ?**
Demandez le certificat de contrôle et sa date. S’il date de plus d’un an ou si on ne peut pas vous le montrer, renoncez.

**Un anniversaire en parc de trampolines, bonne idée ?**
Cela peut l’être, à condition de vérifier l’état des installations, le respect des consignes et la présence d’adultes attentifs. Prévoyez assez d’accompagnateurs.

**Que faire si je constate un équipement dangereux ?**
Signalez-le immédiatement au personnel et n’utilisez pas l’équipement. Si rien ne change, renoncez à l’activité : un filet troué, un cube écrasé ou un baudrier abîmé font partie des défauts relevés par la DGCCRF lors de ses contrôles.

## Quand demander conseil
Consultez si votre enfant boite, a mal au poignet ou à la cheville après une chute. Une chute de hauteur, un choc à la tête suivi d’une perte de connaissance, de vomissements ou d’une confusion, une douleur au dos ou au cou, ou l’impossibilité de bouger un membre imposent d’appeler le 15 ou le 112, sans déplacer l’enfant si une atteinte du dos ou du cou est possible.

${END}`,
    tags: ['escalade', 'accrobranche', 'trampoline', 'parc de loisirs', 'sécurité', 'DGCCRF', 'anniversaire', 'baudrier'],
    safety_critical: true,
    sources: [S.dgccrfParcs, S.mpediaChoix, S.sportsEducateur],
  },
  {
    ...KID,
    slug: 'equitation-escrime-tir-a-l-arc-enfant',
    title: 'Équitation, escrime, tir à l’arc : des sports d’adresse et de confiance pour les 6-10 ans',
    summary: 'Confiance en soi avec le poney, respect de l’adversaire en escrime, concentration au tir à l’arc : ce que ces disciplines apportent, et les points de vigilance (allergies, équipement, encadrement).',
    category: 'sport',
    body_md: `Tous les enfants ne rêvent pas de ballon. Certains se passionnent pour les poneys, d’autres pour les duels de sabre ou la précision d’une flèche. Ces disciplines, moins souvent évoquées, ont pourtant beaucoup à offrir entre 6 et 10 ans.

## En bref
- Santé publique France indique que l’**équitation** peut aider un enfant **timide** à prendre confiance, que l’**escrime** apprend le **respect de l’adversaire** et que le **tir à l’arc** développe l’**adresse**.
- En cas d’**allergie au cheval ou à la paille**, l’équitation peut être déconseillée chez un enfant asthmatique.
- L’équipement de protection (casque d’équitation, masque et veste d’escrime…) doit porter le **marquage CE**.
- Ces sports se pratiquent avec un **encadrement qualifié**.

## Comprendre
Entre 6 et 8 ans, Santé publique France conseille les activités qui développent l’équilibre, l’attention et la coordination. Les trois disciplines de cet article en font partie à leur manière :
- **L’équitation** demande équilibre et posture, mais aussi une relation avec l’animal : soigner, brosser, guider un poney donne confiance et responsabilité.
- **L’escrime** combine déplacements rapides, réflexes et stratégie, dans un cadre très codifié (salut, règles, arbitrage).
- **Le tir à l’arc** sollicite la concentration, le calme et la précision, avec des règles de sécurité strictes sur le pas de tir.

L’Assurance Maladie signale que l’équitation peut être déconseillée chez l’enfant asthmatique allergique au cheval ou à la paille ; parlez-en avec son médecin.

Les équipements de protection individuelle doivent porter un marquage CE visible, être vendus avec une notice et une date de fabrication. La DGCCRF a constaté, lors de contrôles, des protections mal adaptées à la morphologie ou absorbant mal les chocs.

## Au quotidien
- **Faites un essai** : centres équestres, salles d’armes et clubs de tir à l’arc proposent souvent des séances découverte ou des stages pendant les vacances.
- **Équitation** : casque d’équitation à la bonne taille, marqué CE ; chaussures fermées à petit talon ; pantalon souple. Demandez au centre ce qu’il prête.
- **Escrime** : le masque, la veste et le gant sont souvent prêtés aux débutants ; vérifiez leur état.
- **Tir à l’arc** : respectez strictement les consignes du pas de tir ; on ne va chercher ses flèches que lorsque l’encadrant l’autorise.
- **Hygiène et sécurité avec les animaux** : se laver les mains après le poney, ne jamais passer derrière un cheval sans le prévenir.
- **Budget** : renseignez-vous sur le coût total (licence, cotisation, cartes de séances, équipement).

## Questions fréquentes
**Mon enfant est très timide : l’équitation peut-elle l’aider ?**
Santé publique France le suggère. La relation avec le poney et la progression visible d’une séance à l’autre peuvent renforcer la confiance. Laissez-lui le temps d’apprivoiser l’animal.

**L’escrime est-elle risquée ?**
Elle se pratique avec un équipement qui protège le visage et le corps et dans un cadre très réglementé. Vérifiez l’état des protections et la qualification de l’encadrement.

**Ces sports sont-ils assez « physiques » ?**
Oui. L’équitation travaille l’équilibre et le gainage, l’escrime est très cardio, le tir à l’arc renforce le dos et les bras. Complétez par des jeux et des trajets actifs pour atteindre l’heure quotidienne.

**Faut-il un certificat médical ?**
Pour une licence de mineur, le questionnaire de santé suffit en général, sauf réponse positive. Un club non affilié peut avoir ses propres règles.

## Quand demander conseil
Parlez au médecin d’une allergie connue aux animaux ou d’un asthme avant de commencer l’équitation. Consultez après une chute de cheval si votre enfant a mal, boite ou se plaint de la tête. Une chute avec perte de connaissance, douleur au dos ou au cou, vomissements ou confusion impose d’appeler le 15 ou le 112 sans le déplacer.

${END}`,
    tags: ['équitation', 'poney', 'escrime', 'tir à l’arc', 'confiance en soi', 'enfant timide', 'allergie', 'casque'],
    sources: [S.santeSport, S.ameliAsthme, S.dgccrfEPI],
  },
  // ───────────────────────────── Motivation et vie du sportif ─────────────────────────────
  {
    ...KID,
    slug: 'enfant-veut-arreter-son-sport-ou-n-aime-pas-le-sport',
    title: 'Mon enfant veut arrêter son sport (ou n’aime pas le sport) : comprendre et réagir',
    summary: 'Sentiment d’incompétence, moqueries, conflit, pression : chercher la raison avec l’éducateur, encourager à finir la saison, puis laisser changer ; et des pistes pour l’enfant qui « n’aime pas bouger ».',
    category: 'sport',
    body_md: `En novembre, il adorait le hand. En février, il pleure le mercredi midi. Ou alors, il n’a jamais aimé le sport et le dit haut et fort. Ces situations sont fréquentes et méritent d’être écoutées avant d’être tranchées.

## En bref
- Un abandon a souvent une cause : **sentiment d’incompétence, moqueries, conflit avec un camarade, pression de la compétition**.
- **Parlez avec l’éducateur** pour comprendre ce qui se passe.
- mpedia conseille d’**encourager l’enfant à aller jusqu’au bout de la saison**, puis de lui laisser la possibilité de changer.
- **Ne forcez pas** un enfant à pratiquer un sport qu’il refuse : aidez-le plutôt à trouver une activité qui lui plaît.
- Bouger ne veut pas forcément dire compétition : roller, natation, balades, danse comptent aussi.

## Comprendre
Selon mpedia, un enfant reste motivé lorsqu’il se sent compétent. Le regard des autres, flatteur pour un enfant performant, peut décourager celui qui est en difficulté. Les moqueries, un conflit avec un camarade ou la pression des matchs peuvent aussi faire perdre l’envie.

Santé publique France rappelle que le plaisir est l’une des clés de la persévérance, et qu’un enfant contraint risque de vivre l’activité comme une corvée. Pour un enfant qui n’aime pas le sport, elle suggère des loisirs moins compétitifs comme le roller ou la natation. mpedia insiste dans le même sens : mieux vaut aider l’enfant à découvrir ce qui lui plaît que le forcer, et « un peu tous les jours » reste plus efficace qu’une grosse séance de temps en temps.

Aller au bout de la saison n’est pas une punition : c’est une façon d’apprendre la persévérance, à condition que la cause du malaise ait été entendue et, si besoin, traitée.

## Au quotidien
- **Ouvrez la discussion à froid**, pas juste avant la séance : « J’ai l’impression que tu n’as plus envie d’aller au hand. Qu’est-ce qui se passe ? »
- **Écoutez sans juger** : fatigue, peur de mal faire, camarade qui se moque, entraîneur trop dur, horaire qui empiète sur les jeux…
- **Rencontrez l’éducateur** : il voit ce qui se passe pendant les séances et peut ajuster (changement de groupe, rôle différent dans l’équipe).
- **Agissez sur la cause** quand c’est possible : moins de séances, autre groupe, passage en loisir.
- **Proposez un engagement limité** : « On termine la saison ensemble, puis tu choisiras. »
- **Préparez la suite** : stages de vacances, séances d’essai en juin ou septembre pour découvrir autre chose.
- **Pour l’enfant qui n’aime pas le sport** : jeux dehors, vélo en famille, piscine, randonnée, danse dans le salon, petits défis (sauter à la corde, marcher jusqu’à la boulangerie).

## Questions fréquentes
**Faut-il absolument finir la saison ?**
C’est la recommandation générale de mpedia, pour apprendre à persévérer. Mais si votre enfant subit des moqueries répétées, un comportement inadapté d’un adulte ou une détresse importante, sa protection passe avant.

**Mon enfant change d’activité chaque année : est-ce un problème ?**
Pas forcément. Découvrir plusieurs disciplines au fil du temps est même encouragé. L’essentiel est qu’il bouge et y prenne plaisir.

**Il dit qu’il est « nul en sport » : comment l’aider ?**
Valorisez ses progrès personnels plutôt que la comparaison avec les autres. Une activité où il se sent compétent, même peu connue, peut changer son regard sur le sport.

**Et si c’est moi qui tiens à ce sport ?**
mpedia met en garde contre le fait de projeter ses propres envies de parent, qui peut créer une pression sur l’enfant. Partager le sport ensemble, sans attente de résultat, peut être une alternative.

## Quand demander conseil
Parlez au médecin si le refus de bouger s’accompagne d’essoufflement, de douleurs, d’une grande fatigue, d’un mal-être avec son corps ou d’une tristesse persistante. Si votre enfant évoque des violences ou un comportement déplacé d’un adulte, appelez le 119. En cas de détresse psychologique, le 3114 répond jour et nuit.

${END}`,
    tags: ['motivation', 'arrêter le sport', 'abandon', 'n’aime pas le sport', 'moqueries', 'persévérance', 'éducateur'],
    sources: [S.mpediaChoix, S.santeSport, S.mpediaSurpoids],
  },
  {
    ...KID,
    slug: 'alimentation-hydratation-enfant-sportif-6-10-ans',
    title: 'Manger et boire quand on fait du sport à 6-10 ans : goûter, gourde et boissons à éviter',
    summary: 'Un enfant qui fait du sport a surtout besoin d’une alimentation équilibrée et d’eau ; repères pour le goûter avant l’entraînement, le jour de compétition, et pourquoi les boissons énergisantes sont à proscrire.',
    category: 'alimentation',
    body_md: `Faut-il manger des pâtes avant le match ? Une boisson spéciale pour le tournoi ? Un complément pour « avoir de l’énergie » ? Pour un enfant de 6 à 10 ans, les réponses sont plus simples qu’on ne le pense.

## En bref
- Une **alimentation variée et équilibrée** suffit à l’enfant qui fait du sport : trois repas et un goûter, sans grignotage.
- **Boire régulièrement**, dès avant l’effort et pendant les pauses, sans attendre la soif : l’eau reste la boisson de référence.
- Le **jour d’une compétition** : un repas léger et peu gras environ trois heures avant, et éventuellement une petite collation (fruit, barre de céréales).
- Les **boissons énergisantes** sont à proscrire chez l’enfant.
- Aucun **complément alimentaire** sans avis médical : leur efficacité n’est pas démontrée et certains peuvent être nocifs.

## Comprendre
mpedia considère qu’un enfant est « sportif », au sens nutritionnel, à partir d’environ 10 heures de sport par semaine, ce qui est rarement le cas entre 6 et 10 ans. Pour la grande majorité des enfants, il suffit donc de suivre les repères habituels : des féculents à chaque repas, des fruits et légumes, des produits laitiers, une à deux portions de viande, poisson ou œuf par jour, un peu de matières grasses, en privilégiant les féculents plutôt que les produits sucrés.

L’hydratation est le point sur lequel les jeunes sportifs font le plus souvent défaut : mpedia rappelle qu’un manque d’eau favorise crampes, courbatures et blessures musculaires. Il faut l’adapter à la chaleur, à la durée et à l’intensité de l’effort.

Les **boissons énergisantes** (à base de caféine, de taurine, souvent très sucrées) ne doivent pas être confondues avec les boissons conçues pour l’effort. Santé.fr, avec la Fédération française de cardiologie, souligne que la publicité entretient cette confusion, que leur effet sur l’effort est plutôt négatif (déshydratation, troubles du rythme cardiaque possibles en cas d’excès) et que leur teneur en sucre et en caféine est élevée. mpedia les déconseille formellement aux enfants.

## Au quotidien
- **Le goûter avant l’entraînement de 17 h** : pain et morceau de fromage, fruit et yaourt, compote et quelques biscuits simples… un goûter classique convient.
- **La gourde** : remplie d’eau, à chaque séance. Habituez votre enfant à boire quelques gorgées à chaque pause.
- **La veille d’une compétition** : un repas habituel, avec des féculents (un plat de pâtes, de riz ou de pommes de terre, par exemple).
- **Le jour J** : un repas léger, peu gras, environ trois heures avant ; une petite collation juste avant si besoin. Évitez les gros repas.
- **Après l’effort** : d’abord boire, puis un en-cas si l’enfant a faim ; le repas suivant associe féculents et protéines.
- **Lors des tournois longs**, prévoyez de l’eau en quantité, des fruits, du pain, et un endroit à l’ombre.
- **Gardez les sodas et boissons sucrées** pour les occasions, et rayez les boissons énergisantes de la liste.

## Questions fréquentes
**Mon enfant a très faim après le sport : faut-il le limiter ?**
Un enfant qui grandit et qui bouge a besoin d’énergie. Proposez un repas ou un en-cas équilibré ; en cas de doute sur sa croissance ou son poids, parlez-en au médecin.

**Les boissons « pour sportifs » sont-elles utiles ?**
Pour les efforts courts, l’eau suffit. mpedia indique que des boissons adaptées peuvent être utiles lors d’efforts prolongés ; demandez conseil au médecin ou à l’éducateur avant d’en utiliser.

**Il veut des protéines en poudre comme les grands : que répondre ?**
Les compléments ne sont pas recommandés chez l’enfant : une alimentation variée couvre ses besoins. Certains produits peuvent même être nocifs ou contenir des substances dopantes. Parlez-en au médecin.

**Peut-il faire du sport le ventre vide ?**
Mieux vaut éviter. mpedia recommande trois repas et un goûter : pour une séance de fin d’après-midi, le goûter pris après l’école aide à tenir l’effort, sans qu’il soit utile de manger copieusement juste avant.

## Quand demander conseil
Consultez si votre enfant perd du poids, saute des repas, se préoccupe beaucoup de son poids ou de son apparence, ou s’il a souvent des crampes, des malaises ou une grande fatigue. Un malaise avec palpitations, douleur dans la poitrine ou perte de connaissance, notamment après une boisson énergisante, impose d’appeler le 15 ou le 112.

${END}`,
    tags: ['alimentation', 'goûter', 'hydratation', 'gourde', 'boissons énergisantes', 'compléments alimentaires', 'compétition', 'enfant sportif'],
    sources: [S.mpediaAlim, S.santeBoissons],
  },
  // ───────────────────────────── Santé et sécurité ─────────────────────────────
  {
    ...KID,
    slug: 'sport-enfant-forte-chaleur-soleil-coup-de-chaleur',
    title: 'Sport et jeux dehors par forte chaleur : protéger son enfant du soleil et du coup de chaleur',
    summary: 'Horaires, eau, vêtements, chapeau, crème : les gestes pour que votre enfant continue de bouger l’été, et les signes du coup de chaleur qui imposent d’appeler le 15.',
    category: 'securite',
    safety_critical: true,
    body_md: `Tournoi de fin d’année, stage d’été, après-midi au city-stade : les enfants ne pensent ni à boire ni à se mettre à l’ombre quand ils jouent. Pendant les fortes chaleurs, c’est aux adultes d’organiser l’activité.

## En bref
- Par forte chaleur, **évitez tout entraînement entre 12 h et 18 h**, et adaptez l’intensité et la durée à la température.
- Faites **boire avant, pendant et après l’effort**, sans attendre la soif : seule l’eau hydrate efficacement.
- Contre le soleil : **éviter l’exposition entre 10 h et 16 h**, vêtements couvrants, **chapeau à bords larges**, lunettes adaptées, crème solaire pédiatrique.
- Un enfant qui joue au soleil est **autant exposé** qu’un enfant immobile sur une serviette.
- **Fièvre élevée, peau chaude et sèche, maux de tête intenses, propos incohérents, malaise** : appelez le 15 ou le 112.

## Comprendre
Santé.fr rappelle que le risque de coup de chaleur existe **même chez les personnes en bonne condition physique**. Pour l’activité physique, la consigne est claire : pas d’entraînement entre 12 h et 18 h lors des fortes chaleurs, une hydratation avant, pendant et après, et une intensité adaptée.

mpedia distingue deux situations. L’**insolation** survient après une exposition prolongée au soleil, surtout sur la tête et la nuque : maux de tête, fatigue inhabituelle, sensation de chaleur, visage rouge, somnolence, fièvre souvent modérée. Elle peut survenir même sans forte chaleur, voire par temps nuageux, et un effort intense et prolongé la favorise. Le **coup de chaleur** est plus grave : forte fièvre, vomissements, confusion, perte de connaissance, crampes. Il nécessite une prise en charge immédiate.

Côté soleil, Santé.fr insiste sur les vêtements (la meilleure protection), le chapeau à larges bords plutôt que la casquette, des lunettes de catégorie 3 ou 4 marquées CE et une crème de gamme pédiatrique, résistante à l’eau, à large spectre, renouvelée au moins toutes les deux heures et après chaque baignade. La crème ne permet pas de prolonger l’exposition.

## Au quotidien
- **Décalez les séances** : le matin tôt ou en fin de journée. Demandez au club ou au centre de loisirs comment il s’organise en cas de canicule.
- **Préparez le sac** : grande gourde remplie d’eau fraîche, chapeau, tee-shirt léger de rechange, crème solaire, brumisateur.
- **Imposez des pauses à l’ombre** et quelques gorgées d’eau à chaque arrêt.
- **Humidifiez visage et nuque** avec un brumisateur pendant l’effort.
- **Habillez léger** : vêtements amples, respirants, de préférence couvrants.
- **Surveillez les signes** : un enfant qui se plaint de la tête, devient rouge, très fatigué ou somnolent arrête l’activité et se met au frais.
- **Consultez la vigilance météo** et respectez les annulations décidées par le club ou la mairie.
- **Ne laissez jamais un enfant** dans une voiture ou un espace surchauffé, même quelques minutes.

## Questions fréquentes
**Faut-il annuler le sport dès qu’il fait chaud ?**
Pas forcément, mais il faut l’adapter : horaires, durée, intensité, pauses et eau. Par forte chaleur, évitez la tranche 12 h-18 h.

**Mon enfant a la peau mate : la crème est-elle utile ?**
Toutes les peaux doivent être protégées. Santé.fr recommande un indice élevé (50 ou 50+) pour les peaux claires et une protection contre les UVA et les UVB ; les vêtements restent la première barrière.

**Une casquette suffit-elle ?**
Elle ne protège ni la nuque ni les oreilles : un chapeau à bords larges est préférable.

**Que faire en attendant les secours en cas de coup de chaleur ?**
Arrêtez toute activité, installez l’enfant à l’ombre ou au frais, enveloppez-le de linges humides et frais et, s’il est bien réveillé, proposez-lui à boire. Ne donnez aucun médicament sans avis médical.

## Quand demander conseil
Consultez rapidement si votre enfant a des maux de tête, une fatigue inhabituelle ou de la fièvre après une exposition au soleil. Appelez immédiatement le 15 ou le 112 en cas de fièvre élevée, de peau chaude, rouge et sèche, de vomissements, de confusion, de comportement inhabituel, de convulsions ou de perte de connaissance. Canicule info service répond au 0 800 06 66 66 (appel gratuit).

${END}`,
    tags: ['chaleur', 'canicule', 'coup de chaleur', 'insolation', 'soleil', 'crème solaire', 'hydratation', 'été'],
    sources: [S.santeChaleur, S.mpediaChaleur, S.santeSoleil],
  },
  {
    ...KID,
    slug: 'entorse-chute-douleur-sport-enfant-que-faire',
    title: 'Entorse, chute, douleur pendant le sport : les bons réflexes et quand consulter',
    summary: 'Arrêter l’activité, appliquer la règle GREC (glace, repos, élévation, compression), savoir quand consulter dans la journée et quand appeler le 15 après une blessure sportive.',
    category: 'premiers-secours',
    safety_critical: true,
    body_md: `Une torsion de cheville sur le terrain, une chute sur le poignet à la récréation : les petites blessures font partie de la vie des enfants qui bougent. Bien réagir dans les premières minutes et savoir quand consulter évite bien des complications.

## En bref
- Au moindre traumatisme : **arrêter l’activité**, ne pas « finir le match ».
- Pour une entorse : règle **GREC** — **Glace** (enveloppée dans un linge, une vingtaine de minutes), **Repos**, **Élévation** du membre, **Compression** légère.
- **Consulter dans la journée** si la douleur est violente, si l’enfant ne peut pas marcher ou utiliser le membre, si l’articulation est très gonflée ou « a du jeu ».
- Chez l’enfant qui tombe en se rattrapant avec les mains, la **fracture du poignet** est fréquente.
- **Aucun médicament** sans l’avis du pharmacien ou du médecin, qui adaptera au poids et à l’âge de l’enfant.

## Comprendre
Une entorse est une blessure des ligaments d’une articulation, causée par un mouvement brusque. Santé.fr distingue l’entorse bénigne (étirement, douleur parfois passagère, gonflement modéré), moyenne (douleur plus vive, gonflement rapide, bleu en quelques heures) et grave (rupture d’un ligament, articulation instable). Une entorse peut aussi s’accompagner d’une fracture.

L’Assurance Maladie liste les signes qui doivent faire consulter dans les 24 heures après une torsion de cheville : douleur intense qui empêche de continuer, gonflement rapide avec parfois un bleu, craquement ou sensation de déboîtement, difficultés à marcher, impossibilité de prendre appui, douleur qui ne s’estompe pas. Une entorse mal soignée peut laisser des récidives et une instabilité.

Chez l’enfant, l’Assurance Maladie rappelle que les chutes sont fréquentes et que la fracture du poignet est courante quand il tombe en se retenant avec les mains. En cas d’urgence vitale ou de doute, appelez le 15.

## Au quotidien
- **Sur le terrain** : asseyez l’enfant, retirez délicatement la chaussure si la douleur le permet, appliquez du froid (poche de glace dans un linge, jamais directement sur la peau).
- **À la maison** : jambe surélevée sur un coussin, bande élastique posée sans serrer en attendant l’avis médical.
- **Observez** : l’enfant peut-il poser le pied, faire quelques pas, bouger les doigts ? Le gonflement augmente-t-il ?
- **Douleur** : demandez conseil au pharmacien ou au médecin avant tout médicament, y compris les gels ; Santé.fr déconseille l’aspirine dans ce contexte.
- **Reprise** : attendez l’accord du médecin ; une reprise trop précoce expose aux récidives.
- **Prévention** : échauffement qui reproduit les gestes du sport sans forcer, chaussures adaptées et en bon état, protections conseillées par le club, activité adaptée aux capacités de l’enfant.

## Questions fréquentes
**Il boite mais dit qu’il n’a pas très mal : faut-il consulter ?**
Une boiterie qui persiste, même sans douleur importante, mérite un avis médical. Santé.fr conseille aussi de consulter si aucune amélioration n’apparaît après 48 heures.

**Faut-il faire une radio ?**
C’est le médecin qui décide, selon le mécanisme de la blessure, la douleur et l’examen, notamment s’il suspecte une fracture.

**Chaud ou froid sur une entorse ?**
Le froid, dans les premières heures, pour limiter le gonflement : c’est le « G » de la règle GREC.

**Combien de temps sans sport ?**
Cela dépend de la gravité. Le médecin peut proposer une immobilisation (strapping, attelle, orthèse), parfois de la kinésithérapie, et précisera la date de reprise.

## Quand demander conseil
Consultez dans la journée en cas de douleur violente, d’impossibilité de marcher ou d’utiliser le membre, d’articulation déformée, très gonflée ou instable. Appelez le 15 ou le 112 si l’os semble déplacé ou sort de la peau, si le membre devient pâle, froid ou insensible, en cas de douleur au dos ou au cou après une chute (ne déplacez pas l’enfant), ou si un choc à la tête s’accompagne de signes inquiétants.

${END}`,
    tags: ['entorse', 'cheville', 'chute', 'blessure', 'GREC', 'glace', 'fracture du poignet', 'boiterie'],
    sources: [S.santeEntorse, S.ameliEntorse, S.ameliUrgences],
  },
  {
    ...KID,
    slug: 'choc-a-la-tete-commotion-sport-enfant-surveillance',
    title: 'Choc à la tête pendant le sport : reconnaître une commotion et surveiller son enfant',
    summary: 'Après un choc à la tête, l’enfant sort du jeu et reste surveillé pendant 48 heures ; les symptômes d’une commotion et les signes qui imposent d’appeler le 15.',
    category: 'premiers-secours',
    safety_critical: true,
    body_md: `Un coup de coude dans un duel, une chute de vélo, une tête contre le sol en gymnastique : les chocs à la tête sont fréquents chez les enfants. La plupart sont bénins, mais certains provoquent une commotion cérébrale qu’il faut savoir reconnaître.

## En bref
- Après un choc à la tête, l’enfant **arrête l’activité**, même s’il dit aller bien.
- **Surveillez-le pendant 48 heures** : des changements de comportement peuvent apparaître pendant cette période.
- Symptômes possibles d’une **commotion** : maux de tête, nausées, vertiges, vision brouillée, fatigue, troubles du sommeil, difficultés de mémoire ou d’attention, irritabilité.
- **Perte de connaissance, confusion, vomissements, somnolence inhabituelle, convulsion** : appelez le 15 ou le 112.
- En cas de doute, appelez le 15.

## Comprendre
L’ARS Île-de-France définit le traumatisme crânien léger, aussi appelé **commotion cérébrale**, comme une perturbation du fonctionnement du cerveau d’origine traumatique. Il peut se manifester par une perte de connaissance brève, une amnésie des événements, une confusion ou une désorientation (« être groggy »). Les symptômes qui suivent sont physiques (maux de tête, nausées, vertiges, vision brouillée, fatigue, sommeil perturbé), cognitifs (mémoire, attention) et émotionnels (irritabilité, anxiété). La majorité des personnes récupèrent en quelques jours ou semaines, mais certaines gardent des symptômes plus longtemps : d’où l’intérêt d’un repérage et d’un accompagnement précoces.

L’ARS Normandie rappelle que le choc à la tête est fréquent chez l’enfant et souvent sans gravité, mais qu’il est important de le **surveiller pendant 48 heures**, car des changements de comportement peuvent apparaître pendant cette période. Sa démarche tient en quatre mots : protéger, observer, agir, surveiller.

L’Assurance Maladie résume la règle générale : en cas d’urgence vitale ou de doute, appelez le 15.

## Au quotidien
- **Sur le moment** : sortez l’enfant du jeu, installez-le au calme et observez-le. S’il ne répond pas normalement ou s’il a perdu connaissance, appelez le 15.
- **Prévenez** l’éducateur, l’autre parent, l’école : chacun doit savoir qu’il a reçu un choc.
- **Les 48 heures suivantes** : observez son comportement, son humeur, son appétit, son sommeil, sa façon de parler et de marcher. Il peut dormir, mais réveillez-le si son sommeil vous paraît anormal.
- **Repos** : pas de sport ni d’activité à risque de chute tant que des symptômes persistent.
- **Écrans et devoirs** : allégez s’ils déclenchent des maux de tête ou de la fatigue.
- **Reprise du sport** : décidée avec le médecin, de façon progressive, quand les symptômes ont disparu.
- **Prévention** : casque attaché à vélo (obligatoire avant 12 ans), protections adaptées, respect des règles de jeu.

## Questions fréquentes
**Il n’a pas perdu connaissance : peut-il y avoir une commotion ?**
Oui. Une confusion, une amnésie de l’épisode, des maux de tête ou des vertiges peuvent suffire. Faites-le examiner en cas de symptôme.

**Faut-il l’empêcher de dormir ?**
Il peut se reposer. Ce qui compte, c’est de pouvoir le réveiller facilement et qu’il réagisse normalement. Une somnolence inhabituelle ou un réveil difficile imposent d’appeler le 15.

**Faut-il un scanner ?**
Le plus souvent, l’imagerie n’est pas nécessaire ; elle est réservée à certaines situations jugées à risque par le médecin.

**Plusieurs jours après, il a du mal à se concentrer en classe.**
Parlez-en au médecin : ces troubles font partie des symptômes possibles après une commotion et méritent un suivi.

## Quand demander conseil
Consultez rapidement après tout choc à la tête suivi de symptômes, même légers. Appelez immédiatement le 15 ou le 112 en cas de perte de connaissance, de convulsion, de vomissements, de maux de tête qui s’aggravent, de somnolence inhabituelle, de confusion, de propos incohérents, de troubles de la vue ou de la marche, ou d’écoulement par le nez ou les oreilles.

${END}`,
    tags: ['choc à la tête', 'commotion cérébrale', 'traumatisme crânien', 'surveillance 48 heures', 'chute', 'sport', 'urgence'],
    sources: [S.arsTete, S.arsTCCL, S.ameliUrgences],
  },
  {
    ...KID,
    slug: 'asthme-enfant-sport-activite-physique',
    title: 'Enfant asthmatique et sport : bien choisir, s’échauffer et organiser le PAI',
    summary: 'Si l’asthme est bien contrôlé, tous les sports sont possibles ; sports plus ou moins déclencheurs, prévention de l’asthme d’effort et rôle du projet d’accueil individualisé à l’école.',
    category: 'maladies-chroniques',
    body_md: `Un diagnostic d’asthme fait souvent craindre que l’enfant doive renoncer au sport. C’est plutôt l’inverse : l’activité physique aide à mieux contrôler l’asthme, et un asthme bien contrôlé permet de pratiquer tous les sports.

## En bref
- L’enfant asthmatique a besoin, comme les autres, d’environ **une heure d’activité par jour** : elle réduit l’essoufflement à l’effort et améliore le contrôle de l’asthme.
- Si l’asthme est **bien contrôlé** et sans crise récente, **tous les sports sont autorisés**, et l’enfant n’est pas exclu de l’EPS.
- Certains sports sont **moins souvent déclencheurs** (natation, gymnastique, handball, karaté, sprint…), d’autres **plus souvent** (course de fond, football, basket, rugby, cyclisme…).
- **Échauffement**, retour au calme progressif, efforts fractionnés et, sur prescription, traitement avant l’effort.
- Le **PAI** organise l’accueil à l’école, y compris en sport.

## Comprendre
L’Assurance Maladie explique que l’activité physique augmente la capacité respiratoire et aide à mieux contrôler l’asthme. Elle classe parmi les sports les moins asthmogènes la marche, le handball, la gymnastique, le sprint, le karaté, la boxe, le ski de piste, le golf, la natation et le water-polo ; parmi les plus asthmogènes, le basket, le rugby, le cyclisme, la course de fond, le football, le hockey et le patinage sur glace, le ski de fond. Cela ne signifie pas qu’ils sont interdits : un enfant passionné de football peut jouer avec un asthme bien contrôlé et les bonnes précautions.

Quelques situations demandent une attention particulière : l’équitation peut être déconseillée en cas d’allergie au cheval ou à la paille, et il vaut mieux choisir, si possible, des piscines peu chlorées.

À l’école, le **projet d’accueil individualisé (PAI)** est le plus souvent indispensable. Rédigé à la demande de la famille avec le directeur, le médecin scolaire et à partir des recommandations du médecin qui suit l’enfant, il peut prévoir des aménagements, des dispenses d’activités incompatibles avec la santé de l’enfant (avec des activités de remplacement), l’utilisation des médicaments en cas de crise et les gestes d’urgence.

## Au quotidien
- **Parlez du sport** au médecin qui suit l’asthme : il adaptera si besoin le traitement et le plan d’action.
- **Échauffement** de plusieurs minutes et **retour au calme** progressif à chaque séance.
- **Efforts brefs avec des pauses** ; les efforts prolongés restent possibles s’ils sont peu intenses.
- **En hiver dehors**, un foulard devant le nez et la bouche aide.
- **Le dispositif d’inhalation** prescrit doit toujours être dans le sac, et l’enfant doit savoir l’utiliser.
- **Informez l’éducateur** : signes d’une crise, conduite à tenir, personne à prévenir.
- **Sorties scolaires et stages** : vérifiez que le PAI ou les consignes accompagnent l’enfant.
- **Pollution** : limitez l’effort en extérieur lors des pics.

## Questions fréquentes
**Faut-il un certificat médical pour un enfant asthmatique ?**
Le questionnaire de santé comporte des questions sur l’état de santé : si l’une des réponses est positive, une consultation est nécessaire. C’est aussi l’occasion de faire le point sur le traitement.

**Il tousse après chaque entraînement : est-ce de l’asthme d’effort ?**
Seul un médecin peut le dire. Une toux, un sifflement ou un essoufflement inhabituel à l’effort doivent être signalés.

**Peut-il faire de la natation en compétition ?**
La natation fait partie des sports les moins asthmogènes. Parlez du rythme d’entraînement avec son médecin.

**Peut-on le dispenser d’EPS ?**
L’Assurance Maladie rappelle que l’enfant asthmatique n’est pas exclu des cours de sport. Le médecin peut préciser des adaptations ; une dispense totale est rarement la meilleure solution.

## Quand demander conseil
Consultez si les symptômes à l’effort augmentent, si l’enfant utilise plus souvent son traitement de crise ou s’il renonce à bouger par peur de l’essoufflement. Appelez le 15 ou le 112 en cas de crise qui ne cède pas au traitement prévu, de difficulté à parler, de lèvres bleutées, de respiration très rapide ou d’épuisement.

${END}`,
    tags: ['asthme', 'asthme d’effort', 'sport', 'PAI', 'échauffement', 'EPS', 'inhalateur', 'maladie chronique'],
    safety_critical: true,
    sources: [S.ameliAsthme, S.mpediaCertif],
  },
  {
    ...KID,
    slug: 'surpoids-enfant-bouger-sans-culpabiliser',
    title: 'Surpoids chez l’enfant : l’aider à bouger avec plaisir, sans le culpabiliser',
    summary: 'Ne pas forcer, choisir une activité qui lui plaît, multiplier les occasions de bouger en famille, réduire les écrans : des repères bienveillants pour accompagner un enfant en surpoids.',
    category: 'sport',
    body_md: `Quand le médecin évoque un surpoids, beaucoup de parents pensent d’abord « il faut qu’il fasse du sport ». Bouger aide, bien sûr, mais la façon de s’y prendre compte autant que l’activité elle-même.

## En bref
- **Ne forcez pas** un enfant à pratiquer un sport qu’il refuse : aidez-le à découvrir une activité qui lui plaît.
- **Un peu tous les jours** vaut mieux qu’une longue séance de temps en temps : promenades, jeux dehors, environ une heure par jour.
- La **natation**, peu traumatisante, convient bien à un enfant en surpoids, selon mpedia.
- **Réduire les écrans** et le temps assis fait partie du même effort.
- Les changements concernent **toute la famille**, sans stigmatiser l’enfant.

## Comprendre
mpedia rappelle que l’immobilité favorise la prise de poids et que la publicité pousse à grignoter. Il recommande de multiplier les occasions de bouger : marche ou vélo plutôt que voiture, escaliers plutôt qu’ascenseur, jeux actifs avec les amis, petites tâches à la maison ou au jardin. Fixer un temps d’écran raisonnable, expliqué à l’enfant, sans télévision pendant les repas ni écran dans la chambre, aide aussi.

Le regard porté sur l’enfant est essentiel. Il ne doit ni se sentir coupable ni penser qu’il déçoit ses parents. Mieux vaut parler de ce que l’activité lui apporte concrètement (être moins essoufflé, plus à l’aise dans les jeux, s’habiller plus facilement) que de son poids. Le sport et la piscine peuvent être des moments délicats face au regard des autres : soyez attentifs à son ressenti.

Pour le choix du sport, mpedia souligne qu’une activité choisie uniquement pour répondre à un besoin précis risque d’être abandonnée si l’enfant ne s’y épanouit pas. Le plaisir et le sentiment de compétence restent les meilleurs moteurs.

## Au quotidien
- **Bougez ensemble** : balade après le dîner, vélo le week-end, piscine en famille, jardinage. Partager l’activité renforce la motivation.
- **Laissez-le choisir** parmi plusieurs propositions, et essayez sans engagement (séance d’essai, stage).
- **Fixez des objectifs progressifs** : aller à l’école à pied deux fois par semaine, puis davantage.
- **Valorisez l’effort et le plaisir**, jamais le chiffre de la balance.
- **Écrans** : définissez ensemble des plages, et proposez une activité dehors avant la console.
- **À table** : pas de dessert-récompense ni de légumes-punition, et pas d’interdits multiples.
- **Les frères et sœurs** suivent les mêmes règles, pour que l’enfant ne se sente pas mis à part.
- **Les parents d’accord entre eux** : une ligne commune évite les tensions.

## Questions fréquentes
**Quel sport est le plus adapté à un enfant en surpoids ?**
Celui qu’il a envie de pratiquer. La natation est souvent citée car elle ménage les articulations, mais la danse, le judo, le vélo ou un sport collectif peuvent tout aussi bien convenir.

**Il a honte d’aller à la piscine.**
Écoutez-le sans minimiser. Une tenue dans laquelle il se sent bien, un créneau moins fréquenté, une activité en famille d’abord peuvent l’aider à reprendre confiance.

**Faut-il le peser souvent ?**
Le suivi du poids et de la taille se fait avec le médecin, sur les courbes de croissance. À la maison, mieux vaut ne pas faire du poids un sujet quotidien.

**Le sport suffit-il à faire perdre du poids ?**
Le surpoids de l’enfant se prend en charge globalement : alimentation, activité, sommeil, écrans, avec le médecin. mpedia rappelle qu’une perte de poids trop rapide se reprend souvent vite : l’objectif est durable.

## Quand demander conseil
Parlez-en au médecin si la courbe de poids s’accélère, si votre enfant s’essouffle beaucoup ou se fatigue vite pendant le sport, ou s’il exprime un mal-être avec son corps. En cas de souffrance psychologique importante, le 3114 répond à toute heure. Une douleur dans la poitrine ou un malaise à l’effort impose d’appeler le 15 ou le 112.

${END}`,
    tags: ['surpoids', 'obésité', 'bouger', 'activité physique', 'écrans', 'famille', 'estime de soi', 'natation'],
    sources: [S.mpediaSurpoids, S.mpediaChoix],
  },
  {
    ...KID,
    slug: 'enfant-handicap-trouver-activite-sportive-club',
    title: 'Enfant en situation de handicap : trouver une activité sportive et un club adaptés',
    summary: 'Simulateur « Trouve ton parasport », Handiguide des sports, fédérations, certificat selon le cadre de pratique, Pass’Sport jusqu’à 19 ans pour les bénéficiaires de l’AEEH : les étapes pour se lancer.',
    category: 'sport',
    body_md: `Tous les enfants ont besoin de bouger, et le sport est aussi un formidable lieu de rencontres. Quand votre enfant vit avec un handicap, trouver la bonne activité demande parfois un peu plus de recherches : des outils existent pour vous aider.

## En bref
- Le simulateur **« Trouve ton parasport »**, développé par le Comité paralympique et sportif français, oriente vers des sports à partir de sept questions.
- Le **Handiguide des sports** permet de trouver une structure proche qui propose l’activité choisie.
- La **fédération** de la discipline peut aussi orienter vers des clubs adaptés.
- Le **certificat médical** n’est pas toujours obligatoire : cela dépend du cadre de pratique.
- Le **Pass’Sport** s’adresse aux jeunes de 6 à 19 ans en situation de handicap bénéficiaires de l’**AEEH**.

## Comprendre
Mon Parcours Handicap, le site public dédié, propose une démarche en deux temps. D’abord **choisir l’activité** grâce au simulateur « Trouve ton parasport », qui pose des questions sur le mode de déplacement (debout, en fauteuil), le type de handicap, le souhait de loisir ou de compétition, de sport individuel ou collectif, les contraintes à éviter (chocs, efforts violents, activités aquatiques…), les qualités physiques recherchées et les motivations (bien-être, autonomie, rencontres…).

Ensuite **trouver un club** : en contactant la fédération de la discipline, qui oriente vers des clubs adaptés aux souhaits et aux capacités, ou en consultant le Handiguide des sports, qui recense des structures proposant des activités adaptées à un handicap moteur ou mental.

Pour le certificat médical, Mon Parcours Handicap rappelle que son exigence dépend du cadre : club affilié à une fédération ou non, pratique seul ou en milieu scolaire. Le simulateur de Service-Public.fr permet de vérifier la situation selon la discipline, l’âge et le cadre de pratique.

Côté budget, le Pass’Sport 2026-2027 apporte une aide de 50 euros, déduite de l’inscription, pour les jeunes de 6 à 19 ans bénéficiaires de l’AEEH, valable pour les inscriptions entre le 1er septembre et le 31 décembre 2026.

## Au quotidien
- **Faites le simulateur avec votre enfant** : ses envies comptent autant que ses capacités.
- **Contactez plusieurs clubs** et demandez à assister à une séance : accueil, accessibilité des locaux, formation des encadrants, taille des groupes.
- **Parlez avec l’éducateur** des besoins de votre enfant : communication, matériel, fatigue, gestes à connaître.
- **Associez les professionnels** qui le suivent (médecin, kinésithérapeute, ergothérapeute, psychomotricien) pour identifier les activités adaptées et les précautions.
- **Les accueils de loisirs** accueillent aussi les enfants en situation de handicap, avec souvent des activités sportives.
- **Renseignez-vous auprès de la MDPH** sur les aides possibles ; Mon Parcours Handicap indique que la PCH peut financer une partie de la pratique sportive.
- **Vérifiez votre éligibilité au Pass’Sport** sur pass.sports.gouv.fr et transmettez le code au club.

## Questions fréquentes
**Mon enfant peut-il pratiquer dans un club « ordinaire » ?**
Oui, c’est souvent possible. Le Handiguide signale les clubs qui proposent des activités adaptées ; parlez de ses besoins avec l’encadrement.

**Faut-il viser la compétition ?**
Pas nécessairement. Le simulateur permet de choisir entre loisir et compétition ; l’essentiel est le plaisir et le bien-être.

**Comment savoir si un certificat est nécessaire ?**
Utilisez le simulateur de Service-Public.fr, ou demandez au club. Pour un mineur licencié dans un club affilié, le questionnaire de santé s’applique en principe, sauf réponse positive.

**Mon enfant se fatigue vite : est-ce un obstacle ?**
Parlez-en avec l’éducateur et les professionnels qui le suivent : durée des séances, pauses, intensité peuvent être adaptées.

## Quand demander conseil
Parlez au médecin de votre enfant avant de commencer une nouvelle activité, surtout en cas de troubles cardiaques, respiratoires, d’épilepsie ou de fragilité osseuse. En cas de malaise, de crise ou de difficulté à respirer pendant une séance, appelez le 15 ou le 112.

${END}`,
    tags: ['handicap', 'parasport', 'handisport', 'sport adapté', 'Handiguide', 'AEEH', 'Pass’Sport', 'club'],
    sources: [S.handicapChoisir, S.spPassSport, S.monenfantLoisirs],
  },
  // ───────────────────────────── Organisation et démarches ─────────────────────────────
  {
    ...KID,
    slug: 'activites-extrascolaires-accueil-loisirs-assurance-pass-sport',
    title: 'Activités extrascolaires : organiser la semaine, accueils de loisirs, assurance et Pass’Sport',
    summary: 'Combien d’activités, comment les caser sans épuiser l’enfant, ce que proposent les accueils de loisirs, l’assurance à vérifier et l’aide Pass’Sport de 50 euros pour 2026-2027.',
    category: 'droits-demarches',
    body_md: `Sport le mercredi, musique le jeudi, piscine le samedi… Entre les envies de l’enfant, les horaires de travail et le budget, construire la semaine des activités relève parfois du casse-tête. Quelques repères pour s’y retrouver.

## En bref
- Entre 6 et 11 ans, **une à deux séances de sport par semaine** suffisent en général si l’enfant bouge par ailleurs.
- Gardez du **temps libre** et un **sommeil de 9 à 11 heures** par nuit.
- Les **accueils de loisirs** (mercredis, avant et après la classe, vacances) proposent des activités sportives, artistiques, culturelles et de plein air.
- Vérifiez l’**assurance** : responsabilité civile et dommages corporels.
- Le **Pass’Sport 2026-2027** apporte **50 euros** aux 6-17 ans dont le quotient familial est inférieur ou égal à 699 euros, pour une inscription entre le 1er septembre et le 31 décembre 2026.

## Comprendre
La logistique compte : un club éloigné, des trajets longs ou des horaires tardifs peuvent user la motivation de toute la famille au fil de l’année. Une activité bien choisie est aussi une activité tenable dans la durée.

Les **accueils de loisirs**, présentés par monenfant.fr (Cnaf), accueillent les enfants dès la scolarisation, y compris ceux en situation de handicap. Ils ouvrent selon les structures les mercredis, avant ou après la classe, le midi et pendant les vacances. Ils sont déclarés et contrôlés par l’État, et encadrés par une équipe qualifiée. Les tarifs sont fixés par chaque organisateur, souvent selon les revenus et les aides de la Caf ou de la MSA ; les places étant limitées, mieux vaut s’inscrire plusieurs semaines à l’avance.

Côté **assurance**, Service-Public.fr précise qu’en club, l’organisateur doit avoir une assurance responsabilité civile couvrant les participants, mais que l’assurance couvrant les dommages que l’enfant se cause à lui-même est facultative ; le club doit informer de la possibilité d’en souscrire une. En pratique libre, hors club, l’assurance est facultative : une garantie accident de la vie couvre les dommages corporels, la responsabilité civile ceux causés aux autres.

Le **Pass’Sport** est une aide de l’État de 50 euros par jeune, déduite directement par le club. Le code est envoyé par e-mail à la mi-septembre aux familles éligibles. Il est accepté par les clubs affiliés à une fédération agréée, les associations agréées et certaines structures commerciales de loisirs sportifs. Une aide complémentaire de la Caf pour le matériel sportif est annoncée pour le début de 2027.

## Au quotidien
- **Faites un planning** de la semaine avec votre enfant : école, trajets, activités, devoirs, temps libre, coucher.
- **Une activité physique, une activité calme** : l’équilibre convient souvent bien.
- **Repérez le coût total** : licence, cotisation, équipement, déplacements, stages.
- **Vérifiez les contrats** d’assurance habitation et scolaire : la responsabilité civile peut être incluse, mais certains sports exclus.
- **Pass’Sport** : vérifiez votre éligibilité sur pass.sports.gouv.fr, gardez l’e-mail reçu et transmettez le code au club avant le 31 décembre 2026.
- **Mutualisez les trajets** avec d’autres familles du club.
- **Pendant les vacances**, les stages et accueils de loisirs permettent de découvrir d’autres activités.

## Questions fréquentes
**Trois activités par semaine, est-ce trop ?**
Cela dépend de l’enfant et de son rythme. Surveillez la fatigue, le sommeil et l’envie d’y aller. Un mercredi sans rien de prévu peut aussi être précieux.

**Le Pass’Sport s’applique-t-il aux activités culturelles ?**
Non, il concerne la pratique sportive dans les structures partenaires. Une carte interactive permet de les trouver.

**Je n’ai pas reçu l’e-mail du Pass’Sport.**
Vérifiez votre éligibilité sur pass.sports.gouv.fr et vos courriers indésirables. L’e-mail est envoyé à l’adresse transmise par la Caf ou la MSA, un par enfant éligible.

**Le centre de loisirs propose du sport : est-ce suffisant ?**
Oui, cela peut l’être. Les accueils de loisirs proposent des jeux de plein air et des activités sportives ; c’est une bonne façon de bouger sans inscription en club.

## Quand demander conseil
Si votre enfant semble épuisé, dort mal, se plaint souvent de maux de ventre ou de tête avant ses activités, ou n’a plus envie de rien, parlez-en avec lui et avec son médecin. Pour les questions d’aides, la Caf, la mairie et le club sont vos interlocuteurs.

${END}`,
    tags: ['activités extrascolaires', 'accueil de loisirs', 'centre de loisirs', 'mercredi', 'Pass’Sport', 'assurance', 'budget', 'organisation'],
    sources: [S.monenfantLoisirs, S.spPassSport, S.spAssurSport],
  },
  {
    ...KID,
    slug: 'proteger-son-enfant-violences-dans-le-sport-signal-sports',
    title: 'Protéger son enfant des violences dans le sport : repères, signaux et à qui s’adresser',
    summary: 'Contrôle d’honorabilité des encadrants, cellule Signal-Sports, 119 : ce que font les pouvoirs publics, les signaux qui doivent alerter et les démarches si votre enfant se confie.',
    category: 'securite',
    safety_critical: true,
    body_md: `Le club est un lieu de confiance, où l’enfant passe du temps avec des adultes qui ne font pas partie de sa famille. La très grande majorité des encadrants sont bienveillants, mais des violences existent aussi dans le sport. Connaître les dispositifs permet de réagir vite.

## En bref
- Les encadrants (éducateurs, dirigeants, arbitres, surveillants de baignade, intervenants auprès de mineurs) font l’objet d’un **contrôle d’honorabilité**.
- Un éducateur rémunéré doit être **qualifié et déclaré** auprès des services de l’État.
- Victimes et témoins peuvent écrire à la cellule **Signal-Sports** : signal-sports@sports.gouv.fr.
- En cas d’enfant en danger ou de doute, le **119** est gratuit et confidentiel, par téléphone, formulaire ou tchat sur allo119.gouv.fr.
- Si votre enfant se confie : **écoutez-le, croyez-le, protégez-le**.

## Comprendre
Le ministère des Sports a mis en place une cellule nationale, **Signal-Sports**, qui traite les signalements de violences dans le sport. Selon son bilan publié en avril 2026, elle a traité 2 607 signalements depuis 2020, qui ont conduit à 1 135 mesures administratives visant à écarter des encadrants mis en cause. Le **contrôle d’honorabilité**, qui vérifie que les encadrants ne font pas l’objet d’une interdiction, a permis en 2025 d’écarter 981 personnes des fonctions d’encadrement.

Dans chaque département, le **service départemental à la jeunesse, à l’engagement et aux sports (SDJES)** vérifie que les éducateurs ont un comportement adapté. Il peut ouvrir une enquête administrative, entendre les personnes et prendre des mesures de protection. Les violences peuvent aussi être signalées à la police ou à la gendarmerie, et les associations d’aide aux victimes accompagnent les familles. Le **3018** répond pour les cyberviolences.

Ces violences peuvent prendre plusieurs formes : harcèlement, bizutage, violences sexistes et sexuelles, cyberviolences.

## Au quotidien
- **Renseignez-vous sur le club** : qui encadre ? Quelle qualification ? Les parents peuvent-ils assister aux séances ?
- **Parlez avec votre enfant** de son corps et de ses limites : personne n’a le droit de le toucher d’une manière qui le met mal à l’aise, ni de lui demander de garder un secret qui le gêne.
- **Restez attentifs aux signaux** : refus soudain d’aller à l’entraînement, peur d’un adulte, changement d’humeur, troubles du sommeil, cadeaux ou messages privés d’un encadrant, demandes de se retrouver seul avec lui.
- **Vestiaires et déplacements** : demandez comment le club les organise (présence de plusieurs adultes, règles claires).
- **Si votre enfant se confie** : gardez votre calme, remerciez-le d’avoir parlé, dites-lui qu’il n’y est pour rien, notez ses mots sans l’interroger longuement.
- **Puis agissez** : appelez le 119 pour être conseillé, écrivez à Signal-Sports, contactez le SDJES, et portez plainte si nécessaire.
- **Témoin d’un comportement déplacé** envers un autre enfant ? Les mêmes interlocuteurs peuvent vous écouter et vous orienter.

## Questions fréquentes
**Comment vérifier qu’un éducateur est autorisé à encadrer ?**
Le ministère des Sports rappelle qu’un éducateur rémunéré doit se déclarer et justifier d’une qualification ; il reçoit alors une carte professionnelle. Vous pouvez demander au club la qualification de ses encadrants.

**J’ai un simple doute, sans preuve : puis-je signaler ?**
Oui. Le 119 est fait pour les situations de doute, et des professionnels peuvent vous écouter et vous orienter. Signaler permet aux services compétents d’évaluer la situation.

**Mon enfant ne veut pas que j’en parle.**
Expliquez-lui que vous devez le protéger et que des adultes dont c’est le métier vont l’aider. Le 119 peut vous conseiller sur la manière d’accompagner votre enfant.

**Et si c’est un autre enfant qui harcèle le mien au club ?**
Parlez-en à l’éducateur et au responsable du club. Le harcèlement fait partie des violences à ne pas laisser passer ; si la situation persiste, le 119 et Signal-Sports peuvent vous orienter, et le 3018 en cas de cyberharcèlement.

## Quand demander conseil
Appelez le 119 (gratuit, 24 h/24) pour tout enfant en danger ou en cas de doute. En cas de danger immédiat, appelez le 17 ou le 112. Si votre enfant, ou vous-même, traversez une détresse psychologique, le 3114 répond à toute heure ; le médecin traitant peut aussi orienter vers un accompagnement.

${END}`,
    tags: ['violences', 'sport', 'Signal-Sports', '119', 'protection de l’enfance', 'éducateur', 'harcèlement', 'contrôle d’honorabilité'],
    sources: [S.sportsSignal, S.sportsAffiche, S.sportsEducateur],
  },
];
