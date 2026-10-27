/** Compléments du guide (27/10/2026) : sujets manquants repérés en testant l'assistant local. Rédigés avec l'aide d'une IA à partir de pages officielles lues ce jour, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
const S = {
  ameliSaign1: { label: 'ameli.fr — Saignements gynécologiques du premier trimestre de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/saignements-gynecologiques-grossesse/saignements-gynecologiques-du-premier-trimestre-de-la-grossesse', consulted_on: C, published: '2026-06-24' },
  ameliSaign23: { label: 'ameli.fr — Saignements gynécologiques lors du 2e et du 3e trimestre de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/saignements-gynecologiques-grossesse/saignements-lors-du-deuxieme-et-du-troisieme-trimestre-de-la-grossesse', consulted_on: C, published: '2026-06-24' },
} satisfies Record<string, ArticleSource>;

export const GUIDE_EXTRA: LibArticle[] = [
  {
    slug: 'saignements-pendant-la-grossesse',
    title: 'Saignements pendant la grossesse : que faire, quand c’est urgent',
    summary: 'Des saignements vaginaux pendant la grossesse demandent toujours un avis : rapidement au 1er trimestre, en urgence ensuite.',
    journeys: ['pregnant'],
    category: 'sante-grossesse',
    tags: ['saignement', 'saignements', 'sang', 'saigner', 'perte de sang', 'grossesse', 'urgence', 'placenta', 'fausse couche'],
    safety_critical: true,
    status: 'to_review',
    sources: [S.ameliSaign1, S.ameliSaign23],
    body_md: `## En bref
- Au **1er trimestre**, des saignements sont fréquents : selon l’Assurance Maladie, environ une femme enceinte sur quatre en a, et la grossesse se poursuit dans la grande majorité des cas. Ils demandent quand même un avis rapide.
- À partir du **2e trimestre**, tout saignement vaginal est considéré comme anormal : il nécessite un bilan **en urgence**.
- **Appelez le 15 (ou le 112)** ou allez aux urgences en cas de saignement abondant, de malaise, de douleurs fortes ou de fièvre.
- Si vous êtes de groupe **Rhésus négatif**, signalez-le : une injection de gammaglobulines anti-D peut être nécessaire.

## Comprendre
**Au premier trimestre.** Les saignements peuvent survenir alors que la grossesse évolue normalement ; parfois, aucune cause n’est retrouvée. Ils peuvent aussi être le signe d’une **fausse couche** (perte de la grossesse avant la 22e semaine), d’une **grossesse extra-utérine** — l’œuf s’est implanté hors de l’utérus, le plus souvent dans une trompe, ce qui est une urgence — ou, de façon exceptionnelle, d’une môle hydatiforme. Seul un examen permet de faire la différence.

**Aux deuxième et troisième trimestres.** L’Assurance Maladie rappelle qu’à ce stade, il n’existe pas de saignement considéré comme bénin. Les deux causes principales sont :
- le **placenta prævia** : le placenta est inséré trop bas et recouvre en partie ou totalement l’orifice du col. Les saignements sont plutôt abondants, de sang rouge, et peuvent se répéter, parfois avec des contractions sans douleur ;
- l’**hématome rétroplacentaire** : une poche de sang décolle le placenta de la paroi de l’utérus. Les saignements sont souvent peu abondants et noirâtres, avec une douleur brutale et permanente du ventre, qui devient dur, et parfois un malaise ou des palpitations. Il peut compliquer une pré-éclampsie.

## Au quotidien
- **Notez** l’heure de début, l’abondance (quelques gouttes, une serviette qui se remplit…), la couleur, et ce qui accompagne le saignement (douleurs, contractions, fièvre, malaise).
- **Au 1er trimestre**, sans signe de gravité, prenez **rapidement** rendez-vous avec votre médecin, votre gynécologue ou votre sage-femme. Le plus souvent, un examen, une échographie et une prise de sang (dosage de l’hormone de grossesse) permettent de faire le point ; une nouvelle échographie est parfois proposée une à deux semaines plus tard.
- **À partir du 2e trimestre**, n’attendez pas : rendez-vous **immédiatement** à la maternité qui vous suit ou appelez les urgences. Une hospitalisation et une surveillance du bébé (échographie, rythme cardiaque) sont en général nécessaires.
- Gardez à portée de main votre carte de groupe sanguin et votre dossier de grossesse.
- Évitez de conduire vous-même si vous saignez abondamment ou vous sentez mal : faites-vous accompagner ou appelez le 15.

## Questions fréquentes
**J’ai eu quelques gouttes de sang au début de la grossesse : est-ce grave ?**
Ce n’est pas forcément grave : ces saignements sont fréquents et la grossesse se poursuit le plus souvent. Mais seul un professionnel peut vérifier, notamment pour écarter une grossesse extra-utérine. Consultez rapidement.

**Je saigne au 6e mois, mais je n’ai pas mal. Puis-je attendre le prochain rendez-vous ?**
Non. Après le premier trimestre, tout saignement doit être évalué en urgence, même sans douleur : le placenta prævia, par exemple, peut saigner sans faire mal.

**Pourquoi me parle-t-on de mon groupe sanguin ?**
Si vous êtes Rhésus négatif, une injection de gammaglobulines anti-D peut être proposée lors de saignements, pour protéger les grossesses suivantes et le bébé. Signalez-le à l’équipe.

**Que se passe-t-il si la grossesse s’est arrêtée ?**
L’équipe vous explique les options (attendre, traitement par médicament ou geste par aspiration) et en discute avec vous. Vous n’êtes pas seule : demandez aussi un soutien si vous en ressentez le besoin.

## Quand demander conseil
**Appelez le 15 ou le 112, ou allez aux urgences tout de suite** si :
- le saignement est abondant, ou s’accompagne d’un malaise, de palpitations ou d’une sensation d’évanouissement ;
- vous avez des douleurs fortes du bas-ventre, d’un côté, ou un ventre dur et douloureux en permanence ;
- vous avez de la fièvre ;
- vous êtes au 2e ou au 3e trimestre, quel que soit le saignement.

Dans les autres cas au 1er trimestre, prenez rendez-vous **rapidement** avec votre médecin, votre gynécologue ou votre sage-femme. En cas de détresse après une perte de grossesse, le **3114** répond 24 h/24.

Cet article vous informe ; il ne remplace pas l’avis de la sage-femme ou du médecin qui vous suit.`,
  },
];
