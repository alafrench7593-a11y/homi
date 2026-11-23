/** Articles « Sommeil des parents » de la bibliothèque. */
import { S } from './sources';
import type { LibArticle } from './types';

export const sommeilParents: LibArticle[] = [
  // ───────────────────────────── Sommeil des parents ─────────────────────────────
  {
    slug: 'fatigue-des-parents',
    title: 'La fatigue des parents : fréquente, mais pas à porter seul',
    summary: 'Les nuits hachées des premiers mois épuisent : d’où vient cette fatigue, ce qui peut vraiment l’alléger, les précautions de sécurité avec bébé et les signes qui doivent faire demander de l’aide.',
    body_md: `Avec un bébé, le sommeil change du tout au tout. Les nuits sont découpées, les journées chargées, et la fatigue peut s'installer sans que l'on s'en rende compte. Se sentir épuisé est extrêmement fréquent : cela ne dit rien de tes capacités de parent, ni de ton amour pour ton enfant. Cette fatigue mérite simplement d'être prise au sérieux.

## En bref
- La fatigue des premiers mois est très fréquente, chez les mères comme chez les pères ou co-parents.
- Les réveils nocturnes sont une étape temporaire, dont la durée varie selon chaque bébé.
- Se reposer quand bébé dort, accepter l'aide et répartir les tâches allègent réellement.
- **Ne t’endors jamais avec bébé sur un canapé ou un fauteuil.**
- Une fatigue qui ne passe pas, une tristesse ou une anxiété persistantes méritent d'en parler à un professionnel.

## Comprendre
**Pour la mère**, la grossesse et l'accouchement — qu'il ait été rapide ou long, par voie basse ou par césarienne — demandent déjà une récupération. S'y ajoutent les tétées ou biberons de nuit, et parfois des douleurs.

**Pour les deux parents**, les nuits fractionnées empêchent d'enchaîner de longues périodes de sommeil. Même si le total d'heures dormies semble correct, un sommeil haché est moins réparateur. Les nouvelles responsabilités, la charge mentale, parfois d'autres enfants, le retour au travail ou des soucis matériels pèsent aussi.

**Une phase qui évolue** : les nouveau-nés se réveillent souvent pour se nourrir, de jour comme de nuit. En grandissant, ils dorment par périodes plus longues, à un rythme qui varie beaucoup d'un enfant à l'autre. Comparer avec le bébé d'une amie ou d'un forum ajoute souvent de la pression inutile.

## Au quotidien
**Ce qui peut alléger**
- Dormir ou te reposer quand bébé dort, quand c'est possible, même sans t’endormir.
- Accepter l'aide de tes proches de façon concrète : préparer un repas, garder bébé le temps d'une sieste, faire une lessive, s'occuper des courses.
- Répartir les tâches de nuit et de jour entre les adultes, et en reparler quand l'organisation ne fonctionne plus.
- Sortir marcher un peu chaque jour avec bébé : la lumière du jour et une activité douce peuvent réduire la sensation de fatigue.
- Baisser tes exigences : la maison peut attendre, les invitations aussi.
- Manger régulièrement et boire de l'eau : quand on est épuisé, on s'oublie facilement.

**En sécurité avec bébé**
- Quand on est très fatigué, le risque de s'endormir avec bébé dans les bras augmente. Si tu sens le sommeil venir, recouche-le dans son lit, sur le dos.
- Ne t’endors jamais avec bébé sur un canapé ou dans un fauteuil.
- Si la fatigue te rend irritable ou à bout face aux pleurs, pose bébé en sécurité dans son lit, sors de la pièce quelques minutes et appelle quelqu'un. Ne secoue jamais un bébé.
- Évite de conduire quand tu es très somnolent(e).

## Questions fréquentes
**Combien de temps dure cette fatigue ?**
Elle diminue en général à mesure que les nuits de bébé s'allongent et que tu trouves ton organisation, mais il n'y a pas de calendrier précis. Si elle ne s'améliore pas malgré le repos, parles-en à ton médecin.

**Le co-parent peut-il aider si j'allaite ?**
Oui : changer la couche, apporter bébé, le recoucher, s'occuper des soins du matin ou des aînés permet à la mère de se rendormir plus vite.

**Je n'arrive pas à dormir même quand bébé dort. Que faire ?**
C'est un signe à prendre au sérieux : il peut traduire de l'anxiété ou un épuisement. Parles-en à ton médecin ou à ta sage-femme.

**Demander de l'aide, est-ce un aveu d'échec ?**
Non. Élever un enfant n'a jamais été prévu pour se faire seul. Demander un relais, c'est prendre soin de toute la famille.

## Quand demander conseil
Parles-en à ton médecin, à ta sage-femme ou à la PMI si :
- tu es à bout, ou la fatigue persiste plusieurs semaines malgré le repos ;
- tu n'arrives plus à dormir même quand bébé dort ;
- tu te sens triste, sans espoir, anxieux(se) en permanence ou dépassé(e) ;
- la fatigue s'accompagne de fièvre, de douleurs, de saignements importants ou d'autres signes inhabituels.

Si tu as des pensées de te faire du mal, appelle le **3114** (24 h/24, gratuit). En cas d'urgence, appelle le **15** ou le **112**.

Cet article te donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['fatigue', 'parents', 'nuits', 'aide'],
    sources: [S.nhsFatigueParents, S.ameliRetourMaison, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'se-relayer-la-nuit',
    title: 'Se relayer la nuit',
    summary: 'Partager les réveils nocturnes, même autrement que par le biberon, permet à chacun de récupérer un vrai bloc de sommeil : plusieurs organisations possibles, des gestes calmes pour la nuit et des conseils pour en parler à deux.',
    body_md: `Quand les nuits sont courtes, s'organiser à deux — ou avec un proche — peut tout changer. L'idée n'est pas de compter qui se lève le plus, mais de permettre à chacun de dormir d'une traite au moins une partie de la nuit. Il n'y a pas d'organisation idéale : la meilleure est celle qui convient à ta famille, et elle peut évoluer au fil des semaines.

## En bref
- Un bloc de sommeil plus long, même pour un seul adulte à la fois, est plus réparateur que des nuits hachées pour tous les deux.
- Plusieurs façons de se répartir : par plages horaires, par nuits, ou en partageant les gestes autour de la tétée.
- Pendant ton tour : lumière tamisée, voix basse, gestes calmes, et bébé recouché sur le dos dans son propre lit.
- Seul(e) avec bébé ? Un proche ou la PMI peuvent aider à trouver des relais.
- Une organisation qui ne fonctionne plus se discute à tête reposée, hors de la nuit.

## Comprendre
Le sommeil se répare mieux par périodes longues. Si les deux adultes se réveillent à chaque pleur, personne ne récupère vraiment. Se répartir permet à l'un de dormir pendant que l'autre est « de garde », puis d'inverser.

Les besoins de chacun ne sont pas forcément les mêmes : la mère récupère parfois d'un accouchement, l'un des parents peut travailler tôt le matin, un autre a besoin de dormir en début de nuit. Une répartition juste tient compte de ces réalités plutôt que d'un partage strictement égal.

## Au quotidien
**Quelques façons de se répartir**
- **Par plages horaires** : l'un gère le début de nuit, l'autre la fin, pour que chacun ait un bloc de sommeil plus long.
- **Par nuits** : une nuit sur deux, quand c'est possible, l'un dort dans une autre pièce avec des bouchons d'oreilles.
- **Avec un allaitement** : le ou la partenaire peut changer la couche, apporter bébé, le recoucher ou s'occuper des soins du matin pour que la mère se rendorme vite. Une fois l'allaitement bien installé, un biberon de lait maternel tiré peut parfois être donné par l'autre parent.
- **Avec des biberons** : les tétées peuvent être partagées entre les adultes.
- **Le week-end** : chacun peut s'offrir une grasse matinée à tour de rôle.

**Pendant ton tour**
- Lumière tamisée, voix basse, gestes calmes : la nuit reste la nuit, cela aide bébé à se rendormir.
- Prépare à l'avance ce dont tu auras besoin : couches, change, biberon ou tire-lait, eau pour toi.
- Recouche toujours bébé sur le dos, dans son propre lit.
- Si tu es sous un médicament qui rend somnolent ou très épuisé(e), ne garde pas bébé dans ton lit.
- Ne t’endors pas avec bébé sur un canapé ou un fauteuil.

**Si tu es seul(e)** : demande à un proche de venir quelques jours, ou de garder bébé le temps d'une sieste. La PMI peut aussi t’orienter vers des aides, par exemple une aide à domicile.

Dans HOMI, les relais de nuit permettent de noter qui se lève quand, pour que chacun s'y retrouve.

## Questions fréquentes
**Comment se rendormir après son tour ?**
Évite les écrans, garde la lumière basse, et ne regarde pas l'heure trop souvent. Si le sommeil ne revient pas, se reposer allongé(e) reste utile.

**Et si bébé ne veut que l'un de nous deux ?**
C'est fréquent. Le parent « préféré » peut commencer, puis passer le relais. Avec le temps, l'autre parent trouve aussi ses gestes.

**Notre organisation crée des tensions.**
C'est fréquent quand tout le monde est fatigué. Prends un moment calme, en journée, pour dire ce qui pèse à chacun et ajuster.

## Quand demander conseil
Parles-en à ton médecin, à ta sage-femme ou à la PMI si la fatigue devient trop lourde, si l'un de vous n'arrive plus à dormir même quand c'est son tour de repos, ou si le moral baisse durablement.

Si tu te sens à bout face aux pleurs, pose bébé en sécurité dans son lit, sors de la pièce et appelle quelqu'un. En cas d'urgence, appelle le 15 ou le 112 ; en cas d'idées noires, le 3114.

Cet article te donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['nuits', 'relais', 'couple', 'organisation'],
    sources: [S.nhsFatigueParents, S.ameliCoucher, S.santeVeilleSommeil],
    status: 'to_review',
  },
  {
    slug: 'siestes-des-parents',
    title: 'Les siestes des parents',
    summary: 'Une sieste, même courte, prise quand bébé dort aide à récupérer : quand la faire, combien de temps, comment mieux se reposer et les précautions pour rester en sécurité avec bébé.',
    body_md: `Dormir la nuit d'une traite n'est pas toujours possible avec un bébé. Les siestes en journée permettent de rattraper un peu du sommeil perdu et de tenir plus sereinement. Beaucoup de parents hésitent à s'arrêter alors qu'il « reste tant à faire » : pourtant, se reposer est une façon concrète de prendre soin de ta famille.

## En bref
- Le moment le plus simple : **quand bébé dort**.
- L'Assurance Maladie cite des siestes courtes, de 5 à 20 minutes en début d'après-midi, comme une aide contre la fatigue ; après une nuit très hachée, une sieste plus longue peut être nécessaire.
- Une pièce calme et peu lumineuse, le téléphone de côté : le repos est plus efficace.
- Avant de t’allonger, couche bébé sur le dos dans son lit.
- **Ne fais jamais la sieste avec bébé sur un canapé ou dans un fauteuil.**

## Comprendre
Quand les nuits sont découpées, le corps accumule une « dette » de sommeil. Une sieste ne remplace pas une bonne nuit, mais elle réduit la somnolence, améliore la vigilance et l'humeur, et aide à faire face aux journées.

Une sieste courte a l'avantage de ne pas plonger dans un sommeil trop profond : on se réveille plus facilement, sans se sentir « dans le brouillard ». Une sieste plus longue peut être utile après une nuit très difficile ; si elle t’empêche ensuite de dormir le soir, essaie de la placer plus tôt dans l'après-midi.

Même sans t’endormir, t’allonger les yeux fermés quelques minutes est déjà un repos.

## Au quotidien
**Quand faire la sieste**
- Quand bébé dort, même si la tentation de « faire autre chose » est grande : le linge et la vaisselle peuvent attendre.
- Si tu as peur de ne pas te réveiller, mets une alarme.
- Demande à un proche de garder bébé pour une sieste plus longue de temps en temps.
- À deux, vous pouvez vous relayer : l'un se repose pendant que l'autre s'occupe de bébé ou des aînés.

**Pour mieux se reposer**
- Une pièce calme, peu lumineuse ; un masque ou des bouchons d'oreilles si besoin, en restant capable d'entendre bébé ou en confiant la surveillance à un autre adulte.
- Évite la caféine en fin de journée si elle t’empêche ensuite de dormir.
- Laisse le téléphone de côté : faire défiler des écrans retarde l'endormissement.
- Ne culpabilise pas de dormir en journée.

**En sécurité avec bébé**
- Avant de t’allonger, couche bébé sur le dos dans son propre lit, sans oreiller, couverture ni tour de lit.
- Ne fais jamais la sieste avec bébé sur un canapé ou dans un fauteuil.
- Ne garde pas bébé dans ton lit si tu es très fatigué(e) ou sous un médicament qui rend somnolent.
- Si tu donnes le sein ou le biberon allongé(e) et sens le sommeil venir, recouche bébé dans son lit avant de t’endormir.

## Questions fréquentes
**Je n'arrive pas à m'endormir en journée, ça sert à quelque chose ?**
Oui : rester allongé(e) au calme repose déjà. Si l'impossibilité de dormir persiste même quand tu en as l'occasion, parles-en à ton médecin.

**Je me sens plus fatigué(e) après une longue sieste.**
C'est fréquent quand on se réveille en plein sommeil profond. Essaie une sieste plus courte, avec une alarme.

**Et si j'ai d'autres enfants ?**
Profite d'un moment calme commun (sieste ou temps calme des aînés), ou demande un relais à un proche quelques après-midis par semaine.

## Quand demander conseil
Parles-en à ton médecin si :
- tu n'arrives pas à dormir même quand bébé dort ;
- la fatigue persiste malgré le repos ou toi empêche de faire tes activités habituelles ;
- tu t’endors sans le vouloir, par exemple en conduisant ou en donnant à manger à bébé ;
- tu te sens triste, anxieux(se) ou dépassé(e) depuis plus de deux semaines.

En cas d'idées noires, appelle le 3114 ; en cas d'urgence, le 15 ou le 112.

Cet article te donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['sieste', 'fatigue', 'récupération', 'sécurité'],
    sources: [S.ameliAsthenie, S.ameliRetourMaison, S.nhsFatigueParents, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'fatigue-parent-quand-consulter',
    title: 'Quand la fatigue doit faire consulter',
    summary: 'Une fatigue qui ne passe pas avec le repos, l’impossibilité de dormir, une tristesse ou une anxiété persistantes méritent d’en parler : les signes à repérer, l’épuisement parental, la dépression du post-partum et les numéros à appeler sans attendre.',
    body_md: `Être fatigué avec un jeune enfant est fréquent. Mais certaines fatigues ne sont pas « juste » de la fatigue : elles peuvent signaler un problème de santé, une dépression du post-partum ou un épuisement parental. Les repérer tôt permet d'être aidé(e) plus vite. Ces difficultés peuvent toucher les mères comme les pères et co-parents, et elles se prennent en charge.

## En bref
- Une fatigue qui persiste malgré le repos, ou qui t’empêche de vivre normalement, mérite un avis médical.
- Tristesse, perte d'intérêt, anxiété permanente plus de deux semaines : parles-en, une dépression du post-partum se soigne.
- L'épuisement parental n'est pas un manque d'amour ; des relais et des professionnels peuvent aider.
- Idées de te faire du mal : **3114**, 24 h/24, gratuit.
- Agitation intense, absence totale de sommeil, propos confus après une naissance : **15**.

## Comprendre
**La fatigue physique** peut avoir des causes médicales qui se recherchent simplement : une anémie après l'accouchement, un problème de thyroïde, une infection, entre autres. Seul un professionnel peut faire le point.

**Le baby blues** touche beaucoup de mères dans les jours qui suivent la naissance : larmes, émotivité, fatigue. Il passe en général en quelques jours. S'il s'intensifie ou dure plus de deux semaines, il peut s'agir d'une **dépression du post-partum**, qui peut apparaître plus tard, dans les mois suivant la naissance, chez les mères comme chez les pères.

**L'épuisement parental** associe souvent trois signes : une fatigue extrême que le repos ne soulage plus, une impression de s'occuper des enfants « en pilote automatique », et une perte de plaisir à être parent. Il survient quand les exigences dépassent durablement les ressources disponibles. Ce n'est ni une faiblesse ni un manque d'amour.

## Au quotidien
- Note ce que tu ressens sur quelques jours : sommeil, moral, appétit, énergie. Ces notes aident à en parler en consultation.
- Dis à au moins une personne de confiance comment tu vas vraiment.
- Accepte les relais : co-parent, proches, et aides possibles (aide à domicile via la CAF par exemple ; la PMI peut t’orienter).
- Réduis ce qui peut l'être : tâches non urgentes, sollicitations, visites.
- Prépare la consultation : depuis quand, ce qui a changé, ce qui t’inquiète le plus.

Dans HOMI, le suivi de ton humeur et de ton sommeil peut t’aider à repérer une évolution et à en parler.

## Questions fréquentes
**Comment savoir si c'est « juste » de la fatigue ?**
La fatigue liée aux nuits courtes s'améliore quand tu peux dormir. Si elle persiste malgré le repos, ou s'accompagne de tristesse, d'anxiété ou d'autres signes physiques, parles-en.

**Les pères peuvent-ils être concernés ?**
Oui. La dépression du post-partum et l'épuisement parental peuvent toucher tous les parents.

**Qui consulter ?**
Ton médecin traitant, ta sage-femme, la PMI ou un psychologue. Ils peuvent t’écouter, rechercher une cause et proposer un accompagnement adapté.

**J'ai honte de ce que je ressens.**
Beaucoup de parents traversent ces moments sans oser le dire. En parler est un premier pas pour aller mieux.

## Quand demander conseil
Parles-en à ton médecin si :
- la fatigue persiste plusieurs semaines malgré le repos ;
- elle t’empêche de faire tes activités habituelles ;
- tu n'arrives pas à dormir, même quand bébé dort ;
- elle s'accompagne d'autres signes : fièvre, perte ou prise de poids non voulue, douleurs, règles très abondantes, soif importante ;
- tristesse, perte d'intérêt, sentiment de désespoir, anxiété permanente ou irritabilité durent plus de deux semaines.

**Sans attendre :**
- Pensées de te faire du mal ou de ne plus être là : appelle le **3114** (24 h/24, gratuit).
- Agitation intense, absence totale de sommeil, propos confus ou impression de perdre le contact avec la réalité après une naissance : appelle le **15** (ou le 112).
- Si tu sens que tu pourrais faire du mal à ton enfant : mets-le en sécurité et appelle le **119**.

Demander de l'aide, c'est prendre soin de toute la famille. Cet article t’informe ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['parents_sleep'],
    category: 'sante-mentale',
    tags: ['fatigue', 'épuisement parental', 'dépression post-partum', '3114', 'quand consulter'],
    safety_critical: true,
    sources: [S.ameliAsthenie, S.nhsFatigueParents, S.santeSanteMentaleParents, S.santeBurnout, S.ameliSecoue],
    status: 'to_review',
  },
];
