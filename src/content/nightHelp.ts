/** Aide pour la nuit : repères généraux par âge, routines apaisantes, questions à préparer. Brouillon IA, statut « À vérifier ». */
import type { ArticleSource } from './articles/library';

export interface NightAgeBand { key: string; fromMonths: number; toMonths: number; title: string; points: string[]; sources: string[] /* keys of NIGHT_SOURCES */ }

const C = '2026-10-20';

/** Pages réellement consultées le 2026-10-20. */
export const NIGHT_SOURCES: Record<string, ArticleSource> = {
  santeSommeilNormal: { label: 'Santé.fr — Sommeil normal du bébé : de la naissance à 3 ans', url: 'https://www.sante.fr/sommeil-normal-du-bebe-de-la-naissance-3-ans', consulted_on: C, published: '2019-07-01' },
  santeVeilleSommeil: { label: 'Santé.fr — Rythme veille-sommeil, quand va-t-il « faire ses nuits » ?', url: 'https://www.sante.fr/rythme-veille-sommeil-quand-va-t-il-faire-ses-nuits', consulted_on: C, published: '2026-08-31' },
  santeRythmeTetees: { label: 'Santé.fr — Rythme des tétées', url: 'https://www.sante.fr/rythme-des-tetees', consulted_on: C, published: '2025-12-11' },
  santePleurs: { label: 'Santé.fr — Pleurs de mon enfant, les comprendre et les calmer', url: 'https://www.sante.fr/pleurs-de-mon-enfant-les-comprendre-et-les-calmer', consulted_on: C, published: '2026-08-31' },
  mpediaTroublesSommeil: { label: 'mpedia.fr (AFPA) — Endormissement difficile, réveils et troubles du sommeil', url: 'https://www.mpedia.fr/art-troubles-sommeil-mois-ans/', consulted_on: C, published: '2023-01-13' },
  ameliSommeilEnfant: { label: 'ameli.fr — Sommeil de l’enfant : ses étapes, sa durée et ses troubles', url: 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/sommeil-enfant-importance-troubles-etapes', consulted_on: C, published: '2026-03-12' },
  ameliEcrans: { label: 'ameli.fr — Comment adapter l’usage des écrans à l’âge de l’enfant ?', url: 'https://www.ameli.fr/assure/sante/themes/ecrans-enfance-adolescence/usage-ecran-age', consulted_on: C, published: '2025-07-17' },
  ameliCoucher: { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2024-10-10' },
  mpediaCoucher: { label: 'mpedia.fr (AFPA) — Coucher mon bébé', url: 'https://www.mpedia.fr/art-coucher-mon-bebe/', consulted_on: C, published: '2023-07-17' },
  ameliFievre: { label: 'ameli.fr — Votre enfant a de la fièvre : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2024-09-03' },
  mpediaFievre: { label: 'mpedia.fr (AFPA) — Fièvre bébé et enfant : que faire et quand consulter ?', url: 'https://www.mpedia.fr/art-fievre-enfant/', consulted_on: C, published: '2023-09-19' },
  santeBronchiolite: { label: 'Santé.fr — Bronchiolite du bébé : symptômes et traitement', url: 'https://www.sante.fr/bronchiolite-du-bebe-symptomes-et-traitement', consulted_on: C, published: '2025-12-30' },
  ameliSecoue: { label: 'ameli.fr — Syndrome du bébé secoué', url: 'https://www.ameli.fr/assure/sante/urgence/bebe-enfant/syndrome-bebe-secoue', consulted_on: C, published: '2026-06-17' },
  ameliAidePsy: { label: 'ameli.fr — Anxiété, baby-blues, dépression : comment être aidée pendant et après sa grossesse ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-sante-psychique/anxiete-baby-blues-depression-etre-aidee-pendant-et-apres-sa-grossesse', consulted_on: C, published: '2026-06-23' },
};

/** Repères moyens : chaque enfant a son propre rythme. Aucun de ces repères n'est un objectif à atteindre. */
export const NIGHT_BANDS: NightAgeBand[] = [
  {
    key: '0-3m',
    fromMonths: 0,
    toMonths: 3,
    title: 'De 0 à 3 mois',
    points: [
      'Un nouveau-né dort en moyenne 16 à 17 heures par 24 heures, par périodes de 3 à 4 heures, sans faire encore la différence entre le jour et la nuit.',
      'Se réveiller toutes les 2 à 4 heures est habituel à cet âge : ce rythme dépend de la maturation de son cerveau, pas de ce que vous faites.',
      'Au démarrage de l’allaitement, 8 à 12 tétées par 24 heures, nuit comprise, sont fréquentes ; les tétées de nuit aident souvent à entretenir la lactation.',
      'À cet âge, suivre son rythme et le prendre dans les bras quand il pleure est conseillé.',
      'Les pleurs du soir sont souvent plus intenses vers 6 à 8 semaines, puis s’atténuent vers la fin du troisième mois.',
      'Le jour : lumière et bruits habituels. La nuit : peu de lumière, voix basse, gestes calmes, recoucher rapidement.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'santeRythmeTetees', 'santePleurs'],
  },
  {
    key: '3-6m',
    fromMonths: 3,
    toMonths: 6,
    title: 'De 3 à 6 mois',
    points: [
      'Le besoin de sommeil reste important, autour de 16 à 17 heures par 24 heures en moyenne avant 6 mois.',
      'Les cycles de sommeil durent environ 50 à 60 minutes ; un bref éveil entre deux cycles est normal, et beaucoup de bébés se rendorment seuls.',
      'En moyenne, les nuits commencent à s’allonger entre 4 et 6 mois, mais chaque bébé a son rythme, et certains mettent plus de temps.',
      'Un biberon plus copieux le soir ne prolonge pas le sommeil et peut favoriser les régurgitations.',
      'Vers 6 mois, beaucoup de bébés font environ trois siestes par jour.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil'],
  },
  {
    key: '6-12m',
    fromMonths: 6,
    toMonths: 12,
    title: 'De 6 à 12 mois',
    points: [
      'Vers 1 an, le sommeil représente en moyenne 13 à 14 heures par 24 heures, dont environ 12 heures la nuit, avec deux siestes.',
      'Les réveils entre deux cycles restent normaux ; ce qui peut devenir difficile, c’est de se rendormir seul.',
      'Après 6 mois, les professionnels suggèrent souvent de laisser au bébé une chance de se rendormir, de le rassurer puis de le recoucher, sans proposer systématiquement le sein ou le biberon, et sans le laisser pleurer longtemps sans réponse.',
      'À partir de 9 mois environ, une étape de développement (marcher) ou un changement de vie (nouveau mode de garde, déménagement) peut perturber les nuits pour un temps.',
      'Un rituel calme et un objet rassurant (doudou adapté à son âge) peuvent aider au moment du coucher.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'mpediaTroublesSommeil'],
  },
  {
    key: '12-24m',
    fromMonths: 12,
    toMonths: 24,
    title: 'De 12 à 24 mois',
    points: [
      'Le besoin de sommeil diminue peu à peu : environ 13 à 14 heures par 24 heures vers 1 an.',
      'La sieste du matin disparaît souvent vers 18 mois ; une sieste en début d’après-midi reste habituelle.',
      'Se réveiller la nuit à chaque changement de cycle est normal ; l’angoisse de séparation ou un changement de vie peuvent rendre l’endormissement plus difficile.',
      'Une chambre sombre, éventuellement une petite veilleuse, et l’absence d’écran dans la chambre favorisent l’endormissement.',
      'Les écrans sont déconseillés avant 3 ans, et à arrêter 1 à 2 heures avant le coucher à tout âge.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliEcrans'],
  },
  {
    key: '24-36m',
    fromMonths: 24,
    toMonths: 36,
    title: 'De 2 à 3 ans',
    points: [
      'Vers 3 ans, le sommeil représente en moyenne 12 à 13 heures par 24 heures, avec une sieste d’environ 2 heures en début d’après-midi.',
      'Des réveils en milieu de nuit restent fréquents ; souvent, l’enfant se rendort seul.',
      'Cauchemar (plutôt en fin de nuit) : l’enfant se réveille effrayé, le rassurer l’aide à se rendormir.',
      'Terreur nocturne (plutôt en début de nuit) : il crie ou s’agite sans être vraiment réveillé ; restez près de lui sans le réveiller.',
      'Il n’existe pas de médicament du sommeil adapté aux jeunes enfants ; si les difficultés durent, le médecin ou le pédiatre peut aider à réorganiser les rythmes.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliSommeilEnfant'],
  },
];

/** Idées de routines du soir, non médicales. À adapter librement : la régularité compte plus que le contenu. */
export const SOOTHING_ROUTINES: { title: string; steps: string[] }[] = [
  {
    title: 'Le même ordre chaque soir',
    steps: [
      'Choisir trois ou quatre étapes simples et les garder dans le même ordre.',
      'Par exemple : toilette, pyjama, histoire, câlin, lit.',
      'Annoncer la suite d’une voix douce : « Après l’histoire, c’est le dodo ».',
      'Garder à peu près la même heure, sans viser la perfection.',
    ],
  },
  {
    title: 'Baisser la lumière',
    steps: [
      'Tamiser les lumières de la pièce un moment avant le coucher.',
      'Éteindre la télévision et ranger les écrans.',
      'Garder une petite veilleuse si cela rassure l’enfant.',
    ],
  },
  {
    title: 'Un bain tiède et calme',
    steps: [
      'Un bain tiède, sans jeux trop excitants, si votre enfant l’apprécie.',
      'Vérifier la température de l’eau avec le coude avant de l’installer.',
      'Ne jamais laisser un enfant seul dans le bain, même un instant.',
      'Enchaîner sur le pyjama dans une pièce chaude et tamisée.',
    ],
  },
  {
    title: 'Berceuse ou musique douce',
    steps: [
      'Chanter toujours la même berceuse, ou passer une musique douce à faible volume.',
      'Bercer doucement dans les bras si votre bébé aime cela.',
      'Coucher ensuite bébé sur le dos dans son lit.',
    ],
  },
  {
    title: 'Le temps de l’histoire',
    steps: [
      'Lire une ou deux histoires courtes, toujours au même endroit.',
      'Laisser l’enfant choisir le livre parmi deux propositions.',
      'Terminer par un mot ou un geste rituel (« Bonne nuit, à demain »).',
    ],
  },
  {
    title: 'Pour vous aussi',
    steps: [
      'Si vous sentez la tension monter, posez bébé en sécurité dans son lit et prenez quelques minutes pour respirer.',
      'Se relayer avec un autre adulte quand c’est possible.',
      'Il n’existe pas de soirée parfaite : certains soirs seront plus difficiles, et c’est normal.',
    ],
  },
];

/** Rappels de couchage sûr (ameli.fr, mpedia.fr). */
export const SAFE_SLEEP: string[] = [
  'Couchez bébé sur le dos, à plat, pour la nuit et pour chaque sieste ; ni sur le ventre, ni sur le côté.',
  'Faites-le dormir dans son propre lit, dans la chambre des parents, idéalement jusqu’à environ 6 mois ; le partage du lit parental est déconseillé.',
  'Un matelas ferme, aux dimensions du lit, sans espace sur les côtés ; ne rajoutez pas de matelas dans un lit parapluie.',
  'Pas de couette, couverture, oreiller, tour de lit ni grosse peluche : préférez une turbulette (gigoteuse) adaptée à sa taille.',
  'Rien qui puisse couvrir son visage ou entourer son cou (pas de collier, ni de cordon de tétine).',
  'Pas de cale-bébé, coussin ou serviette roulée pour le maintenir dans une position.',
  'Une chambre entre 18 et 20 °C, aérée chaque jour ; évitez de trop le couvrir : sa nuque ne doit pas être moite.',
  'Aucune fumée de tabac autour de bébé, ni dans la chambre, ni dans la voiture.',
  'Ne vous endormez jamais avec bébé sur un canapé ou dans un fauteuil.',
  'Si vous êtes très fatigué(e) ou sous un médicament qui rend somnolent, recouchez bébé dans son lit avant de vous endormir.',
  'Le siège-coque est fait pour la voiture : il ne remplace pas le lit.',
  'Ne donnez jamais de médicament pour faire dormir un bébé, et ne le secouez jamais.',
];

/** Questions neutres à préparer pour un rendez-vous (médecin, pédiatre, PMI, sage-femme). */
export const QUESTIONS_FOR_PRO: string[] = [
  'Combien de réveils par nuit sont habituels à son âge ?',
  'Combien d’heures de sommeil par 24 heures sont habituelles à son âge, siestes comprises ?',
  'Les tétées ou biberons de nuit sont-ils encore utiles pour lui ou pour elle ?',
  'Comment savoir s’il ou elle mange assez ? Pouvez-vous vérifier sa courbe de poids ?',
  'Comment l’aider à distinguer le jour et la nuit ?',
  'Que faire quand il ou elle pleure au moment de s’endormir ?',
  'Ses ronflements, sa respiration ou ses mouvements pendant le sommeil sont-ils habituels ?',
  'Son couchage actuel (lit, turbulette, température de la chambre) est-il adapté ?',
  'À partir de quand et comment envisager qu’il ou elle dorme dans sa propre chambre ?',
  'Quels signes doivent me faire appeler la nuit, et qui appeler ?',
  'Je suis très fatigué(e) : quelles aides existent pour nous, parents ?',
];

/** Situations où il ne faut pas attendre le matin. Sources : ameli.fr, mpedia.fr, Santé.fr. */
export const SEEK_HELP_NOW: string[] = [
  'Bébé de moins de 3 mois avec de la fièvre (38 °C ou plus) : consultez en urgence, sans attendre, même s’il semble aller bien.',
  'Difficultés à respirer : respiration rapide ou irrégulière, pauses respiratoires, battements des ailes du nez, creux entre les côtes, lèvres bleues : appelez le 15.',
  'Bébé inhabituellement somnolent, mou, qui réagit peu, ou qui fait un malaise : appelez le 15.',
  'Refus total de boire (sein ou biberon), ou signes de déshydratation : appelez le 15 ou consultez en urgence.',
  'Petites taches rouges sur la peau qui ne s’effacent pas quand on appuie dessus, ou pâleur marquée : appelez le 15.',
  'Convulsions ou mouvements anormaux : protégez l’enfant, placez-le sur le côté, et appelez le 15.',
  'Fièvre au-dessus de 40 °C, ou fièvre avec raideur de la nuque, vomissements répétés ou maux de tête importants : consultez en urgence.',
  'Pleurs inhabituels, geignements, ou tout comportement qui vous paraît anormal ou inquiétant : en cas de doute, appelez le 15.',
  'Bébé qui ne respire plus : appelez immédiatement le 15 ou le 112, et ne le secouez pas.',
  'Si vous sentez que vous pourriez secouer ou faire du mal à votre bébé : posez-le sur le dos dans son lit, quittez la pièce, et appelez le 119 (24 h/24) ou un proche.',
  'Si vous avez des pensées de vous faire du mal ou de ne plus être là : appelez le 3114 (gratuit, 24 h/24).',
];

export const NIGHT_STATUS = 'to_review' as const;
