/** Guide complet — lot 30 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
const MP = 'mpedia.fr (Association française de pédiatrie ambulatoire)';
// Sources réellement consultées (pages officielles ou de référence françaises).
const S = {
  rituel: { label: 'Santé.fr (contenu mpedia / AFPA) — Rituel du coucher, un moment à partager', url: 'https://www.sante.fr/node/1068916', consulted_on: C, published: '2023-09-01' },
  sommeilEnfant: { label: 'Santé.fr (contenu Réseau Morphée) — Le sommeil de l’enfant', url: 'https://www.sante.fr/le-sommeil-de-lenfant-0', consulted_on: C, published: '2026-07-06' },
  peurs: { label: `${MP} — Les peurs fréquentes et irraisonnées chez l’enfant`, url: 'https://www.mpedia.fr/art-les-peurs-frequentes-chez-enfant/', consulted_on: C, published: '2020-09-28' },
  doudou: { label: `${MP} — Peluche, tissu… Le rôle du doudou pour l’enfant`, url: 'https://www.mpedia.fr/art-role-du-doudou/', consulted_on: C, published: '2023-09-01' },
  pouceTetine: { label: `${MP} — Sucer son pouce ou avoir une tétine`, url: 'https://www.mpedia.fr/art-pouce-tetine/', consulted_on: C, published: '2020-08-24' },
  sieste: { label: `${MP} — La sieste, sommeil de l’enfant en journée`, url: 'https://www.mpedia.fr/art-rythme-sieste/', consulted_on: C, published: '2020-09-21' },
  cododo: { label: `${MP} — Cododo, cosleeping, dormir avec bébé`, url: 'https://www.mpedia.fr/art-co-sleeping-pour-ou-contre/', consulted_on: C, published: '2023-07-17' },
  langage36: { label: `${MP} — Troubles du langage de 3 à 6 ans`, url: 'https://www.mpedia.fr/art-troubles-du-langage/', consulted_on: C, published: '2021-09-16' },
  ameliTroubles: { label: 'ameli.fr — Bégaiement, trouble articulatoire, retard de parole, dysphasie : comprendre les troubles du langage', url: 'https://www.ameli.fr/assure/sante/themes/trouble-expression-langage-oral-enfant/comprendre-troubles-langage-oral', consulted_on: C, published: '2024-12-03' },
  ameliPrevention: { label: 'ameli.fr — Prévenir les difficultés d’acquisition du langage oral', url: 'https://www.ameli.fr/assure/sante/themes/trouble-expression-langage-oral-enfant/prevention-langage-oral-maison-ecole', consulted_on: C, published: '2026-01-20' },
  langues: { label: `${MP} — Langues étrangères : quelle langue parler à son bébé ?`, url: 'https://www.mpedia.fr/art-parents-non-francophones/', consulted_on: C, published: '2023-07-13' },
  ecritNonFrancophone: { label: `${MP} — Apprentissage de l’écriture et de la lecture dans un environnement non francophone`, url: 'https://www.mpedia.fr/art-parle-plusieurs-langues-maison/', consulted_on: C, published: '2019-07-10' },
  pourquoi: { label: `${MP} — Votre enfant comprend les questions avec « pourquoi »`, url: 'https://www.mpedia.fr/outil-enfant-comprend-questions-pourquoi/', consulted_on: C },
  dev34: { label: `${MP} — Autonomie de l’enfant, le développement entre 3 et 4 ans`, url: 'https://www.mpedia.fr/art-developpement-de-lenfant-3-a-4-ans/', consulted_on: C, published: '2021-01-05' },
  autonomie: { label: `${MP} — Les étapes de l’autonomie de l’enfant, entre 6 et 11 ans`, url: 'https://www.mpedia.fr/art-quelle-autonomie-quel-age/', consulted_on: C, published: '2019-07-10' },
  matin: { label: `${MP} — Aller à l’école : nos clés pour des préparatifs plus sereins le matin`, url: 'https://www.mpedia.fr/art-aller-ecole/', consulted_on: C, published: '2021-09-22' },
  veo: { label: `${MP} — Violences éducatives ordinaires : comment faire autrement`, url: 'https://www.mpedia.fr/veo-violences-educatives-ordinaires-comment-faire-autrement/', consulted_on: C },
  affirmation: { label: `${MP} — Affirmation de soi, entre autonomie et opposition`, url: 'https://www.mpedia.fr/art-affirmation-de-soi/', consulted_on: C, published: '2020-08-24' },
  opposition: { label: `${MP} — Enfant qui dit « non », l’âge de l’affirmation`, url: 'https://www.mpedia.fr/art-agressivite-et-opposition/', consulted_on: C, published: '2020-04-23' },
  agressivite: { label: `${MP} — Comment réagir face à l’agressivité persistante de mon enfant ?`, url: 'https://www.mpedia.fr/art-mon-enfant-est-violent/', consulted_on: C, published: '2023-09-01' },
  caprices: { label: `${MP} — Cris, pleurs de l’enfant : réagir face aux caprices`, url: 'https://www.mpedia.fr/art-caprices-comment-les-gerer/', consulted_on: C, published: '2022-04-20' },
  obeissance: { label: `${MP} — Obéissance de l’enfant : quelle punition ?`, url: 'https://www.mpedia.fr/art-obeissance-punition/', consulted_on: C, published: '2023-08-31' },
  regles: { label: `${MP} — Votre enfant accepte les règles`, url: 'https://www.mpedia.fr/outil-enfant-regles/', consulted_on: C },
  jalousie: { label: `${MP} — La jalousie de l’enfant : un sentiment à prendre en compte`, url: 'https://www.mpedia.fr/art-mon-enfant-est-jaloux/', consulted_on: C, published: '2020-10-21' },
  aine: { label: `${MP} — Accueil par l’aîné à l’arrivée d’un nouveau-né`, url: 'https://www.mpedia.fr/art-nouveau-ne-place-de-laine/', consulted_on: C, published: '2023-08-31' },
  vieFamille: { label: 'Santé.fr (contenu 1000 premiers jours / Santé publique France) — La vie de famille après la naissance', url: 'https://www.sante.fr/la-vie-de-famille-apres-la-naissance', consulted_on: C, published: '2024-08-26' },
  solitaire: { label: `${MP} — L’enfant solitaire, entre timidité et grande sensibilité`, url: 'https://www.mpedia.fr/art-enfant-solitaire/', consulted_on: C, published: '2020-11-10' },
  croyances: { label: `${MP} — Le père Noël, la petite souris : faut-il laisser les enfants y croire ?`, url: 'https://www.mpedia.fr/art-les-croyances-enfant/', consulted_on: C, published: '2020-11-23' },
  jeux36: { label: `${MP} — 3 à 6 ans : savoir choisir le bon jeu au bon moment`, url: 'https://www.mpedia.fr/art-3-a-6-ans-leurs-jeux/', consulted_on: C, published: '2021-01-05' },
  evar: { label: 'éduscol (ministère de l’Éducation nationale) — Éducation à la vie affective et relationnelle : livret d’accompagnement de programme (2025)', url: 'https://eduscol.education.gouv.fr/sites/default/files/document/2025livretaccompagnementevaravant4anspdf-112857.pdf', consulted_on: C },
  pleurs: { label: 'Santé.fr (contenu mpedia / AFPA) — Pleurs de mon enfant : les comprendre et les calmer', url: 'https://www.sante.fr/pleurs-de-mon-enfant-les-comprendre-et-les-calmer', consulted_on: C, published: '2026-08-31' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe ; il ne remplace pas l’avis du médecin, du pédiatre, de la puéricultrice de PMI, du psychologue ou des professionnels qui accompagnent votre enfant._';
const AIDE = 'Si vous vous sentez à bout ou envahi par des idées noires, appelez le **3114** (numéro national de prévention du suicide), gratuit, jour et nuit. Si vous pensez qu’un enfant est en danger, appelez le **119** (Allô Enfance en danger), gratuit, jour et nuit. En cas d’urgence vitale, appelez le **15** (SAMU) ou le **112**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['child'], status: 'to_review', ...x,
});

export const GUIDE_B30: LibArticle[] = [
  // ------------------------------------------------------------ sommeil et rituels
  a({
    slug: 'rituel-du-coucher-tout-petit-construire-etapes',
    title: 'Le rituel du coucher de 1 à 6 ans : le construire pas à pas',
    summary: 'Comment bâtir un rituel du soir court, répété et apaisant, qui aide votre enfant à passer de la journée à la nuit et à s’endormir dans son lit.',
    category: 'sommeil', tags: ['rituel du coucher', 'heure du coucher', 'histoire du soir', 'endormissement', 'routine du soir', 'coucher enfant', 'berceuse', 'bonne nuit'],
    min_age_months: 12, max_age_months: 72, journeys: ['child', 'parents_sleep'],
    sources: [S.rituel, S.sommeilEnfant],
    body_md: `## En bref
- Le rituel du coucher sert de **repère** : en répétant chaque soir les mêmes gestes, l’enfant comprend que la nuit approche et se calme.
- Il s’allonge avec l’âge (histoires plus longues, échange sur la journée), mais ne doit **pas durer trop longtemps**, au risque de retarder l’endormissement.
- L’idée est de mettre l’enfant au lit **avant qu’il dorme** et de quitter la chambre avant son endormissement, pour qu’il apprenne à s’endormir dans son lit.
- Des heures de coucher et de lever **régulières**, y compris le week-end, aident son horloge interne.

## Comprendre
Le sommeil de l’enfant mûrit progressivement. Selon le Réseau Morphée, à partir de 2 ans le sommeil de nuit se consolide, puis entre 3 et 6 ans il devient surtout nocturne. Il dépend de deux mécanismes : la « pression de sommeil » qui s’accumule pendant la journée, et l’horloge biologique, réglée par l’alternance du jour et de la nuit. Des « donneurs de temps » réguliers (repas, sorties dehors, coucher et lever à heures stables) aident cette horloge à rester calée.

Le rituel du soir s’inscrit dans cette logique. Les pédiatres de l’AFPA, sur mpedia, le décrivent comme un moment de tendresse partagé, qui permet à l’enfant de se calmer et de vivre la nuit comme une séparation suivie de retrouvailles. Ils conseillent aussi de distinguer le rituel de la sieste de celui du soir, pour que l’enfant fasse la différence entre les deux moments.

Les repères de durée de sommeil cités par le Réseau Morphée (environ 12 heures par jour entre 3 et 5 ans, environ 11 heures entre 5 et 6 ans) sont des moyennes : il existe de petits et de gros dormeurs, des enfants « du matin » et « du soir ».

## Au quotidien
**Un exemple de rituel, à adapter à votre famille :**
1. Le bain ou la toilette, puis le pyjama, dans la salle de bains.
2. Les dents brossées.
3. Volets ou rideaux fermés, lumière douce.
4. Une histoire, une comptine ou une berceuse : la musicalité de la voix compte, même pour un tout-petit. Plus tard, vous pouvez lire ensemble, puis laisser l’enfant feuilleter seul.
5. Le tour des « bonne nuit » aux membres de la famille.
6. Un dernier câlin, l’enfant dans son lit, encore éveillé. Vous quittez la chambre en lui disant que vous êtes tout près.

**Ce qui aide :**
- Garder **le même ordre** chaque soir : c’est la répétition qui rassure.
- Éviter les jeux excitants juste avant : chatouilles, lancers de ballon ou d’oreillers.
- Limiter la lumière le soir et éviter les écrans (tablette, téléphone, ordinateur), recommandation du Réseau Morphée.
- Prévenir à l’avance : « Encore une histoire, puis c’est l’heure du lit. »
- Prévoir vos propres moments de douceur : le rituel est aussi précieux pour les parents.

**Si votre enfant appelle ou pleure après votre départ**, montrez-lui que vous êtes proche et que vous pouvez revenir, calmement, sans relancer le jeu.

## Questions fréquentes
**Combien de temps doit durer le rituel ?**
Il n’y a pas de durée imposée : très bref au début, il s’allonge un peu avec l’âge. L’essentiel est qu’il reste prévisible et ne s’étire pas au point de retarder le sommeil.

**Faut-il le même rituel quand l’enfant dort chez ses grands-parents ?**
Rien n’oblige à tout reproduire, mais retrouver quelques gestes familiers (l’histoire, la chanson, le doudou) peut l’aider à se sentir en sécurité ailleurs.

**Et le week-end ou en vacances ?**
Le Réseau Morphée conseille des heures de coucher et de lever stables, y compris le week-end et pendant les vacances, pour ne pas dérégler l’horloge interne.

**Mon enfant réclame « encore une histoire » chaque soir. Que faire ?**
Annoncez le nombre d’histoires avant de commencer et tenez-vous-y avec douceur. Un repère clair évite la négociation sans fin.

## Quand demander conseil
Parlez-en au médecin ou au pédiatre si les difficultés d’endormissement ou les réveils nocturnes persistent, si votre enfant semble fatigué en journée malgré des nuits suffisantes, s’il ronfle fortement ou si les siestes réapparaissent régulièrement après 4 ans. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'peur-du-noir-au-coucher-rassurer-enfant',
    title: 'Peur du noir au moment du coucher : comment rassurer son enfant ?',
    summary: 'Pourquoi tant d’enfants redoutent le noir, monstres et bruits de la nuit, et les gestes simples qui les aident à apprivoiser ce moment sans nier leur peur.',
    category: 'education', tags: ['peur du noir', 'monstres', 'veilleuse', 'bruits la nuit', 'peur au coucher', 'cauchemar', 'rassurer enfant', 'imagination'],
    min_age_months: 24, max_age_months: 96, journeys: ['child', 'parents_sleep'],
    sources: [S.peurs, S.rituel, S.croyances],
    body_md: `## En bref
- Chez le jeune enfant, l’imagination déborde : la peur du noir, des bruits, des fantômes ou des sorcières est fréquente.
- Cette peur est **réelle** pour lui : mieux vaut l’écouter et l’aider à la nommer que la nier.
- Vous pouvez « raisonner à sa place » : allumer la lumière pour montrer qu’il n’y a rien, expliquer l’origine d’un bruit.
- Évitez les menaces (« le loup va venir si tu ne dors pas ») qui ajoutent de la peur à la peur.

## Comprendre
Pour la pédopsychiatre Sarah Bydlowski (mpedia), les peurs de l’enfance sont structurantes : les surmonter aide à grandir, à condition d’être accompagné par des parents compréhensifs et rassurants. Le jeune enfant ne fait pas encore bien la différence entre ce qu’il imagine et ce qui existe. Dans l’obscurité, une chaise devient une silhouette, un volet qui claque devient un monstre.

Les contes traditionnels mettent d’ailleurs en scène ces peurs et se terminent toujours de manière rassurante. C’est une façon, pour l’enfant, de les apprivoiser à distance. Plus tard, les peurs changent de visage : se retrouver seul, perdre ses parents, la maladie, les voleurs.

Le coucher est un moment de séparation. Les pédiatres de l’AFPA rappellent l’intérêt de rassurer l’enfant en lui montrant que ses parents sont proches et peuvent revenir s’il se sent mal.

## Au quotidien
**Au moment de la peur :**
- **Écoutez** sans vous moquer : « Tu as peur qu’il y ait quelque chose sous le lit ? » Mettre des mots sur une peur la diminue.
- **Vérifiez ensemble** : allumez, regardez sous le lit, ouvrez le placard. Vous montrez concrètement qu’il n’y a rien.
- **Expliquez les bruits** : le chauffage, le voisin, le vent dans le volet.
- **Partagez votre expérience** : dire que vous aussi avez eu peur de quelque chose, tout en précisant que c’était inoffensif, dédramatise sans minimiser.

**Pour préparer la nuit :**
- Un rituel du coucher calme et prévisible.
- Une lumière douce si elle le rassure, ou la porte entrouverte : à vous de voir ce qui fonctionne chez vous.
- Le doudou, présence familière au toucher et à l’odeur.
- Des histoires sur la nuit et ses « monstres » lues en journée, à distance du coucher, permettent d’en parler sans pression.

**Ce qui risque d’entretenir la peur :**
- Les menaces (croquemitaine, loup) pour obtenir le coucher.
- Les images ou récits effrayants avant de dormir.
- Les personnages imaginaires utilisés comme outils de chantage : mpedia conseille de ne pas transférer son autorité à des personnages qui n’existent pas.

## Questions fréquentes
**Faut-il « chasser les monstres » avec un spray ou un rituel magique ?**
Certaines familles le font pour jouer. Gardez en tête que l’objectif est d’aider l’enfant à distinguer l’imaginaire du réel : allumer et vérifier ensemble est souvent plus rassurant à long terme que confirmer que les monstres existent.

**Mon enfant vient dans notre lit quand il a peur. Est-ce un problème ?**
Chaque famille fait ses choix. Vous pouvez le raccompagner calmement dans son lit et rester un moment près de lui, pour qu’il apprenne que sa chambre est un lieu sûr.

**Peur du noir et cauchemars, est-ce la même chose ?**
Non : la peur du noir survient avant l’endormissement, le cauchemar est un mauvais rêve qui réveille l’enfant. Dans les deux cas, il a besoin d’être rassuré.

**À quel âge cette peur disparaît-elle ?**
Il n’y a pas d’âge fixe. Elle s’atténue en général à mesure que l’enfant comprend mieux le monde, surtout s’il se sent écouté.

## Quand demander conseil
Demandez l’avis du médecin de votre enfant si sa peur prend beaucoup de place dans sa vie, si elle empêche durablement le sommeil, s’il paraît anxieux de nature ou si d’autres changements apparaissent (tristesse, maux de ventre, refus de l’école). ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'peurs-enfant-orage-animaux-mort-reagir',
    title: 'Orage, chiens, voleurs, la mort : réagir aux peurs de son enfant selon l’âge',
    summary: 'Les peurs changent à mesure que l’enfant grandit ; quelques principes simples aident à les écouter, à informer sans effrayer et à repérer quand elles prennent trop de place.',
    category: 'education', tags: ['peurs enfant', 'peur de l’orage', 'peur des chiens', 'peur de la mort', 'angoisse enfant', 'faits divers', 'rassurer', 'actualité enfant'],
    min_age_months: 24, max_age_months: 120,
    sources: [S.peurs, S.solitaire],
    body_md: `## En bref
- Les peurs évoluent avec l’âge : monstres et noir chez le petit, puis peur de se perdre, de perdre ses parents, de l’orage ou des voleurs, et plus tard des faits divers.
- À partir de 6-7 ans, l’enfant se pose davantage de questions sur la mort.
- Trois leviers aident : **écouter**, **informer** avec des mots simples, **relativiser** le risque réel.
- Ne niez pas la peur et ne la renforcez pas : elle est réelle pour l’enfant, même si son objet ne l’est pas.

## Comprendre
Selon la pédopsychiatre Sarah Bydlowski (mpedia), le jeune enfant a une imagination débordante qui nourrit des peurs « fantastiques ». En grandissant, apparaissent des peurs plus irrationnelles qui portent souvent sur ce que l’enfant comprend mal : la mort, l’orage, la maladie, les voleurs. Plus âgé, il découvre par l’école, la télévision ou internet des événements effrayants (catastrophes, crimes, enlèvements) qui peuvent l’inquiéter.

Ces peurs font partie du développement. Les surmonter aide l’enfant à grandir, à condition qu’il se sente accompagné. Ce qui compte n’est pas de supprimer toute peur, mais de lui donner des outils pour la traverser.

## Au quotidien
**Écouter d’abord**
- Encouragez-le à raconter ce qui lui fait peur, sans juger ni vous moquer.
- Reformulez : « Quand il y a du tonnerre, tu as l’impression que la maison va casser ? »

**Informer, avec des mots adaptés**
- **L’orage :** expliquer le phénomène aide. Compter les secondes entre l’éclair et le tonnerre permet d’estimer la distance de l’orage (environ un kilomètre toutes les trois secondes) : un jeu qui redonne le contrôle.
- **Un animal :** un livre sur cet animal, observer de loin un chien calme avec son maître, apprendre les bons gestes (ne pas courir, ne pas caresser sans demander).
- **Une catastrophe vue aux informations :** rappeler, si c’est le cas, que le phénomène est rare et que le risque là où vous vivez est très faible.

**Parler de la mort**
- À partir de 6-7 ans, expliquez simplement qu’elle fait partie de la fin de la vie.
- Répondez aux questions au fur et à mesure, sans en dire plus que ce qu’il demande.
- Quand vous n’avez pas de réponse, cherchez ensemble. On ne peut pas protéger l’enfant de cette peur, mais on peut l’accompagner.

**Limiter ce qui alimente l’angoisse**
- Évitez les menaces pour obtenir l’obéissance.
- Choisissez avec lui les images et les informations qu’il regarde, et restez disponible pour en parler.

## Questions fréquentes
**Dois-je lui dire que, moi aussi, j’ai peur de certaines choses ?**
Oui, cela peut aider, en précisant que la chose en question est sans danger réel. Il comprend que la peur se partage et se surmonte.

**Faut-il l’obliger à affronter sa peur (caresser le chien, par exemple) ?**
Forcer risque d’augmenter la peur. Avancez par petites étapes qu’il accepte, en le félicitant pour chaque pas.

**Il a peur qu’il nous arrive quelque chose. Comment le rassurer ?**
Écoutez sa peur, expliquez ce qui est prévu pour lui (qui vient le chercher, qui s’occupe de lui), et rappelez que les adultes veillent sur sa sécurité.

**Ces peurs peuvent-elles cacher autre chose ?**
Parfois. Si l’enfant paraît anxieux en permanence, s’isole, dort mal ou se plaint souvent de maux de tête ou de ventre, un mal-être plus profond peut se cacher derrière.

## Quand demander conseil
Mpedia conseille de demander l’avis du médecin de l’enfant s’il paraît particulièrement anxieux de nature ou si ses peurs prennent trop de place dans sa vie (sommeil, école, sorties). Tristesse durable, sommeil perturbé, perte d’appétit ou baisse des résultats scolaires justifient aussi d’en parler. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'doudou-role-choix-lavage-separation',
    title: 'Le doudou : à quoi il sert, comment le laver, quand il s’efface',
    summary: 'Objet transitionnel, le doudou aide l’enfant à supporter les séparations ; voici comment l’accompagner, le laver sans drame et le laisser s’éloigner à son rythme.',
    category: 'developpement', tags: ['doudou', 'objet transitionnel', 'peluche', 'laver le doudou', 'séparation', 'crèche', 'doudou école', 'réconfort'],
    min_age_months: 6, max_age_months: 96, journeys: ['newborn', 'child'],
    sources: [S.doudou, S.cododo],
    body_md: `## En bref
- Le doudou est un **objet transitionnel** : il fait le lien entre le parent et l’enfant et l’aide à supporter les séparations.
- C’est **l’enfant qui le choisit** : peluche, simple morceau de tissu… ce qui compte, c’est son toucher et son odeur.
- Il doit être **lavé régulièrement**, en associant l’enfant pour éviter le drame.
- Il s’efface **naturellement** avec l’autonomie ; inutile de forcer la séparation.

## Comprendre
Quand son parent disparaît de son champ de vision, le bébé peut se sentir abandonné. Le doudou, expliquent les pédiatres de mpedia, l’aide à supporter ces moments : il offre une présence physique rassurante, que l’enfant reconnaît en le palpant, en le suçant, en le sentant. Il fonctionne comme un « supporter » qui rend les séparations moins brutales.

Le nouveau-né est trop jeune pour choisir un doudou. En néonatalogie, on conseille souvent un petit mouchoir ou un foulard imprégné de l’odeur du parent, placé près du bébé. Plus tard, l’enfant élit lui-même son objet, parfois inattendu.

Côté sécurité, pour le tout-petit, les recommandations de couchage restent prioritaires : couchage sur le dos, matelas ferme, et lit sans tour de lit, couverture, oreiller ni grosse peluche. Demandez conseil à votre pédiatre ou à la PMI pour savoir quand et comment laisser un doudou dans le lit selon l’âge de votre bébé.

## Au quotidien
**Dans les séparations**
- Lors d’une garde, d’une entrée à la crèche ou d’une hospitalisation, il est préférable que le doudou accompagne l’enfant.
- Certains médecins utilisent le doudou pour préparer un soin : ils l’auscultent d’abord sous les yeux de l’enfant. Vers 2 ou 3 ans, l’enfant peut lui-même « soigner » son doudou, ce qui dédramatise la consultation.

**Le lavage, sans larmes**
- Le doudou est sucé, traîné, emporté partout : il doit être lavé régulièrement.
- Expliquez que, comme lui, son doudou a besoin d’être propre et de sentir bon.
- Faites-en un jeu : l’enfant met lui-même le doudou dans la machine, le regarde sécher.
- Choisissez un moment calme (pendant une sieste ou un week-end tranquille) plutôt qu’un soir où il en aura besoin.

**À la crèche et à l’école**
- Des moments « sans doudou » y sont souvent prévus : rangé dans un panier ou dans le casier, il reste accessible en cas de chagrin.
- Respectez les règles de l’établissement et parlez-en avec l’équipe.

**Quand il s’éloigne**
- Avec l’autonomie, l’enfant s’intéresse à d’autres activités et délaisse peu à peu son doudou. Le détachement n’est jamais total : certains adultes le gardent toute leur vie.

## Questions fréquentes
**Faut-il acheter un doudou de rechange ?**
Certaines familles le font pour faire face à une perte ou à un lavage. L’enfant reconnaît son doudou à l’odeur et au toucher : un double neuf peut ne pas être accepté tout de suite.

**Mon enfant n’a pas de doudou. Est-ce un souci ?**
Non. Tous les enfants n’en choisissent pas ; certains se consolent autrement (un geste, une chanson, la main d’un adulte).

**À quel âge faut-il arrêter le doudou ?**
Il n’y a pas d’âge imposé. Il s’efface de lui-même ; vous pouvez simplement proposer qu’il reste à la maison ou au lit pendant certaines activités.

**Le doudou est perdu : que faire ?**
Accueillez le chagrin, cherchez ensemble, et proposez un autre réconfort sans minimiser la perte. L’enfant a besoin de temps.

## Quand demander conseil
Parlez-en au médecin ou à la puéricultrice si les séparations restent très difficiles malgré le temps, ou si l’enfant semble en détresse durable. Pour le couchage d’un bébé, la PMI peut vous conseiller. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'tetine-quand-et-comment-arreter',
    title: 'La tétine : quand et comment aider son enfant à s’en passer',
    summary: 'Ce que disent les pédiatres sur les avantages et les inconvénients de la tétine, les âges repères pour accompagner l’arrêt, et des idées pour le faire en douceur.',
    category: 'developpement', tags: ['tétine', 'sucette', 'arrêter la tétine', 'sevrage tétine', 'dents', 'langage', 'otites', 'besoin de succion'],
    min_age_months: 6, max_age_months: 72, journeys: ['newborn', 'child'],
    sources: [S.pouceTetine, S.ameliPrevention],
    body_md: `## En bref
- La tétine calme et aide à s’endormir ; elle a aussi un effet apaisant lors de soins comme les vaccins.
- Elle a des inconvénients : elle peut gêner l’allaitement si elle est introduite trop tôt, favoriser des troubles de la croissance dentaire et la récidive d’otites.
- **À partir d’un an**, on peut commencer à accompagner l’enfant pour réduire progressivement la succion ; ameli encourage à l’arrêter **vers 3 ans** si elle est encore utilisée.
- Une tétine ancienne, fissurée ou abîmée doit être **remplacée**.

## Comprendre
Le besoin de succion est fort chez le bébé. Selon les pédiatres de mpedia, la tétine apaise, endort et peut avoir un effet antalgique lors de gestes médicaux. Certaines données suggèrent un effet protecteur vis-à-vis de la mort inattendue du nourrisson, un point encore à l’étude : la principale mesure de prévention reste le couchage sur le dos.

Ses inconvénients sont connus : introduite trop tôt, elle peut faire échouer l’allaitement ; utilisée longtemps, elle peut entraîner des troubles de la croissance dentaire nécessitant parfois un orthodontiste, et favoriser les otites à répétition. Une dépendance prolongée peut aussi gêner l’apprentissage de la parole, et rendre l’arrêt de plus en plus difficile.

Bonne nouvelle : la tétine est plus facile à abandonner que le pouce. Et si elle est arrêtée avant 4 ans, les déformations éventuelles se résolvent souvent avec la croissance et l’éruption des dents.

## Au quotidien
**Réduire progressivement**
- Commencez par la réserver au lit (sieste et nuit), puis seulement à l’endormissement.
- Proposez d’autres apaisements : câlin, doudou, chanson, histoire.
- La journée, gardez la tétine hors de vue : ce qu’on ne voit pas, on le réclame moins.

**Parler, expliquer**
- Vers 2-3 ans, l’enfant comprend des explications simples : « Avec la tétine, c’est plus difficile de parler », « Tes dents ont besoin de pousser bien droit ».
- Laissez-le participer à la décision : choisir le jour, ranger lui-même les tétines.
- Félicitez chaque étape franchie.

**Hygiène et sécurité**
- Ne nettoyez pas une tétine tombée par terre en la mettant dans votre bouche : cela transmet des germes responsables de caries.
- Vérifiez régulièrement son état et remplacez-la au moindre signe d’usure.
- Ne l’attachez jamais avec un cordon autour du cou.

## Questions fréquentes
**Faut-il interdire la tétine avant 4 ans ?**
Non : selon l’avis orthodontique rapporté par mpedia, il n’est pas jugé nécessaire d’interdire la succion avant cet âge. L’important est de l’accompagner vers l’arrêt à temps.

**Mon enfant parle avec la tétine dans la bouche. Que faire ?**
Proposez-lui de l’enlever pour parler, sans le gronder. Ameli recommande, à 3 ans, d’aider l’enfant à exprimer sa pensée et de l’encourager à arrêter la tétine.

**Il pleure beaucoup depuis qu’on a arrêté. Faut-il revenir en arrière ?**
Quelques soirs difficiles sont fréquents. Restez présent et rassurant. Si la détresse dure, faites une pause et réessayez plus tard, à un moment plus calme de sa vie.

**Tétine et pouce, lequel choisir ?**
Pour mpedia, la tétine a l’avantage d’être plus facile à retirer. Chaque enfant a ses préférences, et vous pouvez en parler avec votre pédiatre.

## Quand demander conseil
Parlez-en au médecin, au pédiatre ou au chirurgien-dentiste si les dents vous semblent déformées, si votre enfant fait des otites à répétition, si son langage vous inquiète ou si l’arrêt paraît impossible au fil des mois. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'sucer-son-pouce-quand-aider-arreter',
    title: 'Sucer son pouce : faut-il s’inquiéter, et comment aider à arrêter ?',
    summary: 'Le pouce apaise de nombreux enfants ; voici à partir de quand l’accompagner vers l’arrêt, comment s’y prendre et quand en parler à un professionnel.',
    category: 'developpement', tags: ['pouce', 'sucer son pouce', 'arrêter le pouce', 'dents', 'palais', 'orthodontiste', 'succion', 'endormissement'],
    min_age_months: 0, max_age_months: 96, journeys: ['newborn', 'child'],
    sources: [S.pouceTetine, S.ameliTroubles],
    body_md: `## En bref
- Sucer son pouce est un réflexe fréquent qui **apaise** et aide à s’endormir.
- Durant la première année, il n’y a pas de souci à sucer son pouce ; le geste disparaît souvent aussi naturellement qu’il est apparu.
- **Après 3 ans**, il est conseillé d’aider l’enfant à arrêter, progressivement et en expliquant pourquoi.
- Une succion intense et prolongée peut entraîner, à long terme, des problèmes orthodontiques et des déformations du palais.

## Comprendre
Selon les pédiatres de mpedia, le réflexe de succion détend et aide à s’endormir. Il faut laisser l’enfant libre de ce geste tant qu’il reste un moyen de se calmer dans des moments précis (fatigue, chagrin). Il devient préoccupant lorsque l’usage est abusif : succion constante, jour et nuit, sans fatigue ni chagrin particulier.

Le pouce est plus difficile à abandonner que la tétine, car il est toujours disponible. D’où l’intérêt d’accompagner l’arrêt à temps. Si la succion cesse avant 4 ans, les déformations se résolvent souvent spontanément avec la croissance et l’éruption dentaire ; pour les enfants les plus dépendants, la limite évoquée se situe à la chute des dents de lait de devant, vers 6 ans.

Ameli rappelle aussi qu’une succion prolongée du pouce peut s’associer à un retard de parole, parmi d’autres signes d’immaturité (attachement au biberon, alimentation mixée).

## Au quotidien
**Observer d’abord**
- Quand suce-t-il son pouce ? À l’endormissement, devant un écran, quand il s’ennuie, quand il est inquiet ? Repérer les moments aide à proposer autre chose.

**Accompagner par étapes (après 3 ans)**
1. Faire des pauses dans la journée, en occupant les mains : pâte à modeler, dessin, construction.
2. Limiter le pouce au soir et au lit.
3. Puis plus du tout, quand l’enfant se sent prêt.

**Expliquer et encourager**
- Expliquez simplement pourquoi : les dents et le palais ont besoin de pousser sans être poussés par le pouce.
- Félicitez les progrès, même petits. Un calendrier où il colle une gommette les jours « sans pouce » peut le motiver.
- Évitez les moqueries, les remarques devant les autres ou les punitions : elles augmentent souvent le besoin de réconfort.

**Proposer d’autres apaisements**
- Un câlin, le doudou, une histoire, un moment de calme partagé.

## Questions fréquentes
**Mon bébé de quelques mois suce son pouce. Dois-je le retirer ?**
Non : pendant la première année, sucer son pouce ne pose pas de problème selon mpedia.

**Il ne réussit pas à limiter son pouce malgré nos efforts. Pourquoi ?**
Si, au fil des mois, l’enfant n’arrive pas du tout à réduire la succion, cela peut traduire une difficulté d’ordre psychologique ou une angoisse. Un échange avec le médecin peut aider à comprendre.

**Faut-il utiliser des produits amers ou des pansements sur le pouce ?**
Mieux vaut en parler d’abord avec votre médecin ou votre chirurgien-dentiste. L’arrêt fonctionne mieux quand l’enfant y adhère.

**Le pouce peut-il gêner la parole ?**
Une succion très fréquente peut aller de pair avec un retard de parole. Si sa prononciation vous inquiète après 4 ans, parlez-en au médecin.

## Quand demander conseil
Consultez le médecin, le pédiatre ou le chirurgien-dentiste si vous remarquez une déformation des dents ou du palais, si la succion reste constante après 4 ans, si la parole vous inquiète ou si l’enfant semble anxieux. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'fin-de-la-sieste-enfant-temps-calme',
    title: 'Mon enfant ne veut plus faire la sieste : quand l’arrêter, comment la remplacer ?',
    summary: 'La sieste évolue de 1 à 6 ans ; voici les repères d’âge, les signes qu’elle devient inutile ou au contraire encore nécessaire, et l’intérêt du temps calme.',
    category: 'sommeil', tags: ['sieste', 'arrêt de la sieste', 'temps calme', 'sieste maternelle', 'enfant fatigué', 'coucher tardif', 'sommeil enfant', 'rythme'],
    min_age_months: 12, max_age_months: 72, journeys: ['child', 'parents_sleep'],
    sources: [S.sieste, S.sommeilEnfant],
    body_md: `## En bref
- Vers 18 mois, la sieste du matin disparaît généralement ; une sieste plus longue en début d’après-midi la remplace.
- La sieste disparaît en général **entre 3 et 6 ans** ; certains enfants n’en font déjà plus à 2 ans, surtout si leur nuit est longue.
- Une sieste trop longue (au-delà d’environ 3 heures) ou trop tardive peut **retarder le coucher**.
- Quand la sieste s’arrête, un **temps calme** reste utile, notamment le mercredi ou le week-end.

## Comprendre
La sieste est surtout faite de sommeil lent profond. Selon le Réseau Morphée, lorsqu’elle disparaît, la première partie de la nuit se réorganise avec davantage de sommeil profond. Le conseil principal de la pédiatre Catherine Salinier (mpedia) est de respecter le rythme naturel de l’enfant.

Quelques repères :
- **Vers 12 mois :** une sieste le matin, une l’après-midi, parfois un petit somme en fin de journée.
- **Vers 18 mois :** la sieste du matin disparaît ; la sieste de début d’après-midi s’allonge (2 à 3 heures). Le repas de midi est souvent avancé.
- **En petite section de maternelle :** la sieste se poursuit généralement.
- **Vers 4 ans, parfois jusqu’à 5-6 ans :** certains enfants en ont encore besoin, parfois pas tous les jours. Leur besoin peut se réguler sur la semaine.

Entre 4 et 12 ans, un enfant est normalement vif en journée et s’endort profondément le soir. Si des siestes réapparaissent régulièrement, le Réseau Morphée conseille de rechercher une cause médicale ou un trouble du sommeil.

## Au quotidien
**Les signes qu’il a encore besoin de sa sieste**
- Il devient énervé, agité, pleure facilement en fin d’après-midi : une fatigue accumulée rend souvent l’enfant plus nerveux.
- Il s’endort dans la voiture ou sur le canapé à 17 h.

**Les signes qu’elle devient de trop**
- Il met très longtemps à s’endormir le soir après une sieste.
- Il reste éveillé tranquillement dans son lit à l’heure de la sieste, sans fatigue ensuite.

**Remplacer la sieste par un temps calme**
- Un moment allongé ou assis au calme : livres, musique douce, puzzle, dans sa chambre.
- Laissez la lumière du jour : pour la sieste, la chambre n’a pas besoin d’être plongée dans le noir complet, et les bruits normaux de la maison peuvent rester.
- S’il s’endort, laissez-le dormir, mais pas trop tard dans l’après-midi.

**Ajuster le soir**
- Les jours sans sieste, avancez un peu l’heure du coucher.
- Si la sieste est très longue, vous pouvez le réveiller doucement au bout de 2 heures et proposer une activité stimulante ensuite (sortie, jeu).

## Questions fréquentes
**Faut-il réveiller un enfant qui fait une longue sieste ?**
Normalement, il se réveille seul. Mpedia indique qu’une sieste ne devrait pas dépasser environ 3 heures, pour ne pas retarder le coucher.

**À l’école, il dort alors qu’il ne fait plus la sieste à la maison. Est-ce un problème ?**
Le besoin de sommeil varie selon la fatigue de la semaine. Parlez-en avec l’équipe pour adapter, si possible, et observez ses nuits.

**La sieste peut-elle compenser une nuit trop courte ?**
En partie, mais une sieste tardive ou imprévue peut compliquer l’endormissement du soir. Mieux vaut viser des nuits suffisantes et régulières.

**Il s’endort à la nounou pour « tuer le temps ». Que faire ?**
Mpedia suggère, quand un enfant semble dormir surtout par ennui, de regarder avec la personne qui le garde comment se déroule sa journée.

## Quand demander conseil
Parlez-en au médecin si votre enfant de plus de 4 ans a de nouveau besoin de siestes régulières, s’il semble somnolent en journée, s’il ronfle fortement ou si son humeur change nettement. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'horaires-de-sommeil-reguliers-week-end-vacances-rentree',
    title: 'Coucher tardif, week-end, vacances : garder un rythme de sommeil régulier',
    summary: 'Pourquoi l’horloge interne de l’enfant aime la régularité, et comment caler ou recaler son sommeil autour des week-ends, des vacances et de la rentrée.',
    category: 'sommeil', tags: ['heure du coucher', 'rythme de sommeil', 'vacances', 'rentrée', 'week-end', 'horloge biologique', 'lumière', 'écrans le soir', 'dette de sommeil'],
    min_age_months: 24, max_age_months: 144, journeys: ['child', 'parents_sleep'],
    sources: [S.sommeilEnfant, S.rituel],
    body_md: `## En bref
- L’horloge biologique de l’enfant se règle grâce à des **« donneurs de temps »** réguliers : repas, sorties dehors, heures de coucher et de lever stables.
- Le Réseau Morphée conseille de garder ces repères **y compris le week-end et pendant les vacances**.
- **La lumière** compte : s’exposer au jour le matin, limiter la lumière le soir et éviter les écrans avant de dormir.
- Le temps de sommeil des enfants a diminué ces dernières décennies, surtout à cause de couchers plus tardifs.

## Comprendre
Le sommeil dépend de deux régulations : la pression de sommeil, qui monte au fil de la journée, et l’horloge circadienne, qui suit l’alternance jour-nuit. Cette horloge, située dans le cerveau, coordonne de nombreux rythmes du corps. Certains enfants sont plutôt « du matin », d’autres « du soir » : ce chronotype est en partie génétique et peut se manifester tôt.

Le Réseau Morphée, dont le contenu est relayé par Santé.fr, note que les couchers plus tardifs (organisation familiale, activités du soir) ont réduit le temps de sommeil moyen des enfants, et que les médecins du sommeil s’inquiètent de la dette de sommeil qui en résulte. Pour connaître le besoin réel de votre enfant, une piste est d’observer son sommeil après une dizaine de jours de vacances sans contrainte.

Repères moyens cités : environ 12 heures par jour entre 3 et 5 ans, environ 11 heures entre 5 et 6 ans, 10 à 11 heures entre 7 et 12 ans. Chaque enfant a ses particularités.

## Au quotidien
**Au quotidien, en semaine**
- Fixez une heure de coucher réaliste et tenez-la la plupart des soirs.
- Sortez dehors chaque jour, si possible le matin : la lumière naturelle aide l’horloge.
- Le soir, baissez les lumières et éteignez les écrans (tablette, téléphone, ordinateur) bien avant le coucher.
- Un rituel du coucher stable aide l’enfant à faire la transition vers la nuit.

**Le week-end**
- Un petit décalage est souvent sans conséquence, mais de grandes « grasses matinées » suivies d’un coucher très tardif rendent le dimanche soir et le lundi matin difficiles.

**En vacances**
- Gardez quelques repères : heure du lever pas trop variable, rituel du soir, sorties dehors.
- Les veilles de fête ou de voyage, prévoyez un temps calme le lendemain.

**Recaler le rythme avant la rentrée**
- Quelques jours avant, avancez progressivement l’heure du coucher et du lever.
- Réveillez-le à heure fixe le matin et exposez-le à la lumière du jour.
- Gardez une soirée calme, sans écran, avec un rituel rassurant.

## Questions fréquentes
**Mon enfant est « du soir » : faut-il le coucher plus tard ?**
Respecter ses besoins propres est recommandé, dans les limites des contraintes de l’école. Si l’endormissement est très tardif et qu’il est fatigué le matin, parlez-en au médecin.

**Les écrans le soir, vraiment un problème ?**
La lumière en soirée, et en particulier celle des écrans, est citée par le Réseau Morphée parmi ce qui perturbe l’horloge. Les éteindre bien avant le coucher est une mesure simple.

**Une sieste le week-end peut-elle rattraper le manque de sommeil ?**
Elle peut aider ponctuellement, mais une sieste tardive peut retarder l’endormissement du soir. La régularité reste le meilleur allié.

## Quand demander conseil
Consultez le médecin si votre enfant met très longtemps à s’endormir de façon persistante, se réveille souvent la nuit, ronfle fortement, est somnolent ou irritable en journée, ou si les siestes réapparaissent régulièrement après 4 ans. ${AIDE}

${FIN}`,
  }),
  // ------------------------------------------------------------ langage et curiosité
  a({
    slug: 'langage-3-6-ans-reperes-prononciation-aider',
    title: 'Le langage de 3 à 6 ans : repères, prononciation et jeux pour l’aider',
    summary: 'Ce qui évolue dans le langage entre 3 et 6 ans, les erreurs de prononciation fréquentes, la bonne façon de corriger sans faire répéter et les signes qui doivent amener à consulter.',
    category: 'developpement', tags: ['langage 3 ans', 'langage 4 ans', 'prononciation', 'zozoter', 'parler bébé', 'orthophoniste', 'vocabulaire', 'rimes', 'phrases'],
    min_age_months: 36, max_age_months: 72,
    sources: [S.langage36, S.ameliTroubles, S.ameliPrevention],
    body_md: `## En bref
- Vers 3 ans, l’enfant fait des phrases sujet-verbe-complément et dit « je ». Ensuite, son langage s’enrichit et se rapproche de celui de l’adulte.
- **À 4 ans**, il utilise couramment les petits mots (pronoms, déterminants) ; environ 80 % des enfants articulent correctement tous les sons.
- **Entre 4 et 6 ans**, il joue avec les mots (rimes, syllabes), aime raconter et inventer des histoires.
- Pour l’aider : de **vraies conversations**, des histoires, et **redire correctement** un mot mal prononcé plutôt que de le faire répéter.

## Comprendre
Le rythme varie d’un enfant à l’autre, mais la chronologie reste assez constante, rappelle ameli. Après 3 ans, l’enfant enrichit son vocabulaire (tailles, couleurs, formes, singulier et pluriel, parties du corps), exprime l’espace (dedans, dehors) et le temps (hier, demain). Sa prononciation n’est pas encore parfaite. Selon mpedia, entre 4 et 6 ans il découvre les mots dérivés, les sous-entendus, les jeux de mots, apprend à convaincre ; sa diction devient claire et il est prêt, vers 6 ans, à apprendre à lire et à écrire.

Ameli distingue plusieurs difficultés possibles :
- **Le trouble de l’articulation** : un son est toujours supprimé ou remplacé (« apeau » pour « chapeau », zozotement, chuintement). Isolé, il est bénin, mais peut persister sans rééducation.
- **Le retard de parole** : des erreurs habituelles vers 3 ans persistent après 4-5 ans (sons inversés, mots raccourcis), de façon inconstante.
- **Le retard de langage** : première phrase après 3 ans, « parler bébé » prolongé, style télégraphique.

## Au quotidien
- **Conversez vraiment** : chacun parle, chacun écoute. Posez des questions ouvertes sur sa journée.
- **Soyez un modèle** : phrases complètes, mots précis, débit posé.
- **Reformulez sans corriger** : s’il dit « le pin » pour « le lapin », répondez « Oui, le lapin mange une carotte ». Mpedia et ameli conseillent de ne pas le faire répéter.
- **Racontez et lisez** chaque jour. Ameli recommande, à 4 ans, de lire et raconter ensemble et de montrer l’exemple en lisant soi-même.
- **Jouez avec les mots** :
  - les rimes : vous dites « chapeau », il cherche « gâteau » ;
  - les syllabes : taper dans les mains « pa-pi-llon » ;
  - l’histoire à l’envers : il vous raconte une histoire déjà lue plusieurs fois.
- **Chantez** comptines et chansons. Les enregistrements peuvent dépanner, mais ne remplacent pas l’échange avec l’adulte.
- **Limitez les écrans** : ameli rappelle qu’ils nuisent à l’acquisition du langage, en particulier la télévision allumée en fond.

## Questions fréquentes
**Mon enfant de 4 ans zozote. Faut-il s’inquiéter ?**
Un défaut isolé de prononciation est fréquent et bénin, mais il peut persister. Si, après 4 ans, certains sons restent toujours déformés, parlez-en au médecin, qui pourra prescrire un bilan orthophonique.

**Il bégaie depuis quelques semaines. Que faire ?**
Le bégaiement débute le plus souvent entre 2 et 5 ans et évolue généralement favorablement, selon ameli. Laissez-le finir ses phrases sans les compléter, et consultez si cela dure ou le gêne.

**Faut-il éviter le « langage bébé » ?**
Ameli conseille d’utiliser des mots simples mais corrects. Vous pouvez garder la tendresse dans le ton tout en employant les vrais mots.

**L’école peut-elle repérer une difficulté ?**
Oui : un dépistage est réalisé à l’école, et le repérage précoce est jugé essentiel pour prévenir les difficultés d’apprentissage de l’écrit.

## Quand demander conseil
Consultez le médecin si, **vers 3 ans**, votre enfant ne fait pas de phrases complètes ou n’est compris que de ses proches ; si, **à 4 ans**, il comprend mal les phrases complexes ou construit des phrases très limitées ; si, **entre 4 et 6 ans**, il garde un style télégraphique ou des mots mal articulés. Pensez aussi à faire vérifier l’audition. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'deux-parents-deux-langues-bilinguisme-bebe',
    title: 'Deux parents, deux langues : élever son enfant dans le bilinguisme',
    summary: 'Quelle langue parler à son bébé quand les parents n’ont pas la même langue maternelle, comment organiser les langues à la maison, et ce qu’il faut savoir sur le vocabulaire.',
    category: 'developpement', tags: ['bilinguisme', 'deux langues', 'langue maternelle', 'enfant bilingue', 'couple mixte', 'langue étrangère', 'apprendre à parler', 'plurilinguisme'],
    min_age_months: 0, max_age_months: 96, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.langues, S.ecritNonFrancophone],
    body_md: `## En bref
- Le bébé perçoit les sons de toutes les langues ; cette capacité se réduit peu à peu, à mesure que son cerveau se spécialise dans les langues entendues autour de lui.
- Quand les parents n’ont pas la même langue maternelle, il est recommandé d’exposer l’enfant **aux deux langues**.
- Chaque parent parle de préférence **dans sa langue maternelle**, celle qu’il maîtrise le mieux.
- Un **référent stable** par langue aide l’enfant à se construire des repères ; mélanger sans cesse les deux langues peut brouiller ces repères.

## Comprendre
Dès les premiers mois, rappelle le pédiatre Jacques Langue (mpedia), le bébé est un « polyglotte en puissance » : il distingue des sons de langues très éloignées du français. Faute de pratique, cette capacité s’efface progressivement : le cerveau trie les sons et privilégie ceux des langues utilisées autour de lui.

Une langue s’acquiert mieux auprès de quelqu’un qui la maîtrise bien. C’est pourquoi les pédiatres conseillent que chaque parent s’adresse à l’enfant dans sa langue maternelle. Avoir un référent stable pour chaque langue favorise un bilinguisme naturel.

Mpedia signale aussi qu’un « retard lexical » est souvent observé chez les enfants bilingues, qui doivent apprendre davantage de mots : leur vocabulaire dans chaque langue peut sembler plus petit pendant un temps. À l’inverse, une étude citée par mpedia suggère que les jeunes enfants exposés à plusieurs langues deviennent de meilleurs communicants, plus attentifs au point de vue des autres.

## Au quotidien
**Organiser les langues**
- Une règle simple souvent choisie : « un parent, une langue ». Chaque parent garde sa langue avec l’enfant, en toutes circonstances.
- Entre vous, parlez la langue qui vous convient ; l’enfant comprend vite qui parle quoi.
- Évitez de passer d’une langue à l’autre au milieu d’une phrase quand vous vous adressez à lui.

**Nourrir chaque langue**
- Lisez des livres, chantez des comptines, regardez des albums dans les deux langues.
- Favorisez les contacts avec la famille, des amis ou des enfants qui parlent chaque langue.
- Si vous vivez en France et que l’autre langue est peu présente autour de vous, multipliez les occasions de l’entendre : appels avec la famille, rencontres, séjours.

**Le français**
- Le français reste la langue de l’école et du quotidien en France : la crèche, la halte-garderie et les lieux d’accueil enfants-parents l’y immergent naturellement.

## Questions fréquentes
**Le bilinguisme retarde-t-il le langage ?**
L’enfant bilingue doit apprendre plus de mots ; un vocabulaire un peu plus restreint dans chaque langue est souvent observé au début. Cela ne doit pas faire attribuer trop vite au bilinguisme une vraie difficulté : mpedia rappelle que des troubles réels sont parfois repérés tardivement pour cette raison.

**Mon enfant me répond en français alors que je lui parle dans ma langue. Que faire ?**
Continuez à lui parler dans votre langue, sans le forcer à répondre. Il la comprend et l’entretient en l’entendant.

**Faut-il arrêter une langue si l’enfant a des difficultés ?**
Parlez-en d’abord au médecin : il évaluera les difficultés et pourra orienter vers un bilan orthophonique, qui tiendra compte du bilinguisme.

**Peut-on apprendre une troisième langue ?**
Rien n’empêche un enfant d’être exposé à plusieurs langues, à condition qu’elles soient parlées régulièrement par des personnes qui les maîtrisent.

## Quand demander conseil
Consultez le médecin si votre enfant ne fait pas de phrases vers 3 ans dans aucune de ses langues, s’il semble mal comprendre ce qu’on lui dit, ou si l’école vous signale des difficultés : une évaluation permet de distinguer un retard lié au bilinguisme d’un trouble du langage. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'parents-non-francophones-langue-maison-ecole-lecture',
    title: 'Parents non francophones : quelle langue parler à la maison, et comment préparer l’école ?',
    summary: 'Les pédiatres conseillent de parler à son enfant dans sa langue maternelle tout en lui offrant un bain de français ; voici comment s’y prendre et comment aborder la lecture.',
    category: 'education', tags: ['parents non francophones', 'langue maternelle', 'français à l’école', 'apprendre à lire', 'bilinguisme', 'crèche', 'langue d’origine', 'orthophoniste'],
    min_age_months: 0, max_age_months: 120,
    sources: [S.langues, S.ecritNonFrancophone, S.ameliPrevention],
    body_md: `## En bref
- Si vous maîtrisez mal le français, il est conseillé de parler à votre enfant **dans votre langue maternelle** : vous lui transmettez une langue riche et bien construite.
- Le français s’apprendra au contact des autres : **crèche, halte-garderie, école**, entourage. Plus ce contact est précoce et fréquent, mieux c’est.
- Un enfant né en France ou immergé dans le français avant 5-6 ans n’a pas, selon mpedia, plus de difficulté qu’un autre pour apprendre à lire et à écrire.
- Pour l’écrit de la langue familiale, les experts conseillent d’**attendre environ 2 ans** après l’apprentissage de la lecture en français.

## Comprendre
Apprendre à lire, vers 6 ans, suppose de bien maîtriser l’oral : connaître les mots et percevoir les sons qui les composent. C’est la base qui permet ensuite d’associer sons et lettres. Les pédiatres de mpedia expliquent que les parents gagnent à parler la langue qu’ils maîtrisent le mieux : une langue s’acquiert mieux auprès de quelqu’un qui la parle bien.

Le français reste essentiel en France. Les structures d’accueil collectif, comme les crèches ou les lieux d’accueil enfants-parents, offrent une immersion naturelle très bénéfique. Ameli rappelle qu’à l’école, l’enseignant aide les enfants de langue étrangère à progresser en vocabulaire et en syntaxe, notamment en les faisant parler avec leurs camarades.

Certaines situations rendent l’apprentissage de l’écrit plus difficile : arriver à l’école au moment de la lecture sans parler correctement le français, venir d’un pays à écriture non alphabétique sans avoir été scolarisé en France, ou entendre au quotidien un mélange constant des deux langues, qui empêche l’enfant de se construire des repères précis.

## Au quotidien
**À la maison**
- Parlez à votre enfant dans votre langue, avec des phrases complètes : racontez, chantez, nommez les choses.
- Proposez des **livres dans les deux langues** : l’enfant se construit des repères dans les deux cultures sans avoir à choisir.
- Évitez de mélanger les langues dans une même phrase.

**Autour de la maison**
- Inscrivez votre enfant, si possible, dans un lieu d’accueil collectif ou à des activités où l’on parle français.
- Fréquentez la bibliothèque, le parc, les lieux d’accueil enfants-parents, pour multiplier les échanges en français.

**Avant et pendant l’école**
- Parlez avec l’enseignant de la langue utilisée à la maison : c’est une information utile, pas un défaut.
- Pour l’apprentissage de l’écrit de votre langue, les experts cités par mpedia recommandent de le différer d’environ deux ans, une fois la lecture et l’écriture du français bien installées, surtout si les deux langues sont très éloignées.

## Questions fréquentes
**Faut-il que je parle français à mon enfant pour l’aider à l’école ?**
Si vous maîtrisez mal le français, mpedia conseille plutôt votre langue maternelle. Un français approximatif risque de transmettre des erreurs, notamment de prononciation.

**Mon enfant arrive en France à 5 ans. Combien de temps pour parler français ?**
Mpedia indique que les enfants arrivant à l’école mettent souvent 6 à 12 mois à comprendre et à parler le français. L’apprentissage de la lecture peut alors demander plus de temps.

**Ses difficultés viennent-elles forcément de la langue ?**
Non. Mpedia souligne que les difficultés de ces enfants sont souvent attribuées à la langue ou à la culture, alors qu’elles peuvent avoir une autre origine, ce qui retarde leur prise en charge.

**L’orthographe sera-t-elle plus difficile ?**
Selon mpedia, ces enfants rencontrent les mêmes difficultés d’orthographe que les autres ; la rédaction de récits peut demander plus de vocabulaire.

## Quand demander conseil
En cas de difficulté persistante à l’oral ou à l’écrit, consultez le médecin de votre enfant : il pourra orienter vers un orthophoniste pour un bilan. N’hésitez pas à demander un interprète ou un accompagnement à la PMI ou à l’école. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'age-des-pourquoi-repondre-curiosite-enfant',
    title: 'L’âge des « pourquoi ? » : comment répondre à la curiosité de son enfant',
    summary: 'Vers 3 ans, les questions fusent ; voici comment y répondre simplement, l’aider à chercher lui-même et faire de ces « pourquoi » des occasions de langage.',
    category: 'developpement', tags: ['pourquoi', 'questions enfant', 'curiosité', 'âge des pourquoi', 'langage', 'livres', 'cause et effet', 'répondre aux questions'],
    min_age_months: 30, max_age_months: 84,
    sources: [S.pourquoi, S.dev34, S.croyances],
    body_md: `## En bref
- Vers 3 ans, l’enfant comprend les questions formulées avec « pourquoi » et veut connaître le nom et la raison des choses.
- Ces questions nourrissent son **langage** et sa compréhension des liens de cause à effet.
- Répondez **simplement**, sans en dire plus que ce qu’il demande ; et retournez parfois la question : « Et toi, qu’en penses-tu ? »
- Les livres, surtout les albums sans texte, sont d’excellents supports pour jouer aux « pourquoi ».

## Comprendre
L’enfant comprend beaucoup d’expressions bien avant de savoir les dire, rappelle mpedia. Vers 2 ans, sa production rejoint peu à peu sa compréhension. Vers 3 ans, il saisit des notions plus complexes : les phrases simples, la différence entre « pareil » et « différent », et les questions en « pourquoi ».

Entre 3 et 4 ans, explique le pédiatre Jacques Langue, son vocabulaire s’enrichit, il veut connaître le nom des choses et pose beaucoup de questions, dont le fameux « pourquoi ? ». C’est le signe d’une curiosité qui s’éveille et d’une pensée qui cherche à relier les événements entre eux.

Plus tard, vers 5-7 ans, ses questions deviennent plus fines : il s’interroge sur ce qui est possible ou non. La psychologue Cécilie Rondan (mpedia) suggère, face à certaines questions, de prolonger son raisonnement plutôt que de trancher : « Qu’est-ce qui te fait penser que… ? »

## Au quotidien
**Répondre sans s’épuiser**
- Une réponse courte et vraie suffit souvent : « Il pleut parce que les nuages sont pleins d’eau. »
- S’il enchaîne les « pourquoi », retournez la question : « À ton avis ? » Il adore souvent formuler ses propres hypothèses.
- Vous ne savez pas ? Dites-le, et proposez de chercher ensemble dans un livre ou auprès de quelqu’un.
- Quand vous n’êtes pas disponible, promettez d’en reparler plus tard… et tenez parole.

**Jouer aux « pourquoi » avec les livres**
- Feuilletez un album, de préférence sans texte, et demandez : « Pourquoi il est triste, à ton avis ? », « Pourquoi elle court ? »
- S’il ne répond pas, répondez à sa place : il assimile peu à peu. Reposez les mêmes questions une autre fois pour voir ce qu’il a retenu.

**Au fil de la journée**
- Expliquez ce que vous faites : « Je mets un manteau parce qu’il fait froid. »
- Observez ensemble : pourquoi l’eau bout, pourquoi les feuilles tombent, pourquoi le chat ronronne.

**Les questions délicates**
- La mort, la naissance, les différences : répondez avec des mots simples, au fur et à mesure de ses questions, sans tout dire d’un coup.

## Questions fréquentes
**Mon enfant pose sans cesse la même question. Pourquoi ?**
Répéter l’aide à vérifier qu’il a bien compris et que la réponse ne change pas. Ce besoin de certitude est rassurant pour lui.

**Faut-il toujours répondre ?**
Pas forcément tout de suite, ni dans le détail. L’important est de montrer que ses questions sont bienvenues.

**Il ne pose presque pas de questions. Est-ce inquiétant ?**
Chaque enfant a son style. Observez s’il comprend ce qu’on lui dit et s’il s’exprime à sa façon. En cas de doute sur le langage ou la communication, parlez-en au médecin.

**Comment répondre quand il me demande si le père Noël existe ?**
Mpedia conseille de ne pas trancher par un simple oui ou non, mais de l’interroger sur ce qu’il pense, pour qu’il trouve lui-même ses réponses.

## Quand demander conseil
Parlez-en au médecin si, vers 3 ans, votre enfant semble ne pas comprendre les questions simples, ne fait pas de phrases ou a peu d’échanges avec vous ; ou si une question l’angoisse durablement (peur de la mort, de la maladie). ${AIDE}

${FIN}`,
  }),
  // ------------------------------------------------------------ autonomie
  a({
    slug: 's-habiller-seul-2-6-ans-etapes-astuces',
    title: 'S’habiller tout seul : les étapes de 2 à 6 ans et comment l’aider',
    summary: 'Se déshabiller vers 2 ans, s’habiller vers 3-4 ans, lacer ses chaussures vers 6 ans : les repères, et des astuces pour encourager l’autonomie sans transformer chaque matin en course.',
    category: 'education', tags: ['s’habiller seul', 'autonomie', 'habillage', 'lacets', 'moi tout seul', 'boutons', 'vêtements enfant', 'matin'],
    min_age_months: 24, max_age_months: 84,
    sources: [S.autonomie, S.dev34, S.matin],
    body_md: `## En bref
- Repères donnés par mpedia : **vers 2 ans**, l’enfant sait se déshabiller ; **entre 3 et 4 ans**, il sait s’habiller ; **vers 5 ans**, c’est en principe acquis ; **vers 6 ans**, il peut apprendre à lacer ses chaussures.
- Entre 3 et 4 ans, il veut « faire tout seul », même s’il n’y arrive pas encore très bien : c’est une étape de l’affirmation de soi.
- Le parent accompagne **par étapes** : il fait, puis aide, puis vérifie les finitions, puis se contente d’être présent.
- Chaque enfant avance **à son rythme** : la réussite d’un aîné n’est pas une référence pour le cadet.

## Comprendre
Pour la psychologue Cécilie Rondan (mpedia), faire seul nourrit le sentiment « je suis capable », important pour l’estime de soi. Faire à la place de l’enfant est souvent plus rapide, mais l’apprentissage demande du temps et de la confiance. Le parent sert aussi de modèle : l’enfant imite ce qu’il voit.

Entre 3 et 4 ans, explique le pédiatre Jacques Langue, l’enfant veut prendre les choses en main. Quand on l’en empêche, il peut bouder ou se mettre en colère. Il s’agit de poser des règles tout en lui laissant un espace d’essai : le laisser tenter ce qui n’est pas dangereux, même si cela paraît au-dessus de ses capacités, l’encourager, le féliciter.

## Au quotidien
**Faciliter la tâche**
- Des vêtements simples : pantalons à taille élastique, grands boutons, fermetures éclair, chaussures à scratch avant les lacets.
- Préparer les vêtements la veille, posés dans l’ordre où on les enfile.
- Un repère pour le devant et le derrière (l’étiquette, un dessin).
- Un petit tabouret pour s’asseoir et enfiler chaussettes et chaussures.

**Laisser faire, un peu à la fois**
- Commencez par la dernière étape : vous enfilez le pull jusqu’aux épaules, il passe la tête et les bras. Il termine, il réussit.
- Puis laissez-lui une étape de plus chaque semaine.
- Proposez des choix limités : « Le pull rouge ou le bleu ? » Il se sent acteur, vous gardez la main sur l’essentiel.

**Le matin, quand le temps manque**
- Se préparer soi-même avant l’enfant pour être disponible.
- Habiller l’enfant dans une pièce sans jouets pour limiter les distractions.
- Féliciter chaque vêtement enfilé.
- S’il ne sait pas encore ou s’il est trop distrait, vous pouvez l’habiller en discutant de sa journée.
- Gardez l’entraînement pour le week-end, quand rien ne presse.

**Accepter l’imparfait**
- Un pull à l’envers ou des couleurs mélangées, ce n’est pas grave tant que la tenue est adaptée à la météo. Choisissez vos combats : la sécurité et le confort d’abord.

## Questions fréquentes
**Mon enfant de 4 ans ne veut pas s’habiller seul alors qu’il sait le faire. Pourquoi ?**
Mpedia évoque deux pistes : il cherche peut-être l’attention de ses parents, ou on ne le laisse pas assez faire. Un moment privilégié à un autre moment de la journée peut l’aider.

**Faut-il le laisser choisir ses vêtements ?**
Laisser décider sur les détails (la couleur, le motif) et ne contraindre que pour l’essentiel est une piste proposée par mpedia pour éviter les conflits.

**Il met ses chaussures à l’envers. Je corrige ?**
Montrez-lui un repère simple (deux gommettes qui se touchent quand les chaussures sont dans le bon sens), plutôt que de corriger à sa place.

## Quand demander conseil
Parlez-en au médecin si votre enfant a des difficultés marquées et durables de gestes fins (boutons, fermetures) par rapport aux enfants de son âge, s’il semble très maladroit ou si l’école vous signale une difficulté. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'autonomie-6-11-ans-ecole-seul-rester-seul-sac',
    title: 'Aller à l’école seul, rester seul, préparer son sac : l’autonomie de 6 à 11 ans',
    summary: 'Repères pour accompagner l’autonomie de l’enfant d’âge primaire : trajet de l’école, moments seul à la maison, devoirs, rangement, et premières questions sur le téléphone.',
    category: 'education', tags: ['autonomie enfant', 'aller à l’école seul', 'rester seul à la maison', 'cartable', 'devoirs', 'ranger sa chambre', 'téléphone portable', 'pédibus'],
    min_age_months: 72, max_age_months: 144,
    sources: [S.autonomie, S.veo],
    body_md: `## En bref
- Entre 6 et 11 ans, l’enfant veut faire seul : s’habiller, aller à l’école, préparer son sac, parfois rester à la maison.
- **Avant 7 ans**, rentrer seul de l’école pose des problèmes de sécurité ; tout dépend ensuite de l’environnement (distance, circulation, ville ou village).
- Évitez de lui confier la responsabilité d’enfants plus jeunes **avant 7 ans environ**.
- Pour rester seul, il doit connaître **la durée de votre absence** et **les règles de sécurité** essentielles.

## Comprendre
La psychologue Cécilie Rondan (mpedia) rappelle que l’autonomie se prépare : surmonter ses propres craintes de parent, ne pas faire à la place de l’enfant, connaître ses capacités réelles, poser un cadre tout en laissant de la liberté. Si un enfant ne fait pas seul ce qu’il pourrait faire, c’est parfois qu’il cherche l’attention de ses parents, ou qu’on ne le laisse pas faire.

L’accompagnement se fait par étapes : on fait pour lui, puis on l’aide, puis on l’assiste pour les finitions, et enfin on est simplement présent. Ce sentiment de capacité nourrit son estime de soi.

## Au quotidien
**Le trajet de l’école**
- Faites le trajet ensemble plusieurs fois en le laissant guider : où traverser, où attendre, quoi faire en cas de souci.
- Avancez par étapes : le retrouver à mi-chemin, partir avec un camarade. Le pédibus existe dans certaines villes.
- Adaptez-vous à l’environnement plutôt qu’à un âge fixe.

**Rester seul à la maison**
- Les premières fois, absences courtes et annoncées : « Je reviens dans 15 minutes. »
- Règles claires : porte fermée à clé, ne pas ouvrir, qui appeler. Affichez les numéros utiles, dont le **15** et le **112**.
- Tenez compte de ses peurs : s’il hésite, ne forcez pas.

**Le cartable et les devoirs**
- Vers la fin du primaire, il peut préparer son sac et faire ses devoirs seul ; vous pouvez continuer à vous y intéresser et l’aider à planifier le lendemain.
- S’il demande de l’aide, apportez-la sans faire à sa place.
- Mpedia propose un lieu calme et toujours le même, une pause d’au moins 30 minutes sans écran après l’école, et des durées adaptées : environ 15 minutes de concentration à 6 ans, environ 40 minutes à 11 ans.

**Le rangement**
- Dès le primaire, l’enfant doit apprendre à gérer ses affaires : ranger à la maison l’aide à s’organiser en classe.
- Demandez-vous pourquoi vous exigez le rangement à ce moment-là. Pour une construction en cours, laissez-la en place si possible : ranger au mauvais moment frustre l’enfant.
- Montrez l’exemple.

**Le téléphone**
- Avant 12 ans, la demande reste en général modérée ; elle augmente fortement à l’entrée au collège. Si vous en donnez un, surveillez le temps et l’usage, éloignez-le pendant les devoirs et le soir.

## Questions fréquentes
**À quel âge peut-il aller seul à l’école ?**
Il n’y a pas d’âge unique. Mpedia indique qu’avant 7 ans cela pose des problèmes de sécurité, puis que tout dépend du trajet et de la maturité de l’enfant.

**Son grand frère le faisait à 8 ans, pourquoi pas lui ?**
Chaque enfant évolue à son rythme : la réussite précoce d’un aîné ne doit pas servir de référence.

**Faut-il l’aider pour ses devoirs ?**
Aider sans faire à sa place est la bonne mesure, et le rassurer s’il demande de l’aide.

## Quand demander conseil
Parlez-en au médecin ou à l’enseignant si votre enfant a très peur de se séparer de vous, refuse l’école, ou semble en difficulté pour s’organiser malgré l’accompagnement. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'matins-difficiles-ecole-preparer-sans-cris',
    title: 'Matins difficiles avant l’école : se préparer sans cris',
    summary: 'L’enfant traîne, joue, refuse de s’habiller : des pistes concrètes pour des matins plus sereins, et comment repérer un malaise derrière le refus.',
    category: 'education', tags: ['matin école', 'enfant traîne', 'retard école', 'routine du matin', 'petit-déjeuner', 's’habiller', 'cris', 'refus école'],
    min_age_months: 30, max_age_months: 132,
    sources: [S.matin, S.veo, S.ameliPrevention],
    body_md: `## En bref
- Un enfant n’est pas forcément « du matin » : il a besoin de **temps pour se réveiller**.
- Avancer un peu l’heure du réveil et **préparer les affaires la veille** détend toute la famille.
- Se préparer **avant** de réveiller l’enfant permet d’être disponible pour l’accompagner.
- Si le refus persiste, il peut cacher un **malaise à l’école** : ouvrez la discussion.

## Comprendre
Pour la pédiatre Catherine Salinier (mpedia), l’enfant qui traîne, tourne en rond ou veut jouer au lieu de s’habiller n’est pas forcément « de mauvaise volonté » : comme beaucoup d’adultes, il a besoin d’un temps de transition entre le sommeil et l’action. Un enfant curieux se laisse aussi très vite distraire par un jouet, un livre, le chat.

Les pédiatres de mpedia, dans leur campagne sur les violences éducatives ordinaires, conseillent de rester calme aux côtés de l’enfant pendant sa préparation, au moins jusqu’à 7-8 ans. Crier fait souvent monter la tension sans faire gagner de temps.

## Au quotidien
**La veille**
- Préparez avec lui ses vêtements et son cartable.
- Couchez-le à une heure qui lui permet un sommeil suffisant : un enfant reposé se prépare plus facilement.

**Le matin**
- **Levez-vous un peu avant lui** et soyez prêt quand il se réveille.
- **Réveillez-le en douceur**, en lui laissant quelques minutes pour émerger.
- **Prenez le petit-déjeuner ensemble** si possible : un réveil chaleureux, et un repas important de la journée.
- **Habillez-vous dans une pièce sans jouets** (la salle de bains, par exemple).
- **Valorisez chaque effort** : « Bravo, tes chaussettes sont mises ! »
- **Transformez la contrainte en jeu** : faire parler la chaussure, chanter, « le premier qui a mis son manteau… ».
- **Annoncez les étapes** : « Après les dents, on met les chaussures, puis on part. »

**Un support visuel**
- Une affiche en images des étapes du matin (toilette, habits, petit-déjeuner, dents, manteau) que l’enfant suit lui-même. Il peut cocher chaque étape.

**Choisir ses combats**
- Laissez-le décider des détails (la couleur du bol, le pull) et restez ferme sur l’essentiel (être habillé chaudement, partir à l’heure).

## Questions fréquentes
**Il refuse de s’habiller chaque matin. Que faire ?**
S’il ne sait pas encore bien s’habiller ou est très distrait, vous pouvez l’habiller en lui parlant de sa journée, de ses copains. L’entraînement à l’autonomie peut se faire le week-end.

**Et si je crie quand même ?**
Cela arrive à beaucoup de parents. Quand la pression monte, isolez-vous un instant, respirez, puis revenez. Vous pourrez en reparler avec lui au calme.

**Le refus peut-il venir de l’école ?**
Oui. L’enfant n’aime peut-être pas l’école en ce moment. Demandez-lui s’il est content de retrouver son enseignant et ses camarades, écoutez sans juger et rassurez-le.

**Les écrans le matin, est-ce une solution pour gagner du temps ?**
Ameli signale qu’une exposition aux écrans le matin avant l’école, sans en parler avec ses parents, est associée à davantage de troubles du langage. Mieux vaut les éviter.

## Quand demander conseil
Parlez-en à l’enseignant et au médecin si votre enfant refuse durablement l’école, se plaint souvent de maux de ventre ou de tête le matin, dort mal ou semble triste. ${AIDE}

${FIN}`,
  }),
  // ------------------------------------------------------------ vie sociale
  a({
    slug: 'politesse-bonjour-merci-bisou-sans-forcer',
    title: 'Bonjour, merci, s’il te plaît : transmettre la politesse sans forcer les bisous',
    summary: 'La politesse fait partie des règles non négociables, mais elle s’apprend surtout par l’exemple ; et un enfant peut dire bonjour sans être obligé de faire un bisou.',
    category: 'education', tags: ['politesse', 'dire bonjour', 'merci', 's’il te plaît', 'bisou forcé', 'consentement enfant', 'savoir-vivre', 'règles de vie'],
    min_age_months: 24, max_age_months: 120,
    sources: [S.affirmation, S.veo, S.evar],
    body_md: `## En bref
- Pour les pédiatres de mpedia, la **politesse** fait partie des principes sur lesquels rester ferme, avec la sécurité, l’hygiène et le respect d’autrui.
- Elle s’apprend d’abord **par l’exemple** : un enfant fait comme il voit faire.
- Refuser de dire bonjour est un grand classique de l’âge de l’opposition ; inutile d’en faire un bras de fer.
- Dire bonjour ne veut pas dire faire un bisou : l’Éducation nationale rappelle que **personne ne doit obliger un enfant à faire un bisou ou un câlin** s’il n’en a pas envie.

## Comprendre
Entre 1 et 3 ans, explique la pédiatre Laurence Racle (mpedia), l’enfant teste l’autorité à chaque occasion : refuser de dire bonjour, de venir à table ou de mettre son manteau en fait partie. Ce n’est pas forcément un manque d’éducation, mais une manière de s’affirmer. L’enjeu est de garder le cap sur l’essentiel sans transformer chaque rencontre en conflit.

La campagne de mpedia sur les violences éducatives ordinaires donne un exemple : face à un enfant qui ne dit pas bonjour, le parent peut dire lui-même, joyeusement, « Bonjour Madame ! » plutôt que de hausser le ton. L’enfant entend le modèle, sans humiliation.

Le livret d’éducation à la vie affective et relationnelle de l’Éducation nationale rappelle que le bisou de salutation est une construction culturelle. On peut dire bonjour de bien des façons : un mot, un signe de la main, un sourire. Apprendre à l’enfant que son « non » au contact physique est respecté l’aide à se protéger, et à respecter à son tour le refus des autres.

## Au quotidien
**Montrer l’exemple**
- Dites bonjour, merci et s’il vous plaît à votre enfant et devant lui : au boulanger, au voisin, au chauffeur du bus.
- Remerciez-le quand il vous rend service.

**Rappeler sans humilier**
- Un rappel discret suffit souvent : « Qu’est-ce qu’on dit ? » ou un regard complice.
- S’il refuse, dites bonjour pour vous deux et passez à autre chose. Vous en reparlerez plus tard, au calme.
- Évitez les remarques devant d’autres personnes, qui renforcent le blocage.

**Proposer d’autres façons de saluer**
- Un signe de la main, un « coucou », un « tope là », un sourire.
- Prévenez grands-parents et proches : « Il dira bonjour à sa façon ; il fera un câlin s’il en a envie. »

**Les mots magiques au quotidien**
- Jouez à la marchande ou à la dînette en utilisant « s’il vous plaît » et « merci ».
- Félicitez quand la formule vient spontanément.

## Questions fréquentes
**Mon enfant ne dit jamais bonjour à l’école ou chez des amis. Est-il mal élevé ?**
Pas nécessairement. La timidité ou l’opposition expliquent souvent ce refus. Continuez à montrer l’exemple, sans forcer.

**Grand-mère se vexe s’il ne fait pas de bisou. Comment faire ?**
Expliquez que vous apprenez à votre enfant qu’il peut choisir comment dire bonjour. Proposez une alternative chaleureuse (un dessin, un sourire, un signe de la main).

**Faut-il le punir s’il est impoli ?**
Mieux vaut rappeler la règle, montrer l’exemple, et féliciter les progrès. Si une parole blessante est dite, il peut réparer en s’excusant une fois calmé.

**À quel âge peut-on attendre la politesse ?**
Elle s’installe progressivement avec le langage et la vie en groupe ; à l’école, l’enfant apprend aussi les règles de la vie collective.

## Quand demander conseil
Parlez-en au médecin si votre enfant semble très inhibé avec les autres, s’isole, ou si un refus de contact physique s’accompagne d’une peur inhabituelle d’une personne. Un enfant doit pouvoir dire à un adulte de confiance si quelqu’un le touche d’une façon qui le gêne. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'partager-ses-jouets-attendre-son-tour-tout-petit',
    title: 'Partager ses jouets, attendre son tour : pourquoi c’est si difficile avant 4 ans',
    summary: 'Le partage s’apprend lentement : le petit enfant voit le monde à partir de ses envies ; voici comment l’accompagner sans forcer, à la maison, au square et entre frères et sœurs.',
    category: 'education', tags: ['partager', 'prêter ses jouets', 'attendre son tour', 'square', 'copains', 'empathie', 'disputes jouets', 'jeux de société'],
    min_age_months: 18, max_age_months: 72,
    sources: [S.dev34, S.jalousie, S.solitaire],
    body_md: `## En bref
- Entre 3 et 4 ans, l’enfant commence à jouer avec d’autres, mais il a **encore du mal à partager et à attendre son tour**.
- C’est aussi l’âge où se développe **l’empathie** : il devient plus sensible à ce que ressentent les autres.
- Forcer le partage marche rarement ; mieux vaut **organiser les tours**, mettre des mots sur les émotions et montrer l’exemple.
- Les règles de la vie en groupe (politesse, respect des affaires des autres, partage) s’apprennent progressivement, à la maison et à l’école.

## Comprendre
Le jeune enfant perçoit le monde à partir de ses propres désirs, rappelle le pédopsychiatre Daniel Marcelli (mpedia) : il a du mal à comprendre les besoins des autres. Voir un camarade avec « son » jouet, ou avec un meilleur jouet que le sien, peut déclencher frustration et jalousie.

Entre 3 et 4 ans, explique le pédiatre Jacques Langue, l’enfant commence à jouer réellement avec d’autres enfants, mais partager et attendre restent difficiles. En parallèle, il développe l’empathie, ce qui ouvre la voie au partage. Pour la pédopsychiatre Sarah Bydlowski, avoir des copains apprend à communiquer, à écouter, à attendre son tour et à respecter les autres.

## Au quotidien
**Avant de jouer**
- Chez vous, rangez à l’avance le jouet « trop précieux » que votre enfant ne veut pas prêter : il se sentira plus disposé à partager le reste.
- Prévoyez plusieurs jouets semblables quand un copain vient.

**Pendant le jeu**
- **Organisez les tours** : « Toi d’abord deux minutes, puis Léo. » Un sablier ou une chanson matérialisent le temps.
- **Mettez des mots** : « Tu as envie de garder la pelle. Léo aussi aimerait l’essayer. »
- **Proposez un échange** plutôt qu’un abandon : « Tu lui prêtes le camion et tu prends le seau ? »
- **Valorisez** chaque geste de partage.

**Quand ça dérape**
- Rappelez les règles de base : pas de coups, pas de morsures, pas d’insultes.
- Séparez calmement si besoin, puis proposez une autre activité.
- Entre frères et sœurs, mpedia conseille, tant que ces règles sont respectées, de laisser souvent les enfants régler eux-mêmes leurs conflits : cela les aide à affirmer leur place.

**Jouer ensemble à des jeux à règles**
- Entre 3 et 6 ans, les jeux de société simples à plusieurs (dominos, jeux de cartes, petits chevaux) apprennent à attendre son tour, à suivre une règle et à accepter de perdre.

## Questions fréquentes
**Faut-il obliger mon enfant à prêter son doudou ?**
Non. Le doudou est un objet de réconfort très personnel. Distinguez les objets « à lui seul » des jouets à partager.

**Au square, un enfant lui arrache sa pelle. Je dois intervenir ?**
Si aucun ne se fait mal, laissez-leur un moment pour trouver une solution, puis aidez-les avec des mots si besoin. Intervenez immédiatement en cas de geste violent.

**Il ne veut jamais partager. Est-il égoïste ?**
Avant 4 ans, il s’agit surtout d’une étape du développement. Évitez les étiquettes, qui risquent de l’enfermer dans un rôle.

**Comment lui apprendre à attendre ?**
Par petites doses : annoncer le temps (« après cette chanson »), occuper l’attente, et féliciter quand il a réussi à patienter.

## Quand demander conseil
Parlez-en au médecin si votre enfant ne cherche jamais le contact avec les autres enfants, semble ne pas comprendre leurs émotions, ou si les conflits deviennent très violents et répétés après 4 ans. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'enfant-qui-mord-tape-pousse-reagir',
    title: 'Mon enfant mord, tape ou pousse : comment réagir ?',
    summary: 'Avant 3 ans, mordre et taper sont souvent la façon d’exprimer frustration et colère faute de mots ; voici comment réagir fermement et calmement, et quand l’agressivité doit alerter.',
    category: 'education', tags: ['enfant qui mord', 'enfant qui tape', 'morsure crèche', 'agressivité', 'pousser', 'violence enfant', 'frustration', 'colère tout-petit'],
    min_age_months: 12, max_age_months: 72,
    sources: [S.agressivite, S.affirmation],
    body_md: `## En bref
- **Avant 2 ans**, l’agressivité prend souvent la forme de coups : l’enfant n’a pas encore les mots, ses impulsions dominent.
- **Après 3 ans**, l’agressivité physique recule en général au profit de l’agressivité verbale.
- Une morsure ou un coup ne doit pas être dramatisé, mais il faut **réagir et expliquer**, fermement et calmement.
- Une agressivité qui **persiste après 3 ans** peut traduire une souffrance à comprendre.

## Comprendre
Pour le pédopsychiatre Daniel Marcelli (mpedia), une certaine agressivité fait partie du développement. Le tout-petit qui mord, tape, griffe ou bouscule exprime souvent une frustration, une colère ou une envie qu’il ne sait pas encore dire. Vers 2 ans, il affirme son autonomie en disant « non » ; après 3 ans, il découvre qu’il peut négocier ou menacer avec des mots.

La pédiatre Laurence Racle (mpedia) décrit cette période de 1 à 3 ans comme celle de l’affirmation de soi : humeur instable, enfant grincheux, boudeur, parfois agressif envers d’autres enfants. Il expérimente différentes façons d’exprimer ses émotions et son désaccord.

Certaines situations peuvent entretenir l’agressivité : se sentir rejeté ou moins regardé (par exemple à l’arrivée d’un bébé), manquer de confiance en soi, vivre dans un climat familial tendu, ou constater que les adultes cèdent quand il devient agressif.

## Au quotidien
**Sur le moment**
1. **Protégez** l’enfant mordu ou frappé, et occupez-vous de lui en premier.
2. **Arrêtez le geste** : tenez doucement la main qui tape, éloignez l’enfant qui mord.
3. **Dites non, calmement et fermement** : « Je ne te laisse pas mordre. Mordre fait mal. »
4. **Mettez des mots** sur ce qui s’est passé : « Tu voulais le camion et tu étais en colère. »
5. **Proposez une autre façon de faire** : dire « non », « à moi », venir chercher un adulte, taper dans un coussin.

**À distance de la crise**
- Jouez des scènes avec des peluches : « Le lapin est fâché, qu’est-ce qu’il peut faire au lieu de taper ? »
- Posez des questions pour l’aider à comprendre ce que ressent l’autre.
- Proposez des activités qui canalisent l’énergie : courir dehors, danser, jeux de ballon.
- Valorisez les moments où il a réussi à se retenir, plus souvent que vous ne sanctionnez.

**Votre attitude**
- Restez un modèle : gardez votre calme pendant les conflits.
- Ne mordez pas ou ne tapez pas l’enfant « pour lui montrer que ça fait mal » : le geste violent lui enseigne l’inverse de ce que vous voulez transmettre.
- Rappelez que les règles valent pour tout le monde, y compris les adultes.

## Questions fréquentes
**La crèche me dit que mon enfant mord. Que faire ?**
Échangez avec l’équipe pour comprendre dans quelles situations cela arrive (fatigue, foule, attente, jouet convoité) et adopter les mêmes mots à la maison et à la crèche.

**Il se tape lui-même ou se cogne la tête quand il est contrarié. Est-ce grave ?**
Mpedia indique que ne pas réagir excessivement suffit parfois à faire cesser ce comportement, tout en cherchant ce qui le provoque. Parlez-en au médecin si cela se répète ou s’il se blesse.

**Il tape le bébé. Comment protéger les deux ?**
Ne laissez pas le bébé seul avec l’aîné, intervenez fermement, et accordez du temps exclusif à l’aîné : la jalousie peut alimenter ces gestes.

## Quand demander conseil
Mpedia conseille de consulter si le comportement est récurrent et que l’enfant ne parvient pas à maîtriser ses émotions ni ses colères, surtout après 3 ans, ou s’il se blesse. Un professionnel peut aussi aider les parents à clarifier le cadre et à se déculpabiliser. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'phase-du-non-opposition-2-3-ans',
    title: 'La phase du « non » : comprendre l’opposition entre 18 mois et 3 ans',
    summary: 'Dire non est une étape importante de la construction de soi ; voici pourquoi elle survient, comment respecter ce « non » tout en posant vos propres limites, et des astuces pour éviter le bras de fer.',
    category: 'education', tags: ['phase du non', 'opposition', 'terrible two', 'enfant qui dit non', 'affirmation de soi', '2 ans', 'limites', 'négocier'],
    min_age_months: 18, max_age_months: 60,
    sources: [S.opposition, S.affirmation, S.veo],
    body_md: `## En bref
- Vers 8 mois, l’enfant découvre qu’il est une personne distincte de ses parents ; vers **18 mois**, il veut affirmer cette différence.
- Savoir dire non montre qu’il construit **sa propre identité** : ses « oui » deviendront des choix, pas de la soumission.
- Les phases d’opposition sont souvent marquées vers **2 ans et demi-3 ans**, puis vers 4 ans-4 ans et demi, et au début de l’adolescence.
- L’enjeu : **respecter son non** tout en lui apprenant à accepter le vôtre.

## Comprendre
Pour les pédiatres de mpedia, dire non est pour l’enfant une façon de tester son pouvoir et de se différencier. Une fois qu’il sait dire non, il pourra le faire toute sa vie face à quelqu’un qui cherche à s’imposer à lui. Le forcer systématiquement à obéir risque de l’empêcher de s’affirmer.

La pédiatre Laurence Racle décrit les manifestations de cette période : opposition par la voix, les gestes, le regard détourné, le corps qui se dérobe ; envie de tout faire seul ; besoin d’être remarqué ; franchissement des interdits ; humeur changeante. Ces comportements peuvent être éprouvants pour les parents, mais ils font partie de la construction de l’enfant.

Les limites restent essentielles : elles lui donnent les « règles du jeu » pour grandir en société. L’enfant doit aussi apprendre que son parent peut dire non.

## Au quotidien
**Éviter le bras de fer**
- **Proposez des choix** limités : « Tu mets tes bottes ou tes baskets ? » Il exerce son pouvoir, vous gardez l’objectif.
- **Détournez son attention** quand il s’obstine : une autre activité, un jeu, une chanson.
- **Transformez la contrainte en jeu** : faire parler le pyjama, faire la course jusqu’à la voiture.
- **Annoncez les transitions** : « Encore trois tours de toboggan, puis on rentre. » Puis « deux », puis « le dernier ».

**Tenir l’essentiel**
- Restez ferme sur les principes non négociables : sécurité, hygiène, politesse, respect d’autrui.
- Laissez-le décider sur les détails : la couleur du verre, le pull.
- Expliquez simplement les règles et les conséquences.
- Restez calme et évitez les discussions sans fin.

**Reconnaître son « non »**
- « J’entends que tu ne veux pas. Moi aussi je peux dire non : on met le manteau, il fait froid. »
- Faites-le réfléchir : « Qu’est-ce qui t’aiderait à venir ? » Il peut alors choisir de dire oui.

**Prendre soin de vous**
- Faites preuve de patience et d’indulgence, sans viser la perfection. Passez le relais quand vous sentez la colère monter.

## Questions fréquentes
**Il dit non à tout, même à ce qu’il aime. Pourquoi ?**
Le « non » est parfois automatique : il affirme qu’il existe. Reformulez la proposition autrement, ou laissez passer quelques minutes.

**Céder, est-ce le rendre capricieux ?**
Accepter son non sur un détail n’est pas céder. Sur l’essentiel, tenez bon avec calme : c’est son repère.

**Est-ce que cela s’arrête ?**
Cette phase évolue avec le langage : l’enfant apprend progressivement à négocier avec des mots et à trouver des compromis.

**Comment réagir quand il jette des objets ?**
Arrêtez le geste calmement, rappelez la règle, mettez l’objet hors de portée et proposez un jeu où lancer est permis (une balle en mousse, dehors).

## Quand demander conseil
Parlez-en au médecin si l’opposition est extrême et permanente, s’accompagne de colères très fréquentes et violentes, de troubles du sommeil ou de l’appétit, ou si vous vous sentez dépassé. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'crise-en-public-supermarche-reagir-sans-ceder',
    title: 'Crise au supermarché ou en public : réagir sans céder ni crier',
    summary: 'Cris, pleurs, roulade par terre devant les passants : pourquoi le jeune enfant fait ces « caprices », comment les prévenir, et comment réagir sur le moment et après.',
    category: 'education', tags: ['caprice', 'crise en public', 'supermarché', 'colère enfant', 'enfant se roule par terre', 'regard des autres', 'frustration', 'céder'],
    min_age_months: 18, max_age_months: 84,
    sources: [S.caprices, S.veo],
    body_md: `## En bref
- Le « caprice » est souvent la seule façon qu’a un jeune enfant d’exprimer son insatisfaction, sa frustration ou un mal-être.
- Les caprices sont les plus fréquents entre **1 an et demi et 2 ans-2 ans et demi**, puis diminuent avec le langage ; ils s’estompent en général vers **7 ans**.
- Sur le moment : **garder son calme**, ne pas céder, ne pas culpabiliser.
- **Après**, une fois le calme revenu, en reparler sereinement.

## Comprendre
Pour le pédopsychiatre Daniel Marcelli (mpedia), le mot « caprice » a une connotation négative, alors qu’il désigne souvent la seule manière pour l’enfant d’exprimer ce qu’il ressent, parfois violemment. Vers 1 an-1 an et demi, il commence à dire non. Il découvre qu’il n’est pas le centre du monde et que ses désirs ne sont pas toujours satisfaits tout de suite. Il ne sait pas encore analyser une situation ni gérer ses émotions : crier, pleurer ou se mettre en colère est alors son moyen d’expression, y compris quand il a peur ou est angoissé.

Céder apprend à l’enfant que crier permet d’obtenir ce qu’il veut, et affaiblit l’autorité parentale. Ne pas céder ne fait pas de vous un parent trop sévère : c’est votre rôle de lui apprendre les règles de la vie en société. Mpedia reconnaît aussi la difficulté du regard des passants dans ces moments.

## Au quotidien
**Avant la sortie**
- **Annoncez le programme** : « On achète du pain, des pommes et du lait. On ne prend pas de bonbons aujourd’hui. »
- **Donnez-lui un rôle** : tenir la liste, choisir les pommes, poser les articles sur le tapis.
- **Choisissez le bon moment** : évitez les courses à l’heure de la sieste ou quand il a faim.
- **Proposez des choix** : « Tu choisis les pommes rouges ou vertes ? »

**Pendant la crise**
1. **Restez calme**, respirez. Crier ou brutaliser n’aide pas.
2. **Mettez-le en sécurité** : à l’écart des rayons, du passage, des chariots.
3. **Nommez son émotion** : « Tu es très en colère parce que tu voulais ce paquet. »
4. **Tenez la limite** : « Je comprends, et la réponse reste non. »
5. **Proposez un câlin qui contient**, sans céder. S’il refuse, ne forcez pas : restez près de lui le temps qu’il se calme.
6. **Oubliez le public** autant que possible : votre enfant a besoin de vous, pas des passants.

**Après la crise**
- Revenez sur ce qui s’est passé, au calme, avec des mots simples.
- Avant 3-4 ans, essayez de comprendre la cause : fatigue, faim, besoin d’attention.
- Vers 5-6 ans, aidez-le à dire ce qu’il ressentait.
- Félicitez-le quand une sortie se passe bien.

## Questions fréquentes
**Les gens me regardent comme un mauvais parent. Comment le vivre ?**
Ces crises arrivent à la plupart des familles. Concentrez-vous sur votre enfant ; ceux qui regardent sont souvent passés par là.

**Faut-il partir du magasin ?**
Si la situation devient intenable, oui : sortir au calme, le temps qu’il s’apaise, est une option. Ce n’est pas céder, c’est protéger tout le monde.

**Et si je finis par lui acheter le bonbon pour avoir la paix ?**
Cela arrive. La fois suivante, reprenez le cadre annoncé. Ce qui compte, c’est la cohérence dans la durée.

**Faut-il punir après une crise ?**
Mpedia conseille de ne jamais sanctionner sous le coup de la colère. Revenir sur la crise au calme est souvent plus utile.

## Quand demander conseil
Si les crises persistent au-delà de 6-7 ans, sont très fréquentes ou très violentes, ou si votre enfant semble anxieux ou malheureux, mpedia conseille d’en parler au pédiatre ou au médecin de famille. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'recompenses-tableau-de-motivation-utiliser-bien',
    title: 'Récompenses et tableau de motivation : comment bien les utiliser',
    summary: 'Un tableau de règles et quelques récompenses peuvent aider l’enfant de 4-5 ans à prendre une habitude ; voici comment s’en servir sans tomber dans le chantage.',
    category: 'education', tags: ['récompense', 'tableau de motivation', 'gommettes', 'renforcement positif', 'règles maison', 'chantage', 'encouragements', 'félicitations'],
    min_age_months: 36, max_age_months: 120,
    sources: [S.regles, S.obeissance, S.affirmation],
    body_md: `## En bref
- L’enfant a besoin de **règles claires et précises** pour se sentir en sécurité ; vers 4-5 ans, il les accepte souvent plus facilement qu’à 3 ans.
- Un **support visuel** (règles dessinées, croix colorées) et une **récompense de la régularité** peuvent l’aider à progresser.
- Les récompenses aident ponctuellement ; utilisées comme chantage permanent (« si tu es sage, tu auras un cadeau »), elles affaiblissent l’autorité.
- Les **encouragements** et la valorisation des efforts restent le moteur principal.

## Comprendre
Mpedia propose un outil simple pour aider l’enfant à respecter une règle : l’écrire ou la dessiner avec lui, l’afficher, cocher chaque jour s’il l’a respectée, et le récompenser après plusieurs réussites. Ce « renforcement positif » favorise la maîtrise de soi et le sens des responsabilités, par exemple pour ranger ses jouets ou corriger un comportement difficile.

Le pédopsychiatre Daniel Marcelli (mpedia) met en garde contre l’excès : quand les parents obtiennent l’obéissance par la séduction (chantage affectif, promesses de cadeaux), ils exercent un pouvoir plutôt qu’une autorité. L’enfant risque alors de n’agir que pour la récompense. L’autorité, elle, guide et protège, et le parent donne l’exemple.

La pédiatre Laurence Racle (mpedia) ajoute un principe : respecter ses engagements, qu’il s’agisse d’une récompense ou d’une privation. Une promesse non tenue fait perdre confiance.

## Au quotidien
**Construire le tableau ensemble**
1. Choisissez **une ou deux règles** seulement, formulées positivement : « Je range mes jouets avant le bain », « Je reste assis à table pendant le repas ».
2. **Dessinez-les** avec l’enfant, avec des mots adaptés à son âge.
3. **Vérifiez qu’il a compris** : demandez-lui de reformuler.
4. Chaque jour, une croix ou une gommette quand la règle est respectée.
5. Après plusieurs réussites, **une récompense annoncée à l’avance**.

**Choisir de bonnes récompenses**
- Un moment partagé : une histoire de plus, un jeu de société avec papa ou maman, une sortie au parc.
- Un privilège simple : choisir le menu du dîner, inviter un copain.
- Évitez de faire de la nourriture sucrée ou des écrans la récompense habituelle.

**Faire évoluer**
- Quand l’habitude est prise, retirez progressivement le tableau : la réussite devient la récompense.
- Changez de règle plutôt que d’en accumuler.

**Encourager au quotidien**
- Félicitez l’effort plutôt que le résultat, sans féliciter en permanence.
- Préférez parfois « Tu es fier de toi ? » à « Je suis fier de toi » : l’enfant apprend à s’évaluer lui-même, une piste proposée par mpedia.

## Questions fréquentes
**Les récompenses rendent-elles l’enfant intéressé ?**
Utilisées ponctuellement, pour une habitude précise et sur une durée limitée, elles aident. Promettre un cadeau pour chaque demande, en revanche, transforme l’obéissance en marchandage.

**Faut-il des croix « rouges » quand il n’y arrive pas ?**
L’outil de mpedia prévoit une croix indiquant si la règle a été respectée ou non. Gardez un ton neutre : l’objectif est de progresser, pas d’humilier.

**Et pour un enfant de 2 ans ?**
À cet âge, les encouragements immédiats et les félicitations fonctionnent mieux qu’un tableau abstrait.

**Ça ne marche plus au bout de deux semaines. Pourquoi ?**
Les règles étaient peut-être trop nombreuses, la récompense trop lointaine, ou l’habitude déjà prise. Simplifiez, ou passez à autre chose.

## Quand demander conseil
Si, malgré un cadre clair et bienveillant, les comportements difficiles persistent, s’aggravent ou s’accompagnent de tristesse, d’agressivité ou de troubles du sommeil, parlez-en au médecin de votre enfant. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'j-ai-crie-sur-mon-enfant-a-bout-faire-autrement',
    title: 'J’ai crié sur mon enfant : comment faire autrement quand on est à bout',
    summary: 'Crier, menacer ou taper sous le coup de l’énervement arrive à beaucoup de parents ; voici ce que dit la loi, comment désamorcer la tension et réparer après.',
    category: 'sante-mentale', tags: ['crier sur son enfant', 'parent à bout', 'violences éducatives ordinaires', 'fessée', 'loi 2019', 'colère parent', 'réparer', 'éducation sans violence'],
    min_age_months: 12, max_age_months: 144,
    sources: [S.veo, S.obeissance, S.pleurs],
    body_md: `## En bref
- Les **violences éducatives ordinaires** regroupent les violences physiques (gifle, fessée, geste brusque) et psychologiques (insulte, moquerie, chantage).
- Depuis la loi de 2019, le Code civil précise que **l’autorité parentale s’exerce sans violences**.
- Élever un enfant sans jamais crier est difficile : dans une enquête de mpedia, 85 % des parents interrogés le jugent difficile.
- Quand la pression monte : **s’isoler un instant, respirer, revenir**. Et après un dérapage, **réparer** en parlant à l’enfant.

## Comprendre
Les pédiatres de mpedia rappellent que ces violences, souvent banalisées, peuvent peser sur le développement affectif et intellectuel de l’enfant. Elles ne disent rien de votre amour pour lui : elles surviennent souvent quand on est fatigué, pressé, débordé.

Le pédopsychiatre Daniel Marcelli (mpedia) insiste sur un point : une sanction ne doit jamais faire mal, ni physiquement ni moralement (humiliation). Il conseille de ne jamais sanctionner sous le coup de la colère. On peut annoncer que la punition sera décidée plus tard, puis s’y tenir, ou demander l’avis d’un tiers plus neutre.

La fatigue joue un rôle important. Le manque de sommeil augmente le risque d’épuisement, rappellent les pédiatres sur Santé.fr : savoir passer le relais n’est pas un échec.

## Au quotidien
**Quand vous sentez la colère monter**
1. **Mettez l’enfant en sécurité** (un tout-petit dans son lit, un plus grand dans une autre pièce).
2. **Éloignez-vous** quelques minutes : respirez, buvez un verre d’eau, regardez par la fenêtre.
3. **Revenez** quand vous êtes plus calme.
4. Si possible, **passez le relais** à l’autre parent ou à un proche.

**Prévenir les moments à risque**
- **Le matin** : préparer les affaires la veille, se préparer avant de réveiller l’enfant.
- **Le soir** : un « temps des retrouvailles » avant les tâches, pour que chacun décharge sa journée.
- **Les transitions** : annoncer à l’avance (« on part dans trois tours… deux… le dernier »).
- **Les maladresses** : dire « oups » plutôt que « bêtise », et proposer de réparer (nettoyer, ranger).
- **Choisir ses combats** : laisser décider sur les détails, rester ferme sur la sécurité et le respect.
- **Jouer** : chanter, faire parler les objets ; la contrainte partagée avec humour passe mieux.

**Après un dérapage**
- Revenez vers votre enfant : « J’ai crié très fort, je n’aurais pas dû. J’étais fatigué et en colère. Ce n’est pas ta faute. »
- Rappelez la règle qui était en jeu, calmement.
- Réfléchissez à ce qui a fait monter la pression, pour l’anticiper la prochaine fois.

## Questions fréquentes
**Une petite tape, est-ce vraiment interdit ?**
La loi de 2019 précise que l’autorité parentale s’exerce sans violences, y compris physiques. Il existe d’autres façons de poser une limite.

**J’ai honte d’avoir crié. Est-ce grave pour mon enfant ?**
Personne n’est parfait. Reconnaître votre erreur et réparer apprend à votre enfant que l’on peut se tromper et s’excuser.

**Comment faire quand je suis seul avec plusieurs enfants ?**
Simplifiez : moins d’activités, des repas plus simples, des routines visibles. Et cherchez du soutien : famille, amis, PMI, lieux d’accueil enfants-parents.

**Existe-t-il des ateliers pour les parents ?**
Oui, de nombreux parents en souhaitent. Renseignez-vous auprès de votre PMI, de votre caisse d’allocations familiales ou de votre mairie.

## Quand demander conseil
Parlez-en à votre médecin, à une sage-femme, à la PMI ou à un psychologue si vous vous sentez souvent à bout, si la colère vous fait peur, ou si les cris deviennent quotidiens. Ne restez pas seul. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'aine-regresse-apres-naissance-bebe',
    title: 'Depuis la naissance du bébé, l’aîné régresse : comment l’aider ?',
    summary: 'Pipi au lit, retour au biberon, nuits agitées : la régression de l’aîné après une naissance est fréquente et passe en général vite ; voici comment l’accompagner.',
    category: 'education', tags: ['régression aîné', 'jalousie bébé', 'pipi au lit', 'retour au biberon', 'grand frère', 'grande sœur', 'naissance', 'fratrie'],
    min_age_months: 18, max_age_months: 96, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.aine, S.vieFamille],
    body_md: `## En bref
- À l’arrivée d’un bébé, l’aîné peut se sentir inquiet, jaloux ou délaissé, et **régresser** : pipi au lit, sommeil perturbé, retour au biberon, « parler bébé ».
- Cette régression est **fréquente** et passe en général vite ; il ne faut ni s’alarmer ni gronder.
- Mpedia conseille de consulter le médecin **si elle dure plusieurs semaines**.
- Ce qui aide le plus : **du temps rien qu’à lui**, des mots sur ses émotions, et des petites responsabilités valorisantes.

## Comprendre
L’arrivée d’un bébé fait perdre à l’aîné sa place de centre de l’attention. La jalousie est compréhensible, sans être inévitable, expliquent les pédiatres de mpedia. La régression peut même être vue comme une façon de revivre les étapes de sa propre petite enfance, en observant tout ce que l’on fait pour le bébé.

Santé publique France, sur le site 1000 premiers jours, rappelle que chacun a besoin de temps pour trouver sa place dans la nouvelle famille. Rassurer l’aîné sur l’amour qu’on lui porte, lui raconter sa propre naissance, lui montrer que ce que l’on fait pour le bébé, on l’a fait aussi pour lui : ces gestes simples l’aident à se sentir toujours aimé.

## Au quotidien
**Accueillir la régression**
- S’il réclame un biberon ou veut être porté « comme le bébé », vous pouvez accepter parfois, avec humour et tendresse, sans en faire une règle.
- S’il refait pipi au lit, changez les draps sans reproche. Mpedia note que cela passe généralement vite.
- Gardez ses repères : rituel du coucher, horaires, activités habituelles.

**Lui garder une place**
- Pendant que vous nourrissez le bébé, invitez-le à se blottir contre vous et racontez-lui qu’il a vécu les mêmes moments.
- Regardez ensemble ses photos et vidéos de bébé.
- Prévoyez régulièrement un **moment seul avec lui**, en confiant le bébé à l’autre parent ou à un proche.
- Veillez à ce que la famille et les amis s’intéressent aussi à lui, pas seulement au bébé.

**Le valoriser**
- Confiez-lui de petites tâches : apporter un jouet, aider au change, parler au bébé, le tenir assis sous surveillance.
- Félicitez-le quand il aide, mais aussi pour ce qu’il fait sans lien avec le bébé.

**Mettre des mots**
- « Ça t’agace quand le bébé pleure, hein ? » Il se sent compris, sans culpabiliser.
- Protégez les deux enfants et apprenez à l’aîné à respecter l’espace du bébé, et inversement quand le petit commencera à ramper.

**Petites attentions**
- Un cadeau « de la part du bébé », un « sac de grand frère ou de grande sœur » préparé pendant la grossesse avec photos et mots doux, une photo de famille emportée à la maternité.

## Questions fréquentes
**Faut-il le gronder quand il fait « le bébé » ?**
Non. Santé publique France conseille de ne ni s’alarmer ni gronder : il a besoin de temps et d’être rassuré.

**Il est devenu agressif avec le bébé. Que faire ?**
Ne le laissez pas seul avec le bébé, arrêtez fermement les gestes brusques, et accordez-lui davantage d’attention à d’autres moments.

**Il ne dort plus depuis la naissance. Est-ce lié ?**
Les troubles du sommeil font partie des régressions fréquentes. Gardez le rituel du soir et rassurez-le ; consultez si cela dure.

## Quand demander conseil
Consultez le médecin si la régression dure plusieurs semaines, si votre aîné semble triste, se renferme, perd l’appétit ou devient très agressif. Prendre soin de vous compte aussi : le manque de sommeil après une naissance pèse sur toute la famille. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'enfant-timide-aider-sans-etiqueter',
    title: 'Mon enfant est timide : comment l’aider à aller vers les autres ?',
    summary: 'Tempérament, sensibilité, brouille passagère : la timidité a plusieurs visages ; des pistes concrètes pour l’aider à s’affirmer, sans le forcer ni l’enfermer dans une étiquette.',
    category: 'education', tags: ['enfant timide', 'timidité', 'enfant solitaire', 'confiance en soi', 'se faire des copains', 'anniversaire', 'école', 'sensibilité'],
    min_age_months: 30, max_age_months: 144,
    sources: [S.solitaire, S.jalousie],
    body_md: `## En bref
- Un enfant peut aimer être seul par **tempérament**, être **timide** ou très **sensible**, ou vivre une **brouille passagère** avec un camarade.
- Avoir des copains renforce la confiance en soi et apprend à communiquer, écouter, attendre son tour.
- Pour l’aider : **dialoguer sans insister**, commencer petit (un seul copain à la maison), **valoriser** ses réussites, **ne pas le surprotéger**.
- Évitez de le présenter comme « le timide » : l’étiquette risque de le figer dans ce rôle.

## Comprendre
Pour la pédopsychiatre Sarah Bydlowski (mpedia), l’enfant solitaire n’est pas forcément en difficulté : certains aiment simplement être seuls. Les relations entre enfants sont aussi fluctuantes : une dispute de récréation peut isoler un enfant quelques jours, sans qu’il faille dramatiser.

En revanche, un isolement qui dure peut cacher un mal-être plus profond. Il est utile d’observer s’il s’accompagne d’autres signes.

Les comparaisons enferment l’enfant dans un rôle (« plus timide que sa sœur »), rappelle le pédopsychiatre Daniel Marcelli (mpedia) : mieux vaut reconnaître la singularité de chaque enfant.

## Au quotidien
**Dialoguer sans pression**
- Parlez de la récréation, de la classe, des copains, des loisirs, sans interrogatoire.
- Laissez-le exprimer ses ressentis, ses complexes, d’éventuels conflits.

**Lui offrir un cadre rassurant**
- Passez du temps ensemble : jeux de société, cuisine, balades.
- Aidez-le à voir ses qualités et à accepter ses défauts.
- Rassurez-le sans l’empêcher d’affronter les difficultés : montrez que vous croyez en ses capacités.

**Développer sa vie sociale, pas à pas**
- Invitez **un seul camarade** à la maison, pour un moment court et une activité qu’il aime.
- Encouragez-le à accepter les invitations, en restant un peu au début si besoin.
- Arrivez en avance aux fêtes et anniversaires : entrer dans un groupe déjà formé est plus difficile.

**Choisir des activités qui aident à s’affirmer**
- Théâtre, sports collectifs ou un art martial comme le judo, qui développe la maîtrise du corps et du comportement. Ne l’y contraignez jamais.

**Valoriser et détendre**
- Félicitez-le dans un domaine où il excelle.
- Le soir, une ambiance paisible (musique douce, histoire, respiration) et des moments où l’on rit ensemble.

**Montrer l’exemple**
- Un parent ouvert et aimable avec les autres incite l’enfant à l’imiter.

## Questions fréquentes
**Faut-il le pousser à aller vers les autres ?**
L’encourager, oui ; le forcer, non. Les petites étapes réussies construisent sa confiance.

**Il ne dit pas bonjour par timidité. Je dois insister ?**
Mieux vaut dire bonjour vous-même et lui proposer d’autres façons de saluer (un signe, un sourire) que d’en faire un enjeu devant tout le monde.

**À l’école, il reste en retrait. Que faire ?**
Échangez avec l’enseignant : il peut vous dire comment votre enfant se comporte en groupe et favoriser des binômes.

## Quand demander conseil
Mpedia conseille d’être vigilant si l’enfant s’isole de plus en plus et présente d’autres signes : tristesse, sommeil perturbé, sautes d’humeur, perte d’appétit, maux de tête ou de ventre, manque d’énergie, baisse des résultats scolaires. Parlez-en à l’enseignant et au médecin ; un accompagnement psychologique peut être envisagé si la situation persiste. ${AIDE}

${FIN}`,
  }),
  a({
    slug: 'mensonge-ou-imaginaire-enfant-histoires',
    title: 'Mensonge ou imaginaire ? Quand l’enfant raconte des histoires',
    summary: 'Entre l’imaginaire débordant du petit, les croyances comme le père Noël et les premiers vrais mensonges, des repères pour comprendre et réagir sans dramatiser.',
    category: 'education', tags: ['mensonge enfant', 'enfant ment', 'imaginaire', 'père Noël', 'petite souris', 'raconter des histoires', 'vérité', 'confiance'],
    min_age_months: 36, max_age_months: 120,
    sources: [S.croyances, S.obeissance, S.peurs],
    body_md: `## En bref
- Le jeune enfant a une **imagination débordante** et ne distingue pas toujours ce qu’il imagine de ce qui existe.
- À partir de **4 ans environ**, il comprend que les autres peuvent croire des choses différentes de la réalité.
- L’imaginaire est bénéfique **tant qu’il reste confronté à la réalité**.
- Face à un mensonge : rester calme, aider l’enfant à dire la vérité, et lui permettre de **réparer** plutôt que de l’humilier.

## Comprendre
La psychologue Cécilie Rondan (mpedia) explique qu’à partir de 4 ans, l’enfant acquiert ce que l’on appelle la « théorie de l’esprit » : il comprend que les choses peuvent être différentes de sa propre réalité, et qu’une autre personne peut croire quelque chose de faux. Vers 5 ans, il commence à s’interroger, et vers 6-7 ans, il se demande ce qui est possible ou non.

Les croyances et les personnages imaginaires (père Noël, petite souris, fées) ne sont pas néfastes : ils nourrissent l’imagination, aident à envisager l’avenir et à mettre ses émotions à distance. En revanche, mpedia conseille de ne pas les utiliser comme outils d’éducation (« si tu n’es pas sage, le père Noël ne viendra pas ») : le parent ne doit pas transférer son autorité à des personnages qui n’existent pas.

Pour le pédopsychiatre Daniel Marcelli (mpedia), quand l’enfant transgresse une règle, une éventuelle sanction doit être proportionnée, ne jamais faire mal ni humilier, et lui permettre de réparer.

## Au quotidien
**Face à une histoire inventée**
- Un petit qui raconte avoir vu un dragon au parc ne ment pas : il joue, il imagine. Entrez dans le jeu tout en marquant la frontière : « Quelle belle histoire ! Et en vrai, qu’as-tu vu au parc ? »

**Face à un vrai mensonge**
- Évitez de le piéger avec des questions dont vous connaissez la réponse ; dites plutôt ce que vous avez constaté : « Je vois que le vase est cassé. »
- Rendez la vérité possible : « Si tu me dis ce qui s’est passé, on va trouver une solution ensemble. »
- Valorisez l’aveu : « Merci de me l’avoir dit, c’était courageux. »
- Proposez de réparer : ramasser, nettoyer, s’excuser.
- Ne sanctionnez pas sous le coup de la colère.

**Comprendre pourquoi il ment**
- Peur d’être grondé, envie de faire plaisir, de se rendre intéressant, de cacher une difficulté (à l’école, avec un copain). Chercher la raison aide à répondre au vrai besoin.

**Montrer l’exemple**
- Tenez vos promesses et évitez les petits mensonges devant lui (« dis que je ne suis pas là »).

**Quand il pose des questions sur le père Noël**
- Ne tranchez pas par un simple oui ou non. Demandez-lui : « Qu’est-ce qui te fait penser que… ? » Il trouvera lui-même ses réponses. Quand il comprend, expliquez que ces histoires sont faites pour les petits et que vous êtes heureux de le voir grandir.

## Questions fréquentes
**Laisser croire au père Noël, est-ce mentir à son enfant ?**
Selon mpedia, en l’aidant à se poser des questions et à trouver ses réponses, le parent ne lui ment pas, et évite une rupture brutale de son imaginaire.

**Mon enfant de 7 ans invente beaucoup d’histoires. Est-ce inquiétant ?**
L’imagination reste précieuse à cet âge. Elle mérite attention si elle semble servir à fuir une réalité difficile ou si elle s’accompagne de signes de mal-être.

**Faut-il le punir quand il ment ?**
Mieux vaut l’aider à dire la vérité et à réparer. Une punition trop lourde peut lui apprendre surtout à mieux cacher.

## Quand demander conseil
Parlez-en au médecin si les mensonges sont très fréquents et s’accompagnent d’autres difficultés (agressivité, tristesse, difficultés scolaires, troubles du sommeil), ou si vous pensez qu’il cache quelque chose qui lui fait peur. ${AIDE}

${FIN}`,
  }),
];
