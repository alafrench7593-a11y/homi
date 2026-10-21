/**
 * Recette conservée de l'ancien catalogue : sa photo a été fournie par l'utilisatrice (voir photoCredits.ts).
 * Toutes les autres recettes viennent du nouveau catalogue (src/content/recipes/v2).
 */
import { i, R } from '@/lib/recipes/build';

const S = ['spf_diversification'];
const NO_SALT = 'Sans sel ni sucre ajoutés.';
const PORTION = 'Les quantités sont indicatives : suivez l’appétit de votre enfant et les conseils de son médecin.';
const FREEZE = 'Réfrigérateur : 48 h dans un pot fermé. Congélateur : 1 mois en portions (bacs à glaçons) ; décongeler au réfrigérateur, réchauffer une seule fois et vérifier la température.';

export const PHOTO_RECIPES = [
  R({
    slug: 'puree-carotte-pomme-de-terre', title: 'Purée carotte et pomme de terre', summary: 'Le grand classique des premières purées : douce, orange et rassurante.',
    audiences: ['baby'], stages: ['m6_8', 'm9_12', 'm12_18'], minMonths: 6, maxMonths: 18, meals: ['lunch', 'dinner'], textures: ['smooth', 'mashed'], servings: 4, servingLabel: 'portions bébé', prepMin: 10, cookMin: 20,
    ingredients: [i('carrot', 200, 'g', 'environ 2 carottes'), i('potato', 150, 'g', '1 pomme de terre moyenne'), i('rapeseed_oil', 2, 'cc')],
    steps: [
      'Lavez et épluchez les carottes et la pomme de terre, puis coupez-les en morceaux réguliers.',
      'Faites cuire les légumes 20 minutes à la vapeur, jusqu’à ce qu’ils s’écrasent facilement à la fourchette.',
      'Mixez finement pour une purée lisse, ou écrasez à la fourchette pour une texture écrasée, selon ce que votre bébé accepte.',
      'Ajoutez une demi-cuillère à café d’huile de colza par portion au moment de servir.',
    ],
    allergens: [], tags: ['puree', 'vegetables', 'budget', 'freezer', 'batch', 'family', 'classic'],
    adaptations: ['Pour la famille : la même purée, salée à part après avoir servi le bébé.', 'Plus tard, ajoutez 10 g de poulet ou de poisson blanc cuit à cœur, mixé.'],
    storage: FREEZE, freezing: 'Se congèle très bien : 1 mois en portions (bacs à glaçons) ; décongeler au réfrigérateur, réchauffer une seule fois.', precautions: [NO_SALT, PORTION], nutrition: 'Carotte et pomme de terre : un mélange doux et nourrissant pour découvrir les légumes ; le lait reste l’aliment principal la première année.',
    budget: 1, seasons: 'all', temperature: 'hot', sources: S,
  }),
];
