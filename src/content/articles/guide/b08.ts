/** Guide complet — lot 08 (27/10/2026) : activité physique pendant la grossesse, activité par activité et trimestre par trimestre. Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
/** Pages officielles françaises réellement lues le 2026-10-27. `published` = date affichée par la page. */
const S = {
  santeIdees: { label: 'Santé.fr — Idées d’activités et de mouvements à faire pendant la grossesse', url: 'https://www.sante.fr/activite-physique-pendant-la-grossesse', consulted_on: C, published: '2023-05-09' },
  santeAP: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — L’activité physique pendant la grossesse', url: 'https://www.sante.fr/node/1871127', consulted_on: C, published: '2023-04-25' },
  santeQuelles: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Quelles activités physiques pendant la grossesse ?', url: 'https://www.sante.fr/node/1871129', consulted_on: C, published: '2019-06-19' },
  santeVoyages: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Prendre certaines précautions pour les voyages', url: 'https://www.sante.fr/node/1871307', consulted_on: C, published: '2025-09-22' },
  santeChaleur: { label: 'Santé.fr — Fortes chaleurs et canicule : se protéger et protéger ses proches', url: 'https://www.sante.fr/fortes-chaleurs-et-canicule-se-proteger-et-proteger-ses-proches', consulted_on: C, published: '2026-06-22' },
  hasSynthese: { label: 'HAS — Prescription d’activité physique : grossesse et post-partum (synthèse)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/2022-08/synthese_aps_grossesse_post_partum_vf.pdf', consulted_on: C, published: '2022-07' },
  guideSports: { label: 'Ministère chargé des Sports — Guide « Maternité et pratique d’une activité physique et sportive »', url: 'https://www.sports.gouv.fr/media/1685/download', consulted_on: C },
  sportsCP: { label: 'sports.gouv.fr — Guide de la pratique sportive pendant la maternité', url: 'https://www.sports.gouv.fr/guide-de-la-pratique-sportive-pendant-la-maternite-824', consulted_on: C, published: '2021-03-02' },
  sportsHN: { label: 'sports.gouv.fr — Sport de haut niveau et maternité, c’est possible', url: 'https://www.sports.gouv.fr/sport-de-haut-niveau-et-maternite-c-est-possible-827', consulted_on: C },
  ameliDiabete: { label: 'ameli.fr — Le traitement du diabète gestationnel', url: 'https://www.ameli.fr/assure/sante/themes/diabete-gestationnel/traitement-suivi-femme-enceinte-bebe', consulted_on: C },
  spfBrochure: { label: 'Santé publique France — De la grossesse à l’arrivée de bébé, avec sérénité : alimentation, activité physique et bien-être (brochure)', url: 'https://www.santepubliquefrance.fr/sites/default/files/cadic_files/documents/spf00006707.pdf', consulted_on: C },
} satisfies Record<string, ArticleSource>;

/** Phrase de fin commune : l'article informe, il ne remplace pas un professionnel. */
const FIN = '_Cet article vous informe ; il ne remplace pas l’avis de la sage-femme ou du médecin qui suit votre grossesse._';
const URG = 'En cas d’urgence, appelez le **15** (SAMU) ou le **112**.';
/** Signes d'arrêt communs (HAS, ministère chargé des Sports). */
const STOP = `Arrêtez l’effort et contactez votre sage-femme, votre médecin ou la maternité en cas d’essoufflement important qui ne passe pas au repos, de contractions régulières ou douloureuses, de saignement, de perte de liquide, de vertiges, de malaise ou de maux de tête, de faiblesse musculaire qui perturbe l’équilibre, ou de douleur ou gonflement d’un mollet. Une **douleur ou une pression dans la poitrine** est une urgence.`;

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({ journeys: ['pregnant'], status: 'to_review', ...x });

export const GUIDE_B08: LibArticle[] = [
  // ------------------------------------------------------------------ activité par activité
  a({
    slug: 'marche-enceinte-bien-pratiquer',
    title: 'La marche pendant la grossesse : l’activité qui vous suit jusqu’au bout',
    summary: 'La marche peut se commencer à tout moment et se poursuivre jusqu’à l’accouchement : comment en faire une habitude, à quel rythme et avec quelles précautions.',
    category: 'sport', tags: ['marche', 'marche rapide', 'enceinte', 'sport grossesse', 'promenade', 'activité douce', 'chaussures'],
    sources: [S.santeIdees, S.santeAP, S.guideSports],
    body_md: `## En bref
- La marche peut **se commencer à tout moment** de la grossesse et **se poursuivre jusqu’à l’accouchement**, sauf avis médical contraire.
- Le repère général : **au moins 30 minutes par jour** d’activité modérée, que l’on peut fractionner (2 × 15 minutes ou 3 × 10 minutes).
- L’allure est bonne si vous pouvez **tenir une conversation** en marchant.
- **De bonnes chaussures** et de l’eau avant, pendant et après suffisent pour s’équiper.

## Comprendre
Santé.fr présente la marche comme l’activité la plus simple à intégrer pendant la grossesse : elle sollicite le cœur, les poumons et les articulations sans chocs violents, se pratique seule, à deux ou en famille, avec ou sans bâtons. Le guide du ministère chargé des Sports la décrit comme accessible à tout moment de la grossesse et la cite, avec la gymnastique douce et la natation, parmi les activités à privilégier au 8e mois.

Les bénéfices décrits par les autorités de santé pour l’activité modérée régulière s’appliquent pleinement à la marche : meilleur sommeil, meilleure circulation dans les jambes, aide pour limiter une prise de poids excessive et les douleurs de dos, bien-être psychologique. Marcher aide aussi à **casser les longues périodes assise** : Santé.fr rappelle que réduire le temps passé assise est bénéfique, même quand on fait déjà ses 30 minutes d’activité.

## Au quotidien
### Trouver son rythme
- **Si vous étiez peu active** : commencez par 15 minutes, au moins trois jours par semaine, puis augmentez progressivement pour atteindre 30 minutes par jour avant la fin du 3e mois, comme le propose Santé.fr.
- **Si vous marchiez déjà** : gardez vos habitudes en restant à une intensité où vous pouvez parler.
- **Allongez doucement** une marche que vous faites déjà (trajet, courses) de quelques minutes chaque jour : le guide du ministère suggère cette progression.

### Glisser la marche dans la journée
- Descendre un arrêt plus tôt, garer la voiture un peu plus loin, prendre les escaliers.
- Une courte marche après le déjeuner ou en fin de journée.
- Une promenade du week-end en famille ou entre amis.
- Au travail, devant un écran ou en voiture : bouger **au moins toutes les deux heures**, par exemple avec une petite marche, comme le conseille Santé.fr.

### S’équiper simplement
- **Chaussures** confortables qui tiennent bien le pied, surtout si vos pieds gonflent en fin de journée.
- **Vêtements** amples et adaptés à la météo.
- **Une bouteille d’eau** : buvez avant, pendant et après.
- Une petite collation si la sortie dure.

### Adapter au fil des mois
Au 2e et au 3e trimestre, le ventre modifie le centre de gravité et l’équilibre. Préférez des chemins réguliers, évitez les terrains glissants et ralentissez dans les descentes. En fin de grossesse, des sorties plus courtes mais plus fréquentes sont souvent plus agréables.

## Questions fréquentes
**Marcher suffit-il comme activité physique ?**
Oui, une marche active et régulière correspond au repère des 30 minutes d’activité modérée. Santé.fr conseille d’y ajouter, si possible, un peu de renforcement musculaire une à deux fois par semaine.

**Puis-je marcher pendant tout le 9e mois ?**
Le guide du ministère indique que la marche peut se poursuivre jusqu’à l’accouchement, sauf avis contraire de votre sage-femme ou de votre médecin.

**Et par forte chaleur ?**
Marchez aux heures fraîches, tôt le matin ou le soir, à l’ombre, buvez régulièrement et raccourcissez la sortie. Lors des épisodes de forte chaleur, reportez la marche si besoin.

**Je suis essoufflée plus vite qu’avant, dois-je m’inquiéter ?**
Santé.fr rappelle que la respiration peut devenir plus difficile au fil de la grossesse, notamment à partir du 3e trimestre : ralentissez. Un essoufflement qui ne passe pas au repos, en revanche, doit faire arrêter et consulter.

## Quand demander conseil
Parlez de votre activité à votre sage-femme ou à votre médecin, surtout en cas de complication ou de maladie chronique. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'marche-nordique-batons-grossesse',
    title: 'Marche nordique et marche avec bâtons quand on est enceinte',
    summary: 'Citée par le ministère chargé des Sports parmi les activités pour débuter, la marche avec bâtons se pratique à allure modérée, en restant attentive à l’équilibre et au terrain.',
    category: 'sport', tags: ['marche nordique', 'bâtons', 'enceinte', 'débuter le sport', 'plein air', 'sport doux'],
    sources: [S.guideSports, S.santeQuelles, S.hasSynthese],
    body_md: `## En bref
- Le guide du ministère chargé des Sports cite la **marche nordique** parmi les activités pour les femmes **peu ou pas actives** avant la grossesse.
- Le même guide indique que la marche peut se pratiquer **avec des bâtons**.
- L’intensité reste **modérée** : vous devez pouvoir parler pendant l’effort.
- Choisissez des **parcours réguliers** : l’équilibre change à partir du 4e mois environ.

## Comprendre
La marche nordique est une marche active où l’on se propulse en s’aidant de deux bâtons. Elle fait travailler le haut du corps en plus des jambes, et les bâtons apportent des points d’appui supplémentaires. Pour une femme enceinte, elle a l’avantage de se pratiquer en plein air, sans impacts violents, à un rythme que l’on choisit.

Les autorités de santé ne donnent pas de consignes propres à cette discipline : ce sont donc les **règles générales** de l’activité physique pendant la grossesse qui s’appliquent. La HAS recommande une activité d’endurance d’intensité **faible à modérée**, précédée d’un échauffement et suivie d’un temps de récupération, et conseille d’éviter les activités qui exposent à une **perte d’équilibre ou à une chute**. Santé.fr rappelle que le ventre déplace le centre de gravité, surtout à partir du 4e mois, ce qui rend les activités d’équilibre plus délicates.

## Au quotidien
### Bien démarrer
- **Si vous découvrez la discipline**, une séance d’initiation encadrée aide à apprendre le geste ; dites à l’animateur que vous êtes enceinte.
- **Commencez court**, puis allongez vos sorties de quelques minutes à la fois, comme le suggère le guide du ministère pour débuter en douceur.
- **Réglez la hauteur des bâtons** pour garder le dos droit et les épaules relâchées.

### Pendant la séance
- **Échauffement** de quelques minutes en marchant lentement, puis allure plus soutenue sans jamais être à bout de souffle.
- **Test de la parole** : si vous ne pouvez plus tenir une conversation, ralentissez.
- **Ne bloquez pas votre respiration**, soufflez sur l’effort, notamment en montée.
- **Retour au calme** et étirements doux en fin de séance.

### Choisir son parcours
- Chemins larges et réguliers, sans racines ni cailloux roulants.
- Peu de dénivelé, surtout au 3e trimestre.
- Évitez les sorties en **altitude** : la HAS déconseille l’activité physique en altitude pendant la grossesse.
- Évitez les **heures chaudes** : la HAS déconseille l’effort dans un environnement chaud et humide.

### S’équiper
- Chaussures de marche qui tiennent bien la cheville.
- Gourde : buvez avant, pendant et après.
- Vêtements en couches, faciles à enlever.

## Questions fréquentes
**Les bâtons aident-ils à garder l’équilibre ?**
Ils apportent des appuis, mais ne remplacent pas la prudence : restez sur des terrains faciles et ralentissez dans les descentes.

**Puis-je participer à une sortie de club ?**
Oui si le rythme du groupe vous permet de rester à intensité modérée. Prévenez l’encadrant et n’hésitez pas à faire une boucle plus courte.

**Jusqu’à quand pratiquer ?**
Aucune date limite n’est fixée pour la marche. Adaptez la durée et le terrain à vos sensations et à l’avis de votre sage-femme ou de votre médecin.

**Est-ce mieux que la marche classique ?**
Pas forcément. Le plus important, selon Santé.fr, est de choisir une activité qui vous plaît pour la pratiquer régulièrement.

## Quand demander conseil
Demandez l’avis de votre sage-femme ou de votre médecin avant de débuter une nouvelle activité, surtout en cas de complication. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'natation-enceinte-piscine',
    title: 'Nager enceinte : les atouts de la natation et comment s’y prendre',
    summary: 'Sans chocs et en quasi-apesanteur, la natation soulage le dos et les jambes : conseils pratiques pour nager à son rythme du début à la fin de la grossesse.',
    category: 'sport', tags: ['natation', 'piscine', 'nager enceinte', 'jambes lourdes', 'mal de dos', 'sport aquatique'],
    sources: [S.santeIdees, S.guideSports, S.hasSynthese],
    body_md: `## En bref
- La natation est décrite par Santé.fr comme **idéale pour les articulations** et le bien-être.
- Dans l’eau, le corps est en **quasi-apesanteur** : le guide du ministère chargé des Sports souligne qu’elle soulage les douleurs lombaires, sans chocs ni vibrations.
- Nager ou marcher dans l’eau **favorise le retour veineux**, utile contre les jambes lourdes, surtout l’été.
- Elle fait partie des activités à **privilégier en fin de grossesse**.

## Comprendre
Le poids du ventre, les ligaments assouplis par les hormones et le centre de gravité qui se déplace rendent certaines activités plus inconfortables au fil des mois. L’eau porte le corps : elle allège les appuis, ménage le dos et les articulations, et limite les chutes liées au déséquilibre. Le guide du ministère la cite d’ailleurs comme possible même en cas de limitations orthopédiques.

La natation peut se commencer pendant la grossesse si vous savez nager, à condition de rester à une intensité modérée. Pour celles qui nageaient déjà, le guide du ministère recommande de **nager en continu, à un rythme régulier**, plutôt que de chercher la vitesse.

## Au quotidien
### Organiser ses séances
- **20 à 50 minutes**, **3 à 5 fois par semaine** : ce sont les repères de séance du guide du ministère. Si vous débutez, commencez plus court.
- **Quelques longueurs lentes** pour s’échauffer, puis un rythme où vous pourriez encore parler.
- **Retour au calme** en fin de séance : quelques longueurs tranquilles ou de la marche dans l’eau.
- **Pensez à boire** : le guide du ministère recommande de bien s’hydrater, avec de l’eau ; gardez une gourde au bord du bassin.

### Choisir sa nage
- Alternez les nages qui vous sont confortables. Le guide du ministère indique que **masque et tuba** sont possibles, ce qui permet de nager le visage dans l’eau sans cambrer la nuque.
- Si une nage provoque une gêne dans le dos ou le bassin, changez de nage ou utilisez une planche.
- Évitez les **plongeons** et les sauts dans le bassin.

### Pratique à la piscine
- Des **cours pour femmes enceintes** existent souvent en piscine municipale : renseignez-vous à l’accueil.
- Santé.fr conseille d’**éviter les heures d’affluence**, pour nager tranquillement et limiter les bousculades.
- Attention aux **sols glissants** des vestiaires et des abords : marchez lentement, avec des sandales qui accrochent.

### En mer ou en lac
Restez près du bord, dans des zones surveillées, et évitez de nager seule. Renoncez si l’eau est agitée ou très froide.

## Questions fréquentes
**Je ne sais pas bien nager, puis-je quand même profiter de l’eau ?**
Oui : la marche dans l’eau ou un cours de gymnastique aquatique prénatale offrent les mêmes atouts de portance, sans avoir besoin de savoir nager.

**Le chlore pose-t-il problème pendant la grossesse ?**
Les sources consultées ne le signalent pas comme une raison d’éviter la piscine. En cas de question particulière (peau, infections), parlez-en à votre sage-femme.

**Peut-on nager jusqu’au terme ?**
Le guide du ministère cite le milieu aquatique parmi les activités à privilégier au 8e mois. Après une perte de liquide ou des saignements, ne vous baignez plus et consultez.

**Et le bassin de nage avec des enfants ?**
Préférez des créneaux calmes : les éclaboussures et les jeux augmentent le risque de chocs.

## Quand demander conseil
Après une perte de liquide, des saignements ou des contractions, sortez de l’eau et contactez la maternité. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'aquagym-gym-aquatique-prenatale',
    title: 'Aquagym et gymnastique aquatique prénatale : à quoi s’attendre',
    summary: 'Encadrés par un professionnel, les cours aquatiques pour femmes enceintes permettent de bouger dans l’eau sans savoir nager : déroulé, atouts et précautions.',
    category: 'sport', tags: ['aquagym', 'gym aquatique', 'aquanatal', 'piscine', 'cours prénatal', 'jambes lourdes'],
    sources: [S.santeIdees, S.hasSynthese, S.guideSports],
    body_md: `## En bref
- Santé.fr cite la **gymnastique aquatique spécifique** à la grossesse parmi les activités encadrées recommandées.
- L’eau **porte le corps** et **favorise le retour veineux**, ce qui soulage souvent les jambes lourdes.
- Un cours **encadré** permet au professionnel de **corriger les postures** et d’adapter les exercices au terme.
- **Pas besoin de savoir nager** dans la plupart des cours, qui se déroulent là où l’on a pied.

## Comprendre
L’aquagym classique peut comporter des sauts, des mouvements rapides et un rythme soutenu. Les cours **prénatals** (parfois appelés « aquanatal » ou « gym aquatique prénatale ») sont pensés pour les femmes enceintes : mouvements amples et lents, travail de la respiration, mobilité du bassin, renforcement doux et détente. Santé.fr indique que ce type de cours existe souvent en **piscine municipale**.

L’intérêt de l’eau est double. Elle soulage les appuis et les articulations, ce qui permet de bouger plus facilement quand le ventre s’arrondit. Et elle exerce une pression douce sur les jambes : nager ou marcher dans l’eau active le **retour veineux**, surtout l’été, selon Santé.fr.

## Au quotidien
### Choisir son cours
- Privilégiez un cours **spécifique à la grossesse**, ou signalez votre grossesse à l’animateur d’un cours classique pour qu’il vous propose des variantes.
- Renseignez-vous sur la **température de l’eau** : la HAS conseille d’éviter les environnements chauds et humides pendant l’effort. Une eau tiède et agréable convient mieux qu’un bassin très chaud.
- Vérifiez la **profondeur** : vous devez avoir pied.

### Pendant la séance
- **Échauffement** progressif et **retour au calme** : la HAS recommande 10 à 15 minutes de chaque, avec des assouplissements légers.
- **Intensité modérée** : vous devez pouvoir parler.
- **Pas de sauts répétés** ni de mouvements brusques ; préférez les versions sans impact.
- **Soufflez à l’effort**, ne bloquez jamais votre respiration (manœuvre que la HAS demande d’éviter).
- **Buvez** : gardez une gourde au bord du bassin.

### Autour du bassin
- Les sols mouillés glissent : marchez lentement, avec des sandales adaptées.
- Sortez de l’eau par l’escalier plutôt qu’en vous hissant à la force des bras.
- Couvrez-vous en sortant pour ne pas prendre froid.

### Combien de fois ?
Une à deux séances par semaine complètent bien la marche quotidienne. La HAS recommande au total **150 à 180 minutes** d’activité d’endurance par semaine en l’absence de complication, réparties sur au moins trois jours.

## Questions fréquentes
**Comment trouver un cours près de chez moi ?**
Renseignez-vous à l’accueil de votre piscine municipale, auprès de votre maternité ou de votre sage-femme, qui connaissent souvent les cours proposés localement.

**À partir de quand peut-on commencer ?**
Dès que vous le souhaitez, sauf contre-indication. Beaucoup de femmes découvrent ces cours au 2e trimestre, quand la fatigue du début diminue.

**Jusqu’à quand ?**
Le milieu aquatique est conseillé jusqu’en fin de grossesse par le guide du ministère chargé des Sports, tant que votre sage-femme ou votre médecin ne vous indique pas le contraire.

**Que faire si j’ai mal au bas du dos pendant un exercice ?**
Arrêtez le mouvement et demandez une variante à l’animateur. Une douleur qui persiste mérite d’en parler à votre sage-femme.

## Quand demander conseil
Ne retournez pas dans l’eau après une perte de liquide, des saignements ou des contractions : contactez la maternité. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'yoga-prenatal-ce-qu-il-faut-savoir',
    title: 'Yoga prénatal : ce qu’il apporte et les postures à adapter',
    summary: 'Le yoga prénatal travaille les muscles en douceur, la respiration et la souplesse ; quelques adaptations comptent, notamment la position sur le dos et la chaleur.',
    category: 'sport', tags: ['yoga', 'yoga prénatal', 'yoga grossesse', 'respiration', 'souplesse', 'relaxation', 'postures'],
    sources: [S.santeQuelles, S.santeIdees, S.hasSynthese],
    body_md: `## En bref
- Santé.fr cite le **yoga** parmi les activités qui travaillent les muscles **en douceur** et **respectent les articulations**.
- Le **yoga prénatal** est une pratique encadrée où le professionnel peut **corriger les postures**.
- À partir du 5e mois, on évite de rester **allongée sur le dos** ; la HAS fixe ce repère à **24 semaines d’aménorrhée**.
- On évite les cours dans une **salle chauffée** et les postures qui demandent beaucoup d’**équilibre**.

## Comprendre
Le yoga associe postures, respiration et relaxation. Pendant la grossesse, il peut aider à prendre conscience de son corps qui change, à assouplir le bassin et le dos, et à apprendre à respirer calmement, ce qui sert aussi pour l’accouchement.

Certaines adaptations sont importantes. Les hormones de la grossesse **assouplissent les ligaments**, d’où l’intérêt d’étirer sans forcer. Le ventre déplace le **centre de gravité**, surtout à partir du 4e mois selon Santé.fr. Enfin, la position **allongée sur le dos** peut gêner le retour du sang vers le cœur et provoquer un malaise : Santé.fr conseille de l’éviter à partir du 5e mois, et la HAS à partir de 24 semaines d’aménorrhée, en préférant la position **sur le côté** ou debout.

## Au quotidien
### Choisir un cours
- Un cours **spécifique à la grossesse** est le plus simple. Dans un cours classique, signalez votre grossesse dès le début.
- Évitez les cours en **salle chauffée** : la HAS demande d’éviter les environnements chauds et humides pendant l’activité.
- Préférez un rythme lent, avec un temps de relaxation.

### Les adaptations utiles
- **Postures allongées** : sur le côté gauche ou droit, avec un coussin entre les genoux, plutôt que sur le dos.
- **Torsions** : douces, à partir du haut du dos, sans comprimer le ventre.
- **Postures d’équilibre** : près d’un mur ou avec une chaise pour vous tenir.
- **Étirements** : lents, progressifs, sans à-coups, tenus 10 à 30 secondes en respirant profondément, comme le recommande Santé.fr ; ne cherchez pas l’amplitude maximale.
- **Respiration** : ne bloquez jamais votre souffle ; la HAS demande d’éviter les efforts en apnée.
- **Postures sur le ventre** : à remplacer par des postures à quatre pattes.

### À la maison
Si vous pratiquez avec une vidéo, choisissez un programme explicitement prénatal, gardez un coussin et une chaise à portée de main et arrêtez tout mouvement qui provoque une gêne.

### Compléter le yoga
Le yoga travaille la souplesse et le renforcement doux. Pour la partie **endurance**, la HAS recommande en plus 150 à 180 minutes par semaine d’activité comme la marche ou la natation.

## Questions fréquentes
**Je n’ai jamais fait de yoga, puis-je commencer enceinte ?**
Oui, les cours prénatals sont accessibles aux débutantes. Parlez-en à votre sage-femme ou à votre médecin si votre grossesse présente une particularité.

**J’ai la tête qui tourne quand je suis allongée sur le dos, que faire ?**
Tournez-vous sur le côté. La HAS cite justement le malaise dans cette position comme une raison de l’éviter.

**Les postures inversées sont-elles possibles ?**
Elles demandent de l’équilibre et exposent à une chute. Demandez une alternative à votre enseignant.

**Le yoga prépare-t-il à l’accouchement ?**
Il entraîne la respiration et la détente. La préparation à la naissance proposée par les sages-femmes reste le cadre de référence pour préparer l’accouchement.

## Quand demander conseil
Une douleur au bassin ou au pubis qui s’aggrave, des contractions ou des saignements doivent faire arrêter et consulter. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'pilates-prenatal-grossesse',
    title: 'Pilates pendant la grossesse : un renforcement doux à adapter',
    summary: 'Le pilates prénatal renforce la posture et le plancher pelvien en douceur ; il s’adapte au fil des mois, sans abdominaux classiques ni position prolongée sur le dos.',
    category: 'sport', tags: ['pilates', 'pilates prénatal', 'gainage', 'posture', 'plancher pelvien', 'renforcement', 'enceinte'],
    sources: [S.santeIdees, S.santeQuelles, S.hasSynthese],
    body_md: `## En bref
- Santé.fr cite des **cours de pilates pour femmes enceintes** parmi les activités encadrées possibles.
- Le pilates travaille la **posture**, la **respiration** et le **renforcement profond**, objectifs que la HAS retient pour le renforcement pendant la grossesse.
- À partir du 4e mois, Santé.fr indique de ne plus faire les **exercices abdominaux** classiques.
- Les exercices **allongée sur le dos** sont à éviter à partir de **24 semaines d’aménorrhée** selon la HAS.

## Comprendre
Le pilates repose sur des mouvements lents et contrôlés, coordonnés avec la respiration, qui sollicitent les muscles profonds du tronc. Pendant la grossesse, la HAS recommande un renforcement musculaire d’**intensité modérée** des principaux groupes musculaires, avec des objectifs de posture, de travail du **plancher pelvien**, de contrôle de la vessie, de prévention des douleurs et du **diastasis** (écartement des muscles grands droits de l’abdomen).

Le pilates prénatal répond bien à ces objectifs à condition d’être adapté. Le ventre qui grandit et l’assouplissement des ligaments modifient ce que le corps peut faire sans gêne. Certains exercices classiques, comme les relevés de buste ou les positions prolongées sur le dos, ne sont plus adaptés : un enseignant formé propose des variantes à quatre pattes, assise, debout ou sur le côté.

## Au quotidien
### Bien choisir son cours
- Un cours **prénatal** ou un enseignant qui connaît la grossesse.
- Un petit groupe, pour que l’enseignant puisse **corriger vos postures**, comme le souligne Santé.fr pour les activités encadrées.
- Signalez votre terme et toute gêne (bassin, dos, pubis).

### Les principes à garder
- **Souffler à l’effort** : Santé.fr rappelle de ne pas retenir sa respiration, et la HAS déconseille les contractions prolongées en apnée.
- **Ne pas creuser le bas du dos** pendant les exercices.
- **Pas d’abdominaux classiques** à partir du 4e mois : préférez le travail du muscle transverse, par exemple debout, dos au mur, en plaquant le bas du dos contre le mur en soufflant, exercice proposé par Santé.fr.
- **Position allongée sur le dos** : à remplacer par la position sur le côté au-delà de 24 semaines d’aménorrhée.

### Exemples d’exercices adaptés (repris de Santé.fr)
- **Plancher pelvien** : assise, contracter 10 secondes les muscles qui retiennent les urines, relâcher 5 secondes, 10 fois.
- **Dos et fessiers** : à quatre pattes, décoller un bras et la jambe opposée sans creuser le dos.
- **Épaules** : assise, dos droit, petits haltères ou bouteilles d’eau, monter les mains aux épaules et redescendre lentement, par séries de 10.

### Fréquence
Santé.fr recommande du renforcement **une à deux fois par semaine**, en complément d’une activité d’endurance comme la marche ou la natation.

## Questions fréquentes
**Le pilates prévient-il le diastasis ?**
La HAS cite la prévention du diastasis parmi les objectifs du renforcement adapté, sans garantie. Votre sage-femme peut vérifier vos abdominaux après la naissance.

**Puis-je utiliser les machines (reformer) ?**
Les sources consultées ne détaillent pas ce point. Demandez à un enseignant formé à la grossesse et évitez les positions sur le dos au-delà de 24 semaines d’aménorrhée.

**Je fais du pilates depuis des années, dois-je tout changer ?**
Gardez la pratique, en remplaçant les exercices abdominaux classiques et les positions sur le dos, et en baissant l’intensité.

**Et en fin de grossesse ?**
Des séances plus courtes et plus douces, centrées sur la mobilité du bassin et la respiration, restent souvent possibles.

## Quand demander conseil
Une douleur pelvienne, une fuite urinaire nouvelle ou une gêne dans le ventre méritent d’en parler à votre sage-femme. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'gymnastique-douce-tai-chi-grossesse',
    title: 'Gymnastique douce, stretching et tai-chi pendant la grossesse',
    summary: 'Respiration, bassin, périnée et assouplissements : les activités douces conviennent à presque toutes les étapes de la grossesse, avec quelques règles simples.',
    category: 'sport', tags: ['gymnastique douce', 'gym douce', 'tai-chi', 'stretching', 'étirements', 'souplesse', 'enceinte'],
    sources: [S.santeIdees, S.santeQuelles, S.guideSports],
    body_md: `## En bref
- La **gymnastique douce** travaille la respiration, la prise de conscience du **bassin et du périnée**, la tonification et l’assouplissement, selon Santé.fr.
- Le **tai-chi-chuan** et le yoga sont cités par Santé.fr comme des activités qui ménagent les articulations.
- Les **étirements** se font lentement, sans à-coups, tenus **10 à 30 secondes**.
- Le guide du ministère chargé des Sports cite la gymnastique douce parmi les activités à privilégier au **8e mois**.

## Comprendre
Ces activités ont en commun des mouvements lents, contrôlés et coordonnés avec la respiration. Elles conviennent bien aux femmes qui n’étaient pas sportives avant la grossesse, comme à celles qui doivent réduire l’intensité au fil des mois. Elles aident à garder de la mobilité malgré le ventre, à soulager certaines tensions du dos et à apprendre à se détendre.

Le guide du ministère rappelle que les hormones de la grossesse **assouplissent les ligaments** et augmentent le risque d’entorse. C’est pourquoi on étire en douceur, sans chercher à aller plus loin qu’avant la grossesse. Santé.fr insiste aussi sur deux règles : **souffler à l’effort** et **ne pas creuser le bas du dos**.

## Au quotidien
### Des étirements à essayer (décrits par Santé.fr)
- **Dos** : allongée, ramener les genoux vers la poitrine en les écartant, en respirant calmement. Au-delà du 5e mois, faites-le plutôt assise ou sur le côté, car la position allongée sur le dos est alors à éviter.
- **Bras et épaules** : debout, mains paume contre paume, bras tendus vers le haut, 30 secondes.
- **Cuisses (quadriceps)** : debout, ramener le talon vers la fesse, 30 secondes, en vous tenant au dossier d’une chaise.

### Organiser une petite séance
1. **Échauffement** : quelques minutes de marche sur place et de rotations douces des épaules.
2. **Mobilité** : bascules du bassin debout ou à quatre pattes, cercles des hanches.
3. **Renforcement léger** : par exemple l’exercice du dos plaqué au mur en soufflant, tenu 20 secondes, 10 fois.
4. **Étirements** : lents, tenus 10 à 30 secondes.
5. **Détente** : quelques minutes de respiration calme, assise ou couchée sur le côté.

### Le tai-chi
Ses enchaînements lents sollicitent l’équilibre : pratiquez près d’un mur ou d’une chaise au 2e et au 3e trimestre, et réduisez l’amplitude des mouvements si besoin.

### Respecter ses limites
Santé.fr le rappelle : **en cas de douleur, on ne force pas**. Les sensations varient d’un jour à l’autre, surtout au 1er trimestre où la fatigue est fréquente.

## Questions fréquentes
**Ces activités suffisent-elles ?**
Elles complètent bien une activité d’endurance. Le repère reste d’au moins 30 minutes d’activité modérée par jour, comme la marche ou la natation.

**Puis-je pratiquer chez moi ?**
Oui, avec un programme prénatal. Gardez une chaise à portée de main pour l’équilibre et arrêtez tout mouvement inconfortable.

**Faut-il éviter les étirements des adducteurs ?**
Les sources consultées ne les interdisent pas ; elles demandent de rester lente, progressive et de ne pas forcer. Une douleur au pubis doit faire arrêter l’exercice et en parler à votre sage-femme.

**Combien de temps par séance ?**
Le guide du ministère propose des séances de 20 à 50 minutes. Une séance courte et régulière vaut mieux qu’une longue séance occasionnelle.

## Quand demander conseil
Une douleur au bassin ou au pubis qui gêne la marche mérite un avis de votre sage-femme ou de votre médecin. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'velo-enceinte-route-ville-appartement',
    title: 'Vélo pendant la grossesse : vélo en ville, vélo d’appartement, que choisir ?',
    summary: 'Le vélo sur route expose à un risque de chute qui augmente avec le ventre ; le pédalage sur vélo fixe est une alternative citée par le ministère chargé des Sports.',
    category: 'sport', tags: ['vélo', 'vélo d’appartement', 'vélo enceinte', 'pédalage', 'vélo elliptique', 'chute', 'déplacements'],
    sources: [S.santeQuelles, S.spfBrochure, S.guideSports],
    body_md: `## En bref
- Santé.fr et Santé publique France classent le **vélo** parmi les activités à **risque de chute**, à éviter pendant la grossesse.
- Le risque augmente surtout **à partir du 4e mois**, quand le ventre déplace le centre de gravité.
- Le **pédalage** sur vélo fixe est cité par le guide du ministère chargé des Sports comme activité d’endurance.
- Pour vos trajets, parlez-en avec votre sage-femme ou votre médecin et envisagez une **alternative** (marche, transports).

## Comprendre
Le vélo est une bonne activité d’endurance en dehors de la grossesse. Pendant la grossesse, le problème n’est pas l’effort lui-même mais le **risque de chute** : un choc sur le ventre peut être dangereux. Santé.fr explique que l’équilibre évolue, car le ventre déplace le centre de gravité, surtout à partir du 4e mois. Les activités qui demandent de l’équilibre deviennent plus difficiles, et le vélo est cité en exemple. La brochure de Santé publique France range le vélo avec le skate, les rollers, le ski et l’équitation parmi les activités déconseillées pour cette raison.

Le **vélo fixe** (vélo d’appartement, vélo de salle) supprime le risque de chute lié à l’équilibre et au trafic. Le guide du ministère cite le pédalage parmi les activités d’endurance à associer au renforcement musculaire.

## Au quotidien
### Vélo d’appartement ou de salle
- **Réglez la selle** pour pédaler le dos droit, sans tension dans le bas du dos ni dans les genoux.
- Un **vélo semi-allongé** (avec dossier) peut être plus confortable quand le ventre gêne.
- **Intensité modérée** : vous devez pouvoir parler en pédalant.
- **Échauffement et retour au calme** de quelques minutes, à faible résistance.
- **Aérez la pièce** et buvez régulièrement.
- Évitez les cours collectifs très intenses de type « biking » ; si vous y tenez, baissez la résistance et sortez de la salle si elle est surchauffée.

### Si vous utilisez encore le vélo pour vos trajets
Les sources consultées ne fixent pas de date limite précise, mais le risque augmente avec les mois. Si vous continuez au début de grossesse après en avoir parlé avec votre sage-femme ou votre médecin :
- choisissez des **itinéraires calmes**, sur pistes cyclables ;
- roulez **lentement**, sans charge lourde sur le porte-bagages ;
- évitez la pluie, le verglas et la nuit ;
- portez un casque et des vêtements visibles.

### Les alternatives pour se déplacer
- La **marche**, qui peut se poursuivre jusqu’à l’accouchement.
- Les transports en commun, en demandant une place assise.
- Le covoiturage ou la voiture, avec des pauses régulières pour marcher sur les longs trajets.

## Questions fréquentes
**Le vélo elliptique est-il possible ?**
Les sources consultées ne le citent pas. Il ne comporte pas de chute liée à l’équilibre en mouvement, mais demande de la coordination : tenez bien les poignées et gardez une intensité modérée.

**Et le vélo à assistance électrique ?**
L’assistance réduit l’effort mais pas le risque de chute, qui est la raison de la recommandation.

**Je faisais du VTT, puis-je continuer ?**
Le VTT expose à des chutes fréquentes : il fait partie des activités à éviter. Le vélo fixe permet de garder votre condition.

**Le pédalage aide-t-il pour les jambes lourdes ?**
Bouger les jambes favorise la circulation. Si vous avez un gonflement brutal ou un mollet douloureux, consultez sans attendre.

## Quand demander conseil
Après une chute, même légère, contactez votre maternité ou votre médecin, surtout en cas de choc sur le ventre, de saignement, de perte de liquide, de contractions ou si votre bébé bouge moins. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'course-a-pied-enceinte',
    title: 'Courir enceinte : pour qui, jusqu’à quand et comment adapter',
    summary: 'La course à pied est réservée en priorité aux femmes qui couraient avant leur grossesse ; elle peut se poursuivre plusieurs mois en baissant l’intensité et en écoutant son corps.',
    category: 'sport', tags: ['course à pied', 'running', 'courir enceinte', 'jogging', 'trail', 'sportive', 'impact'],
    sources: [S.santeIdees, S.guideSports, S.hasSynthese],
    body_md: `## En bref
- Santé.fr et le guide du ministère chargé des Sports réservent la course **en priorité aux femmes qui couraient déjà** avant la grossesse.
- Elle peut se poursuivre **plusieurs mois**, selon la **prise de poids**, la **souplesse** et en l’absence de **douleurs aux chevilles**.
- **Bonnes chaussures** et **terrain souple** sont conseillés.
- On ne cherche plus la performance : l’intensité reste **modérée**.

## Comprendre
Courir sollicite fortement le cœur et les articulations, avec un impact à chaque foulée. Si votre corps y est habitué, la grossesse n’impose pas d’arrêter d’emblée ; elle demande d’adapter. Si vous n’avez jamais couru, ce n’est pas le moment de commencer : la marche active ou la marche nordique apportent des bénéfices proches avec moins d’impacts.

Plusieurs changements expliquent la prudence. Le **poids** augmente et se répartit vers l’avant. Les **ligaments** s’assouplissent sous l’effet des hormones, ce qui augmente le risque d’entorse selon le guide du ministère. Le **centre de gravité** se déplace, ce qui rend les chutes plus probables sur un terrain irrégulier. Enfin, le **périnée** supporte un poids croissant ; la HAS rappelle d’ailleurs qu’après la naissance, les activités à impact comme la course ne se reprennent qu’après la rééducation périnéale.

## Au quotidien
### Adapter son entraînement
- **Test de la parole** : vous devez pouvoir tenir une conversation. Si ce n’est plus le cas, ralentissez ou marchez.
- **Pas de fractionné intense** ni de compétition à partir du 2e trimestre : le guide du ministère conseille d’éviter les activités intenses et la compétition à ce stade.
- **Raccourcissez** les sorties et alternez course et marche quand les sensations changent.
- **Échauffement et retour au calme** de 10 à 15 minutes, comme le recommande la HAS.
- Durée maximale conseillée par la HAS : **60 à 90 minutes** par séance.

### Choisir son terrain
- **Terrain souple** et régulier : chemins stabilisés, pistes, parcs.
- Évitez les sentiers techniques et les descentes raides, où le risque de chute est plus important.
- Évitez l’**altitude** et les **environnements chauds et humides**, que la HAS déconseille ; courez aux heures fraîches.

### S’équiper
- **Chaussures** de course en bon état, avec un bon maintien.
- Une **brassière** adaptée à la poitrine qui change.
- Une **ceinture de soutien** peut soulager certaines femmes ; demandez conseil à votre sage-femme.
- De l’**eau**, même pour une sortie courte.

### Savoir passer à autre chose
Quand courir devient inconfortable (lourdeur dans le bas du ventre, fuites urinaires, douleur aux chevilles, au pubis ou au dos), il est temps de passer à la marche active, au vélo fixe ou à la natation.

## Questions fréquentes
**Jusqu’à quel mois puis-je courir ?**
Aucune date n’est fixée : cela dépend de votre prise de poids, de votre souplesse et de vos sensations. Le guide du ministère conseille de privilégier la marche, la gymnastique douce et la natation au 8e mois.

**J’ai des petites fuites urinaires en courant, que faire ?**
Diminuez les impacts et parlez-en à votre sage-femme : des exercices du plancher pelvien peuvent aider.

**Puis-je m’inscrire à une course ?**
Le guide du ministère déconseille la compétition à partir du 2e trimestre. Au 1er trimestre, une course loisir à allure modérée se discute avec votre professionnel.

**Faut-il surveiller sa fréquence cardiaque ?**
Le guide du ministère indique que la fréquence maximale se détermine avec le professionnel de santé. Au quotidien, le test de la parole est un repère simple.

## Quand demander conseil
En cas de chute, de choc sur le ventre ou de douleur inhabituelle, contactez votre maternité. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'renforcement-musculaire-enceinte',
    title: 'Renforcement musculaire pendant la grossesse : fréquence, charges et exercices',
    summary: 'Un renforcement doux, une à trois fois par semaine, complète l’activité d’endurance : quels muscles travailler, avec quelles charges et quelles règles de respiration.',
    category: 'sport', tags: ['renforcement musculaire', 'musculation', 'haltères', 'gainage', 'salle de sport', 'enceinte', 'fitness'],
    sources: [S.santeIdees, S.hasSynthese, S.guideSports],
    body_md: `## En bref
- Santé.fr recommande du renforcement **une à deux fois par semaine** ; le guide du ministère chargé des Sports propose jusqu’à **trois fois**, jamais deux jours de suite.
- La HAS conseille une **intensité modérée**, sur les principaux groupes musculaires.
- **Pas d’effort en apnée** ni de contraction tenue en bloquant la respiration : on **souffle à l’effort**.
- Des **charges légères** (petits haltères, bouteilles d’eau) suffisent ; on évite ce qui paraît « trop lourd ».

## Comprendre
Le renforcement musculaire pendant la grossesse ne vise pas la performance mais le confort : mieux porter le poids du ventre, soulager le dos, garder de la force pour porter bébé après la naissance. La HAS lui fixe des objectifs précis : posture, plancher pelvien, contrôle de la vessie, prévention des douleurs et du diastasis.

Deux règles de sécurité reviennent dans toutes les sources. D’abord, la **respiration** : la HAS demande d’éviter les contractions prolongées avec blocage de la respiration (manœuvre de Valsalva), qui augmentent la pression dans le ventre et sur le périnée. Ensuite, la **position** : pas d’exercices allongée sur le dos à partir de 24 semaines d’aménorrhée selon la HAS, et pas d’abdominaux classiques à partir du 4e mois. Enfin, on évite de porter des charges lourdes.

## Au quotidien
### Exercices proposés par Santé.fr
- **Abdominaux profonds** : debout, dos au mur, plaquer le bas du dos contre le mur en soufflant, tenir 20 secondes, 10 fois.
- **Dos et fessiers** : à quatre pattes, décoller un bras et la jambe opposée sans creuser le dos.
- **Dos** : assise au sol, mains en appui, décoller les fesses en poussant sur les appuis, 10 secondes, 10 fois.
- **Épaules** : assise, dos droit, petits haltères ou bouteilles d’eau, monter les mains aux épaules et redescendre lentement, séries de 10.
- **Plancher pelvien** : assise, contracter 10 secondes, relâcher 5 secondes, 10 fois, plusieurs fois par jour.

### Exercices du guide du ministère
- **Pectoraux** : presser un ballon entre les mains, 20 secondes, 10 fois.
- **Cuisses et fessiers** : petites flexions de jambes debout, en vous tenant si besoin.

### En salle de sport
- Prévenez le coach que vous êtes enceinte.
- Préférez les **machines guidées** légères ou le poids du corps aux barres lourdes.
- Évitez les exercices **sur le dos** en fin de grossesse (développé couché, par exemple) et ceux qui **compriment le ventre**.
- Évitez la **station debout immobile prolongée**, déconseillée par la HAS.
- Associez chaque séance à une activité d’endurance : le guide du ministère conseille une activité aérobie quotidienne (marche, pédalage, natation).

## Questions fréquentes
**Je soulevais lourd avant ma grossesse, dois-je arrêter ?**
Les sources recommandent une intensité modérée et d’éviter le port de charges lourdes. Parlez de votre programme avec votre médecin ou votre sage-femme pour l’alléger.

**Le gainage classique (planche) est-il possible ?**
Les sources consultées ne le détaillent pas. Une planche tenue longtemps pousse souvent à bloquer la respiration, ce que la HAS demande d’éviter ; préférez des versions courtes, sur les genoux, en soufflant, et demandez conseil à votre sage-femme.

**Faut-il des courbatures pour que ce soit efficace ?**
Non. Une intensité modérée et régulière est l’objectif.

**Et porter un aîné ?**
Pliez les genoux, gardez l’enfant près du corps et soufflez en le soulevant. Demandez de l’aide quand c’est possible.

## Quand demander conseil
Une douleur au dos, au bassin ou au pubis qui s’aggrave avec l’effort, ou une fuite urinaire nouvelle, méritent un avis. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'danse-enceinte',
    title: 'Danser enceinte : quels styles et quelles adaptations ?',
    summary: 'La danse fait partie des activités citées pour bouger pendant la grossesse ; on l’adapte en évitant les sauts répétés, les portés, les chocs et les mouvements qui menacent l’équilibre.',
    category: 'sport', tags: ['danse', 'danser enceinte', 'zumba', 'cours de danse', 'danse prénatale', 'équilibre'],
    sources: [S.santeAP, S.santeQuelles, S.hasSynthese],
    body_md: `## En bref
- Santé.fr cite la **danse** parmi les activités qui permettent de bouger pendant la grossesse.
- Le plaisir compte : choisir une activité qui plaît aide à la pratiquer **régulièrement**.
- On évite les **sauts répétés**, les **portés**, les **chutes** et les **chocs** avec des partenaires.
- L’équilibre change **à partir du 4e mois** : les pirouettes et les déséquilibres deviennent plus délicats.

## Comprendre
La danse fait travailler le cœur, la coordination et la souplesse, tout en procurant du plaisir et du lien social. Santé.fr la mentionne parmi les activités du quotidien et de loisir qui comptent dans l’activité physique de la femme enceinte, au même titre que la marche ou la natation.

Les sources consultées ne donnent pas de consignes propres à chaque style de danse. Ce sont donc les règles générales qui s’appliquent. La HAS conseille d’éviter les activités qui exposent à une **perte d’équilibre, une chute ou un traumatisme**, et de rester à une intensité **faible à modérée**. Santé.fr explique que le ventre déplace le centre de gravité, surtout à partir du 4e mois, ce qui rend les activités d’équilibre plus difficiles. Enfin, les ligaments s’assouplissent pendant la grossesse : on ménage donc ses articulations.

## Au quotidien
### Les styles plus faciles à adapter
- **Danses douces** : danse orientale adaptée, danses de salon à allure modérée, danse libre, cours de danse prénatale lorsqu’ils existent.
- **Cours de fitness dansé** : possibles en version « sans impact », en remplaçant les sauts par des pas marchés.

### Ce qu’on adapte
- **Sauts répétés et réceptions** : remplacés par des pas au sol.
- **Pirouettes, tours rapides, déséquilibres** : réduits ou supprimés, surtout au 2e et au 3e trimestre.
- **Portés et figures acrobatiques** : à éviter, tout comme les danses avec contacts appuyés.
- **Grands écarts et extensions** : sans forcer, à cause de la souplesse accrue des ligaments.
- **Travail au sol sur le dos** : à éviter à partir de 24 semaines d’aménorrhée selon la HAS.

### Les bons réflexes
- **Test de la parole** : vous devez pouvoir parler en dansant.
- **Échauffement et retour au calme** progressifs.
- **Eau** à portée de main et salle aérée : la HAS déconseille l’effort dans un environnement chaud et humide.
- **Chaussures** adaptées au sol, pour ne pas glisser.
- **Pauses** dès que vous en ressentez le besoin.

### Danser à la maison
Mettre de la musique et danser quelques minutes dans le salon compte aussi comme activité physique. C’est une bonne manière de casser les longues périodes assise.

## Questions fréquentes
**Je donne ou je suis des cours intensifs, que faire ?**
Les recommandations demandent de rester à une intensité faible à modérée pendant la grossesse. Parlez de votre pratique avec votre médecin ou votre sage-femme pour l’adapter.

**La danse de couple est-elle possible ?**
Oui si elle reste calme et sans portés. Prévenez votre partenaire pour éviter les mouvements brusques.

**Jusqu’à quand danser ?**
Aucune date n’est fixée. Adaptez au fil des mois et privilégiez des mouvements doux en fin de grossesse.

**Les spectacles ou galas sont-ils compatibles ?**
Les répétitions longues et le stress de la scène peuvent fatiguer. Voyez avec votre professionnel et votre professeur pour adapter votre rôle.

## Quand demander conseil
Après une chute ou un choc sur le ventre, contactez votre maternité. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'randonnee-montagne-altitude-enceinte',
    title: 'Randonnée et montagne pendant la grossesse : altitude, dénivelé et précautions',
    summary: 'La marche en montagne est possible avec des précautions, mais la HAS déconseille l’activité physique en altitude et Santé.fr déconseille le trekking pendant la grossesse.',
    category: 'sport', tags: ['randonnée', 'montagne', 'altitude', 'trekking', 'vacances', 'enceinte', 'dénivelé'],
    sources: [S.hasSynthese, S.santeVoyages, S.santeQuelles],
    safety_critical: true,
    body_md: `## En bref
- La HAS déconseille les activités physiques **en altitude** pendant la grossesse.
- Santé.fr déconseille le **trekking** pendant la grossesse et recommande une activité **modérée** en vacances.
- Une **promenade** sur sentiers faciles, à allure modérée, reste une façon agréable de bouger.
- Pensez à l’**éloignement des secours** et à l’**équilibre** qui change avec le ventre.

## Comprendre
La randonnée est une forme de marche, l’activité la plus recommandée pendant la grossesse. Mais en montagne, plusieurs facteurs s’ajoutent. L’**altitude** : la HAS demande d’éviter l’activité physique en altitude chez la femme enceinte. Le **dénivelé** : les montées augmentent l’intensité de l’effort, les descentes sollicitent les genoux et exposent aux chutes. Le **terrain** : pierres, racines et pentes deviennent plus délicats quand le ventre déplace le centre de gravité, surtout à partir du 4e mois selon Santé.fr. Enfin, l’**isolement** : en cas de problème, les secours mettent plus de temps à arriver.

Pour les voyages, Santé.fr recommande d’en parler au professionnel qui suit la grossesse, de privilégier une activité modérée et d’éviter les activités inadaptées, en citant notamment le **trekking** et la **plongée**.

## Au quotidien
### Choisir sa sortie
- **Sentiers balisés**, larges et réguliers, avec peu de dénivelé.
- **Durée courte**, avec des possibilités de raccourcir le parcours.
- **Basse altitude** et pas de longue marche en haute montagne.
- **Accès proche** d’une route et du réseau téléphonique.
- Pas de passages vertigineux, d’échelles, de névés ou de pierriers.

### Sur le chemin
- **Allure modérée** : vous devez pouvoir parler, même en montée. Ralentissez ou faites des pauses.
- **Bâtons** pour les appuis, surtout en descente.
- **Boire régulièrement** et emporter des collations.
- **Se protéger du soleil** : chapeau, vêtements légers, heures fraîches.
- **Ne pas porter un sac lourd** : confiez le poids à votre accompagnant.
- **Ne jamais partir seule**, et prévenir quelqu’un de votre itinéraire.

### Préparer les vacances
- Parlez de votre projet à votre sage-femme ou à votre médecin, surtout en cas de complication.
- Repérez la **maternité** ou l’hôpital le plus proche du lieu de séjour.
- Emportez votre **dossier de suivi** de grossesse et votre carte Vitale.
- Santé.fr signale que la période la plus confortable pour voyager se situe souvent **entre la 16e et la 28e semaine**.

### Des alternatives en montagne
Balades en fond de vallée, autour d’un lac, promenades en forêt, baignade surveillée en lac : la montagne offre de nombreuses activités douces.

## Questions fréquentes
**À partir de quelle altitude dois-je m’inquiéter ?**
La HAS déconseille l’activité physique en altitude sans fixer de seuil dans le document consulté. Demandez à votre médecin ou à votre sage-femme ce qui est adapté à votre situation et à votre lieu de séjour.

**Puis-je dormir en refuge ou en station ?**
Séjourner n’est pas faire un effort intense, mais parlez de votre destination avec votre professionnel avant de partir.

**La randonnée en raquettes l’hiver est-elle possible ?**
Les sources consultées ne la détaillent pas. Elle expose au froid, aux chutes sur neige et à l’altitude : demandez conseil avant de vous engager.

**Les remontées mécaniques posent-elles problème ?**
Les sources consultées n’en parlent pas. L’important est d’éviter l’effort soutenu en altitude et les risques de chute.

## Quand demander conseil
Pendant une sortie, redescendez et consultez en cas de maux de tête, de vertiges ou d’essoufflement qui persiste au repos. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'sports-risque-de-chute-equitation-ski-roller',
    title: 'Équitation, ski, roller, skate : pourquoi les sports à risque de chute sont déconseillés',
    summary: 'Santé.fr et Santé publique France déconseillent pendant la grossesse les activités où l’on peut tomber ; voici pourquoi, et comment garder une activité sans renoncer au plaisir.',
    category: 'sport', tags: ['équitation', 'ski', 'roller', 'skate', 'trottinette', 'chute', 'sports à éviter', 'enceinte'],
    sources: [S.santeQuelles, S.spfBrochure, S.hasSynthese],
    safety_critical: true,
    body_md: `## En bref
- Santé.fr classe parmi les activités à **risque de chute élevé** : **équitation, ski, vélo, skate et roller**.
- Santé publique France les déconseille pendant la grossesse.
- La HAS demande d’éviter les activités pouvant provoquer **perte d’équilibre, chute ou traumatisme** pour la mère ou le fœtus.
- Le risque augmente **à partir du 4e mois**, quand le ventre déplace le centre de gravité.

## Comprendre
Ces sports ont en commun la **vitesse**, la **hauteur** ou un **équilibre instable**. Une chute peut entraîner un choc sur le ventre, dangereux pour la grossesse. Même une pratiquante expérimentée ne contrôle pas tout : une plaque de glace, un cheval qui s’effraie, un autre skieur, un caillou sous une roue.

La grossesse modifie aussi la façon de tomber et de se rattraper. Santé.fr explique que le ventre déplace le centre de gravité, surtout à partir du 4e mois, ce qui rend les activités d’équilibre plus difficiles. Les ligaments s’assouplissent aussi sous l’effet des hormones de la grossesse. Et la fatigue, fréquente au 1er trimestre, diminue la vigilance.

C’est pour ces raisons que les recommandations françaises déconseillent ces activités pendant toute la grossesse, plutôt que de fixer un mois limite.

## Au quotidien
### Si vous êtes cavalière
- Les soins aux chevaux à pied et le temps passé à l’écurie restent possibles en restant prudente avec les animaux (coups de pied, bousculades).
- Évitez de porter des charges lourdes (sacs d’aliments, bottes de foin).
- Gardez une activité d’endurance à côté : marche, natation.

### Si vous partez au ski
- Préférez les **promenades** en station sur chemins damés, avec de bonnes chaussures, plutôt que le ski alpin.
- Évitez l’effort soutenu en **altitude**, que la HAS déconseille.
- Le ski de fond, le snowboard et la luge exposent aussi aux chutes : parlez-en à votre professionnel avant de partir.

### Roller, skate, trottinette
- Ces déplacements exposent aux chutes : remplacez-les par la marche.
- Accompagner un enfant qui fait du roller est possible en marchant à côté de lui.

### Garder le plaisir de bouger
- Pour le **cardio** : marche active, natation, vélo fixe.
- Pour le **gainage et l’équilibre** : yoga ou pilates prénatals, près d’un appui.
- Pour le **plein air** : randonnée facile en basse altitude.

## Questions fréquentes
**Je fais de l’équitation depuis l’enfance, monter au pas reste-t-il possible ?**
Les recommandations ne distinguent pas les allures : la chute reste possible, même au pas, car l’animal peut réagir de façon imprévue. Parlez-en avec votre médecin ou votre sage-femme.

**Je ne savais pas que j’étais enceinte et j’ai skié, que faire ?**
Sans chute ni symptôme, signalez-le simplement à votre prochain rendez-vous. Après une chute, ou si vous avez des saignements, des douleurs ou des contractions, consultez rapidement.

**La trottinette électrique est-elle concernée ?**
Les sources consultées ne la citent pas, mais elle partage le risque de chute à vitesse élevée.

**Et l’escalade ?**
Les sources consultées ne la détaillent pas ; elle comporte un risque de chute et un baudrier qui serre le bassin. Demandez l’avis de votre médecin.

## Quand demander conseil
Après toute chute pendant la grossesse, surtout avec un choc sur le ventre, contactez votre maternité ou votre médecin, même si vous vous sentez bien. Consultez en urgence en cas de saignement, de perte de liquide, de douleurs ou de contractions, ou si votre bébé bouge moins. ${URG}

${FIN}`,
  }),
  a({
    slug: 'sports-de-contact-combat-ballon-raquette-enceinte',
    title: 'Sports de combat, de ballon et de raquette pendant la grossesse',
    summary: 'Boxe, judo, handball, basket, tennis : les sports exposant à des chocs sur le ventre sont déconseillés ; comment adapter sa pratique et garder le lien avec son club.',
    category: 'sport', tags: ['sports de combat', 'sports collectifs', 'tennis', 'badminton', 'football', 'judo', 'boxe', 'handball', 'basket', 'enceinte'],
    sources: [S.santeQuelles, S.spfBrochure, S.guideSports],
    safety_critical: true,
    body_md: `## En bref
- Santé.fr déconseille les activités à **risque de chocs sur le ventre** : **sports de combat**, **sports de ballon** et **jeux de raquettes**.
- Santé publique France cite notamment **basket, handball, boxe, karaté et judo**.
- Le guide du ministère chargé des Sports conseille d’éviter les **sports de contact** et la **compétition** à partir du **2e trimestre**.
- Vous pouvez souvent **rester impliquée** dans votre club autrement.

## Comprendre
Dans ces sports, le risque ne vient pas seulement de l’effort, mais des **contacts** et des **projectiles** : un coup, un plaquage, un ballon ou une balle reçus sur le ventre, une chute au cours d’une action. On ne maîtrise ni les gestes des autres joueurs ni la trajectoire d’un ballon.

S’y ajoutent les **changements rapides de direction**, les **sauts** et les **arrêts brusques**, qui sollicitent des articulations plus souples pendant la grossesse (le guide du ministère signale un risque accru d’entorse) et un équilibre modifié par le ventre. Ces sports sont aussi souvent pratiqués à **haute intensité**, alors que la recommandation pendant la grossesse est une intensité modérée.

## Au quotidien
### Sports de combat (judo, karaté, boxe, lutte…)
- Arrêtez les combats, les chutes et les projections.
- Selon votre club et avec l’accord de votre médecin ou de votre sage-femme, un travail technique seul, sans partenaire ni impact, peut parfois être envisagé au début.
- Le renforcement doux et les étirements entretiennent votre condition.

### Sports collectifs (football, basket, handball, volley, rugby…)
- Les matchs et les oppositions sont à éviter.
- Vous pouvez participer à l’**échauffement** sans contact ou à des exercices individuels doux, si votre club l’accepte.
- Restez dans l’équipe autrement : arbitrage à la table, encadrement des plus jeunes, vie du club.

### Sports de raquette (tennis, badminton, squash, padel…)
- Les déplacements rapides, les sauts et le risque de recevoir une balle sont les principaux problèmes.
- Le squash, en espace fermé et à grande vitesse, expose particulièrement aux chocs.
- Quelques échanges tranquilles, sans courir après la balle, peuvent parfois être envisagés au 1er trimestre si vous pratiquiez déjà, après en avoir parlé avec votre professionnel. Le guide du ministère indique qu’au 1er trimestre la pratique peut se poursuivre sans rechercher la performance, sauf avis contraire.

### Remplacer l’intensité
- Endurance : marche active, natation, vélo fixe.
- Renforcement : séances douces une à trois fois par semaine.
- Mobilité et respiration : yoga ou pilates prénatals.

## Questions fréquentes
**Je suis licenciée, que deviennent ma licence et mon certificat ?**
Les règles dépendent de votre fédération. Renseignez-vous auprès de votre club ; certaines fédérations proposent des pratiques adaptées pendant et après la grossesse, selon le guide du ministère.

**Je ne savais pas que j’étais enceinte et j’ai joué un match, est-ce grave ?**
Sans choc ni symptôme, signalez-le à votre prochain rendez-vous. Après un coup sur le ventre, ou en cas de saignement ou de douleur, consultez rapidement.

**Le ping-pong est-il concerné ?**
Les sources ne le citent pas précisément. Le risque de choc est faible, mais les déplacements rapides demandent de la prudence : jouez tranquillement.

**Puis-je entraîner des enfants ?**
Oui, en restant à l’écart des contacts et des tirs.

## Quand demander conseil
Après tout coup ou choc sur le ventre, contactez votre maternité ou votre médecin, même si vous vous sentez bien. Consultez en urgence en cas de saignement, de perte de liquide, de douleurs, de contractions, ou si votre bébé bouge moins. ${URG}

${FIN}`,
  }),
  a({
    slug: 'plongee-sports-extremes-grossesse',
    title: 'Plongée sous-marine et sports extrêmes : à éviter pendant toute la grossesse',
    summary: 'La plongée en bouteille est interdite quelle que soit la période de grossesse selon le ministère chargé des Sports ; rafting, surf et parachutisme sont aussi déconseillés.',
    category: 'sport', tags: ['plongée', 'plongée sous-marine', 'surf', 'rafting', 'parachutisme', 'sports extrêmes', 'vacances', 'enceinte'],
    sources: [S.guideSports, S.santeQuelles, S.santeVoyages],
    safety_critical: true,
    body_md: `## En bref
- Le guide du ministère chargé des Sports indique que la **plongée est interdite quelle que soit la période** de la grossesse.
- Santé.fr la dit **fortement déconseillée**, tout comme les activités « extrêmes » : **rafting, surf, parachutisme**.
- En vacances, Santé.fr conseille d’éviter les activités inadaptées, notamment la **plongée** et le **trekking**.
- La **baignade** et la nage en surface, avec masque et tuba, restent possibles.

## Comprendre
La plongée sous-marine avec bouteille expose à des variations de pression importantes. Les recommandations françaises consultées ne détaillent pas les mécanismes, mais elles sont unanimes : la plongée est à **éviter pendant toute la grossesse**, sans période autorisée, et le guide du ministère emploie le mot « interdite ».

Les activités dites « extrêmes » (rafting, surf, parachutisme, mais aussi la plupart des sports de glisse et de sensations) combinent **vitesse**, **chutes possibles**, **chocs** et parfois **eau agitée**. Ce sont précisément les risques que les recommandations demandent d’éviter pendant la grossesse.

## Au quotidien
### Vous avez prévu des vacances de plongée
- Reportez vos plongées après la grossesse, et parlez de la date de reprise avec votre médecin après l’accouchement.
- Profitez de la **randonnée palmée** en surface avec masque et tuba, dans une zone calme et surveillée, sans apnée profonde.
- Explorez autrement : bateau à fond de verre, aquariums, balades sur le littoral.

### Vous avez plongé sans savoir que vous étiez enceinte
Signalez-le à votre sage-femme ou à votre médecin lors de votre prochain rendez-vous, sans attendre si vous avez des symptômes. Il ou elle vous dira si un suivi particulier est utile.

### Activités nautiques et de sensations
- **Surf, kitesurf, planche à voile, ski nautique, bouée tractée, jet-ski** : risques de chute et de choc, à éviter.
- **Rafting, canyoning** : chocs et eau agitée, à éviter.
- **Parachutisme, saut à l’élastique, parapente** : à éviter.
- **Parcs d’attractions** : les sources consultées n’en parlent pas, mais les secousses et chocs relèvent de la même logique ; renseignez-vous auprès du parc et de votre professionnel.

### À la place
- **Natation** et **marche dans l’eau** : conseillées tout au long de la grossesse.
- **Paddle** sur eau très calme ? Il demande de l’équilibre et expose à une chute dans l’eau ; demandez l’avis de votre professionnel, ou pratiquez assise ou à genoux.
- **Kayak** de balade sur un plan d’eau calme, avec gilet, si votre professionnel vous y autorise.

## Questions fréquentes
**L’apnée en piscine est-elle possible ?**
Les recommandations demandent de ne pas bloquer sa respiration pendant l’effort. Nager en surface en respirant régulièrement est préférable à l’apnée.

**Le snorkeling (masque et tuba) est-il concerné ?**
Le guide du ministère cite le masque et le tuba comme possibles pour nager. Restez en surface, en eau calme et surveillée.

**Peut-on faire un baptême de plongée au 1er trimestre ?**
Non : le guide du ministère indique que la plongée est interdite quelle que soit la période de grossesse.

**Et le jacuzzi ou le spa après une baignade ?**
Les sources consultées ne traitent pas de ce point : demandez conseil à votre sage-femme avant de vous plonger dans une eau très chaude.

## Quand demander conseil
Après une chute, un choc ou un malaise pendant une activité nautique, sortez de l’eau et consultez. ${STOP} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ trimestre par trimestre
  a({
    slug: 'sport-premier-trimestre-fatigue-nausees',
    title: 'Bouger au 1er trimestre : avec la fatigue et les nausées',
    summary: 'Au 1er trimestre, l’activité peut souvent se poursuivre sans chercher la performance ; comment faire quand la fatigue et les nausées s’en mêlent, et comment démarrer si vous étiez peu active.',
    category: 'sport', tags: ['premier trimestre', 'début de grossesse', 'fatigue', 'nausées', 'sport', 'enceinte', '1er trimestre'],
    min_week: 1, max_week: 14,
    sources: [S.guideSports, S.hasSynthese, S.spfBrochure],
    body_md: `## En bref
- Au 1er trimestre, le guide du ministère chargé des Sports indique que la pratique peut **se poursuivre sans rechercher la performance**, sauf avis contraire du professionnel.
- Si vous étiez peu active : **15 minutes**, au moins **3 jours par semaine**, pour atteindre **30 minutes par jour avant la fin du 1er trimestre**, selon Santé publique France.
- La **fatigue importante** est une raison de lever le pied : Santé publique France la cite explicitement.
- La **plongée** est à proscrire dès le début de la grossesse.

## Comprendre
Les premières semaines sont souvent marquées par une grande fatigue et, souvent, des nausées. Le corps change beaucoup, même si le ventre ne se voit pas encore. C’est pourtant une bonne période pour installer une habitude : Santé publique France propose aux femmes peu actives d’atteindre progressivement 30 minutes d’activité modérée par jour **avant la fin du 3e mois**.

Pour les sportives, le guide du ministère est clair : au 1er trimestre, la pratique peut se poursuivre, sauf avis contraire du professionnel, mais **sans rechercher la performance**. La HAS précise que pour les sportives de haut niveau, la compétition reste possible au 1er trimestre.

Les recommandations françaises indiquent aussi qu’une activité modérée et régulière n’augmente pas le risque d’accouchement prématuré. En cas d’antécédent de fausses couches à répétition, la HAS demande d’évaluer la pratique avec l’obstétricien.

## Au quotidien
### Les jours de fatigue
- **Fractionnez** : 3 fois 10 minutes de marche comptent autant que 30 minutes d’affilée.
- **Baissez l’intensité** plutôt que de tout arrêter, si vous en avez envie.
- **Reposez-vous** sans culpabiliser quand la fatigue est forte : la régularité sur la durée compte plus qu’une séance.

### Avec des nausées
- Bougez au moment de la journée où vous vous sentez le mieux, souvent pas au réveil.
- Prenez une petite collation avant l’effort si l’estomac vide aggrave les nausées.
- Préférez l’air frais : une marche dehors est souvent mieux tolérée qu’une salle de sport.
- Buvez par petites gorgées pendant et après.

### Si vous étiez déjà sportive
- Gardez votre activité en baissant l’intensité : vous devez pouvoir parler pendant l’effort.
- Évitez les sports à risque de chute et de choc, déconseillés pendant toute la grossesse par Santé publique France.
- Parlez de votre pratique à votre sage-femme ou à votre médecin dès la première consultation.

### Si vous débutez
- Marche, natation, gymnastique douce, yoga ou pilates prénatals sont des portes d’entrée faciles.
- Augmentez de quelques minutes chaque semaine.

## Questions fréquentes
**Le sport peut-il provoquer une fausse couche ?**
Les sources consultées ne décrivent pas de lien entre une activité modérée et la fausse couche. En cas d’antécédents de fausses couches à répétition, la HAS conseille d’évaluer l’activité avec votre obstétricien.

**Dois-je attendre la première échographie pour bouger ?**
Non, sauf avis contraire de votre professionnel. Parlez-en lors de la première consultation.

**J’ai des saignements légers, puis-je continuer ?**
Arrêtez l’activité et contactez votre médecin ou votre sage-femme : un saignement fait partie des signes qui doivent faire arrêter et consulter.

**Les abdominaux sont-ils encore possibles ?**
Les recommandations françaises conseillent de ne plus faire d’abdominaux classiques à partir du 4e mois. Dès maintenant, privilégiez un renforcement d’intensité modérée, en soufflant à l’effort, comme le recommande la HAS.

## Quand demander conseil
Des saignements ou des douleurs dans le bas du ventre doivent faire consulter rapidement. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'sport-deuxieme-trimestre-adapter',
    title: 'Bouger au 2e trimestre : le moment d’adapter sa pratique',
    summary: 'Au 2e trimestre, l’énergie revient souvent mais le corps change : pas de compétition, d’intensité forte, de contact ni de risque de chute, et plus de position prolongée sur le dos.',
    category: 'sport', tags: ['deuxième trimestre', '2e trimestre', 'sport', 'enceinte', 'équilibre', 'position sur le dos', 'adaptation'],
    min_week: 15, max_week: 28,
    sources: [S.guideSports, S.santeQuelles, S.hasSynthese],
    body_md: `## En bref
- Le guide du ministère chargé des Sports conseille d’éviter au 2e trimestre la **compétition**, les **activités intenses**, les **sports de contact** et les **activités à risque de chute**.
- Le ventre déplace le **centre de gravité**, surtout **à partir du 4e mois** selon Santé.fr.
- La position **allongée sur le dos** est à éviter de façon prolongée à partir du **5e mois** selon le guide du ministère, et à partir de **24 semaines d’aménorrhée** selon la HAS.
- C’est souvent une période où l’on se sent **plus en forme** : un bon moment pour une activité régulière.

## Comprendre
Pour beaucoup de femmes, la fatigue et les nausées diminuent au 2e trimestre. L’envie de bouger revient, et c’est une bonne période pour profiter des bienfaits de l’activité physique : sommeil, moral, circulation, dos.

Mais le corps change aussi de façon visible. Le ventre s’arrondit, ce qui modifie l’équilibre et la posture. Les ligaments s’assouplissent, ce qui augmente le risque d’entorse selon le guide du ministère. Et à partir d’un certain stade, la position allongée sur le dos est à éviter : la HAS cite notamment le malaise dans cette position. Les recommandations demandent donc d’adapter, pas d’arrêter.

## Au quotidien
### Ce qu’on adapte
- **Intensité** : modérée, au test de la parole. Plus de fractionné intense ni de compétition.
- **Équilibre** : les pirouettes, le vélo sur route, le ski, le roller et l’équitation sont déconseillés ; préférez des activités stables.
- **Positions** : remplacez les exercices sur le dos par la position sur le côté, à quatre pattes, assise ou debout.
- **Abdominaux** : plus d’abdominaux classiques à partir du 4e mois selon Santé.fr ; gardez le travail doux du transverse en soufflant.
- **Station debout immobile prolongée** : à éviter, selon la HAS.

### Ce qui convient bien
- **Marche** active, éventuellement avec bâtons.
- **Natation** et **gymnastique aquatique** prénatale.
- **Vélo fixe** à intensité modérée.
- **Yoga, pilates, gymnastique douce** prénatals.
- **Renforcement** doux une à trois fois par semaine.

### Le bon volume
La HAS recommande **150 à 180 minutes** par semaine d’activité d’endurance, réparties sur au moins trois jours, avec **10 à 15 minutes** d’échauffement et de récupération par séance.

### S’équiper au fil des mois
- Brassière et vêtements adaptés au ventre et à la poitrine.
- Chaussures bien ajustées : les pieds peuvent gonfler.
- Une gourde systématique.

## Questions fréquentes
**Comment savoir si j’en fais trop ?**
Si vous ne pouvez plus parler pendant l’effort, ralentissez. Une fatigue intense qui persiste après la séance est aussi un signal pour alléger.

**J’ai mal au pubis ou au bas du dos, dois-je arrêter ?**
Réduisez les activités qui déclenchent la douleur et parlez-en à votre sage-femme. La natation est souvent mieux tolérée.

**Puis-je partir en voyage sportif ?**
Parlez-en d’abord à votre sage-femme ou à votre médecin. Les activités à risque de chute ou de contact et la plongée restent à éviter, et la HAS déconseille l’effort en altitude.

**Et si mon médecin me demande de réduire l’activité ?**
Suivez son avis : certaines situations (col, placenta, tension) justifient une adaptation personnalisée.

## Quand demander conseil
Des contractions régulières, une perte de liquide, des saignements ou un mal de tête inhabituel doivent faire arrêter et consulter. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'sport-troisieme-trimestre-fin-de-grossesse',
    title: 'Bouger au 3e trimestre et au 9e mois : rester active en douceur',
    summary: 'En fin de grossesse, la marche, la gymnastique douce et l’eau sont à privilégier ; on raccourcit les séances, on écoute son souffle et on connaît les signes qui doivent faire consulter.',
    category: 'sport', tags: ['troisième trimestre', '3e trimestre', '8e mois', '9e mois', 'fin de grossesse', 'marche', 'sport doux'],
    min_week: 28, max_week: 42,
    sources: [S.guideSports, S.santeAP, S.hasSynthese],
    body_md: `## En bref
- Au **8e mois**, le guide du ministère chargé des Sports conseille de privilégier la **marche**, la **gymnastique douce**, la **natation** et le **milieu aquatique**.
- La **respiration** peut devenir plus difficile au 3e trimestre, rappelle Santé.fr : on adapte les exercices.
- On évite toujours la position **allongée sur le dos** et la **station debout immobile prolongée**.
- Les séances **plus courtes et plus fréquentes** sont souvent plus confortables.

## Comprendre
Au 3e trimestre, le ventre prend beaucoup de place : la respiration peut devenir plus difficile, l’équilibre change et pèse sur le dos, le bassin et le périnée. Le sommeil peut être plus léger, les jambes plus lourdes.

Bouger reste utile : la marche et l’eau aident souvent à soulager les jambes et le dos, et entretiennent le souffle pour l’accouchement. Les autorités de santé présentent l’activité modérée comme favorable au sommeil, à la circulation veineuse et à la récupération après la naissance. L’essentiel est d’adapter l’intensité, la durée et le type d’activité à vos sensations du jour.

## Au quotidien
### Les activités à privilégier
- **Marche** : plusieurs petites sorties dans la journée, sur terrain plat, avec de bonnes chaussures.
- **Natation ou marche dans l’eau** : l’eau porte le ventre et soulage les jambes.
- **Gymnastique douce** : mobilité du bassin, respiration, étirements doux.

### Les adaptations
- **Positions** : sur le côté, à quatre pattes, assise ou debout ; jamais longtemps sur le dos.
- **Souffle** : si vous ne pouvez plus parler, ralentissez.
- **Durée** : écoutez la fatigue ; des séances de 10 à 20 minutes peuvent suffire.
- **Équilibre** : appuyez-vous sur un mur ou une chaise, évitez les escabeaux et les sols glissants.
- **Chaleur** : sorties le matin ou le soir, en été.

### Bouger au quotidien
- Vous lever et marcher **au moins toutes les deux heures** ; la HAS propose de bouger au moins une minute toutes les heures.
- Pendant les longs trajets en voiture, faire des pauses pour marcher.
- Éviter de rester debout immobile longtemps (files d’attente, transports) : demandez une place assise.

### Préparer l’après
Le guide du ministère rappelle qu’après un accouchement par voie basse, la reprise du sport se fait en général après six semaines, et qu’elle ne doit pas se faire au détriment de la rééducation du périnée. Santé.fr souligne que l’activité physique pendant la grossesse facilite la récupération après l’accouchement.

## Questions fréquentes
**Marcher fait-il venir le travail ?**
Les sources consultées ne le disent pas. Marchez pour votre confort ; votre sage-femme vous dira quand partir à la maternité.

**Puis-je encore nager au 9e mois ?**
Oui si votre professionnel ne vous l’a pas déconseillé, et tant que vous n’avez ni perte de liquide ni saignement.

**J’ai des contractions pendant la marche, que faire ?**
Arrêtez-vous et reposez-vous. Des contractions régulières et douloureuses qui ne cessent pas au repos doivent faire appeler la maternité.

**Je suis trop fatiguée pour bouger, est-ce un problème ?**
Non : la fatigue de fin de grossesse est réelle. Quelques pas et des étirements doux suffisent certains jours.

## Quand demander conseil
Contactez la maternité si votre bébé bouge moins, en cas de perte de liquide, de saignement, de contractions régulières, de maux de tête violents, de troubles de la vue ou de gonflement brutal du visage et des mains. ${STOP} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ profils et repères
  a({
    slug: 'debuter-le-sport-enceinte-sedentaire',
    title: 'Je n’étais pas sportive : comment commencer à bouger enceinte',
    summary: 'Il n’est pas trop tard pour commencer : un démarrage progressif, 15 minutes trois fois par semaine, puis 30 minutes par jour, avec des activités accessibles.',
    category: 'sport', tags: ['débuter', 'sédentaire', 'pas sportive', 'commencer le sport', 'enceinte', 'marche', 'progressif'],
    sources: [S.santeAP, S.guideSports, S.spfBrochure],
    body_md: `## En bref
- **Commencez par 15 minutes**, au moins **3 jours par semaine**, puis augmentez pour atteindre **30 minutes par jour avant la fin du 3e mois**, propose Santé.fr.
- Le guide du ministère chargé des Sports suggère pour débuter : **natation, marche nordique, low-impact, étirements, yoga prénatal, pilates, gymnastique douce**.
- **Toute activité compte** : déplacements, ménage, jardinage, jeux avec un aîné.
- La **régularité** compte plus que l’intensité.

## Comprendre
Beaucoup de femmes n’ont pas d’activité sportive avant leur grossesse. La grossesse peut être l’occasion de commencer, à condition d’y aller doucement. Les bénéfices décrits par Santé publique France concernent toutes les femmes : meilleure forme, meilleur sommeil, moins d’anxiété, aide pour limiter une prise de poids excessive, les troubles du transit et les douleurs de dos, meilleure circulation dans les jambes.

Santé.fr rappelle que l’activité physique ne se limite pas au sport : elle comprend les **déplacements**, les **tâches domestiques**, les **activités professionnelles** et les **loisirs**. Réduire le temps passé assise est aussi bénéfique, même lorsqu’on fait déjà ses 30 minutes.

## Au quotidien
### Un plan simple sur quelques semaines
1. **Semaines 1 à 2** : 15 minutes de marche, 3 jours par semaine, à une allure où vous pouvez parler.
2. **Semaines 3 à 4** : 20 minutes, 4 jours par semaine.
3. **Ensuite** : 30 minutes par jour, éventuellement en 2 ou 3 fois, en ajoutant une séance de natation ou de gymnastique douce.
4. **Quand vous êtes à l’aise** : un peu de renforcement doux une à deux fois par semaine.

Adaptez ce rythme à votre fatigue et à l’avis de votre professionnel.

### Trouver une activité qui vous plaît
- **Seule** : marche, vidéos de gymnastique prénatale.
- **Accompagnée** : promenades à deux, cours en groupe à la piscine municipale, yoga ou pilates prénatals.
- **Avec un aîné** : parc, balade à vélo pour l’enfant pendant que vous marchez, jeux de ballon doux sans courir.

### Lever les freins
- **« Je n’ai pas le temps »** : 3 × 10 minutes réparties dans la journée comptent.
- **« Je suis trop fatiguée »** : commencez par 5 minutes, puis voyez comment vous vous sentez.
- **« J’ai peur de mal faire »** : un cours encadré ou une **Maison sport-santé**, citée par le guide du ministère, peuvent vous accompagner.
- **« Je n’aime pas le sport »** : jardiner, danser dans le salon ou marcher pour aller faire les courses, c’est déjà bouger.

### Sécurité
Évitez les activités à risque de chute ou de choc, la plongée, l’altitude et la chaleur. Buvez et soufflez à l’effort.

## Questions fréquentes
**Faut-il un certificat médical ?**
Pas pour marcher. Pour un club ou un cours, renseignez-vous sur ses conditions. Dans tous les cas, parlez de votre projet à votre sage-femme ou à votre médecin.

**Est-ce trop tard au 6e mois ?**
Non. Commencez doucement avec des activités douces comme la marche ou la natation.

**Puis-je me faire accompagner gratuitement ?**
Le guide du ministère chargé des Sports cite les **Maisons sport-santé**, qui accueillent et orientent vers une activité adaptée. Renseignez-vous sur celle la plus proche de chez vous.

**J’ai un surpoids, puis-je commencer ?**
Oui, avec un démarrage progressif. Le guide du ministère cite l’obésité sévère (IMC supérieur à 40) parmi les situations à évaluer avec le médecin.

## Quand demander conseil
Demandez l’avis de votre sage-femme ou de votre médecin avant de commencer si vous avez une maladie chronique ou une complication. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'sportive-enceinte-adapter-entrainement-competition',
    title: 'Sportive régulière ou de haut niveau : adapter son entraînement pendant la grossesse',
    summary: 'Les sportives peuvent souvent continuer en adaptant avec leur professionnel de santé et leur entraîneur : pas d’objectif de performance, compétition à éviter à partir du 2e trimestre.',
    category: 'sport', tags: ['sportive', 'compétition', 'haut niveau', 'entraînement', 'athlète', 'club', 'enceinte'],
    sources: [S.guideSports, S.hasSynthese, S.sportsHN],
    body_md: `## En bref
- Le guide du ministère chargé des Sports indique qu’une sportive enceinte **adapte sa pratique avec son professionnel de santé et son entraîneur**, **sans viser la performance**.
- Au **1er trimestre**, la pratique peut se poursuivre sauf avis contraire ; au **2e trimestre**, on évite **compétition, activités intenses, contact et risque de chute**.
- La HAS indique que pour les sportives de **haut niveau**, la compétition est possible au **1er trimestre**, puis devient difficile à concilier.
- Un **guide « Sport de haut niveau et maternité »** a été publié par le ministère.

## Comprendre
Être habituée à l’effort est un atout : votre corps tolère mieux l’activité, et garder une pratique adaptée aide à traverser la grossesse et à reprendre ensuite. Mais la grossesse change les objectifs. Il ne s’agit plus de progresser ou de gagner, mais d’entretenir sa forme et son bien-être.

La HAS précise que, pour les sportives de haut niveau, la compétition reste possible au 1er trimestre ; au-delà, il s’agit d’un compromis entre certains effets de la grossesse et la prise de poids, souvent difficile à tenir. Le ministère chargé des Sports a publié un guide destiné aux sportives qui envisagent la maternité, à leur encadrement, leur club et leur fédération : il traite de l’adaptation de l’entraînement et de la nutrition, des changements du corps et de l’esprit, ainsi que des démarches et des droits.

## Au quotidien
### Construire le plan avec son équipe
- Informez tôt votre **médecin ou sage-femme** et votre **entraîneur**, pour adapter ensemble.
- Faites préciser vos repères d’intensité : le guide du ministère indique que la fréquence cardiaque maximale se détermine avec le professionnel de santé.
- Un **questionnaire d’aptitude** (repris par le guide du ministère et la HAS) aide à faire le point.

### Ce qui change
- **Intensité** : modérée ; le test de la parole reste un repère simple.
- **Durée** : la HAS conseille de ne pas dépasser **60 à 90 minutes** par séance, avec échauffement et récupération de 10 à 15 minutes.
- **Disciplines** : arrêter les sports de contact, de combat, à risque de chute, la plongée et l’altitude.
- **Musculation** : charges modérées, sans apnée ni blocage de la respiration.
- **Chaleur** : séances aux heures fraîches, hydratation régulière.
- **Alimentation** : la HAS rappelle d’adapter les apports à la dépense, à l’IMC et à l’évolution du poids ; un diététicien peut aider.

### Garder sa place dans le sport
- Participer aux entraînements sous une forme adaptée, à la préparation physique ou à l’analyse vidéo.
- Encadrer, arbitrer, s’impliquer dans le club.
- Se renseigner auprès de sa fédération : certaines proposent des pratiques adaptées pendant et après la grossesse.

### Préparer le retour
Le guide du ministère rappelle qu’après un accouchement par voie basse, la reprise se fait en général après six semaines, sans sauter la rééducation périnéale. La HAS déconseille les activités à impact avant cette rééducation.

## Questions fréquentes
**Vais-je perdre tout mon niveau ?**
La crainte d’une baisse de performance est souvent citée par les sportives, selon le ministère chargé des Sports. Les témoignages recueillis insistent sur un accompagnement personnalisé et un retour progressif à la compétition.

**Ai-je des droits particuliers en tant que sportive professionnelle ?**
Ils dépendent de votre statut, de votre contrat et de votre discipline. Le guide du ministère sur le sport de haut niveau et la maternité aide à se repérer dans les démarches.

**Puis-je faire une compétition au 2e trimestre ?**
Le guide du ministère conseille de l’éviter à partir du 2e trimestre.

**Le guide du ministère s’adresse-t-il aussi au club ?**
Oui : il vise les sportives, mais aussi leur encadrement, leur famille, leur club, leur fédération et leurs partenaires. Le partager avec votre entraîneur peut faciliter le dialogue.

## Quand demander conseil
${STOP} ${URG} Si vous traversez une période de doute ou de mal-être, parlez-en à votre sage-femme ; le **3114** répond jour et nuit en cas de détresse.

${FIN}`,
  }),
  a({
    slug: 'intensite-duree-seance-sport-grossesse',
    title: 'Combien, combien de temps, à quelle intensité ? Les repères chiffrés du sport enceinte',
    summary: 'Test de la parole, 30 minutes par jour, 150 à 180 minutes par semaine, échauffement, durée maximale : les repères officiels pour doser l’effort pendant la grossesse.',
    category: 'sport', tags: ['intensité', 'test de la parole', 'durée', 'combien de sport', 'fréquence', 'échauffement', 'enceinte'],
    sources: [S.hasSynthese, S.guideSports, S.santeAP],
    body_md: `## En bref
- **Intensité** : modérée, vous devez pouvoir **tenir une conversation** pendant l’effort (Santé.fr, ministère chargé des Sports).
- **Volume** : au moins **30 minutes par jour**, ou **150 à 180 minutes par semaine** d’endurance réparties sur au moins **3 jours** (HAS).
- **Séance** : **20 à 50 minutes**, **3 à 5 fois par semaine** (ministère) ; **60 à 90 minutes maximum** (HAS).
- **Échauffement et récupération** : **10 à 15 minutes** chacun (HAS).

## Comprendre
Ces repères viennent de plusieurs sources officielles qui se complètent. La HAS s’adresse surtout aux professionnels de santé qui prescrivent l’activité physique ; le guide du ministère chargé des Sports et Santé.fr s’adressent aux femmes enceintes. Ils disent la même chose sur l’essentiel : **une activité régulière, d’intensité modérée**, sauf contre-indication.

L’intensité modérée est la plus simple à repérer avec le **test de la parole** : vous respirez plus vite, vous avez chaud, mais vous pouvez parler par phrases. Si vous ne pouvez plus dire une phrase, l’effort est trop intense. Ce repère est utile car la respiration peut devenir plus difficile au fil de la grossesse, surtout au 3e trimestre, comme le rappelle Santé.fr. Pour les sportives qui utilisent un cardiofréquencemètre, le guide du ministère indique que la fréquence maximale se fixe **avec le professionnel de santé**.

## Au quotidien
### Une semaine type (sans complication)
- **Endurance** : 30 minutes de marche active la plupart des jours, ou 3 à 5 séances de 20 à 50 minutes (natation, vélo fixe, marche).
- **Renforcement** : jusqu’à 3 séances par semaine selon le guide du ministère, **jamais deux jours de suite**.
- **Assouplissement** : à associer aux séances, comme le recommande la HAS.
- **Mouvement au quotidien** : se lever régulièrement ; la HAS propose de bouger au moins une minute toutes les heures.

### Structurer une séance
1. **Échauffement** de 10 à 15 minutes : marche lente, mobilisation douce des articulations.
2. **Corps de séance** à intensité modérée.
3. **Récupération** de 10 à 15 minutes : allure lente, étirements doux, respiration.

### Si vous débutez
Commencez par 15 minutes, au moins 3 jours par semaine, et augmentez progressivement pour atteindre 30 minutes par jour avant la fin du 3e mois, selon Santé.fr.

### Les signes que l’intensité est trop élevée
- Vous ne pouvez plus parler.
- Vous avez la tête qui tourne ou un malaise.
- Une fatigue intense qui persiste après la séance.
- Une sensation de chaleur excessive.

## Questions fréquentes
**30 minutes d’un coup ou en plusieurs fois ?**
Les deux comptent : le guide du ministère cite 2 × 15 minutes ou 3 × 10 minutes.

**Puis-je dépasser ces repères ?**
Une sportive habituée peut faire davantage, avec l’accord de son professionnel. La HAS conseille de ne pas dépasser 60 à 90 minutes par séance.

**Les montres connectées sont-elles fiables pour mesurer l’intensité ?**
Elles donnent une indication. Le test de la parole et vos sensations restent les repères les plus simples.

**Faut-il compter le ménage ou les trajets ?**
Oui, Santé.fr rappelle que l’activité physique comprend les déplacements et les tâches domestiques.

## Quand demander conseil
${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'contre-indications-sport-grossesse',
    title: 'Contre-indications au sport pendant la grossesse : quand faut-il s’abstenir ou adapter ?',
    summary: 'Certaines situations obstétricales ou médicales imposent d’éviter l’activité intense ou de l’évaluer avec l’obstétricien : la liste des contre-indications absolues et relatives de la HAS.',
    category: 'sport', tags: ['contre-indication', 'repos', 'placenta prævia', 'col', 'pré-éclampsie', 'menace accouchement prématuré', 'sport', 'enceinte'],
    sources: [S.hasSynthese, S.guideSports, S.ameliDiabete],
    safety_critical: true,
    body_md: `## En bref
- La HAS distingue des contre-indications **absolues** et **relatives** à l’activité physique pendant la grossesse.
- En cas de contre-indication absolue, le guide du ministère chargé des Sports précise que l’**activité intense** est exclue mais que les **activités de la vie quotidienne** restent possibles.
- Les contre-indications relatives demandent une **évaluation bénéfices-risques avec l’obstétricien**.
- C’est votre **médecin ou votre sage-femme** qui précise ce qui s’applique à vous.

## Comprendre
L’activité physique est recommandée à la plupart des femmes enceintes. Mais certaines situations rendent l’effort déconseillé, parce qu’il pourrait aggraver un problème de la grossesse ou de santé. La HAS recommande une consultation dédiée à l’activité physique et un avis obstétrical en cas de **complication** ou de **maladie chronique**.

### Contre-indications absolues (HAS)
- Rupture prématurée des membranes (perte des eaux).
- Travail prématuré en cours, ou antécédent d’au moins deux naissances prématurées.
- Saignement vaginal persistant inexpliqué, ou placenta prævia après 24 semaines d’aménorrhée.
- Pré-éclampsie.
- Béance du col ou cerclage.
- Signes de retard de croissance du bébé.
- Grossesse de rang élevé (triplés et plus).
- Épilepsie non contrôlée.
- Maladies cardiovasculaires ou pulmonaires aiguës ou graves, certaines maladies du sang et maladies générales.

### Contre-indications relatives (HAS)
Fausses couches à répétition, hypertension de la grossesse, grossesse gémellaire à partir de 28 semaines d’aménorrhée, anémie importante ou qui donne des symptômes, diabète mal équilibré, malnutrition, troubles du comportement alimentaire, obésité sévère (IMC supérieur à 40), limitations orthopédiques (la natation reste souvent possible), maladies cardiaques ou pulmonaires légères à modérées, diabète de type 1, hypertension ou maladie thyroïdienne non contrôlés, tabagisme important.

## Au quotidien
### Si l’on vous a demandé d’arrêter le sport
- Demandez **ce qui reste possible** : marche courte, déplacements, mouvements doux des jambes, respiration.
- Faites préciser s’il s’agit de **repos strict** ou d’un simple arrêt du sport.
- Demandez **jusqu’à quand** et à quel moment la situation sera réévaluée.

### Si vous êtes dans une situation « relative »
- Préparez votre rendez-vous : votre activité actuelle, ce que vous aimeriez faire, vos sensations.
- Un **programme adapté** peut souvent être construit : intensité réduite, activités portées comme la natation, séances plus courtes.

### Prendre soin de soi autrement
Être privée d’activité peut peser sur le moral. Parlez-en à votre sage-femme, gardez des activités qui font du bien (lecture, sorties calmes, respiration) et demandez de l’aide à votre entourage.

## Questions fréquentes
**On m’a diagnostiqué un placenta bas au début, dois-je arrêter ?**
La HAS cite le placenta prævia **après 24 semaines d’aménorrhée**. Demandez à votre professionnel ce qui s’applique à votre situation et à votre terme.

**Le diabète gestationnel empêche-t-il le sport ?**
Non : ameli.fr indique qu’en l’absence de contre-indication liée à la grossesse, une activité physique régulière fait partie de sa prise en charge, car elle contribue à réguler la glycémie. C’est le diabète mal équilibré que la HAS cite comme contre-indication relative.

**J’attends des jumeaux, puis-je bouger ?**
La grossesse gémellaire devient une contre-indication relative à partir de 28 semaines d’aménorrhée selon la HAS. Demandez conseil à votre obstétricien.

**Je fume, est-ce une contre-indication ?**
La HAS cite le tabagisme important comme contre-indication relative. Votre sage-femme peut aussi vous accompagner pour arrêter.

## Quand demander conseil
Toute perte de liquide, tout saignement ou toute contraction régulière impose d’arrêter l’activité et de contacter la maternité. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'signes-arreter-effort-enceinte',
    title: 'Pendant l’effort : les signes qui doivent faire arrêter et consulter',
    summary: 'Essoufflement qui persiste, douleur thoracique, contractions, saignement, perte de liquide, vertiges, mollet douloureux : la liste officielle des signes d’arrêt et quoi faire.',
    category: 'sport', tags: ['signes d’alerte', 'arrêter le sport', 'contractions', 'saignement', 'malaise', 'essoufflement', 'urgence', 'enceinte'],
    sources: [S.hasSynthese, S.guideSports],
    safety_critical: true,
    body_md: `## En bref
- La HAS et le ministère chargé des Sports listent des **signes qui imposent d’arrêter l’activité** et de **consulter**.
- Une **douleur ou une pression dans la poitrine** est une **urgence** : appelez le **15**.
- Une **perte de liquide** ou un **saignement** doit faire contacter la maternité sans attendre.
- Ces signes ne veulent pas forcément dire que quelque chose de grave arrive, mais ils doivent être **évalués par un professionnel**.

## Comprendre
L’activité physique pendant la grossesse est recommandée, mais certains signes indiquent que l’effort ne convient pas à ce moment-là, ou qu’un problème de santé doit être recherché. Les documents officiels de la HAS et du ministère chargé des Sports en donnent une liste précise.

### Les signes d’arrêt
- **Essoufflement excessif** qui persiste et n’est pas soulagé par le repos.
- **Douleur ou pression dans la poitrine** : urgence médicale.
- **Contractions utérines** régulières et douloureuses, qui ne cèdent pas au repos.
- **Saignement vaginal**.
- **Perte de liquide** (liquide amniotique).
- **Vertiges, étourdissements, malaise, évanouissement** ou **maux de tête**.
- **Faiblesse musculaire** qui perturbe l’équilibre.
- **Douleur ou gonflement d’un mollet**.
- **Fatigue intense**, citée par le guide du ministère.

## Au quotidien
### Que faire sur le moment ?
1. **Arrêtez** immédiatement l’activité.
2. **Mettez-vous en sécurité** : asseyez-vous ou allongez-vous **sur le côté**, à l’ombre s’il fait chaud.
3. **Ne restez pas seule** : prévenez quelqu’un autour de vous.
4. **Appelez** :
   - le **15** ou le **112** en cas de douleur dans la poitrine, de malaise avec perte de connaissance, de difficulté à respirer importante ou de saignement abondant ;
   - la **maternité** ou votre **sage-femme / médecin** pour les autres signes, sans attendre la prochaine consultation.
5. **Ne reprenez pas** l’activité avant d’avoir eu un avis.

### Préparer ses sorties
- Gardez votre **téléphone** chargé sur vous.
- Notez le **numéro de la maternité** dans vos contacts.
- Préférez des lieux **fréquentés** ou partez accompagnée, surtout en fin de grossesse.
- Emportez de l’**eau** et une **collation**.

### Distinguer ce qui est attendu de ce qui alerte
Pendant un effort modéré, il est attendu de respirer plus vite, d’avoir chaud et de transpirer. Ce qui doit alerter, c’est un essoufflement qui **ne passe pas** au repos, une douleur **inhabituelle**, ou un des signes de la liste ci-dessus. Le **test de la parole** aide à rester dans la bonne zone : si vous ne pouvez plus dire une phrase, ralentissez avant même qu’un signe n’apparaisse.

### Après un épisode
Racontez précisément à votre professionnel ce qui s’est passé : l’activité, l’intensité, la chaleur, le moment de la journée, ce que vous avez mangé et bu. Il pourra adapter vos repères.

## Questions fréquentes
**J’ai eu une petite contraction pendant la marche, dois-je appeler ?**
Une contraction isolée qui cède au repos est à signaler à votre sage-femme. Des contractions **régulières et douloureuses** qui ne cèdent pas au repos doivent faire appeler la maternité.

**J’ai eu la tête qui tourne en me relevant d’un exercice au sol, que faire ?**
Relevez-vous lentement en passant par le côté. Si le vertige se répète ou s’accompagne d’autres signes, parlez-en à votre professionnel.

**Mon mollet est douloureux depuis la randonnée, est-ce une courbature ?**
Une douleur ou un gonflement d’un mollet font partie des signes d’arrêt : consultez rapidement.

**Mon bébé bouge moins depuis ma séance, que faire ?**
Contactez la maternité sans attendre.

## Quand demander conseil
Au moindre doute, n’hésitez pas à appeler votre maternité, de jour comme de nuit. ${URG}

${FIN}`,
  }),
  a({
    slug: 'sport-chaleur-pollution-hydratation-enceinte',
    title: 'Chaleur, pollution, hydratation : faire du sport enceinte selon les conditions',
    summary: 'Par forte chaleur ou pic de pollution, on adapte ou on reporte : heures fraîches, eau avant-pendant-après, pas d’effort entre 12 h et 18 h en épisode de chaleur, signes du coup de chaleur.',
    category: 'sport', tags: ['chaleur', 'canicule', 'pollution', 'hydratation', 'boire', 'coup de chaleur', 'sport', 'enceinte'],
    sources: [S.santeChaleur, S.spfBrochure, S.hasSynthese],
    safety_critical: true,
    body_md: `## En bref
- La HAS demande d’éviter l’activité dans les **environnements chauds, humides** ou en **altitude** pendant la grossesse.
- En épisode de fortes chaleurs, Santé.fr conseille d’**éviter tout entraînement entre 12 h et 18 h** et de **s’hydrater avant, pendant et après** l’effort.
- En cas de **pollution importante**, Santé publique France conseille de **limiter** les activités ; au-delà du **seuil d’alerte**, d’**éviter toute activité physique**.
- Le **coup de chaleur** est une **urgence** : appelez le **15**.

## Comprendre
Pendant l’effort, le corps produit de la chaleur. La HAS recommande d’adapter la durée et l’intensité pour éviter une élévation excessive de la température du corps, de **s’hydrater très régulièrement** et de porter des vêtements adaptés. Santé.fr rappelle qu’une bonne hydratation est indispensable pendant la grossesse, surtout par forte chaleur, et propose de boire **au moins 1,5 à 2 litres d’eau par jour**.

La pollution de l’air est un autre facteur à prendre en compte. Santé publique France conseille, lors d’un épisode de pollution importante, de limiter les activités physiques en plein air comme en intérieur, ainsi que les déplacements près des grands axes, surtout aux heures de pointe.

## Au quotidien
### Par temps chaud
- **Heures fraîches** : tôt le matin ou en soirée.
- **Ombre** : parcs boisés, bords de rivière, piscine.
- **Tenue** légère, claire, chapeau.
- **Eau** avant, pendant et après ; Santé.fr rappelle que **seule l’eau hydrate efficacement**, et conseille d’éviter l’alcool, le café et les boissons très sucrées.
- **Durée et intensité réduites**.
- **Salles** : évitez les salles surchauffées et les cours en salle chauffée.

### Pendant un épisode de pollution
- Consultez les **alertes** de votre région.
- Reportez les sorties sportives ou remplacez-les par quelques étirements doux, sans chercher l’effort.
- Éloignez-vous des grands axes routiers pour marcher.

### Par grand froid
- Couvrez-vous en couches, protégez les extrémités.
- Attention aux sols glissants (verglas, feuilles mouillées) : privilégiez une activité en intérieur.

### Reconnaître le coup de chaleur
Santé.fr décrit comme une **urgence** : fièvre supérieure à 39 °C, peau chaude, rouge et sèche, maux de tête intenses, vertiges, nausées, propos incohérents, comportement inhabituel ou perte de connaissance. Appelez le **15** ou le **112** sans attendre.

### Une ressource
La plateforme **Canicule info service** répond au **0 800 06 66 66** (appel gratuit, de 9 h à 19 h, du lundi au dimanche).

## Questions fréquentes
**Combien boire pendant une séance ?**
Les sources ne fixent pas de quantité par séance : buvez régulièrement, sans attendre la soif, avant, pendant et après.

**La piscine est-elle une bonne idée en été ?**
Oui, aux heures les moins chaudes et en dehors de l’affluence, en buvant de l’eau régulièrement et en vous protégeant du soleil au bord du bassin.

**Puis-je faire du sport dans une pièce climatisée ?**
Oui, c’est même une bonne solution par forte chaleur, en restant à intensité modérée.

**Les boissons pour sportifs sont-elles utiles ?**
Les sources consultées recommandent l’eau. Parlez à votre sage-femme de vos besoins si vous faites des séances longues.

## Quand demander conseil
Consultez en cas de malaise, de maux de tête, de vertiges ou de contractions après un effort par temps chaud. ${STOP} ${URG}

${FIN}`,
  }),
  a({
    slug: 'jumeaux-grossesse-multiple-activite-physique',
    title: 'Grossesse gémellaire ou multiple : quelle activité physique ?',
    summary: 'En cas de jumeaux ou de triplés, l’activité se décide avec le professionnel qui suit la grossesse : la pratique sportive est généralement déconseillée, avec une réduction progressive.',
    category: 'sport', tags: ['jumeaux', 'grossesse gémellaire', 'grossesse multiple', 'triplés', 'sport', 'repos', 'enceinte'],
    sources: [S.santeQuelles, S.hasSynthese, S.guideSports],
    safety_critical: true,
    body_md: `## En bref
- Santé.fr conseille de **demander l’avis du professionnel** qui suit la grossesse : la pratique sportive est **généralement déconseillée** et une **réduction progressive** de l’activité peut être recommandée.
- Si vous étiez active, poursuivre une activité **en début de grossesse** peut être envisagé, en **écoutant votre corps**.
- La HAS classe la grossesse gémellaire comme **contre-indication relative à partir de 28 semaines d’aménorrhée**, et la grossesse de **triplés ou plus** comme **contre-indication absolue**.
- Les **déplacements** et les **activités de la vie quotidienne** restent possibles selon l’avis médical.

## Comprendre
Une grossesse multiple fait l’objet d’un suivi particulier, et les recommandations sur l’activité physique y sont plus prudentes que pour une grossesse unique.

Pour les jumeaux, la HAS retient une contre-indication relative à partir de 28 semaines d’aménorrhée : une évaluation des bénéfices et des risques avec l’obstétricien est alors nécessaire. Santé.fr rappelle que, de façon générale, la pratique sportive est déconseillée en cas de grossesse multiple et que l’avis du professionnel prime. Pour les triplés et plus, l’activité physique soutenue est contre-indiquée. Le guide du ministère chargé des Sports précise qu’en cas de contre-indication absolue, les activités de la vie quotidienne restent possibles, mais pas l’activité intense.

## Au quotidien
### En début de grossesse
- Parlez de votre activité dès la **première consultation**.
- Si vous étiez active, gardez une activité **douce** : marche, natation, gymnastique douce, à intensité modérée.
- Respectez votre **fatigue** et ralentissez quand elle se fait sentir.

### Au fil des mois
- Réduisez **progressivement** la durée et l’intensité, selon l’avis de votre professionnel.
- Privilégiez les activités **portées** (natation, marche dans l’eau) si elles vous sont autorisées.
- Évitez la **station debout immobile prolongée** et les longs trajets.

### Si l’on vous demande de vous reposer
- Faites préciser ce qui reste possible : petits déplacements, mouvements des jambes, exercices de respiration.
- Organisez de l’aide pour les tâches lourdes (courses, ménage, port des aînés).

### Prendre soin du moral
Réduire son activité peut être difficile à vivre. Gardez des moments agréables, des contacts avec vos proches, et parlez de votre ressenti à votre sage-femme.

## Questions fréquentes
**Puis-je continuer la marche quotidienne ?**
Souvent, oui, en début de grossesse et à allure modérée. Demandez à votre obstétricien jusqu’à quand et sous quelle forme.

**Le yoga prénatal est-il adapté ?**
Une pratique douce peut être envisagée avec l’accord de votre professionnel, en évitant la position allongée sur le dos au-delà de 24 semaines d’aménorrhée.

**Pourquoi la limite de 28 semaines pour les jumeaux ?**
C’est le seuil retenu par la HAS pour une évaluation spécifique avec l’obstétricien. Votre suivi personnel peut conduire à un autre conseil.

**Puis-je préparer la naissance par des exercices ?**
Parlez-en à votre sage-femme : elle pourra adapter les exercices de préparation à la naissance à votre situation.

## Quand demander conseil
Contractions, perte de liquide, saignement, douleur inhabituelle ou diminution des mouvements des bébés doivent faire contacter la maternité sans attendre. ${STOP} ${URG}

${FIN}`,
  }),
];
