/** Articles « Grossesse » de la bibliothèque. */
import { S } from './sources';
import type { LibArticle } from './types';

export const grossesse: LibArticle[] = [
  // ───────────────────────────── Grossesse ─────────────────────────────
  {
    slug: 'suivi-grossesse-rendez-vous-examens',
    title: 'Le suivi de grossesse : rendez-vous et examens',
    summary: 'Sept consultations, trois échographies, un entretien prénatal précoce et sept séances de préparation : voici à quoi sert chaque étape du suivi.',
    body_md: `Le suivi de grossesse permet de veiller à votre santé et à celle du bébé, de repérer tôt ce qui demande une attention particulière, et de répondre à vos questions. Voici le programme habituel décrit par l'Assurance Maladie, que votre professionnel adaptera à votre situation.

## En bref
- La première consultation a lieu avant la fin du 3e mois ; il y a sept consultations au total.
- Trois échographies sont recommandées.
- L'entretien prénatal précoce est conseillé dès le 4e mois, et il n'est jamais trop tard pour le demander.
- Sept séances de préparation à la naissance et à la parentalité sont proposées.
- Entre deux rendez-vous, vous pouvez contacter votre sage-femme, votre médecin ou votre maternité à tout moment.

## Comprendre
### Qui peut vous suivre
Le suivi peut être assuré par une sage-femme, un médecin généraliste ou un gynécologue-obstétricien, en ville ou à la maternité. Si votre grossesse demande une attention particulière, le suivi peut être partagé avec une équipe spécialisée.

### Les grands rendez-vous
- **Première consultation**, avant la fin du 3e mois : bilan de santé, examen, prises de sang, déclaration de grossesse.
- **Sept consultations** au total, puis une par mois à partir du 4e mois.
- **Trois échographies** recommandées.
- **Entretien prénatal précoce** : un temps d'échange avec une sage-femme ou un médecin, conseillé dès le 4e mois. Il n'est jamais trop tard pour le demander.
- **Sept séances de préparation** à la naissance et à la parentalité.
- **Consultation d'anesthésie** au 8e mois, même sans projet de péridurale.

### Les examens
- Prises de sang (groupe sanguin, immunités, anémie) et analyses d'urine régulières.
- Selon les situations, des contrôles supplémentaires (toxoplasmose, rubéole, rhésus).
- Des vaccinations peuvent être proposées pendant la grossesse (par exemple contre la coqueluche).

Chaque consultation mensuelle comprend en général un examen, la mesure de la tension et du poids, et un temps pour vos questions.

### D'autres aides
- Un **bilan bucco-dentaire** est pris en charge à partir du 4e mois.
- Un **bilan prénatal de prévention** avec une sage-femme peut être proposé, si possible avant la 24e semaine.

## Au quotidien
### Préparer chaque rendez-vous
- Notez vos questions au fil des jours (l'application vous permet de les rattacher à un rendez-vous).
- Apportez vos résultats d'analyses, vos comptes rendus d'échographie et la liste de vos traitements.
- Signalez tout ce qui a changé : symptômes, sommeil, moral, situation personnelle.

### L'entretien prénatal précoce
C'est un temps d'échange, sans examen, pour parler de votre projet, de vos besoins, de vos inquiétudes et de votre entourage. Il peut se faire seule ou en couple. Il permet d'adapter l'accompagnement, par exemple en orientant vers un soutien si besoin.

### Les démarches
La déclaration de grossesse est faite par le professionnel lors de la première consultation. Pensez à choisir votre maternité assez tôt, et renseignez-vous sur les droits liés au congé maternité et paternité.

## Questions fréquentes
**Puis-je venir accompagnée ?**
Oui, votre partenaire ou une personne de confiance peut assister aux consultations et aux échographies, sauf contrainte particulière du lieu.

**Et si je découvre ma grossesse tard ?**
Le suivi commence dès que possible : prenez rendez-vous rapidement, le programme sera adapté.

**Les rendez-vous sont-ils pris en charge ?**
Les examens obligatoires sont pris en charge selon les règles de l'Assurance Maladie ; votre professionnel vous précisera les modalités.

**Puis-je changer de professionnel en cours de route ?**
Oui, vous restez libre de votre choix.

## Quand demander conseil
Vous pouvez contacter votre sage-femme, votre médecin ou votre maternité à tout moment si quelque chose vous inquiète. Contractions douloureuses ou rapprochées, saignements, perte de liquide, brûlures urinaires, fortes nausées ou humeur très changeante sont des raisons de consulter sans attendre le prochain rendez-vous.

**En urgence, appelez le 15 (ou le 112)** : saignement abondant, malaise, douleur dans la poitrine, douleur intense du ventre.

Cet article informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['suivi', 'consultations', 'examens', 'entretien prénatal'],
    min_week: 4, max_week: 41,
    sources: [S.ameliProgramme, S.ameliMensuel],
    status: 'to_review',
  },
  {
    slug: 'echographies-de-grossesse',
    title: 'Les trois échographies de la grossesse',
    summary: 'Trois échographies sont recommandées, chacune avec un but précis : dater la grossesse, observer le développement, vérifier la croissance.',
    body_md: `Les échographies sont souvent des moments forts, attendus avec émotion et parfois avec une pointe d'inquiétude. Savoir à quoi sert chacune, comment elle se déroule et quelles questions poser peut aider à les aborder plus sereinement.

## En bref
- Trois échographies sont recommandées : vers 11 à 13 SA + 6 jours, entre 20 et 24 SA, puis entre 30 et 35 SA.
- La première date la grossesse ; la deuxième observe le développement ; la troisième vérifie la croissance et la position du bébé.
- SA signifie « semaines d'aménorrhée », comptées depuis le premier jour des dernières règles.
- Des échographies supplémentaires peuvent être prescrites sans que cela signifie forcément un problème.
- Vous pouvez venir accompagnée et poser toutes vos questions.

## Comprendre
### Comment se passe l'examen
L'échographie utilise des ultrasons pour former une image. Un gel est appliqué sur le ventre, puis une sonde est déplacée sur la peau. Au tout début de la grossesse, l'examen peut aussi se faire par voie vaginale pour une image plus précise. L'examen n'est pas douloureux ; sa durée varie, notamment selon la position du bébé.

### Première échographie : vers 11 à 13 SA + 6 jours
Dite « de datation », elle permet :
- de préciser le terme et la date prévue d'accouchement ;
- de connaître le nombre de fœtus et de vérifier leur vitalité ;
- de dépister certaines malformations importantes.

Elle s'inscrit aussi dans le dépistage de la trisomie 21, qui vous est proposé et que vous êtes libre d'accepter ou non.

### Deuxième échographie : entre 20 et 24 SA
Appelée « morphologique », elle observe le développement des organes, mesure le bébé et repère la position du placenta.

### Troisième échographie : entre 30 et 35 SA
Elle contrôle la croissance, la position du bébé et le placenta, en vue de l'accouchement.

## Au quotidien
### Bon à savoir
- **SA** signifie « semaines d'aménorrhée », comptées depuis le premier jour des dernières règles. On parle aussi de semaines de grossesse (SG), qui comptent deux semaines de moins.
- D'autres échographies peuvent être prescrites selon votre situation : cela ne signifie pas forcément qu'il y a un problème. N'hésitez pas à demander pourquoi.
- Vous pouvez venir accompagnée, et poser toutes vos questions pendant ou après l'examen.

### Pour bien préparer
- Apportez vos résultats d'analyses et le compte rendu de l'échographie précédente.
- Évitez d'appliquer une crème sur le ventre le jour de l'examen.
- Selon le centre, il peut être demandé d'avoir la vessie plus ou moins pleine : suivez les consignes données à la prise de rendez-vous.
- Pensez à votre agenda : prenez rendez-vous assez tôt, car les créneaux se remplissent vite.

### Le sexe du bébé
Il peut souvent être vu à la deuxième échographie, si la position du bébé le permet. Vous pouvez demander à le savoir ou au contraire à garder la surprise : dites-le au début de l'examen.

## Questions fréquentes
**Les échographies sont-elles dangereuses pour le bébé ?**
Les échographies médicales prescrites font partie du suivi recommandé. Les échographies « souvenir » sans but médical ne sont pas recommandées.

**Je n'ai pas vu grand-chose sur l'écran : est-ce inquiétant ?**
L'image dépend beaucoup de la position du bébé. L'échographiste peut vous expliquer ce qu'il observe, ou proposer de revenir si l'examen n'a pas pu être complet.

**Le terme peut-il changer après la première échographie ?**
Oui, la date prévue d'accouchement est souvent précisée à la première échographie, car elle est plus fiable que le calcul à partir des règles.

**Que faire si je ne peux pas me rendre au rendez-vous ?**
Prévenez le centre pour le décaler, en restant dans la période recommandée.

## Quand demander conseil
### Si une anomalie est évoquée
Vous avez le droit de prendre le temps de comprendre et de demander des explications. Votre équipe peut vous orienter vers un accompagnement adapté, y compris un soutien psychologique.

### Sans attendre la prochaine échographie
Contactez votre maternité en cas de saignement, de perte de liquide, de contractions douloureuses ou rapprochées, ou d'une inquiétude sur les mouvements du bébé. **En urgence, appelez le 15 (ou le 112).**

Cet article informe et ne remplace pas l'avis de votre sage-femme, de votre médecin ou de l'échographiste.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['échographie', 'datation', 'morphologique', 'SA'],
    min_week: 8, max_week: 36,
    sources: [S.ameliProgramme, S.ameliMensuel],
    status: 'to_review',
  },
  {
    slug: 'nausees-de-grossesse',
    title: 'Nausées de grossesse : ce qui peut soulager',
    summary: 'Fréquentes au début de la grossesse, les nausées peuvent survenir à toute heure : des gestes simples soulagent, et certains signes doivent faire consulter vite.',
    body_md: `On parle souvent de « nausées du matin », mais elles peuvent survenir à n'importe quel moment de la journée. Elles sont fréquentes et peuvent être très pénibles : ce n'est pas « dans la tête ». Voici ce qui peut soulager, et quand il ne faut pas attendre pour consulter.

## En bref
- Les nausées et vomissements sont fréquents au premier trimestre et s'atténuent souvent ensuite.
- Manger souvent et en petites quantités, sans rester à jeun, aide beaucoup de femmes.
- Aucun médicament ni produit « naturel » sans avis médical ; les huiles essentielles sont à éviter.
- Des traitements existent : vous n'avez pas à « tenir bon » seule.
- Vomissements importants, impossibilité de boire ou perte de poids doivent faire consulter rapidement.

## Comprendre
### D'où viennent les nausées
Elles sont liées aux changements hormonaux du début de la grossesse. Leur intensité varie beaucoup d'une femme à l'autre, et d'une grossesse à l'autre. La fatigue, les odeurs fortes ou le fait d'avoir l'estomac vide peuvent les aggraver.

### Quand elles deviennent sévères
Dans une petite partie des cas, les vomissements sont si importants qu'ils empêchent de s'alimenter et de boire : on parle d'**hyperémèse gravidique**. Cette forme nécessite un traitement rapide, parfois à l'hôpital, pour éviter la déshydratation.

### Évaluer leur intensité
Un questionnaire simple, le **score PUQE**, permet d'évaluer les nausées sur 24 heures. Votre médecin ou votre sage-femme peut vous aider à le remplir et adapter la prise en charge.

## Au quotidien
### Ce qui peut aider
- Manger souvent, en petites quantités, sans rester longtemps à jeun.
- Choisir ce qui vous fait envie, en évitant les plats gras, frits ou épicés.
- Réduire le thé, le café et les boissons caféinées.
- Boire régulièrement, surtout en cas de vomissements.
- Se lever doucement, aérer, éviter les odeurs qui déclenchent les nausées.
- Se reposer : la fatigue peut les aggraver. Des siestes ou des jours de repos peuvent être utiles.

### Médicaments et produits naturels
- **Aucun médicament sans avis médical.**
- Les huiles essentielles sont à éviter pendant la grossesse.
- Le gingembre peut être envisagé pour des nausées peu sévères : demandez conseil à votre pharmacien.

### Au travail et à la maison
- Gardez à portée de main quelque chose à grignoter (biscuits secs, fruit) dès le réveil et dans votre sac.
- Fractionnez les repas en plusieurs petites prises.
- Demandez de l'aide pour les courses ou la cuisine si les odeurs vous gênent.
- Parlez-en à votre médecin si votre travail devient difficile : un arrêt ou un aménagement peut se discuter.

### Noter pour mieux en parler
Noter les moments de la journée, les déclencheurs et le nombre de vomissements (dans l'outil « Comment je me sens ») aide à décrire la situation en consultation.

## Questions fréquentes
**Les nausées sont-elles mauvaises pour le bébé ?**
Les nausées en elles-mêmes sont fréquentes. Ce qui compte, c'est de rester hydratée et de pouvoir s'alimenter : si ce n'est plus possible, consultez rapidement.

**Combien de temps durent-elles ?**
Elles s'atténuent souvent au cours du deuxième trimestre, mais chez certaines femmes elles durent plus longtemps. Parlez-en si elles persistent.

**Puis-je prendre un médicament contre les nausées ?**
Seulement sur avis médical : votre médecin ou votre sage-femme choisira un traitement compatible avec la grossesse.

**Je n'ai pas de nausées : est-ce inquiétant ?**
Pas forcément : beaucoup de femmes n'en ont pas ou très peu. Si quelque chose vous inquiète, parlez-en à votre sage-femme ou à votre médecin.

## Quand demander conseil
- **Rapidement** : vomissements importants et persistants qui gênent la vie quotidienne, perte de poids, impossibilité de garder les liquides, signes de déshydratation (soif intense, bouche sèche, urines foncées), fièvre ou fatigue inhabituelle.
- **En urgence (15 ou 112)** : nausées et vomissements sévères avec malaise, ou impossibilité totale de boire. L'hyperémèse gravidique nécessite un traitement rapide.
- Si les nausées pèsent sur votre moral, parlez-en aussi : c'est une vraie épreuve.

Des traitements existent : vous n'avez pas à « tenir bon » seule.

Cet article informe et ne remplace pas l'avis de votre médecin, de votre sage-femme ou de votre pharmacien.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['nausées', 'vomissements', 'premier trimestre', 'hyperémèse'],
    min_week: 4, max_week: 20,
    safety_critical: true,
    sources: [S.ameliNausees, S.ameliNauseesConsult],
    status: 'to_review',
  },
  {
    slug: 'sommeil-pendant-la-grossesse',
    title: 'Mieux dormir pendant la grossesse',
    summary: 'La fatigue est fréquente pendant la grossesse : quelques habitudes, la position sur le côté et un peu d’aide peuvent rendre les nuits plus douces.',
    body_md: `La fatigue est très fréquente, surtout au premier trimestre, en raison des changements hormonaux. Plus tard, le ventre qui s'arrondit, les envies d'uriner, les brûlures d'estomac ou les pensées qui tournent peuvent rendre le repos plus difficile. Voici des pistes concrètes.

## En bref
- La fatigue du premier trimestre est liée aux changements hormonaux ; elle s'atténue souvent ensuite.
- Dormir sur le côté, gauche ou droit, est la position conseillée, surtout au troisième trimestre.
- Se réveiller sur le dos n'est pas grave : il suffit de se tourner sur le côté.
- Un moment calme avant le coucher, des coussins et un peu d'activité dans la journée aident souvent.
- Si la fatigue pèse sur le moral, parlez-en : des solutions existent.

## Comprendre
### Pourquoi on est si fatiguée
Au premier trimestre, le corps s'adapte à la grossesse : les hormones changent, le volume de sang augmente, et une grande fatigue peut s'installer même avec des nuits complètes. Au troisième trimestre, le poids du ventre, les mouvements du bébé, les envies fréquentes d'uriner et les douleurs de dos peuvent fragmenter le sommeil.

### Pourquoi la position compte
Le service de santé britannique (NHS) cite des travaux associant le sommeil sur le dos après 28 semaines à un risque plus élevé de complications graves pour le bébé. C'est pourquoi la position **sur le côté** est conseillée pour s'endormir, à partir du troisième trimestre. L'Assurance Maladie conseille aussi d'éviter de rester allongée sur le dos de façon prolongée à partir de la 24e semaine.

## Au quotidien
### Des idées pour mieux se reposer
- Reposez-vous dès que possible et acceptez l'aide proposée.
- Prenez un moment calme avant le coucher : respiration, relaxation.
- Évitez les longues siestes en fin d'après-midi si elles vous empêchent de vous endormir le soir.
- Limitez la caféine (thé, café, cola) en soirée.
- Restez active dans la journée si votre situation le permet : marche, natation, gymnastique douce.
- Calez votre ventre avec un coussin et placez-en un entre vos genoux.

### Quelle position ?
- Dormir **sur le côté**, gauche ou droit, est la position conseillée, notamment à partir du troisième trimestre.
- Si vous vous réveillez sur le dos, pas d'inquiétude : tournez-vous simplement sur le côté.
- Un coussin dans le dos peut aider à rester sur le côté.

### Les petits maux de la nuit
- **Envies d'uriner** : buvez bien dans la journée, un peu moins juste avant le coucher.
- **Brûlures d'estomac** : évitez les repas lourds tard le soir et surélevez légèrement la tête.
- **Crampes ou jambes lourdes** : bougez dans la journée et parlez-en à votre professionnel si elles sont fréquentes.

### Les pensées qui empêchent de dormir
Inquiétudes, rêves intenses, questions sur l'accouchement : en parler avec votre partenaire, votre sage-femme ou lors de la préparation à la naissance peut soulager. Noter ses pensées avant le coucher aide certaines personnes à « vider la tête ».

## Questions fréquentes
**Puis-je prendre quelque chose pour dormir ?**
Aucun médicament ni produit « naturel » sans avis médical pendant la grossesse. Parlez-en à votre médecin ou à votre sage-femme.

**La sieste est-elle une bonne idée ?**
Oui, si elle ne vous empêche pas de dormir le soir : préférez une sieste courte en début d'après-midi.

**Je me réveille la nuit avec le bébé qui bouge : est-ce gênant ?**
Les mouvements sont souvent plus perceptibles au repos. Si vous avez une inquiétude sur les mouvements du bébé, contactez votre maternité.

**Mon partenaire peut-il aider ?**
Partager les tâches du soir, accepter qu'il ou elle prenne le relais, ou simplement parler de la fatigue peut alléger la charge.

## Quand demander conseil
- Si le manque de sommeil vous pèse ou dure.
- Si l'insomnie s'accompagne de tristesse, de perte d'intérêt ou d'un sentiment de désespoir : parlez-en à votre médecin ou à votre sage-femme. Des solutions existent. En cas d'idées noires, le **3114** répond 24 h/24.
- Si vous ronflez beaucoup ou faites des pauses respiratoires, ou si une envie irrésistible de bouger les jambes vous empêche de dormir.
- **En urgence (15 ou 112)** : essoufflement important, douleur dans la poitrine, malaise.

Cet article informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
    journeys: ['pregnant'],
    category: 'sommeil',
    tags: ['sommeil', 'fatigue', 'position', 'insomnie'],
    sources: [S.nhsFatigueGrossesse, S.ameliActive],
    status: 'to_review',
  },
  {
    slug: 'grossesse-signes-qui-doivent-faire-consulter',
    title: 'Pendant la grossesse : les signes qui doivent faire consulter',
    summary: 'Saignements, perte de liquide, contractions rapprochées ou certains maux de tête doivent faire contacter vite la maternité : savoir les reconnaître permet d’agir tôt.',
    body_md: `La plupart des grossesses se déroulent bien. Connaître les signes d'alerte ne sert pas à s'inquiéter, mais à savoir réagir vite si besoin, et à qui s'adresser. **En cas de doute, appelez : vous ne dérangez pas.**

## En bref
- Saignement abondant avec malaise, douleur dans la poitrine, saignement avec douleurs ou fièvre : appelez le 15 (ou le 112).
- Au 2e ou 3e trimestre, tout saignement, une perte de liquide ou des contractions rapprochées doivent faire contacter la maternité sans attendre.
- Maux de tête persistants, troubles de la vue ou gonflement brutal peuvent évoquer une pré-éclampsie.
- Une inquiétude sur les mouvements du bébé justifie d'appeler la maternité.
- Votre moral compte aussi : en cas d'idées noires, le 3114 répond 24 h/24.

## Comprendre
### Pourquoi ces signes comptent
Certains symptômes peuvent signaler une complication qui gagne à être prise en charge tôt : un problème du placenta, un début de travail prématuré, une rupture de la poche des eaux, une infection ou une **pré-éclampsie** (une maladie liée à la grossesse, qui associe notamment une hypertension). Une consultation rapide permet de vérifier et, si besoin, d'agir. Souvent, l'examen rassure.

### À qui s'adresser
- **Le 15 ou le 112** pour une urgence vitale ou en cas de doute grave.
- **Votre maternité** (urgences obstétricales), joignable 24 h/24, pour les signes liés à la grossesse à partir du milieu de la grossesse.
- **Votre sage-femme ou votre médecin** pour les situations moins urgentes.

## Au quotidien
### Avoir les bons numéros sous la main
Enregistrez dans votre téléphone le numéro des urgences de votre maternité, et gardez vos documents de grossesse (comptes rendus, groupe sanguin) faciles à retrouver.

### Appelez le 15 (ou le 112), ou rendez-vous aux urgences
- Saignement abondant avec malaise.
- Saignements avec douleurs du bas-ventre (d'un côté ou diffuses), ou avec fièvre.
- Douleur dans la poitrine.

### Contactez sans attendre votre maternité
- **Tout saignement au 2e ou 3e trimestre**, même indolore ou après un rapport : il doit être vu en urgence.
- **Perte de liquide** continue, qui peut évoquer une rupture de la poche des eaux.
- **Contractions** douloureuses ou de plus en plus rapprochées, qui ne cèdent pas au repos.
- À partir du milieu de la grossesse : **maux de tête persistants**, troubles de la vue (taches, éclairs, vision floue), douleur en barre en haut du ventre, bourdonnements d'oreilles, gonflement brutal du visage ou des mains. Ces signes peuvent évoquer une pré-éclampsie.
- Mollet gonflé, dur et douloureux.

### Consultez rapidement
- Fièvre (38 °C ou plus), même sans autre signe.
- Saignement léger au premier trimestre, sans douleur ni malaise.
- Nausées et vomissements importants, signes de déshydratation.
- Brûlures en urinant.
- Vertiges, malaises, essoufflement anormal qui persiste au repos.

### Votre moral compte aussi
Pleurs fréquents, humeur très changeante, anxiété permanente : parlez-en à votre sage-femme ou à votre médecin. Si vous avez des idées de vous faire du mal, appelez le **3114** (gratuit, 24 h/24).

## Questions fréquentes
**J'ai peur de déranger pour rien.**
Les équipes préfèrent vous voir pour rien plutôt que trop tard. Appeler fait partie du suivi.

**Je ne sens plus beaucoup mon bébé bouger : que faire ?**
Contactez votre maternité sans attendre, même si ce n'est qu'une impression.

**Un petit saignement après un rapport, est-ce grave ?**
Au 2e ou 3e trimestre, tout saignement doit être vu en urgence, même indolore ou après un rapport. Au 1er trimestre, sans douleur ni malaise, consultez rapidement.

**Comment savoir si c'est la poche des eaux ?**
Une perte de liquide continue, qui mouille le linge, doit faire contacter la maternité. En cas de doute, appelez.

## Quand demander conseil
Ce sont justement tous les signes listés ci-dessus. Si vous avez une inquiétude sur les mouvements de votre bébé, contactez votre maternité sans attendre. **En urgence, appelez le 15 (ou le 112).**

Cet article informe et ne remplace pas l'avis de votre maternité, de votre sage-femme ou de votre médecin.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['signes d’alerte', 'urgence', 'saignements', 'contractions', 'pré-éclampsie'],
    safety_critical: true,
    sources: [S.ameliMensuel, S.ameliSaign1, S.ameliSaign23, S.ameliPreeclampsie, S.sante8eMois],
    status: 'to_review',
  },
  {
    slug: 'activite-physique-pendant-la-grossesse',
    title: 'Bouger pendant la grossesse',
    summary: 'Sauf contre-indication, une activité physique régulière et modérée fait du bien pendant la grossesse : quelles activités choisir, comment s’y prendre, quoi éviter et quels signes doivent faire arrêter.',
    body_md: `## En bref
- Sauf contre-indication médicale, bouger régulièrement pendant la grossesse contribue à la forme, au bien-être et à une bonne circulation du sang.
- Repère général : **au moins 30 minutes par jour** d’activité modérée, et du renforcement musculaire **une à deux fois par semaine**, à ajuster avec votre médecin ou votre sage-femme.
- La marche, la natation, la gymnastique douce, le yoga prénatal ou l’aquagym pour femmes enceintes sont souvent proposés.
- À éviter : les activités avec risque de chute ou de choc, les efforts en bloquant la respiration, la chaleur humide, l’altitude et les pics de pollution.
- Arrêtez et consultez en cas d’essoufflement qui persiste au repos, de contractions, de saignements, de malaise ou de mollet gonflé. Douleur dans la poitrine : **15**.

## Comprendre
Une activité adaptée sollicite le cœur et les poumons, entretient les muscles et les articulations, et favorise le retour veineux, c’est-à-dire la remontée du sang des jambes vers le cœur. Elle procure aussi une sensation de bien-être et de légèreté.

Le type d’activité, son intensité et sa fréquence se décident avec le médecin ou la sage-femme qui vous suit : certaines situations médicales contre-indiquent l’effort, et chaque grossesse est différente. La régularité compte souvent davantage que l’intensité. Si vous étiez peu active avant la grossesse, vous pouvez commencer doucement et augmenter petit à petit.

Rester longtemps immobile n’aide pas non plus : il est conseillé de ne pas rester assise trop longtemps et de marcher un peu toutes les deux heures. À l’inverse, la station debout prolongée peut faire baisser la tension et provoquer un malaise.

## Au quotidien
- **La marche** : accessible, elle peut se commencer à tout moment et se poursuivre jusqu’à l’accouchement, seule ou en famille.
- **La natation ou la marche dans l’eau** : elles ménagent les articulations et favorisent le retour veineux. Des piscines proposent des cours pour femmes enceintes ; évitez les heures de forte affluence.
- **La gymnastique douce, le yoga prénatal, le Pilates ou l’aquagym spécifique** : on y travaille la respiration, le bassin et le périnée. Un encadrant formé peut corriger vos postures.
- **La course à pied** : plutôt si vous la pratiquiez déjà. Choisissez de bonnes chaussures, un terrain souple, et arrêtez si vos chevilles deviennent douloureuses.
- **Le renforcement musculaire** : une à deux fois par semaine. Pour le plancher pelvien, Santé.fr propose par exemple de contracter environ 10 secondes, relâcher 5 secondes, une dizaine de fois, plusieurs fois par jour. Pendant les exercices, ne creusez pas le bas du dos et expirez à l’effort.

Les bons réflexes : 10 à 15 minutes d’échauffement avant, 10 à 15 minutes de récupération après avec des étirements doux ; boire pendant l’effort ; une tenue adaptée à la température. Quand le ventre s’arrondit, préférez les exercices allongée sur le côté ou debout mais courts, et méfiez-vous des changements d’équilibre.

À éviter : les contractions prolongées en bloquant la respiration ; les exercices allongée sur le dos à partir de la 24e semaine d’aménorrhée ; les activités où l’on peut perdre l’équilibre, tomber ou recevoir un choc (sports de contact ou de combat, par exemple) ; la plongée sous-marine ; les environnements chauds et humides ; l’altitude ; l’effort lors d’un pic de pollution.

## Questions fréquentes
**Je n’étais pas sportive : puis-je commencer maintenant ?** Oui, le plus souvent, avec des activités douces comme la marche ou la natation, après en avoir parlé avec votre médecin ou votre sage-femme. Commencez par des séances courtes et augmentez progressivement.

**Pourquoi éviter d’être allongée sur le dos ?** Plus tard dans la grossesse, l’utérus peut comprimer les gros vaisseaux et freiner le retour du sang vers le cœur, ce qui peut faire baisser la tension. C’est pourquoi on recommande d’éviter cette position à partir de la 24e semaine (vers le 5e mois).

**Puis-je garder mon sport habituel ?** Cela dépend du sport et de votre grossesse : parlez-en avec le professionnel qui vous suit, qui vous aidera à adapter l’intensité.

**Et les jours de grande fatigue ?** Écoutez votre corps : se reposer fait aussi partie de l’équilibre. Si la fatigue est intense ou dure, parlez-en lors de votre suivi.

## Quand demander conseil
Demandez l’avis de votre médecin ou de votre sage-femme avant de commencer ou de reprendre une activité. Pendant l’effort, arrêtez-vous et consultez si vous ressentez :
- un essoufflement anormal qui ne passe pas au repos ;
- une douleur dans la poitrine : **appelez le 15 (ou le 112)** ;
- des contractions régulières et douloureuses qui persistent au repos ;
- des saignements vaginaux ;
- des vertiges, des troubles de l’équilibre, un malaise ou des maux de tête inhabituels ;
- un mollet gonflé et dur, qui peut être le signe d’une phlébite.

Cet article informe et ne remplace pas l’avis de votre médecin ou de votre sage-femme.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['activité physique', 'sport', 'marche', 'précautions'],
    sources: [S.mbGrossesse, S.ameliActive, S.santeActiviteGrossesse],
    status: 'to_review',
  },
  {
    slug: 'preparation-naissance-parentalite',
    title: 'La préparation à la naissance et à la parentalité',
    summary: 'Un entretien prénatal précoce puis sept séances prises en charge : un temps pour comprendre la naissance, préparer le retour à la maison et poser toutes vos questions.',
    body_md: `La préparation à la naissance ne sert pas qu'à apprendre à respirer. C'est un temps pour comprendre ce qui va se passer, poser vos questions sans vous presser, rencontrer d'autres futurs parents et organiser le retour à la maison. Elle s'adapte à vous : à votre santé, à votre projet et à vos inquiétudes.

## En bref
- Un **entretien prénatal précoce** obligatoire, conseillé dès le 4e mois, seule ou en couple.
- **Sept séances** de préparation prises en charge à 100 % par l'Assurance Maladie.
- Animées par une sage-femme ou un médecin, en groupe ou en individuel.
- On y parle de l'accouchement, mais aussi des premiers jours avec bébé, de l'allaitement ou du biberon, du sommeil et de vous.
- Le ou la partenaire peut souvent participer à certaines séances.

## Comprendre
### L'entretien prénatal précoce
C'est le point de départ. Ce rendez-vous, avec une sage-femme ou un médecin, n'est pas un examen médical : c'est une conversation. Vous pouvez y parler de votre projet de naissance, de vos attentes, de ce qui vous inquiète, de votre situation familiale ou professionnelle, et de l'aide dont vous pourriez avoir besoin. C'est souvent à ce moment que se construit le calendrier des séances de préparation, et que l'on peut vous orienter vers d'autres professionnels si besoin.

### Les sept séances
Elles se répartissent au fil de la grossesse. Leur contenu varie selon les professionnels et vos besoins, mais on y retrouve en général :
- le déroulement de la fin de grossesse, des signes qui annoncent le travail, de l'accouchement et du séjour à la maternité ;
- des exercices de respiration, de relaxation et des postures pour soulager certains inconforts (dos, jambes lourdes, sommeil) ;
- les soins au nouveau-né, son alimentation et ses besoins ;
- l'organisation du retour à la maison, la place de chacun, le repos.

Il existe différentes approches (groupe, individuel, en piscine, avec des exercices corporels…). Demandez ce qui est proposé près de chez vous.

## Au quotidien
- **Préparez vos questions** : notez-les dans votre téléphone au fil des semaines, même celles qui vous semblent petites (« Comment savoir que c'est le moment de partir ? », « Que mettre dans la valise ? »).
- **Parlez de votre projet de naissance** : ce que vous souhaitez, ce qui compte pour vous, ce qui vous inquiète. Il pourra évoluer, et c'est très bien ainsi.
- **Impliquez votre partenaire** : certaines séances lui sont ouvertes. Cela l'aide à trouver sa place le jour J et les semaines suivantes.
- **Choisissez votre maternité tôt** : vérifiez les services proposés et le niveau de maternité adapté à votre santé. Si vous habitez à plus de 45 minutes d'une maternité, un dispositif peut prendre en charge un hébergement et des transports : renseignez-vous auprès de l'Assurance Maladie.
- **Pensez à l'après** : qui pourra vous aider à la maison ? Comment vous relayer la nuit ? En parler avant soulage souvent beaucoup.

## Questions fréquentes
**Est-ce obligatoire de suivre les sept séances ?**
L'entretien prénatal précoce est obligatoire ; les séances de préparation sont proposées et prises en charge, mais vous restez libre d'y participer, en totalité ou en partie.

**Peut-on commencer tard dans la grossesse ?**
Oui. Même quelques séances peuvent être utiles. Parlez-en à votre sage-femme ou à votre médecin pour adapter le programme.

**Et si j'ai peur de l'accouchement ?**
C'est justement un bon endroit pour en parler. Exprimer ses peurs permet de recevoir des informations claires et un accompagnement adapté.

**Faut-il préparer un projet de naissance écrit ?**
Ce n'est pas obligatoire. Certaines personnes trouvent utile de noter leurs souhaits pour en parler avec l'équipe ; d'autres préfèrent en discuter de vive voix.

## Quand demander conseil
- Si vous vous sentez très anxieuse à l'idée de l'accouchement, ou si une naissance précédente a été difficile : parlez-en dès l'entretien prénatal précoce.
- Si vous ne savez pas comment organiser le suivi ou trouver une sage-femme : votre médecin, la maternité ou la PMI peuvent vous orienter.
- En cas de saignements, de perte de liquide, de contractions régulières avant terme ou de baisse des mouvements du bébé : contactez votre maternité sans attendre. En urgence, appelez le **15** ou le **112**.

Il n'y a pas de « bonne » façon de vivre une naissance : la préparation vous aide à faire vos propres choix, en lien avec l'équipe. Cet article vous informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
    journeys: ['pregnant'],
    category: 'accouchement',
    tags: ['préparation à la naissance', 'entretien prénatal précoce', 'sage-femme', 'projet de naissance'],
    min_week: 12, max_week: 41,
    sources: [S.ameliPreparation, S.ameliProgramme],
    status: 'to_review',
  },
  {
    slug: 'humeur-pendant-la-grossesse',
    title: 'Humeur et émotions pendant la grossesse',
    summary: 'Joie, doutes et inquiétudes se mêlent souvent pendant la grossesse ; quand l’anxiété ou la tristesse s’installent, en parler tôt permet d’être accompagnée.',
    body_md: `La grossesse bouleverse le corps, le quotidien et la façon dont on se projette. Il est fréquent de ressentir à la fois de la joie, des doutes, des peurs, de l'irritabilité ou des larmes. Ces émotions ne font pas de vous une moins bonne future mère : elles accompagnent un très grand changement de vie.

## En bref
- Les variations d'humeur sont fréquentes pendant la grossesse.
- Quand l'anxiété ou la tristesse durent, s'intensifient ou empêchent de vivre au quotidien, il est important d'en parler.
- Selon l'Assurance Maladie, la dépression concerne environ une femme enceinte sur dix ; elle peut apparaître à tout moment et elle se soigne.
- Votre sage-femme, votre médecin et l'entretien prénatal précoce sont des portes d'entrée pour être aidée.
- En cas de pensées de vous faire du mal : **3114**, 24 h/24 ; danger immédiat : **15** ou **112**.

## Comprendre
### Pourquoi l'humeur change
Plusieurs choses se cumulent : les changements hormonaux et physiques, la fatigue, les nausées ou l'inconfort, les inquiétudes sur la santé du bébé, l'accouchement ou le fait de devenir parent, parfois des difficultés de couple, de travail ou de logement. Après un parcours pour concevoir, une perte de grossesse antérieure ou une naissance précédente difficile, les émotions peuvent être plus intenses.

### Quand cela devient plus qu'une variation d'humeur
Certains signes, surtout s'ils durent plus de quelques jours, méritent d'en parler :
- une anxiété permanente ou difficile à supporter, des crises d'angoisse, un besoin constant d'être rassurée ;
- une grande tristesse, des pleurs sans raison apparente, un sentiment d'inutilité ou de culpabilité ;
- une perte d'intérêt pour ce que vous aimiez, un manque d'énergie, des difficultés à prendre soin de vous ;
- des troubles du sommeil ou de l'appétit qui ne s'expliquent pas seulement par la grossesse ;
- des idées noires.

Seul un professionnel peut faire le point avec vous ; ces repères servent à ne pas rester seule avec ce que vous ressentez.

## Au quotidien
- **Mettez des mots** : en parler à une personne de confiance, à votre partenaire ou à un professionnel aide souvent à alléger le poids.
- **Gardez des temps pour vous**, même courts : une marche, un moment calme, une activité qui vous fait du bien, selon ce que votre état permet.
- **Protégez votre sommeil** autant que possible : siestes, coucher plus tôt, aide pour les tâches.
- **Acceptez l'aide** proposée, et osez la demander.
- **Notez vos ressentis** dans l'application si cela vous aide : cela facilite ensuite la conversation avec votre sage-femme ou votre médecin.

## Questions fréquentes
**Est-ce que mon stress peut faire du mal au bébé ?**
Se sentir parfois stressée est fréquent. Si l'anxiété est forte ou permanente, c'est surtout pour vous qu'il est important d'être accompagnée : parlez-en, des solutions existent.

**J'ai peur d'être jugée si je dis que je ne vais pas bien.**
Les professionnels qui suivent les grossesses posent ces questions régulièrement. Parler de votre moral fait partie du suivi, au même titre qu'une prise de tension.

**Je n'arrive pas à me réjouir de cette grossesse, est-ce grave ?**
Les émotions sont rarement simples. Si ce sentiment dure ou vous fait souffrir, parlez-en : on peut vous écouter sans vous juger.

**Peut-on voir un psychologue pendant la grossesse ?**
Oui. Le dispositif « Mon soutien psy » permet des séances prises en charge. Votre médecin ou votre sage-femme peut aussi vous orienter.

## Quand demander conseil
- Dès que la tristesse, l'anxiété ou l'épuisement durent ou vous empêchent de vivre comme d'habitude : votre sage-femme ou votre médecin, à chaque consultation ou en dehors.
- L'entretien prénatal précoce, prévu dès le 4e mois, est un bon moment pour en parler.
- Allô Parents Bébé : **0 800 00 34 56** (gratuit, en semaine).
- Si vous avez des pensées de vous faire du mal ou de ne plus être là, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de danger immédiat, appelez le **15** ou le **112**.

Vous n'avez pas à traverser cela seule. Cet article vous informe et ne remplace pas l'accompagnement d'un professionnel de santé.`,
    journeys: ['pregnant'],
    category: 'sante-mentale',
    tags: ['humeur', 'anxiété', 'dépression', 'santé mentale', '3114'],
    safety_critical: true,
    sources: [S.ameliPsy, S.ameliAidePsy],
    status: 'to_review',
  },

];
