/** Articles « Ajouts du 23 octobre 2026 et suivants » de la bibliothèque. */
import { S } from './sources';
import type { LibArticle } from './types';

export const ajouts20261023: LibArticle[] = [
  // ---------------------------------------------------------------- ajouts du 23 octobre 2026
  {
    slug: 'regurgitations-et-reflux-du-nourrisson',
    title: 'Régurgitations et reflux du nourrisson',
    summary: 'Les régurgitations sont fréquentes les premiers mois et diminuent souvent avec l’âge : comprendre pourquoi, les gestes qui aident au repas et au coucher, ce qu’il vaut mieux éviter et les signes qui doivent faire consulter ou appeler le 15.',
    body_md: `Beaucoup de bébés rejettent un peu de lait après la tétée ou le biberon, parfois juste un filet, parfois davantage. Ces régurgitations impressionnent souvent les parents, mais elles sont fréquentes et en général bien supportées par le bébé, qui continue de grandir et de prendre du poids. Elles diminuent habituellement quand l'enfant tient assis, puis debout, et mange plus solide.

## En bref
- Les régurgitations sont fréquentes les premiers mois et diminuent en général avec l'âge.
- Repas à sa faim, sans forcer ; pauses pour le rot ; bébé gardé droit 20 à 30 minutes après le repas.
- Pour dormir : toujours **à plat sur le dos**, sans surélever la tête du lit.
- Pas de médicament, d'épaississement maison ni de changement de lait sans avis médical.
- Certains signes doivent faire consulter, et d'autres appeler le **15** sans attendre.

## Comprendre
Chez le nourrisson, le muscle qui ferme le haut de l'estomac est encore immature, l'estomac est petit et l'alimentation est entièrement liquide. Une partie du lait peut donc remonter facilement, surtout après un repas copieux, quand bébé a avalé de l'air ou qu'il est allongé ou serré juste après.

On parle de **régurgitations** quand le lait remonte sans effort, souvent au moment du rot, chez un bébé qui va bien. Le **reflux gastro-œsophagien** désigne ces remontées ; il devient un problème quand il s'accompagne de signes de gêne (douleurs, pleurs, refus de manger, mauvaise prise de poids). Les **vomissements**, eux, sont des rejets en force, avec un effort : ils méritent plus d'attention.

## Au quotidien
**Pendant et après le repas**
- Laissez bébé manger à sa faim, sans le forcer ni le restreindre ; des repas un peu moins copieux et plus fréquents peuvent aider.
- Au biberon : vérifiez le dosage de la poudre et la préparation, ainsi que le débit de la tétine.
- Allaitement : poursuivez-le sans changer vos habitudes.
- Faites des pauses pour le rot pendant et après le repas.
- Gardez bébé en position droite, contre vous, 20 à 30 minutes après le repas.
- Évitez les vêtements ou couches trop serrés au niveau du ventre.

**Pour dormir** : toujours à plat sur le dos, dans son lit, sans surélever la tête du lit ni le caler. Ces mesures de couchage protègent contre la mort inattendue du nourrisson et restent valables en cas de régurgitations.

**À éviter**
- Épaissir soi-même le lait maternel ou ajouter des céréales au lait sans avis médical.
- Laisser bébé longtemps dans un transat ou un siège-auto juste après le repas : la position semi-assise comprime le ventre.
- Commencer un médicament sans avis : d'après l'Assurance Maladie, certains médicaments contre l'acidité n'ont aucun effet sur les régurgitations.
- Changer de lait de vous-même. Si un lait épaissi est envisagé, parlez-en au pharmacien ou au médecin.

## Questions fréquentes
**Mon bébé régurgite beaucoup : mange-t-il assez ?**
Le meilleur repère est sa courbe de poids et son comportement : s'il prend du poids, mouille ses couches et semble bien, c'est rassurant. En cas de doute, le médecin vérifiera sa croissance.

**Faut-il le recoucher sur le côté pour qu'il ne s'étouffe pas ?**
Non : bébé doit dormir sur le dos. Ses réflexes le protègent quand il régurgite dans cette position.

**Faut-il redonner à manger après une régurgitation ?**
Pas forcément : s'il réclame, proposez-lui le sein ou le biberon calmement, sinon attendez le repas suivant.

**Quand cela s'arrête-t-il ?**
Les régurgitations diminuent en général avec la position assise, la marche et la diversification. Si elles durent après 1 an, parlez-en à votre médecin.

## Quand demander conseil
**Consultez votre médecin si :**
- les régurgitations apparaissent après 6 mois ou durent après 1 an ;
- elles sont douloureuses, avec pleurs, ou contiennent des traces de sang ;
- elles sont abondantes, surtout avant 2 mois ;
- bébé refuse de manger, ne prend plus de poids, dort mal ou se tortille pendant les repas.

**Appelez le 15 sans attendre si :**
- pendant une régurgitation, bébé devient bleu ou très pâle, perd son tonus ou a du mal à respirer ;
- un bébé de moins de 6 semaines vomit en jet après chaque repas ;
- il vomit un liquide vert ;
- il semble très somnolent, a de la fièvre avant 3 mois, ou a les yeux creusés et des couches sèches.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['reflux', 'RGO', 'régurgitations', 'biberon', 'allaitement'],
    min_age_months: 0, max_age_months: 18,
    safety_critical: true,
    sources: [S.ameliRegurgitations, S.ameliRgoTraitement],
    status: 'to_review',
  },
  {
    slug: 'constipation-bebe-et-enfant',
    title: 'Constipation du bébé et de l’enfant',
    summary: 'La constipation est fréquente chez l’enfant : comprendre le cercle « selle dure, douleur, retenue », les gestes utiles selon l’âge (eau, fibres, mouvement, toilettes sans pression), ce qu’il ne faut jamais faire et quand consulter ou appeler le 15.',
    body_md: `La constipation est fréquente chez l'enfant, notamment à certaines étapes : changement de lait, début de la diversification, apprentissage de la propreté, entrée à l'école. Elle se traduit par des selles plus rares, dures, parfois douloureuses à émettre. La plupart du temps, des mesures simples suffisent à faire revenir un transit confortable.

## En bref
- La constipation est fréquente, en particulier lors de la diversification et de l'apprentissage de la propreté.
- Au biberon : respecter exactement le dosage de la poudre ; proposer de l'eau, surtout en cas de chaleur ou de fièvre.
- Plus grand : de l'eau, des fruits et légumes, des céréales complètes, bouger chaque jour.
- Aux toilettes : pas de pression, du temps, et les pieds bien posés.
- Jamais de thermomètre pour « déclencher » les selles, ni de laxatif sans avis médical.

## Comprendre
Le rythme des selles varie beaucoup d'un enfant à l'autre, et chez le bébé selon qu'il est allaité ou nourri au lait infantile. Ce qui compte surtout, c'est l'aspect des selles et le confort de l'enfant : des selles dures, en petites billes, qui font mal ou font pleurer, évoquent une constipation.

Un **cercle** s'installe parfois : une selle dure fait mal, l'enfant a peur et se retient, les selles suivantes deviennent encore plus dures et plus douloureuses. C'est pourquoi il est important d'agir tôt, sans dramatiser, et de ne jamais forcer l'apprentissage de la propreté.

Une alimentation pauvre en fibres, un manque d'eau, peu d'activité physique, un lait trop concentré ou une période de stress peuvent favoriser la constipation.

## Au quotidien
**Selon l'âge**
- **Bébé au biberon** : respectez exactement le dosage de la poudre — un lait trop concentré favorise la constipation. Proposez de l'eau, surtout en cas de chaleur ou de fièvre.
- **Massage** : massez doucement le ventre dans le sens des aiguilles d'une montre et faites « pédaler » les jambes plusieurs fois par jour.
- **Diversification** : les fruits et légumes peuvent aider ; demandez conseil au médecin ou au pédiatre.
- **Après 1 an** : au moins trois portions de fruits ou légumes par jour, des céréales complètes, et bouger chaque jour.
- **Après 3 ans** : de l'eau, des fibres (pain complet, légumineuses, pruneaux), des repas à heures régulières.

**Aux toilettes**
- Ne forcez pas l'apprentissage de la propreté.
- Proposez les toilettes après les repas, quelques minutes, et laissez le temps.
- Un petit banc sous les pieds aide si ses pieds ne touchent pas le sol : la position accroupie facilite l'évacuation.
- Encouragez-le à ne pas se retenir, y compris à l'école : parlez-en avec l'enseignant si besoin.

**À ne jamais faire**
- Utiliser un thermomètre pour « déclencher » les selles.
- Donner un laxatif ou un lavement sans avis médical.
- Supprimer les produits laitiers sans en parler au médecin.

## Questions fréquentes
**Mon bébé allaité ne fait pas de selles tous les jours, est-il constipé ?**
Pas forcément : le rythme peut être très variable. Si les selles restent molles et que bébé va bien et prend du poids, c'est rassurant. En cas de doute, parlez-en à votre médecin.

**Il pousse et devient tout rouge en faisant ses selles.**
Chez le tout-petit, c'est souvent un apprentissage de la coordination. Si les selles restent molles, ce n'est pas une constipation ; si elles sont dures ou qu'il a mal, demandez conseil.

**Les jus de fruits aident-ils ?**
Mieux vaut privilégier l'eau et les fruits entiers, qui apportent des fibres. Demandez conseil au médecin avant de modifier l'alimentation d'un bébé.

**Il se retient depuis qu'il a eu mal.**
Rassurez-le, ne le grondez pas, et parlez-en à votre médecin : des selles plus molles aident souvent à casser le cercle de la peur.

## Quand demander conseil
**Dans les jours qui viennent**, consultez si la constipation dure malgré ces mesures, s'il a mal ou saigne un peu en allant à la selle, s'il a des fuites de selles dans la culotte, ou si sa prise de poids est insuffisante.

**Dans la journée**, consultez en cas de sang dans les selles, de fièvre, de vomissements, de perte d'appétit ou de poids.

**Appelez le 15 ou le 112** en cas de douleurs de ventre intenses, de vomissements qui ne s'arrêtent pas, ou de ventre gonflé, tendu et douloureux.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn', 'child'],
    category: 'enfant',
    tags: ['constipation', 'selles', 'propreté', 'fibres'],
    min_age_months: 0, max_age_months: 120,
    safety_critical: true,
    sources: [S.ameliConstipationEnfant],
    status: 'to_review',
  },
  {
    slug: 'peau-de-bebe-et-fesses-rouges',
    title: 'Peau de bébé : toilette et fesses rouges',
    summary: 'La peau des nourrissons est fine et fragile : la toilette au quotidien, les bons gestes au change pour prévenir et soigner les fesses rouges, ce qu’il vaut mieux éviter et les signes qui demandent un avis médical.',
    body_md: `La peau des nourrissons est plus fine et plus fragile que celle des adultes : elle se protège moins bien contre l'humidité, les frottements et les produits irritants. Les fesses rouges (érythème fessier) sont très fréquentes chez les bébés qui portent des couches. Avec de bons gestes, elles disparaissent souvent en quelques jours.

## En bref
- Des changes fréquents : au moins six fois par jour et après chaque selle, sans serrer la couche.
- De l'eau et un nettoyant sans savon, un rinçage, puis un séchage en tamponnant, sans frotter, en insistant sur les plis.
- Laisser la peau à l'air quand c'est possible.
- Éviter lingettes, parfums, alcool et talc sur une peau irritée.
- Fesses rouges dans les six premières semaines, fièvre, cloques, pus ou rougeur qui s'étend : avis médical.

## Comprendre
Sous la couche, la peau est en contact prolongé avec l'urine et les selles, dans un milieu chaud et humide. Elle se fragilise, et les frottements de la couche font le reste : la peau rougit, peut devenir sensible et brillante, parfois un peu suintante.

Certaines périodes favorisent les fesses rouges : diarrhée, poussée dentaire, début de la diversification, prise d'antibiotiques, ou couches changées moins souvent, par exemple la nuit. Parfois, une infection par un champignon ou une bactérie s'installe sur la peau irritée : c'est l'une des raisons pour lesquelles certains signes demandent un avis médical.

## Au quotidien
**La toilette**
- Un bain n'est pas forcément quotidien ; une toilette soigneuse du visage, des plis et du siège suffit les autres jours.
- Utilisez de l'eau tiède et un nettoyant doux sans savon, rincez, puis séchez en tamponnant, en insistant sur les plis du cou, des aisselles, de l'aine et derrière les oreilles.
- Évitez les produits parfumés et multipliez le moins possible les produits.

**Au change**
- Lavez-vous les mains avant et après chaque change.
- Changez souvent : au moins six fois par jour et après chaque selle, sans serrer la couche.
- Nettoyez avec de l'eau et un nettoyant sans savon, rincez, puis séchez en tamponnant, sans frotter.
- Pour une petite fille : toujours de l'avant vers l'arrière.
- Laissez la peau à l'air quelques minutes quand c'est possible, sur une serviette.
- Une crème réparatrice (au zinc ou au cuivre) peut être appliquée en couche fine ; demandez conseil au pharmacien.

**À éviter**
- Les lingettes, produits parfumés ou à l'alcool sur une peau irritée.
- Le talc : il retient l'humidité et peut être inhalé par bébé.
- Les vêtements trop serrés ou rêches qui frottent.
- Appliquer une pommade médicamenteuse sans avis.

## Questions fréquentes
**Les lingettes sont-elles interdites ?**
Sur une peau saine, elles peuvent dépanner à l'extérieur. Sur une peau irritée, mieux vaut l'eau et un nettoyant doux, puis un bon séchage.

**Faut-il changer de marque de couches ?**
Parfois, une couche qui frotte ou qui absorbe moins bien entretient l'irritation. Si les fesses rouges reviennent souvent, vous pouvez essayer une autre taille ou une autre marque, et en parler au pharmacien.

**La nuit, faut-il réveiller bébé pour le changer ?**
Ce n'est pas nécessaire en général. Une couche bien ajustée et une couche fine de crème protectrice le soir peuvent aider ; changez-le s'il a fait une selle.

**Combien de temps pour que ça guérisse ?**
Avec de bons soins, une amélioration est souvent visible en quelques jours. Sans amélioration après trois jours, demandez un avis.

## Quand demander conseil
Demandez un avis à votre médecin ou à votre pharmacien si :
- les fesses rouges apparaissent dans les six premières semaines de vie ;
- bébé a de la fièvre, perd du poids ou mange moins ;
- la rougeur persiste ou s'étend après trois jours de soins ;
- vous voyez des croûtes, des cloques, des boutons de pus ou un suintement ;
- des plaques blanches apparaissent dans la bouche.

Avant 3 mois, une fièvre demande de consulter rapidement ; si bébé semble très mal, somnolent ou respire difficilement, appelez le 15 ou le 112.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['peau', 'érythème fessier', 'toilette', 'change', 'soins'],
    min_age_months: 0, max_age_months: 36,
    sources: [S.ameliFessesRouges, S.ameliToiletteBebe],
    status: 'to_review',
  },
  {
    slug: 'accouchement-voie-basse-deroulement',
    title: 'L’accouchement par voie basse, étape par étape',
    summary: 'Début du travail, dilatation, naissance et délivrance : ce qui se passe le plus souvent, les moyens de soulager la douleur et pourquoi une césarienne peut être décidée.',
    body_md: `## En bref
- L’accouchement a lieu le plus souvent entre la 37e et la 42e semaine ; il peut commencer à tout moment dans cette période.
- On part à la maternité quand les contractions deviennent régulières et rapprochées, ou dès que la poche des eaux se rompt, même sans fortes contractions.
- Trois étapes se succèdent : la dilatation du col, la naissance (expulsion), puis la délivrance (sortie du placenta).
- Pour la douleur, la péridurale est possible, ainsi que des moyens sans médicament : bouger, bain ou douche, massages.
- L’équipe peut proposer des gestes (rupture de la poche, ventouse, forceps…) ou décider une césarienne : vous pouvez toujours demander pourquoi.

## Comprendre
**Le début du travail.** Les contractions deviennent de plus en plus intenses, régulières et rapprochées. Parfois, c’est la poche des eaux qui se rompt en premier : dans ce cas, rendez-vous à la maternité même si les contractions ne sont pas encore fortes. Votre sage-femme ou votre maternité vous dit, selon votre situation, à quel moment partir. Si vous habitez à plus de 45 minutes d’une maternité, l’Assurance Maladie prévoit un dispositif (« Engagement maternité ») qui peut prendre en charge un hébergement proche et les transports.

**1. La dilatation du col.** C’est la phase la plus longue : environ 8 heures en moyenne pour un premier enfant, environ 4 heures pour une femme qui a déjà accouché. Le col s’ouvre progressivement jusqu’à 10 cm. Le cœur du bébé est surveillé par un monitoring pendant les contractions. Pendant le travail, seuls les liquides clairs sont en général autorisés (eau, thé ou café sans lait, jus sans pulpe).

**2. L’expulsion.** Une fois le col complètement ouvert et la tête du bébé bien descendue, l’équipe vous accompagne pour pousser. Cette phase dure en moyenne une trentaine de minutes. À la naissance, le cordon est coupé, la sage-femme vérifie que le bébé va bien et le pose contre vous, en peau à peau quand c’est possible.

**3. La délivrance.** De nouvelles contractions font sortir le placenta, habituellement 20 à 30 minutes après la naissance. S’il ne sort pas, l’équipe le retire. Un médicament (l’ocytocine) est donné juste avant ou après la naissance pour prévenir une hémorragie.

## Au quotidien
**Soulager la douleur.** La péridurale est posée par un anesthésiste pendant le travail : elle soulage la douleur des contractions sans faire perdre conscience, et une pompe permet souvent d’ajuster l’analgésie sous contrôle médical. La consultation avec l’anesthésiste, au 8e mois, est prévue même si vous souhaitez accoucher sans péridurale. Les méthodes sans médicament aident aussi : changer de position, marcher, prendre un bain ou une douche, recevoir des massages. Vous pouvez combiner ces approches et changer d’avis en cours de route.

**Les gestes possibles.** Selon le déroulement, l’équipe peut rompre la poche des eaux si le travail est avancé, donner de l’ocytocine pour renforcer les contractions, ou aider la sortie du bébé avec une ventouse, des forceps ou des spatules si le bébé supporte mal l’expulsion ou si vous n’avez plus la force de pousser. L’épisiotomie (incision du périnée) n’est pas systématique : elle est devenue beaucoup moins fréquente ces dernières années.

**Préparer vos souhaits.** Vous pouvez noter vos préférences (positions, gestion de la douleur, peau à peau) et en parler à l’équipe à l’avance : elles servent de base au dialogue.

## Questions fréquentes
**Pourquoi une césarienne peut-elle être décidée ?** Elle peut être programmée, par exemple selon la position du bébé ou dans certaines grossesses à risque, ou décidée pendant le travail si l’accouchement par voie basse devient difficile ou si le monitoring montre des signes de souffrance du bébé. Le peau à peau reste souvent possible, au bloc ou en salle de réveil.

**Et si mon bébé se présente par le siège ?** S’il est repéré au 8e mois, l’obstétricien peut proposer une manœuvre pour tenter de le retourner. La suite est discutée avec vous.

**Combien de temps reste-t-on en salle de naissance ?** Après un accouchement par voie basse, la surveillance dure au moins deux heures : tension, pouls, saignements et contraction de l’utérus sont contrôlés.

## Quand demander conseil
Appelez votre maternité si vous avez un doute sur le début du travail, et partez sans attendre si la poche des eaux se rompt. Des saignements rouges, une diminution des mouvements du bébé, de la fièvre ou une douleur inhabituelle justifient un appel immédiat à la maternité. **En urgence, appelez le 15 (ou le 112).** Après la naissance, si vous vous sentez très triste ou en détresse, parlez-en à l’équipe ; le 3114 répond jour et nuit.

Cet article informe et ne remplace pas les explications de votre sage-femme, de votre médecin ou de l’équipe de la maternité.`,
    journeys: ['pregnant'],
    category: 'accouchement',
    tags: ['accouchement', 'voie basse', 'travail', 'péridurale', 'césarienne'],
    min_week: 28, max_week: 42,
    sources: [S.ameliAccouchement, S.hasAccouchementNormal],
    status: 'to_review',
  },
  {
    slug: 'arrivee-d-un-nouvel-enfant-et-l-aine',
    title: 'Un nouveau bébé arrive : l’aîné et l’organisation de la famille',
    summary: 'L’aîné peut se sentir jaloux ou régresser un temps ; le rassurer, lui garder des moments à lui et réorganiser la maison ensemble aident toute la famille.',
    body_md: `## En bref
- Après l’arrivée d’un bébé, l’aîné peut se sentir inquiet, jaloux ou mis de côté, et parfois « régresser » un temps : mieux vaut l’accueillir sans s’alarmer ni le gronder.
- Le préparer avant la naissance : qui s’occupera de lui pendant le séjour à la maternité, comment se passera le retour.
- Lui montrer qu’il garde sa place : moments rien qu’à lui, histoire de sa propre naissance, attention des proches.
- Toute la famille se réorganise : fixer des priorités, se répartir les tâches, garder un peu de temps pour soi.
- Grands-parents et entourage trouvent aussi leur nouvelle place : écouter les conseils, tout en faisant confiance à vos choix.

## Comprendre
Un nouveau bébé ne change pas seulement la vie des parents. Pour l’aîné, c’est un grand bouleversement : le rythme de la maison change, les parents sont fatigués et moins disponibles, et un petit être occupe soudain beaucoup de place. Il peut ressentir de l’inquiétude, de la jalousie ou l’impression d’être rejeté. Certains enfants recommencent à faire « comme un bébé » : demander le biberon, parler comme un tout-petit, avoir de nouveau des accidents de propreté. Santé.fr (1000 premiers jours) rappelle qu’il ne faut ni s’inquiéter ni le gronder : ces réactions expriment souvent un besoin d’être rassuré.

Les parents aussi traversent une période d’ajustement. Leurs propres besoins passent souvent au second plan, et il faut parfois renoncer un temps à certaines activités. Un nouvel équilibre se construit progressivement, à votre rythme. Les grands-parents, oncles et tantes vivent eux aussi un changement de rôle, source de joie mais parfois de tensions.

## Au quotidien
**Avant la naissance**
- Expliquez à l’aîné, avec des mots adaptés à son âge, qui s’occupera de lui pendant votre séjour à la maternité et comment s’organisera le retour à la maison.
- Racontez-lui sa propre naissance, montrez-lui ses photos de bébé : cela l’aide à comprendre qu’il a lui aussi été accueilli ainsi.
- Certaines familles préparent un petit « sac de grand frère ou de grande sœur » avec de petits cadeaux et des mots doux, ou emportent une photo de famille à la maternité pour que l’aîné se sente présent.

**La rencontre et les premières semaines**
- Prévoyez un moment privilégié pour la première rencontre. Selon son âge et son envie, montrez-lui comment faire un câlin au bébé ou le tenir dans ses bras, toujours avec un adulte à côté.
- Laissez-le aider s’il le souhaite (apporter une couche, chanter une chanson), sans l’y obliger.
- Gardez des moments rien qu’avec lui, même courts : une histoire le soir, une sortie au parc avec l’un des parents.
- Demandez aux proches qui viennent voir le bébé de s’intéresser aussi à lui.
- Faites confiance à votre ressenti : vous connaissez votre enfant mieux que quiconque.

**L’organisation de la famille**
- Acceptez de mettre certaines choses en pause et de fixer des priorités.
- Parlez-en à deux régulièrement : qui fait quoi, qui se repose quand, comment chacun peut avoir un moment pour soi.
- Une fois la période d’adaptation passée, les sorties en famille, même courtes, font du bien à tous et évitent l’isolement.
- Dans Au fil de nous, les tâches du foyer, l’agenda partagé et les relais de nuit peuvent aider à répartir la charge.

## Questions fréquentes
**Mon aîné de 3 ans refait pipi dans sa culotte depuis la naissance : que faire ?** Ce type de retour en arrière peut arriver après l’arrivée d’un bébé. Accueillez-le calmement, sans punition, en lui offrant de l’attention à d’autres moments. Si cela dure ou vous inquiète, parlez-en à son médecin.

**Il dit qu’il n’aime pas le bébé : faut-il le reprendre ?** Ses émotions peuvent être accueillies : vous pouvez mettre des mots dessus (« tu trouves que le bébé prend beaucoup de place »), tout en posant des limites claires sur les gestes, pour la sécurité du bébé.

**Les grands-parents donnent beaucoup de conseils : comment réagir ?** Communiquez, exprimez vos besoins et écoutez les leurs. Prendre du recul face aux nombreux conseils et vous faire confiance aide à trouver votre façon de faire.

## Quand demander conseil
Si vous vous sentez dépassé(e), épuisé(e) ou très triste, parlez-en à votre médecin, à votre sage-femme ou à la PMI. Si l’aîné montre une détresse qui dure ou vous inquiète, son médecin ou son pédiatre peut vous aider. En cas d’idées noires, appelez le **3114** (24 h/24) ; si un enfant est en danger, le **119** ; en urgence, le **15** ou le **112**.

Cet article informe et ne remplace pas l’avis d’un professionnel de santé ou de la petite enfance.`,
    journeys: ['pregnant', 'newborn', 'child'],
    category: 'enfant',
    tags: ['aîné', 'fratrie', 'jalousie', 'organisation familiale', 'naissance'],
    sources: [S.santeVieFamille],
    status: 'to_review',
  },
  {
    slug: 'regles-douloureuses-quand-consulter',
    title: 'Règles douloureuses : ce qui peut soulager et quand consulter',
    summary: 'Les douleurs pendant les règles sont fréquentes ; chaleur, repos et mouvement doux aident souvent, et des douleurs qui changent ou empêchent de vivre normalement méritent un avis.',
    body_md: `## En bref
- Les douleurs de règles (dysménorrhées) sont fréquentes : une femme sur deux se plaint de douleurs au ventre ou dans le bas du dos pendant ses règles.
- Chaleur, repos, sommeil et mouvement doux soulagent souvent ; limiter alcool, café et tabac autour des règles peut aussi aider.
- Pour un médicament, demandez conseil à votre pharmacien ou à votre médecin : l’aspirine est déconseillée.
- Des douleurs inhabituelles, qui s’aggravent, résistent aux antalgiques simples ou vous empêchent de vivre normalement méritent une consultation : elles peuvent révéler une endométriose ou une autre cause.
- Douleur brutale et intense, fièvre ou malaise : appelez le **15**.

## Comprendre
La douleur prend le plus souvent la forme de crampes qui commencent avec les règles, parfois un peu avant, et peuvent s’étendre vers les reins et les cuisses. Elle s’accompagne parfois de maux de tête, de nausées ou de vomissements. Selon Santé.fr, 50 à 70 % des jeunes femmes sont concernées, et pour environ 15 % d’entre elles la douleur est invalidante, au point de manquer l’école ou le travail.

Les médecins distinguent deux situations :
- **La dysménorrhée primaire** apparaît à l’adolescence, dans les mois qui suivent les premières règles. Elle est le plus souvent liée aux contractions de l’utérus pendant les règles, plus rarement à une particularité anatomique ou hormonale.
- **La dysménorrhée secondaire** survient à l’âge adulte. Elle peut être liée à une endométriose, une infection génitale chronique, des troubles ovariens ou des polypes de l’utérus, ce qui justifie un examen médical.

Les douleurs elles-mêmes n’entraînent pas de complications, mais elles peuvent être le signe d’une maladie à prendre en charge. L’endométriose en fait partie : des règles douloureuses peuvent l’évoquer quand la douleur revient à chaque cycle, résiste à un antalgique simple et empêche les activités habituelles (se lever, travailler, aller en cours). D’autres signes peuvent l’accompagner : règles très abondantes ou longues, douleurs pendant les rapports sexuels, troubles digestifs ou urinaires pendant les règles.

## Au quotidien
- **La chaleur** : une bouillotte sur le ventre ou un bain chaud, allongée et détendue.
- **Le repos** : bien dormir avant et pendant les règles.
- **Bouger** : un peu de mouvement ou un sport doux soulage souvent.
- **Les habitudes** : limiter ou éviter l’alcool, le café et le tabac avant et pendant les règles.
- **Les médicaments** : un antalgique sans ordonnance peut être pris si besoin, sur conseil du pharmacien. L’aspirine est déconseillée, car elle fluidifie le sang et peut augmenter les saignements. D’autres traitements existent ; votre médecin choisit avec vous ce qui convient selon votre santé, vos autres traitements et un éventuel projet de grossesse.
- **Noter vos symptômes** : le suivi du cycle dans Au fil de nous permet de noter l’intensité de la douleur, les jours concernés et ce qui vous a soulagée. Ces notes facilitent l’échange avec le professionnel.

## Questions fréquentes
**Avoir très mal pendant ses règles, faut-il simplement le supporter ?** Non. Une douleur qui vous empêche de vivre normalement mérite d’être soulagée et d’en chercher la cause. Vous pouvez en parler à votre médecin traitant, à une sage-femme ou à un gynécologue.

**Mes règles sont devenues douloureuses alors qu’elles ne l’étaient pas : est-ce un signal ?** Des douleurs qui apparaissent après plusieurs années de règles peu douloureuses, ou qui changent, font partie des raisons de consulter.

**Comment le médecin cherche-t-il la cause ?** Il vous interroge et vous examine. Il vérifie notamment que les saignements sont bien des règles et non le signe d’une autre affection, comme une grossesse extra-utérine. Il peut proposer des examens, comme une échographie ou une IRM.

**L’endométriose empêche-t-elle d’avoir un enfant ?** Elle peut être associée à des difficultés de fertilité, d’où l’intérêt d’en parler tôt, surtout si vous avez un projet de grossesse. Un professionnel pourra vous orienter.

## Quand demander conseil
Consultez si vos douleurs sont inhabituelles pour vous, si vos règles deviennent difficiles à supporter, si la douleur apparaît après des années de règles peu douloureuses, si elle résiste aux mesures habituelles ou s’accompagne de saignements anormaux, de douleurs pendant les rapports, de troubles digestifs ou urinaires. **En cas de douleur brutale et intense, de fièvre, de malaise ou de saignements très abondants, appelez le 15 (ou le 112).** Si la douleur pèse sur votre moral au point d’avoir des idées noires, le 3114 répond jour et nuit.

Cet article informe et ne remplace pas l’avis de votre médecin, de votre sage-femme ou de votre gynécologue.`,
    journeys: ['avoid', 'ttc'],
    category: 'cycle',
    tags: ['règles douloureuses', 'dysménorrhée', 'endométriose', 'cycle', 'symptômes'],
    safety_critical: true,
    sources: [S.santeReglesDouloureuses, S.santeEndometrioseRegles],
    status: 'to_review',
  },
];
