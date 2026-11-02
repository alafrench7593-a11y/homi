/**
 * « Ses découvertes » : catalogue des aliments de la diversification (rédaction originale de l'application).
 * Repères d'âge : Santé publique France, « Pas à pas, votre enfant mange comme un grand » (tous les groupes d'aliments,
 * allergènes compris, peuvent être proposés à partir de 4 mois, ou plus tard, notamment pour un bébé prématuré ; avis
 * médical en cas d'allergie dans la famille), ANSES (miel), autorités sanitaires (lait cru), Santé publique France
 * (soja et boissons végétales, aliments petits, durs et ronds). Un âge indiqué ici est le plus tôt possible d'après
 * ces sources, jamais une échéance : « À découvrir lorsque son âge et sa situation le permettent ».
 * `ing` relie l'aliment au dictionnaire des recettes (recettes qui utilisent les aliments déjà goûtés).
 */
import type { Allergen } from '@/lib/recipes/types';
import { localized } from '@/i18n/localized';

export type FoodCategory = 'veg' | 'fruit' | 'starch' | 'cereal' | 'legume' | 'meat' | 'fish' | 'egg' | 'dairy' | 'fat' | 'herb' | 'allergen' | 'other';
export const FOOD_CATEGORIES: FoodCategory[] = ['veg', 'fruit', 'starch', 'cereal', 'legume', 'meat', 'fish', 'egg', 'dairy', 'fat', 'herb', 'allergen', 'other'];

export type SourceKey = 'spf' | 'anses_miel' | 'lait_cru' | 'ameli_quincke';
type DiscoverySource = { label: string; url: string; published?: string; consulted: string };
const DISCOVERY_SOURCES_FR: Record<SourceKey, DiscoverySource> = {
  spf: { label: 'Santé publique France — Pas à pas, votre enfant mange comme un grand', url: 'https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/documents/brochure/pas-a-pas-votre-enfant-mange-comme-un-grand', published: '2022-05-24', consulted: '2026-10-22' },
  anses_miel: { label: 'ANSES — Pas de miel pour les enfants de moins d’un an', url: 'https://www.anses.fr/fr/content/pas-de-miel-les-enfants-de-moins-dun-an', published: '2023-10-31', consulted: '2026-10-19' },
  lait_cru: { label: 'Pas de fromages au lait cru avant 5 ans (rappel des autorités sanitaires)', url: 'https://www.larevuedupraticien.fr/article/pas-de-fromages-au-lait-cru-avant-5-ans', published: '2023-07-31', consulted: '2026-10-19' },
  ameli_quincke: { label: 'ameli.fr — Œdème de Quincke : les bons réflexes', url: 'https://www.ameli.fr/assure/sante/urgence/pathologies/oedeme-quincke', published: '2026-03-11', consulted: '2026-10-22' },
};

export interface FoodDef {
  key: string;
  name: string;
  category: FoodCategory;
  /** clé du dictionnaire des recettes */
  ing?: string;
  allergen?: Allergen;
  /** âge le plus tôt d'après les sources (mois) ; 4 par défaut */
  minMonths?: number;
  /** conseil de préparation, court */
  prep: string;
  /** précaution de sécurité (fausse route, cuisson) */
  care?: string;
  source?: SourceKey;
  /** couleur de l'anneau autour de la photo */
  tint: string;
}

const SMOOTH = 'Au début : cuit à l’eau ou à la vapeur, mixé bien lisse, sans sel ni sucre ajouté.';
const ROUND = 'Petit, dur ou rond : à couper en quatre dans la longueur, ou à écraser, jusqu’à 5 ans.';

const F = (key: string, name: string, category: FoodCategory, tint: string, prep: string, o: Partial<FoodDef> = {}): FoodDef => ({ key, name, category, tint, prep, ...o });

const FOODS_FR: FoodDef[] = [
  // ---------------------------------------------------------------- légumes
  F('carrot', 'Carotte', 'veg', '#F08A2B', SMOOTH, { ing: 'carrot', care: 'Crue, elle se râpe très finement.' }),
  F('zucchini', 'Courgette', 'veg', '#7DA548', `${SMOOTH} La peau se retire au début si elle gêne.`, { ing: 'zucchini' }),
  F('green_beans', 'Haricots verts', 'veg', '#5E9E3A', 'Bien cuits puis mixés : choisissez des haricots extra-fins, moins fibreux.', { ing: 'green_beans' }),
  F('pumpkin', 'Potiron', 'veg', '#E07B24', 'Cuit à la vapeur, sa chair devient très douce et facile à écraser.', { ing: 'pumpkin' }),
  F('butternut', 'Courge butternut', 'veg', '#E8A33C', 'Rôtie ou vapeur, elle s’écrase à la fourchette.', { ing: 'butternut' }),
  F('sweet_potato', 'Patate douce', 'veg', '#E8823A', 'Vapeur ou au four, puis écrasée : texture fondante.', { ing: 'sweet_potato' }),
  F('broccoli', 'Brocoli', 'veg', '#3E8E41', 'Les fleurettes bien cuites s’écrasent facilement ; plus tard, de petits bouquets fondants se tiennent à la main.', { ing: 'broccoli' }),
  F('cauliflower', 'Chou-fleur', 'veg', '#E9E2CB', 'Très cuit et mixé, mélangé à une pomme de terre pour l’adoucir.', { ing: 'cauliflower' }),
  F('spinach', 'Épinards', 'veg', '#2F6B2F', 'Hachés et cuits, à mélanger à une purée de pomme de terre.', { ing: 'spinach', care: 'Les épinards cuits se consomment rapidement : ne les gardez pas d’un repas à l’autre à température ambiante.' }),
  F('leek', 'Poireau', 'veg', '#A8C686', 'Le blanc, bien cuit et mixé, est plus doux que le vert.', { ing: 'leek' }),
  F('peas', 'Petits pois', 'veg', '#8CC152', 'Mixés puis passés pour retirer les peaux au début.', { ing: 'peas', care: ROUND }),
  F('beetroot', 'Betterave', 'veg', '#8E1F4A', 'Cuite, mixée avec une pomme de terre : la couleur rose amuse souvent.', { ing: 'beetroot' }),
  F('tomato', 'Tomate', 'veg', '#D9432B', 'Pelée et épépinée, cuite en coulis au début.', { ing: 'tomato', care: 'Tomates cerises : toujours coupées en quatre jusqu’à 5 ans.' }),
  F('eggplant', 'Aubergine', 'veg', '#5C3A6E', 'Cuite longtemps (four ou vapeur), sa chair devient fondante.', { ing: 'eggplant' }),
  F('fennel', 'Fenouil', 'veg', '#D6E3A8', 'Braisé ou vapeur, mixé : goût anisé doux.', { ing: 'fennel' }),
  F('celeriac', 'Céleri-rave', 'veg', '#E4DDC4', 'En purée avec de la pomme de terre.', { ing: 'celeriac', allergen: 'celery' }),
  F('parsnip', 'Panais', 'veg', '#EADBB0', 'Vapeur puis écrasé : saveur légèrement sucrée.', { ing: 'parsnip' }),
  F('turnip', 'Navet', 'veg', '#E8E1EE', 'Choisissez de jeunes navets, plus doux, bien cuits.', { ing: 'turnip' }),
  F('cucumber', 'Concombre', 'veg', '#7FB36A', 'Pelé, épépiné, râpé finement ou en bâtonnets fondants plus tard.', { ing: 'cucumber' }),
  F('bell_pepper', 'Poivron', 'veg', '#D8342A', 'Cuit et pelé, il devient doux et fondant.', { ing: 'bell_pepper' }),
  F('avocado', 'Avocat', 'veg', '#6E9B3C', 'Bien mûr, simplement écrasé : aucune cuisson nécessaire.', { ing: 'avocado' }),
  F('mushroom', 'Champignons', 'veg', '#CDB79E', 'Bien cuits, mixés dans une purée ou une sauce.', { ing: 'mushroom' }),
  F('asparagus', 'Asperges', 'veg', '#7FA650', 'Les pointes, très cuites, s’écrasent facilement.', { ing: 'asparagus' }),
  F('cabbage', 'Chou', 'veg', '#8DB86B', 'Bien cuit, en petite quantité dans une purée.', { ing: 'cabbage' }),
  F('artichoke', 'Artichaut', 'veg', '#94A85C', 'Les cœurs, cuits et mixés.', { ing: 'artichoke' }),
  // ---------------------------------------------------------------- fruits
  F('apple', 'Pomme', 'fruit', '#E5B94E', 'Cuite en compote sans sucre ajouté au début.', { ing: 'apple', care: 'Crue : râpée finement jusqu’à ce qu’il croque bien.' }),
  F('pear', 'Poire', 'fruit', '#D8D27A', 'Bien mûre, crue écrasée ou cuite en compote.', { ing: 'pear' }),
  F('banana', 'Banane', 'fruit', '#F3D86B', 'Bien mûre, simplement écrasée à la fourchette.', { ing: 'banana' }),
  F('peach', 'Pêche', 'fruit', '#F4A26B', 'Pelée, bien mûre, écrasée.', { ing: 'peach' }),
  F('apricot', 'Abricot', 'fruit', '#F0A23A', 'Cuit en compote ou très mûr, pelé et écrasé.', { ing: 'apricot' }),
  F('plum', 'Prune', 'fruit', '#7A3E6B', 'Cuite et passée pour retirer la peau.', { ing: 'plum' }),
  F('mango', 'Mangue', 'fruit', '#F5B335', 'Très mûre, en purée ou en lamelles fondantes plus tard.', { ing: 'mango' }),
  F('melon', 'Melon', 'fruit', '#F2A65A', 'Bien mûr, mixé ou en fines lamelles plus tard.', { ing: 'melon' }),
  F('watermelon', 'Pastèque', 'fruit', '#E5525F', 'Épépinée, mixée ou en bâtonnets fondants plus tard.', { ing: 'watermelon' }),
  F('strawberry', 'Fraise', 'fruit', '#D93A4A', 'Écrasée ou mixée.', { ing: 'strawberry' }),
  F('raspberry', 'Framboise', 'fruit', '#C7354F', 'Mixée puis passée pour retirer les petits grains.', { ing: 'raspberries' }),
  F('blueberry', 'Myrtille', 'fruit', '#4A4E8C', 'Écrasée ou cuite en compote.', { ing: 'blueberries', care: ROUND }),
  F('grape', 'Raisin', 'fruit', '#8E5A9C', 'Épépiné, pelé et écrasé.', { ing: 'grapes', care: 'Grains entiers : toujours coupés en quatre et épépinés jusqu’à 5 ans.' }),
  F('kiwi', 'Kiwi', 'fruit', '#8DB33A', 'Bien mûr, écrasé ; son acidité peut rougir le tour de la bouche.', { ing: 'kiwi' }),
  F('clementine', 'Clémentine', 'fruit', '#F28C28', 'Quartiers pelés à vif et coupés.', { ing: 'clementine' }),
  F('orange', 'Orange', 'fruit', '#F59A23', 'Pelée à vif, en petits morceaux plus tard.', { ing: 'orange' }),
  F('cherry', 'Cerise', 'fruit', '#A51F35', 'Dénoyautée, écrasée.', { ing: 'cherries', care: 'Toujours dénoyautée et coupée jusqu’à 5 ans.' }),
  F('pineapple', 'Ananas', 'fruit', '#F2C94C', 'Bien mûr, mixé ; morceaux fondants plus tard.', { ing: 'pineapple' }),
  F('rhubarb', 'Rhubarbe', 'fruit', '#C94F6D', 'Cuite en compote avec une pomme pour l’adoucir.', { ing: 'rhubarb' }),
  F('date', 'Datte', 'fruit', '#8A5A3B', 'Dénoyautée, trempée puis mixée.', { ing: 'dates', care: 'Fruits secs entiers : collants et durs, à mixer jusqu’à 5 ans.' }),
  // ---------------------------------------------------------------- féculents
  F('potato', 'Pomme de terre', 'starch', '#E8CF8E', 'Vapeur, écrasée avec un peu de lait ou d’huile.', { ing: 'potato' }),
  F('pasta', 'Pâtes', 'starch', '#F0D58C', 'Petites pâtes bien cuites, puis de plus grandes à attraper.', { ing: 'small_pasta', allergen: 'gluten' }),
  F('rice', 'Riz', 'starch', '#F2EEDF', 'Bien cuit, éventuellement mixé avec un légume.', { ing: 'rice' }),
  F('semolina', 'Semoule', 'starch', '#EED9A4', 'Semoule fine, cuite dans le lait ou un bouillon de légumes sans sel.', { ing: 'semolina', allergen: 'gluten' }),
  F('quinoa', 'Quinoa', 'starch', '#E2C990', 'Rincé, bien cuit, mélangé à une purée.', { ing: 'quinoa' }),
  F('polenta', 'Polenta', 'starch', '#F2C64E', 'Cuite crémeuse, puis en bâtonnets moelleux plus tard.', { ing: 'polenta' }),
  F('bulgur', 'Boulgour', 'starch', '#D9B47A', 'Bien cuit, mélangé à des légumes.', { ing: 'bulgur', allergen: 'gluten' }),
  F('gnocchi', 'Gnocchis', 'starch', '#EAD7A0', 'Coupés en morceaux fondants.', { ing: 'gnocchi', allergen: 'gluten' }),
  // ---------------------------------------------------------------- céréales
  F('infant_cereal', 'Céréales infantiles', 'cereal', '#F1DDAA', 'Sans sucre ajouté, délayées dans son lait habituel.', { ing: 'infant_cereal' }),
  F('bread', 'Pain', 'cereal', '#D8A866', 'Plus tard, une croûte ou une mouillette à tenir.', { ing: 'wholemeal_bread', allergen: 'gluten', care: 'Le pain imbibé de salive peut se détacher en gros morceau : surveillez et proposez de petits morceaux.' }),
  F('oats', 'Flocons d’avoine', 'cereal', '#E6CF9C', 'Cuits en porridge dans du lait.', { allergen: 'gluten' }),
  F('buckwheat', 'Sarrasin', 'cereal', '#9A7B5B', 'En galette fine ou en farine dans une bouillie.', { ing: 'buckwheat_flour' }),
  F('corn', 'Maïs', 'cereal', '#F2C83B', 'En polenta ou mixé.', { ing: 'corn', care: 'Grains entiers : à écraser avant 5 ans.' }),
  F('rice_cake', 'Galette de riz', 'cereal', '#F4ECD6', 'Nature, sans sel ajouté, plus tard pour croquer.', { ing: 'rice_cakes' }),
  // ---------------------------------------------------------------- légumineuses
  F('red_lentils', 'Lentilles corail', 'legume', '#E4774C', 'Très bien cuites et mixées lisses (Santé publique France : dès 4 à 6 mois si bien digérées).', { ing: 'red_lentils' }),
  F('green_lentils', 'Lentilles vertes', 'legume', '#6F7A4A', 'Bien cuites et mixées.', { ing: 'green_lentils' }),
  F('chickpeas', 'Pois chiches', 'legume', '#D9B977', 'En purée lisse type houmous, sans sel.', { ing: 'chickpeas', care: 'Entiers : à écraser jusqu’à 5 ans.' }),
  F('white_beans', 'Haricots blancs', 'legume', '#EFE6D2', 'Bien cuits, mixés avec un légume.', { ing: 'white_beans' }),
  F('kidney_beans', 'Haricots rouges', 'legume', '#8E2F2F', 'Bien cuits, rincés, mixés.', { ing: 'kidney_beans' }),
  F('split_peas', 'Pois cassés', 'legume', '#A8B653', 'En velouté bien lisse.', { ing: 'split_peas' }),
  // ---------------------------------------------------------------- viandes
  F('chicken', 'Poulet', 'meat', '#E9C9A6', 'Cuit à cœur, mixé avec le légume ; quantités adaptées à l’âge.', { ing: 'chicken', care: 'Toujours bien cuit à cœur.' }),
  F('turkey', 'Dinde', 'meat', '#E7C3A0', 'Cuite à cœur, mixée ou effilochée.', { ing: 'turkey', care: 'Toujours bien cuite à cœur.' }),
  F('beef', 'Bœuf', 'meat', '#A6453A', 'Cuit à cœur (haché : bien cuit), mixé.', { ing: 'ground_beef', care: 'Viande hachée : toujours bien cuite à cœur.' }),
  F('veal', 'Veau', 'meat', '#D9A58C', 'Mijoté jusqu’à être fondant, mixé.', { ing: 'veal' }),
  F('pork', 'Porc', 'meat', '#E6B3A0', 'Filet maigre cuit à cœur, mixé.', { ing: 'pork_tenderloin', care: 'Toujours bien cuit à cœur.' }),
  F('lamb', 'Agneau', 'meat', '#B5654E', 'Mijoté longtemps, dégraissé, mixé.', { ing: 'lamb' }),
  F('ham', 'Jambon cuit', 'meat', '#F0A9A5', 'Jambon blanc découenné, mixé, en petite quantité (il est salé).', { ing: 'ham' }),
  // ---------------------------------------------------------------- poissons
  F('white_fish', 'Cabillaud', 'fish', '#EDE6DA', 'Cuit à la vapeur, émietté sans arêtes, mixé.', { ing: 'white_fish', allergen: 'fish', care: 'Vérifiez soigneusement l’absence d’arêtes.' }),
  F('salmon', 'Saumon', 'fish', '#F28C6B', 'Cuit à cœur, émietté sans arêtes.', { ing: 'salmon', allergen: 'fish', care: 'Variez les poissons, comme le recommande Santé publique France.' }),
  F('hake', 'Merlu', 'fish', '#E8E0D3', 'Vapeur, émietté sans arêtes.', { ing: 'hake', allergen: 'fish' }),
  F('trout', 'Truite', 'fish', '#E9A28A', 'Cuite à cœur, émiettée sans arêtes.', { ing: 'trout', allergen: 'fish' }),
  F('sardine', 'Sardine', 'fish', '#8A9AA6', 'En conserve, égouttée, écrasée avec ses arêtes molles.', { ing: 'sardines_can', allergen: 'fish' }),
  F('mackerel', 'Maquereau', 'fish', '#6C8296', 'Frais, cuit à cœur, émietté sans arêtes.', { ing: 'mackerel', allergen: 'fish' }),
  // ---------------------------------------------------------------- œufs
  F('egg', 'Œuf', 'egg', '#F6D365', 'Toujours cuit dur (jaune et blanc), écrasé dans une purée.', { ing: 'egg', allergen: 'eggs', care: 'Pas d’œuf cru ni de préparation à base d’œuf peu cuit.' }),
  // ---------------------------------------------------------------- produits laitiers
  F('yogurt', 'Yaourt nature', 'dairy', '#F4F1EA', 'Nature, sans sucre ajouté ; un fruit écrasé peut l’accompagner.', { ing: 'yogurt', allergen: 'milk' }),
  F('fromage_blanc', 'Fromage blanc', 'dairy', '#F5F3EE', 'Nature, au lait pasteurisé.', { ing: 'fromage_blanc', allergen: 'milk' }),
  F('petit_suisse', 'Petit-suisse', 'dairy', '#F3EFE6', 'Nature.', { ing: 'petit_suisse', allergen: 'milk' }),
  F('emmental', 'Emmental', 'dairy', '#F0D88A', 'Râpé et fondu dans une purée.', { ing: 'emmental', allergen: 'milk' }),
  F('comte', 'Comté', 'dairy', '#E8C66E', 'Râpé et fondu dans une purée.', { ing: 'comte', allergen: 'milk' }),
  F('mozzarella', 'Mozzarella', 'dairy', '#F7F4EE', 'Au lait pasteurisé, en petits dés fondus.', { ing: 'mozzarella', allergen: 'milk' }),
  F('ricotta', 'Ricotta', 'dairy', '#F6F2E9', 'Au lait pasteurisé, mélangée à un légume.', { ing: 'ricotta', allergen: 'milk' }),
  F('raw_milk_cheese', 'Fromage au lait cru', 'dairy', '#E3C98F', 'À éviter chez le jeune enfant : préférez les fromages au lait pasteurisé et les fromages à pâte pressée cuite.', { minMonths: 60, allergen: 'milk', source: 'lait_cru' }),
  // ---------------------------------------------------------------- matières grasses
  F('rapeseed_oil', 'Huile de colza', 'fat', '#E9C84A', 'Une cuillère à café dans la purée (Santé publique France).', { ing: 'rapeseed_oil' }),
  F('olive_oil', 'Huile d’olive', 'fat', '#B8B04A', 'Une cuillère à café dans la purée, en alternance avec d’autres huiles.'),
  F('walnut_oil', 'Huile de noix', 'fat', '#B98C4E', 'Une cuillère à café, à varier avec le colza.', { allergen: 'nuts' }),
  F('butter', 'Beurre', 'fat', '#F7E3A1', 'Une petite noisette dans la purée.', { ing: 'butter', allergen: 'milk' }),
  F('cream', 'Crème fraîche', 'fat', '#F6F0DE', 'Pasteurisée, une petite cuillère.', { ing: 'cream', allergen: 'milk' }),
  // ---------------------------------------------------------------- herbes et épices
  F('parsley', 'Persil', 'herb', '#3F8F3F', 'Finement ciselé et cuit dans la purée.', { ing: 'parsley' }),
  F('basil', 'Basilic', 'herb', '#4E9A3E', 'Quelques feuilles mixées.', { ing: 'basil' }),
  F('chives', 'Ciboulette', 'herb', '#4E9A3E', 'Ciselée finement.', { ing: 'chives' }),
  F('mint', 'Menthe', 'herb', '#5FAF7A', 'Une feuille mixée avec un fruit.', { ing: 'mint' }),
  F('cumin', 'Cumin', 'herb', '#B3793A', 'Une pincée, pour donner du goût sans sel.', { ing: 'cumin' }),
  F('cinnamon', 'Cannelle', 'herb', '#A0613A', 'Une pincée dans une compote.', { ing: 'cinnamon' }),
  F('vanilla', 'Vanille', 'herb', '#E8D7A8', 'Une gousse infusée dans le lait.', { ing: 'vanilla' }),
  F('turmeric', 'Curcuma', 'herb', '#E3A21A', 'Une pincée dans une purée.', { ing: 'turmeric' }),
  F('thyme', 'Thym', 'herb', '#7C8C55', 'Infusé pendant la cuisson, puis retiré.', { ing: 'thyme' }),
  F('garlic', 'Ail', 'herb', '#F4EBDD', 'Une petite gousse cuite avec les légumes.', { ing: 'garlic' }),
  F('onion', 'Oignon', 'herb', '#E9D8B4', 'Bien cuit, fondu avec les légumes.', { ing: 'onion' }),
  // ---------------------------------------------------------------- allergènes (hors œuf, lait, poisson, gluten classés ailleurs)
  F('peanut', 'Arachide', 'allergen', '#C8925A', 'En poudre ou en purée lisse diluée dans une préparation, sans sel ajouté.', { ing: 'peanut_butter', allergen: 'peanuts', care: 'Jamais de cacahuète entière ni en morceaux avant 5 ans (aliment petit, dur et rond).' }),
  F('almond', 'Amande', 'allergen', '#D8B48A', 'En poudre, une demi-cuillère à café dans une purée ou un laitage (Santé publique France).', { allergen: 'nuts', care: 'Jamais d’amande entière avant 5 ans.' }),
  F('hazelnut', 'Noisette', 'allergen', '#A8754A', 'En poudre, une demi-cuillère à café.', { ing: 'hazelnut_powder', allergen: 'nuts', care: 'Jamais de noisette entière avant 5 ans.' }),
  F('walnut', 'Noix', 'allergen', '#9B7350', 'En poudre fine.', { ing: 'walnuts', allergen: 'nuts', care: 'Jamais de noix entière ni en morceaux avant 5 ans.' }),
  F('sesame', 'Sésame', 'allergen', '#E8D2A2', 'En purée (tahini) diluée dans une préparation.', { ing: 'tahini', allergen: 'sesame' }),
  F('shrimp', 'Crevette', 'allergen', '#F2967A', 'Cuite, finement hachée ou mixée.', { ing: 'shrimp', allergen: 'crustaceans' }),
  F('mussel', 'Moules', 'allergen', '#3E4A5C', 'Bien cuites, hachées finement.', { ing: 'mussels', allergen: 'molluscs' }),
  F('soy', 'Soja', 'allergen', '#E7DFC4', 'Tofu, boisson et desserts au soja : Santé publique France déconseille le lait de soja et les produits à base de soja avant 3 ans.', { ing: 'tofu', allergen: 'soy', minMonths: 36, source: 'spf' }),
  F('mustard', 'Moutarde', 'allergen', '#D9A51E', 'Une pointe dans une sauce, plus tard.', { ing: 'mustard', allergen: 'mustard' }),
  // ---------------------------------------------------------------- autres
  F('honey', 'Miel', 'other', '#E2A52B', 'Jamais avant 1 an (risque de botulisme infantile, ANSES). Ensuite, comme tout produit sucré, le plus tard possible.', { minMonths: 12, source: 'anses_miel' }),
  F('cocoa', 'Cacao', 'other', '#6B3E26', 'Non sucré, une pincée plus tard ; les produits sucrés le plus tard possible.', { ing: 'cocoa' }),
  F('plant_drink', 'Boisson végétale', 'other', '#EFE7D6', 'Ne remplace pas le lait et ne convient pas avant 1 an (Santé publique France).', { ing: 'almond_milk', minMonths: 12, source: 'spf' }),
  F('cow_milk', 'Lait de vache', 'other', '#F8F6F0', 'En petite quantité dans une préparation (purée, laitage) ; le lait maternel ou infantile reste sa boisson lait principale. Demandez conseil au professionnel qui le suit.', { ing: 'milk', allergen: 'milk' }),
  F('olive', 'Olives', 'other', '#3F3A2E', 'Dénoyautées et finement hachées, plus tard (elles sont salées).', { ing: 'olives', care: 'Entières : à couper en quatre jusqu’à 5 ans.' }),
];

const DISCOVERY_SOURCE_LABELS_EN: Record<SourceKey, string> = {
  spf: 'Santé publique France — Pas à pas, votre enfant mange comme un grand (French public health agency leaflet)',
  anses_miel: 'ANSES — No honey for children under one year (French food safety agency)',
  lait_cru: 'No raw-milk cheese before age 5 (reminder from the French health authorities)',
  ameli_quincke: 'ameli.fr — Angioedema: the right reflexes (French national health insurance)',
};
const DISCOVERY_SOURCES_EN = Object.fromEntries(
  (Object.keys(DISCOVERY_SOURCES_FR) as SourceKey[]).map((k) => [k, { ...DISCOVERY_SOURCES_FR[k], label: DISCOVERY_SOURCE_LABELS_EN[k] }]),
) as Record<SourceKey, DiscoverySource>;
export const DISCOVERY_SOURCES = localized(DISCOVERY_SOURCES_FR, DISCOVERY_SOURCES_EN);

const SMOOTH_EN = 'To begin with: cooked in water or steamed, puréed very smooth, with no added salt or sugar.';
const ROUND_EN = 'Small, hard or round: cut into quarters lengthways, or mash, until age 5.';

/** Textes affichés en anglais, par clé d'aliment (même forme que FOODS_FR : seuls name / prep / care changent). */
const FOOD_TEXT_EN: Record<string, { name: string; prep: string; care?: string }> = {
  carrot: { name: 'Carrot', prep: SMOOTH_EN, care: 'Raw, grate it very finely.' },
  zucchini: { name: 'Courgette', prep: `${SMOOTH_EN} Peel it at first if the skin is a problem.` },
  green_beans: { name: 'Green beans', prep: 'Well cooked then puréed: choose extra-fine beans, which are less stringy.' },
  pumpkin: { name: 'Pumpkin', prep: 'Steamed, the flesh becomes very soft and easy to mash.' },
  butternut: { name: 'Butternut squash', prep: 'Roasted or steamed, it mashes with a fork.' },
  sweet_potato: { name: 'Sweet potato', prep: 'Steamed or baked, then mashed: a melting texture.' },
  broccoli: { name: 'Broccoli', prep: 'Well-cooked florets mash easily; later, small soft florets can be held in the hand.' },
  cauliflower: { name: 'Cauliflower', prep: 'Cooked until very soft and puréed, mixed with a potato to mellow it.' },
  spinach: { name: 'Spinach', prep: 'Chopped and cooked, mixed into a potato purée.', care: 'Cooked spinach should be eaten quickly: do not keep it from one meal to the next at room temperature.' },
  leek: { name: 'Leek', prep: 'The white part, well cooked and puréed, is milder than the green.' },
  peas: { name: 'Peas', prep: 'Puréed then sieved to remove the skins at first.', care: ROUND_EN },
  beetroot: { name: 'Beetroot', prep: 'Cooked, puréed with a potato: the pink colour often amuses little ones.' },
  tomato: { name: 'Tomato', prep: 'Peeled and deseeded, cooked into a coulis at first.', care: 'Cherry tomatoes: always cut into quarters until age 5.' },
  eggplant: { name: 'Aubergine', prep: 'Cooked for a long time (oven or steamed), the flesh becomes meltingly soft.' },
  fennel: { name: 'Fennel', prep: 'Braised or steamed, puréed: a mild aniseed taste.' },
  celeriac: { name: 'Celeriac', prep: 'Mashed with potato.' },
  parsnip: { name: 'Parsnip', prep: 'Steamed then mashed: a slightly sweet flavour.' },
  turnip: { name: 'Turnip', prep: 'Choose young turnips, which are milder, and cook them well.' },
  cucumber: { name: 'Cucumber', prep: 'Peeled, deseeded, finely grated or, later, as soft sticks.' },
  bell_pepper: { name: 'Pepper', prep: 'Cooked and peeled, it becomes soft and melting.' },
  avocado: { name: 'Avocado', prep: 'Fully ripe, simply mashed: no cooking needed.' },
  mushroom: { name: 'Mushrooms', prep: 'Well cooked, puréed into a mash or a sauce.' },
  asparagus: { name: 'Asparagus', prep: 'The tips, cooked until very soft, mash easily.' },
  cabbage: { name: 'Cabbage', prep: 'Well cooked, in a small quantity in a purée.' },
  artichoke: { name: 'Artichoke', prep: 'The hearts, cooked and puréed.' },
  apple: { name: 'Apple', prep: 'Cooked as a compote with no added sugar at first.', care: 'Raw: finely grated until they chew well.' },
  pear: { name: 'Pear', prep: 'Very ripe, raw and mashed or cooked as a compote.' },
  banana: { name: 'Banana', prep: 'Very ripe, simply mashed with a fork.' },
  peach: { name: 'Peach', prep: 'Peeled, very ripe, mashed.' },
  apricot: { name: 'Apricot', prep: 'Cooked as a compote, or very ripe, peeled and mashed.' },
  plum: { name: 'Plum', prep: 'Cooked and sieved to remove the skin.' },
  mango: { name: 'Mango', prep: 'Very ripe, puréed or, later, in soft strips.' },
  melon: { name: 'Melon', prep: 'Very ripe, puréed or, later, in thin slices.' },
  watermelon: { name: 'Watermelon', prep: 'Deseeded, puréed or, later, in soft sticks.' },
  strawberry: { name: 'Strawberry', prep: 'Mashed or puréed.' },
  raspberry: { name: 'Raspberry', prep: 'Puréed then sieved to remove the small seeds.' },
  blueberry: { name: 'Blueberry', prep: 'Mashed or cooked as a compote.', care: ROUND_EN },
  grape: { name: 'Grape', prep: 'Deseeded, peeled and mashed.', care: 'Whole grapes: always cut into quarters and deseeded until age 5.' },
  kiwi: { name: 'Kiwi', prep: 'Very ripe, mashed; its acidity can redden the skin around the mouth.' },
  clementine: { name: 'Clementine', prep: 'Segments with the pith and membrane removed, then cut up.' },
  orange: { name: 'Orange', prep: 'Peeled right back to the flesh, in small pieces later.' },
  cherry: { name: 'Cherry', prep: 'Stoned, mashed.', care: 'Always stoned and cut up until age 5.' },
  pineapple: { name: 'Pineapple', prep: 'Very ripe, puréed; soft pieces later.' },
  rhubarb: { name: 'Rhubarb', prep: 'Cooked as a compote with an apple to mellow it.' },
  date: { name: 'Date', prep: 'Stoned, soaked then puréed.', care: 'Whole dried fruit is sticky and hard: purée it until age 5.' },
  potato: { name: 'Potato', prep: 'Steamed, mashed with a little milk or oil.' },
  pasta: { name: 'Pasta', prep: 'Small pasta, well cooked, then larger shapes that are easy to pick up.' },
  rice: { name: 'Rice', prep: 'Well cooked, optionally puréed with a vegetable.' },
  semolina: { name: 'Semolina', prep: 'Fine semolina, cooked in milk or in an unsalted vegetable stock.' },
  quinoa: { name: 'Quinoa', prep: 'Rinsed, well cooked, mixed into a purée.' },
  polenta: { name: 'Polenta', prep: 'Cooked until creamy, then as soft sticks later.' },
  bulgur: { name: 'Bulgur wheat', prep: 'Well cooked, mixed with vegetables.' },
  gnocchi: { name: 'Gnocchi', prep: 'Cut into soft pieces.' },
  infant_cereal: { name: 'Infant cereals', prep: 'With no added sugar, mixed into their usual milk.' },
  bread: { name: 'Bread', prep: 'Later, a crust or a finger of bread to hold.', care: 'Bread soaked in saliva can come away in a large lump: watch them and offer small pieces.' },
  oats: { name: 'Rolled oats', prep: 'Cooked as porridge in milk.' },
  buckwheat: { name: 'Buckwheat', prep: 'As a thin pancake or as flour in a porridge.' },
  corn: { name: 'Sweetcorn', prep: 'As polenta or puréed.', care: 'Whole kernels: mash before age 5.' },
  rice_cake: { name: 'Rice cake', prep: 'Plain, with no added salt, later for chewing on.' },
  red_lentils: { name: 'Red lentils', prep: 'Very well cooked and puréed smooth (Santé publique France: from 4 to 6 months if well tolerated).' },
  green_lentils: { name: 'Green lentils', prep: 'Well cooked and puréed.' },
  chickpeas: { name: 'Chickpeas', prep: 'As a smooth purée like hummus, with no salt.', care: 'Whole: mash until age 5.' },
  white_beans: { name: 'White beans', prep: 'Well cooked, puréed with a vegetable.' },
  kidney_beans: { name: 'Kidney beans', prep: 'Well cooked, rinsed, puréed.' },
  split_peas: { name: 'Split peas', prep: 'As a very smooth soup.' },
  chicken: { name: 'Chicken', prep: 'Cooked right through, puréed with the vegetable; quantities suited to their age.', care: 'Always cooked right through.' },
  turkey: { name: 'Turkey', prep: 'Cooked right through, puréed or shredded.', care: 'Always cooked right through.' },
  beef: { name: 'Beef', prep: 'Cooked right through (mince: well done), puréed.', care: 'Minced meat: always cooked right through.' },
  veal: { name: 'Veal', prep: 'Simmered until tender, puréed.' },
  pork: { name: 'Pork', prep: 'Lean fillet cooked right through, puréed.', care: 'Always cooked right through.' },
  lamb: { name: 'Lamb', prep: 'Simmered for a long time, trimmed of fat, puréed.' },
  ham: { name: 'Cooked ham', prep: 'Rind-free cooked ham, puréed, in a small quantity (it is salty).' },
  white_fish: { name: 'Cod', prep: 'Steamed, flaked with no bones, puréed.', care: 'Check carefully that there are no bones.' },
  salmon: { name: 'Salmon', prep: 'Cooked right through, flaked with no bones.', care: 'Vary the fish, as Santé publique France recommends.' },
  hake: { name: 'Hake', prep: 'Steamed, flaked with no bones.' },
  trout: { name: 'Trout', prep: 'Cooked right through, flaked with no bones.' },
  sardine: { name: 'Sardine', prep: 'Tinned, drained, mashed with its soft bones.' },
  mackerel: { name: 'Mackerel', prep: 'Fresh, cooked right through, flaked with no bones.' },
  egg: { name: 'Egg', prep: 'Always hard-boiled (yolk and white), mashed into a purée.', care: 'No raw egg and no preparation made with lightly cooked egg.' },
  yogurt: { name: 'Plain yoghurt', prep: 'Plain, with no added sugar; a mashed fruit can go with it.' },
  fromage_blanc: { name: 'Fromage blanc', prep: 'Plain, made with pasteurised milk.' },
  petit_suisse: { name: 'Petit-suisse', prep: 'Plain.' },
  emmental: { name: 'Emmental', prep: 'Grated and melted into a purée.' },
  comte: { name: 'Comté', prep: 'Grated and melted into a purée.' },
  mozzarella: { name: 'Mozzarella', prep: 'Made with pasteurised milk, in small melted cubes.' },
  ricotta: { name: 'Ricotta', prep: 'Made with pasteurised milk, mixed with a vegetable.' },
  raw_milk_cheese: { name: 'Raw-milk cheese', prep: 'Best avoided in young children: prefer cheeses made with pasteurised milk and cooked pressed cheeses.' },
  rapeseed_oil: { name: 'Rapeseed oil', prep: 'One teaspoon in the purée (Santé publique France).' },
  olive_oil: { name: 'Olive oil', prep: 'One teaspoon in the purée, alternating with other oils.' },
  walnut_oil: { name: 'Walnut oil', prep: 'One teaspoon, alternating with rapeseed oil.' },
  butter: { name: 'Butter', prep: 'A small knob in the purée.' },
  cream: { name: 'Crème fraîche', prep: 'Pasteurised, one small spoonful.' },
  parsley: { name: 'Parsley', prep: 'Finely chopped and cooked in the purée.' },
  basil: { name: 'Basil', prep: 'A few leaves, puréed.' },
  chives: { name: 'Chives', prep: 'Finely snipped.' },
  mint: { name: 'Mint', prep: 'One leaf puréed with a fruit.' },
  cumin: { name: 'Cumin', prep: 'A pinch, to add flavour without salt.' },
  cinnamon: { name: 'Cinnamon', prep: 'A pinch in a compote.' },
  vanilla: { name: 'Vanilla', prep: 'A pod infused in the milk.' },
  turmeric: { name: 'Turmeric', prep: 'A pinch in a purée.' },
  thyme: { name: 'Thyme', prep: 'Infused during cooking, then removed.' },
  garlic: { name: 'Garlic', prep: 'One small clove cooked with the vegetables.' },
  onion: { name: 'Onion', prep: 'Well cooked, melted in with the vegetables.' },
  peanut: { name: 'Peanut', prep: 'As a powder or a smooth purée diluted in a preparation, with no added salt.', care: 'Never whole or in pieces before age 5 (small, hard, round food).' },
  almond: { name: 'Almond', prep: 'As a powder, half a teaspoon in a purée or a dairy product (Santé publique France).', care: 'Never whole almonds before age 5.' },
  hazelnut: { name: 'Hazelnut', prep: 'As a powder, half a teaspoon.', care: 'Never whole hazelnuts before age 5.' },
  walnut: { name: 'Walnut', prep: 'As a fine powder.', care: 'Never whole or in pieces before age 5.' },
  sesame: { name: 'Sesame', prep: 'As a paste (tahini) diluted in a preparation.' },
  shrimp: { name: 'Prawn', prep: 'Cooked, finely chopped or puréed.' },
  mussel: { name: 'Mussels', prep: 'Well cooked, finely chopped.' },
  soy: { name: 'Soya', prep: 'Tofu, soya drink and soya desserts: Santé publique France advises against soya milk and soya-based products before age 3.' },
  mustard: { name: 'Mustard', prep: 'A touch in a sauce, later.' },
  honey: { name: 'Honey', prep: 'Never before 1 year (risk of infant botulism, ANSES). After that, like any sweet product, as late as possible.' },
  cocoa: { name: 'Cocoa', prep: 'Unsweetened, a pinch later; sweetened products as late as possible.' },
  plant_drink: { name: 'Plant-based drink', prep: 'Does not replace milk and is not suitable before 1 year (Santé publique France).' },
  cow_milk: { name: 'Cow’s milk', prep: 'In a small quantity in a preparation (purée, dairy product); breast milk or infant formula remains their main milk drink. Ask the professional who follows them for advice.' },
  olive: { name: 'Olives', prep: 'Stoned and finely chopped, later (they are salty).', care: 'Whole: cut into quarters until age 5.' },
};

const FOODS_EN: FoodDef[] = FOODS_FR.map((f) => {
  const t = FOOD_TEXT_EN[f.key];
  if (!t) return f;
  const { care: _c, ...rest } = f;
  return { ...rest, name: t.name, prep: t.prep, ...(t.care ? { care: t.care } : f.care ? { care: f.care } : {}) };
});

export const FOODS: FoodDef[] = localized(FOODS_FR, FOODS_EN);

const mapByKey = (list: FoodDef[]): Record<string, FoodDef> => Object.fromEntries(list.map((f) => [f.key, f]));
export const FOOD_BY_KEY: Record<string, FoodDef> = localized(mapByKey(FOODS_FR), mapByKey(FOODS_EN));

/** Nom comparable : minuscules, sans accents, espaces réduits, pluriel simple retiré. */
export function foodNameKey(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/œ/g, 'oe').replace(/\s+/g, ' ').trim().replace(/s$/, '');
}
const FOOD_KEY_BY_NAME = new Map<string, string>(
  [...FOODS_FR, ...FOODS_EN].map((f) => [foodNameKey(f.name), f.key] as [string, string]),
);
/**
 * F-02 (QA 02/11/2026) : aliment saisi librement (repas) → clé du catalogue « Ses découvertes »,
 * en français ou en anglais. null si l'aliment n'est pas au catalogue.
 */
export function matchFoodKey(name: string | null | undefined): string | null {
  if (!name) return null;
  return FOOD_KEY_BY_NAME.get(foodNameKey(name)) ?? null;
}
