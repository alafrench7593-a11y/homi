/**
 * « Repas et recettes » adaptés au profil affiché. Idées simples (pas de menu imposé, pas de calcul de portions)
 * et repères tirés de sources publiques françaises, vérifiées le 19 octobre 2026 :
 *  - Listériose : https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter (25/04/2025)
 *  - Toxoplasmose : https://www.sante.fr/la-toxoplasmose-enceinte-comment-leviter (13/02/2025)
 *  - Diversification : Santé publique France, « Pas à pas, votre enfant mange comme un grand »
 *    https://www.mangerbouger.fr/content/show/1500/file/Brochure-SPF-Mangerbougerfr.pdf
 * Ce ne sont pas des conseils médicaux personnalisés : un allergique, un prématuré ou un régime particulier
 * se voit avec un professionnel de santé.
 */
export interface MealSource { label: string; url: string }
export interface MealIdea { title: string; detail: string }
export interface MealSection { id: string; title: string; rules?: string[]; ideas: MealIdea[]; sources: MealSource[] }

const LISTERIA: MealSource = { label: 'Santé.fr — Listériose pendant la grossesse', url: 'https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter' };
const TOXO: MealSource = { label: 'Santé.fr — La toxoplasmose enceinte, comment l’éviter ?', url: 'https://www.sante.fr/la-toxoplasmose-enceinte-comment-leviter' };
const DIVERSIF: MealSource = { label: 'Santé publique France — Pas à pas, votre enfant mange comme un grand', url: 'https://www.mangerbouger.fr/content/show/1500/file/Brochure-SPF-Mangerbougerfr.pdf' };
const MB: MealSource = { label: 'Manger Bouger (Santé publique France)', url: 'https://www.mangerbouger.fr' };

export const PREGNANCY_MEALS: MealSection = {
  id: 'pregnancy',
  title: 'Repas pendant la grossesse',
  rules: [
    'Évitez les fromages non pasteurisés (y compris râpés) et retirez la croûte des fromages.',
    'Évitez la charcuterie artisanale (rillettes, pâtés, foie gras, produits en gelée), la viande, le poisson et les coquillages crus, et les graines germées.',
    'Cuisez bien la viande, fraîche ou surgelée (67 °C à cœur selon Santé.fr) ; l’agneau, le porc et le gibier sont les plus à risque pour la toxoplasmose.',
    'Lavez soigneusement les fruits, les légumes crus (même les salades prêtes à manger) et les herbes aromatiques.',
    'Séparez les aliments crus et cuits, lavez-vous les mains et les ustensiles, réchauffez les restes et mangez-les aussitôt.',
    'Réfrigérateur à environ 4 °C, nettoyé souvent ; respectez les dates limites de consommation.',
  ],
  ideas: [
    { title: 'Poulet bien cuit, riz et courgettes', detail: 'Viande cuite à cœur, légumes lavés puis cuits.' },
    { title: 'Dahl de lentilles corail et carottes', detail: 'Un plat végétarien simple, servi chaud.' },
    { title: 'Omelette bien cuite et salade lavée', detail: 'Œufs cuits jusqu’à ce que le jaune soit pris.' },
    { title: 'Poisson cuit au four, pommes de terre et haricots verts', detail: 'Poisson bien cuit, jamais cru ni fumé.' },
    { title: 'Pâtes, sauce tomate et fromage pasteurisé', detail: 'Vérifiez la mention « pasteurisé » sur l’étiquette.' },
    { title: 'Yaourt nature, fruit lavé et flocons d’avoine', detail: 'Pour une collation.' },
  ],
  sources: [LISTERIA, TOXO],
};

export interface BabyStage { id: string; from: number; to: number; title: string; textures: string; ideas: MealIdea[] }
/** Étapes par âge (mois), d'après la brochure de Santé publique France. */
export const BABY_STAGES: BabyStage[] = [
  {
    id: 'start', from: 4, to: 6, title: 'Début de la diversification (entre 4 et 6 mois)',
    textures: 'Purées lisses, en petite quantité, à côté du lait.',
    ideas: [
      { title: 'Purée lisse de carotte', detail: 'Cuite à l’eau ou à la vapeur, mixée, sans sel.' },
      { title: 'Purée de courgette et pomme de terre', detail: 'Sans sel ajouté.' },
      { title: 'Compote pomme-poire', detail: 'Fruits cuits sans sucre ajouté.' },
    ],
  },
  {
    id: 'smooth', from: 6, to: 8, title: '6 à 8 mois',
    textures: 'Purées lisses puis moulinées, avec de petits ajouts : pâtes fines, semoule, riz, viande, poisson ou œuf haché.',
    ideas: [
      { title: 'Patate douce et un peu de poulet mixé', detail: 'Viande bien cuite, mixée finement.' },
      { title: 'Purée de lentilles', detail: 'Bien cuites et mixées.' },
      { title: 'Légumes, semoule fine et œuf dur haché', detail: 'Œuf bien cuit.' },
    ],
  },
  {
    id: 'soft', from: 8, to: 10, title: 'À partir de 8 mois',
    textures: 'Petits morceaux très fondants (banane, légumes bien cuits). Deux repas diversifiés par jour.',
    ideas: [
      { title: 'Petits morceaux de courgette et carotte bien cuites', detail: 'Écrasables entre deux doigts.' },
      { title: 'Banane écrasée et yaourt nature', detail: 'Le fruit sucre le yaourt.' },
      { title: 'Pâtes et purée de légumes', detail: 'Pâtes bien cuites.' },
    ],
  },
  {
    id: 'chew', from: 10, to: 36, title: 'À partir de 10 mois',
    textures: 'Aliments à mâcher : aliments cuits, fruits crus, petits morceaux de légumes crus. À partir de 1 an : trois repas et un goûter.',
    ideas: [
      { title: 'Purée de légumes et pommes de terre', detail: 'Exemple cité par la brochure.' },
      { title: 'Purée de lentilles', detail: 'Exemple cité par la brochure.' },
      { title: 'Pâtes à la sauce tomate', detail: 'Exemple cité par la brochure, sans sel ajouté.' },
    ],
  },
];
export const BABY_RULES = [
  'La diversification commence entre 4 et 6 mois ; un bébé prématuré a besoin d’un avis médical d’abord.',
  'Toutes les familles d’aliments peuvent être proposées entre 4 et 6 mois, y compris œuf, arachide, fruits à coque (en poudre, sans sel) et gluten. En cas d’allergies dans la famille, demandez d’abord l’avis de votre médecin ou de la PMI.',
  'Pas de sel ajouté avant 3 ans ; fruits cuits sans sucre ajouté ; évitez jus de fruits, sodas et produits sucrés.',
  'Pas de lait cru ; les boissons végétales ne conviennent pas avant 1 an.',
  'Une seule nouvelle texture à la fois.',
];
export const BABY_SOURCES = [DIVERSIF];

export const CHILD_MEALS: MealSection = {
  id: 'child',
  title: 'Repas adaptés à l’âge',
  rules: ['À partir de 1 an : trois repas et un goûter.', 'Pas de sel ajouté avant 3 ans ; produits sucrés le plus tard possible.', 'L’eau est la seule boisson indispensable.'],
  ideas: [
    { title: 'Riz, poisson cuit et légumes', detail: 'Arêtes retirées.' },
    { title: 'Gratin de légumes et pommes de terre', detail: 'À partager en famille.' },
    { title: 'Pâtes, lentilles et sauce tomate', detail: 'Un plat complet végétarien.' },
    { title: 'Goûter : fruit, pain et produit laitier nature', detail: 'Un exemple simple.' },
  ],
  sources: [DIVERSIF, MB],
};

export const ADULT_MEALS: MealSection = {
  id: 'adult',
  title: 'Idées de repas',
  ideas: [
    { title: 'Légumes de saison, féculent et protéine', detail: 'Une base simple à varier.' },
    { title: 'Soupe de légumes, pain complet et fromage', detail: 'Rapide à préparer à l’avance.' },
    { title: 'Salade composée lavée, œufs et pommes de terre', detail: 'Pour un repas froid.' },
    { title: 'Plat mijoté en grande quantité', detail: 'À congeler en portions pour les jours chargés.' },
  ],
  sources: [MB],
};

/** Étape de diversification selon l'âge en mois (avant 4 mois : lait seulement). */
export function babyStageFor(months: number): BabyStage | null {
  if (months < 4) return null;
  return BABY_STAGES.find((s) => months >= s.from && months < s.to) ?? BABY_STAGES[BABY_STAGES.length - 1];
}
