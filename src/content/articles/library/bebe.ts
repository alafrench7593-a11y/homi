/** Articles « Bébé né » de la bibliothèque. */
import { S } from './sources';
import type { LibArticle } from './types';

export const bebe: LibArticle[] = [
  // ───────────────────────────── Bébé né ─────────────────────────────
  {
    slug: 'sommeil-sur-du-bebe-couchage',
    title: 'Coucher bébé en sécurité',
    summary: 'Sur le dos, dans son propre lit, sans couette ni oreiller : les gestes simples qui réduisent le risque de mort inattendue du nourrisson, expliqués pas à pas.',
    body_md: `Les recommandations de couchage visent à réduire le risque de mort inattendue du nourrisson. Le coucher sur le dos a fait fortement baisser ce risque en France. Ces gestes valent pour la nuit comme pour chaque sieste, à la maison comme ailleurs.

## En bref
- **Sur le dos**, à plat, pour la nuit et toutes les siestes.
- Dans **son propre lit**, avec un matelas ferme et une **turbulette** : ni couette, ni oreiller, ni tour de lit, ni peluche.
- Dans la chambre des parents, idéalement jusqu'à environ 6 mois ; le partage du lit parental est déconseillé.
- Chambre entre **18 et 20 °C**, aérée, **sans fumée de tabac**.
- **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil.**

## Comprendre
La mort inattendue du nourrisson survient le plus souvent pendant le sommeil, sans cause identifiée à l'avance. On ne peut pas tout prévenir, mais les études ont montré que l'environnement de sommeil compte beaucoup : la position sur le dos, un lit dégagé et une température modérée réduisent nettement le risque. C'est pourquoi les consignes sont précises et répétées par les soignants.

## Au quotidien
### La position
- **Sur le dos**, à plat, pour la nuit et pour toutes les siestes.
- Ni sur le ventre, ni sur le côté.
- Pas de cale-bébé, coussin ou serviette roulée pour le maintenir.
- Quand bébé sait se retourner seul, inutile de le forcer à rester sur le dos.

### Le lit
- Un lit adapté, avec un matelas ferme, aux bonnes dimensions, sans espace sur les côtés.
- Pas de couette, couverture, oreiller, tour de lit ni grosse peluche : une **turbulette** (gigoteuse) adaptée à sa taille.
- Rien qui puisse couvrir le visage ou entourer le cou (pas de collier ni de cordelette de tétine).
- Ne pas ajouter de matelas dans un lit parapluie.

### La chambre
- Entre **18 et 20 °C**, aérée chaque jour.
- Pas trop de couches de vêtements : la nuque ne doit pas être moite.
- **Aucune fumée** de tabac autour du bébé.
- Pas d'huiles essentielles, pas d'animal dans la chambre.

### Où dort bébé ?
- Dans **son propre lit**, dans la chambre des parents, idéalement jusqu'à environ 6 mois.
- Le partage du lit parental est déconseillé.
- **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil.**
- Si vous êtes très fatigué(e) ou sous un médicament qui rend somnolent, recouchez bébé dans son lit avant de vous endormir.

### En dehors de la maison
Les mêmes règles s'appliquent chez les grands-parents, chez l'assistante maternelle ou en vacances : un couchage sur le dos, dans un lit adapté et dégagé. Transmettez-les à toute personne qui garde votre bébé.

## Questions fréquentes
**Et s'il régurgite, ne risque-t-il pas de s'étouffer sur le dos ?**
La position sur le dos reste recommandée. Si les régurgitations vous inquiètent, parlez-en à votre médecin plutôt que de changer la position.

**Il se retourne tout seul sur le ventre, faut-il le remettre sur le dos ?**
Couchez-le toujours sur le dos. Quand il sait se retourner seul, inutile de le forcer à y rester.

**Peut-il dormir dans le transat ou le siège auto ?**
Ces équipements ne sont pas faits pour dormir longtemps ; pour le sommeil, préférez son lit, sur le dos.

**Peut-on mettre un petit tour de lit pour qu'il ne se cogne pas ?**
Non : rien dans le lit qui puisse couvrir son visage ou gêner sa respiration.

## Quand demander conseil
- Si vous êtes épuisé(e) : ne donnez jamais de médicament pour dormir à un bébé et ne le secouez jamais. Parlez de votre fatigue à votre médecin, à votre sage-femme ou à la PMI.
- Si vous avez des questions sur le couchage de votre bébé (prématurité, régurgitations, matériel) : votre médecin, votre sage-femme ou la PMI.
- Si bébé ne respire pas, ne réagit pas, est bleu ou très pâle : appelez immédiatement le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['sommeil sûr', 'couchage', 'mort inattendue du nourrisson', 'turbulette'],
    min_age_months: 0, max_age_months: 24,
    safety_critical: true,
    sources: [S.ameliCoucher, S.mpediaCoucher],
    status: 'to_review',
  },
  {
    slug: 'pleurs-du-nourrisson-et-bebe-secoue',
    title: 'Les pleurs du nourrisson, et quand on est à bout',
    summary: 'Les pleurs sont le langage du bébé et peuvent être intenses les premières semaines : comprendre, apaiser, et que faire si vous êtes à bout — sans jamais secouer.',
    body_md: `Tous les bébés pleurent, parfois beaucoup. Ce n'est pas le signe que vous faites mal : c'est leur principal moyen de communiquer. Les pleurs peuvent pourtant épuiser et faire douter. Voici des repères pour comprendre, apaiser, et vous protéger quand vous êtes à bout.

## En bref
- En moyenne, un bébé pleure environ deux heures par jour au total.
- Les « pleurs du soir » sont souvent plus intenses vers 6 à 8 semaines, puis s'atténuent vers la fin du troisième mois.
- Vérifier les besoins, porter, bercer, réduire la stimulation peut apaiser — mais pas toujours.
- Si vous êtes à bout : posez bébé sur le dos dans son lit et faites une pause.
- **Ne secouez jamais un bébé.** Urgence : **15** ou **112**.

## Comprendre
Un bébé ne peut pas dire ce qui ne va pas : il pleure pour signaler la faim, la fatigue, un inconfort, ou simplement un besoin de contact. Certains pleurs n'ont pas de cause identifiable et passent avec le temps. En fin de journée, beaucoup de bébés pleurent davantage : on parle de « pleurs du soir ». Ils apparaissent souvent après les premières semaines, sont plus intenses vers 6 à 8 semaines, puis s'atténuent vers la fin du troisième mois.

Le secouement, même bref, peut provoquer des lésions graves du cerveau, voire la mort : c'est pourquoi il est essentiel de savoir faire une pause avant d'être submergé.

## Au quotidien
### Ce qui peut apaiser
- Vérifier les besoins : faim, couche, chaleur ou froid, vêtements trop serrés.
- Le prendre dans les bras, le bercer, lui parler doucement, le porter, le mettre au sein.
- Réduire la lumière et le bruit, faire une promenade.
- S'il pleure en dormant, attendre un peu : il s'agit parfois d'un sommeil agité.

### Si vous êtes à bout
C'est humain, et cela arrive à beaucoup de parents.
1. **Posez bébé sur le dos dans son lit**, en sécurité.
2. Quittez la pièce et fermez la porte quelques minutes.
3. Respirez, buvez un verre d'eau, appelez un proche.
4. Demandez à quelqu'un de prendre le relais.

**Ne secouez jamais un bébé**, même quelques secondes : cela peut provoquer des lésions graves, voire mortelles.

Si vous sentez que vous pourriez perdre le contrôle, appelez le **119** (24 h/24) ou Allô Parents Bébé au **0 800 00 34 56** (en semaine).

### Préparer les moments difficiles
- Prévoyez à l'avance qui appeler en cas de soirée difficile.
- Relayez-vous si vous êtes deux ; prévenez toute personne qui garde votre bébé qu'il ne faut jamais le secouer.

## Questions fréquentes
**Est-ce que je le rends « capricieux » en le prenant dans les bras ?**
Non : répondre à ses pleurs l'aide à se sentir en sécurité.

**Pourquoi pleure-t-il toujours le soir ?**
Les pleurs du soir sont fréquents pendant les premiers mois et s'atténuent souvent vers la fin du troisième mois.

**J'ai tout essayé et il pleure encore, est-ce que je fais mal ?**
Non. Certains pleurs ne se calment pas tout de suite, quoi qu'on fasse. Votre présence compte, même quand les pleurs continuent.

**Peut-on secouer « juste un peu » pour le calmer ?**
Jamais. Même quelques secondes peuvent provoquer des lésions graves.

## Quand demander conseil
- Pleurs inhabituels, très prolongés, ou bébé geignard, mou, qui semble souffrir : consultez.
- Bébé qui refuse de boire, vomit, a de la fièvre : consultez ; avant 3 mois, toute fièvre impose une consultation en urgence.
- Si vous êtes épuisé(e) ou débordé(e) : votre médecin, votre sage-femme ou la PMI peuvent vous aider.
- **Urgence** : si un bébé a été secoué ou présente une somnolence inhabituelle, des convulsions, des difficultés à respirer, appelez le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['pleurs', 'bébé secoué', 'épuisement', 'apaiser'],
    min_age_months: 0, max_age_months: 12,
    safety_critical: true,
    sources: [S.ameliSecoue, S.santePleurs, S.mpediaPleurs],
    status: 'to_review',
  },
  {
    slug: 'allaitement-debuter',
    title: 'Allaitement : bien démarrer',
    summary: 'Peau à peau, tétées à la demande, repérage des signes d’éveil : les clés des premiers jours, et quand demander à un professionnel d’observer une tétée.',
    body_md: `Démarrer un allaitement prend du temps et s'apprend, pour le bébé comme pour vous. Les débuts peuvent être hésitants : c'est fréquent, et de l'aide existe à chaque étape.

## En bref
- Le **peau à peau** après la naissance aide beaucoup de bébés à trouver le sein.
- Les tétées se font **à la demande**, en moyenne 8 à 12 par 24 heures au démarrage.
- Repérer les **signes d'éveil** permet de proposer le sein avant les pleurs.
- Le repère le plus significatif d'un allaitement efficace est une **bonne prise de poids**, suivie par un professionnel.
- Douleur, tétées très courtes ou très longues, inquiétude : demandez à quelqu'un d'observer une tétée.

## Comprendre
Le lait se met en place progressivement : plus bébé tète efficacement, plus la production s'ajuste à ses besoins. C'est pourquoi les tétées fréquentes, y compris la nuit, sont utiles au début. Le nouveau-né, lui, apprend à coordonner succion, déglutition et respiration. Ce rodage peut prendre quelques jours à quelques semaines.

## Au quotidien
### Juste après la naissance
- Les deux premières heures sont un moment où les réflexes du bébé sont très présents.
- En **peau à peau**, beaucoup de bébés trouvent le sein d'eux-mêmes, parfois après un long moment.
- Un environnement calme aide.

### Les premières semaines
- Les tétées se font **à la demande**, en moyenne 8 à 12 par 24 heures au démarrage.
- Les nouveau-nés dorment beaucoup : repérez les **signes d'éveil** (paupières qui bougent, mains vers la bouche, mouvements de langue, petite agitation) pour proposer le sein avant les pleurs.
- Proposez les deux seins à chaque tétée.
- La durée varie beaucoup ; ce qui compte, c'est que bébé avale régulièrement.
- Les tétées de nuit aident souvent à entretenir la lactation.

### Les pleurs ne veulent pas toujours dire « faim »
Bébé peut aussi avoir besoin de réconfort, d'être porté ou de dormir.

### Le repère principal
Selon Santé.fr, le signe le plus significatif d'un allaitement efficace est une **bonne prise de poids** du bébé, suivie par un professionnel.

### Prendre soin de vous
- Installez-vous confortablement, dos soutenu, avec de l'eau à portée de main.
- Reposez-vous quand bébé dort et acceptez l'aide pour le reste.
- Notez les tétées dans l'application si cela vous aide à vous repérer, sans en faire une source de pression.

## Questions fréquentes
**Comment savoir s'il boit assez ?**
Le meilleur repère est sa prise de poids, suivie par un professionnel. Un bébé qui avale régulièrement pendant la tétée est aussi un bon signe.

**Est-ce que ça doit faire mal ?**
Un allaitement douloureux mérite d'être signalé : souvent, un ajustement de la position ou de la prise du sein aide.

**Il veut téter très souvent, ai-je assez de lait ?**
Les tétées fréquentes sont habituelles au démarrage et entretiennent la lactation. En cas de doute, faites peser bébé et demandez conseil.

**Puis-je arrêter si cela ne me convient pas ?**
C'est votre décision. Vous pouvez être accompagnée dans ce choix, quel qu'il soit.

## Quand demander conseil
- Tétées très courtes (moins de 5 minutes) ou très longues (plus de 30 à 45 minutes) de façon répétée.
- Allaitement douloureux, crevasses, sein rouge, chaud ou douloureux, fièvre.
- Inquiétude sur la prise de poids, bébé qui semble peu éveillé ou mouille peu ses couches.
- Votre sage-femme, la maternité, la PMI ou votre médecin peuvent observer une tétée et vous conseiller.
- Bébé très somnolent, mou, qui refuse de boire ou respire difficilement : appelez le **15** ou le **112**.

Et si vous choisissez de ne pas allaiter, ou d'arrêter, vous pouvez aussi être accompagnée dans ce choix. Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn'],
    category: 'alimentation',
    tags: ['allaitement', 'tétées', 'peau à peau', 'lactation'],
    min_age_months: 0, max_age_months: 6,
    sources: [S.santeRythmeTetees, S.santePremiereTetee],
    status: 'to_review',
  },
  {
    slug: 'biberons-preparation-hygiene',
    title: 'Biberons : préparation et hygiène',
    summary: 'Une mesurette rase pour 30 ml d’eau, un biberon préparé juste avant, jamais réchauffé au micro-ondes : la préparation et l’hygiène étape par étape.',
    body_md: `Bien préparer un biberon limite le risque d'infection et assure un lait correctement dosé. Les gestes sont simples, mais quelques détails comptent : l'eau, le dosage, la conservation et le nettoyage.

## En bref
- Mains lavées, biberon propre et sec.
- Eau du robinet froide ou eau en bouteille adaptée aux nourrissons.
- **Une mesurette rase de poudre pour 30 ml d'eau**, sans tasser.
- Biberon préparé juste avant la tétée ; jamais de biberon entamé gardé pour plus tard.
- Jamais de réchauffage au micro-ondes. Les quantités et le rythme se décident avec votre médecin ou la PMI.

## Comprendre
Le lait infantile en poudre n'est pas stérile, et un biberon préparé offre un bon milieu aux microbes s'il reste longtemps à température ambiante. C'est pourquoi on le prépare au dernier moment et on respecte des délais de consommation courts. Le dosage, lui, compte pour l'équilibre du lait : trop ou pas assez de poudre modifie sa composition. L'application ne recommande ni quantité ni rythme : ils dépendent de votre bébé et se discutent avec un professionnel, en suivant aussi la notice du lait.

## Au quotidien
### Avant de commencer
- Lavez-vous les mains au savon et séchez-les avec un linge propre.
- Utilisez un biberon propre et sec.

### L'eau
- **Eau du robinet froide** possible : laissez couler quelques secondes (1 à 2 minutes si le robinet n'a pas servi depuis plusieurs heures).
- Pas d'eau filtrée en carafe, adoucie ou gazeuse.
- Eau en bouteille : faiblement minéralisée, avec la mention « convient pour la préparation des aliments des nourrissons ». Une bouteille ouverte se garde au réfrigérateur et se consomme dans les 24 heures.
- Logement construit avant 1948 : vérifiez auprès de la mairie l'absence de risque lié au plomb.

### Le dosage
- **Une mesurette rase de poudre pour 30 ml d'eau**, sans tasser.
- Utilisez la mesurette de la boîte, gardez-la sèche, jetez-la avec la boîte.
- Les quantités dépendent de l'âge et de l'appétit : demandez conseil à votre médecin ou à la PMI.

### Conservation
- Idéalement, préparez le biberon juste avant la tétée.
- À température ambiante : à donner dans l'heure.
- Réchauffé : à donner dans la demi-heure.
- **Ne gardez jamais un biberon entamé** pour la tétée suivante.
- En sortie, transportez l'eau et la poudre séparément.

### Réchauffer
Le lait peut être donné à température ambiante. S'il faut le réchauffer : bain-marie ou chauffe-biberon, **jamais au micro-ondes** (risque de brûlure). Testez quelques gouttes sur l'intérieur du poignet.

### Nettoyage
Rincez, puis lavez à l'eau chaude avec du liquide vaisselle et un goupillon. La stérilisation n'est pas nécessaire. Séchez à l'air libre, démonté, tête en bas.

## Questions fréquentes
**Peut-on préparer les biberons de la nuit à l'avance ?**
Idéalement, préparez-les juste avant. Pour gagner du temps, vous pouvez préparer à l'avance l'eau et la poudre séparément, et les mélanger au moment de la tétée.

**Faut-il faire bouillir l'eau du robinet ?**
L'eau du robinet froide peut être utilisée après l'avoir laissée couler quelques secondes, sauf situation particulière (plomb, avis local).

**Combien de lait doit-il boire ?**
Cela dépend de l'âge et de l'appétit de votre bébé. L'application ne recommande pas de quantité : demandez conseil à votre médecin ou à la PMI, et suivez la notice de votre lait.

**Peut-on changer de lait facilement ?**
Parlez-en d'abord à votre médecin ou à votre pharmacien.

## Quand demander conseil
- Si votre bébé boit très peu, refuse les biberons, vomit souvent ou semble inconfortable après les repas.
- Si vous avez un doute sur l'eau de votre logement, le choix du lait ou le dosage.
- Si votre bébé a de la fièvre avant 3 mois, semble très somnolent, mou, ou respire difficilement : appelez le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis de votre médecin, de la PMI ou les indications de la notice du lait.`,
    journeys: ['newborn'],
    category: 'alimentation',
    tags: ['biberon', 'lait infantile', 'hygiène', 'préparation'],
    min_age_months: 0, max_age_months: 12,
    sources: [S.ameliBiberon, S.ansesBiberon],
    status: 'to_review',
  },
  {
    slug: 'fievre-nourrisson-quand-consulter',
    title: 'Fièvre du nourrisson : quand consulter ?',
    summary: 'Avant 3 mois, toute fièvre impose une consultation en urgence ; à tout âge, c’est surtout l’état général du bébé qui compte : les signes à surveiller et que faire.',
    body_md: `La fièvre est fréquente chez les bébés et souvent liée à une infection virale bénigne. Mais chez les tout-petits, elle doit toujours être prise au sérieux, et c'est l'état général de l'enfant qui guide la conduite à tenir.

## En bref
- On parle de fièvre à partir de **38 °C**, mesurée de préférence par voie rectale chez les moins de 2 à 3 ans.
- **Avant 3 mois**, toute fièvre impose une consultation en urgence, le jour même.
- À tout âge : difficultés à respirer, bébé mou ou somnolent, refus de boire, taches qui ne s'effacent pas… appelez le **15**.
- Ne pas trop couvrir, proposer souvent à boire, pas de bain froid.
- Les médicaments contre la fièvre se donnent selon l'avis du médecin ou du pharmacien.

## Comprendre
La fièvre est une réaction du corps face à une infection. Elle n'est pas une maladie en soi, et son chiffre seul ne dit pas si la situation est grave. Chez le très jeune nourrisson, en revanche, les défenses sont encore immatures et une infection peut évoluer vite : c'est pourquoi un bébé de moins de 3 mois qui a de la fièvre doit être vu en urgence, même s'il semble aller bien.

### Bien prendre la température
- Thermomètre électronique, par voie rectale de préférence chez les tout-petits.
- Prenez-la au calme, pas juste après un bain ou un repas chaud.
- Notez l'heure et la valeur : cela aidera le médecin.

## Au quotidien
### Avant 3 mois : consultez en urgence
Tout nourrisson de **moins de 3 mois** qui a de la fièvre doit être vu en urgence par un médecin, le jour même, même s'il semble aller bien.

### À tout âge : appelez le 15 ou consultez en urgence si
- difficultés à respirer : respiration rapide ou irrégulière, pauses, battements des ailes du nez, creux entre les côtes ;
- bébé somnolent, mou, qui réagit peu, cris faibles ou geignements ;
- refus de boire, signes de déshydratation ;
- peau marbrée, pâleur marquée, ou petites taches rouges qui ne s'effacent pas quand on appuie dessus ;
- vomissements répétés, raideur de la nuque ;
- fièvre au-dessus de 40 °C ;
- convulsions ;
- tout comportement qui vous paraît inhabituel ou inquiétant.

### Consultez dans la journée si
- la fièvre dure plus de 2 jours avant 2 ans ;
- elle revient après plus de 24 heures sans fièvre ;
- votre enfant a une maladie chronique ;
- un autre symptôme vous inquiète.

### En attendant
- Ne le couvrez pas trop, chambre à 18-20 °C.
- Proposez-lui souvent à boire.
- Pas de bain froid.
- Pour les médicaments contre la fièvre, suivez l'avis du médecin ou du pharmacien.
- Observez-le : comment il boit, comment il réagit, sa respiration, la couleur de sa peau, ses couches.

## Questions fréquentes
**À partir de quelle température faut-il s'inquiéter ?**
Avant 3 mois, dès 38 °C. Ensuite, c'est surtout son comportement qui compte : un bébé qui joue et boit inquiète moins qu'un bébé mou, même avec une température plus basse. Au-dessus de 40 °C, consultez en urgence.

**Faut-il le réveiller pour prendre sa température ?**
S'il dort calmement et respire normalement, vous pouvez surveiller. S'il vous semble difficile à réveiller, c'est un signe d'urgence.

**La poussée dentaire donne-t-elle de la fièvre ?**
Ne mettez pas une fièvre sur le compte des dents sans avis médical, surtout chez un petit nourrisson.

## Quand demander conseil
### Appelez le 15 ou le 112, ou consultez en urgence
- tout nourrisson de moins de 3 mois avec de la fièvre ;
- et à tout âge, l'un des signes listés ci-dessus (respiration difficile, somnolence, refus de boire, taches, convulsions…).

### Consultez dans la journée
- fièvre de plus de 2 jours avant 2 ans, fièvre qui revient, maladie chronique, autre symptôme inquiétant.

C'est l'état général de votre bébé qui compte plus que le chiffre du thermomètre. Vous le connaissez : en cas de doute, consultez. Cet article vous informe et ne remplace pas l'avis d'un médecin.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['fièvre', 'urgence', 'nourrisson', 'quand consulter'],
    min_age_months: 0, max_age_months: 12,
    safety_critical: true,
    sources: [S.ameliFievre, S.mpediaFievre],
    status: 'to_review',
  },
  {
    slug: 'mere-apres-la-naissance',
    title: 'Prendre soin de vous après la naissance',
    summary: 'Récupération, fatigue, émotions et rendez-vous de suivi : ce qui vous attend dans les semaines après l’accouchement, et les signes qui doivent faire consulter.',
    body_md: `Après la naissance, toute l'attention se porte souvent sur le bébé. Votre corps et votre moral ont pourtant besoin de temps et de soins. Les semaines qui suivent l'accouchement sont une période de récupération à part entière, avec un suivi prévu pour vous.

## En bref
- Le corps a besoin de plusieurs semaines pour récupérer ; la fatigue est fréquente.
- Une sage-femme peut venir à domicile, puis un **entretien postnatal précoce** et une **consultation postnatale** sont prévus.
- Le baby blues est fréquent les premiers jours ; si la tristesse ou l'anxiété durent, parlez-en.
- Saignements très abondants : appelez le **15**.
- Pensées de vous faire du mal : **3114** ; confusion, perte de contact avec la réalité : **15** ou **112**.

## Comprendre
### La récupération
- L'utérus met environ deux mois à reprendre sa taille ; des contractions (les tranchées) sont fréquentes au début, en particulier pendant les tétées.
- La fatigue est fréquente : grossesse, accouchement, nuits hachées. Faites de petites siestes quand bébé dort et acceptez l'aide proposée.
- Ne faites pas de régime si vous allaitez, et pas avant 3 mois sinon. Buvez régulièrement.

### Le suivi prévu
- Une sage-femme peut venir à domicile jusqu'au 12e jour du bébé, avec deux séances supplémentaires possibles ensuite.
- **Entretien postnatal précoce** entre la 4e et la 8e semaine, pour parler de votre ressenti.
- **Consultation postnatale** entre la 6e et la 8e semaine : examen, allaitement, contraception, et rééducation du périnée si besoin.
- La reprise du sport se fait progressivement, après avis médical.

### Les émotions
Le baby blues (larmes, irritabilité, hypersensibilité) est fréquent les premiers jours et passe en général vite. Parlez-en si la tristesse, l'anxiété ou l'épuisement durent, s'aggravent, ou si vous vous sentez détachée de votre bébé.

## Au quotidien
- **Reposez-vous dès que possible** : siestes quand bébé dort, visites limitées si vous en avez besoin.
- **Acceptez et demandez de l'aide** pour les repas, le ménage, les courses, les aînés.
- **Mangez et buvez régulièrement**, sans régime restrictif.
- **Notez vos questions** pour les rendez-vous avec la sage-femme et le médecin.
- **Prenez des nouvelles de vous** : comment vous dormez, comment vous vous sentez. Le point du jour de l'application peut vous y aider.

## Questions fréquentes
**Combien de temps durent les saignements après l'accouchement ?**
Ils diminuent progressivement sur plusieurs semaines. Des saignements très abondants, ou qui augmentent, doivent faire consulter sans attendre.

**Quand reprendre le sport ?**
Progressivement, après avis médical, en tenant compte de la rééducation du périnée si elle est nécessaire.

**Le baby blues, est-ce une dépression ?**
Le baby blues est fréquent et passe vite. Si la tristesse dure, s'intensifie ou vous empêche de vivre, parlez-en : une dépression du post-partum se soigne.

## Quand demander conseil
### Consultez sans attendre si
- saignements très abondants : c'est une urgence, appelez le **15** ;
- fièvre, saignements anormaux, pertes malodorantes ;
- douleur ou gêne dans le bas du ventre ;
- fuites urinaires ou gêne au niveau du périnée (à signaler, une rééducation est possible).

### En cas de détresse
Pensées de vous faire du mal : appelez le **3114** (24 h/24, gratuit). Confusion, propos incohérents, impression de perdre le contact avec la réalité, ou pensées de faire du mal à votre bébé : appelez le **15** ou le **112**. Ces pensées ne sont pas honteuses : elles signalent qu'il faut de l'aide, maintenant.

Cet article vous informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
    journeys: ['newborn'],
    category: 'post-partum',
    tags: ['post-partum', 'récupération', 'baby blues', 'consultation postnatale', 'périnée'],
    min_age_months: 0, max_age_months: 3,
    safety_critical: true,
    sources: [S.santeSuiviPost, S.ameliRetourMaison, S.ameliAidePsy],
    status: 'to_review',
  },
  {
    slug: 'nuits-avec-un-nouveau-ne',
    title: 'Les nuits avec un nouveau-né',
    summary: 'Avant 4 à 6 mois, se réveiller toutes les 2 à 4 heures fait partie du développement du bébé : comprendre son sommeil, l’aider à distinguer jour et nuit, et vous préserver.',
    body_md: `Les nuits avec un nouveau-né sont souvent courtes et hachées. Ce n'est ni un échec ni le signe d'une mauvaise habitude : c'est la façon dont dort un très jeune bébé. Comprendre son rythme aide à traverser cette période avec un peu plus de sérénité.

## En bref
- Un nouveau-né dort en moyenne 16 à 17 heures par 24 heures, en périodes de 3 à 4 heures.
- **Avant 4 à 6 mois, se réveiller après 2 à 4 heures de sommeil fait partie de son développement.**
- Lumière et activité le jour, calme et pénombre la nuit l'aident à distinguer les deux.
- Toujours recoucher bébé sur le dos, dans son propre lit — jamais de sommeil partagé sur un canapé.
- Se relayer et accepter de l'aide protège votre santé.

## Comprendre
### Comment dort un nouveau-né
- Il dort en moyenne 16 à 17 heures par 24 heures, réparties en périodes de 3 à 4 heures, sans faire de différence entre le jour et la nuit au début.
- Son rythme est réglé par la maturation de son cerveau, pas seulement par la faim.
- Avant 4 à 6 mois, se réveiller après 2 à 4 heures de sommeil est attendu à cet âge.
- En moyenne, les nuits s'allongent entre 4 et 6 mois, mais chaque bébé a son propre rythme, et certains prennent plus de temps.

## Au quotidien
### Aider bébé à distinguer le jour et la nuit
- Le jour : lumière naturelle, bruits habituels, moments d'éveil partagés.
- La nuit : peu de lumière, voix basse, gestes calmes, recoucher rapidement.

### Pendant les premiers mois
- Suivez son rythme et prenez-le dans vos bras s'il pleure.
- Inutile de réveiller un nouveau-né qui dort, sauf consigne médicale.
- Un plus gros biberon le soir ne prolonge pas le sommeil.

### En sécurité, même à 3 heures du matin
- Recouchez toujours bébé sur le dos, dans son propre lit.
- Si vous sentez que vous allez vous endormir en le nourrissant, reposez-le d'abord dans son lit.
- **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil.**

### Pour vous
- Se relayer quand c'est possible : l'un prend la première partie de nuit, l'autre la seconde.
- Faire des siestes dans la journée, même courtes.
- Accepter l'aide de l'entourage pour le reste de la maison.

## Questions fréquentes
**Quand fera-t-il ses nuits ?**
En moyenne, les nuits s'allongent entre 4 et 6 mois, mais chaque bébé a son rythme. Il n'y a pas d'âge précis à atteindre.

**Faut-il le réveiller pour manger ?**
Inutile de réveiller un nouveau-né qui dort, sauf consigne médicale (par exemple pour la prise de poids).

**Un biberon plus gros le soir l'aidera-t-il à dormir plus longtemps ?**
Non, un plus gros biberon le soir ne prolonge pas le sommeil.

**Il dort mieux contre moi, est-ce grave ?**
Le contact le rassure, mais pour dormir, recouchez-le sur le dos dans son lit, surtout si vous risquez de vous endormir.

## Quand demander conseil
- Si vous êtes épuisé(e) ou si la fatigue pèse sur votre moral : parlez-en à votre sage-femme, votre médecin ou la PMI.
- Si votre bébé pleure de façon inhabituelle, boit mal, a de la fièvre ou semble très somnolent : consultez.
- Si vous sentez que vous pourriez perdre le contrôle : posez bébé dans son lit et appelez le **119** ou Allô Parents Bébé (**0 800 00 34 56**).
- Bébé qui respire difficilement ou ne réagit pas : **15** ou **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn'],
    category: 'sommeil',
    tags: ['nuits', 'réveils', 'rythme veille-sommeil', 'nouveau-né'],
    min_age_months: 0, max_age_months: 6,
    sources: [S.santeVeilleSommeil, S.santeSommeilNormal, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'peau-a-peau-et-portage',
    title: 'Peau à peau et portage',
    summary: 'Le peau à peau et le portage répondent au besoin de proximité du bébé : leurs bienfaits, et les règles de sécurité pour garder son visage visible et sa respiration libre.',
    body_md: `Être tout contre vous rappelle au bébé la chaleur et les sensations de la vie avant la naissance. Peau à peau et portage sont deux façons de répondre à ce besoin de proximité, pour la mère comme pour l'autre parent.

## En bref
- Le peau à peau peut aider à apaiser bébé, à réguler sa température et facilite souvent la première tétée.
- Le co-parent peut aussi le pratiquer.
- En portage : bébé vertical, assez haut, **visage toujours visible**, voies respiratoires libres.
- Restez éveillé(e) pendant le peau à peau ; si le sommeil vient, recouchez bébé dans son lit, sur le dos.
- Un atelier avec une sage-femme ou à la PMI aide à bien s'installer.

## Comprendre
Un nouveau-né a besoin de contact : la chaleur, l'odeur, la voix et les battements de cœur de ses parents le rassurent. Le peau à peau et le portage répondent à ce besoin tout en vous laissant, pour le portage, les mains libres. Ils demandent cependant quelques précautions, car un tout-petit ne peut pas dégager lui-même son nez et sa bouche s'ils sont couverts.

## Au quotidien
### Le peau à peau
Bébé, en couche ou nu, est posé contre la peau de sa mère ou de son autre parent, couvert d'un linge chaud.
- Il peut aider à apaiser les pleurs et à réguler la température du bébé.
- Il facilite souvent la première tétée.
- Le co-parent peut aussi le pratiquer, par exemple pendant que la mère se remet d'une césarienne.

Pour la sécurité : la tête du bébé est tournée sur le côté, le nez et la bouche bien dégagés. Restez éveillé(e) pendant le peau à peau et, si vous sentez le sommeil venir, recouchez bébé dans son lit, sur le dos.

### Le portage
Il peut apaiser bébé et libérer vos mains. Quelques règles de sécurité :
- bébé en position verticale, contre votre poitrine, assez haut pour pouvoir le surveiller ;
- **visage toujours visible**, jamais couvert par un tissu ou un vêtement ;
- tête et pieds dégagés, voies respiratoires libres ;
- dos arrondi, genoux repliés vers le ventre ;
- une main sous ses fesses pendant l'installation.

mpedia déconseille le portage face au monde. Une écharpe convient jusqu'à environ 10 à 12 kg ; ensuite, un porte-bébé adapté prend le relais.

### Restez attentif(ve)
Surveillez sa couleur, sa respiration et sa température. Un atelier de portage avec une sage-femme ou à la PMI peut vous aider à bien vous installer.

## Questions fréquentes
**À partir de quand peut-on porter son bébé ?**
Dès les premiers jours, en respectant les règles de sécurité et avec un moyen de portage adapté à son âge et à son poids.

**Peut-on faire du peau à peau après une césarienne ?**
Oui, selon votre état ; le co-parent peut aussi prendre le relais.

**Peut-on le porter face au monde ?**
mpedia déconseille le portage face au monde.

**Peut-il dormir en écharpe ?**
Il peut s'endormir contre vous si son visage reste visible et sa respiration libre ; restez attentif(ve). Pour le sommeil prolongé, recouchez-le dans son lit, sur le dos.

## Quand demander conseil
- Si vous ne savez pas comment installer bébé, ou si vous avez mal au dos : un atelier de portage peut aider.
- Si votre bébé est né prématurément ou a un problème de santé : demandez conseil avant de le porter.
- Si bébé devient pâle, bleu, respire difficilement ou ne réagit pas : appelez immédiatement le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['peau à peau', 'portage', 'écharpe', 'lien'],
    min_age_months: 0, max_age_months: 12,
    sources: [S.mpediaPeau, S.mpediaEcharpe, S.santePremiereTetee, S.ameliCoucher],
    status: 'to_review',
  },

];
