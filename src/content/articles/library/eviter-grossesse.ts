/** Articles « Éviter une grossesse » de la bibliothèque. */
import { S } from './sources';
import type { LibArticle } from './types';

export const eviterGrossesse: LibArticle[] = [
  // ───────────────────────────── Éviter une grossesse ─────────────────────────────
  {
    slug: 'contraception-methodes-efficacite',
    title: 'Méthodes de contraception : comparer leur efficacité',
    summary: 'Dans la vraie vie, l’efficacité d’une contraception dépend surtout de sa facilité d’usage : les méthodes sans geste quotidien sont les plus fiables.',
    body_md: `Il n'existe pas de contraception idéale pour tout le monde. Le bon choix dépend de votre santé, de votre vie, de vos préférences et de vos projets, et il peut évoluer avec le temps. Comprendre comment se mesure l'efficacité aide à en parler avec un professionnel.

## En bref
- On distingue l'efficacité théorique (usage parfait) et l'efficacité pratique (vie courante, avec les oublis).
- Les méthodes de longue durée, implant et stérilet, sont les plus efficaces en usage courant.
- Les méthodes qui demandent un geste régulier (pilule, préservatif) sont plus sensibles aux oublis et aux erreurs.
- Seuls les préservatifs protègent contre les infections sexuellement transmissibles (IST).
- Changer de méthode est toujours possible si celle que vous utilisez ne vous convient plus.

## Comprendre
### Deux chiffres à connaître
- **Efficacité théorique** : ce que donne la méthode quand elle est utilisée parfaitement, à chaque fois.
- **Efficacité pratique** : ce qui se passe dans la vie courante, avec les oublis, les retards, les erreurs d'utilisation.

Plus l'écart entre les deux est grand, plus la méthode demande de la régularité. C'est souvent l'efficacité pratique qui compte le plus pour choisir.

### Pourcentage de grossesses sur un an en usage courant
D'après le tableau publié par l'Assurance Maladie :
- implant : 0,05 % ;
- stérilet (DIU) hormonal : 0,2 % ; DIU au cuivre : 0,8 % ;
- pilule (combinée ou progestative) : 8 % ;
- préservatif masculin : 15 % ;
- méthodes naturelles : environ 20 % ;
- spermicides seuls : 29 %.

Les méthodes de longue durée ont un écart très faible entre théorie et pratique, car elles ne dépendent pas d'un geste quotidien.

### Les grandes familles
- **Hormonales** : pilule, patch, anneau vaginal, implant, injection, stérilet hormonal. Elles agissent notamment en bloquant l'ovulation ou en modifiant la glaire cervicale, selon les méthodes.
- **Non hormonales** : stérilet au cuivre, préservatifs (masculin et féminin), diaphragme et cape.
- **Méthodes naturelles** : observation du cycle, retrait. Elles sont parmi les moins fiables.
- **Définitives** : stérilisation, chez la femme ou chez l'homme, après un temps de réflexion.

## Au quotidien
### Les questions à se poser
- Ai-je du mal à penser à un geste chaque jour ?
- Ai-je des contre-indications (tabac, antécédents, migraines, traitements) ? Votre professionnel les vérifiera.
- Est-ce que je souhaite une méthode sans hormones ?
- Ai-je un projet de grossesse dans les mois qui viennent ?
- Ai-je besoin aussi d'une protection contre les IST ?

### Combiner les protections
Les préservatifs peuvent être associés à une autre contraception : on parle de « double protection », utile notamment avec un nouveau partenaire.

### Et en cas d'oubli ou d'accident
Si un oubli ou un incident (préservatif qui glisse ou se déchire) survient, la contraception d'urgence est d'autant plus efficace qu'elle est prise tôt. Votre pharmacien peut vous conseiller sans rendez-vous.

## Questions fréquentes
**Le stérilet est-il réservé aux femmes qui ont eu des enfants ?**
Non, il peut être proposé à toutes, après avis médical.

**La pilule fait-elle grossir ?**
Les effets varient d'une personne à l'autre. Si une méthode vous gêne, parlez-en : d'autres options existent.

**Les applications de cycle sont-elles une contraception ?**
Utilisées seules, elles sont peu fiables, car l'ovulation peut se décaler (voir l'article dédié).

**Qui peut prescrire une contraception ?**
Votre médecin traitant, un ou une gynécologue, une sage-femme, ou un centre de santé sexuelle.

## Quand demander conseil
- Pour choisir ou changer de méthode : votre médecin, une sage-femme ou un centre de santé sexuelle (accueil confidentiel).
- Le numéro **0 800 08 11 11** (gratuit et anonyme) répond aux questions sur la contraception et la sexualité.
- Après un rapport non protégé : la contraception d'urgence, sans ordonnance en pharmacie.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception', 'efficacité', 'implant', 'stérilet', 'pilule', 'préservatif'],
    sources: [S.ameliEfficacite, S.ameliHormonale, S.santeRapportRisque],
    status: 'to_review',
  },
  {
    slug: 'calendrier-pas-une-contraception-fiable',
    title: 'Pourquoi un calendrier seul n’est pas une contraception fiable',
    summary: 'Aucun jour du cycle ne peut être garanti sans possibilité de grossesse : l’ovulation peut se décaler et les spermatozoïdes survivent plusieurs jours.',
    body_md: `Les applications et calendriers de cycle peuvent aider à connaître son corps, à anticiper ses règles ou à noter ses symptômes. Mais utilisés seuls pour éviter une grossesse, ils sont parmi les méthodes les moins fiables. Voici pourquoi, et quelles alternatives existent.

## En bref
- L'ovulation peut se décaler d'un cycle à l'autre, même quand les cycles sont habituellement réguliers.
- Les spermatozoïdes peuvent survivre jusqu'à 5 jours : un rapport plusieurs jours avant l'ovulation peut aboutir à une grossesse.
- La méthode du calendrier a un taux d'échec de 15 à 25 % sur un an, selon Santé publique France.
- Aucune application ne peut garantir un jour « sans grossesse possible ».
- Des méthodes sans hormones plus fiables existent : un professionnel peut vous aider à choisir.

## Comprendre
### Pourquoi ce n'est pas fiable
- **L'ovulation varie** : elle n'a pas toujours lieu au même moment, même chez une personne aux cycles habituellement réguliers. Le stress, la fatigue ou un sommeil perturbé peuvent la décaler.
- **Les spermatozoïdes survivent** jusqu'à 5 jours dans les voies génitales féminines. Un rapport plusieurs jours avant l'ovulation peut donc aboutir à une grossesse.
- Un calendrier se base sur les cycles passés : il ne peut pas prévoir un décalage.

C'est pourquoi **aucun jour du cycle ne peut être présenté comme sans possibilité de grossesse**.

### Quelques chiffres
- Selon QuestionSexualité (Santé publique France), la méthode du calendrier a un taux d'échec de 15 à 25 % sur un an.
- L'Assurance Maladie estime à environ 20 % l'échec des méthodes naturelles en usage courant, contre moins de 1 % pour un stérilet ou un implant.
- Les méthodes naturelles sont déconseillées en cas de cycles irréguliers et ne protègent pas des IST.

### Et les autres méthodes d'observation ?
Certaines méthodes combinent plusieurs signes : glaire cervicale, température du matin, calcul des jours. Elles demandent une formation, un long apprentissage et une grande rigueur au quotidien, et restent moins efficaces que les méthodes médicales. Le retrait, lui aussi, est peu fiable.

## Au quotidien
### Utiliser son calendrier autrement
Votre calendrier reste utile pour :
- anticiper l'arrivée des règles ;
- repérer des cycles qui changent, des douleurs ou des saignements inhabituels ;
- préparer une consultation avec des informations précises ;
- penser à sa contraception (rappel de pilule, renouvellement).

### Si vous souhaitez une méthode sans hormones
D'autres options existent, comme le **stérilet au cuivre**, très efficace et de longue durée, ou les **préservatifs**, qui protègent aussi des IST. Un médecin, une sage-femme ou un centre de santé sexuelle peut vous aider à choisir ce qui vous convient.

### Après un rapport à risque
Si vous ne souhaitez pas de grossesse, la **contraception d'urgence** est d'autant plus efficace qu'elle est prise tôt. Elle est disponible en pharmacie sans ordonnance, et votre pharmacien peut vous conseiller sans rendez-vous.

## Questions fréquentes
**Mes cycles sont très réguliers : le calendrier suffit-il ?**
Même avec des cycles réguliers, l'ovulation peut se décaler un mois donné (stress, fatigue, maladie, voyage). Le calendrier ne peut pas le prévoir.

**Pendant les règles, peut-on tomber enceinte ?**
C'est moins probable, mais pas impossible, surtout avec des cycles courts : les spermatozoïdes peuvent survivre jusqu'à l'ovulation suivante.

**Mon application indique « jours non fertiles » : puis-je m'y fier ?**
Ce sont des estimations. Elles ne remplacent pas une contraception.

**Puis-je combiner calendrier et préservatif ?**
Utiliser un préservatif à chaque rapport protège, quel que soit le jour. Le calendrier seul ne suffit pas.

## Quand demander conseil
- Pour choisir une contraception adaptée, avec ou sans hormones : médecin, sage-femme, centre de santé sexuelle, ou le **0 800 08 11 11** (gratuit et anonyme).
- Après un rapport non protégé : pharmacie, sans ordonnance, le plus tôt possible.
- Retard de règles après un rapport à risque : faites un test de grossesse.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception', 'calendrier', 'méthodes naturelles', 'application de cycle'],
    sources: [S.qsNaturelles, S.ameliNaturelles, S.ameliEfficacite],
    status: 'to_review',
  },
  {
    slug: 'oubli-de-pilule-que-faire',
    title: 'Oubli de pilule : que faire ?',
    summary: 'Ce qu’il faut faire dépend du type de pilule, de la durée de l’oubli et des rapports récents ; votre pharmacien peut vous aider à tout moment.',
    body_md: `Oublier un comprimé arrive à beaucoup de personnes. L'important est de savoir quoi faire rapidement, sans paniquer, et de ne pas hésiter à demander conseil.

## En bref
- Les délais diffèrent selon le type de pilule : la notice de votre pilule fait foi.
- Oubli court : prenez le comprimé tout de suite, puis continuez à l'heure habituelle.
- Oubli plus long : prenez le dernier comprimé oublié, protégez-vous 7 jours, et pensez à la contraception d'urgence en cas de rapport récent.
- Plusieurs oublis ou un doute : demandez conseil rapidement à votre pharmacien ou à votre médecin.
- Si les oublis sont fréquents, une autre méthode peut être plus adaptée.

## Comprendre
### Pourquoi un oubli compte
La pilule agit grâce à une prise régulière d'hormones. Un oubli fait baisser leur quantité dans le corps : selon la durée et le moment dans la plaquette, la protection peut être diminuée. C'est pourquoi la conduite à tenir dépend de votre pilule et du nombre d'heures écoulées.

### Vérifiez d'abord votre type de pilule
Les délais diffèrent selon la pilule. D'après l'Assurance Maladie, un oubli est « court » s'il dure moins de **12 heures** pour une pilule combinée et moins de **3 heures** pour certaines pilules microprogestatives. La notice de votre pilule fait foi : relisez-la.

## Au quotidien
### Oubli court
Prenez le comprimé oublié tout de suite, puis continuez à l'heure habituelle. La contraception reste efficace.

### Oubli plus long
- Prenez immédiatement le dernier comprimé oublié, puis continuez normalement, même si cela fait deux comprimés le même jour.
- **Rapport non protégé dans les 5 jours précédant l'oubli** : une contraception d'urgence est recommandée, avec un préservatif jusqu'aux règles suivantes.
- **Pas de rapport dans ces 5 jours** : utilisez un préservatif pendant 7 jours.
- Si l'oubli concerne l'un des 7 derniers comprimés actifs, enchaînez directement sur la plaquette suivante, sans pause.

### Plusieurs comprimés oubliés, ou un doute
Demandez conseil rapidement à votre pharmacien ou à votre médecin. En cas de doute, un test de grossesse peut être fait 21 jours après l'oubli.

### Patch et anneau
Ils ont leurs propres règles (par exemple 3 heures pour un anneau expulsé). Consultez la notice et votre pharmacien.

### Pour limiter les oublis
- Prenez la pilule à heure fixe, associée à un geste quotidien (brossage des dents, réveil).
- Activez une alarme ou un rappel : votre calendrier peut vous le proposer.
- Gardez une plaquette de secours dans votre sac en cas de déplacement.
- Pensez au décalage horaire en voyage : demandez conseil avant de partir.

Si les oublis sont fréquents, ce n'est pas un échec personnel : une méthode qui ne dépend pas d'un geste quotidien (implant, stérilet) peut être discutée avec un professionnel.

## Questions fréquentes
**J'ai pris deux comprimés le même jour : est-ce un problème ?**
C'est justement ce qui est conseillé quand on rattrape un oubli : prendre le comprimé oublié, puis le suivant à l'heure habituelle.

**J'ai vomi peu après ma pilule : est-ce un oubli ?**
Des vomissements ou une diarrhée importante peu après la prise peuvent diminuer l'efficacité, comme un oubli. Consultez la notice et demandez conseil à votre pharmacien.

**Dois-je arrêter la plaquette en cours ?**
Non, continuez-la normalement, sauf avis différent de votre professionnel.

**Quand faire un test de grossesse ?**
En cas de doute, un test peut être fait 21 jours après l'oubli, ou si vos règles n'arrivent pas.

## Quand demander conseil
- Plusieurs comprimés oubliés, oubli en début de plaquette, ou doute sur la conduite à tenir : **votre pharmacien**, sans rendez-vous.
- Rapport non protégé dans les jours précédant l'oubli : la contraception d'urgence, le plus tôt possible.
- Le numéro **0 800 08 11 11** (gratuit et anonyme) répond aussi à vos questions.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas la notice de votre pilule ni l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['pilule', 'oubli', 'contraception d’urgence', 'préservatif'],
    sources: [S.ameliHormonale, S.ameliCuReflexes],
    status: 'to_review',
  },
  {
    slug: 'contraception-urgence-ou-et-quand',
    title: 'Contraception d’urgence : où et quand ?',
    summary: 'Après un rapport non protégé, la contraception d’urgence est d’autant plus efficace qu’elle est prise tôt ; elle est disponible en pharmacie sans ordonnance.',
    body_md: `Après un rapport non protégé, un oubli de contraception ou un préservatif qui a glissé ou s'est déchiré, la contraception d'urgence permet de réduire la probabilité d'une grossesse. Elle n'interrompt pas une grossesse déjà commencée. Agir vite est ce qui compte le plus.

## En bref
- Plus elle est prise tôt après le rapport, plus elle est efficace.
- La pilule d'urgence est disponible en pharmacie sans ordonnance ; le pharmacien vous précisera les modalités.
- Selon la pilule, elle peut être prise jusqu'à 3 jours ou jusqu'à 5 jours après le rapport.
- Le stérilet au cuivre, posé dans les 5 jours, est la méthode la plus efficace.
- Elle ne protège pas des IST : un dépistage peut être utile, et pour le VIH il faut consulter sans dépasser 48 heures.

## Comprendre
### Comment elle agit
La contraception d'urgence agit principalement en retardant ou en empêchant l'ovulation, pour éviter une fécondation. Elle n'agit pas sur une grossesse déjà installée. Elle ne remplace pas une contraception régulière et ne protège pas des rapports suivants.

### Les options
- **Pilule d'urgence au lévonorgestrel** : jusqu'à 3 jours après le rapport.
- **Pilule d'urgence à l'ulipristal acétate** : jusqu'à 5 jours après le rapport.
- **Stérilet au cuivre** : posé dans les 5 jours par un médecin ou une sage-femme, c'est la méthode la plus efficace selon l'Assurance Maladie. Il peut ensuite servir de contraception régulière.

Dans tous les cas, **plus c'est tôt, mieux c'est**. Aucune méthode n'est efficace à 100 %.

## Au quotidien
### Où l'obtenir
- En pharmacie, **sans ordonnance**. L'Assurance Maladie indique qu'elle y est délivrée gratuitement ; le pharmacien vous précisera les modalités.
- Pour les mineures : de façon anonyme, en pharmacie ou auprès de l'infirmière scolaire.
- Dans un centre de santé sexuelle.

### Après la prise
- Utilisez un préservatif à chaque rapport jusqu'aux règles suivantes.
- En cas de vomissement dans les 3 heures, demandez conseil : une nouvelle prise peut être nécessaire.
- Les règles peuvent être un peu avancées ou retardées. **Si elles ont plus de 5 jours de retard, faites un test de grossesse.**
- Certains médicaments peuvent diminuer son efficacité : signalez vos traitements au pharmacien.

### Et les IST ?
La contraception d'urgence ne protège pas des IST. Après un rapport à risque, un dépistage est possible ; pour le VIH, consultez sans dépasser 48 heures, car un traitement préventif peut être proposé.

### Et ensuite ?
C'est souvent l'occasion de faire le point sur sa contraception habituelle. Un médecin, une sage-femme ou un centre de santé sexuelle peut vous aider à trouver une méthode qui vous convient mieux, si besoin.

## Questions fréquentes
**Puis-je l'avoir d'avance, « au cas où » ?**
Oui, il est possible de la demander en pharmacie pour l'avoir chez soi ; parlez-en avec votre pharmacien.

**Peut-on la prendre plusieurs fois ?**
Elle peut être reprise si un nouvel accident survient, mais elle ne remplace pas une contraception régulière. Si les accidents se répètent, parlez-en à un professionnel.

**J'allaite : est-ce possible ?**
Demandez conseil à votre pharmacien ou à votre médecin, qui vous indiquera la méthode adaptée.

**Elle a des effets secondaires ?**
Des nausées, des douleurs du bas-ventre ou des saignements légers peuvent survenir. Si les symptômes sont importants ou durent, consultez.

**Dois-je prévenir quelqu'un ?**
Non. Pour les mineures, elle est délivrée de façon anonyme.

## Quand demander conseil
- Le plus tôt possible après le rapport : pharmacie, centre de santé sexuelle, médecin ou sage-femme.
- Règles avec plus de 5 jours de retard : faites un test de grossesse.
- Rapport à risque d'IST : consultez pour un dépistage, et dans les 48 heures pour le VIH.
- **Urgence (15 ou 112)** : douleur intense du bas-ventre, malaise, saignement abondant.

Numéro d'information : **0 800 08 11 11** (gratuit, anonyme).

Cet article informe et ne remplace pas l'avis d'un pharmacien, d'un médecin ou d'une sage-femme.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception d’urgence', 'pilule du lendemain', 'stérilet au cuivre', 'pharmacie'],
    safety_critical: true,
    sources: [S.ameliCu, S.ameliCuReflexes, S.santeRapportRisque],
    status: 'to_review',
  },

];
