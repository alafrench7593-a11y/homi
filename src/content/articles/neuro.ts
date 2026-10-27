/** Articles « Neurodéveloppement » : accessibles à tous les parents, sans bilan ni diagnostic à fournir. Sources consultées le 21/10/2026. */
import type { ArticleSource, LibArticle } from './library';

const C = '2026-10-21';

/** Pages réellement consultées le 2026-10-21. `published` = date de publication ou de mise à jour affichée par la page (absente si la page n'en affiche pas). */
const S = {
  // Repérage, TND, plateformes
  santePco: { label: 'Santé.fr — Repérage et prise en soins des troubles du neuro-développement grâce aux Plateformes de Coordination et d’Orientation (PCO)', url: 'https://www.sante.fr/reperage-et-prise-en-soins-des-troubles-du-neuro-developpement-grace-aux-plateformes-de-coordination', consulted_on: C, published: '2024-02-07' },
  santeAgirTot: { label: 'Santé.fr — Lancement de la campagne de repérage « agir tot » dont l’objectif est d’aider les parents a reconnaitre, le plus tôt possible, les signes d’un développement inhabituel chez leur enfant', url: 'https://www.sante.fr/node/2666205', consulted_on: C, published: '2020-10-13' },
  santeReperage: { label: 'Santé.fr (Handicap.gouv.fr) — Repérage précoce des troubles du neurodéveloppement chez les enfants', url: 'https://www.sante.fr/reperage-precoce-des-troubles-du-neurodeveloppement-chez-les-enfants', consulted_on: C, published: '2025-07-29' },
  santeRetardDev: { label: 'Santé.fr (mpedia, AFPA) — Mon enfant a-t-il un retard de développement ?', url: 'https://www.sante.fr/mon-enfant-t-il-un-retard-de-developpement', consulted_on: C, published: '2021-01-05' },
  arsNaTnd: { label: 'ARS Nouvelle-Aquitaine — Troubles du neurodéveloppement (TND)', url: 'https://www.nouvelle-aquitaine.ars.sante.fr/troubles-du-neurodeveloppement-tnd', consulted_on: C, published: '2026-06-10' },
  dipnReperage612: { label: 'Délégation interministérielle autisme-TND (handicap.gouv.fr) — Circulaire du 23 septembre 2021 et livret « Repérer un trouble du neurodéveloppement chez les enfants de 6 à 12 ans »', url: 'https://handicap.gouv.fr/sites/handicap/files/2021-12/Reperage-autisme-7-12-ans-pochette.pdf', consulted_on: C, published: '2021-09-23' },
  mphForfait: { label: 'Mon Parcours Handicap — Troubles du neurodéveloppement, autisme : le forfait d’intervention précoce', url: 'https://www.monparcourshandicap.gouv.fr/aides/troubles-du-neurodeveloppement-autisme-le-forfait-dintervention-precoce', consulted_on: C, published: '2026-01-20' },
  mphMedicoSocial: { label: 'Mon Parcours Handicap — De quels accompagnements médico-sociaux et sanitaires votre enfant peut-il bénéficier ?', url: 'https://www.monparcourshandicap.gouv.fr/scolarite/de-quels-accompagnements-medico-sociaux-et-sanitaires-votre-enfant-peut-il-beneficier', consulted_on: C, published: '2026-01-09' },
  // Troubles
  mphTdah: { label: 'Mon Parcours Handicap — Qu’est-ce que le trouble du déficit d’attention avec ou sans hyperactivité (TDAH) ?', url: 'https://www.monparcourshandicap.gouv.fr/actualite/quest-ce-que-le-trouble-du-deficit-dattention-avec-ou-sans-hyperactivite-tdah', consulted_on: C, published: '2026-06-09' },
  mphAutisme: { label: 'Mon Parcours Handicap — La journée mondiale de l’autisme 2026', url: 'https://www.monparcourshandicap.gouv.fr/actualite/journee-mondiale-de-sensibilisation-lautisme', consulted_on: C, published: '2026-04-01' },
  mdaAutisme: { label: 'Maison de l’autisme — Fiche pratique « Qu’est-ce que l’autisme ? »', url: 'https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Quest-ce-que-lautisme.pdf', consulted_on: C },
  mphDys: { label: 'Mon Parcours Handicap — Troubles dys : quels aménagements pour la scolarité ?', url: 'https://www.monparcourshandicap.gouv.fr/actualite/troubles-dys-quels-amenagements-pour-la-scolarite', consulted_on: C, published: '2025-10-10' },
  santeLangageApprentissages: { label: 'Santé.fr — Les troubles du langage et des apprentissages', url: 'https://www.sante.fr/les-troubles-du-langage-et-des-apprentissages', consulted_on: C, published: '2024-08-02' },
  santeLangage36: { label: 'Santé.fr (mpedia, AFPA) — Troubles du langage de 3 à 6 ans', url: 'https://www.sante.fr/troubles-du-langage-de-3-6-ans', consulted_on: C, published: '2021-09-16' },
  // Vie quotidienne
  cafHypersensible: { label: 'Caf (Vies de famille) — Comment apaiser un enfant hypersensible ?', url: 'https://caf.fr/allocataires/vies-de-famille/articles/comment-apaiser-un-enfant-hypersensible', consulted_on: C, published: '2022-04-20' },
  santeTroublesSommeil: { label: 'Santé.fr — Troubles du sommeil chez l’enfant', url: 'https://www.sante.fr/node/2055637', consulted_on: C, published: '2026-08-13' },
  santeEndormissement: { label: 'Santé.fr (mpedia, AFPA) — Troubles de l’endormissement, réveils et terreurs nocturnes', url: 'https://www.sante.fr/node/1068883', consulted_on: C, published: '2023-01-13' },
  educSommeil: { label: 'Éducation nationale (La mallette des parents) — Les bienfaits du sommeil pour les enfants', url: 'https://mallettedesparents.education.gouv.fr/print/pdf/node/181', consulted_on: C, published: '2020-04-23' },
  santeSelectivite: { label: 'Santé.fr — Mon enfant ne mange pas de légumes, la sélectivité alimentaire', url: 'https://www.sante.fr/node/1093937', consulted_on: C, published: '2024-10-30' },
  santeAgressivite: { label: 'Santé.fr (mpedia, AFPA) — Comment réagir face à l’agressivité persistante de mon enfant ?', url: 'https://www.sante.fr/node/1093941', consulted_on: C, published: '2023-09-01' },
  // École et droits
  mphAppuis: { label: 'Mon Parcours Handicap — PPRE, PAI, PAP, PPS : en quoi consistent les différentes possibilités d’appui à la scolarisation ?', url: 'https://www.monparcourshandicap.gouv.fr/scolarite/ppre-pai-pap-pps-en-quoi-consistent-les-differentes-possibilites-dappui-la-scolarisation', consulted_on: C, published: '2026-05-06' },
  mphAccompPps: { label: 'Mon Parcours Handicap — Quels sont les accompagnements notifiés par la MDPH dans le PPS ?', url: 'https://www.monparcourshandicap.gouv.fr/scolarite/quels-sont-les-accompagnements-notifies-par-la-mdph-dans-le-pps', consulted_on: C, published: '2026-07-30' },
  mphAmenagements: { label: 'Mon Parcours Handicap — Quels aménagements et adaptations à l’école ?', url: 'https://www.monparcourshandicap.gouv.fr/scolarite/quels-amenagements-et-adaptations-lecole', consulted_on: C, published: '2026-04-29' },
  mphGevasco: { label: 'Mon Parcours Handicap — Qu’est-ce que le GEVA-sco ?', url: 'https://www.monparcourshandicap.gouv.fr/scolarite/quest-ce-que-le-geva-sco', consulted_on: C, published: '2025-12-23' },
  boPas: { label: 'Éducation nationale (Bulletin officiel n° 27 du 4 juillet 2024) — Déploiement des pôles d’appui à la scolarité préfigurateurs', url: 'https://www.education.gouv.fr/bo/2024/Hebdo27/MENE2416076C', consulted_on: C, published: '2024-07-04' },
  mphMdph: { label: 'Mon Parcours Handicap — Le dépôt du dossier et le traitement de la demande par la maison départementale des personnes handicapées', url: 'https://www.monparcourshandicap.gouv.fr/aides/le-depot-du-dossier-et-le-traitement-de-la-demande-par-la-maison-departementale-des-personnes', consulted_on: C, published: '2026-06-18' },
  mphAeeh: { label: 'Mon Parcours Handicap — AEEH : Allocation d’éducation de l’enfant handicapé', url: 'https://www.monparcourshandicap.gouv.fr/glossaire/aeeh', consulted_on: C },
  // Parents
  mphRepit: { label: 'Mon Parcours Handicap — Les solutions de répit pour les aidants', url: 'https://www.monparcourshandicap.gouv.fr/aides/les-solutions-de-repit-pour-les-aidants', consulted_on: C, published: '2025-11-27' },
  santeSanteMentaleParents: { label: 'Santé.fr (Psycom) — La santé mentale des parents', url: 'https://www.sante.fr/node/8433119', consulted_on: C, published: '2025-08-04' },
  mdaAidant: { label: 'Maison de l’autisme — Fiche pratique « Proche aidant de personne autiste »', url: 'https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Proche-aidant-de-personne-autiste.pdf', consulted_on: C },
  gouvAis: { label: 'info.gouv.fr — La plateforme d’écoute « Autisme Info Service » est désormais accessible', url: 'https://www.info.gouv.fr/actualite/la-plateforme-d-ecoute-autisme-info-service-accessible-des-le-2-avril', consulted_on: C, published: '2022-02-23' },
} satisfies Record<string, ArticleSource>;

export const NEURO_SOURCES: Record<keyof typeof S, ArticleSource> = S;

export const NEURO_UPDATED_ON = '2026-10-21';

export type NeuroTopic = 'signs' | 'adhd' | 'autism' | 'dys' | 'language' | 'sensory' | 'sleep' | 'food' | 'emotions' | 'who' | 'appointment' | 'professionals' | 'school' | 'mdph' | 'daily' | 'parents' | 'not_alone';

export interface NeuroArticle extends LibArticle { topic: NeuroTopic }

const DIAG = 'Seuls des professionnels de santé peuvent poser un diagnostic : cet article sert à mieux comprendre et à savoir vers qui se tourner, pas à conclure.';

export const NEURO_ARTICLES: NeuroArticle[] = [
  // 1 ─────────────────────────── Premiers signes ───────────────────────────
  {
    slug: 'neuro-premiers-signes-se-poser-des-questions',
    title: 'Se poser des questions sur le développement de son enfant',
    summary: 'Chaque enfant avance à son rythme ; un décalage qui dure ou une compétence perdue mérite d’en parler tôt à un médecin, sans attendre et sans s’alarmer.',
    body_md: `## En bref
- Se poser des questions sur le développement de son enfant est fréquent et légitime.
- Chaque enfant a son propre rythme : ce qui compte, c’est sa progression dans le temps.
- Un décalage qui **dure**, ou la **perte** d’une compétence déjà acquise, justifie d’en parler.
- Le médecin traitant, le pédiatre ou la PMI sont les premières portes d’entrée.
- Agir tôt permet de proposer une aide adaptée, même avant tout diagnostic.

${DIAG}

## Comprendre
Le développement d’un enfant ne suit pas une ligne droite. Il avance par étapes, avec parfois des pauses, puis des progrès rapides. Un enfant peut marcher tôt et parler plus tard, ou l’inverse. Un petit recul passager après une maladie, un déménagement, une entrée à la crèche ou la naissance d’un frère ou d’une sœur est aussi possible.

Les professionnels observent plusieurs grands domaines :
- **les grands mouvements** : tenir sa tête, s’asseoir, ramper, marcher, courir ;
- **les gestes fins** : attraper, passer un objet d’une main à l’autre, dessiner ;
- **le langage** : babiller, comprendre, dire des mots, faire des phrases ;
- **la relation aux autres et le jeu** : sourire, regarder, partager, imiter, jouer à faire semblant.

Ce qui doit amener à en parler, ce n’est pas une petite avance ou un petit retard isolé, mais :
- un décalage qui **persiste** dans le temps, dans un ou plusieurs domaines ;
- par exemple, un bébé de 6 mois qui ne tient pas sa tête, ou un enfant de 18 mois qui ne dit ni « papa » ni « maman » ;
- la **perte** de compétences déjà acquises (des mots, des gestes, l’intérêt pour les autres), à tout âge ;
- chez l’enfant scolarisé, des difficultés durables d’attention, de lecture, d’écriture, de calcul, de motricité ou de gestion des émotions, à l’école comme à la maison.

La campagne nationale de repérage rappelle qu’il vaut mieux consulter pour rien que d’attendre : le cerveau du jeune enfant est très malléable, et une aide proposée tôt est souvent plus efficace.

## Au quotidien
- **Observez sans vous inquiéter en permanence** : notez ce que vous voyez, avec des exemples concrets et l’âge de votre enfant.
- **Gardez une trace** : un petit carnet ou des notes dans l’application aident à repérer si les choses évoluent.
- **Demandez l’avis de ceux qui le connaissent** : crèche, assistante maternelle, enseignant. Leur regard complète le vôtre.
- **Évitez les comparaisons permanentes** avec les autres enfants ou avec des listes trouvées en ligne : elles inquiètent souvent plus qu’elles n’aident.
- **Continuez à jouer, parler, lire et chanter** avec votre enfant : ces moments simples soutiennent son développement, quel qu’il soit.

## Questions fréquentes
**Mon enfant est « en retard » sur un seul point, faut-il s’inquiéter ?**
Un décalage isolé et passager est fréquent. S’il dure, s’il s’ajoute à d’autres difficultés ou s’il vous préoccupe, parlez-en : le médecin vous aidera à faire la part des choses.

**On me dit d’attendre, mais je reste inquiet. Que faire ?**
Votre ressenti de parent est une information importante. Vous pouvez reformuler vos observations, demander un nouveau rendez-vous ou un autre avis.

**Faut-il un diagnostic pour obtenir de l’aide ?**
Non. Sur prescription d’un médecin, une plateforme de coordination et d’orientation (PCO) peut organiser des bilans et des premières interventions avant tout diagnostic.

**Les écrans ou l’éducation peuvent-ils expliquer ces difficultés ?**
Les troubles du neurodéveloppement sont liés à la façon dont le cerveau se développe ; ils ne sont pas causés par l’éducation. Limiter les écrans reste utile pour tous les jeunes enfants.

## Quand demander conseil
En cas de doute, **n’attendez pas** : parlez-en à votre médecin traitant, à votre pédiatre ou au médecin de PMI. Il examinera votre enfant, écoutera vos observations et pourra, si besoin, l’orienter vers une plateforme de coordination et d’orientation. Une perte de compétences déjà acquises justifie de consulter rapidement. Et si tout va bien, vous repartirez rassuré.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['neurodéveloppement', 'repérage', 'premiers signes', 'développement'],
    sources: [S.santeRetardDev, S.santeAgirTot, S.dipnReperage612],
    status: 'to_review',
    topic: 'signs',
  },
  // 2 ─────────────────────────── TDAH ───────────────────────────
  {
    slug: 'neuro-tdah-comprendre',
    title: 'Le TDAH : comprendre l’attention et l’agitation',
    summary: 'Le TDAH associe, de façon durable et dans plusieurs lieux de vie, des difficultés d’attention, d’impulsivité et parfois d’agitation ; seul un médecin peut le diagnostiquer.',
    body_md: `## En bref
- Le TDAH est un trouble du neurodéveloppement, pas un manque de volonté ni un défaut d’éducation.
- Il associe de l’inattention, de l’impulsivité et parfois de l’hyperactivité.
- Les signes doivent être **durables**, présents **dans plusieurs lieux de vie** et **gênants** au quotidien.
- Des adaptations simples à la maison et à l’école aident beaucoup.
- Le médecin traitant ou le pédiatre est la première personne à consulter.

${DIAG}

## Comprendre
Beaucoup d’enfants bougent, oublient leurs affaires ou coupent la parole : c’est souvent de leur âge. Le TDAH (trouble du déficit de l’attention avec ou sans hyperactivité) est autre chose : un fonctionnement particulier du cerveau qui rend difficile, de façon durable, la régulation de l’attention, des gestes et des envies.

On décrit trois grandes dimensions :
- **L’inattention** : difficulté à rester concentré, à terminer une tâche, à s’organiser ; oublis fréquents ; distraction au moindre bruit.
- **L’impulsivité** : couper la parole, répondre avant la fin de la question, avoir du mal à attendre son tour ou à retenir un geste.
- **L’hyperactivité** : besoin constant de bouger, difficulté à rester assis, agitation des mains ou des pieds.

Un enfant peut être surtout inattentif (on parle parfois d’enfant « dans la lune »), surtout agité, ou les deux. Pour que les médecins évoquent un TDAH, ces signes doivent durer **plus de six mois**, apparaître **dans plusieurs situations** (maison, école, loisirs) et **gêner réellement** l’enfant dans sa vie. Les premiers signes apparaissent en général avant 12 ans.

Selon les sources officielles, environ 6 % des enfants seraient concernés. Le TDAH est souvent associé à d’autres difficultés : troubles « dys », troubles du sommeil, anxiété, difficultés relationnelles. Il ne dit rien de l’intelligence de l’enfant.

## Au quotidien
- **Des consignes courtes**, une à la fois, en le regardant ; demandez-lui de reformuler.
- **Des repères visuels** : tableau de la journée, liste des étapes pour s’habiller ou préparer son cartable.
- **Un coin calme pour les devoirs**, avec peu d’objets et de bruit, et des pauses régulières.
- **Bouger pour mieux se concentrer** : sport, activités physiques, petites pauses actives.
- **Valoriser les efforts** et les réussites, même petites : ces enfants entendent souvent beaucoup de reproches.
- **Échanger avec l’enseignant** : une place près du tableau, des consignes reformulées ou du temps supplémentaire peuvent déjà aider.
- **Préserver le sommeil** : des horaires réguliers et pas d’écran le soir.

## Questions fréquentes
**Mon enfant arrive à se concentrer sur ses jeux vidéo, peut-il avoir un TDAH ?**
Oui, c’est possible : les activités très stimulantes captent plus facilement l’attention. C’est la difficulté à se concentrer sur des tâches moins attractives qui compte.

**Le TDAH disparaît-il en grandissant ?**
Les manifestations évoluent avec l’âge ; l’agitation diminue souvent, mais des difficultés d’attention ou d’organisation peuvent persister. Un accompagnement aide l’enfant à développer ses propres stratégies.

**Faut-il un dossier MDPH pour avoir des aménagements à l’école ?**
Pas forcément. Un plan d’accompagnement personnalisé (PAP) peut être mis en place sans passer par la MDPH, sur avis du médecin scolaire.

**Est-ce de notre faute ?**
Non. Le TDAH n’est causé ni par l’éducation ni par les parents. Votre soutien, en revanche, aide beaucoup votre enfant.

## Quand demander conseil
Si ces difficultés durent, se retrouvent à la maison comme à l’école et pèsent sur votre enfant ou sur la famille, consultez votre médecin traitant ou votre pédiatre. Il pourra orienter vers un médecin formé au TDAH et, si besoin, vers une plateforme de coordination et d’orientation. Si votre enfant exprime une grande souffrance ou des idées noires, consultez sans attendre ; le **3114** répond aussi aux proches inquiets.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['TDAH', 'attention', 'hyperactivité', 'impulsivité', 'neurodéveloppement'],
    min_age_months: 36,
    sources: [S.mphTdah, S.mphAppuis],
    status: 'to_review',
    topic: 'adhd',
  },
  // 3 ─────────────────────────── Autisme ───────────────────────────
  {
    slug: 'neuro-autisme-tsa-comprendre',
    title: 'L’autisme (TSA) : repères pour les parents',
    summary: 'Le trouble du spectre de l’autisme touche la communication, les relations et les comportements, de façon très différente d’un enfant à l’autre ; repéré tôt, il permet un accompagnement adapté.',
    body_md: `## En bref
- L’autisme (trouble du spectre de l’autisme, TSA) est un trouble du neurodéveloppement qui dure toute la vie.
- Il touche la communication et les relations, avec des intérêts et comportements particuliers.
- Chaque personne autiste est différente : on parle de « spectre ».
- L’autisme n’est **jamais** causé par l’éducation ou la personnalité des parents.
- Bilans et premières interventions peuvent commencer avant tout diagnostic.

${DIAG}

## Comprendre
L’autisme apparaît dans la petite enfance et accompagne la personne tout au long de sa vie. Il concernerait environ une personne sur cent en France. On parle de « spectre » parce que les besoins sont très variables : certains enfants parlent beaucoup, d’autres peu ou pas ; certains ont besoin d’un accompagnement important, d’autres d’adaptations plus légères.

Les professionnels décrivent deux grandes dimensions :
- **La communication et les relations sociales** : langage absent, en retard ou particulier (répétition de mots ou de phrases entendus), difficulté à comprendre les gestes, les expressions du visage ou les sous-entendus, regard inhabituel, peu de partage d’intérêt avec l’adulte.
- **Des comportements, intérêts et activités restreints ou répétitifs** : besoin de routines, grande difficulté face aux changements, intérêts très intenses pour certains sujets, mouvements répétés (se balancer, battre des mains), et très souvent des **particularités sensorielles** (forte ou faible sensibilité aux bruits, à la lumière, au toucher, aux goûts).

Les signes apparaissent souvent avant 3 ans. Les sources officielles citent par exemple :
- peu de contact visuel ou de sourire partagé vers 6 à 9 mois ;
- peu de réaction au prénom, pas de pointage ni de gestes pour communiquer vers 9 à 12 mois ;
- pas de babillage ni de gestes sociaux à 12 mois, pas de mots à 18 mois ;
- à tout âge : une **perte** du langage ou des compétences sociales, un repli, des réactions sensorielles très fortes.

Un seul signe ne suffit jamais à conclure, mais il justifie d’en parler.

## Au quotidien
- **Notez vos observations** avec des exemples concrets : cela aidera beaucoup le médecin.
- **Gardez des routines rassurantes** et prévenez à l’avance des changements, avec des mots simples ou des images.
- **Appuyez-vous sur ce que votre enfant aime** : ses centres d’intérêt sont une porte d’entrée pour partager et apprendre.
- **Adaptez l’environnement** : moins de bruit, un coin refuge, des vêtements confortables.
- **Communiquez autrement si besoin** : gestes, images, pictogrammes complètent la parole.
- **Prenez soin de vous** : les démarches peuvent être longues, et le soutien d’autres parents aide.

## Questions fréquentes
**Mon enfant me regarde et fait des câlins, peut-il être autiste ?**
Oui, c’est possible. Les manifestations sont très variées ; un enfant autiste peut être très affectueux. C’est l’ensemble des signes et leur durée qui comptent.

**À partir de quel âge peut-on repérer l’autisme ?**
Des signes peuvent être repérés dès la première ou la deuxième année. Plus l’accompagnement commence tôt, plus il aide l’enfant à progresser.

**Que se passe-t-il après la consultation ?**
Le médecin peut orienter vers une plateforme de coordination et d’orientation, qui organise des bilans et des interventions de proximité, avant même un diagnostic.

**Où trouver une écoute ?**
Autisme Info Service répond gratuitement au 0 800 71 40 40 aux familles et aux proches.

## Quand demander conseil
Parlez-en sans attendre à votre médecin, à votre pédiatre ou au médecin de PMI si vous observez plusieurs de ces signes, et **rapidement** en cas de perte du langage ou des compétences sociales, à tout âge. Il pourra orienter vers une plateforme de coordination et d’orientation ou un centre spécialisé.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['autisme', 'TSA', 'communication', 'neurodéveloppement'],
    sources: [S.mdaAutisme, S.mphAutisme, S.gouvAis],
    status: 'to_review',
    topic: 'autism',
  },
  // 4 ─────────────────────────── DYS ───────────────────────────
  {
    slug: 'neuro-troubles-dys',
    title: 'Les troubles « dys » : quand apprendre demande plus d’efforts',
    summary: 'Dyslexie, dyspraxie, dyscalculie, dysphasie… les troubles dys sont des troubles durables des apprentissages, sans lien avec l’intelligence ni la volonté de l’enfant.',
    body_md: `## En bref
- Les troubles « dys » sont des troubles du neurodéveloppement **durables** et **spécifiques**.
- Ils touchent une ou plusieurs fonctions : lire, écrire, parler, coordonner ses gestes, compter.
- Ils ne traduisent ni un manque d’intelligence, ni de la paresse.
- Le diagnostic se fait en équipe, coordonnée par un médecin.
- À l’école, des aménagements sont possibles, parfois sans dossier MDPH.

${DIAG}

## Comprendre
Votre enfant travaille beaucoup, mais lire, écrire, s’organiser ou compter reste très difficile ? Les troubles dys concernent des fonctions précises du cerveau. L’enfant a les capacités pour apprendre, mais certaines opérations ne s’automatisent pas : elles lui demandent un effort conscient et épuisant là où d’autres enfants les font sans y penser.

Les principaux troubles dys :
- **Dyslexie** : lecture lente, hésitante, avec des erreurs (confusion de sons, de lettres), et très fatigante.
- **Dysorthographie** : erreurs fréquentes à l’écrit, souvent associée à la dyslexie.
- **Dysphasie** (trouble du langage oral) : difficulté à comprendre, à trouver ses mots, à construire des phrases.
- **Dyspraxie** (trouble du développement de la coordination) : maladresse marquée, gestes qui s’automatisent mal, écriture difficile ; faire deux choses à la fois, comme écouter et écrire, est très coûteux.
- **Dyscalculie** : difficulté à comprendre les nombres, à compter, à calculer.

Selon le ministère de la Santé, les troubles spécifiques des apprentissages toucheraient au moins 5 à 6 % des enfants. Ils peuvent coexister entre eux, ou avec un TDAH.

Les signes qui doivent amener à en parler :
- des difficultés qui **persistent** malgré l’entraînement et l’aide ;
- un écart important entre les efforts fournis et les résultats ;
- une grande fatigue après l’école ou les devoirs ;
- un découragement, une perte de confiance en soi, parfois un refus d’aller à l’école.

## Au quotidien
- **Valorisez l’effort** plutôt que le résultat, et rappelez à votre enfant qu’il n’est pas « nul ».
- **Allégez ce qui peut l’être** : lire les consignes à voix haute, le laisser dicter plutôt qu’écrire, utiliser des livres audio.
- **Raccourcissez les séances de devoirs**, avec des pauses.
- **Utilisez des outils** : polices lisibles, documents aérés, ordinateur si un professionnel le conseille.
- **Parlez-en avec l’enseignant** : consignes reformulées, moins de copie, temps supplémentaire, évaluation à l’oral sont des aménagements simples.
- **Cultivez ses talents** en dehors de l’école : sport, art, musique, bricolage.

## Questions fréquentes
**À quel âge peut-on parler de dyslexie ?**
Les difficultés apparaissent souvent au moment de l’apprentissage de la lecture. Le diagnostic demande un bilan complet ; votre médecin vous dira quand il est utile de le faire.

**Qui fait le diagnostic ?**
Le plus souvent une équipe (orthophoniste, psychologue, psychomotricien, ergothérapeute…), coordonnée par un médecin.

**Faut-il passer par la MDPH ?**
Pas forcément. Un plan d’accompagnement personnalisé (PAP) peut être mis en place à l’école sans MDPH. Pour des besoins plus importants (aide humaine, matériel), un dossier MDPH peut être nécessaire.

**Mon enfant va-t-il « guérir » ?**
Les troubles dys durent, mais la rééducation et les adaptations permettent à l’enfant de progresser et de trouver ses propres stratégies.

## Quand demander conseil
Le repérage peut venir des parents, des enseignants ou des professionnels de la petite enfance. Si les difficultés persistent, parlez-en à votre médecin traitant ou au médecin scolaire. Consultez aussi si votre enfant semble très malheureux, anxieux ou refuse d’aller à l’école.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['dys', 'dyslexie', 'dyspraxie', 'dyscalculie', 'apprentissages'],
    min_age_months: 48,
    sources: [S.mphDys, S.santeLangageApprentissages],
    status: 'to_review',
    topic: 'dys',
  },
  // 5 ─────────────────────────── Langage ───────────────────────────
  {
    slug: 'neuro-troubles-du-langage',
    title: 'Langage : quand en parler et comment l’encourager',
    summary: 'Beaucoup de retards de langage sont simples et s’améliorent avec un accompagnement ; certains signes justifient de consulter et de vérifier l’audition.',
    body_md: `## En bref
- Entre 3 et 6 ans, le langage progresse énormément, à des rythmes variables.
- Environ un enfant par classe aurait un trouble de l’évolution du langage.
- Au moindre doute, le médecin vérifie d’abord **l’audition**.
- Parler, lire, chanter avec votre enfant soutient son langage au quotidien.
- Beaucoup de retards simples s’améliorent avant 6 ans avec un accompagnement adapté.

${DIAG}

## Comprendre
Le langage comprend deux versants : **comprendre** ce qu’on nous dit, et **s’exprimer** (trouver les mots, les prononcer, construire des phrases). Un enfant peut avoir des difficultés sur l’un ou sur l’autre, ou sur les deux. Selon le ministère de la Santé, environ 4 à 5 % des enfants ont un trouble de l’évolution du langage.

Quelques repères pour vous aider à vous situer :
- **Vers 18 mois** : l’enfant dit quelques mots et comprend des consignes simples.
- **Vers 3 ans** : il dit « je » et fait des phrases de plus en plus longues. On en parle s’il ne fait pas encore de phrases, a très peu de mots, ou n’est compris que par ses parents.
- **Vers 4 ans** : la plupart des enfants prononcent presque tous les sons. On en parle s’il comprend mal les phrases un peu longues, fait des phrases très courtes, déforme beaucoup les mots ou bégaie de façon gênante.
- **Entre 4 et 6 ans** : il joue avec les mots et les rimes, raconte des histoires. On en parle si sa parole reste peu compréhensible, si ses phrases restent « télégraphiques » ou s’il comprend mal.

Une gêne auditive, même légère ou passagère (otites à répétition), peut freiner le langage : c’est pourquoi l’audition est toujours vérifiée.

Il existe des **retards simples**, qui rattrapent souvent avec un accompagnement, et des **troubles durables** (dysphasie, ou trouble développemental du langage) qui demandent une rééducation régulière.

## Au quotidien
- **Parlez-lui beaucoup**, de ce que vous faites, de ce que vous voyez, en prenant le temps d’écouter ses réponses.
- **Lisez des histoires** tous les jours, en montrant les images et en posant des questions.
- **Chantez des comptines**, jouez aux rimes, aux devinettes.
- **Reformulez plutôt que corriger** : s’il dit « le tien tourt », répondez naturellement « oui, le chien court vite ! ».
- **Laissez-lui le temps** de finir ses phrases, sans parler à sa place.
- **Limitez les écrans**, surtout s’ils remplacent les échanges.
- Si plusieurs langues sont parlées à la maison, continuez : chaque parent peut parler la langue dans laquelle il est le plus à l’aise.

## Questions fréquentes
**Le bilinguisme retarde-t-il le langage ?**
Parler plusieurs langues n’est pas une cause de trouble du langage. En cas de doute, le professionnel évalue le langage dans les différentes langues.

**Mon enfant bégaie, est-ce inquiétant ?**
Des accrocs de parole sont fréquents vers 3-4 ans. S’ils durent, s’aggravent ou le gênent, parlez-en au médecin, qui pourra prescrire un bilan orthophonique.

**Qui prescrit un bilan d’orthophonie ?**
Le médecin (généraliste, pédiatre, PMI). Les séances d’orthophonie sont remboursées sur prescription.

**L’école fait-elle un dépistage ?**
Oui, des bilans de santé sont réalisés pendant la scolarité, notamment en maternelle. Ils ne remplacent pas une consultation si vous avez un doute.

## Quand demander conseil
Au moindre doute, parlez-en à votre médecin : il vérifiera l’audition et pourra prescrire un bilan chez un orthophoniste. Consultez rapidement si votre enfant **perd des mots** qu’il savait dire, s’il ne réagit plus aux sons ou à son prénom, ou s’il ne comprend plus des consignes qu’il comprenait.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['langage', 'parole', 'orthophonie', 'audition', 'neurodéveloppement'],
    min_age_months: 18,
    sources: [S.santeLangage36, S.santeLangageApprentissages],
    status: 'to_review',
    topic: 'language',
  },
  // 6 ─────────────────────────── Sensoriel ───────────────────────────
  {
    slug: 'neuro-difficultes-sensorielles',
    title: 'Bruits, lumières, textures : les particularités sensorielles',
    summary: 'Certains enfants réagissent très fortement, ou au contraire très peu, aux bruits, lumières ou textures ; adapter l’environnement peut beaucoup les soulager.',
    body_md: `## En bref
- Chacun perçoit le monde différemment ; certains enfants sont hypersensibles, d’autres hyposensibles.
- Ces particularités sont fréquentes chez les enfants autistes, mais pas seulement.
- Elles peuvent expliquer des crises, des refus ou des pleurs difficiles à comprendre.
- Adapter l’environnement aide souvent beaucoup.
- Si elles gênent le quotidien, parlez-en au médecin.

${DIAG}

## Comprendre
Nous recevons sans cesse des informations par nos sens : l’ouïe, la vue, le toucher, le goût, l’odorat, mais aussi l’équilibre et la perception de notre propre corps. Notre cerveau trie ces informations et en ignore la plupart. Chez certains enfants, ce tri fonctionne différemment.

- **Les enfants hypersensibles** perçoivent certaines sensations comme trop fortes. Un bruit de sèche-mains, une lumière vive, l’étiquette d’un vêtement, l’odeur de la cantine ou un simple contact peuvent les envahir et provoquer pleurs, colère, fuite ou figement.
- **Les enfants hyposensibles** réagissent peu à certaines sensations et cherchent parfois des sensations fortes : tourner sur eux-mêmes, sauter, se cogner, toucher tout, mettre les objets à la bouche.

Un même enfant peut être hypersensible pour un sens et hyposensible pour un autre. Ces particularités sont fréquentes chez les enfants autistes, mais on les rencontre aussi chez d’autres enfants, avec ou sans trouble du neurodéveloppement. Elles peuvent aussi se manifester par des maux de ventre, des refus alimentaires, des difficultés de sommeil ou une grande fatigue après une journée chargée.

## Au quotidien
- **Observez ce qui déclenche le malaise** : supermarché, cantine, coiffeur, foule, vêtements, certaines textures.
- **Repérez ce qui apaise** : un endroit calme, un objet doudou, un mouvement de balancement, une pression douce, un casque anti-bruit.
- **Adaptez l’environnement** : baisser le bruit et la lumière, prévoir un coin refuge à la maison.
- **Prévenez à l’avance** des situations difficiles et de leur durée, avec des mots ou des images.
- **Respectez certaines préférences** (vêtements doux, sans étiquette, coupe des aliments) sans en faire une bataille.
- **Aidez-le à nommer ce qu’il ressent** : « c’est trop fort pour toi », avec des mots, des images ou des histoires.
- **Prévoyez des temps de récupération** après les moments très stimulants.
- **Valorisez ses forces** : une grande sensibilité va souvent avec une attention fine aux détails et aux autres.

## Questions fréquentes
**Est-ce un caprice ?**
Non. Une réaction sensorielle forte n’est pas un choix : l’enfant subit une sensation réellement désagréable pour lui.

**Faut-il l’habituer en le forçant ?**
Forcer augmente souvent l’angoisse. On peut proposer une exposition très progressive, à son rythme, idéalement avec les conseils d’un professionnel.

**Un casque anti-bruit, est-ce une bonne idée ?**
Il peut aider dans des lieux bruyants. Parlez-en avec les professionnels qui suivent votre enfant pour l’utiliser au bon moment.

**Ces particularités veulent-elles dire que mon enfant est autiste ?**
Pas forcément. Seule une évaluation globale par des professionnels permet de comprendre ce qui se passe.

## Quand demander conseil
Si ces réactions sont intenses, durables, empêchent des activités du quotidien (s’habiller, manger, aller à l’école) ou s’accompagnent d’autres difficultés (langage, relations, motricité), parlez-en à votre médecin ou à votre pédiatre. Il pourra orienter vers un psychomotricien ou un ergothérapeute, notamment via une plateforme de coordination et d’orientation.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['sensorialité', 'hypersensibilité', 'autisme', 'neurodéveloppement'],
    sources: [S.mdaAutisme, S.cafHypersensible],
    status: 'to_review',
    topic: 'sensory',
  },
  // 7 ─────────────────────────── Sommeil ───────────────────────────
  {
    slug: 'neuro-sommeil',
    title: 'Sommeil difficile : des pistes pour toute la famille',
    summary: 'Les troubles du sommeil sont fréquents chez l’enfant, parfois plus marqués en cas de trouble du neurodéveloppement ; des rythmes réguliers et un rituel calme aident souvent toute la famille.',
    body_md: `## En bref
- Les troubles du sommeil touchent 20 à 30 % des moins de 6 ans.
- Ils sont parfois plus présents chez les enfants autistes ou ayant un TDAH.
- Des horaires réguliers, un rituel calme et pas d’écran le soir aident souvent.
- Un carnet de sommeil sur une ou deux semaines aide à y voir clair.
- Ne donnez jamais de produit « pour dormir » sans avis médical.

${DIAG}

## Comprendre
Endormissement interminable, réveils répétés, réveils très tôt le matin, cauchemars… Les difficultés de sommeil sont très fréquentes chez l’enfant. Elles peuvent être plus marquées quand il existe un trouble du neurodéveloppement : le cerveau a parfois plus de mal à « ralentir » le soir, l’enfant peut être sensible aux bruits ou à la lumière, ou avoir besoin de repères très stables.

Le sommeil est essentiel : il aide l’enfant à grandir, à consolider ce qu’il a appris dans la journée et à réguler ses émotions. Un enfant qui dort mal peut être plus irritable, plus agité ou avoir du mal à se concentrer, ce qui peut accentuer d’autres difficultés. Et les nuits hachées épuisent aussi les parents.

Il est utile de distinguer :
- les **difficultés d’endormissement** (l’enfant met longtemps à s’endormir, réclame, se relève) ;
- les **réveils nocturnes** (il se réveille et n’arrive pas à se rendormir seul) ;
- les **cauchemars** (il se réveille effrayé et peut raconter son rêve) ;
- les **terreurs nocturnes** (il crie, semble éveillé mais ne vous reconnaît pas, et ne s’en souvient pas le lendemain).

## Au quotidien
- **Des horaires réguliers** pour le coucher, le lever, les repas et les siestes, y compris le week-end autant que possible.
- **Un rituel calme et prévisible** : toilette, pyjama, histoire, chanson, câlin, toujours dans le même ordre ; un tableau en images peut aider.
- **Pas d’écran le soir**, et pas d’écran dans la chambre.
- **Une chambre adaptée** : sombre, calme, à bonne température ; une petite veilleuse si elle rassure.
- **Moins de stimulations en fin de journée** : jeux calmes, lumière tamisée.
- **Bouger dans la journée** et passer du temps dehors, à la lumière du jour.
- **Coucher l’enfant encore éveillé** pour qu’il apprenne à s’endormir seul, avec votre présence rassurante si besoin.
- **Tenir un carnet** : heure du coucher, de l’endormissement, réveils, siestes. C’est précieux pour le médecin.

## Questions fréquentes
**Combien de temps doit dormir mon enfant ?**
Les besoins varient selon l’âge et d’un enfant à l’autre. Plutôt que de viser un chiffre, observez s’il semble reposé dans la journée.

**Que faire pendant une terreur nocturne ?**
Restez à côté de lui pour qu’il ne se blesse pas, sans chercher à le réveiller ; l’épisode passe en général de lui-même.

**La mélatonine ou les plantes peuvent-elles aider ?**
Ne donnez jamais de produit pour dormir de vous-même, même « naturel » : c’est au médecin d’évaluer la situation et de décider.

**Mon enfant a besoin de moi pour s’endormir, est-ce un problème ?**
Ce besoin est fréquent. Si la situation vous convient, rien ne presse ; si elle vous épuise, le médecin peut vous aider à faire évoluer les habitudes progressivement.

## Quand demander conseil
Si les difficultés durent plusieurs semaines, retentissent sur la journée de votre enfant ou vous épuisent, consultez votre pédiatre ou votre médecin traitant **sans attendre d’être à bout**. Consultez aussi en cas de ronflements importants, de pauses respiratoires pendant le sommeil ou de grande somnolence dans la journée. Si vous, parent, vous sentez à bout, parlez-en : votre santé compte aussi.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['sommeil', 'endormissement', 'réveils nocturnes', 'neurodéveloppement'],
    sources: [S.santeTroublesSommeil, S.santeEndormissement, S.educSommeil],
    status: 'to_review',
    topic: 'sleep',
  },
  // 8 ─────────────────────────── Alimentation ───────────────────────────
  {
    slug: 'neuro-alimentation-selectivite',
    title: 'Repas compliqués : sélectivité et particularités alimentaires',
    summary: 'Refuser les aliments nouveaux est fréquent chez l’enfant ; quand la liste des aliments acceptés devient très courte, mieux vaut en parler au médecin.',
    body_md: `## En bref
- La méfiance envers les aliments nouveaux est une étape fréquente entre 2 et 10 ans.
- Quand la liste des aliments acceptés se réduit beaucoup, on parle de sélectivité alimentaire.
- Texture, odeur, couleur ou température jouent souvent un grand rôle.
- Forcer renforce souvent le refus : patience et répétition fonctionnent mieux.
- Une perte de poids ou des repas devenus une épreuve justifient de consulter.

${DIAG}

## Comprendre
Votre enfant ne mange que quelques aliments, refuse tout ce qui est nouveau ou trie son assiette selon la couleur ou la texture ? Vous n’êtes pas seul. La **néophobie alimentaire**, c’est-à-dire la méfiance envers les aliments inconnus, est une étape très courante du développement. Elle apparaît souvent vers 2 ans et s’atténue progressivement.

Quand cette méfiance devient très forte et durable, on parle de **sélectivité alimentaire** : l’enfant accepte de moins en moins d’aliments, parfois seulement quelques-uns, souvent d’une même couleur ou d’une même texture. Chez certains enfants, notamment ceux qui ont des particularités sensorielles ou un trouble du neurodéveloppement, la texture, l’odeur, l’aspect ou la température des aliments peuvent être vraiment difficiles à supporter. Une peur (de s’étouffer, de vomir) ou un souvenir désagréable peut aussi être en cause.

Ce qui compte pour le médecin :
- la liste des aliments acceptés : s’allonge-t-elle ou se réduit-elle ?
- la croissance de l’enfant (courbes du carnet de santé) et son énergie ;
- l’ambiance des repas : sont-ils devenus une source d’angoisse ou de conflit ?

## Au quotidien
- **Ne forcez pas** et n’obligez pas à finir l’assiette : la contrainte renforce souvent le refus.
- **Présentez un aliment refusé plusieurs fois**, en petite quantité, à côté d’aliments que votre enfant aime. Il faut souvent de nombreuses présentations avant qu’un aliment soit accepté.
- **Variez les préparations** : cru, cuit, en purée, en bâtonnets, avec une sauce.
- **Mangez vous-même l’aliment avec plaisir**, en famille, au calme et sans écran.
- **Impliquez votre enfant** dans les courses, l’épluchage, la cuisine : toucher et sentir, c’est déjà découvrir.
- **Séparez les aliments** dans l’assiette si les mélanges le gênent.
- **N’utilisez pas la nourriture comme récompense** ou comme punition.
- **Gardez des repas courts et détendus** : une assiette non terminée n’est pas un échec.

## Questions fréquentes
**Mon enfant ne mange que des pâtes, doit-il prendre des compléments ?**
Ne donnez pas de compléments de vous-même : parlez-en au médecin, qui évaluera la croissance et les besoins de votre enfant.

**Faut-il cuisiner un plat à part pour lui ?**
Prévoir au moins un aliment qu’il accepte à chaque repas, à côté du plat familial, peut le rassurer sans multiplier les menus.

**Les bonbons en récompense, est-ce une bonne idée ?**
Mieux vaut éviter : cela donne encore plus de valeur aux aliments sucrés et peut transformer les repas en négociation.

**Est-ce lié à l’autisme ?**
La sélectivité est plus fréquente chez les enfants autistes, mais elle existe chez de nombreux enfants sans trouble. Seule une évaluation par des professionnels permet de comprendre.

## Quand demander conseil
Si votre enfant mange très peu d’aliments différents, perd du poids ou ne grandit plus comme avant, semble fatigué, s’étouffe ou vomit souvent, ou si les repas sont devenus une épreuve pour toute la famille, parlez-en à son médecin. Il vérifiera sa croissance et pourra orienter vers un professionnel (orthophoniste, psychomotricien, diététicien, psychologue) qui aide à sortir du cercle vicieux autour des repas.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['alimentation', 'sélectivité alimentaire', 'repas', 'sensorialité'],
    min_age_months: 18,
    sources: [S.santeSelectivite, S.cafHypersensible],
    status: 'to_review',
    topic: 'food',
  },
  // 9 ─────────────────────────── Émotions ───────────────────────────
  {
    slug: 'neuro-emotions',
    title: 'Colères et émotions débordantes : accompagner son enfant',
    summary: 'Les grandes colères expriment souvent une frustration ou une surcharge que l’enfant ne sait pas encore dire ; on peut l’aider à mettre des mots, et demander de l’aide si elles persistent.',
    body_md: `## En bref
- Les émotions des jeunes enfants sont intenses ; les colères font partie du développement.
- Une crise exprime souvent une frustration, une fatigue ou une surcharge.
- Votre calme aide votre enfant à se calmer.
- Mettre des mots sur les émotions s’apprend petit à petit.
- Des crises fréquentes, qui durent ou qui mettent en danger justifient de consulter.

${DIAG}

## Comprendre
Crises de colère, pleurs qui ne s’arrêtent pas, gestes brusques… Le cerveau du jeune enfant n’a pas encore les outils pour gérer seul des émotions très fortes. Avant 2 ans, la colère passe surtout par le corps (taper, attraper, se jeter par terre). Vers 2 ans, le « non » arrive. Après 3 ans, les mots prennent peu à peu le relais.

Chez certains enfants, en particulier quand la communication, l’attention ou le traitement des sensations sont plus difficiles, les émotions débordent plus souvent. Une colère peut alors exprimer :
- une **frustration** (ne pas obtenir quelque chose, ne pas réussir) ;
- une **difficulté à se faire comprendre** ou à comprendre ce qu’on attend de lui ;
- une **surcharge** (bruit, foule, lumière, journée trop chargée) ;
- de la **fatigue** ou de la faim ;
- un **changement imprévu** dans ses repères ;
- de l’anxiété ou une perte de confiance liée à des difficultés d’apprentissage.

Ce n’est pas un caprice ni une volonté de vous provoquer : c’est souvent une émotion qui dépasse l’enfant.

## Au quotidien
- **Restez calme et ferme** : votre calme lui sert de modèle et le rassure.
- **Assurez la sécurité** : éloignez ce qui peut blesser, sans punir pendant la crise.
- **Nommez l’émotion** : « tu es très en colère parce que le jeu est fini ». Des livres, des images ou des jeux sur les émotions aident aussi.
- **Prévoyez un coin pour se poser**, avec un coussin ou un objet apaisant.
- **Anticipez** : prévenez des changements à l’avance, évitez les situations à risque quand il est fatigué ou affamé.
- **Proposez des façons de se défouler** : sport, danse, course dehors, dessin, pâte à modeler.
- **Passez des moments calmes et positifs ensemble** chaque jour, même courts.
- **Valorisez chaque progrès** : « tu as réussi à me dire que tu étais fâché ».
- **Après la tempête**, reparlez-en simplement, sans reproches.

## Questions fréquentes
**Faut-il ignorer les colères ?**
Ignorer les cris tout en restant disponible peut aider, mais l’enfant a besoin de sentir que vous êtes là et que vous l’aiderez à se calmer.

**Les punitions sont-elles efficaces ?**
Pendant la crise, l’enfant n’est pas en état d’apprendre. Fixer des limites claires et constantes en dehors des moments de crise est plus utile. Les violences physiques et verbales sont interdites et nuisent à l’enfant.

**Et si je perds moi-même mon calme ?**
Cela arrive à tous les parents. Mettez l’enfant en sécurité, éloignez-vous un instant, respirez. Vous pourrez ensuite revenir et réparer avec des mots.

**Ses colères sont-elles le signe d’un trouble ?**
Pas forcément. C’est leur fréquence, leur intensité, leur durée dans le temps et la présence d’autres difficultés qui orientent les professionnels.

## Quand demander conseil
Si les crises sont fréquentes et persistent au-delà de 3 ans, si votre enfant se fait du mal ou blesse les autres, ou si vous vous sentez dépassé, parlez-en à votre médecin ou à votre pédiatre. Il pourra orienter vers un psychologue, un pédopsychiatre ou une plateforme de coordination si d’autres difficultés de développement sont présentes. Si vous craignez de faire du mal à votre enfant, appelez le **119** (Allô enfance en danger), gratuit, 24 h/24. Demander de l’aide n’est pas un échec.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['émotions', 'colère', 'comportement', 'neurodéveloppement'],
    min_age_months: 18,
    sources: [S.santeAgressivite, S.cafHypersensible, S.santeLangageApprentissages],
    status: 'to_review',
    topic: 'emotions',
  },
  // 10 ─────────────────────────── À qui parler ───────────────────────────
  {
    slug: 'neuro-a-qui-parler',
    title: 'Un doute sur le développement : à qui en parler ?',
    summary: 'Le médecin traitant, le pédiatre ou le médecin de PMI est la première porte d’entrée ; il peut orienter vers une plateforme de coordination et d’orientation, sans attendre un diagnostic.',
    body_md: `## En bref
- La première étape est un médecin : médecin traitant, pédiatre, PMI, médecin scolaire.
- Les plateformes de coordination et d’orientation (PCO) accueillent les enfants pour lesquels un trouble est **suspecté**.
- Il n’est pas nécessaire d’avoir un diagnostic pour y être orienté.
- CAMSP, CMPP et CMP sont d’autres lieux possibles.
- Des numéros gratuits vous informent et vous orientent.

${DIAG}

## Comprendre
Vous avez un doute et ne savez pas par où commencer ? Beaucoup de parents ressentent la même chose : les sigles sont nombreux et le parcours peut sembler compliqué. Voici les principales portes d’entrée, pour faire un pas après l’autre.

**Un médecin d’abord.** Votre médecin traitant ou votre pédiatre, le médecin de PMI (protection maternelle et infantile, gratuit pour les jeunes enfants), le médecin de crèche ou le médecin scolaire. Il examine votre enfant, écoute vos observations et, si besoin, l’oriente.

**Les plateformes de coordination et d’orientation (PCO).** Dans chaque département, elles accueillent les enfants pour lesquels un trouble du neurodéveloppement est suspecté. À savoir :
- l’orientation se fait **sur prescription d’un médecin** ;
- elles organisent des bilans et des interventions précoces, au plus près de chez vous ;
- elles concernent les enfants jusqu’à 12 ans, selon les territoires ;
- certaines séances habituellement non remboursées (psychomotricien, ergothérapeute, psychologue) peuvent être financées dans le cadre d’un forfait : si le parcours est validé, la famille n’avance pas de frais ;
- elles soutiennent aussi les familles dans les démarches.

**D’autres lieux possibles :**
- les **CAMSP** (centres d’action médico-sociale précoce), pour les enfants de 0 à 6 ans, que vous pouvez contacter directement ;
- les **CMPP** (centres médico-psycho-pédagogiques), jusqu’à 20 ans, pour des difficultés d’apprentissage, de langage, de motricité ou de comportement ;
- les **CMP** (centres médico-psychologiques), publics, en cas de souffrance psychique.

Les délais d’attente peuvent être longs : prendre contact tôt est utile, même si vous n’êtes pas encore sûr.

## Au quotidien
- **Préparez le premier rendez-vous** : notez vos observations, rassemblez le carnet de santé.
- **Demandez un compte rendu écrit** après chaque consultation ou bilan.
- **Inscrivez-vous sur les listes d’attente** pendant que d’autres démarches avancent.
- **Gardez tout dans un même dossier**, papier ou numérique.
- **Appuyez-vous sur l’école ou la crèche**, qui peuvent aussi signaler des besoins et adapter l’accueil.

## Questions fréquentes
**Puis-je contacter directement une PCO ?**
L’orientation se fait sur prescription d’un médecin, qui remplit un formulaire d’adressage. Parlez-en lors de votre consultation.

**C’est payant ?**
Les consultations médicales sont remboursées comme d’habitude. Dans le cadre d’un parcours PCO validé, certains bilans et séances sont financés sans avance de frais. CAMSP, CMPP et CMP sont pris en charge par l’Assurance maladie.

**Et si le médecin ne partage pas mon inquiétude ?**
Vous pouvez demander un deuxième avis, auprès d’un autre médecin ou d’un pédiatre.

**Où trouver des informations fiables ?**
Autisme Info Service répond au 0 800 71 40 40 (gratuit). Le 0 800 360 360 oriente gratuitement les personnes handicapées et leurs aidants vers des solutions près de chez eux.

## Quand demander conseil
Dès que vous avez un doute qui persiste, prenez rendez-vous avec un médecin. Consultez rapidement si votre enfant perd des compétences qu’il avait acquises. Si vous vous sentez dépassé ou épuisé, parlez-en aussi : être écouté est déjà une première aide.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['orientation', 'PCO', 'médecin', 'CAMSP', 'neurodéveloppement'],
    sources: [S.santePco, S.mphForfait, S.mphMedicoSocial, S.mdaAidant],
    status: 'to_review',
    topic: 'who',
  },
  // 11 ─────────────────────────── Préparer un rendez-vous ───────────────────────────
  {
    slug: 'neuro-preparer-un-rendez-vous',
    title: 'Bien préparer un rendez-vous au sujet de son enfant',
    summary: 'Quelques notes concrètes, l’avis de l’école ou de la crèche et une liste de questions aident le médecin à comprendre votre enfant, et vous aident à ne rien oublier.',
    body_md: `## En bref
- Un rendez-vous passe vite : un peu de préparation aide beaucoup.
- Des exemples concrets valent mieux que des impressions générales.
- L’avis de la crèche, de l’assistante maternelle ou de l’enseignant complète le vôtre.
- Préparez vos questions par écrit et prenez des notes.
- Vous pouvez demander à reformuler, et revenir si vous n’êtes pas rassuré.

${DIAG}

## Comprendre
Quand on s’inquiète pour son enfant, l’émotion peut faire oublier l’essentiel le jour du rendez-vous. Le professionnel, lui, ne voit votre enfant que quelques minutes, parfois dans une situation inhabituelle où il ne se comporte pas comme à la maison. Vos observations sont donc précieuses : vous connaissez votre enfant mieux que personne.

Le premier rendez-vous a souvent plusieurs objectifs : faire le point sur le développement de votre enfant, examiner son audition et sa vision, décider s’il faut des bilans complémentaires et, si besoin, l’orienter. Pour une orientation vers une plateforme de coordination et d’orientation, une **prescription médicale** est nécessaire : c’est souvent l’un des enjeux de ce rendez-vous.

## Au quotidien
**Avant le rendez-vous**
- **Notez vos observations** : ce qui vous questionne, depuis quand, dans quelles situations, avec des exemples précis (« à 2 ans, il dit trois mots », « il se bouche les oreilles à la cantine »).
- **Notez aussi ses points forts**, ce qu’il aime, ce qui l’aide.
- **Demandez l’avis** de la crèche, de l’assistante maternelle ou de l’enseignant. Pour les enfants de 6 à 12 ans, un livret de repérage officiel comporte une partie pour la famille, une pour l’enseignant et une pour le médecin.
- **Rassemblez** le carnet de santé, les comptes rendus de bilans déjà faits, éventuellement de courtes vidéos d’un comportement difficile à décrire.
- **Préparez vos questions** par écrit, des plus importantes aux moins importantes.

**Pendant le rendez-vous**
- Venez à deux si c’est possible, ou avec une personne de confiance.
- Commencez par ce qui vous inquiète le plus.
- Prenez des notes, ou demandez au professionnel de reformuler ou d’écrire les mots importants.
- Si un mot vous échappe, demandez son explication : il n’y a pas de question bête.
- Dites si vous êtes inquiet : c’est une information importante pour le médecin.

**Après le rendez-vous**
- Relisez vos notes à tête reposée et classez les documents dans un même dossier.
- Notez les prochaines étapes, les contacts et les délais.
- Prenez les rendez-vous de bilans rapidement, les délais pouvant être longs.

## Questions fréquentes
**Quelles questions poser ?**
Par exemple : ce que j’observe est-il dans la variabilité habituelle ? Quels bilans sont conseillés, et auprès de qui ? Une orientation vers une plateforme est-elle possible ? Que puis-je faire dès maintenant à la maison ? Quand revenir ?

**Faut-il en parler devant mon enfant ?**
Selon son âge, vous pouvez préparer un petit mot pour le médecin ou demander un moment sans lui. Expliquez simplement à votre enfant pourquoi il voit le médecin.

**Les vidéos sont-elles utiles ?**
Oui, quelques secondes filmées à la maison peuvent montrer ce qui ne se voit pas en consultation.

**Et si je ne suis pas d’accord avec l’avis donné ?**
Vous pouvez demander des explications, reprendre rendez-vous ou solliciter un autre avis.

## Quand demander conseil
N’attendez pas le rendez-vous si la situation change brusquement : perte de compétences, repli important, grande souffrance de votre enfant. Dans ce cas, contactez rapidement votre médecin. En cas d’urgence vitale, appelez le **15** ou le **112**.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['rendez-vous', 'consultation', 'préparer', 'neurodéveloppement'],
    sources: [S.santeRetardDev, S.dipnReperage612, S.mphForfait],
    status: 'to_review',
    topic: 'appointment',
  },
  // 12 ─────────────────────────── Professionnels ───────────────────────────
  {
    slug: 'neuro-professionnels-concernes',
    title: 'Qui fait quoi ? Les professionnels qui peuvent accompagner votre enfant',
    summary: 'Médecins, orthophoniste, psychomotricien, ergothérapeute, psychologue… chacun a un rôle précis, souvent coordonné par un médecin ; voici comment vous y retrouver.',
    body_md: `## En bref
- Le médecin (traitant, pédiatre, PMI, scolaire) est le premier interlocuteur et coordonne souvent le parcours.
- Chaque professionnel de bilan et de rééducation a un rôle précis.
- Le diagnostic se fait le plus souvent **à plusieurs**.
- Certaines séances ne sont pas remboursées, sauf dans des dispositifs comme les plateformes de coordination.
- Vous, parents, êtes au cœur de l’équipe.

${DIAG}

## Comprendre
Quand on se pose des questions sur le développement d’un enfant, on découvre de nombreux métiers. Les connaître aide à comprendre ce qu’on vous propose et pourquoi.

**Les médecins**
- **Médecin traitant, pédiatre, médecin de PMI, médecin scolaire** : premiers interlocuteurs. Ils examinent l’enfant, prescrivent des bilans et orientent.
- **Pédopsychiatre, neuropédiatre** et médecins formés aux troubles du neurodéveloppement : ils participent au diagnostic et coordonnent souvent le parcours.
- **ORL et ophtalmologiste** : ils vérifient l’audition et la vision, qui peuvent influencer le langage et les apprentissages.

**Les professionnels des bilans et de l’accompagnement**
- **Orthophoniste** : langage oral et écrit, communication, parfois déglutition et alimentation. Les séances sont remboursées sur prescription.
- **Psychomotricien** : coordination des mouvements, repérage dans le temps et l’espace, tonus, régulation des émotions par le corps.
- **Ergothérapeute** : autonomie au quotidien (s’habiller, manger, écrire), adaptation du matériel, par exemple l’ordinateur à l’école.
- **Psychologue** ou **neuropsychologue** : évaluation de l’attention, de la mémoire, du raisonnement ; soutien de l’enfant et de la famille.
- **Orthoptiste** : fonctionnement des yeux et coordination visuelle.
- **Éducateur spécialisé** : accompagnement éducatif au quotidien, souvent dans un service médico-social.

## Au quotidien
**Où trouver ces professionnels**
- **En libéral** (cabinet) : attention, les séances de psychomotricien, d’ergothérapeute et de psychologue ne sont en général pas remboursées par l’Assurance maladie, sauf dans certains dispositifs.
- **Via une plateforme de coordination et d’orientation** : elle peut financer ces séances pour une durée limitée, auprès de professionnels qui ont signé un contrat avec elle.
- **Dans un CAMSP** (0-6 ans), un **CMPP** (jusqu’à 20 ans) ou un **CMP** : soins pris en charge par l’Assurance maladie, mais délais souvent longs.
- **Avec une notification de la MDPH**, un **Sessad** (service d’éducation spéciale et de soins à domicile) peut intervenir à domicile, à l’école ou dans les lieux de vie de l’enfant.

**Pour bien vous organiser**
- Demandez à chaque professionnel un compte rendu écrit.
- Gardez tous les documents dans un même classeur ou dossier numérique.
- Partagez les informations utiles entre professionnels, avec votre accord.
- Demandez ce que vous pouvez faire à la maison entre deux séances.

## Questions fréquentes
**Psychologue ou psychiatre, quelle différence ?**
Le pédopsychiatre est médecin : il peut poser un diagnostic médical et prescrire. Le psychologue évalue et accompagne, sans prescrire.

**Combien de temps dure une rééducation ?**
Cela dépend des besoins de l’enfant ; les objectifs sont réévalués régulièrement avec vous.

**Peut-on cumuler plusieurs suivis ?**
Oui, c’est fréquent. Une coordination par un médecin ou une plateforme aide à garder une cohérence et à ne pas surcharger l’emploi du temps de l’enfant.

**Comment savoir si un professionnel est formé aux troubles du neurodéveloppement ?**
Vous pouvez lui poser la question directement, et demander conseil au médecin qui coordonne ou à la plateforme.

## Quand demander conseil
Si le parcours vous semble flou, si les suivis s’accumulent sans cohérence ou si votre enfant semble épuisé, parlez-en au médecin qui coordonne. Il pourra réajuster le projet avec vous.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['professionnels', 'orthophoniste', 'psychomotricien', 'ergothérapeute', 'neurodéveloppement'],
    sources: [S.mphDys, S.mphMedicoSocial, S.mphForfait],
    status: 'to_review',
    topic: 'professionals',
  },
  // 13 ─────────────────────────── École ───────────────────────────
  {
    slug: 'neuro-ecole-pap-pps-aesh',
    title: 'À l’école : PAP, PPS, AESH… s’y retrouver',
    summary: 'Selon les besoins de l’enfant, l’école peut proposer des aménagements simples, un plan d’accompagnement personnalisé ou, avec la MDPH, un projet personnalisé de scolarisation.',
    body_md: `## En bref
- L’école peut s’adapter à votre enfant, avec ou sans démarche MDPH.
- Des aménagements simples peuvent être proposés directement par l’enseignant.
- Le **PAP** répond à des troubles durables des apprentissages, sans MDPH.
- Le **PPS**, décidé avec la MDPH, peut prévoir une aide humaine (AESH) ou du matériel.
- Vous êtes membre de droit des réunions qui concernent votre enfant.

${DIAG}

## Comprendre
Les sigles sont nombreux, mais l’idée est simple : trouver la bonne réponse selon les besoins de l’enfant, du plus simple au plus soutenu.

**Les aménagements du quotidien.** Sans démarche particulière, l’enseignant peut déjà proposer des consignes reformulées, une place adaptée dans la classe, une police plus grande, moins de copie, des documents numériques ou du temps supplémentaire.

**Les principaux dispositifs**
- **PPRE** (programme personnalisé de réussite éducative) : un soutien pédagogique de courte durée, élaboré par l’équipe enseignante.
- **PAI** (projet d’accueil individualisé) : pour un trouble de santé durable (asthme, allergie, épilepsie…), avec les adaptations et, si besoin, la conduite à tenir en cas d’urgence.
- **PAP** (plan d’accompagnement personnalisé) : pour des difficultés **durables** liées à un trouble des apprentissages (dys, TDAH…), **sans** passer par la MDPH. Il est mis en place après avis du médecin scolaire et prévoit des aménagements pédagogiques.
- **PPS** (projet personnalisé de scolarisation) : pour un élève dont le handicap est reconnu par la **MDPH**. Il peut prévoir une aide humaine, du matériel pédagogique adapté, des soins pendant le temps scolaire, et il est réévalué régulièrement.

**L’AESH.** L’accompagnant des élèves en situation de handicap aide l’enfant à gagner en autonomie dans ses apprentissages et sa vie à l’école. Cette aide est **décidée par la MDPH** dans le cadre du PPS ; elle peut être individuelle ou mutualisée entre plusieurs élèves.

**Les personnes et outils à connaître**
- **L’équipe éducative** : une réunion avec l’école, que vous pouvez demander. Elle peut remplir le **GEVA-sco**, document qui décrit la scolarité de l’enfant et accompagne un dossier MDPH.
- **L’enseignant référent** : votre interlocuteur pour le suivi du PPS ; il réunit l’équipe de suivi de la scolarisation.
- **Le pôle d’appui à la scolarité (PAS)**, là où il est en place : il apporte une première réponse rapide, sans attendre une reconnaissance de handicap. Les parents peuvent le solliciter.

## Au quotidien
- **Demandez un rendez-vous à l’enseignant** dès que les difficultés apparaissent.
- **Partagez les comptes rendus** des bilans utiles à l’école, avec votre accord et en choisissant ce que vous transmettez.
- **Demandez une équipe éducative** si les difficultés persistent.
- **Faites-vous accompagner** aux réunions par une personne de confiance ou une association si vous le souhaitez.
- **Gardez une trace écrite** de ce qui est décidé.

## Questions fréquentes
**PAP ou PPS, comment choisir ?**
Le PAP convient à des aménagements pédagogiques sans aide humaine ni matériel spécifique. Si votre enfant a besoin d’une AESH, de matériel ou d’un accompagnement médico-social, c’est le PPS, via la MDPH.

**L’école peut-elle refuser un aménagement ?**
Les aménagements se discutent en équipe. En cas de désaccord, vous pouvez solliciter l’enseignant référent ou l’inspection de circonscription.

**Les aménagements valent-ils pour les examens ?**
Des aménagements d’examens existent ; ils font l’objet d’une demande spécifique, à anticiper.

**Où s’informer ?**
Le **0 805 805 110** est le numéro vert d’information sur l’école inclusive.

## Quand demander conseil
Si votre enfant exprime une souffrance à l’école, refuse d’y aller, subit des moqueries ou si ses difficultés s’aggravent, parlez-en rapidement à l’enseignant, au médecin scolaire et au médecin qui le suit.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['école', 'PAP', 'PPS', 'AESH', 'scolarité', 'neurodéveloppement'],
    min_age_months: 36,
    sources: [S.mphAppuis, S.mphAccompPps, S.mphGevasco, S.boPas, S.mdaAidant],
    status: 'to_review',
    topic: 'school',
  },
  // 14 ─────────────────────────── MDPH ───────────────────────────
  {
    slug: 'neuro-mdph-demarches',
    title: 'La MDPH : à quoi elle sert et comment faire une demande',
    summary: 'La maison départementale des personnes handicapées informe les familles et étudie les demandes de droits et d’accompagnements, notamment pour l’école ; voici comment préparer un dossier.',
    body_md: `## En bref
- La MDPH est un guichet unique d’information et de demande de droits.
- Une demande n’est ni une étiquette définitive, ni une obligation.
- Elle peut ouvrir un PPS à l’école, une aide humaine, un service d’accompagnement ou l’AEEH.
- Il faut un formulaire, un certificat médical récent et des justificatifs.
- Anticipez : les délais de traitement peuvent être longs.

${DIAG}

## Comprendre
Le mot « handicap » peut faire peur. Pourtant, faire une demande à la MDPH, c’est avant tout **ouvrir des droits** pour que votre enfant soit mieux accompagné. Vous restez libre de faire ou non une demande, et de ce que vous partagez.

La maison départementale des personnes handicapées accueille, informe et conseille les personnes handicapées et leur famille. Elle étudie les demandes, et une commission (la CDAPH) prend les décisions. Pour un enfant, il peut s’agir par exemple :
- d’un **PPS** à l’école, avec si besoin une aide humaine (AESH) ou du matériel pédagogique adapté ;
- d’une orientation vers un service comme un **Sessad** ;
- de l’**AEEH** (allocation d’éducation de l’enfant handicapé), versée aux parents pour aider à couvrir les dépenses liées au handicap d’un enfant de moins de 20 ans, avec des compléments possibles selon les besoins ;
- de la **prestation de compensation du handicap** (PCH), selon la situation.

## Au quotidien
**Constituer le dossier**
- Remplissez le **formulaire de demande** (Cerfa) : il décrit la vie quotidienne, la scolarité, les besoins et vos attentes.
- Joignez un **certificat médical de moins d’un an**, rempli par un médecin qui suit votre enfant.
- Ajoutez les **justificatifs** demandés (identité, domicile).
- Pour l’école, joignez le **GEVA-sco**, rempli lors d’une équipe éducative.
- Vous pouvez ajouter les bilans déjà réalisés. Un document complémentaire existe pour les troubles du neurodéveloppement : il est **facultatif**.
- Déposez le dossier à la MDPH de votre département ; certaines proposent un dépôt en ligne.

**Bien le remplir**
- Décrivez concrètement **une journée type** : ce qui est difficile, ce qui aide, le temps que cela vous prend.
- Expliquez vos **projets** pour votre enfant (école, loisirs, soins).
- Gardez une **copie** de tout le dossier.
- **Faites-vous aider** : l’accueil de la MDPH, une assistante sociale, une association de familles.

**Anticiper**
- Pour une rentrée scolaire, il est conseillé de déposer le dossier entre janvier et mars précédant la rentrée.
- Pour un renouvellement, environ 6 mois avant la fin des droits.

## Questions fréquentes
**Faut-il un diagnostic pour déposer un dossier ?**
La MDPH évalue les besoins et leurs conséquences dans la vie quotidienne. Le certificat médical décrit la situation de l’enfant ; parlez-en avec le médecin qui le suit.

**Combien de temps faut-il attendre ?**
Les délais varient selon les départements et peuvent atteindre plusieurs mois : d’où l’intérêt d’anticiper.

**Peut-on contester une décision ?**
Oui. Les décisions peuvent faire l’objet d’un recours ; les modalités sont indiquées sur la notification.

**Et le forfait d’intervention précoce ?**
Si votre enfant en bénéficie via une plateforme, il s’arrête lorsque l’AEEH commence : parlez-en avec la plateforme pour organiser la suite sans interruption.

## Quand demander conseil
Si les démarches vous submergent, n’hésitez pas à demander de l’aide : la MDPH, le **0 800 360 360** (gratuit) ou une association peuvent vous accompagner. Si la fatigue ou l’inquiétude pèsent sur votre moral, parlez-en à votre médecin.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['MDPH', 'AEEH', 'démarches', 'handicap', 'neurodéveloppement'],
    sources: [S.mphMdph, S.mphAeeh, S.mphForfait, S.mphAppuis],
    status: 'to_review',
    topic: 'mdph',
  },
  // 15 ─────────────────────────── Quotidien ───────────────────────────
  {
    slug: 'neuro-accompagnement-au-quotidien',
    title: 'Au quotidien : petites adaptations, grands effets',
    summary: 'Des repères visuels, des routines prévisibles, des consignes courtes et beaucoup d’encouragements aident les enfants qui ont des difficultés de développement, avec ou sans diagnostic.',
    body_md: `## En bref
- Vous pouvez aider votre enfant dès maintenant, diagnostic ou pas.
- Des journées prévisibles et des repères visuels rassurent.
- Des consignes courtes et des tâches découpées facilitent la réussite.
- Encourager l’effort nourrit la confiance en soi.
- Prendre soin de vous fait partie de l’accompagnement.

${DIAG}

## Comprendre
Beaucoup d’enfants qui ont des difficultés d’attention, de langage, de coordination ou de relation ont besoin de **repères stables** pour se sentir en sécurité et disponibles pour apprendre. L’imprévu, les consignes longues ou un environnement bruyant leur demandent une énergie considérable. Quelques adaptations simples peuvent changer le quotidien de toute la famille.

Ces conseils ne remplacent pas un accompagnement par des professionnels, mais ils le complètent : les rééducations sont plus efficaces quand on reprend un peu les mêmes idées à la maison.

## Au quotidien
**Rendre la journée prévisible**
- Des **routines régulières** : lever, repas, devoirs, bain, coucher, dans le même ordre.
- Un **emploi du temps visuel** avec des images ou des pictogrammes, affiché à hauteur d’enfant.
- **Prévenir des changements** à l’avance (sortie, visite, vacances, rentrée) et expliquer ce qui va se passer.
- Un **minuteur visuel** pour rendre le temps concret (« quand le rouge a disparu, on range »).

**Faciliter la compréhension**
- Des **consignes courtes**, une à la fois, en regardant l’enfant, avec un geste ou une image.
- Vérifier qu’il a compris en lui demandant de **reformuler** ou de montrer.
- **Découper** les tâches longues en petites étapes, avec des pauses.
- Dire ce qu’il faut faire plutôt que ce qu’il ne faut pas faire (« on marche » plutôt que « ne cours pas »).

**Adapter l’environnement**
- Un **coin calme** pour se poser ou faire ses devoirs, avec peu de distractions.
- Tenir compte des **sensibilités** : bruit, lumière, vêtements, textures.
- **Limiter les écrans**, surtout le soir, et privilégier les jeux partagés.

**Encourager**
- **Valoriser l’effort** plus que le résultat, et le dire concrètement (« tu as rangé tes chaussures tout seul »).
- Repérer et nourrir ses **centres d’intérêt** et ses talents.
- Proposer des activités qui lui font du bien : sport, musique, dessin, nature, animaux.

**Travailler ensemble**
- Garder un lien régulier avec l’école et les professionnels : ce qui marche à la maison peut servir en classe, et inversement.
- Demander aux professionnels ce que vous pouvez faire entre deux séances.
- Associer les frères et sœurs, en leur expliquant simplement les besoins de leur frère ou sœur.

## Questions fréquentes
**Les routines ne risquent-elles pas de le rendre rigide ?**
Les repères rassurent ; on peut introduire des petits changements progressivement, en les annonçant, pour l’aider à s’adapter.

**Comment gérer les frères et sœurs ?**
Expliquez avec des mots simples, préservez des moments rien qu’avec chacun, et accueillez aussi leurs émotions : ils peuvent ressentir de la jalousie ou de l’inquiétude.

**Je n’arrive pas à tout mettre en place, est-ce grave ?**
Non. Commencez par une seule chose qui vous semble utile. Vous n’avez pas à être parfait : être un parent « suffisamment bon » suffit.

**Où trouver des pictogrammes ?**
Les professionnels qui suivent votre enfant (orthophoniste, ergothérapeute, éducateur) peuvent vous en proposer et vous montrer comment les utiliser.

## Quand demander conseil
Si les difficultés augmentent, si votre enfant semble malheureux ou si la fatigue s’installe chez vous, parlez-en à votre médecin : c’est une information importante pour adapter l’accompagnement. Les plateformes de coordination proposent aussi un soutien aux familles.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['quotidien', 'routines', 'accompagnement', 'neurodéveloppement'],
    sources: [S.mphTdah, S.mphDys, S.santePco, S.santeSanteMentaleParents],
    status: 'to_review',
    topic: 'daily',
  },
  // 16 ─────────────────────────── Parents ───────────────────────────
  {
    slug: 'neuro-soutien-aux-parents',
    title: 'Prendre soin de soi quand on accompagne son enfant',
    summary: 'Fatigue, inquiétude, démarches : les parents aussi ont besoin de soutien ; solutions de répit, associations et professionnels de santé mentale peuvent vous aider.',
    body_md: `## En bref
- Accompagner un enfant aux besoins particuliers peut être épuisant.
- L’épuisement parental n’est pas un manque d’amour : c’est un signal à écouter.
- Des solutions de répit existent, y compris à domicile.
- Les associations de familles rompent l’isolement.
- En cas d’idées suicidaires, appelez le **3114**.

Seuls des professionnels peuvent poser un diagnostic, pour votre enfant comme pour vous : si vous ne vous sentez pas bien, parlez-en.

## Comprendre
Rendez-vous, bilans, démarches, nuits courtes, regards extérieurs, inquiétudes pour l’avenir… Accompagner un enfant qui a des difficultés de développement demande énormément d’énergie. Beaucoup de parents s’oublient en chemin. Prendre soin de vous n’est pas un luxe : c’est aussi prendre soin de votre enfant.

On parle d’**épuisement parental** (ou burn-out parental) quand on ressent à la fois :
- une **fatigue extrême**, physique et émotionnelle, qui ne passe pas avec le repos ;
- une **distance** avec ses enfants, l’impression de faire les choses « comme un robot » ;
- une **perte de plaisir** à être parent, parfois accompagnée de culpabilité.

Ce n’est pas un manque d’amour : c’est le signe que les contraintes dépassent les ressources disponibles. Cela peut arriver à tous les parents, et cela se soigne.

## Au quotidien
**Se faire relayer**
- Par le coparent, un proche, une baby-sitter formée, un centre de loisirs.
- **Accueil de jour ou temporaire** et **séjours adaptés**, souvent sur décision de la MDPH ; en urgence, un accueil est parfois possible sans notification.
- **Répit à domicile** : un professionnel vient prendre le relais chez vous.
- **Aide à domicile de la Caf** (technicienne d’intervention sociale et familiale), selon votre situation et vos revenus.

**Concilier avec le travail**
- Le **congé de proche aidant** et l’allocation journalière du proche aidant permettent de s’absenter du travail.
- L’AEEH ou la PCH peuvent financer certains frais, dont du répit.

**Ne pas rester seul**
- Les **associations de familles** écoutent, informent et mettent en lien avec d’autres parents (par exemple HyperSupers – TDAH France pour le TDAH).
- Les **groupes de parents**, cafés des parents, lieux d’accueil enfants-parents et points écoute parents.
- Les **centres de ressources autisme** et la Maison de l’autisme pour les questions liées à l’autisme.

**Prendre soin de soi, concrètement**
- Garder au moins un moment par semaine rien que pour vous.
- Dormir dès que possible, accepter l’aide pour les tâches pratiques.
- Partager la charge des démarches avec le coparent ou un proche.

## Questions fréquentes
**Je culpabilise de vouloir souffler. Ai-je le droit de prendre du temps pour moi ?**
Beaucoup de parents ressentent cette culpabilité. Pourtant, le répit permet de tenir dans la durée et de rester disponible pour votre enfant.

**À qui parler de mon épuisement ?**
À votre médecin généraliste, qui peut vous orienter vers un psychologue ou un psychiatre, et à vos proches. Les associations sont aussi de bons relais.

**Mon couple souffre de la situation, que faire ?**
C’est fréquent. Préserver des moments à deux et, si besoin, consulter un conseiller conjugal ou un psychologue peut aider.

**Où trouver des solutions près de chez moi ?**
Le **0 800 360 360**, gratuit, oriente les personnes handicapées et leurs aidants.

## Quand demander conseil
Si la fatigue, la tristesse ou l’irritabilité durent, si vous ne prenez plus de plaisir à rien ou si vous avez peur de perdre patience avec votre enfant, parlez-en à votre médecin. Si vous craignez de faire du mal à votre enfant, appelez le **119**. En cas d’idées suicidaires, appelez le **3114**, numéro national de prévention du suicide, gratuit et 24 h/24, ou le **15**.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['parents', 'répit', 'épuisement parental', 'santé mentale', 'aidants'],
    sources: [S.santeSanteMentaleParents, S.mphRepit, S.mdaAidant, S.mphTdah],
    status: 'to_review',
    topic: 'parents',
  },
  // 17 ─────────────────────────── Vous n'êtes pas seuls ───────────────────────────
  {
    slug: 'neuro-vous-netes-pas-seuls',
    title: 'Vous n’êtes pas seuls',
    summary: 'Des milliers de familles vivent des questionnements semblables ; dispositifs, professionnels et associations existent pour vous accompagner pas à pas.',
    body_md: `## En bref
- Les troubles du neurodéveloppement concernent environ 5 % de la population.
- Ils ne sont la faute de personne.
- Des aides existent, même sans diagnostic.
- Des numéros gratuits et des associations vous écoutent.
- Vous pouvez avancer une démarche à la fois.

${DIAG}

## Comprendre
Se poser des questions sur le développement de son enfant peut donner l’impression d’être perdu, ou d’être le seul dans cette situation. Ce n’est pas le cas.

**Beaucoup de familles sont concernées.** Selon les sources officielles, les troubles du neurodéveloppement concernent environ 5 % de la population, soit environ 35 000 naissances chaque année en France. Ils regroupent l’autisme, le TDAH, les troubles dys, les troubles du langage et les troubles du développement intellectuel. Beaucoup de parents ont donc connu les mêmes doutes que vous.

**Ce n’est la faute de personne.** Ces troubles sont liés à la façon dont le cerveau se développe, un processus qui commence avant même la naissance. Pour l’autisme, par exemple, les sources officielles rappellent que la personnalité ou l’éducation des parents ne joue aucun rôle. Vous n’avez rien « raté ».

**Des aides existent, même sans diagnostic.**
- Les **plateformes de coordination et d’orientation** permettent de commencer bilans et interventions avant un diagnostic, sur prescription d’un médecin.
- L’**école** peut adapter la scolarité, avec ou sans dossier MDPH.
- La **MDPH** ouvre des droits lorsque c’est nécessaire.
- Agir tôt aide l’enfant : chaque enfant continue à se développer et à progresser avec un accompagnement adapté.

## Au quotidien
- **Un pas après l’autre** : vous n’avez pas besoin de tout comprendre ni de tout faire aujourd’hui. Notez vos questions, faites une démarche à la fois.
- **Entourez-vous** : coparent, famille, amis, professionnels, autres parents.
- **Choisissez vos sources d’information** : privilégiez les sites officiels et les professionnels plutôt que les forums inquiétants.
- **Célébrez les progrès**, même petits : ils comptent.
- **Gardez du temps pour le plaisir** en famille : jeux, sorties, moments sans objectif.
- **Rappelez-vous** que votre enfant reste avant tout votre enfant, avec ses forces, sa personnalité et sa façon unique de grandir.

## Questions fréquentes
**Comment en parler à la famille ou aux amis ?**
Vous choisissez ce que vous partagez et à qui. Quelques phrases simples suffisent souvent ; vous pouvez aussi orienter vos proches vers des informations fiables.

**Comment rencontrer d’autres parents ?**
Les associations de familles, les groupes de parents et certaines plateformes ou CAMSP organisent des rencontres.

**Et si je me sens dépassé ?**
Dites-le, à votre médecin ou à un proche. Demander de l’aide, c’est déjà avancer.

**Les numéros utiles ?**
Autisme Info Service : **0 800 71 40 40** (gratuit). Personnes handicapées et aidants : **0 800 360 360**. École inclusive : **0 805 805 110**.

## Quand demander conseil
Si votre inquiétude devient envahissante, si vous dormez mal ou si vous ne prenez plus de plaisir à rien, parlez-en à votre médecin. En cas d’idées suicidaires, appelez le **3114**, gratuit et 24 h/24. En cas d’urgence vitale, le **15** ou le **112**.

*Cet article vous informe et vous aide à vous orienter ; il ne remplace pas l’avis d’un professionnel de santé qui connaît votre enfant.*`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['soutien', 'familles', 'associations', 'neurodéveloppement'],
    sources: [S.arsNaTnd, S.santePco, S.gouvAis, S.mdaAidant, S.mdaAutisme],
    status: 'to_review',
    topic: 'not_alone',
  },
];
