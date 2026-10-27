/** Guide complet — lot 10 (27/10/2026) : après la naissance, reprise de l'activité physique (périnée, abdominaux, diastasis, course, natation, sport avec bébé, poussette, portage et dos, fatigue). Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page, quand elle est indiquée.
const S = {
  santeActivite: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — L’activité physique après l’accouchement', url: 'https://www.sante.fr/lactivite-physique-apres-laccouchement', consulted_on: C, published: '2021-12-03' },
  santeSuivi: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — Le suivi médical après l’accouchement', url: 'https://www.sante.fr/le-suivi-medical-apres-laccouchement', consulted_on: C, published: '2024-08-09' },
  santeBouger: { label: 'Santé.fr — Bouger plus au quotidien : petits pas, grands bénéfices', url: 'https://www.sante.fr/bouger-plus-au-quotidien-petits-pas-grands-benefices', consulted_on: C, published: '2026-09-10' },
  santeMentale: { label: 'Santé.fr (avec Psycom) — La santé mentale des parents', url: 'https://www.sante.fr/la-sante-mentale-des-parents', consulted_on: C, published: '2025-08-04' },
  hasFiche: { label: 'Haute Autorité de santé — Après une naissance : l’activité physique pour votre santé (fiche patient)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/2022-11/ap_fiche_postpartum.pdf', consulted_on: C, published: '2022-12' },
  has2002: { label: 'ANAES / Haute Autorité de santé — Rééducation dans le cadre du post-partum (recommandations pour la pratique clinique)', url: 'https://has-sante.fr/upload/docs/application/pdf/recos_finales_post_partum_2006.pdf', consulted_on: C, published: '2002-12' },
  has2014: { label: 'Haute Autorité de santé — Sortie de maternité : préparez votre retour à la maison (document d’information)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/2014-02/document_dinformation.pdf', consulted_on: C, published: '2014-03' },
  sportsPage: { label: 'Ministère chargé des Sports — Guide de la pratique sportive pendant la maternité', url: 'https://www.sports.gouv.fr/guide-de-la-pratique-sportive-pendant-la-maternite-824', consulted_on: C, published: '2021-03-02' },
  sportsGuide: { label: 'Ministère chargé des Sports — Maternité et pratique d’une activité physique et sportive (guide PDF)', url: 'https://www.monenfant.fr/documents/20143/108676/GUIDE+-+APS+ET+MATERNIT%C3%89+-+vf+-oct+2020.pdf/bc54ed63-2e5a-84eb-4b4c-ef5f37ab6004', consulted_on: C },
  ameliRetour: { label: 'ameli.fr — Après l’accouchement : le retour à la maison', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/suivi-domicile', consulted_on: C, published: '2026-08-27' },
  ameliMaternite: { label: 'ameli.fr — Suivi de la mère à la maternité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/suivi-mere-apres-accouchement', consulted_on: C, published: '2026-03-12' },
  ameliBabyBlues: { label: 'ameli.fr — Après l’accouchement : baby blues et dépression du post-partum', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/baby-blues-depression-post-partum-grossesse', consulted_on: C, published: '2025-10-17' },
  ameliProlapsus: { label: 'ameli.fr — Prévenir le prolapsus génital', url: 'https://www.ameli.fr/assure/sante/themes/prolapsus-genito-urinaire/prevention', consulted_on: C, published: '2026-02-20' },
  ameliIUTraitement: { label: 'ameli.fr — Traitement de l’incontinence urinaire', url: 'https://www.ameli.fr/assure/sante/themes/incontinence-urinaire/traitement', consulted_on: C },
  ameliIUVie: { label: 'ameli.fr — Incontinence urinaire : le suivi médical et la vie quotidienne', url: 'https://www.ameli.fr/assure/sante/themes/incontinence-urinaire/suivi-medical-vie-quotidienne', consulted_on: C, published: '2018-07-13' },
  ameliIUPrev: { label: 'ameli.fr — Prévenir l’incontinence urinaire', url: 'https://www.ameli.fr/assure/sante/themes/incontinence-urinaire/prevention', consulted_on: C },
  ameliDos: { label: 'ameli.fr — Mal de dos : le bon traitement, c’est le mouvement !', url: 'https://www.ameli.fr/assure/sante/themes/lombalgie-aigue/traitement-prevention', consulted_on: C, published: '2025-04-09' },
  ameliDosComprendre: { label: 'ameli.fr — Lombalgie ou mal de dos, de quoi parle-t-on ?', url: 'https://www.ameli.fr/assure/sante/themes/lombalgie-aigue/comprendre-lombalgie', consulted_on: C, published: '2021-08-25' },
  ameliConstipation: { label: 'ameli.fr — Constipation de l’adulte : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/constipation-adulte/que-faire-quand-consulter', consulted_on: C, published: '2025-03-07' },
  ameliDiabeteG: { label: 'ameli.fr — Diabète de grossesse : la naissance, le suivi du bébé et de sa mère', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/diabete-gestationnel/accouchement-suivi-mere-bebe', consulted_on: C, published: '2025-01-31' },
  mpediaEcharpe: { label: 'mpedia.fr (Association française de pédiatrie ambulatoire) — Porter bébé avec une écharpe de portage', url: 'https://www.mpedia.fr/art-echarpe-portage/', consulted_on: C, published: '2021-11-05' },
  mpediaTransport: { label: 'mpedia.fr (Association française de pédiatrie ambulatoire) — Landau, poussette, coques, transats : comment choisir ?', url: 'https://www.mpedia.fr/art-enfant-quel-moyen-transport/', consulted_on: C, published: '2021-11-05' },
} satisfies Record<string, ArticleSource>;

/** Champs communs : parcours « bébé » (post-partum de la mère). */
const K: Pick<LibArticle, 'journeys' | 'status'> & { min_age_months: number } = {
  journeys: ['newborn'], min_age_months: 0, status: 'to_review',
};

const FIN = 'Cet article vous informe de façon générale et ne remplace pas l’avis d’un professionnel de santé (sage-femme, médecin, kinésithérapeute).';

export const GUIDE_B10: LibArticle[] = [
  {
    ...K, slug: 'reprise-activite-physique-apres-accouchement-calendrier', category: 'reeducation', max_age_months: 12,
    title: 'Reprendre une activité physique après l’accouchement : quoi, et à partir de quand ?',
    summary: 'Les grandes étapes de la reprise selon le type d’accouchement, de la marche des premiers jours jusqu’aux sports plus intenses après la rééducation du périnée.',
    tags: ['reprise du sport', 'sport après accouchement', 'post-partum', 'quand reprendre le sport', 'périnée', 'césarienne', 'épisiotomie'],
    sources: [S.santeActivite, S.hasFiche, S.ameliRetour],
    body_md: `## En bref
- La marche à intensité faible à modérée peut commencer très tôt après un accouchement par voie basse, à votre rythme.
- Les activités plus intenses, avec impacts ou port de charges, viennent **après la rééducation du périnée**, lorsqu'elle est nécessaire.
- Les délais indiqués par les sources officielles sont des repères : environ 4 à 8 semaines après une voie basse, davantage après une césarienne ou une épisiotomie.
- La consultation postnatale, 6 à 8 semaines après la naissance, est le bon moment pour en parler.

## Comprendre
La grossesse et l'accouchement sollicitent fortement le périnée (les muscles qui soutiennent la vessie, l'utérus et le rectum) et la paroi abdominale. Reprendre une activité physique fait du bien : selon Santé publique France, elle aide à se réapproprier son corps, à renforcer ses muscles, à mieux dormir et à diminuer l'anxiété et le risque de dépression du post-partum. Elle contribue aussi, un peu, à la perte de poids.

L'ordre compte : **d'abord le périnée, ensuite l'intensité**. Les repères officiels varient légèrement selon les sources, ce qui rappelle qu'il n'existe pas de calendrier unique :
- **Après une voie basse** : Santé publique France indique que la marche peut commencer tout de suite et que les activités plus intenses sont généralement possibles 6 à 8 semaines après l'accouchement, une fois la rééducation périnéale terminée. La Haute Autorité de santé (HAS) et l'Assurance Maladie parlent, en général, de 4 à 6 semaines pour une reprise progressive, après avis médical.
- **Après une épisiotomie** : la reprise se fait après l'avis du professionnel qui vous suit ; la HAS évoque au moins 8 à 10 semaines selon la cicatrisation.
- **Après une césarienne** : il faut attendre que la paroi abdominale se reconstitue, environ 2 mois selon Santé publique France, 8 à 10 semaines selon la HAS et l'Assurance Maladie.

Dans tous les cas, la HAS précise que les activités avec impacts au sol (course à pied, tennis, trampoline) ne se reprennent qu'**une fois le périnée redevenu fonctionnel**.

## Au quotidien
**Les premières semaines**
- Une ou deux petites balades par jour, avec bébé en poussette ou en porte-bébé, sont une bonne façon de commencer.
- Les montées d'escaliers et la marche active, à allure modérée, font partie des activités que la HAS cite pour une reprise rapide.
- Écoutez vos sensations : si la fatigue, une douleur ou les saignements augmentent, ralentissez.

**Autour de la consultation postnatale**
- Notez vos questions à l'avance : fuites, sensation de pesanteur, douleur de cicatrice, envie de reprendre telle activité.
- Si une rééducation périnéale et abdominale vous est prescrite, elle est prise en charge à 100 % par l'Assurance Maladie dans la limite des tarifs de base.

**Ensuite**
- Augmentez progressivement la durée puis l'intensité.
- Choisissez une activité qui vous plaît et qui est facile d'accès : c'est ce qui aide le plus à la pratiquer régulièrement.
- À terme, le repère pour les adultes est d'au moins 30 minutes d'activité par jour, avec du renforcement musculaire, de l'assouplissement et de l'équilibre deux fois par semaine, à adapter à vos possibilités.

## Questions fréquentes
**Pourquoi les délais ne sont-ils pas les mêmes partout ?**
Parce que chaque accouchement et chaque récupération sont différents. Les sources donnent des fourchettes ; c'est l'examen lors de la consultation postnatale qui permet d'adapter le calendrier à votre situation.

**Je me sens en forme à 3 semaines, puis-je reprendre la course ?**
Les activités avec impacts sont à garder pour après la rééducation du périnée, lorsqu'il est redevenu fonctionnel. En attendant, la marche, même rapide, reste possible.

**Et si je n'ai jamais fait de sport ?**
Toutes les femmes qui ont accouché récemment peuvent pratiquer une activité adaptée à leurs capacités, rappelle la HAS. Commencer par la marche quotidienne est déjà une vraie reprise.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin si vous avez des fuites urinaires, une sensation de pesanteur dans le bas du ventre, une douleur de cicatrice qui augmente ou des saignements qui reprennent. Consultez rapidement en cas de fièvre, de pertes malodorantes ou de saignements abondants. En cas d'urgence (saignement très abondant, difficulté à respirer, douleur dans la poitrine), appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'six-premieres-semaines-apres-accouchement-bouger-en-douceur', category: 'post-partum', max_age_months: 3,
    title: 'Les six premières semaines après l’accouchement : bouger en douceur',
    summary: 'Marcher, se lever, se reposer et éviter de porter lourd : comment rester active sans brûler les étapes pendant les premières semaines.',
    tags: ['post-partum', 'premières semaines', 'marche', 'repos', 'suites de couches', 'jeune maman', 'porter lourd'],
    sources: [S.santeActivite, S.has2014, S.sportsGuide],
    body_md: `## En bref
- Les premières semaines sont un temps de récupération : le repos et l'aide de l'entourage comptent autant que le mouvement.
- La marche douce, à votre rythme, est possible très tôt après un accouchement par voie basse.
- Évitez de porter des charges lourdes et, pendant 5 à 6 semaines, les mouvements avec sauts ou impacts.
- Fièvre, saignements très abondants, douleur dans la poitrine ou dans un mollet doivent faire consulter.

## Comprendre
Après la naissance, le corps récupère progressivement : les saignements (lochies) diminuent peu à peu, le périnée et la paroi abdominale se remettent de la grossesse et de l'accouchement. La Haute Autorité de santé (HAS) rappelle que la fatigue est fréquente à cette période : ménagez-vous et demandez l'aide de votre entourage.

Bouger un peu reste bénéfique. Santé publique France indique qu'après un accouchement par voie basse, la marche à intensité faible à modérée peut commencer tout de suite, par exemple une ou deux petites balades par jour avec bébé. Le guide du ministère chargé des Sports précise qu'il faut éviter, pendant 5 à 6 semaines, les mouvements comportant des sauts ou des impacts verticaux, et que la reprise plus franche se prépare en général à partir de la 4e semaine (marche rapide, escaliers), avec l'accord du professionnel qui vous suit.

Après une césarienne, la paroi abdominale a besoin de plus de temps ; la marche reste possible selon votre confort et les conseils de l'équipe.

## Au quotidien
**Bouger sans forcer**
- Commencez par quelques minutes de marche dans la maison ou le quartier, puis allongez progressivement la durée si vous vous sentez bien.
- Alternez les moments debout et les moments allongée : rester assise ou allongée de longues heures n'aide pas non plus.
- Une respiration calme, en soufflant lors des petits efforts (se relever, porter bébé), est un réflexe simple à adopter.

**Protéger son corps**
- Évitez de porter des charges lourdes : sacs de courses, packs d'eau, aîné dans les bras. Faites-vous aider ou faites livrer.
- Si vous allez à la selle avec difficulté, ne poussez pas fort et parlez-en à la sage-femme.

**Se reposer vraiment**
- Profitez des siestes de bébé pour dormir, même un peu.
- Acceptez l'aide proposée pour les repas, le ménage ou les courses.
- Limitez les visites si elles vous fatiguent.

## Questions fréquentes
**Puis-je sortir me promener dès le retour de la maternité ?**
Oui, si vous vous en sentez capable : Santé publique France cite les petites balades quotidiennes avec bébé comme une façon de commencer. Adaptez la durée à votre fatigue et à vos sensations.

**Dois-je faire des abdominaux pour « remettre le ventre en place » ?**
Il vaut mieux attendre. Les exercices abdominaux se travaillent d'abord avec un professionnel, après l'évaluation du périnée et de la paroi abdominale lors de la consultation postnatale.

**Je me sens très fatiguée, est-ce que je dois quand même marcher ?**
Le repos passe d'abord. Quelques minutes de marche peuvent faire du bien, mais si la fatigue est intense ou persistante, parlez-en à votre sage-femme ou à votre médecin.

## Quand demander conseil
Appelez votre médecin ou votre sage-femme en cas de fièvre (plus de 38 °C), de cicatrice plus douloureuse, rouge ou qui coule, de pertes malodorantes, de brûlures en urinant, de sein rouge et douloureux, ou de jambe gonflée, rouge ou douloureuse. Appelez le **15** ou le **112** si vous saignez beaucoup (plusieurs serviettes complètement imbibées en deux heures), si vous avez du mal à respirer ou une douleur dans la poitrine. Tristesse ou angoisse qui ne passe pas : parlez-en, et en cas de détresse, appelez le **3114**.

${FIN}`,
  },
  {
    ...K, slug: 'reeducation-perineale-pour-qui-et-pourquoi', category: 'reeducation', max_age_months: 12,
    title: 'Rééducation du périnée : pour qui, et pourquoi ?',
    summary: 'La rééducation périnéale n’est pas automatique : elle est proposée selon vos symptômes et l’examen de la consultation postnatale, et elle est prise en charge si elle est prescrite.',
    tags: ['rééducation du périnée', 'rééducation périnéale', 'périnée', 'post-partum', 'consultation postnatale', 'sage-femme', 'kiné'],
    sources: [S.has2002, S.ameliRetour, S.hasFiche],
    body_md: `## En bref
- Le périnée est l'ensemble des muscles qui soutiennent la vessie, l'utérus et le rectum ; la grossesse et l'accouchement le fragilisent.
- La rééducation est prescrite **si besoin**, après l'examen de la consultation postnatale (6 à 8 semaines après la naissance).
- Elle est réalisée par une sage-femme ou un masseur-kinésithérapeute et prise en charge à 100 % dans la limite des tarifs de base.
- Elle est fortement recommandée avant de reprendre une activité intense ou sportive.

## Comprendre
L'Assurance Maladie explique qu'un périnée fragilisé peut entraîner des fuites urinaires, une gêne ou une perte de sensations, et que, sans soins, ces troubles peuvent évoluer vers une incontinence ou un prolapsus (descente d'organe).

Les recommandations professionnelles de 2002 (ANAES, aujourd'hui HAS) précisent que la rééducation du post-partum **ne doit pas être considérée comme systématique** : elle découle des symptômes et de l'examen. Elles citent notamment comme situations justifiant une rééducation à dominante périnéale :
- des douleurs périnéales qui persistent, en particulier si les rapports sexuels sont douloureux ;
- une faiblesse musculaire du périnée qui persiste ;
- une incontinence (urinaire notamment) qui persiste.

Dans sa fiche plus récente sur l'activité physique après une naissance, la HAS indique que la rééducation périnéale est **fortement recommandée avant une activité plus intense ou sportive**, pour réduire les risques de fuites urinaires ou de prolapsus. C'est donc aussi votre projet de reprise du sport qui compte dans la discussion.

## Au quotidien
**Préparer la consultation postnatale**
- Notez ce que vous ressentez : fuites en toussant, en riant ou en portant bébé, envies pressantes, gêne ou pesanteur dans le bas du ventre, douleurs pendant les rapports, gaz ou selles difficiles à retenir.
- Dites quelle activité vous aimeriez reprendre (course, danse, sport collectif…) : cela aide le professionnel à évaluer vos besoins.
- N'hésitez pas à aborder les sujets intimes : ce sont des questions fréquentes et prises en charge.

**Après la prescription**
- Vous pouvez choisir une sage-femme ou un masseur-kinésithérapeute, en cabinet ou à l'hôpital.
- Gardez l'ordonnance : elle précise le nombre de séances.
- Entre les séances, faites les exercices conseillés à la maison.

## Questions fréquentes
**Je n'ai aucune fuite : dois-je faire une rééducation ?**
Ce n'est pas automatique. Le professionnel l'évalue lors de la consultation postnatale. Si vous comptez reprendre un sport avec impacts, dites-le-lui : la HAS recommande fortement une rééducation avant une activité intense.

**Quand commence-t-elle ?**
Selon les recommandations de 2002, la rééducation périnéo-sphinctérienne débute après la consultation postnatale, 6 à 8 semaines après l'accouchement, et après un examen clinique complet.

**Combien cela coûte-t-il ?**
Les séances prescrites par un médecin ou une sage-femme sont prises en charge à 100 % par l'Assurance Maladie dans la limite des tarifs de base. Les éventuels dépassements d'honoraires dépendent du professionnel et de votre complémentaire santé.

**Et après une césarienne ?**
Le périnée a lui aussi porté le poids de la grossesse. Parlez-en lors de la consultation postnatale : l'évaluation vaut quel que soit le mode d'accouchement.

## Quand demander conseil
Consultez votre sage-femme ou votre médecin sans attendre la consultation postnatale si vous avez des fuites urinaires même lors de petits efforts, une sensation de pesanteur, des douleurs périnéales qui augmentent ou une cicatrice rouge et douloureuse. Fièvre, pertes malodorantes ou saignements abondants : consultez rapidement. En cas d'urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'reeducation-perineale-deroulement-des-seances', category: 'reeducation', max_age_months: 12,
    title: 'Comment se passe une rééducation du périnée ?',
    summary: 'Bilan, exercices, biofeedback, nombre de séances et travail à la maison : ce qui vous attend pendant la rééducation périnéale après la naissance.',
    tags: ['rééducation du périnée', 'séances', 'biofeedback', 'électrostimulation', 'exercices du périnée', 'sage-femme', 'kinésithérapeute'],
    sources: [S.has2002, S.ameliIUTraitement, S.ameliProlapsus],
    body_md: `## En bref
- La rééducation commence par un bilan, puis alterne exercices guidés et conseils pour la vie quotidienne.
- Les exercices du plancher pelvien et le biofeedback sont les techniques les plus utilisées.
- Les recommandations professionnelles évoquent 10 à 20 séances au maximum, avec un arrêt dès que l'amélioration est suffisante.
- Votre participation, y compris à la maison entre les séances, fait partie du traitement.

## Comprendre
La rééducation périnéale vise à renforcer le plancher pelvien, ce « hamac » musculaire qui soutient la vessie. L'Assurance Maladie explique que lorsqu'il se contracte, il se soulève et s'épaissit. Elle est réalisée par une sage-femme ou un masseur-kinésithérapeute et nécessite votre coopération active.

Les recommandations de 2002 (ANAES, aujourd'hui HAS) décrivent ses principaux outils :
- **les exercices du plancher pelvien**, qui améliorent la force du périnée et diminuent l'incontinence urinaire d'effort ;
- **le biofeedback**, qui permet de visualiser la contraction de vos muscles pour mieux les sentir ;
- **l'électrostimulation**, possible dans certains cas mais déconseillée en cas de lésion nerveuse récente.

Associer plusieurs techniques semble plus efficace qu'une seule, mais aucun protocole unique ne s'impose : le programme est adapté à chaque femme.

Côté durée, les mêmes recommandations évoquent 10 à 20 séances au maximum, prolongeables de 10 à 15 séances si l'amélioration est réelle mais insuffisante. La rééducation s'arrête quand l'amélioration est jugée suffisante.

## Au quotidien
**La première séance**
- Le professionnel vous interroge sur vos symptômes (fuites, gêne, douleurs, sexualité, transit) et sur vos projets d'activité physique.
- Un examen permet d'évaluer la force et la coordination du périnée. Vous pouvez demander à tout moment ce qui va être fait, et pourquoi.

**Les séances suivantes**
- Vous apprenez à contracter et à relâcher le périnée, en coordination avec la respiration.
- Le rééducateur vous donne aussi des conseils de postures et de gestes quotidiens, comme le rappelle l'Assurance Maladie.
- L'Assurance Maladie mentionne également que des techniques de respiration et de préservation du périnée peuvent vous être enseignées.

**À la maison**
- Faites les exercices recommandés, au moment de la journée qui vous convient le mieux (pendant une tétée, un biberon, un trajet).
- Notez vos progrès : moins de fuites, meilleure sensation de contraction.
- Si un exercice provoque une douleur ou une gêne, signalez-le à la séance suivante.

**Organiser les rendez-vous avec bébé**
- Demandez si vous pouvez venir avec votre bébé, ou prévoyez un relais.
- Regroupez les séances à des horaires où bébé dort souvent.

## Questions fréquentes
**La rééducation est-elle douloureuse ?**
Signalez toute douleur ou tout inconfort pendant ou après une séance : le professionnel pourra adapter les exercices ou la technique.

**Puis-je faire les exercices seule avec une vidéo ?**
Les exercices de la vie quotidienne prolongent la rééducation, mais l'évaluation et l'apprentissage du bon geste se font avec un professionnel. Une contraction mal réalisée peut passer inaperçue sans bilan.

**Que se passe-t-il si les fuites persistent malgré la rééducation ?**
Parlez-en à votre médecin. L'Assurance Maladie indique que d'autres traitements existent lorsque les fuites persistent, après évaluation.

## Quand demander conseil
Consultez si les fuites s'aggravent, si une sensation de boule ou de pesanteur apparaît, si les douleurs périnéales augmentent, ou si vous avez du mal à retenir gaz ou selles. Fièvre, pertes malodorantes, saignements abondants : consultez rapidement. En cas d'urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'fuites-urinaires-apres-accouchement-au-quotidien', category: 'reeducation', max_age_months: 24,
    title: 'Fuites urinaires après l’accouchement : en parler et agir au quotidien',
    summary: 'Les fuites urinaires du post-partum sont fréquentes et se traitent : rééducation, habitudes de vie et activité physique adaptée.',
    tags: ['fuites urinaires', 'incontinence urinaire', 'post-partum', 'périnée', 'fuites en courant', 'fuites en toussant', 'rééducation'],
    sources: [S.has2002, S.ameliIUVie, S.ameliIUPrev],
    body_md: `## En bref
- Les fuites urinaires après un accouchement concernent, selon les études citées par les recommandations professionnelles, 15 à 40 % des femmes.
- La rééducation du périnée est le traitement de première intention des fuites à l'effort.
- Quelques habitudes aident : bien boire (surtout le matin), éviter la constipation, ne pas porter lourd, choisir des activités sans à-coups.
- Vous pouvez en parler sans gêne à votre sage-femme, votre médecin ou votre pharmacien.

## Comprendre
Pendant la grossesse puis l'accouchement, le périnée est étiré et peut perdre de son tonus. Cela peut provoquer des fuites quand vous toussez, riez, éternuez, portez bébé ou courez : on parle d'incontinence urinaire d'effort. Il peut aussi exister des envies pressantes difficiles à retenir.

Les recommandations de 2002 (ANAES, aujourd'hui HAS) indiquent que ces fuites touchent 15 à 40 % des femmes après l'accouchement selon les auteurs, et qu'environ un tiers d'entre elles guérissent spontanément entre 12 et 18 mois. Attendre n'est pas pour autant la seule option : les exercices du plancher pelvien améliorent la force du périnée et diminuent l'incontinence d'effort. L'Assurance Maladie rappelle que la rééducation, réalisée par un kinésithérapeute ou une sage-femme après un accouchement, est le traitement initial.

## Au quotidien
**Boire et aller aux toilettes**
- Ne réduisez pas vos boissons pour éviter les fuites : buvez assez pour couvrir vos besoins, surtout le matin. Si les fuites surviennent la nuit, limitez plutôt les boissons le soir.
- Réduisez le café.
- Videz complètement votre vessie, sans pousser, et évitez de vous retenir trop souvent.

**Prendre soin de son transit**
- La constipation et les efforts de poussée fragilisent le périnée. Une alimentation riche en fibres et une activité physique régulière aident à l'éviter.

**Bouger sans aggraver**
- Privilégiez des activités douces, sans à-coups, comme la marche ou la natation.
- Les sports à impacts répétés (course, trampoline, haltérophilie…) peuvent révéler une fragilité du périnée : demandez l'avis de votre médecin ou de votre rééducateur avant de les reprendre.
- Après un accouchement, évitez de porter des charges lourdes.

**Se protéger en attendant**
- Des protections spécifiques existent ; votre pharmacien peut vous conseiller.
- Contracter le périnée avant de tousser ou de soulever bébé est un réflexe que le rééducateur peut vous apprendre.

## Questions fréquentes
**Les fuites vont-elles passer toutes seules ?**
Pour une partie des femmes, elles s'améliorent avec le temps, mais pas pour toutes. Une rééducation peut accélérer et consolider l'amélioration : parlez-en dès la consultation postnatale.

**Est-ce que je peux faire du sport avec des fuites ?**
Oui, en choisissant des activités douces et sans à-coups. Les activités avec impacts sont à reprendre après la rééducation, une fois le périnée redevenu fonctionnel.

**Ai-je des fuites parce que j'ai mal fait quelque chose ?**
Non. Ces fuites sont liées à la grossesse et à l'accouchement, pas à une faute de votre part. Elles se soignent.

**Les fuites peuvent-elles apparaître des mois après ?**
Oui, notamment lors de la reprise d'un sport à impacts. Consultez dès leur apparition : il n'est jamais trop tard pour en parler.

## Quand demander conseil
Consultez votre médecin dès l'apparition de fuites ou si elles s'aggravent, ainsi qu'en cas de brûlures en urinant, de difficulté à uriner, de sensation de pesanteur ou de difficulté à retenir gaz ou selles. En cas de fièvre, consultez rapidement. En cas d'urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'sensation-pesanteur-perinee-prolapsus-apres-accouchement', category: 'reeducation', max_age_months: 24,
    title: 'Sensation de pesanteur ou de « boule » après l’accouchement : que savoir ?',
    summary: 'Une gêne dans le bas du ventre ou au niveau du vagin après la naissance mérite d’être signalée : elle peut traduire une fragilité du périnée qui se prend en charge.',
    tags: ['pesanteur', 'prolapsus', 'descente d’organe', 'périnée', 'post-partum', 'gêne vaginale', 'rééducation'],
    sources: [S.ameliProlapsus, S.ameliRetour, S.hasFiche],
    body_md: `## En bref
- Une sensation de pesanteur, de gêne ou de « boule » dans le bas du ventre ou au niveau du vagin peut traduire une fragilité du périnée.
- Sans soins, cette fragilité peut évoluer vers une incontinence ou un prolapsus (descente d'organe).
- Le suivi postnatal et la rééducation périnéale et abdominale aident à la prévenir et à la traiter.
- Évitez de porter lourd et de pousser fort aux toilettes pendant les semaines qui suivent la naissance.

## Comprendre
L'Assurance Maladie explique que le périnée est affaibli par la grossesse et surtout par l'accouchement. Sa perte de tonus peut se manifester par des fuites urinaires à l'effort, à la toux ou au rire, une sensation de gêne dans le bas-ventre et une diminution des sensations pendant les rapports. Sans prise en charge, cela peut évoluer vers une incontinence urinaire ou un prolapsus génito-urinaire, c'est-à-dire la descente d'un ou plusieurs organes du petit bassin (vessie, utérus, rectum) dans le vagin.

La Haute Autorité de santé recommande fortement la rééducation périnéale avant toute activité plus intense ou sportive, justement pour réduire les risques de fuites et de prolapsus. Cette rééducation, périnéale et abdominale, est prescrite si besoin et prise en charge à 100 % dans la limite des tarifs de base, avec une sage-femme ou un masseur-kinésithérapeute.

## Au quotidien
**Dans les semaines qui suivent la naissance**
- Évitez les charges lourdes : packs d'eau, gros sacs, poussette à soulever dans les escaliers, aîné à porter longtemps.
- Si vous devez soulever bébé ou son siège auto, rapprochez la charge de votre corps, pliez les genoux et soufflez pendant l'effort.
- Prévenez la constipation (fibres, eau, marche) et ne poussez pas fort aux toilettes.

**Au fil des mois**
- Une alimentation équilibrée et une activité physique adaptée aident à limiter le surpoids et la constipation, qui favorisent le prolapsus.
- Évitez le port répété de charges lourdes.
- Si vous fumez, l'arrêt du tabac fait partie des mesures de prévention citées par l'Assurance Maladie ; vous pouvez vous faire accompagner.
- Un gynécologue, une sage-femme ou un kinésithérapeute peut vous apprendre des techniques de respiration et de préservation du périnée à utiliser pendant l'effort.

**Dans le sport**
- Tant que la gêne persiste, préférez la marche, la natation ou le vélo doux, et parlez-en avant de reprendre des activités avec sauts ou impacts.
- Si la sensation de pesanteur apparaît ou augmente pendant un effort, arrêtez-vous et signalez-le.

## Questions fréquentes
**Cette sensation peut-elle disparaître ?**
Le périnée récupère en partie avec le temps, et la rééducation l'aide à retrouver du tonus. Seul un examen permet de savoir ce qu'il en est pour vous.

**Est-ce que je peux en parler à la sage-femme qui me suit pour bébé ?**
Oui. Les visites et séances de suivi postnatal sont aussi faites pour vous. Vous pouvez aborder ce sujet avec elle, votre médecin traitant ou votre gynécologue.

**La rééducation suffit-elle toujours ?**
Elle est le premier traitement proposé. Selon l'examen et l'évolution, votre médecin peut envisager d'autres solutions ; parlez-en avec lui.

## Quand demander conseil
Consultez votre sage-femme, votre médecin ou votre gynécologue si vous ressentez une pesanteur, une gêne vaginale, une « boule » à l'entrée du vagin, des fuites urinaires ou des difficultés à vider votre vessie ou vos intestins. Consultez rapidement en cas de fièvre, de douleurs importantes ou de saignements abondants ; en cas d'urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'proteger-son-perinee-gestes-du-quotidien-apres-naissance', category: 'reeducation', max_age_months: 24,
    title: 'Protéger son périnée dans les gestes du quotidien avec un bébé',
    summary: 'Porter bébé, soulever le siège auto, tousser, aller à la selle : des gestes simples pour ménager votre périnée pendant la récupération.',
    tags: ['périnée', 'porter bébé', 'constipation', 'charges lourdes', 'respiration', 'post-partum', 'gestes du quotidien'],
    sources: [S.ameliProlapsus, S.ameliConstipation, S.sportsGuide],
    body_md: `## En bref
- Après un accouchement, il est conseillé d'éviter de porter des charges lourdes et de pousser fort.
- Souffler pendant l'effort, plutôt que bloquer sa respiration, est un réflexe simple à acquérir.
- Prévenir la constipation protège aussi le périnée : fibres, eau, mouvement, pas de poussée forcée.
- Un professionnel peut vous apprendre à « verrouiller » le périnée avant un effort.

## Comprendre
Le périnée encaisse la pression qui s'exerce dans le ventre à chaque effort : soulever, tousser, éternuer, pousser aux toilettes. Après la grossesse et l'accouchement, il est fragilisé. L'Assurance Maladie conseille, dans les semaines suivant l'accouchement, d'éviter de porter des charges lourdes, puis, à tout âge, d'éviter le port répété de charges lourdes et de prévenir la constipation chronique. Elle précise qu'un gynécologue ou un kinésithérapeute peut enseigner des techniques de respiration et de préservation du périnée.

Le guide du ministère chargé des Sports rappelle un principe de base, valable aussi pour les gestes de tous les jours : **expirer pendant l'effort**, plutôt que de bloquer sa respiration.

## Au quotidien
**Porter et soulever**
- Gardez bébé près de votre corps quand vous le portez.
- Pour le prendre au sol ou dans le lit, pliez les genoux plutôt que le dos, et soufflez en vous relevant.
- Le siège auto avec bébé dedans est lourd : posez-le près de la voiture, détachez bébé et portez-les séparément quand c'est possible.
- Demandez de l'aide pour les courses lourdes, les packs d'eau et la poussette dans les escaliers.

**Tousser, éternuer, rire**
- Si vous avez appris à contracter votre périnée en rééducation, faites-le juste avant de tousser ou d'éternuer.
- En cas de toux qui dure, consultez votre médecin.

**Aller aux toilettes**
- Allez à la selle quand le besoin se fait sentir, sans vous retenir ; un moment propice est souvent 30 à 60 minutes après un repas.
- Prenez votre temps, sans forcer. Un petit marchepied sous les pieds aide les selles à progresser.
- Augmentez progressivement les fibres sur deux semaines (fruits, légumes, céréales complètes, légumes secs) pour limiter les ballonnements.
- Buvez régulièrement, au moins 1,5 litre par jour sauf contre-indication médicale, et bougez chaque jour.
- Videz complètement votre vessie, sans pousser.

**Dans la vie de tous les jours**
- Variez vos positions et évitez de rester longtemps immobile : marchez un peu plusieurs fois par jour.
- Lors des exercices, comme pour les gestes du quotidien, soufflez sur l'effort.

## Questions fréquentes
**Je dois porter mon aîné : comment faire ?**
Asseyez-vous et proposez-lui de venir sur vos genoux pour un câlin, faites-le monter seul sur une marche ou un tabouret avant de le prendre, et gardez les portés longs pour l'autre parent ou un proche pendant les premières semaines.

**Puis-je prendre un laxatif en cas de constipation ?**
L'Assurance Maladie recommande de consulter votre médecin si vous êtes enceinte ou si vous allaitez et que vous êtes constipée. Demandez conseil avant de prendre un médicament.

**Comment savoir si je contracte bien mon périnée ?**
C'est difficile à vérifier seule. La sage-femme ou le kinésithérapeute peut évaluer votre contraction et vous guider, notamment lors d'une rééducation.

## Quand demander conseil
Parlez-en à votre médecin ou à votre sage-femme en cas de fuites, de sensation de pesanteur, de constipation qui ne cède pas, de sang dans les selles ou de douleurs anales persistantes. Consultez dans la journée en cas de constipation avec fièvre et fortes douleurs de ventre. Appelez le **15** ou le **112** si vous vomissez, avez mal au ventre et ne pouvez plus émettre de gaz.

${FIN}`,
  },
  {
    ...K, slug: 'abdominaux-apres-accouchement-par-ou-commencer', category: 'reeducation', max_age_months: 12,
    title: 'Abdominaux après l’accouchement : par où commencer ?',
    summary: 'Muscle transverse, gainage progressif, exercices qui ne poussent pas sur le périnée : les principes pour retrouver une sangle abdominale tonique.',
    tags: ['abdominaux', 'abdos après accouchement', 'transverse', 'gainage', 'ventre', 'post-partum', 'rééducation abdominale'],
    sources: [S.sportsGuide, S.has2002, S.santeSuivi],
    body_md: `## En bref
- Les abdominaux se travaillent après l'évaluation du périnée et de la paroi abdominale, souvent lors de la consultation postnatale.
- La priorité est de retrouver la tonicité du **périnée** et du **transverse**, le muscle profond qui gaine le ventre.
- Les recommandations privilégient les exercices qui **n'augmentent pas la pression dans le ventre**.
- La rééducation abdominale peut être prescrite si besoin, avec la rééducation périnéale.

## Comprendre
Pendant la grossesse, les muscles abdominaux s'étirent pour laisser place au bébé. Après la naissance, ils ont besoin de temps pour retrouver leur tonus. La consultation postnatale comprend un examen clinique et, si nécessaire, la prescription d'une rééducation périnéale et abdominale.

Les recommandations de 2002 (ANAES, aujourd'hui HAS) indiquent que, si la sangle abdominale doit être sollicitée, il faut **privilégier des exercices qui n'augmentent pas la pression intra-abdominale**, c'est-à-dire qui ne font pas « pousser » le ventre.

Le guide du ministère chargé des Sports fixe la priorité : regagner la tonicité abdominale et celle du périnée, éviter pendant 5 à 6 semaines les sauts et impacts verticaux, puis reprendre progressivement le renforcement en augmentant intensité et durée.

## Au quotidien
Les exercices ci-dessous sont décrits dans le guide du ministère chargé des Sports pour l'après-accouchement. Faites-les valider par la sage-femme ou le kinésithérapeute qui vous suit, et arrêtez en cas de douleur, de fuite ou de sensation de pesanteur.

**Activer le transverse**
- À quatre pattes, contractez très progressivement le ventre « comme pour aspirer le nombril », en soufflant. C'est le transverse qui travaille.

**Gainage progressif**
- Quand cette contraction est acquise, le guide propose la planche, 10 secondes, 5 fois.
- Gainage latéral : sur le coude, décollez le bassin en alignant épaules, hanches et genoux, 10 secondes, 10 fois.

**Fessiers et abdominaux**
- En pont (allongée sur le dos, genoux pliés), décollez le bassin et maintenez 10 secondes, 5 fois.

**Périnée et adducteurs**
- Serrez un ballon entre les genoux en contractant le bas du ventre, 10 secondes, 10 fois.

**Les bons réflexes**
- Soufflez pendant l'effort, ne bloquez pas votre respiration.
- Si votre ventre « pointe » ou se bombe au milieu pendant un exercice, arrêtez et parlez-en au professionnel.
- Alternez renforcement et activités d'endurance douces (marche, pédalage doux, natation).

## Questions fréquentes
**Puis-je faire des « crunchs » (relevés de buste) ?**
Les exercices qui augmentent fortement la pression dans le ventre ne sont pas ceux à privilégier en début de récupération. Demandez à votre rééducateur quand et comment les introduire, si cela vous intéresse.

**Les exercices font-ils disparaître le ventre ?**
Ils aident à retrouver une sangle abdominale tonique, mais le ventre évolue aussi avec le temps, à un rythme propre à chaque femme. Soyez patiente avec votre corps.

**Les appareils d'électrostimulation abdominale sont-ils utiles ?**
Les recommandations de 2002 indiquent que l'électrothérapie excito-motrice n'a pas démontré son efficacité pour la sangle abdominale. Parlez-en au professionnel avant tout achat.

## Quand demander conseil
Parlez-en à votre sage-femme, votre médecin ou votre kinésithérapeute si vous voyez un renflement au milieu du ventre à l'effort, si vous avez des fuites, une pesanteur, ou une douleur de cicatrice de césarienne. Consultez rapidement en cas de douleur abdominale intense, de fièvre ou de saignements abondants ; en cas d'urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'diastasis-des-grands-droits-apres-accouchement', category: 'reeducation', max_age_months: 24,
    title: 'Diastasis des grands droits après la grossesse : comprendre et agir',
    summary: 'L’écartement des muscles du ventre est fréquent après la grossesse : comment le repérer, en parler et choisir des exercices adaptés.',
    tags: ['diastasis', 'diastasis des grands droits', 'écartement des abdominaux', 'ventre', 'abdominaux', 'post-partum', 'rééducation abdominale'],
    sources: [S.has2002, S.ameliRetour, S.sportsGuide],
    body_md: `## En bref
- Le diastasis est un écartement des deux muscles « grands droits » de l'abdomen, de part et d'autre de la ligne médiane du ventre.
- Il est fréquent après la grossesse : il persiste chez près de la moitié des femmes 5 à 7 semaines après l'accouchement.
- Un professionnel peut le rechercher lors de l'examen ; signalez-lui un éventuel renflement au milieu du ventre lors des efforts.
- Parlez-en à la consultation postnatale : une rééducation abdominale peut être prescrite si besoin.

## Comprendre
Pendant la grossesse, les muscles grands droits (les « tablettes » du ventre) s'écartent pour laisser de la place à l'utérus. Après la naissance, cet écart se réduit progressivement, mais pas toujours complètement.

Les recommandations de 2002 (ANAES, aujourd'hui HAS) sur la rééducation du post-partum indiquent que le diastasis persiste chez près de la moitié des femmes entre 5 et 7 semaines après l'accouchement, qu'il est souvent plus marqué au-dessus du nombril et qu'au-delà de 2 cm d'écart, le muscle ne peut plus développer toute sa force. Elles soulignent aussi que les études sur son évolution sont peu nombreuses. Pour solliciter la sangle abdominale, elles conseillent de privilégier des exercices qui n'augmentent pas la pression dans le ventre.

La rééducation abdominale fait partie de ce que la consultation postnatale peut prescrire si besoin ; elle est prise en charge à 100 % dans la limite des tarifs de base par l'Assurance Maladie, avec une sage-femme ou un masseur-kinésithérapeute.

## Au quotidien
**Repérer**
- Si, lorsque vous vous redressez ou forcez, vous remarquez une sorte de « crête » ou de creux au milieu du ventre, notez-le.
- Seul un professionnel peut confirmer et mesurer un diastasis. Demandez-lui de vérifier lors de la consultation postnatale.

**Adapter les gestes**
- Soufflez pendant les efforts et évitez de bloquer votre respiration.
- Évitez de porter lourd dans les premières semaines.

**Choisir les exercices**
- Commencez par le travail du muscle transverse (rentrer doucement le ventre en soufflant), comme le propose le guide du ministère chargé des Sports, si votre professionnel le valide.
- Gardez pour plus tard les exercices qui font bomber le ventre, et demandez conseil avant de les reprendre.
- Si le renflement apparaît pendant un exercice, arrêtez-le et signalez-le à votre rééducateur.

**Être patiente**
- La récupération de la sangle abdominale prend du temps et dépend de chacune. Les progrès se mesurent sur des semaines et des mois.

## Questions fréquentes
**Le diastasis est-il grave ?**
Il relève d'une évaluation et, si besoin, d'une rééducation, en consultation. Selon les recommandations de 2002, un écart important réduit la force que le muscle peut développer : c'est pourquoi il mérite d'être évalué et accompagné.

**Puis-je reprendre le sport avec un diastasis ?**
Une activité physique adaptée reste possible et bénéfique. Le type d'exercices et le rythme de progression se décident avec votre sage-femme ou votre kinésithérapeute.

**Une ceinture ou une gaine peut-elle refermer le diastasis ?**
Les sources consultées ne permettent pas de le dire. Demandez l'avis du professionnel qui vous suit avant d'en utiliser une.

**Et si l'écart persiste après plusieurs mois ?**
Reparlez-en à votre médecin, qui pourra réévaluer la situation et vous orienter si besoin.

## Quand demander conseil
Consultez votre médecin ou votre sage-femme si vous voyez une bosse au niveau du nombril ou de la cicatrice, si vous avez des douleurs abdominales persistantes, ou si la gêne vous empêche de porter bébé. Une douleur de ventre intense, avec vomissements ou fièvre, doit faire consulter en urgence : appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'ventre-et-poids-apres-accouchement-attentes-realistes', category: 'post-partum', max_age_months: 12,
    title: 'Ventre et poids après l’accouchement : des attentes réalistes',
    summary: 'L’utérus met environ deux mois à reprendre sa taille et les régimes sont déconseillés au début : prendre le temps, bien manger et bouger progressivement.',
    tags: ['poids après accouchement', 'ventre après grossesse', 'perdre du poids', 'régime', 'allaitement', 'post-partum', 'silhouette'],
    sources: [S.ameliMaternite, S.ameliRetour, S.hasFiche],
    body_md: `## En bref
- Après la naissance, l'utérus met environ deux mois à reprendre sa taille : le ventre change progressivement.
- L'Assurance Maladie déconseille les régimes pendant l'allaitement, et avant les 3 mois de l'enfant si vous n'allaitez pas.
- L'activité physique aide à retrouver le poids d'avant la grossesse, mais elle n'agit que progressivement.
- Votre corps a porté un enfant : il mérite de la patience plutôt que de la pression.

## Comprendre
Juste après l'accouchement, beaucoup de femmes sont surprises de garder un ventre arrondi. L'Assurance Maladie explique que la taille de l'utérus est surveillée chaque jour à la maternité et qu'il met environ deux mois à revenir à la normale. Les contractions appelées « tranchées », plus marquées pendant l'allaitement, aident à évacuer les lochies (les saignements qui suivent l'accouchement).

La paroi abdominale, elle aussi, a été étirée et retrouve son tonus avec le temps et, si besoin, une rééducation abdominale.

Pour le poids, la Haute Autorité de santé (HAS) indique que l'activité physique aide à retrouver le poids d'avant la grossesse. L'Assurance Maladie recommande de ne pas suivre de régime si vous allaitez, ni avant les 3 mois de l'enfant si vous n'allaitez pas, et de privilégier une alimentation variée en buvant suffisamment d'eau.

## Au quotidien
**Manger pour récupérer**
- Prenez de vrais repas, même simples, et des collations si vous avez faim (fruit, laitage, pain).
- Gardez de l'eau à portée de main, notamment pendant les tétées.
- Acceptez les plats préparés par vos proches : c'est une aide précieuse.

**Bouger pour soi**
- Commencez par la marche quotidienne, puis augmentez progressivement selon les conseils reçus à la consultation postnatale.
- Choisissez une activité qui vous fait plaisir : la régularité compte plus que l'intensité.
- Le renforcement abdominal vient après l'évaluation du périnée et de la paroi abdominale.

**Prendre soin du regard sur soi**
- Évitez de vous comparer aux images de « retour express » à la silhouette d'avant : elles ne reflètent pas la réalité de la plupart des femmes.
- Les vêtements confortables de fin de grossesse ou un peu amples peuvent rester utiles quelques semaines.
- Si le regard que vous portez sur votre corps vous fait souffrir, parlez-en : à votre partenaire, à une sage-femme, à votre médecin.

## Questions fréquentes
**Combien de temps pour retrouver mon ventre d'avant ?**
Il n'existe pas de délai unique. L'utérus reprend sa taille en environ deux mois ; la paroi abdominale et le poids évoluent ensuite à leur rythme, différent pour chaque femme.

**Le sport fait-il maigrir plus vite si j'allaite ?**
L'activité physique modérée ne modifie ni la quantité ni la qualité du lait, selon la HAS. Elle aide à retrouver la forme, mais sans régime au début et à votre rythme.

**Je n'arrive pas à perdre de poids après plusieurs mois, que faire ?**
Parlez-en à votre médecin, qui pourra faire le point avec vous sur l'alimentation, l'activité, le sommeil et votre santé, et vous orienter si besoin.

## Quand demander conseil
Consultez votre médecin si vous perdez beaucoup de poids sans le chercher, si vous n'arrivez plus à manger, ou si vous êtes envahie de pensées négatives sur votre corps ou sur la nourriture. Une douleur du ventre qui augmente, de la fièvre ou des saignements abondants doivent faire consulter rapidement ; en cas d'urgence, appelez le **15** ou le **112**. En cas de détresse psychique, appelez le **3114**.

${FIN}`,
  },
  {
    ...K, slug: 'reprendre-la-course-a-pied-apres-accouchement', category: 'sport', max_age_months: 24,
    title: 'Reprendre la course à pied après l’accouchement',
    summary: 'La course est une activité à impacts : elle se reprend après la rééducation du périnée, progressivement, en restant attentive aux fuites et à la pesanteur.',
    tags: ['course à pied', 'running', 'courir après accouchement', 'jogging', 'reprise du sport', 'périnée', 'post-partum'],
    sources: [S.hasFiche, S.sportsGuide, S.ameliIUPrev],
    body_md: `## En bref
- La course à pied est une activité à impacts au sol : la Haute Autorité de santé (HAS) recommande de ne la reprendre qu'**après la rééducation du périnée**, une fois celui-ci redevenu fonctionnel.
- Pendant les 5 à 6 premières semaines, les sauts et impacts verticaux sont à éviter.
- En attendant, la marche active, les escaliers ou la natation à allure modérée permettent d'entretenir l'endurance.
- Fuites, pesanteur ou douleur pendant ou après la course sont des signaux pour ralentir et consulter.

## Comprendre
À chaque foulée, le corps encaisse un impact que le périnée doit amortir. Après une grossesse et un accouchement, ce soutien est fragilisé. L'Assurance Maladie rappelle que les sports à impacts répétés, comme la course, peuvent révéler une fragilité du plancher pelvien et provoquer des fuites, et qu'il faut demander l'avis de son médecin.

La HAS cite la course à pied parmi les activités à impacts qui ne doivent être reprises qu'après la rééducation périnéale. Le guide du ministère chargé des Sports conseille d'éviter les sauts et impacts verticaux pendant 5 à 6 semaines, puis de reprendre progressivement, en augmentant régulièrement l'intensité et la durée, en alternance avec le renforcement musculaire.

## Au quotidien
**Avant de chausser vos baskets**
- Parlez de votre projet de course à la consultation postnatale ou à votre rééducateur : c'est un élément important pour évaluer votre périnée.
- Entretenez votre souffle avec la marche active, les escaliers, le vélo doux ou la natation.
- Travaillez le gainage et le transverse, selon les conseils reçus.

**Les premières sorties**
- Choisissez un terrain souple et plat, et de bonnes chaussures.
- Commencez court, par exemple en alternant marche et petites périodes de course, puis augmentez progressivement.
- Restez à une allure qui vous permet de parler.
- Videz votre vessie avant de partir et emportez de l'eau.

**Écouter son corps**
- Notez après chaque sortie : fuites ? pesanteur ? douleur au bas du dos, au pubis, aux genoux ? fatigue inhabituelle ?
- Si un symptôme apparaît, revenez à l'étape précédente et parlez-en à votre sage-femme ou à votre kinésithérapeute.

**Courir avec bébé ?**
- Courir en poussant bébé ajoute une contrainte. Si vous l'envisagez plus tard, vérifiez que la poussette est adaptée à cet usage et à l'âge de l'enfant (notice, normes), et demandez conseil au professionnel qui suit bébé.

## Questions fréquentes
**Je courais beaucoup avant la grossesse, puis-je reprendre plus vite ?**
Votre condition physique est un atout, mais le périnée a, lui aussi, traversé la grossesse et l'accouchement. Le même principe s'applique : rééducation d'abord, reprise progressive ensuite.

**J'ai une petite fuite en courant, dois-je arrêter ?**
C'est un signal à prendre au sérieux. Revenez à des activités sans impacts et consultez : une rééducation, ou sa reprise, peut être utile.

**Puis-je courir si j'allaite ?**
Selon la HAS, l'activité physique ne modifie ni la quantité ni la qualité du lait. Un soutien-gorge de sport adapté et une tétée ou un tire-lait avant la sortie peuvent améliorer le confort.

## Quand demander conseil
Arrêtez-vous et consultez en cas de fuites urinaires ou de selles, de sensation de pesanteur, de douleur au pubis, au bas du dos ou à une cicatrice, ou de saignements qui reprennent. Essoufflement anormal qui persiste au repos, douleur dans la poitrine, malaise, mollet douloureux et gonflé : appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'natation-et-activites-aquatiques-apres-accouchement', category: 'sport', max_age_months: 24,
    title: 'Natation et activités aquatiques après l’accouchement',
    summary: 'La natation fait partie des activités qui se reprennent tôt à allure modérée : comment y retourner sereinement, et quelles questions poser avant.',
    tags: ['natation', 'piscine', 'aquagym', 'nager après accouchement', 'reprise du sport', 'post-partum', 'activité douce'],
    sources: [S.hasFiche, S.sportsGuide, S.ameliIUVie],
    body_md: `## En bref
- La Haute Autorité de santé (HAS) cite la natation parmi les activités qui peuvent être reprises rapidement, à allure modérée.
- L'eau porte le corps : elle limite les contraintes sur les articulations et peut soulager le dos.
- C'est une activité douce, sans à-coups, conseillée aussi en cas de fuites urinaires.
- Demandez à votre sage-femme ou à votre médecin à partir de quand vous pouvez aller à la piscine, surtout en cas de saignements ou de cicatrice.

## Comprendre
Dans l'eau, le poids du corps est en grande partie porté. Dans sa partie consacrée à la grossesse, le guide du ministère chargé des Sports souligne que la natation réduit les contraintes sur les articulations et soulage les douleurs lombaires, et recommande de nager de façon continue, à rythme régulier. Pour l'après-accouchement, il cite la natation, avec la marche et le pédalage doux, parmi les activités à reprendre en alternance avec le renforcement musculaire.

La HAS indique que la marche active, les montées d'escaliers et la natation peuvent être reprises rapidement à allure modérée. L'Assurance Maladie, dans ses conseils sur les fuites urinaires, cite la natation comme activité douce, sans à-coups.

Le moment du retour à la piscine dépend toutefois de votre situation : saignements après l'accouchement, cicatrice d'épisiotomie ou de césarienne, état de santé général. C'est une question à poser à la sage-femme qui vous suit ou lors de la consultation postnatale.

## Au quotidien
**Pour bien démarrer**
- Commencez par des séances courtes, à allure tranquille : l'objectif est de bouger, pas de performer.
- Alternez les nages qui vous conviennent ; si une nage provoque une douleur au dos, au pubis ou au bassin, changez-en.
- Le guide du ministère indique que le masque et le tuba sont autorisés, si vous les trouvez plus confortables.
- Buvez de l'eau avant et après la séance.

**L'aquagym et les cours collectifs**
- Les cours en piscine sont une manière conviviale de reprendre. Prévenez l'animateur que vous avez accouché récemment.
- Évitez les mouvements qui provoquent fuites, pesanteur ou douleur, et demandez des variantes à l'animateur.

**Organiser la séance**
- Choisissez un créneau où bébé est gardé par l'autre parent ou un proche, ou renseignez-vous sur les clubs qui proposent une garderie.
- Si vous allaitez, une tétée avant de partir peut améliorer votre confort.

**Et bébé dans l'eau ?**
- Ce sujet dépasse cet article : demandez conseil au médecin de votre bébé avant de l'emmener à la piscine avec vous.

## Questions fréquentes
**Combien de temps après l'accouchement puis-je retourner à la piscine ?**
Les sources consultées ne donnent pas de délai précis pour la baignade. Demandez à votre sage-femme ou à votre médecin, en particulier si vous saignez encore ou si une cicatrice n'est pas refermée.

**La natation aide-t-elle le périnée ?**
Elle ne le sollicite pas par des impacts, ce qui en fait une activité adaptée pendant la récupération. Elle ne remplace pas la rééducation périnéale si celle-ci vous est prescrite.

**J'ai mal au dos depuis la naissance, la natation peut-elle aider ?**
Le guide du ministère, dans sa partie sur la grossesse, indique que l'eau soulage les douleurs lombaires en déchargeant les articulations.

## Quand demander conseil
Consultez avant d'aller à la piscine si vous avez de la fièvre, des pertes malodorantes, une cicatrice rouge, douloureuse ou qui coule. Sortez de l'eau et demandez de l'aide en cas de malaise, de douleur dans la poitrine ou d'essoufflement anormal ; appelez le **15** ou le **112** si les symptômes persistent.

${FIN}`,
  },
  {
    ...K, slug: 'cours-postnatals-clubs-et-maisons-sport-sante', category: 'sport', max_age_months: 24,
    title: 'Cours postnatals, clubs et Maisons Sport-Santé : se faire accompagner',
    summary: 'Yoga postnatal, ateliers parents-bébé, clubs avec garderie, Maisons Sport-Santé : où trouver une activité encadrée et adaptée après la naissance.',
    tags: ['yoga postnatal', 'cours postnatal', 'maison sport-santé', 'club de sport', 'atelier maman bébé', 'garderie', 'reprise du sport'],
    sources: [S.santeActivite, S.sportsGuide, S.sportsPage],
    body_md: `## En bref
- Santé publique France cite les cours collectifs, comme le yoga postnatal, parmi les façons de bouger après la naissance.
- De nombreuses fédérations sportives proposent des programmes pour les femmes enceintes et après l'accouchement ; certaines ont des ateliers parents-très jeunes enfants ou une garderie.
- Les Maisons Sport-Santé peuvent vous orienter vers une activité adaptée près de chez vous.
- Pratiquer à plusieurs aide à rester motivée et à rompre l'isolement.

## Comprendre
Reprendre seule n'est pas toujours facile : manque de temps, peur de mal faire, fatigue. Un cadre collectif apporte des repères, de la motivation et l'occasion de rencontrer d'autres parents.

Le guide du ministère chargé des Sports sur la maternité rappelle que de nombreuses fédérations ont développé des programmes pour la grossesse et l'après-accouchement, et que certaines proposent des ateliers « mamans / très jeunes enfants » ou une garderie. Il invite à se renseigner auprès du club le plus proche et à contacter une **Maison Sport-Santé** : ces structures, recensées sur une carte interactive du ministère, accompagnent les personnes qui souhaitent reprendre une activité physique pour leur santé.

Santé publique France cite le yoga postnatal comme exemple de cours collectif, à côté des promenades en poussette et des exercices à la maison.

## Au quotidien
**Trouver la bonne activité**
- Cherchez des cours intitulés « postnatal », « après bébé » ou « parent-bébé » auprès des clubs, piscines, associations de quartier et centres sociaux.
- Consultez la carte des Maisons Sport-Santé sur le site du ministère chargé des Sports.
- Demandez à votre sage-femme, à la PMI ou à votre kinésithérapeute s'ils connaissent des activités adaptées près de chez vous.

**Bien choisir son cours**
- Demandez la formation de l'encadrant et s'il a l'habitude d'accueillir des femmes après un accouchement.
- Signalez votre date d'accouchement, une césarienne ou une rééducation en cours.
- Méfiez-vous des promesses de résultats rapides sur le ventre ou le poids.
- Vérifiez si le cours comporte des sauts ou des exercices intenses pour les abdominaux, et s'ils sont adaptés à votre étape.

**Avec bébé**
- Dans les ateliers parent-bébé, bébé est posé sur un tapis à côté de vous : prévoyez couverture, change et de quoi le nourrir.
- Si bébé pleure, vous pouvez faire une pause : ces cours sont pensés pour cela.

**Sans bébé**
- Renseignez-vous sur les clubs avec garderie, ou organisez un relais avec l'autre parent ou un proche.

## Questions fréquentes
**À partir de quand puis-je m'inscrire à un cours ?**
Cela dépend du cours et de votre récupération. Les cours doux peuvent venir plus tôt ; les cours intenses ou avec impacts, après la rééducation du périnée. Parlez-en à la consultation postnatale.

**Le yoga postnatal suffit-il à rééduquer le périnée ?**
Il peut compléter, mais il ne remplace pas une rééducation périnéale prescrite, réalisée par une sage-femme ou un kinésithérapeute.

**Faut-il un certificat médical ?**
Certains clubs en demandent un. Renseignez-vous auprès de la structure ; la consultation postnatale est un bon moment pour en parler.

## Quand demander conseil
Pendant un cours, arrêtez-vous et prévenez l'encadrant en cas de douleur dans la poitrine, d'essoufflement anormal, de vertiges, de saignements, de fuites ou de pesanteur. Appelez le **15** ou le **112** en cas de malaise ou de douleur thoracique. Si la fatigue ou un mal-être vous empêchent de sortir, parlez-en à votre médecin ; en cas de détresse, appelez le **3114**.

${FIN}`,
  },
  {
    ...K, slug: 'exercices-a-la-maison-avec-bebe-apres-naissance', category: 'sport', max_age_months: 12,
    title: 'Faire de l’exercice à la maison avec son bébé',
    summary: 'Bébé sur son tapis d’éveil ou dans son transat posé au sol, vous à côté : des idées simples pour bouger chez vous, en toute sécurité.',
    tags: ['sport à la maison', 'exercices avec bébé', 'tapis d’éveil', 'gainage', 'renforcement', 'post-partum', 'reprise du sport'],
    sources: [S.santeActivite, S.sportsGuide, S.mpediaTransport],
    body_md: `## En bref
- Santé publique France cite les exercices à la maison, bébé posé sur un tapis d'éveil ou dans un transat, parmi les façons de bouger après la naissance.
- Quelques minutes suffisent pour commencer : l'essentiel est la régularité.
- Les exercices de renforcement viennent après l'évaluation du périnée et de la paroi abdominale.
- Sécurité de bébé d'abord : transat toujours posé au sol, jamais en hauteur.

## Comprendre
Quand on a un nourrisson, sortir pour faire du sport demande de l'organisation. Bouger chez soi est une alternative simple. Santé publique France propose de faire des exercices à la maison avec bébé à côté, sur son tapis d'éveil ou dans son transat. Le guide du ministère chargé des Sports décrit des exercices de renforcement adaptés à l'après-accouchement (travail du transverse, gainage, pont, serrage d'un ballon entre les genoux) et recommande de reprendre progressivement, en évitant pendant 5 à 6 semaines les sauts et impacts.

Côté sécurité, mpedia rappelle que le transat ne doit jamais être posé en hauteur (table, lit, canapé) et que l'enfant doit y être attaché avec le harnais.

## Au quotidien
**Installer l'espace**
- Choisissez un endroit dégagé, avec un tapis pour vous et un tapis d'éveil pour bébé à portée de regard.
- Si vous utilisez un transat, posez-le au sol et attachez bébé.
- Éloignez les objets que bébé pourrait attraper ou faire tomber.

**Des idées d'exercices à valider avec votre professionnel**
- **Respiration et transverse** : à quatre pattes au-dessus de bébé, rentrez doucement le ventre en soufflant. Bébé vous regarde, vous lui parlez.
- **Pont** : allongée sur le dos, genoux pliés, décollez le bassin et maintenez quelques secondes ; bébé peut être à côté de vous.
- **Gainage latéral** : sur le coude, en alignant épaules, hanches et genoux, face à bébé.
- **Ballon entre les genoux** : serrez en contractant le bas du ventre.
- **Squats doux** : dos droit, sans charge au début ; vous pouvez chanter une comptine pour rythmer.
- **Étirements** : en fin de séance, respirez calmement.

**Les bonnes habitudes**
- Commencez par 5 à 10 minutes, puis allongez si vous vous sentez bien.
- Soufflez pendant l'effort, ne bloquez pas votre respiration.
- Arrêtez-vous si bébé a besoin de vous : la séance reprendra plus tard.
- Buvez un verre d'eau avant et après.

**Bouger dans la journée**
- Les escaliers, la marche dans la maison en berçant bébé, se lever régulièrement : tout compte. Le guide du ministère conseille de ne pas rester assise plus de deux heures d'affilée.

## Questions fréquentes
**Puis-je utiliser bébé comme « poids » pour mes exercices ?**
Évitez au début : soulever une charge sollicite le périnée, et bébé doit être porté en sécurité. Gardez-le à côté de vous ; demandez conseil avant d'ajouter des charges.

**Les vidéos d'exercices sont-elles adaptées ?**
Certaines le sont, d'autres comportent des sauts ou des abdominaux intenses. Vérifiez qu'elles sont conçues pour l'après-accouchement et faites valider les exercices par votre sage-femme ou votre kinésithérapeute.

**Je n'ai que dix minutes par jour, est-ce utile ?**
Oui. Le guide du ministère indique que l'activité quotidienne peut être fractionnée, par exemple en 2 fois 15 minutes ou 3 fois 10 minutes.

## Quand demander conseil
Arrêtez l'exercice et parlez-en à votre professionnel en cas de fuites, de pesanteur, de douleur au dos ou au pubis, ou de renflement au milieu du ventre. Douleur dans la poitrine, malaise, essoufflement qui ne passe pas au repos : appelez le **15** ou le **112**. Si bébé est tombé ou a eu un choc, appelez aussi le **15**.

${FIN}`,
  },
  {
    ...K, slug: 'marcher-avec-la-poussette-apres-naissance', category: 'sport', max_age_months: 24,
    title: 'Marcher avec la poussette : une reprise simple et efficace',
    summary: 'La promenade en poussette est l’une des premières activités possibles après la naissance : conseils de posture, de progression et de sécurité.',
    tags: ['poussette', 'marche', 'promenade avec bébé', 'marche active', 'reprise du sport', 'post-partum', 'sécurité poussette'],
    sources: [S.santeActivite, S.mpediaTransport, S.santeBouger],
    body_md: `## En bref
- Santé publique France cite la promenade en poussette parmi les premières activités possibles après l'accouchement.
- La marche peut devenir progressivement plus active, jusqu'à une marche rapide.
- Une poussette adaptée à l'âge de bébé et bien réglée protège votre dos et la sécurité de l'enfant.
- Frein à chaque arrêt, harnais attaché, pas de sacs suspendus aux poignées.

## Comprendre
La marche est l'activité la plus accessible après la naissance. Santé publique France indique qu'après un accouchement par voie basse, une marche d'intensité faible à modérée peut commencer tout de suite, par exemple une ou deux petites balades par jour avec bébé. Les repères pour les adultes visent ensuite au moins 30 minutes d'activité dynamique par jour, comme la marche rapide.

Pour la poussette, mpedia (Association française de pédiatrie ambulatoire) rappelle quelques règles : utiliser un modèle adapté à l'âge de l'enfant (nacelle à plat pour les premiers mois, hamac quand bébé tient assis), conforme aux normes européennes, actionner le frein à chaque arrêt, toujours attacher l'enfant et ne pas suspendre de sacs aux poignées, car la poussette risque de basculer.

## Au quotidien
**Régler sa poussette**
- Ajustez la hauteur du guidon pour marcher bras légèrement fléchis, épaules relâchées, sans vous pencher en avant.
- Gonflez les roues si elles le sont, et vérifiez régulièrement roues, freins, verrouillage et harnais.
- Rangez les affaires dans le panier prévu, pas sur les poignées.

**Progresser semaine après semaine**
- Commencez par de courtes sorties sur terrain plat.
- Allongez la durée, puis accélérez le pas : vous devez pouvoir parler en marchant.
- Ajoutez des petites montées quand vous vous sentez prête.
- Changez de parcours pour garder le plaisir : parc, bord de l'eau, rues calmes.

**Bien marcher**
- Grandissez-vous, regardez devant vous, gardez la poussette proche de votre corps.
- Respirez régulièrement ; dans les montées, soufflez sur l'effort.
- Portez des chaussures confortables et emportez de l'eau.

**Penser à bébé**
- Adaptez sa tenue à la météo : il bouge moins que vous.
- Protégez-le du soleil et de la chaleur, et du froid et du vent en hiver.
- Ne laissez jamais la poussette sans surveillance, même un instant.

**Marcher à plusieurs**
- Proposez des balades à d'autres parents : la motivation est plus facile à plusieurs, et c'est l'occasion de sortir de l'isolement.

## Questions fréquentes
**Puis-je marcher avec bébé en poussette dès le retour à la maison ?**
Oui si vous vous en sentez capable, en commençant par de courtes sorties. Après une césarienne, suivez les conseils de l'équipe pour la durée et la fréquence.

**Soulever la poussette dans les escaliers, est-ce un problème ?**
Dans les semaines suivant l'accouchement, il est conseillé d'éviter de porter des charges lourdes. Demandez de l'aide, utilisez l'ascenseur ou repliez la poussette en portant bébé séparément.

**Faut-il une poussette « sport » pour marcher vite ?**
Pour la marche, une poussette adaptée à l'âge de bébé, en bon état et conforme aux normes suffit. Pour courir, vérifiez dans la notice si le modèle est prévu pour cet usage.

## Quand demander conseil
Rentrez et consultez en cas de fuites, de pesanteur, de douleur de cicatrice, de saignements qui augmentent ou de fatigue inhabituelle. Douleur dans la poitrine, essoufflement anormal, mollet douloureux et gonflé : appelez le **15** ou le **112**. Vérifiez sur Rappel Conso si votre poussette fait l'objet d'un rappel.

${FIN}`,
  },
  {
    ...K, slug: 'portage-bebe-et-dos-du-parent', category: 'post-partum', max_age_months: 24,
    title: 'Porter son bébé sans se faire mal au dos',
    summary: 'Position sûre pour bébé, portage haut et serré, durée adaptée : les repères pour porter en écharpe ou en porte-bébé en ménageant votre dos.',
    tags: ['portage', 'écharpe de portage', 'porte-bébé', 'mal de dos', 'dos du parent', 'sécurité bébé', 'post-partum'],
    sources: [S.mpediaEcharpe, S.mpediaTransport, S.ameliDos],
    body_md: `## En bref
- Un portage sûr : bébé en position verticale, poitrine contre la vôtre, **visage et nez dégagés**, assez haut pour garder son visage sous vos yeux.
- Un portage bien serré et haut répartit mieux le poids et ménage votre dos.
- Pour un nouveau-né, le portage se fait face à vous ; le portage « face au monde » est déconseillé par mpedia.
- Choisissez un porte-bébé conforme aux normes, adapté au poids et à l'âge de l'enfant.

## Comprendre
Le portage apaise beaucoup de bébés et libère les mains du parent. mpedia (Association française de pédiatrie ambulatoire) décrit la position physiologique : dos arrondi, genoux repliés vers le nombril, bassin basculé, tête dans l'axe de la colonne. Elle insiste sur la sécurité : nez toujours dégagé, tête jamais entièrement couverte, bébé assez haut pour garder son visage sous vos yeux, surveillance continue de sa couleur, de sa tonicité et de sa température.

L'écharpe convient jusqu'à environ 10 à 12 kg selon mpedia ; au-delà, un porte-bébé « prêt à porter » avec une assise large et profonde est plus adapté. Un porte-bébé ventral s'utilise de la naissance à environ 9 mois, un porte-bébé dorsal à partir d'environ 9 mois.

Pour votre dos, l'Assurance Maladie rappelle que bouger régulièrement et limiter la sédentarité aident à prévenir le mal de dos.

## Au quotidien
**Installer bébé**
- Gardez une main sous ses fesses pendant toute la mise en place.
- Vérifiez : visage visible sur le côté, nez dégagé, tête jamais couverte (même en hiver), tête et pieds libres, sa tête à la base de votre cou.
- Serrez bien l'écharpe ou les sangles : un bébé qui « pend » tire sur vos épaules et votre dos.

**Ménager son dos**
- Portez haut et près du corps : le centre de gravité reste proche du vôtre.
- Répartissez le poids sur les deux épaules et les hanches ; réglez la ceinture du porte-bébé sur les hanches.
- Alternez portage et poussette pour les longues sorties.
- Pour vous pencher, pliez les genoux en gardant une main sur bébé.
- Entre deux portages, étirez-vous doucement et bougez.

**Choisir le matériel**
- Achetez un porte-bébé conforme à la norme européenne en vigueur, avec une notice en français indiquant l'âge et le poids auxquels il convient, et évitez le matériel de brocante, comme le conseille mpedia.
- Consultez le site Rappel Conso pour vérifier que votre modèle ne fait pas l'objet d'un rappel.
- Des ateliers de portage existent (maternités, PMI, associations) : demandez à votre sage-femme.

**Les premières semaines**
- Après une césarienne ou si votre périnée est fragile, demandez conseil avant de porter longtemps ; commencez par des portages courts.

## Questions fréquentes
**Combien de temps puis-je porter bébé ?**
mpedia ne fixe pas de durée maximale. Écoutez votre dos et celui de bébé : faites des pauses, et arrêtez si vous avez mal.

**Pourquoi le portage face au monde est-il déconseillé ?**
Selon mpedia, il comprime la cage thoracique de bébé, ne respecte pas la position physiologique et ne lui laisse aucun repli face aux stimulations.

**Peut-on allaiter en portant bébé ?**
Les sources consultées n'abordent pas ce point. Comme le nez de bébé doit rester dégagé en permanence, demandez conseil à une sage-femme ou lors d'un atelier de portage avant d'essayer, ou installez-vous plutôt assise.

## Quand demander conseil
Sortez immédiatement bébé du porte-bébé s'il respire mal, change de couleur, devient mou ou ne réagit pas, et appelez le **15** ou le **112**. Consultez votre médecin si votre mal de dos s'accompagne de fièvre, de fourmillements ou de faiblesse dans les jambes, ou ne s'améliore pas.

${FIN}`,
  },
  {
    ...K, slug: 'mal-de-dos-apres-accouchement-bouger', category: 'post-partum', max_age_months: 24,
    title: 'Mal de dos après l’accouchement : bouger pour aller mieux',
    summary: 'Portages, tétées, nuits courtes : le dos est très sollicité après la naissance. Le mouvement fait partie des solutions, avec quelques ajustements du quotidien.',
    tags: ['mal de dos', 'lombalgie', 'dos après accouchement', 'post-partum', 'tétée', 'posture', 'activité physique'],
    sources: [S.ameliDos, S.ameliDosComprendre, S.sportsGuide],
    body_md: `## En bref
- Le mal de dos est fréquent dans les mois qui suivent la naissance : portages, postures de tétée ou de biberon, fatigue.
- Selon l'Assurance Maladie, une lombalgie aiguë guérit d'elle-même dans 90 % des cas.
- Le repos au lit n'est pas recommandé : reprendre rapidement ses activités quotidiennes aide à guérir.
- L'activité physique après l'accouchement contribue à diminuer les douleurs lombaires.

## Comprendre
La lombalgie, ou mal de dos, est une douleur du bas du dos, parfois avec une sensation de blocage. L'Assurance Maladie explique qu'elle est le plus souvent d'origine mécanique (effort, faux mouvement, mauvaise position, contracture) et qu'elle est favorisée par la sédentarité, mais aussi par l'anxiété, une humeur déprimée ou le manque de sommeil, autant de facteurs fréquents après une naissance.

Le message de l'Assurance Maladie est clair : **le bon traitement, c'est le mouvement**. L'intensité de la douleur ne dit rien de sa gravité, et la peur de bouger peut retarder la guérison. Il n'existe pas de gymnastique spécifique : les gestes de la vie courante pratiqués sans forcer (marche, vélo, courses…) sont bénéfiques.

Le guide du ministère chargé des Sports cite, parmi les bénéfices de l'activité physique après l'accouchement, la diminution des douleurs lombaires.

## Au quotidien
**Pendant les tétées ou les biberons**
- Installez-vous le dos soutenu, les pieds à plat ou sur un petit support.
- Amenez bébé à vous, à l'aide d'un coussin, plutôt que de vous pencher vers lui.
- Changez de position d'une fois à l'autre.

**Pour les soins**
- Réglez la table à langer à la hauteur de votre taille.
- Pour la baignoire et le lit, pliez les genoux plutôt que le dos.
- Pour coucher ou lever bébé, approchez-vous au maximum.

**Bouger chaque jour**
- Marchez, avec ou sans bébé, un peu plus chaque jour.
- Toutes les deux heures passées assise ou allongée, marchez quelques minutes, étirez-vous, mobilisez vos articulations.
- La natation est une option : le guide du ministère, à propos de la grossesse, souligne que l'eau décharge les articulations et soulage les douleurs lombaires.
- L'Assurance Maladie propose une application gratuite d'exercices et de conseils pour le dos.

**Prendre soin de soi**
- Dès que possible, reposez-vous, confiez bébé quelques heures, dormez pendant ses siestes.
- Si la douleur est difficile à supporter, consultez votre médecin plutôt que de prendre un médicament de vous-même, surtout si vous allaitez.

## Questions fréquentes
**Dois-je rester allongée quand j'ai mal au dos ?**
Non : selon l'Assurance Maladie, le repos au lit n'est pas recommandé. Bougez progressivement, sans forcer, en adaptant vos gestes.

**Le portage aggrave-t-il le mal de dos ?**
Un portage haut, serré et bien réparti sollicite moins le dos. Si vous avez mal, alternez avec la poussette et faites vérifier vos réglages lors d'un atelier de portage.

**Combien de temps dure une lombalgie ?**
La prise en charge porte sur les premiers jours et jusqu'à 4 à 6 semaines. Au-delà, ou si la douleur revient souvent, reparlez-en à votre médecin pour éviter qu'elle ne s'installe.

## Quand demander conseil
Consultez votre médecin si la douleur ne s'améliore pas, revient souvent, vous empêche de vous occuper de bébé, ou s'accompagne de fièvre, de fourmillements, d'une perte de force dans une jambe ou de troubles pour uriner ou aller à la selle. En cas de douleur très intense avec malaise, ou de douleur dans la poitrine, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'allaitement-et-activite-physique', category: 'sport', max_age_months: 24,
    title: 'Allaitement et activité physique : ce qu’il faut savoir',
    summary: 'Une activité physique modérée ne modifie ni la quantité ni la qualité du lait : comment concilier tétées et reprise du sport en pratique.',
    tags: ['allaitement', 'sport et allaitement', 'activité physique', 'lait maternel', 'reprise du sport', 'post-partum', 'tétée'],
    sources: [S.hasFiche, S.sportsGuide, S.ameliRetour],
    body_md: `## En bref
- Selon la Haute Autorité de santé (HAS) et le ministère chargé des Sports, une activité physique modérée ne modifie ni la quantité ni la qualité du lait.
- Elle n'influence pas la tétée et n'a pas de répercussion négative sur la croissance du bébé.
- Le guide du ministère indique qu'elle aide aussi à prévenir la perte de densité minérale osseuse.
- Pas de régime pendant l'allaitement : une alimentation variée et de l'eau en quantité suffisante.

## Comprendre
Beaucoup de mères se demandent si le sport risque de « tarir » leur lait ou d'en changer le goût. Les sources officielles sont rassurantes pour une activité modérée. Le guide du ministère chargé des Sports précise qu'une activité physique modérée ne modifie ni la quantité ni la qualité nutritionnelle du lait, n'influence pas la tétée et n'a pas de répercussion négative sur la croissance du nouveau-né. Il ajoute qu'elle contribue à prévenir la perte de densité minérale osseuse. La HAS confirme que l'activité physique ne modifie ni la quantité ni la qualité du lait maternel.

L'Assurance Maladie rappelle de ne pas suivre de régime si vous allaitez et de boire beaucoup d'eau. L'allaitement ne change pas les règles de la reprise : progressivité, et rééducation du périnée avant les activités intenses ou avec impacts.

## Au quotidien
**Avant la séance**
- Proposez le sein ou tirez votre lait avant de partir : des seins moins pleins sont plus confortables pour bouger.
- Portez un soutien-gorge de sport qui maintient bien, sans serrer.
- Prévoyez des coussinets d'allaitement si vous avez des écoulements.

**Pendant la séance**
- Buvez régulièrement, avant, pendant et après.
- Restez à une intensité modérée : vous devez pouvoir parler en bougeant.

**Après la séance**
- Prenez une collation si vous avez faim : un fruit, un laitage, du pain.
- Continuez à boire de l'eau dans les heures qui suivent.

**Organiser son temps**
- Placez la séance juste après une tétée pour avoir plus de marge.
- Les activités avec bébé (marche, poussette, exercices à la maison) permettent de rester disponible pour les tétées.

## Questions fréquentes
**Le sport peut-il faire baisser ma lactation ?**
Une activité modérée ne modifie pas la quantité de lait selon la HAS et le ministère chargé des Sports. Si vous remarquez une baisse, pensez aussi à l'hydratation, à l'alimentation et à la fatigue, et parlez-en à votre sage-femme ou à une consultante en lactation.

**L'activité physique est-elle bonne pour mes os pendant l'allaitement ?**
Le guide du ministère chargé des Sports indique qu'une activité physique modérée aide à prévenir la perte de densité minérale osseuse. C'est un bénéfice de plus pour bouger régulièrement.

**Puis-je reprendre la course ou la musculation en allaitant ?**
Oui, quand votre récupération le permet : après la rééducation du périnée pour les activités à impacts, et progressivement. L'allaitement en lui-même n'est pas un obstacle.

**Puis-je faire un régime pour perdre du poids en même temps ?**
L'Assurance Maladie déconseille de suivre un régime pendant l'allaitement. Mangez de façon variée, buvez beaucoup d'eau et laissez l'activité physique agir progressivement, à votre rythme.

## Quand demander conseil
Consultez votre médecin ou votre sage-femme si un sein devient rouge, chaud et douloureux, avec une impression de grippe ou de la fièvre. Signalez aussi une fatigue intense, une perte de poids importante ou des difficultés d'allaitement qui vous inquiètent. En cas de malaise ou de douleur dans la poitrine pendant l'effort, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'fatigue-post-partum-et-activite-physique', category: 'post-partum', max_age_months: 12,
    title: 'Fatigue après la naissance : se reposer ou bouger ?',
    summary: 'La fatigue est fréquente après un accouchement : comment trouver l’équilibre entre repos, aide de l’entourage et activité physique douce, et quand s’en inquiéter.',
    tags: ['fatigue', 'épuisement', 'post-partum', 'sommeil', 'repos', 'jeune maman', 'activité physique'],
    sources: [S.has2014, S.ameliRetour, S.sportsGuide],
    body_md: `## En bref
- La fatigue est très fréquente après un accouchement : la Haute Autorité de santé (HAS) invite à se ménager et à demander l'aide de l'entourage.
- Le repos passe d'abord, notamment par de courtes siestes.
- Une activité physique douce et adaptée améliore la qualité du sommeil et le moral.
- Une fatigue intense ou un manque d'entrain qui vous paraît inhabituel mérite d'être signalé.

## Comprendre
L'accouchement, les nuits fragmentées, l'allaitement ou les biberons de nuit, la récupération physique : la fatigue des premières semaines a de nombreuses causes. La HAS, dans son document de sortie de maternité, reconnaît qu'être fatiguée est fréquent à cette période et conseille de prendre soin de soi, de se ménager et de solliciter l'entourage. L'Assurance Maladie recommande de récupérer le sommeil par de courtes siestes et de s'entourer de proches.

Bouger peut sembler contradictoire avec la fatigue, et pourtant : le guide du ministère chargé des Sports cite, parmi les bénéfices de l'activité physique après l'accouchement, une meilleure qualité du sommeil et la diminution de l'anxiété et des symptômes dépressifs. Tout est question de dosage : une marche courte et régulière n'a rien à voir avec une séance intense.

Enfin, la fatigue peut aussi être un signe de dépression du post-partum ou d'un problème de santé. L'Assurance Maladie invite à signaler à votre médecin ou à votre sage-femme toute lassitude ou tout manque d'entrain qui vous paraît anormal.

## Au quotidien
**Organiser le repos**
- Dormez quand bébé dort, au moins pour une sieste dans la journée.
- Partagez les nuits si c'est possible : l'autre parent peut prendre en charge un change ou un biberon de lait tiré.
- Simplifiez le reste : repas simples, ménage minimal, visites limitées.

**Demander de l'aide**
- Listez des tâches précises que vos proches peuvent faire : courses, lessive, garder bébé une heure.
- La PMI peut envoyer une puéricultrice à domicile si besoin, rappelle l'Assurance Maladie : n'hésitez pas à la contacter.

**Bouger à petites doses**
- Une courte marche de 10 à 15 minutes avec bébé peut faire du bien.
- Préférez les moments de la journée où vous vous sentez un peu plus en forme.
- Les jours de grande fatigue, contentez-vous d'étirements doux ou d'un tour du pâté de maisons, ou de rien : le repos est aussi un soin.

**Manger et boire**
- Prenez des repas réguliers et gardez de l'eau à portée de main. Pas de régime pendant l'allaitement, ni avant les 3 mois de l'enfant si vous n'allaitez pas.

## Questions fréquentes
**Je suis épuisée, dois-je arrêter toute activité ?**
Écoutez-vous. Si vous êtes très fatiguée, privilégiez le repos et une activité très légère. Si la fatigue ne s'améliore pas malgré le repos, consultez.

**Le sport va-t-il me fatiguer encore plus ?**
Une activité trop intense ou trop précoce, oui. Une activité douce et progressive, au contraire, est associée à un meilleur sommeil. Commencez petit.

**Comment savoir si c'est plus que de la fatigue ?**
Si la fatigue s'accompagne de tristesse, de perte d'intérêt, de culpabilité, d'anxiété ou de troubles du sommeil qui durent plus de deux semaines, parlez-en à votre médecin ou à votre sage-femme : ce peut être une dépression du post-partum, qui se soigne.

## Quand demander conseil
Consultez votre médecin ou votre sage-femme en cas de fatigue intense ou persistante, d'essoufflement, de palpitations, de fièvre, ou de manque d'entrain qui vous inquiète. Si vous avez des idées noires ou peur de faire du mal à votre bébé, appelez le **3114** (24 h/24) ou le **15**. En cas de malaise ou de difficulté à respirer, appelez le **15** ou le **112**. Allô Parents Bébé : 0 800 00 34 56 (gratuit).

${FIN}`,
  },
  {
    ...K, slug: 'activite-physique-et-moral-apres-naissance', category: 'sante-mentale', max_age_months: 12,
    title: 'Activité physique et moral après la naissance',
    summary: 'Bouger peut améliorer l’humeur et diminuer l’anxiété après l’accouchement, sans remplacer une aide adaptée en cas de dépression du post-partum.',
    tags: ['moral', 'baby blues', 'dépression post-partum', 'anxiété', 'activité physique', 'santé mentale', 'post-partum'],
    sources: [S.hasFiche, S.ameliBabyBlues, S.santeMentale],
    body_md: `## En bref
- Selon la Haute Autorité de santé (HAS), une activité physique régulière après l'accouchement peut améliorer l'humeur et réduire les signes dépressifs.
- Elle est un soutien, pas un traitement à elle seule : une dépression du post-partum nécessite une prise en charge.
- Le baby blues apparaît dans les premiers jours et disparaît en deux semaines ; au-delà, ou s'il est très marqué, consultez.
- Bouger à plusieurs (balades entre parents, cours parent-bébé) aide aussi à rompre l'isolement.

## Comprendre
La HAS indique qu'une activité physique régulière favorise la santé physique et mentale et que, dans les mois suivant l'accouchement, elle peut améliorer l'humeur et réduire les signes dépressifs. La HAS souligne aussi que pratiquer à plusieurs favorise les relations et le soutien.

Il est important de distinguer :
- **le baby blues**, qui touche de nombreuses femmes, apparaît entre le 2e et le 5e jour et disparaît en deux semaines (irritabilité, pleurs, fatigue, anxiété) ;
- **la dépression du post-partum**, qui peut survenir dans l'année suivant la naissance, avec une période à risque entre le 2e et le 6e mois. L'Assurance Maladie indique qu'elle touche 16,7 % des femmes deux mois après l'accouchement. Elle se manifeste notamment par une grande tristesse, une perte d'intérêt, un épuisement, une culpabilité, une anxiété importante, des troubles du sommeil ou de l'appétit.

Les seconds parents sont aussi concernés : plus de 10 % des pères présentent des symptômes dépressifs dans les deux mois suivant la naissance, selon l'Assurance Maladie.

## Au quotidien
**Faire du mouvement un moment pour soi**
- Une sortie à pied, seule ou avec bébé, peut offrir une pause dans la journée.
- Choisissez une activité qui vous apporte du plaisir plutôt qu'un objectif de silhouette.
- Ne vous imposez pas de performance : quelques minutes comptent.

**Bouger avec d'autres**
- Proposez à d'autres parents des balades en poussette.
- Renseignez-vous sur les cours parent-bébé, les lieux d'accueil enfants-parents (LAEP) financés par la Caf, ou les activités de la PMI.

**Ne pas rester seule avec ses difficultés**
- Si vous ne vous sentez pas bien, dites-le tôt : à votre partenaire, à votre sage-femme, à votre médecin, à la PMI.
- L'entretien postnatal précoce (entre la 4e et la 8e semaine) est un moment prévu pour parler de votre ressenti.
- Le dispositif Mon soutien psy permet des séances avec un psychologue prises en charge par l'Assurance Maladie.

## Questions fréquentes
**Le sport peut-il remplacer un traitement de la dépression ?**
Non. L'activité physique peut accompagner le mieux-être, mais une dépression du post-partum se soigne avec une prise en charge adaptée (psychothérapie, parfois médicament compatible avec l'allaitement), décidée avec un professionnel.

**Je n'ai envie de rien, même pas de sortir. Que faire ?**
La perte d'envie qui dure est l'un des signes qui doivent faire consulter. Parlez-en à votre médecin ou à votre sage-femme ; un questionnaire de bien-être émotionnel est aussi proposé par le site 1000 premiers jours.

**Mon conjoint semble irritable et s'investit à l'excès dans le sport ou le travail : est-ce lié ?**
Chez les pères, la dépression peut se manifester par de l'irritabilité, une multiplication des activités, de la fatigue et un repli. Encouragez-le à en parler à un médecin.

## Quand demander conseil
Consultez si le baby blues est très marqué ou dure plus de deux semaines, ou si plusieurs signes de dépression persistent. Si vous avez des idées suicidaires ou peur de faire du mal à votre bébé, appelez le **3114** (24 h/24, gratuit) ou le **15**. Agitation, insomnie totale, propos incohérents ou hallucinations après l'accouchement : c'est une urgence, appelez le **15** ou le **112**. Si un enfant est en danger, appelez le **119**. Allô Parents Bébé : 0 800 00 34 56.

${FIN}`,
  },
  {
    ...K, slug: 'reprendre-le-sport-apres-une-cesarienne', category: 'reeducation', max_age_months: 24,
    title: 'Reprendre le sport après une césarienne',
    summary: 'Après une césarienne, la paroi abdominale a besoin d’environ deux mois pour se reconstituer : marche d’abord, puis reprise progressive après avis médical.',
    tags: ['césarienne', 'sport après césarienne', 'cicatrice', 'paroi abdominale', 'reprise du sport', 'post-partum', 'abdominaux'],
    sources: [S.hasFiche, S.santeActivite, S.has2014],
    body_md: `## En bref
- Une césarienne est une intervention chirurgicale : la paroi abdominale doit se reconstituer avant les efforts intenses.
- Les sources officielles évoquent environ 2 mois (Santé publique France) ou au moins 8 à 10 semaines selon la cicatrisation (HAS).
- La marche, selon votre confort et les conseils de l'équipe, reste possible avant.
- Le périnée a lui aussi porté la grossesse : son évaluation compte aussi après une césarienne.

## Comprendre
Lors d'une césarienne, la paroi abdominale est incisée puis refermée : elle a besoin de temps pour se reconstituer. Santé publique France indique qu'il faut attendre la reconstitution de la paroi abdominale, environ 2 mois, avant les activités plus intenses. La Haute Autorité de santé (HAS) parle d'au moins 8 à 10 semaines, selon la cicatrisation. Le délai exact dépend de votre confort et de la façon dont la cicatrice évolue : il se discute avec votre sage-femme ou votre médecin.

Une césarienne ne dispense pas de penser au périnée : neuf mois de grossesse l'ont sollicité. La consultation postnatale permet d'évaluer à la fois la cicatrice, la paroi abdominale et le périnée, et de prescrire si besoin une rééducation.

## Au quotidien
**Les premières semaines**
- Levez-vous et marchez un peu chaque jour, selon les conseils de l'équipe et votre confort.
- Évitez de porter des charges lourdes, y compris le siège auto avec bébé dedans.

**Surveiller la cicatrice**
- Regardez-la chaque jour : rougeur, chaleur, écoulement ou douleur qui augmente doivent faire appeler la sage-femme ou le médecin.

**Après le feu vert**
- Reprenez avec des activités douces : marche active, vélo doux, natation à allure modérée, quand la cicatrice le permet.
- Commencez le travail abdominal par le muscle transverse et le gainage léger, avec l'accord de votre professionnel.
- Augmentez progressivement la durée puis l'intensité.
- Les activités avec impacts viennent après l'évaluation du périnée et, si besoin, sa rééducation.

**Écouter les sensations**
- Tiraillements légers : ralentissez. Douleur vive, sensation de « déchirure » ou bosse sur la cicatrice : arrêtez et consultez.

## Questions fréquentes
**Pourquoi attendre plus longtemps qu'après une voie basse ?**
Parce que la paroi abdominale a été incisée et doit cicatriser en profondeur. Les délais indiqués sont des repères : votre médecin ou votre sage-femme adapte selon votre cicatrisation.

**Ma cicatrice est insensible ou tire encore après plusieurs mois, est-ce un frein ?**
Parlez-en à la consultation postnatale ou à votre kinésithérapeute : ils peuvent évaluer la cicatrice et vous proposer des conseils adaptés avant de reprendre.

**Faut-il quand même une rééducation du périnée après une césarienne ?**
Elle n'est pas automatique, mais le périnée a porté la grossesse. La HAS recommande fortement la rééducation périnéale avant une activité intense ou sportive, pour réduire les risques de fuites et de prolapsus : parlez de vos projets d'activité lors de la consultation postnatale.

**Puis-je porter mon bébé en écharpe après une césarienne ?**
Demandez conseil à l'équipe : selon votre confort, des portages courts et bien ajustés peuvent être envisagés, en évitant de comprimer la cicatrice.

## Quand demander conseil
Appelez votre médecin ou votre sage-femme si la cicatrice devient plus douloureuse, très rouge, chaude ou présente un écoulement, en cas de fièvre (plus de 38 °C), de jambe gonflée, rouge ou douloureuse, ou de douleur au ventre qui augmente. Appelez le **15** ou le **112** en cas de saignement très abondant, de difficulté à respirer ou de douleur dans la poitrine.

${FIN}`,
  },
  {
    ...K, slug: 'reprendre-le-sport-apres-une-episiotomie', category: 'reeducation', max_age_months: 24,
    title: 'Reprendre le sport après une épisiotomie ou une déchirure',
    summary: 'Après une épisiotomie, la reprise se décide avec le professionnel qui vous suit, une fois la cicatrice guérie et le périnée rééduqué si besoin.',
    tags: ['épisiotomie', 'déchirure périnéale', 'cicatrice', 'périnée', 'reprise du sport', 'post-partum', 'douleurs périnéales'],
    sources: [S.santeActivite, S.hasFiche, S.has2002],
    body_md: `## En bref
- Après une épisiotomie, la reprise du sport se fait après l'avis du professionnel qui vous suit et la fin de la rééducation périnéale, selon Santé publique France.
- La Haute Autorité de santé (HAS) évoque au moins 8 à 10 semaines, selon la cicatrisation.
- La marche douce reste possible avant, à votre rythme.
- Des douleurs périnéales qui persistent, notamment pendant les rapports, justifient d'en parler : elles font partie des indications de rééducation.

## Comprendre
L'épisiotomie est une incision du périnée réalisée pendant l'accouchement ; une déchirure peut aussi se produire spontanément. Dans les deux cas, une cicatrice doit guérir : l'équipe de la maternité puis la sage-femme vous indiquent les soins à faire.

Pour la reprise, Santé publique France précise qu'après une épisiotomie, elle se fait après l'avis du professionnel qui vous suit et après la rééducation périnéale. La HAS indique un délai d'au moins 8 à 10 semaines, selon la cicatrisation.

Les recommandations de 2002 (ANAES, aujourd'hui HAS) citent les douleurs périnéales persistantes, en particulier si les rapports sont douloureux, parmi les situations justifiant une rééducation. Elles indiquent aussi que le froid (cryothérapie) est la seule technique ayant montré un effet sur les douleurs périnéales.

Si vous avez eu une déchirure, les mêmes questions se posent : c'est le professionnel qui vous suit qui vous dira quand reprendre, selon l'étendue de la déchirure et sa cicatrisation.

## Au quotidien
**Pendant la cicatrisation**
- Privilégiez la marche, en courtes sorties ; si la position assise est douloureuse, alternez avec des moments allongée.
- Un coussin peut rendre la position assise plus confortable : demandez conseil à la sage-femme.
- Demandez à la sage-femme si le froid peut vous soulager.
- Prévenez la constipation et ne poussez pas fort aux toilettes.

**Avant de reprendre**
- Faites vérifier la cicatrice à la consultation postnatale.
- Parlez de toute douleur, de toute gêne pendant les rapports, de toute fuite.
- Si une rééducation vous est prescrite, terminez-la avant les activités intenses ou à impacts.

**La reprise**
- Commencez par des activités sans frottement ni impact sur le périnée : marche, natation (une fois la cicatrice fermée et après avis), exercices doux au sol.
- Le vélo et les activités qui appuient sur le périnée peuvent être inconfortables au début : testez de courtes durées.
- Augmentez progressivement l'intensité.

## Questions fréquentes
**Ma cicatrice me fait encore mal à 2 mois, est-ce un problème ?**
Une douleur qui persiste mérite d'être signalée. Le professionnel peut examiner la cicatrice et proposer une rééducation ou d'autres solutions.

**Les rapports sexuels sont douloureux depuis l'épisiotomie, à qui en parler ?**
À votre sage-femme, votre médecin ou votre gynécologue. Ces douleurs sont une indication reconnue de rééducation : n'hésitez pas à les évoquer.

**Puis-je faire du vélo ?**
Le vélo n'a pas d'impact, mais la selle appuie sur le périnée. Attendez que la cicatrice ne soit plus douloureuse et demandez l'avis de votre professionnel.

## Quand demander conseil
Appelez votre médecin ou votre sage-femme si la cicatrice devient plus douloureuse, très rouge, gonflée ou présente un écoulement, en cas de fièvre, de pertes malodorantes, de difficulté à uriner ou à retenir gaz et selles. Appelez le **15** ou le **112** en cas de saignement très abondant.

${FIN}`,
  },
  {
    ...K, slug: 'signes-d-alerte-reprise-activite-physique-post-partum', category: 'post-partum', max_age_months: 12, safety_critical: true,
    title: 'Signes d’alerte pendant la reprise de l’activité physique après l’accouchement',
    summary: 'Saignements, douleur dans la poitrine, mollet douloureux, fuites, pesanteur : les signaux qui doivent faire arrêter l’effort et consulter, ou appeler le 15.',
    tags: ['signes d’alerte', 'urgence post-partum', 'hémorragie', 'phlébite', 'essoufflement', 'reprise du sport', 'quand consulter'],
    sources: [S.has2014, S.sportsGuide, S.santeSuivi],
    body_md: `## En bref
- Certains symptômes doivent faire **arrêter l'activité** et consulter : saignements, douleur thoracique, essoufflement anormal, malaise, mollet douloureux.
- Appelez le **15** ou le **112** en cas de saignement très abondant, de difficulté à respirer ou de douleur dans la poitrine.
- D'autres signes appellent une consultation sans urgence vitale : fuites, pesanteur, douleur de cicatrice, fièvre.
- En cas de doute, mieux vaut s'arrêter et demander conseil.

## Comprendre
Reprendre une activité physique après un accouchement est bénéfique, mais le corps est encore en récupération. Les premières semaines peuvent exposer à des complications sérieuses, comme une hémorragie ou une phlébite (caillot dans une veine de la jambe). La Haute Autorité de santé (HAS) liste, dans son document de sortie de maternité, les signes qui doivent faire appeler les urgences et ceux qui doivent faire appeler le médecin ou la sage-femme.

Le guide du ministère chargé des Sports donne aussi une liste de signaux d'arrêt de l'activité, rédigée pour la grossesse, qui reste utile à connaître : essoufflement qui persiste au repos, fatigue intense, vertiges ou malaise, douleur thoracique, douleur, gonflement ou rougeur d'un mollet, faiblesse musculaire avec perte d'équilibre, saignements.

## Au quotidien
**Arrêtez l'effort et appelez le 15 ou le 112 si :**
- vous saignez beaucoup : sang très rouge qui imbibe complètement plusieurs serviettes en deux heures, sans diminuer ;
- vous avez du mal à respirer ou une douleur dans la poitrine ;
- vous faites un malaise ou perdez connaissance.

**Arrêtez et appelez votre médecin ou votre sage-femme si :**
- vous avez de la fièvre (plus de 38 °C) ;
- un mollet ou une jambe est gonflé, rouge ou douloureux ;
- une cicatrice (périnéale ou de césarienne) devient plus douloureuse, très rouge, ou coule ;
- vos pertes sont malodorantes ou vos saignements reprennent ou vous inquiètent ;
- un sein est rouge et douloureux, avec une impression de grippe ;
- vous avez mal en urinant ou du mal à uriner.

**Ralentissez et parlez-en à la prochaine consultation si :**
- des fuites urinaires apparaissent à l'effort, même légères ;
- vous ressentez une pesanteur ou une gêne dans le bas du ventre ;
- un renflement apparaît au milieu du ventre pendant l'effort ;
- une douleur au dos, au pubis ou aux articulations s'installe.

**Avant chaque séance**
- Gardez votre téléphone sur vous et prévenez un proche de votre sortie.
- Emportez de l'eau et ne partez pas le ventre vide.

## Questions fréquentes
**Mes saignements ont repris après une séance, que faire ?**
Arrêtez l'activité et reposez-vous. S'ils sont abondants, appelez le 15. S'ils sont modérés mais vous inquiètent ou persistent, contactez votre sage-femme ou votre médecin.

**Comment reconnaître une phlébite ?**
Une jambe ou un mollet gonflé, rouge, chaud ou douloureux doit faire consulter rapidement. Si s'y ajoutent un essoufflement ou une douleur thoracique, appelez le 15 ou le 112.

**J'ai des fuites quand je saute : est-ce une urgence ?**
Non, mais c'est un signal à prendre au sérieux. Revenez à des activités sans impacts et parlez-en : une rééducation périnéale peut être indiquée.

## Quand demander conseil
**Urgence : 15 ou 112** en cas de saignement très abondant, de difficulté à respirer, de douleur dans la poitrine ou de malaise. Consultez rapidement votre médecin ou votre sage-femme pour les autres signes listés ci-dessus. Tristesse, irritabilité ou culpabilité qui durent : parlez-en ; en cas de détresse psychique, appelez le **3114**.

${FIN}`,
  },
  {
    ...K, slug: 'activite-physique-apres-diabete-gestationnel', category: 'post-partum', max_age_months: 24,
    title: 'Activité physique après un diabète gestationnel',
    summary: 'Après un diabète de grossesse, le risque de diabète de type 2 augmente : l’activité physique, l’alimentation et le dépistage régulier font partie de la prévention.',
    tags: ['diabète gestationnel', 'diabète de grossesse', 'diabète de type 2', 'prévention', 'activité physique', 'glycémie', 'post-partum'],
    sources: [S.ameliDiabeteG, S.hasFiche, S.santeBouger],
    body_md: `## En bref
- Après un diabète gestationnel, la glycémie redevient en général normale, mais le risque de diabète de type 2 est multiplié par 7 et persiste au moins 25 ans, selon l'Assurance Maladie.
- Une activité physique suffisante, une alimentation équilibrée, l'arrêt du tabac et la correction d'un éventuel surpoids aident à le prévenir.
- La Haute Autorité de santé (HAS) indique que poursuivre l'activité physique, avec une alimentation équilibrée, réduit le risque de diabète ultérieur.
- Un dépistage régulier est prévu : à la consultation postnatale, à 3 mois, avant une nouvelle grossesse, puis tous les 1 à 3 ans.

## Comprendre
Le diabète gestationnel est un trouble de la glycémie qui apparaît pendant la grossesse. Après l'accouchement, l'Assurance Maladie explique que la glycémie redevient en général normale, au moins temporairement. Mais ce diabète de grossesse signale une fragilité : le risque de développer un diabète de type 2 est multiplié par 7, augmente avec le temps et persiste au moins 25 ans. Le risque de syndrome métabolique et le risque cardiovasculaire sont aussi augmentés.

C'est pourquoi un **dépistage** est recommandé : lors de la consultation postnatale (6 à 8 semaines), 3 mois après l'accouchement, avant toute nouvelle grossesse, puis tous les 1 à 3 ans selon les facteurs de risque, par une glycémie à jeun ou une hyperglycémie provoquée par voie orale. La tension artérielle et le bilan lipidique sont aussi surveillés.

La **prévention** repose sur l'hygiène de vie : activité physique suffisante, alimentation équilibrée, arrêt du tabac, correction d'un surpoids. La HAS rappelle que les habitudes prises pendant la grossesse (activité, alimentation équilibrée et contrôlée) valent la peine d'être poursuivies.

## Au quotidien
**Reprendre progressivement**
- Suivez le même calendrier que toutes les femmes : marche d'abord, activités plus intenses après la rééducation du périnée si besoin.
- Fixez-vous un objectif réaliste, puis visez à terme au moins 30 minutes d'activité dynamique par jour, comme la marche rapide.

**Rendre l'activité durable**
- Choisissez une activité qui vous plaît : la régularité sur des années compte plus qu'un effort intense quelques semaines.
- Intégrez le mouvement au quotidien : marcher pour les courses, prendre l'escalier, sortir avec bébé.
- Réduisez le temps passé assise : levez-vous et marchez quelques minutes au moins toutes les heures.

**Alimentation**
- Gardez une alimentation équilibrée, comme le recommandent l'Assurance Maladie et la HAS, sans régime restrictif pendant l'allaitement ; demandez conseil à votre médecin ou à un diététicien si besoin.

**Ne pas oublier les rendez-vous**
- Notez les dates de dépistage dans votre agenda ou dans l'application.
- Avant une nouvelle grossesse, parlez-en à votre médecin pour faire le bilan.

## Questions fréquentes
**Mon diabète a disparu après l'accouchement, dois-je quand même faire attention ?**
Oui. La glycémie se normalise souvent, mais le risque de diabète de type 2 reste augmenté pendant de nombreuses années. Le dépistage régulier et l'hygiène de vie font la différence.

**Je prenais de l'insuline pendant la grossesse, est-ce différent ?**
L'insuline est arrêtée après l'accouchement et la glycémie surveillée. Le risque ultérieur est plus élevé quand un traitement par insuline a été nécessaire : le suivi est d'autant plus important.

**Quelle activité choisir ?**
Toutes les activités sont possibles, selon la HAS, en tenant compte de votre état de santé avec votre professionnel. La meilleure est celle que vous pratiquerez régulièrement.

## Quand demander conseil
Faites vos dépistages aux dates prévues, même si vous vous sentez bien, et parlez du suivi à la consultation postnatale. Consultez votre médecin si vous êtes inhabituellement fatiguée ou si quelque chose vous inquiète. En cas de malaise avec sueurs, confusion ou perte de connaissance, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'bouger-au-quotidien-avec-un-bebe-peu-de-temps', category: 'sport', max_age_months: 24,
    title: 'Bouger au quotidien quand on a un bébé et peu de temps',
    summary: 'Fractionner l’activité, marcher pour ses trajets, limiter le temps assis : des idées concrètes pour rester active malgré un emploi du temps de jeune parent.',
    tags: ['bouger au quotidien', 'manque de temps', 'sédentarité', 'marche', 'activité physique', 'jeune parent', 'motivation'],
    sources: [S.santeBouger, S.santeActivite, S.sportsGuide],
    body_md: `## En bref
- Le repère pour les adultes : au moins 30 minutes d'activité dynamique par jour, et du renforcement musculaire, de l'assouplissement et de l'équilibre deux fois par semaine.
- Ces 30 minutes peuvent être fractionnées, par exemple en 3 fois 10 minutes.
- Réduire le temps passé assis compte aussi : se lever et marcher quelques minutes régulièrement.
- Chaque geste compte, surtout avec un bébé : marcher, monter les escaliers, jouer au sol.

## Comprendre
Avec un bébé, trouver une heure pour faire du sport relève parfois du défi. Bonne nouvelle : l'activité physique ne se limite pas au sport. Santé.fr rappelle que des gestes simples comptent (se lever de sa chaise, monter un étage à pied, jardiner) et que l'objectif pour les adultes est d'au moins 30 minutes d'activité dynamique par jour, comme la marche rapide. Il conseille aussi de réduire le temps passé assis et de se lever pour marcher quelques minutes au moins toutes les heures.

Le guide du ministère chargé des Sports précise que cette activité quotidienne peut être faite en une fois ou fractionnée, en 2 fois 15 minutes ou 3 fois 10 minutes. Santé publique France ajoute, pour l'après-accouchement, le renforcement musculaire, l'assouplissement et l'équilibre deux fois par semaine, à adapter à vos possibilités, une fois la rééducation du périnée faite si elle était nécessaire.

## Au quotidien
**Glisser l'activité dans la journée**
- Faites à pied ou à vélo les petits trajets : boulangerie, pharmacie, crèche.
- Prenez l'escalier plutôt que l'ascenseur quand vous n'avez pas la poussette.
- Descendez du bus un arrêt plus tôt.
- Pendant que bébé joue sur son tapis, faites quelques exercices au sol à côté de lui.
- Bercez bébé en marchant plutôt qu'assise, quand c'est possible.

**Bloquer de petits créneaux**
- Une balade de 10 minutes après le déjeuner, une autre en fin d'après-midi.
- Une courte séance de renforcement pendant la sieste de bébé.
- Un rendez-vous fixe dans la semaine avec un proche ou un groupe de parents.

**S'organiser à deux**
- Alternez avec l'autre parent : chacun a son créneau d'activité dans la semaine.
- Planifiez-les comme un rendez-vous dans l'agenda partagé.

**Rester motivée**
- Fixez-vous des objectifs modestes et atteignables.
- Notez vos sorties dans un carnet ou l'application : voir ses progrès encourage.
- Variez les activités et les lieux.
- Soyez indulgente : une semaine sans activité n'efface pas les précédentes.

**Limiter le temps assis**
- Pendant les tétées ou les biberons, vous êtes assise : profitez des autres moments pour vous lever et marcher.
- Après deux heures assise, levez-vous quelques minutes.

## Questions fréquentes
**Les tâches ménagères comptent-elles comme activité physique ?**
Les activités du quotidien qui vous font bouger comptent. Pour atteindre le repère des 30 minutes d'activité dynamique, ajoutez si possible de la marche rapide ou une activité qui vous essouffle un peu.

**Dix minutes, est-ce vraiment utile ?**
Oui. Le guide du ministère indique que l'activité quotidienne peut être fractionnée en séances de 10 minutes, et Santé.fr rappelle que de petits gestes réguliers ont des bénéfices.

**Je n'ai aucune motivation en ce moment, que faire ?**
Commencez par très peu, avec quelqu'un si possible. Si le manque d'envie s'étend à tout et dure, parlez-en à votre médecin : ce peut être un signe de fatigue importante ou de dépression du post-partum.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin en cas de fuites, de pesanteur, de douleur persistante ou de fatigue inhabituelle. En cas de douleur dans la poitrine, d'essoufflement anormal ou de malaise, appelez le **15** ou le **112**. Si vous vous sentez dépassée ou en détresse, appelez le **3114**.

${FIN}`,
  },
];
